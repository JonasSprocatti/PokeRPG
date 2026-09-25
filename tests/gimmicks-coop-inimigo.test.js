/* Três frentes das gimmicks (Mega, Tera, Z-Move e Gigantamax):
   1. o LADO INIMIGO — só treinador gigantamaxa; só treinador e Alfa usam Z (Alfa com chance baixa);
   2. o CO-OP — o motor puro (mp-motor.js) aplica as gimmicks que chegam na ação de golpe;
   3. a AUDITORIA das conquistas da Mega (toda espécie da tabela tem barra alcançável) e o Gigantamax do jogador,
      que nunca aparecia numa batalha de verdade porque `conquistasDaConta` passava `runs: {}`. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conquistasDoProgresso } from '../js/carreira.js';
import { progressoVazio, bancar } from '../js/progresso-conta.js';
import { ALVOS, gmaxLiberado, megaLiberada, progressoConquistas } from '../js/conquistas.js';
import { MEGAS, megasDe } from '../js/dados-megas.js';
import { megasDisponiveis, aplicarForma, desfazerMega } from '../js/mega.js';
import { inimigoPodeGmax } from '../js/dynamax.js';
import { inimigoTemZ, inimigoUsaZAgora, CHANCE_Z_ALFA, CHANCE_Z_TURNO } from '../js/zmove.js';
import { ITEM_PEDRA_MEGA, STATS } from '../js/dados.js';
import { fotoDoMon, novaBatalhaMP, resolverTurnoMP, monMP } from '../js/mp-motor.js';
import { freshVol, calcStats, TURNOS_DYNAMAX, MULT_HP_DYNAMAX } from '../js/regras.js';

/* ---------------- 1. lado inimigo ---------------- */
test('só Pokémon de TREINADOR gigantamaxa do lado inimigo', () => {
  assert.equal(inimigoPodeGmax({ trainer: { nome: 'Rui' } }), true);
  assert.equal(inimigoPodeGmax({ trainer: { nome: 'Lendários', lendarios: true }, lendarios: true }), false, 'o "treinador" da rota final não é treinador de verdade');
  assert.equal(inimigoPodeGmax({ chefe: 'rota1' }), false, 'Alfa não');
  assert.equal(inimigoPodeGmax({ evento: 'x', trainer: {} }), false, 'chefe de evento não');
  assert.equal(inimigoPodeGmax({}), false, 'selvagem não');
  assert.equal(inimigoPodeGmax(null), false);
});

test('Z-Move do inimigo: treinador sempre carrega; Alfa só de vez em quando; o resto nunca', () => {
  assert.equal(inimigoTemZ({ trainer: { nome: 'Rui' } }, 0.99), true, 'treinador sempre');
  assert.equal(inimigoTemZ({ chefe: 'rota1' }, CHANCE_Z_ALFA - 0.01), true, 'Alfa, na chance baixa');
  assert.equal(inimigoTemZ({ chefe: 'rota1' }, CHANCE_Z_ALFA + 0.01), false, 'Alfa, fora da chance');
  assert.ok(CHANCE_Z_ALFA > 0 && CHANCE_Z_ALFA <= 0.25, 'a chance do Alfa é BAIXA');
  assert.equal(inimigoTemZ({ chefe: 'x', lendarios: true, trainer: {} }, 0), false, 'lendário não');
  assert.equal(inimigoTemZ({ evento: 'e', chefe: 'x' }, 0), false, 'chefe de evento não');
  assert.equal(inimigoTemZ({}, 0), false, 'selvagem não');
  assert.equal(inimigoTemZ(null, 0), false);
});

