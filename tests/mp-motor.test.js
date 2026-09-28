// Motor da batalha multiplayer (js/mp-motor.js): dois lados com N Pokémon, estado imutável, narração em texto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fotoDoMon, novaBatalhaMP, resolverTurnoMP, acaoDaIA, monMP, nivelarMon, balancearPvP, balancearCoop, naNivelReal, usarRaideNoEvento } from '../js/mp-motor.js';
import { freshVol, calcStats } from '../js/regras.js';
import { prepararChefe } from '../js/boss.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], desc: 'longo…', ...o });
const pokemon = (o = {}) => ({
  id: 1, name: 'teste', nick: '', level: 50, ability: 'none', shiny: false,
  data: { types: ['normal'], sprite: 's', back: 'b', speciesName: 'teste', baseExp: 60, effort: { attack: 1 } },
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, status: null, sleep: 0, moves: [golpe()], vol: freshVol(), ...o
});
const batalha = (a = [pokemon()], b = [pokemon()]) =>
  novaBatalhaMP(a.map((p, i) => fotoDoMon(p, 'A' + i, 'jogador' + i)), b.map((p, i) => fotoDoMon(p, 'B' + i, 'ia', 'Selvagem ' + i)));

test('fotoDoMon: cópia enxuta, sem descrição dos golpes, estágios zerados', async () => {
  const f = fotoDoMon(pokemon({ nick: 'Kipo' }), 'A0', 'u1');
  assert.equal(f.nome, 'Kipo'); assert.equal(f.ref, 'A0'); assert.equal(f.dono, 'u1');
  assert.equal(f.moves[0].desc, undefined);
  assert.equal(f.vol.stages.attack, 0);
});

/* Item segurado no multiplayer (pedido do usuário, 28/09/2026): antes `fotoDoMon` não levava `item`, então
   NENHUM item segurado fazia efeito em luta de sala — golpe.js/regras.js já leem `m.item` (é o mesmo motor do
   single player), só faltava o dado viajar. Sem precisar mudar nada no motor: Orbe da Vida (+30% de dano) e
   Restos (cura 1/16 no fim do turno) já provam que a leitura funciona ponta a ponta. */
