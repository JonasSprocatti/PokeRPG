/* ============ conteúdo das páginas estáticas do site ============ */
/* Texto das páginas que existem FORA do jogo (sobre, termos, contato). Elas são o "conteúdo próprio" que
   a revisão do Google AdSense procura — e, independentemente disso, são a única parte do projeto que um
   buscador consegue ler, já que o jogo inteiro é montado em JavaScript dentro de uma <div> vazia.
   Dois textos NÃO estão aqui: a Política de Privacidade (compartilhada com a tela de dentro do jogo, em
   js/texto-privacidade.js) e o guia, que virou seis capítulos e mora em ferramentas/conteudo-guia.mjs.
   Fica em ferramentas/ de propósito: é conteúdo longo que só o gerador lê, e não faz sentido todo jogador
   baixar junto com o jogo.
   Depois de mexer: `node ferramentas/gerar-paginas.mjs`. */
import { AVISO_MARCA, CREDITO_DADOS, EMAIL_CONTATO, ATUALIZADO_EM } from '../js/site.js';

/* A página inicial do site — a raiz do domínio (index.html). O JOGO está em jogar.html desde 11/10/2026.
   Antes disso a raiz era o jogo: `<div id="app">` vazia, 5 palavras de HTML, tudo montado em JavaScript. Quem
   abrisse pokerpg.com.br sem executar o JS via uma página em branco, e quem executasse caía direto no tutorial —
   foi assim que o AdSense reprovou o site por "conteúdo de baixo valor" em 11/10/2026 (docs/adsense.md, A2).
   Este texto é o conteúdo que faltava na porta de entrada: o que o jogo é, como é a primeira partida e o que
   tem dentro, com os links pros seis capítulos do guia.
   NÃO repetir o que está em SOBRE (que fala do projeto e de quem o faz): duas páginas dizendo a mesma coisa é
   conteúdo duplicado, que piora exatamente o que isto veio resolver. Aqui é o JOGO; lá é o PROJETO. */
