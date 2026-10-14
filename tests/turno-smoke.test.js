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

test('⚔ Saga: a tela de luta (cena, registro e comandos numa tela só) desenha, a gaveta sobrevive e o turno roda', async () => {
  const { render } = await import('../js/render.js');
  G.S = { ...saveFalso(), dificuldade: 'saga' }; G.mode = 'battle'; G.busy = false; G.panel = 'comandos'; G.abertos = new Set();
  G.B = batalhaFalsa([mon({ name: 'pidgey', id: 16 }), mon({ name: 'rattata', id: 19 })]);
  G.gaveta = 'ficha'; render();
  assert.equal(G.gaveta, 'ficha', 'na luta da Saga a gaveta (ficha, comitiva) continua aberta');
  await batalha.turn({ type: 'move', idx: 0 });
  // nos outros modos a tela é a de sempre: nenhuma gaveta sobra pendurada de uma jornada pra outra
  G.S = saveFalso(); G.mode = 'battle'; G.B = batalhaFalsa([mon({ name: 'pidgey', id: 16 })]); G.gaveta = 'ficha'; render();
  assert.equal(G.gaveta, null);
});

/* 📱 Luta em GRUPO fora da Saga (revisão de usabilidade de 14/10/2026, a pedido do usuário: "lutas com 2 e 3
   inimigos, a quantidade de informação vai sobrecarregar a tela"). O CSS decide o desenho por CLASSES da cena —
   `compacta` (2+ inimigos ou aliado), `denso` (5+ em campo) e `com-aliados` no seu lado —, então o contrato que
   precisa ficar de pé é o markup, que só existe no navegador. Aqui um `#scene` que GRAVA o que recebe. */
