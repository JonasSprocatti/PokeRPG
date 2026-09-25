/* ============ 🏟 Arena do Chefe ============
   Enfrentar o chefe da semana (evento.js) com os Pokémon do Hall da Fama (hall.js), SEM precisar estar numa run: o Pokémon principal de
   cada jornada Roguelike/Hardcore que terminou fica guardado com o nível que tinha, e aqui você leva de 1 a 3 deles contra o chefe de
   agora — sem passar por 8 Gens até o Eternatus.
   A luta usa o MESMO motor puro do co-op (mp-motor.js): um "lado A" com os seus Pokémon e um "lado B" com o chefe, sem nenhum save no
   meio — por isso a Arena nunca mexe numa jornada em andamento (nem pode estragar o save dela). Diferenças pra luta dentro de uma run:
   sem itens segurados, sem Mega/Tera/Z-Move/Gigantamax e sem Revive (o motor do co-op não tem isso). Perder não custa nada.
   Tentativa: a mesma de 8 horas do resto do evento. Prêmio: o Pokémon do chefe na Pokédex, a insígnia e o título (só na 1ª vitória), e
   os itens de raide do prêmio da semana (uma vez por semana) — dinheiro e Rare Candy ficam pras lutas DENTRO de uma run. */
import { G } from './estado.js';
import { $, limparTopo, logRaw } from './ui.js';
import { barraTelas, rotuloVoltar } from './navegacao.js';
import { SPR, SPR_SHINY, ITEMS, API, TC, TYPE_PT, CLS_PT } from './dados.js';
import { hallDaConta, registrarVitoriaDeEvento } from './carreira.js';
import { EVENTOS, eventoDaSemana, jaComecou, idDaSemana, agoraDoEvento, esperaRestante, ultimaTentativa, registrarTentativa, formatarEspera, dataBR,
  inventarioRaide, darItensDeRaide, gastarItemDeRaide, INICIO } from './evento.js';
import { prepararChefe, nivelDoChefe, jogadoresEfetivos, habilidadeDoChefe, aplicarClimaDoChefe, ITENS_DE_RAIDE, ITEM_DO_RAIDE } from './boss.js';
import { fotoDoMon, novaBatalhaMP, resolverTurnoMP, acaoDaIA, usarRaideNoEvento } from './mp-motor.js';
import { cartao } from './multiplayer.js';
import { htmlComoFuncionam } from './ajuda-chefes.js';
import { CLIMA_TURNOS, ESPERTEZA, golpeDoClima, climaDe } from './regras.js';
import { loadPokemon, loadMove, apiErr } from './api.js';
import { makeMon } from './pokemon.js';
import { sincronizar, usuario } from './nuvem.js';
import { esc, fmt } from './util.js';

const MAX_TIME = 3;
const DONO = 'eu';
let selecao = [];            // chaves do Hall escolhidas (na ordem)
let arena = null;            // luta em andamento (ou terminada): { ev, estado, escolhas, log, fim, ocupado }

