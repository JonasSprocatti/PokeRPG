/* GERADO A MÃO: notas de atualização mostradas na tela 📜 Novidades (tela-patchnotes.js).
   O texto de cada ITEM aceita HTML simples (<b>, <br>) e é mostrado sem escapar — o conteúdo é escrito aqui,
   versionado junto com o código, e não vem de fora. Título, versão, seção e piada são escapados e devem ser
   texto puro.
   Mais nova primeiro. `versao` = rótulo curto, `data` = AAAA-MM-DD, `titulo` = manchete curta,
   `piada` = uma linha de humor no estilo "nota de bugfix absurda", `secoes` = [{ nome, itens: [texto] }]. */
export const PATCH_NOTES = [
  { versao: '2.32', data: '2026-09-25', titulo: 'Os 14 chefes da semana', piada: 'O Zygarde pediu para constar que a fila é longa mas ele não tem pressa: ele se regenera enquanto espera.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Agora são <b>14 chefes</b>, um por semana, e depois do último a lista recomeça: Eternatus Eternamax → Mega Rayquaza → Groudon Primal → Kyogre Primal → Mega Mewtwo → Necrozma Ultra → Calyrex Cavaleiro Espectral → Zacian Coroada → Kyurem Negro → Giratina Origem → Dialga Origem → Terapagos Estelar → Ursaluna Lua de Sangue → Zygarde Completo. Cada um aparece na rota final da Gen dele.',
        'Cada chefe tem a sua mecânica: <b>Groudon e Kyogre</b> nascem com Sol e Chuva permanentes e anulam Água e Fogo; o <b>Giratina</b> abre o <b>Mundo Reverso</b> (a tabela de tipos inverte); o <b>Terapagos</b> resiste ao tipo do último golpe; a <b>Ursaluna</b> se cura com o dano que causa; o <b>Zygarde</b> se regenera; o <b>Calyrex</b> cresce a cada Pokémon seu que derruba; Necrozma, Mewtwo, Kyurem e Rayquaza têm pontos fracos que mudam.',
        'Três <b>itens de raide</b>, dados como prêmio pelos chefes e só válidos na luta deles (um de cada por luta): <b>Cristal de Ruptura</b> (expõe o chefe na hora), <b>Selo de Interrupção</b> (corta o golpe que ele está carregando) e <b>Escudo Astral</b> (o próximo golpe carregado causa metade do dano no time todo). No co-op qualquer jogador do grupo pode usar, sem gastar o turno.'
      ] }
    ] },
  { versao: '2.31', data: '2026-09-25', titulo: 'Chefes em grupo e a agenda da semana', piada: 'A Rayquaza pediu para constar que ela não é atrasada: só prefere fazer entrada dramática numa segunda-feira.',
    secoes: [
      { nome: 'Novidades', itens: [
        '<b>O evento semanal começa na segunda 28/09/2026</b> (e vira toda segunda-feira à meia-noite, horário de Brasília). Até lá há só o aviso do primeiro chefe — <b>Eternatus Eternamax</b> — na tela inicial e na rota final da Gen 8. A tela inicial mostra a <b>agenda dos próximos 3 chefes</b> com as datas.',
        'Segundo chefe: a <b>Mega Rayquaza</b> (Gen 3, a partir de 05/10). Ela não tem couraça: tem um <b>ponto fraco que muda a cada duas ações</b> (só o tipo da vez machuca de verdade, os outros são reduzidos) e o <b>Dragon Ascent</b> carregado, que atinge o grupo inteiro. Vencer dá a insígnia <b>Guardião do Pilar Celeste</b> e libera a Rayquaza pra começar jornadas.',
        '<b>Chefe no co-op:</b> na sala, o botão ☄ desafia o chefe da semana com o grupo. O HP dele cresce com o número de jogadores, mas menos que proporcional — jogar junto compensa. O golpe carregado atinge <b>o time todo</b>. Quem ficar sem nenhum Pokémon de pé pode <b>usar um Revive</b> (até 3 por luta) enquanto os outros seguram, e volta com metade do HP.',
        'A insígnia de evento que você escolheu mostrar aparece ao lado do seu nome também <b>na sala do multiplayer</b>, na <b>lista de amigos</b> e no <b>ranking</b>. O servidor só mostra a insígnia de quem realmente venceu aquele chefe.'
      ] }
    ] },
  { versao: '2.30', data: '2026-09-25', titulo: 'O céu racha: chefe da semana', piada: 'O Eternatus pediu para avisar que não é ele que está atrasado: é o resto do universo que chegou cedo.',
    secoes: [
      { nome: 'Novidades', itens: [
        '<b>Evento semanal:</b> o primeiro chefe é o <b>Eternatus Eternamax</b>, na rota final da <b>Gen 8</b>, só no <b>Roguelike</b> e no <b>Hardcore</b>. Ele aparece numa caixa roxa brilhante acima dos lendários, e o mapa da Gen mostra o sprite dele na escolha de mapa. Uma tentativa a cada <b>8 horas</b>.',
        'O chefe é <b>muito difícil</b>: uma <b>couraça de energia</b> que corta o dano até se romper (a <b>Ruptura</b> deixa ele exposto), o <b>Eternabeam</b> carregado com aviso — dá pra interromper causando dano suficiente no mesmo turno — e <b>três fases</b>. É imune a status e não dá pra fugir. Perder não encerra a sua jornada.',
        'Derrotar o chefe libera o <b>Eternatus</b> na Pokédex e pra começar jornadas, dá a insígnia <b>Domador do Infinito</b> (título incluído) e um prêmio uma vez por semana. Na tela 👤 Conta você vê todas as insígnias de evento e escolhe <b>uma</b> pra mostrar ao lado do seu nome.'
      ] },
      { nome: 'Correções', itens: [
        '<b>Sucker Punch</b> (e Thunderclap) agora só funciona se o alvo escolheu um golpe de dano neste turno e ainda não agiu. Antes era só um golpe de prioridade que nunca falhava.'
      ] }
    ] },
  { versao: '2.29', data: '2026-09-25', titulo: 'Parceiros em foco', piada: 'O esconderijo pediu um cartaz de "lotado". O Snorlax na porta diz que ainda cabe mais um.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Três badges novas de <b>parceiros</b> na tela 🏅 Conquistas: <b>Casa cheia</b> (feche uma Gen com a equipe e o esconderijo lotados), <b>Lobo solitário</b> (feche uma Gen sem recrutar ninguém) e <b>Cemitério de parceiros</b> (perca 15 parceiros numa mesma run). Fora do modo Fácil.'
      ] },
      { nome: 'Correções', itens: [
        'O botão <b>📦 Guardar</b> do esconderijo não fazia nada (e o ↩ Trazer também): a função não estava ligada ao clique. Corrigido.'
      ] }
    ] },
  { versao: '2.28', data: '2026-09-25', titulo: 'Insígnia do Alpha', piada: 'A Poké Ball dourada garante que é de ouro maciço. O Meowth já pediu para avaliar, por precaução.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Quem criou a conta durante o Alpha ganha a <b>Insígnia Alpha</b>: uma Poké Ball dourada com o α, num cartão na tela 👤 Conta e uma versão pequena ao lado do seu nome no topo. Ela é sua para sempre — quem entrar depois que o Beta abrir não consegue.',
        'Corrigido o aviso de <b>jornadas de outro aparelho</b> que voltava depois de guardar ou excluir: a sincronização rodava duas vezes ao mesmo tempo e perguntava de novo.'
      ] }
    ] },
  { versao: '2.27', data: '2026-09-25', titulo: 'Escolha o seu tempo', piada: 'O treinador da Rota 3 pediu desculpas por ter chegado de Mega tão cedo. Disse que estava ansioso.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Nova opção na tela inicial: <b>🌦 Clima e terreno das rotas</b>. No <b>Roguelike</b> e no <b>Hardcore</b> ela é sempre ligada; nos outros modos vem <b>desligada</b> e você liga se quiser. Só dá pra escolher no começo da jornada.'
      ] },
      { nome: 'Equilíbrio', itens: [
        'A <b>Mega Evolução do inimigo</b> (treinadores, Alfas e lendários) agora só acontece de <b>nível 40 em diante</b>. Antes, treinadores das primeiras rotas já megaevoluíam. Tera, Z-Move e Gigantamax não mudaram.'
      ] }
    ] },
  { versao: '2.26', data: '2026-09-25', titulo: 'O tempo das rotas', piada: 'A Caverna Gelada avisa que o granizo é cortesia da casa. O guarda-chuva do Psyduck continua sendo cobrado à parte.',
    secoes: [
      { nome: 'Novidades', itens: [
        '<b>Clima e terreno de rota:</b> 27 rotas já começam a luta com o tempo da paisagem — neve nas geladas, <b>tempestade de areia</b> nos desertos, <b>sol forte</b> nos vulcões e praias, chuva nos lagos e pântanos — e 20 com terreno próprio (grama nos bosques, elétrico nas usinas, psíquico nas ruínas, névoa em Rivière e Glimwood). Vale para os dois lados, no single player e no multiplayer co-op.',
        'O efeito da rota é <b>permanente</b>: só sai quando um golpe ou habilidade troca o tempo ou o chão. A troca dura os 5 turnos de sempre e, quando acaba, a rota volta ao que era. O selo na cena mostra <b>da rota</b> no lugar da contagem de turnos.',
        '<b>Weather Ball</b> muda de tipo e dobra o poder conforme o tempo (Fogo no sol, Água na chuva, Pedra na areia, Gelo no granizo e na neve), e o botão do golpe mostra o tipo de agora.',
        '<b>Castform</b> agora muda de forma com o tempo (Forecast): vira Fogo no sol, Água na chuva e Gelo no granizo ou na neve — os tipos e o sprite acompanham, inclusive o tempo da rota, e ele volta ao normal no fim da luta.'
      ] }
    ] },
  { versao: '2.25', data: '2026-09-25', titulo: 'Habilidades de verdade', piada: 'O Slakoth pediu para constar que a nova habilidade dele está funcionando perfeitamente. Ele descansou, para provar.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Mais de <b>40 habilidades</b> passam a valer em batalha, entre elas <b>Moxie</b>, <b>Defiant</b>, <b>Competitive</b>, <b>Contrary</b>, <b>Simple</b>, <b>Unaware</b>, <b>Mirror Armor</b>, <b>Poison Heal</b>, <b>Truant</b>, <b>Pressure</b>, <b>Iron Fist</b>, <b>Strong Jaw</b>, <b>Sharpness</b> e <b>Steelworker</b>.',
        'Habilidades que <b>reagem a levar um golpe</b>: Steam Engine, Water Compaction, Stamina, Weak Armor, Justified, Rattled, Anger Point, Sand Spit e Seed Sower. Também entram Gooey e Tangling Hair (baixam a Velocidade de quem encosta), Poison Touch, Wonder Skin e as três que barram golpe de prioridade (Dazzling, Queenly Majesty, Armor Tail).',
        'Hadron Engine e Orichalcum Pulse ligam o terreno elétrico / o sol e ainda dão o bônus de atributo junto.'
      ] },
      { nome: 'Correções', itens: [
        '<b>Download</b> agora lê o oponente: sobe o Ataque se a Defesa dele é menor que a Defesa Especial, e o Ataque Especial no caso contrário (antes subia sempre o Ataque Especial).',
        '<b>Guard Dog</b> sobe o Ataque quando alguém tenta intimidar, em vez de só impedir a queda. <b>Sand Force</b> agora dá +30% em golpes de Pedra, Terra e Aço na tempestade de areia. <b>Effect Spore</b> sorteia entre sono, paralisia e veneno, como no jogo, e não pega em Grama.',
        '<b>Water Bubble</b> também dobra os seus golpes de Água. <b>Toxic Boost</b> só vale envenenado e <b>Flare Boost</b> só queimado. <b>Magic Guard</b> agora bloqueia todo dano indireto (veneno, queimadura, recuo, armadilhas, Rough Skin…), e não só o clima.',
        'Inner Focus, Own Tempo e Oblivious agora são imunes à Intimidação. E no <b>multiplayer</b> a Intimidação, o Download e as habilidades de degrau ao entrar em campo finalmente funcionam (antes só valiam no single player).'
      ] }
    ] },
  { versao: '2.24', data: '2026-09-25', titulo: 'Compras em atacado', piada: 'O lojista jura que nunca viu alguém levar noventa e nove Potions de uma vez. Está com medo.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Comprar na loja agora abre um <b>HUD de quantidade</b>: botões −10, −, +, +10 e <b>Máx</b>, mais um campo para digitar, com o total e o troco atualizando na hora.',
        'Depois de comprar aparece um <b>aviso 🛒</b> dizendo o que você levou, quanto pagou e quantos tem na mochila.'
      ] }
    ] },
  { versao: '2.23', data: '2026-09-25', titulo: 'Jornada mais longa', piada: 'Seu Pokémon reclamou que a aventura estava acabando rápido demais. Atendemos. Ele já se arrependeu.',
    secoes: [
      { nome: 'Equilíbrio', itens: [
        'A <b>XP por vitória caiu para 60%</b>: são mais batalhas por nível e a jornada dura cerca de <b>1,65× mais</b>. O equilíbrio relativo não mudou — treinador continua valendo 1,5× de um selvagem, e o modo escolhido continua pesando igual.',
        'Mexemos na XP ganha, e não na curva de nível: a curva vem da PokéAPI e fica guardada no seu aparelho, então mudá-la quebraria a comparação com as jornadas que você já terminou.'
      ] },
      { nome: 'Novidades', itens: [
        'Mais 8 habilidades ativas em batalha: <b>Fur Coat</b> e <b>Ice Scales</b> (metade do dano físico / especial), <b>Super Luck</b> (crítico mais fácil), <b>Intrepid Sword</b> e <b>Dauntless Shield</b> (sobem um atributo ao entrar em campo), Download, Grass Pelt e Flower Gift.'
      ] },
      { nome: 'Correções', itens: [
        'O jogo abria em branco por causa de um erro de sintaxe no arquivo do esconderijo, que derrubava tudo o que dependia dele. Corrigido.',
        'A <b>loja não abria</b>. O filtro que decide se a Pedra Mega e o Cristal Z aparecem na prateleira podia derrubar a tela inteira — agora ele nunca impede a loja de abrir: se a conta de conquistas falhar, a loja abre sem esses dois itens e o erro fica registrado. Ele também passou a ser calculado uma vez, e não duas.',
        'Mais 3 habilidades: Guard Dog, Sand Force e Effect Spore.'
      ] }
    ] },
  { versao: '2.22', data: '2026-09-24', titulo: 'Ninguém mais se despede à força', piada: 'O Pokémon que você deixou para trás na Rota 4 mandou dizer que agora tem um sofá e está confortável.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Chegou o <b>esconderijo</b>: aliados que não cabem na equipe esperam lá, em vez de se despedir para sempre. Encontrar alguém interessante no fim da jornada deixou de ser má notícia.',
        'Dá para <b>guardar e trazer</b> quando quiser, fora de batalha, pelo painel de Aliados. Quem volta entra descansado — o estado de batalha (atributos baixados, recuo) é zerado ao guardar.',
        'O tamanho da equipe <b>não mudou</b>: a decisão de quem leva para a próxima rota continua existindo. O que acabou foi a perda permanente.',
        'Mais 16 habilidades ativas em batalha, entre elas <b>Battle Armor</b> e <b>Shell Armor</b> (o golpe nunca sai crítico contra você, nem quando seria garantido), Earth Eater, Purifying Salt, Victory Star e No Guard.'
      ] },
      { nome: 'Correções', itens: [
        'As marcações de <b>negrito</b> destas notas apareciam como código na tela, em vez de deixar o texto em negrito.'
      ] }
    ] },
  { versao: '2.21', data: '2026-09-24', titulo: 'Para quem não decorou a tabela', piada: 'Descobrimos que nem todo mundo nasce sabendo que Planta é fraco contra Inseto. Corrigimos o jogo, não as pessoas.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Cada golpe seu agora mostra, no próprio botão, <b>o quanto ele é vantajoso</b> contra quem está na sua frente: extremamente efetivo (⏫), super efetivo (🔼), dano normal, pouco efetivo (🔽), quase sem efeito (⏬) ou não afeta (✖). Vem com cor, seta e texto ao mesmo tempo — cor sozinha não serve para quem não a distingue.',
        'O <b>tipo</b> de quem está em campo aparece na plaquinha de batalha, dos dois lados. Era o dado que explicava por que o seu golpe bateu fraco e ele estava escondido na ficha, a um clique de distância. Quem terastalizou mostra o tipo Tera, que é o que vale.',
        'Na Pokédex da rota, os Pokémon que você já encontrou viraram <b>clicáveis</b>: abrem a ficha completa na Pokédex. Se ele já está registrado, a ficha já é sua.'
      ] }
    ] },
  { versao: '2.20', data: '2026-09-24', titulo: 'Gigantamax — a última das quatro', piada: 'Seu Pokémon cresceu tanto que agora precisa se abaixar para entrar na batalha. Valeu a pena.',
    secoes: [
      { nome: 'Novidades', itens: [
        'O <b>Gigantamax</b> chegou, e com ele as quatro gimmicks estão jogáveis. Conquistado (nível 50 com a espécie em 25 jornadas), o botão 🔴 <b>dobra o seu HP</b> por 3 turnos e transforma todo golpe num golpe Max — e o seu Pokémon fica <b>gigante na tela</b>.',
        'É a única das quatro que <b>não pede item</b>: Mega precisa da pedra, Z precisa do cristal, mas quem levou 25 jornadas para chegar aqui já pagou o preço. (Nos jogos o Dynamax também não depende de item.)',
        'O HP volta na mesma proporção ao encolher: se você estava com metade da vida gigante, volta com metade da vida normal — ninguém ganha nem perde vida por causa do tamanho.',
        'A tabela do golpe Max é mais modesta que a do Z de propósito: o Z é um tiro único, o Max vale três turnos. No mesmo patamar, a escolha entre eles perderia a graça.'
      ] }
    ] },
  { versao: '2.19', data: '2026-09-24', titulo: 'Z-Move, e o chefe revida', piada: 'O Alfa leu as notas da atualização passada, achou injusto e foi atrás do próprio cristal.',
    secoes: [
      { nome: 'Novidades', itens: [
        'O <b>Z-Move</b> chegou. Conquistado um Z (250 eliminações com o golpe, ou 500 com golpes do mesmo elemento), a loja passa a vender o <b>Cristal Z</b> por ₽12.000 — e, segurando o cristal, o botão 🌀 converte um golpe seu num golpe muito mais forte, uma vez por batalha.',
        'Ao contrário da Mega e da Tera, o <b>Z-Move é o seu turno</b>: ele não transforma nada, ele é o ataque da rodada (e gasta o PP do golpe). O botão é laranja justamente para não ser clicado achando que é de graça.',
        'A conversão segue a tabela dos jogos, achatada no topo: um golpe de 60 vira 120, um de 120 vira 190. Usar o Z no golpe fraco rende mais — a escolha importa.',
        'O <b>inimigo agora terastaliza</b>: Alfa, lendários e treinadores, ao cair à metade do HP, como já acontecia com a Mega. Mas só uma virada por luta — quem já megaevoluiu não terastaliza também, senão o combate viraria de cabeça para baixo de uma vez só.'
      ] }
    ] },
  { versao: '2.18', data: '2026-09-24', titulo: 'A pedra, o mapa e a luz', piada: 'Descobrimos que megaevoluir sem a pedra é como abrir a porta sem a chave: funciona nos sonhos e em nenhum outro lugar.',
    secoes: [
      { nome: 'Novidades', itens: [
        'A <b>Pedra Mega</b> agora existe de verdade: conquistar a Mega de uma espécie libera a <b>compra</b> da pedra (₽15.000 na loja, só para a sua espécie), e é preciso <b>segurá-la</b> para megaevoluir. Rayquaza é a exceção, como nos jogos: ele megaevolui por saber <b>Dragon Ascent</b>, sem pedra nenhuma.',
        'Dá para <b>acompanhar uma conquista da conta</b> durante a jornada: o botão 📌 na tela de Conquistas fixa uma, ela aparece no painel de Missões com o quanto falta, e ao completar você é avisado e <b>ganha a recompensa nesta run</b> — além de valer nas próximas.',
        'A tela de batalha agora tem a <b>cara da rota</b>: caverna, mar, usina, vulcão, floresta, gelo e mais, cada uma com céu, chão e luz próprios.',
        'A lista de espécies desbloqueadas ganhou <b>busca</b> (por nome ou número) e vem sempre em <b>ordem de Pokédex</b>, com o número visível.',
        'A tela de Conquistas ganhou o <b>catálogo das Megas</b>: dá para ver as 89 espécies que têm Mega no jogo, de todas as Gens, e quais você já conquistou.'
      ] }
    ] },
  { versao: '2.17', data: '2026-09-24', titulo: 'Terastalização', piada: 'Seu Charizard finalmente pode olhar para uma pedra sem suar frio.',
    secoes: [
      { nome: 'Novidades', itens: [
        'A <b>Terastalização</b> chegou. Cada tipo é conquistado à parte (200 derrotados daquele tipo), e na batalha você escolhe entre os que já tem: o botão 💎 <b>não gasta o turno</b>, igual à Mega.',
        'Terastalizado, você passa a ter <b>um tipo só</b> para receber golpe — é o que muda a luta: um Charizard Tera Água deixa de tomar 4× de Pedra. A ficha mostra o tipo Tera no lugar dos antigos, porque calcular fraqueza pelo tipo velho seria justamente o erro.',
        'No ataque, a regra é a dos jogos: golpe do tipo Tera que você <b>já tinha</b> bate ×2; um tipo Tera novo bate ×1,5; e o STAB que você já tinha continua valendo.',
        'Dá para usar Tera e Mega na mesma batalha — são conquistas diferentes, cada uma com o seu custo.'
      ] },
      { nome: 'Correções', itens: [
        'Stealth Rock agora acerta pelo tipo Tera de quem entra, não pelo tipo antigo.'
      ] }
    ] },
  { versao: '2.16', data: '2026-09-24', titulo: 'Mega Evolução', piada: 'Mil vitórias depois, a pedra finalmente reagiu. Dava pra ter reagido na quingentésima, mas pedra é assim.',
    secoes: [
      { nome: 'Novidades', itens: [
        'A <b>Mega Evolução</b> chegou. Conquistada a Pedra Mega de uma espécie (1.000 golpes finais dados sendo ela, na evolução final), aparece um botão ⚡ na batalha — e ele <b>não gasta o seu turno</b>: você megaevolui e ataca na mesma rodada.',
        'A forma Mega muda status, tipos, habilidade e aparência de verdade, e dura até o fim da batalha. Charizard e Mewtwo perguntam qual forma você quer (X ou Y).',
        'Groudon e Kyogre entram pela mesma porta, com o nome certo: <b>Reversão Primitiva</b>.',
        'O outro lado também joga esse jogo: <b>Alfa, lendários e treinadores</b> podem megaevoluir — e fazem isso quando caem à metade do HP. A luta tem segunda fase agora. Selvagem de rota continua selvagem de rota.',
        'São 96 formas cobrindo 93 espécies. Só você megaevolui: aliado não, mesmo que a espécie dele esteja liberada.'
      ] }
    ] },
  { versao: '2.15', data: '2026-09-24', titulo: 'A região decide a forma', piada: 'O Exeggcute foi passar férias em Alola e voltou com um sotaque de Dragão. Coisas que acontecem.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Evoluir <b>dentro da região</b> agora dá a forma regional: use a Pedra da Folha num Exeggcute em Alola e vem o Exeggutor de Alola, não o de Kanto. Vale pra todas as regiões e todas as formas que existem no mapa — Alola, Galar, Hisui e Paldea. Antes a evolução saía sempre na forma padrão, e a única maneira de ter uma forma regional era encontrar uma pronta no Santuário.',
        'O registro continua contando na espécie (Exeggutor), então Pokédex, desbloqueios e conquistas não mudam — o que muda é o Pokémon que fica com você, com os tipos, os status e os golpes da forma de lá.'
      ] }
    ] },
  { versao: '2.14', data: '2026-09-24', titulo: 'A rota não acaba antes da missão', piada: 'A Rota 1 se aposentava antes de você terminar de contar os Pidgey. Conversamos com ela.',
    secoes: [
      { nome: 'Equilíbrio', itens: [
        'Tivemos que nerfar o jogador Berga, só o diabo para parar ele.',
        'Rota de nível baixo agora tem folga mínima de 15 níveis antes de esgotar. Na Rota 1 (teto 6) o limite era o dobro, 12 — e como a jornada começa no nível 5, a rota parava de dar caçada antes de dar pra terminar as missões dela. Rota de teto alto não muda: o dobro continua valendo.',
        'A Mega Evolução só acumula para espécies que <b>têm Mega</b>. Antes cada estágio tinha a própria barra, então evoluir parecia zerar o progresso — e derrotar como Marshtomp enchia um contador que não levava a Mega nenhuma. Tera, Z-Move e Gigantamax seguem contando tudo.',
        'A conquista "Nunca precisei de médico" agora pede <b>fechar uma Gen</b> sem usar o Centro Pokémon. Antes bastava terminar uma jornada de qualquer jeito: dava pra entrar e sair na hora seguinte e levar a medalha. Quem tinha pego assim perde — ela é recalculada, não guardada.'
      ] },
      { nome: 'Correções', itens: [
        'O Repelente Seletivo listava TODAS as espécies da rota pelo nome, inclusive as que você ainda não tinha descoberto: a Pokédex da rota mostrava "?" e o repelente entregava a resposta. Agora só aparecem as que você já encontrou.',
        'A tela de Bugs e sugestões dizia "sem conexão" para qualquer falha de envio — inclusive quando o servidor recusava o relato. Agora ela diz o motivo de verdade e tenta reenviar a fila toda vez que você abre a tela, em vez de esperar um aviso de "internet voltou" que podia nunca chegar.'
      ] }
    ] },
  { versao: '2.13', data: '2026-09-24', titulo: 'Não era a sua internet', piada: 'O jogo passou dias jurando que a culpa era da sua conexão. A culpa era de uma função que nunca foi escrita. Pedimos desculpas à sua operadora.',
    secoes: [
      { nome: 'Correções', itens: [
        'Clicar num Pokémon na tela de criação dava "A conexão falhou ao buscar um dado da PokéAPI" e não deixava começar jornada nenhuma. Não era a conexão: a prévia chamava uma função que nunca tinha sido escrita, e o erro caía no mesmo tratamento da busca de rede, que anunciava problema de internet. Por isso limpar cache, trocar de rede e baixar tudo de novo não adiantavam — e por isso o Full Randomizer continuava funcionando, já que ele não desenha a prévia.',
        'A função que faltava é a opção <b>✨ Começar shiny</b>: ela aparece na prévia quando você já recrutou um shiny daquela espécie, exatamente como combinado. Agora existe de verdade, e a escolha é respeitada ao começar.',
        'Erro de código não se disfarça mais de erro de rede: a tela de criação separa "não consegui buscar o dado" de "não consegui montar a prévia", e a segunda mostra o que realmente aconteceu.'
      ] }
    ] },
  { versao: '2.12', data: '2026-09-24', titulo: 'As figurinhas mudaram de endereço', piada: 'Descobrimos que o jogo buscava as imagens num prédio que metade dos porteiros do país não deixa entrar. Mudamos pro prédio ao lado, que tem os mesmos móveis.',
    secoes: [
      { nome: 'Correções', itens: [
        'As imagens agora vêm de um CDN (o jsDelivr, que espelha o mesmo repositório de sprites). O endereço antigo é bloqueado em várias redes — provedor, DNS de celular, rede corporativa — e quando isso acontece TODA imagem do jogo some de uma vez, online inclusive.',
        'O jogo passou a se atualizar sozinho quando sai uma versão nova: antes, uma aba deixada aberta continuava rodando a versão velha até você fechar o navegador, então correção publicada não chegava em quem estava jogando.',
        'A tela de "Jogar offline" agora avisa quando a página está fora do controle do service worker (acontece logo depois de uma recarga forçada). Nessa situação os dados seriam guardados mas as imagens não, e você só descobriria sem internet — com o download inteiro já jogado fora.'
      ] }
    ] },
  { versao: '2.11', data: '2026-09-24', titulo: 'Wi-fi que mente', piada: 'O navegador jurava que estava online. O navegador estava conectado a um roteador que não levava a lugar nenhum. São coisas diferentes.',
    secoes: [
      { nome: 'Correções', itens: [
        'Não dava pra começar uma jornada quando a conexão estava ruim, mesmo com o mapa todo baixado. O jogo tinha o dado guardado, mas só aceitava usar a versão guardada quando o aparelho se declarava SEM internet — e wi-fi de metrô, portal cativo de hotel e 4G fraco contam como "com internet" pro navegador. Agora, se a rede falhar, o jogo segue com o que já está guardado.',
        'A árvore de evolução deixou de ser obrigatória pra começar: ela só é consultada quando você sobe de nível, e o jogo já sabia buscá-la depois. Antes, ela sozinha derrubava a criação da jornada inteira.',
        'As mensagens de erro de rede agora dizem QUAL dado faltou (a curva de XP, a árvore de evolução, um golpe…) em vez de só "a conexão falhou".',
        'A tela de "Jogar offline" pedia pra baixar de novo e nada mudava, por mais vezes que você baixasse: uma única imagem que não descia, entre centenas de pedidos, impedia o mapa de ser marcado como pronto. Agora falha de dado e falha de imagem são contadas separadas — sem o dado não dá pra jogar, sem a imagem dá.',
        'Novo botão <b>🗑 Limpar tudo e baixar de novo</b>: apaga o que está guardado da PokéAPI e baixa do zero, pra quando algo ficou pela metade (baixar por cima só busca o que falta). Saves, carreira e conquistas não são tocados.'
      ] }
    ] },
  { versao: '2.10', data: '2026-09-24', titulo: 'O avião agora funciona de verdade', piada: 'O jogo dizia "mapa baixado, pode desligar a internet". O mapa estava baixado. Faltava o resto do mapa.',
    secoes: [
      { nome: 'Correções', itens: [
        'Baixar um mapa em "Jogar offline" agora traz também as curvas de XP e as árvores de evolução das espécies. Sem elas, dava pra explorar offline mas NÃO dava pra começar uma jornada nem evoluir — aparecia "A conexão falhou ao buscar um dado da PokéAPI" mesmo com tudo baixado.',
        'Sprite que não conseguia descer no download era ignorada em silêncio: o jogo contava o mapa como completo e, sem internet, alguns Pokémon apareciam com o ícone de imagem quebrada. Agora ela é tentada de novo e, se ainda falhar, entra na conta de falhas — o download avisa em vez de mentir.',
        'Quem já tinha baixado um mapa antes desta correção vê o aviso de baixar de novo na tela de Ajustes. O que já está guardado não desce outra vez.',
        'Aliado que usava Self-Destruct no Roguelike quebrava o turno inteiro ("Algo deu errado neste turno"): ele é perdido na hora, e a tela ainda tentava mostrar quem estava agindo usando a posição dele na equipe, que já não existia. O dano e o turno chegavam a sumir.'
      ] }
    ] },
  { versao: '2.9', data: '2026-09-23', titulo: 'Badges que valem alguma coisa', piada: 'As medalhas antigas ficavam só bonitas na parede. Estas aqui vêm com uma Potion dentro.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Badges da conta: conquistas de longo prazo que aparecem na tela 🏅 Conquistas — marcos de caçada, um especialista por tipo, Pokédex regional e nacional, 100 aliados recrutados, recrutar um lendário, recrutar um shiny, fechar uma Gen no Hardcore, terminar uma jornada sem usar o Centro Pokémon, e mais.',
        'Cada badge conquistada vira vantagem na PRÓXIMA jornada: itens ou dinheiro no começo. Derrotar 1.000 Pokémon do tipo Planta, por exemplo, faz você começar com uma Pedra da Folha na mochila.',
        'Na criação dá pra desligar as vantagens e jogar do zero — quem faz isso ganha 10% a mais de pontos no ranking.',
        'As duas conquistas do Rayquaza entraram: recrutar um shiny e conquistar a Mega dele contam separadas, em qualquer ordem. Quem tiver as duas ganha a loja de graça para sempre.',
        'No Roguelike, quando o seu nível passa do dobro do teto de uma rota, ela fica esgotada: não aparece mais ninguém pra lutar ali. Você continua entrando e vendo a Pokédex da rota — o que acaba é o farm em rota fraca. Nos outros modos nada muda.'
      ] }
    ] },
  { versao: '2.8', data: '2026-09-23', titulo: 'Cada mapa, uma história', piada: 'Seu Pokémon pendurou as chuteiras como campeão da região. Recusou a aposentadoria três vezes antes, mas os pontos do ranking o convenceram.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Fechar uma Gen agora ENCERRA a jornada em vitória: o seu Pokémon se aposenta como campeão daquele mapa, a jornada é pontuada e entra na carreira, e a próxima começa do zero na Gen seguinte — outro Pokémon, nível 5, mapa nos níveis normais dele.',
        'Seguir com o MESMO Pokémon continua sendo possível, escolhendo ali na hora: você leva equipe, mochila e dinheiro, e o mapa novo se ajusta ao seu nível. Só que cada continuação vale 20% menos pontos no ranking (com piso de metade), porque chegar num mapa novo já forte é bem mais fácil.',
        'A tela de fim já propõe o mapa seguinte quando você começa a jornada nova.'
      ] }
    ] },
  { versao: '2.7', data: '2026-09-23', titulo: 'Conquista não se perde mais', piada: 'Descobrimos que a memória do jogo funcionava como a de um Psyduck: apagou a anotação, esqueceu que tinha conquistado. Agora ele anota em caderno separado.',
    secoes: [
      { nome: 'Correções', itens: [
        'Suas espécies desbloqueadas e o progresso das gimmicks agora ficam gravados na conta, em lugar próprio. Antes eram recalculados a partir do histórico de jornadas: apagar uma jornada da carreira apagava junto o que ela tinha liberado. Agora o progresso só cresce — nada do que você conquistou se perde.',
        'Com conta, esse progresso sobe pra nuvem e volta em qualquer aparelho. Sem internet, tudo continua funcionando e sincroniza quando a conexão voltar.',
        'A tela de Conquistas estava com texto montado em cima das barras de progresso nas linhas sem sprite (tipos e golpes). Corrigido.'
      ] }
    ] },
  { versao: '2.6', data: '2026-09-23', titulo: '20 GB que nunca existiram', piada: 'O navegador olhou 1082 figurinhas de 600 bytes e anunciou, com toda a confiança, que elas pesavam 20 gigabytes. Pedimos uma segunda opinião.',
    secoes: [
      { nome: 'Correções', itens: [
        'A tela de "Jogar offline" dizia que o jogo ocupava mais de 20 GB no aparelho. Não ocupava: os sprites são minúsculos (cerca de 600 bytes cada) e o jogo inteiro cabe em uns 20 MB. O número inflado vinha de como as imagens eram pedidas, e isso também podia fazer o download do jogo inteiro falhar por "falta de espaço" sem motivo nenhum. Corrigido, e o espaço antigo é liberado sozinho na próxima vez que você abrir o jogo.',
        'A estimativa de tamanho na tela também foi corrigida: agora fala em ~20 MB, e explica que a demora vem da quantidade de pedidos, não do tamanho.'
      ] },
      { nome: 'Novidades', itens: [
        'Recrutou um Pokémon shiny? A espécie dele fica desbloqueada na hora — e você pode começar jornadas novas jogando com ele ✨ shiny, quantas vezes quiser. Encontrar um é 1 em 4096; o direito é seu pra sempre.'
      ] }
    ] },
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
