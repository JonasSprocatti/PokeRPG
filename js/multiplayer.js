/* ============ multiplayer cooperativo (sala por código) ============ */
// Até 4 jogadores, cada um com o Pokémon da própria jornada, lutam JUNTOS (lado A) contra selvagens ou o Alfa (lado B).
// Rede: canal Realtime do Supabase por sala (canalSala em nuvem.js) — presença = quem está na sala (com a foto do
// Pokémon), broadcast = eventos. O ANFITRIÃO (quem criou) é a autoridade: gera o inimigo, junta as escolhas, roda o
// motor puro (mp-motor.js) e manda o resultado; os outros só escolhem golpe e exibem. Eventos:
//   estado {batalha, eventos, prazo, acoesFeitas, tipo, zona}  anfitrião → todos (a cada turno e a cada escolha)
//   acao   {de, acao}                                         jogador → anfitrião
//   fim    {fim, eventos, recompensas, effort, derrotados, vistos, chefe, chefeNivel, final}  anfitrião → todos
//   lobby  {zona}                                             anfitrião → todos (zona escolhida)
// Cada um aplica o resultado NA PRÓPRIA jornada (HP/PP gastos, XP, EVs, dinheiro). Desmaiar no co-op não conta
// desmaio nem dá Game Over: volta com 1 de HP. Anfitrião saiu = sala acaba. Sem login funciona (id de visitante).
import { G, save, registrar } from './estado.js';
import { $, limparTopo, logRaw, say } from './ui.js';
import { spriteFrente } from './render.js';
import { ZONES, TYPE_PT, TC, CLS_PT } from './dados.js';
import { zonaLiberada, xpPorVitoria, ganhoDeEVs, freshVol, statsDeChefe, premioChefe, melhorGolpe } from './regras.js';
import { fotoDoMon, novaBatalhaMP, resolverTurnoMP, acaoDaIA, monMP } from './mp-motor.js';
import { canalSala, fecharCanal, usuario, nuvem, nuvemConfigurada } from './nuvem.js';
import { loadPokemon } from './api.js';
import { makeMon } from './pokemon.js';
import { gainExp } from './progressao.js';
import { verificarMissoes } from './missoes.js';
import { esc, fmt, pick, rand, clamp, store, offline } from './util.js';

export const MAX_JOGADORES = 4;
const PRAZO_MS = 45000; // quem não escolher até aqui joga no automático (melhor golpe)
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I pra não confundir
const novoCodigo = () => Array.from({ length: 4 }, () => LETRAS[rand(0, LETRAS.length - 1)]).join('');

let sala = null; // { codigo, anfitriao, canal, membros, zona, batalha, tipo, acoes, acoesFeitas, prazo, enviadoNoTurno, alvo, ocupado, timer, relogio, encontrouAnfitriao }
export const naSala = () => !!sala;

// id na sala: o da conta, ou um de visitante guardado neste navegador
function meuId() {
  const u = usuario(); if (u) return u.id;
  let v = store.get('pokerpg-visitante');
  if (!v) { v = 'v-' + Math.random().toString(36).slice(2, 10); store.set('pokerpg-visitante', v); }
  return v;
}
const meuNome = () => nuvem.apelido || G.S.player.nick || fmt(G.S.player.name);
const meuPayload = () => ({ id: meuId(), nome: meuNome(), anfitriao: sala.anfitriao, mon: fotoDoMon(G.S.player, '', meuId()), entrouEm: sala.entrouEm });
const enviar = (event, payload) => sala?.canal?.send({ type: 'broadcast', event, payload });
const membroDe = id => sala.membros.find(m => m.id === id);

