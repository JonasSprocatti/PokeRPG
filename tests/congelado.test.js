// Congelamento (golpe.js): trava a ação com 20% de saída, golpe `defrost` descongela quem usa, golpe de Fogo
// descongela quem leva, e sol forte não deixa congelar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshVol } from '../js/regras.js';
import { usarGolpe, aplicarStatus } from '../js/golpe.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const mon = (o = {}) => ({ level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0,
  stats: { hp: 300, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 }, hp: 300, moves: [], vol: freshVol(), ...o });
const ctx = (campo = { clima: null, turnos: 0 }) => { const msgs = []; return { msgs, campo, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); } }; };

test('Ice Beam congela e o congelado perde a vez (sorteio acima de 20%)', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const c = ctx(), u = mon(), alvo = mon({ nome: 'T' });
  await usarGolpe(u, alvo, golpe({ name: 'ice-beam', type: 'ice', cls: 'special', power: 90, meta: { ailment: 'freeze', ailChance: 100 } }), true, c);
  assert.equal(alvo.status, 'freeze');
  const c2 = ctx();
  await usarGolpe(alvo, u, golpe(), true, c2);
  assert.ok(c2.msgs.some(m => m.includes('congelado')));
  assert.equal(u.hp, u.stats.hp);                                   // não atacou
});

test('sorteio abaixo de 20% descongela e o golpe sai', async t => {
  t.mock.method(Math, 'random', () => 0.1);
  const c = ctx(), u = mon({ nome: 'U', status: 'freeze' }), alvo = mon();
  await usarGolpe(u, alvo, golpe(), true, c);
  assert.equal(u.status, null);
  assert.ok(alvo.hp < alvo.stats.hp);
});

test('golpe com flag defrost (Flame Wheel) descongela quem usa, mesmo com sorteio ruim', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const c = ctx(), u = mon({ nome: 'U', status: 'freeze' }), alvo = mon();
  await usarGolpe(u, alvo, golpe({ name: 'flame-wheel', type: 'fire', power: 60 }), true, c);
  assert.equal(u.status, null);
  assert.ok(alvo.hp < alvo.stats.hp);
});

test('golpe de Fogo descongela quem leva', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const c = ctx(), u = mon(), alvo = mon({ nome: 'T', status: 'freeze' });
  await usarGolpe(u, alvo, golpe({ name: 'ember', type: 'fire', cls: 'special', power: 40 }), true, c);
  assert.equal(alvo.status, null);
  assert.ok(c.msgs.some(m => m.includes('descongelou')));
});

test('sol forte não deixa congelar', async () => {
  const c = ctx({ clima: 'sol', turnos: 5 }), alvo = mon({ nome: 'T' });
  await aplicarStatus(alvo, 'freeze', c, true, mon());
  assert.equal(alvo.status, null);
  assert.ok(c.msgs.some(m => m.toLowerCase().includes('sol forte')));
});
