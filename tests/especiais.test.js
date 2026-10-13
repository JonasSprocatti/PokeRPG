// Golpes especiais (js/especiais.js) no motor único (js/golpe.js) e nas contas (js/regras.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GOLPES_ESPECIAIS } from '../js/especiais.js';
import { usarGolpe, fimDeTurno, fimDaRodada, golpeTravado, passarGravidade } from '../js/golpe.js';
import { freshVol, poderEspecial, chanceOhko, danoResidual, calcDamage, TRAVAS, GRAVIDADE_TURNOS, APERTO_MIN, APERTO_MAX,
  noChao, eficacia, motivoBloqueio, passarTravas } from '../js/regras.js';

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
    'revezamento',                            // 🔄 quem usa sai de campo e volta no fim da rodada (U-turn, Teleport…)
    'puneContato', 'voltaPostura',            // barreira que castiga quem encosta; King's Shield devolve o Aegislash pro Escudo
    'roubaItem', 'derrubaItem',             // Thief/Covet roubam o item do alvo; Knock Off derruba (o item se perde)
    'atkDe', 'atkDoAlvo', 'defDe',            // golpe que ataca/defende por outro atributo (Body Press, Foul Play, Psyshock) — regras.calcDamage
    // 🤝 golpes de companheiro (dados.ALVOS_ALIADOS): quem recebe é o `dest` de golpe.executar
    'ajudaAliado', 'chamariz',                // Helping Hand reforça o golpe do companheiro; Follow Me/Rage Powder puxam o golpe pra si
    'curaStatus', 'cura', 'sobeEstagios',     // Heal Bell, Aromatherapy, Purify, Lunar Blessing, Take Heart
    'soAliados', 'soPlusMinus',               // Coaching/Dragon Cheer não pegam quem usou; Gear Up/Magnetic Flux só Plus e Minus
    'statAleatorio', 'focoDragao',            // Acupressure; Dragon Cheer vale o dobro no Dragão
    'semEfeitoReal',                          // Hold Hands, Splash, Celebrate não fazem nada nos jogos — não é efeito faltando
    // 🪐 chão e flutuação (regras.noChao/eficacia): Gravity põe todo mundo no chão, Magnet Rise/Telekinesis levantam,
    // Smack Down/Thousand Arrows derrubam de vez
    'gravidade', 'voa', 'noAlvo', 'poeNoChao',
    // ⏳ resolvidos no fim do turno (golpe.fimDeTurno): Yawn, Nightmare, Ingrain, Aqua Ring, Perish Song, Wish
    'bocejo', 'pesadeloGolpe', 'raiz', 'anel', 'cancaoFinal', 'desejo',
    // 📊 contas sobre os estágios e atributos que o motor já guarda (Haze, Psych Up, Belly Drum, Pain Split, os swaps)
    'limpaEstagios', 'copiaEstagios', 'tambor', 'inverteEstagios', 'divideHp',
    'trocaProprios', 'trocaEstagios', 'trocaStat', 'mediaStat',
    'danoFixo']);                             // dano que não passa pela fórmula (regras.danoFixoDe)
  const formulas = new Set(['hpBaixo', 'hpAlto', 'giroscopio', 'eletro', 'dobraAlvoComStatus', 'dobraComStatus', 'dobraAlvoEnvenenado', 'dobraAlvoMetade',
    'pesoDoAlvo', 'pesoRelativo', 'estagios', 'estagiosDoAlvo', 'hpDoAlvo',
    'felicidade', 'felicidadeInversa', 'magnitude']);                                     // Return, Frustration, Magnitude
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

/* 🔄 Revezamento (U-turn, Volt Switch, Flip Turn, Teleport, Parting Shot): quem USA sai de campo. O motor só
   PEDE — quem decide o que "sair" significa é `batalha.forcarSaida` (`ctx.forcarSaida`). O que se trava aqui é o
   contrato: pede com o motivo certo, só depois de o golpe ter feito o que faz, e não desfaz nada ao falhar. */
test('revezamento: o golpe pede a saída de QUEM USOU, com o motivo certo', async () => {
  const pedidos = [];
  const c = ctx({ forcarSaida: async (m, o) => { pedidos.push([m.nome, o.motivo]); return true; } });
  const eu = mon({ nome: 'EU' }), alvo = mon({ nome: 'ALVO' });
  await usarGolpe(eu, alvo, golpe({ name: 'u-turn', power: 70 }), true, c);
  assert.deepEqual(pedidos, [['EU', 'revezamento']], 'quem sai é quem usou, não o alvo');
  assert.ok(alvo.hp < 160, 'e o dano aconteceu antes da troca');
  // Teleport é só a saída: não pode cair no aviso de "efeito será ajustado"
  const c2 = ctx({ forcarSaida: async () => true });
  await usarGolpe(mon(), mon(), status('teleport'), true, c2);
  assert.ok(!c2.msgs.some(m => m.includes('será ajustado')), c2.msgs.join(' | '));
});

