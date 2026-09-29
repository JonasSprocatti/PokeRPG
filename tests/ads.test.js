// js/ads.js — o que dá pra testar sem DOM: o gate de configuração (mesmo padrão do Supabase em nuvem.js) e que
// blocoAds()/ativarSlots() nunca fazem nada sem uma unidade de anúncio de verdade. O resto (banner, sinal de
// consentimento, localStorage) precisa de DOM/localStorage, então fica de fora — mesmo recorte que o resto do
// projeto usa pra telas. A conferência de que o publisher ID é o MESMO em config.js, index.html e ads.txt está em
// tests/paginas.test.js, junto com o resto do que o AdSense cobra do site.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adsConfigurado, blocoAds, ativarSlots, consentimento } from '../js/ads.js';
import { ADSENSE_CLIENT_ID, AD_SLOT_INICIO, AD_SLOT_GUIA } from '../js/config.js';

test('o publisher ID está preenchido e no formato que o Google usa', () => {
  assert.equal(adsConfigurado(), true, 'ADSENSE_CLIENT_ID voltou a ser o marcador? então o AdSense está desligado');
  assert.match(ADSENSE_CLIENT_ID, /^ca-pub-\d{16}$/, 'formato do publisher ID: ca-pub- + 16 dígitos');
});

/* O estado de hoje: conta ligada, nenhuma unidade de anúncio criada (elas só existem depois da aprovação). É
   proposital — o site carrega o código do AdSense e não exibe anúncio nenhum, que é o que a revisão precisa
   encontrar. Este teste existe pra que preencher um slot seja uma decisão consciente, não um acidente. */
test('sem unidade de anúncio, nenhum slot é desenhado', () => {
  assert.equal(blocoAds(AD_SLOT_INICIO), '', 'AD_SLOT_INICIO vazio tem de resultar em nada na tela');
  assert.equal(blocoAds(''), '');
  assert.equal(blocoAds(undefined), '');
  if (AD_SLOT_INICIO || AD_SLOT_GUIA) console.log('  (slot preenchido em config.js — os anúncios estão no ar)');
});

test('blocoAds com um slot de verdade monta o <ins> com o client e o slot certos', () => {
  const html = blocoAds('1234567890');
  assert.match(html, /<ins class="adsbygoogle"/);
  assert.match(html, new RegExp(`data-ad-client="${ADSENSE_CLIENT_ID}"`));
  assert.match(html, /data-ad-slot="1234567890"/);
});

test('ativarSlots: sem DOM (Node) não lança nem mexe em window.adsbygoogle', () => {
  assert.doesNotThrow(() => ativarSlots());
});

test('consentimento: sem localStorage (Node), nunca finge uma escolha que não existe', () => {
  assert.equal(consentimento(), null);
});
