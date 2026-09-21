/* ============ render: criação ============ */
// Tela inicial: busca/sorteio de espécie, prévia (habilidade, natureza, nível, apelido) e início do jogo.
import { G, save, nm } from './estado.js';
import { $, REDUCED, log } from './ui.js';
import { badge, buildGame } from './render.js';
import { makeMon } from './pokemon.js';
import { SPR, STATS, STAT_PT, NATURES, IMPL, ZONES, QUICK } from './dados.js';
import { natureLabel, defaultMoves } from './regras.js';
import { syncGet, loadAbility, loadSpecies, loadGrowth, loadEvo, loadList, resolvePokemon, apiErr } from './api.js';
import { pick, esc, fmt } from './util.js';

export function showCreate() {
  G.mode = 'create'; $('#topr').innerHTML = '';
  $('#app').innerHTML = `<main class="create">
    <h1>Escolha quem você vai ser.</h1>
    <p class="lead">Qualquer Pokémon da PokéAPI. Stats, IVs, EVs, natureza, golpes, XP e evolução seguem as fórmulas dos jogos. Você não tem treinador: é você na grama alta.</p>
    <div class="search">
      <input id="q" list="dex" placeholder="Nome em inglês ou número (ex.: eevee, 448)" autocomplete="off" aria-label="Buscar Pokémon">
      <button class="btn" data-act="search">Buscar</button>
      <button class="btn ghost" data-act="random">Sortear</button>
    </div>
    <datalist id="dex"></datalist>
    <div class="picks">${QUICK.map(id => `<button class="pick" data-act="pick" data-v="${id}"><img src="${SPR(id)}" alt="" loading="lazy">#${id}</button>`).join('')}</div>
    <div id="netwarn"></div>
    <div id="preview"></div></main>`;
  loadList().then(list => { $('#dex').innerHTML = list.map(n => `<option value="${n}">`).join(''); })
    .catch(e => { $('#netwarn').innerHTML = `<div class="notice">${apiErr(e)}</div>`; });
}
export async function previewSearch(q) {
  q = String(q).trim().toLowerCase().replace(/\s+/g, '-'); if (!q) return;
  const box = $('#preview'); box.innerHTML = '<p class="loading">Consultando a PokéAPI…</p>';
  try {
    const data = await resolvePokemon(q);
    G.PV = { data, ability: (data.abilities.find(a => !a.hidden) || data.abilities[0])?.name, nature: pick(Object.keys(NATURES)), level: G.PV?.level || 5, nick: '' };
    renderPreview();
    data.abilities.forEach(a => loadAbility(a).then(() => { if (G.PV?.data === data) renderPreview(); }).catch(() => {}));
    box.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
  } catch (e) {
    box.innerHTML = `<p class="err">${e.code === 404 ? `Nenhum Pokémon chamado “${esc(q)}”. Use o nome em inglês (ex.: mr-mime) ou o número da Pokédex.` : apiErr(e)}</p>`;
  }
}
export function renderPreview() {
  const PV = G.PV, d = PV.data, total = STATS.reduce((a, s) => a + d.base[s], 0);
  const nickVal = $('#pv-nick')?.value ?? PV.nick; PV.nick = nickVal;
  $('#preview').innerHTML = `<section class="pv">
    <div class="pv-art"><img src="${d.art || d.sprite}" alt="${esc(fmt(d.name))}"></div>
    <div>
      <p class="dexno">Nº ${String(d.id).padStart(4, '0')}</p>
      <h2>${esc(fmt(d.name))}</h2>
      <div class="types">${d.types.map(badge).join('')}</div>
      <div class="basestats">${STATS.map(s => `<div class="bs"><span>${STAT_PT[s]}</span><b>${d.base[s]}</b><i style="width:${Math.min(100, d.base[s] / 255 * 100)}%"></i></div>`).join('')}
        <div class="bs total"><span>Total</span><b>${total}</b><i></i></div></div>
      <h3>Habilidade</h3>
      <div class="abils">${d.abilities.map(a => `<button class="abil ${PV.ability === a.name ? 'on' : ''}" data-act="ability" data-v="${a.name}" aria-pressed="${PV.ability === a.name}"><b>${esc(fmt(a.name))}</b>${a.hidden ? '<em>oculta</em>' : ''}${IMPL.has(a.name) ? '<span class="impl">✓ ativa no protótipo</span>' : ''}<small>${esc(syncGet('ab:' + a.name)?.effect || 'Carregando…')}</small></button>`).join('')}</div>
      <div class="row3">
        <label>Natureza<select id="pv-nature">${Object.keys(NATURES).map(n => `<option value="${n}" ${n === PV.nature ? 'selected' : ''}>${esc(natureLabel(n))}</option>`).join('')}</select></label>
        <label>Nível inicial<select id="pv-level">${[5, 15, 30, 50].map(l => `<option ${l === PV.level ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label>Apelido<input id="pv-nick" maxlength="12" placeholder="${esc(fmt(d.name))}" value="${esc(PV.nick)}"></label>
      </div>
      <p class="small muted" style="margin-top:14px">Golpes iniciais: ${defaultMoves(d.learnset.list, PV.level).map(m => esc(fmt(m.name))).join(', ')}. Lista de golpes por nível vinda de ${esc(fmt(d.learnset.vg) || '—')}.</p>
      <button class="btn big" data-act="start">Começar como ${esc(fmt(d.name))}</button>
    </div></section>`;
}
export async function startGame(btn) {
  btn.disabled = true; btn.textContent = 'Preparando sua jornada…';
  const PV = G.PV;
  try {
    const d = PV.data;
    const sp = await loadSpecies(d.speciesUrl);
    const growth = await loadGrowth(sp.growthUrl);
    const evo = sp.evoUrl ? await loadEvo(sp.evoUrl) : null;
    PV.nick = ($('#pv-nick')?.value || '').trim();
    const mon = await makeMon(d, PV.level, { nature: PV.nature, ability: PV.ability, nick: PV.nick });
    mon.exp = growth[mon.level];
    const startZone = [...ZONES].reverse().find(z => z.pool && z.min <= mon.level) || ZONES[0];
    G.S = { player: mon, bag: { potion: 3, 'full-heal': 1 }, money: 500, zone: startZone.id, meta: { growth, evo }, wins: 0, log: [] };
    G.mode = 'explore'; G.panel = 'main';
    buildGame();
    log(`Você abre os olhos em ${startZone.name}. Não há treinador por perto: desta vez, o Pokémon é você, ${nm(mon)}.`);
    log('Explore para encontrar Pokémon selvagens, itens e dinheiro. O jogo salva sozinho neste navegador.', 'muted');
    save();
  } catch (e) {
    btn.disabled = false; btn.textContent = 'Tentar de novo';
    $('#preview').insertAdjacentHTML('beforeend', `<p class="err">${apiErr(e)}</p>`);
  }
}
