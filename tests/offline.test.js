// Baixar um mapa pra jogar offline (js/offline.js): a LISTA do que precisa ser guardado é pura e testável;
// o download em si precisa de rede e fica de fora.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alvosDaGen, quantoFalta, precisaRebaixar, jaBaixado, VERSAO_DOWNLOAD } from '../js/offline.js';
import { GENS, rotasDaGen } from '../js/mapas.js';

test('a lista de um mapa cobre pool, Alfas e lendários, sem repetir', () => {
  for (const g of GENS) {
    const ids = alvosDaGen(g.gen);
    assert.equal(new Set(ids).size, ids.length, `Gen ${g.gen}: id repetido`);
    // id acima de 10000 = forma regional (Santuário): também precisa ser baixada pra jogar offline
    for (const id of ids) assert.ok(Number.isInteger(id) && (id >= 1 && id <= 1025 || id > 10000), `Gen ${g.gen}: id ${id}`);
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

/* Aparelho sem nada guardado (é o caso no Node: api.js não tem IndexedDB nem localStorage aqui).
   O que este teste trava é a REGRA: "faltam Pokémon" e "foi baixado por uma versão antiga" são pendências
   diferentes, e `jaBaixado` só é verdade quando nenhuma das duas existe. Já foi problema real: o jogo dizia
   "mapa baixado" pra um mapa que ainda falhava no avião, porque a conta olhava só os Pokémon. */
test('sem nada guardado: faltam Pokémon, e isso não se confunde com "versão antiga"', () => {
  assert.equal(quantoFalta(1), alvosDaGen(1).length);
  assert.equal(precisaRebaixar(1), false, 'com Pokémon faltando, a pendência é essa — não a da versão');
  assert.equal(jaBaixado(1), false);
  assert.ok(Number.isInteger(VERSAO_DOWNLOAD) && VERSAO_DOWNLOAD >= 2);
});
