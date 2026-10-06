/* O treinador trocando de Pokémon por ESCOLHA (pedido do usuário, 06/10/2026).
   Até aqui a troca do lado de lá só acontecia EMPURRADA (Roar, Cartão Vermelho) ou quando alguém caía. A conta é
   pura (regras.notaDeConfronto / trocaDoTreinador); quem tira de campo é batalha.forcarSaida({ para }). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notaDeConfronto, trocaDoTreinador, MAX_TROCAS_TREINADOR, GANHO_PRA_TROCAR, HP_PRA_TROCAR } from '../js/regras.js';

const golpe = (type, cls = 'physical') => ({ name: type + '-hit', type, cls, power: 80, ppLeft: 10, pp: 10 });
const mon = (tipos, golpes, o = {}) => ({
  name: tipos.join('-'), level: 50, data: { types: tipos }, status: null,
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, moves: golpes, vol: {}, ...o
});

test('notaDeConfronto: devolve menos do que toma = nota negativa', () => {
  const agua = mon(['water'], [golpe('water')]);
  const fogo = mon(['fire'], [golpe('fire')]);
  // Água bate ×2 em Fogo e toma ×0,5: devolve 2, toma 0,5 → +1,5
  assert.equal(notaDeConfronto(agua, fogo), 1.5);
  assert.equal(notaDeConfronto(fogo, agua), -1.5);
  // espelho: a conta de um é o negativo da do outro quando os dois só têm o golpe do próprio tipo
  assert.equal(notaDeConfronto(agua, fogo), -notaDeConfronto(fogo, agua));
});

test('notaDeConfronto lê o GOLPE, não o tipo do Pokémon', () => {
  const alvo = mon(['fire'], [golpe('normal')]);
  const comAgua = mon(['water'], [golpe('water')]);
  const semAgua = mon(['water'], [golpe('normal')]);   // Água que não tem golpe de Água não ameaça o Fogo
  assert.ok(notaDeConfronto(comAgua, alvo) > notaDeConfronto(semAgua, alvo));
});

test('sem golpe de dano com PP, a conta usa eficácia neutra (Struggle)', () => {
  const vazio = mon(['water'], [{ ...golpe('water'), ppLeft: 0 }, { name: 'growl', type: 'normal', cls: 'status', ppLeft: 10, pp: 10 }]);
  const fogo = mon(['fire'], [golpe('fire')]);
  // ele devolve 1 (Struggle) e toma 0,5 (Fogo em Água) → +0,5
  assert.equal(notaDeConfronto(vazio, fogo), 0.5);
});

test('troca quando o banco melhora o confronto o bastante, e não quando a melhora é pequena', () => {
  const meuFogo = mon(['fire'], [golpe('fire')]);
  // Planta toma ×2 do Fogo e devolve ×0,5 → nota −1,5. A Água devolve ×2 e toma ×0,5 → +1,5. Ganho de 3.
  const equipe = [mon(['grass'], [golpe('grass')]), mon(['water'], [golpe('water')])];
  assert.equal(trocaDoTreinador(equipe, 0, meuFogo), 1, 'sai da Planta e manda a Água');
  // dois do mesmo confronto: não há o que ganhar, fica quem está
  const iguais = [mon(['grass'], [golpe('grass')]), mon(['grass'], [golpe('grass')])];
  assert.equal(trocaDoTreinador(iguais, 0, meuFogo), -1);
  /* O limiar é "melhora de PELO MENOS GANHO_PRA_TROCAR". Aqui a Planta de golpe Normal melhora só 0,5 (passa de
     −1,5 para −1: devolve neutro em vez de resistido, mas continua tomando ×2) — não paga o turno gasto. */
  assert.equal(GANHO_PRA_TROCAR, 1.5);
  const quaseIgual = [mon(['grass'], [golpe('grass')]), mon(['grass'], [golpe('normal')])];
  assert.equal(notaDeConfronto(quaseIgual[1], meuFogo) - notaDeConfronto(quaseIgual[0], meuFogo), 0.5);
  assert.equal(trocaDoTreinador(quaseIgual, 0, meuFogo), -1, 'melhora de 0,5 não paga o turno');
  // melhora de exatamente o limiar JÁ vale (é ">=", não ">")
  const naLinha = [mon(['grass'], [golpe('grass')]), mon(['grass'], [golpe('water')])];
  assert.equal(notaDeConfronto(naLinha[1], meuFogo) - notaDeConfronto(naLinha[0], meuFogo), GANHO_PRA_TROCAR);
  assert.equal(trocaDoTreinador(naLinha, 0, meuFogo), 1);
});

test('o teto de trocas é da luta inteira', () => {
  const meuFogo = mon(['fire'], [golpe('fire')]);
  const equipe = [mon(['grass'], [golpe('grass')]), mon(['water'], [golpe('water')])];
  assert.equal(trocaDoTreinador(equipe, 0, meuFogo, MAX_TROCAS_TREINADOR - 1), 1, 'na última troca ainda vale');
  assert.equal(trocaDoTreinador(equipe, 0, meuFogo, MAX_TROCAS_TREINADOR), -1, 'no teto, para');
  assert.equal(trocaDoTreinador(equipe, 0, meuFogo, MAX_TROCAS_TREINADOR + 5), -1);
});

test('com o HP no fim ele troca por qualquer melhora, nem que seja pequena', () => {
  const meuFogo = mon(['fire'], [golpe('fire')]);
  const ferido = mon(['grass'], [golpe('grass')], { hp: Math.floor(100 * HP_PRA_TROCAR) - 1 });
  // melhora de 1,5 (não basta com HP cheio, como o teste acima prova) passa a bastar com o HP no fim
  const equipe = [ferido, mon(['grass'], [golpe('water')])];
  assert.equal(trocaDoTreinador(equipe, 0, meuFogo), 1);
  // mas nem com HP baixo ele troca por um confronto IGUAL ou pior
  const semSaida = [ferido, mon(['grass'], [golpe('grass')])];
  assert.equal(trocaDoTreinador(semSaida, 0, meuFogo), -1);
});

test('nunca escolhe quem caiu, nem o próprio atual, nem troca sem oponente de pé', () => {
  const meuFogo = mon(['fire'], [golpe('fire')]);
  const equipe = [mon(['grass'], [golpe('grass')]), mon(['water'], [golpe('water')], { hp: 0 })];
  assert.equal(trocaDoTreinador(equipe, 0, meuFogo), -1, 'o único confronto bom está desmaiado');
  assert.equal(trocaDoTreinador([mon(['grass'], [golpe('grass')], { hp: 0 })], 0, meuFogo), -1, 'o atual já caiu');
  assert.equal(trocaDoTreinador(equipe, 0, { ...meuFogo, hp: 0 }), -1, 'o oponente caiu: o turno vai acabar de outro jeito');
  assert.equal(trocaDoTreinador(undefined, 0, meuFogo), -1);
});
