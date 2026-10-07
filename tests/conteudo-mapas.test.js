/* 📦 Fases 2 e 3 da atualização de conteúdo pela nuvem: ROTAS (pool, níveis, criar e excluir), MISSÕES DE CONTA,
   PREÇO DE ITEM e TEXTO/PRÊMIO DE BADGE.
   Este é o teste que mais importa das duas fases, pelo mesmo motivo do `tests/conteudo.test.js`: aqui um pacote
   ruim não deixa o jogo feio, deixa a jornada IMPOSSÍVEL — Gen sem rota final não fecha nunca, Santuário fora
   quebra a promessa de Pokédex completa, e missão de conta com `libera` pendurado em missão que não existe fica
   escondida pra sempre, sem erro nenhum. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pacoteDeFabrica, validarPacote, validarMapas, validarItens, validarBadges, aplicarConteudo, podeAplicarAgora,
  CAMPOS_DA_ROTA, CAMPOS_DO_POOL
} from '../js/conteudo.js';
import { GENS, MISSOES, MISSOES_GLOBAIS, ITEMS } from '../js/dados.js';
import { BADGES } from '../js/badges.js';
import { criarRota, excluirRota, idDeRotaNova, gerarArquivo, gerarPacote } from '../js/editor-rotas.js';
import {
  missoesGlobaisEditadas, excluirMissaoGlobal, idDeMissaoNova, extrasDoConteudo, gerarBlocoConteudo
} from '../js/editor-conteudo.js';

const restaurar = () => aplicarConteudo(pacoteDeFabrica());
const clonar = v => JSON.parse(JSON.stringify(v));
const genUm = () => clonar(GENS[0].rotas);
const comMapa = lista => ({ ...pacoteDeFabrica(), mapas: { 1: lista } });
const rotaComum = () => genUm().find(z => !z.posVitoria && !z.final);

/* ---- a lista de campos (a guarda que avisa quando o mapa ganhar um campo novo) ---- */
/* `sanearRota` copia só os campos conhecidos. Se `ferramentas/gerar-mapas.ps1` passar a gerar um campo novo
   (clima da rota, por exemplo), ele seria descartado em silêncio ao aplicar um pacote — a rota publicada sairia
   diferente da de fábrica sem ninguém mexer nela. Este teste é o que cobra a linha nova em CAMPOS_DA_ROTA. */
test('todo campo que existe nas 99 rotas de fábrica está na lista de campos conhecidos', () => {
  const daRota = new Set(), doPool = new Set();
  for (const g of GENS) for (const z of g.rotas) {
    Object.keys(z).forEach(k => daRota.add(k));
    for (const p of z.pool) Object.keys(p).forEach(k => doPool.add(k));
  }
  for (const k of daRota) assert.ok(CAMPOS_DA_ROTA.includes(k), `campo "${k}" da rota ficou fora de CAMPOS_DA_ROTA`);
  for (const k of doPool) assert.ok(CAMPOS_DO_POOL.includes(k), `campo "${k}" do pool ficou fora de CAMPOS_DO_POOL`);
});

/* ---- validação dos mapas ---- */
test('o mapa de fábrica, devolvido como pacote, continua válido', () => {
  assert.equal(validarMapas({ 1: genUm() }).ok, true);
  assert.equal(validarMapas(null).ok, true);
  assert.equal(validarMapas([]).ok, false, 'lista não é tabela de mapas');
  assert.equal(validarMapas({ 99: genUm() }).ok, false, 'Gen que não existe');
  assert.equal(validarMapas({ 1: [] }).ok, false, 'Gen sem rota nenhuma');
});

test('o pacote não pode tirar o Santuário nem a rota final', () => {
  const semSantuario = genUm().filter(z => !z.posVitoria);
  assert.equal(validarMapas({ 1: semSantuario }).ok, false);
  assert.ok(/Santuário/.test(validarMapas({ 1: semSantuario }).porque));
  const semFinal = genUm().filter(z => !z.final);
  assert.ok(/final/.test(validarMapas({ 1: semFinal }).porque));
  // duas finais também não: `rotaFinalDaGen` pega a primeira e a outra nunca fecharia a Gen
  const duasFinais = genUm().map(z => (z.posVitoria ? z : { ...z, final: true, lendarios: [{ id: 150, nome: 'Mewtwo', nivel: 70 }] }));
  assert.equal(validarMapas({ 1: duasFinais }).ok, false);
  // e a Gen não pode ficar só com o Santuário
  assert.equal(validarMapas({ 1: genUm().filter(z => z.posVitoria) }).ok, false);
});

