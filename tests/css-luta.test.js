/* 🎨 Guardas do CSS da luta e do dock de ações.
   CSS não tem teste de unidade, mas dois tipos de erro já aconteceram e voltam calados:

   1. VAZAR PRA SAGA. A luta da Saga (`.game.luta`) tem desenho próprio e afinado; as regras novas de cena em grupo
      (`.compacta`, `.denso`, `.cena-alta`) existem pra OUTROS modos. Elas ganham em especificidade de qualquer
      regra `.game.luta ...` — se uma sair sem o prefixo `body.em-batalha` (a classe que só existe fora da Saga),
      ela reescreve a cena da Saga sem que nenhum teste de lógica note.
   2. VENCER A REGRA DO CELULAR DEITADO. `.cena-alta` solta a cena do topo (retrato); no celular deitado a cena é
      FIXA na lateral. Sem o `position:fixed` de volta no bloco da paisagem, a cena sumia da tela (foi o 1º erro
      que o navegador mostrou nesta revisão: a cena caía em y=1422).
   Ler o arquivo e conferir o seletor é grosseiro de propósito: o que se guarda é a CONVENÇÃO, não o resultado. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../css/estilo.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// cada regra de uma linha ou várias: "seletor{...}" — sem aninhar (o arquivo só aninha em @media/@container)
const seletores = [...css.matchAll(/([^{}@]+)\{[^{}]*\}/g)].map(m => m[1].trim()).flatMap(l => l.split(',').map(x => x.trim()));

test('regras de cena em grupo e de cena alta só valem fora da Saga (prefixo body.em-batalha)', () => {
  const dessas = seletores.filter(s => /\.(compacta|denso|cena-alta)\b/.test(s));
  assert.ok(dessas.length > 10, 'achou as regras de cena em grupo');
  for (const s of dessas) assert.ok(s.startsWith('body.em-batalha '), `"${s}" vazaria pra Saga (falta body.em-batalha)`);
});

test('cena alta: a paisagem devolve o position:fixed (a cena é lateral, nunca solta)', () => {
  assert.match(css, /body\.em-batalha \.scene\.battle\.cena-alta\{position:fixed\}/);
});

test('o dock de ações é só de fora da luta e fora da Saga', () => {
  const dock = seletores.filter(s => /\.game:not\(\.cheia\) #actions/.test(s));
  assert.ok(dock.length >= 3, 'as regras do dock estão escopadas por .game:not(.cheia)');
  for (const s of dock) assert.ok(s.startsWith('body:not(.em-batalha) '), `"${s}" prenderia os golpes da luta`);
});
