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

test('ordem: da mais nova para a mais antiga (versão e data)', () => {
  for (let i = 1; i < PATCH_NOTES.length; i++) {
    const nova = PATCH_NOTES[i - 1], velha = PATCH_NOTES[i];
    assert.ok(parseFloat(nova.versao) > parseFloat(velha.versao), `v${nova.versao} deveria vir depois de v${velha.versao}`);
    assert.ok(Date.parse(nova.data) >= Date.parse(velha.data), `data de v${nova.versao} anterior à de v${velha.versao}`);
  }
});
