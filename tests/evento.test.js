// Eventos semanais (js/evento.js): calendário (reset na segunda 00:00 de Brasília, começando em 28/09/2026), agenda,
// elegibilidade por modo e Gen, e a espera de 8 horas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTOS, INICIO, SEMANA_MS, COOLDOWN_MS, indiceDaSemana, idDaSemana, eventoDaSemana, eventoDaGen, fimDaSemana, modoComEvento,
  esperaRestante, formatarEspera, situacaoDoEvento, agenda, dataBR, jaComecou, eventoDoIndice } from '../js/evento.js';
import { DIFICULDADES, ITEMS } from '../js/dados.js';
import { GENS } from '../js/mapas.js';

const H = 60 * 60 * 1000;

test('a semana vira toda segunda-feira à meia-noite de Brasília, e a primeira é a de 28/09/2026', () => {
  assert.equal(INICIO, Date.UTC(2026, 8, 28, 3), '00:00 em Brasília (UTC−3) = 03:00 UTC');
  assert.equal(new Date(INICIO).getUTCDay(), 1, 'é uma segunda-feira');
  assert.equal(indiceDaSemana(INICIO), 0);
  assert.equal(indiceDaSemana(INICIO + SEMANA_MS - 1), 0, 'domingo à noite ainda é a mesma semana');
  assert.equal(indiceDaSemana(INICIO + SEMANA_MS), 1);
  assert.equal(idDaSemana(INICIO), '2026-S00');
  assert.equal(fimDaSemana(INICIO + 3 * H), INICIO + SEMANA_MS);
});

test('antes de 28/09 não há chefe: só o aviso do primeiro', () => {
  const antes = INICIO - 1;                                   // 2026-09-28 02:59:59 UTC = domingo 23:59:59 em Brasília
  assert.equal(jaComecou(antes), false);
  assert.equal(eventoDaSemana(antes), null);
  assert.equal(eventoDaGen(8, antes), null);
  assert.equal(jaComecou(INICIO), true, 'a meia-noite de Brasília o evento já vale');
  const s = situacaoDoEvento({ dificuldade: 'roguelike', gen: 8 }, antes, 0);
  assert.equal(s.ok, false); assert.equal(s.motivo, 'em-breve'); assert.equal(s.evento.id, 'eternatus-eternamax'); assert.equal(s.inicio, INICIO);
  assert.equal(situacaoDoEvento({ dificuldade: 'roguelike', gen: 1 }, antes, 0).motivo, 'sem-evento', 'só a Gen do primeiro chefe mostra o aviso');
  assert.equal(situacaoDoEvento({ dificuldade: 'easy', gen: 8 }, antes, 0).motivo, 'modo');
});

test('cada evento é completo: forma da PokéAPI, golpes, espécie que ganha, badge com título, prêmio e regras do chefe', async () => {
  const { CHEFES } = await import('../js/boss.js');
  const ids = EVENTOS.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length, 'id repetido');
  for (const e of EVENTOS) {
    assert.ok(e.gen >= 1 && e.gen <= GENS.length, `${e.id}: Gen`);
    assert.ok(e.forma && e.formaId > 0 && e.especie && e.especieId > 0, `${e.id}: forma/espécie`);
    assert.ok(e.golpes?.length >= 3, `${e.id}: golpes`);
    assert.ok(e.badge?.nome && e.badge.titulo && e.badge.icone, `${e.id}: badge`);
    assert.ok(e.recompensa && (e.recompensa.dinheiro || Object.keys(e.recompensa.itens || {}).length), `${e.id}: prêmio`);
    assert.ok(CHEFES[e.chefe], `${e.id}: sem regras em boss.CHEFES`);
  }
  const eterno = EVENTOS.find(e => e.id === 'eternatus-eternamax'), ray = EVENTOS.find(e => e.id === 'rayquaza-mega');
  assert.deepEqual([eterno.gen, eterno.formaId, eterno.especieId], [8, 10190, 890]);
  assert.deepEqual([ray.gen, ray.formaId, ray.especieId], [3, 10079, 384]);
});

test('são 14 chefes, na ordem da lista, e a cada segunda entra o próximo (depois do 14º a lista recomeça)', () => {
  const ordem = ['eternatus-eternamax', 'rayquaza-mega', 'groudon-primal', 'kyogre-primal', 'mewtwo-mega-y', 'necrozma-ultra', 'calyrex-shadow',
    'zacian-crowned', 'kyurem-black', 'giratina-origin', 'dialga-origin', 'terapagos-stellar', 'ursaluna-bloodmoon', 'zygarde-complete'];
  assert.deepEqual(EVENTOS.map(e => e.id), ordem);
  ordem.forEach((id, i) => assert.equal(eventoDaSemana(INICIO + i * SEMANA_MS).id, id, `semana ${i}`));
  assert.equal(eventoDaSemana(INICIO + 14 * SEMANA_MS).id, 'eternatus-eternamax', 'a lista gira');
  assert.equal(eventoDoIndice(EVENTOS.length).id, EVENTOS[0].id);
});

