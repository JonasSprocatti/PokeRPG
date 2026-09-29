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
import { G, save, registrar, dificuldadeDe, rotasAtuais, centroPokemon, zerarDescontoCentro } from './estado.js';
import { healFull } from './efeitos.js';
import { $, limparTopo, logRaw, say, toast, ask } from './ui.js';
import { spriteFrente } from './render.js';
import { API, ZONES, TYPE_PT, TC, CLS_PT, DIFICULDADES, ITEMS, FIND_ITEMS, REGIOES_INICIAIS, SPR, ITEM_CRISTAL_Z } from './dados.js';
import { sortearDaRota, genDe } from './mapas.js';
import { EVENTOS, situacaoDoEvento, eventoDaSemana, jaComecou, registrarTentativa, agoraDoEvento, idDaSemana, modoComEvento, dataBR, formatarEspera, EVENTO_SEM_PERMADEATH, darItensDeRaide, inventarioRaide, gastarItemDeRaide } from './evento.js';
import { MAX_TIME_HALL, htmlLojaConta, htmlEquiparConta, comprarComumConta, comprarSeguradoConta, reidratarHall } from './loja-conta.js';
import { seg } from './segurados.js';
import { prepararChefe, nivelDoChefe, jogadoresEfetivos, resumoDoChefe, habilidadeDoChefe, aplicarClimaDoChefe, ITENS_DE_RAIDE, ITEM_DO_RAIDE } from './boss.js';
import { barraTelas, rotuloVoltar } from './navegacao.js';
import { zonaLiberada, xpPorVitoria, ganhoDeEVs, freshVol, statsDeChefe, premioChefe, melhorGolpe, ESPERTEZA, golpeDoClima, golpeDoTera, golpeDoBattleBond, climaDe, climaDasRotasAtivo, CLIMA_TURNOS, moverGolpe, itemTemEfeito } from './regras.js';
import { fotoDoMon, novaBatalhaMP, resolverTurnoMP, acaoDaIA, monMP, ladoDe, balancearPvP, balancearCoop, nivelarMon, nivelMedio, naNivelReal, reviverNoEvento, reviverCompanheiro, usarRaideNoEvento, MAX_REVIVES } from './mp-motor.js';
import { carregarCarreira, registrarVitoriaDeEvento, conquistasDaConta, hallDaConta, saldoArenaDaConta } from './carreira.js';
import { registrarAbate, megaLiberada, teraLiberada, gmaxLiberado, zLiberado } from './conquistas.js';
import { megasDisponiveis } from './mega.js';
import { desbloqueadas } from './roguelike.js';
import { canalSala, fecharCanal, usuario, nuvem, nuvemConfigurada, meuIcone, convidarAmigo, sincronizarComRetentativa, idJogador } from './nuvem.js';
import { htmlIcone, htmlInsigniaDe } from './conta.js';
import { loadPokemon, loadMove } from './api.js';
import { makeMon } from './pokemon.js';
import { gainExp, gainExpAliado } from './progressao.js';
import { verificarMissoes } from './missoes.js';
import { encerrarJornada } from './fim.js';
import { esc, fmt, pick, rand, clamp, offline } from './util.js';

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
// Sala de Raide (modo 'raide'): ninguém tem run nenhuma pra mexer — `sala.config` já chega sincronizado a todo
// mundo pela 'lobby' antes da luta começar, então checar o modo é o bastante (sem precisar de um campo à parte
// no estado da batalha, nem broadcast extra).
const raideSemRun = () => sala?.config?.modo === 'raide';
// espécies que dá pra levar como convidado: a mesma regra da criação (iniciais + desbloqueadas no Roguelike)
function especiesConvidado() {
  const lista = REGIOES_INICIAIS.flatMap(r => r.ids.map((id, i) => ({ id, nome: r.nomes[i] })));
  for (const p of desbloqueadas(carregarCarreira().jornadas)) if (!lista.some(x => x.id === p.id)) lista.push({ id: p.id, nome: fmt(p.especie) });
  return lista;
}
export function escolherEntrada(tipo) { if (tipo === 'run' && !temRun()) return; entrada = { tipo, id: tipo === 'run' ? null : entrada.id }; telaMultiplayer(); }
export function escolherConvidado(id) { entrada = { tipo: 'convidado', id: +id }; telaMultiplayer(); }

// id na sala: o da conta, ou um de visitante guardado neste navegador (idJogador, nuvem.js — usado também
// pela presença global, presenca.js, pra não ter duas fontes do mesmo id)
const meuId = idJogador;
const meuNome = () => nuvem.apelido || G.S?.player?.nick || (G.S ? fmt(G.S.player.name) : 'Treinador');
// principal (slot 0) + até 2 aliados em pé e que não estão descansando (slot = índice em S.aliados + 1).
// Convidado: só ele, marcado `convidado` (o anfitrião ajusta o nível dele; o resultado não vai pra save nenhum).
function minhasFotos() {
  const eu = meuId(), S = G.S;
  // Sala de Raide (modo 'raide'): Pokémon do Hall da Fama, reidratados no nível real — ver `atualizarHallMons`.
  // Cada um já sai com o item da Loja de preparo (reidratarHall), sem tocar em nenhuma run.
  if (sala?.config?.modo === 'raide') return (sala.hallMons || []).map((m, i) => ({ ...fotoDoMon(m, '', eu, null, i), hall: true }));
  if (sala?.convidado) return [{ ...fotoDoMon(sala.convidado, '', eu, null, 0), convidado: true }];
  const aliados = (S.aliados || []).map((A, i) => [A, i]).filter(([A]) => A.hp > 0 && A.ordem !== 'fora').slice(0, 2);
  return [fotoDoMon(S.player, '', eu, null, 0), ...aliados.map(([A, i]) => fotoDoMon(A, '', eu, null, i + 1))];
}
// a insígnia de evento que a pessoa escolheu mostrar ao lado do nome (só o ID vai pela rede; o ícone sai de BADGES)
const meuPayload = () => ({ id: meuId(), nome: meuNome(), icone: meuIcone(), anfitriao: sala.anfitriao, time: sala.time, entrouEm: sala.entrouEm, mons: minhasFotos(), badge: nuvem.badgeExibida || null, pronto: !!sala.pronto });
const iconeDaBadge = htmlInsigniaDe;   // (conta.js) o mesmo ícone do topo, da lista de amigos e do ranking
// anfitrião chama um amigo: aviso aparece pra ele em qualquer tela (nuvem.convidarAmigo → canal pessoal do amigo)
export async function convidarAmigoMP(amigoId) {
  if (!sala) return;
  const a = nuvem.amigos.find(x => x.amigo === amigoId);
  try { await convidarAmigo(amigoId, { codigo: sala.codigo, modo: sala.config.modo }); toast(`Convite enviado pra <b>${esc(a?.apelido || 'seu amigo')}</b>.`, 4000); }
  catch (e) { toast(`Não deu pra convidar: ${esc(e.message)}`, 6000); }
}
/* ---------- rede: envio confiável, diagnóstico e ressincronização ----------
   O Realtime do Supabase às vezes engole um broadcast (aba em segundo plano, rede oscilando). Antes isso travava a
   sala: a escolha de alguém não chegava no anfitrião e o turno só saía quando o prazo de 45 s estourava. Agora:
   • `enviar` confere a resposta e tenta de novo (o `send` devolve 'ok' | 'timed out' | 'error');
   • o anfitrião republica o estado a cada PULSO_MS enquanto espera escolhas (quem perdeu a mensagem se acerta sozinho);
   • qualquer um pede o estado de novo com 🔄 Sincronizar (evento 'sincronizar');
   • tudo fica no diagnóstico da sala (últimas linhas) e no console com o prefixo [mp]. */
