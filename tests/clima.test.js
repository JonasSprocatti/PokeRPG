// Clima (regras.CLIMAS + golpe.js): dano de Fogo/Água, castigo de areia/granizo, velocidade, precisão e duração.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLIMAS, CLIMA_TURNOS, climaDe, multClima, danoClima, multStatClima, calcDamage, chanceAcerto, effStat, freshVol } from '../js/regras.js';
import { usarGolpe, fimDeTurno, mudarClima, passarClima } from '../js/golpe.js';
import { HABILIDADES } from '../js/habilidades.js';
import { GOLPES_ESPECIAIS } from '../js/especiais.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const status = (name, o = {}) => golpe({ name, cls: 'status', power: null, acc: null, target: 'user', ...o });
const mon = (o = {}) => ({ level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0,
  stats: { hp: 160, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 }, hp: 160, moves: [], vol: freshVol(), ...o });
const ctx = (campo = { clima: null, turnos: 0 }) => { const msgs = []; return { msgs, campo, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); } }; };

test('climaDe: só vale enquanto tem turno; os 5 climas têm nome, ícone e frases', () => {
  assert.equal(climaDe({ clima: 'sol', turnos: 0 }), null);
  assert.equal(climaDe({ clima: 'sol', turnos: 2 }), 'sol');
  assert.equal(climaDe({ clima: 'furacao', turnos: 5 }), null);
  assert.equal(climaDe(null), null);
  for (const [k, c] of Object.entries(CLIMAS)) assert.ok(c.nome && c.icone && c.comeca && c.acaba, k);
});

test('sol e chuva mexem no dano de Fogo e Água', () => {
  assert.equal(multClima('sol', 'fire'), 1.5);
  assert.equal(multClima('sol', 'water'), 0.5);
  assert.equal(multClima('chuva', 'water'), 1.5);
  assert.equal(multClima('chuva', 'fire'), 0.5);
  assert.equal(multClima('areia', 'fire'), 1);
  assert.equal(multClima(null, 'fire'), 1);
});

test('o dano calculado muda com o clima', t => {
  t.mock.method(Math, 'random', () => 0.5);
  const fogo = golpe({ type: 'fire', cls: 'special' });
  const normal = calcDamage(mon(), mon(), fogo).dmg;
  assert.ok(calcDamage(mon(), mon(), fogo, 'sol').dmg > normal);
  assert.ok(calcDamage(mon(), mon(), fogo, 'chuva').dmg < normal);
});

test('areia e granizo machucam quem não é do tipo certo; neve não machuca ninguém', () => {
  assert.equal(danoClima('areia', mon()), 10);                                   // 1/16 de 160
  assert.equal(danoClima('areia', mon({ data: { types: ['rock'] } })), 0);
  assert.equal(danoClima('areia', mon({ ability: 'magic-guard' })), 0);
  assert.equal(danoClima('granizo', mon({ data: { types: ['ice'] } })), 0);
  assert.equal(danoClima('granizo', mon({ ability: 'ice-body' })), 0);
  assert.equal(danoClima('neve', mon()), 0);
  assert.equal(danoClima('sol', mon()), 0);
});

test('atributos: Swift Swim na chuva, Pedra na areia, Gelo na neve', () => {
  assert.equal(multStatClima(mon({ ability: 'swift-swim' }), 'speed', 'chuva'), 2);
  assert.equal(multStatClima(mon({ ability: 'swift-swim' }), 'speed', 'sol'), 1);
  assert.equal(multStatClima(mon({ ability: 'chlorophyll' }), 'speed', 'sol'), 2);
  assert.equal(multStatClima(mon({ data: { types: ['rock'] } }), 'special-defense', 'areia'), 1.5);
  assert.equal(multStatClima(mon({ data: { types: ['ice'] } }), 'defense', 'neve'), 1.5);
  assert.equal(multStatClima(mon(), 'speed', 'chuva'), 1);
  assert.equal(effStat(mon({ ability: 'swift-swim' }), 'speed', false, true, 'chuva'), 200);
});

test('precisão: Thunder na chuva e no sol, Blizzard no granizo, Sand Veil na areia', () => {
  const thunder = golpe({ name: 'thunder', acc: 70 });
  assert.equal(chanceAcerto(thunder, mon(), mon()), 0.7);
  assert.equal(chanceAcerto(thunder, mon(), mon(), 'chuva'), 1);
  assert.equal(chanceAcerto(thunder, mon(), mon(), 'sol'), 0.5);
  assert.equal(chanceAcerto(golpe({ name: 'blizzard', acc: 70 }), mon(), mon(), 'granizo'), 1);
  assert.ok(Math.abs(chanceAcerto(golpe(), mon(), mon({ ability: 'sand-veil' }), 'areia') - 0.8) < 1e-9);
  assert.equal(chanceAcerto(golpe(), mon(), mon({ ability: 'sand-veil' }), 'chuva'), 1);
});

