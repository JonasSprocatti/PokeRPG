// Progresso permanente da conta (js/progresso-conta.js). A regra que rege tudo: NUNCA encolhe. Apagar uma jornada
// da carreira não pode tirar uma espécie desbloqueada nem reduzir contador de gimmick — foi o jogador que apontou
// o risco, e é o tipo de perda que ninguém consegue desfazer depois.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { progressoVazio, bancar, totaisDe, runsDeNivelDe, mesclarProgresso, especiesDesbloqueadas,
  semTeste, temTeste, ID_JORNADA_TESTE, RAZAO_TESTE } from '../js/progresso-conta.js';

const jornada = (id, o = {}) => ({ id, especie: 'pikachu', nivel: 30, dificuldade: 'hard', registro: { abates: {
  total: 10, tipoAlvo: { fire: 4 }, especie: { pikachu: 10 }, golpe: { thunderbolt: 6 }, elemento: { electric: 6 }
} }, ...o });

test('bancar guarda os abates por jornada e é idempotente (pode rodar sempre)', () => {
  let p = bancar(progressoVazio(), [jornada('j1')], []);
  p = bancar(p, [jornada('j1')], []);      // de novo: não pode dobrar
  p = bancar(p, [jornada('j1'), jornada('j2')], []);
  assert.deepEqual(Object.keys(p.porJornada), ['j1', 'j2']);
  assert.equal(totaisDe(p).total, 20);
  assert.deepEqual(totaisDe(p).especie, { pikachu: 20 });
});

test('bancar guarda os números de parceiros da jornada (badges Casa cheia, Lobo solitário e Cemitério)', () => {
  const p = bancar(progressoVazio(), [jornada('j1', { casaCheia: true, aliadosPerdidos: 15, amigos: 3 }), jornada('j2')], []);
  assert.equal(p.porJornada.j1.casaCheia, true);
  assert.equal(p.porJornada.j1.aliadosPerdidos, 15);
  assert.equal(p.porJornada.j1.amigos, 3);
  // jornada antiga, sem os campos: valores neutros (não quebra e não concede nada)
  assert.equal(p.porJornada.j2.casaCheia, false);
  assert.equal(p.porJornada.j2.aliadosPerdidos, 0);
});

test('apagar a jornada do histórico NÃO reduz o progresso', () => {
  const p = bancar(progressoVazio(), [jornada('j1'), jornada('j2')], [{ especie: 'gengar', id: 94, razoes: ['derrotados'] }]);
  const totalAntes = totaisDe(p).total;
  // a carreira perdeu a j1 (o jogador apagou); bancar de novo só com a j2 não desfaz nada
  const depois = bancar(p, [jornada('j2')], []);
  assert.equal(totaisDe(depois).total, totalAntes);
  assert.ok(depois.especies.gengar, 'a espécie conquistada continua lá');
});

test('a run em andamento entra no total sem ser gravada', () => {
  const p = bancar(progressoVazio(), [jornada('j1')], []);
  const t = totaisDe(p, { total: 3, tipoAlvo: { water: 3 }, especie: {}, golpe: {}, elemento: {} });
  assert.equal(t.total, 13);
  assert.deepEqual(t.tipoAlvo, { fire: 4, water: 3 });
  assert.equal(Object.keys(p.porJornada).length, 1, 'a run em andamento não virou jornada bancada');
});

test('espécie desbloqueada guarda a data e nunca é sobrescrita', () => {
  let p = bancar(progressoVazio(), [], [{ especie: 'gengar', id: 94, razoes: ['amigos'] }], '2026-01-01T00:00:00Z');
  p = bancar(p, [], [{ especie: 'gengar', id: 94, razoes: ['derrotados'] }], '2026-09-09T00:00:00Z');
  assert.equal(p.especies.gengar.em, '2026-01-01T00:00:00Z');
  assert.deepEqual(p.especies.gengar.razoes, ['amigos']);
});

test('Gigantamax sai do progresso, não do histórico (e o Fácil não conta)', () => {
  const p = bancar(progressoVazio(), [
    jornada('a', { nivel: 50 }), jornada('b', { nivel: 72 }), jornada('c', { nivel: 49 }),
    jornada('d', { nivel: 80, dificuldade: 'easy' }), jornada('e', { nivel: 60, especie: 'gengar' })
  ], []);
  assert.deepEqual(runsDeNivelDe(p, 50), { pikachu: 2, gengar: 1 });
});

