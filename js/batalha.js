/* ============ batalha ============ */
// 1×1 contra selvagem ou contra a equipe de um treinador caçador (um Pokémon por vez; o treinador
// pode gastar a vez lançando bola em você). `turn(action)` é o único ponto de entrada da UI: trava `G.busy`, resolve
// jogador + inimigo na ordem certa, residual, vitória/derrota, e sempre salva no `finally`.
// As contas (precisão, fuga, ordem, residual, XP, EVs) moram em regras.js; aqui fica a narração.
import { G, nm, save, dificuldadeDe, ladoJogador, emCampo, vivos, registrar, registrarVisto, zerarDescontoCentro } from './estado.js';
import { log, say } from './ui.js';
import { render } from './render.js';
import { changeStats, healFull, CTX } from './efeitos.js';
import { usarGolpe, fimDeTurno, fimDaRodada } from './golpe.js';
import { gainExp, gainExpAliado } from './progressao.js';
import { useItem } from './itens.js';
import { oferecer } from './amizade.js';
import { makeMon } from './pokemon.js';
import { encerrarJornada } from './fim.js';
import { STATS, STAT_PT, STRUGGLE, ZONES, BOLAS, CLASSES_TREINADOR, NOMES_TREINADOR, DIFICULDADES } from './dados.js';
import {
  freshVol, effStat, consegueFugir, ordenarAcoes, golpeDoAliado, xpPorVitoria, ganhoDeEVs,
  premioTreinador, bolaPorNivel, treinadorLancaBola, valorCaptura, balancosDaCaptura,
  statsDeChefe, premioChefe, zonaLiberada, desmaioPrecisaRevive
} from './regras.js';
import { verificarMissoes } from './missoes.js';
import { loadPokemon, loadSpecies, pokemonEmCache, idsEmCache } from './api.js';
import { rand, pick, clamp, esc, fmt, offline, erroOffline } from './util.js';

// golpes e fim de turno vêm do motor único (golpe.js), narrados pelo CTX do single player (efeitos.js)
const useMove = (user, target, move, movedFirst) => usarGolpe(user, target, move, movedFirst, CTX);
function chooseEnemyMove(E) {
  const ok = E.moves.filter(m => m.ppLeft > 0);
  return ok.length ? pick(ok) : STRUGGLE;
}
const residual = m => fimDeTurno(m, CTX); // queimadura/veneno + Speed Boost, Shed Skin

