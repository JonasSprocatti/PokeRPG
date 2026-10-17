// Golpes especiais (js/especiais.js) no motor único (js/golpe.js) e nas contas (js/regras.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GOLPES_ESPECIAIS } from '../js/especiais.js';
import { usarGolpe, fimDeTurno, fimDaRodada, golpeTravado, passarGravidade, desfazerCopia, desfazerForma, desfazerTrace,
  aplicarArmadilhas, desfazerItens } from '../js/golpe.js';
import { poderDoFling } from '../js/especiais.js';
import { seg } from '../js/segurados.js';
import { hab } from '../js/habilidades.js';
import { freshVol, poderEspecial, chanceOhko, danoResidual, calcDamage, TRAVAS, GRAVIDADE_TURNOS, APERTO_MIN, APERTO_MAX,
  noChao, eficacia, motivoBloqueio, passarTravas, podeCopiar, ordenarAcoes, salaAtiva, passarLado, LADO_VAZIO, heal } from '../js/regras.js';

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
    'danoFixo',                               // dano que não passa pela fórmula (regras.danoFixoDe)
    // 🎭 usar o golpe de OUTRO (golpe.usarCopia): Mimic, Metronome, Mirror Move, Copycat, Sleep Talk, Assist,
    // Nature Power, Me First, Instruct, Transform — e o Snore, que só precisava furar a trava de sono
    'copia', 'guardaNoSlot', 'exigeFlag', 'mult', 'repete', 'soNoSono', 'transforma',
    'substituto',                             // 🪆 Substitute e Shed Tail (o boneco vive em `vol.substituto`)
    // 🧠 trocar habilidade: todas via `m.abilityAntes` (desfazerTrace), menos Gastro Acid (`vol.semHabilidade`)
    'copiaHabilidade', 'trocaHabilidade', 'poeHabilidade', 'anulaHabilidade',
    // 🎒 item do outro (golpe.anotarItem + batalha.desfazerItens): Trick, Switcheroo, Bestow, Recycle, Fling, Natural Gift, Teatime
    'trocaItem', 'daItem', 'reciclar', 'arremessa', 'presenteDaNatureza', 'horaDoCha',
    'contra', 'bide',                         // ⚔ contra-ataque sobre `vol.ultimoDano` (regras.danoDoContra)
    // 🏠 campo: as 3 salas, os 2 "sports", Ion Deluge, Fairy Lock e Court Change
    'sala', 'sport', 'ionizado', 'travaFuga', 'trocaLados',
    'umTurno',                                // proteção de lado que vale UMA rodada (Wide/Quick Guard, Crafty Shield, Mat Block)
    'semImunidade',                           // 👁 Foresight, Odor Sleuth, Miracle Eye (regras.eficacia)
    // 🔄 os que nos jogos dependem de trocar de Pokémon: aqui o substituto é um companheiro em campo
    'desejoDeCura', 'devolvePP', 'reviver',
    'reordena', 'trocaLugar',                 // ⏱ After You/Quash (ctx.reordenar) e Ally Switch
    // o resto, um a um
    'maldicao', 'laco', 'rancor', 'tiraPP', 'selaGolpes', 'semCura', 'semItem', 'calaPorTurnos',
    'manto', 'furtar', 'passaStatus', 'tipoDoTerreno', 'tipoDoMeuGolpe', 'tipoQueResiste', 'tipoDoAlvo',
    'miraCerta', 'critoCerto', 'holofote', 'trancar', 'poExplosivo', 'eletrifica',
    'presente', 'surra', 'estocar', 'cuspir', 'engolir']);
  const formulas = new Set(['hpBaixo', 'hpAlto', 'giroscopio', 'eletro', 'dobraAlvoComStatus', 'dobraComStatus', 'dobraAlvoEnvenenado', 'dobraAlvoMetade',
    'pesoDoAlvo', 'pesoRelativo', 'estagios', 'estagiosDoAlvo', 'hpDoAlvo',
    'felicidade', 'felicidadeInversa', 'magnitude',                                       // Return, Frustration, Magnitude
    'ppRestante', 'fling']);                                                              // Trump Card · Fling (poder do item)
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

test('Smack Down/Thousand Arrows: o `unknown` da PokéAPI não sorteia status (#87); o do Tri Attack sorteia', async t => {
  t.mock.method(Math, 'random', () => 0.01);
  for (const name of ['smack-down', 'thousand-arrows']) {
    const alvo = mon();
    await usarGolpe(mon(), alvo, golpe({ name, type: 'rock', power: 50, meta: { ailment: 'unknown', ailChance: 100 } }), true, ctx());
    assert.ok(alvo.hp > 0);
    assert.equal(alvo.status, null, name);
  }
  const alvo = mon();
  await usarGolpe(mon(), alvo, golpe({ name: 'tri-attack', power: 80, meta: { ailment: 'unknown', ailChance: 20 } }), true, ctx());
  assert.ok(['burn', 'freeze', 'paralysis'].includes(alvo.status));
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

/* ---- leva de 13/10/2026 (2ª parte): copiar golpe alheio, substituto e trocar habilidade ---- */

test('Substituto leva o golpe no lugar e bloqueia status; `authentic` e Infiltrator atravessam', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ nome: 'U' }), a = mon({ nome: 'A' });
  await usarGolpe(u, a, status('substitute'), true, ctx());
  assert.equal(u.vol.substituto, 40, '1/4 de 160');
  assert.equal(u.hp, 120, 'o custo saiu do HP');

  // golpe de dano bate no BONECO, não nele
  const c = ctx();
  await usarGolpe(a, u, golpe({ power: 30 }), false, c);
  assert.equal(u.hp, 120, 'o HP não encostou');
  assert.ok(u.vol.substituto < 40, 'o boneco apanhou');
  assert.ok(c.msgs.some(m => m.includes('substituto')), c.msgs.join(' | '));

  // golpe de status não passa
  const cs = ctx();
  await usarGolpe(a, u, status('thunder-wave', { target: 'selected-pokemon', meta: { ailment: 'paralysis' } }), false, cs);
  assert.equal(u.status, null, cs.msgs.join(' | '));
  assert.ok(cs.msgs.some(m => m.includes('bloqueia')));

  // o boneco estoura, e o dano que sobra se PERDE
  const forte = ctx();
  await usarGolpe(a, u, golpe({ power: 250 }), false, forte);
  assert.equal(u.vol.substituto, undefined, 'se desfez');
  assert.equal(u.hp, 120, 'o excesso não vazou pro HP');

  // Infiltrator fura o boneco
  await usarGolpe(u, a, status('substitute'), true, ctx());
  const fura = ctx();
  await usarGolpe(mon({ ability: 'infiltrator' }), u, golpe({ power: 30 }), false, fura);
  assert.ok(u.hp < 120, 'Infiltrator bateu nele mesmo');
});

