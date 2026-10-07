/* 🎵 Música publicada pela nuvem (js/dados-musica.js + js/conteudo.js + js/editor-musica.js).
   O que este teste guarda: `tests/som.test.js` só varre as tabelas DO REPOSITÓRIO, então a única rede contra um
   tema estridente ou malformado chegando pela nuvem é a `validarMusica`. E a mutação no lugar tem de VOLTAR o que
   o pacote não traz — senão um pacote novo deixa no ar o tema do pacote velho pra sempre. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pacoteDeFabrica, validarPacote, validarMusica, aplicarConteudo } from '../js/conteudo.js';
import { TEMAS, CONTEXTOS, ESCALAS, RAIZ, nomeDaEscala } from '../js/dados-musica.js';
import { musicaEditada, gerarBlocoMusica } from '../js/editor-musica.js';

const restaurar = () => aplicarConteudo(pacoteDeFabrica());
const temaBom = { raiz: 52, escala: 'penta menor', acordes: [0, 5, 3, 7], melodia: '0 . . 2 . 0 . . 3 . 2 . 0 - - .' };
const so = (parte, chave, valor) => validarMusica({ [parte]: { [chave]: valor } });

test('o pacote de fábrica traz a música e ela vale', () => {
  const p = pacoteDeFabrica();
  assert.equal(Object.keys(p.musica.temas).length, Object.keys(TEMAS).length);
  assert.equal(p.musica.temas.floresta.escala, 'penta maior');   // escala vai por NOME no pacote
  assert.equal(validarPacote(p).ok, true);
  assert.equal(validarMusica(null).ok, true);                    // pacote sem música é pacote válido
});

test('tema malformado é recusado, com motivo', () => {
  assert.equal(so('temas', 'floresta', temaBom).ok, true);
  assert.equal(so('temas', 'inventado', temaBom).ok, false);                                  // bioma que não existe
  assert.equal(so('temas', 'floresta', { ...temaBom, raiz: RAIZ.max + 1 }).ok, false);         // raiz fora da faixa
  assert.equal(so('temas', 'floresta', { ...temaBom, escala: 'lídia' }).ok, false);
  assert.equal(so('temas', 'floresta', { ...temaBom, acordes: [0, 5, 3] }).ok, false);         // a progressão é de 4
  assert.equal(so('temas', 'floresta', { ...temaBom, acordes: [0, 5, 3, 99] }).ok, false);
  assert.equal(so('temas', 'floresta', { ...temaBom, onda: 'serrote' }).ok, false);
  assert.equal(so('temas', 'floresta', { ...temaBom, melodia: '0 . 2' }).ok, false);           // 3 passos, não 16
  assert.equal(so('temas', 'floresta', { ...temaBom, melodia: '- . 2 4 . 4 2 . 3 - 4 . 2 0 . .' }).ok, false);
  assert.equal(so('temas', 'floresta', { ...temaBom, melodia: '0 x 2 4 . 4 2 . 3 - 4 . 2 0 . .' }).ok, false);
  assert.ok(/raiz/.test(so('temas', 'floresta', { ...temaBom, raiz: 12 }).porque));
});

/* A queixa que gerou o teto foi "som agudo demais": o passa-baixa da saída corta em 2 kHz, e a melodia chegava
   perto disso. Um tema publicado precisa bater na mesma trava que `tests/som.test.js` cobra no repositório. */
test('tema que passa de 880 Hz é recusado', () => {
  const agudo = { ...temaBom, raiz: RAIZ.max, escala: 'menor harmônica', melodia: '9 . . 2 . 0 . . 3 . 2 . 0 - - .' };
  const r = so('temas', 'floresta', agudo);
  assert.equal(r.ok, false);
  assert.ok(/agudo/.test(r.porque), r.porque);
  // grau 7 em menor harmônica com a raiz mais alta dá exatamente 81 (880 Hz): o teto é inclusivo
  assert.equal(so('temas', 'floresta', { ...agudo, melodia: '7 . . 2 . 0 . . 3 . 2 . 0 - - .' }).ok, true);
});

