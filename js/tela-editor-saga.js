/* ============ 🌍 Editor de mundo (só admin) ============
   Onde se FAZ o mundo da ⚔ Saga pelo navegador: pintar mapa, pôr personagem, escrever conversa, montar missão —
   e andar por ele na hora, sem jornada e sem rede (▶ Testar). As operações são de `editor-saga.js` (puro,
   testado); aqui é só tela.

   Como a tela funciona, em quatro regras:
   1. O RASCUNHO (`R`) é o mundo inteiro, guardado neste navegador a cada mudança. Enquanto ele existe, é ele que
      o 📤 Publicar manda (pelo publicador ÚNICO, `tela-editor-rotas.publicar` — o pacote é um só).
   2. Todo campo carrega o CAMINHO do que edita (`data-ed='["NPCS","anciao","nome"]'`), então existe UM tratador
      de mudança pra tela inteira (`mudar`). Botão é `data-em`, tratado por `acao`. Nada daqui passa pelo
      `data-act` do `main.js`: o editor escuta o próprio pedaço de tela.
   3. A aba ⚠ Problemas roda o MESMO validador que o pacote publicado e que o teste da fábrica
      (`saga-validar.validarMundo`). Com erro, não testa nem publica — e diz onde está.
   4. ▶ Testar usa o MESMO motor do jogo (`tela-saga.criarMotor`) com outro `ctx`: a luta vira uma pergunta
      ("venceu ou perdeu?"), a mochila é de mentira e nada encosta no save. */
import { G } from './estado.js';
import { $, toast, ask, limparTopo, semAnimacao } from './ui.js';
import { esc, sleep } from './util.js';
import { barraTelas } from './navegacao.js';
import { ehAdmin } from './nuvem.js';
import { SPR, ITEMS, TYPE_PT } from './dados.js';
import { TILES, TEMAS } from './dados-saga.js';
import { ARTE, PROPS, GENTE, ATLAS } from './dados-saga-arte.js';
import { validarMundo, TIPOS_DE_INIMIGO, TIPOS_DE_OBJETO, EFEITOS_DE_DOM } from './saga-validar.js';
import { sagaAoVivo, mundoCompleto, aplicarSaga } from './conteudo.js';
import { conteudo } from './conteudo-nuvem.js';
import { propDaCasa } from './saga-arte.js';
import {
  TAB_ARTE, MS_PASSO, carregarImagem, definirAoCarregar, pintarChao, figuraNoCanvas, propNoCanvas, corpoNoCanvas,
  htmlMundo, ligarMundo, posicionarMundo, casaDoToque, efeitoDeTela, htmlCorpo, textoSeguro
} from './saga-cena.js';
import { criarMotor } from './tela-saga.js';
import { estadoSaga, fimDaLuta, DIRS } from './saga-mundo.js';
import { spriteFrente } from './render.js';
import { publicar } from './tela-editor-rotas.js';
import * as ed from './editor-saga.js';

const T = ATLAS.tam, HISTORICO_MAX = 40;
const ABAS = [['mapas', '🗺 Mapas'], ['gente', '💬 Personagens'], ['missoes', '📜 Missões'], ['coisas', '🎒 Itens, dons e capítulos'], ['problemas', '⚠ Problemas'], ['publicar', '📤 Publicar']];
const FERRAMENTAS = [['mover', '✋', 'Mover a tela (arrastar rola o mapa)'], ['pincel', '🖌', 'Pintar casa a casa'], ['ret', '▭', 'Retângulo: arraste de um canto ao outro'],
  ['balde', '🪣', 'Encher a mancha inteira'], ['obj', '👆', 'Objetos: pôr, selecionar e arrastar'], ['casa', '🏠', 'Carimbar uma casa (toque onde fica a PORTA)']];
const NOME_DO_TIPO = { npc: '💬 Personagem', porta: '🚪 Porta', placa: '🪧 Placa', enfeite: '🪨 Enfeite', bau: '🧰 Baú', inimigo: '⚔ Inimigo', gatilho: '❗ Gatilho', chegada: '📍 Chegada' };
const ARTES_SOLTAS = Object.keys(ARTE).filter(n => !/^(grama|terra|terraEscura|pedra|buraco|agua|lava)[012]$/.test(n));

let R = null, aoVivoAntes = null;           // o rascunho, e o que estava no ar quando o editor abriu (pro 🗑 Descartar)
let aba = 'mapas', mapaSel = null, ferramenta = 'mover', tileSel = '=', objSel = null, varSel = 0, armado = 'npc';
let ligando = null, npcSel = null, zoomEd = 1, arrasto = null, teste = null, tipoTeste = 'normal', saida = '';
const historico = [];

/* ---- utilidades de tela ---- */
const C = caminho => esc(JSON.stringify(caminho));
const opcoesDe = (tabela, rotulo = v => v.nome) => Object.entries(tabela).map(([k, v]) => [k, `${rotulo(v)} (${k})`]);
const guardar = () => ed.guardarRascunhoSaga(R);
const problemas = () => { try { return validarMundo(mundoCompleto(R), { ARTE, PROPS, GENTE }); } catch (e) { return [{ nivel: 'erro', onde: 'o rascunho', msg: `mal formado (${e.message})` }]; } };
function lembrar() { historico.push([mapaSel, JSON.stringify(R.MAPAS[mapaSel])]); if (historico.length > HISTORICO_MAX) historico.shift(); }

function campo(rot, caminho, o = {}) {
  const v = ed.ler(R, caminho) ?? '', tp = o.tp || 'texto', at = `data-ed="${C(caminho)}" data-tp="${tp}"`;
  let ctl;
  if (o.opcoes) ctl = `<select ${at}>${o.vazio !== undefined ? `<option value="">${esc(o.vazio)}</option>` : ''}${o.opcoes.map(([val, nome]) => `<option value="${esc(val)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(nome)}</option>`).join('')}</select>`;
  else if (tp === 'longo') ctl = `<textarea ${at} rows="${o.linhas || 3}">${esc(v)}</textarea>`;
  else if (tp === 'sim') ctl = `<input type="checkbox" ${at} ${v ? 'checked' : ''}>`;
  else ctl = `<input type="${tp === 'num' ? 'number' : 'text'}" ${at} value="${esc(Array.isArray(v) ? v.join(', ') : v)}" ${o.min !== undefined ? `min="${o.min}"` : ''} ${o.max !== undefined ? `max="${o.max}"` : ''} ${o.passo ? `step="${o.passo}"` : ''} ${o.dentro ? `placeholder="${esc(o.dentro)}"` : ''}>`;
  return `<label class="em-campo ${tp === 'longo' ? 'largo' : ''} ${tp === 'sim' ? 'curto' : ''}"><span>${rot}</span>${ctl}${o.dica ? `<small class="muted">${o.dica}</small>` : ''}</label>`;
}

/* ---- condição (`se`) e efeito (`faz`): uma linha por regra, e um seletor pra acrescentar ---- */
const REGRAS_SE = [['flag', 'tem a(s) marca(s)', 'marcas'], ['sem', 'NÃO tem a(s) marca(s)', 'marcas'], ['item', 'tem o item-chave', 'item'], ['semItem', 'NÃO tem o item-chave', 'item'],
  ['missao', 'a missão está em', 'etapa'], ['rep', 'reputação é pelo menos', 'facn'], ['repAbaixo', 'reputação é menor que', 'facn'],
  ['tipo', 'o Pokémon do jogador é do tipo', 'tipos'], ['falas', 'já conversou (vezes) com', 'npcn'], ['dom', 'tem o dom', 'dom']];
const REGRAS_FAZ = [['flag', 'liga a(s) marca(s)', 'marcas'], ['tira', 'desliga a(s) marca(s)', 'marcas'], ['item', 'dá o item-chave', 'item'], ['perde', 'tira o item-chave', 'item'],
  ['dinheiro', 'dinheiro (+ dá, − tira)', 'num'], ['bag', 'itens na mochila', 'bag'], ['rep', 'reputação (+ sobe, − cai)', 'rep'], ['missao', 'põe a missão em', 'etapaFaz'],
  ['dom', 'ensina o dom', 'dom'], ['cura', 'descansa a comitiva (cobra como a pousada)', 'sim'], ['loja', 'abre a loja', 'sim'], ['viajar', 'segue viagem (fim do mapa escrito)', 'sim']];
