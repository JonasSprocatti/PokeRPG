// Itens segurados (js/segurados.js) e as divisões da mochila (js/dados.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEGURADOS, seg, temSegurado, IDS_SEGURADOS, multDanoDoItem, frutaAgora, fimDeTurnoDoItem, statusDoItem } from '../js/segurados.js';
import { ITEMS, ITENS_SEGURADOS, ITENS_RAIDE_SEGURADOS, ITENS_VANTAGEM_TIPO, PLACA_DO_TIPO, CATEGORIAS_ITEM, categoriaDoItem, porCategoria, FIND_ITEMS, TYPE_PT } from '../js/dados.js';
import { calcDamage, effStat } from '../js/regras.js';

const mon = (o = {}) => ({ level: 50, ability: 'none', data: { types: ['normal'] }, status: null, vol: { stages: {} },
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 }, hp: 100, moves: [], ...o });

test('tabela: todo item segurado da mochila tem efeito, e todo efeito tem item', () => {
  assert.deepEqual(Object.keys(SEGURADOS).sort(), IDS_SEGURADOS.sort());
  for (const [k, it] of Object.entries(ITENS_SEGURADOS)) {
    assert.ok(it.segurado && it.name && it.desc && it.price > 0, k);
    assert.ok(ITEMS[k], `${k} não entrou em ITEMS`);
  }
  // prêmios de raide (boss.js): mesma coisa, mas SEM preço — não vendem na loja, só vêm de vencer o chefe da semana
  for (const [k, it] of Object.entries(ITENS_RAIDE_SEGURADOS)) {
    assert.ok(it.segurado && it.name && it.desc && !it.price, k);
    assert.ok(ITEMS[k], `${k} não entrou em ITEMS`);
    assert.ok(SEGURADOS[k], `${k} não tem gancho em SEGURADOS`);
  }
  // pratos do Arceus (badges.js): idem — só vêm da badge "Especialista em X", nunca da loja
  for (const [k, it] of Object.entries(ITENS_VANTAGEM_TIPO)) {
    assert.ok(it.segurado && it.name && it.desc && !it.price, k);
    assert.ok(ITEMS[k], `${k} não entrou em ITEMS`);
    assert.ok(SEGURADOS[k], `${k} não tem gancho em SEGURADOS`);
  }
  const ganchos = new Set(['multDano', 'soFisico', 'soEspecial', 'soSuperEfetivo', 'multStat', 'semStatus', 'recuoPorGolpe', 'drenaDano',
    'espetos', 'aguentaCheio', 'gastaNoUso', 'curaFimTurno', 'soTipo', 'danoFimTurno', 'curaEm', 'curaStatus', 'danoTipo', 'resisteTipo', 'statusFimTurno',
    'quickClaw', 'choice', 'eviolite', 'cartaoVermelho']);
  for (const [k, s] of Object.entries(SEGURADOS)) {
    for (const g of Object.keys(s)) assert.ok(ganchos.has(g), `${k}: gancho "${g}"`);
    for (const t of [...(s.danoTipo?.tipos || []), ...(s.resisteTipo?.tipos || [])]) assert.ok(TYPE_PT[t], `${k}: tipo "${t}"`);
  }
  assert.equal(temSegurado(mon()), false);
  assert.equal(temSegurado(mon({ item: 'leftovers' })), true);
  assert.deepEqual(seg(mon()), {});
});

test('multiplicador de dano: Orbe da Vida sempre; Cinto só no super efetivo; Faixa/Óculos pela classe', () => {
  assert.equal(multDanoDoItem(mon({ item: 'life-orb' })), 1.3);
  assert.equal(multDanoDoItem(mon({ item: 'expert-belt' }), { ef: 1 }), 1);
  assert.equal(multDanoDoItem(mon({ item: 'expert-belt' }), { ef: 2 }), 1.2);
  assert.equal(multDanoDoItem(mon({ item: 'muscle-band' }), { fisico: true }), 1.1);
  assert.equal(multDanoDoItem(mon({ item: 'muscle-band' }), { fisico: false }), 1);
  assert.equal(multDanoDoItem(mon({ item: 'wise-glasses' }), { fisico: false }), 1.1);
  assert.equal(multDanoDoItem(mon()), 1);
});