const PULSO_MS = 4000, ESPERA_ANFITRIAO_MS = 20000;
const diario = [];
function anotar(txt, ruim = false) {
  diario.push({ t: Date.now(), txt, ruim });
  if (diario.length > 40) diario.shift();
  console[ruim ? 'warn' : 'debug']('[mp]', txt);
  if (sala) sala.ultimoEvento = Date.now();
}
export const diarioMP = () => diario.slice(-8).reverse();
async function enviar(event, payload, tentativas = 3) {
  for (let i = 1; i <= tentativas; i++) {
    if (!sala?.canal) return false;
    let r;
    try { r = await sala.canal.send({ type: 'broadcast', event, payload }); } catch (e) { r = 'erro: ' + e.message; }
    if (r === 'ok') { anotar(`→ ${event}${i > 1 ? ` (na ${i}ª tentativa)` : ''}`); if (sala) sala.conexao = 'ok'; return true; }
    anotar(`⚠ não consegui enviar "${event}" (${r}) — tentativa ${i} de ${tentativas}`, true);
    await new Promise(ok => setTimeout(ok, 400 * i));
  }
  if (sala) { sala.conexao = 'instavel'; renderSala(); }
  return false;
}
// pacote do estado atual (sem mexer no prazo) — usado pelo pulso e por quem pede pra sincronizar
const pacoteEstado = (eventos = []) => ({ batalha: sala.batalha, eventos, prazo: sala.prazo, acoesFeitas: Object.keys(sala.acoes), tipo: sala.tipo, zona: sala.zona });
function ligarPulso() {
  if (!sala?.anfitriao) return;
  clearInterval(sala.pulso);
  sala.pulso = setInterval(() => { if (sala?.anfitriao && sala.batalha && !sala.resolvendo) enviar('estado', pacoteEstado(), 1); }, PULSO_MS);
}
const desligarPulso = () => { if (sala) clearInterval(sala.pulso); };
// 🔄 Sincronizar: o anfitrião reenvia o que vale agora; quem não é anfitrião pede pra ele
export function sincronizarSala() {
  if (!sala) return;
  anotar('🔄 sincronizando');
  if (sala.anfitriao) { if (sala.batalha) enviar('estado', pacoteEstado()); else publicarLobby(); }
  else enviar('sincronizar', { de: meuId() });
  renderSala();
}
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
    hallSel: { selecao: [], equipamento: {} }, hallMons: [], pronto: false, // Sala de Raide (modo 'raide')
    mensagens: [], // chat da sala: só na memória, nunca persiste (some ao sair)
    config: { modo: anfitriao && !temRun() ? 'pvp' : 'coop', porJogador: 1, balancear: true }, time: anfitriao ? 'A' : 'B', entrouEm: Date.now(), encontrouAnfitriao: anfitriao };
  try {
    const canal = await canalSala(codigo, meuId());
    sala.canal = canal;
    canal.on('presence', { event: 'sync' }, aoMudarPresenca)
      .on('broadcast', { event: 'estado' }, ({ payload }) => aoReceberEstado(payload))
      .on('broadcast', { event: 'acao' }, ({ payload }) => { if (sala?.anfitriao) registrarAcao(payload.de, payload.acao); })
      .on('broadcast', { event: 'chat' }, ({ payload }) => aoReceberChat(payload))
      .on('broadcast', { event: 'fim' }, ({ payload }) => aoReceberFim(payload))
      .on('broadcast', { event: 'lobby' }, ({ payload }) => { anotar('← lobby'); if (sala && !sala.anfitriao) { sala.zona = payload.zona; sala.config = payload.config; renderSala(); } })
      .on('broadcast', { event: 'sincronizar' }, () => { // alguém pediu o estado de novo
        if (!sala?.anfitriao) return;
        anotar('← pedido de sincronização');
        if (sala.batalha) enviar('estado', pacoteEstado()); else publicarLobby();
      });
    canal.subscribe(async status => {
      anotar('canal: ' + status, !['SUBSCRIBED', 'CLOSED'].includes(status));
      if (!sala) return;
      if (status === 'SUBSCRIBED') {
        sala.conexao = 'ok'; sala.tentativas = 0;
        await canal.track(meuPayload());
        if (sala.anfitriao) { publicarLobby(); if (sala.batalha) enviar('estado', pacoteEstado()); }
        else enviar('sincronizar', { de: meuId() }); // voltei: me manda o que está valendo agora
        renderSala();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        // Antes isso fechava a sala na hora: trocar de aba já derrubava todo mundo. Agora tenta voltar sozinho.
        sala.conexao = 'caiu'; renderSala();
        if ((sala.tentativas = (sala.tentativas || 0) + 1) > 5) { await sairSala(); return telaMultiplayer('Perdi a conexão com a sala e não consegui voltar. Tente entrar de novo.'); }
        setTimeout(() => { if (sala?.canal === canal && sala.conexao === 'caiu') { anotar(`reconectando (tentativa ${sala.tentativas})`, true); canal.subscribe(); } }, 1500 * sala.tentativas);
      }
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
  anotar('saindo da sala');
  clearTimeout(s.timer); clearInterval(s.relogio); clearInterval(s.pulso); clearTimeout(s.semAnfitriao);
  try { await s.canal?.untrack(); await fecharCanal(s.canal); } catch (e) { console.error(e); }
}
function aoMudarPresenca() {
  if (!sala) return;
  sala.membros = Object.values(sala.canal.presenceState()).map(l => l[0]).filter(Boolean)
    .sort((a, b) => (b.anfitriao - a.anfitriao) || (a.entrouEm - b.entrouEm));
  if (sala.membros.some(m => m.anfitriao)) {
    sala.encontrouAnfitriao = true;
    clearTimeout(sala.semAnfitriao); sala.semAnfitriao = null; // voltou (ou nem chegou a sumir de verdade)
  } else if (sala.encontrouAnfitriao && !sala.anfitriao && !sala.semAnfitriao) {
    // o anfitrião sumindo da presença costuma ser a aba dele em segundo plano: espera antes de desistir da sala
    anotar('anfitrião sumiu da presença — esperando ele voltar', true);
    sala.semAnfitriao = setTimeout(() => {
      if (!sala || sala.membros.some(m => m.anfitriao)) return;
      sairSala(); telaMultiplayer('O anfitrião saiu e não voltou. A sala acabou.');
    }, ESPERA_ANFITRIAO_MS);
  }
  if (!sala.anfitriao && sala.membros.findIndex(m => m.id === meuId()) >= MAX_JOGADORES) { sairSala(); return telaMultiplayer(`A sala está cheia (máximo ${MAX_JOGADORES}).`); }
  if (sala.anfitriao) publicarLobby(); // quem acabou de entrar recebe a configuração
  renderSala();
}

/* ---------- lobby: configuração (anfitrião) e time (cada um) ---------- */
function publicarLobby() { enviar('lobby', { zona: sala.zona, config: sala.config }); }
export function configurarSala(campo, valor) {
  if (!sala?.anfitriao || sala.batalha) return;
  if (campo === 'zona') {
    const z = temRun() && rotasAtuais().find(x => x.id === valor); // só rotas do mapa (Gen) da run do anfitrião
    if (!z || !zonaLiberada(z, G.S.player.level, G.S)) return;
    sala.zona = valor;
  } else if (campo === 'modo' && ['coop', 'pvp', 'raide'].includes(valor)) {
    if (valor === 'coop' && !temRun()) return renderSala(); // co-op é a run do anfitrião
    sala.config.modo = valor;
    if (valor === 'raide') sala.config.porJogador = clamp(sala.config.porJogador, 1, MAX_TIME_HALL);
  }
  else if (campo === 'porJogador') sala.config.porJogador = clamp(+valor || 1, 1, 3);
  else if (campo === 'balancear') sala.config.balancear = !!valor;
  publicarLobby(); renderSala();
}
export async function escolherTime(t) {
  if (!sala || sala.batalha || !['A', 'B'].includes(t)) return;
  sala.time = t; await retrack(); renderSala();
}

/* ---------- Sala de Raide (modo 'raide'): Hall da Fama + Loja de preparo, sem run nenhuma ----------
   Pedido do usuário (28/09/2026): pra jogar o chefe da semana em grupo com Pokémon de verdade (não o convidado de
   Nv. 5), antes era obrigatório ter uma run em andamento — "preciso criar um save novo" (relato real). Agora
   qualquer um pode hospedar/entrar numa Sala de Raide: cada jogador escolhe de 1 a MAX_TIME_HALL Pokémon do
   PRÓPRIO Hall da Fama (o mesmo da Arena do Chefe, arena.js) e equipa item da PRÓPRIA Loja de preparo — tudo
   local, na conta de cada um, igual à Arena. Quando os dois lados estão prontos (`pronto`), o anfitrião começa.
   `sala.hallSel` (seleção + equipamento) é só desta pessoa; `sala.hallMons` é a reidratação PRONTA (rede, async)
   que `minhasFotos()` usa pra montar a "foto" que viaja pela sala — igual ao `sala.convidado`, só que plural. */
let atualizandoHall = false;
async function atualizarHallMons() {
  if (!sala || atualizandoHall) return;
  atualizandoHall = true; renderSala();
  try {
    const hall = hallDaConta(), sel = sala.hallSel;
    const entradas = sel.selecao.map(c => hall.find(e => e.chave === c)).filter(Boolean);
    sala.hallMons = await Promise.all(entradas.map(e => reidratarHall(e, sel.equipamento[e.chave])));
  } catch (e) { console.error(e); toast('Não consegui buscar um dos Pokémon do Hall agora.', 5000); }
  finally { atualizandoHall = false; if (sala) { await retrack(); renderSala(); } }
}
export function raideSelecionarHall(chave) {
  if (!sala || sala.batalha || sala.config.modo !== 'raide') return;
  const sel = sala.hallSel;
  if (sel.selecao.includes(chave)) { sel.selecao = sel.selecao.filter(c => c !== chave); delete sel.equipamento[chave]; }
  else if (sel.selecao.length < MAX_TIME_HALL) sel.selecao = [...sel.selecao, chave];
  else return;
  sala.pronto = false; atualizarHallMons();
}
export function raideEquiparHall(chave, id) {
  if (!sala || sala.batalha || sala.config.modo !== 'raide' || !sala.hallSel.selecao.includes(chave)) return;
  const eq = sala.hallSel.equipamento;
  if (id) { for (const c of Object.keys(eq)) if (eq[c] === id) delete eq[c]; eq[chave] = id; } else delete eq[chave];
  atualizarHallMons();
}
export function raideComprarComum(id) {
  if (!sala) return;
  const r = comprarComumConta(id); if (!r.ok) return toast(r.motivo || 'Não deu.', 4000);
  renderSala();
}
export function raideComprarSegurado(id) {
  if (!sala) return;
  const r = comprarSeguradoConta(id); if (!r.ok) return toast(r.motivo || 'Não deu.', 4000);
  renderSala();
}
// "pronto" — o anfitrião só consegue começar a Raide quando TODO MUNDO na sala está pronto (com Pokémon escolhido)
export async function alternarProntoMP() {
  if (!sala || sala.batalha) return;
  sala.pronto = !sala.pronto; await retrack(); renderSala();
}
const todosProntosParaRaide = () => sala.membros.length > 0 && sala.membros.every(m => m.pronto && m.mons?.length);

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
    if (cfg.modo === 'raide') {
      // Sala de Raide: ninguém precisa de run — cada um traz o próprio Hall da Fama (ver a seção acima).
      if (!todosProntosParaRaide()) throw new Error('Espere todo mundo escolher os Pokémon do Hall da Fama e marcar "pronto".');
      const agora = agoraDoEvento(), ev = eventoDaSemana(agora);
      if (!ev || !jaComecou(agora)) throw new Error('O chefe da semana não está disponível agora.');
      A = montarLado(membros, 'A');
      if (!A.length) throw new Error('Ninguém escolheu um Pokémon do Hall ainda.');
      const nivel = Math.max(...A.map(m => m.level));
      const maxIv = { hp: 31, attack: 31, defense: 31, 'special-attack': 31, 'special-defense': 31, speed: 31 };
      const E = await makeMon(await loadPokemon(ev.formaId), nivelDoChefe(nivel), { ivs: maxIv, shiny: false, ability: habilidadeDoChefe(ev.chefe) || undefined });
      const golpes = (await Promise.all((ev.golpes || []).map(n => loadMove(`${API}/move/${n}/`).catch(() => null)))).filter(Boolean).map(m => ({ ...m, ppLeft: m.pp }));
      if (golpes.length) E.moves = golpes;
      prepararChefe(E, jogadoresEfetivos(membros.length, cfg.porJogador), ev.chefe);
      B = [fotoDoMon(E, 'B0', 'ia', ev.nome)];
      opcoes.evento = ev.id;
      tipo = 'evento';   // reaproveita TODO o resto do fluxo de evento (revive, itens de raide, prêmio…)
      registrarTentativa();
      abertura = `☄ RAIDE: ${B[0].nome} (Nv. ${B[0].level}) surge! Imune a status, sem fuga. Perder não custa nada — os Pokémon são do Hall da Fama de cada um.`;
    } else if (cfg.modo === 'pvp') {
      A = montarLado(membros.filter(m => m.time === 'A'), 'A'); B = montarLado(membros.filter(m => m.time === 'B'), 'B');
      if (!A.length || !B.length) throw new Error('Os dois times precisam de pelo menos um jogador.');
      if (cfg.balancear) { const b = balancearPvP(A, B); A = b.A; B = b.B; abertura = `Balanceado: todos no nível ${b.nivel}${A.length !== B.length ? ', e o time menor ganhou HP extra' : ''}.`; }
      else { // convidado não tem nível "real": entra na média dos outros (ou 50 se só houver convidados)
        const reais = [...A, ...B].filter(m => !m.convidado), nv = reais.length ? nivelMedio(reais) : 50;
        A = A.map(m => m.convidado ? nivelarMon(m, nv) : m); B = B.map(m => m.convidado ? nivelarMon(m, nv) : m);
      }
      opcoes.pvp = true;
    } else {
      if (!temRun()) throw new Error('Co-op é jogar a run de alguém: o anfitrião precisa de uma run em andamento.');
      const rs = rotasAtuais(), z = rs.find(x => x.id === sala.zona) || rs[0]; // níveis da run do anfitrião
      if (tipo === 'alfa' && !z.chefe) return; // a luta dos lendários (rota final) é só no single player
      if (tipo === 'alfa') opcoes.alfa = true;  // o Alfa pode carregar um Z-Move (mp-motor.novaBatalhaMP)
      if (climaDasRotasAtivo(G.S)) opcoes.zona = z.id; // o campo nasce com o clima/terreno da rota, se a run do anfitrião usa (PvP não tem rota: campo limpo)
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
      } else if (tipo === 'evento') {
        // chefe da semana: o mesmo de startEvento (batalha.js), com HP que cresce menos que o número de jogadores (boss.jogadoresEfetivos)
        const sit = situacaoDoEvento({ dificuldade: dificuldadeDe(G.S), gen: genDe(G.S) });
        if (!sit.ok) throw new Error('O chefe da semana não está disponível agora.');
        const ev = sit.evento, maxIv = { hp: 31, attack: 31, defense: 31, 'special-attack': 31, 'special-defense': 31, speed: 31 };
        const E = await makeMon(await loadPokemon(ev.formaId), nivelDoChefe(cfg.balancear ? meuNivel : maisForte), { ivs: maxIv, shiny: false, ability: habilidadeDoChefe(ev.chefe) || undefined });
        const golpes = (await Promise.all((ev.golpes || []).map(n => loadMove(`${API}/move/${n}/`).catch(() => null)))).filter(Boolean).map(m => ({ ...m, ppLeft: m.pp }));
        if (golpes.length) E.moves = golpes;
        prepararChefe(E, jogadoresEfetivos(membros.length, cfg.porJogador), ev.chefe);
        B = [fotoDoMon(E, 'B0', 'ia', ev.nome)];
        opcoes.evento = ev.id;
        registrarTentativa();
      } else {
        B = await Promise.all(membros.map(async (_, i) => { // um selvagem por jogador
          let lvl = rand(z.min, z.max);
          if (!cfg.balancear) lvl = Math.max(lvl, maisForte);
          const E = await makeMon(await loadPokemon(sortearDaRota(z).id), lvl); // pela taxa de aparição da rota
          return fotoDoMon(E, 'B' + i, 'ia', fmt(E.name) + ' selvagem');
        }));
      }
      abertura = `${tipo === 'evento' ? `☄ EVENTO DA SEMANA: ${B[0].nome} (Nv. ${B[0].level}) surge! Imune a status, sem fuga. Quem ficar sem Pokémon em pé pode usar um Revive (até ${MAX_REVIVES}) enquanto o grupo aguenta.`
        : tipo === 'alfa' ? `⚔ ${B[0].nome} (Nv. ${B[0].level}) desafia o grupo!` : `${B.map(e => `${e.nome} (Nv. ${e.level})`).join(', ')} apareceu!`} ${abertura}`;
    }
    sala.batalha = novaBatalhaMP(A, B, opcoes);
    if (tipo === 'evento') aplicarClimaDoChefe(sala.batalha.campo, EVENTOS.find(e => e.id === opcoes.evento)?.chefe, CLIMA_TURNOS);   // Sol/Chuva primordiais
    sala.tipo = cfg.modo === 'pvp' ? 'pvp' : tipo; sala.acoes = {}; sala.revivesConsumidos = 0; sala.raideConsumidos = {}; sala.tentativaEvento = tipo === 'evento';
    publicarEstado([{ txt: cfg.modo === 'pvp' ? '— PvP —' : `— ${(ZONES.find(x => x.id === sala.zona) || ZONES[0]).name} —`, cls: 'turno' }, { txt: abertura, cls: 'enc' }], true);
  } catch (e) { console.error(e); logRaw({ html: esc(e.message), cls: 'hit' }); }
  finally { if (sala) { sala.ocupado = false; renderSala(); } }
}
function publicarEstado(eventos, novoTurno) {
  if (novoTurno) { sala.prazo = Date.now() + PRAZO_MS; clearTimeout(sala.timer); sala.timer = setTimeout(autoCompletar, PRAZO_MS); }
  const p = pacoteEstado(eventos);
  enviar('estado', p);
  ligarPulso(); // enquanto a batalha rola, o anfitrião repete o estado de tempos em tempos
  aoReceberEstado(p); // broadcast não volta pra quem enviou
}
const jogaveis = b => [...b.lados.A, ...b.lados.B].filter(m => m.hp > 0 && m.dono !== 'ia');
const primeiroInimigo = (b, m) => b.lados[ladoDe(b, m.ref) === 'A' ? 'B' : 'A'].find(e => e.hp > 0);
// Revive no meio da luta do chefe (o anfitrião valida e aplica NA HORA: o Pokémon volta e já escolhe neste turno)
function registrarRevive(de, acao) {
  const b = sala?.batalha; if (!b || sala.resolvendo) { anotar('← revive ignorado (luta resolvendo ou fora dela)', true); return; }
  // Sala de Raide: reviverCompanheiro NÃO exige o time inteiro caído (dá pra reviver enquanto ainda luta), e
  // aceita Max Revive (pct=100, `acao.pct` mandado pelo cliente). Fora dela, continua a regra de sempre.
  const m = sala.config.modo === 'raide' ? reviverCompanheiro(b, acao.ref, de, acao.pct || 50) : reviverNoEvento(b, acao.ref, de);
  if (!m) { anotar(`← revive recusado (${acao.ref})`, true); return; }
  anotar(`← revive de ${m.nome}`);
  publicarEstado([{ txt: `💊 ${m.nome} foi revivido com um ${acao.pct === 100 ? 'Max Revive (HP cheio)' : 'Revive (metade do HP)'} e volta pra luta!`, cls: 'good' }], false);
}
// Item de raide (Cristal de Ruptura, Selo de Interrupção, Escudo Astral): ação livre, aplicada NA HORA pelo anfitrião
function registrarRaide(de, acao) {
  const b = sala?.batalha; if (!b || sala.resolvendo) { anotar('← item de raide ignorado (luta resolvendo ou fora dela)', true); return; }
  const r = usarRaideNoEvento(b, de, acao.item);
  if (!r.ok) { anotar(`← item de raide recusado (${acao.item}): ${r.motivo}`, true); return; }
  anotar(`← item de raide: ${acao.item}`);
  const quem = membroDe(de)?.nome || 'Alguém';
  publicarEstado([{ txt: `🎒 ${quem} usou ${ITEMS[ITEM_DO_RAIDE[acao.item]]?.name || 'um item de raide'}!`, cls: 'good' }, ...r.efeitos.filter(e => e.dizer).map(e => ({ txt: e.dizer, cls: e.cls || 'status' }))], false);
}
// Reordenar golpes (▲▼): ação livre como Revive/item de raide — o anfitrião muta a ordem no Pokémon CANÔNICO
// (o dele, não a cópia local de quem pediu) e reenvia o estado, senão a escolha por índice do próximo turno
// bateria errado (cada lado veria uma ordem diferente pro mesmo Pokémon).
function registrarGolpeMover(de, acao) {
  const b = sala?.batalha; if (!b || sala.resolvendo) { anotar('← reordenar golpe ignorado (luta resolvendo)', true); return; }
  const m = monMP(b, acao.ref);
  if (!m || m.dono !== de || m.hp <= 0) { anotar(`← reordenar golpe ignorado (${acao.ref})`, true); return; }
  m.moves = moverGolpe(m.moves, acao.i, acao.dir);
  publicarEstado([], false);
}
function registrarAcao(de, acao) {
  const b = sala?.batalha; if (!b || !acao) return;
  if (acao.tipo === 'revive') return registrarRevive(de, acao);
  if (acao.tipo === 'raide') return registrarRaide(de, acao);
  if (acao.tipo === 'golpe-mover') return registrarGolpeMover(de, acao);
  const m = monMP(b, acao.ref);
  if (!m || m.dono !== de || m.hp <= 0) { anotar(`← escolha ignorada (${acao.ref}): não é dela ou já caiu`, true); return; } // só o dono escolhe pelos próprios
  anotar(`← escolha de ${m.nome} (${acao.tipo})`);
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
  // Alfa pensa melhor que selvagem (regras.ESPERTEZA)
  const esperteza = sala.tipo === 'alfa' || sala.tipo === 'evento' ? ESPERTEZA.chefe : ESPERTEZA.selvagem;
  const ia = [...b.lados.A, ...b.lados.B].filter(m => m.hp > 0 && m.dono === 'ia').map(m => acaoDaIA(b, m, Math.random, esperteza));
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
    // `item`: item segurado que se GASTA no uso (Faixa de Foco) precisa voltar pra run como null, senão o
    // jogador ganharia um item de graça toda luta — o resto (Restos etc.) nunca muda sozinho, então só sincronizar
    // sem condição já cobre os dois casos.
    final[m.dono + ':' + m.slot] = { frac: m.hp > 0 ? m.hp / m.stats.hp : 0, status: m.status, sleep: m.sleep, item: m.item || null, pp: m.moves.map(g => g.ppLeft),
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
      chefe: venceu && sala.tipo === 'alfa' ? sala.zona : null, chefeNivel: B[0]?.level, evento: b.evento || null };
  }
  enviar('fim', p);
  aoReceberFim(p);
}

