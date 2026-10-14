/* 🍖 O botão "Oferecer petisco" (regras.planoDoPetisco / seguirOferecendo). O que se guarda aqui são as duas escolhas
   de SEGURANÇA do desenho — só oferece o que ele gosta e nunca a quem é forte demais — e a conta que justifica o
   teto de ofertas por toque. O laço em si (que gasta turnos de verdade) é coberto em turno-smoke.test.js. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planoDoPetisco, seguirOferecendo, OFERTAS_POR_TOQUE, PISO_HP_OFERTA, ganhoAmizade, AMIZADE_MAX } from '../js/regras.js';
import { ITEMS } from '../js/dados.js';

const plano = (bag, tipos, extra = {}) => planoDoPetisco({ bag, itens: ITEMS, tipos, nivelAlvo: 8, nivelJogador: 8, ...extra });

test('sem petisco na mochila (ou só item que não é petisco): o botão nem aparece', () => {
  assert.deepEqual(plano({}, ['bug']), { ok: false, motivo: 'sem-petisco' });
  assert.deepEqual(plano({ potion: 5, honey: 0 }, ['bug']), { ok: false, motivo: 'sem-petisco' }, 'quantidade 0 e item sem afinidade não contam');
});

test('petisco que ele NÃO gosta não é oferecido: 0–5 de amizade não paga o turno nem o petisco', () => {
  const p = plano({ charcoal: 4 }, ['bug', 'poison']);       // Carvão Doce: Fogo/Dragão/Lutador
  assert.equal(p.ok, false);
  assert.equal(p.motivo, 'nao-gosta');
  assert.equal(p.tem, 1);
});

test('forte demais: recusa ANTES de gastar (a oferta de verdade gasta o petisco e o turno e só então avisa)', () => {
  const p = plano({ honey: 3 }, ['bug'], { nivelAlvo: 16, nivelJogador: 10 });
  assert.equal(p.ok, false);
  assert.equal(p.motivo, 'forte-demais');
  assert.equal(p.ate, 15, 'diz até que nível ele aceitaria');
  assert.equal(plano({ honey: 3 }, ['bug'], { nivelAlvo: 15, nivelJogador: 10 }).ok, true, '+5 ainda aceita (regras.podeFazerAmizade)');
});

test('entre vários que ele gosta vai o de MAIOR estoque; no empate, a ordem do catálogo', () => {
  assert.equal(plano({ honey: 1, 'tiny-mushroom': 3 }, ['bug', 'poison']).id, 'tiny-mushroom');
  assert.equal(plano({ honey: 2, 'tiny-mushroom': 2 }, ['bug', 'poison']).id, 'honey', 'catálogo: Mel vem antes do Cogumelo');
  const p = plano({ charcoal: 9, honey: 1 }, ['bug']);
  assert.equal(p.id, 'honey', 'o de maior estoque ENTRE OS QUE AGRADAM (o Carvão não agrada)');
  assert.equal(p.estoque, 1);
  assert.equal(plano({ honey: 2, 'tiny-mushroom': 3, charcoal: 9 }, ['bug', 'poison']).total, 5, 'total soma só os que ele gosta');
});

test('o teto por toque é a conta de encher a barra: 5 ofertas do MENOR ganho = 100', () => {
  // se o ganho mínimo de um petisco que agrada mudar, o teto tem de mudar junto — senão o botão deixa de
  // recrutar qualquer não-lendário num toque só, e ninguém percebe (o teste de amizade continua passando)
  const menor = ganhoAmizade(['bug'], ['bug'], 0);
  assert.ok(menor * OFERTAS_POR_TOQUE >= AMIZADE_MAX, `${menor} × ${OFERTAS_POR_TOQUE} precisa chegar a ${AMIZADE_MAX}`);
  assert.ok(menor * (OFERTAS_POR_TOQUE - 1) < AMIZADE_MAX, 'e 4 não bastariam: o teto não tem folga à toa');
});

test('a repetição só segue com HP acima da metade, sem aliado caído e abaixo do teto', () => {
  assert.equal(seguirOferecendo({ feitas: 1, hpFracao: 1 }), true);
  assert.equal(seguirOferecendo({ feitas: 4, hpFracao: 0.8 }), true);
  assert.equal(seguirOferecendo({ feitas: OFERTAS_POR_TOQUE, hpFracao: 1 }), false, 'chegou ao teto');
  assert.equal(seguirOferecendo({ feitas: 1, hpFracao: PISO_HP_OFERTA }), false, 'na metade já para: o piso é estrito');
  assert.equal(seguirOferecendo({ feitas: 1, hpFracao: PISO_HP_OFERTA + 0.01 }), true);
  assert.equal(seguirOferecendo({ feitas: 1, hpFracao: 1, aliadoCaiu: true }), false);
});
