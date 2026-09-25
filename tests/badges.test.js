// Badges da conta (js/badges.js): conquistas de longo prazo que pagam vantagem na próxima jornada.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BADGES, badgesDaConta, contextoBadges, vantagensDe, ALVO_TIPO, ALVO_AMIGOS } from '../js/badges.js';
import { ALVOS, MARCOS_ABATES } from '../js/conquistas.js';
import { ITEMS, TYPE_PT } from '../js/dados.js';

const ctxVazio = () => contextoBadges({ abates: { total: 0, tipoAlvo: {}, especie: {}, golpe: {}, elemento: {} }, progresso: null, dex: null, conquistas: null });
const acha = (lista, id) => lista.find(b => b.id === id);

test('toda badge tem nome, descrição, grupo e uma recompensa de verdade', () => {
  const ids = BADGES.map(b => b.id);
  assert.equal(new Set(ids).size, ids.length, 'id repetido');
  for (const b of BADGES) {
    assert.ok(b.nome?.length > 3 && b.desc?.length > 10 && b.grupo && b.icone, `${b.id}: faltando texto`);
    const r = b.recompensa || {};
    assert.ok(Object.keys(r.itens || {}).length || r.dinheiro || r.lojaGratis, `${b.id}: não dá nada`);
    for (const k of Object.keys(r.itens || {})) assert.ok(ITEMS[k], `${b.id}: item "${k}" não existe`);
  }
});

test('nada está conquistado numa conta zerada', () => {
  const lista = badgesDaConta(ctxVazio());
  assert.equal(lista.some(b => b.completo), false);
  assert.deepEqual(vantagensDe(lista), { itens: {}, dinheiro: 0, lojaGratis: false, titulos: [] });
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
  // o exemplo que o usuário deu: 1.000 do tipo Planta começa com a Pedra da Folha
  const planta = BADGES.find(x => x.id === 'tipo-grass');
  assert.equal(Object.keys(planta.recompensa.itens)[0], 'leaf-stone');
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
