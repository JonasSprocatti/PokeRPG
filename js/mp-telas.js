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
import { cartao } from './mp-cartao.js';
import { meuId, membroDe, diarioMP } from './mp-rede.js';
import { minhaMochila, ctxDaSala } from './mp-resultado.js';
import { MAX_JOGADORES, raideSemRun, entradaEfetiva, usaRun, minhaVezDe, jogaveis, inimigosDe, todosProntos,
  raideDisponiveis, itensComunsDisponiveis, podeReviver, revivesRestantes, resumoDaConfig } from './mp-regras.js';
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

/* ---------- menu (fora da sala) ---------- */
export function telaMenuMP(msg = '', menu = { entrada: { tipo: 'run', id: null }, hallEscolha: { selecao: [], equipamento: {} } }) {
  G.mode = 'mp'; limparTopo();
  const entrada = menu.entrada;
  const bloqueio = !nuvemConfigurada() ? 'O multiplayer precisa do modo online, que ainda não foi configurado neste site (<code>js/config.js</code>).'
    : offline() ? '📴 Sem internet: o multiplayer volta quando a conexão voltar.' : '';
  const P = G.S?.player, conv = entrada.tipo === 'convidado', hall = entrada.tipo === 'hall';
  const opcaoRun = temRun()
    ? `<button class="abil ${entrada.tipo === 'run' ? 'on' : ''}" data-act="mp-entrada" data-v="run" aria-pressed="${entrada.tipo === 'run'}"><b>🎒 O Pokémon da minha run</b><small>${esc(P.nick || fmt(P.name))}, Nv. ${P.level}${(G.S.aliados || []).length ? ` (+ aliados, se a sala pedir)` : ''}. A luta mexe na run: XP, HP${DIFICULDADES[dificuldadeDe(G.S)].permadeath ? ', e desmaiar acaba a run (Roguelike)' : ''}.</small></button>`
    : '<p class="small muted">Sem run em andamento: escolha um Pokémon convidado ou do Hall da Fama.</p>';
  const escolha = `<h3>Com qual Pokémon?</h3>
    <div class="abils">${opcaoRun}
      <button class="abil ${conv ? 'on' : ''}" data-act="mp-entrada" data-v="convidado" aria-pressed="${conv}"><b>✨ Um Pokémon convidado</b><small>Emprestado só pra sala: não mexe na sua run, não ganha recompensa, sem risco. Os iniciais, Pikachu, Eevee e o que você desbloqueou no Roguelike.</small></button>
      <button class="abil ${hall ? 'on' : ''}" data-act="mp-entrada" data-v="hall" aria-pressed="${hall}"><b>🏟 Meus Pokémon do Hall da Fama</b><small>Até ${MAX_TIME_HALL} campeões de jornadas Roguelike/Hardcore já terminadas, no nível de verdade deles. Como o convidado: não mexe em run nenhuma nem ganha recompensa — mas sem ser um Nv. 5.</small></button></div>
    ${conv ? `<div class="picks" style="margin-top:10px">${especiesConvidado().map(e => `<button class="pick ${entrada.id === e.id ? 'on' : ''}" data-act="mp-convidado" data-v="${e.id}" aria-pressed="${entrada.id === e.id}"><img src="${SPR(e.id)}" alt="" loading="lazy">${esc(e.nome)}</button>`).join('')}</div>` : ''}
    ${hall ? `<div style="margin-top:10px">${htmlHallPicker(menu.hallEscolha)}</div>` : ''}`;
  $('#app').innerHTML = `<main class="create">
    ${barraTelas('mp')}
    <h1>Multiplayer.</h1>
    <p class="lead">Chame amigos pra sua run (co-op contra selvagens e Alfas) ou lute contra eles (PvP: 1×1, 2×2, 3×3, 2×1…), com seus aliados. Por padrão o nível de todo mundo é balanceado.</p>
    ${msg ? `<p class="notice">${msg}</p>` : ''}
    ${bloqueio ? `<div class="notice">${bloqueio}</div>` : `
    <section class="pv conta"><div>
      ${escolha}
      <h3 style="margin-top:22px">Criar uma sala</h3>
      <p class="muted">Você vira o anfitrião: escolhe co-op ou PvP, quantos Pokémon cada um leva e se balanceia.${temRun() ? '' : ' Sem run em andamento, a sala só pode ser PvP (co-op é jogar a run de alguém).'}</p>
      <button class="btn big" data-act="mp-criar">Criar sala</button>
      <h3 style="margin-top:22px">Entrar com código</h3>
      <span class="subrow"><input id="mp-codigo" maxlength="4" placeholder="EX.: K7Q2" autocomplete="off" aria-label="Código da sala" style="text-transform:uppercase"><button class="btn ghost" data-act="mp-entrar">Entrar</button></span>
    </div></section>`}
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
  clearInterval(sala.relogio);
  sala.relogio = setInterval(() => { const el = $('#mp-relogio'); if (el && G.sala?.prazo) el.textContent = Math.max(0, Math.ceil((G.sala.prazo - Date.now()) / 1000)) + 's'; }, 1000);
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

const cartaoMembro = m => `<div class="mp-membro"><b class="mp-nome">${htmlIcone(m.icone, 'icone-mini')}${m.anfitriao ? '👑 ' : ''}${esc(m.nome)}${iconeDaBadge(m.badge)}${m.id === meuId() ? ' (você)' : ''}${G.sala.config.modo === 'raide' ? ` ${m.pronto ? '✅ pronto' : '⏳ escolhendo…'}` : ''}</b>
  <div class="mp-mons">${(m.mons || []).slice(0, G.sala.config.porJogador).map(x => cartao(x, x.convidado ? '✨ convidado (não é da run)' : x.hall ? '🏟 Hall da Fama' : '')).join('')}</div></div>`;
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
export function renderSala() {
  try { desenharSala(); }
  catch (e) {
    console.error('renderSala', e);
    const el = $('#mp-acoes');
    if (el) el.innerHTML = `<p class="notice">Algo quebrou ao desenhar esta parte da sala: <b>${esc(e.message)}</b>.<br>Manda esse texto em 🐞 Bugs e sugestões, por favor — dá pra sair e entrar de novo na sala enquanto isso.</p>
      <div class="subrow"><button class="btn ghost" data-act="mp-sair">Sair da sala</button></div>`;
  }
}
function desenharSala() {
  const sala = G.sala;
  if (!sala || G.mode !== 'mp' || !$('#mp-topo')) return;
  const b = sala.batalha, cfg = sala.config, pvp = cfg.modo === 'pvp', z = ZONES.find(x => x.id === sala.zona) || ZONES[0];
  const cabecalho = `<div class="mp-cab"><h1>Sala <span class="codigo">${esc(sala.codigo)}</span></h1>
    <p class="muted">${sala.anfitriao ? 'Você é o anfitrião. Passe o código pros amigos.' : 'O anfitrião configura e começa.'} · ${sala.membros.length}/${MAX_JOGADORES} jogadores · ${resumoDaConfig(cfg, z.name)}</p>
    ${barraConexao()}</div>`;
  if (!b) return renderLobby(cabecalho, pvp, z);
  const dono = id => id === 'ia' ? '' : (membroDe(id)?.nome || 'jogador que saiu') + (id === meuId() ? ' (você)' : '');
  const vez = minhaVez();
  $('#mp-topo').innerHTML = cabecalho + `
    <div class="mp-campo"><div class="mp-lado inimigo">${b.lados.B.map(m => cartao(m, dono(m.dono), vez?.ref === m.ref)).join('')}</div>
    <div class="mp-lado">${b.lados.A.map(m => cartao(m, dono(m.dono), vez?.ref === m.ref)).join('')}</div></div>`;
  const esperando = [...new Set(jogaveis(b).filter(m => !sala.acoesFeitas.includes(m.ref)).map(m => membroDe(m.dono)?.nome || '?'))];
  const status = `<p class="muted small">Turno ${b.turno} · ${esperando.length ? `esperando: ${esperando.map(esc).join(', ')}` : 'resolvendo…'} · <span id="mp-relogio">${Math.max(0, Math.ceil((sala.prazo - Date.now()) / 1000))}s</span></p>`;
  const sair = `<button class="btn ghost" data-act="mp-sair">Sair da sala</button>`;
  if (!jogaveis(b).some(m => m.dono === meuId())) {
    $('#mp-acoes').innerHTML = status + `<p class="muted">Seus Pokémon estão fora da luta; ${b.evento ? 'o grupo segura enquanto você volta com um Revive, ou torça pelo seu time!' : 'torça pelo seu time!'}</p>${botoesReviver(b)}${botoesRaide(b)}<div class="subrow">${sair}</div>`; return;
  }
  if (!vez) { $('#mp-acoes').innerHTML = status + `<p class="muted">Escolhas enviadas.</p>${botoesRaide(b)}${botoesReviver(b)}<div class="subrow">${sair}</div>`; return; }
  const alvos = inimigosDe(b, vez); if (!alvos.some(e => e.ref === sala.alvo)) sala.alvo = alvos[0]?.ref;
  // Golpes disponíveis: regras.golpesPermitidos (Choice, Colete, Taunt, Encore, Disable, Torment e PP) — a mesma
  // função de render.js/arena.js. Nenhum permitido = Struggle, senão a sala travaria sem botão clicável.
  const permitidos = golpesPermitidos(vez);
  const semPP = !permitidos.length;
  const gd = gimmicksDisponiveisMP(b, vez), zLigado = !!(gd && sala.gimmicksSel?.z);   // com o Z ligado, só os golpes que podem virar Z ficam clicáveis
  // reordenar (▲▼) não gasta turno; fica fora do <button> de atacar (não dá pra aninhar <button> em <button>)
  const moverMP = (i, dir) => `<button class="btn ghost sm" data-act="mp-golpe-mover" data-v="${i}" data-dir="${dir}" ${(dir < 0 ? i === 0 : i === vez.moves.length - 1) ? 'disabled' : ''} title="${dir < 0 ? 'Subir' : 'Descer'}">${dir < 0 ? '▲' : '▼'}</button>`;
  $('#mp-acoes').innerHTML = status + `<p class="mp-quem">Vez de <b>${esc(vez.nome)}</b></p>` + resumoTravas(vez).map(t => `<p class="small muted">${esc(t)}</p>`).join('') + botoesGimmickMP(gd) +
    (alvos.length > 1 ? `<div class="subrow">Alvo: ${alvos.map(m => `<button class="btn ${m.ref === sala.alvo ? '' : 'ghost'} sm" data-act="mp-mirar" data-v="${m.ref}">${esc(m.nome)}</button>`).join('')}</div>` : '') +
    `<div class="moves">${semPP ? '<button class="mv" style="--c:#A8A77A" data-act="mp-golpe" data-v="-1"><b>Struggle</b><small>Sem PP.</small></button>'
      : vez.moves.map((g0, i) => { const g = golpeDoBattleBond(golpeDoTera(golpeDoClima(g0, climaDe(b.campo)), vez), vez); const preso = !permitidos.includes(g0); return `<div class="mv-cel"><button class="mv" style="--c:${TC[g.type] || '#888'}" data-act="mp-golpe" data-v="${i}" ${g.ppLeft <= 0 || preso || (zLigado && !golpeZ(gd.p, g)) ? 'disabled' : ''}><b>${esc(fmt(g.name))}</b><small>${TYPE_PT[g.type] || g.type}, ${CLS_PT[g.cls]}, poder ${g.power ?? '—'}</small><span class="pp">PP ${g.ppLeft}/${g.pp}</span></button><span class="mv-ordem">${moverMP(i, -1)}${moverMP(i, 1)}</span></div>`; }).join('')}</div>
    ${botoesItemComum()}
    ${botoesRaide(b)}
    ${botoesReviver(b)}
    <div class="subrow">${b.pvp ? '<button class="btn ghost" data-act="mp-desistir">Desistir</button>' : b.evento ? '' : '<button class="btn ghost" data-act="mp-fugir">Fugir</button>'}${sair}</div>`;
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
/* Minha seleção do Hall da Fama + Loja de preparo, usada em DOIS lugares: dentro da Sala de Raide (`sala.hallSel`)
   e no menu, antes de criar/entrar, quando a entrada é 'hall' (`hallEscolha`) — cada um mexe só na PRÓPRIA conta
   (hallDaConta/saldoArenaDaConta já são locais, sem run nenhuma). */
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
function htmlRaideSelecao() {
  const sala = G.sala;
  return htmlHallPicker(sala.hallSel, sala.ocupado) +
    `<div class="subrow"><button class="btn ${sala.pronto ? '' : 'ghost'} big" data-act="mp-pronto" ${sala.ocupado ? 'disabled' : ''}>${sala.pronto ? '✅ Pronto! (toque pra voltar a escolher)' : 'Marcar como pronto'}</button></div>`;
}
/* "Com qual Pokémon?" DENTRO da sala (lobby, co-op e PvP). A mesma escolha do menu, repetida aqui porque foi
   exatamente o que faltou: quem já tinha criado/entrado na sala não tinha como chegar na opção do Hall da Fama e
   ficava preso ao convidado de Nv. 5. Não existe na Sala de Raide (lá o Hall é obrigatório pra todos). */
function htmlEntradaNaSala() {
  const sala = G.sala;
  if (sala.batalha || raideSemRun(sala)) return '';
  const t = entradaEfetiva(sala), dis = sala.ocupado ? 'disabled' : '';
  const op = (v, rotulo, dica, off = false) => `<button class="abil ${t === v ? 'on' : ''}" data-act="mp-entrada-sala" data-v="${v}" aria-pressed="${t === v}" ${off || dis ? 'disabled' : ''}><b>${rotulo}</b><small>${dica}</small></button>`;
  return `<section class="pv conta"><div><h3>Com qual Pokémon você entra?</h3>
    <div class="abils">
      ${op('run', '🎒 O da minha run', temRun() ? `${esc(G.S.player.nick || fmt(G.S.player.name))}, Nv. ${G.S.player.level}. A luta conta pra sua jornada (XP, HP, itens).` : 'Você não tem nenhuma jornada em andamento.', !temRun())}
      ${op('hall', '🏟 Meus Pokémon do Hall da Fama', `Até ${MAX_TIME_HALL} campeões de jornadas já terminadas, no nível de verdade. Não mexe em save nenhum.`)}
      ${op('convidado', '✨ Um Pokémon convidado', 'Emprestado só pra sala, Nv. 5. Não mexe em save nenhum.')}
    </div>
    ${t === 'convidado' ? `<div class="picks" style="margin-top:10px">${especiesConvidado().map(e => `<button class="pick ${sala.convidado?.data?.id === e.id ? 'on' : ''}" data-act="mp-convidado-sala" data-v="${e.id}" ${dis}><img src="${SPR(e.id)}" alt="" loading="lazy">${esc(e.nome)}</button>`).join('')}</div>` : ''}
    </div></section>
    ${t === 'hall' ? htmlHallPicker(sala.hallSel, sala.ocupado) : ''}`;
}
function renderLobby(cabecalho, pvp, z) {
  const sala = G.sala, cfg = sala.config, dis = sala.ocupado ? 'disabled' : '', raide = cfg.modo === 'raide';
  const time = t => sala.membros.filter(m => (m.time || 'B') === t);
  $('#mp-topo').innerHTML = cabecalho + (pvp
    ? `<div class="mp-times">${['A', 'B'].map(t => `<div class="mp-time"><h3>Time ${t} <small class="muted">(${time(t).length})</small></h3>${time(t).map(cartaoMembro).join('') || '<p class="small muted">Ninguém ainda.</p>'}</div>`).join('')}</div>`
    : `<div class="mp-grupo">${sala.membros.map(cartaoMembro).join('')}</div>`);
  const trocarTime = pvp ? `<div class="subrow">Seu time: ${['A', 'B'].map(t => `<button class="btn ${sala.time === t ? '' : 'ghost'} sm" data-act="mp-time" data-v="${t}" ${dis}>Time ${t}</button>`).join('')}</div>` : '';
  const sair = '<button class="btn ghost" data-act="mp-sair">Sair da sala</button>';
  if (!sala.anfitriao) {
    if (raide) { $('#mp-acoes').innerHTML = htmlRaideSelecao() + `<p class="muted">${sala.ocupado ? 'Buscando os Pokémon…' : 'Esperando todo mundo ficar pronto e o anfitrião começar.'}</p><div class="subrow">${sair}</div>`; return; }
    $('#mp-acoes').innerHTML = trocarTime + centroNaSala() + htmlEntradaNaSala() + `<p class="muted">${sala.ocupado ? 'Aplicando o resultado…' : 'Esperando o anfitrião começar.'}</p><div class="subrow">${sair}</div>`; return;
  }
  const zonas = temRun() ? rotasAtuais().filter(x => zonaLiberada(x, G.S.player.level, G.S)) : []; // rotas do mapa (Gen) da run
  // amigos (com conta) que ainda não estão na sala: um toque manda o convite
  const naSalaIds = new Set(sala.membros.map(m => m.id));
  const amigosFora = usuario() ? nuvem.amigos.filter(a => a.status === 'aceita' && !naSalaIds.has(a.amigo)) : [];
  const convites = amigosFora.length ? `<div class="mp-convites"><b>Chamar amigos:</b> ${amigosFora.map(a => `<button class="btn ghost sm" data-act="mp-convidar" data-v="${a.amigo}">${htmlIcone({ id: a.icone_id, shiny: a.icone_shiny }, 'icone-mini')} ${esc(a.apelido)}${htmlInsigniaDe(a.badge_exibida)}</button>`).join('')}</div>`
    : usuario() ? '' : '<p class="small muted">Entre na conta pra chamar amigos direto (sem precisar passar o código).</p>';
  const podePvp = time('A').length && time('B').length;
  if (raide) {
    const prontos = todosProntos(sala.membros);
    $('#mp-acoes').innerHTML = `<div class="mp-config">
        <label class="campo">Modo<select data-mp-cfg="modo" ${dis}><option value="coop" ${temRun() ? '' : 'disabled'}>Co-op (contra selvagens / Alfa)${temRun() ? '' : ' — precisa de uma run'}</option><option value="pvp">PvP (Time A × Time B)</option><option value="raide" selected>☄ Sala de Raide (Hall da Fama, sem run)</option></select></label>
        <label class="campo">Pokémon por jogador<select data-mp-cfg="porJogador" ${dis}>${[1, 2, 3].map(n => `<option value="${n}" ${cfg.porJogador === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      </div>
      <p class="small muted">Cada jogador escolhe do PRÓPRIO Hall da Fama, compra e equipa da PRÓPRIA Loja de preparo. Quando todo mundo estiver ✅ pronto, comece a Raide.</p>
      ${convites}${htmlRaideSelecao()}
      <div class="subrow"><button class="btn big" data-act="mp-evento" ${dis || !prontos ? 'disabled' : ''} title="${prontos ? '' : 'Espere todo mundo escolher os Pokémon e marcar \'pronto\''}">☄ Começar a Raide</button>${sair}</div>`;
    return;
  }
  $('#mp-acoes').innerHTML = `<div class="mp-config">
      <label class="campo">Modo<select data-mp-cfg="modo" ${dis}><option value="coop" ${!pvp ? 'selected' : ''} ${temRun() ? '' : 'disabled'}>Co-op (contra selvagens / Alfa)${temRun() ? '' : ' — precisa de uma run'}</option><option value="pvp" ${pvp ? 'selected' : ''}>PvP (Time A × Time B)</option><option value="raide">☄ Sala de Raide (Hall da Fama, sem run)</option></select></label>
      <label class="campo">Pokémon por jogador<select data-mp-cfg="porJogador" ${dis}>${[1, 2, 3].map(n => `<option value="${n}" ${cfg.porJogador === n ? 'selected' : ''}>${n}${n === 1 ? ' (só o principal)' : ' (com aliados)'}</option>`).join('')}</select></label>
      ${pvp ? '' : `<label class="campo">Zona<select data-mp-cfg="zona" ${dis}>${zonas.map(x => `<option value="${x.id}" ${x.id === sala.zona ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>`}
      <label class="check"><input type="checkbox" data-mp-cfg="balancear" ${cfg.balancear ? 'checked' : ''} ${dis}> Balancear níveis
        <small class="muted">${pvp ? 'Todos no nível médio da luta; o time menor ganha HP extra.' : 'O grupo todo no nível do seu Pokémon. Quem tiver o nível ajustado joga por diversão: não leva XP nem itens pra própria run.'} Desligado: níveis reais${pvp ? '' : ', cada um leva o que ganhar pra própria run, e os inimigos acompanham o mais forte'} (mais difícil).</small></label>
    </div>${trocarTime}${centroNaSala()}${convites}${htmlEntradaNaSala()}
    <div class="subrow">${pvp
      ? `<button class="btn big" data-act="mp-pvp" ${dis || !podePvp ? 'disabled' : ''} title="${podePvp ? '' : 'Cada time precisa de pelo menos um jogador'}">⚔ Começar PvP</button>`
      : `<button class="btn big" data-act="mp-explorar" ${dis}>🌿 Explorar juntos</button>${z.chefe ? `<button class="btn" data-act="mp-alfa" ${dis}>⚔ Desafiar o Alfa (${z.chefe.nome})</button>` : ''}${botaoEventoMP(dis)}`}${sair}</div>`;
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