test('o dano e os atributos realmente mudam (calcDamage / effStat)', t => {
  t.mock.method(Math, 'random', () => 0.5);
  const golpe = { name: 'tackle', type: 'normal', cls: 'physical', power: 40, meta: {} };
  const semItem = calcDamage(mon(), mon(), golpe).dmg;
  const comOrbe = calcDamage(mon({ item: 'life-orb' }), mon(), golpe).dmg;
  assert.ok(comOrbe > semItem, `${comOrbe} > ${semItem}`);
  assert.equal(effStat(mon({ item: 'assault-vest' }), 'special-defense'), 150);
  assert.equal(effStat(mon(), 'special-defense'), 100);
});

test('prêmios de raide: Núcleo Eternamax (dano por tipo) e Escama do Céu/Cristal Psíquico/Gélido (resiste por tipo)', t => {
  t.mock.method(Math, 'random', () => 0.5);
  const dragao = { name: 'dragon-claw', type: 'dragon', cls: 'physical', power: 80, meta: {} };
  const normal = { name: 'tackle', type: 'normal', cls: 'physical', power: 80, meta: {} };
  const semItemDragao = calcDamage(mon(), mon(), dragao).dmg;
  const comNucleoDragao = calcDamage(mon({ item: 'nucleo-eternamax' }), mon(), dragao).dmg;
  assert.ok(comNucleoDragao > semItemDragao, `Núcleo Eternamax devia bater mais forte em Dragão: ${comNucleoDragao} vs ${semItemDragao}`);
  const semItemNormal = calcDamage(mon(), mon(), normal).dmg;
  assert.equal(calcDamage(mon({ item: 'nucleo-eternamax' }), mon(), normal).dmg, semItemNormal, 'Núcleo Eternamax não afeta golpe Normal');
  assert.equal(effStat(mon({ item: 'nucleo-eternamax' }), 'defense'), 80, 'Núcleo Eternamax reduz a própria Defesa em 20%');

  const golpeGelo = { name: 'ice-beam', type: 'ice', cls: 'special', power: 80, meta: {} };
  const semDefesaGelo = calcDamage(mon(), mon(), golpeGelo).dmg;
  const comCristalGelido = calcDamage(mon(), mon({ item: 'cristal-gelido' }), golpeGelo).dmg;
  assert.ok(comCristalGelido < semDefesaGelo, `Cristal Gélido devia reduzir o dano de Gelo: ${comCristalGelido} vs ${semDefesaGelo}`);
  assert.equal(calcDamage(mon(), mon({ item: 'cristal-gelido' }), normal).dmg, semItemNormal, 'Cristal Gélido não afeta golpe Normal');
});

test('pratos do Arceus: golpe do tipo certo bate mais forte, do tipo errado não muda', t => {
  t.mock.method(Math, 'random', () => 0.5);
  const fogo = { name: 'ember', type: 'fire', cls: 'special', power: 60, meta: {} };
  const agua = { name: 'water-gun', type: 'water', cls: 'special', power: 60, meta: {} };
  const semItem = calcDamage(mon(), mon(), fogo).dmg;
  const comPrato = calcDamage(mon({ item: PLACA_DO_TIPO.fire }), mon(), fogo).dmg;
  assert.ok(comPrato > semItem, `Prato Chama devia bater mais forte em Fogo: ${comPrato} vs ${semItem}`);
  assert.equal(calcDamage(mon({ item: PLACA_DO_TIPO.fire }), mon(), agua).dmg, calcDamage(mon(), mon(), agua).dmg,
    'Prato Chama não afeta golpe de Água');
  // Lenço de Seda (a exceção sem prato de verdade): mesmo efeito, no tipo Normal
  const normal = { name: 'tackle', type: 'normal', cls: 'physical', power: 60, meta: {} };
  const comLenco = calcDamage(mon({ item: PLACA_DO_TIPO.normal }), mon(), normal).dmg;
  assert.ok(comLenco > calcDamage(mon(), mon(), normal).dmg, `Lenço de Seda devia bater mais forte em Normal: ${comLenco}`);
});

