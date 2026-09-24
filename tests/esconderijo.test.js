/* Esconderijo (js/esconderijo.js): guardar aliado em vez de se despedir pra sempre.
   O que precisa ser à prova de erro é a contagem — guardar ou trazer errado significa PERDER um aliado, que é
   exatamente o que a mecânica veio evitar. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guardar, trazer, trocar, acolher, escondidos, equipeCheia, esconderijoCheio, MAX_ESCONDIDOS } from '../js/esconderijo.js';
import { MAX_ALIADOS, freshVol } from '../js/regras.js';

const ali = nome => ({ name: nome, nick: '', level: 10, vol: { stages: { attack: -2 } } });
const save = (aliados = [], guardados = []) => ({ aliados: [...aliados], escondidos: [...guardados] });

test('guardar tira da equipe e põe no esconderijo, sem perder ninguém', () => {
  const S = save([ali('a'), ali('b')]);
  const g = guardar(S, 0, freshVol);
  assert.equal(g.name, 'a');
  assert.deepEqual(S.aliados.map(x => x.name), ['b']);
  assert.deepEqual(escondidos(S).map(x => x.name), ['a']);
  assert.deepEqual(g.vol.stages.attack, 0, 'quem guarda descansa: o estado de batalha é zerado');
  assert.equal(guardar(S, 9, freshVol), null, 'índice que não existe não faz nada');
});

test('trazer só com vaga na equipe', () => {
  const cheia = Array.from({ length: MAX_ALIADOS }, (_, i) => ali('e' + i));
  const S = save(cheia, [ali('g')]);
  assert.equal(equipeCheia(S), true);
  assert.equal(trazer(S, 0, freshVol), null, 'equipe cheia: recusa');
  assert.equal(escondidos(S).length, 1, 'e o guardado continua guardado — nada some');
  guardar(S, 0, freshVol);
  assert.equal(trazer(S, 0, freshVol).name, 'g');
  assert.equal(S.aliados.length, MAX_ALIADOS);
});

test('trocar funciona com a equipe cheia (é o caso comum)', () => {
  const cheia = Array.from({ length: MAX_ALIADOS }, (_, i) => ali('e' + i));
  const S = save(cheia, [ali('g1'), ali('g2')]);
  const r = trocar(S, 0, 1, freshVol);
  assert.equal(r.sai.name, 'e0');
  assert.equal(r.entra.name, 'g2');
  assert.ok(S.aliados.some(x => x.name === 'g2'), 'o escolhido entrou');
  assert.ok(escondidos(S).some(x => x.name === 'e0'), 'o que saiu foi guardado');
  assert.equal(S.aliados.length, MAX_ALIADOS, 'a equipe não cresce');
  assert.equal(escondidos(S).length, 2, 'nem o esconderijo');
});

test('acolher: equipe primeiro, esconderijo depois, e nada se perde em silêncio', () => {
  const S = save();
  assert.equal(acolher(S, ali('a'), freshVol), 'equipe');
  const cheia = Array.from({ length: MAX_ALIADOS }, (_, i) => ali('e' + i));
  const S2 = save(cheia);
  assert.equal(acolher(S2, ali('novo'), freshVol), 'esconderijo');
  assert.equal(escondidos(S2)[0].name, 'novo');
  // tudo cheio: devolve null, e quem chamou decide o que dizer (não some ninguém por engano)
  const S3 = save(cheia, Array.from({ length: MAX_ESCONDIDOS }, (_, i) => ali('g' + i)));
  assert.equal(esconderijoCheio(S3), true);
  assert.equal(acolher(S3, ali('sobra'), freshVol), null);
  assert.equal(acolher(S3, null, freshVol), null);
});
