/* ============ 🤖 Auto-explorar (só conta de manutenção) ============
   Explora sozinho até cumprir o OBJETIVO, lutando o que vier pela frente e contando quantos de cada
   caiu — a porcentagem ao vivo ao lado da taxa que a rota promete (`mapas.taxaNaRota`) é o jeito mais rápido de
   conferir se o sorteio de encontro está honesto. Pedido do usuário, ADMIN-ONLY pelo mesmo critério do 🗺 Editor
   de rotas e do 🧪 painel de testes (`nuvem.ehAdmin`): é uma ferramenta de diagnóstico, não conteúdo de jogo —
   e ela derruba centenas de Pokémon, o que mexeria no progresso permanente de quem joga de verdade.

   Três objetivos, escolhidos na hora de ligar (pedido do usuário):
   - **uma espécie** — para na hora que ela aparecer, sem atacar;
   - **um nível do seu Pokémon** — segue moendo até chegar lá (é o modo "só quero subir de nível");
   - **nenhum** — fica caçando pra sempre (até o teto) e só para em shiny. É o modo "caça shiny" de verdade.
   Shiny para o laço nos TRÊS: é a única coisa irreversível que pode passar na sua frente.

   Decisões que não são óbvias:
   - **O laço só chama o que a UI já chama** (`explore`, `turn`, `curarNoCentro`). Nada de caminho paralelo: se
     um golpe, um item ou uma missão se comportam diferente aqui, o bug não existiria pra quem joga.
   - **Para ANTES de atacar o alvo.** Quem caça quer decidir o que fazer com ele (petisco, bola, olhar) — matar
     o Pokémon procurado seria o oposto do pedido. **Um shiny para do mesmo jeito**, seja ele quem for: 1 em
     4096 não pode ser atropelado por um laço automático.
   - **A escolha do golpe é a mesma IA do chefe** (`regras.escolhaIA` no degrau `ESPERTEZA.chefe`), sobre
     `golpesPermitidos`. Reimplementar "qual é o melhor golpe" aqui seria uma segunda regra pra manter.
   - **Sobreviver importa mais que a estatística**: abaixo de `FUGIR_ABAIXO` do HP ele tenta fugir, e entre
     batalhas passa no Centro. No Roguelike um desmaio encerra a run — um laço automático que perde a jornada de
     quem o ligou é um defeito, não um risco aceitável. Se mesmo assim o HP zerar, `motivoDeParar` corta o laço.
   - **Teto de explorações**: laço sem fim é bug. Chegou no teto, para e conta por quê.
   - **Segue rodando com o jogo em segundo plano** (`acordado.js`): sair pro WhatsApp não pode parar a caçada —
     foi pedido explícito. Em segundo plano o navegador limita cada `setTimeout` a ~1 por segundo, então a
     narração (`ui.say`) para de esperar com a aba escondida: ninguém está lendo, e 420 ms de pausa por linha
     viravam 1 segundo cada. */
import { G, save, zone, rotulo } from './estado.js';
import { render } from './render.js';
import { log, ask, semAnimacao } from './ui.js';
import { explore, curarNoCentro } from './mundo.js';
import { turn, melhorGolpe } from './batalha.js';
import { motivoDeParar, precisaReporPP, objetivoAuto } from './regras.js';
import { ehAdmin } from './nuvem.js';
import { notificar, pedirPermissao } from './notificacoes.js';
import { manterAcordado, soltarAcordado } from './acordado.js';
import { esc, fmt, sleep } from './util.js';

export const TETO_EXPLORACOES = 500;   // ~meia hora de laço; depois disso é mais honesto parar e perguntar de novo
export const FUGIR_ABAIXO = 0.25;      // fração do HP máximo em que a fuga vale mais que o próximo golpe
/* Entre batalhas: passa no Centro antes de voltar pro mato. Era 0,6 e virou 0,45 (pedido do usuário: "só quando
   for necessário") — com 60% de HP sobrando a próxima batalha é tranquila, e cada passada cobra a cura inteira
   da equipe. O piso é a fuga: abaixo de `FUGIR_ABAIXO` o laço já desiste da luta, então curar perto disso é o
   que mantém a run viva sem torrar dinheiro. */
export const CURAR_ABAIXO = 0.45;
/* PP é motivo de Centro tanto quanto HP (pedido do usuário): o laço tem de repor ANTES do último golpe acabar.
   Quem descobre que ficou sem PP já no Struggle bate fraco, se machuca a cada golpe e perde a run por teimosia.
   Quem decide é `regras.precisaReporPP`, e vale pros aliados também — o Centro cura a equipe inteira de uma vez. */
