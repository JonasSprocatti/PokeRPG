/* ============ 🏟 Arena do Chefe ============
   Enfrentar o chefe da semana (evento.js) com os Pokémon do Hall da Fama (hall.js), SEM precisar estar numa run: o Pokémon principal de
   cada jornada Roguelike/Hardcore que terminou fica guardado com o nível que tinha, e aqui você leva de 1 a 3 deles contra o chefe de
   agora — sem passar por 8 Gens até o Eternatus.
   A luta usa o MESMO motor puro do co-op (mp-motor.js): um "lado A" com os seus Pokémon e um "lado B" com o chefe, sem nenhum save no
   meio — por isso a Arena nunca mexe numa jornada em andamento (nem pode estragar o save dela). Cura, revive, itens de stat e itens de
   segurar têm sua PRÓPRIA "mochila" de conta (Loja de preparo, comprada com saldo — ver htmlLoja/arenaComprarComum/arenaComprarSegurado),
   já que não há run nenhuma com dinheiro/mochila de verdade por trás. Diferença pra luta dentro de uma run: sem Mega/Tera/Z-Move/
   Gigantamax (o motor do co-op não tem isso). Perder não custa nada.
   Tentativa: a mesma de 8 horas do resto do evento. Prêmio: o Pokémon do chefe na Pokédex, a insígnia e o título (só na 1ª vitória), e
   os itens de raide do prêmio da semana (uma vez por semana) — dinheiro e Rare Candy ficam pras lutas DENTRO de uma run. */
import { G } from './estado.js';
import { $, limparTopo, logRaw } from './ui.js';
import { barraTelas, rotuloVoltar } from './navegacao.js';
import { SPR, SPR_SHINY, ITEMS, API, TC, TYPE_PT, CLS_PT } from './dados.js';
import { hallDaConta, registrarVitoriaDeEvento, saldoArenaDaConta } from './carreira.js';
import { EVENTOS, eventoDaSemana, jaComecou, idDaSemana, agoraDoEvento, esperaRestante, ultimaTentativaEfetiva, registrarTentativa, formatarEspera, dataBR,
  inventarioRaide, darItensDeRaide, gastarItemDeRaide, INICIO, BETA_SEM_ESPERA } from './evento.js';
import { prepararChefe, nivelDoChefe, jogadoresEfetivos, habilidadeDoChefe, aplicarClimaDoChefe, ITENS_DE_RAIDE, ITEM_DO_RAIDE } from './boss.js';
import { fotoDoMon, novaBatalhaMP, resolverTurnoMP, acaoDaIA, usarRaideNoEvento, reviverCompanheiro, MAX_REVIVES } from './mp-motor.js';
import { cartao, SEM_BATALHA_MP } from './multiplayer.js';
import { htmlComoFuncionam } from './ajuda-chefes.js';
import { CLIMA_TURNOS, ESPERTEZA, golpeDoClima, climaDe, moverGolpe, itemTemEfeito, golpesPermitidos, resumoTravas } from './regras.js';
import { loadPokemon, loadMove, apiErr } from './api.js';
import { makeMon } from './pokemon.js';
import { sincronizarComRetentativa, usuario } from './nuvem.js';
import { esc, fmt } from './util.js';
import { MAX_TIME_HALL, htmlLojaConta, htmlEquiparConta, comprarComumConta, comprarSeguradoConta, reidratarHall, CURA_ARENA, STATS_ARENA } from './loja-conta.js';

const MAX_TIME = MAX_TIME_HALL;
const DONO = 'eu';
let selecao = [];            // chaves do Hall escolhidas (na ordem)
let equipamento = {};        // chave do Hall → id do item de segurar escolhido pra ESTA equipe
let arena = null;            // luta em andamento (ou terminada): { ev, estado, escolhas, log, fim, ocupado }

