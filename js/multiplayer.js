/* ============ multiplayer: a sala (orquestração) ============
   Este arquivo é o maestro. O que ele NÃO faz mais (cada um tem o seu módulo agora):
     `mp-regras.js`     as decisões puras da sala (com qual Pokémon entro, quem falta, o que dá pra usar) — testado
     `mp-rede.js`       canal, envio confiável, pulso, presença e diagnóstico (sem DOM)
     `mp-cartao.js`     como um Pokémon aparece (a Arena usa também)
     `mp-telas.js`      todo o HTML das telas
     `mp-resultado.js`  aplicar o fim da luta no save e descontar a mochila
     `mp-motor.js`      o motor puro do turno (nunca reimplementar golpe fora de `golpe.js`)
   Aqui ficam: entrar/sair da sala, a AUTORIDADE DO ANFITRIÃO (montar a luta, juntar as escolhas, rodar o motor,
   publicar) e as ações que a tela dispara por `data-act` (main.js).

   Sala de até MAX_JOGADORES. O anfitrião escolhe:
     modo        'coop' (todos no lado A contra selvagens / Alfa — "chamar alguém pra sua run"), 'pvp' (Time A × B)
                 ou 'raide' (chefe da semana com o Hall da Fama, sem run nenhuma)
     porJogador  quantos Pokémon cada um leva: 1 = só o principal, 2–3 = com aliados (1v1, 2v2, 3v3; 2×1, 3×2…)
     balancear   (padrão ligado) co-op: o time todo no nível do anfitrião; PvP: todos no nível médio e o lado em
                 menor número ganha HP proporcional. Desligado: níveis reais.
   Resultado: co-op aplica na jornada de cada um; PvP é amistoso (só conta vitórias/derrotas em S.pvp). */
import { G, save, dificuldadeDe, rotasAtuais, centroPokemon, zerarDescontoCentro } from './estado.js';
import { healFull } from './efeitos.js';
import { logRaw, toast, ask, REDUCED } from './ui.js';
import { API, ZONES, TYPE_PT, ITEMS } from './dados.js';
import { sortearDaRota, genDe } from './mapas.js';
import { EVENTOS, situacaoDoEvento, eventoDaSemana, jaComecou, registrarTentativa, agoraDoEvento, dataBR, formatarEspera } from './evento.js';
import { MAX_TIME_HALL, comprarComumConta, comprarSeguradoConta, reidratarHall } from './loja-conta.js';
import { prepararChefe, nivelDoChefe, jogadoresEfetivos, habilidadeDoChefe, aplicarClimaDoChefe, ITEM_DO_RAIDE } from './boss.js';
import { xpPorVitoria, statsDeChefe, melhorGolpe, ESPERTEZA, climaDasRotasAtivo, CLIMA_TURNOS, moverGolpe, tiposDefensivos, tiposOfensivos, zonaLiberada } from './regras.js';
import { fotoDoMon, novaBatalhaMP, resolverTurnoMP, acaoDaIA, monMP, leituraDoEstado, balancearPvP, balancearCoop,
  nivelarMon, nivelMedio, naNivelReal, reviverNoEvento, reviverCompanheiro, usarRaideNoEvento, MAX_REVIVES } from './mp-motor.js';
import { hallDaConta } from './carreira.js';
import { usuario, nuvem, nuvemConfigurada, meuIcone, convidarAmigo } from './nuvem.js';
import { loadPokemon, loadMove } from './api.js';
import { makeMon } from './pokemon.js';
import { encerrarJornada } from './fim.js';
import { FIND_ITEMS } from './dados.js';
import { URL_SITE } from './site.js';   // o link do convite sai daqui — endereço absoluto nunca é digitado à mão
import { esc, fmt, pick, rand, clamp, offline, sleep } from './util.js';
import { MAX_JOGADORES, PRAZO_MS, raideSemRun, entradaEfetiva, jogaveis, primeiroInimigo,
  inimigosDe, minhaVezDe, todosProntos, montarLado, raideDisponiveis, itensComunsDisponiveis, podeReviver } from './mp-regras.js';
import { meuId, membroDe, novoCodigo, codigoValido, anotar, enviar, ligarPulso, desligarPulso,
  abrirCanal, retrack as retrackCanal, membrosDaPresenca, fecharSala, ligarRender, ESPERA_ANFITRIAO_MS } from './mp-rede.js';
import { aplicarCoop, aplicarPvP, consumirRevives, consumirItensComuns, minhaMochila, ctxDaSala } from './mp-resultado.js';
import { telaMenuMP, telaSala, renderSala, renderChat, gimmicksDisponiveisMP, golpeZ } from './mp-telas.js';

export { MAX_JOGADORES } from './mp-regras.js';
export { naSala } from './mp-rede.js';   // o main.js usa pra saber se dá pra sair da tela
ligarRender(renderSala);   // a rede e o resultado pedem redesenho sem conhecer a tela