/* ---------- todos: receber, escolher, aplicar ---------- */
function aoReceberEstado(p) {
  if (!sala) return;
  sala.conexao = 'ok'; sala.ultimoEvento = Date.now();
  const luta = !sala.batalha;   // primeira vez que vejo esta luta
  if (sala.batalha?.turno !== p.batalha.turno || !sala.batalha) { anotar(`← estado (turno ${p.batalha.turno})`); sala.escolhidos = new Set(); sala.gimmicksSel = {}; } // turno novo: escolhe de novo
  sala.batalha = p.batalha; sala.prazo = p.prazo; sala.acoesFeitas = p.acoesFeitas || []; sala.tipo = p.tipo; sala.zona = p.zona;
  if (luta) { sala.revivesConsumidos = 0; sala.raideConsumidos = {}; sala.itensComunsConsumidos = 0; sala.tentativaEvento = false; }
  // chefe da semana: a tentativa (8 h) conta pra TODOS assim que a luta começa, e cada Revive que o anfitrião aceitou sai da MINHA mochila
  if (p.tipo === 'evento' && !sala.tentativaEvento) { registrarTentativa(); sala.tentativaEvento = true; }
  consumirRevives(p.batalha);
  consumirItensComuns(p.batalha);
  for (const e of p.eventos || []) logRaw({ html: esc(e.txt), cls: e.cls });
  renderSala();
}
// o anfitrião conta os Revives e os itens de raide de cada jogador (`b.revivesUsados`, `b.raideUsados`); o que passou do que eu já
// descontei sai da MINHA mochila (o anfitrião não conhece a mochila dos outros)
function consumirRevives(b) {
  if (!b?.evento || sala?.convidado || (!raideSemRun() && !temRun())) return;
  const eu = meuId(); let mexeu = false;
  // Sala de Raide desconta do INVENTÁRIO DE CONTA (evento.gastarItemDeRaide); fora dela, da mochila da run.
  const gastar = (id, n) => { for (let i = 0; i < n; i++) if (raideSemRun() ? gastarItemDeRaide(id) : gastarDaRun(id)) mexeu = true; };
  const gastarDaRun = id => { const t = G.S.bag[id] > 0; if (t) { G.S.bag[id]--; if (!G.S.bag[id]) delete G.S.bag[id]; } return t; };
  const usados = b.revivesUsados?.[eu] || 0, ja = sala.revivesConsumidos || 0;
  if (usados > ja) {
    // Revive x Max Revive descontam itens diferentes: `revivesTipos[dono]` é a lista na MESMA ordem que os usos
    // foram contados (mp-motor.reviverCompanheiro) — só existe na Sala de Raide, onde há os dois tipos.
    if (raideSemRun()) for (const tipo of (b.revivesTipos?.[eu] || []).slice(ja, usados)) gastar(tipo, 1);
    else gastar('revive', usados - ja);
    sala.revivesConsumidos = usados;
  }
  const feitos = (sala.raideConsumidos ||= {});
  for (const [tipo, n] of Object.entries(b.raideUsados?.[eu] || {})) if (n > (feitos[tipo] || 0)) { gastar(ITEM_DO_RAIDE[tipo], n - (feitos[tipo] || 0)); feitos[tipo] = n; }
  if (mexeu && !raideSemRun()) save();
}
// Item comum (Potion, X Attack...) usado durante a luta: ao contrário de Revive/raide, vale em QUALQUER luta de
// sala (explorar junto, Alfa, chefe da semana) — desconta da mochila certa (`minhaMochila`), convidado não tem
// mochila nenhuma. `itensUsados[dono]` é uma LISTA que só cresce (cada uso vira um item novo no array);
// `itensComunsConsumidos` lembra até onde eu já descontei, pra não gastar de novo a cada estado que chega.
function consumirItensComuns(b) {
  if (!b || sala?.convidado || (!raideSemRun() && !temRun())) return;
  const eu = meuId(), usados = b.itensUsados?.[eu] || [], ja = sala.itensComunsConsumidos || 0;
  if (usados.length <= ja) return;
  for (const id of usados.slice(ja)) {
    if (raideSemRun()) gastarItemDeRaide(id);
    else { G.S.bag[id] = Math.max(0, (G.S.bag[id] || 0) - 1); if (!G.S.bag[id]) delete G.S.bag[id]; }
  }
  sala.itensComunsConsumidos = usados.length;
  if (!raideSemRun()) save();
}
/* Itens de raide, comuns e Revive: fora da Sala de Raide vêm da MOCHILA DA RUN (G.S.bag); dentro dela vêm do
   INVENTÁRIO DE CONTA (evento.inventarioRaide — a mesma "mochila de conta" da Loja de preparo/Arena, comprada
   sem run nenhuma). `minhaMochila()` é o único ponto que decide qual das duas usar; todo o resto (disponíveis,
   botões, consumo) lê daqui em vez de checar `raideSemRun()` cada um por conta própria. */
