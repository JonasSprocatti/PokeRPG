# Revisão do site para o Google AdSense

Levantamento de 29/09/2026 — o que precisa mudar **antes** de pedir a revisão do Google.
Item do backlog em `CLAUDE.md`.

**Decisão do usuário (29/09/2026)**: seguir com os disclaimers e pedir a revisão, usando o
**Pokémon Showdown como caso de uso** — ele roda AdSense há anos com exatamente o mesmo tipo de
conteúdo derivado. O que o Showdown mostra, ao ser examinado:

- Tem **quatro páginas estáticas com URL real** no rodapé: `/rules`, `/credits`, `/privacy`,
  `/contact`. É o molde para o A2 abaixo.
- A privacidade deles é curta e direta: diz que usam Google Analytics e AdSense, que esses
  guardam cookies próprios e que dá pra bloquear. Não trata GDPR nem menores explicitamente.
- **Não publica aviso de marca em lugar nenhum** — nem no rodapé, nem nos créditos. Os créditos
  creditam quem fez os sprites e os dados (Smogon Sprite Projects, PKParaíso, Veekun), não a
  Nintendo. Ou seja: o disclaimer não é o que protege o projeto. O que protege é ser gratuito e
  não vender nada da franquia. Mantemos o aviso mesmo assim — custa uma linha e ajuda com o
  revisor automático.

## Dados da conta

- **Domínio cadastrado no AdSense**: `pokerpg.com.br` (comprado em 29/09/2026). O site responde no
  `www`; o apex redireciona 308 pra lá. O AdSense cobre o domínio e seus subdomínios, então o
  cadastro sem `www` está correto.
- **Publisher ID**: `ca-pub-9827780756194019`. Ainda **não** está em `js/config.js` — ver a
  decisão sobre o snippet em D, abaixo.
- **Estado**: "Precisa de revisão". Falta verificar a propriedade do site e pedir a revisão.
- **Modelo de monetização**: só anúncio. Não há venda de nada no site, o que é exatamente o que
  mantém o projeto na zona tolerada quanto ao A1.

Estado do código: `ADSENSE_CLIENT_ID` é marcador, `AD_SLOT_INICIO` é marcador, nenhum anúncio
carrega. Um banner de cookies próprio (`js/ads.js`) e a tela 🔒 Privacidade já existem.

## O que já foi feito (29/09/2026)

- **A2, inteiro**: `sobre.html`, `guia.html`, `privacidade.html`, `termos.html` e
  `contato.html`, com URL própria, `<title>`/`description`/`canonical` distintos, mais
  `robots.txt` e `sitemap.xml`. Geradas por `ferramentas/gerar-paginas.mjs`; o texto sai de
  `js/site.js`, `js/texto-privacidade.js` e `ferramentas/conteudo-site.mjs`.
  `tests/paginas.test.js` falha se o publicado sair de sincronia com a fonte.
- **O guia por tema** (o "conteúdo próprio de verdade" do A2): **seis capítulos** com URL
  própria — `guia-comecar`, `guia-batalha`, `guia-mundo`, `guia-transformacoes`,
  `guia-progresso`, `guia-multiplayer` —, cada um com `description` e `canonical` seus, mais o
  índice em `guia.html` e navegação cruzada no pé de cada capítulo. A lista mora em
  `CAPITULOS_GUIA` (`js/site.js`) e o texto em `ferramentas/conteudo-guia.mjs`; os capítulos
  ficam **fora do rodapé** (`noRodape`) pra não afogar os links legais, que são o motivo do
  rodapé existir. Total: 11 páginas estáticas, ~50 KB de texto escrito à mão, tudo no sitemap.
  Onde os slots de anúncio devem entrar quando chegar a hora (D): **aqui**, não na tela de jogo.
- **Rodapé** com os links legais em toda tela (`rodapeHTML()` em `js/site.js`, usado pelas
  páginas e injetado no jogo por `main.js`). Some em batalha, por CSS.
- **B, inteiro**: política reescrita — data de atualização, IndexedDB, o que os outros veem no
  multiplayer, imagens de relato, todos os terceiros, as frases exigidas pelo AdSense
  (cookies de terceiros, DoubleClick, `partner-sites`, opt-outs), direitos LGPD/GDPR, retenção,
  menores e contato. Texto único entre a tela do jogo e a página pública.
- **C**: a política declara público geral e não direcionado a crianças (ver a ressalva adiante).