const temRun = () => !!G.S?.player;
const minhaVez = () => minhaVezDe(G.sala, meuId());
const meuNome = () => nuvem.apelido || G.S?.player?.nick || (G.S ? fmt(G.S.player.name) : 'Treinador');

export const telaMultiplayer = (msg = '') => telaMenuMP(msg);
/* ---------- com qual Pokémon eu entro ----------
   Só DENTRO da sala (mudou em 29/09/2026). Antes a escolha existia também no menu, com um par de funções quase
   iguais pra cada caso — e obrigava a decidir antes de saber pra que tipo de luta era a sala. Na Sala de Raide as
   opções são Hall ou assistir; nos outros modos entram run e convidado. */
export async function escolherEntradaNaSala(tipo) {
  const sala = G.sala;
  if (!sala || sala.batalha || !['run', 'convidado', 'hall', 'espectador'].includes(tipo)) return;
  if (raideSemRun(sala) && !['hall', 'espectador'].includes(tipo)) return;   // na Raide não existe run nem convidado
  if (tipo === 'run' && !temRun()) return;
  sala.entradaTipo = tipo; sala.pronto = false;
  if (tipo === 'hall') return atualizarHallMons();
  if (tipo === 'convidado' && !sala.convidado) return renderSala();   // ainda falta escolher a espécie
  await retrack(); renderSala();
}
export async function escolherConvidadoNaSala(id) {
  const sala = G.sala;
  if (!sala || sala.batalha || raideSemRun(sala)) return;
  sala.ocupado = true; sala.entradaTipo = 'convidado'; renderSala();
  try { sala.convidado = await makeMon(await loadPokemon(+id), 5); }
  catch (e) { console.error(e); toast(`Não consegui buscar o Pokémon convidado: ${esc(e.message)}`, 5000); }
  finally { if (G.sala) { G.sala.ocupado = false; await retrack(); renderSala(); } }
}
const hallSelAtual = () => G.sala?.hallSel;
const podeMexerNoHall = () => !!G.sala && !G.sala.batalha && entradaEfetiva(G.sala) === 'hall';
let atualizandoHall = false;
async function atualizarHallMons() {
  const sala = G.sala;
  if (!sala || atualizandoHall) return;
  atualizandoHall = true; renderSala();
  try {
    const hall = hallDaConta(), sel = sala.hallSel;
    const entradas = sel.selecao.map(c => hall.find(e => e.chave === c)).filter(Boolean);
    sala.hallMons = await Promise.all(entradas.map(e => reidratarHall(e, sel.equipamento[e.chave])));
  } catch (e) { console.error(e); toast('Não consegui buscar um dos Pokémon do Hall agora.', 5000); }
  finally { atualizandoHall = false; if (G.sala) { await retrack(); renderSala(); } }
}
export function raideSelecionarHall(chave) {
  if (!podeMexerNoHall()) return;
  const sel = hallSelAtual();
  if (sel.selecao.includes(chave)) { sel.selecao = sel.selecao.filter(c => c !== chave); delete sel.equipamento[chave]; }
  else if (sel.selecao.length < MAX_TIME_HALL) sel.selecao = [...sel.selecao, chave];
  else return;
  G.sala.pronto = false; atualizarHallMons();
}
export function raideEquiparHall(chave, id) {
  if (!podeMexerNoHall()) return;
  const sel = hallSelAtual(); if (!sel.selecao.includes(chave)) return;
  const eq = sel.equipamento;
  if (id) { for (const c of Object.keys(eq)) if (eq[c] === id) delete eq[c]; eq[chave] = id; } else delete eq[chave];
  atualizarHallMons();
}
export function raideComprarComum(id) {
  const r = comprarComumConta(id); if (!r.ok) return toast(r.motivo || 'Não deu.', 4000);
  renderSala();
}
export function raideComprarSegurado(id) {
  const r = comprarSeguradoConta(id); if (!r.ok) return toast(r.motivo || 'Não deu.', 4000);
  renderSala();
}
// "pronto" — o anfitrião só consegue começar quando todo mundo está pronto (com Pokémon escolhido)
export async function alternarProntoMP() {
  const sala = G.sala;
  if (!sala || sala.batalha) return;
  sala.pronto = !sala.pronto; await retrack(); renderSala();
}

