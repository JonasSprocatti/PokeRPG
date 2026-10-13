/* 🌍 Editor de mundo — as operações puras (`editor-saga.js`) e o mundo dentro do pacote de conteúdo
   (`conteudo.validarSaga`/`aplicarSaga`). O que este arquivo garante, em uma frase: NADA do que o editor faz
   deixa o mundo num estado que o validador recusa sem dizer por quê, e o arquivo que ele gera é o mundo. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as ed from '../js/editor-saga.js';
import { TILES, MAPAS_SAGA, NPCS, INICIO, CAPITULOS } from '../js/dados-saga.js';
import { ARTE, PROPS, GENTE } from '../js/dados-saga-arte.js';
import { errosDoMundo } from '../js/saga-validar.js';
import { sagaAoVivo, mundoCompleto, validarSaga, aplicarSaga, SAGA_DE_FABRICA, validarPacote, pacoteDeFabrica } from '../js/conteudo.js';

const novo = () => sagaAoVivo();
const erros = R => errosDoMundo(mundoCompleto(R), { ARTE, PROPS, GENTE }).map(e => `${e.onde}: ${e.msg}`);

test('caminho: ler, definir, apagar, inserir e mover na lista', () => {
  const R = novo();
  assert.equal(ed.ler(R, ['NPCS', 'pichu', 'nos', 'oi', 'fala']), NPCS.pichu.nos.oi.fala);
  assert.equal(ed.ler(R, ['NPCS', 'ninguem', 'nos']), undefined);
  ed.definir(R, ['NPCS', 'pichu', 'nome'], 'Pichuzinho'); assert.equal(R.NPCS.pichu.nome, 'Pichuzinho');
  ed.apagar(R, ['NPCS', 'pichu', 'nos', 'tio']); assert.equal(R.NPCS.pichu.nos.tio, undefined);
  ed.inserir(R, ['MISSOES', 'fonte', 'etapas'], 'Etapa nova', 1); assert.equal(R.MISSOES.fonte.etapas[1], 'Etapa nova');
  ed.moverNaLista(R, ['MISSOES', 'fonte', 'etapas'], 1, 0); assert.equal(R.MISSOES.fonte.etapas[0], 'Etapa nova');
  ed.apagar(R, ['MISSOES', 'fonte', 'etapas', 0]); assert.notEqual(R.MISSOES.fonte.etapas[0], 'Etapa nova');
  assert.equal(ed.definir(R, ['NPCS', 'ninguem', 'nome'], 'x'), false, 'pai que não existe: recusa em vez de estourar');
  assert.equal(ed.idLivre(R.NPCS, 'pichu'), 'pichu-2'); assert.equal(ed.idLivre(R.NPCS, 'novo'), 'novo');
  assert.equal(ed.idLivre(R.CAPITULOS, 'cap1'), 'cap1-2');
});

test('mapa novo nasce válido de ponta a ponta, com cerca e chão', () => {
  const R = novo();
  const m = ed.novoMapa(R, 'teste', { nome: 'Teste', cap: 'cap1', rota: 0, largura: 12, altura: 9 });
  assert.ok(m); assert.equal(m.grade.length, 9); assert.ok(m.grade.every(l => l.length === 12));
  assert.equal(m.grade[0], 'T'.repeat(12)); assert.equal(m.grade[4], 'T' + '.'.repeat(10) + 'T');
  assert.equal(ed.novoMapa(R, 'gruta', { chao: '_' }).grade[0][0], '#', 'mapa de caverna cerca com breu');
  assert.equal(ed.novoMapa(R, 'teste'), null, 'id repetido');
  assert.equal(ed.novoMapa(R, 'Com Espaço'), null, 'id mal escrito');
  assert.equal(ed.novoMapa(R, 'parede', { chao: 'T' }), null, 'chão tem de ser por onde se anda');
  // ainda sem porta, os dois mapas novos estão fora de alcance — e o validador diz isso, em vez de calar
  ed.porObjeto(R, 'teste', 3, 3, { placa: 'oi' });
  assert.ok(erros(R).some(e => e.includes('fora de alcance')));
});

test('pintar, retângulo e balde — e pintar em cima de um objeto pinta POR BAIXO dele', () => {
  const R = novo(); ed.novoMapa(R, 't', { largura: 10, altura: 8 });
  assert.equal(ed.pintar(R, 't', 2, 2, '='), true); assert.equal(R.MAPAS.t.grade[2][2], '=');
  assert.equal(ed.pintar(R, 't', 2, 2, '='), false, 'pintar o que já é: nada mudou');
  assert.equal(ed.pintar(R, 't', 99, 2, '='), false); assert.equal(ed.pintar(R, 't', 2, 2, '?'), false);
  ed.retangulo(R, 't', 6, 5, 4, 3, '~');
  for (let y = 3; y <= 5; y++) assert.equal(R.MAPAS.t.grade[y].slice(4, 7), '~~~');
  ed.balde(R, 't', 5, 4, '"'); assert.equal(R.MAPAS.t.grade[4].slice(4, 7), '"""', 'o balde troca a mancha inteira');
  assert.equal(R.MAPAS.t.grade[1][1], '.', '…e só ela');
  const ch = ed.porObjeto(R, 't', 1, 1, { npc: 'pichu' });
  ed.pintar(R, 't', 1, 1, '=');
  assert.equal(R.MAPAS.t.grade[1][1], ch, 'o objeto continua na casa'); assert.equal(R.MAPAS.t.objs[ch].como, '=');
  ed.pintar(R, 't', 1, 1, '.'); assert.equal(R.MAPAS.t.objs[ch].como, undefined, 'voltar ao chão do mapa tira o `como`');
  ed.balde(R, 't', 2, 1, 'f'); assert.equal(R.MAPAS.t.grade[1][1], ch, 'o balde não passa por cima de objeto');
});

test('objeto: pôr, mover e tirar — o chão embaixo dele acompanha', () => {
  const R = novo(); ed.novoMapa(R, 't', { largura: 10, altura: 8 });
  ed.pintar(R, 't', 3, 3, '=');
  const ch = ed.porObjeto(R, 't', 3, 3, { placa: 'oi' });
  assert.equal(ch, 'A'); assert.equal(R.MAPAS.t.objs.A.como, '=', 'posto em cima do caminho, imita o caminho');
  assert.equal(ed.porObjeto(R, 't', 3, 3, { placa: 'x' }), null, 'casa ocupada');
  assert.equal(ed.porObjeto(R, 't', 4, 3, { placa: 'x' }), 'B');
  assert.deepEqual(ed.ondeEsta(R.MAPAS.t, 'A'), [3, 3]);
  assert.equal(ed.moverObjeto(R, 't', 'A', 4, 3), false, 'não anda pra cima de outro');
  assert.equal(ed.moverObjeto(R, 't', 'A', 5, 5), true);
  assert.equal(R.MAPAS.t.grade[3][3], '=', 'a casa de onde saiu volta a ser o caminho');
  assert.equal(R.MAPAS.t.objs.A.como, undefined, 'e na grama não imita nada');
  ed.tirarObjeto(R, 't', 'A'); assert.equal(R.MAPAS.t.grade[5][5], '.'); assert.equal(R.MAPAS.t.objs.A, undefined);
  assert.equal(ed.chaveLivre(R.MAPAS.t), 'A', 'a letra volta a ficar livre');
  assert.ok(!ed.CHAVES_DE_OBJETO.some(c => TILES[c]), 'nenhuma chave de objeto é um tile');
  assert.ok(new Set(ed.CHAVES_DE_OBJETO).size === ed.CHAVES_DE_OBJETO.length && ed.CHAVES_DE_OBJETO.length > 50);
});

test('redimensionar: cresce copiando a beirada, encolhe levando os objetos de lá, e tem tamanho mínimo', () => {
  const R = novo(); ed.novoMapa(R, 't', { largura: 6, altura: 6 });
  const ch = ed.porObjeto(R, 't', 4, 2, { placa: 'oi' });
  ed.redimensionar(R, 't', 'dir', 1); assert.ok(R.MAPAS.t.grade.every(l => l.length === 7)); assert.equal(R.MAPAS.t.grade[2].at(-1), 'T');
  ed.redimensionar(R, 't', 'cima', 1); assert.equal(R.MAPAS.t.grade.length, 7); assert.deepEqual(ed.ondeEsta(R.MAPAS.t, ch), [4, 3]);
  ed.redimensionar(R, 't', 'esq', -1); assert.ok(R.MAPAS.t.grade.every(l => l.length === 6)); assert.deepEqual(ed.ondeEsta(R.MAPAS.t, ch), [3, 3]);
  ed.redimensionar(R, 't', 'baixo', -1); ed.redimensionar(R, 't', 'baixo', -1);
  assert.equal(R.MAPAS.t.grade.length, 5); assert.equal(ed.redimensionar(R, 't', 'baixo', -1), false, 'não encolhe abaixo do mínimo');
  // tirar a coluna em que o objeto está leva o objeto junto (senão ficaria uma chave sem casa)
  for (let i = 0; i < 3; i++) ed.redimensionar(R, 't', 'dir', 1);
  const x = ed.ondeEsta(R.MAPAS.t, ch)[0];
  for (let i = 0; i < x; i++) ed.redimensionar(R, 't', 'esq', -1);
  ed.redimensionar(R, 't', 'esq', -1);
  assert.equal(R.MAPAS.t.objs[ch], undefined);
  assert.ok(R.MAPAS.t.grade.every(l => l.length === R.MAPAS.t.grade[0].length));
});

test('carimbo de casa e ligar portas: um mapa novo ligado ao mundo passa limpo no validador', () => {
  const R = novo(); ed.novoMapa(R, 'vila', { nome: 'Vila Nova', cap: 'cap1', rota: 0, largura: 14, altura: 12 });
  assert.equal(ed.carimbarCasa(R, 'vila', 5, 5), true);
  assert.equal(R.MAPAS.vila.grade[5].slice(4, 7), 'hch'); assert.equal(R.MAPAS.vila.grade[3].slice(4, 7), 'hhh');
  assert.equal(ed.carimbarCasa(R, 'vila', 0, 0), false, 'não cabe');
  // uma porta em Pedralume que chega na vila, e a volta criada junto
  const [px, py] = [20, 12];
  const deCh = ed.porObjeto(R, 'pedralume', px, py, ed.MODELOS_DE_OBJETO.porta(R, 'pedralume'));
  const paraCh = ed.ligarPortas(R, 'pedralume', deCh, 'vila', 7, 9);
  assert.deepEqual(R.MAPAS.pedralume.objs[deCh].porta, ['vila', paraCh]);
  assert.deepEqual(R.MAPAS.vila.objs[paraCh].porta, ['pedralume', deCh]);
  ed.porObjeto(R, 'vila', 5, 6, ed.MODELOS_DE_OBJETO.npc(R));
  ed.porObjeto(R, 'vila', 9, 4, ed.MODELOS_DE_OBJETO.bau(R, 'vila'));
  ed.porObjeto(R, 'vila', 10, 8, ed.MODELOS_DE_OBJETO.inimigo(R, 'vila'));
  ed.porObjeto(R, 'vila', 3, 9, ed.MODELOS_DE_OBJETO.placa(R));
  ed.porObjeto(R, 'vila', 4, 9, ed.MODELOS_DE_OBJETO.gatilho(R, 'vila'));
  ed.porObjeto(R, 'vila', 6, 9, ed.MODELOS_DE_OBJETO.enfeite(R));
  assert.deepEqual(erros(R), []);
  assert.deepEqual(validarSaga(R), { ok: true });
});

test('personagem e missão novos nascem válidos; excluir personagem leva as casas dele', () => {
  const R = novo();
  assert.ok(ed.novoNpc(R, 'ferreiro', 'Ferreiro')); assert.equal(ed.novoNpc(R, 'ferreiro'), null);
  assert.ok(ed.novaMissao(R, 'recado')); assert.equal(ed.novaMissao(R, 'Recado!'), null);
  ed.excluirNpc(R, 'pichu');
  assert.equal(R.NPCS.pichu, undefined);
  assert.ok(!Object.values(R.MAPAS.pedralume.objs).flat().some(o => o.npc === 'pichu'));
  assert.ok(!R.MAPAS.pedralume.grade.join('').includes('K'), 'a letra dele saiu do mapa');
  // o Nico é a 2ª variante de um objeto (a 1ª é a luta): some só a variante dele, o objeto fica
  ed.excluirNpc(R, 'nico');
  assert.ok(R.MAPAS.estrada.objs.N.inimigo, 'sobrou só a variante do inimigo');
  assert.deepEqual(erros(R).filter(e => !e.includes('se.falas')), []);
});

test('o arquivo gerado É o mundo: importado de volta, dá o mesmo rascunho', async () => {
  const R = novo(), texto = ed.gerarArquivoSaga(R);
  assert.ok(texto.includes("'T\"\"\"\"..TTTTtTTT.....hhh......T'"), 'a grade sai legível, com o mato sem escape');
  const arq = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'saga-')), 'mundo.mjs');
  fs.writeFileSync(arq, texto);
  const m = await import(pathToFileURL(arq));
  assert.deepEqual({ MAPAS: m.MAPAS_SAGA, NPCS: m.NPCS, MISSOES: m.MISSOES_SAGA, ITENS: m.ITENS_SAGA, DONS: m.DONS, FACCOES: m.FACCOES, CAPITULOS: m.CAPITULOS, INICIO: m.INICIO }, R);
  // e o arquivo de fábrica exporta exatamente os mesmos nomes que o gerado
  const fabrica = await import('../js/dados-saga-mundo.js');
  assert.deepEqual(Object.keys(m).sort(), Object.keys(fabrica).sort());
});

test('pacote de conteúdo: o mundo entra, é recusado inteiro se tiver um erro, e ausente volta ao de fábrica', () => {
  const base = pacoteDeFabrica();
  assert.equal(validarPacote(base).ok, true, 'sem `saga`, vale o de fábrica');
  const R = novo(); R.NPCS.pichu.nome = 'Pichu da nuvem'; delete R.MAPAS.clareira; R.MAPAS.bosque.objs['4'] = { placa: 'Uma árvore.', como: 'T' };
  assert.equal(validarPacote({ ...base, saga: R }).ok, true);
  const ruim = novo(); ruim.NPCS.pichu.nos.oi.vai = 'nada';
  const v = validarPacote({ ...base, saga: ruim });
  assert.equal(v.ok, false); assert.match(v.porque, /saga — personagem pichu/);
  for (const lixo of [[], 'x', { MAPAS: {} }, { ...R, CAPITULOS: {} }, { ...R, MAPAS: {} }]) assert.equal(validarSaga(lixo).ok, false);

  assert.equal(aplicarSaga(R), Object.keys(R.MAPAS).length);
  assert.equal(NPCS.pichu.nome, 'Pichu da nuvem'); assert.equal(MAPAS_SAGA.clareira, undefined);
  R.NPCS.pichu.nome = 'mexi depois'; assert.equal(NPCS.pichu.nome, 'Pichu da nuvem', 'aplicar copia: mexer no rascunho não mexe no jogo');
  assert.equal(aplicarSaga(null), 0);
  assert.deepEqual(sagaAoVivo(), SAGA_DE_FABRICA, 'sem `saga` no pacote, volta tudo ao de fábrica');
  assert.ok(MAPAS_SAGA.clareira && INICIO.mapa === 'pedralume' && CAPITULOS.length === 3);
});

test('publicar por outra tela não apaga o mundo no ar: sem rascunho vai o que está valendo', () => {
  const guardado = {};
  globalThis.localStorage = { getItem: k => guardado[k] ?? null, setItem: (k, v) => { guardado[k] = v; }, removeItem: k => { delete guardado[k]; } };
  try {
    assert.equal(ed.sagaParaPublicar(), null, 'mundo de fábrica e sem rascunho: a chave fica de fora');
    const R = novo(); R.NPCS.pichu.nome = 'Publicado';
    aplicarSaga(R);
    assert.equal(ed.sagaParaPublicar().NPCS.pichu.nome, 'Publicado', 'sem rascunho, vai o que está no ar');
    const rascunho = novo(); rascunho.NPCS.pichu.nome = 'Rascunho';
    ed.guardarRascunhoSaga(rascunho);
    assert.equal(ed.sagaParaPublicar().NPCS.pichu.nome, 'Rascunho', 'com rascunho, vai o rascunho');
    ed.limparRascunhoSaga(); assert.equal(ed.rascunhoSaga(), null);
  } finally { aplicarSaga(null); delete globalThis.localStorage; }
});
