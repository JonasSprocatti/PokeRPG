/* ============ baixar pra jogar offline ============ */
// O jogo já guarda sozinho o que você encontra (api.js: cache em memória + localStorage; o service worker guarda os
// sprites). O problema é que, offline, só dá pra encontrar o que você JÁ tinha visto — e Pokémon novo aparece sem
// sprite. Aqui a pessoa baixa de uma vez tudo o que um mapa (Gen) precisa: os Pokémon das rotas, os Alfas, os
// lendários, os golpes que eles usam e os sprites de todos.
//   - dados dos Pokémon e golpes: localStorage (via api.js), poucos KB cada
//   - sprites: basta pedir a imagem que o service worker guarda ela (EXTERNOS, "cache primeiro")
// Baixar um mapa inteiro são ~150 Pokémon: pesado pra rede, leve pro aparelho. Puro o bastante pra testar a lista
// de alvos (alvosDaGen) em tests/offline.test.js; o download em si precisa de rede e não é testado.
import { rotasDaGen, dadosDaGen, GENS } from './mapas.js';
import { SPR, SPR_SHINY } from './dados.js';
import { loadPokemon, loadMove, pokemonEmCache } from './api.js';

// tudo o que um mapa precisa: { ids: [id de Pokémon], nomes: quantos são }
export function alvosDaGen(gen) {
  const ids = new Set();
  for (const z of rotasDaGen(gen)) {
    for (const p of z.pool) ids.add(p.id);
    if (z.chefe) ids.add(z.chefe.id);
    for (const l of z.lendarios || []) ids.add(l.id);
  }
  return [...ids];
}
// já está tudo guardado neste aparelho?
export const jaBaixado = gen => alvosDaGen(gen).every(pokemonEmCache);
export const quantoFalta = gen => alvosDaGen(gen).filter(id => !pokemonEmCache(id)).length;

/* Pede a imagem só pra ela entrar no cache do service worker (não desenha nada na tela).
   **Sem mode:'no-cors', de propósito**: o servidor de sprites manda Access-Control-Allow-Origin: *, então a
   resposta vem normal. Com 
o-cors ela viria OPACA, e navegador nenhum sabe o tamanho de uma resposta opaca —
   o Chrome então soma uma estimativa inflada (vários MB por arquivo) na cota do site. Foi isso que fez o jogo
   dizer que ocupava 20 GB quando os sprites somam menos de 1 MB (cada um tem ~600 bytes), e pior: esse número
   inflado conta contra a cota e podia fazer o download do jogo inteiro falhar sem motivo. */
const guardarSprite = url => fetch(url).catch(() => {});

/* Baixa o mapa inteiro. `aoAndar(feitos, total, oQue)` recebe o progresso; devolve { ok, falhas }.
   Vai de poucos em poucos (LOTE) pra não afogar a rede nem a PokéAPI. */
const LOTE = 6;
export async function baixarGen(gen, aoAndar = () => {}, sinal = null) {
  const ids = alvosDaGen(gen);
  const nome = dadosDaGen(gen).regiao;
  let feitos = 0, falhas = 0;
  const golpes = new Set();
  for (let i = 0; i < ids.length; i += LOTE) {
    if (sinal?.cancelado) break;
    await Promise.all(ids.slice(i, i + LOTE).map(async id => {
      try {
        const data = await loadPokemon(id);
        // golpes que ele aprende até o nível 60: é o que dá pra encontrar nas rotas
        for (const m of data.learnset.list) if (m.level <= 60) golpes.add(m.url);
        await Promise.all([guardarSprite(SPR(id)), guardarSprite(SPR_SHINY(id)), data.back ? guardarSprite(data.back) : null]);
      } catch (e) { falhas++; console.warn('offline: falhou', id, e.message); }
      aoAndar(++feitos, ids.length, `Pokémon de ${nome}`);
    }));
  }
  // os golpes vêm depois: são muitos repetidos entre espécies, então o Set já cortou a maior parte
  const lista = [...golpes];
  for (let i = 0; i < lista.length && !sinal?.cancelado; i += LOTE) {
    await Promise.all(lista.slice(i, i + LOTE).map(u => loadMove(u).catch(() => { falhas++; })));
    aoAndar(Math.min(feitos + i + LOTE, feitos + lista.length), feitos + lista.length, 'golpes');
  }
  return { ok: !falhas && !sinal?.cancelado, falhas, total: ids.length, golpes: lista.length };
}

// Todos os mapas de uma vez: é o "jogo inteiro offline". Só faz sentido desde que os dados foram pro IndexedDB
// (api.js) — no localStorage isso estourava a cota e falhava calado.
export async function baixarTudo(aoAndar = () => {}, sinal = null) {
  let falhas = 0, total = 0, golpes = 0;
  for (const g of GENS) {
    if (sinal?.cancelado) break;
    const r = await baixarGen(g.gen, (feitos, quantos, oQue) => aoAndar(feitos, quantos, `${oQue} — Gen ${g.gen} de ${GENS.length}`), sinal);
    falhas += r.falhas; total += r.total; golpes += r.golpes;
  }
  return { ok: !falhas && !sinal?.cancelado, falhas, total, golpes };
}
// quanto falta no jogo inteiro
export const quantoFaltaTudo = () => GENS.reduce((a, g) => a + quantoFalta(g.gen), 0);
export const totalDoJogo = () => new Set(GENS.flatMap(g => alvosDaGen(g.gen))).size;
