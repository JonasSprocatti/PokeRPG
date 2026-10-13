/* ============ ⚔ Saga — o CONTEÚDO do mundo está inteiro? (puro, testado) ============
   Um mundo é escrito à mão ou no 🌍 Editor: grade de texto, árvore de diálogo, missão por etapas. Erro ali não
   estoura — estraga: um NPC atrás de uma parede, uma porta pro nada, uma conversa sem botão, uma missão que
   nunca termina. Esta função acha tudo isso ANTES de alguém jogar.

   Tem TRÊS leitores, e é por isso que mora num arquivo só:
     · `tests/saga-mundo.test.js` — o mundo de fábrica (`dados-saga.js`) tem de passar limpo;
     · o 🌍 Editor de mundo — mostra a lista ao vivo, enquanto se edita;
     · `conteudo.validarSaga` — o pacote publicado pela nuvem não passa por teste nenhum: se houver UM erro, é
       recusado inteiro e o jogo fica com o mundo de fábrica.
   Recebe o mundo por parâmetro (nunca lê as tabelas vivas): assim valida um rascunho sem aplicá-lo.

   Devolve [{ nivel: 'erro' | 'aviso', onde, msg }]. Erro = não dá pra jogar/publicar. Aviso = funciona, mas
   provavelmente não era a intenção (porta sem volta, nó que ninguém alcança, item que nunca é dado). */
import { ITEMS } from './dados.js';

export const TIPOS_DE_INIMIGO = ['bando', 'treinador', 'alfa'];
export const TIPOS_DE_OBJETO = ['npc', 'porta', 'placa', 'enfeite', 'bau', 'inimigo', 'gatilho', 'chegada'];
export const LIMITES = { lado: 80, texto: 1400, nome: 80, id: 32, objetosPorMapa: 120 };
// O que um dom pode fazer, e até onde: é o que impede um pacote publicado de dar ×50 de dano a alguém.
export const EFEITOS_DE_DOM = { dano: [1, 1.25], ruina: [1, 1.5], defesa: [0.75, 1], encontro: [0.25, 1.5] };
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/, MARCA = /^[\w:.-]+$/;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const lista = v => [].concat(v ?? []);
export const variantes = o => lista(o);
export const atravessa = o => !!(o.porta || o.gatilho || o.chegada || o.passa);

