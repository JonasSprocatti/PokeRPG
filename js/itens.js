/* ============ itens ============ */
// Mochila (G.S.bag = { idDoItem: qtd }). useItem devolve true se o item foi gasto (em batalha, gasta o turno).
// Funciona em você e nos aliados: com mais de um alvo possível, pergunta "Usar em quem?" (itemTemEfeito decide quem conta).
import { G, nm, rotulo, ladoJogador } from './estado.js';
import { say, ask } from './ui.js';
import { render } from './render.js';
import { changeStats } from './efeitos.js';
import { gainExp, gainExpAliado } from './progressao.js';
import { ITEMS, ST_SHORT } from './dados.js';
import { heal, itemTemEfeito } from './regras.js';
import { esc } from './util.js';

// mensagem quando ninguém da equipe se beneficiaria
const SEM_EFEITO = { heal: 'O HP já está cheio.', cure: 'Não teria efeito agora.', ether: 'Os PP já estão cheios.', candy: 'Já está no nível máximo.' };

export const addItem = (k, n) => { G.S.bag[k] = (G.S.bag[k] || 0) + n; };
export async function useItem(id, inBattle) {
  const S = G.S, it = ITEMS[id], P = S.player;
  if (!it || !S.bag[id]) return false;
  if (it.battle && !inBattle) { await say('Esse item só funciona durante uma batalha.'); return false; }
  const equipe = ladoJogador();
  const alvos = equipe.filter(M => itemTemEfeito(it, M, M === P || !!M.growth));
  if (!alvos.length) {
    const tipo = Object.keys(SEM_EFEITO).find(k => it[k]);
    await say(tipo ? SEM_EFEITO[tipo] + (equipe.length > 1 ? ' (ninguém da equipe precisa)' : '') : 'Não teria efeito agora.');
    return false;
  }
  let M = alvos[0];
  if (alvos.length > 1) {
    const i = await ask(`Usar <b>${it.name}</b> em quem?`,
      [...alvos.map((A, j) => ({ label: `${esc(rotulo(A))} · Nv. ${A.level} · HP ${A.hp}/${A.stats.hp}${A.status ? ' · ' + ST_SHORT[A.status] : ''}`, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
    if (i < 0) return false;
    M = alvos[i];
  }
  const em = M === P ? '' : ` em ${nm(M)}`;
  S.bag[id]--;
  if (it.heal) {
    const h = Math.min(it.heal, M.stats.hp - M.hp); heal(M, h); render();
    await say(`Você usou ${it.name}${em}. ${nm(M)} recuperou ${h} HP.`, 'good');
  } else if (it.cure) {
    M.status = null; M.sleep = 0; render();
    await say(`Você usou ${it.name}${em}. ${nm(M)} está curado!`, 'good');
  } else if (it.ether) {
    M.moves.forEach(m => m.ppLeft = Math.min(m.pp, m.ppLeft + it.ether)); render();
    await say(`Você usou ${it.name}${em}. PP restaurados.`, 'good');
  } else if (it.stage) {
    await say(`Você usou ${it.name}${em}.`);
    await changeStats(M, [{ stat: it.stage, change: 2 }]);
  } else if (it.candy) {
    await say(M === P ? `Você comeu uma ${it.name}.` : `${nm(M)} comeu uma ${it.name}.`);
    if (M === P) await gainExp(S.meta.growth[M.level + 1] - M.exp);
    else await gainExpAliado(M, M.growth[M.level + 1] - M.exp);
  }
  if (S.bag[id] <= 0) delete S.bag[id];
  render(); return true;
}
