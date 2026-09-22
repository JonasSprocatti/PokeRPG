// Evoluções especiais (js/evolucao.js) + árvore da PokéAPI (api.js slimEvo) + itens de evolução (dados.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evolucoesPossiveis, detalheCumprido, periodoDoDia, felicidadeDe, ganharFelicidade, ganhoFelicidadeNivel, EVO_ALTERNATIVAS,
  semCaminho, comoEvolui, acharNo, FELICIDADE_EVOLUCAO } from '../js/evolucao.js';
import { slimEvo } from '../js/api.js';
import { ITEMS, ITENS_EVO, ITENS_EVO_ACHADOS } from '../js/dados.js';

const mon = (o = {}) => ({ level: 20, data: { speciesName: 'x', types: ['normal'] }, stats: { attack: 50, defense: 50 }, moves: [], hp: 50, vol: {}, ...o });
const ctx = (o = {}) => ({ gatilho: 'level-up', hora: 12, aliados: [], bag: {}, registro: {}, dinheiro: 0, ...o });
const no = (to) => ({ name: 'base', details: [], to: to.map(([name, details]) => ({ name, details, to: [] })) });

test('nível: só a partir do nível pedido', () => {
  const n = no([['ivysaur', [{ trigger: 'level-up', min_level: 16 }]]]);
  assert.deepEqual(evolucoesPossiveis(n, mon({ level: 15 }), ctx()), []);
  assert.deepEqual(evolucoesPossiveis(n, mon({ level: 16 }), ctx()).map(o => o.name), ['ivysaur']);
});

test('pedra: só com o item certo e só pelo gatilho de usar item', () => {
  const n = no([['raichu', [{ trigger: 'use-item', item: 'thunder-stone' }]]]);
  assert.equal(evolucoesPossiveis(n, mon(), ctx()).length, 0);                                    // subir de nível não basta
  assert.equal(evolucoesPossiveis(n, mon(), ctx({ gatilho: 'use-item', item: 'fire-stone' })).length, 0);
  assert.equal(evolucoesPossiveis(n, mon(), ctx({ gatilho: 'use-item', item: 'thunder-stone' }))[0].name, 'raichu');
});

test('Eevee: vínculo alto de dia → Espeon, à noite → Umbreon', () => {
  const n = no([['espeon', [{ trigger: 'level-up', min_happiness: 160, time_of_day: 'day' }]], ['umbreon', [{ trigger: 'level-up', min_happiness: 160, time_of_day: 'night' }]]]);
  assert.equal(evolucoesPossiveis(n, mon(), ctx()).length, 0);                                    // vínculo 70 (padrão)
  const M = mon({ felicidade: 200 });
  assert.deepEqual(evolucoesPossiveis(n, M, ctx({ hora: 12 })).map(o => o.name), ['espeon']);
  assert.deepEqual(evolucoesPossiveis(n, M, ctx({ hora: 22 })).map(o => o.name), ['umbreon']);
  assert.deepEqual([periodoDoDia(6), periodoDoDia(17), periodoDoDia(18), periodoDoDia(3)], ['day', 'day', 'night', 'night']);
});

test('troca: Cabo de Conexão; item junto é gasto; parceiro na equipe', () => {
  const n = no([['steelix', [{ trigger: 'trade', held_item: 'metal-coat' }]], ['escavalier', [{ trigger: 'trade', trade_species: 'shelmet' }]]]);
  const T = ctx({ gatilho: 'trade' });
  assert.equal(evolucoesPossiveis(n, mon(), T).length, 0);
  assert.deepEqual(evolucoesPossiveis(n, mon(), { ...T, bag: { 'metal-coat': 1 } }), [{ name: 'steelix', consome: 'metal-coat' }]);
  const parceiro = { data: { speciesName: 'shelmet', types: ['bug'] } };
  assert.deepEqual(evolucoesPossiveis(n, mon(), { ...T, aliados: [parceiro] }).map(o => o.name), ['escavalier']);
});

test('golpe conhecido, tipo de golpe, aliado de um tipo, Ataque × Defesa', () => {
  const golpe = (name, type) => ({ name, type });
  assert.ok(detalheCumprido({ trigger: 'level-up', known_move: 'mimic' }, mon({ moves: [golpe('mimic', 'normal')] }), ctx()));
  assert.equal(detalheCumprido({ trigger: 'level-up', known_move: 'mimic' }, mon(), ctx()), null);
  assert.ok(detalheCumprido({ trigger: 'level-up', known_move_type: 'fairy', min_affection: 2 }, mon({ felicidade: 200, moves: [golpe('charm', 'fairy')] }), ctx()));
  assert.equal(detalheCumprido({ trigger: 'level-up', party_type: 'dark', min_level: 32 }, mon({ level: 32 }), ctx()), null);
  assert.ok(detalheCumprido({ trigger: 'level-up', party_type: 'dark', min_level: 32 }, mon({ level: 32 }), ctx({ aliados: [{ data: { speciesName: 'y', types: ['dark'] } }] })));
  assert.ok(detalheCumprido({ trigger: 'level-up', min_level: 20, relative_physical_stats: 1 }, mon({ stats: { attack: 60, defense: 40 } }), ctx()));
  assert.equal(detalheCumprido({ trigger: 'level-up', min_level: 20, relative_physical_stats: 1 }, mon(), ctx()), null);
});

