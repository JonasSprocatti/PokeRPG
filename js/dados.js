/* ============ dados fixos ============ */
// Só constantes (e construtores de URL). Sem DOM, sem rede: importável direto no Node.
import { GENS as GENS_DO_MAPA } from './dados-mapas.js';
import { ALFAS, MISSOES_ROTA } from './dados-rotas.js';
import { PEDRAS_MEGA, CHAVE_MEGA_GENERICA, CRISTAIS_Z, ANEL_Z_GENERICO, SPRITE_DO_ITEM } from './dados-item-sprites.js';
/* Os mapas chegam em DUAS camadas: `dados-mapas.js` é gerado da PokéAPI (pools, níveis, Alfa sorteado) e
   `dados-rotas.js` é gerado pelo editor de rotas do jogo, com as escolhas de DESENHO por cima — hoje só o Alfa
   trocado. Elas se juntam aqui, no único arquivo que importa `dados-mapas.js`: `mapas.js` e `pokedex-conta.js`
   leem o `GENS` já ajustado daqui, senão a troca de Alfa valeria na tela de explorar e não na batalha (ou pior,
   o contrário). Rota fora de `ALFAS` segue com o Alfa do mapa, intocada — é o caso de todas, até alguém trocar. */
/* Quem é CHEFE DE RAIDE na própria forma normal não é encontro de rota (pedido do usuário, 03/10/2026): o Arceus
   saía como mítico de 0,068% na Estrada Vitória e é o mesmo Arceus que toma a tela como chefe da semana. Os outros
   14 chefes aparecem numa forma alternativa (Mega Rayquaza, Eternatus Eternamax, Groudon Primal…), então a forma
   normal deles segue valendo como lendário da rota final — era o que distinguia os dois casos.
   O Santuário (`posVitoria`) mantém TODO MUNDO: é ele que garante a Pokédex completa da Gen.
   Lista à mão porque `evento.js` importa daqui (importar de lá seria um ciclo); `tests/evento.test.js` falha se
   um chefe novo de forma normal ficar de fora dela. */
const SO_NO_SANTUARIO = ['arceus', 'regigigas'];
const semChefeDeRaide = z => z.posVitoria ? z : { ...z, pool: z.pool.filter(p => !SO_NO_SANTUARIO.includes(p.n)) };
export const GENS = GENS_DO_MAPA.map(g => ({ ...g, rotas: g.rotas.map(z0 => {
  const z = semChefeDeRaide(z0);
  return ALFAS[z.id] ? { ...z, chefe: { ...z.chefe, ...ALFAS[z.id] } } : z;
}) }));
export const API = 'https://pokeapi.co/api/v2';
/* As imagens vêm do jsDelivr, que espelha o MESMO repositório de sprites da PokéAPI (mesmos arquivos, byte a
   byte — é o repositório do GitHub servido por uma CDN). O endereço original, `raw.githubusercontent.com`, é
   bloqueado em várias redes (provedor, DNS de celular, rede corporativa) — foi diagnosticado em jogo: os dados
   de `pokeapi.co` passavam e TODA imagem falhava com net::ERR_FAILED, tanto online quanto no download offline.
   `ORIGEM_ANTIGA`/`espelhar` existem porque a própria PokéAPI devolve URLs do raw.githubusercontent dentro dos
   dados do Pokémon (`sprite`, `back`, `art`): quem já tem esses dados guardados no aparelho continuaria com o
   endereço bloqueado, então a troca é feita também na hora de desenhar. */
const SPRITES = 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites';
const ORIGEM_ANTIGA = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites';
export const espelhar = url => typeof url === 'string' ? url.replace(ORIGEM_ANTIGA, SPRITES) : url;
// caminho inverso: o MESMO arquivo no servidor antigo, pra <img> tentar o outro servidor antes de desistir
export const outroServidor = url => typeof url === 'string' ? url.replace(SPRITES, ORIGEM_ANTIGA) : url;
/* Todo endereço montado por id passa por aqui (2ª auditoria, 30/09/2026). Esses endereços são escritos DENTRO de
   `src="…"` e de `onerror="…src='…'"`, então um id que não seja número torce o endereço e vira código — foi a
   Vuln do `poke_id` em `perfil-amigo.js`, que chega como TEXTO de `resumo.registro.ids` (jsonb do cliente, que
   `validar_jornada` não olha). A trava mora no construtor, e não em cada tela, porque são 12 construtores × ~40
   pontos de desenho: guardar no gargalho é o único jeito de nenhum caller novo reabrir o furo. `htmlIcone`
   (conta.js) continua com a faixa 1–1025 dele, que é mais estreita porque ícone de perfil é só espécie; aqui não
   dá pra apertar assim — id de FORMA passa de 10000 (render.spriteFrente usa `m.formaSprite`). Id inválido virá
   `0.png`, que dá 404 e cai no plano B que toda `<img>` de sprite já tem. */
const numeroDeSprite = id => Math.trunc(Number(id)) || 0;
export const SPR = id => `${SPRITES}/pokemon/${numeroDeSprite(id)}.png`;
// shiny: montado pelo id (não fica no cache da API — save antigo funciona sem migrar). Gen 8+ não tem sprite de costas.
export const SPR_SHINY = id => `${SPRITES}/pokemon/shiny/${numeroDeSprite(id)}.png`;
export const SPR_SHINY_COSTAS = id => `${SPRITES}/pokemon/back/shiny/${numeroDeSprite(id)}.png`;
/* Sprites "3D" (pedido do usuário): a PokéAPI não tem modelo 3D de verdade pra jogar — o que existe é `home`,
   render 2D do MESMO modelo 3D usado em Pokémon HOME/jogos modernos (bem mais nítido que o pixel-art clássico).
   Montado pelo id, como o shiny — mesmo motivo (save antigo não precisa migrar). **Sem versão de costas**: o
   conjunto `home` só tem sprite de frente, então quem ativa o modo 3D vê a mesma figura tanto na frente quanto
   nas costas (mesmo fallback que já existe pra espécie sem back 2D — ver render.sprCostas). */
export const SPR_3D = id => `${SPRITES}/pokemon/other/home/${numeroDeSprite(id)}.png`;
export const SPR_3D_SHINY = id => `${SPRITES}/pokemon/other/home/shiny/${numeroDeSprite(id)}.png`;
/* Sprites ANIMADOS (pedido do usuário, depois do 3D): GIF do conjunto `showdown` — o mesmo sprite (pequeno,
   com uma animação de espera) usado no Pokémon Showdown. Ao contrário do "home", TEM versão de costas de
   verdade, então não precisa do fallback de frente+flip que o 3D precisa. */
export const SPR_ANIM = id => `${SPRITES}/pokemon/other/showdown/${numeroDeSprite(id)}.gif`;
export const SPR_ANIM_COSTAS = id => `${SPRITES}/pokemon/other/showdown/back/${numeroDeSprite(id)}.gif`;
export const SPR_ANIM_SHINY = id => `${SPRITES}/pokemon/other/showdown/shiny/${numeroDeSprite(id)}.gif`;
export const SPR_ANIM_SHINY_COSTAS = id => `${SPRITES}/pokemon/other/showdown/back/shiny/${numeroDeSprite(id)}.gif`;
/* Grito (pedido do usuário, som.js): repositório IRMÃO do de sprites (PokeAPI/cries), mesmo espelho jsDelivr e
   mesma regra — montado pelo id, sem precisar buscar o Pokémon de novo pra achar a URL. */
