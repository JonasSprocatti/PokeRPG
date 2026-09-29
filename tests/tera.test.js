/* Terastalização — a parte que decide a luta são as duas contas de tipo (js/regras.js), e elas são puras.
   `js/tera.js` em si é quase só o gatilho: o que importa testar é que terastalizar muda mesmo o dano, nos dois
   sentidos, e que a conta antiga continua valendo pra quem não terastalizou. */
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { tiposDefensivos, tiposOfensivos, multStab, typeEff, calcDamage, calcStats, freshVol, golpeDoTera, melhorGolpe, escolhaIA, ESPERTEZA } from '../js/regras.js';
import { fimDeTurnoDoItem } from '../js/segurados.js';
import { acaoDaIA, novaBatalhaMP, fotoDoMon } from '../js/mp-motor.js';
import { usarGolpe } from '../js/golpe.js';
import { TYPE_PT } from '../js/dados.js';

const mon = (types, extra = {}) => {
  const data = { types, base: { hp: 80, attack: 100, defense: 80, 'special-attack': 100, 'special-defense': 80, speed: 80 } };
  // IVs/EVs completos: com `{}` o calcStats soma undefined e todos os atributos viram NaN
  const cheio = v => Object.fromEntries(Object.keys(data.base).map(s => [s, v]));
  const m = { level: 50, data, ivs: cheio(31), evs: cheio(0), nature: 'hardy', ability: '', status: null, vol: freshVol(), ...extra };
  m.stats = calcStats(m); m.hp = m.stats.hp;
  return m;
};

test('sem Tera, nada muda: defende pelos tipos originais e o STAB é o de sempre', () => {
  const m = mon(['fire', 'flying']);
  assert.deepEqual(tiposDefensivos(m), ['fire', 'flying']);
  assert.equal(multStab(m, 'fire'), 1.5, 'tipo original: STAB');
  assert.equal(multStab(m, 'water'), 1, 'tipo de fora: sem STAB');
  assert.equal(multStab(m, 'fire', 2), 2, 'Adaptability continua valendo');
});

test('terastalizado defende por UM tipo só', () => {
  const charizard = mon(['fire', 'flying'], { tera: 'water' });
  assert.deepEqual(tiposDefensivos(charizard), ['water']);
  // é o ponto da mecânica: Charizard morre pra Pedra (4×) e, Tera Água, deixa de morrer
  assert.equal(typeEff('rock', ['fire', 'flying']), 4);
  assert.equal(typeEff('rock', tiposDefensivos(charizard)), 1, 'Pedra contra Água é neutro');
});

test('STAB do Tera: 2.0 só quando o Tera casa com um tipo que você já tinha', () => {
  const casou = mon(['fire', 'flying'], { tera: 'fire' });
  assert.equal(multStab(casou, 'fire'), 2, 'Tera igual a um tipo original: o prêmio');
  assert.equal(multStab(casou, 'flying'), 1.5, 'o outro tipo original não perde o STAB');
  assert.equal(multStab(casou, 'water'), 1);

  const trocou = mon(['fire', 'flying'], { tera: 'water' });
  assert.equal(multStab(trocou, 'water'), 1.5, 'Tera de fora: STAB normal');
  assert.equal(multStab(trocou, 'fire'), 1.5, 'e o STAB antigo continua');
  assert.equal(multStab(trocou, 'grass'), 1);
});

// `Math.random` fixo: a rolagem de 85–100% do dano é o único acaso aqui, e comparar dano com ela solta daria
// teste instável. Mesmo padrão dos testes de calcDamage em regras.test.js.
test('o dano calculado muda de verdade ao terastalizar', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const golpePedra = { name: 'rock-slide', type: 'rock', cls: 'physical', power: 75, meta: {} };
  const atacante = mon(['rock']);
  const normal = calcDamage(atacante, mon(['fire', 'flying']), golpePedra);
  const comTera = calcDamage(atacante, mon(['fire', 'flying'], { tera: 'water' }), golpePedra);
  assert.ok(comTera.dmg < normal.dmg, `Tera Água devia sofrer menos de Pedra (${comTera.dmg} vs ${normal.dmg})`);

  // e do lado ofensivo: o mesmo golpe bate mais forte quando o Tera casa com o tipo dele
  const golpeFogo = { name: 'flamethrower', type: 'fire', cls: 'special', power: 90, meta: {} };
  const alvo = () => mon(['normal']);
  const semTera = calcDamage(mon(['fire']), alvo(), golpeFogo);
  const comCasamento = calcDamage(mon(['fire'], { tera: 'fire' }), alvo(), golpeFogo);
  assert.ok(comCasamento.dmg > semTera.dmg, `Tera Fogo num Fogo devia bater mais (${comCasamento.dmg} vs ${semTera.dmg})`);
});