test('Mirror Move devolve o golpe do alvo; sem flag `mirror` e sem golpe, falha dizendo por quê', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ nome: 'U' }), a = mon({ nome: 'A', moves: [golpe({ name: 'ember', type: 'fire', power: 40 })] });
  // nada pra espelhar ainda
  const vazio = ctx();
  await usarGolpe(u, a, status('mirror-move', { target: 'selected-pokemon' }), true, vazio);
  assert.ok(vazio.msgs.some(m => m.includes('ainda não usou')), vazio.msgs.join(' | '));

  // o alvo usa Ember; agora o espelho devolve Ember NELE
  await usarGolpe(a, u, a.moves[0], true, ctx());
  const hpAntes = a.hp;
  const c = ctx();
  await usarGolpe(u, a, status('mirror-move', { target: 'selected-pokemon' }), true, c);
  assert.ok(c.msgs.some(m => m.includes('ember')), c.msgs.join(' | '));
  assert.ok(a.hp < hpAntes, 'o Ember voltou pro dono');
});

test('Copycat copia o último golpe da LUTA, de quem for', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const campo = { lados: {} };
  const u = mon({ nome: 'U' }), a = mon({ nome: 'A' });
  const aliado = mon({ nome: 'L', moves: [golpe({ name: 'bubble', type: 'water', power: 40 })] });
  const c = () => ctx({ campo, aliadosDe: m => m === u ? [aliado] : [], oponentesDe: m => m === u ? [a] : [u, aliado] });
  await usarGolpe(aliado, a, aliado.moves[0], true, c());
  assert.equal(campo.ultimo, 'bubble');
  const hpAntes = a.hp;
  const cc = c();
  await usarGolpe(u, a, status('copycat'), true, cc);
  assert.ok(cc.msgs.some(m => m.includes('bubble')), cc.msgs.join(' | '));
  assert.ok(a.hp < hpAntes);
});

test('Sleep Talk e Snore furam a trava de sono; acordado, falham dizendo isso', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const outro = golpe({ name: 'ember', type: 'fire', power: 40 });
  const u = mon({ status: 'sleep', sleep: 3, moves: [status('sleep-talk'), outro] });
  const a = mon();
  const c = ctx();
  await usarGolpe(u, a, u.moves[0], true, c);
  assert.ok(a.hp < 160, 'o golpe sorteado saiu mesmo dormindo: ' + c.msgs.join(' | '));
  assert.equal(u.status, 'sleep', 'continua dormindo');
  assert.ok(u.sleep < 3, 'mas o turno de sono contou');

  // acordado, falha — e diz por quê (não é "nada aconteceu")
  const acordado = mon({ moves: [status('sleep-talk'), outro] });
  const ca = ctx();
  await usarGolpe(acordado, mon(), acordado.moves[0], true, ca);
  assert.ok(ca.msgs.some(m => m.includes('só funciona dormindo')), ca.msgs.join(' | '));
  assert.ok(!ca.msgs.some(m => m.includes('será ajustado')));

  // Snore é golpe de DANO e passa pela mesma porta
  const ronca = mon({ status: 'sleep', sleep: 3, moves: [golpe({ name: 'snore', power: 50 })] });
  const alvo = mon();
  await usarGolpe(ronca, alvo, ronca.moves[0], true, ctx());
  assert.ok(alvo.hp < 160, 'o ronco machucou');
});

test('Metronome sorteia entre os golpes de quem está em campo; Nature Power lê o terreno', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ nome: 'U', moves: [status('metronome')] });
  const a = mon({ nome: 'A', moves: [golpe({ name: 'vine-whip', type: 'grass', power: 45 })] });
  const c = ctx({ campo: { lados: {} }, aliadosDe: () => [], oponentesDe: m => m === u ? [a] : [u] });
  await usarGolpe(u, a, u.moves[0], true, c);
  // o único golpe copiável em campo é o do inimigo (Metronome está em SEM_COPIA)
  assert.ok(c.msgs.some(m => m.includes('vine-whip')), c.msgs.join(' | '));

  // Nature Power: sem terreno é Tri Attack; no campo de grama, Energy Ball
  const semTerreno = ctx({ campo: { lados: {} } });
  await usarGolpe(mon(), mon(), status('nature-power', { target: 'selected-pokemon' }), true, semTerreno);
  assert.ok(semTerreno.msgs.some(m => m.includes('tri-attack')), semTerreno.msgs.join(' | '));
  const grama = ctx({ campo: { lados: {}, terreno: 'grama', terrenoTurnos: 5 } });
  await usarGolpe(mon(), mon(), status('nature-power', { target: 'selected-pokemon' }), true, grama);
  assert.ok(grama.msgs.some(m => m.includes('energy-ball')), grama.msgs.join(' | '));
});

