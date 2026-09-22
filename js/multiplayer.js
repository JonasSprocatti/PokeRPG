/* ============ multiplayer: co-op e PvP (sala por código) ============ */
// Sala de até MAX_JOGADORES. O anfitrião escolhe:
//   modo        'coop' (todos no lado A contra selvagens / Alfa — "chamar alguém pra sua run") ou 'pvp' (Time A × Time B)
//   porJogador  quantos Pokémon cada um leva: 1 = só o principal, 2–3 = com aliados (1v1, 2v2, 3v3; 2×1, 3×2…)
//   balancear   (padrão ligado) co-op: o time todo no nível do anfitrião; PvP: todos no nível médio e o lado em menor
//               número ganha HP proporcional. Desligado: níveis reais; no co-op os inimigos sobem pro nível do mais forte.
// Rede: canal Realtime do Supabase (canalSala em nuvem.js). Presença = membros (nome, time, fotos dos Pokémon);
// broadcast: estado/acao/fim/lobby. O ANFITRIÃO é a autoridade: monta os lados, junta as escolhas (só o dono escolhe
// pelos próprios Pokémon), prazo de 45 s com golpe automático, roda o motor puro (mp-motor.js) e publica.
// Resultado: co-op aplica na jornada de cada um (HP proporcional, PP, XP, EVs, dinheiro; Roguelike = permadeath, fora
// dele desmaio volta com 1 HP); PvP é amistoso (não mexe em HP/PP, só conta vitórias/derrotas em S.pvp).
import { G, save, registrar, dificuldadeDe } from './estado.js';
import { $, limparTopo, logRaw, say, toast } from './ui.js';
import { spriteFrente } from './render.js';
import { ZONES, TYPE_PT, TC, CLS_PT, DIFICULDADES, ITEMS, FIND_ITEMS, REGIOES_INICIAIS, SPR } from './dados.js';
import { zonaLiberada, xpPorVitoria, ganhoDeEVs, freshVol, statsDeChefe, premioChefe, melhorGolpe } from './regras.js';
import { fotoDoMon, novaBatalhaMP, resolverTurnoMP, acaoDaIA, monMP, ladoDe, balancearPvP, balancearCoop, nivelarMon, nivelMedio, naNivelReal } from './mp-motor.js';
import { carregarCarreira } from './carreira.js';
import { desbloqueadas } from './roguelike.js';
import { canalSala, fecharCanal, usuario, nuvem, nuvemConfigurada, meuIcone, convidarAmigo } from './nuvem.js';
import { htmlIcone } from './conta.js';
import { loadPokemon } from './api.js';
import { makeMon } from './pokemon.js';
import { gainExp, gainExpAliado } from './progressao.js';
import { verificarMissoes } from './missoes.js';
import { encerrarJornada } from './fim.js';
import { esc, fmt, pick, rand, clamp, store, offline } from './util.js';

export const MAX_JOGADORES = 6;
const PRAZO_MS = 45000; // quem não escolher até aqui joga no automático (melhor golpe)
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I pra não confundir
const novoCodigo = () => Array.from({ length: 4 }, () => LETRAS[rand(0, LETRAS.length - 1)]).join('');

let sala = null;
export const naSala = () => !!sala;

// Com qual Pokémon entrar (escolhido no menu, antes de criar/entrar): 'run' = o da jornada atual (a luta mexe nela);
// 'convidado' = um emprestado só pra sala (iniciais + desbloqueados do Roguelike, Nv. 5), que não mexe em save nenhum.
let entrada = { tipo: 'run', id: null };
const temRun = () => !!G.S?.player;
// espécies que dá pra levar como convidado: a mesma regra da criação (iniciais + desbloqueadas no Roguelike)
function especiesConvidado() {
  const lista = REGIOES_INICIAIS.flatMap(r => r.ids.map((id, i) => ({ id, nome: r.nomes[i] })));
  for (const p of desbloqueadas(carregarCarreira().jornadas)) if (!lista.some(x => x.id === p.id)) lista.push({ id: p.id, nome: fmt(p.especie) });
  return lista;
}
export function escolherEntrada(tipo) { if (tipo === 'run' && !temRun()) return; entrada = { tipo, id: tipo === 'run' ? null : entrada.id }; telaMultiplayer(); }
export function escolherConvidado(id) { entrada = { tipo: 'convidado', id: +id }; telaMultiplayer(); }

