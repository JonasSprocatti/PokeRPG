/* ============ estado ============ */
// Estado mutável compartilhado entre módulos. Era um punhado de `let` soltos no <script> único;
// `let` exportado não pode ser reatribuído por quem importa, então tudo mora num objeto só (mesma
// referência sempre, só os campos mudam).
//   S     = save do jogo (player, aliados, bag, money, zone, meta.growth/evo, wins, registro, dificuldade, log) — vai pro localStorage.
//           Mapas por Gen (mapas.js): gen (mapa atual; sem campo = 1), gensVencidas [g…], nivelInicioGen (nível ao entrar
//           num mapa depois do 1º — escala os níveis), escolhendoGen (fechou uma Gen e falta escolher o próximo mapa).
//           Cada aliado é um Pokémon completo (makeMon) + `growth` (curva de XP da espécie dele).
//   B     = batalha em andamento ou null: { enemy, turn, runs, vez, turnoNoLog, trainer?, taxaCaptura?, capturado? }
//           vez = quem está agindo agora ('p' | 'e' | 't' treinador | 'fim' | null) — só apresentação (barra de turno, placa destacada)
//           trainer = { nome, equipe: [mons], atual, bolas, bola } — só em batalha de treinador; `enemy` = equipe[atual]
//   PV    = prévia da tela de criação ({ data, ability, nature, level, nick }) ou null
//   mode  = 'create' | 'explore' | 'battle'
//   busy  = true enquanto um turno/exploração está resolvendo (trava os botões)
//   panel = painel de ações visível: 'main' | 'shop' | 'moves' | 'bag'
import { DIFICULDADES } from './dados.js';
import { precisaCurar, custoCentroEquipe, custoComDesconto, bonusShiny, especiesShinyDoJogador } from './regras.js';
import { genDe, rotasDaGen, rotaNaJornada } from './mapas.js';
import { esc, fmt, store } from './util.js';

export const SAVE_KEY = 'pokerpg-save-v1';
//   dif   = dificuldade escolhida na tela inicial (antes de existir PV/S); vira S.dificuldade ao começar
//   abertos = índices de aliados com a "ficha completa" aberta na ficha (sobrevive ao re-render; não vai pro save)
//   gen   = mapa (Gen) escolhido na tela inicial; vira S.gen ao começar
//   cacaShiny = 🎯 modo Caça Shiny marcado na tela inicial; vira S.cacaShiny (só dá pra ligar ao começar)
//   alvoDe = índice do golpe escolhido esperando ALVO (⚔ Saga, grupo inimigo); null = nada pendente. Só UI.
//   comandando = de quem é o painel de golpes ('p' você | 'a<i>' aliado) no ⚔ Saga. Só UI.
//   comitiva = companheiros escolhidos no passo 4 da criação (⚔ Saga), antes de existir save
//   auto = a caçada do 🤖 auto-explorar (auto.js, só admin). Fica aqui porque `render.js` desenha o painel dela
//     e NÃO pode importar `auto.js` (que vive lá em cima, junto de `mundo.js`): o grafo de imports é de via
//     única. Vive só nesta aba e nunca entra no save — é ferramenta de diagnóstico, não progresso.
export const G = { S: null, B: null, PV: null, mode: 'create', busy: false, panel: 'main', dif: 'roguelike', gen: 1, cacaShiny: false, climaRotas: false, abertos: new Set(), alvoDe: null, comitiva: null, comandando: 'p', auto: null };

// rotas do mapa (Gen) atual, já com os níveis desta jornada (mapas.js: escalaNivel depois de trocar de Gen)
export const rotasAtuais = () => rotasDaGen(genDe(G.S)).map(z => rotaNaJornada(z, G.S));
// rota atual (save sem rota válida nesse mapa — ex.: a Fenda Dimensional, que saiu — cai na 1ª rota do mapa)
export const zone = () => { const rs = rotasAtuais(); return rs.find(z => z.id === G.S.zone) || rs[0]; };
// nome de exibição: seu apelido / nome do aliado, "Pidgey de Caçador Rui" (batalha de treinador) ou "Pidgey selvagem"
// `m` nulo devolve string vazia em vez de quebrar: quem chama está no meio de um turno, e uma exceção aqui
// derruba a rodada toda (o dano e o turno somem sem ninguém ver). Já aconteceu — ver B.vez em batalha.anunciarQuedas.
export const rotulo = m => !m ? ''
  : m === G.S?.player || G.S?.aliados?.includes(m) ? (m.nick || fmt(m.name))
  : m.lendario ? fmt(m.name) + ' lendário'
  : m.chefe ? fmt(m.name) + ' Alfa'
  : G.B?.trainer ? `${fmt(m.name)} de ${G.B.trainer.nome}` : fmt(m.name) + ' selvagem';

// Lado do jogador em batalha: você + aliados (S.aliados, até MAX_ALIADOS). É o conceito que o multiplayer vai
// reaproveitar (vários Pokémon de jogadores diferentes no mesmo lado) — a batalha nunca assume "só 1 do meu lado".
export const ladoJogador = () => [G.S.player, ...(G.S.aliados || [])];
export const vivos = lista => lista.filter(m => m.hp > 0);
// quem participa da batalha: você + aliados que não estão com a ordem "Descansar" (A.ordem === 'fora')
// `vol.retirado` = saiu desta luta sem desmaiar (arrastado por Roar & cia., ou fugiu de medo): não age, não é alvo, não ganha XP.
// Vive em `vol`, que é zerado ao começar e ao acabar toda batalha — nunca vaza pro save.
export const emCampo = () => ladoJogador().filter(m => m.ordem !== 'fora' && !m.vol?.retirado);

