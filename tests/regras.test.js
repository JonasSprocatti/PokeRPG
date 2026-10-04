// Fórmulas de js/regras.js. Rodar: `node --test` (sem caminho) na raiz do projeto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resumoDeAbates, motivoDeParar, precisaReporPP,
  typeEff, natureMod, natureLabel, calcStats, recalc, freshVol, stageMul, effStat, defaultMoves,
  calcDamage, confDamage, heal, chanceAcerto, imuneAoStatus, danoResidual, consegueFugir,
  jogadorAgePrimeiro, xpPorVitoria, ganhoDeEVs, custoCentro, precisaCurar,
  premioTreinador, bolaPorNivel, treinadorLancaBola, valorCaptura, chancePorBalanco, balancosDaCaptura,
  CHANCE_SHINY, ehShiny, ordenarAcoes, melhorGolpe, ganhoAmizade, podeFazerAmizade, custoCentroEquipe,
  MAX_ALIADOS, AMIZADE_MAX, custoComDesconto, itemTemEfeito, zonaLiberada, statsDeChefe, premioChefe,
  progressoCondicao, situacaoMissoes, desmaioPrecisaRevive, estatisticasDaJornada, pontuacao, formatarTempo,
  golpeDoAliado, escolhaIA, ESPERTEZA, DIVISOR_AMIZADE_LENDARIO, multContinuacao, PENAL_MINIMO, rotaEsgotada, FATOR_ESGOTADA, MARGEM_ESGOTADA, limiteDaRota, MULT_XP, sortearTipoTera, precoItem, precoVenda, alternarRapido, MAX_RAPIDOS,
  caminhoNaArvore, especiesShinyDoJogador, moverGolpe, fazContato, temFlag, ativouQuickClaw, CHANCE_QUICK_CLAW,
  CHANCE_QUICK_DRAW, sempreUltimo, prioridadeEfetiva, golpeDaConversaoDeTipo
} from '../js/regras.js';
import { CHART, ITEMS } from '../js/dados.js';
import { GOLPE_FLAGS, FLAGS_VALIDAS } from '../js/dados-golpe-flags.js';
import { AINDA_EVOLUI } from '../js/dados-evolucao-restante.js';

test('sortearTipoTera: cobre os 18 tipos, sem sair da tabela', () => {
  const vistos = new Set();
  for (let i = 0; i < 360; i++) {
    const t = sortearTipoTera(() => i / 360);
    assert.ok(t && CHART[t], `sorteou ${t}`);
    vistos.add(t);
  }
  assert.equal(vistos.size, 18);
  assert.ok(CHART[sortearTipoTera(() => 0.9999)]);
});

const zeros = () => ({ hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 });
// Pokémon mínimo pra batalha: stats já prontos (100 em tudo), tipo Normal, sem status
const mon = (o = {}) => ({
  level: 50, data: { base: { hp: 100 }, types: ['normal'] }, ivs: zeros(), evs: zeros(), nature: 'hardy',
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, status: null, ability: 'none', vol: freshVol(), ...o
});
const golpe = (o = {}) => ({ name: 'teste', type: 'fire', cls: 'physical', power: 100, acc: 100, priority: 0, meta: {}, stats: [], ...o });

test('typeEff: tabela de tipos Gen 6+', () => {
  assert.equal(typeEff('fire', ['grass']), 2);
  assert.equal(typeEff('fire', ['grass', 'steel']), 4);
  assert.equal(typeEff('water', ['water', 'grass']), 0.25);
  assert.equal(typeEff('normal', ['ghost']), 0);
  assert.equal(typeEff('electric', ['water', 'ground']), 0);
  assert.equal(typeEff('dragon', ['fairy']), 0);
  assert.equal(typeEff('fire', ['normal']), 1);
  assert.equal(typeEff('tipo-inexistente', ['grass']), 1);
});

test('natureza: +10% / −10% e rótulo', () => {
  assert.equal(natureMod('adamant', 'attack'), 1.1);
  assert.equal(natureMod('adamant', 'special-attack'), 0.9);
  assert.equal(natureMod('adamant', 'speed'), 1);
  assert.equal(natureMod('hardy', 'attack'), 1);
  assert.equal(natureLabel('adamant'), 'Adamant (+Ataque −At. Esp.)');
  assert.equal(natureLabel('hardy'), 'Hardy (neutra)');
});

test('calcStats: bate com o exemplo oficial (Garchomp Nv. 78, Adamant — Bulbapedia)', () => {
  const g = {
    level: 78, nature: 'adamant',
    data: { base: { hp: 108, attack: 130, defense: 95, 'special-attack': 80, 'special-defense': 85, speed: 102 } },
    ivs: { hp: 24, attack: 12, defense: 30, 'special-attack': 16, 'special-defense': 23, speed: 5 },
    evs: { hp: 74, attack: 190, defense: 91, 'special-attack': 48, 'special-defense': 84, speed: 23 }
  };
  assert.deepEqual(calcStats(g), { hp: 289, attack: 278, defense: 193, 'special-attack': 135, 'special-defense': 171, speed: 171 });
});

test('calcStats: HP base 1 (Shedinja) é sempre 1', () => {
  const s = calcStats({ level: 50, nature: 'hardy', data: { base: { ...zeros(), hp: 1 } }, ivs: zeros(), evs: zeros() });
  assert.equal(s.hp, 1);
});

test('recalc: subir de nível mantém o dano sofrido', () => {
  const m = { level: 10, nature: 'hardy', data: { base: { hp: 50, attack: 50, defense: 50, 'special-attack': 50, 'special-defense': 50, speed: 50 } }, ivs: zeros(), evs: zeros() };
  m.stats = calcStats(m); m.hp = m.stats.hp - 5;
  m.level = 20; recalc(m);
  assert.equal(m.hp, m.stats.hp - 5);
});

/* Bug real relatado em jogo: um Alfa Dragonite mega-evoluiu com 50% do HP (já dobrado por statsDeChefe, batalha.js)
   e desmaiou na hora, antes do aliado bater — sem `m.statsChefe`, recalc() jogava o teto de HP de volta pro valor
   SEM o bônus de chefe (quase a metade), e o `clamp` zerava o HP atual junto. */
test('recalc de um chefe (statsChefe) preserva o bônus de statsDeChefe ao trocar de forma', () => {
  const base = { hp: 91, attack: 134, defense: 95, 'special-attack': 100, 'special-defense': 100, speed: 80 };
  const m = { level: 68, nature: 'hardy', ivs: { hp: 31, attack: 31, defense: 31, 'special-attack': 31, 'special-defense': 31, speed: 31 }, evs: zeros(), data: { base }, statsChefe: true };
  m.stats = statsDeChefe(calcStats(m)); m.hp = m.stats.hp; // como batalha.startBossBattle monta o Alfa
  const hpChefeCheio = m.stats.hp;
  m.hp = Math.floor(hpChefeCheio * 0.5); // levou dano até ficar em 50% — o gatilho da Mega
  m.data = { base: { hp: 91, attack: 124, defense: 115, 'special-attack': 145, 'special-defense': 125, speed: 100 } }; // Mega Dragonite: mesma base de HP
  recalc(m);
  assert.equal(m.stats.hp, hpChefeCheio, 'o teto de HP do chefe não pode cair ao recalcular (mesma base de HP)');
  assert.ok(m.hp > 0, `o chefe não pode nascer desmaiado da própria Mega (ficou com ${m.hp} HP)`);
  assert.equal(m.hp, Math.floor(hpChefeCheio * 0.5), 'o dano já sofrido continua o mesmo — só a base mudou, não o bônus');
});