// Bug real: a lista de abates tem uma chave chamada `especie` (quantos você derrotou sendo cada espécie) e ela era
// espalhada na raiz da entrada, por cima da espécie DA JORNADA — a chave do Gigantamax virava "[object Object]".
test('o mapa de abates por espécie não sobrescreve a espécie da jornada', () => {
  const p = bancar(progressoVazio(), [jornada('j1', { nivel: 60 })], []);
  assert.equal(p.porJornada.j1.especie, 'pikachu');
  assert.deepEqual(p.porJornada.j1.abates.especie, { pikachu: 10 });
  assert.deepEqual(Object.keys(runsDeNivelDe(p, 50)), ['pikachu']);
});

// progresso gravado antes de `abates` virar campo próprio continua somando (e não vira chave inválida)
test('progresso no formato antigo (abates na raiz) continua valendo', () => {
  const antigo = { v: 1, especies: {}, porJornada: { velha: {
    nivel: 60, dificuldade: 'hard', total: 7, tipoAlvo: { fire: 7 }, especie: { pikachu: 7 }, golpe: {}, elemento: {}
  } } };
  assert.equal(totaisDe(antigo).total, 7);
  assert.deepEqual(totaisDe(antigo).especie, { pikachu: 7 });
  assert.deepEqual(runsDeNivelDe(antigo, 50), {}, 'sem espécie legível, não inventa chave');
});

/* O painel de manutenção (dev.js) concede Megas e espécies pra testar. Como a fusão com a nuvem é UNIÃO e
   nunca remove, o que subisse voltaria em toda sincronização — e o botão "limpar o que foi de teste" seria
   mentira, em todos os aparelhos. Por isso `semTeste` é o que sobe. */
test('o que veio do painel de teste não sobe pra nuvem', () => {
  const p = {
    v: 1,
    porJornada: { j1: { especie: 'pikachu', abates: { total: 10 } }, [ID_JORNADA_TESTE]: { abates: { total: 999 } } },
    especies: { gengar: { id: 94, razoes: ['derrotados'] }, onix: { id: 95, razoes: [RAZAO_TESTE] } }
  };
  assert.equal(temTeste(p), true);
  const limpo = semTeste(p);
  assert.deepEqual(Object.keys(limpo.porJornada), ['j1'], 'a jornada de teste não sobe');
  assert.deepEqual(Object.keys(limpo.especies), ['gengar'], 'a espécie concedida não sobe');
  assert.equal(temTeste(limpo), false);
  // o que veio de jogo fica intacto, e o original não é mutado
  assert.equal(limpo.porJornada.j1.abates.total, 10);
  assert.equal(Object.keys(p.porJornada).length, 2, 'não muta o progresso de quem chamou');
  assert.equal(semTeste(null), null);
});

test('mesclar com a nuvem é união: nada do que um lado tem se perde', () => {
  const aqui = bancar(progressoVazio(), [jornada('j1')], [{ especie: 'gengar', id: 94 }], '2026-05-05T00:00:00Z');
  const la = bancar(progressoVazio(), [jornada('j2')], [{ especie: 'gengar', id: 94 }, { especie: 'onix', id: 95 }], '2026-02-02T00:00:00Z');
  const j = mesclarProgresso(aqui, la);
  assert.deepEqual(Object.keys(j.porJornada).sort(), ['j1', 'j2']);
  assert.equal(totaisDe(j).total, 20, 'jornada de cada lado entra uma vez só');
  assert.deepEqual(Object.keys(j.especies).sort(), ['gengar', 'onix']);
  assert.equal(j.especies.gengar.em, '2026-02-02T00:00:00Z', 'fica a data mais antiga: foi quando conquistou');
  // a mesma jornada nos dois lados não conta em dobro
  assert.equal(totaisDe(mesclarProgresso(aqui, aqui)).total, 10);
});

test('desbloqueadas = gravadas + o que a regra de hoje reconhece (retroatividade)', () => {
  const p = bancar(progressoVazio(), [], [{ especie: 'gengar', id: 94 }]);
  const lista = especiesDesbloqueadas(p, [{ especie: 'onix', id: 95, razoes: ['shiny'] }]);
  assert.deepEqual(lista.map(x => x.especie).sort(), ['gengar', 'onix']);
  assert.equal(lista.find(x => x.especie === 'gengar').permanente, true);
  assert.equal(lista.find(x => x.especie === 'onix').permanente, false);
  // sem id não dá pra desenhar nem começar jornada: fica de fora da lista jogável
  assert.deepEqual(especiesDesbloqueadas({ especies: { mew: { id: null } } }, []), []);
});