/* ---- lado INIMIGO: um ou vários ----
   O jogo nasceu com um inimigo só (`B.enemy`), e ~50 pontos em 7 arquivos leem esse campo. O ⚔ Saga luta contra
   GRUPO (até 3), então a fonte de verdade virou `B.inimigos` (array) + `B.foco` (índice de quem está em foco),
   e **`B.enemy` passou a ser um getter** que devolve `inimigos[foco]`.

   Por que getter e não um campo que se atualiza: `B.enemy` é lido em 50 lugares e escrito em 4 (troca do
   treinador, Roar, próximo da fila). Com campo, cada escrita nova teria de lembrar de sincronizar as duas
   coisas, e o dia que esquecer o jogo mostra um inimigo e aplica dano em outro. Com getter isso é impossível
   por construção: existe UM lugar de verdade.

   Nos modos de um inimigo só, `inimigos` tem um elemento — o mesmo código serve aos dois casos, sem ramo.
   `B.enemy` continua funcionando em todos os 50 pontos, inclusive no save (`serializarBatalha` grava o array e
   o índice; `restaurarBatalha` reinstala o getter, senão o JSON devolveria um objeto DUPLICADO e o dano
   aplicado no `enemy` não apareceria na cena). */
export function ligarInimigos(B, lista) {
  B.inimigos = lista;
  B.foco = Math.max(0, Math.min(B.foco || 0, lista.length - 1));
  Object.defineProperty(B, 'enemy', {
    configurable: true, enumerable: true,
    get: () => B.inimigos[B.foco] ?? B.inimigos[0] ?? null,
    set: m => { const i = B.inimigos.indexOf(m); if (i >= 0) B.foco = i; else { B.inimigos[B.foco] = m; } }
  });
  return B;
}
// inimigos que ainda estão na luta (de pé e não retirados). O alvo do jogador e a ordem do turno saem daqui.
export const inimigosEmCampo = () => (G.B?.inimigos || []).filter(m => m.hp > 0 && !m.vol?.retirado);
// a luta contra o grupo acabou quando ninguém do lado inimigo está de pé
export const grupoInimigoCaiu = () => !(G.B?.inimigos || []).some(m => m.hp > 0);

// Centro Pokémon: se alguém da equipe precisa de cura e quanto custa no modo atual (grátis no Fácil; no Médio,
// cada vitória desde a última visita — S.vitoriasDesdeCentro — tira 10%). `cheio` = preço sem desconto, pra mostrar.
// Único lugar que decide isso — o botão (render) e o clique (main) leem daqui.
export function centroPokemon() {
  const equipe = ladoJogador(), regra = DIFICULDADES[dificuldadeDe(G.S)];
  // segredo do brilho (regras.bonusShiny): quem é shiny se cura de graça, em qualquer modo
  const cheio = regra.centroGratis || bonusShiny(G.S) ? 0 : custoCentroEquipe(equipe), vit = G.S.vitoriasDesdeCentro || 0;
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
/* Retroativo (bug corrigido em 27/09/2026, relatado em jogo): shiniesAmigos nunca era gravado pro PRÓPRIO
   Pokémon do jogador (só ao recrutar um ALIADO shiny) nem propagava pra nova espécie na evolução — quem já
   tinha um shiny antes da correção (ex.: Weedle shiny evoluído até Beedrill) nunca via o início-shiny liberado.
   Chamada uma vez ao abrir a jornada (main.abrirJornada); idempotente (`||=`, nunca soma de novo) — pode rodar
   toda vez sem inflar o total mostrado na Carreira. */
export function migrarShiniesAmigos(S) {
  if (!S) return;
  const sa = () => ((S.registro ||= {}).shiniesAmigos ||= {});
  for (const especie of especiesShinyDoJogador(S)) sa()[especie] ||= 1;
  for (const A of S.aliados || []) if (A.shiny && A.data?.speciesName) sa()[A.data.speciesName] ||= 1;
}
export const nm = m => '<b>' + esc(rotulo(m)) + '</b>';
// save de antes da dificuldade existir conta como Fácil (não punir retroativamente quem não escolheu)
export const dificuldadeDe = S => S?.dificuldade || 'easy';
// aoSalvar: chamado depois de todo save() local (main.js liga no envio pra nuvem) — estado não conhece a nuvem.
// serializarBatalha: batalha.js registra aqui como transformar G.B em algo que cabe no save (Set não vai em JSON).
export const ganchosSave = { aoSalvar: null, serializarBatalha: null };
export function save() {
  const S = G.S; if (!S) return;
  marcarTempo();
  // batalha em andamento vai junto: recarregar a página não é mais fuga grátis (batalha.js serializarBatalha)
  if (G.B) S.batalha = ganchosSave.serializarBatalha?.(G.B) || null; else delete S.batalha;
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