/* ---- início de batalha ---- */
// selvagem: da lista da zona; Fenda Dimensional (sem lista): qualquer um perto do seu nível.
// Offline: só entre os que já estão no cache deste navegador (buscados em alguma partida online).
function sortearOponente(z) {
  const off = offline();
  if (z.pool) {
    const pool = off ? z.pool.filter(pokemonEmCache) : z.pool;
    if (!pool.length) throw erroOffline(`📴 Sem internet, e nenhum Pokémon de ${z.name} está salvo neste aparelho ainda. Tente uma zona que você já explorou online.`);
    return { id: pick(pool), level: rand(z.min, z.max) };
  }
  const ids = off ? idsEmCache() : null;
  if (off && !ids.length) throw erroOffline('📴 Sem internet, e nenhum Pokémon está salvo neste aparelho ainda.');
  return { id: off ? pick(ids) : rand(1, 1025), level: clamp(G.S.player.level + rand(-2, 2), 2, 100) };
}
async function novoOponente(z) { const { id, level } = sortearOponente(z); return makeMon(await loadPokemon(id), level); }
function iniciar(B) { for (const m of ladoJogador()) m.vol = freshVol(); G.B = { caidos: new Set(), ...B }; G.mode = 'battle'; G.panel = 'moves'; registrarVisto(B.enemy); render(); }
// Intimidação ao entrar em campo: cada um do seu lado com Intimidate baixa o inimigo; o do inimigo baixa todo o seu lado.
// Na troca de Pokémon do treinador só o que acabou de entrar dispara.
async function intimidar(E, soInimigo = false) {
  const lado = vivos(emCampo());
  const pares = [...(soInimigo ? [] : lado.map(a => [a, [E]])), [E, lado]];
  for (const [a, alvos] of pares) if (a.ability === 'intimidate') {
    await say(`A Intimidação de ${nm(a)} assusta o oponente!`);
    for (const b of alvos) await changeStats(b, [{ stat: 'attack', change: -1 }], a); // Clear Body & cia. impedem
  }
}
export async function startBattle(z) {
  const E = await novoOponente(z);
  iniciar({ enemy: E, turn: 1, runs: 0 });
  await say(`Um <b>${esc(fmt(E.name))}</b> selvagem (Nv. ${E.level}) apareceu!`, 'enc');
  if (E.shiny) await say('✨ Ele brilha! Um Pokémon shiny.', 'level');
  await intimidar(E);
}
// Alfa da zona: IVs perfeitos + statsDeChefe (HP ×2, resto ×1,3). Não aceita petisco; dá pra fugir.
export async function startBossBattle(z) {
  const c = z.chefe, max = Object.fromEntries(STATS.map(s => [s, 31]));
  if (offline() && !pokemonEmCache(c.id)) throw erroOffline(`📴 Sem internet: o Alfa de ${z.name} ainda não está salvo neste aparelho. Desafie ele online uma vez.`);
  const E = await makeMon(await loadPokemon(c.id), c.nivel, { ivs: max });
  E.stats = statsDeChefe(E.stats); E.hp = E.stats.hp; E.chefe = z.id;
  iniciar({ enemy: E, turn: 1, runs: 0, chefe: z.id });
  await say(`⚔ O chão treme. <b>${esc(fmt(E.name))} Alfa</b> (Nv. ${E.level}) guarda ${esc(z.name)}!`, 'enc');
  await say('Alfas são muito mais fortes que o normal: o dobro de HP e 30% a mais em todo o resto.', 'muted');
  if (E.shiny) await say('✨ E ele brilha! Um Alfa shiny.', 'level');
  await intimidar(E);
}
// Treinador caçador: 1–3 Pokémon da zona (mais na zona alta), algumas bolas, e quer te capturar
export async function startTrainerBattle(z) {
  const P = G.S.player;
  const nivelRef = z.pool ? z.max : P.level;
  const n = rand(1, Math.min(3, 1 + Math.floor(nivelRef / 15)));
  const [equipe, especie] = await Promise.all([
    Promise.all(Array.from({ length: n }, () => novoOponente(z))),
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
  const permadeath = DIFICULDADES[dificuldadeDe(G.S)].permadeath;
  for (const A of [...(G.S.aliados || [])]) if (A.hp <= 0 && !G.B.caidos.has(A)) {
    G.B.caidos.add(A);
    if (!permadeath) { await say(`${nm(A)} desmaiou!`, 'hit'); continue; }
    // Roguelike: aliado que cai é perdido na hora (sai da equipe; nem Revive nem Centro trazem de volta)
    const nome = nm(A);
    G.S.aliados.splice(G.S.aliados.indexOf(A), 1); G.abertos.clear();
    render();
    await say(`${nome} desmaiou... e não vai voltar. Aliado perdido pra sempre.`, 'hit');
  }
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
    if (action.type === 'run') {
      B.runs++;
      await vez('p');
      if (consegueFugir(effStat(P, 'speed'), effStat(E, 'speed'), B.runs, P.ability)) {
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

    // 2) golpes do turno: você (se escolheu golpe), cada aliado em pé e o lado inimigo, por prioridade e velocidade.
    //    Bola do treinador é item: prioridade máxima, sai antes de qualquer golpe.
    const acoes = [];
    if (pm) acoes.push({ quem: P, golpe: pm, prio: pm.priority || 0, vel: effStat(P, 'speed') });
    // aliados em campo agem pela ordem que você deu (golpeDoAliado); "Não atacar"/sem golpe válido = fica parado
    for (const A of vivos(emCampo()).filter(m => m !== P)) {
      const d = golpeDoAliado(A.ordem || 'livre', A.moves, A.data.types, E.data.types);
      if (d.parado) { acoes.push({ quem: A, parado: d.parado, prio: 0, vel: effStat(A, 'speed') }); continue; }
      const g = d.golpe || STRUGGLE;
      acoes.push({ quem: A, golpe: g, prio: g.priority || 0, vel: effStat(A, 'speed') });
    }
    const ea = acaoDoInimigo(E, P);
    acoes.push(ea.bola ? { quem: E, bola: true, prio: 99, vel: 0 } : { quem: E, golpe: ea.move, prio: ea.move.priority || 0, vel: effStat(E, 'speed') });
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
        await vez(idVez(a.quem)); await useMove(a.quem, E, a.golpe, i < posicao(E));
      }
      await anunciarQuedas(); // dano do inimigo ou recuo do próprio golpe
    }
    if (B.capturado) { await serCapturado(); return; }
    if (P.hp > 0 && E.hp > 0) { await vez('fim'); for (const m of [...vivos(emCampo()), E]) await residual(m); await anunciarQuedas(); }
    for (const m of [...ladoJogador(), E]) fimDaRodada(m);  // recuo, Protect e Endure valem só um turno
    B.turn++;
    if (P.hp <= 0) await lose();
    else if (E.hp <= 0) await win();
  } catch (e) {
    console.error(e); log('Algo deu errado neste turno: ' + esc(e.message), 'hit');
  } finally {
    B.vez = null;
    // missões no fim de TODO turno (inclusive fuga/amizade que saem cedo com `return`); G.S some no fim de jogo do Hardcore
    try { await verificarMissoes(); } catch (e) { console.error(e); }
    G.busy = false; render(); save();
  }
}

/* ---- fim de batalha ---- */
async function win() {
  const S = G.S, B = G.B, T = B.trainer, P = S.player, E = B.enemy;
  await say(`${nm(E)} desmaiou!`, 'good');
  const xp = xpPorVitoria(E, !!T);
  const gained = [];
  for (const [s, add] of ganhoDeEVs(P.evs, E.data.effort)) { P.evs[s] += add; gained.push(`+${add} EV de ${STAT_PT[s]}`); }
  const money = T ? 0 : E.level * rand(8, 14); // de treinador, o dinheiro vem todo no prêmio final
  S.money += money; S.wins = (S.wins || 0) + 1;
  S.vitoriasDesdeCentro = (S.vitoriasDesdeCentro || 0) + 1; // desconto do Centro no modo Médio
  registrar(S, 'derrotados', E.data.speciesName, E.id);
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
    await say(`${esc(T.nome)} envia <b>${esc(fmt(B.enemy.name))}</b> (Nv. ${B.enemy.level})!${B.enemy.shiny ? ' ✨ Um shiny!' : ''}`, 'enc');
    await intimidar(B.enemy, true);
    return;
  }
  if (B.chefe && !S.chefes?.[B.chefe]) {
    const premio = premioChefe(E.level), z = ZONES.find(x => x.id === B.chefe);
    (S.chefes ||= {})[B.chefe] = true;
    S.money += premio; S.bag['rare-candy'] = (S.bag['rare-candy'] || 0) + 1;
    await say(`🏆 Você derrotou o Alfa de ${esc(z?.name || B.chefe)}! Prêmio: ₽${premio} e 1 Rare Candy.`, 'level');
  }
  if (T) {
    const premio = premioTreinador(T.equipe);
    S.money += premio; S.treinadoresVencidos = (S.treinadoresVencidos || 0) + 1;
    await say(`Você derrotou ${esc(T.nome)}! Na fuga, deixou cair ₽${premio}.`, 'good');
  }
  endBattle();
}
// Desmaio: do Médio pra cima (`desmaiosLivres`), depois dos desmaios livres cada um gasta um Revive — sem Revive, Game Over
async function lose() {
  const S = G.S, regra = DIFICULDADES[dificuldadeDe(S)], livres = regra.desmaiosLivres;
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
  const destinos = ZONES.filter(z => z.pool && zonaLiberada(z, P.level) && z.id !== S.zone);
  const z = destinos.length ? pick(destinos) : ZONES[0];
  S.zone = z.id; S.capturas = (S.capturas || 0) + 1;
  healFull(); endBattle();
  await say(`${esc(T.nome)} levou você embora... Dias depois, você força a bola a abrir e foge.`, 'status');
  await say(`Você perdeu ₽${perdeu}${itens ? ` e os ${itens} itens da mochila` : ''}, e acordou em ${z.name}.`, 'hit');
}
export function endBattle() { G.B = null; G.mode = 'explore'; G.panel = 'main'; for (const m of ladoJogador()) m.vol = freshVol(); }