const minhaMochila = () => raideSemRun() ? inventarioRaide() : (G.S?.bag || {});
// Itens de raide que posso usar agora: tenho (na mochila certa) e o grupo ainda não usou aquele tipo nesta luta
const raideDisponiveis = b => {
  if (!b?.evento || sala.convidado || (!raideSemRun() && !temRun())) return [];
  const bag = minhaMochila();
  return ITENS_DE_RAIDE.filter(tipo => (bag[ITEM_DO_RAIDE[tipo]] || 0) > 0 && !b.lados.B.some(m => m.boss?.raide?.[tipo]));
};
const botoesRaide = b => { const l = raideDisponiveis(b), bag = minhaMochila(); return l.length ? `<div class="subrow">${l.map(t => `<button class="btn ghost sm" data-act="mp-raide" data-v="${t}" title="${esc(ITEMS[ITEM_DO_RAIDE[t]].desc)}">🎒 ${esc(ITEMS[ITEM_DO_RAIDE[t]].name)} ×${bag[ITEM_DO_RAIDE[t]]}</button>`).join('')}</div>` : ''; };
// Itens comuns: lista recolhível (pode ser bem maior que os 3 de raide) — usar um já é a escolha do turno, sem confirmar
function botoesItemComum() {
  const l = itensComunsDisponiveis(), bag = minhaMochila();
  const rotulo = raideSemRun() ? 'da conta' : 'da mochila';
  return l.length ? `<details class="mp-itens"><summary>🎒 Usar item ${rotulo} (${l.length})</summary><div class="bag-grid">${l.map(k => `<button class="item-btn sm" data-act="mp-item" data-v="${k}" title="${esc(ITEMS[k].desc)}">${esc(ITEMS[k].name)} ×${bag[k]}</button>`).join('')}</div></details>` : '';
}
export function usarRaideMP(tipo) {
  const b = sala?.batalha; if (!b || !raideDisponiveis(b).includes(tipo)) return;
  const a = { tipo: 'raide', item: tipo };
  if (sala.anfitriao) registrarAcao(meuId(), a); else enviar('acao', { de: meuId(), acao: a });
}
/* Itens comuns (Potion, X Attack, curas de status, Éter...) que dá pra usar AGORA: na mochila certa (run OU
   conta, ver `minhaMochila`), com efeito de verdade (mesma regra pura do single player, `itemTemEfeito`) e vale
   em qualquer luta de sala — diferente do Revive/raide, não é exclusivo do chefe da semana. Sempre no PRÓPRIO
   Pokémon (sem "usar em qual aliado?": cada jogador só vê a própria mochila numa sala). Fora as categorias que
   já têm caminho próprio (segurado, raide, revive, evolução...) ou não fazem sentido em batalha (repelente,
   relembrar golpe).
   Usa uma vez o turno inteiro: é uma ESCOLHA (como golpe/fugir), não uma ação livre — por isso passa por
   `escolher()`, igual escolherGolpeMP, em vez de `registrarAcao` direto. */
