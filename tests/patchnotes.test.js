// Notas de atualização (js/dados-patchnotes.js): o arquivo é escrito à mão, então o teste guarda o formato.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PATCH_NOTES } from '../js/dados-patchnotes.js';

test('toda versão tem rótulo, data, título, piada e pelo menos uma seção com itens', () => {
  assert.ok(PATCH_NOTES.length >= 5);
  const versoes = PATCH_NOTES.map(p => p.versao);
  assert.equal(new Set(versoes).size, versoes.length, 'versão repetida');
  for (const p of PATCH_NOTES) {
    const onde = `v${p.versao}`;
    assert.match(p.versao, /^\d+\.\d+$/, onde);
    assert.match(p.data, /^\d{4}-\d{2}-\d{2}$/, `${onde}: data`);
    assert.ok(!Number.isNaN(Date.parse(p.data)), `${onde}: data inválida`);
    assert.ok(p.titulo?.length > 3 && p.piada?.length > 10, `${onde}: título/piada`);
    assert.ok(p.secoes?.length, `${onde}: sem seções`);
    for (const s of p.secoes) {
      assert.ok(['Novidades', 'Correções', 'Equilíbrio'].includes(s.nome), `${onde}: seção "${s.nome}"`);
      assert.ok(s.itens.length, `${onde}/${s.nome}: seção vazia`);
      for (const t of s.itens) assert.ok(typeof t === 'string' && t.length > 20, `${onde}/${s.nome}: item curto demais`);
    }
  }
});

/* Compara versão por PARTES, não como número decimal: `parseFloat('2.10')` dá 2.1, que é menor que 2.9 — ou seja,
   a décima correção de uma mesma linha apareceria como "mais velha" que a nona. Comparar [maior, menor] resolve
   e não obriga a pular de 2.9 direto pra 3.0 só pra fugir da conta. */
const maior = (a, b) => {
  const [am, an] = a.split('.').map(Number), [bm, bn] = b.split('.').map(Number);
  return am !== bm ? am > bm : an > bn;
};

test('ordem: da mais nova para a mais antiga (versão e data)', () => {
  assert.ok(maior('2.10', '2.9'), 'a comparação precisa ser por partes, não por parseFloat');
  for (let i = 1; i < PATCH_NOTES.length; i++) {
    const nova = PATCH_NOTES[i - 1], velha = PATCH_NOTES[i];
    assert.ok(maior(nova.versao, velha.versao), `v${nova.versao} deveria vir depois de v${velha.versao}`);
    assert.ok(Date.parse(nova.data) >= Date.parse(velha.data), `data de v${nova.versao} anterior à de v${velha.versao}`);
  }
});
