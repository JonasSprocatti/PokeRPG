/* ============ efeitos com narração (single player) ============ */
// A regra de estágio/status mora no motor único (golpe.js). Aqui fica o CTX do single player — como narrar:
// nome em HTML (nm), golpe colorido, pausa entre mensagens (say), redesenho (render), tremida de quem apanha
// (shake) e "pulo" de quem ataca (atacar) — e os atalhos que batalha/itens usam. O multiplayer usa o mesmo
// motor com outro ctx (texto puro, sem DOM — por isso `atacar`/`tremer` são OPCIONAIS em golpe.js).
import { G, nm, ladoJogador } from './estado.js';
import { say, shake, atacar, trocarPratos } from './ui.js';
import { render } from './render.js';
import { TC } from './dados.js';
import { mudarEstagios, aplicarStatus } from './golpe.js';
import { esc, fmt } from './util.js';
import { tocarImpacto } from './som.js';

export const CTX = {
  nome: nm,
  golpe: g => `<b style="color:${TC[g.type] || 'inherit'};filter:brightness(.7)">${esc(fmt(g.name))}</b>`,
  say, atualizar: render, atacar, pratos: trocarPratos,   // 🏛 Arceus trocando de Prato (boss.js pede, ui anima)
  // apanhar = tremida + piscada na cor do tipo (ui.shake) + o som do impacto daquele tipo (som.tocarImpacto:
  // labareda pro fogo, lufada pro vento…). Um gancho só, chamado pelo motor pros DOIS lados; cada metade se
  // cala sozinha se o jogador tiver desligado a sua (animação em ⚙ Ajustes, som no mesmo lugar).
  tremer: (m, tipo) => { shake(m, tipo); tocarImpacto(tipo); },
  // campo da batalha (clima, terreno e o lado de cada um): vive em G.B.campo
  get campo() { if (G.B) return (G.B.campo ||= { clima: null, turnos: 0, terreno: null, terrenoTurnos: 0, lados: {} }); return null; },
  // em que lado do campo este Pokémon está (telas, salvaguarda, armadilhas)
  ladoDe: m => (ladoJogador().includes(m) ? 'jogador' : 'inimigo'),
  // do lado do inimigo entra outro Pokémon (treinador/lendários); do seu, não — as armadilhas avisam isso
  get trocaDePokemon() { return !!G.B?.trainer; },
  // Leech Seed: 'E' = inimigo; número = posição no seu lado (você e aliados)
  refDe: m => m === G.B?.enemy ? 'E' : ladoJogador().indexOf(m),
  monPorRef: r => r === 'E' ? G.B?.enemy : ladoJogador()[r],
  // aliados vivos de m, no MESMO lado (Friend Guard): você só tem um inimigo por vez, então do lado dele é só ele
  aliadosDe: m => (ladoJogador().includes(m) ? ladoJogador() : [G.B?.enemy]).filter(x => x && x !== m && x.hp > 0)
};
// `fonte` = quem causou (outro Pokémon → Clear Body, Hyper Cutter… podem impedir a queda). Itens: sem fonte.
export const changeStats = (m, changes, fonte = null) => mudarEstagios(m, changes, CTX, fonte);
export const inflict = (t, ail, announce = false) => aplicarStatus(t, ail, CTX, announce);

// cura você e os aliados (Centro Pokémon, derrota, fuga depois de capturado)
export function healFull() {
  for (const P of [G.S.player, ...(G.S.aliados || [])]) { P.hp = P.stats.hp; P.status = null; P.sleep = 0; P.moves.forEach(m => m.ppLeft = m.pp); }
}
