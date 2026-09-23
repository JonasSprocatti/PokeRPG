// O servidor recalcula a pontuação (validar_jornada em supabase/migrations/). Se os pesos/multiplicadores/limites
// do jogo mudarem e o SQL não, jornadas legítimas passam a ser recusadas ou pontuadas diferente — este teste pega.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PESOS_PONTOS, multContinuacao } from '../js/regras.js';
import { DIFICULDADES, ZONES, MISSOES } from '../js/dados.js';
import { TOTAL_GENS } from '../js/mapas.js';

// o schema mora em supabase/migrations/ (uma migration por mudança): o estado atual é a soma de todas
const DIR = new URL('../supabase/migrations/', import.meta.url);
const sql = readdirSync(DIR).filter(f => f.endsWith('.sql')).sort().map(f => readFileSync(new URL(f, DIR), 'utf8')).join('\n');
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

test('a penalidade de continuar a jornada existe no SQL, igual à do jogo (regras.multContinuacao)', () => {
  // o servidor recalcula a pontuação e RECUSA a jornada se o número não bater: se a fórmula mudar num lado só,
  // ninguém consegue mais enviar jornada continuada pro ranking.
  assert.match(sql, /penal numeric := greatest\(0\.5, power\(0\.8, coalesce\(\(r->>'continuacoes'\)::int, 0\)\)\)/);
  assert.match(sql, /\* mult \* penal\)/);
  assert.equal(multContinuacao(1), 0.8);
  assert.equal(multContinuacao(3), 0.8 ** 3);
  // e o bônus de jogar sem as vantagens das badges (regras.BONUS_SEM_VANTAGENS)
  assert.match(sql, /bonus numeric := case when coalesce\(\(r->>'semVantagens'\)::boolean, false\) then 1\.1 else 1 end/);
  assert.match(sql, /\* mult \* penal \* bonus\)/);
});
