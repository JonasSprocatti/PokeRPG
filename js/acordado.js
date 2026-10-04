/* ============ manter a aba viva em segundo plano ============
   Quem usa: o 🤖 auto-explorar (auto.js). O problema: ao sair pro WhatsApp com o jogo aberto atrás, o Chrome
   do Android aplica *intensive throttling* depois de 5 minutos — os timers passam a acordar UMA VEZ POR MINUTO,
   e um laço feito de `setTimeout` vira uma exploração a cada minuto, ou seja, para na prática.

   A isenção documentada dessa regra é a aba estar TOCANDO ÁUDIO. Então enquanto o laço roda a gente mantém um
   tom inaudível ligado: 30 Hz (abaixo do que alto-falante de celular reproduz) com ganho 0,003. Não é bonito,
   mas é a única porta que o navegador deixa aberta — e ela é explícita, não um furo: a aba aparece com o ícone
   de som, que é justamente o aviso honesto de "isto aqui está rodando em segundo plano".

   O Wake Lock entra junto, mas resolve OUTRA coisa: ele só vale com a página visível (o navegador solta sozinho
   ao esconder), então serve pra tela não apagar enquanto você ASSISTE à caçada. Por isso ele é repedido todo
   `visibilitychange` — sem isso, voltar pro jogo deixaria a tela apagando no meio.

   O que isto NÃO resolve: iPhone. O Safari suspende o JS da aba assim que você troca de app, com ou sem áudio.
   Lá o laço congela e retoma de onde parou quando você volta.

   Tudo defensivo de propósito: AudioContext, wakeLock e `navigator.locks` não existem em todo navegador, e uma
   exceção aqui não pode derrubar a caçada — o pior caso é o laço rodar devagar, não o jogo quebrar. */

let ctx = null, osc = null, lock = null, ligado = false;

export const estaAcordado = () => ligado;

async function pedirWakeLock() {
  if (!ligado || lock || document.visibilityState !== 'visible') return;
  try { lock = await navigator.wakeLock?.request('screen') ?? null; }
  catch (e) { lock = null; }   // bateria baixa, aba sem foco, navegador sem suporte: segue sem
}
// o navegador solta o lock ao esconder a página; voltando, pede de novo (senão a tela apaga assistindo à caçada)
const aoTrocarVisibilidade = () => { lock = null; pedirWakeLock(); };

export async function manterAcordado() {
  if (ligado) return true;
  ligado = true;
  document.addEventListener('visibilitychange', aoTrocarVisibilidade);
  pedirWakeLock();
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    await ctx.resume();                       // precisa estar dentro de um clique; quem chama garante isso
    osc = ctx.createOscillator(); osc.frequency.value = 30;
    const g = ctx.createGain(); g.gain.value = 0.003;   // inaudível num alto-falante de celular, mas não é silêncio
    osc.connect(g).connect(ctx.destination); osc.start();
    return true;
  } catch (e) { console.error('manter acordado', e); return false; }
}

export async function soltarAcordado() {
  ligado = false;
  document.removeEventListener('visibilitychange', aoTrocarVisibilidade);
  try { await lock?.release(); } catch (e) { /* já solto */ }
  lock = null;
  try { osc?.stop(); await ctx?.close(); } catch (e) { /* já fechado */ }
  osc = null; ctx = null;
}
