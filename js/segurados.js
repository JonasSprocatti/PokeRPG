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
// Puro (sem DOM): testado em tests/segurados.test.js.
// (Vínculo de Batalha, Pedra Mega e Cristal Z NÃO entram aqui: são itens de UMA gimmick só, checados direto
// pelo id — `M.item === ITEM_VINCULO` etc. — no módulo da própria gimmick, não por gancho genérico.)
import { ITENS_SEGURADOS, ITENS_RAIDE_SEGURADOS } from './dados.js';

export const SEGURADOS = {
  leftovers: { curaFimTurno: 1 / 16 },
  'black-sludge': { curaFimTurno: 1 / 16, soTipo: 'poison', danoFimTurno: 1 / 8 },
  'life-orb': { multDano: 1.3, recuoPorGolpe: 0.1 },
  'focus-sash': { aguentaCheio: true, gastaNoUso: true },
  'shell-bell': { drenaDano: 1 / 8 },
  'rocky-helmet': { espetos: 1 / 6 },
  'expert-belt': { multDano: 1.2, soSuperEfetivo: true },
  'muscle-band': { multDano: 1.1, soFisico: true },
  'wise-glasses': { multDano: 1.1, soEspecial: true },
  'assault-vest': { multStat: { 'special-defense': 1.5 }, semStatus: true },
  'oran-berry': { curaEm: { fracao: 0.5, cura: 10 }, gastaNoUso: true },
  'sitrus-berry': { curaEm: { fracao: 0.5, fracaoCura: 0.25 }, gastaNoUso: true },
  'lum-berry': { curaStatus: true, gastaNoUso: true },
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
  'presa-da-lua': { drenaDano: 0.1 }
};
// o que este Pokémon está segurando (objeto vazio = nada)
export const seg = m => SEGURADOS[m?.item] || {};
export const temSegurado = m => !!SEGURADOS[m?.item];
// itens segurados que existem na mochila/loja (dados.js) — o teste confere que as duas listas batem
export const IDS_SEGURADOS = [...Object.keys(ITENS_SEGURADOS), ...Object.keys(ITENS_RAIDE_SEGURADOS)];

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
export function resisteDoItem(m, tipo) {
  const s = seg(m);
  return (s.resisteTipo && tipo && s.resisteTipo.tipos.includes(tipo)) ? s.resisteTipo.mult : 1;
}
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
// fim de turno: quanto o item cura (>0) ou machuca (<0)
export function fimDeTurnoDoItem(m) {
  const s = seg(m);
  if (!s.curaFimTurno) return 0;
  const combina = !s.soTipo || m.data.types.includes(s.soTipo);
  if (combina) return m.hp < m.stats.hp ? Math.max(1, Math.floor(m.stats.hp * s.curaFimTurno)) : 0;
  return -Math.max(1, Math.floor(m.stats.hp * (s.danoFimTurno || 0)));
}