const primeiro = t => Object.keys(t)[0];
const PADRAO = {
  marcas: () => 'marca-nova', item: () => primeiro(R.ITENS), dom: () => primeiro(R.DONS), etapa: () => [primeiro(R.MISSOES), 0], etapaFaz: () => [primeiro(R.MISSOES), 0],
  facn: () => [primeiro(R.FACCOES), 1], npcn: () => [primeiro(R.NPCS), 1], tipos: () => ['normal'], num: () => 100, bag: () => [['potion', 1]], rep: () => ({ [primeiro(R.FACCOES)]: 1 }), sim: () => true
};
function controleDaRegra(caminho, tp, v) {
  const sel = (c, opcoes, atual, tipo = 'texto') => `<select data-ed="${C(c)}" data-tp="${tipo}">${opcoes.map(([val, nome]) => `<option value="${esc(val)}" ${String(atual) === String(val) ? 'selected' : ''}>${esc(nome)}</option>`).join('')}</select>`;
  const num = (c, atual) => `<input type="number" data-ed="${C(c)}" data-tp="num" value="${esc(atual ?? '')}" class="em-num">`;
  if (tp === 'marcas') return `<input type="text" data-ed="${C(caminho)}" data-tp="lista" value="${esc([].concat(v).join(', '))}" placeholder="marca, outra-marca">`;
  if (tp === 'tipos') return `<input type="text" data-ed="${C(caminho)}" data-tp="listaSempre" value="${esc([].concat(v).join(', '))}" placeholder="grass, bug" title="${esc(Object.keys(TYPE_PT).join(', '))}">`;
  if (tp === 'item') return sel(caminho, opcoesDe(R.ITENS), v);
  if (tp === 'dom') return sel(caminho, opcoesDe(R.DONS), v);
  if (tp === 'num') return num(caminho, v);
  if (tp === 'sim') return '<span class="muted small">sim</span>';
  if (tp === 'facn') return sel([...caminho, 0], opcoesDe(R.FACCOES), v?.[0]) + num([...caminho, 1], v?.[1]);
  if (tp === 'npcn') return sel([...caminho, 0], opcoesDe(R.NPCS), v?.[0]) + num([...caminho, 1], v?.[1]);
  if (tp === 'rep') return Object.entries(R.FACCOES).map(([k, f]) => `<label class="em-mini">${esc(f.emoji)}${num([...caminho, k], v?.[k])}</label>`).join('');
  if (tp === 'bag') return `<input type="text" data-ed="${C(caminho)}" data-tp="bag" value="${esc((v || []).map(([k, n]) => `${k}:${n}`).join(', '))}" placeholder="potion:2, revive:1" title="id do item : quantidade">`;
  // missão + etapa num seletor só: cada opção é o par inteiro
  const etapas = Object.entries(R.MISSOES).flatMap(([id, m]) => [
    ...(tp === 'etapa' ? [[JSON.stringify([id, 'nao']), `${m.nome} — não começou`]] : []),
    ...(m.etapas || []).map((_, i) => [JSON.stringify([id, i]), `${m.nome} — etapa ${i + 1}`]),
    [JSON.stringify([id, 'fim']), `${m.nome} — concluída`]]);
  return sel(caminho, etapas, JSON.stringify(v), 'json');
}
function htmlRegras(titulo, caminho, REGRAS) {
  const v = ed.ler(R, caminho) || {}, faltam = REGRAS.filter(([k]) => v[k] === undefined);
  const linhas = REGRAS.filter(([k]) => v[k] !== undefined).map(([k, rot, tp]) =>
    `<div class="em-regra"><span>${rot}</span>${controleDaRegra([...caminho, k], tp, v[k])}<button class="btn ghost sm" data-em="apagar" data-c="${C([...caminho, k])}" title="Tirar esta regra">✕</button></div>`).join('');
  return `<div class="em-regras"><b>${titulo}</b>${linhas || ' <span class="muted small">— nada</span>'}
    ${faltam.length ? `<select data-em-add="${C(caminho)}" data-regras="${REGRAS === REGRAS_SE ? 'se' : 'faz'}"><option value="">+ acrescentar…</option>${faltam.map(([k, rot]) => `<option value="${k}">${rot}</option>`).join('')}</select>` : ''}</div>`;
}
const condicao = (caminho, titulo = 'Só quando') => htmlRegras(titulo, caminho, REGRAS_SE);
const efeitos = (caminho, titulo = 'Efeitos') => htmlRegras(titulo, caminho, REGRAS_FAZ);

