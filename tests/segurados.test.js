// Itens segurados (js/segurados.js) e as divisões da mochila (js/dados.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEGURADOS, seg, temSegurado, IDS_SEGURADOS, multDanoDoItem, frutaAgora, fimDeTurnoDoItem } from '../js/segurados.js';
import { ITEMS, ITENS_SEGURADOS, CATEGORIAS_ITEM, categoriaDoItem, porCategoria, FIND_ITEMS } from '../js/dados.js';
import { calcDamage, effStat } from '../js/regras.js';

const mon = (o = {}) => ({ level: 50, ability: 'none', data: { types: ['normal'] }, status: null, vol: { stages: {} },
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 }, hp: 100, moves: [], ...o });

test('tabela: todo item segurado da mochila tem efeito, e todo efeito tem item', () => {
  assert.deepEqual(Object.keys(SEGURADOS).sort(), IDS_SEGURADOS.sort());
  for (const [k, it] of Object.entries(ITENS_SEGURADOS)) {
    assert.ok(it.segurado && it.name && it.desc && it.price > 0, k);
    assert.ok(ITEMS[k], `${k} não entrou em ITEMS`);
  }
  const ganchos = new Set(['multDano', 'soFisico', 'soEspecial', 'soSuperEfetivo', 'multStat', 'semStatus', 'recuoPorGolpe', 'drenaDano',
    'espetos', 'aguentaCheio', 'gastaNoUso', 'curaFimTurno', 'soTipo', 'danoFimTurno', 'curaEm', 'curaStatus']);
  for (const [k, s] of Object.entries(SEGURADOS)) for (const g of Object.keys(s)) assert.ok(ganchos.has(g), `${k}: gancho "${g}"`);
  assert.equal(temSegurado(mon()), false);
  assert.equal(temSegurado(mon({ item: 'leftovers' })), true);
  assert.deepEqual(seg(mon()), {});
});

test('multiplicador de dano: Orbe da Vida sempre; Cinto só no super efetivo; Faixa/Óculos pela classe', () => {
  assert.equal(multDanoDoItem(mon({ item: 'life-orb' })), 1.3);
  assert.equal(multDanoDoItem(mon({ item: 'expert-belt' }), { ef: 1 }), 1);
  assert.equal(multDanoDoItem(mon({ item: 'expert-belt' }), { ef: 2 }), 1.2);
  assert.equal(multDanoDoItem(mon({ item: 'muscle-band' }), { fisico: true }), 1.1);
  assert.equal(multDanoDoItem(mon({ item: 'muscle-band' }), { fisico: false }), 1);
  assert.equal(multDanoDoItem(mon({ item: 'wise-glasses' }), { fisico: false }), 1.1);
  assert.equal(multDanoDoItem(mon()), 1);
});

test('o dano e os atributos realmente mudam (calcDamage / effStat)', t => {
  t.mock.method(Math, 'random', () => 0.5);
  const golpe = { name: 'tackle', type: 'normal', cls: 'physical', power: 40, meta: {} };
  const semItem = calcDamage(mon(), mon(), golpe).dmg;
  const comOrbe = calcDamage(mon({ item: 'life-orb' }), mon(), golpe).dmg;
  assert.ok(comOrbe > semItem, `${comOrbe} > ${semItem}`);
  assert.equal(effStat(mon({ item: 'assault-vest' }), 'special-defense'), 150);
  assert.equal(effStat(mon(), 'special-defense'), 100);
});

test('frutas: comem sozinhas na hora certa', () => {
  assert.equal(frutaAgora(mon({ item: 'oran-berry', hp: 60 })), null);          // ainda acima da metade
  assert.deepEqual(frutaAgora(mon({ item: 'oran-berry', hp: 50 })), { cura: 10 });
  assert.deepEqual(frutaAgora(mon({ item: 'sitrus-berry', hp: 40 })), { cura: 25 });
  assert.equal(frutaAgora(mon({ item: 'sitrus-berry', hp: 0 })), null);         // desmaiado não come
  assert.deepEqual(frutaAgora(mon({ item: 'lum-berry', status: 'burn' })), { curaStatus: true });
  assert.equal(frutaAgora(mon({ item: 'lum-berry' })), null);
  assert.equal(frutaAgora(mon({ hp: 10 })), null);                              // sem item
});

test('fim de turno: Restos curam; Lodo Negro cura Venenoso e machuca o resto', () => {
  assert.equal(fimDeTurnoDoItem(mon({ item: 'leftovers', hp: 50 })), 6);
  assert.equal(fimDeTurnoDoItem(mon({ item: 'leftovers' })), 0);                // HP cheio: nada a curar
  assert.equal(fimDeTurnoDoItem(mon({ item: 'black-sludge', hp: 50 })), -12);
  assert.equal(fimDeTurnoDoItem(mon({ item: 'black-sludge', hp: 50, data: { types: ['poison'] } })), 6);
  assert.equal(fimDeTurnoDoItem(mon({ hp: 50 })), 0);
});

test('a loja mostra os itens pra segurar (é por onde o jogador conhece a mecânica)', () => {
  const aVenda = Object.entries(ITEMS).filter(([, it]) => it.price);
  const divisoes = porCategoria(aVenda);
  const seg = divisoes.find(c => c.id === 'segurado');
  assert.ok(seg, 'a divisão 🎒 Para segurar não aparece na loja');
  // toda a tabela de segurados está à venda, mais a Pedra Mega e o Cristal Z (que também são `segurado` e entram na divisão)
  assert.ok(seg.itens.length >= Object.keys(ITENS_SEGURADOS).length, 'faltou item da tabela na loja');
  assert.equal(seg.itens.length, aVenda.filter(([, it]) => it.segurado).length);
  for (const [k] of seg.itens) assert.ok(ITEMS[k].segurado && ITEMS[k].price > 0, k);
  // uma fruta pra segurar também é achada explorando: a mecânica aparece sem precisar de dinheiro
  assert.ok(FIND_ITEMS.some(k => ITEMS[k]?.segurado), 'nenhum item pra segurar aparece explorando');
});

test('divisões da mochila: todo item cai em exatamente uma, e as vazias somem', () => {
  const ids = CATEGORIAS_ITEM.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.at(-1), 'outros');                                            // a última pega o que sobrar
  for (const [k, it] of Object.entries(ITEMS)) assert.ok(ids.includes(categoriaDoItem(it)), `${k}: sem divisão`);
  assert.equal(categoriaDoItem(ITEMS.potion), 'cura');
  assert.equal(categoriaDoItem(ITEMS['x-attack']), 'batalha');
  assert.equal(categoriaDoItem(ITEMS.leftovers), 'segurado');
  assert.equal(categoriaDoItem(ITEMS['fire-stone']), 'evolucao');
  assert.equal(categoriaDoItem(ITEMS.honey), 'petisco');
  const grupos = porCategoria([['potion', 2], ['leftovers', 1], ['honey', 3]]);
  assert.deepEqual(grupos.map(g => g.id), ['cura', 'segurado', 'petisco']);
  assert.deepEqual(grupos[0].itens, [['potion', 2]]);
});
