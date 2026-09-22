/* ============ progressão ============ */
// XP → nível, golpes aprendidos por nível e evolução — pra você e pros aliados. As condições de evolução (nível,
// pedra, troca, vínculo, hora do dia, golpe conhecido…) moram em evolucao.js; aqui fica a narração e a troca de espécie.
// Diferença entre você e o aliado: você escolhe qual golpe esquecer; o aliado troca sozinho o de menor poder.
// A evolução pergunta nos dois casos (é decisão sua deixar o aliado evoluir ou não).
import { G, nm, registrar, rotulo, ladoJogador } from './estado.js';
import { say, ask } from './ui.js';
import { render } from './render.js';
import { API, STATS, STAT_PT, TYPE_PT, CLS_PT, ITEMS } from './dados.js';
import { recalc, MAX_ALIADOS } from './regras.js';
import { makeMon } from './pokemon.js';
import { evolucoesPossiveis, caminhoMostrado, textoCondicao, ganharFelicidade, ganhoFelicidadeNivel, felicidadeDe, FELICIDADE_ALIADO } from './evolucao.js';
import { loadMove, loadSpecies, loadPokemon, loadEvo, loadGrowth } from './api.js';
import { esc, fmt } from './util.js';

const ehJogador = M => M === G.S.player;

export async function gainExp(xp) {
  const P = G.S.player, GR = G.S.meta.growth;
  P.exp += xp; recalc(P);
  let leveled = false;
  while (P.level < 100 && P.exp >= GR[P.level + 1]) {
    const before = { ...P.stats };
    P.level++; recalc(P); leveled = true; ganharFelicidade(P, ganhoFelicidadeNivel(felicidadeDe(P))); render();
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
    A.level++; recalc(A); leveled = true; ganharFelicidade(A, ganhoFelicidadeNivel(felicidadeDe(A))); render();
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
// Árvore de evolução: a sua fica em S.meta.evo; a do aliado é buscada na 1ª vez e guardada nele (A.evo, null = não
// evolui). Árvore sem `v: 2` é de save antigo (só nível): busca de novo com todas as condições (offline: usa a velha).
async function arvoreDe(M) {
  const atual = ehJogador(M) ? G.S.meta.evo : M.evo;
  if (atual === null || atual?.v === 2) return atual;
  try {
    const sp = await loadSpecies(M.data.speciesUrl);
    const nova = sp.evoUrl ? await loadEvo(sp.evoUrl) : null;
    if (ehJogador(M)) G.S.meta.evo = nova; else M.evo = nova;
    return nova;
  } catch (e) { if (atual) return atual; throw e; }
}
// o que as condições precisam saber (evolucao.js): hora de verdade, os outros da equipe, mochila, registro, dinheiro
const contexto = (M, extra) => ({ gatilho: 'level-up', hora: new Date().getHours(), aliados: ladoJogador().filter(x => x !== M),
  bag: G.S.bag, registro: G.S.registro, dinheiro: G.S.money, ...extra });
const nomeItem = k => ITEMS[k]?.name || fmt(k);
// gasta o que a evolução pede (item segurado na mochila, dinheiro)
function pagar(o) {
  const S = G.S;
  if (o.consome) { S.bag[o.consome]--; if (S.bag[o.consome] <= 0) delete S.bag[o.consome]; }
  if (o.custo) S.money -= o.custo;
}
const extraTexto = o => [o.consome ? `gasta ${nomeItem(o.consome)}` : '', o.custo ? `custa ₽${o.custo.toLocaleString('pt-BR')}` : ''].filter(Boolean).join(', ');

// Evolução por nível (ou depois da batalha, `extra.gatilho = 'pos-batalha'`): pergunta se deixa evoluir.
export async function checkEvolution(M, extra = {}) {
  const arvore = await arvoreDe(M).catch(() => null); if (!arvore) return false;
  const node = findNode(arvore, M.data.speciesName); if (!node) return false;
  const opts = evolucoesPossiveis(node, M, contexto(M, extra));
  if (!opts.length) return false;
  const pergunta = ehJogador(M) ? `Algo está acontecendo com ${nm(M)}... Você sente seu corpo mudar. Deixar evoluir?`
    : `Algo está acontecendo com seu aliado ${nm(M)}... Deixar ele evoluir?`;
  const c = await ask(pergunta, [...opts.map(o => ({ label: `Evoluir para ${esc(fmt(o.name))}${extraTexto(o) ? ` (${extraTexto(o)})` : ''}`, value: o.name })), { label: ehJogador(M) ? 'Resistir à evolução' : 'Impedir a evolução', value: null, ghost: true }]);
  if (!c) { await say(`${nm(M)} ${ehJogador(M) ? 'resistiu à' : 'não passou pela'} evolução.`); return false; }
  pagar(opts.find(o => o.name === c));
  await evolve(M, await casulo(M, c, node), arvore);
  return true;
}

// Nincada: ao virar Ninjask, o casco deixado pra trás vira Shedinja. Com vaga na equipe, ele entra sozinho como
// aliado; com a equipe cheia, você escolhe em qual dos dois o seu Pokémon vira. Devolve a espécie final.
const CASCA_PRA_TRAS = { ninjask: 'shedinja' };
async function casulo(M, escolha, node) {
  const outra = CASCA_PRA_TRAS[escolha];
  if (!outra || !node.to.some(x => x.name === outra)) return escolha;
  const S = G.S; S.aliados ||= [];
  if (S.aliados.length >= MAX_ALIADOS) {
    const c = await ask(`A casca de ${nm(M)} vai ficar pra trás e ganhar vida própria — mas sua equipe já está cheia (${MAX_ALIADOS} aliados). Em qual dos dois ${ehJogador(M) ? 'você vira' : 'ele vira'}?`,
      [{ label: `Virar ${esc(fmt(escolha))}`, value: escolha }, { label: `Virar ${esc(fmt(outra))}`, value: outra }]);
    return c || escolha;
  }
  try {
    const data = await loadPokemon(outra);
    const novo = await makeMon(data, M.level);
    const sp = await loadSpecies(data.speciesUrl);
    novo.growth = await loadGrowth(sp.growthUrl); novo.exp = novo.growth[novo.level];
    novo.felicidade = FELICIDADE_ALIADO;
    S.aliados.push(novo); G.abertos.clear();
    registrar(S, 'amigos', data.speciesName, data.id);
    if (novo.shiny) registrar(S, 'shiniesAmigos', data.speciesName, data.id);
    render();
    await say(`A casca vazia se mexe... <b>${esc(fmt(data.name))}</b> ganhou vida e agora segue com você!${novo.shiny ? ' ✨ E é shiny!' : ''}`, 'level');
  } catch (e) { console.error(e); await say('A casca ficou pra trás, imóvel. (não deu pra buscar os dados dela agora)', 'muted'); }
  return escolha;
}

// Usar um item de evolução (pedra etc.: 'use-item') ou o Cabo de Conexão ('trade') fora de batalha.
// Pergunta em quem (só quem pode evoluir com ele agora) e pra quê. true = item gasto.
export async function evoluirComItem(id) {
  const it = ITEMS[id], gatilho = it.troca ? 'trade' : 'use-item', S = G.S;
  const cands = [], faltas = [];
  for (const M of ladoJogador().filter(x => x.hp > 0)) {
    let arvore; try { arvore = await arvoreDe(M); } catch { continue; }
    const node = arvore && findNode(arvore, M.data.speciesName); if (!node) continue;
    const opts = evolucoesPossiveis(node, M, contexto(M, { gatilho, item: id }));
    if (opts.length) { cands.push({ M, arvore, opts }); continue; }
    // quase: tem esse tipo de evolução, mas falta algo (ex.: o item que vai junto na troca)
    for (const alvo of node.to) {
      const d = caminhoMostrado(alvo);
      if (d?.trigger === gatilho && (gatilho === 'trade' || d.item === id)) faltas.push(`${esc(rotulo(M))} → ${esc(fmt(alvo.name))}: precisa ${esc(textoCondicao(d, nomeItem))}`);
    }
  }
  if (!cands.length) {
    await say(`${it.name} não faz ninguém da equipe evoluir agora.${faltas.length ? '<br>' + faltas.join('<br>') : ''}`, 'muted');
    return false;
  }
  let esc1 = cands[0];
  if (cands.length > 1) {
    const i = await ask(`Usar <b>${it.name}</b> em quem?`, [...cands.map((x, j) => ({ label: `${esc(rotulo(x.M))} → ${x.opts.map(o => esc(fmt(o.name))).join(' / ')}`, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
    if (i < 0) return false;
    esc1 = cands[i];
  }
  const { M, arvore, opts } = esc1;
  const c = await ask(`Usar <b>${it.name}</b> em ${nm(M)}?`, [...opts.map(o => ({ label: `Evoluir para ${esc(fmt(o.name))}${extraTexto(o) ? ` (${extraTexto(o)})` : ''}`, value: o.name })), { label: 'Cancelar', value: null, ghost: true }]);
  if (!c) return false;
  S.bag[id]--; if (S.bag[id] <= 0) delete S.bag[id];
  pagar(opts.find(o => o.name === c));
  await say(it.troca ? `Você conecta o ${it.name}... ${nm(M)} sente uma energia estranha.` : `Você usa ${it.name} em ${nm(M)}.`);
  await evolve(M, c, arvore);
  return true;
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
