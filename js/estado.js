/* ============ estado ============ */
// Estado mutável compartilhado entre módulos. Era um punhado de `let` soltos no <script> único;
// `let` exportado não pode ser reatribuído por quem importa, então tudo mora num objeto só (mesma
// referência sempre, só os campos mudam).
//   S     = save do jogo (player, bag, money, zone, meta.growth/evo, wins, log) — o que vai pro localStorage
//   B     = batalha em andamento ({ enemy, turn, runs }) ou null
//   PV    = prévia da tela de criação ({ data, ability, nature, level, nick }) ou null
//   mode  = 'create' | 'explore' | 'battle'
//   busy  = true enquanto um turno/exploração está resolvendo (trava os botões)
//   panel = painel de ações visível: 'main' | 'shop' | 'moves' | 'bag'
import { ZONES } from './dados.js';
import { esc, fmt, store } from './util.js';

export const SAVE_KEY = 'pokerpg-save-v1';
export const G = { S: null, B: null, PV: null, mode: 'create', busy: false, panel: 'main' };

export const zone = () => ZONES.find(z => z.id === G.S.zone) || ZONES[0];
export const nm = m => '<b>' + esc(m === G.S?.player ? (m.nick || fmt(m.name)) : fmt(m.name) + ' selvagem') + '</b>';
export function save() { const S = G.S; if (S) { S.log = (S.log || []).slice(-40); store.set(SAVE_KEY, S); } }
