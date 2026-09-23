// Mudança de Postura (Aegislash) e as barreiras que punem quem encosta (King's Shield, Spiky Shield, Obstruct…).
// As duas coisas andam juntas: King's Shield só faz sentido porque devolve o Aegislash pra Forma Escudo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usarGolpe, trocarPostura, fimDaRodada } from '../js/golpe.js';
import { GOLPES_ESPECIAIS } from '../js/especiais.js';
import { HABILIDADES } from '../js/habilidades.js';
import { freshVol, calcStats } from '../js/regras.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const ctx = () => ({ nome: m => m.nome || 'X', golpe: g => g.name, say: async () => {} });
// Aegislash Forma Escudo: ataque baixo, defesa altíssima (o espelho exato da Forma Lâmina)
const aegislash = (o = {}) => {
  const base = { hp: 60, attack: 50, defense: 140, 'special-attack': 50, 'special-defense': 140, speed: 60 };
  const m = {
    nome: 'Aegislash', level: 50, ability: 'stance-change', status: null, sleep: 0, vol: freshVol(),
    data: { types: ['steel', 'ghost'], base }, ivs: {}, evs: {}, nature: 'hardy',
    ...o
  };
  for (const s of Object.keys(base)) { m.ivs[s] = 0; m.evs[s] = 0; }
  m.stats = calcStats(m); m.hp = m.stats.hp;
  m.moves = [golpe()];
  return m;
};
const alvo = () => {
  const base = { hp: 100, attack: 80, defense: 80, 'special-attack': 80, 'special-defense': 80, speed: 80 };
  const m = { nome: 'Alvo', level: 50, ability: 'none', status: null, sleep: 0, vol: freshVol(), data: { types: ['normal'], base }, ivs: {}, evs: {}, nature: 'hardy' };
  for (const s of Object.keys(base)) { m.ivs[s] = 0; m.evs[s] = 0; }
  m.stats = calcStats(m); m.hp = m.stats.hp; m.moves = [golpe()];
  return m;
};

test('a habilidade existe e descreve a troca de atributos', () => {
  assert.ok(HABILIDADES['stance-change']?.postura, 'stance-change precisa estar na tabela');
  assert.ok(GOLPES_ESPECIAIS['kings-shield'].voltaPostura);
});

test('atacar vira Forma Lâmina: Ataque e Defesa trocam de lugar', async () => {
  const a = aegislash(), t = alvo();
  const atkEscudo = a.stats.attack, defEscudo = a.stats.defense;
  await usarGolpe(a, t, golpe({ name: 'sacred-sword', power: 90 }), true, ctx());
  assert.equal(a.lamina, true);
  assert.equal(a.stats.attack, defEscudo, 'o Ataque da Lâmina é a Defesa do Escudo');
  assert.equal(a.stats.defense, atkEscudo);
  assert.ok(t.hp < t.stats.hp, 'e o golpe saiu de verdade');
});

test('King\'s Shield volta pra Forma Escudo e tira 2 de Ataque de quem encosta', async t => {
  t.mock.method(Math, 'random', () => 0);   // a proteção não falha
  const a = aegislash(); a.lamina = true;   // veio de um ataque no turno anterior
  a.data = { ...a.data, base: { ...a.data.base, attack: 140, defense: 50 } };
  const inimigo = alvo();
  await usarGolpe(a, inimigo, golpe({ name: 'kings-shield', cls: 'status', power: null }), true, ctx());
  assert.equal(a.lamina, false, 'voltou pro Escudo');
  assert.equal(a.vol.protegido, true);
  await usarGolpe(inimigo, a, golpe({ name: 'tackle' }), false, ctx());   // golpe FÍSICO = contato
  assert.equal(inimigo.vol.stages.attack, -2, 'quem encostou perde 2 de Ataque');
  assert.equal(a.hp, a.stats.hp, 'e não toma dano nenhum');
});

test('golpe especial não encosta na barreira: é bloqueado, mas sem punição', async t => {
  t.mock.method(Math, 'random', () => 0);
  const a = aegislash(), inimigo = alvo();
  await usarGolpe(a, inimigo, golpe({ name: 'kings-shield', cls: 'status', power: null }), true, ctx());
  await usarGolpe(inimigo, a, golpe({ name: 'ember', cls: 'special', type: 'fire' }), false, ctx());
  assert.equal(inimigo.vol.stages.attack, 0);
});

test('a punição some no fim da rodada, junto com a proteção', async t => {
  t.mock.method(Math, 'random', () => 0);
  const a = aegislash(), inimigo = alvo();
  await usarGolpe(a, inimigo, golpe({ name: 'kings-shield', cls: 'status', power: null }), true, ctx());
  fimDaRodada(a);
  assert.equal(a.vol.protegido, false);
  assert.equal(a.vol.punicao, undefined);
});

test('trocarPostura não mexe no objeto de dados compartilhado (cache da espécie)', async () => {
  const a = aegislash();
  const dadosOriginais = a.data, baseOriginal = { ...a.data.base };
  await trocarPostura(a, true, ctx());
  assert.notEqual(a.data, dadosOriginais, 'precisa ser uma cópia');
  assert.deepEqual(dadosOriginais.base, baseOriginal, 'o objeto antigo não pode ser alterado');
  assert.equal(await trocarPostura(a, true, ctx()), false, 'já está na Lâmina: não faz nada');
});

test('quem não tem a habilidade não muda de forma', async () => {
  const comum = alvo();
  assert.equal(await trocarPostura(comum, true, ctx()), false);
  assert.equal(comum.lamina, undefined);
});
