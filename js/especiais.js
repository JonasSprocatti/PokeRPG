/* ============ golpes especiais (dados) ============ */
// Golpes cujo efeito NÃO cabe no "meta" genérico da PokéAPI (dano/status/atributos/dreno/cura/acertos), que o motor
// (golpe.js) já cobre sozinho. Cada linha liga um comportamento do motor, como em habilidades.js.
// Escolhidos pela auditoria (docs/auditoria-batalha.md): os mais aprendidos por nível que não dependem de clima,
// itens segurados ou troca de Pokémon (esses vêm com os sistemas deles). Sem imports: importável no Node.
//
// Comportamentos:
//   protege          fica protegido neste turno (golpes contra ele falham); repetir seguido tem chance 1/3, 1/9…
//   aguentaTurno     neste turno sobrevive com 1 HP a qualquer golpe (Endure)
//   foco: n          +n no estágio de crítico até o fim da batalha (Focus Energy)
//   descanso         cura todo o HP e o status, e dorme 2 turnos (Rest)
//   autoDesmaio      quem usa desmaia depois (Explosion, Self-Destruct, Memento)
//   ohko             derruba na hora se acertar: acerto = 30% + diferença de nível; falha contra nível maior; Sturdy barra
//   soDormindo       só funciona com o alvo dormindo (Dream Eater)
//   toxico           envenena gravemente: 1/16, 2/16, 3/16… por turno
//   semente          planta: 1/8 do HP do alvo por turno vai pra quem plantou (Leech Seed). Tipo Planta é imune
//   carga            gasta 1 turno carregando e ataca no seguinte; invulneravel = some nesse turno (Fly, Dig…)
//   recarga          no turno seguinte quem usou não age (Hyper Beam)
//   furia            ataca sozinho por 2–3 turnos e depois fica confuso (Thrash, Outrage)
//   poder: fórmula   poder calculado na hora (poderEspecial em regras.js)
//   atkDe/atkDoAlvo/defDe   o golpe ataca ou defende por OUTRO atributo (Body Press, Foul Play, Psyshock) — ver a tabela
//   danoIgualHp      o alvo fica com o HP de quem usou (Endeavor)
//   soPrimeiroTurno  só funciona no primeiro golpe que você dá na batalha (Fake Out, First Impression)
//   soSeAlvoAtaca    só funciona se o alvo escolheu um golpe de DANO neste turno e ainda não agiu (Sucker Punch, Thunderclap)
//   clima: tipo      muda o tempo da batalha por CLIMA_TURNOS (Rain Dance, Sunny Day, Sandstorm, Hail, Snowscape)
//   terreno: tipo    muda o chão por TERRENO_TURNOS (Electric/Grassy/Psychic/Misty Terrain)
//   lado: campo      liga algo no SEU lado do campo (Reflect, Light Screen, Aurora Veil, Safeguard, Mist, Tailwind)
//   soNoGelo         esse golpe só funciona com granizo ou neve (Aurora Veil)
//   armadilha: tipo  põe Stealth Rock / Spikes / Toxic Spikes no lado do inimigo (pega quem entrar depois)
//   forcaSaida       tira o alvo de campo sem derrubá-lo (Roar, Whirlwind, Dragon Tail, Circle Throw): selvagem foge, treinador
//                    manda outro, no seu lado quem levou sai da luta (batalha.forcarSaida; em sala o golpe falha)
//   prende           o alvo não consegue mais fugir (Mean Look, Block, Spider Web); Fantasma é imune
//   passaBonus       passa os estágios de quem usa para um aliado em campo (Baton Pass) — ninguém troca de Pokémon aqui
//   revezamento      QUEM USA sai de campo (U-turn, Volt Switch, Flip Turn, Teleport, Parting Shot). Do seu lado é o
//                    🔄 revezamento: fica de fora até o fim da rodada e volta pelas armadilhas e pelas habilidades de
//                    entrada, com um aliado cobrindo — sem aliado em pé, falha (batalha.forcarSaida)
//   trava: tipo      restringe os golpes do ALVO (regras.motivoBloqueio): provocar (Taunt: só dano), encore (repete o último),
//                    disable (desativa o último), tormento (não repete o golpe anterior)
//   generoOposto     só funciona em quem é do gênero oposto de quem usa (Captivate); sem gênero de um dos dois, falha
//   viraTipo: [t]    o ALVO passa a ser desse tipo (Soak: Água pura). Vale pra defesa, STAB, status e terreno —
//                    a fonte é `regras.tiposDe`, e o tipo novo mora no `vol` (nunca em `m.data`, que é do cache)
//   ganhaTipo: t     ACRESCENTA um tipo ao alvo sem tirar os dele (Forest's Curse, Trick-or-Treat)
//   roubaItem        pega o item segurado do alvo, se quem usa está SEM item (Thief, Covet) — mesmo bloco de
//                    Pickpocket/Magician em golpe.js; Sticky Hold do alvo barra
//   derrubaItem      o item segurado do alvo se PERDE (Knock Off): não vai pra ninguém, e vale mesmo com quem
//                    usa já segurando algo; Sticky Hold barra
//   ajudaAliado: n   o próximo golpe do companheiro neste turno sai ×n (Helping Hand)
//   chamariz         o outro lado passa a mirar em quem usou até o fim da rodada (Follow Me, Rage Powder)
//   curaStatus       limpa o status de quem recebe (Heal Bell, Aromatherapy, Purify…); com `cura: fração` cura HP
//                    também, e com `sobeEstagios: [[stat, n]…]` sobe atributo (Take Heart)
//   soAliados        o golpe NÃO pega quem usou, só os companheiros (Coaching, Dragon Cheer); sem companheiro, falha
//   soPlusMinus      só afeta quem tem Plus ou Minus (Gear Up, Magnetic Flux)
//   statAleatorio: n sobe n estágios de um atributo sorteado (Acupressure)
//   focoDragao: n    `foco` vale n se quem recebe for do tipo Dragão (Dragon Cheer)
//   semEfeitoReal    nos jogos este golpe não faz nada mesmo (Hold Hands) — não é efeito faltando
//   gravidade        põe TODO mundo em campo no chão por GRAVIDADE_TURNOS (Gravity); golpe com a flag `gravity` falha
//   voa: n           levanta do chão por n turnos (Magnet Rise); `noAlvo` = levanta o ALVO (Telekinesis)
//   poeNoChao        o ALVO fica preso ao chão de vez (Smack Down, Thousand Arrows) — golpe de dano
//   bocejo/pesadeloGolpe/raiz/anel/cancaoFinal/desejo   efeitos resolvidos no fim do turno (golpe.fimDeTurno)
//   limpaEstagios/copiaEstagios/tambor/inverteEstagios/divideHp/trocaProprios/trocaEstagios/trocaStat/mediaStat
//                    contas sobre os estágios e atributos que o motor já guarda (Haze, Psych Up, Belly Drum…)
//   danoFixo         dano que NÃO passa pela fórmula (regras.danoFixoDe): número, nivel, nivelVariado, metadeDoAlvo, hpProprio
//   copia: de-onde   roda um golpe que não é o escolhido (Metronome, Mirror Move, Sleep Talk…) — golpe.usarCopia
//   guardaNoSlot     o golpe copiado FICA no seu moveset (Mimic: até o fim da luta; Sketch: 'permanente')
//   exigeFlag/mult/repete/soNoSono   a flag que o golpe copiado precisa ter · poder ×n · o ALVO repete (Instruct) · só dormindo
//   transforma       quem usa vira uma cópia do alvo (Transform)
//   substituto: frac paga essa fração do HP máx. e põe um boneco que leva o golpe no lugar (Substitute, Shed Tail)
//   copiaHabilidade/trocaHabilidade/poeHabilidade/anulaHabilidade   Role Play, Skill Swap, Simple Beam, Gastro Acid
export const GOLPES_ESPECIAIS = {
  /* `protege` sozinho só bloqueia o golpe. `puneContato` = o que a barreira faz com quem encostou nela (golpe
     FÍSICO, a mesma regra de contato que Static e Elmo Rochoso já usam):
       estagio: [atributo, quanto]  baixa o atributo de quem atacou   dano: fração do HP máx.   status: envenena/queima
     Sem isso, King's Shield era um Protect comum — e o King's Shield existe justamente pra tirar o Ataque de quem
     tenta encostar no Aegislash. */
  protect: { protege: true }, detect: { protege: true },
  'spiky-shield': { protege: true, puneContato: { dano: 1 / 8 } },
  'kings-shield': { protege: true, puneContato: { estagio: ['attack', -2] }, voltaPostura: true },
  'baneful-bunker': { protege: true, puneContato: { status: 'poison' } },
  obstruct: { protege: true, puneContato: { estagio: ['defense', -2] } },
  'silk-trap': { protege: true, puneContato: { estagio: ['speed', -1] } },
  'burning-bulwark': { protege: true, puneContato: { status: 'burn' } },
  endure: { aguentaTurno: true },
  'focus-energy': { foco: 2 },
  rest: { descanso: true },
  'self-destruct': { autoDesmaio: true }, explosion: { autoDesmaio: true }, 'misty-explosion': { autoDesmaio: true }, memento: { autoDesmaio: true },
  fissure: { ohko: true }, guillotine: { ohko: true }, 'horn-drill': { ohko: true }, 'sheer-cold': { ohko: true },
  'dream-eater': { soDormindo: true },
  toxic: { toxico: true },
  'leech-seed': { semente: true },
  roar: { forcaSaida: true }, whirlwind: { forcaSaida: true }, 'dragon-tail': { forcaSaida: true }, 'circle-throw': { forcaSaida: true },
  // golpes de TROCA: quem usa sai. Dano primeiro (U-turn e cia. machucam), Teleport/Parting Shot são de status
  'u-turn': { revezamento: true }, 'volt-switch': { revezamento: true }, 'flip-turn': { revezamento: true },
  teleport: { revezamento: true }, 'parting-shot': { revezamento: true },
  /* Itens do ALVO. Os três só passaram a valer quando o selvagem começou a segurar item
     (dados.ITENS_DE_SELVAGEM, relato #77/#70): antes disso Thief acertava e não havia nada pra roubar, então
     ficaram de fora de propósito. `roubaItem` reusa o bloco de Pickpocket/Magician em golpe.js — a regra é a
     mesma (só rouba quem está sem item; Sticky Hold do alvo barra). `derrubaItem` é o Knock Off: o item não vai
     pra ninguém, se perde — e por isso ele funciona mesmo com quem usa já segurando algo. */
  thief: { roubaItem: true }, covet: { roubaItem: true },
  'knock-off': { derrubaItem: true },
  'mean-look': { prende: true }, block: { prende: true }, 'spider-web': { prende: true }, 'baton-pass': { passaBonus: true },
  taunt: { trava: 'provocar' }, encore: { trava: 'encore' }, disable: { trava: 'disable' }, torment: { trava: 'tormento' },
  // Captivate: os −2 de At.Esp. são comuns, o que a tabela acrescenta é a exigência de gênero (Attract não precisa
  // da linha: o efeito dele é o `ailment` infatuation, e aplicarStatus já confere o gênero)
  captivate: { generoOposto: true },
  // troca de tipo do ALVO: Soak é o motivo de `regras.tiposDe` existir (antes o tipo saía direto de `m.data`)
  soak: { viraTipo: ['water'] }, 'magic-powder': { viraTipo: ['psychic'] },
  'forests-curse': { ganhaTipo: 'grass' }, 'trick-or-treat': { ganhaTipo: 'ghost' },
  'solar-beam': { carga: true }, 'solar-blade': { carga: true }, 'sky-attack': { carga: true }, 'razor-wind': { carga: true },
  'skull-bash': { carga: true }, 'meteor-beam': { carga: true }, 'freeze-shock': { carga: true }, 'ice-burn': { carga: true },
  fly: { carga: true, invulneravel: true }, dig: { carga: true, invulneravel: true }, dive: { carga: true, invulneravel: true },
  bounce: { carga: true, invulneravel: true }, 'phantom-force': { carga: true, invulneravel: true }, 'shadow-force': { carga: true, invulneravel: true },
  'hyper-beam': { recarga: true }, 'giga-impact': { recarga: true }, 'blast-burn': { recarga: true }, 'hydro-cannon': { recarga: true },
  'frenzy-plant': { recarga: true }, 'rock-wrecker': { recarga: true }, 'roar-of-time': { recarga: true }, 'prismatic-laser': { recarga: true },
  'eternabeam': { recarga: true }, 'meteor-assault': { recarga: true },
  thrash: { furia: true }, outrage: { furia: true }, 'petal-dance': { furia: true }, 'raging-fury': { furia: true },
  flail: { poder: 'hpBaixo' }, reversal: { poder: 'hpBaixo' },
  eruption: { poder: 'hpAlto' }, 'water-spout': { poder: 'hpAlto' }, 'dragon-energy': { poder: 'hpAlto' },
  'gyro-ball': { poder: 'giroscopio' }, 'electro-ball': { poder: 'eletro' },
  hex: { poder: 'dobraAlvoComStatus' }, facade: { poder: 'dobraComStatus' }, venoshock: { poder: 'dobraAlvoEnvenenado' },
  brine: { poder: 'dobraAlvoMetade' },
  // peso (data.weight, em hectogramas): o do ALVO (Low Kick, Grass Knot) ou a razão entre os dois (Heavy Slam, Heat Crash).
  // Sem o peso no cache (registro baixado antes deste campo existir) a fórmula devolve null e vale o poder da tabela.
  'low-kick': { poder: 'pesoDoAlvo' }, 'grass-knot': { poder: 'pesoDoAlvo' },
  'heavy-slam': { poder: 'pesoRelativo' }, 'heat-crash': { poder: 'pesoRelativo' },
  'stored-power': { poder: 'estagios' }, 'power-trip': { poder: 'estagios' }, punishment: { poder: 'estagiosDoAlvo' },
  'wring-out': { poder: 'hpDoAlvo' }, 'crush-grip': { poder: 'hpDoAlvo' },
  /* Golpe que ataca ou defende por OUTRO atributo (calcDamage). Sem isso o par saía só do `cls` do golpe, e o
     dano ficava silenciosamente errado — não "sem efeito": Psyshock batia na Defesa Especial e o Body Press
     usava o Ataque de quem é feito pra bater com a Defesa.
       atkDe     atributo de QUEM USA que entra no lugar do Ataque
       atkDoAlvo o ataque é o do ALVO (Foul Play)
       defDe     atributo do ALVO que entra no lugar da Defesa */
  'body-press': { atkDe: 'defense' }, 'foul-play': { atkDoAlvo: true },
  psyshock: { defDe: 'defense' }, psystrike: { defDe: 'defense' }, 'secret-sword': { defDe: 'defense' },
  endeavor: { danoIgualHp: true },
  // só no primeiro golpe que o Pokémon dá na batalha (senão falha) — é o que segura o recuo do Fake Out
  'fake-out': { soPrimeiroTurno: true }, 'first-impression': { soPrimeiroTurno: true },
  // golpe de prioridade que é um "contra-ataque": falha se o alvo vai usar golpe de status (ou já agiu). `vol.golpeEscolhido` (golpe.js)
  'sucker-punch': { soSeAlvoAtaca: true }, thunderclap: { soSeAlvoAtaca: true },
  // clima (regras.CLIMAS): duram CLIMA_TURNOS e valem pros dois lados
  'rain-dance': { clima: 'chuva' }, 'sunny-day': { clima: 'sol' }, sandstorm: { clima: 'areia' },
  hail: { clima: 'granizo' }, snowscape: { clima: 'neve' },
  // `chillyreception` (sem hífen) ficou aqui de 05/10 a 13/10/2026 e NUNCA casou: o nome da PokéAPI tem hífen.
  // A entrada certa está na seção dos golpes que trocam de Pokémon, mais abaixo, com o `revezamento` que faltava.
  // terrenos (regras.TERRENOS): duram TERRENO_TURNOS e só valem pra quem está no chão
  'electric-terrain': { terreno: 'eletrico' }, 'grassy-terrain': { terreno: 'grama' },
  'psychic-terrain': { terreno: 'psiquico' }, 'misty-terrain': { terreno: 'fada' },
  // lado do campo (regras.LADO_VAZIO): telas e proteções valem pro SEU lado
  reflect: { lado: 'reflect' }, 'light-screen': { lado: 'luz' }, 'aurora-veil': { lado: 'veu', soNoGelo: true },
  safeguard: { lado: 'salvaguarda' }, mist: { lado: 'neblina' }, tailwind: { lado: 'vento' },
  // armadilhas: ficam no lado de QUEM RECEBE e pegam o próximo Pokémon que entrar em campo
  'stealth-rock': { armadilha: 'pedras' }, spikes: { armadilha: 'espinhos' }, 'toxic-spikes': { armadilha: 'toxinas' },
  /* 🤝 golpes de COMPANHEIRO. Quem monta a lista de quem recebe é golpe.alvosDoGolpe (pelo `target` da PokéAPI,
     dados.ALVOS_ALIADOS); aqui ficam só os efeitos que o `meta` não descreve. Os que vêm com atributos no `meta`
     (Howl, Coaching, Aromatic Mist, Gear Up, Magnetic Flux, Decorate) já funcionam pelo caminho comum. */
  'helping-hand': { ajudaAliado: 1.5 },
  'follow-me': { chamariz: true }, 'rage-powder': { chamariz: true },
  'heal-bell': { curaStatus: true }, aromatherapy: { curaStatus: true },
  'jungle-healing': { curaStatus: true },                      // o 1/4 de HP vem do `meta.heal` da PokéAPI
  'lunar-blessing': { curaStatus: true, cura: 1 / 4 },         // este não traz `heal` no meta: a fração fica aqui
  purify: { curaStatus: true, cura: 1 / 2 },                   // nos jogos quem cura o HP é QUEM USA; aqui é quem recebeu a cura do status
  'take-heart': { curaStatus: true, sobeEstagios: [['special-attack', 1], ['special-defense', 1]] },
  acupressure: { statAleatorio: 2 },
  'dragon-cheer': { foco: 1, focoDragao: 2, soAliados: true },
  coaching: { soAliados: true },                               // "falha se não houver companheiro" — os atributos vêm do meta
  'gear-up': { soPlusMinus: true }, 'magnetic-flux': { soPlusMinus: true },
  'hold-hands': { semEfeitoReal: true },

  /* ---- 🪐 chão e flutuação (regras.noChao, regras.eficacia) ----
     `gravidade` liga `campo.gravidade` por GRAVIDADE_TURNOS: todo mundo em campo é posto no chão (`vol.noSolo`),
     a flutuação cai e os golpes com a flag `gravity` ficam proibidos (regras.motivoBloqueio).
     `voa: n` levanta QUEM USA por n turnos (`vol.voando`): golpe Terrestre não alcança e o terreno não vale.
     `poeNoChao` derruba o ALVO de vez (Smack Down, Thousand Arrows): é golpe de DANO, aplicado depois de acertar. */
  gravity: { gravidade: true },
  'magnet-rise': { voa: 5 }, telekinesis: { voa: 3, noAlvo: true },
  'smack-down': { poeNoChao: true }, 'thousand-arrows': { poeNoChao: true },

  /* ---- ⏳ efeitos que só acontecem no FIM DO TURNO (golpe.fimDeTurno) ----
     Cada um vive num campo do `vol`, como a semente do Leech Seed, e morre com ela ao sair de campo. */
  yawn: { bocejo: true },            // 🥱 no fim do turno SEGUINTE o alvo dorme (vol.bocejo conta 2)
  nightmare: { pesadeloGolpe: true },// 😱 1/4 do HP por turno enquanto o alvo dorme; acorda, acabou
  ingrain: { raiz: true },           // 🌱 cura 1/16 por turno e não consegue mais sair de campo
  'aqua-ring': { anel: true },       // 💧 cura 1/16 por turno
  'perish-song': { cancaoFinal: true }, // 💀 quem ouviu (os DOIS lados) desmaia em 3 turnos
  wish: { desejo: true },            // 🌟 no fim do turno seguinte, metade do HP máximo volta

  /* ---- 📊 estágios e HP (contas puras sobre o que já existe no `vol.stages`) ----
     Nenhum destes precisou de mecânica nova: são leitura e escrita dos estágios que o motor já guarda. */
  haze: { limpaEstagios: true },               // zera os estágios de TODO mundo em campo
  'psych-up': { copiaEstagios: true },         // quem usa fica com os estágios do alvo
  'belly-drum': { tambor: true },              // paga metade do HP máximo e põe o Ataque no +6
  'topsy-turvy': { inverteEstagios: true },    // inverte o sinal de todos os estágios do alvo
  'pain-split': { divideHp: true },            // os dois ficam com a média do HP atual
  'power-trick': { trocaProprios: [['attack', 'defense']] },      // troca os PRÓPRIOS Ataque e Defesa
  'power-swap': { trocaEstagios: ['attack', 'special-attack'] },  // troca os ESTÁGIOS com o alvo
  'guard-swap': { trocaEstagios: ['defense', 'special-defense'] },
  'heart-swap': { trocaEstagios: 'todos' },
  'speed-swap': { trocaStat: 'speed' },                           // troca a Velocidade de verdade com o alvo
  'guard-split': { mediaStat: ['defense', 'special-defense'] },    // os dois ficam com a média dos dois atributos
  'power-split': { mediaStat: ['attack', 'special-attack'] },

  /* ---- 💥 dano FIXO (regras.danoFixoDe) — não passa pela fórmula de dano ---- */
  'sonic-boom': { danoFixo: 20 }, 'dragon-rage': { danoFixo: 40 },
  'seismic-toss': { danoFixo: 'nivel' }, 'night-shade': { danoFixo: 'nivel' },
  psywave: { danoFixo: 'nivelVariado' },
  'super-fang': { danoFixo: 'metadeDoAlvo' }, 'natures-madness': { danoFixo: 'metadeDoAlvo' },
  'final-gambit': { danoFixo: 'hpProprio', autoDesmaio: true },

  // poder que sai da FELICIDADE e do sorteio (regras.poderEspecial)
  return: { poder: 'felicidade' }, frustration: { poder: 'felicidadeInversa' }, magnitude: { poder: 'magnitude' },

  /* ---- golpes que nos jogos NÃO FAZEM NADA ----
     Mesmo caso do Hold Hands: dizer "será ajustado em atualizações futuras" seria prometer efeito inexistente.
     (Happy Hour dobra o dinheiro do prêmio nos jogos; aqui o prêmio sai da rota, então ele entra nesta lista.) */
  splash: { semEfeitoReal: true }, celebrate: { semEfeitoReal: true }, 'happy-hour': { semEfeitoReal: true },
  // Refresh limpa o PRÓPRIO status: é o `curaStatus` que o Heal Bell já usa, só que o `target` é `user`
  refresh: { curaStatus: true },

  /* ---- 🎭 usar o golpe de OUTRO (golpe.usarCopia) ----
     `copia: de-onde` roda um golpe que NÃO é o escolhido. O objeto do golpe sai sempre do moveset de ALGUÉM em
     campo (`golpe.golpeDeNome`) — nunca de uma busca nova na rede, que é o que faria Metronome e Nature Power
     dependerem de internet no meio do turno. Quem já usou um golpe deixa o NOME em `vol.ultimo` (o mesmo campo
     que Encore e Disable leem), e o objeto está no moveset dele: é só procurar.
       ultimoDoAlvo    o último golpe do alvo (Mirror Move: exige a flag `mirror`; Mimic/Sketch copiam pro seu)
       ultimoDaLuta    o último golpe usado por QUALQUER UM (Copycat) — `campo.ultimo`
       meusOutros      um dos SEUS outros golpes, sorteado (Sleep Talk)
       dosAliados      um golpe de um companheiro, sorteado (Assist)
       doCampo         qualquer golpe que alguém em campo saiba, sorteado (Metronome)
       escolhidoDoAlvo o golpe que o alvo IA usar neste turno, ×1,5 de poder (Me First)
     `repete` = o ALVO usa o último golpe dele de novo, agora (Instruct).
     `soNoSono` = o golpe só funciona dormindo, e por isso FURA a trava de sono (Sleep Talk, Snore). */
  mimic: { copia: 'ultimoDoAlvo', guardaNoSlot: true },
  sketch: { copia: 'ultimoDoAlvo', guardaNoSlot: 'permanente' },
  'mirror-move': { copia: 'ultimoDoAlvo', exigeFlag: 'mirror' },
  copycat: { copia: 'ultimoDaLuta' },
  'sleep-talk': { copia: 'meusOutros', soNoSono: true },
  snore: { soNoSono: true },                      // golpe de DANO que só sai dormindo (o poder 50 já vem da API)
  assist: { copia: 'dosAliados' },
  metronome: { copia: 'doCampo' },
  'me-first': { copia: 'escolhidoDoAlvo', mult: 1.5 },
  instruct: { repete: true },
  'nature-power': { copia: 'doTerreno' },
  transform: { transforma: true },

  /* ---- 🪆 Substituto ----
     `substituto: fração` = paga essa fração do HP MÁXIMO e põe um boneco com esse tanto de HP (`vol.substituto`).
     Enquanto ele estiver de pé, golpe de fora bate NELE e golpe de status não passa — a não ser que o golpe tenha
     a flag `authentic` (é a flag "ignora substituto" da própria PokéAPI) ou quem usa tenha Infiltrator. */
  substitute: { substituto: 1 / 4 },
  'shed-tail': { substituto: 1 / 2, revezamento: true },

  /* ---- 🧠 trocar HABILIDADE ----
     Todas escrevem em `m.ability` e guardam a antiga em `m.abilityAntes` — o MESMO caminho do Trace e do Mummy,
     então `golpe.desfazerTrace` (já chamado no `endBattle`) desfaz de graça. Gastro Acid é o único que não troca
     nada: ele liga `vol.semHabilidade`, que `habilidades.hab` lê — assim a habilidade volta ao sair de campo e
     nada precisa ser desfeito no save. */
  'role-play': { copiaHabilidade: 'doAlvo' },     // quem usa fica com a do alvo
  entrainment: { copiaHabilidade: 'proAlvo' },    // o alvo fica com a de quem usa
  doodle: { copiaHabilidade: 'doAlvoProLado' },   // quem usa E os companheiros ficam com a do alvo
  'skill-swap': { trocaHabilidade: true },
  'simple-beam': { poeHabilidade: 'simple' },
  'worry-seed': { poeHabilidade: 'insomnia' },
  'gastro-acid': { anulaHabilidade: true },

  /* ---- 🎒 mexer no ITEM do outro ----
     O bloqueio histórico ("inimigo não segura item") venceu: `batalha.novoOponente` dá item ao selvagem desde o
     relato #77. Todos passam por `golpe.mexerNoItem`, que ANOTA `m.itemAntes` — e no fim de uma batalha VENCIDA
     `batalha.desfazerItens` devolve o que era seu (pedido do usuário, 13/10/2026). Sticky Hold barra todos. */
  trick: { trocaItem: true }, switcheroo: { trocaItem: true },
  bestow: { daItem: true },                       // dá o SEU item pro alvo (que precisa estar de mão vazia)
  'corrosive-gas': { derrubaItem: true },         // mesmo comportamento do Knock Off, sem o dano
  recycle: { reciclar: true },                    // devolve o último item que VOCÊ gastou (vol.itemGasto)
  fling: { arremessa: true, poder: 'fling' },     // o poder sai do item (poderDoFling); o item se perde
  'natural-gift': { presenteDaNatureza: true },   // tipo e poder saem da FRUTA segurada; sem fruta, falha
  teatime: { horaDoCha: true },                   // TODO mundo em campo come a fruta que estiver segurando
  // 🔒 Embargo e 🏠 Magic Room desligam o item por turnos — `vol.semItem`, lido dentro de `segurados.seg`
  embargo: { semItem: 5 },

  /* ---- ⚔ contra-ataque (regras.danoDoContra, sobre `vol.ultimoDano`) ----
     `contra: { classe?, mult }` devolve o dano que você levou NESTE turno, multiplicado. Sem classe, qualquer um. */
  counter: { contra: { classe: 'physical', mult: 2 } },
  'mirror-coat': { contra: { classe: 'special', mult: 2 } },
  'metal-burst': { contra: { mult: 1.5 } },
  bide: { bide: true },                           // 2 turnos guardando o que levou, e devolve o DOBRO

  /* ---- 🏠 as salas e os "sports" (campo, 5 turnos, valem pros dois lados) ---- */
  'trick-room': { sala: 'salaInvertida' },        // o mais LENTO age primeiro (regras.ordenarAcoes)
  'wonder-room': { sala: 'salaMaravilhas' },      // Defesa e Def. Esp. trocadas em todo mundo (regras.calcDamage)
  'magic-room': { sala: 'salaMagica' },           // item segurado não vale nada (segurados.seg, por `vol.semItem`)
  'mud-sport': { sport: 'electric' }, 'water-sport': { sport: 'fire' },   // corta esse tipo pela metade
  'ion-deluge': { ionizado: true },               // golpe Normal vira Elétrico nesta rodada
  'fairy-lock': { travaFuga: true },              // ninguém foge na rodada seguinte

  /* ---- 🛡 proteção de LADO (um turno, em `campo.lados`) e a teia ---- */
  'wide-guard': { lado: 'wide', umTurno: true },       // barra golpe de ÁREA
  'quick-guard': { lado: 'rapido', umTurno: true },    // barra golpe de PRIORIDADE
  'crafty-shield': { lado: 'astuto', umTurno: true },  // barra golpe de STATUS
  'mat-block': { lado: 'tapete', umTurno: true, soPrimeiroTurno: true },  // barra golpe de DANO, só na estreia
  'lucky-chant': { lado: 'sorte' },                    // nada de crítico contra o seu lado, 5 turnos
  'sticky-web': { armadilha: 'teia' },                 // baixa a Velocidade de quem ENTRAR em campo

  /* ---- 👁 tirar imunidade (regras.eficacia, pelo `vol.semImunidade`) ---- */
  foresight: { semImunidade: ['ghost'] }, 'odor-sleuth': { semImunidade: ['ghost'] },
  'miracle-eye': { semImunidade: ['dark'] },

  /* ---- 🔄 os que nos jogos dependem de trocar de Pokémon ----
     Aqui "o substituto que entra" é um COMPANHEIRO em campo (`ctx.aliadosDe`) — a mesma tradução que o Baton Pass
     já usa. Sem companheiro, o golpe falha e diz isso, em vez de matar você por nada. */
  'healing-wish': { desejoDeCura: true },                      // você desmaia; um companheiro fica curado
  'lunar-dance': { desejoDeCura: true, devolvePP: true },       // …e com os PP cheios
  'revival-blessing': { reviver: true },                       // levanta um companheiro caído com metade do HP
  'chilly-reception': { clima: 'neve', revezamento: true },    // nevasca + sai de campo

  /* ---- ⏱ ordem do turno (`ctx.reordenar`, implementado em batalha.js) ---- */
  'after-you': { reordena: 'proximo' }, quash: { reordena: 'ultimo' },
  'ally-switch': { trocaLugar: true },            // o companheiro passa a receber os golpes mirados em você

  /* ---- o resto, um a um ---- */
  curse: { maldicao: true },                      // Fantasma paga meio HP pra sangrar o alvo; os outros se buffam
  'destiny-bond': { laco: true },                 // se você cair neste turno, quem te derrubou cai junto
  grudge: { rancor: true },                       // se você cair neste turno, o golpe que te derrubou zera o PP
  spite: { tiraPP: 4 },                           // −4 PP no último golpe do alvo
  imprison: { selaGolpes: true },                 // o alvo não pode usar os golpes que VOCÊ também sabe
  'heal-block': { semCura: 5 },                   // nada cura o alvo por 5 turnos (regras.heal)
  'magic-coat': { manto: true },                  // o primeiro golpe de status refletível volta pro dono
  snatch: { furtar: true },                       // o próximo golpe de status que o outro usar EM SI vira seu
  'psycho-shift': { passaStatus: true },
  camouflage: { tipoDoTerreno: true },            // seu tipo vira o do chão (especiais.TIPO_DO_TERRENO)
  conversion: { tipoDoMeuGolpe: true },           // seu tipo vira o de um dos seus golpes
  'conversion-2': { tipoQueResiste: true },       // seu tipo vira um que RESISTE ao último golpe que te acertou
  'reflect-type': { tipoDoAlvo: true },
  'mind-reader': { miraCerta: true }, 'lock-on': { miraCerta: true },
  'laser-focus': { critoCerto: true },
  spotlight: { holofote: true },                  // marca o alvo: os golpes do SEU lado vão todos nele
  octolock: { trancar: true },                    // não foge, e perde Defesa e Def. Esp. a cada turno
  powder: { poExplosivo: true },                  // se o alvo usar golpe de Fogo nesta rodada, explode nele
  electrify: { eletrifica: true },                // o golpe do alvo vira Elétrico nesta rodada
  'court-change': { trocaLados: true },           // os efeitos de lado trocam de lado
  present: { presente: true },                    // 40/80/120 de dano — ou CURA o alvo em 1/4
  'beat-up': { surra: true },                     // um acerto por companheiro em pé, pelo Ataque base de cada um
  stockpile: { estocar: true }, 'spit-up': { cuspir: true }, swallow: { engolir: true },
  'trump-card': { poder: 'ppRestante' },
  'power-shift': { trocaProprios: [['attack', 'defense'], ['special-attack', 'special-defense']] },
  'throat-chop': { calaPorTurnos: 2 }             // nada de golpe de SOM por 2 turnos (regras.motivoBloqueio)
};

