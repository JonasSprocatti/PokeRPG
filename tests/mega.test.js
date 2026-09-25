/* Mega Evolução (js/mega.js + a tabela gerada em js/dados-megas.js).
   O que dá pra testar sem navegador: a tabela, a decisão de quem pode megaevoluir, e o ir-e-voltar da troca de
   forma (que é o ponto perigoso — sem desfazer direito, o Pokémon fica Mega pra sempre, porque `M.data` vai
   junto no save). A busca da forma na API fica de fora: `megaevoluir` é a única parte que toca a rede. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MEGAS, megasDe, temMega, ehPrimal } from '../js/dados-megas.js';
import { megasDisponiveis, avisoDaMega, desfazerMega, inimigoPodeMega, inimigoMegaLiberada, NIVEL_MEGA_INIMIGO, HP_MEGA_INIMIGO, verboDaForma, nomeDaMecanica } from '../js/mega.js';
import { progressoConquistas } from '../js/conquistas.js';
import { ITEM_PEDRA_MEGA } from '../js/dados.js';

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

/* A tabela é a MESMA fonte que a conquista consulta (conquistas.js filtra por `temMega`), então toda espécie com
   Mega tem uma barra alcançável e nenhuma barra leva a lugar nenhum. A primeira versão do filtro perguntava
   "é evolução final?", o que errava dos dois lados: deixava passar espécie final sem Mega e barrava a Floette,
   que tem Mega sem ser final (as Megas novas de Legends Z-A trouxeram esse caso). */
test('a barra da Mega existe pra quem megaevolui, e só pra quem megaevolui', () => {
  const abates = { total: 0, tipoAlvo: {}, golpe: {}, elemento: {},
    especie: { swampert: 700, marshtomp: 200, raticate: 500, floette: 300 } };
  const p = progressoConquistas([], { abates });
  const nomes = p.mega.map(x => x.chave).sort();
  assert.deepEqual(nomes, ['floette', 'swampert'], 'só quem tem Mega aparece');
  assert.ok(!nomes.includes('marshtomp'), 'forma do meio sem Mega: barra que não levaria a nada');
  assert.ok(!nomes.includes('raticate'), 'evolução final SEM Mega também não ganha barra');
  // e toda chave possível dessa lista tem forma na tabela — nenhuma barra chega a 1.000 sem entregar nada
  for (const e of nomes) assert.ok(megasDe(e).length, `${e} na lista da Mega sem forma na tabela`);
});

const mon = (especie, extra = {}) => ({
  id: 6, name: especie, level: 50, ivs: {}, evs: {}, nature: 'hardy', hp: 100,
  stats: { hp: 100 }, data: { speciesName: especie, base: {} }, ability: 'blaze', ...extra
});

/* Conquistar a Mega libera a COMPRA da pedra, não a Mega em si: sem a Pedra Mega segurada, não megaevolui
   (pedido do usuário, e é a regra dos jogos). Rayquaza é a exceção — ele não usa pedra, usa Dragon Ascent. */
test('sem a Pedra Mega segurada, não megaevolui', () => {
  const liberada = () => true;
  assert.deepEqual(megasDisponiveis(mon('charizard', { item: null }), { jaUsou: false, liberada }), []);
  assert.match(avisoDaMega(mon('charizard'), { liberada }), /Pedra Mega/);
  assert.equal(megasDisponiveis(mon('charizard', { item: ITEM_PEDRA_MEGA }), { jaUsou: false, liberada }).length, 2);
  assert.equal(avisoDaMega(mon('charizard', { item: ITEM_PEDRA_MEGA }), { liberada }), '');
  // quem não conquistou não recebe aviso nenhum: não é hora de contar que a mecânica existe
  assert.equal(avisoDaMega(mon('charizard'), { liberada: () => false }), '');
  assert.equal(avisoDaMega(mon('pidgey'), { liberada }), '', 'espécie sem Mega');
});

test('Rayquaza megaevolui com Dragon Ascent, sem pedra nenhuma', () => {
  const liberada = () => true;
  const semGolpe = mon('rayquaza', { moves: [{ name: 'fly' }] });
  assert.deepEqual(megasDisponiveis(semGolpe, { jaUsou: false, liberada }), []);
  assert.match(avisoDaMega(semGolpe, { liberada }), /Dragon Ascent/);
  const comGolpe = mon('rayquaza', { moves: [{ name: 'dragon-ascent' }] });
  assert.equal(megasDisponiveis(comGolpe, { jaUsou: false, liberada }).length, 1, 'sabe o golpe: pode, sem pedra');
  assert.equal(comGolpe.item, undefined, 'e de fato não está segurando nada');
});

test('quem pode megaevoluir: conquistada, uma por batalha, e não duas vezes', () => {
  const liberada = () => true;
  assert.equal(megasDisponiveis(mon('charizard', { item: ITEM_PEDRA_MEGA }), { jaUsou: false, liberada }).length, 2);
  assert.deepEqual(megasDisponiveis(mon('charizard'), { jaUsou: true, liberada }), [], 'uma por batalha');
  assert.deepEqual(megasDisponiveis(mon('pidgey'), { jaUsou: false, liberada }), [], 'espécie sem Mega');
  assert.deepEqual(megasDisponiveis(mon('charizard'), { jaUsou: false, liberada: () => false }), [],
    'sem a conquista, não aparece');
  // já está Mega: não megaevolui de novo
  assert.deepEqual(megasDisponiveis(mon('charizard', { mega: {}, item: ITEM_PEDRA_MEGA }), { jaUsou: false, liberada }), []);
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

// o inimigo não tem inventário: exigir a pedra dele faria a segunda fase da luta nunca acontecer
test('o lado inimigo megaevolui sem pedra', () => {
  const alfa = mon('charizard');
  assert.deepEqual(megasDisponiveis(alfa, { jaUsou: false, liberada: () => true }), [], 'a regra da pedra vale pro jogador');
  assert.equal(megasDisponiveis(alfa, { jaUsou: false, liberada: () => true, ignorarPedra: true }).length, 2);
});

test('só Alfa, lendário e treinador megaevoluem do lado inimigo', () => {
  assert.equal(inimigoPodeMega({ chefe: 'rota1' }), true);
  assert.equal(inimigoPodeMega({ lendarios: true }), true);
  assert.equal(inimigoPodeMega({ trainer: { nome: 'Rui' } }), true);
  assert.equal(inimigoPodeMega({}), false, 'selvagem de rota não');
  assert.equal(inimigoPodeMega(null), false);
  // e a Mega dele só de nível 40 em diante (o Tera do inimigo não tem esse piso)
  assert.equal(NIVEL_MEGA_INIMIGO, 40);
  assert.equal(inimigoMegaLiberada({ level: 39 }), false);
  assert.equal(inimigoMegaLiberada({ level: 40 }), true);
  assert.equal(inimigoMegaLiberada({ level: 62 }), true);
  assert.equal(inimigoMegaLiberada(null), false);
  assert.ok(HP_MEGA_INIMIGO > 0 && HP_MEGA_INIMIGO < 1, 'vira no meio da luta, não no começo nem no fim');
});