/* ---------- presença: o que os outros veem de mim ---------- */
// principal (slot 0) + até 2 aliados em pé e que não estão descansando (slot = índice em S.aliados + 1).
function minhasFotos() {
  const eu = meuId(), S = G.S, sala = G.sala;
  if (sala && entradaEfetiva(sala) === 'espectador') return [];   // quem veio olhar não entra em lado nenhum
  // Hall da Fama (Sala de Raide OU entrada 'hall'): reidratados no nível real por `atualizarHallMons`, cada um já
  // com o item da Loja de preparo (reidratarHall), sem tocar em nenhuma run.
  if (sala && entradaEfetiva(sala) === 'hall') return (sala.hallMons || []).map((m, i) => ({ ...fotoDoMon(m, '', eu, null, i), hall: true }));
  if (sala && entradaEfetiva(sala) === 'convidado' && sala.convidado) return [{ ...fotoDoMon(sala.convidado, '', eu, null, 0), convidado: true }];
  if (!S?.player) return [];
  const aliados = (S.aliados || []).map((A, i) => [A, i]).filter(([A]) => A.hp > 0 && A.ordem !== 'fora').slice(0, 2);
  return [fotoDoMon(S.player, '', eu, null, 0), ...aliados.map(([A, i]) => fotoDoMon(A, '', eu, null, i + 1))];
}
// a insígnia de evento que a pessoa escolheu mostrar ao lado do nome (só o ID vai pela rede; o ícone sai de BADGES)
const meuPayload = () => ({ id: meuId(), nome: meuNome(), icone: meuIcone(), anfitriao: G.sala.anfitriao, time: G.sala.time,
  entrouEm: G.sala.entrouEm, mons: minhasFotos(), badge: nuvem.badgeExibida || null, pronto: !!G.sala.pronto, entradaTipo: entradaEfetiva(G.sala) });
const retrack = () => retrackCanal(meuPayload());
/* Convite em um toque: o código sozinho (pra ditar) ou um link que já cai na sala (`?sala=XXXX`, lido no boot do
   main.js). O endereço sai de `URL_SITE` (site.js) — endereço absoluto nunca é digitado à mão aqui. A área de
   transferência pode estar bloqueada (http, permissão negada): nesse caso mostramos o texto pra copiar na mão,
   em vez de falhar calado. */
export async function copiarConviteMP(oQue = 'codigo') {
  const sala = G.sala; if (!sala) return;
  const texto = oQue === 'link' ? `${URL_SITE}/?sala=${sala.codigo}` : sala.codigo;
  try {
    await navigator.clipboard.writeText(texto);
    toast(oQue === 'link' ? '🔗 Link do convite copiado! É só mandar pra quem você quer chamar.' : `📋 Código <b>${esc(sala.codigo)}</b> copiado!`, 4000);
  } catch (e) {
    console.warn('copiar', e);
    toast(`Não consegui copiar sozinho. O ${oQue === 'link' ? 'link' : 'código'} é: <b>${esc(texto)}</b>`, 9000);
  }
}
// anfitrião chama um amigo: aviso aparece pra ele em qualquer tela (nuvem.convidarAmigo → canal pessoal do amigo)
export async function convidarAmigoMP(amigoId) {
  if (!G.sala) return;
  const a = nuvem.amigos.find(x => x.amigo === amigoId);
  try { await convidarAmigo(amigoId, { codigo: G.sala.codigo, modo: G.sala.config.modo }); toast(`Convite enviado pra <b>${esc(a?.apelido || 'seu amigo')}</b>.`, 4000); }
  catch (e) { toast(`Não deu pra convidar: ${esc(e.message)}`, 6000); }
}

