/* ⚔ Saga — o mundo andável. Duas metades:
   1. o CONTEÚDO (`dados-saga.js`) é escrito à mão, em grade de texto e árvore de diálogo — erro ali não quebra
      nada na hora: vira um NPC atrás de uma parede, uma porta pro nada, uma conversa que some. Estes testes são
      a rede: tudo alcançável a pé, toda referência apontando pra algo que existe;
   2. as REGRAS (`saga-mundo.js`): passo, bloqueio, caminho, condição, efeito, fim de luta. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPAS_SAGA, NPCS, MISSOES_SAGA, ITENS_SAGA, DONS, TILES, INICIO, FACCOES } from '../js/dados-saga.js';
import {
  DIRS, VISAO, CHANCE_MATO, MULT_SOMBRA, acharChar, estadoSaga, etapaDe, diario, vale, aplicar, objetoEm, bloqueia,
  passo, sorteiaEncontro, caminho, camera, comecarConversa, opcoesDe, fimDaLuta, mundoAtivo, atravessa
} from '../js/saga-mundo.js';
import { multSaga, MULT_DOM_BRASA, MULT_DOM_CASCA, MULT_RUINA } from '../js/regras.js';
import { ITEMS } from '../js/dados.js';

const novo = (extra = {}) => ({ dificuldade: 'saga', money: 0, bag: {}, player: { data: { types: ['normal'] } }, ...extra });
const variantes = o => [].concat(o);
const todosOsObjetos = () => Object.entries(MAPAS_SAGA).flatMap(([id, m]) => Object.entries(m.objs || {}).flatMap(([ch, o]) => variantes(o).map(v => ({ mapa: id, ch, o: v }))));
const todosOsFaz = () => [
  ...todosOsObjetos().map(x => x.o.faz),
  ...Object.values(NPCS).flatMap(n => Object.values(n.nos).flatMap(no => [no.faz, ...(no.opcoes || []).map(o => o.faz)]))
].filter(Boolean);
const todosOsSe = () => [
  ...todosOsObjetos().map(x => x.o.se),
  ...Object.values(NPCS).flatMap(n => [...n.falas.map(f => f.se), ...Object.values(n.nos).flatMap(no => (no.opcoes || []).map(o => o.se))])
].filter(Boolean);

test('mapas: retangulares, com caractere conhecido e chão que existe', () => {
  for (const [id, m] of Object.entries(MAPAS_SAGA)) {
    assert.ok(TILES[m.chao] && !TILES[m.chao].bloqueia, `${id}: chão`);
    assert.ok(m.grade[0].length >= VISAO[0] && m.grade.length >= 8, `${id}: menor que o razoável`);
    for (const [y, l] of m.grade.entries()) {
      assert.equal(l.length, m.grade[0].length, `${id}: linha ${y} de outro tamanho`);
      for (const ch of l) assert.ok(TILES[ch] || m.objs?.[ch], `${id}: caractere "${ch}" na linha ${y} não é tile nem objeto`);
    }
    for (const ch of Object.keys(m.objs || {})) {
      assert.ok(!TILES[ch], `${id}: "${ch}" é tile E objeto`);
      assert.ok(acharChar(id, ch), `${id}: objeto "${ch}" não está na grade`);
    }
  }
  assert.ok(acharChar(INICIO.mapa, INICIO.em), 'o começo do jogo existe');
});

test('portas: levam a um caractere que existe, e do outro lado há a volta', () => {
  for (const { mapa, ch, o } of todosOsObjetos().filter(x => x.o.porta)) {
    const [para, chave] = o.porta;
    assert.ok(acharChar(para, chave), `${mapa}:${ch} leva pra ${para}:${chave}, que não existe`);
    const volta = variantes(MAPAS_SAGA[para].objs[chave]).find(v => v.porta);
    assert.equal(volta?.porta[0], mapa, `${para}:${chave} não volta pra ${mapa}`);
    if (o.como) assert.ok(TILES[o.como], `${mapa}:${ch} imita um tile que não existe`);
  }
});

/* A pé, saindo do começo e atravessando portas: todo NPC, baú, placa e inimigo tem de ser tocável. Quem bloqueia
   POR CONDIÇÃO (o guarda da fenda, um inimigo ainda de pé) conta como passagem — o teste é de geografia. */