test('Mimic guarda o golpe até o fim da luta; Sketch guarda pra sempre', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvo = mon({ moves: [golpe({ name: 'ember', type: 'fire', power: 40 })] });
  await usarGolpe(alvo, mon(), alvo.moves[0], true, ctx());

  const u = mon({ moves: [status('mimic', { target: 'selected-pokemon' })] });
  await usarGolpe(u, alvo, u.moves[0], true, ctx());
  assert.equal(u.moves[0].name, 'ember');
  assert.equal(u.moves[0].ppLeft, 5, 'Mimic vem com 5 PP');
  assert.ok(u.movesAntes, 'guardou o original pro fim da batalha');
  desfazerCopia(u);
  assert.equal(u.moves[0].name, 'mimic', 'o endBattle devolve o Mimic');

  const s = mon({ moves: [status('sketch', { target: 'selected-pokemon' })] });
  await usarGolpe(s, alvo, s.moves[0], true, ctx());
  assert.equal(s.moves[0].name, 'ember');
  assert.equal(s.movesAntes, undefined, 'Sketch é permanente: nada pra desfazer');
  desfazerCopia(s);
  assert.equal(s.moves[0].name, 'ember');
});

test('Transform copia tipos, atributos, golpes e habilidade — menos o HP; o endBattle desfaz', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ nome: 'U', hp: 100, data: { types: ['normal'], sprite: 'd.png', back: 'db.png', art: 'da.png' } });
  const a = mon({ nome: 'A', ability: 'levitate', data: { types: ['water', 'flying'], sprite: 'a.png', back: 'ab.png', art: 'aa.png' },
    moves: [golpe({ name: 'surf', type: 'water', power: 90 })] });
  a.stats.attack = 200;
  await usarGolpe(u, a, status('transform', { target: 'selected-pokemon' }), true, ctx());
  assert.deepEqual(u.data.types, ['water', 'flying']);
  assert.equal(u.data.sprite, 'a.png');
  assert.equal(u.stats.attack, 200);
  assert.equal(u.stats.hp, 160, 'o HP máximo continua o SEU');
  assert.equal(u.hp, 100, 'e o HP atual também');
  assert.equal(u.ability, 'levitate');
  assert.equal(u.moves[0].name, 'surf');
  assert.equal(u.moves[0].ppLeft, 5);
  // duas vezes falha
  const c = ctx();
  await usarGolpe(u, a, status('transform', { target: 'selected-pokemon' }), true, c);
  assert.ok(c.msgs.some(m => m.includes('falhou')));
  // o fim da batalha devolve tudo (desfazerForma + desfazerTrace + desfazerCopia, a mesma linha do endBattle)
  desfazerForma(u); desfazerTrace(u); desfazerCopia(u);
  assert.deepEqual(u.data.types, ['normal']);
  assert.equal(u.stats.attack, 100);
  assert.equal(u.ability, 'none');
  assert.equal(u.moves[0].name, 'tackle');
});

