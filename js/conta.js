/* ============ conta (login, ícone, amigos + botão no topo) ============ */
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { barraTelas, rotuloVoltar } from './navegacao.js';
import { SPR, SPR_SHINY } from './dados.js';
import { nuvem, nuvemConfigurada, usuario, meuIcone } from './nuvem.js';
import { loadList } from './api.js';
import { ehJogadorAlpha, htmlCartaoAlpha, htmlInsigniaAlpha } from './alpha.js';
import { esc, offline, rand } from './util.js';

// "G" do Google nas cores oficiais (o botão segue o padrão visual do "Sign in with Google": fundo branco, logo à esquerda)
const G_LOGO = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
const statusTxt = () => offline() ? '📴 offline: salvo neste aparelho, sobe quando a internet voltar'
  : ({ sincronizando: '⟳ sincronizando…', ok: '✓ salvo na nuvem', erro: '⚠ erro ao sincronizar', offline: '⟳ internet voltou, sincronizando…', ocioso: '' }[nuvem.status] || '');

// sprite do ícone de um jogador ({ id, shiny }); usado no topo, na conta, no ranking, na sala e na lista de amigos
export const htmlIcone = (ic, cls = 'icone') => {
  const id = ic?.id || 25, url = ic?.shiny ? SPR_SHINY(id) : SPR(id);
  return `<img class="${cls}" src="${url}" alt="" onerror="this.onerror=null;this.src='${SPR(id)}'">`;
};

// botão fixo no header (#conta-chip), fora do #topr (que cada tela reescreve). Offline aparece mesmo sem conta.
export function renderChipConta() {
  const el = $('#conta-chip'); if (!el) return;
  const selo = offline() ? '<span class="selo-offline" title="Sem internet: o jogo continua e salva neste aparelho">📴 offline</span>' : '';
  if (!nuvemConfigurada()) { el.innerHTML = selo; return; }
  const u = usuario(), pedidos = nuvem.amigos.filter(a => a.recebido && a.status === 'pendente').length;
  el.innerHTML = selo + (u
    ? `<button class="btn ghost sm chip-conta" data-act="conta" title="${esc(statusTxt())}">${htmlIcone(meuIcone(), 'icone-mini')} ${esc(nuvem.apelido || u.email || 'Conta')}${ehJogadorAlpha(nuvem.criadoEm) ? `<span class="alpha-mini" title="Treinador do Alpha">${htmlInsigniaAlpha({ compacto: true })}</span>` : ''} ${nuvem.status === 'erro' ? '⚠' : nuvem.status === 'sincronizando' ? '⟳' : ''}${pedidos ? `<span class="bolinha" title="Pedidos de amizade">${pedidos}</span>` : ''}</button>`
    : '<button class="btn btn-login" data-act="conta" title="Entrar pra salvar sua carreira e a jornada na nuvem"><span aria-hidden="true">👤</span> Entrar</button>');
  if (G.mode === 'conta' && !$('#conta-editando')?.contains(document.activeElement)) telaConta(); // atualiza sem roubar o foco de quem digita
}

