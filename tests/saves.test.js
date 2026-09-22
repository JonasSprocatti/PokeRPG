// Jornadas salvas (js/saves.js): a reconciliação entre este aparelho e a nuvem nunca descarta nada sozinha.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconciliarSaves, resumoSave } from '../js/saves.js';

const S = (id, salvoEm) => ({ id, salvoEm, player: { name: 'pikachu', level: 5 } });
const rem = s => ({ jornada_id: s.id, dados: s });
const rec = (o = {}) => reconciliarSaves({ ativo: null, guardadas: {}, remotos: [], terminadas: new Set(), excluidos: new Set(), ...o });

test('mesma jornada dos dois lados: vale a mais nova, sem perguntar', () => {
  let r = rec({ ativo: S('a', 10), remotos: [rem(S('a', 20))] });
  assert.equal(r.novoAtivo.salvoEm, 20); assert.deepEqual(r.subir, []); assert.deepEqual(r.perguntar, []);
  r = rec({ ativo: S('a', 30), remotos: [rem(S('a', 20))] });
  assert.equal(r.novoAtivo, null); assert.deepEqual(r.subir.map(x => x.id), ['a']);
  r = rec({ guardadas: { g: S('g', 5) }, remotos: [rem(S('g', 9))] });
  assert.equal(r.guardadas.g.salvoEm, 9); assert.deepEqual(r.perguntar, []);
});

test('jornada da nuvem desconhecida: pergunta (não descarta a daqui)', () => {
  const r = rec({ ativo: S('a', 10), remotos: [rem(S('b', 50))] });
  assert.deepEqual(r.perguntar.map(x => x.id), ['b']);
  assert.deepEqual(r.subir.map(x => x.id), ['a']); // a daqui sobe como mais uma jornada
  assert.equal(r.novoAtivo, null);
});

test('guardada já conhecida não pergunta de novo; só local sobe', () => {
  const r = rec({ guardadas: { g: S('g', 5), h: S('h', 1) }, remotos: [rem(S('g', 5))] });
  assert.deepEqual(r.perguntar, []);
  assert.deepEqual(r.subir.map(x => x.id).sort(), ['g', 'h']); // g empatada sobe (mesma versão), h só existe aqui
});

test('terminada ou excluída: apaga da nuvem e daqui; exclusão que a nuvem não tem mais é esquecida', () => {
  const r = rec({ ativo: S('fim', 1), guardadas: { x: S('x', 1), ok: S('ok', 1) },
    remotos: [rem(S('fim', 1)), rem(S('x', 1))], terminadas: new Set(['fim']), excluidos: new Set(['x', 'velha']) });
  assert.equal(r.ativoTerminou, true);
  assert.deepEqual(r.apagarRemotos.sort(), ['fim', 'x']);
  assert.deepEqual(Object.keys(r.guardadas), ['ok']);
  assert.deepEqual(r.esquecer, ['velha']);
  assert.deepEqual(r.subir.map(x => x.id), ['ok']);
});

test('resumoSave: dados pra lista, com padrões pra save antigo', () => {
  const r = resumoSave({ id: 'a', money: 300, player: { name: 'eevee', nick: 'Evi', id: 133, level: 12 } });
  assert.deepEqual([r.nome, r.especie, r.pokeId, r.nivel, r.dificuldade, r.gen, r.dinheiro], ['Evi', 'eevee', 133, 12, 'easy', 1, 300]);
});
