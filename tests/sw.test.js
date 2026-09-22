// Modo offline: todo arquivo do jogo precisa estar no PRECACHE do service worker (sw.js). Esquecer um módulo
// novo não quebra nada online — só faz o jogo não abrir offline, sem aviso nenhum. Este teste pega isso.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);
const sw = readFileSync(new URL('sw.js', raiz), 'utf8');
const precache = [...sw.match(/const PRECACHE = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);

test('todo js/*.js está no PRECACHE do sw.js', () => {
  const faltando = readdirSync(new URL('js/', raiz)).filter(f => f.endsWith('.js')).map(f => './js/' + f).filter(f => !precache.includes(f));
  assert.deepEqual(faltando, [], `adicione em PRECACHE (sw.js): ${faltando.join(', ')}`);
});

test('PRECACHE não aponta pra arquivo que não existe (o install do service worker falharia inteiro)', () => {
  for (const f of precache.filter(f => f !== './')) assert.doesNotThrow(() => readFileSync(new URL(f, raiz)), `${f} não existe`);
});
