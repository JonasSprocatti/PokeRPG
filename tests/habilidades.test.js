// Habilidades (js/habilidades.js) no motor único (js/golpe.js) e nas contas (js/regras.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HABILIDADES, IMPL } from '../js/habilidades.js';
import { usarGolpe, mudarEstagios, aplicarStatus, fimDeTurno, aoEntrarEmCampo } from '../js/golpe.js';
import { calcDamage, effStat, chanceAcerto, freshVol, FAMILIAS_GOLPE } from '../js/regras.js';
import { TYPE_PT, AIL_MSG, STATS } from '../js/dados.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const mon = (o = {}) => ({
  level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0,
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, moves: [golpe()], vol: freshVol(), ...o
});
// narração que só coleta texto (igual à do multiplayer)
const ctx = () => { const msgs = []; return { msgs, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); } }; };

/* Battle Armor / Shell Armor: o golpe NUNCA sai crítico contra quem tem. Vale inclusive sobre golpe de crítico
   garantido — é exatamente pra isso que a habilidade existe, e testar com `crit: 3` (garantido) é o único jeito
   de provar que o gancho corta o caminho todo, e não só melhora a média. */
test('semCritico corta o crítico até quando ele seria garantido', t => {
  t.mock.method(Math, 'random', () => 0);            // sempre crítico, se deixassem
  const golpeCrit = golpe({ meta: { crit: 3 } });
  assert.equal(calcDamage(mon(), mon(), golpeCrit).crit, true, 'sem a habilidade, sai crítico');
  for (const h of ['battle-armor', 'shell-armor']) {
    assert.equal(calcDamage(mon(), mon({ ability: h }), golpeCrit).crit, false, h);
  }
  // é de quem RECEBE: ter a habilidade não impede você de dar crítico
  assert.equal(calcDamage(mon({ ability: 'battle-armor' }), mon(), golpeCrit).crit, true);
});

/* Fur Coat ("dano físico pela metade") e Ice Scales ("dano especial pela metade") são escritas como Defesa ×2 e
   Def. Esp. ×2. Não é atalho — é a mesma matemática. Este teste prova a equivalência, que é o que autoriza a
   escrita curta: se um dia `effStat` ou `calcDamage` mudarem e as duas coisas deixarem de coincidir, cai aqui. */
test('Fur Coat e Ice Scales realmente valem "metade do dano"', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const fisico = golpe({ cls: 'physical', power: 80 }), especial = golpe({ cls: 'special', power: 80 });
  const normal = mon();
  /* "Perto da metade", e não a metade exata: a fórmula oficial tem dois arredondamentos e soma 2 no fim, então
     dobrar a Defesa não corta o dano exatamente pela metade. A faixa é estreita o bastante pra pegar um gancho
     que parou de funcionar, e larga o bastante pra não quebrar por causa do arredondamento. */
  const perto = (a, b, oque) => assert.ok(a > b * 0.45 && a < b * 0.58, `${oque}: ${a} devia ser ~metade de ${b}`);
  perto(calcDamage(mon(), mon({ ability: 'fur-coat' }), fisico).dmg, calcDamage(mon(), normal, fisico).dmg, 'Fur Coat no físico');
  perto(calcDamage(mon(), mon({ ability: 'ice-scales' }), especial).dmg, calcDamage(mon(), normal, especial).dmg, 'Ice Scales no especial');
  // e cada uma vale só pra sua metade: Fur Coat não protege de golpe especial
  assert.equal(calcDamage(mon(), mon({ ability: 'fur-coat' }), especial).dmg, calcDamage(mon(), normal, especial).dmg);
});

test('super-luck aumenta a chance de crítico (focoBase)', t => {
  // 1/24 é a chance normal; com +1 degrau vira 1/8. Um sorteio de 0,1 cai dentro de 1/8 e fora de 1/24.
  t.mock.method(Math, 'random', () => 0.1);
  assert.equal(calcDamage(mon(), mon(), golpe()).crit, false, 'sem a habilidade, 0,1 não é crítico');
  assert.equal(calcDamage(mon({ ability: 'super-luck' }), mon(), golpe()).crit, true);
});

