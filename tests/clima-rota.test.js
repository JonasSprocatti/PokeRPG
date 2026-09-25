// Clima e terreno padrão das rotas (regras.CLIMA_DA_ROTA), a permanência deles, Weather Ball e a forma do Castform.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLIMA_DA_ROTA, novoCampo, golpeDoClima, climaDe, terrenoDe, CLIMAS, TERRENOS, CLIMA_TURNOS, TERRENO_TURNOS, calcDamage, freshVol } from '../js/regras.js';
import { mudarClima, passarClima, mudarTerreno, passarTerreno, usarGolpe, ajustarForma, desfazerForma } from '../js/golpe.js';
import { GENS } from '../js/mapas.js';

const golpe = (o = {}) => ({ name: 'tackle', type: 'normal', cls: 'physical', power: 40, acc: 100, pp: 35, ppLeft: 35, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], ...o });
const mon = (o = {}) => ({
  level: 50, ability: 'none', data: { types: ['normal'] }, status: null, sleep: 0,
  stats: { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 100 },
  hp: 100, moves: [golpe()], vol: freshVol(), ...o
});
const ctx = campo => { const msgs = []; return { msgs, campo, nome: m => m.nome || 'X', golpe: g => g.name, say: t => { msgs.push(t); } }; };

test('a tabela de rotas só cita rotas que existem, com clima e terreno válidos', () => {
  const ids = new Set(GENS.flatMap(g => g.rotas.map(r => r.id)));
  for (const [id, p] of Object.entries(CLIMA_DA_ROTA)) {
    assert.ok(ids.has(id), `rota "${id}" não existe em dados-mapas.js`);
    assert.ok(p.clima || p.terreno, `${id}: sem clima nem terreno`);
    if (p.clima) assert.ok(CLIMAS[p.clima], `${id}: clima "${p.clima}"`);
    if (p.terreno) assert.ok(TERRENOS[p.terreno], `${id}: terreno "${p.terreno}"`);
  }
  // Santuário e luta final ficam de fora de propósito
  for (const g of GENS) for (const r of g.rotas) if (r.posVitoria) assert.ok(!CLIMA_DA_ROTA[r.id], `${r.id}: Santuário não tem padrão`);
});

test('a batalha nasce com o clima/terreno da rota, e rota sem padrão nasce limpa', () => {
  const gelo = novoCampo('u-gelada');
  assert.equal(climaDe(gelo), 'neve');
  assert.equal(gelo.climaFixo, true);
  assert.equal(terrenoDe(gelo), null);
  const bosque = novoCampo('floresta');
  assert.equal(terrenoDe(bosque), 'grama');
  assert.equal(climaDe(bosque), null);
  for (const c of [novoCampo('rota1'), novoCampo(undefined), novoCampo('nao-existe')]) {
    assert.equal(climaDe(c), null); assert.equal(terrenoDe(c), null);
  }
});

test('o clima e o terreno da rota são permanentes: passar turno não os gasta', async () => {
  const campo = novoCampo('h-deserto'), c = ctx(campo);
  campo.terreno = 'grama'; campo.terrenoTurnos = TERRENO_TURNOS; campo.terrenoFixo = true;
  for (let i = 0; i < 20; i++) { await passarClima(campo, c); await passarTerreno(campo, c); }
  assert.equal(climaDe(campo), 'areia');
  assert.equal(terrenoDe(campo), 'grama');
  assert.equal(c.msgs.length, 0, 'e nada é narrado');
});

test('um golpe troca o clima da rota por 5 turnos, e depois a rota volta ao dela', async () => {
  const campo = novoCampo('u-gelada'), c = ctx(campo);
  await mudarClima('chuva', c, mon());
  assert.equal(climaDe(campo), 'chuva');
  assert.equal(campo.climaFixo, false);
  for (let i = 1; i < CLIMA_TURNOS; i++) { await passarClima(campo, c); assert.equal(climaDe(campo), 'chuva', `turno ${i}`); }
  await passarClima(campo, c);
  assert.equal(climaDe(campo), 'neve', 'acabou a chuva: volta a neve da rota');
  assert.equal(campo.climaFixo, true);
  for (let i = 0; i < 10; i++) await passarClima(campo, c);
  assert.equal(climaDe(campo), 'neve', 'e de novo permanente');
});

test('ligar o MESMO clima/terreno da rota não o transforma num de 5 turnos', async () => {
  const campo = novoCampo('u-gelada'), c = ctx(campo);
  campo.terreno = 'eletrico'; campo.terrenoTurnos = TERRENO_TURNOS; campo.terrenoFixo = true;
  await mudarClima('neve', c, mon()); await mudarTerreno('eletrico', c, mon());
  assert.equal(campo.climaFixo, true); assert.equal(campo.terrenoFixo, true);
  for (let i = 0; i < 10; i++) { await passarClima(campo, c); await passarTerreno(campo, c); }
  assert.equal(climaDe(campo), 'neve'); assert.equal(terrenoDe(campo), 'eletrico');
});

