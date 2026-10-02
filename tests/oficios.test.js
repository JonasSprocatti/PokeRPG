import test from 'node:test';
import assert from 'node:assert';
import { oficioDe, notasDeOficio, golpesDaEspecie, OFICIOS } from '../js/oficios.js';

/* Stats base reais da franquia + só os golpes das listas de `oficios.js` que a espécie realmente aprende.
   Cada caso aqui existe por um motivo: os três que o usuário citou ao pedir o modo (Aggron tanque, Miltank
   healer/tanque, Charizard mago de dano) e os extremos que quebram uma fórmula ingênua. */
const esp = (base, golpes = []) => ({ base, learnset: { list: golpes.map(name => ({ name, level: 1 })), extras: [] } });
const B = (hp, atk, def, spa, spd, spe) =>
  ({ hp, attack: atk, defense: def, 'special-attack': spa, 'special-defense': spd, speed: spe });

const AGGRON    = esp(B(70, 110, 180, 60, 60, 50), ['screech', 'metal-sound']);
const MILTANK   = esp(B(95, 80, 105, 40, 70, 100), ['heal-bell', 'milk-drink', 'attract', 'growl']);
const CHARIZARD = esp(B(78, 84, 78, 109, 85, 100), ['scary-face']);
const BLISSEY   = esp(B(255, 10, 10, 75, 135, 55), ['heal-bell', 'soft-boiled', 'wish', 'heal-pulse', 'life-dew', 'toxic', 'sing', 'charm', 'attract', 'light-screen', 'safeguard', 'helping-hand']);
const SHUCKLE   = esp(B(20, 10, 230, 10, 230, 5), ['rest', 'encore']);
const ALAKAZAM  = esp(B(55, 50, 45, 135, 95, 120), ['recover', 'heal-pulse', 'disable', 'reflect', 'light-screen']);
const SCIZOR    = esp(B(70, 130, 100, 55, 80, 65), ['agility']);
const SNORLAX   = esp(B(160, 110, 65, 65, 110, 30), ['rest', 'slack-off', 'yawn', 'curse']);
const ALOMOMOLA = esp(B(165, 75, 80, 40, 45, 65), ['wish', 'heal-pulse', 'life-dew', 'soft-boiled']);

test('os três casos que o usuário pediu', () => {
  assert.equal(oficioDe(AGGRON).maior, 'guardiao');
  assert.equal(oficioDe(MILTANK).nome, 'Curandeiro-Guardião');   // healer/tanque, nessa ordem
  assert.equal(oficioDe(CHARIZARD).nome, 'Arcano-Guerreiro');    // mago de dano, com instinto de briga
});

test('o learnset é o que separa o curandeiro do gordo que só se cura', () => {
  // Blissey e Snorlax têm perfil defensivo parecido; só uma das duas cura o TIME
  assert.equal(oficioDe(BLISSEY).maior, 'curandeiro');
  assert.equal(oficioDe(SNORLAX).maior, 'guardiao');
  assert.equal(notasDeOficio(SNORLAX.base, SNORLAX.learnset).curandeiro, -Infinity);
  assert.equal(oficioDe(ALOMOMOLA).maior, 'curandeiro');
});

test('stat alto não vira ofício errado: é a FRAÇÃO do total que manda', () => {
  // Shuckle (Def 230) e Aggron (Def 180) são os dois Guardião; Alakazam de BST 500 continua Arcano
  assert.equal(oficioDe(SHUCKLE).maior, 'guardiao');
  assert.equal(oficioDe(ALAKAZAM).maior, 'arcano');
  assert.equal(oficioDe(SCIZOR).maior, 'guerreiro');
  // a Def do Aggron (180) é maior que a SpA do Charizard (109) e NÃO tira dele o posto de Arcano
  assert.equal(oficioDe(CHARIZARD).maior, 'arcano');
});

test('a perícia vem do ofício maior, e o rótulo tem emoji', () => {
  const o = oficioDe(AGGRON);
  assert.deepEqual(o.pericias, OFICIOS.guardiao.pericias);
  assert.equal(o.emoji, '🛡');
});

test('empate resolve pela ordem da tabela — o mesmo bicho não troca de ofício entre dois saves', () => {
  const chato = esp(B(100, 100, 100, 100, 100, 100));
  assert.equal(oficioDe(chato).maior, oficioDe(chato).maior);
  /* Com os seis stats iguais, os três ofícios de stat empatam na mesma nota (1.3 × a fração): a média de dois
     valores iguais é o próprio valor, e os coeficientes fecham igual nos três. Quem decide é a ordem de OFICIOS. */
  const n = notasDeOficio(chato.base, chato.learnset);
  assert.equal(n.arcano, n.guerreiro);
  assert.equal(n.guardiao, n.arcano);
  assert.equal(oficioDe(chato).maior, 'guardiao');   // guardiao precede arcano e guerreiro em OFICIOS
});

test('ofício sem nenhum golpe da lista não concorre', () => {
  const n = notasDeOficio(AGGRON.base, AGGRON.learnset);
  assert.equal(n.curandeiro, -Infinity);
  assert.equal(n.bardo, -Infinity);
  assert.ok(n.encantador > 0);   // Aggron aprende Screech e Metal Sound
});

test('espécie sem stats não estoura: devolve null', () => {
  assert.equal(notasDeOficio(undefined, undefined), null);
  assert.equal(oficioDe({}), null);
  assert.equal(oficioDe(null), null);
});

test('golpesDaEspecie junta nível e MT/tutor/herança', () => {
  const g = golpesDaEspecie({ list: [{ name: 'tackle' }], extras: [{ name: 'toxic' }, { name: 'tackle' }] });
  assert.deepEqual([...g].sort(), ['tackle', 'toxic']);
  assert.equal(golpesDaEspecie(undefined).size, 0);
});