/* ---------- montar a luta ---------- */
// reconstrói um Pokémon do Hall: ficha da PokéAPI + o que foi guardado (nível, IVs, EVs, natureza, habilidade, golpes)
async function reidratar(e) {
  const m = await makeMon(await loadPokemon(e.id), e.nivel, { ivs: e.ivs, evs: e.evs, nature: e.nature, ability: e.ability, nick: e.nick, shiny: e.shiny });
  const golpes = (await Promise.all((e.moves || []).map(n => loadMove(`${API}/move/${n}/`).catch(() => null)))).filter(Boolean).map(g => ({ ...g, ppLeft: g.pp }));
  if (golpes.length) m.moves = golpes;
  return m;
}
async function montarLuta(ev, entradas) {
  const mons = await Promise.all(entradas.map(reidratar));
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
  const comecou = jaComecou(agora), espera = esperaRestante(ultimaTentativa(), agora);
  const alvo = ev || EVENTOS[0];
  const chefe = `<div class="chefe-box evento ${comecou ? '' : 'em-breve'}"><img src="${SPR(alvo.formaId)}" alt="">
    <div><b>${comecou ? '☄ CHEFE DA SEMANA' : '☄ EM BREVE'}: ${esc(alvo.nome)}</b> <span class="muted">Gen ${alvo.gen}</span>
    <small>${esc(alvo.resumo)}</small>
    <small>${comecou ? 'Muda na próxima segunda-feira, meia-noite (Brasília).' : `O primeiro chefe chega em <b>${dataBR(INICIO)}</b>.`} Uma tentativa a cada 8 horas.</small></div></div>`;
  const inv = inventarioRaide();
  const itens = ITENS_DE_RAIDE.map(t => `<li>${esc(ITEMS[ITEM_DO_RAIDE[t]].name)} <b>×${inv[ITEM_DO_RAIDE[t]] || 0}</b></li>`).join('');
  const escolhidos = new Set(selecao);
  const cartaoHall = e => { const on = escolhidos.has(e.chave), cheio = !on && selecao.length >= MAX_TIME;
    return `<button class="hall-card ${on ? 'on' : ''}" data-act="arena-sel" data-v="${esc(e.chave)}" ${cheio ? 'disabled' : ''} aria-pressed="${on}">
      <img src="${e.shiny ? SPR_SHINY(e.id) : SPR(e.id)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${SPR(e.id)}'">
      <b>${e.shiny ? '✨ ' : ''}${esc(e.nick || fmt(e.nome))}</b><span class="muted small">Nv. ${e.nivel} · Gen ${e.gen}</span>
      <small class="muted">${esc(fmt(e.dificuldade))} · ${e.motivo === 'venceu' ? '🏆 venceu' : e.motivo === 'desmaiou' ? 'desmaiou' : e.motivo === 'capturado' ? 'capturado' : 'encerrou'}</small></button>`; };
  const podeIniciar = comecou && espera === 0 && selecao.length >= 1;
  const rotuloBotao = !comecou ? `🗓 O evento começa em ${dataBR(INICIO)}` : espera > 0 ? `⏳ Próxima tentativa em ${formatarEspera(espera)}` : selecao.length ? `☄ Enfrentar com ${selecao.length} Pokémon` : 'Escolha de 1 a 3 Pokémon do Hall';
  return `${chefe}
    ${htmlComoFuncionam()}
    <section class="pv conta"><div><h3>Seu Hall da Fama</h3>
      <p class="small muted">O Pokémon principal de cada jornada <b>Roguelike ou Hardcore</b> que você termina entra aqui, com o nível que tinha. Escolha de 1 a ${MAX_TIME} pra enfrentar o chefe. Não usa nenhuma jornada em andamento.</p>
      ${hall.length ? `<div class="hall-lista">${hall.map(cartaoHall).join('')}</div>`
        : '<p class="notice">Seu Hall da Fama está vazio. <b>Termine (ou encerre) uma jornada Roguelike ou Hardcore</b> e o Pokémon dela aparece aqui, pronto pra Arena.</p>'}</div></section>
    <section class="pv conta"><div><h3>Itens de raide da conta</h3>
      <ul class="raide-lista">${itens}</ul>
      <p class="small muted">Só valem contra o chefe, um de cada tipo por luta. Vêm de prêmio dos chefes; o que sobra numa jornada que termina também vem pra cá.</p></div></section>
    <div class="subrow"><button class="btn big" data-act="arena-iniciar" ${podeIniciar ? '' : 'disabled'}>${rotuloBotao}</button></div>`;
}

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
    const semPP = vez.moves.every(g => g.ppLeft <= 0);
    acoes = `<p class="muted small">Turno ${b.turno} · <b>Vez de ${esc(vez.nome)}</b></p>
      <div class="moves">${semPP ? '<button class="mv" style="--c:#A8A77A" data-act="arena-golpe" data-v="-1"><b>Struggle</b><small>Sem PP.</small></button>'
        : vez.moves.map((g0, i) => { const g = golpeDoClima(g0, climaDe(b.campo)); return `<button class="mv" style="--c:${TC[g.type] || '#888'}" data-act="arena-golpe" data-v="${i}" ${g.ppLeft <= 0 ? 'disabled' : ''}><b>${esc(fmt(g.name))}</b><small>${TYPE_PT[g.type] || g.type}, ${CLS_PT[g.cls]}, poder ${g.power ?? '—'}</small><span class="pp">PP ${g.ppLeft}/${g.pp}</span></button>`; }).join('')}</div>
      ${botoesRaide(chefe)}
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
const registrar = (txt, cls = '') => { const l = { html: esc(txt), cls }; arena.log.push(l); logRaw(l); };

/* ---------- ações (main.js liga cada data-act) ---------- */
export function arenaSelecionar(chave) {
  if (arena) return;
  selecao = selecao.includes(chave) ? selecao.filter(c => c !== chave) : (selecao.length < MAX_TIME ? [...selecao, chave] : selecao);
  renderArena();
}
export async function arenaIniciar() {
  if (arena || G.mode !== 'arena') return;
  const agora = agoraDoEvento(), ev = eventoDaSemana(agora);
  if (!ev || !jaComecou(agora) || esperaRestante(ultimaTentativa(), agora) > 0) return telaArena();
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
export async function arenaGolpe(i) {
  if (!arena || arena.fim || arena.ocupado) return;
  const m = proximoSemEscolha(); if (!m) return;
  arena.escolhas[m.ref] = { ref: m.ref, tipo: 'golpe', golpe: +i, alvo: 'B0' };
  if (proximoSemEscolha()) return renderArena();   // ainda falta alguém do time escolher
  await resolverTurno();
}
async function resolverTurno() {
  arena.ocupado = true; renderArena();
  const b = arena.estado, boss = b.lados.B[0];
  try {
    const ia = boss.hp > 0 ? [acaoDaIA(b, boss, Math.random, ESPERTEZA.chefe)] : [];
    const { estado, eventos } = await resolverTurnoMP(b, [...Object.values(arena.escolhas), ...ia]);
    arena.log.push({ html: esc(`— Turno ${b.turno} —`), cls: 'turno' });
    for (const e of eventos) arena.log.push({ html: esc(e.txt), cls: e.cls });
    arena.estado = estado; arena.escolhas = {};
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
export function arenaDesistir() {
  if (!arena || arena.fim) return;
  arena.estado.fim = 'B'; arena.fim = 'B';
  registrar('Você desistiu da luta. A tentativa já foi gasta.', 'muted'); renderArena();
}
export function arenaFim() { arena = null; selecao = []; telaArena(); }

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
  if (usuario()) sincronizar().catch(e => console.warn('sincronizar (arena)', e));
}
// sair da tela no meio da luta (menu, voltar): a luta acaba — a tentativa já foi gasta ao começar
export const arenaAtiva = () => !!arena && !arena.fim;
export function arenaLimpar() { arena = null; }