test('Role Play copia, Skill Swap troca, Entrainment dá a sua e Worry Seed impõe Insomnia', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ nome: 'U', ability: 'static' }), a = mon({ nome: 'A', ability: 'levitate' });
  await usarGolpe(u, a, status('role-play', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(u.ability, 'levitate');
  assert.equal(u.abilityAntes, 'static', 'o endBattle devolve por desfazerTrace');
  desfazerTrace(u);
  assert.equal(u.ability, 'static');

  await usarGolpe(u, a, status('skill-swap', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(u.ability, 'levitate');
  assert.equal(a.ability, 'static');

  const e = mon({ ability: 'guts' }), alvo = mon({ ability: 'levitate' });
  await usarGolpe(e, alvo, status('entrainment', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(alvo.ability, 'guts', 'Entrainment dá a de quem usa');
  assert.equal(e.ability, 'guts');

  const w = mon(), v = mon({ ability: 'levitate' });
  await usarGolpe(w, v, status('worry-seed', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(v.ability, 'insomnia');
});

test('Gastro Acid anula a habilidade sem mexer no save; Stance Change nunca é tocada', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const a = mon({ nome: 'A', ability: 'levitate' });
  await usarGolpe(mon(), a, status('gastro-acid', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(a.vol.semHabilidade, true);
  assert.equal(a.ability, 'levitate', 'o nome fica: a ficha continua certa');
  assert.deepEqual(hab(a), {}, 'mas o efeito foi embora');
  // o golpe Terrestre, que Levitate barrava, agora acerta
  const c = ctx();
  await usarGolpe(mon(), a, golpe({ name: 'earthquake', type: 'ground', power: 100 }), true, c);
  assert.ok(a.hp < 160, c.msgs.join(' | '));

  // habilidade que é MECÂNICA do motor não se troca nem se anula
  const aegis = mon({ ability: 'stance-change' });
  const t2 = ctx();
  await usarGolpe(mon(), aegis, status('gastro-acid', { target: 'selected-pokemon' }), true, t2);
  assert.equal(aegis.vol.semHabilidade, undefined);
  assert.ok(t2.msgs.some(m => m.includes('falhou')));
  const t3 = ctx();
  await usarGolpe(mon({ ability: 'static' }), aegis, status('role-play', { target: 'selected-pokemon' }), true, t3);
  assert.ok(t3.msgs.some(m => m.includes('falhou')), t3.msgs.join(' | '));
});

test('Instruct faz o ALVO repetir o último golpe dele, contra quem usou', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ nome: 'U' }), a = mon({ nome: 'A', moves: [golpe({ name: 'ember', type: 'fire', power: 40 })] });
  // sem nada pra repetir
  const vazio = ctx();
  await usarGolpe(u, a, status('instruct', { target: 'selected-pokemon' }), true, vazio);
  assert.ok(vazio.msgs.some(m => m.includes('falhou')), vazio.msgs.join(' | '));

  await usarGolpe(a, u, a.moves[0], true, ctx());
  const hpAntes = u.hp;
  const c = ctx();
  await usarGolpe(u, a, status('instruct', { target: 'selected-pokemon' }), true, c);
  assert.ok(u.hp < hpAntes, 'o inimigo bateu de novo em quem mandou: ' + c.msgs.join(' | '));
});

test('cópia não copia cópia: SEM_COPIA fecha a recursão', () => {
  for (const n of ['metronome', 'mirror-move', 'copycat', 'sleep-talk', 'assist', 'mimic', 'sketch', 'transform', 'instruct', 'me-first', 'nature-power', 'struggle'])
    assert.equal(podeCopiar(n), false, `${n} deveria estar em SEM_COPIA`);
  // golpe de dois turnos também fica fora (a cópia executa na hora, não carrega)
  for (const n of ['fly', 'dig', 'solar-beam']) assert.equal(podeCopiar(n), false, n);
  assert.equal(podeCopiar('ember'), true);
  assert.equal(podeCopiar(undefined), false);
});

/* ---- leva de 13/10/2026 (3ª parte): item, contra-ataque, ordem do turno, lado, salas e a cauda longa ---- */

test('Trick troca o item, Bestow dá o seu e Sticky Hold barra os dois', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ nome: 'U', item: 'leftovers' }), a = mon({ nome: 'A', item: 'oran-berry' });
  await usarGolpe(u, a, status('trick', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(u.item, 'oran-berry'); assert.equal(a.item, 'leftovers');
  // e os dois ficam ANOTADOS: numa vitória o item volta (batalha.desfazerItens)
  assert.equal(u.itemAntes, 'leftovers'); assert.equal(a.itemAntes, 'oran-berry');

  const b = mon({ item: 'eviolite' }), vazio = mon();
  await usarGolpe(b, vazio, status('bestow', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(b.item, null); assert.equal(vazio.item, 'eviolite');

  // Sticky Hold não solta
  const cola = mon({ nome: 'C', ability: 'sticky-hold', item: 'hard-stone' });
  const c = ctx();
  await usarGolpe(mon({ item: 'leftovers' }), cola, status('trick', { target: 'selected-pokemon' }), true, c);
  assert.equal(cola.item, 'hard-stone', c.msgs.join(' | '));
});

test('o item volta na VITÓRIA, mas o que você roubou de mão vazia fica', () => {
  // quem foi roubado recupera
  const roubado = { item: 'oran-berry', itemAntes: 'leftovers' };
  assert.equal(desfazerItens(roubado), 'leftovers');
  assert.equal(roubado.item, 'leftovers');
  assert.equal('itemAntes' in roubado, false);
  // quem tinha a mão vazia e ganhou algo, fica com ele (senão o Thief não serviria pra nada)
  const ladrao = { item: 'oran-berry', itemAntes: null };
  assert.equal(desfazerItens(ladrao), null);
  assert.equal(ladrao.item, 'oran-berry');
  // quem nunca teve item mexido não é tocado
  assert.equal(desfazerItens({ item: 'leftovers' }), null);
});

test('Fling usa o poder do item e o perde; Recycle o traz de volta', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  assert.equal(poderDoFling('iron-ball'), 130);
  assert.equal(poderDoFling('oran-berry'), 10, 'fruta é sempre 10');
  assert.equal(poderDoFling('potion'), 30, 'o que não está na tabela vale o padrão');
  assert.equal(poderDoFling(null), null);

  const u = mon({ item: 'iron-ball' }), a = mon();
  await usarGolpe(u, a, golpe({ name: 'fling', type: 'dark', power: null }), true, ctx());
  assert.ok(a.hp < 160, 'bateu');
  assert.equal(u.item, null, 'o item voou');
  assert.equal(u.vol.itemGasto, 'iron-ball');

  await usarGolpe(u, a, status('recycle'), true, ctx());
  assert.equal(u.item, 'iron-ball', 'reciclou');
  // sem item gasto, falha
  const c = ctx();
  await usarGolpe(mon(), mon(), status('recycle'), true, c);
  assert.ok(c.msgs.some(m => m.includes('falhou')));
});

test('Natural Gift pega o tipo da fruta; sem fruta, falha', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  // Fruta Occa = Fogo. Contra um alvo de Planta isso é super efetivo
  const planta = mon({ data: { types: ['grass'] } });
  const c = ctx();
  await usarGolpe(mon({ item: 'occa-berry' }), planta, golpe({ name: 'natural-gift', type: 'normal', power: null }), true, c);
  assert.ok(c.msgs.some(m => m.includes('super efetivo')), c.msgs.join(' | '));

  const semFruta = ctx();
  await usarGolpe(mon({ item: 'leftovers' }), mon(), golpe({ name: 'natural-gift', type: 'normal', power: null }), true, semFruta);
  assert.ok(semFruta.msgs.some(m => m.includes('não tem fruta')), semFruta.msgs.join(' | '));
});

test('Counter devolve o dobro do físico; Mirror Coat só o especial; sem levar nada, falham', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ nome: 'U' }), a = mon({ nome: 'A' });
  // ninguém bateu ainda
  const vazio = ctx();
  await usarGolpe(u, a, golpe({ name: 'counter', type: 'fighting', power: null }), true, vazio);
  assert.ok(vazio.msgs.some(m => m.includes('falhou')), vazio.msgs.join(' | '));

  // leva um golpe FÍSICO e devolve o dobro
  await usarGolpe(a, u, golpe({ power: 40 }), true, ctx());
  const levou = u.vol.ultimoDano.valor;
  assert.equal(u.vol.ultimoDano.classe, 'physical');
  await usarGolpe(u, a, golpe({ name: 'counter', type: 'fighting', power: null }), false, ctx());
  assert.equal(a.hp, 160 - levou * 2);

  // Mirror Coat não devolve golpe físico
  const mc = ctx();
  await usarGolpe(u, a, golpe({ name: 'mirror-coat', type: 'psychic', power: null }), false, mc);
  assert.ok(mc.msgs.some(m => m.includes('falhou')), mc.msgs.join(' | '));

  // e o `ultimoDano` morre no fim da rodada: "neste turno" é literal
  fimDaRodada(u);
  assert.equal(u.vol.ultimoDano, undefined);
});

