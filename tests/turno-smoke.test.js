/* 💥 UM TURNO DE BATALHA RODANDO DE VERDADE, no Node, sem dependência nenhuma.
   Nasceu de um bug em jogo (06/10/2026): o bloco de troca tática do treinador usava `T`, que só era declarado no
   `win()` e nunca no `turn()`. Resultado: QUALQUER golpe, em QUALQUER batalha, estourava em "T is not defined".

   Por que nada no CI pegou: `node --check` passa (identificador não declarado é JS válido, não erro de sintaxe),
   `tests/referencias.test.js` varre template literal e não statement, e todo o resto da suíte testa funções PURAS.
   `batalha.js` nunca era importado. É a mesma família do `SPR_SHINY` e do `comandar`: só aparece pra quem joga.

   Por que SEM jsdom: o projeto não tem dependências, de propósito — e descobriu-se que não precisa. `batalha.js`
   só não importava no Node por UMA linha (`matchMedia` no corpo do `ui.js`). Com um `document` de mentira de ~10
   linhas, o turno roda inteiro: motor do golpe, `render()`, narração, fim de rodada. Zero `npm install`.

   O que este teste é e o que não é: é um DETECTOR DE EXPLOSÃO no caminho mais quente do jogo (variável não
   declarada, função que não existe, campo lido de `undefined`). Não é teste de regra — as regras têm os testes
   puros deles, que são melhores nisso. Se este falhar, o jogo está quebrado pra todo mundo. */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

/* ---- o DOM de mentira (10 linhas, sem jsdom) ---- */
/* Proxy que responde qualquer coisa: toda leitura devolve outro elemento falso, toda escrita é aceita. Não
   simula o navegador — só impede o `render()` de estourar, que é tudo o que precisamos pra ver o turno correr. */
function ligarDomFalso() {
  const el = () => new Proxy({}, {
    get: (t, k) => k === 'innerHTML' || k === 'value' || k === 'textContent' || k === 'id' ? ''
      : k === 'classList' ? { add() {}, remove() {}, toggle() {}, contains: () => false }
      : k === 'dataset' ? {} : k === 'style' ? {} : k === 'children' ? [] : k === 'parentNode' ? null
      : typeof k === 'symbol' ? undefined : (() => el()),
    set: () => true
  });
  globalThis.matchMedia = () => ({ matches: true, addEventListener() {}, addListener() {} });   // `matches: true` = sem animação: o turno não dorme
  globalThis.document = { querySelector: () => el(), querySelectorAll: () => [], createElement: () => el(), getElementById: () => el(), body: el(), documentElement: el(), addEventListener() {} };
  globalThis.window = globalThis;
  globalThis.requestAnimationFrame = f => f();
  globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 };
}

let batalha, G, freshVol, STATS;
before(async () => {
  ligarDomFalso();
  batalha = await import('../js/batalha.js');
  ({ G } = await import('../js/estado.js'));
  ({ freshVol } = await import('../js/regras.js'));
  ({ STATS } = await import('../js/dados.js'));
});

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, meta: {}, stats: [], desc: 'Bate.', ...o });
const zero = () => Object.fromEntries(STATS.map(s => [s, 0]));
const mon = (o = {}) => ({
  id: 19, name: 'rattata', nick: null, level: 10, ability: 'none', nature: 'hardy', shiny: false, genero: 'm',
  data: { types: ['normal'], base: { hp: 30, attack: 56, defense: 35, 'special-attack': 25, 'special-defense': 35, speed: 72 }, effort: {}, sprite: '', back: '', art: '', speciesName: 'rattata', growth: 'medium-fast', abilities: [], learnset: { list: [], extras: [] } },
  stats: { hp: 40, attack: 30, defense: 25, 'special-attack': 20, 'special-defense': 25, speed: 35 },
  hp: 40, exp: 0, expNext: 100, moves: [golpe()], evs: zero(), ivs: zero(), status: null, sleep: 0, item: null,
  amizade: 0, vol: freshVol(), ...o
});
const saveFalso = () => ({
  player: mon(), aliados: [], esconderijo: [], bag: {}, money: 500, missoes: {}, registro: {}, chefes: {},
  zone: 'rota1', gen: 1, dificuldade: 'easy', rapidos: [], wins: 0, log: [], id: 'teste',
  meta: { growth: 'medium-fast', evo: null }, ovos: [], lojaGratis: false
});
// `enemy` é derivado do foco, como no jogo (B.inimigos[B.foco])
const batalhaFalsa = (inimigos, extra = {}) => ({
  inimigos, foco: 0, turn: 1, runs: 0, campo: { lados: {} }, planos: {}, caidos: new Set(),
  get enemy() { return this.inimigos[this.foco]; }, ...extra
});