// Pedido do usuário: vender itens da mochila (ou jogar fora os que não têm preço de loja).
test('precoVenda: metade do preço de compra, arredondado pra baixo; sem preço, zero', () => {
  assert.equal(precoVenda('potion', null), Math.floor(ITEMS.potion.price / 2));
  assert.equal(precoVenda('revive', null), Math.floor(ITEMS.revive.price / 2));
  assert.equal(precoVenda('rare-candy', null), 0, 'item sem price: venda 0 (a mochila oferece "Jogar fora")');
  assert.equal(precoVenda('tm-normal', { discosUsados: 2 }), Math.floor(precoItem('tm-normal', { discosUsados: 2 }) / 2), 'segue o preço dinâmico do Disco');
  assert.equal(precoVenda('potion', { lojaGratis: true }), 0, 'loja grátis: preço de compra 0, venda também 0');
});

test('alternarRapido: marca, desmarca e recusa passar de MAX_RAPIDOS', () => {
  assert.deepEqual(alternarRapido(undefined, 'potion'), ['potion'], 'save antigo (sem a lista) começa do zero');
  assert.deepEqual(alternarRapido(['potion'], 'revive'), ['potion', 'revive']);
  assert.deepEqual(alternarRapido(['potion', 'revive'], 'potion'), ['revive'], 'marcar de novo desmarca');
  assert.equal(alternarRapido(['potion', 'revive'], 'ether'), null, 'cheio: devolve null pra quem chama avisar');
  assert.deepEqual(alternarRapido(['potion', null], 'revive'), ['potion', 'revive'], 'buraco na lista não ocupa vaga');
  assert.equal(MAX_RAPIDOS, 2);
});

test('stageMul: estágios −6..+6', () => {
  assert.equal(stageMul(0), 1);
  assert.equal(stageMul(1), 1.5);
  assert.equal(stageMul(6), 4);
  assert.equal(stageMul(-1), 2 / 3);
  assert.equal(stageMul(-6), 0.25);
});

test('effStat: paralisia, Guts, crítico ignora estágio ruim, mínimo 1', () => {
  assert.equal(effStat(mon({ status: 'paralysis' }), 'speed'), 50);
  assert.equal(effStat(mon({ status: 'burn', ability: 'guts' }), 'attack'), 150);
  const baixo = mon(); baixo.vol.stages.attack = -2;
  assert.equal(effStat(baixo, 'attack'), 50);
  assert.equal(effStat(baixo, 'attack', true, true), 100); // crítico ignora queda de ataque de quem bate
  const alto = mon(); alto.vol.stages.defense = 2;
  assert.equal(effStat(alto, 'defense', true, false), 100); // crítico ignora defesa elevada do alvo
  assert.equal(effStat(mon({ stats: { ...mon().stats, speed: 0 } }), 'speed'), 1);
});

test('Eviolite: Defesa/Def. Especial ×1.5 só em espécie que ainda evolui, e só nesses dois atributos', () => {
  assert.ok(AINDA_EVOLUI.has('pichu'), 'sanity: Pichu ainda evolui (vira Pikachu)');
  assert.ok(!AINDA_EVOLUI.has('raichu'), 'sanity: Raichu é forma final');
  const pichu = mon({ item: 'eviolite', data: { speciesName: 'pichu', types: ['electric'] } });
  assert.equal(effStat(pichu, 'defense'), 150);
  assert.equal(effStat(pichu, 'special-defense'), 150);
  assert.equal(effStat(pichu, 'attack'), 100, 'não mexe em outro atributo');
  const raichu = mon({ item: 'eviolite', data: { speciesName: 'raichu', types: ['electric'] } });
  assert.equal(effStat(raichu, 'defense'), 100, 'forma final: item não faz nada');
  const semItem = mon({ data: { speciesName: 'pichu', types: ['electric'] } });
  assert.equal(effStat(semItem, 'defense'), 100, 'sem o item, mesmo ainda evoluindo, não vale');
});

test('defaultMoves: os 4 mais recentes até o nível, sem repetir, em ordem de nível', () => {
  const list = [1, 5, 9, 13, 17, 21].map(l => ({ name: 'g' + l, url: '', level: l }));
  assert.deepEqual(defaultMoves(list, 15).map(m => m.name), ['g1', 'g5', 'g9', 'g13']);
  assert.deepEqual(defaultMoves(list, 21).map(m => m.name), ['g9', 'g13', 'g17', 'g21']);
  assert.deepEqual(defaultMoves([{ name: 'a', level: 1 }, { name: 'a', level: 1 }], 5).map(m => m.name), ['a']);
  assert.deepEqual(defaultMoves([{ name: 'tarde', level: 40 }], 5).map(m => m.name), ['tarde']); // nada até o nível → o primeiro da lista
  assert.equal(defaultMoves([], 5)[0].name, 'tackle');
});

test('calcDamage: fórmula oficial, sem crítico e com rolagem máxima', t => {
  t.mock.method(Math, 'random', () => 0.99); // sem crítico, rand(85,100) = 100
  // Nv 50, poder 100, A = D = 100 → floor(floor(22*100*100/100)/50)+2 = 46
  assert.equal(calcDamage(mon(), mon(), golpe({ type: 'normal' })).dmg, 69);            // com STAB (Normal usando Normal) ×1,5
  assert.equal(calcDamage(mon(), mon(), golpe()).dmg, 46);                               // Fogo em Normal: neutro, sem STAB
  assert.equal(calcDamage(mon(), mon({ data: { types: ['grass'] } }), golpe()).dmg, 92); // super efetivo
  assert.equal(calcDamage(mon({ status: 'burn' }), mon(), golpe()).dmg, 23);             // queimadura corta físico pela metade
  assert.equal(calcDamage(mon({ status: 'burn' }), mon(), golpe({ cls: 'special' })).dmg, 46); // …mas não especial
  assert.equal(calcDamage(mon({ ability: 'adaptability' }), mon(), golpe({ type: 'normal' })).dmg, 92); // STAB ×2
  assert.equal(calcDamage(mon(), mon(), golpe()).crit, false);
});

test('calcDamage: crítico ×1,5 e rolagem mínima 85%', t => {
  t.mock.method(Math, 'random', () => 0); // crítico sempre, rand(85,100) = 85
  const r = calcDamage(mon(), mon(), golpe());
  assert.equal(r.crit, true);
  assert.equal(r.dmg, Math.floor(46 * 1.5 * 0.85));
});

test('calcDamage: pinch (Blaze com ≤1/3 de HP) e Flash Fire', t => {
  t.mock.method(Math, 'random', () => 0.99);
  assert.equal(calcDamage(mon({ ability: 'blaze', hp: 33 }), mon(), golpe()).dmg, 69);
  assert.equal(calcDamage(mon({ ability: 'blaze', hp: 34 }), mon(), golpe()).dmg, 46);
  const ff = mon(); ff.vol.flashFire = true;
  assert.equal(calcDamage(ff, mon(), golpe()).dmg, 69);
});

test('calcDamage: golpes de dano fixo', () => {
  assert.deepEqual(calcDamage(mon({ level: 37 }), mon(), golpe({ name: 'seismic-toss' })), { dmg: 37, crit: false });
  assert.equal(calcDamage(mon(), mon(), golpe({ name: 'dragon-rage' })).dmg, 40);
  assert.equal(calcDamage(mon(), mon({ hp: 51 }), golpe({ name: 'super-fang' })).dmg, 25);
  assert.equal(calcDamage(mon(), mon({ hp: 1 }), golpe({ name: 'super-fang' })).dmg, 1); // nunca 0
});

test('confDamage: golpe de poder 40 em si mesmo, sem tipo', () => {
  assert.equal(confDamage(mon()), Math.floor(Math.floor(22 * 40) / 50) + 2);
});

test('heal: não passa do máximo', () => {
  const m = mon({ hp: 90 }); heal(m, 50);
  assert.equal(m.hp, 100);
});

test('chanceAcerto: precisão × estágio (precisão de quem usa − evasão do alvo)', () => {
  assert.equal(chanceAcerto(golpe(), mon(), mon()), 1);
  assert.equal(chanceAcerto(golpe({ acc: 90 }), mon(), mon()), 0.9);
  const mira = mon(); mira.vol.stages.accuracy = 1;
  assert.equal(chanceAcerto(golpe(), mira, mon()), 4 / 3);
  const esquiva = mon(); esquiva.vol.stages.evasion = 1;
  assert.equal(chanceAcerto(golpe(), mon(), esquiva), 0.75);
  const muito = mon(); muito.vol.stages.evasion = 6; const ruim = mon(); ruim.vol.stages.accuracy = -6;
  assert.equal(chanceAcerto(golpe(), ruim, muito), 3 / 9); // diferença limitada a −6
});