export const SEM_BATALHA_MP = ['candy', 'afinidade', 'evo', 'troca', 'segurar', 'segurado', 'repelente', 'ensina', 'raide', 'revive'];
function itensComunsDisponiveis() {
  const m = minhaVez(); if (!m || sala.convidado || (!raideSemRun() && !temRun())) return [];
  return Object.entries(minhaMochila()).filter(([k, n]) => n > 0 && ITEMS[k] && !SEM_BATALHA_MP.some(f => ITEMS[k][f]) && itemTemEfeito(ITEMS[k], m)).map(([k]) => k);
}
export function usarItemComumMP(id) {
  if (!itensComunsDisponiveis().includes(id)) return;
  escolher({ tipo: 'item', item: id });
}
/* Posso usar um Revive agora? Fora da Sala de Raide: só com o time INTEIRO caído (reviverNoEvento, mesma regra
   de sempre). Dentro dela: igual à Arena (reviverCompanheiro) — reviver com o time ainda lutando, contanto que
   tenha pelo menos um de pé (`m.hp > 0` do mesmo dono) e um caído; aceita Max Revive. */
const podeReviver = b => {
  if (!b?.evento || sala.convidado || (b.revivesUsados?.[meuId()] || 0) >= MAX_REVIVES) return false;
  const meusCaidos = b.lados.A.some(m => m.dono === meuId() && m.hp <= 0);
  if (raideSemRun()) {
    const bag = minhaMochila();
    return ((bag.revive || 0) > 0 || (bag['max-revive'] || 0) > 0) && meusCaidos && b.lados.A.some(m => m.dono === meuId() && m.hp > 0);
  }
  return temRun() && (G.S.bag?.revive || 0) > 0 && meusCaidos
    && b.lados.A.some(m => m.hp > 0) && !b.lados.A.some(m => m.dono === meuId() && m.hp > 0);
};
function botoesReviver(b) {
  if (!podeReviver(b)) return '';
  const restam = MAX_REVIVES - (b.revivesUsados?.[meuId()] || 0);
  if (raideSemRun()) {
    const bag = minhaMochila(), usaMax = (bag['max-revive'] || 0) > 0, id = usaMax ? 'max-revive' : 'revive';
    return `<div class="subrow"><button class="btn" data-act="mp-revive" title="Gasta 1 ${esc(ITEMS[id].name)} da sua conta">💊 Usar ${esc(ITEMS[id].name)} (${bag[id]} na conta · ${restam} uso(s) restante(s))</button></div>`;
  }
  return `<div class="subrow"><button class="btn" data-act="mp-revive" title="Gasta 1 Revive da sua mochila; o Pokémon volta com metade do HP">💊 Usar Revive (${G.S.bag.revive} na mochila · ${restam} uso(s) restante(s))</button></div>`;
}
export function reviverMP() {
  const b = sala?.batalha; if (!b || !podeReviver(b)) return;
  const m = b.lados.A.find(x => x.dono === meuId() && x.hp <= 0); if (!m) return;   // o primeiro caído (o principal, se for ele)
  const raide = raideSemRun(), usaMax = raide && (minhaMochila()['max-revive'] || 0) > 0;
  const a = { tipo: 'revive', ref: m.ref, ...(raide ? { pct: usaMax ? 100 : 50 } : {}) };
  if (sala.anfitriao) registrarAcao(meuId(), a); else { enviar('acao', { de: meuId(), acao: a }); }
}
// meu próximo Pokémon que ainda não escolheu neste turno
const minhaVez = () => { const b = sala?.batalha; return b && jogaveis(b).find(m => m.dono === meuId() && !sala.escolhidos.has(m.ref) && !sala.acoesFeitas.includes(m.ref)); };
/* ---------- gimmicks no co-op (Mega, Tera, Gigantamax, Z-Move) ----------
   Os botões só aparecem pro PRINCIPAL de quem tem uma run (convidado, aliado e PvP ficam de fora). A conquista e o item são da
   MINHA conta e conferidos aqui, na minha tela; o que eu escolho vai junto da ação de golpe (`acao.gimmicks`) e o anfitrião
   aplica no motor (mp-motor.aplicarGimmicksMP), que também guarda o "já usei nesta luta" em `batalha.gimmicksUsados`. */