test('todo objeto do mundo é alcançável a pé', () => {
  const vistos = new Set(), tocados = new Set(), fila = [[INICIO.mapa, ...acharChar(INICIO.mapa, INICIO.em)]];
  const chave = (m, x, y) => `${m}:${x},${y}`;
  vistos.add(chave(...fila[0]));
  while (fila.length) {
    const [id, x, y] = fila.shift(), m = MAPAS_SAGA[id];
    for (const [dx, dy] of Object.values(DIRS)) {
      let nm = id, nx = x + dx, ny = y + dy;
      const ch = m.grade[ny]?.[nx];
      if (ch === undefined) continue;
      const objs = m.objs?.[ch] && variantes(m.objs[ch]);
      if (objs) tocados.add(`${id}:${ch}`);
      if (!objs && TILES[ch].bloqueia) continue;
      if (objs && !objs.some(o => atravessa(o) || o.se || o.inimigo)) continue;   // bloqueia sempre: toca, não passa
      const porta = objs?.find(o => o.porta);
      if (porta) { nm = porta.porta[0]; [nx, ny] = acharChar(nm, porta.porta[1]); tocados.add(`${nm}:${porta.porta[1]}`); }
      if (!vistos.has(chave(nm, nx, ny))) { vistos.add(chave(nm, nx, ny)); fila.push([nm, nx, ny]); }
    }
  }
  for (const { mapa, ch } of todosOsObjetos()) if (ch !== INICIO.em) assert.ok(tocados.has(`${mapa}:${ch}`), `${mapa}: "${ch}" está fora de alcance`);
});

test('ninguém chega por uma porta e fica encurralado', () => {
  for (const { mapa, ch } of todosOsObjetos().filter(x => x.o.porta)) {
    const S = novo(), s = estadoSaga(S), [x, y] = acharChar(mapa, ch);
    s.itens.lamparina = 1;   // a fenda só se atravessa com ela
    const livre = Object.values(DIRS).some(([dx, dy]) => !bloqueia(S, MAPAS_SAGA[mapa], x + dx, y + dy) && !objetoEm(S, MAPAS_SAGA[mapa], x + dx, y + dy)?.porta);
    assert.ok(livre, `${mapa}:${ch} — quem chega aqui não tem pra onde andar`);
  }
});

test('rota de cada mapa é um índice das rotas do capítulo, e todo inimigo tem tipo conhecido', () => {
  for (const [id, m] of Object.entries(MAPAS_SAGA)) assert.ok(Number.isInteger(m.rota) && m.rota >= 0 && m.rota <= 2, `${id}: rota`);
  const ids = todosOsObjetos().filter(x => x.o.inimigo).map(x => x.o.inimigo);
  for (const i of ids) assert.ok(['bando', 'treinador', 'alfa'].includes(i.tipo), `inimigo ${i.id}`);
  assert.equal(new Set(ids.map(i => i.id)).size, ids.length, 'id de inimigo repetido (a marca de vencido é por id)');
  const baus = todosOsObjetos().filter(x => x.o.bau).map(x => x.o.bau);
  assert.equal(new Set(baus).size, baus.length, 'id de baú repetido');
});

test('diálogos: todo começo e todo `vai` apontam pra um nó que existe, e a última entrada é o padrão', () => {
  for (const [id, npc] of Object.entries(NPCS)) {
    assert.ok(Number.isInteger(npc.sprite) && npc.nome, `${id}: nome e sprite`);
    assert.equal(npc.falas.at(-1).se, undefined, `${id}: a última entrada de falas precisa valer sempre`);
    for (const f of npc.falas) assert.ok(npc.nos[f.no], `${id}: começo "${f.no}" não existe`);
    const usados = new Set(npc.falas.map(f => f.no));
    for (const [k, no] of Object.entries(npc.nos)) {
      assert.ok(no.fala, `${id}.${k}: sem fala`);
      for (const v of [no.vai, ...(no.opcoes || []).map(o => o.vai)].filter(Boolean)) { assert.ok(npc.nos[v], `${id}.${k}: vai pra "${v}", que não existe`); usados.add(v); }
      assert.ok(!(no.opcoes && no.vai), `${id}.${k}: nó com opções E com vai`);
      // sem opção que valha sempre, uma condição falsa deixaria a caixa sem botão nenhum
      if (no.opcoes) assert.ok(no.opcoes.some(o => !o.se), `${id}.${k}: nenhuma opção vale sempre`);
    }
    for (const k of Object.keys(npc.nos)) assert.ok(usados.has(k), `${id}.${k}: nó que ninguém alcança`);
  }
  const noMapa = new Set(todosOsObjetos().filter(x => x.o.npc).map(x => x.o.npc));
  for (const id of Object.keys(NPCS)) assert.ok(noMapa.has(id), `NPC ${id} não está em mapa nenhum`);
  for (const id of noMapa) assert.ok(NPCS[id], `mapa cita o NPC ${id}, que não existe`);
});