// id na sala: o da conta, ou um de visitante guardado neste navegador
function meuId() {
  const u = usuario(); if (u) return u.id;
  let v = store.get('pokerpg-visitante');
  if (!v) { v = 'v-' + Math.random().toString(36).slice(2, 10); store.set('pokerpg-visitante', v); }
  return v;
}
const meuNome = () => nuvem.apelido || G.S?.player?.nick || (G.S ? fmt(G.S.player.name) : 'Treinador');
// principal (slot 0) + até 2 aliados em pé e que não estão descansando (slot = índice em S.aliados + 1).
// Convidado: só ele, marcado `convidado` (o anfitrião ajusta o nível dele; o resultado não vai pra save nenhum).
function minhasFotos() {
  const eu = meuId(), S = G.S;
  if (sala?.convidado) return [{ ...fotoDoMon(sala.convidado, '', eu, null, 0), convidado: true }];
  const aliados = (S.aliados || []).map((A, i) => [A, i]).filter(([A]) => A.hp > 0 && A.ordem !== 'fora').slice(0, 2);
  return [fotoDoMon(S.player, '', eu, null, 0), ...aliados.map(([A, i]) => fotoDoMon(A, '', eu, null, i + 1))];
}
const meuPayload = () => ({ id: meuId(), nome: meuNome(), icone: meuIcone(), anfitriao: sala.anfitriao, time: sala.time, entrouEm: sala.entrouEm, mons: minhasFotos() });
// anfitrião chama um amigo: aviso aparece pra ele em qualquer tela (nuvem.convidarAmigo → canal pessoal do amigo)
export async function convidarAmigoMP(amigoId) {
  if (!sala) return;
  const a = nuvem.amigos.find(x => x.amigo === amigoId);
  try { await convidarAmigo(amigoId, { codigo: sala.codigo, modo: sala.config.modo }); toast(`Convite enviado pra <b>${esc(a?.apelido || 'seu amigo')}</b>.`, 4000); }
  catch (e) { toast(`Não deu pra convidar: ${esc(e.message)}`, 6000); }
}
const enviar = (event, payload) => sala?.canal?.send({ type: 'broadcast', event, payload });
const membroDe = id => sala.membros.find(m => m.id === id);
const retrack = () => sala?.canal?.track(meuPayload());

