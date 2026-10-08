/* ============ notificações do navegador ============
   Duas coisas moram aqui, e elas são independentes:

   1. **Notificação LOCAL** (`notificar`): o jogo está aberto, talvez numa aba de fundo, e avisa — "achei o Pokémon
      que você estava caçando", "o ovo chocou". Não precisa de login, nem de servidor, nem de rede.
   2. **Push** (`inscreverPush` + `agendarLembretes`): o jogo está FECHADO e o lembrete chega de qualquer jeito —
      "o seu Pokémon está te esperando", "falta pouco pra badge", "o chefe da semana trocou". Precisa de conta
      (a inscrição é por aparelho, guardada no Supabase) e da chave VAPID em `config.js`; sem uma das duas, as
      funções viram no-op e o jogo segue igual, só com o item 1.

   O TEXTO do lembrete é escrito aqui, na última sessão, por `lembretes.js` — o servidor só entrega. É de propósito:
   ovo, badge e chefe são regras do jogo, e reimplementá-las em Deno seria duas verdades.

   Duas regras que vieram de erro alheio e valem sempre:
   - **Permissão só se pede num gesto** (clique). Navegador moderno ignora — ou pune — pedido no carregamento.
   - **O toast é o caminho principal, a notificação é o extra.** Quem está olhando a tela tem de ver o aviso de
     qualquer jeito: sem permissão, sem suporte (iOS fora da tela de início), aba em primeiro plano. Por isso
     `notificar()` sempre avisa dentro do jogo e só DEPOIS tenta o sistema operacional.

   No celular a notificação tem de sair pelo service worker (`reg.showNotification`) — `new Notification()`
   estoura "Illegal constructor" no Android. E `navigator.serviceWorker.ready` fica pendente PRA SEMPRE quando
   não há service worker controlando a página (recarga forçada, `file://`), então o `controller` é conferido
   antes: esperar por ele seria travar a função que deveria só avisar. */
import { fmt, store } from './util.js';
import { toast } from './ui.js';
import { VAPID_PUBLICA } from './config.js';
import { usuario, salvarInscricaoPush, salvarLembretes } from './nuvem.js';
import { G, zone } from './estado.js';
import { badgesDaCarreira } from './carreira.js';
import { agoraDoEvento, indiceDaSemana, eventoDoIndice, fimDaSemana, jaComecou } from './evento.js';
import { lembretesDe } from './lembretes.js';

export const NOTIF_KEY = 'pokerpg-notificacoes';
export const temSuporte = () => typeof Notification !== 'undefined';
export const permissao = () => temSuporte() ? Notification.permission : 'sem-suporte';
// ligada = o navegador deixa E o jogador não desligou em ⚙ Ajustes (o padrão é seguir a permissão concedida)
export const notificacoesLigadas = () => permissao() === 'granted' && store.get(NOTIF_KEY) !== false;
// desligar tem de desinscrever de verdade: só gravar a preferência aqui deixaria o servidor mandando push pra
// quem desmarcou a caixinha (o envio é por aparelho inscrito, não pela chave do localStorage dele)
export const desligarNotificacoes = () => { store.set(NOTIF_KEY, false); cancelarPush().catch(e => console.warn('push', e)); };

/* Chamar SEMPRE de dentro de um clique. Devolve a permissão final ('granted' | 'denied' | 'default' |
   'sem-suporte'); quem chama decide o que dizer. Recusou uma vez? O navegador não pergunta de novo — só nas
   configurações do site —, então insistir aqui não adianta nada. */
export async function pedirPermissao() {
  if (!temSuporte()) return 'sem-suporte';
  if (Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch (e) { console.error('notificações', e); }
  }
  store.set(NOTIF_KEY, Notification.permission === 'granted');
  // concedeu → já inscreve e agenda, sem `await`: é rede, e travar o clique numa busca que pode falhar deixaria o
  // botão do ⚙ Ajustes parecendo quebrado. Sem conta ou sem VAPID isto é no-op e as notificações locais seguem.
  if (Notification.permission === 'granted') agendarLembretes().catch(e => console.warn('lembretes', e));
  return Notification.permission;
}

/* `tag` junta: duas notificações com a mesma tag viram uma só, em vez de empilhar quinze avisos iguais.
   `aviso: false` só pra quem já mostrou o próprio toast e não quer dois. Devolve true se o SO recebeu. */
