/* ============ batalha ============ */
// 1×1 contra selvagem ou contra a equipe de um treinador caçador (um Pokémon por vez; o treinador
// pode gastar a vez lançando bola em você). `turn(action)` é o único ponto de entrada da UI: trava `G.busy`, resolve
// jogador + inimigo na ordem certa, residual, vitória/derrota, e sempre salva no `finally`.
// As contas (precisão, fuga, ordem, residual, XP, EVs) moram em regras.js; aqui fica a narração.
import { G, nm, save, dificuldadeDe, ladoJogador, emCampo, vivos, registrar, registrarVisto, zerarDescontoCentro, rotasAtuais, rotulo } from './estado.js';
import { sortearDaRota, sequenciaLendaria, dadosDaGen, genDe, TOTAL_GENS, especieForcada, especiesDaGen, rotasDaGen } from './mapas.js';
import { log, say, ask } from './ui.js';
import { render } from './render.js';
import { healFull, CTX } from './efeitos.js';
import { usarGolpe, golpeTravado, fimDeTurno, fimDaRodada, passarClima, passarTerreno, passarLados, aplicarArmadilhas, aoEntrarEmCampo, desfazerForma } from './golpe.js';
import { gainExp, gainExpAliado, checkEvolution, verificarEvolucoesPendentes } from './progressao.js';
import { ganharFelicidade } from './evolucao.js';
import { useItem } from './itens.js';
import { oferecer } from './amizade.js';
import { makeMon } from './pokemon.js';
import { encerrarJornada, telaEscolherGen } from './fim.js';
import { API, STATS, STAT_PT, TYPE_PT, STRUGGLE, ZONES, BOLAS, CLASSES_TREINADOR, NOMES_TREINADOR, DIFICULDADES, ITEMS, ITENS_EVO_ACHADOS } from './dados.js';
import {
  freshVol, effStat, consegueFugir, ordenarAcoes, golpeDoAliado, xpPorVitoria, ganhoDeEVs,
  novoCampo, climaDasRotasAtivo, premioTreinador, bolaPorNivel, treinadorLancaBola, valorCaptura, balancosDaCaptura,
  statsDeChefe, premioChefe, zonaLiberada, desmaioPrecisaRevive, multShiny, climaDe, terrenoDe, escolhaIA, ESPERTEZA, multVento, poderZ, TURNOS_DYNAMAX
} from './regras.js';
import { verificarMissoes } from './missoes.js';
import { registrarAbate } from './conquistas.js';
import { megasDoJogador, megasDisponiveis, megaevoluir, desfazerMega, preCarregarMegas, inimigoPodeMega, inimigoMegaLiberada, HP_MEGA_INIMIGO, verboDaForma } from './mega.js';
import { terasDisponiveis, teracristalizar, desfazerTera } from './tera.js';
import { zDisponiveis } from './zmove.js';
import { podeGigantamax, gigantamaxar, passarDynamax, desfazerDynamax } from './dynamax.js';
import { loadPokemon, loadSpecies, loadMove, pokemonEmCache } from './api.js';
import { EVENTOS, idDaSemana, registrarTentativa, agoraDoEvento, EVENTO_SEM_PERMADEATH } from './evento.js';
import { prepararChefe, nivelDoChefe } from './boss.js';
import { registrarVitoriaDeEvento } from './carreira.js';
import { sincronizar, usuario } from './nuvem.js';
import { rand, pick, esc, fmt, offline, erroOffline } from './util.js';

// golpes e fim de turno vêm do motor único (golpe.js), narrados pelo CTX do single player (efeitos.js)
const useMove = (user, target, move, movedFirst) => usarGolpe(user, target, move, movedFirst, CTX);
// O inimigo pensa conforme quem ele é: selvagem chuta bastante, treinador pensa melhor, Alfa e lendário quase sempre
// acertam o golpe (regras.escolhaIA). O alvo é sempre o seu lado — pega o primeiro em pé pra medir a eficácia.
function chooseEnemyMove(E) {
  const B = G.B;
  const esperteza = B?.chefe || B?.lendarios || B?.evento ? ESPERTEZA.chefe : B?.trainer ? ESPERTEZA.treinador : ESPERTEZA.selvagem;
  const alvo = vivos(emCampo())[0] || G.S.player;
  return escolhaIA(E.moves, E.data.types, alvo.data.types, esperteza) || STRUGGLE;
}
const residual = m => fimDeTurno(m, CTX); // queimadura/veneno + Speed Boost, Shed Skin

/* ---- início de batalha ---- */
// selvagem: da lista da rota, pela taxa de aparição de cada um (mapas.js). Míticos da Gen: bem raros, nas rotas altas.
// Offline: só entre os que já estão no cache deste navegador (buscados em alguma partida online).
function sortearOponente(z) {
  // repelente seletivo ou Caça Shiny: só a espécie escolhida aparece (mapas.js especieForcada)
  const caca = especieForcada(G.S, z);
  if (caca) {
    const alvo = z.pool.find(x => x.n === caca);
    if (alvo && (!offline() || pokemonEmCache(alvo.id))) return { id: alvo.id, level: rand(z.min, z.max) };
  }
  const p = sortearDaRota(z, offline() ? pokemonEmCache : null);
  if (!p) throw erroOffline(`📴 Sem internet, e nenhum Pokémon de ${z.name} está salvo neste aparelho ainda. Tente uma rota que você já explorou, ou baixe o mapa em ⚙ Ajustes → Jogar offline.`);
  return { id: p.id, level: rand(z.min, z.max) };
}
async function novoOponente(z) { const { id, level } = sortearOponente(z); return makeMon(await loadPokemon(id), level); }
/* Equipe de treinador: metade dela NÃO sai do pool da rota. Um treinador andou até aqui — a rota diz em que NÍVEL
   ele está, não quais espécies ele criou. O resto continua vindo do pool, pra rota manter a cara dela.
   Vale pra todo treinador de rota (o de emboscada é o único que existe hoje). Offline, só o que está guardado. */
