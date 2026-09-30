/* Troca de tipo por golpe (Soak & cia.), Endeavor contra o chefe de evento, e a leva de itens segurados de
   30/09/2026 (Balão de Ar, Apólice de Fraqueza, Lente de Mira, ervas e frutas de aperto).
   Tudo pelo MOTOR de verdade (js/golpe.js) — é o único jeito de provar que o efeito acontece em jogo. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usarGolpe, mudarEstagios, aoEntrarEmCampo } from '../js/golpe.js';
import { freshVol, tiposDe, tiposDefensivos, multStab, noChao, typeEff } from '../js/regras.js';
import { SEGURADOS, seg, resisteDoItem } from '../js/segurados.js';
import { FRUTA_DO_TIPO, ITEMS } from '../js/dados.js';
import { prepararChefe } from '../js/boss.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const status = (name, o = {}) => golpe({ name, cls: 'status', power: null, acc: null, target: 'selected-pokemon', ...o });
const mon = (o = {}) => ({
  level: 50, ability: 'none', data: { types: ['normal'], base: { hp: 80, attack: 80, defense: 80, 'special-attack': 80, 'special-defense': 80, speed: 80 }, speciesName: 'x' },
  status: null, sleep: 0, item: null,
  stats: { hp: 160, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 160, moves: [golpe()], vol: freshVol(), ...o
});
const ctx = (extra = {}) => { const msgs = []; return { msgs, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(String(t)); }, ...extra }; };

/* ---------- Soak e a fonte única de tipo ---------- */
test('Soak: o alvo vira Água pura, e isso vale pra defesa, STAB, terreno e status', async () => {
  const u = mon(), t = mon({ data: { ...mon().data, types: ['grass', 'poison'] } }), c = ctx();
  await usarGolpe(u, t, status('soak'), true, c);
  assert.deepEqual(tiposDe(t), ['water']);
  assert.deepEqual(tiposDefensivos(t), ['water'], 'a defesa passa a ser de Água');
  // Elétrico era neutro contra Grama/Venenoso; contra Água puro vira super efetivo
  assert.equal(typeEff('electric', tiposDefensivos(t)), 2);
  assert.equal(multStab(t, 'water'), 1.5, 'quem virou Água ganha STAB em golpe de Água');
  assert.ok(c.msgs.some(m => m.includes('Água')));
});

test('Soak: NÃO escreve em m.data (que é do cache e é compartilhado pela espécie)', async () => {
  const compartilhado = { types: ['grass'], base: {}, speciesName: 'oddish' };
  const a = mon({ data: compartilhado }), b = mon({ data: compartilhado });
  await usarGolpe(mon(), a, status('soak'), true, ctx());
  assert.deepEqual(compartilhado.types, ['grass'], 'o objeto do cache foi alterado — contaminaria a espécie toda');
  assert.deepEqual(tiposDe(b), ['grass'], 'o outro Pokémon da mesma espécie mudou de tipo junto');
});

test('Soak: some no fim da batalha (mora no vol) e falha em quem já é Água pura', async () => {
  const t = mon({ data: { ...mon().data, types: ['water'] } }), c = ctx();
  await usarGolpe(mon(), t, status('soak'), true, c);
  assert.ok(c.msgs.some(m => m.includes('falhou')), 'Soak em Água pura deveria falhar');

  const t2 = mon(); await usarGolpe(mon(), t2, status('soak'), true, ctx());
  assert.deepEqual(tiposDe(t2), ['water']);
  t2.vol = freshVol();                                   // é o que batalha.endBattle faz
  assert.deepEqual(tiposDe(t2), ['normal'], 'o tipo trocado tinha que sumir com o vol');
});

test('Trick-or-Treat ACRESCENTA um tipo; Soak em quem terastalizou falha', async () => {
  const t = mon(); await usarGolpe(mon(), t, status('trick-or-treat'), true, ctx());
  assert.deepEqual(tiposDe(t), ['normal', 'ghost']);

  const tera = mon({ tera: 'fire' }), c = ctx();
  await usarGolpe(mon(), tera, status('soak'), true, c);
  assert.ok(c.msgs.some(m => m.includes('falhou')));
  assert.deepEqual(tiposDefensivos(tera), ['fire'], 'o Tera continua mandando na defesa');
});

