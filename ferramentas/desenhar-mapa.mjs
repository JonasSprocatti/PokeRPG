/* Desenha um mapa da ⚔ Saga num PNG, com a MESMA escolha de figura que o jogo faz (`saga-arte.desenhoDaCasa`).
   Existe porque o Raspberry Pi não tem navegador: é o jeito de OLHAR um mapa escrito em texto antes de publicar.
   Personagem Pokémon vira uma bolinha colorida (o sprite dele vem da PokéAPI, não mora no repositório); gente,
   baú, placa e enfeite saem com a figura de verdade.
     node ferramentas/desenhar-mapa.mjs aldeia saida.png [escala]      um mapa
     node ferramentas/desenhar-mapa.mjs --todos pasta/ [escala]        todos, um arquivo por mapa */
import fs from 'node:fs';
import path from 'node:path';
import { lerPng, gravarPng, nova, colar, ampliar } from './png.mjs';
import { MAPAS_SAGA, TILES, TEMAS, NPCS } from '../js/dados-saga.js';
import { ATLAS, ARTE, BLOBS, PROPS, GENTE } from '../js/dados-saga-arte.js';
import { desenhoDaCasa } from '../js/saga-arte.js';

const RAIZ = path.resolve(import.meta.dirname, '..'), T = ATLAS.tam, tab = { TILES, TEMAS, ARTE, BLOBS };
const atlas = lerPng(fs.readFileSync(path.join(RAIZ, ATLAS.arquivo))), gente = lerPng(fs.readFileSync(path.join(RAIZ, GENTE.arquivo)));
const peca = (out, i, x, y) => colar(out, atlas, (i % ATLAS.cols) * T, ((i / ATLAS.cols) | 0) * T, T, T, x * T, y * T);
const prop = (out, nome, x, y) => { const p = PROPS[nome]; if (p) colar(out, atlas, p[0], p[1], p[2], p[3], x * T + p[4], y * T + p[5]); };
function bolinha(out, x, y, cor) {
  for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) if (i * i + j * j <= 81) {
    const X = x * T + 16 + i, Y = y * T + 14 + j;
    if (X >= 0 && Y >= 0 && X < out.w && Y < out.h) out.px.set(i * i + j * j > 49 ? [20, 20, 30, 255] : cor, (Y * out.w + X) * 4);
  }
}
export function desenharMapa(id) {
  const mapa = MAPAS_SAGA[id], W = mapa.grade[0].length, H = mapa.grade.length, out = nova(W * T, H * T, [20, 20, 30, 255]);
  const depois = [];   // o que tem altura (enfeite, gente) é desenhado depois do chão, de cima pra baixo
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = desenhoDaCasa(mapa, x, y, tab);
    for (const i of [d.fundo, ...d.camadas]) if (i !== null) peca(out, i, x, y);
    if (d.prop) depois.push([y, () => prop(out, d.prop, x, y)]);
    const o = [].concat(mapa.objs?.[mapa.grade[y][x]] || [])[0];
    if (!o) continue;
    if (o.prop) depois.push([y, () => prop(out, o.prop, x, y)]);
    const figura = o.arte || (o.bau ? 'bau' : o.placa ? 'placa' : null);
    if (figura && ARTE[figura] !== undefined) depois.push([y, () => peca(out, ARTE[figura], x, y)]);
    const quem = o.npc ? NPCS[o.npc]?.sprite : o.inimigo ? (o.inimigo.sprite || (o.inimigo.tipo === 'treinador' ? 'cacador' : 0)) : null;
    if (typeof quem === 'string') depois.push([y, () => colar(out, gente, 0, (GENTE.nomes.indexOf(quem) * 4 + 2) * 64, 64, 64, x * T - 16, y * T - 34)]);
    else if (quem !== null) depois.push([y, () => bolinha(out, x, y, o.inimigo ? [220, 60, 60, 255] : [250, 210, 70, 255])]);
    else if (o.porta && !o.prop) depois.push([y, () => bolinha(out, x, y, [90, 170, 250, 255])]);
    else if (o.chegada) depois.push([y, () => bolinha(out, x, y, [250, 250, 250, 255])]);
  }
  depois.sort((a, b) => a[0] - b[0]).forEach(([, f]) => f());
  return out;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const [a, b, k = 1] = process.argv.slice(2);
  const gravar = (id, arq) => { fs.writeFileSync(arq, gravarPng(ampliar(desenharMapa(id), +k))); console.log(arq); };
  if (a === '--todos') { fs.mkdirSync(b, { recursive: true }); for (const id of Object.keys(MAPAS_SAGA)) gravar(id, path.join(b, `${id}.png`)); }
  else if (MAPAS_SAGA[a]) gravar(a, b);
  else { console.error(`mapa "${a}" não existe. Mapas: ${Object.keys(MAPAS_SAGA).join(', ')}`); process.exit(1); }
}
