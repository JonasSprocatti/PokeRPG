/* Terastalização — a parte que decide a luta são as duas contas de tipo (js/regras.js), e elas são puras.
   `js/tera.js` em si é quase só o gatilho: o que importa testar é que terastalizar muda mesmo o dano, nos dois
   sentidos, e que a conta antiga continua valendo pra quem não terastalizou. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tiposDefensivos, multStab, typeEff, calcDamage, calcStats, freshVol } from '../js/regras.js';
import { TYPE_PT } from '../js/dados.js';

const mon = (types, extra = {}) => {
  const data = { types, base: { hp: 80, attack: 100, defense: 80, 'special-attack': 100, 'special-defense': 80, speed: 80 } };
  const m = { level: 50, data, ivs: {}, evs: {}, nature: 'hardy', ability: '', status: null, vol: freshVol(), ...extra };
  m.stats = calcStats(m); m.hp = m.stats.hp;
  return m;
};

test('sem Tera, nada muda: defende pelos tipos originais e o STAB é o de sempre', () => {
  const m = mon(['fire', 'flying']);
  assert.deepEqual(tiposDefensivos(m), ['fire', 'flying']);
  assert.equal(multStab(m, 'fire'), 1.5, 'tipo original: STAB');
  assert.equal(multStab(m, 'water'), 1, 'tipo de fora: sem STAB');
  assert.equal(multStab(m, 'fire', 2), 2, 'Adaptability continua valendo');
});

test('terastalizado defende por UM tipo só', () => {
  const charizard = mon(['fire', 'flying'], { tera: 'water' });
  assert.deepEqual(tiposDefensivos(charizard), ['water']);
  // é o ponto da mecânica: Charizard morre pra Pedra (4×) e, Tera Água, deixa de morrer
  assert.equal(typeEff('rock', ['fire', 'flying']), 4);
  assert.equal(typeEff('rock', tiposDefensivos(charizard)), 2);
});

test('STAB do Tera: 2.0 só quando o Tera casa com um tipo que você já tinha', () => {
  const casou = mon(['fire', 'flying'], { tera: 'fire' });
  assert.equal(multStab(casou, 'fire'), 2, 'Tera igual a um tipo original: o prêmio');
  assert.equal(multStab(casou, 'flying'), 1.5, 'o outro tipo original não perde o STAB');
  assert.equal(multStab(casou, 'water'), 1);

  const trocou = mon(['fire', 'flying'], { tera: 'water' });
  assert.equal(multStab(trocou, 'water'), 1.5, 'Tera de fora: STAB normal');
  assert.equal(multStab(trocou, 'fire'), 1.5, 'e o STAB antigo continua');
  assert.equal(multStab(trocou, 'grass'), 1);
});

// `Math.random` fixo: a rolagem de 85–100% do dano é o único acaso aqui, e comparar dano com ela solta daria
// teste instável. Mesmo padrão dos testes de calcDamage em regras.test.js.
test('o dano calculado muda de verdade ao terastalizar', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const golpePedra = { name: 'rock-slide', type: 'rock', cls: 'physical', power: 75, meta: {} };
  const atacante = mon(['rock']);
  const normal = calcDamage(atacante, mon(['fire', 'flying']), golpePedra);
  const comTera = calcDamage(atacante, mon(['fire', 'flying'], { tera: 'water' }), golpePedra);
  assert.ok(comTera.dmg < normal.dmg, `Tera Água devia sofrer menos de Pedra (${comTera.dmg} vs ${normal.dmg})`);

  // e do lado ofensivo: o mesmo golpe bate mais forte quando o Tera casa com o tipo dele
  const golpeFogo = { name: 'flamethrower', type: 'fire', cls: 'special', power: 90, meta: {} };
  const alvo = () => mon(['normal']);
  const semTera = calcDamage(mon(['fire']), alvo(), golpeFogo);
  const comCasamento = calcDamage(mon(['fire'], { tera: 'fire' }), alvo(), golpeFogo);
  assert.ok(comCasamento.dmg > semTera.dmg, `Tera Fogo num Fogo devia bater mais (${comCasamento.dmg} vs ${semTera.dmg})`);
});

test('todo tipo do jogo pode ser Tera (a conquista é por tipo)', () => {
  for (const t of Object.keys(TYPE_PT)) {
    const m = mon(['normal'], { tera: t });
    assert.deepEqual(tiposDefensivos(m), [t], t);
  }
});
