/* ⚔ Saga — o mundo andável. Três metades:
   1. o CONTEÚDO de fábrica (`dados-saga.js`) passa LIMPO pelo validador (`saga-validar.js`) — e o validador
      pega de verdade o que diz pegar (um mundo estragado de propósito, erro por erro);
   2. a ARTE: toda figura citada existe no atlas, e a borda automática escolhe a figura certa;
   3. as REGRAS (`saga-mundo.js`): passo, bloqueio, caminho, condição, efeito, dons, fim de luta. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MAPAS_SAGA, NPCS, MISSOES_SAGA, ITENS_SAGA, DONS, TILES, TEMAS, INICIO, FACCOES, CAPITULOS } from '../js/dados-saga.js';
import { ATLAS, ARTE, BLOBS, PROPS, GENTE } from '../js/dados-saga-arte.js';
import { MASCARAS_BLOB, INDICE_BLOB, reduzir, desenhoDaCasa, propDaCasa, N, L, S as SUL, O, NE } from '../js/saga-arte.js';
import { validarMundo, errosDoMundo, EFEITOS_DE_DOM } from '../js/saga-validar.js';
import {
  DIRS, CHANCE_MATO, acharChar, estadoSaga, etapaDe, diario, vale, aplicar, objetoEm, bloqueia, passo, sorteiaEncontro,
  caminho, camera, comecarConversa, opcoesDe, fimDaLuta, mundoAtivo, marcaDoNpc, capituloDe, multDosDons, temFaro,
  visitou, cartaDoCapitulo, corDaCasa, capitulosVistos
} from '../js/saga-mundo.js';
import { multSaga, MULT_RUINA } from '../js/regras.js';

const MUNDO = { TILES, MAPAS: MAPAS_SAGA, NPCS, MISSOES: MISSOES_SAGA, ITENS: ITENS_SAGA, DONS, FACCOES, CAPITULOS, TEMAS, INICIO };
const ARTES = { ARTE, PROPS, GENTE };
const tab = { TILES, TEMAS, ARTE, BLOBS };
const novo = (extra = {}) => ({ dificuldade: 'saga', money: 0, bag: {}, player: { data: { types: ['normal'] } }, ...extra });
const copia = () => structuredClone(MUNDO);
const erros = m => errosDoMundo(m, ARTES).map(e => `${e.onde}: ${e.msg}`);

/* ---------- 1. conteúdo ---------- */
test('o mundo de fábrica passa limpo pelo validador (nem erro, nem aviso)', () => {
  const p = validarMundo(MUNDO, ARTES);
  assert.deepEqual(p.map(x => `${x.nivel} · ${x.onde}: ${x.msg}`), []);
});

test('um capítulo por rota: 1ª rota no capítulo 1, e cada mapa na rota do capítulo dele', () => {
  CAPITULOS.forEach((c, i) => { assert.equal(c.n, i + 1); assert.equal(c.rota, i); });
  for (const [id, m] of Object.entries(MAPAS_SAGA)) assert.equal(m.rota, capituloDe(m).rota, `${id}: a rota não é a do capítulo`);
});

