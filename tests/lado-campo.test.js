// Golpes de lado do campo (regras.LADO_VAZIO + golpe.js): telas, Salvaguarda, Névoa, Vento de Cauda e armadilhas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LADO_VAZIO, TELA_TURNOS, VENTO_TURNOS, MAX_ESPINHOS, MAX_TOXINAS, multTelas, temSalvaguarda, temNeblina,
  multVento, passarLado, danoPedras, danoEspinhos, efeitoToxinas, calcDamage, freshVol } from '../js/regras.js';
import { usarGolpe, aplicarStatus, mudarEstagios, aplicarArmadilhas, passarLados } from '../js/golpe.js';
import { GOLPES_ESPECIAIS } from '../js/especiais.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const status = (name, o = {}) => golpe({ name, cls: 'status', power: null, acc: null, target: 'user', ...o });
const mon = (o = {}) => ({ level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0,
  stats: { hp: 160, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 }, hp: 160, moves: [], vol: freshVol(), ...o });
// ctx com dois lados: quem for `eu` está no lado 'jogador', o resto no 'inimigo'
const ctx = (eu = null, campo = { lados: {} }) => {
  const msgs = [];
  return { msgs, campo, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); },
    ladoDe: m => (m === eu ? 'jogador' : 'inimigo') };
};

test('telas cortam o dano pela metade, cada uma na sua classe de golpe', () => {
  const lado = LADO_VAZIO();
  assert.equal(multTelas(lado, golpe()), 1);
  lado.reflect = 3;
  assert.equal(multTelas(lado, golpe()), 0.5);                       // físico
  assert.equal(multTelas(lado, golpe({ cls: 'special' })), 1);
  const outro = { ...LADO_VAZIO(), luz: 3 };
  assert.equal(multTelas(outro, golpe({ cls: 'special' })), 0.5);
  assert.equal(multTelas(outro, golpe()), 1);
  const veu = { ...LADO_VAZIO(), veu: 3 };
  assert.equal(multTelas(veu, golpe()), 0.5);                        // Aurora Veil pega os dois
  assert.equal(multTelas(veu, golpe({ cls: 'special' })), 0.5);
  assert.equal(multTelas(null, golpe()), 1);
});

test('o dano calculado cai com a tela do lado de quem defende', t => {
  t.mock.method(Math, 'random', () => 0.5);
  const base = calcDamage(mon(), mon(), golpe()).dmg;
  const comTela = calcDamage(mon(), mon(), golpe(), null, null, { ...LADO_VAZIO(), reflect: 3 }).dmg;
  assert.ok(comTela < base && comTela >= Math.floor(base / 2) - 1, `${comTela} vs ${base}`);
});

test('Reflect liga no lado de quem usou, por 5 turnos, e não empilha', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const eu = mon(), c = ctx(eu);
  await usarGolpe(eu, mon(), status('reflect'), true, c);
  assert.equal(c.campo.lados.jogador.reflect, TELA_TURNOS);
  assert.equal(c.campo.lados.inimigo, undefined);                    // o lado do inimigo não foi tocado
  await usarGolpe(eu, mon(), status('reflect'), true, c);
  assert.ok(c.msgs.some(m => m.includes('já está no ar')));
  // Tailwind dura menos
  const c2 = ctx(eu);
  await usarGolpe(eu, mon(), status('tailwind'), true, c2);
  assert.equal(c2.campo.lados.jogador.vento, VENTO_TURNOS);
  assert.equal(multVento(c2.campo.lados.jogador), 2);
});

test('Aurora Veil só funciona no granizo ou na neve', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const eu = mon(), semGelo = ctx(eu, { lados: {}, clima: 'sol', turnos: 3 });
  await usarGolpe(eu, mon(), status('aurora-veil'), true, semGelo);
  assert.equal(semGelo.campo.lados.jogador?.veu || 0, 0);
  const comGelo = ctx(eu, { lados: {}, clima: 'neve', turnos: 3 });
  await usarGolpe(eu, mon(), status('aurora-veil'), true, comGelo);
  assert.equal(comGelo.campo.lados.jogador.veu, TELA_TURNOS);
});

