/* ============ ⚔ Saga — o DESENHO do mundo ============
   A tela "de jogo" do modo: o mapa ocupa tudo, a câmera desliza, e o resto (ficha, mochila, registro) vira
   gaveta. Três camadas, da de baixo pra de cima:
     1. o CHÃO, pintado UMA vez num <canvas> do tamanho do mapa inteiro (fundo + bordas automáticas);
     2. as COISAS — árvore, casa, baú, NPC — como elementos soltos, com `z-index` pela linha: quem está mais
        embaixo na tela passa na frente, então dá pra andar atrás de uma copa;
     3. o HUD (comitiva, missão, direcional, botões).
   Andar NÃO redesenha nada: só troca duas variáveis de CSS (onde você está, onde a câmera está) e a transição
   faz o deslize. Por isso o passo é barato até em mapa grande.

   Só produz HTML e mexe no próprio pedaço de tela; quem despacha `data-act` é o `main.js` e quem executa é o
   `tela-saga.js`. Fica ABAIXO do `render.js` no grafo de imports — nada de batalha aqui: o sprite do jogador e
   as rotas chegam por parâmetro. Todo texto que pode vir de fora (apelido, e o conteúdo publicado pela nuvem)
   passa por `esc()` ou por `textoSeguro()`. */
import { rotulo } from './estado.js';
import { SPR } from './dados.js';
import { esc } from './util.js';
import { urlDeImagem } from './mp-sanear.js';
import { TILES, TEMAS, NPCS, FACCOES, ITENS_SAGA, DONS, MAPAS_SAGA, CAPITULOS } from './dados-saga.js';
import { ATLAS, ARTE, BLOBS, PROPS, GENTE } from './dados-saga-arte.js';
import { desenhoDaCasa, propDaCasa } from './saga-arte.js';
import { estadoSaga, mapaDe, capituloDe, objetoEm, tileEm, bauAberto, diario, temFaro, marcaDoNpc, camera, cartaDoCapitulo, corDaCasa, capitulosVistos } from './saga-mundo.js';

export const TAB_ARTE = { TILES, TEMAS, ARTE, BLOBS };
export const MS_PASSO = 170;                 // quanto dura o deslize de uma casa (o CSS lê o mesmo número em --passo)
const T = ATLAS.tam, LARGURA_ZOOM_2 = 860;   // tela mais larga que isto mostra o mapa em dobro (pixel inteiro, sem borrar)
const DIRECAO = { n: 0, o: 1, s: 2, l: 3 };
const ABERTO = { bau: 'bauAberto', bau2: 'bauAberto2', bau3: 'bauAberto', bau4: 'bauAberto2' };

/* Texto de conteúdo (fala, placa, descrição) vem do nosso arquivo OU do pacote publicado pela nuvem — então
   é escapado inteiro, e só o negrito, o itálico e a quebra de linha voltam a valer. */
export const textoSeguro = t => esc(String(t ?? '')).replace(/&lt;(\/?)(b|i)&gt;/g, '<$1$2>').replace(/&lt;br\s*\/?&gt;/g, '<br>');

/* ---- figuras ---- */
export const htmlPeca = nome => {
  const i = ARTE[nome];
  return i === undefined ? '' : `<i class="peca" style="--ax:${i % ATLAS.cols};--ay:${(i / ATLAS.cols) | 0}"></i>`;
};
export const htmlProp = nome => {
  const p = PROPS[nome];
  return p ? `<i class="prop" style="--sx:${p[0]};--sy:${p[1]};--w:${p[2]};--h:${p[3]};--dx:${p[4]};--dy:${p[5]}"></i>` : '';
};
const linhaDaGente = (nome, dir = 's') => Math.max(0, GENTE.nomes.indexOf(nome)) * 4 + DIRECAO[dir];
// Um personagem: número = Pokémon (sprite da PokéAPI, como no resto do jogo); texto = gente do atlas.
export function htmlCorpo(sprite, nome, cls = '') {
  if (typeof sprite === 'string' && GENTE.nomes.includes(sprite))
    return `<i class="sombra"></i><i class="gente ${cls}" style="--lin:${linhaDaGente(sprite)}" role="img" aria-label="${esc(nome)}"></i>`;
  if (Number(sprite) > 0)
    return `<i class="sombra"></i><span class="vira"><img class="bicho ${cls}" src="${SPR(sprite)}" alt="${esc(nome)}" title="${esc(nome)}" draggable="false"></span>`;
  return '<b class="marca perigo">?</b>';
}
/* A figura de quem não tem espécie fixa: '@alfa' = o Alfa da rota daquele mapa; '@antigo' = o lendário principal
   da Gen (o último da lista da rota final) — sejam eles quem forem nesta Gen. O resto é o que está escrito. */
