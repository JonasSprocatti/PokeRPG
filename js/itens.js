/* ============ itens ============ */
// Mochila (G.S.bag = { idDoItem: qtd }). useItem devolve true se o item foi gasto (em batalha, gasta o turno).
// Funciona em você e nos aliados: com mais de um alvo possível, pergunta "Usar em quem?" (itemTemEfeito decide quem conta).
import { G, nm, rotulo, ladoJogador, zone, save } from './estado.js';
import { say, ask, toast } from './ui.js';
import { render } from './render.js';
import { changeStats } from './efeitos.js';
import { gainExp, gainExpAliado, evoluirComItem, aprender } from './progressao.js';
import { ITEMS, ST_SHORT, STATS, STAT_PT } from './dados.js';
import { pokedexDaRota, somarRegistros } from './mapas.js';
import { carregarCarreira } from './carreira.js';
import { heal, itemTemEfeito, golpesParaEnsinar, freshVol, precoVenda, alternarRapido, MAX_RAPIDOS, LADO_VAZIO, recalc, ivsParaMaximizar, habilidadesParaTrocar } from './regras.js';
import { IMPL } from './habilidades.js';
import { guardar, trazer } from './esconderijo.js';
import { usarItemDeRaide } from './boss.js';
import { loadPokemon, loadAbility, syncGet } from './api.js';
import { esc, fmt, offline, pick } from './util.js';

// mensagem quando ninguém da equipe se beneficiaria. As chaves são as marcas do item (dados.ITEMS); as duas
// últimas são VALORES de `treino`, que carrega dois efeitos diferentes numa marca só (ver o `tipo` em useItem).
const SEM_EFEITO = { heal: 'O HP já está cheio.', healPct: 'O HP já está cheio.', cure: 'Não teria efeito agora.', ether: 'Os PP já estão cheios.', candy: 'Já está no nível máximo.', revive: 'Ninguém está desmaiado. (Em você, o Revive é usado sozinho quando precisar.)', evs: 'Os EVs já estão zerados: não há treino pra desfazer.', iv: 'Os 6 IVs já estão no máximo (31). A tampa não teria o que melhorar.', habilidade: 'A espécie tem uma habilidade só: não há pra onde trocar.' };

export const addItem = (k, n) => { G.S.bag[k] = (G.S.bag[k] || 0) + n; };

/* Vender (ou jogar fora, se o item não tem preço de loja): o oposto de addItem. `precoVenda` é regra pura
   (regras.js); aqui só mexe no estado. `qtd` já vem confirmada por pedirQuantidade (ui.js, no modo 'vender');
   nunca vende mais do que a mochila tem. Pedido do usuário: "ter como jogar os itens fora ou vender eles". */
export function venderItem(k, qtd) {
  const n = Math.min(qtd, G.S.bag[k] || 0); if (n <= 0) return 0;
  G.S.bag[k] -= n; if (G.S.bag[k] <= 0) delete G.S.bag[k];
  const total = precoVenda(k, G.S) * n;
  G.S.money += total;
  return total;
}

/* ⚡ Itens rápidos: o atalho na barra de ações. A regra de quantos cabem é pura (regras.alternarRapido); aqui
   só grava e avisa. Guardado na JORNADA (S), não na conta: os itens são da run. */
export function marcarRapido(id) {
  const nova = alternarRapido(G.S.rapidos, id);
  if (!nova) { toast(`Só ${MAX_RAPIDOS} itens rápidos. Tire um antes (⚡ na mochila).`); return; }
  G.S.rapidos = nova;
  toast(nova.includes(id) ? `${ITEMS[id].name} virou item rápido (tecla ${nova.indexOf(id) + 1}).` : `${ITEMS[id].name} saiu dos itens rápidos.`);
  save(); render();
}

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
/* 📦 Esconderijo (esconderijo.js): guardar e trazer aliado fora de batalha. Mora aqui, junto das outras ações
   de equipe, e não em batalha.js — trocar de time no meio da luta seria outra mecânica. */
