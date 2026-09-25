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
//   semCritico             golpe contra você nunca sai crítico (Battle Armor, Shell Armor) (calcDamage)
//   focoBase: n            já começa com n degraus de crítico, somados ao do golpe e ao Focus Energy (calcDamage)
//   estagioAoEntrar: [stat, n]  ao entrar em campo, sobe n desse atributo no PRÓPRIO (batalha.intimidar)
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
//   terrenoAoEntrar: terreno ao entrar em campo, muda o chão (batalha.js / mp-motor) — Electric Surge…
//   multStatTerreno: {terreno:{stat:n}}  atributo × n naquele terreno, se estiver no chão (effStat) — Surge Surfer
//   danoTipo: {tipo: n}    golpe desse tipo ×n (calcDamage) — Steelworker, Transistor, Water Bubble
//   danoTipoClima: {clima:{tipos:[t], mult}}  golpe desses tipos ×mult naquele clima (calcDamage) — Sand Force
//   golpesFamilia: {soco|mordida|corte: n}  golpes da família (regras.FAMILIAS_GOLPE, por nome) ×n — Iron Fist, Strong Jaw, Sharpness
//   recuo: n               golpe com dano de recuo ×n (calcDamage) — Reckless
//   superEfetivoCausado: n dano super efetivo CAUSADO × n (calcDamage) — Neuroforce
//   critContraStatus: ail  crítico garantido contra alvo com esse status (calcDamage) — Merciless
//   abaixoDeMetade: {stat: n}  atributo × n com HP ≤ 1/2 (effStat) — Defeatist
//   soStatus: [ail]        restringe o `comStatus` a esses status (effStat / calcDamage) — Toxic Boost, Flare Boost
//   ignoraEstagios         ignora os degraus de atributo/precisão do OUTRO lado (effStat / chanceAcerto) — Unaware
//   inverteEstagios / dobraEstagios  toda mudança de degrau é invertida (Contrary) / dobrada (Simple) (golpe.mudarEstagios)
//   espelhaQueda           queda de atributo causada por outro volta pra quem causou (golpe.mudarEstagios) — Mirror Armor
//   aoSerBaixado: [stat, n]  ao ter um atributo baixado por outro, sobe n desse atributo (golpe.mudarEstagios) — Defiant, Competitive
//   aoNocautear: [stat, n]   ao derrubar o alvo com um golpe, sobe n desse atributo do PRÓPRIO (golpe.js) — Moxie, Grim/Chilling Neigh
//   aoSerAtingido: [{tipos?, cls?, soCritico?, estagios?: [[stat,n]], clima?, terreno?}]  reação a levar golpe de dano
//                          (golpe.reagirAoGolpe, uma vez por golpe) — Steam Engine, Stamina, Weak Armor, Anger Point, Sand Spit…
//   limitaStatus: n        golpe de STATUS alheio contra você tem no máximo n% de precisão (chanceAcerto) — Wonder Skin
//   analisa                ao entrar, sobe Ataque ou At. Esp. conforme a defesa do oponente (golpe.aoEntrarEmCampo) — Download
//   intimidaSobe           Intimidate sobe o seu Ataque em vez de baixar (golpe.aoEntrarEmCampo) — Guard Dog
//   imuneIntimidacao       Intimidate não te afeta (golpe.aoEntrarEmCampo) — Inner Focus, Own Tempo, Oblivious
//   contato também aceita: sorteio [[status,peso]] (sorteia um), estagio [stat,n] (baixa quem encosta), po (não pega Grama/Overcoat)
//   imunePo                não pega os pós do `contato` (Overcoat)
//   toque: {status, chance}  golpe físico SEU pode causar esse status no alvo (golpe.js) — Poison Touch
//   semDanoIndireto        nenhum dano que não seja de golpe direto: veneno, queimadura, recuo, armadilha, espinhos… — Magic Guard
//   curaComVeneno: fração  o veneno CURA essa fração do HP máx. por turno em vez de machucar (golpe.fimDeTurno) — Poison Heal
//   pressao                quem usa golpe contra você gasta 1 PP a mais (golpe.usarGolpe) — Pressure
//   preguica               só age em turnos alternados (golpe.usarGolpe) — Truant
//   formaDoClima           os tipos e o sprite acompanham o tempo (golpe.ajustarForma) — Forecast, do Castform
//   bloqueiaPrioridade     golpe de prioridade contra você não passa (golpe.usarGolpe) — Dazzling, Queenly Majesty, Armor Tail
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
  'magic-guard': { imuneClima: ['areia', 'granizo'], semDanoIndireto: true },
  hydration: { curaStatusClima: 'chuva' }, 'leaf-guard': { semStatusClima: 'sol' },
  // terrenos: ligam o campo ao entrar, ou se aproveitam dele
  'electric-surge': { terrenoAoEntrar: 'eletrico' }, 'grassy-surge': { terrenoAoEntrar: 'grama' },
  'psychic-surge': { terrenoAoEntrar: 'psiquico' }, 'misty-surge': { terrenoAoEntrar: 'fada' },
  'surge-surfer': { multStatTerreno: { eletrico: { speed: 2 } } },
  overcoat: { imuneClima: ['areia', 'granizo'], semSecundario: true, imunePo: true },
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
  'thick-fat': { resiste: { fire: 0.5, ice: 0.5 } }, heatproof: { resiste: { fire: 0.5 } },
  'water-bubble': { resiste: { fire: 0.5 }, imuneStatus: ['burn'], danoTipo: { water: 2 } },   // resiste a Fogo, não queima E dobra os golpes de Água
  filter: { superEfetivo: 0.75 }, 'solid-rock': { superEfetivo: 0.75 }, 'prism-armor': { superEfetivo: 0.75 },
  multiscale: { hpCheio: 0.5 }, 'shadow-shield': { hpCheio: 0.5 }, sturdy: { aguenta: true },
  'wonder-guard': { soSuperEfetivo: true }, 'shield-dust': { semSecundario: true }, 'inner-focus': { semRecuo: true, imuneIntimidacao: true },
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
  'own-tempo': { imuneStatus: ['confusion'], imuneIntimidacao: true }, oblivious: { imuneStatus: ['confusion'], imuneIntimidacao: true },
  'early-bird': { sonoRapido: true }, 'shed-skin': { curaStatusFimTurno: 0.3 },
  // atributos que não caem
  'clear-body': { semQueda: 'todas' }, 'white-smoke': { semQueda: 'todas' }, 'full-metal-body': { semQueda: 'todas' },
  'hyper-cutter': { semQueda: ['attack'] }, 'keen-eye': { semQueda: ['accuracy'] }, 'big-pecks': { semQueda: ['defense'] },
  // contato
  static: { contato: { status: 'paralysis', chance: 30 } }, 'flame-body': { contato: { status: 'burn', chance: 30 } },
  'poison-point': { contato: { status: 'poison', chance: 30 } },
  'rough-skin': { contatoDano: 1 / 8 }, 'iron-barbs': { contatoDano: 1 / 8 },
  // outros
  'speed-boost': { fimTurno: 'speed' }, intimidate: { intimida: true }, 'run-away': { fuga: true },
  // Aegislash: golpe de dano vira a Forma Lâmina, King's Shield volta pra Forma Escudo (golpe.trocarPostura).
  // As duas formas são o MESMO Pokémon com Ataque/Defesa e At.Esp./Def.Esp. trocados entre si — por isso dá pra
  // fazer sem buscar a outra forma na API: é só espelhar os atributos base.
  'stance-change': { postura: { ataque: ['attack', 'defense'], especial: ['special-attack', 'special-defense'] } },

  /* ---- leva nova: tudo aqui reusa gancho que já existia (uma linha cada), menos `semCritico`, que é o único
     gancho novo desta leva (calcDamage). Ampliar a lista assim é barato e seguro; comportamento novo é que
     custa caro. Quando algo é uma SIMPLIFICAÇÃO do efeito real, está dito na linha — a ficha diz "✓ ativa em
     batalha", e prometer o que não se cumpre é pior do que não implementar. ---- */
  // absorções de tipo que faltavam
  'earth-eater': { absorve: 'ground', cura: 0.25 },
  'well-baked-body': { absorve: 'fire', estagio: ['defense', 2] },
  // crítico não passa (gancho novo)
  'battle-armor': { semCritico: true }, 'shell-armor': { semCritico: true },
  // status
  'thermal-exchange': { imuneStatus: ['burn'], aoSerAtingido: [{ tipos: ['fire'], estagios: [['attack', 1]] }] }, 'pastel-veil': { imuneStatus: ['poison'] },
  // Purifying Salt não pega status NENHUM e ainda resiste a Fantasma
  'purifying-salt': { imuneStatus: ['poison', 'burn', 'paralysis', 'sleep', 'freeze', 'confusion'], resiste: { ghost: 0.5 } },
  // precisão
  'victory-star': { precisao: 1.1 },
  // No Guard faz o golpe acertar sempre; aqui isso vira precisão altíssima — a diferença só apareceria num golpe
  // que errasse de propósito, e o efeito prático é o mesmo. Vale só pros SEUS golpes (o gancho é de quem ataca).
  'no-guard': { precisao: 5 },
  // atributos que não caem
  illuminate: { semQueda: ['accuracy'] },
  // clima: as versões "extremas" entram como o clima normal — o jogo não modela tempo que não pode ser trocado
  'desolate-land': { climaAoEntrar: 'sol' }, 'primordial-sea': { climaAoEntrar: 'chuva' },
  // força com status: cada uma pede o SEU status (veneno / queimadura), como no original — `soStatus` restringe o gancho
  // do Guts. Toxic Boost também não ignora a queimadura: ela só corta o dano de quem é queimado.
  'toxic-boost': { comStatus: { attack: 1.5 }, soStatus: ['poison'] }, 'flare-boost': { comStatus: { 'special-attack': 1.5 }, soStatus: ['burn'] },

  /* ---- segunda leva ----
     Vários efeitos famosos são, na conta, a MESMA coisa que dobrar um atributo — e isso o motor já sabia fazer.
     Fur Coat ("dano físico pela metade") é Defesa ×2; Ice Scales ("dano especial pela metade") é Def. Esp. ×2.
     Escrever assim não é atalho: é a mesma matemática, e reusa o caminho já testado em vez de abrir um novo. */
  'fur-coat': { multStat: { defense: 2 } },            // dano físico pela metade
  'ice-scales': { multStat: { 'special-defense': 2 } }, // dano especial pela metade
  'grass-pelt': { multStatTerreno: { grama: { defense: 1.5 } } },
  'flower-gift': { multStatClima: { sol: { attack: 1.5, 'special-defense': 1.5 } } },
  // crítico mais fácil (gancho novo `focoBase`, somado ao do golpe e ao Focus Energy)
  'super-luck': { focoBase: 1 },
  // sobe um atributo ao entrar em campo (gancho novo `estagioAoEntrar`, mesmo caminho da Intimidação)
  'intrepid-sword': { estagioAoEntrar: ['attack', 1] }, 'dauntless-shield': { estagioAoEntrar: ['defense', 1] },
  // Download lê os oponentes ao entrar: Defesa menor que Def. Esp. sobe o Ataque, senão o At. Esp. (golpe.aoEntrarEmCampo)
  download: { analisa: true },

  /* ---- terceira leva ----
     Daqui pra frente o poço secou: o que falta de habilidade famosa precisa de GANCHO NOVO no motor (dano por
     tipo do golpe, reação ao sofrer dano, bloqueio de prioridade…), e não de mais uma linha aqui. Estas três
     são as últimas que cabem no que já existe, e as três estão marcadas como PARCIAIS onde são. */
  // Guard Dog: a Intimidação sobe o Ataque em vez de baixar (gancho `intimidaSobe`). Antes estava escrita como Hyper
  // Cutter (nada baixa o Ataque), que era MAIS forte que o original — outros golpes que baixam Ataque a atingem.
  'guard-dog': { intimidaSobe: true },
  // Sand Force: imune à areia E golpes de Pedra/Solo/Aço ×1,3 nela (gancho `danoTipoClima`)
  'sand-force': { imuneClima: ['areia'], danoTipoClima: { areia: { tipos: ['rock', 'ground', 'steel'], mult: 1.3 } } },
  // Effect Spore: 30% de soltar o pó em quem encosta — sono 11, paralisia 9, veneno 10 (pesos do jogo), e Grama não pega
  'effect-spore': { contato: { chance: 30, sorteio: [['sleep', 11], ['paralysis', 9], ['poison', 10]], po: true } },

  /* ---- quarta leva: habilidades que faltavam, cada uma com o gancho fiel ----
     Os ganchos novos estão documentados no topo. Onde o original faz algo que o jogo não modela, está dito na linha. */
  // reforço de tipo (gancho `danoTipo`)
  steelworker: { danoTipo: { steel: 1.5 } }, transistor: { danoTipo: { electric: 1.3 } },
  'dragons-maw': { danoTipo: { dragon: 1.5 } }, 'rocky-payload': { danoTipo: { rock: 1.5 } },
  // reforço por família de golpe (a lista de nomes mora em regras.FAMILIAS_GOLPE)
  'iron-fist': { golpesFamilia: { soco: 1.2 } }, 'strong-jaw': { golpesFamilia: { mordida: 1.5 } }, sharpness: { golpesFamilia: { corte: 1.5 } },
  reckless: { recuo: 1.2 }, neuroforce: { superEfetivoCausado: 1.25 }, merciless: { critContraStatus: 'poison' },
  // Defeatist: Ataque e At. Esp. pela metade com HP ≤ 1/2
  defeatist: { abaixoDeMetade: { attack: 0.5, 'special-attack': 0.5 } },
  // degraus de atributo: Unaware também ignora precisão/evasão; Contrary e Simple valem pra qualquer origem
  unaware: { ignoraEstagios: true }, contrary: { inverteEstagios: true }, simple: { dobraEstagios: true },
  'mirror-armor': { espelhaQueda: true },
  defiant: { aoSerBaixado: ['attack', 2] }, competitive: { aoSerBaixado: ['special-attack', 2] },
  // ao derrubar: sobe um atributo (Beast Boost, que escolhe o maior atributo, ficou de fora)
  moxie: { aoNocautear: ['attack', 1] }, 'chilling-neigh': { aoNocautear: ['attack', 1] }, 'grim-neigh': { aoNocautear: ['special-attack', 1] },
  // ao levar golpe (uma reação por golpe, mesmo de vários acertos)
  'steam-engine': { aoSerAtingido: [{ tipos: ['fire', 'water'], estagios: [['speed', 6]] }] },
  'water-compaction': { aoSerAtingido: [{ tipos: ['water'], estagios: [['defense', 2]] }] },
  justified: { aoSerAtingido: [{ tipos: ['dark'], estagios: [['attack', 1]] }] },
  rattled: { aoSerAtingido: [{ tipos: ['bug', 'dark', 'ghost'], estagios: [['speed', 1]] }] },
  stamina: { aoSerAtingido: [{ estagios: [['defense', 1]] }] },
  'weak-armor': { aoSerAtingido: [{ cls: 'physical', estagios: [['defense', -1], ['speed', 2]] }] },
  'anger-point': { aoSerAtingido: [{ soCritico: true, estagios: [['attack', 6]] }] },
  'sand-spit': { aoSerAtingido: [{ clima: 'areia' }] }, 'seed-sower': { aoSerAtingido: [{ terreno: 'grama' }] },
  // Wonder Skin: golpe de status alheio contra você acerta no máximo 50%
  'wonder-skin': { limitaStatus: 50 },
  // contato
  gooey: { contato: { chance: 100, estagio: ['speed', -1] } }, 'tangling-hair': { contato: { chance: 100, estagio: ['speed', -1] } },
  'poison-touch': { toque: { status: 'poison', chance: 30 } },
  'poison-heal': { curaComVeneno: 1 / 8 },
  pressure: { pressao: true }, truant: { preguica: true },
  dazzling: { bloqueiaPrioridade: true }, 'queenly-majesty': { bloqueiaPrioridade: true }, 'armor-tail': { bloqueiaPrioridade: true },
  // entram em campo ligando o clima/terreno E dando o bônus junto (o bônus é de 1,33 no jogo: 5461/4096)
  'hadron-engine': { terrenoAoEntrar: 'eletrico', multStatTerreno: { eletrico: { 'special-attack': 1.33 } } },
  'orichalcum-pulse': { climaAoEntrar: 'sol', multStatClima: { sol: { attack: 1.33 } } },
  // Castform: a forma (tipos e sprite) acompanha o tempo — inclusive o padrão da rota (golpe.ajustarForma)
  forecast: { formaDoClima: true }
  /* FICARAM DE FORA de propósito, por não ter como ser fiel: Sticky Hold protege o item segurado, mas nenhum golpe do
     jogo rouba ou derruba item; Regenerator e Natural Cure agem ao TROCAR de Pokémon, e você nunca troca; Beast Boost
     e Analytic precisam de leitura (maior atributo, ordem do turno) que o motor não expõe; Mold Breaker & cia. pedem
     ignorar a habilidade do alvo em todo cálculo. Habilidade sem efeito fiel fica como descrição: a ficha só promete
     "✓ ativa em batalha" pra quem está aqui. */
};
export const hab = m => HABILIDADES[m?.ability] || {};
/* A habilidade muda com a evolução (Gible → Garchomp mantém Sand Veil; Rattata → Raticate troca Run Away por Guts).
   Regra: fica no MESMO slot — oculta continua oculta, normal continua na mesma posição; se a forma nova tem menos
   slots, cai no primeiro equivalente. Antes usávamos o índice cru na lista inteira, que embaralhava oculta com normal
   quando a forma nova tinha número diferente de habilidades. Devolve o NOME da habilidade nova. */
export function habilidadeDaEvolucao(velhas = [], novas = [], atual) {
  if (!novas.length) return atual;
  if (velhas.find(a => a.name === atual)?.hidden) return (novas.find(a => a.hidden) || novas[0]).name;
  const normais = novas.filter(a => !a.hidden);
  const i = velhas.filter(a => !a.hidden).findIndex(a => a.name === atual);
  return (normais[Math.max(0, i)] || normais[0] || novas[0]).name;
}
// tem efeito de verdade em batalha? (a ficha mostra "✓ ativa em batalha"; as outras, "será ajustado em atualizações futuras")
export const IMPL = new Set(Object.keys(HABILIDADES));