export const antigoDasRotas = rotas => rotas?.find(z => z.lendarios?.length)?.lendarios.at(-1)?.id;
export const figuraDe = (sprite, mapa, rotas) => sprite === '@alfa' ? rotas?.[mapa?.rota]?.chefe?.id : sprite === '@antigo' ? antigoDasRotas(rotas) : sprite;
const ator = (x, y, dentro, cls = '', extra = '') => `<div class="ator ${cls}" style="--x:${x};--y:${y};z-index:${y * 2}" ${extra}>${dentro}</div>`;

function htmlObjeto(S, mapa, o, x, y, rotas) {
  let dentro = o.prop ? htmlProp(o.prop) : '';
  if (o.npc) {
    const n = NPCS[o.npc], m = n && marcaDoNpc(S, o.npc);
    if (!n) return '';
    const grande = n.sprite === '@alfa' || n.sprite === '@antigo';
    return ator(x, y, `${dentro}${htmlCorpo(figuraDe(n.sprite, mapa, rotas), n.nome, grande ? 'alfa' : '')}${m ? `<b class="marca ${m === '?' ? 'entrega' : ''}">${m}</b>` : ''}`, 'npc', `data-npc="${esc(o.npc)}"`);
  }
  if (o.inimigo) {
    const z = rotas?.[mapa.rota], tipo = o.inimigo.tipo;
    const corpo = tipo === 'alfa' ? htmlCorpo(z?.chefe?.id, z?.chefe ? `Alfa: ${z.chefe.nome}` : 'Alfa', 'alfa')
      : tipo === 'antigos' ? htmlCorpo(antigoDasRotas(rotas), 'Os Antigos', 'alfa')
      : tipo === 'treinador' ? htmlCorpo(o.inimigo.sprite || 'cacador', 'Caçador')
      : htmlCorpo(z?.pool?.[0]?.id, 'Bando', 'vulto');
    return ator(x, y, `${dentro}${corpo}<b class="marca perigo">⚔</b>`, 'inimigo');
  }
  /* Saída pela BORDA do mapa: uma seta pra fora, acima de tudo. A copa das árvores da borda cobre a casa da porta,
     e sem a seta "nada indica que dá pra passar pelas árvores" (relato de testador, 14/10/2026). */
  const W = mapa.grade[0].length, H = mapa.grade.length;
  const lado = !o.porta ? null : x === 0 ? 'o' : x === W - 1 ? 'l' : y === 0 ? 'n' : y === H - 1 ? 's' : null;
  if (lado) return ator(x, y, `<b class="saida ${lado}" aria-hidden="true"></b>`, 'acima');
  let figura = o.arte || (o.bau ? 'bau' : o.placa && !o.prop ? 'placa' : null);
  // baú aberto troca de figura; "baú" com figura própria (uma moita de erva, uma grade) some depois de usado
  if (o.bau && bauAberto(S, o.bau)) figura = ABERTO[figura] || (o.arte ? null : 'bauAberto');
  if (figura) dentro += htmlPeca(figura);
  else if (o.emoji && !o.prop) dentro += `<span class="emoji">${esc(o.emoji)}</span>`;
  return dentro ? ator(x, y, dentro) : '';
}
/* As casas que um enfeite grande cobre ACIMA do pé dele (x0 x1 y0 y1): quem passa ali fica atrás da copa, e ela
   fica translúcida (`posicionarMundo`). Sem isso você nascia escondido atrás das árvores do rodapé de Pedralume. */
function cobre(nome, x, y) {
  const [, , w, , dx, dy] = PROPS[nome] || [0, 0, T, T, 0, 0];
  return [x + Math.floor(dx / T), x + Math.ceil((dx + w) / T) - 1, y + Math.floor(dy / T), y - 1].join(' ');
}
// Tudo o que tem altura: os enfeites que os TILES pedem (árvore, casa) e os objetos do mapa.
function htmlCoisas(S, mapa, rotas) {
  const partes = [], faro = temFaro(S.player), W = mapa.grade[0].length, H = mapa.grade.length;
  // as saídas pela borda: a copa que cobre uma delas fica sempre meio transparente, pra a trilha aparecer passando
  const saidas = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if ((x === 0 || y === 0 || x === W - 1 || y === H - 1) && objetoEm(S, mapa, x, y)?.porta) saidas.push([x, y]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = propDaCasa(mapa, x, y, TAB_ARTE);
    if (p) {
      const c = cobre(p, x, y), [x0, x1, y0, y1] = c.split(' ').map(Number);
      const vaza = saidas.some(([sx, sy]) => sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1);
      partes.push(ator(x, y, htmlProp(p), vaza ? 'copa vaza' : 'copa', `data-cobre="${c}"`));
    }
    if (faro && TILES[tileEm(mapa, x, y)]?.falsa) partes.push(ator(x, y, '<b class="cintila">✨</b>', 'acima'));
    const o = objetoEm(S, mapa, x, y);
    if (o) partes.push(htmlObjeto(S, mapa, o, x, y, rotas));
  }
  return partes.join('');
}

