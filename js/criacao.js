/* ============ render: criação ============ */
// Tela inicial: busca/sorteio de espécie, prévia (habilidade, natureza, nível, apelido) e início do jogo.
import { G, save, nm } from './estado.js';
import { $, REDUCED, log } from './ui.js';
import { badge, buildGame } from './render.js';
import { makeMon } from './pokemon.js';
import { SPR, STATS, STAT_PT, NATURES, IMPL, ZONES, QUICK, DIFICULDADES } from './dados.js';
import { natureLabel, defaultMoves } from './regras.js';
import { syncGet, loadAbility, loadSpecies, loadGrowth, loadEvo, loadList, resolvePokemon, apiErr } from './api.js';
import { rand, pick, esc, fmt } from './util.js';

// Passo 1 = dificuldade (sempre visível no topo), passo 2 = escolher o Pokémon — ou, no Randomizer, um botão só.
export function showCreate() {
  G.mode = 'create'; $('#topr').innerHTML = '';
  $('#app').innerHTML = `<main class="create">
    <h1>Escolha quem você vai ser.</h1>
    <p class="lead">Qualquer Pokémon da PokéAPI. Stats, IVs, EVs, natureza, golpes, XP e evolução seguem as fórmulas dos jogos. Você não tem treinador: é você na grama alta.</p>
    <h3 class="passo"><span>1</span> Dificuldade</h3>
    <div id="difs" class="difs"></div>
    <h3 class="passo"><span>2</span> <span id="passo2-titulo">Escolha o Pokémon</span></h3>
    <div id="escolha">
      <div class="search">
        <input id="q" list="dex" placeholder="Nome em inglês ou número (ex.: eevee, 448)" autocomplete="off" aria-label="Buscar Pokémon">
        <button class="btn" data-act="search">Buscar</button>
        <button class="btn ghost" data-act="random">Sortear</button>
      </div>
      <datalist id="dex"></datalist>
      <div class="picks">${QUICK.map(id => `<button class="pick" data-act="pick" data-v="${id}"><img src="${SPR(id)}" alt="" loading="lazy">#${id}</button>`).join('')}</div>
    </div>
    <div id="rnd" hidden><button class="btn big" data-act="randomizer">🎲 Sortear tudo e começar</button></div>
    <div id="netwarn"></div>
    <div id="preview"></div></main>`;
  renderDificuldade();
  loadList().then(list => { $('#dex').innerHTML = list.map(n => `<option value="${n}">`).join(''); })
    .catch(e => { $('#netwarn').innerHTML = `<div class="notice">${apiErr(e)}</div>`; });
}
// cartões de dificuldade + mostra/esconde o passo 2 conforme o modo (Randomizer não escolhe Pokémon)
export function renderDificuldade() {
  $('#difs').innerHTML = Object.entries(DIFICULDADES).map(([k, x]) => `<button class="abil ${G.dif === k ? 'on' : ''}" data-act="dificuldade" data-v="${k}" aria-pressed="${G.dif === k}"><b>${k === 'randomizer' ? '🎲 ' : ''}${x.nome}</b><small>${esc(x.desc)}</small></button>`).join('');
  const rnd = G.dif === 'randomizer';
  $('#escolha').hidden = rnd; $('#rnd').hidden = !rnd;
  $('#passo2-titulo').textContent = rnd ? 'Tudo sorteado' : 'Escolha o Pokémon';
  if (rnd) $('#preview').innerHTML = '';
  else if (G.PV) renderPreview();
}
export async function previewSearch(q) {
  q = String(q).trim().toLowerCase().replace(/\s+/g, '-'); if (!q) return;
  const box = $('#preview'); box.innerHTML = '<p class="loading">Consultando a PokéAPI…</p>';
  try {
    const data = await resolvePokemon(q);
    // nível sobrevive a trocar de espécie na prévia; a dificuldade mora em G.dif (passo 1)
    G.PV = { data, ability: (data.abilities.find(a => !a.hidden) || data.abilities[0])?.name, nature: pick(Object.keys(NATURES)), level: G.PV?.level || 5, nick: '' };
    renderPreview();
    data.abilities.forEach(a => loadAbility(a).then(() => { if (G.PV?.data === data) renderPreview(); }).catch(() => {}));
    box.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
  } catch (e) {
    box.innerHTML = `<p class="err">${e.code === 404 ? `Nenhum Pokémon chamado “${esc(q)}”. Use o nome em inglês (ex.: mr-mime) ou o número da Pokédex.` : apiErr(e)}</p>`;
  }
}
// nível que vale de fato: a escolha do jogador só conta se a dificuldade deixar (senão 5)
const nivelInicial = PV => DIFICULDADES[G.dif].nivelLivre ? PV.level : 5;
export function renderPreview() {
  const PV = G.PV, d = PV.data, total = STATS.reduce((a, s) => a + d.base[s], 0);
  const nickVal = $('#pv-nick')?.value ?? PV.nick; PV.nick = nickVal;
  const dif = DIFICULDADES[G.dif], livre = dif.escolhaLivre, nivel = nivelInicial(PV);
  const sorteada = '<small class="muted"> · sorteada ao começar</small>';
  $('#preview').innerHTML = `<section class="pv">
    <div class="pv-art"><img src="${d.art || d.sprite}" alt="${esc(fmt(d.name))}"></div>
    <div>
      <p class="dexno">Nº ${String(d.id).padStart(4, '0')}</p>
      <h2>${esc(fmt(d.name))}</h2>
      <div class="types">${d.types.map(badge).join('')}</div>
      <div class="basestats">${STATS.map(s => `<div class="bs"><span>${STAT_PT[s]}</span><b>${d.base[s]}</b><i style="width:${Math.min(100, d.base[s] / 255 * 100)}%"></i></div>`).join('')}
        <div class="bs total"><span>Total</span><b>${total}</b><i></i></div></div>
      <p class="small muted" style="margin-top:14px">Modo <b>${dif.nome}</b> (troque no passo 1, lá em cima).</p>
      <h3>Habilidade${livre ? '' : sorteada}</h3>
      <div class="abils">${d.abilities.map(a => `<button class="abil ${livre && PV.ability === a.name ? 'on' : ''}" data-act="ability" data-v="${a.name}" aria-pressed="${livre && PV.ability === a.name}" ${livre ? '' : 'disabled'}><b>${esc(fmt(a.name))}</b>${a.hidden ? '<em>oculta</em>' : ''}${IMPL.has(a.name) ? '<span class="impl">✓ ativa no protótipo</span>' : ''}<small>${esc(syncGet('ab:' + a.name)?.effect || 'Carregando…')}</small></button>`).join('')}</div>
      <div class="row3">
        <label>Natureza${livre ? `<select id="pv-nature">${Object.keys(NATURES).map(n => `<option value="${n}" ${n === PV.nature ? 'selected' : ''}>${esc(natureLabel(n))}</option>`).join('')}</select>` : '<select disabled><option>Sorteada ao começar</option></select>'}</label>
        <label>Nível inicial${dif.nivelLivre ? `<select id="pv-level">${[5, 15, 30, 50].map(l => `<option ${l === PV.level ? 'selected' : ''}>${l}</option>`).join('')}</select>` : `<select disabled title="${dif.nome}: começa no nível 5"><option>5</option></select>`}</label>
        <label>Apelido<input id="pv-nick" maxlength="12" placeholder="${esc(fmt(d.name))}" value="${esc(PV.nick)}"></label>
      </div>
      <p class="small muted" style="margin-top:14px">Golpes iniciais: ${defaultMoves(d.learnset.list, nivel).map(m => esc(fmt(m.name))).join(', ')}. Lista de golpes por nível vinda de ${esc(fmt(d.learnset.vg) || '—')}.</p>
      <button class="btn big" data-act="start">Começar como ${esc(fmt(d.name))}</button>
    </div></section>`;
}
// Monta o save e entra no jogo. `nature`/`ability` undefined = sorteadas pelo makeMon.
async function iniciarJornada({ data, level, nature, ability, nick = '', dificuldade }) {
  const sp = await loadSpecies(data.speciesUrl);
  const growth = await loadGrowth(sp.growthUrl);
  const evo = sp.evoUrl ? await loadEvo(sp.evoUrl) : null;
  const mon = await makeMon(data, level, { nature, ability, nick });
  mon.exp = growth[mon.level];
  const startZone = [...ZONES].reverse().find(z => z.pool && z.min <= mon.level) || ZONES[0];
  G.S = { player: mon, bag: { potion: 3, 'full-heal': 1 }, money: 500, zone: startZone.id, meta: { growth, evo }, wins: 0, log: [], dificuldade };
  G.mode = 'explore'; G.panel = 'main';
  buildGame();
  log(`Você abre os olhos em ${startZone.name}. Não há treinador por perto: desta vez, o Pokémon é você, ${nm(mon)}.`);
  if (mon.shiny) log('✨ Suas cores brilham diferente. Você é um Pokémon shiny — 1 em 4096!', 'level');
  const dif = DIFICULDADES[dificuldade];
  if (!dif.escolhaLivre) log(`${dif.nome}: natureza ${esc(natureLabel(mon.nature))}, habilidade ${esc(fmt(mon.ability))}.`, 'muted');
  log('Explore para encontrar Pokémon selvagens, itens e dinheiro. Cuidado com treinadores: eles querem te capturar. O jogo salva sozinho neste navegador.', 'muted');
  save();
}
export async function startGame(btn) {
  btn.disabled = true; btn.textContent = 'Preparando sua jornada…';
  const PV = G.PV, livre = DIFICULDADES[G.dif].escolhaLivre;
  try {
    PV.nick = ($('#pv-nick')?.value || '').trim();
    await iniciarJornada({ data: PV.data, level: nivelInicial(PV), nature: livre ? PV.nature : undefined, ability: livre ? PV.ability : undefined, nick: PV.nick, dificuldade: G.dif });
  } catch (e) {
    btn.disabled = false; btn.textContent = 'Tentar de novo';
    $('#preview').insertAdjacentHTML('beforeend', `<p class="err">${apiErr(e)}</p>`);
  }
}
// Full Randomizer: sorteia a espécie também e começa direto, sem prévia
export async function fullRandomizer(btn) {
  btn.disabled = true; btn.textContent = '🎲 Sorteando…';
  try {
    const data = await resolvePokemon(rand(1, 1025));
    await iniciarJornada({ data, level: 5, dificuldade: 'randomizer' });
  } catch (e) {
    btn.disabled = false; btn.textContent = '🎲 Sortear tudo e começar';
    $('#netwarn').innerHTML = `<div class="notice">${apiErr(e)}</div>`;
  }
}
// fim de jogo do Hardcore (o save já foi apagado por quem chama)
export function telaFim(r) {
  G.mode = 'fim'; $('#topr').innerHTML = '';
  $('#app').innerHTML = `<main class="create fim">
    <h1>Fim da jornada.</h1>
    <p class="lead">${esc(r.cacador)} capturou ${esc(r.nome)}. No Hardcore não existe segunda chance: o save foi apagado.</p>
    <section class="pv">
      <div class="pv-art"><img src="${r.sprite}" alt="${esc(r.especie)}"></div>
      <div>
        <h2>${esc(r.nome)}</h2>
        <p class="muted">${esc(r.especie)} · nível ${r.nivel} · ${r.vitorias} vitória${r.vitorias === 1 ? '' : 's'} · ${r.treinadores} treinador${r.treinadores === 1 ? '' : 'es'} derrotado${r.treinadores === 1 ? '' : 's'}</p>
        <button class="btn big" data-act="recomecar">Nova jornada</button>
      </div>
    </section></main>`;
}
