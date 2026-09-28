// GERADOR (roda no Raspberry Pi, que tem Node — ver como-rodar-dois-ambientes na CLAUDE.md) de js/dados-golpe-flags.js.
// A API pública da PokéAPI (pokeapi.co) NÃO expõe "flags" de golpe (contato, som, projétil, pó...) — só o
// repositório-fonte que GERA a API tem esse dado, em CSV puro, sem chave nenhuma: move_flags.csv (as 21 flags
// possíveis), move_flag_map.csv (golpe -> flag, ligados por id numérico) e moves.csv (id -> identifier, o MESMO
// nome kebab-case que o jogo já usa em toda parte pra golpe, ex. "fire-punch"). Ver a nota "BACKLOG — dado de
// golpe" no CLAUDE.md pra mais contexto. Roda de novo se algum dia o dado-fonte mudar (não deveria — é histórico).
import { writeFileSync } from 'node:fs';

const BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';

async function comRetentativa(fn, tentativas = 3) {
  for (let i = 1; i <= tentativas; i++) {
    try { return await fn(); }
    catch (e) { if (i === tentativas) throw e; await new Promise(r => setTimeout(r, 500 * i)); }
  }
}
// CSV simples (sem campo com vírgula dentro — confirmado nos três arquivos usados aqui): cabeçalho vira as
// chaves de cada linha.
async function csv(nome) {
  return comRetentativa(async () => {
    const r = await fetch(`${BASE}/${nome}`);
    if (!r.ok) throw new Error(`${nome}: HTTP ${r.status}`);
    const texto = (await r.text()).trim();
    const [cabecalho, ...linhas] = texto.split('\n');
    const campos = cabecalho.split(',');
    return linhas.map(l => {
      const v = l.split(',');
      return Object.fromEntries(campos.map((c, i) => [c, v[i]]));
    });
  });
}

async function main() {
  const [flags, flagMap, moves] = await Promise.all([csv('move_flags.csv'), csv('move_flag_map.csv'), csv('moves.csv')]);
  const flagPorId = Object.fromEntries(flags.map(f => [f.id, f.identifier]));
  const nomePorId = Object.fromEntries(moves.map(m => [m.id, m.identifier]));

  const golpes = {};
  let semNome = 0;
  for (const { move_id, move_flag_id } of flagMap) {
    const nome = nomePorId[move_id], flag = flagPorId[move_flag_id];
    if (!nome || !flag) { semNome++; continue; } // id fora de moves.csv/move_flags.csv: não trava o gerador
    (golpes[nome] ||= []).push(flag);
  }
  for (const nome of Object.keys(golpes)) golpes[nome].sort();

  const saida = `/* GERADO por ferramentas/gerar-golpe-flags.mjs a partir do repositório-fonte da PokéAPI
   (move_flags.csv + move_flag_map.csv + moves.csv, github.com/PokeAPI/pokeapi) — não editar à mão, rode o
   gerador de novo. A API pública (pokeapi.co) NÃO expõe isso — só o repositório-fonte tem.
   Golpe (nome kebab-case, o mesmo usado em regras.FAMILIAS_GOLPE e em todo golpe do jogo) -> lista de flags,
   das 21 possíveis: contact, charge, recharge, protect, reflectable, snatch, mirror, punch, sound, gravity,
   defrost, distance, heal, authentic, powder, bite, pulse, ballistics, mental, non-sky-battle, dance.
   "Sharpness"/corte NÃO está aqui (é flag da Gen 9, mais nova que este dado-fonte) — regras.FAMILIAS_GOLPE.corte
   continua sendo a única fonte pra corte.
   Golpe sem entrada aqui: não foi mapeado por este dado (golpe novo demais, ou fora do escopo do jogo) — quem lê
   isto (regras.fazContato/temFlag) cai num plano B em vez de assumir "sem flag nenhuma". */
export const GOLPE_FLAGS = ${JSON.stringify(golpes, null, 2)};
// As 21 flags que existem (move_flags.csv) — usado só pra validar (tests/habilidades.test.js) que um \`imuneFlag\`
// na tabela de habilidades não tem erro de digitação.
export const FLAGS_VALIDAS = ${JSON.stringify(flags.map(f => f.identifier).sort())};
`;
  writeFileSync(new URL('../js/dados-golpe-flags.js', import.meta.url), saida);
  console.log(`ok: ${Object.keys(golpes).length} golpes com flag mapeada -> js/dados-golpe-flags.js`);
  if (semNome) console.log(`${semNome} linhas de move_flag_map.csv ignoradas (id sem golpe/flag correspondente)`);
}
main().catch(e => { console.error(e); process.exit(1); });
