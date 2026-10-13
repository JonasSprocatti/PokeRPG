/* 💥 O 🌍 EDITOR DE MUNDO RODANDO DE VERDADE, no Node, sem dependência — o terceiro detector de explosão
   (os outros: `turno-smoke` e `saga-smoke`). Abre a tela, passa por todas as abas, edita campo, acrescenta e
   tira regra, cria mapa e personagem, entra no ▶ Testar, simula uma conversa e gera o arquivo. As OPERAÇÕES têm
   teste próprio (`editor-saga.test.js`); aqui o alvo é a TELA: função que não existe, variável não declarada,
   campo lido de `undefined` — o tipo de erro que só apareceria pra quem abre o editor.

   DOM de mentira com duas diferenças do `saga-smoke`: o `localStorage` GUARDA (o rascunho mora lá) e só o que é
   CRIADO (`createElement`, a caixa `ui.ask`) clica sozinho — o que é procurado na página não, senão a própria
   raiz do editor receberia cliques fantasmas. */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

const htmls = [], guardado = {};
function ligarDomFalso() {
  const el = clica => new Proxy({}, {
    get: (t, k) => k === 'innerHTML' || k === 'value' || k === 'textContent' || k === 'id' ? ''
      : k === 'classList' ? { add() {}, remove() {}, toggle() {}, contains: () => false }
      : k === 'dataset' ? {} : k === 'style' ? {} : k === 'children' ? [] : k === 'parentNode' ? null
      : k === 'addEventListener' ? (tipo, fn) => { if (clica && tipo === 'click') setTimeout(() => fn({ target: { closest: () => ({ dataset: { i: '0' } }) } })); }
      : typeof k === 'symbol' ? undefined : (() => el(false)),
    set: (t, k, v) => { if (k === 'innerHTML') htmls.push(String(v)); return true; }
  });
  globalThis.matchMedia = () => ({ matches: true, addEventListener() {}, addListener() {} });
  globalThis.document = { querySelector: s => s === '.modal' ? null : el(false), querySelectorAll: () => [], createElement: () => el(true), getElementById: () => el(false), body: el(false), documentElement: el(false), addEventListener() {} };
  globalThis.window = globalThis;
  globalThis.requestAnimationFrame = f => f();
  globalThis.localStorage = { getItem: k => guardado[k] ?? null, setItem: (k, v) => { guardado[k] = String(v); }, removeItem: k => { delete guardado[k]; }, key: () => null, length: 0 };
}

let tela, ed, conteudo;
before(async () => {
  ligarDomFalso();
  tela = await import('../js/tela-editor-saga.js');
  ed = await import('../js/editor-saga.js');
  conteudo = await import('../js/conteudo.js');
});
// cada caso começa do zero: sem rascunho guardado e com o mundo de fábrica no ar
const abrir = () => { for (const k of Object.keys(guardado)) delete guardado[k]; conteudo.aplicarSaga(null); tela.abrirEditorMundo(); };
const campo = (caminho, valor, tp = 'texto') => tela.mudar({ dataset: { ed: JSON.stringify(caminho), tp }, value: valor, type: 'text' });
const ultima = () => htmls.at(-1) || '';
const esperar = () => new Promise(r => setTimeout(r, 30));

test('abre, e todas as abas desenham sem estourar', () => {
  abrir();
  assert.ok(ultima().includes('id="em-canvas"') && ultima().includes('data-em="testar"'), 'a aba de mapas não desenhou');
  assert.ok(ultima().includes('data-act="editor-conteudo"') || ultima().includes('nav-telas'), 'falta a barra de navegação');
  const esperado = { gente: 'Por onde a conversa começa', missoes: 'A Fonte Calada', coisas: 'Dons', problemas: 'Nenhum problema', publicar: 'Publicar no teste' };
  for (const [aba, texto] of Object.entries(esperado)) { tela.acao('aba', aba); assert.ok(ultima().includes(texto), `aba ${aba}: faltou "${texto}"`); }
  tela.acao('aba', 'mapas');
  for (const f of ['pincel', 'ret', 'balde', 'obj', 'casa', 'mover']) tela.acao('ferramenta', f);
  assert.equal(ed.rascunhoSaga(), null, 'passear pelas abas e ferramentas não cria rascunho');
  tela.acao('acao-que-nao-existe');   // botão desconhecido avisa no console, não derruba a tela
});

