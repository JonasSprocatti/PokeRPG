/* ============ roguelike: desbloqueios entre jornadas ============ */
// No modo Roguelike você começa só com os iniciais (+ Pikachu e Eevee). Cada espécie vira opção inicial pras
// próximas jornadas quando, SOMANDO as jornadas Roguelike terminadas (a carreira), você:
//   derrotou 10 · fez amizade com 5 · evoluiu pra ela 5× (forma do meio) ou 10× (forma final)   — DESBLOQUEIO em dados.js
// Só jornadas Roguelike contam (não dá pra farmar no Fácil). A jornada em andamento conta quando termina.
// Puro: recebe a lista de jornadas da carreira, devolve dados. Testado em tests/roguelike.test.js.
import { DESBLOQUEIO, INICIAIS } from './dados.js';

export const MODO_ROGUELIKE = 'roguelike';

// Progresso de cada espécie que já apareceu em alguma jornada Roguelike (iniciais ficam de fora: já estão liberados).
// Ordem: desbloqueadas primeiro, depois as mais perto de desbloquear.
export function progressoRoguelike(jornadas) {
  const soma = { derrotados: {}, amigos: {}, evolucoes: {} }, formas = {}, ids = {};
  for (const j of jornadas || []) {
    if (j.dificuldade !== MODO_ROGUELIKE) continue;
    const r = j.registro || {};
    for (const lista of Object.keys(soma)) for (const [e, n] of Object.entries(r[lista] || {})) soma[lista][e] = (soma[lista][e] || 0) + n;
    Object.assign(formas, r.formas || {});
    Object.assign(ids, r.ids || {});
  }
  const especies = new Set(Object.values(soma).flatMap(o => Object.keys(o)));
  const out = [];
  for (const especie of especies) {
    const id = ids[especie] || null;
    if (id && INICIAIS.includes(id)) continue;
    const derrotados = soma.derrotados[especie] || 0, amigos = soma.amigos[especie] || 0, evolucoes = soma.evolucoes[especie] || 0;
    const alvoEvolucao = formas[especie] === 'final' ? DESBLOQUEIO.evolucaoFinal : DESBLOQUEIO.evolucaoMeio;
    const razoes = [];
    if (derrotados >= DESBLOQUEIO.derrotados) razoes.push('derrotados');
    if (amigos >= DESBLOQUEIO.amigos) razoes.push('amigos');
    if (evolucoes && evolucoes >= alvoEvolucao) razoes.push('evolucoes');
    // quanto falta, pelo caminho mais adiantado (0–1)
    const fracao = Math.min(1, Math.max(derrotados / DESBLOQUEIO.derrotados, amigos / DESBLOQUEIO.amigos, evolucoes ? evolucoes / alvoEvolucao : 0));
    out.push({ especie, id, derrotados, amigos, evolucoes, alvoEvolucao: evolucoes ? alvoEvolucao : null, desbloqueada: razoes.length > 0, razoes, fracao });
  }
  return out.sort((a, b) => (b.desbloqueada - a.desbloqueada) || (b.fracao - a.fracao) || a.especie.localeCompare(b.especie));
}

// só as desbloqueadas que dá pra oferecer (precisam do id pra buscar o Pokémon e mostrar o sprite)
export const desbloqueadas = jornadas => progressoRoguelike(jornadas).filter(p => p.desbloqueada && p.id);

// o que esta jornada acabou de desbloquear (compara a carreira antes e depois de adicioná-la)
export function novosDesbloqueios(antes, depois) {
  const ja = new Set(desbloqueadas(antes).map(p => p.especie));
  return desbloqueadas(depois).filter(p => !ja.has(p.especie));
}

// frase de por que/quanto falta, pra tela
export function textoProgresso(p) {
  if (p.desbloqueada) return 'desbloqueado por ' + p.razoes.map(r => ({ derrotados: `${p.derrotados} derrotas`, amigos: `${p.amigos} amizades`, evolucoes: `${p.evolucoes} evoluções` }[r])).join(' · ');
  const partes = [`${p.derrotados}/${DESBLOQUEIO.derrotados} derrotas`, `${p.amigos}/${DESBLOQUEIO.amigos} amizades`];
  if (p.alvoEvolucao) partes.push(`${p.evolucoes}/${p.alvoEvolucao} evoluções`);
  return partes.join(' · ');
}
