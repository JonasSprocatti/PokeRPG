// Ajustes: escolha de fonte (js/ajustes.js). Sem DOM: aplicarFonte só devolve a fonte quando não há document.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FONTES, fonteDe, fonteEscolhida, urlDaFonte, aplicarFonte, FONTE_KEY } from '../js/ajustes.js';

test('lista de fontes: ids únicos, pilha com fonte do sistema no fim e famílias pro Google Fonts', () => {
  const ids = FONTES.map(f => f.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids[0], 'padrao');
  for (const f of FONTES) {
    assert.ok(f.nome && f.desc, f.id);
    assert.ok(f.familias.length, `${f.id}: sem família`);
    // nome de família do Google Fonts pode ter DÍGITO: "Baloo 2" vira "Baloo+2"
    for (const fam of f.familias) assert.match(fam, /^[A-Za-z\d+]+(:wght@[\d;]+)?$/, `${f.id}: família "${fam}"`);
    // sempre termina numa fonte que existe no aparelho, pra nunca ficar ilegível sem internet
    assert.match(f.display, /(system-ui|monospace)/, `${f.id}: display sem reserva`);
    assert.match(f.corpo, /(system-ui|monospace)/, `${f.id}: corpo sem reserva`);
  }
});

/* 👾 A Pixelify Sans tinha saído do jogo por confundir 2, 5 e 8. Ela só pôde voltar porque `--titulo`
   (css/estilo.css) a prende em h1/h2/h3 — nome de Pokémon, de rota e de tela —, e NÚMERO nenhum passa por lá:
   o nível, o HP, o dano e o ₽ saem de `--display`. Se alguém puser uma pixelada no `display` de uma fonte, ou
   tirar o fallback do CSS, a regra do projeto cai calada e os dígitos voltam a ser ambíguos em jogo. */
test('fonte pixelada só pode estar no TÍTULO, nunca onde sai número', () => {
  const CSS = readFileSync(new URL('../css/estilo.css', import.meta.url), 'utf8');
  const pixeladas = /Pixelify|Press Start|Silkscreen|VT323|Jersey|Micro 5/;
  for (const f of FONTES) {
    assert.doesNotMatch(f.display, pixeladas, `${f.id}: fonte pixelada no --display (sai em HP, dano e ₽)`);
    assert.doesNotMatch(f.corpo, pixeladas, `${f.id}: fonte pixelada no --body`);
  }
  const pixel = fonteDe('pixel');
  assert.match(pixel.titulo, /Pixelify/, 'a Pixelada perdeu o título pixelado — vira só mais uma monoespaçada');
  // o fallback é o que mantém as outras doze idênticas: sem ele, fonte sem `titulo` ficaria sem família nenhuma
  assert.match(CSS, /var\(--titulo,\s*var\(--display\)\)/, 'o CSS precisa cair no --display quando não há --titulo');
  // e a família tem de ser pedida ao Google, senão o título cai no system-ui e a opção não faz nada
  assert.match(urlDaFonte(pixel), /Pixelify\+Sans/);
});

test('fonteDe: id desconhecido cai no padrão; url junta as famílias', () => {
  assert.equal(fonteDe('nao-existe').id, 'padrao');
  assert.equal(fonteDe('lexend').id, 'lexend');
  assert.equal(fonteEscolhida().id, 'padrao');            // sem localStorage (Node) = padrão
  assert.equal(urlDaFonte(fonteDe('lexend')), 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap');
  assert.ok(urlDaFonte(fonteDe('padrao')).includes('family=Atkinson+Hyperlegible:wght@400;700&family=Fredoka'));
  assert.equal(FONTE_KEY, 'pokerpg-fonte');
  assert.equal(aplicarFonte('andika').id, 'andika');       // sem DOM: só devolve a escolhida
});
