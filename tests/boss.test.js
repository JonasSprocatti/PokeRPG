// Chefes do evento semanal (js/boss.js) e a integração deles no motor de golpes (js/golpe.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AJUSTES, CHEFES, nivelDoChefe, prepararChefe, danoNoChefe, aposDanoNoChefe, antesDoChefeAgir, golpeCanhao, resumoDoChefe } from '../js/boss.js';
import { usarGolpe, aplicarStatus } from '../js/golpe.js';
import { freshVol } from '../js/regras.js';

const ETERNO = CHEFES['eternatus-eternamax'], RAY = CHEFES['rayquaza-mega'];
const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const mon = (o = {}) => ({
  level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0,
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, moves: [golpe()], vol: freshVol(), ...o
});
const ctx = () => { const msgs = []; return { msgs, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); } }; };
const chefe = (jogadores = 1, id = 'eternatus-eternamax') => prepararChefe(mon({ nome: 'Chefe' }), jogadores, id);

test('nível do chefe: o do jogador + 12, entre o piso e o teto', () => {
  assert.equal(nivelDoChefe(10), AJUSTES.nivelMin);
  assert.equal(nivelDoChefe(60), 72);
  assert.equal(nivelDoChefe(95), AJUSTES.nivelMax);
});

test('todo chefe tem golpe carregado, ciclo e fases coerentes', () => {
  for (const [id, c] of Object.entries(CHEFES)) {
    assert.ok(c.nome && c.canhao?.name && c.canhao.power > 0 && c.canhao.rotulo, `${id}: golpe carregado`);
    assert.ok(c.ciclo >= 2 && c.cicloFase3 >= 2 && c.cicloFase3 <= c.ciclo, `${id}: ciclo (a fase 3 nunca é mais lenta)`);
    assert.equal(c.fases.length, 2, `${id}: duas mudanças de fase (66% e 33%)`);
    assert.ok(c.fases[0].abaixo > c.fases[1].abaixo, `${id}: fases em ordem decrescente de HP`);
    assert.ok(c.coura || c.pontoFraco, `${id}: precisa de ao menos uma mecânica de defesa`);
  }
});

test('preparar o chefe: HP e atributos maiores, PP sem fim, couraça cheia; mais jogadores = mais HP (mas menos que proporcional)', () => {
  const um = chefe(1), dois = chefe(2), tres = chefe(3);
  assert.equal(um.stats.hp, 100 * AJUSTES.hpMult);
  assert.equal(um.hp, um.stats.hp);
  assert.equal(um.stats.attack, Math.floor(100 * AJUSTES.statMult));
  assert.equal(um.boss.nucleo.max, Math.floor(um.stats.hp * ETERNO.coura.fracao));
  assert.equal(um.boss.nucleo.ativo, true);
  assert.equal(um.boss.id, 'eternatus-eternamax');
  assert.equal(um.chefeEvento, true);
  assert.equal(um.moves[0].ppLeft, 99, 'o chefe nunca cai no Struggle');
  assert.ok(dois.stats.hp > um.stats.hp && tres.stats.hp > dois.stats.hp);
  assert.ok(tres.stats.hp / um.stats.hp < 3, `3 jogadores: ×${tres.stats.hp / um.stats.hp}`);
});

test('couraça reduz o dano, a exposição aumenta, e sem chefe nada muda', () => {
  const t = chefe();
  assert.equal(danoNoChefe(t, 100), Math.floor(100 * ETERNO.coura.reducao));
  assert.equal(danoNoChefe(t, 1), 1, 'nunca menos que 1');
  t.boss.nucleo.ativo = false; t.boss.quebradoAcoes = 2;
  assert.equal(danoNoChefe(t, 100), Math.floor(100 * AJUSTES.exposto.mult));
  t.boss.quebradoAcoes = 0;
  assert.equal(danoNoChefe(t, 100), 100, 'sem couraça e sem exposição: dano normal');
  assert.equal(danoNoChefe(mon(), 100), 100);
});

test('o estoque da couraça zera → Ruptura', () => {
  const t = chefe();
  assert.deepEqual(aposDanoNoChefe(t, 0), []);
  t.hp -= 1;
  const ef = aposDanoNoChefe(t, t.boss.nucleo.max);
  assert.ok(ef.some(e => /RUPTURA/.test(e.dizer || '')));
  assert.equal(t.boss.nucleo.ativo, false);
  assert.equal(t.boss.quebradoAcoes, AJUSTES.exposto.acoes);
  assert.equal(resumoDoChefe(t).exposto, true);
});

