/* ============ render: jogo ============ */
// Re-render total a partir de G (sem diffing): ficha à esquerda, cena (zona ou batalha) + log + ações à direita.
import { G, zone, rotulo, dificuldadeDe, centroPokemon } from './estado.js';
import { $ } from './ui.js';
import { SPR, SPR_SHINY, SPR_SHINY_COSTAS, ITEM_SPR, BOLAS, DIFICULDADES, STATS, STAT_PT, STAGE_SHORT, TYPE_PT, TC, DARK_TEXT, CLS_PT, NATURES, IMPL, ST_SHORT, ITEMS, ZONES, MISSOES, ORDENS } from './dados.js';
import { natureLabel, MAX_ALIADOS, zonaLiberada, situacaoMissoes } from './regras.js';
import { syncGet, loadAbility } from './api.js';
import { htmlJogo, aplicarLayout, tituloPainel } from './paineis.js';
import { clamp, esc, fmt } from './util.js';

// sprite certo pro Pokémon (shiny ou não). Se o shiny não existir (formas raras), `onerror` cai no normal.
// Costas: Gen 8+ não tem sprite de costas — aí usa a frente espelhada (classe .flip).
export const spriteFrente = m => m.shiny ? SPR_SHINY(m.id) : m.data.sprite;
const sprCostas = m => m.data.back ? (m.shiny ? SPR_SHINY_COSTAS(m.id) : m.data.back) : null;
const imgMon = (m, cls, src) => `<img class="${cls}" src="${src}" alt="${esc(fmt(m.name))}${m.shiny ? ' (shiny)' : ''}" onerror="this.onerror=null;this.src='${m.data.sprite}'">`;
const brilho = m => m.shiny ? '<span class="shiny" title="Shiny">✨</span>' : '';

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
// barra de amizade (só aparece no selvagem depois do primeiro petisco)
const amizadeBar = m => m.amizade ? `<div class="hp amz" title="Amizade"><span>♥</span><div class="bar"><div class="fill" style="width:${clamp(m.amizade, 0, 100)}%"></div></div><span>${m.amizade}/100</span></div>` : '';
function plate(m) {
  const label = m === G.S.player || G.S.aliados?.includes(m) ? (m.nick || fmt(m.name)) : fmt(m.name);
  return `<div class="pl-top"><span>${brilho(m)}${esc(label)}</span><span>Nv. ${m.level}</span></div>${hpbar(m)}${amizadeBar(m)}${chipsFor(m)}`;
}
// barra no topo da batalha: número do turno + o que está acontecendo agora (lê G.B.vez, setado por turn())
function turnoBar(B, P, E) {
  const T = B.trainer;
  const fase = !G.busy ? 'Escolha sua ação'
    : B.vez === 'p' ? `${esc(rotulo(P))} está agindo`
    : B.vez === 'e' ? `${esc(rotulo(E))} está agindo`
    : B.vez === 't' ? `${esc(T.nome)} está mirando uma bola`
    : B.vez?.[0] === 'a' ? `${esc(rotulo(G.S.aliados[+B.vez.slice(1)]))} está agindo`
    : B.vez === 'fim' ? 'Fim do turno' : '…';
  // treinador: equipe (● em pé / ○ derrotado) e bolas que ainda restam
  const info = T ? `<span class="treinador" title="Pokémon e bolas do treinador">🎯 ${esc(T.nome)} <span class="equipe">${T.equipe.map((m, i) => i < T.atual || m.hp <= 0 ? '○' : '●').join('')}</span> <img src="${ITEM_SPR(T.bola)}" alt="${BOLAS[T.bola].nome}">×${T.bolas}</span>` : '';
  return `<div class="turno-bar"><span class="turno-n">Turno <b>${B.turn}</b></span>${info}<span class="turno-fase ${!G.busy ? 'sua-vez' : ''}">${fase}</span></div>`;
}
// contador de desmaios do Médio pra cima: "2/3 livres", depois "precisa de Revive (tem N)"
function desmaiosTxt(S) {
  const livres = DIFICULDADES[dificuldadeDe(S)].desmaiosLivres, n = S.desmaios || 0;
  if (livres == null) return '';
  return n < livres ? `<br>Desmaios: <b>${n}/${livres}</b> livres.`
    : `<br><span class="${S.bag.revive ? '' : 'err'}">Desmaios: <b>${n}</b>. O próximo gasta um Revive (você tem ${S.bag.revive || 0})${S.bag.revive ? '' : ': sem Revive é Game Over'}.</span>`;
}
/* peças da ficha, usadas pra você e pra cada aliado */
function barraXp(M, GR) {
  if (!GR) return '';
  const cur = M.exp - GR[M.level], need = M.level < 100 ? GR[M.level + 1] - GR[M.level] : 1;
  return `<div class="hp xp"><span>XP</span><div class="bar"><div class="fill" style="width:${M.level < 100 ? clamp(cur / need * 100, 0, 100) : 100}%"></div></div><span>${M.level < 100 ? `faltam ${GR[M.level + 1] - M.exp}` : 'máx.'}</span></div>`;
}
function tabelaStats(M) {
  const [up, down] = NATURES[M.nature] || [];
  return `<table class="stats">
      <thead><tr><th>Atributo</th><th>Valor</th><th>Base</th><th>IV</th><th>EV</th></tr></thead>
      <tbody>${STATS.map(s => `<tr><td>${STAT_PT[s]} ${s === up ? '<span class="up" title="Natureza">▲</span>' : s === down ? '<span class="down" title="Natureza">▼</span>' : ''}</td><td class="v">${M.stats[s]}</td><td>${M.data.base[s]}</td><td>${M.ivs[s]}</td><td>${M.evs[s]}</td></tr>`).join('')}</tbody>
    </table>`;
}
function blocoHabilidade(M) {
  const abInfo = M.data.abilities.find(a => a.name === M.ability), abDesc = syncGet('ab:' + M.ability)?.effect;
  if (!abDesc && abInfo) loadAbility(abInfo).then(() => { if (G.S) renderSheet(); }).catch(() => {});
  return `<div class="sec"><h3>Habilidade: ${esc(fmt(M.ability))}</h3>
      <p class="small muted">${esc(abDesc || 'Carregando descrição…')} ${IMPL.has(M.ability) ? '<span class="impl">✓ ativa no protótipo</span>' : '<em class="small">(ainda só descritiva)</em>'}</p></div>`;
}
const listaGolpes = M => `<div class="sec mlist"><h3>Golpes</h3>
      ${M.moves.map(m => `<details><summary><b>${esc(fmt(m.name))}</b><span class="pp">PP ${m.ppLeft}/${m.pp}</span><small>${badge(m.type)} ${CLS_PT[m.cls]}, poder ${m.power ?? '—'}, precisão ${m.acc ?? '—'}</small></summary><p>${esc(m.desc)}</p></details>`).join('')}
    </div>`;