- **A4**: `ads.txt` publicado, respondendo no apex e no `www`. Dos três métodos de verificação
  oferecidos pelo painel, foi o escolhido por ser o único que não carrega script nenhum — a regra
  de não pedir nada ao Google antes do consentimento segue de pé, e o arquivo é necessário depois
  da aprovação de qualquer jeito.
- **Domínio próprio** e os `canonical` apontando pra ele (o endereço da Vercel continua no ar
  servindo o mesmo site, então sem `canonical` os dois competiriam).
- **E-mail de contato** criado e ativo.

- **D, a parte do código**: `js/consent.js` (Consent Mode v2, script clássico e síncrono) + o
  script do AdSense no `<head>` de `index.html` e das 11 páginas estáticas, com
  `ADSENSE_CLIENT_ID` preenchido em `js/config.js`. O `ads.js` foi reescrito: o script não é mais
  carregado por ele, o banner passou a emitir `gtag('consent','update')` e `blocoAds` deixou de
  depender do consentimento (passou a depender de haver unidade de anúncio). A política de
  privacidade e a tela ⚙ Ajustes foram ajustadas pra dizer a verdade nova: o código carrega
  sempre, o aceite controla cookie e personalização. `tests/paginas.test.js` cobra a ordem
  (consent antes do Google) em todas as páginas, o publisher ID igual nos três lugares
  (config.js, `index.html`, `ads.txt`) e a ausência de slot nas páginas legais.
  **`AD_SLOT_INICIO` e `AD_SLOT_GUIA` seguem vazios de propósito**: unidade de anúncio só existe
  depois da aprovação, e "código no site, nenhum anúncio exibido" é exatamente o estado pedido
  pela revisão.

**Falta**: pedir a revisão (usuário), a CMP (A3), fontes locais (B) e criar/preencher as unidades
de anúncio depois de aprovado.

⚠️ **Anúncios automáticos: deixar DESLIGADOS no painel.** Eles inserem anúncio onde o Google
quiser — inclusive junto dos botões de batalha, que é o caminho curto pra clique acidental,
tráfego inválido e banimento da conta. Os slots deste projeto são manuais e ficam nas páginas de
conteúdo e no fim da tela inicial.

**Ordem combinada com o usuário (29/09/2026)**: ~~verificar a propriedade pelo `ads.txt`~~ ✔,
~~escrever o guia por tema~~ ✔, ~~acrescentar o snippet~~ ✔, **clicar em "Pedir revisão"** ←
está aqui. Motivo da ordem: "conteúdo escasso" é o motivo nº 1 de reprovação e há espera entre
tentativas — não valia gastar a primeira com cinco páginas.

---

## Veredito curto

*(Veredito do levantamento original, mantido pra registro — o item (1) já foi resolvido pelas
páginas estáticas e pelo guia; ver "O que já foi feito" acima.)*

Pedir a revisão hoje é reprovação quase certa, por três motivos independentes:
**(1)** ~~o site é uma URL só, sem conteúdo em texto que o revisor consiga ler~~;
**(2)** o banner de consentimento caseiro não vale como CMP certificada;
**(3)** o conteúdo é inteiramente derivado de uma marca de terceiros — e esse é o item que
não se resolve com código.

---

## A. Bloqueadores

### A1. Marca e direito autoral de terceiros (o ponto sensível)

A política de conteúdo do AdSense proíbe monetizar conteúdo protegido por direitos autorais
de terceiros sem autorização. O jogo usa, tudo da franquia: o nome ("Poké"RPG), as 1025
espécies, os nomes de golpes/habilidades/itens, as fórmulas e — o mais visível — os **sprites e
a arte oficial**, servidos do espelho do repositório de sprites da PokéAPI.

Isso é maior que o AdSense: monetizar um fan game é exatamente o gatilho que a Nintendo/The
Pokémon Company persegue com DMCA. Hoje o projeto é gratuito e sem anúncio, que é a zona
tolerada na prática. Ligar anúncio muda a categoria do projeto.

O que dá pra fazer no site (reduz a chance de reprovação **automática**, não autoriza nada):

- **Disclaimer visível no próprio site**, não só no `README.md` — o revisor não lê o repositório.
  Hoje a frase "Pokémon é marca da Nintendo/Game Freak/Creatures Inc." só existe no README:413.
  Precisa aparecer no rodapé de toda tela e numa página de Termos/Sobre.
