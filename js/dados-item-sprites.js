/* GERADO por ferramentas/gerar-item-sprites.mjs a partir da PokéAPI — não editar à mão (rode de novo).
   Pedra Mega (dados.ITEM_PEDRA_MEGA) e Cristal Z (dados.ITEM_CRISTAL_Z) são itens ÚNICOS e genéricos no jogo —
   isso aqui é só pro SPRITE mudar pra pedra/cristal de verdade conforme a espécie/tipo, em vez do ícone genérico.
   PEDRAS_MEGA: só 47 de 89 espécies têm pedra desenhada de verdade na
   PokéAPI (as Megas oficiais dos jogos + Kyogre/Groudon); o resto (Megas que só existem neste projeto, como
   Meganium ou Greninja) cai na Pedra-Chave genérica (CHAVE_MEGA_GENERICA) — ela é um item real dos jogos e ativa
   QUALQUER Mega Evolução, então nunca fica errado mostrar ela.
   Sem pedra própria (usam a Chave genérica): rayquaza, clefable, victreebel, starmie, dragonite, meganium, feraligatr, skarmory, froslass, emboar, excadrill, scolipede, scrafty, eelektross, chandelure, chesnaught, delphox, greninja, pyroar, floette, malamar, barbaracle, dragalge, hawlucha, zygarde, drampa, falinks, raichu, chimecho, staraptor, heatran, darkrai, golurk, meowstic, crabominable, golisopod, magearna, zeraora, scovillain, glimmora, tatsugiri, baxcalibur. */
export const PEDRAS_MEGA = {
  gengar: "gengarite",
  gardevoir: "gardevoirite",
  ampharos: "ampharosite",
  venusaur: "venusaurite",
  charizard: "charizardite-x",
  blastoise: "blastoisinite",
  mewtwo: "mewtwonite-x",
  blaziken: "blazikenite",
  medicham: "medichamite",
  houndoom: "houndoominite",
  aggron: "aggronite",
  banette: "banettite",
  tyranitar: "tyranitarite",
  scizor: "scizorite",
  pinsir: "pinsirite",
  aerodactyl: "aerodactylite",
  lucario: "lucarionite",
  abomasnow: "abomasite",
  kangaskhan: "kangaskhanite",
  gyarados: "gyaradosite",
  absol: "absolite",
  alakazam: "alakazite",
  heracross: "heracronite",
  mawile: "mawilite",
  manectric: "manectite",
  garchomp: "garchompite",
  latias: "latiasite",
  latios: "latiosite",
  swampert: "swampertite",
  sceptile: "sceptilite",
  sableye: "sablenite",
  altaria: "altarianite",
  gallade: "galladite",
  audino: "audinite",
  metagross: "metagrossite",
  sharpedo: "sharpedonite",
  slowbro: "slowbronite",
  steelix: "steelixite",
  pidgeot: "pidgeotite",
  glalie: "glalitite",
  diancie: "diancite",
  camerupt: "cameruptite",
  lopunny: "lopunnite",
  salamence: "salamencite",
  beedrill: "beedrillite",
  kyogre: "blue-orb",
  groudon: "red-orb"
};
export const CHAVE_MEGA_GENERICA = 'key-stone';
export const CRISTAIS_Z = {
  normal: "normalium-z",
  fire: "firium-z",
  water: "waterium-z",
  electric: "electrium-z",
  grass: "grassium-z",
  ice: "icium-z",
  fighting: "fightinium-z",
  poison: "poisonium-z",
  ground: "groundium-z",
  flying: "flyinium-z",
  psychic: "psychium-z",
  bug: "buginium-z",
  rock: "rockium-z",
  ghost: "ghostium-z",
  dragon: "dragonium-z",
  dark: "darkinium-z",
  steel: "steelium-z",
  fairy: "fairium-z"
};
export const ANEL_Z_GENERICO = 'z-power-ring';