test('o inimigo só gasta o Z uma vez, num golpe de dano, e só quem carrega', () => {
  const B = { zInimigo: true, zInimigoUsado: false };
  const dano = { name: 'flamethrower', cls: 'special', power: 90 };
  assert.equal(inimigoUsaZAgora(B, dano, 0), true);
  assert.equal(inimigoUsaZAgora(B, dano, CHANCE_Z_TURNO + 0.01), false, 'nem todo turno');
  assert.equal(inimigoUsaZAgora(B, { name: 'growl', cls: 'status', power: null }, 0), false, 'golpe de status não vira Z');
  assert.equal(inimigoUsaZAgora(B, { name: 'struggle', cls: 'physical', power: 50 }, 0), false);
  assert.equal(inimigoUsaZAgora({ ...B, zInimigoUsado: true }, dano, 0), false, 'uma vez por luta');
  assert.equal(inimigoUsaZAgora({ zInimigo: false }, dano, 0), false, 'quem não carrega não usa');
  assert.equal(inimigoUsaZAgora(null, dano, 0), false);
});

/* ---------------- 2. co-op ---------------- */
const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const cheio = v => Object.fromEntries(STATS.map(s => [s, v]));
const BASE = { hp: 78, attack: 84, defense: 78, 'special-attack': 109, 'special-defense': 85, speed: 100 };
const mon = (o = {}) => {
  const p = { id: 6, name: 'charizard', nick: '', level: 50, ability: 'none', shiny: false, nature: 'hardy', ivs: cheio(31), evs: cheio(0),
    data: { types: ['fire', 'flying'], sprite: 's', back: 'b', speciesName: 'charizard', baseExp: 240, effort: {}, base: BASE },
    status: null, sleep: 0, moves: [golpe()], vol: freshVol(), ...o };
  p.stats = calcStats(p); p.hp = p.stats.hp;
  return p;
};
// alvo que aguenta muitos turnos (nada aqui pode acabar a luta por acidente)
const tanque = () => { const p = mon({ name: 'tank', data: { types: ['normal'], sprite: 's', back: 'b', speciesName: 'tank', baseExp: 60, effort: {}, base: BASE } }); p.stats.hp = 100000; p.hp = 100000; return p; };
const luta = (opcoes = {}, a = mon(), b = tanque()) => novaBatalhaMP([fotoDoMon(a, 'A0', 'j1')], [fotoDoMon(b, 'B0', 'ia', 'Selvagem')], opcoes);
const ataque = (gimmicks, extra = {}) => ({ ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0', ...(gimmicks ? { gimmicks } : {}), ...extra });
const FORMA_X = { tipo: 'mega', forma: 'charizard-mega-x', id: 10034, name: 'charizard-mega-x', types: ['fire', 'dragon'], ability: 'tough-claws', sprite: 'ms', back: 'mb',
  base: { ...BASE, attack: 130, defense: 111, 'special-attack': 130 } };

test('co-op: Mega Evolução troca os dados do Pokémon, sobe o teto e guarda o "já usei"', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const e = luta(), hpAntes = monMP(e, 'A0').stats.hp;
  const { estado, eventos } = await resolverTurnoMP(e, [ataque([FORMA_X])]);
  const m = monMP(estado, 'A0');
  assert.deepEqual(m.data.types, ['fire', 'dragon']);
  assert.equal(m.data.speciesName, 'charizard', 'a espécie continua a mesma (o resultado volta pra run pela espécie)');
  assert.equal(m.data.base.attack, 130);
  assert.ok(m.stats.hp >= hpAntes, 'o teto só sobe');
  assert.equal(m.hp, m.stats.hp, 'quem estava com a vida cheia continua com a vida cheia');
  assert.equal(m.ability, 'tough-claws');
  assert.equal(m.mega.forma.forma, 'charizard-mega-x');
  assert.equal(estado.gimmicksUsados.j1.mega, true);
  assert.ok(eventos.some(x => x.txt.includes('MEGAEVOLUIU')));
  assert.equal(monMP(e, 'A0').mega, undefined, 'o estado original não foi mexido');
  // segunda Mega na mesma luta: ignorada
  const outra = { ...FORMA_X, forma: 'charizard-mega-y', name: 'charizard-mega-y', types: ['fire', 'flying'] };
  const r2 = await resolverTurnoMP(estado, [ataque([outra])]);
  assert.equal(monMP(r2.estado, 'A0').mega.forma.forma, 'charizard-mega-x', 'uma por luta');
  assert.ok(!r2.eventos.some(x => x.txt.includes('MEGAEVOLUIU')));
});

test('co-op: a forma tem que ser da espécie do Pokémon e vir com dados completos', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  for (const ruim of [
    { ...FORMA_X, forma: 'gengar-mega' },                 // outra espécie
    { ...FORMA_X, types: [] },                            // sem tipos
    { ...FORMA_X, base: { hp: 1 } },                      // sem os 6 atributos
    { tipo: 'mega', forma: 'charizard-mega-x' }           // sem nada
  ]) {
    const { estado } = await resolverTurnoMP(luta(), [ataque([ruim])]);
    assert.equal(monMP(estado, 'A0').mega, undefined, JSON.stringify(ruim).slice(0, 60));
    assert.equal(estado.gimmicksUsados.j1?.mega, undefined, 'não gasta o uso quando não aplicou');
  }
});