const golpeZ = (p, g) => !!g && !!p && g.cls !== 'status' && g.power > 0 && g.ppLeft > 0 && g.name !== 'struggle' && zLiberado(p, g);
// o que o meu Pokémon principal pode usar agora; null = não se aplica (PvP, convidado, aliado, sem run)
function gimmicksDisponiveisMP(b, m) {
  if (!b || b.pvp || !m || m.slot !== 0 || m.convidado || sala.convidado || !temRun() || raideSemRun()) return null;
  const M = G.S.player, usou = b.gimmicksUsados?.[meuId()] || {}, p = conquistasDaConta(G.S.registro);
  return {
    p,
    mega: !usou.mega && !m.mega ? megasDisponiveis(M, { jaUsou: false, liberada: e => megaLiberada(p, e) }) : [],   // a Pedra Mega (ou Dragon Ascent) segue valendo
    tera: !usou.tera && !m.tera ? Object.keys(TYPE_PT).filter(t => teraLiberada(p, t)) : [],
    gmax: !usou.gmax && !m.dyna && gmaxLiberado(p, M.data.speciesName),
    z: !usou.z && M.item === ITEM_CRISTAL_Z && m.moves.some(g => golpeZ(p, g))                                        // o Cristal Z segue valendo
  };
}
export async function alternarGimmickMP(tipo) {
  const b = sala?.batalha, m = minhaVez(); if (!b || !m) return;
  const d = gimmicksDisponiveisMP(b, m); if (!d) return;
  const sel = (sala.gimmicksSel ||= {}), turno = b.turno;
  if (sel[tipo]) { delete sel[tipo]; return renderSala(); }   // apertar de novo desliga
  try {
    if (tipo === 'gmax' && d.gmax) sel.gmax = true;
    else if (tipo === 'z' && d.z) sel.z = true;
    else if (tipo === 'tera' && d.tera.length) {
      const i = await ask('Terastalizar em qual tipo? <small>Vale só nesta luta.</small>', [
        ...d.tera.map((t, j) => ({ label: TYPE_PT[t] || t, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
      if (i >= 0 && sala?.batalha?.turno === turno) sel.tera = d.tera[i];
    } else if (tipo === 'mega' && d.mega.length) {
      let f = d.mega[0];
      if (d.mega.length > 1) {
        const i = await ask('Qual forma?', [...d.mega.map((x, j) => ({ label: x.nome, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
        if (i < 0) return renderSala();
        f = d.mega[i];
      }
      // os dados da forma vão junto da ação: o anfitrião não busca nada na rede no meio do turno
      const data = await loadPokemon(f.forma);
      if (sala?.batalha?.turno === turno) sel.mega = { forma: f.forma, nomeForma: f.nome, id: data.id, name: data.name, types: data.types, base: data.base,
        sprite: data.sprite, back: data.back, ability: (data.abilities.find(a => !a.hidden) || data.abilities[0])?.name };
    }
  } catch (e) { console.error(e); toast('Não deu pra preparar isso agora (faltou um dado da PokéAPI). Tente de novo.', 5000); }
  renderSala();
}
function botoesGimmickMP(d) {
  if (!d) return '';
  const sel = sala.gimmicksSel || {};
  const bt = (tipo, ligado, txt, dica) => `<button class="btn ${ligado ? '' : 'ghost'} sm" data-act="mp-gimmick" data-v="${tipo}" aria-pressed="${!!ligado}" title="${esc(dica)}">${txt}</button>`;
  const l = [];
  if (d.mega.length) l.push(bt('mega', sel.mega, sel.mega ? `⚡ ${esc(sel.mega.nomeForma)} ✓` : '⚡ Mega Evolução', 'Não gasta o turno. Uma vez por luta.'));
  if (d.tera.length) l.push(bt('tera', sel.tera, sel.tera ? `💎 Tera ${esc(TYPE_PT[sel.tera] || sel.tera)} ✓` : '💎 Terastalizar', 'Não gasta o turno. Uma vez por luta.'));
  if (d.gmax) l.push(bt('gmax', sel.gmax, sel.gmax ? '🔴 Gigantamax ✓' : '🔴 Gigantamax', 'HP dobrado e golpes Max por 3 turnos. Não gasta o turno.'));
  if (d.z) l.push(bt('z', sel.z, sel.z ? '🌀 Z-Move ✓ (escolha o golpe)' : '🌀 Z-Move', 'O golpe que você escolher vira Z. Uma vez por luta.'));
  return l.length ? `<div class="subrow mp-gimmicks"><span class="small muted">Neste turno:</span> ${l.join('')}</div>` : '';
}
// as gimmicks ligadas na tela viram parte da ação de golpe
function gimmicksSelecionadas() {
  const s = sala.gimmicksSel || {}, out = [];
  if (s.mega) out.push({ tipo: 'mega', ...s.mega });
  if (s.tera) out.push({ tipo: 'tera', valor: s.tera });
  if (s.gmax) out.push({ tipo: 'gmax' });
  if (s.z) out.push({ tipo: 'z' });
  return out;
}
export function escolherGolpeMP(i) {
  const m = minhaVez(); if (!m) return;
  const gimmicks = gimmicksSelecionadas();
  if (gimmicks.some(g => g.tipo === 'z') && !golpeZ(gimmicksDisponiveisMP(sala.batalha, m)?.p, m.moves[i])) { toast('Esse golpe não pode virar Z.', 4000); return; }
  escolher({ tipo: 'golpe', golpe: i, alvo: sala?.alvo, ...(gimmicks.length ? { gimmicks } : {}) });
  if (sala) sala.gimmicksSel = {};
}
export function moverGolpeMP(i, dir) {
  const m = minhaVez(); if (!m) return;
  const a = { tipo: 'golpe-mover', ref: m.ref, i, dir };
  if (sala.anfitriao) registrarAcao(meuId(), a); else enviar('acao', { de: meuId(), acao: a });
}
export function fugirMP() { escolher({ tipo: 'fugir' }); }
export function desistirMP() { escolher({ tipo: 'desistir' }); }
export function mirarMP(ref) { if (sala) { sala.alvo = ref; renderSala(); } }

/* ---------- chat da sala: vale em qualquer modo, no lobby E na luta (broadcast 'chat', sem persistir em lugar
   nenhum — só na memória de `sala.mensagens`, até 100 linhas). Fica FORA de `#mp-topo`/`#mp-acoes` de propósito:
   essas duas divs são recriadas inteiras por `renderSala()` (a cada troca de presença, cada pulso do anfitrião…),
   e se o campo de texto morasse ali dentro, digitar uma mensagem enquanto alguém entra na sala apagaria o que
   você estava escrevendo no meio da frase. `renderChat()` só mexe em `#mp-chat-msgs`. ---------- */
function aoReceberChat(p) {
  if (!sala || !p?.texto) return;
  sala.mensagens.push(p); if (sala.mensagens.length > 100) sala.mensagens.shift();
  renderChat();
}
function renderChat() {
  const el = $('#mp-chat-msgs'); if (!el || !sala) return;
  el.innerHTML = sala.mensagens.length
    ? sala.mensagens.map(m => `<p>${htmlIcone(m.icone, 'icone-mini')}<b>${esc(m.nome)}:</b> ${esc(m.texto)}</p>`).join('')
    : '<p class="muted">Ninguém escreveu nada ainda. Diga oi!</p>';
  el.scrollTop = el.scrollHeight;
}
export async function enviarChatMP() {
  const el = $('#mp-chat-input');
  const texto = String(el?.value || '').trim().slice(0, 200);
  if (!sala || !texto) return;
  if (el) el.value = '';
  const msg = { de: meuId(), nome: meuNome(), icone: meuIcone(), texto, t: Date.now() };
  sala.mensagens.push(msg); if (sala.mensagens.length > 100) sala.mensagens.shift();
  renderChat();
  await enviar('chat', msg);
}
// Centro Pokémon sem sair da sala (mesma conta e mesmas regras do jogo sozinho)
export function centroMP() {
  if (!sala || sala.batalha || !temRun()) return;
  const { precisa, custo } = centroPokemon();
  if (!precisa || G.S.money < custo) return;
  G.S.money -= custo; G.S.gasto = (G.S.gasto || 0) + custo;
  healFull(); zerarDescontoCentro(); save();
  logRaw({ html: `🏥 ${custo ? `Você pagou ₽${custo} e curou` : 'Você curou'} a equipe no Centro Pokémon.`, cls: 'good' });
  retrack(); renderSala(); // a presença mostra o HP dos seus Pokémon pros outros
}
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
  sala.batalha = null; sala.acoes = {}; sala.ocupado = true; clearTimeout(sala.timer); desligarPulso();
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
  if (raideSemRun()) return aplicarRaideSemRun(p);   // Hall da Fama, sem run nenhuma — ver a Sala de Raide, acima
  if (sala.convidado || !temRun()) { await say(p.fim === 'A' ? '🏆 Vitória do grupo! (Pokémon convidado: a luta não mexe na sua run.)' : 'Pokémon convidado: a luta não mexe na sua run.', 'muted'); return false; }
  // luta do chefe da semana: perder não é permadeath (evento.EVENTO_SEM_PERMADEATH), como no single player
  const S = G.S, eu = meuId(), permadeath = DIFICULDADES[dificuldadeDe(S)].permadeath && !(p.evento && EVENTO_SEM_PERMADEATH);
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
    if (f.frac > 0) { M.hp = Math.max(1, Math.round(M.stats.hp * f.frac)); M.status = f.status; M.sleep = f.sleep || 0; M.item = f.item; }
    else if (permadeath) { if (slot === 0) principalCaiu = true; else perdidos.push(slot - 1); }
    else { M.hp = 1; M.status = null; M.sleep = 0; } // fora do Roguelike, desmaio no co-op volta com 1 HP
    f.pp.forEach((pp, i) => { if (M.moves[i]) M.moves[i].ppLeft = Math.min(M.moves[i].pp, pp); });
  }
  if (principalCaiu) { await say(`${esc(S.player.nick || fmt(S.player.name))} desmaiou. No Roguelike não existe segunda chance.`, 'hit'); return true; }
  for (const i of perdidos.sort((a, b) => b - a)) { const A = S.aliados[i]; S.aliados.splice(i, 1); G.abertos.clear(); S.aliadosPerdidos = (S.aliadosPerdidos || 0) + 1; await say(`${esc(A.nick || fmt(A.name))} desmaiou e foi perdido pra sempre.`, 'hit'); }
  if (p.fim === 'A') {
    const r = p.recompensas[eu] || { xp: 0, dinheiro: 0 }, principal = meus.find(([s]) => s === 0)?.[1];
    // Só quem lutou no NÍVEL REAL leva os ganhos pra própria run (com o nível ajustado pelo balancear, a luta não rende)
    if (principal?.real) {
      S.money += r.dinheiro; S.wins = (S.wins || 0) + 1; S.vitoriasDesdeCentro = (S.vitoriasDesdeCentro || 0) + 1;
      for (const [s, add] of ganhoDeEVs(S.player.evs, p.effort)) S.player.evs[s] += add;
      for (const d of p.derrotados) {
        registrar(S, 'derrotados', d.especie, d.id);
        /* Conquistas da conta (conquistas.registrarAbate): o co-op não contava nada — a barra da Mega e os marcos de caçada
           só andavam no single player. Aqui só entra o que vale sem saber quem deu o golpe final: a ESPÉCIE que você está
           usando e o total (`porMim: false`, mesma regra do abate de aliado). Tera e Z pedem golpe final SEU e continuam só
           no single player. */
        registrarAbate(S, { porMim: false, minhaEspecie: S.player.data.speciesName, modo: dificuldadeDe(S) });
      }
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
    if (p.evento) await premiarEventoMP(p.evento);
  } else if (p.fim === 'B') await say('O grupo foi derrotado.', 'hit');
  else await say('O grupo fugiu.', 'muted');
  await verificarMissoes();
  save();
  return false;
}

// Prêmio do chefe da semana pra quem estava no grupo: só vale se a SUA run é Roguelike/Hardcore (o convidado nem chega aqui)
async function premiarEventoMP(id) {
  const S = G.S, ev = EVENTOS.find(e => e.id === id); if (!ev) return;
  if (!modoComEvento(dificuldadeDe(S))) { await say(`☄ ${esc(ev.nome)} caiu! Mas os prêmios do evento só valem em jornadas Roguelike ou Hardcore.`, 'muted'); return; }
  const r = registrarVitoriaDeEvento(ev, idDaSemana(agoraDoEvento()));
  await say(`🏆 <b>${esc(ev.nome)} foi derrotado pelo grupo!</b>`, 'level');
  if (r.semanaNova) {
    S.money += ev.recompensa.dinheiro || 0;
    for (const [k, n] of Object.entries(ev.recompensa.itens || {})) S.bag[k] = (S.bag[k] || 0) + n;
    await say(`Prêmio da semana: ₽${ev.recompensa.dinheiro || 0}${Object.entries(ev.recompensa.itens || {}).map(([k, n]) => `, ${n}× ${ITEMS[k]?.name || k}`).join('')}.`, 'level');
  } else await say('Você já tinha vencido este chefe nesta semana: o prêmio só sai uma vez por semana.', 'muted');
  if (r.primeiraVez) {
    await say(`🌌 Insígnia <b>${esc(ev.badge.nome)}</b> conquistada — título “${esc(ev.badge.titulo)}”. Escolha qual mostrar ao lado do nome na tela 👤 Conta.`, 'level');
    await say(`🔓 <b>${esc(fmt(ev.especie))}</b> está liberado na Pokédex e pra começar novas jornadas!`, 'level');
  }
  if (usuario()) sincronizarComRetentativa().catch(e => console.warn('sincronizar (evento)', e));
}

// Sala de Raide (modo 'raide'): igual à Arena do Chefe — sem run nenhuma pra mexer, prêmio vai pra CONTA
// (darItensDeRaide + registrarVitoriaDeEvento), nunca por dinheiro/Rare Candy (isso só existe dentro de uma run).
async function aplicarRaideSemRun(p) {
  const venceu = p.fim === 'A';
  await say(venceu ? '🏆 Vitória do grupo!' : 'O grupo foi derrotado. Dá pra tentar de novo mais tarde — perder não custa nada.', venceu ? 'good' : 'muted');
  if (venceu && p.evento) await premiarRaideSemRun(p.evento);
  return false;   // Sala de Raide nunca é permadeath: não existe run pra acabar
}
async function premiarRaideSemRun(id) {
  const ev = EVENTOS.find(e => e.id === id); if (!ev) return;
  const r = registrarVitoriaDeEvento(ev, idDaSemana(agoraDoEvento()));
  if (r.semanaNova) {
    const itens = Object.fromEntries(Object.entries(ev.recompensa.itens || {}).filter(([k]) => ITEMS[k]?.raide));
    darItensDeRaide(itens);
    const txt = Object.entries(itens).map(([k, n]) => `${n}× ${ITEMS[k].name}`).join(', ');
    await say(`Prêmio da semana: ${txt || 'nenhum item de raide'} (guardados na conta). Dinheiro e Rare Candy só saem em lutas dentro de uma run.`, 'level');
  } else await say('Você já tinha vencido este chefe nesta semana: o prêmio só sai uma vez por semana.', 'muted');
  if (r.primeiraVez) {
    await say(`🌌 Insígnia <b>${esc(ev.badge.nome)}</b> conquistada — título “${esc(ev.badge.titulo)}”. Escolha qual mostrar ao lado do nome na tela 👤 Conta.`, 'level');
    await say(`🔓 <b>${esc(fmt(ev.especie))}</b> está liberado na Pokédex e pra começar novas jornadas!`, 'level');
  }
  if (usuario()) sincronizarComRetentativa().catch(e => console.warn('sincronizar (raide sem run)', e));
}

/* ---------- tela ---------- */
function telaSala() {
  G.mode = 'mp'; limparTopo();
  $('#app').innerHTML = `<main class="create mp">
    <div id="mp-topo"></div>
    <div class="textbox"><div id="log" class="log" aria-live="polite"></div></div>
    <div id="mp-acoes" class="actions"></div>
    <section class="mp-chat"><h3>💬 Chat da sala</h3>
      <div class="textbox"><div id="mp-chat-msgs" class="log" aria-live="polite"></div></div>
      <span class="subrow"><input id="mp-chat-input" maxlength="200" placeholder="Mensagem pra sala..." autocomplete="off"><button class="btn ghost sm" data-act="mp-chat-enviar">Enviar</button></span>
    </section></main>`;
  clearInterval(sala.relogio);
  sala.relogio = setInterval(() => { const el = $('#mp-relogio'); if (el && sala?.prazo) el.textContent = Math.max(0, Math.ceil((sala.prazo - Date.now()) / 1000)) + 's'; }, 1000);
  renderChat();
  renderSala();
}
export const barra = m => { const pct = clamp(m.hp / m.stats.hp * 100, 0, 100); return `<div class="hp"><span>HP</span><div class="bar"><div class="fill" style="width:${pct}%;background:${pct > 50 ? '#5FB36A' : pct > 20 ? '#F7C548' : '#E4572E'}"></div></div><span>${m.hp}/${m.stats.hp}</span></div>`; };
// chefe do evento semanal (boss.js): couraça, ponto fraco, fase e o aviso do golpe carregado — o que o grupo precisa combinar
export function blocoChefeMP(m) {
  const r = resumoDoChefe(m); if (!r) return '';
  return `<div class="boss-info">
    ${r.temCoura ? `<div class="hp boss-coura ${r.exposto ? 'exposto' : ''}"><span>🛡</span><div class="bar"><div class="fill" style="width:${Math.round(r.couraFracao * 100)}%"></div></div><span>${r.exposto ? 'EXPOSTO' : ''}</span></div>` : r.exposto ? '<div class="boss-fase" style="color:#e4572e">💥 EXPOSTO: dano ×1,5</div>' : ''}
    ${r.pontoFraco ? `<div class="boss-fraco">🎯 Ponto fraco: <b>${esc(TYPE_PT[r.pontoFraco] || r.pontoFraco)}</b></div>` : ''}
    ${r.anula ? `<div class="boss-fraco" title="${esc(r.textoAnula)}">🚫 Imune a: <b>${r.anula.map(t => esc(TYPE_PT[t] || t)).join(', ')}</b></div>` : ''}
    ${r.temReverso ? (r.reverso ? '<div class="boss-carga" role="alert">🔄 MUNDO REVERSO: tipos INVERTIDOS agora!</div>' : '<div class="boss-fase">🔄 Mundo Reverso (alterna)</div>') : ''}
    ${r.adaptado !== undefined ? `<div class="boss-fraco">🧬 Adaptado a: <b>${r.adaptado ? esc(TYPE_PT[r.adaptado] || r.adaptado) : '—'}</b></div>` : ''}
    ${r.regenera ? '<div class="boss-fase">🧬 Regenera (exponha-o pra parar)</div>' : ''}
    ${r.escudo ? '<div class="boss-fase" style="color:#1c7ed6">🛡 Escudo Astral ativo</div>' : ''}
    <div class="boss-fase">☄ Fase ${r.fase}/3</div>
    ${r.carregando ? `<div class="boss-carga" role="alert">⚠ Carregando o ${esc(r.rotuloCarga)}! Faltam <b>${r.faltaParaInterromper}</b> de dano neste turno pra interromper.</div>` : ''}
  </div>`;
}
// o que o Pokémon "está" agora na luta (Mega, Tera e Gigantamax do co-op) — só aparece enquanto vale
const marcasMP = m => [m.mega && `⚡ ${m.mega.forma?.nome || 'Mega'}`, m.tera && `💎 Tera ${TYPE_PT[m.tera] || m.tera}`, m.dyna && '🔴 Gigante'].filter(Boolean).join(' · ');
export function cartao(m, legenda, destaque = false) {
  const marcas = marcasMP(m);
  return `<div class="mp-mon ${m.hp <= 0 ? 'caido' : ''} ${destaque ? 'vez' : ''}"><img src="${spriteFrente(m)}" alt="" onerror="this.onerror=null;this.src='${m.data.sprite}'">
    <div><b>${m.shiny ? '✨ ' : ''}${esc(m.nome)}</b> <span class="muted small">Nv. ${m.level}</span>${marcas ? ` <span class="small">${esc(marcas)}</span>` : ''}${legenda ? `<small class="muted">${esc(legenda)}</small>` : ''}${barra(m)}${blocoChefeMP(m)}</div></div>`;
}
const cartaoMembro = m => `<div class="mp-membro"><b class="mp-nome">${htmlIcone(m.icone, 'icone-mini')}${m.anfitriao ? '👑 ' : ''}${esc(m.nome)}${iconeDaBadge(m.badge)}${m.id === meuId() ? ' (você)' : ''}${sala.config.modo === 'raide' ? ` ${m.pronto ? '✅ pronto' : '⏳ escolhendo…'}` : ''}</b>
  <div class="mp-mons">${(m.mons || []).slice(0, sala.config.porJogador).map(x => cartao(x, x.convidado ? '✨ convidado (não é da run)' : x.hall ? '🏟 Hall da Fama' : '')).join('')}</div></div>`;
// Linha de conexão + diagnóstico: some quando está tudo bem? Não — fica sempre, porque saber se a sala está viva
// é metade do problema num jogo em rede. Mostra o estado, há quanto tempo chegou algo, o 🔄 e o detalhe escondido.
function barraConexao() {
  const c = sala.conexao || 'ok', seg = sala.ultimoEvento ? Math.round((Date.now() - sala.ultimoEvento) / 1000) : null;
  const txt = c === 'ok' ? '🟢 conectado' : c === 'instavel' ? '🟡 rede instável (tentando de novo)' : '🔴 sem conexão com a sala (reconectando…)';
  return `<div class="mp-conexao ${c}">
    <span>${txt}${seg != null ? ` · último sinal há ${seg}s` : ''}${sala.semAnfitriao ? ' · esperando o anfitrião voltar' : ''}</span>
    <button class="btn ghost sm" data-act="mp-sync" title="Pedir o estado atual da sala de novo">🔄 Sincronizar</button>
    <details class="mp-diag"><summary>Diagnóstico</summary><ul>${diarioMP().map(l => `<li class="${l.ruim ? 'err' : ''}">${new Date(l.t).toLocaleTimeString('pt-BR')} · ${esc(l.txt)}</li>`).join('') || '<li class="muted">Nada ainda.</li>'}</ul></details>
  </div>`;
}
function renderSala() {
  if (!sala || G.mode !== 'mp' || !$('#mp-topo')) return;
  const b = sala.batalha, cfg = sala.config, pvp = cfg.modo === 'pvp', z = ZONES.find(x => x.id === sala.zona) || ZONES[0];
  const resumoCfg = `${pvp ? 'PvP' : 'Co-op'} · ${cfg.porJogador} Pokémon por jogador · ${cfg.balancear ? 'balanceado' : 'sem balancear'}${pvp ? '' : ' · ' + esc(z.name)}`;
  const cabecalho = `<div class="mp-cab"><h1>Sala <span class="codigo">${esc(sala.codigo)}</span></h1>
    <p class="muted">${sala.anfitriao ? 'Você é o anfitrião. Passe o código pros amigos.' : 'O anfitrião configura e começa.'} · ${sala.membros.length}/${MAX_JOGADORES} jogadores · ${resumoCfg}</p>
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
  const alvos = inimigosDe(vez); if (!alvos.some(e => e.ref === sala.alvo)) sala.alvo = alvos[0]?.ref;
  // Faixa/Óculos/Lenço Escolha: trava no golpe BASE (mesma lógica de render.js/arena.js) — se o travado ficar
  // sem PP, Struggle sai igual, senão a sala travaria sem nenhum botão clicável.
  const travado = seg(vez).choice && vez.vol.escolha;
  const ppDoTravado = travado && vez.moves.find(g => g.name === travado)?.ppLeft;
  const semPP = vez.moves.every(g => g.ppLeft <= 0) || ppDoTravado <= 0;
  const gd = gimmicksDisponiveisMP(b, vez), zLigado = !!(gd && sala.gimmicksSel?.z);   // com o Z ligado, só os golpes que podem virar Z ficam clicáveis
  // reordenar (▲▼) não gasta turno; fica fora do <button> de atacar (não dá pra aninhar <button> em <button>)
  const moverMP = (i, dir) => `<button class="btn ghost sm" data-act="mp-golpe-mover" data-v="${i}" data-dir="${dir}" ${(dir < 0 ? i === 0 : i === vez.moves.length - 1) ? 'disabled' : ''} title="${dir < 0 ? 'Subir' : 'Descer'}">${dir < 0 ? '▲' : '▼'}</button>`;
  $('#mp-acoes').innerHTML = status + `<p class="mp-quem">Vez de <b>${esc(vez.nome)}</b></p>` + (travado ? `<p class="small muted">🔒 Travado em <b>${esc(fmt(travado))}</b> até desmaiar ou ser revivido.</p>` : '') + botoesGimmickMP(gd) +
    (alvos.length > 1 ? `<div class="subrow">Alvo: ${alvos.map(m => `<button class="btn ${m.ref === sala.alvo ? '' : 'ghost'} sm" data-act="mp-mirar" data-v="${m.ref}">${esc(m.nome)}</button>`).join('')}</div>` : '') +
    `<div class="moves">${semPP ? '<button class="mv" style="--c:#A8A77A" data-act="mp-golpe" data-v="-1"><b>Struggle</b><small>Sem PP.</small></button>'
      : vez.moves.map((g0, i) => { const g = golpeDoBattleBond(golpeDoTera(golpeDoClima(g0, climaDe(b.campo)), vez), vez); const preso = travado && g0.name !== travado; return `<div class="mv-cel"><button class="mv" style="--c:${TC[g.type] || '#888'}" data-act="mp-golpe" data-v="${i}" ${g.ppLeft <= 0 || preso || (zLigado && !golpeZ(gd.p, g)) ? 'disabled' : ''}><b>${esc(fmt(g.name))}</b><small>${TYPE_PT[g.type] || g.type}, ${CLS_PT[g.cls]}, poder ${g.power ?? '—'}</small><span class="pp">PP ${g.ppLeft}/${g.pp}</span></button><span class="mv-ordem">${moverMP(i, -1)}${moverMP(i, 1)}</span></div>`; }).join('')}</div>
    ${botoesItemComum()}
    ${botoesRaide(b)}
    ${botoesReviver(b)}
    <div class="subrow">${b.pvp ? '<button class="btn ghost" data-act="mp-desistir">Desistir</button>' : b.evento ? '' : '<button class="btn ghost" data-act="mp-fugir">Fugir</button>'}${sair}</div>`;
}
// Centro Pokémon sem sair da sala: no co-op a equipe se machuca de verdade, e antes era preciso sair, curar e voltar.
// Mesmo preço e mesma regra do jogo sozinho (estado.centroPokemon); só aparece entre as lutas, com uma run em andamento.
function centroNaSala() {
  if (!temRun() || sala.batalha || sala.convidado || sala.config?.modo === 'raide') return '';
  const { precisa, custo, cheio, vitorias } = centroPokemon(), semGrana = G.S.money < custo;
  const desconto = vitorias && custo < cheio ? ` <s>₽${cheio}</s>` : '';
  return `<div class="subrow mp-centro"><button class="btn ghost" data-act="mp-centro" ${!precisa || semGrana || sala.ocupado ? 'disabled' : ''}
    title="${!precisa ? 'Sua equipe já está curada' : semGrana ? 'Dinheiro insuficiente' : 'Restaura HP, PP e status de toda a equipe'}">🏥 Centro Pokémon${!precisa ? ' (equipe curada)' : `${custo ? ` · ₽${custo}` : ' · grátis'}${desconto}`}</button>
    <span class="small muted">₽${G.S.money.toLocaleString('pt-BR')}</span></div>`;
}
// Sala de Raide: minha própria seleção do Hall da Fama + Loja de preparo + "pronto" — igual pra anfitrião e
// convidado, cada um mexe só na PRÓPRIA conta (hallDaConta/saldoArenaDaConta já são locais, sem run nenhuma).
function htmlRaideSelecao() {
  const hall = hallDaConta(), sel = sala.hallSel, saldo = saldoArenaDaConta();
  const escolhidos = new Set(sel.selecao);
  const cartaoHall = e => { const on = escolhidos.has(e.chave), cheio = !on && sel.selecao.length >= MAX_TIME_HALL;
    return `<button class="hall-card ${on ? 'on' : ''}" data-act="mp-raide-sel" data-v="${esc(e.chave)}" ${cheio || sala.ocupado ? 'disabled' : ''} aria-pressed="${on}">
      <img src="${e.shiny ? SPR_SHINY(e.id) : SPR(e.id)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${SPR(e.id)}'">
      <b>${e.shiny ? '✨ ' : ''}${esc(e.nick || fmt(e.nome))}</b><span class="muted small">Nv. ${e.nivel} · Gen ${e.gen}</span></button>`; };
  const entradas = sel.selecao.map(c => hall.find(e => e.chave === c)).filter(Boolean).map(e => ({ chave: e.chave, rotulo: e.nick || fmt(e.nome) }));
  return `<section class="pv conta"><div><h3>🏟 Seus Pokémon (Hall da Fama)</h3>
    <p class="small muted">O principal de cada jornada Roguelike/Hardcore terminada entra aqui, com o nível que tinha. Escolha de 1 a ${MAX_TIME_HALL} — não usa nenhuma jornada em andamento.</p>
    ${hall.length ? `<div class="hall-lista">${hall.map(cartaoHall).join('')}</div>`
      : '<p class="notice">Seu Hall da Fama está vazio. Termine (ou encerre) uma jornada Roguelike ou Hardcore pra ter Pokémon aqui.</p>'}</div></section>
    ${htmlEquiparConta(entradas, sel.equipamento, 'data-mp-equipar')}
    ${htmlLojaConta(saldo, 'mp-raide-comprar-comum', 'mp-raide-comprar-segurado')}
    <div class="subrow"><button class="btn ${sala.pronto ? '' : 'ghost'} big" data-act="mp-pronto" ${sala.ocupado ? 'disabled' : ''}>${sala.pronto ? '✅ Pronto! (toque pra voltar a escolher)' : 'Marcar como pronto'}</button></div>`;
}
function renderLobby(cabecalho, pvp, z) {
  const cfg = sala.config, dis = sala.ocupado ? 'disabled' : '', raide = cfg.modo === 'raide';
  const time = t => sala.membros.filter(m => (m.time || 'B') === t);
  $('#mp-topo').innerHTML = cabecalho + (pvp
    ? `<div class="mp-times">${['A', 'B'].map(t => `<div class="mp-time"><h3>Time ${t} <small class="muted">(${time(t).length})</small></h3>${time(t).map(cartaoMembro).join('') || '<p class="small muted">Ninguém ainda.</p>'}</div>`).join('')}</div>`
    : `<div class="mp-grupo">${sala.membros.map(cartaoMembro).join('')}</div>`);
  const trocarTime = pvp ? `<div class="subrow">Seu time: ${['A', 'B'].map(t => `<button class="btn ${sala.time === t ? '' : 'ghost'} sm" data-act="mp-time" data-v="${t}" ${dis}>Time ${t}</button>`).join('')}</div>` : '';
  const sair = '<button class="btn ghost" data-act="mp-sair">Sair da sala</button>';
  if (!sala.anfitriao) {
    if (raide) { $('#mp-acoes').innerHTML = htmlRaideSelecao() + `<p class="muted">${sala.ocupado ? 'Buscando os Pokémon…' : 'Esperando todo mundo ficar pronto e o anfitrião começar.'}</p><div class="subrow">${sair}</div>`; return; }
    $('#mp-acoes').innerHTML = trocarTime + centroNaSala() + `<p class="muted">${sala.ocupado ? 'Aplicando o resultado…' : 'Esperando o anfitrião começar.'}</p><div class="subrow">${sair}</div>`; return;
  }
  const zonas = temRun() ? rotasAtuais().filter(x => zonaLiberada(x, G.S.player.level, G.S)) : []; // rotas do mapa (Gen) da run
  // amigos (com conta) que ainda não estão na sala: um toque manda o convite
  const naSalaIds = new Set(sala.membros.map(m => m.id));
  const amigosFora = usuario() ? nuvem.amigos.filter(a => a.status === 'aceita' && !naSalaIds.has(a.amigo)) : [];
  const convites = amigosFora.length ? `<div class="mp-convites"><b>Chamar amigos:</b> ${amigosFora.map(a => `<button class="btn ghost sm" data-act="mp-convidar" data-v="${a.amigo}">${htmlIcone({ id: a.icone_id, shiny: a.icone_shiny }, 'icone-mini')} ${esc(a.apelido)}${htmlInsigniaDe(a.badge_exibida)}</button>`).join('')}</div>`
    : usuario() ? '' : '<p class="small muted">Entre na conta pra chamar amigos direto (sem precisar passar o código).</p>';
  const podePvp = time('A').length && time('B').length;
  if (raide) {
    const prontos = todosProntosParaRaide();
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
    </div>${trocarTime}${centroNaSala()}${convites}
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
