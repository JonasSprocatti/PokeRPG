/* ============ progressão ============ */
// XP → nível, golpes aprendidos por nível e evolução (por nível; outros gatilhos ainda não) — pra você e pros aliados.
// Diferença entre os dois: você escolhe qual golpe esquecer; o aliado troca sozinho o de menor poder.
// A evolução pergunta nos dois casos (é decisão sua deixar o aliado evoluir ou não).
import { G, nm, registrar } from './estado.js';
import { say, ask } from './ui.js';
import { render } from './render.js';
import { API, STATS, STAT_PT, TYPE_PT, CLS_PT } from './dados.js';
import { recalc } from './regras.js';
import { loadMove, loadSpecies, loadPokemon, loadEvo } from './api.js';
import { esc, fmt } from './util.js';

const ehJogador = M => M === G.S.player;

export async function gainExp(xp) {
  const P = G.S.player, GR = G.S.meta.growth;
  P.exp += xp; recalc(P);
  let leveled = false;
  while (P.level < 100 && P.exp >= GR[P.level + 1]) {
    const before = { ...P.stats };
    P.level++; recalc(P); leveled = true; render();
    await say(`<b>${esc(P.nick || fmt(P.name))} subiu para o nível ${P.level}!</b>`, 'level');
    await say(STATS.map(s => `${STAT_PT[s]} +${P.stats[s] - before[s]}`).join(', '), 'muted');
    for (const mv of P.data.learnset.list.filter(m => m.level === P.level)) await aprender(P, mv);
  }
  render();
  if (leveled) await checkEvolution(P);
}
// XP de aliado: sobe de nível pela curva da espécie dele (A.growth) e evolui como você
export async function gainExpAliado(A, xp) {
  if (!A.growth) return;
  A.exp += xp;
  let leveled = false;
  while (A.level < 100 && A.exp >= A.growth[A.level + 1]) {
    A.level++; recalc(A); leveled = true; render();
    await say(`${nm(A)} subiu para o nível ${A.level}!`, 'level');
    for (const ref of A.data.learnset.list.filter(m => m.level === A.level)) await aprender(A, ref);
  }
  render();
  if (leveled) await checkEvolution(A);
}

async function aprender(M, ref) {
  if (M.moves.some(m => m.name === ref.name)) return;
  const mv = await loadMove(ref.url);
  if (M.moves.length < 4) { M.moves.push({ ...mv, ppLeft: mv.pp }); render(); await say(`${nm(M)} aprendeu ${esc(fmt(mv.name))}!`, 'good'); return; }
  if (!ehJogador(M)) {
    // aliado: troca sozinho o golpe de menor poder, e só se o novo for melhor
    const i = M.moves.reduce((mi, m, j, arr) => (m.power || 0) < (arr[mi].power || 0) ? j : mi, 0);
    if ((mv.power || 0) <= (M.moves[i].power || 0)) return;
    const velho = M.moves[i]; M.moves[i] = { ...mv, ppLeft: mv.pp }; render();
    await say(`${nm(M)} esqueceu ${esc(fmt(velho.name))} e aprendeu ${esc(fmt(mv.name))}!`, 'good');
    return;
  }
  const card = `<div class="mcard"><b>${esc(fmt(mv.name))}</b>: ${TYPE_PT[mv.type] || mv.type}, ${CLS_PT[mv.cls]}, poder ${mv.power ?? '—'}, precisão ${mv.acc ?? '—'}, PP ${mv.pp}<br>${esc(mv.desc)}</div>`;
  const c = await ask(`${nm(M)} quer aprender <b>${esc(fmt(mv.name))}</b>, mas já sabe 4 golpes. Esquecer qual?`,
    [...M.moves.map((m, i) => ({ label: `Esquecer ${esc(fmt(m.name))} (${m.power ?? '—'} pod.)`, value: i })), { label: `Não aprender ${esc(fmt(mv.name))}`, value: -1, ghost: true }], card);
  if (c >= 0) { const old = M.moves[c]; M.moves[c] = { ...mv, ppLeft: mv.pp }; render(); await say(`${nm(M)} esqueceu ${esc(fmt(old.name))} e aprendeu ${esc(fmt(mv.name))}!`, 'good'); }
  else await say(`${nm(M)} não aprendeu ${esc(fmt(mv.name))}.`);
}

export function findNode(n, name) { if (n.name === name) return n; for (const c of n.to) { const f = findNode(c, name); if (f) return f; } return null; }
// árvore de evolução: a sua fica em S.meta.evo; a do aliado é buscada na 1ª vez e guardada nele (A.evo, null = não evolui)
async function arvoreDe(M) {
  if (ehJogador(M)) return G.S.meta.evo;
  if (M.evo === undefined) {
    const sp = await loadSpecies(M.data.speciesUrl);
    M.evo = sp.evoUrl ? await loadEvo(sp.evoUrl) : null;
  }
  return M.evo;
}
async function checkEvolution(M) {
  const arvore = await arvoreDe(M); if (!arvore) return;
  const node = findNode(arvore, M.data.speciesName); if (!node) return;
  const opts = node.to.filter(n => n.details.some(d => d.trigger === 'level-up' && d.min_level && d.min_level <= M.level));
  if (!opts.length) return;
  const pergunta = ehJogador(M) ? `Algo está acontecendo com ${nm(M)}... Você sente seu corpo mudar. Deixar evoluir?`
    : `Algo está acontecendo com seu aliado ${nm(M)}... Deixar ele evoluir?`;
  const c = await ask(pergunta, [...opts.map(o => ({ label: `Evoluir para ${esc(fmt(o.name))}`, value: o.name })), { label: ehJogador(M) ? 'Resistir à evolução' : 'Impedir a evolução', value: null, ghost: true }]);
  if (!c) { await say(`${nm(M)} ${ehJogador(M) ? 'resistiu à' : 'não passou pela'} evolução.`); return; }
  await evolve(M, c, arvore);
}
async function evolve(M, speciesName, arvore) {
  // forma do meio (ainda evolui) ou final (não evolui mais): o Roguelike pede 5 ou 10 evoluções pra desbloquear
  const forma = findNode(arvore, speciesName)?.to.length ? 'meio' : 'final';
  const sp = await loadSpecies(`${API}/pokemon-species/${speciesName}/`);
  const data = await loadPokemon(sp.defaultPokemon);
  const oldName = ehJogador(M) ? fmt(M.name) : (M.nick || fmt(M.name)), idx = M.data.abilities.findIndex(a => a.name === M.ability);
  M.id = data.id; M.name = data.name; M.data = data;
  M.ability = (data.abilities[idx] || data.abilities[0]).name;
  recalc(M); render();
  registrar(G.S, 'evolucoes', data.speciesName, data.id); // conta pro Roguelike (5× forma do meio / 10× final)
  (G.S.registro.formas ||= {})[data.speciesName] = forma;
  await say(`Parabéns! ${esc(oldName)} evoluiu para <b>${esc(fmt(data.name))}</b>!`, 'level');
  for (const mv of data.learnset.list.filter(m => m.level === 0 || m.level === M.level)) await aprender(M, mv);
}