/* ---- HUD ---- */
/* A faixa da missão aparece quando a missão MUDA (nova, etapa nova) e se recolhe sozinha depois de `MS_FAIXA`.
   Fixa, ela ficava no meio do topo do mapa pra sempre, comendo o toque de quem andava pra lá (relato de testador,
   14/10/2026: "tive que dar zoom out pra clicar onde eu queria"). O texto inteiro continua no 📖, que tem a bolinha.
   O relógio é do MÓDULO, não do DOM: `render()` refaz o HUD a cada ação e cada refazer reiniciaria a animação. */
const MS_FAIXA = 6000;
let faixaChave = null, faixaDesde = 0;
function faixaDaMissao(ativa, dis) {
  const chave = ativa ? `${ativa.id}:${ativa.texto}` : '';
  if (chave !== faixaChave) { faixaChave = chave; faixaDesde = Date.now(); }
  const resta = MS_FAIXA - (Date.now() - faixaDesde);
  /* recolhida continua no DOM, invisível: a margem dela é o que empurra a alavanca pro pé da tela */
  return `<button class="hud-missao ${resta > 0 ? '' : 'recolhida'}" data-act="saga-diario" style="animation-delay:${Math.max(0, resta)}ms" ${dis}>${ativa ? `📜 <b>${textoSeguro(ativa.nome)}</b><span>${textoSeguro(ativa.texto)}</span>` : '📖 <span>Nenhuma missão em andamento. Converse com quem mora aqui.</span>'}</button>`;
}
const GAVETAS = [['ficha', '🐾', 'Seu Pokémon'], ['aliados', '👥', 'Comitiva'], ['mochila', '🎒', 'Mochila'], ['missoes', '🎯', 'Missões da conta'], ['log', '💬', 'Registro']];
function htmlHud(S, sprite, dis, gaveta, nome) {
  const mapa = mapaDe(S), cap = capituloDe(mapa), { ativas } = diario(S), ativa = ativas[0];
  const placa = m => {
    const max = Number(m.stats?.hp) || 1, pct = Math.max(0, Math.min(100, Math.round(100 * (Number(m.hp) || 0) / max)));
    return `<div class="hud-mon ${pct <= 25 ? 'mal' : ''}"><img src="${urlDeImagem(sprite(m))}" alt="" draggable="false"><span><b>${esc(nome(m))}</b> <small>Nv. ${Number(m.level) || 0}</small><i class="hud-hp"><i style="width:${pct}%"></i></i></span></div>`;
  };
  return `<div class="saga-hud">
      <div class="hud-topo">
        <div class="hud-equipe">${[S.player, ...(S.aliados || [])].filter(Boolean).map(placa).join('')}</div>
        <button class="hud-local" data-act="saga-mapa" title="Abrir o mapa da região" aria-label="Você está em ${textoSeguro(mapa.nome)}. Abrir o mapa da região." ${dis}>🗺 ${textoSeguro(mapa.nome)}${cap ? `<small>Capítulo ${Number(cap.n) || 0} · ${textoSeguro(cap.regiao)}</small>` : ''}</button>
      </div>
      ${faixaDaMissao(ativa, dis)}
      <div class="hud-base">
        <div class="joy" id="saga-joy" role="img" aria-label="Alavanca: segure e arraste pra andar. Também dá pra tocar no mapa ou usar as setas do teclado."><i class="joy-pino"></i></div>
        <div class="hud-botoes">
          <button data-act="saga-diario" title="Diário" aria-label="Diário${ativas.length ? `: ${ativas.length} em andamento` : ''}" ${dis}>📖${ativas.length ? `<span class="bolinha">${ativas.length}</span>` : ''}</button>
          ${GAVETAS.map(([id, e, nome]) => `<button class="${gaveta === id ? 'on' : ''}" data-act="saga-gaveta" data-v="${id}" title="${nome}" aria-label="${nome}" ${dis}>${e}</button>`).join('')}
        </div>
      </div>
    </div>
    <button class="saga-scrim" data-act="saga-gaveta" data-v="" aria-label="Fechar o painel"></button>`;
}

/* ---- a tela inteira ----
   `sprite(m)` devolve o endereço do sprite de um Pokémon (render.spriteFrente); `rotas` são as rotas da jornada
   (pro Alfa e pro vulto do bando); `gaveta` é o painel aberto; `parado` desliga as animações (⚙ Ajustes). O letreiro
   do lugar só aparece quando o mapa muda. */
