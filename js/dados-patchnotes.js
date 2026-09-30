/* GERADO A MÃO: notas de atualização mostradas na tela 📜 Novidades (tela-patchnotes.js).
   O texto de cada ITEM aceita HTML simples (<b>, <br>) e é mostrado sem escapar — o conteúdo é escrito aqui,
   versionado junto com o código, e não vem de fora. Título, versão, seção e piada são escapados e devem ser
   texto puro.
   Mais nova primeiro. `versao` = rótulo curto, `data` = AAAA-MM-DD, `titulo` = manchete curta,
   `piada` = uma linha de humor no estilo "nota de bugfix absurda", `secoes` = [{ nome, itens: [texto] }].

   COMPILADO em 29/09/2026: as notas nasceram uma por leva de mudanças e viraram uma enxurrada de 96 versões,
   com o mesmo assunto espalhado em cinco entradas e correções de bug que a própria leva anterior tinha criado.
   Foram fundidas POR TEMA, mantendo a data real de cada uma. Quem quiser o detalhe cronológico fino tem o
   histórico do repositório; aqui vale o que o jogador precisa saber sobre o jogo de hoje. */
export const PATCH_NOTES = [
  { versao: '2.26', data: '2026-09-29', titulo: 'A sala parou de acreditar em tudo que os outros mandam', piada: 'A sala era aquele porteiro que deixa entrar qualquer um que chegue de terno. Agora ela confere o terno, o crachá, e se a pessoa cabe na porta.',
    secoes: [
      { nome: 'Correções', itens: [
        '<b>Segurança da sala de multiplayer.</b> A sala aceitava de olhos fechados tudo o que chegava pela internet — e parte disso ia direto pra tela. Quem estivesse na mesma sala podia mandar um pacote torto e fazer coisa que ninguém deveria poder fazer no seu navegador, incluindo mexer com a sua conta. Agora <b>todo pacote é conferido antes de encostar no jogo</b>: número tem que ser número, texto tem que ser texto, e endereço de imagem só vale se vier dos servidores de sprite de sempre. O que não passa é jogado fora e vai pro diagnóstico da sala (o 🔎 lá embaixo).',
        'De quebra, o mesmo cuidado conserta um jeito silencioso de <b>estragar a sua jornada</b>: uma recompensa que chegasse torta no fim de uma luta em grupo podia embaralhar o seu dinheiro no save.',
        '<b>Pacote que se diz do anfitrião agora é conferido.</b> Estado da luta, fim de luta e configuração do lobby só valem se vierem de quem realmente está hospedando.',
        'Sala com <b>pacote sem pé nem cabeça</b> não deixa mais a tela em branco: ela ignora e segue, em vez de travar no meio.'
      ] }
    ] },
  { versao: '2.25', data: '2026-09-29', titulo: 'O multiplayer foi refeito (e a luta em grupo virou uma batalha de verdade)', piada: 'A luta em sala era uma lista de fichinhas de 64 pixels. Acompanhar aquilo era como assistir a um jogo de futebol lendo a tabela de escanteios.',
    secoes: [
      { nome: 'Novidades', itens: [
        'A <b>luta em sala virou uma cena de verdade</b>: campo ao fundo, sprites grandes (o seu de costas, como manda a tradição), placa de papel com tipos, HP e — finalmente — <b>status e mudanças de atributo</b>. Antes dava pra passar a luta inteira envenenado sem ver isso em lugar nenhum. Com muita gente em campo, tudo encolhe sozinho pra caber.',
        '<b>🔗 Convite por link</b>: um toque copia um endereço que já entra na sua sala. Quem receber cai direto no lobby, sem digitar nada. O <b>📋 código</b> continua ali, agora em letras garrafais pra ditar sem erro.',
        '<b>👁 Só assistir</b>: dá pra entrar numa sala sem entrar no time, acompanhar a luta e conversar no chat. Bom pra ver a Raide dos amigos sem atrapalhar.',
        'O lobby mostra <b>em que pé cada um está</b> — 👑 anfitrião, ✅ pronto, ⏳ escolhendo, 👁 assistindo — e o <b>✅ Pronto passou a valer em todos os modos</b>, não só na Sala de Raide. Quando o botão de começar está apagado, agora ele <b>diz por quê</b>, com nome e tudo.',
        'Durante o turno: <b>barra de tempo</b> que esvazia (e fica vermelha na reta final), <b>fichas de quem já escolheu</b> no lugar de uma frase com nomes, e <b>📜 turnos anteriores</b>, pra reler o que passou voando.',
        'Escolher com o que você entra (jornada, Hall da Fama, convidado ou só assistir) agora acontece <b>dentro da sala</b>, onde você já vê o tipo de luta e quem chegou. E <b>Pokémon desmaiado não impede mais de entrar</b>: o Centro Pokémon está ali no lobby.'
      ] },
      { nome: 'Correções', itens: [
        'A sala <b>parou de piscar</b>. O anfitrião mandava a batalha inteira de quatro em quatro segundos e a cada escolha de qualquer um, e cada pacote desses redesenhava a tela toda. Agora o que viaja é um sinal curtinho, e o que não mudou não é redesenhado: menos internet gasta, menos tremedeira, e o que você está digitando no chat fica onde estava.',
        'Se algo der errado ao desenhar a sala, ela não fica mais <b>meia velha e meia nova</b> contando duas histórias diferentes: ou aparece inteira, ou aparece o erro.'
      ] }
    ] },
  { versao: '2.24', data: '2026-09-29', titulo: 'Aquele aviso de cookies apareceu (e ainda não tem anúncio nenhum)', piada: 'O jogo pede permissão pra uma coisa que ainda não faz. É o equivalente a pedir licença antes de entrar num quarto onde você já mora.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Você vai ver um <b>aviso de cookies</b> no pé da tela, uma vez. Explicação honesta: o jogo é de graça e a ideia é sustentar ele com anúncio, e pra isso o Google precisa analisar o site antes — o que exige que o código dele esteja aqui. <b>Nenhum anúncio é exibido ainda</b>, e nada mudou no jogo.',
        'Antes de você responder qualquer coisa, o jogo já diz ao Google que o consentimento está <b>negado</b>: nada de cookie de anúncio e nada de personalização. <b>Recusar não limita absolutamente nada</b> — e a escolha pode ser mudada quando quiser em <b>⚙ Ajustes → Cookies de anúncio</b>.',
        'Quando os anúncios existirem de verdade, eles vão ficar nas <b>páginas do guia</b> e no <b>fim da tela inicial</b>. Nunca perto dos botões de batalha: além de ser irritante, clique acidental é o jeito mais rápido de o projeto perder a conta de anúncios.',
        'A <b>Política de Privacidade</b> foi atualizada junto pra contar exatamente esse estado — ela já dizia o que aconteceria; agora diz também o que já acontece.'
      ] }
    ] },
  { versao: '2.23', data: '2026-09-29', titulo: 'O jogo ganhou um guia de verdade', piada: 'Até agora, a documentação oficial era um amigo seu dizendo "acho que é assim".',
    secoes: [
      { nome: 'Novidades', itens: [
        'O <b>Guia</b> deixou de ser uma página só e virou <b>seis capítulos</b>, cada um com endereço próprio (dá pra mandar o link do tema certo pra quem está começando): <b>Como começar</b>, <b>A batalha</b>, <b>Mundo e rotas</b>, <b>Transformações</b>, <b>Progresso</b> e <b>Multiplayer</b>. Chega-se a ele pelo rodapé de qualquer tela.',
        'Ele explica o que o jogo nunca teve espaço pra explicar: como a ordem do turno é decidida de verdade, por que clima e terreno mudam tanto uma luta, o que a Pokédex da rota está te dizendo, como cada uma das quatro transformações é conquistada, e — a parte que mais gente descobre tarde — <b>o que continua valendo depois de uma jornada perdida</b>.',
        'Também responde o que costuma aparecer em 🐞 Bugs e sugestões: por que uma luta de multiplayer às vezes não dá XP (a resposta é "nível real"), por que uma rota parou de dar encontros e pra que serve o saldo que sobra de cada jornada.',
        'Os capítulos se ligam entre si e ao índice, então dá pra ler em ordem ou pular direto pro assunto — e ficam guardados junto com o jogo, ou seja, <b>funcionam sem internet</b>, como o resto.'
      ] }
    ] },
  { versao: '2.22', data: '2026-09-29', titulo: 'O jogo ganhou as páginas que todo site tem', piada: 'A política de privacidade existia, mas morava numa tela que só aparecia se você já estivesse dentro. Como um aviso de incêndio trancado por dentro do prédio.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Cinco páginas novas, com endereço próprio e abertas a quem nem começou a jogar: <b>Sobre</b> (o que é o jogo e como ele foi feito), <b>Guia</b> (dificuldades, rotas e Alfas, batalha, clima, aliados, as quatro transformações e o progresso de carreira), <b>Privacidade</b>, <b>Termos de Uso</b> e <b>Contato</b>.',
        'Todas elas ficam a um clique de qualquer tela, num <b>rodapé novo</b> — que some sozinho durante a batalha, porque ali ele só atrapalharia.',
        'Agora existe um <b>e-mail de contato</b> de verdade, pra privacidade, direitos autorais ou qualquer assunto que não caiba em 🐞 Bugs e sugestões. Pra bug e sugestão a tela de dentro do jogo continua sendo o caminho mais rápido: ela aceita print, funciona sem internet e mostra o andamento.'
      ] },
      { nome: 'Correções', itens: [
        'A <b>Política de Privacidade</b> contava menos do que o jogo realmente faz. Foi reescrita e ficou bem mais completa e honesta: agora fala do banco de dados local que guarda os Pokémon baixados, do que os outros veem de você numa sala de multiplayer, do que acontece com as imagens que você anexa num relato, e de todos os serviços que o jogo toca. Ganhou também data de atualização, seus direitos pela LGPD e pelo GDPR, por quanto tempo cada coisa fica guardada e pra onde escrever.',
        'A política que aparece dentro do jogo e a da página pública passaram a ser <b>o mesmo texto</b>, escrito num lugar só — não tem como uma dizer uma coisa e a outra dizer outra.'
      ] }
    ] },
  { versao: '2.21', data: '2026-09-29', titulo: 'Agora dá pra saber no que deu', piada: 'Mandar relato era como jogar bilhete no mar. O mar respondia, mas só em pensamento.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Em <b>🐞 Relatar</b>, a lista "Seus relatos" agora mostra <b>a situação de cada um</b>: ⏳ Aguardando, 👀 Em análise, <b>✅ Atendido</b> ou 📦 Arquivado — e, quando houver, um recado de quem cuida do jogo dizendo o que foi feito. Antes aparecia só uma palavra solta do banco de dados, que não dizia nada.',
        'Dá pra acompanhar sem perguntar: se o seu bug já virou correção, ele aparece como <b>Atendido</b> — e o que mudou está em 📜 Novidades.',
        'Isso só funciona pra quem envia <b>com a conta aberta</b> (é o que permite ligar o relato a você depois). Sem conta o envio continua igual, e a tela agora explica isso em vez de não mostrar nada.'
      ] },
      { nome: 'Correções', itens: [
        '<b>Todos os relatos abertos foram respondidos</b> — os de bug viraram correção, e os pedidos que já existiam no jogo foram marcados como atendidos. Obrigado a quem mandou. 💛',
        'Estas <b>notas de atualização</b> foram compiladas: eram 96 versões, muitas do mesmo assunto, e várias só corrigiam um problema que a leva anterior tinha criado. Agora cada entrada conta um tema inteiro, da primeira versão ao estado de hoje.'
      ] }
    ] },
  { versao: '2.20', data: '2026-09-29', titulo: 'O Tera convence, a caçada começa e a faixa branca sumiu', piada: 'O Pokémon selvagem via você virar de cristal, aplaudia educadamente e continuava batendo no tipo antigo.',
    secoes: [
      { nome: 'Correções', itens: [
        '<b>O botão da 🎯 Caça Shiny não fazia nada.</b> Você revelava a rota inteira, a lista de Pokémon aparecia, você clicava — e nada acontecia, nem escolha, nem aviso, nem erro. Corrigido: escolher (e parar) a caça funciona, só o escolhido aparece na rota, e a mudança agora sai num aviso bem visível, não só numa borda que passava despercebida.',
        'De quebra, <b>ação que falhar agora avisa na tela</b> em vez de fingir que você não clicou. Se algum botão der erro, você vê o motivo — e dá pra mandar pelo 🐞 Relatar com a informação que faltava.',
        'A <b>Terastalização</b> agora vale em todo canto. A eficácia anunciada ("É super efetivo!"), as imunidades (Leech Seed, Guilhotina, esporos), o <b>Stealth Rock</b> e o <b>Tera Blast</b> seguem o tipo Tera — antes o dano já saía certo, mas a mensagem e essas regras ainda olhavam o tipo de origem.',
        'O <b>Pokémon selvagem</b> escolhia o golpe pelos seus tipos antigos: você virava Tera Água e ele continuava insistindo no golpe super efetivo contra o tipo de antes. Agora ele enxerga o tipo novo. O <b>Lodo Negro</b> e o <b>Ímã (Magnet Pull)</b> também seguem o tipo atual — quem vira Tera Veneno passa a ser curado pelo Lodo, e o Aço que vira Tera de outro tipo consegue fugir do Ímã.',
        'Derrotar um Pokémon <b>já Mega Evoluído</b> (Alfa, lendário ou de treinador) gravava a <b>forma Mega no lugar da espécie</b> no seu progresso: "Alakazam #10037", com o sprite da Mega, na tela de desbloqueios, na Pokédex da conta e nas conquistas. Agora o que conta é sempre a espécie original, inclusive pra quem já tinha o engano guardado na carreira. As <b>formas regionais</b> não são tocadas — elas têm sprite próprio de propósito.',
        'Um <b>Alfa</b> (ou o lendário principal) que Mega Evoluía no meio da luta podia desmaiar na hora, sem ninguém encostar nele: o bônus de HP que todo chefe ganha ao entrar em campo se perdia na troca de forma. Agora ele sobrevive à Mega.',
        'Evoluir pra uma espécie que você nunca tinha encontrado no mundo deixava ela eternamente "?" na Pokédex de toda rota onde ela vive, mesmo com uma dela na sua equipe. Agora evoluir já revela a silhueta.',
        'Caixas de texto e seletores apareciam com o <b>fundo branco padrão do navegador</b> — uma faixa clara no meio da tela escura, com o texto quase ilegível por cima. Acontecia no "Equipar item" da Sala de Raide, na busca de Pokémon da criação, no chat da sala, no código da sala e no apelido. Agora todo campo do jogo já nasce com a cara do resto.',
        'Clicar em <b>Novo jogo</b> durante uma batalha não fazia nada — nem abria, nem explicava. Continua trancado de propósito (sair no meio da luta seria fuga), mas agora ele diz isso; vale pra todas as ações que a batalha tranca.'
      ] }
    ] },
  { versao: '2.19', data: '2026-09-29', titulo: 'Multiplayer: o Hall da Fama entra na sala', piada: 'Três Swampert com o mesmo nome atacando ao mesmo tempo: parecia um turno, era uma reunião de condomínio.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Agora dá pra entrar numa sala (Co-op ou PvP) com os seus <b>Pokémon do Hall da Fama</b> — sem precisar de uma jornada em andamento e sem se contentar com um convidado de nível 5. A escolha "Com qual Pokémon você entra?" também aparece <b>dentro da sala</b>, no lobby: dá pra trocar entre a sua run, o Hall da Fama e um convidado a qualquer momento antes da luta, sem sair e perder o código.',
        'O turno <b>não aparece mais todo de uma vez</b>: as linhas saem uma a uma e o cartão de <b>quem está agindo naquele momento</b> fica destacado. Pokémon de mesmo nome no seu time viraram numerados (Swampert 1, Swampert 2, Swampert 3) — sem isso o registro não dizia qual dos três tinha atacado. Quem liga "reduzir animações" no aparelho continua recebendo o turno inteiro de uma vez.',
        'Todo <b>item de raide</b> agora diz <b>o que faz</b> e <b>contra quais chefes serve</b>, na dica do botão, na mochila e numa tabela nova em <b>❓ Como funcionam os chefes da semana</b> (que também mostra quem dá cada item de prêmio).',
        'O prêmio dos chefes gira em rodízio e não combina com o chefe: o Groudon dá Prisma de Luz (que só serve contra chefe com ponto fraco, e ele não tem), e o Calyrex dá Célula Zygarde (que só serve contra o Zygarde). Por isso, na caixa do chefe da semana, uma linha separa os seus itens em <b>servem</b> e <b>não servem contra ele</b>, pra você não gastar à toa.'
      ] },
      { nome: 'Correções', itens: [
        '<b>Quem criava a sala travava depois da primeira rodada</b>: dava pra atacar uma vez e nunca mais, a tela ficava em "Escolhas enviadas" e os turnos passavam sozinhos enquanto o chefe batia. Numa luta nova acontecia já no turno 1. Quem entrava numa sala dos outros nunca foi afetado.',
        'A ☄ Sala de Raide não abria a escolha de Pokémon pra quem tinha um <b>shiny</b> no Hall da Fama: a tela quebrava na metade, o topo já dizia "Sala de Raide" e a parte de baixo continuava mostrando as opções de Co-op, sem nenhum aviso. E o resumo no topo dizia "Co-op" (com uma rota) mesmo no modo Raide.',
        'Quando algo quebra ao desenhar a sala, agora aparece o erro na tela em vez de ficar meia tela velha fingindo que está tudo certo.',
        'O <b>Espelho Reverso</b> dizia que inverte os tipos "a seu favor". Na verdade ele inverte a tabela nos golpes que <b>você</b> dá: ajuda contra quem resiste aos seus tipos e <b>atrapalha</b> contra quem é fraco a eles. A descrição agora avisa.'
      ] }
    ] },
  { versao: '2.18', data: '2026-09-29', titulo: 'Inimigos que pensam, e golpes que tiram você da luta', piada: 'Provocaram o Pokémon e ele, ofendidíssimo, esqueceu que tinha golpe de status. O inimigo aprendeu a fazer o mesmo com você.',
    secoes: [
      { nome: 'Novidades', itens: [
        'A IA dos inimigos foi refeita: em vez de "sempre o golpe de maior dano", cada golpe ganha uma <b>nota</b> pela situação da luta (quem apanha, o clima, as telas, o HP dos dois). <b>Selvagens</b> continuam como eram — batem no que dói mais e erram bastante.',
        '<b>Treinadores</b> agora contam o dano de verdade (precisão, imunidades, se o golpe derruba), <b>paralisam, queimam e põem pra dormir</b> quem ainda não tem status, e <b>se curam</b> quando estão no fim.',
        '<b>Alfas, lendários e o chefe da semana</b> jogam com tudo: sobem atributos (sem exagerar além de +2), derrubam os seus, montam Reflect e Light Screen, mudam o clima e provocam quem depende de golpe de status. E todos evitam bobagem: não usam golpe que você é imune, não se curam com o HP cheio, não se explodem à toa e não repetem o que já está ativo.',
        'Quatro golpes que <b>travam o que o alvo pode escolher</b> passaram a funcionar: <b>Taunt</b> (só golpes de dano), <b>Encore</b> (repete o último golpe), <b>Disable</b> (desativa o último golpe) e <b>Torment</b> (não deixa repetir o golpe anterior). Se o inimigo é mais rápido e te provoca antes de você agir, <b>o seu golpe de status falha</b>; sob Encore, a sua escolha é trocada pelo golpe repetido.',
        'A tela de golpes mostra <b>o que está prendendo o seu Pokémon</b> (provocado, Encore, golpe desativado, atormentado, item que trava) e por quantos turnos; o botão bloqueado explica o motivo. <b>Oblivious</b> ficou imune ao Taunt e <b>Aroma Veil</b> (nova) protege contra os quatro.',
        '<b>Roar, Whirlwind, Dragon Tail e Circle Throw</b> passam a funcionar. Contra um <b>selvagem</b> a luta acaba (sem XP nem dinheiro). Contra um <b>treinador</b> ele manda outro Pokémon da equipe — o que saiu não conta como derrotado e pode voltar. Os seus também podem ser arrastados: quem levou o golpe sai e a luta segue sem ele; se era o último em campo, acaba como uma fuga. Alfas, lendários e o chefe da semana não saem.',
        'Se você foi tirado da luta com aliados ainda lutando, a tela mostra <b>⏭ Assistir o turno</b> (quem ficou de fora não ganha XP). Novo item: <b>Cartão Vermelho</b> (loja, ₽3.000) — quem acerta o portador é expulso da luta, e o cartão se gasta.',
        '<b>Regenerator</b> (recupera 1/3 do HP) e <b>Natural Cure</b> (tira o status) funcionam ao vencer a luta. <b>Wimp Out</b> e <b>Emergency Exit</b> fazem inimigos e aliados saírem ao cair da metade do HP (no seu Pokémon principal não valem, pra uma habilidade sorteada não te expulsar da luta). <b>Mean Look, Block e Spider Web</b> impedem o alvo de fugir, <b>Baton Pass</b> passa os seus bônus pra um aliado em campo, e <b>Slow Start</b> (Regigigas) e <b>Stakeout</b> ficaram ativas.'
      ] },
      { nome: 'Correções', itens: [
        'O <b>Colete de Assalto</b> deixava você clicar num golpe de status e só depois recusava. Agora os botões de status já aparecem bloqueados — e os inimigos e aliados nunca escolhem um golpe proibido no momento, caindo no Struggle se não sobrar nenhum.',
        'O treinador podia mostrar bolinhas erradas na equipe restante quando um Pokémon saía e voltava. Agora só conta quem ainda está de pé.',
        'Em luta de sala (multiplayer) os golpes que tiram da luta ainda não valem: eles avisam que não funcionam ali, em vez de fingir.'
      ] }
    ] },
  { versao: '2.17', data: '2026-09-28', titulo: 'Loja de preparo na Arena', piada: 'O saldo de conta chegou dizendo que 10% de tudo é um bom começo de poupança.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Toda jornada terminada deixa 10% do seu dinheiro máximo como <b>saldo de conta</b>, pra sempre — contando a carreira inteira, inclusive as jornadas que você fechou antes desta atualização. Na 🏟 Arena, esse saldo abre a "Loja de preparo": cura, revive, itens de stat e itens de segurar, pelo mesmo preço da loja normal, e você escolhe quem equipa cada item antes de entrar na luta.',
        'A Arena ganhou <b>Reviver</b> (traz um aliado caído de volta no meio da luta, sem esperar o time inteiro cair) e <b>usar item</b> durante o combate, igual numa jornada de verdade.'
      ] }
    ] },
  { versao: '2.16', data: '2026-09-28', titulo: 'Raide: 14 itens novos, e nada de esperar', piada: 'O Eternatus reclamou que agora não tem nem tempo de tomar um café entre uma surra e outra.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Prêmio da Raide completo: 7 itens <b>consumíveis</b> novos (Cinza Vulcânica, Escama Abissal, Prisma de Luz, Espelho Reverso, Relógio de Areia, Fragmento Tera, Célula Zygarde) e 7 <b>segurados</b> novos que valem em qualquer batalha (Núcleo Eternamax, Escama do Céu, Cristal Psíquico, Rédea Espectral, Emblema da Coroa, Cristal Gélido, Presa da Lua) — todos só vêm de vencer o chefe da semana.',
        '🧪 <b>Modo beta temporário</b>: a espera de 8 horas entre tentativas contra o chefe da semana está DESLIGADA, pra facilitar os testes da Raide (Arena, dentro da run, ou em grupo). Volta a valer depois do período de teste.',
        'A tela da <b>Arena do Chefe</b> ganhou um cartão "👥 Jogar em grupo" explicando que ela é só single-player (Hall da Fama) e levando direto pro Multiplayer, onde dá pra montar uma sala de até 6 jogadores (3 Pokémon cada) pra encarar o chefe em co-op.'
      ] },
      { nome: 'Correções', itens: [
        'Uma jornada que termina (fim de Roguelike/Hardcore, vitória na Arena ou no chefe em grupo) agora tenta de novo sozinha se a sincronização com a nuvem falhar na hora — antes era uma tentativa só, e uma rede instável bem na tela de Game Over podia deixar o Pokémon de fora do Hall da Fama.'
      ] }
    ] },
  { versao: '2.15', data: '2026-09-28', titulo: 'Mochila no multiplayer, golpes na ordem e quem está jogando', piada: 'Os Restos finalmente descobriram que sala de multiplayer também tem HP pra curar.',
    secoes: [
      { nome: 'Novidades', itens: [
        'O <b>item segurado</b> do seu Pokémon (Restos, Orbe da Vida, Faixa de Foco, Sino-Concha, Elmo Rochoso, Vínculo de Batalha…) agora funciona em qualquer luta de multiplayer — antes não fazia efeito nenhum em sala. Também dá pra usar um <b>item comum</b> da mochila (Potion, X Attack, curas de status, Éter…) na sua vez, dentro de uma sala: ocupa o turno, sempre em você mesmo.',
        'Agora dá pra reordenar os <b>golpes</b> na lista com os botões ▲▼ — não gasta turno, é só a posição. Funciona na ficha (dentro ou fora de batalha, na sua jornada) e também nas Raides, tanto na Arena quanto em sala.',
        'A tela inicial mostra <b>quantas pessoas estão jogando no momento</b> — sem dizer quem, só quantas. Dá pra desligar em ⚙ Ajustes.',
        '3 habilidades novas com efeito real: <b>Sheer Force</b> (golpe com efeito secundário bate mais forte, mas perde o efeito), <b>Unnerve</b> (o oponente não consegue comer a própria fruta logo depois de levar um golpe seu) e <b>Friend Guard</b> (reduz o dano que um aliado seu recebe).'
      ] }
    ] },
  { versao: '2.14', data: '2026-09-28', titulo: 'O jogo ganhou vida', piada: 'O Pokémon que apanha agora pisca vermelho. O que era antes, silêncio e dignidade.',
    secoes: [
      { nome: 'Novidades', itens: [
        'A <b>barra de HP</b> anima ao tomar dano ou se curar, em vez de saltar pro número novo. A de <b>XP</b> faz o mesmo, e o número de <b>PP</b> pisca quando você usa um golpe.',
        'Cena de batalha com mais vida: quem ataca dá um pulo, quem apanha pisca vermelho, quem se cura pisca verde, e status/mudanças de atributo pulsam sutilmente enquanto durarem.',
        'Botões reagem ao toque (um leve "afundar") e as telas trocam com uma transição suave em vez de aparecer seco. Na tela inicial, o marcador "jogando agora" pulsa, o Pokémon da prévia flutua sozinho e a grade de iniciais levanta um pouco no toque.',
        'Batalha no celular <b>deitado</b>: a cena vira uma coluna fixa à esquerda em vez de ficar presa no topo, aproveitando a tela larga e baixa.',
        'Tudo isso respeita a preferência de <b>"reduzir animações"</b> do aparelho — quem a liga continua vendo as mudanças na hora, sem transição.'
      ] }
    ] },
  { versao: '2.13', data: '2026-09-27', titulo: 'Sprites 3D e animados', piada: 'O Pikachu clássico é pixel art desde 1996. Agora ele também pode aparecer renderizado — ou simplesmente se mexendo.',
    secoes: [
      { nome: 'Novidades', itens: [
        '<b>Estilo de sprite</b> (⚙ Ajustes → Sprites): além do <b>Clássico</b> (o pixel-art de sempre), agora tem <b>🧊 3D</b> (o render usado em Pokémon HOME) e <b>🎬 Animado</b> (os GIFs do Pokémon Showdown, com versão de costas de verdade).',
        'O 3D não tem versão de costas — nesse estilo, na batalha, o seu Pokémon aparece de frente também. Os dois estilos têm download opcional em ⚙ Ajustes → Jogar offline, à parte do download normal.'
      ] },
      { nome: 'Correções', itens: [
        'Os <b>GIFs animados</b> esticavam pra caber numa caixa quadrada, ficando com a proporção errada — cada Pokémon tem um tamanho de sprite diferente lá. Agora encolhem mantendo a forma certa.'
      ] }
    ] },
  { versao: '2.12', data: '2026-09-27', titulo: 'Ash-Greninja, e a pedra na prateleira', piada: 'A Pedra-Chave sempre serviu pra qualquer Mega. Só faltava alguém te contar que ela existia.',
    secoes: [
      { nome: 'Novidades', itens: [
        '<b>🥷 Vínculo de Batalha:</b> conquiste <b>1.000 golpes finais sendo Greninja</b> pra liberar a compra do item (₽15.000). Segurando-o, derrubar um oponente transforma seu Greninja em <b>Ash-Greninja</b> pro resto da luta — atributos mais altos e <b>Water Shuriken</b> vira poder fixo 20 com <b>sempre 3 acertos</b> (a versão normal é 2 a 5, aleatório). Não precisa apertar botão nenhum: acontece sozinho, como uma habilidade.',
        'A <b>Pedra Mega</b> e o <b>Cristal Z</b> agora mostram a pedra/cristal de VERDADE da sua espécie ou tipo na mochila e na loja, em vez do ícone genérico de caixinha — quem joga de Charizard vê a Charizardita. Metade das Megas deste jogo não existe nos jogos de verdade e não tem pedra desenhada; nesses casos aparece a <b>Pedra-Chave</b>, o item real que ativa qualquer Mega Evolução.'
      ] },
      { nome: 'Correções', itens: [
        'A <b>loja escondia a Pedra Mega, o Cristal Z e o Vínculo de Batalha</b> — às vezes os três de uma vez, às vezes a loja inteira nem abria. Eram três causas somadas: a checagem dos três era feita numa tentativa só (um problema em qualquer um apagava todos), ela tentava ler o Pokémon de dentro de uma luta que não estava acontecendo (ou seja, quase sempre, já que quase toda compra é fora de batalha), e não tinha plano B se o progresso da conta falhasse. Agora cada item é verificado por conta própria, sempre olhando pro Pokémon certo, e se o progresso permanente falhar a conta é refeita a partir das suas jornadas — a loja nunca deixa de abrir por causa disso.'
      ] }
    ] },
  { versao: '2.11', data: '2026-09-27', titulo: 'Vender itens, e o shiny que desbloqueia de verdade', piada: 'O Beedrill shiny reclamou anos sem crédito no currículo. Agora ele finalmente entrou na ficha.',
    secoes: [
      { nome: 'Novidades', itens: [
        '<b>💰 Vender ou jogar fora:</b> cada item da mochila ganhou um botão pra vender (metade do preço de compra) ou jogar fora, pra quem não tem preço de loja. Mesmo HUD de quantidade da compra, só que ao contrário.'
      ] },
      { nome: 'Correções', itens: [
        'Pegar (ou evoluir até) um Pokémon <b>shiny</b> agora desbloqueia mesmo a opção "✨ Começar shiny" daquela espécie em jornadas futuras — antes só recrutar um aliado shiny fazia isso, e o seu PRÓPRIO Pokémon shiny nunca contava, nem quando evoluía. Quem já tinha um shiny antes disso recebe o crédito retroativo assim que abrir a jornada de novo.',
        'A loja só tinha o botão <b>"Sair da loja"</b> lá embaixo, depois de toda a lista de itens — quem clicava nela sem querer tinha que rolar a tela inteira pra voltar. Agora o botão também aparece no topo.',
        'A ficha de cada espécie na Pokédex mostra também o progresso ESPECÍFICO do Roguelike (que só conta o que foi feito em jornadas Roguelike) — antes só dava pra ver o total da carreira inteira, o que confundia quem via "derrotou 12" e achava que já tinha passado dos 10 exigidos.'
      ] }
    ] },
  { versao: '2.10', data: '2026-09-27', titulo: 'Política de Privacidade, e 6 habilidades novas', piada: 'O jogo agora tem uma página inteira só pra dizer que não guarda quase nada sobre você. Ironicamente, é a página mais longa do site.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Nova tela <b>🔒 Privacidade</b>, explicando em português claro o que fica só no seu aparelho, o que a conta guarda (se você tiver uma) e o que a PokéAPI/Supabase recebem.',
        'Seis <b>habilidades</b> novas com efeito real em batalha: <b>Protosynthesis</b> e <b>Quark Drive</b> (reforçam seu maior atributo no sol ou no Campo Elétrico), <b>Magnet Pull</b> (prende selvagens do tipo Aço, nem fugir adianta), <b>Anticipation</b> (avisa se o oponente tem golpe perigoso), <b>Synchronize</b> (devolve queimadura, paralisia ou veneno pra quem causou) e <b>Stench</b> (chance extra de fazer o oponente recuar).'
      ] }
    ] },
  { versao: '2.9', data: '2026-09-25', titulo: 'Gimmicks pra todo mundo', piada: 'O treinador gigantamaxou o Pokémon e esqueceu que ele ainda precisava caber na Poké Ball. O Alfa acha que o Z-Move é um cristal de decoração — e às vezes ele é.',
    secoes: [
      { nome: 'Novidades', itens: [
        '<b>Gimmicks no co-op:</b> na luta em grupo (selvagens, Alfa e chefe da semana) o seu Pokémon <b>principal</b> pode <b>Mega Evoluir, Terastalizar, Gigantamaxar e usar Z-Move</b>, com as mesmas regras do single player: conquista da sua conta, Pedra Mega e Cristal Z segurados, uma vez de cada por luta. Aliados, Pokémon convidado e PvP ficam de fora, e nada disso muda o Pokémon da sua run depois da luta.',
        '<b>Gigantamax do inimigo:</b> só Pokémon de <b>treinador</b> gigantamaxam — na metade do HP, como a Mega e a Tera dele. Ele dobra o HP, os golpes viram Max por 3 turnos e depois encolhe. Ainda vale <b>uma virada por luta</b>: quem não tem Mega sorteia entre Tera e Gigantamax.',
        '<b>Z-Move do inimigo:</b> só <b>treinadores e Alfas</b>. O treinador sempre carrega um Z; o Alfa só de vez em quando (chance baixa, sorteada no começo da luta). Uma vez por luta, num golpe de dano.',
        '<b>Mega Z:</b> Absol, Garchomp e Lucario agora têm a <b>Mega comum e a Mega Z</b> (Legends Z-A), e você escolhe qual na hora, como no X/Y do Charizard.',
        'Os Pokémon que você derrota no <b>co-op</b> contam para as conquistas da conta (a barra da Mega da espécie que você usa e os marcos de caçada), como no single player. Tera e Z-Move continuam pedindo o golpe final seu, então só andam no single player.'
      ] },
      { nome: 'Equilíbrio', itens: [
        'A <b>Terastalização do inimigo</b> (treinadores, Alfas e lendários) é <b>totalmente aleatória</b>: qualquer um dos 18 tipos, seja um dos dele ou não. Antes ele sempre virava o próprio primeiro tipo, e não havia surpresa nenhuma. Olhe o tipo 💎 na plaquinha dele depois da virada: a fraqueza nova pode ser qualquer uma.',
        'Cada gimmick do inimigo tem a sua faixa de nível: a <b>Mega</b> só de <b>nível 40 em diante</b> (antes treinadores das primeiras rotas já megaevoluíam) e a <b>Tera</b> e o <b>Gigantamax</b> só em rotas de <b>nível 30 ou mais</b>.'
      ] },
      { nome: 'Correções', itens: [
        'O <b>botão de Gigantamax nunca aparecia numa batalha de verdade</b>: a tela de Conquistas contava certo as 25 jornadas no nível 50, mas a batalha lia uma lista vazia. Agora os dois leem o mesmo progresso.',
        'Inimigo Alfa, lendário ou de treinador <b>nível 40+ que não tem Mega</b> (quase todos) nunca terastalizava: a checagem de Mega o marcava como "já virou". Agora ele segue pra Tera (ou Gigantamax) como devia.',
        'A tela de Conquistas cortava a lista da Mega em 24 espécies, mesmo as já conquistadas. Agora toda Mega conquistada aparece; o corte vale só pras barras em andamento.'
      ] }
    ] },
  { versao: '2.8', data: '2026-09-25', titulo: 'A sua conta: insígnia do Alpha, perfil e o Hall da Fama', piada: 'A Poké Ball dourada garante que é de ouro maciço. O Meowth já pediu para avaliar, por precaução.',
    secoes: [
      { nome: 'Novidades', itens: [
        '<b>🏟 Arena do Chefe:</b> enfrente o chefe da semana <b>sem precisar fazer uma run até a Gen dele</b> (chegar ao Eternatus exigia passar pelas 8 Gens). Ela está no menu e na tela inicial, não usa nenhuma jornada em andamento, e perder não custa nada.',
        '<b>Hall da Fama:</b> o Pokémon principal de cada jornada <b>Roguelike ou Hardcore que você termina</b> (venceu, perdeu ou encerrou) entra no Hall com o nível que tinha. Na Arena você leva de 1 a 3 deles contra o chefe. Os itens de raide que sobram numa jornada que termina vão para a sua conta, e o prêmio da Arena também.',
        'Quem criou a conta durante o Alpha ganha a <b>Insígnia Alpha</b>: uma Poké Ball dourada com o α, num cartão na tela 👤 Conta e uma versão pequena ao lado do seu nome no topo. Ela é sua para sempre — quem entrar depois que o Beta abrir não consegue.',
        '<b>👤 Ver perfil:</b> na lista de amigos cada amigo tem um botão <b>Ver perfil</b>: ícone, insígnia escolhida, se é <b>Treinador do Alpha</b>, desde quando joga, os números das jornadas (vitórias, Gens fechadas, melhor pontuação, maior nível, Pokémon derrotados, shinies, espécies desbloqueadas, mais jogado), todas as <b>insígnias de evento</b> e as <b>últimas 5 runs</b>. Também dá pra ver o seu próprio perfil, como os amigos veem. Só amigos veem o perfil um do outro.',
        'Três badges novas de <b>parceiros</b> na tela 🏅 Conquistas: <b>Casa cheia</b> (feche uma Gen com a equipe e o esconderijo lotados), <b>Lobo solitário</b> (feche uma Gen sem recrutar ninguém) e <b>Cemitério de parceiros</b> (perca 15 parceiros numa mesma run). Fora do modo Fácil.',
        'Nova explicação <b>"Como funcionam os chefes da semana"</b> na tela inicial e na Arena, com uma <b>tabela dos 3 caminhos</b> (Arena, dentro de uma run e em grupo): o que cada um precisa e o que muda em cada um.'
      ] },
      { nome: 'Correções', itens: [
        'Enviar uma <b>sugestão</b> na tela de bugs e sugestões dava "violates row-level security policy". A regra do servidor recusava relatos sem contexto técnico (só o bug tem). Corrigido — e o que já estava na fila de envio sai sozinho.',
        'O aviso de <b>jornadas de outro aparelho</b> voltava depois de você guardar ou excluir: a sincronização rodava duas vezes ao mesmo tempo e perguntava de novo.'
      ] }
    ] },
  { versao: '2.7', data: '2026-09-25', titulo: 'O céu racha: os 14 chefes da semana', piada: 'O Eternatus pediu para avisar que não é ele que está atrasado: é o resto do universo que chegou cedo. O Zygarde pediu para constar que a fila é longa, mas ele não tem pressa: ele se regenera enquanto espera.',
    secoes: [
      { nome: 'Novidades', itens: [
        '<b>Evento semanal:</b> um chefe por semana, que vira toda <b>segunda-feira à meia-noite</b> (horário de Brasília), na rota final da Gen dele, só no <b>Roguelike</b> e no <b>Hardcore</b>. Ele aparece numa caixa roxa brilhante acima dos lendários, o mapa da Gen mostra o sprite dele na escolha, e a tela inicial traz a <b>agenda dos próximos 3 chefes</b> com as datas. Uma tentativa a cada <b>8 horas</b>.',
        'São <b>14 chefes</b>, e depois do último a lista recomeça: Eternatus Eternamax → Mega Rayquaza → Groudon Primal → Kyogre Primal → Mega Mewtwo → Necrozma Ultra → Calyrex Cavaleiro Espectral → Zacian Coroada → Kyurem Negro → Giratina Origem → Dialga Origem → Terapagos Estelar → Ursaluna Lua de Sangue → Zygarde Completo.',
        'Cada um é <b>muito difícil</b> e tem a sua mecânica. O <b>Eternatus</b> tem uma couraça de energia que corta o dano até se romper, o <b>Eternabeam</b> carregado com aviso (dá pra interromper causando dano suficiente no mesmo turno) e três fases. A <b>Mega Rayquaza</b> não tem couraça: tem um ponto fraco que muda a cada duas ações e o Dragon Ascent carregado. <b>Groudon e Kyogre</b> nascem com Sol e Chuva permanentes e anulam Água e Fogo; o <b>Giratina</b> abre o <b>Mundo Reverso</b> (a tabela de tipos inverte); o <b>Terapagos</b> resiste ao tipo do último golpe; a <b>Ursaluna</b> se cura com o dano que causa; o <b>Zygarde</b> se regenera; o <b>Calyrex</b> cresce a cada Pokémon seu que derruba. Todos são imunes a status e não dá pra fugir — mas perder não encerra a sua jornada.',
        '<b>Chefe no co-op:</b> na sala, o botão ☄ desafia o chefe da semana com o grupo. O HP dele cresce com o número de jogadores, mas menos que proporcional — jogar junto compensa. O golpe carregado atinge <b>o time todo</b>. Quem ficar sem nenhum Pokémon de pé pode <b>usar um Revive</b> (até 3 por luta) enquanto os outros seguram, e volta com metade do HP.',
        '<b>Itens de raide</b>, dados como prêmio e só válidos na luta do chefe (um de cada por luta): <b>Cristal de Ruptura</b> (expõe o chefe na hora), <b>Selo de Interrupção</b> (corta o golpe que ele está carregando) e <b>Escudo Astral</b> (o próximo golpe carregado causa metade do dano no time todo). No co-op qualquer jogador do grupo pode usar, sem gastar o turno.',
        'Derrotar um chefe libera a espécie dele na Pokédex e pra começar jornadas, dá a <b>insígnia de evento</b> dele (Domador do Infinito, Guardião do Pilar Celeste…) com título incluído, e um prêmio uma vez por semana. Na tela 👤 Conta você escolhe <b>uma</b> insígnia pra mostrar ao lado do seu nome — ela aparece também na sala do multiplayer, na lista de amigos e no ranking, e o servidor só mostra a de quem realmente venceu aquele chefe.'
      ] },
      { nome: 'Correções', itens: [
        '<b>Sucker Punch</b> (e Thunderclap) agora só funciona se o alvo escolheu um golpe de dano neste turno e ainda não agiu. Antes era só um golpe de prioridade que nunca falhava.'
      ] }
    ] },
  { versao: '2.6', data: '2026-09-25', titulo: 'Carteira, compras em atacado e curas pro nível 100', piada: 'Uma Potion de 20 HP num Pokémon nível 100 é tipo jogar um copo d\'água num incêndio. O lojista finalmente estocou o balde.',
    secoes: [
      { nome: 'Novidades', itens: [
        '<b>💰 Carteira:</b> o dinheiro virou uma pílula grande no topo, sempre fora do menu ☰ (feito pra quem joga no celular). Na <b>batalha</b> ele também aparece na barra de turno, que não sai da tela, e a <b>loja</b> abre com "Você tem ₽X". Quando o valor muda, aparece um <b>+₽ / −₽</b> ao lado.',
        'Comprar na loja abre um <b>HUD de quantidade</b>: botões −10, −, +, +10 e <b>Máx</b>, mais um campo para digitar, com o total e o troco atualizando na hora. Depois da compra, um <b>aviso 🛒</b> diz o que você levou, quanto pagou e quantos tem na mochila.',
        'Novas curas que acompanham o seu HP: <b>Mega Potion</b> (50% do HP máximo), <b>Max Potion</b> (todo o HP) e <b>Full Restore</b> (todo o HP e cura qualquer status). Também chegaram o <b>Max Ether</b> (restaura todos os PP), o <b>Max Revive</b> (reanima um aliado com o HP cheio) e o <b>X Sp. Def</b>.',
        '<b>📎 Imagens nos bugs e sugestões:</b> dá pra anexar até <b>2 imagens de até 2 MB cada</b>, em PNG, JPG ou WebP. No computador dá pra colar com Ctrl+V. O jogo reduz o print antes de enviar. Sem internet, as imagens ficam guardadas junto com o relato (se couberem) e sobem sozinhas depois.'
      ] },
      { nome: 'Equilíbrio', itens: [
        'Explorando agora dá pra achar mais variedade: Super, Hyper e Mega Potion, Burn Heal, Ice Heal e todos os X-itens.'
      ] }
    ] },
  { versao: '2.5', data: '2026-09-25', titulo: 'O tempo das rotas', piada: 'A Caverna Gelada avisa que o granizo é cortesia da casa. O guarda-chuva do Psyduck continua sendo cobrado à parte.',
    secoes: [
      { nome: 'Novidades', itens: [
        '<b>Clima e terreno de rota:</b> 27 rotas já começam a luta com o tempo da paisagem — neve nas geladas, <b>tempestade de areia</b> nos desertos, <b>sol forte</b> nos vulcões e praias, chuva nos lagos e pântanos — e 20 com terreno próprio (grama nos bosques, elétrico nas usinas, psíquico nas ruínas, névoa em Rivière e Glimwood). Vale para os dois lados, no single player e no co-op.',
        'O efeito da rota é <b>permanente</b>: só sai quando um golpe ou habilidade troca o tempo ou o chão. A troca dura os 5 turnos de sempre e, quando acaba, a rota volta ao que era. O selo na cena mostra <b>da rota</b> no lugar da contagem de turnos.',
        'Nova opção na tela inicial: <b>🌦 Clima e terreno das rotas</b>. No <b>Roguelike</b> e no <b>Hardcore</b> ela é sempre ligada; nos outros modos vem <b>desligada</b> e você liga se quiser. Só dá pra escolher no começo da jornada.',
        '<b>Weather Ball</b> muda de tipo e dobra o poder conforme o tempo (Fogo no sol, Água na chuva, Pedra na areia, Gelo no granizo e na neve), e o botão do golpe mostra o tipo de agora.',
        '<b>Castform</b> agora muda de forma com o tempo (Forecast): vira Fogo no sol, Água na chuva e Gelo no granizo ou na neve — os tipos e o sprite acompanham, inclusive o tempo da rota, e ele volta ao normal no fim da luta.'
      ] }
    ] },
  { versao: '2.4', data: '2026-09-25', titulo: 'Habilidades de verdade', piada: 'O Slakoth pediu para constar que a nova habilidade dele está funcionando perfeitamente. Ele descansou, para provar.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Mais de <b>50 habilidades</b> passam a valer em batalha, entre elas <b>Moxie</b>, <b>Defiant</b>, <b>Competitive</b>, <b>Contrary</b>, <b>Simple</b>, <b>Unaware</b>, <b>Mirror Armor</b>, <b>Poison Heal</b>, <b>Truant</b>, <b>Pressure</b>, <b>Iron Fist</b>, <b>Strong Jaw</b>, <b>Sharpness</b> e <b>Steelworker</b>.',
        'Habilidades que <b>reagem a levar um golpe</b>: Steam Engine, Water Compaction, Stamina, Weak Armor, Justified, Rattled, Anger Point, Sand Spit e Seed Sower. Também entram Gooey e Tangling Hair (baixam a Velocidade de quem encosta), Poison Touch, Wonder Skin e as três que barram golpe de prioridade (Dazzling, Queenly Majesty, Armor Tail).',
        'Defesa e entrada em campo: <b>Fur Coat</b> e <b>Ice Scales</b> (metade do dano físico / especial), <b>Super Luck</b> (crítico mais fácil), <b>Intrepid Sword</b> e <b>Dauntless Shield</b> (sobem um atributo ao entrar), Grass Pelt e Flower Gift. Hadron Engine e Orichalcum Pulse ligam o terreno elétrico / o sol e ainda dão o bônus de atributo junto.'
      ] },
      { nome: 'Equilíbrio', itens: [
        'A <b>XP por vitória caiu para 60%</b>: são mais batalhas por nível e a jornada dura cerca de <b>1,65× mais</b>. O equilíbrio relativo não mudou — treinador continua valendo 1,5× de um selvagem, e o modo escolhido continua pesando igual.',
        'Mexemos na XP ganha, e não na curva de nível: a curva vem da PokéAPI e fica guardada no seu aparelho, então mudá-la quebraria a comparação com as jornadas que você já terminou.'
      ] },
      { nome: 'Correções', itens: [
        '<b>Download</b> agora lê o oponente: sobe o Ataque se a Defesa dele é menor que a Defesa Especial, e o Ataque Especial no caso contrário (antes subia sempre o Ataque Especial).',
        '<b>Guard Dog</b> sobe o Ataque quando alguém tenta intimidar, em vez de só impedir a queda. <b>Sand Force</b> dá +30% em golpes de Pedra, Terra e Aço na tempestade de areia. <b>Effect Spore</b> sorteia entre sono, paralisia e veneno, como no jogo, e não pega em Grama.',
        '<b>Water Bubble</b> também dobra os seus golpes de Água. <b>Toxic Boost</b> só vale envenenado e <b>Flare Boost</b> só queimado. <b>Magic Guard</b> bloqueia todo dano indireto (veneno, queimadura, recuo, armadilhas, Rough Skin…), e não só o clima.',
        'Inner Focus, Own Tempo e Oblivious agora são imunes à Intimidação. E no <b>multiplayer</b> a Intimidação, o Download e as habilidades de degrau ao entrar em campo finalmente funcionam (antes só valiam no single player).'
      ] }
    ] },
  { versao: '2.3', data: '2026-09-24', titulo: 'Para quem não decorou a tabela, e o esconderijo', piada: 'Descobrimos que nem todo mundo nasce sabendo que Planta é fraco contra Inseto. Corrigimos o jogo, não as pessoas.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Cada golpe seu agora mostra, no próprio botão, <b>o quanto ele é vantajoso</b> contra quem está na sua frente: extremamente efetivo (⏫), super efetivo (🔼), dano normal, pouco efetivo (🔽), quase sem efeito (⏬) ou não afeta (✖). Vem com cor, seta e texto ao mesmo tempo — cor sozinha não serve para quem não a distingue.',
        'O <b>tipo</b> de quem está em campo aparece na plaquinha de batalha, dos dois lados. Era o dado que explicava por que o seu golpe bateu fraco e ele estava escondido na ficha, a um clique de distância. Quem terastalizou mostra o tipo Tera, que é o que vale.',
        'Na Pokédex da rota, os Pokémon que você já encontrou viraram <b>clicáveis</b>: abrem a ficha completa na Pokédex.',
        'Chegou o <b>esconderijo</b>: aliados que não cabem na equipe esperam lá, em vez de se despedir para sempre. Dá para <b>guardar e trazer</b> quando quiser, fora de batalha, pelo painel de Aliados — quem volta entra descansado (atributos baixados e recuo são zerados ao guardar).',
        'O tamanho da equipe <b>não mudou</b>: a decisão de quem leva para a próxima rota continua existindo. O que acabou foi a perda permanente.',
        'Mais 16 habilidades ativas em batalha, entre elas <b>Battle Armor</b> e <b>Shell Armor</b> (o golpe nunca sai crítico contra você, nem quando seria garantido), Earth Eater, Purifying Salt, Victory Star e No Guard.'
      ] }
    ] },
  { versao: '2.2', data: '2026-09-24', titulo: 'Terastalização, Z-Move e Gigantamax', piada: 'Seu Charizard finalmente pode olhar para uma pedra sem suar frio. O Alfa leu as notas, achou injusto e foi atrás do próprio cristal.',
    secoes: [
      { nome: 'Novidades', itens: [
        'A <b>Terastalização</b> chegou. Cada tipo é conquistado à parte (200 derrotados daquele tipo), e na batalha você escolhe entre os que já tem: o botão 💎 <b>não gasta o turno</b>, igual à Mega.',
        'Terastalizado, você passa a ter <b>um tipo só</b> para receber golpe — é o que muda a luta: um Charizard Tera Água deixa de tomar 4× de Pedra. No ataque, a regra é a dos jogos: golpe do tipo Tera que você <b>já tinha</b> bate ×2, um tipo Tera novo bate ×1,5, e o STAB que você já tinha continua valendo. Dá para usar Tera e Mega na mesma batalha — são conquistas diferentes, cada uma com o seu custo.',
        'O <b>Z-Move</b> chegou. Conquistado um Z (250 eliminações com o golpe, ou 500 com golpes do mesmo elemento), a loja passa a vender o <b>Cristal Z</b> por ₽12.000 — e, segurando o cristal, o botão 🌀 converte um golpe seu num golpe muito mais forte, uma vez por batalha.',
        'Ao contrário da Mega e da Tera, o <b>Z-Move é o seu turno</b>: ele não transforma nada, ele é o ataque da rodada (e gasta o PP do golpe). O botão é laranja justamente para não ser clicado achando que é de graça. A conversão segue a tabela dos jogos, achatada no topo: um golpe de 60 vira 120, um de 120 vira 190 — usar o Z no golpe fraco rende mais.',
        'O <b>Gigantamax</b> chegou, e com ele as quatro gimmicks estão jogáveis. Conquistado (nível 50 com a espécie em 25 jornadas), o botão 🔴 <b>dobra o seu HP</b> por 3 turnos e transforma todo golpe num golpe Max — e o seu Pokémon fica <b>gigante na tela</b>. É a única das quatro que <b>não pede item</b>: quem levou 25 jornadas para chegar aqui já pagou o preço.',
        'O HP do Gigantamax volta na mesma proporção ao encolher: se você estava com metade da vida gigante, volta com metade da vida normal. E a tabela do golpe Max é mais modesta que a do Z de propósito — o Z é um tiro único, o Max vale três turnos.',
        'O <b>inimigo agora terastaliza</b>: Alfa, lendários e treinadores, ao cair à metade do HP, como já acontecia com a Mega. Mas só uma virada por luta — quem já megaevoluiu não terastaliza também, senão o combate viraria de cabeça para baixo de uma vez só.'
      ] }
    ] },
  { versao: '2.1', data: '2026-09-24', titulo: 'Mega Evolução', piada: 'Mil vitórias depois, a pedra finalmente reagiu. Dava pra ter reagido na quingentésima, mas pedra é assim.',
    secoes: [
      { nome: 'Novidades', itens: [
        'A <b>Mega Evolução</b> chegou. Conquistada a Pedra Mega de uma espécie (1.000 golpes finais dados sendo ela, na evolução final), aparece um botão ⚡ na batalha — e ele <b>não gasta o seu turno</b>: você megaevolui e ataca na mesma rodada. A forma Mega muda status, tipos, habilidade e aparência de verdade, e dura até o fim da batalha. Charizard e Mewtwo perguntam qual forma você quer (X ou Y), e Groudon e Kyogre entram pela mesma porta com o nome certo: <b>Reversão Primitiva</b>.',
        'A <b>Pedra Mega</b> existe de verdade: conquistar a Mega de uma espécie libera a <b>compra</b> da pedra (₽15.000 na loja, só para a sua espécie), e é preciso <b>segurá-la</b> para megaevoluir. Rayquaza é a exceção, como nos jogos: ele megaevolui por saber <b>Dragon Ascent</b>, sem pedra nenhuma.',
        'O outro lado também joga esse jogo: <b>Alfa, lendários e treinadores</b> podem megaevoluir, e fazem isso quando caem à metade do HP. A luta tem segunda fase agora. Selvagem de rota continua selvagem de rota, e só você megaevolui — aliado não, mesmo que a espécie dele esteja liberada.',
        'São <b>95 formas cobrindo 89 espécies</b>, e a tela de Conquistas ganhou o <b>catálogo das Megas</b>: dá para ver todas elas, de todas as Gens, e quais você já conquistou.',
        'Dá para <b>acompanhar uma conquista da conta</b> durante a jornada: o botão 📌 na tela de Conquistas fixa uma, ela aparece no painel de Missões com o quanto falta, e ao completar você é avisado e <b>ganha a recompensa nesta run</b> — além de valer nas próximas.',
        'A tela de batalha agora tem a <b>cara da rota</b>: caverna, mar, usina, vulcão, floresta, gelo e mais, cada uma com céu, chão e luz próprios. E a lista de espécies desbloqueadas ganhou <b>busca</b> (por nome ou número) e vem sempre em ordem de Pokédex, com o número visível.'
      ] }
    ] },
  { versao: '2.0', data: '2026-09-24', titulo: 'A região decide a forma, e a rota não acaba antes da missão', piada: 'O Exeggcute foi passar férias em Alola e voltou com um sotaque de Dragão. Coisas que acontecem.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Evoluir <b>dentro da região</b> agora dá a forma regional: use a Pedra da Folha num Exeggcute em Alola e vem o Exeggutor de Alola, não o de Kanto. Vale pra todas as regiões e todas as formas que existem no mapa — Alola, Galar, Hisui e Paldea. Antes a evolução saía sempre na forma padrão, e a única maneira de ter uma forma regional era encontrar uma pronta no Santuário.',
        'O registro continua contando na espécie (Exeggutor), então Pokédex, desbloqueios e conquistas não mudam — o que muda é o Pokémon que fica com você, com os tipos, os status e os golpes da forma de lá.'
      ] },
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
  { versao: '1.9', data: '2026-09-24', titulo: 'Não era a sua internet', piada: 'O jogo passou dias jurando que a culpa era da sua conexão. Metade das vezes a culpa era de uma função que nunca foi escrita. Pedimos desculpas à sua operadora.',
    secoes: [
      { nome: 'Correções', itens: [
        'Clicar num Pokémon na tela de criação dava "A conexão falhou ao buscar um dado da PokéAPI" e não deixava começar jornada nenhuma. Não era a conexão: a prévia chamava uma função que nunca tinha sido escrita, e o erro caía no mesmo tratamento da busca de rede. Por isso limpar cache, trocar de rede e baixar tudo de novo não adiantavam — e por isso o Full Randomizer continuava funcionando, já que ele não desenha a prévia. A função que faltava é a opção <b>✨ Começar shiny</b>, que agora existe de verdade. <b>Erro de código não se disfarça mais de erro de rede.</b>',
        'Não dava pra começar uma jornada quando a conexão estava ruim, mesmo com o mapa todo baixado. O jogo tinha o dado guardado, mas só aceitava a versão guardada quando o aparelho se declarava SEM internet — e wi-fi de metrô, portal cativo de hotel e 4G fraco contam como "com internet" pro navegador. Agora, se a rede falhar, o jogo segue com o que já está guardado.',
        'As imagens agora vêm de um CDN (o jsDelivr, que espelha o mesmo repositório de sprites). O endereço antigo é bloqueado em várias redes — provedor, DNS de celular, rede corporativa — e quando isso acontece TODA imagem do jogo some de uma vez, online inclusive.',
        'Baixar um mapa em "Jogar offline" agora traz também as <b>curvas de XP e as árvores de evolução</b>. Sem elas, dava pra explorar offline mas NÃO dava pra começar uma jornada nem evoluir. A árvore de evolução também deixou de ser obrigatória pra começar: ela só é consultada quando você sobe de nível.',
        'A tela de "Jogar offline" pedia pra baixar de novo e nada mudava, por mais vezes que você baixasse: uma única imagem que não descia, entre centenas de pedidos, impedia o mapa de ser marcado como pronto. Agora falha de dado e falha de imagem são contadas separadas — sem o dado não dá pra jogar, sem a imagem dá. Sprite que falha é tentada de novo, e o download avisa em vez de mentir.',
        'Novo botão <b>🗑 Limpar tudo e baixar de novo</b>: apaga o que está guardado da PokéAPI e baixa do zero, pra quando algo ficou pela metade (baixar por cima só busca o que falta). Saves, carreira e conquistas não são tocados.',
        'A tela de "Jogar offline" agora avisa quando a página está fora do controle do service worker (acontece logo depois de uma recarga forçada). Nessa situação os dados seriam guardados mas as imagens não, e você só descobriria sem internet — com o download inteiro já jogado fora.',
        'As mensagens de erro de rede agora dizem QUAL dado faltou (a curva de XP, a árvore de evolução, um golpe…) em vez de só "a conexão falhou". E o jogo passou a se atualizar sozinho quando sai uma versão nova: antes, uma aba deixada aberta continuava rodando a versão velha até você fechar o navegador.',
        'Aliado que usava Self-Destruct no Roguelike quebrava o turno inteiro ("Algo deu errado neste turno"): ele é perdido na hora, e a tela ainda tentava mostrar quem estava agindo usando a posição dele na equipe, que já não existia.'
      ] }
    ] },
  { versao: '1.8', data: '2026-09-23', titulo: 'Badges, e cada mapa uma história', piada: 'As medalhas antigas ficavam só bonitas na parede. Estas aqui vêm com uma Potion dentro.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Fechar uma Gen agora ENCERRA a jornada em vitória: o seu Pokémon se aposenta como campeão daquele mapa, a jornada é pontuada e entra na carreira, e a próxima começa do zero na Gen seguinte — outro Pokémon, nível 5, mapa nos níveis normais dele. A tela de fim já propõe o mapa seguinte.',
        'Seguir com o MESMO Pokémon continua sendo possível, escolhendo ali na hora: você leva equipe, mochila e dinheiro, e o mapa novo se ajusta ao seu nível. Só que cada continuação vale 20% menos pontos no ranking (com piso de metade), porque chegar num mapa novo já forte é bem mais fácil.',
        '<b>Badges da conta:</b> conquistas de longo prazo na tela 🏅 Conquistas — marcos de caçada, um especialista por tipo, Pokédex regional e nacional, 100 aliados recrutados, recrutar um lendário, recrutar um shiny, fechar uma Gen no Hardcore, terminar uma jornada sem usar o Centro Pokémon, e mais.',
        'Cada badge conquistada vira vantagem na PRÓXIMA jornada: itens ou dinheiro no começo. Derrotar 1.000 Pokémon do tipo Planta, por exemplo, faz você começar com uma Pedra da Folha na mochila. Na criação dá pra desligar as vantagens e jogar do zero — quem faz isso ganha 10% a mais de pontos no ranking.',
        'As duas conquistas do Rayquaza entraram: recrutar um shiny e conquistar a Mega dele contam separadas, em qualquer ordem. Quem tiver as duas ganha a loja de graça para sempre.'
      ] },
      { nome: 'Equilíbrio', itens: [
        'No Roguelike, quando o seu nível passa do dobro do teto de uma rota, ela fica esgotada: não aparece mais ninguém pra lutar ali. Você continua entrando e vendo a Pokédex da rota — o que acaba é o farm em rota fraca. Nos outros modos nada muda.'
      ] }
    ] },
  { versao: '1.7', data: '2026-09-23', titulo: 'A conta começou a contar: Conquistas e Pokédex', piada: 'Instalamos um contador na sua conta. Ele já estava lá antes, mas só fazia contato visual com os Pokémon derrotados e anotava mentalmente.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Nova tela <b>🏅 Conquistas</b>: tudo o que a sua conta acumulou ao longo da carreira inteira, incluindo a jornada em andamento. A partir de agora o jogo registra, a cada vitória, os tipos do Pokémon derrotado, a espécie que você estava usando, o golpe que finalizou e o elemento dele — é o que vai desbloquear as gimmicks quando elas chegarem. Com marcos de caçada de 1.000, 10.000, 100.000 e 1.000.000 de Pokémon derrotados.',
        'O abate do aliado conta para a espécie que você está usando (ele luta ao seu lado, afinal), mas tipo e golpe só contam quando o golpe final foi seu.',
        'Nova tela <b>📖 Pokédex</b>: as 1025 espécies do jogo, as que você já encontrou com sprite e nome, as outras ainda como "?". Toque em quem você conhece pra abrir a ficha completa: tipos, atributos base, habilidades com descrição, quantas vezes você já viu, derrotou e recrutou, e <b>onde</b> aquele Pokémon aparece (quais rotas de quais mapas, com a chance de encontro, avisando quando ele é Alfa ou participa de uma luta final).',
        'Recrutou um Pokémon <b>shiny</b>? A espécie dele fica desbloqueada na hora — e você pode começar jornadas novas jogando com ele ✨ shiny, quantas vezes quiser. Encontrar um é 1 em 4096; o direito é seu pra sempre.',
        'Os <b>Alfas de rota</b> foram refeitos: nenhum se repete mais dentro do mesmo mapa, cada um combina com o tema da rota (nada de Aggron guardando o Mar de Hoenn) e cada mapa fecha com seu pseudo-lendário — Dragonite, Tyranitar, Salamence, Garchomp, Hydreigon, Goodra, Kommo-o, Dragapult e Archaludon. E o lendário da luta final agora é sorteado a cada jornada: fechar Kanto não é mais sempre Mewtwo.'
      ] },
      { nome: 'Correções', itens: [
        'As conquistas da conta estavam sendo <b>perdidas no fim de cada jornada</b>: o contador subia enquanto você jogava e a carreira nunca recebia nada. E o que sobrevivia era recalculado a partir do histórico, então apagar uma jornada da carreira apagava junto o que ela tinha liberado. Agora as espécies desbloqueadas e o progresso das gimmicks ficam gravados na conta, em lugar próprio, e <b>só crescem</b> — nada do que você conquistou se perde. Com conta, isso sobe pra nuvem e volta em qualquer aparelho.',
        'As espécies desbloqueadas passaram a valer em TODOS os modos, não só no Roguelike. Conquistar o desbloqueio continua sendo coisa de jornada Roguelike; usar o que você já conquistou, não — e a tela de criação agora avisa isso, em vez de deixar você jogar uma jornada inteira esperando o contrário.',
        'A tela de Conquistas estava com texto montado em cima das barras de progresso nas linhas sem sprite (tipos e golpes).'
      ] }
    ] },
  { versao: '1.6', data: '2026-09-23', titulo: 'O Santuário: a Gen inteira, depois da vitória', piada: 'Os iniciais aceitaram sair do sindicato e voltar a aparecer — mas só no bairro nobre, e só para quem já venceu os lendários.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Cada mapa ganhou uma 11ª área, o <b>🏛 Santuário</b>, que abre quando você vence os lendários daquela Gen. Nele vive a Gen inteira: todas as espécies, com as linhas evolutivas completas, mais os iniciais, os lendários e os míticos. Com isso, dá para encontrar todo Pokémon de uma Gen depois de fechá-la — nenhuma espécie fica inalcançável.',
        'As <b>formas regionais</b> entraram no jogo pela primeira vez: Alolan no Santuário de Alola, Galarian e Hisuian no de Galar, Paldean no de Paldea. São 53 formas que antes não existiam em lugar nenhum.',
        'A raridade de cada Pokémon no Santuário segue a dificuldade de captura da espécie, igual ao resto do jogo — comum aparece mais, raro aparece menos.',
        'No Roguelike, vencer os lendários não encerra mais a run na marra: a vitória fica garantida na hora (o mapa seguinte libera do mesmo jeito) e você escolhe entre encerrar ou continuar explorando o Santuário que acabou de abrir. Se você seguir e desmaiar lá, a run termina em derrota — mas a Gen vencida continua fechada e liberada pras próximas.',
        'Lendários e míticos encontrados no Santuário aceitam petisco e podem virar aliados, mas confiam bem mais devagar que um Pokémon comum: espere mais de uma dezena de ofertas.'
      ] }
    ] },
  { versao: '1.5', data: '2026-09-23', titulo: 'Golpes, telas e armadilhas', piada: 'As Pedras Afiadas agora cobram pedágio na entrada. O sindicato dos Charizard já entrou com recurso. O Aegislash, esse, passou o jogo inteiro segurando o escudo na frente e a espada atrás.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Cada lado da batalha passou a ter o seu campo, e o que está no ar aparece no topo da luta: 🛡 do seu lado, ⚔ do lado do inimigo.',
        '<b>Telas:</b> Reflect corta pela metade o dano dos golpes físicos, Light Screen o dos especiais e Aurora Veil os dois (mas só funciona no granizo ou na neve). Duram 5 turnos e não empilham. <b>Safeguard</b> bloqueia status vindos do inimigo por 5 turnos (e não atrapalha quando você mesmo se põe pra dormir com Rest), <b>Mist</b> impede o inimigo de baixar os seus atributos e <b>Tailwind</b> dobra a velocidade do seu lado por 4 turnos.',
        '<b>Armadilhas de entrada:</b> Stealth Rock machuca conforme a fraqueza de quem entra (dobra em Voador!), Spikes empilha até 3 camadas e Toxic Spikes até 2 (a segunda envenena gravemente). Quem é Venenoso e anda no chão limpa os espinhos venenosos ao entrar. Elas pegam o próximo Pokémon que entra em campo — os do treinador e a fila de lendários; como você nunca troca de Pokémon, o jogo avisa na hora de usar que, do seu lado, não há em quem pegar.',
        '<b>Mudança de Postura</b> entrou no jogo: o Aegislash vira a Forma Lâmina quando ataca (ataque altíssimo, defesa de papel) e volta para a Forma Escudo quando usa King\'s Shield. É a primeira habilidade do jogo que troca a forma do Pokémon no meio da batalha.',
        'As <b>barreiras</b> deixaram de ser todas iguais: King\'s Shield tira 2 de Ataque de quem tenta encostar, Obstruct tira 2 de Defesa, Spiky Shield machuca, Baneful Bunker envenena, Silk Trap tira Velocidade e Burning Bulwark queima. Só vale para golpes físicos — quem ataca de longe é bloqueado sem se machucar.',
        '<b>Escama do Coração</b> (₽5.000): faz o Pokémon relembrar um golpe que ele já podia ter aprendido subindo de nível e que você deixou passar. Também aparece, bem raramente, entre os itens achados explorando.',
        '<b>Disco Técnico</b> (₽8.000, só na loja): ensina um golpe que a Pokédex diz que a espécie aprende por MT, tutor ou herança — golpes que nunca apareceriam subindo de nível. Cada Disco usado deixa o próximo ₽4.000 mais caro. Os dois funcionam em você e em qualquer aliado, e é você quem escolhe qual golpe sai pra dar lugar ao novo.',
        'Aliado que aprende um golpe sozinho agora tem vontade própria: metade das vezes ele prefere ficar com o que já sabe, e quando troca, troca um golpe qualquer — nada de sempre descartar o mais fraco pelo mais forte.',
        'As três raças do Tauros de Paldea e o Darmanitan de Galar entraram nos Santuários, junto das outras formas regionais (agora são 57).'
      ] },
      { nome: 'Correções', itens: [
        'Flame Charge (e todo golpe que dá bônus a quem usa: Power-Up Punch, Ancient Power, Charge Beam…) estava aumentando o atributo do OPONENTE. Agora o bônus vai para quem usou o golpe — e os golpes que cobram um preço de quem usa, como Close Combat e Draco Meteor, continuam baixando os atributos do próprio usuário.',
        'Evoluir não reescreve mais o moveset inteiro: a evolução entrega o golpe que ela realmente concede (o Stomp do Exeggutor, o King\'s Shield do Aegislash), e não toda a lista de golpes que a forma nova saberia se tivesse acabado de nascer.',
        'O <b>Disco Técnico</b> não funcionava em jornadas começadas antes dele existir: a ficha do Pokémon guarda uma cópia dos dados da espécie, e essa cópia não tinha a lista de golpes de MT, tutor e herança. Agora ela é atualizada sozinha na primeira vez que você usa o item com internet.',
        'Os Alfas que eram formas evoluídas de inicial estavam anunciando um nome e aparecendo com o corpo de outro Pokémon. Agora o nome e a espécie do Alfa mudam sempre juntos.'
      ] }
    ] },
  { versao: '1.4', data: '2026-09-23', titulo: 'O jogo inteiro no bolso (e os iniciais em greve)', piada: 'O navegador olhou 1082 figurinhas de 600 bytes e anunciou, com toda a confiança, que elas pesavam 20 gigabytes. Pedimos uma segunda opinião.',
    secoes: [
      { nome: 'Novidades', itens: [
        'Dá pra baixar o JOGO INTEIRO pra jogar sem internet: ⚙ Ajustes → Jogar offline → "⬇⬇ Baixar o jogo inteiro". São os 9 mapas, com dados, golpes e sprites de todo mundo.',
        'O que o jogo guarda no aparelho saiu da caixinha apertada de antes e foi pro armazenamento grande do navegador — é o que permite guardar todos os sprites sem estourar o limite. A mesma tela mostra quanto espaço está em uso.',
        'Os iniciais das 9 regiões (e as evoluções deles) não aparecem mais soltos nas rotas: escolher o seu no começo da jornada volta a significar alguma coisa. Pikachu e Eevee continuam aparecendo normalmente.',
        'Treinadores de rota não têm mais só bicho da rota: metade da equipe deles pode ser qualquer espécie do mapa, sempre no nível da rota. Eles viajam, afinal.'
      ] },
      { nome: 'Correções', itens: [
        'A tela de "Jogar offline" dizia que o jogo ocupava mais de <b>20 GB</b> no aparelho. Não ocupava: os sprites são minúsculos (cerca de 600 bytes cada) e o jogo inteiro cabe em uns 20 MB. O número inflado vinha de como as imagens eram pedidas, e isso também podia fazer o download do jogo inteiro falhar por "falta de espaço" sem motivo nenhum. O espaço antigo é liberado sozinho na próxima vez que você abrir o jogo.',
        'Quando a internet do celular piscava, a exploração morria com um "Failed to fetch". Agora o jogo tenta de novo sozinho (até 3 vezes, com uma pausa entre elas) antes de desistir — o que resolve a maioria dessas falhas.',
        'As mensagens de erro de rede foram reescritas pra quem joga: falam de conexão instável, de limite da PokéAPI ou de erro do servidor, e lembram que dá pra baixar o mapa inteiro em ⚙ Ajustes → Jogar offline. Os avisos de "sem internet" do Alfa, dos lendários e da exploração também apontam pra lá.',
        'Evolução agora entrega os golpes que ela deveria entregar: o golpe assinatura da forma nova (o King\'s Shield do Aegislash é o caso clássico) era perdido para sempre por quem evoluía acima do nível 1. A habilidade também acompanha a evolução direito, mantendo o slot — quem tinha habilidade oculta continua com a oculta, e o jogo avisa no registro quando ela muda de nome.',
        'Se a internet cair bem na hora de uma evolução, ela não some mais: fica pendente, aparece na ficha e acontece sozinha assim que a rede volta.',
        'Item sem imagem na PokéAPI (Coroa Galárica e companhia) mostra um ícone de caixinha no lugar do buraco que ficava antes.',
        'O menu ☰ do celular estava com menos opções do que as telas ofereciam. Agora ele mostra os mesmos acessos: Início, Jornadas, Carreira, Ranking, Multiplayer, Conta, Novidades, Ajustes e Bugs — além de Layout e Novo jogo.'
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
  { versao: '1.2', data: '2026-09-22', titulo: 'Agora chove, e o chão entrou na briga', piada: 'O departamento meteorológico de Kanto pede desculpas pelos 30 anos de sol constante. O Campo de Grama foi aparado; o jardineiro de Paldea agradece as mensagens de carinho.',
    secoes: [
      { nome: 'Novidades', itens: [
        'As batalhas agora têm <b>clima</b>: sol forte, chuva, tempestade de areia, granizo e neve. Ele aparece no topo da luta, com quantos turnos ainda faltam. Sol deixa os golpes de Fogo 50% mais fortes e afraquece os de Água; a chuva faz o contrário. Areia e granizo machucam todo turno quem não for do tipo certo, e a neve dá mais Defesa pros Pokémon de Gelo.',
        'Chegaram os <b>terrenos</b>: Campo Elétrico, Campo de Grama, Campo Psíquico e Campo de Névoa, que também duram 5 turnos e aparecem no topo da luta junto do clima. Elétrico deixa os golpes Elétricos 30% mais fortes e ninguém dorme; Grama fortalece golpes de Planta e cura um pouquinho todo turno; Psíquico fortalece os Psíquicos e barra golpes de prioridade; Névoa corta o dano de Dragão pela metade e bloqueia qualquer status.',
        'O terreno só vale pra quem está <b>NO CHÃO</b>: Pokémon do tipo Voador e quem tem Levitate flutuam e ficam de fora — inclusive da cura e da proteção.',
        'Rain Dance, Sunny Day, Sandstorm, Hail, Snowscape, Electric Terrain, Grassy Terrain, Psychic Terrain e Misty Terrain funcionam: ligam o tempo ou o chão por 5 turnos, valendo pros dois lados.',
        'Habilidades de clima e terreno entraram em peso: Drizzle, Drought, Sand Stream e Snow Warning mudam o tempo assim que o Pokémon aparece, e Electric Surge, Grassy Surge, Psychic Surge e Misty Surge ligam o campo. Swift Swim, Chlorophyll, Sand Rush, Slush Rush e Surge Surfer dobram a velocidade no ambiente certo; Rain Dish, Ice Body e Dry Skin curam; Sand Veil e Snow Cloak fazem o inimigo errar mais; Hydration limpa status na chuva; Leaf Guard protege no sol; Solar Power troca poder por HP.',
        'Thunder e Hurricane nunca erram na chuva (e ficam bem imprecisos no sol) e Blizzard acerta sempre no granizo e na neve. Solar Beam e Solar Blade disparam na hora quando está sol.'
      ] }
    ] },
  { versao: '1.1', data: '2026-09-22', titulo: 'Celular, sala mais firme e Caça Shiny', piada: 'Um Fake Out estava sendo usado até no meio da conversa. Agora ele só assusta uma vez, como manda a boa educação.',
    secoes: [
      { nome: 'Novidades', itens: [
        'No celular, a batalha virou tela fixa: a cena do combate fica presa no topo e o resto da página (golpes, registro, ficha, aliados e mochila) rola normalmente por baixo, então dá pra ver o seu Pokémon e o inimigo enquanto escolhe o que fazer.',
        'Novo modo <b>🎯 Caça Shiny</b>, ligado no começo da jornada: quando você revelar todas as espécies de uma rota, escolhe UMA delas pra ser a única que aparece por ali. Bom pra caçar shiny — ou pra farmar uma espécie específica. Muda só o selvagem: treinador, item e dinheiro continuam aparecendo igual.',
        'Dois <b>repelentes</b> na loja: o Seletivo (30 explorações) deixa passar só a espécie que você escolher da rota, e o Total (40 explorações) espanta todos os selvagens. Com eles ligados você segue achando treinadores, itens e dinheiro normalmente.',
        'Na sala multiplayer agora tem Centro Pokémon: dá pra curar a equipe entre as lutas sem sair da sala.'
      ] },
      { nome: 'Correções', itens: [
        'Dava pra escapar de qualquer batalha "sem fuga" — treinador, Alfa, lendário — só recarregando a página. A batalha em andamento agora vai junto no save e volta do jeito que estava, no mesmo turno.',
        'Fake Out (e First Impression) só funcionam no primeiro golpe da batalha. Antes dava pra usar em qualquer turno e fazer o inimigo recuar sempre.',
        'Sala multiplayer: as escolhas às vezes não chegavam no anfitrião e o turno só saía quando o prazo de 45 segundos estourava. Agora cada mensagem é reenviada quando falha, o anfitrião repete o estado da luta de tempos em tempos e existe um botão 🔄 Sincronizar.',
        'Trocar de aba não derruba mais você da sala: a conexão tenta voltar sozinha, e o jogo espera o anfitrião reaparecer antes de encerrar a sala. A sala também mostra o estado da conexão (conectado / instável / sem conexão) e tem um diagnóstico com as últimas mensagens trocadas.'
      ] },
      { nome: 'Equilíbrio', itens: [
        'O inimigo não sorteia mais qualquer golpe: agora ele tende a escolher o que dá mais dano em você, olhando tipo e eficácia.',
        'O quanto ele acerta a escolha depende de quem é: selvagem erra bastante (metade das vezes), treinador pensa melhor, e Alfa e lendário quase sempre escolhem o melhor golpe. Vale também nas batalhas multiplayer.'
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