export const CRY = id => `https://cdn.jsdelivr.net/gh/PokeAPI/cries@main/cries/pokemon/latest/${id}.ogg`;
/* A chave do item É o nome do arquivo na PokéAPI — menos nas 51 em que não é (item com chave em português, item
   inventado deste jogo, item real que a PokéAPI não desenhou). `SPRITE_DO_ITEM` (GERADO, ver
   ferramentas/gerar-item-sprites.mjs) resolve essas: valor com barra é arquivo nosso, sem barra é item da PokéAPI. */
export const ITEM_SPR = n => {
  const a = SPRITE_DO_ITEM[n];
  return a?.includes('/') ? a : `${SPRITES}/items/${a || n}.png`;
};
/* Alguns itens novos (Gen 8/9) simplesmente NÃO têm imagem no repositório de sprites da PokéAPI — Coroa Galárica,
   Armadura Auspiciosa, Pote Rachado... Antes a figura quebrada era escondida (visibility:hidden) e sobrava um buraco:
   parecia bug de renderização. Agora cai neste ícone de caixinha (SVG embutido, não depende de rede).
   `ITEM_ERRO` vai no onerror="" da <img>; o encodeURIComponent tira toda aspa dupla, então cabe no atributo. */
export const ITEM_SPR_RESERVA = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="4" y="11" width="24" height="16" rx="3" fill="#6b74c9"/><rect x="4" y="11" width="24" height="5" rx="2" fill="#9aa3ff"/><rect x="14" y="11" width="4" height="16" fill="#3b4190"/><path d="M16 10c0-3 3-4 4-2.5S18 10 16 10zm0 0c0-3-3-4-4-2.5S14 10 16 10z" fill="#9aa3ff"/></svg>`);
export const ITEM_ERRO = `this.onerror=null;this.src='${ITEM_SPR_RESERVA}'`;
/* Pedra Mega e Cristal Z são itens ÚNICOS e genéricos no jogo (dados.ITEM_PEDRA_MEGA/ITEM_CRISTAL_Z, mais
   abaixo), mas a PokéAPI tem sprite de verdade por ESPÉCIE (pedra) e por TIPO (cristal) — dados-item-sprites.js
   (GERADO, ver ferramentas/gerar-item-sprites.mjs) traz essas tabelas. Sem espécie/tipo (ou espécie sem pedra
   própria — metade das Megas deste jogo não existe nos jogos de verdade), cai no item genérico real que resolve
   qualquer uma: a Pedra-Chave (ativa qualquer Mega Evolução) e o Anel Z (ativa qualquer Z-Move). */
export const ITEM_SPR_MEGA = especie => ITEM_SPR(PEDRAS_MEGA[especie] || CHAVE_MEGA_GENERICA);
export const ITEM_SPR_Z = tipo => ITEM_SPR(tipo && CRISTAIS_Z[tipo] ? `${CRISTAIS_Z[tipo]}--held` : ANEL_Z_GENERICO);
/* Vínculo de Batalha (Ash-Greninja) não existe como item nos jogos de verdade — Battle Bond é habilidade, não
   item segurado — então não tem sprite pra buscar. Ícone próprio (shuriken, tema ninja do Greninja) em vez do
   genérico de caixinha. */
export const ITEM_SPR_VINCULO = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 2 L20 12 L30 16 L20 20 L16 30 L12 20 L2 16 L12 12 Z" fill="#37474f"/><circle cx="16" cy="16" r="4" fill="#e53935"/></svg>`);

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
  // As curas fixas (20/60/120) não acompanham quem chega ao nível 100 com 300+ de HP: as de baixo abaixo curam uma FRAÇÃO do HP máximo.
  'mega-potion': { name: 'Mega Potion', desc: 'Recupera 50% do HP máximo.', healPct: 50, price: 2000 },
  'max-potion': { name: 'Max Potion', desc: 'Recupera todo o HP.', healPct: 100, price: 3000 },
  'full-restore': { name: 'Full Restore', desc: 'Recupera todo o HP e cura qualquer status.', healPct: 100, cure: 'all', price: 4500 },
  antidote: { name: 'Antidote', desc: 'Cura envenenamento.', cure: ['poison'], price: 100 },
  'paralyze-heal': { name: 'Paralyze Heal', desc: 'Cura paralisia.', cure: ['paralysis'], price: 200 },
  awakening: { name: 'Awakening', desc: 'Acorda do sono.', cure: ['sleep'], price: 250 },
  'burn-heal': { name: 'Burn Heal', desc: 'Cura queimadura.', cure: ['burn'], price: 250 },
  'ice-heal': { name: 'Ice Heal', desc: 'Descongela.', cure: ['freeze'], price: 250 },
  'full-heal': { name: 'Full Heal', desc: 'Cura qualquer status.', cure: 'all', price: 600 },
  ether: { name: 'Ether', desc: 'Restaura 10 PP de cada golpe.', ether: 10, price: 800 },
  'max-ether': { name: 'Max Ether', desc: 'Restaura todos os PP de cada golpe.', ether: 99, price: 2500 },
  'x-attack': { name: 'X Attack', desc: 'Ataque +2 nesta batalha.', stage: 'attack', battle: true, price: 500 },
  'x-defense': { name: 'X Defense', desc: 'Defesa +2 nesta batalha.', stage: 'defense', battle: true, price: 500 },
  'x-sp-atk': { name: 'X Sp. Atk', desc: 'At. Esp. +2 nesta batalha.', stage: 'special-attack', battle: true, price: 500 },
  'x-sp-def': { name: 'X Sp. Def', desc: 'Def. Esp. +2 nesta batalha.', stage: 'special-defense', battle: true, price: 500 },
  'x-speed': { name: 'X Speed', desc: 'Velocidade +2 nesta batalha.', stage: 'speed', battle: true, price: 500 },
  'rare-candy': { name: 'Rare Candy', desc: 'Sobe um nível na hora.', candy: true },
  // Itens de RAIDE (boss.usarItemDeRaide): só valem na luta contra o chefe da semana, e um de cada tipo por luta. Não se compra:
  // vêm de prêmio de chefe (evento.js). Usar gasta o turno no single player; no co-op é uma ação livre do jogador.
  'cristal-de-ruptura': { name: 'Cristal de Ruptura', desc: 'Só na luta do chefe da semana: estilhaça a defesa dele na hora e o deixa exposto (dano ×1,5 por 3 ações). Se ele tem couraça, ela cai junto. Um por luta. Serve contra: todos os chefes.', battle: true, raide: 'ruptura' },
  'selo-de-interrupcao': { name: 'Selo de Interrupção', desc: 'Só na luta do chefe da semana: corta o golpe devastador que ele está carregando (o golpe falha) e ainda o expõe. Só funciona enquanto ele carrega, então use no turno do aviso. Um por luta. Serve contra: todos os chefes.', battle: true, raide: 'interrupcao' },
  'escudo-astral': { name: 'Escudo Astral', desc: 'Só na luta do chefe da semana: o PRÓXIMO golpe carregado dele causa só metade do dano no time todo. Use antes de ele soltar o golpe. Um por luta. Serve contra: todos os chefes.', battle: true, raide: 'escudo' },
  'cinza-vulcanica': { name: 'Cinza Vulcânica', desc: 'Só na luta do chefe da semana: o time recebe metade do dano de golpes de Fogo por 3 turnos. Um por luta. Serve contra: Eternatus Eternamax e Groudon Primal.', battle: true, raide: 'cinza' },
  'escama-abissal': { name: 'Escama Abissal', desc: 'Só na luta do chefe da semana: o time recebe metade do dano de golpes de Água por 3 turnos. Um por luta. Serve contra: Kyogre Primal.', battle: true, raide: 'abissal' },
  'prisma-de-luz': { name: 'Prisma de Luz', desc: 'Só na luta do chefe da semana: quebra a armadura de ponto fraco dele na hora e o deixa exposto. Só funciona em chefes com ponto fraco. Um por luta. Serve contra: Mega Rayquaza, Mega Mewtwo, Necrozma Ultra, Kyurem Negro e Arceus.', battle: true, raide: 'prisma' },
  'espelho-reverso': { name: 'Espelho Reverso', desc: 'Só na luta do chefe da semana: inverte a tabela de tipos nos golpes que VOCÊ dá nele, por 3 ações dele — o que ele resiste vira super efetivo e o que ele teme vira resistido. Vale quando ele resiste aos seus tipos; se ele é fraco a eles, atrapalha. Um por luta. Serve contra: todos os chefes (depende dos tipos do seu time).', battle: true, raide: 'espelho' },
  'relogio-de-areia': { name: 'Relógio de Areia', desc: 'Só na luta do chefe da semana: acelera quem usou (Velocidade +2 na hora). Um por luta. Serve contra: todos os chefes.', battle: true, raide: 'relogio' },
  'fragmento-tera': { name: 'Fragmento Tera', desc: 'Só na luta do chefe da semana: recarrega o Tera de quem usou, mesmo já tendo usado nesta luta. Só faz sentido onde há Tera: numa run ou numa sala co-op com run (a Arena e a Sala de Raide não têm). Um por luta. Serve contra: todos os chefes.', battle: true, raide: 'fragmento' },
  'celula-zygarde': { name: 'Célula Zygarde', desc: 'Só na luta do chefe da semana: elimina uma célula, desligando a regeneração dele pelo resto da luta. Só funciona em chefes que regeneram. Um por luta. Serve contra: Zygarde Completo.', battle: true, raide: 'celula' },
  // Revive: em você é gasto sozinho ao desmaiar (depois dos desmaios livres do modo); num aliado desmaiado, reanima com metade do HP
  revive: { name: 'Revive', desc: 'Reanima um aliado desmaiado com metade do HP. Do Médio pra cima, te salva do Game Over depois do 3º desmaio.', revive: true, price: 1500 },
  // Max Revive: só num aliado desmaiado, com o HP cheio. (Em você o que é gasto sozinho ao desmaiar continua sendo o Revive comum.)
  'max-revive': { name: 'Max Revive', desc: 'Reanima um aliado desmaiado com todo o HP.', revive: true, revivePct: 100, price: 3500 },
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
/* Todo item de evolução DOBRA a chance de encontrar quem evolui com ele enquanto está na mochila
   (regras.especiesDobradas → mapas.sortearDaRota). Entra na descrição porque é regra que muda o que o jogador faz:
   guardar a Maçã Doce é o jeito de achar um Applin. */