test('imuneAoStatus: imunidades de tipo', () => {
  assert.equal(imuneAoStatus(['electric'], 'paralysis'), true);
  assert.equal(imuneAoStatus(['fire'], 'burn'), true);
  assert.equal(imuneAoStatus(['ice'], 'freeze'), true);
  assert.equal(imuneAoStatus(['steel'], 'poison'), true);
  assert.equal(imuneAoStatus(['grass', 'poison'], 'poison'), true);
  assert.equal(imuneAoStatus(['water'], 'burn'), false);
  assert.equal(imuneAoStatus(['electric'], 'sleep'), false);
});

test('danoResidual: queimadura 1/16, veneno 1/8', () => {
  const s = { ...mon().stats, hp: 160 };
  assert.equal(danoResidual(mon({ stats: s, status: 'burn' })), 10);
  assert.equal(danoResidual(mon({ stats: s, status: 'poison' })), 20);
  assert.equal(danoResidual(mon({ stats: s, status: 'paralysis' })), 0);
  assert.equal(danoResidual(mon({ stats: s })), 0);
});

test('danoResidual: mínimo 1 com HP máximo baixo (antes dava 0 e o status nunca machucava)', () => {
  const s = hp => ({ ...mon().stats, hp });
  assert.equal(danoResidual(mon({ stats: s(15), status: 'burn' })), 1);   // floor(15/16) = 0 → 1
  assert.equal(danoResidual(mon({ stats: s(7), status: 'poison' })), 1);  // floor(7/8) = 0 → 1
  assert.equal(danoResidual(mon({ stats: s(1), status: 'burn' })), 1);    // Shedinja queimado
  assert.equal(danoResidual(mon({ stats: s(15), status: 'sleep' })), 0);  // sono não machuca
});

test('consegueFugir: Run Away, mais rápido, e a chance que cresce a cada tentativa', () => {
  assert.equal(consegueFugir(10, 100, 1, 'run-away', 0.999), true);
  assert.equal(consegueFugir(100, 100, 1, 'none', 0.999), true);
  // vel 50 contra 100: limiar floor(50*128/100) + 30×tentativas = 64 + 30 = 94 (de 256)
  assert.equal(consegueFugir(50, 100, 1, 'none', 93 / 256), true);
  assert.equal(consegueFugir(50, 100, 1, 'none', 94 / 256), false);
  assert.equal(consegueFugir(50, 100, 2, 'none', 94 / 256), true);
});

test('moverGolpe: troca posições vizinhas, leva o ppLeft junto, não muta o array original', () => {
  const moves = [{ name: 'a', ppLeft: 5 }, { name: 'b', ppLeft: 10 }, { name: 'c', ppLeft: 15 }];
  const depois = moverGolpe(moves, 0, 1);   // "a" desce, troca com "b"
  assert.deepEqual(depois.map(m => m.name), ['b', 'a', 'c']);
  assert.equal(depois[1].ppLeft, 5, 'o PP usado viaja junto com o golpe');
  assert.deepEqual(moves.map(m => m.name), ['a', 'b', 'c'], 'não muta o array original');
  assert.equal(moverGolpe(moves, 0, -1), moves, 'fora da borda (subir o primeiro): devolve o mesmo array, sem erro');
  assert.equal(moverGolpe(moves, 2, 1), moves, 'fora da borda (descer o último): devolve o mesmo array, sem erro');
});

test('consegueFugir: Magnet Pull (preso) trava até quem é mais rápido; Run Away ignora', () => {
  assert.equal(consegueFugir(200, 10, 1, 'none', 0.5, true), false, 'preso não foge nem sendo bem mais rápido');
  assert.equal(consegueFugir(10, 200, 1, 'run-away', 0.5, true), true, 'Run Away escapa até de quem prende');
  assert.equal(consegueFugir(200, 10, 1, 'none', 0.5, false), true, 'sem estar preso, foge normal (mais rápido)');
});

test('jogadorAgePrimeiro: prioridade > velocidade > moeda', () => {
  assert.equal(jogadorAgePrimeiro({ priority: 1 }, { priority: 0 }, 10, 100), true);
  assert.equal(jogadorAgePrimeiro({ priority: 0 }, { priority: 1 }, 100, 10), false);
  assert.equal(jogadorAgePrimeiro({}, {}, 100, 10), true);
  assert.equal(jogadorAgePrimeiro({}, {}, 10, 100), false);
  assert.equal(jogadorAgePrimeiro({}, {}, 50, 50, 0.4), true);
  assert.equal(jogadorAgePrimeiro({}, {}, 50, 50, 0.6), false);
});

test('custoCentro: ₽50 + ₽15 por nível', () => {
  assert.equal(custoCentro(5), 125);
  assert.equal(custoCentro(30), 500);
  assert.equal(custoCentro(100), 1550);
});

test('precisaCurar: HP, status ou PP abaixo do máximo', () => {
  const golpes = () => [{ pp: 10, ppLeft: 10 }];
  assert.equal(precisaCurar(mon({ moves: golpes() })), false);
  assert.equal(precisaCurar(mon({ moves: golpes(), hp: 99 })), true);
  assert.equal(precisaCurar(mon({ moves: golpes(), status: 'poison' })), true);
  assert.equal(precisaCurar(mon({ moves: [{ pp: 10, ppLeft: 9 }] })), true);
});

test('xpPorVitoria: base × nível / 7 × MULT_XP, mínimo 1; de treinador ×1,5', () => {
  const alvo = { level: 7, data: { baseExp: 64 } };
  assert.equal(xpPorVitoria(alvo), Math.floor(64 * MULT_XP));
  assert.equal(xpPorVitoria({ level: 2, data: { baseExp: 1 } }), 1, 'nunca menos que 1, mesmo com o multiplicador');
  // o multiplicador estica a jornada sem mexer no equilíbrio relativo: treinador continua valendo 1,5× o selvagem
  assert.equal(xpPorVitoria(alvo, true), Math.floor(64 * 1.5 * MULT_XP));
  assert.ok(MULT_XP > 0 && MULT_XP <= 1, 'o multiplicador estica a run; acima de 1 encurtaria');
});

test('treinador: prêmio pela soma dos níveis, bola pela faixa de nível', () => {
  assert.equal(premioTreinador([{ level: 5 }, { level: 7 }]), 240);
  assert.equal(bolaPorNivel(10), 'poke-ball');
  assert.equal(bolaPorNivel(20), 'great-ball');
  assert.equal(bolaPorNivel(45), 'ultra-ball');
});

test('treinadorLancaBola: só com HP ≤ metade, com bola sobrando, 60% das vezes', () => {
  assert.equal(treinadorLancaBola(50, 100, 3, 0.5), true);
  assert.equal(treinadorLancaBola(51, 100, 3, 0.5), false); // acima da metade nunca
  assert.equal(treinadorLancaBola(10, 100, 0, 0.1), false); // sem bola
  assert.equal(treinadorLancaBola(10, 100, 3, 0.6), false); // passou dos 60%
});

test('valorCaptura: fórmula da Gen 3/4 (HP baixo, bola e status aumentam)', () => {
  assert.equal(valorCaptura(100, 100, 45, 1, null), 15);        // HP cheio: taxa/3
  assert.equal(valorCaptura(1, 100, 45, 1, null), 44);          // quase desmaiado
  assert.equal(valorCaptura(1, 100, 45, 1, 'sleep'), 88);       // sono ×2
  assert.equal(valorCaptura(1, 100, 45, 1.5, 'paralysis'), 100); // Great Ball + paralisia: floor(67,05)=67 × 1,5
  assert.ok(valorCaptura(1, 100, 255, 1.5, null) >= 255);       // espécie comum com Great Ball: garantida
});

