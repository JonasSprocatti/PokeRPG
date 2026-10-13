/* ============ ⚔ Saga — as AÇÕES do mundo ============
   Andar, esbarrar, conversar, abrir baú, começar luta. As REGRAS são de `saga-mundo.js` (puro); aqui é só o que
   precisa de `G`, de tela e de batalha. As ações chegam pelo `data-act` do `main.js` e pelas setas/WASD.
   Enquanto anda, NÃO chama `render()` (redesenharia ficha, mochila e aliados a cada casa): repinta só a grade, e
   o render inteiro sai no fim, se algo além de andar aconteceu. */
import { G, save, zone, rotasAtuais, rotulo, emCampo, centroPokemon } from './estado.js';
import { render, spriteFrente } from './render.js';
import { log, ask, toast, semAnimacao } from './ui.js';
import { startBattle, startBossBattle, startTrainerBattle } from './batalha.js';
import { curarNoCentro } from './mundo.js';
import { addItem } from './itens.js';
import { verificarMissoes } from './missoes.js';
import { cuidarDosOvos } from './amizade.js';
import { gastarRepelente, semSelvagens } from './mapas.js';
import { tocarMusica } from './som.js';
import { apiErr } from './api.js';
import { ITEMS } from './dados.js';
import { esc, sleep } from './util.js';
import { NPCS, MAPAS_SAGA } from './dados-saga.js';
import { mundoAtivo, modoComMundo, estadoSaga, mapaDe, passo, caminho, sorteiaEncontro, aplicar, comecarConversa, opcoesDe, bauAberto } from './saga-mundo.js';
import { pintarMapa, htmlDiario, htmlFala } from './saga-cena.js';

export const PASSOS_POR_EXPLORACAO = 6;   // a cada tantas casas conta um "passo" de ovo, de evolução por passos e de repelente
const MS_POR_CASA = 70;
const ROTA_ALEM_DO_PASSO = 3;             // a 4ª rota: a primeira que o capítulo 1 não cobre

const rotaDoMapa = () => rotasAtuais()[mapaDe(G.S).rota] || zone();
const pintar = () => pintarMapa(G.S, spriteFrente(G.S.player));
const travado = () => G.busy || G.mode !== 'explore' || G.panel !== 'main' || !mundoAtivo(G.S) || !!document.querySelector('.modal');
// A rota do mapa em que você está vira a rota da jornada: é ela que dá cenário, música, clima e Pokédex.
function sincronizarRota() {
  const z = rotaDoMapa();
  if (z && G.S.zone !== z.id) { G.S.zone = z.id; tocarMusica('explorar', zone()); }
}
const texto = t => t.replaceAll('{eu}', esc(rotulo(G.S.player))).replaceAll('{custo}', (() => {
  const { precisa, custo } = centroPokemon();
  return !precisa ? 'todos já estão bem' : custo ? `₽${custo}` : 'grátis';
})());

/* ---- efeitos: o que `saga-mundo.aplicar` devolve vira log, mochila, cura, loja ou viagem ---- */
async function executar(faz) {
  if (!faz) return;
  const { avisos, pedidos } = aplicar(G.S, faz);
  for (const p of pedidos) {
    if (p.bag) { addItem(...p.bag); avisos.push(`🎒 Você recebeu <b>${p.bag[1] > 1 ? `${p.bag[1]}× ` : ''}${esc(ITEMS[p.bag[0]]?.name || p.bag[0])}</b>.`); }
    if (p.cura) await descansar();
    if (p.loja) G.panel = 'shop';
    if (p.viajar) {
      estadoSaga(G.S).fora = true;
      const z = rotasAtuais()[ROTA_ALEM_DO_PASSO]; if (z) G.S.zone = z.id;
      avisos.push('🧭 Você atravessa o Passo do Norte. Daqui pra frente o caminho é seu.');
    }
  }
  for (const a of avisos) log(a, 'good');
  if (avisos.length) toast(avisos.join('<br>'), 7000);
}
async function descansar() {
  const { precisa, custo } = centroPokemon();
  if (!precisa) return log('Ninguém da comitiva precisa de descanso.', 'muted');
  if (G.S.money < custo) return log(`Dona Chansey suspira: faltam ₽${custo - G.S.money} pro descanso.`, 'hit');
  G.busy = false;                       // `curarNoCentro` recusa quando o jogo está ocupado — e quem ocupou fomos nós
  try { await curarNoCentro(); } finally { G.busy = true; }
}

