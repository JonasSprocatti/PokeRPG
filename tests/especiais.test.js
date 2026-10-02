// Golpes especiais (js/especiais.js) no motor único (js/golpe.js) e nas contas (js/regras.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GOLPES_ESPECIAIS } from '../js/especiais.js';
import { usarGolpe, fimDeTurno, fimDaRodada, golpeTravado } from '../js/golpe.js';
import { freshVol, poderEspecial, chanceOhko, danoResidual, calcDamage, TRAVAS } from '../js/regras.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const status = (name, o = {}) => golpe({ name, cls: 'status', power: null, acc: null, target: 'user', ...o });
const mon = (o = {}) => ({
  level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0,
  stats: { hp: 160, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 160, moves: [golpe()], vol: freshVol(), ...o
});
const ctx = (extra = {}) => { const msgs = []; return { msgs, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); }, ...extra }; };

test('tabela: só comportamentos que o motor conhece', () => {
  // Comportamento novo em especiais.js entra AQUI junto — a lista é o contrato entre a tabela e o motor (golpe.js).
  // `poder` é o único que não é tratado em golpe.js: ele vira fórmula em regras.poderEspecial (checado logo abaixo).
  const ok = new Set(['protege', 'aguentaTurno', 'foco', 'descanso', 'autoDesmaio', 'ohko', 'soDormindo', 'toxico', 'semente', 'carga', 'invulneravel', 'recarga', 'furia', 'poder', 'danoIgualHp',
    'soPrimeiroTurno',                        // Fake Out, First Impression
    'soSeAlvoAtaca',                          // Sucker Punch, Thunderclap: só funcionam contra quem vai usar golpe de dano
    'clima', 'terreno',                       // Rain Dance / Electric Terrain e cia.
    'lado', 'soNoGelo', 'armadilha',          // telas e armadilhas de entrada (Aurora Veil só no granizo/neve)
    'trava',                                  // Taunt, Encore, Disable, Torment (regras.motivoBloqueio)
    'generoOposto',                           // Captivate: só pega quem é do gênero oposto (regras.generoOposto)
    'viraTipo', 'ganhaTipo',                  // Soak/Magic Powder trocam o tipo do alvo; Forest's Curse/Trick-or-Treat acrescentam um
    'forcaSaida', 'prende', 'passaBonus',     // o que nos jogos dependia de trocar de Pokémon (Roar, Mean Look, Baton Pass)
    'puneContato', 'voltaPostura',            // barreira que castiga quem encosta; King's Shield devolve o Aegislash pro Escudo
    'atkDe', 'atkDoAlvo', 'defDe']);          // golpe que ataca/defende por outro atributo (Body Press, Foul Play, Psyshock) — regras.calcDamage
  const formulas = new Set(['hpBaixo', 'hpAlto', 'giroscopio', 'eletro', 'dobraAlvoComStatus', 'dobraComStatus', 'dobraAlvoEnvenenado', 'dobraAlvoMetade',
    'pesoDoAlvo', 'pesoRelativo', 'estagios', 'estagiosDoAlvo', 'hpDoAlvo']);
  for (const [n, e] of Object.entries(GOLPES_ESPECIAIS)) {
    for (const k of Object.keys(e)) assert.ok(ok.has(k), `${n}: comportamento desconhecido "${k}"`);
    if (e.poder) assert.ok(formulas.has(e.poder), `${n}: fórmula "${e.poder}"`);
    if (e.trava) assert.ok(TRAVAS.includes(e.trava), `${n}: trava "${e.trava}" não existe (regras.TRAVAS)`);
  }
});

test('Protect bloqueia o golpe; repetir seguido pode falhar; acaba no fim da rodada', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon(), a = mon();
  await usarGolpe(u, a, status('protect'), true, ctx());
  assert.equal(u.vol.protegido, true);
  await usarGolpe(a, u, golpe(), false, ctx());
  assert.equal(u.hp, 160);
  fimDaRodada(u);
  assert.equal(u.vol.protegido, false);
  await usarGolpe(u, a, status('protect'), true, ctx());   // 2º seguido: 1/3 de chance, 0.5 falha
  assert.equal(u.vol.protegido, false);
});

