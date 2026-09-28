/* GERADO por ferramentas/gerar-golpe-flags.mjs a partir do repositório-fonte da PokéAPI
   (move_flags.csv + move_flag_map.csv + moves.csv, github.com/PokeAPI/pokeapi) — não editar à mão, rode o
   gerador de novo. A API pública (pokeapi.co) NÃO expõe isso — só o repositório-fonte tem.
   Golpe (nome kebab-case, o mesmo usado em regras.FAMILIAS_GOLPE e em todo golpe do jogo) -> lista de flags,
   das 21 possíveis: contact, charge, recharge, protect, reflectable, snatch, mirror, punch, sound, gravity,
   defrost, distance, heal, authentic, powder, bite, pulse, ballistics, mental, non-sky-battle, dance.
   "Sharpness"/corte NÃO está aqui (é flag da Gen 9, mais nova que este dado-fonte) — regras.FAMILIAS_GOLPE.corte
   continua sendo a única fonte pra corte.
   Golpe sem entrada aqui: não foi mapeado por este dado (golpe novo demais, ou fora do escopo do jogo) — quem lê
   isto (regras.fazContato/temFlag) cai num plano B em vez de assumir "sem flag nenhuma". */
export const GOLPE_FLAGS = {
  "pound": [
    "contact",
    "mirror",
    "protect"
  ],
  "karate-chop": [
    "contact",
    "mirror",
    "protect"
  ],
  "double-slap": [
    "contact",
    "mirror",
    "protect"
  ],
  "comet-punch": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "mega-punch": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "pay-day": [
    "mirror",
    "protect"
  ],
  "fire-punch": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "ice-punch": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "thunder-punch": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "scratch": [
    "contact",
    "mirror",
    "protect"
  ],
  "vice-grip": [
    "contact",
    "mirror",
    "protect"
  ],
  "guillotine": [
    "contact",
    "mirror",
    "protect"
  ],
  "razor-wind": [
    "charge",
    "mirror",
    "protect"
  ],
  "swords-dance": [
    "dance",
    "snatch"
  ],
  "cut": [
    "contact",
    "mirror",
    "protect"
  ],
  "gust": [
    "distance",
    "mirror",
    "protect"
  ],
  "wing-attack": [
    "contact",
    "distance",
    "mirror",
    "protect"
  ],
  "whirlwind": [
    "authentic",
    "mirror",
    "reflectable"
  ],
  "fly": [
    "charge",
    "contact",
    "distance",
    "gravity",
    "mirror",
    "protect"
  ],
  "bind": [
    "contact",
    "mirror",
    "protect"
  ],
  "slam": [
    "contact",
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "vine-whip": [
    "contact",
    "mirror",
    "protect"
  ],
  "stomp": [
    "contact",
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "double-kick": [
    "contact",
    "mirror",
    "protect"
  ],
  "mega-kick": [
    "contact",
    "mirror",
    "protect"
  ],
  "jump-kick": [
    "contact",
    "gravity",
    "mirror",
    "protect"
  ],
  "rolling-kick": [
    "contact",
    "mirror",
    "protect"
  ],
  "sand-attack": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "headbutt": [
    "contact",
    "mirror",
    "protect"
  ],
  "horn-attack": [
    "contact",
    "mirror",
    "protect"
  ],
  "fury-attack": [
    "contact",
    "mirror",
    "protect"
  ],
  "horn-drill": [
    "contact",
    "mirror",
    "protect"
  ],
  "tackle": [
    "contact",
    "mirror",
    "protect"
  ],
  "body-slam": [
    "contact",
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "wrap": [
    "contact",
    "mirror",
    "protect"
  ],
  "take-down": [
    "contact",
    "mirror",
    "protect"
  ],
  "thrash": [
    "contact",
    "mirror",
    "protect"
  ],
  "double-edge": [
    "contact",
    "mirror",
    "protect"
  ],
  "tail-whip": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "poison-sting": [
    "mirror",
    "protect"
  ],
  "twineedle": [
    "mirror",
    "protect"
  ],
  "pin-missile": [
    "mirror",
    "protect"
  ],
  "leer": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "bite": [
    "bite",
    "contact",
    "mirror",
    "protect"
  ],
  "growl": [
    "authentic",
    "mirror",
    "protect",
    "reflectable",
    "sound"
  ],
  "roar": [
    "authentic",
    "mirror",
    "reflectable",
    "sound"
  ],
  "sing": [
    "authentic",
    "mirror",
    "protect",
    "reflectable",
    "sound"
  ],
  "supersonic": [
    "authentic",
    "mirror",
    "protect",
    "reflectable",
    "sound"
  ],
  "sonic-boom": [
    "mirror",
    "protect"
  ],
  "disable": [
    "authentic",
    "mental",
    "mirror",
    "protect",
    "reflectable"
  ],
  "acid": [
    "mirror",
    "protect"
  ],
  "ember": [
    "mirror",
    "protect"
  ],
  "flamethrower": [
    "mirror",
    "protect"
  ],
  "mist": [
    "snatch"
  ],
  "water-gun": [
    "mirror",
    "protect"
  ],
  "hydro-pump": [
    "mirror",
    "protect"
  ],
  "surf": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "ice-beam": [
    "mirror",
    "protect"
  ],
  "blizzard": [
    "mirror",
    "protect"
  ],
  "psybeam": [
    "mirror",
    "protect"
  ],
  "bubble-beam": [
    "mirror",
    "protect"
  ],
  "aurora-beam": [
    "mirror",
    "protect"
  ],
  "hyper-beam": [
    "mirror",
    "protect",
    "recharge"
  ],
  "peck": [
    "contact",
    "distance",
    "mirror",
    "protect"
  ],
  "drill-peck": [
    "contact",
    "distance",
    "mirror",
    "protect"
  ],
  "submission": [
    "contact",
    "mirror",
    "protect"
  ],
  "low-kick": [
    "contact",
    "mirror",
    "protect"
  ],
  "counter": [
    "contact",
    "protect"
  ],
  "seismic-toss": [
    "contact",
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "strength": [
    "contact",
    "mirror",
    "protect"
  ],
  "absorb": [
    "heal",
    "mirror",
    "protect"
  ],
  "mega-drain": [
    "heal",
    "mirror",
    "protect"
  ],
  "leech-seed": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "growth": [
    "snatch"
  ],
  "razor-leaf": [
    "mirror",
    "protect"
  ],
  "solar-beam": [
    "charge",
    "mirror",
    "protect"
  ],
  "poison-powder": [
    "mirror",
    "powder",
    "protect",
    "reflectable"
  ],
  "stun-spore": [
    "mirror",
    "powder",
    "protect",
    "reflectable"
  ],
  "sleep-powder": [
    "mirror",
    "powder",
    "protect",
    "reflectable"
  ],
  "petal-dance": [
    "contact",
    "dance",
    "mirror",
    "protect"
  ],
  "string-shot": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "dragon-rage": [
    "mirror",
    "protect"
  ],
  "fire-spin": [
    "mirror",
    "protect"
  ],
  "thunder-shock": [
    "mirror",
    "protect"
  ],
  "thunderbolt": [
    "mirror",
    "protect"
  ],
  "thunder-wave": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "thunder": [
    "mirror",
    "protect"
  ],
  "rock-throw": [
    "mirror",
    "protect"
  ],
  "earthquake": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "fissure": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "dig": [
    "charge",
    "contact",
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "toxic": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "confusion": [
    "mirror",
    "protect"
  ],
  "psychic": [
    "mirror",
    "protect"
  ],
  "hypnosis": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "meditate": [
    "snatch"
  ],
  "agility": [
    "snatch"
  ],
  "quick-attack": [
    "contact",
    "mirror",
    "protect"
  ],
  "rage": [
    "contact",
    "mirror",
    "protect"
  ],
  "night-shade": [
    "mirror",
    "protect"
  ],
  "mimic": [
    "authentic",
    "protect"
  ],
  "screech": [
    "authentic",
    "mirror",
    "protect",
    "reflectable",
    "sound"
  ],
  "double-team": [
    "snatch"
  ],
  "recover": [
    "heal",
    "snatch"
  ],
  "harden": [
    "snatch"
  ],
  "minimize": [
    "snatch"
  ],
  "smokescreen": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "confuse-ray": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "withdraw": [
    "snatch"
  ],
  "defense-curl": [
    "snatch"
  ],
  "barrier": [
    "snatch"
  ],
  "light-screen": [
    "snatch"
  ],
  "haze": [
    "authentic"
  ],
  "reflect": [
    "snatch"
  ],
  "focus-energy": [
    "snatch"
  ],
  "bide": [
    "contact",
    "protect"
  ],
  "self-destruct": [
    "mirror",
    "protect"
  ],
  "egg-bomb": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "lick": [
    "contact",
    "mirror",
    "protect"
  ],
  "smog": [
    "mirror",
    "protect"
  ],
  "sludge": [
    "mirror",
    "protect"
  ],
  "bone-club": [
    "mirror",
    "protect"
  ],
  "fire-blast": [
    "mirror",
    "protect"
  ],
  "waterfall": [
    "contact",
    "mirror",
    "protect"
  ],
  "clamp": [
    "contact",
    "mirror",
    "protect"
  ],
  "swift": [
    "mirror",
    "protect"
  ],
  "skull-bash": [
    "charge",
    "contact",
    "mirror",
    "protect"
  ],
  "spike-cannon": [
    "mirror",
    "protect"
  ],
  "constrict": [
    "contact",
    "mirror",
    "protect"
  ],
  "amnesia": [
    "snatch"
  ],
  "kinesis": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "soft-boiled": [
    "heal",
    "snatch"
  ],
  "high-jump-kick": [
    "contact",
    "gravity",
    "mirror",
    "protect"
  ],
  "glare": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "dream-eater": [
    "heal",
    "mirror",
    "protect"
  ],
  "poison-gas": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "barrage": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "leech-life": [
    "contact",
    "heal",
    "mirror",
    "protect"
  ],
  "lovely-kiss": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "sky-attack": [
    "charge",
    "distance",
    "mirror",
    "protect"
  ],
  "bubble": [
    "mirror",
    "protect"
  ],
  "dizzy-punch": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "spore": [
    "mirror",
    "powder",
    "protect",
    "reflectable"
  ],
  "flash": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "psywave": [
    "mirror",
    "protect"
  ],
  "splash": [
    "gravity"
  ],
  "acid-armor": [
    "snatch"
  ],
  "crabhammer": [
    "contact",
    "mirror",
    "protect"
  ],
  "explosion": [
    "mirror",
    "protect"
  ],
  "fury-swipes": [
    "contact",
    "mirror",
    "protect"
  ],
  "bonemerang": [
    "mirror",
    "protect"
  ],
  "rest": [
    "heal",
    "snatch"
  ],
  "rock-slide": [
    "mirror",
    "protect"
  ],
  "hyper-fang": [
    "bite",
    "contact",
    "mirror",
    "protect"
  ],
  "sharpen": [
    "snatch"
  ],
  "conversion": [
    "snatch"
  ],
  "tri-attack": [
    "mirror",
    "protect"
  ],
  "super-fang": [
    "contact",
    "mirror",
    "protect"
  ],
  "slash": [
    "contact",
    "mirror",
    "protect"
  ],
  "substitute": [
    "non-sky-battle",
    "snatch"
  ],
  "struggle": [
    "contact",
    "protect"
  ],
  "sketch": [
    "authentic"
  ],
  "triple-kick": [
    "contact",
    "mirror",
    "protect"
  ],
  "thief": [
    "contact",
    "mirror",
    "protect"
  ],
  "spider-web": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "mind-reader": [
    "mirror",
    "protect"
  ],
  "nightmare": [
    "mirror",
    "protect"
  ],
  "flame-wheel": [
    "contact",
    "defrost",
    "mirror",
    "protect"
  ],
  "snore": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "curse": [
    "authentic"
  ],
  "flail": [
    "contact",
    "mirror",
    "protect"
  ],
  "conversion-2": [
    "authentic"
  ],
  "aeroblast": [
    "distance",
    "mirror",
    "protect"
  ],
  "cotton-spore": [
    "mirror",
    "powder",
    "protect",
    "reflectable"
  ],
  "reversal": [
    "contact",
    "mirror",
    "protect"
  ],
  "spite": [
    "authentic",
    "mirror",
    "protect",
    "reflectable"
  ],
  "powder-snow": [
    "mirror",
    "protect"
  ],
  "mach-punch": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "scary-face": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "feint-attack": [
    "contact",
    "mirror",
    "protect"
  ],
  "sweet-kiss": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "belly-drum": [
    "snatch"
  ],
  "sludge-bomb": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "mud-slap": [
    "mirror",
    "protect"
  ],
  "octazooka": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "spikes": [
    "non-sky-battle",
    "reflectable"
  ],
  "zap-cannon": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "foresight": [
    "authentic",
    "mirror",
    "protect",
    "reflectable"
  ],
  "destiny-bond": [
    "authentic"
  ],
  "perish-song": [
    "authentic",
    "distance",
    "sound"
  ],
  "icy-wind": [
    "mirror",
    "protect"
  ],
  "bone-rush": [
    "mirror",
    "protect"
  ],
  "lock-on": [
    "mirror",
    "protect"
  ],
  "outrage": [
    "contact",
    "mirror",
    "protect"
  ],
  "giga-drain": [
    "heal",
    "mirror",
    "protect"
  ],
  "charm": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "rollout": [
    "contact",
    "mirror",
    "protect"
  ],
  "false-swipe": [
    "contact",
    "mirror",
    "protect"
  ],
  "swagger": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "milk-drink": [
    "heal",
    "snatch"
  ],
  "spark": [
    "contact",
    "mirror",
    "protect"
  ],
  "fury-cutter": [
    "contact",
    "mirror",
    "protect"
  ],
  "steel-wing": [
    "contact",
    "mirror",
    "protect"
  ],
  "mean-look": [
    "mirror",
    "reflectable"
  ],
  "attract": [
    "authentic",
    "mental",
    "mirror",
    "protect",
    "reflectable"
  ],
  "heal-bell": [
    "authentic",
    "distance",
    "snatch",
    "sound"
  ],
  "return": [
    "contact",
    "mirror",
    "protect"
  ],
  "present": [
    "mirror",
    "protect"
  ],
  "frustration": [
    "contact",
    "mirror",
    "protect"
  ],
  "safeguard": [
    "snatch"
  ],
  "pain-split": [
    "mirror",
    "protect"
  ],
  "sacred-fire": [
    "defrost",
    "mirror",
    "protect"
  ],
  "magnitude": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "dynamic-punch": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "megahorn": [
    "contact",
    "mirror",
    "protect"
  ],
  "dragon-breath": [
    "mirror",
    "protect"
  ],
  "encore": [
    "authentic",
    "mental",
    "mirror",
    "protect",
    "reflectable"
  ],
  "pursuit": [
    "contact",
    "mirror",
    "protect"
  ],
  "rapid-spin": [
    "contact",
    "mirror",
    "protect"
  ],
  "sweet-scent": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "iron-tail": [
    "contact",
    "mirror",
    "protect"
  ],
  "metal-claw": [
    "contact",
    "mirror",
    "protect"
  ],
  "vital-throw": [
    "contact",
    "mirror",
    "protect"
  ],
  "morning-sun": [
    "heal",
    "snatch"
  ],
  "synthesis": [
    "heal",
    "snatch"
  ],
  "moonlight": [
    "heal",
    "snatch"
  ],
  "hidden-power": [
    "mirror",
    "protect"
  ],
  "cross-chop": [
    "contact",
    "mirror",
    "protect"
  ],
  "twister": [
    "mirror",
    "protect"
  ],
  "crunch": [
    "bite",
    "contact",
    "mirror",
    "protect"
  ],
  "mirror-coat": [
    "protect"
  ],
  "psych-up": [
    "authentic"
  ],
  "extreme-speed": [
    "contact",
    "mirror",
    "protect"
  ],
  "ancient-power": [
    "mirror",
    "protect"
  ],
  "shadow-ball": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "rock-smash": [
    "contact",
    "mirror",
    "protect"
  ],
  "whirlpool": [
    "mirror",
    "protect"
  ],
  "beat-up": [
    "mirror",
    "protect"
  ],
  "fake-out": [
    "contact",
    "mirror",
    "protect"
  ],
  "uproar": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "stockpile": [
    "snatch"
  ],
  "spit-up": [
    "protect"
  ],
  "swallow": [
    "heal",
    "snatch"
  ],
  "heat-wave": [
    "mirror",
    "protect"
  ],
  "torment": [
    "authentic",
    "mental",
    "mirror",
    "protect",
    "reflectable"
  ],
  "flatter": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "will-o-wisp": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "memento": [
    "mirror",
    "protect"
  ],
  "facade": [
    "contact",
    "mirror",
    "protect"
  ],
  "focus-punch": [
    "contact",
    "protect",
    "punch"
  ],
  "smelling-salts": [
    "contact",
    "mirror",
    "protect"
  ],
  "charge": [
    "snatch"
  ],
  "taunt": [
    "authentic",
    "mental",
    "mirror",
    "protect",
    "reflectable"
  ],
  "helping-hand": [
    "authentic"
  ],
  "trick": [
    "mirror",
    "protect"
  ],
  "role-play": [
    "authentic"
  ],
  "wish": [
    "heal",
    "snatch"
  ],
  "ingrain": [
    "non-sky-battle",
    "snatch"
  ],
  "superpower": [
    "contact",
    "mirror",
    "protect"
  ],
  "recycle": [
    "snatch"
  ],
  "revenge": [
    "contact",
    "mirror",
    "protect"
  ],
  "brick-break": [
    "contact",
    "mirror",
    "protect"
  ],
  "yawn": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "knock-off": [
    "contact",
    "mirror",
    "protect"
  ],
  "endeavor": [
    "contact",
    "mirror",
    "protect"
  ],
  "eruption": [
    "mirror",
    "protect"
  ],
  "skill-swap": [
    "authentic",
    "mirror",
    "protect"
  ],
  "imprison": [
    "authentic",
    "snatch"
  ],
  "refresh": [
    "snatch"
  ],
  "grudge": [
    "authentic"
  ],
  "snatch": [
    "authentic"
  ],
  "secret-power": [
    "mirror",
    "protect"
  ],
  "dive": [
    "charge",
    "contact",
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "arm-thrust": [
    "contact",
    "mirror",
    "protect"
  ],
  "camouflage": [
    "snatch"
  ],
  "tail-glow": [
    "snatch"
  ],
  "luster-purge": [
    "mirror",
    "protect"
  ],
  "mist-ball": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "feather-dance": [
    "dance",
    "mirror",
    "protect",
    "reflectable"
  ],
  "teeter-dance": [
    "dance",
    "mirror",
    "protect"
  ],
  "blaze-kick": [
    "contact",
    "mirror",
    "protect"
  ],
  "mud-sport": [
    "non-sky-battle"
  ],
  "ice-ball": [
    "ballistics",
    "contact",
    "mirror",
    "protect"
  ],
  "needle-arm": [
    "contact",
    "mirror",
    "protect"
  ],
  "slack-off": [
    "heal",
    "snatch"
  ],
  "hyper-voice": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "poison-fang": [
    "bite",
    "contact",
    "mirror",
    "protect"
  ],
  "crush-claw": [
    "contact",
    "mirror",
    "protect"
  ],
  "blast-burn": [
    "mirror",
    "protect",
    "recharge"
  ],
  "hydro-cannon": [
    "mirror",
    "protect",
    "recharge"
  ],
  "meteor-mash": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "astonish": [
    "contact",
    "mirror",
    "protect"
  ],
  "weather-ball": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "aromatherapy": [
    "distance",
    "snatch"
  ],
  "fake-tears": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "air-cutter": [
    "mirror",
    "protect"
  ],
  "overheat": [
    "mirror",
    "protect"
  ],
  "odor-sleuth": [
    "authentic",
    "mirror",
    "protect",
    "reflectable"
  ],
  "rock-tomb": [
    "mirror",
    "protect"
  ],
  "silver-wind": [
    "mirror",
    "protect"
  ],
  "metal-sound": [
    "authentic",
    "mirror",
    "protect",
    "reflectable",
    "sound"
  ],
  "grass-whistle": [
    "authentic",
    "mirror",
    "protect",
    "reflectable",
    "sound"
  ],
  "tickle": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "cosmic-power": [
    "snatch"
  ],
  "water-spout": [
    "mirror",
    "protect"
  ],
  "signal-beam": [
    "mirror",
    "protect"
  ],
  "shadow-punch": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "extrasensory": [
    "mirror",
    "protect"
  ],
  "sky-uppercut": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "sand-tomb": [
    "mirror",
    "protect"
  ],
  "sheer-cold": [
    "mirror",
    "protect"
  ],
  "muddy-water": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "bullet-seed": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "aerial-ace": [
    "contact",
    "distance",
    "mirror",
    "protect"
  ],
  "icicle-spear": [
    "mirror",
    "protect"
  ],
  "iron-defense": [
    "snatch"
  ],
  "block": [
    "mirror",
    "reflectable"
  ],
  "howl": [
    "snatch",
    "sound"
  ],
  "dragon-claw": [
    "contact",
    "mirror",
    "protect"
  ],
  "frenzy-plant": [
    "mirror",
    "non-sky-battle",
    "protect",
    "recharge"
  ],
  "bulk-up": [
    "snatch"
  ],
  "bounce": [
    "charge",
    "contact",
    "distance",
    "gravity",
    "mirror",
    "protect"
  ],
  "mud-shot": [
    "mirror",
    "protect"
  ],
  "poison-tail": [
    "contact",
    "mirror",
    "protect"
  ],
  "covet": [
    "contact",
    "mirror",
    "protect"
  ],
  "volt-tackle": [
    "contact",
    "mirror",
    "protect"
  ],
  "magical-leaf": [
    "mirror",
    "protect"
  ],
  "water-sport": [
    "non-sky-battle"
  ],
  "calm-mind": [
    "snatch"
  ],
  "leaf-blade": [
    "contact",
    "mirror",
    "protect"
  ],
  "dragon-dance": [
    "dance",
    "snatch"
  ],
  "rock-blast": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "shock-wave": [
    "mirror",
    "protect"
  ],
  "water-pulse": [
    "distance",
    "mirror",
    "protect",
    "pulse"
  ],
  "psycho-boost": [
    "mirror",
    "protect"
  ],
  "roost": [
    "heal",
    "snatch"
  ],
  "gravity": [
    "non-sky-battle"
  ],
  "miracle-eye": [
    "authentic",
    "mirror",
    "protect",
    "reflectable"
  ],
  "wake-up-slap": [
    "contact",
    "mirror",
    "protect"
  ],
  "hammer-arm": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "gyro-ball": [
    "ballistics",
    "contact",
    "mirror",
    "protect"
  ],
  "healing-wish": [
    "heal",
    "snatch"
  ],
  "brine": [
    "mirror",
    "protect"
  ],
  "natural-gift": [
    "mirror",
    "protect"
  ],
  "feint": [
    "mirror"
  ],
  "pluck": [
    "contact",
    "distance",
    "mirror",
    "protect"
  ],
  "tailwind": [
    "snatch"
  ],
  "metal-burst": [
    "mirror",
    "protect"
  ],
  "u-turn": [
    "contact",
    "mirror",
    "protect"
  ],
  "close-combat": [
    "contact",
    "mirror",
    "protect"
  ],
  "payback": [
    "contact",
    "mirror",
    "protect"
  ],
  "assurance": [
    "contact",
    "mirror",
    "protect"
  ],
  "embargo": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "fling": [
    "mirror",
    "protect"
  ],
  "psycho-shift": [
    "mirror",
    "protect"
  ],
  "trump-card": [
    "contact",
    "mirror",
    "protect"
  ],
  "heal-block": [
    "mental",
    "mirror",
    "protect",
    "reflectable"
  ],
  "wring-out": [
    "contact",
    "mirror",
    "protect"
  ],
  "power-trick": [
    "snatch"
  ],
  "gastro-acid": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "lucky-chant": [
    "snatch"
  ],
  "me-first": [
    "authentic",
    "protect"
  ],
  "power-swap": [
    "authentic",
    "mirror",
    "protect"
  ],
  "guard-swap": [
    "authentic",
    "mirror",
    "protect"
  ],
  "punishment": [
    "contact",
    "mirror",
    "protect"
  ],
  "last-resort": [
    "contact",
    "mirror",
    "protect"
  ],
  "worry-seed": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "sucker-punch": [
    "contact",
    "mirror",
    "protect"
  ],
  "toxic-spikes": [
    "non-sky-battle",
    "reflectable"
  ],
  "heart-swap": [
    "authentic",
    "mirror",
    "protect"
  ],
  "aqua-ring": [
    "snatch"
  ],
  "magnet-rise": [
    "gravity",
    "snatch"
  ],
  "flare-blitz": [
    "contact",
    "defrost",
    "mirror",
    "protect"
  ],
  "force-palm": [
    "contact",
    "mirror",
    "protect"
  ],
  "aura-sphere": [
    "ballistics",
    "distance",
    "mirror",
    "protect",
    "pulse"
  ],
  "rock-polish": [
    "snatch"
  ],
  "poison-jab": [
    "contact",
    "mirror",
    "protect"
  ],
  "dark-pulse": [
    "distance",
    "mirror",
    "protect",
    "pulse"
  ],
  "night-slash": [
    "contact",
    "mirror",
    "protect"
  ],
  "aqua-tail": [
    "contact",
    "mirror",
    "protect"
  ],
  "seed-bomb": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "air-slash": [
    "distance",
    "mirror",
    "protect"
  ],
  "x-scissor": [
    "contact",
    "mirror",
    "protect"
  ],
  "bug-buzz": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "dragon-pulse": [
    "distance",
    "mirror",
    "protect",
    "pulse"
  ],
  "dragon-rush": [
    "contact",
    "mirror",
    "protect"
  ],
  "power-gem": [
    "mirror",
    "protect"
  ],
  "drain-punch": [
    "contact",
    "heal",
    "mirror",
    "protect",
    "punch"
  ],
  "vacuum-wave": [
    "mirror",
    "protect"
  ],
  "focus-blast": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "energy-ball": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "brave-bird": [
    "contact",
    "distance",
    "mirror",
    "protect"
  ],
  "earth-power": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "switcheroo": [
    "mirror",
    "protect"
  ],
  "giga-impact": [
    "contact",
    "mirror",
    "protect",
    "recharge"
  ],
  "nasty-plot": [
    "snatch"
  ],
  "bullet-punch": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "avalanche": [
    "contact",
    "mirror",
    "protect"
  ],
  "ice-shard": [
    "mirror",
    "protect"
  ],
  "shadow-claw": [
    "contact",
    "mirror",
    "protect"
  ],
  "thunder-fang": [
    "bite",
    "contact",
    "mirror",
    "protect"
  ],
  "ice-fang": [
    "bite",
    "contact",
    "mirror",
    "protect"
  ],
  "fire-fang": [
    "bite",
    "contact",
    "mirror",
    "protect"
  ],
  "shadow-sneak": [
    "contact",
    "mirror",
    "protect"
  ],
  "mud-bomb": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "psycho-cut": [
    "mirror",
    "protect"
  ],
  "zen-headbutt": [
    "contact",
    "mirror",
    "protect"
  ],
  "mirror-shot": [
    "mirror",
    "protect"
  ],
  "flash-cannon": [
    "mirror",
    "protect"
  ],
  "rock-climb": [
    "contact",
    "mirror",
    "protect"
  ],
  "defog": [
    "authentic",
    "mirror",
    "protect",
    "reflectable"
  ],
  "trick-room": [
    "mirror"
  ],
  "draco-meteor": [
    "mirror",
    "protect"
  ],
  "discharge": [
    "mirror",
    "protect"
  ],
  "lava-plume": [
    "mirror",
    "protect"
  ],
  "leaf-storm": [
    "mirror",
    "protect"
  ],
  "power-whip": [
    "contact",
    "mirror",
    "protect"
  ],
  "rock-wrecker": [
    "ballistics",
    "mirror",
    "protect",
    "recharge"
  ],
  "cross-poison": [
    "contact",
    "mirror",
    "protect"
  ],
  "gunk-shot": [
    "mirror",
    "protect"
  ],
  "iron-head": [
    "contact",
    "mirror",
    "protect"
  ],
  "magnet-bomb": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "stone-edge": [
    "mirror",
    "protect"
  ],
  "captivate": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "stealth-rock": [
    "reflectable"
  ],
  "grass-knot": [
    "contact",
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "chatter": [
    "authentic",
    "distance",
    "mirror",
    "protect",
    "sound"
  ],
  "judgment": [
    "mirror",
    "protect"
  ],
  "bug-bite": [
    "contact",
    "mirror",
    "protect"
  ],
  "charge-beam": [
    "mirror",
    "protect"
  ],
  "wood-hammer": [
    "contact",
    "mirror",
    "protect"
  ],
  "aqua-jet": [
    "contact",
    "mirror",
    "protect"
  ],
  "attack-order": [
    "mirror",
    "protect"
  ],
  "defend-order": [
    "snatch"
  ],
  "heal-order": [
    "heal",
    "snatch"
  ],
  "head-smash": [
    "contact",
    "mirror",
    "protect"
  ],
  "double-hit": [
    "contact",
    "mirror",
    "protect"
  ],
  "roar-of-time": [
    "mirror",
    "protect",
    "recharge"
  ],
  "spacial-rend": [
    "mirror",
    "protect"
  ],
  "lunar-dance": [
    "dance",
    "heal",
    "snatch"
  ],
  "crush-grip": [
    "contact",
    "mirror",
    "protect"
  ],
  "magma-storm": [
    "mirror",
    "protect"
  ],
  "dark-void": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "seed-flare": [
    "mirror",
    "protect"
  ],
  "ominous-wind": [
    "mirror",
    "protect"
  ],
  "shadow-force": [
    "charge",
    "contact",
    "mirror"
  ],
  "hone-claws": [
    "snatch"
  ],
  "wide-guard": [
    "snatch"
  ],
  "guard-split": [
    "protect"
  ],
  "power-split": [
    "protect"
  ],
  "wonder-room": [
    "mirror"
  ],
  "psyshock": [
    "mirror",
    "protect"
  ],
  "venoshock": [
    "mirror",
    "protect"
  ],
  "autotomize": [
    "snatch"
  ],
  "rage-powder": [
    "powder"
  ],
  "telekinesis": [
    "gravity",
    "mirror",
    "protect",
    "reflectable"
  ],
  "magic-room": [
    "mirror"
  ],
  "smack-down": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "storm-throw": [
    "contact",
    "mirror",
    "protect"
  ],
  "flame-burst": [
    "mirror",
    "protect"
  ],
  "sludge-wave": [
    "mirror",
    "protect"
  ],
  "quiver-dance": [
    "dance",
    "snatch"
  ],
  "heavy-slam": [
    "contact",
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "synchronoise": [
    "mirror",
    "protect"
  ],
  "electro-ball": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "soak": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "flame-charge": [
    "contact",
    "mirror",
    "protect"
  ],
  "coil": [
    "snatch"
  ],
  "low-sweep": [
    "contact",
    "mirror",
    "protect"
  ],
  "acid-spray": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "foul-play": [
    "contact",
    "mirror",
    "protect"
  ],
  "simple-beam": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "entrainment": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "after-you": [
    "authentic"
  ],
  "round": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "echoed-voice": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "chip-away": [
    "contact",
    "mirror",
    "protect"
  ],
  "clear-smog": [
    "mirror",
    "protect"
  ],
  "stored-power": [
    "mirror",
    "protect"
  ],
  "quick-guard": [
    "snatch"
  ],
  "scald": [
    "defrost",
    "mirror",
    "protect"
  ],
  "shell-smash": [
    "snatch"
  ],
  "heal-pulse": [
    "distance",
    "heal",
    "protect",
    "pulse",
    "reflectable"
  ],
  "hex": [
    "mirror",
    "protect"
  ],
  "sky-drop": [
    "charge",
    "contact",
    "distance",
    "gravity",
    "mirror",
    "protect"
  ],
  "shift-gear": [
    "snatch"
  ],
  "circle-throw": [
    "contact",
    "mirror",
    "protect"
  ],
  "incinerate": [
    "mirror",
    "protect"
  ],
  "quash": [
    "mirror",
    "protect"
  ],
  "acrobatics": [
    "contact",
    "distance",
    "mirror",
    "protect"
  ],
  "reflect-type": [
    "authentic",
    "protect"
  ],
  "retaliate": [
    "contact",
    "mirror",
    "protect"
  ],
  "final-gambit": [
    "protect"
  ],
  "bestow": [
    "authentic",
    "mirror"
  ],
  "inferno": [
    "mirror",
    "protect"
  ],
  "water-pledge": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "fire-pledge": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "grass-pledge": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "volt-switch": [
    "mirror",
    "protect"
  ],
  "struggle-bug": [
    "mirror",
    "protect"
  ],
  "bulldoze": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "frost-breath": [
    "mirror",
    "protect"
  ],
  "dragon-tail": [
    "contact",
    "mirror",
    "protect"
  ],
  "work-up": [
    "snatch"
  ],
  "electroweb": [
    "mirror",
    "protect"
  ],
  "wild-charge": [
    "contact",
    "mirror",
    "protect"
  ],
  "drill-run": [
    "contact",
    "mirror",
    "protect"
  ],
  "dual-chop": [
    "contact",
    "mirror",
    "protect"
  ],
  "heart-stamp": [
    "contact",
    "mirror",
    "protect"
  ],
  "horn-leech": [
    "contact",
    "heal",
    "mirror",
    "protect"
  ],
  "sacred-sword": [
    "contact",
    "mirror",
    "protect"
  ],
  "razor-shell": [
    "contact",
    "mirror",
    "protect"
  ],
  "heat-crash": [
    "contact",
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "leaf-tornado": [
    "mirror",
    "protect"
  ],
  "steamroller": [
    "contact",
    "mirror",
    "protect"
  ],
  "cotton-guard": [
    "snatch"
  ],
  "night-daze": [
    "mirror",
    "protect"
  ],
  "psystrike": [
    "mirror",
    "protect"
  ],
  "tail-slap": [
    "contact",
    "mirror",
    "protect"
  ],
  "hurricane": [
    "distance",
    "mirror",
    "protect"
  ],
  "head-charge": [
    "contact",
    "mirror",
    "protect"
  ],
  "gear-grind": [
    "contact",
    "mirror",
    "protect"
  ],
  "searing-shot": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "techno-blast": [
    "mirror",
    "protect"
  ],
  "relic-song": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "secret-sword": [
    "mirror",
    "protect"
  ],
  "glaciate": [
    "mirror",
    "protect"
  ],
  "bolt-strike": [
    "contact",
    "mirror",
    "protect"
  ],
  "blue-flare": [
    "mirror",
    "protect"
  ],
  "fiery-dance": [
    "dance",
    "mirror",
    "protect"
  ],
  "freeze-shock": [
    "charge",
    "mirror",
    "protect"
  ],
  "ice-burn": [
    "charge",
    "mirror",
    "protect"
  ],
  "snarl": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "icicle-crash": [
    "mirror",
    "protect"
  ],
  "v-create": [
    "contact",
    "mirror",
    "protect"
  ],
  "fusion-flare": [
    "defrost",
    "mirror",
    "protect"
  ],
  "fusion-bolt": [
    "mirror",
    "protect"
  ],
  "flying-press": [
    "contact",
    "distance",
    "gravity",
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "mat-block": [
    "non-sky-battle",
    "snatch"
  ],
  "belch": [
    "protect"
  ],
  "rototiller": [
    "distance",
    "non-sky-battle"
  ],
  "sticky-web": [
    "reflectable"
  ],
  "fell-stinger": [
    "contact",
    "mirror",
    "protect"
  ],
  "phantom-force": [
    "charge",
    "contact",
    "mirror"
  ],
  "trick-or-treat": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "noble-roar": [
    "authentic",
    "mirror",
    "protect",
    "reflectable",
    "sound"
  ],
  "parabolic-charge": [
    "heal",
    "mirror",
    "protect"
  ],
  "forests-curse": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "petal-blizzard": [
    "mirror",
    "protect"
  ],
  "freeze-dry": [
    "mirror",
    "protect"
  ],
  "disarming-voice": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "parting-shot": [
    "authentic",
    "mirror",
    "protect",
    "reflectable",
    "sound"
  ],
  "topsy-turvy": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "draining-kiss": [
    "contact",
    "heal",
    "mirror",
    "protect"
  ],
  "flower-shield": [
    "distance"
  ],
  "grassy-terrain": [
    "non-sky-battle"
  ],
  "misty-terrain": [
    "non-sky-battle"
  ],
  "electrify": [
    "mirror",
    "protect"
  ],
  "play-rough": [
    "contact",
    "mirror",
    "protect"
  ],
  "fairy-wind": [
    "mirror",
    "protect"
  ],
  "moonblast": [
    "mirror",
    "protect"
  ],
  "boomburst": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "fairy-lock": [
    "authentic",
    "mirror"
  ],
  "play-nice": [
    "authentic",
    "mirror",
    "reflectable"
  ],
  "confide": [
    "authentic",
    "mirror",
    "reflectable",
    "sound"
  ],
  "diamond-storm": [
    "mirror",
    "protect"
  ],
  "steam-eruption": [
    "defrost",
    "mirror",
    "protect"
  ],
  "hyperspace-hole": [
    "authentic",
    "mirror"
  ],
  "water-shuriken": [
    "mirror",
    "protect"
  ],
  "mystical-fire": [
    "mirror",
    "protect"
  ],
  "aromatic-mist": [
    "authentic"
  ],
  "eerie-impulse": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "venom-drench": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "powder": [
    "authentic",
    "mirror",
    "powder",
    "protect",
    "reflectable"
  ],
  "geomancy": [
    "charge",
    "non-sky-battle"
  ],
  "magnetic-flux": [
    "authentic",
    "distance",
    "snatch"
  ],
  "electric-terrain": [
    "non-sky-battle"
  ],
  "dazzling-gleam": [
    "mirror",
    "protect"
  ],
  "hold-hands": [
    "authentic"
  ],
  "baby-doll-eyes": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "nuzzle": [
    "contact",
    "mirror",
    "protect"
  ],
  "hold-back": [
    "contact",
    "mirror",
    "protect"
  ],
  "infestation": [
    "contact",
    "mirror",
    "protect"
  ],
  "power-up-punch": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "oblivion-wing": [
    "distance",
    "heal",
    "mirror",
    "protect"
  ],
  "thousand-arrows": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "thousand-waves": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "lands-wrath": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "light-of-ruin": [
    "mirror",
    "protect"
  ],
  "origin-pulse": [
    "mirror",
    "protect",
    "pulse"
  ],
  "precipice-blades": [
    "mirror",
    "non-sky-battle",
    "protect"
  ],
  "dragon-ascent": [
    "contact",
    "distance",
    "mirror",
    "protect"
  ],
  "hyperspace-fury": [
    "authentic",
    "mirror"
  ],
  "catastropika": [
    "contact"
  ],
  "shore-up": [
    "heal",
    "snatch"
  ],
  "first-impression": [
    "contact",
    "mirror",
    "protect"
  ],
  "spirit-shackle": [
    "mirror",
    "protect"
  ],
  "darkest-lariat": [
    "contact",
    "mirror",
    "protect"
  ],
  "sparkling-aria": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "ice-hammer": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "floral-healing": [
    "heal",
    "protect",
    "reflectable"
  ],
  "high-horsepower": [
    "contact",
    "mirror",
    "protect"
  ],
  "strength-sap": [
    "heal",
    "mirror",
    "protect",
    "reflectable"
  ],
  "solar-blade": [
    "charge",
    "contact",
    "mirror",
    "protect"
  ],
  "leafage": [
    "mirror",
    "protect"
  ],
  "spotlight": [
    "protect",
    "reflectable"
  ],
  "toxic-thread": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "laser-focus": [
    "snatch"
  ],
  "gear-up": [
    "authentic",
    "snatch"
  ],
  "throat-chop": [
    "contact",
    "mirror",
    "protect"
  ],
  "pollen-puff": [
    "ballistics",
    "mirror",
    "protect"
  ],
  "anchor-shot": [
    "contact",
    "mirror",
    "protect"
  ],
  "psychic-terrain": [
    "non-sky-battle"
  ],
  "lunge": [
    "contact",
    "mirror",
    "protect"
  ],
  "fire-lash": [
    "contact",
    "mirror",
    "protect"
  ],
  "power-trip": [
    "contact",
    "mirror",
    "protect"
  ],
  "burn-up": [
    "defrost",
    "mirror",
    "protect"
  ],
  "speed-swap": [
    "authentic",
    "mirror",
    "protect"
  ],
  "smart-strike": [
    "contact",
    "mirror",
    "protect"
  ],
  "purify": [
    "heal",
    "protect",
    "reflectable"
  ],
  "revelation-dance": [
    "dance",
    "mirror",
    "protect"
  ],
  "core-enforcer": [
    "mirror",
    "protect"
  ],
  "trop-kick": [
    "contact",
    "mirror",
    "protect"
  ],
  "instruct": [
    "authentic",
    "protect"
  ],
  "beak-blast": [
    "ballistics",
    "protect"
  ],
  "clanging-scales": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "dragon-hammer": [
    "contact",
    "mirror",
    "protect"
  ],
  "brutal-swing": [
    "contact",
    "mirror",
    "protect"
  ],
  "aurora-veil": [
    "snatch"
  ],
  "malicious-moonsault": [
    "contact"
  ],
  "soul-stealing-7-star-strike": [
    "contact"
  ],
  "pulverizing-pancake": [
    "contact"
  ],
  "shell-trap": [
    "protect"
  ],
  "fleur-cannon": [
    "mirror",
    "protect"
  ],
  "psychic-fangs": [
    "bite",
    "contact",
    "mirror",
    "protect"
  ],
  "stomping-tantrum": [
    "contact",
    "mirror",
    "protect"
  ],
  "shadow-bone": [
    "mirror",
    "protect"
  ],
  "accelerock": [
    "contact",
    "mirror",
    "protect"
  ],
  "liquidation": [
    "contact",
    "mirror",
    "protect"
  ],
  "prismatic-laser": [
    "mirror",
    "protect",
    "recharge"
  ],
  "spectral-thief": [
    "authentic",
    "contact",
    "mirror",
    "protect"
  ],
  "sunsteel-strike": [
    "contact",
    "mirror",
    "protect"
  ],
  "moongeist-beam": [
    "mirror",
    "protect"
  ],
  "tearful-look": [
    "mirror",
    "reflectable"
  ],
  "zing-zap": [
    "contact",
    "mirror",
    "protect"
  ],
  "natures-madness": [
    "mirror",
    "protect"
  ],
  "multi-attack": [
    "contact",
    "mirror",
    "protect"
  ],
  "mind-blown": [
    "mirror",
    "protect"
  ],
  "plasma-fists": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "photon-geyser": [
    "mirror",
    "protect"
  ],
  "searing-sunraze-smash": [
    "contact"
  ],
  "lets-snuggle-forever": [
    "contact"
  ],
  "clangorous-soulblaze": [
    "authentic",
    "sound"
  ],
  "zippy-zap": [
    "contact",
    "mirror",
    "protect"
  ],
  "splishy-splash": [
    "mirror",
    "protect"
  ],
  "floaty-fall": [
    "contact",
    "gravity",
    "mirror",
    "protect"
  ],
  "pika-papow": [
    "mirror",
    "protect"
  ],
  "bouncy-bubble": [
    "heal",
    "mirror",
    "protect"
  ],
  "buzzy-buzz": [
    "mirror",
    "protect"
  ],
  "sizzly-slide": [
    "contact",
    "defrost",
    "mirror",
    "protect"
  ],
  "glitzy-glow": [
    "mirror",
    "protect"
  ],
  "baddy-bad": [
    "mirror",
    "protect"
  ],
  "sappy-seed": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "freezy-frost": [
    "mirror",
    "protect"
  ],
  "sparkly-swirl": [
    "mirror",
    "protect"
  ],
  "veevee-volley": [
    "contact",
    "mirror",
    "protect"
  ],
  "double-iron-bash": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "dynamax-cannon": [
    "protect"
  ],
  "snipe-shot": [
    "mirror",
    "protect"
  ],
  "jaw-lock": [
    "bite",
    "contact",
    "mirror",
    "protect"
  ],
  "stuff-cheeks": [
    "snatch"
  ],
  "no-retreat": [
    "snatch"
  ],
  "tar-shot": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "magic-powder": [
    "mirror",
    "powder",
    "protect",
    "reflectable"
  ],
  "dragon-darts": [
    "mirror",
    "protect"
  ],
  "teatime": [
    "authentic"
  ],
  "octolock": [
    "mirror",
    "protect"
  ],
  "bolt-beak": [
    "contact",
    "mirror",
    "protect"
  ],
  "fishious-rend": [
    "bite",
    "contact",
    "mirror",
    "protect"
  ],
  "court-change": [
    "mirror"
  ],
  "clangorous-soul": [
    "dance",
    "snatch",
    "sound"
  ],
  "body-press": [
    "contact",
    "mirror",
    "protect"
  ],
  "drum-beating": [
    "mirror",
    "protect"
  ],
  "snap-trap": [
    "contact",
    "mirror",
    "protect"
  ],
  "pyro-ball": [
    "ballistics",
    "defrost",
    "mirror",
    "protect"
  ],
  "behemoth-blade": [
    "contact",
    "mirror",
    "protect"
  ],
  "behemoth-bash": [
    "contact",
    "mirror",
    "protect"
  ],
  "aura-wheel": [
    "mirror",
    "protect"
  ],
  "breaking-swipe": [
    "contact",
    "mirror",
    "protect"
  ],
  "branch-poke": [
    "contact",
    "mirror",
    "protect"
  ],
  "overdrive": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "apple-acid": [
    "mirror",
    "protect"
  ],
  "grav-apple": [
    "mirror",
    "protect"
  ],
  "spirit-break": [
    "contact",
    "mirror",
    "protect"
  ],
  "strange-steam": [
    "mirror",
    "protect"
  ],
  "life-dew": [
    "authentic",
    "heal",
    "snatch"
  ],
  "false-surrender": [
    "contact",
    "mirror",
    "protect"
  ],
  "meteor-assault": [
    "mirror",
    "protect",
    "recharge"
  ],
  "eternabeam": [
    "mirror",
    "protect",
    "recharge"
  ],
  "steel-beam": [
    "mirror",
    "protect"
  ],
  "expanding-force": [
    "mirror",
    "protect"
  ],
  "steel-roller": [
    "contact",
    "mirror",
    "protect"
  ],
  "scale-shot": [
    "mirror",
    "protect"
  ],
  "meteor-beam": [
    "charge",
    "mirror",
    "protect"
  ],
  "shell-side-arm": [
    "mirror",
    "protect"
  ],
  "misty-explosion": [
    "mirror",
    "protect"
  ],
  "grassy-glide": [
    "contact",
    "mirror",
    "protect"
  ],
  "rising-voltage": [
    "mirror",
    "protect"
  ],
  "terrain-pulse": [
    "mirror",
    "protect",
    "pulse"
  ],
  "skitter-smack": [
    "contact",
    "mirror",
    "protect"
  ],
  "burning-jealousy": [
    "mirror",
    "protect"
  ],
  "lash-out": [
    "contact",
    "mirror",
    "protect"
  ],
  "poltergeist": [
    "mirror",
    "protect"
  ],
  "corrosive-gas": [
    "mirror",
    "protect",
    "reflectable"
  ],
  "coaching": [
    "authentic"
  ],
  "flip-turn": [
    "contact",
    "mirror",
    "protect"
  ],
  "triple-axel": [
    "contact",
    "mirror",
    "protect"
  ],
  "dual-wingbeat": [
    "contact",
    "mirror",
    "protect"
  ],
  "scorching-sands": [
    "defrost",
    "mirror",
    "protect"
  ],
  "jungle-healing": [
    "authentic",
    "heal"
  ],
  "wicked-blow": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "surging-strikes": [
    "contact",
    "mirror",
    "protect",
    "punch"
  ],
  "thunder-cage": [
    "mirror",
    "protect"
  ],
  "dragon-energy": [
    "mirror",
    "protect"
  ],
  "freezing-glare": [
    "mirror",
    "protect"
  ],
  "fiery-wrath": [
    "mirror",
    "protect"
  ],
  "thunderous-kick": [
    "contact",
    "mirror",
    "protect"
  ],
  "glacial-lance": [
    "mirror",
    "protect"
  ],
  "astral-barrage": [
    "mirror",
    "protect"
  ],
  "eerie-spell": [
    "authentic",
    "mirror",
    "protect",
    "sound"
  ],
  "shadow-rush": [
    "contact",
    "protect"
  ],
  "shadow-blast": [
    "protect"
  ],
  "shadow-blitz": [
    "contact",
    "mirror",
    "protect"
  ],
  "shadow-bolt": [
    "protect"
  ],
  "shadow-break": [
    "contact",
    "mirror",
    "protect"
  ],
  "shadow-chill": [
    "mirror",
    "protect"
  ],
  "shadow-end": [
    "contact",
    "mirror",
    "protect"
  ],
  "shadow-fire": [
    "mirror",
    "protect"
  ],
  "shadow-rave": [
    "mirror",
    "protect"
  ],
  "shadow-storm": [
    "protect"
  ],
  "shadow-wave": [
    "protect"
  ],
  "shadow-down": [
    "mirror",
    "protect"
  ],
  "shadow-half": [
    "protect",
    "recharge"
  ],
  "shadow-hold": [
    "mirror",
    "protect"
  ],
  "shadow-mist": [
    "mirror",
    "protect"
  ],
  "shadow-panic": [
    "mirror",
    "protect",
    "sound"
  ],
  "shadow-shed": [
    "protect"
  ],
  "shadow-sky": [
    "protect"
  ]
};
// As 21 flags que existem (move_flags.csv) — usado só pra validar (tests/habilidades.test.js) que um `imuneFlag`
// na tabela de habilidades não tem erro de digitação.
export const FLAGS_VALIDAS = ["authentic","ballistics","bite","charge","contact","dance","defrost","distance","gravity","heal","mental","mirror","non-sky-battle","powder","protect","pulse","punch","recharge","reflectable","snatch","sound"];