/* ---------- entrar e sair ---------- */
export const criarSala = () => conectar(novoCodigo(), true);
export function entrarSala(codigo) {
  codigo = String(codigo || '').trim().toUpperCase();
  if (!codigoValido(codigo)) return telaMultiplayer('O código tem 4 letras/números.');
  return conectar(codigo, false);
}
async function conectar(codigo, anfitriao) {
  if (G.sala) await sairSala();
  if (!nuvemConfigurada() || offline()) return telaMultiplayer();
  G.sala = { codigo, anfitriao, canal: null, membros: [], zona: G.S?.zone || ZONES[0].id, batalha: null, acoes: {}, acoesFeitas: [], escolhidos: new Set(),
    convidado: null,
    /* Com qual Pokémon EU entro. Entra-se primeiro e escolhe-se depois, no lobby (`escolherEntradaNaSala`): quem
       tem jornada já começa com ela, quem não tem começa "escolhendo" e a sala mostra isso pros outros. Pokémon
       desmaiado não impede mais de entrar — o Centro Pokémon está dentro da sala. */
    entradaTipo: temRun() ? 'run' : 'convidado',
    hallSel: { selecao: [], equipamento: {} }, hallMons: [], pronto: false,
    turnoVisto: null,   // último turno que aoReceberEstado processou (decide quando limpar as escolhas) — ver lá
    mensagens: [], // chat da sala: só na memória, nunca persiste (some ao sair)
    config: { modo: anfitriao && !temRun() ? 'pvp' : 'coop', porJogador: 1, balancear: true }, time: anfitriao ? 'A' : 'B', entrouEm: Date.now(), encontrouAnfitriao: anfitriao };
  const sala = G.sala;
  try {
    const canal = await abrirCanal(codigo);
    sala.canal = canal;
    canal.on('presence', { event: 'sync' }, aoMudarPresenca)
      .on('broadcast', { event: 'estado' }, ({ payload }) => aoReceberEstado(payload))
      .on('broadcast', { event: 'acao' }, ({ payload }) => { if (G.sala?.anfitriao) registrarAcao(payload.de, payload.acao); })
      .on('broadcast', { event: 'chat' }, ({ payload }) => aoReceberChat(payload))
      .on('broadcast', { event: 'fim' }, ({ payload }) => aoReceberFim(payload))
      .on('broadcast', { event: 'lobby' }, ({ payload }) => { anotar('← lobby'); if (G.sala && !G.sala.anfitriao) { G.sala.zona = payload.zona; G.sala.config = payload.config; renderSala(); } })
      .on('broadcast', { event: 'sincronizar' }, () => { // alguém pediu o estado de novo
        if (!G.sala?.anfitriao) return;
        anotar('← pedido de sincronização');
        if (G.sala.batalha) enviar('estado', pacoteEstado()); else publicarLobby();
      });
    canal.subscribe(async status => {
      anotar('canal: ' + status, !['SUBSCRIBED', 'CLOSED'].includes(status));
      if (!G.sala) return;
      if (status === 'SUBSCRIBED') {
        G.sala.conexao = 'ok'; G.sala.tentativas = 0;
        await canal.track(meuPayload());
        if (G.sala.anfitriao) { publicarLobby(); if (G.sala.batalha) enviar('estado', pacoteEstado()); }
        else enviar('sincronizar', { de: meuId() }); // voltei: me manda o que está valendo agora
        renderSala();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        // Antes isso fechava a sala na hora: trocar de aba já derrubava todo mundo. Agora tenta voltar sozinho.
        G.sala.conexao = 'caiu'; renderSala();
        if ((G.sala.tentativas = (G.sala.tentativas || 0) + 1) > 5) { await sairSala(); return telaMultiplayer('Perdi a conexão com a sala e não consegui voltar. Tente entrar de novo.'); }
        setTimeout(() => { if (G.sala?.canal === canal && G.sala.conexao === 'caiu') { anotar(`reconectando (tentativa ${G.sala.tentativas})`, true); canal.subscribe(); } }, 1500 * G.sala.tentativas);
      }
    });
  } catch (e) { console.error(e); G.sala = null; return telaMultiplayer(`Não consegui abrir a sala: ${esc(e.message)}`); }
  telaSala();
  if (!anfitriao) setTimeout(async () => { // ninguém anfitrião apareceu: código errado ou sala fechada
    if (G.sala?.codigo === codigo && !G.sala.encontrouAnfitriao) { await sairSala(); telaMultiplayer(`Sala <b>${esc(codigo)}</b> não encontrada.`); }
  }, 6000);
}
export async function sairSala() {
  if (!G.sala) return;
  const s = G.sala; G.sala = null;
  anotar('saindo da sala');
  await fecharSala(s);
}
function aoMudarPresenca() {
  const sala = G.sala;
  if (!sala) return;
  sala.membros = membrosDaPresenca(sala.canal);
  if (sala.membros.some(m => m.anfitriao)) {
    sala.encontrouAnfitriao = true;
    clearTimeout(sala.semAnfitriao); sala.semAnfitriao = null; // voltou (ou nem chegou a sumir de verdade)
  } else if (sala.encontrouAnfitriao && !sala.anfitriao && !sala.semAnfitriao) {
    // o anfitrião sumindo da presença costuma ser a aba dele em segundo plano: espera antes de desistir da sala
    anotar('anfitrião sumiu da presença — esperando ele voltar', true);
    sala.semAnfitriao = setTimeout(() => {
      if (!G.sala || G.sala.membros.some(m => m.anfitriao)) return;
      sairSala(); telaMultiplayer('O anfitrião saiu e não voltou. A sala acabou.');
    }, ESPERA_ANFITRIAO_MS);
  }
  if (!sala.anfitriao && sala.membros.findIndex(m => m.id === meuId()) >= MAX_JOGADORES) { sairSala(); return telaMultiplayer(`A sala está cheia (máximo ${MAX_JOGADORES}).`); }
  if (sala.anfitriao) publicarLobby(); // quem acabou de entrar recebe a configuração
  renderSala();
}

/* ---------- lobby: configuração (anfitrião) e time (cada um) ---------- */
function publicarLobby() { enviar('lobby', { zona: G.sala.zona, config: G.sala.config }); }
export function configurarSala(campo, valor) {
  const sala = G.sala;
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
  const sala = G.sala;
  if (!sala || sala.batalha || !['A', 'B'].includes(t)) return;
  sala.time = t; await retrack(); renderSala();
}
export function sincronizarSala() {
  const sala = G.sala;
  if (!sala) return;
  anotar('🔄 sincronizando');
  if (sala.anfitriao) { if (sala.batalha) enviar('estado', pacoteEstado()); else publicarLobby(); }
  else enviar('sincronizar', { de: meuId() });
  renderSala();
}

