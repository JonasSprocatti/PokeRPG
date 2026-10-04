// Habilidades (js/habilidades.js) no motor único (js/golpe.js) e nas contas (js/regras.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HABILIDADES, IMPL } from '../js/habilidades.js';
import { usarGolpe, mudarEstagios, aplicarStatus, fimDeTurno, aoEntrarEmCampo, comerFruta, desfazerTrace } from '../js/golpe.js';
import { calcDamage, effStat, chanceAcerto, freshVol, FAMILIAS_GOLPE, TRAVAS } from '../js/regras.js';
import { TYPE_PT, AIL_MSG, STATS } from '../js/dados.js';
import { FLAGS_VALIDAS } from '../js/dados-golpe-flags.js';

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
    'analisa', 'intimidaSobe', 'imuneIntimidacao', 'imuneTrava', 'curaAoVencer', 'limpaStatusAoVencer', 'saiComPoucoHp', 'inicioLento', 'emboscada', 'imunePo', 'toque', 'semDanoIndireto', 'curaComVeneno', 'pressao', 'preguica', 'bloqueiaPrioridade', 'formaDoClima',
    // quinta leva
    'multMaiorStatClima', 'multMaiorStatTerreno', 'prendeTipo', 'anticipa', 'sincroniza', 'flinchChance',
    // sexta leva
    'sheerForce', 'unnerve', 'friendGuard',
    // sétima leva: flag de golpe de verdade (dados-golpe-flags.js) + o restante das habilidades reais
    'imuneFlag', 'multFlag', 'resisteFlag', 'converteTipo', 'evasaoConfuso', 'acaoRapida', 'sempreLento',
    'prankster', 'prioridadeVoador', 'prioridadeCura', 'prendeQualquer', 'semContato', 'aliadoBoost',
    'aoNocautearMaior', 'aftermath', 'aoDesmaiarDanoAtacante', 'dreno', 'roubaItem', 'protegeItem',
    'imuneGolpeStatus', 'podeEnvenenarQualquer', 'protegeAliadoStatus', 'copiaHabilidadeAoEntrar',
    'avisaGolpeForte', 'revelaItem', 'moody', 'ripen', 'curaBerryExtra', 'semItemEmBatalha', 'algodaoCai',
    'trocaHabilidadeContato',
    // gênero (regras.sortearGenero): Rivalry no dano, Cute Charm pelo `contato` com status 'infatuation'
    'rivalidade',
    // oitava leva
    'ruina', 'aura', 'anulaAura', 'ignoraImunidade', 'atravessaTelas', 'semSaidaForcada', 'aoRecuar',
    'corpoMaldito', 'tipoDoProprioGolpe', 'tipoDoGolpeRecebido', 'venenoConfunde',
    'zeraEstagiosAoEntrar', 'limpaTelas', 'curaAliadoAoEntrar', 'copiaEstagiosDoAliado',
    'estagioInimigoAoEntrar', 'pesadelo']);
  const tipos = Object.keys(TYPE_PT);
  const stat = (n, s) => assert.ok(STATS.includes(s), `${n}: atributo "${s}"`);
  for (const [nome, h] of Object.entries(HABILIDADES)) {
    for (const k of Object.keys(h)) assert.ok(ganchos.has(k), `${nome}: gancho desconhecido "${k}" (não faz nada no motor)`);
    for (const t of [h.pinch, h.imuneTipo, h.absorve, ...Object.keys(h.resiste || {}), ...Object.keys(h.danoTipo || {}), ...(h.prendeTipo || [])].filter(Boolean)) assert.ok(tipos.includes(t), `${nome}: tipo "${t}"`);
    for (const a of h.imuneStatus || []) assert.ok(AIL_MSG[a] || ['confusion', 'infatuation'].includes(a), `${nome}: status "${a}"`);
    for (const k of h.imuneTrava || []) assert.ok(TRAVAS.includes(k), `${nome}: trava "${k}" não existe (regras.TRAVAS)`);
    for (const s of Object.keys({ ...h.multStat, ...h.comStatus })) assert.ok(STATS.includes(s), `${nome}: atributo "${s}"`);
    if (h.imuneFlag) assert.ok(FLAGS_VALIDAS.includes(h.imuneFlag), `${nome}: flag de golpe "${h.imuneFlag}" não existe`);
    if (h.multFlag) assert.ok(FLAGS_VALIDAS.includes(h.multFlag.flag), `${nome}: flag de golpe "${h.multFlag.flag}" não existe`);
    if (h.resisteFlag) assert.ok(FLAGS_VALIDAS.includes(h.resisteFlag.flag), `${nome}: flag de golpe "${h.resisteFlag.flag}" não existe`);
    if (h.converteTipo) {
      assert.ok(h.converteTipo.de === '*' || tipos.includes(h.converteTipo.de), `${nome}: tipo "${h.converteTipo.de}"`);
      assert.ok(tipos.includes(h.converteTipo.para), `${nome}: tipo "${h.converteTipo.para}"`);
    }
    if (h.aliadoBoost) assert.ok(['especial', 'qualquer', 'aco', 'plusminus'].includes(h.aliadoBoost), `${nome}: aliadoBoost "${h.aliadoBoost}"`);
    if (h.roubaItem) assert.ok(['contato', 'ataque'].includes(h.roubaItem), `${nome}: roubaItem "${h.roubaItem}"`);
    if (h.trocaHabilidadeContato) assert.ok(['contagio', 'troca'].includes(h.trocaHabilidadeContato), `${nome}: trocaHabilidadeContato "${h.trocaHabilidadeContato}"`);
    if (h.prendeQualquer) assert.ok(h.prendeQualquer === true || h.prendeQualquer === 'chao', `${nome}: prendeQualquer "${h.prendeQualquer}"`);
    if (h.dreno) assert.ok(h.dreno === 'inverte', `${nome}: dreno "${h.dreno}"`);
    // ganchos da quarta leva: tipo, status, atributo e família existem de verdade (typo aqui deixaria a habilidade inerte)
    for (const a of [...(h.soStatus || []), h.critContraStatus, h.toque?.status, ...(h.contato?.sorteio || []).map(x => x[0]), ...(typeof h.contato?.status === 'string' ? [h.contato.status] : [])].filter(Boolean)) assert.ok(AIL_MSG[a] || a === 'infatuation', `${nome}: status "${a}"`);   // Cute Charm: paixão é volátil, não tem AIL_MSG
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
  await usarGolpe(especial, mon({ ability: 'rough-skin' }), golpe({ name: 'ember', cls: 'special' }), true, ctx());
  assert.equal(especial.hp, 100); // golpe especial (Ember, sem flag `contact` de verdade) não encosta
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
  await usarGolpe(mon({ ability: 'poison-touch' }), especial, golpe({ name: 'ember', cls: 'special' }), true, ctx());
  assert.equal(especial.status, null);
});

