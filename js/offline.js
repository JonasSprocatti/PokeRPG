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
import { loadPokemon, loadMove, loadSpecies, loadGrowth, loadEvo, pokemonEmCache, temNoCache, marcarNoCache } from './api.js';

/* Versão do que o download traz. Subiu na v2: além dos Pokémon, golpes e sprites, agora vêm a curva de XP e a
   árvore de evolução de cada espécie (sem elas não dava pra COMEÇAR uma jornada nem evoluir offline).
   Quem baixou na v1 tem a marca antiga e volta a aparecer como incompleto — é de propósito: dizer "já baixado"
   pra um mapa que ainda falha no avião é pior do que pedir um download de novo. */
export const VERSAO_DOWNLOAD = 2;
const marcaDaGen = gen => `baixado-v${VERSAO_DOWNLOAD}:gen${gen}`;

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
// quantos Pokémon do mapa ainda não estão guardados
export const quantoFalta = gen => alvosDaGen(gen).filter(id => !pokemonEmCache(id)).length;
/* Os Pokémon estão todos aqui, mas o mapa foi baixado por uma versão ANTIGA do download, que não trazia tudo.
   Contar isso como "faltam N Pokémon" seria mentira (eles estão guardados); é uma pendência de outro tipo, e a
   tela fala dela com outras palavras. */
export const precisaRebaixar = gen => !quantoFalta(gen) && !temNoCache(marcaDaGen(gen));
// já dá pra jogar este mapa inteiro sem internet?
export const jaBaixado = gen => !quantoFalta(gen) && !precisaRebaixar(gen);

/* Pede a imagem só pra ela entrar no cache do service worker (não desenha nada na tela).
   **Sem mode:'no-cors', de propósito**: o servidor de sprites manda Access-Control-Allow-Origin: *, então a
   resposta vem normal. Com no-cors ela viria OPACA, e navegador nenhum sabe o tamanho de uma resposta opaca —
   o Chrome então soma uma estimativa inflada (vários MB por arquivo) na cota do site. Foi isso que fez o jogo
   dizer que ocupava 20 GB quando os sprites somam menos de 1 MB (cada um tem ~600 bytes), e pior: esse número
   inflado conta contra a cota e podia fazer o download do jogo inteiro falhar sem motivo.

   Devolve `true` só quando a imagem REALMENTE chegou (e, portanto, o service worker guardou).
   Antes isto era `fetch(url).catch(() => {})`: qualquer falha sumia sem deixar rastro, e como `jaBaixado` só
   olha o JSON do Pokémon (`mon:<id>`), o jogo dizia "mapa baixado" com sprites faltando. No avião isso vira
   ícone de imagem quebrada em alguns Pokémon e não em outros — exatamente o que foi relatado, e sem nenhuma
   pista de por quê. Uma tentativa a mais resolve a piscada de rede; o que falhar de novo é CONTADO. */
async function guardarSprite(url) {
  for (let i = 0; i < 2; i++) {
    try { const r = await fetch(url); if (r.ok || r.type === 'opaque') return true; } catch {}
  }
  console.warn('offline: sprite não baixou', url);
  return false;
}

/* Baixa o mapa inteiro. `aoAndar(feitos, total, oQue)` recebe o progresso; devolve { ok, falhas }.
   Vai de poucos em poucos (LOTE) pra não afogar a rede nem a PokéAPI. */
const LOTE = 6;
export async function baixarGen(gen, aoAndar = () => {}, sinal = null) {
  const ids = alvosDaGen(gen);
  const nome = dadosDaGen(gen).regiao;
  let feitos = 0, falhas = 0;
  const golpes = new Set(), curvas = new Set(), arvores = new Set();
  for (let i = 0; i < ids.length; i += LOTE) {
    if (sinal?.cancelado) break;
    await Promise.all(ids.slice(i, i + LOTE).map(async id => {
      try {
        const data = await loadPokemon(id);
        // golpes que ele aprende até o nível 60: é o que dá pra encontrar nas rotas
        for (const m of data.learnset.list) if (m.level <= 60) golpes.add(m.url);
        /* A ESPÉCIE (curva de XP e árvore de evolução) também precisa vir. Só o `loadPokemon` não basta:
           `criacao.iniciarJornada` pede loadSpecies + loadGrowth + loadEvo antes de montar o save, e
           `progressao.checkEvolution` pede a árvore a cada nível. Sem isto, quem baixou o mapa inteiro AINDA
           não conseguia começar uma jornada no avião ("A conexão falhou ao buscar um dado da PokéAPI") nem
           evoluir — relatado em jogo. Curvas e árvores são poucas e repetem muito entre espécies: o Set corta
           quase tudo antes de ir pra rede. */
        const sp = await loadSpecies(data.speciesUrl);
        curvas.add(sp.growthUrl);
        if (sp.evoUrl) arvores.add(sp.evoUrl);
        // sprite que não desce é falha de download como qualquer outra: sem isto o mapa se dizia completo com
        // imagem faltando, e só no avião é que aparecia (ícone quebrado em uns Pokémon e não em outros)
        const imgs = await Promise.all([guardarSprite(SPR(id)), guardarSprite(SPR_SHINY(id)), data.back ? guardarSprite(data.back) : true]);
        if (imgs.some(x => !x)) falhas++;
      } catch (e) { falhas++; console.warn('offline: falhou', id, e.message); }
      aoAndar(++feitos, ids.length, `Pokémon de ${nome}`);
    }));
  }
  // espécies: curva de XP e árvore de evolução (poucas, já sem repetição)
  const extras = [...curvas].map(u => () => loadGrowth(u)).concat([...arvores].map(u => () => loadEvo(u)));
  for (let i = 0; i < extras.length && !sinal?.cancelado; i += LOTE) {
    await Promise.all(extras.slice(i, i + LOTE).map(f => f().catch(() => { falhas++; })));
    aoAndar(Math.min(i + LOTE, extras.length), extras.length, 'curvas de XP e evoluções');
  }
  // os golpes vêm depois: são muitos repetidos entre espécies, então o Set já cortou a maior parte
  const lista = [...golpes];
  for (let i = 0; i < lista.length && !sinal?.cancelado; i += LOTE) {
    await Promise.all(lista.slice(i, i + LOTE).map(u => loadMove(u).catch(() => { falhas++; })));
    aoAndar(Math.min(feitos + i + LOTE, feitos + lista.length), feitos + lista.length, 'golpes');
  }
  const ok = !falhas && !sinal?.cancelado;
  if (ok) marcarNoCache(marcaDaGen(gen));   // só com TUDO no lugar: marca pela metade mentiria no avião
  return { ok, falhas, total: ids.length, golpes: lista.length };
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