/* ---------- anfitrião: montar a batalha ---------- */
export async function iniciarBatalhaMP(tipo) {
  const sala = G.sala;
  if (!sala?.anfitriao || sala.batalha || sala.ocupado) return;
  const cfg = sala.config, membros = sala.membros.slice(0, MAX_JOGADORES).filter(m => m.mons?.[0]?.hp > 0);
  sala.ocupado = true; renderSala();
  try {
    let A, B, opcoes = {}, abertura;
    if (cfg.modo === 'raide') {
      // Sala de Raide: ninguém precisa de run — cada um traz o próprio Hall da Fama.
      if (!todosProntos(sala.membros)) throw new Error('Espere todo mundo escolher os Pokémon do Hall da Fama e marcar "pronto".');
      const agora = agoraDoEvento(), ev = eventoDaSemana(agora);
      if (!ev || !jaComecou(agora)) throw new Error('O chefe da semana não está disponível agora.');
      A = montarLado(membros, 'A', cfg.porJogador);
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
      A = montarLado(membros.filter(m => m.time === 'A'), 'A', cfg.porJogador); B = montarLado(membros.filter(m => m.time === 'B'), 'B', cfg.porJogador);
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
      if (climaDasRotasAtivo(G.S)) opcoes.zona = z.id; // o campo nasce com o clima/terreno da rota, se a run do anfitrião usa
      A = montarLado(membros, 'A', cfg.porJogador);
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
        // chefe da semana: o mesmo de startEvento (batalha.js), com HP que cresce menos que o número de jogadores
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
  finally { if (G.sala) { G.sala.ocupado = false; renderSala(); } }
}

/* ---------- anfitrião: juntar as escolhas e resolver o turno ---------- */
// pacote do estado atual (sem mexer no prazo) — usado pelo pulso e por quem pede pra sincronizar
const pacoteEstado = (eventos = []) => ({ batalha: G.sala.batalha, eventos, prazo: G.sala.prazo, acoesFeitas: Object.keys(G.sala.acoes), tipo: G.sala.tipo, zona: G.sala.zona });
function publicarEstado(eventos, novoTurno) {
  const sala = G.sala;
  if (novoTurno) { sala.prazo = Date.now() + PRAZO_MS; clearTimeout(sala.timer); sala.timer = setTimeout(autoCompletar, PRAZO_MS); }
  const p = pacoteEstado(eventos);
  enviar('estado', p);
  ligarPulso(() => (G.sala ? pacoteEstado() : null)); // enquanto a batalha rola, o anfitrião repete o estado de tempos em tempos
  aoReceberEstado(p); // broadcast não volta pra quem enviou
}
// Revive no meio da luta do chefe (o anfitrião valida e aplica NA HORA: o Pokémon volta e já escolhe neste turno)
function registrarRevive(de, acao) {
  const sala = G.sala, b = sala?.batalha; if (!b || sala.resolvendo) { anotar('← revive ignorado (luta resolvendo ou fora dela)', true); return; }
  // Sala de Raide: reviverCompanheiro NÃO exige o time inteiro caído e aceita Max Revive (`acao.pct`).
  const m = raideSemRun(sala) ? reviverCompanheiro(b, acao.ref, de, acao.pct || 50) : reviverNoEvento(b, acao.ref, de);
  if (!m) { anotar(`← revive recusado (${acao.ref})`, true); return; }
  anotar(`← revive de ${m.nome}`);
  publicarEstado([{ txt: `💊 ${m.nome} foi revivido com um ${acao.pct === 100 ? 'Max Revive (HP cheio)' : 'Revive (metade do HP)'} e volta pra luta!`, cls: 'good' }], false);
}
// Item de raide (Cristal de Ruptura, Selo de Interrupção, Escudo Astral…): ação livre, aplicada NA HORA
function registrarRaide(de, acao) {
  const sala = G.sala, b = sala?.batalha; if (!b || sala.resolvendo) { anotar('← item de raide ignorado (luta resolvendo ou fora dela)', true); return; }
  const r = usarRaideNoEvento(b, de, acao.item);
  if (!r.ok) { anotar(`← item de raide recusado (${acao.item}): ${r.motivo}`, true); return; }
  anotar(`← item de raide: ${acao.item}`);
  const quem = membroDe(de)?.nome || 'Alguém';
  publicarEstado([{ txt: `🎒 ${quem} usou ${ITEMS[ITEM_DO_RAIDE[acao.item]]?.name || 'um item de raide'}!`, cls: 'good' }, ...r.efeitos.filter(e => e.dizer).map(e => ({ txt: e.dizer, cls: e.cls || 'status' }))], false);
}
// Reordenar golpes (▲▼): ação livre — o anfitrião muta a ordem no Pokémon CANÔNICO (o dele, não a cópia local de
// quem pediu) e reenvia o estado, senão a escolha por índice do próximo turno bateria errado.
function registrarGolpeMover(de, acao) {
  const sala = G.sala, b = sala?.batalha; if (!b || sala.resolvendo) { anotar('← reordenar golpe ignorado (luta resolvendo)', true); return; }
  const m = monMP(b, acao.ref);
  if (!m || m.dono !== de || m.hp <= 0) { anotar(`← reordenar golpe ignorado (${acao.ref})`, true); return; }
  m.moves = moverGolpe(m.moves, acao.i, acao.dir);
  publicarEstado([], false);
}
function registrarAcao(de, acao) {
  const sala = G.sala, b = sala?.batalha; if (!b || !acao) return;
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
  const sala = G.sala, b = sala?.batalha; if (!b || !sala.anfitriao) return;
  for (const m of jogaveis(b).filter(x => !sala.acoes[x.ref])) {
    const alvo = primeiroInimigo(b, m), g = melhorGolpe(m.moves, tiposOfensivos(m), alvo ? tiposDefensivos(alvo) : []);
    sala.acoes[m.ref] = { ref: m.ref, tipo: 'golpe', golpe: g ? m.moves.indexOf(g) : -1, alvo: alvo?.ref };
  }
  resolver();
}
async function resolver() {
  const sala = G.sala;
  if (!sala?.batalha || sala.resolvendo) return; // trava: uma escolha atrasada não resolve o mesmo turno de novo
  sala.resolvendo = true;
  const b = sala.batalha, acoes = Object.values(sala.acoes);
  clearTimeout(sala.timer);
  // Alfa pensa melhor que selvagem (regras.ESPERTEZA)
  const esperteza = sala.tipo === 'alfa' || sala.tipo === 'evento' ? ESPERTEZA.chefe : ESPERTEZA.selvagem;
  const ia = [...b.lados.A, ...b.lados.B].filter(m => m.hp > 0 && m.dono === 'ia').map(m => acaoDaIA(b, m, Math.random, esperteza));
  let res;
  try { res = await resolverTurnoMP(b, [...acoes, ...ia]); } finally { if (G.sala) G.sala.resolvendo = false; }
  if (!G.sala) return;
  const { estado, eventos } = res;
  G.sala.batalha = estado; G.sala.acoes = {};
  const cab = [{ txt: `Turno ${b.turno}`, cls: 'turno' }];
  if (estado.fim) finalizar([...cab, ...eventos]); else publicarEstado([...cab, ...eventos], true);
}
function finalizar(eventos) {
  const sala = G.sala, b = sala.batalha;
  // resultado por Pokémon ("dono:slot"): fração de HP (o nível pode ter sido balanceado), PP e status
  const final = {};
  // `real` = lutou no nível de verdade (não foi ajustado pelo balancear): só esses levam XP/itens pra run.
  // `item`: item segurado que se GASTA no uso (Faixa de Foco) precisa voltar pra run como null, senão o jogador
  // ganharia um item de graça toda luta — o resto (Restos etc.) nunca muda sozinho, então só sincronizar já cobre.
  for (const m of [...b.lados.A, ...b.lados.B]) if (m.dono !== 'ia')
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

/* ---------- todos: receber, narrar, escolher ----------
   O motor devolve o turno inteiro de uma vez (texto puro), e a sala despejava tudo no registro no mesmo instante: o
   dano "acontecia sozinho" e não dava pra ver quem tinha atacado. Agora as linhas saem com uma pausa e o cartão de
   quem está agindo (`e.ref`, posto por mp-motor.resolverTurnoMP) pisca junto.
   O HP dos cartões já é o do FIM do turno (o estado que chega é uma foto pronta, sem os passos intermediários): o
   que a narração mostra é a ORDEM e o AUTOR de cada ação, não o HP baixando aos poucos.
   `sala.narrando` é o crachá desta narração: se outra começar (ou a sala fechar), a antiga para na hora. */
const PAUSA_NARRACAO = 260;
/* Quem está agindo vira ESTADO (`sala.atuandoRef`), não só uma classe solta no DOM: a sala se redesenha sozinha a
   cada pulso do anfitrião e a cada troca de presença, e o destaque tem de sobreviver a isso (`cartao` lê daqui). */
function marcarAtuando(ref) {
  if (!G.sala) return;
  G.sala.atuandoRef = ref || null;
  for (const el of document.querySelectorAll('.mp-mon[data-ref]')) el.classList.toggle('atacando', !!ref && el.dataset.ref === ref);
}
async function narrar(eventos) {
  if (!eventos?.length || !G.sala) return;
  if (REDUCED) { for (const e of eventos) logRaw({ html: esc(e.txt), cls: e.cls }); return; }   // quem pediu menos animação recebe tudo de uma vez
  const cracha = G.sala.narrando = {};
  for (const e of eventos) {
    if (!G.sala || G.sala.narrando !== cracha) return;   // outra narração começou (ou a sala fechou): esta para aqui
    if ((e.ref || null) !== (G.sala.atuandoRef || null)) marcarAtuando(e.ref);
    logRaw({ html: esc(e.txt), cls: e.cls });
    await sleep(PAUSA_NARRACAO);
  }
  if (G.sala?.narrando === cracha) { marcarAtuando(null); G.sala.narrando = null; }
}
function aoReceberEstado(p) {
  const sala = G.sala;
  if (!sala) return;
  sala.conexao = 'ok'; sala.ultimoEvento = Date.now();
  /* "É turno novo?" é decidido por `sala.turnoVisto`, que SÓ esta função escreve — nunca comparando com `sala.batalha`.
     Bug real (29/09/2026, relatado numa Sala de Raide): `resolver()` faz `sala.batalha = estado` ANTES de publicar, e
     publicar termina chamando esta função. No ANFITRIÃO, então, `sala.batalha.turno` já era o turno novo quando a
     comparação rodava: davam iguais, `escolhidos` nunca era limpo e `minhaVez()` não achava mais ninguém.
     `turnoVisto` volta a null no fim da luta, então turno 1 conta como novo. */
  const { novaLuta, turnoNovo, limparEscolhas } = leituraDoEstado(sala.turnoVisto, p.batalha.turno);
  if (turnoNovo) { anotar(`← estado (turno ${p.batalha.turno})`); sala.turnoVisto = p.batalha.turno; }
  if (limparEscolhas) { sala.escolhidos = new Set(); sala.gimmicksSel = {}; }
  sala.batalha = p.batalha; sala.prazo = p.prazo; sala.acoesFeitas = p.acoesFeitas || []; sala.tipo = p.tipo; sala.zona = p.zona;
  // contadores do que já descontei da mochila nesta luta (não mexer em `tentativaEvento`: o anfitrião já registrou a
  // tentativa em iniciarBatalhaMP, e zerar aqui faria ele registrar de novo)
  if (novaLuta) { sala.revivesConsumidos = 0; sala.raideConsumidos = {}; sala.itensComunsConsumidos = 0; }
  // chefe da semana: a tentativa (8 h) conta pra TODOS assim que a luta começa
  if (p.tipo === 'evento' && !sala.tentativaEvento) { registrarTentativa(); sala.tentativaEvento = true; }
  consumirRevives(p.batalha);
  consumirItensComuns(p.batalha);
  renderSala();
  narrar(p.eventos);   // desenha primeiro: a narração destaca os cartões que renderSala acabou de montar
}
async function aoReceberFim(p) {
  const sala = G.sala;
  if (!sala) return;
  sala.batalha = null; sala.acoes = {}; sala.ocupado = true; clearTimeout(sala.timer); desligarPulso();
  sala.turnoVisto = null; sala.tentativaEvento = false; sala.escolhidos = new Set(); sala.gimmicksSel = {};   // a próxima luta recomeça do zero
  renderSala();
  await narrar(p.eventos);   // o último turno (e o resultado) também saem narrados, antes de aplicar o resultado
  let acabouARun = false;
  try { acabouARun = await (p.pvp ? aplicarPvP(p) : aplicarCoop(p)); } catch (e) { console.error(e); }
  if (acabouARun) { await sairSala(); encerrarJornada('desmaiou'); return; } // Roguelike: desmaiou no co-op = fim da run
  if (!G.sala) return;
  G.sala.ocupado = false;
  await retrack(); // atualiza os Pokémon (HP, nível) que os outros veem
  renderSala();
}

/* ---------- ações da tela (main.js despacha por data-act) ---------- */
function escolher(acao) {
  const sala = G.sala, m = minhaVez(); if (!m) return;
  if (acao.tipo === 'golpe') { const alvos = inimigosDe(sala.batalha, m); if (!alvos.some(e => e.ref === acao.alvo)) acao.alvo = alvos[0]?.ref; }
  sala.escolhidos.add(m.ref);
  const a = { ...acao, ref: m.ref };
  if (sala.anfitriao) registrarAcao(meuId(), a); else { enviar('acao', { de: meuId(), acao: a }); renderSala(); }
}
// as gimmicks ligadas na tela viram parte da ação de golpe
function gimmicksSelecionadas() {
  const s = G.sala.gimmicksSel || {}, out = [];
  if (s.mega) out.push({ tipo: 'mega', ...s.mega });
  if (s.tera) out.push({ tipo: 'tera', valor: s.tera });
  if (s.gmax) out.push({ tipo: 'gmax' });
  if (s.z) out.push({ tipo: 'z' });
  return out;
}
export function escolherGolpeMP(i) {
  const m = minhaVez(); if (!m) return;
  const gimmicks = gimmicksSelecionadas();
  if (gimmicks.some(g => g.tipo === 'z') && !golpeZ(gimmicksDisponiveisMP(G.sala.batalha, m)?.p, m.moves[i])) { toast('Esse golpe não pode virar Z.', 4000); return; }
  escolher({ tipo: 'golpe', golpe: i, alvo: G.sala?.alvo, ...(gimmicks.length ? { gimmicks } : {}) });
  if (G.sala) G.sala.gimmicksSel = {};
}
export async function alternarGimmickMP(tipo) {
  const b = G.sala?.batalha, m = minhaVez(); if (!b || !m) return;
  const d = gimmicksDisponiveisMP(b, m); if (!d) return;
  const sel = (G.sala.gimmicksSel ||= {}), turno = b.turno;
  if (sel[tipo]) { delete sel[tipo]; return renderSala(); }   // apertar de novo desliga
  try {
    if (tipo === 'gmax' && d.gmax) sel.gmax = true;
    else if (tipo === 'z' && d.z) sel.z = true;
    else if (tipo === 'tera' && d.tera.length) {
      const i = await ask('Terastalizar em qual tipo? <small>Vale só nesta luta.</small>', [
        ...d.tera.map((t, j) => ({ label: TYPE_PT[t] || t, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
      if (i >= 0 && G.sala?.batalha?.turno === turno) sel.tera = d.tera[i];
    } else if (tipo === 'mega' && d.mega.length) {
      let f = d.mega[0];
      if (d.mega.length > 1) {
        const i = await ask('Qual forma?', [...d.mega.map((x, j) => ({ label: x.nome, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
        if (i < 0) return renderSala();
        f = d.mega[i];
      }
      // os dados da forma vão junto da ação: o anfitrião não busca nada na rede no meio do turno
      const data = await loadPokemon(f.forma);
      if (G.sala?.batalha?.turno === turno) sel.mega = { forma: f.forma, nomeForma: f.nome, id: data.id, name: data.name, types: data.types, base: data.base,
        sprite: data.sprite, back: data.back, ability: (data.abilities.find(a => !a.hidden) || data.abilities[0])?.name };
    }
  } catch (e) { console.error(e); toast('Não deu pra preparar isso agora (faltou um dado da PokéAPI). Tente de novo.', 5000); }
  renderSala();
}
export function moverGolpeMP(i, dir) {
  const m = minhaVez(); if (!m) return;
  const a = { tipo: 'golpe-mover', ref: m.ref, i, dir };
  if (G.sala.anfitriao) registrarAcao(meuId(), a); else enviar('acao', { de: meuId(), acao: a });
}
export function fugirMP() { escolher({ tipo: 'fugir' }); }
export function desistirMP() { escolher({ tipo: 'desistir' }); }
export function mirarMP(ref) { if (G.sala) { G.sala.alvo = ref; renderSala(); } }
export function usarRaideMP(tipo) {
  const b = G.sala?.batalha; if (!b || !raideDisponiveis(b, ctxDaSala()).includes(tipo)) return;
  const a = { tipo: 'raide', item: tipo };
  if (G.sala.anfitriao) registrarAcao(meuId(), a); else enviar('acao', { de: meuId(), acao: a });
}
export function usarItemComumMP(id) {
  if (!itensComunsDisponiveis(ctxDaSala({ mon: minhaVez() })).includes(id)) return;
  escolher({ tipo: 'item', item: id });   // usar um item é a ESCOLHA do turno (como golpe/fugir), não uma ação livre
}
export function reviverMP() {
  const sala = G.sala, b = sala?.batalha; if (!b || !podeReviver(b, ctxDaSala())) return;
  const m = b.lados.A.find(x => x.dono === meuId() && x.hp <= 0); if (!m) return;   // o primeiro caído (o principal, se for ele)
  const raide = raideSemRun(sala), usaMax = raide && (minhaMochila()['max-revive'] || 0) > 0;
  const a = { tipo: 'revive', ref: m.ref, ...(raide ? { pct: usaMax ? 100 : 50 } : {}) };
  if (sala.anfitriao) registrarAcao(meuId(), a); else enviar('acao', { de: meuId(), acao: a });
}
// Centro Pokémon sem sair da sala (mesma conta e mesmas regras do jogo sozinho)
export function centroMP() {
  const sala = G.sala;
  if (!sala || sala.batalha || !temRun()) return;
  const { precisa, custo } = centroPokemon();
  if (!precisa || G.S.money < custo) return;
  G.S.money -= custo; G.S.gasto = (G.S.gasto || 0) + custo;
  healFull(); zerarDescontoCentro(); save();
  logRaw({ html: `🏥 ${custo ? `Você pagou ₽${custo} e curou` : 'Você curou'} a equipe no Centro Pokémon.`, cls: 'good' });
  retrack(); renderSala(); // a presença mostra o HP dos seus Pokémon pros outros
}
/* ---------- chat ---------- */
function aoReceberChat(p) {
  if (!G.sala || !p?.texto) return;
  G.sala.mensagens.push(p); if (G.sala.mensagens.length > 100) G.sala.mensagens.shift();
  renderChat();
}
export async function enviarChatMP() {
  const el = document.getElementById('mp-chat-input');
  const texto = String(el?.value || '').trim().slice(0, 200);
  if (!G.sala || !texto) return;
  if (el) el.value = '';
  const msg = { de: meuId(), nome: meuNome(), icone: meuIcone(), texto, t: Date.now() };
  G.sala.mensagens.push(msg); if (G.sala.mensagens.length > 100) G.sala.mensagens.shift();
  renderChat();
  await enviar('chat', msg);   // o broadcast não volta pro remetente: por isso a própria mensagem entra na hora
}