const ISCA = 'Na mochila, quem evolui com ele aparece em dobro explorando.';
const pedra = (name, desc) => ({ name, desc: `Faz certos Pokémon evoluírem na hora (${desc}). ${ISCA}`, evo: true, price: 2100 });
// `segurar` = o item age ESTANDO na mochila: não tem botão de usar, e é o Cabo de Conexão (ou subir de nível, em
// alguns casos) que dispara a evolução. Isso precisa estar escrito: sem a frase, o item parece defeituoso — foi
// relato de quem joga ("o Eletrizador está funcionando?").
const segurado = (name, desc) => ({ name, desc: `Não tem botão: fica na mochila e é gasto quando ${desc} evolui — use o Cabo de Conexão nele (ou suba de nível, se a evolução dele for assim). ${ISCA}`, segurar: true });
const especial = (name, desc) => ({ name, desc: `Faz certos Pokémon evoluírem na hora (${desc}). ${ISCA}`, evo: true });
/* Item de EVOLUÇÃO que também tem efeito em BATALHA se estiver segurado — é como funciona nos jogos: a Pedra do
   Rei evolui Poliwhirl e dá 10% de recuo na mão. Um id só, `segurar` (evolui) + `segurado` (equipável); o efeito
   de luta mora em segurados.js, na mesma chave. Continua sem preço, como todo item de evolução: vem explorando.
   Segurado ele sai da mochila, e a evolução por item aceita as duas coisas (progressao.contexto/pagar). */
