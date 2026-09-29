/* ============ multiplayer: as telas ============
   Só desenho. Cada botão sai daqui com `data-act`, e quem despacha é o `main.js` — por isso este arquivo NUNCA
   importa as ações (`multiplayer.js`): é o que mantém o grafo sem ciclo (mp-regras → mp-rede → mp-cartao →
   mp-telas → multiplayer).
   A tela da sala é desenhada em DUAS partes (`#mp-topo` e `#mp-acoes`). Se montar a segunda estourar no meio, o
   `#mp-acoes` fica com o HTML VELHO e as duas metades passam a contar histórias diferentes — sem erro nenhum na
   cara de quem joga. Foi exatamente isso que escondeu o bug do `SPR_SHINY` (29/09/2026): o cabeçalho já dizia
   "Sala de Raide", o seletor do Hall da Fama nunca aparecia, e o jogador ficou preso achando que a opção não
   existia. Mesma lição do `gimmicksNaLoja` (carreira.js): falha silenciosa vira diagnóstico errado. Por isso
   `renderSala` mostra o erro NA TELA e no console, em vez de deixar meia tela velha. */
import { G, centroPokemon, rotasAtuais, dificuldadeDe } from './estado.js';
import { $, limparTopo } from './ui.js';
import { barraTelas, rotuloVoltar } from './navegacao.js';
import { ZONES, TYPE_PT, TC, CLS_PT, DIFICULDADES, ITEMS, SPR, SPR_SHINY, REGIOES_INICIAIS, ITEM_CRISTAL_Z } from './dados.js';
import { zonaLiberada, golpesPermitidos, resumoTravas, golpeDoClima, golpeDoTera, golpeDoBattleBond, climaDe } from './regras.js';
import { situacaoDoEvento, dataBR, formatarEspera } from './evento.js';
import { genDe } from './mapas.js';
import { ITEM_DO_RAIDE } from './boss.js';
import { MAX_TIME_HALL, htmlLojaConta, htmlEquiparConta } from './loja-conta.js';
import { carregarCarreira, hallDaConta, saldoArenaDaConta, conquistasDaConta } from './carreira.js';
import { megaLiberada, teraLiberada, gmaxLiberado, zLiberado } from './conquistas.js';
import { megasDisponiveis } from './mega.js';
import { desbloqueadas } from './roguelike.js';
import { nuvem, nuvemConfigurada, usuario } from './nuvem.js';
import { htmlIcone, htmlInsigniaDe } from './conta.js';
import { cartao, cenaMP } from './mp-cartao.js';
import { meuId, membroDe, diarioMP } from './mp-rede.js';
import { minhaMochila, ctxDaSala } from './mp-resultado.js';
import { MAX_JOGADORES, PRAZO_MS, raideSemRun, entradaEfetiva, usaRun, minhaVezDe, jogaveis, inimigosDe, seloDoMembro,
  motivoParaNaoComecar, quemFalta, raideDisponiveis, itensComunsDisponiveis, podeReviver, revivesRestantes, resumoDaConfig } from './mp-regras.js';
import { esc, fmt, offline } from './util.js';

const temRun = () => !!G.S?.player;
const minhaVez = () => minhaVezDe(G.sala, meuId());
const iconeDaBadge = htmlInsigniaDe;   // (conta.js) o mesmo ícone do topo, da lista de amigos e do ranking
// espécies que dá pra levar como convidado: a mesma regra da criação (iniciais + desbloqueadas no Roguelike)
export function especiesConvidado() {
  const lista = REGIOES_INICIAIS.flatMap(r => r.ids.map((id, i) => ({ id, nome: r.nomes[i] })));
  for (const p of desbloqueadas(carregarCarreira().jornadas)) if (!lista.some(x => x.id === p.id)) lista.push({ id: p.id, nome: fmt(p.especie) });
  return lista;
}

/* ---------- menu (fora da sala) ----------
   Duas portas e nada mais: criar ou entrar. A escolha do Pokémon MUDOU DE LUGAR (29/09/2026) — ela acontece
   dentro da sala, no lobby, onde você já vê o modo, quem chegou e dá pra trocar de ideia. Antes existia nos dois
   lugares, com quatro funções quase iguais, e obrigava a decidir antes de saber pra que tipo de luta era. */
