/* ============ ⚔ Saga — as REGRAS do mundo (puro, testado) ============
   Andar no mapa, o que bloqueia, condição e efeito de diálogo, missões. Sem DOM, sem rede, sem sorteio escondido
   (quem sorteia recebe `sorte`). Os dados moram em `dados-saga.js`; a tela é `saga-cena.js` + `tela-saga.js`.
   Tudo fica em `S.saga` (vai junto no save): { mapa, x, y, flags, itens, rep, missoes, falas, baus, luta, fora }. */
import { MAPAS_SAGA, NPCS, MISSOES_SAGA, ITENS_SAGA, DONS, TILES, INICIO, FACCOES, CAPITULOS } from './dados-saga.js';
import { DIFICULDADES } from './dados.js';
import { tileDaCasa } from './saga-arte.js';

export const DIRS = { n: [0, -1], s: [0, 1], o: [-1, 0], l: [1, 0] };
export const CHANCE_MATO = 0.14;     // encontro por passo no mato alto

/* O mundo vale no modo que tem a flag `mundo`, e enquanto você não saiu pelo Passo (`fora`): além dele as rotas
   seguintes ainda não têm mapa escrito e voltam a ser a lista de rotas de sempre. */
export const modoComMundo = S => !!DIFICULDADES[S?.dificuldade]?.mundo;
export const mundoAtivo = S => modoComMundo(S) && !S.saga?.fora;

export function acharChar(idMapa, ch) {
  const g = MAPAS_SAGA[idMapa]?.grade || [];
  for (let y = 0; y < g.length; y++) { const x = g[y].indexOf(ch); if (x >= 0) return [x, y]; }
  return null;
}
// O estado nasce sozinho na primeira leitura: save de Saga anterior ao mundo começa na aldeia, sem migração.
export function estadoSaga(S) {
  if (!S.saga) S.saga = {};
  const s = S.saga;
  if (!MAPAS_SAGA[s.mapa]) { const [x, y] = acharChar(INICIO.mapa, INICIO.em); s.mapa = INICIO.mapa; s.x = x; s.y = y; }
  for (const k of ['flags', 'itens', 'rep', 'missoes', 'falas']) if (!s[k]) s[k] = {};
  return s;
}
export const mapaDe = S => MAPAS_SAGA[estadoSaga(S).mapa];
export const capituloDe = mapa => CAPITULOS.find(c => c.id === mapa?.cap) || null;
export const temDom = (m, id) => !!m?.dons?.includes(id);
/* O efeito dos dons é DADO (`dados-saga.DONS`): o produto de um campo numérico por todos os dons que o Pokémon
   tem (`encontro` aqui; `dano`/`ruina`/`defesa` em `regras.multSaga`), e `faro` como sim/não. */
export const multDosDons = (m, campo) => (m?.dons || []).reduce((a, d) => a * (DONS[d]?.[campo] ?? 1), 1);
export const temFaro = m => (m?.dons || []).some(d => DONS[d]?.faro);

/* ---- missões ---- */
// 'nao' (não começou) · número (a etapa atual) · 'fim'
export function etapaDe(S, id) {
  const n = estadoSaga(S).missoes[id];
  return n === undefined ? 'nao' : n >= MISSOES_SAGA[id].etapas.length ? 'fim' : n;
}
export function diario(S) {
  const ativas = [], feitas = [];
  for (const [id, m] of Object.entries(MISSOES_SAGA)) {
    const e = etapaDe(S, id);
    if (e === 'fim') feitas.push({ id, nome: m.nome, secreta: !!m.secreta });
    else if (e !== 'nao') ativas.push({ id, nome: m.nome, secreta: !!m.secreta, texto: m.etapas[e] });
  }
  return { ativas, feitas };
}

/* ---- condição e efeito ---- */
const lista = v => [].concat(v);
export function vale(S, se) {
  if (!se) return true;
  const s = estadoSaga(S), P = S.player;
  return (!se.flag || lista(se.flag).every(f => s.flags[f]))
    && (!se.sem || !lista(se.sem).some(f => s.flags[f]))
    && (!se.item || !!s.itens[se.item])
    && (!se.semItem || !s.itens[se.semItem])
    && (!se.rep || (s.rep[se.rep[0]] || 0) >= se.rep[1])
    && (!se.repAbaixo || (s.rep[se.repAbaixo[0]] || 0) < se.repAbaixo[1])
    && (!se.missao || etapaDe(S, se.missao[0]) === se.missao[1])
    && (!se.tipo || !!P?.data?.types?.some(t => se.tipo.includes(t)))
    && (!se.falas || (s.falas[se.falas[0]] || 0) >= se.falas[1])
    && (!se.dom || temDom(P, se.dom));
}
/* Aplica um `faz` no save e devolve o que a tela precisa fazer com isso: `avisos` (linhas pro log) e `pedidos`
   (o que não é dado puro — mochila, cura, loja, viagem — fica pra quem tem `G` e tela). */
