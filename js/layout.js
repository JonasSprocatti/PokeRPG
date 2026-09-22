/* ============ layout dos painéis (modelo puro) ============ */
// O que fica onde na tela do jogo. Sem DOM: paineis.js aplica isto na página; tests/layout.test.js cobre.
// Layout = {
//   zonas:      { esq: [ids], centro: [ids], dir: [ids] }   ordem de cima pra baixo; centro = abaixo da cena fixa
//   larg:       { esq: px, dir: px }                        largura das colunas laterais
//   alt:        { [id]: px }                                altura escolhida pelo jogador (ausente = automática)
//   recolhidos: [ids]                                        painéis mostrando só o título
// }
// Todo painel aparece EXATAMENTE uma vez (normalizarLayout garante, mesmo com save velho/corrompido).

export const PAINEIS = ['ficha', 'missoes', 'aliados', 'mochila', 'log'];
export const ZONAS = ['esq', 'centro', 'dir'];
export const LARG_MIN = 220, LARG_MAX = 600, ALT_MIN = 80;
export const LAYOUT_PADRAO = {
  zonas: { esq: ['ficha'], centro: ['log'], dir: ['missoes', 'aliados', 'mochila'] },
  larg: { esq: 340, dir: 340 },
  alt: { log: 190 },
  recolhidos: []
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const zonaPadraoDe = id => ZONAS.find(z => LAYOUT_PADRAO.zonas[z].includes(id));

// Conserta qualquer coisa que venha do localStorage: painel repetido/desconhecido sai, painel faltando volta
// pra zona padrão dele, números fora da faixa voltam pra faixa.
export function normalizarLayout(l) {
  const zonas = { esq: [], centro: [], dir: [] }, vistos = new Set();
  for (const z of ZONAS) for (const id of (Array.isArray(l?.zonas?.[z]) ? l.zonas[z] : []))
    if (PAINEIS.includes(id) && !vistos.has(id)) { zonas[z].push(id); vistos.add(id); }
  for (const id of PAINEIS) if (!vistos.has(id)) zonas[zonaPadraoDe(id)].push(id);
  const larg = {};
  for (const z of ['esq', 'dir']) larg[z] = Number.isFinite(l?.larg?.[z]) ? clamp(Math.round(l.larg[z]), LARG_MIN, LARG_MAX) : LAYOUT_PADRAO.larg[z];
  const alt = {};
  for (const id of PAINEIS) {
    const v = l?.alt ? l.alt[id] : LAYOUT_PADRAO.alt[id];
    if (Number.isFinite(v)) alt[id] = Math.max(ALT_MIN, Math.round(v));
  }
  const recolhidos = [...new Set((Array.isArray(l?.recolhidos) ? l.recolhidos : []).filter(id => PAINEIS.includes(id)))];
  return { zonas, larg, alt, recolhidos };
}

const copia = l => normalizarLayout(structuredClone(l));
export const zonaDe = (l, id) => ZONAS.find(z => l.zonas[z].includes(id));

// arrastar e soltar: tira o painel de onde estiver e põe na posição `indice` da zona (índice já sem ele)
export function moverPainel(l, id, zona, indice) {
  const n = copia(l);
  if (!PAINEIS.includes(id) || !ZONAS.includes(zona)) return n;
  for (const z of ZONAS) n.zonas[z] = n.zonas[z].filter(x => x !== id);
  n.zonas[zona].splice(clamp(indice, 0, n.zonas[zona].length), 0, id);
  return n;
}
// ▲ / ▼: troca de lugar com o vizinho na mesma zona (na ponta, não faz nada)
export function deslocar(l, id, delta) {
  const n = copia(l), z = zonaDe(n, id), lista = n.zonas[z], i = lista.indexOf(id), j = i + delta;
  if (j < 0 || j >= lista.length) return n;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  return n;
}
// ⇄: vai pro fim da próxima zona (esq → centro → dir → esq)
export function trocarZona(l, id) {
  const z = zonaDe(l, id), prox = ZONAS[(ZONAS.indexOf(z) + 1) % ZONAS.length];
  return moverPainel(l, id, prox, l.zonas[prox].length);
}
export function alternarRecolhido(l, id) {
  const n = copia(l);
  n.recolhidos = n.recolhidos.includes(id) ? n.recolhidos.filter(x => x !== id) : [...n.recolhidos, id];
  return n;
}
export const definirLargura = (l, zona, px) => { const n = copia(l); n.larg[zona] = clamp(Math.round(px), LARG_MIN, LARG_MAX); return n; };
export const definirAltura = (l, id, px) => { const n = copia(l); n.alt[id] = Math.max(ALT_MIN, Math.round(px)); return n; };