test('golpe telegrafado: a cada 4 ações carrega, e na seguinte solta o Eternabeam — em todo o time (todos)', () => {
  const t = chefe();
  for (let i = 1; i <= 3; i++) { const r = antesDoChefeAgir(t); assert.ok(!r.pular && !r.golpe, `ação ${i}`); }
  const carga = antesDoChefeAgir(t);
  assert.equal(carga.pular, true);
  assert.ok(carga.efeitos.some(e => /CARREGANDO/.test(e.dizer)));
  assert.equal(resumoDoChefe(t).carregando, true);
  const solta = antesDoChefeAgir(t);
  assert.equal(solta.golpe.name, 'eternabeam');
  assert.equal(solta.golpe.power, ETERNO.canhao.power);
  assert.equal(solta.todos, true, 'no co-op o golpe carregado atinge todo mundo');
  assert.equal(t.boss.carga, null);
  assert.equal(golpeCanhao().name, 'eternabeam');
});

test('dano suficiente no turno da carga INTERROMPE o golpe, expõe o chefe e ele perde a ação', () => {
  const t = chefe();
  for (let i = 0; i < 4; i++) antesDoChefeAgir(t);          // 4ª ação: carregando
  const lim = t.boss.carga.lim;
  t.hp -= lim;
  const ef = aposDanoNoChefe(t, lim);
  assert.ok(ef.some(e => /INTERROMPIDO/.test(e.dizer || '')));
  assert.equal(t.boss.nucleo.ativo, false, 'o choque quebra a couraça');
  const r = antesDoChefeAgir(t);
  assert.equal(r.pular, true, 'atordoado');
  assert.equal(r.golpe, undefined, 'e o Eternabeam não sai');
});

test('dano pequeno demais não interrompe', () => {
  const t = chefe();
  for (let i = 0; i < 4; i++) antesDoChefeAgir(t);
  t.hp -= 1;
  aposDanoNoChefe(t, 1);
  assert.equal(t.boss.carga.interrompida, false);
  assert.equal(antesDoChefeAgir(t).golpe.name, 'eternabeam');
});

test('fases: em 66% e 33% a couraça se refaz, atributos sobem e o golpe telegrafado acelera', () => {
  const t = chefe();
  t.boss.nucleo.pv = 3; t.boss.nucleo.ativo = true;
  t.hp = Math.floor(t.stats.hp * 0.6);                      // ≤ 66%
  t.status = 'poison';
  const ef = aposDanoNoChefe(t, 1);
  assert.equal(t.boss.fase, 2);
  assert.ok(ef.some(e => e.curaStatus) && ef.some(e => e.estagios), 'limpa status e sobe atributos');
  assert.equal(t.boss.nucleo.ativo, true); assert.equal(t.boss.nucleo.pv, t.boss.nucleo.max, 'couraça de volta ao cheio');
  t.hp = Math.floor(t.stats.hp * 0.3);                      // ≤ 33%
  aposDanoNoChefe(t, 1);
  assert.equal(t.boss.fase, 3);
  t.boss.acoes = 0; t.boss.carga = null;
  antesDoChefeAgir(t); antesDoChefeAgir(t);
  assert.equal(antesDoChefeAgir(t).pular, true, 'na 3ª ação já carrega');
});

/* ---------------- Mega Rayquaza: ponto fraco rotativo, sem couraça ---------------- */
test('Rayquaza: sem couraça, ponto fraco começa em Gelo e o golpe carregado é o Dragon Ascent', () => {
  const r = chefe(1, 'rayquaza-mega');
  assert.equal(r.boss.nucleo, null);
  assert.equal(r.boss.fraco, RAY.pontoFraco.tipos[0]);
  const s = resumoDoChefe(r);
  assert.equal(s.temCoura, false); assert.equal(s.pontoFraco, 'ice'); assert.equal(s.rotuloCarga, 'DRAGON ASCENT');
  assert.equal(golpeCanhao('rayquaza-mega').name, 'dragon-ascent');
  assert.equal(golpeCanhao('rayquaza-mega').type, 'flying');
});

test('Rayquaza: só o tipo do ponto fraco machuca de verdade; os outros são reduzidos; exposto aumenta', () => {
  const r = chefe(1, 'rayquaza-mega');
  assert.equal(danoNoChefe(r, 100, 'ice'), Math.floor(100 * RAY.pontoFraco.mult));
  assert.equal(danoNoChefe(r, 100, 'water'), Math.floor(100 * RAY.pontoFraco.contra));
  assert.equal(danoNoChefe(r, 100, null), 100, 'sem tipo informado (dano de efeito) não muda');
  r.boss.quebradoAcoes = 1;
  assert.equal(danoNoChefe(r, 100, 'ice'), Math.floor(100 * RAY.pontoFraco.mult * AJUSTES.exposto.mult));
});

