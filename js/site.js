/* ============ dados do site (fora do jogo) ============ */
/* Constantes compartilhadas pelas páginas estáticas (privacidade.html, termos.html, sobre.html…) e pelas telas
   do jogo. Existe pra não haver duas versões do mesmo endereço ou do mesmo aviso: o gerador de páginas
   (ferramentas/gerar-paginas.mjs) importa daqui, e o rodapé do jogo também.
   Sem DOM — precisa ser importável no Node. */

// ⚠️ AÇÃO PENDENTE: criar esta conta de e-mail. Enquanto ela não existir, a página de contato aponta pra um
// endereço morto — e "contato que não responde" é justamente o que a revisão do AdSense procura. Trocar aqui
// muda em todo lugar (páginas estáticas, rodapé e política de privacidade).
export const EMAIL_CONTATO = 'pokerpg.contato@gmail.com';

// Endereço público do jogo. Usado nos links absolutos do sitemap.xml e nas tags de pré-visualização.
export const URL_SITE = 'https://poke-rpg-omega.vercel.app';

/* Aviso de marca. O jogo é um projeto de fã: usa nomes e imagens de uma franquia de terceiros e não tem
   autorização nenhuma delas. O Pokémon Showdown — que roda AdSense há anos com o mesmo tipo de conteúdo — não
   publica aviso equivalente, então isto não é o que "protege" o projeto; é transparência com quem joga e com
   quem revisa, e custa uma linha. O que de fato importa é o jogo continuar gratuito e não vender nada da
   franquia. */
export const AVISO_MARCA = 'Pokémon é marca registrada da Nintendo, Creatures Inc. e GAME FREAK inc. ' +
  'Este é um projeto de fã, sem fins lucrativos diretos e sem nenhuma afiliação, patrocínio ou aprovação dessas empresas.';

// Crédito da fonte de dados. A PokéAPI pede atribuição e é de onde vem tudo: espécies, golpes, evoluções e sprites.
export const CREDITO_DADOS = 'Os dados de Pokémon vêm da PokéAPI (pokeapi.co), projeto comunitário e gratuito.';

/* As páginas estáticas do site, na ordem em que aparecem no rodapé. `slug` é o arquivo gerado na raiz.
   `noSitemap` fica de fora do sitemap.xml (nada hoje, mas o gerador já respeita).
   Página nova = uma entrada aqui + o conteúdo em ferramentas/conteudo-site.mjs. */
export const PAGINAS = [
  { slug: 'sobre', titulo: 'Sobre o PokéRPG', rotulo: 'Sobre',
    descricao: 'O que é o PokéRPG: um RPG de navegador em que você não tem treinador — você é o Pokémon. Como foi feito e quem mantém.' },
  { slug: 'guia', titulo: 'Guia do PokéRPG', rotulo: 'Guia',
    descricao: 'Como jogar o PokéRPG: dificuldades, rotas e Alfas, batalha, clima e terreno, aliados, as quatro transformações e o progresso de carreira.' },
  { slug: 'privacidade', titulo: 'Política de Privacidade', rotulo: 'Privacidade',
    descricao: 'O que o PokéRPG guarda sobre você: o que fica só no seu aparelho, o que a conta sincroniza, cookies de anúncio e seus direitos pela LGPD e pelo GDPR.' },
  { slug: 'termos', titulo: 'Termos de Uso', rotulo: 'Termos',
    descricao: 'Regras de uso do PokéRPG: o que é o projeto, marcas de terceiros, licença do código, conduta em salas e limites de garantia.' },
  { slug: 'contato', titulo: 'Contato', rotulo: 'Contato',
    descricao: 'Como falar com quem mantém o PokéRPG: e-mail para privacidade, direitos autorais e imprensa, e o caminho mais rápido para bugs e sugestões.' }
];

// Data da última revisão dos textos legais. Aparece no topo da privacidade e dos termos — o revisor procura por
// ela, e política sem data parece abandonada. Atualizar ao mexer no TEXTO, não a cada deploy.
export const ATUALIZADO_EM = '29 de setembro de 2026';

/* Rodapé do site, em HTML puro. Usado nos DOIS lados: as páginas estáticas o embutem (ferramentas/gerar-paginas.mjs)
   e o jogo o injeta no boot (js/main.js). Uma função só porque link legal que existe numa metade do site e não
   na outra é exatamente o tipo de coisa que a revisão do AdSense pega.
   `atual` = slug da página em que se está, que sai sem link. Vazio ('') significa "estou no jogo": aí o link
   "Jogar" não faz sentido e some. Texto de fora não entra aqui, então não precisa de esc(). */
export function rodapeHTML(atual = '') {
  const links = [
    ...(atual ? [`<a href="./">Jogar</a>`] : []),
    ...PAGINAS.filter(p => p.slug !== atual).map(p => `<a href="${p.slug}.html">${p.rotulo}</a>`),
    `<a href="https://github.com/JonasSprocatti/PokeRPG" target="_blank" rel="noopener">GitHub</a>`
  ].join('\n      ');
  return `<footer class="rodape-site">
    <nav aria-label="Páginas do site">
      ${links}
    </nav>
    <p class="small muted">© 2026 Jonas Sprocatti · <a href="mailto:${EMAIL_CONTATO}">${EMAIL_CONTATO}</a></p>
    <p class="small muted">${AVISO_MARCA}</p>
  </footer>`;
}
