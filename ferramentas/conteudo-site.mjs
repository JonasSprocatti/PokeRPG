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

export const SOBRE = `
  <p class="lead">O PokéRPG é um RPG de texto que roda no navegador, de graça, e parte de uma pergunta simples:
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