test('Soundproof/Bulletproof: imunes à FLAG de golpe de verdade (dano e status), não ao tipo nem à classe', async () => {
  const semHp = m => m.hp < 100;
  // Hyper Voice (som, dano): bloqueado com Soundproof, normal sem
  const surdo = mon({ ability: 'soundproof' });
  await usarGolpe(mon(), surdo, golpe({ name: 'hyper-voice', power: 90 }), true, ctx());
  assert.equal(surdo.hp, 100, 'Hyper Voice não afeta quem tem Soundproof');
  const ouvinte = mon();
  await usarGolpe(mon(), ouvinte, golpe({ name: 'hyper-voice', power: 90 }), true, ctx());
  assert.ok(semHp(ouvinte), 'sem a habilidade, o mesmo golpe machuca normalmente');
  // Growl (som, STATUS): também bloqueado — a imunidade é pela flag, não por ser golpe de dano
  const surdoGrowl = mon({ ability: 'soundproof' });
  await usarGolpe(mon(), surdoGrowl, golpe({ name: 'growl', cls: 'status', power: null, stats: [{ stat: 'attack', change: -1 }] }), true, ctx());
  assert.equal(surdoGrowl.vol.stages.attack, 0, 'Growl (som) não baixa o Ataque de quem tem Soundproof');
  // golpe SEM a flag: Soundproof não bloqueia à toa
  const surdoTackle = mon({ ability: 'soundproof' });
  await usarGolpe(mon(), surdoTackle, golpe(), true, ctx());
  assert.ok(semHp(surdoTackle), 'Soundproof não bloqueia golpe sem a flag sound (Tackle)');
  // Shadow Ball (bala, dano): bloqueado com Bulletproof, normal sem
  const blindado = mon({ ability: 'bulletproof' });
  await usarGolpe(mon(), blindado, golpe({ name: 'shadow-ball', power: 80 }), true, ctx());
  assert.equal(blindado.hp, 100, 'Shadow Ball não afeta quem tem Bulletproof');
  const desprotegido = mon();
  await usarGolpe(mon(), desprotegido, golpe({ name: 'shadow-ball', power: 80 }), true, ctx());
  assert.ok(semHp(desprotegido));
  // Bullet Punch é soco (flag `punch`), NÃO tem a flag `ballistics` nos jogos de verdade — Bulletproof não bloqueia
  const blindadoPunch = mon({ ability: 'bulletproof' });
  await usarGolpe(mon(), blindadoPunch, golpe({ name: 'bullet-punch', power: 40 }), true, ctx());
  assert.ok(semHp(blindadoPunch), 'Bulletproof não bloqueia Bullet Punch (é soco, não "bala")');
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

/* Orbe de Fogo/Tóxico (segurados.js): itens que se auto-infligem status no fim do turno — "punição" que combina
   com Guts/Flare Boost/Toxic Boost/Quick Feet/Marvel Scale (todas já implementadas). */
test('Orbe de Fogo/Tóxico se auto-infligem status no fim do turno (respeitando imunidade de tipo)', async () => {
  const fogo = mon({ item: 'flame-orb' });
  await fimDeTurno(fogo, ctx());
  assert.equal(fogo.status, 'burn');
  // Pokémon de Fogo é imune a queimadura — o item não faz nada (nem mensagem: `aplicarStatus` já cobre isso)
  const imuneFogo = mon({ item: 'flame-orb', data: { types: ['fire'] } });
  await fimDeTurno(imuneFogo, ctx());
  assert.equal(imuneFogo.status, null);
  const toxico = mon({ item: 'toxic-orb' });
  await fimDeTurno(toxico, ctx());
  assert.equal(toxico.status, 'poison');
  assert.equal(toxico.vol.toxico, 1, 'veneno GRAVE, igual ao golpe Toxic — não poison comum');
  // Venenoso e Aço são imunes a veneno
  for (const tipo of ['poison', 'steel']) {
    const imune = mon({ item: 'toxic-orb', data: { types: [tipo] } });
    await fimDeTurno(imune, ctx());
    assert.equal(imune.status, null, tipo);
  }
  // já tem status: o item não tenta de novo (não troca queimadura por veneno, por exemplo)
  const jaQueimado = mon({ item: 'toxic-orb', status: 'burn' });
  await fimDeTurno(jaQueimado, ctx());
  assert.equal(jaQueimado.status, 'burn');
  // combina com Guts: Ataque ×1.5 assim que o Orbe queima/envenena
  const guts = mon({ item: 'flame-orb', ability: 'guts' });
  await fimDeTurno(guts, ctx());
  assert.equal(effStat(guts, 'attack'), 150, 'Guts sobe com o status que o próprio item causou');
});

/* Faixa/Óculos/Lenço Escolha (segurados.js `choice`): trava em `M.vol.escolha` no primeiro golpe DE VERDADE
   usado (golpe.usarGolpe seta isso logo depois de "X usou Y!"). A trava em si é reforçada pela UI (botões
   desabilitados em render.js/arena.js/multiplayer.js) e por golpeDoAliado (aliados), e TAMBÉM pelo motor
   (regras.motivoBloqueio, conferido em usarGolpe) — desde as travas de Taunt/Encore/Disable o motor confere tudo
   na hora de usar. Ver tests/travas.test.js. */
test('itens Choice: +50% no atributo certo e trava no primeiro golpe usado (não em Struggle)', async () => {
  const banda = mon({ item: 'choice-band' });
  assert.equal(effStat(banda, 'attack'), 150);
  assert.equal(effStat(banda, 'defense'), 100, 'só o atributo certo do item');
  assert.equal(banda.vol.escolha, undefined, 'ainda não usou nenhum golpe');
  await usarGolpe(banda, mon(), golpe({ name: 'ember' }), true, ctx());
  assert.equal(banda.vol.escolha, 'ember');
  // tentar outro golpe depois NÃO destrava — e agora o motor também recusa (antes só a tela impedia)
  const alvo2 = mon();
  await usarGolpe(banda, alvo2, golpe({ name: 'tackle' }), true, ctx());
  assert.equal(banda.vol.escolha, 'ember', 'continua travado no primeiro');
  assert.equal(alvo2.hp, 100, 'o golpe fora da trava nem chegou a acertar');
  // Struggle nunca trava (é golpe de emergência, sem PP sobrando pra "escolher" nada)
  const semTravar = mon({ item: 'choice-scarf' });
  assert.equal(effStat(semTravar, 'speed'), 150);
  await usarGolpe(semTravar, mon(), golpe({ name: 'struggle' }), true, ctx());
  assert.equal(semTravar.vol.escolha, undefined);
  // sem o item, nada trava
  const normal = mon();
  await usarGolpe(normal, mon(), golpe(), true, ctx());
  assert.equal(normal.vol.escolha, undefined);
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

test('Protosynthesis e Quark Drive reforçam o MAIOR atributo BASE (empate por ordem; Velocidade ganha ×1,5, o resto ×1,3)', () => {
  const baseCom = destaque => ({ hp: 100, attack: 80, defense: 80, 'special-attack': 80, 'special-defense': 80, speed: 80, [destaque]: 150 });
  const fisico = mon({ ability: 'protosynthesis', data: { types: ['normal'], base: baseCom('attack') } });
  assert.equal(effStat(fisico, 'attack', false, true, 'sol'), Math.floor(100 * 1.3));
  assert.equal(effStat(fisico, 'defense', false, true, 'sol'), 100, 'só o maior atributo sobe');
  assert.equal(effStat(fisico, 'attack', false, true, 'chuva'), 100, 'fora do sol, sem bônus');

  const veloz = mon({ ability: 'quark-drive', data: { types: ['normal'], base: baseCom('speed') } });
  assert.equal(effStat(veloz, 'speed', false, true, null, 'eletrico'), Math.floor(100 * 1.5), 'Velocidade ganha ×1,5, não ×1,3');
  assert.equal(effStat(veloz, 'speed', false, true, null, 'grama'), 100, 'fora do Campo Elétrico, sem bônus');

  // empate: Ataque vem antes de Defesa na ordem de desempate dos jogos
  const empatado = mon({ ability: 'protosynthesis', data: { types: ['normal'], base: { hp: 100, attack: 120, defense: 120, 'special-attack': 80, 'special-defense': 80, speed: 80 } } });
  assert.equal(effStat(empatado, 'attack', false, true, 'sol'), Math.floor(100 * 1.3), 'empate: Ataque vence');
  assert.equal(effStat(empatado, 'defense', false, true, 'sol'), 100);
});

test('Anticipation avisa sem mudar nada; Synchronize devolve status; Stench dá recuo extra', async t => {
  const perigoso = mon({ moves: [golpe({ type: 'fire' })] });   // super efetivo contra Grama
  const antena = mon({ ability: 'anticipation', data: { types: ['grass'] } });
  const c1 = ctx();
  await aoEntrarEmCampo([antena], () => [perigoso], c1);
  assert.ok(c1.msgs.some(m => m.includes('pressente')), 'avisa quando há golpe perigoso por perto');
  assert.equal(antena.vol.stages.attack, 0, 'não muda nada — é só aviso');
  const semPerigo = mon({ moves: [golpe({ type: 'normal' })] });
  const antena2 = mon({ ability: 'anticipation', data: { types: ['grass'] } });
  const c2 = ctx();
  await aoEntrarEmCampo([antena2], () => [semPerigo], c2);
  assert.ok(!c2.msgs.some(m => m.includes('pressente')), 'sem golpe perigoso, não avisa');

  // Synchronize: quem causou o status recebe o mesmo (burn/paralysis/poison; não sono/congelamento)
  const sinc = mon({ ability: 'synchronize' }), atacante = mon();
  await aplicarStatus(sinc, 'burn', ctx(), false, atacante);
  assert.equal(sinc.status, 'burn'); assert.equal(atacante.status, 'burn', 'a queimadura voltou pro atacante');
  const sinc2 = mon({ ability: 'synchronize' }), atacante2 = mon();
  await aplicarStatus(sinc2, 'sleep', ctx(), false, atacante2);
  assert.equal(atacante2.status, null, 'sono não sincroniza');
  // sem fonte (ex.: veneno de armadilha), não há quem devolver — não quebra
  const sinc3 = mon({ ability: 'synchronize' });
  await aplicarStatus(sinc3, 'poison', ctx(), false, null);
  assert.equal(sinc3.status, 'poison');

  // Stench: 10% de recuo extra num golpe que não tem chance própria (meta.flinch)
  t.mock.method(Math, 'random', () => 0.05);           // dentro dos 10%
  const federado = mon({ ability: 'stench' });
  const alvo = mon();
  await usarGolpe(federado, alvo, golpe(), true, ctx());
  assert.equal(alvo.vol.flinch, true, 'Stench fez o alvo recuar');
});

test('Sheer Force: golpe com efeito secundário nativo bate mais forte, mas perde o efeito', async t => {
  t.mock.method(Math, 'random', () => 0.01); // aplicaria o secundário na certa, se não fosse Sheer Force
  const golpeComEstagio = golpe({ stats: [{ stat: 'defense', change: -1 }], meta: { statChance: 100 } });
  const normal = mon(), comSheerForce = mon({ ability: 'sheer-force' });
  const alvo1 = mon(), alvo2 = mon();
  await usarGolpe(normal, alvo1, golpeComEstagio, true, ctx());
  await usarGolpe(comSheerForce, alvo2, golpeComEstagio, true, ctx());
  assert.ok((100 - alvo2.hp) > (100 - alvo1.hp), `Sheer Force devia bater mais forte: ${100 - alvo2.hp} vs ${100 - alvo1.hp}`);
  assert.equal(alvo1.vol.stages.defense, -1, 'sem Sheer Force, o estágio caiu normal');
  assert.equal(alvo2.vol.stages.defense, 0, 'com Sheer Force, o estágio NÃO caiu — o efeito se foi');
  // golpe SEM efeito secundário nenhum: Sheer Force não bate mais forte à toa
  const semSecundario = golpe();
  const a = mon(), b = mon();
  await usarGolpe(mon(), a, semSecundario, true, ctx());
  await usarGolpe(mon({ ability: 'sheer-force' }), b, semSecundario, true, ctx());
  assert.equal(100 - a.hp, 100 - b.hp, 'sem efeito secundário, o dano é igual');
});

test('Unnerve: o alvo não come fruta sozinho logo depois de levar dano de quem tem a habilidade', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const comFruta = mon({ item: 'oran-berry', hp: 55 }); // vai ficar ≤ metade depois do golpe
  await usarGolpe(mon(), comFruta, golpe(), true, ctx());
  assert.equal(comFruta.item, null, 'sem Unnerve no atacante, come a fruta normal');

  const comFruta2 = mon({ item: 'oran-berry', hp: 55 });
  await usarGolpe(mon({ ability: 'unnerve' }), comFruta2, golpe(), true, ctx());
  assert.equal(comFruta2.item, 'oran-berry', 'com Unnerve no atacante, a fruta do alvo trava');
});

test('Friend Guard: reduz o dano que um ALIADO recebe', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const guarda = mon({ ability: 'friend-guard' });
  const alvoComGuarda = mon(), alvoSemGuarda = mon();
  const ctxComAliado = { ...ctx(), aliadosDe: m => m === alvoComGuarda ? [guarda] : [] };
  await usarGolpe(mon(), alvoComGuarda, golpe(), true, ctxComAliado);
  await usarGolpe(mon(), alvoSemGuarda, golpe(), true, ctx());
  const comGuarda = 100 - alvoComGuarda.hp, semGuarda = 100 - alvoSemGuarda.hp;
  assert.ok(comGuarda < semGuarda, `Friend Guard devia reduzir o dano: ${comGuarda} vs ${semGuarda}`);
  assert.ok(Math.abs(comGuarda - semGuarda * 0.75) <= 1, `~25% de redução: ${comGuarda} vs ${semGuarda * 0.75}`);
});

test('Battery/Steely Spirit: reforçam o golpe de um ALIADO vivo (Battery só especial, Steely Spirit só Aço)', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const especial = golpe({ cls: 'special', type: 'psychic' });
  const semAliado = mon(), alvo1 = mon();
  await usarGolpe(semAliado, alvo1, especial, true, ctx());
  const danoBase = 100 - alvo1.hp;
  const comBattery = mon(), alvo2 = mon();
  const ctxBattery = { ...ctx(), aliadosDe: m => m === comBattery ? [mon({ ability: 'battery' })] : [] };
  await usarGolpe(comBattery, alvo2, especial, true, ctxBattery);
  assert.equal(100 - alvo2.hp, Math.floor(danoBase * 1.3));

  const aco = golpe({ cls: 'physical', type: 'steel' });
  const semAliado2 = mon(), alvoAco1 = mon();
  await usarGolpe(semAliado2, alvoAco1, aco, true, ctx());
  const danoAcoBase = 100 - alvoAco1.hp;
  const comSteely = mon(), alvoAco2 = mon();
  const ctxSteely = { ...ctx(), aliadosDe: m => m === comSteely ? [mon({ ability: 'steely-spirit' })] : [] };
  await usarGolpe(comSteely, alvoAco2, aco, true, ctxSteely);
  assert.equal(100 - alvoAco2.hp, Math.floor(danoAcoBase * 1.5));
});

test('Aftermath: quem derruba com CONTATO perde 1/4 do próprio HP máximo; sem contato, nada', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const atacante = mon();
  await usarGolpe(atacante, mon({ ability: 'aftermath', hp: 1 }), golpe({ power: 200 }), true, ctx()); // tackle: contato
  assert.equal(atacante.hp, 75);
  const atacante2 = mon();
  await usarGolpe(atacante2, mon({ ability: 'aftermath', hp: 1 }), golpe({ name: 'ember', cls: 'special', power: 200 }), true, ctx());
  assert.equal(atacante2.hp, 100, 'sem contato, Aftermath não ativa');
});

