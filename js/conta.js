/* ============ conta (tela de login + botão no topo) ============ */
import { G } from './estado.js';
import { $ } from './ui.js';
import { nuvem, nuvemConfigurada, usuario } from './nuvem.js';
import { esc, offline } from './util.js';

const statusTxt = () => offline() ? '📴 offline: salvo neste aparelho, sobe quando a internet voltar'
  : ({ sincronizando: '⟳ sincronizando…', ok: '✓ salvo na nuvem', erro: '⚠ erro ao sincronizar', offline: '⟳ internet voltou, sincronizando…', ocioso: '' }[nuvem.status] || '');

// botão fixo no header (#conta-chip), fora do #topr (que cada tela reescreve). Offline aparece mesmo sem conta.
export function renderChipConta() {
  const el = $('#conta-chip'); if (!el) return;
  const selo = offline() ? '<span class="selo-offline" title="Sem internet: o jogo continua e salva neste aparelho">📴 offline</span>' : '';
  if (!nuvemConfigurada()) { el.innerHTML = selo; return; }
  const u = usuario();
  el.innerHTML = selo + (u
    ? `<button class="btn ghost sm" data-act="conta" title="${esc(statusTxt())}">👤 ${esc(nuvem.apelido || u.email || 'Conta')} ${nuvem.status === 'erro' ? '⚠' : nuvem.status === 'sincronizando' ? '⟳' : ''}</button>`
    : '<button class="btn sm" data-act="conta">👤 Entrar</button>');
  if (G.mode === 'conta') telaConta(); // atualiza a tela aberta quando o login/sync muda
}

export function telaConta(msg = '') {
  G.mode = 'conta'; $('#topr').innerHTML = '';
  const u = usuario();
  const corpo = !nuvemConfigurada()
    ? `<div class="notice">O login online ainda não foi configurado neste site. Quem publica o jogo precisa preencher <code>js/config.js</code> (passo a passo em <code>supabase/COMO-CONFIGURAR.md</code>). Enquanto isso, tudo fica salvo só neste navegador.</div>`
    : u ? `
      <section class="pv conta">
        <div>
          <p class="muted">Conectado como <b>${esc(u.email || '')}</b>.</p>
          <label class="campo">Apelido (aparece no ranking)<span class="subrow"><input id="apelido" maxlength="20" value="${esc(nuvem.apelido)}"><button class="btn" data-act="salvar-apelido">Salvar</button></span></label>
          <p>${esc(statusTxt())}${nuvem.status === 'erro' ? ` <span class="err">${esc(nuvem.erro || '')}</span>` : ''}</p>
          <p class="small muted">${nuvem.naNuvem} jornada(s) terminada(s) na sua conta${nuvem.ultimaSync ? `, última sincronização às ${nuvem.ultimaSync.toLocaleTimeString('pt-BR')}` : ''}. A jornada em andamento também é salva sozinha, e dá pra continuar em outro aparelho entrando com a mesma conta.</p>
          <div class="subrow"><button class="btn ghost" data-act="sincronizar">⟳ Sincronizar agora</button><button class="btn ghost" data-act="sair">Sair da conta</button></div>
        </div>
      </section>`
    : `
      <section class="pv conta">
        <div>
          <p>Entre pra guardar sua carreira (jornadas, Pokédex, shinies, recordes) e a jornada em andamento na nuvem, e continuar de qualquer aparelho. O que você já jogou neste navegador sobe pra conta no primeiro login.</p>
          <button class="btn big" data-act="entrar-google">Entrar com Google</button>
          <p class="muted" style="margin:18px 0 6px">ou receba um link de acesso por e-mail (sem senha):</p>
          <span class="subrow"><input id="email" type="email" placeholder="voce@email.com" autocomplete="email" aria-label="E-mail"><button class="btn ghost" data-act="entrar-email">Enviar link</button></span>
        </div>
      </section>`;
  $('#app').innerHTML = `<main class="create">
    <h1>Conta.</h1>
    ${msg ? `<p class="notice">${msg}</p>` : ''}
    ${corpo}
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">Voltar</button></div></main>`;
}
