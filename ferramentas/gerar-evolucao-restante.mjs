// GERADOR (roda no Raspberry Pi, que tem Node) de js/dados-evolucao-restante.js.
// Eviolite ("segurados.js") só vale em quem AINDA evolui — precisa saber isso na hora de calcular o dano/atributo
// (regras.effStat), que é PURA e SÍNCRONA: buscar a árvore de evolução na PokéAPI no meio do turno está fora de
// cogitação (regra do projeto — nada de rede no meio da conta). A árvore de evolução (`/evolution-chain/{id}`)
// também exigiria até ~550 requisições encadeadas só pra montar isso uma vez.
// Saída mais simples: o repositório-fonte da PokéAPI tem `pokemon_species.csv` com `evolves_from_species_id` —
// uma espécie AINDA EVOLUI se ALGUMA OUTRA espécie tem esse campo apontando pra ela. Uma passada no CSV resolve,
// sem precisar montar a árvore inteira (mesmo padrão de ferramentas/gerar-golpe-flags.mjs).
import { writeFileSync } from 'node:fs';

const CSV_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species.csv';

async function comRetentativa(fn, tentativas = 3) {
  for (let i = 1; i <= tentativas; i++) {
    try { return await fn(); }
    catch (e) { if (i === tentativas) throw e; await new Promise(r => setTimeout(r, 500 * i)); }
  }
}

async function main() {
  const texto = await comRetentativa(async () => {
    const r = await fetch(CSV_URL);
    if (!r.ok) throw new Error(`pokemon_species.csv: HTTP ${r.status}`);
    return (await r.text()).trim();
  });
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

  const saida = `/* GERADO por ferramentas/gerar-evolucao-restante.mjs a partir do repositório-fonte da PokéAPI
   (pokemon_species.csv, github.com/PokeAPI/pokeapi) — não editar à mão, rode o gerador de novo.
   AINDA_EVOLUI: nomes de espécie (o mesmo speciesName usado em todo o jogo) que têm PELO MENOS UMA outra espécie
   evoluindo A PARTIR delas (\`evolves_from_species_id\` apontando pra elas). É o que decide o Eviolite
   (segurados.js): só vale segurado por quem ainda não chegou na forma final. Espécie fora desta lista = forma
   final OU nunca evolui (as duas contam como "totalmente evoluído" pro item, igual nos jogos de verdade).
   Não inclui formas regionais/variedades (o CSV é por ESPÉCIE, que é a mesma chave que \`registro\`/Pokédex/caça
   já usam em todo o jogo) — uma forma regional herda a resposta da espécie base. */
export const AINDA_EVOLUI = new Set(${JSON.stringify(lista, null, 2)});
`;
  writeFileSync(new URL('../js/dados-evolucao-restante.js', import.meta.url), saida);
  console.log(`ok: ${lista.length} espécies que ainda evoluem -> js/dados-evolucao-restante.js`);
}
main().catch(e => { console.error(e); process.exit(1); });