test('Innards Out: ao derrubar (contato ou não), quem derrubou perde HP igual ao que o alvo tinha antes de cair', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const atacante = mon();
  await usarGolpe(atacante, mon({ ability: 'innards-out', hp: 7 }), golpe({ name: 'ember', cls: 'special', power: 200 }), true, ctx());
  assert.equal(atacante.hp, 93);
});

test('Beast Boost: ao derrubar o alvo, sobe o MAIOR atributo BASE de quem derrubou', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const atacante = mon({ ability: 'beast-boost', data: { types: ['normal'], base: { attack: 50, defense: 50, 'special-attack': 130, 'special-defense': 50, speed: 90 } } });
  await usarGolpe(atacante, mon({ hp: 1 }), golpe({ power: 200 }), true, ctx());
  assert.equal(atacante.vol.stages['special-attack'], 1);
});

test('Liquid Ooze: o dreno de quem te ataca vira DANO nele, em vez de cura', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const golpeDreno = golpe({ meta: { drain: 50 } });
  const atacante = mon({ hp: 50 });
  await usarGolpe(atacante, mon({ ability: 'liquid-ooze' }), golpeDreno, true, ctx());
  assert.ok(atacante.hp < 50, `Liquid Ooze devia machucar quem drenou: ${atacante.hp}`);
  const atacanteNormal = mon({ hp: 50 });
  await usarGolpe(atacanteNormal, mon(), golpeDreno, true, ctx());
  assert.ok(atacanteNormal.hp > 50, 'sem Liquid Ooze, o dreno cura normalmente');
});