let ultimoMapa = null;
export function htmlMundo(S, { sprite, rotas = [], dis = '', gaveta = null, parado = false, nome = rotulo } = {}) {
  const s = estadoSaga(S), mapa = mapaDe(S), W = mapa.grade[0].length, H = mapa.grade.length, cap = capituloDe(mapa);
  const chegou = ultimoMapa !== s.mapa; ultimoMapa = s.mapa;
  /* Você aparece DUAS vezes: a de verdade (que passa atrás das copas e das casas, pela linha) e um vulto
     translúcido por cima de tudo, na mesma posição. Em campo aberto os dois coincidem e não se nota; atrás de
     uma árvore, o vulto é o que deixa ver onde você está. */
  const eu = `<span class="vira"><img class="bicho" src="${urlDeImagem(sprite(S.player))}" alt="Você" draggable="false"></span>`;
  return `<div class="saga-tela seco${chegou ? ' chegou' : ''}${parado ? ' parado' : ''}" id="saga-tela" style="--aw:${ATLAS.w};--mw:${W};--mh:${H}">
    <div class="saga-mundo" id="saga-mundo" data-act="saga-toque">
      <canvas class="saga-chao" id="saga-chao" width="${W * T}" height="${H * T}"></canvas>
      ${htmlCoisas(S, mapa, rotas)}
      <div class="saga-eu" id="saga-eu"><i class="sombra"></i>${eu}</div>
      <div class="saga-eu vulto-de-mim" aria-hidden="true">${eu}</div>
    </div>
    ${chegou ? `<div class="saga-letreiro"><b>${textoSeguro(mapa.nome)}</b>${cap ? `<small>Capítulo ${Number(cap.n) || 0} · ${textoSeguro(cap.nome)}</small>` : ''}</div>` : ''}
    ${htmlHud(S, sprite, dis, gaveta, nome)}
  </div>`;
}

/* ---- pintar o chão ----
   As imagens carregam uma vez; enquanto o atlas não chega (ou se nunca chegar), o chão sai nas cores de reserva
   dos tiles — o mapa continua jogável, só mais feio. */
const imagens = new Map();
let aoCarregar = null;
// Quem está desenhando agora (o jogo ou o editor) diz o que repintar quando uma imagem termina de chegar.
export const definirAoCarregar = fn => { aoCarregar = fn; };
export function carregarImagem(src) {
  if (typeof Image === 'undefined') return null;
  let r = imagens.get(src);
  if (!r) {
    r = { img: new Image(), ok: false };
    r.img.onload = () => { r.ok = true; aoCarregar?.(); };
    r.img.src = src; imagens.set(src, r);
  }
  return r.ok ? r.img : null;
}
export function pintarChao(cv, mapa) {
  const ctx = cv?.getContext?.('2d');
  if (!ctx) return;
  const atlas = carregarImagem(ATLAS.arquivo);
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < mapa.grade.length; y++) for (let x = 0; x < mapa.grade[y].length; x++) {
    const d = desenhoDaCasa(mapa, x, y, TAB_ARTE);
    if (!atlas) { ctx.fillStyle = d.cor; ctx.fillRect(x * T, y * T, T, T); continue; }
    for (const i of [d.fundo, ...d.camadas]) if (i !== null) ctx.drawImage(atlas, (i % ATLAS.cols) * T, ((i / ATLAS.cols) | 0) * T, T, T, x * T, y * T, T, T);
  }
}
// Pro editor, que desenha o mapa INTEIRO num canvas só (chão + enfeites + objetos): as mesmas figuras, à mão.
export function figuraNoCanvas(ctx, nome, x, y) {
  const atlas = carregarImagem(ATLAS.arquivo), i = ARTE[nome];
  if (atlas && i !== undefined) ctx.drawImage(atlas, (i % ATLAS.cols) * T, ((i / ATLAS.cols) | 0) * T, T, T, x * T, y * T, T, T);
  return !!atlas && i !== undefined;
}
export function propNoCanvas(ctx, nome, x, y) {
  const atlas = carregarImagem(ATLAS.arquivo), p = PROPS[nome];
  if (atlas && p) ctx.drawImage(atlas, p[0], p[1], p[2], p[3], x * T + p[4], y * T + p[5], p[2], p[3]);
}
export function corpoNoCanvas(ctx, sprite, x, y) {
  if (typeof sprite === 'string' && GENTE.nomes.includes(sprite)) {
    const g = carregarImagem(GENTE.arquivo);
    if (g) ctx.drawImage(g, 0, linhaDaGente(sprite) * GENTE.quadro, 64, 64, x * T - 16, y * T - 34, 64, 64);
    return !!g;
  }
  const img = Number(sprite) > 0 ? carregarImagem(SPR(sprite)) : null;
  if (img) ctx.drawImage(img, x * T - 32, y * T - 46, 96, 96);
  return !!img;
}

