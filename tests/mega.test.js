/* Mega Evolução (js/mega.js + a tabela gerada em js/dados-megas.js).
   O que dá pra testar sem navegador: a tabela, a decisão de quem pode megaevoluir, e o ir-e-voltar da troca de
   forma (que é o ponto perigoso — sem desfazer direito, o Pokémon fica Mega pra sempre, porque `M.data` vai
   junto no save). A busca da forma na API fica de fora: `megaevoluir` é a única parte que toca a rede. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MEGAS, megasDe, temMega, ehPrimal } from '../js/dados-megas.js';
import { megasDisponiveis, desfazerMega, inimigoPodeMega, HP_MEGA_INIMIGO, verboDaForma, nomeDaMecanica } from '../js/mega.js';
import { ehEvolucaoFinal } from '../js/dados-familias.js';

test('tabela de Megas: formas com id de forma, nome e espécie coerente', () => {
  const especies = Object.keys(MEGAS);
  assert.ok(especies.length >= 45, `só ${especies.length} espécies com Mega`);
  for (const [especie, formas] of Object.entries(MEGAS)) {
    assert.ok(formas.length >= 1);
    for (const f of formas) {
      assert.ok(f.forma.startsWith(especie + '-'), `${f.forma} devia derivar de ${especie}`);
      assert.match(f.forma, /-(mega(-[xy])?|primal)$/, f.forma);
      assert.ok(f.id > 10000, `${f.forma}: id de forma, não o da espécie`);
      assert.ok(f.nome && f.nome.length > 3, `${f.forma}: sem nome de exibição`);
    }
  }
  // Charizard e Mewtwo são as duas espécies com X e Y — é por isso que o valor é uma lista
  assert.equal(megasDe('charizard').length, 2);
  assert.equal(megasDe('mewtwo').length, 2);
  assert.deepEqual(megasDe('charizard').map(f => f.nome), ['Mega Charizard X', 'Mega Charizard Y']);
  assert.equal(temMega('pidgey'), false);
  assert.deepEqual(megasDe('pidgey'), []);
});

test('Groudon e Kyogre são Reversão Primitiva, não Mega', () => {
  for (const e of ['groudon', 'kyogre']) {
    const f = megasDe(e)[0];
    assert.ok(f, `${e} sem forma`);
    assert.equal(ehPrimal(f), true);
    assert.match(nomeDaMecanica(f), /Primitiva/);
    assert.match(verboDaForma(f), /primitivo/);
  }
  const mega = megasDe('charizard')[0];
  assert.equal(ehPrimal(mega), false);
  assert.equal(nomeDaMecanica(mega), 'Mega Evolução');
  assert.equal(verboDaForma(mega), 'MEGAEVOLUIU');
});

/* Toda espécie com Mega tem que ser evolução final — senão a conquista dela (que só conta abates na forma
   final, ver conquistas.js) seria impossível de completar, e a Pedra Mega ficaria inalcançável em silêncio. */
test('toda espécie com Mega é evolução final: a conquista precisa ser alcançável', () => {
  const fora = Object.keys(MEGAS).filter(e => !ehEvolucaoFinal(e));
  assert.deepEqual(fora, [], 'espécie com Mega que não é evolução final');
});

const mon = (especie, extra = {}) => ({
  id: 6, name: especie, level: 50, ivs: {}, evs: {}, nature: 'hardy', hp: 100,
  stats: { hp: 100 }, data: { speciesName: especie, base: {} }, ability: 'blaze', ...extra
});

test('quem pode megaevoluir: conquistada, uma por batalha, e não duas vezes', () => {
  const liberada = () => true;
  assert.equal(megasDisponiveis(mon('charizard'), { jaUsou: false, liberada }).length, 2);
  assert.deepEqual(megasDisponiveis(mon('charizard'), { jaUsou: true, liberada }), [], 'uma por batalha');
  assert.deepEqual(megasDisponiveis(mon('pidgey'), { jaUsou: false, liberada }), [], 'espécie sem Mega');
  assert.deepEqual(megasDisponiveis(mon('charizard'), { jaUsou: false, liberada: () => false }), [],
    'sem a conquista, não aparece');
  // já está Mega: não megaevolui de novo
  assert.deepEqual(megasDisponiveis(mon('charizard', { mega: {} }), { jaUsou: false, liberada }), []);
});

test('desfazerMega devolve o Pokémon exatamente como estava', () => {
  const dataOriginal = { speciesName: 'charizard', base: { hp: 78, attack: 84 } };
  const M = mon('charizard', { data: dataOriginal });
  M.mega = { forma: megasDe('charizard')[0], antes: { id: 6, name: 'charizard', data: dataOriginal, ability: 'blaze' } };
  // como se tivesse virado: id/name/data/ability trocados
  M.id = 10034; M.name = 'charizard-mega-x'; M.data = { speciesName: 'charizard', base: { hp: 78, attack: 130 } }; M.ability = 'tough-claws';
  const voltou = desfazerMega(M);
  assert.ok(voltou, 'devolve a forma que estava ativa');
  assert.equal(M.id, 6);
  assert.equal(M.name, 'charizard');
  assert.equal(M.ability, 'blaze');
  assert.equal(M.data, dataOriginal, 'volta o MESMO objeto de dados, não uma cópia');
  assert.equal(M.mega, undefined, 'a marca de Mega sai junto');
  assert.equal(desfazerMega(M), null, 'desfazer de novo não faz nada');
  assert.equal(desfazerMega(mon('pidgey')), null, 'quem nunca megaevoluiu é ignorado');
});

test('só Alfa, lendário e treinador megaevoluem do lado inimigo', () => {
  assert.equal(inimigoPodeMega({ chefe: 'rota1' }), true);
  assert.equal(inimigoPodeMega({ lendarios: true }), true);
  assert.equal(inimigoPodeMega({ trainer: { nome: 'Rui' } }), true);
  assert.equal(inimigoPodeMega({}), false, 'selvagem de rota não');
  assert.equal(inimigoPodeMega(null), false);
  assert.ok(HP_MEGA_INIMIGO > 0 && HP_MEGA_INIMIGO < 1, 'vira no meio da luta, não no começo nem no fim');
});