test('Pickpocket rouba ao encostar; Magician rouba com qualquer golpe de dano; Sticky Hold bloqueia', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const ladrao = mon({ ability: 'pickpocket' });
  await usarGolpe(ladrao, mon({ item: 'leftovers' }), golpe(), true, ctx()); // tackle: contato
  assert.equal(ladrao.item, 'leftovers');

  const mago = mon({ ability: 'magician' });
  await usarGolpe(mago, mon({ item: 'leftovers' }), golpe({ name: 'ember', cls: 'special' }), true, ctx()); // sem contato
  assert.equal(mago.item, 'leftovers', 'Magician não precisa de contato');

  const ladrao2 = mon({ ability: 'pickpocket' });
  const protegida = mon({ item: 'leftovers', ability: 'sticky-hold' });
  await usarGolpe(ladrao2, protegida, golpe(), true, ctx());
  assert.ok(!ladrao2.item, 'Sticky Hold bloqueia o roubo');
  assert.equal(protegida.item, 'leftovers');

  const ladraoComItem = mon({ ability: 'pickpocket', item: 'quick-claw' });
  await usarGolpe(ladraoComItem, mon({ item: 'leftovers' }), golpe(), true, ctx());
  assert.equal(ladraoComItem.item, 'quick-claw', 'já com item, não rouba');
});