const duplo = (name, efeito, quem) => ({ name, desc: `${efeito} Também evolui, sendo gasto: ${quem}. ${ISCA}`, segurar: true, segurado: true });
export const ITENS_EVO = {
  'fire-stone': pedra('Pedra do Fogo', 'Vulpix, Growlithe, Eevee…'), 'water-stone': pedra('Pedra da Água', 'Poliwhirl, Shellder, Eevee…'),
  'thunder-stone': pedra('Pedra do Trovão', 'Pikachu, Eevee, Magneton…'), 'leaf-stone': pedra('Pedra da Folha', 'Gloom, Weepinbell, Eevee…'),
  'moon-stone': pedra('Pedra da Lua', 'Clefairy, Jigglypuff, Nidorina…'), 'sun-stone': pedra('Pedra do Sol', 'Gloom, Sunkern, Cottonee…'),
  'shiny-stone': pedra('Pedra Brilhante', 'Togetic, Roselia, Minccino…'), 'dusk-stone': pedra('Pedra do Crepúsculo', 'Murkrow, Misdreavus, Lampent…'),
  'dawn-stone': pedra('Pedra da Aurora', 'Kirlia, Snorunt'), 'ice-stone': pedra('Pedra do Gelo', 'Eevee, Vulpix de Alola, Cetoddle…'),
  'linking-cord': { name: 'Cabo de Conexão', desc: 'Simula uma troca: evolui quem só evolui trocando (Kadabra, Machoke, Graveler, Haunter…). Alguns pedem também um item na mochila.', troca: true, price: 3000 },
  'metal-coat': duplo('Revestimento Metálico', 'Segurado, seus golpes de Aço batem 20% mais forte.', 'Onix, Scyther'), 'kings-rock': duplo('Pedra do Rei', 'Segurado, 10% de chance de fazer o alvo recuar quando você acerta um golpe de dano.', 'Poliwhirl, Slowpoke'),
  'dragon-scale': segurado('Escama de Dragão', 'Seadra'), 'up-grade': segurado('Melhoria', 'Porygon'), 'dubious-disc': segurado('Disco Duvidoso', 'Porygon2'),
  protector: segurado('Protetor', 'Rhydon'), electirizer: segurado('Eletrizador', 'Electabuzz'), magmarizer: segurado('Magmatizador', 'Magmar'),
  'reaper-cloth': segurado('Pano Ceifador', 'Dusclops'), 'prism-scale': segurado('Escama Prisma', 'Feebas'),
  'deep-sea-tooth': duplo('Dente Abissal', 'Segurado por um Clamperl, dobra o At. Especial dele.', 'Clamperl'), 'deep-sea-scale': duplo('Escama Abissal', 'Segurado por um Clamperl, dobra a Def. Especial dele.', 'Clamperl'),
  sachet: segurado('Sachê', 'Spritzee'), 'whipped-dream': segurado('Chantili dos Sonhos', 'Swirlix'),
  'razor-claw': duplo('Garra Afiada', 'Segurado, seus golpes acertam crítico com mais frequência (+1 nível).', 'Sneasel, à noite'), 'razor-fang': duplo('Presa Afiada', 'Segurado, 10% de chance de fazer o alvo recuar quando você acerta um golpe de dano.', 'Gligar, à noite'), 'oval-stone': segurado('Pedra Oval', 'Happiny, de dia'),
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
  'red-card': ter('Cartão Vermelho', 'Quando um golpe te acerta, quem atacou é expulso da luta (o selvagem foge, o treinador manda outro). Gasta-se no uso.', 3000),
  'expert-belt': ter('Cinto do Perito', 'Golpes super efetivos batem 20% mais forte.', 2500),
  'muscle-band': ter('Faixa Muscular', 'Golpes físicos batem 10% mais forte.', 1800),
  'wise-glasses': ter('Óculos do Sábio', 'Golpes especiais batem 10% mais forte.', 1800),
  'assault-vest': ter('Colete de Assalto', 'Defesa Especial +50%, mas você não consegue usar golpes de status.', 2800),
  'oran-berry': ter('Fruta Oran', 'Come sozinha e recupera 10 de HP quando você cai para metade do HP.', 300),
  'sitrus-berry': ter('Fruta Sitrus', 'Come sozinha e recupera 1/4 do HP quando você cai para metade do HP.', 800),
  'lum-berry': ter('Fruta Lum', 'Come sozinha e cura qualquer condição de status (queimado, dormindo, envenenado…).', 900),
  // itens que se auto-infligem status — parecem punição, mas combinam com Guts/Flare Boost/Toxic Boost/Quick
  // Feet/Marvel Scale (todas já implementadas), que viram a queimadura/veneno em vantagem
  'flame-orb': ter('Orbe de Fogo', 'Se queima sozinho no fim do turno (sem efeito em Pokémon de Fogo). Combina com Guts, Flare Boost, Quick Feet e Marvel Scale.', 2200),
  'toxic-orb': ter('Orbe Tóxico', 'Se envenena GRAVE sozinho no fim do turno (sem efeito em Pokémon Venenoso/Aço). Combina com Guts, Toxic Boost, Quick Feet e Marvel Scale.', 2200),
  'quick-claw': ter('Garra Rápida', '20% de chance, a cada turno, de agir primeiro dentro da sua prioridade (empate de velocidade não conta).', 2500),
  'choice-band': ter('Faixa Escolha', 'Ataque +50%, mas trava no primeiro golpe usado até você desmaiar (ou ser revivido).', 3000),
  'choice-specs': ter('Óculos Escolha', 'At. Especial +50%, mas trava no primeiro golpe usado até você desmaiar (ou ser revivido).', 3000),
  'choice-scarf': ter('Lenço Escolha', 'Velocidade +50%, mas trava no primeiro golpe usado até você desmaiar (ou ser revivido).', 3000),
  'iron-ball': ter('Bola de Ferro', 'Velocidade -50%.', 1500),
  eviolite: ter('Eviolite', 'Defesa e Defesa Especial +50% — só em espécies que ainda podem evoluir.', 2800),
  /* Leva de 30/09/2026. ⚠️ Id novo aqui não pode COLIDIR com `ITENS_EVO` (mais abaixo): aquele `Object.assign`
     roda DEPOIS e vence em silêncio. Foi o que aconteceu com a Pedra do Rei — `kings-rock` já era item de
     evolução, e o efeito segurado teria ficado morto. `tests/segurados.test.js` passou a cobrar isso. */
  'air-balloon': ter('Balão de Ar', 'Você flutua: golpes Terrestres não te acertam e o terreno não te afeta. O balão estoura no primeiro golpe que te acertar.', 2600),
  'weakness-policy': ter('Apólice de Fraqueza', 'Ao levar um golpe super efetivo, seu Ataque e At. Especial sobem 2 níveis. Gasta-se no uso.', 2800),
  'scope-lens': ter('Lente de Mira', 'Seus golpes acertam crítico com mais frequência (+1 nível de crítico).', 2400),
  'white-herb': ter('Erva Branca', 'Desfaz na hora a primeira queda de atributo que você sofrer. Gasta-se no uso.', 1800),
  'mental-herb': ter('Erva Mental', 'Livra você na hora de Provocação, Bis, Desativar ou Tormento. Gasta-se no uso.', 1800),
  'power-herb': ter('Erva do Poder', 'Golpes que precisam de um turno de carga (Solar Beam, Fly, Dig…) saem na hora. Gasta-se no uso.', 2600)
};
/* Frutas de aperto por tipo: cortam pela metade UM golpe super efetivo daquele tipo e se gastam. Eram o último
   item segurado que faltava (estava em docs/backlog.md). Geradas da tabela em vez de 17 linhas escritas à mão —
   o efeito é idêntico entre elas, só muda o tipo, e `FRUTA_DO_TIPO` vira a fonte única pro efeito em
   segurados.js (mesmo padrão que `PLACA_DO_TIPO` já usa pros pratos do Arceus).
   Fica de fora a Chilan (Normal): ela corta golpe Normal SEMPRE, não só super efetivo — é outra regra, e o
   tipo Normal não é super efetivo contra ninguém, então ela não caberia nesta tabela. */
export const FRUTA_DO_TIPO = {
  fire: ['occa-berry', 'Fruta Occa'], water: ['passho-berry', 'Fruta Passho'], electric: ['wacan-berry', 'Fruta Wacan'],
  grass: ['rindo-berry', 'Fruta Rindo'], ice: ['yache-berry', 'Fruta Yache'], fighting: ['chople-berry', 'Fruta Chople'],
  poison: ['kebia-berry', 'Fruta Kebia'], ground: ['shuca-berry', 'Fruta Shuca'], flying: ['coba-berry', 'Fruta Coba'],
  psychic: ['payapa-berry', 'Fruta Payapa'], bug: ['tanga-berry', 'Fruta Tanga'], rock: ['charti-berry', 'Fruta Charti'],
  ghost: ['kasib-berry', 'Fruta Kasib'], dragon: ['haban-berry', 'Fruta Haban'], dark: ['colbur-berry', 'Fruta Colbur'],
  steel: ['babiri-berry', 'Fruta Babiri'], fairy: ['roseli-berry', 'Fruta Roseli']
};
export const ITENS_FRUTA_TIPO = Object.fromEntries(Object.entries(FRUTA_DO_TIPO).map(([tipo, [id, nome]]) =>
  [id, ter(nome, `Corta pela metade um golpe de ${TYPE_PT[tipo]} super efetivo contra você. Gasta-se no uso.`, 1200)]));
Object.assign(ITEMS, ITENS_SEGURADOS, ITENS_FRUTA_TIPO);

