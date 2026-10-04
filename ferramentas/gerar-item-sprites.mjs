// GERADOR (roda no Raspberry Pi, que tem Node — ver como-rodar-dois-ambientes na CLAUDE.md) de js/dados-item-sprites.js.
// Node normal (não PowerShell): a PokéAPI tem sprite de verdade pra pedra Mega (por espécie) e cristal Z (por
// tipo), mas a Pedra Mega/Cristal Z/Vínculo de Batalha do jogo são itens ÚNICOS e genéricos (dados.js) — não dá
// pra ITEM_SPR(k) simples achar o arquivo certo. Este script busca a espécie de cada Pedra Mega OFICIAL (texto em
// inglês do item, "Allows X to Mega Evolve") e casa as pedras de espécies que NÃO são Mega oficial dos jogos
// (Meganium, Chesnaught, Greninja...) pelo nome (prefixo comum — o nome do item nesses casos É o nome da espécie
// com sufixo trocado, ex. "meganiumite" pra Meganium). Roda de novo se `js/dados-megas.js` ganhar espécie nova.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { MEGAS } from '../js/dados-megas.js';

const API = 'https://pokeapi.co/api/v2';
const CDN = 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/items';

/* ---- itens cuja CHAVE no jogo não acha arquivo nenhum em `ITEM_SPR(chave)` ----
   Levantamento feito batendo todo `ITEMS`/`BOLAS`/`ITENS_EVO`/`SEGURADOS` contra o CDN: 53 chaves caíam na
   caixinha de reserva (`ITEM_SPR_RESERVA`). Três saídas, por motivo diferente:

   1. APELIDO — é um item REAL, só com chave em português no jogo (os 17 pratos do Arceus, o Lenço de Seda).
      O sprite da PokéAPI existe, o nome é que é outro.
   2. PARECIDO — é um item INVENTADO deste jogo (os de raide, a Mega Potion). Não existe sprite pra buscar, então
      aponta pra um item real de visual coerente — o mesmo critério da Pedra-Chave genérica em PEDRAS_MEGA: um
      ícone que combina com o nome é melhor que a caixinha.
   3. VENDORIZADO — é um item real que a PokéAPI simplesmente não desenhou (Gen 8/9: pergaminhos do Kubfu,
      armaduras do Charcadet, Mochi…). O PNG vem do pokesprite (jsDelivr) ou do Serebii e é GRAVADO em
      `img/itens/` pelo próprio gerador: servido pelo nosso domínio, funciona offline e não depende de terceiro
      na hora de jogar (hotlink de fansite quebra sem avisar). Arquivo novo aqui = linha nova no PRECACHE do sw.js. */
const APELIDO = {
  'prato-chama': 'flame-plate', 'prato-aquatico': 'splash-plate', 'prato-eletrico': 'zap-plate',
  'prato-campo': 'meadow-plate', 'prato-gelido': 'icicle-plate', 'prato-punho': 'fist-plate',
  'prato-toxico': 'toxic-plate', 'prato-terra': 'earth-plate', 'prato-ceu': 'sky-plate',
  'prato-mente': 'mind-plate', 'prato-inseto': 'insect-plate', 'prato-pedra': 'stone-plate',
  'prato-fantasma': 'spooky-plate', 'prato-draconico': 'draco-plate', 'prato-pavor': 'dread-plate',
  'prato-ferro': 'iron-plate', 'prato-fada': 'pixie-plate', 'lenco-de-seda': 'silk-scarf',
  // Pedra Mega e Cristal Z têm tabela própria (render.spriteItem passa pela espécie/tipo); isto é só a rede de
  // segurança pra quem chamar ITEM_SPR com a chave crua.
  'pedra-mega': 'key-stone', 'cristal-z': 'z-power-ring'
};
const PARECIDO = {
  'mega-potion': 'moomoo-milk',
  'cristal-de-ruptura': 'red-shard', 'selo-de-interrupcao': 'odd-keystone', 'escudo-astral': 'light-clay',
  'cinza-vulcanica': 'soot-sack', 'escama-abissal': 'deep-sea-scale', 'prisma-de-luz': 'light-stone',
  'espelho-reverso': 'star-piece', 'relogio-de-areia': 'x-speed', 'fragmento-tera': 'comet-shard',
  'celula-zygarde': 'zygarde-cube', 'nucleo-eternamax': 'griseous-orb', 'escama-do-ceu': 'pretty-wing',
  'cristal-psiquico': 'psychic-gem', 'emblema-da-coroa': 'relic-crown', 'cristal-gelido': 'ice-gem',
  'presa-da-lua': 'razor-fang'
};
const POKESPRITE = 'https://cdn.jsdelivr.net/gh/msikma/pokesprite@master/items';
const SEREBII = 'https://www.serebii.net/itemdex/sprites';
const VENDORIZADO = {
  'sweet-apple': `${POKESPRITE}/evo-item/sweet-apple.png`, 'tart-apple': `${POKESPRITE}/evo-item/tart-apple.png`,
  'cracked-pot': `${POKESPRITE}/evo-item/cracked-pot.png`, 'galarica-cuff': `${POKESPRITE}/evo-item/galarica-cuff.png`,
  'galarica-wreath': `${POKESPRITE}/evo-item/galarica-wreath.png`, 'strawberry-sweet': `${POKESPRITE}/evo-item/strawberry-sweet.png`,
  // Rédea Espectral é item de raide inventado, mas a Reins of Unity do Calyrex existe de verdade — sprite real, só não na PokéAPI
  'redea-espectral': `${POKESPRITE}/key-item/reins-of-unity.png`,
  'auspicious-armor': `${SEREBII}/sv/auspiciousarmor.png`, 'malicious-armor': `${SEREBII}/sv/maliciousarmor.png`,
  'black-augurite': `${SEREBII}/sv/blackaugurite.png`, 'peat-block': `${SEREBII}/sv/peatblock.png`,
  'scroll-of-darkness': `${SEREBII}/sv/scrollofdarkness.png`, 'scroll-of-waters': `${SEREBII}/sv/scrollofwaters.png`,
  'linking-cord': `${SEREBII}/linkingcord.png`, 'fresh-start-mochi': `${SEREBII}/sv/fresh-startmochi.png`
};
const PASTA_ITENS = new URL('../img/itens/', import.meta.url);