test('chancePorBalanco / balancosDaCaptura', () => {
  assert.equal(chancePorBalanco(255), 1);
  assert.ok(Math.abs(chancePorBalanco(44) - 43690 / 65536) < 1e-9);
  assert.ok(chancePorBalanco(10) < chancePorBalanco(100));
  assert.ok(chancePorBalanco(0) > 0); // a = 0 não divide por zero
  assert.equal(balancosDaCaptura(255, () => 0.999), 4); // garantida ignora o dado
  assert.equal(balancosDaCaptura(44, () => 0), 4);
  assert.equal(balancosDaCaptura(44, () => 0.99), 0);
  const seq = [0, 0, 0.99]; let i = 0;
  assert.equal(balancosDaCaptura(44, () => seq[i++]), 2); // para no primeiro balanço que falha
});

test('ordenarAcoes: prioridade > velocidade > sorteio, sem mutar a lista', () => {
  const acoes = [{ id: 'lento', prio: 0, vel: 10 }, { id: 'rapido', prio: 0, vel: 90 }, { id: 'bola', prio: 99, vel: 0 }, { id: 'quick', prio: 1, vel: 5 }];
  assert.deepEqual(ordenarAcoes(acoes).map(a => a.id), ['bola', 'quick', 'rapido', 'lento']);
  assert.equal(acoes[0].id, 'lento');
  const seq = [0.9, 0.1]; let i = 0; // empate: menor sorteio vai primeiro
  assert.deepEqual(ordenarAcoes([{ id: 'a', prio: 0, vel: 50 }, { id: 'b', prio: 0, vel: 50 }], () => seq[i++]).map(a => a.id), ['b', 'a']);
});

test('ordenarAcoes: Garra Rápida (rapido) fura a velocidade DENTRO da mesma prioridade, mas não a prioridade maior', () => {
  const acoes = [{ id: 'lento-rapido', prio: 0, vel: 10, rapido: true }, { id: 'veloz-normal', prio: 0, vel: 200 }, { id: 'prioridade', prio: 1, vel: 1 }];
  assert.deepEqual(ordenarAcoes(acoes).map(a => a.id), ['prioridade', 'lento-rapido', 'veloz-normal'], 'rapido vence dentro da prioridade, mas nunca fura quem tem prioridade maior');
  // os dois com Garra Rápida: a velocidade ainda desempata entre eles
  const dois = [{ id: 'a', prio: 0, vel: 10, rapido: true }, { id: 'b', prio: 0, vel: 90, rapido: true }];
  assert.deepEqual(ordenarAcoes(dois).map(a => a.id), ['b', 'a']);
});

test('ativouQuickClaw: só com o item, 20% de chance', () => {
  const m = { item: 'quick-claw' };
  assert.equal(CHANCE_QUICK_CLAW, 0.2);
  assert.equal(ativouQuickClaw(m, 0.1), true);
  assert.equal(ativouQuickClaw(m, 0.2), false, 'no limite, não ativa (< estrito)');
  assert.equal(ativouQuickClaw(m, 0.99), false);
  assert.equal(ativouQuickClaw({ item: 'leftovers' }, 0.1), false, 'item errado');
  assert.equal(ativouQuickClaw({}, 0.1), false, 'sem item');
});

test('ordenarAcoes: Stall (lento) sempre por ÚLTIMO dentro da própria prioridade', () => {
  const acoes = [{ id: 'normal', prio: 0, vel: 50 }, { id: 'devagar', prio: 0, vel: 200, lento: true }, { id: 'prioridade-lenta', prio: 1, vel: 1, lento: true }];
  assert.deepEqual(ordenarAcoes(acoes).map(a => a.id), ['prioridade-lenta', 'normal', 'devagar']);
});

test('ativouQuickClaw: Quick Draw (habilidade) — 30%, sem precisar de item', () => {
  assert.equal(CHANCE_QUICK_DRAW, 0.3);
  assert.equal(ativouQuickClaw({ ability: 'quick-draw' }, 0.2), true);
  assert.equal(ativouQuickClaw({ ability: 'quick-draw' }, 0.3), false);
  assert.equal(ativouQuickClaw({ ability: 'stall' }, 0.1), false, 'Stall não é Quick Draw');
});

test('sempreUltimo: só quem tem Stall', () => {
  assert.equal(sempreUltimo({ ability: 'stall' }), true);
  assert.equal(sempreUltimo({ ability: 'none' }), false);
  assert.equal(sempreUltimo({}), false);
});

test('prioridadeEfetiva: Prankster (+1 status), Gale Wings (+1 Voador com HP cheio), Triage (+3 cura), soma com a prioridade nativa', () => {
  const status = golpe({ cls: 'status', priority: 0 });
  assert.equal(prioridadeEfetiva({ ability: 'prankster' }, status), 1);
  assert.equal(prioridadeEfetiva({ ability: 'none' }, status), 0);
  const voador = golpe({ cls: 'physical', type: 'flying', priority: 0 });
  assert.equal(prioridadeEfetiva({ ability: 'gale-wings', hp: 100, stats: { hp: 100 } }, voador), 1);
  assert.equal(prioridadeEfetiva({ ability: 'gale-wings', hp: 50, stats: { hp: 100 } }, voador), 0, 'só com HP cheio');
  const cura = golpe({ cls: 'status', priority: 0, meta: { heal: 50 } });
  assert.equal(prioridadeEfetiva({ ability: 'triage' }, cura), 3);
  const rapido = golpe({ cls: 'status', priority: 1 });
  assert.equal(prioridadeEfetiva({ ability: 'prankster' }, rapido), 2);
});

test('golpeDaConversaoDeTipo: Aerilate reforça Normal→Voador; Normalize converte QUALQUER tipo sem reforçar', () => {
  const normal = golpe({ name: 'tackle', type: 'normal', power: 40 });
  const aero = golpeDaConversaoDeTipo(normal, mon({ ability: 'aerilate' }));
  assert.equal(aero.type, 'flying'); assert.equal(aero.power, Math.floor(40 * 1.3));
  const fogo = golpe({ name: 'ember', type: 'fire', power: 40 });
  assert.equal(golpeDaConversaoDeTipo(fogo, mon({ ability: 'aerilate' })).type, 'fire', 'só converte golpe Normal');
  const norm = golpeDaConversaoDeTipo(fogo, mon({ ability: 'normalize' }));
  assert.equal(norm.type, 'normal'); assert.equal(norm.power, 40, 'Normalize não reforça poder');
  assert.equal(golpeDaConversaoDeTipo(normal, mon()).type, 'normal', 'sem a habilidade, nada muda');
});

test('chanceAcerto: Tangled Feet dobra a evasão só quando o alvo está confuso', () => {
  const atacante = mon(), alvo = mon({ ability: 'tangled-feet' });
  const semConf = chanceAcerto(golpe({ acc: 100 }), atacante, alvo);
  alvo.vol.conf = 2;
  assert.equal(chanceAcerto(golpe({ acc: 100 }), atacante, alvo), semConf * 0.5);
  const semHab = mon(); semHab.vol.conf = 2;
  assert.equal(chanceAcerto(golpe({ acc: 100 }), atacante, semHab), semConf, 'confuso sem a habilidade não muda nada');
});

test('calcDamage: Tough Claws (contato), Mega Launcher (pulse) e Punk Rock (som) multiplicam por FLAG do golpe, não por classe', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const agua = { data: { base: { hp: 100 }, types: ['water'] } };   // tipo neutro aos golpes de teste, sem STAB
  const base = calcDamage(mon(agua), mon(agua), golpe({ name: 'tackle', type: 'normal' })).dmg;
  assert.equal(base, 46);
  assert.equal(calcDamage(mon({ ...agua, ability: 'tough-claws' }), mon(agua), golpe({ name: 'tackle', type: 'normal' })).dmg, 59);
  // Earthquake é físico mas NÃO tem a flag contact — Tough Claws não pega
  assert.equal(calcDamage(mon({ ...agua, ability: 'tough-claws' }), mon(agua), golpe({ name: 'earthquake', type: 'ground' })).dmg, base);
  assert.equal(calcDamage(mon({ ...agua, ability: 'mega-launcher' }), mon(agua), golpe({ name: 'dragon-pulse', type: 'dragon' })).dmg, 69);
  assert.equal(calcDamage(mon({ ...agua, ability: 'punk-rock' }), mon(agua), golpe({ name: 'hyper-voice', type: 'normal', cls: 'special' })).dmg, 59);
  assert.equal(calcDamage(mon(agua), mon({ ...agua, ability: 'punk-rock' }), golpe({ name: 'hyper-voice', type: 'normal', cls: 'special' })).dmg, 23);
});

