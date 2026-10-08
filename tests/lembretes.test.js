import test from 'node:test';
import assert from 'node:assert';
import { lembretesDe, motivoDeVolta, ovoQuaseChocando, badgeQuaseFeita, DIAS_PARADO, DIAS_SEM_RUN } from '../js/lembretes.js';
import { MS_POR_PASSO } from '../js/ovos.js';

const DIA = 24 * 60 * 60 * 1000;
const save = (extra = {}) => ({ nome: 'Chamequinho', nivel: 23, rota: 'Rota 4', ovos: [], ...extra });

test('o ovo que falta menos manda, e o já pronto não conta (espera vaga)', () => {
  assert.equal(ovoQuaseChocando([{ alvo: 200, passos: 200 }]), null);
  assert.equal(ovoQuaseChocando([{ alvo: 100, passos: 90 }, { alvo: 100, passos: 98 }]).falta, 2);
  // o relógio dá a hora: 1 passo = 1 minuto, mesmo com o jogo fechado
  assert.equal(ovoQuaseChocando([{ alvo: 200, passos: 110 }]).ms, 90 * MS_POR_PASSO);
});

test('o lembrete do ovo é agendado pro minuto em que ele fica pronto, não pro prazo de parado', () => {
  const agora = Date.UTC(2026, 9, 8);
  const l = lembretesDe({ save: save({ ovos: [{ alvo: 100, passos: 40 }] }), agora })[0];
  assert.equal(Date.parse(l.quando) - agora, 60 * MS_POR_PASSO);
  assert.match(l.corpo, /1 h/);   // 60 min viram "1 h", não "60 min"
});

test('badge quase feita ignora completa e longe, e pega a mais perto', () => {
  const bs = [{ nome: 'A', n: 999, alvo: 1000 }, { nome: 'B', n: 950, alvo: 1000 }, { nome: 'C', n: 10, alvo: 1000 }, { nome: 'D', n: 1000, alvo: 1000, completo: true }];
  assert.equal(badgeQuaseFeita(bs).nome, 'A');
  assert.equal(badgeQuaseFeita([{ nome: 'C', n: 10, alvo: 1000 }]), null);
});

test('o ovo ganha da badge, e a badge ganha do parceiro parado', () => {
  const badge = [{ nome: 'Lenda viva', icone: '🗡', n: 999, alvo: 1000 }];
  assert.match(motivoDeVolta({ save: save({ ovos: [{ alvo: 100, passos: 95 }] }), badges: badge }).titulo, /ovo/);
  assert.match(motivoDeVolta({ save: save(), badges: badge }).titulo, /Lenda viva/);
  assert.match(motivoDeVolta({ save: save(), badges: [] }).titulo, /Chamequinho/);
});

test('o ovo nunca revela a espécie', () => {
  const m = motivoDeVolta({ save: save({ ovos: [{ alvo: 100, passos: 99, especie: 'bulbasaur' }] }) });
  assert.ok(!`${m.titulo} ${m.corpo}`.toLowerCase().includes('bulbasaur'));
});

test('sem jornada e sem badge perto, ninguém recebe push', () => {
  assert.equal(motivoDeVolta({}), null);
  assert.deepEqual(lembretesDe({}), []);
});

test('prazo: com jornada cobra antes, sem jornada convida depois', () => {
  const agora = Date.UTC(2026, 9, 8);
  const comRun = lembretesDe({ save: save(), agora })[0];
  assert.equal(Date.parse(comRun.quando) - agora, DIAS_PARADO * DIA);
  const semRun = lembretesDe({ badges: [{ nome: 'A', n: 99, alvo: 100 }], agora })[0];
  assert.equal(Date.parse(semRun.quando) - agora, DIAS_SEM_RUN * DIA);
});

test('chefe anda em paralelo ao volta, e só se ainda não passou', () => {
  const agora = Date.UTC(2026, 9, 8);
  const ls = lembretesDe({ save: save(), proximoChefe: { quando: agora + DIA, nome: 'Mega Rayquaza' }, agora });
  assert.deepEqual(ls.map(l => l.chave), ['volta', 'chefe']);
  assert.match(ls[1].corpo, /Mega Rayquaza/);
  assert.equal(lembretesDe({ proximoChefe: { quando: agora - DIA, nome: 'X' }, agora }).length, 0);
});

/* Detector de explosão do caminho de BOOT: `main.js` chama `agendarLembretes()` no `then` do `iniciarNuvem`, e
   `notificacoes.js` passou a importar nuvem/carreira/estado/evento. Import quebrado ou campo lido de `undefined`
   ali só apareceria pra quem joga. DOM de mentira igual ao de turno-smoke — sem jsdom, o projeto não tem deps. */
test('notificacoes.js carrega e agendarLembretes não explode sem VAPID', async () => {
  const el = () => new Proxy({}, { get: (t, k) => k === 'classList' ? { add() {}, remove() {} } : typeof k === 'symbol' ? undefined : (() => el()), set: () => true });
  globalThis.matchMedia = () => ({ matches: true, addEventListener() {}, addListener() {} });
  globalThis.document = { querySelector: () => el(), querySelectorAll: () => [], createElement: () => el(), getElementById: () => el(), body: el(), documentElement: el(), addEventListener() {} };
  globalThis.window = globalThis;
  globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 };
  globalThis.Notification = { permission: 'granted' };   // permissão dada: o caminho roda até a trava do push
  globalThis.navigator ??= {};                           // no navegador ele sempre existe; no Node, não

  const n = await import('../js/notificacoes.js');
  assert.equal(n.pushConfigurado(), false);              // config.js sem chave = push desligado, e o resto segue
  assert.equal(await n.agendarLembretes(), false);       // sem estourar, sem rede
  n.desligarNotificacoes();                              // cancelarPush() sem service worker: devolve, não quebra
});

test('chave é única por motivo — lembrete novo sobrescreve, não empilha', () => {
  const ls = lembretesDe({ save: save({ ovos: [{ alvo: 100, passos: 99 }] }), badges: [{ nome: 'A', n: 99, alvo: 100 }], proximoChefe: { quando: Date.now() + DIA, nome: 'X' } });
  assert.equal(new Set(ls.map(l => l.chave)).size, ls.length);
});
