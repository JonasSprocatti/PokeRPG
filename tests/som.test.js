/* Som (js/som.js). O motor de áudio em si não dá pra testar aqui (não há navegador), mas o que pode apodrecer em
   SILÊNCIO dá: a trilha de cada rota é escolhida pelo bioma de `cenario.climaDaRota`, e bioma sem faixa própria
   cai no tema padrão sem avisar ninguém — a rota nova simplesmente soaria genérica pra sempre. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMAS } from '../js/som.js';
import { CLIMAS, climaDaRota } from '../js/cenario.js';
import { GENS } from '../js/dados-mapas.js';

test('todo bioma de cenario.js tem uma faixa em som.TEMAS', () => {
  const semFaixa = CLIMAS.map(c => c.id).filter(id => !TEMAS[id]);
  assert.deepEqual(semFaixa, [], `bioma sem trilha própria (cairia no padrão calado): ${semFaixa.join(', ')}`);
});

test('toda rota do jogo resolve num tema conhecido', () => {
  const rotas = GENS.flatMap(g => g.rotas);
  assert.ok(rotas.length > 90, 'esperava as ~99 rotas do jogo');
  for (const r of rotas) assert.ok(TEMAS[climaDaRota(r).id], `${r.id} caiu num tema sem faixa`);
});

/* A queixa que gerou esta leva foi "som agudo demais": antes a melodia saía em `raiz + escala + 24` com raiz 62,
   o que chega perto de 2 kHz. O teto agora é `raiz + escala + 12`, e as raízes moram entre 48 e 57. */
test('nenhuma faixa pode gerar nota acima de 880 Hz (o teto de agudo combinado)', () => {
  const freq = m => 440 * 2 ** ((m - 69) / 12);
  for (const [id, t] of Object.entries(TEMAS)) {
    const maisAgudo = t.raiz + Math.max(...t.escala) + 12;   // a oitava mais alta que o gerador usa
    assert.ok(freq(maisAgudo) <= 880, `${id}: chega a ${Math.round(freq(maisAgudo))} Hz`);
    assert.ok(t.raiz >= 48 && t.raiz <= 57, `${id}: raiz ${t.raiz} fora da faixa grave combinada`);
    assert.equal(t.acordes.length, 4, `${id}: a progressão é de 4 compassos`);
  }
});