test('Cotton Down: quem acerta perde 1 de Velocidade', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const atacante = mon();
  await usarGolpe(atacante, mon({ ability: 'cotton-down' }), golpe(), true, ctx());
  assert.equal(atacante.vol.stages.speed, -1);
});

test('Mummy/Lingering Aroma: contágio (sua habilidade vira a do dono); Wandering Spirit TROCA as duas', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const atacante = mon({ ability: 'blaze' });
  await usarGolpe(atacante, mon({ ability: 'mummy' }), golpe(), true, ctx());
  assert.equal(atacante.ability, 'mummy'); assert.equal(atacante.abilityAntes, 'blaze');

  const atacante2 = mon({ ability: 'blaze' });
  const dono = mon({ ability: 'wandering-spirit' });
  await usarGolpe(atacante2, dono, golpe(), true, ctx());
  assert.equal(atacante2.ability, 'wandering-spirit'); assert.equal(dono.ability, 'blaze');
});

test('Mummy: nunca sobrescreve uma habilidade que mexe com mecânica própria do motor (Stance Change)', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const baseAegislash = { hp: 60, attack: 50, defense: 150, 'special-attack': 50, 'special-defense': 150, speed: 60 };
  const zero = { hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 };
  const aegislash = mon({ ability: 'stance-change', nature: 'hardy', ivs: zero, evs: zero, data: { types: ['steel', 'ghost'], base: baseAegislash } });
  await usarGolpe(aegislash, mon({ ability: 'mummy' }), golpe(), true, ctx());
  assert.equal(aegislash.ability, 'stance-change', 'habilidade travada não é sobrescrita, mesmo formando a Lâmina');
});