test('Bide guarda dois turnos e devolve o dobro', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ nome: 'U' }), a = mon({ nome: 'A' });
  const bide = golpe({ name: 'bide', type: 'normal', power: null });
  await usarGolpe(u, a, bide, true, ctx());
  assert.ok(u.vol.bide, 'entrou em guarda');
  assert.equal(golpeTravado(u).name, 'bide', 'repete sozinho');
  // leva dois golpes, um em cada turno
  await usarGolpe(a, u, golpe({ power: 40 }), true, ctx());
  await usarGolpe(u, a, bide, true, ctx());
  await usarGolpe(a, u, golpe({ power: 40 }), true, ctx());
  const guardado = u.vol.bide.total;
  assert.ok(guardado > 0);
  const c = ctx();
  await usarGolpe(u, a, bide, true, c);
  assert.equal(a.hp, 160 - guardado * 2, c.msgs.join(' | '));
  assert.equal(u.vol.bide, undefined, 'soltou e destravou');
});

test('Trick Room inverte a ordem dentro da prioridade, sem furar prioridade nem Stall', () => {
  const rapido = { quem: 'R', prio: 0, vel: 200 }, lento = { quem: 'L', prio: 0, vel: 50 };
  const prioritario = { quem: 'P', prio: 1, vel: 10 };
  assert.deepEqual(ordenarAcoes([rapido, lento], () => 0.5).map(a => a.quem), ['R', 'L']);
  assert.deepEqual(ordenarAcoes([rapido, lento], () => 0.5, true).map(a => a.quem), ['L', 'R'], 'na sala o lento vai antes');
  // prioridade continua por cima da sala
  assert.equal(ordenarAcoes([rapido, lento, prioritario], () => 0.5, true)[0].quem, 'P');
  assert.equal(salaAtiva({ salaInvertida: 3 }, 'salaInvertida'), true);
  assert.equal(salaAtiva({ salaInvertida: 0 }, 'salaInvertida'), false);
});

test('After You e Quash mexem na fila; sem o gancho (sala) o golpe diz que ali não dá', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const pedidos = [];
  const c = ctx({ reordenar: (m, modo) => { pedidos.push([m.nome, modo]); return true; } });
  await usarGolpe(mon(), mon({ nome: 'A' }), status('after-you', { target: 'selected-pokemon' }), true, c);
  await usarGolpe(mon(), mon({ nome: 'A' }), status('quash', { target: 'selected-pokemon' }), true, c);
  assert.deepEqual(pedidos, [['A', 'proximo'], ['A', 'ultimo']]);
  // sem ctx.reordenar: falha e explica, como o Roar na sala
  const sala = ctx();
  await usarGolpe(mon(), mon(), status('after-you', { target: 'selected-pokemon' }), true, sala);
  assert.ok(sala.msgs.some(m => m.includes('luta de sala')), sala.msgs.join(' | '));
});

test('Wide Guard barra área, Quick Guard barra prioridade, Crafty Shield barra status', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const campo = { lados: {} };
  const u = mon({ nome: 'U' }), a = mon({ nome: 'A' });
  const c = () => ctx({ campo, ladoDe: m => m === u ? 'jogador' : 'inimigo', aliadosDe: () => [], oponentesDe: m => m === u ? [a] : [u] });

  await usarGolpe(u, u, status('wide-guard'), true, c());
  assert.equal(campo.lados.jogador.wide, 1, 'vale UMA rodada');
  const g = c();
  await usarGolpe(a, u, golpe({ name: 'earthquake', type: 'ground', power: 100, target: 'all-other-pokemon' }), false, g);
  assert.equal(u.hp, 160, g.msgs.join(' | '));
  // golpe de alvo único passa normalmente
  const n = c();
  await usarGolpe(a, u, golpe({ power: 40 }), false, n);
  assert.ok(u.hp < 160, 'a Guarda Ampla só barra área');

  // a rodada acaba e a guarda cai
  passarLado(campo.lados.jogador);
  assert.equal(campo.lados.jogador.wide, 0);

  // Quick Guard
  u.hp = 160;
  await usarGolpe(u, u, status('quick-guard'), true, c());
  const q = c();
  await usarGolpe(a, u, golpe({ name: 'quick-attack', power: 40, priority: 1 }), false, q);
  assert.equal(u.hp, 160, q.msgs.join(' | '));

  // Crafty Shield
  passarLado(campo.lados.jogador);
  await usarGolpe(u, u, status('crafty-shield'), true, c());
  const s = c();
  await usarGolpe(a, u, status('growl', { target: 'selected-pokemon', stats: [{ stat: 'attack', change: -1 }] }), false, s);
  assert.equal(u.vol.stages.attack, 0, s.msgs.join(' | '));
});

