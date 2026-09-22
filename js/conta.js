/* ============ conta (tela de login + botão no topo) ============ */
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { nuvem, nuvemConfigurada, usuario } from './nuvem.js';
import { esc, offline } from './util.js';

// "G" do Google nas cores oficiais (o botão segue o padrão visual do "Sign in with Google": fundo branco, logo à esquerda)
const G_LOGO = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
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
    : '<button class="btn btn-login" data-act="conta" title="Entrar pra salvar sua carreira e a jornada na nuvem"><span aria-hidden="true">👤</span> Entrar</button>');
  if (G.mode === 'conta') telaConta(); // atualiza a tela aberta quando o login/sync muda
}

export function telaConta(msg = '') {
  G.mode = 'conta'; limparTopo();
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
      <section class="login-card">
        <h2>Entre ou crie sua conta</h2>
        <p class="muted">Sua carreira (jornadas, Pokédex, shinies, recordes) e a jornada em andamento ficam salvas na nuvem, e você continua de qualquer aparelho. O que já jogou neste navegador sobe no primeiro login. Não precisa de senha.</p>
        <button class="btn-google" data-act="entrar-google">${G_LOGO}<span>Continuar com Google</span></button>
        <div class="login-ou"><span>ou</span></div>
        <label class="campo" for="email">Receber um link de acesso por e-mail</label>
        <span class="subrow"><input id="email" type="email" placeholder="voce@email.com" autocomplete="email"><button class="btn" data-act="entrar-email">✉ Enviar link</button></span>
        <p class="small muted">Abra o e-mail neste aparelho e toque no link: você entra direto. A primeira vez já cria a conta.</p>
      </section>`;
  $('#app').innerHTML = `<main class="create">
    <h1>Conta.</h1>
    ${msg ? `<p class="notice">${msg}</p>` : ''}
    ${corpo}
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">Voltar</button></div></main>`;
}
