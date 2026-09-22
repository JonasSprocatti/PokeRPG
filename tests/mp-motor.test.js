// Motor da batalha multiplayer (js/mp-motor.js): dois lados com N Pokémon, estado imutável, narração em texto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fotoDoMon, novaBatalhaMP, resolverTurnoMP, acaoDaIA, monMP } from '../js/mp-motor.js';
import { freshVol } from '../js/regras.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], desc: 'longo…', ...o });
const pokemon = (o = {}) => ({
  id: 1, name: 'teste', nick: '', level: 50, ability: 'none', shiny: false,
  data: { types: ['normal'], sprite: 's', back: 'b', speciesName: 'teste', baseExp: 60, effort: { attack: 1 } },
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, status: null, sleep: 0, moves: [golpe()], vol: freshVol(), ...o
});
const batalha = (a = [pokemon()], b = [pokemon()]) =>
  novaBatalhaMP(a.map((p, i) => fotoDoMon(p, 'A' + i, 'jogador' + i)), b.map((p, i) => fotoDoMon(p, 'B' + i, 'ia', 'Selvagem ' + i)));

test('fotoDoMon: cópia enxuta, sem descrição dos golpes, estágios zerados', () => {
  const f = fotoDoMon(pokemon({ nick: 'Kipo' }), 'A0', 'u1');
  assert.equal(f.nome, 'Kipo'); assert.equal(f.ref, 'A0'); assert.equal(f.dono, 'u1');
  assert.equal(f.moves[0].desc, undefined);
  assert.equal(f.vol.stages.attack, 0);
});

test('turno: dano aplicado, PP gasto, estado original intacto', t => {
  t.mock.method(Math, 'random', () => 0.99); // acerta, sem crítico, rolagem máxima
  const e = batalha();
  const { estado, eventos } = resolverTurnoMP(e, [{ ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0' }]);
  assert.ok(monMP(estado, 'B0').hp < 100);
  assert.equal(monMP(estado, 'A0').moves[0].ppLeft, 34);
  assert.equal(monMP(e, 'B0').hp, 100); // não mutou
  assert.ok(eventos.some(x => x.txt.includes('usou Tackle')));
  assert.equal(estado.turno, 2);
});

test('vários do mesmo lado: todos agem e o lado A vence', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const e = batalha([pokemon(), pokemon()], [pokemon({ hp: 20 })]);
  const { estado } = resolverTurnoMP(e, [
    { ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0' }, { ref: 'A1', tipo: 'golpe', golpe: 0, alvo: 'B0' }]);
  assert.equal(monMP(estado, 'B0').hp, 0);
  assert.equal(estado.fim, 'A');
});

test('alvo desmaiado: o golpe vai pra outro vivo do mesmo lado', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const e = batalha([pokemon()], [pokemon({ hp: 0 }), pokemon()]);
  const { estado } = resolverTurnoMP(e, [{ ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0' }]);
  assert.ok(monMP(estado, 'B1').hp < 100);
});

test('lado A inteiro desmaiado = B vence', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const e = batalha([pokemon({ hp: 5 })], [pokemon()]);
  const { estado } = resolverTurnoMP(e, [{ ref: 'B0', tipo: 'golpe', golpe: 0, alvo: 'A0' }]);
  assert.equal(estado.fim, 'B');
});

test('fuga: mais rápido que o inimigo foge na hora', () => {
  const rapido = pokemon({ stats: { ...pokemon().stats, speed: 200 } });
  const { estado, eventos } = resolverTurnoMP(batalha([rapido]), [{ ref: 'A0', tipo: 'fugir' }]);
  assert.equal(estado.fim, 'fuga');
  assert.ok(eventos[0].txt.includes('fugiu'));
});

test('golpe de status: baixa o atributo do alvo', t => {
  t.mock.method(Math, 'random', () => 0.5);
  const growl = golpe({ name: 'growl', cls: 'status', power: null, stats: [{ stat: 'attack', change: -1 }] });
  const { estado } = resolverTurnoMP(batalha([pokemon({ moves: [growl] })]), [{ ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0' }]);
  assert.equal(monMP(estado, 'B0').vol.stages.attack, -1);
});

test('acaoDaIA: golpe com PP num alvo vivo do outro lado; sem PP = Struggle', () => {
  const e = batalha([pokemon({ hp: 0 }), pokemon()], [pokemon()]);
  const a = acaoDaIA(e, monMP(e, 'B0'), () => 0);
  assert.deepEqual([a.golpe, a.alvo], [0, 'A1']);
  const semPP = batalha([pokemon()], [pokemon({ moves: [golpe({ ppLeft: 0 })] })]);
  assert.equal(acaoDaIA(semPP, monMP(semPP, 'B0')).golpe, -1);
});
