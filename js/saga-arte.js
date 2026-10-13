/* ============ ⚔ Saga — qual DESENHO cada casa do mapa usa (puro, testado, SEM imports) ============
   O mapa guarda o TERRENO de cada casa ("isto é caminho", "isto é água"), não a figura. Quem escolhe a figura é
   este arquivo, olhando os vizinhos — é o que deixa pintar "caminho" no editor e as bordas aparecerem sozinhas,
   e o que mantém o mapa legível como texto. As figuras moram num atlas só (`img/saga/atlas.png`, montado por
   `ferramentas/gerar-atlas-saga.mjs` a partir de arte aberta), e as tabelas chegam por parâmetro: assim o
   gerador importa daqui a ordem das bordas sem depender do arquivo que ele mesmo vai gerar.

   Um tile (`dados-saga.TILES`) descreve o desenho com três campos, todos opcionais:
     fundo   preenchimento OPACO embaixo de tudo. Sem ele, vale o do chão padrão do mapa (`mapa.chao`) — é por
             isso que a mesma árvore fica na grama num mapa e na pedra noutro.
     arte    camadas por cima do fundo, de baixo pra cima. Cada uma: 'nome' · ['a','a','b'] (variação por posição;
             repetir é dar peso) · { blob: 'terra', grupo? } (borda automática pelos 8 vizinhos).
     prop    enfeite GRANDE com o pé nesta casa (árvore, casa): não é pintado no chão, vira sprite e passa na
             frente ou atrás de quem anda. Aceita lista, pra variar.
   Tema do mapa (`mapa.tema` → `TEMAS`) e ajuste do próprio mapa (`mapa.pele`) trocam esses campos por tile: é o
   jeito de ter várias opções de figura pra mesma coisa sem inventar um tile novo. */

/* Os 8 vizinhos, em bits. A diagonal só conta quando os dois lados vizinhos dela também contam — sem isso
   seriam 256 figuras; com isso, 47 (o "blob" clássico). */
export const VIZINHOS = [[0, -1, 1], [1, -1, 2], [1, 0, 4], [1, 1, 8], [0, 1, 16], [-1, 1, 32], [-1, 0, 64], [-1, -1, 128]];
export const N = 1, NE = 2, L = 4, SE = 8, S = 16, SO = 32, O = 64, NO = 128;
export function reduzir(m) {
  let r = m & (N | L | S | O);
  if ((m & NE) && (m & N) && (m & L)) r |= NE;
  if ((m & SE) && (m & L) && (m & S)) r |= SE;
  if ((m & SO) && (m & S) && (m & O)) r |= SO;
  if ((m & NO) && (m & O) && (m & N)) r |= NO;
  return r;
}
// As 47 máscaras que sobram, em ordem crescente: é a ORDEM em que o gerador grava as figuras de cada blob no atlas.
export const MASCARAS_BLOB = [...new Set(Array.from({ length: 256 }, (_, m) => reduzir(m)))].sort((a, b) => a - b);
export const INDICE_BLOB = Uint8Array.from({ length: 256 }, (_, m) => MASCARAS_BLOB.indexOf(reduzir(m)));

// Sorteio que não muda entre um desenho e outro: a mesma casa escolhe sempre a mesma variação.
export const sorteDaCasa = (x, y) => (Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0;
const variar = (v, x, y) => Array.isArray(v) ? v[sorteDaCasa(x, y) % v.length] : v;

// O caractere do TILE de uma casa: o próprio, ou — se ali há um objeto — o que ele imita (`como`) ou o chão do mapa.
export function tileDaCasa(mapa, x, y, TILES) {
  const ch = mapa.grade[y]?.[x];
  if (ch === undefined) return null;
  if (TILES[ch]) return ch;
  const como = [].concat(mapa.objs?.[ch] || []).find(o => o.como)?.como;
  return TILES[como] ? como : mapa.chao;
}
// O tile já com o tema e o ajuste do mapa por cima (só mexem no desenho; a regra — bloqueia, mato — é do tile).
export function defDoTile(mapa, ch, { TILES, TEMAS }) {
  const tema = TEMAS?.[mapa.tema]?.tiles?.[ch], pele = mapa.pele?.[ch];
  return tema || pele ? { ...TILES[ch], ...tema, ...pele } : TILES[ch];
}
const familia = c => c?.blob ? (c.grupo || c.blob) : null;
/* Bits dos vizinhos que se EMENDAM com esta camada: os que têm alguma camada da mesma família. Fora do mapa
   conta como igual (senão toda borda de mapa ganharia margem de rio e beira de caminho). */
function iguais(mapa, x, y, fam, tab) {
  let m = 0;
  for (const [dx, dy, bit] of VIZINHOS) {
    const v = tileDaCasa(mapa, x + dx, y + dy, tab.TILES);
    if (v === null || (defDoTile(mapa, v, tab).arte || []).some(c => familia(c) === fam)) m |= bit;
  }
  return m;
}
function figura(c, mapa, x, y, tab) {
  if (c == null) return null;
  if (typeof c === 'string' || Array.isArray(c)) return tab.ARTE[variar(c, x, y)] ?? null;
  if (c.blob) return tab.BLOBS[c.blob] === undefined ? null : tab.BLOBS[c.blob] + INDICE_BLOB[iguais(mapa, x, y, familia(c), tab)];
  return null;
}
// Só o enfeite grande da casa (é o que a camada de sprites precisa, sem calcular as bordas do chão).
export function propDaCasa(mapa, x, y, tab) {
  const ch = tileDaCasa(mapa, x, y, tab.TILES);
  return ch === null ? null : variar(defDoTile(mapa, ch, tab).prop, x, y) || null;
}
/* O desenho de uma casa: { cor, fundo, camadas, prop }. `fundo` e `camadas` são ÍNDICES do atlas (null/[] =
   nada); `prop` é o nome do enfeite grande; `cor` é a de reserva, pra quando o atlas não carregou. */
export function desenhoDaCasa(mapa, x, y, tab) {
  const ch = tileDaCasa(mapa, x, y, tab.TILES);
  if (ch === null) return null;
  const t = defDoTile(mapa, ch, tab), base = defDoTile(mapa, mapa.chao, tab);
  return {
    cor: t.c || base.c || '#222',
    fundo: figura(t.fundo ?? base.fundo, mapa, x, y, tab),
    camadas: (t.arte || []).map(c => figura(c, mapa, x, y, tab)).filter(i => i !== null),
    prop: variar(t.prop, x, y) || null
  };
}
