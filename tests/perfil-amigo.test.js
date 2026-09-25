// Perfil de um amigo (js/perfil-dados.js): as contas que a tela faz com o que vem de `perfil_do_amigo`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numerosDoPerfil, insigniasDoPerfil, rotuloDaRun, desdeQuando } from '../js/perfil-dados.js';
import { EVENTOS } from '../js/evento.js';
import { readFileSync } from 'node:fs';

const perfil = (o = {}) => ({ apelido: 'Kaio', stats: { jornadas: 12, vitorias: 3, gens_fechadas: 2, melhor_pontuacao: 12345, maior_nivel: 88, derrotados: 4200, shinies: 1, especie_favorita: 'charizard' },
  especies_desbloqueadas: 40, eventos: [], ...o });

test('os números do quadro: formatados em pt-BR, com padrão para dado faltando', () => {
  const m = Object.fromEntries(numerosDoPerfil(perfil()));
  assert.equal(m['Jornadas terminadas'], '12');
  assert.equal(m['Vitórias (Gens fechadas)'], '3 (2 Gens)');
  assert.equal(m['Melhor pontuação'], (12345).toLocaleString('pt-BR'));
  assert.equal(m['Espécies desbloqueadas'], '40');
  assert.match(m['Mais jogado'], /harizard/i);
  // conta nova, sem nenhuma jornada
  const vazio = Object.fromEntries(numerosDoPerfil({ stats: { jornadas: 0 } }));
  assert.equal(vazio['Jornadas terminadas'], '0'); assert.equal(vazio['Mais jogado'], '—');
  assert.equal(vazio['Vitórias (Gens fechadas)'], '0');
  assert.doesNotThrow(() => numerosDoPerfil(null));
  assert.equal(numerosDoPerfil(null).length, 8);
});

test('insígnias: aparecem TODAS as de evento e só as vencidas ficam acesas', () => {
  const todas = insigniasDoPerfil([]);
  assert.equal(todas.length, EVENTOS.length);
  assert.ok(todas.every(i => !i.ganha && i.nome && i.titulo && i.icone));
  const ganhas = insigniasDoPerfil(['eternatus-eternamax', 'rayquaza-mega']).filter(i => i.ganha);
  assert.deepEqual(ganhas.map(i => i.id), ['evento-eternatus-eternamax', 'evento-rayquaza-mega']);
  assert.doesNotThrow(() => insigniasDoPerfil(undefined));
  assert.doesNotThrow(() => insigniasDoPerfil(null));
});

test('o resultado da run em uma frase', () => {
  assert.equal(rotuloDaRun({ gen_vencida: '3', motivo: 'venceu' }), '🏆 fechou a Gen 3');
  assert.equal(rotuloDaRun({ gen_vencida: '0', motivo: 'desmaiou' }), 'desmaiou');
  assert.equal(rotuloDaRun({ motivo: 'capturado' }), 'foi capturado');
  assert.equal(rotuloDaRun({ motivo: 'encerrou' }), 'encerrou');
  assert.equal(rotuloDaRun({ motivo: 'venceu' }), '🏆 venceu');
  assert.equal(rotuloDaRun({}), 'terminou');
  assert.equal(rotuloDaRun(null), 'terminou');
});

test('"jogando desde": mês/ano, e vazio se a data não vale', () => {
  assert.equal(desdeQuando('2026-09-20T12:00:00Z'), 'set/2026');
  assert.equal(desdeQuando('2027-01-01T00:00:00Z'), 'jan/2027');
  assert.equal(desdeQuando('lixo'), '');
  assert.equal(desdeQuando(null), '');
});

test('a migração só responde pra amigos (ou pra si) e não devolve dado sensível', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20260925150000_perfil_do_amigo.sql', import.meta.url), 'utf8');
  assert.match(sql, /security definer/i);
  assert.match(sql, /a\.status = 'aceita'/, 'exige amizade aceita');
  assert.match(sql, /p_amigo is distinct from auth\.uid\(\)/, 'o próprio perfil sempre pode');
  assert.match(sql, /raise exception/i, 'recusa quem não é amigo');
  assert.match(sql, /grant execute on function public\.perfil_do_amigo\(uuid\) to authenticated/);
  assert.ok(!/to anon/i.test(sql), 'não vai pra visitante sem conta');
  for (const proibido of ['email', 'codigo_amigo', 'bag', 'money']) assert.ok(!new RegExp(`'${proibido}'`).test(sql), `não devolve ${proibido}`);
});
