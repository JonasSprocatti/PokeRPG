// Mapas por Gen (js/mapas.js + dados gerados em js/dados-mapas.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENS, TOTAL_GENS, REVELA_DERROTADOS, genDe, rotasDaGen, escalaNivel, rotaNaJornada, sortearDaRota, taxaNaRota, textoTaxa,
  somarRegistros, pokedexDaRota, sequenciaLendaria, gensLiberadasRoguelike, entrarNaGen, ehInicialDeRegiao, tirarIniciais, especiesDaGen, MIN_POOL } from '../js/mapas.js';
import { REGIOES_INICIAIS } from '../js/dados.js';
import { zonaLiberada } from '../js/regras.js';

test('9 Gens, 10 rotas + Santuário; só a 10ª é final (com lendários); Alfa acima do teto da rota', () => {
  assert.equal(TOTAL_GENS, 9);
  assert.deepEqual(GENS.map(g => g.gen), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const g of GENS) {
    assert.equal(g.rotas.length, 11, `Gen ${g.gen}`); // 10 rotas + o Santuário pós-vitória
    g.rotas.forEach((z, i) => {
      assert.equal(z.gen, g.gen);
      assert.equal(!!z.final, i === 9, `${z.id}: só a 10ª rota é final`);
      assert.equal(!!z.posVitoria, i === 10, `${z.id}: só a 11ª é o Santuário`);
      if (z.posVitoria) { assert.ok(!z.chefe && !z.final, `${z.id}: Santuário não tem Alfa nem lendários`); return; }
      if (z.final) {
        assert.ok(z.lendarios.length >= 1 && !z.chefe, `${z.id}: final = lendários, sem Alfa`);
        for (const l of z.lendarios) assert.ok(Number.isInteger(l.id) && l.nome && l.nivel > z.max);
      } else assert.ok(z.chefe && z.chefe.nivel > z.max, `${z.id}: Alfa`);
      if (i) assert.ok(z.min >= g.rotas[i - 1].min && z.libera >= g.rotas[i - 1].libera, `${z.id}: progressão de nível`);
    });
    assert.equal(g.rotas[0].libera, 1, `Gen ${g.gen}: 1ª rota sempre aberta`);
  }
  // Kanto mantém os ids antigos (saves e missões)
  assert.deepEqual(['rota1', 'floresta', 'montelua', 'rota24', 'torre', 'safari', 'caverna'].filter(id => !rotasDaGen(1).some(z => z.id === id)), []);
  assert.equal(rotasDaGen(1).at(-1).lendarios.at(-1).nome, 'Mewtwo');
});

test('genDe: save antigo sem gen = 1; Gen inexistente cai na 1', () => {
  assert.equal(genDe({}), 1);
  assert.equal(genDe(null), 1);
  assert.equal(genDe({ gen: 4 }), 4);
  assert.equal(rotasDaGen(99), rotasDaGen(1));
});

test('escalaNivel: começo de jornada não muda; depois comprime até 100', () => {
  assert.equal(escalaNivel(30, null), 30);
  assert.equal(escalaNivel(30, 5), 30);
  assert.equal(escalaNivel(2, 60), 60);        // a 1ª rota começa no seu nível
  assert.equal(escalaNivel(75, 60), 100);      // o topo (lendário principal) vira 100
  assert.ok(escalaNivel(40, 60) > 60 && escalaNivel(40, 60) < 100);
  const z = rotasDaGen(2)[0], S = { nivelInicioGen: 60 };
  const r = rotaNaJornada(z, S);
  assert.equal(r.libera, 1);                   // 1ª rota continua aberta
  assert.ok(r.min >= 60 && r.chefe.nivel > r.max);
  assert.equal(z.min, 2);                      // não muta a original
  assert.equal(rotaNaJornada(z, {}), z);
  const f = rotaNaJornada(rotasDaGen(2).at(-1), S);
  assert.equal(f.lendarios.at(-1).nivel, 100);
});

test('sortearDaRota: pelo peso; filtro (offline) pode esvaziar', () => {
  const z = { pool: [{ id: 1, n: 'a', p: 3 }, { id: 2, n: 'b', p: 1 }] };
  assert.equal(sortearDaRota(z, null, () => 0).id, 1);
  assert.equal(sortearDaRota(z, null, () => 0.74).id, 1);
  assert.equal(sortearDaRota(z, null, () => 0.76).id, 2);
  assert.equal(sortearDaRota(z, id => id === 2, () => 0).id, 2);
  assert.equal(sortearDaRota(z, () => false), null);
  assert.equal(taxaNaRota(z, 1), 75);
  assert.equal(taxaNaRota(z, 9), 0);
  assert.equal(textoTaxa(75), '75%');
  assert.equal(textoTaxa(2.5), '2,5%');
  assert.equal(textoTaxa(0.4), '0,40%');
});

