/* ============ tela: ⚙ ajustes ============ */
// Hoje só a fonte do jogo (ajustes.js). Cada opção é mostrada JÁ com a própria fonte, pra dar pra comparar antes de
// escolher; a escolha vale na hora e fica guardada neste navegador. O clique (data-act="fonte") está em main.js.
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { FONTES, fonteEscolhida, urlDaFonte } from './ajustes.js';
import { barraTelas } from './navegacao.js';
import { GENS, genDe, dadosDaGen } from './mapas.js';
import { alvosDaGen, quantoFalta, precisaRebaixar, jaBaixado, semServiceWorker, baixarGen, baixarTudo, baixarImagens, imagensGuardadas, quantoFaltaTudo, totalDoJogo } from './offline.js';
import { espacoUsado, itensNoCache, limparCache } from './api.js';
import { TOTAL_GENS } from './mapas.js';
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
  mostrarEspaco();
  mostrarImagens();   // conta as imagens guardadas (assíncrono: a linha se preenche sozinha)
}

// Baixar um mapa inteiro pra jogar sem internet (offline.js). Sem isso, offline só aparece quem você já encontrou —
// e Pokémon novo fica sem sprite.
function htmlOffline() {
  const gen = genDe(G.S), r = dadosDaGen(gen), falta = quantoFalta(gen), total = alvosDaGen(gen).length;
  const velho = precisaRebaixar(gen), pronto = !falta && !velho;
  return `<p class="lead">Baixe os Pokémon de um mapa (dados, golpes e sprites) pra jogar sem internet sem faltar nada.
      O jogo já guarda sozinho o que você encontra; isto adianta o resto de uma vez.</p>
    <p class="small ${pronto ? 'ok-offline' : 'muted'}">${pronto ? `✅ Gen ${gen} (${esc(r.regiao)}) já está inteira neste aparelho.`
      : velho ? `⚠ Gen ${gen} (${esc(r.regiao)}) foi baixada por uma versão antiga: os Pokémon estão aqui, mas faltam as curvas de XP e as árvores de evolução — sem elas não dá pra <b>começar uma jornada</b> nem evoluir offline. Baixe de novo (o que já está guardado não desce outra vez).`
      : `Gen ${gen} (${esc(r.regiao)}): <b>${total - falta}/${total}</b> Pokémon guardados — faltam ${falta}.`}</p>
    <div class="subrow">${GENS.map(g => `<button class="btn ${g.gen === gen ? '' : 'ghost'} sm" data-act="baixar-gen" data-v="${g.gen}">⬇ Gen ${g.gen} · ${esc(g.regiao)}${jaBaixado(g.gen) ? ' ✅' : ''}</button>`).join('')}</div>
    <div class="subrow" style="margin-top:10px"><button class="btn" data-act="baixar-tudo">⬇⬇ Baixar o jogo inteiro (${TOTAL_GENS} mapas)</button>
      <span class="small muted">${quantoFaltaTudo() ? `faltam ${quantoFaltaTudo()} de ${totalDoJogo()} Pokémon`
        : GENS.every(g => jaBaixado(g.gen)) ? '✅ tudo guardado' : '⚠ os Pokémon estão todos aqui, mas há mapas baixados por uma versão antiga'}</span></div>
    <div class="subrow" style="margin-top:10px"><button class="btn ghost sm" data-act="baixar-imagens">🖼 Baixar só as imagens (Gen ${gen})</button>
      <span class="small muted" id="offline-imagens">conferindo imagens guardadas…</span></div>
    <div class="subrow" style="margin-top:10px"><button class="btn ghost sm" data-act="limpar-baixar">🗑 Limpar tudo e baixar de novo (Gen ${gen})</button>
      <span class="small muted">apaga o que está guardado da PokéAPI e baixa do zero — use se algo ficou pela metade. Não mexe nos seus saves nem na carreira.</span></div>
    <div id="offline-progresso" class="small muted" style="margin-top:8px"></div>
    <p class="small muted">São cerca de ${total} Pokémon por mapa e ${totalDoJogo()} no jogo inteiro. O jogo inteiro ocupa cerca de <b>20 MB</b> — são dados e sprites pequenos —, mas leva alguns minutos porque são milhares de pedidos: use uma rede boa e deixe a tela aberta.<span id="offline-espaco"></span></p>`;
}
/* chamado por main.js no clique; mostra o progresso sem redesenhar a tela toda. `gen` null = o jogo inteiro.
   `limpar` = apaga o que já está guardado antes de baixar (botão 🗑): baixar por cima só busca o que FALTA, então
   registro guardado pela metade continuaria lá pra sempre. */
