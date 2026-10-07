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
//   imuneFlag: flag        imune a golpe com essa FLAG de verdade (regras.temFlag/dados-golpe-flags.js — vale pra
//                          golpe de dano E de status), ex. 'sound'/'ballistics' (golpe.js) — Soundproof, Bulletproof
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
//   curaAoVencer           fração do HP que volta ao vencer a luta (batalha.win) — Regenerator (no lugar de "ao trocar")
//   limpaStatusAoVencer    tira o status ao vencer a luta — Natural Cure
//   saiComPoucoHp          fração do HP abaixo da qual sai de campo, por causa de um golpe (golpe.executar → ctx.forcarSaida) — Wimp Out, Emergency Exit. Só inimigos e aliados
//   inicioLento            turnos em campo com Ataque e Velocidade pela metade (regras.effStat) — Slow Start
//   emboscada              multiplicador de dano em quem acabou de entrar em campo (regras.calcDamage) — Stakeout
//   imuneTrava             lista de travas de golpe que não pegam (regras.falhaDaTrava): 'provocar' | 'encore' | 'disable' | 'tormento' — Oblivious (Taunt), Aroma Veil (as quatro)
//   contato também aceita: sorteio [[status,peso]] (sorteia um), estagio [stat,n] (baixa quem encosta), po (não pega Grama/Overcoat)
//   imunePo                não pega os pós do `contato` (Overcoat)
//   toque: {status, chance}  golpe físico SEU pode causar esse status no alvo (golpe.js) — Poison Touch
//   semDanoIndireto        nenhum dano que não seja de golpe direto: veneno, queimadura, recuo, armadilha, espinhos… — Magic Guard
//   curaComVeneno: fração  o veneno CURA essa fração do HP máx. por turno em vez de machucar (golpe.fimDeTurno) — Poison Heal
//   pressao                quem usa golpe contra você gasta 1 PP a mais (golpe.usarGolpe) — Pressure
//   preguica               só age em turnos alternados (golpe.usarGolpe) — Truant
//   formaDoClima           os tipos e o sprite acompanham o tempo (golpe.ajustarForma) — Forecast, do Castform
//   bloqueiaPrioridade     golpe de prioridade contra você não passa (golpe.usarGolpe) — Dazzling, Queenly Majesty, Armor Tail
//   multMaiorStatClima: {clima:true}    o MAIOR atributo base (empate: Atk>Def>SpA>SpD>Spe) ×1,3 (×1,5 se for
//                          Velocidade — fixo dos jogos, embutido em regras.multMaiorStat) naquele clima (effStat) — Protosynthesis
//   multMaiorStatTerreno: {terreno:true}  idem, no terreno (effStat) — Quark Drive. Simplificação: só o gatilho de
//                          clima/terreno está aqui; o Booster Energy (item que ativa fora do clima/terreno certo)
//                          ainda não existe no jogo — fica pra quando esse item entrar.
//   prendeTipo: [tipo]     Pokémon selvagem desse tipo não consegue fugir de você (regras.consegueFugir) — Magnet Pull (Aço)
//   anticipa               ao entrar em campo, avisa (sem efeito mecânico) se algum oponente tem golpe super
//                          efetivo, OHKO ou autodestrutivo contra você (golpe.aoEntrarEmCampo) — Anticipation
//   sincroniza             queimadura/paralisia/veneno recebidos de um golpe voltam pra quem causou (golpe.aplicarStatus) — Synchronize
//   flinchChance: n        chance extra (%) de fazer o alvo recuar em golpe de dano que ainda não tem chance própria de recuo (golpe.js) — Stench
//   sheerForce             golpe com efeito secundário nativo (estágio/status/recuo por chance) bate ×1,3 mas
//                          PERDE o efeito (regras.temSecundario decide "tem efeito"; golpe.executar guarda os
//                          três blocos de aplicação) — Sheer Force
//   unnerve                enquanto este Pokémon está em campo, o LADO DE QUEM ELE ENFRENTA não come fruta
//                          sozinho (golpe.comerFruta, só no momento em que os dois trocam golpe — não no fim de
//                          turno, simplificação: ver CLAUDE.md) — Unnerve
//   friendGuard             dano recebido por um ALIADO vivo cai 25% (golpe.executar, via `ctx.aliadosDe`, novo
//                          nos dois ctx — sem isso a habilidade fica inerte) — Friend Guard
//
//   ---- 7ª leva: os ganchos abaixo entram com o restante das habilidades reais que faltavam (regras.js/golpe.js/
//   segurados.js). O que ficou de fora por exigir mecânica que o jogo não tem (troca de Pokémon, redirecionamento
//   forçado, Transform, peso) está documentado no fim da tabela. ----
//   multFlag: {flag, mult}  golpe com essa FLAG de verdade (dados-golpe-flags.js) que VOCÊ usa ×mult (calcDamage)
//                          — Tough Claws (contact), Mega Launcher (pulse), Punk Rock (sound)
//   resisteFlag: {flag, mult}  golpe com essa flag que você RECEBE ×mult (calcDamage) — Punk Rock (sound, ×0,5)
//   converteTipo: {de, para, mult}  golpe do tipo `de` (ou `'*'` = qualquer) vira `para`, poder ×mult (regras.
//                          golpeDaConversaoDeTipo, roda ANTES do Tera/Battle Bond) — Aerilate, Pixilate,
//                          Refrigerate, Galvanize (Normal→outro tipo, ×1,3), Normalize (qualquer→Normal, sem bônus)
//   evasaoConfuso           evasão × 2 em quem está confuso (chanceAcerto) — Tangled Feet
//   acaoRapida              30% de agir primeiro dentro da própria prioridade, como a Garra Rápida (regras.
//                          ativouQuickClaw/ordenarAcoes) — Quick Draw
//   sempreLento             sempre age por ÚLTIMO dentro da própria prioridade (regras.ordenarAcoes) — Stall
//   prankster               +1 de prioridade em golpe de STATUS (regras.prioridadeEfetiva) — Prankster
//   prioridadeVoador        +1 de prioridade em golpe Voador com HP cheio (regras.prioridadeEfetiva) — Gale Wings
//   prioridadeCura          +3 de prioridade em golpe que cura HP (regras.prioridadeEfetiva) — Triage
//   prendeQualquer: true|'chao'  Pokémon selvagem não consegue fugir de você: `true` = todo mundo (Shadow Tag),
//                          `'chao'` = só quem está no chão (regras.consegueFugir, resolvido em batalha.js/mp-motor
//                          antes de chamar) — Arena Trap
//   semContato              seus PRÓPRIOS golpes nunca fazem contato, mesmo os que têm a flag de verdade
//                          (golpe.executar, `encostou`) — Long Reach
//   aliadoBoost: 'especial'|'qualquer'|'aco'|'plusminus'  reforça o golpe de um ALIADO vivo (multiplicativo com
//                          mais de um): 'especial' golpe especial ×1,3 (Battery), 'qualquer' ×1,3 (Power Spot),
//                          'aco' golpe de Aço ×1,5 (Steely Spirit), 'plusminus' golpe especial ×1,5 (Plus, Minus)
//   aoNocautearMaior        como `aoNocautear`, mas sobe o MAIOR atributo BASE de quem derrubou (regras.
//                          maiorStatBase) em vez de um fixo — Beast Boost
//   aftermath: fração       ao ser derrubado por um golpe que fez CONTATO, quem derrubou perde essa fração do
//                          próprio HP máximo (golpe.executar) — Aftermath
//   abafaExplosao           ninguém EM CAMPO (dos dois lados) consegue usar golpe de autodesmaio — Explosion,
//                          Self-Destruct, Misty Explosion, Memento. Também cala o Aftermath de quem cai.
//                          (golpe.usarGolpe/executar, por `ctx.aliadosDe`+`ctx.oponentesDe`) — Damp
//   imuneGolpeAliado        golpe de ÁREA de um ALIADO (Earthquake, Surf) não respinga nele (golpe.alvosDoGolpe) —
//                          Telepathy. Só existe desde que o jogo passou a ter mais de um Pokémon por lado.
//   aoDesmaiarDanoAtacante  ao ser derrubado por QUALQUER golpe de dano (contato ou não), quem derrubou perde HP
//                          igual ao HP que este tinha um instante antes de cair (golpe.executar) — Innards Out
//   dreno: 'inverte'        um dreno (Giga Drain e cia.) de quem te ataca vira DANO nele em vez de cura pra ele
//                          (golpe.executar, no bloco de `meta.drain`) — Liquid Ooze
//   roubaItem: 'contato'|'ataque'  rouba o item de quem foi atingido, se você estiver sem item: 'contato' só em
//                          golpe que encosta (Pickpocket), 'ataque' em qualquer golpe de dano que acertou
//                          (Magician) — Sticky Hold (`protegeItem`) do alvo bloqueia (golpe.executar)
//   protegeItem              seu item não pode ser roubado por Pickpocket/Magician (golpe.executar) — Sticky Hold
//   imuneGolpeStatus         imune a QUALQUER golpe de status usado por outro Pokémon (golpe.executar, antes de
//                          golpeDeStatus) — Good As Gold
//   rivalidade              ×1,25 contra o MESMO gênero, ×0,75 contra o oposto, ×1 se um dos dois não tem gênero
//                          (regras.calcDamage) — Rivalry
//   podeEnvenenarQualquer    seus próprios golpes/toque venenoso ignoram a imunidade de TIPO ao veneno
//                          (Venenoso/Aço) do alvo — não a de habilidade, tipo Immunity (golpe.aplicarStatus) —
//                          Corrosion
//   protegeAliadoStatus      Pokémon de tipo Grama no seu lado (você incluído) não perde atributo nem pega status
//                          por ação de outro Pokémon (golpe.mudarEstagios/aplicarStatus, `protegidoPorFlores`) —
//                          Flower Veil
//   copiaHabilidadeAoEntrar  ao entrar em campo, copia a habilidade de um oponente vivo (nunca uma que mexe com
//                          mecânica própria do motor, como a troca de forma do Aegislash; desfeito no fim da
//                          batalha, `golpe.desfazerTrace`) — Trace
//   avisaGolpeForte          ao entrar, avisa qual é o golpe de maior poder entre os oponentes (só narra, sem
//                          efeito mecânico) (golpe.aoEntrarEmCampo) — Forewarn
//   revelaItem               ao entrar, avisa o item que um oponente está segurando (só narra) (golpe.
//                          aoEntrarEmCampo) — Frisk
//   moody                    todo fim de turno, +2 num atributo sorteado e −1 em outro sorteado (golpe.fimDeTurno)
//                          — Moody
//   ripen                    a fruta que cura HP (Oran, Sitrus…) cura o DOBRO ao ser comida (golpe.comerFruta) —
//                          Ripen
//   curaBerryExtra: fração   comer QUALQUER fruta (mesmo as que não curam HP, como a Lum) recupera essa fração
//                          extra do HP máximo (golpe.comerFruta) — Cheek Pouch
//   semItemEmBatalha         o item continua segurado (pode ser roubado, aparece pro Frisk) mas não tem NENHUM
//                          efeito em batalha (segurados.seg, único ponto por onde toda leitura de item passa) —
//                          Klutz
//   algodaoCai               quem acerta você perde 1 de Velocidade (golpe.executar; simplificação: só quem
//                          acertou diretamente, não "todo mundo em campo" como no jogo de verdade) — Cotton Down
//   trocaHabilidadeContato: 'contagio'|'troca'  ao ser atingido por golpe que faz CONTATO, a habilidade de quem
//                          encostou muda: 'contagio' = vira a SUA (Mummy, Lingering Aroma), 'troca' = as duas
//                          trocam de lugar (Wandering Spirit) (golpe.executar; desfeito no fim da batalha,
//                          `golpe.desfazerTrace`, mesmo mecanismo do Trace)
//
//   ---- 8ª leva: o resto do que dava pra fazer sem mecânica de TROCA de Pokémon nem forma dinâmica (o que sobrou
//   está documentado no fim da tabela, e o desenho das duas está em docs/features.md). ----
//   ruina: stat           os quatro Tesouros da Ruína: 25% a menos DAQUELE atributo em todo mundo menos em si
//                         (regras.calcDamage, resolvido como multiplicador do golpe — ver o comentário lá)
//   aura: {tipo, mult}    reforça esse tipo de golpe pros DOIS lados do campo (Dark Aura, Fairy Aura);
//                         `anulaAura` inverte o reforço em ×0,75 (Aura Break) (regras.calcDamage)
//   ignoraImunidade: [tipo]  a imunidade de TIPO do alvo não vale (Scrappy, Mind's Eye: Fantasma não escapa de
//                         Normal/Lutador). Só mexe quando a eficácia é ZERO (regras.eficacia)
//   atravessaTelas        Refletir/Tela de Luz/Véu e a Salvaguarda do outro lado não valem contra você
//                         (regras.multTelas, golpe.aplicarStatus) — Infiltrator
//   semSaidaForcada       golpe/item de OUTRO não arrasta você pra fora de campo; sair por vontade própria (Wimp
//                         Out, revezamento do U-turn) continua valendo (golpe.sairDeCampo) — Suction Cups
//   aoRecuar: [stat, n]   perder o turno por recuo sobe n desse atributo (golpe.usarGolpe) — Steadfast
//   corpoMaldito: n       n% de desativar o golpe que te acertou, pela MESMA trava do Disable (golpe.executar) — Cursed Body
//   tipoDoProprioGolpe    ao atacar, o SEU tipo vira o do golpe; uma vez por entrada em campo, como na Gen 9
//                         (golpe.executar, em `vol.tipos`) — Protean, Libero
//   tipoDoGolpeRecebido   levar golpe de dano troca o SEU tipo pelo do golpe, sempre (golpe.executar) — Color Change
//   venenoConfunde        quem VOCÊ envenena fica confuso de tabela (golpe.aplicarStatus) — Poison Puppeteer
//   toque também aceita: `qualquer` (não precisa encostar, qualquer golpe que acertou serve) e `grave` (o veneno
//                         sai GRAVE) — Toxic Chain
//   zeraEstagiosAoEntrar  ao entrar, zera os degraus de atributo do seu lado, bons e ruins — Curious Medicine
//   limpaTelas            ao entrar, estilhaça as telas dos DOIS lados — Screen Cleaner
//   curaAliadoAoEntrar: f ao entrar, cura essa fração do HP máximo de um ALIADO — Hospitality
//   copiaEstagiosDoAliado ao entrar, copia os degraus de atributo do aliado — Costar
//   estagioInimigoAoEntrar: [stat, n]  ao entrar, mexe nesse atributo de quem está do outro lado; uma vez por
//                         batalha (golpe.aoEntrarEmCampo) — Supersweet Syrup
//   pesadelo: fração      no fim do turno, quem está DORMINDO do outro lado perde essa fração do HP máximo
//                         (golpe.fimDeTurno, por `ctx.oponentesDe` — novo nos dois ctx) — Bad Dreams
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
  protosynthesis: { multMaiorStatClima: { sol: true } },
  // terrenos: ligam o campo ao entrar, ou se aproveitam dele
  'electric-surge': { terrenoAoEntrar: 'eletrico' }, 'grassy-surge': { terrenoAoEntrar: 'grama' },
  'psychic-surge': { terrenoAoEntrar: 'psiquico' }, 'misty-surge': { terrenoAoEntrar: 'fada' },
  'surge-surfer': { multStatTerreno: { eletrico: { speed: 2 } } },
  'quark-drive': { multMaiorStatTerreno: { eletrico: true } },
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
  soundproof: { imuneFlag: 'sound' }, bulletproof: { imuneFlag: 'ballistics' },   // imunidade por FLAG do golpe (dados-golpe-flags.js), não por tipo
  'flash-fire': { absorve: 'fire', flashFire: true },
  'volt-absorb': { absorve: 'electric', cura: 0.25 }, 'water-absorb': { absorve: 'water', cura: 0.25 }, // 'dry-skin' está lá em cima, com a parte de clima junto
  'lightning-rod': { absorve: 'electric', estagio: ['special-attack', 1] }, 'storm-drain': { absorve: 'water', estagio: ['special-attack', 1] },
  'motor-drive': { absorve: 'electric', estagio: ['speed', 1] }, 'sap-sipper': { absorve: 'grass', estagio: ['attack', 1] },
  // status
  immunity: { imuneStatus: ['poison'] }, limber: { imuneStatus: ['paralysis'] },
  insomnia: { imuneStatus: ['sleep'] }, 'vital-spirit': { imuneStatus: ['sleep'] }, 'sweet-veil': { imuneStatus: ['sleep'] },
  'water-veil': { imuneStatus: ['burn'] }, 'magma-armor': { imuneStatus: ['freeze'] },
  'own-tempo': { imuneStatus: ['confusion'], imuneIntimidacao: true }, oblivious: { imuneStatus: ['confusion', 'infatuation'], imuneIntimidacao: true, imuneTrava: ['provocar'] },
  'aroma-veil': { imuneStatus: ['infatuation'], imuneTrava: ['provocar', 'encore', 'disable', 'tormento'] },
  // o que nos jogos acontece ao TROCAR de Pokémon, ligado ao evento equivalente daqui (você nunca troca)
  regenerator: { curaAoVencer: 1 / 3 }, 'natural-cure': { limpaStatusAoVencer: true },
  'wimp-out': { saiComPoucoHp: 0.5 }, 'emergency-exit': { saiComPoucoHp: 0.5 },
  'slow-start': { inicioLento: 5 }, stakeout: { emboscada: 2 }, rivalry: { rivalidade: true },
  'early-bird': { sonoRapido: true }, 'shed-skin': { curaStatusFimTurno: 0.3 },
  // atributos que não caem
  'clear-body': { semQueda: 'todas' }, 'white-smoke': { semQueda: 'todas' }, 'full-metal-body': { semQueda: 'todas' },
  'hyper-cutter': { semQueda: ['attack'] }, 'keen-eye': { semQueda: ['accuracy'] }, 'big-pecks': { semQueda: ['defense'] },
  // contato
  static: { contato: { status: 'paralysis', chance: 30 } }, 'flame-body': { contato: { status: 'burn', chance: 30 } },
  'poison-point': { contato: { status: 'poison', chance: 30 } },
  // Cute Charm: quem encostou se apaixona — a exigência de gênero oposto é de aplicarStatus, não daqui
  'cute-charm': { contato: { status: 'infatuation', chance: 30 } },
  'rough-skin': { contatoDano: 1 / 8 }, 'iron-barbs': { contatoDano: 1 / 8 },
  synchronize: { sincroniza: true }, stench: { flinchChance: 10 },
  'sheer-force': { sheerForce: true }, unnerve: { unnerve: true }, 'friend-guard': { friendGuard: true },
  // outros
  'speed-boost': { fimTurno: 'speed' }, intimidate: { intimida: true }, 'run-away': { fuga: true },
  'magnet-pull': { prendeTipo: ['steel'] }, anticipation: { anticipa: true },
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
  forecast: { formaDoClima: true },

  /* ---- 7ª leva: o restante das habilidades reais que tinham gancho fiel disponível. Cada gancho novo está
     documentado no topo do arquivo; o que ainda ficou de fora está no comentário depois da tabela. ---- */
  // prende o selvagem (regras.consegueFugir, via `preso` resolvido em batalha.js/mp-motor)
  'shadow-tag': { prendeQualquer: true }, 'arena-trap': { prendeQualquer: 'chao' },
  // Trace: copia a habilidade de um oponente ao entrar em campo
  trace: { copiaHabilidadeAoEntrar: true },
  // reforço a um aliado (multiplicativo com mais de um)
  plus: { aliadoBoost: 'plusminus' }, minus: { aliadoBoost: 'plusminus' },
  battery: { aliadoBoost: 'especial' }, 'power-spot': { aliadoBoost: 'qualquer' }, 'steely-spirit': { aliadoBoost: 'aco' },
  // itens
  'sticky-hold': { protegeItem: true }, klutz: { semItemEmBatalha: true },
  pickpocket: { roubaItem: 'contato' }, magician: { roubaItem: 'ataque' },
  // Liquid Ooze: dreno de quem te ataca vira dano nele
  'liquid-ooze': { dreno: 'inverte' },
  // Tangled Feet: evasão em dobro confuso
  'tangled-feet': { evasaoConfuso: true },
  // conversão de tipo do golpe (Aerilate e cia. dão ×1,3; Normalize não reforça — é assim mesmo desde a Gen 4-6)
  aerilate: { converteTipo: { de: 'normal', para: 'flying', mult: 1.3 } },
  pixilate: { converteTipo: { de: 'normal', para: 'fairy', mult: 1.3 } },
  refrigerate: { converteTipo: { de: 'normal', para: 'ice', mult: 1.3 } },
  galvanize: { converteTipo: { de: 'normal', para: 'electric', mult: 1.3 } },
  normalize: { converteTipo: { de: '*', para: 'normal' } },
  // dano por FLAG do golpe (dados-golpe-flags.js), não por tipo
  'tough-claws': { multFlag: { flag: 'contact', mult: 1.3 } }, 'mega-launcher': { multFlag: { flag: 'pulse', mult: 1.5 } },
  'punk-rock': { multFlag: { flag: 'sound', mult: 1.3 }, resisteFlag: { flag: 'sound', mult: 0.5 } },
  // prioridade (regras.prioridadeEfetiva)
  prankster: { prankster: true }, 'gale-wings': { prioridadeVoador: true }, triage: { prioridadeCura: true },
  // Garra Rápida embutida na habilidade (Quick Draw) e o oposto (Stall)
  'quick-draw': { acaoRapida: true }, stall: { sempreLento: true },
  // Long Reach: os próprios golpes nunca fazem contato
  'long-reach': { semContato: true },
  // ao derrubar o alvo: Beast Boost lê o MAIOR atributo base, não um fixo
  'beast-boost': { aoNocautearMaior: true },
  // reação a ser derrubado
  aftermath: { aftermath: 1 / 4 }, 'innards-out': { aoDesmaiarDanoAtacante: true },
  damp: { abafaExplosao: true }, telepathy: { imuneGolpeAliado: true },   // só fazem sentido com mais de um em campo (🐺 grupo)
  // Cotton Down: quem acerta perde Velocidade
  'cotton-down': { algodaoCai: true },
  // troca/contágio de habilidade ao encostar
  mummy: { trocaHabilidadeContato: 'contagio' }, 'lingering-aroma': { trocaHabilidadeContato: 'contagio' },
  'wandering-spirit': { trocaHabilidadeContato: 'troca' },
  // status
  'good-as-gold': { imuneGolpeStatus: true }, corrosion: { podeEnvenenarQualquer: true }, 'flower-veil': { protegeAliadoStatus: true },
  // entrada em campo, só narração
  forewarn: { avisaGolpeForte: true }, frisk: { revelaItem: true },
  // fruta
  ripen: { ripen: true }, 'cheek-pouch': { curaBerryExtra: 1 / 3 },
  // fim de turno
  moody: { moody: true },
  /* ---- 8ª leva ---- */
  // dano por flag/tipo e defesa por flag: uma linha, ganchos que já existiam
  fluffy: { resisteFlag: { flag: 'contact', mult: 0.5 }, resiste: { fire: 2 } },
  'aura-guard': { resisteFlag: { flag: 'contact', mult: 0.5 } },
  'fire-mane': { danoTipo: { fire: 1.5 } },
  dragonize: { converteTipo: { de: 'normal', para: 'dragon', mult: 1.2 } },
  // Eelevate flutua: `imuneTipo: 'ground'` já tira Terrestre E as armadilhas do chão (regras.noChao lê daqui).
  // O extra dela nos jogos (roubar a velocidade de quem ela derruba) fica pra uma leva futura.
  eelevate: { imuneTipo: 'ground' },
  // Tera Shell: com HP cheio, TUDO entra pouco efetivo. `hpCheio` é um multiplicador fixo, então sai como ×0,5
  'tera-shell': { hpCheio: 0.5 },
  // As One = Unnerve + Chilling/Grim Neigh na mesma habilidade (as duas metades já existiam)
  'as-one-glastrier': { unnerve: true, aoNocautear: ['attack', 1] },
  'as-one-spectrier': { unnerve: true, aoNocautear: ['special-attack', 1] },
  // os quatro Tesouros da Ruína: cada um derruba 25% de um atributo de todo mundo menos de si
  'sword-of-ruin': { ruina: 'defense' }, 'tablets-of-ruin': { ruina: 'attack' },
  'vessel-of-ruin': { ruina: 'special-attack' }, 'beads-of-ruin': { ruina: 'special-defense' },
  // auras: valem pros dois lados do campo; Aura Break inverte
  'dark-aura': { aura: { tipo: 'dark', mult: 1.33 } }, 'fairy-aura': { aura: { tipo: 'fairy', mult: 1.33 } },
  'aura-break': { anulaAura: true },
  // Scrappy acerta Fantasma. Mind's Eye faz o mesmo e ainda não deixa baixarem sua precisão — a parte de ignorar
  // a EVASÃO do alvo ficou de fora (o gancho que existe, `ignoraEstagios`, ignoraria todos os degraus dele)
  scrappy: { ignoraImunidade: ['ghost'] },
  'minds-eye': { ignoraImunidade: ['ghost'], semQueda: ['accuracy'] },
  infiltrator: { atravessaTelas: true },
  'suction-cups': { semSaidaForcada: true },
  steadfast: { aoRecuar: ['speed', 1] },
  'cursed-body': { corpoMaldito: 30 },
  // tipo que muda: ao atacar (uma vez por entrada) ou ao apanhar (sempre)
  protean: { tipoDoProprioGolpe: true }, libero: { tipoDoProprioGolpe: true },
  'color-change': { tipoDoGolpeRecebido: true },
  'poison-puppeteer': { venenoConfunde: true },
  'toxic-chain': { toque: { status: 'poison', chance: 30, qualquer: true, grave: true } },
  // entrada em campo: campo, aliado e o outro lado
  'curious-medicine': { zeraEstagiosAoEntrar: true }, 'screen-cleaner': { limpaTelas: true },
  hospitality: { curaAliadoAoEntrar: 0.25 }, costar: { copiaEstagiosDoAliado: true },
  'supersweet-syrup': { estagioInimigoAoEntrar: ['evasion', -1] },
  'bad-dreams': { pesadelo: 1 / 8 }
  /* FICARAM DE FORA de propósito. Quatro motivos, e todos continuam valendo depois da 8ª leva:

     1. DEPENDEM DE TROCAR DE POKÉMON, e no jogo ninguém do seu lado troca (você É o Pokémon). Regenerator e
        Natural Cure já estão aqui com o gatilho adaptado ("ao sair" = ao vencer a luta, `curaAoVencer`/
        `limpaStatusAoVencer`); Zero to Hero (muda de forma ao sair), Commander (entra na boca do Dondozo),
        Ball Fetch, Honey Gather e Pickup (item depois da luta) não têm nem gatilho equivalente nem efeito que
        daria pra sentir. Ver docs/features.md.
     2. FORMA DINÂMICA DE UMA ESPÉCIE SÓ: cada uma pede sprite, atributos e regra próprios. Ice Face, Gulp
        Missile, Schooling, Shields Down, Hunger Switch, Zen Mode, Power Construct, Disguise, Illusion, Imposter
        (Transform), Tera Shift, Embody Aspect, Multitype e RKS System. Battle Bond existe no jogo como ITEM.
     3. PEDEM ESTADO DE TURNO QUE O MOTOR NÃO GUARDA IGUAL NOS DOIS LADOS: Dancer (copiar golpe de dança de
        outro), Analytic (saber que agiu por último na hora de calcular o dano), Opportunist (copiar o que o
        outro subiu), Wind Power / Electromorphosis (guardar "o próximo golpe Elétrico sai em dobro"), Harvest e
        Cud Chew (devolver a fruta já comida), Unburden, Symbiosis, Soul Heart e Receiver / Power of Alchemy
        (reagir ao desmaio de um terceiro), Magic Bounce, Perish Body, Supreme Overlord, Toxic Debris.
     4. MEXERIAM EM REGRA COMPARTILHADA, e o risco não paga uma linha de tabela: Mold Breaker, Turboblaze e
        Teravolt (ignorar a habilidade do alvo em TODO ponto do motor, não só no dano); Neutralizing Gas
        (suprimir a habilidade de todo mundo em campo); Cloud Nine e Air Lock (anular o clima — ele é lido em
        dano, atributo, precisão, cura e fim de turno, cada um com seu caminho); Gorilla Tactics e Mycelium
        Might (a trava de escolha de golpe hoje só olha item, `seg(m).choice`, em TRÊS telas); Heavy/Light
        Metal (peso não existe no jogo), Gluttony (as duas frutas de HP do jogo, Oran e Sitrus, JÁ são comidas em
        50% — a habilidade não teria o que adiantar), Mimicry, Propeller Tail e Stalwart (não há redirecionamento de golpe),
        Unseen Fist e Piercing Drill (furar Proteção), Healer, Mega Sol, Spicy Spray, Delta Stream, Teraform Zero.

     Habilidade fora daqui joga normal, só sem o efeito: a ficha promete "✓ ativa em batalha" apenas pra quem
     está nesta tabela. */
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
