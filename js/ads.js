/* ============ anúncios (Google AdSense) ============ */
/* Este arquivo cuida de TRÊS coisas: o banner que pergunta ao jogador, o sinal de consentimento que vai pro
   Google e o desenho dos slots. O que ele NÃO faz mais é carregar o script do Google: ele vem no <head> de
   index.html (e das páginas estáticas), junto com js/consent.js, que põe o consentimento em "denied" antes.

   POR QUE MUDOU (era "sem aceite, nenhum script"): a revisão do AdSense precisa encontrar o código no site pra
   avaliar, e o padrão do Google hoje é o Consent Mode v2 — script sempre, consentimento negado por padrão, e
   ele se comporta de acordo (sem cookie de anúncio, sem personalização). Continua valendo a parte que importa:
   NENHUM cookie de anúncio e nenhuma personalização antes do "Aceitar". Quem recusa fica no denied pra sempre.

   Gate igual ao Supabase: sem ADSENSE_CLIENT_ID de verdade em config.js, nada aqui faz nada — sem banner e sem
   slot. E sem o id da unidade de anúncio (AD_SLOT_*, que só existe depois da conta aprovada), nenhum <ins> é
   desenhado, mesmo com a conta ligada. */
import { ADSENSE_CLIENT_ID } from './config.js';
import { store } from './util.js';

export const adsConfigurado = () => !!ADSENSE_CLIENT_ID && !ADSENSE_CLIENT_ID.includes('XXXX');

const CHAVE_CONSENTIMENTO = 'pokerpg-consentimento-ads';
// 'aceito' | 'recusado' | null (ainda não perguntou, ou perguntou numa versão anterior do jogo)
export const consentimento = () => store.get(CHAVE_CONSENTIMENTO);

/* Avisa o Google. Os três sinais são os do Consent Mode v2 (o `analytics_storage` fica de fora porque o jogo
   não usa Analytics). `window.gtag` vem de js/consent.js, que é síncrono no <head>; se por algum motivo ele não
   estiver ali (página servida sem o snippet, teste), não fazer nada é o comportamento certo — sem o sinal, o
   Google segue no "denied" do default, que é o lado seguro. */
function avisarGoogle(aceito) {
  const g = window.gtag;
  if (typeof g !== 'function') return;
  const v = aceito ? 'granted' : 'denied';
  g('consent', 'update', { ad_storage: v, ad_user_data: v, ad_personalization: v });
}

let bannerEl = null;
function fecharBanner() { bannerEl?.remove(); bannerEl = null; }

export function definirConsentimento(v) {
  store.set(CHAVE_CONSENTIMENTO, v);
  fecharBanner();
  avisarGoogle(v === 'aceito');
}

/* Chamado uma vez no boot (main.js), depois de a tela inicial já estar desenhada. Não é modal: fica um rodapé
   fixo, sem travar o jogo. Quem já respondeu antes (mesmo navegador) não é perguntado de novo — mas o sinal é
   reenviado, porque `gtag('consent','update')` vale por carregamento de página: o consent.js já trata o caso do
   "aceito" pra não perder a primeira impressão, e aqui o "recusado" também fica explícito pro Google. */
export function iniciarAds() {
  if (!adsConfigurado()) return;
  const c = consentimento();
  if (c === 'aceito' || c === 'recusado') { avisarGoogle(c === 'aceito'); return; }
  mostrarBanner();
}
function mostrarBanner() {
  if (bannerEl || !document.body) return;
  bannerEl = document.createElement('div');
  bannerEl.className = 'cookie-banner';
  bannerEl.innerHTML = `<p>Este site usa cookies de anúncio pra ajudar a manter o jogo de graça. Até você
      aceitar, nenhum anúncio é personalizado.
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

/* HTML de um slot de anúncio, ou string vazia se não há conta configurada ou a unidade de anúncio ainda não
   existe. NÃO depende do consentimento: o slot é desenhado e o Google decide o que servir a partir do estado do
   Consent Mode (sem aceite, anúncio não personalizado ou nenhum) — era daqui que vinha o risco de a revisão não
   achar nada no site. `unitId` = o "ad slot" do painel (Anúncios → Por unidade de anúncio), um número só.
   Depois de desenhar a tela que usa isto, chamar ativarSlots(). */
export function blocoAds(unitId) {
  if (!adsConfigurado() || !unitId) return '';
  return `<div class="ads-slot"><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT_ID}"
    data-ad-slot="${unitId}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
}
/* Ativa os <ins class="adsbygoogle"> que já estão no DOM e ainda não foram preenchidos. Chamar DEPOIS de
   desenhar a tela. Um push por slot pendente, e nenhum push se não houver nenhum: o script do Google agora está
   sempre carregado, e um push sem slot correspondente vira erro no console a cada re-render (a tela inicial é
   redesenhada bastante). O `data-adsbygoogle-status` é posto pelo próprio script quando ele assume um slot. */
export function ativarSlots() {
  if (!adsConfigurado() || typeof document === 'undefined') return;
  const pendentes = document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])').length;
  for (let i = 0; i < pendentes; i++)
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { console.warn('ads', e); }
}
