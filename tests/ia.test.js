/* IA do inimigo com nota por golpe (regras.notaDoGolpe / escolhaIA com contexto).
   Antes: "maior dano ou sorteio", e golpe de status valia 0,1 pra qualquer um — o inimigo só usava Toxic, Reflect ou
   Swords Dance por sorteio. Agora cada golpe ganha uma nota do CONTEXTO (quem usa, quem apanha, o campo).
   A esperteza continua sendo a chance de "pensar"; o que muda com quem é o inimigo é QUANTO ele enxerga:
   simples (selvagem) = como sempre, basico (treinador) = dano + status que pega + cura, completo (chefe) = tudo. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escolhaIA, notaDoGolpe, nivelDaIA, golpesPermitidos, calcDamage, ESPERTEZA, freshVol } from '../js/regras.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 20, ppLeft: 20, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const st = (name, o = {}) => golpe({ name, cls: 'status', power: null, ...o });
const mon = (o = {}) => ({
  level: 50, ability: 'none', nome: 'X', status: null, sleep: 0, hp: 100, vol: freshVol(),
  data: { types: ['normal'], base: { attack: 100, 'special-attack': 100, speed: 100 } },
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 }, moves: [golpe()], ...o
});
// sorte = 0: sempre "pensa" e desempata no primeiro. `esp` escolhe o nível da IA (selvagem / treinador / chefe)
const escolhe = (u, alvo, esp, ctx = {}) => escolhaIA(golpesPermitidos(u), u.data.types, alvo.data.types, esp, () => 0, { u, alvo, campo: null, ...ctx })?.name;

const swords = st('swords-dance', { target: 'user', stats: [{ stat: 'attack', change: 2 }] });
const recover = st('recover', { target: 'user', meta: { heal: 50 } });
const twave = st('thunder-wave', { type: 'electric', acc: 90, meta: { ailment: 'paralysis' } });
const spore = st('spore', { type: 'grass', meta: { ailment: 'sleep' } });
const growl = st('growl', { stats: [{ stat: 'attack', change: -1 }] });

test('nivelDaIA: cada esperteza cai no seu degrau', () => {
  assert.equal(nivelDaIA(ESPERTEZA.selvagem), 'simples');
  assert.equal(nivelDaIA(ESPERTEZA.treinador), 'basico');
  assert.equal(nivelDaIA(ESPERTEZA.chefe), 'completo');
});

test('simples (selvagem): sem contexto ou no degrau simples, é a IA de sempre — status quase nunca', () => {
  const u = mon({ moves: [golpe({ name: 'fraco', power: 20 }), swords, golpe({ name: 'forte', power: 90 })] }), alvo = mon();
  assert.equal(escolhe(u, alvo, ESPERTEZA.selvagem), 'forte', 'selvagem pensando = maior dano bruto');
  // mesmo passando contexto: o degrau simples ignora
  assert.equal(escolhaIA(golpesPermitidos(u), ['normal'], ['normal'], ESPERTEZA.selvagem, () => 0, { u, alvo }).name, 'forte');
  assert.equal(escolhaIA(golpesPermitidos(u), ['normal'], ['normal'], 0.9, () => 0).name, 'forte', 'e sem contexto nenhum também');
});

test('dano: derrubar vale mais que o golpe "mais forte"; imunidade nunca é escolhida', () => {
  const alvo = mon({ hp: 30 });
  const u = mon({ moves: [golpe({ name: 'forte', power: 120, acc: 50 }), golpe({ name: 'seguro', power: 60 })] });
  assert.equal(escolhe(u, alvo, ESPERTEZA.treinador), 'seguro', 'o golpe que derruba com certeza vence o forte que falha metade das vezes');
  const fantasma = mon({ data: { types: ['ghost'], base: {} } });
  const u2 = mon({ moves: [golpe({ name: 'normal-forte', power: 150 }), golpe({ name: 'fraco-ghost', type: 'ghost', power: 20 })] });
  assert.equal(escolhe(u2, fantasma, ESPERTEZA.treinador), 'fraco-ghost', 'Normal não afeta Fantasma');
  const flutuante = mon({ ability: 'levitate' });
  const u3 = mon({ moves: [golpe({ name: 'terra', type: 'ground', power: 150 }), golpe({ name: 'normal', power: 30 })] });
  assert.equal(escolhe(u3, flutuante, ESPERTEZA.treinador), 'normal', 'Levitate anula Terra');
  assert.equal(escolhe(u3, mon({ ability: 'volt-absorb' }), ESPERTEZA.treinador), 'terra', 'Volt Absorb não mexe com Terra');
});

test('dano: precisão conta, e golpe de prioridade que derruba ganha bônus', () => {
  const alvo = mon({ hp: 50 });
  const u = mon({ moves: [golpe({ name: 'preciso', power: 80, acc: 100 }), golpe({ name: 'arriscado', power: 85, acc: 40 })] });
  assert.equal(escolhe(u, alvo, ESPERTEZA.treinador), 'preciso');
  const derruba = mon({ hp: 8 });
  const u2 = mon({ moves: [golpe({ name: 'forte', power: 100 }), golpe({ name: 'rapido', power: 40, priority: 1 })] });
  assert.equal(escolhe(u2, derruba, ESPERTEZA.treinador), 'rapido', 'ambos derrubam; a prioridade garante');
});

test('dano: Explosion só vale se levar o alvo junto; Solar Beam/Hyper Beam pesam os 2 turnos', () => {
  const u = mon({ moves: [golpe({ name: 'explosion', power: 250 }), golpe({ name: 'normal', power: 80 })] });
  const grande = mon({ hp: 400, stats: { hp: 400, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 } });
  assert.equal(escolhe(u, grande, ESPERTEZA.treinador), 'normal', 'não derruba (400 de HP): não se explode à toa');
  assert.equal(escolhe(u, mon({ hp: 20 }), ESPERTEZA.treinador), 'explosion', 'derruba: vale');
  const u2 = mon({ moves: [golpe({ name: 'hyper-beam', power: 150 }), golpe({ name: 'normal', power: 100 })] });
  assert.equal(escolhe(u2, mon(), ESPERTEZA.treinador), 'normal', 'recarregar custa um turno');
});

test('dano esperado é determinístico (sem crítico, sem rolagem)', () => {
  const u = mon(), alvo = mon(), g = golpe({ power: 80 });
  const a = calcDamage(u, alvo, g, null, null, null, true), b = calcDamage(u, alvo, g, null, null, null, true);
  assert.deepEqual(a, b);
  assert.equal(a.crit, false);
});

test('status (treinador): paraliza quem é mais rápido, não quem já tem status ou é imune', () => {
  const u = mon({ moves: [golpe({ name: 'fraco', power: 15 }), twave] });
  assert.equal(escolhe(u, mon({ stats: { hp: 100, speed: 200, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100 } }), ESPERTEZA.treinador), 'thunder-wave');
  assert.equal(escolhe(u, mon({ status: 'burn' }), ESPERTEZA.treinador), 'fraco', 'já tem status');
  assert.equal(escolhe(u, mon({ data: { types: ['electric'], base: {} } }), ESPERTEZA.treinador), 'fraco', 'Elétrico é imune a paralisia');
  assert.equal(escolhe(u, mon(), ESPERTEZA.treinador, { ladoAlvo: { salvaguarda: 3 } }), 'fraco', 'Safeguard protege');
});

test('status (treinador): dormir vale muito; alvo quase morto não vale o golpe', () => {
  const u = mon({ moves: [golpe({ name: 'medio', power: 45 }), spore] });
  assert.equal(escolhe(u, mon(), ESPERTEZA.treinador), 'spore');
  assert.equal(escolhe(u, mon({ hp: 12 }), ESPERTEZA.treinador), 'medio', 'vai cair de qualquer jeito');
});

test('cura: só quando o HP está baixo, e nunca com o HP cheio', () => {
  const u = mon({ moves: [golpe({ name: 'medio', power: 40 }), recover] });
  assert.equal(escolhe(u, mon(), ESPERTEZA.treinador), 'medio', 'HP cheio: curar é desperdício');
  u.hp = 30;
  assert.equal(escolhe(u, mon(), ESPERTEZA.treinador), 'recover');
  u.hp = 70;
  assert.equal(escolhe(u, mon(), ESPERTEZA.treinador), 'medio', 'ainda tem folga');
});

test('treinador NÃO enxerga buff, tela nem clima — só o chefe', () => {
  const u = mon({ moves: [golpe({ name: 'fraco', power: 5 }), swords] });
  assert.equal(escolhe(u, mon(), ESPERTEZA.treinador), 'fraco');
  assert.equal(escolhe(u, mon(), ESPERTEZA.chefe), 'swords-dance', 'o chefe se prepara');
});

test('buff (chefe): não empilha além de +2, não faz com HP baixo, e não serve a quem não usa aquele atributo', () => {
  const u = mon({ moves: [golpe({ name: 'fraco', power: 5 }), swords] }), alvo = mon();
  u.vol.stages.attack = 2;
  assert.equal(escolhe(u, alvo, ESPERTEZA.chefe), 'fraco', 'já está em +2');
  u.vol.stages.attack = 0; u.hp = 30;
  assert.equal(escolhe(u, alvo, ESPERTEZA.chefe), 'fraco', 'sem folga de HP');
  u.hp = 100;
  const soEspecial = mon({ moves: [golpe({ name: 'raio', cls: 'special', power: 5 }), swords] });
  assert.equal(escolhe(soEspecial, alvo, ESPERTEZA.chefe), 'raio', 'Swords Dance pra quem só bate especial é inútil');
});

test('debuff (chefe): Growl vale menos que um bom ataque e nada contra quem já está no chão de estágios', () => {
  const u = mon({ moves: [golpe({ name: 'bom', power: 60 }), growl] });
  assert.equal(escolhe(u, mon(), ESPERTEZA.chefe), 'bom');
  const so = mon({ moves: [golpe({ name: 'nada', power: 1 }), growl] });      // um ataque quase inútil
  assert.equal(escolhe(so, mon(), ESPERTEZA.chefe), 'growl', 'sem ataque útil, derrubar o Ataque é o melhor que tem');
  const alvo = mon(); alvo.vol.stages.attack = -2;
  assert.equal(escolhe(so, alvo, ESPERTEZA.chefe, {}), 'nada', 'já está no fundo: Growl não faz mais nada');
  assert.equal(escolhe(so, mon({ ability: 'clear-body' }), ESPERTEZA.chefe), 'nada', 'Clear Body impede');
});

test('telas, clima e terreno: nunca repete o que já está de pé', () => {
  const u = mon({ moves: [golpe({ name: 'fraco', power: 5 }), st('reflect', { target: 'users-field' })] });
  assert.equal(escolhe(u, mon(), ESPERTEZA.chefe), 'reflect');
  assert.equal(escolhe(u, mon(), ESPERTEZA.chefe, { ladoU: { reflect: 4 } }), 'fraco', 'Reflect já está no ar');
  const c = mon({ moves: [golpe({ name: 'fraco', power: 5 }), st('rain-dance', { target: 'entire-field' })] });
  assert.equal(escolhe(c, mon(), ESPERTEZA.chefe, { campo: { clima: null, turnos: 0 } }), 'rain-dance');
  assert.equal(escolhe(c, mon(), ESPERTEZA.chefe, { campo: { clima: 'chuva', turnos: 3 } }), 'fraco', 'já está chovendo');
});

test('armadilha de entrada é inútil contra o jogador (ninguém troca) — a IA sabe disso', () => {
  const u = mon({ moves: [golpe({ name: 'fraco', power: 5 }), st('stealth-rock', { target: 'opponents-field' })] });
  assert.equal(escolhe(u, mon(), ESPERTEZA.chefe), 'fraco');
});

test('Taunt só vale contra quem depende de golpe de status; Encore contra quem acabou de usar golpe fraco/status', () => {
  const taunt = st('taunt'), u = mon({ moves: [golpe({ name: 'fraco', power: 5 }), taunt] });
  const bate = mon({ moves: [golpe({ name: 'a' }), golpe({ name: 'b' })] });
  const depende = mon({ moves: [st('s1'), st('s2'), st('s3'), golpe({ name: 'a' })] });
  assert.equal(escolhe(u, bate, ESPERTEZA.chefe), 'fraco', 'quem só bate não perde nada');
  assert.equal(escolhe(u, depende, ESPERTEZA.chefe), 'taunt');
  const provocado = mon({ moves: [st('s1'), st('s2')], vol: { ...freshVol(), provocado: 2 } });
  assert.equal(escolhe(u, provocado, ESPERTEZA.chefe), 'fraco', 'já está provocado');
  const encore = st('encore'), u2 = mon({ moves: [golpe({ name: 'fraco', power: 5 }), encore] });
  const buffou = mon({ moves: [swords, golpe({ name: 'forte', power: 100 })] }); buffou.vol.ultimo = 'swords-dance';
  assert.equal(escolhe(u2, buffou, ESPERTEZA.chefe), 'encore', 'preso num golpe de buff');
  const bateu = mon({ moves: [swords, golpe({ name: 'forte', power: 100 })] }); bateu.vol.ultimo = 'forte';
  assert.equal(escolhe(u2, bateu, ESPERTEZA.chefe), 'fraco', 'repetir um golpe forte só ajudaria o alvo');
});

test('proteção: nunca duas seguidas', () => {
  const u = mon({ moves: [golpe({ name: 'fraco', power: 5 }), st('protect', { target: 'user' })] });
  u.vol.protSeguidas = 1;
  assert.equal(escolhe(u, mon(), ESPERTEZA.chefe), 'fraco');
});

test('Toxic e Leech Seed: valem contra quem pode levar, não contra quem já está envenenado/semeado ou é Planta', () => {
  const u = mon({ moves: [golpe({ name: 'fraco', power: 5 }), st('toxic', { acc: 90 }), st('leech-seed', { acc: 90 })] });
  assert.equal(escolhe(u, mon(), ESPERTEZA.treinador), 'toxic');
  assert.equal(escolhe(u, mon({ status: 'poison' }), ESPERTEZA.chefe), 'leech-seed');
  assert.equal(escolhe(u, mon({ status: 'poison', data: { types: ['grass'], base: {} } }), ESPERTEZA.chefe), 'fraco', 'Planta é imune ao Leech Seed');
});

test('distraído (esperteza falha): sorteia, mas nunca algo absurdo como golpe imune', () => {
  const fantasma = mon({ data: { types: ['ghost'], base: {} } });
  const u = mon({ moves: [golpe({ name: 'imune-a', power: 90 }), golpe({ name: 'imune-b', power: 60 }), golpe({ name: 'serve', type: 'ghost', power: 30 })] });
  // sorte()=0.99 → não pensa; o sorteio só enxerga o que não é impossível
  for (const r of [0.99, 0.99, 0.99]) {
    const g = escolhaIA(golpesPermitidos(u), ['normal'], ['ghost'], ESPERTEZA.treinador, () => r, { u, alvo: fantasma });
    assert.equal(g.name, 'serve');
  }
  // se TUDO é impossível, sorteia mesmo assim (melhor que travar)
  const u2 = mon({ moves: [golpe({ name: 'x', power: 90 }), golpe({ name: 'y', power: 60 })] });
  assert.ok(escolhaIA(golpesPermitidos(u2), ['normal'], ['ghost'], ESPERTEZA.treinador, () => 0.99, { u: u2, alvo: fantasma }));
});

test('respeita as travas: com Taunt no inimigo, a nota nem chega a ver o golpe de status', () => {
  const u = mon({ moves: [golpe({ name: 'fraco', power: 5 }), swords] });
  u.vol.provocado = 3;
  assert.equal(escolhe(u, mon(), ESPERTEZA.chefe), 'fraco');
});

test('empate de nota: sorteia entre os empatados (não fica sempre no primeiro)', () => {
  const u = mon({ moves: [golpe({ name: 'a', power: 50 }), golpe({ name: 'b', power: 50 })] }), alvo = mon();
  const um = escolhaIA(golpesPermitidos(u), ['normal'], ['normal'], ESPERTEZA.treinador, (() => { const v = [0, 0]; return () => v.shift() ?? 0; })(), { u, alvo });
  const dois = escolhaIA(golpesPermitidos(u), ['normal'], ['normal'], ESPERTEZA.treinador, (() => { const v = [0, 0.99]; return () => v.shift() ?? 0; })(), { u, alvo });
  assert.equal(um.name, 'a'); assert.equal(dois.name, 'b');
});

test('nota de status sem regra nenhuma vale quase nada (não vira a melhor jogada por engano)', () => {
  const desconhecido = st('golpe-sem-efeito-modelado');
  const c = { u: mon(), alvo: mon(), nivel: 'completo' };
  assert.ok(notaDoGolpe(desconhecido, c) < notaDoGolpe(golpe({ power: 40 }), c));
});
