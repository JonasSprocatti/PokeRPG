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

// Os alvos que fazem um golpe ser de ÁREA (os mesmos de dados.ALVOS_OPONENTES/ALVOS_TODOS). Só estes entram na
// tabela: o resto é "bate num só", que é o plano B natural de quem lê.
const ALVOS_AREA = ['all-opponents', 'all-other-pokemon', 'all-pokemon'];

async function main() {
  const [flags, flagMap, moves, alvos] = await Promise.all([csv('move_flags.csv'), csv('move_flag_map.csv'), csv('moves.csv'), csv('move_targets.csv')]);
  const flagPorId = Object.fromEntries(flags.map(f => [f.id, f.identifier]));
  const nomePorId = Object.fromEntries(moves.map(m => [m.id, m.identifier]));
  const alvoPorId = Object.fromEntries(alvos.map(a => [a.id, a.identifier]));
  const area = {};
  for (const m of moves) {
    const alvo = alvoPorId[m.target_id];
    if (ALVOS_AREA.includes(alvo)) area[m.identifier] = alvo;
  }

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

/* Quem o golpe alcança, SÓ pros golpes de área (moves.csv -> target_id -> move_targets.csv). O \`target\` normal
   vem da PokéAPI dentro de cada golpe (api.slimMove); esta tabela é o CHÃO pra quando ele não veio — golpe
   gravado num save antigo, registro velho no cache, jogo offline. Virou dado fixo porque não é dado vivo: o
   alvo de Rock Slide não muda, e depender da rede pra saber disso já transformou Earthquake e Rock Slide em
   golpe de alvo único duas vezes (06 e 07/10/2026). Quem lê é golpe.alvosDoGolpe. */
export const GOLPE_AREA = ${JSON.stringify(area, null, 2)};
`;
  writeFileSync(new URL('../js/dados-golpe-flags.js', import.meta.url), saida);
  console.log(`ok: ${Object.keys(golpes).length} golpes com flag mapeada, ${Object.keys(area).length} golpes de área -> js/dados-golpe-flags.js`);
  if (semNome) console.log(`${semNome} linhas de move_flag_map.csv ignoradas (id sem golpe/flag correspondente)`);
}
main().catch(e => { console.error(e); process.exit(1); });
