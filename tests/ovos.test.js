/* Ovos (js/ovos.js): cruzar no esconderijo e chocar andando.
   O que precisa ser à prova de erro: (1) a contagem de passos, porque um ovo é de 100 a 400 explorações e inflar ou
   travar a barra é perder tudo isso; (2) o par, que não pode se formar com quem não tem gênero; (3) os ovos das
   badges, que são a recompensa de 100 e de 1000 ovos chocados.
   Chance se testa FIXANDO o sorteio (CLAUDE.md), nunca por amostragem. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_OVOS, CHANCE_OVO, CICLOS_PADRAO, PASSOS_MIN, PASSOS_MAX, CICLOS_PSEUDO, CICLOS_LENDARIO, IVS_HERDADOS,
  ovos, acharPar, tentarCruzar, ivsHerdados, golpeHerdado, criarOvo, ovoDeBadge, andarOvos, tirarOvo, passosParaChocar
} from '../js/ovos.js';
import { STATS } from '../js/dados.js';

const mon = (nome, genero, ivs = {}, moves = []) => ({ name: nome, nick: '', genero, ivs: Object.fromEntries(STATS.map(s => [s, ivs[s] ?? 0])), moves, data: { speciesName: nome } });

test('passos saem dos ciclos de choco, entre o piso e o teto', () => {
  assert.equal(passosParaChocar(5), PASSOS_MIN, 'Magikarp (5 ciclos) cai no piso de 100 explorações');
  assert.equal(passosParaChocar(CICLOS_PSEUDO), 200, 'pseudo-lendário (40 ciclos)');
  assert.equal(passosParaChocar(CICLOS_LENDARIO), PASSOS_MAX, 'lendário (120 ciclos) bate no teto');
  assert.equal(passosParaChocar(undefined), passosParaChocar(CICLOS_PADRAO), 'sem o campo (mapa baixado antes dele existir) usa o padrão');
  assert.equal(passosParaChocar(0), passosParaChocar(CICLOS_PADRAO), '0 é dado ruim, não um ovo instantâneo');
});

test('par exige gênero oposto — sem gênero e save antigo nunca cruzam', () => {
  assert.equal(acharPar([mon('a', 'm'), mon('b', 'm')]), null, 'dois machos: nada');
  assert.equal(acharPar([mon('a', 'm'), mon('b', null)]), null, 'sem gênero: nada');
  assert.equal(acharPar([{ name: 'velho' }, { name: 'velho2' }]), null, 'save antigo (sem o campo): nada');
  assert.equal(acharPar([mon('a', 'm')]), null, 'sozinho: nada');
  const par = acharPar([mon('pai', 'm'), mon('mae', 'f')], () => 0);
  assert.equal(par.mae.name, 'mae');
  assert.equal(par.pai.name, 'pai', 'a mãe é sempre a fêmea, em qualquer ordem da lista');
});

test('cruzar respeita o teto de ovos e a chance', () => {
  const guardados = [mon('pai', 'm'), mon('mae', 'f')];
  const S = { ovos: [] };
  assert.equal(tentarCruzar(S, guardados, () => 0.99), null, 'sorteio acima da chance: não põe ovo');
  assert.ok(tentarCruzar(S, guardados, () => CHANCE_OVO - 0.001), 'sorteio abaixo da chance: põe');
  S.ovos = Array.from({ length: MAX_OVOS }, () => criarOvo({ especie: 'x', ciclos: 20 }));
  assert.equal(tentarCruzar(S, guardados, () => 0), null, `ninho cheio (${MAX_OVOS}) não aceita mais`);
});

test('IVs: 3 herdados pegam o melhor dos pais, os outros 3 são sorteados', () => {
  const mae = mon('m', 'f', Object.fromEntries(STATS.map(s => [s, 31])));
  const pai = mon('p', 'm', Object.fromEntries(STATS.map(s => [s, 7])));
  const ivs = ivsHerdados(mae, pai, () => 0);   // sorte fixa em 0: herda os 3 primeiros, o resto nasce 0
  assert.deepEqual(Object.keys(ivs).sort(), [...STATS].sort(), 'os 6 IVs existem');
  assert.equal(Object.values(ivs).filter(v => v === 31).length, IVS_HERDADOS, 'exatamente 3 vieram do melhor dos pais');
  assert.ok(Object.values(ivs).every(v => v >= 0 && v <= 31), 'nenhum IV fora da faixa');
});

test('golpe herdado é um dos do pai, e pai sem golpe não quebra', () => {
  const pai = mon('p', 'm', {}, [{ name: 'thunderbolt', pp: 15 }, { name: 'quick-attack', pp: 30 }]);
  assert.equal(golpeHerdado(pai, () => 0).name, 'thunderbolt');
  assert.equal(golpeHerdado(pai, () => 0.99).name, 'quick-attack');
  assert.equal(golpeHerdado(mon('p', 'm')), null);
});

test('andar conta exploração, trava no alvo e só devolve o que está pronto', () => {
  const S = { ovos: [criarOvo({ especie: 'dratini', ciclos: CICLOS_PSEUDO })] };
  const ovo = ovos(S)[0];
  assert.equal(ovo.alvo, 200);
  assert.deepEqual(andarOvos(S), [], 'um passo não choca nada');
  assert.equal(ovo.passos, 1);
  assert.deepEqual(andarOvos(S, 500).length, 1, 'passou do alvo: está pronto');
  assert.equal(ovo.passos, ovo.alvo, 'passos NUNCA passam do alvo — ovo pronto sem lugar pra nascer espera parado');
  assert.deepEqual(andarOvos(S).length, 1, 'continua pronto enquanto ninguém o chocar');
  assert.equal(tirarOvo(S, ovo), true);
  assert.equal(ovos(S).length, 0);
  assert.equal(tirarOvo(S, ovo), false, 'tirar duas vezes não tira outro ovo do ninho');
});

test('ovo de badge sorteia da lista e usa os ciclos do tipo', () => {
  const pseudo = ovoDeBadge('pseudo', ['dratini', 'beldum'], () => 0);
  assert.equal(pseudo.especie, 'dratini');
  assert.equal(pseudo.alvo, passosParaChocar(CICLOS_PSEUDO));
  assert.equal(pseudo.badge, 'pseudo');
  assert.equal(ovoDeBadge('lendario', ['mew'], () => 0).alvo, passosParaChocar(CICLOS_LENDARIO));
  assert.equal(ovoDeBadge('pseudo', []), null, 'lista vazia não vira ovo de espécie undefined');
});

test('a espécie do ovo fica guardada, nunca derivada do que a tela mostra', () => {
  const o = criarOvo({ especie: 'gible', ciclos: 40, de: ['Mãe', 'Pai'] });
  assert.equal(o.especie, 'gible');
  assert.equal(o.passos, 0);
  assert.deepEqual(o.de, ['Mãe', 'Pai']);
});