test('desfazerTrace: restaura a habilidade original depois da troca/contágio', () => {
  const m = { ability: 'mummy', abilityAntes: 'blaze' };
  assert.equal(desfazerTrace(m), true);
  assert.equal(m.ability, 'blaze'); assert.equal(m.abilityAntes, undefined);
  assert.equal(desfazerTrace({ ability: 'blaze' }), false);
});

test('Trace: copia a habilidade de um oponente ao entrar (nunca uma travada, como Stance Change)', async () => {
  const tracer = mon({ ability: 'trace' });
  const oponente = mon({ ability: 'blaze' });
  await aoEntrarEmCampo([tracer], m => (m === tracer ? [oponente] : [tracer]), ctx());
  assert.equal(tracer.ability, 'blaze'); assert.equal(tracer.abilityAntes, 'trace');

  const tracer2 = mon({ ability: 'trace' });
  const aegislash = mon({ ability: 'stance-change' });
  await aoEntrarEmCampo([tracer2], m => (m === tracer2 ? [aegislash] : [tracer2]), ctx());
  assert.equal(tracer2.ability, 'trace', 'não copia Stance Change');
});

test('Forewarn e Frisk: só narram, sem efeito mecânico', async () => {
  const c = ctx();
  const golpeForte = golpe({ name: 'hyper-beam', power: 150 });
  const forewarn = mon({ ability: 'forewarn', moves: [golpe()] });
  const oponente = mon({ moves: [golpeForte] });
  await aoEntrarEmCampo([forewarn], m => (m === forewarn ? [oponente] : [forewarn]), c);
  assert.ok(c.msgs.some(msg => msg.includes('hyper-beam')));

  const c2 = ctx();
  const frisk = mon({ ability: 'frisk' });
  const comItem = mon({ item: 'leftovers' });
  await aoEntrarEmCampo([frisk], m => (m === frisk ? [comItem] : [frisk]), c2);
  assert.ok(c2.msgs.some(msg => msg.toLowerCase().includes('restos')));
});

test('Moody: no fim do turno, +2 num atributo sorteado e −1 em outro (nunca o mesmo)', async t => {
  t.mock.method(Math, 'random', () => 0.3); // fixo de propósito: confere que não trava num loop infinito
  const m = mon({ ability: 'moody' });
  await fimDeTurno(m, ctx());
  const stages = Object.values(m.vol.stages);
  assert.equal(stages.filter(v => v === 2).length, 1);
  assert.equal(stages.filter(v => v === -1).length, 1);
});

test('Ripen dobra a cura da fruta; Cheek Pouch cura HP extra com QUALQUER fruta, mesmo as que só curam status', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const semHab = mon({ item: 'oran-berry', hp: 40 });
  await comerFruta(semHab, ctx());
  const curaNormal = semHab.hp - 40;

  const comRipen = mon({ item: 'oran-berry', hp: 40, ability: 'ripen' });
  await comerFruta(comRipen, ctx());
  assert.equal(comRipen.hp - 40, curaNormal * 2);

  const comCheek = mon({ item: 'lum-berry', status: 'paralysis', hp: 50, ability: 'cheek-pouch' });
  await comerFruta(comCheek, ctx());
  assert.equal(comCheek.status, null);
  assert.ok(comCheek.hp > 50, 'Cheek Pouch cura HP mesmo com uma fruta que só cura status');
});

test('Klutz: o item continua segurado mas não tem NENHUM efeito em batalha', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const semKlutz = mon({ item: 'leftovers', hp: 50 });
  await fimDeTurno(semKlutz, ctx());
  assert.ok(semKlutz.hp > 50, 'sem Klutz, Restos cura normal');

  const comKlutz = mon({ item: 'leftovers', hp: 50, ability: 'klutz' });
  await fimDeTurno(comKlutz, ctx());
  assert.equal(comKlutz.hp, 50, 'com Klutz, Restos não faz nada');
  assert.equal(comKlutz.item, 'leftovers', 'mas o item continua lá');
});

test('Good As Gold: imune a QUALQUER golpe de status usado por outro Pokémon', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const alvo = mon({ ability: 'good-as-gold' });
  await usarGolpe(mon(), alvo, golpe({ cls: 'status', stats: [{ stat: 'attack', change: -2 }], meta: {} }), true, ctx());
  assert.equal(alvo.vol.stages.attack, 0);
});

test('Corrosion: ignora a imunidade de TIPO ao veneno; a de HABILIDADE (Immunity) continua valendo', async () => {
  const atacante = mon({ ability: 'corrosion' });
  const alvoAco = mon({ data: { types: ['steel'] } });
  await aplicarStatus(alvoAco, 'poison', ctx(), true, atacante);
  assert.equal(alvoAco.status, 'poison');

  const semCorrosion = mon({ data: { types: ['steel'] } });
  await aplicarStatus(semCorrosion, 'poison', ctx(), true, mon());
  assert.equal(semCorrosion.status, null, 'sem Corrosion, Aço continua imune');

  const comImmunity = mon({ ability: 'immunity' });
  await aplicarStatus(comImmunity, 'poison', ctx(), true, atacante);
  assert.equal(comImmunity.status, null, 'Immunity continua protegendo mesmo contra Corrosion');
});

test('Flower Veil: Grama no lado (você ou aliado) não perde atributo nem pega status vindo de fora', async () => {
  const guarda = mon({ ability: 'flower-veil' });
  const grama = mon({ data: { types: ['grass'] } });
  const c = { ...ctx(), aliadosDe: m => (m === grama ? [guarda] : []) };
  await mudarEstagios(grama, [{ stat: 'attack', change: -1 }], c, mon());
  assert.equal(grama.vol.stages.attack, 0);
  await aplicarStatus(grama, 'poison', c, true, mon());
  assert.equal(grama.status, null);

  const naoGrama = mon({ data: { types: ['normal'] } });
  const c2 = { ...ctx(), aliadosDe: m => (m === naoGrama ? [guarda] : []) };
  await mudarEstagios(naoGrama, [{ stat: 'attack', change: -1 }], c2, mon());
  assert.equal(naoGrama.vol.stages.attack, -1, 'sem ser Grama, o Véu de Flores não protege');
});

