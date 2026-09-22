// Ajustes: escolha de fonte (js/ajustes.js). Sem DOM: aplicarFonte só devolve a fonte quando não há document.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FONTES, fonteDe, fonteEscolhida, urlDaFonte, aplicarFonte, FONTE_KEY } from '../js/ajustes.js';

test('lista de fontes: ids únicos, pilha com fonte do sistema no fim e famílias pro Google Fonts', () => {
  const ids = FONTES.map(f => f.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids[0], 'padrao');
  for (const f of FONTES) {
    assert.ok(f.nome && f.desc, f.id);
    assert.ok(f.familias.length, `${f.id}: sem família`);
    for (const fam of f.familias) assert.match(fam, /^[A-Za-z+]+(:wght@[\d;]+)?$/, `${f.id}: família "${fam}"`);
    // sempre termina numa fonte que existe no aparelho, pra nunca ficar ilegível sem internet
    assert.match(f.display, /(system-ui|monospace)/, `${f.id}: display sem reserva`);
    assert.match(f.corpo, /(system-ui|monospace)/, `${f.id}: corpo sem reserva`);
  }
});

test('fonteDe: id desconhecido cai no padrão; url junta as famílias', () => {
  assert.equal(fonteDe('nao-existe').id, 'padrao');
  assert.equal(fonteDe('lexend').id, 'lexend');
  assert.equal(fonteEscolhida().id, 'padrao');            // sem localStorage (Node) = padrão
  assert.equal(urlDaFonte(fonteDe('lexend')), 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap');
  assert.ok(urlDaFonte(fonteDe('padrao')).includes('family=Atkinson+Hyperlegible:wght@400;700&family=Fredoka'));
  assert.equal(FONTE_KEY, 'pokerpg-fonte');
  assert.equal(aplicarFonte('andika').id, 'andika');       // sem DOM: só devolve a escolhida
});