/* ================= aba 🗺 Mapas ================= */
function abaMapas() {
  const m = R.MAPAS[mapaSel];
  const mapas = Object.entries(R.MAPAS).map(([id, x]) => [id, `${x.nome} (${id})`]);
  const paleta = ferramenta === 'obj'
    ? `<div class="em-paleta">${Object.entries(NOME_DO_TIPO).map(([k, nome]) => `<button class="em-tile ${armado === k ? 'on' : ''}" data-em="armar" data-v="${k}"><span>${nome}</span></button>`).join('')}</div>
       <p class="small muted">Toque numa casa <b>vazia</b> pra pôr um(a) <b>${NOME_DO_TIPO[armado]}</b>; toque num objeto pra selecionar; <b>arraste</b> pra mudar de lugar.</p>`
    : ['pincel', 'ret', 'balde'].includes(ferramenta)
      ? `<div class="em-paleta">${Object.entries(TILES).map(([ch, t]) => `<button class="em-tile ${tileSel === ch ? 'on' : ''}" data-em="tile" data-v="${esc(ch)}" title="${esc(t.nome)}${t.bloqueia ? ' — bloqueia' : ''}${t.mato ? ' — tem encontro' : ''}"><canvas width="${T}" height="${T}" data-amostra="${esc(ch)}" style="background:${t.c}"></canvas><span>${esc(t.nome)}</span></button>`).join('')}</div>`
      : ferramenta === 'casa' ? '<p class="small muted">Toque na casa onde fica a <b>porta</b>: a casa ocupa 3×3 (a porta no meio de baixo) e o telhado sobe mais três.</p>'
        : '<p class="small muted">Arraste pra rolar o mapa. Escolha uma ferramenta acima pra editar.</p>';
  return `<div class="em-linha">
      <label>Mapa <select data-em-set="mapaSel">${mapas.map(([id, nome]) => `<option value="${esc(id)}" ${id === mapaSel ? 'selected' : ''}>${esc(nome)}</option>`).join('')}</select></label>
      <input type="text" id="em-novo-id" placeholder="id do mapa novo" class="em-id">
      <button class="btn sm" data-em="mapa-novo">+ Mapa</button>
      <button class="btn ghost sm" data-em="mapa-excluir">Excluir este</button>
      <button class="btn sm em-destaque" data-em="testar">▶ Testar este mapa</button>
    </div>
    ${ligando ? `<p class="em-aviso">🚪 <b>Ligando a porta “${esc(ligando.ch)}” de ${esc(R.MAPAS[ligando.mapa]?.nome)}.</b> Escolha o mapa de destino acima e toque na casa onde ela deve <b>chegar</b>: a porta de volta nasce ali. <button class="btn ghost sm" data-em="ligar-cancelar">Cancelar</button></p>` : ''}
    <div class="em-ferramentas">
      ${FERRAMENTAS.map(([id, e, dica]) => `<button class="btn ${ferramenta === id ? '' : 'ghost'} sm" data-em="ferramenta" data-v="${id}" title="${dica}">${e}</button>`).join('')}
      <span class="em-sep"></span>
      <button class="btn ghost sm" data-em="zoom" data-v="-1" title="Afastar">−</button><span class="small">${Math.round(zoomEd * 100)}%</span><button class="btn ghost sm" data-em="zoom" data-v="1" title="Aproximar">+</button>
      <button class="btn ghost sm" data-em="desfazer" ${historico.length ? '' : 'disabled'} title="Desfazer a última mudança no mapa">↩</button>
    </div>
    ${paleta}
    <div class="em-quadro ${ferramenta === 'mover' ? '' : 'pintando'}" id="em-quadro"><canvas id="em-canvas" width="${m.grade[0].length * T}" height="${m.grade.length * T}" style="width:${m.grade[0].length * T * zoomEd}px"></canvas></div>
    <div class="em-inspetor">${objSel && m.objs?.[objSel] ? inspetorObjeto(m) : inspetorMapa(m)}</div>`;
}
function inspetorMapa(m) {
  const base = ['MAPAS', mapaSel], chaos = Object.entries(TILES).filter(([, t]) => !t.bloqueia).map(([ch, t]) => [ch, t.nome]);
  const tam = (lado, rot) => `<span class="em-tam">${rot} <button class="btn ghost sm" data-em="tam" data-v="${lado}:-1">−</button><button class="btn ghost sm" data-em="tam" data-v="${lado}:1">+</button></span>`;
  return `<h3>Este mapa <span class="muted small">${m.grade[0].length}×${m.grade.length} casas · id ${esc(mapaSel)}</span></h3>
    <div class="em-grade">
      ${campo('Nome', [...base, 'nome'])}
      ${campo('Capítulo', [...base, 'cap'], { opcoes: R.CAPITULOS.map(c => [c.id, `${c.n}. ${c.nome}`]), vazio: '(nenhum)' })}
      ${campo('Rota da Gen', [...base, 'rota'], { tp: 'num', min: 0, max: 9, dica: '0 = a 1ª rota. É de onde saem os encontros e o Alfa.' })}
      ${campo('Tema (figuras)', [...base, 'tema'], { opcoes: Object.entries(TEMAS).map(([k, t]) => [k, t.nome]), vazio: 'padrão' })}
      ${campo('Chão padrão', [...base, 'chao'], { opcoes: chaos, dica: 'O que fica embaixo de árvores e objetos.' })}
      ${campo('Descrição', [...base, 'desc'], { tp: 'longo', linhas: 2 })}
    </div>
    <p class="em-linha"><b>Tamanho:</b> ${tam('cima', '↑ em cima')} ${tam('baixo', '↓ embaixo')} ${tam('esq', '← esquerda')} ${tam('dir', '→ direita')}</p>
    ${R.INICIO.mapa === mapaSel ? `<p class="small">📍 O jogo <b>começa</b> neste mapa, no objeto “${esc(R.INICIO.em)}”.</p>` : ''}`;
}
function inspetorObjeto(m) {
  const cru = m.objs[objSel], lista = ed.variantes(cru), multi = Array.isArray(cru);
  if (varSel >= lista.length) varSel = 0;
  const base = multi ? ['MAPAS', mapaSel, 'objs', objSel, varSel] : ['MAPAS', mapaSel, 'objs', objSel], o = lista[varSel];
  const tipo = TIPOS_DE_OBJETO.find(t => o[t] !== undefined && o[t] !== false) || 'placa', onde = ed.ondeEsta(m, objSel) || ['?', '?'];
  const portas = idMapa => Object.entries(R.MAPAS[idMapa]?.objs || {}).filter(([, x]) => ed.variantes(x).some(v => v.porta)).map(([ch]) => [ch, `porta “${ch}”`]);
  const porTipo = {
    npc: () => `${campo('Quem é', [...base, 'npc'], { opcoes: opcoesDe(R.NPCS) })}<button class="btn ghost sm" data-em="ir-npc" data-v="${esc(o.npc)}">Editar a conversa ▸</button>`,
    porta: () => `${campo('Leva pro mapa', [...base, 'porta', 0], { opcoes: Object.entries(R.MAPAS).map(([id, x]) => [id, x.nome]) })}
      ${campo('…chegando na', [...base, 'porta', 1], { opcoes: portas(o.porta?.[0]), vazio: '(escolha)' })}
      <button class="btn sm" data-em="ligar">🚪 Escolher no mapa onde ela chega</button>`,
    placa: () => campo('O que está escrito', [...base, 'placa'], { tp: 'longo' }),
    enfeite: () => campo('Texto ao esbarrar (opcional)', [...base, 'texto'], { tp: 'longo', linhas: 2 }),
    bau: () => `${campo('Id (a marca de "já abriu")', [...base, 'bau'])}${campo('O que aparece ao abrir', [...base, 'texto'], { tp: 'longo' })}${efeitos([...base, 'faz'], 'O que ele dá / faz')}`,
    inimigo: () => `${campo('Id (a marca de "já venceu")', [...base, 'inimigo', 'id'])}
      ${campo('Tipo de luta', [...base, 'inimigo', 'tipo'], { opcoes: [['bando', 'Bando selvagem da rota'], ['treinador', 'Humano com equipe (treinador)'], ['alfa', 'O Alfa da rota (chefe)']] })}
      ${campo('Figura (só humano)', [...base, 'inimigo', 'sprite'], { opcoes: GENTE.nomes.map(n => [n, n]), vazio: 'padrão' })}
      ${campo('O que aparece antes da luta', [...base, 'inimigo', 'fala'], { tp: 'longo', linhas: 2 })}`,
    gatilho: () => `${campo('Id', [...base, 'gatilho'])}${campo('O que aparece ao pisar', [...base, 'texto'], { tp: 'longo' })}${efeitos([...base, 'faz'], 'O que acontece')}`,
    chegada: () => `<p class="small">Um ponto de chegada. ${R.INICIO.mapa === mapaSel && R.INICIO.em === objSel ? '<b>É aqui que o jogo começa.</b>' : `<button class="btn sm" data-em="comeco">📍 O jogo começa aqui</button>`}</p>`
  };
  return `<h3>${NOME_DO_TIPO[tipo]} <span class="muted small">objeto “${esc(objSel)}” na casa ${onde[0]}, ${onde[1]}</span>
      <button class="btn ghost sm" data-em="obj-excluir">Excluir</button> <button class="btn ghost sm" data-em="obj-soltar">Fechar</button></h3>
    <p class="em-linha"><b>Variantes:</b> ${lista.map((_, i) => `<button class="btn ${i === varSel ? '' : 'ghost'} sm" data-em="variante" data-v="${i}">${i + 1}</button>`).join('')}
      <button class="btn ghost sm" data-em="variante-nova" title="Outra versão deste objeto, pra outra situação">+ variante</button>
      ${multi ? `<button class="btn ghost sm" data-em="variante-subir" ${varSel ? '' : 'disabled'}>↑</button><button class="btn ghost sm" data-em="variante-excluir">✕ esta</button>` : ''}
      <small class="muted">Vale a <b>primeira</b> variante cuja condição fecha. Nenhuma valendo, a casa fica vazia.</small></p>
    <div class="em-grade">${porTipo[tipo]()}</div>
    ${condicao([...base, 'se'], 'Este objeto só existe quando')}
    <div class="em-grade">
      ${campo('Figura (peça de 1 casa)', [...base, 'arte'], { opcoes: ARTES_SOLTAS.map(n => [n, n]), vazio: 'a do tipo' })}
      ${campo('Enfeite grande', [...base, 'prop'], { opcoes: Object.keys(PROPS).map(n => [n, n]), vazio: 'nenhum' })}
      ${campo('O chão embaixo imita', [...base, 'como'], { opcoes: Object.entries(TILES).map(([ch, t]) => [ch, t.nome]), vazio: 'o chão do mapa', dica: 'Uma porta que imita “Árvore” é uma passagem secreta.' })}
    </div>`;
}
/* O mapa inteiro num canvas: chão, enfeites e objetos (de cima pra baixo, pra copa cobrir quem está atrás),
   depois a grade, as letras dos objetos e o que está selecionado. */