test('luta em grupo (3 inimigos + 2 aliados): a cena sai com as classes que o CSS usa', async () => {
  const { render } = await import('../js/render.js');
  const guardado = {};
  const cena = { className: '', innerHTML: '', setAttribute() {}, removeAttribute() {}, classList: { add() {}, remove() {}, contains: () => false,
    toggle(c, on) { guardado[c] = on; } }, offsetHeight: 0, style: {}, dataset: {}, querySelector: () => null, querySelectorAll: () => [] };
  const original = document.querySelector;
  document.querySelector = s => s === '#scene' ? cena : original(s);
  try {
    G.S = saveFalso(); G.S.aliados = [mon({ name: 'bulbasaur', id: 1 }), mon({ name: 'pikachu', id: 25 })];
    G.mode = 'battle'; G.busy = false; G.panel = 'moves'; G.abertos = new Set();
    G.B = batalhaFalsa([mon({ name: 'pidgey', id: 16 }), mon({ name: 'rattata', id: 19 }), mon({ name: 'ekans', id: 23 })]);
    render();
    for (const c of ['battle', 'compacta', 'denso']) assert.ok(cena.className.split(/\s+/).includes(c), `a cena do grupo leva a classe "${c}"`);
    assert.match(cena.innerHTML, /class="side me com-aliados"/, 'o seu lado avisa que há aliados em campo');
    // 1 contra 1, sem aliado: a cena continua sendo a de sempre (placas largas no computador)
    G.S = saveFalso(); G.B = batalhaFalsa([mon({ name: 'pidgey', id: 16 })]);
    render();
    assert.ok(!/compacta|denso/.test(cena.className), '1×1 não vira cena compacta');
    assert.doesNotMatch(cena.innerHTML, /com-aliados/);
    // 2 inimigos e nenhum aliado: compacta, mas ainda não "densa" (3 em campo)
    G.B = batalhaFalsa([mon({ name: 'pidgey', id: 16 }), mon({ name: 'rattata', id: 19 })]);
    render();
    assert.ok(/compacta/.test(cena.className) && !/denso/.test(cena.className));
  } finally { document.querySelector = original; }
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

/* 🎒 Treinador de 6 com CAMPO 3 (pedido do usuário, 06/10/2026). O caminho crítico é o `win()`: com até 3 em
   campo ele deixou de "mandar o próximo" e passou a REPOR o campo. Um erro aqui trava a luta no meio ou manda o
   mesmo Pokémon duas vezes — e `T.emCampo` são índices, então é fácil de errar calado. */
test('treinador de 6 com campo 3: a luta começa com 3 em campo', async () => {
  const equipe = [...Array(6)].map((_, k) => mon({ name: 'bicho' + k, id: 16 + k }));
  const B = await rodar({ type: 'move', idx: 0 }, {
    inimigos: equipe.slice(0, 3),
    extra: { trainer: { nome: 'Treinador Teste', equipe, emCampo: [0, 1, 2], atual: 0, campo: 3, bola: 'poke-ball', bolas: 3 } }
  });
  assert.equal(B.inimigos.length, 3, 'os três seguem em campo depois do turno');
  assert.ok(B.inimigos.every(m => equipe.includes(m)), 'em campo estão os MESMOS objetos da equipe (senão o dano se perde)');
});

test('a onda seguinte repõe o campo inteiro, e ninguém entra duas vezes', async () => {
  const equipe = [...Array(6)].map((_, k) => mon({ name: 'bicho' + k, id: 16 + k }));
  // os três da frente já caíram: o turno tem de trazer os três de trás de uma vez
  for (const m of equipe.slice(0, 3)) m.hp = 0;
  G.S = saveFalso(); G.mode = 'battle'; G.busy = false; G.panel = null; G.abertos = new Set();
  G.S.aliados = [mon({ name: 'aliado', id: 1 })];   // teto 3 precisa de aliado em pé (regras.tetoDoGrupo)
  G.B = batalhaFalsa(equipe.slice(0, 3), { trainer: { nome: 'T', equipe, emCampo: [0, 1, 2], atual: 0, campo: 3, bola: 'poke-ball', bolas: 3 } });
  await batalha.turn({ type: 'move', idx: 0 });
  const dentro = G.B.inimigos;
  assert.equal(dentro.length, 3, 'a onda nova veio com três');
  assert.ok(dentro.every(m => m.hp > 0), 'e todos de pé');
  assert.equal(new Set(dentro).size, 3, 'ninguém entrou duas vezes');
  assert.ok(dentro.every(m => equipe.slice(3).includes(m)), 'são exatamente os três do banco');
});

test('sem aliado em pé, a onda do treinador de 6 vem com 2, não 3', async () => {
  const equipe = [...Array(6)].map((_, k) => mon({ name: 'bicho' + k, id: 16 + k }));
  for (const m of equipe.slice(0, 3)) m.hp = 0;
  G.S = saveFalso(); G.mode = 'battle'; G.busy = false; G.panel = null; G.abertos = new Set();
  G.S.aliados = [];                                  // você sozinho: `tetoDoGrupo(0)` = 2
  G.B = batalhaFalsa(equipe.slice(0, 3), { trainer: { nome: 'T', equipe, emCampo: [0, 1, 2], atual: 0, campo: 3, bola: 'poke-ball', bolas: 3 } });
  await batalha.turn({ type: 'move', idx: 0 });
  assert.ok(G.B.inimigos.length <= 2, `veio com ${G.B.inimigos.length}: a promessa é no máximo aliados + 2`);
});

test('save antigo de treinador (só `atual`, sem `emCampo`) continua carregando', () => {
  const equipe = [mon({ name: 'a', id: 16 }), mon({ name: 'b', id: 17 })];
  const B = batalha.restaurarBatalha({
    inimigos: [equipe[1]], foco: 0, turn: 3, runs: 0, campo: { lados: {} }, planos: {},
    trainer: { nome: 'Velho', equipe, atual: 1, bola: 'poke-ball', bolas: 2 }   // sem `emCampo` nem `campo`
  });
  assert.ok(B, 'a batalha voltou');
  assert.equal(B.inimigos.length, 1);
  assert.equal(B.inimigos[0], equipe[1], 'o inimigo é o MESMO objeto da equipe, pelo `atual` antigo');
});

test('selvagem segurando item: o turno roda e o item aparece no inimigo', async () => {
  const comItem = mon({ name: 'pidgey', id: 16, item: 'oran-berry' });
  const B = await rodar({ type: 'move', idx: 0 }, { inimigos: [comItem] });
  // não testa o efeito (isso é dos testes puros): testa que item no inimigo não quebra render nem motor
  assert.ok(B.inimigos[0]);
});

/* ---- 🥎 A bola do treinador (três pedidos do usuário, 06/10/2026) ----
   1. ele pode mirar num ALIADO; 2. vencer liberta quem foi preso; 3. você na bola não é o fim — os aliados
   seguem lutando. O que torna isto arriscado de implementar é que "preso" reusa o `vol.retirado` do revezamento:
   se algum caminho esquecer de limpar, o aliado volta de graça; se o `endBattle` esquecer de descontar, nunca se
   perde. Os dois lados estão testados aqui. */
const comTreinador = (equipe, extra = {}) => ({
  nome: 'Caçador Teste', equipe, emCampo: equipe.map((_, k) => k).slice(0, 1), atual: 0, campo: 1,
  bola: 'poke-ball', bolas: 3, ...extra
});

test('vencer SOLTA quem estava preso, e ele volta pra equipe', async () => {
  const inimigo = mon({ name: 'pidgey', id: 16, hp: 1 });   // cai no primeiro golpe → win()
  G.S = saveFalso(); G.mode = 'battle'; G.busy = false; G.panel = null; G.abertos = new Set();
  const aliado = mon({ name: 'bulbasaur', id: 1 });
  G.S.aliados = [aliado];
  G.B = batalhaFalsa([inimigo], { trainer: comTreinador([inimigo]), taxaCaptura: 45, presos: [aliado] });
  aliado.vol.retirado = true;                                // como `prender` o deixa
  await batalha.turn({ type: 'move', idx: 0 });
  assert.ok(!aliado.vol.retirado, 'a bola abriu: ele voltou pra campo');
  assert.ok(G.S.aliados.includes(aliado), 'e continua na equipe');
});

test('VOCÊ preso e vencendo: a bola abre e você segue na jornada', async () => {
  const inimigo = mon({ name: 'pidgey', id: 16, hp: 1 });
  G.S = saveFalso(); G.mode = 'battle'; G.busy = false; G.panel = null; G.abertos = new Set();
  const aliado = mon({ name: 'bulbasaur', id: 1 });
  G.S.aliados = [aliado];
  const P = G.S.player; P.vol.retirado = true;
  G.B = batalhaFalsa([inimigo], { trainer: comTreinador([inimigo]), taxaCaptura: 45, presos: [P], naBola: true });
  await batalha.turn({ type: 'passar' });                    // você não age: quem luta são os aliados
  assert.ok(!P.vol.retirado, 'você saiu da bola');
  assert.ok(!G.B || !G.B.naBola, 'e a marca de bola foi desfeita');
});

test('aliado preso e a luta acabando SEM vitória: ele é perdido de verdade', async () => {
  G.S = saveFalso(); G.mode = 'battle'; G.busy = false; G.panel = null; G.abertos = new Set();
  const aliado = mon({ name: 'bulbasaur', id: 1 });
  G.S.aliados = [aliado];
  const inimigo = mon({ name: 'pidgey', id: 16 });
  G.B = batalhaFalsa([inimigo], { trainer: comTreinador([inimigo]), taxaCaptura: 45, presos: [aliado] });
  aliado.vol.retirado = true;
  batalha.endBattle();                                       // fuga, derrota, saída forçada: tudo passa por aqui
  assert.ok(!G.S.aliados.includes(aliado), 'o treinador levou ele embora');
});

test('você preso NÃO é removido da equipe pelo endBattle (você não é aliado)', () => {
  G.S = saveFalso(); G.mode = 'battle'; G.busy = false; G.abertos = new Set();
  const P = G.S.player;
  const inimigo = mon({ name: 'pidgey', id: 16 });
  G.S.aliados = [];
  G.B = batalhaFalsa([inimigo], { trainer: comTreinador([inimigo]), taxaCaptura: 45, presos: [P], naBola: true });
  batalha.endBattle();
  assert.equal(G.S.player, P, 'você continua sendo você — quem resolve a sua captura é `serCapturado`');
});

/* ⏱ After You / Quash e 🏠 Trick Room rodando no `turn()` DE VERDADE. Este caso existe porque a primeira versão
   de `batalha.reordenar` guardava `agora: () => i` apontando pro `i` do `for` declarado LOGO ABAIXO — fora de
   escopo. `node --check` passava (identificador solto é JS válido) e o teste de unidade de `especiais.test.js`
   passava também, porque lá o `ctx.reordenar` é MOCKADO: o mock testava o motor pedindo, nunca o jogo atendendo.
   É a armadilha do `T` do `win()` repetida. Daí a regra: gancho novo de `ctx` = um caso aqui, com o ctx real. */
test('⏱ After You dentro do turno real: a fila é reordenada sem estourar', async () => {
  const depressa = golpe({ name: 'after-you', cls: 'status', power: null, acc: null, target: 'selected-pokemon' });
  const aliado = mon({ name: 'bulbasaur', id: 1 });
  const B = await rodar({ type: 'move', idx: 0 }, {
    inimigos: [mon({ name: 'pidgey', id: 16, stats: { ...mon().stats, speed: 5 } })]
  });
  assert.ok(B, 'o turno comum segue de pé');
  // agora com o golpe de verdade na mão e um aliado em campo, pra haver mais de uma ação na fila
  G.S = { ...G.S, aliados: [aliado] };
  G.S.player.moves = [depressa, golpe()];
  G.mode = 'battle'; G.busy = false; G.panel = null;
  G.B = batalhaFalsa([mon({ name: 'pidgey', id: 16 })]);
  await batalha.turn({ type: 'move', idx: 0 });
  // o observável é a RODADA ter atravessado: o `reordenar` roda no meio do laço, e um `i` fora de escopo
  // estourava exatamente aqui. A luta pode ou não ter acabado — o que não pode é explodir no caminho.
  assert.ok(G.B === null || G.B.turn > 1, 'o turno inteiro passou pelo reordenar sem estourar');
});

test('🏠 Trick Room no campo: o turno roda com a fila invertida', async () => {
  G.S = saveFalso(); G.mode = 'battle'; G.busy = false; G.panel = null; G.abertos = new Set();
  G.S.aliados = [mon({ name: 'bulbasaur', id: 1 })];
  G.B = batalhaFalsa([mon({ name: 'pidgey', id: 16 })], { campo: { lados: {}, salaInvertida: 4 } });
  await batalha.turn({ type: 'move', idx: 0 });
  // o que importa é que `ordenarAcoes` com a inversão ligada atravessou o turno inteiro
  assert.ok(true);
});

test('🎒 vencer devolve o item que o inimigo derrubou (e não devolve o que você roubou de mão vazia)', async () => {
  G.S = saveFalso(); G.mode = 'battle'; G.busy = false; G.panel = null; G.abertos = new Set();
  const meu = G.S.player;
  meu.item = 'oran-berry'; meu.itemAntes = 'leftovers';      // o inimigo trocou/derrubou no meio da luta
  const aliado = mon({ name: 'bulbasaur', id: 1, item: 'sitrus-berry' });
  aliado.itemAntes = null;                                    // este ROUBOU de mão vazia: fica com o espólio
  G.S.aliados = [aliado];
  G.B = batalhaFalsa([mon({ name: 'pidgey', id: 16, hp: 0 })]);
  batalha.endBattle(true);
  assert.equal(meu.item, 'leftovers', 'o que era seu voltou');
  assert.equal(aliado.item, 'sitrus-berry', 'o espólio ficou');
  assert.equal('itemAntes' in meu, false, 'a anotação é consumida');
});

test('🎒 PERDER não devolve o item: a perda é consequência da derrota', () => {
  G.S = saveFalso(); G.mode = 'battle'; G.abertos = new Set();
  const meu = G.S.player;
  meu.item = null; meu.itemAntes = 'leftovers';
  G.B = batalhaFalsa([mon({ name: 'pidgey', id: 16 })]);
  batalha.endBattle();                                        // sem `venceu`
  assert.equal(meu.item, null);
  assert.equal('itemAntes' in meu, false, 'mas a anotação não fica pendurada no save');
});
