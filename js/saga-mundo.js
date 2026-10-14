/* ============ ⚔ Saga — as REGRAS do mundo (puro, testado) ============
   Andar no mapa, o que bloqueia, condição e efeito de diálogo, missões. Sem DOM, sem rede, sem sorteio escondido
   (quem sorteia recebe `sorte`). Os dados moram em `dados-saga.js`; a tela é `saga-cena.js` + `tela-saga.js`.
   Tudo fica em `S.saga` (vai junto no save): { mapa, x, y, flags, itens, rep, missoes, falas, vistos, luta, fora, final }. */
import { MAPAS_SAGA, NPCS, MISSOES_SAGA, ITENS_SAGA, DONS, TILES, TEMAS, INICIO, FACCOES, CAPITULOS } from './dados-saga.js';
import { DIFICULDADES } from './dados.js';
import { tileDaCasa, defDoTile } from './saga-arte.js';
import { esc, fmt } from './util.js';

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
  for (const k of ['flags', 'itens', 'rep', 'missoes', 'falas', 'vistos']) if (!s[k]) s[k] = {};
  /* 🗺 Por onde você já passou. Marcado AQUI, na porta por onde toda leitura do estado passa, e não em cada jeito
     de chegar num mapa (começo do jogo, porta, viagem, save antigo): assim nenhum caminho novo esquece de marcar. */
  s.vistos[s.mapa] = 1;
  return s;
}
export const visitou = (S, idMapa) => !!estadoSaga(S).vistos[idMapa];
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
// "É da ordem": tem algum dos tipos que a facção diz que são dela (`FACCOES[id].tipos`).
export const daOrdem = (m, fac) => !!m?.data?.types?.some(t => (FACCOES[fac]?.tipos || []).includes(t));
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
    && (!se.dom || temDom(P, se.dom))
    && (!se.aliado || (S.aliados || []).some(a => daOrdem(a, se.aliado)));
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
  /* Um companheiro da ordem VAI EMBORA (o primeiro da comitiva que for dela). É perda de verdade, como a bola do
     treinador: sai de `S.aliados` e não volta. O que ele segurava fica na sua mochila — a ordem chamou o
     Pokémon, não o equipamento. Sem ninguém daquela ordem na comitiva, não acontece nada. */
  if (faz.parte) {
    const i = (S.aliados || []).findIndex(a => daOrdem(a, faz.parte));
    if (i >= 0) {
      const [A] = S.aliados.splice(i, 1), f = FACCOES[faz.parte];
      if (A.item) (S.bag ||= {})[A.item] = (S.bag[A.item] || 0) + 1;
      avisos.push(`💔 <b>${esc(A.nick || fmt(A.name))}</b> foi embora: ${esc(f.emoji)} ${esc(f.nome)} chamou os seus de volta.${A.item ? ' O que ele segurava ficou na sua mochila.' : ''}`);
      pedidos.push({ partiu: true });
    }
  }
  for (const [k, n] of faz.bag || []) pedidos.push({ bag: [k, n] });
  for (const k of ['cura', 'loja', 'viajar']) if (faz[k]) pedidos.push({ [k]: true });
  // o FIM da história: o nome do final fica no save (e vai pro resumo da jornada); encerrar é com quem tem tela
  if (faz.fim) { s.final = String(faz.fim); pedidos.push({ fim: s.final }); }
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
   a tela, o mapa fica no meio (posição negativa = sobra dos dois lados). `pos` é a casa, `casa` o tamanho dela.
   `folga` = o que o HUD cobre no começo do eixo (a faixa da missão): a câmera centra você no que SOBRA e deixa o
   mapa descer até a beira dela, senão quem anda pro norte some atrás da faixa. */
export function camera(pos, casa, tela, total, folga = 0) {
  const vista = tela - folga;
  if (total <= vista) return -folga - (vista - total) / 2;
  const a = Math.min(0 - folga, total - tela), b = Math.max(0 - folga, total - tela);   // 0 − folga: sem folga, −folga daria −0
  return Math.max(a, Math.min(pos * casa + casa / 2 - folga - vista / 2, b));
}

/* ---- 🗺 a carta da região ----
   Onde cada mapa de um capítulo fica em relação aos outros, tirado das PORTAS — ninguém desenha a carta à mão, e
   mapa novo feito no editor já aparece nela. O mapa do outro lado de uma porta vai pro lado da BORDA mais próxima
   dela (porta na beira oeste → vizinho a oeste; boca de gruta perto do topo → gruta ao norte), alinhado pela casa
   da porta; se ali já tem alguém, tenta a borda seguinte, e só então empurra pra longe.
   Tudo em CASAS: { w, h, lugares: [{ id, x, y, w, h }], ligacoes: [{ de, para, x1, y1, x2, y2 }],
   saidas: [{ de, para, x, y }] } — `saidas` são as portas que levam pra um mapa de OUTRO capítulo. */