export function telaMenuMP(msg = '') {
  G.mode = 'mp'; limparTopo();
  const bloqueio = !nuvemConfigurada() ? 'O multiplayer precisa do modo online, que ainda não foi configurado neste site (<code>js/config.js</code>).'
    : offline() ? '📴 Sem internet: o multiplayer volta quando a conexão voltar.' : '';
  const P = G.S?.player;
  const modo = (emoji, nome, txt) => `<div class="mp-modo"><b>${emoji} ${nome}</b><small>${txt}</small></div>`;
  $('#app').innerHTML = `<main class="create">
    ${barraTelas('mp')}
    <h1>Multiplayer.</h1>
    <p class="lead">Jogue junto com quem você quiser: uma sala, um código de quatro letras, e pronto. Dá pra entrar com o Pokémon da sua jornada, com um campeão do Hall da Fama, com um convidado de Nv. 5 — ou só pra assistir.</p>
    ${msg ? `<p class="notice">${msg}</p>` : ''}
    ${bloqueio ? `<div class="notice">${bloqueio}</div>` : `
    <div class="mp-portas">
      <section class="mp-porta"><h2>Criar uma sala</h2>
        <p class="muted">Você vira o anfitrião: escolhe o tipo de luta, quantos Pokémon cada um leva e quando começa.</p>
        <button class="btn big" data-act="mp-criar">➕ Criar sala</button>
        ${temRun() ? `<p class="small muted">Sua jornada: ${esc(P.nick || fmt(P.name))}, Nv. ${P.level}.</p>` : '<p class="small muted">Sem jornada em andamento dá pra criar PvP ou Sala de Raide.</p>'}
      </section>
      <section class="mp-porta"><h2>Entrar com código</h2>
        <p class="muted">Recebeu um código (ou um link) de quem criou a sala? É aqui.</p>
        <span class="subrow"><input id="mp-codigo" class="mp-codigo-campo" maxlength="4" placeholder="K7Q2" autocomplete="off" inputmode="latin" aria-label="Código da sala"><button class="btn big" data-act="mp-entrar">Entrar</button></span>
      </section>
    </div>
    <h3 style="margin-top:26px">O que dá pra fazer numa sala</h3>
    <div class="mp-modos">
      ${modo('🌿', 'Co-op', 'Explorar a rota do anfitrião, encarar um Alfa ou o chefe da semana — todo mundo do mesmo lado. Quem entrou com a própria run leva XP, itens e dinheiro pra ela.')}
      ${modo('⚔', 'PvP', 'Time A contra Time B, de 1×1 a 3×3 (com aliados). Amistoso: ninguém perde HP nem item de verdade.')}
      ${modo('☄', 'Sala de Raide', 'O chefe da semana com até três campeões do seu Hall da Fama, sem precisar de jornada nenhuma. Perder não custa nada.')}
    </div>`}
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">${rotuloVoltar()}</button></div></main>`;
}

/* ---------- o esqueleto da sala ---------- */
export function telaSala() {
  G.mode = 'mp'; limparTopo();
  $('#app').innerHTML = `<main class="create mp">
    <div id="mp-topo"></div>
    <div class="textbox"><div id="log" class="log" aria-live="polite"></div></div>
    <div id="mp-acoes" class="actions"></div>
    <section class="mp-chat"><h3>💬 Chat da sala</h3>
      <div class="textbox"><div id="mp-chat-msgs" class="log" aria-live="polite"></div></div>
      <span class="subrow"><input id="mp-chat-input" maxlength="200" placeholder="Mensagem pra sala..." autocomplete="off"><button class="btn ghost sm" data-act="mp-chat-enviar">Enviar</button></span>
    </section></main>`;
  const sala = G.sala;
  esquecerPintura();   // o #mp-topo/#mp-acoes acabaram de nascer vazios
  clearInterval(sala.relogio);
  /* O relógio mexe SÓ no texto e na largura da barra, nunca redesenha a sala: um re-render por segundo apagaria o
     que estivesse sendo digitado no chat e piscaria a cena inteira. */
  sala.relogio = setInterval(() => {
    if (!G.sala?.prazo) return;
    const resta = Math.max(0, G.sala.prazo - Date.now());
    const el = $('#mp-relogio'); if (el) el.textContent = Math.ceil(resta / 1000) + 's';
    const barra = $('#mp-prazo-fill');
    if (barra) { barra.style.width = `${resta / PRAZO_MS * 100}%`; barra.classList.toggle('urgente', resta < 10000); }
  }, 1000);
  renderChat();
  renderSala();
}
/* ---------- chat (fica FORA de #mp-topo/#mp-acoes de propósito: essas duas divs são recriadas inteiras por
   renderSala(), e se o campo de texto morasse ali dentro, digitar enquanto alguém entra na sala apagaria o que
   você estava escrevendo no meio da frase) ---------- */
export function renderChat() {
  const el = $('#mp-chat-msgs'); if (!el || !G.sala) return;
  el.innerHTML = G.sala.mensagens.length
    ? G.sala.mensagens.map(m => `<p>${htmlIcone(m.icone, 'icone-mini')}<b>${esc(m.nome)}:</b> ${esc(m.texto)}</p>`).join('')
    : '<p class="muted">Ninguém escreveu nada ainda. Diga oi!</p>';
  el.scrollTop = el.scrollHeight;
}

/* Cartão de jogador no lobby: quem é, o que trouxe e — a novidade — em que pé está (👑 anfitrião, ✅ pronto,
   ⏳ escolhendo, 👁 assistindo). Antes só a Sala de Raide mostrava "pronto", e nos outros modos não dava pra saber
   se a pessoa ainda estava montando o time ou tinha travado. */
