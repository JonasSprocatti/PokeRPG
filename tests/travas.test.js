/* Golpes que TRAVAM o que dá pra escolher: Taunt, Encore, Disable, Torment (+ Choice e Colete de Assalto, que
   entraram na mesma regra). A regra mora numa função só (regras.motivoBloqueio / golpesPermitidos) e é lida pelas
   três telas, pelos aliados, pela IA e pelo motor — estes testes provam a função e provam que o MOTOR a respeita,
   inclusive no caso que só o motor pega: o efeito chegando DEPOIS de o golpe já ter sido escolhido no turno. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usarGolpe, fimDeTurno } from '../js/golpe.js';
import { motivoBloqueio, golpesPermitidos, golpePermitido, golpeForcado, falhaDaTrava, passarTravas, resumoTravas,
  TRAVAS, TURNOS_TRAVA, freshVol } from '../js/regras.js';
import { acaoDaIA } from '../js/mp-motor.js';
import { GOLPES_ESPECIAIS } from '../js/especiais.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const status = (name, o = {}) => golpe({ name, cls: 'status', power: null, meta: {}, ...o });
const mon = (o = {}) => ({
  level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0, nome: 'X',
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, moves: [golpe()], vol: freshVol(), ...o
});
const ctx = () => { const msgs = []; return { msgs, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); } }; };

test('todo golpe de trava do jogo aponta para uma trava que existe', () => {
  for (const nome of ['taunt', 'encore', 'disable', 'torment']) assert.ok(TRAVAS.includes(GOLPES_ESPECIAIS[nome].trava), nome);
});

test('sem trava nenhuma, tudo com PP é permitido; sem PP não é; Struggle nunca é bloqueado', () => {
  const m = mon({ moves: [golpe({ name: 'a' }), golpe({ name: 'b', ppLeft: 0 }), status('c')] });
  assert.deepEqual(golpesPermitidos(m).map(g => g.name), ['a', 'c']);
  m.vol.provocado = 3; m.vol.tormento = true; m.vol.ultimo = 'struggle';
  assert.equal(motivoBloqueio(m, golpe({ name: 'struggle' })), null);
});

test('Taunt: só golpes de dano, e o prazo acaba', () => {
  const m = mon({ moves: [golpe({ name: 'a' }), status('growl')] });
  m.vol.provocado = 2;
  assert.deepEqual(golpesPermitidos(m).map(g => g.name), ['a']);
  assert.equal(motivoBloqueio(m, m.moves[1]).causa, 'provocado');
  assert.deepEqual(passarTravas(m), []);           // 2 → 1
  assert.deepEqual(passarTravas(m), ['provocado']);  // 1 → 0: acabou
  assert.deepEqual(golpesPermitidos(m).map(g => g.name), ['a', 'growl']);
});

test('Encore: só o golpe repetido; se ele ficar sem PP a trava fica suspensa (senão não sobraria golpe)', () => {
  const a = golpe({ name: 'a' }), b = golpe({ name: 'b' });
  const m = mon({ moves: [a, b] });
  m.vol.encore = { golpe: 'a', turnos: 3 };
  assert.deepEqual(golpesPermitidos(m).map(g => g.name), ['a']);
  assert.equal(golpeForcado(m), a);
  a.ppLeft = 0;
  assert.deepEqual(golpesPermitidos(m).map(g => g.name), ['b'], 'sem PP o Encore não prende');
  assert.equal(golpeForcado(m), null);
});

test('Disable bloqueia SÓ o golpe desativado; Torment bloqueia repetir o último', () => {
  const m = mon({ moves: [golpe({ name: 'a' }), golpe({ name: 'b' })] });
  m.vol.desativado = { golpe: 'a', turnos: 4 };
  assert.deepEqual(golpesPermitidos(m).map(g => g.name), ['b']);
  delete m.vol.desativado;
  m.vol.tormento = true; m.vol.ultimo = 'b';
  assert.deepEqual(golpesPermitidos(m).map(g => g.name), ['a']);
  assert.equal(motivoBloqueio(m, m.moves[1]).causa, 'tormento');
});

test('Choice e Colete de Assalto usam a MESMA função (antes eram 4 cópias)', () => {
  const choice = mon({ item: 'choice-band', moves: [golpe({ name: 'a' }), golpe({ name: 'b' })] });
  choice.vol.escolha = 'a';
  assert.deepEqual(golpesPermitidos(choice).map(g => g.name), ['a']);
  const colete = mon({ item: 'assault-vest', moves: [golpe({ name: 'a' }), status('s')] });
  assert.deepEqual(golpesPermitidos(colete).map(g => g.name), ['a'], 'antes o menu deixava clicar e o motor recusava');
});

test('Choice sem PP no golpe travado: ninguém é permitido → a tela mostra Struggle (não trava o jogo)', () => {
  const m = mon({ item: 'choice-band', moves: [golpe({ name: 'a', ppLeft: 0 }), golpe({ name: 'b' })] });
  m.vol.escolha = 'a';
  assert.equal(golpesPermitidos(m).length, 0);
});

test('falhaDaTrava: chefe, habilidade, repetição e falta de golpe pra repetir', () => {
  const alvo = () => mon({ moves: [golpe({ name: 'a' })] });
  assert.equal(falhaDaTrava(Object.assign(alvo(), { boss: {} }), 'provocar'), 'o chefe é imune');
  assert.match(falhaDaTrava(mon({ ability: 'oblivious' }), 'provocar'), /protege/);
  assert.equal(falhaDaTrava(mon({ ability: 'oblivious' }), 'encore') !== null, true, 'Oblivious só barra Taunt (aqui falha por não ter golpe)');
  for (const t of TRAVAS) assert.match(falhaDaTrava(mon({ ability: 'aroma-veil' }), t), /protege/, `Aroma Veil x ${t}`);
  const semUltimo = alvo();
  assert.match(falhaDaTrava(semUltimo, 'encore'), /não tem golpe/);
  assert.match(falhaDaTrava(semUltimo, 'disable'), /ainda não usou/);
  const usou = alvo(); usou.vol.ultimo = 'a';
  assert.equal(falhaDaTrava(usou, 'encore'), null);
  assert.equal(falhaDaTrava(usou, 'disable'), null);
  usou.vol.encore = { golpe: 'a', turnos: 2 };
  assert.match(falhaDaTrava(usou, 'encore'), /já está/);
  const semPP = alvo(); semPP.vol.ultimo = 'a'; semPP.moves[0].ppLeft = 0;
  assert.match(falhaDaTrava(semPP, 'encore'), /sem PP/);
  const encoreDeStruggle = alvo(); encoreDeStruggle.vol.ultimo = 'struggle';
  assert.match(falhaDaTrava(encoreDeStruggle, 'encore'), /não tem golpe/);
});

/* ---------- no motor ---------- */

