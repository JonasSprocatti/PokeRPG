/* ============ ⚔ Saga — as AÇÕES do mundo ============
   Andar, esbarrar, conversar, abrir baú, começar luta. As REGRAS são de `saga-mundo.js` (puro); o desenho é de
   `saga-cena.js`. Este arquivo tem duas metades:

   1. o MOTOR (`criarMotor`), que não sabe se está no jogo de verdade ou no ▶ teste do editor de mundo. Mesmo
      desenho do `golpe.js`: o motor só PEDE — lutar, pôr na mochila, curar, abrir a loja — e quem atende é o
      `ctx`. No jogo, o ctx começa uma batalha de verdade; no teste do editor, pergunta "venceu ou perdeu?".
      É o que deixa testar um mapa novo sem jornada, sem rede e sem encostar em save nenhum.
   2. o ctx DO JOGO e as ações que o `main.js` despacha (`data-act` e setas/WASD).

   Enquanto anda, NÃO chama `render()`: troca só a posição (a transição do CSS faz o deslize). O render inteiro
   sai no fim, e só se algo além de andar aconteceu. */
import { G, save, zone, rotasAtuais, rotulo, emCampo, centroPokemon } from './estado.js';
import { render, modoJRPG } from './render.js';
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
import { NPCS, MAPAS_SAGA, CAPITULOS } from './dados-saga.js';
import { DIRS, mundoAtivo, modoComMundo, estadoSaga, mapaDe, passo, caminho, sorteiaEncontro, aplicar, comecarConversa, opcoesDe, bauAberto } from './saga-mundo.js';
import { MS_PASSO, posicionarMundo, casaDoToque, efeitoDeTela, virarNpc, textoSeguro, htmlDiario, htmlFala, definirDirecional } from './saga-cena.js';

export const PASSOS_POR_EXPLORACAO = 6;   // a cada tantas casas conta um "passo" de ovo, de evolução por passos e de repelente
const OPOSTO = { n: 's', s: 'n', l: 'o', o: 'l' };
const FALA_DO_INIMIGO = {
  bando: 'Um bando ronda este trecho e não parece disposto a sair.',
  treinador: 'Alguém mede você de cima a baixo, com uma bola na mão. Está aqui a trabalho.',
  alfa: 'O <b>Alfa</b> abre um olho. Ele não está só.'
};

