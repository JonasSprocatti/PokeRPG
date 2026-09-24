// Conquistas da conta (js/conquistas.js): os contadores que desbloqueiam as gimmicks. A regra que atravessa tudo
// é "só conta o que VOCÊ fez" — golpe final do aliado não vale.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registrarAbate, somarAbates, runsDeNivel, progressoConquistas, teraLiberada, megaLiberada, zLiberado, gmaxLiberado, ALVOS } from '../js/conquistas.js';
import { estatisticasDaJornada } from '../js/regras.js';

const golpe = (name, type) => ({ name, type });

test('abate registra tipo do alvo, minha espécie, golpe e elemento', () => {
  const S = {};
  registrarAbate(S, { porMim: true, tiposDoAlvo: ['fire', 'flying'], minhaEspecie: 'pikachu', golpe: golpe('thunderbolt', 'electric') });
  const a = S.registro.abates;
  assert.deepEqual(a.tipoAlvo, { fire: 1, flying: 1 });   // dual-type conta pros dois
  assert.deepEqual(a.especie, { pikachu: 1 });
  assert.deepEqual(a.golpe, { thunderbolt: 1 });
  assert.deepEqual(a.elemento, { electric: 1 });
});

test('golpe final do aliado conta pra ESPÉCIE, mas não pra tipo nem golpe', () => {
  // o usuário voltou atrás do `só o seu golpe`: o aliado luta ao seu lado e ajuda a construir a sua Pedra Mega.
  // Tera e Z-Move continuam exigindo o SEU golpe final.
  const S = {};
  const a = registrarAbate(S, { porMim: false, tiposDoAlvo: ['fire'], minhaEspecie: 'pikachu', golpe: golpe('ember', 'fire') });
  assert.deepEqual(a.especie, { pikachu: 1 });
  assert.equal(a.total, 1);
  assert.deepEqual(a.tipoAlvo, {});
  assert.deepEqual(a.golpe, {});
  assert.deepEqual(a.elemento, {});
});

test('o modo Fácil não acumula nada: é treino', () => {
  const S = {};
  assert.equal(registrarAbate(S, { porMim: true, tiposDoAlvo: ['fire'], minhaEspecie: 'pikachu', golpe: golpe('ember', 'fire'), modo: 'easy' }), null);
  assert.equal(S.registro, undefined);
});

test('somarAbates junta a carreira com a run em andamento', () => {
  const j1 = { abates: { tipoAlvo: { fire: 120 }, especie: { pikachu: 5 }, golpe: {}, elemento: {} } };
  const j2 = { abates: { tipoAlvo: { fire: 70, water: 3 }, especie: { pikachu: 2 }, golpe: {}, elemento: {} } };
  const atual = { abates: { tipoAlvo: { fire: 10 }, especie: {}, golpe: {}, elemento: {} } };
  const s = somarAbates([j1, j2, atual, undefined, {}]);
  assert.deepEqual(s.tipoAlvo, { fire: 200, water: 3 });
  assert.deepEqual(s.especie, { pikachu: 7 });
});

/* Bug real: a barra da Mega existia por ESTÁGIO. Quem jogava via "Marshtomp 177/1000" e "Swampert 264/1000"
   lado a lado, e evoluir parecia zerar o progresso. Só acumula quem PODE megaevoluir (dados-megas.js) — e isto
   vale SÓ pra Mega: Tera, Z-Move e Gigantamax continuam contando tudo. */
test('Mega conta só pra quem megaevolui; as outras gimmicks não filtram', () => {
  const registro = { abates: {
    total: 900, especie: { swampert: 700, marshtomp: 200, mudkip: 50, absol: 30 },
    tipoAlvo: { water: 400 }, golpe: { surf: 300 }, elemento: { water: 300 }
  } };
  const p = progressoConquistas([], registro);
  const nomes = p.mega.map(x => x.chave);
  assert.deepEqual(nomes.sort(), ['absol', 'swampert'], 'quem não tem Mega não entra na lista');
  assert.equal(p.mega.find(x => x.chave === 'swampert').n, 700, 'não herda o que veio das formas do meio');
  // as outras continuam iguais — o filtro é exclusivo da Mega
  assert.equal(p.tera[0].chave, 'water');
  assert.equal(p.zGolpe[0].n, 300);
  assert.equal(p.abates.total, 900, 'o marco de caçada conta TODO abate, em qualquer forma');
});

