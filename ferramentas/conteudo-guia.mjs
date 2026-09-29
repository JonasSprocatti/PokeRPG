/* ============ o guia do jogo, capítulo por capítulo ============ */
/* Texto das páginas guia*.html. Separado de ferramentas/conteudo-site.mjs porque é o conteúdo mais longo do
   site e o único que cresce: cada capítulo é uma página com endereço próprio (ver CAPITULOS_GUIA em
   js/site.js), e o índice (guia.html) é montado a partir da mesma lista — assim capítulo novo aparece no
   índice e na navegação de todos os outros sem ninguém ter de lembrar de acrescentar o link em seis lugares.

   O QUE ESTE TEXTO É: a documentação do jogo pra quem joga, escrita à mão. É também o que um buscador (e a
   revisão do Google AdSense) consegue ler, já que o jogo inteiro é montado em JavaScript dentro de uma <div>
   vazia — mas o público é o jogador, não o revisor: nada de nome de arquivo, de função ou de tabela aqui.

   Depois de mexer: `node ferramentas/gerar-paginas.mjs`. */
import { CAPITULOS_GUIA } from '../js/site.js';

// O <a> vira bloco no CSS (.pagina ul.indice a), então a chamada cai na linha de baixo, como legenda.
const item = c => `<li><a href="${c.slug}.html">${c.rotulo}</a> <span class="small muted">${c.chamada}</span></li>`;

/* Volta pro índice, no alto de cada capítulo. Um capítulo achado pelo buscador cai numa página funda do site,
   sem passar pelo índice: sem este link a pessoa não descobre que existem outros cinco. */
const voltar = `  <p class="small"><a href="guia.html">← Guia do PokéRPG</a></p>`;

/* Fim do capítulo: o seguinte em destaque (a leitura tem uma ordem que faz sentido) e os demais em lista.
   O último capítulo não tem "próximo" e manda de volta pro jogo. */
function navegacao(slug) {
  const i = CAPITULOS_GUIA.findIndex(c => c.slug === slug);
  const proximo = CAPITULOS_GUIA[i + 1];
  const outros = CAPITULOS_GUIA.filter((c, j) => j !== i && j !== i + 1);
  return `
  <h2>Continuar no guia</h2>
  ${proximo
    ? `<p><b>Próximo capítulo:</b> <a href="${proximo.slug}.html">${proximo.rotulo}</a> — ${proximo.chamada}</p>`
    : `<p>Este é o último capítulo. <a href="./">Voltar pro jogo</a> e testar tudo isso é o passo que falta.</p>`}
  <ul class="indice">
${outros.map(c => `    ${item(c)}`).join('\n')}
  </ul>`;
}

/* ---------- índice (guia.html) ---------- */
export const GUIA = `
  <p class="lead">Você é o Pokémon: não existe treinador, não existe Pokébola sua e não existe captura. Este
    guia explica, em seis capítulos, como o jogo funciona de verdade — das regras da primeira batalha ao que
    sobrevive quando a sua jornada acaba.</p>

  <h2>Os capítulos</h2>
  <ul class="indice">
${CAPITULOS_GUIA.map(c => `    ${item(c)}`).join('\n')}
  </ul>

  <h2>Por onde começar</h2>
  <p>Se você nunca jogou, leia <a href="guia-comecar.html">Como começar</a> e vá jogar: o resto do guia faz
    muito mais sentido depois do primeiro encontro na grama alta. Dentro do jogo, a tela <b>❓ Tutorial</b> dá
    um tour guiado pelas mesmas coisas, com um Pokémon de mentirinha que não mexe em nenhum save.</p>
  <p>Se você já joga e quer parar de perder jornada, os dois capítulos que mais mudam resultado são
    <a href="guia-batalha.html">A batalha</a> (ordem do turno, clima, status — é onde as lutas são ganhas) e
    <a href="guia-progresso.html">Progresso e carreira</a> (o que você leva pra próxima jornada, mesmo
    perdendo).</p>

  <h2>Uma coisa que quase todo mundo demora a entender</h2>
  <p><b>Perder uma jornada não é perder o progresso.</b> Cada jornada terminada — em vitória, em derrota ou
    por desistência — vira pontuação, espécies descobertas, conquistas, medalhas e, nos modos que valem para
    isso, um lugar no Hall da Fama. A sua carreira nunca diminui. Jogar com medo de morrer é o jeito mais
    lento de evoluir aqui.</p>`;

