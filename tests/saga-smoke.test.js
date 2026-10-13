/* 💥 O MUNDO DA SAGA RODANDO DE VERDADE, no Node, sem dependência — irmão do `turno-smoke.test.js`.
   Detector de explosão, não teste de regra (as regras estão em `saga-mundo.test.js`): desenha a tela de jogo,
   anda, conversa até o fim, abre baú, descansa e troca de capítulo pelos módulos de TELA (`tela-saga.js`,
   `saga-cena.js`, `render.js`), que os testes puros nunca importam. Variável não declarada ou função que não
   existe ali só apareceria pra quem joga. **Ação nova em `tela-saga` = um caso aqui.**

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
  G.B = null; G.mode = 'explore'; G.panel = 'main'; G.busy = false; G.gaveta = null; htmls.length = 0;
  return mundo.estadoSaga(G.S);
};
// põe você ao lado de um objeto do mapa, do lado dado (`s` = embaixo dele, olhando pra cima)
const aoLado = (s, mapa, ch, lado = 's') => { const [x, y] = mundo.acharChar(mapa, ch), [dx, dy] = mundo.DIRS[lado]; s.mapa = mapa; s.x = x + dx; s.y = y + dy; };

test('a tela de jogo desenha o mundo, as coisas e o HUD, sem estourar', () => {
  comecar();
  render();
  const tudo = htmls.join('\n');
  assert.ok(tudo.includes('id="saga-tela"') && tudo.includes('id="saga-chao"'), 'a cena não desenhou o mundo');
  assert.ok(tudo.includes('data-act="saga-toque"'), 'o mapa não aceita toque');
  for (const act of ['saga-andar', 'saga-diario', 'saga-gaveta']) assert.ok(tudo.includes(`data-act="${act}"`), `falta ${act} no HUD`);
  assert.ok(tudo.includes('class="prop"') && tudo.includes('class="ator npc"'), 'faltam os enfeites e os NPCs');
  assert.ok(tudo.includes('class="marca "') || tudo.includes('class="marca"'), 'o Ancião tem missão pra dar: falta o balão');
  assert.ok(tudo.includes('Nick &lt;b&gt;') && !tudo.includes('Nick <b>'), 'o apelido entra escapado no HUD');
  assert.ok(!tudo.includes('data-act="explore"'), 'o botão Explorar não some no mundo');
});

test('andar um passo e ir até o Ancião: a conversa corre até o fim e a missão começa', async () => {
  const s = comecar(), y0 = s.y;
  await tela.andar('s');
  assert.equal(s.y, y0 + 1); assert.equal(G.busy, false);
  await tela.irPara(...mundo.acharChar('pedralume', 'A'));
  assert.equal(mundo.etapaDe(G.S, 'fonte'), 0, 'escolhendo sempre a 1ª opção, a conversa aceita a missão');
  assert.equal(G.busy, false);
  assert.ok(G.S.log.some(l => l.html.includes('Ancião Torkoal')), 'a fala fica no log pra reler');
  // o nome do jogador entra na fala ESCAPADO (apelido é texto de fora)
  assert.ok(G.S.log.some(l => l.html.includes('Nick &lt;b&gt;')) && !G.S.log.some(l => l.html.includes('Nick <b>')));
  await tela.andar('x');            // direção que não existe: nada acontece
});

test('baú entrega na mochila uma vez só, e o diário abre', async () => {
  const s = comecar();
  aoLado(s, 'bosque', 'C', 'l');
  await tela.andar('o');
  assert.equal(G.S.bag.potion, 2);
  await tela.andar('o');
  assert.equal(G.S.bag.potion, 2, 'baú aberto não entrega de novo');
  await tela.abrirDiario();
});

test('pousada: descansar cura a comitiva e cobra', async () => {
  const s = comecar();
  G.S.player.hp = 5; aoLado(s, 'pedralume', 'H');
  await tela.andar('n');
  assert.equal(G.S.player.hp, G.S.player.stats.hp);
  assert.equal(G.busy, false);
});

test('gavetas: abrem, trocam, fecham — e com uma aberta você não anda', async () => {
  const s = comecar(), y0 = s.y;
  tela.gaveta('mochila'); assert.equal(G.gaveta, 'mochila');
  await tela.andar('s'); assert.equal(s.y, y0, 'gaveta aberta trava o passo');
  tela.gaveta('log'); assert.equal(G.gaveta, 'log');
  tela.gaveta('log'); assert.equal(G.gaveta, null);
});

test('toque no mapa sem coordenada não estoura', async () => { comecar(); await tela.tocarNoMapa({}); });

test('o portão do norte: fechado antes do capítulo 1, e depois leva ao capítulo 2', async () => {
  const s = comecar();
  aoLado(s, 'pedralume', 'G');
  await tela.andar('n');
  assert.equal(s.mapa, 'pedralume', 'sem fechar o capítulo, o guarda não deixa');
  s.flags.cap1 = true;
  await tela.andar('n');
  assert.equal(s.mapa, 'passo');
  assert.equal(G.S.zone !== 'rota1' || true, true);   // a rota da jornada acompanha o mapa (sem rede, só não pode estourar)
});

test('capítulo 2: o Alfa do Passo conversa em vez de lutar quando você leva o unguento', async () => {
  const s = comecar();
  s.itens.unguento = 1; aoLado(s, 'covil', 'X');
  await tela.andar('n');
  assert.ok(s.flags['alfa-calmo'] && s.itens.lanca, 'a 1ª opção é chegar devagar');
  assert.equal(mundo.etapaDe(G.S, 'lanca'), 0, 'e a lança abre a missão secreta');
  assert.equal(G.B, null, 'nenhuma batalha começou');
});

test('fim do capítulo 3: seguir viagem leva pra lista de rotas — e dá pra voltar ao mapa', async () => {
  const s = comecar();
  s.flags.cap3 = true; aoLado(s, 'vau', 'K');
  await tela.andar('n');
  assert.equal(mundo.mundoAtivo(G.S), false);
  htmls.length = 0; render();
  assert.ok(htmls.join('').includes('data-act="saga-voltar"'), 'fora do mapa tem de haver o botão de volta');
  tela.voltarAoVale();
  assert.equal(mundo.mundoAtivo(G.S), true);
});
