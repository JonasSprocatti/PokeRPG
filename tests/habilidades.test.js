// Habilidades (js/habilidades.js) no motor único (js/golpe.js) e nas contas (js/regras.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HABILIDADES, IMPL } from '../js/habilidades.js';
import { usarGolpe, mudarEstagios, aplicarStatus, fimDeTurno } from '../js/golpe.js';
import { calcDamage, effStat, chanceAcerto, freshVol } from '../js/regras.js';
import { TYPE_PT, AIL_MSG, STATS } from '../js/dados.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const mon = (o = {}) => ({
  level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0,
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, moves: [golpe()], vol: freshVol(), ...o
});
// narração que só coleta texto (igual à do multiplayer)
const ctx = () => { const msgs = []; return { msgs, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); } }; };

test('tabela: ganchos conhecidos, tipos e status válidos', () => {
  const ganchos = new Set(['pinch', 'stab', 'tecnico', 'critico', 'multStat', 'comStatus', 'precisao', 'precisaoFisica', 'resiste', 'superEfetivo',
    'poucoEfetivo', 'hpCheio', 'imuneTipo', 'absorve', 'cura', 'estagio', 'flashFire', 'soSuperEfetivo', 'imuneStatus', 'semQueda', 'semRecuo',
    'contato', 'contatoDano', 'aguenta', 'semDanoRecuo', 'maxAcertos', 'chanceSecundaria', 'semSecundario', 'sonoRapido', 'fimTurno',
    'curaStatusFimTurno', 'intimida', 'fuga',
    // clima (regras.CLIMAS)
    'climaAoEntrar', 'multStatClima', 'curaClima', 'danoClimaProprio', 'imuneClima', 'escondeNoClima', 'curaStatusClima', 'semStatusClima']);
  const tipos = Object.keys(TYPE_PT);
  for (const [nome, h] of Object.entries(HABILIDADES)) {
    for (const k of Object.keys(h)) assert.ok(ganchos.has(k), `${nome}: gancho desconhecido "${k}" (não faz nada no motor)`);
    for (const t of [h.pinch, h.imuneTipo, h.absorve, ...Object.keys(h.resiste || {})].filter(Boolean)) assert.ok(tipos.includes(t), `${nome}: tipo "${t}"`);
    for (const a of h.imuneStatus || []) assert.ok(AIL_MSG[a] || a === 'confusion', `${nome}: status "${a}"`);
    for (const s of Object.keys({ ...h.multStat, ...h.comStatus })) assert.ok(STATS.includes(s), `${nome}: atributo "${s}"`);
  }
  assert.ok(IMPL.size >= 50);
  // cada habilidade aparece UMA vez na tabela: a segunda apagaria a primeira em silêncio (aconteceu com dry-skin)
  const fonte = readFileSync(new URL('../js/habilidades.js', import.meta.url), 'utf8');
  const bloco = fonte.slice(fonte.indexOf('export const HABILIDADES'), fonte.indexOf('export const hab'));
  const escritas = [...bloco.matchAll(/(?:^|[{,]\s*)'?([a-z][a-z0-9-]*)'?\s*:\s*\{/gm)].map(m => m[1]).filter(n => HABILIDADES[n]);
  const vistas = new Set();
  for (const n of escritas) { assert.ok(!vistas.has(n), `${n}: escrita mais de uma vez na tabela`); vistas.add(n); }
});

test('Levitate: golpe Terrestre não afeta', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvo = mon({ ability: 'levitate' });
  await usarGolpe(mon(), alvo, golpe({ type: 'ground' }), true, ctx());
  assert.equal(alvo.hp, 100);
});

test('Volt Absorb cura; Lightning Rod sobe At. Esp.; Flash Fire liga o bônus', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const volt = mon({ ability: 'volt-absorb', hp: 50 });
  await usarGolpe(mon(), volt, golpe({ type: 'electric' }), true, ctx());
  assert.equal(volt.hp, 75);
  const rod = mon({ ability: 'lightning-rod' });
  await usarGolpe(mon(), rod, golpe({ type: 'electric' }), true, ctx());
  assert.equal(rod.hp, 100); assert.equal(rod.vol.stages['special-attack'], 1);
  const ff = mon({ ability: 'flash-fire' });
  await usarGolpe(mon(), ff, golpe({ type: 'fire' }), true, ctx());
  assert.equal(ff.vol.flashFire, true);
});

test('Wonder Guard: só super efetivo acerta', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const wg = mon({ ability: 'wonder-guard', data: { types: ['bug'] } });
  await usarGolpe(mon(), wg, golpe({ type: 'normal' }), true, ctx());
  assert.equal(wg.hp, 100);
  await usarGolpe(mon(), wg, golpe({ type: 'fire' }), true, ctx());
  assert.ok(wg.hp < 100);
});

