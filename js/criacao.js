/* ============ render: criação ============ */
// Tela inicial: passo 1 dificuldade, passo 2 espécie (só os iniciais — REGIOES_INICIAIS — salvo modo com
// `especiesLivres`), prévia (habilidade, natureza, nível, apelido) e início do jogo.
import { G, save, nm } from './estado.js';
import { $, limparTopo, REDUCED, log } from './ui.js';
import { badge, buildGame } from './render.js';
import { makeMon } from './pokemon.js';
import { SPR, STATS, STAT_PT, NATURES, IMPL, ZONES, DIFICULDADES, REGIOES_INICIAIS, INICIAIS, DESBLOQUEIO } from './dados.js';
import { carregarCarreira } from './carreira.js';
import { progressoRoguelike, desbloqueadas, textoProgresso } from './roguelike.js';
import { natureLabel, defaultMoves, zonaLiberada } from './regras.js';
import { syncGet, loadAbility, loadSpecies, loadGrowth, loadEvo, loadList, resolvePokemon, apiErr } from './api.js';
import { rand, pick, esc, fmt, novoId } from './util.js';

const livres = () => DIFICULDADES[G.dif].especiesLivres;
// ids que dá pra escolher neste modo: iniciais + (Roguelike) os desbloqueados na carreira. null = qualquer um
function permitidos() {
  if (livres()) return null;
  const extra = DIFICULDADES[G.dif].desbloqueios ? desbloqueadas(carregarCarreira().jornadas).map(p => p.id) : [];
  return [...new Set([...INICIAIS, ...extra])];
}

