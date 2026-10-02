/* Ovos (js/ovos.js): cruzar no esconderijo e chocar andando.
   O que precisa ser à prova de erro: (1) a contagem de passos, porque um ovo é de 100 a 400 explorações e inflar ou
   travar a barra é perder tudo isso; (2) o par, que não pode se formar com quem não tem gênero; (3) os ovos das
   badges, que são a recompensa de 100 e de 1000 ovos chocados.
   Chance se testa FIXANDO o sorteio (CLAUDE.md), nunca por amostragem. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_OVOS, CHANCE_OVO, CICLOS_PADRAO, PASSOS_MIN, PASSOS_MAX, CICLOS_PSEUDO, CICLOS_LENDARIO, IVS_HERDADOS, GRUPO_SEM_OVO,
  ovos, acharPar, parCompativel, podeCruzar, ivsHerdados, golpeHerdado, criarOvo, ovoDeBadge, andarOvos, tirarOvo, passosParaChocar
} from '../js/ovos.js';
import { STATS } from '../js/dados.js';

const mon = (nome, genero, ivs = {}, moves = []) => ({ name: nome, nick: '', genero, ivs: Object.fromEntries(STATS.map(s => [s, ivs[s] ?? 0])), moves, data: { speciesName: nome } });
// grupos-ovo como `amizade.talvezPorOvo` monta: nome da espécie → lista de grupos (api.loadSpecies.eggGroups)
const grupos = obj => new Map(Object.entries(obj));

test('passos saem dos ciclos de choco, entre o piso e o teto', () => {
  assert.equal(passosParaChocar(5), PASSOS_MIN, 'Magikarp (5 ciclos) cai no piso de 100 explorações');
  assert.equal(passosParaChocar(CICLOS_PSEUDO), 200, 'pseudo-lendário (40 ciclos)');
  assert.equal(passosParaChocar(CICLOS_LENDARIO), PASSOS_MAX, 'lendário (120 ciclos) bate no teto');
  assert.equal(passosParaChocar(undefined), passosParaChocar(CICLOS_PADRAO), 'sem o campo (mapa baixado antes dele existir) usa o padrão');
  assert.equal(passosParaChocar(0), passosParaChocar(CICLOS_PADRAO), '0 é dado ruim, não um ovo instantâneo');
});

test('par exige gênero oposto — sem gênero e save antigo nunca cruzam', () => {
  const g = grupos({ a: ['field'], b: ['field'], velho: ['field'], velho2: ['field'], pai: ['field'], mae: ['field'] });
  assert.equal(acharPar([mon('a', 'm'), mon('b', 'm')], g), null, 'dois machos: nada');
  assert.equal(acharPar([mon('a', 'm'), mon('b', null)], g), null, 'sem gênero: nada');
  assert.equal(acharPar([{ name: 'velho', data: { speciesName: 'velho' } }, { name: 'velho2', data: { speciesName: 'velho2' } }], g), null, 'save antigo (sem o campo de gênero): nada');
  assert.equal(acharPar([mon('a', 'm')], g), null, 'sozinho: nada');
  const par = acharPar([mon('pai', 'm'), mon('mae', 'f')], g, () => 0);
  assert.equal(par.mae.name, 'mae');
  assert.equal(par.pai.name, 'pai', 'a mãe é sempre a fêmea, em qualquer ordem da lista');
});

/* Grupos-ovo (02/10/2026): o usuário pediu a regra depois de ver Pikachu cruzando com Gyarados. O teste existe
   porque "quem pode cruzar com quem" é a única regra aqui cuja falha é SILENCIOSA nos dois sentidos — par demais
   ninguém nota, par de menos parece que a mecânica não existe. */
test('par exige um grupo-ovo em comum, e no-eggs não cruza com ninguém', () => {
  const pika = mon('pikachu', 'm'), gyara = mon('gyarados', 'f'), magi = mon('magikarp', 'f');
  const g = grupos({ pikachu: ['ground', 'fairy'], gyarados: ['water1', 'dragon'], magikarp: ['water2', 'dragon'], mewtwo: [GRUPO_SEM_OVO], mew: [GRUPO_SEM_OVO] });
  assert.equal(parCompativel(pika, gyara, g), false, 'Pikachu (ground/fairy) × Gyarados (water1/dragon): não cruzam');
  assert.equal(parCompativel(gyara, magi, g), false, 'gênero igual (duas fêmeas) continua valendo mesmo com grupo em comum');
  assert.equal(parCompativel(mon('gyarados', 'm'), magi, g), true, 'Gyarados ♂ × Magikarp ♀: dividem o grupo dragon');
  assert.equal(parCompativel(mon('mewtwo', 'm'), mon('mew', 'f'), g), false, `${GRUPO_SEM_OVO} não cruza nem com outro ${GRUPO_SEM_OVO}`);
  assert.equal(parCompativel(mon('mewtwo', 'm'), magi, g), false, `${GRUPO_SEM_OVO} não cruza com ninguém`);
  // grupo desconhecido (mapa baixado antes do campo existir, ou a busca falhou) NÃO cruza: sem ovo é melhor que ovo errado
  assert.equal(parCompativel(mon('x', 'm'), mon('y', 'f'), grupos({})), false, 'sem os grupos, nenhum par se forma');
  assert.equal(parCompativel(pika, gyara, undefined), false, 'sem o Map nenhum: também não quebra');
});

test('cruzar respeita o teto de ovos e a chance', () => {
  const S = { ovos: [] };
  assert.equal(podeCruzar(S, () => 0.99), false, 'sorteio acima da chance: não põe ovo');
  assert.equal(podeCruzar(S, () => CHANCE_OVO - 0.001), true, 'sorteio abaixo da chance: põe');
  S.ovos = Array.from({ length: MAX_OVOS }, () => criarOvo({ especie: 'x', ciclos: 20 }));
  assert.equal(podeCruzar(S, () => 0), false, `ninho cheio (${MAX_OVOS}) não aceita mais`);
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