test('efeitos e condições só citam item, missão, dom, facção e item de mochila que existem', () => {
  const etapaOk = ([id, e]) => MISSOES_SAGA[id] && (e === 'fim' || e === 'nao' || (Number.isInteger(e) && e < MISSOES_SAGA[id].etapas.length));
  for (const f of todosOsFaz()) {
    if (f.item) assert.ok(ITENS_SAGA[f.item], `item ${f.item}`);
    if (f.perde) assert.ok(ITENS_SAGA[f.perde], `perde ${f.perde}`);
    if (f.dom) assert.ok(DONS[f.dom], `dom ${f.dom}`);
    if (f.missao) assert.ok(etapaOk(f.missao), `missão ${f.missao}`);
    for (const k of Object.keys(f.rep || {})) assert.ok(FACCOES[k], `facção ${k}`);
    for (const [k, n] of f.bag || []) assert.ok(ITEMS[k] && n > 0, `item de mochila ${k}`);
  }
  for (const s of todosOsSe()) {
    if (s.item) assert.ok(ITENS_SAGA[s.item], `se.item ${s.item}`);
    if (s.semItem) assert.ok(ITENS_SAGA[s.semItem], `se.semItem ${s.semItem}`);
    if (s.missao) assert.ok(etapaOk(s.missao), `se.missao ${s.missao}`);
    if (s.falas) assert.ok(NPCS[s.falas[0]], `se.falas ${s.falas[0]}`);
    if (s.dom) assert.ok(DONS[s.dom], `se.dom ${s.dom}`);
    for (const k of [s.rep, s.repAbaixo].filter(Boolean)) assert.ok(FACCOES[k[0]], `facção ${k[0]}`);
  }
  // toda missão, item-chave e dom é dado por alguém — senão é conteúdo morto
  const dados = todosOsFaz();
  for (const id of Object.keys(MISSOES_SAGA)) assert.ok(dados.some(f => f.missao?.[0] === id && f.missao[1] === 'fim'), `missão ${id} nunca termina`);
  for (const id of Object.keys(ITENS_SAGA)) assert.ok(dados.some(f => f.item === id), `item ${id} nunca é dado`);
  for (const id of Object.keys(DONS)) assert.ok(dados.some(f => f.dom === id), `dom ${id} nunca é dado`);
});

test('estado nasce na aldeia, e o mundo só vale no modo com a flag e antes do Passo', () => {
  const S = novo(), s = estadoSaga(S);
  assert.deepEqual([s.mapa, s.x, s.y], [INICIO.mapa, ...acharChar(INICIO.mapa, INICIO.em)]);
  assert.equal(mundoAtivo(S), true);
  assert.equal(mundoAtivo(novo({ dificuldade: 'roguelike' })), false);
  s.fora = true; assert.equal(mundoAtivo(S), false);
});

test('passo: anda, esbarra em parede e em objeto, e a porta leva pro outro mapa', () => {
  const S = novo(), s = estadoSaga(S);
  const [x, y] = [s.x, s.y];
  assert.equal(passo(S, 's').tipo, 'andou'); assert.deepEqual([s.x, s.y], [x, y + 1]);
  assert.equal(passo(S, 's').tipo, 'parede'); assert.deepEqual([s.x, s.y], [x, y + 1]);   // a cerca de árvores
  // NPC bloqueia e devolve o objeto, sem sair do lugar
  const [ax, ay] = acharChar('aldeia', 'A'); s.x = ax; s.y = ay + 1;
  const r = passo(S, 'n'); assert.equal(r.tipo, 'objeto'); assert.equal(r.obj.npc, 'anciao'); assert.equal(s.y, ay + 1);
  // porta
  const [px, py] = acharChar('aldeia', '1'); s.x = px + 1; s.y = py;
  const p = passo(S, 'o'); assert.deepEqual([p.tipo, p.de, p.para], ['porta', 'aldeia', 'bosque']);
  assert.deepEqual([s.mapa, s.x, s.y], ['bosque', ...acharChar('bosque', '1')]);
});

