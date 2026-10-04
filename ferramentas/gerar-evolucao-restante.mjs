// GERADOR (roda no Raspberry Pi, que tem Node) de js/dados-evolucao-restante.js.
// Eviolite ("segurados.js") só vale em quem AINDA evolui — precisa saber isso na hora de calcular o dano/atributo
// (regras.effStat), que é PURA e SÍNCRONA: buscar a árvore de evolução na PokéAPI no meio do turno está fora de
// cogitação (regra do projeto — nada de rede no meio da conta). A árvore de evolução (`/evolution-chain/{id}`)
// também exigiria até ~550 requisições encadeadas só pra montar isso uma vez.
// Saída mais simples: o repositório-fonte da PokéAPI tem `pokemon_species.csv` com `evolves_from_species_id` —
// uma espécie AINDA EVOLUI se ALGUMA OUTRA espécie tem esse campo apontando pra ela. Uma passada no CSV resolve,
// sem precisar montar a árvore inteira (mesmo padrão de ferramentas/gerar-golpe-flags.mjs).
import { writeFileSync } from 'node:fs';

const CSV = n => `https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/${n}.csv`;
const CSV_URL = CSV('pokemon_species');

async function comRetentativa(fn, tentativas = 3) {
  for (let i = 1; i <= tentativas; i++) {
    try { return await fn(); }
    catch (e) { if (i === tentativas) throw e; await new Promise(r => setTimeout(r, 500 * i)); }
  }
}

const baixar = nome => comRetentativa(async () => {
  const r = await fetch(CSV(nome));
  if (!r.ok) throw new Error(`${nome}.csv: HTTP ${r.status}`);
  return (await r.text()).trim();
});
// CSV da PokéAPI: sem campo com vírgula dentro nas colunas que usamos (id/identifier/ids numéricos) — split basta
const tabela = texto => {
  const [cab, ...linhas] = texto.split('\n');
  const campos = cab.split(',');
  return { campos, linhas: linhas.map(l => l.split(',')), col: n => campos.indexOf(n) };
};

async function main() {
  const texto = await baixar('pokemon_species');
  const [cabecalho, ...linhas] = texto.split('\n');
  const campos = cabecalho.split(',');
  const iId = campos.indexOf('id'), iNome = campos.indexOf('identifier'), iDe = campos.indexOf('evolves_from_species_id');

  const nomePorId = {};
  const linhasParsed = linhas.map(l => l.split(','));
  for (const v of linhasParsed) nomePorId[v[iId]] = v[iNome];

  const aindaEvolui = new Set();
  for (const v of linhasParsed) {
    const de = v[iDe];
    if (de && nomePorId[de]) aindaEvolui.add(nomePorId[de]); // a espécie DE QUEM esta evolui ainda tem pra onde ir
  }
  const lista = [...aindaEvolui].sort();

  /* ESPECIE_DO_ITEM_EVO: item de evolução -> espécies que precisam DELE pra evoluir (pedido do usuário: com o item
     na mochila, essas espécies aparecem em dobro explorando). Sai de `pokemon_evolution.csv`, nas duas colunas de
     item: `trigger_item_id` (usar a pedra/maçã na hora) e `held_item_id` (evoluir segurando, por nível ou troca).
     A espécie que entra na lista é a DE ANTES (`evolves_from_species_id` da evoluída) — é ela que você encontra
     explorando; a evoluída já é o resultado. */
  const itens = tabela(await baixar('items'));
  const nomeItem = {};
  for (const v of itens.linhas) nomeItem[v[itens.col('id')]] = v[itens.col('identifier')];
  const evo = tabela(await baixar('pokemon_evolution'));
  const [iEvoluida, iItem, iSegurado] = ['evolved_species_id', 'trigger_item_id', 'held_item_id'].map(evo.col);
  const porItem = {};
  for (const v of evo.linhas) {
    const item = nomeItem[v[iItem]] || nomeItem[v[iSegurado]];
    const de = linhasParsed.find(s => s[iId] === v[iEvoluida])?.[iDe];
    if (!item || !nomePorId[de]) continue;
    (porItem[item] ||= new Set()).add(nomePorId[de]);
  }
  const porItemOrdenado = Object.fromEntries(Object.keys(porItem).sort().map(k => [k, [...porItem[k]].sort()]));

  const saida = `/* GERADO por ferramentas/gerar-evolucao-restante.mjs a partir do repositório-fonte da PokéAPI
   (pokemon_species.csv + pokemon_evolution.csv + items.csv, github.com/PokeAPI/pokeapi) — não editar à mão, rode
   o gerador de novo.
   AINDA_EVOLUI: nomes de espécie (o mesmo speciesName usado em todo o jogo) que têm PELO MENOS UMA outra espécie
   evoluindo A PARTIR delas (\`evolves_from_species_id\` apontando pra elas). É o que decide o Eviolite
   (segurados.js): só vale segurado por quem ainda não chegou na forma final. Espécie fora desta lista = forma
   final OU nunca evolui (as duas contam como "totalmente evoluído" pro item, igual nos jogos de verdade).
   Não inclui formas regionais/variedades (o CSV é por ESPÉCIE, que é a mesma chave que \`registro\`/Pokédex/caça
   já usam em todo o jogo) — uma forma regional herda a resposta da espécie base. */
export const AINDA_EVOLUI = new Set(${JSON.stringify(lista, null, 2)});
/* Item de evolução -> espécies que evoluem COM ELE (a de antes, a que você encontra explorando). Lido por
   regras.especiesDobradas: item na mochila = essa espécie aparece em dobro na rota. */
export const ESPECIE_DO_ITEM_EVO = ${JSON.stringify(porItemOrdenado, null, 2).replace(/"([a-z0-9]+)":/g, '$1:')};
`;
  writeFileSync(new URL('../js/dados-evolucao-restante.js', import.meta.url), saida);
  console.log(`ok: ${lista.length} espécies que ainda evoluem, ${Object.keys(porItemOrdenado).length} itens de evolução -> js/dados-evolucao-restante.js`);
}
main().catch(e => { console.error(e); process.exit(1); });