/* ---- conversa: um nó por vez, na caixa de escolha de sempre (`ui.ask`) ---- */
async function conversar(id) {
  const npc = NPCS[id];
  let idNo = comecarConversa(G.S, id);
  while (idNo && mundoAtivo(G.S) && G.panel === 'main') {
    const no = npc.nos[idNo], fala = texto(no.fala), ops = opcoesDe(G.S, no);
    const escolhas = ops.length ? ops.map((o, i) => ({ label: texto(o.t), value: i }))
      : [{ label: no.vai ? 'Continuar ▸' : 'Encerrar', value: -1, ghost: !no.vai }];
    const i = await ask(htmlFala(npc, fala), escolhas);
    log(`<b>${npc.nome}:</b> ${fala}`, 'muted');
    await executar(no.faz);
    if (i >= 0) await executar(ops[i].faz);
    idNo = i >= 0 ? ops[i].vai : no.vai;
  }
}
async function lutar(comecar, flag) {
  const s = estadoSaga(G.S);
  if (flag) s.luta = { flag };
  try { await comecar(rotaDoMapa()); }
  catch (e) { delete s.luta; throw e; }
}
const INIMIGOS = {
  bando: { fala: 'Um bando ronda este trecho e não parece disposto a sair.', comecar: startBattle },
  treinador: { fala: 'Um caçador de recompensas mede você de cima a baixo. Ele está aqui a trabalho.', comecar: startTrainerBattle },
  alfa: { fala: 'Enrolado sobre o leito seco da nascente, o <b>Alfa</b> abre um olho. Ele não está só.', comecar: startBossBattle }
};
async function interagir(o) {
  if (o.npc) return conversar(o.npc);
  if (o.placa) return ask(o.placa, [{ label: 'Ok', value: 0, ghost: true }]);
  if (o.bau) {
    if (bauAberto(G.S, o.bau)) return log('Já está vazio.', 'muted');
    await ask(o.texto, [{ label: 'Pegar', value: 0 }]);
    return executar({ ...o.faz, flag: [].concat(o.faz?.flag || [], 'bau:' + o.bau) });
  }
  if (o.inimigo) {
    const tipo = INIMIGOS[o.inimigo.tipo];
    const vai = await ask(tipo.fala, [{ label: '⚔ Lutar', value: true }, { label: 'Recuar', value: false, ghost: true }]);
    if (vai) await lutar(tipo.comecar, 'venceu:' + o.inimigo.id);
  }
}
// A cada punhado de casas, o mesmo que um clique em "Explorar" faz pelos ovos, pela evolução por passos e pelo repelente.
async function contarPasso() {
  if (estadoSaga(G.S).passos % PASSOS_POR_EXPLORACAO) return;
  for (const M of emCampo()) M.passos = (M.passos || 0) + 1;
  try { await cuidarDosOvos(); } catch (e) { console.error('ovos', e); }
  if (gastarRepelente(G.S) === 'acabou') log('O efeito do repelente passou.', 'muted');
}
async function passos(dirs) {
  if (!dirs.length) return;
  G.busy = true;
  let aconteceu = false;          // algo além de andar? então a tela inteira precisa ser redesenhada
  try {
    for (const [i, d] of dirs.entries()) {
      const r = passo(G.S, d);
      if (r.tipo === 'parede') break;
      if (r.tipo === 'objeto') { aconteceu = true; await interagir(r.obj); break; }
      if (r.tipo === 'porta') { aconteceu = true; sincronizarRota(); log(`Você chega a <b>${MAPAS_SAGA[r.para].nome}</b>.`, 'muted'); break; }
      await contarPasso();
      if (r.gatilho) { aconteceu = true; await ask(r.gatilho.texto, [{ label: 'Continuar ▸', value: 0 }]); await executar(r.gatilho.faz); break; }
      if (r.mato && !semSelvagens(G.S, rotaDoMapa()) && sorteiaEncontro(G.S)) { aconteceu = true; await lutar(startBattle); break; }
      pintar();
      if (i < dirs.length - 1 && !semAnimacao()) await sleep(MS_POR_CASA);
    }
  } catch (e) {
    console.error(e); aconteceu = true;
    G.B = null; G.mode = 'explore'; G.panel = 'main';
    log(e.offline ? e.message : apiErr(e), 'hit');
  } finally {
    if (aconteceu && !G.B) try { await verificarMissoes(); } catch (e) { console.error(e); }
    G.busy = false;
    if (aconteceu) render(); else pintar();
    save();
  }
}
export async function andar(dir) { if (!travado()) await passos([dir]); }
export async function irPara(x, y) { if (!travado()) await passos(caminho(G.S, x, y)); }
export async function abrirDiario() {
  if (!travado()) await ask(htmlDiario(G.S), [{ label: 'Fechar', value: 0, ghost: true }]);
}
// Do outro lado do Passo do Norte o jogo é a lista de rotas; este é o caminho de volta pro mapa.
export function voltarAoVale() {
  if (G.busy || G.mode !== 'explore' || !modoComMundo(G.S) || !G.S.saga?.fora) return;
  delete G.S.saga.fora;
  sincronizarRota(); render(); save();
}