test('revezamento: sem ninguém pra cobrir, o golpe avisa e o dano fica de pé', async () => {
  const c = ctx({ forcarSaida: async () => false });      // batalha.js recusa quando não há aliado em campo
  const alvo = mon();
  await usarGolpe(mon(), alvo, golpe({ name: 'u-turn', power: 70 }), true, c);
  assert.ok(c.msgs.some(m => m.includes('ninguém pra cobrir')), c.msgs.join(' | '));
  assert.ok(alvo.hp < 160);
  // na sala (ctx sem forcarSaida) o golpe diz que ali não dá, em vez de fingir que trocou
  const sala = ctx();
  await usarGolpe(mon(), mon(), golpe({ name: 'u-turn', power: 70 }), true, sala);
  assert.ok(sala.msgs.some(m => m.includes('luta de sala')), sala.msgs.join(' | '));
});

test('Suction Cups segura o arrastão, não a própria vontade de sair', async () => {
  const motivos = [];
  const c = ctx({ forcarSaida: async (m, o) => { motivos.push(o.motivo); return true; } });
  // Roar em quem tem Suction Cups: nem chega a pedir
  await usarGolpe(mon(), mon({ ability: 'suction-cups' }), status('roar', { target: 'selected-pokemon' }), true, c);
  assert.deepEqual(motivos, []);
  // o U-turn DELE mesmo continua funcionando
  await usarGolpe(mon({ ability: 'suction-cups' }), mon(), golpe({ name: 'u-turn', power: 70 }), true, c);
  assert.deepEqual(motivos, ['revezamento']);
});

/* ---- leva de 13/10/2026: chão e gravidade, aperto, fim de turno, estágios e dano fixo ---- */

test('Gravidade: põe todo mundo no chão, derruba quem flutua e proíbe golpe de voo', async () => {
  const voador = mon({ data: { types: ['flying'] }, nome: 'V' });
  const u = mon({ nome: 'U' });
  const campo = { lados: {} };
  const c = ctx({ campo, aliadosDe: () => [], oponentesDe: m => m === u ? [voador] : [u] });
  await usarGolpe(u, voador, status('gravity', { target: 'entire-field' }), true, c);
  assert.equal(campo.gravidade, GRAVIDADE_TURNOS);
  assert.equal(voador.vol.noSolo, 'gravidade');
  assert.equal(noChao(voador), true, 'o Voador passa a sentir o chão');
  // a imunidade de TIPO a Terrestre cai: um golpe de Terra agora acerta
  assert.ok(eficacia({}, 'ground', voador) > 0);
  // e os golpes que saem do chão ficam proibidos nas telas, na IA e no motor (flag `gravity` da PokéAPI)
  assert.equal(motivoBloqueio(voador, golpe({ name: 'fly', type: 'flying' }))?.causa, 'gravidade');
  assert.equal(motivoBloqueio(voador, golpe({ name: 'tackle' })), null);
  // 5 rodadas e ela passa — quem foi derrubado pela GRAVIDADE volta a flutuar
  for (let i = 0; i < GRAVIDADE_TURNOS; i++) await passarGravidade(campo, c, [u, voador]);
  assert.equal(voador.vol.noSolo, undefined);
  assert.equal(noChao(voador), false);
});

test('Magnet Rise levanta do chão; Smack Down derruba de vez (e a gravidade não o levanta)', async () => {
  const u = mon();
  await usarGolpe(u, mon(), status('magnet-rise'), true, ctx({ campo: { lados: {} } }));
  assert.equal(u.vol.voando, 5);
  assert.equal(noChao(u), false);
  // golpe Terrestre passa embaixo
  const c = ctx();
  await usarGolpe(mon(), u, golpe({ name: 'earthquake', type: 'ground', power: 100 }), true, c);
  assert.equal(u.hp, 160, c.msgs.join(' | '));
  // a flutuação conta turnos junto das travas (regras.passarTravas)
  for (let i = 0; i < 5; i++) assert.ok(passarTravas(u).length >= 0);
  assert.equal(u.vol.voando, undefined);

  // Smack Down: derruba e NÃO é desfeito pelo fim da gravidade
  const voador = mon({ data: { types: ['flying'] } });
  await usarGolpe(mon(), voador, golpe({ name: 'smack-down', type: 'rock', power: 50 }), true, ctx());
  assert.equal(voador.vol.noSolo, true);
  const campo = { lados: {}, gravidade: 1 };
  await passarGravidade(campo, ctx(), [voador]);
  assert.equal(voador.vol.noSolo, true, 'o Smack Down vale além da gravidade');
});

