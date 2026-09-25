// Insígnia Alpha (js/alpha.js): a regra é a data de criação da conta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALPHA_ATE, ehJogadorAlpha, htmlInsigniaAlpha, htmlCartaoAlpha } from '../js/alpha.js';

test('conta criada antes do fim do Alpha tem a insígnia; depois, não', () => {
  assert.equal(ehJogadorAlpha('2026-09-20T12:00:00Z'), true);
  assert.equal(ehJogadorAlpha('2026-09-25T23:59:59Z'), true);
  assert.equal(ehJogadorAlpha(ALPHA_ATE), false, 'no instante exato o Alpha já acabou');
  assert.equal(ehJogadorAlpha('2026-10-15T00:00:00Z'), false);
});

test('sem data válida (conta sem criado_em, lixo, nulo) não ganha insígnia — nunca por engano', () => {
  for (const v of [null, undefined, '', 'ontem', NaN]) assert.equal(ehJogadorAlpha(v), false, String(v));
});

test('o SVG é acessível e cada desenho tem ids próprios (topo e conta ao mesmo tempo)', () => {
  const a = htmlInsigniaAlpha(), b = htmlInsigniaAlpha({ compacto: true });
  assert.match(a, /role="img"/); assert.match(a, /aria-label="Insígnia Alpha/);
  assert.ok(b.includes('compacto'));
  const id = s => s.match(/id="(al\d+)-ouro"/)[1];
  assert.notEqual(id(a), id(b));
});

test('o cartão mostra a data da conta e aguenta data ruim', () => {
  assert.match(htmlCartaoAlpha('2026-09-20T12:00:00Z'), /Conta criada em/);
  assert.ok(!htmlCartaoAlpha('lixo').includes('Conta criada em'));
  assert.ok(htmlCartaoAlpha('2026-09-20T12:00:00Z').includes('Treinador do Alpha'));
});
