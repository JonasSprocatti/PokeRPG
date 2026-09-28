// Chefe da semana no CO-OP (js/mp-motor.js): o golpe carregado atinge o time todo, Revive no meio da luta e sem fuga.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fotoDoMon, novaBatalhaMP, resolverTurnoMP, monMP, reviverNoEvento, reviverCompanheiro, MAX_REVIVES } from '../js/mp-motor.js';
import { prepararChefe, jogadoresEfetivos, AJUSTES } from '../js/boss.js';
import { freshVol } from '../js/regras.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], desc: 'x', ...o });
const pokemon = (o = {}) => ({
  id: 1, name: 'teste', nick: '', level: 50, ability: 'none', shiny: false,
  data: { types: ['normal'], sprite: 's', back: 'b', speciesName: 'teste', baseExp: 60, effort: { attack: 1 } },
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, status: null, sleep: 0, moves: [golpe()], vol: freshVol(), ...o
});
const forte = (hp = 1000) => pokemon({ hp, stats: { ...pokemon().stats, hp } });
// grupo de 3 jogadores (um Pokémon cada) contra o chefe
const chefeFoto = (jogadores = 3) => fotoDoMon(prepararChefe(pokemon({ nick: 'Chefe' }), jogadores), 'B0', 'ia', 'Chefe');
const luta = (mons = [forte(), forte(), forte()], evento = 'eternatus-eternamax') =>
  novaBatalhaMP(mons.map((m, i) => fotoDoMon(m, 'A' + i, 'j' + i)), [chefeFoto(mons.length)], { evento });

test('o chefe vai pela rede: fotoDoMon leva o estado das mecânicas (cópia, não referência)', () => {
  const E = prepararChefe(pokemon(), 2), f = fotoDoMon(E, 'B0', 'ia', 'Chefe');
  assert.deepEqual(f.boss, E.boss);
  assert.notEqual(f.boss, E.boss);
  assert.equal(f.chefeEvento, true);
  assert.equal(fotoDoMon(pokemon(), 'A0', 'u').boss, undefined, 'Pokémon comum não ganha `boss`');
});

test('mais jogadores = mais HP no chefe, mas MENOS que proporcional (é o incentivo de jogar em equipe)', () => {
  const um = prepararChefe(pokemon(), jogadoresEfetivos(1, 1)).stats.hp, tres = prepararChefe(pokemon(), jogadoresEfetivos(3, 1)).stats.hp;
  assert.ok(tres > um && tres < 3 * um, `1 jogador ${um}, 3 jogadores ${tres}`);
  // cada Pokémon a mais por jogador pesa menos que um jogador inteiro
  assert.ok(jogadoresEfetivos(1, 3) > 1 && jogadoresEfetivos(1, 3) < 3);
  assert.equal(jogadoresEfetivos(3, 1), 3);
  assert.equal(AJUSTES.pesoPokemonExtra > 0 && AJUSTES.pesoPokemonExtra < 1, true);
});

test('o golpe carregado (Eternabeam) atinge o TIME INTEIRO, não só um alvo', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const e = luta();
  const chefe = monMP(e, 'B0');
  chefe.boss.acoes = 4; chefe.boss.carga = { dano: 0, lim: 35, interrompida: false };   // o chefe já estava carregando: agora solta
  const { estado, eventos } = await resolverTurnoMP(e, [
    { ref: 'B0', tipo: 'golpe', golpe: 0, alvo: 'A0' },
    ...['A0', 'A1', 'A2'].map(ref => ({ ref, tipo: 'golpe', golpe: 0, alvo: 'B0' }))]);
  for (const ref of ['A0', 'A1', 'A2']) assert.ok(1000 - monMP(estado, ref).hp > 60, `${ref} devia ter levado o Eternabeam (perdeu ${1000 - monMP(estado, ref).hp})`);
  assert.ok(eventos.some(x => /ETERNABEAM/.test(x.txt)));
  assert.equal(monMP(estado, 'B0').boss.soltouTodos, false, 'a marca é limpa depois de acertar todo mundo');
});

test('sem carga pronta, o chefe machuca só um alvo', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const e = luta();
  const { estado } = await resolverTurnoMP(e, [
    { ref: 'B0', tipo: 'golpe', golpe: 0, alvo: 'A0' },
    ...['A0', 'A1', 'A2'].map(ref => ({ ref, tipo: 'golpe', golpe: 0, alvo: 'B0' }))]);
  const feridos = ['A0', 'A1', 'A2'].filter(ref => monMP(estado, ref).hp < 1000);
  assert.equal(feridos.length, 1);
});

test('Revive no evento: quem ficou sem ninguém de pé volta com metade do HP, e conta o limite', () => {
  const e = luta([forte(), forte(), forte()]);
  monMP(e, 'A0').hp = 0;
  const m = reviverNoEvento(e, 'A0', 'j0');
  assert.ok(m); assert.equal(m.hp, 500); assert.equal(m.caido, false);
  assert.equal(e.revivesUsados.j0, 1);
  // não vale: ele já tem alguém de pé
  assert.equal(reviverNoEvento(e, 'A0', 'j0'), null, 'já está de pé');
  monMP(e, 'A0').hp = 0;
  monMP(e, 'A1').hp = 0;
  // não vale: o Pokémon é de OUTRO jogador
  assert.equal(reviverNoEvento(e, 'A1', 'j0'), null);
  // o limite por jogador
  e.revivesUsados.j0 = MAX_REVIVES;
  assert.equal(reviverNoEvento(e, 'A0', 'j0'), null, 'gastou todos os Revives da luta');
});