test('item segurado funciona na luta de multiplayer (Orbe da Vida e Restos)', async t => {
  t.mock.method(Math, 'random', () => 0.99); // acerta, sem crítico, rolagem máxima
  const f = fotoDoMon(pokemon({ item: 'life-orb' }), 'A0', 'u1');
  assert.equal(f.item, 'life-orb', 'fotoDoMon leva o item segurado');
  const semItem = batalha();
  const comOrbe = novaBatalhaMP([fotoDoMon(pokemon({ item: 'life-orb' }), 'A0', 'jogador0')], [fotoDoMon(pokemon(), 'B0', 'ia', 'Selvagem 0')]);
  const r1 = await resolverTurnoMP(semItem, [{ ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0' }]);
  const r2 = await resolverTurnoMP(comOrbe, [{ ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0' }]);
  const dano1 = 100 - monMP(r1.estado, 'B0').hp, dano2 = 100 - monMP(r2.estado, 'B0').hp;
  assert.ok(dano2 > dano1, `Orbe da Vida devia bater mais forte: ${dano2} vs ${dano1}`);
  assert.ok(monMP(r2.estado, 'A0').hp < 100, 'Orbe da Vida também cobra o próprio HP');

  // Restos cura no fim do turno — golpe que não acerta ninguém (Struggle contra si mesmo seria estranho: usa um
  // golpe de status pra não interferir no HP, só deixar o fim de turno rodar)
  const machucado = pokemon({ item: 'leftovers', hp: 50, moves: [golpe({ name: 'growl', cls: 'status', power: null, meta: { statChance: 0 } })] });
  const comRestos = novaBatalhaMP([fotoDoMon(machucado, 'A0', 'jogador0')], [fotoDoMon(pokemon(), 'B0', 'ia', 'Selvagem 0')]);
  const r3 = await resolverTurnoMP(comRestos, [{ ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0' }]);
  assert.equal(monMP(r3.estado, 'A0').hp, 56, 'Restos curou 1/16 de 100 no fim do turno (50 + 6)');
});

/* Item comum (Potion, X Attack...) usado durante a luta de multiplayer (pedido do usuário, 28/09/2026): ocupa a
   vez do Pokémon (não ataca naquele turno), cura/buffa e fica registrado em `itensUsados[dono]` pra cada cliente
   descontar da própria mochila depois — testado aqui via a AÇÃO em si, não via a mochila (isso é multiplayer.js). */
test('item comum ocupa a vez: cura HP, não ataca, e fica em itensUsados[dono]', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const e = novaBatalhaMP([fotoDoMon(pokemon({ hp: 50 }), 'A0', 'jogador0')], [fotoDoMon(pokemon(), 'B0', 'ia', 'Selvagem 0')]);
  const { estado } = await resolverTurnoMP(e, [{ ref: 'A0', tipo: 'item', item: 'potion' }]);
  assert.equal(monMP(estado, 'A0').hp, 70, 'Potion curou 20 HP');
  assert.equal(monMP(estado, 'B0').hp, 100, 'não atacou: usar item ocupa o turno inteiro');
  assert.deepEqual(estado.itensUsados, { jogador0: ['potion'] });
});

/* Item de raide no co-op (pedido do usuário, 28/09/2026): boss.usarItemDeRaide não sabe QUAL Pokémon usou nem
   se o Tera já saiu — usarRaideNoEvento (mp-motor.js) resolve isso lendo o próprio `estado`. */
test('usarRaideNoEvento: Relógio de Areia aplica no principal de quem usou; Fragmento Tera reseta a marca de quem usou', () => {
  const chefeMon = pokemon({ nick: 'Chefe' });
  prepararChefe(chefeMon, 1, 'eternatus-eternamax');
  const estado = novaBatalhaMP(
    [fotoDoMon(pokemon(), 'A0', 'jogador0'), fotoDoMon(pokemon(), 'A1', 'jogador0', null, 1)],
    [fotoDoMon(chefeMon, 'B0', 'ia', 'Chefe')], { evento: 'eternatus-eternamax' });
  estado.gimmicksUsados = { jogador0: { tera: true } };

  const r1 = usarRaideNoEvento(estado, 'jogador0', 'relogio');
  assert.equal(r1.ok, true);
  assert.equal(monMP(estado, 'A0').vol.stages.speed, 2, 'vai no PRINCIPAL (slot 0) de quem usou');
  assert.equal(monMP(estado, 'A1').vol.stages.speed, 0, 'não afeta o outro Pokémon do mesmo jogador');

  const r2 = usarRaideNoEvento(estado, 'jogador0', 'fragmento');
  assert.equal(r2.ok, true);
  assert.equal(estado.gimmicksUsados.jogador0.tera, false, 'reseta a marca de Tera usado de quem usou');

  assert.equal(usarRaideNoEvento(estado, 'jogador0', 'cinza').ok, true);
  assert.deepEqual(estado.campo.lados.A.resisteRaide, { tipo: 'fire', turnos: 3 });
});

test('turno: dano aplicado, PP gasto, estado original intacto', async t => {
  t.mock.method(Math, 'random', () => 0.99); // acerta, sem crítico, rolagem máxima
  const e = batalha();
  const { estado, eventos } = await resolverTurnoMP(e, [{ ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0' }]);
  assert.ok(monMP(estado, 'B0').hp < 100);
  assert.equal(monMP(estado, 'A0').moves[0].ppLeft, 34);
  assert.equal(monMP(e, 'B0').hp, 100); // não mutou
  assert.ok(eventos.some(x => x.txt.includes('usou Tackle')));
  assert.equal(estado.turno, 2);
});

test('vários do mesmo lado: todos agem e o lado A vence', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const e = batalha([pokemon(), pokemon()], [pokemon({ hp: 20 })]);
  const { estado } = await resolverTurnoMP(e, [
    { ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0' }, { ref: 'A1', tipo: 'golpe', golpe: 0, alvo: 'B0' }]);
  assert.equal(monMP(estado, 'B0').hp, 0);
  assert.equal(estado.fim, 'A');
});

test('alvo desmaiado: o golpe vai pra outro vivo do mesmo lado', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const e = batalha([pokemon()], [pokemon({ hp: 0 }), pokemon()]);
  const { estado } = await resolverTurnoMP(e, [{ ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0' }]);
  assert.ok(monMP(estado, 'B1').hp < 100);
});

test('lado A inteiro desmaiado = B vence', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const e = batalha([pokemon({ hp: 5 })], [pokemon()]);
  const { estado } = await resolverTurnoMP(e, [{ ref: 'B0', tipo: 'golpe', golpe: 0, alvo: 'A0' }]);
  assert.equal(estado.fim, 'B');
});

test('fuga: mais rápido que o inimigo foge na hora', async () => {
  const rapido = pokemon({ stats: { ...pokemon().stats, speed: 200 } });
  const { estado, eventos } = await resolverTurnoMP(batalha([rapido]), [{ ref: 'A0', tipo: 'fugir' }]);
  assert.equal(estado.fim, 'fuga');
  assert.ok(eventos[0].txt.includes('fugiu'));
});

test('golpe de status: baixa o atributo do alvo', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const growl = golpe({ name: 'growl', cls: 'status', power: null, stats: [{ stat: 'attack', change: -1 }] });
  const { estado } = await resolverTurnoMP(batalha([pokemon({ moves: [growl] })]), [{ ref: 'A0', tipo: 'golpe', golpe: 0, alvo: 'B0' }]);
  assert.equal(monMP(estado, 'B0').vol.stages.attack, -1);
});

// Pokémon completo (base/IVs/EVs/natureza) pra dar pra recalcular stats
const base = { hp: 80, attack: 80, defense: 80, 'special-attack': 80, 'special-defense': 80, speed: 80 };
const zeros = () => ({ hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 });
const completo = (level, hpFracao = 1) => {
  const p = pokemon({ level, nature: 'hardy', ivs: zeros(), evs: zeros(), data: { ...pokemon().data, base } });
  p.stats = calcStats(p); p.hp = Math.round(p.stats.hp * hpFracao);
  return fotoDoMon(p, 'X', 'j');
};

test('nivelarMon: recalcula os stats no nível pedido e mantém a fração de HP', async () => {
  const m = completo(10, 0.5), n = nivelarMon(m, 50);
  assert.equal(n.level, 50);
  assert.ok(n.stats.hp > m.stats.hp && n.stats.attack > m.stats.attack);
  assert.equal(n.hp, Math.round(n.stats.hp * m.hp / m.stats.hp));
  assert.equal(m.level, 10); // não mutou
  assert.equal(nivelarMon({ ...completo(10), hp: 0 }, 50).hp, 0); // desmaiado continua desmaiado
});

test('balancearPvP: todo mundo no nível médio; lado menor ganha HP proporcional', async () => {
  const { A, B, nivel } = balancearPvP([completo(10), completo(30)], [completo(50)]);
  assert.equal(nivel, 30);
  assert.ok([...A, ...B].every(m => m.level === 30));
  assert.equal(B[0].stats.hp, Math.round(A[0].stats.hp * 2)); // 1 contra 2: HP ×2
  const igual = balancearPvP([completo(20)], [completo(40)]);
  assert.equal(igual.A[0].stats.hp, igual.B[0].stats.hp); // mesmo tamanho: sem bônus
});

test('balancearCoop: time todo no nível do anfitrião; lembra quem lutou no nível real', async () => {
  const t = balancearCoop([completo(15), completo(60), completo(8)], 15);
  assert.deepEqual(t.map(m => m.level), [15, 15, 15]);
  assert.deepEqual(t.map(naNivelReal), [true, false, false]); // só quem já era Nv. 15 leva XP/itens pra run
  assert.equal(t[1].nivelReal, 60);
  assert.equal(naNivelReal(completo(30)), true); // sem balancear: nível real
});

test('PvP: ninguém foge; desistir entrega a luta', async () => {
  const rapido = pokemon({ stats: { ...pokemon().stats, speed: 200 } });
  const e = novaBatalhaMP([fotoDoMon(rapido, 'A0', 'j1')], [fotoDoMon(pokemon(), 'B0', 'j2')], { pvp: true });
  assert.equal((await resolverTurnoMP(e, [{ ref: 'A0', tipo: 'fugir' }])).estado.fim, null);
  const { estado } = await resolverTurnoMP(e, [{ ref: 'B0', tipo: 'desistir' }]);
  assert.equal(estado.fim, 'A');
  assert.equal(monMP(estado, 'B0').hp, 0);
});

test('acaoDaIA: golpe com PP num alvo vivo do outro lado; sem PP = Struggle', async () => {
  const e = batalha([pokemon({ hp: 0 }), pokemon()], [pokemon()]);
  const a = acaoDaIA(e, monMP(e, 'B0'), () => 0);
  assert.deepEqual([a.golpe, a.alvo], [0, 'A1']);
  const semPP = batalha([pokemon()], [pokemon({ moves: [golpe({ ppLeft: 0 })] })]);
  assert.equal(acaoDaIA(semPP, monMP(semPP, 'B0')).golpe, -1);
});
