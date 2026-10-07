/* 🐺 Golpe de ÁREA. O jogo nasceu com um inimigo só, então o `target` da PokéAPI era ignorado e Earthquake batia
   em um. Com grupo em todos os modos isso virou dano perdido — e, pior, o inimigo passou a poder usar área sem
   nunca respingar no bando dele.
   O que este arquivo protege é a regra inteira de uma vez, rodando `usarGolpe` de verdade com um ctx de mentira
   (mesmo molde de golpe-stats.test.js): quem é pego, o ×MULT_AREA, o que NÃO pode repetir no respingo (recuo,
   cura, queda de atributo do usuário) e as duas habilidades que só existem por causa disso (Damp, Telepathy). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usarGolpe } from '../js/golpe.js';
import { freshVol, MULT_AREA } from '../js/regras.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: null, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const mon = (nome, o = {}) => ({
  nome, level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0,
  stats: { hp: 500, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 500, moves: [golpe()], vol: freshVol(), ...o
});
/* O ctx do single player e o do multiplayer têm os dois ganchos; é deles que a lista de alvos sai. Aqui eles
   devolvem listas fixas, que é o que torna o teste independente de G/estado. */
const ctx = (aliados = [], oponentes = []) => ({
  nome: m => m.nome, golpe: g => g.name, say: async () => {},
  aliadosDe: m => aliados.filter(x => x !== m && x.hp > 0),
  oponentesDe: () => oponentes.filter(x => x.hp > 0)
});

test('all-opponents pega o grupo inteiro do outro lado, e só ele', async () => {
  const u = mon('eu'), amigo = mon('amigo'), a = mon('a'), b = mon('b'), c = mon('c');
  await usarGolpe(u, a, golpe({ name: 'rock-slide', type: 'rock', power: 75, target: 'all-opponents' }), true, ctx([u, amigo], [a, b, c]));
  for (const m of [a, b, c]) assert.ok(m.hp < 500, `${m.nome} devia ter apanhado`);
  assert.equal(amigo.hp, 500, 'all-opponents não encosta no aliado');
  assert.equal(u.hp, 500, 'nem em quem usou');
});

test('all-other-pokemon respinga no próprio aliado — menos em quem tem Telepathy', async () => {
  const u = mon('eu'), amigo = mon('amigo'), telepata = mon('telepata', { ability: 'telepathy' }), a = mon('a');
  await usarGolpe(u, a, golpe({ name: 'earthquake', type: 'ground', power: 100, target: 'all-other-pokemon' }), true, ctx([u, amigo, telepata], [a]));
  assert.ok(a.hp < 500 && amigo.hp < 500, 'inimigo e aliado apanham');
  assert.equal(telepata.hp, 500, 'Telepathy não leva golpe de área do colega');
  assert.equal(u.hp, 500, 'quem usou nunca se pega');
});

test('pegando mais de um, o dano em cada um sai ×MULT_AREA; pegando um só, sai cheio', async t => {
  t.mock.method(Math, 'random', () => 0.5);   // a variação do dano (85–100%) e o crítico TÊM de ser os mesmos nos dois
  const soUm = [mon('sozinho')], varios = [mon('a'), mon('b')];
  const g = () => golpe({ name: 'surf', type: 'water', cls: 'special', power: 90, target: 'all-opponents' });
  await usarGolpe(mon('eu'), soUm[0], g(), true, ctx([], soUm));
  await usarGolpe(mon('eu'), varios[0], g(), true, ctx([], varios));
  const cheio = 500 - soUm[0].hp, cortado = 500 - varios[0].hp;
  assert.ok(cheio > 0 && cortado > 0);
  // ±1 por causa do Math.floor em cada passo do dano
  assert.ok(Math.abs(cortado - cheio * MULT_AREA) <= 1, `esperava ~${cheio * MULT_AREA}, veio ${cortado}`);
});

test('o que é do USUÁRIO e vale uma vez por golpe não se repete por alvo', async t => {
  t.mock.method(Math, 'random', () => 0);   // efeito secundário sempre pega
  const u = mon('eu'), a = mon('a'), b = mon('b');
  // Make It Rain: área que baixa o At.Esp. de QUEM USA (damage-raise) e tem recuo — nenhum dos dois pode contar 2×
  const g = golpe({ name: 'make-it-rain', type: 'steel', cls: 'special', power: 120, target: 'all-opponents',
    stats: [{ stat: 'special-attack', change: -1 }], meta: { cat: 'damage-raise', statChance: 100, drain: -25 } });
  await usarGolpe(u, a, g, true, ctx([], [a, b]));
  assert.ok(a.hp < 500 && b.hp < 500, 'os dois apanharam');
  assert.equal(u.vol.stages['special-attack'], -1, 'a queda do usuário é UMA, não uma por alvo');
  const recuo = 500 - u.hp;
  assert.ok(recuo > 0 && recuo <= Math.ceil((500 - a.hp) * 0.25) + 1, 'o recuo sai só do alvo principal');
});

test('Damp impede a explosão de qualquer um em campo, dos dois lados', async () => {
  const explodir = () => golpe({ name: 'explosion', type: 'normal', power: 250, target: 'all-other-pokemon' });
  // do lado de lá
  const u = mon('eu'), inimigoDamp = mon('politoed', { ability: 'damp' });
  await usarGolpe(u, inimigoDamp, explodir(), true, ctx([], [inimigoDamp]));
  assert.equal(u.hp, 500, 'quem usou não podia nem desmaiar');
  assert.equal(inimigoDamp.hp, 500, 'e ninguém apanha');
  // do lado de cá (o aliado abafa a sua própria explosão) — é o mesmo gancho, pelo outro ctx
  const v = mon('eu2'), amigoDamp = mon('psyduck', { ability: 'damp' }), alvo = mon('alvo');
  await usarGolpe(v, alvo, explodir(), true, ctx([v, amigoDamp], [alvo]));
  assert.equal(v.hp, 500);
  assert.equal(alvo.hp, 500);
});

test('sem Damp a explosão sai normal (a trava não pode valer sempre)', async () => {
  const u = mon('eu'), alvo = mon('alvo');
  await usarGolpe(u, alvo, golpe({ name: 'explosion', type: 'normal', power: 250, target: 'all-other-pokemon' }), true, ctx([], [alvo]));
  assert.equal(u.hp, 0, 'quem explode desmaia');
  assert.ok(alvo.hp < 500, 'e o alvo apanha');
});

test('golpe de alvo único continua pegando um só, com grupo em campo', async () => {
  const u = mon('eu'), a = mon('a'), b = mon('b');
  await usarGolpe(u, a, golpe(), true, ctx([], [a, b]));
  assert.ok(a.hp < 500);
  assert.equal(b.hp, 500, 'Tackle não virou golpe de área');
});
