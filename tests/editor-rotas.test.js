// Editor de rotas (js/editor-rotas.js): as contas da curva de stats, o veredito do Alfa e a geração do arquivo.
// A tela (tela-editor-rotas.js) não é testada aqui — ela só lê estas funções e desenha.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bst, curvaDaRota, equilibrioDaRota, vereditoAlfa, candidatosAlfa, quantidadePorPeso, dividirQuantidade,
  bonito, gerarArquivo, FAIXA_ALFA, ESPALHAMENTO_ALTO
} from '../js/editor-rotas.js';

const E = (n, p, b) => ({ n, p, bst: b });

test('bst soma os 6 base stats e aguenta dado faltando', () => {
  assert.equal(bst({ hp: 45, attack: 49, defense: 49, 'special-attack': 65, 'special-defense': 65, speed: 45 }), 318);
  assert.equal(bst({ hp: 10 }), 10);
  assert.equal(bst(null), 0);
});

test('a curva usa MEDIANA, não média: um lendário no pool não desloca o centro', () => {
  const comLenda = curvaDaRota([E('a', 8, 300), E('b', 8, 310), E('c', 8, 320), E('d', 1, 680)]);
  assert.equal(comLenda.mediana, 315);
  assert.ok(comLenda.media > comLenda.mediana, 'a média é que se deixa puxar');
  assert.equal(comLenda.min, 300);
  assert.equal(comLenda.max, 680);
  // e a lista sai ordenada do mais forte pro mais fraco, que é a ordem da tabela na tela
  assert.deepEqual(comLenda.especies.map(e => e.n), ['d', 'c', 'b', 'a']);
});

test('a mediana ponderada segue o que REALMENTE aparece na rota', () => {
  /* Pool com um bicho forte raro (peso 1) e três fracos comuns (peso 8): a mediana crua fica no meio da LISTA,
     a ponderada fica onde o jogador vive. É a que o veredito do Alfa usa. */
  const c = curvaDaRota([E('fraco1', 8, 200), E('fraco2', 8, 210), E('forte', 1, 600), E('medio', 8, 220)]);
  assert.equal(c.mediana, 215);
  assert.ok(c.pesada <= 220, `ponderada ${c.pesada} devia ficar junto dos comuns`);
});

test('curva vazia ou sem stats carregados devolve null (a tela mostra "carregando", não quebra)', () => {
  assert.equal(curvaDaRota([]), null);
  assert.equal(curvaDaRota([{ n: 'a', p: 8, bst: undefined }]), null);
  assert.equal(equilibrioDaRota(null), null);
  assert.equal(vereditoAlfa(400, null), null);
  assert.equal(vereditoAlfa(0, curvaDaRota([E('a', 8, 300)])), null);
});

test('espalhamento marca a rota desigual e aponta quem está puxando', () => {
  const parelha = equilibrioDaRota(curvaDaRota([E('a', 8, 300), E('b', 8, 310), E('c', 8, 320)]));
  assert.equal(parelha.nivel, 'parelha');
  assert.deepEqual(parelha.foraDaCurva, []);
  const desigual = equilibrioDaRota(curvaDaRota([E('a', 8, 300), E('b', 8, 310), E('dratini', 2, 600)]));
  assert.equal(desigual.nivel, 'desigual');
  assert.ok(desigual.espalhamento >= ESPALHAMENTO_ALTO);
  assert.deepEqual(desigual.foraDaCurva, ['dratini']);
});

test('veredito do Alfa: fraco, justo e muro, com a faixa-alvo pra procurar candidato', () => {
  const curva = curvaDaRota([E('a', 8, 300), E('b', 8, 300), E('c', 8, 300)]);
  assert.equal(vereditoAlfa(250, curva).veredito, 'fraco');          // mais fraco que o capim
  assert.equal(vereditoAlfa(310, curva).veredito, 'justo-fraco');    // acima, mas pouco
  assert.equal(vereditoAlfa(300 * FAIXA_ALFA.minimo, curva).veredito, 'justo');
  assert.equal(vereditoAlfa(300 * FAIXA_ALFA.maximo, curva).veredito, 'justo');
  assert.equal(vereditoAlfa(600, curva).veredito, 'muro');
  const v = vereditoAlfa(400, curva);
  assert.equal(v.ok, true);
  assert.deepEqual(v.alvo, [345, 450]);
});

test('candidatos a Alfa saem da faixa-alvo, do meio dela pra fora', () => {
  const curva = curvaDaRota([E('a', 8, 300), E('b', 8, 300)]);     // alvo 345–450, meio 397,5
  const gen = [E('fraco', 8, 200), E('quase', 8, 350), E('ideal', 8, 400), E('forte', 8, 700)];
  assert.deepEqual(candidatosAlfa(gen, curva).map(e => e.n), ['ideal', 'quase']);
  assert.deepEqual(candidatosAlfa(gen, null), []);
});

test('quantidade sugerida cai conforme a espécie é rara', () => {
  assert.equal(quantidadePorPeso(8), 24);
  assert.equal(quantidadePorPeso(6), 16);
  assert.equal(quantidadePorPeso(3), 12);
  assert.equal(quantidadePorPeso(2), 8);
  assert.equal(quantidadePorPeso(0.1), 4);
});