const FOLGA = 3;
const EMPURRA = { n: [0, -1], s: [0, 1], o: [-1, 0], l: [1, 0] };
export function cartaDoCapitulo(idCap) {
  const ids = Object.keys(MAPAS_SAGA).filter(id => MAPAS_SAGA[id].cap === idCap), pos = {};
  const tam = id => [MAPAS_SAGA[id].grade[0].length, MAPAS_SAGA[id].grade.length];
  const portas = id => {
    const m = MAPAS_SAGA[id], r = [];
    m.grade.forEach((linha, y) => { for (let x = 0; x < linha.length; x++) for (const o of [].concat(m.objs?.[linha[x]] || [])) {
      const [para, ch] = o?.porta || [], chega = para && MAPAS_SAGA[para] && acharChar(para, ch);
      if (chega && !r.some(p => p.x === x && p.y === y && p.para === para)) r.push({ x, y, para, ex: chega[0], ey: chega[1] });
    } });
    return r;
  };
  const livre = c => !Object.values(pos).some(p => c.x < p.x + p.w + FOLGA && p.x < c.x + c.w + FOLGA && c.y < p.y + p.h + FOLGA && p.y < c.y + c.h + FOLGA);
  // as bordas do mapa `a`, da mais perto da porta pra mais longe
  const bordas = (a, p) => { const [w, h] = tam(a); return [['n', p.y], ['o', p.x], ['l', w - 1 - p.x], ['s', h - 1 - p.y]].sort((x, y) => x[1] - y[1]).map(x => x[0]); };
  const encostar = (a, p, lado) => {
    const A = pos[a], [w, h] = tam(p.para);
    return lado === 'n' ? { x: A.x + p.x - p.ex, y: A.y - h - FOLGA, w, h } : lado === 's' ? { x: A.x + p.x - p.ex, y: A.y + A.h + FOLGA, w, h }
      : lado === 'o' ? { x: A.x - w - FOLGA, y: A.y + p.y - p.ey, w, h } : { x: A.x + A.w + FOLGA, y: A.y + p.y - p.ey, w, h };
  };
  for (const raiz of ids) {
    if (pos[raiz]) continue;
    // pedaço que só se liga ao resto por outro capítulo: vai pra direita de tudo o que já está posto
    const [w, h] = tam(raiz), postos = Object.values(pos);
    pos[raiz] = { x: postos.length ? Math.max(...postos.map(p => p.x + p.w)) + FOLGA * 2 : 0, y: 0, w, h };
    for (const fila = [raiz]; fila.length;) {
      const a = fila.shift();
      for (const p of portas(a)) {
        if (pos[p.para] || MAPAS_SAGA[p.para].cap !== idCap) continue;
        const lados = bordas(a, p), c = lados.map(l => encostar(a, p, l)).find(livre) || encostar(a, p, lados[0]);
        while (!livre(c)) { c.x += EMPURRA[lados[0]][0] * FOLGA; c.y += EMPURRA[lados[0]][1] * FOLGA; }
        pos[p.para] = c; fila.push(p.para);
      }
    }
  }
  const lugares = ids.map(id => ({ id, ...pos[id] }));
  const x0 = Math.min(0, ...lugares.map(l => l.x)), y0 = Math.min(0, ...lugares.map(l => l.y));
  for (const l of lugares) { l.x -= x0; l.y -= y0; pos[l.id] = l; }
  const ligacoes = [], saidas = [], feitas = new Set();
  for (const a of ids) for (const p of portas(a)) {
    if (MAPAS_SAGA[p.para].cap !== idCap) { saidas.push({ de: a, para: p.para, x: pos[a].x + p.x, y: pos[a].y + p.y }); continue; }
    const k = [a, p.para].sort().join('>');
    if (feitas.has(k)) continue;     // a porta de volta é a mesma ligação
    feitas.add(k);
    ligacoes.push({ de: a, para: p.para, x1: pos[a].x + p.x + .5, y1: pos[a].y + p.y + .5, x2: pos[p.para].x + p.ex + .5, y2: pos[p.para].y + p.ey + .5 });
  }
  return { w: Math.max(1, ...lugares.map(l => l.x + l.w)), h: Math.max(1, ...lugares.map(l => l.y + l.h)), lugares, ligacoes, saidas };
}
/* A cor de uma casa na miniatura: a de reserva do tile (com o tema do mapa). Tile `falsa` sai com a cor do que ele
   IMITA — senão a passagem secreta apareceria desenhada na carta. Só aceita cor hexadecimal: o ajuste `pele` de um
   mapa pode vir do pacote publicado, e esta cor vai parar dentro de um atributo. */
export function corDaCasa(mapa, x, y) {
  const ch = tileEm(mapa, x, y);
  if (ch === null) return null;
  const c = defDoTile(mapa, TILES[ch].finge || ch, { TILES, TEMAS }).c;
  return /^#[0-9a-f]{3,8}$/i.test(c) ? c : '#555555';
}
// Os capítulos em que você já pisou (pelo menos um mapa visto), na ordem da história.
export const capitulosVistos = S => { const v = estadoSaga(S).vistos; return CAPITULOS.filter(c => Object.keys(MAPAS_SAGA).some(id => v[id] && MAPAS_SAGA[id].cap === c.id)); };

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
