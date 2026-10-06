/* Item na mão do Pokémon selvagem (relato #77 + #70) e os golpes que mexem com item.
   Efeito de chance se testa FIXANDO o sorteio, nunca por amostragem: `itemDeSelvagem` e `itemCaiComoEspolio`
   recebem a sorte por parâmetro justamente pra isso (amostrar "60 encontros, espero ao menos um item" falharia
   sozinho de vez em quando e viraria defeito fantasma no CI). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itemDeSelvagem, itemCaiComoEspolio, CHANCE_ITEM_SELVAGEM, CHANCE_ESPOLIO_ITEM } from '../js/regras.js';
import { ITENS_DE_SELVAGEM, ITEMS } from '../js/dados.js';
import { GOLPES_ESPECIAIS } from '../js/especiais.js';
import { SEGURADOS } from '../js/segurados.js';

test('os dois lados do limiar de segurar item', () => {
  assert.equal(itemDeSelvagem(CHANCE_ITEM_SELVAGEM - 0.001, 0), ITENS_DE_SELVAGEM[0].id, 'abaixo do limiar: segura');
  assert.equal(itemDeSelvagem(CHANCE_ITEM_SELVAGEM, 0), null, 'no limiar exato: não segura');
  assert.equal(itemDeSelvagem(CHANCE_ITEM_SELVAGEM + 0.5, 0), null, 'acima: não segura');
});

test('os dois lados do limiar do espólio', () => {
  assert.equal(itemCaiComoEspolio(CHANCE_ESPOLIO_ITEM - 0.0001), true);
  assert.equal(itemCaiComoEspolio(CHANCE_ESPOLIO_ITEM), false);
});

test('o sorteio ponderado cobre a lista inteira e nunca sai dela', () => {
  const ids = new Set();
  // 2000 pontos do intervalo [0,1): varre a lista toda sem depender de sorte
  for (let i = 0; i < 2000; i++) {
    const id = itemDeSelvagem(0, i / 2000);
    assert.ok(id, 'com a sorte abaixo do limiar sempre sai algum item');
    ids.add(id);
  }
  assert.equal(ids.size, ITENS_DE_SELVAGEM.length, 'toda entrada da tabela é alcançável');
  for (const id of ids) assert.ok(ITENS_DE_SELVAGEM.some(e => e.id === id), `${id} está na tabela`);
  // o extremo de cima não pode escapar pra undefined (clamp do sorteio)
  assert.ok(itemDeSelvagem(0, 0.9999999999));
  assert.ok(itemDeSelvagem(0, 1));
});

test('o peso manda: a Oran é a mais comum e a fruta de tipo a mais rara', () => {
  const conta = {};
  for (let i = 0; i < 10000; i++) { const id = itemDeSelvagem(0, i / 10000); conta[id] = (conta[id] || 0) + 1; }
  const maisComum = Object.entries(conta).sort((a, b) => b[1] - a[1])[0][0];
  assert.equal(maisComum, 'oran-berry');
  assert.ok(conta['oran-berry'] > conta['sitrus-berry']);
  assert.ok(conta['sitrus-berry'] > (conta['occa-berry'] || 0));
});

test('todo item da tabela existe, tem efeito de verdade e é barato', () => {
  for (const { id, p } of ITENS_DE_SELVAGEM) {
    assert.ok(ITEMS[id], `${id} existe em ITEMS`);
    assert.ok(ITEMS[id].segurado, `${id} é item pra segurar`);
    // sem isto o inimigo seguraria item inerte e a plaquinha mostraria algo que não faz nada
    assert.ok(SEGURADOS[id], `${id} tem efeito em segurados.SEGURADOS`);
    assert.ok(ITEMS[id].price <= 2000, `${id} é barato (é "item de selvagem", não tesouro)`);
    assert.ok(p > 0, `${id} tem peso positivo`);
  }
});

test('Thief/Covet roubam e Knock Off derruba — e as três linhas estão na tabela de especiais', () => {
  assert.equal(GOLPES_ESPECIAIS.thief.roubaItem, true);
  assert.equal(GOLPES_ESPECIAIS.covet.roubaItem, true);
  assert.equal(GOLPES_ESPECIAIS['knock-off'].derrubaItem, true);
  // Knock Off não exige mão vazia (o item se perde, não troca de dono): não pode ter virado roubaItem por engano
  assert.equal(GOLPES_ESPECIAIS['knock-off'].roubaItem, undefined);
});
