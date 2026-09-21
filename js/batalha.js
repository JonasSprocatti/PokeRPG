/* ============ batalha ============ */
// 1×1 contra selvagem ou contra a equipe de um treinador caçador (um Pokémon por vez; o treinador
// pode gastar a vez lançando bola em você). `turn(action)` é o único ponto de entrada da UI: trava `G.busy`, resolve
// jogador + inimigo na ordem certa, residual, vitória/derrota, e sempre salva no `finally`.
// As contas (precisão, fuga, ordem, residual, XP, EVs) moram em regras.js; aqui fica a narração.
import { G, nm, save, dificuldadeDe, SAVE_KEY } from './estado.js';
import { log, say, shake } from './ui.js';
import { render, spriteFrente } from './render.js';
import { changeStats, inflict, healFull } from './efeitos.js';
import { gainExp } from './progressao.js';
import { useItem } from './itens.js';
import { makeMon } from './pokemon.js';
import { telaFim } from './criacao.js';
import { STAT_PT, TC, ABSORB, SELF_TARGETS, STRUGGLE, ZONES, BOLAS, CLASSES_TREINADOR, NOMES_TREINADOR } from './dados.js';
import {
  freshVol, effStat, calcDamage, confDamage, heal, typeEff,
  chanceAcerto, danoResidual, consegueFugir, jogadorAgePrimeiro, xpPorVitoria, ganhoDeEVs,
  premioTreinador, bolaPorNivel, treinadorLancaBola, valorCaptura, balancosDaCaptura
} from './regras.js';
import { loadPokemon, loadSpecies } from './api.js';
import { rand, pick, clamp, esc, fmt, store } from './util.js';