test('melhorGolpe: dano esperado (poder × eficácia × STAB), ignora sem PP', () => {
  const g = (name, type, power, o = {}) => ({ name, type, power, cls: 'physical', ppLeft: 5, ...o });
  const moves = [g('tackle', 'normal', 40), g('ember', 'fire', 40), g('water-gun', 'water', 40)];
  assert.equal(melhorGolpe(moves, ['fire'], ['grass']).name, 'ember');      // super efetivo + STAB
  assert.equal(melhorGolpe(moves, ['normal'], ['rock']).name, 'water-gun'); // Normal é pouco efetivo em Pedra
  assert.equal(melhorGolpe([g('growl', 'normal', null, { cls: 'status' }), g('tackle', 'normal', 40)], [], ['normal']).name, 'tackle');
  assert.equal(melhorGolpe([g('ember', 'fire', 40, { ppLeft: 0 })], ['fire'], ['grass']), null);
});

test('amizade: petisco certo enche rápido, errado quase nada; limite de nível', () => {
  assert.equal(ganhoAmizade(['fire', 'dragon'], ['fire'], 0), 20);
  assert.equal(ganhoAmizade(['fire', 'dragon'], ['water', 'dragon'], 0.999), 35); // basta um dos tipos
  assert.equal(ganhoAmizade(['fire'], ['water'], 0.999), 5);
  assert.equal(ganhoAmizade(['fire'], ['water'], 0), 0);
  assert.equal(Math.ceil(AMIZADE_MAX / 35), 3); // no melhor caso, 3 petiscos; no pior, 5
  assert.equal(Math.ceil(AMIZADE_MAX / 20), 5);
  assert.equal(podeFazerAmizade(15, 10), true);
  assert.equal(podeFazerAmizade(16, 10), false);
  // lendário/mítico (só aparecem soltos no Santuário): aceitam petisco, mas confiam ~4× mais devagar
  assert.equal(ganhoAmizade(['fire'], ['fire'], 0, true), Math.floor(20 / DIVISOR_AMIZADE_LENDARIO));
  assert.equal(ganhoAmizade(['fire'], ['water'], 0.3, true), 1);  // ganho pequeno nunca vira 0: pareceria não funcionar
  assert.equal(ganhoAmizade(['fire'], ['water'], 0, true), 0);    // mas o que já era 0 continua 0
  assert.ok(Math.ceil(AMIZADE_MAX / ganhoAmizade(['fire'], ['fire'], 0.999, true)) >= 12); // mais de uma dezena de ofertas
  assert.equal(MAX_ALIADOS, 2);
});

test('custoCentroEquipe: só paga quem precisa de cura', () => {
  const golpes = () => [{ pp: 10, ppLeft: 10 }];
  const sao = mon({ moves: golpes(), level: 10 }), ferido = mon({ moves: golpes(), level: 20, hp: 1 });
  assert.equal(custoCentroEquipe([sao]), 0);
  assert.equal(custoCentroEquipe([sao, ferido]), custoCentro(20));
  assert.equal(custoCentroEquipe([ferido, { ...ferido }]), 2 * custoCentro(20));
});

test('custoComDesconto: 10% por vitória, grátis a partir de 10, nunca negativo', () => {
  assert.equal(custoComDesconto(500, 0, 0.1), 500);
  assert.equal(custoComDesconto(500, 3, 0.1), 350);
  assert.equal(custoComDesconto(500, 10, 0.1), 0);
  assert.equal(custoComDesconto(500, 15, 0.1), 0);
  assert.equal(custoComDesconto(150, 1, 0.1), 135);
  assert.equal(custoComDesconto(133, 1, 0.1), 120); // arredonda (119,7 → 120)
  assert.equal(custoComDesconto(125, 2, 0.1), 100);
});

test('itemTemEfeito: só em quem se beneficia, nunca em desmaiado', () => {
  const golpes = (ppLeft = 10) => [{ pp: 10, ppLeft }];
  const cheio = mon({ moves: golpes() }), ferido = mon({ moves: golpes(), hp: 40 }), caido = mon({ moves: golpes(), hp: 0 });
  assert.equal(itemTemEfeito({ heal: 20 }, cheio), false);
  assert.equal(itemTemEfeito({ heal: 20 }, ferido), true);
  assert.equal(itemTemEfeito({ heal: 20 }, caido), false); // Potion não revive
  assert.equal(itemTemEfeito({ healPct: 50 }, caido), false);
  // cura em % e Full Restore (HP + status)
  const doente = { ...cheio, status: 'burn' };
  assert.equal(itemTemEfeito({ healPct: 50 }, cheio), false);
  assert.equal(itemTemEfeito({ healPct: 50 }, ferido), true);
  assert.equal(itemTemEfeito({ healPct: 100, cure: 'all' }, doente), true);
  assert.equal(itemTemEfeito({ healPct: 100, cure: 'all' }, cheio), false);
  assert.equal(itemTemEfeito({ cure: ['poison'] }, mon({ moves: golpes(), status: 'poison' })), true);
  assert.equal(itemTemEfeito({ cure: ['poison'] }, mon({ moves: golpes(), status: 'burn' })), false);
  assert.equal(itemTemEfeito({ cure: 'all' }, mon({ moves: golpes(), status: 'burn' })), true);
  assert.equal(itemTemEfeito({ ether: 10 }, mon({ moves: golpes(3) })), true);
  assert.equal(itemTemEfeito({ ether: 10 }, cheio), false);
  assert.equal(itemTemEfeito({ candy: true }, cheio), true);
  assert.equal(itemTemEfeito({ candy: true }, cheio, false), false); // aliado sem curva de XP
  assert.equal(itemTemEfeito({ candy: true }, mon({ moves: golpes(), level: 100 })), false);
});

test('zonaLiberada e chefe (Alfa)', () => {
  assert.equal(zonaLiberada({ libera: 8 }, 7), false);
  assert.equal(zonaLiberada({ libera: 8 }, 8), true);
  assert.equal(zonaLiberada({}, 1), true); // sem `libera` = aberta
  assert.deepEqual(statsDeChefe({ hp: 30, attack: 20, speed: 11 }), { hp: 60, attack: 26, speed: 14 });
  assert.equal(premioChefe(10), 600);
});

test('missões: progresso de cada tipo de condição, nunca passa do alvo', () => {
  const S = { wins: 7, treinadoresVencidos: 1, player: { level: 12 }, chefes: { rota1: true }, missoesFeitas: ['a'],
    registro: { derrotados: { pidgey: 2 }, amigos: { rattata: 1, zubat: 2 } } };
  assert.deepEqual(progressoCondicao({ derrotar: 'pidgey', qtd: 5 }, S), { atual: 2, alvo: 5, ok: false });
  assert.deepEqual(progressoCondicao({ derrotar: 'onix', qtd: 1 }, S), { atual: 0, alvo: 1, ok: false });
  assert.deepEqual(progressoCondicao({ vitorias: 3 }, S), { atual: 3, alvo: 3, ok: true });
  assert.equal(progressoCondicao({ amigos: 3 }, S).ok, true); // soma todas as espécies
  assert.equal(progressoCondicao({ nivel: 15 }, S).ok, false);
  assert.equal(progressoCondicao({ chefe: 'rota1' }, S).ok, true);
  assert.equal(progressoCondicao({ chefe: 'floresta' }, S).ok, false);
  assert.equal(progressoCondicao({ treinadores: 3 }, S).atual, 1);
  assert.equal(progressoCondicao({ missao: 'a' }, S).ok, true);
  assert.equal(progressoCondicao({}, { player: { level: 1 } }).ok, false); // condição desconhecida nunca conclui
});

