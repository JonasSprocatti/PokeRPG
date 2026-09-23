/* ============ navegação entre as telas ============ */
// Toda tela fora do jogo (carreira, ranking, conta, jornadas salvas, bugs, ajustes, multiplayer) começa com a MESMA
// barra: um botão grande de voltar (pro jogo, se houver jornada; senão pra tela inicial) e atalhos pras outras telas.
// Assim nunca dá pra ficar preso numa tela nem precisar adivinhar como sair. Esc também volta (main.js).
// `atual` = id da tela em que você está (fica marcada e sem link).
import { G } from './estado.js';
import { temNovidade } from './novidades.js';

export const TELAS = [
  { id: 'create', act: 'inicio', rotulo: '🏠 Início', dica: 'Tela inicial (começar uma jornada)' },
  { id: 'saves', act: 'saves', rotulo: '💾 Jornadas', dica: 'Suas jornadas salvas' },
  { id: 'carreira', act: 'carreira', rotulo: '📊 Carreira', dica: 'Tudo o que você já fez' },
  { id: 'pokedex', act: 'pokedex', rotulo: '📖 Pokédex', dica: 'Tudo o que a sua conta já encontrou' },
  { id: 'conquistas', act: 'conquistas', rotulo: '🏅 Conquistas', dica: 'Progresso das gimmicks e marcos da conta' },
  { id: 'ranking', act: 'ranking', rotulo: '🏆 Ranking', dica: 'Ranking global' },
  { id: 'mp', act: 'mp', rotulo: '👥 Multiplayer', dica: 'Jogar com amigos' },
  { id: 'conta', act: 'conta', rotulo: '👤 Conta', dica: 'Login, ícone e amigos' },
  { id: 'patch', act: 'patch', rotulo: '📜 Novidades', dica: 'O que mudou no jogo' },
  { id: 'ajustes', act: 'ajustes', rotulo: '⚙ Ajustes', dica: 'Fonte do jogo' },
  { id: 'relatos', act: 'relatos', rotulo: '🐞 Bugs', dica: 'Bugs e sugestões' }
];
export const rotuloVoltar = () => G.S ? '← Voltar ao jogo' : '← Voltar ao início';

// Barra de navegação. Na tela inicial o "voltar" só aparece se houver uma jornada em andamento.
export function barraTelas(atual = '') {
  const voltar = atual !== 'create' || G.S ? `<button class="btn nav-voltar" data-act="voltar">${rotuloVoltar()}</button>` : '';
  const chips = TELAS.filter(t => t.id !== atual && !(t.id === 'create' && !G.S))  // sem jornada, o "voltar" já leva ao início
    .map(t => `<button class="btn ghost sm ${t.id === 'patch' && temNovidade() ? 'com-novidade' : ''}" data-act="${t.act}" title="${t.dica}">${t.rotulo}${t.id === 'patch' && temNovidade() ? ' <span class="bolinha" aria-label="novidade">novo</span>' : ''}</button>`).join('');
  return `<nav class="nav-telas" aria-label="Telas do jogo">${voltar}<div class="nav-atalhos">${chips}</div></nav>`;
}
