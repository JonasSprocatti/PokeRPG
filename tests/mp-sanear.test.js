/* O que estes testes guardam: a sala não confia em nada que chega pelo canal.
   Os casos de ataque não são inventados — são os três caminhos que estavam abertos até 29/09/2026:
   número virando tag (`Nv. ${m.level}` no HTML), endereço de sprite com apóstrofe caindo dentro de
   `onerror="…src='AQUI'"`, e pacote sem `batalha` estourando dentro do ouvinte do canal. */
import test from 'node:test';
import assert from 'node:assert';
import { saneado, textoDeRede, urlDeImagem, estadoDaRede, fimDaRede, pingDaRede, chatDaRede, lobbyDaRede,
  acaoDaRede, membroDaRede, doAnfitriao, MAX_TEXTO, MAX_LISTA, MAX_FUNDO } from '../js/mp-sanear.js';
import { fotoDoMon, novaBatalhaMP } from '../js/mp-motor.js';   // os pacotes de verdade saem do motor, não da minha imaginação

const batalha = (extra = {}) => ({ turno: 3, lados: { A: [{ ref: 'a:0', nome: 'Bulbasaur', level: 12, hp: 30, stats: { hp: 40 } }], B: [] }, ...extra });

test('número que não é número vira número', () => {
  assert.equal(saneado(7), 7);
  assert.equal(saneado(NaN), 0);
  assert.equal(saneado(Infinity), 0);
  // o ataque de verdade: `level` com HTML dentro, que ia cru pro `Nv. ${m.level}`
  const s = saneado({ level: '<img src=x onerror=alert(1)>' });
  assert.ok(!/[<>]/.test(s.level), `sobrou tag: ${s.level}`);
});

test('campo que entra em conta sai como número, nunca como texto', () => {
  // o estrago aqui não é script, é `S.money += r.dinheiro` virando "100500" e indo pro save
  const s = saneado({ recompensas: { u1: { xp: '9999', dinheiro: 'muito', item: null } } });
  assert.strictEqual(s.recompensas.u1.xp, 9999);
  assert.strictEqual(s.recompensas.u1.dinheiro, 0);
  assert.strictEqual(saneado({ hp: '30' }).hp, 30);
  assert.strictEqual(saneado({ frac: '0.5' }).frac, 0.5);
  assert.strictEqual(saneado({ power: null }).power, null);   // golpe de status tem poder nulo de verdade
  // `pp` é lista de números em final[x].pp — a lista não pode virar 0
  assert.deepEqual(saneado({ pp: ['35', 'x', 20] }).pp, [35, 0, 20]);
  // `id` continua texto: na presença é o uuid do jogador, e forçar número arrebentaria a sala
  assert.strictEqual(membroDaRede({ id: 'v-abc123', nome: 'Ana' }).id, 'v-abc123');
});

test('texto de fora perde < > e " e não passa de MAX_TEXTO', () => {
  assert.equal(textoDeRede('<script>alert(1)</script>'), 'scriptalert(1)/script');
  assert.equal(textoDeRede('a"b'), 'ab');
  assert.equal(textoDeRede('x'.repeat(MAX_TEXTO + 50)).length, MAX_TEXTO);
});

