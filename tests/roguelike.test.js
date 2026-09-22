// Desbloqueios do Roguelike (js/roguelike.js): somam entre jornadas, só contam jornadas Roguelike.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { progressoRoguelike, desbloqueadas, novosDesbloqueios, textoProgresso } from '../js/roguelike.js';
import { DESBLOQUEIO } from '../js/dados.js';

const jornada = (registro, dificuldade = 'roguelike') => ({ dificuldade, registro });

test('10 derrotas somadas entre jornadas desbloqueiam; 9 não', () => {
  const a = jornada({ derrotados: { pidgey: 6 }, ids: { pidgey: 16 } });
  const b = jornada({ derrotados: { pidgey: 3 } });
  assert.equal(desbloqueadas([a, b]).length, 0);
  const c = jornada({ derrotados: { pidgey: 1 } });
  const d = desbloqueadas([a, b, c]);
  assert.deepEqual(d.map(p => [p.especie, p.id, p.razoes]), [['pidgey', 16, ['derrotados']]]);
});

test('5 amizades desbloqueiam', () => {
  const p = progressoRoguelike([jornada({ amigos: { zubat: 5 }, ids: { zubat: 41 } })]);
  assert.equal(p[0].desbloqueada, true); assert.deepEqual(p[0].razoes, ['amigos']);
});

test('evolução: forma do meio precisa de 5, forma final de 10', () => {
  const meio = progressoRoguelike([jornada({ evolucoes: { charmeleon: 5 }, formas: { charmeleon: 'meio' }, ids: { charmeleon: 5 } })]);
  assert.equal(meio[0].desbloqueada, true); assert.equal(meio[0].alvoEvolucao, DESBLOQUEIO.evolucaoMeio);
  const final5 = progressoRoguelike([jornada({ evolucoes: { charizard: 5 }, formas: { charizard: 'final' }, ids: { charizard: 6 } })]);
  assert.equal(final5[0].desbloqueada, false); assert.equal(final5[0].alvoEvolucao, DESBLOQUEIO.evolucaoFinal);
  const final10 = progressoRoguelike([jornada({ evolucoes: { charizard: 10 }, formas: { charizard: 'final' }, ids: { charizard: 6 } })]);
  assert.equal(final10[0].desbloqueada, true);
});

test('só jornadas Roguelike contam; iniciais ficam de fora', () => {
  const facil = jornada({ derrotados: { pidgey: 50 }, ids: { pidgey: 16 } }, 'easy');
  assert.equal(desbloqueadas([facil]).length, 0);
  const inicial = jornada({ derrotados: { bulbasaur: 20 }, ids: { bulbasaur: 1 } });
  assert.equal(progressoRoguelike([inicial]).length, 0);
});

test('ordem: desbloqueadas primeiro, depois as mais perto', () => {
  const p = progressoRoguelike([jornada({ derrotados: { a: 2, b: 8, c: 10 }, ids: { a: 900, b: 901, c: 902 } })]);
  assert.deepEqual(p.map(x => x.especie), ['c', 'b', 'a']);
  assert.equal(p[1].fracao, 0.8);
});

test('novosDesbloqueios: só o que a jornada nova liberou', () => {
  const antes = [jornada({ derrotados: { pidgey: 10, rattata: 7 }, ids: { pidgey: 16, rattata: 19 } })];
  const depois = [...antes, jornada({ derrotados: { rattata: 3 } })];
  assert.deepEqual(novosDesbloqueios(antes, depois).map(p => p.especie), ['rattata']);
  assert.deepEqual(novosDesbloqueios(depois, depois), []);
});

test('textoProgresso', () => {
  assert.equal(textoProgresso({ desbloqueada: false, derrotados: 3, amigos: 1, alvoEvolucao: null }), '3/10 derrotas · 1/5 amizades');
  assert.equal(textoProgresso({ desbloqueada: true, razoes: ['amigos'], amigos: 5 }), 'desbloqueado por 5 amizades');
});
