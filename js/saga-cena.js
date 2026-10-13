/* ============ ⚔ Saga — o DESENHO do mundo ============
   Só produz HTML (mapa, controles, diário, caixa de fala) com `data-act`; quem despacha é o `main.js` e quem
   executa é `tela-saga.js`. Fica ABAIXO do `render.js` no grafo de imports (ele desenha o mapa na cena), então
   não importa nada de batalha — por isso o sprite do jogador chega por parâmetro.
   Nenhum texto de fora entra aqui sem `esc()`: o único é o nome do Alfa (dado da rota, editável pela nuvem). */
import { rotasAtuais } from './estado.js';
import { SPR } from './dados.js';
import { esc } from './util.js';
import { urlDeImagem } from './mp-sanear.js';
import { TILES, NPCS, FACCOES, ITENS_SAGA, DONS } from './dados-saga.js';
import { VISAO, estadoSaga, mapaDe, objetoEm, tileEm, camera, bauAberto, diario, temDom } from './saga-mundo.js';

const EMOJI_INIMIGO = { bando: '🐾', treinador: '🎒' };
const boneco = (src, cls, nome) => `<img class="casa-spr ${cls}" src="${src}" alt="${esc(nome)}" title="${esc(nome)}" draggable="false">`;

function htmlObjeto(S, mapa, o) {
  if (o.npc) return boneco(SPR(NPCS[o.npc].sprite), 'npc', NPCS[o.npc].nome);
  if (o.inimigo) {
    const alfa = o.inimigo.tipo === 'alfa' && rotasAtuais()[mapa.rota]?.chefe;
    return alfa ? boneco(SPR(alfa.id), 'alfa', `Alfa: ${alfa.nome}`) : `<span class="casa-e ronda">${EMOJI_INIMIGO[o.inimigo.tipo] || '🐾'}</span>`;
  }
  if (o.bau) return `<span class="casa-e ${bauAberto(S, o.bau) ? 'aberto' : ''}">${o.emoji || '🧰'}</span>`;
  if (o.placa) return `<span class="casa-e">${o.emoji || '🪧'}</span>`;
  return o.emoji ? `<span class="casa-e">${o.emoji}</span>` : '';
}
// Só a grade (é o que se repinta a cada passo, sem redesenhar a ficha inteira).
export function htmlGrade(S, spriteEu) {
  const s = estadoSaga(S), mapa = mapaDe(S), { x0, y0 } = camera(S), faro = temDom(S.player, 'faro');
  let h = '';
  for (let y = y0; y < y0 + VISAO[1]; y++) for (let x = x0; x < x0 + VISAO[0]; x++) {
    const ch = tileEm(mapa, x, y);
    if (ch === null) { h += '<div class="casa vazio"></div>'; continue; }
    const o = objetoEm(S, mapa, x, y), t = TILES[o?.como || ch], eu = x === s.x && y === s.y;
    const dentro = eu ? boneco(urlDeImagem(spriteEu), 'eu', 'Você') : o ? htmlObjeto(S, mapa, o) : '';
    h += `<div class="casa ${t.c}${t.falsa && faro ? ' cintila' : ''}" data-act="saga-ir" data-v="${x},${y}">${dentro || (t.e ? `<span class="casa-e chao">${t.e}</span>` : '')}</div>`;
  }
  return h;
}
export function htmlMundo(S, spriteEu) {
  const mapa = mapaDe(S), ativa = diario(S).ativas[0];
  return `<div class="zone-head"><h2>${mapa.nome}</h2><p><span class="gen-tag">⚔ Capítulo 1 · Vale do Orvalho</span> ${mapa.desc}</p></div>
    <div class="saga-mapa" id="saga-mapa" style="--cols:${VISAO[0]}">${htmlGrade(S, spriteEu)}</div>
    <p class="small saga-rumo">${ativa ? `📜 <b>${ativa.nome}:</b> ${ativa.texto}` : '<span class="muted">Nenhuma missão em andamento. Converse com quem mora aqui.</span>'}</p>`;
}
export function pintarMapa(S, spriteEu) {
  const el = document.getElementById('saga-mapa');
  if (el) el.innerHTML = htmlGrade(S, spriteEu);
}
export function htmlControles(S, dis) {
  const n = diario(S).ativas.length;
  const seta = (d, s, nome) => `<button class="btn ghost dpad-${d}" data-act="saga-andar" data-v="${d}" aria-label="Andar pra ${nome}" ${dis}>${s}</button>`;
  return `<div class="saga-ctl">
      <div class="dpad">${seta('n', '▲', 'cima')}${seta('o', '◀', 'esquerda')}${seta('l', '▶', 'direita')}${seta('s', '▼', 'baixo')}</div>
      <div class="saga-lado">
        <button class="btn" data-act="saga-diario" ${dis}>📖 Diário${n ? ` <span class="bolinha">${n}</span>` : ''}</button>
        <p class="small muted">Toque no mapa pra ir até lá, ou use as setas / WASD. Esbarre em alguém pra conversar.</p>
      </div>
    </div>`;
}
export function htmlDiario(S) {
  const s = estadoSaga(S), { ativas, feitas } = diario(S), dons = S.player?.dons || [];
  const itens = Object.keys(s.itens).filter(k => ITENS_SAGA[k]);
  const sec = (titulo, corpo) => `<h4 class="bag-div">${titulo}</h4>${corpo}`;
  return `<div class="saga-diario"><h3>📖 Diário</h3>
    ${sec('Missões', ativas.length ? ativas.map(m => `<p>${m.secreta ? '🕯' : '📜'} <b>${m.nome}</b><br><span class="small">${m.texto}</span></p>`).join('') : '<p class="small muted">Nenhuma em andamento.</p>')}
    ${feitas.length ? sec('Concluídas', `<p class="small muted">${feitas.map(m => `✓ ${m.nome}`).join(' · ')}</p>`) : ''}
    ${itens.length ? sec('Itens-chave', itens.map(k => `<p>${ITENS_SAGA[k].emoji} <b>${ITENS_SAGA[k].nome}</b><br><span class="small muted">${ITENS_SAGA[k].desc}</span></p>`).join('')) : ''}
    ${dons.length ? sec('Dons', dons.filter(k => DONS[k]).map(k => `<p>${DONS[k].emoji} <b>${DONS[k].nome}</b><br><span class="small muted">${DONS[k].desc}</span></p>`).join('')) : ''}
    ${sec('Reputação', `<p class="small">${Object.entries(FACCOES).map(([k, f]) => `${f.emoji} ${f.nome}: <b>${s.rep[k] > 0 ? '+' : ''}${s.rep[k] || 0}</b>`).join(' · ')}</p>`)}
  </div>`;
}
export const htmlFala = (npc, fala) => `<div class="saga-fala"><img class="retrato" src="${SPR(npc.sprite)}" alt="">
  <div><b class="quem">${npc.nome}</b><p>${fala}</p></div></div>`;
// O jogo fora do Vale (depois do Passo do Norte) usa a lista de rotas de sempre; este botão é o caminho de volta.
export const botaoVoltarAoVale = dis => `<button class="btn ghost" data-act="saga-voltar" ${dis}>🗺 Voltar ao Vale do Orvalho</button>`;
