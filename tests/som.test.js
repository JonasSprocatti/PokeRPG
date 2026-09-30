/* Som (js/som.js). O motor de áudio em si não dá pra testar aqui (não há navegador), mas o que pode apodrecer em
   SILÊNCIO dá: a trilha de cada rota é escolhida pelo bioma de `cenario.climaDaRota`, e bioma sem faixa própria
   cai no tema padrão sem avisar ninguém — a rota nova simplesmente soaria genérica pra sempre. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMAS, precarregarCry, tocarCry, SOM_KEY } from '../js/som.js';
import { CLIMAS, climaDaRota } from '../js/cenario.js';
import { GENS } from '../js/dados-mapas.js';

test('todo bioma de cenario.js tem uma faixa em som.TEMAS', () => {
  const semFaixa = CLIMAS.map(c => c.id).filter(id => !TEMAS[id]);
  assert.deepEqual(semFaixa, [], `bioma sem trilha própria (cairia no padrão calado): ${semFaixa.join(', ')}`);
});

test('toda rota do jogo resolve num tema conhecido', () => {
  const rotas = GENS.flatMap(g => g.rotas);
  assert.ok(rotas.length > 90, 'esperava as ~99 rotas do jogo');
  for (const r of rotas) assert.ok(TEMAS[climaDaRota(r).id], `${r.id} caiu num tema sem faixa`);
});

/* O GRITO NA PRIMEIRA APARIÇÃO DA ESPÉCIE. Bug que foi pra produção: o mapa guardava o buffer, então `tocarCry`
   encontrava o registro ainda vazio, concluía "não chegou" e só re-aquecia — o grito não saía nunca na primeira
   vez, que é justamente o caso comum. Escapou de um teste manual porque lá eu esperei o áudio antes de tocar,
   ou seja, só o caminho QUENTE foi exercitado. Este teste exercita o FRIO: pedir o grito ANTES do áudio chegar
   e conferir que ele toca quando chega.
   Precisa fingir o navegador (Web Audio, localStorage, fetch): `motor()` consulta `window.AudioContext` na hora
   da chamada, não no carregamento do módulo, então dá pra montar os globais aqui mesmo. */
function fingirNavegador({ atrasoMs = 0 } = {}) {
  const tocados = [];
  let fetches = 0;
  class Param { constructor(v) { this.value = v; } setValueAtTime() {} linearRampToValueAtTime() {} exponentialRampToValueAtTime() {} }
  class No {
    constructor() { this.gain = new Param(1); this.frequency = new Param(440); this.Q = new Param(1); this.buffer = null; }
    connect() { return this; } stop() {}
    start() { if (this.buffer) tocados.push(this.buffer.id); }
  }
  const depois = (ms, v) => new Promise(r => setTimeout(() => r(v), ms));
  globalThis.window = globalThis;
  globalThis.AudioContext = class {
    constructor() { this.destination = {}; this.currentTime = 0; }
    createOscillator() { return new No(); } createGain() { return new No(); }
    createBiquadFilter() { return new No(); } createBufferSource() { return new No(); }
    decodeAudioData(b) { return depois(atrasoMs, { id: b.id }); }
    suspend() { return Promise.resolve(); } resume() { return Promise.resolve(); }
  };
  const mem = { [SOM_KEY]: 'true' };   // som LIGADO
  globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: k => { delete mem[k]; }, length: 0, key: () => null };
  globalThis.fetch = () => { const id = ++fetches; return depois(atrasoMs, { ok: true, arrayBuffer: () => Promise.resolve({ id }) }); };
  return { tocados, contarFetches: () => fetches };
}

/* Espera por CONDIÇÃO, nunca por um `sleep` fixo: a primeira versão deste teste dormia 80 ms e falhava de vez em
   quando no Raspberry Pi sob carga — teste intermitente não serve pra nada. Aqui o caminho feliz sai em poucos
   milissegundos e o limite só existe pra não travar a suíte se o código voltar a não tocar. */
async function esperarAte(cond, oQue, limiteMs = 2000) {
  for (let t = 0; t < limiteMs; t += 5) {
    if (cond()) return;
    await new Promise(r => setTimeout(r, 5));
  }
  assert.fail(oQue);
}

test('o grito toca na PRIMEIRA aparição da espécie, mesmo pedido antes de o áudio chegar', async () => {
  const { tocados, contarFetches } = fingirNavegador({ atrasoMs: 10 });
  precarregarCry(777);           // como pokemon.makeMon faz
  tocarCry(777);                 // como batalha.iniciar faz, logo depois — o áudio ainda NÃO chegou
  await esperarAte(() => tocados.length === 1, 'o grito da primeira aparição não saiu');

  tocarCry(777);                 // segunda vez: buffer já quente
  await esperarAte(() => tocados.length === 2, 'o grito não repetiu com o buffer pronto');
  assert.equal(contarFetches(), 1, 'a mesma espécie foi buscada mais de uma vez');
});

test('som desligado não busca nem toca grito nenhum', async () => {
  const { tocados, contarFetches } = fingirNavegador();
  globalThis.localStorage.removeItem(SOM_KEY);
  precarregarCry(778); tocarCry(778);
  // aqui a espera FIXA é o certo: a afirmação é que nada acontece, então é preciso dar tempo de acontecer
  await new Promise(r => setTimeout(r, 50));
  assert.equal(contarFetches(), 0);
  assert.equal(tocados.length, 0);
});

/* A queixa que gerou esta leva foi "som agudo demais": antes a melodia saía em `raiz + escala + 24` com raiz 62,
   o que chega perto de 2 kHz. O teto agora é `raiz + escala + 12`, e as raízes moram entre 48 e 57. */
test('nenhuma faixa pode gerar nota acima de 880 Hz (o teto de agudo combinado)', () => {
  const freq = m => 440 * 2 ** ((m - 69) / 12);
  for (const [id, t] of Object.entries(TEMAS)) {
    const maisAgudo = t.raiz + Math.max(...t.escala) + 12;   // a oitava mais alta que o gerador usa
    assert.ok(freq(maisAgudo) <= 880, `${id}: chega a ${Math.round(freq(maisAgudo))} Hz`);
    assert.ok(t.raiz >= 48 && t.raiz <= 57, `${id}: raiz ${t.raiz} fora da faixa grave combinada`);
    assert.equal(t.acordes.length, 4, `${id}: a progressão é de 4 compassos`);
  }
});
