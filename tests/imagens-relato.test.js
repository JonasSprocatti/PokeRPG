// Limites das imagens nos relatos (js/imagens-relato.js): "o equivalente a 2 prints" = até 2 imagens de até 2 MB.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_IMAGENS, MAX_BYTES_IMAGEM, MAX_BYTES_FILA, TIPOS_IMAGEM, motivoDeRecusa, cabeNaFila,
  podeAnexarImagem, MOTIVO_PRECISA_CONTA } from '../js/imagens-relato.js';

const arq = (o = {}) => ({ name: 'print.png', type: 'image/png', size: 500 * 1024, ...o });

/* Anexar print exige conta (auditoria de 29/09/2026): sem conta não há a quem amarrar o envio, e o bucket
   aceitava 2 MB de qualquer um, sem teto. O RELATO continua sem precisar de conta — é promessa da tela.
   A regra é cobrada em três lugares (tela, Ctrl+V e o envio), e todos leem daqui. */
test('anexar imagem exige conta; relatar, não', () => {
  assert.equal(podeAnexarImagem({ id: 'u1' }), true);
  for (const semConta of [null, undefined, false]) assert.equal(podeAnexarImagem(semConta), false);
  // o motivo é UM texto só: repetido com palavras diferentes em cada tela, o jogador desconfia do aviso
  assert.match(MOTIVO_PRECISA_CONTA, /conta/);
  assert.match(MOTIVO_PRECISA_CONTA, /sem conta/i, 'tem de dizer que o relato em si continua funcionando');
});

test('os limites são os do pedido: 2 imagens de 2 MB', () => {
  assert.equal(MAX_IMAGENS, 2);
  assert.equal(MAX_BYTES_IMAGEM, 2 * 1024 * 1024);
  assert.deepEqual(TIPOS_IMAGEM, ['image/png', 'image/jpeg', 'image/webp']);
});

test('um print normal entra; o limite de tamanho é por imagem e inclusivo', () => {
  assert.equal(motivoDeRecusa(arq()), null);
  assert.equal(motivoDeRecusa(arq({ size: MAX_BYTES_IMAGEM })), null, 'exatamente 2 MB ainda cabe');
  assert.match(motivoDeRecusa(arq({ size: MAX_BYTES_IMAGEM + 1 })), /limite/);
});

test('só cabem 2 por relato', () => {
  assert.equal(motivoDeRecusa(arq(), 1), null, 'a segunda cabe');
  assert.match(motivoDeRecusa(arq(), 2), /2 imagens/, 'a terceira não');
});

test('só imagem de verdade: PNG, JPG, WebP; nada de PDF, GIF ou arquivo vazio', () => {
  for (const t of TIPOS_IMAGEM) assert.equal(motivoDeRecusa(arq({ type: t })), null, t);
  for (const t of ['application/pdf', 'image/gif', 'text/html', '']) assert.match(motivoDeRecusa(arq({ type: t })), /PNG, JPG ou WebP/, t);
  assert.match(motivoDeRecusa(arq({ size: 0 })), /vazia/);
  assert.match(motivoDeRecusa(null), /inválido/);
});

test('a fila offline só leva as imagens se couberem no localStorage', () => {
  assert.equal(cabeNaFila([]), true);
  assert.equal(cabeNaFila([{ blob: { size: MAX_BYTES_FILA } }]), true);
  assert.equal(cabeNaFila([{ blob: { size: MAX_BYTES_FILA } }, { blob: { size: 1 } }]), false);
  assert.equal(cabeNaFila(undefined), true);
});