export function aplicar(S, faz) {
  const avisos = [], pedidos = [];
  if (!faz) return { avisos, pedidos };
  const s = estadoSaga(S);
  for (const f of lista(faz.flag || [])) s.flags[f] = true;
  for (const f of lista(faz.tira || [])) delete s.flags[f];
  if (faz.item) { s.itens[faz.item] = 1; avisos.push(`${ITENS_SAGA[faz.item].emoji} Você recebeu <b>${ITENS_SAGA[faz.item].nome}</b>.`); }
  if (faz.perde) delete s.itens[faz.perde];
  if (faz.dinheiro) { S.money = Math.max(0, (S.money || 0) + faz.dinheiro); avisos.push(`💰 ${faz.dinheiro > 0 ? '+' : '−'}₽${Math.abs(faz.dinheiro).toLocaleString('pt-BR')}`); }
  for (const [fac, n] of Object.entries(faz.rep || {})) {
    s.rep[fac] = (s.rep[fac] || 0) + n;
    avisos.push(`${FACCOES[fac].emoji} ${FACCOES[fac].nome}: reputação ${n > 0 ? 'sobe' : 'cai'}.`);
  }
  if (faz.missao) {
    /* Missão só anda PRA FRENTE: repetir uma conversa (ou falar com as pessoas fora de ordem) nunca devolve a
       missão a uma etapa anterior nem reabre uma concluída. É o que deixa um nó de fala aplicar `missao` sem
       medo de ser ouvido duas vezes. */
    const [id, e] = faz.missao, m = MISSOES_SAGA[id], antes = etapaDe(S, id);
    const alvo = e === 'fim' ? m.etapas.length : e, atual = antes === 'nao' ? -1 : antes === 'fim' ? Infinity : antes;
    if (alvo > atual) {
      s.missoes[id] = alvo;
      const selo = m.secreta ? '🕯 Missão secreta' : '📜 Missão';
      if (e === 'fim') avisos.push(`${selo} concluída: <b>${m.nome}</b>.`);
      else avisos.push(`${selo} ${antes === 'nao' ? 'nova' : 'atualizada'}: <b>${m.nome}</b> — ${m.etapas[e]}`);
    }
  }
  if (faz.dom && !temDom(S.player, faz.dom)) {
    S.player.dons = [...(S.player.dons || []), faz.dom];
    avisos.push(`✨ Dom aprendido: <b>${DONS[faz.dom].nome}</b> — ${DONS[faz.dom].desc}`);
  }
  for (const [k, n] of faz.bag || []) pedidos.push({ bag: [k, n] });
  for (const k of ['cura', 'loja', 'viajar']) if (faz[k]) pedidos.push({ [k]: true });
  return { avisos, pedidos };
}

/* ---- mapa ---- */
const existe = (S, o) => vale(S, o.se)
  && !(o.inimigo && estadoSaga(S).flags['venceu:' + o.inimigo.id]);
// O objeto que está VALENDO naquela casa (a primeira variante cuja condição fecha), ou null.
export function objetoEm(S, mapa, x, y) {
  const o = mapa.objs?.[mapa.grade[y]?.[x]];
  return (o && lista(o).find(v => existe(S, v))) || null;
}
// O tile embaixo de uma casa (o do objeto é o que ele imita, ou o chão do mapa) — a mesma leitura que o desenho faz.
export const tileEm = (mapa, x, y) => tileDaCasa(mapa, x, y, TILES);
export const atravessa = o => !!(o.porta || o.gatilho || o.chegada || o.passa);
export function bloqueia(S, mapa, x, y) {
  const t = tileEm(mapa, x, y);
  if (t === null) return true;
  const o = objetoEm(S, mapa, x, y);
  return o ? !atravessa(o) : !!TILES[t].bloqueia;
}
export const bauAberto = (S, id) => !!estadoSaga(S).flags['bau:' + id];

/* Um passo. Devolve o que aconteceu, e a tela decide o que mostrar:
   { tipo: 'parede' } · { tipo: 'objeto', obj } (esbarrou em algo que bloqueia: conversa, baú, luta) ·
   { tipo: 'porta', de, para } · { tipo: 'andou', mato, gatilho? } */
