// js/ads.js — o que dá pra testar sem DOM: o gate de configuração (mesmo padrão do Supabase em nuvem.js) e que
// blocoAds()/ativarSlots() nunca fazem nada sem conta configurada. O resto (banner, script, localStorage) precisa
// de DOM/localStorage de verdade, então fica de fora — mesmo recorte que o resto do projeto usa pra telas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adsConfigurado, blocoAds, ativarSlots, consentimento } from '../js/ads.js';

test('adsConfigurado: falso com o marcador do config.js, só vira true com um client id de verdade', () => {
  assert.equal(adsConfigurado(), false, 'ADSENSE_CLIENT_ID ainda é o marcador — sem conta configurada');
});

test('blocoAds: nunca desenha o slot sem conta configurada, nem que exista "consentimento" salvo', () => {
  assert.equal(blocoAds('123456'), '', 'sem ADSENSE_CLIENT_ID real, não desenha nada — mesmo com um slot válido');
});

test('ativarSlots: não lança e não mexe em window.adsbygoogle sem conta configurada', () => {
  assert.doesNotThrow(() => ativarSlots());
});

test('consentimento: sem localStorage (Node), nunca finge uma escolha que não existe', () => {
  assert.equal(consentimento(), null);
});
