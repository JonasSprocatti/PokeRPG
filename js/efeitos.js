/* ============ efeitos com narração (single player) ============ */
// A regra de estágio/status mora no motor único (golpe.js). Aqui fica o CTX do single player — como narrar:
// nome em HTML (nm), golpe colorido, pausa entre mensagens (say), redesenho (render) e tremida (shake) —
// e os atalhos que batalha/itens usam. O multiplayer usa o mesmo motor com outro ctx (texto puro).
import { G, nm, ladoJogador } from './estado.js';
import { say, shake } from './ui.js';
import { render } from './render.js';
import { TC } from './dados.js';
import { mudarEstagios, aplicarStatus } from './golpe.js';
import { esc, fmt } from './util.js';

export const CTX = {
  nome: nm,
  golpe: g => `<b style="color:${TC[g.type] || 'inherit'};filter:brightness(.7)">${esc(fmt(g.name))}</b>`,
  say, atualizar: render, tremer: shake,
  // Leech Seed: 'E' = inimigo; número = posição no seu lado (você e aliados)
  refDe: m => m === G.B?.enemy ? 'E' : ladoJogador().indexOf(m),
  monPorRef: r => r === 'E' ? G.B?.enemy : ladoJogador()[r]
};
// `fonte` = quem causou (outro Pokémon → Clear Body, Hyper Cutter… podem impedir a queda). Itens: sem fonte.
export const changeStats = (m, changes, fonte = null) => mudarEstagios(m, changes, CTX, fonte);
export const inflict = (t, ail, announce = false) => aplicarStatus(t, ail, CTX, announce);

// cura você e os aliados (Centro Pokémon, derrota, fuga depois de capturado)
export function healFull() {
  for (const P of [G.S.player, ...(G.S.aliados || [])]) { P.hp = P.stats.hp; P.status = null; P.sleep = 0; P.moves.forEach(m => m.ppLeft = m.pp); }
}