export const INICIO = `
  <p class="lead">Você não tem treinador, não tem Pokébola e não captura ninguém.
    <b>Você é o Pokémon</b> — e a única coisa que o jogo te dá é um corpo de nível 5 no meio da grama alta.</p>

  <p>O PokéRPG é um RPG de texto que roda no navegador, de graça e sem instalar nada. Você escolhe uma espécie
    inicial, nasce selvagem e tem que sobreviver: subir de nível, aprender golpes, evoluir, fazer companheiros e
    atravessar nove regiões sem ser capturado por um treinador humano. Toda batalha usa as fórmulas dos jogos
    originais, e os dados das 1025 espécies vêm direto da PokéAPI.</p>

  <p><a class="btn" href="jogar.html">▶ Começar a jogar</a></p>

  <h2>Como é a primeira partida</h2>
  <p>Você escolhe a dificuldade, a região e um dos iniciais daquela geração. O jogo te põe na primeira rota, no
    nível 5, com os dois ou três golpes que a sua espécie sabe nessa idade — e nada mais.</p>
  <p>A partir daí cada passo é uma decisão pequena. <b>Explorar</b> sorteia um encontro: pode ser um Pokémon
    selvagem do nível da rota, pode ser um grupo de três, pode ser um treinador que quer te pôr numa bola, pode
    ser um item no chão. Lutar dá experiência e dinheiro; fugir não dá nada, mas também não te mata. Quando o HP
    baixa, você não abre o menu e cura outro: você anda até um Centro Pokémon e paga — ou aprende a usar a
    mochila com cuidado, porque remédio custa.</p>
  <p>Os outros Pokémon da rota não são só inimigos. Com um petisco na hora certa, aquele que você acabou de
    poupar pode virar <b>aliado</b> e lutar ao seu lado nas próximas batalhas. Dois cabem no time; os outros
    esperam no esconderijo. E se dois deles forem compatíveis, aparece um ovo — que choca andando, inclusive com
    o jogo fechado.</p>
  <p>Subindo de nível você evolui, e evoluir aqui é o que é na franquia: a sua espécie muda, os atributos
    saltam, golpes novos entram. Chegando ao fim das dez rotas de uma região, os lendários dela te esperam. Vencer
    fecha a região e abre a seguinte — ou encerra a jornada e manda tudo o que você fez pra sua carreira.</p>

  <h2>O que tem dentro</h2>
  <ul>
    <li><b>Nove regiões</b>, dez rotas cada, mais um Santuário no fim de cada uma onde qualquer espécie daquela
      geração pode aparecer. Cada rota tem o próprio conjunto de Pokémon, com as taxas de aparição à mostra.</li>
    <li><b>Batalha completa</b>: ordem de turno por velocidade, tabela de tipos, críticos, estágios de atributo,
      status, clima, terreno, telas, armadilhas e habilidades que realmente disparam.
      (<a href="guia-batalha.html">o capítulo da batalha</a>)</li>
    <li><b>As quatro transformações</b> — Mega Evolução, Terastalização, Movimento Z e Gigantamax — conquistadas
      ao longo da carreira e usáveis uma vez por batalha.
      (<a href="guia-transformacoes.html">como conquistar cada uma</a>)</li>
    <li><b>Quase 200 missões</b>, 59 medalhas e uma pontuação por jornada que alimenta o ranking e o Hall da
      Fama. (<a href="guia-progresso.html">progresso e carreira</a>)</li>
    <li><b>Multiplayer por código de sala</b>: co-op na jornada de quem hospeda, PvP entre times e raides contra
      o chefe da semana. Funciona sem login.
      (<a href="guia-multiplayer.html">como entrar numa sala</a>)</li>
    <li><b>Um chefe novo por semana</b>, igual pra todo mundo, com itens próprios pra enfrentá-lo.</li>
  </ul>

  <h2>Seis jeitos de jogar</h2>
  <p>A dificuldade não muda só os números: muda o que acontece quando você perde.</p>
  <ul>
    <li><b>Roguelike</b> — o modo principal, e o padrão. Desmaiou, a jornada acabou; aliado que cai é perdido
      pra sempre. O que você conquistou fica pra próxima run.</li>
    <li><b>Fácil</b> — treinador nunca te captura e o Centro Pokémon é de graça. Nível inicial, natureza e
      habilidade à sua escolha.</li>
    <li><b>Médio</b> — igual ao Fácil, mas o Centro cobra (e cada vitória desde a última visita barateia a
      conta).</li>
    <li><b>Difícil</b> — ser capturado não acaba com você: dias depois você foge, sem a mochila, com metade do
      dinheiro e longe de onde estava.</li>
    <li><b>Hardcore</b> — ser capturado é o fim. O save é apagado.</li>
    <li><b>Full Randomizer</b> — espécie, natureza e habilidade sorteadas. Você descobre quem é depois de
      nascer.</li>
  </ul>
  <p>Se é a sua primeira vez, o <a href="guia-comecar.html">capítulo de como começar</a> explica a escolha toda
    em uma página.</p>

  <h2>Sem conta, sem instalar, sem pagar</h2>
  <p>O jogo abre no navegador e salva no próprio aparelho — não é preciso criar conta pra jogar do começo ao
    fim. Depois da primeira visita ele funciona <b>offline</b>, e dá pra baixar uma região inteira de antemão pra
    jogar no avião ou no ônibus.</p>
  <p>Criar uma conta é opcional e serve pra três coisas: levar o save de um aparelho pro outro, aparecer no
    ranking e no Hall da Fama, e ter amigos. Não existe compra dentro do jogo, não existe assinatura e não existe
    item pago — <a href="privacidade.html">o que é guardado sobre você está escrito na política de
    privacidade</a>, em português claro.</p>

  <p><a class="btn" href="jogar.html">▶ Jogar agora</a> &nbsp;
    <a href="guia.html">ou ler o guia primeiro</a></p>

  <p class="small muted">${AVISO_MARCA}</p>`;