test('o validador pega o que diz pegar', () => {
  const quebra = (mexe, pedaco) => { const m = copia(); mexe(m); const e = erros(m); assert.ok(e.some(x => x.includes(pedaco)), `esperava um erro com "${pedaco}", veio: ${e.join(' | ') || 'nenhum'}`); };
  quebra(m => { m.MAPAS.clareira.grade[1] = 'T..f.....'; }, 'tamanho diferente');
  quebra(m => { m.MAPAS.clareira.grade[1] = 'T..f...?..f..T'; }, 'não é tile nem objeto');
  quebra(m => { m.MAPAS.clareira.objs['4'].porta = ['lugar-nenhum', '4']; }, 'que não existe');
  quebra(m => { m.MAPAS.clareira.grade[4] = 'T....Y.......T'; }, 'mais de uma casa');
  // a Dama Véu na frente da porta: foi o erro de verdade do primeiro mapa escrito à mão
  quebra(m => { m.MAPAS.clareira.grade[5] = 'T............T'; m.MAPAS.clareira.grade[6] = 'T.....Y......T'; }, 'não tem pra onde andar');
  quebra(m => { m.MAPAS.clareira.grade[1] = 'TTTTTTTTTTTTTT'; m.MAPAS.clareira.grade[2] = 'TTTTTTZTTTTTTT'; m.MAPAS.clareira.grade[3] = 'T..f..TS..f..T'; }, 'fora de alcance');
  quebra(m => { m.NPCS.pichu.nos.oi.vai = 'sumiu'; }, 'que não existe');
  quebra(m => { m.NPCS.pichu.falas.push({ se: { flag: 'x' }, no: 'oi' }); }, 'valer sempre');
  quebra(m => { m.NPCS.vo.nos.pedido.opcoes.forEach(o => { o.se = { flag: 'x' }; }); }, 'sem botão');
  quebra(m => { m.NPCS.vo.nos.vai.faz = { item: 'inexistente' }; }, 'item-chave');
  quebra(m => { m.NPCS.vo.nos.vai.faz = { missao: ['fonte', 9] }; }, 'missão/etapa');
  quebra(m => { m.NPCS.vo.nos.vai.faz = { bag: [['item-que-nao-ha', 1]] }; }, 'item de mochila');
  quebra(m => { m.NPCS.vo.nos.vai.faz = { dinheiro: 10 ** 9 }; }, 'razoável');
  quebra(m => { m.DONS.brasa.ruina = 50; }, 'entre');
  quebra(m => { m.MAPAS.bosque.objs.X.inimigo.id = 'rondadores'; }, 'já é usado');
  quebra(m => { m.MAPAS.bosque.objs.V.arte = 'figura-que-nao-ha'; }, 'não existe no atlas');
  quebra(m => { m.NPCS.pichu.sprite = 'robo'; }, 'figura inválida');
  quebra(m => { m.INICIO.em = '%'; }, 'ponto de partida');
  quebra(m => { m.NPCS.pichu.nos.oi.fala = 'x'.repeat(5000); }, 'limite');
  quebra(m => { m.MAPAS.bosque.objs.X.inimigo.tipo = 'dragao'; }, 'inimigo sem tipo');
  quebra(m => { m.NPCS.pichu.sprite = '@lendario'; }, 'figura inválida');
  quebra(m => { m.NPCS.pichu.nos.oi.faz = { fim: 'x'.repeat(200) }; }, 'nome do final');
});

test('o fim da história: os Antigos e a figura "@antigo" valem, e luta final sem conversa que encerre vira aviso', () => {
  const m = copia();
  assert.equal(m.MAPAS.nascente.objs.X[0].inimigo.tipo, 'antigos'); assert.equal(m.NPCS.antigos.sprite, '@antigo');
  for (const no of Object.values(m.NPCS.antigos.nos)) if (no.faz) delete no.faz.fim;
  const avisos = validarMundo(m, ARTES).filter(x => x.nivel === 'aviso').map(x => x.msg);
  assert.ok(avisos.some(a => a.includes('nenhuma conversa encerra a jornada')), `esperava o aviso do fim, veio: ${avisos.join(' | ') || 'nenhum'}`);
});

test('todo dom de fábrica respeita os limites, e o texto dele não mente o sinal', () => {
  for (const [k, d] of Object.entries(DONS)) for (const [campo, [min, max]] of Object.entries(EFEITOS_DE_DOM))
    if (d[campo] !== undefined) assert.ok(d[campo] >= min && d[campo] <= max, `${k}.${campo}`);
  assert.ok(DONS.casca.defesa < 1 && DONS.brasa.ruina > 1 && DONS.sombra.encontro < 1);
});