/* ---------- menu, entrar e sair ---------- */
export function telaMultiplayer(msg = '') {
  G.mode = 'mp'; limparTopo();
  const bloqueio = !nuvemConfigurada() ? 'O multiplayer precisa do modo online, que ainda não foi configurado neste site (<code>js/config.js</code>).'
    : offline() ? '📴 Sem internet: o multiplayer volta quando a conexão voltar.' : '';
  $('#app').innerHTML = `<main class="create">
    <h1>Multiplayer.</h1>
    <p class="lead">Lute junto com até 3 amigos, cada um com o Pokémon da própria jornada. XP, dinheiro e EVs vão pra jornada de cada um; desmaiar aqui não conta como desmaio.</p>
    ${msg ? `<p class="notice">${msg}</p>` : ''}
    ${bloqueio ? `<div class="notice">${bloqueio}</div>` : `
    <section class="pv conta"><div>
      <h3>Criar uma sala</h3>
      <p class="muted">Você vira o anfitrião: escolhe a zona e começa as batalhas.</p>
      <button class="btn big" data-act="mp-criar">Criar sala</button>
      <h3 style="margin-top:22px">Entrar com código</h3>
      <span class="subrow"><input id="mp-codigo" maxlength="4" placeholder="EX.: K7Q2" autocomplete="off" aria-label="Código da sala" style="text-transform:uppercase"><button class="btn ghost" data-act="mp-entrar">Entrar</button></span>
    </div></section>`}
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">Voltar ao jogo</button></div></main>`;
}
export const criarSala = () => conectar(novoCodigo(), true);
export function entrarSala(codigo) {
  codigo = String(codigo || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(codigo)) return telaMultiplayer('O código tem 4 letras/números.');
  return conectar(codigo, false);
}
async function conectar(codigo, anfitriao) {
  if (sala) await sairSala();
  if (!nuvemConfigurada() || offline()) return telaMultiplayer();
  if (G.S.player.hp <= 0) return telaMultiplayer('Seu Pokémon está desmaiado. Cure no Centro antes.');
  sala = { codigo, anfitriao, canal: null, membros: [], zona: G.S.zone, batalha: null, acoes: {}, acoesFeitas: [], entrouEm: Date.now(), encontrouAnfitriao: anfitriao };
  try {
    const canal = await canalSala(codigo, meuId());
    sala.canal = canal;
    canal.on('presence', { event: 'sync' }, aoMudarPresenca)
      .on('broadcast', { event: 'estado' }, ({ payload }) => aoReceberEstado(payload))
      .on('broadcast', { event: 'acao' }, ({ payload }) => { if (sala?.anfitriao) registrarAcao(payload.de, payload.acao); })
      .on('broadcast', { event: 'fim' }, ({ payload }) => aoReceberFim(payload))
      .on('broadcast', { event: 'lobby' }, ({ payload }) => { if (sala && !sala.anfitriao) { sala.zona = payload.zona; renderSala(); } });
    canal.subscribe(async status => {
      if (status === 'SUBSCRIBED') await canal.track(meuPayload());
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { await sairSala(); telaMultiplayer('Não consegui conectar na sala. Tente de novo.'); }
    });
  } catch (e) { console.error(e); sala = null; return telaMultiplayer(`Não consegui abrir a sala: ${esc(e.message)}`); }
  telaSala();
  if (!anfitriao) setTimeout(async () => { // ninguém anfitrião apareceu: código errado ou sala fechada
    if (sala?.codigo === codigo && !sala.encontrouAnfitriao) { await sairSala(); telaMultiplayer(`Sala <b>${esc(codigo)}</b> não encontrada.`); }
  }, 6000);
}
export async function sairSala() {
  if (!sala) return;
  const s = sala; sala = null;
  clearTimeout(s.timer); clearInterval(s.relogio);
  try { await s.canal?.untrack(); await fecharCanal(s.canal); } catch (e) { console.error(e); }
}

function aoMudarPresenca() {
  if (!sala) return;
  sala.membros = Object.values(sala.canal.presenceState()).map(l => l[0]).filter(Boolean)
    .sort((a, b) => (b.anfitriao - a.anfitriao) || (a.entrouEm - b.entrouEm));
  if (sala.membros.some(m => m.anfitriao)) sala.encontrouAnfitriao = true;
  else if (sala.encontrouAnfitriao && !sala.anfitriao) { sairSala(); return telaMultiplayer('O anfitrião saiu. A sala acabou.'); }
  if (!sala.anfitriao && sala.membros.findIndex(m => m.id === meuId()) >= MAX_JOGADORES) { sairSala(); return telaMultiplayer(`A sala está cheia (máximo ${MAX_JOGADORES}).`); }
  renderSala();
}

