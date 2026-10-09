/* 🤝 Golpe que mira COMPANHEIRO (dados.ALVOS_ALIADOS) e golpe de APOIO (regras.golpeDeApoio).
   O que isto trava: quem RECEBE o efeito. Heal Pulse curava quem usava, Decorate subia os atributos do INIMIGO e
   Helping Hand / Coaching / Heal Bell não faziam nada — tudo porque o alvo escolhido na tela é sempre o inimigo
   em foco. A lista de quem recebe sai de golpe.alvosDoGolpe, e é ela que este arquivo testa. */
import { test } from 'node:test';
import assert from 'node:assert';
import { alvosDoGolpe, usarGolpe, fimDaRodada } from '../js/golpe.js';
import { golpeDeApoio, freshVol } from '../js/regras.js';

const mon = (nome, hp = 100, max = 100) => ({ nome, hp, stats: { hp: max }, vol: {}, data: { types: ['normal'] }, level: 50 });
// ctx de mentira: só os dois ganchos que alvosDoGolpe usa
const ctxCom = (...aliados) => ({ aliadosDe: () => aliados, oponentesDe: () => [] });

const golpe = (name, target, extra = {}) => ({ name, target, cls: 'status', stats: [], meta: {}, ...extra });

test('golpe de companheiro: `ally` escolhe UM aliado e falha sem ninguém', () => {
  const u = mon('u'), a = mon('a'), inimigo = mon('e');
  const hh = golpe('helping-hand', 'ally');
  assert.deepStrictEqual(alvosDoGolpe(u, inimigo, hh, ctxCom(a)), [a]);
  assert.deepStrictEqual(alvosDoGolpe(u, inimigo, hh, ctxCom()), []);   // lista vazia = usarGolpe narra a falha
});

test('`user-and-allies` pega o lado inteiro, e `soAliados` tira quem usou', () => {
  const u = mon('u'), a = mon('a'), inimigo = mon('e');
  assert.deepStrictEqual(alvosDoGolpe(u, inimigo, golpe('heal-bell', 'user-and-allies'), ctxCom(a)), [u, a]);
  assert.deepStrictEqual(alvosDoGolpe(u, inimigo, golpe('coaching', 'user-and-allies'), ctxCom(a)), [a]);
  assert.deepStrictEqual(alvosDoGolpe(u, inimigo, golpe('coaching', 'user-and-allies'), ctxCom()), []);
  // Heal Bell sozinho ainda cura o próprio status (é o lado inteiro, e quem usa está no lado)
  assert.deepStrictEqual(alvosDoGolpe(u, inimigo, golpe('heal-bell', 'user-and-allies'), ctxCom()), [u]);
});

test('aliado derrubado ou fora de campo não conta', () => {
  const u = mon('u'), caido = mon('caido', 0), retirado = mon('ret');
  retirado.vol.retirado = true;
  assert.deepStrictEqual(alvosDoGolpe(u, mon('e'), golpe('helping-hand', 'ally'), ctxCom(caido, retirado)), []);
});

test('golpe de apoio vai pro companheiro mais ferido, nunca pro inimigo', () => {
  const u = mon('u'), ferido = mon('ferido', 20), inteiro = mon('inteiro');
  const inimigo = mon('e', 10);
  const heal = golpe('heal-pulse', 'selected-pokemon', { meta: { heal: 50 } });
  assert.deepStrictEqual(alvosDoGolpe(u, inimigo, heal, ctxCom(inteiro, ferido)), [ferido]);
  assert.deepStrictEqual(alvosDoGolpe(u, inimigo, heal, ctxCom()), [u]);      // sozinho, cura a si mesmo
  const decorate = golpe('decorate', 'selected-pokemon', { stats: [{ stat: 'attack', change: 2 }] });
  assert.deepStrictEqual(alvosDoGolpe(u, inimigo, decorate, ctxCom(inteiro)), [inteiro]);
});