test('todo tipo do jogo pode ser Tera (a conquista é por tipo)', () => {
  for (const t of Object.keys(TYPE_PT)) {
    const m = mon(['normal'], { tera: t });
    assert.deepEqual(tiposDefensivos(m), [t], t);
  }
});

/* Bug real relatado em jogo: Mewtwo (psiquico) terastalizou pra Água, mas ao ser atingido por Bite (sombrio) a
   narração dizia "É super efetivo!" (verdade só contra Psíquico, não contra Água) — js/golpe.js calculava esse
   texto e o gate de imunidade com `t.data.types` direto, ignorando `m.tera`, enquanto o DANO em regras.js já
   respeitava. A mesma falha existia nas imunidades de OHKO, Leech Seed e pó (Effect Spore). */
const golpe = (o = {}) => ({ name: 'bite', type: 'dark', cls: 'physical', power: 60, acc: 100, pp: 25, ppLeft: 25, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const monMotor = (types, extra = {}) => ({
  level: 50, ability: 'none', data: { types }, status: null, sleep: 0,
  stats: { hp: 200, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 200, moves: [golpe()], vol: freshVol(), ...extra,
});
const ctx = () => { const msgs = []; return { msgs, nome: m => m.nome || 'X', golpe: g => g.name, say: async t => { msgs.push(t); } }; };

test('mensagem de eficácia segue o Tera, não o tipo original', async t => {
  t.mock.method(Math, 'random', () => 0.99);   // sem crítico, sem miss
  const houndoom = monMotor(['dark']);
  const mewtwoPsiquico = monMotor(['psychic']);
  const c1 = ctx();
  await usarGolpe(houndoom, mewtwoPsiquico, golpe(), true, c1);
  assert.ok(c1.msgs.includes('É super efetivo!'), 'sombrio contra psíquico é super efetivo de verdade');

  const mewtwoTeraAgua = monMotor(['psychic'], { tera: 'water' });
  const c2 = ctx();
  await usarGolpe(houndoom, mewtwoTeraAgua, golpe(), true, c2);
  assert.ok(!c2.msgs.includes('É super efetivo!'), 'sombrio contra Tera Água é neutro — não devia dizer super efetivo');
});

test('Leech Seed e pó respeitam o tipo Tera, não só o original', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const planta = monMotor(['grass']);
  const semente = { ...golpe(), name: 'leech-seed', cls: 'status', power: null, acc: null, target: 'selected-pokemon' };
  const c = ctx();
  // Grama terastalizada pra Água deixa de ser imune a Leech Seed
  const plantaTeraAgua = monMotor(['grass'], { tera: 'water' });
  await usarGolpe(monMotor(['normal']), plantaTeraAgua, semente, true, c);
  assert.notEqual(plantaTeraAgua.vol.semente, undefined, 'Grama Tera Água não é mais imune a Leech Seed');
  // e o inverso: algo terastalizado PRA Grama fica imune, mesmo não sendo Grama de origem
  const normalTeraGrama = monMotor(['normal'], { tera: 'grass' });
  await usarGolpe(monMotor(['normal']), normalTeraGrama, semente, true, c);
  assert.equal(normalTeraGrama.vol.semente, undefined, 'Tera Grama vira imune a Leech Seed mesmo sem ser Grama de origem');
});

/* Bug real relatado em jogo: "Terablast não está trocando conforme a tipagem do terastal" — o golpe nunca tinha
   tratamento especial (diferente do Weather Ball, que já mudava de tipo com o clima), então saía sempre Normal. */
test('golpeDoTera: Tera Blast vira o tipo de quem usa, só quando terastalizado', () => {
  const teraBlast = { name: 'tera-blast', type: 'normal', power: 80, cls: 'special' };
  assert.equal(golpeDoTera(teraBlast, { tera: 'fire' }).type, 'fire');
  assert.equal(golpeDoTera(teraBlast, { tera: 'dragon' }).type, 'dragon');
  assert.equal(golpeDoTera(teraBlast, {}).type, 'normal', 'sem terastalizar, continua o tipo original');
  assert.equal(golpeDoTera(teraBlast, { tera: 'water' }).power, 80, 'poder não muda, só o tipo');
  assert.equal(golpeDoTera({ name: 'tackle', type: 'normal' }, { tera: 'fire' }).type, 'normal', 'só mexe no Tera Blast');
});

test('Tera Blast muda de tipo de verdade dentro do motor do golpe', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const teraBlast = golpe({ name: 'tera-blast', type: 'normal', power: 80, cls: 'special' });
  const usuario = monMotor(['fire'], { tera: 'normal' }); // vira Tera Blast Normal — imune contra Fantasma
  const alvo = monMotor(['ghost']);
  const c = ctx();
  await usarGolpe(usuario, alvo, teraBlast, true, c);
  assert.equal(alvo.hp, 200, 'Tera Blast virou Normal: Fantasma é imune, não devia tirar HP nenhum');
  assert.ok(c.msgs.some(m => /não afeta/i.test(m)), 'e a narração precisa dizer que não afetou');
});

/* ---- os 3 resíduos do mesmo bug, encontrados ao reconferir os relatos #61/#64 em 29/09/2026 ----
   O dano e a narração já respeitavam o Tera; estes três ainda liam `m.data.types` direto. */

test('tiposOfensivos: o Tera SOMA STAB, não substitui (ao contrário do lado defensivo)', () => {
  const dragaoTeraFogo = mon(['dragon'], { tera: 'fire' });
  assert.deepEqual(tiposDefensivos(dragaoTeraFogo), ['fire'], 'defende só pelo Tera');
  assert.deepEqual(tiposOfensivos(dragaoTeraFogo).sort(), ['dragon', 'fire'], 'mas ataca com STAB dos dois');
  // e bate com multStab, que é quem faz a conta de verdade
  assert.equal(multStab(dragaoTeraFogo, 'dragon'), 1.5, 'o tipo de origem NÃO perde o STAB');
  assert.equal(multStab(dragaoTeraFogo, 'fire'), 1.5);
  const fogoTeraFogo = mon(['fire'], { tera: 'fire' });
  assert.deepEqual(tiposOfensivos(fogoTeraFogo), ['fire'], 'sem repetir quando o Tera é um tipo que já tinha');
  assert.equal(multStab(fogoTeraFogo, 'fire'), 2, 'e aí o STAB é 2.0');
  assert.deepEqual(tiposOfensivos(mon(['water'])), ['water'], 'sem Tera, são os tipos de origem');
});

test('a IA do selvagem escolhe pelo tipo Tera do alvo, não pelo de origem', () => {
  /* O caso do relato: Mewtwo psíquico que virou Tera Água. Sombrio deixa de ser super efetivo e Elétrico passa a
     ser. O atacante é Normal e os dois golpes têm o MESMO poder de propósito: sem isso o STAB do atacante decide
     sozinho e o teste passaria mesmo com o bug (foi o que aconteceu na primeira versão dele). */
  const mewtwoTeraAgua = mon(['psychic'], { tera: 'water' });
  const atacante = ['normal'];
  const golpes = [
    { name: 'bite', type: 'dark', cls: 'physical', power: 60, ppLeft: 10 },
    { name: 'thunder-shock', type: 'electric', cls: 'special', power: 60, ppLeft: 10 },
  ];
  const semTera = melhorGolpe(golpes, atacante, tiposDefensivos(mon(['psychic'])));
  assert.equal(semTera.name, 'bite', 'contra o Mewtwo psíquico, Sombrio é a escolha certa');
  const comTera = melhorGolpe(golpes, atacante, tiposDefensivos(mewtwoTeraAgua));
  assert.equal(comTera.name, 'thunder-shock', 'contra Tera Água, o selvagem tem de largar o Sombrio');
  // e pelo caminho que batalha.chooseEnemyMove usa de verdade (degrau `simples` = selvagem, sem contexto)
  const escolhido = escolhaIA(golpes, atacante, tiposDefensivos(mewtwoTeraAgua), ESPERTEZA.selvagem, () => 0);
  assert.equal(escolhido.name, 'thunder-shock');
});

test('Lodo Negro segue o tipo Tera: cura quem virou Veneno, machuca o Veneno que virou outra coisa', () => {
  const comItem = (types, extra) => { const m = mon(types, { item: 'black-sludge', ...extra }); m.hp = Math.floor(m.stats.hp / 2); return m; };
  const veneno = comItem(['poison']);
  assert.ok(fimDeTurnoDoItem(veneno, tiposDefensivos(veneno)) > 0, 'Venenoso é curado, como sempre foi');
  const normal = comItem(['normal']);
  assert.ok(fimDeTurnoDoItem(normal, tiposDefensivos(normal)) < 0, 'quem não é Venenoso se machuca, como sempre foi');
  const normalTeraVeneno = comItem(['normal'], { tera: 'poison' });
  assert.ok(fimDeTurnoDoItem(normalTeraVeneno, tiposDefensivos(normalTeraVeneno)) > 0, 'Tera Veneno passa a ser CURADO');
  const venenoTeraFogo = comItem(['poison'], { tera: 'fire' });
  assert.ok(fimDeTurnoDoItem(venenoTeraFogo, tiposDefensivos(venenoTeraFogo)) < 0, 'e o Venenoso que vira Tera Fogo passa a se machucar');
});

/* O teste acima prova que `melhorGolpe`/`escolhaIA` obedecem aos tipos que RECEBEM — e isso já era verdade antes
   da correção: o bug estava em quem CHAMA (passava `alvo.data.types`). `mp-motor.acaoDaIA` é o único chamador
   puro (batalha.chooseEnemyMove precisa de DOM), então é por ele que dá pra travar o call site de verdade. */
test('acaoDaIA (call site real) enxerga o Tera do alvo', () => {
  const foto = (m, ref) => { const f = fotoDoMon(m, ref, 'ia', ref); if (m.tera) f.tera = m.tera; return f; };
  const golpes = [
    { name: 'bite', type: 'dark', cls: 'physical', power: 60, ppLeft: 10, pp: 10, meta: {}, stats: [] },
    { name: 'thunder-shock', type: 'electric', cls: 'special', power: 60, ppLeft: 10, pp: 10, meta: {}, stats: [] },
  ];
  const atacante = mon(['normal'], { moves: golpes, name: 'x', nick: null });
  const monte = alvoMon => novaBatalhaMP([foto(alvoMon, 'a1')], [foto(atacante, 'b1')]);
  /* `ESPERTEZA.selvagem` de propósito: é o único degrau (`simples`) que NÃO passa por `notaDoGolpe` e cai no
     `melhorGolpe` antigo, com os tipos que o chamador entrega. Com esperteza de chefe este teste passa mesmo
     com o bug — `notaDoGolpe` já lia `tiposDefensivos` desde o conserto de 27/09. `sorte` fixa em 0 escolhe o
     primeiro alvo e faz a IA "pensar" (0 < 0.5). */
  const semTera = acaoDaIA(monte(mon(['psychic'], { moves: [], name: 'y', nick: null })), foto(atacante, 'b1'), () => 0, ESPERTEZA.selvagem);
  assert.equal(golpes[semTera.golpe].name, 'bite', 'contra Psíquico puro, Sombrio');
  const alvoTera = mon(['psychic'], { tera: 'water', moves: [], name: 'y', nick: null });
  const comTera = acaoDaIA(monte(alvoTera), foto(atacante, 'b1'), () => 0, ESPERTEZA.selvagem);
  assert.equal(golpes[comTera.golpe].name, 'thunder-shock', 'contra Tera Água, Elétrico — o call site tem de repassar o Tera');
});

/* `batalha.chooseEnemyMove` e `multiplayer.autoCompletar` são os outros dois chamadores e precisam de DOM, então
   não dá pra exercitá-los aqui. Trava estática no lugar: quem pergunta à IA qual golpe usar tem de entregar os
   tipos por `tiposOfensivos`/`tiposDefensivos`, nunca `.data.types` cru — é exatamente a forma que o bug tinha
   nos três lugares. Mesmo espírito de tests/referencias.test.js: barato, estreito e sem dependência. */
test('nenhum chamador de escolhaIA/melhorGolpe passa .data.types cru', () => {
  const DIR = new URL('../js/', import.meta.url);
  const erradas = [];
  for (const arq of readdirSync(DIR).filter(f => f.endsWith('.js'))) {
    const src = readFileSync(new URL(arq, DIR), 'utf8');
    for (const m of src.matchAll(/\b(escolhaIA|melhorGolpe)\s*\(/g)) {
      const args = src.slice(m.index, m.index + 260);           // a chamada cabe folgada nisso
      if (!/\.data\.types/.test(args)) continue;
      erradas.push(`${arq}:${src.slice(0, m.index).split('\n').length} → ${m[1]}() recebe .data.types (ignora o Tera)`);
    }
  }
  assert.deepEqual(erradas, [], '\n' + erradas.join('\n'));
});