const semGolpes = () => precisaReporPP(G.S.player) || (G.S.aliados || []).some(precisaReporPP);

const especieDe = m => m?.data?.speciesName || m?.name || '';
// só encontro SELVAGEM conta como "achei": o Alfa, o treinador e o lendário da rota não são o que se está caçando
const selvagem = B => !!B && !B.trainer && !B.chefe && !B.lendarios && !B.evento;

/* Degraus de nível oferecidos: a partir do nível de agora, nunca passando de 100. Botão, não campo de texto —
   o `ask` só sabe devolver o valor de um botão, e cinco degraus cobrem o que se quer na prática. */
const degrausDeNivel = n => [n + 1, n + 5, n + 10, n + 25, 100].filter((v, i, a) => v > n && v <= 100 && a.indexOf(v) === i);

/* Abre a escolha do objetivo: nível, shiny ou uma espécie do pool INTEIRO da rota, inclusive quem você nunca
   encontrou (é admin — a 🎯 Caça Shiny, que é a versão do jogo disso, exige revelar a rota toda antes). */
export async function escolherAlvoAuto() {
  if (!ehAdmin() || G.busy || G.mode !== 'explore' || !G.S) return;
  const z = zone();
  const opcoes = z.pool.map(p => ({ label: `${esc(fmt(p.f || p.n))}${p.m ? ' ✦' : ''}${p.l ? ' ★' : ''}`, value: p.n, ghost: true }));
  const escolha = await ask(`<b>🤖 Explorar automaticamente</b><p class="small muted">O que o laço está procurando em ${esc(z.name)}? Ele explora e luta sozinho até lá — e para na hora, sem atacar. Shiny para a caçada sempre.</p>`,
    [...(G.S.player.level < 100 ? [{ label: '📈 Subir até um nível…', value: '#nivel' }] : []),
      { label: '✨ Só caçar shiny', value: '#shiny', ghost: true },
      ...opcoes, { label: 'Cancelar', value: null }]);
  if (!escolha) return;
  if (escolha === '#shiny') return iniciarAuto(null);
  if (escolha !== '#nivel') return iniciarAuto(escolha);
  const atual = G.S.player.level;
  const nivel = await ask(`<b>📈 Até que nível?</b><p class="small muted">${esc(rotulo(G.S.player))} está no <b>Nv. ${atual}</b>. O laço explora e luta até chegar no nível escolhido — e para também se aparecer um shiny.</p>`,
    [...degrausDeNivel(atual).map(v => ({ label: `Nv. ${v}`, value: v, ghost: true })), { label: 'Cancelar', value: null }]);
  if (nivel) await iniciarAuto(null, nivel);
}

export async function iniciarAuto(alvo, nivelAlvo = 0) {
  if (!ehAdmin() || G.auto?.ativo || G.busy || G.mode !== 'explore') return;
  // ainda dentro do clique: é a única hora em que o navegador aceita perguntar da notificação e ligar o áudio
  await pedirPermissao();
  await manterAcordado();
  const z = zone();
  G.auto = { ativo: true, alvo, nivelAlvo, rota: z.id, rotaNome: z.name, exploracoes: 0, batalhas: 0, abates: {}, motivo: null, inicio: Date.now() };
  log(`🤖 Auto-explorar ligado em ${esc(z.name)}: procurando <b>${esc(objetivoAuto(G.auto))}</b>.`, 'muted');
  render();
  try { await laco(); }
  catch (e) { console.error('auto-explorar', e); G.auto.motivo = 'erro'; log(`🤖 Auto-explorar parou com um erro: ${esc(e.message || e)}`, 'hit'); }
  finally { await encerrar(); }
}

export function pararAuto(motivo = 'parado') {
  if (!G.auto?.ativo) return;
  G.auto.ativo = false; G.auto.motivo ||= motivo;
}
export function limparAuto() { if (!G.auto?.ativo) G.auto = null; }