/* ---- ligar a tela depois que o HTML entrou na página ---- */
let zoom = 1;
const el = id => document.getElementById(id);
const numero = v => (typeof v === 'number' && isFinite(v) ? v : 0);
function medir(tela) {
  tela.style?.setProperty?.('--passo', `${MS_PASSO}ms`);
}
/* O zoom: pixel inteiro (1, ou 2 em tela larga) e, se o mapa não enche a tela, o quanto falta pra encher — sem a
   faixa preta embaixo do mapa no celular em pé. Teto 2: uma sala pequena num celular comprido ficaria gigante (a
   sobra dela é o escuro de fora, como nos jogos). Em quartos de passo pra casa de 32 px cair em pixel CSS inteiro. */
function zoomDaTela(tela, mapa) {
  const w = numero(tela.clientWidth), h = numero(tela.clientHeight);
  const cobre = Math.max(w / (mapa.grade[0].length * T), h / (mapa.grade.length * T));
  return Math.max(w >= LARGURA_ZOOM_2 ? 2 : 1, Math.min(2, Math.ceil(cobre * 4) / 4));
}
// Quanto do topo da tela o HUD cobre (a faixa da missão, o nome do lugar): a câmera desconta.
function folgaDoHud(tela) {
  const topo = tela.getBoundingClientRect?.()?.top;
  if (!Number.isFinite(topo)) return 0;
  return Math.max(0, ...[...(tela.querySelectorAll?.('.hud-missao, .hud-local') || [])].map(e => numero(e.getBoundingClientRect().bottom) - topo));
}
/* Põe você e a câmera no lugar. `seco` = sem deslizar (primeira pintura, troca de mapa); `andando` liga o
   pulinho. O sprite vira conforme o lado (os da PokéAPI olham pra esquerda: indo pra direita, espelha). */
export function posicionarMundo(S, { seco = false, andando = false } = {}) {
  const tela = el('saga-tela'), mundo = el('saga-mundo'), eu = el('saga-eu');
  if (!tela || !mundo || !eu) return;
  const s = estadoSaga(S), mapa = mapaDe(S), def = (k, v) => mundo.style?.setProperty?.(k, v);
  zoom = zoomDaTela(tela, mapa);
  tela.style?.setProperty?.('--u', zoom);
  const casa = T * zoom;
  tela.classList.toggle('seco', seco);
  def('--cx', camera(s.x, casa, numero(tela.clientWidth), mapa.grade[0].length * casa));
  def('--cy', camera(s.y, casa, numero(tela.clientHeight), mapa.grade.length * casa, folgaDoHud(tela)));
  def('--ex', s.x); def('--ey', s.y);
  if (eu.style) eu.style.zIndex = s.y * 2 + 1;
  for (const a of Array.from(mundo.querySelectorAll?.('.ator.copa') || [])) {   // Array.from: o DOM de mentira dos testes devolve qualquer coisa
    const [x0, x1, y0, y1] = (a.dataset?.cobre || '').split(' ').map(Number);
    a.classList.toggle('atras', s.x >= x0 && s.x <= x1 && s.y >= y0 && s.y <= y1);
  }
  // o lado pra onde você olha e o pulinho valem pros dois (você e o seu vulto), então ficam no mundo
  if (s.dir === 'l') def('--vira', -1); else if (s.dir === 'o') def('--vira', 1);
  mundo.classList.toggle('andando', andando);
}
/* A tela muda de tamanho sem avisar: a barra do topo ganha os botões DEPOIS da cena ser desenhada, a fonte
   termina de carregar, o celular gira, a janela é redimensionada. Câmera e zoom dependem do tamanho — então quem
   manda recalcular é um observador de tamanho (da tela do mundo E da barra do topo), não o momento do desenho.
   Foi o primeiro defeito que o navegador de verdade mostrou: medida na hora do desenho, a área do mapa tinha
   altura 0 e a câmera ia parar no pé do mapa, com a tela quase toda preta. */
/* 🕹 A alavanca (joystick) do celular. Segurar e arrastar manda uma DIREÇÃO (ou null, ao soltar) pra quem
   estiver ouvindo; quem anda é o motor (`tela-saga`), que continua passo a passo enquanto a direção durar.
   Quatro direções, não oito: o mapa é de casas, e andar na diagonal não existe.
   `definirDirecional` é o ouvinte do JOGO (registrado uma vez por `tela-saga`); o ▶ Testar do editor passa o
   dele em `ligarMundo`. O repique a cada 180 ms existe porque dedo parado não gera evento — sem ele, encostar
   numa parede e continuar segurando pararia de vez. */
