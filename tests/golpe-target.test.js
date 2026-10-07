/* O `target` do golpe (quem ele alcança) é o que faz Earthquake e Rock Slide pegarem o grupo — e ele atravessa
   TRÊS camadas antes de chegar no motor: a API vira cache (`api.loadMove`), o cache vira cópia dentro do save
   (`S.player.moves`), e o save volta no boot. O bug de 07/10/2026 foi a camada do meio não ter guarda nenhuma:
   `loadMove` era `cached(chave, loader)` sem `valido`, então golpe guardado antes de `target` existir no
   `slimMove` (21/09/2026) voltava sem o campo **pra sempre**. Enquanto todo golpe batia num alvo só isso não
   custava nada; no dia em que a área passou a ler `g.target`, Rock Slide continuou pegando um inimigo só na cara
   de quem já jogava, calado.
   Este arquivo tranca as duas pontas do conserto. Sem rede: o que exige rede é o caminho feliz, e esse já é
   coberto por `tests/golpe-area.test.js` com `target` presente. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { slimMove } from '../js/api.js';
import { completarAlvosDoSave } from '../js/pokemon.js';

const API_SRC = readFileSync(new URL('../js/api.js', import.meta.url), 'utf8');

test('slimMove sempre produz um target (a origem do dado não pode ser a fonte do buraco)', () => {
  assert.equal(slimMove({ name: 'rock-slide', type: { name: 'rock' }, target: { name: 'all-opponents' } }).target, 'all-opponents');
  // golpe cujo JSON não traz `target`: cai no alvo único, nunca em `undefined`
  assert.equal(slimMove({ name: 'x', type: { name: 'normal' } }).target, 'selected-pokemon');
});

test('loadMove exige `target` no registro guardado (senão o cache velho nunca se conserta)', () => {
  // Teste de FONTE de propósito: `cached` é interno e o `valido` não é observável de fora sem rede. O que
  // precisa ser impossível é alguém voltar `loadMove` a não ter guarda — foi exatamente assim que o bug nasceu.
  const linha = API_SRC.split('\n').find(l => l.includes('export const loadMove'));
  assert.ok(linha, 'loadMove sumiu ou mudou de forma');
  const bloco = API_SRC.slice(API_SRC.indexOf(linha), API_SRC.indexOf(linha) + 400);
  assert.match(bloco, /v\s*=>[^;]*target/, 'loadMove precisa de um `valido` que confira `target`');
});

test('completarAlvosDoSave: save completo não pede nada (o caso normal não pode virar requisição por boot)', async () => {
  const g = (name, target) => ({ name, target, type: 'normal', cls: 'physical', power: 40, pp: 10, ppLeft: 10, meta: {}, stats: [] });
  const S = {
    player: { moves: [g('tackle', 'selected-pokemon'), g('rock-slide', 'all-opponents')] },
    aliados: [{ moves: [g('surf', 'all-other-pokemon')] }],
    esconderijo: [{ moves: [g('growl', 'all-opponents')] }]
  };
  // sem rede disponível no teste: se tentasse buscar, estouraria ou travaria — devolver 0 na hora é o contrato
  assert.equal(await completarAlvosDoSave(S), 0);
});

test('completarAlvosDoSave aguenta save torto sem estourar (é código de boot)', async () => {
  // roda antes de qualquer tela; um save estranho não pode impedir o jogo de abrir
  assert.equal(await completarAlvosDoSave(null), 0);
  assert.equal(await completarAlvosDoSave({}), 0);
  assert.equal(await completarAlvosDoSave({ player: null, aliados: null, esconderijo: undefined }), 0);
  assert.equal(await completarAlvosDoSave({ player: { moves: [null, {}] } }), 0);  // golpe sem `name`: nada a buscar
});
