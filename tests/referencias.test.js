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
  /* Qualquer identificador que RECEBE valor também existe. Cobre a lista de declaradores separados por vírgula
     (`const r = x, desc = s => ...`), onde a regra de `const` acima só enxerga o primeiro nome — foi exatamente
     o falso positivo que este teste deu na estreia, acusando `desc()` em main.js. O `(?![=>])` evita confundir
     com comparação (`x ==`) e com arrow (`x =>`).
     ⚠️ O `(^|[^.\w$])` no começo é o que separa NOME de PROPRIEDADE, e a falta dele custou um bug em produção
     (29/09/2026): `G.S.zone = v` em main.js fazia o teste dar `zone` por declarada, e o `case 'caca'` chamava
     `zone()` sem importar — o botão da Caça Shiny estourava ReferenceError e não fazia nada. */
  for (const m of src.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*=(?![=>])/g)) nomes.add(m[2]);
  return nomes;
}

const GLOBAIS = new Set(['String', 'Number', 'Boolean', 'Object', 'Array', 'Math', 'JSON', 'Date', 'Set', 'Map',
  'Promise', 'Error', 'RegExp', 'parseInt', 'parseFloat', 'isNaN', 'encodeURIComponent', 'decodeURIComponent',
  'document', 'window', 'navigator', 'location', 'console', 'fetch', 'structuredClone']);

// os construtores/globais em maiúscula que o segundo teste pode encontrar (o primeiro já cobre os minúsculos)
const GLOBAIS_MAIUSCULAS = new Set(['String', 'Number', 'Boolean', 'Object', 'Array', 'Math', 'JSON', 'Date',
  'Set', 'Map', 'Promise', 'Error', 'RegExp', 'Function', 'Intl', 'WeakMap', 'WeakSet', 'URL', 'URLSearchParams', 'Image', 'Audio', 'AudioContext',
  'Event', 'CustomEvent', 'FormData', 'Blob', 'File', 'FileReader', 'Response', 'Request', 'Headers',
  'AbortController', 'ResizeObserver', 'MutationObserver', 'IntersectionObserver', 'TextEncoder', 'TextDecoder',
  'Proxy', 'Reflect', 'Symbol', 'BigInt', 'ArrayBuffer', 'Uint8Array',
  'Notification']);   // notificacoes.js: existe no navegador, e `typeof` cobre quem não tem (iOS fora da tela de início)

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

/* O teste acima só enxerga a chamada COLADA no `${` — e foi por isso que ele deixou passar um bug real
   (29/09/2026): `${e.shiny ? SPR_SHINY(e.id) : SPR(e.id)}` em multiplayer.js usava `SPR_SHINY` sem importar.
   A chamada está no meio da expressão, não logo depois do `${`, então a regex não batia. Resultado: a ☄ Sala de
   Raide montava o cabeçalho, quebrava com ReferenceError na hora de desenhar o seletor do Hall da Fama, e a
   metade de baixo da tela ficava com o HTML VELHO — quem tinha um shiny no Hall nunca conseguia escolher
   Pokémon nenhum, sem nenhum erro visível.
   Tentei generalizar o primeiro teste pra varrer a interpolação inteira e não deu: prosa em português dentro do
   HTML ("Termine (ou encerre)", "Desafiar o Alfa (") vira falso positivo, e um teste que grita à toa é pior que
   um estreito. A regra abaixo é a que separa os dois casos sem exceção nenhuma no código de hoje: nome que
   COMEÇA COM MAIÚSCULA e está COLADO no `(`. Toda a família de ajudantes de dado/sprite é assim (`SPR`,
   `SPR_SHINY`, `ITEM_SPR`, `TYPE_PT`…), e texto em prosa sempre tem espaço antes do parêntese. Varre o arquivo
   inteiro, não só template literal — chamada dessas fora de template é tão bug quanto dentro. */
test('todo ajudante em MAIÚSCULA chamado existe (pega o que o teste acima não vê)', () => {
  const faltando = [];
  for (const arq of readdirSync(DIR).filter(f => f.endsWith('.js'))) {
    const src = readFileSync(new URL(arq, DIR), 'utf8');
    const tem = declarados(src);
    for (const m of src.matchAll(/(^|[^.\w$])([A-Z][\w$]*)\(/gm)) {
      const nome = m[2];
      if (tem.has(nome) || GLOBAIS_MAIUSCULAS.has(nome)) continue;
      const linha = src.slice(0, m.index).split('\n').length;
      faltando.push(`${arq}:${linha} → ${nome}() não está definida nem importada`);
    }
  }
  assert.deepEqual(faltando, [], '\n' + faltando.join('\n'));
});

/* Terceiro cinto de segurança, e o mais geral: o ajudante que OUTRO módulo exporta e este arquivo usa sem importar.
   Os dois testes acima só olham formatos específicos (`${nome(` e NOME_EM_MAIÚSCULA(`); já escaparam duas vezes:
   `SPR_SHINY(` num ternário (Sala de Raide sem escolha de Pokémon, 29/09/2026) e `nm(P)` dentro de `esc(...)` no
   render.js, na mesma semana — as duas só estourariam quando a tela fosse desenhada, no navegador.
   A regra: se o nome é EXPORTADO por algum módulo de js/ e aparece chamado neste arquivo (`nome(` sem `.` na frente),
   então o arquivo tem de declará-lo ou importá-lo. Comentários são ignorados (citam `save()` e `turn()` à vontade);
   o que sobra na árvore de hoje é zero, então qualquer acusação é bug de verdade. */
test('todo ajudante exportado por outro módulo e chamado aqui está importado', () => {
  const arqs = readdirSync(DIR).filter(f => f.endsWith('.js'));
  const semComentarios = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[\s;,({])\/\/.*$/gm, '$1');
  const exportados = new Map();   // nome -> arquivos que o exportam
  for (const a of arqs) {
    const src = semComentarios(readFileSync(new URL(a, DIR), 'utf8'));
    for (const m of src.matchAll(/^export\s+(?:async\s+)?(?:function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)) {
      if (!exportados.has(m[1])) exportados.set(m[1], new Set());
      exportados.get(m[1]).add(a);
    }
  }
  const faltando = [];
  for (const a of arqs) {
    const src = semComentarios(readFileSync(new URL(a, DIR), 'utf8')), tem = declarados(src);
    for (const m of src.matchAll(/(^|[^.\w$'"`])([A-Za-z_$][\w$]*)\(/gm)) {
      const n = m[2];
      if (!exportados.has(n) || tem.has(n)) continue;
      faltando.push(`${a}:${src.slice(0, m.index).split('\n').length} → ${n}() não está importado (vem de ${[...exportados.get(n)].join(', ')})`);
    }
  }
  assert.deepEqual([...new Set(faltando)], [], '\n' + [...new Set(faltando)].join('\n'));
});
