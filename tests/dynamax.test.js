/* Gigantamax: o perigo aqui é o HP. O Pokémon fica com o teto dobrado durante 3 turnos e `stats` vai junto no
   save — se a volta ao normal falhar, ele fica gigante pra sempre. Por isso o ir-e-volta é o que mais importa. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gigantamaxar, passarDynamax, desfazerDynamax } from '../js/dynamax.js';
import { poderMax, MULT_HP_DYNAMAX, TURNOS_DYNAMAX, calcDamage, calcStats, freshVol } from '../js/regras.js';

const mon = (extra = {}) => {
  const data = { types: ['normal'], base: { hp: 80, attack: 100, defense: 80, 'special-attack': 100, 'special-defense': 80, speed: 80 } };
  // IVs/EVs completos: com `{}` o calcStats soma undefined e todos os atributos viram NaN
  const cheio = v => Object.fromEntries(Object.keys(data.base).map(s => [s, v]));
  const m = { level: 50, data, ivs: cheio(31), evs: cheio(0), nature: 'hardy', ability: '', status: null, vol: freshVol(), ...extra };
  m.stats = calcStats(m); m.hp = m.stats.hp;
  return m;
};

test('a tabela do Max sobe sempre e é mais modesta que a do Z', () => {
  assert.equal(poderMax(40), 90);
  assert.equal(poderMax(60), 110);
  assert.equal(poderMax(90), 130);
  assert.equal(poderMax(250), 150, 'teto');
  let anterior = 0;
  for (let p = 0; p <= 260; p += 5) { const v = poderMax(p); assert.ok(v >= anterior, `${p} → ${v}`); anterior = v; }
  // o Max vale 3 turnos; o Z é um tiro só. Se o Max chegasse no patamar do Z, a escolha perderia a graça
  assert.ok(poderMax(150) < 200);
});

test('gigantamaxar dobra o teto e a vida atual junto', () => {
  const m = mon();
  const cheio = m.stats.hp;
  gigantamaxar(m);
  assert.equal(m.stats.hp, Math.floor(cheio * MULT_HP_DYNAMAX));
  assert.equal(m.hp, m.stats.hp, 'quem estava com a vida cheia continua com a vida cheia');
  assert.equal(m.dyna.turnos, TURNOS_DYNAMAX);
  assert.equal(gigantamaxar(m), null, 'não gigantamaxa duas vezes');
});

test('encolhe sozinho depois dos turnos, e o dano sofrido não some na conta', () => {
  const m = mon();
  const cheio = m.stats.hp;
  gigantamaxar(m);
  m.hp = Math.floor(m.stats.hp * 0.5);                 // levou metade do HP gigante
  for (let i = 1; i < TURNOS_DYNAMAX; i++) assert.equal(passarDynamax(m), 'segue', `turno ${i}`);
  assert.equal(passarDynamax(m), 'acabou');
  assert.equal(m.dyna, undefined);
  assert.equal(m.stats.hp, cheio, 'o teto volta ao que era');
  // a PROPORÇÃO é mantida: estava com metade gigante, volta com metade normal
  assert.ok(Math.abs(m.hp - cheio * 0.5) <= 1, `${m.hp} de ${cheio}`);
  assert.equal(passarDynamax(m), null, 'depois de encolher, passar turno não faz nada');
});

test('desfazer no fim da batalha nunca deixa o teto dobrado (nem mata quem estava vivo)', () => {
  const m = mon();
  const cheio = m.stats.hp;
  gigantamaxar(m);
  m.hp = 1;
  desfazerDynamax(m);
  assert.equal(m.stats.hp, cheio);
  assert.ok(m.hp >= 1, 'quem estava vivo continua vivo mesmo com a proporção arredondando pra zero');
  assert.equal(desfazerDynamax(mon()), null, 'quem não gigantamaxou é ignorado');
});

test('gigante bate mais forte (regras.poderMax entra no dano)', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const golpe = { name: 'g', type: 'fire', cls: 'physical', power: 60, meta: {} };
  const normal = calcDamage(mon(), mon(), golpe);
  const gigante = mon(); gigantamaxar(gigante);
  assert.ok(calcDamage(gigante, mon(), golpe).dmg > normal.dmg);
});
