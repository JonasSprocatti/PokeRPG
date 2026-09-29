/* ============ dados do site (fora do jogo) ============ */
/* Constantes compartilhadas pelas páginas estáticas (privacidade.html, termos.html, sobre.html…) e pelas telas
   do jogo. Existe pra não haver duas versões do mesmo endereço ou do mesmo aviso: o gerador de páginas
   (ferramentas/gerar-paginas.mjs) importa daqui, e o rodapé do jogo também.
   Sem DOM — precisa ser importável no Node. */

// ⚠️ AÇÃO PENDENTE: criar esta conta de e-mail. Enquanto ela não existir, a página de contato aponta pra um
// endereço morto — e "contato que não responde" é justamente o que a revisão do AdSense procura. Trocar aqui
// muda em todo lugar (páginas estáticas, rodapé e política de privacidade).
export const EMAIL_CONTATO = 'pokerpg.contato@gmail.com';

/* Endereço público do jogo, usado nos links absolutos do sitemap.xml, nos `canonical` e nas tags de
   pré-visualização. COM `www` de propósito: o domínio sem www responde 308 e manda pro www, então é o www que
   é o endereço final. Canonical apontando pra um endereço que redireciona é pedir confusão ao buscador —
   e apontar pro domínio ANTIGO (poke-rpg-omega.vercel.app, que segue no ar) faria o Google indexar aquele e
   ignorar este. O endereço da Vercel continua funcionando, mas não é mais o endereço do jogo. */
export const URL_SITE = 'https://www.pokerpg.com.br';

/* Aviso de marca. O jogo é um projeto de fã: usa nomes e imagens de uma franquia de terceiros e não tem
   autorização nenhuma delas. O Pokémon Showdown — que roda AdSense há anos com o mesmo tipo de conteúdo — não
   publica aviso equivalente, então isto não é o que "protege" o projeto; é transparência com quem joga e com
   quem revisa, e custa uma linha. O que de fato importa é o jogo continuar gratuito e não vender nada da
   franquia. */
export const AVISO_MARCA = 'Pokémon é marca registrada da Nintendo, Creatures Inc. e GAME FREAK inc. ' +
  'Este é um projeto de fã, sem fins lucrativos diretos e sem nenhuma afiliação, patrocínio ou aprovação dessas empresas.';

// Crédito da fonte de dados. A PokéAPI pede atribuição e é de onde vem tudo: espécies, golpes, evoluções e sprites.
export const CREDITO_DADOS = 'Os dados de Pokémon vêm da PokéAPI (pokeapi.co), projeto comunitário e gratuito.';

/* Os capítulos do guia. Cada um é uma página própria (guia-<tema>.html) porque um guia de verdade não cabe
   numa página só: assunto separado por endereço é o que um buscador consegue indexar e o que deixa o jogador
   mandar o link do tema certo pra alguém. `chamada` é a frase que descreve o capítulo no índice (guia.html) e
   na navegação do pé de cada capítulo — uma frase só, escrita pra quem ainda não leu o capítulo.
   O texto de cada um mora em ferramentas/conteudo-guia.mjs. Capítulo novo = uma entrada aqui + o corpo lá. */
export const CAPITULOS_GUIA = [
  { slug: 'guia-comecar', titulo: 'Guia: como começar', rotulo: 'Como começar',
    descricao: 'Primeiros passos no PokéRPG: escolher a dificuldade, o mapa e a espécie, o que fazer nos primeiros níveis e como o jogo salva o seu progresso.',
    chamada: 'A dificuldade, a espécie, os primeiros níveis e como o jogo guarda o seu progresso.' },
  { slug: 'guia-batalha', titulo: 'Guia: a batalha', rotulo: 'A batalha',
    descricao: 'Como funciona a batalha do PokéRPG: ordem do turno, dano e tipos, status, estágios de atributo, clima, terreno, telas, armadilhas, aliados e a inteligência do inimigo.',
    chamada: 'Ordem do turno, dano, status, clima, terreno, armadilhas, aliados e como o inimigo pensa.' },
  { slug: 'guia-mundo', titulo: 'Guia: o mundo e as rotas', rotulo: 'Mundo e rotas',
    descricao: 'As nove regiões do PokéRPG: rotas que abrem por nível, taxas de aparição, Pokédex da rota, Alfas, lendários, o Santuário e os treinadores que querem te capturar.',
    chamada: 'Nove regiões, dez rotas cada, Alfas, lendários, o Santuário e quem quer te capturar.' },
  { slug: 'guia-transformacoes', titulo: 'Guia: as quatro transformações', rotulo: 'Transformações',
    descricao: 'Mega Evolução, Terastalização, Movimento Z e Gigantamax no PokéRPG: como cada uma é conquistada, o que ela muda na batalha e quando o inimigo usa a dele.',
    chamada: 'Mega, Tera, Movimento Z e Gigantamax: como conquistar e quando usar cada uma.' },
  { slug: 'guia-progresso', titulo: 'Guia: progresso e carreira', rotulo: 'Progresso',
    descricao: 'O que fica depois da jornada no PokéRPG: experiência, evoluções, missões, pontuação, carreira, medalhas, Hall da Fama e o chefe da semana.',
    chamada: 'Experiência, evoluções, missões e tudo o que sobrevive ao fim de uma jornada.' },
  { slug: 'guia-multiplayer', titulo: 'Guia: jogar com outras pessoas', rotulo: 'Multiplayer',
    descricao: 'O multiplayer do PokéRPG: salas por código de quatro letras, cooperação, PvP, raides contra o chefe da semana e com qual Pokémon entrar em cada uma.',
    chamada: 'Salas por código, cooperação, PvP, raides e com qual Pokémon entrar.' }
];

/* As páginas estáticas do site, na ordem em que entram no sitemap. `slug` é o arquivo gerado na raiz.
   `noSitemap` fica de fora do sitemap.xml (nada hoje, mas o gerador já respeita).
   `noRodape` sai do rodapé: é o caso dos capítulos do guia, que já têm índice e navegação próprios — onze
   links iguais no pé de toda tela viram ruído e escondem os links legais, que são o motivo do rodapé existir.
   Página nova = uma entrada aqui + o conteúdo em ferramentas/conteudo-site.mjs (ou -guia.mjs). */
export const PAGINAS = [
  { slug: 'sobre', titulo: 'Sobre o PokéRPG', rotulo: 'Sobre',
    descricao: 'O que é o PokéRPG: um RPG de navegador em que você não tem treinador — você é o Pokémon. Como foi feito e quem mantém.' },
  { slug: 'guia', titulo: 'Guia do PokéRPG', rotulo: 'Guia',
    descricao: 'Guia completo do PokéRPG em seis capítulos: como começar, a batalha, o mundo e as rotas, as quatro transformações, o progresso de carreira e o multiplayer.' },
  ...CAPITULOS_GUIA.map(c => ({ ...c, noRodape: true })),
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
   "Jogar" não faz sentido e some. Capítulo do guia (`noRodape`) não entra na lista, mas estando DENTRO de um
   deles o link "Guia" continua aparecendo — é o caminho de volta. Texto de fora não entra aqui, então não
   precisa de esc(). */
export function rodapeHTML(atual = '') {
  const links = [
    ...(atual ? [`<a href="./">Jogar</a>`] : []),
    ...PAGINAS.filter(p => !p.noRodape && p.slug !== atual).map(p => `<a href="${p.slug}.html">${p.rotulo}</a>`),
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