/* ---- 8ª leva ---- */

// Os quatro Tesouros da Ruína entram como multiplicador do golpe (regras.calcDamage): o atributo caído é sempre
// o de QUEM ESTÁ DO OUTRO LADO, nunca o próprio — é essa troca de lado que o teste trava.
test('Tesouros da Ruína: derrubam atributo do OUTRO lado, nunca o próprio', t => {
  t.mock.method(Math, 'random', () => 0.99);          // sem crítico, dano máximo fixo
  const base = calcDamage(mon(), mon(), golpe(), null, null, null, true).dmg;
  const fis = golpe(), esp = golpe({ cls: 'special' });
  // Espada da Ruína em quem ATACA: a Defesa do alvo caiu → dano físico sobe
  assert.ok(calcDamage(mon({ ability: 'sword-of-ruin' }), mon(), fis, null, null, null, true).dmg > base);
  // a mesma habilidade em quem DEFENDE não muda nada (a Defesa dele é a única que não cai)
  assert.equal(calcDamage(mon(), mon({ ability: 'sword-of-ruin' }), fis, null, null, null, true).dmg, base);
  // Tábuas da Ruína em quem DEFENDE: o Ataque de quem bate caiu → dano físico desce
  assert.ok(calcDamage(mon(), mon({ ability: 'tablets-of-ruin' }), fis, null, null, null, true).dmg < base);
  // e cada uma mexe só no par certo: Tábuas (Ataque) não encosta no golpe especial
  const baseEsp = calcDamage(mon(), mon(), esp, null, null, null, true).dmg;
  assert.equal(calcDamage(mon(), mon({ ability: 'tablets-of-ruin' }), esp, null, null, null, true).dmg, baseEsp);
  assert.ok(calcDamage(mon(), mon({ ability: 'vessel-of-ruin' }), esp, null, null, null, true).dmg < baseEsp);
});

test('Dark Aura vale pros DOIS lados e Aura Break inverte', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const dark = golpe({ type: 'dark' });
  const base = calcDamage(mon(), mon(), dark, null, null, null, true).dmg;
  assert.ok(calcDamage(mon({ ability: 'dark-aura' }), mon(), dark, null, null, null, true).dmg > base, 'em quem ataca');
  assert.ok(calcDamage(mon(), mon({ ability: 'dark-aura' }), dark, null, null, null, true).dmg > base, 'em quem defende também');
  // Aura Break do outro lado: o reforço vira enfraquecimento
  assert.ok(calcDamage(mon({ ability: 'dark-aura' }), mon({ ability: 'aura-break' }), dark, null, null, null, true).dmg < base);
  // tipo de fora da aura não muda (base própria: o golpe Normal de um Pokémon Normal tem STAB)
  const baseNormal = calcDamage(mon(), mon(), golpe(), null, null, null, true).dmg;
  assert.equal(calcDamage(mon({ ability: 'dark-aura' }), mon(), golpe(), null, null, null, true).dmg, baseNormal);
});

/* Scrappy / Mind's Eye: a imunidade do Fantasma a Normal/Lutador cai. O que o teste precisa provar é que a
   habilidade NÃO mexe em eficácia que não seja zero — tirar o tipo da conta sempre baixaria o super efetivo. */
test('Scrappy acerta Fantasma sem estragar as outras eficácias', async () => {
  const fantasma = mon({ data: { types: ['ghost'] } });
  const c = ctx();
  await usarGolpe(mon(), fantasma, golpe(), true, c);
  assert.equal(fantasma.hp, 100, 'sem a habilidade, Normal não afeta');
  const alvo = mon({ data: { types: ['ghost'] } });
  await usarGolpe(mon({ ability: 'scrappy' }), alvo, golpe(), true, ctx());
  assert.ok(alvo.hp < 100, 'com Scrappy, acerta');
  // golpe Sombrio em Fantasma continua super efetivo (e não vira "neutro sem o tipo")
  const base = calcDamage(mon(), fantasma, golpe({ type: 'dark' }), null, null, null, true).dmg;
  assert.equal(calcDamage(mon({ ability: 'scrappy' }), fantasma, golpe({ type: 'dark' }), null, null, null, true).dmg, base);
});

test('Suction Cups não sai de campo por golpe, mas Wimp Out ainda sai por conta própria', async () => {
  const agarrado = mon({ ability: 'suction-cups' });
  let pedidos = 0;
  const c = { ...ctx(), forcarSaida: async () => { pedidos++; return true; } };
  // o motor PEDE a saída (golpe.sairDeCampo) — a habilidade recusa antes de chegar em quem tira de campo
  await usarGolpe(mon(), agarrado, golpe({ name: 'dragon-tail' }), true, c);
  assert.equal(pedidos, 0, 'arrastar pra fora não acontece');
  const medroso = mon({ ability: 'wimp-out', hp: 60 });   // 60 > metade: um golpe qualquer cruza a linha
  const c2 = { ...ctx(), forcarSaida: async () => { pedidos++; return true; } };
  await usarGolpe(mon(), medroso, golpe({ power: 80 }), true, c2);
  assert.ok(pedidos >= 1, 'sair por vontade própria continua valendo');
});

