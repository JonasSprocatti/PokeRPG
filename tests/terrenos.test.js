// Terrenos (regras.TERRENOS + golpe.js): bônus de tipo, cura da grama, bloqueio de status e de prioridade,
// e a regra de ouro — só vale pra quem está no chão.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TERRENOS, TERRENO_TURNOS, terrenoDe, multTerreno, terrenoBloqueiaStatus, noChao, multStatTerreno,
  calcDamage, effStat, freshVol } from '../js/regras.js';
import { usarGolpe, fimDeTurno, passarTerreno } from '../js/golpe.js';
import { HABILIDADES } from '../js/habilidades.js';
import { GOLPES_ESPECIAIS } from '../js/especiais.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const status = (name, o = {}) => golpe({ name, cls: 'status', power: null, acc: null, target: 'user', ...o });
const mon = (o = {}) => ({ level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0,
  stats: { hp: 160, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 }, hp: 160, moves: [], vol: freshVol(), ...o });
const ctx = (campo = {}) => { const msgs = []; return { msgs, campo, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); } }; };
const voador = o => mon({ data: { types: ['flying'] }, ...o });

test('os 4 terrenos têm nome, ícone e frases; terrenoDe só vale com turno', () => {
  assert.deepEqual(Object.keys(TERRENOS).sort(), ['eletrico', 'fada', 'grama', 'psiquico']);
  for (const [k, t] of Object.entries(TERRENOS)) assert.ok(t.nome && t.icone && t.comeca && t.acaba, k);
  assert.equal(terrenoDe({ terreno: 'grama', terrenoTurnos: 0 }), null);
  assert.equal(terrenoDe({ terreno: 'grama', terrenoTurnos: 2 }), 'grama');
  assert.equal(terrenoDe({ terreno: 'lava', terrenoTurnos: 3 }), null);
});

test('quem está no chão: Voador e Levitate ficam de fora', () => {
  assert.equal(noChao(mon()), true);
  assert.equal(noChao(voador()), false);
  assert.equal(noChao(mon({ ability: 'levitate' })), false);
});

test('bônus de tipo só pra quem está no chão', () => {
  assert.equal(multTerreno('eletrico', 'electric', mon()), 1.3);
  assert.equal(multTerreno('eletrico', 'electric', voador()), 1);      // flutuando não ganha nada
  assert.equal(multTerreno('grama', 'grass', mon()), 1.3);
  assert.equal(multTerreno('psiquico', 'psychic', mon()), 1.3);
  assert.equal(multTerreno('fada', 'dragon', mon()), 0.5);
  assert.equal(multTerreno('fada', 'fairy', mon()), 1);
  assert.equal(multTerreno(null, 'electric', mon()), 1);
});

test('o dano calculado sente o terreno', t => {
  t.mock.method(Math, 'random', () => 0.5);
  const raio = golpe({ type: 'electric', cls: 'special' });
  const base = calcDamage(mon(), mon(), raio).dmg;
  assert.ok(calcDamage(mon(), mon(), raio, null, 'eletrico').dmg > base);
  assert.equal(calcDamage(voador(), mon(), raio, null, 'eletrico').dmg, calcDamage(voador(), mon(), raio).dmg);
});

test('status: Campo Elétrico tira o sono, Campo de Névoa tira tudo — só de quem está no chão', () => {
  assert.equal(terrenoBloqueiaStatus('eletrico', mon(), 'sleep'), true);
  assert.equal(terrenoBloqueiaStatus('eletrico', mon(), 'burn'), false);
  assert.equal(terrenoBloqueiaStatus('eletrico', voador(), 'sleep'), false);
  assert.equal(terrenoBloqueiaStatus('fada', mon(), 'burn'), true);
  assert.equal(terrenoBloqueiaStatus('grama', mon(), 'burn'), false);
  assert.equal(terrenoBloqueiaStatus(null, mon(), 'sleep'), false);
});

test('Campo de Grama cura quem está no chão no fim do turno', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const m = mon({ hp: 100 });
  await fimDeTurno(m, ctx({ terreno: 'grama', terrenoTurnos: 3 }));
  assert.equal(m.hp, 110);
  const v = voador({ hp: 100 });
  await fimDeTurno(v, ctx({ terreno: 'grama', terrenoTurnos: 3 }));
  assert.equal(v.hp, 100);
});

test('Campo Psíquico barra golpe de prioridade em quem está no chão', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const rapido = golpe({ name: 'quick-attack', priority: 1 });
  const alvo = mon();
  await usarGolpe(mon(), alvo, rapido, true, ctx({ terreno: 'psiquico', terrenoTurnos: 3 }));
  assert.equal(alvo.hp, 160);
  const alvoVoador = voador();
  await usarGolpe(mon(), alvoVoador, golpe({ name: 'quick-attack', priority: 1 }), true, ctx({ terreno: 'psiquico', terrenoTurnos: 3 }));
  assert.ok(alvoVoador.hp < 160, 'quem voa não é protegido pelo chão');
});

test('golpe de terreno liga por 5 turnos e acaba sozinho', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const c = ctx({});
  await usarGolpe(mon(), mon(), status('grassy-terrain'), true, c);
  assert.deepEqual([c.campo.terreno, c.campo.terrenoTurnos], ['grama', TERRENO_TURNOS]);
  for (let i = 0; i < TERRENO_TURNOS; i++) await passarTerreno(c.campo, c);
  assert.equal(terrenoDe(c.campo), null);
  assert.ok(c.msgs.some(m => m.includes('murchou')));
  for (const [n, e] of Object.entries(GOLPES_ESPECIAIS)) if (e.terreno) assert.ok(TERRENOS[e.terreno], `${n}: terreno "${e.terreno}"`);
});

test('habilidades de terreno: ligam o campo e o Surge Surfer corre mais', () => {
  const terrenos = Object.keys(TERRENOS);
  for (const [nome, h] of Object.entries(HABILIDADES)) {
    if (h.terrenoAoEntrar) assert.ok(terrenos.includes(h.terrenoAoEntrar), `${nome}: ${h.terrenoAoEntrar}`);
    for (const k of Object.keys(h.multStatTerreno || {})) assert.ok(terrenos.includes(k), `${nome}: ${k}`);
  }
  assert.equal(HABILIDADES['electric-surge'].terrenoAoEntrar, 'eletrico');
  assert.equal(multStatTerreno(mon({ ability: 'surge-surfer' }), 'speed', 'eletrico'), 2);
  assert.equal(multStatTerreno(voador({ ability: 'surge-surfer' }), 'speed', 'eletrico'), 1);
  assert.equal(effStat(mon({ ability: 'surge-surfer' }), 'speed', false, true, null, 'eletrico'), 200);
});