async function comRetentativa(fn, tentativas = 3) {
  for (let i = 1; i <= tentativas; i++) {
    try { return await fn(); }
    catch (e) { if (i === tentativas) throw e; await new Promise(r => setTimeout(r, 500 * i)); }
  }
}
async function json(url) {
  return comRetentativa(async () => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    return r.json();
  });
}
async function existeSprite(nomeArquivo) {
  return comRetentativa(async () => {
    const r = await fetch(`${CDN}/${nomeArquivo}.png`);
    return r.ok;
  });
}

// nome da espécie (minúsculo) pra comparar com o nome do item (que costuma ser a espécie + sufixo tipo "ite")
const normaliza = s => s.toLowerCase();
function melhorEspecie(nomeItem, especies) {
  const alvo = normaliza(nomeItem).replace(/-(x|y|z)$/, ''); // sufixo de forma não entra na comparação
  let melhor = null, melhorScore = 0;
  for (const especie of especies) {
    let i = 0;
    while (i < especie.length && i < alvo.length && especie[i] === alvo[i]) i++;
    if (i > melhorScore && i >= Math.min(5, especie.length)) { melhorScore = i; melhor = especie; }
  }
  return melhor;
}

async function main() {
  const especies = Object.keys(MEGAS);
  const cat = await json(`${API}/item-category/mega-stones/`);
  const nomesItens = cat.items.map(i => i.name);

  const pedras = {}; // especie -> nome do arquivo de sprite (sem .png)
  const semSprite = [];
  for (const nomeItem of nomesItens) {
    const detalhe = await json(`${API}/item/${nomeItem}/`);
    const en = detalhe.effect_entries.find(e => e.language.name === 'en')?.short_effect;
    const oficial = en?.match(/Allows (\w+) to Mega Evolve/)?.[1]?.toLowerCase();
    const especie = oficial && especies.includes(oficial) ? oficial : melhorEspecie(nomeItem, especies);
    if (!especie) { console.warn('sem espécie casada:', nomeItem); continue; }
    // prioriza a forma "base" (sem -x/-y/-z) quando a espécie já tem uma pedra melhor escolhida
    const jaTem = pedras[especie];
    const ehAlternativa = /-(x|y|z)$/.test(nomeItem);
    if (jaTem && ehAlternativa) continue; // já tem uma pedra "principal" pra essa espécie, ignora a X/Y/Z extra
    if (jaTem && !ehAlternativa && !/-(x|y|z)$/.test(jaTem)) continue; // duas "principais" — mantém a primeira
    if (!(await existeSprite(nomeItem))) { semSprite.push(nomeItem); continue; }
    pedras[especie] = nomeItem;
  }

  // Kyogre e Groudon não usam pedra Mega — usam os orbes (Reversão Primitiva), fora da categoria "mega-stones"
  for (const [especie, item] of [['kyogre', 'blue-orb'], ['groudon', 'red-orb']]) {
    if (especies.includes(especie) && (await existeSprite(item))) pedras[especie] = item;
  }

  const semPedra = especies.filter(e => !pedras[e]);

  // Cristal Z: tabela regular, um por tipo (nome oficial da PokéAPI, sufixo "--held" no arquivo de sprite)
  const cristais = {
    normal: 'normalium-z', fire: 'firium-z', water: 'waterium-z', electric: 'electrium-z', grass: 'grassium-z',
    ice: 'icium-z', fighting: 'fightinium-z', poison: 'poisonium-z', ground: 'groundium-z', flying: 'flyinium-z',
    psychic: 'psychium-z', bug: 'buginium-z', rock: 'rockium-z', ghost: 'ghostium-z', dragon: 'dragonium-z',
    dark: 'darkinium-z', steel: 'steelium-z', fairy: 'fairium-z'
  };
  for (const [tipo, nome] of Object.entries(cristais)) {
    if (!(await existeSprite(`${nome}--held`))) throw new Error(`cristal Z sem sprite: ${tipo} -> ${nome}`);
  }

  // 1 e 2: confere que o item apontado existe mesmo no CDN (nome errado aqui viraria caixinha de reserva calada)
  const alias = {};
  for (const [chave, nome] of Object.entries({ ...APELIDO, ...PARECIDO })) {
    if (!(await existeSprite(nome))) throw new Error(`apelido sem sprite no CDN: ${chave} -> ${nome}`);
    alias[chave] = nome;
  }
  // 3: baixa o que falta pra img/itens/ (só uma vez; depois o arquivo está no repo)
  mkdirSync(PASTA_ITENS, { recursive: true });
  for (const [chave, url] of Object.entries(VENDORIZADO)) {
    const destino = new URL(`${chave}.png`, PASTA_ITENS);
    if (!existsSync(destino)) {
      const r = await comRetentativa(() => fetch(url));
      if (!r.ok) throw new Error(`sprite vendorizado falhou: ${chave} (${url}) HTTP ${r.status}`);
      writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
      console.log('baixado img/itens/' + chave + '.png');
    }
    alias[chave] = `img/itens/${chave}.png`;
  }

  const saida = `/* GERADO por ferramentas/gerar-item-sprites.mjs a partir da PokéAPI — não editar à mão (rode de novo).
   Pedra Mega (dados.ITEM_PEDRA_MEGA) e Cristal Z (dados.ITEM_CRISTAL_Z) são itens ÚNICOS e genéricos no jogo —
   isso aqui é só pro SPRITE mudar pra pedra/cristal de verdade conforme a espécie/tipo, em vez do ícone genérico.
   PEDRAS_MEGA: só ${Object.keys(pedras).length} de ${especies.length} espécies têm pedra desenhada de verdade na
   PokéAPI (as Megas oficiais dos jogos + Kyogre/Groudon); o resto (Megas que só existem neste projeto, como
   Meganium ou Greninja) cai na Pedra-Chave genérica (CHAVE_MEGA_GENERICA) — ela é um item real dos jogos e ativa
   QUALQUER Mega Evolução, então nunca fica errado mostrar ela.
   Sem pedra própria (usam a Chave genérica): ${semPedra.join(', ') || 'nenhuma'}. */
export const PEDRAS_MEGA = ${JSON.stringify(pedras, null, 2).replace(/"([a-z0-9-]+)":/g, "$1:")};
export const CHAVE_MEGA_GENERICA = 'key-stone';
export const CRISTAIS_Z = ${JSON.stringify(cristais, null, 2).replace(/"([a-z0-9-]+)":/g, "$1:")};
export const ANEL_Z_GENERICO = 'z-power-ring';
/* Chave do jogo -> sprite, pros itens em que a chave não acha arquivo nenhum na PokéAPI (lido por \`ITEM_SPR\`, em
   dados.js). Valor COM barra é arquivo nosso em img/itens/ (item real que a PokéAPI não desenhou, baixado pelo
   gerador); valor sem barra é nome de item na PokéAPI — item real com chave em português (os pratos do Arceus) ou
   item inventado deste jogo apontando pro real mais parecido. O critério de cada um está no gerador. */
export const SPRITE_DO_ITEM = ${JSON.stringify(alias, null, 2).replace(/"([a-z0-9]+)":/g, "$1:")};
`;
  writeFileSync(new URL('../js/dados-item-sprites.js', import.meta.url), saida);
  console.log(`ok: ${Object.keys(pedras).length}/${especies.length} espécies com pedra própria -> js/dados-item-sprites.js`);
  if (semSprite.length) console.log('itens sem sprite no CDN (ignorados):', semSprite.join(', '));
  if (semPedra.length) console.log('espécies com pedra genérica:', semPedra.join(', '));
}
main().catch(e => { console.error(e); process.exit(1); });