const cartaoMembro = m => {
  const selo = seloDoMembro(m), mons = (m.mons || []).slice(0, G.sala.config.porJogador);
  return `<div class="mp-membro ${selo.cls}">
    <b class="mp-nome">${htmlIcone(m.icone, 'icone-mini')}${m.anfitriao ? '<span class="mp-coroa" title="anfitrião">👑</span>' : ''}${esc(m.nome)}${iconeDaBadge(m.badge)}${m.id === meuId() ? ' <span class="small muted">(você)</span>' : ''}
      <span class="mp-selo ${selo.cls}">${selo.txt}</span></b>
    <div class="mp-mons">${mons.map(x => cartao(x, x.convidado ? '✨ convidado (não é da run)' : x.hall ? '🏟 Hall da Fama' : '')).join('')
      || `<p class="small muted">${(m.entradaTipo || 'run') === 'espectador' ? 'Veio só olhar.' : 'Ainda escolhendo o Pokémon…'}</p>`}</div></div>`;
};
// Linha de conexão + diagnóstico: some quando está tudo bem? Não — fica sempre, porque saber se a sala está viva
// é metade do problema num jogo em rede. Mostra o estado, há quanto tempo chegou algo, o 🔄 e o detalhe escondido.
function barraConexao() {
  const sala = G.sala, c = sala.conexao || 'ok', seg = sala.ultimoEvento ? Math.round((Date.now() - sala.ultimoEvento) / 1000) : null;
  const txt = c === 'ok' ? '🟢 conectado' : c === 'instavel' ? '🟡 rede instável (tentando de novo)' : '🔴 sem conexão com a sala (reconectando…)';
  return `<div class="mp-conexao ${c}">
    <span>${txt}${seg != null ? ` · último sinal há ${seg}s` : ''}${sala.semAnfitriao ? ' · esperando o anfitrião voltar' : ''}</span>
    <button class="btn ghost sm" data-act="mp-sync" title="Pedir o estado atual da sala de novo">🔄 Sincronizar</button>
    <details class="mp-diag"><summary>Diagnóstico</summary><ul>${diarioMP().map(l => `<li class="${l.ruim ? 'err' : ''}">${new Date(l.t).toLocaleTimeString('pt-BR')} · ${esc(l.txt)}</li>`).join('') || '<li class="muted">Nada ainda.</li>'}</ul></details>
  </div>`;
}
/* O que já está pintado em cada região. Duas razões: (1) o anfitrião republica o estado de tempos em tempos e a
   presença muda sozinha — sem isto, a sala inteira era reescrita a cada pulso, piscando a cena e derrubando o
   foco de quem estivesse mexendo em algo; (2) se nada mudou, não se toca no DOM. `telaSala` zera. */
const pintado = { topo: null, acoes: null };
export const esquecerPintura = () => { pintado.topo = pintado.acoes = null; };
function aplicar(sel, chave, html) {
  if (pintado[chave] === html) return;
  const el = $(sel); if (!el) return;
  pintado[chave] = html; el.innerHTML = html;
}
export function renderSala() {
  try {
    /* TRANSAÇÃO: monta as DUAS partes primeiro e só então escreve. Se montar estourar no meio, nada é aplicado —
       antes o `#mp-topo` novo convivia com o `#mp-acoes` velho e as metades contavam histórias diferentes (o bug
       do `SPR_SHINY`, 29/09/2026: cabeçalho de Sala de Raide sem o seletor do Hall em lugar nenhum). */
    const partes = desenharSala();
    if (!partes) return;
    aplicar('#mp-topo', 'topo', partes.topo);
    aplicar('#mp-acoes', 'acoes', partes.acoes);
  } catch (e) {
    console.error('renderSala', e);
    const el = $('#mp-acoes');
    if (el) { pintado.acoes = null; el.innerHTML = `<p class="notice">Algo quebrou ao desenhar esta parte da sala: <b>${esc(e.message)}</b>.<br>Manda esse texto em 🐞 Bugs e sugestões, por favor — dá pra sair e entrar de novo na sala enquanto isso.</p>
      <div class="subrow"><button class="btn ghost" data-act="mp-sair">Sair da sala</button></div>`; }
  }
}
/* O alto da sala: o código GRANDE (é o que todo mundo precisa ler e ditar), os dois botões de convite e o resumo
   do que esta sala é. O convite por link resolve o pedido mais antigo aqui: ditar quatro letras por chamada de voz
   funcionava, mas mandar um link funciona melhor. */