test('item segurado ao subir de nível (Sneasel + Razor Claw à noite)', () => {
  const d = { trigger: 'level-up', held_item: 'razor-claw', time_of_day: 'night' };
  assert.equal(detalheCumprido(d, mon(), ctx({ hora: 22 })), null);
  assert.deepEqual(detalheCumprido(d, mon(), ctx({ hora: 22, bag: { 'razor-claw': 1 } })), { consome: 'razor-claw' });
  assert.equal(detalheCumprido(d, mon(), ctx({ hora: 10, bag: { 'razor-claw': 1 } })), null);
});

test('não suportado: local, chuva, de cabeça pra baixo, e "subir de nível" sem condição (campo magnético)', () => {
  for (const d of [{ trigger: 'level-up', location: 'mt-coronet' }, { trigger: 'level-up', min_level: 50, rain: true }, { trigger: 'level-up', min_level: 30, upside_down: true },
    { trigger: 'level-up' }, { trigger: 'shed' }, { trigger: 'other' }]) assert.equal(detalheCumprido(d, mon({ level: 99 }), ctx()), null, JSON.stringify(d));
  const magnezone = { name: 'magnezone', details: [{ trigger: 'level-up' }, { trigger: 'use-item', item: 'thunder-stone' }], to: [] };
  assert.equal(semCaminho(magnezone), false);
  assert.equal(semCaminho({ name: 'shedinja', details: [{ trigger: 'shed' }], to: [] }), true);
});

test('regras equivalentes: Goodra no nível 50, Kingambit com 3 Bisharp, Gholdengo cobra, Sirfetch\'d pós-batalha', () => {
  const alvo = name => no([[name, [{ trigger: 'other' }]]]);
  assert.equal(evolucoesPossiveis(alvo('goodra'), mon({ level: 50 }), ctx())[0].name, 'goodra');
  assert.equal(evolucoesPossiveis(alvo('kingambit'), mon({ level: 60 }), ctx({ registro: { derrotados: { bisharp: 2 } } })).length, 0);
  assert.equal(evolucoesPossiveis(alvo('kingambit'), mon({ level: 60 }), ctx({ registro: { derrotados: { bisharp: 3 } } })).length, 1);
  assert.deepEqual(evolucoesPossiveis(alvo('gholdengo'), mon(), ctx({ dinheiro: 10000 })), [{ name: 'gholdengo', custo: 9990 }]);
  assert.equal(evolucoesPossiveis(alvo('sirfetchd'), mon({ vol: { criticos: 3 } }), ctx()).length, 0);          // não é no level-up
  assert.equal(evolucoesPossiveis(alvo('sirfetchd'), mon({ vol: { criticos: 3 } }), ctx({ gatilho: 'pos-batalha' })).length, 1);
  assert.equal(evolucoesPossiveis(alvo('runerigus'), mon({ hp: 0, vol: { danoSofrido: 80 } }), ctx({ gatilho: 'pos-batalha' })).length, 0); // desmaiou: não
  // toda regra equivalente usa item que existe no jogo
  for (const [n, ds] of Object.entries(EVO_ALTERNATIVAS)) for (const d of ds) if (d.item) assert.ok(ITEMS[d.item], `${n}: item ${d.item}`);
});

test('vínculo: começa em 70, sobe mais rápido no começo, teto 255', () => {
  const M = mon();
  assert.equal(felicidadeDe(M), 70);
  assert.deepEqual([ganhoFelicidadeNivel(70), ganhoFelicidadeNivel(150), ganhoFelicidadeNivel(230)], [5, 3, 2]);
  ganharFelicidade(M, 500); assert.equal(M.felicidade, 255);
  assert.ok(FELICIDADE_EVOLUCAO === 160);
});

test('slimEvo: guarda todas as condições; comoEvolui descreve pra ficha', () => {
  const sp = name => ({ name });
  const chain = { species: sp('eevee'), evolution_details: [], evolves_to: [
    { species: sp('vaporeon'), evolution_details: [{ trigger: sp('use-item'), item: sp('water-stone'), min_level: null, time_of_day: '' }], evolves_to: [] },
    { species: sp('umbreon'), evolution_details: [{ trigger: sp('level-up'), min_happiness: 160, time_of_day: 'night' }], evolves_to: [] }] };
  const arv = slimEvo(chain);
  assert.equal(arv.v, 2);
  assert.deepEqual(arv.to[0].details[0].item, 'water-stone');
  assert.equal(acharNo(arv, 'umbreon').name, 'umbreon');
  const txt = comoEvolui(arv, 'eevee', k => ITEMS[k]?.name || k);
  assert.deepEqual(txt, [{ name: 'vaporeon', texto: 'usar Pedra da Água' }, { name: 'umbreon', texto: 'vínculo alto, à noite' }]);
});

test('itens de evolução: nome, sprite da PokéAPI; pedras e Cabo na loja; achados não incluem o Cabo', () => {
  for (const [k, it] of Object.entries(ITENS_EVO)) {
    assert.ok(it.name && it.desc, k);
    assert.ok(it.evo || it.troca || it.segurar, `${k}: sem tipo`);
    assert.match(k, /^[a-z0-9-]+$/);
  }
  assert.ok(ITEMS['fire-stone'].price > 0 && ITEMS['linking-cord'].price > 0);
  assert.ok(!ITENS_EVO_ACHADOS.includes('linking-cord'));
});