/* Itens que um Pokémon SELVAGEM pode estar segurando (relato #77 + #70, pedido duas vezes: "um rattata segurando
   uma oran berry, itens baratos"). Sorteado por `regras.itemDeSelvagem` e posto em `batalha.novoOponente` — que é
   a porta única do selvagem, então vale no encontro comum, no grupo da ⚔ Saga e nos lacaios do Alfa. O ALFA, os
   lendários e o chefe da semana ficam de fora: já vêm turbinados, e item em cima disso é desequilíbrio.
   Só itens BARATOS e com efeito que JÁ funciona em `segurados.SEGURADOS` — item inerte na mão do inimigo seria
   mentira na tela, e o item aparece no chip da plaquinha. O peso é por quanto o efeito atrapalha, não por preço:
   a Oran cura 10 de HP e quase não muda a luta, a Lum apaga o status que você acabou de encaixar.
   A soma não precisa dar 100: `itemDeSelvagem` normaliza. */
export const ITENS_DE_SELVAGEM = [
  { id: 'oran-berry', p: 40 },     // cura 10 de HP na metade: incômodo pequeno
  { id: 'lum-berry', p: 16 },      // apaga o status que você acabou de encaixar
  { id: 'sitrus-berry', p: 12 },   // cura 1/4 do HP na metade
  { id: 'muscle-band', p: 6 },     // +10% nos golpes físicos dele
  { id: 'wise-glasses', p: 6 },    // +10% nos especiais dele
  // as 17 frutas de aperto por tipo (cortam UM golpe super efetivo pela metade): peso 20 no total, dividido
  ...Object.values(FRUTA_DO_TIPO).map(([id]) => ({ id, p: 20 / 17 }))
];

/* Itens segurados de PRÊMIO de raide (evento.ev(), gira entre eles junto com os 3 consumíveis de boss.ITENS_DE_RAIDE
   — ver evento.js). Sem `price`: não vendem na loja, só vêm de vencer o chefe da semana (como os outros 3). Ao
   contrário deles, estes são PASSIVOS e valem em qualquer batalha, não só contra o chefe. */
export const ITENS_RAIDE_SEGURADOS = {
  'nucleo-eternamax': { name: 'Núcleo Eternamax', desc: 'Golpes de Dragão e Venenoso batem 20% mais forte, mas sua Defesa cai 20%. Serve contra: todos os chefes (se o seu time bate com Dragão ou Veneno).', segurado: true },
  'escama-do-ceu': { name: 'Escama do Céu', desc: 'Reduz em 25% o dano recebido de golpes Voadores e Dragão. Serve contra: Eternatus Eternamax, Mega Rayquaza, Necrozma Ultra, Kyurem Negro, Giratina Origem, Dialga Origem e Zygarde Completo.', segurado: true },
  'cristal-psiquico': { name: 'Cristal Psíquico', desc: 'Reduz em 40% o dano recebido de golpes Psíquicos. Serve contra: Mega Mewtwo, Necrozma Ultra e Calyrex Cavaleiro Espectral.', segurado: true },
  'redea-espectral': { name: 'Rédea Espectral', desc: 'Velocidade +20%. Serve contra: todos os chefes.', segurado: true },
  'emblema-da-coroa': { name: 'Emblema da Coroa', desc: 'Todos os seus golpes de dano batem 15% mais forte. Serve contra: todos os chefes.', segurado: true },
  'cristal-gelido': { name: 'Cristal Gélido', desc: 'Reduz pela metade o dano recebido de golpes de Gelo. Serve contra: Kyogre Primal, Kyurem Negro e Terapagos Estelar.', segurado: true },
  'presa-da-lua': { name: 'Presa da Lua', desc: 'Recupera 10% do dano que você causa. Serve contra: todos os chefes.', segurado: true }
};
Object.assign(ITEMS, ITENS_RAIDE_SEGURADOS);

/* Pratos do Arceus + Lenço de Seda (28/09/2026): vantagem de tipo das badges "Especialista em X" (badges.js) —
   derrotar 1.000 Pokémon de um tipo dá o prato daquele tipo, +20% de dano nos golpes desse tipo enquanto
   segurado (gancho `danoTipo`, o mesmo do Núcleo Eternamax, ver segurados.js). Item real dos jogos (Arceus
   troca de tipo carregando um), nunca implementado aqui antes — trocou a escolha original (pedra de evolução/
   petisco de afinidade por tipo), que dava vantagem fraca ou nenhuma pra vários tipos e usava item de CAPTURA
   como prêmio de batalha (pedido do usuário pra corrigir). Normal é a única exceção real: nos jogos o Arceus
   não tem prato Normal (a forma base dele já É Normal, sem prato nenhum), então usa o Lenço de Seda. Sem
   `price`: só vêm da badge, não se compram na loja. `PLACA_DO_TIPO` é a MESMA tabela que badges.js usa pra
   premiar — nunca desalinha qual prato é de qual tipo. */
export const ITENS_VANTAGEM_TIPO = {
  'prato-chama': { name: 'Prato Chama', desc: 'Golpes de Fogo batem 20% mais forte.', segurado: true },
  'prato-aquatico': { name: 'Prato Aquático', desc: 'Golpes de Água batem 20% mais forte.', segurado: true },
  'prato-eletrico': { name: 'Prato Elétrico', desc: 'Golpes Elétricos batem 20% mais forte.', segurado: true },
  'prato-campo': { name: 'Prato Campo', desc: 'Golpes de Planta batem 20% mais forte.', segurado: true },
  'prato-gelido': { name: 'Prato Gélido', desc: 'Golpes de Gelo batem 20% mais forte.', segurado: true },
  'prato-punho': { name: 'Prato Punho', desc: 'Golpes de Lutador batem 20% mais forte.', segurado: true },
  'prato-toxico': { name: 'Prato Tóxico', desc: 'Golpes Venenosos batem 20% mais forte.', segurado: true },
  'prato-terra': { name: 'Prato Terra', desc: 'Golpes Terrestres batem 20% mais forte.', segurado: true },
  'prato-ceu': { name: 'Prato Céu', desc: 'Golpes Voadores batem 20% mais forte.', segurado: true },
  'prato-mente': { name: 'Prato Mente', desc: 'Golpes Psíquicos batem 20% mais forte.', segurado: true },
  'prato-inseto': { name: 'Prato Inseto', desc: 'Golpes de Inseto batem 20% mais forte.', segurado: true },
  'prato-pedra': { name: 'Prato Pedra', desc: 'Golpes de Pedra batem 20% mais forte.', segurado: true },
  'prato-fantasma': { name: 'Prato Fantasma', desc: 'Golpes Fantasmas batem 20% mais forte.', segurado: true },
  'prato-draconico': { name: 'Prato Dracônico', desc: 'Golpes de Dragão batem 20% mais forte.', segurado: true },
  'prato-pavor': { name: 'Prato Pavor', desc: 'Golpes Sombrios batem 20% mais forte.', segurado: true },
  'prato-ferro': { name: 'Prato Ferro', desc: 'Golpes de Aço batem 20% mais forte.', segurado: true },
  'prato-fada': { name: 'Prato Fada', desc: 'Golpes de Fada batem 20% mais forte.', segurado: true },
  'lenco-de-seda': { name: 'Lenço de Seda', desc: 'Golpes Normais batem 20% mais forte.', segurado: true }
};
Object.assign(ITEMS, ITENS_VANTAGEM_TIPO);
export const PLACA_DO_TIPO = {
  fire: 'prato-chama', water: 'prato-aquatico', electric: 'prato-eletrico', grass: 'prato-campo', ice: 'prato-gelido',
  fighting: 'prato-punho', poison: 'prato-toxico', ground: 'prato-terra', flying: 'prato-ceu', psychic: 'prato-mente',
  bug: 'prato-inseto', rock: 'prato-pedra', ghost: 'prato-fantasma', dragon: 'prato-draconico', dark: 'prato-pavor',
  steel: 'prato-ferro', fairy: 'prato-fada', normal: 'lenco-de-seda'
};

