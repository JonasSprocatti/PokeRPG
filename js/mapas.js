/* ============ mapas por Gen ============ */
// Cada Gen é um mapa com 10 rotas (dados em dados-mapas.js, gerados da PokéAPI por ferramentas/gerar-mapas.ps1).
// As 9 primeiras têm um Alfa; a 10ª é a final: lutar contra os lendários da Gen fecha o mapa.
//   Roguelike: vencer a Gen encerra a run (vitória) e libera o mapa da Gen seguinte pras próximas runs.
//   Outros modos: vencer a Gen deixa escolher a próxima (S.gensVencidas); os níveis do mapa novo começam no seu nível
//   (escalaNivel) — S.nivelInicioGen guarda o nível em que você entrou nele.
// Pokédex da rota: quem você nunca enfrentou é "?"; depois de enfrentar vira silhueta; com REVELA_DERROTADOS
// derrotados (somando todas as jornadas) aparece colorido, com a taxa de aparição na rota.
// Puro (sem DOM): testado em tests/mapas.test.js.
import { GENS } from './dados-mapas.js';
import { clamp } from './util.js';

export { GENS };
export const TOTAL_GENS = GENS.length;
export const REVELA_DERROTADOS = 10;
// nível do último lendário (o topo da progressão de um mapa): referência da escala de nível
export const NIVEL_TOPO = 75;

export const genDe = S => S?.gen || 1;
export const dadosDaGen = g => GENS.find(x => x.gen === g) || GENS[0];
export const rotasDaGen = g => dadosDaGen(g).rotas;
export const primeiraRota = g => rotasDaGen(g)[0];

// Nível de um mapa quando você entra nele já forte (fora do Roguelike): o que ia de 2 a 75 passa a ir do seu nível
// até 100, mantendo a proporção. base ≤ 5 (começo de jornada) = níveis originais.
export function escalaNivel(n, base) {
  if (!base || base <= 5) return n;
  return clamp(Math.round(base + (n - 2) * (100 - base) / (NIVEL_TOPO - 2)), 1, 100);
}
// a rota com os níveis que valem nesta jornada (não muta a original). A 1ª rota do mapa continua sempre aberta.
export function rotaNaJornada(z, S) {
  const b = S?.nivelInicioGen;
  if (!z || !b || b <= 5) return z;
  const e = n => escalaNivel(n, b);
  return { ...z, min: e(z.min), max: e(z.max), libera: z.libera <= 1 ? 1 : e(z.libera),
    chefe: z.chefe && { ...z.chefe, nivel: e(z.chefe.nivel) },
    lendarios: z.lendarios?.map(l => ({ ...l, nivel: e(l.nivel) })) };
}

// sorteio ponderado pela taxa de aparição. `filtro(id)` (ex.: offline, só o que está no cache). null = nada sobrou.
export function sortearDaRota(z, filtro = null, sorte = Math.random) {
  const pool = filtro ? z.pool.filter(p => filtro(p.id)) : z.pool;
  const total = pool.reduce((a, p) => a + p.p, 0);
  if (!total) return null;
  let r = sorte() * total;
  for (const p of pool) { r -= p.p; if (r < 0) return p; }
  return pool[pool.length - 1];
}
// chance (0–100) de cada encontro selvagem na rota ser esta espécie
export function taxaNaRota(z, id) {
  const total = z.pool.reduce((a, p) => a + p.p, 0), e = z.pool.find(p => p.id === id);
  return e && total ? e.p / total * 100 : 0;
}
// texto da taxa: raros com casa decimal
export const textoTaxa = t => t >= 10 ? `${Math.round(t)}%` : t >= 1 ? `${t.toFixed(1).replace('.', ',')}%` : `${t.toFixed(2).replace('.', ',')}%`;

// soma vistos/derrotados de vários registros (jornadas da carreira + a atual): o que você já sabe de cada espécie
export function somarRegistros(registros) {
  const out = { vistos: {}, derrotados: {} };
  for (const r of registros) for (const l of ['vistos', 'derrotados'])
    for (const [e, n] of Object.entries(r?.[l] || {})) out[l][e] = (out[l][e] || 0) + n;
  return out;
}
// Pokédex da rota: estado de cada espécie do pool
//   oculto    = nunca enfrentou ("?")        silhueta = já enfrentou         revelado = REVELA_DERROTADOS derrotados (cor + taxa)
export function pokedexDaRota(z, saber) {
  return z.pool.map(p => {
    const vistos = saber.vistos[p.n] || 0, derrotados = saber.derrotados[p.n] || 0;
    const estado = derrotados >= REVELA_DERROTADOS ? 'revelado' : vistos || derrotados ? 'silhueta' : 'oculto';
    return { id: p.id, n: p.n, mitico: !!p.m, estado, derrotados, taxa: taxaNaRota(z, p.id) };
  });
}

