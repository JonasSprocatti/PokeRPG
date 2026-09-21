/* ============ PokéAPI com cache ============ */
// Cache em duas camadas: `memo` (memória da aba, guarda até a Promise em voo pra não repetir fetch)
// e localStorage (`pk:<chave>`, sobrevive a F5). Só `fetch` na hora da chamada — importável no Node.
// buildLearnset/slimPokemon/slimMove são puras (JSON cru da API → objeto enxuto) e têm teste.
import { API, SPR } from './dados.js';
import { esc, lastSeg, store } from './util.js';

const memo = new Map();
async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) { const e = new Error(r.status === 404 ? 'não encontrado' : 'HTTP ' + r.status); e.code = r.status; throw e; }
  return r.json();
}
function cached(key, loader) {
  if (memo.has(key)) return Promise.resolve(memo.get(key));
  const hit = store.get('pk:' + key);
  if (hit) { memo.set(key, hit); return Promise.resolve(hit); }
  const p = loader().then(v => { memo.set(key, v); store.set('pk:' + key, v); return v; })
    .catch(e => { memo.delete(key); throw e; });
  memo.set(key, p);
  return p;
}
export function syncGet(key) { const v = memo.get(key); return v && !(v instanceof Promise) ? v : null; }

const VG_PREF = ['scarlet-violet', 'sword-shield', 'brilliant-diamond-shining-pearl', 'ultra-sun-ultra-moon', 'sun-moon', 'omega-ruby-alpha-sapphire', 'x-y', 'black-2-white-2', 'black-white', 'heartgold-soulsilver', 'platinum', 'diamond-pearl', 'emerald', 'firered-leafgreen', 'ruby-sapphire', 'crystal', 'gold-silver', 'yellow', 'red-blue'];
export function buildLearnset(moves) {
  const groups = {};
  for (const m of moves) for (const d of m.version_group_details) {
    if (d.move_learn_method.name !== 'level-up') continue;
    (groups[d.version_group.name] ||= []).push({ name: m.move.name, url: m.move.url, level: d.level_learned_at });
  }
  const vg = VG_PREF.find(g => groups[g]?.length) || Object.keys(groups)[0];
  const seen = new Map();
  for (const e of (groups[vg] || [])) if (!seen.has(e.name) || seen.get(e.name).level > e.level) seen.set(e.name, e);
  return { vg: vg || '', list: [...seen.values()].sort((a, b) => a.level - b.level) };
}
export function slimPokemon(p) {
  return {
    id: p.id, name: p.name, speciesName: p.species.name, speciesUrl: p.species.url,
    types: [...p.types].sort((a, b) => a.slot - b.slot).map(t => t.type.name),
    base: Object.fromEntries(p.stats.map(s => [s.stat.name, s.base_stat])),
    effort: Object.fromEntries(p.stats.filter(s => s.effort > 0).map(s => [s.stat.name, s.effort])),
    baseExp: p.base_experience || 60,
    abilities: p.abilities.map(a => ({ name: a.ability.name, url: a.ability.url, hidden: a.is_hidden })),
    sprite: p.sprites.front_default || SPR(p.id), back: p.sprites.back_default,
    art: p.sprites.other?.['official-artwork']?.front_default || p.sprites.front_default,
    learnset: buildLearnset(p.moves)
  };
}
export function slimMove(m) {
  const en = (m.effect_entries || []).find(e => e.language.name === 'en');
  let desc = en ? en.short_effect.replace(/\$effect_chance/g, m.effect_chance ?? '') : '';
  if (!desc) { const ft = (m.flavor_text_entries || []).filter(f => f.language.name === 'en').pop(); desc = ft ? ft.flavor_text.replace(/\s+/g, ' ') : ''; }
  const mt = m.meta;
  return {
    name: m.name, type: m.type.name, cls: m.damage_class?.name || 'status', power: m.power, acc: m.accuracy, pp: m.pp || 10,
    priority: m.priority || 0, target: m.target?.name || 'selected-pokemon',
    meta: mt ? { ailment: mt.ailment?.name || 'none', ailChance: mt.ailment_chance || 0, crit: mt.crit_rate || 0, drain: mt.drain || 0, heal: mt.healing || 0, flinch: mt.flinch_chance || 0, statChance: mt.stat_chance || 0, minHits: mt.min_hits || 0, maxHits: mt.max_hits || 0, cat: mt.category?.name || '' } : {},
    stats: (m.stat_changes || []).map(s => ({ stat: s.stat.name, change: s.change })), desc
  };
}
export const loadPokemon = q => cached('mon:' + q, async () => slimPokemon(await getJSON(`${API}/pokemon/${q}`)));
export const loadMove = url => cached('move:' + lastSeg(url), async () => slimMove(await getJSON(url)));
export const loadAbility = a => cached('ab:' + a.name, async () => {
  const d = await getJSON(a.url); const en = (d.effect_entries || []).find(e => e.language.name === 'en');
  const ft = (d.flavor_text_entries || []).filter(f => f.language.name === 'en').pop();
  return { effect: en?.short_effect || ft?.flavor_text || 'Sem descrição.' };
});
export const loadSpecies = url => cached('sp:' + lastSeg(url), async () => {
  const s = await getJSON(url);
  return { growthUrl: s.growth_rate.url, evoUrl: s.evolution_chain?.url || null, defaultPokemon: (s.varieties.find(v => v.is_default) || s.varieties[0]).pokemon.name };
});
export const loadGrowth = url => cached('gr:' + lastSeg(url), async () => {
  const g = await getJSON(url); const arr = Array(101).fill(0);
  for (const l of g.levels) arr[l.level] = l.experience;
  return arr;
});
export const loadEvo = url => cached('evo:' + lastSeg(url), async () => {
  const c = await getJSON(url);
  const n = x => ({ name: x.species.name, details: x.evolution_details.map(d => ({ trigger: d.trigger?.name, min_level: d.min_level })), to: x.evolves_to.map(n) });
  return n(c.chain);
});
export const loadList = () => cached('list', async () => (await getJSON(`${API}/pokemon-species?limit=1025`)).results.map(r => r.name));
export async function resolvePokemon(q) {
  try { return await loadPokemon(q); }
  catch (e) {
    if (e.code !== 404) throw e;
    const sp = await loadSpecies(`${API}/pokemon-species/${q}/`);
    return loadPokemon(sp.defaultPokemon);
  }
}
export const apiErr = e => `Não consegui falar com a PokéAPI (${esc(e.message)}). Se você abriu este jogo dentro do chat do Claude, o visualizador de lá bloqueia requisições externas: rode num servidor local (<code>python -m http.server</code>) ou publique na Vercel.`;