/* Pedra Mega: conquistar a Mega da espécie NÃO basta — é preciso carregar a pedra, como nos jogos (pedido do
   usuário). Ela é um item SEGURADO: compra na loja e equipa no seu Pokémon.
   É um item só, e não 89: a pedra vale pra espécie que você está jogando, e a loja só a oferece quando aquela
   espécie já tem a Mega conquistada na conta (`soComMega`, ver render.js) — então não há como comprar a pedra
   "errada". Rayquaza é a exceção e não usa pedra nenhuma: ele megaevolui sabendo Dragon Ascent (mega.js). */
export const PRECO_PEDRA_MEGA = 15000;
export const ITEM_PEDRA_MEGA = 'pedra-mega';
export const ITENS_MEGA = {
  [ITEM_PEDRA_MEGA]: {
    name: 'Pedra Mega', segurado: true, soComMega: true, price: PRECO_PEDRA_MEGA, categoria: 'segurado',
    desc: 'A pedra que responde à sua. Segure-a para poder megaevoluir na batalha (uma vez por luta, sem gastar o turno).'
  }
};
Object.assign(ITEMS, ITENS_MEGA);

/* Cristal Z: mesma ideia da Pedra Mega — a conquista libera a COMPRA, e é preciso segurar pra usar. Um item só
   serve pra todos os tipos: o cristal responde ao golpe que você escolher, entre os que a conta já conquistou
   (zmove.js). A loja só o mostra se você já tem alguma conquista de Z (`soComZ`, ver render.js). */
export const PRECO_CRISTAL_Z = 12000;
export const ITEM_CRISTAL_Z = 'cristal-z';
Object.assign(ITEMS, {
  [ITEM_CRISTAL_Z]: {
    name: 'Cristal Z', segurado: true, soComZ: true, price: PRECO_CRISTAL_Z, categoria: 'segurado',
    desc: 'Guarda a energia de um golpe seu. Segure-o para desferir um Z-Move uma vez por batalha — o golpe sai muito mais forte.'
  }
});

/* Vínculo de Batalha (Battle Bond): mesma ideia da Pedra Mega, mas pro Greninja — 1.000 golpes finais sendo ele
   liberam a COMPRA (conquistas.js ALVOS.vinculo/ESPECIES_VINCULO), e é preciso segurar. Derrubar um oponente
   segurando ele vira Ash-Greninja pro resto da luta (golpe.js virarAshGreninja); Water Shuriken fica fixo em
   poder 20 e 3 acertos (regras.golpeDoBattleBond). Igual à habilidade de verdade, só funciona no Greninja —
   noutra espécie o item fica parado na mochila, sem efeito (a descrição já avisa). */
export const PRECO_VINCULO = 15000;
export const ITEM_VINCULO = 'vinculo-de-batalha';
Object.assign(ITEMS, {
  [ITEM_VINCULO]: {
    name: 'Vínculo de Batalha', segurado: true, soComVinculo: true, price: PRECO_VINCULO, categoria: 'segurado',
    desc: 'Só funciona no Greninja: derrubar um oponente segurando ele vira Ash-Greninja pro resto da luta, com Water Shuriken bem mais forte.'
  }
});

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

/* Itens de TREINO (itens.js, `treino`): os únicos que mexem nos números de NASCENÇA de um Pokémon, e por isso
   os mais caros do jogo. Não entram em `FIND_ITEMS` nem em prêmio de Alfa de propósito (pedido do usuário):
   achar isso numa rota tiraria o peso da decisão — só na loja, a ₽250.000 cada.
   `treino: 'iv'` sorteia QUAL IV sobe, entre os que ainda não estão em 31 (nunca repete um que já está no
   máximo). Não deixar escolher é a trava de balanceamento: com escolha, ₽1,5 milhão compraria um Pokémon
   perfeito; sem ela, cada tampa é uma aposta e os últimos IVs ficam caros de verdade.
   `treino: 'habilidade'`, ao contrário, DEIXA escolher: habilidade não tem "melhor" absoluto como um IV 31 —
   a troca é lateral, e escolher às cegas num item deste preço seria pegadinha. */
export const PRECO_TREINO = 250000;
export const ITENS_TREINO = {
  // "Fresh Start Mochi" (Gen 9) e "Bottle Cap" (Treino Intenso, Gen 7) — itens reais, mesmo papel
  'fresh-start-mochi': { name: 'Mochi do Recomeço', desc: 'Zera os EVs de um Pokémon da equipe: os pontos de treino que ele ganhou derrotando outros voltam a 0 e os atributos caem junto. Serve pra treinar de novo do zero. Só fora de batalha.', treino: 'evs', price: PRECO_TREINO },
  'bottle-cap': { name: 'Tampa de Garrafa', desc: 'Leva UM IV ao máximo (31) num Pokémon da equipe. Qual deles é SORTEADO entre os que ainda não estão em 31 — você não escolhe, e nenhuma tampa é desperdiçada num que já está no máximo. Só fora de batalha.', treino: 'iv', price: PRECO_TREINO },
  // a Cápsula troca por qualquer OUTRA habilidade da espécie, inclusive a oculta — nos jogos isso são dois itens
  // (Cápsula entre as normais, Adesivo pra oculta); aqui é um só, e quem escolhe é o jogador, com a descrição na mão
  'ability-capsule': { name: 'Cápsula de Habilidade', desc: 'Troca a habilidade de um Pokémon da equipe por outra da MESMA espécie, você escolhendo qual — inclusive a oculta. A lista mostra o que cada uma faz. Espécie de habilidade única não tem pra onde trocar. Só fora de batalha.', treino: 'habilidade', price: PRECO_TREINO }
};
Object.assign(ITEMS, ITENS_TREINO);

// Divisões da mochila e da loja, na ordem em que aparecem. `de(it)` diz a que divisão o item pertence.
export const CATEGORIAS_ITEM = [
  { id: 'cura', nome: '🧪 Cura e status', de: it => it.heal || it.healPct || it.cure || it.ether || it.revive },
  { id: 'batalha', nome: '⚔ Em batalha', de: it => it.battle || it.stage },
  /* ⚠️ `evolucao` vem ANTES de `segurado`: item de dupla função (dados.duplo — Pedra do Rei e cia.) tem as duas
     marcas, e a casa dele na loja/mochila é 💎 Evolução. Isso não o esconde pra equipar: o seletor de "Segurar"
     (render.js) filtra por `segurado`, não por categoria. */
  { id: 'evolucao', nome: '💎 Evolução', de: it => it.evo || it.troca || it.segurar },
  { id: 'segurado', nome: '🎒 Para segurar', de: it => it.segurado },
  { id: 'exploracao', nome: '🧭 Exploração', de: it => it.repelente },
  { id: 'golpes', nome: '📀 Golpes', de: it => it.ensina },
  { id: 'petisco', nome: '🍖 Petiscos (amizade)', de: it => it.afinidade },
  { id: 'especial', nome: '✨ Especiais', de: it => it.candy || it.treino },
  { id: 'outros', nome: '📦 Outros', de: () => true }
];
export const categoriaDoItem = it => (CATEGORIAS_ITEM.find(c => it && c.de(it)) || CATEGORIAS_ITEM.at(-1)).id;
// agrupa [id, qtd] (ou [id, item]) nas divisões, pulando as vazias: [{ id, nome, itens: [...] }]
export function porCategoria(pares) {
  return CATEGORIAS_ITEM.map(c => ({ ...c, itens: pares.filter(([k]) => ITEMS[k] && categoriaDoItem(ITEMS[k]) === c.id) })).filter(c => c.itens.length);
}

