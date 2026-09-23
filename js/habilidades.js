/* ============ habilidades (dados) ============ */
// Cada habilidade é uma LINHA de dados que liga comportamentos já implementados no motor (regras.js / golpe.js).
// Só as que estão aqui têm efeito em batalha ("✓ ativa em batalha"); as outras são só descrição.
// Pra adicionar uma: se o comportamento já existe (ex.: `imuneStatus`), é só uma linha. Comportamento novo = um
// gancho novo no motor + teste. Sem imports: importável no Node (tests/habilidades.test.js).
//
// Ganchos (quem lê):
//   pinch: tipo            golpe desse tipo ×1,5 com HP ≤ 1/3 (calcDamage)
//   stab: n                multiplicador do STAB no lugar de 1,5 (calcDamage)
//   tecnico                golpe de poder ≤ 60 ×1,5 (calcDamage)
//   critico: n             multiplicador do crítico no lugar de 1,5 (calcDamage)
//   multStat: {stat: n}    atributo × n sempre (effStat)
//   comStatus: {stat: n}   atributo × n quando tem status; ignora a queda de velocidade da paralisia / do ataque da queimadura (effStat, calcDamage)
//   precisao: n            precisão dos próprios golpes × n (chanceAcerto); precisaoFisica: n só nos físicos
//   resiste: {tipo: n}     dano recebido desse tipo × n (calcDamage)
//   superEfetivo: n        dano super efetivo recebido × n; poucoEfetivo: n  dano pouco efetivo CAUSADO × n (calcDamage)
//   hpCheio: n             dano recebido com HP cheio × n (calcDamage)
//   imuneTipo: tipo        imune a golpes desse tipo (golpe.js)
//   absorve: tipo          golpe desse tipo não causa dano e: cura (fração do HP máx.), estagio [stat, n] ou flashFire (golpe.js)
//   soSuperEfetivo         só golpe super efetivo acerta (Wonder Guard) (golpe.js)
//   imuneStatus: [ail]     não pega esses status (inclui 'confusion') (golpe.js / imuneAoStatusMon)
//   semQueda: [stat]|'todas'  outro Pokémon não consegue baixar esses atributos (golpe.js)
//   semRecuo               não recua (flinch) (golpe.js)
//   contato: {status, chance}   quem acerta com golpe físico pode pegar o status (golpe.js)
//   contatoDano: fração    quem acerta com golpe físico perde essa fração do HP máx. (golpe.js)
//   aguenta                com HP cheio, sobrevive com 1 a um golpe que derrubaria (Sturdy) (golpe.js)
//   semDanoRecuo           não sofre dano de recuo dos próprios golpes (golpe.js)
//   maxAcertos             golpe de vários acertos sempre acerta o máximo (golpe.js)
//   chanceSecundaria: n    chance de efeito secundário dos próprios golpes × n (golpe.js)
//   semSecundario          imune aos efeitos secundários de golpes alheios (golpe.js)
//   sonoRapido             acorda duas vezes mais rápido (golpe.js)
//   fimTurno: stat         +1 nesse atributo no fim de todo turno (golpe.js)
//   curaStatusFimTurno: p  chance p de curar o próprio status no fim do turno (golpe.js)
//   intimida               ao entrar, baixa o Ataque do(s) oponente(s) (batalha.js)
//   fuga                   sempre consegue fugir de selvagem (consegueFugir)
//   climaAoEntrar: clima   ao entrar em campo, muda o tempo (batalha.js / mp-motor) — Drizzle, Drought…
//   multStatClima: {clima:{stat:n}}  atributo × n naquele clima (effStat) — Swift Swim, Chlorophyll…
//   curaClima: {clima: fração}  recupera essa fração do HP máx. por turno naquele clima (golpe.fimDeTurno)
//   danoClimaProprio: {clima: fração}  perde HP por turno naquele clima (Dry Skin no sol)
//   imuneClima: [clima]    não sofre o dano de areia/granizo (golpe.fimDeTurno / danoClima)
//   escondeNoClima: [clima]  quem ataca você erra mais naquele clima (chanceAcerto) — Sand Veil, Snow Cloak
//   curaStatusClima: clima   cura o próprio status por turno naquele clima (Hydration)
//   semStatusClima: clima    não pega status naquele clima (Leaf Guard)
export const HABILIDADES = {
  // clima: ligam o tempo ao entrar em campo ou se aproveitam dele
  drizzle: { climaAoEntrar: 'chuva' }, drought: { climaAoEntrar: 'sol' }, 'sand-stream': { climaAoEntrar: 'areia' }, 'snow-warning': { climaAoEntrar: 'neve' },
  'swift-swim': { multStatClima: { chuva: { speed: 2 } } }, chlorophyll: { multStatClima: { sol: { speed: 2 } } },
  'sand-rush': { multStatClima: { areia: { speed: 2 } }, imuneClima: ['areia'] },
  'slush-rush': { multStatClima: { granizo: { speed: 2 }, neve: { speed: 2 } }, imuneClima: ['granizo'] },
  'solar-power': { multStatClima: { sol: { 'special-attack': 1.5 } }, danoClimaProprio: { sol: 1 / 8 } },
  'rain-dish': { curaClima: { chuva: 1 / 16 } }, 'ice-body': { curaClima: { granizo: 1 / 16, neve: 1 / 16 }, imuneClima: ['granizo'] },
  'dry-skin': { curaClima: { chuva: 1 / 8 }, danoClimaProprio: { sol: 1 / 8 }, absorve: 'water', cura: 0.25 },
  'sand-veil': { escondeNoClima: ['areia'], imuneClima: ['areia'] }, 'snow-cloak': { escondeNoClima: ['granizo', 'neve'], imuneClima: ['granizo'] },
  'magic-guard': { imuneClima: ['areia', 'granizo'] },
  hydration: { curaStatusClima: 'chuva' }, 'leaf-guard': { semStatusClima: 'sol' },
  overcoat: { imuneClima: ['areia', 'granizo'], semSecundario: true },
  // força em apuros
  overgrow: { pinch: 'grass' }, blaze: { pinch: 'fire' }, torrent: { pinch: 'water' }, swarm: { pinch: 'bug' },
  // ataque
  adaptability: { stab: 2 }, technician: { tecnico: true }, sniper: { critico: 2.25 },
  'huge-power': { multStat: { attack: 2 } }, 'pure-power': { multStat: { attack: 2 } },
  hustle: { multStat: { attack: 1.5 }, precisaoFisica: 0.8 },
  guts: { comStatus: { attack: 1.5 } }, 'quick-feet': { comStatus: { speed: 1.5 } }, 'marvel-scale': { comStatus: { defense: 1.5 } },
  'compound-eyes': { precisao: 1.3 }, 'tinted-lens': { poucoEfetivo: 2 },
  'skill-link': { maxAcertos: true }, 'serene-grace': { chanceSecundaria: 2 }, 'rock-head': { semDanoRecuo: true },
  // defesa
  'thick-fat': { resiste: { fire: 0.5, ice: 0.5 } }, heatproof: { resiste: { fire: 0.5 } }, 'water-bubble': { resiste: { fire: 0.5 } },
  filter: { superEfetivo: 0.75 }, 'solid-rock': { superEfetivo: 0.75 }, 'prism-armor': { superEfetivo: 0.75 },
  multiscale: { hpCheio: 0.5 }, 'shadow-shield': { hpCheio: 0.5 }, sturdy: { aguenta: true },
  'wonder-guard': { soSuperEfetivo: true }, 'shield-dust': { semSecundario: true }, 'inner-focus': { semRecuo: true },
  // imunidades e absorções de tipo
  levitate: { imuneTipo: 'ground' },
  'flash-fire': { absorve: 'fire', flashFire: true },
  'volt-absorb': { absorve: 'electric', cura: 0.25 }, 'water-absorb': { absorve: 'water', cura: 0.25 }, // 'dry-skin' está lá em cima, com a parte de clima junto
  'lightning-rod': { absorve: 'electric', estagio: ['special-attack', 1] }, 'storm-drain': { absorve: 'water', estagio: ['special-attack', 1] },
  'motor-drive': { absorve: 'electric', estagio: ['speed', 1] }, 'sap-sipper': { absorve: 'grass', estagio: ['attack', 1] },
  // status
  immunity: { imuneStatus: ['poison'] }, limber: { imuneStatus: ['paralysis'] },
  insomnia: { imuneStatus: ['sleep'] }, 'vital-spirit': { imuneStatus: ['sleep'] }, 'sweet-veil': { imuneStatus: ['sleep'] },
  'water-veil': { imuneStatus: ['burn'] }, 'magma-armor': { imuneStatus: ['freeze'] },
  'own-tempo': { imuneStatus: ['confusion'] }, oblivious: { imuneStatus: ['confusion'] },
  'early-bird': { sonoRapido: true }, 'shed-skin': { curaStatusFimTurno: 0.3 },
  // atributos que não caem
  'clear-body': { semQueda: 'todas' }, 'white-smoke': { semQueda: 'todas' }, 'full-metal-body': { semQueda: 'todas' },
  'hyper-cutter': { semQueda: ['attack'] }, 'keen-eye': { semQueda: ['accuracy'] }, 'big-pecks': { semQueda: ['defense'] },
  // contato
  static: { contato: { status: 'paralysis', chance: 30 } }, 'flame-body': { contato: { status: 'burn', chance: 30 } },
  'poison-point': { contato: { status: 'poison', chance: 30 } },
  'rough-skin': { contatoDano: 1 / 8 }, 'iron-barbs': { contatoDano: 1 / 8 },
  // outros
  'speed-boost': { fimTurno: 'speed' }, intimidate: { intimida: true }, 'run-away': { fuga: true }
};
export const hab = m => HABILIDADES[m?.ability] || {};
// tem efeito de verdade em batalha? (a ficha mostra "✓ ativa em batalha"; as outras, "será ajustado em atualizações futuras")
export const IMPL = new Set(Object.keys(HABILIDADES));
