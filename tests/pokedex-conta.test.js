// Pokédex da conta (js/pokedex-conta.js): junta o que todas as jornadas registraram e diz onde cada espécie mora.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pokedexDaConta, ondeAparece, TOTAL_DEX, ESTADOS } from '../js/pokedex-conta.js';
import { GENS } from '../js/mapas.js';

const j = (registro, dificuldade = 'hard') => ({ dificuldade, registro });

test('soma vistos, derrotados e amigos de todas as jornadas, por espécie', () => {
  const dex = pokedexDaConta([
    j({ vistos: { pidgey: 4 }, derrotados: { pidgey: 2 }, ids: { pidgey: 16 } }),
    j({ vistos: { pidgey: 1, rattata: 3 }, amigos: { rattata: 1 }, ids: { rattata: 19 } })
  ], null);
  assert.equal(dex.porId.get(16).vistos, 5);
  assert.equal(dex.porId.get(16).derrotados, 2);
  assert.equal(dex.porId.get(19).amigos, 1);
  assert.equal(dex.conhecidas, 2);
});

test('estado: amigo > derrotado > visto (o que você conviveu mais manda)', () => {
  const dex = pokedexDaConta([j({
    vistos: { a: 1, b: 1, c: 1 }, derrotados: { b: 1, c: 1 }, amigos: { c: 1 },
    ids: { a: 1, b: 2, c: 3 }
  })], null);
  assert.equal(dex.porId.get(1).estado, ESTADOS.visto);
  assert.equal(dex.porId.get(2).estado, ESTADOS.derrotado);
  assert.equal(dex.porId.get(3).estado, ESTADOS.amigo);
});

test('a jornada em andamento entra junto (o número sobe enquanto você joga)', () => {
  const dex = pokedexDaConta([], { vistos: { eevee: 1 }, ids: { eevee: 133 } });
  assert.equal(dex.porId.get(133).vistos, 1);
  assert.equal(dex.conhecidas, 1);
});

test('registro antigo sem `ids` conta no total, mesmo sem entrar no mapa por id', () => {
  const dex = pokedexDaConta([j({ vistos: { mew: 1 } })], null);   // save antigo, antes de registrar o id
  assert.equal(dex.conhecidas, 1);
  assert.equal(dex.porId.size, 0);
  assert.equal(dex.porNome.mew.vistos, 1);
});

test('ondeAparece: rota comum, Santuário, Alfa e luta final', () => {
  // Pikachu existe nas rotas de Kanto; o teste não fixa a rota (os mapas são gerados), só a forma da resposta
  const onde = ondeAparece(25);
  assert.ok(onde.length, 'Pikachu tem de aparecer em algum lugar');
  for (const o of onde) {
    assert.ok(o.gen >= 1 && o.gen <= 9 && o.regiao && o.rota);
    assert.ok(o.min >= 1 && o.max >= o.min);
  }
  assert.ok(onde.some(o => o.santuario), 'e no Santuário da Gen dele');
  // um Alfa qualquer aparece marcado como Alfa
  const alfa = GENS[0].rotas.find(z => z.chefe).chefe;
  assert.ok(ondeAparece(alfa.id).some(o => o.alfa));
  // um lendário aparece marcado como luta final
  const lend = GENS[0].rotas.find(z => z.final).lendarios[0];
  assert.ok(ondeAparece(lend.id).some(o => o.lendario));
  assert.deepEqual(ondeAparece(999999), []);
});

test('a Pokédex nacional tem 1025 espécies', () => {
  assert.equal(TOTAL_DEX, 1025);
});
