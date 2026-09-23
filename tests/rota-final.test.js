// A rota FINAL de um mapa é a marcada com `final`, não a última do array — desde que o Santuário virou a 11ª, ler
// `rotas.at(-1).lendarios` devolve undefined. Isso quebrou a tela de escolher a próxima Gen bem no meio da vitória
// ("Cannot read properties of undefined (reading 'length')") e deixou um testador sem conseguir abrir o save.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENS, rotasDaGen, rotaFinalDaGen, lendariosDaGen } from '../js/mapas.js';

test('toda Gen tem lendários acessíveis sem depender da posição da rota', () => {
  for (const g of GENS) {
    const lend = lendariosDaGen(g.gen);
    assert.ok(lend.length >= 1, `Gen ${g.gen} ficou sem lendários`);
    assert.ok(lend.at(-1)?.id, `Gen ${g.gen}: o lendário principal precisa de id (é o sprite do cartão do mapa)`);
    assert.equal(rotaFinalDaGen(g.gen).final, true);
  }
});

test('a última rota do array é o Santuário, e ela NÃO tem lendários', () => {
  for (const g of GENS) {
    const ultima = rotasDaGen(g.gen).at(-1);
    assert.equal(ultima.posVitoria, true);
    assert.equal(ultima.lendarios, undefined, `${ultima.id}: se um dia o Santuário ganhar lendários, revisar quem lê a última rota`);
  }
});

test('Gen desconhecida não explode: cai na primeira, como o resto do jogo', () => {
  assert.deepEqual(lendariosDaGen(99), lendariosDaGen(1));
});
