/* Vínculo de Batalha / Battle Bond (Ash-Greninja). Pedido do usuário, com a mesma economia da Pedra Mega: a
   conquista (1.000 golpes finais sendo Greninja) libera a COMPRA do item; segurando ele, derrubar um oponente
   vira Ash-Greninja pro resto da luta. O que dá pra testar sem rede: a conta da conquista (conquistas.js), a
   fórmula do Water Shuriken (regras.golpeDoBattleBond) e as guardas + o desfazer da troca de forma (golpe.js) —
   `virarAshGreninja` só toca a rede depois de passar todas elas, e essa parte fica de fora (mesmo recorte que
   mega.test.js faz com `megaevoluir`). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { golpeDoBattleBond, freshVol } from '../js/regras.js';
import { virarAshGreninja, desfazerAshGreninja } from '../js/golpe.js';
import { progressoConquistas, ALVOS, ESPECIES_VINCULO, vinculoLiberado } from '../js/conquistas.js';
import { ITEM_VINCULO, ITEMS } from '../js/dados.js';

test('item Vínculo de Batalha: existe, tem preço, e é EXCLUSIVO do Greninja (não entra na tabela genérica de segurados)', () => {
  const it = ITEMS[ITEM_VINCULO];
  assert.ok(it?.segurado && it.name && it.desc && it.price > 0);
  assert.ok(it.soComVinculo, 'só aparece na loja com a conquista — mesma regra da Pedra Mega/Cristal Z');
});

test('golpeDoBattleBond: Water Shuriken vira poder 20 e SEMPRE 3 acertos, só em Ash-Greninja', () => {
  const shuriken = { name: 'water-shuriken', type: 'water', power: 15, meta: { minHits: 2, maxHits: 5 } };
  const normal = golpeDoBattleBond(shuriken, { ashGreninja: false });
  assert.equal(normal, shuriken, 'sem virar, o golpe original não muda');
  const virado = golpeDoBattleBond(shuriken, { ashGreninja: true });
  assert.equal(virado.power, 20);
  assert.deepEqual([virado.meta.minHits, virado.meta.maxHits], [3, 3]);
  assert.equal(golpeDoBattleBond({ name: 'tackle', type: 'normal' }, { ashGreninja: true }).name, 'tackle', 'só mexe no Water Shuriken');
});

const BASE_GRENINJA = { hp: 72, attack: 95, defense: 67, 'special-attack': 103, 'special-defense': 71, speed: 122 };
const cheio = v => Object.fromEntries(Object.keys(BASE_GRENINJA).map(s => [s, v]));
const mon = (o = {}) => ({
  id: 658, name: 'greninja', level: 50, hp: 150, nature: 'hardy', ivs: cheio(31), evs: cheio(0),
  stats: { hp: 150, attack: 100, defense: 60, 'special-attack': 130, 'special-defense': 70, speed: 122 },
  data: { speciesName: 'greninja', base: BASE_GRENINJA }, vol: freshVol(), ...o,
});
const ctx = () => ({ nome: m => m.name, say: async () => {}, atualizar: () => {} });

test('virarAshGreninja: guardas seguram ANTES de tocar a rede (sem item, já virou, espécie errada, ou desmaiado)', async () => {
  assert.equal(await virarAshGreninja(mon({ item: null }), ctx()), false, 'sem o item, não vira');
  assert.equal(await virarAshGreninja(mon({ item: 'leftovers' }), ctx()), false, 'item errado, não vira');
  assert.equal(await virarAshGreninja(mon({ item: ITEM_VINCULO, ashGreninja: true }), ctx()), false, 'já virou nesta luta: não de novo');
  assert.equal(await virarAshGreninja(mon({ item: ITEM_VINCULO, data: { speciesName: 'frogadier', base: {} } }), ctx()), false, 'só funciona no Greninja de verdade');
  assert.equal(await virarAshGreninja(mon({ item: ITEM_VINCULO, hp: 0 }), ctx()), false, 'desmaiado não vira');
});

test('desfazerAshGreninja: devolve id/nome/dados exatamente como estavam, e limpa as marcas', () => {
  const dataOriginal = { speciesName: 'greninja', base: BASE_GRENINJA };
  const m = mon({ data: dataOriginal });
  m.ashAntes = { id: 658, name: 'greninja', data: dataOriginal };
  // como se tivesse virado: id/nome/dados trocados pro Ash-Greninja (mesma base de HP, o resto mais alto)
  m.id = 10117; m.name = 'greninja-ash'; m.data = { speciesName: 'greninja', base: { ...BASE_GRENINJA, attack: 145, 'special-attack': 153 } }; m.ashGreninja = true;
  const voltou = desfazerAshGreninja(m);
  assert.ok(voltou);
  assert.equal(m.id, 658); assert.equal(m.name, 'greninja');
  assert.equal(m.data, dataOriginal, 'volta o MESMO objeto de dados, não uma cópia');
  assert.equal(m.ashGreninja, undefined); assert.equal(m.ashAntes, undefined);
  assert.equal(desfazerAshGreninja(m), false, 'desfazer de novo não faz nada');
  assert.equal(desfazerAshGreninja(mon()), false, 'quem nunca virou é ignorado');
});

test('conquista: 1.000 golpes finais sendo Greninja liberam o Vínculo — igual à Mega, mas espécie própria', () => {
  assert.equal(ALVOS.vinculo, 1000);
  assert.deepEqual(ESPECIES_VINCULO, ['greninja']);
  const registro = { abates: { especie: { greninja: 999, pikachu: 5000 } } }; // pikachu não tem Vínculo: não deve aparecer
  const p = progressoConquistas([], registro);
  assert.deepEqual(p.vinculo.map(x => x.chave), ['greninja'], 'só espécie com Vínculo entra na lista');
  assert.equal(vinculoLiberado(p, 'greninja'), false, '999 ainda não libera');
  const p2 = progressoConquistas([], { abates: { especie: { greninja: 1000 } } });
  assert.equal(vinculoLiberado(p2, 'greninja'), true, '1000 libera');
  assert.equal(vinculoLiberado(p2, 'pikachu'), false, 'espécie sem Vínculo nunca libera, não importa quantos abates');
});