- **Crédito à PokéAPI visível no site** (hoje também só no README).
- Não usar logotipo, tipografia ou identidade visual oficial da franquia em nada do site.

**Decisão que é do dono do projeto**, e não tem resposta técnica:
a. Pedir a revisão assim mesmo, com os disclaimers, e aceitar o risco.
b. Não monetizar, e fechar o item de AdSense no backlog.
c. Monetizar por caminho que não passa por rede de anúncio (doação/apoio), que tem risco
   parecido mas sem revisor automático de política.

Enquanto isso não for decidido, os itens abaixo são trabalho que pode não ser usado.

### A2. Site de uma página só, sem conteúdo legível

`index.html` entrega `<div id="app">` vazio e tudo é montado em JS. Não existe roteamento
por URL nenhum (`grep` por `location.hash`/`pushState`: zero ocorrências). Consequências:

- A 🔒 Privacidade **não tem endereço próprio**. O AdSense pede o link direto pra política de
  privacidade no formulário de inscrição — e não há link pra dar.
- O revisor abre o site e vê a tela de criação de jornada: três passos, uma grade de sprites,
  pouquíssimo texto. É o retrato do motivo de reprovação "conteúdo de baixo valor / escasso".
- Não há `robots.txt` nem `sitemap.xml`.

O que precisa existir (HTML estático, indexável, sem depender do JS do jogo):

| Página | Por quê |
|---|---|
| `/privacidade.html` | link direto exigido no cadastro |
| `/termos.html` | onde mora o disclaimer de marca do A1 |
| `/sobre.html` | quem faz, o que é, como contatar — o revisor procura isso |
| `/guia.html` (ou vários) | **o conteúdo próprio de verdade** |
| `robots.txt` + `sitemap.xml` | descoberta |

Sobre o conteúdo próprio: o `README.md` já tem 423 linhas de texto original e bom sobre as
mecânicas (dificuldades, gimmicks, missões, badges, itens de raide, multiplayer). Isso é
matéria-prima pronta pra virar um guia de verdade em HTML — texto escrito por humano, sobre
um assunto específico, que é exatamente o que a revisão procura. Não é trabalho perdido mesmo
que o AdSense não saia: serve de documentação pro jogador e de SEO.

A tela de Privacidade em JS pode continuar existindo (é útil dentro do jogo) desde que o
conteúdo seja o mesmo da página estática — duas versões divergentes é pior que uma.

### A3. O banner de consentimento caseiro não serve

Desde 16/01/2024 o Google exige, pra veicular anúncio a tráfego do EEE, Reino Unido e Suíça,
uma **CMP certificada pelo Google que implemente o IAB TCF** — e o TCF v2.3 passou a ser
obrigatório em 01/03/2026. O banner de `js/ads.js` é honesto e funciona, mas não é certificado
e não emite os sinais de TCF nem de Consent Mode; com ele, o tráfego europeu simplesmente não
recebe anúncio personalizado.

O caminho barato: usar o **"Privacidade e mensagens"** do próprio AdSense (antigo Funding
Choices), que é gratuito e certificado. Isso implica:

- **Remover o banner próprio** — dois banners de cookie na mesma página é pior que nenhum.
- Manter a tela ⚙ Ajustes como o lugar de revogar, mas apontando pro mecanismo da CMP.
- A `CHAVE_CONSENTIMENTO` (`pokerpg-consentimento-ads`) some; a CMP guarda o consentimento dela.

### A4. `ads.txt` ausente

Já está anotado em "Precisa de ação do usuário". Arquivo na raiz, uma linha com o publisher ID,
publicado **depois** da aprovação. Sem ele o AdSense reclama ("Ganhos em risco") mas não reprova.

---

## B. O que falta na política de privacidade

O texto atual (`js/tela-privacidade.js`) é claro e honesto — descreve certo o localStorage, a
conta no Supabase, a presença anônima e a PokéAPI. O que o AdSense exige e não está lá:

1. A frase padrão de que **terceiros, incluindo o Google, usam cookies para veicular anúncios
   com base em visitas anteriores** do usuário a este e a outros sites.