test('tabela: ganchos conhecidos, tipos e status válidos', () => {
  const ganchos = new Set(['pinch', 'stab', 'tecnico', 'critico', 'multStat', 'comStatus', 'precisao', 'precisaoFisica', 'resiste', 'superEfetivo',
    'poucoEfetivo', 'hpCheio', 'imuneTipo', 'absorve', 'cura', 'estagio', 'flashFire', 'soSuperEfetivo', 'imuneStatus', 'semQueda', 'semRecuo',
    'contato', 'contatoDano', 'aguenta', 'semDanoRecuo', 'maxAcertos', 'chanceSecundaria', 'semSecundario', 'sonoRapido', 'fimTurno',
    'curaStatusFimTurno', 'intimida', 'fuga', 'semCritico', 'focoBase', 'estagioAoEntrar',
    // clima (regras.CLIMAS)
    'climaAoEntrar', 'multStatClima', 'curaClima', 'danoClimaProprio', 'imuneClima', 'escondeNoClima', 'curaStatusClima', 'semStatusClima',
    // terrenos (regras.TERRENOS)
    'terrenoAoEntrar', 'multStatTerreno',
    // troca de forma no meio da batalha (golpe.trocarPostura): Aegislash
    'postura',
    // quarta leva (documentados no topo de habilidades.js)
    'danoTipo', 'danoTipoClima', 'golpesFamilia', 'recuo', 'superEfetivoCausado', 'critContraStatus', 'abaixoDeMetade', 'soStatus',
    'ignoraEstagios', 'inverteEstagios', 'dobraEstagios', 'espelhaQueda', 'aoSerBaixado', 'aoNocautear', 'aoSerAtingido', 'limitaStatus',
    'analisa', 'intimidaSobe', 'imuneIntimidacao', 'imunePo', 'toque', 'semDanoIndireto', 'curaComVeneno', 'pressao', 'preguica', 'bloqueiaPrioridade']);
  const tipos = Object.keys(TYPE_PT);
  const stat = (n, s) => assert.ok(STATS.includes(s), `${n}: atributo "${s}"`);
  for (const [nome, h] of Object.entries(HABILIDADES)) {
    for (const k of Object.keys(h)) assert.ok(ganchos.has(k), `${nome}: gancho desconhecido "${k}" (não faz nada no motor)`);
    for (const t of [h.pinch, h.imuneTipo, h.absorve, ...Object.keys(h.resiste || {}), ...Object.keys(h.danoTipo || {})].filter(Boolean)) assert.ok(tipos.includes(t), `${nome}: tipo "${t}"`);
    for (const a of h.imuneStatus || []) assert.ok(AIL_MSG[a] || a === 'confusion', `${nome}: status "${a}"`);
    for (const s of Object.keys({ ...h.multStat, ...h.comStatus })) assert.ok(STATS.includes(s), `${nome}: atributo "${s}"`);
    // ganchos da quarta leva: tipo, status, atributo e família existem de verdade (typo aqui deixaria a habilidade inerte)
    for (const a of [...(h.soStatus || []), h.critContraStatus, h.toque?.status, ...(h.contato?.sorteio || []).map(x => x[0]), ...(typeof h.contato?.status === 'string' ? [h.contato.status] : [])].filter(Boolean)) assert.ok(AIL_MSG[a], `${nome}: status "${a}"`);
    for (const s of [...Object.keys(h.abaixoDeMetade || {}), h.aoSerBaixado?.[0], h.aoNocautear?.[0], h.contato?.estagio?.[0]].filter(Boolean)) stat(nome, s);
    for (const r of h.aoSerAtingido || []) {
      for (const t of r.tipos || []) assert.ok(tipos.includes(t), `${nome}: tipo "${t}"`);
      for (const [s] of r.estagios || []) stat(nome, s);
      assert.ok(r.estagios || r.clima || r.terreno, `${nome}: reação sem efeito`);
    }
    for (const c of Object.values(h.danoTipoClima || {})) for (const t of c.tipos) assert.ok(tipos.includes(t), `${nome}: tipo "${t}"`);
    for (const f of Object.keys(h.golpesFamilia || {})) assert.ok(FAMILIAS_GOLPE[f], `${nome}: família "${f}" não existe`);
  }
  assert.ok(IMPL.size >= 50);
  // cada habilidade aparece UMA vez na tabela: a segunda apagaria a primeira em silêncio (aconteceu com dry-skin)
  const fonte = readFileSync(new URL('../js/habilidades.js', import.meta.url), 'utf8');
  const bloco = fonte.slice(fonte.indexOf('export const HABILIDADES'), fonte.indexOf('export const hab'));
  const escritas = [...bloco.matchAll(/(?:^|[{,]\s*)'?([a-z][a-z0-9-]*)'?\s*:\s*\{/gm)].map(m => m[1]).filter(n => HABILIDADES[n]);
  const vistas = new Set();
  for (const n of escritas) { assert.ok(!vistas.has(n), `${n}: escrita mais de uma vez na tabela`); vistas.add(n); }
});

test('Levitate: golpe Terrestre não afeta', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const alvo = mon({ ability: 'levitate' });
  await usarGolpe(mon(), alvo, golpe({ type: 'ground' }), true, ctx());
  assert.equal(alvo.hp, 100);
});

test('Volt Absorb cura; Lightning Rod sobe At. Esp.; Flash Fire liga o bônus', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const volt = mon({ ability: 'volt-absorb', hp: 50 });
  await usarGolpe(mon(), volt, golpe({ type: 'electric' }), true, ctx());
  assert.equal(volt.hp, 75);
  const rod = mon({ ability: 'lightning-rod' });
  await usarGolpe(mon(), rod, golpe({ type: 'electric' }), true, ctx());
  assert.equal(rod.hp, 100); assert.equal(rod.vol.stages['special-attack'], 1);
  const ff = mon({ ability: 'flash-fire' });
  await usarGolpe(mon(), ff, golpe({ type: 'fire' }), true, ctx());
  assert.equal(ff.vol.flashFire, true);
});