/* ---- o motor ---- */
export function criarMotor(ctx) {
  const S = () => ctx.S();
  // texto de conteúdo: escapado inteiro (só <b>, <i>, <br> voltam) e com os marcadores trocados
  const texto = t => textoSeguro(t).replaceAll('{eu}', esc(ctx.nome())).replaceAll('{custo}', esc(ctx.custoDescanso()));

  // o que `saga-mundo.aplicar` devolve vira log, mochila, cura, loja ou viagem
  async function executar(faz) {
    if (!faz) return;
    const { avisos, pedidos } = aplicar(S(), faz);
    for (const p of pedidos) {
      if (p.bag) avisos.push(`🎒 Você recebeu <b>${p.bag[1] > 1 ? `${Number(p.bag[1])}× ` : ''}${esc(ctx.bag(p.bag[0], p.bag[1]))}</b>.`);
      if (p.cura) await ctx.descansar();
      if (p.loja) ctx.loja();
      if (p.viajar) avisos.push(ctx.viajar());
    }
    for (const a of avisos) ctx.log(a, 'good');
    if (avisos.length) ctx.aviso(avisos.join('<br>'));
  }
  // conversa: um nó por vez, na caixa de escolha de sempre
  async function conversar(id, dir) {
    const npc = NPCS[id];
    if (!npc) return;
    virarNpc(id, OPOSTO[dir]);
    let idNo = comecarConversa(S(), id);
    while (idNo && npc.nos[idNo] && ctx.conversando()) {
      const no = npc.nos[idNo], fala = texto(no.fala), ops = opcoesDe(S(), no);
      const escolhas = ops.length ? ops.map((o, i) => ({ label: texto(o.t), value: i }))
        : [{ label: no.vai ? 'Continuar ▸' : 'Encerrar', value: -1, ghost: !no.vai }];
      const i = await ctx.ask(htmlFala(npc.sprite === '@alfa' ? { ...npc, sprite: ctx.alfa() } : npc, fala), escolhas);
      ctx.log(`<b>${textoSeguro(npc.nome)}:</b> ${fala}`, 'muted');
      await executar(no.faz);
      if (i >= 0) await executar(ops[i].faz);
      idNo = i >= 0 ? ops[i].vai : no.vai;
    }
  }
  async function interagir(o, dir) {
    if (o.npc) return conversar(o.npc, dir);
    if (o.bau) {
      if (bauAberto(S(), o.bau)) return ctx.log('Já está vazio.', 'muted');
      const leva = o.faz?.item || o.faz?.bag || o.faz?.dinheiro;      // um "baú" também serve pra coisa que só se examina
      await ctx.ask(texto(o.texto || 'Tem alguma coisa aqui dentro.'), [{ label: leva ? 'Pegar' : 'Continuar ▸', value: 0 }]);
      return executar({ ...o.faz, flag: [].concat(o.faz?.flag || [], 'bau:' + o.bau) });
    }
    if (o.inimigo) {
      const vai = await ctx.ask(texto(o.inimigo.fala || FALA_DO_INIMIGO[o.inimigo.tipo] || FALA_DO_INIMIGO.bando),
        [{ label: '⚔ Lutar', value: true }, { label: 'Recuar', value: false, ghost: true }]);
      if (!vai) return;
      await ctx.efeito('clarao', 480);
      return ctx.lutar(o.inimigo.tipo, 'venceu:' + o.inimigo.id);
    }
    const lido = o.placa || o.texto;    // placa, ou enfeite que tem o que dizer
    if (lido) return ctx.ask(texto(lido), [{ label: 'Ok', value: 0, ghost: true }]);
  }
  /* `dirs` é qualquer coisa que se percorra: a lista de um caminho (toque no mapa) ou um gerador que continua
     dando a mesma direção enquanto a alavanca/tecla estiver segurada. Um laço só pros dois: é o que faz o andar
     contínuo ser UMA caminhada (um "ocupado", um salvar no fim) e não cem passos avulsos. */
  async function passos(dirs) {
    if (ctx.travado()) return;
    const fila = dirs[Symbol.iterator]();
    let prox = fila.next();
    if (prox.done) return;
    ctx.ocupar(true);
    let aconteceu = false, andou = false;   // algo além de andar? então a tela inteira precisa ser redesenhada
    try {
      for (; !prox.done; prox = fila.next()) {
        const d = prox.value, r = passo(S(), d);
        if (r.tipo === 'parede') { ctx.mover({}); break; }
        if (r.tipo === 'objeto') { ctx.mover({}); aconteceu = true; await interagir(r.obj, d); break; }
        if (r.tipo === 'porta') { aconteceu = true; await ctx.efeito('apagar', 200); ctx.chegou(r); break; }
        andou = true;
        ctx.mover({ andando: true });
        await ctx.esperarPasso();
        await ctx.aCadaPasso();
        if (r.gatilho) {
          aconteceu = true; ctx.mover({});
          await ctx.ask(texto(r.gatilho.texto || '…'), [{ label: 'Continuar ▸', value: 0 }]);
          await executar(r.gatilho.faz); break;
        }
        if (r.mato && await ctx.encontro()) { aconteceu = true; break; }
      }
    } catch (e) { aconteceu = true; ctx.erro(e); }
    finally {
      ctx.mover({});
      if (aconteceu) await ctx.depois();
      ctx.ocupar(false);
      if (aconteceu) ctx.redesenhar();
      if (aconteceu || andou) ctx.salvar();     // empurrar uma parede não é motivo pra gravar o save
    }
  }
  /* Segurar uma direção (alavanca do celular, tecla): anda sem parar até soltar, bater em algo ou acontecer
     alguma coisa. `segurar(null)` solta. Chamar de novo com a mesma direção não faz nada — é o que deixa a
     alavanca e a repetição do teclado mandarem a direção quantas vezes quiserem. */
  let direcao = null, correndo = false;
  function segurar(dir) {
    direcao = DIRS[dir] ? dir : null;
    if (!direcao || correndo) return;
    correndo = true;
    passos((function* () { while (direcao) yield direcao; })()).finally(() => { correndo = false; direcao = null; });
  }
  return {
    andar: dir => DIRS[dir] ? passos([dir]) : null,
    segurar,
    conversar: id => conversar(id, 's'),          // o ▶ Simular conversa do editor entra direto na fala
    irPara: (x, y) => passos(caminho(S(), x, y)),
    abrirDiario: () => ctx.travado() ? null : ctx.ask(htmlDiario(S()), [{ label: 'Fechar', value: 0, ghost: true }])
  };
}