async function statusMove(user, target, move, selfT) {
  const meta = move.meta || {}; let did = false;
  if (meta.heal > 0) {
    did = true;
    if (user.hp >= user.stats.hp) await say(`O HP de ${nm(user)} já está cheio!`);
    else { heal(user, Math.floor(user.stats.hp * meta.heal / 100)); render(); await say(`${nm(user)} recuperou HP.`, 'good'); }
  }
  if (move.stats.length) { did = true; await changeStats(selfT || meta.cat === 'damage+raise' ? user : target, move.stats); }
  if (meta.ailment && meta.ailment !== 'none') {
    did = true;
    if (Math.random() * 100 < (meta.ailChance || 100)) await inflict(selfT ? user : target, meta.ailment, true);
  }
  if (!did) await say('Mas nada aconteceu... (efeito ainda não implementado no protótipo)', 'muted');
}
async function useMove(user, target, move, movedFirst) {
  const U = nm(user), T = nm(target);
  if (user.status === 'sleep') {
    user.sleep--;
    if (user.sleep > 0) { await say(`${U} está dormindo profundamente.`); return; }
    user.status = null; render(); await say(`${U} acordou!`);
  }
  if (user.status === 'freeze') {
    if (Math.random() < 0.2) { user.status = null; render(); await say(`${U} descongelou!`); }
    else { await say(`${U} está congelado!`); return; }
  }
  if (user.status === 'paralysis' && Math.random() < 0.25) { await say(`${U} está paralisado e não consegue se mover!`); return; }
  if (user.vol.flinch) { user.vol.flinch = false; await say(`${U} recuou e não conseguiu atacar!`); return; }
  if (user.vol.conf > 0) {
    user.vol.conf--;
    if (user.vol.conf === 0) await say(`${U} não está mais confuso.`);
    else {
      await say(`${U} está confuso...`);
      if (Math.random() < 1 / 3) { const d = confDamage(user); user.hp = Math.max(0, user.hp - d); render(); shake(user); await say(`Ele se machucou na confusão! (−${d})`, 'hit'); return; }
    }
  }
  if (move.ppLeft !== undefined) move.ppLeft = Math.max(0, move.ppLeft - 1);
  await say(`${U} usou <b style="color:${TC[move.type] || 'inherit'};filter:brightness(.7)">${esc(fmt(move.name))}</b>!`);

  const selfT = SELF_TARGETS.has(move.target), meta = move.meta || {};
  if (!selfT && move.acc != null) {
    if (Math.random() > chanceAcerto(move, user, target)) { await say('Mas errou!'); return; }
  }
  if (move.cls === 'status') { await statusMove(user, target, move, selfT); render(); return; }

  const ab = ABSORB[target.ability];
  if (ab && ab.type === move.type) {
    await say(`A habilidade ${esc(fmt(target.ability))} de ${T} anulou o golpe!`);
    if (ab.heal && target.hp < target.stats.hp) { heal(target, Math.floor(target.stats.hp / 4)); render(); await say(`${T} recuperou HP.`, 'good'); }
    if (target.ability === 'flash-fire') target.vol.flashFire = true;
    return;
  }
  const eff = typeEff(move.type, target.data.types);
  if (eff === 0) { await say(`Não afeta ${T}...`); return; }

  const hits = meta.minHits ? rand(meta.minHits, meta.maxHits || meta.minHits) : 1;
  let total = 0, landed = 0, crit = false;
  for (let i = 0; i < hits && target.hp > 0; i++) {
    const r = calcDamage(user, target, move);
    target.hp = Math.max(0, target.hp - r.dmg); total += r.dmg; landed++; crit ||= r.crit;
  }
  render(); shake(target);
  if (crit) await say('Um golpe crítico!', 'crit');
  if (eff > 1) await say('É super efetivo!', 'good'); else if (eff < 1) await say('Não é muito efetivo...');
  if (hits > 1) await say(`Acertou ${landed} vez${landed > 1 ? 'es' : ''}!`);
  await say(`${T} perdeu ${total} HP.`, 'hit');

  if (meta.drain > 0) { const h = Math.max(1, Math.floor(total * meta.drain / 100)); heal(user, h); render(); await say(`${U} drenou ${h} HP.`, 'good'); }
  else if (meta.drain < 0) { const d = Math.max(1, Math.floor(total * -meta.drain / 100)); user.hp = Math.max(0, user.hp - d); render(); await say(`${U} sofreu ${d} de dano de recuo.`, 'hit'); }
  if (meta.heal > 0 && user.hp > 0) { heal(user, Math.floor(user.stats.hp * meta.heal / 100)); render(); }

  if (move.stats.length && Math.random() * 100 < (meta.statChance || 100)) {
    if (meta.cat === 'damage+raise' && user.hp > 0) await changeStats(user, move.stats);
    else if (meta.cat !== 'damage+raise' && target.hp > 0) await changeStats(target, move.stats);
  }
  if (target.hp > 0) {
    if (meta.ailment && meta.ailment !== 'none' && meta.ailChance > 0 && Math.random() * 100 < meta.ailChance) await inflict(target, meta.ailment);
    if (meta.flinch > 0 && movedFirst && Math.random() * 100 < meta.flinch) target.vol.flinch = true;
  }
}
function chooseEnemyMove(E) {
  const ok = E.moves.filter(m => m.ppLeft > 0);
  return ok.length ? pick(ok) : STRUGGLE;
}
async function residual(m) {
  const d = danoResidual(m);
  if (!d) return;
  m.hp = Math.max(0, m.hp - d); render();
  await say(`${nm(m)} sofreu com ${m.status === 'burn' ? 'a queimadura' : 'o veneno'}. (−${d})`, 'hit');
}

