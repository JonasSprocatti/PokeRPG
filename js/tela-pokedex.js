/* ============ tela: 📖 Pokédex ============
   A Pokédex nacional da CONTA: as 1025 espécies, as que você já conhece com sprite e nome, as outras como "?".
   Pedido do usuário: "a partir do momento que você libera ele pra jogar, consegue ver as coisas do poke".
   Só quem você já encontrou abre a ficha — atributos, tipos, habilidades e onde aparece no mundo.
   A ficha detalhada vem do cache da PokéAPI (api.loadPokemon): já baixada, funciona offline; nunca vista, precisa
   de rede uma vez. O grid em si não depende de rede nenhuma: o sprite sai do id. */
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { barraTelas } from './navegacao.js';
import { carregarCarreira } from './carreira.js';
import { pokedexDaConta, ondeAparece, TOTAL_DEX, ESTADOS } from './pokedex-conta.js';
import { SPR, STATS, STAT_PT, TYPE_PT, TC, DARK_TEXT } from './dados.js';
import { loadPokemon, loadAbility } from './api.js';
import { textoTaxa } from './mapas.js';
import { esc, fmt, offline } from './util.js';

let dex = null;   // { porId, porNome, conhecidas } da última abertura — o clique numa célula consulta daqui

const n = v => (v || 0).toLocaleString('pt-BR');
const tipoSelo = t => `<span class="ty" style="--c:${TC[t] || '#888'};--tc:${DARK_TEXT.has(t) ? '#1c1f3a' : '#fff'}">${TYPE_PT[t] || fmt(t)}</span>`;

export function telaPokedex() {
  G.mode = 'fim'; limparTopo();
  dex = pokedexDaConta(carregarCarreira().jornadas, G.S?.registro);
  const celulas = [];
  for (let id = 1; id <= TOTAL_DEX; id++) {
    const e = dex.porId.get(id);
    celulas.push(e
      ? `<button class="dexc ${e.estado}" data-act="dex-ver" data-v="${id}" title="${esc(fmt(e.especie))}">
          <img src="${SPR(id)}" alt="" loading="lazy"><b>${esc(fmt(e.especie))}</b><small>#${id}</small></button>`
      : `<div class="dexc nunca" title="Ainda não encontrado"><span>?</span><small>#${id}</small></div>`);
  }
  const amigos = [...dex.porId.values()].filter(e => e.estado === ESTADOS.amigo).length;
  const derrotados = [...dex.porId.values()].filter(e => e.estado === ESTADOS.derrotado).length;
  $('#app').innerHTML = `<main class="create">
    ${barraTelas('pokedex')}
    <h1>Pokédex.</h1>
    <p class="lead">Tudo o que a sua conta já encontrou, somando a carreira inteira e a jornada em andamento.
      Toque em quem você conhece pra ver a ficha completa — atributos, tipos, habilidades e onde ele aparece no mundo.</p>
    <div class="stats-fim">
      <div class="stat-fim"><span>Conhecidos</span><b>${n(dex.conhecidas)}</b><small>de ${n(TOTAL_DEX)}</small></div>
      <div class="stat-fim"><span>Derrotados</span><b>${n(derrotados)}</b><small>espécies</small></div>
      <div class="stat-fim"><span>Amigos</span><b>${n(amigos)}</b><small>espécies recrutadas</small></div>
    </div>
    <div id="dex-ficha"></div>
    <div class="dex-grade">${celulas.join('')}</div>
  </main>`;
}

/* Abrir a Pokédex JÁ na ficha de uma espécie — é o que o clique na Pokédex da rota faz (render.js).
   Precisa passar por `telaPokedex()` antes: é ela que monta o `#dex-ficha` onde a ficha é escrita e que carrega
   o `dex` do módulo. Chamar `verNaPokedex` direto de outra tela não acharia nem um nem outro. */
export function abrirNaPokedex(id) {
  telaPokedex();
  return verNaPokedex(id);
}

// clique numa espécie conhecida (main.js: data-act="dex-ver")
export async function verNaPokedex(id) {
  const alvo = $('#dex-ficha'); if (!alvo) return;
  const e = dex?.porId.get(+id); if (!e) return;
  alvo.innerHTML = `<section class="dex-ficha"><p class="muted">Abrindo a ficha de ${esc(fmt(e.especie))}…</p></section>`;
  alvo.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  let d = null;
  try { d = await loadPokemon(+id); }
  catch {
    alvo.innerHTML = `<section class="dex-ficha"><h3>${esc(fmt(e.especie))}</h3>
      <p class="small muted">${offline() ? 'Sem internet, e esta espécie ainda não está guardada neste aparelho.' : 'Não deu pra buscar a ficha agora.'}
      Baixe o mapa dela em ⚙ Ajustes → Jogar offline, ou tente de novo com conexão.</p>${htmlOnde(+id)}</section>`;
    return;
  }
  const hab = d.abilities.map(a => `<li><b>${esc(fmt(a.name))}</b>${a.hidden ? ' <small class="muted">(oculta)</small>' : ''} <span data-hab="${esc(a.name)}" class="muted small">…</span></li>`).join('');
  alvo.innerHTML = `<section class="dex-ficha">
    <div class="dex-ficha-topo">
      <img src="${SPR(+id)}" alt="">
      <div>
        <h3>#${id} ${esc(fmt(e.especie))}</h3>
        <div class="chips">${d.types.map(tipoSelo).join('')}</div>
        <p class="small muted">Você já viu <b>${n(e.vistos)}</b>, derrotou <b>${n(e.derrotados)}</b> e recrutou <b>${n(e.amigos)}</b>.</p>
      </div>
    </div>
    <table class="stats"><thead><tr><th>Atributo</th><th>Base</th></tr></thead><tbody>
      ${STATS.map(s => `<tr><td>${STAT_PT[s]}</td><td>${d.base[s]}</td></tr>`).join('')}
      <tr><td><b>Total</b></td><td><b>${STATS.reduce((a, s) => a + d.base[s], 0)}</b></td></tr>
    </tbody></table>
    <h4>Habilidades</h4><ul class="quase">${hab}</ul>
    ${htmlOnde(+id)}
  </section>`;
  // as descrições das habilidades vêm uma a uma (cada uma é uma busca própria, e o cache guarda)
  for (const a of d.abilities) {
    try { const info = await loadAbility(a); const el = alvo.querySelector(`[data-hab="${CSS.escape(a.name)}"]`); if (el) el.textContent = info.effect; }
    catch { /* sem rede: fica sem a descrição, o resto da ficha continua valendo */ }
  }
}

// onde a espécie aparece no mundo (pokedex-conta.ondeAparece): rotas, Alfa e luta final
function htmlOnde(id) {
  const onde = ondeAparece(id);
  if (!onde.length) return '<p class="small muted">Não aparece em nenhuma rota — só no Santuário da Gen dele, se houver.</p>';
  const linha = o => o.alfa ? `<li>⚔ <b>Alfa</b> de ${esc(o.rota)} (Gen ${o.gen}) · Nv. ${o.min}</li>`
    : o.lendario ? `<li>⚡ <b>Luta final</b> de ${esc(o.regiao)} (Gen ${o.gen}) · Nv. ${o.min}</li>`
    : `<li>${o.santuario ? '🏛 ' : ''}${esc(o.rota)} (Gen ${o.gen}) · Nv. ${o.min}–${o.max} · ${textoTaxa(o.taxa)} dos encontros</li>`;
  return `<h4>Onde aparece</h4><ul class="dex-onde">${onde.map(linha).join('')}</ul>`;
}