test('Lucky Chant tira o crítico do lado; Sticky Web pega quem entra', async t => {
  // crítico garantido (Laser Focus) não passa pelo Canto da Sorte
  const u = mon(), a = mon();
  u.vol.critoCerto = true;
  const comCanto = calcDamage(u, a, golpe(), null, null, { ...LADO_VAZIO(), sorte: 3 });
  assert.equal(comCanto.crit, false);
  const sem = calcDamage(u, a, golpe(), null, null, LADO_VAZIO());
  assert.equal(sem.crit, true);

  // Sticky Web: a Velocidade de quem entra cai (quem voa não encosta)
  t.mock?.method?.(Math, 'random', () => 0.5);
  const campo = { lados: { inimigo: { ...LADO_VAZIO(), teia: 1 } } };
  const entrou = mon();
  await aplicarArmadilhas(entrou, ctx({ campo, ladoDe: () => 'inimigo' }));
  assert.equal(entrou.vol.stages.speed, -1);
  const voador = mon({ data: { types: ['flying'] } });
  await aplicarArmadilhas(voador, ctx({ campo, ladoDe: () => 'inimigo' }));
  assert.equal(voador.vol.stages.speed, 0, 'quem voa passa por cima da teia');
});

test('Foresight tira a imunidade do Fantasma; Miracle Eye a do Sombrio', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const fantasma = mon({ data: { types: ['ghost'] } });
  assert.equal(eficacia({}, 'normal', fantasma), 0);
  await usarGolpe(mon(), fantasma, status('foresight', { target: 'selected-pokemon' }), true, ctx());
  assert.deepEqual(fantasma.vol.semImunidade, ['ghost']);
  assert.equal(eficacia({}, 'normal', fantasma), 1, 'agora o golpe Normal acerta');
  assert.equal(eficacia({}, 'fighting', fantasma), 1);
  // e não mexe no resto da tabela: Fantasma continua resistindo a Inseto? (0.5 pelo CHART)
  assert.ok(eficacia({}, 'ghost', fantasma) > 1, 'Fantasma × Fantasma continua super efetivo');

  const sombrio = mon({ data: { types: ['dark'] } });
  await usarGolpe(mon(), sombrio, status('miracle-eye', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(eficacia({}, 'psychic', sombrio), 1);
});

test('Wonder Room troca as defesas; Magic Room e Embargo desligam o item', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const campo = { lados: {} };
  const u = mon({ nome: 'U' }), a = mon({ nome: 'A' });
  a.stats.defense = 300; a.stats['special-defense'] = 50;
  const fisico = golpe({ power: 80 });
  const antes = calcDamage(u, a, fisico, null, null, null, true).dmg;
  const c = ctx({ campo, aliadosDe: () => [], oponentesDe: m => m === u ? [a] : [u] });
  await usarGolpe(u, a, status('wonder-room'), true, c);
  assert.equal(campo.salaMaravilhas, 5);
  assert.equal(a.vol.salaMaravilhas, true);
  assert.ok(calcDamage(u, a, fisico, null, null, null, true).dmg > antes, 'o golpe físico passa a bater na Def.Esp. (que é baixa)');
  // usar de novo FECHA a sala, como nos jogos
  await usarGolpe(u, a, status('wonder-room'), true, c);
  assert.equal(campo.salaMaravilhas, 0);
  assert.equal(a.vol.salaMaravilhas, undefined);

  // Magic Room / Embargo: `seg` devolve vazio com o item na mão
  const comItem = mon({ item: 'leftovers' });
  assert.ok(seg(comItem).curaFimTurno, 'os Restos valem');
  comItem.vol.semItem = 5;
  assert.deepEqual(seg(comItem), {}, 'com a sala/embargo, o item não vale nada');
  assert.equal(comItem.item, 'leftovers', 'mas continua na mão');
});

test('Mud Sport corta o tipo pela metade pros dois lados', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const campo = { lados: {} };
  const u = mon(), a = mon({ nome: 'A' });
  const c = () => ctx({ campo, aliadosDe: () => [], oponentesDe: () => [] });
  await usarGolpe(u, a, status('mud-sport'), true, c());
  assert.deepEqual(campo.sports, ['electric']);
  const comSport = 160 - a.hp;
  a.hp = 160;
  await usarGolpe(u, a, golpe({ name: 'thunderbolt', type: 'electric', cls: 'special', power: 90 }), true, c());
  const dano = 160 - a.hp;
  a.hp = 160; campo.sports = [];
  await usarGolpe(u, a, golpe({ name: 'thunderbolt', type: 'electric', cls: 'special', power: 90 }), true, c());
  assert.ok(160 - a.hp > dano, `sem o sport bate mais (${160 - a.hp} > ${dano})`);
});

test('Healing Wish cura um companheiro e derruba quem usou; Revival Blessing levanta o caído', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ nome: 'U' }), amigo = mon({ nome: 'L', hp: 20, status: 'burn' });
  const c = ctx({ aliadosDe: m => m === u ? [amigo] : [], oponentesDe: () => [] });
  await usarGolpe(u, mon(), status('healing-wish'), true, c);
  assert.equal(amigo.hp, 160); assert.equal(amigo.status, null);
  assert.equal(u.hp, 0, 'quem usou se sacrifica');

  const r = mon({ nome: 'R' }), caido = mon({ nome: 'C', hp: 0 });
  const cr = ctx({ aliadosDe: m => m === r ? [caido] : [], oponentesDe: () => [] });
  await usarGolpe(r, mon(), status('revival-blessing', { target: 'user' }), true, cr);
  assert.equal(caido.hp, 80);
  assert.ok(r.hp > 0, 'Revival Blessing não cobra a vida de quem usa');
  // sem ninguém caído, falha
  const vazio = ctx({ aliadosDe: () => [], oponentesDe: () => [] });
  await usarGolpe(mon(), mon(), status('revival-blessing', { target: 'user' }), true, vazio);
  assert.ok(vazio.msgs.some(m => m.includes('falhou')));
});

