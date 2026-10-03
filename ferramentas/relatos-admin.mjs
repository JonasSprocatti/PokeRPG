// Ferramenta de manutenção (NÃO faz parte do jogo, não entra no PRECACHE do sw.js): puxa os relatos de bug/sugestão
// (tabela `relatos`, bucket `relatos-imagens` — supabase/migrations/20260923120000_base.sql e
// 20260925160000_relatos_imagens.sql) direto do Supabase, usando a service role key (ignora RLS; por isso a política
// do banco só deixa cada conta ler os PRÓPRIOS relatos pela chave pública do jogo — "quem mantém o jogo lê tudo pelo
// Table Editor", e este script é a versão automática disso).
//
// A key só existe localmente em ferramentas/.relatos-admin.env (git-ignorado). Ver relatos-admin.env.example.
//
// Uso:
//   node ferramentas/relatos-admin.mjs            puxa relatos com status 'novo', baixa prints, marca como 'lido'
//   node ferramentas/relatos-admin.mjs --manter   mesma coisa, mas não marca como lido (deixa pra próxima puxada)
//   node ferramentas/relatos-admin.mjs --todos    puxa TODOS os relatos (qualquer status); não marca nada
//   node ferramentas/relatos-admin.mjs --resolver 57,58 --nota "Corrigido na versão 4.3"
//                                                 fecha esses relatos como ATENDIDOS (status 'resolvido'), com
//                                                 uma nota opcional que o jogador lê na tela 🐞 Relatar
//   node ferramentas/relatos-admin.mjs --arquivar 59 --nota "..."   fecha SEM virar mudança
//
// Status possíveis (CHECK no banco, supabase/migrations/20260929140000_relatos_status.sql):
// novo → lido → resolvido | arquivado. O jogador vê a tradução disso (dados.STATUS_RELATO), não o valor cru.
//
// Salva em relatos-baixados/ (git-ignorado): index.json (dados crus, acumulado entre puxadas) e RESUMO.md (leitura humana).

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const PASTA_SAIDA = path.join(RAIZ, 'relatos-baixados');
const ARQ_ENV = path.join(AQUI, '.relatos-admin.env');
const ARQ_INDEX = path.join(PASTA_SAIDA, 'index.json');

function carregarEnv(caminho) {
  if (!existsSync(caminho)) {
    console.error(`✗ Não achei ${path.relative(RAIZ, caminho)}.`);
    console.error(`  Gere com (a key nunca aparece na tela nem fica no histórico do shell):`);
    console.error(`  read -s -p "Service role key: " K && echo "SUPABASE_SERVICE_ROLE_KEY=$K" > ${path.relative(RAIZ, caminho)} && unset K`);
    process.exit(1);
  }
  const env = {};
  for (const linha of readFileSync(caminho, 'utf8').split('\n')) {
    const l = linha.trim();
    if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('=');
    if (i === -1) continue;
    env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  }
  return env;
}

const { SUPABASE_URL } = await import('../js/config.js');
const { SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY } = carregarEnv(ARQ_ENV);
if (!SERVICE_KEY) {
  console.error(`✗ SUPABASE_SERVICE_ROLE_KEY vazia em ${path.relative(RAIZ, ARQ_ENV)}.`);
  process.exit(1);
}

const cabecalhos = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

const args = process.argv.slice(2);
const todos = args.includes('--todos');
const manter = args.includes('--manter') || todos;
// valor que vem DEPOIS da opção (`--nota "texto"`); null = opção ausente
const valorDe = nome => { const i = args.indexOf(nome); return i === -1 ? null : (args[i + 1] ?? ''); };
const nota = valorDe('--nota');
const paraFechar = (opcao) => {
  const v = valorDe(opcao);
  if (v === null) return null;
  const ids = v.split(',').map(x => x.trim()).filter(x => /^\d+$/.test(x)).map(Number);
  if (!ids.length) { console.error(`✗ ${opcao} precisa de ids separados por vírgula (ex.: ${opcao} 57,58).`); process.exit(1); }
  return ids;
};

async function buscarRelatos() {
  const filtro = todos ? '' : '&status=eq.novo';
  const url = `${SUPABASE_URL}/rest/v1/relatos?select=*${filtro}&order=criado_em.asc`;
  const r = await fetch(url, { headers: cabecalhos });
  if (!r.ok) throw new Error(`Falha ao listar relatos: ${r.status} ${await r.text()}`);
  return r.json();
}

async function baixarImagem(caminho, destino) {
  const url = `${SUPABASE_URL}/storage/v1/object/relatos-imagens/${caminho.split('/').map(encodeURIComponent).join('/')}`;
  const r = await fetch(url, { headers: cabecalhos });
  if (!r.ok) throw new Error(`falha ao baixar imagem ${caminho}: ${r.status}`);
  writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
}

