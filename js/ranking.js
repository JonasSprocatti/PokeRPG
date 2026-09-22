/* ============ ranking global (tela) ============ */
// Melhor jornada de cada jogador — geral ou por espécie (funções `ranking`/`especies_ranqueadas` no schema.sql;
// a pontuação é recalculada no servidor). Dá pra ver sem conta; pra aparecer, precisa entrar e terminar jornadas.
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { DIFICULDADES } from './dados.js';
import { buscarRanking, especiesRanqueadas, nuvemConfigurada, usuario } from './nuvem.js';
import { esc, fmt, offline } from './util.js';

let especieAtual = null; // null = geral; sobrevive a sair e voltar da tela

export async function telaRanking(especie = especieAtual) {
  especieAtual = especie || null;
  G.mode = 'ranking'; limparTopo();
  const casca = corpo => `<main class="create">
    <h1>Ranking.</h1>
    <p class="lead">A melhor jornada de cada jogador, ${especieAtual ? `com <b>${esc(fmt(especieAtual))}</b>` : 'com qualquer Pokémon'}. A pontuação é conferida no servidor.</p>
    ${corpo}
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">Voltar</button></div></main>`;
  if (!nuvemConfigurada()) { $('#app').innerHTML = casca('<div class="notice">O ranking precisa do modo online, que ainda não foi configurado neste site (<code>js/config.js</code>).</div>'); return; }
  if (offline()) { $('#app').innerHTML = casca('<div class="notice">📴 Sem internet: o ranking aparece quando a conexão voltar.</div>'); return; }
  $('#app').innerHTML = casca('<p class="loading">Carregando o ranking…</p>');
  try {
    const [linhas, especies] = await Promise.all([buscarRanking(especieAtual), especiesRanqueadas()]);
    if (G.mode !== 'ranking') return; // saiu da tela enquanto carregava
    const eu = linhas.find(l => l.eu);
    const seletor = `<label class="campo">Pokémon
      <select data-ranking-especie>
        <option value="">Geral (todas as espécies)</option>
        ${especies.map(e => `<option value="${esc(e.especie)}" ${e.especie === especieAtual ? 'selected' : ''}>${esc(fmt(e.especie))} (${e.jogadores})</option>`).join('')}
      </select></label>`;
    const aviso = !usuario() ? '<p class="small muted">Você está vendo sem conta. <button class="btn ghost sm" data-act="conta">👤 Entrar</button> pra suas jornadas entrarem no ranking.</p>'
      : eu ? `<p class="selo-recorde">Você está em ${eu.posicao}º${especieAtual ? ` com ${esc(fmt(especieAtual))}` : ''}!</p>`
      : `<p class="small muted">Você ainda não aparece aqui${linhas.length >= 50 ? ' (entre os 50 primeiros)' : ''}. Termine jornadas pra entrar.</p>`;
    const tabela = linhas.length ? `<table class="ranking">
      <thead><tr><th>#</th><th>Jogador</th>${especieAtual ? '' : '<th>Pokémon</th>'}<th>Nível</th><th>Modo</th><th>Pontos</th></tr></thead>
      <tbody>${linhas.map(l => `<tr class="${l.eu ? 'eu' : ''}">
        <td class="pos">${l.posicao <= 3 ? ['🥇', '🥈', '🥉'][l.posicao - 1] : l.posicao + 'º'}</td>
        <td>${esc(l.apelido)}${l.eu ? ' <small>(você)</small>' : ''}</td>
        ${especieAtual ? '' : `<td>${esc(fmt(l.especie))}</td>`}
        <td>${l.nivel}</td><td>${DIFICULDADES[l.dificuldade]?.nome || esc(l.dificuldade)}</td>
        <td class="pts">${l.pontuacao.toLocaleString('pt-BR')}</td></tr>`).join('')}</tbody></table>`
      : '<p class="muted">Ninguém no ranking ainda. Seja o primeiro!</p>';
    $('#app').innerHTML = casca(seletor + aviso + tabela);
  } catch (e) {
    console.error(e);
    if (G.mode === 'ranking') $('#app').innerHTML = casca(`<div class="notice">Não consegui carregar o ranking: ${esc(e.message || String(e))}. Se o site acabou de ganhar o ranking, quem publica precisa rodar de novo o <code>supabase/schema.sql</code>.</div>`);
  }
}