/* ---- Caça Shiny (modo ligado na criação: S.cacaShiny) ----
   Quando TODA espécie da rota estiver revelada (REVELA_DERROTADOS derrotados de cada uma), a rota libera a caça:
   você escolhe uma espécie e só ela aparece ali. Míticos ficam de fora da conta — derrotar 10 Mew não é razoável. */
export const cacaveisDaRota = (z, saber) => pokedexDaRota(z, saber).filter(p => !p.mitico);
export const rotaLiberaCaca = (z, saber) => { const l = cacaveisDaRota(z, saber); return l.length > 0 && l.every(p => p.estado === 'revelado'); };
// quanto falta pra liberar: { reveladas, total }
export function progressoCaca(z, saber) {
  const l = cacaveisDaRota(z, saber);
  return { reveladas: l.filter(p => p.estado === 'revelado').length, total: l.length };
}
// espécie caçada nesta rota (ou null). `S.caca` = { idDaRota: speciesName }
export const cacaDaRota = (S, z) => (S?.cacaShiny && S.caca?.[z?.id]) || null;

/* ---- Repelentes (itens da loja: `S.repelente = { tipo, passos, especie? }`) ----
   'total'    = nenhum selvagem aparece enquanto durar
   'seletivo' = só a espécie escolhida aparece (se ela vive nesta rota; se não, é como o total)
   Nem um nem outro mexem em treinador, item, dinheiro ou ambientação: só no encontro selvagem. Dura N explorações. */
export const repelenteAtivo = S => (S?.repelente?.passos > 0 ? S.repelente : null);
// quem aparece de verdade nesta rota: repelente seletivo na frente, depois a Caça Shiny; null = sorteio normal
export function especieForcada(S, z) {
  const r = repelenteAtivo(S);
  if (r?.tipo === 'seletivo' && z?.pool?.some(p => p.n === r.especie)) return r.especie;
  return cacaDaRota(S, z);
}
// true = nenhum selvagem aparece agora (repelente total, ou seletivo de uma espécie que não vive aqui)
export function semSelvagens(S, z) {
  const r = repelenteAtivo(S); if (!r) return false;
  return r.tipo === 'total' || !z?.pool?.some(p => p.n === r.especie);
}
// uma exploração passou: gasta um "passo" do repelente. Devolve o que sobrou, 'acabou' no último, ou null.
export function gastarRepelente(S) {
  const r = S?.repelente; if (!r?.passos) return null;
  r.passos--;
  if (r.passos <= 0) { delete S.repelente; return 'acabou'; }
  return r.passos;
}

// luta final: o principal (último da lista) + até 3 dos outros lendários (sorteados, na ordem da lista)
export function sequenciaLendaria(z, sorte = Math.random) {
  const todos = z.lendarios || [];
  if (!todos.length) return [];
  const principal = todos[todos.length - 1];
  const outros = todos.slice(0, -1).map((l, i) => ({ l, i, k: sorte() })).sort((a, b) => a.k - b.k).slice(0, 3).sort((a, b) => a.i - b.i).map(x => x.l);
  return [...outros, principal];
}

// Fora do Roguelike, depois de fechar uma Gen: muda pro mapa `g`, com os níveis a partir do seu (escalaNivel)
export function entrarNaGen(S, g) {
  S.gen = g; S.nivelInicioGen = S.player.level; S.zone = primeiraRota(g).id;
  delete S.escolhendoGen;
}

// Roguelike: mapas liberados = Gen 1 + a seguinte de cada Gen vencida (sempre em sequência) — pela carreira
export function gensLiberadasRoguelike(jornadas) {
  let max = 0;
  for (const j of jornadas || []) if (j.dificuldade === 'roguelike' && j.motivo === 'venceu') max = Math.max(max, j.genVencida || 0);
  return Array.from({ length: Math.min(TOTAL_GENS, max + 1) }, (_, i) => i + 1);
}
