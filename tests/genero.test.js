// Gênero: o sorteio puro (regras.sortearGenero) e as 4 mecânicas que leem dele — Attract/Cute Charm (paixão),
// Captivate (só gênero oposto), Rivalry (×1,25 / ×0,75) e a evolução presa a um gênero (Vespiquen, Mothim).
// Chance se testa FIXANDO o sorteio, nunca por amostragem (CLAUDE.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshVol, sortearGenero, mesmoGenero, generoOposto, calcDamage } from '../js/regras.js';
import { usarGolpe, aplicarStatus } from '../js/golpe.js';
import { detalheCumprido } from '../js/evolucao.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const mon = (o = {}) => ({ level: 50, name: 'pidgey', ability: 'none', data: { types: ['normal'], base: { hp: 80, attack: 80, defense: 80, 'special-attack': 80, 'special-defense': 80, speed: 80 } },
  status: null, sleep: 0, stats: { hp: 300, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 }, hp: 300, moves: [], vol: freshVol(), ...o });
const ctx = () => { const msgs = []; return { msgs, campo: { clima: null, turnos: 0 }, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); } }; };

test('sortearGenero lê a taxa da espécie em oitavos', () => {
  assert.equal(sortearGenero(-1), null, 'sem gênero');
  assert.equal(sortearGenero(undefined), null, 'taxa faltando (cache antigo) = sem gênero');
  assert.equal(sortearGenero(0, '', 0.99), 'm', 'taxa 0 = sempre macho');
  assert.equal(sortearGenero(8, '', 0.0), 'f', 'taxa 8 = sempre fêmea');
  assert.equal(sortearGenero(1, '', 0.12), 'f', 'taxa 1 = 12,5% fêmea, logo abaixo do limiar');
  assert.equal(sortearGenero(1, '', 0.13), 'm', 'taxa 1, logo acima do limiar');
  assert.equal(sortearGenero(4, '', 0.49), 'f');
  assert.equal(sortearGenero(4, '', 0.51), 'm');
});

test('forma presa a um gênero manda sobre a taxa da espécie', () => {
  assert.equal(sortearGenero(4, 'meowstic-female', 0.99), 'f');
  assert.equal(sortearGenero(4, 'basculegion-male', 0.0), 'm');
  assert.equal(sortearGenero(4, 'meowstic', 0.0), 'f', 'forma padrão continua no sorteio');
});

test('mesmoGenero/generoOposto: quem não tem gênero nunca casa', () => {
  const m = { genero: 'm' }, f = { genero: 'f' }, nada = { genero: null }, velho = {};
  assert.ok(mesmoGenero(m, { genero: 'm' }));
  assert.ok(!mesmoGenero(nada, nada));
  assert.ok(!mesmoGenero(velho, velho), 'save de antes do gênero');
  assert.ok(generoOposto(m, f) && generoOposto(f, m));
  assert.ok(!generoOposto(m, nada));
  assert.ok(!generoOposto(m, velho));
});

test('Attract apaixona o gênero oposto e falha no mesmo (e em quem não tem)', async () => {
  const atrair = golpe({ name: 'attract', cls: 'status', power: null, meta: { ailment: 'infatuation', ailChance: 0 } });
  const c = ctx(), u = mon({ nome: 'U', genero: 'm' }), alvo = mon({ nome: 'T', genero: 'f' });
  await usarGolpe(u, alvo, atrair, true, c);
  assert.equal(alvo.vol.paixao, true);
  assert.ok(c.msgs.some(m => m.includes('se apaixonou')));

  const c2 = ctx(), igual = mon({ nome: 'T', genero: 'm' });
  await usarGolpe(mon({ nome: 'U', genero: 'm' }), igual, atrair, true, c2);
  assert.equal(igual.vol.paixao, false);

  const c3 = ctx(), sem = mon({ nome: 'T', genero: null });
  await usarGolpe(mon({ nome: 'U', genero: 'm' }), sem, atrair, true, c3);
  assert.equal(sem.vol.paixao, false);
});