test('rota: id, níveis, pool e Alfa', () => {
  const trocar = f => validarMapas({ 1: genUm().map(z => (z.id === rotaComum().id ? f(clonar(z)) : z)) });
  assert.equal(trocar(z => z).ok, true, 'o de fábrica passa');
  assert.equal(trocar(z => ({ ...z, id: 'MAIÚSCULO' })).ok, false);
  assert.equal(trocar(z => ({ ...z, name: '' })).ok, false, 'sem nome');
  assert.equal(trocar(z => ({ ...z, min: 50, max: 10 })).ok, false, 'mínimo acima do máximo');
  assert.equal(trocar(z => ({ ...z, libera: 0 })).ok, false);
  assert.equal(trocar(z => ({ ...z, pool: [] })).ok, false, 'pool vazio');
  assert.equal(trocar(z => ({ ...z, chefe: undefined })).ok, false, 'rota comum sem Alfa');
  assert.equal(trocar(z => ({ ...z, segredo: true })).ok, false, 'campo desconhecido');
  assert.equal(trocar(z => ({ ...z, pool: [{ id: 19, n: 'rattata', p: 0 }] })).ok, false, 'peso 0 nunca aparece');
  assert.equal(trocar(z => ({ ...z, pool: [{ id: 19, n: 'rattata', p: 0.07 }] })).ok, true, 'peso fracionário é como mítico aparece');
  assert.equal(trocar(z => ({ ...z, pool: [{ id: '19', n: 'rattata', p: 5 }] })).ok, false, 'id de espécie como texto');
  assert.equal(trocar(z => ({ ...z, pool: [{ id: 19, n: 'rattata', p: 5 }, { id: 19, n: 'rattata', p: 2 }] })).ok, false, 'espécie repetida');
  // id de rota é GLOBAL: `S.zona` guarda só o id
  const daGen2 = GENS[1].rotas[0].id;
  assert.equal(trocar(z => ({ ...z, id: daGen2 })).ok, false, 'id que já existe em outra Gen');
  // quem é chefe de raide na forma normal só aparece no Santuário (dados.SO_NO_SANTUARIO)
  assert.equal(trocar(z => ({ ...z, pool: [...z.pool, { id: 493, n: 'arceus', p: 1 }] })).ok, false);
});

test('aplicar troca a lista de rotas no lugar, e um pacote sem a Gen a devolve ao de fábrica', t => {
  t.after(restaurar);
  const antes = clonar(GENS[0].rotas);
  const alvo = rotaComum();
  const lista = genUm().map(z => (z.id === alvo.id ? { ...z, min: 42, max: 44, pool: [{ id: 19, n: 'rattata', p: 7 }] } : z));
  const r = aplicarConteudo(comMapa(lista));
  assert.equal(r.rotasTrocadas, lista.length);
  const depois = GENS[0].rotas.find(z => z.id === alvo.id);
  assert.equal(depois.min, 42);
  assert.equal(depois.pool.length, 1);
  assert.equal(GENS[0].rotas.length, antes.length, 'a mesma referência de array, com o conteúdo trocado');

  // pacote seguinte sem a Gen 1: volta pro de fábrica (senão a edição do pacote velho fica no ar pra sempre)
  aplicarConteudo({ ...pacoteDeFabrica(), mapas: {} });
  assert.deepEqual(GENS[0].rotas.find(z => z.id === alvo.id).pool, antes.find(z => z.id === alvo.id).pool);
});

test('rota CRIADA pelo pacote entra no jogo e aceita missão apontando pra ela', t => {
  t.after(restaurar);
  const base = rotaComum();
  const nova = { ...clonar(base), id: 'rota-inventada', name: 'Rota Inventada' };
  const lista = [...genUm(), nova].sort((a, b) => (a.posVitoria ? 1 : 0) - (b.posVitoria ? 1 : 0));
  const p = {
    ...comMapa(lista),
    missoesRota: [...pacoteDeFabrica().missoesRota, {
      id: 'rota-inventada-esp', gen: 1, rota: 'rota-inventada', nome: 'Teste', desc: 'Derrote coisas.',
      objetivo: { alvos: [['rattata', 3]] }, premio: { dinheiro: 100 }
    }]
  };
  // a missão aponta pra uma rota que SÓ EXISTE no pacote: validar contra as rotas de fábrica recusaria o pacote coerente
  assert.equal(validarPacote(p).ok, true, validarPacote(p).porque);
  aplicarConteudo(p);
  assert.ok(GENS[0].rotas.some(z => z.id === 'rota-inventada'));
  assert.ok(MISSOES.some(m => m.id === 'rota-inventada-esp'));
});

