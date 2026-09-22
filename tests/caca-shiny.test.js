// 🎯 Caça Shiny (js/mapas.js) e o segredo do brilho (js/regras.js): shiny dobra XP/dinheiro e cura de graça.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rotaLiberaCaca, progressoCaca, cacaDaRota, cacaveisDaRota, somarRegistros, REVELA_DERROTADOS,
  repelenteAtivo, semSelvagens, especieForcada, gastarRepelente } from '../js/mapas.js';
import { multShiny, bonusShiny, MULT_SHINY } from '../js/regras.js';
import { ITEMS, ITENS_REPELENTE, categoriaDoItem } from '../js/dados.js';

const rota = { id: 'rota1', pool: [{ id: 16, n: 'pidgey', p: 8 }, { id: 19, n: 'rattata', p: 8 }, { id: 151, n: 'mew', p: 0.1, m: 1 }] };
const saberCom = derrotados => somarRegistros([{ derrotados }]);

test('a rota só libera a caça quando todas as espécies (sem contar míticos) estão reveladas', () => {
  assert.equal(cacaveisDaRota(rota, saberCom({})).length, 2); // Mew fica de fora da conta
  assert.equal(rotaLiberaCaca(rota, saberCom({ pidgey: REVELA_DERROTADOS })), false);
  assert.deepEqual(progressoCaca(rota, saberCom({ pidgey: REVELA_DERROTADOS })), { reveladas: 1, total: 2 });
  const tudo = { pidgey: REVELA_DERROTADOS, rattata: REVELA_DERROTADOS + 3 };
  assert.equal(rotaLiberaCaca(rota, saberCom(tudo)), true);
  assert.deepEqual(progressoCaca(rota, saberCom(tudo)), { reveladas: 2, total: 2 });
  assert.equal(rotaLiberaCaca({ id: 'x', pool: [] }, saberCom({})), false); // rota sem espécie não libera nada
});

test('cacaDaRota: só com o modo ligado e a espécie escolhida', () => {
  assert.equal(cacaDaRota({ caca: { rota1: 'pidgey' } }, rota), null);                       // modo desligado
  assert.equal(cacaDaRota({ cacaShiny: true, caca: {} }, rota), null);
  assert.equal(cacaDaRota({ cacaShiny: true, caca: { rota1: 'pidgey' } }, rota), 'pidgey');
  assert.equal(cacaDaRota({ cacaShiny: true, caca: { outra: 'zubat' } }, rota), null);       // caça é por rota
  assert.equal(cacaDaRota(null, rota), null);
});

test('repelentes: total espanta todo mundo, seletivo deixa passar só um — e nenhum mexe no resto', () => {
  const comRepel = (tipo, especie, passos = 5) => ({ repelente: { tipo, especie, passos } });
  assert.equal(repelenteAtivo({}), null);
  assert.equal(repelenteAtivo(comRepel('total', null, 0)), null);            // acabou = não está ativo
  assert.equal(semSelvagens(comRepel('total'), rota), true);
  assert.equal(especieForcada(comRepel('total'), rota), null);
  assert.equal(semSelvagens(comRepel('seletivo', 'pidgey'), rota), false);
  assert.equal(especieForcada(comRepel('seletivo', 'pidgey'), rota), 'pidgey');
  // espécie que não vive na rota: vira repelente total ali
  assert.equal(semSelvagens(comRepel('seletivo', 'magikarp'), rota), true);
  assert.equal(especieForcada(comRepel('seletivo', 'magikarp'), rota), null);
  // o repelente passa na frente da Caça Shiny
  assert.equal(especieForcada({ ...comRepel('seletivo', 'rattata'), cacaShiny: true, caca: { rota1: 'pidgey' } }, rota), 'rattata');
  // gasta um passo por exploração e avisa no último
  const S = comRepel('total', null, 2);
  assert.equal(gastarRepelente(S), 1);
  assert.equal(gastarRepelente(S), 'acabou');
  assert.equal(S.repelente, undefined);
  assert.equal(gastarRepelente(S), null);
});

test('os dois repelentes existem na loja, com duração e divisão própria', () => {
  for (const [k, it] of Object.entries(ITENS_REPELENTE)) {
    assert.ok(ITEMS[k] && it.price > 0 && it.passos > 0, k);
    assert.ok(['total', 'seletivo'].includes(it.repelente), k);
    assert.equal(categoriaDoItem(it), 'exploracao', k);
  }
});

test('segredo do brilho: ser shiny dobra XP e dinheiro', () => {
  assert.equal(MULT_SHINY, 2);
  assert.equal(multShiny({ player: { shiny: true } }), 2);
  assert.equal(multShiny({ player: { shiny: false } }), 1);
  assert.equal(multShiny(null), 1);
  assert.equal(bonusShiny({ player: { shiny: true } }), true);
});
