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
import { pagina, HOME } from '../ferramentas/gerar-paginas.mjs';

const raiz = new URL('../', import.meta.url);
const ler = f => readFileSync(new URL(f, raiz), 'utf8');
/* A página inicial (index.html) é gerada igual às outras, mas não está em PAGINAS: ela não é item de rodapé,
   e o arquivo dela não segue o `<slug>.html`. Todo teste que varre "as páginas" tem de incluí-la — era a raiz
   do site que estava vazia, e deixá-la fora daqui seria repetir o buraco num lugar novo. */
const TODAS = [HOME, ...PAGINAS];
const arquivoDe = p => p.arquivo || `${p.slug}.html`;

test('o .html publicado é igual ao que o gerador produz hoje', () => {
  for (const p of TODAS)
    assert.equal(ler(arquivoDe(p)), pagina(p),
      `${arquivoDe(p)} está desatualizado — rode: node ferramentas/gerar-paginas.mjs`);
});

/* O jogo saiu da raiz em 11/10/2026 (index.html virou a apresentação). Dois caminhos não podem sumir junto: o
   link de convite do multiplayer, que é `URL_SITE/?sala=XXXX` e continua caindo na raiz, e o próprio jogo. */
test('o jogo está em jogar.html, e a home desvia o convite de sala pra lá', () => {
  assert.match(ler('jogar.html'), /<div id="app"><\/div>/, 'jogar.html não é mais o jogo');
  assert.ok(ler('jogar.html').includes(`<link rel="canonical" href="${URL_SITE}/jogar.html">`),
    'jogar.html precisa de canonical próprio: a raiz agora é outra página');
  const home = ler('index.html');
  assert.match(home, /has\('sala'\)[\s\S]*location\.replace\('jogar\.html'/,
    'a home precisa desviar `?sala=` pro jogo, senão todo convite já enviado quebra');
  assert.ok(home.indexOf('sala') < home.indexOf('css/estilo.css'),
    'o desvio tem de vir antes do CSS e do AdSense — nada mais da página precisa carregar');
});

test('toda página do rodapé existe de verdade (link quebrado no rodapé aparece em TODAS as páginas)', () => {
  for (const p of TODAS) assert.doesNotThrow(() => ler(arquivoDe(p)), `${arquivoDe(p)} não existe`);
  // os links do rodapé são relativos e apontam pra <slug>.html — conferir que não sobrou nenhum outro destino
  const html = ler('privacidade.html');
  const rodape = html.slice(html.indexOf('<footer'));
  for (const [, destino] of rodape.matchAll(/href="(?!https?:|mailto:|\.\/)([^"]+)"/g))
    assert.ok(destino === 'jogar.html' || PAGINAS.some(p => `${p.slug}.html` === destino),
      `rodapé aponta pra "${destino}", que não é página conhecida`);
});

test('o sitemap lista a raiz, o jogo e todas as páginas, com endereço absoluto', () => {
  const xml = ler('sitemap.xml');
  assert.match(xml, new RegExp(`<loc>${URL_SITE}/</loc>`), 'a raiz (a apresentação) precisa estar no sitemap');
  assert.match(xml, new RegExp(`<loc>${URL_SITE}/jogar\\.html</loc>`), 'o jogo precisa estar no sitemap');
  for (const p of PAGINAS.filter(p => !p.noSitemap))
    assert.match(xml, new RegExp(`<loc>${URL_SITE}/${p.slug}\\.html</loc>`), `${p.slug} fora do sitemap`);
  assert.ok(!/<loc>(?!https?:)/.test(xml), 'sitemap exige endereço absoluto');
});

/* O ads.txt é o que prova ao AdSense que o domínio é nosso. O publisher ID dele tem que ser o MESMO de
   js/config.js — divergir não dá erro em lugar nenhum, só faz o anúncio não pagar (o Google ignora inventário
   cujo ads.txt não bate) e é do tipo de coisa que passa meses sem ninguém notar. Enquanto ADSENSE_CLIENT_ID for
   o marcador, só conferimos o formato do arquivo. */
test('o ads.txt está no formato do IAB e bate com o publisher ID do config.js', async () => {
  const linhas = ler('ads.txt').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  assert.ok(linhas.length, 'ads.txt sem nenhuma linha de verdade (só comentário)');
  for (const l of linhas)
    assert.match(l, /^[\w.-]+, *pub-\d+, *(DIRECT|RESELLER)(, *\w+)?$/, `linha fora do formato ads.txt: "${l}"`);

  const { ADSENSE_CLIENT_ID } = await import('../js/config.js');
  if (ADSENSE_CLIENT_ID.includes('XXXX')) return; // conta ainda não ligada: nada a comparar
  const doConfig = ADSENSE_CLIENT_ID.replace(/^ca-/, '');
  assert.ok(linhas.some(l => l.includes(`${doConfig},`)),
    `ads.txt não lista ${doConfig}, que é o ADSENSE_CLIENT_ID de js/config.js`);
});

/* O snippet do AdSense vive em três lugares que precisam concordar: js/config.js (o que o jogo lê), o <head> de
   jogar.html (literal, porque o snippet tem de estar no HTML servido pra revisão do Google achar) e o ads.txt.
   Divergir não dá erro em lugar nenhum: o anúncio só não paga. */
test('o publisher ID é o mesmo em config.js, jogar.html e ads.txt', async () => {
  const { ADSENSE_CLIENT_ID } = await import('../js/config.js');
  if (ADSENSE_CLIENT_ID.includes('XXXX')) return; // AdSense desligado: nada a comparar
  const html = ler('jogar.html');
  assert.ok(html.includes(`adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`),
    'o <head> de jogar.html não traz o snippet com o publisher ID de js/config.js');
  assert.ok(ler('ads.txt').includes(`${ADSENSE_CLIENT_ID.replace(/^ca-/, '')},`),
    'ads.txt não lista o publisher ID de js/config.js');
});

/* Ordem que não pode inverter: js/consent.js é síncrono e põe o consentimento em "denied" (Consent Mode v2). Se
   o script do Google rodar antes dele, o estado chega tarde e o site vira "anúncio personalizado sem
   consentimento" — o problema de GDPR que o consent.js existe pra evitar. */
test('em toda página, o consent.js vem ANTES do script do AdSense', async () => {
  const { ADSENSE_CLIENT_ID } = await import('../js/config.js');
  if (ADSENSE_CLIENT_ID.includes('XXXX')) return;
  for (const f of ['jogar.html', ...TODAS.map(arquivoDe)]) {
    const html = ler(f);
    const consent = html.indexOf('js/consent.js');
    const google = html.indexOf('adsbygoogle.js?client=');
    assert.ok(consent >= 0, `${f} carrega anúncio sem js/consent.js`);
    assert.ok(google >= 0, `${f} sem o snippet do AdSense (a revisão precisa achar o código em todas as páginas)`);
    assert.ok(consent < google, `${f}: o consent.js tem de vir antes do script do Google`);
  }
});

/* Anúncio na página que explica o que se faz com os dados de quem está lendo, não. É também a página que a
   revisão abre com mais atenção. */
test('as páginas legais não recebem slot de anúncio', () => {
  for (const slug of ['privacidade', 'termos', 'contato'])
    assert.ok(!ler(`${slug}.html`).includes('<ins class="adsbygoogle"'), `${slug}.html com slot de anúncio`);
});

test('o robots.txt aponta pro sitemap certo e não bloqueia o site', () => {
  const t = ler('robots.txt');
  assert.match(t, new RegExp(`Sitemap: ${URL_SITE}/sitemap\\.xml`));
  assert.ok(!/^\s*Disallow:\s*\/\s*$/m.test(t), 'Disallow: / esconderia o site inteiro dos buscadores');
});

/* O que a revisão do AdSense procura em toda página: um jeito de falar com quem mantém o site e o aviso de que
   as marcas são de terceiros. Os dois saem do rodapé, então basta um sumir pra sumir de todas as páginas. */
test('toda página tem contato e aviso de marca', () => {
  for (const p of TODAS) {
    const html = ler(arquivoDe(p));
    assert.ok(html.includes(`mailto:${EMAIL_CONTATO}`), `${arquivoDe(p)} sem e-mail de contato`);
    assert.ok(html.includes(AVISO_MARCA), `${arquivoDe(p)} sem o aviso de marca`);
  }
});

test('cada página tem título, descrição e canonical próprios (sem isso o buscador trata como página repetida)', () => {
  const vistos = new Set();
  for (const p of TODAS) {
    const html = ler(arquivoDe(p));
    assert.ok(p.descricao?.length > 50, `${p.slug}: descricao curta demais em site.js`);
    assert.ok(html.includes(`<meta name="description" content="${p.descricao}">`), `${arquivoDe(p)} sem description`);
    assert.ok(html.includes(`<link rel="canonical" href="${p.canonical || `${URL_SITE}/${p.slug}.html`}">`),
      `${arquivoDe(p)} sem canonical`);
    assert.ok(!vistos.has(p.descricao), `${p.slug}: description repetida de outra página`);
    vistos.add(p.descricao);
  }
});

/* O motivo de tudo isto existir: a raiz do domínio entregava 5 palavras de HTML. Um piso de texto REAL na home
   é o que o AdSense chamou de faltar — e é a primeira coisa que volta a sumir se alguém "simplificar" a
   página. 400 palavras é piso, não meta. */
test('a home tem conteúdo de verdade, e links pro guia', () => {
  const html = ler('index.html');
  const corpo = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  const palavras = corpo.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  assert.ok(palavras >= 400, `a home tem só ${palavras} palavras de texto visível — era isso que o AdSense reprovou`);
  assert.match(corpo, /href="jogar\.html"/, 'a home precisa levar pro jogo');
  assert.ok((corpo.match(/href="guia[\w-]*\.html"/g) || []).length >= 3,
    'a home precisa linkar o guia: são as páginas de conteúdo que o buscador tem pra achar');
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