/* ---- criar e excluir, no editor (puro) ---- */
test('criarRota clona a rota aberta e entra logo depois dela', () => {
  const lista = genUm();
  const base = rotaComum();
  const nova = criarRota(lista, base.id, new Set(lista.map(z => z.id)));
  assert.equal(nova.length, lista.length + 1);
  const i = nova.findIndex(z => z.id === base.id);
  const criada = nova[i + 1];
  assert.deepEqual(criada.pool, base.pool, 'nasce com o pool da clonada: pool vazio seria recusado');
  assert.notEqual(criada.id, base.id);
  assert.equal(criada.final, undefined, 'a rota final é única por Gen');
  assert.equal(criada.posVitoria, undefined);
  // e o mapa com ela continua válido
  assert.equal(validarMapas({ 1: nova }).ok, true, validarMapas({ 1: nova }).porque);
});

test('idDeRotaNova não repete e aceita só o formato dos ids que já existem', () => {
  const tem = new Set(['rota1', 'rota1-2']);
  assert.equal(idDeRotaNova('rota1', tem), 'rota1-3');
  assert.match(idDeRotaNova('Rota Maluca!', new Set()), /^[a-z0-9-]{2,40}$/);
});

test('excluirRota recusa o Santuário, a rota final e a última rota comum', () => {
  const lista = genUm();
  assert.equal(excluirRota(lista, lista.find(z => z.posVitoria).id).ok, false);
  assert.equal(excluirRota(lista, lista.find(z => z.final).id).ok, false);
  assert.equal(excluirRota(lista, 'nao-existe').ok, false);
  const fora = excluirRota(lista, rotaComum().id);
  assert.equal(fora.ok, true);
  assert.equal(fora.lista.length, lista.length - 1);
  assert.equal(validarMapas({ 1: fora.lista }).ok, true);
  // uma Gen com só a final e o Santuário: a final não sai e sobra o mínimo
  const mínima = lista.filter(z => z.final || z.posVitoria);
  assert.equal(excluirRota(mínima, mínima.find(z => z.final).id).ok, false);
});