/* ---- início de batalha ---- */
// selvagem: da lista da zona; Fenda Dimensional (sem lista): qualquer um perto do seu nível
function sortearOponente(z) {
  if (z.pool) return { id: pick(z.pool), level: rand(z.min, z.max) };
  return { id: rand(1, 1025), level: clamp(G.S.player.level + rand(-2, 2), 2, 100) };
}
async function novoOponente(z) { const { id, level } = sortearOponente(z); return makeMon(await loadPokemon(id), level); }
function iniciar(B) { G.S.player.vol = freshVol(); G.B = B; G.mode = 'battle'; G.panel = 'moves'; render(); }
// Intimidação ao entrar em campo. Na troca de Pokémon do treinador só o que acabou de entrar dispara
async function intimidar(E, soInimigo = false) {
  const P = G.S.player;
  for (const [a, b] of soInimigo ? [[E, P]] : [[P, E], [E, P]]) if (a.ability === 'intimidate') {
    await say(`A Intimidação de ${nm(a)} assusta o oponente!`);
    await changeStats(b, [{ stat: 'attack', change: -1 }]);
  }
}
export async function startBattle(z) {
  const E = await novoOponente(z);
  iniciar({ enemy: E, turn: 1, runs: 0 });
  await say(`Um <b>${esc(fmt(E.name))}</b> selvagem (Nv. ${E.level}) apareceu!`, 'enc');
  if (E.shiny) await say('✨ Ele brilha! Um Pokémon shiny.', 'level');
  await intimidar(E);
}
// Treinador caçador: 1–3 Pokémon da zona (mais na zona alta), algumas bolas, e quer te capturar
export async function startTrainerBattle(z) {
  const P = G.S.player;
  const nivelRef = z.pool ? z.max : P.level;
  const n = rand(1, Math.min(3, 1 + Math.floor(nivelRef / 15)));
  const [equipe, especie] = await Promise.all([
    Promise.all(Array.from({ length: n }, () => novoOponente(z))),
    loadSpecies(P.data.speciesUrl)
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
async function agirInimigo(ea, E, P, movedFirst) {
  if (ea.bola) { await vez('t'); return lancarBola(P); }
  await vez('e'); await useMove(E, P, ea.move, movedFirst);
}
async function lancarBola(P) {
  const B = G.B, T = B.trainer, bola = BOLAS[T.bola];
  T.bolas--;
  await say(`${esc(T.nome)} lançou uma <b>${bola.nome}</b> em você!`, 'status');
  const real = balancosDaCaptura(valorCaptura(P.hp, P.stats.hp, B.taxaCaptura, bola.mult, P.status));
  const facil = dificuldadeDe(G.S) === 'easy';
  const balancos = facil ? Math.min(real, 3) : real; // Fácil: nunca fecha
  for (let i = 0; i < Math.min(balancos, 3); i++) await say('A bola balança...', 'muted');
  if (balancos >= 4) { B.capturado = true; await say('Clique! A bola se fechou. Você foi capturado...', 'hit'); return; }
  if (facil && real >= 4) await say('Por pouco! Você arrebenta a bola no último segundo. (modo Fácil: você sempre escapa)', 'good');
  else await say('Você se debate e escapa da bola!', 'good');
}
export async function turn(action) {
  if (G.busy || !G.B) return;
  G.busy = true;
  const B = G.B, P = G.S.player, E = B.enemy;
  // item sem efeito cancela o turno sem avançar B.turn — não repetir o divisor na próxima tentativa
  if (B.turnoNoLog !== B.turn) { log(`Turno ${B.turn}`, 'turno'); B.turnoNoLog = B.turn; }
  try {
    if (action.type === 'run') {
      B.runs++;
      await vez('p');
      if (consegueFugir(effStat(P, 'speed'), effStat(E, 'speed'), B.runs, P.ability)) {
        await say('Você fugiu em segurança!'); endBattle(); return;
      }
      await say('Não conseguiu fugir!');
      await agirInimigo(acaoDoInimigo(E, P), E, P, true);
    } else if (action.type === 'item') {
      await vez('p');
      if (!(await useItem(action.id, true))) return;
      G.panel = 'moves';
      await agirInimigo(acaoDoInimigo(E, P), E, P, true);
    } else {
      const pm = action.idx === -1 ? STRUGGLE : P.moves[action.idx];
      const ea = acaoDoInimigo(E, P);
      // bola é item: sai antes de qualquer golpe, como item de treinador nos jogos
      const pFirst = !ea.bola && jogadorAgePrimeiro(pm, ea.move, effStat(P, 'speed'), effStat(E, 'speed'));
      const ordem = pFirst ? ['p', 'e'] : ['e', 'p'];
      for (let i = 0; i < 2; i++) {
        if (P.hp <= 0 || E.hp <= 0 || B.capturado) continue;
        if (ordem[i] === 'p') { await vez('p'); await useMove(P, E, pm, i === 0); }
        else await agirInimigo(ea, E, P, i === 0);
      }
    }
    if (B.capturado) { await serCapturado(); return; }
    if (P.hp > 0 && E.hp > 0) { await vez('fim'); for (const m of [P, E]) await residual(m); }
    P.vol.flinch = E.vol.flinch = false;
    B.turn++;
    if (P.hp <= 0) await lose();
    else if (E.hp <= 0) await win();
  } catch (e) {
    console.error(e); log('Algo deu errado neste turno: ' + esc(e.message), 'hit');
  } finally { B.vez = null; G.busy = false; render(); save(); }
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
  await say(`${nm(P)} ganhou ${xp} de XP${money ? ` e ₽${money}` : ''}.${gained.length ? ' ' + gained.join(', ') + '.' : ''}`);
  await gainExp(xp);
  if (T && T.atual < T.equipe.length - 1) {
    T.atual++; B.enemy = T.equipe[T.atual]; render();
    await say(`${esc(T.nome)} envia <b>${esc(fmt(B.enemy.name))}</b> (Nv. ${B.enemy.level})!${B.enemy.shiny ? ' ✨ Um shiny!' : ''}`, 'enc');
    await intimidar(B.enemy, true);
    return;
  }
  if (T) {
    const premio = premioTreinador(T.equipe);
    S.money += premio; S.treinadoresVencidos = (S.treinadoresVencidos || 0) + 1;
    await say(`Você derrotou ${esc(T.nome)}! Na fuga, deixou cair ₽${premio}.`, 'good');
  }
  endBattle();
}
async function lose() {
  const S = G.S;
  await say(`${nm(S.player)} desmaiou...`, 'hit');
  const lost = Math.floor(S.money / 2); S.money -= lost;
  await say(`Você perdeu ₽${lost} e acordou no Centro Pokémon.`);
  healFull(); endBattle();
}
// capturado por treinador: Difícil = foge depois com perdas; Hardcore = fim de jogo (Fácil nunca chega aqui)
async function serCapturado() {
  const S = G.S, T = G.B.trainer, P = S.player;
  if (dificuldadeDe(S) === 'hardcore') {
    await say(`${esc(T.nome)} guarda a bola no cinto. Sua jornada selvagem termina aqui.`, 'hit');
    const resumo = { nome: P.nick || fmt(P.name), especie: fmt(P.name), nivel: P.level, sprite: spriteFrente(P), vitorias: S.wins || 0, treinadores: S.treinadoresVencidos || 0, cacador: T.nome };
    store.del(SAVE_KEY);
    G.S = null; G.B = null;
    telaFim(resumo);
    return;
  }
  const perdeu = Math.floor(S.money / 2), itens = Object.values(S.bag).reduce((a, n) => a + n, 0);
  S.money -= perdeu; S.bag = {};
  const destinos = ZONES.filter(z => z.pool && z.min <= P.level && z.id !== S.zone);
  const z = destinos.length ? pick(destinos) : ZONES[0];
  S.zone = z.id; S.capturas = (S.capturas || 0) + 1;
  healFull(); endBattle();
  await say(`${esc(T.nome)} levou você embora... Dias depois, você força a bola a abrir e foge.`, 'status');
  await say(`Você perdeu ₽${perdeu}${itens ? ` e os ${itens} itens da mochila` : ''}, e acordou em ${z.name}.`, 'hit');
}
export function endBattle() { G.B = null; G.mode = 'explore'; G.panel = 'main'; G.S.player.vol = freshVol(); G.S.player.vol.flashFire = false; }