/* Números escritos em CLAUDE.md / README.md que precisam continuar batendo com o código.

   Por que existe: em 29/09/2026 um levantamento do backlog achou SEIS afirmações erradas de uma vez — coisas
   dadas como pendentes que já estavam prontas ("Falta: os outros chefes e os itens", a rota esgotada listada em
   "ainda NÃO implementado", Light Screen/Stealth Rock e os itens Choice no README) e números velhos ("~30 badges"
   quando são 53; "96 formas, 93 espécies" de Mega quando são 95/89 — e o próprio CLAUDE.md já se contradizia
   dizendo "89 Megas" algumas linhas abaixo). Antes disso, a nota do Gigantamax do inimigo ficou marcada como "em
   aberto" por semanas depois de pronta. O custo não é cosmético: o usuário planeja em cima desses textos, e já
   perdeu tempo pedindo coisa que existia.

   O que este teste NÃO faz: conferir prosa. "Falta X" não dá pra testar. Ele trava só o que é verificável —
   número no texto x número no código. Se você mudar o código e esquecer o texto, o CI reclama e diz onde.

   Como mexer: mudou o número no código, atualize a frase no .md. Se a FRASE mudou de forma (reescrita), ajuste a
   âncora aqui — a falha diz qual regex não achou nada, de propósito, pra não passar batido em silêncio. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const texto = arq => readFileSync(new URL('../' + arq, import.meta.url), 'utf8');

/* Varre TODOS os .md, não um arquivo fixo: em 29/09/2026 o CLAUDE.md foi enxugado de ~50k pra ~6k tokens e
   metade das frases migrou pra docs/features.md — um teste preso a um arquivo só quebraria a cada faxina, o que
   ensina a desligar o teste em vez de corrigir o texto. O que importa é que a afirmação exista em ALGUM lugar da
   documentação e esteja certa. */
const DOCS = ['CLAUDE.md', 'README.md',
  ...readdirSync(new URL('../docs/', import.meta.url)).filter(f => f.endsWith('.md')).map(f => 'docs/' + f)];
const CORPUS = DOCS.map(a => [a, texto(a)]);

// pega os números de uma frase-âncora em qualquer doc; falha com mensagem útil se a frase sumiu/foi reescrita
function daFrase(re, oque) {
  for (const [arq, doc] of CORPUS) {
    const m = doc.match(re);
    if (m) return m.slice(1).map(Number);
  }
  assert.fail(`Não achei em documentação nenhuma (${DOCS.join(', ')}) a frase que declara "${oque}" (${re}).\n` +
    'Se o texto foi reescrito ou apagado, atualize a âncora em tests/docs-numeros.test.js.');
}

const mod = async n => import('../js/' + n + '.js');

