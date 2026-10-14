import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { roteiro } from '../ferramentas/gerar-roteiro-saga.mjs';

test('docs/saga-roteiro.md está em dia com o mundo (senão: node ferramentas/gerar-roteiro-saga.mjs)', () => {
  assert.equal(fs.readFileSync(new URL('../docs/saga-roteiro.md', import.meta.url), 'utf8'), roteiro() + '\n');
});
