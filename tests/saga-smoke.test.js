/* 💥 O MUNDO DA SAGA RODANDO DE VERDADE, no Node, sem dependência — irmão do `turno-smoke.test.js`.
   Detector de explosão, não teste de regra (as regras estão em `saga-mundo.test.js`): desenha o mapa, anda,
   conversa até o fim e abre um baú pelos módulos de TELA (`tela-saga.js`, `saga-cena.js`, `render.js`), que os
   testes puros nunca importam. Variável não declarada ou função que não existe ali só apareceria pra quem joga.

   O DOM de mentira daqui difere do do turno em duas coisas, as duas porque a conversa usa a caixa `ui.ask`:
   `querySelector('.modal')` devolve null (senão o mundo acha que há uma caixa aberta e não anda) e todo elemento
   criado "clica" sozinho na PRIMEIRA opção — é o que faz a conversa andar até acabar. */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

const htmls = [];   // tudo o que foi escrito em algum innerHTML: é por onde o teste enxerga a tela
function ligarDomFalso() {
  const el = () => new Proxy({}, {
    get: (t, k) => k === 'innerHTML' || k === 'value' || k === 'textContent' || k === 'id' ? ''
      : k === 'classList' ? { add() {}, remove() {}, toggle() {}, contains: () => false }
      : k === 'dataset' ? {} : k === 'style' ? {} : k === 'children' ? [] : k === 'parentNode' ? null
      : k === 'addEventListener' ? (tipo, fn) => { if (tipo === 'click') setTimeout(() => fn({ target: { closest: () => ({ dataset: { i: '0' } }) } })); }
      : typeof k === 'symbol' ? undefined : (() => el()),
    set: (t, k, v) => { if (k === 'innerHTML') htmls.push(String(v)); return true; }
  });
  globalThis.matchMedia = () => ({ matches: true, addEventListener() {}, addListener() {} });
  globalThis.document = { querySelector: s => s === '.modal' ? null : el(), querySelectorAll: () => [], createElement: () => el(), getElementById: () => el(), body: el(), documentElement: el(), addEventListener() {} };
  globalThis.window = globalThis;
  globalThis.requestAnimationFrame = f => f();
  globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 };
}

let tela, G, render, mundo, freshVol, STATS;
before(async () => {
  ligarDomFalso();
  tela = await import('../js/tela-saga.js');
  ({ G } = await import('../js/estado.js'));
  ({ render } = await import('../js/render.js'));
  mundo = await import('../js/saga-mundo.js');
  ({ freshVol } = await import('../js/regras.js'));
  ({ STATS } = await import('../js/dados.js'));
});

const zero = () => Object.fromEntries(STATS.map(s => [s, 0]));
const mon = () => ({
  id: 19, name: 'rattata', nick: 'Nick <b>', level: 10, ability: 'none', nature: 'hardy', shiny: false, genero: 'm',
  data: { types: ['normal'], base: { hp: 30, attack: 56, defense: 35, 'special-attack': 25, 'special-defense': 35, speed: 72 }, effort: {}, sprite: '', back: '', art: '', speciesName: 'rattata', growth: 'medium-fast', abilities: [], learnset: { list: [], extras: [] } },
  stats: { hp: 40, attack: 30, defense: 25, 'special-attack': 20, 'special-defense': 25, speed: 35 },
  hp: 40, exp: 0, expNext: 100, moves: [{ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, meta: {}, stats: [], desc: 'Bate.' }],
  evs: zero(), ivs: zero(), status: null, sleep: 0, item: null, amizade: 0, vol: freshVol()
});
const comecar = () => {
  G.S = { player: mon(), aliados: [], esconderijo: [], bag: {}, money: 500, missoes: {}, registro: {}, chefes: {},
    zone: 'rota1', gen: 1, dificuldade: 'saga', rapidos: [], wins: 0, log: [], id: 'teste', meta: { growth: 'medium-fast', evo: null }, ovos: [] };
  G.B = null; G.mode = 'explore'; G.panel = 'main'; G.busy = false; htmls.length = 0;
  return mundo.estadoSaga(G.S);
};

test('o mapa desenha na cena e nos controles, sem estourar', () => {
  comecar();
  render();
  const tudo = htmls.join('\n');
  assert.ok(tudo.includes('id="saga-mapa"'), 'a cena não desenhou o mapa');
  assert.ok(tudo.includes('data-act="saga-andar"') && tudo.includes('data-act="saga-diario"'), 'os controles não saíram');
  assert.ok(!tudo.includes('data-act="explore"'), 'o botão Explorar não some no mundo');
  assert.equal((tudo.match(/data-act="saga-ir"/g) || []).length % (mundo.VISAO[0] * mundo.VISAO[1]), 0);
});

test('andar um passo e ir até o Ancião: a conversa corre até o fim e a missão começa', async () => {
  const s = comecar(), y0 = s.y;
  await tela.andar('s');
  assert.equal(s.y, y0 + 1); assert.equal(G.busy, false);
  const [ax, ay] = mundo.acharChar('aldeia', 'A');
  await tela.irPara(ax, ay);
  assert.equal(mundo.etapaDe(G.S, 'fonte'), 0, 'escolhendo sempre a 1ª opção, a conversa aceita a missão');
  assert.equal(G.busy, false);
  assert.ok(G.S.log.some(l => l.html.includes('Ancião Torkoal')), 'a fala fica no log pra reler');
  // o nome do jogador entra na fala ESCAPADO (apelido é texto de fora)
  assert.ok(G.S.log.some(l => l.html.includes('Nick &lt;b&gt;')) && !G.S.log.some(l => l.html.includes('Nick <b>')));
});

test('baú entrega na mochila uma vez só, e o diário abre', async () => {
  const s = comecar(), [bx, by] = mundo.acharChar('bosque', 'a');
  s.mapa = 'bosque'; s.x = bx + 1; s.y = by;
  await tela.andar('o');
  assert.equal(G.S.bag.potion, 2);
  await tela.andar('o');
  assert.equal(G.S.bag.potion, 2, 'baú aberto não entrega de novo');
  await tela.abrirDiario();
});

test('pousada: descansar cura a comitiva e cobra', async () => {
  const s = comecar(), [hx, hy] = mundo.acharChar('aldeia', 'H');
  G.S.player.hp = 5; s.x = hx; s.y = hy + 1;
  await tela.andar('n');
  assert.equal(G.S.player.hp, G.S.player.stats.hp);
  assert.equal(G.busy, false);
});

test('o Passo do Norte: fechado antes do capítulo, e depois leva pra lista de rotas — com volta', async () => {
  const s = comecar(), [gx, gy] = mundo.acharChar('aldeia', 'G');
  s.x = gx; s.y = gy + 1;
  await tela.andar('n');
  assert.equal(mundo.mundoAtivo(G.S), true, 'sem fechar o capítulo, o guarda não deixa');
  s.flags.cap1 = true;
  await tela.andar('n');
  assert.equal(mundo.mundoAtivo(G.S), false);
  htmls.length = 0; render();
  assert.ok(htmls.join('').includes('data-act="saga-voltar"'), 'fora do Vale tem de haver o botão de volta');
  tela.voltarAoVale();
  assert.equal(mundo.mundoAtivo(G.S), true);
});
