// Itens que mexem no moveset (dados.ITENS_GOLPE): Escama do Coração (relembrar golpe de nível) e Disco Técnico
// (ensinar golpe de MT/tutor/herança). Aqui ficam as partes puras: o que cada item oferece (regras.golpesParaEnsinar),
// o preço que sobe a cada Disco usado (regras.precoItem) e a lista `extras` que api.buildLearnset separa.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { golpesParaEnsinar, precoItem, PRECO_DISCO, AUMENTO_DISCO } from '../js/regras.js';
import { buildLearnset } from '../js/api.js';
import { ITEMS, ITENS_GOLPE, categoriaDoItem } from '../js/dados.js';

const mon = (nivel, sabe, learnset) => ({ level: nivel, moves: sabe.map(name => ({ name })), data: { learnset } });
const L = (lista, extras) => ({ vg: 'x', list: lista, extras });
const nivel = (name, level) => ({ name, url: `u/${name}`, level });
const extra = (name, metodo) => ({ name, url: `u/${name}`, metodo });

test('Escama: só golpes de nível já alcançados e que ele não sabe', () => {
  const m = mon(20, ['ember'], L([nivel('tackle', 1), nivel('ember', 9), nivel('flamethrower', 38)]));
  assert.deepEqual(golpesParaEnsinar('relembrar', m).map(x => x.name), ['tackle']); // ember já sabe, flamethrower é longe
  assert.deepEqual(golpesParaEnsinar('relembrar', mon(40, [], L([nivel('flamethrower', 38)]))).map(x => x.name), ['flamethrower']);
});

test('Disco: só os extras (MT/tutor/herança) que ele não sabe — nunca a lista de nível', () => {
  const ls = L([nivel('tackle', 1)], [extra('fire-punch', 'tutor'), extra('rest', 'machine'), extra('belly-drum', 'egg')]);
  assert.deepEqual(golpesParaEnsinar('pokedex', mon(30, ['rest'], ls)).map(x => x.name), ['fire-punch', 'belly-drum']);
  // um não invade o campo do outro: golpe de nível não aparece no Disco, extra não aparece na Escama
  assert.equal(golpesParaEnsinar('pokedex', mon(30, [], ls)).some(x => x.name === 'tackle'), false);
  assert.equal(golpesParaEnsinar('relembrar', mon(30, [], ls)).some(x => x.name === 'rest'), false);
});

test('sem dados da espécie (ou cache antigo, sem extras) devolve null em vez de "não aprende nada"', () => {
  assert.equal(golpesParaEnsinar('relembrar', { level: 5, moves: [] }), null);
  assert.equal(golpesParaEnsinar('pokedex', mon(30, [], { vg: 'x', list: [] })), null); // save de antes dos extras
  assert.deepEqual(golpesParaEnsinar('pokedex', mon(30, [], L([], []))), []);           // sabe que não há nenhum
});

test('buildLearnset separa nível de MT/tutor/herança, e ignora método que o jogo não usa', () => {
  const mv = (name, dets) => ({ move: { name, url: `u/${name}` }, version_group_details: dets });
  const d = (metodo, vg, level = 0) => ({ move_learn_method: { name: metodo }, version_group: { name: vg }, level_learned_at: level });
  const r = buildLearnset([
    mv('tackle', [d('level-up', 'scarlet-violet', 1)]),
    mv('rest', [d('machine', 'scarlet-violet')]),
    mv('fire-punch', [d('tutor', 'scarlet-violet')]),
    mv('belly-drum', [d('egg', 'scarlet-violet')]),
    mv('sketch', [d('form-change', 'scarlet-violet')])
  ]);
  assert.deepEqual(r.list.map(m => m.level), [1]);
  assert.deepEqual(r.extras.map(m => m.name), ['belly-drum', 'fire-punch', 'rest']); // em ordem alfabética
  assert.equal(r.extras.some(m => m.name === 'sketch'), false);
  assert.equal(r.extras.find(m => m.name === 'rest').metodo, 'machine');
});

test('preço: fixo pra todo mundo, e o Disco sobe a cada um USADO', () => {
  assert.equal(precoItem('heart-scale', { discosUsados: 7 }), ITEMS['heart-scale'].price);
  assert.equal(precoItem('tm-normal', null), PRECO_DISCO);
  assert.equal(precoItem('tm-normal', {}), PRECO_DISCO);
  assert.equal(precoItem('tm-normal', { discosUsados: 1 }), PRECO_DISCO + AUMENTO_DISCO);
  assert.equal(precoItem('tm-normal', { discosUsados: 3 }), PRECO_DISCO + 3 * AUMENTO_DISCO);
  assert.equal(precoItem('nao-existe', {}), 0);
});

test('os dois itens estão na loja, na divisão de Golpes', () => {
  for (const [k, it] of Object.entries(ITENS_GOLPE)) {
    assert.ok(ITEMS[k] === it, `${k} não foi pra ITEMS`);
    assert.ok(it.price > 0 && it.desc.length > 20, `${k}: preço/descrição`);
    assert.equal(categoriaDoItem(it), 'golpes');
  }
  assert.equal(ITEMS['heart-scale'].price, 5000);
  assert.equal(PRECO_DISCO, 8000);
});