test('co-op: Terastalização muda o tipo defensivo e só vale uma vez, com tipo real', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const { estado, eventos } = await resolverTurnoMP(luta(), [ataque([{ tipo: 'tera', valor: 'water' }])]);
  assert.equal(monMP(estado, 'A0').tera, 'water');
  assert.ok(eventos.some(x => x.txt.includes('TERASTALIZOU')));
  const r2 = await resolverTurnoMP(estado, [ataque([{ tipo: 'tera', valor: 'grass' }])]);
  assert.equal(monMP(r2.estado, 'A0').tera, 'water', 'uma por luta');
  const inv = await resolverTurnoMP(luta(), [ataque([{ tipo: 'tera', valor: 'plasma' }])]);
  assert.equal(monMP(inv.estado, 'A0').tera, undefined, 'tipo inventado não vale');
});

test('co-op: Gigantamax dobra o HP, dura TURNOS_DYNAMAX turnos e encolhe sozinho', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const e = luta(), cheioAntes = monMP(e, 'A0').stats.hp;
  let r = await resolverTurnoMP(e, [ataque([{ tipo: 'gmax' }])]);
  assert.equal(monMP(r.estado, 'A0').stats.hp, Math.floor(cheioAntes * MULT_HP_DYNAMAX));
  assert.ok(monMP(r.estado, 'A0').dyna, 'gigante');
  for (let i = 1; i < TURNOS_DYNAMAX; i++) {
    assert.ok(monMP(r.estado, 'A0').dyna, `ainda gigante no fim do turno ${i}`);
    r = await resolverTurnoMP(r.estado, [ataque()]);
  }
  const m = monMP(r.estado, 'A0');
  assert.equal(m.dyna, undefined, 'encolheu');
  assert.equal(m.stats.hp, cheioAntes, 'o teto volta ao que era');
  assert.ok(r.eventos.some(x => x.txt.includes('voltou ao tamanho normal')));
  // e uma segunda vez na mesma luta não vale
  r = await resolverTurnoMP(r.estado, [ataque([{ tipo: 'gmax' }])]);
  assert.equal(monMP(r.estado, 'A0').dyna, undefined, 'uma por luta');
});

