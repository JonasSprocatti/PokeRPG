// Hall da Fama (js/hall.js): o Pokémon principal de cada jornada Roguelike/Hardcore terminada, usado na Arena do Chefe.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HALL_MAX, entraNoHall, compactarPokemon, entradaDoHall, podarHall, registrarNoHall, listaDoHall, mesclarHall } from '../js/hall.js';
import { mesclarProgresso, progressoVazio, bancar } from '../js/progresso-conta.js';
import { darItensDeRaide, gastarItemDeRaide, inventarioRaide, IDS_DE_RAIDE } from '../js/evento.js';
import { htmlComoFuncionam } from '../js/ajuda-chefes.js';

const pokemon = (o = {}) => ({ id: 6, name: 'charizard', nick: 'Brasa', level: 60, shiny: false, nature: 'adamant', ability: 'blaze',
  data: { speciesName: 'charizard' }, ivs: { hp: 31, attack: 31 }, evs: { attack: 252 }, moves: [{ name: 'flamethrower', ppLeft: 3 }, { name: 'air-slash' }], ...o });
const S = (o = {}) => ({ player: pokemon(), gen: 3, ...o });
const resumo = (o = {}) => ({ id: 'j1', dificuldade: 'roguelike', motivo: 'venceu', data: '2026-09-25T10:00:00Z', ...o });

test('só Roguelike e Hardcore mandam o Pokémon pro Hall', () => {
  assert.equal(entraNoHall('roguelike'), true); assert.equal(entraNoHall('hardcore'), true);
  for (const k of ['easy', 'medium', 'hard', 'randomizer', 'inexistente']) assert.equal(entraNoHall(k), false, k);
  assert.equal(entradaDoHall(S(), resumo({ dificuldade: 'easy' })), null);
  assert.equal(entradaDoHall(S(), resumo({ id: undefined })), null, 'sem id da jornada não dá chave');
  assert.equal(entradaDoHall(null, resumo()), null);
});

test('a entrada guarda só o que reconstrói o Pokémon (sem a ficha pesada da espécie)', () => {
  const e = entradaDoHall(S(), resumo());
  assert.equal(e.chave, 'j1'); assert.equal(e.especie, 'charizard'); assert.equal(e.id, 6);
  assert.equal(e.nivel, 60); assert.equal(e.nick, 'Brasa'); assert.equal(e.gen, 3); assert.equal(e.motivo, 'venceu');
  assert.deepEqual(e.moves, ['flamethrower', 'air-slash'], 'só os nomes dos golpes');
  assert.deepEqual(e.ivs, { hp: 31, attack: 31 }); assert.equal(e.nature, 'adamant'); assert.equal(e.ability, 'blaze');
  assert.equal(e.data, undefined, 'sem `data` (vem da PokéAPI na hora)');
  assert.ok(JSON.stringify(e).length < 700, 'compacto: cabe muitas no progresso da nuvem');
  // é uma CÓPIA: mexer no Pokémon depois não muda o Hall
  const M = pokemon(); const c = compactarPokemon(M); M.ivs.hp = 0; M.moves.push({ name: 'x' });
  assert.equal(c.ivs.hp, 31); assert.equal(c.moves.length, 2);
});

test('registrar no Hall não muta o progresso e substitui a mesma jornada', () => {
  const p = progressoVazio(), e = entradaDoHall(S(), resumo());
  const p2 = registrarNoHall(p, e);
  assert.equal(p.hall, undefined, 'o original não muda');
  assert.equal(Object.keys(p2.hall).length, 1);
  const p3 = registrarNoHall(p2, { ...e, nivel: 70 });
  assert.equal(Object.keys(p3.hall).length, 1); assert.equal(p3.hall.j1.nivel, 70);
  assert.equal(registrarNoHall(p, null), p, 'sem entrada devolve o mesmo');
});

