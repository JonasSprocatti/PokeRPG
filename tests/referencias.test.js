/* Função chamada dentro de template literal (`${algumaCoisa(x)}`) que não existe em lugar nenhum.
   Esse é o erro que o JavaScript NÃO acusa até a linha rodar — e a UI inteira deste jogo é montada com template
   literal, então essas chamadas só acontecem quando a tela é desenhada de verdade, no navegador.
   Aconteceu: `opcaoShiny(d)` era chamada em criacao.js e nunca tinha sido escrita. Resultado: ReferenceError a
   cada clique numa espécie, dentro de um `try` que traduzia tudo como erro de rede. O jogador passou horas
   limpando cache e trocando de conexão atrás de um problema que era uma função faltando.
   O teste é de propósito estreito (só `${nome(`): é onde o custo de errar é alto e a chance de falso positivo é
   baixa. Não substitui um lint de verdade — mas não precisa de dependência nenhuma pra existir. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('../js/', import.meta.url);

// o que o próprio arquivo declara: function/class/const/let/var, inclusive `const f = (x) => ...`
function declarados(src) {
  const nomes = new Set();
  for (const re of [/\b(?:function|class)\s+([A-Za-z_$][\w$]*)/g, /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g]) {
    for (const m of src.matchAll(re)) nomes.add(m[1]);
  }
  // desestruturação: const { a, b: c } = ... / import { a, b as c } from ...
  for (const m of src.matchAll(/(?:const|let|var|import)\s*\{([^}]*)\}/g)) {
    for (const p of m[1].split(',')) {
      const n = p.split(/:|\bas\b/).pop().trim();
      if (/^[A-Za-z_$][\w$]*$/.test(n)) nomes.add(n);
    }
  }
  for (const m of src.matchAll(/import\s+([A-Za-z_$][\w$]*)\s+from/g)) nomes.add(m[1]);       // import padrão
  for (const m of src.matchAll(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)/g)) nomes.add(m[1]);    // import * as
  // parâmetros de função e de arrow: `function f(a, b)` e `(a, b) =>` — chamadas a callback vêm daí
  for (const m of src.matchAll(/(?:function\s*[A-Za-z_$\w]*\s*)?\(([^()]*)\)\s*(?:=>|\{)/g)) {
    for (const p of m[1].split(',')) {
      const n = p.replace(/=.*$/, '').replace(/\.\.\./, '').trim();
      if (/^[A-Za-z_$][\w$]*$/.test(n)) nomes.add(n);
    }
  }
  for (const m of src.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) nomes.add(m[1]);                  // arrow de 1 arg
  return nomes;
}

const GLOBAIS = new Set(['String', 'Number', 'Boolean', 'Object', 'Array', 'Math', 'JSON', 'Date', 'Set', 'Map',
  'Promise', 'Error', 'RegExp', 'parseInt', 'parseFloat', 'isNaN', 'encodeURIComponent', 'decodeURIComponent',
  'document', 'window', 'navigator', 'location', 'console', 'fetch', 'structuredClone']);

test('toda função chamada dentro de template literal existe', () => {
  const faltando = [];
  for (const arq of readdirSync(DIR).filter(f => f.endsWith('.js'))) {
    const src = readFileSync(new URL(arq, DIR), 'utf8');
    const tem = declarados(src);
    for (const m of src.matchAll(/\$\{\s*([A-Za-z_$][\w$]*)\s*\(/g)) {
      const nome = m[1];
      if (tem.has(nome) || GLOBAIS.has(nome)) continue;
      const linha = src.slice(0, m.index).split('\n').length;
      faltando.push(`${arq}:${linha} → ${nome}() não está definida nem importada`);
    }
  }
  assert.deepEqual(faltando, [], '\n' + faltando.join('\n'));
});