test('Revive só existe na luta do evento e só enquanto o grupo aguenta', () => {
  const comum = luta([forte(), forte()], null);
  monMP(comum, 'A0').hp = 0;
  assert.equal(reviverNoEvento(comum, 'A0', 'j0'), null, 'fora do evento não vale');
  const e = luta([forte(), forte()]);
  monMP(e, 'A0').hp = 0; monMP(e, 'A1').hp = 0;
  assert.equal(reviverNoEvento(e, 'A0', 'j0'), null, 'o grupo todo caiu: acabou');
  const acabou = luta([forte(), forte()]); acabou.fim = 'B'; monMP(acabou, 'A0').hp = 0;
  assert.equal(reviverNoEvento(acabou, 'A0', 'j0'), null, 'luta encerrada');
});

// reviverCompanheiro (Arena solo, 28/09/2026): a MESMA regra de Revive de uma run de verdade — qualquer aliado
// caído, a qualquer momento, sem exigir que o time INTEIRO tenha caído (essa exigência de reviverNoEvento nunca
// abriria na Arena, que só tem UM dono em lados.A).
// Time solo com 3 Pokémon do MESMO dono (a Arena: um jogador só, até 3 no Hall) — diferente de `luta()`, que
// modela multiplayer (um Pokémon por jogador).
const timeSolo = (mons = [forte(), forte(), forte()], evento = 'eternatus-eternamax') =>
  novaBatalhaMP(mons.map((m, i) => fotoDoMon(m, 'A' + i, 'j0', null, i)), [chefeFoto(1)], { evento });

test('reviverCompanheiro: reanima mesmo com outro Pokémon do dono ainda de pé (diferente de reviverNoEvento)', () => {
  const e = timeSolo();
  monMP(e, 'A0').hp = 0;
  // reviverNoEvento recusaria aqui (A1/A2 do MESMO dono ainda de pé); reviverCompanheiro não exige isso
  assert.equal(reviverNoEvento(e, 'A0', 'j0'), null);
  const m = reviverCompanheiro(e, 'A0', 'j0');
  assert.ok(m); assert.equal(m.hp, 500); assert.equal(m.caido, false);
  assert.equal(e.revivesUsados.j0, 1);
  assert.deepEqual(e.revivesTipos.j0, ['revive'], 'Sala de Raide (multiplayer.consumirRevives) precisa saber QUAL item descontar da conta');
});

// Sala de Raide (multiplayer.js): Revive e Max Revive descontam itens DIFERENTES do inventário de conta, e
// `revivesUsados` é só um contador — `revivesTipos` é a lista na mesma ordem que guarda qual foi usado em cada uso.
test('reviverCompanheiro: revivesTipos registra cada uso, na ordem, por dono', () => {
  const e = timeSolo([forte(), forte(), forte()]);
  monMP(e, 'A0').hp = 0;
  reviverCompanheiro(e, 'A0', 'j0', 100);
  monMP(e, 'A0').hp = 0;
  reviverCompanheiro(e, 'A0', 'j0', 50);
  assert.deepEqual(e.revivesTipos.j0, ['max-revive', 'revive']);
});

test('reviverCompanheiro: aceita a fração de HP (100 = Max Revive), recusa dono errado/vivo/limite/fora do evento', () => {
  const e = timeSolo([forte(), forte()]);
  monMP(e, 'A0').hp = 0;
  assert.equal(reviverCompanheiro(e, 'A0', 'j1'), null, 'Pokémon de outro jogador');
  const m = reviverCompanheiro(e, 'A0', 'j0', 100);
  assert.equal(m.hp, 1000, 'Max Revive cura tudo');
  assert.equal(reviverCompanheiro(e, 'A0', 'j0'), null, 'já está de pé');
  monMP(e, 'A0').hp = 0;
  e.revivesUsados.j0 = MAX_REVIVES;
  assert.equal(reviverCompanheiro(e, 'A0', 'j0'), null, 'gastou todos os Revives da luta');
  const comum = timeSolo([forte(), forte()], null);
  monMP(comum, 'A0').hp = 0;
  assert.equal(reviverCompanheiro(comum, 'A0', 'j0'), null, 'fora do evento não vale');
  // sem ninguém do dono de pé: continua sem valer (é o caso "time inteiro caído" — a luta já teria acabado)
  const acabou = timeSolo([forte()]);
  monMP(acabou, 'A0').hp = 0;
  assert.equal(reviverCompanheiro(acabou, 'A0', 'j0'), null, 'ninguém do dono de pé');
});

test('o Pokémon revivido volta a agir e o estado guarda o contador pro anfitrião publicar', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const e = luta([forte(), forte()]);
  monMP(e, 'A0').hp = 0;
  reviverNoEvento(e, 'A0', 'j0');
  const { estado } = await resolverTurnoMP(e, [{ ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0' }, { ref: 'A1', tipo: 'golpe', golpe: 0, alvo: 'B0' }]);
  assert.ok(monMP(estado, 'B0').hp < monMP(estado, 'B0').stats.hp, 'os dois atacaram');
  assert.equal(estado.revivesUsados.j0, 1, 'o contador sobrevive ao turno (clone do estado)');
});

test('no chefe da semana ninguém foge (e num combate comum, sim)', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const evento = luta([forte()]);
  const r1 = await resolverTurnoMP(evento, [{ ref: 'A0', tipo: 'fugir' }, { ref: 'B0', tipo: 'golpe', golpe: 0, alvo: 'A0' }]);
  assert.notEqual(r1.estado.fim, 'fuga');
  const comum = novaBatalhaMP([fotoDoMon(pokemon(), 'A0', 'j0')], [fotoDoMon(pokemon(), 'B0', 'ia', 'Selvagem')]);
  const r2 = await resolverTurnoMP(comum, [{ ref: 'A0', tipo: 'fugir' }]);
  assert.equal(r2.estado.fim, 'fuga');
});
