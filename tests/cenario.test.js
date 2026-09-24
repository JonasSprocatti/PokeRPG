/* Cenário da batalha (js/cenario.js): puro, e por isso testável — a cena muda de cara conforme a rota, e é
   melhor descobrir aqui que uma rota inteira caiu no clima errado do que abrindo 90 lutas no navegador. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { climaDaRota, estiloDaCena, nomeDoClima, CLIMAS } from '../js/cenario.js';
import { GENS } from '../js/mapas.js';

test('o clima sai do texto da rota, e o específico vence o genérico', () => {
  assert.equal(nomeDoClima({ name: 'Monte Lua', desc: 'Caverna escura e cheia de pedras.' }), 'caverna');
  assert.equal(nomeDoClima({ name: 'Ilhas Espuma', desc: 'Gelo, correntes e ondas geladas.' }), 'gelo', 'gelo antes de mar');
  assert.equal(nomeDoClima({ name: 'Usina Elétrica', desc: 'Máquinas zumbindo no escuro.' }), 'usina');
  assert.equal(nomeDoClima({ name: 'Torre Pokémon', desc: 'Silêncio, velas e névoa.' }), 'fantasma');
  assert.equal(nomeDoClima({ name: 'Rota 1', desc: 'Grama baixa e trilhas de terra.' }), 'padrao', 'campo aberto fica no padrão');
});

test('`tema` declarado manda mais que o texto, e o Santuário tem clima próprio', () => {
  assert.equal(nomeDoClima({ name: 'Rota 1', tema: 'vulcao' }), 'vulcao');
  assert.equal(nomeDoClima({ name: 'Santuário de Kanto', posVitoria: true }), 'santuario');
  assert.equal(nomeDoClima(null), 'padrao', 'sem rota, não quebra');
  assert.equal(nomeDoClima({}), 'padrao');
});

test('todo clima tem as quatro cores, e o estilo sai pronto pro CSS', () => {
  for (const c of CLIMAS) {
    assert.equal(c.ceu.length, 2, c.id);
    for (const cor of [...c.ceu, c.chao, c.luz]) assert.match(cor, /^#[0-9a-f]{6}$/i, `${c.id}: ${cor}`);
  }
  const estilo = estiloDaCena({ name: 'Caverna Cerúlea', desc: 'caverna' });
  for (const v of ['--ceu1:', '--ceu2:', '--chao:', '--luz:']) assert.ok(estilo.includes(v), v);
  assert.ok(!estilo.includes('undefined'));
});

/* Varre as rotas de verdade: nenhuma pode quebrar, e o jogo não pode acabar com tudo caindo no padrão — se
   isso acontecer, a lista de palavras parou de casar com os nomes das rotas. */
test('as rotas do jogo se distribuem entre os climas', () => {
  const rotas = GENS.flatMap(g => g.rotas);
  const conta = {};
  for (const z of rotas) {
    const c = climaDaRota(z);
    assert.ok(c && c.id, `${z.name}: sem clima`);
    conta[c.id] = (conta[c.id] || 0) + 1;
  }
  assert.ok(Object.keys(conta).length >= 5, `só ${Object.keys(conta).length} climas em uso: ${JSON.stringify(conta)}`);
  assert.ok((conta.padrao || 0) < rotas.length * 0.6, `padrão demais (${conta.padrao} de ${rotas.length})`);
});