export async function notificar(titulo, { corpo = '', tag = 'pokerpg', aviso = true } = {}) {
  if (aviso) toast(`<b>${titulo}</b>${corpo ? `<br>${corpo}` : ''}`, 12000);
  if (!notificacoesLigadas()) return false;
  const opcoes = { body: corpo, tag, icon: './img/icone-192.png', badge: './img/favicon-32.png' };
  try {
    const reg = navigator.serviceWorker?.controller ? await navigator.serviceWorker.ready : null;
    if (reg?.showNotification) { await reg.showNotification(titulo, opcoes); return true; }
    new Notification(titulo, opcoes);
    return true;
  } catch (e) { console.error('notificação', e); return false; }
}

/* ============ push: o lembrete que chega com o jogo fechado ============ */

// sem chave VAPID em config.js, a parte de push inteira fica desligada (como os slots de anúncio e o Supabase)
export const pushConfigurado = () => !!VAPID_PUBLICA && !VAPID_PUBLICA.includes('SUA-CHAVE');
export const pushDisponivel = () => pushConfigurado() && !!usuario() && typeof PushManager !== 'undefined';

// a chave pública VAPID viaja em base64url e o `subscribe` quer bytes
function bytesDaChave(b64) {
  const s = (b64 + '='.repeat((4 - b64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

/* Inscreve ESTE aparelho (cada navegador tem o seu endpoint; a mesma conta em três aparelhos são três linhas).
   `navigator.serviceWorker.ready` fica pendente pra sempre sem service worker controlando a página, então o
   `controller` é conferido antes — mesma armadilha do `notificar()` ali em cima.
   Trocar a chave VAPID invalida as inscrições antigas: o envio vai responder 403/410 e a função apaga a linha. */
export async function inscreverPush() {
  if (!pushDisponivel() || !navigator.serviceWorker?.controller) return null;
  const reg = await navigator.serviceWorker.ready;
  if (!reg.pushManager) return null;
  const sub = await reg.pushManager.getSubscription()
    || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytesDaChave(VAPID_PUBLICA) });
  await salvarInscricaoPush(sub.toJSON());
  return sub;
}

export async function cancelarPush() {
  if (!navigator.serviceWorker?.controller) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager?.getSubscription();
  if (!sub) return;
  // a ordem importa: apagar a linha ANTES de desinscrever. Ao contrário, uma rede ruim deixaria o endereço morto
  // no banco e o jogador receberia erro silencioso de entrega pra sempre.
  await salvarInscricaoPush(sub.toJSON(), { apagar: true }).catch(e => console.warn('push', e));
  await sub.unsubscribe().catch(() => {});
}

/* O resumo da jornada aberta pro texto do lembrete. `zone()` depende dos mapas já montados e de um save válido;
   um erro aqui não pode derrubar o boot, então o pior caso é um lembrete mais genérico. */
function resumoDaJornada() {
  const S = G.S, p = S?.player;
  if (!p) return null;
  let rota = '';
  try { rota = zone()?.name || ''; } catch (e) { /* save em migração, mapa trocando: segue sem a rota */ }
  return { nome: p.nick || fmt(p.name), nivel: p.level || 1, rota, ovos: S.ovos || [] };
}

// o chefe que ASSUME na virada da semana (é o convite: "tem bicho novo"), com a hora que o calendário já define
function proximoChefe(agora = agoraDoEvento()) {
  if (!jaComecou(agora)) return null;
  const ev = eventoDoIndice(indiceDaSemana(agora) + 1);
  return ev ? { quando: fimDaSemana(agora), nome: ev.nome } : null;
}

/* Reescreve os lembretes deste jogador. Chamado a cada sessão (main.js, depois da nuvem de pé): o `quando` conta
   de AGORA, então quem está jogando todo dia nunca chega a receber nada — o lembrete só dispara pra quem parou. */
export async function agendarLembretes() {
  if (!notificacoesLigadas() || !pushDisponivel()) return false;
  try {
    if (!await inscreverPush()) return false;
    let badges = [];
    try { badges = badgesDaCarreira(); } catch (e) { console.warn('badges', e); }
    await salvarLembretes(lembretesDe({ save: resumoDaJornada(), badges, proximoChefe: proximoChefe() }));
    return true;
  } catch (e) { console.warn('lembretes', e); return false; }
}
