/* GERADO A MÃO: notas de atualização mostradas na tela 📜 Novidades (tela-patchnotes.js).
   Mais nova primeiro. `versao` = rótulo curto, `data` = AAAA-MM-DD, `titulo` = manchete curta,
   `piada` = uma linha de humor no estilo "nota de bugfix absurda", `secoes` = [{ nome, itens: [texto] }]. */
export const PATCH_NOTES = [
  { versao: '2.5', data: '2026-09-23', titulo: 'Pokédex de verdade', piada: 'O Professor finalmente entregou a Pokédex. Levou 1025 fichas, todas em branco, e um "boa sorte".',
    secoes: [
      { nome: 'Novidades', itens: [
        'Nova tela 📖 Pokédex: as 1025 espécies do jogo, as que você já encontrou com sprite e nome, as outras ainda como "?".',
        'Toque em quem você conhece pra abrir a ficha completa: tipos, todos os atributos base, habilidades com a descrição de cada uma, e quantas vezes você já viu, derrotou e recrutou aquela espécie.',
        'A ficha também mostra ONDE aquele Pokémon aparece: em quais rotas de quais mapas, com a chance de encontro, além de avisar quando ele é Alfa de alguma rota ou participa de uma luta final.',
        'Conta a carreira inteira e a jornada em andamento — espécie que você encontrar agora já entra na Pokédex.'
      ] },
      { nome: 'Correções', itens: [
        'As conquistas da conta estavam sendo perdidas no fim de cada jornada: o contador subia enquanto você jogava e a carreira nunca recebia nada. Agora o progresso fica guardado quando a run termina.',
        'A tela de criação passou a avisar, nos modos que não são Roguelike, que derrotar espécies ali não desbloqueia nenhuma delas como opção inicial — isso sempre foi assim, mas o jogo nunca tinha dito, e dava pra jogar uma jornada inteira esperando o contrário.',
        'As espécies desbloqueadas passaram a valer em TODOS os modos, não só no Roguelike. Conquistar o desbloqueio continua sendo coisa de jornada Roguelike; usar o que você já conquistou, não.',
        'A lista de quanto falta pra desbloquear cada espécie agora também aparece na tela 🏅 Conquistas, junto do resto do progresso da conta.'
      ] }
    ] },
  { versao: '2.4', data: '2026-09-23', titulo: 'A conta começou a contar', piada: 'Instalamos um contador na sua conta. Ele já estava lá antes, mas só fazia contato visual com os Pokémon derrotados e anotava mentalmente.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Nova tela 🏅 Conquistas: tudo o que a sua conta acumulou ao longo da carreira inteira, incluindo a jornada em andamento.',
        'A partir de agora o jogo registra, a cada vitória, os tipos do Pokémon derrotado, a espécie que você estava usando, o golpe que finalizou e o elemento dele. É o que vai desbloquear as gimmicks — Mega Evolução, Terastalização, Z-Moves e Gigantamax — quando elas chegarem.',
        'Marcos de caçada: 1.000, 10.000, 100.000 e 1.000.000 de Pokémon derrotados.',
        'O abate do aliado conta para a espécie que você está usando (ele luta ao seu lado, afinal), mas tipo e golpe só contam quando o golpe final foi seu.',
        'Os Alfas de rota foram refeitos: nenhum se repete mais dentro do mesmo mapa, cada um combina com o tema da rota (nada de Aggron guardando o Mar de Hoenn) e cada mapa fecha com seu pseudo-lendário — Dragonite, Tyranitar, Salamence, Garchomp, Hydreigon, Goodra, Kommo-o, Dragapult e Archaludon.',
        'O lendário da luta final agora é sorteado a cada jornada: fechar Kanto não é mais sempre Mewtwo, e completar a Pokédex dos lendários exige voltar ao mapa.'
      ] }
    ] },
  { versao: '2.3', data: '2026-09-23', titulo: 'O Aegislash finalmente saca a espada', piada: 'O Aegislash passou o jogo inteiro segurando o escudo na frente e a espada atrás. Agora ele aprendeu que dá pra inverter — e o adversário não gostou nem um pouco.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Mudança de Postura entrou no jogo: o Aegislash vira a Forma Lâmina quando ataca (ataque altíssimo, defesa de papel) e volta para a Forma Escudo quando usa King\'s Shield. É a primeira habilidade do jogo que troca a forma do Pokémon no meio da batalha.',
        'As barreiras deixaram de ser todas iguais: King\'s Shield tira 2 de Ataque de quem tenta encostar, Obstruct tira 2 de Defesa, Spiky Shield machuca, Baneful Bunker envenena, Silk Trap tira Velocidade e Burning Bulwark queima. Só vale para golpes físicos — quem ataca de longe é bloqueado sem se machucar.'
      ] }
    ] },
  { versao: '2.2', data: '2026-09-23', titulo: 'Golpes no lugar certo', piada: 'O Flame Charge passou anos dando carona de velocidade para o adversário. Pedimos desculpas a todos os Rapidash que perderam corridas por isso.',
    secoes: [
      { nome: 'Correções', itens: [
        'Flame Charge (e todo golpe que dá bônus a quem usa: Power-Up Punch, Ancient Power, Charge Beam…) estava aumentando o atributo do OPONENTE. Agora o bônus vai para quem usou o golpe — e os golpes que cobram um preço de quem usa, como Close Combat e Draco Meteor, continuam baixando os atributos do próprio usuário.',
        'Evoluir não reescreve mais o moveset inteiro: a evolução entrega o golpe que ela realmente concede (o Stomp do Exeggutor, o King\'s Shield do Aegislash), e não toda a lista de golpes que a forma nova saberia se tivesse acabado de nascer.',
        'O Disco Técnico não funcionava em jornadas começadas antes da atualização: a ficha do Pokémon guarda uma cópia dos dados da espécie, e essa cópia não tinha a lista de golpes de MT. Agora ela é atualizada na hora, com internet.'
      ] },
      { nome: 'Novidades', itens: [
        'Aliado que aprende um golpe sozinho agora tem vontade própria: metade das vezes ele prefere ficar com o que já sabe, e quando troca, troca um golpe qualquer — nada de sempre descartar o mais fraco pelo mais forte.',
        'As três raças do Tauros de Paldea e o Darmanitan de Galar entraram nos Santuários, junto das outras formas regionais (agora são 57).'
      ] }
    ] },
  { versao: '2.1', data: '2026-09-23', titulo: 'A run não precisa acabar na vitória', piada: 'Os lendários abriram as portas do Santuário e serviram petisco. Continuam medindo você de cima a baixo, mas agora com cortesia.',
    secoes: [
      { nome: 'Novidades', itens: [
        'No Roguelike, vencer os lendários não encerra mais a run na marra: a vitória fica garantida na hora (o mapa seguinte libera do mesmo jeito) e você escolhe entre encerrar ou continuar explorando o Santuário que acabou de abrir.',
        'Se você seguir e desmaiar lá, a run termina em derrota — mas a Gen vencida continua fechada e liberada pras próximas runs. Dá pra encerrar em vitória quando quiser, pelo botão na tela da rota.',
        'Lendários e míticos encontrados no Santuário aceitam petisco e podem virar aliados, mas confiam bem mais devagar que um Pokémon comum: espere mais de uma dezena de ofertas.'
      ] },
      { nome: 'Correções', itens: [
        'O Disco Técnico não fazia nada para quem já tinha o Pokémon guardado no aparelho: os dados salvos antes da atualização não traziam a lista de golpes de MT, tutor e herança, e o jogo nunca ia buscá-la de novo. Agora esse registro é atualizado sozinho na primeira vez que você usa o item com internet.'
      ] }
    ] },
  { versao: '2.0', data: '2026-09-23', titulo: 'O Santuário: a Gen inteira, depois da vitória', piada: 'Os iniciais aceitaram sair do sindicato e voltar a aparecer — mas só no bairro nobre, e só para quem já venceu os lendários.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Cada mapa ganhou uma 11ª área, o 🏛 Santuário, que abre quando você vence os lendários daquela Gen. Nele vive a Gen inteira: todas as espécies, com as linhas evolutivas completas, mais os iniciais, os lendários e os míticos.',
        'As formas regionais entraram no jogo pela primeira vez: Alolan no Santuário de Alola, Galarian e Hisuian no de Galar, Paldean no de Paldea. São 53 formas que antes não existiam em lugar nenhum.',
        'A raridade de cada Pokémon no Santuário segue a dificuldade de captura da espécie, igual ao resto do jogo — comum aparece mais, raro aparece menos.',
        'Com isso, dá para encontrar todo Pokémon de uma Gen depois de fechá-la: nenhuma espécie fica inalcançável.'
      ] }
    ] },
  { versao: '1.9', data: '2026-09-23', titulo: 'Seus golpes, suas regras', piada: 'O tutor de golpes cobra caro, mas atende aliado também. Ele só pede que ninguém pergunte como um Magikarp aprendeu Bounce.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Escama do Coração (₽5.000): faz o Pokémon relembrar um golpe que ele já podia ter aprendido subindo de nível e que você deixou passar. Também aparece, bem raramente, entre os itens achados explorando.',
        'Disco Técnico (₽8.000, só na loja): ensina um golpe que a Pokédex diz que a espécie aprende por MT, tutor ou herança — golpes que nunca apareceriam subindo de nível. Cada Disco usado deixa o próximo ₽4.000 mais caro.',
        'Os dois funcionam em você e em qualquer aliado, e é você quem escolhe qual golpe sai pra dar lugar ao novo.'
      ] },
      { nome: 'Correções', itens: [
        'As abas ⚔ Luta / 💬 Registro / 📋 Painéis do celular foram removidas: elas escondiam dois terços da tela, então ver a ficha de um aliado no meio da luta obrigava a perder a batalha de vista. Agora a cena fica presa no topo e o resto da página (golpes, registro, ficha, aliados, mochila) rola normalmente por baixo.',
        'Os Alfas que eram formas evoluídas de inicial estavam anunciando um nome e aparecendo com o corpo de outro Pokémon. Agora o nome e a espécie do Alfa mudam sempre juntos.'
      ] }
    ] },
  { versao: '1.8', data: '2026-09-23', titulo: 'O jogo inteiro no bolso (e os iniciais em greve)', piada: 'Os iniciais se recusaram a continuar aparecendo no mato depois de tudo que passaram. Pikachu e Eevee furaram a greve e seguem trabalhando normalmente.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Dá pra baixar o JOGO INTEIRO pra jogar sem internet: ⚙ Ajustes → Jogar offline → "⬇⬇ Baixar o jogo inteiro". São os 9 mapas, com dados, golpes e sprites de todo mundo.',
        'O que o jogo guarda no aparelho saiu da caixinha apertada de antes e foi pro armazenamento grande do navegador — é o que permite guardar todos os sprites sem estourar o limite. A mesma tela mostra quanto espaço está em uso.',
        'Os iniciais das 9 regiões (e as evoluções deles) não aparecem mais soltos nas rotas: escolher o seu no começo da jornada volta a significar alguma coisa. Pikachu e Eevee continuam aparecendo normalmente.',
        'Treinadores de rota não têm mais só bicho da rota: metade da equipe deles pode ser qualquer espécie do mapa, sempre no nível da rota. Eles viajam, afinal.'
      ] },
      { nome: 'Correções', itens: [
        'Evolução agora entrega os golpes que ela deveria entregar: o golpe assinatura da forma nova (o King\'s Shield do Aegislash é o caso clássico) era perdido para sempre por quem evoluía acima do nível 1.',
        'A habilidade também acompanha a evolução direito, mantendo o slot — quem tinha habilidade oculta continua com a oculta. E o jogo avisa no registro quando ela muda de nome.',
        'No celular, os botões ⚔ Luta / 💬 Registro / 📋 Painéis pareciam mortos durante a batalha: eles funcionavam, mas o conteúdo nascia embaixo da parte visível da tela. Agora a tela acompanha o botão.',
        'Item sem imagem na PokéAPI (Coroa Galárica e companhia) mostra um ícone de caixinha no lugar do buraco que ficava antes.',
        'Se a internet cair bem na hora de uma evolução, ela não some mais: fica pendente, aparece na ficha e acontece sozinha assim que a rede volta.'
      ] }
    ] },
  { versao: '1.7', data: '2026-09-23', titulo: 'Sinal fraco não derruba mais a jornada', piada: 'O Porygon foi até a antena reclamar. Voltou com três barras de sinal e uma promessa.',
    secoes: [
      { nome: 'Correções', itens: [
        'Quando a internet do celular piscava, a exploração morria com um "Failed to fetch". Agora o jogo tenta de novo sozinho (até 3 vezes, com uma pausa entre elas) antes de desistir — o que resolve a maioria dessas falhas.',
        'As mensagens de erro de rede foram reescritas pra quem joga: falam de conexão instável, de limite da PokéAPI ou de erro do servidor, e lembram que dá pra baixar o mapa inteiro em ⚙ Ajustes → Jogar offline. A antiga instrução técnica sobre abrir o jogo dentro de um chat saiu.',
        'Os avisos de "sem internet" do Alfa, dos lendários e da exploração agora apontam pro download offline, em vez de só dizer que não dá.',
        'O menu ☰ do celular estava com menos opções do que as telas ofereciam. Agora ele mostra os mesmos acessos: Início, Jornadas, Carreira, Ranking, Multiplayer, Conta, Novidades, Ajustes e Bugs — além de Layout e Novo jogo.'
      ] }
    ] },
  { versao: '1.6', data: '2026-09-23', titulo: 'Telas, proteções e armadilhas', piada: 'As Pedras Afiadas agora cobram pedágio na entrada. O sindicato dos Charizard já entrou com recurso.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Cada lado da batalha passou a ter o seu campo, e o que está no ar aparece no topo da luta: 🛡 do seu lado, ⚔ do lado do inimigo.',
        'Telas: Reflect corta pela metade o dano dos golpes físicos, Light Screen o dos especiais e Aurora Veil os dois (mas só funciona no granizo ou na neve). Duram 5 turnos e não empilham.',
        'Safeguard bloqueia status vindos do inimigo por 5 turnos — e não atrapalha quando você mesmo se põe pra dormir com Rest.',
        'Mist impede o inimigo de baixar os seus atributos, e Tailwind dobra a velocidade do seu lado por 4 turnos.',
        'Armadilhas de entrada: Stealth Rock machuca conforme a fraqueza de quem entra (dobra em Voador!), Spikes empilha até 3 camadas e Toxic Spikes até 2 (a segunda envenena gravemente). Quem é Venenoso e anda no chão limpa os espinhos venenosos ao entrar.',
        'As armadilhas pegam o próximo Pokémon que entra em campo, ou seja, os do treinador e a fila de lendários. Como você nunca troca de Pokémon, o jogo avisa na hora de usar que, do seu lado, não há em quem pegar.'
      ] }
    ] },
  { versao: '1.5', data: '2026-09-22', titulo: 'O inimigo aprendeu a mirar', piada: 'Os Pokémon selvagens fizeram um curso rápido. O Magikarp assistiu, mas continua no Splash.',
    secoes: [
      { nome: 'Equilíbrio', itens: [
        'O inimigo não sorteia mais qualquer golpe: agora ele tende a escolher o que dá mais dano em você, olhando tipo e eficácia.',
        'O quanto ele acerta a escolha depende de quem é: selvagem erra bastante (metade das vezes), treinador pensa melhor, e Alfa e lendário quase sempre escolhem o melhor golpe. Vale também nas batalhas multiplayer.'
      ] }
    ] },

  { versao: '1.4', data: '2026-09-22', titulo: 'O chão também entrou na briga', piada: 'O Campo de Grama foi aparado. O jardineiro de Paldea agradece as mensagens de carinho.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Chegaram os terrenos: Campo Elétrico, Campo de Grama, Campo Psíquico e Campo de Névoa, que duram 5 turnos e aparecem no topo da luta junto do clima.',
        'Campo Elétrico deixa os golpes Elétricos 30% mais fortes e ninguém dorme; Campo de Grama fortalece golpes de Planta e cura um pouquinho todo turno; Campo Psíquico fortalece os Psíquicos e barra golpes de prioridade; Campo de Névoa corta o dano de Dragão pela metade e bloqueia qualquer status.',
        'Tudo isso só vale pra quem está NO CHÃO: Pokémon do tipo Voador e quem tem Levitate flutuam e ficam de fora — inclusive da cura e da proteção.',
        'Os golpes Electric Terrain, Grassy Terrain, Psychic Terrain e Misty Terrain funcionam, e as habilidades Electric Surge, Grassy Surge, Psychic Surge e Misty Surge ligam o campo assim que o Pokémon aparece. Surge Surfer dobra a velocidade no Campo Elétrico.'
      ] }
    ] },
  { versao: '1.3', data: '2026-09-22', titulo: 'Offline de verdade e itens mais fáceis de achar', piada: 'O Porygon foi baixado com sucesso. Ele pediu pra avisar que agora mora no seu aparelho.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Em ⚙ Ajustes tem uma seção nova: baixe um mapa inteiro (Pokémon, golpes e sprites) pra jogar sem internet sem faltar nada. Antes, offline, só aparecia quem você já tinha encontrado — e Pokémon novo ficava sem imagem.',
        'A tela mostra quantos Pokémon daquele mapa já estão guardados no aparelho e marca com ✅ os mapas completos.',
        'A ficha agora tem atalho: se você tem um item pra segurar na mochila, dá pra equipar direto ali, sem procurar.',
        'Uma Fruta Oran pode ser achada explorando, então a mecânica de segurar item aparece mesmo pra quem não passou na loja.',
        'A loja ganhou uma frase explicando cada divisão (para segurar, evolução, exploração).'
      ] }
    ] },
  { versao: '1.2', data: '2026-09-22', titulo: 'Agora chove', piada: 'O departamento meteorológico de Kanto pede desculpas pelos 30 anos de sol constante.',
    secoes: [
      { nome: 'Novidades', itens: [
        'As batalhas agora têm clima: sol forte, chuva, tempestade de areia, granizo e neve. Ele aparece no topo da luta, com quantos turnos ainda faltam.',
        'Sol deixa os golpes de Fogo 50% mais fortes e afraquece os de Água; a chuva faz o contrário. Areia e granizo machucam todo turno quem não for do tipo certo, e a neve dá mais Defesa pros Pokémon de Gelo.',
        'Rain Dance, Sunny Day, Sandstorm, Hail e Snowscape funcionam: ligam o tempo por 5 turnos, valendo pros dois lados.',
        'Habilidades de clima entraram em peso: Drizzle, Drought, Sand Stream e Snow Warning mudam o tempo assim que o Pokémon aparece; Swift Swim, Chlorophyll, Sand Rush e Slush Rush dobram a velocidade no tempo certo; Rain Dish, Ice Body e Dry Skin curam; Sand Veil e Snow Cloak fazem o inimigo errar mais; Hydration limpa status na chuva; Leaf Guard protege no sol; Solar Power troca poder por HP.',
        'Thunder e Hurricane nunca erram na chuva (e ficam bem imprecisos no sol) e Blizzard acerta sempre no granizo e na neve. Solar Beam e Solar Blade disparam na hora quando está sol.'
      ] },
      { nome: 'Correções', itens: [
        'A habilidade Dry Skin estava escrita duas vezes na tabela interna, e a segunda apagava a primeira. Agora ela cura na chuva e sofre no sol, como deveria.'
      ] }
    ] },
  { versao: '1.1', data: '2026-09-22', titulo: 'Celular, sala mais firme e Caça Shiny', piada: 'Um Fake Out estava sendo usado até no meio da conversa. Agora ele só assusta uma vez, como manda a boa educação.',
    secoes: [
      { nome: 'Novidades', itens: [
        'No celular, a batalha virou tela fixa: a cena do combate fica presa no topo e os golpes na parte de baixo, então dá pra ver o seu Pokémon e o inimigo enquanto escolhe o que fazer, sem rolar a tela.',
        'Ainda no celular, três abas embaixo da cena decidem o que ocupa o meio: ⚔ Luta (registro curtinho), 💬 Registro (o registro inteiro) e 📋 Painéis (ficha, missões, aliados e mochila). O registro continua ali, só que sem atrapalhar.',
        'Novo modo 🎯 Caça Shiny, ligado no começo da jornada: quando você revelar todas as espécies de uma rota, escolhe UMA delas pra ser a única que aparece por ali. Bom pra caçar shiny — ou pra farmar uma espécie específica. Muda só o selvagem: treinador, item e dinheiro continuam aparecendo igual.',
        'Dois repelentes na loja: o Seletivo (30 explorações) deixa passar só a espécie que você escolher da rota, e o Total (40 explorações) espanta todos os selvagens. Com eles ligados você segue achando treinadores, itens e dinheiro normalmente.',
        'Na sala multiplayer agora tem Centro Pokémon: dá pra curar a equipe entre as lutas sem sair da sala.'
      ] },
      { nome: 'Correções', itens: [
        'Dava pra escapar de qualquer batalha "sem fuga" — treinador, Alfa, lendário — só recarregando a página. A batalha em andamento agora vai junto no save e volta do jeito que estava, no mesmo turno.',
        'Fake Out (e First Impression) só funcionam no primeiro golpe da batalha. Antes dava pra usar em qualquer turno e fazer o inimigo recuar sempre.',
        'Sala multiplayer: as escolhas às vezes não chegavam no anfitrião e o turno só saía quando o prazo de 45 segundos estourava. Agora cada mensagem é reenviada quando falha, o anfitrião repete o estado da luta de tempos em tempos e existe um botão 🔄 Sincronizar.',
        'Trocar de aba não derruba mais você da sala: a conexão tenta voltar sozinha, e o jogo espera o anfitrião reaparecer antes de encerrar a sala.',
        'A sala mostra o estado da conexão (conectado / instável / sem conexão) e tem um diagnóstico com as últimas mensagens trocadas, pra dar pra saber o que aconteceu quando algo falha.'
      ] }
    ] },
  { versao: '1.0', data: '2026-09-22', titulo: 'Itens para segurar, mochila arrumada e estas notas', piada: 'Um Snorlax segurando Restos entrou em recursão e quase comeu o servidor. Já foi contido.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Cada Pokémon da equipe pode segurar um item, que age sozinho na batalha. São 13 para começar: Restos, Lodo Negro, Orbe da Vida, Faixa de Foco, Sino-Concha, Elmo Rochoso, Cinto do Perito, Faixa Muscular, Óculos do Sábio, Colete de Assalto e as frutas Oran, Sitrus e Lum.',
        'Para equipar: na mochila, divisão 🎒 Para segurar, toque em "Segurar" e escolha quem leva. A ficha mostra o que cada um está segurando, com um botão para guardar de volta.',
        'As frutas são comidas sozinhas na hora do aperto: Oran e Sitrus quando o HP cai à metade, Lum quando você pega qualquer status.',
        'A mochila e a loja agora têm divisões: 🧪 Cura e status, ⚔ Em batalha, 🎒 Para segurar, 💎 Evolução, 🍖 Petiscos e ✨ Especiais. Fica bem mais fácil achar as coisas.',
        'Nova tela 📜 Novidades: estas notas de atualização, para você acompanhar o que muda no jogo a cada leva.'
      ] },
      { nome: 'Equilíbrio', itens: [
        'O Orbe da Vida bate 30% mais forte, mas cobra 10% do seu HP máximo a cada golpe. O Colete de Assalto dá 50% de Defesa Especial, mas tranca os golpes de status. Escolha com carinho.'
      ] }
    ] },

  { versao: '0.9', data: '2026-09-19', titulo: 'Um mapa para cada geração', piada: 'Os lendários exigiram um camarim maior, então demos uma rota inteira só para eles.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Agora existe um mapa para cada geração — Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar e Paldea —, cada um com 10 rotas que vão abrindo conforme você sobe de nível, do 2 até por volta do 62.',
        'Os selvagens de cada mapa são os daquela geração, cada um colocado na rota que combina com o nível e o tipo dele. Nenhuma rota tem todo mundo: para conhecer todos os Pokémon, você passa pelos vários mapas.',
        'A última rota de cada mapa guarda os lendários da geração. Você enfrenta até quatro em sequência, e o principal (Mewtwo, Ho-Oh, Rayquaza…) vem por último, bem mais forte que os outros.',
        'Vencer os lendários fecha a geração e vale 2000 pontos. Fora do Roguelike, você escolhe qual mapa quer encarar em seguida e continua com a mesma equipe: as rotas do mapa novo começam no seu nível e sobem até o 100.',
        'No Roguelike, derrubar os lendários termina a jornada em vitória e libera o mapa da geração seguinte para as próximas runs.',
        'Pokédex da rota: cada espécie aparece como "?" até você enfrentá-la, vira silhueta depois do primeiro encontro e só fica colorida, com a taxa de aparição daquela rota, quando você derrota 10 dela somando todas as suas jornadas.',
        'Míticos como Mew e Celebi podem aparecer nas duas rotas mais altas de cada mapa, mas raríssimo (cerca de 4 em cada 1000 encontros). E toda rota tem o seu Alfa: o dobro de HP, 30% a mais no resto, atributos perfeitos e prêmio na primeira vitória.'
      ] },
      { nome: 'Correções', itens: [
        'A antiga Fenda Dimensional saiu do jogo. Quem tinha uma jornada parada lá recomeça a explorar pela primeira rota, sem perder nada.'
      ] }
    ] },

  { versao: '0.8', data: '2026-09-09', titulo: 'Golpes especiais funcionando de verdade', piada: 'Corrigido um bug em que Explosion era só um susto seguido de um pedido de desculpas.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Todos os golpes que algum Pokémon aprende por nível foram conferidos um a um contra o motor de batalha. A primeira leva de correções entrou agora, e o que ainda falta (clima, terrenos, itens segurados e golpes de lado do campo) já está mapeado para as próximas atualizações.'
      ] },
      { nome: 'Correções', itens: [
        'Protect, Detect e a turma toda protegem de verdade: o golpe do inimigo simplesmente falha. Usar várias vezes seguidas fica cada vez menos confiável, como nos jogos.',
        'Rest cura todo o HP e o status e faz você dormir dois turnos. Endure garante sobrar com 1 de HP no turno, e Focus Energy aumenta mesmo a sua chance de crítico até o fim da batalha.',
        'Explosion, Self-Destruct e Memento derrubam quem usa. O sacrifício agora é um sacrifício.',
        'Toxic envenena gravemente e o dano cresce a cada turno. Leech Seed drena um pedaço do HP do alvo por turno para quem plantou, e Pokémon do tipo Planta são imunes. Dream Eater só funciona com o alvo dormindo.',
        'Golpes de dois turnos (Solar Beam, Sky Attack, Fly, Dig, Dive…) carregam num turno e saem no seguinte, e quem voa ou cava fica fora de alcance enquanto isso. Hyper Beam, Giga Impact e parecidos obrigam a recarregar depois — mas só se o golpe tiver acertado.',
        'Thrash, Outrage e Petal Dance atacam sozinhos por dois ou três turnos e deixam quem usou confuso no fim. Fissure, Guillotine, Sheer Cold e Horn Drill voltaram a derrubar de um golpe só, com chance ligada à diferença de nível — e nunca funcionam contra quem é mais forte que você.'
      ] },
      { nome: 'Equilíbrio', itens: [
        'Poder variável de verdade em Flail, Reversal, Eruption, Water Spout, Gyro Ball, Electro Ball, Hex, Facade, Venoshock e Brine: agora eles olham o HP, a velocidade ou o status antes de decidir a força. Endeavor iguala o HP do alvo ao seu.'
      ] }
    ] },

  { versao: '0.7', data: '2026-08-26', titulo: 'Evoluções especiais', piada: 'Kadabra finalmente aceitou que o Cabo de Conexão conta como troca. Machoke ainda resmunga.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Chegaram as 10 pedras de evolução (Fogo, Água, Trovão, Folha, Lua, Sol, Brilhante, Crepúsculo, Aurora e Gelo) e itens como a Maçã Doce, o Bule Rachado e a Armadura Auspiciosa. As pedras e o Cabo de Conexão são vendidos na loja; o resto você acha explorando, da quarta rota em diante, e como prêmio de Alfa.',
        'O Cabo de Conexão simula a troca e evolui quem só evolui assim: Kadabra, Machoke, Graveler, Haunter e companhia. Alguns pedem também um item na mochila (Metal Coat, Escama de Dragão…), que é gasto junto, e outros pedem o parceiro na equipe, como Karrablast com Shelmet.',
        'Cada Pokémon agora tem um vínculo de 0 a 255, que sobe a cada nível e a cada vitória e aparece na ficha. Com 160 ou mais evoluem Golbat, Pichu e Eevee — Espeon de dia, Umbreon à noite.',
        'A hora do dia conta: o jogo usa o relógio do seu aparelho, com dia das 6h às 18h e noite das 18h às 6h.',
        'Outras condições dos jogos também valem: saber um golpe específico, ter um aliado de certa espécie ou tipo, comparar Ataque com Defesa (o caso do Tyrogue) e segurar determinados itens.',
        'Shedinja: quando Nincada vira Ninjask, a casca ganha vida. Se houver vaga na equipe, Shedinja entra sozinho como aliado; com a equipe cheia, você escolhe em qual dos dois o seu Pokémon vira.',
        'Evoluções que dependiam de coisas que este jogo não tem ganharam uma regra equivalente: Sirfetch\'d com 3 críticos numa batalha, Runerigus ao aguentar 49 de dano, Kingambit ao derrotar 3 Bisharp e Annihilape sabendo Rage Fist. A ficha mostra exatamente o que falta para cada evolução possível.',
        'Os seus aliados também evoluem, e o jogo sempre pergunta antes de deixar acontecer.'
      ] }
    ] },

  { versao: '0.6', data: '2026-08-13', titulo: 'Jornadas salvas, navegação e fontes', piada: 'Corrigido um bug em que Slowpoke demorava três dias para abrir a lista de jornadas.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Dá para ter várias jornadas em andamento ao mesmo tempo. Em "Novo jogo", escolha "Guardar e começar outra" (nada se perde) ou "Encerrar". Cabem até 12 guardadas.',
        'Nova tela 💾 Jornadas salvas, com "Continuar" e "Excluir" em cada uma. Com conta, todas ficam na nuvem e seguem com você para outro aparelho.',
        'Quando chega uma jornada de outro aparelho, você decide o que fazer: continuar nela, guardar pra depois (e o jogo não pergunta de novo) ou excluir. Nada é descartado sem a sua escolha.',
        'Voltar para o 🏠 Início com uma jornada aberta não perde mais nada: ela é guardada sozinha e reaparece na lista.',
        'Toda tela fora do jogo — Carreira, Ranking, Conta, Jornadas salvas, Multiplayer, Bugs e Ajustes — começa com a mesma barra, com "← Voltar" e atalhos para as outras. A tecla Esc também volta.',
        'Nova tela ⚙ Ajustes com seis fontes à escolha, incluindo a Atkinson Hyperlegible (feita para baixa visão), a Lexend (para textos longos), a Andika (ajuda quem tem dislexia) e uma monoespaçada para comparar números. Cada opção já aparece escrita na própria fonte, vale para o jogo inteiro e fica salva neste navegador.'
      ] },
      { nome: 'Correções', itens: [
        'No celular, o menu ☰ fecha sozinho ao tocar num botão, ao tocar fora dele ou com Esc, em vez de ficar aberto por cima da tela seguinte.'
      ] }
    ] },

  { versao: '0.5', data: '2026-07-30', titulo: 'Habilidades com efeito de verdade', piada: 'Wonder Guard deixou de ser uma sugestão. Shedinja agradece e pede para não ser lembrado disso.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Cerca de 60 habilidades passaram a ter efeito de verdade na batalha, e funcionam igualzinho no jogo sozinho e no multiplayer. A ficha marca quais das suas estão ativas.',
        'Ataque: Overgrow, Blaze, Torrent e Swarm dão o gás quando o HP fica baixo; Adaptability, Technician, Huge Power, Hustle, Guts, Sniper, Tinted Lens, Skill Link, Serene Grace e Rock Head mudam dano, crítico, precisão e recuo.',
        'Defesa: Thick Fat, Filter, Multiscale, Sturdy (que segura o nocaute com o HP cheio) e Wonder Guard, que só deixa passar golpe supereficaz.',
        'Absorção de tipo: Levitate, Flash Fire, Volt Absorb, Water Absorb, Lightning Rod, Motor Drive e Sap Sipper transformam o golpe do inimigo em nada — ou em vantagem para você.',
        'Imunidade a status (Immunity, Limber, Insomnia, Own Tempo) e atributos que não caem (Clear Body, Hyper Cutter).',
        'Contato e fim de turno: Static, Flame Body e Rough Skin castigam quem encosta em você; Speed Boost e Shed Skin agem ao fim de cada turno. Intimidate e Run Away também entraram.'
      ] },
      { nome: 'Correções', itens: [
        'Golpes, status e mudanças de atributo passaram a ser resolvidos por um motor só: o que acontece numa batalha sozinho acontece exatamente igual numa batalha com outros jogadores.',
        'Golpe ou habilidade que ainda não tem efeito diz isso com todas as letras, em vez de fingir que funcionou.'
      ] }
    ] },

  { versao: '0.4', data: '2026-07-16', titulo: 'Ícone, amigos e canal de bugs', piada: 'Corrigido um bug em que os Ditto se transformavam no ícone de outro jogador.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Escolha o seu ícone entre os 1025 Pokémon, normal ou ✨ shiny. Ele aparece no topo da tela, no ranking, nas salas de multiplayer e para os seus amigos.',
        'Amigos por código: cada conta tem um código de 6 caracteres. Adicione alguém pelo código e a pessoa aceita ou recusa.',
        'Na sala de multiplayer, o anfitrião chama um amigo com um toque, e o convite chega em qualquer tela do jogo — é só clicar em "Entrar".',
        'Nova tela 🐞 Bugs e sugestões, na tela inicial e no topo do jogo: escolha entre "Bug" e "Sugestão", dê um título e descreva o que aconteceu. Não precisa de conta.',
        'Nos bugs dá para anexar um resumo técnico (versão, navegador, tela em que você estava, Pokémon e as últimas linhas do registro, sem nada pessoal) — e você vê exatamente o que vai junto antes de enviar.',
        'Sem internet, o relato fica guardado no aparelho e é enviado sozinho quando a conexão volta.'
      ] },
      { nome: 'Correções', itens: [
        'Sem conta, o ícone fica salvo só no seu navegador — e sobe para a conta no primeiro login, sem você precisar escolher de novo.'
      ] }
    ] },

  { versao: '0.3', data: '2026-06-30', titulo: 'Multiplayer: co-op e PvP', piada: 'Removido o Magikarp que entrava nas salas só para dar Splash em todo mundo.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Multiplayer por sala: um jogador cria e passa o código de 4 letras, e até 6 pessoas entram. Não precisa de conta.',
        'Co-op: chame amigos para a sua jornada e lutem juntos contra os selvagens (um para cada jogador) ou contra o Alfa da rota, que vem reforçado para aguentar o grupo todo.',
        'PvP: cada um escolhe o Time A ou o Time B. Dá para fazer 1×1, 2×2, 3×3 e até times desiguais, como 2×1 e 3×2.',
        'Você leva de 1 a 3 Pokémon: só o principal ou também os seus aliados.',
        'Balancear, ligado por padrão: no co-op todo mundo fica no nível do Pokémon do anfitrião, então um amigo forte não atropela a sua run; no PvP todos ficam no nível médio da luta e o time em menor número ganha HP extra. Desligado, valem os níveis reais e os inimigos acompanham o mais forte do grupo.',
        'Entre com o Pokémon da sua jornada (e a luta conta para ela) ou com um convidado, emprestado só para aquela sala e que não mexe em nada. Sem jornada em andamento, dá para entrar direto com um convidado.'
      ] },
      { nome: 'Equilíbrio', itens: [
        'Ganhos do co-op — XP, EVs, dinheiro, itens e prêmio de Alfa — voltam com você para a sua jornada quando lutou no seu nível real. Com o nível ajustado pelo Balancear, a luta vale pela diversão.',
        'O PvP é amistoso: não gasta HP nem PP, só conta vitórias e derrotas, e dá para desistir. Cada um escolhe o golpe e o alvo dos seus Pokémon, e o turno sai quando todos escolherem ou em 45 segundos, no automático.'
      ] }
    ] },

  { versao: '0.2', data: '2026-06-11', titulo: 'Roguelike e ranking global', piada: 'O ranking passou a recusar pontuações impossíveis. Sim, aquele Bidoof de nível 340 era você.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Chegou o modo Roguelike, agora o principal do jogo: cada jornada é uma run. Você começa só com os iniciais e, jogando, vai desbloqueando novas espécies para as próximas runs.',
        'Para desbloquear uma espécie: derrote 10 dela, faça amizade com 5 ou evolua 5 vezes para a forma do meio (como Charmeleon) e 10 vezes para a forma final (como Charizard). Os contadores somam todas as suas jornadas, e só as do Roguelike contam.',
        'A tela inicial mostra o que você já desbloqueou e o que está "quase lá", a tela de fim mostra o que aquela run liberou, e a Carreira reúne todo o progresso.',
        'Ranking global: a melhor jornada de cada jogador, geral ou por espécie, com a sua posição destacada. Dá para olhar sem conta; para aparecer nele, é só entrar e terminar jornadas.'
      ] },
      { nome: 'Equilíbrio', itens: [
        'No Roguelike não existe segunda chance: se você desmaiar, a run acaba (nem Revive salva), um aliado que desmaia é perdido para sempre e ser capturado também encerra tudo.',
        'O Roguelike começa no nível 5, tem Centro Pokémon pago com 10% de desconto por vitória e vale 1,5× de pontos no fim.'
      ] },
      { nome: 'Correções', itens: [
        'A pontuação do ranking é recalculada no servidor a partir dos números da jornada, e valores impossíveis são recusados. Uma jornada recusada não trava o envio das outras.'
      ] }
    ] },

  { versao: '0.1', data: '2026-05-20', titulo: 'O começo: você é o Pokémon', piada: 'Zubat continuam aparecendo o tempo todo. Isso não é bug, é tradição.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Primeira versão do PokéRPG: aqui você é o Pokémon, sem treinador e sem Pokébola. Escolha entre os iniciais das nove regiões, mais Pikachu e Eevee, e saia explorando as rotas.',
        'Batalha por turnos com prioridade e velocidade, precisão e evasão, crítico, estágios de atributo, status (queimado, envenenado, paralisado, dormindo, congelado e confuso) e dano no fim do turno.',
        'Treinadores caçadores aparecem enquanto você explora, com 1 a 3 Pokémon e Pokébolas. Com o seu HP pela metade, eles podem tentar te capturar — e a chance depende da taxa de captura da sua espécie.',
        'Amizade e aliados: ofereça a um selvagem um petisco que o tipo dele goste e, com a amizade cheia, ele passa a te seguir (até 2 aliados). Eles lutam no mesmo turno que você, ganham XP e aceitam ordens como "Pegar leve", "Só status" e "Descansar".',
        'Rotas que abrem por nível, Alfas para desafiar, 36 missões que vão aparecendo conforme você joga, Centro Pokémon, loja, mochila e shiny em 1 a cada 4096 encontros.',
        'Conta com Google ou link por e-mail: a carreira e a jornada em andamento ficam salvas na nuvem e seguem para outro aparelho. E, depois do primeiro acesso, o jogo abre e roda mesmo sem internet.',
        'Os painéis (Ficha, Missões, Aliados, Mochila e Registro) podem ser arrastados, redimensionados, recolhidos e trocados de coluna, com o botão "↺ Layout" para voltar ao padrão; no celular tudo vira uma coluna só. E a tela 📊 Carreira guarda Pokémon favorito, Pokédex, shinies, nível máximo, tempo total e o seu melhor resultado por espécie.'
      ] },
      { nome: 'Equilíbrio', itens: [
        'Cinco modos de dificuldade — Fácil, Médio, Difícil, Hardcore e o 🎲 Full Randomizer, que sorteia até a sua espécie —, mudando se o treinador pode te capturar, o custo do Centro, quantos desmaios você aguenta e a pontuação final. As contas seguem as fórmulas dos jogos: atributos com IV, EV e natureza, dano com STAB, tipos e crítico, XP por curva de crescimento e captura da terceira e quarta gerações.'
      ] }
    ] }
];