/* ---- ícone: qualquer Pokémon (1–1025), normal ou shiny ---- */
let iconeEdit = null; // o que está sendo escolhido (só vira definitivo no "Salvar ícone")
export function mudarIconeEdit(valor) {
  iconeEdit ||= { ...meuIcone() };
  const txt = String(valor || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (/^\d+$/.test(txt)) { iconeEdit.id = Math.min(1025, Math.max(1, +txt)); telaConta(); return; }
  loadList().then(lista => { const i = lista.indexOf(txt); if (i >= 0) { iconeEdit.id = i + 1; telaConta(); } else telaConta(`Não achei nenhum Pokémon chamado “${esc(valor)}”. Use o nome em inglês ou o número.`); })
    .catch(() => telaConta('Sem internet pra buscar pelo nome: use o número da Pokédex (1 a 1025).'));
}
export function sortearIcone() { iconeEdit = { id: rand(1, 1025), shiny: (iconeEdit || meuIcone()).shiny }; telaConta(); }
export function alternarShinyIcone() { iconeEdit ||= { ...meuIcone() }; iconeEdit.shiny = !iconeEdit.shiny; telaConta(); }
export const iconeEscolhido = () => iconeEdit || meuIcone();
export const limparIconeEdit = () => { iconeEdit = null; };

function secaoIcone(logado) {
  const ic = iconeEscolhido(), mudou = !!iconeEdit && (iconeEdit.id !== meuIcone().id || iconeEdit.shiny !== meuIcone().shiny);
  loadList().then(l => { const dl = $('#icone-lista'); if (dl && !dl.options.length) dl.innerHTML = l.map(n => `<option value="${n}">`).join(''); }).catch(() => {});
  return `<section class="pv conta icone-card"><div>
      <h3>Seu ícone</h3>
      <p class="small muted">Qualquer Pokémon, normal ou shiny. Aparece no topo, no ranking, nas salas e pros seus amigos.${logado ? '' : ' Sem conta, fica só neste navegador.'}</p>
      <div class="icone-editor">
        <div class="icone-preview">${htmlIcone(ic, 'icone-grande')}<b>#${ic.id}${ic.shiny ? ' ✨' : ''}</b></div>
        <div class="icone-controles">
          <span class="subrow"><input id="icone-busca" list="icone-lista" placeholder="Nome em inglês ou número (ex.: gengar, 94)" autocomplete="off" aria-label="Buscar Pokémon pro ícone"><datalist id="icone-lista"></datalist><button class="btn ghost" data-act="icone-buscar">Ver</button></span>
          <span class="subrow"><button class="btn ghost" data-act="icone-sortear">🎲 Sortear</button><button class="btn ${ic.shiny ? '' : 'ghost'}" data-act="icone-shiny" aria-pressed="${ic.shiny}">✨ Shiny</button>
            <button class="btn" data-act="icone-salvar" ${mudou ? '' : 'disabled'}>Salvar ícone</button></span>
        </div>
      </div>
    </div></section>`;
}

function secaoAmigos() {
  const lista = nuvem.amigos, recebidos = lista.filter(a => a.status === 'pendente' && a.recebido);
  const enviados = lista.filter(a => a.status === 'pendente' && !a.recebido), amigos = lista.filter(a => a.status === 'aceita');
  const linha = (a, botoes) => `<li>${htmlIcone({ id: a.icone_id, shiny: a.icone_shiny }, 'icone-mini')}<b>${esc(a.apelido)}</b><span class="subrow">${botoes}</span></li>`;
  return `<section class="pv conta"><div>
      <h3>Amigos</h3>
      <p>Seu código de amigo: <b class="codigo">${esc(nuvem.codigoAmigo || '—')}</b> <span class="small muted">(passe pra quem quiser te adicionar)</span></p>
      <span class="subrow"><input id="amigo-codigo" maxlength="6" placeholder="Código do amigo" autocomplete="off" aria-label="Código do amigo" style="text-transform:uppercase"><button class="btn" data-act="amigo-add">Adicionar</button></span>
      ${recebidos.length ? `<h4>Pedidos pra você</h4><ul class="amigos">${recebidos.map(a => linha(a, `<button class="btn sm" data-act="amigo-aceitar" data-v="${a.amizade}">Aceitar</button><button class="btn ghost sm" data-act="amigo-remover" data-v="${a.amizade}">Recusar</button>`)).join('')}</ul>` : ''}
      <h4>Seus amigos (${amigos.length})</h4>
      ${amigos.length ? `<ul class="amigos">${amigos.map(a => linha(a, `<button class="btn ghost sm" data-act="amigo-remover" data-v="${a.amizade}" data-nome="${esc(a.apelido)}">Remover</button>`)).join('')}</ul>` : '<p class="small muted">Ninguém ainda. Troque códigos com quem joga com você: amigos podem te chamar direto pras salas do multiplayer.</p>'}
      ${enviados.length ? `<h4>Esperando aceitar</h4><ul class="amigos">${enviados.map(a => linha(a, `<button class="btn ghost sm" data-act="amigo-remover" data-v="${a.amizade}">Cancelar</button>`)).join('')}</ul>` : ''}
    </div></section>`;
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
          <label class="campo">Apelido (aparece no ranking e pros amigos)<span class="subrow"><input id="apelido" maxlength="20" value="${esc(nuvem.apelido)}"><button class="btn" data-act="salvar-apelido">Salvar</button></span></label>
          <p>${esc(statusTxt())}${nuvem.status === 'erro' ? ` <span class="err">${esc(nuvem.erro || '')}</span>` : ''}</p>
          <p class="small muted">${nuvem.naNuvem} jornada(s) terminada(s) na sua conta${nuvem.ultimaSync ? `, última sincronização às ${nuvem.ultimaSync.toLocaleTimeString('pt-BR')}` : ''}. A jornada em andamento também é salva sozinha, e dá pra continuar em outro aparelho entrando com a mesma conta.</p>
          <div class="subrow"><button class="btn ghost" data-act="sincronizar">⟳ Sincronizar agora</button><button class="btn ghost" data-act="sair">Sair da conta</button></div>
        </div>
      </section>${ehJogadorAlpha(nuvem.criadoEm) ? htmlCartaoAlpha(nuvem.criadoEm) : ''}${secaoIcone(true)}${secaoAmigos()}`
    : `
      <section class="login-card">
        <h2>Entre ou crie sua conta</h2>
        <p class="muted">Sua carreira (jornadas, Pokédex, shinies, recordes) e a jornada em andamento ficam salvas na nuvem, e você continua de qualquer aparelho. Com conta você também adiciona amigos. O que já jogou neste navegador sobe no primeiro login. Não precisa de senha.</p>
        <button class="btn-google" data-act="entrar-google">${G_LOGO}<span>Continuar com Google</span></button>
        <div class="login-ou"><span>ou</span></div>
        <label class="campo" for="email">Receber um link de acesso por e-mail</label>
        <span class="subrow"><input id="email" type="email" placeholder="voce@email.com" autocomplete="email"><button class="btn" data-act="entrar-email">✉ Enviar link</button></span>
        <p class="small muted">Abra o e-mail neste aparelho e toque no link: você entra direto. A primeira vez já cria a conta.</p>
      </section>${secaoIcone(false)}`;
  $('#app').innerHTML = `<main class="create" id="conta-editando">
    ${barraTelas('conta')}
    <h1>Conta.</h1>
    ${msg ? `<p class="notice">${msg}</p>` : ''}
    ${corpo}
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">${rotuloVoltar()}</button></div></main>`;
}