/* `alvos` = a missão de espécie do editor de rotas, que pode pedir mais de uma espécie ("8 Plusle e 8 Minun").
   O ponto delicado é o TETO POR ESPÉCIE: sem ele, matar 20 Plusle fecharia a missão sozinho e a segunda espécie
   seria decoração. */
test('missões com várias espécies: cada uma tem o próprio teto, e `qualquer` revela a missão', () => {
  const S = n => ({ player: { level: 5 }, registro: { derrotados: n } });
  const obj = { alvos: [['plusle', 8], ['minun', 8]] };
  assert.deepEqual(progressoCondicao(obj, S({})), { atual: 0, alvo: 16, ok: false });
  assert.deepEqual(progressoCondicao(obj, S({ plusle: 8 })), { atual: 8, alvo: 16, ok: false });
  // 20 Plusle e nenhum Minun continua 8/16: o excedente de uma espécie não paga a outra
  assert.deepEqual(progressoCondicao(obj, S({ plusle: 20 })), { atual: 8, alvo: 16, ok: false });
  assert.deepEqual(progressoCondicao(obj, S({ plusle: 8, minun: 8 })), { atual: 16, alvo: 16, ok: true });
  assert.deepEqual(progressoCondicao(obj, S({ plusle: 99, minun: 99 })), { atual: 16, alvo: 16, ok: true });
  // o `libera` da missão: ver UM dos dois já basta (exigir os dois esconderia a missão por azar no sorteio)
  const lib = { alvos: [['plusle', 1], ['minun', 1]], qualquer: 1 };
  assert.equal(progressoCondicao(lib, S({})).ok, false);
  assert.equal(progressoCondicao(lib, S({ minun: 1 })).ok, true);
  // uma espécie só também passa por aqui (o editor sempre gera `alvos`, nunca `derrotar`)
  assert.deepEqual(progressoCondicao({ alvos: [['rattata', 24]] }, S({ rattata: 24 })), { atual: 24, alvo: 24, ok: true });
});

test('missões de dinheiro, gasto e evolução', () => {
  const S = { money: 2500, gasto: 900, player: { level: 5 }, registro: { evolucoes: { ivysaur: 1 } } };
  assert.equal(progressoCondicao({ dinheiro: 2000 }, S).ok, true);
  assert.equal(progressoCondicao({ dinheiro: 2000 }, { ...S, money: 1999 }).ok, false); // gastar faz cair
  assert.deepEqual(progressoCondicao({ gasto: 1000 }, S), { atual: 900, alvo: 1000, ok: false });
  assert.equal(progressoCondicao({ gasto: 1000 }, { player: { level: 1 } }).atual, 0); // save antigo sem S.gasto
  assert.equal(progressoCondicao({ evolucoes: 1 }, S).ok, true);
});

test('golpeDoAliado: cada ordem escolhe o golpe certo', () => {
  const g = (name, type, power, cls = 'physical', ppLeft = 5) => ({ name, type, power, cls, ppLeft });
  const moves = [g('tackle', 'normal', 40), g('ember', 'fire', 40), g('flamethrower', 'fire', 90), g('growl', 'normal', null, 'status')];
  assert.equal(golpeDoAliado('livre', moves, ['fire'], ['grass']).golpe.name, 'flamethrower');
  assert.equal(golpeDoAliado(undefined, moves, ['fire'], ['grass']).golpe.name, 'flamethrower'); // sem ordem = livre
  assert.equal(golpeDoAliado('fraco', moves, ['fire'], ['grass']).golpe.name, 'tackle');       // menor poder (empate: o 1º)
  assert.equal(golpeDoAliado('status', moves, ['fire'], ['grass']).golpe.name, 'growl');
  assert.ok(golpeDoAliado('status', [g('ember', 'fire', 40)], ['fire'], ['grass']).parado);       // sem status: espera
  assert.ok(golpeDoAliado('parado', moves, ['fire'], ['grass']).parado);
  assert.ok(golpeDoAliado('fora', moves, ['fire'], ['grass']).parado);
  assert.equal(golpeDoAliado('livre', [g('ember', 'fire', 40, 'physical', 0)], ['fire'], ['grass']).golpe, null); // sem PP → Struggle
});

test('golpeDoAliado: travado (Faixa/Óculos/Lenço Escolha) ignora a ordem e repete o mesmo golpe', () => {
  const g = (name, type, power, cls = 'physical', ppLeft = 5) => ({ name, type, power, cls, ppLeft });
  const moves = [g('tackle', 'normal', 40), g('flamethrower', 'fire', 90)];
  // mesmo pedindo "livre" (que escolheria flamethrower por dano), travado força tackle
  assert.equal(golpeDoAliado('livre', moves, ['fire'], ['grass'], undefined, 'tackle').golpe.name, 'tackle');
  // travado sem PP: null (vira Struggle, não escapa pra outro golpe)
  const semPP = [g('tackle', 'normal', 40, 'physical', 0), g('flamethrower', 'fire', 90)];
  assert.equal(golpeDoAliado('livre', semPP, ['fire'], ['grass'], undefined, 'tackle').golpe, null);
  // parado/fora continuam valendo mais que a trava (aliado descansando não ataca de jeito nenhum)
  assert.ok(golpeDoAliado('parado', moves, ['fire'], ['grass'], undefined, 'tackle').parado);
});

test('situacaoMissoes: escondida até liberar, pronta quando cumpre, feita some da lista', () => {
  const M = [
    { id: 'a', objetivo: { vitorias: 1 } },
    { id: 'b', libera: { derrotar: 'zubat', qtd: 1 }, objetivo: { derrotar: 'zubat', qtd: 5 } },
    { id: 'c', libera: { missao: 'a' }, objetivo: { vitorias: 10 } }
  ];
  let s = situacaoMissoes(M, { wins: 0, player: { level: 5 } });
  assert.deepEqual([s.ativas.map(x => x.m.id), s.prontas.length, s.escondidas], [['a'], 0, 2]);
  s = situacaoMissoes(M, { wins: 1, player: { level: 5 }, registro: { derrotados: { zubat: 1 } } });
  assert.deepEqual([s.ativas.map(x => x.m.id), s.prontas.map(x => x.m.id), s.escondidas], [['b'], ['a'], 1]);
  s = situacaoMissoes(M, { wins: 1, player: { level: 5 }, missoesFeitas: ['a'] });
  assert.deepEqual([s.ativas.map(x => x.m.id), s.feitas, s.escondidas], [['c'], 1, 1]);
});

test('desmaioPrecisaRevive: 3 livres no Médio+, ilimitado no Fácil', () => {
  assert.equal(desmaioPrecisaRevive(3, 3), false);
  assert.equal(desmaioPrecisaRevive(4, 3), true);
  assert.equal(desmaioPrecisaRevive(99, null), false);
  assert.equal(itemTemEfeito({ revive: true }, mon({ hp: 0 })), true);   // Revive só em desmaiado
  assert.equal(itemTemEfeito({ revive: true }, mon({ hp: 10 })), false);
});

