// Baixar um mapa pra jogar offline (js/offline.js): a LISTA do que precisa ser guardado é pura e testável;
// o download em si precisa de rede e fica de fora.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alvosDaGen } from '../js/offline.js';
import { GENS, rotasDaGen } from '../js/mapas.js';

test('a lista de um mapa cobre pool, Alfas e lendários, sem repetir', () => {
  for (const g of GENS) {
    const ids = alvosDaGen(g.gen);
    assert.equal(new Set(ids).size, ids.length, `Gen ${g.gen}: id repetido`);
    for (const id of ids) assert.ok(Number.isInteger(id) && id >= 1 && id <= 1025, `Gen ${g.gen}: id ${id}`);
    const rotas = rotasDaGen(g.gen);
    for (const z of rotas) {
      for (const p of z.pool) assert.ok(ids.includes(p.id), `${z.id}: ${p.n} de fora`);
      if (z.chefe) assert.ok(ids.includes(z.chefe.id), `${z.id}: Alfa de fora`);
      for (const l of z.lendarios || []) assert.ok(ids.includes(l.id), `${z.id}: lendário de fora`);
    }
    // um mapa inteiro é grande, mas não absurdo (cabe num download)
    assert.ok(ids.length >= 40 && ids.length <= 260, `Gen ${g.gen}: ${ids.length} Pokémon`);
  }
});

test('Gen desconhecida cai na primeira (mesma regra de rotasDaGen)', () => {
  assert.deepEqual(alvosDaGen(99), alvosDaGen(1));
});
