// Badges da conta (js/badges.js): conquistas de longo prazo que pagam vantagem na próxima jornada.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BADGES, badgesDaConta, contextoBadges, vantagensDe, medirPorDado, campoDaMedida, MEDIDAS, missoesDeEspecie, especiesLiberadasPorMissao, ALVO_TIPO, ALVO_AMIGOS, ALVO_AMIGOS_MAX, ALVO_OVOS, ALVO_OVOS_LENDA } from '../js/badges.js';
import { ALVOS, MARCOS_ABATES, MODO_NAO_CONTA, registrarDano, somarAbates } from '../js/conquistas.js';
import { ITEMS, TYPE_PT, ESPECIES_MISSAO } from '../js/dados.js';

const ctxVazio = () => contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: {}, golpe: {}, elemento: {} }, progresso: null, dex: null, conquistas: null });
const acha = (lista, id) => lista.find(b => b.id === id);

test('toda badge tem nome, descrição, grupo e uma recompensa de verdade', () => {
  const ids = BADGES.map(b => b.id);
  assert.equal(new Set(ids).size, ids.length, 'id repetido');
  for (const b of BADGES) {
    assert.ok(b.nome?.length > 3 && b.desc?.length > 10 && b.grupo && b.icone, `${b.id}: faltando texto`);
    const r = b.recompensa || {};
    // vantagem de verdade = item, dinheiro, loja grátis, IVs perfeitos ou um ovo (título sozinho não conta: é só texto)
    assert.ok(Object.keys(r.itens || {}).length || r.dinheiro || r.lojaGratis || r.ivsPerfeitos || r.ivsSelvagens || r.ovo, `${b.id}: não dá nada`);
    for (const k of Object.keys(r.itens || {})) assert.ok(ITEMS[k], `${b.id}: item "${k}" não existe`);
  }
});

test('nada está conquistado numa conta zerada', () => {
  const lista = badgesDaConta(ctxVazio());
  assert.equal(lista.some(b => b.completo), false);
  assert.deepEqual(vantagensDe(lista), { itens: {}, dinheiro: 0, lojaGratis: false, ivsPerfeitos: false, ivsSelvagens: false, titulos: [], ovos: [] });
});

/* Os dois ovos de badge (ovos.js) são o mesmo tipo de elo frágil do "Potencial máximo": a recompensa não é item nem
   dinheiro, então nada no caminho até `criacao.iniciarJornada` daria erro se ela deixasse de chegar. */
test('100 e 1000 ovos chocados viram ovo no começo da jornada', () => {
  const ctxOvos = n => contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: {} }, dex: null, conquistas: null,
    progresso: { porJornada: { a: { ovosChocados: n } } } });
  assert.deepEqual(vantagensDe(badgesDaConta(ctxOvos(ALVO_OVOS - 1))).ovos, []);
  assert.deepEqual(vantagensDe(badgesDaConta(ctxOvos(ALVO_OVOS))).ovos, ['pseudo']);
  assert.deepEqual(vantagensDe(badgesDaConta(ctxOvos(ALVO_OVOS_LENDA))).ovos, ['pseudo', 'lendario'], 'quem passou de 1000 ganha os dois ovos');
  // a contagem é a SOMA das jornadas gravadas no progresso permanente, nunca de uma só
  const somadas = contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: {} }, dex: null, conquistas: null,
    progresso: { porJornada: { a: { ovosChocados: 60 }, b: { ovosChocados: 40 } } } });
  assert.equal(acha(badgesDaConta(somadas), 'ovos100').completo, true);
});

/* "Potencial máximo": a única badge que paga uma REGRA (IVs 31 na criação). O teste é o que garante que o dano
   chega até `vantagensDe` — é esse valor que criacao.js lê, e um elo solto no meio não dá erro em lugar nenhum,
   só deixa de dar o prêmio em silêncio. */
