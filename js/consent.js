/* ============ Consent Mode v2 (Google) ============ */
/* ATENÇÃO: este arquivo NÃO é módulo ES. Ele é carregado com <script src> comum, SÍNCRONO, no <head> de
   index.html e de toda página estática — antes do script do AdSense. Isso é obrigatório: o Google só respeita o
   estado de consentimento que já existe quando o script dele começa a rodar. Um `type="module"` é adiado até o
   HTML acabar de carregar, então chegaria tarde. Por isso aqui não há import, não há export e o `gtag` vira
   global de propósito.

   O QUE ESTE ARQUIVO RESOLVE: o padrão antigo do jogo era "sem consentimento, o script do Google não carrega".
   Isso é mais restritivo que o exigido e tem dois problemas: a revisão do AdSense precisa ENCONTRAR o código no
   site pra avaliar (sem ele, a inscrição volta como "não encontramos o código"), e o próprio Google mudou a
   recomendação — o script carrega sempre, com o consentimento em `denied` por padrão, e ele se comporta de
   acordo: sem cookie de anúncio, sem personalização, no máximo anúncio genérico. É o Consent Mode v2, que é
   também o que a CMP certificada (o passo seguinte, "Privacidade e mensagens" do painel do AdSense) opera.

   O banner do jogo (js/ads.js) chama gtag('consent','update', …) quando o jogador aceita. Enquanto ele não
   responde, vale o `default` abaixo. `wait_for_update` dá meio segundo pro banner responder antes de o Google
   assumir que é "denied" pra valer — o jogador que já aceitou numa visita anterior é atendido logo abaixo, em
   linha, sem esperar nada. */
(function () {
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  /* Já aceitou numa visita anterior? Sobe pra "granted" AGORA, antes de o script do Google rodar — assim quem
     consentiu não perde a primeira impressão da visita esperando o banner.
     O valor é gravado por store.set (js/util.js), que serializa em JSON: no localStorage ele está como
     `"aceito"`, com as aspas. Ler com JSON.parse é o que faz os dois lados concordarem — comparar com a string
     crua daria sempre falso, e o jogador que aceitou veria anúncio não personalizado pra sempre. */
  try {
    if (JSON.parse(localStorage.getItem('pokerpg-consentimento-ads')) === 'aceito')
      gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' });
  } catch (e) { /* aba anônima, localStorage bloqueado ou valor de uma versão antiga: fica no denied do default */ }
})();
