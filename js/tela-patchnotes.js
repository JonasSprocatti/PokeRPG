/* ============ tela: 📜 novidades (patch notes) ============ */
// Lista as notas de atualização (js/dados-patchnotes.js, escritas à mão), da mais nova pra mais antiga. A mais
// nova vem aberta; as outras, fechadas. Quem abre a tela passa a "ter lido" a última versão — assim o aviso de
// novidade (bolinha no botão) some (visto em 'pokerpg-patch-visto').
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { PATCH_NOTES } from './dados-patchnotes.js';
import { barraTelas, rotuloVoltar } from './navegacao.js';
import { marcarNovidadesVistas } from './novidades.js';
import { esc } from './util.js';

const dataBr = d => { const [a, m, dia] = String(d).split('-'); return dia ? `${dia}/${m}/${a}` : d; };

export function telaPatchNotes() {
  G.mode = 'patch'; limparTopo();
  marcarNovidadesVistas();
  $('#app').innerHTML = `<main class="create">
    ${barraTelas('patch')}
    <h1>Novidades.</h1>
    <p class="lead">Tudo o que mudou no jogo, da atualização mais nova para a mais antiga.</p>
    <div class="patches">${PATCH_NOTES.map((p, i) => `
      <details class="patch" ${i === 0 ? 'open' : ''}>
        <summary><b class="patch-v">v${esc(p.versao)}</b> <span class="patch-t">${esc(p.titulo)}</span> <small class="muted">${dataBr(p.data)}</small></summary>
        ${p.secoes.map(s => `<h4 class="patch-sec">${esc(s.nome)}</h4><ul class="patch-itens">${s.itens.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`).join('')}
        ${p.piada ? `<p class="patch-piada">🎈 ${esc(p.piada)}</p>` : ''}
      </details>`).join('')}</div>
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">${rotuloVoltar()}</button></div></main>`;
}