/* ---------- anfitrião: começar, juntar escolhas, resolver ---------- */
export function escolherZona(id) {
  const z = ZONES.find(x => x.id === id);
  if (!sala?.anfitriao || sala.batalha || !z || !zonaLiberada(z, G.S.player.level)) return;
  sala.zona = id; enviar('lobby', { zona: id }); renderSala();
}
export async function iniciarBatalhaMP(tipo) {
  if (!sala?.anfitriao || sala.batalha || sala.ocupado) return;
  const jogadores = sala.membros.slice(0, MAX_JOGADORES).filter(m => m.mon?.hp > 0);
  const z = ZONES.find(x => x.id === sala.zona) || ZONES[0];
  if (!jogadores.length || (tipo === 'alfa' && !z.chefe)) return;
  sala.ocupado = true; renderSala();
  try {
    let B;
    if (tipo === 'alfa') {
      const c = z.chefe, max = { hp: 31, attack: 31, defense: 31, 'special-attack': 31, 'special-defense': 31, speed: 31 };
      const E = await makeMon(await loadPokemon(c.id), c.nivel, { ivs: max });
      E.stats = statsDeChefe(E.stats); E.stats.hp *= jogadores.length; E.hp = E.stats.hp; // Alfa aguenta o grupo todo
      B = [fotoDoMon(E, 'B0', 'ia', fmt(E.name) + ' Alfa')];
    } else {
      // um selvagem por jogador; na Fenda, perto do nível médio do grupo
      const media = Math.round(jogadores.reduce((a, m) => a + m.mon.level, 0) / jogadores.length);
      B = await Promise.all(jogadores.map(async (_, i) => {
        const id = z.pool ? pick(z.pool) : rand(1, 1025), lvl = z.pool ? rand(z.min, z.max) : clamp(media + rand(-2, 2), 2, 100);
        const E = await makeMon(await loadPokemon(id), lvl);
        return fotoDoMon(E, 'B' + i, 'ia', fmt(E.name) + ' selvagem');
      }));
    }
    const A = jogadores.map((m, i) => ({ ...structuredClone(m.mon), ref: 'A' + i, dono: m.id, vol: freshVol() }));
    sala.batalha = novaBatalhaMP(A, B); sala.tipo = tipo; sala.acoes = {};
    const apareceu = tipo === 'alfa' ? `⚔ ${B[0].nome} (Nv. ${B[0].level}) desafia o grupo!` : `${B.map(e => `${e.nome} (Nv. ${e.level})`).join(', ')} apareceu!`;
    publicarEstado([{ txt: `— ${z.name} —`, cls: 'turno' }, { txt: apareceu, cls: 'enc' }], true);
  } catch (e) { console.error(e); logRaw({ html: 'Não consegui preparar a batalha: ' + esc(e.message), cls: 'hit' }); }
  finally { if (sala) { sala.ocupado = false; renderSala(); } }
}
// novoTurno: reinicia o prazo e o relógio do anfitrião
function publicarEstado(eventos, novoTurno) {
  if (novoTurno) {
    sala.prazo = Date.now() + PRAZO_MS;
    clearTimeout(sala.timer); sala.timer = setTimeout(autoCompletar, PRAZO_MS);
  }
  const p = { batalha: sala.batalha, eventos, prazo: sala.prazo, acoesFeitas: Object.keys(sala.acoes), tipo: sala.tipo, zona: sala.zona };
  enviar('estado', p);
  aoReceberEstado(p); // broadcast não volta pra quem enviou
}
function registrarAcao(de, acao) {
  const b = sala?.batalha; if (!b || !acao) return;
  const m = monMP(b, acao.ref);
  if (!m || m.dono !== de || m.hp <= 0) return; // só o dono escolhe pelo próprio Pokémon
  sala.acoes[acao.ref] = acao;
  const faltam = b.lados.A.filter(x => x.hp > 0 && !sala.acoes[x.ref]);
  if (faltam.length) publicarEstado([], false); else resolver();
}
function autoCompletar() {
  const b = sala?.batalha; if (!b || !sala.anfitriao) return;
  for (const m of b.lados.A.filter(x => x.hp > 0 && !sala.acoes[x.ref])) {
    const g = melhorGolpe(m.moves, m.data.types, b.lados.B.find(e => e.hp > 0)?.data.types || []);
    sala.acoes[m.ref] = { ref: m.ref, tipo: 'golpe', golpe: g ? m.moves.indexOf(g) : -1, alvo: b.lados.B.find(e => e.hp > 0)?.ref };
  }
  resolver();
}
function resolver() {
  const b = sala.batalha;
  clearTimeout(sala.timer);
  const acoes = [...Object.values(sala.acoes), ...b.lados.B.filter(e => e.hp > 0).map(e => acaoDaIA(b, e))];
  const { estado, eventos } = resolverTurnoMP(b, acoes);
  sala.batalha = estado; sala.acoes = {};
  const cab = [{ txt: `Turno ${b.turno}`, cls: 'turno' }];
  if (estado.fim) finalizar([...cab, ...eventos]); else publicarEstado([...cab, ...eventos], true);
}
function finalizar(eventos) {
  const b = sala.batalha, venceu = b.fim === 'A', B = b.lados.B;
  const effort = {};
  for (const E of B) for (const [s, v] of Object.entries(E.data.effort || {})) effort[s] = (effort[s] || 0) + v;
  const xp = B.reduce((a, E) => a + xpPorVitoria({ level: E.level, data: E.data }, sala.tipo === 'alfa'), 0);
  const recompensas = {}, final = {};
  for (const m of b.lados.A) {
    recompensas[m.dono] = venceu ? { xp, dinheiro: B.reduce((a, E) => a + E.level * rand(8, 14), 0) } : { xp: 0, dinheiro: 0 };
    final[m.dono] = { hp: m.hp, status: m.status, sleep: m.sleep, pp: m.moves.map(g => g.ppLeft) };
  }
  const p = { fim: b.fim, eventos, recompensas, effort: venceu ? effort : {}, final,
    derrotados: venceu ? B.map(E => ({ especie: E.data.speciesName, id: E.id })) : [],
    vistos: B.map(E => ({ especie: E.data.speciesName, id: E.id, shiny: E.shiny })),
    chefe: venceu && sala.tipo === 'alfa' ? sala.zona : null, chefeNivel: B[0]?.level };
  enviar('fim', p);
  aoReceberFim(p);
}

