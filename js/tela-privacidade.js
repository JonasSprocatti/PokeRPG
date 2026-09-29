/* ============ tela: 🔒 Política de Privacidade ============ */
// Exigida pelo Google AdSense e pelo GDPR pra rodar anúncio (js/ads.js). O TEXTO mora em js/texto-privacidade.js
// (sem DOM, compartilhado com a página estática privacidade.html); aqui só se desenha a tela do jogo.
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { barraTelas } from './navegacao.js';
import { TEXTO_PRIVACIDADE } from './texto-privacidade.js';

export function telaPrivacidade() {
  G.mode = 'privacidade'; limparTopo();
  $('#app').innerHTML = `<main class="create pagina">
    ${barraTelas('privacidade')}
    <h1>Política de Privacidade.</h1>
    ${TEXTO_PRIVACIDADE}
  </main>`;
}
