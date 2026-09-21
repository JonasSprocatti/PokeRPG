// Fórmulas de js/regras.js. Rodar: `node --test` (sem caminho) na raiz do projeto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  typeEff, natureMod, natureLabel, calcStats, recalc, freshVol, stageMul, effStat, defaultMoves,
  calcDamage, confDamage, heal, chanceAcerto, imuneAoStatus, danoResidual, consegueFugir,
  jogadorAgePrimeiro, xpPorVitoria, ganhoDeEVs
} from '../js/regras.js';

const zeros = () => ({ hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 });
// Pokémon mínimo pra batalha: stats já prontos (100 em tudo), tipo Normal, sem status
const mon = (o = {}) => ({
  level: 50, data: { base: { hp: 100 }, types: ['normal'] }, ivs: zeros(), evs: zeros(), nature: 'hardy',
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, status: null, ability: 'none', vol: freshVol(), ...o
});
const golpe = (o = {}) => ({ name: 'teste', type: 'fire', cls: 'physical', power: 100, acc: 100, priority: 0, meta: {}, stats: [], ...o });

test('typeEff: tabela de tipos Gen 6+', () => {
  assert.equal(typeEff('fire', ['grass']), 2);
  assert.equal(typeEff('fire', ['grass', 'steel']), 4);
  assert.equal(typeEff('water', ['water', 'grass']), 0.25);
  assert.equal(typeEff('normal', ['ghost']), 0);
  assert.equal(typeEff('electric', ['water', 'ground']), 0);
  assert.equal(typeEff('dragon', ['fairy']), 0);
  assert.equal(typeEff('fire', ['normal']), 1);
  assert.equal(typeEff('tipo-inexistente', ['grass']), 1);
});

test('natureza: +10% / −10% e rótulo', () => {
  assert.equal(natureMod('adamant', 'attack'), 1.1);
  assert.equal(natureMod('adamant', 'special-attack'), 0.9);
  assert.equal(natureMod('adamant', 'speed'), 1);
  assert.equal(natureMod('hardy', 'attack'), 1);
  assert.equal(natureLabel('adamant'), 'Adamant (+Ataque −At. Esp.)');
  assert.equal(natureLabel('hardy'), 'Hardy (neutra)');
});

test('calcStats: bate com o exemplo oficial (Garchomp Nv. 78, Adamant — Bulbapedia)', () => {
  const g = {
    level: 78, nature: 'adamant',
    data: { base: { hp: 108, attack: 130, defense: 95, 'special-attack': 80, 'special-defense': 85, speed: 102 } },
    ivs: { hp: 24, attack: 12, defense: 30, 'special-attack': 16, 'special-defense': 23, speed: 5 },
    evs: { hp: 74, attack: 190, defense: 91, 'special-attack': 48, 'special-defense': 84, speed: 23 }
  };
  assert.deepEqual(calcStats(g), { hp: 289, attack: 278, defense: 193, 'special-attack': 135, 'special-defense': 171, speed: 171 });
});

test('calcStats: HP base 1 (Shedinja) é sempre 1', () => {
  const s = calcStats({ level: 50, nature: 'hardy', data: { base: { ...zeros(), hp: 1 } }, ivs: zeros(), evs: zeros() });
  assert.equal(s.hp, 1);
});

test('recalc: subir de nível mantém o dano sofrido', () => {
  const m = { level: 10, nature: 'hardy', data: { base: { hp: 50, attack: 50, defense: 50, 'special-attack': 50, 'special-defense': 50, speed: 50 } }, ivs: zeros(), evs: zeros() };
  m.stats = calcStats(m); m.hp = m.stats.hp - 5;
  m.level = 20; recalc(m);
  assert.equal(m.hp, m.stats.hp - 5);
});

test('stageMul: estágios −6..+6', () => {
  assert.equal(stageMul(0), 1);
  assert.equal(stageMul(1), 1.5);
  assert.equal(stageMul(6), 4);
  assert.equal(stageMul(-1), 2 / 3);
  assert.equal(stageMul(-6), 0.25);
});

