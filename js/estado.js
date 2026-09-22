/* ============ estado ============ */
// Estado mutável compartilhado entre módulos. Era um punhado de `let` soltos no <script> único;
// `let` exportado não pode ser reatribuído por quem importa, então tudo mora num objeto só (mesma
// referência sempre, só os campos mudam).
//   S     = save do jogo (player, aliados, bag, money, zone, meta.growth/evo, wins, registro, dificuldade, log) — vai pro localStorage.
//           Cada aliado é um Pokémon completo (makeMon) + `growth` (curva de XP da espécie dele).
//   B     = batalha em andamento ou null: { enemy, turn, runs, vez, turnoNoLog, trainer?, taxaCaptura?, capturado? }
//           vez = quem está agindo agora ('p' | 'e' | 't' treinador | 'fim' | null) — só apresentação (barra de turno, placa destacada)
//           trainer = { nome, equipe: [mons], atual, bolas, bola } — só em batalha de treinador; `enemy` = equipe[atual]
//   PV    = prévia da tela de criação ({ data, ability, nature, level, nick }) ou null
//   mode  = 'create' | 'explore' | 'battle'
//   busy  = true enquanto um turno/exploração está resolvendo (trava os botões)
//   panel = painel de ações visível: 'main' | 'shop' | 'moves' | 'bag'
import { ZONES, DIFICULDADES } from './dados.js';
import { precisaCurar, custoCentroEquipe, custoComDesconto } from './regras.js';
import { esc, fmt, store } from './util.js';

export const SAVE_KEY = 'pokerpg-save-v1';
//   dif   = dificuldade escolhida na tela inicial (antes de existir PV/S); vira S.dificuldade ao começar
//   abertos = índices de aliados com a "ficha completa" aberta na ficha (sobrevive ao re-render; não vai pro save)
export const G = { S: null, B: null, PV: null, mode: 'create', busy: false, panel: 'main', dif: 'roguelike', abertos: new Set() };

export const zone = () => ZONES.find(z => z.id === G.S.zone) || ZONES[0];
// nome de exibição: seu apelido / nome do aliado, "Pidgey de Caçador Rui" (batalha de treinador) ou "Pidgey selvagem"
export const rotulo = m => m === G.S?.player || G.S?.aliados?.includes(m) ? (m.nick || fmt(m.name))
  : m.chefe ? fmt(m.name) + ' Alfa'
  : G.B?.trainer ? `${fmt(m.name)} de ${G.B.trainer.nome}` : fmt(m.name) + ' selvagem';

// Lado do jogador em batalha: você + aliados (S.aliados, até MAX_ALIADOS). É o conceito que o multiplayer vai
// reaproveitar (vários Pokémon de jogadores diferentes no mesmo lado) — a batalha nunca assume "só 1 do meu lado".
export const ladoJogador = () => [G.S.player, ...(G.S.aliados || [])];
export const vivos = lista => lista.filter(m => m.hp > 0);
// quem participa da batalha: você + aliados que não estão com a ordem "Descansar" (A.ordem === 'fora')
export const emCampo = () => ladoJogador().filter(m => m.ordem !== 'fora');

// Centro Pokémon: se alguém da equipe precisa de cura e quanto custa no modo atual (grátis no Fácil; no Médio,
// cada vitória desde a última visita — S.vitoriasDesdeCentro — tira 10%). `cheio` = preço sem desconto, pra mostrar.
// Único lugar que decide isso — o botão (render) e o clique (main) leem daqui.
export function centroPokemon() {
  const equipe = ladoJogador(), regra = DIFICULDADES[dificuldadeDe(G.S)];
  const cheio = regra.centroGratis ? 0 : custoCentroEquipe(equipe), vit = G.S.vitoriasDesdeCentro || 0;
  const custo = regra.descontoPorVitoria ? custoComDesconto(cheio, vit, regra.descontoPorVitoria) : cheio;
  return { precisa: equipe.some(precisaCurar), custo, cheio, vitorias: regra.descontoPorVitoria ? vit : 0 };
}
// usar o Centro (ou acordar nele depois de desmaiar) zera o desconto do Médio
export const zerarDescontoCentro = () => { if (G.S) G.S.vitoriasDesdeCentro = 0; };

// Registro por espécie (S.registro = { derrotados, amigos, evolucoes }, cada um {especie: n}) — base das missões
// e dos desbloqueios do Roguelike (3.3): derrotar/fazer amizade N vezes, ou evoluir pra forma do meio 5× / final 10×.
// Chave = speciesName (formas regionais contam como a espécie). Lista nova é criada na primeira vez.
// Também: vistos (encontrados), shinies (shinies encontrados), shiniesAmigos. `id` (opcional) guarda o número
// da Pokédex da espécie em registro.ids — é o que a Pokédex da carreira usa pra mostrar o sprite.
export function registrar(S, lista, especie, id) {
  const r = (S.registro ||= {});
  const l = (r[lista] ||= {});
  l[especie] = (l[especie] || 0) + 1;
  if (id) (r.ids ||= {})[especie] = id;
}
// Pokémon apareceu na sua frente (selvagem, de treinador ou Alfa): conta como visto (e shiny visto)
export function registrarVisto(M) {
  if (!G.S) return;
  registrar(G.S, 'vistos', M.data.speciesName, M.id);
  if (M.shiny) registrar(G.S, 'shinies', M.data.speciesName, M.id);
}
export const nm = m => '<b>' + esc(rotulo(m)) + '</b>';
// save de antes da dificuldade existir conta como Fácil (não punir retroativamente quem não escolheu)
export const dificuldadeDe = S => S?.dificuldade || 'easy';
// aoSalvar: chamado depois de todo save() local (main.js liga no envio pra nuvem) — estado não conhece a nuvem
export const ganchosSave = { aoSalvar: null };
export function save() {
  const S = G.S; if (!S) return;
  marcarTempo();
  S.maxDinheiro = Math.max(S.maxDinheiro || 0, S.money || 0); // maior quantia de uma vez na jornada (carreira)
  S.salvoEm = Date.now(); // desempate entre o save deste aparelho e o da nuvem
  S.log = (S.log || []).slice(-40); store.set(SAVE_KEY, S);
  ganchosSave.aoSalvar?.(S);
}
// Tempo de jogo (S.tempoMs): soma o intervalo desde o último save, mas ignora pausas > 5 min (aba parada ou jogo fechado).
// O boot zera S.ultimoTick pra não contar o tempo com o jogo fechado.
const PAUSA_MAX = 5 * 60 * 1000;
export function marcarTempo() {
  const S = G.S; if (!S) return;
  const agora = Date.now();
  if (S.ultimoTick) S.tempoMs = (S.tempoMs || 0) + Math.min(agora - S.ultimoTick, PAUSA_MAX);
  S.ultimoTick = agora;
}