test('Destiny Bond leva o algoz junto; Grudge zera o PP do golpe que derrubou', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvo = mon({ nome: 'A', hp: 10 }), algoz = mon({ nome: 'Z' });
  await usarGolpe(alvo, algoz, status('destiny-bond'), true, ctx());
  assert.equal(alvo.vol.laco, true);
  const c = ctx();
  await usarGolpe(algoz, alvo, golpe({ power: 120 }), false, c);
  assert.equal(alvo.hp, 0);
  assert.equal(algoz.hp, 0, 'foi junto: ' + c.msgs.join(' | '));

  const g = mon({ nome: 'G', hp: 10 }), mata = mon({ nome: 'M' });
  const arma = golpe({ power: 120 });
  mata.moves = [arma];
  await usarGolpe(g, mata, status('grudge'), true, ctx());
  await usarGolpe(mata, g, arma, false, ctx());
  assert.equal(g.hp, 0);
  assert.equal(arma.ppLeft, 0, 'o rancor zerou o PP');
});

test('Imprison sela os golpes em comum, pela mesma trava das 3 telas e da IA', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const comum = golpe({ name: 'ember', type: 'fire', power: 40 });
  const u = mon({ moves: [status('imprison'), golpe({ name: 'ember', type: 'fire', power: 40 })] });
  const a = mon({ nome: 'A', moves: [comum, golpe({ name: 'surf', type: 'water', power: 90 })] });
  await usarGolpe(u, a, u.moves[0], true, ctx());
  assert.deepEqual(a.vol.proibidos, ['ember']);
  assert.equal(motivoBloqueio(a, comum)?.causa, 'imprison');
  assert.equal(motivoBloqueio(a, a.moves[1]), null, 'o que você não sabe, ele ainda usa');
});

test('Heal Block tranca a cura na porta única (regras.heal)', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const a = mon({ nome: 'A', hp: 50 });
  await usarGolpe(mon(), a, status('heal-block', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(a.vol.semCura, 5);
  assert.equal(heal(a, 40), 0, 'heal devolve 0 e não cura');
  assert.equal(a.hp, 50);
  // e passa com os turnos, no mesmo lugar das outras travas
  for (let i = 0; i < 5; i++) passarTravas(a);
  assert.equal(a.vol.semCura, undefined);
  heal(a, 40);
  assert.equal(a.hp, 90);
});

test('Magic Coat devolve o status; Snatch furta o buff do outro', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ nome: 'U' }), a = mon({ nome: 'A' });
  await usarGolpe(a, a, status('magic-coat'), true, ctx());
  assert.equal(a.vol.manto, true);
  const c = ctx({ aliadosDe: () => [], oponentesDe: m => m === u ? [a] : [u] });
  // Thunder Wave tem a flag `reflectable`: volta pro dono
  await usarGolpe(u, a, status('thunder-wave', { target: 'selected-pokemon', meta: { ailment: 'paralysis' } }), true, c);
  assert.equal(a.status, null, c.msgs.join(' | '));
  assert.equal(u.status, 'paralysis', 'o próprio remetente se paralisou');
  assert.equal(a.vol.manto, undefined, 'o manto vale uma vez');

  // Snatch: o Swords Dance do outro vira seu
  const l = mon({ nome: 'L' }), v = mon({ nome: 'V' });
  await usarGolpe(l, l, status('snatch'), true, ctx());
  const cs = ctx({ aliadosDe: () => [], oponentesDe: m => m === v ? [l] : [v] });
  await usarGolpe(v, v, status('swords-dance', { stats: [{ stat: 'attack', change: 2 }] }), true, cs);
  assert.equal(l.vol.stages.attack, 2, 'o ladrão ficou com o buff: ' + cs.msgs.join(' | '));
  assert.equal(v.vol.stages.attack, 0);
});

test('Present e Beat Up: os dois golpes de conta própria', async t => {
  // 0.1 cai na faixa de CURA (até 0.2), que é a piada do Present
  t.mock.method(Math, 'random', () => 0.1);
  const a = mon({ hp: 80 });
  const c = ctx();
  await usarGolpe(mon(), a, golpe({ name: 'present', type: 'normal', power: null }), true, c);
  assert.ok(a.hp > 80, 'curou o alvo: ' + c.msgs.join(' | '));

  // Beat Up: um acerto por companheiro em pé
  t.mock.restoreAll();
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ data: { types: ['dark'], base: { attack: 100 } } });
  const amigos = [mon({ data: { types: ['normal'], base: { attack: 80 } } }), mon({ data: { types: ['normal'], base: { attack: 60 } } })];
  const alvo = mon({ nome: 'A' });
  const cb = ctx({ aliadosDe: m => m === u ? amigos : [], oponentesDe: () => [] });
  await usarGolpe(u, alvo, golpe({ name: 'beat-up', type: 'dark', power: null }), true, cb);
  assert.ok(cb.msgs.some(m => m.includes('3 acertos')), cb.msgs.join(' | '));
  assert.ok(alvo.hp < 160);
});

