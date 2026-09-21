/* ============ batalha ============ */
// 1×1 contra selvagem. `turn(action)` é o único ponto de entrada da UI: trava `G.busy`, resolve
// jogador + inimigo na ordem certa, residual, vitória/derrota, e sempre salva no `finally`.
// As contas (precisão, fuga, ordem, residual, XP, EVs) moram em regras.js; aqui fica a narração.
import { G, nm, save } from './estado.js';
import { log, say, shake } from './ui.js';
import { render } from './render.js';
import { changeStats, inflict, healFull } from './efeitos.js';
import { gainExp } from './progressao.js';
import { useItem } from './itens.js';
import { makeMon } from './pokemon.js';
import { STAT_PT, TC, ABSORB, SELF_TARGETS, STRUGGLE } from './dados.js';
import {
  freshVol, effStat, calcDamage, confDamage, heal, typeEff,
  chanceAcerto, danoResidual, consegueFugir, jogadorAgePrimeiro, xpPorVitoria, ganhoDeEVs
} from './regras.js';
import { loadPokemon } from './api.js';
import { rand, pick, clamp, esc, fmt } from './util.js';

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
  m.hp = Math.max(0, m.hp - Math.max(1, d)); render();
  await say(`${nm(m)} sofreu com ${m.status === 'burn' ? 'a queimadura' : 'o veneno'}. (−${Math.max(1, d)})`, 'hit');
}
export async function startBattle(z) {
  let id, level;
  if (z.pool) { id = pick(z.pool); level = rand(z.min, z.max); }
  else { id = rand(1, 1025); level = clamp(G.S.player.level + rand(-2, 2), 2, 100); }
  const data = await loadPokemon(id);
  const E = await makeMon(data, level);
  G.S.player.vol = freshVol();
  G.B = { enemy: E, turn: 1, runs: 0 }; G.mode = 'battle'; G.panel = 'moves';
  render();
  await say(`Um <b>${esc(fmt(E.name))}</b> selvagem (Nv. ${level}) apareceu!`, 'enc');
  for (const [a, b] of [[G.S.player, E], [E, G.S.player]]) if (a.ability === 'intimidate') {
    await say(`A Intimidação de ${nm(a)} assusta o oponente!`);
    await changeStats(b, [{ stat: 'attack', change: -1 }]);
  }
}
export async function turn(action) {
  if (G.busy || !G.B) return;
  G.busy = true; render();
  const B = G.B, P = G.S.player, E = B.enemy;
  try {
    if (action.type === 'run') {
      B.runs++;
      if (consegueFugir(effStat(P, 'speed'), effStat(E, 'speed'), B.runs, P.ability)) {
        await say('Você fugiu em segurança!'); endBattle(); return;
      }
      await say('Não conseguiu fugir!');
      await useMove(E, P, chooseEnemyMove(E), true);
    } else if (action.type === 'item') {
      if (!(await useItem(action.id, true))) return;
      G.panel = 'moves';
      await useMove(E, P, chooseEnemyMove(E), true);
    } else {
      const pm = action.idx === -1 ? STRUGGLE : P.moves[action.idx];
      const em = chooseEnemyMove(E);
      const pFirst = jogadorAgePrimeiro(pm, em, effStat(P, 'speed'), effStat(E, 'speed'));
      const order = pFirst ? [[P, E, pm], [E, P, em]] : [[E, P, em], [P, E, pm]];
      for (let i = 0; i < 2; i++) {
        const [u, t, m] = order[i];
        if (u.hp <= 0 || t.hp <= 0) continue;
        await useMove(u, t, m, i === 0);
      }
    }
    if (P.hp > 0 && E.hp > 0) for (const m of [P, E]) await residual(m);
    P.vol.flinch = E.vol.flinch = false;
    B.turn++;
    if (P.hp <= 0) await lose();
    else if (E.hp <= 0) await win();
  } catch (e) {
    console.error(e); log('Algo deu errado neste turno: ' + esc(e.message), 'hit');
  } finally { G.busy = false; render(); save(); }
}
async function win() {
  const S = G.S, P = S.player, E = G.B.enemy;
  await say(`${nm(E)} desmaiou!`, 'good');
  const xp = xpPorVitoria(E);
  const gained = [];
  for (const [s, add] of ganhoDeEVs(P.evs, E.data.effort)) { P.evs[s] += add; gained.push(`+${add} EV de ${STAT_PT[s]}`); }
  const money = E.level * rand(8, 14);
  S.money += money; S.wins = (S.wins || 0) + 1;
  await say(`${nm(P)} ganhou ${xp} de XP e ₽${money}.${gained.length ? ' ' + gained.join(', ') + '.' : ''}`);
  await gainExp(xp);
  endBattle();
}
async function lose() {
  const S = G.S;
  await say(`${nm(S.player)} desmaiou...`, 'hit');
  const lost = Math.floor(S.money / 2); S.money -= lost;
  await say(`Você perdeu ₽${lost} e acordou no Centro Pokémon.`);
  healFull(); endBattle();
}
export function endBattle() { G.B = null; G.mode = 'explore'; G.panel = 'main'; G.S.player.vol = freshVol(); G.S.player.vol.flashFire = false; }