test('Wonder Guard: só super efetivo acerta', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const wg = mon({ ability: 'wonder-guard', data: { types: ['bug'] } });
  await usarGolpe(mon(), wg, golpe({ type: 'normal' }), true, ctx());
  assert.equal(wg.hp, 100);
  await usarGolpe(mon(), wg, golpe({ type: 'fire' }), true, ctx());
  assert.ok(wg.hp < 100);
});

test('Sturdy: com HP cheio, sobrevive com 1', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const s = mon({ ability: 'sturdy', stats: { ...mon().stats, hp: 10 }, hp: 10 });
  await usarGolpe(mon(), s, golpe({ power: 200 }), true, ctx());
  assert.equal(s.hp, 1);
});

test('Static paralisa quem encosta; Rough Skin machuca quem encosta', async t => {
  t.mock.method(Math, 'random', () => 0); // chance de contato passa
  const atacante = mon();
  await usarGolpe(atacante, mon({ ability: 'static' }), golpe(), true, ctx());
  assert.equal(atacante.status, 'paralysis');
  const outro = mon();
  await usarGolpe(outro, mon({ ability: 'rough-skin' }), golpe(), true, ctx());
  assert.equal(outro.hp, 100 - Math.floor(100 / 8));
  const especial = mon();
  await usarGolpe(especial, mon({ ability: 'rough-skin' }), golpe({ cls: 'special' }), true, ctx());
  assert.equal(especial.hp, 100); // golpe especial não encosta
});

test('Clear Body: outro não baixa atributo; o próprio golpe/itens ainda mexem', async () => {
  const cb = mon({ ability: 'clear-body' }), c = ctx();
  await mudarEstagios(cb, [{ stat: 'attack', change: -1 }], c, mon());
  assert.equal(cb.vol.stages.attack, 0);
  assert.ok(c.msgs.some(m => m.includes('impede')));
  await mudarEstagios(cb, [{ stat: 'attack', change: -1 }], ctx()); // sem fonte (ex.: efeito próprio)
  assert.equal(cb.vol.stages.attack, -1);
  const hc = mon({ ability: 'hyper-cutter' });
  await mudarEstagios(hc, [{ stat: 'attack', change: -1 }, { stat: 'defense', change: -1 }], ctx(), mon());
  assert.deepEqual([hc.vol.stages.attack, hc.vol.stages.defense], [0, -1]);
});