test('os prêmios trazem itens de raide que existem, e cada chefe tem forma e espécie próprias', () => {
  const formas = new Set(), especiesVistas = [];
  EVENTOS.forEach((e, i) => {
    for (const k of Object.keys(e.recompensa.itens)) assert.ok(ITEMS[k], `${e.id}: item "${k}" não existe`);
    assert.ok(Object.keys(e.recompensa.itens).some(k => ITEMS[k].raide), `${e.id}: sem item de raide no prêmio`);
    assert.equal(e.badge.vantagem.dinheiro, 2000);
    formas.add(e.formaId); especiesVistas.push(e.especie);
  });
  assert.equal(formas.size, EVENTOS.length, 'formaId repetido');
  assert.equal(new Set(especiesVistas).size, EVENTOS.length, 'espécie repetida (o prêmio desbloquearia a mesma duas vezes)');
  // os três itens de raide se revezam entre os chefes
  const dosPremios = new Set(EVENTOS.flatMap(e => Object.keys(e.recompensa.itens)).filter(k => ITEMS[k].raide));
  assert.deepEqual([...dosPremios].sort(), ['cristal-de-ruptura', 'escudo-astral', 'selo-de-interrupcao']);
});

test('a agenda mostra os próximos 3 chefes, com as datas no horário de Brasília', () => {
  // antes do início: a agenda começa na semana 0 e nada é "atual"
  const antes = agenda(INICIO - 5 * 24 * H, 3);
  assert.deepEqual(antes.map(a => a.evento.id), ['eternatus-eternamax', 'rayquaza-mega', 'groudon-primal']);
  assert.ok(antes.every(a => !a.atual));
  assert.equal(dataBR(antes[0].inicio), '28/09');
  assert.equal(dataBR(antes[1].inicio), '05/10');
  assert.equal(dataBR(antes[2].inicio), '12/10');
  assert.equal(dataBR(antes[0].fim - 1), '04/10', 'a semana termina no domingo');
  // durante o evento: a primeira linha é a semana em curso
  const durante = agenda(INICIO + SEMANA_MS + 2 * H, 3);
  assert.equal(durante[0].evento.id, 'rayquaza-mega'); assert.equal(durante[0].atual, true);
  assert.equal(durante[1].atual, false);
  assert.equal(durante.length, 3);
});

test('só aparece na Gen do chefe da semana, e só no Roguelike e no Hardcore', () => {
  assert.equal(eventoDaGen(8, INICIO)?.id, 'eternatus-eternamax');
  assert.equal(eventoDaGen(3, INICIO), null);
  assert.equal(eventoDaGen(3, INICIO + SEMANA_MS)?.id, 'rayquaza-mega');
  assert.equal(eventoDaGen(3, INICIO + 2 * SEMANA_MS)?.id, 'groudon-primal', 'a Gen 3 tem três chefes, um por semana');
  assert.equal(eventoDaGen(8, INICIO + SEMANA_MS), null);
  assert.deepEqual(Object.keys(DIFICULDADES).filter(modoComEvento).sort(), ['hardcore', 'roguelike']);
  assert.equal(situacaoDoEvento({ dificuldade: 'roguelike', gen: 8 }, INICIO, 0).ok, true);
  assert.equal(situacaoDoEvento({ dificuldade: 'hardcore', gen: 8 }, INICIO, 0).ok, true);
  assert.equal(situacaoDoEvento({ dificuldade: 'easy', gen: 8 }, INICIO, 0).motivo, 'modo');
  assert.equal(situacaoDoEvento({ dificuldade: 'hard', gen: 8 }, INICIO, 0).motivo, 'modo');
  assert.equal(situacaoDoEvento({ dificuldade: 'roguelike', gen: 1 }, INICIO, 0).motivo, 'sem-evento');
});

test('uma tentativa a cada 8 horas', () => {
  const agora = INICIO + 10 * H;
  assert.equal(COOLDOWN_MS, 8 * H);
  assert.equal(esperaRestante(0, agora), 0, 'nunca tentou');
  assert.equal(esperaRestante(agora - 1 * H, agora), 7 * H);
  assert.equal(esperaRestante(agora - 8 * H, agora), 0, 'no instante exato já pode');
  const s = situacaoDoEvento({ dificuldade: 'roguelike', gen: 8 }, agora, agora - 1 * H);
  assert.equal(s.ok, false); assert.equal(s.motivo, 'espera'); assert.equal(s.esperaMs, 7 * H);
  assert.equal(situacaoDoEvento({ dificuldade: 'roguelike', gen: 8 }, agora, agora - 9 * H).ok, true);
});

test('o tempo de espera aparece por extenso', () => {
  assert.equal(formatarEspera((3 * 60 + 12) * 60000), '3h 12min');
  assert.equal(formatarEspera(45 * 60000), '45min');
  assert.equal(formatarEspera(2 * H), '2h');
  assert.equal(formatarEspera(1), '1min', 'arredonda pra cima: nunca mostra 0min esperando');
});
