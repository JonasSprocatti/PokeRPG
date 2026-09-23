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
// Puro (sem DOM): testado em tests/segurados.test.js.
import { ITENS_SEGURADOS } from './dados.js';

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
  'lum-berry': { curaStatus: true, gastaNoUso: true }
};
// o que este Pokémon está segurando (objeto vazio = nada)
export const seg = m => SEGURADOS[m?.item] || {};
export const temSegurado = m => !!SEGURADOS[m?.item];
// itens segurados que existem na mochila/loja (dados.js) — o teste confere que as duas listas batem
export const IDS_SEGURADOS = Object.keys(ITENS_SEGURADOS);

// Multiplicador de dano do item de quem ataca. `ef` = eficácia de tipo (2, 1, 0.5…), `fisico` = golpe físico.
export function multDanoDoItem(m, { ef = 1, fisico = true } = {}) {
  const s = seg(m);
  if (!s.multDano) return 1;
  if (s.soSuperEfetivo && ef <= 1) return 1;
  if (s.soFisico && !fisico) return 1;
  if (s.soEspecial && fisico) return 1;
  return s.multDano;
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