test('estatisticasDaJornada + pontuacao', () => {
  const S = { wins: 12, treinadoresVencidos: 2, chefes: { rota1: true, floresta: true }, missoesFeitas: ['a', 'b', 'c'], tempoMs: 90000,
    especieInicial: 'charmander', player: { level: 16, shiny: true, data: { speciesName: 'charmeleon' } },
    registro: { derrotados: { pidgey: 4, rattata: 6 }, amigos: { pidgey: 1 }, evolucoes: { charmeleon: 1 } } };
  const e = estatisticasDaJornada({ ...S, money: 800, maxDinheiro: 1500, gasto: 400 });
  const { registro, ...numeros } = e;
  assert.deepEqual(numeros, { especie: 'charmander', especieFinal: 'charmeleon', nivel: 16, vitorias: 12, derrotados: 10, treinadores: 2,
    alfas: 2, amigos: 1, evolucoes: 1, missoes: 3, capturas: 0, ovosChocados: 0, gen: 1, gens: 0, tempoMs: 90000, shiny: true,
    continuacoes: 0, campeaoDe: [], semVantagens: false, semCentro: true,
    maxDinheiro: 1500, gasto: 400, shiniesVistos: 0, shiniesAmigos: 0 });
  assert.deepEqual(registro.derrotados, { pidgey: 4, rattata: 6 });
  registro.derrotados.pidgey = 99; assert.equal(S.registro.derrotados.pidgey, 4); // é cópia, não referência
  // 16×100 + 12×10 + 2×50 + 2×300 + 1×100 + 1×150 + 3×120 = 1600+120+100+600+100+150+360 = 3030
  assert.equal(pontuacao(e), 3030);
  assert.equal(pontuacao(e, 2), 6060); // Hardcore vale o dobro
  // save antigo sem especieInicial: usa a espécie atual
  assert.equal(estatisticasDaJornada({ player: { level: 5, data: { speciesName: 'mudkip' } } }).especie, 'mudkip');
  // cada Gen fechada vale 2000
  const g2 = estatisticasDaJornada({ ...S, gen: 3, gensVencidas: [1, 2] });
  assert.deepEqual([g2.gen, g2.gens], [3, 2]);
  assert.equal(pontuacao(g2), 3030 + 4000);
});

test('caminhoNaArvore: acha o caminho da raiz até o nó, ou null sem o nó', () => {
  const arvore = { name: 'weedle', to: [{ name: 'kakuna', to: [{ name: 'beedrill', to: [] }] }] };
  assert.deepEqual(caminhoNaArvore(arvore, 'weedle'), ['weedle']);
  assert.deepEqual(caminhoNaArvore(arvore, 'kakuna'), ['weedle', 'kakuna']);
  assert.deepEqual(caminhoNaArvore(arvore, 'beedrill'), ['weedle', 'kakuna', 'beedrill']);
  assert.equal(caminhoNaArvore(arvore, 'pikachu'), null);
  assert.equal(caminhoNaArvore(null, 'weedle'), null);
  // ramifica (ex.: Eevee): acha o nó em qualquer galho
  const eevee = { name: 'eevee', to: [{ name: 'vaporeon', to: [] }, { name: 'jolteon', to: [] }] };
  assert.deepEqual(caminhoNaArvore(eevee, 'jolteon'), ['eevee', 'jolteon']);
});

test('especiesShinyDoJogador: bug corrigido 27/09/2026 — shiny do jogador desbloqueia a espécie inicial e toda forma até a atual', () => {
  // não é shiny: nada a desbloquear
  assert.deepEqual(especiesShinyDoJogador({ player: { shiny: false, data: { speciesName: 'weedle' } } }), []);
  // shiny, COM a árvore carregada (S.meta.evo): a cadeia inteira até a espécie atual
  const arvore = { name: 'weedle', to: [{ name: 'kakuna', to: [{ name: 'beedrill', to: [] }] }] };
  const S1 = { especieInicial: 'weedle', player: { shiny: true, data: { speciesName: 'beedrill' } }, meta: { evo: arvore } };
  assert.deepEqual(especiesShinyDoJogador(S1), ['weedle', 'kakuna', 'beedrill']);
  // shiny, SEM a árvore (evoPendente/offline): melhor esforço, só as duas pontas
  const S2 = { especieInicial: 'weedle', player: { shiny: true, data: { speciesName: 'beedrill' } } };
  assert.deepEqual(especiesShinyDoJogador(S2), ['weedle', 'beedrill']);
  // ainda na espécie inicial: uma entrada só, sem repetir
  const S3 = { especieInicial: 'weedle', player: { shiny: true, data: { speciesName: 'weedle' } } };
  assert.deepEqual(especiesShinyDoJogador(S3), ['weedle']);
});

test('situacaoMissoes: missão de outro mapa (gen) nem aparece', () => {
  const M = [{ id: 'k', gen: 1, objetivo: { vitorias: 1 } }, { id: 'todas', objetivo: { vitorias: 1 } }];
  const ids = S => situacaoMissoes(M, { wins: 0, player: { level: 5 }, ...S }).ativas.map(x => x.m.id);
  assert.deepEqual(ids({}), ['k', 'todas']);          // save sem gen = Gen 1
  assert.deepEqual(ids({ gen: 2 }), ['todas']);
});

test('escolhaIA: pensa conforme a esperteza, e sem PP devolve null (Struggle)', () => {
  const g = (name, type, power, ppLeft = 5) => ({ name, type, power, cls: 'physical', ppLeft });
  const moves = [g('tackle', 'normal', 40), g('ember', 'fire', 40), g('flamethrower', 'fire', 90)];
  // sorte baixa = "pensou": pega o de maior dano esperado contra Planta
  assert.equal(escolhaIA(moves, ['fire'], ['grass'], 0.9, () => 0).name, 'flamethrower');
  // sorte alta = chutou: cai no sorteio (o índice sai do mesmo `sorte`)
  assert.equal(escolhaIA(moves, ['fire'], ['grass'], 0.5, () => 0.99).name, 'flamethrower'); // 0.99×3 = índice 2
  assert.equal(escolhaIA(moves, ['fire'], ['grass'], 0, () => 0).name, 'tackle');            // nunca pensa: índice 0
  assert.equal(escolhaIA([g('tackle', 'normal', 40, 0)], ['normal'], ['normal']), null);     // sem PP
  assert.ok(ESPERTEZA.selvagem < ESPERTEZA.treinador && ESPERTEZA.treinador < ESPERTEZA.chefe);
});

test('formatarTempo', () => {
  assert.equal(formatarTempo(30000), 'menos de 1 min');
  assert.equal(formatarTempo(12 * 60000), '12 min');
  assert.equal(formatarTempo(65 * 60000), '1h 05min');
});

test('ehShiny: 1 em 4096', () => {
  assert.equal(CHANCE_SHINY, 1 / 4096);
  assert.equal(ehShiny(0), true);
  assert.equal(ehShiny(1 / 4096), false);
  assert.equal(ehShiny(0.5), false);
});

test('ganhoDeEVs: teto de 252 por atributo e 510 no total, sem mutar', () => {
  const evs = zeros(); evs.attack = 251;
  assert.deepEqual(ganhoDeEVs(evs, { attack: 2, speed: 1 }), [['attack', 1], ['speed', 1]]);
  assert.equal(evs.attack, 251);
  const quase = { ...zeros(), attack: 252, defense: 252, speed: 5 }; // 509
  assert.deepEqual(ganhoDeEVs(quase, { speed: 3, hp: 3 }), [['speed', 1]]);
  assert.deepEqual(ganhoDeEVs(zeros(), {}), []);
});

test('pontuação: seguir com o mesmo Pokémon pro mapa seguinte custa 20% por vez', () => {
  // fechar a Gen ENCERRA a jornada por padrão; continuar é a alternativa, e é mais fácil (você chega forte no mapa
  // novo), então vale menos no ranking. O SQL de validar_jornada faz a mesma conta.
  const est = { nivel: 50, vitorias: 100, gens: 1 };
  const cheia = pontuacao(est, 1);
  assert.equal(pontuacao({ ...est, continuacoes: 0 }, 1), cheia);
  assert.equal(pontuacao({ ...est, continuacoes: 1 }, 1), Math.round(cheia * 0.8));
  assert.equal(pontuacao({ ...est, continuacoes: 2 }, 1), Math.round(cheia * 0.64));
  assert.equal(multContinuacao(10), PENAL_MINIMO, 'tem piso: nunca zera a pontuação de quem jogou');
  assert.equal(multContinuacao(undefined), 1);
});

