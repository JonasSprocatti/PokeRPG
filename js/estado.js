/* ============ estado ============ */
// Estado mutável compartilhado entre módulos. Era um punhado de `let` soltos no <script> único;
// `let` exportado não pode ser reatribuído por quem importa, então tudo mora num objeto só (mesma
// referência sempre, só os campos mudam).
//   S     = save do jogo (player, bag, money, zone, meta.growth/evo, wins, log) — o que vai pro localStorage
//   B     = batalha em andamento ou null: { enemy, turn, runs, vez, turnoNoLog, trainer?, taxaCaptura?, capturado? }
//           vez = quem está agindo agora ('p' | 'e' | 't' treinador | 'fim' | null) — só apresentação (barra de turno, placa destacada)
//           trainer = { nome, equipe: [mons], atual, bolas, bola } — só em batalha de treinador; `enemy` = equipe[atual]
//   PV    = prévia da tela de criação ({ data, ability, nature, level, nick }) ou null
//   mode  = 'create' | 'explore' | 'battle'
//   busy  = true enquanto um turno/exploração está resolvendo (trava os botões)
//   panel = painel de ações visível: 'main' | 'shop' | 'moves' | 'bag'
import { ZONES } from './dados.js';
import { esc, fmt, store } from './util.js';

export const SAVE_KEY = 'pokerpg-save-v1';
export const G = { S: null, B: null, PV: null, mode: 'create', busy: false, panel: 'main' };

export const zone = () => ZONES.find(z => z.id === G.S.zone) || ZONES[0];
// nome de exibição: seu apelido, "Pidgey de Caçador Rui" (batalha de treinador) ou "Pidgey selvagem"
export const rotulo = m => m === G.S?.player ? (m.nick || fmt(m.name)) : G.B?.trainer ? `${fmt(m.name)} de ${G.B.trainer.nome}` : fmt(m.name) + ' selvagem';
export const nm = m => '<b>' + esc(rotulo(m)) + '</b>';
// save de antes da dificuldade existir conta como Fácil (não punir retroativamente quem não escolheu)
export const dificuldadeDe = S => S?.dificuldade || 'easy';
export function save() { const S = G.S; if (S) { S.log = (S.log || []).slice(-40); store.set(SAVE_KEY, S); } }
