/* ============ notificações do navegador ============
   Avisa fora da aba: "achei o Pokémon que você estava caçando", "o ovo chocou". Sem servidor e sem push —
   são notificações LOCAIS, disparadas pelo próprio jogo enquanto ele está aberto (inclusive numa aba de fundo).
   Push de verdade (chegar com o jogo fechado) precisaria de servidor com chave VAPID e assinatura por aparelho;
   não existe aqui e não é o que foi pedido.

   Duas regras que vieram de erro alheio e valem sempre:
   - **Permissão só se pede num gesto** (clique). Navegador moderno ignora — ou pune — pedido no carregamento.
   - **O toast é o caminho principal, a notificação é o extra.** Quem está olhando a tela tem de ver o aviso de
     qualquer jeito: sem permissão, sem suporte (iOS fora da tela de início), aba em primeiro plano. Por isso
     `notificar()` sempre avisa dentro do jogo e só DEPOIS tenta o sistema operacional.

   No celular a notificação tem de sair pelo service worker (`reg.showNotification`) — `new Notification()`
   estoura "Illegal constructor" no Android. E `navigator.serviceWorker.ready` fica pendente PRA SEMPRE quando
   não há service worker controlando a página (recarga forçada, `file://`), então o `controller` é conferido
   antes: esperar por ele seria travar a função que deveria só avisar. */
import { store } from './util.js';
import { toast } from './ui.js';

export const NOTIF_KEY = 'pokerpg-notificacoes';
export const temSuporte = () => typeof Notification !== 'undefined';
export const permissao = () => temSuporte() ? Notification.permission : 'sem-suporte';
// ligada = o navegador deixa E o jogador não desligou em ⚙ Ajustes (o padrão é seguir a permissão concedida)
export const notificacoesLigadas = () => permissao() === 'granted' && store.get(NOTIF_KEY) !== false;
export const desligarNotificacoes = () => store.set(NOTIF_KEY, false);

/* Chamar SEMPRE de dentro de um clique. Devolve a permissão final ('granted' | 'denied' | 'default' |
   'sem-suporte'); quem chama decide o que dizer. Recusou uma vez? O navegador não pergunta de novo — só nas
   configurações do site —, então insistir aqui não adianta nada. */
export async function pedirPermissao() {
  if (!temSuporte()) return 'sem-suporte';
  if (Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch (e) { console.error('notificações', e); }
  }
  store.set(NOTIF_KEY, Notification.permission === 'granted');
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
