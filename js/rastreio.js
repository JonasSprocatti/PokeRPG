/* ============ acompanhar uma conquista da conta durante a jornada ============
   As conquistas de conta (badges e gimmicks) levam MUITAS jornadas. O problema era não dar pra ver o progresso
   sem sair do jogo e abrir a tela de Conquistas — e, pior, conquistar uma no meio da run e não ficar sabendo.
   Aqui você fixa UMA (pedido do usuário): ela aparece no jogo, avisa quando completa, e **a recompensa cai na
   run em andamento**, além de valer pras próximas.

   `G.S.rastreada = { tipo, chave }` mora no save da jornada, não na conta: é uma escolha DESTA run.
     tipo 'badge'  → chave = id da badge (badges.js), que é quem tem recompensa em item/dinheiro
     tipo 'mega' | 'tera' | 'zGolpe' | 'zElemento' | 'gigantamax' → chave = espécie/tipo/golpe da gimmick

   Nada aqui recalcula conquista: quem sabe disso é `conquistasDaConta`/`badgesDaCarreira` (carreira.js), e o
   progresso da run em andamento já entra lá. Este módulo só olha, compara com o que já foi avisado e paga. */
import { G } from './estado.js';
import { ITEMS } from './dados.js';
import { badgesDaCarreira, conquistasDaConta } from './carreira.js';

export const rastreada = () => G.S?.rastreada || null;
export const rastrear = (tipo, chave) => { if (G.S) G.S.rastreada = { tipo, chave }; };
export const pararDeRastrear = () => { if (G.S) delete G.S.rastreada; };

/* O estado atual do que está sendo acompanhado: { nome, n, alvo, fracao, completa }.
   null = não há nada fixado (ou o que estava fixado sumiu, ex.: badge renomeada numa atualização). */
export function progressoRastreado() {
  const r = rastreada(); if (!r) return null;
  if (r.tipo === 'badge') {
    const b = badgesDaCarreira(G.S?.registro).find(x => x.id === r.chave);
    return b && { nome: `${b.icone} ${b.nome}`, n: b.n, alvo: b.alvo, fracao: b.fracao, completa: b.completo, recompensa: b.recompensa };
  }
  const lista = conquistasDaConta(G.S?.registro)[r.tipo] || [];
  const x = lista.find(i => i.chave === r.chave);
  if (!x) return { nome: rotuloGimmick(r), n: 0, alvo: null, fracao: 0, completa: false };
  return { nome: rotuloGimmick(r), n: x.n, alvo: x.alvo, fracao: x.fracao, completa: x.liberado };
}
const ICONE = { mega: '⚡', tera: '💎', zGolpe: '🌀', zElemento: '🌀', gigantamax: '🔴' };
const rotuloGimmick = r => `${ICONE[r.tipo] || '🎯'} ${r.chave}`;

/* Conquistou agora? Devolve o que foi conquistado (pra tela comemorar) ou null. Paga a recompensa NA RUN:
   é o pedido — o que você conquistou trabalhando nesta jornada serve nesta jornada, não só na próxima.
   `G.S.rastreadaPaga` impede pagar duas vezes: esta função roda a cada turno. */
export function checarRastreada() {
  const S = G.S, r = rastreada(); if (!S || !r) return null;
  const p = progressoRastreado();
  if (!p?.completa || S.rastreadaPaga) return null;
  S.rastreadaPaga = true;
  const ganhos = [];
  const rec = p.recompensa || {};
  if (rec.dinheiro) { S.money += rec.dinheiro; ganhos.push(`₽${rec.dinheiro.toLocaleString('pt-BR')}`); }
  for (const [k, n] of Object.entries(rec.itens || {})) {
    S.bag[k] = (S.bag[k] || 0) + n;
    ganhos.push(`${n}× ${ITEMS[k]?.name || k}`);
  }
  return { nome: p.nome, ganhos, titulo: rec.titulo || null };
}
