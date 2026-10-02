/* ============ criar um Pokémon ============ */
// Instância jogável a partir dos dados da API (slimPokemon): IVs/natureza/habilidade sorteados salvo `opt`,
// golpes = os 4 mais recentes aprendidos por nível, shiny 1/4096. `mon.shiny` sobrevive à evolução (evolve só troca id/data). Usado pela criação (jogador) e pela batalha (selvagem).
import { STATS, NATURES } from './dados.js';
import { calcStats, freshVol, defaultMoves, ehShiny, sortearGenero } from './regras.js';
import { oficioDe } from './oficios.js';
import { loadMove, loadSpecies } from './api.js';
import { precarregarCry } from './som.js';
import { rand, pick } from './util.js';

/* Os 6 IVs em 31. Quem passa isto em `opt.ivs` é a criação, quando a badge "Potencial máximo" está conquistada
   (badges.js). Alfas, lendários e chefes montam o próprio mapa em batalha.js — não foram trocados por este pra não
   mexer em código que funciona. Congelado e compartilhado: nada no jogo escreve em `mon.ivs` depois de criado. */
export const IVS_MAX = Object.freeze(Object.fromEntries(STATS.map(s => [s, 31])));

export async function makeMon(data, level, opt = {}) {
  const ivs = opt.ivs || Object.fromEntries(STATS.map(s => [s, rand(0, 31)]));
  const evs = opt.evs || Object.fromEntries(STATS.map(s => [s, 0]));
  const nature = opt.nature || pick(Object.keys(NATURES));
  const normal = data.abilities.filter(a => !a.hidden);
  const ability = opt.ability || (pick(normal.length ? normal : data.abilities) || { name: 'none' }).name;
  const refs = defaultMoves(data.learnset.list, level);
  /* O gênero sai da TAXA da espécie (api.loadSpecies → `genderRate`), buscada JUNTO dos golpes de propósito: é a
     mesma espera que já existe aqui, e a espécie já está no cache de quem baixou o mapa (offline.baixarGen). Se a
     busca falhar, `−1` = sem gênero: é o erro mais calado dos dois (um ♂ errado num Voltorb seria visível e viraria
     Attract funcionando onde não devia). `opt.genero` vem de quem reidrata um Pokémon já nascido (loja-conta.js). */
  const [moves, taxa] = await Promise.all([
    Promise.all(refs.map(r => loadMove(r.url).catch(() => null))).then(l => l.filter(Boolean).map(m => ({ ...m, ppLeft: m.pp }))),
    opt.genero !== undefined ? -1 : loadSpecies(data.speciesUrl).then(s => s.genderRate).catch(() => -1)
  ]);
  // `opt.shiny` força o brilho: hoje só quem recrutou um shiny daquela espécie pode começar a jornada com ela
  // shiny (criacao.js). Sem a opção, continua no sorteio de sempre — 1 em 4096, pra você e pra todo selvagem.
  /* ⚔ Ofício (oficios.js): decidido UMA vez aqui e congelado, como o gênero. Não muda na evolução de propósito
     (Aron já nasce Guardião, só fraco) — e congelar evita que uma calibragem futura da fórmula troque o ofício
     de quem já está num save. `null` quando a espécie vem sem stats: quem lê cai no peso padrão. */
  const mon = { id: data.id, name: data.name, nick: opt.nick || '', data, level, ivs, evs, nature, ability, moves, status: null, sleep: 0, exp: 0, vol: freshVol(), shiny: opt.shiny ?? ehShiny(), genero: opt.genero ?? sortearGenero(taxa, data.name), oficio: oficioDe(data)?.maior || null };
  mon.stats = calcStats(mon); mon.hp = mon.stats.hp;
  // aquece o grito desta espécie (som.js): todo Pokémon nasce aqui, bem antes de entrar em campo, então na hora
  // da luta o áudio já está decodificado e sai junto da cena em vez de chegar atrasado. No-op com o som desligado.
  precarregarCry(data.id);
  return mon;
}