test('terreno trocado também volta ao da rota', async () => {
  const campo = novoCampo('floresta'), c = ctx(campo);
  await mudarTerreno('psiquico', c, mon());
  assert.equal(terrenoDe(campo), 'psiquico');
  for (let i = 0; i < TERRENO_TURNOS; i++) await passarTerreno(campo, c);
  assert.equal(terrenoDe(campo), 'grama');
  assert.equal(campo.terrenoFixo, true);
});

test('Weather Ball: tipo e poder seguem o tempo; sem tempo é o Normal de 50', () => {
  const bola = golpe({ name: 'weather-ball', power: 50, cls: 'special' });
  const casos = { sol: 'fire', chuva: 'water', areia: 'rock', granizo: 'ice', neve: 'ice' };
  for (const [clima, tipo] of Object.entries(casos)) {
    const g = golpeDoClima(bola, clima);
    assert.equal(g.type, tipo, clima); assert.equal(g.power, 100, clima);
  }
  assert.equal(golpeDoClima(bola, null), bola, 'sem tempo: o mesmo golpe');
  assert.equal(bola.type, 'normal', 'o original não é alterado');
  const outro = golpe();
  assert.equal(golpeDoClima(outro, 'sol'), outro, 'só o Weather Ball muda');
});

test('Weather Ball no dano e na absorção de tipo, pelo motor', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const bola = golpe({ name: 'weather-ball', power: 50, cls: 'special' });
  const normal = calcDamage(mon(), mon(), bola).dmg;
  assert.ok(calcDamage(mon(), mon(), golpeDoClima(bola, 'sol'), 'sol').dmg > normal * 1.8, 'poder ×2 (e o sol reforça o Fogo)');
  // com sol na rota o golpe vira Fogo e o Flash Fire absorve; sem tempo é Normal e machuca
  const semTempo = mon({ ability: 'flash-fire' });
  await usarGolpe(mon(), semTempo, bola, true, ctx(novoCampo('rota1')));
  assert.ok(semTempo.hp < 100);
  const noSol = mon({ ability: 'flash-fire' });
  await usarGolpe(mon(), noSol, { ...bola }, true, ctx(novoCampo('h-chimney')));
  assert.equal(noSol.hp, 100, 'virou Fogo e foi absorvido');
});

test('Castform: a forma (tipos e sprite) acompanha o tempo, sem mexer no objeto do cache', async () => {
  const data = { types: ['normal'], sprite: 'https://x/sprites/pokemon/351.png', back: 'https://x/sprites/pokemon/back/351.png' };
  const cast = mon({ ability: 'forecast', data, nome: 'Castform' });
  const campo = novoCampo('h-chimney'), c = ctx(campo);
  assert.equal(await ajustarForma(cast, c), true);
  assert.deepEqual(cast.data.types, ['fire']);
  assert.ok(cast.data.sprite.includes('/10013.png') && cast.data.back.includes('/back/10013.png'));
  assert.deepEqual(data.types, ['normal'], 'o objeto compartilhado do cache não foi alterado');
  assert.equal(await ajustarForma(cast, c), false, 'mesmo tempo: nada a fazer');

  await mudarClima('chuva', c, mon());
  await ajustarForma(cast, c);
  assert.deepEqual(cast.data.types, ['water']);
  await mudarClima('areia', c, mon());
  await ajustarForma(cast, c);
  assert.deepEqual(cast.data.types, ['normal'], 'areia não tem forma: volta ao normal');
  assert.ok(cast.data.sprite.includes('/351.png'));
  await mudarClima('neve', c, mon());
  await ajustarForma(cast, c);
  assert.deepEqual(cast.data.types, ['ice']);

  assert.equal(cast.formaSprite, 10015, 'o shiny monta o sprite por este id');
  assert.equal(desfazerForma(cast), true);
  assert.equal(cast.formaSprite, undefined);
  assert.deepEqual(cast.data.types, ['normal']);
  assert.equal(desfazerForma(cast), false);
  assert.equal(await ajustarForma(mon(), c), false, 'quem não tem Forecast é ignorado');
});

test('Castform muda de forma dentro do golpe: a forma do tempo vale na conta de tipo', async t => {
  t.mock.method(Math, 'random', () => 0.5);
  const cast = mon({ ability: 'forecast', data: { types: ['normal'] }, nome: 'Castform' });
  const c = ctx(novoCampo('u-gelada'));                      // neve: Castform vira Gelo
  await usarGolpe(mon(), cast, golpe({ type: 'fire', cls: 'special' }), true, c);
  assert.deepEqual(cast.data.types, ['ice']);
  const normal = mon({ data: { types: ['normal'] } });
  await usarGolpe(mon(), normal, golpe({ type: 'fire', cls: 'special' }), true, ctx(novoCampo('u-gelada')));
  assert.ok(cast.hp < normal.hp, 'Fogo é super efetivo no Gelo, e não no Normal');
});
