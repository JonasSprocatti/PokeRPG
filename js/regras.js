/* ============ regras ============ */
// Fórmulas puras (recebem dado, devolvem dado). Sem DOM, sem rede, sem estado global:
// importável direto no Node — é o que tests/regras.test.js cobre.
// A aleatoriedade usa Math.random/rand direto; os testes substituem Math.random quando precisam.
import { API, STATS, STAT_PT, CHART, NATURES, PINCH } from './dados.js';
import { rand, clamp, fmt } from './util.js';

export function typeEff(atk, defs) {
  const c = CHART[atk]; if (!c) return 1;
  return defs.reduce((f, d) => f * ((c.im || []).includes(d) ? 0 : c.se.includes(d) ? 2 : c.nv.includes(d) ? 0.5 : 1), 1);
}

export const natureMod = (n, s) => (NATURES[n] || [])[0] === s ? 1.1 : (NATURES[n] || [])[1] === s ? 0.9 : 1;
export const natureLabel = n => { const [u, d] = NATURES[n] || []; return fmt(n) + (u ? ` (+${STAT_PT[u]} −${STAT_PT[d]})` : ' (neutra)'); };

// golpes de dano fixo (ignoram ataque/defesa/tipo)
export const FIXED = {
  'seismic-toss': u => u.level, 'night-shade': u => u.level, 'dragon-rage': () => 40, 'sonic-boom': () => 20,
  'super-fang': (u, t) => Math.floor(t.hp / 2), psywave: u => Math.floor(u.level * rand(50, 150) / 100)
};

export function calcStats(m) {
  const out = {};
  for (const s of STATS) {
    const core = Math.floor((2 * m.data.base[s] + m.ivs[s] + Math.floor(m.evs[s] / 4)) * m.level / 100);
    out[s] = s === 'hp' ? (m.data.base.hp === 1 ? 1 : core + m.level + 10) : Math.floor((core + 5) * natureMod(m.nature, s));
  }
  return out;
}
export function recalc(m) { const old = m.stats.hp; m.stats = calcStats(m); m.hp = clamp(m.hp + (m.stats.hp - old), 0, m.stats.hp); }
export const freshVol = () => ({ stages: { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0 }, conf: 0, flinch: false, flashFire: false });
export const stageMul = n => n >= 0 ? (2 + n) / 2 : 2 / (2 - n);
export function effStat(m, stat, crit = false, attacking = true) {
  let st = m.vol?.stages[stat] || 0;
  if (crit) { if (attacking && st < 0) st = 0; if (!attacking && st > 0) st = 0; }
  let v = m.stats[stat] * stageMul(st);
  if (stat === 'speed' && m.status === 'paralysis') v *= 0.5;
  if (stat === 'attack' && m.status && m.ability === 'guts') v *= 1.5;
  return Math.max(1, Math.floor(v));
}
export function defaultMoves(list, level) {
  const avail = list.filter(m => m.level <= level), seen = new Set(), out = [];
  for (let i = avail.length - 1; i >= 0 && out.length < 4; i--) if (!seen.has(avail[i].name)) { seen.add(avail[i].name); out.push(avail[i]); }
  if (!out.length && list.length) out.push(list[0]);
  if (!out.length) out.push({ name: 'tackle', url: `${API}/move/33/`, level: 1 });
  return out.reverse();
}
export function calcDamage(u, t, move) {
  if (FIXED[move.name]) return { dmg: Math.max(1, FIXED[move.name](u, t)), crit: false };
  const power = move.power || 60, phys = move.cls === 'physical';
  const crit = Math.random() < [1 / 24, 1 / 8, 1 / 2, 1][Math.min(3, move.meta?.crit || 0)];
  const A = effStat(u, phys ? 'attack' : 'special-attack', crit, true);
  const D = effStat(t, phys ? 'defense' : 'special-defense', crit, false);
  const base = Math.floor(Math.floor(Math.floor(2 * u.level / 5 + 2) * power * A / D) / 50) + 2;
  let mod = (crit ? 1.5 : 1) * rand(85, 100) / 100;
  if (u.data.types.includes(move.type)) mod *= u.ability === 'adaptability' ? 2 : 1.5;
  mod *= typeEff(move.type, t.data.types);
  if (phys && u.status === 'burn' && u.ability !== 'guts') mod *= 0.5;
  if (PINCH[u.ability] === move.type && u.hp <= u.stats.hp / 3) mod *= 1.5;
  if (u.vol.flashFire && move.type === 'fire') mod *= 1.5;
  return { dmg: Math.max(1, Math.floor(base * mod)), crit };
}
export function confDamage(u) {
  const A = effStat(u, 'attack'), D = effStat(u, 'defense');
  return Math.max(1, Math.floor(Math.floor(Math.floor(2 * u.level / 5 + 2) * 40 * A / D) / 50) + 2);
}
export const heal = (m, h) => { m.hp = Math.min(m.stats.hp, m.hp + h); };

/* ---- extraídas de dentro da batalha (antes eram contas inline em useMove/turn/win/inflict/residual) ---- */

// probabilidade de acertar: precisão do golpe × estágio de precisão de quem usa contra evasão do alvo
export function chanceAcerto(move, user, target) {
  const n = clamp((user.vol.stages.accuracy || 0) - (target.vol.stages.evasion || 0), -6, 6);
  return move.acc / 100 * (n >= 0 ? (3 + n) / 3 : 3 / (3 - n));
}

// imunidades de tipo a status (Elétrico não paralisa, Fogo não queima, Gelo não congela, Venenoso/Aço não envenenam)
export function imuneAoStatus(tipos, ail) {
  return (ail === 'paralysis' && tipos.includes('electric')) || (ail === 'burn' && tipos.includes('fire')) || (ail === 'freeze' && tipos.includes('ice')) || (ail === 'poison' && (tipos.includes('poison') || tipos.includes('steel')));
}

// dano de queimadura (1/16) e veneno (1/8) no fim do turno; 0 = nada acontece
export function danoResidual(m) {
  return m.status === 'burn' ? Math.floor(m.stats.hp / 16) : m.status === 'poison' ? Math.floor(m.stats.hp / 8) : 0;
}

// fuga: Run Away ou ser mais rápido garante; senão a chance sobe 30/256 a cada tentativa
export function consegueFugir(velP, velE, tentativas, habilidade, sorte = Math.random()) {
  return habilidade === 'run-away' || velP >= velE || sorte * 256 < Math.floor(velP * 128 / velE) + 30 * tentativas;
}

// true = o jogador age primeiro. Prioridade do golpe decide; empate de prioridade vai pela velocidade; empate total é moeda
export function jogadorAgePrimeiro(pm, em, velP, velE, sorte = Math.random()) {
  if ((pm.priority || 0) !== (em.priority || 0)) return (pm.priority || 0) > (em.priority || 0);
  return velP === velE ? sorte < 0.5 : velP > velE;
}

export const xpPorVitoria = E => Math.max(1, Math.floor(E.data.baseExp * E.level / 7));

// EVs ganhos ao derrotar um Pokémon: teto de 252 por atributo e 510 no total. Devolve [[stat, qtd]], não muta `evs`
export function ganhoDeEVs(evs, effort) {
  let total = STATS.reduce((a, s) => a + evs[s], 0);
  const out = [];
  for (const [s, v] of Object.entries(effort)) {
    const add = Math.min(v, 252 - evs[s], 510 - total);
    if (add > 0) { out.push([s, add]); total += add; }
  }
  return out;
}