test('imunidade a status por habilidade (e confusão com Own Tempo)', async () => {
  const im = mon({ ability: 'immunity' });
  await aplicarStatus(im, 'poison', ctx(), true);
  assert.equal(im.status, null);
  const ot = mon({ ability: 'own-tempo' });
  await aplicarStatus(ot, 'confusion', ctx(), true);
  assert.equal(ot.vol.conf, 0);
  const normal = mon();
  await aplicarStatus(normal, 'poison', ctx());
  assert.equal(normal.status, 'poison');
});

test('Rock Head: sem dano de recuo', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const rh = mon({ ability: 'rock-head' });
  await usarGolpe(rh, mon(), golpe({ meta: { drain: -33 } }), true, ctx());
  assert.equal(rh.hp, 100);
  const sem = mon();
  await usarGolpe(sem, mon(), golpe({ meta: { drain: -33 } }), true, ctx());
  assert.ok(sem.hp < 100);
});

test('fim de turno: Speed Boost sobe Velocidade; Shed Skin pode curar', async t => {
  t.mock.method(Math, 'random', () => 0);
  const sb = mon({ ability: 'speed-boost' });
  await fimDeTurno(sb, ctx());
  assert.equal(sb.vol.stages.speed, 1);
  const ss = mon({ ability: 'shed-skin', status: 'burn' });
  await fimDeTurno(ss, ctx());
  assert.equal(ss.status, null);
  assert.equal(ss.hp, 100); // curou antes da queimadura machucar
});

test('contas: Technician, Thick Fat, Huge Power, Quick Feet, Compound Eyes, Multiscale', t => {
  t.mock.method(Math, 'random', () => 0.99); // sem crítico, rolagem máxima
  const base = calcDamage(mon(), mon(), golpe({ type: 'fire' })).dmg;
  assert.ok(calcDamage(mon({ ability: 'technician' }), mon(), golpe({ type: 'fire' })).dmg > base);
  assert.ok(calcDamage(mon(), mon({ ability: 'thick-fat' }), golpe({ type: 'fire' })).dmg < base);
  assert.ok(calcDamage(mon(), mon({ ability: 'multiscale' }), golpe({ type: 'fire' })).dmg < base);
  assert.ok(calcDamage(mon(), mon({ ability: 'multiscale', hp: 99 }), golpe({ type: 'fire' })).dmg === base); // só com HP cheio
  assert.equal(effStat(mon({ ability: 'huge-power' }), 'attack'), 200);
  assert.equal(effStat(mon({ ability: 'quick-feet', status: 'paralysis' }), 'speed'), 150); // e ignora a queda da paralisia
  assert.equal(effStat(mon({ status: 'paralysis' }), 'speed'), 50);
  assert.ok(Math.abs(chanceAcerto(golpe({ acc: 70 }), mon({ ability: 'compound-eyes' }), mon()) - 0.91) < 1e-9);
});

/* ---------------- quarta leva: habilidades novas e as que estavam incompletas ---------------- */
const razao = (a, b) => a / b;

test('reforço de tipo: Water Bubble dobra Água, Steelworker reforça Aço, e só o tipo certo', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const agua = golpe({ type: 'water' }), aco = golpe({ type: 'steel' });
  const base = calcDamage(mon(), mon(), agua).dmg;
  const r = razao(calcDamage(mon({ ability: 'water-bubble' }), mon(), agua).dmg, base);
  assert.ok(r > 1.9 && r < 2.1, `Water Bubble: ×${r}`);
  assert.equal(calcDamage(mon({ ability: 'water-bubble' }), mon(), golpe({ type: 'fire' })).dmg, calcDamage(mon(), mon(), golpe({ type: 'fire' })).dmg, 'não mexe em outro tipo');
  assert.ok(calcDamage(mon({ ability: 'steelworker' }), mon(), aco).dmg > calcDamage(mon(), mon(), aco).dmg);
  assert.ok(calcDamage(mon({ ability: 'dragons-maw' }), mon(), golpe({ type: 'dragon' })).dmg > calcDamage(mon(), mon(), golpe({ type: 'dragon' })).dmg);
});

test('Sand Force: Pedra/Solo/Aço mais fortes SÓ na tempestade de areia', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const pedra = golpe({ type: 'rock' }), sf = mon({ ability: 'sand-force' });
  assert.ok(calcDamage(sf, mon(), pedra, 'areia').dmg > calcDamage(mon(), mon(), pedra, 'areia').dmg, 'na areia');
  assert.equal(calcDamage(sf, mon(), pedra, 'chuva').dmg, calcDamage(mon(), mon(), pedra, 'chuva').dmg, 'fora da areia');
  assert.equal(calcDamage(sf, mon(), golpe({ type: 'fire' }), 'areia').dmg, calcDamage(mon(), mon(), golpe({ type: 'fire' }), 'areia').dmg, 'outro tipo');
});

