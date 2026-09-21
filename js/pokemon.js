/* ============ criar um Pokémon ============ */
// Instância jogável a partir dos dados da API (slimPokemon): IVs/natureza/habilidade sorteados salvo `opt`,
// golpes = os 4 mais recentes aprendidos por nível, shiny 1/4096. `mon.shiny` sobrevive à evolução (evolve só troca id/data). Usado pela criação (jogador) e pela batalha (selvagem).
import { STATS, NATURES } from './dados.js';
import { calcStats, freshVol, defaultMoves, ehShiny } from './regras.js';
import { loadMove } from './api.js';
import { rand, pick } from './util.js';

export async function makeMon(data, level, opt = {}) {
  const ivs = opt.ivs || Object.fromEntries(STATS.map(s => [s, rand(0, 31)]));
  const evs = opt.evs || Object.fromEntries(STATS.map(s => [s, 0]));
  const nature = opt.nature || pick(Object.keys(NATURES));
  const normal = data.abilities.filter(a => !a.hidden);
  const ability = opt.ability || (pick(normal.length ? normal : data.abilities) || { name: 'none' }).name;
  const refs = defaultMoves(data.learnset.list, level);
  const moves = (await Promise.all(refs.map(r => loadMove(r.url).catch(() => null)))).filter(Boolean).map(m => ({ ...m, ppLeft: m.pp }));
  const mon = { id: data.id, name: data.name, nick: opt.nick || '', data, level, ivs, evs, nature, ability, moves, status: null, sleep: 0, exp: 0, vol: freshVol(), shiny: ehShiny() };
  mon.stats = calcStats(mon); mon.hp = mon.stats.hp;
  return mon;
}
