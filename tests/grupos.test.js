/* 🐺 Matilhas e manadas fora da Saga, e o treinador com equipe de 6 / campo de até 3.
   Pedido do usuário em 06/10/2026. A infraestrutura de grupo já existia (o lado inimigo virou lista na Saga); o
   que entrou aqui foi a CHANCE, o TETO e o campo do treinador — e são justamente os números que, errados, viram
   parede intransponível ou mecânica que nunca aparece.
   Chance se testa FIXANDO o sorteio (CLAUDE.md), nunca por amostragem. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GRUPO_MAX, CHANCE_GRUPO_MAX, ROTAS_SEM_GRUPO, chanceDeGrupo, tetoDoGrupo, tamanhoDoEncontro,
  nomeDoGrupo, NOME_DO_GRUPO, EQUIPE_TREINADOR, tamanhoDaEquipeDoTreinador, campoDoTreinador, reservasDoTreinador
} from '../js/regras.js';

const mon = (tipos, hp = 40) => ({ data: { types: tipos }, hp, vol: {} });

test('as três primeiras rotas NUNCA têm grupo', () => {
  // jornada nova começa no Nv. 5 sozinha: cair num grupo ali é derrota sem decisão nenhuma
  for (let i = 0; i < ROTAS_SEM_GRUPO; i++) assert.equal(chanceDeGrupo(i), 0, `rota índice ${i}`);
  assert.ok(chanceDeGrupo(ROTAS_SEM_GRUPO) > 0, 'da quarta em diante, já pode');
  assert.equal(chanceDeGrupo(-5), 0, 'índice negativo não vira chance negativa');
});

test('a chance cresce com a rota e para no teto', () => {
  const curva = [...Array(10).keys()].map(i => chanceDeGrupo(i));
  for (let i = 1; i < curva.length; i++) assert.ok(curva[i] >= curva[i - 1], `a curva não pode descer (índice ${i})`);
  assert.equal(curva[9], CHANCE_GRUPO_MAX, 'a última rota bate no teto');
  assert.equal(chanceDeGrupo(50), CHANCE_GRUPO_MAX, 'passar do fim não passa do teto');
  // mapa com outro tamanho (o Santuário é a 11ª) continua chegando ao teto na última
  assert.equal(chanceDeGrupo(10, 11), CHANCE_GRUPO_MAX);
});

test('o teto do grupo é "aliados + 1 do seu lado": sem aliado, no máximo 2 contra 1', () => {
  assert.equal(tetoDoGrupo(0), 2, 'você sozinho: 2 inimigos no máximo');
  assert.equal(tetoDoGrupo(1), 3);
  assert.equal(tetoDoGrupo(2), GRUPO_MAX, 'com a equipe cheia, o teto é o da cena');
  assert.equal(tetoDoGrupo(5), GRUPO_MAX, 'nunca passa do teto da cena (3 sprites no celular)');
});

test('tamanhoDoEncontro: os dois lados do limiar da chance', () => {
  const r3 = chanceDeGrupo(9);
  const opts = (sorte, sorteTamanho = () => 0.99) => ({ sorte: () => sorte, sorteTamanho, rotasNoMapa: 10 });
  assert.ok(tamanhoDoEncontro(9, 2, opts(r3 - 0.001)) > 1, 'abaixo do limiar: vem grupo');
  assert.equal(tamanhoDoEncontro(9, 2, opts(r3)), 1, 'no limiar exato: encontro normal');
  assert.equal(tamanhoDoEncontro(9, 2, opts(0.99)), 1, 'sorte ruim: encontro normal');
  // na rota 1 nem a melhor sorte faz grupo
  assert.equal(tamanhoDoEncontro(0, 2, opts(0)), 1);
});

test('tamanhoDoEncontro respeita o teto do seu lado, mesmo na Saga (que sempre agrupa)', () => {
  const sempre = { sempre: true, sorte: () => 0, sorteTamanho: () => 0.99, rotasNoMapa: 10 };
  assert.equal(tamanhoDoEncontro(9, 0, sempre), 2, 'sozinho, no máximo 2 — vale até no modo que sempre agrupa');
  assert.equal(tamanhoDoEncontro(9, 1, sempre), 3);
  assert.equal(tamanhoDoEncontro(9, 2, sempre), GRUPO_MAX);
  // `sempre` ignora a chance, mas não a rota 1–3 pelo TAMANHO (tamanhoDoGrupo cuida disso)
  assert.ok(tamanhoDoEncontro(0, 2, sempre) >= 1);
});

test('o nome do grupo sai do tipo em comum; sem tipo em comum, é bando', () => {
  assert.equal(nomeDoGrupo([mon(['bug']), mon(['bug', 'flying'])]), NOME_DO_GRUPO.bug, 'Inseto → enxame');
  assert.equal(nomeDoGrupo([mon(['water']), mon(['water'])]), NOME_DO_GRUPO.water);
  assert.equal(nomeDoGrupo([mon(['fire']), mon(['water'])]), 'bando', 'sem tipo em comum');
  assert.equal(nomeDoGrupo([mon(['normal'])]), null, 'um só não é grupo');
  assert.equal(nomeDoGrupo([]), null);
  // todo tipo tem palavra: um tipo sem entrada cairia em "bando" sem ninguém notar
  for (const t of Object.keys(NOME_DO_GRUPO)) assert.ok(NOME_DO_GRUPO[t], t);
  assert.equal(Object.keys(NOME_DO_GRUPO).length, 18, 'os 18 tipos');
});

test('equipe do treinador: a faixa da rota manda, e 6 só aparece em rota avançada', () => {
  const tamanhos = (iRota, n = 2000) => {
    const c = {};
    for (let k = 0; k < n; k++) { const t = tamanhoDaEquipeDoTreinador(iRota, () => k / n); c[t] = (c[t] || 0) + 1; }
    return c;
  };
  const inicio = tamanhos(0);
  assert.deepEqual(Object.keys(inicio).map(Number).sort(), [1, 2], 'rotas 1–3: um ou dois, nunca mais');
  assert.ok(!tamanhos(4)[6], 'meio do mapa: ainda não existe o de 6');
  assert.ok(tamanhos(7)[6] > 0, 'fim do mapa: o de 6 passa a ser possível');
  assert.ok(tamanhos(7)[6] / 2000 < 0.1, 'e é raro (menos de 10% ali)');
  assert.ok(tamanhos(9)[6] > 0, 'rota final: mais comum, mas ainda não é a maioria');
  for (const [, c] of Object.entries(tamanhos(9))) assert.ok(c / 2000 <= 0.5);
});

test('equipe do treinador: nunca passa de 6 nem fica abaixo de 1', () => {
  for (const faixa of EQUIPE_TREINADOR) for (const n of Object.keys(faixa.pesos).map(Number)) {
    assert.ok(n >= 1 && n <= 6, `peso pra equipe de ${n} — fora de 1–6`);
  }
  for (let i = 0; i <= 12; i++) for (const s of [0, 0.5, 0.999999, 1]) {
    const t = tamanhoDaEquipeDoTreinador(i, () => s);
    assert.ok(t >= 1 && t <= 6, `rota ${i}, sorte ${s} → ${t}`);
  }
});

test('SÓ o treinador de 6 pode pôr 3 em campo', () => {
  for (let n = 1; n <= 5; n++) {
    const maior = Math.max(...[0, 0.5, 0.999999].map(s => campoDoTreinador(n, GRUPO_MAX, () => s)));
    assert.ok(maior <= 2, `equipe de ${n} chegou a pôr ${maior} em campo`);
  }
  assert.equal(campoDoTreinador(6, GRUPO_MAX, () => 0.999999), 3, 'o de 6 alcança os 3');
  assert.equal(campoDoTreinador(1, GRUPO_MAX, () => 0.999999), 1, 'quem tem um só põe um');
  // o teto do SEU lado também limita: um de 6 contra você sozinho não vem com 3
  assert.equal(campoDoTreinador(6, 2, () => 0.999999), 2);
  assert.equal(campoDoTreinador(6, 1, () => 0.999999), 1);
});

test('reservas: de pé e fora de campo, na ordem da fila', () => {
  const equipe = [mon(['normal']), mon(['normal'], 0), mon(['normal']), mon(['normal'])];
  assert.deepEqual(reservasDoTreinador(equipe, [0]), [2, 3], 'o índice 1 caiu, o 0 está em campo');
  assert.deepEqual(reservasDoTreinador(equipe, [0, 2, 3]), [], 'todos os de pé já estão em campo');
  assert.deepEqual(reservasDoTreinador(equipe, []), [0, 2, 3], 'ninguém em campo: todos os de pé são reserva');
  assert.deepEqual(reservasDoTreinador([], [0]), []);
  assert.deepEqual(reservasDoTreinador(undefined, undefined), []);
});