test('co-op: Z-Move bate bem mais forte, uma vez só, e a marca não vaza pro turno seguinte', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const normal = await resolverTurnoMP(luta(), [ataque()]);
  const comZ = await resolverTurnoMP(luta(), [ataque([{ tipo: 'z' }])]);
  const alvo0 = 100000;
  assert.ok(alvo0 - monMP(comZ.estado, 'B0').hp > (alvo0 - monMP(normal.estado, 'B0').hp) * 1.5, 'poder 40 vira 100');
  assert.ok(comZ.eventos.some(x => x.txt.includes('energia Z')));
  assert.equal(monMP(comZ.estado, 'A0').vol.zAtivo, undefined, 'a marca some depois do golpe');
  assert.equal(comZ.estado.gimmicksUsados.j1.z, true);
  // segundo Z: vale o dano normal, sem aviso
  const antes = monMP(comZ.estado, 'B0').hp;
  const r2 = await resolverTurnoMP(comZ.estado, [ataque([{ tipo: 'z' }])]);
  assert.ok(!r2.eventos.some(x => x.txt.includes('energia Z')));
  assert.ok(antes - monMP(r2.estado, 'B0').hp <= (alvo0 - monMP(normal.estado, 'B0').hp) * 1.2);
});

test('co-op: Z não vale em golpe de status', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const growl = golpe({ name: 'growl', cls: 'status', power: null, stats: [{ stat: 'attack', change: -1 }] });
  const { estado, eventos } = await resolverTurnoMP(luta({}, mon({ moves: [growl] })), [ataque([{ tipo: 'z' }])]);
  assert.ok(!eventos.some(x => x.txt.includes('energia Z')));
  assert.equal(estado.gimmicksUsados.j1?.z, undefined, 'o Z não foi gasto');
});

test('co-op: só o PRINCIPAL de quem tem run usa gimmick (aliado, convidado e PvP ficam de fora)', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const gmax = [{ tipo: 'gmax' }];
  const comFoto = (foto, opcoes) => novaBatalhaMP([foto], [fotoDoMon(tanque(), 'B0', 'ia', 'Selvagem')], opcoes);
  const aliado = await resolverTurnoMP(comFoto(fotoDoMon(mon(), 'A0', 'j1', null, 1)), [ataque(gmax)]);
  assert.equal(monMP(aliado.estado, 'A0').dyna, undefined, 'aliado (slot 1) não');
  const conv = await resolverTurnoMP(comFoto({ ...fotoDoMon(mon(), 'A0', 'j1'), convidado: true }), [ataque(gmax)]);
  assert.equal(monMP(conv.estado, 'A0').dyna, undefined, 'convidado não');
  const pvp = await resolverTurnoMP(comFoto(fotoDoMon(mon(), 'A0', 'j1'), { pvp: true }), [ataque(gmax)]);
  assert.equal(monMP(pvp.estado, 'A0').dyna, undefined, 'PvP não');
  const ia = await resolverTurnoMP(luta(), [{ ref: 'B0', tipo: 'golpe', golpe: 0, alvo: 'A0', gimmicks: gmax }]);
  assert.equal(monMP(ia.estado, 'B0').dyna, undefined, 'o lado inimigo não usa gimmick por aqui');
  // e o principal comum, sim
  const eu = await resolverTurnoMP(comFoto(fotoDoMon(mon(), 'A0', 'j1')), [ataque(gmax)]);
  assert.ok(monMP(eu.estado, 'A0').dyna);
});

test('co-op: o Alfa carrega Z só às vezes; selvagem nunca; e ele gasta um só', async t => {
  let sorte = 0;   // 0 = sorteio a favor (carrega, e usa no primeiro turno); muda no meio do teste
  t.mock.method(Math, 'random', () => sorte);
  assert.equal(luta({ alfa: true }).zIA, true, 'Alfa, na chance');
  assert.equal(luta({}).zIA, false, 'selvagem nunca');
  assert.equal(luta({ alfa: true, evento: 'e' }).zIA, false, 'chefe de evento nunca');
  sorte = 0.99;
  assert.equal(luta({ alfa: true }).zIA, false, 'Alfa, fora da chance');

  sorte = 0;
  const e = luta({ alfa: true }, tanque(), mon());
  sorte = 0.01;
  e.lados.B[0].moves = [golpe({ name: 'slash', power: 70 })];
  let r = await resolverTurnoMP(e, [{ ref: 'B0', tipo: 'golpe', golpe: 0, alvo: 'A0' }]);
  assert.ok(r.eventos.some(x => x.txt.includes('Selvagem concentra a energia Z')), 'o Alfa usa o Z');
  assert.equal(r.estado.zIAUsado, true);
  r = await resolverTurnoMP(r.estado, [{ ref: 'B0', tipo: 'golpe', golpe: 0, alvo: 'A0' }]);
  assert.ok(!r.eventos.some(x => x.txt.includes('energia Z')), 'só uma vez por luta');
});

