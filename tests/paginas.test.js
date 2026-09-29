/* Páginas estáticas do site (sobre, guia, privacidade, termos, contato + sitemap.xml).
   Elas são GERADAS por ferramentas/gerar-paginas.mjs a partir de js/site.js, js/texto-privacidade.js e
   ferramentas/conteudo-site.mjs. O risco é sempre o mesmo: mexer no texto-fonte e esquecer de rodar o gerador,
   deixando publicada uma política de privacidade diferente da que aparece dentro do jogo. Ninguém percebe isso
   olhando o site — só quem revisa, e aí já virou reprovação.
   Rodar o gerador: `node ferramentas/gerar-paginas.mjs` */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PAGINAS, EMAIL_CONTATO, URL_SITE, AVISO_MARCA } from '../js/site.js';
import { TEXTO_PRIVACIDADE } from '../js/texto-privacidade.js';
import { pagina } from '../ferramentas/gerar-paginas.mjs';

const raiz = new URL('../', import.meta.url);
const ler = f => readFileSync(new URL(f, raiz), 'utf8');

test('o .html publicado é igual ao que o gerador produz hoje', () => {
  for (const p of PAGINAS)
    assert.equal(ler(`${p.slug}.html`), pagina(p),
      `${p.slug}.html está desatualizado — rode: node ferramentas/gerar-paginas.mjs`);
});

test('toda página do rodapé existe de verdade (link quebrado no rodapé aparece em TODAS as páginas)', () => {
  for (const p of PAGINAS) assert.doesNotThrow(() => ler(`${p.slug}.html`), `${p.slug}.html não existe`);
  // os links do rodapé são relativos e apontam pra <slug>.html — conferir que não sobrou nenhum outro destino
  const html = ler('privacidade.html');
  const rodape = html.slice(html.indexOf('<footer'));
  for (const [, destino] of rodape.matchAll(/href="(?!https?:|mailto:|\.\/)([^"]+)"/g))
    assert.ok(PAGINAS.some(p => `${p.slug}.html` === destino), `rodapé aponta pra "${destino}", que não é página conhecida`);
});

test('o sitemap lista a raiz e todas as páginas, com endereço absoluto', () => {
  const xml = ler('sitemap.xml');
  assert.match(xml, new RegExp(`<loc>${URL_SITE}/</loc>`), 'a raiz (o jogo) precisa estar no sitemap');
  for (const p of PAGINAS.filter(p => !p.noSitemap))
    assert.match(xml, new RegExp(`<loc>${URL_SITE}/${p.slug}\\.html</loc>`), `${p.slug} fora do sitemap`);
  assert.ok(!/<loc>(?!https?:)/.test(xml), 'sitemap exige endereço absoluto');
});

test('o robots.txt aponta pro sitemap certo e não bloqueia o site', () => {
  const t = ler('robots.txt');
  assert.match(t, new RegExp(`Sitemap: ${URL_SITE}/sitemap\\.xml`));
  assert.ok(!/^\s*Disallow:\s*\/\s*$/m.test(t), 'Disallow: / esconderia o site inteiro dos buscadores');
});

/* O que a revisão do AdSense procura em toda página: um jeito de falar com quem mantém o site e o aviso de que
   as marcas são de terceiros. Os dois saem do rodapé, então basta um sumir pra sumir de todas as páginas. */
test('toda página tem contato e aviso de marca', () => {
  for (const p of PAGINAS) {
    const html = ler(`${p.slug}.html`);
    assert.ok(html.includes(`mailto:${EMAIL_CONTATO}`), `${p.slug}.html sem e-mail de contato`);
    assert.ok(html.includes(AVISO_MARCA), `${p.slug}.html sem o aviso de marca`);
  }
});

test('cada página tem título, descrição e canonical próprios (sem isso o buscador trata como página repetida)', () => {
  const vistos = new Set();
  for (const p of PAGINAS) {
    const html = ler(`${p.slug}.html`);
    assert.ok(p.descricao?.length > 50, `${p.slug}: descricao curta demais em site.js`);
    assert.ok(html.includes(`<meta name="description" content="${p.descricao}">`), `${p.slug}.html sem description`);
    assert.ok(html.includes(`<link rel="canonical" href="${URL_SITE}/${p.slug}.html">`), `${p.slug}.html sem canonical`);
    assert.ok(!vistos.has(p.descricao), `${p.slug}: description repetida de outra página`);
    vistos.add(p.descricao);
  }
});

/* A política tem que ser a MESMA nos dois lugares. A tela do jogo (js/tela-privacidade.js) e a página estática
   leem a mesma constante — este teste garante que a página publicada de fato a contém, e que a tela não voltou
   a ter texto próprio. */
test('a política publicada é a mesma que o jogo mostra', () => {
  assert.ok(ler('privacidade.html').includes(TEXTO_PRIVACIDADE), 'privacidade.html não contém o texto atual');
  const tela = ler('js/tela-privacidade.js');
  assert.match(tela, /TEXTO_PRIVACIDADE/, 'a tela precisa usar a constante, não uma cópia do texto');
  assert.ok(!/Última atualização/.test(tela), 'texto de política dentro da tela: ele mora em js/texto-privacidade.js');
});

test('a política cobre o que o AdSense e a LGPD cobram', () => {
  const t = TEXTO_PRIVACIDADE.replace(/\s+/g, ' '); // o texto é quebrado em várias linhas; a frase exigida não pode depender de onde caiu a quebra
  const exigidos = [
    [/Última atualização/, 'data de atualização'],
    [/policies\.google\.com\/technologies\/partner-sites/, 'link de como a Google usa os dados'],
    [/DoubleClick/, 'menção ao cookie DoubleClick'],
    [/cookies para veicular anúncios com base em visitas anteriores/, 'a frase exigida sobre cookies de terceiros'],
    [/LGPD/, 'direitos pela LGPD'],
    [/GDPR/, 'menção ao GDPR'],
    [/menores de 13 anos/, 'política sobre menores'],
    [new RegExp(EMAIL_CONTATO.replace('.', '\\.')), 'e-mail de contato']
  ];
  for (const [re, oque] of exigidos) assert.match(t, re, `falta na política: ${oque}`);
});