test('effStat: paralisia, Guts, crítico ignora estágio ruim, mínimo 1', () => {
  assert.equal(effStat(mon({ status: 'paralysis' }), 'speed'), 50);
  assert.equal(effStat(mon({ status: 'burn', ability: 'guts' }), 'attack'), 150);
  const baixo = mon(); baixo.vol.stages.attack = -2;
  assert.equal(effStat(baixo, 'attack'), 50);
  assert.equal(effStat(baixo, 'attack', true, true), 100); // crítico ignora queda de ataque de quem bate
  const alto = mon(); alto.vol.stages.defense = 2;
  assert.equal(effStat(alto, 'defense', true, false), 100); // crítico ignora defesa elevada do alvo
  assert.equal(effStat(mon({ stats: { ...mon().stats, speed: 0 } }), 'speed'), 1);
});

test('defaultMoves: os 4 mais recentes até o nível, sem repetir, em ordem de nível', () => {
  const list = [1, 5, 9, 13, 17, 21].map(l => ({ name: 'g' + l, url: '', level: l }));
  assert.deepEqual(defaultMoves(list, 15).map(m => m.name), ['g1', 'g5', 'g9', 'g13']);
  assert.deepEqual(defaultMoves(list, 21).map(m => m.name), ['g9', 'g13', 'g17', 'g21']);
  assert.deepEqual(defaultMoves([{ name: 'a', level: 1 }, { name: 'a', level: 1 }], 5).map(m => m.name), ['a']);
  assert.deepEqual(defaultMoves([{ name: 'tarde', level: 40 }], 5).map(m => m.name), ['tarde']); // nada até o nível → o primeiro da lista
  assert.equal(defaultMoves([], 5)[0].name, 'tackle');
});

test('calcDamage: fórmula oficial, sem crítico e com rolagem máxima', t => {
  t.mock.method(Math, 'random', () => 0.99); // sem crítico, rand(85,100) = 100
  // Nv 50, poder 100, A = D = 100 → floor(floor(22*100*100/100)/50)+2 = 46
  assert.equal(calcDamage(mon(), mon(), golpe({ type: 'normal' })).dmg, 69);            // com STAB (Normal usando Normal) ×1,5
  assert.equal(calcDamage(mon(), mon(), golpe()).dmg, 46);                               // Fogo em Normal: neutro, sem STAB
  assert.equal(calcDamage(mon(), mon({ data: { types: ['grass'] } }), golpe()).dmg, 92); // super efetivo
  assert.equal(calcDamage(mon({ status: 'burn' }), mon(), golpe()).dmg, 23);             // queimadura corta físico pela metade
  assert.equal(calcDamage(mon({ status: 'burn' }), mon(), golpe({ cls: 'special' })).dmg, 46); // …mas não especial
  assert.equal(calcDamage(mon({ ability: 'adaptability' }), mon(), golpe({ type: 'normal' })).dmg, 92); // STAB ×2
  assert.equal(calcDamage(mon(), mon(), golpe()).crit, false);
});

test('calcDamage: crítico ×1,5 e rolagem mínima 85%', t => {
  t.mock.method(Math, 'random', () => 0); // crítico sempre, rand(85,100) = 85
  const r = calcDamage(mon(), mon(), golpe());
  assert.equal(r.crit, true);
  assert.equal(r.dmg, Math.floor(46 * 1.5 * 0.85));
});

test('calcDamage: pinch (Blaze com ≤1/3 de HP) e Flash Fire', t => {
  t.mock.method(Math, 'random', () => 0.99);
  assert.equal(calcDamage(mon({ ability: 'blaze', hp: 33 }), mon(), golpe()).dmg, 69);
  assert.equal(calcDamage(mon({ ability: 'blaze', hp: 34 }), mon(), golpe()).dmg, 46);
  const ff = mon(); ff.vol.flashFire = true;
  assert.equal(calcDamage(ff, mon(), golpe()).dmg, 69);
});

test('calcDamage: golpes de dano fixo', () => {
  assert.deepEqual(calcDamage(mon({ level: 37 }), mon(), golpe({ name: 'seismic-toss' })), { dmg: 37, crit: false });
  assert.equal(calcDamage(mon(), mon(), golpe({ name: 'dragon-rage' })).dmg, 40);
  assert.equal(calcDamage(mon(), mon({ hp: 51 }), golpe({ name: 'super-fang' })).dmg, 25);
  assert.equal(calcDamage(mon(), mon({ hp: 1 }), golpe({ name: 'super-fang' })).dmg, 1); // nunca 0
});

test('confDamage: golpe de poder 40 em si mesmo, sem tipo', () => {
  assert.equal(confDamage(mon()), Math.floor(Math.floor(22 * 40) / 50) + 2);
});

