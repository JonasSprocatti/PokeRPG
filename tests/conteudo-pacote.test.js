/* As fábricas de missão existem DUAS VEZES, e este teste é o que as prende uma na outra:
     1. `editor-rotas.missaoDeEspecie` / `missaoDeAlfa` — funções de verdade, o que o 📤 Publicar executa;
     2. a cópia inline dentro do texto que `gerarArquivo` cospe, e que hoje é `js/dados-rotas.js`.
   Duas cópias da mesma regra = a segunda é a que fica velha. Aqui o pacote montado a partir das rotas SEM edição
   tem de bater, CAMPO POR CAMPO, com o `MISSOES_ROTA` que está no repositório. Mexeu numa e esqueceu a outra, ou
   mudou o formato de um lado só, e isto falha com o id da missão que divergiu.

   Não é zelo: `conteudo.js` aplica o pacote sobre `MISSOES`, então uma divergência de formato aqui vira missão
   que não aparece, ou que aparece com objetivo errado, pra quem pegar a atualização. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarPacote, missaoDeEspecie, missaoDeAlfa } from '../js/editor-rotas.js';
import { MISSOES_ROTA } from '../js/dados-rotas.js';
import { validarPacote } from '../js/conteudo.js';
import { GENS } from '../js/dados.js';

/* As rotas como o editor as monta, sem rascunho nenhum — a mesma forma que `tela-editor-rotas.rotasComMissao`
   produz, derivada do que já está em `MISSOES_ROTA`. Montar daqui (e não importar a tela, que tem DOM) é o que
   permite este teste rodar no Node. */
function rotasDeFabrica() {
  const porRota = new Map();
  for (const m of MISSOES_ROTA) {
    const atual = porRota.get(m.rota) || { gen: m.gen, rota: m.rota };
    if (m.id.endsWith('-esp')) { atual.missao = { nome: m.nome, alvos: m.objetivo.alvos, premio: m.premio }; }
    else {
      atual.alfa = { nome: m.nome, premio: m.premio };
      atual.antes = m.libera?.chefe ?? null;
      atual.lendarios = m.desc.includes('lendários');
      // o `rotulo` é o que aparece na descrição do Alfa; extraído dela pra não depender dos mapas
      const mm = m.desc.match(/Alfa de (.+)\.$/) || m.desc.match(/lendários de (.+) e feche/);
      atual.rotulo = mm ? mm[1] : m.rota;
    }
    porRota.set(m.rota, atual);
  }
  return [...porRota.values()];
}

test('o pacote das rotas sem edição é idêntico ao MISSOES_ROTA do repositório', () => {
  const p = gerarPacote(rotasDeFabrica());
  assert.equal(p.missoesRota.length, MISSOES_ROTA.length, 'mesma quantidade de missões');
  for (let i = 0; i < MISSOES_ROTA.length; i++) {
    // deepEqual campo por campo: `desc`, `libera` e `objetivo` são justamente onde as duas cópias divergiriam
    assert.deepEqual(p.missoesRota[i], MISSOES_ROTA[i], `missão ${MISSOES_ROTA[i].id} divergiu entre as duas cópias da fábrica`);
  }
});

test('o pacote montado pelo editor passa pela validação de conteudo.js', () => {
  const v = validarPacote(gerarPacote(rotasDeFabrica()));
  assert.equal(v.ok, true, v.porque);
});

test('gerarPacote sai com versão 0: quem numera é quem publica', () => {
  // número na mão de quem publica = republicar com número menor e o pacote novo ser ignorado por todo cache
  assert.equal(gerarPacote(rotasDeFabrica()).versao, 0);
  assert.equal(gerarPacote([]).formato, 1);
});

test('gerarPacote só põe em `alfas` a rota com Alfa TROCADO', () => {
  const base = { gen: 1, rota: 'rota1', rotulo: 'Rota 1', antes: null, missao: { nome: 'M', alvos: [['rattata', 4]], premio: {} }, alfa: { nome: 'A', premio: {} } };
  assert.deepEqual(gerarPacote([base]).alfas, {}, 'sem troca, a rota nem aparece — segue com o Alfa do mapa');
  const trocado = { ...base, alfa: { ...base.alfa, trocado: { id: 149, nome: 'Dragonite', nivel: 40 } } };
  assert.deepEqual(gerarPacote([trocado]).alfas, { rota1: { id: 149, nome: 'Dragonite', nivel: 40 } });
});

test('as fábricas: missão de espécie tem alvos, a de Alfa tem chefe, e a final fala de lendários', () => {
  const e = missaoDeEspecie(1, 'rota1', 'Praga', [['rattata', 24]], { dinheiro: 1 });
  assert.equal(e.id, 'rota1-esp');
  assert.deepEqual(e.objetivo, { alvos: [['rattata', 24]] });
  assert.deepEqual(e.libera, { alvos: [['rattata', 1]], qualquer: 1 }, 'basta derrotar UM pra a missão aparecer');
  assert.match(e.desc, /24 Rattata/);

  const a = missaoDeAlfa(1, 'rota1', 'O Alfa', 'Rota 1', null, {}, false);
  assert.deepEqual(a.objetivo, { chefe: 'rota1' });
  assert.deepEqual(a.libera, { nivel: 1 }, 'a primeira rota libera no nível 1');
  const segunda = missaoDeAlfa(1, 'floresta', 'X', 'Floresta', 'rota1', {}, false);
  assert.deepEqual(segunda.libera, { chefe: 'rota1' }, 'as outras liberam pelo Alfa anterior');
  const final = missaoDeAlfa(1, 'k-vitoria', 'X', 'Estrada Vitória', 'rota9', {}, true);
  assert.match(final.desc, /lendários/);
});

test('todas as 99 rotas dos mapas têm missão, e nenhuma missão aponta pra rota fantasma', () => {
  const rotas = new Set(GENS.flatMap(g => g.rotas.map(z => z.id)));
  for (const m of MISSOES_ROTA) assert.ok(rotas.has(m.rota), `missão ${m.id} aponta pra rota "${m.rota}" que não existe`);
});