/* Os itens de evolução que TAMBÉM valem segurados (dados.duplo). Lista derivada, não escrita à mão: quem marcar
   um item novo como `duplo` entra aqui sozinho, e `segurados.js` cobra um gancho pra cada um. */
export const IDS_EVO_EM_BATALHA = Object.keys(ITENS_EVO).filter(k => ITENS_EVO[k].segurado);
// o que dá pra achar explorando (as pedras também; o Cabo de Conexão só na loja)
export const ITENS_EVO_ACHADOS = Object.keys(ITENS_EVO).filter(k => k !== 'linking-cord');
Object.assign(ITEMS, ITENS_EVO); // mochila, loja e sprites tratam igual aos outros itens
/* O que dá pra ACHAR explorando além da lista comum, DERIVADO em vez de escrito: fruta ou segurado novo na
   tabela já cai aqui sozinho (pedido do usuário — as frutas e os segurados da leva de 30/09/2026 só existiam na
   loja, e quem não passa na loja nunca encostava na mecânica).
     `FRUTAS_ACHADAS`     — toda fruta. Baratas (₽300–1200) e de uso único, então valem em QUALQUER rota: é o
                            mesmo motivo do 'oran-berry' que já estava em `FIND_ITEMS`, topar com a mecânica cedo.
                            As 17 de aperto por tipo são o caso que mais precisava disso: achar a Fruta Yache no
                            chão ensina o que ela faz melhor que uma linha de loja.
     `SEGURADOS_ACHADOS`  — os segurados PERMANENTES (Restos, Orbe da Vida, Faixa Escolha…). Caros e pra sempre,
                            então entram no mesmo degrau dos itens de evolução: da 4ª rota em diante
                            (`mundo.explore`). Achar um Orbe da Vida na rota 1 esvaziaria a loja.
   A varredura é em `ITENS_SEGURADOS` + `ITENS_FRUTA_TIPO`, NÃO em `ITEMS`, e isso é de propósito: os segurados
   de prêmio de raide (`ITENS_RAIDE_SEGURADOS`, sem `price`) ficam de fora — são o prêmio de vencer o chefe da
   semana, e achá-los no chão tiraria o motivo de lutar com ele. */
const ehFruta = k => k.endsWith('-berry');
export const FRUTAS_ACHADAS = Object.keys({ ...ITENS_SEGURADOS, ...ITENS_FRUTA_TIPO }).filter(ehFruta);
export const SEGURADOS_ACHADOS = Object.keys(ITENS_SEGURADOS).filter(k => !ehFruta(k));

// itens achados explorando — inclui uma fruta pra segurar, pra todo mundo topar com a mecânica cedo
export const FIND_ITEMS = ['oran-berry','potion', 'potion', 'potion', 'super-potion', 'super-potion', 'hyper-potion', 'mega-potion', 'antidote', 'paralyze-heal', 'awakening', 'burn-heal', 'ice-heal', 'ether', 'x-attack', 'x-defense', 'x-sp-atk', 'x-sp-def', 'x-speed', 'rare-candy', 'charcoal', 'mystic-water', 'honey', 'hard-stone', 'magnet', 'tiny-mushroom'];

// Zonas = as rotas de todos os mapas por Gen (dados-mapas.js; lógica em mapas.js). `libera` = nível mínimo pra
// entrar (zonaLiberada). `chefe` = o Alfa da rota: versão turbinada (statsDeChefe), desafiado por botão; recompensa
// só na 1ª vitória (S.chefes[rota]). A rota `final` tem `lendarios` no lugar do Alfa (vencer = fechar a Gen).
// pool = [{ id, n: speciesName, p: peso de aparição, m?: mítico }].
export const ZONES = GENS.flatMap(g => g.rotas);

/* Missões. `libera` = condição pra missão aparecer (sem ela: visível desde o início); `objetivo` = pra concluir.
   Condição (uma chave só): { derrotar: especie, qtd } · { alvos: [[especie, qtd]…], qualquer? } · { vitorias } ·
   { amigos } · { nivel } · { chefe: zona } · { treinadores } · { missao: id } · { dinheiro } (ter de uma vez) ·
   { gasto } (total gasto) · { evolucoes }. Avaliada por progressoCondicao(cond, S) em regras.js — espécie = speciesName.
   `premio`: { dinheiro?, itens?: { idItem: qtd } }. `gen` = só aparece jogando no mapa dessa Gen.

   Esta lista é a das missões GLOBAIS (vitórias, amizade, dinheiro, gasto, treinadores, nível): valem em qualquer
   mapa e não têm `gen`. As missões POR ROTA (uma de espécie e uma de Alfa em cada rota das 9 Gens) vêm de
   `dados-rotas.js`, gerado pelo editor de rotas, e são juntadas em `MISSOES` logo abaixo da tabela. */
const MISSOES_GLOBAIS = [
  // começo
  { id: 'primeiros', nome: 'Primeiros passos', desc: 'Vença 3 batalhas.', objetivo: { vitorias: 3 }, premio: { dinheiro: 300 } },
  { id: 'vitorias25', nome: 'Pegando o jeito', desc: 'Vença 25 batalhas.', libera: { missao: 'primeiros' }, objetivo: { vitorias: 25 }, premio: { dinheiro: 1000 } },
  { id: 'vitorias100', nome: 'Terror da região', desc: 'Vença 100 batalhas.', libera: { missao: 'vitorias25' }, objetivo: { vitorias: 100 }, premio: { itens: { 'rare-candy': 3 } } },
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
  { id: 'veterano', nome: 'Veterano', desc: 'Chegue ao nível 40.', libera: { nivel: 30 }, objetivo: { nivel: 40 }, premio: { dinheiro: 8000 } },
  { id: 'nivel60', nome: 'Topo da cadeia', desc: 'Chegue ao nível 60.', libera: { missao: 'veterano' }, objetivo: { nivel: 60 }, premio: { itens: { 'max-revive': 1 } } }
];
/* As globais primeiro, as de rota depois: é a ordem em que a tela de missões e o `verificarMissoes` percorrem, e
   as de rota são as que mudam com o editor. `situacaoMissoes` filtra por `gen`, então numa jornada só aparecem as
   21 globais + as 20 do mapa em que você está. */
export const MISSOES = [...MISSOES_GLOBAIS, ...MISSOES_ROTA];
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

/* Pseudo-lendários (badge 'ovos100', ovos.js): as FORMAS BASE das 10 linhas de 600 stats-base — uma por Gen. Lista à
   mão porque "pseudo-lendário" não é um dado da PokéAPI, é consenso da comunidade (3 estágios, 1.250.000 de XP,
   600 de total base). Tyrunt e os paradoxos não entram. */