test('o arquivo gerado leva os MAPAS editados, e só as Gens editadas', () => {
  const txt = gerarArquivo([], { 1: genUm() }, '2026-10-07');
  assert.match(txt, /export const MAPAS = \{\n {2}1: \[/);
  assert.match(txt, /"rota1"/);
  assert.equal(/export const MAPAS = \{\};/.test(gerarArquivo([], {}, '2026-10-07')), true, 'sem edição, a tabela sai vazia');
});

/* O caminho inteiro do editor, que é onde o 📤 Publicar quebraria: criar uma rota, montar o pacote com as missões
   dela e validar. `gerarPacote` EXIGE missão em toda rota — rota criada e nunca preenchida tem de dar um erro com
   o id dentro, não um pacote pela metade. */
test('criar rota → montar o pacote → validar: o caminho do 📤 Publicar', () => {
  const lista = criarRota(genUm(), rotaComum().id, new Set(genUm().map(z => z.id)));
  // as rotas no formato que a tela monta (`rotasComMissao`), com missão e Alfa em cada uma
  const comuns = lista.filter(z => !z.posVitoria);
  const rotas = comuns.map((z, i) => ({
    gen: 1, rota: z.id, rotulo: z.name, antes: i > 0 ? comuns[i - 1].id : null, lendarios: !!z.lendarios,
    missao: { nome: 'Missão', alvos: [[z.pool[0].n, 10]], premio: { dinheiro: 300 } },
    alfa: { nome: 'Alfa', premio: { dinheiro: 500 }, trocado: null }
  }));
  const pacote = { ...gerarPacote(rotas, { mapas: { 1: lista } }), versao: 1 };
  const v = validarPacote(pacote);
  assert.equal(v.ok, true, v.porque);
  assert.ok(pacote.missoesRota.some(m => m.rota === lista[lista.findIndex(z => z.id === rotaComum().id) + 1].id));

  // e sem a missão da rota criada, o erro nomeia a rota em vez de publicar um mapa torto
  assert.throws(() => gerarPacote([...rotas.slice(0, -1), { ...rotas.at(-1), missao: null }], { mapas: { 1: lista } }),
    /está sem missão/);
});

/* ---- fase 3: missões de conta ---- */
test('missão de conta: sem gen nem rota, com objetivo que as regras conhecem', () => {
  const base = pacoteDeFabrica();
  const m = { id: 'teste-global', nome: 'Teste', desc: 'Vença coisas.', objetivo: { vitorias: 5 }, premio: { dinheiro: 100 } };
  const ok = lista => validarPacote({ ...base, missoesGlobais: lista });
  assert.equal(ok([m]).ok, true);
  assert.equal(ok([]).ok, false, 'lista vazia apagaria todas as missões de conta');
  assert.equal(ok([{ ...m, gen: 1 }]).ok, false, 'global com gen só valeria num mapa');
  assert.equal(ok([{ ...m, rota: 'rota1' }]).ok, false);
  assert.equal(ok([{ ...m, objetivo: { inventado: 3 } }]).ok, false, 'condição que as regras não conhecem fica impossível em silêncio');
  assert.equal(ok([{ ...m, objetivo: { vitorias: 0 } }]).ok, false, 'alvo 0 já nasce cumprido');
  assert.equal(ok([{ ...m, objetivo: { nivel: 120 } }]).ok, false, 'nível acima de 100 nunca completa');
  assert.equal(ok([{ ...m, premio: { itens: { 'nao-existe': 1 } } }]).ok, false, 'prêmio com item que não existe dá nada, calado');
  assert.equal(ok([{ ...m, premio: { itens: { potion: 2 } } }]).ok, true);
  assert.equal(ok([{ ...m, id: base.missoesRota[0].id }]).ok, false, 'id de missão de rota');
  assert.equal(ok([{ ...m, libera: { missao: 'nao-existe' } }]).ok, false, 'libera pendurado em missão inexistente esconde a missão pra sempre');
  assert.equal(ok([{ ...m, libera: { missao: m.id } }, m]).ok, false, 'id repetido');
  assert.equal(ok([m, { ...m, id: 'outra', libera: { missao: 'teste-global' } }]).ok, true);
});

test('aplicar as missões de conta muta MISSOES_GLOBAIS no lugar e refaz MISSOES', t => {
  t.after(restaurar);
  const quantasAntes = MISSOES_GLOBAIS.length;
  const m = { id: 'so-essa', nome: 'Só essa', desc: 'Vença 1.', objetivo: { vitorias: 1 }, premio: { dinheiro: 1 } };
  aplicarConteudo({ ...pacoteDeFabrica(), missoesGlobais: [m] });
  assert.equal(MISSOES_GLOBAIS.length, 1);
  assert.equal(MISSOES[0].id, 'so-essa', 'as globais continuam na frente');
  // pacote sem a chave = as de fábrica de volta
  aplicarConteudo({ ...pacoteDeFabrica(), missoesGlobais: undefined });
  assert.equal(MISSOES_GLOBAIS.length, quantasAntes);
});

/* ---- fase 3: itens e badges ---- */
test('item: só preço, nome e descrição; item que não existe é recusado', () => {
  assert.equal(validarItens({ potion: { price: 500 } }).ok, true);
  assert.equal(validarItens({ potion: { price: 0 } }).ok, true, 'preço 0 é o botão de tirar da loja');
  assert.equal(validarItens({ potion: { heal: 9999 } }).ok, false, 'o efeito é código');
  assert.equal(validarItens({ 'poção-inventada': { price: 1 } }).ok, false);
  assert.equal(validarItens({ potion: { price: -1 } }).ok, false);
  assert.equal(validarItens({ potion: { price: 1.5 } }).ok, false);
});

test('badge: nome, descrição e recompensa; a medida continua sendo código', () => {
  const id = BADGES[0].id;
  assert.equal(validarBadges({ [id]: { nome: 'Outro nome' } }).ok, true);
  assert.equal(validarBadges({ [id]: { recompensa: { dinheiro: 5000, titulo: 'Chefe' } } }).ok, true);
  assert.equal(validarBadges({ [id]: { mede: 'x' } }).ok, false);
  assert.equal(validarBadges({ [id]: { alvo: 1 } }).ok, false);
  assert.equal(validarBadges({ 'badge-inventada': { nome: 'x' } }).ok, false);
  assert.equal(validarBadges({ [id]: { recompensa: { itens: { 'nao-existe': 1 } } } }).ok, false);
});

test('aplicar o remendo de item e badge, e desfazer pelo de fábrica', t => {
  t.after(restaurar);
  const precoAntes = ITEMS.potion.price, cura = ITEMS.potion.heal;
  const id = BADGES[0].id, nomeAntes = BADGES[0].nome;
  aplicarConteudo({ ...pacoteDeFabrica(), itens: { potion: { price: 1234 } }, badges: { [id]: { nome: 'Renomeada' } } });
  assert.equal(ITEMS.potion.price, 1234);
  assert.equal(ITEMS.potion.heal, cura, 'o efeito não é tocado');
  assert.equal(BADGES[0].nome, 'Renomeada');
  aplicarConteudo({ ...pacoteDeFabrica(), itens: {}, badges: {} });
  assert.equal(ITEMS.potion.price, precoAntes);
  assert.equal(BADGES[0].nome, nomeAntes);
});

/* ---- o editor de conteúdo (as partes que não dependem de `localStorage`) ---- */
test('o editor de conteúdo sem rascunho devolve o que está no jogo, e o bloco sai pronto pra colar', () => {
  assert.deepEqual(missoesGlobaisEditadas().map(m => m.id), MISSOES_GLOBAIS.map(m => m.id));
  assert.equal(validarPacote({ ...pacoteDeFabrica(), missoesGlobais: missoesGlobaisEditadas() }).ok, true);
  assert.equal(extrasDoConteudo().missoesGlobais, undefined, 'sem edição, o pacote não leva a chave');

  const txt = gerarBlocoConteudo({ missoesGlobais: missoesGlobaisEditadas(), itens: { potion: { price: 1 } }, badges: {} });
  assert.match(txt, /export const MISSOES_GLOBAIS = \[/);
  assert.match(txt, /ITEMS\["potion"\] = \{ \.\.\.ITEMS\["potion"\]/);
  assert.match(gerarBlocoConteudo({}), /nada editado/);
});

test('missão de conta não sai se outra depender dela, e o id novo nunca repete', () => {
  const presa = MISSOES_GLOBAIS.find(m => MISSOES_GLOBAIS.some(x => x.libera?.missao === m.id));
  assert.ok(presa, 'a tabela de fábrica tem corrente de missões (senão o teste não prova nada)');
  const r = excluirMissaoGlobal(presa.id);
  assert.equal(r.ok, false);
  assert.match(r.porque, /só abre depois desta/);

  assert.equal(idDeMissaoNova('missao-nova', new Set()), 'missao-nova');
  assert.equal(idDeMissaoNova('missao-nova', new Set(['missao-nova'])), 'missao-nova-2');
  assert.match(idDeMissaoNova('Missão Com Acento!', new Set()), /^[a-z0-9-]+$/);
});

/* ---- aplicar no meio de uma jornada ---- */
test('podeAplicarAgora: o mapa da Gen em que a jornada está não troca na hora', t => {
  t.after(restaurar);
  const alvo = rotaComum();
  const lista = genUm().map(z => (z.id === alvo.id ? { ...z, min: 44, max: 46 } : z));
  const S = { gen: 1, zona: alvo.id, missoes: {}, player: { level: 10 } };
  assert.equal(podeAplicarAgora(comMapa(lista), S).pode, false);
  assert.match(podeAplicarAgora(comMapa(lista), S).porque, /Gen 1/);
  // a mesma lista, sem mudança nenhuma, não tem por que esperar
  assert.equal(podeAplicarAgora(comMapa(genUm()), S).pode, true);
  // jornada em outra Gen: aplica na hora
  assert.equal(podeAplicarAgora(comMapa(lista), { ...S, gen: 2 }).pode, true);
});

test('podeAplicarAgora: missão de CONTA começada que mudaria de objetivo bloqueia', t => {
  t.after(restaurar);
  const g = MISSOES_GLOBAIS[0];
  const S = { gen: 1, missoes: { [g.id]: 'ativa' }, player: { level: 10 } };
  const mudada = MISSOES_GLOBAIS.map(m => (m.id === g.id ? { ...clonar(m), objetivo: { vitorias: 999 } } : clonar(m)));
  assert.equal(podeAplicarAgora({ ...pacoteDeFabrica(), missoesGlobais: mudada }, S).pode, false);
  // o mesmo pacote sem a chave das globais não mexe nelas: pode
  assert.equal(podeAplicarAgora({ ...pacoteDeFabrica(), missoesGlobais: undefined }, S).pode, true);
  // texto novo com o MESMO objetivo não atrapalha quem já começou
  const sóTexto = MISSOES_GLOBAIS.map(m => (m.id === g.id ? { ...clonar(m), nome: 'Outro nome' } : clonar(m)));
  assert.equal(podeAplicarAgora({ ...pacoteDeFabrica(), missoesGlobais: sóTexto }, S).pode, true);
});
