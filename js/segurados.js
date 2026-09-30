/* ============ itens segurados (efeito em batalha) ============ */
// Cada Pokémon da equipe pode segurar UM item (`M.item` = id em ITEMS). O efeito acontece sozinho na batalha —
// nada de usar pela mochila. Mesma ideia da tabela de habilidades: aqui são só dados + ganchos; quem executa é
// regras.js (dano e atributos) e golpe.js (durante o golpe e no fim do turno).
// Ganchos:
//   multDano      multiplica o dano que VOCÊ causa                    (Orbe da Vida, Faixa Muscular…)
//   soFisico/soEspecial   o multiplicador só vale pra essa classe de golpe
//   soSuperEfetivo  o multiplicador só vale em golpe super efetivo    (Cinto do Perito)
//   multStat      multiplica um atributo seu                          (Colete de Assalto)
//   semStatus     não deixa você usar golpes de status                (Colete de Assalto)
//   recuoPorGolpe fração do SEU HP máximo perdida ao acertar          (Orbe da Vida)
//   drenaDano     fração do dano causado que você recupera            (Sino-Concha)
//   espetos       fração do HP máximo que quem te acerta (físico) perde (Elmo Rochoso) — não confundir com os
//                 espinhos do CAMPO (Spikes, em regras.js): aqueles ficam no chão e pegam quem entra
//   aguentaCheio  com HP cheio, sobra com 1 HP (e o item é gasto)     (Faixa de Foco)
//   curaFimTurno  fração do HP máximo recuperada por turno            (Restos)
//   soTipo        `curaFimTurno` só pra esse tipo; nos outros machuca  (Lodo Negro)
//   curaEm        come sozinho ao cair nessa fração de HP: { fracao, cura?, fracaoCura? } (Frutas Oran/Sitrus)
//   curaStatus    come sozinho quando você está com status            (Fruta Lum)
//   danoTipo      {tipos:[t], mult}  golpe desses tipos que VOCÊ usa ×mult     (Núcleo Eternamax)
//   resisteTipo   {tipos:[t], mult}  golpe desses tipos que VOCÊ recebe ×mult (Escama do Céu, Cristal Psíquico/Gélido)
//   statusFimTurno  tenta se auto-infligir esse status todo fim de turno enquanto não tiver nenhum — 'toxic' é
//                 veneno GRAVE (mesma regra do golpe Toxic)                    (Orbe de Fogo, Orbe Tóxico)
//   quickClaw     20% de chance de agir primeiro DENTRO da própria prioridade  (Garra Rápida) — lido em
//                 regras.ordenarAcoes via regras.ativouQuickClaw (não aqui: precisa do `sorte` do turno inteiro)
//   choice        trava no primeiro golpe usado (Faixas/Óculos/Lenço Escolha) — a trava em si é `M.vol.escolha`
//                 (golpe.usarGolpe seta; render.js/arena.js/multiplayer.js desabilitam os outros botões)
//   eviolite      Defesa/Def. Especial ×1.5 SÓ se a espécie ainda evolui (dados-evolucao-restante.js) — lido por
//                 `multEviolite`, não por `multStat` (o multiplicador do Eviolite depende da espécie, não é fixo)
//   cartaoVermelho  quem te acerta é tirado de campo e o item se gasta (Cartão Vermelho) — golpe.executar → ctx.forcarSaida
//   balao         você flutua: golpe Terrestre não acerta e o terreno não pega (Balão de Ar). Vira `vol.balao` ao
//                 entrar em campo (regras.noChao lê de lá) e ESTOURA no primeiro golpe que te acertar
//   subeAoLevarSE estágios que sobem quando um golpe SUPER EFETIVO te acerta (Apólice de Fraqueza)
//   critExtra     +n no estágio de crítico dos SEUS golpes (Lente de Mira) — somado ao Focus Energy e ao Super Luck
//   desfazQueda   desfaz na hora a queda de atributo que você acabou de sofrer (Erva Branca)
//   livraTrava    livra de Provocação/Bis/Desativar/Tormento (Erva Mental)
//   pulaCarga     golpe de carga sai no mesmo turno (Erva do Poder)
//   resisteSE     como `resisteTipo`, mas SÓ em golpe super efetivo daquele tipo (frutas Occa, Passho…)
// Puro (sem DOM): testado em tests/segurados.test.js.
// (Vínculo de Batalha, Pedra Mega e Cristal Z NÃO entram aqui: são itens de UMA gimmick só, checados direto
// pelo id — `M.item === ITEM_VINCULO` etc. — no módulo da própria gimmick, não por gancho genérico.)
import { ITENS_SEGURADOS, ITENS_RAIDE_SEGURADOS, ITENS_VANTAGEM_TIPO, ITENS_FRUTA_TIPO, PLACA_DO_TIPO, FRUTA_DO_TIPO } from './dados.js';
import { AINDA_EVOLUI } from './dados-evolucao-restante.js';
import { hab } from './habilidades.js';