export const PSEUDO_LENDARIOS = ['dratini', 'larvitar', 'bagon', 'beldum', 'gible', 'deino', 'goomy', 'jangmo-o', 'dreepy', 'frigibax'];

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
//   desbloqueios = jornadas DESTE modo contam pra desbloquear espécies novas (roguelike.js). Usar o que já foi
//                  desbloqueado vale em TODOS os modos — o portão é só pra conquistar, não pra jogar
//   especiesLivres = começar com QUALQUER Pokémon (busca livre); false = só REGIOES_INICIAIS. Hoje false em todos — decisão do usuário, pode mudar por modo
//   multPontos   = multiplicador da pontuação final da jornada (recordes / ranking)
//   permadeath   = desmaiou, acabou (sem Revive); aliado que desmaia é perdido na hora (o Centro não traz de volta)
//   fimNaGen     = vencer os lendários do mapa encerra a jornada (vitória) e libera o mapa da Gen seguinte; sem ela, escolhe o próximo mapa e segue
//   desmaiosLivres = desmaios sem custo; depois disso cada desmaio gasta um Revive, e sem Revive é Game Over (null = ilimitado)
// Save antigo sem o campo dificuldade = easy (dificuldadeDe).
export const DIFICULDADES = {
  // modo principal: começa só com iniciais; espécies novas desbloqueiam jogando (desbloqueios, ver roguelike.js)
  roguelike: { nome: 'Roguelike', especiesLivres: false, desbloqueios: true, permadeath: true, climaRotasFixo: true, eventoSemanal: true, fimNaGen: true, multPontos: 1.5, desmaiosLivres: 0, semCaptura: false, fimDeJogo: true, centroGratis: false, descontoPorVitoria: 0.1, nivelLivre: false, escolhaLivre: true, desc: 'O modo principal. Sem segunda chance: desmaiou, a run acabou; aliado que desmaia é perdido pra sempre. Começa com os iniciais; derrotar, fazer amizade ou evoluir desbloqueia novas espécies pras próximas runs. Vencer os lendários do mapa fecha a run e libera o mapa da próxima Gen. Nível 5.' },
  easy: { nome: 'Fácil', especiesLivres: false, multPontos: 1, desmaiosLivres: null, semCaptura: true, centroGratis: true, nivelLivre: true, escolhaLivre: true, desc: 'Treinadores nunca te capturam e o Centro Pokémon é de graça. Nível inicial, natureza e habilidade à sua escolha.' },
  medium: { nome: 'Médio', especiesLivres: false, multPontos: 1.2, desmaiosLivres: 3, semCaptura: true, centroGratis: false, descontoPorVitoria: 0.1, nivelLivre: true, escolhaLivre: true, desc: 'Igual ao Fácil, mas o Centro Pokémon cobra: cada vitória desde a última visita tira 10% do preço.' },
  hard: { nome: 'Difícil', especiesLivres: false, multPontos: 1.5, desmaiosLivres: 3, semCaptura: false, centroGratis: false, nivelLivre: false, escolhaLivre: true, desc: 'Se for capturado, você foge dias depois: sem a mochila, com metade do dinheiro, em outra zona. Centro pago. Começa no nível 5.' },
  // `climaRotasFixo`: o clima e o terreno das rotas ficam SEMPRE ligados (nos outros modos é opção da criação, desligada por padrão)
  hardcore: { nome: 'Hardcore', climaRotasFixo: true, eventoSemanal: true, especiesLivres: false, multPontos: 2, desmaiosLivres: 3, semCaptura: false, fimDeJogo: true, centroGratis: false, nivelLivre: false, escolhaLivre: false, desc: 'Ser capturado é o fim da jornada: o save é apagado. Centro pago. Começa no nível 5, com natureza e habilidade sorteadas.' },
  // sorteia até a espécie (a tela inicial troca a busca por um botão só). Captura e Centro = regras do Difícil
  randomizer: { nome: 'Full Randomizer', especiesLivres: false, multPontos: 1.5, desmaiosLivres: 3, semCaptura: false, centroGratis: false, nivelLivre: false, escolhaLivre: false, desc: 'Espécie, natureza e habilidade sorteadas, nível 5. Captura e Centro seguem o Difícil.' },
  /* ⚔ Saga — modo de RPG medieval fantástico (plano em docs/plano-saga.md). EM CONSTRUÇÃO:
     `admin: true` é o que o mantém fora da vista de quem joga (criacao.js esconde o cartão e iniciarJornada
     recusa de novo — regra que só existe na tela não é regra). Sai quando a fase 1 estiver jogável.
     `aliadosEmCampo: 3` = você + 3 na comitiva, só aqui: o teto 2 (MAX_ALIADOS) continua valendo nos outros
     modos, onde é decisão fechada de balanceamento. Quem decide a vaga é `regras.maxAliados`.
     Mole de propósito na fase 1 (3 desmaios livres, sem captura): a fase existe pra avaliar o combate, e
     permadeath atrapalha iterar. A dureza entra junto com as trilhas e as facções (fase 3). */
  /* `jrpg: true` é a flag da CARA e das MECÂNICAS de RPG japonês: janela de comandos (⚔ Atacar · ✨ Perícia ·
     🎒 Mochila · 🏃 Fugir), as 8 perícias com recarga, a Guarda do inimigo com Brecha/Ruína e o vocabulário
     (rodada, comando, comitiva). Separada de `ameaca` e `grupos` de propósito: aquelas duas são regras do alvo e
     do tamanho do encontro, e um dia podem valer sozinhas; esta é "o modo se apresenta como JRPG". */
  saga: { nome: '⚔ Saga', admin: true, jrpg: true, aliadosEmCampo: 3, ameaca: true, grupos: true, especiesLivres: false, climaRotasFixo: true, multPontos: 1.5, desmaiosLivres: 3, semCaptura: true, centroGratis: false, descontoPorVitoria: 0.1, nivelLivre: false, escolhaLivre: true, fimNaGen: true, desc: 'Cada Pokémon tem um ofício na luta — quem segura a linha, quem cura, quem lança o fogo — e você anda com uma comitiva de 4. Cada mapa é um capítulo. Nível 5.' }
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

/* ---- situação de um relato de bug/sugestão (🐞 Relatar) ----
   O banco guarda `status` (supabase/migrations/20260929140000_relatos_status.sql) e a tela mostrava o valor CRU:
   quem relatava lia "novo" ou "lido" e não descobria se o problema já tinha sido resolvido. Aqui mora a tradução
   pro que o jogador precisa saber: já foi atendido, ou ainda está na fila.
   `desconhecido` cobre um status que o banco venha a ter e esta tabela ainda não — a tela mostra algo em vez de
   um espaço vazio. O vocabulário é fechado por CHECK no banco, e tests/relatos-status.test.js confere os dois. */
export const STATUS_RELATO = {
  novo:      { rotulo: '⏳ Aguardando', classe: 'aguardando', desc: 'Recebido. Ainda não foi analisado.' },
  lido:      { rotulo: '👀 Em análise', classe: 'analise',    desc: 'Já foi lido e está na fila.' },
  resolvido: { rotulo: '✅ Atendido',   classe: 'atendido',   desc: 'Virou correção ou novidade no jogo.' },
  arquivado: { rotulo: '📦 Arquivado',  classe: 'arquivado',  desc: 'Analisado, mas não virou mudança.' },
};
export const STATUS_RELATO_PADRAO = { rotulo: '• Em andamento', classe: 'aguardando', desc: 'Situação ainda sendo acompanhada.' };
export const situacaoDoRelato = s => STATUS_RELATO[s] || STATUS_RELATO_PADRAO;
