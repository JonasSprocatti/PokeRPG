/* ============ log e modal ============ */
// Tudo que toca o DOM de forma genérica (sem saber de batalha/criação).
import { G } from './estado.js';
import { sleep } from './util.js';

export const $ = s => document.querySelector(s);
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- topo: dinheiro sempre visível + menu ☰ no celular ---- */
// telas fora do jogo limpam o topo por aqui (botões + dinheiro), nunca direto no #topr
export function limparTopo() {
  $('#topr').innerHTML = '';
  const d = $('#top-dinheiro'); if (d) d.textContent = '';
  fecharMenu();
}
export function fecharMenu() {
  $('#menu-links')?.classList.remove('open');
  const b = $('#menu-burger'); if (b) { b.textContent = '☰'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Abrir menu'); }
}
// ☰ abre/fecha; clicar num botão do menu, fora dele, ou Esc fecha (sem mouse/teclado também dá pra sair: toque fora)
export function iniciarMenu() {
  document.addEventListener('click', e => {
    const menu = $('#menu-links'), burger = e.target.closest('#menu-burger');
    if (burger) {
      const abrir = !menu.classList.contains('open');
      menu.classList.toggle('open', abrir);
      burger.textContent = abrir ? '✕' : '☰';
      burger.setAttribute('aria-expanded', String(abrir));
      burger.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
      return;
    }
    if (!menu?.classList.contains('open')) return;
    if (!e.target.closest('#menu-links') || e.target.closest('button, a')) fecharMenu();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharMenu(); });
}

// aviso flutuante (canto de baixo), por cima de qualquer tela; pode ter botões com data-act. `ms` 0 = só fecha no ✕
export function toast(html, ms = 15000) {
  let pilha = $('#toasts');
  if (!pilha) { pilha = document.createElement('div'); pilha.id = 'toasts'; pilha.setAttribute('aria-live', 'polite'); document.body.appendChild(pilha); }
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<div>${html}</div><button type="button" class="toast-x" aria-label="Fechar aviso">✕</button>`;
  const fechar = () => t.remove();
  t.addEventListener('click', e => { if (e.target.closest('.toast-x, [data-act]')) setTimeout(fechar); });
  pilha.appendChild(t);
  if (ms) setTimeout(fechar, ms);
}

export function logRaw(l) {
  const el = $('#log'); if (!el) return;
  const p = document.createElement('p'); if (l.cls) p.className = l.cls; p.innerHTML = l.html;
  el.appendChild(p); el.scrollTop = el.scrollHeight;
}
export function log(html, cls = '') { const l = { html, cls }; logRaw(l); if (G.S) (G.S.log ||= []).push(l); }
export async function say(html, cls) { log(html, cls); await sleep(REDUCED ? 80 : 420); }
export function ask(html, options, extra = '') {
  return new Promise(res => {
    const d = document.createElement('div'); d.className = 'modal';
    d.innerHTML = `<div class="box" role="dialog" aria-modal="true"><div class="box-body">${html}</div>${extra}<div class="choices">${options.map((o, i) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-i="${i}">${o.label}</button>`).join('')}</div></div>`;
    document.body.appendChild(d); d.querySelector('button').focus();
    d.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (!b) return; d.remove(); res(options[+b.dataset.i].value); });
  });
}
/* HUD de quantidade da loja: − / + / campo / Máx, com o total e o troco ao vivo. Devolve a quantidade escolhida
   (1..max) ou 0 se cancelou. `figuraHtml` é o <img> do item, montado por quem chama. Esc e clicar fora cancelam. */
export function pedirQuantidade({ nome, figuraHtml = '', preco, max, dinheiro }) {
  return new Promise(res => {
    let q = 1;
    const brl = n => '₽' + n.toLocaleString('pt-BR');
    const d = document.createElement('div'); d.className = 'modal';
    d.innerHTML = `<div class="box qtd-box" role="dialog" aria-modal="true" aria-label="Comprar ${nome}">
      <div class="qtd-topo">${figuraHtml}<div><b>${nome}</b><div class="small muted">${brl(preco)} cada · você tem ${brl(dinheiro)}</div></div></div>
      <div class="qtd-ctl">
        <button type="button" class="btn ghost" data-q="-10" aria-label="Menos 10">−10</button>
        <button type="button" class="btn ghost" data-q="-1" aria-label="Menos 1">−</button>
        <input type="number" inputmode="numeric" min="1" max="${max}" value="1" aria-label="Quantidade">
        <button type="button" class="btn ghost" data-q="1" aria-label="Mais 1">+</button>
        <button type="button" class="btn ghost" data-q="10" aria-label="Mais 10">+10</button>
      </div>
      <div class="qtd-atalho"><button type="button" class="btn ghost" data-q="max">Máx (${max})</button></div>
      <div class="qtd-total"></div>
      <div class="choices"><button type="button" class="btn" data-ok>Comprar</button><button type="button" class="btn ghost" data-cancel>Cancelar</button></div></div>`;
    const inp = d.querySelector('input'), tot = d.querySelector('.qtd-total');
    const pinta = () => {
      q = Math.min(max, Math.max(1, Math.floor(+inp.value) || 1)); inp.value = q;
      tot.innerHTML = `Total <b>${brl(q * preco)}</b> <span class="muted small">— sobram ${brl(dinheiro - q * preco)}</span>`;
    };
    const fim = v => { document.removeEventListener('keydown', tecla, true); d.remove(); res(v); };
    const tecla = e => {
      if (e.key === 'Escape') { e.stopPropagation(); fim(0); }
      else if (e.key === 'Enter') { e.preventDefault(); pinta(); fim(q); }
    };
    d.addEventListener('click', e => {
      if (e.target === d || e.target.closest('[data-cancel]')) return fim(0);
      if (e.target.closest('[data-ok]')) { pinta(); return fim(q); }
      const b = e.target.closest('[data-q]'); if (!b) return;
      inp.value = b.dataset.q === 'max' ? max : (+inp.value || 1) + +b.dataset.q; pinta();
    });
    inp.addEventListener('input', pinta);
    document.addEventListener('keydown', tecla, true);
    document.body.appendChild(d); pinta(); inp.focus(); inp.select();
  });
}
export function shake(m) {
  const ia = (G.S.aliados || []).indexOf(m);
  const el = document.getElementById(m === G.S.player ? 'mon-p' : ia >= 0 ? 'mon-a' + ia : 'mon-e'); if (!el) return;
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
}
