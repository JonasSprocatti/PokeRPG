/* ============ itens ============ */
// Mochila (G.S.bag = { idDoItem: qtd }). useItem devolve true se o item foi gasto (em batalha, gasta o turno).
// Funciona em você e nos aliados: com mais de um alvo possível, pergunta "Usar em quem?" (itemTemEfeito decide quem conta).
import { G, nm, rotulo, ladoJogador, zone } from './estado.js';
import { say, ask } from './ui.js';
import { render } from './render.js';
import { changeStats } from './efeitos.js';
import { gainExp, gainExpAliado, evoluirComItem, aprender } from './progressao.js';
import { ITEMS, ST_SHORT } from './dados.js';
import { heal, itemTemEfeito, golpesParaEnsinar } from './regras.js';
import { esc, fmt } from './util.js';

// mensagem quando ninguém da equipe se beneficiaria
const SEM_EFEITO = { heal: 'O HP já está cheio.', cure: 'Não teria efeito agora.', ether: 'Os PP já estão cheios.', candy: 'Já está no nível máximo.', revive: 'Ninguém está desmaiado. (Em você, o Revive é usado sozinho quando precisar.)' };

export const addItem = (k, n) => { G.S.bag[k] = (G.S.bag[k] || 0) + n; };

// Itens SEGURADOS (segurados.js): cada um da equipe segura no máximo um. Equipar tira da mochila; trocar devolve o
// antigo. O efeito acontece sozinho na batalha (Restos, Orbe da Vida, frutas…).
// `quem`: 'p' (você) ou índice do aliado — quando já se sabe pra quem vai (botão da ficha); senão pergunta
export async function equiparItem(id, inBattle = false, quem = null) {
  const S = G.S, it = ITEMS[id];
  if (inBattle) { await say('Dá pra trocar o item segurado só fora da batalha.'); return false; }
  if (!S.bag[id]) return false;
  const equipe = ladoJogador();
  let M = quem === 'p' ? S.player : quem != null ? S.aliados?.[+quem] : equipe[0];
  if (!M) return false;
  if (quem == null && equipe.length > 1) {
    const i = await ask(`Quem vai segurar <b>${it.name}</b>?`,
      [...equipe.map((A, j) => ({ label: `${esc(rotulo(A))}${A.item ? ` (segurando ${ITEMS[A.item]?.name})` : ''}`, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
    if (i < 0) return false;
    M = equipe[i];
  }
  if (M.item === id) { await say(`${nm(M)} já está segurando ${it.name}.`); return false; }
  if (M.item) { addItem(M.item, 1); await say(`${nm(M)} devolveu ${ITEMS[M.item]?.name || 'o item'} pra mochila.`, 'muted'); }
  M.item = id;
  S.bag[id]--; if (S.bag[id] <= 0) delete S.bag[id];
  render(); await say(`${nm(M)} está segurando <b>${it.name}</b>.`, 'good');
  return true;
}
// Repelentes (mapas.js): o total espanta todo selvagem; o seletivo deixa passar só a espécie que você escolher,
// entre as que vivem na rota atual. Nenhum dos dois mexe em treinador, item, dinheiro ou ambientação.
async function usarRepelente(id) {
  const S = G.S, it = ITEMS[id], z = zone();
  let especie = null;
  if (it.repelente === 'seletivo') {
    const lista = z.pool.filter(p => !p.m);
    const i = await ask(`<b>${it.name}</b>: qual espécie de ${esc(z.name)} NÃO vai ser repelida?`,
      [...lista.map((p, j) => ({ label: esc(fmt(p.n)), value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
    if (i < 0) return false;
    especie = lista[i].n;
  }
  S.repelente = { tipo: it.repelente, passos: it.passos, especie };
  S.bag[id]--; if (S.bag[id] <= 0) delete S.bag[id];
  render();
  await say(especie ? `Você usa ${it.name}. Por ${it.passos} explorações, só <b>${esc(fmt(especie))}</b> aparece por aqui.`
    : `Você usa ${it.name}. Por ${it.passos} explorações, nenhum selvagem chega perto.`, 'good');
  return true;
}
/* Itens de golpe (dados.ITENS_GOLPE): Escama do Coração relembra golpe de NÍVEL que você deixou passar; Disco
   Técnico ensina golpe de MT/tutor/herança, que nunca apareceria subindo de nível. Os dois perguntam em quem e
   qual golpe, e só são gastos se o golpe entrar mesmo no moveset (aprender devolve true).
   O que cada um oferece sai do cache da espécie (api.slimPokemon): `learnset.list` e `learnset.extras`. */
async function ensinarGolpe(id) {
  const S = G.S, it = ITEMS[id];
  const equipe = ladoJogador().filter(M => M.hp > 0);
  let M = equipe[0];
  if (equipe.length > 1) {
    const i = await ask(`Usar <b>${it.name}</b> em quem?`,
      [...equipe.map((A, j) => ({ label: `${esc(rotulo(A))} · Nv. ${A.level} · ${A.moves.map(m => esc(fmt(m.name))).join(', ')}`, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
    if (i < 0) return false;
    M = equipe[i];
  }
  const lista = golpesParaEnsinar(it.ensina, M);
  if (!lista) { await say(`Não deu pra consultar a Pokédex de ${nm(M)} agora. Conecte uma vez e tente de novo — depois disso funciona offline.`, 'muted'); return false; }
  if (!lista.length) {
    await say(it.ensina === 'relembrar'
      ? `${nm(M)} não tem nenhum golpe de nível pra relembrar: você já sabe tudo o que dava pra aprender até o nível ${M.level}.`
      : `A Pokédex não lista nenhum golpe novo de MT, tutor ou herança pra ${nm(M)} — ele já sabe todos os que poderia.`, 'muted');
    return false;
  }
  const i = await ask(`<b>${it.name}</b> em ${nm(M)}: qual golpe?`,
    [...lista.map((m, j) => ({ label: `${esc(fmt(m.name))}${m.level ? ` (nível ${m.level})` : m.metodo === 'egg' ? ' (herança)' : m.metodo === 'tutor' ? ' (tutor)' : ' (MT)'}`, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
  if (i < 0) return false;
  if (!await aprender(M, lista[i], true)) return false;   // desistiu de esquecer um golpe: o item não é gasto
  S.bag[id]--; if (S.bag[id] <= 0) delete S.bag[id];
  if (it.ensina === 'pokedex') S.discosUsados = (S.discosUsados || 0) + 1; // o próximo Disco custa mais (regras.precoItem)
  render();
  return true;
}

// devolve pra mochila o item que alguém está segurando (botão da ficha)
export async function tirarItem(M) {
  if (!M?.item) return;
  const nome = ITEMS[M.item]?.name || 'o item';
  addItem(M.item, 1); M.item = null;
  render(); await say(`${nm(M)} guardou ${nome} na mochila.`, 'muted');
}
export async function useItem(id, inBattle) {
  const S = G.S, it = ITEMS[id], P = S.player;
  if (!it || !S.bag[id]) return false;
  if (it.battle && !inBattle) { await say('Esse item só funciona durante uma batalha.'); return false; }
  // itens de evolução (evolucao.js): pedras/maçãs/etc. e o Cabo de Conexão — fora de batalha
  if (it.evo || it.troca) {
    if (inBattle) { await say('Não dá pra evoluir no meio de uma batalha.'); return false; }
    return evoluirComItem(id);
  }
  if (it.segurar) { await say(`${it.name} fica na mochila: é gasto sozinho quando a evolução que pede ele acontecer.`, 'muted'); return false; }
  if (it.segurado) { await equiparItem(id, inBattle); return false; } // item pra segurar: não é gasto agora
  if (it.repelente) { if (inBattle) { await say('Repelente só funciona explorando.'); return false; } return usarRepelente(id); }
  if (it.ensina) { if (inBattle) { await say('Dá pra mexer nos golpes só fora da batalha.'); return false; } return ensinarGolpe(id); }
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
  } else if (it.revive) {
    M.hp = Math.max(1, Math.floor(M.stats.hp / 2)); M.status = null; M.sleep = 0;
    G.B?.caidos?.delete(M); // em batalha: se cair de novo, anuncia de novo
    render();
    await say(`Você usou ${it.name}${em}. ${nm(M)} se levanta com metade do HP!`, 'good');
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