test('endereço de imagem só passa se for https de servidor de sprite conhecido', () => {
  const bom = 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/1.png';
  assert.equal(urlDeImagem(bom), bom);
  assert.equal(urlDeImagem('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png').length > 0, true);
  // o ataque: fechar a string do onerror e emendar código
  assert.equal(urlDeImagem("x.png';alert(document.cookie);//"), '');
  assert.equal(urlDeImagem('javascript:alert(1)'), '');
  assert.equal(urlDeImagem('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(urlDeImagem('http://cdn.jsdelivr.net/a.png'), '');   // sem https, não
  assert.equal(urlDeImagem('https://evil.example.com/a.png'), '');
  assert.equal(urlDeImagem(42), '');
});

test('host certo com código no CAMINHO também é recusado (new URL não limpa apóstrofe)', () => {
  // este era o furo do primeiro conserto: `SPR_ANIM(m.id)` monta o endereço sozinha, e um `id` torto vinha do
  // estado publicado por outro jogador. Host legítimo, caminho com código — `new URL().href` devolve intacto.
  const armado = "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/1';alert(document.cookie)//.png";
  assert.equal(new URL(armado).hostname, 'cdn.jsdelivr.net');   // prova de que a lista de hosts não bastava
  assert.equal(urlDeImagem(armado), '');
  assert.equal(urlDeImagem('https://cdn.jsdelivr.net/a".png'), '');
  assert.equal(urlDeImagem('https://cdn.jsdelivr.net/a b.png'), '');
});

test('sprite dentro do estado é tratada como endereço, não como texto', () => {
  const s = saneado({ data: { sprite: "a';alert(1)//", back: 'https://cdn.jsdelivr.net/x.png', speciesName: 'bulbasaur' } });
  assert.equal(s.data.sprite, '');
  assert.equal(s.data.back, 'https://cdn.jsdelivr.net/x.png');
  assert.equal(s.data.speciesName, 'bulbasaur');   // texto normal continua texto
});

test('lista e aninhamento têm teto (pacote absurdo não derruba a aba)', () => {
  assert.equal(saneado(new Array(MAX_LISTA + 100).fill(1)).length, MAX_LISTA);
  let fundo = { x: 1 };
  for (let i = 0; i < MAX_FUNDO + 10; i++) fundo = { x: fundo };
  assert.doesNotThrow(() => saneado(fundo));
});

test('estado sem batalha é jogado fora, não usado pela metade', () => {
  assert.equal(estadoDaRede(null), null);
  assert.equal(estadoDaRede({}), null);
  assert.equal(estadoDaRede({ batalha: {} }), null);
  assert.equal(estadoDaRede({ batalha: { turno: 1, lados: { A: [] } } }), null);   // falta o lado B
  assert.equal(estadoDaRede({ batalha: { turno: 'muitos', lados: { A: [], B: [] } } }), null);
  const ok = estadoDaRede({ batalha: batalha(), prazo: 123, eventos: [{ txt: 'oi', ref: 'a:0' }] });
  assert.equal(ok.batalha.turno, 3);
  assert.equal(ok.batalha.lados.A[0].nome, 'Bulbasaur');
});

test('estado legítimo atravessa inteiro (o saneamento não pode comer dado bom)', () => {
  const p = { de: 'u1', prazo: 1700000000000, tipo: 'alfa', zona: 'rota-1', acoesFeitas: ['u1'],
    batalha: batalha({ pvp: false, evento: null, campo: { clima: 'sol', turnosClima: 5, lados: { A: { telas: {} }, B: {} } } }) };
  p.batalha.lados.A[0].moves = [{ name: 'tackle', type: 'normal', cls: 'physical', power: 40, pp: 35, ppLeft: 30 }];
  p.batalha.lados.A[0].data = { types: ['grass', 'poison'], effort: { atk: 1 }, base: { hp: 45 } };
  assert.deepEqual(estadoDaRede(p), p);
});

/* O teste mais importante do arquivo. Os outros provam que o ataque não passa; este prova que **o jogo continua
   passando** — um saneamento que come dado legítimo não dá erro em lugar nenhum, só faz a sala parar de
   funcionar em produção, que é exatamente o tipo de bug que este projeto não tem como ver sem navegador.
   Os pacotes aqui não são escritos à mão: saem do MOTOR de verdade (`fotoDoMon`, `novaBatalhaMP`) e passam por
   `JSON.parse(JSON.stringify(...))`, que é o que a rede faria com eles. */
const monDeVerdade = () => fotoDoMon({
  nick: null, name: 'bulbasaur', id: 1, level: 12, shiny: false, ability: 'overgrow', item: 'leftovers',
  nature: 'adamant', ivs: { hp: 31, atk: 20, def: 5, spa: 1, spd: 9, spe: 14 }, evs: { hp: 4, atk: 0, def: 0, spa: 0, spd: 0, spe: 2 },
  data: { types: ['grass', 'poison'], sprite: 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/1.png',
    back: 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/back/1.png', speciesName: 'bulbasaur',
    baseExp: 64, effort: { spa: 1 }, base: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 } },
  stats: { hp: 40, atk: 20, def: 20, spa: 25, spd: 25, spe: 21 }, hp: 40, status: null, sleep: 0,
  moves: [{ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35 }],
}, 'a:0', 'v-abc', 'Bulbasaur', 0);
const comoAredeEntrega = p => JSON.parse(JSON.stringify(p));

test('pacote de verdade do motor atravessa sem perder UM campo', () => {
  const b = novaBatalhaMP([monDeVerdade()], [monDeVerdade()], { zona: 'rota-1' });
  const p = comoAredeEntrega({ de: 'v-abc', batalha: b, eventos: [{ txt: 'Turno 1', cls: 'turno', ref: 'a:0' }],
    prazo: 9, acoesFeitas: [], tipo: 'explorar', zona: 'rota-1' });
  assert.deepEqual(estadoDaRede(p), p);
});

test('presença de verdade (com os Pokémon que a pessoa traz) atravessa sem perder UM campo', () => {
  // o anfitrião sanea a PRÓPRIA presença junto com a dos outros, e monta a luta a partir dela: perder um campo
  // aqui não vira tela quebrada, vira Pokémon entrando errado na batalha
  const p = comoAredeEntrega({ id: 'v-abc', nome: 'Jonas', icone: { id: 1, shiny: false }, anfitriao: true,
    time: 'A', entrouEm: 1727600000000, mons: [monDeVerdade()], badge: null, pronto: true, entradaTipo: 'run' });
  assert.deepEqual(membroDaRede(p), p);
});

test('pacote de fim de verdade atravessa sem perder UM campo', () => {
  const p = comoAredeEntrega({ de: 'v-abc', pvp: false, fim: 'A', eventos: [],
    final: { 'v-abc:0': { frac: 0.5, status: null, sleep: 0, item: 'leftovers', pp: [30], especie: 'bulbasaur', real: true, nivelLuta: 12 } },
    recompensas: { 'v-abc': { xp: 120, dinheiro: 88, item: null } }, effort: { spa: 1 },
    derrotados: [{ especie: 'bulbasaur', id: 1 }], vistos: [{ especie: 'bulbasaur', id: 1, shiny: false }],
    chefe: null, chefeNivel: 12, evento: null });
  assert.deepEqual(fimDaRede(p), p);
});

test('as outras portas recusam o que não tem a cara do evento', () => {
  assert.equal(pingDaRede({ turno: 2, prazo: 1 }).turno, 2);
  assert.equal(pingDaRede({ turno: 'x' }), null);
  assert.equal(fimDaRede({ fim: 'A', final: {} }).fim, 'A');
  assert.equal(fimDaRede({ fim: 'A' }), null);
  assert.equal(chatDaRede({ nome: 'Ana', texto: 'oi' }).texto, 'oi');
  assert.equal(chatDaRede({ texto: '   ' }), null);
  assert.equal(lobbyDaRede({ zona: 'rota-1', config: { modo: 'coop' } }).config.modo, 'coop');
  assert.equal(lobbyDaRede({ zona: 'rota-1' }), null);
});

test('escolha: golpe é índice, e índice fora da faixa não chega ao motor', () => {
  assert.equal(acaoDaRede({ de: 'u1', acao: { tipo: 'golpe', golpe: 2, alvo: 'b:0' } }).acao.golpe, 2);
  assert.equal(acaoDaRede({ de: 'u1', acao: { tipo: 'golpe', golpe: -1 } }).acao.golpe, -1);   // -1 é o Struggle
  assert.equal(acaoDaRede({ de: 'u1', acao: { tipo: 'golpe', golpe: 'constructor' } }), null);
  assert.equal(acaoDaRede({ de: 'u1', acao: { tipo: 'golpe', golpe: 9999 } }), null);
  assert.equal(acaoDaRede({ de: 'u1', acao: { tipo: 'golpe', golpe: 1.7 } }).acao.golpe, 1);
  assert.equal(acaoDaRede({ de: 'u1' }), null);
});

test('presença: ícone do outro jogador só pode ser número de Pokédex', () => {
  assert.deepEqual(membroDaRede({ nome: 'Ana', icone: { id: 25, shiny: true } }).icone, { id: 25, shiny: true });
  assert.deepEqual(membroDaRede({ icone: { id: "1';alert(1)//" } }).icone, { id: 25, shiny: false });
  assert.deepEqual(membroDaRede({ icone: { id: 99999 } }).icone, { id: 25, shiny: false });
  assert.deepEqual(membroDaRede({ icone: { id: 0 } }).icone, { id: 25, shiny: false });
  assert.equal(membroDaRede({ nome: '<b>Ana' }).nome, 'bAna');
  assert.equal(membroDaRede('nada'), null);
});

test('pacote que se diz de outro só passa se for do anfitrião (ou se não houver anfitrião conhecido)', () => {
  assert.equal(doAnfitriao({ de: 'anf' }, 'anf'), true);
  assert.equal(doAnfitriao({ de: 'intruso' }, 'anf'), false);
  assert.equal(doAnfitriao({}, 'anf'), true);        // versão antiga do jogo não manda `de`
  assert.equal(doAnfitriao({ de: 'qualquer' }, null), true);   // presença ainda não sincronizou
});