async function marcarComoLido(ids) {
  if (!ids.length) return;
  const url = `${SUPABASE_URL}/rest/v1/relatos?id=in.(${ids.join(',')})`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { ...cabecalhos, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'lido' }),
  });
  if (!r.ok) throw new Error(`Falha ao marcar como lido: ${r.status} ${await r.text()}`);
}

/* Fecha relatos: 'resolvido' (virou mudança no jogo) ou 'arquivado' (analisado, mas não vira mudança).
   `resposta` é o que o jogador lê junto do rótulo — vale muito mais que o status sozinho. */
async function fechar(ids, status, resposta) {
  const corpo = { status, resolvido_em: new Date().toISOString() };
  if (resposta) corpo.resposta = resposta;
  const url = `${SUPABASE_URL}/rest/v1/relatos?id=in.(${ids.join(',')})&select=id`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { ...cabecalhos, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(corpo),
  });
  if (!r.ok) throw new Error(`Falha ao fechar relatos: ${r.status} ${await r.text()}`);
  const feitos = await r.json();   // representation: confirma QUAIS linhas mudaram de verdade
  return feitos.map(x => x.id);
}

const indiceAtual = () => (existsSync(ARQ_INDEX) ? JSON.parse(readFileSync(ARQ_INDEX, 'utf8')) : {});

function gerarResumo(indice) {
  const lista = Object.values(indice).sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
  const linhas = ['# Relatos baixados', '', `Puxado em ${new Date().toLocaleString('pt-BR')}. ${lista.length} relato(s) no total local.`, ''];
  for (const r of lista) {
    linhas.push(`## ${r.tipo === 'bug' ? '🐞' : '💡'} #${r.id} — ${r.titulo}`);
    linhas.push(`*${r.tipo} · status: ${r.status} · ${new Date(r.criado_em).toLocaleString('pt-BR')}*`, '');
    linhas.push(r.texto);
    if (r.contexto) linhas.push('', '<details><summary>Contexto técnico</summary>', '', '```json', JSON.stringify(r.contexto, null, 2), '```', '</details>');
    if (r.arquivos?.length) linhas.push('', ...r.arquivos.map(f => `![print](${f})`));
    linhas.push('', '---', '');
  }
  return linhas.join('\n');
}

const indice = indiceAtual();
/* --resolver / --arquivar: fecham relatos e encerram aqui (não puxam nada). Separado do fluxo de leitura de
   propósito — fechar é a única coisa que este script faz que o jogador VÊ na tela dele. */
const aResolver = paraFechar('--resolver'), aArquivar = paraFechar('--arquivar');
if (aResolver || aArquivar) {
  for (const [ids, status] of [[aResolver, 'resolvido'], [aArquivar, 'arquivado']]) {
    if (!ids) continue;
    const feitos = await fechar(ids, status, nota);
    const faltaram = ids.filter(i => !feitos.includes(i));
    console.log(`✓ ${feitos.length} relato(s) marcados como '${status}'${nota ? ` com a nota "${nota}"` : ''}: ${feitos.join(', ') || '—'}`);
    if (faltaram.length) console.warn(`  ⚠ não encontrados (nada mudou): ${faltaram.join(', ')}`);
  }
  console.log('O jogador vê isso em 🐞 Relatar → "Seus relatos".');
  process.exit(0);
}

console.log(todos ? 'Puxando TODOS os relatos…' : 'Puxando relatos novos…');
const relatos = await buscarRelatos();
console.log(`${relatos.length} relato(s) encontrados.`);

const processados = [];
for (const r of relatos) {
  const pastaR = path.join(PASTA_SAIDA, String(r.id));
  const arquivos = [];
  if (r.imagens?.length) {
    mkdirSync(pastaR, { recursive: true });
    for (const [i, caminho] of r.imagens.entries()) {
      const destino = path.join(pastaR, `print-${i + 1}${path.extname(caminho) || '.jpg'}`);
      try {
        await baixarImagem(caminho, destino);
        arquivos.push(path.relative(RAIZ, destino));
      } catch (e) {
        console.warn(`  ⚠ #${r.id}: ${e.message}`);
      }
    }
  }
  indice[r.id] = { ...r, arquivos };
  processados.push(r.id);
}

mkdirSync(PASTA_SAIDA, { recursive: true });
writeFileSync(ARQ_INDEX, JSON.stringify(indice, null, 2));
writeFileSync(path.join(PASTA_SAIDA, 'RESUMO.md'), gerarResumo(indice));

if (!manter && processados.length) {
  await marcarComoLido(processados);
  console.log(`${processados.length} relato(s) marcados como 'lido'.`);
}

console.log(`✓ Pronto. Veja ${path.relative(RAIZ, path.join(PASTA_SAIDA, 'RESUMO.md'))}`);