let direcionalDoJogo = null, direcional = null;
export const definirDirecional = fn => { direcionalDoJogo = fn; };
function ligarAlavanca() {
  const joy = el('saga-joy'), pino = joy?.querySelector?.('.joy-pino');
  if (!joy?.addEventListener || !pino?.style) return;
  let dedo = null, dir = null, relogio = null;
  const mandar = d => { dir = d; direcional?.(d); };
  const soltar = () => { dedo = null; pino.style.transform = ''; clearInterval(relogio); joy.classList.remove('ativo'); mandar(null); };
  const mover = e => {
    const r = joy.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy), max = r.width * 0.3, k = dist > max ? max / dist : 1;
    pino.style.transform = `translate(${dx * k}px,${dy * k}px)`;
    mandar(dist < r.width * 0.13 ? null : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'l' : 'o') : (dy > 0 ? 's' : 'n'));
  };
  joy.addEventListener('pointerdown', e => {
    e.preventDefault(); dedo = e.pointerId; joy.setPointerCapture?.(e.pointerId); joy.classList.add('ativo'); mover(e);
    clearInterval(relogio);
    // a tela pode ser redesenhada com o dedo ainda embaixo (uma conversa abriu): o elemento velho some sem avisar
    relogio = setInterval(() => { if (!joy.isConnected) { clearInterval(relogio); direcional?.(null); } else if (dir) direcional?.(dir); }, 180);
  });
  joy.addEventListener('pointermove', e => { if (e.pointerId === dedo) mover(e); });
  for (const fim of ['pointerup', 'pointercancel', 'lostpointercapture']) joy.addEventListener(fim, e => { if (e.pointerId === dedo) soltar(); });
}
/* A barra do topo muda de altura (os atalhos entram depois, a fonte carrega, o celular gira), e a tela cheia —
   mapa OU luta — começa logo abaixo dela. Um observador só, ligado uma vez, mantém `--saga-topo` em dia. */
let olhoDoTopo = null;
export function ligarTelaCheia() {
  const topo = document.querySelector('.top');
  const medirTopo = () => {
    const raiz = document.documentElement?.style;
    raiz?.setProperty?.('--saga-topo', `${numero(topo?.offsetHeight) || 56}px`);
    raiz?.setProperty?.('--saga-topo-l', `${numero(topo?.offsetWidth)}px`);   // a largura, pro celular deitado (a barra flutua)
  };
  medirTopo();
  if (olhoDoTopo || typeof ResizeObserver === 'undefined' || !topo) return;
  olhoDoTopo = new ResizeObserver(medirTopo);
  olhoDoTopo.observe(topo);
}
// Na luta da Saga, ficha e comitiva abrem em gaveta (o registro e os comandos já estão na tela).
export const atalhosDaLuta = gaveta => `<div class="luta-atalhos">
    ${[['ficha', '🐾', 'Seu Pokémon'], ['aliados', '👥', 'Comitiva']].map(([id, e, nome]) => `<button class="btn ghost sm ${gaveta === id ? 'on' : ''}" data-act="saga-gaveta" data-v="${id}" title="${nome}">${e} ${nome}</button>`).join('')}
  </div><button class="saga-scrim" data-act="saga-gaveta" data-v="" aria-label="Fechar o painel"></button>`;

let observador = null, jornadaNaTela = null;
function reajustar() {
  const tela = el('saga-tela');
  if (!tela || !jornadaNaTela) return;
  medir(tela);
  posicionarMundo(jornadaNaTela, { seco: true });
}
export function ligarMundo(S, { direcional: ouvinte } = {}) {
  const tela = el('saga-tela');
  if (!tela) return;
  jornadaNaTela = S;
  direcional = ouvinte || direcionalDoJogo;
  // a animação apaga a faixa; o relógio garante (sem animação, em ⚙ Ajustes ou no sistema, ela ficaria)
  const faixa = tela.querySelector?.('.hud-missao:not(.recolhida)');
  if (faixa) setTimeout(() => faixa.classList.add('recolhida'), Math.max(0, MS_FAIXA - (Date.now() - faixaDesde)));
  ligarAlavanca();
  aoCarregar = () => { if (el('saga-chao')) pintarChao(el('saga-chao'), mapaDe(S)); };
  pintarChao(el('saga-chao'), mapaDe(S));
  reajustar();
  observador?.disconnect();
  if (typeof ResizeObserver !== 'undefined') {     // (no Node de teste não existe: lá vale só o ajuste de cima)
    observador = new ResizeObserver(reajustar);
    observador.observe(tela);
    const topo = document.querySelector('.top');
    if (topo) observador.observe(topo);
  }
}

// Em que casa do mapa caiu um toque/clique (ou null, se foi fora).
export function casaDoToque(e) {
  const r = el('saga-mundo')?.getBoundingClientRect?.();
  if (!r) return null;
  const casa = T * zoom, x = Math.floor((numero(e.clientX) - numero(r.left)) / casa), y = Math.floor((numero(e.clientY) - numero(r.top)) / casa);
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}
// Um efeito de tela (clarão antes da luta, escurecer ao trocar de mapa): liga a classe e devolve quanto esperar.
export function efeitoDeTela(nome, ms) {
  const t = el('saga-tela');
  if (!t) return 0;
  t.classList.remove(nome); void t.offsetWidth; t.classList.add(nome);   // tirar, forçar leitura e pôr = a animação recomeça
  return ms;
}
// O NPC vira pra você quando a conversa começa (gente troca de linha na folha; Pokémon espelha).
export function virarNpc(idNpc, dir) {
  const a = document.querySelector?.(`.ator[data-npc="${globalThis.CSS?.escape ? CSS.escape(idNpc) : idNpc}"]`);
  const g = a?.querySelector?.('.gente'), nome = NPCS[idNpc]?.sprite;
  if (g && typeof nome === 'string') g.style?.setProperty?.('--lin', linhaDaGente(nome, dir));
  a?.style?.setProperty?.('--vira', dir === 'l' ? -1 : 1);
}