/* 🌿 Nature Power vira um golpe diferente conforme o chão (`regras.terrenoDe`). Os cinco são TABELA e não busca
   na PokéAPI de propósito: são dados que **não mudam** (tipo, poder e precisão desses golpes são os mesmos desde
   que existem), e a alternativa seria uma busca de rede no meio do turno — justo o que a armadilha "busca não
   essencial não pode derrubar o fluxo" manda evitar. É a mesma decisão de `dados-golpe-flags.GOLPE_AREA`.
   O `null` é "sem terreno nenhum", que nos jogos é Tri Attack. */
export const GOLPE_DO_TERRENO = {
  null: { name: 'tri-attack', type: 'normal', cls: 'special', power: 80, acc: 100, pp: 10, priority: 0, target: 'selected-pokemon', stats: [], meta: { ailment: 'unknown', ailChance: 20 } },
  eletrico: { name: 'thunderbolt', type: 'electric', cls: 'special', power: 90, acc: 100, pp: 15, priority: 0, target: 'selected-pokemon', stats: [], meta: { ailment: 'paralysis', ailChance: 10 } },
  grama: { name: 'energy-ball', type: 'grass', cls: 'special', power: 90, acc: 100, pp: 10, priority: 0, target: 'selected-pokemon', stats: [{ stat: 'special-defense', change: -1 }], meta: { statChance: 10 } },
  fada: { name: 'moonblast', type: 'fairy', cls: 'special', power: 95, acc: 100, pp: 15, priority: 0, target: 'selected-pokemon', stats: [{ stat: 'special-attack', change: -1 }], meta: { statChance: 30 } },
  psiquico: { name: 'psychic', type: 'psychic', cls: 'special', power: 90, acc: 100, pp: 10, priority: 0, target: 'selected-pokemon', stats: [{ stat: 'special-defense', change: -1 }], meta: { statChance: 10 } }
};
export const especial = g => GOLPES_ESPECIAIS[g?.name] || {};

