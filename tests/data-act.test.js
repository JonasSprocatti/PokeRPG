/* Todo `data-act` que a tela EMITE é tratado por alguém.
   Nasceu de um bug real (05/10/2026): a fileira de comandar a comitiva desenhava bonito, mostrava o ofício de cada
   um, e o clique não fazia absolutamente nada — `render.js` emitia `data-act="comandar"` e `"comandar-auto"` e
   nenhum dos dois existia no `switch` do `main.js`. É da família do `SPR_SHINY`: sem navegador aqui, esse tipo de
   erro só aparece pra quem joga.

   Por que não foi feito antes: o `switch` tem ~165 casos, alguns `data-act` são montados por concatenação
   (`'ed-' + x`) e outros são tratados FORA do switch (`closest('[data-painel-acao]')`), e a varredura ingênua
   daria falso positivo. A saída é esta: só os LITERAIS entram na conta (nome com `${` é pulado, porque aí o nome
   não existe no código-fonte), e o que é tratado fora do switch vai numa lista de exceções explícita.
   Hoje a lista está VAZIA, e é o melhor estado possível — se um dia precisar de uma linha, ela vem com o motivo.

   Limite conhecido: um `case 'x'` de OUTRO switch do `main.js` conta como tratamento. É teto aceitável — este
   teste existe pra pegar o `data-act` ÓRFÃO, não pra provar que o caso certo está no switch certo. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const js = f => readFileSync(path.join(RAIZ, 'js', f), 'utf8');

// `data-act` tratado fora do `switch` do main.js. Uma linha por caso, com o motivo — nunca "pra passar o teste".
const FORA_DO_SWITCH = new Set([]);

test('todo data-act literal emitido tem quem o trate', () => {
  const emitidos = new Map();
  for (const f of readdirSync(path.join(RAIZ, 'js')).filter(f => f.endsWith('.js'))) {
    // nome com `${` é montado na hora (`data-act="ed-${x}"`): não existe literal pra conferir
    for (const m of js(f).matchAll(/data-act="([^"${}]+)"/g)) {
      if (!emitidos.has(m[1])) emitidos.set(m[1], new Set());
      emitidos.get(m[1]).add(f);
    }
  }
  assert.ok(emitidos.size > 100, `achou só ${emitidos.size} data-act — a varredura quebrou`);

  const main = js('main.js');
  const tratados = new Set([...main.matchAll(/case '([^']+)'/g)].map(m => m[1]));
  assert.ok(tratados.size > 100, `achou só ${tratados.size} casos no switch — a varredura quebrou`);

  const orfaos = [...emitidos].filter(([a]) => !tratados.has(a) && !FORA_DO_SWITCH.has(a))
    .map(([a, onde]) => `${a} (emitido em ${[...onde].join(', ')})`);
  assert.deepEqual(orfaos, [], `data-act sem tratamento — o clique não vai fazer nada:\n  ${orfaos.join('\n  ')}`);
});

test('a lista de exceções não guarda nome que o switch já trata', () => {
  // exceção que virou caso de switch é lixo acumulado: o teste deixaria de cobrir o nome de verdade
  const tratados = new Set([...js('main.js').matchAll(/case '([^']+)'/g)].map(m => m[1]));
  for (const a of FORA_DO_SWITCH) assert.ok(!tratados.has(a), `"${a}" já está no switch: tire da lista de exceções`);
});