export function validarMundo(mundo, arte = null) {
  const { TILES = {}, MAPAS = {}, NPCS = {}, MISSOES = {}, ITENS = {}, DONS = {}, FACCOES = {}, CAPITULOS = [], TEMAS = {}, INICIO = {} } = mundo || {};
  const p = [], erro = (onde, msg) => p.push({ nivel: 'erro', onde, msg }), aviso = (onde, msg) => p.push({ nivel: 'aviso', onde, msg });
  const texto = (onde, v, que_ = 'texto', max = LIMITES.texto) => {
    if (typeof v !== 'string' || !v.trim()) erro(onde, `${que_} vazio`);
    else if (v.length > max) erro(onde, `${que_} com ${v.length} letras (o limite é ${max})`);
  };
  const id = (onde, v) => { if (typeof v !== 'string' || !ID.test(v) || v.length > LIMITES.id) erro(onde, `"${String(v).slice(0, 20)}" não serve de identificador (letras, números, - e _)`); };
  const acharChar = (idMapa, ch) => {
    const g = MAPAS[idMapa]?.grade || [];
    for (let y = 0; y < g.length; y++) { const x = g[y].indexOf(ch); if (x >= 0) return [x, y]; }
    return null;
  };
  const etapaOk = m => Array.isArray(m) && MISSOES[m[0]] && (m[1] === 'fim' || m[1] === 'nao' || (Number.isInteger(m[1]) && m[1] >= 0 && m[1] < (MISSOES[m[0]].etapas || []).length));

  /* ---- condição e efeito: só citam o que existe ---- */
  const dados = [];   // todo `faz` do mundo, pra conferir no fim o que nunca é dado
  function condicao(onde, se) {
    if (se == null) return;
    if (typeof se !== 'object' || Array.isArray(se)) return erro(onde, 'condição mal formada');
    for (const f of [...lista(se.flag), ...lista(se.sem)]) if (typeof f !== 'string' || !MARCA.test(f)) erro(onde, `marca "${f}" mal escrita`);
    for (const k of ['item', 'semItem']) if (se[k] !== undefined && !ITENS[se[k]]) erro(onde, `condição cita o item-chave "${se[k]}", que não existe`);
    if (se.missao !== undefined && !etapaOk(se.missao)) erro(onde, `condição cita a missão/etapa ${JSON.stringify(se.missao)}, que não existe`);
    for (const k of ['rep', 'repAbaixo']) if (se[k] !== undefined && (!Array.isArray(se[k]) || !FACCOES[se[k][0]] || !Number.isFinite(se[k][1]))) erro(onde, `condição de reputação mal formada`);
    if (se.falas !== undefined && (!Array.isArray(se.falas) || !NPCS[se.falas[0]] || !Number.isInteger(se.falas[1]))) erro(onde, 'condição "já conversou N vezes" cita um personagem que não existe');
    if (se.dom !== undefined && !DONS[se.dom]) erro(onde, `condição cita o dom "${se.dom}", que não existe`);
    if (se.tipo !== undefined && !lista(se.tipo).every(t => typeof t === 'string')) erro(onde, 'condição de tipo mal formada');
  }
  function efeito(onde, faz) {
    if (faz == null) return;
    if (typeof faz !== 'object' || Array.isArray(faz)) return erro(onde, 'efeito mal formado');
    dados.push(faz);
    for (const f of [...lista(faz.flag), ...lista(faz.tira)]) if (typeof f !== 'string' || !MARCA.test(f)) erro(onde, `marca "${f}" mal escrita`);
    for (const k of ['item', 'perde']) if (faz[k] !== undefined && !ITENS[faz[k]]) erro(onde, `efeito cita o item-chave "${faz[k]}", que não existe`);
    if (faz.missao !== undefined && (!etapaOk(faz.missao) || faz.missao[1] === 'nao')) erro(onde, `efeito cita a missão/etapa ${JSON.stringify(faz.missao)}, que não existe`);
    if (faz.dom !== undefined && !DONS[faz.dom]) erro(onde, `efeito dá o dom "${faz.dom}", que não existe`);
    if (faz.dinheiro !== undefined && (!Number.isInteger(faz.dinheiro) || Math.abs(faz.dinheiro) > 100000)) erro(onde, 'dinheiro fora do razoável (até ₽100.000, número inteiro)');
    for (const [k, n] of Object.entries(faz.rep || {})) if (!FACCOES[k] || !Number.isInteger(n) || Math.abs(n) > 10) erro(onde, `reputação de "${k}" mal formada (inteiro de −10 a 10)`);
    for (const par of lista(faz.bag)) if (!Array.isArray(par) || !ITEMS[par[0]] || !Number.isInteger(par[1]) || par[1] < 1 || par[1] > 99) erro(onde, `item de mochila ${JSON.stringify(par)} não existe ou tem quantidade errada`);
  }

  /* ---- tabelas pequenas ---- */
  for (const [k, f] of Object.entries(FACCOES)) { id(`facção ${k}`, k); texto(`facção ${k}`, f?.nome, 'nome', LIMITES.nome); }
  for (const [k, m] of Object.entries(MISSOES)) {
    id(`missão ${k}`, k); texto(`missão ${k}`, m?.nome, 'nome', LIMITES.nome);
    if (!Array.isArray(m?.etapas) || !m.etapas.length) erro(`missão ${k}`, 'precisa de pelo menos uma etapa');
    else m.etapas.forEach((e, i) => texto(`missão ${k}, etapa ${i + 1}`, e));
  }
  for (const [k, it] of Object.entries(ITENS)) { id(`item ${k}`, k); texto(`item ${k}`, it?.nome, 'nome', LIMITES.nome); texto(`item ${k}`, it?.desc, 'descrição'); }
  for (const [k, d] of Object.entries(DONS)) {
    id(`dom ${k}`, k); texto(`dom ${k}`, d?.nome, 'nome', LIMITES.nome); texto(`dom ${k}`, d?.desc, 'descrição');
    for (const [campo, [min, max]] of Object.entries(EFEITOS_DE_DOM)) if (d?.[campo] !== undefined && !(d[campo] >= min && d[campo] <= max)) erro(`dom ${k}`, `"${campo}" tem de ficar entre ${min} e ${max}`);
  }
  const caps = new Set();
  for (const c of CAPITULOS) {
    id('capítulo', c?.id); texto(`capítulo ${c?.id}`, c?.nome, 'nome', LIMITES.nome);
    if (caps.has(c?.id)) erro(`capítulo ${c?.id}`, 'identificador repetido');
    caps.add(c?.id);
    if (!Number.isInteger(c?.rota) || c.rota < 0 || c.rota > 9) erro(`capítulo ${c?.id}`, 'a rota é um número de 0 a 9 (a 1ª rota da Gen é 0)');
  }

  /* ---- mapas ---- */
  const idsUnicos = { inimigo: new Map(), bau: new Map() }, npcsNoMapa = new Set();
  for (const [idMapa, m] of Object.entries(MAPAS)) {
    const onde = `mapa ${idMapa}`;
    id(onde, idMapa); texto(onde, m?.nome, 'nome', LIMITES.nome);
    if (!TILES[m?.chao] || TILES[m.chao].bloqueia) { erro(onde, 'o chão padrão tem de ser um tile por onde se anda'); continue; }
    if (!Array.isArray(m.grade) || !m.grade.length || typeof m.grade[0] !== 'string' || !m.grade[0].length) { erro(onde, 'o mapa não tem casas'); continue; }
    const W = m.grade[0].length, H = m.grade.length;
    if (W > LIMITES.lado || H > LIMITES.lado) erro(onde, `mapa de ${W}×${H} casas (o limite é ${LIMITES.lado}×${LIMITES.lado})`);
    if (!Number.isInteger(m.rota) || m.rota < 0 || m.rota > 9) erro(onde, 'a rota é um número de 0 a 9');
    if (m.cap !== undefined && !caps.has(m.cap)) erro(onde, `aponta pro capítulo "${m.cap}", que não existe`);
    if (m.cap === undefined) aviso(onde, 'não está em nenhum capítulo');
    if (m.tema !== undefined && !TEMAS[m.tema]) erro(onde, `usa o tema "${m.tema}", que não existe`);
    const objs = m.objs || {}, vezes = {};
    if (Object.keys(objs).length > LIMITES.objetosPorMapa) erro(onde, `objetos demais (o limite é ${LIMITES.objetosPorMapa})`);
    m.grade.forEach((l, y) => {
      if (typeof l !== 'string' || l.length !== W) return erro(onde, `a linha ${y + 1} tem tamanho diferente das outras`);
      for (const ch of l) { if (objs[ch]) vezes[ch] = (vezes[ch] || 0) + 1; else if (!TILES[ch]) erro(onde, `caractere "${ch}" na linha ${y + 1} não é tile nem objeto`); }
    });
    for (const [ch, o] of Object.entries(objs)) {
      const aqui = `${onde}, objeto "${ch}"`;
      if ([...ch].length !== 1) erro(aqui, 'a chave de um objeto é um caractere só');
      if (TILES[ch]) erro(aqui, 'este caractere já é um tile');
      if (!vezes[ch]) erro(aqui, 'não está em nenhuma casa do mapa');
      if (vezes[ch] > 1) erro(aqui, 'está em mais de uma casa (cada objeto fica numa só)');
      for (const v of variantes(o)) {
        if (!v || typeof v !== 'object') { erro(aqui, 'objeto mal formado'); continue; }
        const tipos = TIPOS_DE_OBJETO.filter(t => v[t] !== undefined && v[t] !== false);
        if (tipos.length !== 1) erro(aqui, tipos.length ? `é duas coisas ao mesmo tempo (${tipos.join(' e ')})` : 'não diz o que é (personagem, porta, baú…)');
        condicao(aqui, v.se); efeito(aqui, v.faz);
        if (v.como !== undefined && !TILES[v.como]) erro(aqui, `imita o tile "${v.como}", que não existe`);
        if (arte) {
          if (v.arte !== undefined && arte.ARTE[v.arte] === undefined) erro(aqui, `figura "${v.arte}" não existe no atlas`);
          if (v.prop !== undefined && !arte.PROPS[v.prop]) erro(aqui, `enfeite "${v.prop}" não existe no atlas`);
        }
        if (v.npc !== undefined) { if (!NPCS[v.npc]) erro(aqui, `personagem "${v.npc}" não existe`); npcsNoMapa.add(v.npc); }
        if (v.porta !== undefined) {
          const [para, chave] = lista(v.porta);
          if (!MAPAS[para] || !acharChar(para, chave)) erro(aqui, `a porta leva pra "${para}" / "${chave}", que não existe`);
          else if (!variantes(MAPAS[para].objs?.[chave]).some(x => x?.porta?.[0] === idMapa)) aviso(aqui, `porta sem volta: do outro lado ("${para}") não há porta de volta pra cá`);
        }
        if (v.placa !== undefined) texto(aqui, v.placa);
        if (v.texto !== undefined) texto(aqui, v.texto);
        if (v.inimigo !== undefined) {
          if (!TIPOS_DE_INIMIGO.includes(v.inimigo?.tipo)) erro(aqui, 'inimigo sem tipo (bando, treinador ou alfa)');
          id(aqui, v.inimigo?.id);
          if (v.inimigo?.fala !== undefined) texto(aqui, v.inimigo.fala);
          if (arte && v.inimigo?.sprite !== undefined && !arte.GENTE.nomes.includes(v.inimigo.sprite)) erro(aqui, `figura de gente "${v.inimigo.sprite}" não existe`);
        }
        for (const k of ['inimigo', 'bau']) {
          const quem = k === 'inimigo' ? v.inimigo?.id : v.bau;
          if (quem === undefined) continue;
          if (k === 'bau') id(aqui, quem);
          const antes = idsUnicos[k].get(quem);
          if (antes && antes !== `${idMapa}:${ch}`) erro(aqui, `o id "${quem}" já é usado em ${antes} (a marca de vencido/aberto é pelo id)`);
          idsUnicos[k].set(quem, `${idMapa}:${ch}`);
        }
        if (v.gatilho !== undefined) id(aqui, v.gatilho);
      }
    }
  }

  /* ---- personagens e diálogos ---- */
  for (const [idNpc, n] of Object.entries(NPCS)) {
    const onde = `personagem ${idNpc}`;
    id(onde, idNpc); texto(onde, n?.nome, 'nome', LIMITES.nome);
    const s = n?.sprite;
    if (!(Number.isInteger(s) && s > 0 && s < 20000) && s !== '@alfa' && !(typeof s === 'string' && (!arte || arte.GENTE.nomes.includes(s)))) erro(onde, 'figura inválida (número da espécie, um humano do atlas ou "@alfa")');
    if (!Array.isArray(n?.falas) || !n.falas.length) { erro(onde, 'não tem por onde a conversa começar'); continue; }
    const nos = n.nos || {};
    if (n.falas.at(-1).se !== undefined) erro(onde, 'o último começo de conversa precisa valer sempre (sem condição)');
    const alcancados = new Set();
    for (const f of n.falas) { condicao(onde, f?.se); if (!nos[f?.no]) erro(onde, `começa em "${f?.no}", que não existe`); else alcancados.add(f.no); }
    for (const [k, no] of Object.entries(nos)) {
      const aqui = `${onde}, fala "${k}"`;
      texto(aqui, no?.fala, 'fala'); efeito(aqui, no?.faz);
      if (no?.vai !== undefined) { if (!nos[no.vai]) erro(aqui, `segue pra "${no.vai}", que não existe`); else alcancados.add(no.vai); }
      if (no?.opcoes !== undefined) {
        if (!Array.isArray(no.opcoes) || !no.opcoes.length) { erro(aqui, 'lista de respostas vazia'); continue; }
        if (no.vai !== undefined) erro(aqui, 'tem respostas E "continuar": escolha um dos dois');
        if (!no.opcoes.some(o => !o?.se)) erro(aqui, 'nenhuma resposta vale sempre: se as condições falharem, a caixa fica sem botão');
        for (const o of no.opcoes) {
          texto(aqui, o?.t, 'resposta', 160); condicao(aqui, o?.se); efeito(aqui, o?.faz);
          if (o?.vai !== undefined) { if (!nos[o.vai]) erro(aqui, `uma resposta leva pra "${o.vai}", que não existe`); else alcancados.add(o.vai); }
        }
      }
    }
    for (const k of Object.keys(nos)) if (!alcancados.has(k)) aviso(onde, `a fala "${k}" não é alcançada por conversa nenhuma`);
    if (!npcsNoMapa.has(idNpc)) aviso(onde, 'não está em mapa nenhum');
  }

  /* ---- geografia: a pé, do começo, atravessando portas ----
     Quem bloqueia POR CONDIÇÃO (o guarda do portão, um inimigo de pé) conta como passagem: o teste é de mapa,
     não de história. */
  const comeco = MAPAS[INICIO.mapa] && acharChar(INICIO.mapa, INICIO.em);
  if (!comeco) erro('começo do jogo', `o ponto de partida ("${INICIO.mapa}" / "${INICIO.em}") não existe`);
  else if (!p.some(x => x.nivel === 'erro' && x.onde.startsWith('mapa '))) {
    const vistos = new Set(), tocados = new Set(), fila = [[INICIO.mapa, ...comeco]], chave = (m, x, y) => `${m}:${x},${y}`;
    vistos.add(chave(...fila[0]));
    while (fila.length) {
      const [idMapa, x, y] = fila.shift(), m = MAPAS[idMapa];
      for (const [dx, dy] of DIRS) {
        let nm = idMapa, nx = x + dx, ny = y + dy;
        const ch = m.grade[ny]?.[nx];
        if (ch === undefined) continue;
        const objs = m.objs?.[ch] && variantes(m.objs[ch]);
        if (objs) tocados.add(`${idMapa}:${ch}`);
        if (!objs && TILES[ch].bloqueia) continue;
        if (objs && !objs.some(o => atravessa(o) || o.se || o.inimigo)) continue;   // bloqueia sempre: toca, não passa
        const porta = objs?.find(o => o.porta);
        if (porta) { nm = porta.porta[0]; [nx, ny] = acharChar(nm, porta.porta[1]); tocados.add(`${nm}:${porta.porta[1]}`); }
        if (!vistos.has(chave(nm, nx, ny))) { vistos.add(chave(nm, nx, ny)); fila.push([nm, nx, ny]); }
      }
    }
    for (const [idMapa, m] of Object.entries(MAPAS)) for (const [ch, o] of Object.entries(m.objs || {})) {
      if (idMapa === INICIO.mapa && ch === INICIO.em) continue;
      if (!tocados.has(`${idMapa}:${ch}`)) erro(`mapa ${idMapa}, objeto "${ch}"`, 'está fora de alcance: não há caminho a pé até aqui saindo do começo');
      // ninguém chega por uma porta e fica encurralado
      if (variantes(o).some(v => v.porta)) {
        const [x, y] = acharChar(idMapa, ch);
        const livre = DIRS.some(([dx, dy]) => {
          const v = m.grade[y + dy]?.[x + dx], os = v !== undefined && m.objs?.[v] && variantes(m.objs[v]);
          return v !== undefined && (os ? os.some(k => atravessa(k) && !k.porta || k.se) : !TILES[v].bloqueia);
        });
        if (!livre) erro(`mapa ${idMapa}, objeto "${ch}"`, 'quem chega por esta porta não tem pra onde andar');
      }
    }
  }

  /* ---- conteúdo morto ---- */
  for (const k of Object.keys(MISSOES)) if (!dados.some(f => f.missao?.[0] === k && f.missao[1] === 'fim')) aviso(`missão ${k}`, 'nenhuma conversa a conclui');
  for (const k of Object.keys(ITENS)) if (!dados.some(f => f.item === k)) aviso(`item ${k}`, 'nunca é dado a ninguém');
  for (const k of Object.keys(DONS)) if (!dados.some(f => f.dom === k)) aviso(`dom ${k}`, 'nunca é ensinado');
  return p;
}
export const errosDoMundo = (mundo, arte) => validarMundo(mundo, arte).filter(x => x.nivel === 'erro');
