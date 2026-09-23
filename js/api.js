/* ============ PokéAPI com cache ============ */
// Cache em três camadas: `memo` (memória da aba, guarda até a Promise em voo pra não repetir fetch), IndexedDB
// (`pokerpg-cache`, que aguenta centenas de MB) e, se o navegador não tiver IndexedDB, localStorage (`pk:<chave>`).
// Trocamos o localStorage pelo IndexedDB porque ele trava em ~5 MB: baixar um mapa inteiro já chegava perto, e
// baixar TODAS as Gens estourava e falhava em silêncio (store.set engole o erro de cota).
// `chavesGuardadas` é um índice dos nomes das chaves em memória — é o que deixa `pokemonEmCache` responder na hora
// (a batalha precisa saber SE dá pra montar aquele Pokémon offline, sem esperar leitura nenhuma).
// Só `fetch` na hora da chamada — importável no Node (lá não há IndexedDB nem localStorage: tudo vira no-op).
// buildLearnset/slimPokemon/slimMove são puras (JSON cru da API → objeto enxuto) e têm teste.
import { API, SPR } from './dados.js';
import { esc, lastSeg, store } from './util.js';

const memo = new Map();
const chavesGuardadas = new Set();

/* ---- IndexedDB (com localStorage de reserva) ---- */
const BD = 'pokerpg-cache', LOJA = 'dados';
let bd = null, semIdb = typeof indexedDB === 'undefined';
function abrirBd() {
  if (bd || semIdb) return Promise.resolve(bd);
  return new Promise(ok => {
    let p; try { p = indexedDB.open(BD, 1); } catch { semIdb = true; return ok(null); }
    p.onupgradeneeded = () => { if (!p.result.objectStoreNames.contains(LOJA)) p.result.createObjectStore(LOJA); };
    p.onsuccess = () => { bd = p.result; ok(bd); };
    p.onerror = () => { semIdb = true; ok(null); };   // aba anônima / IndexedDB bloqueado: cai no localStorage
  });
}
const pedido = req => new Promise((ok, falhou) => { req.onsuccess = () => ok(req.result); req.onerror = () => falhou(req.error); });
async function guardar(chave, valor) {
  const db = await abrirBd();
  if (!db) return store.set('pk:' + chave, valor);
  try { await pedido(db.transaction(LOJA, 'readwrite').objectStore(LOJA).put(valor, chave)); chavesGuardadas.add(chave); }
  catch (e) { console.warn('cache: não consegui guardar', chave, e); }
}
async function ler(chave) {
  const db = await abrirBd();
  if (!db) return store.get('pk:' + chave);
  try { return await pedido(db.transaction(LOJA, 'readonly').objectStore(LOJA).get(chave)); } catch { return null; }
}
// Lê o índice de chaves e traz o que já estava no localStorage das versões antigas. main.js espera isto antes de abrir
// o jogo, senão `pokemonEmCache` responderia "não tenho" pra coisa que está guardada.
export async function iniciarCache() {
  const db = await abrirBd();
  if (db) {
    try { for (const k of await pedido(db.transaction(LOJA, 'readonly').objectStore(LOJA).getAllKeys())) chavesGuardadas.add(k); }
    catch (e) { console.warn('cache: não consegui ler o índice', e); }
    // migração: o que estava no localStorage vai pro IndexedDB e sai de lá (libera os 5 MB)
    for (const k of store.chaves('pk:')) {
      const chave = k.slice(3);
      if (!chavesGuardadas.has(chave)) { const v = store.get(k); if (v) await guardar(chave, v); }
      store.del(k);
    }
  } else {
    for (const k of store.chaves('pk:')) chavesGuardadas.add(k.slice(3));
  }
  // pede pro navegador não apagar o cache quando o espaço apertar (só funciona com interação; falha calado)
  try { navigator.storage?.persist?.(); } catch {}
  return chavesGuardadas.size;
}
// quanto o jogo está ocupando neste aparelho (dados + sprites), pra mostrar em Ajustes
export async function espacoUsado() {
  try { const e = await navigator.storage?.estimate?.(); return e ? { usado: e.usage || 0, total: e.quota || 0 } : null; } catch { return null; }
}
// Rede de celular oscila: um `fetch` que falha uma vez costuma funcionar no segundo tento. Sem isso, uma piscada
// de sinal no meio de uma exploração virava "Failed to fetch" na cara do jogador. Só repete falha de REDE (e 429,
// quando a PokéAPI pede calma) — 404 e outros erros do servidor não adianta insistir.
const TENTATIVAS = 3;
const esperar = ms => new Promise(r => setTimeout(r, ms));
async function getJSON(url) {
  let ultimo;
  for (let i = 1; i <= TENTATIVAS; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
      const e = new Error(r.status === 404 ? 'não encontrado' : 'HTTP ' + r.status); e.code = r.status;
      if (r.status !== 429 || i === TENTATIVAS) throw e;
      ultimo = e;
    } catch (e) {
      if (e.code && e.code !== 429) throw e;          // erro do servidor: não insiste
      ultimo = e;
      if (i === TENTATIVAS) break;
    }
    await esperar(400 * i);                            // 400ms, 800ms
  }
  throw ultimo;
}
function cached(key, loader) {
  if (memo.has(key)) return Promise.resolve(memo.get(key));
  const p = (async () => {
    if (chavesGuardadas.has(key)) { const guardado = await ler(key); if (guardado) { memo.set(key, guardado); return guardado; } }
    const v = await loader();
    memo.set(key, v); guardar(key, v);        // grava em segundo plano: quem pediu não espera o disco
    return v;
  })().catch(e => { memo.delete(key); throw e; });
  memo.set(key, p);
  return p;
}
// Modo offline: dá pra montar este Pokémon sem rede? (já buscado antes: memória ou localStorage)
export const pokemonEmCache = q => { const v = memo.get('mon:' + q); return (v && !(v instanceof Promise)) || chavesGuardadas.has('mon:' + q); };
// todos os Pokémon (por número) que já estão guardados neste aparelho
export const idsEmCache = () => [...chavesGuardadas].filter(k => k.startsWith('mon:')).map(k => +k.slice(4)).filter(Number.isInteger);
// quantos dados estão guardados (Ajustes mostra)
export const itensNoCache = () => chavesGuardadas.size;
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
// chave 'sp2:' (era 'sp:'): o cache antigo no localStorage não tinha captureRate — trocar a chave força buscar de novo.
// Ao acrescentar campo a qualquer loader, trocar a chave do mesmo jeito.
export const loadSpecies = url => cached('sp2:' + lastSeg(url), async () => {
  const s = await getJSON(url);
  return { growthUrl: s.growth_rate.url, evoUrl: s.evolution_chain?.url || null, defaultPokemon: (s.varieties.find(v => v.is_default) || s.varieties[0]).pokemon.name, captureRate: s.capture_rate ?? 45 };
});
export const loadGrowth = url => cached('gr:' + lastSeg(url), async () => {
  const g = await getJSON(url); const arr = Array(101).fill(0);
  for (const l of g.levels) arr[l.level] = l.experience;
  return arr;
});
// Árvore de evolução com TODAS as condições de cada caminho (evolucao.js avalia). Chave 'evo2:' (era 'evo:', que
// só guardava gatilho e nível). A raiz leva `v: 2` — save antigo com a árvore velha (S.meta.evo) é refeito.
export function slimEvo(chain) {
  const nome = x => x?.name || null;
  const det = d => ({
    trigger: d.trigger?.name, min_level: d.min_level, item: nome(d.item), held_item: nome(d.held_item),
    known_move: nome(d.known_move), known_move_type: nome(d.known_move_type), min_happiness: d.min_happiness, min_affection: d.min_affection,
    time_of_day: d.time_of_day || '', trade_species: nome(d.trade_species), party_species: nome(d.party_species), party_type: nome(d.party_type),
    relative_physical_stats: d.relative_physical_stats, location: nome(d.location), rain: !!d.needs_overworld_rain,
    upside_down: !!d.turn_upside_down, beauty: d.min_beauty
  });
  const n = x => ({ name: x.species.name, details: x.evolution_details.map(det), to: x.evolves_to.map(n) });
  return { ...n(chain), v: 2 };
}
export const loadEvo = url => cached('evo2:' + lastSeg(url), async () => slimEvo((await getJSON(url)).chain));
export const loadList = () => cached('list', async () => (await getJSON(`${API}/pokemon-species?limit=1025`)).results.map(r => r.name));
export async function resolvePokemon(q) {
  try { return await loadPokemon(q); }
  catch (e) {
    if (e.code !== 404) throw e;
    const sp = await loadSpecies(`${API}/pokemon-species/${q}/`);
    return loadPokemon(sp.defaultPokemon);
  }
}
// Mensagem de erro de rede escrita PRA QUEM JOGA: o caso comum é sinal ruim, não configuração errada.
// A dica de servidor local só aparece pra quem está mesmo rodando fora de um servidor (file://).
const BAIXE = 'Dica: em <b>⚙ Ajustes → Jogar offline</b> dá pra baixar o mapa inteiro e não depender mais da rede aqui.';
export function apiErr(e) {
  if (typeof location !== 'undefined' && location.protocol === 'file:') {
    return 'Este jogo precisa ser aberto por um servidor pra falar com a PokéAPI. Rode <code>python -m http.server</code> na pasta do projeto, ou publique.';
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return `📴 Sem internet: isto precisa de um dado da PokéAPI que ainda não está salvo neste aparelho. ${BAIXE}`;
  }
  if (e?.code === 429) return `A PokéAPI pediu calma (muitos pedidos seguidos). Espere alguns segundos e tente de novo. ${BAIXE}`;
  if (e?.code) return `A PokéAPI respondeu com erro (${esc(String(e.code))}). Tente de novo daqui a pouco.`;
  // sem `code` = falha de rede: tentamos 3 vezes e nenhuma passou
  return `A conexão falhou ao buscar um dado da PokéAPI (sinal instável?). Tente de novo. ${BAIXE}`;
}
