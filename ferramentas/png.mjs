/* PNG mínimo, sem dependência (o projeto não tem nenhuma, e o Raspberry Pi não tem PIL).
   Lê: 8 ou 16 bits por canal, paleta de 1/2/4/8 bits (com tRNS), RGB, RGBA, cinza — NÃO entrelaçado.
   Grava: sempre RGBA de 8 bits. É o bastante pra recortar tiles de um tileset e montar o atlas do jogo
   (`gerar-atlas-saga.mjs`) e pra desenhar um mapa em arquivo e olhar o resultado sem navegador. */
import zlib from 'node:zlib';

const ASSINATURA = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function lerPng(buf) {
  if (!buf.subarray(0, 8).equals(ASSINATURA)) throw new Error('não é um PNG');
  let p = 8, ihdr, plte, trns;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), tipo = buf.toString('latin1', p + 4, p + 8), dados = buf.subarray(p + 8, p + 8 + len);
    if (tipo === 'IHDR') ihdr = dados; else if (tipo === 'PLTE') plte = dados; else if (tipo === 'tRNS') trns = dados;
    else if (tipo === 'IDAT') idat.push(dados); else if (tipo === 'IEND') break;
    p += 12 + len;
  }
  const w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4), bits = ihdr[8], cor = ihdr[9];
  if (ihdr[12]) throw new Error('PNG entrelaçado não é suportado');
  const canais = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[cor];
  if (!canais) throw new Error(`tipo de cor ${cor} desconhecido`);
  const bitsPorPixel = canais * bits, bpp = Math.max(1, bitsPorPixel >> 3), linha = Math.ceil(w * bitsPorPixel / 8);
  const cru = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(w * h * 4), ant = Buffer.alloc(linha), atual = Buffer.alloc(linha);
  let o = 0;
  for (let y = 0; y < h; y++) {
    const f = cru[o++];
    for (let i = 0; i < linha; i++) {
      const x = cru[o++], a = i >= bpp ? atual[i - bpp] : 0, b = ant[i], c = i >= bpp ? ant[i - bpp] : 0;
      let v = x;
      if (f === 1) v = x + a; else if (f === 2) v = x + b; else if (f === 3) v = x + ((a + b) >> 1);
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      atual[i] = v & 255;
    }
    // a amostra `i` do pixel `x`, sempre reduzida a 8 bits
    const amostra = (x, i) => {
      if (bits === 8) return atual[x * canais + i];
      if (bits === 16) return atual[(x * canais + i) * 2];
      const bit = x * bits; return (atual[bit >> 3] >> (8 - bits - (bit & 7))) & ((1 << bits) - 1);
    };
    for (let x = 0; x < w; x++) {
      const d = (y * w + x) * 4;
      if (cor === 3) { const k = amostra(x, 0); px[d] = plte[k * 3]; px[d + 1] = plte[k * 3 + 1]; px[d + 2] = plte[k * 3 + 2]; px[d + 3] = trns && k < trns.length ? trns[k] : 255; }
      else if (cor === 0 || cor === 4) {
        let g = amostra(x, 0); if (bits < 8) g = Math.round(g * 255 / ((1 << bits) - 1));
        px[d] = px[d + 1] = px[d + 2] = g; px[d + 3] = cor === 4 ? amostra(x, 1) : 255;
      } else {
        px[d] = amostra(x, 0); px[d + 1] = amostra(x, 1); px[d + 2] = amostra(x, 2); px[d + 3] = cor === 6 ? amostra(x, 3) : 255;
        // RGB com cor-chave de transparência (tRNS de 6 bytes)
        if (cor === 2 && trns?.length >= 6 && px[d] === trns[1] && px[d + 1] === trns[3] && px[d + 2] === trns[5]) px[d + 3] = 0;
      }
    }
    atual.copy(ant);
  }
  return { w, h, px };
}

const TAB_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc = b => { let c = 0xFFFFFFFF; for (const x of b) c = TAB_CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function bloco(tipo, dados) {
  const b = Buffer.alloc(12 + dados.length);
  b.writeUInt32BE(dados.length, 0); b.write(tipo, 4, 'latin1'); dados.copy(b, 8);
  b.writeUInt32BE(crc(b.subarray(4, 8 + dados.length)), 8 + dados.length);
  return b;
}
export function gravarPng({ w, h, px }) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const cru = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) px.copy(cru, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([ASSINATURA, bloco('IHDR', ihdr), bloco('IDAT', zlib.deflateSync(cru, { level: 9 })), bloco('IEND', Buffer.alloc(0))]);
}

/* ---- o pouco de "editor de imagem" que o atlas precisa ---- */
export function nova(w, h, cor = [0, 0, 0, 0]) {
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) px.set(cor, i * 4);
  return { w, h, px };
}
/* Copia um retângulo de `src` pra `dst`. Pixel transparente da origem não apaga o destino (é "por cima"), e
   alfa parcial mistura — é o que deixa empilhar um enfeite sobre a grama. Fora dos limites é ignorado. */
export function colar(dst, src, sx, sy, w, h, dx, dy) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = sx + x, Y = sy + y, DX = dx + x, DY = dy + y;
    if (X < 0 || Y < 0 || X >= src.w || Y >= src.h || DX < 0 || DY < 0 || DX >= dst.w || DY >= dst.h) continue;
    const s = (Y * src.w + X) * 4, d = (DY * dst.w + DX) * 4, a = src.px[s + 3];
    if (!a) continue;
    if (a === 255 || !dst.px[d + 3]) { src.px.copy(dst.px, d, s, s + 4); continue; }
    for (let k = 0; k < 3; k++) dst.px[d + k] = Math.round((src.px[s + k] * a + dst.px[d + k] * (255 - a)) / 255);
    dst.px[d + 3] = Math.max(dst.px[d + 3], a);
  }
  return dst;
}
// Amplia por um fator inteiro, sem suavizar (pixel art).
export function ampliar(img, k) {
  const out = nova(img.w * k, img.h * k);
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++)
    img.px.copy(out.px, (y * out.w + x) * 4, (((y / k) | 0) * img.w + ((x / k) | 0)) * 4, (((y / k) | 0) * img.w + ((x / k) | 0)) * 4 + 4);
  return out;
}
export const recortar = (img, x, y, w, h) => colar(nova(w, h), img, x, y, w, h, 0, 0);