/* ---------- 2. arte ---------- */
test('toda figura citada por tile, tema e capítulo existe no atlas', () => {
  const ver = (onde, t) => {
    for (const n of [].concat(t.fundo || [])) assert.ok(ARTE[n] !== undefined, `${onde}: fundo ${n}`);
    for (const c of t.arte || []) {
      if (c?.blob) assert.ok(BLOBS[c.blob] !== undefined, `${onde}: blob ${c.blob}`);
      else for (const n of [].concat(c)) assert.ok(ARTE[n] !== undefined, `${onde}: arte ${n}`);
    }
    for (const n of [].concat(t.prop || [])) assert.ok(PROPS[n], `${onde}: enfeite ${n}`);
  };
  for (const [ch, t] of Object.entries(TILES)) { ver(`tile ${ch}`, t); assert.ok(t.nome && /^#[0-9a-f]{6}$/i.test(t.c), `tile ${ch}: nome e cor de reserva`); }
  for (const [id, tema] of Object.entries(TEMAS)) for (const [ch, t] of Object.entries(tema.tiles)) { assert.ok(TILES[ch], `tema ${id}: tile ${ch}`); ver(`tema ${id}/${ch}`, t); }
  for (const p of Object.values(PROPS)) assert.ok(p[0] + p[2] <= ATLAS.w && p[1] + p[3] <= ATLAS.h, 'enfeite fora do atlas');
});

test('os arquivos de imagem existem e o CSS aponta pra eles', () => {
  const css = fs.readFileSync(new URL('../css/estilo.css', import.meta.url), 'utf8');
  for (const arq of [ATLAS.arquivo, GENTE.arquivo]) {
    assert.ok(fs.existsSync(new URL(`../${arq}`, import.meta.url)), `${arq} não existe (rodar ferramentas/gerar-atlas-saga.mjs)`);
    assert.ok(css.includes(`url(../${arq})`), `o CSS não usa ${arq}`);
  }
  assert.ok(fs.readFileSync(new URL('../img/saga/CREDITOS.txt', import.meta.url), 'utf8').includes('CC-BY-SA'), 'a arte é CC-BY-SA: o crédito é obrigatório');
});

test('borda automática: 47 figuras, e a diagonal só conta com os dois lados', () => {
  assert.equal(MASCARAS_BLOB.length, 47);
  assert.equal(reduzir(NE), 0, 'diagonal sozinha não vale');
  assert.equal(reduzir(N | NE | L), N | NE | L);
  assert.equal(INDICE_BLOB[255], 46, 'cercado dos 8 lados = a figura cheia, a última');
  assert.equal(INDICE_BLOB[0], 0);
  for (let m = 0; m < 256; m++) assert.equal(MASCARAS_BLOB[INDICE_BLOB[m]], reduzir(m));
});

test('desenho da casa: caminho emenda com caminho, árvore vira enfeite, tema troca a árvore', () => {
  const P = MAPAS_SAGA.pedralume;
  const cruz = desenhoDaCasa(P, 14, 8, tab), ponta = desenhoDaCasa(P, 14, 17, tab);
  assert.equal(cruz.camadas[0] - BLOBS.terra, INDICE_BLOB[N | L | SUL | O], 'no cruzamento, os 4 lados emendam');
  assert.notEqual(cruz.camadas[0], ponta.camadas[0]);
  assert.ok(cruz.fundo >= ARTE.grama0 && cruz.fundo <= ARTE.grama2, 'embaixo do caminho, a grama do mapa');
  assert.ok(['carvalho', 'carvalho2'].includes(propDaCasa(P, 0, 0, tab)));
  assert.ok(['pinheiro', 'pinheiro2'].includes(propDaCasa(MAPAS_SAGA.passo, 0, 0, tab)), 'o tema pinheiral troca a árvore');
  // a porta escondida do bosque se desenha como árvore (`como`), e a casa de objeto herda o chão do mapa
  const [x4, y4] = acharChar('bosque', '4');
  assert.ok(propDaCasa(MAPAS_SAGA.bosque, x4, y4, tab));
  assert.equal(desenhoDaCasa(MAPAS_SAGA.ruinas, 0, 0, tab).fundo, ARTE.breu);
  assert.equal(desenhoDaCasa(P, 99, 99, tab), null);
});

/* ---------- 3. regras ---------- */
test('estado nasce no começo do jogo, e o mundo só vale no modo com a flag e antes de seguir viagem', () => {
  const S = novo(), s = estadoSaga(S);
  assert.deepEqual([s.mapa, s.x, s.y], [INICIO.mapa, ...acharChar(INICIO.mapa, INICIO.em)]);
  assert.equal(mundoAtivo(S), true);
  assert.equal(mundoAtivo(novo({ dificuldade: 'roguelike' })), false);
  s.fora = true; assert.equal(mundoAtivo(S), false);
  // save de um mundo antigo (mapa que não existe mais) recomeça no início em vez de quebrar
  const velho = novo({ saga: { mapa: 'aldeia', x: 3, y: 3 } });
  assert.equal(estadoSaga(velho).mapa, INICIO.mapa);
});

test('passo: anda, esbarra em parede e em objeto, e a porta leva pro outro mapa', () => {
  const S = novo(), s = estadoSaga(S), [x, y] = [s.x, s.y];
  assert.equal(passo(S, 's').tipo, 'andou'); assert.deepEqual([s.x, s.y], [x, y + 1]);
  passo(S, 's');
  assert.equal(passo(S, 's').tipo, 'parede'); assert.deepEqual([s.x, s.y], [x, y + 2]);   // a cerca de árvores
  const [ax, ay] = acharChar('pedralume', 'A'); s.x = ax; s.y = ay + 1;
  const r = passo(S, 'n'); assert.equal(r.tipo, 'objeto'); assert.equal(r.obj.npc, 'anciao'); assert.equal(s.y, ay + 1);
  const [px, py] = acharChar('pedralume', '1'); s.x = px + 1; s.y = py;
  const p = passo(S, 'o'); assert.deepEqual([p.tipo, p.de, p.para], ['porta', 'pedralume', 'bosque']);
  assert.deepEqual([s.mapa, s.x, s.y], ['bosque', ...acharChar('bosque', '1')]);
});

test('árvore falsa deixa passar, a gruta só abre com a lamparina, e o portão só depois do capítulo', () => {
  const S = novo(), s = estadoSaga(S), B = MAPAS_SAGA.bosque, E = MAPAS_SAGA.estrada, P = MAPAS_SAGA.pedralume;
  const [tx, ty] = acharChar('bosque', 't');
  assert.equal(bloqueia(S, B, tx, ty), false);
  assert.equal(bloqueia(S, B, tx - 1, ty), true);    // a vizinha é árvore de verdade
  const [lx, ly] = acharChar('estrada', 'L');
  assert.equal(bloqueia(S, E, lx, ly), true);
  s.itens.lamparina = 1;
  assert.equal(objetoEm(S, E, lx, ly), null); assert.equal(bloqueia(S, E, lx, ly), false);
  const [gx, gy] = acharChar('pedralume', 'G');
  assert.equal(objetoEm(S, P, gx, gy).npc, 'guarda');
  s.flags.cap1 = true;
  assert.deepEqual(objetoEm(S, P, gx, gy).porta, ['passo', '1']);
});

test('objeto com variantes: Alfa → Coração → leito vazio; e o Alfa do Passo pode ser acalmado em vez de vencido', () => {
  const S = novo(), s = estadoSaga(S), R = MAPAS_SAGA.ruinas, [x, y] = acharChar('ruinas', 'X');
  assert.equal(objetoEm(S, R, x, y).inimigo.id, 'alfa');
  s.flags['venceu:alfa'] = true; assert.equal(objetoEm(S, R, x, y).bau, 'coracao');
  s.flags['pegou-coracao'] = true; assert.ok(objetoEm(S, R, x, y).placa);
  const C = MAPAS_SAGA.covil, [cx, cy] = acharChar('covil', 'X'), T = novo(), t = estadoSaga(T);
  assert.equal(objetoEm(T, C, cx, cy).inimigo.id, 'alfa2');
  t.itens.unguento = 1; assert.equal(objetoEm(T, C, cx, cy).npc, 'alfa2', 'com o unguento, dá pra conversar');
  aplicar(T, NPCS.alfa2.nos.devagar.faz);
  assert.equal(objetoEm(T, C, cx, cy).npc, 'alfa2'); assert.equal(comecarConversa(T, 'alfa2'), 'calmo');
  assert.ok(t.itens.lanca && !t.itens.unguento && t.flags['alfa-calmo']);
});

test('caminho: contorna obstáculo, termina no esbarrão e não atravessa parede', () => {
  const S = novo(), s = estadoSaga(S), [ax, ay] = acharChar('pedralume', 'A');
  const dirs = caminho(S, ax, ay);
  assert.ok(dirs.length > 0);
  let ultimo; for (const d of dirs) ultimo = passo(S, d);
  assert.equal(ultimo.tipo, 'objeto'); assert.equal(ultimo.obj.npc, 'anciao');
  assert.deepEqual(caminho(S, 0, 0), []);                 // árvore da borda não é destino
  assert.deepEqual(caminho(S, s.x, s.y), []);             // já está lá
  assert.deepEqual(caminho(S, 99, 99), []);               // fora do mapa
});

test('câmera: centra em você, prende nas bordas, e mapa menor que a tela fica no meio', () => {
  assert.equal(camera(0, 32, 320, 960), 0);
  assert.equal(camera(29, 32, 320, 960), 640);
  assert.equal(camera(15, 32, 320, 960), 15 * 32 + 16 - 160);
  assert.equal(camera(3, 32, 800, 448), -176, 'sobra igual dos dois lados');
});

test('condição: flag, sem, item, missão, tipo, falas, reputação e dom', () => {
  const S = novo(), s = estadoSaga(S);
  assert.equal(vale(S, undefined), true);
  assert.equal(vale(S, { flag: 'a' }), false); s.flags.a = true;
  assert.equal(vale(S, { flag: ['a', 'b'] }), false); assert.equal(vale(S, { flag: 'a', sem: 'b' }), true);
  assert.equal(vale(S, { missao: ['fonte', 'nao'] }), true);
  s.missoes.fonte = 1; assert.equal(vale(S, { missao: ['fonte', 1] }), true);
  s.missoes.fonte = 3; assert.equal(etapaDe(S, 'fonte'), 'fim');
  assert.equal(vale(S, { tipo: ['ghost'] }), false); S.player.data.types = ['ghost', 'poison']; assert.equal(vale(S, { tipo: ['ghost'] }), true);
  assert.equal(vale(S, { falas: ['slowpoke', 1] }), false);
  assert.equal(vale(S, { rep: ['forja', 1] }), false); assert.equal(vale(S, { repAbaixo: ['forja', 1] }), true);
  assert.equal(vale(S, { dom: 'faro' }), false); S.player.dons = ['faro']; assert.equal(vale(S, { dom: 'faro' }), true);
});

test('efeito: mexe no save, avisa, e deixa mochila/cura/loja pra quem tem tela', () => {
  const S = novo(), s = estadoSaga(S);
  const { avisos, pedidos } = aplicar(S, { flag: ['x', 'y'], item: 'sino', dinheiro: 100, rep: { forja: 2, bosque: -1 }, missao: ['sino', 0], dom: 'faro', bag: [['potion', 2]], loja: true });
  assert.ok(s.flags.x && s.flags.y && s.itens.sino);
  assert.equal(S.money, 100); assert.deepEqual(s.rep, { forja: 2, bosque: -1 });
  assert.deepEqual(S.player.dons, ['faro']);
  assert.deepEqual(pedidos, [{ bag: ['potion', 2] }, { loja: true }]);
  assert.ok(avisos.some(a => a.includes('Missão secreta nova')));
  aplicar(S, { dom: 'faro', perde: 'sino', dinheiro: -500, missao: ['sino', 'fim'] });
  assert.deepEqual(S.player.dons, ['faro'], 'dom não duplica');
  assert.equal(s.itens.sino, undefined); assert.equal(S.money, 0, 'dinheiro não fica negativo');
  assert.equal(etapaDe(S, 'sino'), 'fim');
});

test('companheiro que vai embora: só quem é da ordem, um por vez, e o que ele segurava fica com você', () => {
  const al = (nome, tipos, extra = {}) => ({ name: nome, data: { types: tipos }, ...extra });
  const S = novo({ aliados: [al('pidgey', ['normal', 'flying']), al('aron', ['steel', 'rock'], { nick: 'Lata <b>', item: 'leftovers' }), al('geodude', ['rock', 'ground'])] });
  assert.equal(vale(S, { aliado: 'forja' }), true); assert.equal(vale(S, { aliado: 'abismo' }), false);
  const { avisos, pedidos } = aplicar(S, { parte: 'forja' });
  assert.deepEqual(S.aliados.map(a => a.name), ['pidgey', 'geodude'], 'sai o primeiro da ordem, e só ele');
  assert.equal(S.bag.leftovers, 1, 'o item segurado volta pra mochila');
  assert.ok(avisos[0].includes('Lata &lt;b&gt;') && !avisos[0].includes('Lata <b>'), 'o apelido entra escapado no aviso');
  assert.deepEqual(pedidos, [{ partiu: true }]);
  assert.deepEqual(aplicar(S, { parte: 'bosque' }), { avisos: [], pedidos: [] }, 'sem ninguém daquela ordem, nada acontece');
  assert.equal(S.aliados.length, 2);
  assert.deepEqual(aplicar(novo(), { parte: 'forja' }).avisos, [], 'e sem comitiva também não');
  const quebra = mexe => { const m = copia(); mexe(m); return erros(m).join(' | '); };
  assert.ok(quebra(m => { m.NPCS.pichu.nos.oi.faz = { parte: 'guilda' }; }).includes('facção'));
  assert.ok(quebra(m => { m.NPCS.pichu.falas.unshift({ se: { aliado: 'guilda' }, no: 'oi' }); }).includes('facção'));
  assert.ok(quebra(m => { m.FACCOES.forja.tipos = 'steel'; }).includes('lista'));
});

test('missão só anda pra frente: repetir uma fala não devolve etapa nem reabre missão concluída', () => {
  const S = novo();
  aplicar(S, { missao: ['passo', 2] });
  const volta = aplicar(S, { missao: ['passo', 0] });
  assert.equal(etapaDe(S, 'passo'), 2); assert.deepEqual(volta.avisos, [], 'e não avisa "atualizada" à toa');
  aplicar(S, { missao: ['passo', 'fim'] }); aplicar(S, { missao: ['passo', 1] });
  assert.equal(etapaDe(S, 'passo'), 'fim');
});

test('diário: missão secreta só aparece depois de começar', () => {
  const S = novo(), s = estadoSaga(S);
  assert.deepEqual(diario(S), { ativas: [], feitas: [] });
  s.missoes.sino = 0; s.missoes.canteiros = 1;
  const d = diario(S);
  assert.deepEqual(d.ativas.map(m => m.id), ['sino']); assert.equal(d.ativas[0].secreta, true);
  assert.deepEqual(d.feitas.map(m => m.id), ['canteiros']);
});

test('conversa: o começo muda com o estado, e a 3ª conversa com o Tio do Poço abre a missão secreta', () => {
  const S = novo();
  assert.equal(comecarConversa(S, 'slowpoke'), 'primeira');
  assert.equal(comecarConversa(S, 'slowpoke'), 'segunda');
  assert.equal(comecarConversa(S, 'slowpoke'), 'terceira');
  assert.equal(comecarConversa(S, 'anciao'), 'inicio');
  aplicar(S, { missao: ['fonte', 0], flag: ['ouviu-bosque', 'ouviu-forja'] });
  assert.equal(comecarConversa(S, 'anciao'), 'doisLados');
});

test('balão do NPC: ! pra missão nova, ? pra missão que anda aqui — e a secreta nunca acende', () => {
  const S = novo();
  assert.equal(marcaDoNpc(S, 'anciao'), '!');
  assert.equal(marcaDoNpc(S, 'slowpoke'), null, 'a 3ª conversa abriria a missão secreta: sem balão');
  assert.equal(marcaDoNpc(S, 'pichu'), null);
  aplicar(S, { missao: ['fonte', 2], item: 'coracao' });
  assert.equal(marcaDoNpc(S, 'brasa'), '?');
  assert.equal(marcaDoNpc(S, 'anciao'), null, 'ele não quer o Coração');
  assert.equal(marcaDoNpc(S, 'ninguem'), null);
});

test('consequência: vender o minério fecha a porta da Forja, e o final do Abismo exige confiança', () => {
  const S = novo(); aplicar(S, { missao: ['fonte', 2], item: 'coracao' });
  assert.equal(comecarConversa(S, 'lasca'), 'estranho', 'sem confiança, o Sableye não fala do Coração');
  aplicar(S, { flag: 'confianca-abismo' });
  assert.equal(comecarConversa(S, 'lasca'), 'coracao');
  assert.equal(comecarConversa(S, 'brasa'), 'coracao');
  aplicar(S, { flag: 'vendeu-minerio' });
  assert.equal(comecarConversa(S, 'brasa'), 'traida');
  const no = NPCS.vo.nos.pedido;                 // opção por tipo: só quem é do verde vê
  assert.equal(opcoesDe(S, no).length, 2);
  S.player.data.types = ['grass']; assert.equal(opcoesDe(S, no).length, 3);
});

test('capítulo 2: o terceiro caminho (os peixes) só existe com o Alfa calmo E o Tomé ouvido', () => {
  const S = novo(); aplicar(S, { missao: ['passo', 2] });
  const ops = () => opcoesDe(S, NPCS.ursa.nos.decide).map(o => [...o.t][0]);
  assert.deepEqual(ops(), ['⚒', 'A']);
  aplicar(S, { flag: 'lasca-plano' }); assert.deepEqual(ops(), ['⚒', '🌑', 'A']);
  aplicar(S, { flag: 'alfa-calmo' }); assert.deepEqual(ops(), ['⚒', '🌑', 'A']);
  aplicar(S, { flag: 'tome-ouviu' }); assert.deepEqual(ops(), ['⚒', '🌑', '🐟', 'A']);
  // queimou: o acampamento esvazia e a estrada pra cidade abre
  aplicar(S, NPCS.ursa.nos.decide.opcoes[0].faz);
  const A = MAPAS_SAGA.acampamento, em = ch => objetoEm(S, A, ...acharChar('acampamento', ch));
  assert.equal(em('O'), null); assert.equal(em('S'), null);
  assert.deepEqual(em('Z').porta, ['beira', 'Z']);
});

test('fim de luta: só a vitória marca, e a anotação some nos dois casos', () => {
  const S = novo(), s = estadoSaga(S);
  s.luta = { flag: 'venceu:alfa' }; fimDaLuta(S, false);
  assert.equal(s.luta, undefined); assert.equal(s.flags['venceu:alfa'], undefined);
  s.luta = { flag: 'venceu:alfa' }; fimDaLuta(S, true);
  assert.equal(s.flags['venceu:alfa'], true);
  fimDaLuta(novo(), true);          // luta que não veio do mapa: nada a fazer
  fimDaLuta({}, true);              // save de outro modo, sem `saga`
});

test('dons são dado: o efeito sai do número escrito em DONS, no mapa e na batalha', () => {
  const S = novo(), meio = () => CHANCE_MATO * DONS.sombra.encontro + 0.001;
  assert.equal(sorteiaEncontro(S, meio), true);
  S.player.dons = ['sombra']; assert.equal(sorteiaEncontro(S, meio), false);
  assert.equal(multDosDons({ dons: ['sombra', 'unha'] }, 'encontro'), DONS.sombra.encontro * DONS.unha.encontro, 'dois dons multiplicam');
  assert.equal(temFaro({ dons: ['faro'] }), true); assert.equal(temFaro({ dons: ['brasa'] }), false);
  const ruina = { vol: { ruina: 2 } };
  assert.equal(multSaga({ dons: ['brasa'] }, ruina), MULT_RUINA * DONS.brasa.ruina);
  assert.equal(multSaga({ dons: ['brasa'] }, { vol: {} }), 1, 'a Brasa só vale em Ruína');
  assert.equal(multSaga({ dons: ['faisca'] }, { vol: {} }), DONS.faisca.dano);
  assert.equal(multSaga({}, { dons: ['casca'], vol: {} }), DONS.casca.defesa);
  assert.equal(multSaga({ dons: ['dom-que-nao-existe'] }, {}), 1);
  assert.equal(multSaga({}, {}), 1);
});

/* ---------- 4. a carta da região ---------- */
test('por onde você passou: o começo conta, a porta marca o lugar novo, e save antigo não quebra', () => {
  const S = novo(), s = estadoSaga(S);
  assert.deepEqual(Object.keys(s.vistos), ['pedralume']);
  assert.equal(visitou(S, 'pedralume'), true); assert.equal(visitou(S, 'bosque'), false);
  const [px, py] = acharChar('pedralume', '1'); s.x = px + 1; s.y = py; passo(S, 'o');
  assert.equal(visitou(S, 'bosque'), true);
  assert.deepEqual(capitulosVistos(S).map(c => c.id), ['cap1']);
  // save de antes da carta: sem `vistos`, nasce com o lugar em que você está
  const velho = novo({ saga: { mapa: 'passo', x: 12, y: 19, flags: {} } });
  assert.deepEqual(Object.keys(estadoSaga(velho).vistos), ['passo']); assert.deepEqual(capitulosVistos(velho).map(c => c.n), [2]);
});

test('carta: todo mapa do capítulo tem lugar, nenhum encosta no outro, e a posição sai da porta', () => {
  for (const c of CAPITULOS) {
    const k = cartaDoCapitulo(c.id), ids = Object.keys(MAPAS_SAGA).filter(id => MAPAS_SAGA[id].cap === c.id);
    assert.deepEqual(k.lugares.map(l => l.id).sort(), [...ids].sort(), `${c.id}: falta mapa na carta`);
    for (const l of k.lugares) {
      assert.deepEqual([l.w, l.h], [MAPAS_SAGA[l.id].grade[0].length, MAPAS_SAGA[l.id].grade.length]);
      assert.ok(l.x >= 0 && l.y >= 0 && l.x + l.w <= k.w && l.y + l.h <= k.h, `${c.id}/${l.id}: fora da carta`);
      for (const o of k.lugares) if (o !== l) assert.ok(l.x + l.w < o.x || o.x + o.w < l.x || l.y + l.h < o.y || o.y + o.h < l.y, `${c.id}: ${l.id} e ${o.id} se encostam`);
    }
    for (const v of k.ligacoes) assert.ok(ids.includes(v.de) && ids.includes(v.para) && v.de !== v.para);
    assert.ok(k.ligacoes.length >= ids.length - 1, `${c.id}: há mapa do capítulo sem porta pros outros`);
    // toda região tem passagem pra anterior e pra seguinte (menos as pontas da história)
    const fora = new Set(k.saidas.map(s => MAPAS_SAGA[s.para].cap));
    if (c.n > 1) assert.ok(fora.has(CAPITULOS[c.n - 2].id), `${c.id}: sem passagem pro capítulo anterior`);
    if (c.n < CAPITULOS.length) assert.ok(fora.has(CAPITULOS[c.n].id), `${c.id}: sem passagem pro capítulo seguinte`);
  }
  // o Vale do Orvalho: o bosque fica a oeste da aldeia, a estrada a leste, a clareira ao norte do bosque
  const L = Object.fromEntries(cartaDoCapitulo('cap1').lugares.map(l => [l.id, l]));
  assert.ok(L.bosque.x + L.bosque.w < L.pedralume.x && L.pedralume.x + L.pedralume.w < L.estrada.x);
  assert.ok(L.clareira.y + L.clareira.h < L.bosque.y && L.ruinas.y + L.ruinas.h < L.estrada.y);
  // a ligação une as duas casas da porta: a saída oeste de Pedralume e a chegada no bosque ficam na mesma linha
  const via = cartaDoCapitulo('cap1').ligacoes.find(v => [v.de, v.para].sort().join() === 'bosque,pedralume');
  assert.equal(via.y1, via.y2);
  assert.deepEqual(cartaDoCapitulo('capitulo-que-nao-existe').lugares, []);
});

test('carta: a passagem secreta não se entrega pela cor, o tema pinta a neve, e cor que vem de fora é conferida', () => {
  const B = MAPAS_SAGA.bosque, [tx, ty] = acharChar('bosque', 't');
  assert.equal(corDaCasa(B, tx, ty), corDaCasa(B, 0, 0), 'a árvore falsa sai da cor de uma árvore de verdade');
  const F = MAPAS_SAGA.fonteMorta, fy = F.grade.findIndex(l => l.includes('%')), fx = F.grade[fy].indexOf('%');
  assert.equal(corDaCasa(F, fx, fy), corDaCasa(F, 0, 0), 'a parede falsa sai da cor do breu');
  const chaoDe = id => { const m = MAPAS_SAGA[id]; for (let y = 0; y < m.grade.length; y++) { const x = m.grade[y].indexOf('.'); if (x >= 0) return corDaCasa(m, x, y); } };
  assert.notEqual(chaoDe('degelo'), chaoDe('pedralume'), 'o tema muda a cor do chão na miniatura');
  assert.notEqual(chaoDe('salina'), chaoDe('degelo'));
  assert.equal(corDaCasa(B, 99, 99), null);
  // `pele` vem com o mapa (e o mapa pode vir do pacote publicado): só cor hexadecimal chega ao desenho
  const sujo = { ...MAPAS_SAGA.clareira, pele: { '.': { c: '#fff" onload="alert(1)' } } };
  assert.equal(corDaCasa(sujo, 1, 1), '#555555');
});

test('direções: as quatro, e só elas', () => assert.deepEqual(Object.keys(DIRS).sort(), ['l', 'n', 'o', 's']));
