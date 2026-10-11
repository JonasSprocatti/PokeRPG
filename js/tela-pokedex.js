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
import { pokedexDaConta, ondeAparece, temShiny, TOTAL_DEX, ESTADOS } from './pokedex-conta.js';
import { progressoRoguelike, textoProgresso } from './roguelike.js';
import { SPR, SPR_SHINY, STATS, STAT_PT, TYPE_PT, TC, DARK_TEXT } from './dados.js';
import { loadPokemon, loadAbility } from './api.js';
import { CHANCE_SHINY } from './regras.js';   // o "1 em 4096" da tela sai da constante do sorteio, nunca digitado
import { textoTaxa } from './mapas.js';
import { esc, fmt, offline } from './util.js';

let dex = null;   // { porId, porNome, conhecidas } da última abertura — o clique numa célula consulta daqui
/* ✨ Pokédex shiny: a MESMA tela com outro critério de "conhecido" (pedido do usuário, 11/10/2026). Uma segunda
   tela seria a mesma grade, a mesma ficha e a mesma navegação duplicadas pra trocar uma condição e o endereço
   do sprite — é um modo, não uma tela. Mora no módulo (e não em G) porque é preferência de visualização: não
   entra no save, e abrir a Pokédex de novo na mesma sessão mantém onde você estava. */
let soShiny = false;

const n = v => (v || 0).toLocaleString('pt-BR');
const tipoSelo = t => `<span class="ty" style="--c:${TC[t] || '#888'};--tc:${DARK_TEXT.has(t) ? '#1c1f3a' : '#fff'}">${TYPE_PT[t] || fmt(t)}</span>`;

// o botão que troca entre a Pokédex normal e a ✨ shiny (main.js: data-act="dex-modo")
export function alternarDexShiny() { soShiny = !soShiny; telaPokedex(); }

export function telaPokedex() {
  G.mode = 'fim'; limparTopo();
  dex = pokedexDaConta(carregarCarreira().jornadas, G.S?.registro);
  // o que acende a célula: na dex normal é ter encontrado; na shiny, ter encontrado BRILHANDO
  const achou = e => (soShiny ? temShiny(e) : !!e);
  const sprite = soShiny ? SPR_SHINY : SPR;
  const celulas = [];
  for (let id = 1; id <= TOTAL_DEX; id++) {
    const e = dex.porId.get(id);
    celulas.push(achou(e)
      ? `<button class="dexc ${soShiny ? 'brilhou' : e.estado}" data-act="dex-ver" data-v="${id}" title="${esc(fmt(e.especie))}">
          <img src="${sprite(id)}" alt="" loading="lazy"><b>${esc(fmt(e.especie))}</b><small>#${id}</small></button>`
      : `<div class="dexc nunca" title="${soShiny ? 'Nunca visto shiny' : 'Ainda não encontrado'}"><span>?</span><small>#${id}</small></div>`);
  }
  const amigos = [...dex.porId.values()].filter(e => e.estado === ESTADOS.amigo).length;
  const derrotados = [...dex.porId.values()].filter(e => e.estado === ESTADOS.derrotado).length;
  $('#app').innerHTML = `<main class="create">
    ${barraTelas('pokedex')}
    <h1>${soShiny ? '✨ Pokédex shiny.' : 'Pokédex.'}</h1>
    <p class="lead">${soShiny
      ? `As espécies que você já viu <b>brilhando</b>, somando a carreira inteira e a jornada em andamento.
         Um shiny aparece a cada ${n(1 / CHANCE_SHINY)} encontros, então esta grade enche devagar — e é esse o ponto.`
      : `Tudo o que a sua conta já encontrou, somando a carreira inteira e a jornada em andamento.
         Toque em quem você conhece pra ver a ficha completa — atributos, tipos, habilidades e onde ele aparece no mundo.`}</p>
    <p><button class="${soShiny ? 'btn' : 'btn ghost'}" data-act="dex-modo">${soShiny ? '📖 Ver a Pokédex normal' : '✨ Ver só os shinies'}</button></p>
    <div class="stats-fim">
      ${soShiny ? `
      <div class="stat-fim"><span>Espécies shiny</span><b>${n(dex.especiesShiny)}</b><small>de ${n(TOTAL_DEX)}</small></div>
      <div class="stat-fim"><span>Encontrados</span><b>${n(dex.shiniesVistos)}</b><small>shinies no total</small></div>
      <div class="stat-fim"><span>Recrutados</span><b>${n(dex.shiniesAmigos)}</b><small>viraram seus</small></div>` : `
      <div class="stat-fim"><span>Conhecidos</span><b>${n(dex.conhecidas)}</b><small>de ${n(TOTAL_DEX)}</small></div>
      <div class="stat-fim"><span>Derrotados</span><b>${n(derrotados)}</b><small>espécies</small></div>
      <div class="stat-fim"><span>Amigos</span><b>${n(amigos)}</b><small>espécies recrutadas</small></div>`}
    </div>
    ${soShiny && dex.especiesShiny ? '' : soShiny
      ? '<p class="small muted">Nenhum shiny ainda. Eles aparecem sozinhos, em qualquer encontro — e o 🎯 Caça Shiny existe pra forçar a sorte numa espécie só.</p>' : ''}
    ${soShiny ? '<p class="small muted">Shiny encontrado antes de 11/10/2026 só está aqui se você o <b>recrutou</b>: até então a jornada não levava os encontros brilhantes pra carreira, só os que viraram seus.</p>' : ''}
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
  const spr = soShiny ? SPR_SHINY : SPR;
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
      <img src="${spr(+id)}" alt="">
      <div>
        <h3>${soShiny ? '✨ ' : ''}#${id} ${esc(fmt(e.especie))}</h3>
        <div class="chips">${d.types.map(tipoSelo).join('')}</div>
        <p class="small muted">Você já viu <b>${n(e.vistos)}</b>, derrotou <b>${n(e.derrotados)}</b> e recrutou <b>${n(e.amigos)}</b>.</p>
        ${temShiny(e) ? `<p class="small muted">✨ Shiny: encontrou <b>${n(e.shinies)}</b> e recrutou <b>${n(e.shiniesAmigos)}</b>.</p>` : ''}
        ${htmlRoguelike(e.especie)}
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

/* Progresso do desbloqueio pro Roguelike (roguelike.js): só conta abates/amizades/evoluções em jornadas
   ROGUELIKE — pode ser MENOR que o "derrotou N" da carreira inteira mostrado acima, porque abate em outro modo
   não conta pra esse desbloqueio. Bug relatado (27/09/2026, Rhydon): jogador via "derrotou 12" e achava que já
   passava dos 10 exigidos, sem saber que só 7 desses 12 vieram de jornadas Roguelike — os outros 5 foram no
   Difícil. Essa linha deixa a conta clara na hora, em vez de só na tela de Roguelike/Conquistas. */
function htmlRoguelike(especie) {
  const p = progressoRoguelike(carregarCarreira().jornadas).find(x => x.especie === especie);
  if (!p) return '';
  return p.desbloqueada
    ? `<p class="small muted">🔓 Desbloqueado pra escolher no início de uma jornada Roguelike (${esc(textoProgresso(p))}).</p>`
    : `<p class="small muted">Pro Roguelike (só conta o que foi feito EM jornadas Roguelike, pode ser menos que o total acima): ${esc(textoProgresso(p))}.</p>`;
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