function heroDaSala() {
  const sala = G.sala, z = ZONES.find(x => x.id === sala.zona) || ZONES[0];
  return `<div class="mp-hero">
    <div class="mp-hero-codigo">
      <span class="small muted">Código da sala</span>
      <b class="mp-codigo-grande">${esc(sala.codigo)}</b>
      <div class="subrow">
        <button class="btn ghost sm" data-act="mp-copiar" data-v="codigo" title="Copiar só as quatro letras">📋 Código</button>
        <button class="btn ghost sm" data-act="mp-copiar" data-v="link" title="Copiar um link que já entra nesta sala">🔗 Convite</button>
      </div>
    </div>
    <div class="mp-hero-info">
      <p class="mp-hero-modo">${resumoDaConfig(sala.config, z.name)}</p>
      <p class="small muted">${sala.membros.length}/${MAX_JOGADORES} na sala · ${sala.anfitriao ? 'você é o anfitrião' : 'quem criou a sala é quem começa'}</p>
      ${barraConexao()}
    </div>
  </div>`;
}
function desenharSala() {
  const sala = G.sala;
  if (!sala || G.mode !== 'mp' || !$('#mp-topo')) return;
  const b = sala.batalha, cfg = sala.config, pvp = cfg.modo === 'pvp', z = ZONES.find(x => x.id === sala.zona) || ZONES[0];
  const cabecalho = heroDaSala();
  if (!b) return renderLobby(cabecalho, pvp, z);   // devolve { topo, acoes }
  const dono = id => id === 'ia' ? '' : (membroDe(id)?.nome || 'jogador que saiu') + (id === meuId() ? ' (você)' : '');
  const vez = minhaVez();
  const topo = cabecalho + cenaMP(b, { legendaDe: m => dono(m.dono), vezRef: vez?.ref }) + fichasDoTurno(b) + historicoDoTurno();
  const status = barraDoTurno(b);
  const sair = `<button class="btn ghost" data-act="mp-sair">Sair da sala</button>`;
  if (!jogaveis(b).some(m => m.dono === meuId())) {
    return { topo, acoes: status + `<p class="muted">Seus Pokémon estão fora da luta; ${b.evento ? 'o grupo segura enquanto você volta com um Revive, ou torça pelo seu time!' : 'torça pelo seu time!'}</p>${botoesReviver(b)}${botoesRaide(b)}<div class="subrow">${sair}</div>` };
  }
  if (!vez) return { topo, acoes: status + `<p class="muted">Escolhas enviadas.</p>${botoesRaide(b)}${botoesReviver(b)}<div class="subrow">${sair}</div>` };
  const alvos = inimigosDe(b, vez); if (!alvos.some(e => e.ref === sala.alvo)) sala.alvo = alvos[0]?.ref;
  // Golpes disponíveis: regras.golpesPermitidos (Choice, Colete, Taunt, Encore, Disable, Torment e PP) — a mesma
  // função de render.js/arena.js. Nenhum permitido = Struggle, senão a sala travaria sem botão clicável.
  const permitidos = golpesPermitidos(vez);
  const semPP = !permitidos.length;
  const gd = gimmicksDisponiveisMP(b, vez), zLigado = !!(gd && sala.gimmicksSel?.z);   // com o Z ligado, só os golpes que podem virar Z ficam clicáveis
  // reordenar (▲▼) não gasta turno; fica fora do <button> de atacar (não dá pra aninhar <button> em <button>)
  const moverMP = (i, dir) => `<button class="btn ghost sm" data-act="mp-golpe-mover" data-v="${i}" data-dir="${dir}" ${(dir < 0 ? i === 0 : i === vez.moves.length - 1) ? 'disabled' : ''} title="${dir < 0 ? 'Subir' : 'Descer'}">${dir < 0 ? '▲' : '▼'}</button>`;
  return { topo, acoes: status + `<p class="mp-quem">Vez de <b>${esc(vez.nome)}</b></p>` + resumoTravas(vez).map(t => `<p class="small muted">${esc(t)}</p>`).join('') + botoesGimmickMP(gd) +
    (alvos.length > 1 ? `<div class="subrow">Alvo: ${alvos.map(m => `<button class="btn ${m.ref === sala.alvo ? '' : 'ghost'} sm" data-act="mp-mirar" data-v="${m.ref}">${esc(m.nome)}</button>`).join('')}</div>` : '') +
    `<div class="moves">${semPP ? '<button class="mv" style="--c:#A8A77A" data-act="mp-golpe" data-v="-1"><b>Struggle</b><small>Sem PP.</small></button>'
      : vez.moves.map((g0, i) => { const g = golpeDoBattleBond(golpeDoTera(golpeDoClima(g0, climaDe(b.campo)), vez), vez); const preso = !permitidos.includes(g0); return `<div class="mv-cel"><button class="mv" style="--c:${TC[g.type] || '#888'}" data-act="mp-golpe" data-v="${i}" ${g.ppLeft <= 0 || preso || (zLigado && !golpeZ(gd.p, g)) ? 'disabled' : ''}><b>${esc(fmt(g.name))}</b><small>${TYPE_PT[g.type] || g.type}, ${CLS_PT[g.cls]}, poder ${g.power ?? '—'}</small><span class="pp">PP ${g.ppLeft}/${g.pp}</span></button><span class="mv-ordem">${moverMP(i, -1)}${moverMP(i, 1)}</span></div>`; }).join('')}</div>
    ${botoesItemComum()}
    ${botoesRaide(b)}
    ${botoesReviver(b)}
    <div class="subrow">${b.pvp ? '<button class="btn ghost" data-act="mp-desistir">Desistir</button>' : b.evento ? '' : '<button class="btn ghost" data-act="mp-fugir">Fugir</button>'}${sair}</div>` };
}

/* ---------- o andamento do turno ----------
   Três coisas que faltavam e que todo mundo perguntava no chat: quanto tempo ainda tenho, quem a sala está
   esperando, e o que aconteceu no turno que passou voando. */
