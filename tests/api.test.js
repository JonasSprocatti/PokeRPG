// Conversão do JSON cru da PokéAPI (js/api.js) — com JSON de exemplo, sem rede.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLearnset, slimPokemon, slimMove } from '../js/api.js';

// entrada de `pokemon.moves[]` no formato da API
const mv = (name, ...detalhes) => ({
  move: { name, url: `https://pokeapi.co/api/v2/move/${name}/` },
  version_group_details: detalhes.map(([vg, level, metodo = 'level-up']) => ({ version_group: { name: vg }, level_learned_at: level, move_learn_method: { name: metodo } }))
});

test('buildLearnset: usa o jogo mais recente disponível, só por nível, ordenado', () => {
  const ls = buildLearnset([
    mv('ember', ['red-blue', 9], ['scarlet-violet', 7]),
    mv('growl', ['scarlet-violet', 1]),
    mv('flamethrower', ['red-blue', 38]),                  // não existe em SV → fica de fora
    mv('dig', ['scarlet-violet', 0, 'machine'])            // TM não conta
  ]);
  assert.equal(ls.vg, 'scarlet-violet');
  assert.deepEqual(ls.list.map(m => [m.name, m.level]), [['growl', 1], ['ember', 7]]);
});

test('buildLearnset: golpe repetido no mesmo jogo fica com o menor nível', () => {
  const ls = buildLearnset([mv('tackle', ['x-y', 10], ['x-y', 1])]);
  assert.deepEqual(ls.list.map(m => [m.name, m.level]), [['tackle', 1]]);
});

test('buildLearnset: sem nenhum golpe por nível', () => {
  assert.deepEqual(buildLearnset([mv('dig', ['x-y', 0, 'machine'])]), { vg: '', list: [] });
});

test('slimPokemon: tipos por slot, EVs só >0, fallbacks de XP e sprite', () => {
  const p = slimPokemon({
    id: 6, name: 'charizard', species: { name: 'charizard', url: 'sp/6/' },
    types: [{ slot: 2, type: { name: 'flying' } }, { slot: 1, type: { name: 'fire' } }],
    stats: [{ stat: { name: 'hp' }, base_stat: 78, effort: 0 }, { stat: { name: 'special-attack' }, base_stat: 109, effort: 3 }],
    base_experience: null,
    abilities: [{ ability: { name: 'blaze', url: 'ab/66/' }, is_hidden: false }, { ability: { name: 'solar-power', url: 'ab/94/' }, is_hidden: true }],
    sprites: { front_default: null, back_default: null, other: {} },
    moves: []
  });
  assert.deepEqual(p.types, ['fire', 'flying']);
  assert.deepEqual(p.base, { hp: 78, 'special-attack': 109 });
  assert.deepEqual(p.effort, { 'special-attack': 3 });
  assert.equal(p.baseExp, 60);
  assert.deepEqual(p.abilities.map(a => [a.name, a.hidden]), [['blaze', false], ['solar-power', true]]);
  assert.match(p.sprite, /\/pokemon\/6\.png$/);
});

test('slimMove: campos, chance do efeito no texto e meta', () => {
  const m = slimMove({
    name: 'ember', type: { name: 'fire' }, damage_class: { name: 'special' }, power: 40, accuracy: 100, pp: 25, priority: 0,
    target: { name: 'selected-pokemon' }, effect_chance: 10,
    effect_entries: [{ language: { name: 'en' }, short_effect: 'Has a $effect_chance% chance to burn the target.' }],
    meta: { ailment: { name: 'burn' }, ailment_chance: 10, crit_rate: 0, drain: 0, healing: 0, flinch_chance: 0, stat_chance: 0, min_hits: null, max_hits: null, category: { name: 'damage+ailment' } },
    stat_changes: []
  });
  assert.equal(m.desc, 'Has a 10% chance to burn the target.');
  assert.equal(m.cls, 'special');
  assert.equal(m.meta.ailment, 'burn');
  assert.equal(m.meta.ailChance, 10);
  assert.equal(m.meta.minHits, 0);
  assert.equal(m.meta.cat, 'damage+ailment');
});

test('slimMove: sem descrição de efeito cai no texto do jogo; sem classe vira status', () => {
  const m = slimMove({
    name: 'x', type: { name: 'normal' }, damage_class: null, power: null, accuracy: null, pp: null,
    effect_entries: [], flavor_text_entries: [{ language: { name: 'en' }, flavor_text: 'Linha\num\fdois' }],
    meta: null, stat_changes: [{ stat: { name: 'attack' }, change: 2 }]
  });
  assert.equal(m.desc, 'Linha um dois');
  assert.equal(m.cls, 'status');
  assert.equal(m.pp, 10);
  assert.equal(m.target, 'selected-pokemon');
  assert.deepEqual(m.meta, {});
  assert.deepEqual(m.stats, [{ stat: 'attack', change: 2 }]);
});