const CHANCE_FORA_DA_ROTA = 0.5;
function sortearDoTreinador(z) {
  if (Math.random() < CHANCE_FORA_DA_ROTA) {
    let lista = especiesDaGen(z.gen || genDe(G.S));
    if (offline()) lista = lista.filter(p => pokemonEmCache(p.id));
    if (lista.length) return { id: pick(lista).id, level: rand(z.min, z.max) };
  }
  return sortearOponente(z); // (offline sem nada guardado: o erro daqui é o mesmo do encontro selvagem)
}
async function novoOponenteTreinador(z) { const { id, level } = sortearDoTreinador(z); return makeMon(await loadPokemon(id), level); }
function iniciar(B) {
  for (const m of ladoJogador()) m.vol = freshVol();
  // o campo já nasce com o clima/terreno da rota (regras.CLIMA_DA_ROTA); habilidades de entrada e golpes ainda trocam
  G.B = { caidos: new Set(), campo: novoCampo(climaDasRotasAtivo(G.S) ? G.S?.zone : null), ...B };
  G.mode = 'battle'; G.panel = 'moves'; registrarVisto(B.enemy); render();
  /* Baixa as formas Mega que podem entrar em campo AGORA, em segundo plano. A batalha não espera: se a rede
     falhar, só não dá pra megaevoluir nesta luta. O que não pode é buscar no meio do turno — foi o cuidado que
     a Mudança de Postura do Aegislash documentou (golpe.trocarPostura). */
  preCarregarMegas([G.S.player, G.B.enemy]).catch(e => console.warn('mega: pré-carga', e));
}
// Habilidades de entrada em campo (Intimidate, Drizzle, Download, Intrepid Sword…): cada um do seu lado age sobre o
// inimigo e o inimigo age sobre todo o seu lado. Na troca de Pokémon do treinador só o que acabou de entrar dispara.
// A regra em si é a `golpe.aoEntrarEmCampo`, a MESMA do multiplayer.
async function intimidar(E, soInimigo = false) {
  const lado = vivos(emCampo());
  await aoEntrarEmCampo(soInimigo ? [E] : [...lado, E], m => (m === E ? lado : [E]), CTX);
}
export async function startBattle(z) {
  const E = await novoOponente(z);
  // no Santuário existe encontro selvagem com lendário/mítico: marca aqui, que é onde se sabe de que pool ele veio
  // (amizade.js deixa a amizade deles subir bem mais devagar)
  const entrada = z.pool.find(p => p.id === E.id);
  if (entrada?.l || entrada?.m) E.lendario = true;
  iniciar({ enemy: E, turn: 1, runs: 0 });
  await say(`Um <b>${esc(fmt(E.name))}</b> selvagem (Nv. ${E.level}) apareceu!`, 'enc');
  if (entrada?.m) await say('🌟 Um Pokémon mítico! Quase ninguém chega a ver um desses.', 'level');
  if (E.shiny) await say('✨ Ele brilha! Um Pokémon shiny.', 'level');
  await intimidar(E);
}
// Alfa da zona: IVs perfeitos + statsDeChefe (HP ×2, resto ×1,3). Não aceita petisco; dá pra fugir.
export async function startBossBattle(z) {
  const c = z.chefe, max = Object.fromEntries(STATS.map(s => [s, 31]));
  if (offline() && !pokemonEmCache(c.id)) throw erroOffline(`📴 Sem internet: o Alfa de ${z.name} ainda não está salvo neste aparelho. Desafie ele online uma vez, ou baixe o mapa em ⚙ Ajustes → Jogar offline.`);
  const E = await makeMon(await loadPokemon(c.id), c.nivel, { ivs: max });
  E.stats = statsDeChefe(E.stats); E.hp = E.stats.hp; E.chefe = z.id;
  iniciar({ enemy: E, turn: 1, runs: 0, chefe: z.id });
  await say(`⚔ O chão treme. <b>${esc(fmt(E.name))} Alfa</b> (Nv. ${E.level}) guarda ${esc(z.name)}!`, 'enc');
  await say('Alfas são muito mais fortes que o normal: o dobro de HP e 30% a mais em todo o resto.', 'muted');
  if (E.shiny) await say('✨ E ele brilha! Um Alfa shiny.', 'level');
  await intimidar(E);
}
// Luta final do mapa: os lendários da Gen em sequência (mapas.js sequenciaLendaria), um de cada vez, como a equipe
// de um treinador — só que sem bolas. IVs perfeitos; o último (o principal) ainda vem turbinado como Alfa.
// Vencer = fechar a Gen (vencerGen). Dá pra fugir e voltar depois; não aceita petisco.
export async function startLendarios(z) {
  const seq = sequenciaLendaria(z), max = Object.fromEntries(STATS.map(s => [s, 31]));
  if (offline() && seq.some(l => !pokemonEmCache(l.id))) throw erroOffline(`📴 Sem internet: os lendários de ${z.name} ainda não estão salvos neste aparelho. Baixe o mapa em ⚙ Ajustes → Jogar offline.`);
  const equipe = await Promise.all(seq.map(async (l, i) => {
    const M = await makeMon(await loadPokemon(l.id), l.nivel, { ivs: max });
    if (i === seq.length - 1) { M.stats = statsDeChefe(M.stats); M.hp = M.stats.hp; }
    M.lendario = true; return M;
  }));
  const regiao = dadosDaGen(z.gen).regiao;
  const trainer = { nome: `Lendários de ${regiao}`, equipe, atual: 0, bolas: 0, bola: 'poke-ball', lendarios: true };
  iniciar({ enemy: equipe[0], turn: 1, runs: 0, trainer, chefe: z.id, lendarios: true });
  await say(`⚡ O ar pesa em ${esc(z.name)}. <b>${equipe.length} lendários de ${regiao}</b> se revelam, um depois do outro.`, 'enc');
  await say(`Vença todos pra fechar a Gen ${z.gen}. O último, ${esc(fmt(equipe[equipe.length - 1].name))}, é o mais forte: HP ×2 e +30% no resto.`, 'muted');
  await say(`<b>${esc(fmt(equipe[0].name))}</b> (Nv. ${equipe[0].level}) avança!${equipe[0].shiny ? ' ✨ Shiny!' : ''}`);
  await intimidar(equipe[0]);
}
/* ---- chefe do evento semanal (evento.js / boss.js) ----
   Nível do jogador + 12 (piso 70), IVs perfeitos, HP e atributos muito acima de um Alfa, imune a status, com couraça,
   golpe telegrafado e fases. Sem fuga (o botão avisa), e a tentativa já gasta as 8 horas de espera na hora em que a luta
   começa. Perder no Roguelike/Hardcore é perder como em qualquer luta: a regra do modo vale. */