test('Aperto (Bind & cia.): 1/8 por turno, 4–5 turnos, e não deixa fugir', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvo = mon();
  await usarGolpe(mon(), alvo, golpe({ name: 'fire-spin', type: 'fire', power: 35, meta: { ailment: 'trap', ailChance: 100 } }), true, ctx());
  assert.ok(alvo.vol.aperto, 'ficou preso');
  const turnos = alvo.vol.aperto.turnos;
  assert.ok(turnos >= APERTO_MIN && turnos <= APERTO_MAX);
  const antes = alvo.hp;
  await fimDeTurno(alvo, ctx());
  assert.equal(alvo.hp, antes - Math.floor(160 / 8));
  assert.equal(alvo.vol.aperto.turnos, turnos - 1);
  // os turnos acabam e ele se solta
  for (let i = 0; i < turnos; i++) await fimDeTurno(alvo, ctx());
  assert.equal(alvo.vol.aperto, undefined);
});

test('Bocejo dorme no turno seguinte; Pesadelo só vale dormindo; Desejo cura depois', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvo = mon();
  await usarGolpe(mon(), alvo, status('yawn', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(alvo.vol.bocejo, 2);
  await fimDeTurno(alvo, ctx());
  assert.equal(alvo.status, null, 'ainda não: é no fim do turno SEGUINTE');
  await fimDeTurno(alvo, ctx());
  assert.equal(alvo.status, 'sleep');

  // Pesadelo: agora que ele dorme, pega — e 1/4 do HP por turno
  await usarGolpe(mon(), alvo, status('nightmare', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(alvo.vol.pesadelo, true);
  const antes = alvo.hp;
  await fimDeTurno(alvo, ctx());
  assert.ok(alvo.hp <= antes - Math.floor(160 / 4));
  // acordar desfaz sozinho
  alvo.status = null; alvo.sleep = 0;
  await fimDeTurno(alvo, ctx());
  assert.equal(alvo.vol.pesadelo, undefined);

  // Desejo: a cura é a de QUANDO foi pedida, e chega no turno seguinte
  const u = mon({ hp: 40 });
  await usarGolpe(u, mon(), status('wish'), true, ctx());
  assert.equal(u.vol.desejo.cura, 80);
  await fimDeTurno(u, ctx());
  assert.equal(u.hp, 40, 'ainda não');
  await fimDeTurno(u, ctx());
  assert.equal(u.hp, 120);
});

test('Canção Final derruba os dois lados em 3 turnos', async () => {
  const u = mon({ nome: 'U' }), inimigo = mon({ nome: 'I' });
  const c = ctx({ aliadosDe: () => [], oponentesDe: m => m === u ? [inimigo] : [u] });
  await usarGolpe(u, inimigo, status('perish-song', { target: 'all-pokemon' }), true, c);
  assert.equal(u.vol.cancaoFinal, 3);
  assert.equal(inimigo.vol.cancaoFinal, 3);
  for (let i = 0; i < 3; i++) { await fimDeTurno(u, c); await fimDeTurno(inimigo, c); }
  assert.equal(u.hp, 0);
  assert.equal(inimigo.hp, 0);
});

test('Haze zera, Psych Up copia, Topsy-Turvy inverte e Belly Drum paga meio HP pelo +6', async () => {
  const u = mon({ nome: 'U' }), inimigo = mon({ nome: 'I' });
  inimigo.vol.stages.attack = 3; u.vol.stages.speed = 2;
  const c = ctx({ aliadosDe: () => [], oponentesDe: m => m === u ? [inimigo] : [u] });
  await usarGolpe(u, inimigo, status('haze', { target: 'all-pokemon' }), true, c);
  assert.equal(inimigo.vol.stages.attack, 0);
  assert.equal(u.vol.stages.speed, 0, 'a névoa também apaga os SEUS');

  inimigo.vol.stages.attack = 2; inimigo.vol.stages.defense = -1;
  await usarGolpe(u, inimigo, status('psych-up', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(u.vol.stages.attack, 2);
  assert.equal(u.vol.stages.defense, -1);

  await usarGolpe(u, inimigo, status('topsy-turvy', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(inimigo.vol.stages.attack, -2);
  assert.equal(inimigo.vol.stages.defense, 1);

  const d = mon();
  await usarGolpe(d, mon(), status('belly-drum'), true, ctx());
  assert.equal(d.hp, 80);
  assert.equal(d.vol.stages.attack, 6);
  // sem HP pra pagar, falha
  const fraco = mon({ hp: 50 });
  await usarGolpe(fraco, mon(), status('belly-drum'), true, ctx());
  assert.equal(fraco.hp, 50);
});

test('Pain Split, Speed Swap e Guard Split igualam os números dos dois', async () => {
  const u = mon({ hp: 20 }), a = mon({ hp: 160 });
  await usarGolpe(u, a, status('pain-split', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(u.hp, 90); assert.equal(a.hp, 90);

  const x = mon(), y = mon();
  x.stats.speed = 200; y.stats.speed = 50;
  await usarGolpe(x, y, status('speed-swap', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(x.stats.speed, 50); assert.equal(y.stats.speed, 200);

  x.stats.defense = 100; y.stats.defense = 200;
  x.stats['special-defense'] = 60; y.stats['special-defense'] = 40;
  await usarGolpe(x, y, status('guard-split', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(x.stats.defense, 150); assert.equal(y.stats.defense, 150);
  assert.equal(x.stats['special-defense'], 50); assert.equal(y.stats['special-defense'], 50);
});

test('Dano fixo: número, nível, metade do HP e o próprio HP (Final Gambit leva o dono)', async () => {
  const alvo = () => mon();
  const a = alvo();
  await usarGolpe(mon(), a, golpe({ name: 'dragon-rage', type: 'dragon', power: null }), true, ctx());
  assert.equal(a.hp, 120, 'Dragon Rage dá 40, sempre');

  const b = alvo();
  await usarGolpe(mon({ level: 73 }), b, golpe({ name: 'seismic-toss', type: 'fighting', power: null }), true, ctx());
  assert.equal(b.hp, 160 - 73, 'Seismic Toss dá o nível de quem usou');

  const c2 = alvo();
  await usarGolpe(mon(), c2, golpe({ name: 'super-fang', type: 'normal', power: null }), true, ctx());
  assert.equal(c2.hp, 80, 'Super Fang tira metade do HP ATUAL');

  // Night Shade continua respeitando a tabela de tipos: Fantasma não pega Normal
  const normal = mon({ data: { types: ['normal'] } });
  const cn = ctx();
  await usarGolpe(mon(), normal, golpe({ name: 'night-shade', type: 'ghost', power: null }), true, cn);
  assert.equal(normal.hp, 160, cn.msgs.join(' | '));

  const u = mon({ hp: 55 }), d = alvo();
  await usarGolpe(u, d, golpe({ name: 'final-gambit', type: 'fighting', power: null }), true, ctx());
  assert.equal(d.hp, 105);
  assert.equal(u.hp, 0, 'quem usa Final Gambit desmaia');
});

test('Return e Frustration saem da felicidade; sem felicidade vale o inicial dos jogos', () => {
  const ret = GOLPES_ESPECIAIS.return, fru = GOLPES_ESPECIAIS.frustration;
  assert.equal(poderEspecial(mon({ felicidade: 255 }), mon(), golpe({ name: 'return', ...ret })), 102);
  assert.equal(poderEspecial(mon({ felicidade: 0 }), mon(), golpe({ name: 'return', ...ret })), 1);
  assert.equal(poderEspecial(mon({ felicidade: 0 }), mon(), golpe({ name: 'frustration', ...fru })), 102);
  // selvagem (sem o campo): 70, o inicial dos jogos — nunca NaN
  assert.equal(poderEspecial(mon(), mon(), golpe({ name: 'return', ...ret })), 28);
});

test('Tri Attack sorteia entre queimar, congelar e paralisar em vez de "nada aconteceu"', async t => {
  // efeito de chance se testa FIXANDO o sorteio: 0.0 cai no primeiro da lista (burn)
  t.mock.method(Math, 'random', () => 0);
  const alvo = mon();
  const c = ctx();
  await usarGolpe(mon(), alvo, golpe({ name: 'tri-attack', type: 'normal', power: 80, meta: { ailment: 'unknown', ailChance: 20 } }), true, c);
  assert.equal(alvo.status, 'burn', c.msgs.join(' | '));
  assert.ok(!c.msgs.some(m => m.includes('será ajustado')));
});

test('Splash não promete efeito futuro — nos jogos ele não faz nada mesmo', async () => {
  const c = ctx();
  await usarGolpe(mon(), mon(), status('splash'), true, c);
  assert.ok(!c.msgs.some(m => m.includes('será ajustado')), c.msgs.join(' | '));
});