test('Endure: sobrevive com 1 HP', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ hp: 5 }), a = mon();
  await usarGolpe(u, a, status('endure'), true, ctx());
  await usarGolpe(a, u, golpe({ power: 200 }), false, ctx());
  assert.equal(u.hp, 1);
});

test('Explosion: quem usa desmaia', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon(), a = mon();
  await usarGolpe(u, a, golpe({ name: 'explosion', power: 250 }), true, ctx());
  assert.equal(u.hp, 0);
  assert.ok(a.hp < 160);
});

test('Rest cura tudo e dorme 2 turnos', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ hp: 20, status: 'burn' }), a = mon();
  await usarGolpe(u, a, status('rest'), true, ctx());
  assert.equal(u.hp, 160); assert.equal(u.status, 'sleep');
  await usarGolpe(u, a, golpe(), true, ctx()); await usarGolpe(u, a, golpe(), true, ctx());
  assert.equal(a.hp, 160);                                  // dormiu 2 turnos
  await usarGolpe(u, a, golpe(), true, ctx());
  assert.equal(u.status, null); assert.ok(a.hp < 160);       // acordou e atacou
});

test('Toxic: dano cresce a cada turno', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon(), a = mon();
  await usarGolpe(u, a, status('toxic', { target: 'selected-pokemon', acc: null, meta: { ailment: 'poison' } }), true, ctx());
  assert.equal(a.status, 'poison'); assert.equal(a.vol.toxico, 1);
  assert.equal(danoResidual(a), 10);                         // 1/16
  await fimDeTurno(a, ctx());
  assert.equal(a.hp, 150); assert.equal(danoResidual(a), 20); // 2/16
});

test('Leech Seed drena 1/8 e cura quem plantou; Planta é imune', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ ref: 'A0', hp: 100 }), a = mon({ ref: 'B0' });
  const c = ctx({ refDe: m => m.ref, monPorRef: r => [u, a].find(m => m.ref === r) });
  await usarGolpe(u, a, status('leech-seed', { target: 'selected-pokemon' }), true, c);
  await fimDeTurno(a, c);
  assert.equal(a.hp, 140); assert.equal(u.hp, 120);
  const planta = mon({ data: { types: ['grass'] } });
  await usarGolpe(u, planta, status('leech-seed', { target: 'selected-pokemon' }), true, c);
  assert.equal(planta.vol.semente, undefined);
});

test('golpe de carga: 1º turno prepara (invulnerável), 2º ataca sem gastar PP', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon(), a = mon(), fly = golpe({ name: 'fly', type: 'flying', power: 90 });
  await usarGolpe(u, a, fly, true, ctx());
  assert.equal(a.hp, 160); assert.equal(u.vol.invul, true); assert.equal(golpeTravado(u), fly); assert.equal(fly.ppLeft, 34);
  await usarGolpe(a, u, golpe(), false, ctx());
  assert.equal(u.hp, 160);                                   // no ar: errou
  await usarGolpe(u, a, golpe(), true, ctx());               // escolha ignorada: Fly sai
  assert.ok(a.hp < 160); assert.equal(fly.ppLeft, 34); assert.equal(golpeTravado(u), null);
});

test('Hyper Beam: turno seguinte perdido', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon(), a = mon({ stats: { ...mon().stats, hp: 999 }, hp: 999 });
  await usarGolpe(u, a, golpe({ name: 'hyper-beam', cls: 'special', power: 150 }), true, ctx());
  const depois = a.hp;
  await usarGolpe(u, a, golpe(), true, ctx());
  assert.equal(a.hp, depois);
  await usarGolpe(u, a, golpe(), true, ctx());
  assert.ok(a.hp < depois);
});

