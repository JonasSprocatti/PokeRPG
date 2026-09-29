/* O que nos jogos depende de TROCAR de Pokémon, ligado ao evento equivalente daqui (você é o Pokémon e nunca troca):
   Roar/Whirlwind/Dragon Tail/Circle Throw/Red Card e Wimp Out/Emergency Exit tiram alguém de campo (ctx.forcarSaida,
   implementado em batalha.js); Regenerator e Natural Cure agem ao vencer a luta; Mean Look & cia. impedem a fuga;
   Baton Pass passa os bônus a um aliado; Slow Start e Stakeout olham há quanto tempo o Pokémon está em campo.
   O motor NÃO sabe sair de campo: pergunta ao ctx. Aqui o ctx é um espião, e o que se prova é QUANDO o motor pede. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usarGolpe, fimDeTurno, fimDaRodada } from '../js/golpe.js';
import { proximoDoTreinador, efeitosAoVencer, effStat, calcDamage, freshVol } from '../js/regras.js';
import { HABILIDADES } from '../js/habilidades.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const st = (name, o = {}) => golpe({ name, cls: 'status', power: null, ...o });
const mon = (o = {}) => ({
  level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0, nome: 'X',
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, moves: [golpe()], vol: freshVol(), ...o
});
// ctx espião: `saidas` guarda quem o motor pediu pra tirar de campo e por quê; `resposta` é o que o "jogo" responde
const ctx = ({ resposta = true, aliados = [], semSaida = false } = {}) => {
  const msgs = [], saidas = [];
  const c = { msgs, saidas, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); }, aliadosDe: () => aliados };
  if (!semSaida) c.forcarSaida = async (m, o) => { saidas.push({ m, motivo: o.motivo }); return resposta; };
  return c;
};

/* ---------- contas puras ---------- */

test('proximoDoTreinador: em ordem quando ele desiste; sorteado quando é arrastado; nunca o atual nem quem caiu', () => {
  const eq = [mon({ hp: 0 }), mon(), mon(), mon({ hp: 0 }), mon()];
  assert.equal(proximoDoTreinador(eq, 1), 2, 'o primeiro de pé depois de tirar o atual');
  assert.equal(proximoDoTreinador(eq, 2), 1, 'o que ficou pra trás e ainda está de pé volta a valer');
  assert.equal(proximoDoTreinador(eq, 1, true, () => 0), 2);
  assert.equal(proximoDoTreinador(eq, 1, true, () => 0.99), 4, 'sorteio só entre os de pé (2 e 4)');
  assert.equal(proximoDoTreinador([mon()], 0), -1, 'equipe de um: ninguém pra mandar');
  assert.equal(proximoDoTreinador([mon(), mon({ hp: 0 })], 0, true), -1, 'o outro já caiu');
});

test('efeitosAoVencer: Regenerator recupera 1/3 (sem passar do máximo); Natural Cure só se há status', () => {
  const reg = mon({ ability: 'regenerator', hp: 40 });
  assert.equal(efeitosAoVencer(reg).cura, 33);
  assert.equal(efeitosAoVencer(mon({ ability: 'regenerator', hp: 90 })).cura, 10, 'não passa do máximo');
  assert.equal(efeitosAoVencer(mon({ ability: 'regenerator', hp: 100 })).cura, 0);
  assert.equal(efeitosAoVencer(mon({ ability: 'regenerator', hp: 0 })).cura, 0, 'quem caiu não se cura');
  assert.equal(efeitosAoVencer(mon({ ability: 'natural-cure', status: 'burn' })).limpaStatus, true);
  assert.equal(efeitosAoVencer(mon({ ability: 'natural-cure' })).limpaStatus, false);
  assert.deepEqual(efeitosAoVencer(mon({ hp: 10 })), { cura: 0, limpaStatus: false }, 'sem a habilidade, nada');
});

/* ---------- golpes que empurram ---------- */

test('Roar e Whirlwind: o motor pede a saída do ALVO; se o jogo diz que não dá, o golpe falha', async () => {
  for (const nome of ['roar', 'whirlwind']) {
    const c = ctx(), alvo = mon();
    await usarGolpe(mon(), alvo, st(nome), true, c);
    assert.equal(c.saidas.length, 1); assert.equal(c.saidas[0].m, alvo); assert.equal(c.saidas[0].motivo, 'forcada');
    assert.ok(!c.msgs.some(m => /falhou/.test(m)), nome);
  }
  const negou = ctx({ resposta: false });
  await usarGolpe(mon(), mon(), st('roar'), true, negou);
  assert.ok(negou.msgs.some(m => /Mas falhou/.test(m)), 'Alfa, lendário e chefe da semana não saem: o golpe falha');
});

