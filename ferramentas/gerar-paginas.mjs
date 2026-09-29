/* ============ gerador das páginas estáticas do site ============ */
/* Escreve na raiz do projeto: sobre.html, guia.html, os seis capítulos do guia (guia-*.html),
   privacidade.html, termos.html, contato.html e sitemap.xml.
   Rode depois de mexer em ferramentas/conteudo-site.mjs, ferramentas/conteudo-guia.mjs,
   js/texto-privacidade.js ou js/site.js:

       node ferramentas/gerar-paginas.mjs

   POR QUE GERAR, e não escrever os .html à mão: são seis arquivos que precisam do mesmo <head>, do mesmo
   cabeçalho e do mesmo rodapé. Escritos à mão, divergem — e a Política de Privacidade ainda por cima tem que
   ser idêntica à tela de dentro do jogo. tests/paginas.test.js falha se o que está na raiz não bater com o que
   este gerador produz, então esquecer de rodar não passa em silêncio.

   POR QUE EXISTEM: o jogo é montado em JavaScript dentro de uma <div> vazia, numa URL só. Sem estas páginas não
   há endereço pra dar pra política de privacidade (o cadastro do AdSense pede), não há texto que um buscador
   consiga ler, e o site inteiro parece "conteúdo escasso" pra quem revisa. Detalhe em docs/adsense.md. */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { PAGINAS, URL_SITE, rodapeHTML } from '../js/site.js';
import { TEXTO_PRIVACIDADE } from '../js/texto-privacidade.js';
import { SOBRE, TERMOS, CONTATO } from './conteudo-site.mjs';
import { GUIA, CORPO_GUIA } from './conteudo-guia.mjs';

const RAIZ = new URL('../', import.meta.url);
const CORPO = { sobre: SOBRE, guia: GUIA, ...CORPO_GUIA, privacidade: TEXTO_PRIVACIDADE, termos: TERMOS, contato: CONTATO };

function pagina({ slug, titulo, descricao }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${titulo} — PokéRPG</title>
<meta name="description" content="${descricao}">
<link rel="canonical" href="${URL_SITE}/${slug}.html">
<link rel="stylesheet" href="css/estilo.css">
<link rel="icon" type="image/png" sizes="32x32" href="img/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="img/icone-192.png">
<meta name="theme-color" content="#161A33">
<meta property="og:type" content="article">
<meta property="og:site_name" content="PokéRPG">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${titulo} — PokéRPG">
<meta property="og:description" content="${descricao}">
<meta property="og:image" content="${URL_SITE}/img/og-imagem.png">
</head>
<body>
<header class="top">
  <div class="brand"><a class="brand-logo" href="./" aria-label="PokéRPG — ir para o jogo"><img src="img/logo.png" alt="" class="logo" width="373" height="309"></a><small>RPG de texto</small></div>
  <div class="top-r"><a class="btn" href="./">▶ Jogar</a></div>
</header>
<div id="app">
<main class="create pagina">
  <h1>${titulo}.</h1>
${CORPO[slug]}
</main>
</div>
${rodapeHTML(slug)}
</body>
</html>
`;
}

/* Sem <lastmod> de propósito: ele é opcional, e preenchê-lo com a data de hoje faria o arquivo mudar a cada
   execução — o teste que confere se o gerado está em dia acusaria diferença todo dia, por nada. */
function sitemap() {
  const urls = [{ loc: `${URL_SITE}/`, prio: '1.0' },
    ...PAGINAS.filter(p => !p.noSitemap).map(p => ({ loc: `${URL_SITE}/${p.slug}.html`, prio: '0.7' }))];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.prio}</priority></url>`).join('\n')}
</urlset>
`;
}

export function gerar() {
  const escritos = [];
  for (const p of PAGINAS) {
    if (!CORPO[p.slug]) throw new Error(`sem conteúdo pra "${p.slug}" — acrescente em ferramentas/conteudo-site.mjs (ou -guia.mjs) e no mapa CORPO`);
    writeFileSync(new URL(`${p.slug}.html`, RAIZ), pagina(p));
    escritos.push(`${p.slug}.html`);
  }
  writeFileSync(new URL('sitemap.xml', RAIZ), sitemap());
  escritos.push('sitemap.xml');
  return escritos;
}
export { pagina };

// `node ferramentas/gerar-paginas.mjs` gera; importado por tests/paginas.test.js, não escreve nada sozinho.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log('gerado:', gerar().join(', '));
