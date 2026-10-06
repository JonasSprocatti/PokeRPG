/* 📦 O chão da Atualização de conteúdo pela nuvem (docs/plano-config-remota.md).
   Este é o teste que mais importa do sistema: um pacote ruim aplicado pela metade deixa o jogo num estado que
   ninguém desenhou, e `podeAplicarAgora` errado trava a missão de alguém no meio da jornada. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pacoteDeFabrica, validarPacote, aplicarConteudo, podeAplicarAgora, VERSAO_PACOTE } from '../js/conteudo.js';
import { GENS, MISSOES, MISSOES_GLOBAIS } from '../js/dados.js';

const umaRota = GENS[0].rotas[0].id;
const comGen = GENS[0].rotas[0];
// cada teste refaz as tabelas do zero: `aplicarConteudo` MUTA no lugar, então um teste sujaria o próximo
const restaurar = () => aplicarConteudo(pacoteDeFabrica());

test('o pacote de fábrica vale e traz as 180 missões de rota', () => {
  const p = pacoteDeFabrica();
  assert.equal(p.formato, VERSAO_PACOTE);
  assert.equal(p.versao, 0);
  assert.equal(p.missoesRota.length, 180);
  assert.equal(validarPacote(p).ok, true);
});

test('formato desconhecido é recusado em vez de adivinhado', () => {
  assert.equal(validarPacote({ ...pacoteDeFabrica(), formato: 99 }).ok, false);
  assert.equal(validarPacote({ ...pacoteDeFabrica(), formato: undefined }).ok, false);
  assert.equal(validarPacote(null).ok, false);
  assert.equal(validarPacote([]).ok, false, 'lista não é pacote');
  assert.equal(validarPacote('{}').ok, false, 'texto não é pacote');
});

test('versão tem de ser inteiro >= 0', () => {
  for (const v of [-1, 1.5, '3', null, undefined, NaN]) {
    assert.equal(validarPacote({ ...pacoteDeFabrica(), versao: v }).ok, false, `versão ${v}`);
  }
  assert.equal(validarPacote({ ...pacoteDeFabrica(), versao: 7 }).ok, true);
});

test('alfas: rota tem de existir, nível cabe em 1–100, id de espécie é inteiro', () => {
  const base = pacoteDeFabrica();
  assert.equal(validarPacote({ ...base, alfas: { [umaRota]: { id: 149, nivel: 50, nome: 'O Alfa' } } }).ok, true);
  assert.equal(validarPacote({ ...base, alfas: { 'rota-que-nao-existe': { id: 1 } } }).ok, false);
  assert.equal(validarPacote({ ...base, alfas: { 'MAIÚSCULA': { id: 1 } } }).ok, false, 'id de rota fora do formato');
  assert.equal(validarPacote({ ...base, alfas: { [umaRota]: { nivel: 0 } } }).ok, false);
  assert.equal(validarPacote({ ...base, alfas: { [umaRota]: { nivel: 101 } } }).ok, false);
  // id de espécie como TEXTO é o furo do `poke_id` cru num src: nunca passa
  assert.equal(validarPacote({ ...base, alfas: { [umaRota]: { id: '149' } } }).ok, false);
  assert.equal(validarPacote({ ...base, alfas: { [umaRota]: { id: 1.5 } } }).ok, false);
  // id de FORMA passa de 10000: a faixa é "inteiro positivo", não 1–1025
  assert.equal(validarPacote({ ...base, alfas: { [umaRota]: { id: 10037 } } }).ok, true);
  assert.equal(validarPacote({ ...base, alfas: [] }).ok, false, 'lista não é tabela de alfas');
});

test('missão de rota: id único, gen e rota existentes, quantidade com teto', () => {
  const base = pacoteDeFabrica();
  const m = { id: 'teste-esp', gen: comGen.gen ?? 1, rota: umaRota, nome: 'Teste', desc: 'Derrote coisas.', objetivo: { alvos: [['rattata', 3]] }, premio: {} };
  const ok = p => validarPacote({ ...base, missoesRota: p }).ok;
  assert.equal(ok([{ ...m, gen: 1 }]), true);
  assert.equal(ok([{ ...m, gen: 1 }, { ...m, gen: 1 }]), false, 'id repetido');
  assert.equal(ok([{ ...m, gen: 1, id: MISSOES_GLOBAIS[0].id }]), false, 'id de missão global');
  assert.equal(ok([{ ...m, gen: 999 }]), false, 'gen que não existe');
  assert.equal(ok([{ ...m, gen: 1, rota: 'nada' }]), false, 'rota que não existe');
  assert.equal(ok([{ ...m, gen: 1, objetivo: undefined }]), false, 'sem objetivo');
  assert.equal(ok([{ ...m, gen: 1, objetivo: { alvos: [] } }]), false, 'alvos vazio');
  assert.equal(ok([{ ...m, gen: 1, objetivo: { alvos: [['rattata', 0]] } }]), false, 'alvo 0 nunca completa');
  assert.equal(ok([{ ...m, gen: 1, objetivo: { alvos: [['rattata', 1000]] } }]), false, 'alvo gigante trava a missão');
  assert.equal(ok([{ ...m, gen: 1, objetivo: { alvos: [['rattata']] } }]), false, 'alvo malformado');
  assert.equal(ok([{ ...m, gen: 1, nome: '' }]), false, 'nome vazio');
  assert.equal(ok('nao-e-lista'), false);
  // missão de CHEFE não tem alvos, e isso é válido
  assert.equal(ok([{ ...m, gen: 1, objetivo: { chefe: umaRota } }]), true);
});

test('aplicar troca o Alfa no lugar e refaz MISSOES com as globais na frente', t => {
  t.after(restaurar);
  const rota = GENS[0].rotas[0];
  const alfaAntes = { ...rota.chefe };
  const r = aplicarConteudo({ formato: VERSAO_PACOTE, versao: 5, alfas: { [rota.id]: { id: 10037, nome: 'Alfa Novo', nivel: 44 } }, missoesRota: [] });
  assert.equal(r.alfasTrocados, 1);
  assert.equal(r.versao, 5);
  assert.equal(GENS[0].rotas[0].chefe.id, 10037, 'o Alfa foi trocado NO LUGAR (mesma referência de array)');
  assert.equal(GENS[0].rotas[0].chefe.nivel, 44);
  assert.notEqual(alfaAntes.id, 10037, 'o teste prova algo: o Alfa de fábrica era outro');
  // MISSOES sem as de rota = só as globais, e na ordem
  assert.equal(MISSOES.length, MISSOES_GLOBAIS.length);
  assert.equal(MISSOES[0].id, MISSOES_GLOBAIS[0].id);
});

test('aplicar o pacote de fábrica devolve as 180 de rota depois das globais', t => {
  t.after(restaurar);
  aplicarConteudo({ formato: VERSAO_PACOTE, versao: 1, missoesRota: [] });
  assert.equal(MISSOES.length, MISSOES_GLOBAIS.length);
  const r = aplicarConteudo(pacoteDeFabrica());
  assert.equal(r.missoes, 180);
  assert.equal(MISSOES.length, MISSOES_GLOBAIS.length + 180);
  assert.equal(MISSOES[MISSOES_GLOBAIS.length - 1].id, MISSOES_GLOBAIS.at(-1).id, 'as globais continuam na frente');
});

test('podeAplicarAgora: sem jornada, pode sempre', () => {
  assert.equal(podeAplicarAgora(pacoteDeFabrica(), null).pode, true);
  assert.equal(podeAplicarAgora(pacoteDeFabrica(), undefined).pode, true);
});

test('podeAplicarAgora: missão começada que SAIRIA do jogo bloqueia', t => {
  t.after(restaurar);
  restaurar();
  const daRota = MISSOES.find(m => !MISSOES_GLOBAIS.some(g => g.id === m.id));
  const S = { missoes: { [daRota.id]: 'ativa' } };
  // pacote sem ela: o progresso ficaria pendurado numa missão que não existe
  assert.equal(podeAplicarAgora({ formato: VERSAO_PACOTE, versao: 2, missoesRota: [] }, S).pode, false);
  // pacote com ela igual: nada quebra
  assert.equal(podeAplicarAgora(pacoteDeFabrica(), S).pode, true);
});

test('podeAplicarAgora: objetivo mudado numa missão começada bloqueia; entregue não bloqueia', t => {
  t.after(restaurar);
  restaurar();
  const daRota = MISSOES.find(m => m.objetivo?.alvos && !MISSOES_GLOBAIS.some(g => g.id === m.id));
  const mexida = { ...daRota, objetivo: { alvos: [[daRota.objetivo.alvos[0][0], 99]] } };
  const pacote = { formato: VERSAO_PACOTE, versao: 3, missoesRota: pacoteDeFabrica().missoesRota.map(m => m.id === daRota.id ? mexida : m) };
  assert.equal(podeAplicarAgora(pacote, { missoes: { [daRota.id]: 'ativa' } }).pode, false, 'em andamento: espera');
  assert.equal(podeAplicarAgora(pacote, { missoes: { [daRota.id]: 'entregue' } }).pode, true, 'o prêmio já foi: pode mudar');
  assert.equal(podeAplicarAgora(pacote, { missoes: {} }).pode, true, 'nem começou');
});

test('podeAplicarAgora: Alfa da rota em que o jogador ESTÁ não troca de espécie no meio', t => {
  t.after(restaurar);
  restaurar();
  const rota = GENS[0].rotas.find(z => z.chefe);
  const pacote = { formato: VERSAO_PACOTE, versao: 4, alfas: { [rota.id]: { id: rota.chefe.id + 1 } }, missoesRota: pacoteDeFabrica().missoesRota };
  assert.equal(podeAplicarAgora(pacote, { zona: rota.id, missoes: {} }).pode, false);
  assert.equal(podeAplicarAgora(pacote, { zona: 'outra-rota', missoes: {} }).pode, true, 'noutra rota, tudo bem');
  // mudar só o NOME ou o NÍVEL do Alfa não é troca de espécie: não bloqueia
  const soNome = { formato: VERSAO_PACOTE, versao: 4, alfas: { [rota.id]: { nome: 'Outro nome' } }, missoesRota: pacoteDeFabrica().missoesRota };
  assert.equal(podeAplicarAgora(soNome, { zona: rota.id, missoes: {} }).pode, true);
});