// fichas de quem já escolheu: um rosto por jogador, com ✓ ou ⏳ (antes era uma frase "esperando: fulano, ciclano")
function fichasDoTurno(b) {
  const sala = G.sala, faltam = new Set(quemFalta(sala));
  const donos = [...new Set([...b.lados.A, ...b.lados.B].filter(m => m.dono !== 'ia').map(m => m.dono))];
  if (donos.length < 2) return '';
  return `<div class="mp-fichas">${donos.map(id => {
    const m = membroDe(id), falta = faltam.has(id);
    return `<span class="mp-ficha ${falta ? 'esperando' : 'ok'}" title="${falta ? 'ainda escolhendo' : 'já escolheu'}">${htmlIcone(m?.icone, 'icone-mini')}${esc(m?.nome || 'jogador')}${falta ? ' ⏳' : ' ✓'}</span>`;
  }).join('')}</div>`;
}
// barra de prazo: o número sozinho ("45s") não dá o susto certo. A largura é atualizada pelo relógio de telaSala.
function barraDoTurno(b) {
  const sala = G.sala, resta = Math.max(0, sala.prazo - Date.now());
  return `<div class="mp-turno">
    <span class="turno-n">Turno <b>${b.turno}</b></span>
    <div class="mp-prazo" title="Quem não escolher até o fim joga no automático"><div class="mp-prazo-fill" id="mp-prazo-fill" style="width:${Math.round(resta / PRAZO_MS * 100)}%"></div></div>
    <span id="mp-relogio" class="mp-relogio">${Math.ceil(resta / 1000)}s</span></div>`;
}
// 📜 o que aconteceu antes: o turno passa rápido e a narração some no registro. Só na memória (some ao sair).
function historicoDoTurno() {
  const h = G.sala.historico || [];
  if (!h.length) return '';
  return `<details class="mp-historico"><summary>📜 Turnos anteriores (${h.length})</summary>
    ${[...h].reverse().map(t => `<div class="mp-hist-turno"><b>Turno ${t.turno}</b><ul>${t.linhas.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>`).join('')}</details>`;
}

/* ---------- botões de item durante a luta ---------- */
const botoesRaide = b => {
  const l = raideDisponiveis(b, ctxDaSala()), bag = minhaMochila();
  return l.length ? `<div class="subrow">${l.map(t => `<button class="btn ghost sm" data-act="mp-raide" data-v="${t}" title="${esc(ITEMS[ITEM_DO_RAIDE[t]].desc)}">🎒 ${esc(ITEMS[ITEM_DO_RAIDE[t]].name)} ×${bag[ITEM_DO_RAIDE[t]]}</button>`).join('')}</div>` : '';
};
// Itens comuns: lista recolhível (pode ser bem maior que os de raide) — usar um já é a escolha do turno, sem confirmar
function botoesItemComum() {
  const l = itensComunsDisponiveis(ctxDaSala({ mon: minhaVez() })), bag = minhaMochila();
  const rotulo = raideSemRun(G.sala) ? 'da conta' : 'da mochila';
  return l.length ? `<details class="mp-itens"><summary>🎒 Usar item ${rotulo} (${l.length})</summary><div class="bag-grid">${l.map(k => `<button class="item-btn sm" data-act="mp-item" data-v="${k}" title="${esc(ITEMS[k].desc)}">${esc(ITEMS[k].name)} ×${bag[k]}</button>`).join('')}</div></details>` : '';
}
function botoesReviver(b) {
  if (!podeReviver(b, ctxDaSala())) return '';
  const restam = revivesRestantes(b, meuId());
  if (raideSemRun(G.sala)) {
    const bag = minhaMochila(), usaMax = (bag['max-revive'] || 0) > 0, id = usaMax ? 'max-revive' : 'revive';
    return `<div class="subrow"><button class="btn" data-act="mp-revive" title="Gasta 1 ${esc(ITEMS[id].name)} da sua conta">💊 Usar ${esc(ITEMS[id].name)} (${bag[id]} na conta · ${restam} uso(s) restante(s))</button></div>`;
  }
  return `<div class="subrow"><button class="btn" data-act="mp-revive" title="Gasta 1 Revive da sua mochila; o Pokémon volta com metade do HP">💊 Usar Revive (${G.S.bag.revive} na mochila · ${restam} uso(s) restante(s))</button></div>`;
}

/* ---------- gimmicks no co-op (Mega, Tera, Gigantamax, Z-Move) ----------
   Os botões só aparecem pro PRINCIPAL de quem tem uma run (convidado, aliado e PvP ficam de fora). A conquista e o
   item são da MINHA conta e conferidos aqui, na minha tela; o que eu escolho vai junto da ação de golpe
   (`acao.gimmicks`) e o anfitrião aplica no motor (mp-motor.aplicarGimmicksMP). */
export const golpeZ = (p, g) => !!g && !!p && g.cls !== 'status' && g.power > 0 && g.ppLeft > 0 && g.name !== 'struggle' && zLiberado(p, g);
// o que o meu Pokémon principal pode usar agora; null = não se aplica (PvP, convidado, aliado, sem run)
export function gimmicksDisponiveisMP(b, m) {
  if (!b || b.pvp || !m || m.slot !== 0 || m.convidado || m.hall || !usaRun(G.sala) || !temRun()) return null;
  const M = G.S.player, usou = b.gimmicksUsados?.[meuId()] || {}, p = conquistasDaConta(G.S.registro);
  return {
    p,
    mega: !usou.mega && !m.mega ? megasDisponiveis(M, { jaUsou: false, liberada: e => megaLiberada(p, e) }) : [],   // a Pedra Mega (ou Dragon Ascent) segue valendo
    tera: !usou.tera && !m.tera ? Object.keys(TYPE_PT).filter(t => teraLiberada(p, t)) : [],
    gmax: !usou.gmax && !m.dyna && gmaxLiberado(p, M.data.speciesName),
    z: !usou.z && M.item === ITEM_CRISTAL_Z && m.moves.some(g => golpeZ(p, g))                                        // o Cristal Z segue valendo
  };
}
function botoesGimmickMP(d) {
  if (!d) return '';
  const sel = G.sala.gimmicksSel || {};
  const bt = (tipo, ligado, txt, dica) => `<button class="btn ${ligado ? '' : 'ghost'} sm" data-act="mp-gimmick" data-v="${tipo}" aria-pressed="${!!ligado}" title="${esc(dica)}">${txt}</button>`;
  const l = [];
  if (d.mega.length) l.push(bt('mega', sel.mega, sel.mega ? `⚡ ${esc(sel.mega.nomeForma)} ✓` : '⚡ Mega Evolução', 'Não gasta o turno. Uma vez por luta.'));
  if (d.tera.length) l.push(bt('tera', sel.tera, sel.tera ? `💎 Tera ${esc(TYPE_PT[sel.tera] || sel.tera)} ✓` : '💎 Terastalizar', 'Não gasta o turno. Uma vez por luta.'));
  if (d.gmax) l.push(bt('gmax', sel.gmax, sel.gmax ? '🔴 Gigantamax ✓' : '🔴 Gigantamax', 'HP dobrado e golpes Max por 3 turnos. Não gasta o turno.'));
  if (d.z) l.push(bt('z', sel.z, sel.z ? '🌀 Z-Move ✓ (escolha o golpe)' : '🌀 Z-Move', 'O golpe que você escolher vira Z. Uma vez por luta.'));
  return l.length ? `<div class="subrow mp-gimmicks"><span class="small muted">Neste turno:</span> ${l.join('')}</div>` : '';
}

/* ---------- lobby ---------- */
// Centro Pokémon sem sair da sala: no co-op a equipe se machuca de verdade, e antes era preciso sair, curar e voltar.
// Mesmo preço e mesma regra do jogo sozinho (estado.centroPokemon); só aparece entre as lutas, com uma run em andamento.
function centroNaSala() {
  if (!temRun() || G.sala.batalha || !usaRun(G.sala)) return '';
  const { precisa, custo, cheio, vitorias } = centroPokemon(), semGrana = G.S.money < custo;
  const desconto = vitorias && custo < cheio ? ` <s>₽${cheio}</s>` : '';
  return `<div class="subrow mp-centro"><button class="btn ghost" data-act="mp-centro" ${!precisa || semGrana || G.sala.ocupado ? 'disabled' : ''}
    title="${!precisa ? 'Sua equipe já está curada' : semGrana ? 'Dinheiro insuficiente' : 'Restaura HP, PP e status de toda a equipe'}">🏥 Centro Pokémon${!precisa ? ' (equipe curada)' : `${custo ? ` · ₽${custo}` : ' · grátis'}${desconto}`}</button>
    <span class="small muted">₽${G.S.money.toLocaleString('pt-BR')}</span></div>`;
}
/* Minha seleção do Hall da Fama + Loja de preparo (`sala.hallSel`), pra quem entra com os próprios campeões —
   na Sala de Raide ou em co-op/PvP. Mexe só na PRÓPRIA conta (hallDaConta/saldoArenaDaConta são locais, sem run). */
export function htmlHallPicker(sel, ocupado = false) {
  const hall = hallDaConta(), saldo = saldoArenaDaConta();
  const escolhidos = new Set(sel.selecao);
  const cartaoHall = e => { const on = escolhidos.has(e.chave), cheio = !on && sel.selecao.length >= MAX_TIME_HALL;
    return `<button class="hall-card ${on ? 'on' : ''}" data-act="mp-raide-sel" data-v="${esc(e.chave)}" ${cheio || ocupado ? 'disabled' : ''} aria-pressed="${on}">
      <img src="${e.shiny ? SPR_SHINY(e.id) : SPR(e.id)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${SPR(e.id)}'">
      <b>${e.shiny ? '✨ ' : ''}${esc(e.nick || fmt(e.nome))}</b><span class="muted small">Nv. ${e.nivel} · Gen ${e.gen}</span></button>`; };
  const entradas = sel.selecao.map(c => hall.find(e => e.chave === c)).filter(Boolean).map(e => ({ chave: e.chave, rotulo: e.nick || fmt(e.nome) }));
  return `<section class="pv conta"><div><h3>🏟 Seus Pokémon (Hall da Fama)</h3>
    <p class="small muted">O principal de cada jornada Roguelike/Hardcore terminada entra aqui, com o nível que tinha. Escolha de 1 a ${MAX_TIME_HALL} — não usa nenhuma jornada em andamento.</p>
    ${hall.length ? `<div class="hall-lista">${hall.map(cartaoHall).join('')}</div>`
      : '<p class="notice">Seu Hall da Fama está vazio. Termine (ou encerre) uma jornada Roguelike ou Hardcore pra ter Pokémon aqui.</p>'}</div></section>
    ${htmlEquiparConta(entradas, sel.equipamento, 'data-mp-equipar')}
    ${htmlLojaConta(saldo, 'mp-raide-comprar-comum', 'mp-raide-comprar-segurado')}`;
}
/* ---------- com o que EU entro nesta sala ----------
   Vive só aqui desde 29/09/2026 (antes existia também no menu, com funções duplicadas): a decisão acontece onde
   você já vê o modo da sala e quem chegou, e dá pra trocar de ideia até marcar "pronto". A Sala de Raide só
   oferece Hall ou assistir — lá ninguém usa run. */
function htmlMinhaEntrada() {
  const sala = G.sala;
  if (sala.batalha) return '';
  const t = entradaEfetiva(sala), dis = sala.ocupado ? 'disabled' : '', raide = raideSemRun(sala);
  const op = (v, rotulo, dica, off = false) => `<button class="abil ${t === v ? 'on' : ''}" data-act="mp-entrada-sala" data-v="${v}" aria-pressed="${t === v}" ${off || dis ? 'disabled' : ''}><b>${rotulo}</b><small>${dica}</small></button>`;
  const opcoes = raide
    ? op('hall', '🏟 Meus campeões do Hall da Fama', `Até ${MAX_TIME_HALL}, no nível de verdade, com os itens que você comprar aqui.`)
      + op('espectador', '👁 Só assistir', 'Fica na sala, acompanha a luta e o chat sem entrar no time.')
    : op('run', '🎒 O da minha jornada', temRun() ? `${esc(G.S.player.nick || fmt(G.S.player.name))}, Nv. ${G.S.player.level}. A luta conta pra ela: XP, HP, itens${DIFICULDADES[dificuldadeDe(G.S)].permadeath ? ' — e desmaiar acaba a jornada (Roguelike)' : ''}.` : 'Você não tem nenhuma jornada em andamento.', !temRun())
      + op('hall', '🏟 Meus campeões do Hall da Fama', `Até ${MAX_TIME_HALL} de jornadas já terminadas, no nível de verdade. Não mexe em save nenhum.`)
      + op('convidado', '✨ Um Pokémon convidado', 'Emprestado só pra sala, Nv. 5. Não mexe em save nenhum, não ganha recompensa.')
      + op('espectador', '👁 Só assistir', 'Fica na sala, acompanha a luta e o chat sem entrar no time.');
  // desmaiado não trava mais a entrada: dá pra curar no Centro sem sair da sala (o botão está logo abaixo)
  const avisoRun = t === 'run' && temRun() && G.S.player.hp <= 0
    ? '<p class="notice">Seu Pokémon está desmaiado — cure no Centro Pokémon aqui embaixo, senão você fica de fora da luta.</p>' : '';
  const escolhaDoConvidado = t === 'convidado'
    ? `<div class="picks" style="margin-top:10px">${especiesConvidado().map(e => `<button class="pick ${sala.convidado?.data?.id === e.id ? 'on' : ''}" data-act="mp-convidado-sala" data-v="${e.id}" ${dis}><img src="${SPR(e.id)}" alt="" loading="lazy">${esc(e.nome)}</button>`).join('')}</div>` : '';
  const pronto = t === 'espectador' ? '' : `<div class="subrow"><button class="btn ${sala.pronto ? '' : 'ghost'} big" data-act="mp-pronto" ${dis}>${sala.pronto ? '✅ Pronto! (toque pra voltar a escolher)' : 'Estou pronto'}</button></div>`;
  return `<section class="pv conta"><div><h3>Você entra com…</h3>
    <div class="abils">${opcoes}</div>${avisoRun}${escolhaDoConvidado}</div></section>
    ${t === 'hall' ? htmlHallPicker(sala.hallSel, sala.ocupado) : ''}${pronto}`;
}
/* ---------- a configuração da sala ----------
   Botões-cartão no lugar dos <select>: dá pra ler tudo de uma vez e o toque é do tamanho do dedo. Quem NÃO é
   anfitrião vê exatamente a mesma coisa, só travada — antes ele não via configuração nenhuma e tinha de deduzir
   pelo resumo lá em cima. */
function configDaSala() {
  const sala = G.sala, cfg = sala.config, manda = sala.anfitriao && !sala.batalha && !sala.ocupado;
  const chip = (campo, valor, rotulo, dica, off = false) => `<button class="mp-chip ${String(cfg[campo]) === String(valor) ? 'on' : ''}" data-act="mp-cfg" data-v="${campo}:${valor}" aria-pressed="${String(cfg[campo]) === String(valor)}" ${manda && !off ? '' : 'disabled'} title="${esc(dica)}">${rotulo}</button>`;
  const zonas = temRun() ? rotasAtuais().filter(x => zonaLiberada(x, G.S.player.level, G.S)) : [];
  const grupo = (titulo, conteudo, dica = '') => `<div class="mp-cfg-grupo"><h4>${titulo}</h4>${conteudo}${dica ? `<small class="muted">${dica}</small>` : ''}</div>`;
  const zonaAtual = ZONES.find(x => x.id === sala.zona);
  return `<section class="mp-config">
    ${grupo('Tipo de luta', `<div class="mp-chips">
      ${chip('modo', 'coop', '🌿 Co-op', temRun() ? 'Todo mundo do mesmo lado, na jornada do anfitrião.' : 'Precisa de uma jornada em andamento.', !temRun())}
      ${chip('modo', 'pvp', '⚔ PvP', 'Time A contra Time B, amistoso.')}
      ${chip('modo', 'raide', '☄ Raide', 'O chefe da semana com o Hall da Fama, sem jornada nenhuma.')}</div>`)}
    ${grupo('Pokémon por jogador', `<div class="mp-chips">${[1, 2, 3].map(n => chip('porJogador', n, String(n), n === 1 ? 'Só o principal.' : 'Com aliados (ou mais campeões do Hall).')).join('')}</div>`)}
    ${cfg.modo === 'raide' ? '' : grupo('Níveis', `<div class="mp-chips">
      ${chip('balancear', true, '⚖ Balancear', cfg.modo === 'pvp' ? 'Todos no nível médio; o time menor ganha HP extra.' : 'O grupo todo no nível do anfitrião.')}
      ${chip('balancear', false, '🔥 Níveis reais', cfg.modo === 'pvp' ? 'Cada um com o nível que tem.' : 'Cada um leva pra própria jornada o que ganhar — e os inimigos acompanham o mais forte.')}</div>`,
      cfg.balancear ? 'Quem tiver o nível ajustado joga por diversão: não leva XP nem itens pra própria jornada.' : 'Mais difícil, e o que cair vale pra valer.')}
    ${cfg.modo === 'coop' ? grupo('Onde', sala.anfitriao
      ? `<label class="campo"><select data-mp-cfg="zona" ${manda ? '' : 'disabled'}>${zonas.map(x => `<option value="${x.id}" ${x.id === sala.zona ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>`
      : `<p class="mp-cfg-leitura">${esc(zonaAtual?.name || '—')}</p>`) : ''}
  </section>`;
}
function renderLobby(cabecalho, pvp, z) {
  const sala = G.sala, cfg = sala.config, dis = sala.ocupado ? 'disabled' : '', raide = cfg.modo === 'raide';
  const time = t => sala.membros.filter(m => (m.time || 'B') === t);
  // a "mesa": quem está na sala e o que cada um trouxe
  const topo = cabecalho + (pvp
    ? `<div class="mp-times">${['A', 'B'].map(t => `<div class="mp-time"><h3>Time ${t} <small class="muted">(${time(t).length})</small></h3>${time(t).map(cartaoMembro).join('') || '<p class="small muted">Ninguém ainda.</p>'}</div>`).join('')}</div>`
    : `<div class="mp-grupo">${sala.membros.map(cartaoMembro).join('')}</div>`);
  const trocarTime = pvp ? `<div class="subrow mp-troca-time"><span class="small muted">Seu time:</span> ${['A', 'B'].map(t => `<button class="btn ${sala.time === t ? '' : 'ghost'} sm" data-act="mp-time" data-v="${t}" ${dis}>Time ${t}</button>`).join('')}</div>` : '';
  const sair = '<button class="btn ghost" data-act="mp-sair">Sair da sala</button>';
  // amigos (com conta) que ainda não estão na sala: um toque manda o convite
  const naSalaIds = new Set(sala.membros.map(m => m.id));
  const amigosFora = usuario() ? nuvem.amigos.filter(a => a.status === 'aceita' && !naSalaIds.has(a.amigo)) : [];
  const convites = sala.anfitriao ? (amigosFora.length
    ? `<div class="mp-convites"><b>Chamar amigos:</b> ${amigosFora.map(a => `<button class="btn ghost sm" data-act="mp-convidar" data-v="${a.amigo}">${htmlIcone({ id: a.icone_id, shiny: a.icone_shiny }, 'icone-mini')} ${esc(a.apelido)}${htmlInsigniaDe(a.badge_exibida)}</button>`).join('')}</div>`
    : usuario() ? '' : '<p class="small muted">Entre na conta pra chamar amigos direto (sem precisar passar o código).</p>') : '';
  const comum = configDaSala() + trocarTime + convites + centroNaSala() + htmlMinhaEntrada();
  if (!sala.anfitriao) return { topo, acoes: comum + `<p class="muted">${sala.ocupado ? 'Um instante…' : 'Quando todo mundo estiver pronto, o anfitrião começa.'}</p><div class="subrow">${sair}</div>` };
  // Por que o botão está apagado? A resposta vai escrita, não só no title (regra pura: mp-regras.motivoParaNaoComecar)
  const motivo = motivoParaNaoComecar(sala, { temRun: temRun() });
  const trava = motivo ? 'disabled' : dis;
  const comecar = raide
    ? `<button class="btn big" data-act="mp-evento" ${trava} title="${esc(motivo)}">☄ Começar a Raide</button>`
    : pvp
      ? `<button class="btn big" data-act="mp-pvp" ${trava} title="${esc(motivo)}">⚔ Começar PvP</button>`
      : `<button class="btn big" data-act="mp-explorar" ${trava} title="${esc(motivo)}">🌿 Explorar juntos</button>${z.chefe ? `<button class="btn" data-act="mp-alfa" ${trava} title="${esc(motivo)}">⚔ Desafiar o Alfa (${esc(z.chefe.nome)})</button>` : ''}${botaoEventoMP(trava)}`;
  return { topo, acoes: comum + `<div class="subrow mp-comecar">${comecar}${sair}</div>
    ${motivo ? `<p class="small muted mp-motivo">⏳ ${esc(motivo)}</p>` : ''}` };
}
// ☄ o chefe da semana no co-op: mesma trava do single player (só Roguelike/Hardcore da run do anfitrião, rota final liberada, 8 h entre tentativas)
function botaoEventoMP(dis) {
  if (!temRun()) return '';
  const sit = situacaoDoEvento({ dificuldade: dificuldadeDe(G.S), gen: genDe(G.S) });
  if (!sit.evento || sit.motivo === 'modo') return '';
  const final = rotasAtuais().find(r => r.lendarios), liberada = !final || G.S.player.level >= final.libera;
  if (sit.motivo === 'em-breve') return `<button class="btn ghost" disabled title="O primeiro chefe chega em ${dataBR(sit.inicio)}">☄ ${esc(sit.evento.nome)} — em ${dataBR(sit.inicio)}</button>`;
  if (!liberada) return `<button class="btn ghost" disabled title="Chegue ao nível de liberação da rota final">☄ ${esc(sit.evento.nome)} (nível ${final.libera})</button>`;
  if (!sit.ok) return `<button class="btn ghost" disabled title="Uma tentativa a cada 8 horas">☄ ${esc(sit.evento.nome)} — ⏳ ${formatarEspera(sit.esperaMs || 0)}</button>`;
  return `<button class="btn" data-act="mp-evento" ${dis} title="Muito difícil. Quem ficar sem Pokémon pode usar Revive enquanto o grupo aguenta.">☄ Chefe da semana: ${esc(sit.evento.nome)}</button>`;
}
