// Sanidade das tabelas de js/dados.js: pega erro de digitação em conteúdo novo (tipo, item, zona)
// que não quebraria nada na hora — só deixaria a mecânica inerte em silêncio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATS, TYPE_PT, TC, CHART, NATURES, PINCH, ABSORB, IMPL, AIL_MSG, ST_SHORT, ITEMS, FIND_ITEMS, ZONES, FLAVOR, BOLAS, DIFICULDADES, CLASSES_TREINADOR, NOMES_TREINADOR, INICIAIS, MISSOES } from '../js/dados.js';
import { bolaPorNivel } from '../js/regras.js';

const TIPOS = Object.keys(TYPE_PT);

test('os 18 tipos estão em todas as tabelas de tipo', () => {
  assert.equal(TIPOS.length, 18);
  assert.deepEqual(Object.keys(CHART).sort(), [...TIPOS].sort());
  assert.deepEqual(Object.keys(TC).sort(), [...TIPOS].sort());
});

test('CHART: só tipos válidos, e nenhum tipo em duas listas do mesmo atacante', () => {
  for (const [atk, c] of Object.entries(CHART)) {
    const todos = [...c.se, ...c.nv, ...(c.im || [])];
    for (const t of todos) assert.ok(TIPOS.includes(t), `${atk} cita tipo desconhecido "${t}"`);
    assert.equal(new Set(todos).size, todos.length, `${atk} repete um tipo entre se/nv/im`);
  }
});

test('NATURES: 25, 5 neutras, as outras sobem e descem atributos diferentes (nunca HP)', () => {
  const lista = Object.values(NATURES);
  assert.equal(lista.length, 25);
  assert.equal(lista.filter(n => !n.length).length, 5);
  for (const n of lista.filter(n => n.length)) {
    assert.equal(n.length, 2);
    assert.notEqual(n[0], n[1]);
    for (const s of n) assert.ok(STATS.includes(s) && s !== 'hp');
  }
});

test('habilidades implementadas apontam pra tipos válidos', () => {
  for (const t of Object.values(PINCH)) assert.ok(TIPOS.includes(t));
  for (const a of Object.values(ABSORB)) assert.ok(TIPOS.includes(a.type));
  for (const k of [...Object.keys(PINCH), ...Object.keys(ABSORB)]) assert.ok(IMPL.has(k));
});

test('todo status tem mensagem e sigla', () => {
  assert.deepEqual(Object.keys(AIL_MSG).sort(), Object.keys(ST_SHORT).sort());
});

test('ITEMS: itens encontráveis existem e estágios apontam pra atributo real', () => {
  for (const k of FIND_ITEMS) assert.ok(ITEMS[k], `FIND_ITEMS cita "${k}", que não existe em ITEMS`);
  for (const [k, it] of Object.entries(ITEMS)) {
    if (it.stage) assert.ok(STATS.includes(it.stage), `${k}: estágio "${it.stage}" inválido`);
    if (Array.isArray(it.cure)) for (const s of it.cure) assert.ok(AIL_MSG[s], `${k}: cura status desconhecido "${s}"`);
  }
});

test('INICIAIS: 3 por região × 9 regiões + Pikachu e Eevee, sem repetir', () => {
  assert.equal(INICIAIS.length, 29);
  assert.equal(new Set(INICIAIS).size, 29);
  assert.ok(INICIAIS.includes(25) && INICIAIS.includes(133));
  for (const id of INICIAIS) assert.ok(Number.isInteger(id) && id >= 1 && id <= 1025);
});

test('petiscos de afinidade: cobrem os 18 tipos exatamente uma vez, e todos têm preço', () => {
  const petiscos = Object.values(ITEMS).filter(it => it.afinidade);
  assert.equal(petiscos.length, 6);
  const tipos = petiscos.flatMap(it => it.afinidade);
  assert.deepEqual([...tipos].sort(), [...TIPOS].sort());
  for (const it of petiscos) assert.ok(it.price > 0, `${it.name} sem preço`);
});

test('treinadores: toda bola sorteável existe em BOLAS; listas de nome não vazias', () => {
  for (const n of [1, 19, 20, 39, 40, 100]) assert.ok(BOLAS[bolaPorNivel(n)], `nível ${n} → bola desconhecida`);
  for (const b of Object.values(BOLAS)) assert.ok(b.mult >= 1);
  assert.ok(CLASSES_TREINADOR.length && NOMES_TREINADOR.length);
});