export async function baixarMapaOffline(gen, limpar = false) {
  const el = () => document.getElementById('offline-progresso');
  if (!el()) return;
  if (offline()) { el().innerHTML = '📴 Sem internet agora: conecte pra poder baixar.'; return; }
  // sem service worker no comando, as imagens não ficam guardadas (offline.semServiceWorker explica)
  if (semServiceWorker()) {
    el().innerHTML = '⚠ <b>Recarregue a página antes de baixar</b> (F5). Agora ela está fora do controle do service worker — os dados seriam guardados, mas <b>as imagens não</b>, e você só descobriria sem internet.';
    return;
  }
  if (limpar) { el().innerHTML = 'Limpando o que estava guardado…'; await limparCache(); }
  el().innerHTML = 'Baixando…';
  const andar = (feitos, total, oQue) => { const p = el(); if (p) p.innerHTML = `Baixando ${esc(oQue)}… <b>${feitos}/${total}</b>`; };
  const r = gen ? await baixarGen(+gen, andar) : await baixarTudo(andar);
  const p = el(); if (!p) return;
  const oQue = gen ? `Gen ${gen}` : 'O jogo inteiro';
  // dado e imagem são pendências diferentes (offline.baixarGen): sem o dado não dá pra jogar, sem a imagem dá
  p.innerHTML = r.dadosOk && !r.imagens ? `✅ Pronto! ${oQue} guardado neste aparelho (${r.total} Pokémon e ${r.golpes} golpes).`
    : r.dadosOk ? `✅ ${oQue} dá pra jogar offline (${r.total} Pokémon e ${r.golpes} golpes) — mas ${r.imagens} imagem(ns) não desceram. Dá pra baixar de novo pra tentar só elas; o jogo funciona mesmo assim.`
    : `Terminou com ${r.falhas} falha(s) nos dados${r.imagens ? ` e ${r.imagens} em imagens` : ''} — dá pra tentar de novo, o que já baixou fica guardado.`;
  const box = document.getElementById('offline-box'); if (box) { box.innerHTML = htmlOffline(); mostrarEspaco(); mostrarImagens(); }
}

/* Só as imagens (botão 🖼). Serve pro caso em que os dados estão inteiros e as figuras não — que acontece quando
   o download roda sem service worker no comando (ver offline.baixarImagens). Não rebaixa dado nenhum. */
export async function baixarImagensOffline(gen) {
  const el = () => document.getElementById('offline-progresso');
  if (!el()) return;
  if (offline()) { el().innerHTML = '📴 Sem internet agora: conecte pra poder baixar.'; return; }
  if (semServiceWorker()) { el().innerHTML = '⚠ <b>Recarregue a página primeiro</b> (F5): sem o service worker no comando, imagem baixada não fica guardada em lugar nenhum.'; return; }
  el().innerHTML = 'Baixando imagens…';
  const r = await baixarImagens(+gen, (f, t) => { const p = el(); if (p) p.innerHTML = `Baixando imagens… <b>${f}/${t}</b>`; });
  const p = el(); if (!p) return;
  p.innerHTML = r.ok ? `✅ Imagens da Gen ${gen} guardadas (${r.total} Pokémon).`
    : `Terminou com ${r.falhas} imagem(ns) que não desceram — dá pra rodar de novo, o que já veio fica guardado.`;
  mostrarImagens();
}
// quantas imagens do mapa atual estão guardadas de verdade (pergunta ao cache do service worker)
async function mostrarImagens() {
  const el = document.getElementById('offline-imagens'); if (!el) return;
  const gen = genDe(G.S), total = alvosDaGen(gen).length, n = await imagensGuardadas(gen);
  if (!document.getElementById('offline-imagens')) return;   // trocou de tela enquanto contava
  el.innerHTML = n === null ? '' : n >= total ? `✅ ${n}/${total} imagens guardadas.`
    : `⚠ só <b>${n}/${total}</b> imagens guardadas — sem internet, o resto aparece como figura quebrada.`;
}
// espaço que o jogo ocupa neste aparelho (dados + sprites), quando o navegador deixa consultar
async function mostrarEspaco() {
  const e = await espacoUsado(); const el = document.getElementById('offline-espaco');
  if (!e || !el) return;
  const mb = n => (n / 1024 / 1024).toFixed(1).replace('.', ',');
  el.innerHTML = ` Guardado agora: <b>${mb(e.usado)} MB</b>${e.total ? ` de ${mb(e.total)} MB disponíveis` : ''} (${itensNoCache()} itens).`;
}
