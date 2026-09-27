/* ============ anúncios (Google AdSense) ============ */
// Gate igual ao Supabase (config.js): sem ADSENSE_CLIENT_ID de verdade, nada aqui faz nada — nenhum script
// carrega, nenhum slot desenha, nenhum banner aparece. Mesmo com a conta configurada, o script do Google só
// carrega DEPOIS que o jogador aceita no banner de cookies: é o que a política de consentimento da UE (GDPR)
// exige — consentimento ANTES do script, não "banner que some sozinho".
import { ADSENSE_CLIENT_ID } from './config.js';
import { store } from './util.js';

export const adsConfigurado = () => !!ADSENSE_CLIENT_ID && !ADSENSE_CLIENT_ID.includes('XXXX');

const CHAVE_CONSENTIMENTO = 'pokerpg-consentimento-ads';
// 'aceito' | 'recusado' | null (ainda não perguntou, ou perguntou numa versão anterior do jogo)
export const consentimento = () => store.get(CHAVE_CONSENTIMENTO);

function carregarScript() {
  if (!adsConfigurado() || document.getElementById('script-adsense')) return;
  const s = document.createElement('script');
  s.id = 'script-adsense'; s.async = true; s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
  document.head.appendChild(s);
}

let bannerEl = null;
function fecharBanner() { bannerEl?.remove(); bannerEl = null; }

export function definirConsentimento(v) {
  store.set(CHAVE_CONSENTIMENTO, v);
  fecharBanner();
  if (v === 'aceito') carregarScript();
}

/* Chamado uma vez no boot (main.js), depois de a tela inicial já estar desenhada. Não é modal: fica um rodapé
   fixo, sem travar o jogo — nada de anúncio carrega até o jogador responder, então não tem pressa nenhuma em
   travar a tela pra isso. Se ele já respondeu antes (mesmo navegador), não pergunta de novo. */
export function iniciarAds() {
  if (!adsConfigurado()) return;
  const c = consentimento();
  if (c === 'aceito') { carregarScript(); return; }
  if (c === 'recusado') return;
  mostrarBanner();
}
function mostrarBanner() {
  if (bannerEl || !document.body) return;
  bannerEl = document.createElement('div');
  bannerEl.className = 'cookie-banner';
  bannerEl.innerHTML = `<p>Este site usa cookies de anúncio pra ajudar a manter o jogo de graça.
      <button type="button" class="link" data-act="privacidade">Ver a política de privacidade</button></p>
    <div class="choices">
      <button type="button" class="btn ghost sm" data-v="recusado">Recusar</button>
      <button type="button" class="btn sm" data-v="aceito">Aceitar</button>
    </div>`;
  bannerEl.addEventListener('click', e => {
    const b = e.target.closest('[data-v]');
    if (b) definirConsentimento(b.dataset.v);
  });
  document.body.appendChild(bannerEl);
}

/* HTML de um slot de anúncio, ou string vazia se não tem conta configurada ou o jogador ainda não aceitou —
   nunca desenha um <ins> "morto" esperando consentimento. `unitId` = o "ad slot" criado no painel do AdSense
   (Anúncios → Por unidade de anúncio), um número só. Depois de desenhar a tela que usa isto, chamar ativarSlots(). */
export function blocoAds(unitId) {
  if (!adsConfigurado() || consentimento() !== 'aceito') return '';
  return `<div class="ads-slot"><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT_ID}"
    data-ad-slot="${unitId}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
}
// Ativa todo <ins class="adsbygoogle"> que já esteja no DOM. Chamar DEPOIS de desenhar a tela (o <ins> precisa existir antes).
export function ativarSlots() {
  if (!adsConfigurado() || consentimento() !== 'aceito') return;
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { console.warn('ads', e); }
}