export const SEGURADOS = {
  leftovers: { curaFimTurno: 1 / 16 },
  'black-sludge': { curaFimTurno: 1 / 16, soTipo: 'poison', danoFimTurno: 1 / 8 },
  'life-orb': { multDano: 1.3, recuoPorGolpe: 0.1 },
  'focus-sash': { aguentaCheio: true, gastaNoUso: true },
  'shell-bell': { drenaDano: 1 / 8 },
  'rocky-helmet': { espetos: 1 / 6 },
  'red-card': { cartaoVermelho: true },
  'expert-belt': { multDano: 1.2, soSuperEfetivo: true },
  'muscle-band': { multDano: 1.1, soFisico: true },
  'wise-glasses': { multDano: 1.1, soEspecial: true },
  'assault-vest': { multStat: { 'special-defense': 1.5 }, semStatus: true },
  'oran-berry': { curaEm: { fracao: 0.5, cura: 10 }, gastaNoUso: true },
  'sitrus-berry': { curaEm: { fracao: 0.5, fracaoCura: 0.25 }, gastaNoUso: true },
  'lum-berry': { curaStatus: true, gastaNoUso: true },
  'flame-orb': { statusFimTurno: 'burn' },
  'toxic-orb': { statusFimTurno: 'toxic' },
  'quick-claw': { quickClaw: true },
  'choice-band': { multStat: { attack: 1.5 }, choice: true },
  'choice-specs': { multStat: { 'special-attack': 1.5 }, choice: true },
  'choice-scarf': { multStat: { speed: 1.5 }, choice: true },
  /* Bola de Ferro nos jogos de verdade TAMBÉM torna o portador "no chão" (perde imunidade a golpe de Terra, mesmo
     voador ou com Levitate) — simplificação assumida: essa parte ficou de fora (mexeria na imunidade de tipo do
     motor único, `typeEff`/`ht.imuneTipo` em golpe.js, usada em todo golpe do jogo — risco maior que o ganho pro
     uso mais comum do item, que é só o corte de Velocidade pra Trick Room). */
  'iron-ball': { multStat: { speed: 0.5 } },
  eviolite: { eviolite: true },   // Defesa/Def. Especial: `multEviolite` (depende da espécie, não é um `multStat` fixo)
  /* Prêmios de raide (boss.js) — pedra Mega Eternamax não existe: estes 7 são itens SEGURADOS comuns, cai na
     mochila e equipa que nem qualquer um dos outros. Valem em qualquer batalha (não só contra o chefe da semana) —
     diferente dos consumíveis de raide (ITENS_DE_RAIDE), esses aqui são passivos, como os itens de fábrica.
     Simplificações assumidas (documentadas no CLAUDE.md): Rédea Espectral e Emblema da Coroa tinham uma versão
     mais elaborada no design original ("prioridade no 1º turno", "dano em conjunto com aliado") que exigiria
     mexer na ordenação de turno dos dois motores (single player e multiplayer) — a versão que entrou é mais
     simples, mas com efeito real e testado. */
  'nucleo-eternamax': { danoTipo: { tipos: ['dragon', 'poison'], mult: 1.2 }, multStat: { defense: 0.8 } },
  'escama-do-ceu': { resisteTipo: { tipos: ['flying', 'dragon'], mult: 0.75 } },
  'cristal-psiquico': { resisteTipo: { tipos: ['psychic'], mult: 0.6 } },
  'redea-espectral': { multStat: { speed: 1.2 } },
  'emblema-da-coroa': { multDano: 1.15 },
  'cristal-gelido': { resisteTipo: { tipos: ['ice'], mult: 0.5 } },
  'presa-da-lua': { drenaDano: 0.1 },
  // Pratos do Arceus + Lenço de Seda (dados.PLACA_DO_TIPO, badges.js "Especialista em X"): +20% de dano no tipo
  // correspondente, um prato por tipo. Gerado da MESMA tabela que a badge usa pra premiar — nunca desalinha.
  ...Object.fromEntries(Object.entries(PLACA_DO_TIPO).map(([tipo, id]) => [id, { danoTipo: { tipos: [tipo], mult: 1.2 } }])),
  'air-balloon': { balao: true },
  'weakness-policy': { subeAoLevarSE: [['attack', 2], ['special-attack', 2]], gastaNoUso: true },
  'scope-lens': { critExtra: 1 },
  'white-herb': { desfazQueda: true, gastaNoUso: true },
  'mental-herb': { livraTrava: true, gastaNoUso: true },
  'power-herb': { pulaCarga: true, gastaNoUso: true },
  // frutas de aperto por tipo: uma por tipo, da MESMA tabela que gera os itens na loja (dados.FRUTA_DO_TIPO)
  ...Object.fromEntries(Object.entries(FRUTA_DO_TIPO).map(([tipo, [id]]) =>
    [id, { resisteSE: { tipo, mult: 0.5 }, gastaNoUso: true }]))
};
// o que este Pokémon está segurando (objeto vazio = nada). Klutz (semItemEmBatalha): o item continua segurado
// (pode ser roubado, aparece pro Frisk…), só não tem NENHUM efeito em batalha — por isso é aqui, no único lugar
// por onde toda leitura de item passa, e não em cada gancho separado.
export const seg = m => (hab(m).semItemEmBatalha ? {} : SEGURADOS[m?.item] || {});
export const temSegurado = m => !!SEGURADOS[m?.item];
// itens segurados que existem na mochila/loja (dados.js) — o teste confere que as duas listas batem
export const IDS_SEGURADOS = [...Object.keys(ITENS_SEGURADOS), ...Object.keys(ITENS_RAIDE_SEGURADOS), ...Object.keys(ITENS_VANTAGEM_TIPO), ...Object.keys(ITENS_FRUTA_TIPO)];