test('editar um campo guarda o rascunho neste navegador; vazio apaga a chave', () => {
  abrir();
  assert.equal(ed.rascunhoSaga(), null, 'abrir não cria rascunho sozinho');
  campo(['NPCS', 'pichu', 'nome'], 'Pichu <b>editado</b>');
  assert.equal(ed.rascunhoSaga().NPCS.pichu.nome, 'Pichu <b>editado</b>');
  tela.acao('aba', 'gente'); tela.mudar({ dataset: { emSet: 'npcSel' }, value: 'pichu' });
  assert.ok(ultima().includes('Pichu &lt;b&gt;editado&lt;/b&gt;'), 'o texto digitado volta pra tela ESCAPADO');
  campo(['MAPAS', 'pedralume', 'rota'], '4', 'num'); assert.equal(ed.rascunhoSaga().MAPAS.pedralume.rota, 4);
  campo(['MAPAS', 'pedralume', 'desc'], ''); assert.equal('desc' in ed.rascunhoSaga().MAPAS.pedralume, false);
  campo(['MISSOES', 'sino', 'secreta'], false, 'sim');
  tela.mudar({ dataset: { ed: JSON.stringify(['MISSOES', 'fonte', 'secreta']), tp: 'sim' }, type: 'checkbox', checked: true });
  assert.equal(ed.rascunhoSaga().MISSOES.fonte.secreta, true);
});

test('condição e efeito: acrescentar regra, mexer nela e tirar (o {} vazio some junto)', () => {
  abrir();
  const faz = ['NPCS', 'pichu', 'nos', 'oi', 'faz'], no = () => ed.rascunhoSaga().NPCS.pichu.nos.oi;
  tela.mudar({ dataset: { emAdd: JSON.stringify(faz), regras: 'faz' }, value: 'dinheiro' });
  assert.equal(no().faz.dinheiro, 100);
  for (const r of ['flag', 'item', 'bag', 'rep', 'missao', 'dom', 'cura']) tela.mudar({ dataset: { emAdd: JSON.stringify(faz), regras: 'faz' }, value: r });
  campo([...faz, 'bag'], 'potion:3, revive', 'bag'); assert.deepEqual(no().faz.bag, [['potion', 3], ['revive', 1]]);
  campo([...faz, 'flag'], 'a, b', 'lista'); assert.deepEqual(no().faz.flag, ['a', 'b']);
  campo([...faz, 'flag'], 'so-uma', 'lista'); assert.equal(no().faz.flag, 'so-uma');
  campo([...faz, 'missao'], JSON.stringify(['sino', 'fim']), 'json'); assert.deepEqual(no().faz.missao, ['sino', 'fim']);
  const se = ['NPCS', 'pichu', 'nos', 'oi', 'se'];
  for (const r of ['flag', 'sem', 'item', 'semItem', 'missao', 'rep', 'repAbaixo', 'tipo', 'falas', 'dom']) tela.mudar({ dataset: { emAdd: JSON.stringify(se), regras: 'se' }, value: r });
  tela.acao('aba', 'gente');   // desenha todas as regras de uma vez: é aqui que um controle mal escrito estouraria
  for (const k of Object.keys(no().faz)) tela.acao('apagar', undefined, { c: JSON.stringify([...faz, k]) });
  assert.equal('faz' in no(), false, 'sem regra nenhuma, o `faz` some');
  tela.mudar({ dataset: { emAdd: JSON.stringify(faz), regras: 'faz' }, value: '' });   // "+ acrescentar…" sem escolher nada
});

test('fala: trocar o que vem depois, criar resposta, começo e fala novos', () => {
  abrir();
  tela.acao('aba', 'gente'); tela.mudar({ dataset: { emSet: 'npcSel' }, value: 'pichu' });
  const b = ['NPCS', 'pichu', 'nos', 'oi'], npc = () => ed.rascunhoSaga().NPCS.pichu;
  tela.mudar({ dataset: { emModo: JSON.stringify(b) }, value: 'opcoes' }); assert.equal(npc().nos.oi.opcoes.length, 1);
  tela.acao('resposta-nova', undefined, { c: JSON.stringify([...b, 'opcoes']) }); assert.equal(npc().nos.oi.opcoes.length, 2);
  tela.mudar({ dataset: { emModo: JSON.stringify(b) }, value: 'vai' }); assert.ok(npc().nos.oi.vai && !npc().nos.oi.opcoes);
  tela.mudar({ dataset: { emModo: JSON.stringify(b) }, value: 'fim' }); assert.ok(!npc().nos.oi.vai);
  tela.acao('entrada-nova'); assert.equal(npc().falas[0].se.flag, 'marca-nova');
  tela.acao('lista-subir', '1', { c: JSON.stringify(['NPCS', 'pichu', 'falas']) });
  tela.acao('no-novo'); assert.ok(npc().nos.fala);
  tela.mudar({ dataset: { emFigura: '1' }, value: 'gente' }); assert.equal(typeof npc().sprite, 'string');
  tela.mudar({ dataset: { emFigura: '1' }, value: 'alfa' }); assert.equal(npc().sprite, '@alfa');
  tela.mudar({ dataset: { emFigura: '1' }, value: 'pokemon' }); assert.equal(npc().sprite, 132);
  tela.acao('npc-novo'); assert.ok(ed.rascunhoSaga().NPCS.personagem);
  tela.acao('npc-excluir'); assert.equal(ed.rascunhoSaga().NPCS.personagem, undefined);
});

