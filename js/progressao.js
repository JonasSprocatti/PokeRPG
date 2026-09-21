/* ============ progressão ============ */
// XP → nível, golpes aprendidos por nível e evolução (por nível; outros gatilhos ainda não).
import { G, nm, registrar } from './estado.js';
import { say, ask } from './ui.js';
import { render } from './render.js';
import { API, STATS, STAT_PT, TYPE_PT, CLS_PT } from './dados.js';
import { recalc } from './regras.js';
import { loadMove, loadSpecies, loadPokemon } from './api.js';
import { esc, fmt } from './util.js';

export async function gainExp(xp) {
  const P = G.S.player, GR = G.S.meta.growth;
  P.exp += xp; recalc(P);
  let leveled = false;
  while (P.level < 100 && P.exp >= GR[P.level + 1]) {
    const before = { ...P.stats };
    P.level++; recalc(P); leveled = true; render();
    await say(`<b>${esc(P.nick || fmt(P.name))} subiu para o nível ${P.level}!</b>`, 'level');
    await say(STATS.map(s => `${STAT_PT[s]} +${P.stats[s] - before[s]}`).join(', '), 'muted');
    for (const mv of P.data.learnset.list.filter(m => m.level === P.level)) await learnMove(mv);
  }
  render();
  if (leveled) await checkEvolution();
}
async function learnMove(ref) {
  const P = G.S.player;
  if (P.moves.some(m => m.name === ref.name)) return;
  const mv = await loadMove(ref.url);
  if (P.moves.length < 4) { P.moves.push({ ...mv, ppLeft: mv.pp }); render(); await say(`${nm(P)} aprendeu ${esc(fmt(mv.name))}!`, 'good'); return; }
  const card = `<div class="mcard"><b>${esc(fmt(mv.name))}</b>: ${TYPE_PT[mv.type] || mv.type}, ${CLS_PT[mv.cls]}, poder ${mv.power ?? '—'}, precisão ${mv.acc ?? '—'}, PP ${mv.pp}<br>${esc(mv.desc)}</div>`;
  const c = await ask(`${nm(P)} quer aprender <b>${esc(fmt(mv.name))}</b>, mas já sabe 4 golpes. Esquecer qual?`,
    [...P.moves.map((m, i) => ({ label: `Esquecer ${esc(fmt(m.name))} (${m.power ?? '—'} pod.)`, value: i })), { label: `Não aprender ${esc(fmt(mv.name))}`, value: -1, ghost: true }], card);
  if (c >= 0) { const old = P.moves[c]; P.moves[c] = { ...mv, ppLeft: mv.pp }; render(); await say(`${nm(P)} esqueceu ${esc(fmt(old.name))} e aprendeu ${esc(fmt(mv.name))}!`, 'good'); }
  else await say(`${nm(P)} não aprendeu ${esc(fmt(mv.name))}.`);
}
// XP de aliado: sobe de nível pela curva da espécie dele (A.growth) e aprende golpes sem perguntar
// (com 4 golpes, esquece o de menor poder). Aliado ainda não evolui — fica pra depois.
export async function gainExpAliado(A, xp) {
  if (!A.growth) return;
  A.exp += xp;
  while (A.level < 100 && A.exp >= A.growth[A.level + 1]) {
    A.level++; recalc(A); render();
    await say(`${nm(A)} subiu para o nível ${A.level}!`, 'level');
    for (const ref of A.data.learnset.list.filter(m => m.level === A.level)) {
      if (A.moves.some(m => m.name === ref.name)) continue;
      const mv = await loadMove(ref.url);
      if (A.moves.length < 4) { A.moves.push({ ...mv, ppLeft: mv.pp }); await say(`${nm(A)} aprendeu ${esc(fmt(mv.name))}!`, 'good'); continue; }
      const i = A.moves.reduce((mi, m, j, arr) => (m.power || 0) < (arr[mi].power || 0) ? j : mi, 0);
      if ((mv.power || 0) <= (A.moves[i].power || 0)) continue; // não troca por golpe pior
      const velho = A.moves[i]; A.moves[i] = { ...mv, ppLeft: mv.pp };
      await say(`${nm(A)} esqueceu ${esc(fmt(velho.name))} e aprendeu ${esc(fmt(mv.name))}!`, 'good');
    }
  }
  render();
}
export function findNode(n, name) { if (n.name === name) return n; for (const c of n.to) { const f = findNode(c, name); if (f) return f; } return null; }
async function checkEvolution() {
  const S = G.S, P = S.player; if (!S.meta.evo) return;
  const node = findNode(S.meta.evo, P.data.speciesName); if (!node) return;
  const opts = node.to.filter(n => n.details.some(d => d.trigger === 'level-up' && d.min_level && d.min_level <= P.level));
  if (!opts.length) return;
  const c = await ask(`Algo está acontecendo com ${nm(P)}... Você sente seu corpo mudar. Deixar evoluir?`,
    [...opts.map(o => ({ label: `Evoluir para ${esc(fmt(o.name))}`, value: o.name })), { label: 'Resistir à evolução', value: null, ghost: true }]);
  if (!c) { await say(`${nm(P)} resistiu à evolução.`); return; }
  await evolve(c);
}
async function evolve(speciesName) {
  const P = G.S.player;
  const sp = await loadSpecies(`${API}/pokemon-species/${speciesName}/`);
  const data = await loadPokemon(sp.defaultPokemon);
  const oldName = fmt(P.name), idx = P.data.abilities.findIndex(a => a.name === P.ability);
  P.id = data.id; P.name = data.name; P.data = data;
  P.ability = (data.abilities[idx] || data.abilities[0]).name;
  recalc(P); render();
  registrar(G.S, 'evolucoes', data.speciesName);
  await say(`Parabéns! ${esc(oldName)} evoluiu para <b>${esc(fmt(data.name))}</b>!`, 'level');
  for (const mv of data.learnset.list.filter(m => m.level === 0 || m.level === P.level)) await learnMove(mv);
}