test('1 milhão de dano libera IVs perfeitos na próxima jornada', () => {
  const ctxCom = d => contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: {}, dano: d }, progresso: null, dex: null, conquistas: null });
  assert.equal(acha(badgesDaConta(ctxCom(ALVOS.dano - 1)), 'ivs-perfeitos').completo, false);
  assert.equal(vantagensDe(badgesDaConta(ctxCom(ALVOS.dano - 1))).ivsPerfeitos, false);
  const lista = badgesDaConta(ctxCom(ALVOS.dano));
  assert.equal(acha(lista, 'ivs-perfeitos').completo, true);
  assert.equal(vantagensDe(lista).ivsPerfeitos, true);
});

/* A irmã dela, pelo mesmo motivo: a recompensa é uma REGRA (`S.ivsSelvagens`, lido por batalha.novoOponente), então
   o elo solto não dá erro em lugar nenhum — só deixa de valer calado. */
test('500 aliados recrutados liberam IVs 31 em todo selvagem de rota', () => {
  const ctxAmigos = n => contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: {} }, dex: null, conquistas: null,
    progresso: { porJornada: { a: { amigos: n } } } });
  assert.equal(acha(badgesDaConta(ctxAmigos(ALVO_AMIGOS_MAX - 1)), 'ivs-selvagens').completo, false);
  assert.equal(vantagensDe(badgesDaConta(ctxAmigos(ALVO_AMIGOS_MAX - 1))).ivsSelvagens, false);
  const cheio = badgesDaConta(ctxAmigos(ALVO_AMIGOS_MAX));
  assert.equal(acha(cheio, 'ivs-selvagens').completo, true);
  assert.equal(vantagensDe(cheio).ivsSelvagens, true);
});

// o contador só soma o dano SEU, ignora o modo Fácil e nunca aceita número negativo (inimigo curado no meio do turno)
test('registrarDano só conta o que vale', () => {
  const S = {};
  registrarDano(S, 120, 'roguelike');
  registrarDano(S, 80, 'roguelike');
  registrarDano(S, 500, MODO_NAO_CONTA);
  registrarDano(S, -30, 'roguelike');
  assert.equal(S.registro.abates.dano, 200);
  // e a soma entre jornadas chega inteira na conta
  assert.equal(somarAbates([S.registro, { abates: { dano: 50 } }]).dano, 250);
});

test('marcos de caçada acendem na ordem', () => {
  const ctx = contextoBadges({ abates: { total: MARCOS_ABATES[1], tipoAlvo: {}, especie: {} }, progresso: null, dex: null, conquistas: null });
  const lista = badgesDaConta(ctx);
  assert.equal(acha(lista, `caca${MARCOS_ABATES[0]}`).completo, true);
  assert.equal(acha(lista, `caca${MARCOS_ABATES[1]}`).completo, true);
  assert.equal(acha(lista, `caca${MARCOS_ABATES[2]}`).completo, false);
  // e o prêmio do primeiro marco entra na mochila da próxima jornada
  assert.equal(vantagensDe(lista).itens.potion, 3);
});

test('há uma badge por tipo, e cada uma dá um item que existe', () => {
  for (const t of Object.keys(TYPE_PT)) {
    const b = BADGES.find(x => x.id === `tipo-${t}`);
    assert.ok(b, `falta a badge do tipo ${t}`);
    const ctx = contextoBadges({ abates: { total: 0, tipoAlvo: { [t]: ALVO_TIPO }, especie: {} }, progresso: null, dex: null, conquistas: null });
    assert.equal(b.mede(ctx).completo, true);
  }
  // 1.000 do tipo Planta começa com o Prato Campo (Arceus, +20% de dano em Planta)
  const planta = BADGES.find(x => x.id === 'tipo-grass');
  assert.equal(Object.keys(planta.recompensa.itens)[0], 'prato-campo');
});

test('Rayquaza: as duas missões contam SEPARADAS, em qualquer ordem', () => {
  const comShiny = contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: {} }, progresso: null, dex: { rayquazaShiny: 1 }, conquistas: null });
  const comMega = contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: { rayquaza: ALVOS.mega } }, progresso: null, dex: null, conquistas: null });
  const so1 = badgesDaConta(comShiny), so2 = badgesDaConta(comMega);
  assert.equal(acha(so1, 'rayquaza-shiny').completo, true);
  assert.equal(acha(so1, 'rayquaza-mega').completo, false);
  assert.equal(acha(so1, 'rayquaza-lenda').completo, false, 'uma só não fecha o prêmio grande');
  assert.equal(acha(so2, 'rayquaza-mega').completo, true);
  assert.equal(acha(so2, 'rayquaza-shiny').completo, false);
  // com as duas, sai a loja de graça
  const ambas = contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: { rayquaza: ALVOS.mega } }, progresso: null, dex: { rayquazaShiny: 1 }, conquistas: null });
  const lista = badgesDaConta(ambas);
  assert.equal(acha(lista, 'rayquaza-lenda').completo, true);
  assert.equal(vantagensDe(lista).lojaGratis, true);
});

