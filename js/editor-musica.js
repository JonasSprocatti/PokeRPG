/* ============ 🎵 editor de músicas: o rascunho e o bloco (puro) ============
   A tela é js/tela-editor-musica.js; aqui mora o que dá pra conferir sem navegador: o rascunho, o merge com o que
   está tocando hoje e o texto pra colar em `js/dados-musica.js`.

   Mesmo desenho do editor de rotas (js/editor-rotas.js): o rascunho fica no `localStorage` deste navegador, o
   📤 Publicar manda pela nuvem (vale sem deploy) e o 📋 Copiar continua existindo pro repositório — é ele que faz
   uma instalação nova nascer com a versão certa.

   O FORMATO é o do pacote: `escala` por NOME (o motor toca o array), `onda` ausente = herda do contexto,
   `melodiaFixa` ausente = o contexto não tem frase própria. Quem valida é `conteudo.validarMusica`. */
import { store } from './util.js';
import { TEMAS, CONTEXTOS, nomeDaEscala } from './dados-musica.js';

export const CHAVE_MUSICA = 'pokerpg-editor-musica-v1';
// o rascunho guarda só a DIFERENÇA: { temas: { bioma: {...} }, contextos: { qual: {...} } }
export const rascunhoMusica = () => store.get(CHAVE_MUSICA) || {};
const salvar = r => store.set(CHAVE_MUSICA, r);

// o que está tocando AGORA, no formato do pacote (as tabelas ao vivo já têm o que a nuvem publicou)
export const temaDeHoje = bioma => ({ ...TEMAS[bioma], escala: nomeDaEscala(TEMAS[bioma].escala) });
export const contextoDeHoje = qual => ({ ...CONTEXTOS[qual] });
export const temaEditado = bioma => rascunhoMusica().temas?.[bioma] || temaDeHoje(bioma);
export const contextoEditado = qual => rascunhoMusica().contextos?.[qual] || contextoDeHoje(qual);
export const foiEditado = (parte, chave) => !!rascunhoMusica()[parte]?.[chave];
export const quantosEditados = () => {
  const r = rascunhoMusica();
  return Object.keys(r.temas || {}).length + Object.keys(r.contextos || {}).length;
};

export function gravar(parte, chave, valor) {
  const r = rascunhoMusica();
  salvar({ ...r, [parte]: { ...r[parte], [chave]: valor } });
}
export function desfazer(parte, chave) {
  const r = rascunhoMusica();
  if (r[parte]) delete r[parte][chave];
  salvar(r);
}
export const limparRascunhoMusica = () => salvar({});

/* O que vai pro pacote: TODOS os biomas e contextos, com o rascunho por cima. Mandar só os editados faria o resto
   voltar pro de fábrica na hora de aplicar (`conteudo.aplicarMusica` reseta o que o pacote não traz) — o usuário
   editaria o `gelo` hoje e perderia o `mar` que publicou na semana passada, sem nada avisar. */
export const musicaEditada = () => ({
  temas: Object.fromEntries(Object.keys(TEMAS).map(b => [b, temaEditado(b)])),
  contextos: Object.fromEntries(Object.keys(CONTEXTOS).map(q => [q, contextoEditado(q)]))
});

/* ---- o bloco pra colar em js/dados-musica.js ---- */
/* Só os dois blocos de tabela, não o arquivo inteiro: o resto de `dados-musica.js` é comentário e limites, que
   não se editam por aqui. É o mesmo recorte que `musica.html` já devolvia. */
const ESC_DA_ESCALA = { 'penta maior': 'PENTA_MAIOR', 'penta menor': 'PENTA_MENOR', 'menor harmônica': 'MENOR_HARM' };
const linhaTema = (bioma, t) => `  ${bioma}: { raiz: ${t.raiz}, escala: ${ESC_DA_ESCALA[t.escala] || 'PENTA_MAIOR'}, ` +
  `acordes: [${t.acordes.join(', ')}]${t.onda ? `, onda: '${t.onda}'` : ''}, melodia: '${t.melodia}' },`;
const linhaContexto = (qual, c) => `  ${qual}: { bpm: ${c.bpm}, densidade: ${c.densidade}` +
  `${c.onda ? `, onda: '${c.onda}'` : ''}${c.melodiaFixa ? `, melodiaFixa: '${c.melodiaFixa}'` : ''} },`;

export function gerarBlocoMusica(musica) {
  const temas = Object.entries(musica.temas || {}).map(([k, t]) => linhaTema(k, t));
  const ctx = Object.entries(musica.contextos || {}).map(([k, c]) => linhaContexto(k, c));
  return `export const CONTEXTOS = {\n${ctx.join('\n')}\n};\n\nexport const TEMAS = {\n${temas.join('\n')}\n};\n`;
}