test('golpes de clima ligam o tempo por 5 turnos e ele acaba sozinho', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const c = ctx();
  await usarGolpe(mon(), mon(), status('rain-dance'), true, c);
  assert.deepEqual([c.campo.clima, c.campo.turnos], ['chuva', CLIMA_TURNOS]);
  for (let i = 0; i < CLIMA_TURNOS - 1; i++) await passarClima(c.campo, c);
  assert.equal(climaDe(c.campo), 'chuva');
  await passarClima(c.campo, c);
  assert.equal(climaDe(c.campo), null);
  assert.ok(c.msgs.some(m => m.includes('A chuva parou')));
  // todo golpe de clima da tabela aponta pra um clima que existe
  for (const [n, e] of Object.entries(GOLPES_ESPECIAIS)) if (e.clima) assert.ok(CLIMAS[e.clima], `${n}: clima "${e.clima}"`);
});

test('fim de turno: areia machuca, chuva cura Rain Dish, Hydration limpa o status', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const areia = ctx({ clima: 'areia', turnos: 3 }), m = mon({ hp: 100 });
  await fimDeTurno(m, areia);
  assert.equal(m.hp, 90);
  const chuva = ctx({ clima: 'chuva', turnos: 3 }), r = mon({ hp: 100, ability: 'rain-dish' });
  await fimDeTurno(r, chuva);
  assert.equal(r.hp, 110);
  const h = mon({ ability: 'hydration', status: 'burn' });
  await fimDeTurno(h, ctx({ clima: 'chuva', turnos: 3 }));
  assert.equal(h.status, null);
});

test('habilidades de clima: ganchos conhecidos e climas válidos', () => {
  const climas = Object.keys(CLIMAS);
  for (const [nome, h] of Object.entries(HABILIDADES)) {
    if (h.climaAoEntrar) assert.ok(climas.includes(h.climaAoEntrar), `${nome}: ${h.climaAoEntrar}`);
    for (const k of Object.keys(h.multStatClima || {})) assert.ok(climas.includes(k), `${nome}: multStatClima ${k}`);
    for (const k of Object.keys(h.curaClima || {})) assert.ok(climas.includes(k), `${nome}: curaClima ${k}`);
    for (const k of Object.keys(h.danoClimaProprio || {})) assert.ok(climas.includes(k), `${nome}: danoClimaProprio ${k}`);
    for (const k of [...(h.imuneClima || []), ...(h.escondeNoClima || [])]) assert.ok(climas.includes(k), `${nome}: ${k}`);
    if (h.curaStatusClima) assert.ok(climas.includes(h.curaStatusClima), nome);
    if (h.semStatusClima) assert.ok(climas.includes(h.semStatusClima), nome);
  }
  assert.equal(HABILIDADES.drizzle.climaAoEntrar, 'chuva');
  assert.equal(HABILIDADES.drought.climaAoEntrar, 'sol');
});

test('Leaf Guard: no sol não pega status', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvo = mon({ ability: 'leaf-guard' });
  await usarGolpe(mon(), alvo, golpe({ name: 'will-o-wisp', cls: 'status', acc: null, target: 'selected-pokemon', meta: { ailment: 'burn', ailChance: 100 } }), true, ctx({ clima: 'sol', turnos: 3 }));
  assert.equal(alvo.status, null);
  const alvo2 = mon({ ability: 'leaf-guard' });
  await usarGolpe(mon(), alvo2, golpe({ name: 'will-o-wisp', cls: 'status', acc: null, target: 'selected-pokemon', meta: { ailment: 'burn', ailChance: 100 } }), true, ctx({ clima: 'chuva', turnos: 3 }));
  assert.equal(alvo2.status, 'burn');
});

test('Solar Beam não precisa carregar no sol', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const sb = golpe({ name: 'solar-beam', type: 'grass', cls: 'special', power: 120 });
  const alvo = mon(), c = ctx({ clima: 'sol', turnos: 3 });
  await usarGolpe(mon(), alvo, sb, true, c);
  assert.ok(alvo.hp < 160, 'no sol o golpe sai na hora');
  const alvo2 = mon(), semSol = ctx();
  await usarGolpe(mon(), alvo2, golpe({ name: 'solar-beam', type: 'grass', cls: 'special', power: 120 }), true, semSol);
  assert.equal(alvo2.hp, 160, 'sem sol, o primeiro turno é só carregar');
});
