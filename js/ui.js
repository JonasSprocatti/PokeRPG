/* ============ log e modal ============ */
// Tudo que toca o DOM de forma genérica (sem saber de batalha/criação).
import { G } from './estado.js';
import { sleep } from './util.js';

export const $ = s => document.querySelector(s);
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