async function laco() {
  const a = G.auto;
  let naLuta = null;   // o selvagem desta batalha, guardado pra contar o abate quando ela terminar
  while (a.ativo) {
    const P = G.S?.player;
    /* O nível só vale como parada ENTRE batalhas (`G.B ? 0 : …`): subir de nível no meio da luta é comum, e
       parar ali deixaria a batalha pendurada esperando um clique — o laço termina o que começou. */
    const motivo = motivoDeParar({ modo: G.mode, hp: P?.hp ?? 0, nivel: P?.level ?? 0, nivelAlvo: G.B ? 0 : a.nivelAlvo,
      semPP: !!a.semPP, exploracoes: a.exploracoes, teto: TETO_EXPLORACOES });
    if (motivo) { a.motivo = motivo; break; }
    if (G.B) {
      const E = G.B.enemy;
      /* Shiny para a caçada mesmo não sendo quem você procurava (pedido do usuário): 1 em 4096 é raro demais
         pra um laço automático atropelar — e aqui vale QUALQUER inimigo brilhante, inclusive o de treinador e o
         Alfa, porque a chance é a mesma e perder um desses é igualmente irreversível. */
      if (E?.shiny) { a.motivo = 'shiny'; a.shiny = especieDe(E); break; }
      if (a.alvo && selvagem(G.B) && especieDe(E) === a.alvo) { a.motivo = 'achou'; break; }
      if (!naLuta && selvagem(G.B)) { naLuta = E; a.batalhas++; }
      await atacar(P, E);
    } else {
      // a batalha anterior acabou: só conta quem ficou no chão (fuga, captura e amizade não são abate)
      if (naLuta) { if (naLuta.hp <= 0) a.abates[especieDe(naLuta)] = (a.abates[especieDe(naLuta)] || 0) + 1; naLuta = null; }
      if (P.hp / P.stats.hp < CURAR_ABAIXO || semGolpes()) await curarNoCentro();
      /* Continua sem PP depois da passada no Centro = não deu pra pagar. Volta ao topo sem explorar: quem
         decide parar é `motivoDeParar`, num lugar só. */
      a.semPP = semGolpes();
      if (a.semPP) continue;
      a.exploracoes++;
      await explore();
    }
    render();
    await sleep(semAnimacao() ? 30 : 150);
  }
}

async function atacar(P, E) {
  // fugir enquanto dá: com o HP no fim, o próximo golpe do inimigo custa a jornada inteira no Roguelike
  if (P.hp / P.stats.hp < FUGIR_ABAIXO) { await turn({ type: 'run' }); if (!G.B) return; }
  // mesma cabeça do chefe (batalha.melhorGolpe). Sem golpe permitido ele devolve o Struggle, que não está em
  // `P.moves` — e o índice -1 é exatamente como a tela de golpes manda um Struggle.
  const g = melhorGolpe(P, E);
  await turn({ type: 'move', idx: P.moves.indexOf(g) });
}

const TEXTO = {
  shiny: a => [`✨ Um ${fmt(a.shiny)} SHINY!`, `Em ${a.rotaNome}, na ${a.exploracoes}ª exploração. A caçada parou aqui — ele está na tela, esperando você.`],
  achou: a => [`🎯 Achei ${fmt(a.alvo)}!`, `Em ${a.rotaNome}, depois de ${a.exploracoes} explorações e ${a.batalhas} batalhas. Ele está esperando na tela.`],
  nivel: a => [`📈 Nível ${a.nivelAlvo}!`, `Chegou lá em ${a.rotaNome}, depois de ${a.exploracoes} explorações e ${a.batalhas} batalhas.`],
  desmaiou: a => ['🤖 Auto-explorar parou', `A caçada por ${objetivoAuto(a)} acabou: seu Pokémon caiu depois de ${a.exploracoes} explorações.`],
  semPP: a => ['🤖 Auto-explorar parou', `Os golpes acabaram e não deu pra pagar o Centro Pokémon depois de ${a.exploracoes} explorações.`],
  teto: a => ['🤖 Auto-explorar parou', `${TETO_EXPLORACOES} explorações sem achar ${objetivoAuto(a)}. É só ligar de novo.`],
  saiu: a => ['🤖 Auto-explorar parou', `A jornada saiu da rota depois de ${a.exploracoes} explorações.`],
  erro: a => ['🤖 Auto-explorar parou', `Deu erro depois de ${a.exploracoes} explorações — o registro da partida tem o motivo.`],
  parado: a => ['🤖 Auto-explorar parado', `Por você, depois de ${a.exploracoes} explorações.`]
};

async function encerrar() {
  await soltarAcordado();   // some o ícone de som da aba e devolve a tela ao comportamento normal
  const a = G.auto; if (!a) return;
  a.ativo = false; a.motivo ||= 'parado';
  const [titulo, corpo] = (TEXTO[a.motivo] || TEXTO.parado)(a);
  log(`${titulo} ${corpo}`, a.motivo === 'achou' ? 'good' : 'muted');
  await notificar(titulo, { corpo, tag: 'auto-explorar' });
  render(); save();
}
