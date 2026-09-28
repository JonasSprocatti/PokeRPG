// GERADOR (roda no Raspberry Pi, que tem Node — ver como-rodar-dois-ambientes na CLAUDE.md) de js/dados-item-sprites.js.
// Node normal (não PowerShell): a PokéAPI tem sprite de verdade pra pedra Mega (por espécie) e cristal Z (por
// tipo), mas a Pedra Mega/Cristal Z/Vínculo de Batalha do jogo são itens ÚNICOS e genéricos (dados.js) — não dá
// pra ITEM_SPR(k) simples achar o arquivo certo. Este script busca a espécie de cada Pedra Mega OFICIAL (texto em
// inglês do item, "Allows X to Mega Evolve") e casa as pedras de espécies que NÃO são Mega oficial dos jogos
// (Meganium, Chesnaught, Greninja...) pelo nome (prefixo comum — o nome do item nesses casos É o nome da espécie
// com sufixo trocado, ex. "meganiumite" pra Meganium). Roda de novo se `js/dados-megas.js` ganhar espécie nova.
import { writeFileSync } from 'node:fs';
import { MEGAS } from '../js/dados-megas.js';

const API = 'https://pokeapi.co/api/v2';
const CDN = 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/items';

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
`;
  writeFileSync(new URL('../js/dados-item-sprites.js', import.meta.url), saida);
  console.log(`ok: ${Object.keys(pedras).length}/${especies.length} espécies com pedra própria -> js/dados-item-sprites.js`);
  if (semSprite.length) console.log('itens sem sprite no CDN (ignorados):', semSprite.join(', '));
  if (semPedra.length) console.log('espécies com pedra genérica:', semPedra.join(', '));
}
main().catch(e => { console.error(e); process.exit(1); });
