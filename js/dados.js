/* ============ dados fixos ============ */
// Só constantes (e construtores de URL). Sem DOM, sem rede: importável direto no Node.
import { GENS } from './dados-mapas.js';
export const API = 'https://pokeapi.co/api/v2';
export const SPR = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
// shiny: montado pelo id (não fica no cache da API — save antigo funciona sem migrar). Gen 8+ não tem sprite de costas.
export const SPR_SHINY = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
export const SPR_SHINY_COSTAS = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/${id}.png`;
export const ITEM_SPR = n => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${n}.png`;
/* Alguns itens novos (Gen 8/9) simplesmente NÃO têm imagem no repositório de sprites da PokéAPI — Coroa Galárica,
   Armadura Auspiciosa, Pote Rachado... Antes a figura quebrada era escondida (visibility:hidden) e sobrava um buraco:
   parecia bug de renderização. Agora cai neste ícone de caixinha (SVG embutido, não depende de rede).
   `ITEM_ERRO` vai no onerror="" da <img>; o encodeURIComponent tira toda aspa dupla, então cabe no atributo. */
export const ITEM_SPR_RESERVA = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="4" y="11" width="24" height="16" rx="3" fill="#6b74c9"/><rect x="4" y="11" width="24" height="5" rx="2" fill="#9aa3ff"/><rect x="14" y="11" width="4" height="16" fill="#3b4190"/><path d="M16 10c0-3 3-4 4-2.5S18 10 16 10zm0 0c0-3-3-4-4-2.5S14 10 16 10z" fill="#9aa3ff"/></svg>`);
export const ITEM_ERRO = `this.onerror=null;this.src='${ITEM_SPR_RESERVA}'`;

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

// habilidades com efeito em batalha: js/habilidades.js

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
  // Revive: em você é gasto sozinho ao desmaiar (depois dos desmaios livres do modo); num aliado desmaiado, reanima com metade do HP
  revive: { name: 'Revive', desc: 'Reanima um aliado desmaiado com metade do HP. Do Médio pra cima, te salva do Game Over depois do 3º desmaio.', revive: true, price: 1500 },
  // petiscos de afinidade (Etapa 3.2): oferecidos a um selvagem pra ganhar amizade. Chave = nome do sprite na PokéAPI.
  // Os 6 grupos cobrem os 18 tipos exatamente uma vez (teste em dados.test.js).
  charcoal: { name: 'Carvão Doce', desc: 'Petisco que Fogo, Dragão e Lutador adoram.', afinidade: ['fire', 'dragon', 'fighting'], price: 300 },
  'mystic-water': { name: 'Peixe Seco', desc: 'Petisco que Água, Gelo e Voador adoram.', afinidade: ['water', 'ice', 'flying'], price: 300 },
  honey: { name: 'Mel Silvestre', desc: 'Petisco que Planta, Inseto, Fada e Normal adoram.', afinidade: ['grass', 'bug', 'fairy', 'normal'], price: 300 },
  'hard-stone': { name: 'Pedra Mineral', desc: 'Petisco que Pedra, Terrestre e Aço adoram.', afinidade: ['rock', 'ground', 'steel'], price: 300 },
  magnet: { name: 'Bateria Velha', desc: 'Petisco que Elétrico e Psíquico adoram.', afinidade: ['electric', 'psychic'], price: 300 },
  'tiny-mushroom': { name: 'Cogumelo Sombrio', desc: 'Petisco que Fantasma, Sombrio e Venenoso adoram.', afinidade: ['ghost', 'dark', 'poison'], price: 300 }
};
// Itens de evolução (evolucao.js). `evo: true` = usar num Pokémon da equipe pra evoluir (gatilho da PokéAPI
// 'use-item'); `troca: true` = o Cabo de Conexão (gatilho 'trade'); `segurar: true` = a evolução pede ele na mochila
// (troca segurando, ou subir de nível segurando — some ao evoluir). Pedras e o Cabo vendem na loja; o resto se acha
// explorando rotas a partir da 4ª (ITENS_EVO_ACHADOS) ou vem de prêmio de Alfa.
const pedra = (name, desc) => ({ name, desc: `Faz certos Pokémon evoluírem na hora (${desc}).`, evo: true, price: 2100 });
const segurado = (name, desc) => ({ name, desc: `Evolução por troca ou por nível: fica na mochila e é gasto ao evoluir (${desc}).`, segurar: true });
const especial = (name, desc) => ({ name, desc: `Faz certos Pokémon evoluírem na hora (${desc}).`, evo: true });
export const ITENS_EVO = {
  'fire-stone': pedra('Pedra do Fogo', 'Vulpix, Growlithe, Eevee…'), 'water-stone': pedra('Pedra da Água', 'Poliwhirl, Shellder, Eevee…'),
  'thunder-stone': pedra('Pedra do Trovão', 'Pikachu, Eevee, Magneton…'), 'leaf-stone': pedra('Pedra da Folha', 'Gloom, Weepinbell, Eevee…'),
  'moon-stone': pedra('Pedra da Lua', 'Clefairy, Jigglypuff, Nidorina…'), 'sun-stone': pedra('Pedra do Sol', 'Gloom, Sunkern, Cottonee…'),
  'shiny-stone': pedra('Pedra Brilhante', 'Togetic, Roselia, Minccino…'), 'dusk-stone': pedra('Pedra do Crepúsculo', 'Murkrow, Misdreavus, Lampent…'),
  'dawn-stone': pedra('Pedra da Aurora', 'Kirlia, Snorunt'), 'ice-stone': pedra('Pedra do Gelo', 'Eevee, Vulpix de Alola, Cetoddle…'),
  'linking-cord': { name: 'Cabo de Conexão', desc: 'Simula uma troca: evolui quem só evolui trocando (Kadabra, Machoke, Graveler, Haunter…). Alguns pedem também um item na mochila.', troca: true, price: 3000 },
  'metal-coat': segurado('Revestimento Metálico', 'Onix, Scyther'), 'kings-rock': segurado('Pedra do Rei', 'Poliwhirl, Slowpoke'),
  'dragon-scale': segurado('Escama de Dragão', 'Seadra'), 'up-grade': segurado('Melhoria', 'Porygon'), 'dubious-disc': segurado('Disco Duvidoso', 'Porygon2'),
  protector: segurado('Protetor', 'Rhydon'), electirizer: segurado('Eletrizador', 'Electabuzz'), magmarizer: segurado('Magmatizador', 'Magmar'),
  'reaper-cloth': segurado('Pano Ceifador', 'Dusclops'), 'prism-scale': segurado('Escama Prisma', 'Feebas'),
  'deep-sea-tooth': segurado('Dente Abissal', 'Clamperl'), 'deep-sea-scale': segurado('Escama Abissal', 'Clamperl'),
  sachet: segurado('Sachê', 'Spritzee'), 'whipped-dream': segurado('Chantili dos Sonhos', 'Swirlix'),
  'razor-claw': segurado('Garra Afiada', 'Sneasel, à noite'), 'razor-fang': segurado('Presa Afiada', 'Gligar, à noite'), 'oval-stone': segurado('Pedra Oval', 'Happiny, de dia'),
  'sweet-apple': especial('Maçã Doce', 'Applin'), 'tart-apple': especial('Maçã Azeda', 'Applin'), 'cracked-pot': especial('Bule Rachado', 'Sinistea'),
  'galarica-cuff': especial('Bracelete Galarica', 'Slowpoke de Galar'), 'galarica-wreath': especial('Coroa Galarica', 'Slowpoke de Galar'),
  'auspicious-armor': especial('Armadura Auspiciosa', 'Charcadet'), 'malicious-armor': especial('Armadura Maliciosa', 'Charcadet'),
  'black-augurite': especial('Augurita Negra', 'Scyther'), 'peat-block': especial('Bloco de Turfa', 'Ursaring, à noite'),
  'strawberry-sweet': especial('Doce de Morango', 'Milcery'), 'scroll-of-darkness': especial('Pergaminho das Trevas', 'Kubfu'),
  'scroll-of-waters': especial('Pergaminho das Águas', 'Kubfu')
};
// Itens SEGURADOS (segurados.js): cada Pokémon da equipe pode segurar um, e ele age sozinho na batalha.
// `segurado: true` marca o item; o efeito em si é uma linha da tabela SEGURADOS.
const ter = (name, desc, price) => ({ name, desc, segurado: true, price });
export const ITENS_SEGURADOS = {
  leftovers: ter('Restos', 'Recupera 1/16 do HP no fim de cada turno.', 2000),
  'black-sludge': ter('Lodo Negro', 'Recupera 1/16 do HP por turno em Pokémon Venenosos; nos outros, machuca 1/8.', 1500),
  'life-orb': ter('Orbe da Vida', 'Golpes de dano batem 30% mais forte, mas custam 10% do seu HP máximo a cada golpe.', 3000),
  'focus-sash': ter('Faixa de Foco', 'Com o HP cheio, sobrevive a um golpe que derrubaria com 1 de HP. Gasta-se no uso.', 2500),
  'shell-bell': ter('Sino-Concha', 'Recupera 1/8 do dano que você causa.', 2000),
  'rocky-helmet': ter('Elmo Rochoso', 'Quem te acerta com um golpe físico perde 1/6 do HP máximo.', 2500),
  'expert-belt': ter('Cinto do Perito', 'Golpes super efetivos batem 20% mais forte.', 2500),
  'muscle-band': ter('Faixa Muscular', 'Golpes físicos batem 10% mais forte.', 1800),
  'wise-glasses': ter('Óculos do Sábio', 'Golpes especiais batem 10% mais forte.', 1800),
  'assault-vest': ter('Colete de Assalto', 'Defesa Especial +50%, mas você não consegue usar golpes de status.', 2800),
  'oran-berry': ter('Fruta Oran', 'Come sozinha e recupera 10 de HP quando você cai para metade do HP.', 300),
  'sitrus-berry': ter('Fruta Sitrus', 'Come sozinha e recupera 1/4 do HP quando você cai para metade do HP.', 800),
  'lum-berry': ter('Fruta Lum', 'Come sozinha e cura qualquer condição de status (queimado, dormindo, envenenado…).', 900)
};
Object.assign(ITEMS, ITENS_SEGURADOS);

// Repelentes (mapas.js): mexem SÓ no encontro selvagem — treinador, item, dinheiro e ambientação continuam iguais.
// `passos` = quantas explorações duram.
export const ITENS_REPELENTE = {
  repel: { name: 'Repelente Seletivo', desc: 'Por 30 explorações, o único selvagem que aparece é a espécie que você escolher (das que vivem na rota).', repelente: 'seletivo', passos: 30, price: 900 },
  'max-repel': { name: 'Repelente Total', desc: 'Por 40 explorações, nenhum selvagem aparece: só treinadores, itens e dinheiro.', repelente: 'total', passos: 40, price: 1200 }
};
Object.assign(ITEMS, ITENS_REPELENTE);

/* Itens que mexem no MOVESET (itens.js `ensinarGolpe`). Um Pokémon só carrega 4 golpes, e a cada nível você escolhe
   o que esquecer — estes dois são a chance de voltar atrás.
   `ensina: 'relembrar'` = golpes que a espécie aprende SUBINDO DE NÍVEL até o nível atual (learnset.list) e que ele
   não sabe agora: serve pra recuperar o que você deixou passar.
   `ensina: 'pokedex'` = golpes que a espécie aprende por MT, tutor ou herança (learnset.extras, api.js) — golpes que
   NUNCA apareceriam subindo de nível. É o item mais forte do jogo em termos de montagem de equipe, por isso o preço
   sobe a cada Disco usado (regras.precoItem). */
export const ITENS_GOLPE = {
  'heart-scale': { name: 'Escama do Coração', desc: 'Faz o Pokémon relembrar um golpe que ele já poderia ter aprendido subindo de nível e que você deixou passar.', ensina: 'relembrar', price: 5000 },
  'tm-normal': { name: 'Disco Técnico', desc: 'Ensina um golpe que a Pokédex diz que a espécie aprende por MT, tutor ou herança — mesmo que ele nunca apareça subindo de nível. Cada Disco usado deixa o próximo mais caro.', ensina: 'pokedex', price: 8000 }
};
Object.assign(ITEMS, ITENS_GOLPE);

// Divisões da mochila e da loja, na ordem em que aparecem. `de(it)` diz a que divisão o item pertence.
export const CATEGORIAS_ITEM = [
  { id: 'cura', nome: '🧪 Cura e status', de: it => it.heal || it.cure || it.ether || it.revive },
  { id: 'batalha', nome: '⚔ Em batalha', de: it => it.battle || it.stage },
  { id: 'segurado', nome: '🎒 Para segurar', de: it => it.segurado },
  { id: 'exploracao', nome: '🧭 Exploração', de: it => it.repelente },
  { id: 'golpes', nome: '📀 Golpes', de: it => it.ensina },
  { id: 'evolucao', nome: '💎 Evolução', de: it => it.evo || it.troca || it.segurar },
  { id: 'petisco', nome: '🍖 Petiscos (amizade)', de: it => it.afinidade },
  { id: 'especial', nome: '✨ Especiais', de: it => it.candy },
  { id: 'outros', nome: '📦 Outros', de: () => true }
];
export const categoriaDoItem = it => (CATEGORIAS_ITEM.find(c => it && c.de(it)) || CATEGORIAS_ITEM.at(-1)).id;
// agrupa [id, qtd] (ou [id, item]) nas divisões, pulando as vazias: [{ id, nome, itens: [...] }]
export function porCategoria(pares) {
  return CATEGORIAS_ITEM.map(c => ({ ...c, itens: pares.filter(([k]) => ITEMS[k] && categoriaDoItem(ITEMS[k]) === c.id) })).filter(c => c.itens.length);
}

// o que dá pra achar explorando (as pedras também; o Cabo de Conexão só na loja)
export const ITENS_EVO_ACHADOS = Object.keys(ITENS_EVO).filter(k => k !== 'linking-cord');
Object.assign(ITEMS, ITENS_EVO); // mochila, loja e sprites tratam igual aos outros itens
// itens achados explorando — inclui uma fruta pra segurar, pra todo mundo topar com a mecânica cedo
export const FIND_ITEMS = ['oran-berry','potion', 'potion', 'potion', 'super-potion', 'antidote', 'paralyze-heal', 'awakening', 'ether', 'x-attack', 'rare-candy', 'charcoal', 'mystic-water', 'honey', 'hard-stone', 'magnet', 'tiny-mushroom'];

// Zonas = as rotas de todos os mapas por Gen (dados-mapas.js; lógica em mapas.js). `libera` = nível mínimo pra
// entrar (zonaLiberada). `chefe` = o Alfa da rota: versão turbinada (statsDeChefe), desafiado por botão; recompensa
// só na 1ª vitória (S.chefes[rota]). A rota `final` tem `lendarios` no lugar do Alfa (vencer = fechar a Gen).
// pool = [{ id, n: speciesName, p: peso de aparição, m?: mítico }].
export const ZONES = GENS.flatMap(g => g.rotas);

// Missões (Etapa 2). `libera` = condição pra missão aparecer (sem ela: visível desde o início); `objetivo` = pra concluir.
// Condição (uma chave só): { derrotar: especie, qtd } · { vitorias } · { amigos } · { nivel } · { chefe: zona } ·
// { treinadores } · { missao: id } · { dinheiro } (ter de uma vez) · { gasto } (total gasto) · { evolucoes }.
// Avaliada por progressoCondicao(cond, S) em regras.js — espécie = speciesName.
// Quantidade de "derrotar" segue a facilidade de achar: comum da 1ª rota = 10, meio = 5–8, raro/forte = 1–3.
// `premio`: { dinheiro?, itens?: { idItem: qtd } }. `gen` = só aparece jogando no mapa dessa Gen (as trilhas de Alfas de Kanto).
export const MISSOES = [
  // começo
  { id: 'primeiros', nome: 'Primeiros passos', desc: 'Vença 3 batalhas.', objetivo: { vitorias: 3 }, premio: { dinheiro: 300 } },
  { id: 'vitorias25', nome: 'Pegando o jeito', desc: 'Vença 25 batalhas.', libera: { missao: 'primeiros' }, objetivo: { vitorias: 25 }, premio: { dinheiro: 1000 } },
  { id: 'vitorias100', nome: 'Terror da região', desc: 'Vença 100 batalhas.', libera: { missao: 'vitorias25' }, objetivo: { vitorias: 100 }, premio: { itens: { 'rare-candy': 3 } } },
  // Rota 1 e Floresta (comuns: contagem alta)
  { id: 'pidgey', nome: 'Dono do céu da Rota 1', desc: 'Derrote 10 Pidgey.', libera: { derrotar: 'pidgey', qtd: 1 }, objetivo: { derrotar: 'pidgey', qtd: 10 }, premio: { itens: { honey: 2 } } },
  { id: 'rattata', nome: 'Praga de Rattata', desc: 'Derrote 10 Rattata.', libera: { derrotar: 'rattata', qtd: 1 }, objetivo: { derrotar: 'rattata', qtd: 10 }, premio: { itens: { potion: 4 } } },
  { id: 'caterpie', nome: 'Folhas mastigadas', desc: 'Derrote 8 Caterpie.', libera: { derrotar: 'caterpie', qtd: 1 }, objetivo: { derrotar: 'caterpie', qtd: 8 }, premio: { itens: { honey: 2 } } },
  { id: 'weedle', nome: 'Ferrão por ferrão', desc: 'Derrote 8 Weedle.', libera: { derrotar: 'weedle', qtd: 1 }, objetivo: { derrotar: 'weedle', qtd: 8 }, premio: { itens: { antidote: 3 } } },
  { id: 'spearow', nome: 'Bico afiado', desc: 'Derrote 6 Spearow.', libera: { derrotar: 'spearow', qtd: 1 }, objetivo: { derrotar: 'spearow', qtd: 6 }, premio: { itens: { 'mystic-water': 2 } } },
  { id: 'pikachu', nome: 'Faísca na floresta', desc: 'Derrote 3 Pikachu.', libera: { derrotar: 'pikachu', qtd: 1 }, objetivo: { derrotar: 'pikachu', qtd: 3 }, premio: { itens: { magnet: 2, 'paralyze-heal': 2 } } },
  // Monte Lua e Rota 24
  { id: 'zubat', nome: 'Asas na escuridão', desc: 'Derrote 10 Zubat.', libera: { derrotar: 'zubat', qtd: 1 }, objetivo: { derrotar: 'zubat', qtd: 10 }, premio: { itens: { 'tiny-mushroom': 2 } } },
  { id: 'geodude', nome: 'Quebra-pedra', desc: 'Derrote 8 Geodude.', libera: { derrotar: 'geodude', qtd: 1 }, objetivo: { derrotar: 'geodude', qtd: 8 }, premio: { itens: { 'hard-stone': 2 } } },
  { id: 'clefairy', nome: 'Dança da lua', desc: 'Derrote 3 Clefairy.', libera: { derrotar: 'clefairy', qtd: 1 }, objetivo: { derrotar: 'clefairy', qtd: 3 }, premio: { itens: { 'rare-candy': 1 } } },
  { id: 'mankey', nome: 'Briga de rua', desc: 'Derrote 6 Mankey.', libera: { derrotar: 'mankey', qtd: 1 }, objetivo: { derrotar: 'mankey', qtd: 6 }, premio: { itens: { charcoal: 2 } } },
  // Torre e Safari (mais raros: contagem baixa)
  { id: 'gastly', nome: 'Caça-fantasmas', desc: 'Derrote 8 Gastly.', libera: { derrotar: 'gastly', qtd: 1 }, objetivo: { derrotar: 'gastly', qtd: 8 }, premio: { itens: { 'tiny-mushroom': 3 } } },
  { id: 'cubone', nome: 'O capacete de osso', desc: 'Derrote 3 Cubone.', libera: { derrotar: 'cubone', qtd: 1 }, objetivo: { derrotar: 'cubone', qtd: 3 }, premio: { itens: { revive: 1 } } },
  { id: 'scyther', nome: 'Lâminas no capim', desc: 'Derrote 1 Scyther.', libera: { derrotar: 'scyther', qtd: 1 }, objetivo: { derrotar: 'scyther', qtd: 1 }, premio: { dinheiro: 3000 } },
  // amizade
  { id: 'amigo1', nome: 'Um amigo no caminho', desc: 'Faça amizade com um Pokémon selvagem.', objetivo: { amigos: 1 }, premio: { itens: { 'super-potion': 2 } } },
  { id: 'bando', nome: 'Bando formado', desc: 'Faça amizade com 3 Pokémon ao todo.', libera: { amigos: 1 }, objetivo: { amigos: 3 }, premio: { dinheiro: 1000 } },
  { id: 'matilha', nome: 'Líder da matilha', desc: 'Faça amizade com 6 Pokémon ao todo.', libera: { missao: 'bando' }, objetivo: { amigos: 6 }, premio: { itens: { revive: 2 } } },
  { id: 'evolui', nome: 'Metamorfose', desc: 'Evolua (você ou um aliado).', libera: { nivel: 10 }, objetivo: { evolucoes: 1 }, premio: { dinheiro: 1000 } },
  // dinheiro: juntar (ter de uma vez) e gastar (loja + Centro)
  { id: 'cofre1', nome: 'Porquinho', desc: 'Junte ₽2.000 de uma vez.', objetivo: { dinheiro: 2000 }, premio: { itens: { 'super-potion': 2 } } },
  { id: 'cofre2', nome: 'Cofre cheio', desc: 'Junte ₽10.000 de uma vez.', libera: { missao: 'cofre1' }, objetivo: { dinheiro: 10000 }, premio: { itens: { 'rare-candy': 2 } } },
  { id: 'cofre3', nome: 'Magnata selvagem', desc: 'Junte ₽50.000 de uma vez.', libera: { missao: 'cofre2' }, objetivo: { dinheiro: 50000 }, premio: { itens: { revive: 3 } } },
  { id: 'gasto1', nome: 'Cliente da loja', desc: 'Gaste ₽1.000 (loja e Centro).', objetivo: { gasto: 1000 }, premio: { dinheiro: 300 } },
  { id: 'gasto2', nome: 'Freguês fiel', desc: 'Gaste ₽5.000 (loja e Centro).', libera: { missao: 'gasto1' }, objetivo: { gasto: 5000 }, premio: { dinheiro: 1500 } },
  { id: 'gasto3', nome: 'Patrocinador do Centro', desc: 'Gaste ₽20.000 (loja e Centro).', libera: { missao: 'gasto2' }, objetivo: { gasto: 20000 }, premio: { itens: { revive: 2 } } },
  // treinadores
  { id: 'cacadores', nome: 'Caça aos caçadores', desc: 'Derrote 3 treinadores.', libera: { treinadores: 1 }, objetivo: { treinadores: 3 }, premio: { dinheiro: 2000 } },
  { id: 'cacadores10', nome: 'Pesadelo dos caçadores', desc: 'Derrote 10 treinadores.', libera: { missao: 'cacadores' }, objetivo: { treinadores: 10 }, premio: { itens: { revive: 2 } } },
  // trilha dos Alfas de Kanto (só no mapa da Gen 1)
  { id: 'alfa1', gen: 1, nome: 'O Alfa da Rota 1', desc: 'Derrote o Alfa da Rota 1.', libera: { nivel: 6 }, objetivo: { chefe: 'rota1' }, premio: { itens: { 'rare-candy': 1 } } },
  { id: 'alfa2', gen: 1, nome: 'Rainha da Floresta', desc: 'Derrote o Alfa da Floresta de Viridian.', libera: { chefe: 'rota1' }, objetivo: { chefe: 'floresta' }, premio: { dinheiro: 1500 } },
  { id: 'alfa3', gen: 1, nome: 'A lua cheia', desc: 'Derrote o Alfa do Monte Lua.', libera: { chefe: 'floresta' }, objetivo: { chefe: 'montelua' }, premio: { dinheiro: 2500 } },
  { id: 'alfa4', gen: 1, nome: 'Punho da Rota 24', desc: 'Derrote o Alfa da Rota 24.', libera: { chefe: 'montelua' }, objetivo: { chefe: 'rota24' }, premio: { itens: { 'rare-candy': 2 } } },
  { id: 'alfa5', gen: 1, nome: 'A sombra da Torre', desc: 'Derrote o Alfa da Torre Pokémon.', libera: { nivel: 20 }, objetivo: { chefe: 'torre' }, premio: { dinheiro: 5000 } },
  { id: 'alfa6', gen: 1, nome: 'Estouro no Safari', desc: 'Derrote o Alfa da Zona Safari.', libera: { chefe: 'torre' }, objetivo: { chefe: 'safari' }, premio: { itens: { 'rare-candy': 3 } } },
  { id: 'veterano', nome: 'Veterano', desc: 'Chegue ao nível 40.', libera: { nivel: 30 }, objetivo: { nivel: 40 }, premio: { dinheiro: 8000 } },
  { id: 'lenda', gen: 1, nome: 'A lenda da caverna', desc: 'Derrote o Alfa da Caverna Cerúlea.', libera: { chefe: 'safari' }, objetivo: { chefe: 'caverna' }, premio: { dinheiro: 20000 } }
];
export const FLAVOR = {
  default: ['O vento balança a grama. Nada por aqui.', 'Você ouve algo ao longe, mas não vê ninguém.', 'Um treinador passa correndo e nem nota você.'],
  montelua: ['Gotas pingam do teto da caverna.', 'Uma pedra brilha na escuridão e some.'],
  caverna: ['O eco dos seus passos volta estranho.'],
  torre: ['Uma vela se apaga sozinha.', 'Você sente um arrepio na nuca.']
};
// Única escolha inicial em TODOS os modos (criação, Sortear e Full Randomizer): os iniciais das 9 regiões
// (planta, fogo, água) + Pikachu e Eevee. O resto dos 1025 aparece jogando (e, no Roguelike, vira desbloqueio).
export const REGIOES_INICIAIS = [
  { nome: 'Kanto', ids: [1, 4, 7], nomes: ['Bulbasaur', 'Charmander', 'Squirtle'] }, { nome: 'Johto', ids: [152, 155, 158], nomes: ['Chikorita', 'Cyndaquil', 'Totodile'] }, { nome: 'Hoenn', ids: [252, 255, 258], nomes: ['Treecko', 'Torchic', 'Mudkip'] },
  { nome: 'Sinnoh', ids: [387, 390, 393], nomes: ['Turtwig', 'Chimchar', 'Piplup'] }, { nome: 'Unova', ids: [495, 498, 501], nomes: ['Snivy', 'Tepig', 'Oshawott'] }, { nome: 'Kalos', ids: [650, 653, 656], nomes: ['Chespin', 'Fennekin', 'Froakie'] },
  { nome: 'Alola', ids: [722, 725, 728], nomes: ['Rowlet', 'Litten', 'Popplio'] }, { nome: 'Galar', ids: [810, 813, 816], nomes: ['Grookey', 'Scorbunny', 'Sobble'] }, { nome: 'Paldea', ids: [906, 909, 912], nomes: ['Sprigatito', 'Fuecoco', 'Quaxly'] },
  // `nasRotas`: estes dois continuam aparecendo soltos no mundo (é assim nos jogos). Os outros iniciais — e as
  // evoluções deles — são tirados dos pools das rotas por mapas.js, pra escolha do começo da jornada valer alguma coisa.
  { nome: 'Especiais', ids: [25, 133], nomes: ['Pikachu', 'Eevee'], nasRotas: true }
];
export const INICIAIS = REGIOES_INICIAIS.flatMap(r => r.ids);

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
//   desbloqueios = além dos iniciais, oferece as espécies desbloqueadas em jornadas deste modo (roguelike.js)
//   especiesLivres = começar com QUALQUER Pokémon (busca livre); false = só REGIOES_INICIAIS. Hoje false em todos — decisão do usuário, pode mudar por modo
//   multPontos   = multiplicador da pontuação final da jornada (recordes / ranking)
//   permadeath   = desmaiou, acabou (sem Revive); aliado que desmaia é perdido na hora (o Centro não traz de volta)
//   fimNaGen     = vencer os lendários do mapa encerra a jornada (vitória) e libera o mapa da Gen seguinte; sem ela, escolhe o próximo mapa e segue
//   desmaiosLivres = desmaios sem custo; depois disso cada desmaio gasta um Revive, e sem Revive é Game Over (null = ilimitado)
// Save antigo sem o campo dificuldade = easy (dificuldadeDe).
export const DIFICULDADES = {
  // modo principal: começa só com iniciais; espécies novas desbloqueiam jogando (desbloqueios, ver roguelike.js)
  roguelike: { nome: 'Roguelike', especiesLivres: false, desbloqueios: true, permadeath: true, fimNaGen: true, multPontos: 1.5, desmaiosLivres: 0, semCaptura: false, fimDeJogo: true, centroGratis: false, descontoPorVitoria: 0.1, nivelLivre: false, escolhaLivre: true, desc: 'O modo principal. Sem segunda chance: desmaiou, a run acabou; aliado que desmaia é perdido pra sempre. Começa com os iniciais; derrotar, fazer amizade ou evoluir desbloqueia novas espécies pras próximas runs. Vencer os lendários do mapa fecha a run e libera o mapa da próxima Gen. Nível 5.' },
  easy: { nome: 'Fácil', especiesLivres: false, multPontos: 1, desmaiosLivres: null, semCaptura: true, centroGratis: true, nivelLivre: true, escolhaLivre: true, desc: 'Treinadores nunca te capturam e o Centro Pokémon é de graça. Nível inicial, natureza e habilidade à sua escolha.' },
  medium: { nome: 'Médio', especiesLivres: false, multPontos: 1.2, desmaiosLivres: 3, semCaptura: true, centroGratis: false, descontoPorVitoria: 0.1, nivelLivre: true, escolhaLivre: true, desc: 'Igual ao Fácil, mas o Centro Pokémon cobra: cada vitória desde a última visita tira 10% do preço.' },
  hard: { nome: 'Difícil', especiesLivres: false, multPontos: 1.5, desmaiosLivres: 3, semCaptura: false, centroGratis: false, nivelLivre: false, escolhaLivre: true, desc: 'Se for capturado, você foge dias depois: sem a mochila, com metade do dinheiro, em outra zona. Centro pago. Começa no nível 5.' },
  hardcore: { nome: 'Hardcore', especiesLivres: false, multPontos: 2, desmaiosLivres: 3, semCaptura: false, fimDeJogo: true, centroGratis: false, nivelLivre: false, escolhaLivre: false, desc: 'Ser capturado é o fim da jornada: o save é apagado. Centro pago. Começa no nível 5, com natureza e habilidade sorteadas.' },
  // sorteia até a espécie (a tela inicial troca a busca por um botão só). Captura e Centro = regras do Difícil
  randomizer: { nome: 'Full Randomizer', especiesLivres: false, multPontos: 1.5, desmaiosLivres: 3, semCaptura: false, centroGratis: false, nivelLivre: false, escolhaLivre: false, desc: 'Espécie, natureza e habilidade sorteadas, nível 5. Captura e Centro seguem o Difícil.' }
};
// Ordens pros aliados (A.ordem; sem campo = 'livre'). A escolha do golpe mora em golpeDoAliado (regras.js).
export const ORDENS = {
  livre: { nome: 'À vontade', desc: 'Usa o golpe mais eficaz contra o inimigo.' },
  fraco: { nome: 'Pegar leve', desc: 'Usa o golpe de dano mais fraco. Bom pra não derrubar quem você quer fazer de amigo.' },
  status: { nome: 'Só status', desc: 'Só usa golpes de status (baixar atributos, dormir, paralisar…). Sem nenhum com PP, espera.' },
  parado: { nome: 'Não atacar', desc: 'Fica em campo de guarda, sem agir. Ainda pode ser atacado.' },
  fora: { nome: 'Descansar', desc: 'Fica fora das batalhas: não luta, não é atacado e não ganha XP.' }
};
// Roguelike: quanto precisa, SOMANDO as jornadas Roguelike terminadas, pra uma espécie virar opção inicial.
// Forma do meio = ainda evolui; forma final = não evolui mais (anotado em registro.formas na hora de evoluir).
export const DESBLOQUEIO = { derrotados: 10, amigos: 5, evolucaoMeio: 5, evolucaoFinal: 10 };
