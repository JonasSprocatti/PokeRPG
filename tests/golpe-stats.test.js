// Em quem o golpe mexe os atributos (golpe.mudaOUsuario). Bug real relatado em jogo: Flame Charge subia a
// velocidade do OPONENTE, porque o código comparava a categoria com 'damage+raise' e a PokéAPI devolve
// 'damage-raise'. Como a string nunca batia, TODO golpe de auto-bônus caía no ramo do alvo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usarGolpe, mudaOUsuario } from '../js/golpe.js';
import { freshVol } from '../js/regras.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const mon = (o = {}) => ({
  level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0,
  stats: { hp: 200, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 200, moves: [golpe()], vol: freshVol(), ...o
});
const ctx = () => ({ nome: m => m.nome || 'X', golpe: g => g.name, say: async () => {} });

test('categoria: raise mexe no usuário, lower mexe no alvo (as duas grafias)', () => {
  assert.equal(mudaOUsuario({ cat: 'damage-raise' }), true);
  assert.equal(mudaOUsuario({ cat: 'damage+raise' }), true);   // se a API mudar a grafia, continua valendo
  assert.equal(mudaOUsuario({ cat: 'damage-lower' }), false);
  assert.equal(mudaOUsuario({ cat: 'damage+lower' }), false);
  assert.equal(mudaOUsuario({}), false);
  assert.equal(mudaOUsuario(null), false);
});

test('Flame Charge sobe a velocidade de QUEM usou, não a do alvo', async t => {
  t.mock.method(Math, 'random', () => 0);
  const u = mon(), alvo = mon();
  const flameCharge = golpe({ name: 'flame-charge', type: 'fire', power: 50, stats: [{ stat: 'speed', change: 1 }], meta: { cat: 'damage-raise', statChance: 100 } });
  await usarGolpe(u, alvo, flameCharge, true, ctx());
  assert.equal(u.vol.stages.speed, 1, 'quem atacou devia ter ganhado velocidade');
  assert.equal(alvo.vol.stages.speed, 0, 'o alvo NÃO pode ganhar nada');
  assert.ok(alvo.hp < 200, 'e o golpe continua causando dano');
});

test('Close Combat baixa os atributos do PRÓPRIO usuário (também é damage-raise)', async t => {
  t.mock.method(Math, 'random', () => 0);
  const u = mon(), alvo = mon();
  const closeCombat = golpe({ name: 'close-combat', type: 'fighting', power: 120, stats: [{ stat: 'defense', change: -1 }, { stat: 'special-defense', change: -1 }], meta: { cat: 'damage-raise', statChance: 100 } });
  await usarGolpe(u, alvo, closeCombat, true, ctx());
  assert.equal(u.vol.stages.defense, -1);          // a categoria manda, não o sinal da mudança
  assert.equal(alvo.vol.stages.defense, 0);
});

test('Crunch continua baixando a defesa do ALVO', async t => {
  t.mock.method(Math, 'random', () => 0);
  const u = mon(), alvo = mon();
  const crunch = golpe({ name: 'crunch', type: 'dark', power: 80, stats: [{ stat: 'defense', change: -1 }], meta: { cat: 'damage-lower', statChance: 20 } });
  await usarGolpe(u, alvo, crunch, true, ctx());
  assert.equal(alvo.vol.stages.defense, -1);
  assert.equal(u.vol.stages.defense, 0);
});
