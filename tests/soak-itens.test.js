/* Troca de tipo por golpe (Soak & cia.), Endeavor contra o chefe de evento, e a leva de itens segurados de
   30/09/2026 (Balão de Ar, Apólice de Fraqueza, Lente de Mira, ervas e frutas de aperto).
   Tudo pelo MOTOR de verdade (js/golpe.js) — é o único jeito de provar que o efeito acontece em jogo. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usarGolpe, mudarEstagios, aoEntrarEmCampo } from '../js/golpe.js';
import { freshVol, tiposDe, tiposDefensivos, multStab, noChao, typeEff, effStat } from '../js/regras.js';
import { SEGURADOS, seg, resisteDoItem, multDanoDoItem, multStatDoItem } from '../js/segurados.js';
import { FRUTA_DO_TIPO, ITEMS, ITENS_EVO, IDS_EVO_EM_BATALHA, categoriaDoItem } from '../js/dados.js';
import { prepararChefe } from '../js/boss.js';
import { detalheCumprido } from '../js/evolucao.js';

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

/* ITENS DE DUPLA FUNÇÃO (dados.duplo): nos jogos a Pedra do Rei evolui Poliwhirl/Slowpoke E dá 10% de recuo
   segurada. A primeira tentativa duplicou o id em duas tabelas, e o `Object.assign` de `ITENS_EVO` — que roda
   depois — vencia em silêncio, deixando o efeito morto. A forma certa é UM item com as duas marcas. */
test('item duplo existe uma única vez e serve pras duas coisas', () => {
  for (const k of IDS_EVO_EM_BATALHA) {
    assert.equal(ITEMS[k], ITENS_EVO[k], `${k}: ITEMS ficou com outro objeto (id duplicado em outra tabela?)`);
    assert.ok(ITEMS[k].segurar, `${k}: perdeu a função de evoluir`);
    assert.ok(ITEMS[k].segurado, `${k}: perdeu a função de segurar`);
    assert.ok(SEGURADOS[k], `${k}: sem efeito em batalha`);
    assert.equal(categoriaDoItem(ITEMS[k]), 'evolucao', `${k}: a casa dele na loja é 💎 Evolução`);
  }
  assert.deepEqual(IDS_EVO_EM_BATALHA.sort(),
    ['deep-sea-scale', 'deep-sea-tooth', 'kings-rock', 'metal-coat', 'razor-claw', 'razor-fang']);
});

test('Pedra do Rei e Presa Afiada fazem o alvo recuar quando seguradas', async () => {
  // 10% por golpe: com 60 tentativas a chance de nunca acontecer é ~0,2% — e o teste não depende de sorteio
  // injetado porque o motor usa Math.random direto. Cada golpe é um turno novo (o flinch é limpo por rodada).
  let recuos = 0;
  for (let i = 0; i < 60; i++) {
    const u = mon({ item: 'kings-rock' }), t = mon();
    await usarGolpe(u, t, golpe(), true, ctx());
    if (t.vol.flinch) recuos++;
  }
  assert.ok(recuos > 0, 'a Pedra do Rei nunca fez o alvo recuar em 60 golpes');
  assert.ok(recuos < 40, 'recuou demais: a chance deveria ser de 10%');

  let sem = 0;
  for (let i = 0; i < 60; i++) {
    const t = mon(); await usarGolpe(mon(), t, golpe(), true, ctx());
    if (t.vol.flinch) sem++;
  }
  assert.equal(sem, 0, 'sem o item não pode haver recuo num golpe que não tem recuo próprio');
});

test('Revestimento Metálico reforça só golpe de Aço; Garra Afiada soma crítico', () => {
  const u = mon({ item: 'metal-coat' });
  assert.equal(multDanoDoItem(u, { tipo: 'steel' }), 1.2);
  assert.equal(multDanoDoItem(u, { tipo: 'fire' }), 1);
  assert.equal(seg(mon({ item: 'razor-claw' })).critExtra, 1);
});

test('Dente/Escama Abissal só valem no Clamperl (soEspecie)', () => {
  const clamperl = mon({ item: 'deep-sea-tooth', data: { ...mon().data, speciesName: 'clamperl' } });
  const outro = mon({ item: 'deep-sea-tooth', data: { ...mon().data, speciesName: 'gyarados' } });
  assert.equal(multStatDoItem(clamperl, 'special-attack'), 2);
  assert.equal(multStatDoItem(outro, 'special-attack'), 1, 'o item não podia servir a outra espécie');
  assert.ok(effStat(clamperl, 'special-attack') > effStat(outro, 'special-attack'), 'o atributo tinha que subir de verdade');
});

/* A condição de evolução por item olha a `bag` que o contexto entrega (evolucao.detalheCumprido). Quem monta
   esse contexto é `progressao.contexto`, e ele passou a INCLUIR o item da mão — senão equipar a Pedra do Rei
   travava a evolução do Poliwhirl sem explicar nada. Aqui se prova a regra pura nas duas situações. */
test('evoluir por item: vale na mochila e vale segurado (a bag do contexto inclui a mão)', () => {
  const d = { trigger: 'level-up', held_item: 'kings-rock', min_level: 1 };
  const M = mon({ level: 40, moves: [golpe()] });
  const base = { gatilho: 'level-up', hora: 12, aliados: [], registro: {}, dinheiro: 0 };

  assert.equal(detalheCumprido(d, M, { ...base, bag: {} }), null, 'sem o item em lugar nenhum, não evolui');

  const naMochila = detalheCumprido(d, M, { ...base, bag: { 'kings-rock': 1 } });
  assert.ok(naMochila, 'na mochila, evolui');
  assert.equal(naMochila.consome, 'kings-rock', 'e o item é gasto');

  // a bag que progressao.contexto monta pra quem está SEGURANDO o item (bag vazia + a mão)
  const comoNaMao = { 'kings-rock': 0 + 1 };
  assert.ok(detalheCumprido(d, M, { ...base, bag: comoNaMao }), 'segurado, também tem de evoluir');
});