/* ---------- montar a luta ---------- */
// item de segurar escolhido na Loja de preparo pra esta equipe (equipamento[chave]) — a Arena não guarda
// equipamento entre lutas (o Hall não tem esse campo), então isto é decidido de novo a cada tentativa
async function montarLuta(ev, entradas) {
  const mons = await Promise.all(entradas.map(e => reidratarHall(e, equipamento[e.chave])));
  const nivel = Math.max(...mons.map(m => m.level));
  const E = await makeMon(await loadPokemon(ev.formaId), nivelDoChefe(nivel), { ivs: Object.fromEntries(['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map(s => [s, 31])),
    shiny: false, ability: habilidadeDoChefe(ev.chefe) || undefined });
  const golpes = (await Promise.all((ev.golpes || []).map(n => loadMove(`${API}/move/${n}/`).catch(() => null)))).filter(Boolean).map(m => ({ ...m, ppLeft: m.pp }));
  if (golpes.length) E.moves = golpes;
  prepararChefe(E, jogadoresEfetivos(1, mons.length), ev.chefe);
  const estado = novaBatalhaMP(mons.map((m, i) => fotoDoMon(m, 'A' + i, DONO, null, i)), [fotoDoMon(E, 'B0', 'ia', ev.nome)], { evento: ev.id });
  aplicarClimaDoChefe(estado.campo, ev.chefe, CLIMA_TURNOS);
  return estado;
}

/* ---------- a tela ---------- */
export function telaArena(msg = '') {
  G.mode = 'arena'; limparTopo();
  $('#app').innerHTML = `<main class="create arena">
    ${barraTelas('arena')}
    <h1>Arena do Chefe.</h1>
    ${msg ? `<p class="notice">${msg}</p>` : ''}
    <div id="arena-corpo"></div>
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">${rotuloVoltar()}</button></div></main>`;
  renderArena();
}
function renderArena() {
  const el = $('#arena-corpo'); if (!el || G.mode !== 'arena') return;
  el.innerHTML = arena ? htmlLuta() : htmlLobby();
  if (arena) for (const l of arena.log) logRaw(l);   // o registro é recriado a cada desenho da tela
}

function htmlLobby() {
  const agora = agoraDoEvento(), ev = eventoDaSemana(agora), hall = hallDaConta();
  const comecou = jaComecou(agora), espera = esperaRestante(ultimaTentativaEfetiva(), agora);
  const alvo = ev || EVENTOS[0];
  const chefe = `<div class="chefe-box evento ${comecou ? '' : 'em-breve'}"><img src="${SPR(alvo.formaId)}" alt="">
    <div><b>${comecou ? '☄ CHEFE DA SEMANA' : '☄ EM BREVE'}: ${esc(alvo.nome)}</b> <span class="muted">Gen ${alvo.gen}</span>
    <small>${esc(alvo.resumo)}</small>
    <small>${comecou ? 'Muda na próxima segunda-feira, meia-noite (Brasília).' : `O primeiro chefe chega em <b>${dataBR(INICIO)}</b>.`} ${BETA_SEM_ESPERA ? '🧪 Modo beta: sem espera entre tentativas.' : 'Uma tentativa a cada 8 horas.'}</small></div></div>`;
  // A Arena é só você (Hall da Fama, sem risco). Pra jogar em GRUPO de verdade — até 6 jogadores reais, 3 Pokémon
  // cada — é outra tela (multiplayer.js): sala co-op, onde o botão "☄ Chefe da semana" aparece pra quem tem uma
  // run Roguelike/Hardcore. Pedido do usuário (28/09/2026): deixar esse caminho claro a partir da própria Arena.
  const chamarJogadores = `<section class="pv conta"><div><h3>👥 Jogar em grupo</h3>
    <p class="small muted">Esta Arena aqui é só você, com Pokémon do Hall da Fama — sem risco, mas sem outros jogadores. Pra enfrentar o chefe da semana <b>em grupo de verdade</b> (até 6 jogadores, 3 Pokémon cada), crie ou entre numa sala no Multiplayer: quem tiver uma run Roguelike ou Hardcore em andamento vê o botão "☄ Chefe da semana" lá dentro.</p>
    <button class="btn ghost" data-act="mp">Ir pro Multiplayer</button></div></section>`;
  const inv = inventarioRaide(), saldo = saldoArenaDaConta();
  // itens de raide (boss.js): SÓ de prêmio, como sempre — não entram na Loja de preparo (pedido do usuário)
  const itensRaide = ITENS_DE_RAIDE.map(t => `<li>${esc(ITEMS[ITEM_DO_RAIDE[t]].name)} <b>×${inv[ITEM_DO_RAIDE[t]] || 0}</b></li>`).join('');
  const escolhidos = new Set(selecao);
  const cartaoHall = e => { const on = escolhidos.has(e.chave), cheio = !on && selecao.length >= MAX_TIME;
    return `<button class="hall-card ${on ? 'on' : ''}" data-act="arena-sel" data-v="${esc(e.chave)}" ${cheio ? 'disabled' : ''} aria-pressed="${on}">
      <img src="${e.shiny ? SPR_SHINY(e.id) : SPR(e.id)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${SPR(e.id)}'">
      <b>${e.shiny ? '✨ ' : ''}${esc(e.nick || fmt(e.nome))}</b><span class="muted small">Nv. ${e.nivel} · Gen ${e.gen}</span>
      <small class="muted">${esc(fmt(e.dificuldade))} · ${e.motivo === 'venceu' ? '🏆 venceu' : e.motivo === 'desmaiou' ? 'desmaiou' : e.motivo === 'capturado' ? 'capturado' : 'encerrou'}</small></button>`; };
  const podeIniciar = comecou && espera === 0 && selecao.length >= 1;
  const rotuloBotao = !comecou ? `🗓 O evento começa em ${dataBR(INICIO)}` : espera > 0 ? `⏳ Próxima tentativa em ${formatarEspera(espera)}` : selecao.length ? `☄ Enfrentar com ${selecao.length} Pokémon` : 'Escolha de 1 a 3 Pokémon do Hall';
  return `${chefe}
    ${chamarJogadores}
    ${htmlComoFuncionam()}
    <section class="pv conta"><div><h3>Seu Hall da Fama</h3>
      <p class="small muted">O Pokémon principal de cada jornada <b>Roguelike ou Hardcore</b> que você termina entra aqui, com o nível que tinha. Escolha de 1 a ${MAX_TIME} pra enfrentar o chefe. Não usa nenhuma jornada em andamento.</p>
      ${hall.length ? `<div class="hall-lista">${hall.map(cartaoHall).join('')}</div>`
        : '<p class="notice">Seu Hall da Fama está vazio. <b>Termine (ou encerre) uma jornada Roguelike ou Hardcore</b> e o Pokémon dela aparece aqui, pronto pra Arena.</p>'}</div></section>
    ${htmlEquipar(hall)}
    ${htmlLoja(saldo)}
    <section class="pv conta"><div><h3>🏆 Itens de raide</h3>
      <p class="small muted">Só valem contra o chefe, um de cada tipo por luta. Vêm de prêmio dos chefes, ou do que sobra numa jornada que termina — não se compram.</p>
      <ul class="raide-lista">${itensRaide}</ul></div></section>
    <div class="subrow"><button class="btn big" data-act="arena-iniciar" ${podeIniciar ? '' : 'disabled'}>${rotuloBotao}</button></div>`;
}

// Loja de preparo e "quem equipa o quê" (js/loja-conta.js, compartilhado com a Sala de Raide): NÃO vende os
// itens de raide (esses continuam só de prêmio, ver ITENS_DE_RAIDE abaixo).
const htmlLoja = saldo => htmlLojaConta(saldo, 'arena-comprar-comum', 'arena-comprar-segurado');
const htmlEquipar = hall => htmlEquiparConta(
  selecao.map(chave => hall.find(x => x.chave === chave)).filter(Boolean).map(e => ({ chave: e.chave, rotulo: e.nick || fmt(e.nome) })),
  equipamento, 'data-arena-equipar');

function htmlLuta() {
  const b = arena.estado, fim = arena.fim, vez = fim ? null : proximoSemEscolha();
  const chefe = b.lados.B[0];
  const campo = `<div class="mp-campo"><div class="mp-lado inimigo">${b.lados.B.map(m => cartao(m, '', false)).join('')}</div>
    <div class="mp-lado">${b.lados.A.map(m => cartao(m, '', vez?.ref === m.ref)).join('')}</div></div>`;
  let acoes = '';
  if (fim) {
    acoes = `<p class="${fim === 'A' ? 'selo-recorde' : 'notice'}">${fim === 'A' ? `🏆 ${esc(arena.ev.nome)} foi derrotado!` : `${esc(arena.ev.nome)} foi forte demais desta vez. Dá pra tentar de novo daqui a algumas horas — perder não custa nada.`}</p>
      <div class="subrow"><button class="btn big" data-act="arena-fim">Voltar à Arena</button></div>`;
  } else if (vez) {
    // Golpes disponíveis: regras.golpesPermitidos (Choice, Colete, Taunt, Encore, Disable, Torment e PP) — a mesma
    // função de render.js e da sala. Nenhum permitido = Struggle, senão a Raide travaria sem botão clicável.
    const permitidos = golpesPermitidos(vez);
    const semPP = !permitidos.length;
    // reordenar (▲▼) não gasta turno — muda só a ordem em vez.moves, fora do <button> de atacar (não dá pra
    // aninhar <button> dentro de <button>, então cada golpe vira um "mv-cel" com os dois lado a lado.
    const mover = (i, dir) => `<button class="btn ghost sm" data-act="arena-golpe-mover" data-v="${i}" data-dir="${dir}" ${(dir < 0 ? i === 0 : i === vez.moves.length - 1) ? 'disabled' : ''} title="${dir < 0 ? 'Subir' : 'Descer'}">${dir < 0 ? '▲' : '▼'}</button>`;
    acoes = `<p class="muted small">Turno ${b.turno} · <b>Vez de ${esc(vez.nome)}</b></p>
      ${resumoTravas(vez).map(t => `<p class="small muted">${esc(t)}</p>`).join('')}
      <div class="moves">${semPP ? '<button class="mv" style="--c:#A8A77A" data-act="arena-golpe" data-v="-1"><b>Struggle</b><small>Sem PP.</small></button>'
        : vez.moves.map((g0, i) => { const g = golpeDoClima(g0, climaDe(b.campo)); const preso = !permitidos.includes(g0); return `<div class="mv-cel"><button class="mv" style="--c:${TC[g.type] || '#888'}" data-act="arena-golpe" data-v="${i}" ${g.ppLeft <= 0 || preso ? 'disabled' : ''}><b>${esc(fmt(g.name))}</b><small>${TYPE_PT[g.type] || g.type}, ${CLS_PT[g.cls]}, poder ${g.power ?? '—'}</small><span class="pp">PP ${g.ppLeft}/${g.pp}</span></button><span class="mv-ordem">${mover(i, -1)}${mover(i, 1)}</span></div>`; }).join('')}</div>
      ${botoesItemComum(vez)}
      ${botoesRaide(chefe)}
      ${botoesReviver()}
      <div class="subrow"><button class="btn ghost" data-act="arena-desistir">Desistir</button></div>`;
  } else acoes = `<p class="muted">Resolvendo o turno…</p>`;
  return `${campo}<div class="textbox"><div id="log" class="log" aria-live="polite"></div></div><div class="actions">${acoes}</div>`;
}
const proximoSemEscolha = () => arena.estado.lados.A.find(m => m.hp > 0 && !arena.escolhas[m.ref]);
function botoesRaide(chefe) {
  const inv = inventarioRaide();
  const l = ITENS_DE_RAIDE.filter(t => (inv[ITEM_DO_RAIDE[t]] || 0) > 0 && !chefe?.boss?.raide?.[t]);
  return l.length ? `<div class="subrow">${l.map(t => `<button class="btn ghost sm" data-act="arena-raide" data-v="${t}" title="${esc(ITEMS[ITEM_DO_RAIDE[t]].desc)}">🎒 ${esc(ITEMS[ITEM_DO_RAIDE[t]].name)} ×${inv[ITEM_DO_RAIDE[t]]}</button>`).join('')}</div>` : '';
}
// item comum (Potion, X Attack, curas...) ocupa a vez de quem usar, igual à run — SEM_BATALHA_MP tira revive
// (tem botão próprio, `botoesReviver`, porque o alvo é um CAÍDO, não quem está escolhendo)
function botoesItemComum(vez) {
  const inv = inventarioRaide();
  const l = [...CURA_ARENA, ...STATS_ARENA].filter(id => (inv[id] || 0) > 0 && !SEM_BATALHA_MP.some(f => ITEMS[id][f]) && itemTemEfeito(ITEMS[id], vez));
  return l.length ? `<details class="mp-itens"><summary>🎒 Usar item (${l.length})</summary><div class="bag-grid">${l.map(id => `<button class="item-btn sm" data-act="arena-usar-item" data-v="${id}" title="${esc(ITEMS[id].desc)}">${esc(ITEMS[id].name)} ×${inv[id]}</button>`).join('')}</div></details>` : '';
}
// reviver um caído (ação livre — não ocupa a vez de ninguém, mesmo estilo do item de raide): Revive/Max Revive
function botoesReviver() {
  const inv = inventarioRaide();
  if (!(inv.revive > 0 || inv['max-revive'] > 0)) return '';
  const usados = arena.estado.revivesUsados?.[DONO] || 0; if (usados >= MAX_REVIVES) return '';
  const caidos = arena.estado.lados.A.filter(m => m.hp <= 0);
  return caidos.length ? `<div class="subrow">${caidos.map(m => `<button class="btn ghost sm" data-act="arena-reviver" data-v="${m.ref}">❤ Reviver ${esc(m.nome)}</button>`).join('')}</div>` : '';
}
const registrar = (txt, cls = '') => { const l = { html: esc(txt), cls }; arena.log.push(l); logRaw(l); };

/* ---------- ações (main.js liga cada data-act) ---------- */
// Loja de preparo: cura/revive e stat compram várias vezes (se gastam no uso); segurado compra 1 vez só (não se gasta)
export function arenaComprarComum(id) {
  if (arena || G.mode !== 'arena') return;
  const r = comprarComumConta(id); if (!r.ok) return telaArena(r.motivo);
  telaArena(`Comprou ${ITEMS[id].name} por ₽${r.preco.toLocaleString('pt-BR')}.`);
}
export function arenaComprarSegurado(id) {
  if (arena || G.mode !== 'arena') return;
  const r = comprarSeguradoConta(id); if (!r.ok) return telaArena(r.motivo);
  telaArena(`Comprou ${ITEMS[id].name} por ₽${r.preco.toLocaleString('pt-BR')}. Escolha quem equipa em "🎽 Equipar item".`);
}
// item de segurar escolhido pra ESTA equipe (não gasta o item — pode trocar quantas vezes quiser até começar a
// luta). Um item físico só pode estar num Pokémon por vez: escolher o mesmo pra outro tira de quem tinha antes.
export function arenaEquipar(chave, id) {
  if (arena || G.mode !== 'arena' || !selecao.includes(chave)) return;
  if (id && !(inventarioRaide()[id] > 0)) return;
  if (id) { for (const c of Object.keys(equipamento)) if (equipamento[c] === id) delete equipamento[c]; equipamento[chave] = id; }
  else delete equipamento[chave];
  renderArena();
}
export function arenaSelecionar(chave) {
  if (arena) return;
  if (selecao.includes(chave)) { selecao = selecao.filter(c => c !== chave); delete equipamento[chave]; }
  else if (selecao.length < MAX_TIME) selecao = [...selecao, chave];
  renderArena();
}
export async function arenaIniciar() {
  if (arena || G.mode !== 'arena') return;
  const agora = agoraDoEvento(), ev = eventoDaSemana(agora);
  if (!ev || !jaComecou(agora) || esperaRestante(ultimaTentativaEfetiva(), agora) > 0) return telaArena();
  const hall = hallDaConta(), entradas = selecao.map(c => hall.find(e => e.chave === c)).filter(Boolean);
  if (!entradas.length) return telaArena('Escolha pelo menos 1 Pokémon do Hall da Fama.');
  $('#arena-corpo').innerHTML = '<p class="loading">Chamando o time e o chefe…</p>';
  try {
    const estado = await montarLuta(ev, entradas);
    registrarTentativa();                        // 1 tentativa a cada 8 horas: conta ao começar
    arena = { ev, estado, escolhas: {}, log: [], fim: null, ocupado: false };
    arena.log.push({ html: esc(`☄ ${ev.nome} (Nv. ${estado.lados.B[0].level}) surge! Imune a status, sem fuga. Perder não custa nada.`), cls: 'enc' });
    renderArena();
  } catch (e) { console.error(e); telaArena(`Não consegui montar a luta: ${esc(e.offline ? e.message : apiErr(e))}`); }
}
export function arenaGolpeMover(i, dir) {
  if (!arena || arena.fim || arena.ocupado) return;
  const m = proximoSemEscolha(); if (!m) return;
  m.moves = moverGolpe(m.moves, i, dir);
  renderArena();
}
export async function arenaGolpe(i) {
  if (!arena || arena.fim || arena.ocupado) return;
  const m = proximoSemEscolha(); if (!m) return;
  arena.escolhas[m.ref] = { ref: m.ref, tipo: 'golpe', golpe: +i, alvo: 'B0' };
  if (proximoSemEscolha()) return renderArena();   // ainda falta alguém do time escolher
  await resolverTurno();
}
// usar um item comum (cura, revive de estágio-X, PP...) EM VEZ de atacar — ocupa a vez, igual aos jogos e ao co-op
export async function arenaUsarItem(id) {
  if (!arena || arena.fim || arena.ocupado) return;
  const m = proximoSemEscolha(); if (!m) return;
  if (!(inventarioRaide()[id] > 0) || !itemTemEfeito(ITEMS[id], m)) return;
  arena.escolhas[m.ref] = { ref: m.ref, tipo: 'item', item: id };
  if (proximoSemEscolha()) return renderArena();
  await resolverTurno();
}
async function resolverTurno() {
  arena.ocupado = true; renderArena();
  const b = arena.estado, boss = b.lados.B[0];
  // itens comuns escolhidos neste turno (tipo:'item'): o motor já validou/aplicou — descontar da Loja de preparo
  const usados = Object.values(arena.escolhas).filter(a => a.tipo === 'item').map(a => a.item);
  try {
    const ia = boss.hp > 0 ? [acaoDaIA(b, boss, Math.random, ESPERTEZA.chefe)] : [];
    const { estado, eventos } = await resolverTurnoMP(b, [...Object.values(arena.escolhas), ...ia]);
    arena.log.push({ html: esc(`— Turno ${b.turno} —`), cls: 'turno' });
    for (const e of eventos) arena.log.push({ html: esc(e.txt), cls: e.cls });
    arena.estado = estado; arena.escolhas = {};
    for (const id of usados) gastarItemDeRaide(id);
    if (estado.fim) await finalizar(estado.fim);
  } catch (e) { console.error(e); registrar(`Algo deu errado neste turno: ${e.message}`, 'hit'); arena.escolhas = {}; }
  finally { arena.ocupado = false; renderArena(); }
}
export function arenaRaide(tipo) {
  if (!arena || arena.fim || arena.ocupado) return;
  const id = ITEM_DO_RAIDE[tipo]; if (!id || !(inventarioRaide()[id] > 0)) return;
  const r = usarRaideNoEvento(arena.estado, DONO, tipo);
  if (!r.ok) { registrar(r.motivo, 'muted'); return renderArena(); }
  gastarItemDeRaide(id);
  arena.log.push({ html: esc(`🎒 Você usou ${ITEMS[id].name}!`), cls: 'good' });
  for (const e of r.efeitos) if (e.dizer) arena.log.push({ html: esc(e.dizer), cls: e.cls || 'status' });
  renderArena();
}
// reviver um caído: ação livre, não ocupa a vez de ninguém. Prefere Max Revive (HP cheio) se tiver os dois.
export function arenaReviver(ref) {
  if (!arena || arena.fim || arena.ocupado) return;
  const inv = inventarioRaide();
  const usaMax = (inv['max-revive'] || 0) > 0, id = usaMax ? 'max-revive' : 'revive';
  if (!(inv[id] > 0)) return;
  const m = reviverCompanheiro(arena.estado, ref, DONO, usaMax ? 100 : 50);
  if (!m) return;
  gastarItemDeRaide(id);
  arena.log.push({ html: esc(`❤ Você usou ${ITEMS[id].name} em ${m.nome}!`), cls: 'good' });
  renderArena();
}
export function arenaDesistir() {
  if (!arena || arena.fim) return;
  arena.estado.fim = 'B'; arena.fim = 'B';
  registrar('Você desistiu da luta. A tentativa já foi gasta.', 'muted'); renderArena();
}
export function arenaFim() { arena = null; selecao = []; equipamento = {}; telaArena(); }

async function finalizar(fim) {
  arena.fim = fim;
  if (fim !== 'A') { registrar(`O time caiu. ${arena.ev.nome} vence desta vez.`, 'hit'); return; }
  const ev = arena.ev, r = registrarVitoriaDeEvento(ev, idDaSemana(agoraDoEvento()));
  registrar(`🏆 ${ev.nome} foi derrotado!`, 'level');
  if (r.semanaNova) {
    const itens = Object.fromEntries(Object.entries(ev.recompensa.itens || {}).filter(([k]) => ITEMS[k]?.raide));
    darItensDeRaide(itens);
    const txt = Object.entries(itens).map(([k, n]) => `${n}× ${ITEMS[k].name}`).join(', ');
    registrar(`Prêmio da semana: ${txt || 'nenhum item de raide'} (guardados na conta). Dinheiro e Rare Candy só saem em lutas dentro de uma run.`, 'level');
  } else registrar('Você já tinha vencido este chefe nesta semana: o prêmio só sai uma vez por semana.', 'muted');
  if (r.primeiraVez) {
    registrar(`🌌 Insígnia ${ev.badge.nome} conquistada — título “${ev.badge.titulo}”. Escolha qual mostrar ao lado do nome na tela 👤 Conta.`, 'level');
    registrar(`🔓 ${fmt(ev.especie)} está liberado na Pokédex e pra começar novas jornadas!`, 'level');
  }
  if (usuario()) sincronizarComRetentativa().catch(e => console.warn('sincronizar (arena)', e));
}
// sair da tela no meio da luta (menu, voltar): a luta acaba — a tentativa já foi gasta ao começar
export const arenaAtiva = () => !!arena && !arena.fim;
export function arenaLimpar() { arena = null; }