/* ---------------- 3. auditoria das conquistas da Mega ---------------- */
test('a tabela de Megas é coerente: sem forma, id ou nome repetido', () => {
  const formas = Object.values(MEGAS).flat();
  for (const campo of ['forma', 'id', 'nome']) {
    const valores = formas.map(f => f[campo]);
    assert.equal(new Set(valores).size, valores.length, `${campo} repetido na tabela de Megas`);
  }
  for (const [especie, lista] of Object.entries(MEGAS)) assert.ok(lista.length >= 1, especie);
});

test('TODA espécie com Mega tem barra alcançável: 1.000 abates liberam, 999 não, e a pedra habilita a forma', () => {
  const com = (especie, n) => progressoConquistas([], { abates: { total: n, tipoAlvo: {}, golpe: {}, elemento: {}, especie: { [especie]: n } } });
  for (const especie of Object.keys(MEGAS)) {
    assert.equal(megaLiberada(com(especie, ALVOS.mega), especie), true, `${especie}: ${ALVOS.mega} abates não liberaram a Mega`);
    assert.equal(megaLiberada(com(especie, ALVOS.mega - 1), especie), false, `${especie}: liberou cedo demais`);
    const p = com(especie, ALVOS.mega);
    const pokemon = { data: { speciesName: especie }, moves: especie === 'rayquaza' ? [{ name: 'dragon-ascent' }] : [], item: ITEM_PEDRA_MEGA };
    assert.deepEqual(megasDisponiveis(pokemon, { jaUsou: false, liberada: e => megaLiberada(p, e) }), megasDe(especie), `${especie}: conquistada e com a pedra, devia poder megaevoluir`);
  }
});

test('aplicarForma / desfazerMega: ida e volta sem rede, mantendo o dano sofrido', () => {
  const M = mon({ level: 60 });
  M.hp = M.stats.hp - 20;
  const dataAntes = M.data, tetoAntes = M.stats.hp;
  aplicarForma(M, megasDe('charizard')[0], { id: 10034, name: 'charizard-mega-x', types: FORMA_X.types, base: FORMA_X.base, abilities: [{ name: 'tough-claws', hidden: false }] });
  assert.equal(M.ability, 'tough-claws');
  assert.ok(M.stats.hp >= tetoAntes);
  assert.equal(M.hp, M.stats.hp - 20, 'o dano sofrido não some na conta');
  desfazerMega(M);
  assert.equal(M.data, dataAntes);
  assert.equal(M.stats.hp, tetoAntes);
});

/* ---------------- Gigantamax do jogador ---------------- */
test('Gigantamax: 25 jornadas no nível 50 liberam o botão (conquistasDoProgresso lê os runs do progresso)', () => {
  const jornadas = n => Array.from({ length: n }, (_, i) => ({ id: 'j' + i, especie: 'charizard', nivel: 50, dificuldade: 'hard', registro: {} }));
  const pronto = n => conquistasDoProgresso(jornadas(n), null, bancar(progressoVazio(), jornadas(n)));
  assert.equal(gmaxLiberado(pronto(ALVOS.gmaxRuns), 'charizard'), true, 'era `runs: {}` e nunca liberava em batalha');
  assert.equal(gmaxLiberado(pronto(ALVOS.gmaxRuns), 'pikachu'), false);
  assert.equal(gmaxLiberado(pronto(ALVOS.gmaxRuns - 1), 'charizard'), false, '24 não basta');
});