test('Pokédex da rota: ? → silhueta (enfrentou) → revelado com taxa (10 derrotados, somando jornadas)', () => {
  const z = { pool: [{ id: 16, n: 'pidgey', p: 3 }, { id: 19, n: 'rattata', p: 1 }, { id: 151, n: 'mew', p: 0.01, m: 1 }] };
  const saber = somarRegistros([{ vistos: { pidgey: 2 }, derrotados: { pidgey: 6 } }, { derrotados: { pidgey: 4, rattata: 1 } }, undefined]);
  assert.deepEqual(saber.derrotados, { pidgey: 10, rattata: 1 });
  const dex = pokedexDaRota(z, saber);
  assert.deepEqual(dex.map(p => p.estado), ['revelado', 'silhueta', 'oculto']);
  assert.equal(REVELA_DERROTADOS, 10);
  assert.ok(dex[0].taxa > 74 && dex[0].taxa < 75);
  assert.equal(dex[2].mitico, true);
});

test('sequenciaLendaria: até 3 outros + um principal SORTEADO, que herda o nível da vaga final', () => {
  const z = { lendarios: [1, 2, 3, 4, 5, 6].map(id => ({ id, nivel: id === 6 ? 75 : 68 })) };
  // o 1º sorteio escolhe o principal; os seguintes ordenam os coadjuvantes
  let k = 0; const seq = sequenciaLendaria(z, () => [0, 0.9, 0.1, 0.5, 0.2, 0.8][k++]);
  assert.equal(seq.length, 4);
  assert.equal(seq.at(-1).id, 1, 'sorte 0 = o primeiro da lista vira o chefe final');
  assert.equal(seq.at(-1).nivel, 75, 'quem cai na vaga final luta no nível dela');
  assert.equal(seq.every(l => l === seq.at(-1) || l.nivel === 68), true);
  assert.equal(seq.some(l => l.id === 1 && l !== seq.at(-1)), false, 'o principal não se repete entre os outros');
  // com outra sorte, outro lendário fecha a luta — é o que obriga a voltar ao mapa pra completar a dex
  let j = 0; const seq2 = sequenciaLendaria(z, () => [0.99, 0.1, 0.2, 0.3, 0.4, 0.5][j++]);
  assert.equal(seq2.at(-1).id, 6);
  assert.deepEqual(sequenciaLendaria({ lendarios: [{ id: 9, nivel: 75 }] }).map(l => l.id), [9]);
  assert.deepEqual(sequenciaLendaria({}), []);
});

test('Roguelike: mapa seguinte libera ao vencer a Gen (em sequência); outros modos não contam', () => {
  assert.deepEqual(gensLiberadasRoguelike([]), [1]);
  const j = (dificuldade, motivo, genVencida) => ({ dificuldade, motivo, genVencida });
  assert.deepEqual(gensLiberadasRoguelike([j('roguelike', 'venceu', 1)]), [1, 2]);
  assert.deepEqual(gensLiberadasRoguelike([j('roguelike', 'venceu', 1), j('roguelike', 'venceu', 2)]), [1, 2, 3]);
  assert.deepEqual(gensLiberadasRoguelike([j('easy', 'venceu', 3), j('roguelike', 'desmaiou', 3)]), [1]);
  // venceu a Gen e escolheu seguir no Santuário; morreu lá. A run terminou em derrota, mas a Gen vencida CONTA
  assert.deepEqual(gensLiberadasRoguelike([j('roguelike', 'desmaiou', 1)]), [1, 2]);
  assert.equal(gensLiberadasRoguelike([j('roguelike', 'venceu', 9)]).length, 9); // não passa do total
});

test('entrarNaGen: muda o mapa, guarda o nível de entrada e vai pra 1ª rota', () => {
  const S = { gen: 1, zone: 'caverna', escolhendoGen: true, player: { level: 70 } };
  entrarNaGen(S, 3);
  assert.deepEqual([S.gen, S.nivelInicioGen, S.zone, S.escolhendoGen], [3, 70, rotasDaGen(3)[0].id, undefined]);
});

/* ---- iniciais fora das rotas (menos Pikachu e Eevee) ---- */
test('nenhum inicial de região (nem evolução dele) aparece nas rotas comuns — só no Santuário', () => {
  for (const g of GENS) for (const z of g.rotas) {
    if (z.posVitoria) continue;
    for (const p of z.pool) assert.equal(ehInicialDeRegiao(p.id), false, `${p.n} (${p.id}) está no pool de ${z.id} da Gen ${g.gen}`);
  }
  // e eles TÊM de estar lá: o Santuário é o que garante que dá pra encontrar a Gen inteira
  for (const g of GENS) {
    const s = g.rotas.at(-1);
    assert.ok(s.pool.some(p => ehInicialDeRegiao(p.id)), `Santuário da Gen ${g.gen} sem inicial nenhum`);
  }
});

test('o Santuário tem TODA a Gen: nenhuma espécie do jogo fica inalcançável', () => {
  const FAIXAS = [[1, 151], [152, 251], [252, 386], [387, 493], [494, 649], [650, 721], [722, 809], [810, 905], [906, 1025]];
  for (const g of GENS) {
    const [de, ate] = FAIXAS[g.gen - 1];
    const tem = new Set(g.rotas.at(-1).pool.map(p => p.id));
    const faltam = [];
    for (let id = de; id <= ate; id++) if (!tem.has(id)) faltam.push(id);
    assert.deepEqual(faltam, [], `Gen ${g.gen}: espécies fora do Santuário`);
  }
});