test('Sturdy: com HP cheio, sobrevive com 1', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const s = mon({ ability: 'sturdy', stats: { ...mon().stats, hp: 10 }, hp: 10 });
  await usarGolpe(mon(), s, golpe({ power: 200 }), true, ctx());
  assert.equal(s.hp, 1);
});

test('Static paralisa quem encosta; Rough Skin machuca quem encosta', async t => {
  t.mock.method(Math, 'random', () => 0); // chance de contato passa
  const atacante = mon();
  await usarGolpe(atacante, mon({ ability: 'static' }), golpe(), true, ctx());
  assert.equal(atacante.status, 'paralysis');
  const outro = mon();
  await usarGolpe(outro, mon({ ability: 'rough-skin' }), golpe(), true, ctx());
  assert.equal(outro.hp, 100 - Math.floor(100 / 8));
  const especial = mon();
  await usarGolpe(especial, mon({ ability: 'rough-skin' }), golpe({ cls: 'special' }), true, ctx());
  assert.equal(especial.hp, 100); // golpe especial não encosta
});

test('Clear Body: outro não baixa atributo; o próprio golpe/itens ainda mexem', async () => {
  const cb = mon({ ability: 'clear-body' }), c = ctx();
  await mudarEstagios(cb, [{ stat: 'attack', change: -1 }], c, mon());
  assert.equal(cb.vol.stages.attack, 0);
  assert.ok(c.msgs.some(m => m.includes('impede')));
  await mudarEstagios(cb, [{ stat: 'attack', change: -1 }], ctx()); // sem fonte (ex.: efeito próprio)
  assert.equal(cb.vol.stages.attack, -1);
  const hc = mon({ ability: 'hyper-cutter' });
  await mudarEstagios(hc, [{ stat: 'attack', change: -1 }, { stat: 'defense', change: -1 }], ctx(), mon());
  assert.deepEqual([hc.vol.stages.attack, hc.vol.stages.defense], [0, -1]);
});

test('imunidade a status por habilidade (e confusão com Own Tempo)', async () => {
  const im = mon({ ability: 'immunity' });
  await aplicarStatus(im, 'poison', ctx(), true);
  assert.equal(im.status, null);
  const ot = mon({ ability: 'own-tempo' });
  await aplicarStatus(ot, 'confusion', ctx(), true);
  assert.equal(ot.vol.conf, 0);
  const normal = mon();
  await aplicarStatus(normal, 'poison', ctx());
  assert.equal(normal.status, 'poison');
});

test('Rock Head: sem dano de recuo', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const rh = mon({ ability: 'rock-head' });
  await usarGolpe(rh, mon(), golpe({ meta: { drain: -33 } }), true, ctx());
  assert.equal(rh.hp, 100);
  const sem = mon();
  await usarGolpe(sem, mon(), golpe({ meta: { drain: -33 } }), true, ctx());
  assert.ok(sem.hp < 100);
});

test('fim de turno: Speed Boost sobe Velocidade; Shed Skin pode curar', async t => {
  t.mock.method(Math, 'random', () => 0);
  const sb = mon({ ability: 'speed-boost' });
  await fimDeTurno(sb, ctx());
  assert.equal(sb.vol.stages.speed, 1);
  const ss = mon({ ability: 'shed-skin', status: 'burn' });
  await fimDeTurno(ss, ctx());
  assert.equal(ss.status, null);
  assert.equal(ss.hp, 100); // curou antes da queimadura machucar
});

test('contas: Technician, Thick Fat, Huge Power, Quick Feet, Compound Eyes, Multiscale', t => {
  t.mock.method(Math, 'random', () => 0.99); // sem crítico, rolagem máxima
  const base = calcDamage(mon(), mon(), golpe({ type: 'fire' })).dmg;
  assert.ok(calcDamage(mon({ ability: 'technician' }), mon(), golpe({ type: 'fire' })).dmg > base);
  assert.ok(calcDamage(mon(), mon({ ability: 'thick-fat' }), golpe({ type: 'fire' })).dmg < base);
  assert.ok(calcDamage(mon(), mon({ ability: 'multiscale' }), golpe({ type: 'fire' })).dmg < base);
  assert.ok(calcDamage(mon(), mon({ ability: 'multiscale', hp: 99 }), golpe({ type: 'fire' })).dmg === base); // só com HP cheio
  assert.equal(effStat(mon({ ability: 'huge-power' }), 'attack'), 200);
  assert.equal(effStat(mon({ ability: 'quick-feet', status: 'paralysis' }), 'speed'), 150); // e ignora a queda da paralisia
  assert.equal(effStat(mon({ status: 'paralysis' }), 'speed'), 50);
  assert.ok(Math.abs(chanceAcerto(golpe({ acc: 70 }), mon({ ability: 'compound-eyes' }), mon()) - 0.91) < 1e-9);
});