export async function mexerEsconderijo(qual, i) {
  const S = G.S; if (!S || G.busy || G.mode !== 'explore') return;
  if (qual === 'guardar') {
    const A = guardar(S, i, freshVol);
    if (!A) { await say('O esconderijo está cheio.', 'muted'); return; }
    G.abertos.clear(); render(); save();
    await say(`📦 ${esc(A.nick || fmt(A.name))} vai esperar no esconderijo. Dá pra trazer de volta quando quiser.`);
    return;
  }
  const A = trazer(S, i, freshVol);
  if (!A) { await say('Sua equipe está cheia: guarde alguém antes de trazer.', 'muted'); return; }
  G.abertos.clear(); render(); save();
  await say(`↩ ${esc(A.nick || fmt(A.name))} volta pra equipe!`, 'good');
}

// Repelentes (mapas.js): o total espanta todo selvagem; o seletivo deixa passar só a espécie que você escolher,
// entre as que vivem na rota atual. Nenhum dos dois mexe em treinador, item, dinheiro ou ambientação.
async function usarRepelente(id) {
  const S = G.S, it = ITEMS[id], z = zone();
  let especie = null;
  if (it.repelente === 'seletivo') {
    /* Só espécies que você JÁ ENCONTROU nesta rota. Antes a lista trazia o pool inteiro pelo nome, e virava um
       índice do que ainda faltava descobrir: a Pokédex da rota mostrava "?" e o repelente entregava os nomes —
       estragava a descoberta, que é metade da graça de uma rota nova. Mesmo estado que a Pokédex usa
       (mapas.pokedexDaRota): 'oculto' = nunca enfrentou, e é o que fica de fora daqui. */
    const saber = somarRegistros([...carregarCarreira().jornadas.map(j => j.registro), S.registro]);
    const lista = pokedexDaRota(z, saber).filter(p => !p.mitico && p.estado !== 'oculto');
    if (!lista.length) {
      await say(`Você ainda não conhece ninguém de ${esc(z.name)}. Explore um pouco antes de usar ${it.name} — dá pra escolher só quem você já encontrou.`, 'muted');
      return false;
    }
    const i = await ask(`<b>${it.name}</b>: qual espécie de ${esc(z.name)} NÃO vai ser repelida?<br><small>Só aparecem aqui as que você já encontrou.</small>`,
      [...lista.map((p, j) => ({ label: esc(fmt(p.nome)), value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
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
/* A ficha de cada Pokémon guarda uma CÓPIA dos dados da espécie, tirada quando ele entrou na jornada (S.player.data
   e A.data) — não é lida do cache a cada uso. Então uma jornada começada antes de `learnset.extras` existir NUNCA
   teria a lista de MT/tutor/herança, por mais atualizado que o cache estivesse: foi exatamente por isso que o Disco
   Técnico não fazia nada. Aqui a ficha é atualizada na hora (uma vez, com internet) e o save guarda o resultado. */
async function garantirPokedex(M) {
  if (Array.isArray(M.data?.learnset?.extras)) return true;
  if (offline()) return false;
  try {
    const novo = await loadPokemon(M.id);
    if (Array.isArray(novo?.learnset?.extras)) { M.data = { ...M.data, learnset: novo.learnset }; return true; }
  } catch (e) { console.error(e); }
  return false;
}
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
  if (it.ensina === 'pokedex' && !await garantirPokedex(M)) {
    await say(`Não deu pra consultar a Pokédex de ${nm(M)} agora. O Disco Técnico precisa de internet UMA vez pra buscar a lista de golpes de MT, tutor e herança dessa espécie; depois disso funciona offline.`, 'muted');
    return false;
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
/* Item de raide (dados.ITEMS `raide`, boss.usarItemDeRaide): age no chefe da semana. Só é gasto se funcionou (o motivo da recusa
   vai pro registro). No single player gasta o turno, como qualquer item em batalha. */
async function usarRaide(id) {
  const S = G.S, it = ITEMS[id], E = G.B?.enemy;
  const ladoJogador = (G.B.campo.lados ||= {}).jogador ||= LADO_VAZIO();
  const r = usarItemDeRaide(E, it.raide, ladoJogador);
  if (!r.ok) { await say(r.motivo, 'muted'); return false; }
  S.bag[id]--; if (S.bag[id] <= 0) delete S.bag[id];
  await say(`Você usa <b>${esc(it.name)}</b>!`, 'good');
  for (const e of r.efeitos) if (e.dizer) await say(e.dizer, e.cls || 'status');
  // Relógio de Areia e Fragmento Tera: boss.usarItemDeRaide não sabe QUAL Pokémon usou nem se o Tera já saiu —
  // isso mora no estado do single player (S.player, G.B), então é aqui que se resolve.
  if (r.estagios) await changeStats(S.player, r.estagios.map(([stat, change]) => ({ stat, change })));
  if (r.recarregaTera) G.B.teraUsada = false;
  render(); return true;
}
/* Cápsula de Habilidade: escolher entre as OUTRAS habilidades da espécie (normais e oculta). Mostra as mesmas
   três informações que a tela de criação (criacao.js) mostra na escolha original — nome, descrição e se a
   habilidade tem efeito de verdade: `IMPL` tem 249 das 314, e trocar por uma das outras 65 sem aviso seria
   gastar ₽250.000 em "será ajustado em atualizações futuras". Devolve o nome escolhido, ou null se cancelou. */
async function escolherHabilidade(M) {
  const opcoes = habilidadesParaTrocar(M);
  // a descrição mora no cache da PokéAPI: buscar ANTES de perguntar, senão a escolha é às cegas. Offline cai no genérico.
  await Promise.all(opcoes.map(a => loadAbility(a).catch(() => null)));
  const i = await ask(`Qual habilidade <b>${nm(M)}</b> vai ter agora?<br><small class="muted">A atual é <b>${esc(fmt(M.ability))}</b>.</small>`,
    [...opcoes.map((a, j) => ({
      value: j,
      label: `${esc(fmt(a.name))}${a.hidden ? ' (oculta)' : ''}${IMPL.has(a.name) ? '' : ' — sem efeito em batalha ainda'}<br><small>${esc(syncGet('ab:' + a.name)?.effect || 'Sem descrição.')}</small>`
    })), { label: 'Cancelar', value: -1, ghost: true }]);
  return i < 0 ? null : opcoes[i].name;
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
  if (it.raide) return usarRaide(id);      // itens de raide: só na luta do chefe da semana
  if (it.segurar) { await say(`${it.name} fica na mochila: é gasto sozinho quando a evolução que pede ele acontecer.`, 'muted'); return false; }
  if (it.segurado) { await equiparItem(id, inBattle); return false; } // item pra segurar: não é gasto agora
  if (it.repelente) { if (inBattle) { await say('Repelente só funciona explorando.'); return false; } return usarRepelente(id); }
  if (it.ensina) { if (inBattle) { await say('Dá pra mexer nos golpes só fora da batalha.'); return false; } return ensinarGolpe(id); }
  /* Itens de treino (dados.ITENS_TREINO): mexem no que o Pokémon trouxe de nascença — EVs e IVs recalculam o HP
     máximo, e a habilidade já teria entrado em campo com os ganchos dela rodados. Nada disso no meio de uma luta.
     Daqui pra baixo é o caminho comum: "usar em quem?", debitar a mochila e a mensagem. */
  if (it.treino && inBattle) { await say('Treino é coisa de fora da batalha.'); return false; }
  const equipe = ladoJogador();
  const alvos = equipe.filter(M => itemTemEfeito(it, M, M === P || !!M.growth));
  if (!alvos.length) {
    const tipo = it.treino || Object.keys(SEM_EFEITO).find(k => it[k]);
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
  /* A escolha da Cápsula acontece ANTES de a mochila ser debitada: daqui pra baixo o item JÁ FOI gasto, e
     cancelar o modal não pode consumir ₽250.000. Mesmo motivo pelo qual "usar em quem?" também vem antes. */
  const novaHab = it.treino === 'habilidade' ? await escolherHabilidade(M) : null;
  if (it.treino === 'habilidade' && !novaHab) return false;
  const em = M === P ? '' : ` em ${nm(M)}`;
  S.bag[id]--;
  if (it.heal || it.healPct) {
    const base = it.healPct ? Math.ceil(M.stats.hp * it.healPct / 100) : it.heal;
    const h = Math.min(base, M.stats.hp - M.hp); heal(M, h);
    const curou = it.cure && M.status; if (curou) { M.status = null; M.sleep = 0; }
    render();
    await say(`Você usou ${it.name}${em}. ${nm(M)} recuperou ${h} HP${curou ? ' e ficou curado de qualquer status' : ''}.`, 'good');
  } else if (it.cure) {
    M.status = null; M.sleep = 0; render();
    await say(`Você usou ${it.name}${em}. ${nm(M)} está curado!`, 'good');
  } else if (it.ether) {
    M.moves.forEach(m => m.ppLeft = Math.min(m.pp, m.ppLeft + it.ether)); render();
    await say(`Você usou ${it.name}${em}. PP restaurados.`, 'good');
  } else if (it.revive) {
    M.hp = Math.max(1, Math.floor(M.stats.hp * (it.revivePct || 50) / 100)); M.status = null; M.sleep = 0;
    delete M.vol?.escolha; // Faixa/Óculos/Lenço Escolha: voltar do desmaio destrava o golpe (igual trocar de campo nos jogos)
    G.B?.caidos?.delete(M); // em batalha: se cair de novo, anuncia de novo
    render();
    await say(`Você usou ${it.name}${em}. ${nm(M)} se levanta com ${it.revivePct === 100 ? 'todo o HP' : 'metade do HP'}!`, 'good');
  } else if (it.stage) {
    await say(`Você usou ${it.name}${em}.`);
    await changeStats(M, [{ stat: it.stage, change: 2 }]);
  } else if (it.treino === 'evs') {
    M.evs = Object.fromEntries(STATS.map(s => [s, 0]));
    /* `recalc` desce o HP atual junto com o máximo, e ele pode chegar a 0: 252 EVs de HP no nível 100 valem 63
       pontos, então usar o mochi com 1 de HP deixaria o Pokémon desmaiado FORA de batalha. Piso de 1. */
    recalc(M); M.hp = Math.max(1, M.hp); render();
    await say(`Você usou ${it.name}${em}. Os EVs de ${nm(M)} voltaram a zero — o treino começa de novo.`, 'good');
  } else if (it.treino === 'iv') {
    const s = pick(ivsParaMaximizar(M));
    // cópia, nunca escrita em cima: `mon.ivs` pode ser o mapa CONGELADO e compartilhado de "Potencial máximo" (pokemon.IVS_MAX)
    M.ivs = { ...M.ivs, [s]: 31 };
    recalc(M); render();
    await say(`Você usou ${it.name}${em}. O treino intenso levou o IV de <b>${STAT_PT[s]}</b> de ${nm(M)} ao máximo (31)!`, 'good');
  } else if (it.treino === 'habilidade') {
    const antiga = fmt(M.ability);
    M.ability = novaHab; render();
    await say(`Você usou ${it.name}${em}. A habilidade de ${nm(M)} mudou de <b>${esc(antiga)}</b> pra <b>${esc(fmt(novaHab))}</b>.`, 'good');
  } else if (it.candy) {
    await say(M === P ? `Você comeu uma ${it.name}.` : `${nm(M)} comeu uma ${it.name}.`);
    if (M === P) await gainExp(S.meta.growth[M.level + 1] - M.exp);
    else await gainExpAliado(M, M.growth[M.level + 1] - M.exp);
  }
  if (S.bag[id] <= 0) delete S.bag[id];
  render(); return true;
}
