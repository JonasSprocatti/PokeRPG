/* ============ ajustes: fonte do jogo ============ */
// A escolha fica neste navegador (localStorage 'pokerpg-fonte') e vale em qualquer jornada. As fontes vêm do Google
// Fonts (o service worker guarda pro modo offline); toda pilha termina em fontes do próprio sistema, então se a
// internet falhar na primeira vez o jogo continua legível.
//   display = títulos, números e botões · corpo = texto corrido
import { store } from './util.js';

export const FONTE_KEY = 'pokerpg-fonte';
const sistema = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const FONTES = [
  { id: 'padrao', nome: 'Padrão', desc: 'Fredoka nos títulos, Atkinson Hyperlegible no texto. 2, 5 e 8 bem diferentes.',
    familias: ['Atkinson+Hyperlegible:wght@400;700', 'Fredoka:wght@500;600;700'],
    display: `'Fredoka', ${sistema}`, corpo: `'Atkinson Hyperlegible', ${sistema}` },
  { id: 'legivel', nome: 'Máxima legibilidade', desc: 'Atkinson Hyperlegible (feita para baixa visão) em tudo.',
    familias: ['Atkinson+Hyperlegible:wght@400;700'],
    display: `'Atkinson Hyperlegible', ${sistema}`, corpo: `'Atkinson Hyperlegible', ${sistema}` },
  { id: 'lexend', nome: 'Lexend', desc: 'Desenhada para facilitar a leitura de textos longos.',
    familias: ['Lexend:wght@400;600;700'], display: `'Lexend', ${sistema}`, corpo: `'Lexend', ${sistema}` },
  { id: 'andika', nome: 'Andika', desc: 'Letras bem separadas; ajuda quem tem dislexia.',
    familias: ['Andika:wght@400;700'], display: `'Andika', ${sistema}`, corpo: `'Andika', ${sistema}` },
  { id: 'nunito', nome: 'Nunito', desc: 'Arredondada e leve, com cara de jogo.',
    familias: ['Nunito:wght@400;600;800'], display: `'Nunito', ${sistema}`, corpo: `'Nunito', ${sistema}` },
  { id: 'mono', nome: 'Monoespaçada', desc: 'IBM Plex Mono: tudo alinhado, números fáceis de comparar.',
    familias: ['IBM+Plex+Mono:wght@400;600;700'], display: `'IBM Plex Mono', ui-monospace, monospace`, corpo: `'IBM Plex Mono', ui-monospace, monospace` }
];
export const fonteDe = id => FONTES.find(f => f.id === id) || FONTES[0];
export const fonteEscolhida = () => fonteDe(store.get(FONTE_KEY) || 'padrao');
export const urlDaFonte = f => `https://fonts.googleapis.com/css2?${f.familias.map(x => 'family=' + x).join('&')}&display=swap`;

// troca as variáveis de CSS que o estilo inteiro usa (--display e --body) e carrega a fonte se faltar
export function aplicarFonte(id = null) {
  const f = id ? fonteDe(id) : fonteEscolhida();
  if (id) store.set(FONTE_KEY, f.id);
  if (typeof document === 'undefined') return f;
  let link = document.getElementById('fonte-escolhida');
  if (!link) { link = document.createElement('link'); link.id = 'fonte-escolhida'; link.rel = 'stylesheet'; document.head.appendChild(link); }
  const url = urlDaFonte(f);
  if (link.href !== url) link.href = url;
  document.documentElement.style.setProperty('--display', f.display);
  document.documentElement.style.setProperty('--body', f.corpo);
  return f;
}

/* ============ ajustes: sprites 3D (pedido do usuário) ============ */
// Troca o pixel-art clássico (dados.SPR) pelo render "home" (dados.SPR_3D — mesmo modelo 3D dos jogos modernos,
// só que mais nítido). Fica neste navegador; sem versão de costas, então nas costas cai no mesmo fallback que
// já existe pra espécie sem back 2D (render.sprCostas). Lido em toda parte que desenha um Pokémon em campo
// (render.spriteFrente/sprCostas) — mudar aqui atualiza no próximo render, sem precisar recriar o Pokémon.
export const SPRITE_3D_KEY = 'pokerpg-sprite-3d';
export const sprite3DAtivo = () => store.get(SPRITE_3D_KEY) === true;
export const definirSprite3D = v => store.set(SPRITE_3D_KEY, !!v);
