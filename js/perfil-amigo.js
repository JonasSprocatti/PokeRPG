/* ============ perfil de um amigo ============
   Tela aberta pelo botão "👤 Ver perfil" da lista de amigos (👤 Conta): ícone, insígnias (a exibida, a do Alpha e as dos chefes
   semanais), números das jornadas e as últimas 5 runs. Os dados vêm da função `perfil_do_amigo` do banco (só amigos, ou você mesmo;
   supabase/migrations/20260925150000_perfil_do_amigo.sql) — nada que dê pra usar contra a pessoa: sem e-mail, sem mochila.
   As contas puras (números, insígnias, rótulo da run, "desde quando") moram em perfil-dados.js (tests/perfil-amigo.test.js). */
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { barraTelas } from './navegacao.js';
import { SPR, SPR_SHINY, DIFICULDADES } from './dados.js';
import { ehJogadorAlpha, htmlInsigniaAlpha } from './alpha.js';
import { perfilDoAmigo, usuario, nuvemConfigurada } from './nuvem.js';
import { htmlIcone, htmlInsigniaDe } from './conta.js';
import { esc, fmt, offline } from './util.js';

import { numerosDoPerfil, insigniasDoPerfil, rotuloDaRun, desdeQuando, n } from './perfil-dados.js';

function htmlPerfil(p, eu) {
  const alpha = ehJogadorAlpha(p.criado_em), insignias = insigniasDoPerfil(p.eventos), ganhas = insignias.filter(i => i.ganha);
  const run = r => `<li class="run-perfil"><img src="${r.poke_id ? (r.shiny === 'true' ? SPR_SHINY(r.poke_id) : SPR(r.poke_id)) : SPR(25)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${SPR(25)}'">
      <div><b>${r.shiny === 'true' ? '✨ ' : ''}${esc(fmt(r.especie))}${r.especie_final && r.especie_final !== r.especie ? ` → ${esc(fmt(r.especie_final))}` : ''}</b> <span class="muted small">Nv. ${n(r.nivel)}</span>
        <small class="muted">${esc(DIFICULDADES[r.dificuldade]?.nome || r.dificuldade)} · ${esc(rotuloDaRun(r))} · ${n(r.pontuacao)} pts · ${new Date(r.terminou_em).toLocaleDateString('pt-BR')}</small></div></li>`;
  return `<section class="pv conta perfil-topo"><div class="perfil-cab">
      ${htmlIcone({ id: p.icone_id, shiny: p.icone_shiny }, 'icone-grande')}
      <div><h2>${esc(p.apelido)}${htmlInsigniaDe(p.badge_exibida)}${alpha ? `<span class="alpha-mini" title="Treinador do Alpha">${htmlInsigniaAlpha({ compacto: true })}</span>` : ''}${eu ? ' <small class="muted">(você)</small>' : ''}</h2>
        <p class="muted small">Jogando desde ${esc(desdeQuando(p.criado_em)) || '—'}${alpha ? ' · <b>Treinador do Alpha</b>' : ''}</p></div></div></section>
    <section class="pv conta"><div><h3>Números</h3>
      <div class="stats-fim">${numerosDoPerfil(p).map(([l, v]) => `<div class="stat-fim"><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}</div></div></section>
    <section class="pv conta"><div><h3>Insígnias de evento <span class="muted small">(${ganhas.length}/${insignias.length})</span></h3>
      <ul class="insignias">${insignias.map(i => `<li class="insignia ${i.ganha ? 'ganha' : 'bloqueada'}"><span class="insignia-icone" aria-hidden="true">${i.icone}</span>
        <div><b>${esc(i.nome)}</b> ${i.ganha ? `<span class="muted small">título: ${esc(i.titulo)}</span>` : '<span class="muted small">🔒 ainda não</span>'}</div></li>`).join('')}</ul></div></section>
    <section class="pv conta"><div><h3>Últimas runs</h3>
      ${(p.ultimas || []).length ? `<ul class="runs-perfil">${p.ultimas.map(run).join('')}</ul>` : '<p class="small muted">Ainda não terminou nenhuma jornada.</p>'}</div></section>`;
}

export async function telaPerfil(idAmigo) {
  G.mode = 'perfil'; limparTopo();
  const casca = corpo => `<main class="create perfil">${barraTelas('conta')}<h1>Perfil.</h1>${corpo}
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="conta">← Voltar à conta</button></div></main>`;
  if (!nuvemConfigurada() || !usuario()) { $('#app').innerHTML = casca('<div class="notice">Entre na conta pra ver perfis.</div>'); return; }
  if (offline()) { $('#app').innerHTML = casca('<div class="notice">📴 Sem internet: o perfil aparece quando a conexão voltar.</div>'); return; }
  $('#app').innerHTML = casca('<p class="loading">Carregando o perfil…</p>');
  try {
    const p = await perfilDoAmigo(idAmigo);
    if (G.mode !== 'perfil') return;   // saiu da tela enquanto carregava
    $('#app').innerHTML = casca(p ? htmlPerfil(p, idAmigo === usuario()?.id) : '<div class="notice">Não encontrei esse perfil.</div>');
  } catch (e) {
    console.error(e);
    if (G.mode === 'perfil') $('#app').innerHTML = casca(`<div class="notice">Não consegui carregar o perfil: ${esc(e.message || String(e))}.
      ${/perfil_do_amigo|function/i.test(e.message || '') ? 'Quem publica o jogo precisa rodar a migração <code>20260925150000_perfil_do_amigo.sql</code> no Supabase.' : ''}</div>`);
  }
}