/* ---- diário e fala (vão na caixa `ui.ask`) ---- */
export function htmlDiario(S) {
  const s = estadoSaga(S), { ativas, feitas } = diario(S), dons = S.player?.dons || [];
  const itens = Object.keys(s.itens).filter(k => ITENS_SAGA[k]);
  const sec = (titulo, corpo) => `<h4 class="bag-div">${titulo}</h4>${corpo}`;
  const linha = (emoji, nome, desc) => `<p>${esc(emoji || '')} <b>${textoSeguro(nome)}</b><br><span class="small muted">${textoSeguro(desc)}</span></p>`;
  return `<div class="saga-diario"><h3>📖 Diário</h3>
    ${sec('Missões', ativas.length ? ativas.map(m => linha(m.secreta ? '🕯' : '📜', m.nome, m.texto)).join('') : '<p class="small muted">Nenhuma em andamento.</p>')}
    ${feitas.length ? sec('Encerradas', `<p class="small muted">${feitas.map(m => m.perdida ? `<span title="Não dá mais pra cumprir">✗ ${textoSeguro(m.nome)} (perdida)</span>` : `✓ ${textoSeguro(m.nome)}`).join(' · ')}</p>`) : ''}
    ${itens.length ? sec('Itens-chave', itens.map(k => linha(ITENS_SAGA[k].emoji, ITENS_SAGA[k].nome, ITENS_SAGA[k].desc)).join('')) : ''}
    ${dons.some(k => DONS[k]) ? sec('Dons', dons.filter(k => DONS[k]).map(k => linha(DONS[k].emoji, DONS[k].nome, DONS[k].desc)).join('')) : ''}
    ${sec('Reputação', `<p class="small">${Object.entries(FACCOES).map(([k, f]) => `${esc(f.emoji)} ${textoSeguro(f.nome)}: <b>${s.rep[k] > 0 ? '+' : ''}${Number(s.rep[k]) || 0}</b>`).join(' · ')}</p>`)}
    <p class="small muted saga-creditos">Arte do mapa: Liberated Pixel Cup — Lanea Zimmerman, Stephen Challener e outros (CC-BY-SA 3.0). Créditos completos em img/saga/CREDITOS.txt.</p>
  </div>`;
}
/* ---- 🗺 a carta da região (também vai na caixa `ui.ask`) ----
   O capítulo desenhado de cima: cada mapa é uma MINIATURA (uma casa = um quadradinho, na cor do tile) no lugar
   que `saga-mundo.cartaDoCapitulo` tirou das portas. Onde você ainda não pisou aparece só como um vulto com "?" —
   dá pra ver que existe (e mais ou menos onde), não o que é nem por onde se entra: caminho entre dois lugares só
   é traçado quando os DOIS já foram visitados, e porta só é marcada quando leva a um lugar conhecido. É o que faz
   a Clareira do Sineiro ser um vulto ao norte do bosque desde o primeiro dia, sem entregar a árvore falsa.
   É um SVG de texto (um <path> por cor, as casas emendadas em tiras): não precisa de canvas nem de esperar o
   HTML entrar na página, e fica nítido em qualquer tamanho de tela. */
