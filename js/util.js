/* ============ utilidades ============ */
// Sem DOM: importável direto no Node (tests/). O que precisa de `document`/`matchMedia` mora em ui.js.
export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const fmt = s => String(s || '').split('-').map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const lastSeg = u => u.split('/').filter(Boolean).pop();
// localStorage embrulhado em try: no Node (sem localStorage) e em aba anônima vira no-op em vez de quebrar
export const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
