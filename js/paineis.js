/* ============ painéis modulares (DOM) ============ */
// Aplica o layout (modelo puro em layout.js) na tela do jogo: 3 zonas (esq · centro abaixo da cena fixa · dir),
// cada painel com alça pra arrastar, ▲▼ ⇄ (teclado/celular), ▾ recolher e altura puxando a borda (resize nativo).
// Divisórias entre as colunas ajustam a largura. Salvo por navegador em LAYOUT_KEY, um layout pro jogo inteiro.
// O conteúdo de cada painel é escrito por render.js em #p-<id>; aqui só se move a CAIXA (o conteúdo vem junto).
import { $ } from './ui.js';
import { store } from './util.js';
import {
  PAINEIS, ZONAS, LAYOUT_PADRAO, normalizarLayout, moverPainel, deslocar, trocarZona,
  alternarRecolhido, definirLargura, definirAltura
} from './layout.js';

const LAYOUT_KEY = 'pokerpg-layout-v1';
const TITULOS = { ficha: 'Seu Pokémon', missoes: 'Missões', aliados: 'Aliados', mochila: 'Mochila', log: 'Registro' };
let L = normalizarLayout(store.get(LAYOUT_KEY));
const salvar = () => store.set(LAYOUT_KEY, L);
const painelEl = id => document.querySelector(`.painel[data-painel="${id}"]`);

const htmlPainel = id => `<section class="painel" data-painel="${id}" aria-label="${TITULOS[id]}">
    <header class="painel-cab" draggable="true">
      <span class="alca" title="Arraste pra mudar de lugar" aria-hidden="true">⠿</span>
      <h3 class="painel-titulo">${TITULOS[id]}</h3>
      <span class="painel-botoes">
        <button type="button" data-painel-acao="subir" title="Subir" aria-label="Subir ${TITULOS[id]}">▲</button>
        <button type="button" data-painel-acao="descer" title="Descer" aria-label="Descer ${TITULOS[id]}">▼</button>
        <button type="button" data-painel-acao="trocar" title="Mudar de coluna" aria-label="Mudar ${TITULOS[id]} de coluna">⇄</button>
        <button type="button" data-painel-acao="recolher" title="Recolher / abrir" aria-label="Recolher ${TITULOS[id]}">▾</button>
      </span>
    </header>
    <div class="painel-corpo" id="p-${id}">${id === 'log' ? '<div class="textbox"><div id="log" class="log" aria-live="polite"></div></div>' : ''}</div>
  </section>`;

// Abas do celular (só aparecem em tela estreita, CSS): no computador tudo fica junto na mesma tela, mas no celular
// a cena fica presa no topo, as ações embaixo, e estas abas dizem o que ocupa o meio — o registro curto (⚔ Luta),
// o registro inteiro (💬 Registro) ou os painéis de ficha/missões/aliados/mochila (📋 Painéis). Ver render.abaMobile.
const ABA_BOTAO = (v, txt, dica) => `<button type="button" class="aba-mob" data-act="aba-mob" data-v="${v}" title="${dica}">${txt}</button>`;
const ABAS_MOB = `<nav class="abas-mob" aria-label="O que mostrar no meio da tela">
    ${ABA_BOTAO('luta', '⚔ Luta', 'Cena e golpes, com um resumo do registro')}
    ${ABA_BOTAO('registro', '💬 Registro', 'O registro da batalha inteiro')}
    ${ABA_BOTAO('paineis', '📋 Painéis', 'Ficha, missões, aliados e mochila')}
  </nav>`;

// esqueleto da tela do jogo; os painéis nascem na zona esquerda e aplicarLayout() os distribui
export function htmlJogo() {
  return `<main class="game">
    <div class="zona" data-zona="esq">${PAINEIS.map(htmlPainel).join('')}</div>
    <div class="divisor" data-divisor="esq" title="Arraste pra mudar a largura" aria-hidden="true"></div>
    <section class="stage">
      <div id="scene" class="scene"></div>
      ${ABAS_MOB}
      <div class="zona" data-zona="centro"></div>
      <div id="actions" class="actions"></div>
    </section>
    <div class="divisor" data-divisor="dir" title="Arraste pra mudar a largura" aria-hidden="true"></div>
    <div class="zona" data-zona="dir"></div>
  </main>`;
}