test('frutas: comem sozinhas na hora certa', () => {
  assert.equal(frutaAgora(mon({ item: 'oran-berry', hp: 60 })), null);          // ainda acima da metade
  assert.deepEqual(frutaAgora(mon({ item: 'oran-berry', hp: 50 })), { cura: 10 });
  assert.deepEqual(frutaAgora(mon({ item: 'sitrus-berry', hp: 40 })), { cura: 25 });
  assert.equal(frutaAgora(mon({ item: 'sitrus-berry', hp: 0 })), null);         // desmaiado não come
  assert.deepEqual(frutaAgora(mon({ item: 'lum-berry', status: 'burn' })), { curaStatus: true });
  assert.equal(frutaAgora(mon({ item: 'lum-berry' })), null);
  assert.equal(frutaAgora(mon({ hp: 10 })), null);                              // sem item
});

test('fim de turno: Restos curam; Lodo Negro cura Venenoso e machuca o resto', () => {
  assert.equal(fimDeTurnoDoItem(mon({ item: 'leftovers', hp: 50 })), 6);
  assert.equal(fimDeTurnoDoItem(mon({ item: 'leftovers' })), 0);                // HP cheio: nada a curar
  assert.equal(fimDeTurnoDoItem(mon({ item: 'black-sludge', hp: 50 })), -12);
  assert.equal(fimDeTurnoDoItem(mon({ item: 'black-sludge', hp: 50, data: { types: ['poison'] } })), 6);
  assert.equal(fimDeTurnoDoItem(mon({ hp: 50 })), 0);
});

test('statusDoItem: Orbe de Fogo/Tóxico tentam se auto-infligir status sem status atual; nunca com status', () => {
  assert.equal(statusDoItem(mon({ item: 'flame-orb' })), 'burn');
  assert.equal(statusDoItem(mon({ item: 'flame-orb', status: 'poison' })), null, 'já tem status: não tenta de novo');
  assert.equal(statusDoItem(mon({ item: 'toxic-orb' })), 'poison', "'toxic' vira 'poison' pra aplicarStatus (o vol.toxico=1 é golpe.js quem soma)");
  assert.equal(statusDoItem(mon({ item: 'leftovers' })), null, 'item sem statusFimTurno');
  assert.equal(statusDoItem(mon()), null, 'sem item');
});

test('a loja mostra os itens pra segurar (é por onde o jogador conhece a mecânica)', () => {
  const aVenda = Object.entries(ITEMS).filter(([, it]) => it.price);
  const divisoes = porCategoria(aVenda);
  const seg = divisoes.find(c => c.id === 'segurado');
  assert.ok(seg, 'a divisão 🎒 Para segurar não aparece na loja');
  // toda a tabela de segurados está à venda, mais a Pedra Mega e o Cristal Z (que também são `segurado` e entram na divisão)
  assert.ok(seg.itens.length >= Object.keys(ITENS_SEGURADOS).length, 'faltou item da tabela na loja');
  assert.equal(seg.itens.length, aVenda.filter(([, it]) => it.segurado).length);
  for (const [k] of seg.itens) assert.ok(ITEMS[k].segurado && ITEMS[k].price > 0, k);
  // uma fruta pra segurar também é achada explorando: a mecânica aparece sem precisar de dinheiro
  assert.ok(FIND_ITEMS.some(k => ITEMS[k]?.segurado), 'nenhum item pra segurar aparece explorando');
});

test('divisões da mochila: todo item cai em exatamente uma, e as vazias somem', () => {
  const ids = CATEGORIAS_ITEM.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.at(-1), 'outros');                                            // a última pega o que sobrar
  for (const [k, it] of Object.entries(ITEMS)) assert.ok(ids.includes(categoriaDoItem(it)), `${k}: sem divisão`);
  assert.equal(categoriaDoItem(ITEMS.potion), 'cura');
  assert.equal(categoriaDoItem(ITEMS['x-attack']), 'batalha');
  assert.equal(categoriaDoItem(ITEMS.leftovers), 'segurado');
  assert.equal(categoriaDoItem(ITEMS['fire-stone']), 'evolucao');
  assert.equal(categoriaDoItem(ITEMS.honey), 'petisco');
  const grupos = porCategoria([['potion', 2], ['leftovers', 1], ['honey', 3]]);
  assert.deepEqual(grupos.map(g => g.id), ['cura', 'segurado', 'petisco']);
  assert.deepEqual(grupos[0].itens, [['potion', 2]]);
});
