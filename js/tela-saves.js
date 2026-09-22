/* ============ tela: 💾 jornadas salvas ============ */
// Lista a jornada atual e as guardadas (saves.js), com continuar / guardar / excluir. Os cliques (data-act
// save-continuar, save-guardar, save-excluir) são tratados em main.js, que sabe abrir uma jornada.
import { G, SAVE_KEY } from './estado.js';
import { $, limparTopo } from './ui.js';
import { SPR, SPR_SHINY, DIFICULDADES } from './dados.js';
import { dadosDaGen } from './mapas.js';
import { listaGuardadas, resumoSave, MAX_GUARDADAS } from './saves.js';
import { barraTelas, rotuloVoltar } from './navegacao.js';
import { esc, fmt, store } from './util.js';

const quando = t => t ? new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
function cartao(S, atual) {
  const r = resumoSave(S), sprite = r.pokeId ? (r.shiny ? SPR_SHINY(r.pokeId) : SPR(r.pokeId)) : '';
  return `<div class="save-card ${atual ? 'atual' : ''}">
    ${sprite ? `<img src="${sprite}" alt="" loading="lazy">` : '<span></span>'}
    <div><b>${r.shiny ? '✨ ' : ''}${esc(fmt(r.nome))}</b>${atual ? ' <span class="tag-atual">jogando agora</span>' : ''}
      <small>${esc(fmt(r.especie))} · Nv. ${r.nivel} · ${DIFICULDADES[r.dificuldade]?.nome || r.dificuldade} · Gen ${r.gen} (${dadosDaGen(r.gen).regiao}) · ₽${r.dinheiro.toLocaleString('pt-BR')}</small>
      <small class="muted">salva em ${quando(r.salvoEm)}</small></div>
    <div class="save-acoes">${atual
      ? `<button class="btn sm" data-act="voltar">Continuar jogando</button><button class="btn ghost sm" data-act="save-guardar" title="Tira da frente sem perder nada; dá pra continuar depois">Guardar</button>`
      : `<button class="btn sm" data-act="save-continuar" data-v="${esc(r.id)}">Continuar</button><button class="btn ghost sm" data-act="save-excluir" data-v="${esc(r.id)}" data-nome="${esc(fmt(r.nome))}">Excluir</button>`}</div>
  </div>`;
}
export function telaSaves(msg = '') {
  G.mode = 'saves'; limparTopo();
  const atual = G.S || store.get(SAVE_KEY), lista = listaGuardadas().filter(S => S.id !== atual?.id);
  $('#app').innerHTML = `<main class="create">
    ${barraTelas('saves')}
    <h1>Jornadas salvas.</h1>
    <p class="lead">Suas runs em andamento. Guarde uma pra começar outra sem perder nada, e volte nela quando quiser. Com conta, elas ficam na nuvem e aparecem em qualquer aparelho. Até ${MAX_GUARDADAS} guardadas.</p>
    ${msg ? `<div class="notice">${msg}</div>` : ''}
    <div class="saves">
      ${atual?.player ? cartao(atual, true) : ''}
      ${lista.map(S => cartao(S, false)).join('')}
      ${!atual?.player && !lista.length ? '<p class="muted">Nenhuma jornada em andamento.</p>' : ''}
    </div>
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">${rotuloVoltar()}</button></div></main>`;
}