test('rota esgotada: anti-grind, e SÓ no Roguelike', () => {
  const z = { max: 30 };                                   // rota alta: manda o DOBRO (60), maior que 30+15
  assert.equal(rotaEsgotada(z, 60, 'roguelike'), false, 'no limite ainda dá');
  assert.equal(rotaEsgotada(z, 61, 'roguelike'), true, 'passou do dobro: acabou a caçada');
  assert.equal(rotaEsgotada(z, 99, 'hard'), false, 'fora do Roguelike a rota velha continua valendo');
  assert.equal(rotaEsgotada(z, 99, 'easy'), false);
  assert.equal(rotaEsgotada(null, 99, 'roguelike'), false);
  assert.equal(FATOR_ESGOTADA, 2);
});

/* Bug real: na Rota 1 (teto 6) o dobro dava 12, e como a jornada começa no nível 5, a rota se esgotava antes de
   dar pra completar as missões dela — "derrote 10 Pidgey" ficava impossível e a run travava. O piso de folga
   existe pra isso, e só muda rota de teto baixo. */
test('rota de nível baixo tem folga mínima pras missões dela', () => {
  const rota1 = { max: 6 };
  assert.equal(limiteDaRota(rota1), 6 + MARGEM_ESGOTADA, 'teto pequeno: manda a margem, não o dobro');
  assert.equal(rotaEsgotada(rota1, 12, 'roguelike'), false, 'o dobro sozinho travava a run aqui');
  assert.equal(rotaEsgotada(rota1, 21, 'roguelike'), false);
  assert.equal(rotaEsgotada(rota1, 22, 'roguelike'), true, 'passou da folga: aí sim esgota');
  // o ponto em que os dois critérios se encontram: daí pra cima, quem manda é o dobro
  assert.equal(limiteDaRota({ max: MARGEM_ESGOTADA }), MARGEM_ESGOTADA * FATOR_ESGOTADA);
  assert.equal(limiteDaRota({ max: 40 }), 80, 'rota alta não ganha folga extra');
});

/* Flags de golpe de verdade (js/dados-golpe-flags.js, gerado do repositório-fonte da PokéAPI — a API pública não
   expõe isso, ver a nota "BACKLOG — dado de golpe" no CLAUDE.md). */
test('dados-golpe-flags: cobertura substancial, sem flag inventada, sem repetição', () => {
  const nomes = Object.keys(GOLPE_FLAGS);
  assert.ok(nomes.length > 500, `só ${nomes.length} golpes mapeados — a geração pode ter falhado`);
  for (const nome of nomes) {
    assert.match(nome, /^[a-z0-9]+(-[a-z0-9]+)*$/, `"${nome}" não parece um nome de golpe kebab-case`);
    const flags = GOLPE_FLAGS[nome];
    assert.ok(flags.length > 0, `${nome}: entrada vazia (não deveria existir)`);
    assert.equal(new Set(flags).size, flags.length, `${nome}: flag repetida`);
    for (const f of flags) assert.ok(FLAGS_VALIDAS.includes(f), `${nome}: flag "${f}" fora das 21 conhecidas`);
  }
});

test('temFlag: casos reais conhecidos (contato, som, bala) e golpe fora da tabela nunca tem flag', () => {
  assert.equal(temFlag({ name: 'tackle' }, 'contact'), true);
  assert.equal(temFlag({ name: 'earthquake' }, 'contact'), false, 'Earthquake é físico mas NÃO encosta');
  assert.equal(temFlag({ name: 'hyper-voice' }, 'sound'), true);
  assert.equal(temFlag({ name: 'tackle' }, 'sound'), false);
  assert.equal(temFlag({ name: 'bullet-seed' }, 'ballistics'), true);
  assert.equal(temFlag({ name: 'bullet-punch' }, 'ballistics'), false, 'Bullet Punch é soco, não é "bala"');
  assert.equal(temFlag({ name: 'golpe-que-nao-existe' }, 'contact'), false);
});

test('fazContato: usa a flag de verdade quando o golpe está mapeado; sem mapa, cai pro proxy antigo (cls físico)', () => {
  assert.equal(fazContato({ name: 'tackle', cls: 'physical' }), true);
  assert.equal(fazContato({ name: 'earthquake', cls: 'physical' }), false, 'físico, mas sem a flag contact de verdade');
  assert.equal(fazContato({ name: 'ember', cls: 'special' }), false);
  // golpe sem entrada na tabela: nunca deveria acontecer com golpe real do jogo, mas o plano B existe mesmo assim
  assert.equal(fazContato({ name: 'golpe-que-nao-existe', cls: 'physical' }), true, 'sem mapa: cai pro proxy antigo');
  assert.equal(fazContato({ name: 'golpe-que-nao-existe', cls: 'special' }), false);
});

/* 🤖 Auto-explorar (só admin): a estatística ao vivo e quando o laço tem de parar. O motivo importa — um laço
   que não para no fim da jornada continua clicando "explorar" depois do Game Over do Roguelike. */
test('auto-explorar: resumo de abates com porcentagem, do mais derrotado pro menos', () => {
  const r = resumoDeAbates({ bidoof: 3, starly: 1 });
  assert.equal(r.total, 4);
  assert.deepEqual(r.linhas.map(l => l.especie), ['bidoof', 'starly']);
  assert.equal(r.linhas[0].pct, 75);
  assert.equal(resumoDeAbates({}).total, 0);
  assert.deepEqual(resumoDeAbates({}).linhas, []);
});
test('auto-explorar: motivo de parar, na ordem de prioridade', () => {
  const base = { modo: 'explore', hp: 100, exploracoes: 0, teto: 500 };
  assert.equal(motivoDeParar(base), null);
  assert.equal(motivoDeParar({ ...base, achou: true }), 'achou');
  assert.equal(motivoDeParar({ ...base, achou: true, erro: true }), 'erro');
  assert.equal(motivoDeParar({ ...base, modo: 'end' }), 'saiu');       // jornada acabou
  assert.equal(motivoDeParar({ ...base, hp: 0 }), 'desmaiou');
  assert.equal(motivoDeParar({ ...base, modo: 'battle', hp: 1 }), null);
  assert.equal(motivoDeParar({ ...base, exploracoes: 500 }), 'teto');
  // achar o alvo ganha até do teto: a caçada terminou, não importa quantas explorações levou
  assert.equal(motivoDeParar({ ...base, achou: true, exploracoes: 999 }), 'achou');
});

/* "Antes de todos os golpes acabarem ele já tem que ir ao Centro repor" (pedido do usuário): o laço não pode
   descobrir que ficou sem PP batendo Struggle, que machuca quem usa. */
test('auto-explorar: repor PP antes de ficar sem golpe', () => {
  const mv = (pp, ppLeft) => ({ pp, ppLeft });
  assert.equal(precisaReporPP({ moves: [mv(20, 20), mv(20, 20), mv(10, 10), mv(5, 5)] }), false, 'cheio: segue jogando');
  assert.equal(precisaReporPP({ moves: [mv(20, 12), mv(20, 9), mv(10, 4), mv(5, 2)] }), false, 'meio: ainda dá');
  assert.equal(precisaReporPP({ moves: [mv(20, 3), mv(20, 2), mv(10, 1), mv(5, 1)] }), true, 'raspando em todos: repõe');
  assert.equal(precisaReporPP({ moves: [mv(20, 0), mv(20, 0), mv(10, 0), mv(5, 4)] }), true, 'sobrou um: repõe ANTES de acabar');
  assert.equal(precisaReporPP({ moves: [mv(20, 20), mv(0, 0)] }), true, 'golpe sem pp (Struggle) não conta como golpe de verdade');
  assert.equal(precisaReporPP({ moves: [] }), false);
  assert.equal(precisaReporPP(null), false);
  // e o laço para quando não dá pra repor (sem dinheiro pro Centro)
  assert.equal(motivoDeParar({ modo: 'explore', hp: 100, semPP: true, teto: 500 }), 'semPP');
  assert.equal(motivoDeParar({ modo: 'explore', hp: 0, semPP: true, teto: 500 }), 'desmaiou', 'desmaio vem antes');
});