// Passo 1 = dificuldade (sempre visível no topo), passo 2 = escolher o Pokémon — ou, no Randomizer, um botão só.
export function showCreate() {
  G.mode = 'create'; limparTopo();
  $('#app').innerHTML = `<main class="create">
    <div class="topo-criacao"><h1>Escolha quem você vai ser.</h1><span class="subrow"><button class="btn ghost" data-act="mp">👥 Multiplayer</button><button class="btn ghost" data-act="carreira">📊 Carreira</button><button class="btn ghost" data-act="ranking">🏆 Ranking</button></span></div>
    <p class="lead">Stats, IVs, EVs, natureza, golpes, XP e evolução seguem as fórmulas dos jogos. Você não tem treinador: é você na grama alta. Os outros Pokémon você encontra pelo caminho.</p>
    <h3 class="passo"><span>1</span> Dificuldade</h3>
    <div id="difs" class="difs"></div>
    <h3 class="passo"><span>2</span> <span id="passo2-titulo">Escolha o Pokémon</span></h3>
    <div id="escolha"></div>
    <div id="rnd" hidden><button class="btn big" data-act="randomizer">🎲 Sortear tudo e começar</button></div>
    <div id="netwarn"></div>
    <div id="preview"></div></main>`;
  renderDificuldade();
}
// passo 2: grade de iniciais por região (padrão) ou busca livre (modo com `especiesLivres`)
function renderEscolha() {
  if (!livres()) {
    $('#escolha').innerHTML = `<p class="small muted">Os iniciais de cada região, mais Pikachu e Eevee.</p>
      <div class="regioes">${REGIOES_INICIAIS.map(r => `<div class="regiao"><h4>${r.nome}</h4><div class="picks">${r.ids.map((id, i) =>
        `<button class="pick" data-act="pick" data-v="${id}"><img src="${SPR(id)}" alt="" loading="lazy">${r.nomes[i]}</button>`).join('')}</div></div>`).join('')}</div>
      ${DIFICULDADES[G.dif].desbloqueios ? secaoDesbloqueios() : ''}
      <div class="subrow" style="margin-top:12px"><button class="btn ghost" data-act="random">Sortear ${DIFICULDADES[G.dif].desbloqueios ? 'entre os disponíveis' : 'um inicial'}</button></div>`;
    return;
  }
  $('#escolha').innerHTML = `<div class="search">
      <input id="q" list="dex" placeholder="Nome em inglês ou número (ex.: eevee, 448)" autocomplete="off" aria-label="Buscar Pokémon">
      <button class="btn" data-act="search">Buscar</button>
      <button class="btn ghost" data-act="random">Sortear</button>
    </div><datalist id="dex"></datalist>`;
  loadList().then(list => { if ($('#dex')) $('#dex').innerHTML = list.map(n => `<option value="${n}">`).join(''); })
    .catch(e => { $('#netwarn').innerHTML = `<div class="notice">${apiErr(e)}</div>`; });
}
// Roguelike: espécies desbloqueadas (escolhíveis) + as mais perto de desbloquear
function secaoDesbloqueios() {
  const prog = progressoRoguelike(carregarCarreira().jornadas);
  const livresJa = prog.filter(p => p.desbloqueada && p.id), quase = prog.filter(p => !p.desbloqueada).slice(0, 6);
  const regra = `Pra desbloquear uma espécie, somando suas jornadas Roguelike: derrote ${DESBLOQUEIO.derrotados}, faça amizade com ${DESBLOQUEIO.amigos}, ou evolua pra ela ${DESBLOQUEIO.evolucaoMeio}× (forma do meio) / ${DESBLOQUEIO.evolucaoFinal}× (forma final).`;
  return `<div class="regiao desbloq"><h4>🔓 Desbloqueados (${livresJa.length})</h4>
      ${livresJa.length ? `<div class="picks">${livresJa.map(p => `<button class="pick" data-act="pick" data-v="${p.id}" title="${esc(textoProgresso(p))}"><img src="${SPR(p.id)}" alt="" loading="lazy">${esc(fmt(p.especie))}</button>`).join('')}</div>` : ''}
      <p class="small muted">${regra}</p>
      ${quase.length ? `<h4>Quase lá</h4><ul class="quase">${quase.map(p => `<li>${p.id ? `<img src="${SPR(p.id)}" alt="">` : ''}<b>${esc(fmt(p.especie))}</b><div class="bar"><div class="fill" style="width:${p.fracao * 100}%"></div></div><small>${esc(textoProgresso(p))}</small></li>`).join('')}</ul>` : ''}
    </div>`;
}
// cartões de dificuldade + monta o passo 2 conforme o modo (Randomizer não escolhe Pokémon)
export function renderDificuldade() {
  $('#difs').innerHTML = Object.entries(DIFICULDADES).map(([k, x]) => `<button class="abil ${G.dif === k ? 'on' : ''}" data-act="dificuldade" data-v="${k}" aria-pressed="${G.dif === k}"><b>${k === 'randomizer' ? '🎲 ' : ''}${x.nome}</b><small>${esc(x.desc)}</small></button>`).join('');
  const rnd = G.dif === 'randomizer';
  $('#escolha').hidden = rnd; $('#rnd').hidden = !rnd;
  $('#passo2-titulo').textContent = rnd ? 'Tudo sorteado' : 'Escolha o Pokémon';
  if (!rnd) renderEscolha();
  // prévia de uma espécie que este modo não permite (ex.: desbloqueada, mas trocou pra um modo sem desbloqueios) some
  const ok = permitidos();
  if (G.PV && ok && !ok.includes(G.PV.data.id)) G.PV = null;
  if (rnd || !G.PV) $('#preview').innerHTML = '';
  else renderPreview();
}
// "Sortear": entre os iniciais, ou entre todos se o modo for livre
export const sortearEspecie = () => { const ok = permitidos(); return previewSearch(ok ? pick(ok) : rand(1, 1025)); };
export async function previewSearch(q) {
  q = String(q).trim().toLowerCase().replace(/\s+/g, '-'); if (!q) return;
  const box = $('#preview'); box.innerHTML = '<p class="loading">Consultando a PokéAPI…</p>';
  try {
    const data = await resolvePokemon(q);
    // garantia (a UI só oferece iniciais, mas `pick`/`search` vêm de atributo do HTML)
    const ok = permitidos();
    if (ok && !ok.includes(data.id)) { box.innerHTML = '<p class="err">Neste modo só dá pra começar com um inicial, Pikachu, Eevee ou uma espécie desbloqueada.</p>'; return; }
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
  const startZone = [...ZONES].reverse().find(z => z.pool && zonaLiberada(z, mon.level) && z.min <= mon.level) || ZONES[0];
  G.S = { player: mon, bag: { potion: 3, 'full-heal': 1 }, money: 500, zone: startZone.id, meta: { growth, evo }, wins: 0, log: [], dificuldade,
    especieInicial: data.speciesName, criadoEm: new Date().toISOString(), tempoMs: 0, ultimoTick: Date.now(),
    id: novoId() }; // id da jornada: não contar em dobro na carreira e casar o save deste aparelho com o da nuvem
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
    const data = await resolvePokemon(livres() ? rand(1, 1025) : pick(INICIAIS));
    await iniciarJornada({ data, level: 5, dificuldade: 'randomizer' });
  } catch (e) {
    btn.disabled = false; btn.textContent = '🎲 Sortear tudo e começar';
    $('#netwarn').innerHTML = `<div class="notice">${apiErr(e)}</div>`;
  }
}
