// Sanidade das tabelas de js/dados.js: pega erro de digitação em conteúdo novo (tipo, item, zona)
// que não quebraria nada na hora — só deixaria a mecânica inerte em silêncio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATS, TYPE_PT, TC, CHART, NATURES, AIL_MSG, ST_SHORT, ITEMS, FIND_ITEMS, ZONES, FLAVOR, BOLAS, DIFICULDADES, CLASSES_TREINADOR, NOMES_TREINADOR, INICIAIS, MISSOES, REGIOES_INICIAIS, ORDENS, SPR, SPR_SHINY, ITEM_SPR, espelhar } from '../js/dados.js';
import { bolaPorNivel } from '../js/regras.js';

const TIPOS = Object.keys(TYPE_PT);

/* As imagens saem do CDN (jsDelivr), não do raw.githubusercontent — que é bloqueado em várias redes e derrubou
   TODA imagem do jogo num aparelho de verdade. `espelhar` cobre o caminho de volta: dado guardado no aparelho
   (e a resposta da própria PokéAPI) ainda traz o endereço antigo, e é traduzido na hora de desenhar. */
test('as imagens vêm do CDN, e endereço antigo guardado é traduzido', () => {
  for (const url of [SPR(4), SPR_SHINY(4), ITEM_SPR('poke-ball')]) {
    assert.match(url, /^https:\/\/cdn\.jsdelivr\.net\/gh\/PokeAPI\/sprites@master\/sprites\//, url);
  }
  const velho = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png';
  assert.equal(espelhar(velho), SPR(4), 'endereço antigo tem que virar exatamente o novo');
  assert.equal(espelhar(SPR(4)), SPR(4), 'endereço já novo não muda');
  // a API devolve `back`/`art` como null pra muita espécie: não pode virar a string "null"
  for (const vazio of [null, undefined, '']) assert.equal(espelhar(vazio), vazio);
});

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

test('ORDENS: as cinco ordens dos aliados têm nome e descrição', () => {
  assert.deepEqual(Object.keys(ORDENS), ['livre', 'fraco', 'status', 'parado', 'fora']);
  for (const o of Object.values(ORDENS)) assert.ok(o.nome && o.desc);
});

test('REGIOES_INICIAIS: 9 regiões de 3 + Especiais (Pikachu, Eevee), um nome por id', () => {
  assert.equal(REGIOES_INICIAIS.length, 10);
  for (const r of REGIOES_INICIAIS) assert.equal(r.ids.length, r.nomes.length, `${r.nome}: ids e nomes desalinhados`);
  assert.deepEqual(REGIOES_INICIAIS.at(-1).nomes, ['Pikachu', 'Eevee']);
});

test('DIFICULDADES: hoje todo modo começa só com iniciais; desmaio e pontos crescem com a dificuldade', () => {
  for (const [k, d] of Object.entries(DIFICULDADES)) assert.equal(d.especiesLivres, false, `${k} liberou espécies — decisão do usuário é só iniciais`);
  assert.equal(DIFICULDADES.easy.desmaiosLivres, null);
  for (const k of ['medium', 'hard', 'hardcore', 'randomizer']) assert.equal(DIFICULDADES[k].desmaiosLivres, 3);
  // Roguelike: permadeath — desmaiou, acabou (nem Revive salva)
  assert.deepEqual(Object.keys(DIFICULDADES).filter(k => DIFICULDADES[k].permadeath), ['roguelike']);
  assert.equal(DIFICULDADES.roguelike.desmaiosLivres, 0);
  assert.ok(DIFICULDADES.easy.multPontos < DIFICULDADES.medium.multPontos && DIFICULDADES.medium.multPontos < DIFICULDADES.hard.multPontos && DIFICULDADES.hard.multPontos < DIFICULDADES.hardcore.multPontos);
  assert.ok(ITEMS.revive?.revive && ITEMS.revive.price > 0);
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

test('DIFICULDADES: Roguelike primeiro (modo principal), depois os outros cinco', () => {
  assert.deepEqual(Object.keys(DIFICULDADES), ['roguelike', 'easy', 'medium', 'hard', 'hardcore', 'randomizer']);
  assert.deepEqual(Object.keys(DIFICULDADES).filter(k => DIFICULDADES[k].desbloqueios), ['roguelike']);
  assert.equal(DIFICULDADES.roguelike.fimDeJogo, true); // ser capturado encerra a jornada
  assert.equal(DIFICULDADES.easy.nivelLivre && DIFICULDADES.easy.escolhaLivre, true);
  // Médio = Fácil com Centro pago
  const { centroGratis: gE, ...facil } = DIFICULDADES.easy, { centroGratis: gM, ...medio } = DIFICULDADES.medium;
  assert.equal(gE, true); assert.equal(gM, false);
  assert.equal(facil.semCaptura && medio.semCaptura, true);
  assert.equal(facil.nivelLivre === medio.nivelLivre && facil.escolhaLivre === medio.escolhaLivre, true);
  // só o Fácil tem Centro grátis; só o Hardcore acaba o jogo na captura
  assert.deepEqual(Object.keys(DIFICULDADES).filter(k => DIFICULDADES[k].centroGratis), ['easy']);
  assert.deepEqual(Object.keys(DIFICULDADES).filter(k => DIFICULDADES[k].fimDeJogo), ['roguelike', 'hardcore']);
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
  const chaves = ['derrotar', 'vitorias', 'amigos', 'nivel', 'chefe', 'treinadores', 'missao', 'dinheiro', 'gasto', 'evolucoes'];
  const confere = (c, onde, m = {}) => {
    assert.equal(Object.keys(c).filter(k => chaves.includes(k)).length, 1, `${onde}: condição precisa de exatamente um tipo`);
    if (c.chefe) { const z = ZONES.find(z => z.id === c.chefe); assert.ok(z && (z.chefe || z.lendarios), `${onde}: zona "${c.chefe}" sem Alfa nem lendários`); }
    if (c.chefe && m.gen) assert.equal(ZONES.find(z => z.id === c.chefe).gen, m.gen, `${onde}: Alfa de outro mapa`);
    if (c.missao) assert.ok(ids.includes(c.missao), `${onde}: missão "${c.missao}" não existe`);
    if (c.derrotar) assert.match(c.derrotar, /^[a-z0-9-]+$/, `${onde}: espécie deve ser o speciesName em minúsculas`);
  };
  for (const m of MISSOES) {
    confere(m.objetivo, `${m.id}.objetivo`, m);
    if (m.libera) confere(m.libera, `${m.id}.libera`, m);
    assert.ok(m.premio.dinheiro || m.premio.itens, `${m.id}: sem prêmio`);
    for (const k of Object.keys(m.premio.itens || {})) assert.ok(ITEMS[k], `${m.id}: prêmio "${k}" não existe em ITEMS`);
  }
  assert.ok(MISSOES.some(m => !m.libera), 'precisa haver missão visível desde o início');
});

test('ZONES: ids únicos, faixa de nível coerente, ambientação só de zona que existe', () => {
  const ids = ZONES.map(z => z.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const z of ZONES) {
    assert.ok(z.min >= 1 && z.min <= z.max && z.max <= 100, `${z.id}: faixa ${z.min}–${z.max}`);
    assert.ok(z.pool.length >= 5, `${z.id}: pouca espécie`);
    for (const p of z.pool) {
      // id acima de 10000 = forma regional (raichu-alola): na PokéAPI ela é variedade de `pokemon`, não espécie
      assert.ok(Number.isInteger(p.id) && p.id >= 1 && (p.id <= 1025 || (p.f && p.id > 10000)), `${z.id}: id ${p.id}`);
      assert.match(p.n, /^[a-z0-9-]+$/, `${z.id}: nome da espécie (speciesName) "${p.n}"`);
      assert.ok(p.p > 0, `${z.id}: peso de ${p.n}`);
    }
    assert.equal(new Set(z.pool.map(p => p.id)).size, z.pool.length, `${z.id}: espécie repetida na rota`);
    // míticos: bem raros (< 1% cada) e só nas rotas altas. O Santuário é a exceção declarada: ele só abre depois de
    // vencer a Gen e existe justamente pra ter TODA a Gen, mítico e lendário incluídos, na raridade real de cada um.
    if (!z.posVitoria) for (const p of z.pool.filter(p => p.m)) assert.ok(p.p / z.pool.reduce((a, x) => a + x.p, 0) < 0.01 && z.min >= 30, `${z.id}: mítico ${p.n}`);
  }
  for (const k of Object.keys(FLAVOR)) assert.ok(k === 'default' || ids.includes(k), `FLAVOR.${k} não é uma zona`);
});
