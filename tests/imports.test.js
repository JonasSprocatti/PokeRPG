/* Todo `import { x } from './y.js'` do jogo aponta pra algo que `y.js` realmente exporta?
   Motivo: não há build nem navegador nesta máquina, e um nome errado num import só aparece quando a tela que usa
   aquele módulo é aberta — do lado de quem joga, vira "a funcionalidade sumiu", não "erro". Foi o mesmo tipo de
   falha silenciosa do `SPR_SHINY` (29/09/2026) e do `gimmicksNaLoja`. `node --check` não pega isto: a sintaxe está
   certa, o que falta é o outro lado. Vale pro projeto inteiro, não só pro multiplayer. */
import test from 'node:test';
import assert from 'node:assert';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = new URL('../js/', import.meta.url).pathname;
const arquivos = readdirSync(DIR).filter(f => f.endsWith('.js'));
const fonte = Object.fromEntries(arquivos.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));

// nomes de uma lista `{ a, b as c }`
const nomesDaLista = txt => txt.split(',').map(s => s.trim()).filter(Boolean)
  .map(s => s.split(/\s+as\s+/).map(x => x.trim()));

/* `export const A = 1, B = 2;` declara DOIS nomes — pegar só o primeiro daria falso positivo (aconteceu com
   `VENTO_TURNOS`, `MAX_TOXINAS` e as três FELICIDADE_*). Então: varre do início da declaração até o `;` que fecha,
   pulando o que estiver dentro de string, template, comentário ou parênteses/chaves, e corta por vírgula só no
   nível de fora. */
function nomesDeclarados(txt, inicio) {
  const nomes = [];
  let nivel = 0, atual = '', aspas = null, comentario = false;
  for (let i = inicio; i < txt.length; i++) {
    const c = txt[i], ant = txt[i - 1];
    if (comentario) { if (c === '\n') comentario = false; continue; }
    if (aspas) { if (c === aspas && ant !== '\\') aspas = null; atual += c; continue; }
    if (c === '/' && txt[i + 1] === '/') { comentario = true; continue; }
    if (`'"\``.includes(c)) { aspas = c; atual += c; continue; }
    if ('([{'.includes(c)) nivel++;
    else if (')]}'.includes(c)) nivel--;
    if (nivel === 0 && c === ';') break;
    if (nivel === 0 && c === ',') { nomes.push(atual); atual = ''; } else atual += c;
  }
  nomes.push(atual);
  return nomes.map(s => s.trim().match(/^([A-Za-z_$][\w$]*)/)?.[1]).filter(Boolean);
}
function exportsDe(arquivo) {
  const txt = fonte[arquivo], out = new Set();
  const aberto = /^export\s*\*/m.test(txt);   // `export * from` = não dá pra saber a lista aqui; não cobra este alvo
  for (const m of txt.matchAll(/^export\s+(?:async\s+)?(?:function|class)\s+([A-Za-z_$][\w$]*)/gm)) out.add(m[1]);
  for (const m of txt.matchAll(/^export\s+(?:const|let|var)\s+/gm)) for (const n of nomesDeclarados(txt, m.index + m[0].length)) out.add(n);
  for (const m of txt.matchAll(/^export\s*\{([\s\S]*?)\}/gm)) for (const [nome, alias] of nomesDaLista(m[1])) out.add(alias || nome);
  if (/^export\s+default/m.test(txt)) out.add('default');
  return { nomes: out, aberto };
}
const tabela = Object.fromEntries(arquivos.map(f => [f, exportsDe(f)]));

test('todo import nomeado entre módulos do jogo existe no arquivo de origem', () => {
  const problemas = [];
  for (const arquivo of arquivos) {
    const txt = fonte[arquivo];
    for (const m of txt.matchAll(/^import\s*\{([\s\S]*?)\}\s*from\s*['"]\.\/([\w.-]+\.js)['"]/gm)) {
      const alvo = m[2];
      if (!tabela[alvo]) { problemas.push(`${arquivo}: importa de "${alvo}", que não existe em js/`); continue; }
      if (tabela[alvo].aberto) continue;
      for (const [nome] of nomesDaLista(m[1])) {
        if (!tabela[alvo].nomes.has(nome)) problemas.push(`${arquivo}: importa { ${nome} } de "${alvo}", que não exporta esse nome`);
      }
    }
  }
  assert.deepEqual(problemas, []);
});

test('nenhum módulo do multiplayer importa a camada de cima (o grafo continua sem ciclo)', () => {
  // mp-regras → mp-rede → mp-cartao → mp-telas → multiplayer. Cada um só pode olhar pra trás.
  const camada = { 'mp-regras.js': 0, 'mp-rede.js': 1, 'mp-cartao.js': 1, 'mp-resultado.js': 2, 'mp-telas.js': 3, 'multiplayer.js': 4 };
  const problemas = [];
  for (const [arquivo, nivel] of Object.entries(camada)) {
    for (const m of fonte[arquivo].matchAll(/from\s*['"]\.\/([\w.-]+\.js)['"]/g)) {
      const alvo = m[1];
      if (camada[alvo] !== undefined && camada[alvo] >= nivel) problemas.push(`${arquivo} importa ${alvo} (camada ${camada[alvo]} ≥ ${nivel})`);
    }
  }
  assert.deepEqual(problemas, []);
});
