/* ============ 🌍 Editor de mundo — as OPERAÇÕES (puro, testado) ============
   Tudo o que o editor faz com o mundo da ⚔ Saga, sem tela: pintar, encher, redimensionar, pôr e mover objeto,
   ligar portas, criar mapa/personagem/missão, e gerar o arquivo pra colar no repositório. A tela
   (`tela-editor-saga.js`) só traduz toque em chamada daqui.

   O RASCUNHO é o mundo inteiro, no mesmo formato do pacote publicado:
     { MAPAS, NPCS, MISSOES, ITENS, DONS, FACCOES, CAPITULOS, INICIO }
   TILES e TEMAS ficam de fora de propósito: são regra e arte (código + atlas) — o editor ESCOLHE entre eles,
   não os cria. As funções MUTAM o rascunho que recebem (quem guarda no navegador e quem desfaz é a tela).

   O mapa continua sendo a grade de TEXTO de `dados-saga.js` (um caractere por casa; objeto = uma chave que o
   mapa dá sentido em `objs`). Por isso pôr um objeto é "achar uma letra livre", e pintar embaixo de um objeto é
   mudar o que ele imita (`como`). */
import { TILES } from './dados-saga.js';
import { SAGA_DE_FABRICA, sagaAoVivo } from './conteudo.js';
import { store } from './util.js';

export const RASCUNHO_SAGA_KEY = 'pokerpg-rascunho-saga-v1';
export const LADO_MINIMO = 5;
const ID_BOM = /^[a-z][a-z0-9-]{0,30}$/;
export const idValido = id => typeof id === 'string' && ID_BOM.test(id);

/* ---- o rascunho no navegador, e o que vai no pacote ---- */
export const rascunhoSaga = () => store.get(RASCUNHO_SAGA_KEY);
export const guardarRascunhoSaga = R => store.set(RASCUNHO_SAGA_KEY, R);
export const limparRascunhoSaga = () => store.del(RASCUNHO_SAGA_KEY);
/* O pacote publicado é UM e sai COMPLETO: quem publica por outra tela (rotas, música) não pode apagar o mundo
   que já está no ar. Então: havendo rascunho, vai o rascunho; não havendo, vai o que está valendo AGORA — e só
   quando isso é igual ao de fábrica a chave fica de fora (ausente = fábrica). */
export function sagaParaPublicar() {
  const r = rascunhoSaga();
  if (r) return r;
  const aoVivo = sagaAoVivo();
  return JSON.stringify(aoVivo) === JSON.stringify(SAGA_DE_FABRICA) ? null : aoVivo;
}

/* ---- mexer num valor pelo caminho (['NPCS', 'anciao', 'nos', 'inicio', 'fala']) ----
   É o que deixa a tela inteira ter UM tratador de campo: cada <input> carrega o caminho do que ele edita. */
export const ler = (R, caminho) => caminho.reduce((o, k) => (o == null ? undefined : o[k]), R);
export function definir(R, caminho, valor) {
  const pai = ler(R, caminho.slice(0, -1)), k = caminho.at(-1);
  if (pai == null || typeof pai !== 'object') return false;
  if (valor === undefined) { if (Array.isArray(pai)) pai.splice(Number(k), 1); else delete pai[k]; }
  else pai[k] = valor;
  return true;
}
export const apagar = (R, caminho) => definir(R, caminho, undefined);
export function inserir(R, caminho, valor, indice) {
  const l = ler(R, caminho);
  if (!Array.isArray(l)) return false;
  l.splice(indice ?? l.length, 0, valor);
  return true;
}
export function moverNaLista(R, caminho, de, para) {
  const l = ler(R, caminho);
  if (!Array.isArray(l) || de < 0 || de >= l.length || para < 0 || para >= l.length) return false;
  l.splice(para, 0, l.splice(de, 1)[0]);
  return true;
}
// Um id que ainda não existe na tabela: `base`, `base-2`, `base-3`…
export function idLivre(tabela, base) {
  const tem = id => (Array.isArray(tabela) ? tabela.some(x => x.id === id) : id in tabela);
  if (!tem(base)) return base;
  for (let n = 2; ; n++) if (!tem(`${base}-${n}`)) return `${base}-${n}`;
}

/* ---- chaves de objeto ----
   Letra maiúscula e número primeiro (é o que se lê bem num mapa de texto); acabando, grego minúsculo. Tudo o
   que já é tile fica de fora (o `T` da árvore). */
