/* ⚔ Saga: o lado inimigo virou LISTA (`B.inimigos` + `B.foco`), com `B.enemy` como getter.
   O que este arquivo protege é a espinha dorsal dessa mudança: 50 pontos do jogo leem `B.enemy`, e se o getter
   deixar de apontar pro inimigo em foco o jogo mostra um e aplica dano em outro — o pior tipo de bug, porque a
   tela fica plausível. `estado.js` é importável no Node (não tem DOM). */
import test from 'node:test';
import assert from 'node:assert';
import { ligarInimigos } from '../js/estado.js';
import { tamanhoDoGrupo, GRUPO_MAX } from '../js/regras.js';

const foe = (name, hp = 10) => ({ name, hp, vol: {} });

test('enemy é o inimigo em foco, sempre', () => {
  const B = ligarInimigos({ turn: 1 }, [foe('a'), foe('b'), foe('c')]);
  assert.equal(B.enemy.name, 'a');
  B.foco = 2;
  assert.equal(B.enemy.name, 'c');
  // escrever em B.enemy move o FOCO (é o que a troca de Pokémon do treinador faz)
  B.enemy = B.inimigos[1];
  assert.equal(B.foco, 1);
  assert.equal(B.enemy.name, 'b');
});

test('dano aplicado via enemy aparece no array (não são dois objetos)', () => {
  const B = ligarInimigos({}, [foe('a', 30), foe('b', 30)]);
  B.foco = 1;
  B.enemy.hp -= 10;
  assert.equal(B.inimigos[1].hp, 20);
  assert.equal(B.inimigos[0].hp, 30);
});

test('foco fora da faixa não devolve undefined', () => {
  const B = ligarInimigos({ foco: 9 }, [foe('único')]);
  assert.equal(B.foco, 0);
  assert.equal(B.enemy.name, 'único');
  B.foco = 5;                       // mexido à mão (save corrompido, bug futuro)
  assert.equal(B.enemy.name, 'único');   // cai no primeiro em vez de estourar
});

test('um inimigo só: o caso de todos os outros modos continua idêntico', () => {
  const B = ligarInimigos({ turn: 3 }, [foe('solo', 25)]);
  assert.equal(B.inimigos.length, 1);
  assert.equal(B.enemy.name, 'solo');
  B.enemy.hp = 0;
  assert.equal(B.inimigos[0].hp, 0);
});

test('o grupo cresce com o avanço da rota, e nunca passa do teto da cena', () => {
  // sorteio fixado nos dois extremos — nunca por amostragem (defeito fantasma no CI)
  for (const i of [0, 1, 2]) {
    assert.equal(tamanhoDoGrupo(i, () => 0), 1, `rota ${i} pode ser 1×1`);
    assert.equal(tamanhoDoGrupo(i, () => 0.999), 2, `rota ${i} no máximo em dupla`);
  }
  for (const i of [3, 5, 9]) {
    assert.equal(tamanhoDoGrupo(i, () => 0), 2, `rota ${i} nunca vem sozinho`);
    assert.equal(tamanhoDoGrupo(i, () => 0.999), GRUPO_MAX, `rota ${i} chega no teto`);
  }
  // índice inválido (rota que saiu do mapa) não vira grupo de 0 nem NaN
  assert.ok(tamanhoDoGrupo(-1, () => 0.5) >= 1);
  assert.ok(tamanhoDoGrupo(undefined, () => 0.5) >= 1);
});