function miniatura(mapa, ox, oy) {
  const porCor = new Map();
  for (let y = 0; y < mapa.grade.length; y++) {
    let ini = 0, cor = null;
    for (let x = 0; x <= mapa.grade[y].length; x++) {
      const c = x < mapa.grade[y].length ? corDaCasa(mapa, x, y) : null;
      if (c === cor) continue;
      if (cor !== null) porCor.set(cor, (porCor.get(cor) || '') + `M${ox + ini} ${oy + y}h${x - ini}v1h${ini - x}z`);
      cor = c; ini = x;
    }
  }
  return [...porCor].map(([cor, d]) => `<path fill="${cor}" d="${d}"/>`).join('');
}
export function htmlCarta(S, idCap) {
  const s = estadoSaga(S), cap = CAPITULOS.find(c => c.id === idCap) || capituloDe(mapaDe(S)) || CAPITULOS[0];
  const carta = cartaDoCapitulo(cap.id), visto = id => !!s.vistos[id], vistos = capitulosVistos(S);
  const M = 2, u = Math.max(carta.w + M * 2, (carta.h + M * 2) * 1.25) / 46;      // `u` = o tamanho de um selo, pra ele ter o mesmo tamanho na tela em qualquer região
  // o número fica no CANTO do lugar visitado (no meio ele taparia a miniatura); o "?" do vulto, no meio
  const selo = (l, i) => { const v = visto(l.id), x = v ? l.x + u : l.x + l.w / 2, y = v ? l.y + u : l.y + l.h / 2;
    return `<g class="carta-selo"><circle cx="${x}" cy="${y}" r="${u * 1.2}"/><text x="${x}" y="${y}" font-size="${u * 1.6}">${v ? i + 1 : '?'}</text></g>`; };
  const lugares = carta.lugares.map((l, i) => visto(l.id)
    ? `<g class="carta-lugar${l.id === s.mapa ? ' aqui' : ''}">${miniatura(MAPAS_SAGA[l.id], l.x, l.y)}<rect class="carta-borda" x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}"/></g>`
    : `<rect class="carta-fechado" x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="${u * .8}"/>`).join('');
  const vias = carta.ligacoes.filter(v => visto(v.de) && visto(v.para)).map(v => `<line class="carta-via" x1="${v.x1}" y1="${v.y1}" x2="${v.x2}" y2="${v.y2}"/>`).join('');
  // portas conhecidas: as que ligam dois lugares visitados, e as saídas pra OUTRA região (de um lugar visitado)
  const portas = [...carta.ligacoes.filter(v => visto(v.de) && visto(v.para)).flatMap(v => [[v.x1, v.y1], [v.x2, v.y2]]),
    ...carta.saidas.filter(p => visto(p.de)).map(p => [p.x + .5, p.y + .5])]
    .map(([x, y]) => `<rect class="carta-porta" x="${x - u * .45}" y="${y - u * .45}" width="${u * .9}" height="${u * .9}" transform="rotate(45 ${x} ${y})"/>`).join('');
  const aqui = carta.lugares.find(l => l.id === s.mapa);
  const eu = aqui ? `<circle class="carta-eu" cx="${aqui.x + s.x + .5}" cy="${aqui.y + s.y + .5}" r="${u * .6}"/>` : '';
  const saidas = [...new Set(carta.saidas.filter(p => visto(p.de)).map(p => MAPAS_SAGA[p.para]?.cap))].map(id => CAPITULOS.find(c => c.id === id)).filter(Boolean);
  const legenda = carta.lugares.map((l, i) => visto(l.id)
    ? `<li class="${l.id === s.mapa ? 'aqui' : ''}"><b>${i + 1}</b> ${textoSeguro(MAPAS_SAGA[l.id].nome)}${l.id === s.mapa ? ' <span>📍 você está aqui</span>' : ''}</li>`
    : '<li class="fechado"><b>?</b> ??? <span>você ainda não passou por aqui</span></li>').join('');
  const falta = carta.lugares.filter(l => !visto(l.id)).length;
  return `<div class="saga-carta">
    <h3>🗺 ${textoSeguro(cap.regiao || cap.nome)}</h3>
    <p class="small muted">Capítulo ${Number(cap.n) || 0} · ${textoSeguro(cap.nome)}${falta ? ` · <b>${falta}</b> ${falta > 1 ? 'lugares' : 'lugar'} por descobrir` : ' · região toda explorada'}</p>
    <svg class="carta" viewBox="${-M} ${-M} ${carta.w + M * 2} ${carta.h + M * 2}" role="img" aria-label="Mapa de ${textoSeguro(cap.regiao || cap.nome)}">${lugares}${vias}${portas}${carta.lugares.map(selo).join('')}${eu}</svg>
    <ol class="carta-legenda">${legenda}</ol>
    ${saidas.length ? `<p class="small muted">◆ Passagens: ${saidas.map(c => vistos.includes(c) ? textoSeguro(c.regiao || c.nome) : '???').join(' · ')}</p>` : ''}
    <div class="carta-regioes">${CAPITULOS.map(c => `<span class="${c.id === cap.id ? 'on' : ''}${vistos.includes(c) ? '' : ' fechado'}">${vistos.includes(c) ? `${Number(c.n) || 0}. ${textoSeguro(c.regiao || c.nome)}` : `${Number(c.n) || 0}. 🔒 ???`}</span>`).join('')}</div>
  </div>`;
}
// `fala` já vem pronta de quem chama (com o nome do jogador trocado e tudo escapado).
export const htmlFala = (npc, fala) => `<div class="saga-fala"><div class="retrato">${htmlCorpo(npc.sprite, npc.nome)}</div>
  <div><b class="quem">${textoSeguro(npc.nome)}</b><p>${fala}</p></div></div>`;
// O jogo fora do mapa (depois do último capítulo escrito) usa a lista de rotas de sempre; este botão é a volta.
export const botaoVoltarAoVale = dis => `<button class="btn ghost" data-act="saga-voltar" ${dis}>🗺 Voltar ao mapa da Saga</button>`;