test('Iron Fist e Strong Jaw reforçam só a própria família de golpes', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const soco = golpe({ name: 'mach-punch' }), mordida = golpe({ name: 'crunch' }), comum = golpe({ name: 'tackle' });
  const ifist = mon({ ability: 'iron-fist' }), jaw = mon({ ability: 'strong-jaw' });
  assert.ok(calcDamage(ifist, mon(), soco).dmg > calcDamage(mon(), mon(), soco).dmg);
  assert.equal(calcDamage(ifist, mon(), mordida).dmg, calcDamage(mon(), mon(), mordida).dmg);
  assert.ok(calcDamage(jaw, mon(), mordida).dmg > calcDamage(mon(), mon(), mordida).dmg);
  assert.equal(calcDamage(jaw, mon(), comum).dmg, calcDamage(mon(), mon(), comum).dmg);
});

test('Reckless (recuo) e Neuroforce (super efetivo)', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const recuo = golpe({ meta: { drain: -33 } });
  assert.ok(calcDamage(mon({ ability: 'reckless' }), mon(), recuo).dmg > calcDamage(mon(), mon(), recuo).dmg);
  assert.equal(calcDamage(mon({ ability: 'reckless' }), mon(), golpe()).dmg, calcDamage(mon(), mon(), golpe()).dmg, 'golpe sem recuo');
  const lutador = golpe({ type: 'fighting' }), alvo = () => mon({ data: { types: ['normal'] } });   // Lutador é super efetivo em Normal
  assert.ok(calcDamage(mon({ ability: 'neuroforce' }), alvo(), lutador).dmg > calcDamage(mon(), alvo(), lutador).dmg);
});

test('Toxic Boost só com veneno, Flare Boost só com queimadura (e a queimadura ainda corta o dano do Toxic Boost)', () => {
  assert.equal(effStat(mon({ ability: 'toxic-boost', status: 'poison' }), 'attack'), 150);
  assert.equal(effStat(mon({ ability: 'toxic-boost', status: 'burn' }), 'attack'), 100);
  assert.equal(effStat(mon({ ability: 'flare-boost', status: 'burn' }), 'special-attack'), 150);
  assert.equal(effStat(mon({ ability: 'flare-boost', status: 'poison' }), 'special-attack'), 100);
  assert.equal(effStat(mon({ ability: 'guts', status: 'sleep' }), 'attack'), 150, 'Guts continua valendo pra qualquer status');
});

test('Defeatist: Ataque pela metade com HP ≤ 1/2', () => {
  assert.equal(effStat(mon({ ability: 'defeatist' }), 'attack'), 100);
  assert.equal(effStat(mon({ ability: 'defeatist', hp: 50 }), 'attack'), 50);
  assert.equal(effStat(mon({ ability: 'defeatist', hp: 50 }), 'defense'), 100, 'só Ataque e At. Esp.');
});

test('Merciless: crítico garantido contra veneno', t => {
  t.mock.method(Math, 'random', () => 0.99);          // sem a habilidade nunca seria crítico
  assert.equal(calcDamage(mon({ ability: 'merciless' }), mon({ status: 'poison' }), golpe()).crit, true);
  assert.equal(calcDamage(mon({ ability: 'merciless' }), mon(), golpe()).crit, false, 'alvo saudável');
  assert.equal(calcDamage(mon({ ability: 'merciless' }), mon({ status: 'poison', ability: 'battle-armor' }), golpe()).crit, false, 'Battle Armor ainda vence');
});