test('Stockpile guarda, Spit Up cospe e Swallow engole — e os dois zeram o estoque', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const u = mon({ nome: 'U' }), a = mon({ nome: 'A' });
  const est = status('stockpile', { stats: [{ stat: 'defense', change: 1 }, { stat: 'special-defense', change: 1 }] });
  await usarGolpe(u, a, est, true, ctx());
  assert.equal(u.vol.estoque, 1);
  assert.equal(u.vol.stages.defense, 1, 'o Stockpile também sobe as defesas, pelo caminho comum');
  await usarGolpe(u, a, est, true, ctx());
  assert.equal(u.vol.estoque, 2);
  // Spit Up: 100 de poder por carga
  const c = ctx();
  await usarGolpe(u, a, golpe({ name: 'spit-up', type: 'normal', cls: 'special', power: null }), true, c);
  assert.ok(a.hp < 160, c.msgs.join(' | '));
  assert.equal(u.vol.estoque, undefined, 'zerou');
  // sem estoque, falha
  const vazio = ctx();
  await usarGolpe(u, a, golpe({ name: 'spit-up', type: 'normal', cls: 'special', power: null }), true, vazio);
  assert.ok(vazio.msgs.some(m => m.includes('falhou')));
  // Swallow cura
  await usarGolpe(u, a, est, true, ctx());
  u.hp = 40;
  await usarGolpe(u, a, status('swallow'), true, ctx());
  assert.ok(u.hp > 40);
  assert.equal(u.vol.estoque, undefined);
});

test('Curse: Fantasma paga meio HP pra sangrar; quem não é Fantasma se buffa', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const fantasma = mon({ nome: 'F', data: { types: ['ghost'] } }), alvo = mon({ nome: 'A' });
  await usarGolpe(fantasma, alvo, status('curse', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(fantasma.hp, 80, 'pagou metade do HP máximo');
  assert.equal(alvo.vol.maldicao, true);
  await fimDeTurno(alvo, ctx());
  assert.equal(alvo.hp, 120, '1/4 por turno');

  // quem não é Fantasma só mexe nos atributos
  const normal = mon({ data: { types: ['normal'] } });
  await usarGolpe(normal, mon(), status('curse', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(normal.hp, 160, 'não paga HP');
  assert.equal(normal.vol.stages.attack, 1);
  assert.equal(normal.vol.stages.speed, -1);
});

test('os quatro que trocam o próprio tipo, e os três alvos de conta', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  // Camouflage lê o chão
  const u = mon();
  await usarGolpe(u, mon(), status('camouflage'), true, ctx({ campo: { lados: {}, terreno: 'grama', terrenoTurnos: 5 } }));
  assert.deepEqual(u.vol.tipos, ['grass']);

  // Reflect Type copia o do alvo
  const r = mon();
  await usarGolpe(r, mon({ data: { types: ['water', 'flying'] } }), status('reflect-type', { target: 'selected-pokemon' }), true, ctx());
  assert.deepEqual(r.vol.tipos, ['water', 'flying']);

  // Conversion 2: um tipo que RESISTE ao último golpe que te acertou
  const c2 = mon({ nome: 'C' }), bate = mon();
  await usarGolpe(bate, c2, golpe({ name: 'ember', type: 'fire', power: 40 }), true, ctx());
  assert.equal(c2.vol.ultimoDano.tipo, 'fire');
  await usarGolpe(c2, bate, status('conversion-2'), true, ctx());
  assert.ok(c2.vol.tipos?.length, 'virou algum tipo');
  assert.ok(eficacia({}, 'fire', c2) < 1, 'e esse tipo resiste a Fogo');
});

test('Powder explode o golpe de Fogo; Electrify troca o tipo do golpe do alvo', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const a = mon({ nome: 'A' });
  await usarGolpe(mon(), a, status('powder', { target: 'selected-pokemon' }), true, ctx());
  const c = ctx();
  const vitima = mon();
  await usarGolpe(a, vitima, golpe({ name: 'ember', type: 'fire', power: 40 }), true, c);
  assert.equal(vitima.hp, 160, 'o golpe não saiu: ' + c.msgs.join(' | '));
  assert.equal(a.hp, 120, 'e explodiu nele (1/4)');

  // Electrify: o golpe Normal do alvo vira Elétrico — e aí o Terrestre fica imune a ele
  const e = mon({ nome: 'E' });
  await usarGolpe(mon(), e, status('electrify', { target: 'selected-pokemon' }), true, ctx());
  const terra = mon({ data: { types: ['ground'] } });
  const ce = ctx();
  await usarGolpe(e, terra, golpe({ power: 40 }), true, ce);
  assert.equal(terra.hp, 160, 'golpe Normal virou Elétrico e não afeta Terrestre: ' + ce.msgs.join(' | '));
});

test('Court Change troca os lados; Spite tira PP; Octolock tranca e aperta', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const campo = { lados: { jogador: { ...LADO_VAZIO(), reflect: 4 }, inimigo: { ...LADO_VAZIO(), pedras: true } } };
  await usarGolpe(mon(), mon(), status('court-change'), true, ctx({ campo, ladoDe: () => 'jogador' }));
  assert.equal(campo.lados.jogador.pedras, true);
  assert.equal(campo.lados.inimigo.reflect, 4);

  const arma = golpe({ name: 'ember', type: 'fire', power: 40 });
  const a = mon({ nome: 'A', moves: [arma] });
  await usarGolpe(a, mon(), arma, true, ctx());
  const ppAntes = arma.ppLeft;
  await usarGolpe(mon(), a, status('spite', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(arma.ppLeft, ppAntes - 4);

  const o = mon({ nome: 'O' });
  await usarGolpe(mon(), o, status('octolock', { target: 'selected-pokemon' }), true, ctx());
  assert.equal(o.vol.preso, true, 'não foge mais');
  await fimDeTurno(o, ctx());
  assert.equal(o.vol.stages.defense, -1);
  assert.equal(o.vol.stages['special-defense'], -1);
});