export async function startEvento(ev) {
  const S = G.S, P = S.player;
  if (offline() && !pokemonEmCache(ev.formaId)) throw erroOffline(`📴 Sem internet: ${ev.nome} ainda não está salvo neste aparelho. Abra o evento online uma vez.`);
  const max = Object.fromEntries(STATS.map(s => [s, 31]));
  const E = await makeMon(await loadPokemon(ev.formaId), nivelDoChefe(P.level), { ivs: max, shiny: false });
  // golpes escolhidos a dedo (a lista de nível do Eternamax é curta e fraca demais pra um chefe)
  const golpes = (await Promise.all((ev.golpes || []).map(n => loadMove(`${API}/move/${n}/`).catch(() => null)))).filter(Boolean).map(m => ({ ...m, ppLeft: m.pp }));
  if (golpes.length) E.moves = golpes;
  prepararChefe(E, 1, ev.chefe);
  registrarTentativa();                      // 1 tentativa a cada 8 horas: conta ao começar, vença ou perca
  iniciar({ enemy: E, turn: 1, runs: 0, evento: ev.id });
  await say(`☄ O céu racha. <b>${esc(ev.nome)}</b> (Nv. ${E.level}) surge, e o ar vibra com energia demais para um Pokémon.`, 'enc');
  await say('EVENTO DA SEMANA: o chefe é imune a status, tem uma couraça de energia e carrega um golpe devastador. Não dá pra fugir.', 'muted');
  await intimidar(E);
}
// vitória sobre o chefe: o Pokémon é seu na Pokédex e nas próximas jornadas, e a badge de evento vem junto
async function vencerEvento() {
  const S = G.S, B = G.B, ev = EVENTOS.find(e => e.id === B.evento); if (!ev) { endBattle(); return; }
  endBattle();
  const r = registrarVitoriaDeEvento(ev, idDaSemana(agoraDoEvento()));
  await say(`🏆 <b>${esc(ev.nome)} foi derrotado!</b>`, 'level');
  if (r.semanaNova) {
    S.money += ev.recompensa.dinheiro || 0;
    for (const [k, n] of Object.entries(ev.recompensa.itens || {})) S.bag[k] = (S.bag[k] || 0) + n;
    await say(`Prêmio da semana: ₽${ev.recompensa.dinheiro || 0}${Object.entries(ev.recompensa.itens || {}).map(([k, n]) => `, ${n}× ${ITEMS[k]?.name || k}`).join('')}.`, 'level');
  } else await say('Você já tinha vencido este chefe nesta semana: o prêmio só sai uma vez por semana.', 'muted');
  if (r.primeiraVez) {
    await say(`🌌 Insígnia <b>${esc(ev.badge.nome)}</b> conquistada — título “${esc(ev.badge.titulo)}”. Escolha qual insígnia mostrar ao lado do seu nome na tela 👤 Conta.`, 'level');
    await say(`🔓 <b>${esc(fmt(ev.especie))}</b> está liberado na Pokédex e pra começar novas jornadas!`, 'level');
  }
  if (usuario()) sincronizar().catch(e => console.warn('sincronizar (evento)', e));   // sobe a conquista pra nuvem já
  save();
}
// Treinador caçador: 1–3 Pokémon da zona (mais na zona alta), algumas bolas, e quer te capturar
export async function startTrainerBattle(z) {
  const P = G.S.player;
  const nivelRef = z.max;
  const n = rand(1, Math.min(3, 1 + Math.floor(nivelRef / 15)));
  const [equipe, especie] = await Promise.all([
    Promise.all(Array.from({ length: n }, () => novoOponenteTreinador(z))),
    loadSpecies(P.data.speciesUrl).catch(() => ({ captureRate: 45 })) // offline sem cache: taxa média
  ]);
  const trainer = { nome: `${pick(CLASSES_TREINADOR)} ${pick(NOMES_TREINADOR)}`, equipe, atual: 0, bolas: rand(2, 4), bola: bolaPorNivel(Math.max(...equipe.map(m => m.level))) };
  iniciar({ enemy: equipe[0], turn: 1, runs: 0, trainer, taxaCaptura: especie.captureRate ?? 45 });
  await say(`⚠ <b>${esc(trainer.nome)}</b> avistou você e quer te capturar! (${n} Pokémon, ${trainer.bolas}× ${BOLAS[trainer.bola].nome})`, 'enc');
  await say(`${esc(trainer.nome)} envia <b>${esc(fmt(equipe[0].name))}</b> (Nv. ${equipe[0].level})!${equipe[0].shiny ? ' ✨ Um shiny!' : ''}`);
  await intimidar(equipe[0]);
}