test('Salvaguarda barra status do inimigo (mas não o que você faz em si mesmo)', async () => {
  const eu = mon(), c = ctx(eu);
  c.campo.lados.jogador = { ...LADO_VAZIO(), salvaguarda: 3 };
  await aplicarStatus(eu, 'burn', c, true, mon());                   // veio do inimigo
  assert.equal(eu.status, null);
  assert.ok(c.msgs.some(m => m.includes('Salvaguarda')));
  await aplicarStatus(eu, 'sleep', c, true, eu);                     // Rest: você mesmo
  assert.equal(eu.status, 'sleep');
  assert.equal(temSalvaguarda(c.campo.lados.jogador), true);
  assert.equal(temSalvaguarda(LADO_VAZIO()), false);
});

test('Névoa impede o inimigo de baixar seus atributos', async () => {
  const eu = mon(), c = ctx(eu);
  c.campo.lados.jogador = { ...LADO_VAZIO(), neblina: 3 };
  await mudarEstagios(eu, [{ stat: 'attack', change: -1 }], c, mon());
  assert.equal(eu.vol.stages.attack, 0);
  await mudarEstagios(eu, [{ stat: 'attack', change: -1 }], c, eu);   // o próprio golpe ainda baixa
  assert.equal(eu.vol.stages.attack, -1);
  assert.equal(temNeblina(LADO_VAZIO()), false);
});

test('armadilhas: Stealth Rock pela eficácia, Spikes por camada, Toxic Spikes envenena', () => {
  assert.equal(danoPedras(mon()), 20);                                            // 1/8 de 160, neutro
  assert.equal(danoPedras(mon({ data: { types: ['flying'] } })), 40);              // Pedra é super efetivo
  assert.equal(danoPedras(mon({ data: { types: ['steel'] } })), 10);               // e pouco efetivo em Aço
  assert.equal(danoEspinhos(mon(), 1), 20);
  assert.equal(danoEspinhos(mon(), 3), 40);
  assert.equal(danoEspinhos(mon({ data: { types: ['flying'] } }), 3), 0);          // quem voa não pisa
  assert.equal(danoEspinhos(mon(), 0), 0);
  assert.equal(efeitoToxinas(mon(), 1), 'veneno');
  assert.equal(efeitoToxinas(mon(), MAX_TOXINAS), 'grave');
  assert.equal(efeitoToxinas(mon({ data: { types: ['poison'] } }), 2), 'limpa');
  assert.equal(efeitoToxinas(mon({ data: { types: ['steel'] } }), 2), null);
  assert.equal(efeitoToxinas(mon({ data: { types: ['flying'] } }), 2), null);
});

test('armadilha é posta no lado do INIMIGO e pega quem entra depois', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const eu = mon(), c = ctx(eu);
  await usarGolpe(eu, mon(), status('stealth-rock', { target: 'selected-pokemon' }), true, c);
  assert.equal(c.campo.lados.inimigo.pedras, true);
  assert.equal(c.campo.lados.jogador, undefined);
  const queEntrou = mon();
  await aplicarArmadilhas(queEntrou, c);
  assert.equal(queEntrou.hp, 140);
  // empilhar espinhos até o limite
  for (let i = 0; i < MAX_ESPINHOS + 1; i++) await usarGolpe(eu, mon(), status('spikes', { target: 'selected-pokemon' }), true, c);
  assert.equal(c.campo.lados.inimigo.espinhos, MAX_ESPINHOS);
  assert.ok(c.msgs.some(m => m.includes('não cabe mais')));
});

test('tudo que conta turno anda no fim da rodada e some no fim', async () => {
  const lado = { ...LADO_VAZIO(), reflect: 1, vento: 2 };
  assert.deepEqual(passarLado(lado), ['reflect']);
  assert.equal(lado.vento, 1);
  const c = ctx();
  c.campo.lados = { jogador: { ...LADO_VAZIO(), luz: 1 } };
  await passarLados(c.campo, c);
  assert.equal(c.campo.lados.jogador.luz, 0);
  assert.ok(c.msgs.some(m => m.includes('Tela de Luz')));
});

test('todo golpe de lado/armadilha da tabela aponta pra um campo que existe', () => {
  const campos = Object.keys(LADO_VAZIO());
  for (const [n, e] of Object.entries(GOLPES_ESPECIAIS)) {
    if (e.lado) assert.ok(campos.includes(e.lado), `${n}: lado "${e.lado}"`);
    if (e.armadilha) assert.ok(['pedras', 'espinhos', 'toxinas'].includes(e.armadilha), `${n}: armadilha "${e.armadilha}"`);
  }
});