test('contexto: bpm, densidade e a frase fixa no pior caso de escala', () => {
  const bom = { bpm: 138, densidade: 0.68, onda: 'square', melodiaFixa: '0 . 0 3 . 2 . 4 . 3 2 . 0 . 2 .' };
  assert.equal(so('contextos', 'batalha', bom).ok, true);
  assert.equal(so('contextos', 'tela-inventada', bom).ok, false);
  assert.equal(so('contextos', 'batalha', { ...bom, bpm: 9 }).ok, false);
  assert.equal(so('contextos', 'batalha', { ...bom, densidade: 2 }).ok, false);
  assert.equal(so('contextos', 'batalha', { ...bom, densidade: 0 }).ok, false);
  assert.equal(so('contextos', 'batalha', { ...bom, melodiaFixa: '' }).ok, true);   // vazio = toca a do bioma
  // a frase fixa toca sobre a escala de QUALQUER tema, então o teto vale no pior caso (raiz mais alta × escala)
  assert.equal(so('contextos', 'batalha', { ...bom, melodiaFixa: '9 . 0 3 . 2 . 4 . 3 2 . 0 . 2 .' }).ok, false);
});

test('aplicar muta as tabelas no lugar e volta o que o pacote não traz', () => {
  restaurar();
  const antes = { ...TEMAS.floresta }, antesCtx = { ...CONTEXTOS.batalha };
  const p = { ...pacoteDeFabrica(), musica: { temas: { floresta: temaBom }, contextos: {} } };
  assert.equal(validarPacote(p).ok, true);
  aplicarConteudo(p);
  assert.equal(TEMAS.floresta.raiz, 52);
  assert.equal(TEMAS.floresta.escala, ESCALAS['penta menor']);   // o nome virou o array que o motor toca
  assert.equal(nomeDaEscala(TEMAS.floresta.escala), 'penta menor');

  // segundo pacote, SEM o tema: volta pro de fábrica em vez de ficar com o do pacote anterior
  aplicarConteudo({ ...pacoteDeFabrica(), musica: { temas: {}, contextos: {} } });
  assert.deepEqual({ ...TEMAS.floresta }, antes);
  assert.deepEqual({ ...CONTEXTOS.batalha }, antesCtx);
});

/* `onda` ausente quer dizer "herda do contexto" e `melodiaFixa` ausente, "sem frase própria". Se o aplicar fizesse
   `{ ...fabrica, ...publicado }`, a chave de fábrica sobreviveria e não haveria como VOLTAR a herdar. */
test('onda e frase fixa somem quando o tema publicado não as traz', () => {
  restaurar();
  assert.equal(TEMAS.vulcao.onda, 'sawtooth');   // o de fábrica tem onda própria
  aplicarConteudo({ ...pacoteDeFabrica(), musica: { temas: { vulcao: { ...temaBom, raiz: 48 } } } });
  assert.equal('onda' in TEMAS.vulcao, false);
  aplicarConteudo({ ...pacoteDeFabrica(), musica: { contextos: { batalha: { bpm: 120, densidade: 0.5 } } } });
  assert.equal('melodiaFixa' in CONTEXTOS.batalha, false);
  restaurar();
  assert.equal(TEMAS.vulcao.onda, 'sawtooth');
  assert.ok(CONTEXTOS.batalha.melodiaFixa);
});

/* O editor sem rascunho (é o caso no Node: sem `localStorage`, `store.get` devolve null) tem de produzir
   exatamente o que está tocando — senão abrir a tela e publicar sem editar nada já mudaria a música. */
test('o editor sem edição publica a música que já está no jogo', () => {
  restaurar();
  const m = musicaEditada();
  assert.equal(validarMusica(m).ok, true);
  assert.equal(Object.keys(m.temas).length, Object.keys(TEMAS).length);
  assert.equal(Object.keys(m.contextos).length, Object.keys(CONTEXTOS).length);
  aplicarConteudo({ ...pacoteDeFabrica(), musica: m });
  assert.deepEqual({ ...TEMAS.floresta }, { ...pacoteDeFabrica().musica.temas.floresta, escala: ESCALAS['penta maior'] });
});

test('o bloco pra colar sai com todas as faixas e com a escala por constante', () => {
  const txt = gerarBlocoMusica(musicaEditada());
  for (const b of Object.keys(TEMAS)) assert.ok(txt.includes(`  ${b}: {`), `${b} ficou fora do bloco`);
  for (const q of Object.keys(CONTEXTOS)) assert.ok(txt.includes(`  ${q}: {`), `${q} ficou fora do bloco`);
  assert.ok(txt.includes('escala: PENTA_MAIOR'));
  assert.ok(txt.includes("melodiaFixa: '"));
  assert.equal(/escala: '/.test(txt), false);   // o arquivo usa a constante, não o nome em texto
});