test('árvore falsa deixa passar, e a fenda só abre com a lamparina', () => {
  const S = novo(), s = estadoSaga(S), B = MAPAS_SAGA.bosque, E = MAPAS_SAGA.estrada;
  const [tx, ty] = acharChar('bosque', 't');
  assert.equal(bloqueia(S, B, tx, ty), false);
  assert.equal(bloqueia(S, B, tx - 1, ty), true);    // a vizinha é árvore de verdade
  const [lx, ly] = acharChar('estrada', 'L');
  assert.equal(bloqueia(S, E, lx, ly), true);
  s.itens.lamparina = 1;
  assert.equal(objetoEm(S, E, lx, ly), null); assert.equal(bloqueia(S, E, lx, ly), false);
});

test('objeto com variantes: Alfa → Coração → leito vazio', () => {
  const S = novo(), s = estadoSaga(S), R = MAPAS_SAGA.ruinas, [x, y] = acharChar('ruinas', 'X');
  assert.equal(objetoEm(S, R, x, y).inimigo.id, 'alfa');
  s.flags['venceu:alfa'] = true; assert.equal(objetoEm(S, R, x, y).bau, 'coracao');
  s.flags['pegou-coracao'] = true; assert.ok(objetoEm(S, R, x, y).placa);
});

test('caminho: contorna obstáculo, termina no esbarrão e não atravessa parede', () => {
  const S = novo(), s = estadoSaga(S);
  const [ax, ay] = acharChar('aldeia', 'A');
  const dirs = caminho(S, ax, ay);
  assert.ok(dirs.length > 0);
  let ultimo; for (const d of dirs) ultimo = passo(S, d);
  assert.equal(ultimo.tipo, 'objeto'); assert.equal(ultimo.obj.npc, 'anciao');
  assert.deepEqual(caminho(S, 0, 0), []);                 // árvore da borda não é destino
  assert.deepEqual(caminho(S, s.x, s.y), []);             // já está lá
  assert.deepEqual(caminho(S, 99, 99), []);               // fora do mapa
});

test('câmera fica presa nas bordas do mapa', () => {
  const S = novo(), s = estadoSaga(S), g = MAPAS_SAGA.aldeia.grade;
  s.x = 1; s.y = 1; assert.deepEqual(camera(S), { x0: 0, y0: 0 });
  s.x = g[0].length - 2; s.y = g.length - 2;
  assert.deepEqual(camera(S), { x0: g[0].length - VISAO[0], y0: g.length - VISAO[1] });
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

test('consequência: vender o minério fecha a porta da Forja, e o final do Abismo exige confiança', () => {
  const S = novo(); aplicar(S, { missao: ['fonte', 2], item: 'coracao' });
  assert.equal(comecarConversa(S, 'lasca'), 'estranho', 'sem confiança, o Sableye não fala do Coração');
  aplicar(S, { flag: 'confianca-abismo' });
  assert.equal(comecarConversa(S, 'lasca'), 'coracao');
  assert.equal(comecarConversa(S, 'brasa'), 'coracao');
  aplicar(S, { flag: 'vendeu-minerio' });
  assert.equal(comecarConversa(S, 'brasa'), 'traida');
  // opção por tipo: só quem é do verde vê
  const no = NPCS.vo.nos.pedido;
  assert.equal(opcoesDe(S, no).length, 2);
  S.player.data.types = ['grass']; assert.equal(opcoesDe(S, no).length, 3);
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

test('dons: Passo de Sombra corta o encontro; Brasa e Casca entram no multiplicador do dano', () => {
  const S = novo(), meio = () => CHANCE_MATO * MULT_SOMBRA + 0.001;
  assert.equal(sorteiaEncontro(S, meio), true);
  S.player.dons = ['sombra']; assert.equal(sorteiaEncontro(S, meio), false);
  const ruina = { vol: { ruina: 2 } };
  assert.equal(multSaga({ dons: ['brasa'] }, ruina), MULT_RUINA * MULT_DOM_BRASA);
  assert.equal(multSaga({ dons: ['brasa'] }, { vol: {} }), 1, 'a Brasa só vale em Ruína');
  assert.equal(multSaga({}, { dons: ['casca'], vol: {} }), MULT_DOM_CASCA);
  assert.equal(multSaga({}, {}), 1);
});