export const SOBRE = `
  <p class="lead">O PokéRPG é um RPG que roda no navegador, de graça, e parte de uma pergunta simples:
    e se, em vez de treinar Pokémon, você <b>fosse</b> um?</p>

  <h2>A ideia</h2>
  <p>Nos jogos da franquia você comanda seis criaturas de fora da batalha. Aqui não existe treinador, não existe
    Pokébola sua e não existe captura: você escolhe uma espécie inicial, nasce no nível 5 no meio da grama alta e
    tem que sobreviver. Os outros Pokémon que você encontra pelo caminho são vizinhos, rivais ou possíveis
    parceiros — e os treinadores humanos são uma ameaça, porque se um deles te capturar, a sua jornada acaba.</p>
  <p>Essa inversão muda tudo de lugar. Curar não é abrir a mochila e usar um item em outro: é você buscando um
    Centro Pokémon. Ficar mais forte não é distribuir experiência entre seis: é a sua curva de nível. Ter
    companhia não é capturar: é oferecer comida a alguém e torcer pra ganhar confiança.</p>
  <p>As regras disso tudo estão no <a href="guia.html">guia do jogo</a>, em seis capítulos — de como começar
    até o que sobrevive quando a sua jornada acaba.</p>

  <h2>Como funciona por dentro</h2>
  <p>O jogo usa as fórmulas dos jogos originais, não aproximações: stats calculados a partir dos valores-base
    com IVs, EVs e natureza; dano com bônus de mesmo tipo, tabela de efetividade e crítico; estágios de atributo
    de -6 a +6; condições de status com as durações e imunidades corretas; experiência pela curva de crescimento
    de cada espécie; evolução por nível, item, amizade, hora do dia e os casos especiais.</p>
  <p>${CREDITO_DADOS} São as 1025 espécies, com os golpes que cada uma aprende, as habilidades, as árvores de
    evolução e os sprites. Nada é digitado à mão: quando a PokéAPI ganha uma geração, o jogo ganha junto.</p>
  <p>Tecnicamente é JavaScript puro em módulos ES — sem framework, sem etapa de build, sem dependência nenhuma.
    O jogo salva no seu navegador e, depois da primeira visita, funciona inteiro sem internet.</p>

  <h2>Quem faz</h2>
  <p>Um projeto pessoal, escrito e mantido por uma pessoa só, sem empresa por trás e sem investidor. O
    código-fonte fica público pra leitura no
    <a href="https://github.com/JonasSprocatti/PokeRPG" target="_blank" rel="noopener">GitHub</a>, e o jogo é
    ajustado toda semana — a tela 📜 Novidades, dentro do jogo, conta o que mudou em cada versão.</p>
  <p>Bugs e sugestões vão pela tela 🐞 Bugs e sugestões, de dentro do jogo, que mostra o andamento do que você
    relatou. Pra qualquer outro assunto, veja a página de <a href="contato.html">contato</a>.</p>

  <h2>Aviso</h2>
  <p class="small muted">${AVISO_MARCA}</p>`;