/* 🤹 **Fling**: o poder sai do item segurado. A tabela é por POTÊNCIA (não por item) porque é assim que ela se lê
   e se confere — são 111 dos nossos 160 itens, agrupados nos 8 valores que a PokéAPI dá. Fruta é sempre 10, e o
   que não está em lugar nenhum vale `PODER_FLING` (30, o valor da maioria). Dado que não muda = tabela, não busca. */
const FLING_POR_PODER = {
  10: ['leftovers', 'focus-sash', 'red-card', 'expert-belt', 'muscle-band', 'wise-glasses', 'choice-band', 'choice-specs',
    'choice-scarf', 'air-balloon', 'white-herb', 'mental-herb', 'power-herb', 'destiny-knot', 'reaper-cloth', 'strawberry-sweet'],
  40: ['eviolite'], 50: ['dubious-disc'], 60: ['rocky-helmet'],
  80: ['assault-vest', 'quick-claw', 'weakness-policy', 'shiny-stone', 'dusk-stone', 'dawn-stone', 'protector',
    'electirizer', 'magmarizer', 'sachet', 'whipped-dream', 'razor-claw', 'oval-stone', 'cracked-pot'],
  90: ['deep-sea-tooth'], 100: ['hard-stone'], 130: ['iron-ball']
};
export const PODER_FLING = 30, PODER_FLING_FRUTA = 10;
const FLING = Object.fromEntries(Object.entries(FLING_POR_PODER).flatMap(([p, ids]) => ids.map(id => [id, +p])));
export const poderDoFling = id => !id ? null : FLING[id] ?? (id.endsWith('-berry') ? PODER_FLING_FRUTA : PODER_FLING);

/* 🎁 **Natural Gift**: o tipo e o poder saem da FRUTA segurada. As 17 frutas de aperto já dizem o tipo delas
   (`dados.FRUTA_DO_TIPO` é a fonte única, lida de fora pra este módulo não importar nada), e as três de cura
   têm o tipo que os jogos dão. Fruta nenhuma na mão = o golpe falha, como nos jogos. */
export const PODER_NATURAL_GIFT = 80;
export const TIPO_DA_FRUTA_DE_CURA = { 'oran-berry': 'poison', 'sitrus-berry': 'psychic', 'lum-berry': 'flying' };

// 🥷 Camouflage: o tipo de quem usa passa a ser o do CHÃO (regras.terrenoDe). Sem terreno, Normal — como nos jogos.
export const TIPO_DO_TERRENO = { eletrico: 'electric', grama: 'grass', psiquico: 'psychic', fada: 'fairy' };