test('parceiros: Casa cheia, Lobo solitário e Cemitério medem UMA jornada, exigem vencer (as duas primeiras) e ignoram o Fácil', () => {
  const ctxDe = porJornada => contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: {} }, progresso: { porJornada }, dex: null, conquistas: null });
  const b = (porJornada, id) => acha(badgesDaConta(ctxDe(porJornada)), id);
  // Casa cheia: venceu com equipe e esconderijo lotados
  assert.equal(b({ a: { dificuldade: 'roguelike', genVencida: 1, casaCheia: true } }, 'casa-cheia').completo, true);
  assert.equal(b({ a: { dificuldade: 'roguelike', genVencida: 1, casaCheia: false } }, 'casa-cheia').completo, false, 'faltou lotar');
  assert.equal(b({ a: { dificuldade: 'roguelike', motivo: 'desmaiou', casaCheia: true } }, 'casa-cheia').completo, false, 'sem vitória não vale');
  assert.equal(b({ a: { dificuldade: 'easy', genVencida: 1, casaCheia: true } }, 'casa-cheia').completo, false, 'Fácil não conta');
  // Lobo solitário: venceu sem recrutar ninguém
  assert.equal(b({ a: { dificuldade: 'hard', genVencida: 1, amigos: 0 } }, 'lobo-solitario').completo, true);
  assert.equal(b({ a: { dificuldade: 'hard', genVencida: 1, amigos: 1 } }, 'lobo-solitario').completo, false, 'um recrutado já quebra');
  assert.equal(b({ a: { dificuldade: 'hard', motivo: 'encerrou', amigos: 0 } }, 'lobo-solitario').completo, false, 'encerrar recém-criada não é vencer');
  assert.equal(b({ a: { dificuldade: 'easy', genVencida: 1, amigos: 0 } }, 'lobo-solitario').completo, false, 'Fácil não conta');
  // Cemitério: 15 perdidos NUMA run — 15 espalhados em várias runs não valem
  assert.equal(b({ a: { dificuldade: 'roguelike', aliadosPerdidos: 15 } }, 'cemiterio').completo, true, 'vale mesmo sem vencer');
  assert.equal(b({ a: { dificuldade: 'roguelike', aliadosPerdidos: 8 }, c: { dificuldade: 'roguelike', aliadosPerdidos: 8 } }, 'cemiterio').completo, false);
  assert.equal(b({ a: { dificuldade: 'roguelike', aliadosPerdidos: 9 } }, 'cemiterio').n, 9, 'mostra o progresso');
  assert.equal(b({ a: { dificuldade: 'easy', aliadosPerdidos: 20 } }, 'cemiterio').completo, false, 'Fácil não conta');
});

test('badge de evento: só acende ao vencer o chefe, e traz o título', () => {
  const ctxDe = eventos => contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: {} }, progresso: { porJornada: {}, eventos }, dex: null, conquistas: null });
  const id = 'evento-eternatus-eternamax';
  assert.equal(acha(badgesDaConta(ctxDe({})), id).completo, false);
  const lista = badgesDaConta(ctxDe({ 'eternatus-eternamax': { primeiraEm: '2026-09-25', semanas: { '2026-S00': true }, vitorias: 1 } }));
  assert.equal(acha(lista, id).completo, true);
  assert.equal(acha(lista, id).grupo, 'Eventos');
  assert.ok(vantagensDe(lista).titulos.includes('Domador do Infinito'));
});