test('Santuário só abre depois de vencer a Gen; as outras rotas continuam por nível', () => {
  const s = GENS[0].rotas.at(-1), comum = GENS[0].rotas[0];
  assert.equal(zonaLiberada(s, 100, { gensVencidas: [] }), false);
  assert.equal(zonaLiberada(s, 5, { gensVencidas: [1] }), true);   // nível não importa aqui
  assert.equal(zonaLiberada(s, 100, null), false);                 // sem save: trancado (padrão seguro)
  assert.equal(zonaLiberada(s, 100, { gensVencidas: [2] }), false); // vencer OUTRA Gen não abre esta
  assert.equal(zonaLiberada(comum, 100, { gensVencidas: [] }), true);
});

test('formas regionais existem e guardam a espécie separada do nome da forma', () => {
  const formas = GENS.flatMap(g => g.rotas.at(-1).pool).filter(p => p.f);
  assert.ok(formas.length >= 50, `só ${formas.length} formas regionais`);
  for (const p of formas) {
    assert.ok(p.id > 10000, `${p.f}: id de forma`);
    assert.ok(p.f.startsWith(p.n + '-'), `${p.f}: devia derivar da espécie ${p.n}`); // registro conta na espécie
    assert.match(p.f, /-(alola|galar|hisui|paldea)$/);
  }
  // a Pokédex da rota mostra o nome da FORMA, mas conta o visto/derrotado na espécie
  const dex = pokedexDaRota({ pool: [{ id: 10100, n: 'raichu', f: 'raichu-alola', p: 3 }] }, { vistos: { raichu: 1 }, derrotados: {} });
  assert.deepEqual([dex[0].nome, dex[0].n, dex[0].estado], ['raichu-alola', 'raichu', 'silhueta']);
});

test('Pikachu e Eevee continuam liberados; os 27 iniciais e as evoluções, não', () => {
  for (const id of REGIOES_INICIAIS.find(r => r.nasRotas).ids) assert.equal(ehInicialDeRegiao(id), false);
  assert.equal(ehInicialDeRegiao(26), false);   // Raichu
  assert.equal(ehInicialDeRegiao(134), false);  // Vaporeon
  for (const id of [1, 3, 4, 6, 7, 9, 152, 160, 252, 260, 387, 395, 495, 503, 650, 658, 722, 730, 810, 818, 906, 914])
    assert.equal(ehInicialDeRegiao(id), true, `${id} devia estar barrado`);
  assert.equal(ehInicialDeRegiao(10), false);   // Caterpie: o id logo depois do último Kanto
  assert.equal(ehInicialDeRegiao(151), false);  // Mew
});

test('Alfa que era inicial vira o mais raro do pool, no mesmo nível', () => {
  const fake = [{ gen: 1, rotas: [{ id: 'r', min: 2, max: 5, pool: [{ id: 4, n: 'charmander', p: 30 }, { id: 16, n: 'pidgey', p: 50 }, { id: 10, n: 'caterpie', p: 1 }], chefe: { id: 6, nome: 'Charizard', nivel: 12 } }] }];
  tirarIniciais(fake);
  const z = fake[0].rotas[0];
  assert.deepEqual(z.pool.map(p => p.n), ['pidgey', 'caterpie']);
  // id E nome mudam juntos: trocar só o id dava um Alfa chamado "Charizard" com o corpo do Caterpie (bug real)
  assert.deepEqual([z.chefe.id, z.chefe.nome, z.chefe.nivel], [10, 'Caterpie', 12]);
});

test('nome do Alfa combina com o id dele (quando o Alfa é alguém do pool da rota)', () => {
  for (const g of GENS) for (const z of g.rotas) {
    const noPool = z.chefe && z.pool.find(p => p.id === z.chefe.id);
    if (noPool) assert.equal(z.chefe.nome.toLowerCase().replace(/ /g, '-'), noPool.n, `${z.id}: Alfa "${z.chefe.nome}" é o #${z.chefe.id} (${noPool.n})`);
  }
});

test('nenhum Alfa de rota é inicial de região', () => {
  for (const g of GENS) for (const z of g.rotas)
    if (z.chefe) assert.equal(ehInicialDeRegiao(z.chefe.id), false, `${z.id}: Alfa ${z.chefe.nome}`);
});

test('rota que perdeu inicial é completada com vizinha do mesmo mapa (nunca fica magra)', () => {
  for (const g of GENS) for (const z of g.rotas) assert.ok(z.pool.length >= MIN_POOL, `${z.id}: só ${z.pool.length} espécies`);
});

test('especiesDaGen: todo o mapa, sem repetir e sem mítico', () => {
  const lista = especiesDaGen(1);
  assert.ok(lista.length > 20);
  assert.equal(new Set(lista.map(p => p.id)).size, lista.length);
  assert.equal(lista.some(p => p.m), false);
  for (const p of lista) assert.equal(ehInicialDeRegiao(p.id), false);
});