test('motor: Taunt, Encore, Disable e Torment aplicam o efeito, com o prazo certo', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvo = mon({ moves: [golpe({ name: 'a' })] }); alvo.vol.ultimo = 'a';
  const c = ctx();
  await usarGolpe(mon(), alvo, status('taunt'), true, c);
  assert.equal(alvo.vol.provocado, TURNOS_TRAVA.provocar, 'alvo ainda vai agir neste turno: prazo cheio');
  await usarGolpe(mon(), alvo, status('encore'), false, c);
  assert.deepEqual(alvo.vol.encore, { golpe: 'a', turnos: TURNOS_TRAVA.encore + 1 }, 'alvo JÁ agiu: +1 pra compensar');
  await usarGolpe(mon(), alvo, status('disable'), true, c);
  assert.deepEqual(alvo.vol.desativado, { golpe: 'a', turnos: TURNOS_TRAVA.disable });
  await usarGolpe(mon(), alvo, status('torment'), true, c);
  assert.equal(alvo.vol.tormento, true);
  assert.ok(c.msgs.some(m => /provocado/.test(m)) && c.msgs.some(m => /Encore/.test(m)) && c.msgs.some(m => /desativado/.test(m)) && c.msgs.some(m => /atormentado/.test(m)));
});

test('motor: registra o último golpe usado (menos Struggle)', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon();
  await usarGolpe(u, mon(), golpe({ name: 'ember' }), true, ctx());
  assert.equal(u.vol.ultimo, 'ember');
  await usarGolpe(u, mon(), golpe({ name: 'struggle' }), true, ctx());
  assert.equal(u.vol.ultimo, 'ember', 'Struggle não conta');
});

test('motor: o efeito chegando DEPOIS da escolha faz o golpe de status falhar, sem gastar PP', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const growl = status('growl'), u = mon({ moves: [growl] }), alvo = mon();
  u.vol.provocado = 3;                       // o inimigo mais rápido acabou de provocar
  const c = ctx();
  await usarGolpe(u, alvo, growl, false, c);
  assert.equal(growl.ppLeft, 35, 'falhou antes de gastar PP');
  assert.ok(c.msgs.some(m => /provocado/.test(m)), c.msgs.join(' | '));
  assert.equal(u.vol.ultimo, undefined, 'não chegou a usar');
});