test('badges que leem o progresso permanente (jornadas bancadas)', () => {
  const progresso = { porJornada: {
    a: { dificuldade: 'hardcore', genVencida: 1, amigos: 60, semCentro: false },
    b: { dificuldade: 'roguelike', genVencida: 2, amigos: 50, semCentro: true },
    c: { dificuldade: 'roguelike', genVencida: 2, amigos: 0, semCentro: false }   // mesma Gen: não conta duas vezes
  }, especies: {} };
  const ctx = contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: {} }, progresso, dex: null, conquistas: null });
  assert.equal(ctx.amigos, 110);
  assert.equal(ctx.gensHardcore, 1);
  assert.equal(ctx.gensRoguelike, 1, 'Gens distintas, não jornadas');
  assert.equal(ctx.runsSemCentro, 1);
  const lista = badgesDaConta(ctx);
  assert.equal(acha(lista, 'amigos').completo, true, `${ALVO_AMIGOS} aliados`);
  assert.equal(acha(lista, 'hardcore').completo, true);
  assert.equal(acha(lista, 'sem-centro').completo, true);
  assert.equal(acha(lista, 'roguelike9').completo, false);
});

/* Bug real: bastava entrar numa jornada e sair dela pra ganhar "Nunca precisei de médico" — sem Centro Pokémon,
   afinal, porque não houve tempo de precisar de um. A badge pede VITÓRIA (fechar uma Gen). Como badge não fica
   gravada em lugar nenhum (é recalculada), apertar a regra tira a medalha de quem pegou pelo caminho fácil. */
test('sem-centro exige VENCER, não só terminar a jornada', () => {
  const ctx = p => contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: {} }, progresso: { porJornada: p, especies: {} }, dex: null, conquistas: null });
  const desistiu = ctx({ a: { dificuldade: 'roguelike', semCentro: true, motivo: 'encerrou' } });
  assert.equal(desistiu.runsSemCentro, 0, 'desistir não é vitória');
  assert.equal(acha(badgesDaConta(desistiu), 'sem-centro').completo, false);

  for (const fim of ['desmaiou', 'capturado']) {
    assert.equal(ctx({ a: { dificuldade: 'roguelike', semCentro: true, motivo: fim } }).runsSemCentro, 0, fim);
  }
  // vitória conta pelos dois campos: entrada nova traz `genVencida`, entrada antiga pode ter só o `motivo`
  assert.equal(ctx({ a: { semCentro: true, genVencida: 3 } }).runsSemCentro, 1);
  assert.equal(ctx({ a: { semCentro: true, motivo: 'venceu' } }).runsSemCentro, 1);
  // e usar o Centro continua invalidando, mesmo vencendo
  assert.equal(ctx({ a: { semCentro: false, genVencida: 3 } }).runsSemCentro, 0);
});

test('vantagens somam itens repetidos e nunca contam badge incompleta', () => {
  const lista = [
    { completo: true, recompensa: { itens: { potion: 3 }, dinheiro: 1000 } },
    { completo: true, recompensa: { itens: { potion: 2 }, titulo: 'Lenda' } },
    { completo: false, recompensa: { itens: { revive: 9 }, dinheiro: 99999 } }
  ];
  const v = vantagensDe(lista);
  assert.equal(v.itens.potion, 5);
  assert.equal(v.itens.revive, undefined);
  assert.equal(v.dinheiro, 1000);
  assert.deepEqual(v.titulos, ['Lenda']);
});

/* ---- medida por DADO (badge criada no 🧰 Editor de conteúdo) ----
   Badge de fábrica mede com uma função; a criada pelo editor traz `medida: { campo, alvo }` e lê o MESMO ctx.
   O que este teste guarda é o caso silencioso: campo que não existe tem de valer 0 e não estourar a tela de
   conquistas, que é onde a carreira inteira aparece. */