test('contagens declaradas em prosa (qualquer .md) batem com o código', async () => {
  const { BADGES } = await mod('badges');
  const { MEGAS } = await mod('dados-megas');
  const { IMPL } = await mod('habilidades');
  const { GOLPE_FLAGS } = await mod('dados-golpe-flags');
  const { AINDA_EVOLUI } = await mod('dados-evolucao-restante');
  const { ITEMS, ESPECIES_MISSAO } = await mod('dados');
  const { EVENTOS } = await mod('evento');
  const { CHEFES } = await mod('boss');

  const tamanho = x => Array.isArray(x) || typeof x === 'string' ? x.length : x instanceof Set || x instanceof Map ? x.size : Object.keys(x).length;

  const [badges] = daFrase(/\((\d+) badges numa tabela única/, 'quantas badges existem');
  assert.equal(badges, tamanho(BADGES), 'nº de badges na documentação x js/badges.js');

  const [formas, especies] = daFrase(/\((\d+) formas, (\d+) espécies —/, 'formas/espécies de Mega');
  assert.equal(especies, Object.keys(MEGAS).length, 'espécies com Mega no texto x js/dados-megas.js');
  assert.equal(formas, Object.values(MEGAS).reduce((a, x) => a + (Array.isArray(x) ? x.length : 1), 0),
    'formas Mega no texto x js/dados-megas.js');

  const [impl] = daFrase(/hoje (\d+) de \d+ habilidades reais/, 'habilidades implementadas');
  assert.equal(impl, IMPL.size, 'habilidades implementadas no texto x IMPL.size');

  const [flags] = daFrase(/`GOLPE_FLAGS` \((\d+) golpes mapeados\)/, 'golpes com flag');
  assert.equal(flags, tamanho(GOLPE_FLAGS), 'golpes mapeados no texto x js/dados-golpe-flags.js');

  const [evolui] = daFrase(/`AINDA_EVOLUI`, (\d+) espécies/, 'espécies que ainda evoluem');
  assert.equal(evolui, tamanho(AINDA_EVOLUI), 'AINDA_EVOLUI no texto x js/dados-evolucao-restante.js');

  const [raide] = daFrase(/`boss\.usarItemDeRaide`\): (\d+) consumíveis/, 'itens de raide');
  assert.equal(raide, Object.values(ITEMS).filter(i => i.raide).length, 'itens de raide no texto x dados.ITEMS');

  // "Os 14 chefes" aparece nos dois arquivos, e o calendário gira com "% 14": os três têm de andar juntos
  const [chefesTxt] = daFrase(/\*\*Os (\d+) chefes\*\* \(`evento\.EVENTOS`/, 'nº de chefes');
  assert.equal(chefesTxt, EVENTOS.length, 'chefes no texto x evento.EVENTOS');
  assert.equal(chefesTxt, Object.keys(CHEFES).length, 'chefes no texto x boss.CHEFES');
  // 🔒 Pokémon de missão: a lista é prosa em CLAUDE.md e no README, e cada espécie trava a Pokédex de uma Gen
  const [missao] = daFrase(/\*\*(\d+) Pokémon de missão\*\*/, 'quantos Pokémon de missão existem');
  assert.equal(missao, Object.keys(ESPECIES_MISSAO).length, 'Pokémon de missão no texto x dados.ESPECIES_MISSAO');

  const [mod14] = daFrase(/semana N = `N % (\d+)`/, 'o divisor do calendário');
  assert.equal(mod14, EVENTOS.length, 'o `% N` do calendário tem de ser o nº de chefes');
});

test('contagens do README em prosa batem com o código', async () => {
  const { IMPL } = await mod('habilidades');
  const { SEGURADOS } = await mod('segurados');
  const { ITENS_SEGURADOS, ITENS_RAIDE_SEGURADOS } = await mod('dados');
  const { EVENTOS } = await mod('evento');

  const [impl] = daFrase(/hoje (\d+) de \d+\)/, 'habilidades implementadas');
  assert.equal(impl, IMPL.size, 'habilidades implementadas no README x IMPL.size');

  const [total, loja, premio] = daFrase(
    /✔ \((\d+) no total: (\d+) na loja.*?(\d+) de prêmio de raide/s, 'itens segurados');
  assert.equal(total, Object.keys(SEGURADOS).length, 'itens segurados no README x segurados.SEGURADOS');
  assert.equal(loja, Object.keys(ITENS_SEGURADOS).length, 'segurados de loja no README x dados.ITENS_SEGURADOS');
  assert.equal(premio, Object.keys(ITENS_RAIDE_SEGURADOS).length, 'segurados de prêmio no README x dados.ITENS_RAIDE_SEGURADOS');

  const [chefes] = daFrase(/\*\*Os (\d+) chefes\*\*/, 'nº de chefes');
  assert.equal(chefes, EVENTOS.length, 'chefes no README x evento.EVENTOS');
});

/* Varredura genérica: toda vez que a documentação escreve uma constante EXPORTADA com o valor do lado
   (`MAX_ALIADOS` = 2), o valor tem de ser o de verdade. Pega de graça as constantes que ninguém lembrou de
   travar à mão acima — e as que ainda nem existem. Só olha nome em MAIÚSCULA seguido de `=` e número, que é o
   formato que o CLAUDE.md já usa; qualquer outra forma ("(2)", "de 50%") fica de fora de propósito, pra não
   inventar falso positivo em cima de prosa. */
test('constantes citadas com valor na documentação têm o valor real', async () => {
  const PULAR = new Set(['dados-mapas', 'dados-patchnotes']); // gerados/enormes, sem constante numérica citada
  const valores = new Map();      // NOME -> [{ valor, modulo }] (o mesmo nome pode existir em dois módulos)
  for (const arq of readdirSync(new URL('../js/', import.meta.url))) {
    if (!arq.endsWith('.js') || PULAR.has(arq.replace('.js', ''))) continue;
    let m;
    try { m = await import('../js/' + arq); } catch { continue; }   // módulo que precisa de DOM: fora
    for (const [k, v] of Object.entries(m))
      if (typeof v === 'number' && /^[A-Z][A-Z0-9_]*$/.test(k)) {
        if (!valores.has(k)) valores.set(k, []);
        valores.get(k).push({ valor: v, modulo: arq });
      }
  }
  /* O texto é PT-BR e escrito pra gente ler, não pra máquina: o mesmo número aparece como `ALVO_TIPO` = 1.000
     (ponto de MILHAR, não decimal) e como `CHANCE_Z_ALFA`=20% (o código guarda 0.2). Em vez de proibir essas
     formas, o teste aceita as leituras plausíveis do que está escrito — errar o número de verdade continua
     falhando, que é o ponto. */
  const leituras = (bruto, pct) => {
    const c = new Set();
    const milhar = /^\d{1,3}(\.\d{3})+$/.test(bruto) ? Number(bruto.replace(/\./g, '')) : null;
    const decimal = Number(bruto.replace(',', '.'));
    if (milhar !== null) c.add(milhar);
    c.add(decimal);
    if (pct) { c.add(decimal / 100); if (milhar !== null) c.add(milhar / 100); }
    return c;
  };
  const erros = [];
  for (const [nomeDoc, doc] of CORPUS)
    for (const m of doc.matchAll(/`([A-Z][A-Z0-9_]*)`\s*=\s*(\d+(?:[.,]\d+)?)(%?)/g)) {
      const achados = valores.get(m[1]);
      if (!achados) continue;                                   // não é constante exportada: não é da nossa conta
      const cands = leituras(m[2], m[3] === '%');
      if (achados.some(a => cands.has(a.valor))) continue;      // bate com alguma das exportadas com esse nome
      const linha = doc.slice(0, m.index).split('\n').length;
      erros.push(`${nomeDoc}:${linha} → \`${m[1]}\` = ${m[2]}${m[3]}, mas o código diz ` +
        achados.map(a => `${a.valor} (${a.modulo})`).join(' / '));
    }
  assert.deepEqual(erros, [], '\n' + erros.join('\n'));
});
