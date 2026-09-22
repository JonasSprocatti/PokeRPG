/* GERADO A MÃO: notas de atualização mostradas na tela 📜 Novidades (tela-patchnotes.js).
   Mais nova primeiro. `versao` = rótulo curto, `data` = AAAA-MM-DD, `titulo` = manchete curta,
   `piada` = uma linha de humor no estilo "nota de bugfix absurda", `secoes` = [{ nome, itens: [texto] }]. */
export const PATCH_NOTES = [
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
