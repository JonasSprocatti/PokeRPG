// Fórmulas de js/regras.js. Rodar: `node --test` (sem caminho) na raiz do projeto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  typeEff, natureMod, natureLabel, calcStats, recalc, freshVol, stageMul, effStat, defaultMoves,
  calcDamage, confDamage, heal, chanceAcerto, imuneAoStatus, danoResidual, consegueFugir,
  jogadorAgePrimeiro, xpPorVitoria, ganhoDeEVs, custoCentro, precisaCurar,
  premioTreinador, bolaPorNivel, treinadorLancaBola, valorCaptura, chancePorBalanco, balancosDaCaptura,
  CHANCE_SHINY, ehShiny, ordenarAcoes, melhorGolpe, ganhoAmizade, podeFazerAmizade, custoCentroEquipe,
  MAX_ALIADOS, AMIZADE_MAX, custoComDesconto, itemTemEfeito, zonaLiberada, statsDeChefe, premioChefe,
  progressoCondicao, situacaoMissoes, desmaioPrecisaRevive, estatisticasDaJornada, pontuacao, formatarTempo,
  golpeDoAliado, escolhaIA, ESPERTEZA, DIVISOR_AMIZADE_LENDARIO, multContinuacao, PENAL_MINIMO, rotaEsgotada, FATOR_ESGOTADA
} from '../js/regras.js';

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

test('xpPorVitoria: base × nível / 7, mínimo 1; de treinador ×1,5', () => {
  assert.equal(xpPorVitoria({ level: 7, data: { baseExp: 64 } }), 64);
  assert.equal(xpPorVitoria({ level: 2, data: { baseExp: 1 } }), 1);
  assert.equal(xpPorVitoria({ level: 7, data: { baseExp: 64 } }, true), 96);
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
    alfas: 2, amigos: 1, evolucoes: 1, missoes: 3, capturas: 0, gen: 1, gens: 0, tempoMs: 90000, shiny: true,
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
  const z = { max: 10 };
  assert.equal(rotaEsgotada(z, 20, 'roguelike'), false, 'no limite ainda dá');
  assert.equal(rotaEsgotada(z, 21, 'roguelike'), true, 'passou do dobro: acabou a caçada');
  assert.equal(rotaEsgotada(z, 99, 'hard'), false, 'fora do Roguelike a rota velha continua valendo');
  assert.equal(rotaEsgotada(z, 99, 'easy'), false);
  assert.equal(rotaEsgotada(null, 99, 'roguelike'), false);
  assert.equal(FATOR_ESGOTADA, 2);
});
