/* Z-Move: a parte que muda a luta é a conversão do poder (regras.poderZ), e ela é pura.
   O resto (`zmove.js`) depende de batalha e da conta; o que dá pra travar aqui é a tabela e o efeito no dano. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { poderZ, calcDamage, calcStats, freshVol } from '../js/regras.js';

const mon = (extra = {}) => {
  const data = { types: ['normal'], base: { hp: 80, attack: 100, defense: 80, 'special-attack': 100, 'special-defense': 80, speed: 80 } };
  // IVs/EVs completos: com `{}` o calcStats soma undefined e todos os atributos viram NaN
  const cheio = v => Object.fromEntries(Object.keys(data.base).map(s => [s, v]));
  const m = { level: 50, data, ivs: cheio(31), evs: cheio(0), nature: 'hardy', ability: '', status: null, vol: freshVol(), ...extra };
  m.stats = calcStats(m); m.hp = m.stats.hp;
  return m;
};
const golpe = (power, extra = {}) => ({ name: 'g', type: 'fire', cls: 'physical', power, meta: {}, ...extra });

test('a tabela do Z sobe sempre e achata no topo', () => {
  // golpe fraco ganha muito; golpe que já é forte ganha pouco — é o que faz a escolha do Z importar
  assert.equal(poderZ(40), 100);
  assert.equal(poderZ(60), 120);
  assert.equal(poderZ(90), 175);
  assert.equal(poderZ(120), 190);
  assert.equal(poderZ(250), 200, 'teto');
  assert.equal(poderZ(0), 100, 'golpe sem poder não quebra a conta');
  // nunca desce quando o poder de base sobe
  let anterior = 0;
  for (let p = 0; p <= 260; p += 5) { const z = poderZ(p); assert.ok(z >= anterior, `${p} → ${z}`); anterior = z; }
  // e o Z nunca enfraquece um golpe que já era mais forte que a tabela... exceto onde a tabela é o teto
  assert.ok(poderZ(60) > 60 && poderZ(100) > 100);
});

test('vol.zAtivo converte o poder no dano, e só no turno em que está ligado', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const alvo = () => mon();
  const normal = calcDamage(mon(), alvo(), golpe(60));
  const comZ = calcDamage(mon({ vol: { ...freshVol(), zAtivo: true } }), alvo(), golpe(60));
  assert.ok(comZ.dmg > normal.dmg * 1.5, `Z de um golpe 60 devia bater bem mais (${comZ.dmg} vs ${normal.dmg})`);
  // desligado de novo: volta ao dano de sempre (o flag é apagado no fim do turno, em batalha.turn)
  assert.equal(calcDamage(mon(), alvo(), golpe(60)).dmg, normal.dmg);
});