export const TERMOS = `
  <p class="lead">Regras de uso do PokéRPG, em português claro.</p>
  <p class="small muted">Última atualização: ${ATUALIZADO_EM}.</p>

  <h2 class="passo"><span>1</span> O que é este site</h2>
  <p class="small">O PokéRPG é um jogo gratuito, mantido por uma pessoa física como projeto pessoal, sem empresa
    por trás. Não há venda de nada, não há compra dentro do jogo e não há assinatura.</p>

  <h2 class="passo"><span>2</span> Marcas de terceiros</h2>
  <p class="small">${AVISO_MARCA}</p>
  <p class="small">Todos os nomes, personagens e imagens de Pokémon pertencem aos seus respectivos donos e são
    usados aqui num projeto de fã, sem fins lucrativos diretos. Se você representa algum desses titulares e
    quer que algo seja removido, escreva pra <a href="mailto:${EMAIL_CONTATO}">${EMAIL_CONTATO}</a> — o pedido
    será atendido.</p>
  <p class="small">${CREDITO_DADOS}</p>

  <h2 class="passo"><span>3</span> O código do jogo</h2>
  <p class="small">O código-fonte é público pra leitura, mas <b>não é código aberto</b>: os direitos são
    reservados ao autor. Não há permissão pra copiar, redistribuir, publicar, vender ou criar obras derivadas do
    projeto, nem pra usar o nome "PokéRPG" ou a identidade visual dele, sem autorização por escrito.</p>

  <h2 class="passo"><span>4</span> Sua conta</h2>
  <p class="small">A conta é opcional e gratuita. Você é responsável pelo acesso ao e-mail que usa pra entrar.
    Apelido e ícone aparecem publicamente no ranking e nos perfis: nada de conteúdo ofensivo, de se passar por
    outra pessoa ou de tentar burlar a pontuação. Contas que fizerem isso podem ser removidas.</p>

  <h2 class="passo"><span>5</span> Multiplayer e chat</h2>
  <p class="small">O chat das salas é entre os participantes. Ofensa, assédio, discurso de ódio e divulgação de
    dados pessoais de terceiros não são tolerados. Quem abre a sala pode removê-la a qualquer momento.</p>

  <h2 class="passo"><span>6</span> O jogo é fornecido como está</h2>
  <p class="small">O PokéRPG é oferecido no estado em que se encontra, sem garantia de funcionamento
    ininterrupto, de ausência de erros ou de que seu progresso jamais se perca. Ele depende de serviços de
    terceiros (PokéAPI, Supabase, a hospedagem) que podem sair do ar. <b>Faça o que puder pra não depender só de
    um aparelho</b>: criar conta é o jeito de ter o progresso guardado fora do navegador.</p>

  <h2 class="passo"><span>7</span> Mudanças</h2>
  <p class="small">O jogo é ajustado com frequência: regras, balanceamento e funcionalidades mudam, e às vezes
    algo é removido. Mudanças relevantes são anunciadas na tela 📜 Novidades. Estes termos podem mudar junto, e
    a data no topo acompanha.</p>

  <h2 class="passo"><span>8</span> Contato</h2>
  <p class="small"><a href="mailto:${EMAIL_CONTATO}">${EMAIL_CONTATO}</a>.</p>`;

export const CONTATO = `
  <p class="lead">Uma pessoa só mantém este jogo, então a resposta pode demorar um pouco — mas ela vem.</p>

  <h2>E-mail</h2>
  <p><a href="mailto:${EMAIL_CONTATO}">${EMAIL_CONTATO}</a></p>
  <p class="small muted">Serve pra qualquer assunto: privacidade e pedidos de remoção de dados, questões de
    direitos autorais, imprensa, parcerias ou só uma dúvida.</p>

  <h2>Bug ou sugestão? Tem caminho melhor</h2>
  <p>Dentro do jogo, a tela <b>🐞 Bugs e sugestões</b> é mais rápida que o e-mail: ela deixa você anexar prints,
    funciona mesmo sem internet (o relato espera e sobe depois) e mostra o andamento do que você já relatou. É
    por ali que a maior parte das correções do jogo começa.</p>

  <h2>Código-fonte</h2>
  <p>O projeto fica público pra leitura no
    <a href="https://github.com/JonasSprocatti/PokeRPG" target="_blank" rel="noopener">GitHub</a>.</p>

  <h2>Direitos autorais</h2>
  <p class="small">${AVISO_MARCA} Titulares de direitos que queiram a remoção de algum conteúdo devem escrever
    pra <a href="mailto:${EMAIL_CONTATO}">${EMAIL_CONTATO}</a>; o pedido será atendido.</p>`;