test('golpeDeApoio não confunde golpe ruim pro alvo com apoio', () => {
  assert.ok(golpeDeApoio({ cls: 'status', meta: { heal: 50 }, stats: [] }));
  assert.ok(!golpeDeApoio({ cls: 'status', meta: {}, stats: [{ stat: 'attack', change: -1 }] }));   // Growl
  assert.ok(!golpeDeApoio({ cls: 'status', meta: { ailment: 'paralysis' }, stats: [] }));           // Thunder Wave
  assert.ok(!golpeDeApoio({ cls: 'physical', meta: { heal: 50 }, stats: [] }));                     // golpe de dano com dreno
});

test('golpe de si mesmo e golpe de área seguem como antes', () => {
  const u = mon('u'), a = mon('a'), e1 = mon('e1'), e2 = mon('e2');
  const ctx = { aliadosDe: () => [a], oponentesDe: () => [e1, e2] };
  assert.deepStrictEqual(alvosDoGolpe(u, e1, golpe('swords-dance', 'user'), ctx), [e1]);   // o `dest` de executar resolve
  assert.deepStrictEqual(alvosDoGolpe(u, e1, golpe('rock-slide', 'all-opponents'), ctx), [e1, e2]);
  assert.deepStrictEqual(alvosDoGolpe(u, e1, golpe('earthquake', 'all-other-pokemon'), ctx), [e1, e2, a]);
});

/* Daqui pra baixo o motor rodando de verdade (usarGolpe): o que importa é em QUEM o efeito caiu.
   A tabela de comportamentos x motor é cobrada por tests/especiais.test.js. */
const completo = (o = {}) => ({
  level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0, moves: [],
  stats: { hp: 160, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 160, vol: freshVol(), ...o
});
const st = (name, target, o = {}) => ({ name, type: 'normal', cls: 'status', power: null, acc: null, pp: 10, ppLeft: 10, priority: 0, target, meta: {}, stats: [], ...o });
const ctxDe = (u, aliados) => ({ nome: m => m.nome, golpe: g => g.name, say: () => {}, aliadosDe: m => (m === u ? aliados : []), oponentesDe: () => [] });

test('Helping Hand reforça o golpe do companheiro, e o bônus morre no fim da rodada', async () => {
  const u = completo({ nome: 'u' }), a = completo({ nome: 'a' }), e = completo({ nome: 'e' });
  await usarGolpe(u, e, st('helping-hand', 'ally'), true, ctxDe(u, [a]));
  assert.equal(a.vol.ajuda, 1.5);
  assert.equal(u.vol.ajuda, undefined);     // o bônus é de quem RECEBE a ajuda
  fimDaRodada(a);
  assert.equal(a.vol.ajuda, undefined);
});

test('Heal Bell cura o status do lado inteiro; Coaching sobe o atributo só do companheiro', async () => {
  const u = completo({ nome: 'u', status: 'burn' }), a = completo({ nome: 'a', status: 'paralysis' }), e = completo({ nome: 'e' });
  await usarGolpe(u, e, st('heal-bell', 'user-and-allies'), true, ctxDe(u, [a]));
  assert.equal(u.status, null); assert.equal(a.status, null);

  const stats = [{ stat: 'attack', change: 1 }, { stat: 'defense', change: 1 }];
  await usarGolpe(u, e, st('coaching', 'user-and-allies', { stats, meta: { cat: 'net-good-stats' } }), true, ctxDe(u, [a]));
  assert.equal(a.vol.stages.attack, 1);
  assert.equal(u.vol.stages.attack || 0, 0);
  assert.equal(e.vol.stages.attack || 0, 0);   // o inimigo em foco nunca é o alvo deste golpe
});

test('Heal Pulse cura o companheiro ferido, não o inimigo nem quem usou', async () => {
  const u = completo({ nome: 'u', hp: 100 }), a = completo({ nome: 'a', hp: 40 }), e = completo({ nome: 'e', hp: 50 });
  await usarGolpe(u, e, st('heal-pulse', 'selected-pokemon', { meta: { heal: 50 } }), true, ctxDe(u, [a]));
  assert.equal(a.hp, 120); assert.equal(u.hp, 100); assert.equal(e.hp, 50);
});