test('o Hall guarda só as melhores (nível maior; empate: a mais recente)', () => {
  const hall = {};
  for (let i = 0; i < HALL_MAX + 5; i++) hall['k' + i] = { chave: 'k' + i, nivel: 10 + i, em: `2026-09-${String(1 + (i % 28)).padStart(2, '0')}` };
  const podado = podarHall(hall);
  assert.equal(Object.keys(podado).length, HALL_MAX);
  assert.ok(podado['k' + (HALL_MAX + 4)], 'o de maior nível fica');
  assert.ok(!podado.k0 && !podado.k4, 'os de menor nível saem');
  const empate = podarHall({ a: { chave: 'a', nivel: 5, em: '2026-01-01' }, b: { chave: 'b', nivel: 5, em: '2026-02-01' } }, 1);
  assert.deepEqual(Object.keys(empate), ['b'], 'empate: a mais recente');
  assert.deepEqual(listaDoHall({ hall: { a: { chave: 'a', nivel: 5 }, b: { chave: 'b', nivel: 50 } } }).map(x => x.chave), ['b', 'a'], 'melhores primeiro');
  assert.deepEqual(listaDoHall(null), []);
});

test('mesclar com a nuvem: união dos dois Halls, sem perder nenhuma entrada', () => {
  const a = { ...progressoVazio(), hall: { x: { chave: 'x', nivel: 30 } } }, b = { ...progressoVazio(), hall: { y: { chave: 'y', nivel: 40 } } };
  const m = mesclarProgresso(a, b);
  assert.deepEqual(Object.keys(m.hall).sort(), ['x', 'y']);
  assert.deepEqual(Object.keys(mesclarHall({ x: { chave: 'x', nivel: 1 } }, undefined)), ['x']);
  assert.equal('hall' in mesclarProgresso(progressoVazio(), progressoVazio()), false, 'quem nunca terminou uma run não ganha a chave');
});

test('o Hall sobrevive ao bancar as jornadas (o progresso é espalhado, não reconstruído)', () => {
  const com = registrarNoHall(progressoVazio(), entradaDoHall(S(), resumo()));
  const depois = bancar(com, [{ id: 'jx', especie: 'pikachu', nivel: 5, dificuldade: 'hard', registro: { abates: { total: 1 } } }], []);
  assert.equal(depois.hall.j1.nivel, 60);
});

test('inventário de itens de raide da conta: soma só itens de raide e gasta um de cada vez', () => {
  // (o store do Node não tem localStorage: `store` engole o erro e devolve vazio — o que se testa aqui é a regra, com uma
  // implementação em memória por baixo)
  globalThis.localStorage = (() => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; })();
  try {
    assert.deepEqual(inventarioRaide(), {});
    darItensDeRaide({ 'cristal-de-ruptura': 2, 'rare-candy': 5, 'escudo-astral': 1, 'selo-de-interrupcao': 0 });
    assert.deepEqual(inventarioRaide(), { 'cristal-de-ruptura': 2, 'escudo-astral': 1 }, 'ignora o que não é de raide e o zero');
    darItensDeRaide({ 'cristal-de-ruptura': 1 });
    assert.equal(inventarioRaide()['cristal-de-ruptura'], 3);
    assert.equal(gastarItemDeRaide('cristal-de-ruptura'), true); assert.equal(inventarioRaide()['cristal-de-ruptura'], 2);
    assert.equal(gastarItemDeRaide('escudo-astral'), true); assert.equal(inventarioRaide()['escudo-astral'], undefined, 'zerou: sai do inventário');
    assert.equal(gastarItemDeRaide('escudo-astral'), false); assert.equal(gastarItemDeRaide('selo-de-interrupcao'), false);
    assert.deepEqual([...IDS_DE_RAIDE].sort(), ['cristal-de-ruptura', 'escudo-astral', 'selo-de-interrupcao']);
  } finally { delete globalThis.localStorage; }
});

test('o texto de ajuda dos chefes usa os números do jogo e cita a Arena e o Hall', () => {
  const h = htmlComoFuncionam();
  for (const trecho of ['segunda-feira', 'Arena do Chefe', 'Hall da Fama', '8 horas', 'Revive', 'Ruptura', 'Itens de raide', 'não dá pra fugir']) assert.ok(h.includes(trecho), `falta "${trecho}"`);
  assert.ok(h.includes('<details') && !h.includes(' open'), 'começa recolhido');
  assert.ok(htmlComoFuncionam({ aberto: true }).includes(' open'));
});