test('Gigantamax sai do histórico: jornadas em que a espécie chegou ao nível 50', () => {
  const j = (especie, nivel) => ({ especie, nivel });
  const r = runsDeNivel([j('charmander', 50), j('charmander', 49), j('charmander', 72), j('pikachu', 60), j('pikachu', 10)]);
  assert.deepEqual(r, { charmander: 2, pikachu: 1 });
  assert.equal(ALVOS.gmaxNivel, 50);
  assert.equal(ALVOS.gmaxRuns, 25);
});

test('progresso diz o que já liberou e o quanto falta', () => {
  const jornadas = [{ especie: 'pikachu', nivel: 50, registro: { abates: {
    tipoAlvo: { fire: ALVOS.tera, water: 10 },
    especie: { gengar: ALVOS.mega },        // Gengar tem Mega: é o que faz a barra existir (conquistas.js)
    golpe: { thunderbolt: ALVOS.zGolpe, 'quick-attack': 3 },
    elemento: { electric: 5 }
  } } }];
  const p = progressoConquistas(jornadas, null);
  assert.equal(teraLiberada(p, 'fire'), true);
  assert.equal(teraLiberada(p, 'water'), false);
  assert.equal(teraLiberada(p, 'grass'), false);              // nunca derrotou nenhum: nem aparece na lista
  assert.equal(megaLiberada(p, 'gengar'), true);
  assert.equal(megaLiberada(p, 'pikachu'), false, 'espécie sem Mega não libera Mega');
  assert.equal(zLiberado(p, golpe('thunderbolt', 'electric')), true);
  assert.equal(zLiberado(p, golpe('quick-attack', 'normal')), false);
  assert.equal(gmaxLiberado(p, 'pikachu'), false);            // 1 run de 25
  // a lista vem ordenada do mais perto pro mais longe, com a fração pra barra de progresso
  assert.deepEqual(p.tera.map(x => x.chave), ['fire', 'water']);
  assert.equal(p.tera[1].fracao, 10 / ALVOS.tera);
});

test('o resumo da jornada LEVA os abates pra carreira (senão o contador zera ao terminar)', () => {
  // a cópia do registro em estatisticasDaJornada é uma lista branca: campo que não estiver lá some no fim da run.
  // Foi um bug real: os contadores subiam jogando e a carreira nunca recebia nada.
  const S = {
    player: { data: { speciesName: 'pikachu' }, level: 30, shiny: false }, registro: {}, wins: 1,
    chefes: {}, missoesFeitas: [], money: 0
  };
  registrarAbate(S, { porMim: true, tiposDoAlvo: ['fire'], minhaEspecie: 'pikachu', golpe: golpe('thunderbolt', 'electric') });
  const resumo = estatisticasDaJornada(S);
  assert.deepEqual(resumo.registro.abates.especie, { pikachu: 1 });
  assert.deepEqual(resumo.registro.abates.tipoAlvo, { fire: 1 });
  // e o progresso da carreira enxerga isso
  const p = progressoConquistas([{ dificuldade: 'hard', ...resumo }], null);
  assert.equal(p.abates.total, 1);
  assert.equal(p.tera[0].n, 1);
  // Pikachu não aparece na Mega de propósito: ele evolui pra Raichu, e quem megaevolui é a forma final
  assert.deepEqual(p.mega, []);
});

test('a run em andamento entra no progresso (não espera a jornada acabar)', () => {
  const emAndamento = { abates: { tipoAlvo: { fire: ALVOS.tera }, especie: {}, golpe: {}, elemento: {} } };
  assert.equal(teraLiberada(progressoConquistas([], emAndamento), 'fire'), true);
});