test('Unaware ignora os degraus do outro lado (dano e precisão)', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const defendeu = () => { const a = mon(); a.vol.stages.defense = 6; return a; };
  const g = golpe();
  assert.ok(calcDamage(mon(), defendeu(), g).dmg < calcDamage(mon(), mon(), g).dmg, 'sem a habilidade, +6 de Defesa protege');
  assert.equal(calcDamage(mon({ ability: 'unaware' }), defendeu(), g).dmg, calcDamage(mon(), mon(), g).dmg, 'com Unaware, é como se não houvesse');
  // é de quem ataca E de quem defende: o Ataque +6 de quem ataca uma Unaware não conta
  const forte = mon(); forte.vol.stages.attack = 6;
  assert.equal(calcDamage(forte, mon({ ability: 'unaware' }), g).dmg, calcDamage(mon(), mon(), g).dmg);
  const esquivo = () => { const a = mon(); a.vol.stages.evasion = 6; return a; };
  assert.ok(chanceAcerto(golpe(), mon(), esquivo()) < 0.5);
  assert.ok(Math.abs(chanceAcerto(golpe(), mon({ ability: 'unaware' }), esquivo()) - 1) < 1e-9);
});

test('Wonder Skin: golpe de status alheio acerta no máximo 50%; golpe de dano não muda', () => {
  const pele = mon({ ability: 'wonder-skin' });
  assert.equal(chanceAcerto(golpe({ cls: 'status', acc: 100 }), mon(), pele), 0.5);
  assert.equal(chanceAcerto(golpe({ cls: 'status', acc: 30 }), mon(), pele), 0.3, 'não SOBE a precisão de golpe que já era pior');
  assert.equal(chanceAcerto(golpe({ cls: 'physical', acc: 100 }), mon(), pele), 1);
});

test('Contrary inverte e Simple dobra os degraus; Mirror Armor devolve a queda sem entrar em loop', async () => {
  const contrario = mon({ ability: 'contrary' });
  await mudarEstagios(contrario, [{ stat: 'attack', change: -1 }], ctx(), mon());
  assert.equal(contrario.vol.stages.attack, 1);
  const simples = mon({ ability: 'simple' });
  await mudarEstagios(simples, [{ stat: 'attack', change: 1 }], ctx());
  assert.equal(simples.vol.stages.attack, 2);
  const espelho = mon({ ability: 'mirror-armor' }), agressor = mon();
  await mudarEstagios(espelho, [{ stat: 'attack', change: -1 }], ctx(), agressor);
  assert.deepEqual([espelho.vol.stages.attack, agressor.vol.stages.attack], [0, -1]);
  const dois = mon({ ability: 'mirror-armor' });
  await mudarEstagios(espelho, [{ stat: 'attack', change: -1 }], ctx(), dois);   // dois espelhos: um rebote só, não infinito
  assert.equal(dois.vol.stages.attack, -1);
});

test('Defiant/Competitive reagem à queda causada por OUTRO — e não à própria', async () => {
  const d = mon({ ability: 'defiant' });
  await mudarEstagios(d, [{ stat: 'defense', change: -1 }], ctx(), mon());
  assert.deepEqual([d.vol.stages.defense, d.vol.stages.attack], [-1, 2]);
  const proprio = mon({ ability: 'defiant' });
  await mudarEstagios(proprio, [{ stat: 'defense', change: -1 }], ctx());          // sem fonte: efeito próprio
  assert.equal(proprio.vol.stages.attack, 0);
  const c = mon({ ability: 'competitive' });
  await mudarEstagios(c, [{ stat: 'speed', change: -1 }], ctx(), mon());
  assert.equal(c.vol.stages['special-attack'], 2);
});

test('Moxie: derrubar o alvo sobe o Ataque; só machucar não', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const moxie = mon({ ability: 'moxie' });
  await usarGolpe(moxie, mon(), golpe(), true, ctx());
  assert.equal(moxie.vol.stages.attack, 0, 'o alvo sobreviveu');
  await usarGolpe(moxie, mon({ hp: 1 }), golpe(), true, ctx());
  assert.equal(moxie.vol.stages.attack, 1);
});