test('em luta de sala (ctx sem forcarSaida) o golpe avisa que não funciona ali, em vez de fingir', async () => {
  const c = ctx({ semSaida: true });
  await usarGolpe(mon(), mon(), st('roar'), true, c);
  assert.ok(c.msgs.some(m => /luta de sala/.test(m)), c.msgs.join(' | '));
});

test('Dragon Tail e Circle Throw: causam o dano E depois empurram; se o alvo caiu, não há a quem empurrar', async () => {
  for (const nome of ['dragon-tail', 'circle-throw']) {
    const c = ctx(), alvo = mon();
    await usarGolpe(mon(), alvo, golpe({ name: nome, power: 60 }), true, c);
    assert.ok(alvo.hp < 100, 'o dano vem antes');
    assert.equal(c.saidas.length, 1); assert.equal(c.saidas[0].m, alvo);
    const c2 = ctx(), fraco = mon({ hp: 1 });
    await usarGolpe(mon(), fraco, golpe({ name: nome, power: 60 }), true, c2);
    assert.equal(c2.saidas.length, 0, `${nome}: quem desmaiou não é empurrado`);
  }
});

/* ---------- item ---------- */

test('Cartão Vermelho: quem acerta o portador é tirado de campo e o cartão se gasta; portador que cai não usa', async () => {
  const c = ctx(), atacante = mon({ nome: 'A' }), portador = mon({ item: 'red-card', nome: 'P' });
  await usarGolpe(atacante, portador, golpe({ power: 40 }), true, c);
  assert.equal(c.saidas.length, 1); assert.equal(c.saidas[0].m, atacante, 'quem atacou é que sai');
  assert.equal(portador.item, null, 'gastou');
  const c2 = ctx(), caido = mon({ item: 'red-card', hp: 1 });
  await usarGolpe(mon(), caido, golpe({ power: 90 }), true, c2);
  assert.equal(c2.saidas.length, 0, 'desmaiou: não dá tempo de mostrar o cartão');
  const c3 = ctx(); await usarGolpe(mon(), mon(), golpe(), true, c3);
  assert.equal(c3.saidas.length, 0, 'sem o item, nada');
});

/* ---------- habilidades de fuga ---------- */

test('Wimp Out / Emergency Exit: saem SÓ quando o golpe empurra o HP pra baixo da metade', async () => {
  for (const hab of ['wimp-out', 'emergency-exit']) {
    const c = ctx(), t = mon({ ability: hab, hp: 60 });
    await usarGolpe(mon(), t, golpe({ power: 40 }), true, c);            // 60 → ~40: cruzou a metade
    assert.ok(t.hp <= 50 && t.hp > 0, `${hab}: HP ${t.hp}`);
    assert.equal(c.saidas.length, 1, hab); assert.equal(c.saidas[0].motivo, 'medo');
    const c2 = ctx(), cheio = mon({ ability: hab, hp: 100 });
    await usarGolpe(mon(), cheio, golpe({ power: 20 }), true, c2);        // ainda acima da metade
    assert.equal(c2.saidas.length, 0, `${hab}: acima da metade não sai`);
    const c3 = ctx(), jaAbaixo = mon({ ability: hab, hp: 30 });
    await usarGolpe(mon(), jaAbaixo, golpe({ power: 20 }), true, c3);     // já estava abaixo: não CRUZOU a metade agora
    assert.equal(c3.saidas.length, 0, `${hab}: só quando cruza`);
  }
});

test('Wimp Out não tira quem desmaiou', async () => {
  const c = ctx(), t = mon({ ability: 'wimp-out', hp: 5 });
  await usarGolpe(mon(), t, golpe({ power: 100 }), true, c);
  assert.equal(t.hp, 0); assert.equal(c.saidas.length, 0);
});

/* ---------- prender ---------- */