test('Soak num Voador tira a imunidade a Terra e o põe no chão (terreno passa a pegar)', async () => {
  const t = mon({ data: { ...mon().data, types: ['flying'] } });
  assert.equal(noChao(t), false);
  await usarGolpe(mon(), t, status('soak'), true, ctx());
  assert.equal(noChao(t), true);
  assert.equal(typeEff('ground', tiposDefensivos(t)), 1, 'Terra deixou de ser imune');
});

/* ---------- Endeavor contra o chefe ---------- */
const chefe = () => prepararChefe(mon({ nome: 'Chefe' }), 1);

test('Endeavor no chefe passa pelas regras do chefe (não é mais atalho de vitória)', async () => {
  const c = chefe();
  const cheio = c.hp;
  const u = mon(); u.hp = 1;                       // o caso que anulava a luta: você quase morto
  await usarGolpe(u, c, golpe({ name: 'endeavor', power: null }), true, ctx());
  assert.ok(c.hp > 1, 'o chefe não pode cair pro HP do usuário de uma vez');
  assert.ok(c.hp < cheio, 'mas o golpe tem de doer de verdade');
  // a couraça de energia precisa ter absorvido: o dano bruto seria (cheio - 1)
  assert.ok(cheio - c.hp < cheio - 1, 'o dano passou inteiro, sem a redução da couraça');
});

test('Endeavor fora do chefe continua igualando o HP, como nos jogos', async () => {
  const u = mon(), t = mon(); u.hp = 40; t.hp = 150;
  await usarGolpe(u, t, golpe({ name: 'endeavor', power: null }), true, ctx());
  assert.equal(t.hp, 40);
});

test('Endeavor falha contra quem tem HP menor ou igual', async () => {
  const u = mon(), t = mon(), c = ctx(); u.hp = 100; t.hp = 60;
  await usarGolpe(u, t, golpe({ name: 'endeavor', power: null }), true, c);
  assert.equal(t.hp, 60);
  assert.ok(c.msgs.some(m => m.includes('falhou')));
});

/* ---------- itens novos ---------- */
test('Balão de Ar: flutua (imune a Terra e fora do terreno) e estoura no primeiro golpe que acerta', async () => {
  const t = mon({ item: 'air-balloon' });
  await aoEntrarEmCampo([t], () => [], ctx());
  assert.equal(t.vol.balao, true);
  assert.equal(noChao(t), false, 'quem flutua não sente o terreno');

  const c1 = ctx();
  await usarGolpe(mon(), t, golpe({ name: 'earthquake', type: 'ground', power: 100 }), true, c1);
  assert.equal(t.hp, 160, 'golpe Terrestre não podia acertar quem está de balão');
  assert.ok(c1.msgs.some(m => m.includes('flutuando')));

  const c2 = ctx();
  await usarGolpe(mon(), t, golpe(), true, c2);           // golpe Normal: acerta e estoura o balão
  assert.ok(t.hp < 160);
  assert.equal(t.item, null); assert.ok(!t.vol.balao);
  assert.ok(c2.msgs.some(m => m.includes('estourou')));

  const c3 = ctx();                                  // sem balão, agora o Terrestre pega
  await usarGolpe(mon(), t, golpe({ name: 'earthquake', type: 'ground', power: 100 }), true, c3);
  assert.ok(!c3.msgs.some(m => m.includes('flutuando')));
});

test('Apólice de Fraqueza sobe Ataque e At. Especial só com golpe SUPER EFETIVO, e se gasta', async () => {
  const t = mon({ item: 'weakness-policy', data: { ...mon().data, types: ['grass'] } });
  await usarGolpe(mon(), t, golpe({ type: 'normal' }), true, ctx());          // neutro: não reage
  assert.equal(t.vol.stages.attack, 0);
  assert.equal(t.item, 'weakness-policy');

  await usarGolpe(mon(), t, golpe({ name: 'ember', type: 'fire', power: 40 }), true, ctx());   // super efetivo
  assert.equal(t.vol.stages.attack, 2);
  assert.equal(t.vol.stages['special-attack'], 2);
  assert.equal(t.item, null, 'a apólice tinha que se gastar');
});