/* ---- o jogo de verdade ---- */
const rotaDoMapa = () => rotasAtuais()[mapaDe(G.S).rota] || zone();
const COMECAR = { bando: startBattle, treinador: startTrainerBattle, alfa: startBossBattle };
// A rota do mapa em que você está vira a rota da jornada: é ela que dá cenário de batalha, música, clima e Pokédex.
function sincronizarRota() {
  const z = rotaDoMapa();
  if (z && G.S.zone !== z.id) { G.S.zone = z.id; tocarMusica('explorar', zone()); }
}
const JOGO = criarMotor({
  S: () => G.S,
  nome: () => rotulo(G.S.player),
  alfa: () => rotaDoMapa()?.chefe?.id,
  custoDescanso() { const { precisa, custo } = centroPokemon(); return !precisa ? 'todos já estão bem' : custo ? `₽${custo}` : 'grátis'; },
  travado: () => G.busy || G.mode !== 'explore' || G.panel !== 'main' || !!G.gaveta || !mundoAtivo(G.S) || !!document.querySelector('.modal'),
  conversando: () => mundoAtivo(G.S) && G.panel === 'main' && !G.B,
  ocupar(v) { G.busy = v; },
  mover: o => posicionarMundo(G.S, { ...o, seco: semAnimacao() }),
  esperarPasso: () => semAnimacao() ? null : sleep(MS_PASSO),
  async efeito(nome, ms) { if (!semAnimacao()) await sleep(efeitoDeTela(nome, ms)); },
  redesenhar: () => render(),
  salvar: () => save(),
  log, ask,
  aviso: html => toast(html, 7000),
  bag(k, n) { addItem(k, n); return ITEMS[k]?.name || k; },
  async descansar() {
    const { precisa, custo } = centroPokemon();
    if (!precisa) return log('Ninguém da comitiva precisa de descanso.', 'muted');
    if (G.S.money < custo) return log(`Faltam ₽${custo - G.S.money} pro descanso.`, 'hit');
    G.busy = false;                       // `curarNoCentro` recusa quando o jogo está ocupado — e quem ocupou fomos nós
    try { await curarNoCentro(); } finally { G.busy = true; }
  },
  loja() { G.gaveta = null; G.panel = 'shop'; },
  /* Seguir viagem pra além do último capítulo escrito: o resto da Gen ainda não tem mapa, então a jornada
     continua pela lista de rotas de sempre (com um botão de volta). */
  viajar() {
    estadoSaga(G.S).fora = true;
    const z = rotasAtuais()[Math.max(...CAPITULOS.map(c => c.rota)) + 1];
    if (z) G.S.zone = z.id;
    return '🧭 Você segue viagem. Daqui pra frente o caminho ainda não tem mapa: é rota e bicho.';
  },
  async lutar(tipo, flag) {
    const s = estadoSaga(G.S);
    if (flag) s.luta = { flag };
    try { await (COMECAR[tipo] || startBattle)(rotaDoMapa()); }
    catch (e) { delete s.luta; throw e; }
  },
  async encontro() {
    if (semSelvagens(G.S, rotaDoMapa()) || !sorteiaEncontro(G.S)) return false;
    await this.efeito('clarao', 480);
    await this.lutar('bando', null);
    return true;
  },
  // A cada punhado de casas, o mesmo que um clique em "Explorar" faz pelos ovos, pela evolução por passos e pelo repelente.
  async aCadaPasso() {
    if (estadoSaga(G.S).passos % PASSOS_POR_EXPLORACAO) return;
    for (const M of emCampo()) M.passos = (M.passos || 0) + 1;
    try { await cuidarDosOvos(); } catch (e) { console.error('ovos', e); }
    if (gastarRepelente(G.S) === 'acabou') log('O efeito do repelente passou.', 'muted');
  },
  chegou(r) { sincronizarRota(); log(`Você chega a <b>${textoSeguro(MAPAS_SAGA[r.para]?.nome)}</b>.`, 'muted'); },
  async depois() { if (!G.B) try { await verificarMissoes(); } catch (e) { console.error(e); } },
  erro(e) {
    console.error(e);
    G.B = null; G.mode = 'explore'; G.panel = 'main';
    log(e.offline ? e.message : apiErr(e), 'hit');
  }
});

export const andar = dir => JOGO.andar(dir);
// Segurar uma direção (alavanca ou tecla) e soltar. `soltar(dir)` só solta se ainda for ESSA a direção — soltar a
// seta de cima depois de já ter apertado a da direita não pode parar a caminhada.
let segurada = null;
export function segurar(dir) { segurada = DIRS[dir] ? dir : null; JOGO.segurar(segurada); }
export function soltar(dir) { if (!dir || dir === segurada) segurar(null); }
definirDirecional(segurar);       // a alavanca da tela de jogo fala com este motor
export const irPara = (x, y) => JOGO.irPara(x, y);
export const abrirDiario = () => JOGO.abrirDiario();
// Toque/clique no mapa: anda até a casa (e, se ali há algo que bloqueia, o último passo é o esbarrão).
export function tocarNoMapa(e) { const c = casaDoToque(e); return c ? JOGO.irPara(c[0], c[1]) : null; }
// As gavetas da tela de jogo (ficha, comitiva, mochila, missões, registro): abrir, trocar ou fechar.
export function gaveta(v) {
  const naTelaCheia = (G.mode === 'explore' && mundoAtivo(G.S)) || (G.mode === 'battle' && !!G.B && modoJRPG(G.S));
  if (!naTelaCheia || G.busy) return;
  G.gaveta = v && G.gaveta !== v ? v : null;
  render();
}
// Depois do último capítulo escrito o jogo é a lista de rotas; este é o caminho de volta pro mapa.
export function voltarAoVale() {
  if (G.busy || G.mode !== 'explore' || !modoComMundo(G.S) || !G.S.saga?.fora) return;
  delete G.S.saga.fora;
  sincronizarRota(); render(); save();
}