test('Steadfast: perder o turno recuando sobe a Velocidade', async () => {
  const m = mon({ ability: 'steadfast' });
  m.vol.flinch = true;
  await usarGolpe(m, mon(), golpe(), true, ctx());
  assert.equal(m.vol.stages.speed, 1);
  // sem a habilidade, o recuo é só prejuízo
  const n = mon(); n.vol.flinch = true;
  await usarGolpe(n, mon(), golpe(), true, ctx());
  assert.equal(n.vol.stages.speed, 0);
});

test('Protean troca o próprio tipo uma vez por entrada; Color Change troca sempre', async () => {
  const p = mon({ ability: 'protean' });
  await usarGolpe(p, mon(), golpe({ type: 'water' }), true, ctx());
  assert.deepEqual(p.vol.tipos, ['water']);
  await usarGolpe(p, mon(), golpe({ type: 'fire' }), true, ctx());
  assert.deepEqual(p.vol.tipos, ['water'], 'uma vez só por entrada em campo (Gen 9)');
  const cc = mon({ ability: 'color-change' });
  await usarGolpe(mon(), cc, golpe({ type: 'water' }), true, ctx());
  assert.deepEqual(cc.vol.tipos, ['water']);
  await usarGolpe(mon(), cc, golpe({ type: 'fire' }), true, ctx());
  assert.deepEqual(cc.vol.tipos, ['fire'], 'toda vez que apanha');
});

test('Cursed Body desativa o golpe que acertou, pela trava do Disable', async t => {
  t.mock.method(Math, 'random', () => 0.1);           // 10% < 30%: ativa
  const atacante = mon();
  await usarGolpe(atacante, mon({ ability: 'cursed-body' }), golpe(), true, ctx());
  assert.equal(atacante.vol.desativado?.golpe, 'tackle');
  t.mock.restoreAll();
  t.mock.method(Math, 'random', () => 0.9);           // 90% > 30%: não ativa
  const outro = mon();
  await usarGolpe(outro, mon({ ability: 'cursed-body' }), golpe(), true, ctx());
  assert.equal(outro.vol.desativado, undefined);
});

test('Bad Dreams castiga quem dorme do outro lado, e só quem dorme', async () => {
  const darkrai = mon({ ability: 'bad-dreams' });
  const dormindo = mon({ status: 'sleep', sleep: 3 }), acordado = mon();
  const c = { ...ctx(), oponentesDe: () => [dormindo, acordado] };
  await fimDeTurno(darkrai, c);
  assert.equal(dormindo.hp, 100 - Math.floor(100 / 8));
  assert.equal(acordado.hp, 100);
});

test('Toxic Chain envenena GRAVE sem precisar encostar', async t => {
  t.mock.method(Math, 'random', () => 0.1);
  const alvo = mon();
  await usarGolpe(mon({ ability: 'toxic-chain' }), alvo, golpe({ name: 'swift', power: 60 }), true, ctx());
  assert.equal(alvo.status, 'poison');
  assert.equal(alvo.vol.toxico, 1, 'veneno grave');
});

test('entrada em campo: Curious Medicine zera, Costar copia, Hospitality cura, Supersweet Syrup baixa a evasão', async () => {
  const oponentesDe = alvos => () => alvos;
  // Curious Medicine: zera o lado todo (o dele e o do aliado), bom e ruim
  const aliado = mon(); aliado.vol.stages.attack = 2;
  const medico = mon({ ability: 'curious-medicine' }); medico.vol.stages.speed = -1;
  await aoEntrarEmCampo([medico], oponentesDe([]), { ...ctx(), aliadosDe: () => [aliado] });
  assert.equal(aliado.vol.stages.attack, 0);
  assert.equal(medico.vol.stages.speed, 0);
  // Costar: entra copiando os degraus do aliado
  const forte = mon(); forte.vol.stages.attack = 2;
  const copia = mon({ ability: 'costar' });
  await aoEntrarEmCampo([copia], oponentesDe([]), { ...ctx(), aliadosDe: () => [forte] });
  assert.equal(copia.vol.stages.attack, 2);
  // Hospitality: 25% do HP MÁXIMO do aliado
  const ferido = mon({ hp: 40 });
  await aoEntrarEmCampo([mon({ ability: 'hospitality' })], oponentesDe([]), { ...ctx(), aliadosDe: () => [ferido] });
  assert.equal(ferido.hp, 65);
  // Supersweet Syrup: baixa a evasão do outro lado, uma vez por batalha
  const inimigo = mon();
  const xarope = mon({ ability: 'supersweet-syrup' });
  await aoEntrarEmCampo([xarope], oponentesDe([inimigo]), ctx());
  assert.equal(inimigo.vol.stages.evasion, -1);
  await aoEntrarEmCampo([xarope], oponentesDe([inimigo]), ctx());
  assert.equal(inimigo.vol.stages.evasion, -1, 'não repete na mesma batalha');
});

test('Screen Cleaner estilhaça as telas dos DOIS lados', async () => {
  const campo = { lados: { jogador: { reflect: 3, luz: 0, veu: 0 }, inimigo: { reflect: 0, luz: 4, veu: 2 } } };
  await aoEntrarEmCampo([mon({ ability: 'screen-cleaner' })], () => [], { ...ctx(), campo });
  assert.deepEqual(campo.lados.jogador, { reflect: 0, luz: 0, veu: 0 });
  assert.deepEqual(campo.lados.inimigo, { reflect: 0, luz: 0, veu: 0 });
});
