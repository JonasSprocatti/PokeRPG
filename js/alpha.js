/* ============ insígnia Alpha ============
   Quem entrou no jogo durante o Alpha ganha, pra sempre, uma insígnia na conta: uma Poké Ball dourada com o α no
   botão. Sem tabela, sem contador: a regra é a DATA DE CRIAÇÃO DA CONTA (`perfis.criado_em`, que vem do servidor e
   o jogador não consegue mexer). Conta criada antes de `ALPHA_ATE` = jogador do Alpha. Quem chegar no Beta, depois
   dessa data, não tem — é exatamente o que faz ela valer alguma coisa.
   Puro (sem DOM, sem rede): tests/alpha.test.js. */

// Fim do Alpha: contas criadas ANTES deste instante são do Alpha (2026-09-26 00:00 em Brasília). É a única coisa
// a mexer se a data do Beta mudar — e, uma vez publicado o Beta, NÃO se mexe mais.
export const ALPHA_ATE = '2026-09-26T03:00:00Z';

export function ehJogadorAlpha(criadoEm) {
  const t = Date.parse(criadoEm);
  return Number.isFinite(t) && t < Date.parse(ALPHA_ATE);
}

let seq = 0; // ids do SVG únicos por desenho (a insígnia pode aparecer no topo e na conta ao mesmo tempo)

/* A insígnia: medalha dourada com raios, uma Poké Ball e o α no botão. `compacto` = versão pequena pro topo. */
export function htmlInsigniaAlpha({ compacto = false } = {}) {
  const k = `al${++seq}`;
  const raios = Array.from({ length: 16 }, (_, i) => `<rect x="58.6" y="3" width="2.8" height="${i % 2 ? 9 : 14}" rx="1.4" transform="rotate(${i * 22.5} 60 60)"/>`).join('');
  const estrela = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-6 1.8-1.9 6.2-1.6 2.8 1.2 3.9 5.5 0 3.1-3.9 5.5-2.8 1.2-6.2-1.6-1.8-1.9Z"/>`;
  return `<svg class="alpha-svg ${compacto ? 'compacto' : ''}" viewBox="0 0 120 120" role="img" aria-label="Insígnia Alpha: jogador do Alpha do PokéRPG" focusable="false">
    <defs>
      <linearGradient id="${k}-ouro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4b8"/><stop offset=".45" stop-color="#f6c744"/><stop offset="1" stop-color="#a5650f"/></linearGradient>
      <linearGradient id="${k}-verm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="1" stop-color="#c81d25"/></linearGradient>
      <linearGradient id="${k}-branco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfd6e6"/></linearGradient>
      <radialGradient id="${k}-luz" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <clipPath id="${k}-bola"><circle cx="60" cy="60" r="35"/></clipPath>
    </defs>
    <g class="alpha-raios" fill="url(#${k}-ouro)">${raios}</g>
    <circle cx="60" cy="60" r="49" fill="#1b1f45" stroke="url(#${k}-ouro)" stroke-width="5"/>
    <circle cx="60" cy="60" r="43" fill="none" stroke="#f6c744" stroke-opacity=".35" stroke-width="1" stroke-dasharray="2 3"/>
    <g clip-path="url(#${k}-bola)">
      <rect x="20" y="20" width="80" height="40" fill="url(#${k}-verm)"/>
      <rect x="20" y="60" width="80" height="40" fill="url(#${k}-branco)"/>
      <rect x="20" y="56" width="80" height="8" fill="#1b1f45"/>
    </g>
    <circle cx="60" cy="60" r="35" fill="url(#${k}-luz)"/>
    <circle cx="60" cy="60" r="35" fill="none" stroke="#1b1f45" stroke-width="4"/>
    <circle cx="60" cy="60" r="13" fill="#1b1f45"/>
    <circle cx="60" cy="60" r="10" fill="url(#${k}-ouro)"/>
    <text x="60" y="65.2" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="14" fill="#3a2404">α</text>
    <g fill="#ffe27a" class="alpha-estrelas">${estrela(60, 12.5, 1.1)}${estrela(22, 30, .7)}${estrela(98, 30, .7)}</g>
  </svg>`;
}

// O cartão da tela Conta: a insígnia grande, o título e a data em que a conta nasceu
export function htmlCartaoAlpha(criadoEm) {
  const d = new Date(criadoEm), data = Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
  return `<section class="pv conta alpha-card" aria-label="Insígnia Alpha">
    <div class="alpha-medalha">${htmlInsigniaAlpha()}</div>
    <div class="alpha-texto">
      <span class="alpha-selo">Insígnia exclusiva</span>
      <h3>Treinador do Alpha</h3>
      <p>Você estava aqui desde o começo: jogou o PokéRPG antes de o Beta abrir. Esta insígnia é sua <b>para sempre</b> — quem chegar depois não consegue mais.</p>
      ${data ? `<p class="small muted">Conta criada em ${data}.</p>` : ''}
    </div>
  </section>`;
}
