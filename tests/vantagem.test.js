/* A seta de vantagem no botão do golpe (regras.vantagemDoGolpe). É o que traduz a tabela de 18 tipos pra quem
   está começando, então errar aqui é ensinar errado — e ensinar errado é pior que não ensinar. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vantagemDoGolpe, VANTAGENS, typeEff } from '../js/regras.js';

const alvo = (...types) => ({ data: { types } });
const golpe = (type, cls = 'physical') => ({ name: 'g', type, cls, power: 60 });

test('cada faixa de eficácia cai na etiqueta certa', () => {
  // 4× (dois tipos fracos ao mesmo golpe): Pedra contra Fogo/Voador
  assert.equal(vantagemDoGolpe(golpe('rock'), alvo('fire', 'flying')).rotulo, 'extremamente efetivo');
  assert.equal(vantagemDoGolpe(golpe('water'), alvo('fire')).rotulo, 'super efetivo');
  assert.equal(vantagemDoGolpe(golpe('normal'), alvo('normal')).rotulo, 'dano normal');
  assert.equal(vantagemDoGolpe(golpe('fire'), alvo('water')).rotulo, 'pouco efetivo');
  // ¼× : Fogo contra Fogo/Água
  assert.equal(vantagemDoGolpe(golpe('fire'), alvo('fire', 'water')).rotulo, 'quase sem efeito');
  // 0× : Normal não afeta Fantasma
  const nulo = vantagemDoGolpe(golpe('normal'), alvo('ghost'));
  assert.equal(nulo.rotulo, 'não afeta');
  assert.equal(nulo.mult, 0);
});

test('golpe de status não recebe seta (ele não usa a tabela de tipos)', () => {
  assert.equal(vantagemDoGolpe(golpe('normal', 'status'), alvo('ghost')), null);
  assert.equal(vantagemDoGolpe(null, alvo('fire')), null);
  assert.equal(vantagemDoGolpe(golpe('fire'), null), null);
});

test('quem terastalizou é lido pelo tipo Tera — a seta tem que acompanhar', () => {
  const charizard = { data: { types: ['fire', 'flying'] } };
  assert.equal(vantagemDoGolpe(golpe('rock'), charizard).mult, 4);
  // Pedra contra Água é neutro (1×): sai dos 4× de Fogo/Voador pra um tipo só
  assert.equal(vantagemDoGolpe(golpe('rock'), { ...charizard, tera: 'water' }).mult, 1,
    'Tera Água deixa de tomar 4× de Pedra, e a seta precisa dizer isso');
  // e o Tera pode piorar: Tera Fogo toma 2× de Pedra, não os 4× de antes
  assert.equal(vantagemDoGolpe(golpe('rock'), { ...charizard, tera: 'fire' }).mult, 2);
});

test('a tabela de faixas cobre todo multiplicador possível, sem buraco', () => {
  // todo resultado que typeEff consegue produzir tem que achar uma faixa
  for (const mult of [0, 0.25, 0.5, 1, 2, 4]) {
    const faixa = VANTAGENS.find(v => mult >= v.min);
    assert.ok(faixa, `sem faixa pra ×${mult}`);
  }
  // as faixas vão do melhor pro pior, sem empate de nível
  const niveis = VANTAGENS.map(v => v.nivel);
  assert.deepEqual(niveis, [...niveis].sort((a, b) => b - a));
  assert.equal(new Set(niveis).size, niveis.length);
  for (const v of VANTAGENS) assert.ok(v.seta && v.rotulo && v.classe, v.rotulo);
  // sanidade da própria tabela de tipos, que é a base de tudo
  assert.equal(typeEff('electric', ['ground']), 0);
});
