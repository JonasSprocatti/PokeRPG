/* ============ utilidades ============ */
// Sem DOM: importável direto no Node (tests/). O que precisa de `document`/`matchMedia` mora em ui.js.
export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const fmt = s => String(s || '').split('-').map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// id único (jornadas). randomUUID só existe em contexto seguro (https/localhost); fora dele, um aleatório longo basta
export const novoId = () => globalThis.crypto?.randomUUID?.() || `j-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
export const lastSeg =u => u.split('/').filter(Boolean).pop();
// localStorage embrulhado em try: no Node (sem localStorage) e em aba anônima vira no-op em vez de quebrar
export const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
  has(k) { try { return localStorage.getItem(k) !== null; } catch { return false; } },
  chaves(prefixo) { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith(prefixo)) out.push(k); } } catch {} return out; }
};
// sem internet? (navigator.onLine só é confiável no "false"; no Node não existe → trata como online)
export const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false;
// erro de "precisa de internet pra isso", com mensagem pronta pro log
export const erroOffline = msg => Object.assign(new Error(msg), { offline: true });