test('Outrage: repete 2–3 turnos e confunde', async t => {
  t.mock.method(Math, 'random', () => 0.99);                 // rand(2,3) = 3; confusão não bate em si (0.99 > 1/3)
  const u = mon(), a = mon({ stats: { ...mon().stats, hp: 9999 }, hp: 9999 }), out = golpe({ name: 'outrage', type: 'dragon', power: 120, acc: null });
  for (let i = 0; i < 3; i++) await usarGolpe(u, a, i ? golpe({ acc: null }) : out, true, ctx());
  assert.equal(out.ppLeft, 34); assert.equal(u.vol.furia, undefined); assert.ok(u.vol.conf > 0);
});

test('OHKO: nível maior não cai; Sturdy barra; senão nocaute', async t => {
  assert.equal(chanceOhko(mon({ level: 30 }), mon({ level: 40 })), 0);
  assert.equal(chanceOhko(mon({ level: 50 }), mon({ level: 40 })), 0.4);
  t.mock.method(Math, 'random', () => 0.1);
  const fissura = golpe({ name: 'fissure', type: 'ground', power: null, acc: 30 });
  const a = mon({ level: 40 }); await usarGolpe(mon(), a, fissura, true, ctx());
  assert.equal(a.hp, 0);
  const st = mon({ level: 40, ability: 'sturdy' }); await usarGolpe(mon(), st, fissura, true, ctx());
  assert.equal(st.hp, 160);
});

test('Dream Eater só em quem dorme', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const de = golpe({ name: 'dream-eater', type: 'psychic', cls: 'special', power: 100, meta: { drain: 50 } });
  const acordado = mon(); await usarGolpe(mon(), acordado, de, true, ctx());
  assert.equal(acordado.hp, 160);
  const dormindo = mon({ status: 'sleep', sleep: 3 }); await usarGolpe(mon(), dormindo, de, true, ctx());
  assert.ok(dormindo.hp < 160);
});

test('Focus Energy aumenta o crítico', async t => {
  t.mock.method(Math, 'random', () => 0.4);                  // < 1/2 (estágio 2) e > 1/24 (estágio 0)
  const u = mon(), a = mon(), c = ctx();
  await usarGolpe(u, a, status('focus-energy'), true, c);
  assert.equal(u.vol.foco, 2);
  await usarGolpe(u, a, golpe(), true, c);
  assert.ok(c.msgs.includes('Um golpe crítico!'));
});

test('poder variável', () => {
  const g = n => ({ name: n, power: 60 });
  assert.equal(poderEspecial(mon({ hp: 1 }), mon(), g('flail')), 200);
  assert.equal(poderEspecial(mon(), mon(), g('flail')), 20);
  assert.equal(poderEspecial(mon(), mon(), g('eruption')), 150);
  assert.equal(poderEspecial(mon({ hp: 80 }), mon(), g('eruption')), 75);
  assert.equal(poderEspecial(mon(), mon({ status: 'burn' }), g('hex')), 120);
  assert.equal(poderEspecial(mon(), mon({ hp: 80 }), g('brine')), 120);
  assert.equal(poderEspecial(mon(), mon(), g('tackle')), null);
});

test('poder pelo peso: o do alvo (Low Kick) e a razão entre os dois (Heavy Slam)', () => {
  const g = n => ({ name: n, power: null });
  const kg = v => mon({ data: { types: ['normal'], weight: v * 10 } });   // a API manda hectogramas
  // Low Kick: faixas de 10, 25, 50, 100 e 200 kg
  assert.equal(poderEspecial(mon(), kg(5), g('low-kick')), 20);
  assert.equal(poderEspecial(mon(), kg(10), g('low-kick')), 40);          // o limite entra na faixa de cima
  assert.equal(poderEspecial(mon(), kg(49.9), g('low-kick')), 60);
  assert.equal(poderEspecial(mon(), kg(99), g('low-kick')), 80);
  assert.equal(poderEspecial(mon(), kg(199), g('low-kick')), 100);
  assert.equal(poderEspecial(mon(), kg(460), g('low-kick')), 120);        // Snorlax
  // Heavy Slam: 2×, 3×, 4× e 5× mais pesado
  assert.equal(poderEspecial(kg(100), kg(60), g('heavy-slam')), 40);
  assert.equal(poderEspecial(kg(100), kg(50), g('heavy-slam')), 60);
  assert.equal(poderEspecial(kg(100), kg(30), g('heavy-slam')), 80);
  assert.equal(poderEspecial(kg(100), kg(25), g('heavy-slam')), 100);
  assert.equal(poderEspecial(kg(100), kg(20), g('heavy-slam')), 120);
  // espécie guardada no cache antes de o peso existir: desiste e vale o poder da tabela, não "peso zero"
  assert.equal(poderEspecial(mon(), mon(), g('low-kick')), null);
  assert.equal(poderEspecial(kg(100), mon(), g('heavy-slam')), null);
});