export function passo(S, dir) {
  const s = estadoSaga(S), mapa = mapaDe(S), [dx, dy] = DIRS[dir];
  const x = s.x + dx, y = s.y + dy;
  s.dir = dir;
  const o = objetoEm(S, mapa, x, y);
  if (o && !atravessa(o)) return { tipo: 'objeto', obj: o };
  if (bloqueia(S, mapa, x, y)) return { tipo: 'parede' };
  s.x = x; s.y = y; s.passos = (s.passos || 0) + 1;
  if (o?.porta) {
    const [para, ch] = o.porta, [px, py] = acharChar(para, ch), de = s.mapa;
    s.mapa = para; s.x = px; s.y = py;
    return { tipo: 'porta', de, para };
  }
  return { tipo: 'andou', mato: !!TILES[tileEm(mapa, x, y)].mato, gatilho: o?.gatilho ? o : null };
}
export const sorteiaEncontro = (S, sorte = Math.random) => sorte() < CHANCE_MATO * multDosDons(S.player, 'encontro');

/* Caminho até uma casa (toque no mapa), em busca em largura: lista de direções, [] se não dá. O destino pode
   ser algo que bloqueia — aí o último passo é o esbarrão (é assim que se "toca num NPC pra falar"). */
export function caminho(S, tx, ty) {
  const s = estadoSaga(S), mapa = mapaDe(S), larg = mapa.grade[0].length;
  if (tileEm(mapa, tx, ty) === null || (tx === s.x && ty === s.y)) return [];
  const veio = new Map([[s.y * larg + s.x, null]]), fila = [[s.x, s.y]];
  while (fila.length) {
    const [x, y] = fila.shift();
    for (const [d, [dx, dy]] of Object.entries(DIRS)) {
      const nx = x + dx, ny = y + dy, k = ny * larg + nx, alvo = nx === tx && ny === ty;
      if (veio.has(k) || (!alvo && bloqueia(S, mapa, nx, ny))) continue;
      if (alvo && bloqueia(S, mapa, nx, ny) && !objetoEm(S, mapa, nx, ny)) continue;   // parede não é destino
      veio.set(k, [x, y, d]);
      if (alvo) {
        const dirs = [];
        for (let p = veio.get(k); p; p = veio.get(p[1] * larg + p[0])) dirs.unshift(p[2]);
        return dirs;
      }
      // porta no meio do caminho levaria pra outro mapa: só serve de DESTINO
      if (!objetoEm(S, mapa, nx, ny)?.porta) fila.push([nx, ny]);
    }
  }
  return [];
}
/* Onde a câmera fica num eixo, em pixels: centrada em você, presa nas bordas do mapa — e, se o mapa é menor que
   a tela, o mapa fica no meio (posição negativa = sobra dos dois lados). `pos` é a casa, `casa` o tamanho dela. */
export function camera(pos, casa, tela, total) {
  if (total <= tela) return -(tela - total) / 2;
  return Math.max(0, Math.min(pos * casa + casa / 2 - tela / 2, total - tela));
}

/* ---- diálogo ---- */
// Por onde a conversa começa, e conta mais uma conversa com aquele NPC (é o que `se.falas` lê).
export function comecarConversa(S, idNpc) {
  const npc = NPCS[idNpc], s = estadoSaga(S);
  const no = npc.falas.find(f => vale(S, f.se)).no;
  s.falas[idNpc] = (s.falas[idNpc] || 0) + 1;
  return no;
}
export const opcoesDe = (S, no) => (no.opcoes || []).filter(o => vale(S, o.se));
/* O balão em cima de um NPC: '!' = tem missão nova pra dar, '?' = uma missão sua anda (ou termina) aqui. Lê o que
   a conversa FARIA agora, andando pelos nós que dá pra alcançar. Missão secreta nunca acende balão — senão não
   seria secreta. */
export function marcaDoNpc(S, idNpc) {
  const npc = NPCS[idNpc];
  if (!npc) return null;
  const vistos = new Set(), fila = [npc.falas.find(f => vale(S, f.se))?.no];
  let marca = null;
  while (fila.length) {
    const k = fila.shift(), no = npc.nos[k];
    if (!no || vistos.has(k)) continue;
    vistos.add(k);
    const ops = opcoesDe(S, no);
    for (const m of [no.faz, ...ops.map(o => o.faz)].map(f => f?.missao).filter(Boolean)) {
      if (MISSOES_SAGA[m[0]]?.secreta) continue;
      const e = etapaDe(S, m[0]);
      if (e === 'nao') marca = marca || '!'; else if (e !== 'fim') marca = '?';
    }
    fila.push(no.vai, ...ops.map(o => o.vai));
  }
  return marca;
}

/* ---- luta que o MAPA começou ----
   `tela-saga` anota `S.saga.luta = { flag }` antes de chamar a batalha, e `batalha.endBattle` (a porta única do
   fim de luta) chama isto. Vai no save com o resto: recarregar no meio da luta não perde nem ganha a marca. */
export function fimDaLuta(S, venceu) {
  const s = S?.saga, l = s?.luta;
  if (!l) return;
  delete s.luta;
  if (venceu && l.flag) estadoSaga(S).flags[l.flag] = true;
}