test('Rayquaza: o ponto fraco gira a cada 2 ações, e depois de soltar o Dragon Ascent ele fica exposto', () => {
  const r = chefe(1, 'rayquaza-mega');
  const tipos = [];
  for (let i = 1; i <= 3; i++) { antesDoChefeAgir(r); tipos.push(r.boss.fraco); }
  assert.deepEqual(tipos, ['ice', 'ice', 'rock'], 'ações 1-2 Gelo, 3ª muda pra Pedra');
  const carga = antesDoChefeAgir(r);                       // 4ª: carrega
  assert.equal(carga.pular, true); assert.equal(r.boss.fraco, 'rock');
  const solta = antesDoChefeAgir(r);                       // 5ª: solta (e gira pra Dragão)
  assert.equal(solta.golpe.name, 'dragon-ascent'); assert.equal(solta.todos, true);
  assert.equal(r.boss.fraco, 'dragon');
  assert.equal(r.boss.quebradoAcoes, RAY.expostoAposCanhao, 'o golpe cansa: exposto até a próxima ação');
  antesDoChefeAgir(r);
  assert.equal(r.boss.quebradoAcoes, 0);
});

test('Rayquaza: interromper a carga expõe o chefe mesmo sem couraça', () => {
  const r = chefe(1, 'rayquaza-mega');
  for (let i = 0; i < 4; i++) antesDoChefeAgir(r);
  const lim = r.boss.carga.lim; r.hp -= lim;
  const ef = aposDanoNoChefe(r, lim);
  assert.ok(ef.some(e => /INTERROMPIDO/.test(e.dizer || '')));
  assert.equal(r.boss.quebradoAcoes, AJUSTES.exposto.acoes);
});

test('save antigo sem `id` no boss cai nas regras do Eternatus', () => {
  const t = chefe(); delete t.boss.id;
  assert.equal(danoNoChefe(t, 100), Math.floor(100 * ETERNO.coura.reducao));
  assert.equal(resumoDoChefe(t).rotuloCarga, 'ETERNABEAM');
});

/* ---------------- no motor de golpes ---------------- */
test('no motor: a couraça de fato reduz o dano de um golpe, e o chefe é imune a status', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvoChefe = chefe(), alvoNormal = mon({ stats: { ...mon().stats, hp: alvoChefe.stats.hp, defense: alvoChefe.stats.defense } });
  alvoNormal.hp = alvoNormal.stats.hp;
  await usarGolpe(mon(), alvoChefe, golpe(), true, ctx());
  await usarGolpe(mon(), alvoNormal, golpe(), true, ctx());
  const perdeuChefe = alvoChefe.stats.hp - alvoChefe.hp, perdeuNormal = alvoNormal.stats.hp - alvoNormal.hp;
  assert.ok(perdeuChefe >= 1 && perdeuChefe < perdeuNormal, `chefe perdeu ${perdeuChefe}, alvo comum ${perdeuNormal}`);
  await aplicarStatus(alvoChefe, 'burn', ctx(), true);
  assert.equal(alvoChefe.status, null);
});

test('no motor: no Rayquaza o golpe do tipo da vez machuca bem mais que o de outro tipo', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const doGelo = chefe(1, 'rayquaza-mega'), doAgua = chefe(1, 'rayquaza-mega');
  await usarGolpe(mon(), doGelo, golpe({ type: 'ice' }), true, ctx());     // é o ponto fraco inicial
  await usarGolpe(mon(), doAgua, golpe({ type: 'water' }), true, ctx());
  const a = doGelo.stats.hp - doGelo.hp, b = doAgua.stats.hp - doAgua.hp;
  assert.ok(a > b * 2, `Gelo tirou ${a}, Água tirou ${b}`);
});

test('no motor: o chefe carrega numa ação (sem atacar) e na seguinte o Eternabeam machuca de verdade', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const boss = chefe(), alvo = mon({ hp: 1000, stats: { ...mon().stats, hp: 1000 } }), c = ctx();
  for (let i = 0; i < 3; i++) await usarGolpe(boss, alvo, golpe(), true, c);
  const antes = alvo.hp;
  assert.ok(antes < 1000, 'as três primeiras ações atacaram');
  await usarGolpe(boss, alvo, golpe(), true, c);
  assert.equal(alvo.hp, antes, 'a 4ª ação só carregou');
  assert.ok(c.msgs.some(m => /CARREGANDO/.test(m)));
  await usarGolpe(boss, alvo, golpe(), true, c);
  assert.ok(antes - alvo.hp > 60, `o Eternabeam tirou ${antes - alvo.hp}`);
  assert.equal(boss.vol.recarga, true, 'e o chefe precisa recarregar (regra do próprio golpe)');
  assert.equal(boss.boss.soltouTodos, true, 'marca pro co-op acertar o resto do time');
});

test('no motor: `extra` acerta outro alvo com o mesmo golpe sem contar como nova ação do chefe nem cobrar a recarga', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const boss = chefe(), alvo = mon({ hp: 1000, stats: { ...mon().stats, hp: 1000 } });
  boss.vol.recarga = true;
  const acoes = boss.boss.acoes;
  await usarGolpe(boss, alvo, golpeCanhao(), true, ctx(), { extra: true });
  assert.ok(alvo.hp < 1000, 'o golpe acertou');
  assert.equal(boss.boss.acoes, acoes, 'não é uma ação nova');
  assert.equal(boss.vol.recarga, true, 'a recarga do golpe original continua valendo');
});