// Multiplicador de dano do item de quem ataca. `ef` = eficácia de tipo (2, 1, 0.5…), `fisico` = golpe físico,
// `tipo` = tipo do golpe (pro `danoTipo` do Núcleo Eternamax — independente do `multDano` genérico).
export function multDanoDoItem(m, { ef = 1, fisico = true, tipo = null } = {}) {
  const s = seg(m);
  let mult = 1;
  if (s.multDano && !(s.soSuperEfetivo && ef <= 1) && !(s.soFisico && !fisico) && !(s.soEspecial && fisico)) mult *= s.multDano;
  if (s.danoTipo && tipo && s.danoTipo.tipos.includes(tipo)) mult *= s.danoTipo.mult;
  return mult;
}
// Multiplicador de dano do item de quem DEFENDE, por tipo do golpe recebido (Escama do Céu, Cristal Psíquico/Gélido).
export function resisteDoItem(m, tipo, ef = 1) {
  const s = seg(m);
  if (s.resisteTipo && tipo && s.resisteTipo.tipos.includes(tipo)) return s.resisteTipo.mult;
  // fruta de aperto: só corta quando o golpe é DE VERDADE super efetivo (`ef > 1`), como nos jogos
  if (s.resisteSE && tipo && s.resisteSE.tipo === tipo && ef > 1) return s.resisteSE.mult;
  return 1;
}
// a fruta de aperto foi usada neste golpe? (quem chama gasta o item e avisa — golpe.js)
export const frutaDeAperto = (m, tipo, ef) => {
  const s = seg(m);
  return !!(s.resisteSE && tipo && s.resisteSE.tipo === tipo && ef > 1);
};
// Eviolite: Defesa/Def. Especial ×1.5, só se a ESPÉCIE ainda evolui (dados-evolucao-restante.js — gerado do
// repositório-fonte da PokéAPI, sem precisar buscar a árvore de evolução no meio do turno).
export const multEviolite = (m, stat) =>
  (seg(m).eviolite && (stat === 'defense' || stat === 'special-defense') && AINDA_EVOLUI.has(m?.data?.speciesName)) ? 1.5 : 1;
// Fruta que come sozinha: devolve o que fazer agora ({ cura } ou { curaStatus }) ou null. `m.hp` já atualizado.
export function frutaAgora(m) {
  const s = seg(m);
  if (m.hp <= 0) return null;
  if (s.curaStatus && m.status) return { curaStatus: true };
  if (s.curaEm && m.hp <= Math.floor(m.stats.hp * s.curaEm.fracao)) {
    const cura = s.curaEm.cura ?? Math.max(1, Math.floor(m.stats.hp * s.curaEm.fracaoCura));
    return m.hp < m.stats.hp ? { cura } : null;
  }
  return null;
}
// status que o item tenta se auto-infligir no fim do turno (Orbe de Fogo/Tóxico) — null se não tem ou já tem
// status. Devolve o status de VERDADE ('toxic' vira 'poison' pra `aplicarStatus`; golpe.js soma o `vol.toxico`).
export function statusDoItem(m) {
  const s = seg(m);
  if (!s.statusFimTurno || m.status) return null;
  return s.statusFimTurno === 'toxic' ? 'poison' : s.statusFimTurno;
}
/* Fim de turno: quanto o item cura (>0) ou machuca (<0).
   `tiposAtuais` vem de fora (regras.tiposDefensivos, passado por golpe.js) porque este arquivo NÃO pode importar
   regras.js — o grafo é o contrário, regras.js importa daqui. Sem isso o Lodo Negro olharia os tipos de origem e
   ignoraria a Terastalização: quem vira Tera Veneno tem de passar a ser CURADO, e o Venenoso que vira Tera de
   outro tipo passa a se machucar, como nos jogos. */
export function fimDeTurnoDoItem(m, tiposAtuais = m?.data?.types || []) {
  const s = seg(m);
  if (!s.curaFimTurno) return 0;
  const combina = !s.soTipo || tiposAtuais.includes(s.soTipo);
  if (combina) return m.hp < m.stats.hp ? Math.max(1, Math.floor(m.stats.hp * s.curaFimTurno)) : 0;
  return -Math.max(1, Math.floor(m.stats.hp * (s.danoFimTurno || 0)));
}