/* ---- turno ---- */
// B.vez = quem está agindo agora — só pra barra de turno e o destaque da placa
async function vez(v) { G.B.vez = v; render(); }
// o lado inimigo: em batalha de treinador, ele pode gastar a vez lançando bola em vez do Pokémon dele atacar
function acaoDoInimigo(E, P) {
  const T = G.B.trainer;
  if (T && treinadorLancaBola(P.hp, P.stats.hp, T.bolas)) return { bola: true };
  return { move: chooseEnemyMove(E) };
}
async function lancarBola(P) {
  const B = G.B, T = B.trainer, bola = BOLAS[T.bola];
  T.bolas--;
  await say(`${esc(T.nome)} lançou uma <b>${bola.nome}</b> em você!`, 'status');
  const real = balancosDaCaptura(valorCaptura(P.hp, P.stats.hp, B.taxaCaptura, bola.mult, P.status));
  const regra = DIFICULDADES[dificuldadeDe(G.S)];
  const balancos = regra.semCaptura ? Math.min(real, 3) : real; // Fácil/Médio: nunca fecha
  for (let i = 0; i < Math.min(balancos, 3); i++) await say('A bola balança...', 'muted');
  if (balancos >= 4) { B.capturado = true; await say('Clique! A bola se fechou. Você foi capturado...', 'hit'); return; }
  if (regra.semCaptura && real >= 4) await say(`Por pouco! Você arrebenta a bola no último segundo. (modo ${regra.nome}: você sempre escapa)`, 'good');
  else await say('Você se debate e escapa da bola!', 'good');
}
// id do destaque de quem age: 'p' você, 'a0'/'a1' aliados
const idVez = m => m === G.S.player ? 'p' : 'a' + G.S.aliados.indexOf(m);
// aliado que acabou de cair: anuncia uma vez só (B.caidos guarda quem já foi anunciado nesta batalha)
async function anunciarQuedas() {
  // no chefe de evento ninguém é perdido pra sempre (evento.EVENTO_SEM_PERMADEATH): a luta é difícil, não um risco à run inteira
  const permadeath = DIFICULDADES[dificuldadeDe(G.S)].permadeath && !(EVENTO_SEM_PERMADEATH && G.B?.evento);
  for (const A of [...(G.S.aliados || [])]) if (A.hp <= 0 && !G.B.caidos.has(A)) {
    G.B.caidos.add(A);
    if (!permadeath) { await say(`${nm(A)} desmaiou!`, 'hit'); continue; }
    // Roguelike: aliado que cai é perdido na hora (sai da equipe; nem Revive nem Centro trazem de volta)
    const nome = nm(A);
    G.S.aliados.splice(G.S.aliados.indexOf(A), 1); G.abertos.clear();
    G.S.aliadosPerdidos = (G.S.aliadosPerdidos || 0) + 1;   // conta pra badge "Cemitério de parceiros" (badges.js)
    /* `B.vez` guarda quem está agindo como 'a<índice em G.S.aliados>' — e o render lê esse índice de volta.
       Tirar o aliado da equipe aqui faz o índice apontar pro vazio, e o render seguinte quebrava a rodada
       inteira (`Cannot read properties of undefined`, com o turno já perdido). Acontecia de verdade com
       Self-Destruct no Roguelike: o aliado se explode, é perdido na hora, e o índice morre junto. */
    G.B.vez = null;
    render();
    await say(`${nome} desmaiou... e não vai voltar. Aliado perdido pra sempre.`, 'hit');
  }
}
/* ---- Mega Evolução (mega.js) ----
   Só VOCÊ megaevolui — aliado nunca, mesmo com a espécie liberada (decisão do usuário).
   Botão ⚡: não gasta o turno (você megaevolui e ataca no mesmo turno), como nos jogos. Com duas formas
   (Charizard, Mewtwo), pergunta qual. */