function pintarEditor() {
  const cv = $('#em-canvas'), m = R?.MAPAS[mapaSel], ctx = cv?.getContext?.('2d');
  if (!ctx || !m || aba !== 'mapas' || teste) return;
  pintarChao(cv, m);
  const depois = [];
  for (let y = 0; y < m.grade.length; y++) for (let x = 0; x < m.grade[y].length; x++) {
    const p = propDaCasa(m, x, y, TAB_ARTE), ch = ed.objetoNaCasa(m, x, y), o = ch && ed.variantes(m.objs[ch])[ch === objSel ? varSel : 0];
    if (p) depois.push([y, () => propNoCanvas(ctx, p, x, y)]);
    if (!o) continue;
    depois.push([y + 0.5, () => {
      if (o.prop) propNoCanvas(ctx, o.prop, x, y);
      const figura = o.arte || (o.bau ? 'bau' : o.placa && !o.prop ? 'placa' : null);
      if (figura) figuraNoCanvas(ctx, figura, x, y);
      const quem = o.npc ? R.NPCS[o.npc]?.sprite : o.inimigo ? (o.inimigo.tipo === 'treinador' ? o.inimigo.sprite || 'cacador' : null) : undefined;
      if (quem !== undefined && quem !== null && quem !== '@alfa') corpoNoCanvas(ctx, quem, x, y);
    }]);
  }
  depois.sort((a, b) => a[0] - b[0]).forEach(([, f]) => f());
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0; x <= m.grade[0].length; x++) { ctx.moveTo(x * T + .5, 0); ctx.lineTo(x * T + .5, m.grade.length * T); }
  for (let y = 0; y <= m.grade.length; y++) { ctx.moveTo(0, y * T + .5); ctx.lineTo(m.grade[0].length * T, y * T + .5); }
  ctx.stroke();
  ctx.font = 'bold 11px sans-serif'; ctx.textBaseline = 'top';
  for (const ch of Object.keys(m.objs || {})) {
    const onde = ed.ondeEsta(m, ch); if (!onde) continue;
    const [x, y] = onde, o = ed.variantes(m.objs[ch])[0], tipo = TIPOS_DE_OBJETO.find(t => o[t] !== undefined && o[t] !== false);
    ctx.fillStyle = ch === objSel ? '#f6c744' : { porta: '#5aaafa', inimigo: '#e5484d', gatilho: '#c084fc', chegada: '#ffffff' }[tipo] || '#1b1b2f';
    ctx.fillRect(x * T + 1, y * T + 1, 13, 13);
    ctx.fillStyle = ['porta', 'chegada'].includes(tipo) || ch === objSel ? '#1b1b2f' : '#fff'; ctx.fillText(ch, x * T + 3, y * T + 2);
    if (ch === objSel) { ctx.strokeStyle = '#f6c744'; ctx.lineWidth = 2; ctx.strokeRect(x * T + 1, y * T + 1, T - 2, T - 2); }
  }
  if (arrasto?.tipo === 'ret' && arrasto.ate) {
    const [x0, y0] = arrasto.de, [x1, y1] = arrasto.ate;
    ctx.strokeStyle = '#f6c744'; ctx.lineWidth = 2;
    ctx.strokeRect(Math.min(x0, x1) * T + 1, Math.min(y0, y1) * T + 1, (Math.abs(x1 - x0) + 1) * T - 2, (Math.abs(y1 - y0) + 1) * T - 2);
  }
}
// As amostras da paleta: cada tile desenhado de verdade (o enfeite grande encolhe pra caber).
function pintarAmostras() {
  const atlas = carregarImagem(ATLAS.arquivo);
  if (!atlas) return;
  for (const cv of document.querySelectorAll('canvas[data-amostra]')) {
    const ch = cv.dataset.amostra, t = TILES[ch], ctx = cv.getContext?.('2d'), nome = n => [].concat(n)[0];
    if (!ctx || !t) continue;
    ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, T, T);
    const peca = n => { const i = ARTE[nome(n)]; if (i !== undefined) ctx.drawImage(atlas, (i % ATLAS.cols) * T, ((i / ATLAS.cols) | 0) * T, T, T, 0, 0, T, T); };
    peca(t.fundo ?? TILES['.'].fundo);
    for (const c of t.arte || []) { if (c?.blob) { const i = TAB_ARTE.BLOBS[c.blob] + 46; ctx.drawImage(atlas, (i % ATLAS.cols) * T, ((i / ATLAS.cols) | 0) * T, T, T, 0, 0, T, T); } else peca(c); }
    const p = PROPS[nome(t.prop)];
    if (p) { const k = Math.min(T / p[2], T / p[3]); ctx.drawImage(atlas, p[0], p[1], p[2], p[3], (T - p[2] * k) / 2, T - p[3] * k, p[2] * k, p[3] * k); }
  }
}
// Em que casa do mapa está o ponteiro (ou null, fora dele).
function casaDoPonteiro(e) {
  const cv = $('#em-canvas'), m = R.MAPAS[mapaSel], r = cv?.getBoundingClientRect?.();
  if (!r?.width) return null;
  const x = Math.floor((e.clientX - r.left) / (r.width / m.grade[0].length)), y = Math.floor((e.clientY - r.top) / (r.height / m.grade.length));
  return x >= 0 && y >= 0 && x < m.grade[0].length && y < m.grade.length ? [x, y] : null;
}
function ponteiro(e, fase) {
  if (ferramenta === 'mover' && !ligando) return;
  const c = casaDoPonteiro(e);
  if (fase === 'baixo') {
    if (!c) return;
    e.preventDefault?.();
    if (ligando) return acao('ligar-aqui', c);
    if (ferramenta === 'pincel') { lembrar(); ed.pintar(R, mapaSel, ...c, tileSel); arrasto = { tipo: 'pincel' }; }
    else if (ferramenta === 'ret') arrasto = { tipo: 'ret', de: c, ate: c };
    else if (ferramenta === 'balde') { lembrar(); ed.balde(R, mapaSel, ...c, tileSel); guardar(); }
    else if (ferramenta === 'casa') { lembrar(); if (!ed.carimbarCasa(R, mapaSel, ...c)) { historico.pop(); toast('Não cabe uma casa aí (ela ocupa 3×3 e não pode cobrir um objeto).'); } guardar(); }
    else if (ferramenta === 'obj') {
      const ch = ed.objetoNaCasa(R.MAPAS[mapaSel], ...c);
      if (ch) { objSel = ch; varSel = 0; lembrar(); arrasto = { tipo: 'arrastar', ch, mexeu: false }; }
      else { lembrar(); const novo = ed.porObjeto(R, mapaSel, ...c, ed.MODELOS_DE_OBJETO[armado](R, mapaSel)); if (!novo) { historico.pop(); return toast('Este mapa já usa todas as letras de objeto.'); } objSel = novo; varSel = 0; guardar(); return desenhar(); }
    }
    return pintarEditor();
  }
  if (!arrasto) return;
  if (fase === 'move' && c) {
    if (arrasto.tipo === 'pincel') ed.pintar(R, mapaSel, ...c, tileSel);
    else if (arrasto.tipo === 'ret') arrasto.ate = c;
    else if (arrasto.tipo === 'arrastar' && ed.moverObjeto(R, mapaSel, arrasto.ch, ...c)) arrasto.mexeu = true;
    return pintarEditor();
  }
  if (fase === 'solta') {
    const a = arrasto; arrasto = null;
    if (a.tipo === 'ret') { lembrar(); ed.retangulo(R, mapaSel, ...a.de, ...a.ate, tileSel); }
    if (a.tipo === 'arrastar' && !a.mexeu) historico.pop();
    guardar();
    return a.tipo === 'arrastar' ? desenhar() : pintarEditor();
  }
}