test('reação ao golpe: Steam Engine, Stamina, Weak Armor, Anger Point, Sand Spit', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const vapor = mon({ ability: 'steam-engine' });
  await usarGolpe(mon(), vapor, golpe({ type: 'water' }), true, ctx());
  assert.equal(vapor.vol.stages.speed, 6);
  const outroTipo = mon({ ability: 'steam-engine' });
  await usarGolpe(mon(), outroTipo, golpe({ type: 'grass' }), true, ctx());
  assert.equal(outroTipo.vol.stages.speed, 0, 'só Fogo e Água');
  const st = mon({ ability: 'stamina' });
  await usarGolpe(mon(), st, golpe({ cls: 'special' }), true, ctx());
  assert.equal(st.vol.stages.defense, 1);
  const wa = mon({ ability: 'weak-armor' });
  await usarGolpe(mon(), wa, golpe({ cls: 'special' }), true, ctx());
  assert.deepEqual([wa.vol.stages.defense, wa.vol.stages.speed], [0, 0], 'golpe especial não quebra a armadura');
  await usarGolpe(mon(), wa, golpe({ cls: 'physical' }), true, ctx());
  assert.deepEqual([wa.vol.stages.defense, wa.vol.stages.speed], [-1, 2]);
  const c = ctx(); c.campo = { clima: null, turnos: 0 };
  await usarGolpe(mon(), mon({ ability: 'sand-spit' }), golpe(), true, c);
  assert.equal(c.campo.clima, 'areia');
});

test('Anger Point: só o crítico enfurece', async t => {
  const ap = mon({ ability: 'anger-point' });
  t.mock.method(Math, 'random', () => 0.99);
  await usarGolpe(mon(), ap, golpe(), true, ctx());
  assert.equal(ap.vol.stages.attack, 0, 'sem crítico');
  Math.random.mock.mockImplementation(() => 0);          // agora tudo cai: acerta e sai crítico
  await usarGolpe(mon(), ap, golpe(), true, ctx());
  assert.equal(ap.vol.stages.attack, 6);
});

test('Effect Spore sorteia sono/paralisia/veneno; Grama não pega; Gooey baixa a Velocidade', async t => {
  t.mock.method(Math, 'random', () => 0);
  const atacante = mon();
  await usarGolpe(atacante, mon({ ability: 'effect-spore' }), golpe(), true, ctx());
  assert.equal(atacante.status, 'sleep', 'o menor sorteio cai no primeiro da lista');
  const grama = mon({ data: { types: ['grass'] } });
  await usarGolpe(grama, mon({ ability: 'effect-spore' }), golpe(), true, ctx());
  assert.equal(grama.status, null, 'pó não pega Grama');
  const escorregou = mon();
  await usarGolpe(escorregou, mon({ ability: 'gooey' }), golpe(), true, ctx());
  assert.equal(escorregou.vol.stages.speed, -1);
  Math.random.mock.mockImplementation(() => 0.99);
  const sortudo = mon();
  await usarGolpe(sortudo, mon({ ability: 'effect-spore' }), golpe(), true, ctx());
  assert.equal(sortudo.status, null, 'sorteio fora dos 30%');
});

test('Poison Touch envenena o alvo com golpe físico', async t => {
  t.mock.method(Math, 'random', () => 0);
  const alvo = mon();
  await usarGolpe(mon({ ability: 'poison-touch' }), alvo, golpe(), true, ctx());
  assert.equal(alvo.status, 'poison');
  const especial = mon();
  await usarGolpe(mon({ ability: 'poison-touch' }), especial, golpe({ cls: 'special' }), true, ctx());
  assert.equal(especial.status, null);
});

test('Poison Heal cura com veneno; Magic Guard não sofre dano indireto', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const ph = mon({ ability: 'poison-heal', status: 'poison', hp: 50 });
  await fimDeTurno(ph, ctx());
  assert.equal(ph.hp, 50 + 12, 'cura 1/8 do máximo (100 → 12)');
  const mg = mon({ ability: 'magic-guard', status: 'burn' });
  await fimDeTurno(mg, ctx());
  assert.equal(mg.hp, 100, 'queimadura não tira HP');
  const recuo = mon({ ability: 'magic-guard' });
  await usarGolpe(recuo, mon(), golpe({ meta: { drain: -33 } }), true, ctx());
  assert.equal(recuo.hp, 100, 'recuo é dano indireto');
  const rugoso = mon({ ability: 'magic-guard' });
  await usarGolpe(rugoso, mon({ ability: 'rough-skin' }), golpe(), true, ctx());
  assert.equal(rugoso.hp, 100, 'Rough Skin também');
  const normal = mon({ status: 'burn' });
  await fimDeTurno(normal, ctx());
  assert.ok(normal.hp < 100, 'sem a habilidade, queima');
});

