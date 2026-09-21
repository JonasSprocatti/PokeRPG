// Sanidade das tabelas de js/dados.js: pega erro de digitação em conteúdo novo (tipo, item, zona)
// que não quebraria nada na hora — só deixaria a mecânica inerte em silêncio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATS, TYPE_PT, TC, CHART, NATURES, PINCH, ABSORB, IMPL, AIL_MSG, ST_SHORT, ITEMS, FIND_ITEMS, ZONES, FLAVOR } from '../js/dados.js';

const TIPOS = Object.keys(TYPE_PT);

test('os 18 tipos estão em todas as tabelas de tipo', () => {
  assert.equal(TIPOS.length, 18);
  assert.deepEqual(Object.keys(CHART).sort(), [...TIPOS].sort());
  assert.deepEqual(Object.keys(TC).sort(), [...TIPOS].sort());
});

test('CHART: só tipos válidos, e nenhum tipo em duas listas do mesmo atacante', () => {
  for (const [atk, c] of Object.entries(CHART)) {
    const todos = [...c.se, ...c.nv, ...(c.im || [])];
    for (const t of todos) assert.ok(TIPOS.includes(t), `${atk} cita tipo desconhecido "${t}"`);
    assert.equal(new Set(todos).size, todos.length, `${atk} repete um tipo entre se/nv/im`);
  }
});

test('NATURES: 25, 5 neutras, as outras sobem e descem atributos diferentes (nunca HP)', () => {
  const lista = Object.values(NATURES);
  assert.equal(lista.length, 25);
  assert.equal(lista.filter(n => !n.length).length, 5);
  for (const n of lista.filter(n => n.length)) {
    assert.equal(n.length, 2);
    assert.notEqual(n[0], n[1]);
    for (const s of n) assert.ok(STATS.includes(s) && s !== 'hp');
  }
});

test('habilidades implementadas apontam pra tipos válidos', () => {
  for (const t of Object.values(PINCH)) assert.ok(TIPOS.includes(t));
  for (const a of Object.values(ABSORB)) assert.ok(TIPOS.includes(a.type));
  for (const k of [...Object.keys(PINCH), ...Object.keys(ABSORB)]) assert.ok(IMPL.has(k));
});

test('todo status tem mensagem e sigla', () => {
  assert.deepEqual(Object.keys(AIL_MSG).sort(), Object.keys(ST_SHORT).sort());
});

test('ITEMS: itens encontráveis existem e estágios apontam pra atributo real', () => {
  for (const k of FIND_ITEMS) assert.ok(ITEMS[k], `FIND_ITEMS cita "${k}", que não existe em ITEMS`);
  for (const [k, it] of Object.entries(ITEMS)) {
    if (it.stage) assert.ok(STATS.includes(it.stage), `${k}: estágio "${it.stage}" inválido`);
    if (Array.isArray(it.cure)) for (const s of it.cure) assert.ok(AIL_MSG[s], `${k}: cura status desconhecido "${s}"`);
  }
});

test('ZONES: ids únicos, faixa de nível coerente, ambientação só de zona que existe', () => {
  const ids = ZONES.map(z => z.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const z of ZONES.filter(z => z.pool)) {
    assert.ok(z.min >= 1 && z.min <= z.max && z.max <= 100, `${z.id}: faixa ${z.min}–${z.max}`);
    assert.ok(z.pool.length > 0);
    for (const id of z.pool) assert.ok(Number.isInteger(id) && id >= 1 && id <= 1025);
  }
  for (const k of Object.keys(FLAVOR)) assert.ok(k === 'default' || ids.includes(k), `FLAVOR.${k} não é uma zona`);
});
