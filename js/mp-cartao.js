/* ============ multiplayer: como um Pokémon aparece na sala ============
   Só desenho — nenhuma regra, nenhuma rede. Fica num arquivo próprio porque a ARENA também usa isto (arena.js
   roda o motor do co-op sozinha, sem sala nenhuma): antes ela importava de `multiplayer.js`, e um arquivo de
   1190 linhas com rede dentro entrava no grafo por causa de um cartãozinho. */
import { G } from './estado.js';
import { TYPE_PT } from './dados.js';
import { spriteFrente, sprCostas, imgMon, chipsFor, badgesDeTipo } from './render.js';
import { resumoDoChefe } from './boss.js';
import { esc, clamp } from './util.js';
import { urlDeImagem } from './mp-sanear.js';   // sprite vinda da rede não entra no HTML sem passar por aqui

export const barra = m => {
  const pct = clamp(m.hp / m.stats.hp * 100, 0, 100);
  return `<div class="hp"><span>HP</span><div class="bar"><div class="fill" style="width:${pct}%;background:${pct > 50 ? '#5FB36A' : pct > 20 ? '#F7C548' : '#E4572E'}"></div></div><span>${esc(m.hp)}/${esc(m.stats.hp)}</span></div>`;
};
// chefe do evento semanal (boss.js): couraça, ponto fraco, fase e o aviso do golpe carregado — o que o grupo precisa combinar
export function blocoChefeMP(m) {
  const r = resumoDoChefe(m); if (!r) return '';
  return `<div class="boss-info">
    ${r.temCoura ? `<div class="hp boss-coura ${r.exposto ? 'exposto' : ''}"><span>🛡</span><div class="bar"><div class="fill" style="width:${Math.round(r.couraFracao * 100)}%"></div></div><span>${r.exposto ? 'EXPOSTO' : ''}</span></div>` : r.exposto ? '<div class="boss-fase" style="color:#e4572e">💥 EXPOSTO: dano ×1,5</div>' : ''}
    ${r.pontoFraco ? `<div class="boss-fraco">🎯 Ponto fraco: <b>${esc(TYPE_PT[r.pontoFraco] || r.pontoFraco)}</b></div>` : ''}
    ${r.anula ? `<div class="boss-fraco" title="${esc(r.textoAnula)}">🚫 Imune a: <b>${r.anula.map(t => esc(TYPE_PT[t] || t)).join(', ')}</b></div>` : ''}
    ${r.temReverso ? (r.reverso ? '<div class="boss-carga" role="alert">🔄 MUNDO REVERSO: tipos INVERTIDOS agora!</div>' : '<div class="boss-fase">🔄 Mundo Reverso (alterna)</div>') : ''}
    ${r.adaptado !== undefined ? `<div class="boss-fraco">🧬 Adaptado a: <b>${r.adaptado ? esc(TYPE_PT[r.adaptado] || r.adaptado) : '—'}</b></div>` : ''}
    ${r.regenera ? '<div class="boss-fase">🧬 Regenera (exponha-o pra parar)</div>' : ''}
    ${r.escudo ? '<div class="boss-fase" style="color:#1c7ed6">🛡 Escudo Astral ativo</div>' : ''}
    <div class="boss-fase">☄ Fase ${esc(r.fase)}/3</div>
    ${r.carregando ? `<div class="boss-carga" role="alert">⚠ Carregando o ${esc(r.rotuloCarga)}! Faltam <b>${esc(r.faltaParaInterromper)}</b> de dano neste turno pra interromper.</div>` : ''}
  </div>`;
}
// o que o Pokémon "está" agora na luta (Mega, Tera e Gigantamax do co-op) — só aparece enquanto vale
export const marcasMP = m => [m.mega && `⚡ ${m.mega.forma?.nome || 'Mega'}`, m.tera && `💎 Tera ${TYPE_PT[m.tera] || m.tera}`, m.dyna && '🔴 Gigante'].filter(Boolean).join(' · ');
export function cartao(m, legenda, destaque = false) {
  const marcas = marcasMP(m);
  return `<div class="mp-mon ${m.hp <= 0 ? 'caido' : ''} ${destaque ? 'vez' : ''} ${G.sala?.atuandoRef === m.ref ? 'atacando' : ''}" data-ref="${esc(m.ref || '')}"><img src="${urlDeImagem(spriteFrente(m))}" alt="" onerror="this.onerror=null;this.src='${urlDeImagem(m.data.sprite)}'">
    <div><b>${m.shiny ? '✨ ' : ''}${esc(m.nome)}</b> <span class="muted small">Nv. ${esc(m.level)}</span>${marcas ? ` <span class="small">${esc(marcas)}</span>` : ''}${legenda ? `<small class="muted">${esc(legenda)}</small>` : ''}${barra(m)}${blocoChefeMP(m)}</div></div>`;
}

/* ---------- a CENA da luta em sala (29/09/2026) ----------
   Antes a batalha multiplayer era uma lista de cartõezinhos de 64 px: dava pra ler, mas não parecia uma batalha —
   e, pior, não mostrava status nem estágios (o jogador não via que estava envenenado). Agora é a mesma cena do
   jogo sozinho: fundo de campo, sprite grande (de costas do seu lado, como manda a série) e placa de papel com
   tipos, HP e condições. Reaproveita `.scene.battle`, `.mon`, `.spr`, `.plate` e as animações que já existem.
   Com muita gente (até 6 × 3) os sprites encolhem sozinhos, como os aliados do single player. */
export function unidadeMP(m, { costas = false, legenda = '', destaque = false } = {}) {
  const costasSrc = costas ? sprCostas(m) : null;
  const src = costasSrc || spriteFrente(m);
  const cls = `spr ${costas ? 'back' : ''} ${costas && !costasSrc ? 'flip' : ''}`;   // sem sprite de costas: espelha a de frente
  return `<div class="mp-unidade ${m.hp <= 0 ? 'caido' : ''} ${destaque ? 'vez' : ''} ${G.sala?.atuandoRef === m.ref ? 'atacando' : ''}" data-ref="${esc(m.ref || '')}">
    <div class="mon ${m.hp <= 0 ? 'fainted' : ''} ${m.dyna ? 'gigante' : ''}"><div class="pad"></div>${imgMon(m, cls, src)}</div>
    <div class="plate">${placaMP(m, legenda)}</div></div>`;
}
function placaMP(m, legenda) {
  const marcas = marcasMP(m);
  return `<div class="pl-top"><span>${m.shiny ? '✨ ' : ''}${esc(m.nome)}</span><span>Nv. ${esc(m.level)}</span></div>
    <div class="types pl-tipos">${badgesDeTipo(m)}</div>
    ${marcas ? `<div class="small mp-marcas">${esc(marcas)}</div>` : ''}
    ${legenda ? `<div class="small muted mp-dono">${esc(legenda)}</div>` : ''}
    ${barra(m)}${blocoChefeMP(m)}${chipsFor(m)}`;
}
export function cenaMP(b, { legendaDe = () => '', vezRef = null } = {}) {
  const total = b.lados.A.length + b.lados.B.length;
  const fila = (lado, costas) => `<div class="mp-fila ${costas ? 'me' : 'foe'}">${b.lados[lado]
    .map(m => unidadeMP(m, { costas, legenda: legendaDe(m), destaque: vezRef === m.ref })).join('')}</div>`;
  return `<div class="scene battle mp-cena ${total > 4 ? 'apertada' : ''} ${total > 7 ? 'lotada' : ''}">
    ${fila('B', false)}${fila('A', true)}</div>`;
}
