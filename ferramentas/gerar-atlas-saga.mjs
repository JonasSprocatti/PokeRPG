/* ============ gerador da ARTE do mundo da ⚔ Saga ============
   Monta, a partir de arte ABERTA, os três arquivos que o mapa andável usa:
     img/saga/atlas.png        tiles 32×32 (chão, bordas automáticas) + enfeites grandes (árvore, casa…)
     img/saga/gente.png        humanos: 4 direções × 5 quadros de 64 px cada
     js/dados-saga-arte.js     onde cada figura está (GERADO — não editar à mão)

   De onde vem a arte — e por que ESTA: o padrão Liberated Pixel Cup (LPC) é de tiles 32×32 e personagens de
   64 px, o mesmo grão de pixel dos sprites de 96 px da PokéAPI que o jogo já usa. Tile de 16×16 deixaria um
   humano com um terço da altura de um Pokémon.
     · LPC Base Assets (opengameart.org) — CC-BY-SA 3.0 / GPL 3.0; os tiles de Lanea Zimmerman (Sharm) e os corpos
       de Stephen Challener (Redshrike) também sob OGA-BY 3.0.
     · Universal LPC Spritesheet Character Generator (github.com/LiberatedPixelCup) — roupas, cabelos e cabeças,
       CC-BY-SA 3.0 / GPL 3.0 (autores em CREDITS.csv do repositório).
   O crédito obrigatório mora em `img/saga/CREDITOS.txt`, que este gerador reescreve. O atlas é obra derivada e
   sai sob CC-BY-SA 3.0. NADA aqui é arrancado de jogo comercial — e é pra continuar assim: pack novo só entra
   com licença aberta escrita na página de origem.

   Uso (no Raspberry Pi; precisa de rede e do `unzip`):
     node ferramentas/gerar-atlas-saga.mjs                 baixa as fontes pra pasta temporária e gera
     node ferramentas/gerar-atlas-saga.mjs --origem PASTA  reusa o que já foi baixado em PASTA
   Figura nova = uma linha numa das tabelas abaixo (TERRENOS, SOLTOS, ENFEITES, GENTE) e rodar de novo. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { lerPng, gravarPng, nova, colar, recortar } from './png.mjs';
import { MASCARAS_BLOB, N, NE, L, SE, S, SO, O, NO } from '../js/saga-arte.js';

const T = 32, COLS = 32, Q = 64, QUADROS = [0, 1, 3, 5, 7];   // tile, colunas do atlas, quadro de gente, quadros do ciclo
const RAIZ = path.resolve(import.meta.dirname, '..');
const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const ORIGEM = arg('--origem') || path.join(os.tmpdir(), 'pokerpg-arte-saga');
const URL_BASE = 'https://opengameart.org/sites/default/files/lpc_base_assets.zip';
const URL_ULPC = 'https://raw.githubusercontent.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator/master/spritesheets/';

/* ---- buscar as fontes (uma vez; depois fica na pasta) ---- */
async function baixar(url, destino) {
  if (fs.existsSync(destino)) return;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ao baixar ${url}`);
  fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
  console.log('baixado', path.relative(ORIGEM, destino));
}
const DIR_BASE = path.join(ORIGEM, 'base', 'LPC Base Assets');
async function prepararBase() {
  if (fs.existsSync(DIR_BASE)) return;
  const zip = path.join(ORIGEM, 'base.zip');
  await baixar(URL_BASE, zip);
  execFileSync('unzip', ['-q', '-o', zip, '-d', path.join(ORIGEM, 'base')]);
}
const cache = new Map();
const base = n => { const p = path.join(DIR_BASE, n); if (!cache.has(p)) cache.set(p, lerPng(fs.readFileSync(p))); return cache.get(p); };
const tile = (arq, c, l) => recortar(base(`tiles/${arq}.png`), c * T, l * T, T, T);
async function ulpc(rel) {
  const p = path.join(ORIGEM, 'ulpc', rel);
  await baixar(URL_ULPC + rel, p);
  return lerPng(fs.readFileSync(p));
}

/* ---- cor ---- */
// Multiplica (bom pra roupa, que vem branca) ou recolore pela luz do pixel (bom pra cabelo, que vem ruivo).
function tingir(img, [r, g, b]) {
  const o = { w: img.w, h: img.h, px: Buffer.from(img.px) };
  for (let i = 0; i < o.px.length; i += 4) { o.px[i] = o.px[i] * r / 255; o.px[i + 1] = o.px[i + 1] * g / 255; o.px[i + 2] = o.px[i + 2] * b / 255; }
  return o;
}
function colorir(img, [r, g, b]) {
  const o = { w: img.w, h: img.h, px: Buffer.from(img.px) };
  let max = 1;
  for (let i = 0; i < o.px.length; i += 4) if (o.px[i + 3]) max = Math.max(max, o.px[i] * .3 + o.px[i + 1] * .59 + o.px[i + 2] * .11);
  for (let i = 0; i < o.px.length; i += 4) {
    const luz = Math.min(1, (o.px[i] * .3 + o.px[i + 1] * .59 + o.px[i + 2] * .11) / max * 1.15);
    o.px[i] = r * luz; o.px[i + 1] = g * luz; o.px[i + 2] = b * luz;
  }
  return o;
}
const ponto = (img, x, y, cor) => { if (x >= 0 && y >= 0 && x < img.w && y < img.h) img.px.set(cor, (y * img.w + x) * 4); };
const caixa = (img, x, y, w, h, cor) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) ponto(img, x + i, y + j, cor); };

/* ---- terreno com borda automática ----
   Toda folha de terreno do LPC tem 96×192 e o MESMO desenho: dois tufos soltos em (0,0) e (0,1), os quatro
   cantos internos em (1..2, 0..1), o bloco 3×3 em (0..2, 2..4) e três preenchimentos em (0..2, 5). As 47
   figuras de borda saem de recortar e colar QUARTOS de tile (16 px) dessas peças. */
function blob(arq) {
  const t = (c, l) => tile(arq, c, l), centro = t(1, 3);
  const canto = { [NO]: t(0, 2), [NE]: t(2, 2), [SE]: t(2, 4), [SO]: t(0, 4) };
  const borda = { [N]: t(1, 2), [S]: t(1, 4), [O]: t(0, 3), [L]: t(2, 3) };
  const interno = { [NO]: t(2, 1), [NE]: t(1, 1), [SE]: t(1, 0), [SO]: t(2, 0) };
  const quartos = [[NO, N, O, 0, 0], [NE, N, L, 16, 0], [SE, S, L, 16, 16], [SO, S, O, 0, 16]];
  return MASCARAS_BLOB.map(m => {
    const out = nova(T, T);
    for (const [d, v, h, x, y] of quartos) {
      const src = !(m & v) && !(m & h) ? canto[d] : !(m & v) ? borda[v] : !(m & h) ? borda[h] : !(m & d) ? interno[d] : centro;
      colar(out, src, x, y, 16, 16, x, y);
    }
    return out;
  });
}
// nome no jogo → folha do LPC. `enche` = guardar também os três preenchimentos (chão liso daquele terreno).
const TERRENOS = {
  grama: { arq: 'grass', enche: true, tufos: true }, gramaClara: { arq: 'grassalt' },
  terra: { arq: 'dirt', enche: true }, terraEscura: { arq: 'dirt2', enche: true },
  pedra: { arq: 'cement', enche: true }, buraco: { arq: 'hole', enche: true },
  aguaGrama: { arq: 'watergrass' }, agua: { arq: 'water', enche: true },
  lava: { arq: 'lava', enche: true }, lavaRocha: { arq: 'lavarock' }
};

/* ---- figuras soltas de 32×32 (vão por cima do chão) ---- */
const SOLTOS = {
  rocha: ['rock', 0, 0], pedrinhas: ['rock', 1, 0],
  bau: ['chests', 0, 0], bau2: ['chests', 1, 0], bau3: ['chests', 0, 1], bau4: ['chests', 1, 1],
  bauAberto: ['chests', 0, 2], bauAberto2: ['chests', 1, 2],
  placaPousada: ['signs', 0, 0], placaForja: ['signs', 1, 0], placaLoja: ['signs', 2, 0],
  balde: ['buckets', 0, 0], baldeCheio: ['buckets', 0, 1],
  pedregulho: ['mountains', 10, 7], cascalho: ['mountains', 11, 7],
  estalagmite: ['mountains', 0, 8], estalagmite2: ['mountains', 1, 8], estalagmiteNegra: ['mountains', 2, 8],
  poco: ['hole', 0, 0], fenda: ['hole', 0, 1], pocaLava: ['lava', 0, 0], lagoinha: ['watergrass', 0, 0]
};
/* O que o LPC não tem e é simples o bastante pra desenhar aqui (arte NOSSA, original): flores, mato alto,
   placa de madeira, lápide e o breu das cavernas. */
function desenhados() {
  const d = {};
  d.breu = nova(T, T, [26, 20, 28, 255]);
  const flor = (miolo, petala) => {
    const f = nova(T, T);
    // quatro flores de 5×5 (pétalas em cruz, miolo no meio) com um cabinho — pequenas, mas dá pra ver de longe
    for (const [x, y] of [[4, 5], [19, 3], [11, 15], [24, 18]]) {
      caixa(f, x + 2, y + 5, 1, 4, [46, 110, 50, 255]); ponto(f, x + 3, y + 7, [70, 140, 60, 255]);
      caixa(f, x + 1, y, 3, 5, petala); caixa(f, x, y + 1, 5, 3, petala);
      caixa(f, x + 1, y + 1, 3, 3, [petala[0] * .86, petala[1] * .86, petala[2] * .86, 255]);
      caixa(f, x + 2, y + 2, 1, 1, miolo); ponto(f, x + 2, y + 1, miolo); ponto(f, x + 1, y + 2, miolo); ponto(f, x + 3, y + 2, miolo); ponto(f, x + 2, y + 3, miolo);
    }
    return f;
  };
  d.flores = flor([250, 220, 80, 255], [250, 250, 250, 255]);
  d.floresRosa = flor([250, 240, 160, 255], [240, 130, 170, 255]);
  d.floresAzuis = flor([250, 250, 200, 255], [120, 160, 240, 255]);
  // mato alto: tufos de três lâminas, mais escuros que a grama, espalhados na casa inteira
  const mato = nova(T, T), escuro = [30, 98, 44, 255], claro = [86, 160, 70, 255];
  for (const [x, y] of [[3, 9], [13, 6], [23, 10], [8, 19], [18, 17], [27, 21], [4, 28], [14, 29], [24, 30]]) {
    caixa(mato, x, y - 5, 1, 6, escuro); caixa(mato, x + 2, y - 7, 1, 8, escuro); caixa(mato, x + 4, y - 4, 1, 5, escuro);
    ponto(mato, x + 1, y - 3, claro); ponto(mato, x + 3, y - 5, claro); ponto(mato, x + 2, y - 8, claro);
  }
  d.matoAlto = mato;
  const placa = nova(T, T), madeira = [150, 104, 60, 255], sombra = [96, 62, 36, 255], risco = [70, 44, 26, 255];
  caixa(placa, 14, 16, 4, 14, sombra); caixa(placa, 15, 16, 2, 14, madeira);
  caixa(placa, 4, 4, 24, 14, sombra); caixa(placa, 5, 5, 22, 12, madeira);
  caixa(placa, 8, 8, 16, 1, risco); caixa(placa, 8, 11, 12, 1, risco); caixa(placa, 8, 14, 14, 1, risco);
  d.placa = placa;
  const lapide = nova(T, T), pedra = [150, 152, 160, 255], pedraE = [100, 102, 112, 255];
  caixa(lapide, 9, 8, 14, 20, pedraE); caixa(lapide, 11, 6, 10, 2, pedraE);
  caixa(lapide, 10, 9, 12, 18, pedra); caixa(lapide, 12, 7, 8, 2, pedra);
  caixa(lapide, 13, 13, 6, 1, pedraE); caixa(lapide, 13, 16, 6, 1, pedraE); caixa(lapide, 6, 27, 20, 3, [60, 110, 56, 255]);
  d.lapide = lapide;
  return d;
}

/* ---- enfeites grandes: várias peças coladas numa tela só ----
   `pecas`: [folha, x, y, w, h, ondeX, ondeY] em pixels. `ancora` [dx, dy]: onde o canto de cima-esquerda da tela
   fica em relação ao canto da CASA em que o enfeite está (a casa é o pé dele: tronco, porta). */
const ENFEITES = {
  carvalho: { tam: [96, 128], ancora: [-32, -96], pecas: [['trunk', 0, 0, 96, 64, 0, 64], ['treetop', 0, 0, 96, 96, 0, 0]] },
  carvalho2: { tam: [96, 144], ancora: [-32, -112], pecas: [['trunk', 96, 0, 96, 64, 0, 80], ['treetop', 96, 0, 96, 112, 0, 0]] },
  pinheiro: { tam: [96, 128], ancora: [-32, -96], pecas: [['trunk', 0, 0, 96, 64, 0, 64], ['treetop', 0, 96, 96, 100, 0, 0]] },
  pinheiro2: { tam: [96, 144], ancora: [-32, -112], pecas: [['trunk', 96, 0, 96, 64, 0, 80], ['treetop', 96, 112, 96, 112, 0, 0]] },
  barril: { tam: [32, 64], ancora: [0, -32], pecas: [['barrel', 0, 0, 32, 64, 0, 0]] },
  barris: { tam: [64, 64], ancora: [-16, -32], pecas: [['barrel', 64, 0, 64, 64, 0, 0]] },
  /* casa: parede de tijolo 3×3 com a porta no meio, e o telhado de ardósia (3×4) por cima, cobrindo o topo da
     parede. A casa-âncora é a da PORTA. */
  casa: { tam: [96, 192], ancora: [-32, -160], pecas: [['house', 0, 0, 96, 96, 0, 96], ['house', 96, 0, 32, 48, 32, 144], ['house', 0, 96, 96, 128, 0, 0]] },
  casaPedra: { tam: [96, 160], ancora: [-32, -128], pecas: [['house', 96, 96, 96, 128, 0, 32], ['house', 160, 0, 32, 48, 32, 112], ['house', 224, 0, 32, 32, 2, 40]] },
  entradaCaverna: { tam: [64, 64], ancora: [-16, -32], pecas: [['mountains', 32, 160, 64, 64, 0, 0]] }
};
// Mesma figura, outra cor: é o jeito barato de ter "várias opções pra mesma coisa".
const TINTAS = { carvalhoOutono: ['carvalho', [255, 190, 110]], carvalho2Outono: ['carvalho2', [255, 170, 100]], pinheiroNevado: ['pinheiro', [215, 235, 255]], carvalhoSombrio: ['carvalho', [150, 175, 215]], casaVelha: ['casa', [205, 190, 170]] };

/* ---- gente: camadas do gerador universal do LPC, todas de 576×256 (9 quadros × 4 direções) ----
   [arquivo, tinta?] — `cor:` recolore pela luz (cabelo), lista simples multiplica (roupa branca vira a cor). */
const C = 'body/bodies/', H = 'head/heads/human/';
const GENTE = {
  cacador: [[C + 'male/walk.png'], [H + 'male/walk.png'], ['feet/boots/basic/male/walk.png', [110, 80, 60]], ['legs/pants/male/walk.png', [120, 96, 70]], ['torso/clothes/longsleeve/longsleeve/male/walk.png', [112, 84, 70]], ['hat/cloth/hood/adult/walk.png', [90, 70, 62]]],
  patrulheira: [[C + 'female/walk.png'], [H + 'female/walk.png'], ['feet/boots/basic/thin/walk.png', [120, 90, 60]], ['legs/pants/thin/walk.png', [150, 130, 100]], ['torso/clothes/tunic/female/walk/forest.png'], ['hair/bangs/adult/walk.png', { cor: [150, 80, 40] }]],
  menino: [[C + 'teen/walk.png'], [H + 'male_small/walk.png'], ['legs/pants/thin/walk.png', [90, 100, 150]], ['torso/clothes/shortsleeve/shortsleeve/teen/walk.png', [240, 90, 80]], ['hair/plain/adult/walk.png', { cor: [70, 50, 40] }]],
  menina: [[C + 'teen/walk.png'], [H + 'female_small/walk.png'], ['legs/pants/thin/walk.png', [120, 90, 140]], ['torso/clothes/longsleeve/longsleeve/teen/walk.png', [250, 210, 90]], ['hair/bangs/adult/walk.png', { cor: [40, 34, 44] }]],
  velho: [[C + 'male/walk.png'], [H + 'male_elderly/walk.png'], ['feet/boots/basic/male/walk.png', [90, 80, 80]], ['legs/pants/male/walk.png', [110, 110, 130]], ['torso/clothes/longsleeve/longsleeve/male/walk.png', [130, 150, 190]], ['hair/plain/adult/walk.png', { cor: [225, 225, 230] }]],
  lenhador: [[C + 'male/walk.png'], [H + 'male/walk.png'], ['feet/boots/basic/male/walk.png', [80, 60, 50]], ['legs/pants/male/walk.png', [70, 80, 110]], ['torso/clothes/longsleeve/longsleeve/male/walk.png', [190, 70, 60]], ['hair/plain/adult/walk.png', { cor: [50, 40, 36] }]],
  soldado: [{ base: 'sprites/people/soldier.png' }], soldadoRubro: [{ base: 'sprites/people/soldier_altcolor.png' }], dama: [{ base: 'sprites/people/princess.png' }]
};

const CREDITOS = `ARTE DO MUNDO DA SAGA (img/saga/atlas.png e img/saga/gente.png)
================================================================
Estes dois arquivos são obra derivada de arte do Liberated Pixel Cup (LPC) e são distribuídos sob
Creative Commons Attribution-ShareAlike 3.0 (CC-BY-SA 3.0): https://creativecommons.org/licenses/by-sa/3.0/
(os originais também estão sob GPL 3.0; os de Lanea Zimmerman e Stephen Challener, também sob OGA-BY 3.0).
Montados por ferramentas/gerar-atlas-saga.mjs. Flores, mato alto, placa de madeira e lápide são desenho nosso.

Tiles e objetos — "LPC Base Assets"
  https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
  Lanea Zimmerman (Sharm): terrenos, árvores, casas, baús, barris, placas, pedras, montanhas, a dama.
  Stephen Challener (Redshrike): moldes de corpo dos personagens.
  Charles Sanchez (CharlesGabriel), Manuel Riecke (MrBeast), Daniel Armstrong (HughSpectrum): soldados e demais
  sprites da base. Lista completa em CREDITS.TXT do pacote.

Gente (corpos, cabeças, roupas, cabelos, capuz, botas) — "Universal LPC Spritesheet Character Generator"
  https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator
  Autores por camada em CREDITS.csv do repositório. Camadas usadas:
__CAMADAS__

Os sprites dos POKÉMON não estão nestes arquivos: vêm da PokéAPI, como no resto do jogo.
`;

async function main() {
  await prepararBase();
  const grade = [], ARTE = {}, BLOBS = {};      // grade: lista de tiles 32×32, na ordem do atlas
  const por = (nome, img) => { ARTE[nome] = grade.length; grade.push(img); };
  for (const [nome, t] of Object.entries(TERRENOS)) {
    BLOBS[nome] = grade.length; grade.push(...blob(t.arq));
    if (t.enche) for (let i = 0; i < 3; i++) por(`${nome}${i}`, tile(t.arq, i, 5));
    if (t.tufos) { por(`${nome}Tufo0`, tile(t.arq, 0, 0)); por(`${nome}Tufo1`, tile(t.arq, 0, 1)); }
  }
  for (const [nome, [arq, c, l]] of Object.entries(SOLTOS)) por(nome, tile(arq, c, l));
  for (const [nome, img] of Object.entries(desenhados())) por(nome, img);

  const linhasGrade = Math.ceil(grade.length / COLS), telas = {}, PROPS = {};
  for (const [nome, e] of Object.entries(ENFEITES)) {
    const tela = nova(...e.tam);
    for (const [arq, x, y, w, h, ox, oy] of e.pecas) colar(tela, base(`tiles/${arq}.png`), x, y, w, h, ox, oy);
    telas[nome] = { img: tela, ancora: e.ancora };
  }
  for (const [nome, [de, cor]] of Object.entries(TINTAS)) telas[nome] = { img: tingir(telas[de].img, cor), ancora: telas[de].ancora };
  // empacota os enfeites em fileiras, abaixo da grade
  let x = 0, y = linhasGrade * T, alturaDaFileira = 0;
  const W = COLS * T;
  for (const [nome, t] of Object.entries(telas)) {
    if (x + t.img.w > W) { x = 0; y += alturaDaFileira; alturaDaFileira = 0; }
    PROPS[nome] = [x, y, t.img.w, t.img.h, ...t.ancora]; t.x = x; t.y = y;
    x += t.img.w; alturaDaFileira = Math.max(alturaDaFileira, t.img.h);
  }
  const atlas = nova(W, y + alturaDaFileira);
  grade.forEach((img, i) => colar(atlas, img, 0, 0, T, T, (i % COLS) * T, ((i / COLS) | 0) * T));
  for (const t of Object.values(telas)) colar(atlas, t.img, 0, 0, t.img.w, t.img.h, t.x, t.y);

  const nomesGente = Object.keys(GENTE), gente = nova(QUADROS.length * Q, nomesGente.length * 4 * Q), camadas = new Set();
  for (const [i, nome] of nomesGente.entries()) {
    const folha = nova(9 * Q, 4 * Q);
    for (const camada of GENTE[nome]) {
      if (camada.base) { colar(folha, base(camada.base), 0, 0, 9 * Q, 4 * Q, 0, 0); continue; }
      const [rel, tinta] = camada; camadas.add(rel);
      let img = await ulpc(rel);
      if (tinta) img = tinta.cor ? colorir(img, tinta.cor) : tingir(img, tinta);
      colar(folha, img, 0, 0, 9 * Q, 4 * Q, 0, 0);
    }
    // as folhas do LPC vêm em cima/esquerda/baixo/direita; o jogo usa n/o/s/l, que é a mesma ordem
    for (let d = 0; d < 4; d++) QUADROS.forEach((q, k) => colar(gente, folha, q * Q, d * Q, Q, Q, k * Q, (i * 4 + d) * Q));
  }

  fs.mkdirSync(path.join(RAIZ, 'img', 'saga'), { recursive: true });
  fs.writeFileSync(path.join(RAIZ, 'img', 'saga', 'atlas.png'), gravarPng(atlas));
  fs.writeFileSync(path.join(RAIZ, 'img', 'saga', 'gente.png'), gravarPng(gente));
  fs.writeFileSync(path.join(RAIZ, 'img', 'saga', 'CREDITOS.txt'), CREDITOS.replace('__CAMADAS__', [...camadas].sort().map(c => `    spritesheets/${c}`).join('\n')));
  const js = `/* GERADO por ferramentas/gerar-atlas-saga.mjs — NÃO editar à mão (figura nova = uma linha lá e rodar de novo).
   Onde cada figura do mundo da ⚔ Saga está dentro de img/saga/atlas.png e img/saga/gente.png. Arte aberta do
   Liberated Pixel Cup; crédito e licença em img/saga/CREDITOS.txt. */
export const ATLAS = ${JSON.stringify({ arquivo: 'img/saga/atlas.png', w: atlas.w, h: atlas.h, tam: T, cols: COLS })};
// figura solta → índice na grade do atlas (coluna = i % cols, linha = i / cols)
export const ARTE = ${JSON.stringify(ARTE)};
// terreno de borda automática → índice da PRIMEIRA das 47 figuras (ordem de saga-arte.MASCARAS_BLOB)
export const BLOBS = ${JSON.stringify(BLOBS)};
// enfeite grande → [x, y, largura, altura, dx, dy]: o retângulo no atlas e onde o canto dele fica em relação à casa
export const PROPS = ${JSON.stringify(PROPS)};
// gente: cada pessoa ocupa 4 linhas (n, o, s, l) de ${QUADROS.length} quadros (parado + 4 de caminhada) de ${Q} px
export const GENTE = ${JSON.stringify({ arquivo: 'img/saga/gente.png', quadro: Q, quadros: QUADROS.length, nomes: nomesGente })};
`;
  fs.writeFileSync(path.join(RAIZ, 'js', 'dados-saga-arte.js'), js);
  console.log(`atlas ${atlas.w}×${atlas.h} (${grade.length} tiles, ${Object.keys(PROPS).length} enfeites) · gente ${gente.w}×${gente.h} (${nomesGente.length})`);
}
main().catch(e => { console.error(e); process.exit(1); });