/* ---------- todos: receber, escolher, aplicar o resultado ---------- */
function aoReceberEstado(p) {
  if (!sala) return;
  sala.batalha = p.batalha; sala.prazo = p.prazo; sala.acoesFeitas = p.acoesFeitas || []; sala.tipo = p.tipo; sala.zona = p.zona;
  for (const e of p.eventos || []) logRaw({ html: esc(e.txt), cls: e.cls });
  const vivosB = sala.batalha.lados.B.filter(e => e.hp > 0);
  if (!vivosB.some(e => e.ref === sala.alvo)) sala.alvo = vivosB[0]?.ref;
  renderSala();
}
export function escolherGolpeMP(i) { escolher({ tipo: 'golpe', golpe: i, alvo: sala?.alvo }); }
export function fugirMP() { escolher({ tipo: 'fugir' }); }
export function mirarMP(ref) { if (sala) { sala.alvo = ref; renderSala(); } }
function escolher(acao) {
  const b = sala?.batalha; if (!b) return;
  const eu = b.lados.A.find(m => m.dono === meuId());
  if (!eu || eu.hp <= 0 || sala.enviadoNoTurno === b.turno) return;
  sala.enviadoNoTurno = b.turno;
  const a = { ...acao, ref: eu.ref };
  if (sala.anfitriao) registrarAcao(meuId(), a); else { enviar('acao', { de: meuId(), acao: a }); renderSala(); }
}
async function aoReceberFim(p) {
  if (!sala) return;
  for (const e of p.eventos || []) logRaw({ html: esc(e.txt), cls: e.cls });
  sala.batalha = null; sala.acoes = {}; sala.ocupado = true; clearTimeout(sala.timer);
  renderSala();
  try { await aplicarResultado(p); } catch (e) { console.error(e); }
  if (!sala) return;
  sala.ocupado = false;
  await sala.canal.track(meuPayload()); // atualiza o Pokémon (HP, nível) que os outros veem
  renderSala();
}
async function aplicarResultado(p) {
  const S = G.S, P = S.player, f = p.final?.[meuId()];
  for (const v of p.vistos || []) { registrar(S, 'vistos', v.especie, v.id); if (v.shiny) registrar(S, 'shinies', v.especie, v.id); }
  if (!f) { save(); return; } // não estava nesta batalha
  P.hp = f.hp > 0 ? f.hp : 1; P.status = f.hp > 0 ? f.status : null; P.sleep = f.hp > 0 ? f.sleep || 0 : 0;
  f.pp.forEach((pp, i) => { if (P.moves[i]) P.moves[i].ppLeft = Math.min(P.moves[i].pp, pp); });
  if (p.fim === 'A') {
    const r = p.recompensas[meuId()];
    S.money += r.dinheiro; S.wins = (S.wins || 0) + 1; S.vitoriasDesdeCentro = (S.vitoriasDesdeCentro || 0) + 1;
    for (const [s, add] of ganhoDeEVs(P.evs, p.effort)) P.evs[s] += add;
    for (const d of p.derrotados) registrar(S, 'derrotados', d.especie, d.id);
    await say(`🏆 Vitória do grupo! Você ganhou ${r.xp} de XP e ₽${r.dinheiro}.`, 'good');
    if (p.chefe && !S.chefes?.[p.chefe]) {
      const premio = premioChefe(p.chefeNivel || 1);
      (S.chefes ||= {})[p.chefe] = true; S.money += premio; S.bag['rare-candy'] = (S.bag['rare-candy'] || 0) + 1;
      await say(`🏆 Alfa derrotado em grupo! Prêmio: ₽${premio} e 1 Rare Candy.`, 'level');
    }
    await gainExp(r.xp);
  } else if (p.fim === 'B') await say(f.hp > 0 ? 'O grupo foi derrotado.' : 'O grupo foi derrotado. Seu Pokémon volta com 1 de HP (no co-op não conta desmaio).', 'hit');
  else await say('O grupo fugiu.', 'muted');
  await verificarMissoes();
  save();
}