/* ================= aba 💬 Personagens ================= */
function abaGente() {
  const ids = Object.keys(R.NPCS);
  if (!R.NPCS[npcSel]) npcSel = ids[0];
  const n = R.NPCS[npcSel], base = ['NPCS', npcSel], nos = Object.keys(n.nos || {}).map(k => [k, k]);
  const modo = n.sprite === '@alfa' ? 'alfa' : typeof n.sprite === 'string' ? 'gente' : 'pokemon';
  const figura = modo === 'gente' ? campo('Qual humano', [...base, 'sprite'], { opcoes: GENTE.nomes.map(x => [x, x]) })
    : modo === 'pokemon' ? campo('Nº da espécie (Pokédex)', [...base, 'sprite'], { tp: 'num', min: 1, dica: 'É só a figura: o personagem não luta.' })
      : '<p class="small muted">Usa o sprite do Alfa da rota do mapa onde estiver — seja ele quem for nesta Gen.</p>';
  const entrada = (f, i) => `<div class="em-cartao">
      <div class="em-linha"><b>${i + 1}º começo</b> ${campo('começa na fala', [...base, 'falas', i, 'no'], { opcoes: nos })}
        <button class="btn ghost sm" data-em="lista-subir" data-c="${C([...base, 'falas'])}" data-v="${i}" ${i ? '' : 'disabled'}>↑</button>
        <button class="btn ghost sm" data-em="apagar" data-c="${C([...base, 'falas', i])}" ${n.falas.length > 1 ? '' : 'disabled'}>✕</button></div>
      ${i === n.falas.length - 1 ? '<p class="small muted">A última vale <b>sempre</b> (é o padrão): não tem condição.</p>' : condicao([...base, 'falas', i, 'se'])}</div>`;
  const no = ([k, x]) => {
    const b = [...base, 'nos', k], modoNo = x.opcoes ? 'opcoes' : x.vai ? 'vai' : 'fim';
    const resposta = (o, j) => `<div class="em-cartao fundo">
        <div class="em-linha">${campo(`Resposta ${j + 1}`, [...b, 'opcoes', j, 't'])}${campo('leva pra', [...b, 'opcoes', j, 'vai'], { opcoes: nos, vazio: '(a conversa acaba)' })}
          <button class="btn ghost sm" data-em="apagar" data-c="${C([...b, 'opcoes', j])}" ${x.opcoes.length > 1 ? '' : 'disabled'}>✕</button></div>
        ${condicao([...b, 'opcoes', j, 'se'], 'Só aparece quando')}${efeitos([...b, 'opcoes', j, 'faz'], 'Ao escolher')}</div>`;
    return `<div class="em-cartao" id="em-no-${esc(k)}">
      <div class="em-linha"><b>Fala “${esc(k)}”</b>
        <label class="em-mini">depois da fala <select data-em-modo="${C(b)}">${[['fim', 'a conversa acaba'], ['vai', 'continua em outra fala'], ['opcoes', 'o jogador responde']].map(([v, r]) => `<option value="${v}" ${v === modoNo ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
        <button class="btn ghost sm" data-em="apagar" data-c="${C(b)}" ${nos.length > 1 ? '' : 'disabled'} title="Excluir esta fala">✕</button></div>
      ${campo('O que ele diz', [...b, 'fala'], { tp: 'longo', linhas: 3, dica: 'Vale <b>, <i> e <br>. {eu} = nome do jogador · {custo} = preço do descanso.' })}
      ${efeitos([...b, 'faz'], 'Ao dizer isto')}
      ${modoNo === 'vai' ? campo('Continua em', [...b, 'vai'], { opcoes: nos }) : ''}
      ${modoNo === 'opcoes' ? `${x.opcoes.map(resposta).join('')}<button class="btn ghost sm" data-em="resposta-nova" data-c="${C([...b, 'opcoes'])}">+ resposta</button>` : ''}</div>`;
  };
  return `<div class="em-linha">
      <label>Personagem <select data-em-set="npcSel">${ids.map(id => `<option value="${esc(id)}" ${id === npcSel ? 'selected' : ''}>${esc(R.NPCS[id].nome)} (${esc(id)})</option>`).join('')}</select></label>
      <input type="text" id="em-novo-id" placeholder="id do personagem novo" class="em-id">
      <button class="btn sm" data-em="npc-novo">+ Personagem</button>
      <button class="btn ghost sm" data-em="npc-excluir">Excluir este</button>
      <button class="btn sm em-destaque" data-em="simular">▶ Simular a conversa</button>
    </div>
    <div class="em-ficha"><div class="saga-fala"><div class="retrato">${htmlCorpo(modo === 'alfa' ? 0 : n.sprite, n.nome)}</div></div>
      <div class="em-grade">${campo('Nome', [...base, 'nome'])}
        <label class="em-campo"><span>Figura</span><select data-em-figura="1">${[['pokemon', 'Pokémon'], ['gente', 'Humano'], ['alfa', 'O Alfa da rota']].map(([v, r]) => `<option value="${v}" ${v === modo ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
        ${figura}</div></div>
    <h3>Por onde a conversa começa <button class="btn ghost sm" data-em="entrada-nova">+ começo com condição</button></h3>
    <p class="small muted">De cima pra baixo: vale o <b>primeiro</b> começo cuja condição fecha. É assim que o mesmo personagem diz coisas diferentes conforme o que já aconteceu.</p>
    ${n.falas.map(entrada).join('')}
    <h3>Falas <button class="btn ghost sm" data-em="no-novo">+ fala</button></h3>
    ${Object.entries(n.nos || {}).map(no).join('')}`;
}

/* ================= abas 📜 Missões e 🎒 Itens, dons e capítulos ================= */
function abaMissoes() {
  const cartao = ([id, m]) => `<div class="em-cartao">
      <div class="em-linha"><b>${m.secreta ? '🕯' : '📜'} ${esc(id)}</b>${campo('Nome', ['MISSOES', id, 'nome'])}${campo('Secreta (não aparece no diário antes de começar)', ['MISSOES', id, 'secreta'], { tp: 'sim' })}
        <button class="btn ghost sm" data-em="apagar" data-c="${C(['MISSOES', id])}">✕ missão</button></div>
      ${(m.etapas || []).map((_, i) => `<div class="em-linha">${campo(`Etapa ${i + 1} (o que o diário mostra)`, ['MISSOES', id, 'etapas', i], { tp: 'longo', linhas: 2 })}<button class="btn ghost sm" data-em="apagar" data-c="${C(['MISSOES', id, 'etapas', i])}" ${m.etapas.length > 1 ? '' : 'disabled'}>✕</button></div>`).join('')}
      <button class="btn ghost sm" data-em="etapa-nova" data-c="${C(['MISSOES', id, 'etapas'])}">+ etapa</button></div>`;
  return `<div class="em-linha"><input type="text" id="em-novo-id" placeholder="id da missão nova" class="em-id"><button class="btn sm" data-em="missao-nova">+ Missão</button></div>
    <p class="small muted">Uma missão anda por <b>efeito</b> de conversa, baú ou gatilho (“põe a missão em…”) e só anda <b>pra frente</b>. Quem a começa, quem a move e quem a conclui você decide nas falas.</p>
    ${Object.entries(R.MISSOES).map(cartao).join('')}`;
}
function abaCoisas() {
  const item = ([id]) => `<div class="em-cartao"><div class="em-linha"><b>${esc(id)}</b>${campo('Emoji', ['ITENS', id, 'emoji'])}${campo('Nome', ['ITENS', id, 'nome'])}<button class="btn ghost sm" data-em="apagar" data-c="${C(['ITENS', id])}">✕</button></div>${campo('Descrição', ['ITENS', id, 'desc'], { tp: 'longo', linhas: 2 })}</div>`;
  const dom = ([id]) => `<div class="em-cartao"><div class="em-linha"><b>${esc(id)}</b>${campo('Emoji', ['DONS', id, 'emoji'])}${campo('Nome', ['DONS', id, 'nome'])}<button class="btn ghost sm" data-em="apagar" data-c="${C(['DONS', id])}">✕</button></div>
      ${campo('Descrição (o que o jogador lê)', ['DONS', id, 'desc'], { tp: 'longo', linhas: 2 })}
      <div class="em-grade">${Object.entries({ dano: 'Dano que causa ×', ruina: 'Dano em inimigo em Ruína ×', defesa: 'Dano que recebe ×', encontro: 'Encontros no mato ×' }).map(([k, rot]) => campo(rot, ['DONS', id, k], { tp: 'num', min: EFEITOS_DE_DOM[k][0], max: EFEITOS_DE_DOM[k][1], passo: 0.01, dica: `${EFEITOS_DE_DOM[k][0]} a ${EFEITOS_DE_DOM[k][1]} · vazio = não mexe` })).join('')}
        ${campo('Faz o que está escondido cintilar', ['DONS', id, 'faro'], { tp: 'sim' })}</div></div>`;
  const cap = (c, i) => `<div class="em-cartao"><div class="em-linha"><b>${esc(c.id)}</b>${campo('Nº', ['CAPITULOS', i, 'n'], { tp: 'num', min: 1 })}${campo('Nome', ['CAPITULOS', i, 'nome'])}${campo('Região', ['CAPITULOS', i, 'regiao'])}${campo('Rota', ['CAPITULOS', i, 'rota'], { tp: 'num', min: 0, max: 9 })}
      <button class="btn ghost sm" data-em="apagar" data-c="${C(['CAPITULOS', i])}" ${R.CAPITULOS.length > 1 ? '' : 'disabled'}>✕</button></div></div>`;
  const fac = ([id]) => `<div class="em-linha"><b>${esc(id)}</b>${campo('Emoji', ['FACCOES', id, 'emoji'])}${campo('Nome', ['FACCOES', id, 'nome'])}</div>`;
  return `<h3>🗝 Itens-chave <input type="text" id="em-novo-id" placeholder="id novo" class="em-id"> <button class="btn ghost sm" data-em="item-novo">+ item</button> <button class="btn ghost sm" data-em="dom-novo">+ dom</button> <button class="btn ghost sm" data-em="cap-novo">+ capítulo</button></h3>
    <p class="small muted">Item-chave não tem efeito em batalha nem preço: só abre conversa. (Item de mochila é o da loja — aqui não se cria.)</p>
    ${Object.entries(R.ITENS).map(item).join('')}
    <h3>✨ Dons</h3><p class="small muted">Habilidades que só a Saga dá. Os números multiplicam: 1,1 = +10%; 0,9 = −10%. Dom sem número é dom “de história”, que só serve de condição em conversa.</p>
    ${Object.entries(R.DONS).map(dom).join('')}
    <h3>📖 Capítulos</h3><p class="small muted">Um capítulo por rota da Gen (rota 0 = a 1ª). O capítulo dá o título que aparece ao entrar num mapa dele.</p>
    ${R.CAPITULOS.map(cap).join('')}
    <h3>⚖ Facções</h3>${Object.entries(R.FACCOES).map(fac).join('')}`;
}

/* ================= abas ⚠ Problemas e 📤 Publicar ================= */
function abaProblemas(lista) {
  if (!lista.length) return '<p class="em-ok">✓ Nenhum problema: o mundo está inteiro. Tudo é alcançável a pé e toda conversa aponta pra algo que existe.</p>';
  const linha = p => { const mapa = p.onde.match(/^mapa (\S+?)(?:,|$)/)?.[1], obj = p.onde.match(/objeto "(.)"/)?.[1], npc = p.onde.match(/^personagem (\S+?)(?:,|$)/)?.[1];
    return `<li class="${p.nivel}">${p.nivel === 'erro' ? '⛔' : '⚠'} <b>${esc(p.onde)}</b> — ${esc(p.msg)}
      ${mapa && R.MAPAS[mapa] ? `<button class="btn ghost sm" data-em="ir-mapa" data-v="${esc(mapa)}" data-o="${esc(obj || '')}">ver ▸</button>` : ''}${npc && R.NPCS[npc] ? `<button class="btn ghost sm" data-em="ir-npc" data-v="${esc(npc)}">ver ▸</button>` : ''}</li>`; };
  return `<p class="small muted">⛔ <b>erro</b> = não dá pra testar nem publicar. ⚠ <b>aviso</b> = funciona, mas talvez não seja o que você queria.</p><ul class="em-problemas">${lista.map(linha).join('')}</ul>`;
}
function abaPublicar(lista) {
  const erros = lista.filter(p => p.nivel === 'erro').length, tem = !!ed.rascunhoSaga();
  return `<p>${tem ? '✏ Há um <b>rascunho</b> neste navegador.' : 'Sem rascunho: você está vendo o que está no ar.'} Tocando hoje: versão <b>${Number(conteudo.versao) || 0}</b> (${esc(conteudo.canal)}).</p>
    ${erros ? `<p class="em-aviso">⛔ ${erros} erro(s): conserte na aba ⚠ Problemas antes de publicar.</p>` : ''}
    <div class="em-linha">
      <button class="btn" data-em="publicar" ${erros ? 'disabled' : ''}>📤 Publicar no teste</button>
      <button class="btn ghost" data-em="liberar" ${erros ? 'disabled' : ''}>✅ Liberar pra todos</button>
      <button class="btn ghost" data-em="descartar" ${tem ? '' : 'disabled'}>🗑 Descartar o rascunho</button>
    </div>
    <p class="small muted"><b>📤 Publicar no teste</b> manda o rascunho pra nuvem num canal que só a conta de manutenção vê — é como você joga o mundo novo numa jornada de verdade, neste e em outros aparelhos. <b>✅ Liberar pra todos</b> promove o que está no teste. O pacote é <b>um só</b>: sai junto com rotas, música e o resto.</p>
    <h3>⬇ Arquivo pro repositório</h3>
    <p class="small muted">O conteúdo publicado some se a nuvem sumir; o repositório não. Gere o arquivo e cole em <code>js/dados-saga-mundo.js</code> pra que o mundo vire o de fábrica.</p>
    <div class="em-linha"><button class="btn ghost sm" data-em="gerar">⬇ Gerar e copiar o arquivo</button></div>
    <textarea id="em-saida" rows="8" readonly placeholder="O arquivo aparece aqui.">${esc(saida)}</textarea>`;
}

/* ================= ▶ Testar ================= */
const motorTeste = criarMotor({
  S: () => teste.S, nome: () => 'Você', alfa: () => 0, custoDescanso: () => 'grátis no teste',
  travado: () => !teste || teste.ocupado || !!document.querySelector('.modal'),
  conversando: () => !!teste,
  ocupar(v) { if (teste) teste.ocupado = v; },
  mover: o => posicionarMundo(teste.S, { ...o, seco: semAnimacao() }),
  esperarPasso: () => semAnimacao() ? null : sleep(MS_PASSO),
  async efeito(nome, ms) { if (!semAnimacao()) await sleep(efeitoDeTela(nome, ms)); },
  redesenhar: () => desenhar(),
  salvar() {},
  log: html => { teste.log.push(html); },
  ask,
  aviso: html => toast(html, 5000),
  bag(k, n) { teste.S.bag[k] = (teste.S.bag[k] || 0) + n; return ITEMS[k]?.name || k; },
  descansar() { teste.log.push('🛏 (teste) a comitiva descansaria aqui, pagando como na pousada.'); },
  loja() { toast('🛒 (teste) aqui abriria a loja.'); },
  viajar: () => '🧭 (teste) aqui o jogador segue viagem pra além do mapa escrito.',
  async lutar(tipo, flag) {
    const venceu = await ask(`⚔ <b>Luta (${esc(tipo)})</b><br><br>No teste a luta não acontece de verdade. Como ela terminou?`, [{ label: '🏆 Venci', value: true }, { label: '💀 Perdi ou fugi', value: false, ghost: true }]);
    if (flag) estadoSaga(teste.S).luta = { flag };
    fimDaLuta(teste.S, venceu);
  },
  encontro: async () => false,           // sem encontro aleatório no teste: atrapalharia andar pelo mapa
  aCadaPasso: async () => {},
  chegou(r) { teste.log.push(`Você chega a <b>${textoSeguro(R.MAPAS[r.para]?.nome)}</b>.`); },
  depois: async () => {},
  erro(e) { console.error(e); toast(`Erro no teste: ${esc(e.message)}`); }
});
function novoTeste(mapa, x, y) {
  return { ocupado: false, log: [], S: { dificuldade: 'saga', money: 500, bag: {}, aliados: [],
    player: { name: 'voce', nick: 'Você', level: 20, hp: 60, stats: { hp: 60 }, data: { types: [tipoTeste], sprite: '' }, dons: [] }, saga: { mapa, x, y } } };
}
// Onde o teste começa num mapa: no começo do jogo, se for o mapa dele; senão na primeira porta ou chegada; senão na primeira casa livre.
function entradaDoMapa(id) {
  const m = R.MAPAS[id];
  if (R.INICIO.mapa === id && ed.ondeEsta(m, R.INICIO.em)) return ed.ondeEsta(m, R.INICIO.em);
  const porta = Object.entries(m.objs || {}).find(([, o]) => ed.variantes(o).some(v => v.porta || v.chegada));
  if (porta && ed.ondeEsta(m, porta[0])) return ed.ondeEsta(m, porta[0]);
  for (let y = 0; y < m.grade.length; y++) for (let x = 0; x < m.grade[y].length; x++) if (TILES[m.grade[y][x]] && !TILES[m.grade[y][x]].bloqueia) return [x, y];
  return [1, 1];
}
function htmlTeste() {
  const s = estadoSaga(teste.S), linha = (rot, v) => `<p class="small"><b>${rot}:</b> ${v || '<span class="muted">—</span>'}</p>`;
  const sprite = () => (G.S?.player ? spriteFrente(G.S.player) : SPR(132));
  return `<div class="em-linha">
      <button class="btn" data-em="teste-sair">⏹ Voltar ao editor</button>
      <button class="btn ghost sm" data-em="teste-zerar">↺ Zerar o teste</button>
      <label class="em-mini">Testar como tipo <select data-em-set="tipoTeste">${Object.entries(TYPE_PT).map(([k, v]) => `<option value="${k}" ${k === tipoTeste ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
    </div>
    <p class="small muted">Ande com as setas, WASD, o direcional ou tocando no mapa. A luta vira uma pergunta; nada aqui encosta em save.</p>
    <div class="em-teste" id="em-teste">${htmlMundo(teste.S, { sprite, rotas: [], parado: semAnimacao() })}</div>
    <details class="em-estado" open><summary>Estado do teste</summary>
      ${linha('Marcas', Object.keys(s.flags).map(esc).join(', '))}
      ${linha('Itens-chave', Object.keys(s.itens).map(k => esc(R.ITENS[k]?.nome || k)).join(', '))}
      ${linha('Missões', Object.entries(s.missoes).map(([k, n]) => `${esc(R.MISSOES[k]?.nome || k)} → ${n >= (R.MISSOES[k]?.etapas?.length ?? 0) ? 'concluída' : `etapa ${n + 1}`}`).join(' · '))}
      ${linha('Reputação', Object.entries(s.rep).map(([k, n]) => `${esc(R.FACCOES[k]?.nome || k)} ${n > 0 ? '+' : ''}${Number(n)}`).join(' · '))}
      ${linha('Dons', (teste.S.player.dons || []).map(k => esc(R.DONS[k]?.nome || k)).join(', '))}
      ${linha('Mochila', Object.entries(teste.S.bag).map(([k, n]) => `${esc(ITEMS[k]?.name || k)} ×${Number(n)}`).join(', '))}
      ${linha('Dinheiro', `₽${Number(teste.S.money) || 0}`)}
      <div class="em-log">${teste.log.slice(-10).map(l => `<p class="small">${l}</p>`).join('')}</div>
    </details>`;
}
// Antes de andar pelo rascunho, ele tem de estar inteiro — e passa a valer neste aparelho até recarregar.
function aplicarRascunho() {
  const erros = problemas().filter(p => p.nivel === 'erro');
  if (erros.length) { aba = 'problemas'; toast(`⛔ ${erros.length} erro(s) no mundo: conserte antes de testar.`); desenhar(); return false; }
  aplicarSaga(R);
  return true;
}

/* ================= a tela ================= */
function desenhar() {
  const app = $('#app'), rolagem = { y: globalThis.scrollY || 0, qx: $('#em-quadro')?.scrollLeft || 0, qy: $('#em-quadro')?.scrollTop || 0 };
  const lista = problemas(), erros = lista.filter(p => p.nivel === 'erro').length;
  if (!R.MAPAS[mapaSel]) { mapaSel = R.INICIO.mapa in R.MAPAS ? R.INICIO.mapa : Object.keys(R.MAPAS)[0]; objSel = null; }
  const corpo = teste ? htmlTeste()
    : aba === 'mapas' ? abaMapas() : aba === 'gente' ? abaGente() : aba === 'missoes' ? abaMissoes() : aba === 'coisas' ? abaCoisas()
      : aba === 'problemas' ? abaProblemas(lista) : abaPublicar(lista);
  app.innerHTML = `${barraTelas('mundo')}
    <section class="card em" id="em-raiz">
      <h2>🌍 Editor de mundo <span class="muted small">conta de manutenção · ⚔ Saga</span></h2>
      <nav class="em-abas">${ABAS.map(([id, nome]) => `<button class="btn ${aba === id && !teste ? '' : 'ghost'} sm" data-em="aba" data-v="${id}" ${teste ? 'disabled' : ''}>${nome}${id === 'problemas' && lista.length ? ` <span class="bolinha">${erros || lista.length}</span>` : ''}</button>`).join('')}</nav>
      ${corpo}
    </section>`;
  const raiz = $('#em-raiz');
  raiz?.addEventListener?.('click', aoClicar);
  raiz?.addEventListener?.('change', e => mudar(e.target));
  const cv = $('#em-canvas');
  if (cv?.addEventListener && !teste) {
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture?.(e.pointerId); ponteiro(e, 'baixo'); });
    cv.addEventListener('pointermove', e => ponteiro(e, 'move'));
    for (const fim of ['pointerup', 'pointercancel']) cv.addEventListener(fim, e => ponteiro(e, 'solta'));
  }
  definirAoCarregar(() => { if (teste) ligarMundo(teste.S); else { pintarEditor(); pintarAmostras(); } });
  if (teste) ligarMundo(teste.S); else { pintarEditor(); pintarAmostras(); }
  const q = $('#em-quadro'); if (q && 'scrollLeft' in q) { q.scrollLeft = rolagem.qx; q.scrollTop = rolagem.qy; }
  globalThis.scrollTo?.(0, rolagem.y);
}
function aoClicar(e) {
  // dentro do teste, os botões do HUD do mundo são do TESTE — não podem chegar ao despacho do jogo (main.js)
  const doMundo = teste && e.target.closest?.('#em-teste [data-act]');
  if (doMundo) {
    e.stopPropagation();
    const a = doMundo.dataset.act;
    if (a === 'saga-andar') motorTeste.andar(doMundo.dataset.v);
    else if (a === 'saga-toque') { const c = casaDoToque(e); if (c) motorTeste.irPara(...c); }
    else if (a === 'saga-diario') motorTeste.abrirDiario();
    return;
  }
  const b = e.target.closest?.('[data-em]');
  if (b && !b.disabled) acao(b.dataset.em, b.dataset.v, b.dataset);
}
globalThis.document?.addEventListener?.('keydown', e => {
  const dir = { ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'o', ArrowRight: 'l', w: 'n', s: 's', a: 'o', d: 'l' }[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (!teste || !dir || G.mode !== 'editor-mundo' || e.target.matches?.('input,textarea,select')) return;
  e.preventDefault(); motorTeste.andar(dir);
});

/* Um botão do editor. `v` é o valor (texto) e `d` o resto dos `data-*`. Devolve nada: mexe no rascunho, guarda e
   redesenha. Exportada porque o teste de fumaça aperta os botões por aqui. */
export function acao(nome, v, d = {}) {
  const m = R.MAPAS[mapaSel], novoId = base => { const digitado = ($('#em-novo-id')?.value || '').trim(); return digitado || base; };
  const caminho = d.c ? JSON.parse(d.c) : null;
  const objBase = () => (Array.isArray(m.objs[objSel]) ? ['MAPAS', mapaSel, 'objs', objSel, varSel] : ['MAPAS', mapaSel, 'objs', objSel]);
  const fazer = {
    aba: () => { aba = v; },
    ferramenta: () => { ferramenta = v; },
    tile: () => { tileSel = v; },
    armar: () => { armado = v; },
    zoom: () => { zoomEd = Math.max(0.5, Math.min(2, zoomEd + (Number(v) > 0 ? 0.25 : -0.25))); },
    desfazer: () => { const h = historico.pop(); if (h && R.MAPAS[h[0]]) { R.MAPAS[h[0]] = JSON.parse(h[1]); mapaSel = h[0]; objSel = null; } },
    tam: () => { const [lado, n] = v.split(':'); lembrar(); if (!ed.redimensionar(R, mapaSel, lado, Number(n))) { historico.pop(); toast('O mapa já está no tamanho mínimo.'); } if (objSel && !m.objs[objSel]) objSel = null; },
    'mapa-novo': () => {
      const id = ed.idLivre(R.MAPAS, novoId('mapa-novo')), cap = m?.cap;
      if (!ed.novoMapa(R, id, { nome: 'Mapa novo', cap, rota: m?.rota ?? 0, chao: m?.chao ?? '.' })) return toast('Id inválido: use letras minúsculas, números e hífen, começando por letra.');
      mapaSel = id; objSel = null; toast('Mapa criado. Ele ainda não está ligado ao mundo: ponha uma 🚪 Porta num mapa vizinho e ligue aqui.');
    },
    'mapa-excluir': () => { if (!ed.excluirMapa(R, mapaSel)) return toast('Não dá pra excluir o mapa onde o jogo começa (nem o último).'); mapaSel = null; objSel = null; },
    'obj-excluir': () => { lembrar(); ed.tirarObjeto(R, mapaSel, objSel); objSel = null; },
    'obj-soltar': () => { objSel = null; },
    variante: () => { varSel = Number(v) || 0; },
    'variante-nova': () => { const atual = ed.variantes(m.objs[objSel]); m.objs[objSel] = [...atual, { placa: 'Outra versão deste objeto.' }]; varSel = atual.length; },
    'variante-excluir': () => { const fica = ed.variantes(m.objs[objSel]).filter((_, i) => i !== varSel); m.objs[objSel] = fica.length === 1 ? fica[0] : fica; varSel = 0; },
    'variante-subir': () => { ed.moverNaLista(R, ['MAPAS', mapaSel, 'objs', objSel], varSel, varSel - 1); varSel--; },
    comeco: () => { R.INICIO = { mapa: mapaSel, em: objSel }; },
    ligar: () => { ligando = { mapa: mapaSel, ch: objSel }; ferramenta = 'obj'; toast('Escolha o mapa de destino e toque na casa onde a porta chega.'); },
    'ligar-cancelar': () => { ligando = null; },
    'ligar-aqui': () => {
      const [x, y] = v;
      if (ligando.mapa === mapaSel && ed.objetoNaCasa(m, x, y) === ligando.ch) return toast('Essa é a própria porta. Toque em outra casa (ou escolha outro mapa).');
      const origem = ed.variantes(R.MAPAS[ligando.mapa]?.objs?.[ligando.ch]).find(o => o.porta), alvo = ed.objetoNaCasa(m, x, y);
      if (alvo && ed.variantes(m.objs[alvo]).some(o => o.porta) && origem) { origem.porta = [mapaSel, alvo]; toast(`Ligada à porta “${alvo}” que já existia.`); }   // tocar numa porta existente só aponta pra ela
      else if (!ed.ligarPortas(R, ligando.mapa, ligando.ch, mapaSel, x, y)) return toast('Não dá pra pôr a porta de chegada aí.');
      ligando = null;
    },
    apagar: () => { ed.apagar(R, caminho); limparVazios(caminho); },
    'lista-subir': () => { ed.moverNaLista(R, caminho, Number(v), Number(v) - 1); },
    'ir-mapa': () => { aba = 'mapas'; mapaSel = v; objSel = d.o && R.MAPAS[v]?.objs?.[d.o] ? d.o : null; varSel = 0; ferramenta = 'obj'; },
    'ir-npc': () => { aba = 'gente'; npcSel = v; },
    'npc-novo': () => { const id = ed.idLivre(R.NPCS, novoId('personagem')); if (!ed.novoNpc(R, id)) return toast('Id inválido: letras minúsculas, números e hífen.'); npcSel = id; },
    'npc-excluir': () => { if (Object.keys(R.NPCS).length > 1) { ed.excluirNpc(R, npcSel); npcSel = null; } },
    'entrada-nova': () => { ed.inserir(R, ['NPCS', npcSel, 'falas'], { se: { flag: 'marca-nova' }, no: Object.keys(R.NPCS[npcSel].nos)[0] }, 0); },
    'no-novo': () => { const k = ed.idLivre(R.NPCS[npcSel].nos, novoId('fala')); R.NPCS[npcSel].nos[k] = { fala: 'Escreva a fala.' }; },
    'resposta-nova': () => { ed.inserir(R, caminho, { t: 'Uma resposta.' }); },
    'missao-nova': () => { if (!ed.novaMissao(R, ed.idLivre(R.MISSOES, novoId('missao')))) toast('Id inválido: letras minúsculas, números e hífen.'); },
    'etapa-nova': () => { ed.inserir(R, caminho, 'O que fazer agora.'); },
    'item-novo': () => { const id = ed.idLivre(R.ITENS, novoId('item')); if (ed.idValido(id)) R.ITENS[id] = { nome: 'Item novo', emoji: '🗝', desc: 'Pra que serve.' }; else toast('Id inválido.'); },
    'dom-novo': () => { const id = ed.idLivre(R.DONS, novoId('dom')); if (ed.idValido(id)) R.DONS[id] = { nome: 'Dom novo', emoji: '✨', desc: 'O que ele faz.' }; else toast('Id inválido.'); },
    'cap-novo': () => { const n = R.CAPITULOS.length + 1; R.CAPITULOS.push({ id: ed.idLivre(R.CAPITULOS, `cap${n}`), n, nome: 'Capítulo novo', regiao: 'Região', rota: Math.min(9, n - 1) }); },
    testar: () => { if (!aplicarRascunho()) return 'feito'; const [x, y] = entradaDoMapa(mapaSel); teste = novoTeste(mapaSel, x, y); },
    simular: () => { if (!aplicarRascunho()) return 'feito'; const onde = Object.entries(R.MAPAS).find(([, x]) => Object.values(x.objs || {}).some(o => ed.variantes(o).some(k => k.npc === npcSel)));
      const idMapa = onde?.[0] || mapaSel; teste = teste || novoTeste(idMapa, ...entradaDoMapa(idMapa)); desenhar(); motorTeste.conversar(npcSel).then(() => teste && desenhar()); return 'feito'; },
    'teste-sair': () => { teste = null; },
    'teste-zerar': () => { const s = teste.S.saga; teste = novoTeste(s.mapa, ...entradaDoMapa(s.mapa)); },
    gerar: () => {
      saida = ed.gerarArquivoSaga(R);
      // `clipboard` não existe em http:// nem em navegador antigo — a caixa de texto é o plano B, e ela já está preenchida
      const copia = globalThis.navigator?.clipboard?.writeText?.(saida), semAcesso = () => toast('Sem acesso à área de transferência: copie da caixa de texto abaixo.');
      if (copia?.then) copia.then(() => toast('Arquivo copiado. Cole em js/dados-saga-mundo.js.'), semAcesso); else semAcesso();
    },
    publicar: () => { publicar('teste').then(() => telaEditorMundo()); return 'feito'; },
    liberar: () => { publicar('estavel').then(() => telaEditorMundo()); return 'feito'; },
    descartar: () => { ed.limparRascunhoSaga(); aplicarSaga(aoVivoAntes); R = sagaAoVivo(); historico.length = 0; objSel = null; toast('Rascunho descartado: de volta ao que estava no ar.'); desenhar(); return 'feito'; }
  }[nome];
  if (!fazer) return console.warn('editor de mundo: ação desconhecida', nome);
  /* Só vira RASCUNHO o que mexeu no mundo. Trocar de aba, de ferramenta ou de zoom não pode criar um: rascunho é
     o que o 📤 Publicar manda, e um "rascunho" igual ao que está no ar ficaria velho calado — e seria ele, e não
     o mundo publicado depois, que uma publicação por outra tela levaria. */
  const antes = JSON.stringify(R);
  if (fazer() === 'feito') return;
  if (JSON.stringify(R) !== antes) guardar();
  desenhar();
}
// Tirar a última regra de uma condição/efeito deixa um {} pendurado: some junto.
function limparVazios(caminho) {
  for (let c = caminho.slice(0, -1); c.length; c = c.slice(0, -1)) {
    const v = ed.ler(R, c);
    if (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length && ['se', 'faz', 'rep'].includes(c.at(-1))) ed.apagar(R, c); else break;
  }
}
/* Um campo mudou. O tipo (`data-tp`) diz como ler o valor; vazio APAGA a chave (campo opcional some, campo
   obrigatório vira erro na aba ⚠ — que é melhor que guardar um texto vazio calado). */
export function mudar(el) {
  const d = el?.dataset || {};
  if (d.emSet) {       // estado da própria tela, não do mundo
    if (d.emSet === 'mapaSel') { mapaSel = el.value; objSel = null; }
    else if (d.emSet === 'npcSel') npcSel = el.value;
    else if (d.emSet === 'tipoTeste') { tipoTeste = el.value; if (teste) teste.S.player.data.types = [tipoTeste]; }
    return desenhar();
  }
  if (d.emAdd) {       // acrescentar uma regra a uma condição ou a um efeito
    const REGRAS = d.regras === 'se' ? REGRAS_SE : REGRAS_FAZ, regra = REGRAS.find(([k]) => k === el.value), caminho = JSON.parse(d.emAdd);
    if (!regra) return;
    if (!ed.ler(R, caminho)) ed.definir(R, caminho, {});
    ed.definir(R, [...caminho, regra[0]], PADRAO[regra[2]]());
    guardar(); return desenhar();
  }
  if (d.emModo) {      // o que acontece depois de uma fala: acaba, continua ou o jogador responde
    const b = JSON.parse(d.emModo), no = ed.ler(R, b), outras = Object.keys(R.NPCS[npcSel].nos).filter(k => k !== b.at(-1));
    delete no.vai; delete no.opcoes;
    if (el.value === 'vai') no.vai = outras[0] || b.at(-1);
    if (el.value === 'opcoes') no.opcoes = [{ t: 'Uma resposta.' }];
    guardar(); return desenhar();
  }
  if (d.emFigura) { R.NPCS[npcSel].sprite = el.value === 'alfa' ? '@alfa' : el.value === 'gente' ? GENTE.nomes[0] : 132; guardar(); return desenhar(); }
  if (!d.ed) return;
  const caminho = JSON.parse(d.ed), cru = el.type === 'checkbox' ? el.checked : String(el.value ?? '');
  const lista = () => cru.split(',').map(s => s.trim()).filter(Boolean);
  const valor = {
    num: () => (cru === '' || !Number.isFinite(Number(cru)) ? undefined : Number(cru)),
    sim: () => (cru ? true : undefined),
    lista: () => { const l = lista(); return !l.length ? undefined : l.length === 1 ? l[0] : l; },
    listaSempre: () => { const l = lista(); return l.length ? l : undefined; },
    json: () => { try { return JSON.parse(cru); } catch { return undefined; } },
    bag: () => { const l = lista().map(s => s.split(':').map(x => x.trim())).map(([k, n]) => [k, Math.max(1, Number(n) || 1)]); return l.length ? l : undefined; }
  }[d.tp]?.() ?? (d.tp && d.tp !== 'texto' && d.tp !== 'longo' ? undefined : cru === '' ? undefined : cru);
  if (caminho[0] === 'MAPAS' && caminho.length <= 4) lembrar();
  ed.definir(R, caminho, valor);
  limparVazios(caminho);
  guardar(); desenhar();
}

/* Abre a tela. Separada da trava de admin porque o teste de fumaça entra por aqui — e porque a trava que
   IMPORTA não é esta: quem não é admin até poderia rabiscar um rascunho no próprio navegador, mas publicar
   passa por `conteudo-nuvem.publicarConteudo` e pela regra da tabela, no servidor. */
export function abrirEditorMundo() {
  limparTopo();
  G.mode = 'editor-mundo';
  aoVivoAntes ||= sagaAoVivo();
  R = ed.rascunhoSaga() || sagaAoVivo();
  teste = null; aba = 'mapas'; objSel = null; ligando = null;
  desenhar();
}
export function telaEditorMundo() {
  if (!ehAdmin()) { toast('O editor de mundo é da conta de manutenção.'); return; }
  abrirEditorMundo();
}
