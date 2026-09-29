/* js/consent.js — o script de Consent Mode v2 que roda no <head>, antes do script do AdSense. Ele não é módulo
   (não dá pra importar), então o teste o executa num sandbox com um `window` e um `localStorage` de mentirinha e
   confere o que foi empurrado pro dataLayer. Vale o esforço porque um erro aqui é invisível: o jogo continua
   funcionando igual, e o que quebra é a promessa de privacidade — anúncio personalizado sem consentimento, ou
   consentimento dado que nunca chega ao Google. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const CODIGO = readFileSync(new URL('../js/consent.js', import.meta.url), 'utf8');

// Roda o consent.js com o valor que estiver no localStorage e devolve o que foi empurrado pro dataLayer.
function executar(valorSalvo) {
  const janela = {};
  const ctx = createContext({
    window: janela,
    localStorage: { getItem: () => (valorSalvo === undefined ? null : valorSalvo) }
  });
  runInContext(CODIGO, ctx);
  return { chamadas: janela.dataLayer.map(a => Array.from(a)), gtag: janela.gtag };
}

test('sem escolha salva, o consentimento vai como negado (e nada mais)', () => {
  const { chamadas, gtag } = executar(undefined);
  assert.equal(typeof gtag, 'function', 'o gtag tem de ficar global — js/ads.js o usa pra atualizar depois');
  assert.equal(chamadas.length, 1, 'só o default: quem nunca respondeu não pode virar "granted" sozinho');
  const [comando, tipo, estado] = chamadas[0];
  assert.deepEqual([comando, tipo], ['consent', 'default']);
  for (const chave of ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'])
    assert.equal(estado[chave], 'denied', `${chave} tem de começar negado`);
  assert.equal(estado.wait_for_update, 500, 'sem a espera, o Google decide antes de o banner responder');
});

test('quem já aceitou é atendido na hora, antes do script do Google rodar', () => {
  // store.set (js/util.js) serializa em JSON, então no localStorage está com aspas — é o formato que importa aqui
  const { chamadas } = executar('"aceito"');
  assert.equal(chamadas.length, 2);
  assert.deepEqual(chamadas[1].slice(0, 2), ['consent', 'update']);
  for (const chave of ['ad_storage', 'ad_user_data', 'ad_personalization'])
    assert.equal(chamadas[1][2][chave], 'granted');
});

test('quem recusou continua negado, e um valor estranho não vira consentimento', () => {
  for (const v of ['"recusado"', 'aceito', 'null', '{lixo', '']) {
    const { chamadas } = executar(v);
    assert.equal(chamadas.length, 1, `valor ${JSON.stringify(v)} não pode resultar em "granted"`);
  }
});