/* ---------- capítulos ---------- */
const CORPOS = {

  'guia-comecar': `
  <p class="lead">Do zero ao primeiro nível: escolher o modo, o mapa e a espécie, o que fazer nos primeiros
    minutos e como o jogo guarda o que você fez.</p>

  <h2>A inversão: você é o Pokémon</h2>
  <p>Nos jogos da franquia você comanda seis criaturas de fora da batalha. Aqui você <b>é</b> uma delas.
    Isso reposiciona tudo:</p>
  <ul>
    <li>Curar não é abrir a mochila e usar um item em outro — é você procurando um Centro Pokémon.</li>
    <li>Ficar mais forte não é dividir experiência entre seis — é a sua curva de nível, só sua.</li>
    <li>Ter companhia não é capturar — é oferecer comida a alguém e torcer pra ganhar confiança.</li>
    <li>E o treinador humano não é você: é a ameaça. Se um deles te capturar, a sua jornada pode acabar ali.</li>
  </ul>

  <h2>1. Escolher a dificuldade</h2>
  <p>A dificuldade muda menos o quanto o inimigo bate e muito mais <b>o que acontece quando você perde</b>.</p>
  <ul>
    <li><b>Roguelike</b> (o padrão, e o modo principal): você começa no nível 5, o Centro é pago, desmaiar
      encerra a jornada — nem Revive salva — e ser capturado também. Em troca, cada jornada desbloqueia
      espécies novas pra começar as próximas, e a pontuação vale uma vez e meia.</li>
    <li><b>Fácil</b>: nunca é capturado, Centro de graça, desmaios ilimitados, você escolhe tudo na criação.
      É o modo de conhecer o jogo — e o único que não acumula conquistas de carreira.</li>
    <li><b>Médio</b>: Centro pago, com desconto que cresce a cada vitória desde a última visita. Três
      desmaios livres; depois disso é preciso ter Revive.</li>
    <li><b>Difícil</b>: ser capturado faz você escapar depois, sem a mochila e com metade do dinheiro.</li>
    <li><b>Hardcore</b>: ser capturado é fim de jogo, ponto. Natureza e habilidade são sorteadas.</li>
    <li><b>Full Randomizer</b>: mapa, natureza, habilidade e até a sua espécie são sorteados.</li>
  </ul>
  <p>Você pode ter várias jornadas em andamento ao mesmo tempo, em modos diferentes: ao começar outra, a atual
    é guardada sozinha e fica na tela <b>💾 Jornadas salvas</b>.</p>

  <h2>2. Escolher o mapa</h2>
  <p>Cada mapa é uma região — de Kanto a Paldea, uma por geração. Os Pokémon selvagens de um mapa são os
    daquela geração, cada um na rota que combina com o nível e o tipo dele. No Roguelike você joga nos mapas
    que já liberou (fechar um libera o seguinte); nos outros modos, em qualquer um.</p>

  <h2>3. Escolher a espécie</h2>
  <p>Você começa entre os iniciais das nove regiões, mais Pikachu, Eevee e <b>toda espécie que já
    desbloqueou</b>. Desbloquear é coisa de Roguelike: derrotar dez de uma espécie, fazer amizade com cinco
    dela ou evoluir para ela algumas vezes. A conta soma todas as suas jornadas, e a espécie desbloqueada
    depois vale em qualquer modo — inclusive nos que não desbloqueiam nada.</p>
  <p>A prévia mostra os atributos, a natureza e a habilidade antes de confirmar. Vale olhar: a natureza sobe
    um atributo 10% e derruba outro 10%, e isso acompanha você a jornada inteira.</p>

  <h2>4. Os primeiros minutos</h2>
  <p>Explorar é o botão que faz o jogo acontecer: ele sorteia um Pokémon selvagem, um treinador, um item, um
    trocado ou só uma frase de ambientação. Nos primeiros níveis:</p>
  <ul>
    <li><b>Lute o que dá pra lutar.</b> Experiência e dinheiro vêm de vitória; a rota inicial é feita pra ser
      vencida.</li>
    <li><b>Passe na loja.</b> Alguns Potions compram muito mais tempo de vida que qualquer estratégia.</li>
    <li><b>Não ignore o Centro Pokémon.</b> Entrar em luta com metade do HP é o que faz um treinador tentar te
      capturar.</li>
    <li><b>Fugir é jogada legítima.</b> A chance depende da sua velocidade e de quantas vezes você já tentou.
      Um encontro perdido custa muito menos que uma jornada perdida.</li>
  </ul>
  <p>As rotas seguintes abrem por nível, e a cada uma o jogo apresenta espécies novas. O caminho longo da
    jornada está em <a href="guia-mundo.html">O mundo e as rotas</a>.</p>

  <h2>Como o jogo salva</h2>
  <p>O jogo salva sozinho, no próprio navegador, a cada ação — não existe botão de salvar. Sem conta, o
    progresso fica só neste aparelho.</p>
  <p><b>Criar conta</b> (com Google ou por um link enviado ao seu e-mail) é gratuito e serve pra três coisas:
    guardar a carreira e as jornadas fora do navegador, continuar em outro aparelho e aparecer no ranking. O
    que você jogou antes de entrar sobe no primeiro login, sem se perder.</p>
  <p><b>Sem internet</b> o jogo continua funcionando depois da primeira visita: ele guarda o que você vai
    encontrando e sobe o que precisa subir quando a rede volta. Em <b>⚙ Ajustes → Jogar offline</b> dá pra
    baixar um mapa inteiro de antemão — ou os nove — pra nada aparecer sem imagem no avião.</p>`,

  'guia-batalha': `
  <p class="lead">A batalha é o coração do jogo e usa as contas dos jogos originais. Este capítulo explica o
    que decide um turno — e o que você pode fazer a respeito.</p>

  <h2>O turno</h2>
  <p>A cada rodada você escolhe uma ação: <b>atacar</b>, <b>usar um item</b>, <b>oferecer um petisco</b> ou
    <b>fugir</b>. Todo mundo em campo age no mesmo turno, e a ordem sai assim:</p>
  <ol>
    <li><b>Prioridade do golpe</b> — um golpe rápido passa na frente de qualquer velocidade.</li>
    <li><b>Efeitos que furam a fila</b> — a Garra Rápida (e habilidades parecidas) dão chance de agir primeiro
      dentro da mesma prioridade; outros itens e habilidades fazem o contrário.</li>
    <li><b>Velocidade</b> — já ajustada por estágios, por paralisia e <b>pelo clima</b>. É por isso que um
      Pokémon de Água sob chuva não é o mesmo Pokémon.</li>
  </ol>

  <h2>Dano, tipos e crítico</h2>
  <p>O dano usa a fórmula dos jogos: poder do golpe, o seu atributo de ataque contra a defesa do alvo, o nível,
    o bônus de golpe do mesmo tipo, a tabela de efetividade, uma variação aleatória pequena e o crítico. Duas
    consequências práticas:</p>
  <ul>
    <li><b>Tipo pesa mais que poder.</b> Um golpe fraco super efetivo quase sempre bate mais que um forte
      neutro — e um golpe do tipo errado pode simplesmente não afetar o alvo.</li>
    <li><b>Físico e especial usam atributos diferentes.</b> Um golpe especial numa espécie de ataque físico é
      desperdício de um dos seus quatro espaços.</li>
  </ul>

  <h2>Estágios de atributo</h2>
  <p>Ataque, Defesa, At. Especial, Def. Especial, Velocidade, precisão e evasão sobem e descem em estágios, de
    -6 a +6. Dois estágios de ataque dobram o seu dano; dois de defesa no inimigo cortam esse dano pela metade.
    Os estágios valem só naquela batalha, e existem habilidades que impedem que os seus caiam.</p>

  <h2>Status</h2>
  <ul>
    <li><b>Queimado</b>: dano por turno e metade do ataque físico.</li>
    <li><b>Envenenado</b> (e veneno grave, que piora a cada turno): dano por turno.</li>
    <li><b>Paralisado</b>: velocidade muito menor e chance de perder o turno.</li>
    <li><b>Dormindo</b> e <b>congelado</b>: você não age até acordar ou descongelar.</li>
    <li><b>Confuso</b>: chance de se acertar em vez de acertar o alvo.</li>
  </ul>
  <p>Cada tipo é imune ao status "dele" — não existe Pokémon de Fogo queimado nem Elétrico paralisado — e
    várias habilidades dão imunidade a mais. Status é a jogada mais subestimada do jogo: veneno num inimigo de
    HP alto ganha a luta sozinho.</p>

  <h2>Clima</h2>
  <p>Cinco climas, cinco turnos cada, mostrados no topo da luta com os turnos restantes. Valem pros dois
    lados:</p>
  <ul>
    <li><b>☀ Sol forte</b>: Fogo mais forte, Água mais fraca, Solar Beam sem carregar.</li>
    <li><b>🌧 Chuva</b>: Água mais forte, Fogo mais fraco, Thunder não erra.</li>
    <li><b>🏜 Tempestade de areia</b> e <b>🧊 Granizo</b>: dano por turno em quem não é do tipo protegido.</li>
    <li><b>❄ Neve</b>: defesa maior pros Pokémon de Gelo, Blizzard não erra.</li>
  </ul>
  <p>Climas entram por golpe, por habilidade de quem acabou de aparecer — ou já vêm com a rota: várias rotas
    têm tempo permanente (neve nas geladas, areia nos desertos, sol nos vulcões). Um golpe troca por cinco
    turnos e depois a rota volta ao padrão dela.</p>

  <h2>Terreno</h2>
  <p>Quatro terrenos, cinco turnos, e uma regra que decide tudo: <b>só afeta quem está no chão</b> — quem voa
    ou levita fica de fora, inclusive da parte boa.</p>
  <ul>
    <li><b>⚡ Campo Elétrico</b>: golpes Elétricos mais fortes e ninguém dorme.</li>
    <li><b>🌿 Campo de Grama</b>: golpes de Planta mais fortes e cura por turno.</li>
    <li><b>🔮 Campo Psíquico</b>: golpes Psíquicos mais fortes e golpes de prioridade não passam.</li>
    <li><b>🌫 Campo de Névoa</b>: dano de Dragão pela metade e nenhum status pega.</li>
  </ul>

  <h2>O seu lado do campo</h2>
  <p>Cada lado tem os próprios efeitos, mostrados no alto da luta:</p>
  <ul>
    <li><b>Telas</b>: Reflect corta dano físico, Light Screen corta especial, Aurora Veil corta os dois (só no
      granizo ou na neve).</li>
    <li><b>Proteções</b>: Safeguard barra status vindo do inimigo, Mist impede que ele baixe seus atributos,
      Tailwind dobra a sua velocidade por quatro turnos.</li>
    <li><b>Armadilhas</b>: Stealth Rock, Spikes e Toxic Spikes machucam <b>quem entra em campo</b> — os
      Pokémon de um treinador e a fila de lendários. Como você nunca troca de Pokémon, o jogo avisa quando uma
      armadilha não teria em quem pegar, em vez de fingir que funcionou.</li>
  </ul>

  <h2>Habilidades e itens segurados</h2>
  <p>Mais de duzentas habilidades têm efeito de verdade, e a ficha marca as que estão ativas. Elas mudam a
    batalha inteira: absorvem um tipo, devolvem dano no contato, sobem um atributo ao entrar em campo, curam
    status, mudam o clima.</p>
  <p>Cada Pokémon da equipe pode segurar <b>um item</b>, que age sozinho — Restos curando por turno, Orbe da
    Vida trocando o seu HP por dano, Faixa de Foco salvando você com 1 de HP, frutas que se comem na hora do
    aperto, e os itens Escolha, que dão 50% num atributo mas travam o primeiro golpe usado.</p>

  <h2>Aliados</h2>
  <p>Ofereça em batalha um petisco que o tipo de um Pokémon selvagem goste e, com a amizade cheia, ele passa a
    andar com você. Cabem <b>dois</b>. Eles agem no mesmo turno, ganham experiência, aprendem golpes e evoluem
    como você — e aceitam ordens: à vontade, pegar leve (não derruba quem você quer fazer de amigo), só status,
    não atacar ou descansar. No Roguelike, aliado que desmaia é perdido pra sempre.</p>

  <h2>Como o inimigo pensa</h2>
  <p>A inteligência do adversário tem degraus. Um <b>selvagem</b> pensa em dano bruto e erra escolhas. Um
    <b>treinador</b> já considera status que pega e cura na hora certa. Um <b>Alfa</b>, um lendário ou o chefe
    da semana consideram tudo: clima, telas, seus estágios, o que é imune. Ele também tem itens, habilidades e
    a transformação dele — o capítulo <a href="guia-transformacoes.html">As quatro transformações</a> conta
    quando ela vem.</p>

  <h2>Seus quatro golpes</h2>
  <p>Você carrega quatro golpes e, a cada nível, decide o que esquecer. Dois itens deixam voltar atrás, e
    valem também pra qualquer aliado: a <b>Escama do Coração</b> faz relembrar um golpe de nível que você
    deixou passar, e o <b>Disco Técnico</b> ensina um que a espécie só aprende por máquina, tutor ou herança —
    cada disco usado deixa o próximo mais caro, então montar o conjunto perfeito no fim da jornada custa de
    verdade.</p>

  <h2>Uma dica que não é óbvia</h2>
  <p>Antes de atacar, pergunte quanto vale o turno. Subir um atributo, aplicar um status ou pôr uma tela custa
    um turno e paga em todos os seguintes; um golpe neutro paga uma vez. Em luta longa — Alfa, lendário, chefe
    — quem gasta o primeiro turno preparando quase sempre ganha.</p>`,

  'guia-mundo': `
  <p class="lead">Nove regiões, dez rotas em cada, um Santuário que só abre depois da vitória — e gente
    andando por aí com Pokébolas na mochila.</p>

  <h2>Rotas que abrem por nível</h2>
  <p>Cada mapa tem dez rotas, liberadas conforme o seu nível. Cada rota tem a própria lista de espécies e as
    próprias taxas de aparição: comuns aparecem muito, raros pouco (segue a dificuldade de captura da espécie
    nos jogos). Nenhuma rota tem tudo — e nenhum mapa tem todas as espécies do jogo, então completar a Pokédex
    passa por várias regiões.</p>
  <p><b>Míticos</b> da região (Mew, Celebi e companhia) podem aparecer nas duas rotas mais altas, em menos de
    meio por cento dos encontros. Vale como lenda urbana até acontecer com você.</p>

  <h2>A Pokédex da rota</h2>
  <p>Cada espécie da rota aparece como <b>?</b> até você enfrentá-la; depois fica <b>silhueta</b>; com dez
    derrotados — somando todas as suas jornadas — fica colorida e revela a <b>taxa de aparição</b> dela ali.
    É o mapa de farm do jogo: quando a rota está inteira revelada, você sabe exatamente onde caçar o quê.</p>

  <h2>Alfas</h2>
  <p>Das rotas 1 a 9, cada uma guarda um <b>Alfa</b>: um exemplar da espécie local com valores individuais
    perfeitos, o dobro do HP e cerca de 30% a mais nos outros atributos. Ele bate muito mais forte que o
    vizinho da mesma espécie e a primeira vitória dá prêmio. Alfa é o teste de "estou pronto pra próxima
    rota?".</p>

  <h2>Lendários e o fim do mapa</h2>
  <p>A décima rota guarda os lendários da região: até quatro em sequência, com o principal (Mewtwo, Ho-Oh,
    Rayquaza…) por último e turbinado. Vencer <b>fecha a região</b>.</p>
  <ul>
    <li>No <b>Roguelike</b>, a vitória já fica garantida e o mapa seguinte libera. Aí você escolhe: encerrar a
      jornada como vitória ou continuar explorando o Santuário — sabendo que desmaiar lá termina a jornada em
      derrota (a região vencida continua liberada de qualquer jeito).</li>
    <li>Nos <b>outros modos</b>, a jornada termina em vitória e o seu Pokémon se aposenta campeão daquele mapa.
      Dá pra seguir com o mesmo Pokémon pro mapa seguinte, levando equipe e mochila — mas cada continuação
      vale menos pontos.</li>
  </ul>

  <h2>🏛 O Santuário</h2>
  <p>É a décima primeira área, e só abre depois de você vencer os lendários daquela região. Lá vive a
    <b>geração inteira</b>: todas as espécies, com as linhas evolutivas completas, os iniciais, os lendários,
    os míticos e as <b>formas regionais</b> — Alolan, Galarian, Hisuian, Paldean. Ele ignora faixa de nível e
    é a garantia de que dá pra encontrar qualquer Pokémon de uma região, depois de fechá-la.</p>

  <h2>Formas regionais</h2>
  <p>Evoluir dentro da região dá a forma de lá: um Exeggcute que evolui em Alola vira o Exeggutor de Alola, não
    o de Kanto. Vale em Alola, Galar, Hisui e Paldea, em qualquer espécie que tenha forma regional naquele
    mapa. O registro continua contando na espécie — o que muda é o Pokémon que fica com você, com os tipos, os
    atributos e os golpes da forma regional.</p>

  <h2>Treinadores caçadores</h2>
  <p>Eles aparecem enquanto você explora, com um a três Pokémon e Pokébolas. A equipe não é só da rota: cerca
    de metade pode ser qualquer espécie do mapa, sempre no nível da rota — eles viajaram até ali. Com <b>o seu
    HP pela metade</b>, podem tentar te capturar, e a chance depende da taxa de captura da <b>sua</b> espécie.
    O que acontece se conseguirem depende da dificuldade: nada, fuga sem mochila, ou o fim da jornada. A
    lição é sempre a mesma: não ande machucado.</p>

  <h2>✨ Shiny</h2>
  <p>Um em 4096, pra você e pra qualquer Pokémon que apareça. Não há atalho — só encontro.</p>

  <h2>Ferramentas de quem farma</h2>
  <ul>
    <li><b>🎯 Caça Shiny</b> (opcional, ligada no começo da jornada): quando você revela todas as espécies de
      uma rota, pode eleger <b>uma</b> pra ser a única que aparece ali. Muda só o Pokémon selvagem —
      treinadores, itens e dinheiro seguem iguais.</li>
    <li><b>Repelente Seletivo</b>: por 30 explorações, só a espécie que você escolher aparece.</li>
    <li><b>Repelente Total</b>: por 40 explorações, nenhum selvagem aparece — só treinadores, itens e
      dinheiro.</li>
    <li><b>Rota esgotada</b> (só no Roguelike): quando o seu nível passa muito do teto de uma rota, ela para de
      gerar encontros. Nada de moer eternamente na rota 1. A Pokédex dela continua valendo.</li>
  </ul>

  <h2>Explorar também acha coisa</h2>
  <p>Fora dos encontros, a exploração dá dinheiro, itens de cura, pedras de evolução (da quarta rota em
    diante), uma Escama do Coração de vez em quando e os itens de evolução mais raros. Os Alfas dão prêmio na
    primeira vitória. O que fazer com tudo isso está em
    <a href="guia-progresso.html">Progresso e carreira</a>.</p>`,

  'guia-transformacoes': `
  <p class="lead">Mega Evolução, Terastalização, Movimento Z e Gigantamax estão todas no jogo. Nenhuma delas se
    conquista dentro de uma jornada: são conquistas da sua <b>carreira</b>, e você as leva pras jornadas
    seguintes.</p>

  <h2>A regra que vale pras quatro</h2>
  <ul>
    <li><b>Uma por batalha.</b> Você pode usar mais de uma transformação diferente na mesma luta, mas cada uma
      só vale uma vez.</li>
    <li><b>Não gastam o turno</b> — você se transforma e ataca na mesma rodada. A exceção é o Movimento Z, que
      <b>é</b> o turno.</li>
    <li><b>Duram até o fim da batalha</b>, e nada disso sobra depois: nenhuma transformação vai junto no seu
      progresso.</li>
    <li><b>Só o seu Pokémon principal se transforma.</b> Aliados não.</li>
  </ul>

  <h2>⚡ Mega Evolução</h2>
  <p>Conquistada por espécie: mil golpes finais sendo aquela espécie, somando a carreira inteira. Conquistada,
    libera a compra da <b>Pedra Mega</b> na loja (só pra ela), e é preciso <b>segurar a pedra</b> pra
    megaevoluir. Rayquaza é a exceção da franquia e megaevolui por saber Dragon Ascent.</p>
  <p>A forma muda atributos, tipos, habilidade e aparência. Charizard e Mewtwo perguntam X ou Y; Groudon e
    Kyogre usam o nome certo, <b>Reversão Primitiva</b>. Metade das Megas deste jogo não existe nos jogos
    oficiais e não tem pedra desenhada — nesses casos aparece a Pedra-Chave, o item real que ativa qualquer
    Mega.</p>
  <p>Só acumula pra espécie que <b>tem</b> Mega: derrotar sendo uma que não megaevolui não enche barra
    nenhuma.</p>

  <h2>💎 Terastalização</h2>
  <p>Conquistada por tipo: duzentos derrotados daquele tipo. Na batalha você escolhe entre os tipos que já
    tem, sem item nenhum. Terastalizado, você passa a ter <b>um tipo só pra receber golpe</b> — um Charizard
    Tera Água deixa de tomar quatro vezes de Pedra — e o bônus de mesmo tipo segue a regra dos jogos: golpe do
    tipo Tera que você já tinha bate o dobro, um tipo novo bate uma vez e meia, e o bônus antigo continua
    valendo.</p>

  <h2>🔴 Movimento Z</h2>
  <p>Precisa do <b>Cristal Z</b>, liberado ao conquistar um Z (matando com um golpe específico muitas vezes,
    ou com o elemento dele o dobro). Diferente dos outros, ele <b>é</b> o seu turno: converte um golpe seu num
    golpe muito mais forte, uma vez por batalha. Serve pra fechar uma luta que você não vai aguentar por muito
    mais tempo.</p>

  <h2>🌀 Gigantamax</h2>
  <p>A única sem item: conquistada ao chegar ao nível 50 com a mesma espécie em vinte e cinco jornadas. Dobra
    o seu HP por três turnos, transforma todo golpe num golpe Max e deixa o seu Pokémon gigante na tela. Como
    o HP extra vai embora com a forma, ela é ao mesmo tempo ofensiva e um botão de sobrevivência.</p>

  <h2>Vínculo de Batalha (Ash-Greninja)</h2>
  <p>Mesma economia da Pedra Mega, mas com espécie própria: mil golpes finais sendo Greninja liberam a compra
    do <b>Vínculo de Batalha</b>. Segurando o item, <b>derrubar um oponente</b> transforma você em
    Ash-Greninja pelo resto da luta — atributos mais altos e Water Shuriken com três acertos garantidos. Não é
    botão: acontece sozinho.</p>

  <h2>O inimigo também se transforma</h2>
  <p>Alfas, lendários e treinadores megaevoluem <b>ou</b> terastalizam quando caem à metade do HP — uma virada
    por luta, nunca as duas. A Mega do inimigo aparece a partir do nível 40; o Tera pode vir em qualquer rota.
    Só Pokémon de treinador gigantamaxa, e só treinadores e Alfas usam Movimento Z — o treinador sempre carrega
    um, o Alfa de vez em quando.</p>
  <p>Na prática: contra Alfa e lendário, <b>guarde recurso pra depois da metade do HP dele</b>. A luta tem
    duas fases, e quem gasta tudo na primeira perde na segunda.</p>

  <h2>Em sala de multiplayer</h2>
  <p>Na cooperação, o seu Pokémon principal usa as quatro transformações normalmente, com as suas próprias
    conquistas e os seus itens, valendo uma vez por luta. Aliados, Pokémon convidado e PvP ficam de fora — e
    nada disso muda o seu Pokémon depois da luta.</p>`,

  'guia-progresso': `
  <p class="lead">Este é o capítulo que muda como você joga: quase tudo o que você faz numa jornada continua
    valendo depois que ela termina.</p>

  <h2>Dentro da jornada</h2>
  <h3>Experiência e atributos</h3>
  <p>Você sobe de nível pela curva de crescimento da sua espécie — as espécies não sobem no mesmo ritmo, e isso
    é dado da franquia, não desequilíbrio. Seus atributos saem dos valores-base da espécie, dos valores
    individuais (a sorte do nascimento), dos pontos de esforço que você ganha vencendo e da natureza. Vitória
    contra quem dá esforço no atributo certo é a diferença silenciosa entre dois Pokémon do mesmo nível.</p>

  <h3>Evoluções</h3>
  <p>Além do nível, as evoluções seguem os caminhos dos jogos:</p>
  <ul>
    <li><b>Pedras e itens</b>: dez pedras e itens como Maçã Doce, Bule Rachado e Armadura Auspiciosa. As
      pedras e o Cabo de Conexão se compram; o resto aparece explorando e como prêmio de Alfa.</li>
    <li><b>Troca</b>: o <b>Cabo de Conexão</b> simula a troca e evolui quem só evolui assim — Kadabra,
      Machoke, Graveler, Haunter. Alguns pedem também um item na mochila, que é gasto junto.</li>
    <li><b>Vínculo</b>: cada Pokémon tem um vínculo de 0 a 255, que sobe a cada nível e a cada vitória. Com 160
      ou mais evoluem Golbat, Pichu, Eevee (Espeon de dia, Umbreon à noite) e companhia.</li>
    <li><b>Hora do dia</b>: pelo relógio do seu aparelho — dia das 6h às 18h, noite das 18h às 6h.</li>
    <li><b>Condições especiais</b>: saber um golpe, ter um aliado de certa espécie, comparar Ataque e Defesa.
      Evoluções que nos jogos dependem de coisas que não existem aqui ganharam regra equivalente — Sirfetch'd
      com três críticos numa batalha, Kingambit ao derrotar três Bisharp. A ficha mostra o que falta pra
      cada uma.</li>
  </ul>
  <p>Ao evoluir você aprende os golpes que a forma nova ganha de cara, e a habilidade acompanha a mudança
    mantendo o tipo de espaço: quem tinha habilidade oculta continua com a oculta.</p>

  <h3>Missões</h3>
  <p>Trinta e seis missões vão aparecendo conforme você joga: derrotar espécies (mais das comuns, menos das
    raras), fazer amigos, vencer a trilha dos Alfas, juntar e gastar dinheiro, subir de nível, evoluir e
    derrotar treinadores. Elas pagam prêmio e servem de roteiro pra quem não sabe o que fazer agora.</p>

  <h2>Quando a jornada acaba</h2>
  <p>Uma jornada termina em vitória (vencendo os lendários), em Game Over ou quando você a encerra. Em todos os
    casos ela é fechada e <b>vira pontuação</b> — que é recalculada no servidor, então número impossível é
    recusado. Cada região fechada vale dois mil pontos, e o modo multiplica o total: o Fácil vale uma vez, o
    Hardcore vale o dobro.</p>
  <p>A tela de fim compara tudo com o seu recorde naquela espécie e mostra o que aquela jornada desbloqueou.</p>

  <h2>📊 A carreira</h2>
  <p>A carreira é a soma de todas as jornadas terminadas, e ela <b>nunca diminui</b>. Ali ficam o Pokémon
    favorito, a Pokédex (quantos você já viu, derrotou e recrutou dos 1025), os shinies, a maior quantia de
    dinheiro, o nível máximo, o tempo total e o melhor resultado por espécie. Com conta, tudo isso sincroniza
    entre aparelhos e vale no ranking.</p>

  <h3>🏅 Conquistas e transformações</h3>
  <p>A cada vitória o jogo registra os tipos do Pokémon derrotado, a espécie que você estava usando, o golpe
    que finalizou e o elemento dele. É desses contadores que saem as quatro transformações — veja
    <a href="guia-transformacoes.html">As quatro transformações</a> — além dos marcos de caçada: mil, dez mil,
    cem mil, um milhão de derrotados. O modo Fácil não acumula: ele é treino.</p>

  <h3>🏵 Medalhas</h3>
  <p>São 53 medalhas de conta, conquistadas pelo que você acumulou na carreira, e cada uma dá uma
    <b>vantagem na próxima jornada</b>. Elas são o motivo de terminar uma jornada perdida em vez de abandoná-la:
    a próxima começa melhor.</p>

  <h3>Desbloqueios do Roguelike</h3>
  <p>Só jornadas Roguelike desbloqueiam espécies novas pra começar — derrotando dez de uma, fazendo amizade com
    cinco ou evoluindo pra ela várias vezes. A espécie desbloqueada vale em todos os modos. A tela inicial e a
    de conquistas mostram quem está quase lá.</p>

  <h2>🏆 Hall da Fama, Arena e chefe da semana</h2>
  <p>O Pokémon principal de cada jornada Roguelike ou Hardcore que você <b>termina</b> — vencendo, perdendo ou
    encerrando — entra no <b>Hall da Fama</b> com o nível que tinha. Ele guarda os trinta melhores e vale na
    conta inteira.</p>
  <p>Esses campeões têm o que fazer:</p>
  <ul>
    <li><b>☄ Chefe da semana</b>: um chefe especial ocupa a rota final da região dele, no Roguelike e no
      Hardcore. São quatorze, um por semana, girando em rodízio — Eternatus Eternamax, Mega Rayquaza, Groudon
      Primal e companhia. Cada um tem mecânica própria: couraça que precisa ser rompida, ponto fraco que muda,
      golpe carregado telegrafado, fases, clima permanente. Perder contra ele não encerra a jornada.</li>
    <li><b>🏟 Arena</b>: leva de um a três Pokémon do seu Hall da Fama contra o chefe da semana, sem precisar
      de jornada nenhuma. Perder não custa nada.</li>
    <li><b>🎒 Loja de preparo</b>: toda jornada terminada deixa 10% do seu dinheiro máximo como <b>saldo de
      conta</b>, pra sempre. Na Arena e nas raides, esse saldo compra cura, revives e itens de segurar antes
      da luta.</li>
  </ul>
  <p>O prêmio do chefe é o Pokémon na Pokédex, uma insígnia com título (que dá pra exibir ao lado do seu nome)
    e os <b>itens de raide</b> da semana: consumíveis que só valem na luta de chefe e alguns itens de segurar
    que valem em qualquer batalha. O prêmio gira em rodízio e não combina necessariamente com o chefe da vez —
    a descrição de cada item diz contra quem ele presta, e a ajuda dos chefes traz a tabela inteira.</p>
  <p>Pra enfrentar o chefe em grupo, veja
    <a href="guia-multiplayer.html">Jogar com outras pessoas</a>.</p>`,

  'guia-multiplayer': `
  <p class="lead">Salas por código de quatro letras, até seis pessoas, sem precisar de conta. Quem cria a sala
    é a autoridade da luta; os outros só entram e jogam.</p>

  <h2>Os três modos de sala</h2>
  <ul>
    <li><b>Cooperação</b>: todos entram na jornada de quem abriu a sala, contra selvagens (um por jogador) ou
      contra o <b>Alfa</b> da zona, que aguenta o grupo todo.</li>
    <li><b>PvP</b>: cada um escolhe o Time A ou o Time B. Dá pra fazer 1×1, 3×3, 2×1, 3×2 — times desiguais são
      permitidos, e quem está em menor número ganha HP extra quando o balanceamento está ligado. É amistoso:
      não gasta HP nem PP e não mexe em jornada nenhuma.</li>
    <li><b>☄ Sala de Raide</b>: o chefe da semana em grupo, sem precisar de jornada. Cada jogador leva de um a
      três Pokémon do próprio Hall da Fama e compra itens na própria loja de preparo. O HP do chefe cresce com
      o número de jogadores, mas menos que proporcionalmente — juntar gente ajuda de verdade.</li>
  </ul>

  <h2>Com qual Pokémon entrar</h2>
  <p>Independente do modo, cada jogador escolhe a própria entrada:</p>
  <ul>
    <li><b>O da sua jornada</b>: a luta conta pra ela.</li>
    <li><b>Um convidado de nível 5</b>: escolhido entre os iniciais, Pikachu, Eevee e as espécies que você
      desbloqueou. Emprestado só pra sala.</li>
    <li><b>Do seu Hall da Fama</b>: de um a três campeões de jornadas já terminadas, no nível real deles — pra
      jogar sem ter jornada em andamento e sem se contentar com um nível 5.</li>
  </ul>
  <p>A escolha aparece em dois lugares: na tela do Multiplayer, antes de criar ou entrar, <b>e dentro da
    sala</b> — então dá pra trocar antes de a luta começar, sem perder o código.</p>

  <h2>Balanceamento e o que você leva pra casa</h2>
  <p>O balanceamento vem <b>ligado</b>. Na cooperação, o grupo todo fica no nível do Pokémon de quem abriu a
    sala, pra um amigo forte não atropelar a jornada dela. No PvP, todos vão pro nível médio da luta.
    Desligado, valem os níveis reais — e na cooperação os inimigos acompanham o mais forte do grupo, o que
    deixa tudo mais difícil.</p>
  <p>Aqui está a regra que confunde todo mundo: <b>ganho só no nível real</b>. Se você lutou sem ajuste de
    nível, experiência, esforço, dinheiro, itens e prêmios de Alfa voltam com você pra sua jornada. Se o
    balanceamento mexeu no seu nível, a luta vale como diversão e não traz ganho — é o preço de não poder
    farmar com o Pokémon de nível 70 de outra pessoa.</p>
  <p>Na cooperação, o HP e o PP gastos voltam junto com você. Fora do Roguelike, desmaiar volta com 1 de HP;
    <b>no Roguelike, desmaiar conta de verdade</b>.</p>

  <h2>Como corre o turno</h2>
  <p>Cada um escolhe o golpe e o alvo de cada Pokémon seu. O turno sai quando todos escolheram ou em 45
    segundos, no automático — sala não trava por causa de quem saiu pra atender o telefone. A sala então narra
    a rodada linha por linha, destacando quem está agindo.</p>
  <p>O item segurado do seu Pokémon funciona normalmente, e dá pra usar um item comum da mochila na sua vez
    (ocupa o turno, sempre em você mesmo). Nas raides, cura, itens de stat, itens de raide e <b>Revive</b>
    saem do saldo da conta — dá pra reerguer um companheiro sem esperar o time inteiro cair.</p>

  <h2>Conversar e convidar</h2>
  <p>Toda sala tem <b>💬 chat</b>, no lobby e durante a luta. Com conta, dá pra <b>chamar um amigo com um
    toque</b> (ele recebe o convite em qualquer tela do jogo); sem conta, passe o código de quatro letras. Dá
    também pra curar a equipe entre as lutas sem sair da sala.</p>

  <h2>Quando a internet vacila</h2>
  <p>A sala foi feita pra rede ruim: cada mensagem é reenviada se falhar, quem hospeda repete o estado da luta
    de tempos em tempos, existe um botão <b>🔄 Sincronizar</b> e trocar de aba não derruba ninguém. A sala
    mostra o estado da conexão, com um diagnóstico das últimas mensagens — se algo travar, sincronizar
    costuma resolver sem ninguém sair.</p>`

};

/* Cada capítulo publicado = volta pro índice + corpo + navegação pro resto do guia. Montado aqui, e não
   escrito à mão em cada corpo, pra que capítulo novo entre na navegação de todos os outros de graça. */
export const CORPO_GUIA = Object.fromEntries(
  CAPITULOS_GUIA.map(c => {
    if (!CORPOS[c.slug]) throw new Error(`capítulo "${c.slug}" está em CAPITULOS_GUIA (js/site.js) sem texto em CORPOS`);
    return [c.slug, `${voltar}\n${CORPOS[c.slug]}\n${navegacao(c.slug)}`];
  })
);
