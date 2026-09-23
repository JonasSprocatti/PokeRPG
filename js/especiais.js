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
//   danoIgualHp      o alvo fica com o HP de quem usou (Endeavor)
//   soPrimeiroTurno  só funciona no primeiro golpe que você dá na batalha (Fake Out, First Impression)
//   clima: tipo      muda o tempo da batalha por CLIMA_TURNOS (Rain Dance, Sunny Day, Sandstorm, Hail, Snowscape)
//   terreno: tipo    muda o chão por TERRENO_TURNOS (Electric/Grassy/Psychic/Misty Terrain)
//   lado: campo      liga algo no SEU lado do campo (Reflect, Light Screen, Aurora Veil, Safeguard, Mist, Tailwind)
//   soNoGelo         esse golpe só funciona com granizo ou neve (Aurora Veil)
//   armadilha: tipo  põe Stealth Rock / Spikes / Toxic Spikes no lado do inimigo (pega quem entrar depois)
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
  endeavor: { danoIgualHp: true },
  // só no primeiro golpe que o Pokémon dá na batalha (senão falha) — é o que segura o recuo do Fake Out
  'fake-out': { soPrimeiroTurno: true }, 'first-impression': { soPrimeiroTurno: true },
  // clima (regras.CLIMAS): duram CLIMA_TURNOS e valem pros dois lados
  'rain-dance': { clima: 'chuva' }, 'sunny-day': { clima: 'sol' }, sandstorm: { clima: 'areia' },
  hail: { clima: 'granizo' }, snowscape: { clima: 'neve' }, chillyreception: { clima: 'neve' },
  // terrenos (regras.TERRENOS): duram TERRENO_TURNOS e só valem pra quem está no chão
  'electric-terrain': { terreno: 'eletrico' }, 'grassy-terrain': { terreno: 'grama' },
  'psychic-terrain': { terreno: 'psiquico' }, 'misty-terrain': { terreno: 'fada' },
  // lado do campo (regras.LADO_VAZIO): telas e proteções valem pro SEU lado
  reflect: { lado: 'reflect' }, 'light-screen': { lado: 'luz' }, 'aurora-veil': { lado: 'veu', soNoGelo: true },
  safeguard: { lado: 'salvaguarda' }, mist: { lado: 'neblina' }, tailwind: { lado: 'vento' },
  // armadilhas: ficam no lado de QUEM RECEBE e pegam o próximo Pokémon que entrar em campo
  'stealth-rock': { armadilha: 'pedras' }, spikes: { armadilha: 'espinhos' }, 'toxic-spikes': { armadilha: 'toxinas' }
};
export const especial = g => GOLPES_ESPECIAIS[g?.name] || {};