/* ---------- menu, entrar e sair ---------- */
export function telaMultiplayer(msg = '') {
  G.mode = 'mp'; limparTopo();
  const bloqueio = !nuvemConfigurada() ? 'O multiplayer precisa do modo online, que ainda não foi configurado neste site (<code>js/config.js</code>).'
    : offline() ? '📴 Sem internet: o multiplayer volta quando a conexão voltar.' : '';
  if (!temRun()) entrada.tipo = 'convidado';
  const P = G.S?.player, conv = entrada.tipo === 'convidado';
  const opcaoRun = temRun()
    ? `<button class="abil ${!conv ? 'on' : ''}" data-act="mp-entrada" data-v="run" aria-pressed="${!conv}"><b>🎒 O Pokémon da minha run</b><small>${esc(P.nick || fmt(P.name))}, Nv. ${P.level}${(G.S.aliados || []).length ? ` (+ aliados, se a sala pedir)` : ''}. A luta mexe na run: XP, HP${DIFICULDADES[dificuldadeDe(G.S)].permadeath ? ', e desmaiar acaba a run (Roguelike)' : ''}.</small></button>`
    : '<p class="small muted">Sem run em andamento: escolha um Pokémon convidado.</p>';
  const escolha = `<h3>Com qual Pokémon?</h3>
    <div class="abils">${opcaoRun}
      <button class="abil ${conv ? 'on' : ''}" data-act="mp-entrada" data-v="convidado" aria-pressed="${conv}"><b>✨ Um Pokémon convidado</b><small>Emprestado só pra sala: não mexe na sua run, não ganha recompensa, sem risco. Os iniciais, Pikachu, Eevee e o que você desbloqueou no Roguelike.</small></button></div>
    ${conv ? `<div class="picks" style="margin-top:10px">${especiesConvidado().map(e => `<button class="pick ${entrada.id === e.id ? 'on' : ''}" data-act="mp-convidado" data-v="${e.id}" aria-pressed="${entrada.id === e.id}"><img src="${SPR(e.id)}" alt="" loading="lazy">${esc(e.nome)}</button>`).join('')}</div>` : ''}`;
  $('#app').innerHTML = `<main class="create">
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
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">${temRun() ? 'Voltar ao jogo' : 'Voltar'}</button></div></main>`;
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
  const conv = entrada.tipo === 'convidado' || !temRun();
  if (conv && !entrada.id) return telaMultiplayer('Escolha o Pokémon convidado antes.');
  if (!conv && G.S.player.hp <= 0) return telaMultiplayer('Seu Pokémon está desmaiado. Cure no Centro antes.');
  let convidado = null;
  if (conv) {
    try { convidado = await makeMon(await loadPokemon(entrada.id), 5); }
    catch (e) { console.error(e); return telaMultiplayer(`Não consegui buscar o Pokémon convidado: ${esc(e.message)}`); }
  }
  sala = { codigo, anfitriao, canal: null, membros: [], zona: G.S?.zone || ZONES[0].id, batalha: null, acoes: {}, acoesFeitas: [], escolhidos: new Set(),
    convidado, // anfitrião sem run: só PvP (co-op é jogar a run de alguém)
    config: { modo: anfitriao && !temRun() ? 'pvp' : 'coop', porJogador: 1, balancear: true }, time: anfitriao ? 'A' : 'B', entrouEm: Date.now(), encontrouAnfitriao: anfitriao };
  try {
    const canal = await canalSala(codigo, meuId());
    sala.canal = canal;
    canal.on('presence', { event: 'sync' }, aoMudarPresenca)
      .on('broadcast', { event: 'estado' }, ({ payload }) => aoReceberEstado(payload))
      .on('broadcast', { event: 'acao' }, ({ payload }) => { if (sala?.anfitriao) registrarAcao(payload.de, payload.acao); })
      .on('broadcast', { event: 'fim' }, ({ payload }) => aoReceberFim(payload))
      .on('broadcast', { event: 'lobby' }, ({ payload }) => { if (sala && !sala.anfitriao) { sala.zona = payload.zona; sala.config = payload.config; renderSala(); } });
    canal.subscribe(async status => {
      if (status === 'SUBSCRIBED') { await canal.track(meuPayload()); if (sala?.anfitriao) publicarLobby(); }
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
  if (sala.anfitriao) publicarLobby(); // quem acabou de entrar recebe a configuração
  renderSala();
}

/* ---------- lobby: configuração (anfitrião) e time (cada um) ---------- */
function publicarLobby() { enviar('lobby', { zona: sala.zona, config: sala.config }); }
export function configurarSala(campo, valor) {
  if (!sala?.anfitriao || sala.batalha) return;
  if (campo === 'zona') {
    const z = ZONES.find(x => x.id === valor);
    if (!temRun() || !z || !zonaLiberada(z, G.S.player.level)) return;
    sala.zona = valor;
  } else if (campo === 'modo' && ['coop', 'pvp'].includes(valor)) {
    if (valor === 'coop' && !temRun()) return renderSala(); // co-op é a run do anfitrião
    sala.config.modo = valor;
  }
  else if (campo === 'porJogador') sala.config.porJogador = clamp(+valor || 1, 1, 3);
  else if (campo === 'balancear') sala.config.balancear = !!valor;
  publicarLobby(); renderSala();
}
export async function escolherTime(t) {
  if (!sala || sala.batalha || !['A', 'B'].includes(t)) return;
  sala.time = t; await retrack(); renderSala();
}

/* ---------- anfitrião: montar a batalha ---------- */
// lista de Pokémon de um jogador pra luta: os primeiros `porJogador` em pé, com ref/dono/slot
const monsDe = (m, lado, ini) => (m.mons || []).slice(0, sala.config.porJogador).filter(x => x.hp > 0)
  .map((x, i) => ({ ...structuredClone(x), ref: lado + (ini + i), dono: m.id, vol: freshVol() }));
function montarLado(membros, lado) {
  const out = [];
  for (const m of membros) out.push(...monsDe(m, lado, out.length));
  return out;
}
export async function iniciarBatalhaMP(tipo) {
  if (!sala?.anfitriao || sala.batalha || sala.ocupado) return;
  const cfg = sala.config, membros = sala.membros.slice(0, MAX_JOGADORES).filter(m => m.mons?.[0]?.hp > 0);
  sala.ocupado = true; renderSala();
  try {
    let A, B, opcoes = {}, abertura;
    if (cfg.modo === 'pvp') {
      A = montarLado(membros.filter(m => m.time === 'A'), 'A'); B = montarLado(membros.filter(m => m.time === 'B'), 'B');
      if (!A.length || !B.length) throw new Error('Os dois times precisam de pelo menos um jogador.');
      if (cfg.balancear) { const b = balancearPvP(A, B); A = b.A; B = b.B; abertura = `Balanceado: todos no nível ${b.nivel}${A.length !== B.length ? ', e o time menor ganhou HP extra' : ''}.`; }
      else { // convidado não tem nível "real": entra na média dos outros (ou 50 se só houver convidados)
        const reais = [...A, ...B].filter(m => !m.convidado), nv = reais.length ? nivelMedio(reais) : 50;
        A = A.map(m => m.convidado ? nivelarMon(m, nv) : m); B = B.map(m => m.convidado ? nivelarMon(m, nv) : m);
      }
      opcoes.pvp = true;
    } else {
      const z = ZONES.find(x => x.id === sala.zona) || ZONES[0];
      if (tipo === 'alfa' && !z.chefe) return;
      if (!temRun()) throw new Error('Co-op é jogar a run de alguém: o anfitrião precisa de uma run em andamento.');
      A = montarLado(membros, 'A');
      const meuNivel = G.S.player.level;
      if (cfg.balancear) { A = balancearCoop(A, meuNivel); abertura = `Balanceado: o time todo no nível ${meuNivel} (o do anfitrião). Quem teve o nível ajustado não leva XP nem itens pra própria run.`; }
      else {
        A = A.map(m => m.convidado ? nivelarMon(m, meuNivel) : m); // convidado entra no nível do anfitrião
        abertura = 'Sem balancear: níveis reais (tudo o que ganharem vai pra run de cada um), e os inimigos acompanham o mais forte do grupo.';
      }
      const maisForte = Math.max(...A.map(m => m.level));
      if (tipo === 'alfa') {
        const c = z.chefe, max = { hp: 31, attack: 31, defense: 31, 'special-attack': 31, 'special-defense': 31, speed: 31 };
        const E = await makeMon(await loadPokemon(c.id), cfg.balancear ? c.nivel : Math.max(c.nivel, maisForte + 5), { ivs: max });
        E.stats = statsDeChefe(E.stats); E.stats.hp *= membros.length; E.hp = E.stats.hp; // Alfa aguenta o grupo todo
        B = [fotoDoMon(E, 'B0', 'ia', fmt(E.name) + ' Alfa')];
      } else {
        const media = Math.round(A.reduce((a, m) => a + m.level, 0) / A.length);
        B = await Promise.all(membros.map(async (_, i) => { // um selvagem por jogador
          let lvl = z.pool ? rand(z.min, z.max) : clamp(media + rand(-2, 2), 2, 100);
          if (!cfg.balancear) lvl = Math.max(lvl, maisForte);
          const E = await makeMon(await loadPokemon(z.pool ? pick(z.pool) : rand(1, 1025)), lvl);
          return fotoDoMon(E, 'B' + i, 'ia', fmt(E.name) + ' selvagem');
        }));
      }
      abertura = `${tipo === 'alfa' ? `⚔ ${B[0].nome} (Nv. ${B[0].level}) desafia o grupo!` : `${B.map(e => `${e.nome} (Nv. ${e.level})`).join(', ')} apareceu!`} ${abertura}`;
    }
    sala.batalha = novaBatalhaMP(A, B, opcoes); sala.tipo = cfg.modo === 'pvp' ? 'pvp' : tipo; sala.acoes = {};
    publicarEstado([{ txt: cfg.modo === 'pvp' ? '— PvP —' : `— ${(ZONES.find(x => x.id === sala.zona) || ZONES[0]).name} —`, cls: 'turno' }, { txt: abertura, cls: 'enc' }], true);
  } catch (e) { console.error(e); logRaw({ html: esc(e.message), cls: 'hit' }); }
  finally { if (sala) { sala.ocupado = false; renderSala(); } }
}
function publicarEstado(eventos, novoTurno) {
  if (novoTurno) { sala.prazo = Date.now() + PRAZO_MS; clearTimeout(sala.timer); sala.timer = setTimeout(autoCompletar, PRAZO_MS); }
  const p = { batalha: sala.batalha, eventos, prazo: sala.prazo, acoesFeitas: Object.keys(sala.acoes), tipo: sala.tipo, zona: sala.zona };
  enviar('estado', p);
  aoReceberEstado(p); // broadcast não volta pra quem enviou
}
const jogaveis = b => [...b.lados.A, ...b.lados.B].filter(m => m.hp > 0 && m.dono !== 'ia');
const primeiroInimigo = (b, m) => b.lados[ladoDe(b, m.ref) === 'A' ? 'B' : 'A'].find(e => e.hp > 0);
function registrarAcao(de, acao) {
  const b = sala?.batalha; if (!b || !acao) return;
  const m = monMP(b, acao.ref);
  if (!m || m.dono !== de || m.hp <= 0) return; // só o dono escolhe pelos próprios Pokémon
  sala.acoes[acao.ref] = acao;
  if (jogaveis(b).some(x => !sala.acoes[x.ref])) publicarEstado([], false); else resolver();
}
function autoCompletar() {
  const b = sala?.batalha; if (!b || !sala.anfitriao) return;
  for (const m of jogaveis(b).filter(x => !sala.acoes[x.ref])) {
    const alvo = primeiroInimigo(b, m), g = melhorGolpe(m.moves, m.data.types, alvo?.data.types || []);
    sala.acoes[m.ref] = { ref: m.ref, tipo: 'golpe', golpe: g ? m.moves.indexOf(g) : -1, alvo: alvo?.ref };
  }
  resolver();
}
async function resolver() {
  if (!sala?.batalha || sala.resolvendo) return; // trava: uma escolha atrasada não resolve o mesmo turno de novo
  sala.resolvendo = true;
  const b = sala.batalha, acoes = Object.values(sala.acoes);
  clearTimeout(sala.timer);
  const ia = [...b.lados.A, ...b.lados.B].filter(m => m.hp > 0 && m.dono === 'ia').map(m => acaoDaIA(b, m));
  let res;
  try { res = await resolverTurnoMP(b, [...acoes, ...ia]); } finally { if (sala) sala.resolvendo = false; }
  if (!sala) return;
  const { estado, eventos } = res;
  sala.batalha = estado; sala.acoes = {};
  const cab = [{ txt: `Turno ${b.turno}`, cls: 'turno' }];
  if (estado.fim) finalizar([...cab, ...eventos]); else publicarEstado([...cab, ...eventos], true);
}
function finalizar(eventos) {
  const b = sala.batalha;
  // resultado por Pokémon ("dono:slot"): fração de HP (o nível pode ter sido balanceado), PP e status
  const final = {};
  // `real` = lutou no nível de verdade (não foi ajustado pelo balancear): só esses levam XP/itens pra run
  for (const m of [...b.lados.A, ...b.lados.B]) if (m.dono !== 'ia')
    final[m.dono + ':' + m.slot] = { frac: m.hp > 0 ? m.hp / m.stats.hp : 0, status: m.status, sleep: m.sleep, pp: m.moves.map(g => g.ppLeft),
      especie: m.data.speciesName, real: naNivelReal(m), nivelLuta: m.level };
  let p;
  if (b.pvp) {
    p = { pvp: true, fim: b.fim, eventos, final, times: { A: [...new Set(b.lados.A.map(m => m.dono))], B: [...new Set(b.lados.B.map(m => m.dono))] } };
  } else {
    const venceu = b.fim === 'A', B = b.lados.B, effort = {};
    for (const E of B) for (const [s, v] of Object.entries(E.data.effort || {})) effort[s] = (effort[s] || 0) + v;
    const xp = venceu ? B.reduce((a, E) => a + xpPorVitoria({ level: E.level, data: E.data }, sala.tipo === 'alfa'), 0) : 0;
    const recompensas = {};
    // cada jogador: dinheiro + 35% de chance de um item (da lista de achados da exploração)
    for (const d of new Set(b.lados.A.map(m => m.dono))) recompensas[d] = { xp, dinheiro: venceu ? B.reduce((a, E) => a + E.level * rand(8, 14), 0) : 0,
      item: venceu && Math.random() < 0.35 ? pick(FIND_ITEMS) : null };
    p = { pvp: false, fim: b.fim, eventos, final, recompensas, effort: venceu ? effort : {},
      derrotados: venceu ? B.map(E => ({ especie: E.data.speciesName, id: E.id })) : [],
      vistos: B.map(E => ({ especie: E.data.speciesName, id: E.id, shiny: E.shiny })),
      chefe: venceu && sala.tipo === 'alfa' ? sala.zona : null, chefeNivel: B[0]?.level };
  }
  enviar('fim', p);
  aoReceberFim(p);
}

/* ---------- todos: receber, escolher, aplicar ---------- */
function aoReceberEstado(p) {
  if (!sala) return;
  if (sala.batalha?.turno !== p.batalha.turno || !sala.batalha) sala.escolhidos = new Set(); // turno novo: escolhe de novo
  sala.batalha = p.batalha; sala.prazo = p.prazo; sala.acoesFeitas = p.acoesFeitas || []; sala.tipo = p.tipo; sala.zona = p.zona;
  for (const e of p.eventos || []) logRaw({ html: esc(e.txt), cls: e.cls });
  renderSala();
}
// meu próximo Pokémon que ainda não escolheu neste turno
const minhaVez = () => { const b = sala?.batalha; return b && jogaveis(b).find(m => m.dono === meuId() && !sala.escolhidos.has(m.ref) && !sala.acoesFeitas.includes(m.ref)); };
export function escolherGolpeMP(i) { escolher({ tipo: 'golpe', golpe: i, alvo: sala?.alvo }); }
export function fugirMP() { escolher({ tipo: 'fugir' }); }
export function desistirMP() { escolher({ tipo: 'desistir' }); }
export function mirarMP(ref) { if (sala) { sala.alvo = ref; renderSala(); } }
function escolher(acao) {
  const m = minhaVez(); if (!m) return;
  if (acao.tipo === 'golpe') { const alvos = inimigosDe(m); if (!alvos.some(e => e.ref === acao.alvo)) acao.alvo = alvos[0]?.ref; }
  sala.escolhidos.add(m.ref);
  const a = { ...acao, ref: m.ref };
  if (sala.anfitriao) registrarAcao(meuId(), a); else { enviar('acao', { de: meuId(), acao: a }); renderSala(); }
}
const inimigosDe = m => { const b = sala.batalha; return b.lados[ladoDe(b, m.ref) === 'A' ? 'B' : 'A'].filter(e => e.hp > 0); };

async function aoReceberFim(p) {
  if (!sala) return;
  for (const e of p.eventos || []) logRaw({ html: esc(e.txt), cls: e.cls });
  sala.batalha = null; sala.acoes = {}; sala.ocupado = true; clearTimeout(sala.timer);
  renderSala();
  let acabouARun = false;
  try { acabouARun = await (p.pvp ? aplicarPvP(p) : aplicarCoop(p)); } catch (e) { console.error(e); }
  if (acabouARun) { await sairSala(); encerrarJornada('desmaiou'); return; } // Roguelike: desmaiou no co-op = fim da run
  if (!sala) return;
  sala.ocupado = false;
  await retrack(); // atualiza os Pokémon (HP, nível) que os outros veem
  renderSala();
}
async function aplicarPvP(p) {
  const eu = meuId(), meuTime = p.times.A.includes(eu) ? 'A' : p.times.B.includes(eu) ? 'B' : null;
  if (!meuTime) return false; // estava só olhando
  const ganhei = p.fim === meuTime;
  if (sala.convidado || !temRun()) { await say(ganhei ? '🏆 Seu time venceu o PvP!' : 'Seu time perdeu o PvP.', ganhei ? 'good' : 'muted'); return false; } // convidado: não conta na run
  const S = G.S;
  S.pvp = { vitorias: (S.pvp?.vitorias || 0) + (ganhei ? 1 : 0), derrotas: (S.pvp?.derrotas || 0) + (ganhei ? 0 : 1) };
  await say(ganhei ? '🏆 Seu time venceu o PvP!' : 'Seu time perdeu o PvP. Foi uma luta amistosa: seus Pokémon voltam como estavam.', ganhei ? 'good' : 'muted');
  save();
  return false;
}
// co-op: devolve true se a run acabou (Roguelike, principal desmaiado)
async function aplicarCoop(p) {
  if (sala.convidado || !temRun()) { await say(p.fim === 'A' ? '🏆 Vitória do grupo! (Pokémon convidado: a luta não mexe na sua run.)' : 'Pokémon convidado: a luta não mexe na sua run.', 'muted'); return false; }
  const S = G.S, eu = meuId(), permadeath = DIFICULDADES[dificuldadeDe(S)].permadeath;
  for (const v of p.vistos || []) { registrar(S, 'vistos', v.especie, v.id); if (v.shiny) registrar(S, 'shinies', v.especie, v.id); }
  const meus = Object.entries(p.final).filter(([k]) => k.startsWith(eu + ':')).map(([k, f]) => [+k.split(':')[1], f]);
  if (!meus.length) { save(); return false; }
  // HP pela fração (o nível pode ter sido balanceado), PP por índice. Aliados perdidos (Roguelike) saem por último,
  // do maior slot pro menor, pra não bagunçar os índices dos outros.
  const perdidos = [];
  let principalCaiu = false;
  for (const [slot, f] of meus) {
    const M = slot === 0 ? S.player : S.aliados?.[slot - 1];
    if (!M || M.data.speciesName !== f.especie && slot > 0) continue; // equipe mudou no meio: não mexe
    if (f.frac > 0) { M.hp = Math.max(1, Math.round(M.stats.hp * f.frac)); M.status = f.status; M.sleep = f.sleep || 0; }
    else if (permadeath) { if (slot === 0) principalCaiu = true; else perdidos.push(slot - 1); }
    else { M.hp = 1; M.status = null; M.sleep = 0; } // fora do Roguelike, desmaio no co-op volta com 1 HP
    f.pp.forEach((pp, i) => { if (M.moves[i]) M.moves[i].ppLeft = Math.min(M.moves[i].pp, pp); });
  }
  if (principalCaiu) { await say(`${esc(S.player.nick || fmt(S.player.name))} desmaiou. No Roguelike não existe segunda chance.`, 'hit'); return true; }
  for (const i of perdidos.sort((a, b) => b - a)) { const A = S.aliados[i]; S.aliados.splice(i, 1); G.abertos.clear(); await say(`${esc(A.nick || fmt(A.name))} desmaiou e foi perdido pra sempre.`, 'hit'); }
  if (p.fim === 'A') {
    const r = p.recompensas[eu] || { xp: 0, dinheiro: 0 }, principal = meus.find(([s]) => s === 0)?.[1];
    // Só quem lutou no NÍVEL REAL leva os ganhos pra própria run (com o nível ajustado pelo balancear, a luta não rende)
    if (principal?.real) {
      S.money += r.dinheiro; S.wins = (S.wins || 0) + 1; S.vitoriasDesdeCentro = (S.vitoriasDesdeCentro || 0) + 1;
      for (const [s, add] of ganhoDeEVs(S.player.evs, p.effort)) S.player.evs[s] += add;
      for (const d of p.derrotados) registrar(S, 'derrotados', d.especie, d.id);
      await say(`🏆 Vitória do grupo! Você ganhou ${r.xp} de XP e ₽${r.dinheiro}.`, 'good');
      if (r.item && ITEMS[r.item]) { S.bag[r.item] = (S.bag[r.item] || 0) + 1; await say(`Você achou <b>${ITEMS[r.item].name}</b> depois da luta!`, 'good'); }
      if (p.chefe && !S.chefes?.[p.chefe]) {
        const premio = premioChefe(p.chefeNivel || 1);
        (S.chefes ||= {})[p.chefe] = true; S.money += premio; S.bag['rare-candy'] = (S.bag['rare-candy'] || 0) + 1;
        await say(`🏆 Alfa derrotado em grupo! Prêmio: ₽${premio} e 1 Rare Candy.`, 'level');
      }
      await gainExp(r.xp);
    } else await say(`🏆 Vitória do grupo! Você lutou com o nível ajustado (Nv. ${S.player.level} → ${principal?.nivelLuta}), então XP, itens e prêmios desta luta não vão pra sua run.`, 'muted');
    for (const [slot, f] of meus) if (slot > 0 && f.frac > 0 && f.real && S.aliados?.[slot - 1]) await gainExpAliado(S.aliados[slot - 1], r.xp);
  } else if (p.fim === 'B') await say('O grupo foi derrotado.', 'hit');
  else await say('O grupo fugiu.', 'muted');
  await verificarMissoes();
  save();
  return false;
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
function cartao(m, legenda, destaque = false) {
  return `<div class="mp-mon ${m.hp <= 0 ? 'caido' : ''} ${destaque ? 'vez' : ''}"><img src="${spriteFrente(m)}" alt="" onerror="this.onerror=null;this.src='${m.data.sprite}'">
    <div><b>${m.shiny ? '✨ ' : ''}${esc(m.nome)}</b> <span class="muted small">Nv. ${m.level}</span>${legenda ? `<small class="muted">${esc(legenda)}</small>` : ''}${barra(m)}</div></div>`;
}
const cartaoMembro = m => `<div class="mp-membro"><b class="mp-nome">${htmlIcone(m.icone, 'icone-mini')}${m.anfitriao ? '👑 ' : ''}${esc(m.nome)}${m.id === meuId() ? ' (você)' : ''}</b>
  <div class="mp-mons">${(m.mons || []).slice(0, sala.config.porJogador).map(x => cartao(x, x.convidado ? '✨ convidado (não é da run)' : '')).join('')}</div></div>`;
function renderSala() {
  if (!sala || G.mode !== 'mp' || !$('#mp-topo')) return;
  const b = sala.batalha, cfg = sala.config, pvp = cfg.modo === 'pvp', z = ZONES.find(x => x.id === sala.zona) || ZONES[0];
  const resumoCfg = `${pvp ? 'PvP' : 'Co-op'} · ${cfg.porJogador} Pokémon por jogador · ${cfg.balancear ? 'balanceado' : 'sem balancear'}${pvp ? '' : ' · ' + esc(z.name)}`;
  const cabecalho = `<div class="mp-cab"><h1>Sala <span class="codigo">${esc(sala.codigo)}</span></h1>
    <p class="muted">${sala.anfitriao ? 'Você é o anfitrião. Passe o código pros amigos.' : 'O anfitrião configura e começa.'} · ${sala.membros.length}/${MAX_JOGADORES} jogadores · ${resumoCfg}</p></div>`;
  if (!b) return renderLobby(cabecalho, pvp, z);
  const dono = id => id === 'ia' ? '' : (membroDe(id)?.nome || 'jogador que saiu') + (id === meuId() ? ' (você)' : '');
  const vez = minhaVez();
  $('#mp-topo').innerHTML = cabecalho + `
    <div class="mp-campo"><div class="mp-lado inimigo">${b.lados.B.map(m => cartao(m, dono(m.dono), vez?.ref === m.ref)).join('')}</div>
    <div class="mp-lado">${b.lados.A.map(m => cartao(m, dono(m.dono), vez?.ref === m.ref)).join('')}</div></div>`;
  const esperando = [...new Set(jogaveis(b).filter(m => !sala.acoesFeitas.includes(m.ref)).map(m => membroDe(m.dono)?.nome || '?'))];
  const status = `<p class="muted small">Turno ${b.turno} · ${esperando.length ? `esperando: ${esperando.map(esc).join(', ')}` : 'resolvendo…'} · <span id="mp-relogio">${Math.max(0, Math.ceil((sala.prazo - Date.now()) / 1000))}s</span></p>`;
  const sair = `<button class="btn ghost" data-act="mp-sair">Sair da sala</button>`;
  if (!jogaveis(b).some(m => m.dono === meuId())) { $('#mp-acoes').innerHTML = status + `<p class="muted">Seus Pokémon estão fora da luta; torça pelo seu time!</p><div class="subrow">${sair}</div>`; return; }
  if (!vez) { $('#mp-acoes').innerHTML = status + `<p class="muted">Escolhas enviadas.</p><div class="subrow">${sair}</div>`; return; }
  const alvos = inimigosDe(vez); if (!alvos.some(e => e.ref === sala.alvo)) sala.alvo = alvos[0]?.ref;
  const semPP = vez.moves.every(g => g.ppLeft <= 0);
  $('#mp-acoes').innerHTML = status + `<p class="mp-quem">Vez de <b>${esc(vez.nome)}</b></p>` +
    (alvos.length > 1 ? `<div class="subrow">Alvo: ${alvos.map(m => `<button class="btn ${m.ref === sala.alvo ? '' : 'ghost'} sm" data-act="mp-mirar" data-v="${m.ref}">${esc(m.nome)}</button>`).join('')}</div>` : '') +
    `<div class="moves">${semPP ? '<button class="mv" style="--c:#A8A77A" data-act="mp-golpe" data-v="-1"><b>Struggle</b><small>Sem PP.</small></button>'
      : vez.moves.map((g, i) => `<button class="mv" style="--c:${TC[g.type] || '#888'}" data-act="mp-golpe" data-v="${i}" ${g.ppLeft <= 0 ? 'disabled' : ''}><b>${esc(fmt(g.name))}</b><small>${TYPE_PT[g.type] || g.type}, ${CLS_PT[g.cls]}, poder ${g.power ?? '—'}</small><span class="pp">PP ${g.ppLeft}/${g.pp}</span></button>`).join('')}</div>
    <div class="subrow">${b.pvp ? '<button class="btn ghost" data-act="mp-desistir">Desistir</button>' : '<button class="btn ghost" data-act="mp-fugir">Fugir</button>'}${sair}</div>`;
}
function renderLobby(cabecalho, pvp, z) {
  const cfg = sala.config, dis = sala.ocupado ? 'disabled' : '';
  const time = t => sala.membros.filter(m => (m.time || 'B') === t);
  $('#mp-topo').innerHTML = cabecalho + (pvp
    ? `<div class="mp-times">${['A', 'B'].map(t => `<div class="mp-time"><h3>Time ${t} <small class="muted">(${time(t).length})</small></h3>${time(t).map(cartaoMembro).join('') || '<p class="small muted">Ninguém ainda.</p>'}</div>`).join('')}</div>`
    : `<div class="mp-grupo">${sala.membros.map(cartaoMembro).join('')}</div>`);
  const trocarTime = pvp ? `<div class="subrow">Seu time: ${['A', 'B'].map(t => `<button class="btn ${sala.time === t ? '' : 'ghost'} sm" data-act="mp-time" data-v="${t}" ${dis}>Time ${t}</button>`).join('')}</div>` : '';
  const sair = '<button class="btn ghost" data-act="mp-sair">Sair da sala</button>';
  if (!sala.anfitriao) { $('#mp-acoes').innerHTML = trocarTime + `<p class="muted">${sala.ocupado ? 'Aplicando o resultado…' : 'Esperando o anfitrião começar.'}</p><div class="subrow">${sair}</div>`; return; }
  const zonas = temRun() ? ZONES.filter(x => zonaLiberada(x, G.S.player.level)) : [];
  // amigos (com conta) que ainda não estão na sala: um toque manda o convite
  const naSalaIds = new Set(sala.membros.map(m => m.id));
  const amigosFora = usuario() ? nuvem.amigos.filter(a => a.status === 'aceita' && !naSalaIds.has(a.amigo)) : [];
  const convites = amigosFora.length ? `<div class="mp-convites"><b>Chamar amigos:</b> ${amigosFora.map(a => `<button class="btn ghost sm" data-act="mp-convidar" data-v="${a.amigo}">${htmlIcone({ id: a.icone_id, shiny: a.icone_shiny }, 'icone-mini')} ${esc(a.apelido)}</button>`).join('')}</div>`
    : usuario() ? '' : '<p class="small muted">Entre na conta pra chamar amigos direto (sem precisar passar o código).</p>';
  const podePvp = time('A').length && time('B').length;
  $('#mp-acoes').innerHTML = `<div class="mp-config">
      <label class="campo">Modo<select data-mp-cfg="modo" ${dis}><option value="coop" ${!pvp ? 'selected' : ''} ${temRun() ? '' : 'disabled'}>Co-op (contra selvagens / Alfa)${temRun() ? '' : ' — precisa de uma run'}</option><option value="pvp" ${pvp ? 'selected' : ''}>PvP (Time A × Time B)</option></select></label>
      <label class="campo">Pokémon por jogador<select data-mp-cfg="porJogador" ${dis}>${[1, 2, 3].map(n => `<option value="${n}" ${cfg.porJogador === n ? 'selected' : ''}>${n}${n === 1 ? ' (só o principal)' : ' (com aliados)'}</option>`).join('')}</select></label>
      ${pvp ? '' : `<label class="campo">Zona<select data-mp-cfg="zona" ${dis}>${zonas.map(x => `<option value="${x.id}" ${x.id === sala.zona ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>`}
      <label class="check"><input type="checkbox" data-mp-cfg="balancear" ${cfg.balancear ? 'checked' : ''} ${dis}> Balancear níveis
        <small class="muted">${pvp ? 'Todos no nível médio da luta; o time menor ganha HP extra.' : 'O grupo todo no nível do seu Pokémon. Quem tiver o nível ajustado joga por diversão: não leva XP nem itens pra própria run.'} Desligado: níveis reais${pvp ? '' : ', cada um leva o que ganhar pra própria run, e os inimigos acompanham o mais forte'} (mais difícil).</small></label>
    </div>${trocarTime}${convites}
    <div class="subrow">${pvp
      ? `<button class="btn big" data-act="mp-pvp" ${dis || !podePvp ? 'disabled' : ''} title="${podePvp ? '' : 'Cada time precisa de pelo menos um jogador'}">⚔ Começar PvP</button>`
      : `<button class="btn big" data-act="mp-explorar" ${dis}>🌿 Explorar juntos</button>${z.chefe ? `<button class="btn" data-act="mp-alfa" ${dis}>⚔ Desafiar o Alfa (${z.chefe.nome})</button>` : ''}`}${sair}</div>`;
}
