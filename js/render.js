/* ============ render: jogo ============ */
// Re-render total a partir de G (sem diffing): ficha à esquerda, cena (zona ou batalha) + log + ações à direita.
import { G, zone } from './estado.js';
import { $ } from './ui.js';
import { SPR, ITEM_SPR, STATS, STAT_PT, STAGE_SHORT, TYPE_PT, TC, DARK_TEXT, CLS_PT, NATURES, IMPL, ST_SHORT, ITEMS, ZONES } from './dados.js';
import { natureLabel } from './regras.js';
import { syncGet, loadAbility } from './api.js';
import { clamp, esc, fmt } from './util.js';

export const badge = t => `<span class="ty" style="--c:${TC[t] || '#888'};--tc:${DARK_TEXT.has(t) ? '#1c1f3a' : '#fff'}">${TYPE_PT[t] || fmt(t)}</span>`;
function hpbar(m) {
  const pct = clamp(m.hp / m.stats.hp * 100, 0, 100), col = pct > 50 ? '#5FB36A' : pct > 20 ? '#F7C548' : '#E4572E';
  return `<div class="hp"><span>HP</span><div class="bar"><div class="fill" style="width:${pct}%;background:${col}"></div></div><span>${m.hp}/${m.stats.hp}</span></div>`;
}
function chipsFor(m) {
  let h = m.status ? `<span class="st st-${m.status}">${ST_SHORT[m.status]}</span>` : '';
  if (m.vol?.conf) h += '<span class="st">CONF</span>';
  for (const [s, v] of Object.entries(m.vol?.stages || {})) if (v) h += `<span class="stg ${v > 0 ? 'up' : 'down'}">${STAGE_SHORT[s]} ${v > 0 ? '+' : ''}${v}</span>`;
  return `<div class="chips">${h}</div>`;
}
function plate(m) {
  const label = m === G.S.player ? (m.nick || fmt(m.name)) : fmt(m.name);
  return `<div class="pl-top"><span>${esc(label)}</span><span>Nv. ${m.level}</span></div>${hpbar(m)}${chipsFor(m)}`;
}
function renderSheet() {
  const S = G.S, P = S.player, GR = S.meta.growth, [up, down] = NATURES[P.nature] || [];
  const cur = P.exp - GR[P.level], need = P.level < 100 ? GR[P.level + 1] - GR[P.level] : 1;
  const abInfo = P.data.abilities.find(a => a.name === P.ability);
  const abDesc = syncGet('ab:' + P.ability)?.effect;
  if (!abDesc && abInfo) loadAbility(abInfo).then(renderSheet).catch(() => {});
  const bag = Object.entries(S.bag).filter(([k, n]) => n > 0 && ITEMS[k]);
  $('#sheet').innerHTML = `
    <div class="me">
      <img src="${P.data.sprite}" alt="${esc(fmt(P.name))}">
      <div>
        <h2>${esc(P.nick || fmt(P.name))}</h2>
        <p class="sub">${P.nick ? esc(fmt(P.name)) + ', ' : ''}nível ${P.level}</p>
        <div class="types">${P.data.types.map(badge).join('')}</div>
      </div>
    </div>
    <div class="bars">
      ${hpbar(P)}
      <div class="hp xp"><span>XP</span><div class="bar"><div class="fill" style="width:${P.level < 100 ? clamp(cur / need * 100, 0, 100) : 100}%"></div></div><span>${P.level < 100 ? `faltam ${GR[P.level + 1] - P.exp}` : 'máx.'}</span></div>
      ${chipsFor(P)}
    </div>
    <table class="stats">
      <thead><tr><th>Atributo</th><th>Valor</th><th>Base</th><th>IV</th><th>EV</th></tr></thead>
      <tbody>${STATS.map(s => `<tr><td>${STAT_PT[s]} ${s === up ? '<span class="up" title="Natureza">▲</span>' : s === down ? '<span class="down" title="Natureza">▼</span>' : ''}</td><td class="v">${P.stats[s]}</td><td>${P.data.base[s]}</td><td>${P.ivs[s]}</td><td>${P.evs[s]}</td></tr>`).join('')}</tbody>
    </table>
    <p class="small muted" style="margin-top:6px">Natureza ${esc(natureLabel(P.nature))}. Vitórias: ${S.wins || 0}.</p>
    <div class="sec"><h3>Habilidade: ${esc(fmt(P.ability))}</h3>
      <p class="small muted">${esc(abDesc || 'Carregando descrição…')} ${IMPL.has(P.ability) ? '<span class="impl">✓ ativa no protótipo</span>' : '<em class="small">(ainda só descritiva)</em>'}</p></div>
    <div class="sec mlist"><h3>Golpes</h3>
      ${P.moves.map(m => `<details><summary><b>${esc(fmt(m.name))}</b><span class="pp">PP ${m.ppLeft}/${m.pp}</span><small>${badge(m.type)} ${CLS_PT[m.cls]}, poder ${m.power ?? '—'}, precisão ${m.acc ?? '—'}</small></summary><p>${esc(m.desc)}</p></details>`).join('')}
    </div>
    <div class="sec"><h3>Mochila</h3>
      ${bag.length ? `<ul class="bag">${bag.map(([k, n]) => `<li><img src="${ITEM_SPR(k)}" alt="" onerror="this.style.visibility='hidden'"><span><b>${ITEMS[k].name}</b> ×${n}<small>${ITEMS[k].desc}</small></span>${G.mode === 'explore' && !ITEMS[k].battle ? `<button class="btn ghost sm" data-act="item" data-v="${k}" ${G.busy ? 'disabled' : ''}>Usar</button>` : ''}</li>`).join('')}</ul>` : '<p class="small muted">Vazia. Explore para achar itens ou passe na loja.</p>'}
    </div>`;
}
function renderScene() {
  const sc = $('#scene');
  if (G.mode === 'battle' && G.B) {
    const E = G.B.enemy, P = G.S.player;
    sc.className = 'scene battle';
    sc.innerHTML = `
      <div class="side foe"><div class="plate">${plate(E)}</div>
        <div class="mon ${E.hp <= 0 ? 'fainted' : ''}" id="mon-e"><div class="pad"></div><img class="spr" src="${E.data.sprite}" alt="${esc(fmt(E.name))}"></div></div>
      <div class="side me"><div class="mon ${P.hp <= 0 ? 'fainted' : ''}" id="mon-p"><div class="pad"></div><img class="spr back ${P.data.back ? '' : 'flip'}" src="${P.data.back || P.data.sprite}" alt="${esc(fmt(P.name))}"></div>
        <div class="plate">${plate(P)}</div></div>`;
  } else {
    const z = zone();
    sc.className = 'scene';
    sc.innerHTML = `
      <div class="zone-head"><h2>${z.name}</h2><p>${z.desc} ${z.pool ? `Pokémon entre os níveis ${z.min} e ${z.max}.` : ''}</p></div>
      <div class="zones">${ZONES.map(o => `<button class="chip ${o.id === z.id ? 'on' : ''}" data-act="zone" data-v="${o.id}" ${G.busy ? 'disabled' : ''}>${o.name}<small>${o.pool ? `${o.min}–${o.max}` : '±2'}</small></button>`).join('')}</div>
      <div class="locals" aria-hidden="true">${z.pool ? z.pool.map(id => `<img src="${SPR(id)}" alt="">`).join('') : '<span class="muted">Qualquer um dos 1025 pode aparecer.</span>'}</div>`;
  }
}
function renderActions() {
  const S = G.S, a = $('#actions'), dis = G.busy ? 'disabled' : '';
  if (G.mode === 'battle' && G.B) {
    const P = S.player;
    if (G.panel === 'bag') {
      const items = Object.entries(S.bag).filter(([k, n]) => n > 0 && ITEMS[k] && !ITEMS[k].candy);
      a.innerHTML = `<div class="bag-grid">${items.map(([k, n]) => `<button class="item-btn" data-act="item-b" data-v="${k}" ${dis}><img src="${ITEM_SPR(k)}" alt="" onerror="this.style.visibility='hidden'"><span>${ITEMS[k].name}</span><small>×${n}</small></button>`).join('') || '<p class="muted">Nada utilizável em batalha.</p>'}</div>
        <div class="subrow"><button class="btn ghost" data-act="panel" data-v="moves" ${dis}>Voltar aos golpes</button></div>`;
      return;
    }
    const noPP = P.moves.every(m => m.ppLeft <= 0);
    a.innerHTML = `<div class="moves">${noPP ? `<button class="mv" style="--c:#A8A77A" data-act="move" data-v="-1" ${dis}><b>Struggle</b><small>Sem PP: ataque desesperado com recuo.</small></button>`
      : P.moves.map((m, i) => `<button class="mv" style="--c:${TC[m.type] || '#888'}" data-act="move" data-v="${i}" ${dis || m.ppLeft <= 0 ? 'disabled' : ''} title="${esc(m.desc)}"><b>${esc(fmt(m.name))}</b><small>${TYPE_PT[m.type] || m.type}, ${CLS_PT[m.cls]}, poder ${m.power ?? '—'}</small><span class="pp">PP ${m.ppLeft}/${m.pp}</span></button>`).join('')}</div>
      <div class="subrow"><button class="btn ghost" data-act="panel" data-v="bag" ${dis}>Mochila</button><button class="btn ghost" data-act="run" ${dis}>Fugir</button></div>`;
  } else if (G.panel === 'shop') {
    const forSale = Object.entries(ITEMS).filter(([, it]) => it.price);
    a.innerHTML = `<div class="bag-grid">${forSale.map(([k, it]) => `<button class="item-btn" data-act="buy" data-v="${k}" ${dis || S.money < it.price ? 'disabled' : ''} title="${esc(it.desc)}"><img src="${ITEM_SPR(k)}" alt="" onerror="this.style.visibility='hidden'"><span>${it.name}</span><small>₽${it.price}</small></button>`).join('')}</div>
      <div class="subrow"><button class="btn ghost" data-act="panel" data-v="main">Sair da loja</button></div>`;
  } else {
    a.innerHTML = `<button class="btn big" data-act="explore" ${dis}>Explorar ${zone().name}</button>
      <button class="btn ghost" data-act="heal" ${dis}>Descansar no Centro Pokémon</button>
      <button class="btn ghost" data-act="panel" data-v="shop" ${dis}>Abrir loja</button>`;
  }
}
export function render() {
  if (G.mode === 'create' || !G.S) return;
  renderSheet(); renderScene(); renderActions();
  $('#topr').innerHTML = `<span>₽${G.S.money}</span><button class="btn ghost sm" data-act="new">Novo jogo</button>`;
}
export function buildGame() {
  $('#app').innerHTML = `<main class="game"><aside id="sheet" class="sheet"></aside>
    <section class="stage"><div id="scene" class="scene"></div>
      <div class="textbox"><div id="log" class="log" aria-live="polite"></div></div>
      <div id="actions" class="actions"></div></section></main>`;
  render();
}
