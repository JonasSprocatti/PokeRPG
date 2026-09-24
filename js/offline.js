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

/* Quem guarda as IMAGENS é o service worker (sw.js): `guardarSprite` só pede a imagem, e é o sw que a intercepta
   e põe no cache. Sem um sw no comando da página, esse pedido vai pra rede e não fica em lugar nenhum — o
   download termina "com sucesso" e, no avião, nenhuma imagem aparece. Isso acontece de verdade logo depois de um
   Ctrl+Shift+R (recarga forçada abre a página FORA do controle do sw) e na primeiríssima visita. Barato de
   detectar, e o aviso poupa um download inteiro jogado fora. */
export const semServiceWorker = () => typeof navigator !== 'undefined'
  && 'serviceWorker' in navigator && !navigator.serviceWorker.controller;

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

/* Só as IMAGENS de um mapa, sem tocar nos dados. Existe porque as duas metades são guardadas em lugares
   diferentes e por mecanismos diferentes: os dados vão pro IndexedDB pelo próprio jogo, e as imagens dependem do
   service worker interceptar o pedido. Dá pra ter uma metade sem a outra — foi o que aconteceu de verdade com um
   download feito enquanto a página estava fora do controle do sw: 1083 Pokémon guardados e quase nenhuma figura.
   Rebaixar tudo nesse caso seria jogar fora ~2.800 buscas de dados que já estão perfeitas. */
export async function baixarImagens(gen, aoAndar = () => {}, sinal = null) {
  const ids = alvosDaGen(gen);
  let feitos = 0, falhas = 0;
  for (let i = 0; i < ids.length && !sinal?.cancelado; i += LOTE) {
    await Promise.all(ids.slice(i, i + LOTE).map(async id => {
      // `back` mora nos dados do Pokémon; se eles não estiverem aqui, baixa só frente e shiny (o resto vem depois)
      let back = null;
      try { back = (await loadPokemon(id)).back; } catch {}
      const r = await Promise.all([guardarSprite(SPR(id)), guardarSprite(SPR_SHINY(id)), back ? guardarSprite(back) : true]);
      falhas += r.filter(x => !x).length;
      aoAndar(++feitos, ids.length, 'imagens');
    }));
  }
  return { ok: !falhas && !sinal?.cancelado, falhas, total: ids.length };
}

/* Quantas imagens deste mapa já estão guardadas de verdade (pergunta ao cache do service worker, que é quem
   guarda). É assíncrono e por isso não entra em `jaBaixado` — a tela mostra o número à parte. */
export async function imagensGuardadas(gen) {
  try {
    // acha o cache pelo nome, sem fixar a versão (sw.js troca 'pokerpg-externo-vN' quando o formato muda)
    const nome = (await caches.keys()).find(k => k.includes('externo'));
    if (!nome) return 0;
    const c = await caches.open(nome);
    let n = 0;
    for (const id of alvosDaGen(gen)) if (await c.match(SPR(id), { ignoreVary: true })) n++;
    return n;
  } catch { return null; }
}

/* Baixa o mapa inteiro. `aoAndar(feitos, total, oQue)` recebe o progresso; devolve { ok, falhas, imagens }.
   Vai de poucos em poucos (LOTE) pra não afogar a rede nem a PokéAPI.

   **Falha de DADO e falha de IMAGEM são contadas separadas, de propósito.** Sem o dado (Pokémon, espécie, curva
   de XP, golpe) o jogo não funciona offline; sem uma imagem, aparece um ícone quebrado e o resto continua de pé.
   Misturar as duas numa conta só já deu problema: bastava UMA figura não descer, entre centenas de pedidos, pra
   o mapa nunca ser marcado como pronto — e aí a tela pedia "baixe de novo" pra sempre, sem nada mudar, por mais
   vezes que a pessoa baixasse. A marca da versão olha só o dado. */
const LOTE = 6;
export async function baixarGen(gen, aoAndar = () => {}, sinal = null) {
  const ids = alvosDaGen(gen);
  const nome = dadosDaGen(gen).regiao;
  let feitos = 0, falhas = 0, imagens = 0;
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
        // imagem que não desce é contada à parte (ver o comentário de baixarGen): atrapalha, mas não impede jogar
        const imgs = await Promise.all([guardarSprite(SPR(id)), guardarSprite(SPR_SHINY(id)), data.back ? guardarSprite(data.back) : true]);
        imagens += imgs.filter(x => !x).length;
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
  // a marca é sobre os DADOS: é o que decide se dá pra jogar este mapa sem internet
  const dadosOk = !falhas && !sinal?.cancelado;
  if (dadosOk) marcarNoCache(marcaDaGen(gen));
  return { ok: dadosOk && !imagens, dadosOk, falhas, imagens, total: ids.length, golpes: lista.length };
}

// Todos os mapas de uma vez: é o "jogo inteiro offline". Só faz sentido desde que os dados foram pro IndexedDB
// (api.js) — no localStorage isso estourava a cota e falhava calado.
export async function baixarTudo(aoAndar = () => {}, sinal = null) {
  let falhas = 0, imagens = 0, total = 0, golpes = 0;
  for (const g of GENS) {
    if (sinal?.cancelado) break;
    const r = await baixarGen(g.gen, (feitos, quantos, oQue) => aoAndar(feitos, quantos, `${oQue} — Gen ${g.gen} de ${GENS.length}`), sinal);
    falhas += r.falhas; imagens += r.imagens; total += r.total; golpes += r.golpes;
  }
  const dadosOk = !falhas && !sinal?.cancelado;
  return { ok: dadosOk && !imagens, dadosOk, falhas, imagens, total, golpes };
}
// quanto falta no jogo inteiro
export const quantoFaltaTudo = () => GENS.reduce((a, g) => a + quantoFalta(g.gen), 0);
export const totalDoJogo = () => new Set(GENS.flatMap(g => alvosDaGen(g.gen))).size;
