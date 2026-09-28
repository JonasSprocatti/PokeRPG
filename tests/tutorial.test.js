// Modo tutorial (js/tutorial.js): tour guiado + demonstração. Puro, sem DOM — quem desenha é tela-tutorial.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, DIFICULDADES } from '../js/dados.js';
import {
  TUT_PASSOS, TUT_ITENS_LOJA, TUT_DEMO, TUT_SELVAGEM, TUT_DANO_GOLPE, TUT_CONTRA_ATAQUE,
  novoEstadoTutorial, avancarPasso, voltarPasso, passoAtual, ultimoPasso, indiceDoPasso,
  golpeDemo, venceuDemo, comprarDemo, resultadoCaptura
} from '../js/tutorial.js';

test('TUT_PASSOS: passos únicos, na ordem esperada do tour', () => {
  assert.equal(new Set(TUT_PASSOS).size, TUT_PASSOS.length, 'passo repetido');
  assert.deepEqual(TUT_PASSOS, ['boas-vindas', 'mundo', 'batalha', 'loja', 'captura', 'runs', 'fim']);
});

test('TUT_ITENS_LOJA: todo item da vitrine de demonstração existe de verdade e tem preço', () => {
  assert.ok(TUT_ITENS_LOJA.length >= 3);
  for (const id of TUT_ITENS_LOJA) {
    assert.ok(ITEMS[id], `${id} não existe em ITEMS`);
    assert.ok(ITEMS[id].price > 0, `${id} sem preço`);
  }
});

test('novoEstadoTutorial: começa no passo 0, cheio de HP, sem nada na mochila', () => {
  const t = novoEstadoTutorial();
  assert.equal(t.passo, 0);
  assert.equal(t.hp, t.hpMax);
  assert.equal(t.inimigoHp, t.inimigoHpMax);
  assert.equal(t.dinheiro > 0, true);
  assert.deepEqual(t.mochila, {});
  assert.equal(t.capturaRevelada, false);
});

test('avancarPasso/voltarPasso: andam um passo por vez e não saem dos limites', () => {
  const t = novoEstadoTutorial();
  avancarPasso(t); assert.equal(t.passo, 1);
  voltarPasso(t); voltarPasso(t); assert.equal(t.passo, 0, 'não pode ficar negativo');
  for (let i = 0; i < TUT_PASSOS.length + 3; i++) avancarPasso(t);
  assert.equal(t.passo, TUT_PASSOS.length - 1, 'não pode passar do último');
  assert.ok(ultimoPasso(t));
  assert.equal(passoAtual(t), 'fim');
});

test('indiceDoPasso: acha a posição de cada passo pelo id (usado por tut-explorar)', () => {
  assert.equal(indiceDoPasso('batalha'), TUT_PASSOS.indexOf('batalha'));
  assert.equal(indiceDoPasso('boas-vindas'), 0);
});

test('golpeDemo: dano fixo, contra-ataque só enquanto o selvagem está de pé, nunca some sozinho', () => {
  const t = novoEstadoTutorial();
  const hpAntes = t.hp, inimigoAntes = t.inimigoHp;
  golpeDemo(t);
  assert.equal(t.inimigoHp, inimigoAntes - TUT_DANO_GOLPE);
  assert.equal(t.hp, hpAntes - TUT_CONTRA_ATAQUE, 'selvagem ainda de pé: revida');
  assert.ok(!venceuDemo(t));
  golpeDemo(t); // 2º golpe: derruba o Caterpie (16 - 9 - 9 < 0)
  assert.ok(venceuDemo(t));
  assert.equal(t.hp, hpAntes - TUT_CONTRA_ATAQUE, 'derrubado no golpe final: não revida de novo');
  const hpDepoisDeVencer = t.hp;
  golpeDemo(t); // clicar de novo depois de vencido não faz nada
  assert.equal(t.hp, hpDepoisDeVencer);
  assert.equal(t.inimigoHp, 0);
});

test('golpeDemo: o HP do selvagem nunca fica negativo mesmo com dano sobrando', () => {
  const t = novoEstadoTutorial();
  for (let i = 0; i < 10; i++) golpeDemo(t);
  assert.equal(t.inimigoHp, 0);
});

test('comprarDemo: gasta o dinheiro de mentirinha e guarda na mochila de mentirinha', () => {
  const t = novoEstadoTutorial();
  const preco = ITEMS[TUT_ITENS_LOJA[0]].price, dinheiroAntes = t.dinheiro;
  comprarDemo(t, TUT_ITENS_LOJA[0]);
  assert.equal(t.dinheiro, dinheiroAntes - preco);
  assert.equal(t.mochila[TUT_ITENS_LOJA[0]], 1);
  comprarDemo(t, TUT_ITENS_LOJA[0]);
  assert.equal(t.mochila[TUT_ITENS_LOJA[0]], 2, 'comprar de novo empilha');
});

test('comprarDemo: sem dinheiro suficiente não compra (e não deixa saldo negativo)', () => {
  const t = novoEstadoTutorial();
  t.dinheiro = 1;
  comprarDemo(t, 'rare-candy'); // rare-candy não tem `price` (só prêmio) — nunca deveria "vender"
  assert.deepEqual(t.mochila, {});
  const caro = TUT_ITENS_LOJA.find(id => ITEMS[id].price > 1);
  comprarDemo(t, caro);
  assert.equal(t.dinheiro, 1, 'dinheiro não muda quando falta pra pagar');
  assert.deepEqual(t.mochila, {});
});

test('resultadoCaptura: cobre toda dificuldade jogável e nunca compara pelo nome do modo (lê as flags)', () => {
  for (const k of Object.keys(DIFICULDADES)) {
    const texto = resultadoCaptura(k);
    assert.ok(texto.length > 5, `${k}: sem texto`);
  }
  // as flags reais de dados.js decidem o resultado — se um modo tiver `semCaptura`, o texto tem que dizer isso
  for (const [k, d] of Object.entries(DIFICULDADES)) {
    if (d.semCaptura) assert.match(resultadoCaptura(k), /nunca/i, `${k}: semCaptura deveria dizer "nunca"`);
    else if (d.fimDeJogo) assert.match(resultadoCaptura(k), /fim de jogo/i, `${k}: fimDeJogo deveria avisar isso`);
  }
});

test('espécies de demonstração têm id válido (pro sprite estático SPR/dados.js não quebrar)', () => {
  assert.ok(Number.isInteger(TUT_DEMO.id) && TUT_DEMO.id > 0);
  assert.ok(Number.isInteger(TUT_SELVAGEM.id) && TUT_SELVAGEM.id > 0);
});
