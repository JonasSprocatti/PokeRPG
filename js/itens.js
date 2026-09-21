/* ============ itens ============ */
// Mochila (G.S.bag = { idDoItem: qtd }). useItem devolve true se o item foi gasto (em batalha, gasta o turno).
import { G, nm } from './estado.js';
import { say } from './ui.js';
import { render } from './render.js';
import { changeStats } from './efeitos.js';
import { gainExp } from './progressao.js';
import { ITEMS } from './dados.js';
import { heal } from './regras.js';

export const addItem = (k, n) => { G.S.bag[k] = (G.S.bag[k] || 0) + n; };
export async function useItem(id, inBattle) {
  const S = G.S, it = ITEMS[id], P = S.player;
  if (!it || !S.bag[id]) return false;
  if (it.battle && !inBattle) { await say('Esse item só funciona durante uma batalha.'); return false; }
  if (it.heal) {
    if (P.hp >= P.stats.hp) { await say('O HP já está cheio.'); return false; }
    const h = Math.min(it.heal, P.stats.hp - P.hp); S.bag[id]--; heal(P, h); render();
    await say(`Você usou ${it.name}. ${nm(P)} recuperou ${h} HP.`, 'good');
  } else if (it.cure) {
    if (!P.status || !(it.cure === 'all' || it.cure.includes(P.status))) { await say('Não teria efeito agora.'); return false; }
    S.bag[id]--; P.status = null; P.sleep = 0; render();
    await say(`Você usou ${it.name}. ${nm(P)} está curado!`, 'good');
  } else if (it.ether) {
    if (P.moves.every(m => m.ppLeft >= m.pp)) { await say('Os PP já estão cheios.'); return false; }
    S.bag[id]--; P.moves.forEach(m => m.ppLeft = Math.min(m.pp, m.ppLeft + it.ether)); render();
    await say(`Você usou ${it.name}. PP restaurados.`, 'good');
  } else if (it.stage) {
    S.bag[id]--; await say(`Você usou ${it.name}.`);
    await changeStats(P, [{ stat: it.stage, change: 2 }]);
  } else if (it.candy) {
    if (P.level >= 100) { await say('Já está no nível máximo.'); return false; }
    S.bag[id]--; await say(`Você comeu uma ${it.name}.`);
    await gainExp(S.meta.growth[P.level + 1] - P.exp);
  }
  if (S.bag[id] <= 0) delete S.bag[id];
  render(); return true;
}
