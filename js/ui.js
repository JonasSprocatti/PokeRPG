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
export function shake(m) {
  const ia = (G.S.aliados || []).indexOf(m);
  const el = document.getElementById(m === G.S.player ? 'mon-p' : ia >= 0 ? 'mon-a' + ia : 'mon-e'); if (!el) return;
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
}