// aliado: resumo + seletor de ordem + ficha completa num <details> (aberto/fechado sobrevive ao re-render via G.abertos)
function cartaoAliado(A, i) {
  const ordem = A.ordem || 'livre';
  return `<div class="aliado ${ordem === 'fora' ? 'descansando' : ''}">
    <div class="aliado-top">${imgMon(A, '', spriteFrente(A))}<div><b>${brilho(A)}${esc(rotulo(A))}</b> <span class="muted small">Nv. ${A.level}${ordem === 'fora' ? ' · descansando' : ''}</span><div class="types">${A.data.types.map(badge).join('')}</div>${hpbar(A)}${barraXp(A, A.growth)}${chipsFor(A)}</div></div>
    <label class="ordem">Ordem <select data-ordem="${i}" ${G.busy ? 'disabled' : ''}>${Object.entries(ORDENS).map(([k, o]) => `<option value="${k}" ${k === ordem ? 'selected' : ''}>${o.nome}</option>`).join('')}</select></label>
    <p class="small muted">${esc(ORDENS[ordem].desc)}</p>
    <details data-aliado="${i}" ${G.abertos.has(i) ? 'open' : ''}><summary>Ver ficha completa</summary>
      ${tabelaStats(A)}<p class="small muted" style="margin-top:6px">Natureza ${esc(natureLabel(A.nature))}.</p>${blocoHabilidade(A)}${listaGolpes(A)}
    </details>
    ${G.mode === 'explore' ? `<button class="btn ghost sm" data-act="despedir" data-v="${i}" ${G.busy ? 'disabled' : ''}>Despedir</button>` : ''}
  </div>`;
}
// Conteúdo de cada painel (as caixas e o lugar delas são de paineis.js). Títulos com número vão pro cabeçalho.
function renderFicha() {
  const S = G.S, P = S.player;
  tituloPainel('ficha', `${brilho(P)}${esc(P.nick || fmt(P.name))}`);
  $('#p-ficha').innerHTML = `
    <div class="me">
      ${imgMon(P, '', spriteFrente(P))}
      <div>
        <h2>${brilho(P)}${esc(P.nick || fmt(P.name))}</h2>
        <p class="sub">${P.nick ? esc(fmt(P.name)) + ', ' : ''}nível ${P.level}</p>
        <div class="types">${P.data.types.map(badge).join('')}</div>
      </div>
    </div>
    <div class="bars">
      ${hpbar(P)}
      ${barraXp(P, S.meta.growth)}
      ${chipsFor(P)}
    </div>
    ${tabelaStats(P)}
    <p class="small muted" style="margin-top:6px">Natureza ${esc(natureLabel(P.nature))}. Vitórias: ${S.wins || 0}${S.treinadoresVencidos ? `, ${S.treinadoresVencidos} treinador${S.treinadoresVencidos > 1 ? 'es' : ''}` : ''}.<br>Modo <b title="${esc(DIFICULDADES[dificuldadeDe(S)].desc)}">${DIFICULDADES[dificuldadeDe(S)].nome}</b>${S.capturas ? ` · capturado ${S.capturas}×` : ''}.${desmaiosTxt(S)}</p>
    ${blocoHabilidade(P)}
    ${listaGolpes(P)}`;
}
function renderMissoes() {
  const MS = situacaoMissoes(MISSOES, G.S);
  tituloPainel('missoes', `Missões <span class="muted small">(${MS.feitas} concluída${MS.feitas === 1 ? '' : 's'})</span>`);
  $('#p-missoes').innerHTML = `
      ${[...MS.ativas, ...MS.prontas].map(({ m, atual, alvo }) => `<div class="missao"><b>${esc(m.nome)}</b><small>${esc(m.desc)}</small><div class="hp mis"><span></span><div class="bar"><div class="fill" style="width:${atual / alvo * 100}%"></div></div><span>${atual}/${alvo}</span></div></div>`).join('') || '<p class="small muted">Nenhuma missão ativa agora.</p>'}
      ${MS.escondidas ? `<p class="small muted">🔒 ${MS.escondidas} ainda escondida${MS.escondidas === 1 ? '' : 's'}: aparecem conforme você derrota, faz amigos e vence Alfas.</p>` : ''}`;
}
function renderAliados() {
  const AL = G.S.aliados || [];
  tituloPainel('aliados', `Aliados <span class="muted small">(${AL.length}/${MAX_ALIADOS})</span>`);
  $('#p-aliados').innerHTML = AL.length ? `<div class="aliados">${AL.map(cartaoAliado).join('')}</div>`
    : '<p class="small muted">Ninguém ainda. Em batalha contra um selvagem, abra a Mochila e ofereça um petisco que o tipo dele goste.</p>';
}
function renderMochila() {
  const S = G.S, bag = Object.entries(S.bag).filter(([k, n]) => n > 0 && ITEMS[k]);
  $('#p-mochila').innerHTML = bag.length ? `<ul class="bag">${bag.map(([k, n]) => `<li><img src="${ITEM_SPR(k)}" alt="" onerror="this.style.visibility='hidden'"><span><b>${ITEMS[k].name}</b> ×${n}<small>${ITEMS[k].desc}</small></span>${G.mode === 'explore' && !ITEMS[k].battle && !ITEMS[k].afinidade ? `<button class="btn ghost sm" data-act="item" data-v="${k}" ${G.busy ? 'disabled' : ''}>Usar</button>` : ''}</li>`).join('')}</ul>` : '<p class="small muted">Vazia. Explore para achar itens ou passe na loja.</p>';
}
// nome antigo mantido: blocoHabilidade() chama renderSheet quando a descrição da habilidade chega da API
function renderSheet() { renderFicha(); renderMissoes(); renderAliados(); renderMochila(); }
function renderScene() {
  const sc = $('#scene');
  if (G.mode === 'battle' && G.B) {
    const E = G.B.enemy, P = G.S.player;
    sc.className = 'scene battle';
    // aliado descansando (ordem "fora") não aparece em campo; o índice `i` continua sendo o de S.aliados (ids mon-a{i})
    const B = G.B, AL = (G.S.aliados || []).map((A, i) => [A, i]).filter(([A]) => A.ordem !== 'fora');
    sc.innerHTML = `${turnoBar(B, P, E)}
      <div class="side foe"><div class="plate ${B.vez === 'e' ? 'agindo' : ''}">${plate(E)}</div>
        <div class="mon ${E.hp <= 0 ? 'fainted' : ''}" id="mon-e"><div class="pad"></div>${imgMon(E, 'spr', spriteFrente(E))}</div></div>
      <div class="side me">
        <div class="mons-lado">
          <div class="mon ${P.hp <= 0 ? 'fainted' : ''}" id="mon-p"><div class="pad"></div>${imgMon(P, `spr back ${sprCostas(P) ? '' : 'flip'}`, sprCostas(P) || spriteFrente(P))}</div>
          ${AL.map(([A, i]) => `<div class="mon mini ${A.hp <= 0 ? 'fainted' : ''}" id="mon-a${i}"><div class="pad"></div>${imgMon(A, `spr ${sprCostas(A) ? '' : 'flip'}`, sprCostas(A) || spriteFrente(A))}</div>`).join('')}
        </div>
        <div class="plates">
          <div class="plate ${B.vez === 'p' ? 'agindo' : ''}">${plate(P)}</div>
          ${AL.map(([A, i]) => `<div class="plate mini ${B.vez === 'a' + i ? 'agindo' : ''}">${plate(A)}</div>`).join('')}
        </div></div>`;
  } else {
    const z = zone(), nv = G.S.player.level, c = z.chefe, venceu = !!G.S.chefes?.[z.id];
    sc.className = 'scene';
    // zona bloqueada: chip desativado com 🔒 e o nível pedido
    const chip = o => { const ok = zonaLiberada(o, nv);
      return `<button class="chip ${o.id === z.id ? 'on' : ''} ${ok ? '' : 'trancada'}" data-act="zone" data-v="${o.id}" ${G.busy || !ok ? 'disabled' : ''} title="${ok ? '' : `Liberada no nível ${o.libera}`}">${ok ? '' : '🔒 '}${o.name}<small>${ok ? (o.pool ? `${o.min}–${o.max}` : '±2') : `Nv. ${o.libera}`}</small></button>`; };
    sc.innerHTML = `
      <div class="zone-head"><h2>${z.name}</h2><p>${z.desc} ${z.pool ? `Pokémon entre os níveis ${z.min} e ${z.max}.` : ''}</p></div>
      <div class="zones">${ZONES.map(chip).join('')}</div>
      <div class="locals" aria-hidden="true">${z.pool ? z.pool.map(id => `<img src="${SPR(id)}" alt="">`).join('') : '<span class="muted">Qualquer um dos 1025 pode aparecer.</span>'}</div>
      ${c ? `<div class="chefe-box ${venceu ? 'vencido' : ''}"><img src="${SPR(c.id)}" alt=""><div><b>Alfa: ${c.nome}</b> <span class="muted">Nv. ${c.nivel}</span><small>${venceu ? '✓ Derrotado. Pode desafiar de novo pelo XP, sem prêmio.' : 'HP ×2 e +30% em todo o resto. Prêmio na primeira vitória.'}</small></div><button class="btn ${venceu ? 'ghost' : ''} sm" data-act="chefe" ${G.busy ? 'disabled' : ''}>⚔ Desafiar</button></div>` : ''}`;
  }
}
function renderActions() {
  const S = G.S, a = $('#actions'), dis = G.busy ? 'disabled' : '';
  if (G.mode === 'battle' && G.B) {
    const P = S.player;
    if (G.panel === 'bag') {
      const E = G.B.enemy, T = G.B.trainer;
      const items = Object.entries(S.bag).filter(([k, n]) => n > 0 && ITEMS[k] && !ITEMS[k].candy && !ITEMS[k].afinidade);
      const petiscos = Object.entries(S.bag).filter(([k, n]) => n > 0 && ITEMS[k]?.afinidade);
      // petisco: destaca os que o tipo do alvo gosta
      const gosta = k => E.data.types.some(t => ITEMS[k].afinidade.includes(t));
      const secPetisco = T ? '<p class="small muted">Pokémon de treinador tem dono: petiscos não funcionam aqui.</p>'
        : G.B.chefe ? '<p class="small muted">Um Alfa guarda o território: não aceita petiscos.</p>'
        : petiscos.length ? `<div class="bag-grid">${petiscos.map(([k, n]) => `<button class="item-btn ${gosta(k) ? 'gosta' : ''}" data-act="oferecer" data-v="${k}" ${dis} title="${esc(ITEMS[k].desc)}"><img src="${ITEM_SPR(k)}" alt="" onerror="this.style.visibility='hidden'"><span>Oferecer ${ITEMS[k].name}</span><small>×${n}${gosta(k) ? ' · ♥ ele gosta' : ''}</small></button>`).join('')}</div>`
        : '<p class="small muted">Sem petiscos. Compre na loja ou ache explorando.</p>';
      a.innerHTML = `<div class="bag-grid">${items.map(([k, n]) => `<button class="item-btn" data-act="item-b" data-v="${k}" ${dis}><img src="${ITEM_SPR(k)}" alt="" onerror="this.style.visibility='hidden'"><span>${ITEMS[k].name}</span><small>×${n}</small></button>`).join('') || '<p class="muted">Nada utilizável em batalha.</p>'}</div>
        <h4 class="bag-sec">Fazer amizade com ${esc(fmt(E.name))} <span class="muted">(${E.data.types.map(t => TYPE_PT[t]).join('/')})</span></h4>${secPetisco}
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
    // cada um da equipe que precisa de cura paga o próprio preço (grátis no Fácil) — ver centroPokemon()
    const { precisa, custo, cheio, vitorias } = centroPokemon(), semGrana = S.money < custo;
    // Médio: preço cheio riscado + quantas vitórias deram desconto
    const desconto = vitorias && custo < cheio ? ` <s>₽${cheio}</s> <small>(${vitorias} vitória${vitorias > 1 ? 's' : ''})</small>` : '';
    a.innerHTML = `<button class="btn big" data-act="explore" ${dis}>Explorar ${zone().name}</button>
      <button class="btn ghost" data-act="heal" ${dis || !precisa || semGrana ? 'disabled' : ''} title="${!precisa ? 'HP, PP e status já estão cheios' : semGrana ? 'Dinheiro insuficiente' : 'Restaura HP, PP e status de toda a equipe'}">Centro Pokémon${!precisa ? ' (todos saudáveis)' : `${custo ? ` · ₽${custo}` : ' · grátis'}${desconto}${semGrana ? ' (sem dinheiro)' : ''}`}</button>
      <button class="btn ghost" data-act="panel" data-v="shop" ${dis}>Abrir loja</button>`;
  }
}
export function render() {
  // só as telas de jogo têm painéis; nas outras (criação, carreira, conta, ranking, sala multiplayer) não desenha —
  // gainExp/useItem chamam render() e podem rodar fora da tela de jogo (ex.: recompensa do co-op)
  if (!['explore', 'battle'].includes(G.mode) || !G.S) return;
  renderSheet(); renderScene(); renderActions();
  $('#top-dinheiro').textContent = '₽' + G.S.money.toLocaleString('pt-BR'); // fora do menu ☰: sempre visível
  $('#topr').innerHTML = `${G.mode === 'explore' ? `<button class="btn ghost sm" data-act="mp" ${G.busy ? 'disabled' : ''}>👥 Multiplayer</button><button class="btn ghost sm" data-act="carreira" ${G.busy ? 'disabled' : ''}>📊 Carreira</button>` : ''}<button class="btn ghost sm" data-painel-acao="restaurar" title="Voltar os painéis pro layout padrão">↺ Layout</button><button class="btn ghost sm" data-act="new">Novo jogo</button>`;
}
// monta a tela do jogo (esqueleto de painéis de paineis.js), aplica o layout salvo e desenha
export function buildGame() {
  $('#app').innerHTML = htmlJogo();
  aplicarLayout();
  render();
}