export async function usarMega() {
  const B = G.B; if (G.busy || !B) return;
  const formas = megasDoJogador(); if (!formas.length) return;
  G.busy = true; render();
  try {
    let f = formas[0];
    if (formas.length > 1) {
      const i = await ask(`Qual forma?`, [...formas.map((x, j) => ({ label: x.nome, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
      if (i < 0) return;
      f = formas[i];
    }
    const P = G.S.player, nome = await megaevoluir(P, f);
    if (!nome) { await say('A energia não respondeu agora (faltou um dado da PokéAPI). Tente de novo.', 'muted'); return; }
    B.megaUsada = true;
    render();
    await say(`<b>${esc(rotulo(P))} ${verboDaForma(f)}!</b> ${esc(f.nome)} entra em campo.`, 'level');
    await say(`Habilidade agora: <b>${esc(fmt(P.ability))}</b>.`, 'status');
  } catch (e) { console.error(e); log('Não deu pra megaevoluir: ' + esc(e.message), 'hit'); }
  finally { G.busy = false; render(); save(); }
}
/* Botão 💎: mesma economia da Mega — uma por batalha e NÃO gasta o turno. A escolha do tipo é sua, entre os
   que você já conquistou (200 derrotados de cada). Dá pra usar Tera e Mega na mesma luta: são conquistas
   diferentes, cada uma com o seu custo de longo prazo. */
export async function usarTera() {
  const B = G.B; if (G.busy || !B) return;
  const tipos = terasDisponiveis(); if (!tipos.length) return;
  G.busy = true; render();
  try {
    const i = await ask('Terastalizar em qual tipo?', [
      ...tipos.map((t, j) => ({ label: TYPE_PT[t] || t, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
    if (i < 0) return;
    const P = G.S.player, tipo = tipos[i];
    teracristalizar(P, tipo);
    B.teraUsada = true;
    render();
    await say(`<b>${esc(rotulo(P))} TERASTALIZOU!</b> Agora é do tipo ${esc(TYPE_PT[tipo] || tipo)} — e só dele.`, 'level');
  } catch (e) { console.error(e); log('Não deu pra terastalizar: ' + esc(e.message), 'hit'); }
  finally { G.busy = false; render(); save(); }
}

/* Botão 🔴: como a Mega e a Tera, não gasta o turno. Dura TURNOS_DYNAMAX turnos e encolhe sozinho.
   É a única gimmick sem item — ver o cabeçalho de dynamax.js pro porquê. */
export async function usarGigantamax() {
  const B = G.B; if (G.busy || !B || !podeGigantamax()) return;
  G.busy = true; render();
  try {
    const P = G.S.player;
    gigantamaxar(P);
    B.gmaxUsado = true;
    render();
    await say(`<b>${esc(rotulo(P))} GIGANTAMAXOU!</b> O HP dobrou e os golpes viram Max por ${TURNOS_DYNAMAX} turnos.`, 'level');
  } catch (e) { console.error(e); log('Não deu pra gigantamaxar: ' + esc(e.message), 'hit'); }
  finally { G.busy = false; render(); save(); }
}

/* Botão 🌀: diferente da Mega e da Tera, o Z-Move **é** o seu turno — ele não transforma, converte um golpe
   seu num golpe muito mais forte, uma vez por batalha. Por isso ele termina chamando `turn` com o golpe
   escolhido, e não resolve nada por conta própria. */
export async function usarZ() {
  const B = G.B; if (G.busy || !B) return;
  const opcoes = zDisponiveis(); if (!opcoes.length) return;
  const i = await ask('Qual golpe vira Z-Move? <small>Gasta o seu turno e o PP do golpe.</small>', [
    ...opcoes.map(({ g }, j) => ({ label: `${fmt(g.name)} — poder ${g.power ?? '—'} → ${poderZ(g.power)}`, value: j })),
    { label: 'Cancelar', value: -1, ghost: true }]);
  if (i < 0) return;
  return turn({ type: 'move', idx: opcoes[i].i, z: true });
}

/* O inimigo vira quando cai a METADE do HP — é a segunda fase da luta, não um susto no primeiro turno. Só Alfa,
   lendário e treinador (decisão do usuário: selvagem de rota continua sendo selvagem de rota).
   Não precisa de conquista nenhuma: a conquista é o que libera a SUA Mega, não a do adversário. */
async function megaDoInimigo() {
  const B = G.B, E = B?.enemy;
  if (!B || !E || B.megaInimigoUsada || !inimigoPodeMega(B) || E.hp <= 0) return;
  if (!inimigoMegaLiberada(E)) return;   // Mega de inimigo só de nível 40 em diante (não marca "usada": o Tera ainda pode virar)
  if (E.hp > E.stats.hp * HP_MEGA_INIMIGO) return;
  const f = megasDisponiveis(E, { jaUsou: false, liberada: () => true, ignorarPedra: true })[0];
  if (!f) { B.megaInimigoUsada = true; return; }   // não tem forma: não checa de novo a cada golpe
  B.megaInimigoUsada = true;
  const nome = await megaevoluir(E, f);
  if (!nome) return;
  render();
  await say(`<b>${esc(rotulo(E))} ${verboDaForma(f)}!</b> ${esc(f.nome)} — a luta mudou de patamar.`, 'hit');
}

/* Tera do inimigo: mesmas lutas da Mega (Alfa, lendário e treinador) e o mesmo gatilho de metade do HP —
   decisão do usuário, por coerência entre as duas.
   **Uma virada por luta**: se ele já megaevoluiu, não terastaliza também. Duas transformações no mesmo momento
   viraria o combate de cabeça pra baixo de uma vez só, e quem joga não teria como reagir a nenhuma das duas.
   O tipo escolhido é um dos DELE: é o que dá o STAB de 2.0 e mantém a leitura possível — a fraqueza nova é
   adivinhável a partir do que ele já era. */
async function teraDoInimigo() {
  const B = G.B, E = B?.enemy;
  if (!B || !E || B.teraInimigoUsada || B.megaInimigoUsada || !inimigoPodeMega(B) || E.hp <= 0) return;
  if (E.hp > E.stats.hp * HP_MEGA_INIMIGO) return;
  const tipo = (E.data?.types || [])[0];
  B.teraInimigoUsada = true;
  if (!tipo) return;
  teracristalizar(E, tipo);
  render();
  await say(`<b>${esc(rotulo(E))} TERASTALIZOU!</b> Agora é ${esc(TYPE_PT[tipo] || tipo)} puro.`, 'hit');
}

export async function turn(action) {
  if (G.busy || !G.B) return;
  G.busy = true;
  const B = G.B, S = G.S, P = S.player, E = B.enemy;
  // item sem efeito cancela o turno sem avançar B.turn — não repetir o divisor na próxima tentativa
  if (B.turnoNoLog !== B.turn) { log(`Turno ${B.turn}`, 'turno'); B.turnoNoLog = B.turn; }
  try {
    // 1) sua ação que não é golpe resolve antes de tudo (fuga, item, petisco) — como item nos jogos
    let pm = null;
    if (action.type === 'run' && B.evento) {
      await say('Não dá pra fugir do chefe da semana!', 'hit'); return;   // não gasta o turno
    }
    if (action.type === 'run') {
      B.runs++;
      await vez('p');
      const cl = climaDe(B.campo); // fugir também sente o clima (Swift Swim e cia.)
      if (consegueFugir(effStat(P, 'speed', false, true, cl), effStat(E, 'speed', false, true, cl), B.runs, P.ability)) {
        await say('Você fugiu em segurança!'); endBattle(); return;
      }
      await say('Não conseguiu fugir!');
    } else if (action.type === 'item') {
      await vez('p');
      if (!(await useItem(action.id, true))) return;
      G.panel = 'moves';
    } else if (action.type === 'oferecer') {
      await vez('p');
      const r = await oferecer(action.id, E);
      if (r === 'cancelado') return;
      if (r === 'fim') { endBattle(); return; }
      G.panel = 'moves';
    } else pm = action.idx === -1 ? STRUGGLE : P.moves[action.idx];
    /* Z-Move: liga a marca no `vol` (regras.calcDamage converte o poder) e gasta a vez da batalha. O flag é
       desligado no `finally` deste turno — um Z que "vazasse" pro turno seguinte dobraria o dano de graça. */
    if (action.z && pm) { P.vol.zAtivo = true; B.zUsado = true; await say(`<b>${esc(rotulo(P))} concentra a energia Z!</b>`, 'level'); }

    // 2) golpes do turno: você (se escolheu golpe), cada aliado em pé e o lado inimigo, por prioridade e velocidade.
    //    Bola do treinador é item: prioridade máxima, sai antes de qualquer golpe.
    const acoes = [], clima = climaDe(B.campo), terreno = terrenoDe(B.campo); // clima e terreno entram na velocidade
    // Vento de Cauda (Tailwind) dobra a velocidade do lado dele (regras.multVento)
    const vel = m => effStat(m, 'speed', false, true, clima, terreno) * multVento(B.campo.lados?.[CTX.ladoDe(m)]);
    if (pm) acoes.push({ quem: P, golpe: pm, prio: pm.priority || 0, vel: vel(P) });
    // aliados em campo agem pela ordem que você deu (golpeDoAliado); "Não atacar"/sem golpe válido = fica parado
    for (const A of vivos(emCampo()).filter(m => m !== P)) {
      const d = golpeDoAliado(A.ordem || 'livre', A.moves, A.data.types, E.data.types);
      if (d.parado) { acoes.push({ quem: A, parado: d.parado, prio: 0, vel: vel(A) }); continue; }
      const g = d.golpe || STRUGGLE;
      acoes.push({ quem: A, golpe: g, prio: g.priority || 0, vel: vel(A) });
    }
    const ea = acaoDoInimigo(E, P);
    acoes.push(ea.bola ? { quem: E, bola: true, prio: 99, vel: 0 } : { quem: E, golpe: ea.move, prio: ea.move.priority || 0, vel: vel(E) });
    // o que cada um vai usar neste turno (Sucker Punch olha isso: só funciona contra quem vai atacar). Golpe travado (carga/fúria) vale.
    for (const m of [...ladoJogador(), E]) delete m.vol.golpeEscolhido;
    for (const a of acoes) if (a.golpe) a.quem.vol.golpeEscolhido = golpeTravado(a.quem) || a.golpe;
    const ordem = ordenarAcoes(acoes);
    const posicao = m => ordem.findIndex(a => a.quem === m); // -1 = não age neste turno
    for (let i = 0; i < ordem.length; i++) {
      const a = ordem[i];
      if (P.hp <= 0 || E.hp <= 0 || B.capturado) break;
      if (a.quem.hp <= 0) continue;
      if (a.bola) { await vez('t'); await lancarBola(P); continue; }
      if (a.parado) { await vez(idVez(a.quem)); await say(`${nm(a.quem)} ${a.parado}`, 'muted'); continue; }
      if (a.quem === E) {
        const alvo = pick(vivos(emCampo()));
        // recuo (flinch) só vale em quem ainda não agiu neste turno
        await vez('e'); await useMove(E, alvo, a.golpe, posicao(alvo) === -1 || i < posicao(alvo));
      } else {
        const hpAntes = E.hp;
        await vez(idVez(a.quem)); await useMove(a.quem, E, a.golpe, i < posicao(E));
        // quem deu o golpe final (e com qual golpe): é o que as conquistas de conta contam — e elas só contam o
        // que VOCÊ fez, não o que o aliado fez (conquistas.js / registrarAbate)
        if (hpAntes > 0 && E.hp <= 0) B.abate = { porMim: a.quem === P, golpe: a.golpe };
      }
      await anunciarQuedas(); // dano do inimigo ou recuo do próprio golpe
      // o chefe vira na metade do HP: checado depois de cada ação, pra acontecer no golpe que derrubou a barra
      try { await megaDoInimigo(); await teraDoInimigo(); } catch (e) { console.error('virada do inimigo', e); }
    }
    if (B.capturado) { await serCapturado(); return; }
    if (P.hp > 0 && E.hp > 0) { await vez('fim'); for (const m of [...vivos(emCampo()), E]) await residual(m); await passarClima(B.campo, CTX); await passarTerreno(B.campo, CTX); await passarLados(B.campo, CTX); await anunciarQuedas(); }
    for (const m of [...ladoJogador(), E]) fimDaRodada(m);  // recuo, Protect e Endure valem só um turno
    // o gigante encolhe no fim da rodada; narrar é importante, senão o HP "some" sem explicação
    for (const m of ladoJogador()) if (passarDynamax(m) === 'acabou') { render(); await say(`${nm(m)} voltou ao tamanho normal.`, 'status'); }
    B.turn++;
    if (P.hp <= 0) await lose();
    else if (E.hp <= 0) await win();
  } catch (e) {
    console.error(e); log('Algo deu errado neste turno: ' + esc(e.message), 'hit');
  } finally {
    B.vez = null;
    delete P.vol.zAtivo;   // vale só pelo turno em que foi acionado (ver o `action.z` acima)
    // missões no fim de TODO turno (inclusive fuga/amizade que saem cedo com `return`); G.S some no fim de jogo do Hardcore
    try { await verificarMissoes(); } catch (e) { console.error(e); }
    if (!G.B && G.S) await retomarEvolucoes(); // batalha acabou: evolução pendente por falta de rede tenta de novo
    G.busy = false; render(); save();
  }
}

/* ---- fim de batalha ---- */
async function win() {
  const S = G.S, B = G.B, T = B.trainer, P = S.player, E = B.enemy;
  await say(`${nm(E)} desmaiou!`, 'good');
  const mult = multShiny(S); // segredo do brilho: shiny ganha XP e dinheiro em dobro (regras.js)
  const xp = xpPorVitoria(E, !!T) * mult;
  const gained = [];
  for (const [s, add] of ganhoDeEVs(P.evs, E.data.effort)) { P.evs[s] += add; gained.push(`+${add} EV de ${STAT_PT[s]}`); }
  const money = T ? 0 : E.level * rand(8, 14) * mult; // de treinador, o dinheiro vem todo no prêmio final
  S.money += money; S.wins = (S.wins || 0) + 1;
  S.vitoriasDesdeCentro = (S.vitoriasDesdeCentro || 0) + 1; // desconto do Centro no modo Médio
  registrar(S, 'derrotados', E.data.speciesName, E.id);
  /* Conquistas da conta (conquistas.js). A espécie conta sempre — o aliado lutando com você também constrói a sua
     Pedra Mega. Tipo e golpe só quando o golpe final foi SEU (`B.abate.porMim`, preenchido no laço do turno).
     Sem `B.abate` o inimigo caiu de veneno/armadilha/recuo: a equipe venceu, mas não há golpe pra creditar. */
  registrarAbate(S, { porMim: !!B.abate?.porMim, tiposDoAlvo: E.data.types, minhaEspecie: P.data.speciesName, golpe: B.abate?.golpe, modo: dificuldadeDe(S) });
  B.abate = null;
  await say(`${nm(P)} ganhou ${xp} de XP${money ? ` e ₽${money}` : ''}.${gained.length ? ' ' + gained.join(', ') + '.' : ''}`);
  await gainExp(xp);
  // aliados em pé ganham o mesmo XP e EVs (como o Exp. Share dos jogos novos)
  for (const A of vivos(emCampo()).filter(m => m !== P)) { // quem está descansando não ganha XP
    for (const [s, add] of ganhoDeEVs(A.evs, E.data.effort)) A.evs[s] += add;
    await say(`${nm(A)} ganhou ${xp} de XP.`, 'muted');
    await gainExpAliado(A, xp);
  }
  if (T && T.atual < T.equipe.length - 1) {
    T.atual++; B.enemy = T.equipe[T.atual]; registrarVisto(B.enemy); render();
    await say(T.lendarios ? `Outro lendário surge: <b>${esc(fmt(B.enemy.name))}</b> (Nv. ${B.enemy.level})!${B.enemy.shiny ? ' ✨ Shiny!' : ''}`
      : `${esc(T.nome)} envia <b>${esc(fmt(B.enemy.name))}</b> (Nv. ${B.enemy.level})!${B.enemy.shiny ? ' ✨ Um shiny!' : ''}`, 'enc');
    await aplicarArmadilhas(B.enemy, CTX); // Stealth Rock e cia. pegam quem entra
    await anunciarQuedas();
    // caiu só com as armadilhas: resolve como qualquer derrota (XP e o próximo da fila)
    if (B.enemy.hp <= 0) { await say(`${nm(B.enemy)} caiu antes mesmo de lutar!`, 'hit'); return win(); }
    await intimidar(B.enemy, true);
    return;
  }
  if (B.lendarios) { await vencerGen(); return; }
  if (B.evento) { await vencerEvento(); return; }
  if (B.chefe && !S.chefes?.[B.chefe]) {
    const premio = premioChefe(E.level) * mult, z = ZONES.find(x => x.id === B.chefe), evo = pick(ITENS_EVO_ACHADOS);
    (S.chefes ||= {})[B.chefe] = true;
    S.money += premio; S.bag['rare-candy'] = (S.bag['rare-candy'] || 0) + 1; S.bag[evo] = (S.bag[evo] || 0) + 1;
    await say(`🏆 Você derrotou o Alfa de ${esc(z?.name || B.chefe)}! Prêmio: ₽${premio}, 1 Rare Candy e 1 ${ITEMS[evo].name} (item de evolução).`, 'level');
  }
  await depoisDaVitoria();
  if (T) {
    const premio = premioTreinador(T.equipe) * mult;
    S.money += premio; S.treinadoresVencidos = (S.treinadoresVencidos || 0) + 1;
    await say(`Você derrotou ${esc(T.nome)}! Na fuga, deixou cair ₽${premio}.`, 'good');
  }
  endBattle();
}
// Fim de uma vitória (antes de endBattle zerar m.vol): +1 de vínculo pra quem lutou, e evoluções que dependem do
// que aconteceu NESTA batalha (evolucao.js 'pos-batalha': Sirfetch'd com 3 críticos, Runerigus que aguentou 49 de dano)
async function depoisDaVitoria() {
  for (const M of vivos(emCampo())) {
    ganharFelicidade(M, 1);
    if ((M.vol?.criticos || 0) >= 3 || (M.vol?.danoSofrido || 0) >= 49) await checkEvolution(M, { gatilho: 'pos-batalha' });
  }
}
// evolução que a rede deixou pendente tenta de novo assim que a batalha termina
const retomarEvolucoes = () => verificarEvolucoesPendentes().catch(e => console.error(e));
// Venceu os lendários: a Gen está fechada (S.gensVencidas). Modo com `fimNaGen` (Roguelike) = a run termina em
// vitória e o mapa seguinte libera pras próximas runs; nos outros, você escolhe o próximo mapa (telaEscolherGen).
async function vencerGen() {
  const S = G.S, B = G.B, g = genDe(S), regiao = dadosDaGen(g).regiao, premio = premioChefe(B.enemy.level) * 3;
  (S.chefes ||= {})[B.chefe] = true;
  if (!(S.gensVencidas ||= []).includes(g)) S.gensVencidas.push(g);
  S.money += premio;
  await say(`🏆 Você venceu os lendários de ${regiao}! A Gen ${g} está fechada. Prêmio: ₽${premio}.`, 'level');
  endBattle();
  if (DIFICULDADES[dificuldadeDe(S)].fimNaGen) {
    // A vitória fica GRAVADA no save agora (não no fim da run): quem escolhe seguir no Santuário e morre lá termina
    // em derrota, mas a Gen vencida continua contando pro desbloqueio do mapa seguinte (mapas.gensLiberadasRoguelike).
    S.genVencida = g;
    await say(g < TOTAL_GENS ? `Vitória garantida: o mapa da Gen ${g + 1} está liberado pras próximas runs.` : 'Vitória garantida: você fechou a última Gen!', 'level');
    const santuario = rotasDaGen(g).find(z => z.posVitoria);
    const seguir = santuario && await ask(
      `O 🏛 ${esc(santuario.name)} acabou de abrir: lá vive a Gen ${g} inteira — os iniciais, os lendários, os míticos e as formas regionais.<br>Encerrar a run agora, ou continuar explorando por sua conta e risco?`,
      [{ label: 'Encerrar a run (vitória)', value: false }, { label: `Continuar no ${esc(santuario.name)}`, value: true, ghost: true }]);
    if (!seguir) { encerrarJornada('venceu', { genVencida: g }); return; }
    S.aposVitoria = true; S.zone = santuario.id;
    await say(`Você segue em frente. Se desmaiar aqui, a run acaba em derrota — mas a Gen ${g} continua fechada e liberada. Dá pra encerrar em vitória quando quiser, pelo botão na tela da rota.`, 'level');
    save(); render();
    return;
  }
  /* Fora do Roguelike, fechar a Gen ENCERRA a jornada por padrão: o Pokémon se aposenta como campeão daquele mapa,
     a jornada é pontuada e entra na carreira, e a próxima começa do zero — outro Pokémon, nível 5, mapa nos níveis
     normais. Seguir com o MESMO Pokémon continua possível (era o comportamento antigo, e é como se chegava a Hoenn
     começando no nível 90), mas agora é escolha explícita e vale menos pontos: cada continuação tira 20% da
     pontuação final (regras.multContinuacao), porque chegar num mapa novo já forte é mais fácil. */
  S.genVencida = g;
  const prox = g < TOTAL_GENS ? g + 1 : null;
  const seguir = await ask(
    `Você fechou a Gen ${g}. O que ${nm(P)} faz agora?`,
    [{ label: `🏁 Encerrar aqui — ${esc(rotulo(P))} se aposenta campeão${prox ? ` e você começa outra jornada na Gen ${prox}` : ''}`, value: false },
     { label: `Seguir com ${esc(rotulo(P))} pro próximo mapa (vale ${Math.round((1 - 0.8) * 100)}% menos pontos)`, value: true, ghost: true }],
    `<div class="mcard">Recomeçar é o caminho normal: você escolhe outro Pokémon, no nível 5, e o mapa novo volta aos níveis dele.
      Seguir leva sua equipe e sua mochila, mas o mapa novo se ajusta ao seu nível — e a pontuação cai.</div>`);
  if (!seguir) { encerrarJornada('venceu', { genVencida: g }); return; }
  S.continuacoes = (S.continuacoes || 0) + 1;
  S.escolhendoGen = true; // se fechar o jogo agora, a escolha volta ao abrir (main.js abrirJornada)
  save(); telaEscolherGen();
}
// Desmaio: do Médio pra cima (`desmaiosLivres`), depois dos desmaios livres cada um gasta um Revive — sem Revive, Game Over
async function lose() {
  const S = G.S, regra = DIFICULDADES[dificuldadeDe(S)], livres = regra.desmaiosLivres;
  if (EVENTO_SEM_PERMADEATH && G.B?.evento) {   // o chefe da semana te derrubou: não é fim de run nem gasta Revive
    await say(`${nm(S.player)} desmaiou... ${esc(fmt(G.B.enemy.name))} foi forte demais. Dá pra tentar de novo daqui a algumas horas.`, 'hit');
    await say('Derrota de evento não encerra a jornada: você acorda no Centro Pokémon, sem perder nada.', 'muted');
    healFull(); zerarDescontoCentro(); endBattle();
    return;
  }
  S.desmaios = (S.desmaios || 0) + 1;
  await say(`${nm(S.player)} desmaiou...`, 'hit');
  if (regra.permadeath) { await say('No Roguelike não existe segunda chance. A run acabou.', 'hit'); encerrarJornada('desmaiou'); return; }
  if (desmaioPrecisaRevive(S.desmaios, livres)) {
    if (!S.bag.revive) { await say('Não há nenhum Revive na mochila...', 'hit'); encerrarJornada('desmaiou'); return; }
    S.bag.revive--; if (S.bag.revive <= 0) delete S.bag.revive;
    await say(`O Revive da mochila te trouxe de volta! (restam ${S.bag.revive || 0})`, 'good');
  } else if (livres != null) {
    await say(S.desmaios < livres ? `Desmaio ${S.desmaios} de ${livres} livres. Depois disso, cada desmaio gasta um Revive.`
      : 'Esse foi o último desmaio livre. Daqui pra frente, cada desmaio gasta um Revive, e sem Revive é Game Over.', 'status');
  }
  const lost = Math.floor(S.money / 2); S.money -= lost;
  await say(`Você perdeu ₽${lost} e acordou no Centro Pokémon.`);
  healFull(); zerarDescontoCentro(); endBattle();
}
// capturado por treinador: `fimDeJogo` (Hardcore) = acabou; senão foge depois com perdas. `semCaptura` (Fácil/Médio) nunca chega aqui
async function serCapturado() {
  const S = G.S, T = G.B.trainer, P = S.player;
  if (DIFICULDADES[dificuldadeDe(S)].fimDeJogo) {
    await say(`${esc(T.nome)} guarda a bola no cinto. Sua jornada selvagem termina aqui.`, 'hit');
    encerrarJornada('capturado', { cacador: T.nome });
    return;
  }
  const perdeu = Math.floor(S.money / 2), itens = Object.values(S.bag).reduce((a, n) => a + n, 0);
  S.money -= perdeu; S.bag = {};
  const rotas = rotasAtuais(), destinos = rotas.filter(z => zonaLiberada(z, P.level, S) && z.id !== S.zone);
  const z = destinos.length ? pick(destinos) : rotas[0];
  S.zone = z.id; S.capturas = (S.capturas || 0) + 1;
  healFull(); endBattle();
  await say(`${esc(T.nome)} levou você embora... Dias depois, você força a bola a abrir e foge.`, 'status');
  await say(`Você perdeu ₽${perdeu}${itens ? ` e os ${itens} itens da mochila` : ''}, e acordou em ${z.name}.`, 'hit');
}
/* A Mega dura até o fim da batalha. `desfazerMega` é chamado pra TODO mundo do seu lado (quem não megaevoluiu
   é ignorado): é mais seguro varrer a equipe do que lembrar quem virou. Sem isto o Pokémon ficaria Mega pra
   sempre — `M.data` vai junto no save. O inimigo some com a batalha, não precisa desfazer. */
export function endBattle() {
  G.B = null; G.mode = 'explore'; G.panel = 'main';
  for (const m of ladoJogador()) { desfazerMega(m); desfazerTera(m); desfazerDynamax(m); desfazerForma(m); m.vol = freshVol(); }
}

/* ---- batalha em andamento no save (sem fuga por F5) ----
   Recarregar a página apagava a batalha: dava pra escapar de treinador, Alfa ou lendário — e de uma derrota no
   Roguelike — só dando refresh. Agora ela vai junto no save (estado.save) e volta ao abrir o jogo, no mesmo turno.
   `caidos` é um Set (quem já foi anunciado) e não sobrevive ao JSON: volta vazio, no máximo repete um anúncio. */
export const serializarBatalha = B => B ? { ...B, caidos: null, vez: null } : null;
export function restaurarBatalha(b) {
  if (!b?.enemy) return null;
  const B = { ...b, caidos: new Set(), vez: null };
  // o inimigo é o Pokémon atual do treinador: sem isso seriam dois objetos iguais e o dano iria só pra um deles
  if (B.trainer?.equipe?.length) B.enemy = B.trainer.equipe[B.trainer.atual] || B.enemy;
  return B;
}
