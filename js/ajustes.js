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
    familias: ['IBM+Plex+Mono:wght@400;600;700'], display: `'IBM Plex Mono', ui-monospace, monospace`, corpo: `'IBM Plex Mono', ui-monospace, monospace` },
  /* As três de baixo entraram pelo relato #78 ("uma fonte mais bonitinha"): as seis de cima são escolhidas por
     LEGIBILIDADE, e nenhuma por gosto. Todas continuam com dígitos distintos — a regra do projeto é 2, 5 e 8
     sem confusão, e é por isso que nenhuma fonte pixelada volta pro jogo. */
  { id: 'baloo', nome: 'Gordinha', desc: 'Baloo 2: bem redonda e cheia, cara de livro infantil. A mais "bonitinha".',
    familias: ['Baloo+2:wght@400;600;800'], display: `'Baloo 2', ${sistema}`, corpo: `'Baloo 2', ${sistema}` },
  { id: 'quicksand', nome: 'Delicada', desc: 'Quicksand nos títulos, Nunito no texto: fina, redonda e arejada.',
    familias: ['Quicksand:wght@500;600;700', 'Nunito:wght@400;600'],
    display: `'Quicksand', ${sistema}`, corpo: `'Nunito', ${sistema}` },
  { id: 'comfortaa', nome: 'Geométrica', desc: 'Comfortaa nos títulos, Lexend no texto: círculos perfeitos, ar de app moderno.',
    familias: ['Comfortaa:wght@500;700', 'Lexend:wght@400;600'],
    display: `'Comfortaa', ${sistema}`, corpo: `'Lexend', ${sistema}` }
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

/* ============ ajustes: estilo do sprite (pedido do usuário) ============ */
// Três estilos pra desenhar um Pokémon em campo — cada um troca o conjunto de imagens da PokéAPI, tudo montado
// pelo id (como o shiny), então nunca depende do que ficou salvo em m.data:
//   'classico' (padrão) → dados.SPR, o pixel-art de sempre. Tem versão de costas.
//   '3d'                → dados.SPR_3D ("home": render 2D do modelo 3D dos jogos modernos). SEM costas — cai no
//                          mesmo fallback de frente+flip que já existe pra espécie sem back 2D (render.sprCostas).
//   'animado'           → dados.SPR_ANIM (GIF do Pokémon Showdown, com animação de espera). TEM costas de verdade.
// Fica neste navegador (localStorage). Lido em toda parte que desenha um Pokémon em campo (render.spriteFrente/
// sprCostas) — mudar aqui vale no próximo render, sem precisar recriar o Pokémon.
export const ESTILO_SPRITE_KEY = 'pokerpg-estilo-sprite';
export const ESTILOS_SPRITE = [
  { id: 'classico', nome: 'Clássico', desc: 'O pixel-art de sempre.' },
  { id: '3d', nome: '3D', desc: 'Render nítido (Pokémon HOME). Sem versão de costas.' },
  { id: 'animado', nome: 'Animado', desc: 'GIF com animação de espera (Pokémon Showdown).' }
];
export const estiloSpriteAtual = () => ESTILOS_SPRITE.find(e => e.id === store.get(ESTILO_SPRITE_KEY))?.id || 'classico';
export const definirEstiloSprite = id => store.set(ESTILO_SPRITE_KEY, id);

/* ============ ajustes: animações de combate (pedido do usuário) ============ */
// Ligadas por padrão (`!== false`: save sem a chave continua com animação). Desligar apaga a tremida de quem
// apanha, a piscada colorida de dano/cura e o pulo de quem ataca — e ENCURTA a pausa entre as mensagens do
// combate (`ui.say`), porque a espera existia justamente pra dar tempo de ver a animação e ouvir o impacto.
// Quem lê isso é `ui.semAnimacao()`, que junta este ajuste com o `prefers-reduced-motion` do sistema: quem já
// pediu menos movimento no sistema não precisa vir aqui desligar de novo.
export const ANIMACOES_KEY = 'pokerpg-animacoes';
export const animacoesLigadas = () => store.get(ANIMACOES_KEY) !== false;
export const alternarAnimacoes = on => store.set(ANIMACOES_KEY, on);