test('DIFICULDADES: os cinco modos e as restrições crescem com a dificuldade', () => {
  assert.deepEqual(Object.keys(DIFICULDADES), ['easy', 'medium', 'hard', 'hardcore', 'randomizer']);
  assert.equal(DIFICULDADES.easy.nivelLivre && DIFICULDADES.easy.escolhaLivre, true);
  // Médio = Fácil com Centro pago
  const { centroGratis: gE, ...facil } = DIFICULDADES.easy, { centroGratis: gM, ...medio } = DIFICULDADES.medium;
  assert.equal(gE, true); assert.equal(gM, false);
  assert.equal(facil.semCaptura && medio.semCaptura, true);
  assert.equal(facil.nivelLivre === medio.nivelLivre && facil.escolhaLivre === medio.escolhaLivre, true);
  // só o Fácil tem Centro grátis; só o Hardcore acaba o jogo na captura
  assert.deepEqual(Object.keys(DIFICULDADES).filter(k => DIFICULDADES[k].centroGratis), ['easy']);
  assert.deepEqual(Object.keys(DIFICULDADES).filter(k => DIFICULDADES[k].fimDeJogo), ['hardcore']);
  assert.equal(DIFICULDADES.hard.nivelLivre, false);
  assert.equal(DIFICULDADES.hard.escolhaLivre, true);
  assert.equal(DIFICULDADES.hardcore.nivelLivre || DIFICULDADES.hardcore.escolhaLivre, false);
  assert.equal(DIFICULDADES.randomizer.nivelLivre || DIFICULDADES.randomizer.escolhaLivre, false);
});

test('ZONES: toda zona tem nível de liberação; Alfa acima do teto da própria zona', () => {
  for (const z of ZONES) {
    assert.ok(Number.isInteger(z.libera) && z.libera >= 1, `${z.id}: libera inválido`);
    if (z.chefe) {
      assert.ok(z.chefe.nivel > z.max, `${z.id}: Alfa Nv. ${z.chefe.nivel} não passa do teto ${z.max}`);
      assert.ok(z.chefe.nome && Number.isInteger(z.chefe.id));
    }
  }
  assert.equal(ZONES[0].libera, 1); // sempre há uma zona aberta pra começar
});

test('MISSOES: ids únicos e toda referência (zona, missão, item) existe', () => {
  const ids = MISSOES.map(m => m.id), zonas = ZONES.map(z => z.id);
  assert.equal(new Set(ids).size, ids.length);
  const chaves = ['derrotar', 'vitorias', 'amigos', 'nivel', 'chefe', 'treinadores', 'missao'];
  const confere = (c, onde) => {
    assert.equal(Object.keys(c).filter(k => chaves.includes(k)).length, 1, `${onde}: condição precisa de exatamente um tipo`);
    if (c.chefe) assert.ok(zonas.includes(c.chefe) && ZONES.find(z => z.id === c.chefe).chefe, `${onde}: zona "${c.chefe}" sem Alfa`);
    if (c.missao) assert.ok(ids.includes(c.missao), `${onde}: missão "${c.missao}" não existe`);
    if (c.derrotar) assert.match(c.derrotar, /^[a-z0-9-]+$/, `${onde}: espécie deve ser o speciesName em minúsculas`);
  };
  for (const m of MISSOES) {
    confere(m.objetivo, `${m.id}.objetivo`);
    if (m.libera) confere(m.libera, `${m.id}.libera`);
    assert.ok(m.premio.dinheiro || m.premio.itens, `${m.id}: sem prêmio`);
    for (const k of Object.keys(m.premio.itens || {})) assert.ok(ITEMS[k], `${m.id}: prêmio "${k}" não existe em ITEMS`);
  }
  assert.ok(MISSOES.some(m => !m.libera), 'precisa haver missão visível desde o início');
});

test('ZONES: ids únicos, faixa de nível coerente, ambientação só de zona que existe', () => {
  const ids = ZONES.map(z => z.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const z of ZONES.filter(z => z.pool)) {
    assert.ok(z.min >= 1 && z.min <= z.max && z.max <= 100, `${z.id}: faixa ${z.min}–${z.max}`);
    assert.ok(z.pool.length > 0);
    for (const id of z.pool) assert.ok(Number.isInteger(id) && id >= 1 && id <= 1025);
  }
  for (const k of Object.keys(FLAVOR)) assert.ok(k === 'default' || ids.includes(k), `FLAVOR.${k} não é uma zona`);
});