test('motor: Encore TROCA o golpe escolhido pelo repetido (como nos jogos)', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const a = golpe({ name: 'a' }), b = golpe({ name: 'b' });
  const u = mon({ moves: [a, b] }), alvo = mon();
  u.vol.encore = { golpe: 'a', turnos: 3 };
  await usarGolpe(u, alvo, b, true, ctx());        // escolheu b, mas está sob Encore de a
  assert.equal(a.ppLeft, 34, 'gastou PP do golpe repetido');
  assert.equal(b.ppLeft, 35, 'o escolhido não foi usado');
  assert.equal(u.vol.ultimo, 'a');
  assert.ok(alvo.hp < 100);
});

test('motor: Disable e Torment recusam o golpe proibido', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const a = golpe({ name: 'a' }), u = mon({ moves: [a] }), alvo = mon();
  u.vol.desativado = { golpe: 'a', turnos: 3 };
  await usarGolpe(u, alvo, a, true, ctx());
  assert.equal(alvo.hp, 100); assert.equal(a.ppLeft, 35);
  delete u.vol.desativado; u.vol.tormento = true; u.vol.ultimo = 'a';
  await usarGolpe(u, alvo, a, true, ctx());
  assert.equal(alvo.hp, 100, 'repetir sob Torment falha');
});

test('motor: a trava falha contra chefe, contra Oblivious (Taunt) e sem golpe pra repetir', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const chefe = mon({ boss: {} }); chefe.vol.ultimo = 'tackle';
  const c1 = ctx();
  await usarGolpe(mon(), chefe, status('taunt'), true, c1);
  assert.equal(chefe.vol.provocado, undefined); assert.ok(c1.msgs.some(m => /chefe é imune/.test(m)));
  const obl = mon({ ability: 'oblivious' });
  await usarGolpe(mon(), obl, status('taunt'), true, ctx());
  assert.equal(obl.vol.provocado, undefined);
  const virgem = mon(), c2 = ctx();
  await usarGolpe(mon(), virgem, status('encore'), true, c2);
  assert.equal(virgem.vol.encore, undefined); assert.ok(c2.msgs.some(m => /não tem golpe pra repetir/.test(m)));
});

test('motor: os prazos correm no fim do turno e o fim é narrado', async () => {
  const m = mon(); m.vol.provocado = 1; m.vol.encore = { golpe: 'tackle', turnos: 1 };
  const c = ctx();
  await fimDeTurno(m, c);
  assert.equal(m.vol.provocado, undefined); assert.equal(m.vol.encore, undefined);
  assert.ok(c.msgs.some(x => /não está mais provocado/.test(x)) && c.msgs.some(x => /Encore/.test(x)), c.msgs.join(' | '));
});

/* ---------- IA ---------- */

test('IA do multiplayer nunca escolhe golpe proibido (Taunt, Disable, Encore)', () => {
  const dano = golpe({ name: 'dano', power: 90 }), buff = status('swords-dance'), outro = golpe({ name: 'outro', power: 10 });
  const ia = mon({ ref: 'B0', dono: 'ia', moves: [dano, buff, outro] });
  const alvo = mon({ ref: 'A0', dono: 'p1' });
  const e = { lados: { A: [alvo], B: [ia] } };
  const sempre = (n) => { for (let i = 0; i < 40; i++) { const r = acaoDaIA(e, ia, () => i / 40, 0.5); assert.notEqual(r.golpe, -1); n(ia.moves[r.golpe]); } };
  ia.vol.provocado = 3;
  sempre(g => assert.notEqual(g.cls, 'status', 'provocada: nada de status'));
  ia.vol.provocado = 0; ia.vol.desativado = { golpe: 'dano', turnos: 3 };
  sempre(g => assert.notEqual(g.name, 'dano'));
  delete ia.vol.desativado; ia.vol.encore = { golpe: 'outro', turnos: 3 };
  sempre(g => assert.equal(g.name, 'outro'));
});

test('IA: se as travas tiram todos os golpes, cai no Struggle (-1)', () => {
  const ia = mon({ ref: 'B0', dono: 'ia', moves: [status('a'), status('b')] });
  ia.vol.provocado = 3;
  const e = { lados: { A: [mon({ ref: 'A0', dono: 'p1' })], B: [ia] } };
  assert.equal(acaoDaIA(e, ia, () => 0.1, 0.9).golpe, -1);
});

test('resumoTravas lista o que está prendendo o Pokémon (as 3 telas usam a mesma)', () => {
  const m = mon({ item: 'choice-band' });
  assert.deepEqual(resumoTravas(m), []);
  m.vol.escolha = 'ember'; m.vol.provocado = 2; m.vol.encore = { golpe: 'ember', turnos: 3 };
  m.vol.desativado = { golpe: 'tackle', turnos: 4 }; m.vol.tormento = true;
  assert.equal(resumoTravas(m).length, 5);
  assert.ok(golpePermitido(mon(), golpe()));
});
