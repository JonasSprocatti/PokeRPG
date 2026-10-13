/* 🧪 Testadores: liberar um modo em construção pra contas escolhidas (`perfis.beta`).
   Não dá pra simular login no Node (a sessão do Supabase é privada do `nuvem.js`), então este teste trava as
   DUAS coisas que podem estragar em silêncio:
   1. a regra de acesso mora num ponto só (`nuvem.podeUsarModo`) — o cartão da criação e a trava do
      `iniciarJornada` perguntam nele, senão um dos dois fica velho ("regra que só existe na tela não é regra");
   2. a migration protege a coluna: ninguém se promove pela API, e as duas funções conferem o admin NO BANCO. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DIFICULDADES } from '../js/dados.js';

const ler = caminho => fs.readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

test('o Saga é o modo em construção que abre pra testador; os outros modos não mudam', () => {
  assert.equal(DIFICULDADES.saga.admin, true);
  assert.equal(DIFICULDADES.saga.beta, true);
  for (const [k, d] of Object.entries(DIFICULDADES)) if (k !== 'saga') assert.ok(!d.admin && !d.beta, `${k} não devia ter trava`);
});

test('sem login ninguém é admin nem testador, e modo aberto continua aberto', async () => {
  globalThis.localStorage ||= { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 };
  const { podeUsarModo, ehBeta, ehAdmin, nuvem } = await import('../js/nuvem.js');
  assert.equal(podeUsarModo(DIFICULDADES.roguelike), true);
  assert.equal(podeUsarModo(DIFICULDADES.saga), false);
  nuvem.beta = true; nuvem.admin = true;       // marca sem sessão não vale: as duas exigem estar logado
  assert.equal(ehBeta(), false); assert.equal(ehAdmin(), false); assert.equal(podeUsarModo(DIFICULDADES.saga), false);
  nuvem.beta = false; nuvem.admin = false;
  assert.equal(podeUsarModo(undefined), true, 'modo desconhecido não trava a tela (quem recusa é a validação da jornada)');
});

test('a regra de acesso ao modo mora em UM lugar: a criação pergunta a `podeUsarModo`', () => {
  const criacao = ler('js/criacao.js');
  assert.ok(!/\.admin\s*&&\s*!ehAdmin\(\)/.test(criacao) && !/!x\.admin\s*\|\|\s*ehAdmin\(\)/.test(criacao), 'sobrou uma cópia da regra antiga em criacao.js');
  assert.ok(criacao.includes('filter(([, x]) => podeUsarModo(x))'), 'o cartão do modo');
  assert.ok(criacao.includes('if (!podeUsarModo(DIFICULDADES[dificuldade])) throw'), 'a trava de iniciarJornada');
  // `beta` é lido à parte: pedir a coluna junto das outras derrubaria o perfil inteiro antes de a migration chegar
  const nuvem = ler('js/nuvem.js');
  assert.ok(!/select\('[^']*\badmin\b[^']*\bbeta\b/.test(nuvem) && nuvem.includes(".select('beta')"));
});

test('a migration protege a coluna e as funções conferem o admin no banco', () => {
  const arq = fs.readdirSync(new URL('../supabase/migrations/', import.meta.url)).find(n => n.endsWith('_beta_testers.sql'));
  assert.ok(arq && /^\d{14}_/.test(arq), 'migration com nome no padrão');
  const sql = ler(`supabase/migrations/${arq}`), semComentario = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(semComentario, /add column if not exists beta boolean not null default false/);
  assert.ok(!/\bdrop\s+(table|column)\b/i.test(semComentario), 'nada destrutivo em migration');
  assert.match(semComentario, /before insert or update on public\.perfis\s+for each row execute function public\.proteger_perfis_beta/);
  const corpo = nome => semComentario.slice(semComentario.indexOf(`function public.${nome}(`));
  for (const f of ['proteger_perfis_beta', 'definir_beta', 'listar_beta']) assert.match(corpo(f).slice(0, 900), /where (a\.)?id = auth\.uid\(\) and (a\.)?admin/, `${f} tem de olhar o admin`);
  assert.match(corpo('definir_beta'), /raise exception 'só admin'/);
  for (const f of ['definir_beta(text, boolean)', 'listar_beta()']) {
    assert.ok(semComentario.includes(`revoke all on function public.${f} from public, anon`), `${f}: visitante não chama`);
    assert.ok(semComentario.includes(`grant execute on function public.${f} to authenticated`));
  }
});