/* ---------- tela ---------- */
function telaSala() {
  G.mode = 'mp'; limparTopo();
  $('#app').innerHTML = `<main class="create mp">
    <div id="mp-topo"></div>
    <div class="textbox"><div id="log" class="log" aria-live="polite"></div></div>
    <div id="mp-acoes" class="actions"></div></main>`;
  clearInterval(sala.relogio);
  sala.relogio = setInterval(() => { const el = $('#mp-relogio'); if (el && sala?.prazo) el.textContent = Math.max(0, Math.ceil((sala.prazo - Date.now()) / 1000)) + 's'; }, 1000);
  renderSala();
}
const barra = m => { const pct = clamp(m.hp / m.stats.hp * 100, 0, 100); return `<div class="hp"><span>HP</span><div class="bar"><div class="fill" style="width:${pct}%;background:${pct > 50 ? '#5FB36A' : pct > 20 ? '#F7C548' : '#E4572E'}"></div></div><span>${m.hp}/${m.stats.hp}</span></div>`; };
function cartao(m, dono) {
  return `<div class="mp-mon ${m.hp <= 0 ? 'caido' : ''}"><img src="${spriteFrente(m)}" alt="" onerror="this.onerror=null;this.src='${m.data.sprite}'">
    <div><b>${m.shiny ? '✨ ' : ''}${esc(m.nome)}</b> <span class="muted small">Nv. ${m.level}</span>${dono ? `<small class="muted">${esc(dono)}</small>` : ''}${barra(m)}</div></div>`;
}
function renderSala() {
  if (!sala || G.mode !== 'mp' || !$('#mp-topo')) return;
  const b = sala.batalha, z = ZONES.find(x => x.id === sala.zona) || ZONES[0];
  const cabecalho = `<div class="mp-cab"><h1>Sala <span class="codigo">${esc(sala.codigo)}</span></h1>
    <p class="muted">${sala.anfitriao ? 'Você é o anfitrião. Passe o código pros amigos.' : 'Esperando o anfitrião começar.'} · ${sala.membros.length}/${MAX_JOGADORES} jogadores · ${esc(z.name)}</p></div>`;
  if (!b) {
    const zonas = ZONES.filter(x => zonaLiberada(x, G.S.player.level));
    $('#mp-topo').innerHTML = cabecalho + `<div class="mp-grupo">${sala.membros.map(m => cartao(m.mon, (m.anfitriao ? '👑 ' : '') + m.nome + (m.id === meuId() ? ' (você)' : ''))).join('')}</div>`;
    $('#mp-acoes').innerHTML = sala.anfitriao ? `
      <label class="campo">Zona<select data-mp-zona ${sala.ocupado ? 'disabled' : ''}>${zonas.map(x => `<option value="${x.id}" ${x.id === sala.zona ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
      <button class="btn big" data-act="mp-explorar" ${sala.ocupado ? 'disabled' : ''}>🌿 Explorar juntos</button>
      ${z.chefe ? `<button class="btn" data-act="mp-alfa" ${sala.ocupado ? 'disabled' : ''}>⚔ Desafiar o Alfa (${z.chefe.nome})</button>` : ''}
      <button class="btn ghost" data-act="mp-sair">Sair da sala</button>`
      : `<p class="muted">${sala.ocupado ? 'Aplicando o resultado…' : 'O anfitrião escolhe a zona e começa a batalha.'}</p><button class="btn ghost" data-act="mp-sair">Sair da sala</button>`;
    return;
  }
  const dono = id => membroDe(id)?.nome || 'jogador que saiu';
  $('#mp-topo').innerHTML = cabecalho + `
    <div class="mp-campo"><div class="mp-lado inimigo">${b.lados.B.map(m => cartao(m)).join('')}</div>
    <div class="mp-lado">${b.lados.A.map(m => cartao(m, dono(m.dono) + (m.dono === meuId() ? ' (você)' : ''))).join('')}</div></div>`;
  const eu = b.lados.A.find(m => m.dono === meuId());
  const esperando = b.lados.A.filter(m => m.hp > 0 && !sala.acoesFeitas.includes(m.ref)).map(m => dono(m.dono));
  const status = `<p class="muted small">Turno ${b.turno} · ${esperando.length ? `esperando: ${esperando.map(esc).join(', ')}` : 'resolvendo…'} · <span id="mp-relogio">${Math.max(0, Math.ceil((sala.prazo - Date.now()) / 1000))}s</span></p>`;
  if (!eu || eu.hp <= 0) { $('#mp-acoes').innerHTML = status + '<p class="muted">Seu Pokémon desmaiou; torça pelo grupo!</p>'; return; }
  if (sala.enviadoNoTurno === b.turno || sala.acoesFeitas.includes(eu.ref)) { $('#mp-acoes').innerHTML = status + '<p class="muted">Escolha enviada.</p>'; return; }
  const vivosB = b.lados.B.filter(m => m.hp > 0), semPP = eu.moves.every(g => g.ppLeft <= 0);
  $('#mp-acoes').innerHTML = status +
    (vivosB.length > 1 ? `<div class="subrow">Alvo: ${vivosB.map(m => `<button class="btn ${m.ref === sala.alvo ? '' : 'ghost'} sm" data-act="mp-mirar" data-v="${m.ref}">${esc(m.nome)}</button>`).join('')}</div>` : '') +
    `<div class="moves">${semPP ? '<button class="mv" style="--c:#A8A77A" data-act="mp-golpe" data-v="-1"><b>Struggle</b><small>Sem PP.</small></button>'
      : eu.moves.map((g, i) => `<button class="mv" style="--c:${TC[g.type] || '#888'}" data-act="mp-golpe" data-v="${i}" ${g.ppLeft <= 0 ? 'disabled' : ''}><b>${esc(fmt(g.name))}</b><small>${TYPE_PT[g.type] || g.type}, ${CLS_PT[g.cls]}, poder ${g.power ?? '—'}</small><span class="pp">PP ${g.ppLeft}/${g.pp}</span></button>`).join('')}</div>
    <div class="subrow"><button class="btn ghost" data-act="mp-fugir">Fugir</button><button class="btn ghost" data-act="mp-sair">Sair da sala</button></div>`;
}
