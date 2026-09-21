/* ============ dados fixos ============ */
// Só constantes (e construtores de URL). Sem DOM, sem rede: importável direto no Node.
export const API = 'https://pokeapi.co/api/v2';
export const SPR = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
// shiny: montado pelo id (não fica no cache da API — save antigo funciona sem migrar). Gen 8+ não tem sprite de costas.
export const SPR_SHINY = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
export const SPR_SHINY_COSTAS = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/${id}.png`;
export const ITEM_SPR = n => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${n}.png`;

export const STATS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
export const STAT_PT = { hp: 'HP', attack: 'Ataque', defense: 'Defesa', 'special-attack': 'At. Esp.', 'special-defense': 'Def. Esp.', speed: 'Velocidade', accuracy: 'Precisão', evasion: 'Evasão' };
export const STAGE_SHORT = { attack: 'Atq', defense: 'Def', 'special-attack': 'AtE', 'special-defense': 'DfE', speed: 'Vel', accuracy: 'Prec', evasion: 'Eva' };
export const TYPE_PT = { normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico', grass: 'Planta', ice: 'Gelo', fighting: 'Lutador', poison: 'Venenoso', ground: 'Terrestre', flying: 'Voador', psychic: 'Psíquico', bug: 'Inseto', rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio', steel: 'Aço', fairy: 'Fada' };
export const TC = { normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C', grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A', rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD' };
export const DARK_TEXT = new Set(['normal', 'electric', 'grass', 'ice', 'ground', 'bug', 'rock', 'steel', 'fairy', 'flying']);
export const CLS_PT = { physical: 'Físico', special: 'Especial', status: 'Status' };

// tabela de tipos (Gen 6+): se = super efetivo, nv = pouco efetivo, im = imune
export const CHART = {
  normal: { se: [], nv: ['rock', 'steel'], im: ['ghost'] },
  fire: { se: ['grass', 'ice', 'bug', 'steel'], nv: ['fire', 'water', 'rock', 'dragon'] },
  water: { se: ['fire', 'ground', 'rock'], nv: ['water', 'grass', 'dragon'] },
  electric: { se: ['water', 'flying'], nv: ['electric', 'grass', 'dragon'], im: ['ground'] },
  grass: { se: ['water', 'ground', 'rock'], nv: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
  ice: { se: ['grass', 'ground', 'flying', 'dragon'], nv: ['fire', 'water', 'ice', 'steel'] },
  fighting: { se: ['normal', 'ice', 'rock', 'dark', 'steel'], nv: ['poison', 'flying', 'psychic', 'bug', 'fairy'], im: ['ghost'] },
  poison: { se: ['grass', 'fairy'], nv: ['poison', 'ground', 'rock', 'ghost'], im: ['steel'] },
  ground: { se: ['fire', 'electric', 'poison', 'rock', 'steel'], nv: ['grass', 'bug'], im: ['flying'] },
  flying: { se: ['grass', 'fighting', 'bug'], nv: ['electric', 'rock', 'steel'] },
  psychic: { se: ['fighting', 'poison'], nv: ['psychic', 'steel'], im: ['dark'] },
  bug: { se: ['grass', 'psychic', 'dark'], nv: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'] },
  rock: { se: ['fire', 'ice', 'flying', 'bug'], nv: ['fighting', 'ground', 'steel'] },
  ghost: { se: ['psychic', 'ghost'], nv: ['dark'], im: ['normal'] },
  dragon: { se: ['dragon'], nv: ['steel'], im: ['fairy'] },
  dark: { se: ['psychic', 'ghost'], nv: ['fighting', 'dark', 'fairy'] },
  steel: { se: ['ice', 'rock', 'fairy'], nv: ['fire', 'water', 'electric', 'steel'] },
  fairy: { se: ['fighting', 'dragon', 'dark'], nv: ['fire', 'poison', 'steel'] }
};

export const NATURES = {
  hardy: [], lonely: ['attack', 'defense'], brave: ['attack', 'speed'], adamant: ['attack', 'special-attack'], naughty: ['attack', 'special-defense'],
  bold: ['defense', 'attack'], docile: [], relaxed: ['defense', 'speed'], impish: ['defense', 'special-attack'], lax: ['defense', 'special-defense'],
  timid: ['speed', 'attack'], hasty: ['speed', 'defense'], serious: [], jolly: ['speed', 'special-attack'], naive: ['speed', 'special-defense'],
  modest: ['special-attack', 'attack'], mild: ['special-attack', 'defense'], quiet: ['special-attack', 'speed'], bashful: [], rash: ['special-attack', 'special-defense'],
  calm: ['special-defense', 'attack'], gentle: ['special-defense', 'defense'], sassy: ['special-defense', 'speed'], careful: ['special-defense', 'special-attack'], quirky: []
};

// habilidades que o protótipo realmente aplica em batalha
export const PINCH = { overgrow: 'grass', blaze: 'fire', torrent: 'water', swarm: 'bug' };
export const ABSORB = { levitate: { type: 'ground' }, 'flash-fire': { type: 'fire' }, 'volt-absorb': { type: 'electric', heal: true }, 'water-absorb': { type: 'water', heal: true } };
export const IMPL = new Set([...Object.keys(PINCH), ...Object.keys(ABSORB), 'guts', 'intimidate', 'adaptability', 'run-away']);

export const SELF_TARGETS = new Set(['user', 'users-field', 'user-or-ally', 'user-and-allies', 'entire-field', 'all-allies', 'ally']);
export const STRUGGLE = { name: 'struggle', type: 'normal', cls: 'physical', power: 50, acc: null, priority: 0, target: 'selected-pokemon', meta: { drain: -25 }, stats: [], desc: '' };

export const AIL_MSG = { paralysis: 'ficou paralisado', sleep: 'adormeceu', freeze: 'foi congelado', burn: 'foi queimado', poison: 'foi envenenado' };
export const ST_SHORT = { paralysis: 'PAR', sleep: 'DRM', freeze: 'CGL', burn: 'QMD', poison: 'ENV' };

export const ITEMS = {
  potion: { name: 'Potion', desc: 'Recupera 20 HP.', heal: 20, price: 200 },
  'super-potion': { name: 'Super Potion', desc: 'Recupera 60 HP.', heal: 60, price: 600 },
  'hyper-potion': { name: 'Hyper Potion', desc: 'Recupera 120 HP.', heal: 120, price: 1200 },
  antidote: { name: 'Antidote', desc: 'Cura envenenamento.', cure: ['poison'], price: 100 },
  'paralyze-heal': { name: 'Paralyze Heal', desc: 'Cura paralisia.', cure: ['paralysis'], price: 200 },
  awakening: { name: 'Awakening', desc: 'Acorda do sono.', cure: ['sleep'], price: 250 },
  'burn-heal': { name: 'Burn Heal', desc: 'Cura queimadura.', cure: ['burn'], price: 250 },
  'ice-heal': { name: 'Ice Heal', desc: 'Descongela.', cure: ['freeze'], price: 250 },
  'full-heal': { name: 'Full Heal', desc: 'Cura qualquer status.', cure: 'all', price: 600 },
  ether: { name: 'Ether', desc: 'Restaura 10 PP de cada golpe.', ether: 10, price: 800 },
  'x-attack': { name: 'X Attack', desc: 'Ataque +2 nesta batalha.', stage: 'attack', battle: true, price: 500 },
  'x-defense': { name: 'X Defense', desc: 'Defesa +2 nesta batalha.', stage: 'defense', battle: true, price: 500 },
  'x-sp-atk': { name: 'X Sp. Atk', desc: 'At. Esp. +2 nesta batalha.', stage: 'special-attack', battle: true, price: 500 },
  'x-speed': { name: 'X Speed', desc: 'Velocidade +2 nesta batalha.', stage: 'speed', battle: true, price: 500 },
  'rare-candy': { name: 'Rare Candy', desc: 'Sobe um nível na hora.', candy: true },
  // petiscos de afinidade (Etapa 3.2): oferecidos a um selvagem pra ganhar amizade. Chave = nome do sprite na PokéAPI.
  // Os 6 grupos cobrem os 18 tipos exatamente uma vez (teste em dados.test.js).
  charcoal: { name: 'Carvão Doce', desc: 'Petisco que Fogo, Dragão e Lutador adoram.', afinidade: ['fire', 'dragon', 'fighting'], price: 300 },
  'mystic-water': { name: 'Peixe Seco', desc: 'Petisco que Água, Gelo e Voador adoram.', afinidade: ['water', 'ice', 'flying'], price: 300 },
  honey: { name: 'Mel Silvestre', desc: 'Petisco que Planta, Inseto, Fada e Normal adoram.', afinidade: ['grass', 'bug', 'fairy', 'normal'], price: 300 },
  'hard-stone': { name: 'Pedra Mineral', desc: 'Petisco que Pedra, Terrestre e Aço adoram.', afinidade: ['rock', 'ground', 'steel'], price: 300 },
  magnet: { name: 'Bateria Velha', desc: 'Petisco que Elétrico e Psíquico adoram.', afinidade: ['electric', 'psychic'], price: 300 },
  'tiny-mushroom': { name: 'Cogumelo Sombrio', desc: 'Petisco que Fantasma, Sombrio e Venenoso adoram.', afinidade: ['ghost', 'dark', 'poison'], price: 300 }
};
export const FIND_ITEMS = ['potion', 'potion', 'potion', 'super-potion', 'antidote', 'paralyze-heal', 'awakening', 'ether', 'x-attack', 'rare-candy', 'charcoal', 'mystic-water', 'honey', 'hard-stone', 'magnet', 'tiny-mushroom'];

export const ZONES = [
  { id: 'rota1', name: 'Rota 1', min: 2, max: 5, pool: [16, 19, 10, 13, 21], desc: 'Grama baixa e trilhas de terra.' },
  { id: 'floresta', name: 'Floresta de Viridian', min: 3, max: 8, pool: [10, 11, 13, 14, 25, 16], desc: 'Árvores fechadas, muitos insetos.' },
  { id: 'montelua', name: 'Monte Lua', min: 7, max: 13, pool: [41, 74, 46, 35, 27], desc: 'Caverna escura e cheia de pedras.' },
  { id: 'rota24', name: 'Rota 24', min: 10, max: 16, pool: [63, 43, 69, 56, 23, 52], desc: 'Campos abertos ao norte da cidade.' },
  { id: 'torre', name: 'Torre Pokémon', min: 20, max: 28, pool: [92, 93, 104], desc: 'Silêncio, velas e névoa.' },
  { id: 'safari', name: 'Zona Safari', min: 22, max: 30, pool: [111, 115, 123, 127, 128, 113, 102, 48, 84], desc: 'Pokémon raros em terreno selvagem.' },
  { id: 'caverna', name: 'Caverna Cerúlea', min: 45, max: 60, pool: [42, 47, 49, 64, 67, 82, 101, 132, 202], desc: 'Só para quem já é forte.' },
  { id: 'fenda', name: 'Fenda Dimensional', min: 0, max: 0, pool: null, desc: 'Qualquer Pokémon de qualquer geração, perto do seu nível.' }
];
export const FLAVOR = {
  default: ['O vento balança a grama. Nada por aqui.', 'Você ouve algo ao longe, mas não vê ninguém.', 'Um treinador passa correndo e nem nota você.'],
  montelua: ['Gotas pingam do teto da caverna.', 'Uma pedra brilha na escuridão e some.'],
  caverna: ['O eco dos seus passos volta estranho.'],
  torre: ['Uma vela se apaga sozinha.', 'Você sente um arrepio na nuca.'],
  fenda: ['O ar tremula como se o espaço estivesse dobrando.']
};
// Iniciais das 9 regiões (planta, fogo, água) + Pikachu e Eevee: a única escolha inicial do Roguelike (3.3).
export const INICIAIS = [1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912, 25, 133];
export const QUICK = [1, 4, 7, 25, 133, 39, 92, 147, 152, 155, 158, 246, 252, 255, 258, 280, 387, 390, 393, 448];

/* ---- treinadores caçadores e dificuldade (Etapa 3) ---- */
// chave = nome do sprite em ITEM_SPR; mult = multiplicador da fórmula de captura
export const BOLAS = {
  'poke-ball': { nome: 'Poké Ball', mult: 1 },
  'great-ball': { nome: 'Great Ball', mult: 1.5 },
  'ultra-ball': { nome: 'Ultra Ball', mult: 2 }
};
export const CLASSES_TREINADOR = ['Caçador', 'Caçadora', 'Colecionador', 'Pesquisadora', 'Ranger', 'Jovem Treinador', 'Veterana'];
export const NOMES_TREINADOR = ['Rui', 'Bia', 'Otávio', 'Lúcia', 'Caio', 'Marta', 'Téo', 'Iara', 'Nando', 'Sol', 'Davi', 'Nina'];
// Regras de cada modo — o código lê estas flags, nunca compara o nome do modo:
//   semCaptura   = a bola do treinador nunca fecha
//   fimDeJogo    = ser capturado encerra a jornada e apaga o save (senão: foge depois com perdas)
//   centroGratis = Centro Pokémon não cobra
//   descontoPorVitoria = fração do preço do Centro que cada vitória desde a última visita tira (S.vitoriasDesdeCentro)
//   nivelLivre   = escolher o nível inicial (senão começa no 5)
//   escolhaLivre = escolher natureza e habilidade (senão são sorteadas ao começar)
// Save antigo sem o campo dificuldade = easy (dificuldadeDe).
export const DIFICULDADES = {
  easy: { nome: 'Fácil', semCaptura: true, centroGratis: true, nivelLivre: true, escolhaLivre: true, desc: 'Treinadores nunca te capturam e o Centro Pokémon é de graça. Nível inicial, natureza e habilidade à sua escolha.' },
  medium: { nome: 'Médio', semCaptura: true, centroGratis: false, descontoPorVitoria: 0.1, nivelLivre: true, escolhaLivre: true, desc: 'Igual ao Fácil, mas o Centro Pokémon cobra: cada vitória desde a última visita tira 10% do preço.' },
  hard: { nome: 'Difícil', semCaptura: false, centroGratis: false, nivelLivre: false, escolhaLivre: true, desc: 'Se for capturado, você foge dias depois: sem a mochila, com metade do dinheiro, em outra zona. Centro pago. Começa no nível 5.' },
  hardcore: { nome: 'Hardcore', semCaptura: false, fimDeJogo: true, centroGratis: false, nivelLivre: false, escolhaLivre: false, desc: 'Ser capturado é o fim da jornada: o save é apagado. Centro pago. Começa no nível 5, com natureza e habilidade sorteadas.' },
  // sorteia até a espécie (a tela inicial troca a busca por um botão só). Captura e Centro = regras do Difícil
  randomizer: { nome: 'Full Randomizer', semCaptura: false, centroGratis: false, nivelLivre: false, escolhaLivre: false, desc: 'Espécie, natureza e habilidade sorteadas, nível 5. Captura e Centro seguem o Difícil.' }
};