test('Pressure gasta 1 PP a mais; Truant folga um turno sim, um não; Dazzling barra prioridade', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const g = golpe({ ppLeft: 35 });
  await usarGolpe(mon(), mon({ ability: 'pressure' }), g, true, ctx());
  assert.equal(g.ppLeft, 33);
  const g2 = golpe({ ppLeft: 35 });
  await usarGolpe(mon({ ability: 'pressure' }), mon(), g2, true, ctx());
  assert.equal(g2.ppLeft, 34, 'a habilidade só pesa em quem usa golpe CONTRA ela');

  const preguicoso = mon({ ability: 'truant' }), alvo = mon();
  await usarGolpe(preguicoso, alvo, golpe(), true, ctx());
  const depoDoPrimeiro = alvo.hp;
  assert.ok(depoDoPrimeiro < 100);
  await usarGolpe(preguicoso, alvo, golpe(), true, ctx());
  assert.equal(alvo.hp, depoDoPrimeiro, 'turno de folga: não atacou');
  await usarGolpe(preguicoso, alvo, golpe(), true, ctx());
  assert.ok(alvo.hp < depoDoPrimeiro, 'voltou a agir');

  const dz = mon({ ability: 'dazzling' });
  await usarGolpe(mon(), dz, golpe({ priority: 1 }), true, ctx());
  assert.equal(dz.hp, 100, 'golpe de prioridade não passa');
  await usarGolpe(mon(), dz, golpe(), true, ctx());
  assert.ok(dz.hp < 100, 'golpe comum passa');
});

test('entrada em campo: Intimidate, Guard Dog, Inner Focus e Download', async () => {
  const intimidador = () => mon({ ability: 'intimidate', nome: 'A' });
  const alvo = mon();
  await aoEntrarEmCampo([intimidador()], () => [alvo], ctx());
  assert.equal(alvo.vol.stages.attack, -1);
  const cao = mon({ ability: 'guard-dog' });
  await aoEntrarEmCampo([intimidador()], () => [cao], ctx());
  assert.equal(cao.vol.stages.attack, 1, 'Guard Dog sobe em vez de cair');
  const foco = mon({ ability: 'inner-focus' });
  await aoEntrarEmCampo([intimidador()], () => [foco], ctx());
  assert.equal(foco.vol.stages.attack, 0, 'imune à Intimidação');
  const claro = mon({ ability: 'clear-body' });
  await aoEntrarEmCampo([intimidador()], () => [claro], ctx());
  assert.equal(claro.vol.stages.attack, 0, 'Clear Body continua barrando');

  // Download: Defesa menor que Def. Esp. → Ataque; senão At. Esp.
  const fragilFisico = mon({ stats: { ...mon().stats, defense: 50 } });
  const d1 = mon({ ability: 'download' });
  await aoEntrarEmCampo([d1], () => [fragilFisico], ctx());
  assert.deepEqual([d1.vol.stages.attack, d1.vol.stages['special-attack']], [1, 0]);
  const fragilEspecial = mon({ stats: { ...mon().stats, 'special-defense': 50 } });
  const d2 = mon({ ability: 'download' });
  await aoEntrarEmCampo([d2], () => [fragilEspecial], ctx());
  assert.deepEqual([d2.vol.stages.attack, d2.vol.stages['special-attack']], [0, 1]);
});

test('entrada em campo liga clima e terreno junto do bônus (Orichalcum Pulse, Hadron Engine)', async () => {
  const c = ctx(); c.campo = { clima: null, turnos: 0, terreno: null, terrenoTurnos: 0, lados: {} };
  const sol = mon({ ability: 'orichalcum-pulse' }), raio = mon({ ability: 'hadron-engine' });
  await aoEntrarEmCampo([sol, raio], () => [mon()], c);
  assert.equal(c.campo.clima, 'sol');
  assert.equal(c.campo.terreno, 'eletrico');
  // ×1,33 sobre 100 (a folga de 1 é só pelo arredondamento do ponto flutuante)
  assert.ok(Math.abs(effStat(sol, 'attack', false, true, 'sol') - 133) <= 1);
  assert.ok(Math.abs(effStat(raio, 'special-attack', false, true, null, 'eletrico') - 133) <= 1);
  assert.equal(effStat(sol, 'attack', false, true, 'chuva'), 100, 'fora do sol, sem bônus');
});