export const CHAVES_DE_OBJETO = [...'ABCDEFGHIJKLMNOPQRSUVWXYZ0123456789@αβγδεζηθικλμνξπρστυφχψω'].filter(c => !TILES[c]);
export const chaveLivre = mapa => CHAVES_DE_OBJETO.find(c => !mapa.objs?.[c]) ?? null;
export const variantes = o => [].concat(o ?? []);

/* ---- mapas ---- */
const trocar = (linha, x, ch) => linha.slice(0, x) + ch + linha.slice(x + 1);
const dentro = (m, x, y) => y >= 0 && y < m.grade.length && x >= 0 && x < m.grade[0].length;
export const objetoNaCasa = (mapa, x, y) => { const ch = mapa.grade[y]?.[x]; return ch !== undefined && mapa.objs?.[ch] ? ch : null; };
// O tile de uma casa, olhando por baixo do objeto (o que ele imita, ou o chão do mapa).
export function tileNaCasa(mapa, x, y) {
  const ch = mapa.grade[y]?.[x];
  if (ch === undefined) return null;
  if (TILES[ch]) return ch;
  const como = variantes(mapa.objs?.[ch]).find(o => o.como)?.como;
  return TILES[como] ? como : mapa.chao;
}
// Mapa novo: chão por dentro e uma cerca em volta (árvore em mapa de grama, breu em mapa de caverna).
export function novoMapa(R, id, { nome = 'Mapa novo', desc = '', cap, rota = 0, chao = '.', largura = 20, altura = 14, borda } = {}) {
  if (!idValido(id) || R.MAPAS[id] || !TILES[chao] || TILES[chao].bloqueia) return null;
  const W = Math.max(LADO_MINIMO, largura | 0), H = Math.max(LADO_MINIMO, altura | 0), b = TILES[borda]?.bloqueia ? borda : chao === '.' ? 'T' : '#';
  const grade = Array.from({ length: H }, (_, y) => y === 0 || y === H - 1 ? b.repeat(W) : b + chao.repeat(W - 2) + b);
  R.MAPAS[id] = { ...(cap ? { cap } : {}), nome, desc, rota, chao, grade, objs: {} };
  return R.MAPAS[id];
}
export function excluirMapa(R, id) {
  if (!R.MAPAS[id] || Object.keys(R.MAPAS).length <= 1 || R.INICIO.mapa === id) return false;
  delete R.MAPAS[id];
  return true;
}
// Cresce (n > 0) ou encolhe (n < 0) uma casa num dos lados. Crescer copia a beirada; encolher leva junto os objetos de lá.
export function redimensionar(R, idMapa, lado, n) {
  const m = R.MAPAS[idMapa];
  if (!m || !['cima', 'baixo', 'esq', 'dir'].includes(lado) || !n) return false;
  const vertical = lado === 'cima' || lado === 'baixo', H = m.grade.length, W = m.grade[0].length;
  if (n < 0 && (vertical ? H : W) <= LADO_MINIMO) return false;
  const semObjeto = l => [...l].map(ch => (m.objs?.[ch] ? m.chao : ch)).join('');
  const some = chs => { for (const ch of chs) if (m.objs?.[ch]) delete m.objs[ch]; };
  if (vertical) {
    const i = lado === 'cima' ? 0 : H - 1;
    if (n > 0) m.grade.splice(lado === 'cima' ? 0 : H, 0, semObjeto(m.grade[i]));
    else some(m.grade.splice(i, 1)[0]);
  } else {
    const i = lado === 'esq' ? 0 : W - 1;
    if (n < 0) some(m.grade.map(l => l[i]));
    m.grade = m.grade.map(l => {
      const beira = m.objs?.[l[i]] ? m.chao : l[i];
      return n > 0 ? (lado === 'esq' ? beira + l : l + beira) : (lado === 'esq' ? l.slice(1) : l.slice(0, -1));
    });
  }
  return true;
}
// Pinta uma casa. Em cima de um objeto, pinta POR BAIXO dele (o objeto continua lá, imitando o tile novo).
export function pintar(R, idMapa, x, y, ch) {
  const m = R.MAPAS[idMapa];
  if (!m || !TILES[ch] || !dentro(m, x, y)) return false;
  const agora = m.grade[y][x];
  if (m.objs?.[agora]) {
    const vs = variantes(m.objs[agora]);
    if (vs.every(o => (o.como ?? m.chao) === ch)) return false;
    for (const o of vs) { if (ch === m.chao) delete o.como; else o.como = ch; }
    return true;
  }
  if (agora === ch) return false;
  m.grade[y] = trocar(m.grade[y], x, ch);
  return true;
}
export function retangulo(R, idMapa, x0, y0, x1, y1, ch) {
  let mudou = false;
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) mudou = pintar(R, idMapa, x, y, ch) || mudou;
  return mudou;
}
// Balde: troca a mancha de casas vizinhas do MESMO tile. Objeto é margem (não é pintado nem atravessado).
export function balde(R, idMapa, x, y, ch) {
  const m = R.MAPAS[idMapa];
  if (!m || !TILES[ch] || !dentro(m, x, y)) return false;
  const de = m.grade[y][x];
  if (de === ch || !TILES[de]) return false;
  const fila = [[x, y]];
  while (fila.length) {
    const [cx, cy] = fila.pop();
    if (!dentro(m, cx, cy) || m.grade[cy][cx] !== de) continue;
    m.grade[cy] = trocar(m.grade[cy], cx, ch);
    fila.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return true;
}
/* Põe um objeto numa casa livre e devolve a chave dele. O chão em que ele pisa continua aparecendo: se era
   caminho ou mato (um tile por onde se anda, diferente do chão do mapa), o objeto passa a imitá-lo. */
export function porObjeto(R, idMapa, x, y, obj) {
  const m = R.MAPAS[idMapa];
  if (!m || !dentro(m, x, y) || objetoNaCasa(m, x, y)) return null;
  const ch = chaveLivre(m), embaixo = m.grade[y][x];
  if (!ch) return null;
  const o = JSON.parse(JSON.stringify(obj));
  if (o.como === undefined && embaixo !== m.chao && !TILES[embaixo].bloqueia) o.como = embaixo;
  (m.objs ||= {})[ch] = o;
  m.grade[y] = trocar(m.grade[y], x, ch);
  return ch;
}
export function ondeEsta(mapa, ch) {
  for (let y = 0; y < mapa.grade.length; y++) { const x = mapa.grade[y].indexOf(ch); if (x >= 0) return [x, y]; }
  return null;
}
export function tirarObjeto(R, idMapa, ch) {
  const m = R.MAPAS[idMapa], onde = m?.objs?.[ch] && ondeEsta(m, ch);
  if (!m?.objs?.[ch]) return false;
  if (onde) m.grade[onde[1]] = trocar(m.grade[onde[1]], onde[0], tileNaCasa(m, ...onde));
  delete m.objs[ch];
  return true;
}
export function moverObjeto(R, idMapa, ch, x, y) {
  const m = R.MAPAS[idMapa], de = m?.objs?.[ch] && ondeEsta(m, ch);
  if (!de || !dentro(m, x, y) || objetoNaCasa(m, x, y)) return false;
  const embaixoNovo = m.grade[y][x], embaixoVelho = tileNaCasa(m, ...de);
  m.grade[de[1]] = trocar(m.grade[de[1]], de[0], embaixoVelho);
  for (const o of variantes(m.objs[ch])) { if (embaixoNovo !== m.chao && !TILES[embaixoNovo].bloqueia) o.como = embaixoNovo; else delete o.como; }
  m.grade[y] = trocar(m.grade[y], x, ch);
  return true;
}
/* Carimbo de casa: a porta é o tile `c` (o enfeite "casa" tem o pé nela) e as oito casas em volta viram `h`
   (ocupado) — é o que impede de andar por dentro da parede. Só carimba se couber e não houver objeto no caminho. */
export function carimbarCasa(R, idMapa, x, y) {
  const m = R.MAPAS[idMapa];
  if (!m) return false;
  for (let j = y - 2; j <= y; j++) for (let i = x - 1; i <= x + 1; i++) if (!dentro(m, i, j) || objetoNaCasa(m, i, j)) return false;
  for (let j = y - 2; j <= y; j++) for (let i = x - 1; i <= x + 1; i++) m.grade[j] = trocar(m.grade[j], i, i === x && j === y ? 'c' : 'h');
  return true;
}
/* Liga duas portas de uma vez: a que já existe (`deMapa`/`deCh`) passa a levar pra uma porta NOVA criada na casa
   escolhida do mapa de destino, e a nova volta pra ela. É o "toque onde esta porta deve chegar" do editor. */
export function ligarPortas(R, deMapa, deCh, paraMapa, x, y) {
  const origem = variantes(R.MAPAS[deMapa]?.objs?.[deCh]).find(o => o.porta);
  if (!origem) return null;
  const ch = porObjeto(R, paraMapa, x, y, { porta: [deMapa, deCh] });
  if (ch) origem.porta = [paraMapa, ch];
  return ch;
}

/* ---- o que nasce quando se cria uma coisa ---- */
export const MODELOS_DE_OBJETO = {
  npc: R => ({ npc: Object.keys(R.NPCS)[0] }),
  porta: (R, idMapa) => ({ porta: [idMapa, ''] }),
  placa: () => ({ placa: 'Escreva aqui o que a placa diz.' }),
  enfeite: () => ({ enfeite: true, arte: 'rocha' }),
  bau: (R, idMapa) => ({ bau: idLivre(Object.fromEntries(Object.values(R.MAPAS).flatMap(m => Object.values(m.objs || {}).flatMap(variantes)).filter(o => o.bau).map(o => [o.bau, 1])), `${idMapa}-bau`), texto: 'Um baú.', faz: { dinheiro: 100 } }),
  inimigo: (R, idMapa) => ({ inimigo: { id: idLivre(Object.fromEntries(Object.values(R.MAPAS).flatMap(m => Object.values(m.objs || {}).flatMap(variantes)).filter(o => o.inimigo).map(o => [o.inimigo.id, 1])), `${idMapa}-bando`), tipo: 'bando' } }),
  gatilho: (R, idMapa) => ({ gatilho: `${idMapa}-aviso`, texto: 'Algo acontece quando você pisa aqui.' }),
  chegada: () => ({ chegada: true })
};
export function novoNpc(R, id, nome = 'Personagem novo') {
  if (!idValido(id) || R.NPCS[id]) return null;
  R.NPCS[id] = { nome, sprite: 132, falas: [{ no: 'oi' }], nos: { oi: { fala: 'Olá.' } } };
  return R.NPCS[id];
}
export function novaMissao(R, id) {
  if (!idValido(id) || R.MISSOES[id]) return null;
  R.MISSOES[id] = { nome: 'Missão nova', etapas: ['O que fazer primeiro.'] };
  return R.MISSOES[id];
}
// Tirar um personagem leva junto as casas em que ele estava (senão ficaria um objeto apontando pra ninguém).
export function excluirNpc(R, id) {
  if (!R.NPCS[id]) return false;
  delete R.NPCS[id];
  for (const [idMapa, m] of Object.entries(R.MAPAS)) for (const [ch, o] of Object.entries(m.objs || {})) {
    const fica = variantes(o).filter(v => v.npc !== id);
    if (!fica.length) tirarObjeto(R, idMapa, ch);
    else if (fica.length !== variantes(o).length) m.objs[ch] = fica.length === 1 ? fica[0] : fica;
  }
  return true;
}

/* ---- gerar o arquivo de fábrica (`js/dados-saga-mundo.js`) ----
   O que o ⬇ Gerar arquivo do editor mostra pra colar no repositório. A grade sai uma linha por linha do mapa, em
   aspas simples (o mato alto é `"`, e escapá-lo deixaria o mapa ilegível); o resto sai como JSON, que é JS válido. */
const linhaDeMapa = l => `'${l.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function textoDoMapa(id, m) {
  const { grade, ...resto } = m, campos = Object.entries(resto).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  return `  ${JSON.stringify(id)}: {\n${campos.join(',\n')},\n    "grade": [\n${grade.map(l => `      ${linhaDeMapa(l)}`).join(',\n')}\n    ]\n  }`;
}
export function gerarArquivoSaga(R) {
  const tabela = (nome, v) => `export const ${nome} = ${JSON.stringify(v, null, 2)};\n`;
  return `/* ============ ⚔ Saga — o CONTEÚDO do mundo ============
   GERADO pelo 🌍 Editor de mundo (⬇ Gerar arquivo). Dado puro, SEM imports: capítulos, mapas, personagens, missões,
   itens-chave, dons e facções. Dá pra editar à mão — o formato está no cabeçalho de \`dados-saga.js\` —, mas o
   caminho normal é o editor. Quem importa, importa de \`dados-saga.js\`, que reexporta tudo daqui. */

${tabela('FACCOES', R.FACCOES)}
${tabela('CAPITULOS', R.CAPITULOS)}
${tabela('ITENS_SAGA', R.ITENS)}
${tabela('DONS', R.DONS)}
${tabela('MISSOES_SAGA', R.MISSOES)}
${tabela('INICIO', R.INICIO)}
export const MAPAS_SAGA = {
${Object.entries(R.MAPAS).map(([id, m]) => textoDoMapa(id, m)).join(',\n')}
};

${tabela('NPCS', R.NPCS)}`;
}
