/* ============ tela: ⚙ ajustes ============ */
// Hoje só a fonte do jogo (ajustes.js). Cada opção é mostrada JÁ com a própria fonte, pra dar pra comparar antes de
// escolher; a escolha vale na hora e fica guardada neste navegador. O clique (data-act="fonte") está em main.js.
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { FONTES, fonteEscolhida, urlDaFonte } from './ajustes.js';
import { barraTelas } from './navegacao.js';
import { GENS, genDe, dadosDaGen } from './mapas.js';
import { alvosDaGen, quantoFalta, baixarGen } from './offline.js';
import { esc, offline } from './util.js';

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
    <h3 class="passo"><span>B</span> Jogar offline</h3>
    <div id="offline-box">${htmlOffline()}</div>
  </main>`;
}

// Baixar um mapa inteiro pra jogar sem internet (offline.js). Sem isso, offline só aparece quem você já encontrou —
// e Pokémon novo fica sem sprite.
function htmlOffline() {
  const gen = genDe(G.S), r = dadosDaGen(gen), falta = quantoFalta(gen), total = alvosDaGen(gen).length;
  const pronto = falta === 0;
  return `<p class="lead">Baixe os Pokémon de um mapa (dados, golpes e sprites) pra jogar sem internet sem faltar nada.
      O jogo já guarda sozinho o que você encontra; isto adianta o resto de uma vez.</p>
    <p class="small ${pronto ? 'ok-offline' : 'muted'}">${pronto ? `✅ Gen ${gen} (${esc(r.regiao)}) já está inteira neste aparelho.`
      : `Gen ${gen} (${esc(r.regiao)}): <b>${total - falta}/${total}</b> Pokémon guardados — faltam ${falta}.`}</p>
    <div class="subrow">${GENS.map(g => `<button class="btn ${g.gen === gen ? '' : 'ghost'} sm" data-act="baixar-gen" data-v="${g.gen}">⬇ Gen ${g.gen} · ${esc(g.regiao)}${quantoFalta(g.gen) ? '' : ' ✅'}</button>`).join('')}</div>
    <div id="offline-progresso" class="small muted" style="margin-top:8px"></div>
    <p class="small muted">São cerca de ${total} Pokémon por mapa. Use uma rede boa: o download pode gastar alguns megabytes.</p>`;
}
// chamado por main.js no clique; mostra o progresso sem redesenhar a tela toda
export async function baixarMapaOffline(gen) {
  const el = () => document.getElementById('offline-progresso');
  if (!el()) return;
  if (offline()) { el().innerHTML = '📴 Sem internet agora: conecte pra poder baixar.'; return; }
  el().innerHTML = 'Baixando…';
  const r = await baixarGen(+gen, (feitos, total, oQue) => {
    const p = el(); if (p) p.innerHTML = `Baixando ${esc(oQue)}… <b>${feitos}/${total}</b>`;
  });
  const p = el(); if (!p) return;
  p.innerHTML = r.ok ? `✅ Pronto! Gen ${gen} guardada (${r.total} Pokémon e ${r.golpes} golpes).`
    : `Terminou com ${r.falhas} falha(s) — dá pra tentar de novo, o que já baixou fica guardado.`;
  const box = document.getElementById('offline-box'); if (box) box.innerHTML = htmlOffline();
}