test('poder por estágios e por HP do alvo', () => {
  const g = (n, power) => ({ name: n, power });
  const comEstagios = st => mon({ vol: { ...freshVol(), stages: { ...freshVol().stages, ...st } } });
  assert.equal(poderEspecial(mon(), mon(), g('stored-power', 20)), 20);
  assert.equal(poderEspecial(comEstagios({ attack: 2, speed: 1 }), mon(), g('stored-power', 20)), 80);
  assert.equal(poderEspecial(comEstagios({ attack: -6 }), mon(), g('stored-power', 20)), 20);  // queda não tira poder
  assert.equal(poderEspecial(mon(), comEstagios({ defense: 3 }), g('punishment', 60)), 120);
  assert.equal(poderEspecial(mon(), comEstagios({ attack: 6, defense: 6 }), g('punishment', 60)), 200); // teto
  assert.equal(poderEspecial(mon(), mon({ hp: 40 }), g('wring-out', null)), 30);               // 1/4 do HP → 1/4 de 120
  assert.equal(poderEspecial(mon(), mon({ hp: 1 }), g('crush-grip', null)), 1);                // nunca zero
});

/* Aqui o que importa é QUAL atributo entrou na conta, não o número do dano — então o teste compara o golpe
   especial com um golpe de referência do mesmo poder e tipo, mexendo só no atributo que deveria pesar. */
test('golpe que ataca ou defende por outro atributo', () => {
  const g = (name, cls) => ({ name, type: 'normal', cls, power: 80, acc: 100, meta: {}, stats: [] });
  const com = st => mon({ stats: { hp: 160, attack: 50, defense: 50, 'special-attack': 50, 'special-defense': 50, speed: 100, ...st } });
  const dano = (u, t, m) => calcDamage(u, t, m, null, null, null, true).dmg;   // `esperado`: sem crítico nem sorteio

  // Body Press: sobe com a SUA Defesa, não com o seu Ataque
  assert.ok(dano(com({ defense: 200 }), com(), g('body-press', 'physical')) > dano(com({ attack: 200 }), com(), g('body-press', 'physical')));
  // Foul Play: sobe com o Ataque do ALVO, não com o seu
  assert.ok(dano(com(), com({ attack: 200 }), g('foul-play', 'physical')) > dano(com({ attack: 200 }), com(), g('foul-play', 'physical')));
  // Psyshock e cia.: golpe ESPECIAL que bate na Defesa física do alvo
  for (const n of ['psyshock', 'psystrike', 'secret-sword']) {
    assert.ok(dano(com(), com({ defense: 200 }), g(n, 'special')) < dano(com(), com({ 'special-defense': 200 }), g(n, 'special')), n);
  }
  // golpe comum não muda de atributo
  assert.equal(dano(com({ attack: 200 }), com(), g('tackle', 'physical')), dano(com({ attack: 200 }), com({ defense: 50 }), g('tackle', 'physical')));
});

test('Endeavor deixa o alvo com o seu HP', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ hp: 30 }), a = mon();
  await usarGolpe(u, a, golpe({ name: 'endeavor', power: null }), true, ctx());
  assert.equal(a.hp, 30);
});