test('Mean Look / Block / Spider Web: o alvo não foge mais; Fantasma é imune; não prende duas vezes', async () => {
  for (const nome of ['mean-look', 'block', 'spider-web']) {
    const alvo = mon(), c = ctx();
    await usarGolpe(mon(), alvo, st(nome), true, c);
    assert.equal(alvo.vol.preso, true, nome);
    await usarGolpe(mon(), alvo, st(nome), true, c);
    assert.ok(c.msgs.some(m => /já está preso/.test(m)), nome);
  }
  const fantasma = mon({ data: { types: ['ghost'] } });
  await usarGolpe(mon(), fantasma, st('mean-look'), true, ctx());
  assert.equal(fantasma.vol.preso, undefined);
});

/* ---------- Baton Pass ---------- */

test('Baton Pass: os estágios vão para um aliado em campo e quem usou volta a zero; sem aliado, falha', async () => {
  const u = mon(), aliado = mon({ nome: 'Aliado' });
  u.vol.stages.attack = 2; u.vol.stages.speed = 1; u.vol.foco = 2;
  const c = ctx({ aliados: [aliado] });
  await usarGolpe(u, mon(), st('baton-pass', { target: 'user' }), true, c);
  assert.equal(aliado.vol.stages.attack, 2); assert.equal(aliado.vol.stages.speed, 1); assert.equal(aliado.vol.foco, 2);
  assert.equal(u.vol.stages.attack, 0); assert.equal(u.vol.stages.speed, 0); assert.equal(u.vol.foco, undefined);
  const sozinho = mon(); sozinho.vol.stages.attack = 2;
  const c2 = ctx({ aliados: [] });
  await usarGolpe(sozinho, mon(), st('baton-pass', { target: 'user' }), true, c2);
  assert.equal(sozinho.vol.stages.attack, 2, 'sem aliado nada se perde');
  assert.ok(c2.msgs.some(m => /não há aliado/.test(m)));
  const fora = mon({ vol: { ...freshVol(), retirado: true } });
  const c3 = ctx({ aliados: [fora] }); const u3 = mon(); u3.vol.stages.attack = 2;
  await usarGolpe(u3, mon(), st('baton-pass', { target: 'user' }), true, c3);
  assert.equal(u3.vol.stages.attack, 2, 'quem foi tirado da luta não recebe');
});

/* ---------- tempo em campo ---------- */

test('Slow Start: Ataque e Velocidade pela metade nos 5 primeiros turnos, e só nesses dois atributos', async () => {
  const m = mon({ ability: 'slow-start' });
  assert.equal(effStat(m, 'attack'), 50); assert.equal(effStat(m, 'speed'), 50);
  assert.equal(effStat(m, 'defense'), 100, 'só Ataque e Velocidade');
  for (let i = 0; i < 4; i++) await fimDeTurno(m, ctx());
  assert.equal(effStat(m, 'attack'), 50, 'no 5º turno ainda vale');
  await fimDeTurno(m, ctx());
  assert.equal(effStat(m, 'attack'), 100, 'passou dos 5 turnos');
  assert.equal(effStat(mon(), 'attack'), 100, 'sem a habilidade nada muda');
});

test('Stakeout: dobra o dano em quem acabou de entrar; a marca some no fim da rodada', () => {
  const u = mon({ ability: 'stakeout' }), alvo = mon();
  const normal = calcDamage(u, alvo, golpe({ power: 60 }), null, null, null, true).dmg;
  alvo.vol.recemEntrou = true;
  const dobro = calcDamage(u, alvo, golpe({ power: 60 }), null, null, null, true).dmg;
  assert.ok(dobro >= normal * 1.9 && dobro <= normal * 2.1, `${dobro} devia ser ~2× ${normal}`);
  assert.equal(calcDamage(mon(), alvo, golpe({ power: 60 }), null, null, null, true).dmg, normal, 'só quem tem a habilidade');
  fimDaRodada(alvo);
  assert.equal(alvo.vol.recemEntrou, undefined);
});

/* ---------- a tabela ---------- */

test('as seis habilidades de "saída" entraram na tabela com o gancho certo', () => {
  assert.equal(HABILIDADES.regenerator.curaAoVencer, 1 / 3);
  assert.equal(HABILIDADES['natural-cure'].limpaStatusAoVencer, true);
  assert.equal(HABILIDADES['wimp-out'].saiComPoucoHp, 0.5);
  assert.equal(HABILIDADES['emergency-exit'].saiComPoucoHp, 0.5);
  assert.equal(HABILIDADES['slow-start'].inicioLento, 5);
  assert.equal(HABILIDADES.stakeout.emboscada, 2);
});
