// O servidor recalcula a pontuação (validar_jornada em supabase/schema.sql). Se os pesos/multiplicadores/limites
// do jogo mudarem e o SQL não, jornadas legítimas passam a ser recusadas ou pontuadas diferente — este teste pega.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PESOS_PONTOS } from '../js/regras.js';
import { DIFICULDADES, ZONES, MISSOES } from '../js/dados.js';
import { TOTAL_GENS } from '../js/mapas.js';

const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const corpo = sql.slice(sql.indexOf('function public.validar_jornada'), sql.indexOf('drop trigger if exists validar_jornada'));

test('multiplicador de cada modo no SQL = multPontos do jogo (e todo modo existe lá)', () => {
  for (const [k, d] of Object.entries(DIFICULDADES)) {
    const m = corpo.match(new RegExp(`when '${k}' then ([\\d.]+)`));
    assert.ok(m, `modo "${k}" não está no validar_jornada`);
    assert.equal(Number(m[1]), d.multPontos, `multiplicador de ${k}`);
  }
});

test('pesos da pontuação no SQL = PESOS_PONTOS', () => {
  assert.match(corpo, new RegExp(`n \\* ${PESOS_PONTOS.nivel}\\b`), 'peso do nível');
  for (const [campo, peso] of Object.entries(PESOS_PONTOS)) {
    if (campo === 'nivel') continue;
    assert.match(corpo, new RegExp(`'${campo}'\\)::int, 0\\) \\* ${peso}\\b`), `peso de ${campo}`);
  }
});

test('limites do SQL acompanham o conteúdo (Alfas e missões que existem)', () => {
  const alfas = Number(corpo.match(/'alfas'\)::int, 0\) > (\d+)/)[1]);
  const missoes = Number(corpo.match(/'missoes'\)::int, 0\) > (\d+)/)[1]);
  const gens = Number(corpo.match(/'gens'\)::int, 0\) > (\d+)/)[1]);
  // Alfas = S.chefes: as rotas com Alfa + a rota final de cada Gen (vencer os lendários também marca)
  assert.equal(alfas, ZONES.filter(z => z.chefe || z.lendarios).length, 'limite de Alfas');
  assert.equal(missoes, MISSOES.length, 'limite de missões');
  assert.equal(gens, TOTAL_GENS, 'limite de Gens vencidas');
});