async function rodar(action, { inimigos = [mon({ name: 'pidgey', id: 16 })], extra = {} } = {}) {
  G.S = saveFalso(); G.mode = 'battle'; G.busy = false; G.panel = null; G.abertos = new Set();
  G.B = batalhaFalsa(inimigos, extra);
  await batalha.turn(action);
  return G.B;
}

test('golpe num selvagem: o turno roda inteiro sem estourar', async () => {
  // é ESTE caso que falhava com "T is not defined": o bloco de troca do treinador roda antes da fila de ações
  await rodar({ type: 'move', idx: 0 });
});

test('golpe contra TREINADOR: o caminho da troca tática roda', async () => {
  const equipe = [mon({ name: 'pidgey', id: 16 }), mon({ name: 'ekans', id: 23, data: { ...mon().data, types: ['poison'] } })];
  const B = await rodar({ type: 'move', idx: 0 }, {
    inimigos: [equipe[0]],
    extra: { trainer: { nome: 'Treinador Teste', equipe, atual: 0, classe: 'jovem', bola: 'poke-ball', bolas: 3 } }
  });
  // o contador existe ou não existe, mas o turno não pode explodir — e se trocou, foi no máximo uma vez
  assert.ok((B.trocasTreinador || 0) <= 1);
});

test('Struggle (idx -1), fuga, passar e Recuar sem aliado: nenhum caminho de ação estoura', async () => {
  await rodar({ type: 'move', idx: -1 });
  await rodar({ type: 'run' });
  await rodar({ type: 'passar' });
  // sem aliado em pé o Recuar avisa e NÃO gasta o turno (não pode virar exceção)
  const B = await rodar({ type: 'recuar' });
  assert.equal(B.turn, 1, 'recuar sem quem cubra não gasta a rodada');
});

test('🔄 Recuar COM aliado GASTA a rodada; sem aliado, não', async () => {
  /* O observável é a RODADA, não o `vol.retirado`: quem recua volta no fim da própria rodada
     (`voltarDoRevezamento`, `vol.volta = 1`), então ao fim do `turn()` ele já está de volta em campo — é assim
     que o revezamento funciona desde o U-turn. O que distingue os dois casos é o turno ter avançado. */
  G.S = saveFalso(); G.mode = 'battle'; G.busy = false; G.panel = null; G.abertos = new Set();
  G.S.aliados = [mon({ name: 'bulbasaur', id: 1 })];
  G.B = batalhaFalsa([mon({ name: 'pidgey', id: 16 })]);
  await batalha.turn({ type: 'recuar' });
  assert.equal(G.B.turn, 2, 'com aliado cobrindo, recuar é a sua ação da rodada');
  assert.ok(!G.S.player.vol.retirado, 'e ele volta no fim da própria rodada');
});

test('petisco pela barra de ⚡ item rápido vira `oferecer`, não `item` (relato #76)', async () => {
  G.S = saveFalso(); G.mode = 'battle'; G.busy = false; G.panel = null; G.abertos = new Set();
  G.S.bag = { honey: 1 };
  G.B = batalhaFalsa([mon({ name: 'pidgey', id: 16 })]);
  // o desvio está em `turn`: se ele não existisse, `useItem` diria "não teria efeito" e o Mel ficaria na mochila
  await batalha.turn({ type: 'item', id: 'honey' });
  assert.equal(G.S.bag.honey, undefined, 'o petisco foi oferecido (e gasto), não recusado');
});

test('selvagem segurando item: o turno roda e o item aparece no inimigo', async () => {
  const comItem = mon({ name: 'pidgey', id: 16, item: 'oran-berry' });
  const B = await rodar({ type: 'move', idx: 0 }, { inimigos: [comItem] });
  // não testa o efeito (isso é dos testes puros): testa que item no inimigo não quebra render nem motor
  assert.ok(B.inimigos[0]);
});
