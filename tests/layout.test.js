// Modelo dos painéis (js/layout.js): o que vem do localStorage nunca pode sumir com um painel nem duplicar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PAINEIS, LAYOUT_PADRAO, LARG_MIN, LARG_MAX, ALT_MIN, normalizarLayout, moverPainel, deslocar, trocarZona,
  alternarRecolhido, definirLargura, definirAltura, zonaDe
} from '../js/layout.js';

const todos = l => [...l.zonas.esq, ...l.zonas.centro, ...l.zonas.dir];

test('padrão: cada painel exatamente uma vez', () => {
  const l = normalizarLayout(null);
  assert.deepEqual([...todos(l)].sort(), [...PAINEIS].sort());
  assert.deepEqual(l.zonas, LAYOUT_PADRAO.zonas);
  assert.equal(l.alt.log, 190);
});

test('normalizar conserta save quebrado: repetido, desconhecido, faltando, números fora da faixa', () => {
  const l = normalizarLayout({ zonas: { esq: ['ficha', 'ficha', 'xyz'], centro: 'lixo', dir: ['log'] }, larg: { esq: 50, dir: 9999 }, alt: { log: 10, ficha: 'a' }, recolhidos: ['log', 'log', 'zzz'] });
  assert.deepEqual([...todos(l)].sort(), [...PAINEIS].sort());
  assert.deepEqual(l.zonas.esq, ['ficha']);
  assert.equal(zonaDe(l, 'log'), 'dir');           // respeitou onde estava
  assert.equal(zonaDe(l, 'missoes'), 'dir');       // faltando → zona padrão
  assert.equal(l.larg.esq, LARG_MIN); assert.equal(l.larg.dir, LARG_MAX);
  assert.equal(l.alt.log, ALT_MIN); assert.equal(l.alt.ficha, undefined);
  assert.deepEqual(l.recolhidos, ['log']);
});

test('moverPainel: tira de onde está e põe na posição pedida, sem mutar o original', () => {
  const l = normalizarLayout(null);
  const m = moverPainel(l, 'mochila', 'esq', 0);
  assert.deepEqual(m.zonas.esq, ['mochila', 'ficha']);
  assert.deepEqual(m.zonas.dir, ['missoes', 'aliados']);
  assert.deepEqual(l.zonas.esq, ['ficha']);
  assert.deepEqual(moverPainel(l, 'ficha', 'dir', 99).zonas.dir, ['missoes', 'aliados', 'mochila', 'ficha']); // índice além do fim = no fim
  assert.deepEqual(moverPainel(l, 'nada', 'dir', 0).zonas, l.zonas); // painel desconhecido não mexe em nada
});

test('deslocar (▲▼) e trocarZona (⇄)', () => {
  const l = normalizarLayout(null);
  assert.deepEqual(deslocar(l, 'aliados', -1).zonas.dir, ['aliados', 'missoes', 'mochila']);
  assert.deepEqual(deslocar(l, 'missoes', -1).zonas.dir, ['missoes', 'aliados', 'mochila']); // no topo: fica
  assert.deepEqual(deslocar(l, 'mochila', 1).zonas.dir, ['missoes', 'aliados', 'mochila']);  // no fim: fica
  assert.equal(zonaDe(trocarZona(l, 'ficha'), 'ficha'), 'centro');
  assert.equal(zonaDe(trocarZona(l, 'missoes'), 'missoes'), 'esq'); // dir → volta pra esq
});

test('recolher, largura e altura', () => {
  const l = normalizarLayout(null);
  const r = alternarRecolhido(l, 'mochila');
  assert.deepEqual(r.recolhidos, ['mochila']);
  assert.deepEqual(alternarRecolhido(r, 'mochila').recolhidos, []);
  assert.equal(definirLargura(l, 'esq', 10).larg.esq, LARG_MIN);
  assert.equal(definirLargura(l, 'dir', 420.6).larg.dir, 421);
  assert.equal(definirAltura(l, 'ficha', 30).alt.ficha, ALT_MIN);
  assert.equal(definirAltura(l, 'ficha', 500).alt.ficha, 500);
});
