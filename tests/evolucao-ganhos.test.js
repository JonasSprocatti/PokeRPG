// O que a EVOLUÇÃO entrega junto: os golpes de evolução (regras.golpesDaEvolucao) e a habilidade no mesmo slot
// (habilidades.habilidadeDaEvolucao). Os dois nasceram de bug real: o Aegislash evoluiu sem aprender King's Shield,
// porque só olhávamos golpe do nível exato — e a habilidade era escolhida por índice cru, misturando oculta com normal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { golpesDaEvolucao } from '../js/regras.js';
import { habilidadeDaEvolucao } from '../js/habilidades.js';

const g = (name, level) => ({ name, url: `u/${name}`, level });

test('golpe de evolução (nível 0) entra mesmo evoluindo lá em cima', () => {
  const antes = [g('fury-cutter', 1), g('iron-defense', 12)];                      // Doublade
  const depois = [g('kings-shield', 0), g('fury-cutter', 1), g('iron-defense', 12)]; // Aegislash
  const ganhos = golpesDaEvolucao(antes, depois, 37).map(m => m.name);
  assert.deepEqual(ganhos, ['kings-shield']);
});

test('nível 1 NÃO é golpe de evolução: é a lista de quem nasce agora', () => {
  // caso real (Exeggcute → Exeggutor): 1 golpe no nível 0 e 17 no nível 1. Pegar os dois reescrevia o moveset
  // inteiro numa evolução só — foi bug relatado em jogo.
  const antes = [g('barrage', 1), g('hypnosis', 1)];
  const depois = [g('stomp', 0), ...['absorb', 'seed-bomb', 'leaf-storm', 'psyshock', 'wood-hammer'].map(n => g(n, 1))];
  assert.deepEqual(golpesDaEvolucao(antes, depois, 30).map(m => m.name), ['stomp']);
});

test('golpe que a forma antiga já aprendia não é reoferecido', () => {
  const lista = [g('tackle', 1), g('ember', 9)];
  assert.deepEqual(golpesDaEvolucao(lista, lista, 30), []);
});

test('o golpe do nível atual continua entrando, e sem repetir', () => {
  const antes = [g('tackle', 1)];
  const depois = [g('tackle', 1), g('flamethrower', 38), g('slash', 20)];
  assert.deepEqual(golpesDaEvolucao(antes, depois, 38).map(m => m.name), ['flamethrower']);
  // mesmo golpe listado duas vezes na PokéAPI (version groups diferentes) não vira duas perguntas
  assert.equal(golpesDaEvolucao([], [g('nada', 0), g('nada', 0)], 5).length, 1);
});

test('só o nível 0 conta como golpe de evolução', () => {
  assert.deepEqual(golpesDaEvolucao([], [g('a', 0), g('b', 1), g('c', 2)], 50).map(m => m.name), ['a']);
});

const hab = (name, hidden = false) => ({ name, hidden });

test('habilidade fica no mesmo slot ao evoluir', () => {
  const velhas = [hab('blaze'), hab('solar-power', true)];
  const novas = [hab('blaze'), hab('solar-power', true)];
  assert.equal(habilidadeDaEvolucao(velhas, novas, 'blaze'), 'blaze');
  // slot 2 normal continua slot 2 normal, mesmo com nomes diferentes dos dois lados
  assert.equal(habilidadeDaEvolucao([hab('a'), hab('b')], [hab('x'), hab('y')], 'b'), 'y');
});

test('habilidade oculta continua oculta (não vira a primeira normal)', () => {
  const velhas = [hab('run-away'), hab('hustle', true)];
  const novas = [hab('guts'), hab('thick-fat'), hab('unaware', true)];
  assert.equal(habilidadeDaEvolucao(velhas, novas, 'hustle'), 'unaware');
});

test('forma nova com menos slots cai no equivalente, sem quebrar', () => {
  assert.equal(habilidadeDaEvolucao([hab('a'), hab('b')], [hab('so-essa')], 'b'), 'so-essa');
  assert.equal(habilidadeDaEvolucao([hab('a')], [], 'a'), 'a');                 // sem dados: mantém a atual
  assert.equal(habilidadeDaEvolucao([], [hab('x'), hab('y', true)], 'sumida'), 'x'); // não achou: primeira normal
});