test('heal: não passa do máximo', () => {
  const m = mon({ hp: 90 }); heal(m, 50);
  assert.equal(m.hp, 100);
});

test('chanceAcerto: precisão × estágio (precisão de quem usa − evasão do alvo)', () => {
  assert.equal(chanceAcerto(golpe(), mon(), mon()), 1);
  assert.equal(chanceAcerto(golpe({ acc: 90 }), mon(), mon()), 0.9);
  const mira = mon(); mira.vol.stages.accuracy = 1;
  assert.equal(chanceAcerto(golpe(), mira, mon()), 4 / 3);
  const esquiva = mon(); esquiva.vol.stages.evasion = 1;
  assert.equal(chanceAcerto(golpe(), mon(), esquiva), 0.75);
  const muito = mon(); muito.vol.stages.evasion = 6; const ruim = mon(); ruim.vol.stages.accuracy = -6;
  assert.equal(chanceAcerto(golpe(), ruim, muito), 3 / 9); // diferença limitada a −6
});

test('imuneAoStatus: imunidades de tipo', () => {
  assert.equal(imuneAoStatus(['electric'], 'paralysis'), true);
  assert.equal(imuneAoStatus(['fire'], 'burn'), true);
  assert.equal(imuneAoStatus(['ice'], 'freeze'), true);
  assert.equal(imuneAoStatus(['steel'], 'poison'), true);
  assert.equal(imuneAoStatus(['grass', 'poison'], 'poison'), true);
  assert.equal(imuneAoStatus(['water'], 'burn'), false);
  assert.equal(imuneAoStatus(['electric'], 'sleep'), false);
});

test('danoResidual: queimadura 1/16, veneno 1/8', () => {
  const s = { ...mon().stats, hp: 160 };
  assert.equal(danoResidual(mon({ stats: s, status: 'burn' })), 10);
  assert.equal(danoResidual(mon({ stats: s, status: 'poison' })), 20);
  assert.equal(danoResidual(mon({ stats: s, status: 'paralysis' })), 0);
  assert.equal(danoResidual(mon({ stats: s })), 0);
});

test('consegueFugir: Run Away, mais rápido, e a chance que cresce a cada tentativa', () => {
  assert.equal(consegueFugir(10, 100, 1, 'run-away', 0.999), true);
  assert.equal(consegueFugir(100, 100, 1, 'none', 0.999), true);
  // vel 50 contra 100: limiar floor(50*128/100) + 30×tentativas = 64 + 30 = 94 (de 256)
  assert.equal(consegueFugir(50, 100, 1, 'none', 93 / 256), true);
  assert.equal(consegueFugir(50, 100, 1, 'none', 94 / 256), false);
  assert.equal(consegueFugir(50, 100, 2, 'none', 94 / 256), true);
});

test('jogadorAgePrimeiro: prioridade > velocidade > moeda', () => {
  assert.equal(jogadorAgePrimeiro({ priority: 1 }, { priority: 0 }, 10, 100), true);
  assert.equal(jogadorAgePrimeiro({ priority: 0 }, { priority: 1 }, 100, 10), false);
  assert.equal(jogadorAgePrimeiro({}, {}, 100, 10), true);
  assert.equal(jogadorAgePrimeiro({}, {}, 10, 100), false);
  assert.equal(jogadorAgePrimeiro({}, {}, 50, 50, 0.4), true);
  assert.equal(jogadorAgePrimeiro({}, {}, 50, 50, 0.6), false);
});

test('xpPorVitoria: base × nível / 7, mínimo 1', () => {
  assert.equal(xpPorVitoria({ level: 7, data: { baseExp: 64 } }), 64);
  assert.equal(xpPorVitoria({ level: 2, data: { baseExp: 1 } }), 1);
});

test('ganhoDeEVs: teto de 252 por atributo e 510 no total, sem mutar', () => {
  const evs = zeros(); evs.attack = 251;
  assert.deepEqual(ganhoDeEVs(evs, { attack: 2, speed: 1 }), [['attack', 1], ['speed', 1]]);
  assert.equal(evs.attack, 251);
  const quase = { ...zeros(), attack: 252, defense: 252, speed: 5 }; // 509
  assert.deepEqual(ganhoDeEVs(quase, { speed: 3, hp: 3 }), [['speed', 1]]);
  assert.deepEqual(ganhoDeEVs(zeros(), {}), []);
});