2. Link para [Como o Google usa dados de sites e apps que usam nossos serviços](https://policies.google.com/technologies/partner-sites).
3. Menção ao **cookie DoubleClick** e ao opt-out em `aboutads.info/choices` e
   `youronlinechoices.eu` (além do `adssettings.google.com`, que já está lá).
4. **Data da última atualização** no topo.
5. **Direitos do titular** (LGPD, art. 18 — e GDPR, já que o banner de consentimento existe por
   causa da UE): acesso, correção, exclusão, portabilidade, e como exercer cada um.
6. **Retenção**: por quanto tempo a conta, a carreira e o Hall da Fama ficam guardados.
7. **Contato por e-mail.** Hoje o item 7 manda usar a tela 🐞 Bugs. Isso não serve pra quem não
   consegue entrar no site, e o revisor procura um e-mail.

E um item que **não é do AdSense, mas do GDPR**: o `index.html` carrega **Google Fonts do
servidor do Google** (linhas 7–9) antes de qualquer consentimento, o que transmite o IP do
visitante ao Google. Já houve condenação na Alemanha por isso (LG München, 2022). Hospedar as
duas fontes localmente resolve — e de quebra tira uma dependência de rede do boot.
`js/ajustes.js:28` (`urlDaFonte`) e o `EXTERNOS` do `sw.js` teriam de acompanhar.

---

## C. Menores de idade — decidir antes, não depois

A seção 6 da política diz: "não é feito especificamente para crianças, mas é um jogo de
Pokémon — sabemos que menores de idade jogam". Está escrito com honestidade, mas o Google
lê isso como declaração: se o site for classificado como **voltado a crianças**, valem as
regras de conteúdo infantil (sem anúncio personalizado, sem remarketing) e o site precisa
sinalizar isso tecnicamente (`tagForChildDirectedTreatment` / RDP), não só escrever no texto.

Reconhecer que menores jogam e não tomar nenhuma medida é o pior dos dois mundos. Ou o site
se declara para público geral (e o texto muda), ou se declara infantil (e o código muda).

---

## D. Código do AdSense: o que muda em `js/ads.js` — ✔ FEITO (29/09/2026)

*O diagnóstico abaixo é o original; a reescrita foi feita exatamente assim. Estado de hoje:
`js/consent.js` (Consent Mode v2, síncrono no `<head>`) → script do Google no `<head>` de
`index.html` e das 11 páginas estáticas → `ads.js` cuida do banner, do
`gtag('consent','update')` e dos slots. Slots ainda sem unidade de anúncio (só existem depois da
aprovação).*

O `ads.js` era "tudo ou nada": sem consentimento, o script do Google **não carregava** e o
`<ins>` **não é desenhado**. Isso é mais restritivo que o exigido e atrapalha em dois pontos:

- **Na revisão**: o Google precisa encontrar o código do AdSense no site pra avaliar. Se o
  revisor recusar o banner (ou só não responder), a página não tem script nem slot nenhum, e
  a inscrição pode voltar como "não encontramos o código".
- O padrão atual é **Consent Mode v2**: o script carrega sempre, com o estado de consentimento
  em `denied` por padrão, e o Google serve anúncio não personalizado ou nenhum. Isso é
  compatível com o GDPR e é o que a CMP do A3 opera.

Então a reescrita, quando for a hora: script sempre, `gtag('consent', 'default', {...denied})`
antes dele, CMP atualiza o estado, `blocoAds` deixa de depender de `consentimento()`.

**Posicionamento dos slots** (hoje só existe um, no fim da tela inicial, `js/criacao.js:61`):

- A tela inicial é onde tem menos conteúdo — é justamente a pior para o revisor.
- A tela de jogo é onde a pessoa passa 99% do tempo, mas **anúncio perto dos botões de
  batalha é clique acidental**, que vira tráfego inválido e é motivo de banimento da conta.
  Se entrar algo no jogo, tem que ser longe da área de ação, com folga e rótulo.
- As páginas estáticas do A2 (guia, sobre) são o lugar natural e seguro.

---

## E. Ordem sugerida

Nada disso faz sentido antes de o A1 estar decidido.

1. **A1** — decisão sobre marca/monetização.
2. **A2** — páginas estáticas + conteúdo do guia + `robots.txt`/`sitemap.xml`. É o maior
   trabalho e o único que vale a pena mesmo se o AdSense não sair.
3. **B** — reescrever a política (e fontes locais), publicando nas duas versões.
4. **C** — decidir público-alvo e ajustar o texto (e o código, se for infantil).
5. Pedir a revisão do Google.
6. **A3 + D** — CMP e Consent Mode, depois de aprovado (a CMP se configura no painel do AdSense,
   que só existe com conta aprovada).
7. **A4** — `ads.txt` e preencher `ADSENSE_CLIENT_ID` + `AD_SLOT_INICIO`.