test('Oblivious e Aroma Veil não se apaixonam', async () => {
  for (const ability of ['oblivious', 'aroma-veil']) {
    const c = ctx(), alvo = mon({ nome: 'T', genero: 'f', ability });
    await aplicarStatus(alvo, 'infatuation', c, true, mon({ nome: 'U', genero: 'm' }));
    assert.equal(alvo.vol.paixao, false, ability);
  }
});

test('apaixonado perde a vez em metade dos turnos', async t => {
  t.mock.method(Math, 'random', () => 0.49);                 // abaixo de 0,5: imobilizado
  const c = ctx(), u = mon({ nome: 'U', vol: { ...freshVol(), paixao: true } }), alvo = mon({ nome: 'T' });
  await usarGolpe(u, alvo, golpe(), true, c);
  assert.equal(alvo.hp, alvo.stats.hp, 'não atacou');
  assert.ok(c.msgs.some(m => m.includes('imobilizado')));

  t.mock.restoreAll();
  t.mock.method(Math, 'random', () => 0.51);                 // acima de 0,5: ataca normalmente
  const c2 = ctx(), u2 = mon({ nome: 'U', vol: { ...freshVol(), paixao: true } }), alvo2 = mon({ nome: 'T' });
  await usarGolpe(u2, alvo2, golpe(), true, c2);
  assert.ok(alvo2.hp < alvo2.stats.hp, 'atacou');
});

test('Captivate só funciona em quem é do gênero oposto', async () => {
  const cativar = golpe({ name: 'captivate', cls: 'status', power: null, target: 'all-opponents', stats: [{ stat: 'special-attack', change: -2 }] });
  const c = ctx(), alvo = mon({ nome: 'T', genero: 'f' });
  await usarGolpe(mon({ nome: 'U', genero: 'm' }), alvo, cativar, true, c);
  assert.equal(alvo.vol.stages['special-attack'], -2);

  const c2 = ctx(), igual = mon({ nome: 'T', genero: 'm' });
  await usarGolpe(mon({ nome: 'U', genero: 'm' }), igual, cativar, true, c2);
  assert.equal(igual.vol.stages['special-attack'], 0, 'mesmo gênero: não afeta');
});

test('Rivalry: ×1,25 no mesmo gênero, ×0,75 no oposto, ×1 sem gênero', () => {
  const dano = (gu, gt) => calcDamage(mon({ ability: 'rivalry', genero: gu }), mon({ genero: gt }), golpe(), null, null, null, true).dmg;
  const neutro = calcDamage(mon({ genero: 'm' }), mon({ genero: 'm' }), golpe(), null, null, null, true).dmg;
  assert.ok(dano('m', 'm') > neutro, 'mesmo gênero bate mais');
  assert.ok(dano('m', 'f') < neutro, 'gênero oposto bate menos');
  assert.equal(dano(null, null), neutro, 'sem gênero: nada muda');
});

test('evolução presa a um gênero (gender 1 = fêmea, 2 = macho)', () => {
  const d = g => ({ trigger: 'level-up', min_level: 21, gender: g });
  const c = { gatilho: 'level-up', hora: 12, aliados: [], bag: {} };
  const M = genero => ({ level: 30, moves: [], stats: { attack: 10, defense: 10 }, genero });
  assert.ok(detalheCumprido(d(1), M('f'), c), 'fêmea → Vespiquen');
  assert.equal(detalheCumprido(d(1), M('m'), c), null, 'macho não vira Vespiquen');
  assert.ok(detalheCumprido(d(2), M('m'), c), 'macho → Mothim');
  assert.equal(detalheCumprido(d(2), M(null), c), null, 'sem gênero não cumpre');
  assert.equal(detalheCumprido(d(1), { level: 30, moves: [], stats: { attack: 10, defense: 10 } }, c), null, 'save antigo não cumpre');
});