test('Erva Branca desfaz a queda de atributo uma vez; Erva Mental livra da Provocação', async () => {
  const m = mon({ item: 'white-herb' }), c = ctx();
  await mudarEstagios(m, [{ stat: 'attack', change: -2 }], c, mon());
  assert.equal(m.vol.stages.attack, 0, 'a erva tinha que devolver o atributo');
  assert.equal(m.item, null);

  const t = mon({ item: 'mental-herb' }), c2 = ctx();
  t.vol.ultimo = 'tackle';
  await usarGolpe(mon(), t, status('taunt'), true, c2);
  assert.ok(!t.vol.provocado, 'a Erva Mental tinha que livrar da provocação na hora');
  assert.equal(t.item, null);
});

test('Erva do Poder faz o golpe de carga sair no mesmo turno', async () => {
  const u = mon({ item: 'power-herb' }), t = mon(), c = ctx();
  await usarGolpe(u, t, golpe({ name: 'solar-beam', type: 'grass', cls: 'special', power: 120 }), true, c);
  assert.ok(!u.vol.carregando, 'não podia ficar carregando');
  assert.ok(t.hp < 160, 'o golpe tinha que sair no mesmo turno');
  assert.equal(u.item, null);

  const u2 = mon(), t2 = mon();                        // sem a erva: carrega, como sempre
  await usarGolpe(u2, t2, golpe({ name: 'solar-beam', type: 'grass', cls: 'special', power: 120 }), true, ctx());
  assert.ok(u2.vol.carregando);
  assert.equal(t2.hp, 160);
});

test('fruta de aperto: corta pela metade só o golpe super efetivo do tipo dela, e se gasta', () => {
  const t = mon({ item: 'occa-berry' });                                  // Occa = Fogo
  assert.equal(resisteDoItem(t, 'fire', 2), 0.5, 'Fogo super efetivo tinha que ser cortado');
  assert.equal(resisteDoItem(t, 'fire', 1), 1, 'Fogo neutro não é cortado');
  assert.equal(resisteDoItem(t, 'water', 2), 1, 'outro tipo não é cortado');
});

test('fruta de aperto some depois de aparar o golpe', async () => {
  const t = mon({ item: 'occa-berry', data: { ...mon().data, types: ['grass'] } }), c = ctx();
  await usarGolpe(mon(), t, golpe({ name: 'ember', type: 'fire', power: 40 }), true, c);
  assert.equal(t.item, null);
  assert.ok(c.msgs.some(m => m.includes('aguentou melhor')));
});

test('as 17 frutas de aperto batem com a tabela de tipos e existem na loja', () => {
  assert.equal(Object.keys(FRUTA_DO_TIPO).length, 17);
  for (const [tipo, [id, nome]] of Object.entries(FRUTA_DO_TIPO)) {
    assert.ok(ITEMS[id]?.price > 0, `${id} não está à venda`);
    assert.equal(ITEMS[id].name, nome);
    assert.equal(SEGURADOS[id].resisteSE.tipo, tipo, `${id} aparava o tipo errado`);
    assert.ok(SEGURADOS[id].gastaNoUso);
  }
});

test('Lente de Mira soma um degrau de crítico', () => {
  assert.equal(seg(mon({ item: 'scope-lens' })).critExtra, 1);
});

/* A Pedra do Rei ficou DE FORA da leva, e isto guarda o porquê: `kings-rock` já é item de EVOLUÇÃO
   (Poliwhirl/Slowpoke). Pôr o mesmo id como item segurado fazia o `Object.assign` de `ITENS_EVO` — que roda
   depois — vencer em silêncio, e o efeito de recuo nunca acontecia. O mesmo vale pro `razor-fang`. */
test('Pedra do Rei continua sendo só item de evolução (o id não foi reaproveitado)', () => {
  assert.ok(!SEGURADOS['kings-rock'], 'kings-rock não pode ter gancho de item segurado: o id já é de evolução');
  assert.ok(!ITEMS['kings-rock'].segurado, 'kings-rock é item de evolução, não de segurar');
  assert.ok(!SEGURADOS['razor-fang'], 'razor-fang tem a mesma colisão');
});