test('mapa: criar, redimensionar, desfazer, objeto com variantes, e as outras tabelas', () => {
  abrir();
  tela.acao('mapa-novo'); const R = () => ed.rascunhoSaga();
  assert.ok(R().MAPAS['mapa-novo']);
  const antes = R().MAPAS['mapa-novo'].grade.length;
  tela.acao('tam', 'baixo:1'); assert.equal(R().MAPAS['mapa-novo'].grade.length, antes + 1);
  tela.acao('desfazer'); assert.equal(R().MAPAS['mapa-novo'].grade.length, antes);
  tela.acao('zoom', '1'); tela.acao('zoom', '-1');
  tela.acao('mapa-excluir'); assert.equal(R().MAPAS['mapa-novo'], undefined);
  // um objeto de Pedralume: selecionar, ganhar variante, voltar a ser um só
  tela.acao('ir-mapa', 'pedralume', { o: 'W' });
  assert.ok(ultima().includes('Variantes'), 'o inspetor do objeto não abriu');
  tela.acao('variante-nova'); assert.equal(R().MAPAS.pedralume.objs.W.length, 2);
  tela.acao('variante-subir'); tela.acao('variante', '1'); tela.acao('variante-excluir');
  assert.ok(!Array.isArray(R().MAPAS.pedralume.objs.W));
  tela.acao('ligar'); tela.acao('ligar-cancelar'); tela.acao('obj-soltar');
  for (const a of ['missao-nova', 'item-novo', 'dom-novo', 'cap-novo']) tela.acao(a);
  assert.ok(R().MISSOES.missao && R().ITENS.item && R().DONS.dom && R().CAPITULOS.length === 4);
  tela.acao('etapa-nova', undefined, { c: JSON.stringify(['MISSOES', 'missao', 'etapas']) });
  tela.acao('aba', 'coisas'); tela.acao('aba', 'missoes');
});

test('▶ Testar: com erro não entra (e manda pra aba de problemas); inteiro, entra e simula conversa', async () => {
  abrir();
  campo(['NPCS', 'anciao', 'nos', 'inicio', 'vai'], 'fala-que-nao-existe');
  tela.acao('testar');
  assert.ok(ultima().includes('em-problemas') && !ultima().includes('id="em-teste"'), 'mundo com erro não pode ser testado');
  campo(['NPCS', 'anciao', 'nos', 'inicio', 'vai'], 'inicio2');
  tela.acao('aba', 'mapas'); tela.acao('testar');
  assert.ok(ultima().includes('id="em-teste"') && ultima().includes('id="saga-tela"'), 'o teste não abriu o mundo');
  tela.mudar({ dataset: { emSet: 'tipoTeste' }, value: 'ghost' });
  tela.acao('teste-zerar'); tela.acao('teste-sair');
  tela.acao('aba', 'gente'); tela.mudar({ dataset: { emSet: 'npcSel' }, value: 'anciao' });
  tela.acao('simular');
  for (let i = 0; i < 12; i++) await esperar();     // a caixa "clica" sozinha na 1ª resposta até a conversa acabar
  assert.ok(ultima().includes('A Fonte Calada'), 'a conversa simulada aceita a missão, e ela aparece no estado do teste');
  tela.acao('teste-sair');
});

test('🧪 testadores: a seção aparece em Publicar, e sem nuvem o erro vira texto na tela (não explosão)', async () => {
  abrir();
  tela.acao('aba', 'publicar');
  assert.ok(ultima().includes('Testadores da Saga') && ultima().includes('data-em="beta-liberar"'));
  for (let i = 0; i < 4; i++) await esperar();          // a lista é buscada depois: aqui não há nuvem, então chega um erro
  assert.ok(ultima().includes('Não deu pra ler a lista') || ultima().includes('Ninguém ainda'), 'a busca da lista tem de terminar em texto');
  tela.acao('beta-liberar');                            // sem código digitado: só avisa
  tela.acao('beta-tirar', 'ABC123');                    // sem nuvem: avisa o motivo
  await esperar();
  assert.equal(ed.rascunhoSaga(), null, 'mexer em testador não cria rascunho do mundo');
});

test('gerar o arquivo e descartar o rascunho', () => {
  abrir();
  campo(['NPCS', 'pichu', 'nome'], 'Só no rascunho');
  tela.acao('aba', 'publicar'); tela.acao('gerar');
  assert.ok(ultima().includes('export const MAPAS_SAGA'), 'o arquivo gerado não apareceu na caixa');
  tela.acao('descartar');
  assert.equal(ed.rascunhoSaga(), null);
  assert.deepEqual(conteudo.sagaAoVivo(), conteudo.SAGA_DE_FABRICA, 'descartar devolve o que estava no ar');
});
