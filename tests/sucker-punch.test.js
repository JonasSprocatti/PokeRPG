// Sucker Punch / Thunderclap: só funcionam se o alvo escolheu um golpe de dano neste turno e ainda não agiu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usarGolpe, fimDaRodada } from '../js/golpe.js';
import { especial } from '../js/especiais.js';
import { freshVol } from '../js/regras.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const soco = () => golpe({ name: 'sucker-punch', type: 'dark', power: 70, priority: 1 });
const mon = (o = {}) => ({
  level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0,
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, moves: [golpe()], vol: freshVol(), ...o
});
const ctx = () => { const msgs = []; return { msgs, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); } }; };

test('está cadastrado como golpe condicional', () => {
  assert.equal(especial(soco()).soSeAlvoAtaca, true);
  assert.equal(especial({ name: 'thunderclap' }).soSeAlvoAtaca, true);
});

test('funciona quando o alvo escolheu um golpe de dano', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvo = mon(); alvo.vol.golpeEscolhido = golpe();
  await usarGolpe(mon(), alvo, soco(), true, ctx());
  assert.ok(alvo.hp < 100);
});

test('falha quando o alvo escolheu um golpe de STATUS', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvo = mon(), c = ctx(); alvo.vol.golpeEscolhido = golpe({ name: 'swords-dance', cls: 'status', power: null });
  await usarGolpe(mon(), alvo, soco(), true, c);
  assert.equal(alvo.hp, 100);
  assert.ok(c.msgs.some(m => /falhou/.test(m)));
});

test('falha quando o alvo não escolheu nada (item, fuga, parado) ou quando ele já agiu', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const semEscolha = mon();
  await usarGolpe(mon(), semEscolha, soco(), true, ctx());
  assert.equal(semEscolha.hp, 100, 'sem golpe escolhido');
  const jaAgiu = mon(); jaAgiu.vol.golpeEscolhido = golpe();
  await usarGolpe(mon(), jaAgiu, soco(), false, ctx());          // primeiro = false: o alvo agiu antes
  assert.equal(jaAgiu.hp, 100, 'o alvo já tinha agido');
});

test('a escolha do turno é esquecida no fim da rodada (não vale no turno seguinte)', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvo = mon(); alvo.vol.golpeEscolhido = golpe();
  fimDaRodada(alvo);
  assert.equal(alvo.vol.golpeEscolhido, undefined);
  await usarGolpe(mon(), alvo, soco(), true, ctx());
  assert.equal(alvo.hp, 100);
});

test('um golpe comum de prioridade não é afetado', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvo = mon();                                             // sem escolha registrada
  await usarGolpe(mon(), alvo, golpe({ name: 'quick-attack', priority: 1 }), true, ctx());
  assert.ok(alvo.hp < 100);
});