test('medirPorDado lê o caminho dentro do ctx, e campo que não existe vale 0', () => {
  const c = contextoBadges({
    abates: {
      total: 1234, especie: { pikachu: 3 }, dano: 0,
      tipoAlvo: { ...Object.fromEntries(Object.keys(TYPE_PT).map(t => [t, 0])), fire: 7 }
    },
    progresso: { porJornada: { a: { amigos: 9, ovosChocados: 4 } } }, dex: { conhecidas: 42 }, conquistas: null
  });
  const medir = m => medirPorDado(m)(c);
  assert.deepEqual(medir({ campo: 'abates.total', alvo: 1000 }), { n: 1000, alvo: 1000, completo: true });
  assert.deepEqual(medir({ campo: 'abates.tipoAlvo.fire', alvo: 10 }), { n: 7, alvo: 10, completo: false });
  assert.deepEqual(medir({ campo: 'abates.especie', especie: 'pikachu', alvo: 5 }), { n: 3, alvo: 5, completo: false });
  assert.deepEqual(medir({ campo: 'conhecidas', alvo: 42 }), { n: 42, alvo: 42, completo: true });
  assert.deepEqual(medir({ campo: 'amigos', alvo: 9 }), { n: 9, alvo: 9, completo: true });
  // os três silenciosos: campo inventado, medida ausente e alvo ausente nunca completam de graça
  assert.deepEqual(medir({ campo: 'nao.existe.nada', alvo: 5 }), { n: 0, alvo: 5, completo: false });
  assert.equal(medir(undefined).completo, false);
  assert.equal(medirPorDado({ campo: 'abates.total' })(c).alvo, 1, 'sem alvo o alvo é 1, nunca NaN');
  // toda medida oferecida ao editor existe de verdade no ctx (rótulo sem campo = badge impossível em silêncio)
  for (const [campo, def] of Object.entries(MEDIDAS)) {
    assert.ok(def.rotulo, `${campo} sem rótulo`);
    const caminho = campoDaMedida({ campo, especie: 'pikachu' });
    assert.notEqual(caminho.split('.').reduce((o, k) => (o == null ? o : o[k]), c), undefined, `${campo} não existe no ctx`);
  }
});

/* 🔒 Pokémon de missão (dados.ESPECIES_MISSAO + badges.missoesDeEspecie): a mesma máquina das badges medindo o
   mesmo ctx. O que o teste trava é o que machuca se quebrar: campo que o ctx não conta (missão impossível em
   silêncio) e a regra "só com o alvo batido a espécie entra na lista de liberadas". */
test('toda missão de espécie mede um campo que o contextoBadges conta de verdade', () => {
  for (const [especie, m] of Object.entries(ESPECIES_MISSAO)) {
    assert.ok(m.id > 0 && m.icone && m.nome && m.desc?.length > 20, `${especie}: faltando texto`);
    assert.ok(m.alvo > 0, `${especie}: alvo inválido`);
    // MEDIDAS é a lista do que o ctx conta de verdade (é pra isso que ela existe) — campo fora dela é missão
    // impossível em silêncio, o pior defeito possível numa conquista de carreira
    assert.ok(MEDIDAS[m.campo], `${especie}: campo ${m.campo} não está em MEDIDAS`);
    assert.equal(campoDaMedida(m), m.campo);   // nenhuma missão mede por espécie (não precisaria do sufixo)
  }
  // com a conta zerada nada pode nascer liberado
  assert.deepEqual(especiesLiberadasPorMissao(ctxVazio()), []);
});

test('a espécie de missão só libera com o alvo batido, e o dinheiro é a soma do pico de cada jornada', () => {
  const alvo = ESPECIES_MISSAO.gholdengo.alvo;
  const comDinheiro = total => contextoBadges({
    abates: { total: 0, tipoAlvo: {}, especie: {}, golpe: {}, elemento: {} },
    progresso: { porJornada: { a: { maxDinheiro: total / 2 }, b: { maxDinheiro: total / 2 } } }, dex: null, conquistas: null
  });
  assert.equal(comDinheiro(alvo).dinheiroCarreira, alvo);
  assert.deepEqual(especiesLiberadasPorMissao(comDinheiro(alvo - 2)), []);
  assert.deepEqual(especiesLiberadasPorMissao(comDinheiro(alvo)), ['gholdengo']);
  // a lista inteira continua aparecendo na tela, trancada e com quanto falta
  const m = missoesDeEspecie(comDinheiro(alvo / 2)).find(x => x.especie === 'gholdengo');
  assert.equal(m.completo, false);
  assert.equal(m.fracao, 0.5);
});
