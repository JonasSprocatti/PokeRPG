// Carreira (js/carreira.js): juntar local + nuvem sem contar em dobro, e os números calculados das jornadas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrarRecordes, adicionarJornada, mesclarJornadas, melhorDaEspecie, calcularCarreira, TOTAL_ESPECIES } from '../js/carreira.js';

const j = (id, o = {}) => ({ id, especie: 'mudkip', pontuacao: 100, nivel: 10, data: `2026-01-0${id.length}`, ...o });

test('adicionarJornada: mesmo id substitui, não duplica', () => {
  let c = adicionarJornada(null, j('a'));
  c = adicionarJornada(c, j('b'));
  c = adicionarJornada(c, j('a', { pontuacao: 999 }));
  assert.equal(c.jornadas.length, 2);
  assert.equal(c.jornadas.find(x => x.id === 'a').pontuacao, 999);
});

test('migrarRecordes: formato antigo vira lista com id, sem repetir a mesma jornada', () => {
  const melhor = { especie: 'mudkip', data: 'd1', pontuacao: 500 };
  const c = migrarRecordes({ especies: { mudkip: { melhor, jornadas: 2 } }, historico: [melhor, { especie: 'eevee', data: 'd2', pontuacao: 50 }] });
  assert.equal(c.jornadas.length, 2); // o melhor do mudkip também estava no histórico
  assert.ok(c.jornadas.every(x => x.id));
  assert.deepEqual(migrarRecordes(null), { jornadas: [] });
});

test('mesclarJornadas: sobe só o que falta na nuvem, e nunca jornada de outra conta', () => {
  const locais = [j('a'), j('bb', { dono: 'eu' }), j('ccc', { dono: 'outro' }), j('dddd')];
  const remotas = [j('a', { dono: 'eu' }), j('eeeee', { dono: 'eu' })];
  const { todas, subir } = mesclarJornadas(locais, remotas, 'eu');
  assert.deepEqual(subir.map(x => x.id).sort(), ['bb', 'dddd']); // 'a' já está lá; 'ccc' é de outra conta
  assert.ok(subir.every(x => x.dono === 'eu'));
  assert.deepEqual(todas.map(x => x.id).sort(), ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
  assert.equal(todas.find(x => x.id === 'dddd').dono, 'eu'); // visitante virou da conta
  // segunda sincronização não sobe nada de novo (idempotente)
  assert.equal(mesclarJornadas(todas, [...remotas, ...subir], 'eu').subir.length, 0);
});

test('melhorDaEspecie ignora a própria jornada', () => {
  const js = [j('a', { pontuacao: 300 }), j('b', { pontuacao: 900 }), j('c', { especie: 'eevee', pontuacao: 5000 })];
  assert.equal(melhorDaEspecie(js, 'mudkip').id, 'b');
  assert.equal(melhorDaEspecie(js, 'mudkip', 'b').id, 'a');
  assert.equal(melhorDaEspecie(js, 'pikachu'), null);
});

test('calcularCarreira: máximos, totais, Pokédex, shinies e favorito', () => {
  const c = calcularCarreira([
    j('a', { nivel: 20, pontuacao: 800, maxDinheiro: 5000, missoes: 7, vitorias: 30, derrotados: 25, treinadores: 2, alfas: 1, tempoMs: 60000,
      shiniesVistos: 1, shiny: true, registro: { vistos: { pidgey: 3, zubat: 1 }, amigos: { pidgey: 1 }, ids: { pidgey: 16 } } }),
    j('b', { nivel: 12, pontuacao: 300, maxDinheiro: 9000, missoes: 3, vitorias: 10, derrotados: 8, tempoMs: 30000,
      registro: { derrotados: { geodude: 2 }, amigos: { pidgey: 1, geodude: 1 } } }),
    j('c', { especie: 'eevee', nivel: 30, pontuacao: 2000, shiniesAmigos: 1 })
  ]);
  assert.equal(c.jornadas, 3);
  assert.equal(c.maxNivel, 30); assert.equal(c.melhorPontuacao, 2000);
  assert.equal(c.maxDinheiro, 9000); assert.equal(c.maxMissoes, 7);
  assert.equal(c.totalVitorias, 40); assert.equal(c.maxVitorias, 30); assert.equal(c.totalDerrotados, 33);
  assert.equal(c.tempoTotal, 90000);
  assert.deepEqual(c.amigos, ['geodude', 'pidgey']);             // mesma espécie em 2 jornadas conta 1 vez
  assert.equal(c.faltam, TOTAL_ESPECIES - 2);
  assert.deepEqual(c.vistos, ['geodude', 'pidgey', 'zubat']);     // derrotado também conta como visto
  assert.equal(c.ids.pidgey, 16);
  assert.equal(c.shiniesVistos, 1); assert.equal(c.shiniesAmigos, 1); assert.equal(c.jornadasShiny, 1);
  assert.equal(c.favorito, 'mudkip');                             // 2 jornadas contra 1
  assert.equal(c.porEspecie.mudkip.melhor.id, 'a');
  assert.equal(calcularCarreira([]).favorito, null);
});
