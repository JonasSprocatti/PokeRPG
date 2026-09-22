/* ============ tela: ⚙ ajustes ============ */
// Hoje só a fonte do jogo (ajustes.js). Cada opção é mostrada JÁ com a própria fonte, pra dar pra comparar antes de
// escolher; a escolha vale na hora e fica guardada neste navegador. O clique (data-act="fonte") está em main.js.
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { FONTES, fonteEscolhida, urlDaFonte } from './ajustes.js';
import { barraTelas } from './navegacao.js';
import { esc } from './util.js';

export function telaAjustes() {
  G.mode = 'ajustes'; limparTopo();
  const atual = fonteEscolhida();
  // carrega todas as fontes da lista pra amostra sair na fonte certa
  for (const f of FONTES) if (!document.querySelector(`link[data-fonte="${f.id}"]`)) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = urlDaFonte(f); l.dataset.fonte = f.id; document.head.appendChild(l);
  }
  $('#app').innerHTML = `<main class="create">
    ${barraTelas('ajustes')}
    <h1>Ajustes.</h1>
    <p class="lead">Escolha a fonte que você lê melhor. Vale para o jogo inteiro, em qualquer jornada, e fica salva neste navegador.</p>
    <h3 class="passo"><span>A</span> Fonte</h3>
    <div class="fontes">${FONTES.map(f => `
      <button class="fonte-card ${f.id === atual.id ? 'on' : ''}" data-act="fonte" data-v="${f.id}" aria-pressed="${f.id === atual.id}" style="--f-display:${f.display};--f-corpo:${f.corpo}">
        <b class="fonte-nome">${esc(f.nome)}${f.id === atual.id ? ' ✓' : ''}</b>
        <span class="fonte-amostra">Pikachu · Nv. 25 · 2 5 8 · ₽1.250</span>
        <small>${esc(f.desc)}</small>
      </button>`).join('')}</div>
    <p class="small muted" style="margin-top:14px">As fontes vêm do Google Fonts e ficam guardadas para o modo offline depois do primeiro uso.</p>
  </main>`;
}