let observador = null;
export function aplicarLayout() {
  const main = $('.game'); if (!main) return;
  main.style.setProperty('--larg-esq', L.larg.esq + 'px');
  main.style.setProperty('--larg-dir', L.larg.dir + 'px');
  for (const z of ZONAS) {
    const zona = main.querySelector(`.zona[data-zona="${z}"]`);
    for (const id of L.zonas[z]) {
      const el = painelEl(id); if (!el) continue;
      zona.appendChild(el); // mover o nó preserva o conteúdo (e o scroll do log)
      const corpo = el.querySelector('.painel-corpo'), rec = L.recolhidos.includes(id);
      corpo.hidden = rec; el.classList.toggle('recolhido', rec);
      el.querySelector('[data-painel-acao="recolher"]').textContent = rec ? '▸' : '▾';
      corpo.style.height = L.alt[id] ? L.alt[id] + 'px' : '';
    }
    zona.classList.toggle('vazia', !L.zonas[z].length);
  }
  // altura: o resize nativo (borda de baixo) escreve style.height; só grava quando mudou de verdade.
  // Painel com altura automática não tem style.height (NaN) e é ignorado — conteúdo crescendo não conta.
  observador?.disconnect();
  observador = new ResizeObserver(ents => {
    for (const e of ents) {
      const id = e.target.closest('.painel')?.dataset.painel, h = parseInt(e.target.style.height, 10);
      if (id && h && h !== L.alt[id]) { L = definirAltura(L, id, h); salvar(); }
    }
  });
  document.querySelectorAll('.painel-corpo').forEach(c => observador.observe(c));
}
// título dinâmico ("Missões (3 concluídas)")
export function tituloPainel(id, html) { const h = painelEl(id)?.querySelector('.painel-titulo'); if (h) h.innerHTML = html; }

const mudar = novo => { L = novo; salvar(); aplicarLayout(); };
export function restaurarLayout() { mudar(normalizarLayout(structuredClone(LAYOUT_PADRAO))); }

let iniciado = false;
export function iniciarPaineis() {
  if (iniciado) return; iniciado = true;
  // botões do cabeçalho
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-painel-acao]'); if (!b) return;
    const acao = b.dataset.painelAcao;
    if (acao === 'restaurar') return restaurarLayout();
    const id = b.closest('.painel')?.dataset.painel; if (!id) return;
    if (acao === 'subir') mudar(deslocar(L, id, -1));
    else if (acao === 'descer') mudar(deslocar(L, id, 1));
    else if (acao === 'trocar') mudar(trocarZona(L, id));
    else if (acao === 'recolher') mudar(alternarRecolhido(L, id));
  });

  // arrastar pelo cabeçalho (mouse). Marcador mostra onde o painel vai cair.
  let arrastando = null;
  const marcador = document.createElement('div'); marcador.className = 'painel-marcador';
  const posicaoNaZona = (zona, y) => {
    const outros = [...zona.querySelectorAll(':scope > .painel')].filter(p => p.dataset.painel !== arrastando);
    const i = outros.findIndex(p => { const r = p.getBoundingClientRect(); return y < r.top + r.height / 2; });
    return { outros, i: i < 0 ? outros.length : i };
  };
  document.addEventListener('dragstart', e => {
    const cab = e.target.closest?.('.painel-cab'); if (!cab) return;
    arrastando = cab.closest('.painel').dataset.painel;
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', arrastando);
    cab.closest('.painel').classList.add('arrastando');
  });
  document.addEventListener('dragover', e => {
    if (!arrastando) return;
    const zona = e.target.closest?.('.zona'); if (!zona) return;
    e.preventDefault();
    const { outros, i } = posicaoNaZona(zona, e.clientY);
    if (outros[i]) zona.insertBefore(marcador, outros[i]); else zona.appendChild(marcador);
  });
  document.addEventListener('drop', e => {
    if (!arrastando) return;
    const zona = e.target.closest?.('.zona'); if (!zona) return;
    e.preventDefault();
    const { i } = posicaoNaZona(zona, e.clientY);
    marcador.remove();
    const id = arrastando; arrastando = null;
    mudar(moverPainel(L, id, zona.dataset.zona, i));
  });
  document.addEventListener('dragend', () => {
    marcador.remove(); arrastando = null;
    document.querySelectorAll('.painel.arrastando').forEach(p => p.classList.remove('arrastando'));
  });

  // divisórias: largura das colunas laterais
  document.addEventListener('pointerdown', e => {
    const d = e.target.closest?.('.divisor'); if (!d) return;
    const main = d.closest('.game'), lado = d.dataset.divisor;
    d.setPointerCapture(e.pointerId); d.classList.add('ativo');
    const mover = ev => {
      const r = main.getBoundingClientRect();
      L = definirLargura(L, lado, lado === 'esq' ? ev.clientX - r.left : r.right - ev.clientX);
      main.style.setProperty('--larg-' + lado, L.larg[lado] + 'px');
    };
    const soltar = () => { d.classList.remove('ativo'); d.removeEventListener('pointermove', mover); salvar(); };
    d.addEventListener('pointermove', mover);
    d.addEventListener('pointerup', soltar, { once: true });
    d.addEventListener('pointercancel', soltar, { once: true });
  });
}