test('o total se divide entre as espécies da missão (o caso Plusle + Minun)', () => {
  assert.deepEqual(dividirQuantidade(16, 2), [8, 8]);
  assert.deepEqual(dividirQuantidade(24, 2), [12, 12]);
  // resto vai pras primeiras, e nunca sai 0 (missão de "derrote 0" não existe)
  assert.deepEqual(dividirQuantidade(25, 2), [13, 12]);
  assert.deepEqual(dividirQuantidade(7, 3), [3, 2, 2]);
  assert.deepEqual(dividirQuantidade(2, 3), [1, 1, 1]);
  assert.deepEqual(dividirQuantidade(10, 0), []);
});

test('bonito monta o nome que o jogador lê', () => {
  assert.equal(bonito('rattata'), 'Rattata');
  assert.equal(bonito('nidoran-f'), 'Nidoran F');
  assert.equal(bonito('mr-mime'), 'Mr Mime');
});

/* O arquivo gerado é o produto do editor: se ele sair malformado, o jogo inteiro para de carregar (um `import`
   que estoura leva todo o grafo). Então o teste CARREGA o resultado de volta como módulo e confere o conteúdo —
   `node --check` não existe no Windows, e este arquivo é reescrito a cada edição. */
test('gerarArquivo produz um módulo válido, com as missões e o Alfa trocado', async () => {
  const rotas = [
    { gen: 3, regiao: 'Hoenn', rota: 'h-pira', rotulo: 'Monte Pira', antes: 'h-deserto', lendarios: false,
      missao: { nome: 'Mais ou Menos', alvos: [['plusle', 8], ['minun', 8]], premio: { itens: { 'hyper-potion': 2 } } },
      alfa: { nome: 'Punho de aço', premio: { dinheiro: 7000 }, trocado: { id: 376, nome: 'Metagross', nivel: 42 } } },
    { gen: 3, regiao: 'Hoenn', rota: 'h-pilar', rotulo: 'Pilar Celeste', antes: 'h-pira', lendarios: true,
      missao: { nome: 'Palmeira voadora', alvos: [['tropius', 16]], premio: { dinheiro: 12000 } },
      alfa: { nome: 'Campeão de Hoenn', premio: { dinheiro: 25000 }, trocado: null } }
  ];
  const texto = gerarArquivo(rotas, '2026-10-01');
  const mod = await import('data:text/javascript,' + encodeURIComponent(texto));

  // o Alfa trocado entra em ALFAS; o que não mudou não entra (ALFAS vazio = mapas intocados)
  assert.deepEqual(mod.ALFAS, { 'h-pira': { id: 376, nome: 'Metagross', nivel: 42 } });

  const [esp, alfa, esp2, alfa2] = mod.MISSOES_ROTA;
  assert.equal(mod.MISSOES_ROTA.length, 4);
  assert.equal(esp.id, 'h-pira-esp');
  assert.equal(esp.gen, 3);
  assert.equal(esp.rota, 'h-pira');
  assert.equal(esp.desc, 'Derrote 8 Plusle e 8 Minun.');
  assert.deepEqual(esp.objetivo, { alvos: [['plusle', 8], ['minun', 8]] });
  // o `libera` NUNCA é igual ao objetivo (senão a missão nasce pronta — foi defeito de verdade na tabela antiga)
  assert.deepEqual(esp.libera, { alvos: [['plusle', 1], ['minun', 1]], qualquer: 1 });
  assert.notDeepEqual(esp.libera, esp.objetivo);

  assert.equal(alfa.id, 'h-pira-alfa');
  assert.equal(alfa.desc, 'Derrote o Alfa de Monte Pira.');
  assert.deepEqual(alfa.libera, { chefe: 'h-deserto' });
  assert.deepEqual(alfa.objetivo, { chefe: 'h-pira' });

  assert.equal(esp2.desc, 'Derrote 16 Tropius.');
  // rota final: o texto fala dos lendários e de fechar a Gen, não de "Alfa"
  assert.equal(alfa2.desc, 'Vença os lendários de Pilar Celeste e feche a Gen 3.');
});

test('gerarArquivo sem nenhuma troca de Alfa deixa ALFAS vazio', async () => {
  const texto = gerarArquivo([{ gen: 1, rota: 'rota1', rotulo: 'Rota 1', antes: null, lendarios: false,
    missao: { nome: 'Praga de Rattata', alvos: [['rattata', 24]], premio: { itens: { potion: 4 } } },
    alfa: { nome: 'O Alfa da Rota 1', premio: { dinheiro: 1000 }, trocado: null } }]);
  const mod = await import('data:text/javascript,' + encodeURIComponent(texto));
  assert.deepEqual(mod.ALFAS, {});
  // primeira rota do mapa: a missão do Alfa não tem rota anterior, então libera no nível 1
  assert.deepEqual(mod.MISSOES_ROTA[1].libera, { nivel: 1 });
});
