/* ⚔ Saga — as 8 perícias (recarga em turnos) e o Brecha/Ruína.
   Tudo aqui é regra PURA: a tabela (`js/pericias.js`) e as contas (`regras.abrirBrecha`/`multSaga`/`passarSaga`).
   A execução (narração, cura, degraus) mora em `batalha.usarPericia` e usa o que já existe. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERICIAS, periciasDoOficio, periciasDe, recargaDe, periciaPronta, temPericiaPronta, marcarRecarga, passarRecargas
} from '../js/pericias.js';
import { OFICIOS } from '../js/oficios.js';
import {
  GUARDA, RUINA_TURNOS, MULT_RUINA, MULT_MURALHA, MULT_MARCA, BRECHA_SUPER, BRECHA_CRITICO, BRECHA_STATUS, BRECHA_SELO,
  guardaInicial, temGuarda, emRuina, abrirBrecha, multSaga, passarSaga, ameacaDe, chanceAcerto, freshVol
} from '../js/regras.js';
import { DIFICULDADES } from '../js/dados.js';

const mon = (extra = {}) => ({ hp: 100, stats: { hp: 100 }, vol: freshVol(), ...extra });

test('são 8 perícias, uma tabela por ofício, e a lista bate com oficios.js', () => {
  assert.equal(Object.keys(PERICIAS).length, 8);
  // nenhuma perícia órfã: todo `oficio` citado existe de verdade
  for (const [id, p] of Object.entries(PERICIAS)) {
    assert.ok(OFICIOS[p.oficio], `${id} aponta pro ofício inexistente "${p.oficio}"`);
    assert.ok(p.nome && p.desc && p.icone, `${id} sem nome/descrição/ícone`);
    assert.ok(p.recarga >= 2 && p.recarga <= 5, `${id}: recarga fora da faixa do desenho`);
  }
  // os dois lados dizem a mesma coisa: `OFICIOS[k].pericias` x o que `periciasDoOficio` deriva da tabela
  for (const [k, o] of Object.entries(OFICIOS)) assert.deepEqual(periciasDoOficio(k), o.pericias, `perícias de ${k}`);
  // todo ofício tem ao menos uma: comitiva de quatro em que um não tem feito nenhum não faz sentido
  for (const k of Object.keys(OFICIOS)) assert.ok(periciasDoOficio(k).length >= 1, `${k} sem perícia`);
});

test('só o ofício do Pokémon dá perícia — e perícia de outro ofício nunca fica pronta', () => {
  const guardiao = mon({ oficio: 'guardiao' });
  assert.deepEqual(periciasDe(guardiao), ['brado', 'muralha']);
  assert.equal(periciaPronta(guardiao, 'brado'), true);
  assert.equal(periciaPronta(guardiao, 'balsamo'), false, 'Bálsamo é do Curandeiro');
  assert.equal(periciaPronta(guardiao, 'inventada'), false);
  // sem ofício (save antigo, espécie sem stats na API): nenhuma perícia, nada quebra
  assert.deepEqual(periciasDe(mon()), []);
  assert.equal(temPericiaPronta(mon()), false);
});

test('recarga: marcar põe os turnos do desenho, cada rodada tira um, e zero sai do vol', () => {
  const m = mon({ oficio: 'curandeiro' });
  marcarRecarga(m, 'balsamo');
  assert.equal(recargaDe(m, 'balsamo'), PERICIAS.balsamo.recarga);
  assert.equal(periciaPronta(m, 'balsamo'), false);
  assert.equal(temPericiaPronta(m), true, 'Purificar continua pronta');
  for (let i = 0; i < PERICIAS.balsamo.recarga; i++) passarRecargas(m);
  assert.equal(recargaDe(m, 'balsamo'), 0);
  assert.equal(periciaPronta(m, 'balsamo'), true);
  assert.deepEqual(m.vol.cd, {}, 'recarga zerada sai do objeto, pra vol não inflar');
  // marcar perícia que não é dele não escreve nada
  marcarRecarga(m, 'brado');
  assert.equal(recargaDe(m, 'brado'), PERICIAS.brado.recarga, 'marcar é mecânico; quem filtra é periciaPronta');
});

test('Guarda: selvagem 3, Alfa 6, chefe 10 — e sem guardaMax nada disso existe', () => {
  assert.equal(guardaInicial({}), GUARDA.selvagem);
  assert.equal(guardaInicial({ alfa: true }), GUARDA.alfa);
  assert.equal(guardaInicial({ chefe: true }), GUARDA.chefe);
  assert.equal(guardaInicial({ chefe: true, alfa: true }), GUARDA.chefe, 'chefe manda');
  const semGuarda = mon();
  assert.equal(temGuarda(semGuarda), false);
  assert.equal(abrirBrecha(semGuarda, 2), null, 'quem não tem Guarda não ruí');
  assert.equal(multSaga(mon(), semGuarda), 1, 'fora da Saga o dano é exatamente o de antes');
});

test('Brecha: super efetivo tira 1, crítico tira 1, status tira meia — zerar põe em Ruína', () => {
  const E = mon({ vol: { ...freshVol(), guardaMax: GUARDA.selvagem, guarda: GUARDA.selvagem } });
  let r = abrirBrecha(E, BRECHA_SUPER);
  assert.deepEqual([r.agora, r.ruiu], [2, false]);
  r = abrirBrecha(E, BRECHA_STATUS);
  assert.deepEqual([r.agora, r.ruiu], [1.5, false], 'status abre meia Brecha');
  r = abrirBrecha(E, BRECHA_CRITICO);
  assert.deepEqual([r.agora, r.ruiu], [0.5, false]);
  r = abrirBrecha(E, BRECHA_STATUS);
  assert.equal(r.ruiu, true);
  assert.equal(emRuina(E), true);
  assert.equal(E.vol.ruina, RUINA_TURNOS);
  // em Ruína não se abre Brecha de novo (senão a Ruína se renovaria pra sempre)
  assert.equal(abrirBrecha(E, 5), null);
  // e o Selo Arcano (+2) derruba uma Guarda de selvagem com um golpe super efetivo só
  const F = mon({ vol: { ...freshVol(), guardaMax: GUARDA.selvagem, guarda: GUARDA.selvagem } });
  assert.equal(abrirBrecha(F, BRECHA_SUPER + BRECHA_SELO).ruiu, true);
});

test('Ruir apaga os degraus POSITIVOS do inimigo e não mexe nos negativos', () => {
  const E = mon({ vol: { ...freshVol(), guardaMax: 1, guarda: 1 } });
  E.vol.stages.attack = 2; E.vol.stages.speed = -1;
  abrirBrecha(E, 1);
  assert.equal(E.vol.stages.attack, 0, 'o Swords Dance dele vai pro chão junto com a guarda');
  assert.equal(E.vol.stages.speed, -1, 'o que você derrubou continua derrubado');
});

test('multSaga: Ruína +50%, Muralha −50%, Marca +25% — e os três multiplicam entre si', () => {
  const u = mon();
  const alvo = extra => mon({ vol: { ...freshVol(), ...extra } });
  assert.equal(multSaga(u, alvo({ ruina: 1 })), MULT_RUINA);
  assert.equal(multSaga(u, alvo({ muralha: 1 })), MULT_MURALHA);
  assert.equal(multSaga(u, alvo({ marca: 2 })), MULT_MARCA);
  assert.equal(multSaga(u, alvo({ ruina: 1, marca: 2 })), MULT_RUINA * MULT_MARCA);
  // Marca que já expirou (contador em 0) não vale mais
  assert.equal(multSaga(u, alvo({ marca: 0 })), 1);
});

test('passarSaga: Ruína acaba devolvendo a Guarda cheia; Marca e Brado perdem um turno por rodada', () => {
  const E = mon({ vol: { ...freshVol(), guardaMax: 3, guarda: 3 } });
  abrirBrecha(E, 3);
  assert.equal(emRuina(E), true);
  passarSaga(E);
  assert.equal(emRuina(E), true, 'a primeira rodada que a Ruína come é o resto da rodada em que caiu');
  passarSaga(E);
  assert.equal(emRuina(E), false);
  assert.equal(E.vol.guarda, 3, 'quebrou, aproveitou, e o escudo volta cheio');
  assert.equal(E.vol.ruina, undefined);

  const M = mon({ vol: { ...freshVol(), marca: 2, provocou: 3, provocouTurnos: 2 } });
  passarSaga(M);
  assert.deepEqual([M.vol.marca, M.vol.provocou], [1, 3]);
  passarSaga(M);
  assert.deepEqual([M.vol.marca, M.vol.provocou], [undefined, undefined]);
  passarSaga(mon());   // vol limpo: não quebra e não inventa campo
});

test('🛡 Brado de Ferro triplica a ameaça (vol.provocou é lido por ameacaDe)', () => {
  const g = mon({ oficio: 'guardiao', stats: { hp: 200 } });
  const base = ameacaDe(g);
  g.vol.provocou = 3;
  assert.equal(ameacaDe(g), base * 3);
});

test('⚔ Estocada: o próximo golpe não erra (chanceAcerto devolve 1)', () => {
  const golpe = { name: 'focus-blast', acc: 70, cls: 'special' };
  const u = mon(), t = mon();
  assert.ok(chanceAcerto(golpe, u, t) < 1, 'sem a perícia, 70% continua 70%');
  u.vol.estocada = 1;
  assert.equal(chanceAcerto(golpe, u, t), 1);
});

test('a Saga é o único modo com a flag jrpg, e nenhum outro modo encosta nestas regras', () => {
  assert.deepEqual(Object.keys(DIFICULDADES).filter(k => DIFICULDADES[k].jrpg), ['saga']);
});
