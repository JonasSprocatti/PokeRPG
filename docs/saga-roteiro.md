# ⚔ Saga — o roteiro completo

> **GERADO** por `ferramentas/gerar-roteiro-saga.mjs` a partir de `js/dados-saga-mundo.js` — não editar à mão.
> O resumo da história, os finais e as regras da escrita estão em `docs/saga-historia.md`.

Legenda: 🗣 personagem · 🚪 porta · 🪧 placa · 📦 baú · 👣 ao pisar · ⚔ luta · ⏎ quebra de linha. Entre colchetes, o que acontece; em _(se …)_, quando aquilo está ali. Nome entre crases é uma marca do save.

## Capítulo 1 · A Fonte Calada — Vale do Orvalho

### Missões

- **A Fonte Calada**
  1. Ouça os dois lados e volte ao Ancião: a ferreira Brasa, na aldeia, e a Mãe Meganium, no fundo do Bosque do Orvalho (oeste).
  2. Com a lamparina, entre nas Ruínas da Fonte: uma gruta no paredão, no fim da Estrada Velha (leste).
  3. O Coração da Fonte está com você. Decida a quem entregá-lo.
- **Os canteiros da Vó**
  1. Expulse o bando acampado ao sul do Bosque do Orvalho, perto do lago, e volte à Vó Vileplume.
- **A marca do martelo**
  1. Ache o caixote de minério num recanto de pedra, a leste da Estrada Velha, e leve à ferreira Brasa.
- **A lição do Cabo**
  1. Vença os dois brigões perto do portão norte de Pedralume e volte ao Cabo Lairon.
- **O que o poço lembra** 🤫 _secreta_
  1. “A árvore que não é árvore.” Algo no norte do Bosque do Orvalho não é o que parece.
  2. Alguém na aldeia deve se lembrar deste sino. Quem ali tem memória comprida?

### Lugares

#### Pedralume

_Uma aldeia em volta de uma fonte que não canta mais._

- 🚪 porta → Bosque do Orvalho
- 🚪 porta → Estrada Velha
- 🗣 Cabo Lairon _(se sem `cap1`)_
- 🚪 porta → Passo do Norte
- 🗣 Cabo Lairon _(se `cap1`)_
- 🗣 Ancião Torkoal
- 🗣 Brasa, a ferreira
- 🗣 Dona Chansey
- 🗣 Kecleon, o mercador
- 🗣 Tio do Poço
- 🗣 Pichu
- 🪧 “Um poço. A corda desce, bate em pedra seca e volta leve.”
- 🪧 “Forja de Pedralume. Embaixo, riscado a prego: “sem água, sem têmpera”.”
- 🪧 “Pousada do Sino. O sino da tabuleta foi raspado, mas o contorno ficou.”
- 🪧 “Kecleon — de tudo, de todas as cores.”
- ⚔ luta (bando, `venceu:treino`) — “Dois brigões rolam na poeira perto do portão. Quando te veem, param de brigar entre si. Agora o alvo é você.”

#### Bosque do Orvalho

_As últimas flores do vale ainda abrem aqui._

- 🚪 porta → Pedralume
- 🚪 porta → Clareira do Sineiro
- 🗣 Vó Vileplume
- 🗣 Mãe Meganium
- 👣 “O mato alto do bosque balança sem vento. Tem gente morando ali dentro. ⏎ **Andar no mato alto chama luta.** No caminho de terra ninguém te para.” [marca `viu-mato`] _(se sem `viu-mato`)_
- 📦 “Um cesto esquecido entre as raízes. Dentro, duas poções ainda lacradas.” [2× Potion]
- ⚔ luta (bando, `venceu:pisoteadores`) — “Um bando acampou em cima dos canteiros da Vó. Mastigam sem pressa, e te olham sem medo.”

#### Clareira do Sineiro

_Ninguém vem aqui. Alguém, mesmo assim, varre as folhas._

- 🚪 porta → Bosque do Orvalho
- 🗣 Dama Véu
- 🪧 “Uma lápide sem nome. Alguém riscou nela, com unha paciente, o desenho de um sino.”
- 📦 “Um baú pequeno, sem tranca. Dentro, embrulhado em pano, um sino de bronze rachado de alto a baixo.” [ganha 🔔 Sino Rachado · “O que o poço lembra” → etapa 2]

#### Estrada Velha

_Já passou carroça por aqui. Hoje passa o que tem fome — e o que arma laço._

- 🚪 porta → Pedralume
- 🚪 porta → Ruínas da Fonte
- 🪧 “A boca de uma gruta no paredão. Lá dentro é escuro de um jeito que parece ter peso. Sem luz, não dá.” _(se sem 🏮 Lamparina do Sineiro)_
- 🗣 Lasca
- 🪧 “O que sobrou de uma carroça: dois barris, um eixo partido e marcas de roda que terminam aqui.”
- 👣 “Um laço de arame, armado no meio da trilha, quase da cor da terra. Seu pelo arrepia antes de você entender por quê. ⏎ Isto não é coisa de Pokémon.” [marca `viu-laco`] _(se sem `viu-laco`)_
- ⚔ luta (treinador, `venceu:nico`) — “Um menino humano salta do mato, com uma bola de pano e arame na mão. ⏎ — Achei! Esse é dos fortes! Não foge, não foge, eu só preciso de UM pra arena!” _(se sem `venceu:nico`)_
- 🗣 Nico
- 🗣 Lia, a patrulheira _(se `venceu:nico`)_
- ⚔ luta (bando, `venceu:rondadores`)
- 📦 “Um caixote tombado, com um martelo marcado a fogo na tampa. Pesa como promessa.” [ganha 📦 Caixote de Minério]
- 📦 “Uma bolsa de viajante, largada às pressas. Quem largou não voltou pra buscar.” [+₽150 · 1× Super Potion]

#### Ruínas da Fonte

_A água nascia aqui. O que nasce agora é outra coisa._

- 🚪 porta → Estrada Velha
- 👣 “A lamparina abre um círculo pequeno no escuro. Do fundo vem um som de respiração — grande, lenta, e mais de uma.” [marca `viu-eco`] _(se sem `viu-eco`)_
- 📦 “Ferramentas de aprendiz, largadas no chão: duas picaretas e um embornal. O embornal ainda serve.” [1× Revive, 1× Super Potion]
- ⚔ luta (alfa, `venceu:alfa`) — “Enrolado sobre o leito seco da nascente, o **Alfa** abre um olho. Ele não está só.” _(se sem `venceu:alfa`)_
- 📦 “No leito seco, o encaixe do Coração está rachado por raízes de um lado e lascado a picareta do outro. Os dois chegaram perto demais. O Alfa só fez ninho em cima do que sobrou solto — e quente. ⏎ Você pega o **Coração da Fonte**.” [ganha 💠 Coração da Fonte · marca `pegou-coracao` · “A Fonte Calada” → etapa 3] _(se sem `pegou-coracao`)_
- 🪧 “O leito vazio da nascente. Raiz de um lado, marca de picareta do outro.”

### Personagens

#### Cabo Lairon

Por onde a conversa começa (vale a primeira que bate):

- `cap1` → **aberto**
- `treino-fim` → **fechado**
- `venceu:treino` → **treinou**
- “A lição do Cabo” etapa 1 → **vai**
- _sempre_ → **porta**

- **aberto**: “O Ancião mandou abrir o Passo pra você. Cuidado lá em cima: tem uma fumaça estranha, e faz três noites que ninguém desce de lá.”
- **fechado**: “O Passo do Norte está fechado, por ordem do Ancião. Com a fonte seca, metade da aldeia quer ir embora e a outra metade não quer deixar. Meu serviço é ficar aqui no meio.”
- **treinou**: “Viu? Quebrou a guarda, ele travou. Mais duas coisas e eu te largo.” → treinou2
- **treinou2**: “**Perícia** é o que você sabe fazer além dos golpes. Não gasta PP, mas cansa: depois de usar, espera umas rodadas pra usar de novo.” → treinou3
- **treinou3**: “E não sobe a serra sozinho. Quem você enfrenta no mato às vezes topa vir junto se ganhar um **petisco**. Na luta, abre a 🎒 Mochila e oferece. Toma, dois de mel.” [2× Mel Silvestre · marca `treino-fim` · “A lição do Cabo” → concluída]
- **vai**: “Os brigões estão ali, perto do portão. Mira na guarda.”
- **porta**: “O Passo do Norte está fechado, por ordem do Ancião. Com a fonte seca, metade da aldeia quer ir embora e a outra metade não quer deixar. Meu serviço é ficar aqui no meio.”
  - ▸ _Me ensina a lutar?_ → aula
  - ▸ _Tudo bem._
- **aula**: “Ensino. Primeira coisa: lá fora ninguém anda sozinho. Vem sempre em bando, dois, três de uma vez.” → aula2
- **aula2**: “Embaixo da vida de cada um tem um escudo 🛡. É a **guarda** dele. Golpe super efetivo ou crítico quebra um pedaço. Status quebra meio.” → aula3
- **aula3**: “Quebrou a guarda inteira, ele entra em **Ruína**: perde a vez e apanha mais. Então escolhe o alvo pelo tipo, não pela vida que sobra.” → aula4
- **aula4**: “Tá vendo aqueles dois brigando perto do portão? Vai lá e testa. Depois volta aqui.” [“A lição do Cabo” → etapa 1]

#### Ancião Torkoal

Por onde a conversa começa (vale a primeira que bate):

- `fim-forja` → **depoisForja**
- `fim-bosque` → **depoisBosque**
- `fim-abismo` → **depoisAbismo**
- “A Fonte Calada” etapa 3 → **comCoracao**
- “A Fonte Calada” etapa 2 → **vaiLa**
- “A Fonte Calada” etapa 1 · `ouviu-bosque` e `ouviu-forja` → **doisLados**
- “A Fonte Calada” etapa 1 → **espera**
- _sempre_ → **inicio**

- **depoisForja**: “A água voltou, pelo cano de ferro. O bosque lá embaixo ficou com menos. Alguém tinha que decidir, {eu}, e foi você. Obrigado.” → norte
- **norte**: “Mais uma coisa. O Coração **puxa pro norte**, esteja onde estiver. Eu sinto isso desde moço. Mandei abrir o Passo do Norte pra você: vai ver o que tem lá.”
- **depoisBosque**: “A água voltou. Pouca, e só até onde as raízes deixam. A forja apagou dois fornos e a Brasa não fala mais comigo. Mas as crianças estão bebendo.” → norte
- **depoisAbismo**: “A fonte continua seca, e tem um Sableye rindo sozinho na estrada. Não sei o que você fez, {eu}, mas não era o que eu esperava.” → norte
- **comCoracao**: “Então era isso. O Coração da Fonte saiu do lugar.” → comCoracao2
- **comCoracao2**: “Não me dá, não: eu não sei o que fazer com ele. A Brasa sabe prender com ferro; a Mãe Meganium, com raiz. As duas resolvem, mas quem ficar com a pedra deixa a outra com menos água. Você decide.”
- **vaiLa**: “As ruínas ficam no fim da Estrada Velha, a leste. Descansa na pousada antes de ir.”
- **doisLados**: “E então? O que você achou?”
  - ▸ _Nenhum dos dois foi até a nascente._ → certo
  - ▸ _Os dois têm medo de alguma coisa lá em cima._ → certo
- **certo**: “Foi o que eu pensei. Onze dias de briga e ninguém subiu, porque tem alguma coisa nas ruínas. Eu ouço de noite. É bicho, e é grande.” → lamparina
- **lamparina**: “Leva esta lamparina: sem luz não dá pra entrar. As ruínas ficam no fim da Estrada Velha, a leste. É uma gruta no paredão. Se tiver companhia, leva. O que está lá não está sozinho.” [ganha 🏮 Lamparina do Sineiro · “A Fonte Calada” → etapa 2]
- **espera**: “Já ouviu as duas? A Brasa fica na forja, a nordeste da praça. A Mãe Meganium, no fundo do bosque, a oeste.”
- **inicio**: “Você não é daqui, né? Dá pra ver. Chegou numa hora ruim.” → inicio2
- **inicio2**: “A fonte da aldeia secou faz onze dias. De um dia pro outro: de tarde tinha água, de manhã não tinha mais. Fonte não seca assim.”
  - ▸ _O que aconteceu?_ → oque
  - ▸ _E por que me contar isso?_ → porque
  - ▸ _Não é problema meu._ → recusa
- **oque**: “Ninguém sabe. A ferreira diz que o Círculo do Bosque deixou as raízes entupirem a nascente. O Círculo diz que a Forja cavou fundo demais. Os dois brigam, e nenhum subiu lá pra olhar.” → pedido
- **pedido**: “Me faz um favor: ouve a Brasa, aqui na forja, e a Mãe Meganium, no fundo do bosque, a oeste. Depois volta e me conta o que cada uma disse.”
  - ▸ _Eu vou._ [“A Fonte Calada” → etapa 1] → aceitou
  - ▸ _Preciso pensar._
- **aceitou**: “Obrigado, {eu}. Só um conselho: não prometa nada a nenhuma das duas.”
- **porque**: “Porque aqui todo mundo já escolheu um lado. Você chegou hoje e ainda não tem lado. É de alguém assim que eu preciso.” → pedido
- **recusa**: “Tudo bem. Mas você também vai precisar de água, cedo ou tarde. Se mudar de ideia, eu estou aqui.”

#### Brasa, a ferreira

Por onde a conversa começa (vale a primeira que bate):

- `fim-forja` → **depoisForja**
- `fim-bosque` → **depoisBosque**
- `fim-abismo` → **depoisAbismo**
- `vendeu-minerio` → **traida**
- “A Fonte Calada” etapa 3 → **coracao**
- “A marca do martelo” etapa 1 · com 📦 Caixote de Minério → **trouxe**
- “A marca do martelo” etapa 1 → **cade**
- “A Fonte Calada” etapa 1 · sem `ouviu-forja` → **versao**
- “A marca do martelo” não recebida · `ouviu-forja` → **servico**
- “A Fonte Calada” não recebida → **ocupada**
- _sempre_ → **padrao**

- **depoisForja**: “O cano está firme e a água está correndo. Quando precisar de ferro, {eu}, é só vir.”
- **depoisBosque**: “Você deu o Coração pras árvores. A água só chega até onde elas deixam, e eu apaguei dois fornos. Não vou te tratar mal, mas não espera que eu fique contente.”
- **depoisAbismo**: “Eu não sei onde o Coração foi parar, e é melhor eu não saber. Se eu descobrir, vou atrás.”
- **traida**: “Um Sableye andou vendendo minério com a **minha** marca na estrada. Foi você que vendeu pra ele. Não tenho mais nada pra tratar com você.”
- **coracao**: “Isso é o Coração da Fonte? Ele estava **fora** do lugar? Então não foi só raiz… e nem só picareta.” → coracao2
- **coracao2**: “Me dá. Eu prendo em bronze e levo a água por cano até a praça. Nunca mais seca. O bosque vai receber menos, é verdade. Não tem como agradar todo mundo.”
  - ▸ _⚒ Entregar o Coração à Forja._ [entrega 💠 Coração da Fonte · marca `cap1`, `fim-forja` · “A Fonte Calada” → concluída · ⚒ +3 🌿 -3 · dom ⚒ Brasa da Forja · +₽800] → fimForja
  - ▸ _Ainda vou ouvir o Círculo._
- **fimForja**: “Você fez bem. O bosque vai reclamar, mas a aldeia vai ter água. Chega perto do forno: vou te ensinar uma coisa.”
- **trouxe**: “Você trouxe mesmo! E inteiro. Meus aprendizes não tiveram essa coragem.” → paga
- **paga**: “Toma. Fiz isto pra um cliente que nunca veio buscar. Vai ser mais útil com você.” [entrega 📦 Caixote de Minério · “A marca do martelo” → concluída · ⚒ +2 · 1× Faixa Muscular · +₽200]
- **cade**: “O caixote com a marca do martelo. Recanto de pedra, lado leste da Estrada Velha.”
- **versao**: “O velho te mandou, né? Então escuta. A Forja cava nesse morro há três gerações e a fonte nunca secou. Aí o Círculo parou de podar as raízes perto da nascente, e onze dias atrás a água sumiu. Pra mim está claro de quem é a culpa.”
  - ▸ _Vocês cavaram mais fundo este ano?_ → fundo
  - ▸ _Alguém da Forja subiu até a nascente?_ → subiu
- **fundo**: “Abrimos um veio novo este ano, sim, e é fundo. Mas fica longe da nascente: eu mesma medi, duas vezes. Não vai contar isso pro velho como se fosse confissão.” [marca `ouviu-forja`] → servico
- **servico**: “Já que você anda por aí: um caixote do meu minério ficou na Estrada Velha quando a carroça quebrou. Tem bicho rondando e ninguém meu quer voltar lá. Se você trouxer, eu pago bem.”
  - ▸ _Trago._ [“A marca do martelo” → etapa 1] → combinado
  - ▸ _Agora não._
- **combinado**: “Fica num recanto de pedra, do lado leste da estrada. É um caixote com um martelo marcado na tampa.”
- **subiu**: “Mandei dois aprendizes. Voltaram no mesmo dia, sem as ferramentas, e não quiseram contar o que viram. Achei que era medo bobo. Agora já não sei.” [marca `ouviu-forja`] → servico
- **ocupada**: “Se veio encomendar, vai demorar: sem água eu não consigo temperar o ferro. Se veio só olhar, fica longe da faísca.”
- **padrao**: “Sem água a forja não trabalha. Não tenho nada pra você agora.”

#### Dona Chansey

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **balcao**

- **balcao**: “Bem-vindo à Pousada do Sino. Aqui tem cama, comida e curativo pra você e pra quem estiver com você.”
  - ▸ _🛏 Descansar ({custo})._ [descansa (cura)]
  - ▸ _Só passando._

#### Kecleon, o mercador

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **banca**

- **banca**: “Bem-vindo! O Kecleon vende de tudo. Só água é que está em falta.”
  - ▸ _🛒 Ver as mercadorias._ [abre a loja]
  - ▸ _Depois._

#### Tio do Poço

Por onde a conversa começa (vale a primeira que bate):

- “O que o poço lembra” concluída → **lembrou**
- “O que o poço lembra” etapa 2 · com 🔔 Sino Rachado → **sino**
- “O que o poço lembra” etapa 1 → **arvore**
- 2ª conversa ou mais com Tio do Poço → **terceira**
- 1ª conversa ou mais com Tio do Poço → **segunda**
- _sempre_ → **primeira**

- **lembrou**: “…Onze anos. Eu contei certo.”
- **sino**: “…É ele. O sino. Rachou do lado que eu lembrava.” → sino2
- **sino2**: “Foi o Ancião que mandou tirar. Quando expulsaram a Corte do Abismo da aldeia, o sineiro era meu amigo e não quis tocar o alarme contra eles. Tiraram o sino e mandaram ele embora junto. Isso faz onze **anos**.” → sino3
- **sino3**: “Você me ouviu até o fim. Quase ninguém tem paciência. Vou te ensinar a olhar devagar: assim você enxerga o que está escondido.” [“O que o poço lembra” → concluída · marca `confianca-abismo`, `sino-devolvido` · 🌑 +2 · dom ✨ Faro de Quem Espera]
- **arvore**: “A árvore que não é árvore. No norte do bosque. …Eu acho.”
- **terceira**: “…Tinha um sino, também. O sino sumiu antes da água. Ninguém mais lembra dele. Eu lembro.” → terceira2
- **terceira2**: “Ele tocava quando vinha perigo pela estrada. Um dia parou de tocar. Procura a árvore que não é árvore, no norte do bosque. Eu ia lá, faz tempo.” [“O que o poço lembra” → etapa 1]
- **segunda**: “… …tinha água aqui.”
- **primeira**: “…”

#### Pichu

Por onde a conversa começa (vale a primeira que bate):

- 2ª conversa ou mais com Pichu → **tio**
- 1ª conversa ou mais com Pichu → **tres**
- _sempre_ → **oi**

- **tio**: “O Tio do Poço fala, sim. Mas você tem que esperar **muito**.”
- **tres**: “Você é aventureiro? Meu irmão disse que aventureiro de verdade fala com todo mundo **três** vezes. Na terceira os adultos contam o que estavam escondendo.”
- **oi**: “Oi! Você é novo aqui? Eu te mostro. Pra falar com alguém, é só andar até encostar nele. Igual você fez comigo.” → oi2
- **oi2**: “Lá em cima tem o nome do lugar. Toca nele e abre o mapa da região. O livrinho 📖 guarda o que você prometeu fazer.” → oi3
- **oi3**: “Se se machucar, a Dona Chansey cuida de você, na pousada do sudoeste. O Kecleon vende coisa, no sudeste. Tudo cobra.” → oi4
- **oi4**: “E quem manda aqui é o Ancião Torkoal, na casa do noroeste. Ele tá procurando alguém pra ver o que houve com a fonte.”

#### Vó Vileplume

Por onde a conversa começa (vale a primeira que bate):

- “Os canteiros da Vó” etapa 1 · `venceu:pisoteadores` → **obrigada**
- “Os canteiros da Vó” etapa 1 → **ainda**
- “Os canteiros da Vó” concluída · 🌿 Círculo do Bosque < 0 → **magoada**
- “Os canteiros da Vó” concluída → **cha**
- _sempre_ → **pedido**

- **obrigada**: “Foram embora! E você nem pisou nas minhas plantas. Toma, é pouco, mas é de coração.” [“Os canteiros da Vó” → concluída · 🌿 +2 · 3× Fruta Oran, 1× Full Heal · +₽120] → dica
- **dica**: “Vou te contar uma coisa. No norte do bosque tem uma árvore esquisita: passo por ela há sessenta anos e ela nunca deu sombra. Pra mim aquilo não é árvore.”
- **ainda**: “Eles ainda estão lá. Dá pra ouvir daqui.”
- **magoada**: “Eu soube pra onde foi o Coração. Minhas plantas morreram de sede. Hoje eu não quero conversa.”
- **cha**: “Senta um pouco. Eu ia te oferecer um chá, mas sem água não tem chá.”
- **pedido**: “Não pisa aí! …Ah, desculpa, filho, não era com você. É que tem um bando acampado nos meus canteiros, ali pro sul, perto do lago. Sem a fonte, os bichos descem todos pra cá atrás de comida.”
  - ▸ _Eu tiro eles de lá._ [“Os canteiros da Vó” → etapa 1] → vai
  - ▸ _Eu sou do verde também, Vó._ (se você é grass/bug/fairy · sem `mimo-vo`) [marca `mimo-vo` · 3× Fruta Oran] → parente
  - ▸ _Boa sorte com isso._
- **vai**: “Tira eles de lá sem machucar muito, que eles também estão com fome. Mas tira.”
- **parente**: “Eu vi logo que você é dos nossos! Toma, leva estas frutas. Agora, sobre o bando…”
  - ▸ _Eu tiro eles de lá._ [“Os canteiros da Vó” → etapa 1] → vai
  - ▸ _Outra hora, Vó._

#### Mãe Meganium

Por onde a conversa começa (vale a primeira que bate):

- `fim-bosque` → **depoisBosque**
- `fim-forja` → **depoisForja**
- `fim-abismo` → **depoisAbismo**
- “A Fonte Calada” etapa 3 → **coracao**
- “A Fonte Calada” etapa 1 · sem `ouviu-bosque` → **versao**
- _sempre_ → **padrao**

- **depoisBosque**: “Está ouvindo? A água voltou a correr.”
- **depoisForja**: “Agora a água passa por cima de nós, dentro de um cano, e não desce. Não tenho raiva de você. Mas as flores estão morrendo.”
- **depoisAbismo**: “O Coração não está na forja nem na terra. Eu sinto a falta dele. O que você fez?”
- **coracao**: “Então o Coração saiu do lugar. Coitado de quem mexeu nele: ninguém faz isso por maldade, faz por precisar.” → coracao2
- **coracao2**: “Deixa comigo. As raízes levam o Coração de volta pra debaixo da terra, e a água volta a descer como antes: pouca, limpa, passando primeiro pelo bosque. A forja vai ficar com menos, eu sei.”
  - ▸ _🌿 Entregar o Coração ao Círculo._ [entrega 💠 Coração da Fonte · marca `cap1`, `fim-bosque` · “A Fonte Calada” → concluída · 🌿 +3 ⚒ -3 · dom 🌿 Casca do Bosque · 3× Fruta Sitrus, 1× Restos] → fimBosque
  - ▸ _Ainda vou ouvir a Forja._
- **fimBosque**: “Obrigada. Estende a pata. Vai coçar um pouco: é casca, um presente do bosque.”
- **versao**: “Chega devagar. Estas são as últimas flores do vale que ainda abrem. O Ancião te mandou, não foi? Ele sempre manda alguém de fora.” → versao2
- **versao2**: “A Forja abriu um veio novo na primavera, bem fundo. A terra treme de noite, as raízes mais velhas racharam, e onze dias atrás a água parou. Pra mim, uma coisa causou a outra.”
  - ▸ _O Círculo parou de podar as raízes perto da nascente?_ → raizes
  - ▸ _Alguém do Círculo subiu até lá?_ → subiu
- **raizes**: “Paramos de podar, sim. E as raízes cresceram na direção da água, porque estavam com sede. Eu não achei que isso fosse fazer mal.” [marca `ouviu-bosque`]
- **subiu**: “A Vó Vileplume tentou. Voltou dizendo que tinha alguma coisa lá em cima, e não quis subir de novo. Eu não insisti.” [marca `ouviu-bosque`]
- **padrao**: “Anda com cuidado por aqui. As plantas estão fracas.”

#### Dama Véu

Por onde a conversa começa (vale a primeira que bate):

- com 🔔 Sino Rachado → **levou**
- “O que o poço lembra” concluída → **levou**
- _sempre_ → **guarda**

- **levou**: “Você levou o sino. Que bom. Alguém precisava se lembrar dele.”
- **guarda**: “Não se assusta. Pouca gente acha esta clareira. Eu cuido deste túmulo.”
  - ▸ _De quem é o túmulo?_ → quem
  - ▸ _O que tem no baú?_ → bau
  - ▸ _Vou deixar você em paz._
- **quem**: “É do último sineiro de Pedralume. Ele foi meu mestre. Não quis tocar o sino contra a própria gente, e a aldeia o expulsou. Ele morreu aqui, escondido atrás daquela árvore.”
- **bau**: “É o sino dele. Está rachado. Pode levar, se tiver a quem mostrar. Só saiba que tem gente em Pedralume que prefere esquecer essa história.”

#### Lasca

Por onde a conversa começa (vale a primeira que bate):

- `fim-abismo` → **depois**
- `cap1` → **tarde**
- “A Fonte Calada” etapa 3 · `confianca-abismo` → **coracao**
- “A Fonte Calada” etapa 3 · você é ghost/dark/poison → **coracao**
- com 📦 Caixote de Minério · sem `vendeu-minerio` → **minerio**
- `confianca-abismo` → **amigo**
- você é ghost/dark/poison → **amigo**
- _sempre_ → **estranho**

- **depois**: “Não fala comigo na frente dos outros. Mas a Corte não vai esquecer o que você fez.”
- **tarde**: “Soube que a fonte se resolveu. Pena. Eu tinha uma proposta boa.”
- **coracao**: “Guarda isso! Você está andando na estrada com o Coração da Fonte na mão?” → coracao2
- **coracao2**: “Vou fazer uma oferta só. A Forja quer o Coração num cano. O Círculo quer debaixo da terra. A Corte cuidava dele até onze anos atrás, antes de ser expulsa, e quer de volta. Pago ₽3.000 e ainda te ensino um truque. A aldeia fica sem água por mais um tempo.”
  - ▸ _🌑 Entregar o Coração à Corte._ [entrega 💠 Coração da Fonte · marca `cap1`, `fim-abismo` · “A Fonte Calada” → concluída · 🌑 +3 ⚒ -2 🌿 -2 · dom 🌑 Passo de Sombra · +₽3000] → fimAbismo
  - ▸ _Não._ → naoAinda
- **fimAbismo**: “Feito. Agora repara na sua sombra: ela vai te ajudar a passar sem ser visto. É presente.”
- **naoAinda**: “Pensa com calma. Eu não tenho pressa.”
- **minerio**: “Esse caixote tem a marca do martelo. A ferreira vai te dar um obrigado por ele. Eu dou ₽600 agora, sem pergunta. Ela vai acabar descobrindo, mas aí você já está longe.”
  - ▸ _Vender o minério (₽600)._ [entrega 📦 Caixote de Minério · +₽600 · marca `vendeu-minerio` · “A marca do martelo” → concluída · 🌑 +2 ⚒ -3] → vendido
  - ▸ _É da Brasa._ → honesto
- **vendido**: “Negócio fechado. Se ela perguntar, eu nunca te vi.”
- **honesto**: “Honesto. Que pena.”
- **amigo**: “Psiu. Você parece ser dos nossos. Eu sou da Corte do Abismo. A gente foi expulso, mas continua por aí. Se um dia você tiver uma coisa que os dois lados querem, lembra que existe um terceiro — e que ele paga.”
- **estranho**: “A carroça quebrada? Não é minha. Eu não vi nada. Pode ir andando.”

#### Nico

Por onde a conversa começa (vale a primeira que bate):

- 1ª conversa ou mais com Nico → **depois**
- _sempre_ → **perdeu**

- **depois**: “Eu vou voltar pro Vau e treinar. Um dia você ainda vai querer lutar do meu lado.”
- **perdeu**: “Tá bom, você ganhou. Não precisava bater tão forte. …Você entende o que eu falo? Meu pai diz que bicho não entende.”
  - ▸ _(Encarar o menino.)_ → encara
  - ▸ _(Empurrar a bola de arame de volta pra ele.)_ → bola
- **encara**: “…Entende mesmo. Desculpa por ter te chamado de “esse”. É que no Vau quem tem um Pokémon forte come todo dia. Eu não tenho nenhum.”
- **bola**: “Essa bola fui eu que fiz, com arame e pano. Não funciona direito. E a moça de capa verde desfaz todos os meus laços.”

#### Lia, a patrulheira

Por onde a conversa começa (vale a primeira que bate):

- `lia-confia` → **amiga**
- `lia-receio` → **longe**
- _sempre_ → **oi**

- **amiga**: “Toma cuidado no Passo. Os Fumeiros são caçadores de verdade, não crianças.”
- **longe**: “Eu fico do meu lado da trilha e você do seu. Sem problema.”
- **oi**: “Calma, eu não vou te machucar. Meu nome é Lia. Aquele laço na trilha era do Nico. Ele arma, eu desarmo.” → oi2
- **oi2**: “Eu sei que vocês não têm motivo pra confiar em gente. Eu sou do Vau: sei o que os caçadores fazem na serra e o que as arenas fazem lá. É por isso que eu fico por aqui, soltando quem cai em laço.”
  - ▸ _(Chegar mais perto.)_ [marca `lia-confia` · 2× Fruta Oran] → perto
  - ▸ _(Mostrar os dentes.)_ [marca `lia-receio`] → dentes
  - ▸ _(Ir embora.)_
- **perto**: “Obrigada por confiar em mim. Toma, são frutas, pode comer. E se vir um laço de arame, não puxa: dá a volta.”
- **dentes**: “Tudo bem, eu entendo. Vou continuar cortando os laços do mesmo jeito.”

## Capítulo 2 · O Passo dos Laços — Serra do Fumo

### Missões

- **O Passo dos Laços**
  1. Fale com a Mãe Ursa na toca dos refugiados: uma gruta entre as pedras, a oeste da trilha do Passo.
  2. Ouça o Cascalho e o Cogu, na toca, e vá ver o acampamento dos Fumeiros com os próprios olhos (a leste, seguindo a fumaça).
  3. Volte à Mãe Ursa com um plano. Dizem que existe um terceiro caminho, pela gruta do Alfa, no alto do Passo.
- **Quem chora pelas duas**
  1. Ache a chave no mato alto atrás das barracas do acampamento, abra as gaiolas e volte ao Teddiursa, na toca.
- **A flor rente ao chão** · falha `cap2` · sem `passo-peixe`
  1. Ache a erva azul na encosta do Passo, perto da trilha de cima, e leve à curandeira Selma, no acampamento.
- **Ferro bom demais** 🤫 _secreta_
  1. A ponta da lança que feriu o Alfa tem uma marca. Alguém vai reconhecê-la — e nem todo mundo vai gostar.

### Lugares

#### Passo do Norte

_Pinheiro, pedra e uma fumaça que não é de forja._

- 🚪 porta → Pedralume
- 🚪 porta → Gruta do Alfa
- 🚪 porta → Toca dos Refugiados
- 🚪 porta → Acampamento dos Fumeiros
- 🗣 Nara, a batedora
- 🗣 Lasca
- 👣 “Outro laço — mas este não é de criança. Arame trançado, estaca funda, um nó que só aperta. Quem armou isto sabe o que está fazendo, e já fez muitas vezes.” [marca `viu-laco2`] _(se sem `viu-laco2`)_
- 📦 “Uma moita de flores azuis, miúdas, rentes ao chão. O cheiro arde o focinho, do jeito bom.” [ganha 🌿 Erva Azul]

#### Toca dos Refugiados

_Quem fugiu do Passo dorme aqui, longe da entrada, porque claridade denuncia._

- 🚪 porta → Passo do Norte
- 🗣 Mãe Ursa
- 🗣 Sargento Cascalho
- 🗣 Cogu
- 🗣 Wooper
- 🗣 Teddiursa

#### Acampamento dos Fumeiros

_Barracas, gaiolas e um defumadouro que não apaga._

- 🚪 porta → Passo do Norte
- 🪧 “A estrada desce a serra, rio abaixo. Mas o Passo ainda não se resolveu — e quem sai agora deixa uma toca inteira pra trás.” _(se sem `cap2`)_
- 🚪 porta → Beira do Rio
- 🪧 “O defumadouro. Gordura pingando em brasa lenta. Você conhece alguns dos cheiros. Preferia não conhecer.”
- 🪧 “A despensa dos Fumeiros: tudo o que foi defumado no mês, numa casa só.”
- 🪧 “A fogueira do acampamento, reduzida a brasa. Alguém a mantém acesa a noite inteira.”
- ⚔ luta (treinador, `venceu:vigia`) — “O vigia da despensa levanta a lança e assobia. Dois cães de caça saem de trás da casa.” _(se sem `passo-fogo` nem `passo-fome`)_
- 🗣 Tomé Fumeiro _(se sem `passo-fogo` nem `passo-fome`)_
- 🗣 Dona Selma, a curandeira _(se sem `passo-fogo` nem `passo-fome`)_
- 🗣 Tico _(se sem `passo-fogo` nem `passo-fome`)_
- 🗣 Teddiursa presa _(se sem `solto1`)_
- 🗣 Hoothoot preso _(se sem `solto2`)_
- 🗣 Stantler velho
- 📦 “Um baú baixo, escondido no mato atrás das barracas. Dentro, uma chave de ferro, pesada, cheirando a fumaça.” [ganha 🗝 Chave das Gaiolas]

#### Gruta do Alfa

_Água desce pela pedra, em algum lugar acima. E alguma coisa aqui dentro não dorme._

- 🚪 porta → Passo do Norte
- 🗣 O Alfa do Passo _(se com 🫙 Unguento da Selma · sem `venceu:alfa2`)_
- ⚔ luta (alfa, `venceu:alfa2`) — “O **Alfa do Passo** se ergue num salto torto, com um cabo de lança balançando no flanco. Ele não enxerga você: enxerga mais um que veio terminar o serviço.” _(se sem `venceu:alfa2`)_
- 🗣 O Alfa do Passo _(se `alfa-calmo`)_
- 📦 “O Alfa recuou pro fundo da gruta, mancando. No chão ficou o que saiu do flanco dele na luta: uma ponta de lança, de ferro bom demais pra caçador faminto.” [ganha 🗡 Ponta de Lança · marca `pegou-lanca` · “Ferro bom demais” → etapa 1] _(se sem `pegou-lanca`)_

### Personagens

#### Nara, a batedora

Por onde a conversa começa (vale a primeira que bate):

- `cap2` → **fim**
- “O Passo dos Laços” não recebida → **pare**
- _sempre_ → **andamento**

- **fim**: “O Passo ainda cheira a fumaça, mas já dá pra dormir tranquilo.”
- **pare**: “Psst! Abaixa! …Ah, você veio de Pedralume. Está vendo a fumaça lá em cima? São caçadores, cozinhando.” → pare2
- **pare2**: “São os Fumeiros. Acamparam no meio do Passo: caçam de dia e defumam a carne de noite. A gente se escondeu numa toca a oeste da trilha, entre as pedras. A Mãe Ursa quer falar com quem souber lutar.”
  - ▸ _Me leva até ela._ [“O Passo dos Laços” → etapa 1] → vai
  - ▸ _Quantos vocês são?_ → quantos
- **vai**: “É a oeste, entre as pedras. E olha onde pisa: tem laço de arame na trilha.”
- **quantos**: “Menos do que antes. Prefiro não contar.”
  - ▸ _Me leva até ela._ [“O Passo dos Laços” → etapa 1] → vai
- **andamento**: “A toca fica a oeste, entre as pedras. O acampamento deles, a leste. O Alfa do Passo está na gruta do norte. Não vai lá sozinho.”

#### Lasca

Por onde a conversa começa (vale a primeira que bate):

- `cap2` → **depois**
- com 🗡 Ponta de Lança · sem `lanca-forja` nem `lanca-vendida` → **lanca**
- “O Passo dos Laços” etapa 2 · sem `lasca-plano` → **plano**
- “O Passo dos Laços” etapa 3 · sem `lasca-plano` → **plano**
- _sempre_ → **oi**

- **depois**: “O Passo se resolveu, e eu vou descer o rio. Tem uma cidade lá embaixo que vive de luta e aposta. Quer comprar alguma coisa antes?”
  - ▸ _🛒 Ver o que caiu das carroças._ [abre a loja]
  - ▸ _Nada, obrigado._
- **lanca**: “Deixa eu ver essa ponta. Marca do martelo! A Forja vendendo arma pra quem caça Pokémon. A Corte paga bem por um segredo desses.”
  - ▸ _Vender o segredo (₽700)._ [marca `lanca-vendida` · “Ferro bom demais” → concluída · +₽700 · 🌑 +2] → vendida
  - ▸ _Fica comigo._
- **vendida**: “A Corte agradece. Um dia a Forja vai ter que explicar isso.”
- **plano**: “O Cascalho quer fogo e o Cogu quer fugir. Eu tenho um plano melhor: eles guardam toda a carne numa despensa só, e eu sei a hora em que o vigia dorme. A gente esvazia tudo numa noite, e eles vão embora por falta de comida. Ninguém morre.”
  - ▸ _E as crianças do acampamento?_ → criancas
  - ▸ _E o que você ganha?_ → ganha
- **criancas**: “Vão passar fome por uns dias. Ninguém morre de fome em dois dias. Eu disse que ninguém morre, não que ninguém sofre.” [marca `lasca-plano`]
- **ganha**: “Carne defumada vende bem no Vau. Metade do dinheiro é sua.” [marca `lasca-plano`]
- **oi**: “Olha quem subiu a serra. Eu? Estou de passagem. Aproveita: tenho umas coisas pra vender.”
  - ▸ _🛒 Ver o que caiu das carroças._ [abre a loja]
  - ▸ _Nada, obrigado._

#### Mãe Ursa

Por onde a conversa começa (vale a primeira que bate):

- `passo-fogo` → **fogo**
- `passo-fome` → **fome**
- `passo-peixe` → **peixe**
- “O Passo dos Laços” etapa 3 → **decide**
- “O Passo dos Laços” etapa 2 → **espera**
- “O Passo dos Laços” etapa 1 → **conta**
- _sempre_ → **quem**

- **fogo**: “O defumadouro queimou e eles desceram a serra antes de amanhecer. O chefe olhou pra trás antes de ir, e eu acho que ele volta. Ganhamos um inverno de sossego.”
- **fome**: “A despensa amanheceu vazia e eles foram embora em dois dias. As crianças saíram no colo, com fome. O Sableye deixou a minha parte do dinheiro. Eu não quis. Fica pra você.”
- **peixe**: “Eu vi de longe: você, o Alfa e o chefe deles olhando os peixes subirem a pedra. Ele baixou a lança e tirou o chapéu. Acho que temos uma trégua.”
- **decide**: “Você viu o acampamento: as gaiolas, e as crianças deles também. Qual é o plano?”
  - ▸ _⚒ Queimar o defumadouro, com o Cascalho._ [marca `cap2`, `passo-fogo`, `tome-jurou` · “O Passo dos Laços” → concluída · ⚒ +3 🌿 -1 · dom 🔥 Faísca do Passo] → fogo
  - ▸ _🌑 Esvaziar a despensa deles, com o Lasca._ (se `lasca-plano`) [marca `cap2`, `passo-fome` · “O Passo dos Laços” → concluída · 🌑 +3 🌿 -2 · +₽900 · dom 🪙 Unha Leve] → fome
  - ▸ _🐟 Mostrar a subida dos peixes ao chefe deles._ (se `alfa-calmo` e `tome-ouviu`) [marca `cap2`, `passo-peixe`, `tome-deve`, `lia-confia` · “O Passo dos Laços” → concluída · 🌿 +2 ⚒ -1 · dom 🐟 Correnteza] → peixe
  - ▸ _Ainda não sei._
- **espera**: “Fala com o Cascalho e com o Cogu, aqui dentro. Depois vai ver o acampamento, a leste. Quero que você veja com os próprios olhos antes de opinar.”
- **conta**: “Você é quem resolveu a fonte de Pedralume? Aqui o problema é outro: caçadores armados. Tenho três planos na mesa e preciso de ajuda pra escolher.” → conta2
- **conta2**: “O Cascalho, da Forja, quer queimar o defumadouro deles. O Cogu, do Círculo, quer fugir com todo mundo por cima da serra, no frio, com os filhotes. E tem um Sableye lá fora com outra ideia, que ele não quis contar na minha frente.” [“O Passo dos Laços” → etapa 2]
- **quem**: “Quem é você? …Tanto faz. Fica longe da entrada, pra ninguém de fora te ver.”

#### Sargento Cascalho

Por onde a conversa começa (vale a primeira que bate):

- `lanca-forja` → **calado**
- com 🗡 Ponta de Lança · sem `lanca-vendida` → **lanca**
- `cap2` → **depois**
- “O Passo dos Laços” etapa 2 · sem `ouviu-cascalho` → **plano**
- _sempre_ → **padrao**

- **calado**: “Vou levar isso pra Ferro-Fundo pessoalmente. Não conta pra Mãe Ursa ainda.”
- **lanca**: “Onde você achou isso? Me mostra. …Essa ponta tem a marca do martelo. É ferro **nosso**, da Forja.” → lanca2
- **lanca2**: “Eu não sei quem vendeu, juro. Mas alguém da Ordem vendeu arma pros caçadores, e foi uma delas que feriu o Alfa.” [marca `lanca-forja` · “Ferro bom demais” → concluída · ⚒ -1]
- **depois**: “Está feito. Não adianta ficar pensando.”
- **plano**: “Meu plano é simples: o defumadouro é de madeira seca e gordura. É só pôr fogo, e eles perdem a carne do mês. Sem comida, vão embora.”
  - ▸ _E se voltarem com mais gente?_ → mais
  - ▸ _Entendi._ [marca `ouviu-cascalho`]
- **mais**: “Se voltarem, a gente queima de novo.” [marca `ouviu-cascalho`]
- **padrao**: “Eu sou da Forja. A gente resolve as coisas na força.”

#### Cogu

Por onde a conversa começa (vale a primeira que bate):

- `cap2` → **depois**
- “O Passo dos Laços” etapa 2 · sem `ouviu-cogu` → **plano**
- _sempre_ → **padrao**

- **depois**: “Eu ainda lembro do caminho por cima da serra. Pode ser útil um dia.”
- **plano**: “Eu conheço um caminho por cima da serra. São três dias, sem trilha. A gente foge e deixa o Passo pra eles. Ninguém precisa lutar.”
  - ▸ _Com filhote, no frio?_ → frio
  - ▸ _E quem não aguenta a subida?_ → frio
- **frio**: “Alguns não vão aguentar a subida, eu sei. Mas a maioria chega. No plano do Cascalho pode não sobrar ninguém.” → frio2
- **frio2**: “Tem outra saída, se você tiver coragem. Lá em cima, na garganta do norte, os peixes sobem a pedra na cheia. Tem peixe pra todo mundo, até pros humanos. Só que o Alfa do Passo está ferido e não deixa ninguém chegar perto.” [marca `ouviu-cogu`]
- **padrao**: “Fala baixo, por favor.”

#### Wooper

Por onde a conversa começa (vale a primeira que bate):

- 1ª conversa ou mais com Wooper → **fruta**
- _sempre_ → **medo**

- **fruta**: “A moça de capa verde me deu uma fruta uma vez. Não conta pra Mãe Ursa.”
- **medo**: “Eu não estou com medo. Só estou quietinho.”

#### Teddiursa

Por onde a conversa começa (vale a primeira que bate):

- “Quem chora pelas duas” concluída → **obrigado**
- “Quem chora pelas duas” etapa 1 · `solto1` e `solto2` → **voltou**
- “Quem chora pelas duas” etapa 1 → **espera**
- _sempre_ → **pede**

- **obrigado**: “Minha irmã disse que você nem fez barulho. Quero ser igual a você quando eu crescer.”
- **voltou**: “ELA VOLTOU! E a coruja também! Toma, é tudo o que eu juntei.” [“Quem chora pelas duas” → concluída · 🌿 +1 · 4× Fruta Oran, 1× Revive]
- **espera**: “A chave fica no mato alto, atrás das barracas. E tem mais gente presa além da minha irmã.”
- **pede**: “Minha irmã ficou presa numa gaiola, no acampamento. Você é grande. Você consegue abrir a gaiola?”
  - ▸ _Eu abro._ [“Quem chora pelas duas” → etapa 1] → como
  - ▸ _Não prometo._
- **como**: “O vigia guarda a chave num baú, no mato alto atrás das barracas. Eu vi quando estava escondido.”

#### Tomé Fumeiro

Por onde a conversa começa (vale a primeira que bate):

- `passo-peixe` → **tregua**
- `alfa-calmo` · sem `tome-ouviu` → **peixes**
- `tome-falou` → **denovo**
- _sempre_ → **primeiro**

- **tregua**: “A gente pesca de manhã e o bicho grande pesca de tarde. As gaiolas viraram viveiro de peixe. Eu te devo essa. Se precisar de mim, é só chamar.”
- **peixes**: “O bicho grande lá de cima parou de urrar. Fazia três noites que ninguém dormia. Foi você?” → peixes2
- **peixes2**: “(Você risca na terra: a garganta do norte. Água. Peixe subindo a pedra.) ⏎ Peixe? Lá em cima, na cheia?” → peixes3
- **peixes3**: “Se for verdade, eu não preciso mais de gaiola. Me mostra. Eu quero ver.” [marca `tome-ouviu`]
- **denovo**: “Ainda aqui? Se veio pedir pra eu soltar os das gaiolas, me diz primeiro o que a gente vai comer.”
- **primeiro**: “Um bicho entrando no acampamento sem medo. Baixa a lança, Zé. Deixa ele chegar.” → primeiro2
- **primeiro2**: “Você me olha como se eu fosse um monstro. Meu nome é Tomé. Eu tinha quarenta cabeças de gado no litoral, e uma praga matou todas em um mês. Tenho trinta pessoas pra alimentar aqui.”
  - ▸ _(Olhar para as gaiolas.)_ → gaiolas
  - ▸ _(Olhar para as crianças.)_ → criancas
- **gaiolas**: “Eu sei o que tem nas gaiolas, e sei que é errado. Durmo mal por causa disso. Mas as crianças estão comendo, e eu faria tudo de novo.” [marca `tome-falou` · “O Passo dos Laços” → etapa 3]
- **criancas**: “Três são minhas. As outras perderam os pais na praga. Elas não têm culpa do que eu caço.” [marca `tome-falou` · “O Passo dos Laços” → etapa 3]

#### Dona Selma, a curandeira

Por onde a conversa começa (vale a primeira que bate):

- “A flor rente ao chão” concluída → **depois**
- “A flor rente ao chão” etapa 1 · com 🌿 Erva Azul → **trouxe**
- “A flor rente ao chão” etapa 1 → **cade**
- _sempre_ → **oi**

- **depois**: “Você voltou inteiro, e pelo jeito o bicho também. Senta, deixa eu ver essas patas.”
  - ▸ _(Pedir um curativo — {custo}.)_ [descansa (cura)]
  - ▸ _Estou bem._
- **trouxe**: “É essa mesma. Um instante… pronto. Leva o unguento. Chega devagar, de lado, e deixa ele cheirar primeiro.” [entrega 🌿 Erva Azul · ganha 🫙 Unguento da Selma · “A flor rente ao chão” → concluída]
- **cade**: “A flor azul fica na encosta do Passo, perto da trilha de cima.”
- **oi**: “Não tenha medo. Eu sou curandeira e trato de quem aparecer, gente ou bicho.” → oi2
- **oi2**: “O bicho grande da gruta do norte levou uma lançada, e a ferida vai infeccionar. Na encosta do Passo, perto da trilha de cima, cresce uma erva azul. Se você me trouxer, eu faço um unguento pra ele.”
  - ▸ _Eu trago._ [“A flor rente ao chão” → etapa 1] → vai
  - ▸ _(Pedir um curativo — {custo}.)_ [descansa (cura)]
  - ▸ _Agora não._
- **vai**: “É uma flor azul, pequena, rente ao chão. E só chega perto do bicho com o unguento pronto: animal ferido ataca.”

#### Tico

Por onde a conversa começa (vale a primeira que bate):

- 1ª conversa ou mais com Tico → **tio**
- _sempre_ → **oi**

- **tio**: “Meu tio Tomé não é mau. Ele só está com fome há muito tempo.”
- **oi**: “Você é de comer ou de brincar? …É brincadeira! A vó Selma disse pra eu não falar isso.”

#### Teddiursa presa

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **presa**

- **presa**: “Você não é deles. Fala baixo. O vigia dorme depois do almoço.”
  - ▸ _Abrir a gaiola._ (se com 🗝 Chave das Gaiolas) [marca `solto1`] → livre
  - ▸ _Eu volto._
- **livre**: “Meu irmão está na toca? Eu vou pra lá. Obrigada!”

#### Hoothoot preso

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **preso**

- **preso**: “Se você abrir essa porta, eu nunca mais reclamo de nada.”
  - ▸ _Abrir a gaiola._ (se com 🗝 Chave das Gaiolas) [marca `solto2`] → livre
  - ▸ _Eu volto._
- **livre**: “Estou livre! Obrigado!”

#### Stantler velho

Por onde a conversa começa (vale a primeira que bate):

- `ouviu-velho` → **fica**
- _sempre_ → **velho**

- **fica**: “Deixa a porta como está. E não precisa ter pena: eu escolhi.”
- **velho**: “Pode guardar a chave, filho. Eu estou velho, minha perna não presta, e aqui a curandeira cuida de mim. Lá fora eu não duro uma semana.” → velho2
- **velho2**: “Eu sei que isto é uma gaiola. Mas eu escolhi ficar. Deixa a porta fechada.” [marca `ouviu-velho`]

#### O Alfa do Passo

Por onde a conversa começa (vale a primeira que bate):

- `alfa-calmo` → **calmo**
- _sempre_ → **ferido**

- **calmo**: “(O Alfa dorme de lado. Quando você passa, ele abre um olho, te reconhece e volta a dormir.)”
- **ferido**: “(O Alfa rosna baixo, deitado. A lança ainda está no flanco dele. Você trouxe o unguento da curandeira.)”
  - ▸ _(Chegar devagar, de lado.)_ → devagar
  - ▸ _(Recuar.)_
- **devagar**: “(Ele deixa você chegar. Você puxa a lança de uma vez e passa o unguento na ferida. O Alfa urra, depois se acalma e encosta a cabeça em você. Então olha pra garganta do norte, onde a água desce.)” [marca `alfa-calmo`, `venceu:alfa2`, `pegou-lanca` · ganha 🗡 Ponta de Lança · entrega 🫙 Unguento da Selma · “Ferro bom demais” → etapa 1 · 🌿 +1]

## Capítulo 3 · A Cidade das Arenas — Vau das Moedas

### Missões

- **A Cidade das Arenas**
  1. Fale com o Mestre Baltazar, na praça do Vau das Moedas.
  2. Vença os dois desafiantes dentro da arena e fale com o guarda da escada.
  3. Desça ao porão da arena.
  4. O segundo Coração está com você. O Mestre o quer de volta no alicerce; a Lia, na beira do rio, sabe onde enterrá-lo; e há quem pague por ele.
- **O que a Lã quer**
  1. Pergunte à Lã, a Flaaffy ao lado da Bia, o que ela quer — e leve a resposta à Bia.
- **Quem vende o ferro** 🤫 _secreta_
  1. A grade do porão tem a marca do martelo. Quem compra sabe de quem compra.

### Lugares

#### Beira do Rio

_O rio que desce do Passo passa aqui, largo e sem pressa, a caminho da cidade._

- 🚪 porta → Acampamento dos Fumeiros
- 🚪 porta → Vau das Moedas
- 🗣 Lia, a patrulheira
- 📦 “Uma rede de pesca enrolada num cesto, e embaixo dela o que algum viajante achou que ninguém ia procurar.” [+₽220 · 2× Fruta Sitrus]

#### Vau das Moedas

_A primeira cidade dos humanos. Tudo aqui passa pela porta da arena._

- 🚪 porta → Beira do Rio
- 🪧 “O portão do sul, que dá pro charco. Trancado: enquanto a arena não se resolver, o Mestre não deixa ninguém descer o rio.” _(se sem `cap3`)_
- 🚪 porta → Brejal das Tábuas
- 🚪 porta → Arena do Vau
- 🪧 “ARENA DO VAU. Lutas toda feira. Bicho forte come de graça; dono de bicho forte, também.”
- 🪧 “O poço da praça. Aqui tem água — limpa, funda, e com um gosto que você já sentiu em Pedralume.”
- 🗣 Bia
- 🗣 Lã
- 🗣 Kiko, o porteiro
- 🗣 Mestre Baltazar
- 🗣 Lasca
- 🗣 Nico
- 🪧 “Barris de peixe salgado, com o carimbo de três rios diferentes. Gente de longe vem ver a arena.”

#### Arena do Vau

_Areia batida, cheiro de suor e de moeda. Quem luta bem aqui dentro nunca mais passa fome._

- 🚪 porta → Vau das Moedas
- 🚪 porta → Porão da Arena
- 🗣 Guarda da escada _(se sem `porao-aberto`)_
- 🗣 O Campeão
- ⚔ luta (treinador, `venceu:desafiante1`) — “— Um bicho sem dono no picadeiro! — o menino ri, nervoso, e solta os dele. — Vale moeda dobrada!”
- ⚔ luta (treinador, `venceu:desafiante2`) — “A menina amarra o cabelo, sem pressa. ⏎ — Eu não luto por moeda. Eu luto porque sou boa. Vem.”

#### Porão da Arena

_Debaixo da festa. Ferro novo, pedra velha, e uma coisa morna no fundo._

- 🚪 porta → Arena do Vau
- 📦 “A grade da cela. Ferro bom demais pra uma cidade de lama: sem ferrugem, sem emenda. No canto de baixo, pequeno, um **martelo** marcado a fogo.” [“Quem vende o ferro” → etapa 1]
- ⚔ luta (alfa, `venceu:fera`) — “Atrás da grade, a **Fera** não ruge: espera. Anos de festa ensinaram que tudo o que desce esta escada desce pra bater. Quando você encosta na tranca, ela vem.” _(se sem `venceu:fera`)_
- 🗣 A Fera _(se sem `fera-decidida`)_
- 📦 “O alicerce da arena. Entre as pedras da fundação, uma é morna e pulsa devagar, como a de Pedralume. É por isso que as lutas daqui são “boas”: tudo o que vive perto disto fica mais forte — e quer provar. ⏎ Você pega o **segundo Coração**. Ele também puxa. Na mesma direção.” [ganha 💠 Segundo Coração · marca `pegou-coracao2` · “A Cidade das Arenas” → etapa 4] _(se sem `pegou-coracao2`)_
- 🪧 “O vão no alicerce, onde a pedra morna ficava.”

### Personagens

#### Lia, a patrulheira

Por onde a conversa começa (vale a primeira que bate):

- `vau-tirou` → **tirou**
- “A Cidade das Arenas” etapa 4 · `lia-confia` → **coracao**
- `lia-confia` → **amiga**
- _sempre_ → **longe**

- **tirou**: “Está enterrado. A arena fechou: disseram que os Pokémon perderam a vontade de lutar. Passei na frente da casa do Mestre e ele só ficou me olhando.”
- **coracao**: “Isso que você está carregando… a arena foi construída em cima disso, não foi? Eu sempre achei as lutas de lá fortes demais.” → coracao2
- **coracao2**: “Se você quiser tirar isso da cidade, eu sei um lugar: onde o rio entra na pedra, a meio dia daqui. Enterrado lá, ninguém acha. O Vau vai sofrer, porque vive da arena. Mesmo assim eu te ajudo, se você pedir.”
  - ▸ _💧 Tirar o Coração do Vau, com a Lia._ [entrega 💠 Segundo Coração · marca `cap3`, `vau-tirou` · “A Cidade das Arenas” → concluída · 🌿 +2 🌑 -1 · dom 💧 Eco da Fonte] → tirou
  - ▸ _Ainda vou pensar._
- **amiga**: “Você chegou ao Vau. Antes de entrar, um aviso: lá ninguém vai te caçar. Vão te **admirar**. Quem luta bem na arena ganha comida, cama e fama. Tem Pokémon lá que não quer ir embora.” → amiga2
- **amiga2**: “Eu cresci nessa cidade e tive um parceiro de arena. Ele viveu bem e morreu velho. Até hoje eu não sei se aquilo era certo.”
- **longe**: “Você de novo. Eu fico deste lado do rio e você do outro, como combinamos.”

#### Bia

Por onde a conversa começa (vale a primeira que bate):

- “O que a Lã quer” concluída · `bia-juntos` → **juntas**
- “O que a Lã quer” concluída → **sozinha**
- “O que a Lã quer” etapa 1 · `ouviu-la` → **decide**
- “O que a Lã quer” etapa 1 → **espera**
- _sempre_ → **oi**

- **juntas**: “A gente combinou: ela luta, e eu paro a luta quando achar que passou do ponto. Ela reclamou, mas aceitou.”
- **sozinha**: “Ela foi lutar com o Nico e ganha quase sempre. Eu assisto do fundo. Dói, mas foi o que ela quis.”
- **decide**: “E aí, o que ela disse? …Ela **quer** lutar. Ela gosta. E eu achando que estava salvando ela.”
  - ▸ _Lutem juntas — do jeito de vocês, com a regra de vocês._ [marca `bia-juntos` · “O que a Lã quer” → concluída · ⚒ +1 · 2× Fruta Sitrus] → juntas
  - ▸ _Deixa ela ir lutar com outra pessoa._ [“O que a Lã quer” → concluída · 🌑 +1] → sozinha
  - ▸ _Eu não decido isso por vocês._
- **espera**: “Pergunta pra ela, por favor. Eu quero saber, seja o que for.”
- **oi**: “Você não é daqui, né? Eu sou a Bia, e esta é a Lã, minha parceira. A gente lutava na arena toda semana.” → oi2
- **oi2**: “Eu parei. Na última luta ela ganhou, o outro saiu carregado, e ela ficou contente. Eu não consegui ficar. Agora ela não fala comigo. Você entende o que ela diz, não entende? Pergunta o que ela quer.”
  - ▸ _Eu pergunto._ [“O que a Lã quer” → etapa 1] → obrigada
  - ▸ _Isso é entre vocês duas._
- **obrigada**: “Ela está aí do lado, fingindo que não ouve.”

#### Lã

Por onde a conversa começa (vale a primeira que bate):

- “O que a Lã quer” concluída → **fim**
- “O que a Lã quer” etapa 1 → **fala**
- _sempre_ → **muda**

- **fim**: “(A Flaaffy solta umas faíscas, satisfeita.)”
- **fala**: “Ela te mandou perguntar, né? Então diz pra ela: eu **gosto** de lutar. Do barulho, da areia, de ganhar. Ninguém me prendeu: eu fui morar com ela porque quis. E agora ela me trata como se eu estivesse doente.” → fala2
- **fala2**: “Eu não preciso ser salva. Só quero que ela torça por mim de novo.” [marca `ouviu-la`]
- **muda**: “(A Flaaffy olha pra você, depois pra menina, e vira o rosto.)”

#### Kiko, o porteiro

Por onde a conversa começa (vale a primeira que bate):

- `cap3` → **saida**
- “A Cidade das Arenas” não recebida → **oi**
- _sempre_ → **denovo**

- **saida**: “Vai seguir o rio? Abri o portão do sul pra você. Lá embaixo é o charco. Se quiser descansar ou comprar alguma coisa antes, é só falar.”
  - ▸ _🛏 Descansar na casinha do portão ({custo})._ [descansa (cura)]
  - ▸ _🛒 Ver a despensa do portão._ [abre a loja]
  - ▸ _Vou indo._
- **oi**: “Alto! …Ah, é um Pokémon. Pode passar, Pokémon não paga pedágio. Eu sou o Kiko e guardo o portão. Quem manda aqui é o Mestre Baltazar.” [“A Cidade das Arenas” → etapa 1]
- **denovo**: “O Mestre Baltazar fica na praça, perto do poço. A arena é a casa de pedra lá em cima. Se quiser descansar, tem a casinha do portão. E eu também vendo umas coisas.”
  - ▸ _🛏 Descansar na casinha do portão ({custo})._ [descansa (cura)]
  - ▸ _🛒 Ver a despensa do portão._ [abre a loja]
  - ▸ _Só passando._

#### Mestre Baltazar

Por onde a conversa começa (vale a primeira que bate):

- `vau-deixou` → **deixou**
- `vau-tirou` → **dTirou**
- `vau-ordem` → **dOrdem**
- “A Cidade das Arenas” etapa 4 → **coracao**
- “Quem vende o ferro” etapa 1 → **ferro**
- “A Cidade das Arenas” etapa 3 → **desce**
- “A Cidade das Arenas” etapa 2 → **desafio**
- _sempre_ → **oi**

- **deixou**: “A pedra voltou pro lugar. Hoje tem luta, e você tem lugar na primeira fila sempre que quiser. Obrigado.”
- **dTirou**: “A arena fechou. Metade da cidade foi embora no primeiro mês. Eu fico: alguém tem que cuidar do que sobrou.”
- **dOrdem**: “Apareceram uns Sableye dizendo que a arena agora tem sócio. As lutas continuam. Só o dinheiro é que mudou de dono.”
- **coracao**: “Então era isso que tinha debaixo da arena. Vinte anos achando que o segredo era a areia, ou o meu jeito de escolher lutador. Era uma pedra.” → coracao2
- **coracao2**: “Devolve, por favor. Sem isso a arena fecha, e duzentas pessoas voltam pra miséria. Os Pokémon que lutam aqui são bem tratados. Pensa no que acontece com a cidade.”
  - ▸ _🏟 Devolver o Coração ao alicerce._ [entrega 💠 Segundo Coração · marca `cap3`, `vau-deixou` · “A Cidade das Arenas” → concluída · ⚒ +1 🌿 -2 · +₽1200 · dom 🏟 Torcida] → deixou
  - ▸ _Ainda não decidi._
- **ferro**: “A grade do porão? É ferro de primeira. Eu compro de uns Pokémon que vêm de noite e não dizem o nome. Tudo o que eles vendem tem um martelo marcado. Achei que você soubesse: são dos seus.” [“Quem vende o ferro” → concluída · marca `forja-vende` · ⚒ -1]
- **desce**: “Você venceu os dois, e sem dono! Pode descer ao porão. Só não chega muito perto da grade da Fera.”
- **desafio**: “São dois desafiantes, dentro da arena, um de cada lado. Vença os dois e o guarda te deixa descer.”
- **oi**: “Um Pokémon solto, andando sozinho pela cidade. Isso é raro. Eu sou o Baltazar. Eu cuido da arena, e a arena sustenta o Vau.” → oi2
- **oi2**: “Antes de me julgar: vinte anos atrás isto aqui era lama e doença. Aí descobriram que nesta praça os Pokémon lutam melhor do que em qualquer lugar. Hoje vem gente de três rios pra assistir, e a cidade inteira vive disso.”
  - ▸ _(Olhar para a arena.)_ [“A Cidade das Arenas” → etapa 2] → regra
  - ▸ _(Virar as costas.)_
- **regra**: “Quer conhecer a arena? Pode entrar. E se quiser descer ao porão, onde fica a Fera, a regra é a mesma pra todos: vencer os dois desafiantes da tarde.”

#### Lasca

Por onde a conversa começa (vale a primeira que bate):

- `vau-ordem` → **socio**
- `cap3` → **tarde**
- “A Cidade das Arenas” etapa 4 → **coracao**
- _sempre_ → **apostas**

- **socio**: “Agora somos sócios da arena. Ela nunca deu tanto lucro.”
- **tarde**: “Você já decidiu. Perdi o negócio.”
- **coracao**: “Você desceu e voltou com ele! Eu sabia que valia a pena te seguir.” → coracao2
- **coracao2**: “Proposta da Corte: a pedra volta pro lugar e a arena continua, mas quem passa a cuidar do alicerce somos nós. A cidade segue vivendo, e a Corte volta a guardar um Coração. Eu também ganho a minha parte, claro.”
  - ▸ _🌑 Entregar o alicerce à Corte._ [entrega 💠 Segundo Coração · marca `cap3`, `vau-ordem` · “A Cidade das Arenas” → concluída · 🌑 +3 ⚒ -1 🌿 -1 · +₽2000 · dom 🎲 Olho da Banca] → socio
  - ▸ _Não._
- **apostas**: “Vai apostar? …Ah, é você. Vou te contar uma coisa: esta arena foi construída em cima de uma Fonte. Os humanos não sabem o que têm no porão. A Corte sabe, mas nunca conseguiu descer.”

#### Nico

Por onde a conversa começa (vale a primeira que bate):

- `bia-juntos` → **inveja**
- 1ª conversa ou mais com Nico → **pao**
- _sempre_ → **oi**

- **inveja**: “A Bia e a Lã voltaram a lutar, com uma regra: a Bia para a luta quando quiser. Achei bobagem, mas a Lã está ganhando mais do que antes.”
- **pao**: “Guardei pão ontem, e hoje também. Não é pressão. É só pra você saber.”
- **oi**: “VOCÊ! O da estrada! Olha, estou sem laço, de mão vazia. Luta comigo na arena, do **meu** lado? Eu divido a comida com você, meio a meio.”
  - ▸ _(Balançar a cabeça: não.)_ → nao
  - ▸ _(Ficar olhando.)_ → olha
- **nao**: “Tudo bem. Eu armei um laço pra você, né. Eu também não ia querer.”
- **olha**: “Você não disse não! Vou guardar pão todo dia, pro caso de você mudar de ideia.”

#### Guarda da escada

Por onde a conversa começa (vale a primeira que bate):

- `venceu:desafiante1` e `venceu:desafiante2` → **passa**
- _sempre_ → **barra**

- **passa**: “Você venceu os dois. Pode descer. Não encosta na grade.” [marca `porao-aberto` · “A Cidade das Arenas” → etapa 3]
- **barra**: “Só desce ao porão quem venceu os dois desafiantes da tarde. É a regra do Mestre.”

#### O Campeão

Por onde a conversa começa (vale a primeira que bate):

- `campeao-ouviu` → **denovo**
- _sempre_ → **oi**

- **denovo**: “Eu luto nos dias de feira. No resto do tempo, descanso.”
- **oi**: “Um Pokémon solto, sem coleira. Já sei o que você vai dizer: que eu estou preso. Todo mundo que vem do mato diz isso.” → oi2
- **oi2**: “Ninguém me prende. Eu como três vezes por dia, durmo bem, e duzentas pessoas gritam meu nome. No mato eu passava fome. De que liberdade eu estou sentindo falta?”
  - ▸ _(Não responder. Ele tem direito à pergunta.)_ [marca `campeao-ouviu`, `campeao-respeito`] → respeito
  - ▸ _(Olhar para a escada do porão.)_ [marca `campeao-ouviu`] → porao
- **respeito**: “Você não tentou me convencer. É o primeiro. Se um dia precisar de ajuda numa luta, me procura.”
- **porao**: “A Fera. Ela não escolheu estar aqui, eu sei. Eu não sei o que fazer por ela, então tento não pensar nisso.”

#### A Fera

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **cansada**

- **cansada**: “(A Fera recuou pro fundo da cela, cansada. A tranca quebrou na luta e a porta está aberta. Ela olha pra escada, depois pra você, e não sai do lugar. Parece não acreditar que pode ir.)”
  - ▸ _(Sair da frente da porta.)_ [marca `fera-decidida`, `fera-livre` · 🌿 +2] → livre
  - ▸ _(Fechar a grade de novo.)_ [marca `fera-decidida` · ⚒ +1] → presa
- **livre**: “(Ela passa por você devagar e sobe a escada. Lá em cima alguém grita. Depois, silêncio: ela foi embora.)”
- **presa**: “(Você fecha a grade. A Fera se deita de costas pra você. Lá em cima, a festa continua.)”

## Capítulo 4 · O Charco dos Esquecidos — Charco dos Esquecidos

### Missões

- **O Charco dos Esquecidos**
  1. Siga as tábuas pra oeste, em volta do poço grande do brejal, até a Corte do Abismo.
  2. A Regente quer o livro-caixa da Forja: ele fica na Casa de Contas do dique, a nordeste do brejal — depois da escolta e de uma porta trancada.
  3. O livro-caixa está com você. A Regente quer lê-lo em praça; a Dona Chaveira, no dique, quer levá-lo à Brasa; e a Dama Véu sabe um jeito de ninguém ficar com ele.
- **Pedra de nascença**
  1. Tome de volta a pedra do Lasca: um bando a levou pro mato alto, no sul do brejal.
- **O último toque** 🤫 _secreta_
  1. O caderno do sineiro fala de um som que só ele ouvia. Quem foi aprendiz dele saberia ler o resto.

### Lugares

#### Brejal das Tábuas

_Quem pisa fora da tábua, o brejo não devolve._

- 🚪 porta → Palafita do Sineiro
- 🚪 porta → Vau das Moedas
- 🚪 porta → Corte Submersa
- 🪧 “A Casa de Contas do dique. Porta de ferro, três trancas, e um martelo marcado a fogo no batente. Trancada.” _(se sem `chave-dique`)_
- 🚪 porta → Galeria do Dique
- 🪧 “A estrada do dique sobe a ladeira, rumo à fumaça de Ferro-Fundo. Mas o que você veio buscar no charco ainda não se resolveu.” _(se sem `cap4`)_
- 🚪 porta → Ladeira das Escórias
- 🗣 Seu Lodo, o barqueiro
- 🗣 Dona Chaveira
- 🗣 Capitão Aurélio
- ⚔ luta (treinador, `venceu:escolta`) — “Dois humanos de armadura barram a estrada do dique, com bichos de guerra na coleira curta. ⏎ — Alto. Daqui pra dentro é carga do Rei. Solta os cães, Brito.”
- ⚔ luta (bando, `venceu:saqueadores`) — “Quatro vultos repartem alguma coisa no mato alto. Um deles segura contra a luz uma pedrinha que brilha.”
- 📦 “Na pressa de fugir, largaram o que estavam repartindo: uma pedra lapidada, do tamanho de um olho, ainda morna.” [ganha 💎 Pedra de Nascença] _(se `venceu:saqueadores`)_

#### Corte Submersa

_Casas em cima da água, e uma chama pequena pra cada um que chegou expulso._

- 🚪 porta → Brejal das Tábuas
- 🗣 A Regente
- 🗣 Presságio
- 🗣 Dama Véu
- 🗣 Pavio
- 🗣 Lasca
- 🗣 Tia Papo
- 🗣 Croque
- 🪧 “As lâmpadas dos esquecidos: uma chama pequena pra cada um que chegou aqui expulso de algum lugar. São muitas. Uma, na ponta, está apagada.”

#### Galeria do Dique

_A água subiu até o joelho. No fundo, alguma coisa brilha e alguma coisa respira._

- 🚪 porta → Brejal das Tábuas
- 📦 “Um cofre de pagamento, esquecido na enchente. A ferrugem fez o serviço da chave.” [+₽600 · 2× Hyper Potion]
- ⚔ luta (alfa, `venceu:alfa4`) — “No fundo da galeria alagada, enrolado sobre caixotes arrombados que soltam uma luz morna, o **Alfa do Charco** abre os olhos. As lascas não o alimentam: só não o deixam dormir.” _(se sem `venceu:alfa4`)_
- 📦 “Atrás do ninho, num nicho seco, um livro grosso de capa de couro e cantoneiras de ferro. Cada página é uma coluna de números: lascas que entram, moedas com cara de rei que saem. Onze anos de colunas. ⏎ Você pega o **livro-caixa da Forja**.” [ganha 📕 Livro-caixa da Forja · marca `pegou-livro` · “O Charco dos Esquecidos” → etapa 3] _(se sem `pegou-livro`)_
- 🪧 “O nicho vazio. Nos caixotes arrombados, as lascas que sobraram ainda pulsam, cada uma fora do compasso da outra.”

#### Palafita do Sineiro

_Ninguém mora aqui. Mesmo assim, não tem pó._

- 🚪 porta → Brejal das Tábuas
- 🪧 “Uma lâmpada de azeite, sem chama, pendurada no corrimão. Tem um sino pequeno riscado no vidro.”
- 📦 “Uma arca na varanda de uma casa onde ninguém mora. Dentro, um caderno de capa mole, na letra miúda de quem escreve escondido. ⏎ “…não foi por lealdade que eu não toquei. Foi porque eu já tinha tocado.”” [“O último toque” → etapa 1]

### Personagens

#### Seu Lodo, o barqueiro

Por onde a conversa começa (vale a primeira que bate):

- `cap4` → **depois**
- “O Charco dos Esquecidos” não recebida → **oi**
- _sempre_ → **rumo**

- **depois**: “O charco anda agitado desde que você chegou. Fazia onze anos que não acontecia nada aqui.”
- **oi**: “Hã? Quem está aí? Eu não enxergo bem. Você veio do Vau, né? Está cheirando a areia de arena.” → oi2
- **oi2**: “Aqui é o Charco dos Esquecidos. Quem mora aqui é quem a Forja e o Círculo não quiseram. O charco aceita todo mundo.”
  - ▸ _Estou seguindo uma coisa que puxa pra cá._ → puxa
  - ▸ _Onde fica a Corte do Abismo?_ → corte
- **puxa**: “Então você está indo pra Corte do Abismo. Neste charco, é pra lá que tudo vai.” → corte
- **corte**: “Segue as tábuas pra oeste, em volta do poço grande. Não pisa fora da tábua, que você afunda. E cuidado com a Forja: eles têm um dique a nordeste e vigiam tudo.” [“O Charco dos Esquecidos” → etapa 1]
- **rumo**: “Pra oeste, pelas tábuas, fica a Corte. Pra nordeste, o dique da Forja. Pro sul tem mato alto e bicho bravo.”

#### Dona Chaveira

Por onde a conversa começa (vale a primeira que bate):

- `charco-brasa` → **dBrasa**
- `cap4` → **depois**
- “O Charco dos Esquecidos” etapa 3 → **livro**
- `chave-dique` → **aberta**
- “O Charco dos Esquecidos” etapa 2 → **pede**
- _sempre_ → **oi**

- **dBrasa**: “O livro já subiu pra Ferro-Fundo. Eu fui até a metade do caminho e voltei pra cuidar das chaves.”
- **depois**: “A porta que eu guardei por nove anos não guarda mais nada. Tlim.”
- **livro**: “Tlim… você achou. Está tudo aí, não está? Cada venda.” → livro2
- **livro2**: “Escuta. Se isso for lido em praça, a Forja quebra, e quem sofre primeiro são os pequenos, que não têm culpa. Tem gente boa lá dentro. A Brasa, a ferreira de Pedralume, agora tem voz na Ordem. Deixa o livro comigo: eu levo a Ferro-Fundo e entrego a ela. A Forja se corrige por dentro. Demora mais, mas não destrói ninguém.”
  - ▸ _⚒ Confiar o livro à Chaveira, pra chegar à Brasa._ [entrega 📕 Livro-caixa da Forja · marca `cap4`, `charco-brasa` · “O Charco dos Esquecidos” → concluída · ⚒ +2 🌑 -2 · dom 🗝 Têmpera Lenta · 1× Elmo Rochoso] → dBrasa1
  - ▸ _Ainda vou pensar._
- **dBrasa1**: “Obrigada. Eu vou guardar bem e entregar na mão dela. Leva isto: vai te proteger.”
- **aberta**: “A porta está aberta. Eu fico aqui esperando.”
- **pede**: “Tlim… Você passou pelos soldados. Então veio pelo livro.” → pede2
- **pede2**: “Eu guardo esta porta há nove anos. De três anos pra cá, os números não fazem mais sentido: saem pedras e entra dinheiro de **fora**, com a cara de um rei. Perguntei ao meu chefe, e ele mandou eu cuidar das chaves.”
  - ▸ _Me deixe entrar._ → entra
  - ▸ _Por que não abriu você mesma?_ → medo
- **entra**: “Toma a chave. Só te peço uma coisa: se achar o livro, fala comigo antes de entregar a quem quer destruir a Forja.” [marca `chave-dique`]
- **medo**: “Porque eu tenho medo. A galeria alagou e tem uma coisa grande morando lá, em cima das pedras. Eu ouço ela respirar.” → entra
- **oi**: “Tlim. Não toca em nada. Aqui é a Casa de Contas da Forja, e você não tem nada pra fazer aqui.”

#### Capitão Aurélio

Por onde a conversa começa (vale a primeira que bate):

- `cap4` → **depois**
- 1ª conversa ou mais com Capitão Aurélio → **denovo**
- _sempre_ → **oi**

- **depois**: “Este mês não vai ter caixote. Vou voltar de mãos vazias, e o inverno é longo. Não estou te culpando. Só estou preocupado.”
- **denovo**: “Eu vou embora no próximo barco. Se isso faz mal a vocês, alguém devia ter me avisado antes de me vender.”
- **oi**: “Um Pokémon solto dentro do dique? Os guardas falharam. Calma, eu não caço: eu compro. Sou o Capitão Aurélio, a serviço do Rei.” → oi2
- **oi2**: “No meu reino o inverno dura sete meses. A pedra que eu compro aqui aquece uma vila inteira até a primavera. Ninguém me contou de onde ela vem. Eu pago o preço que pedem.”
  - ▸ _(Mostrar os dentes.)_ → dentes
  - ▸ _(Olhar pros caixotes.)_ → caixotes
- **dentes**: “Eu entendo a sua raiva. Mas quem quebra as pedras e vende não sou eu: são os seus.”
- **caixotes**: “Eram quatro caixotes por mês. Agora são doze. Perguntei por que a Forja passou a vender tanto, e me disseram que era “pra guerra”. Não disseram contra quem.”

#### A Regente

Por onde a conversa começa (vale a primeira que bate):

- `charco-corte` → **dCorte**
- `charco-brasa` → **dBrasa**
- `charco-cinza` → **dCinza**
- “O Charco dos Esquecidos” etapa 3 → **livro**
- “O Charco dos Esquecidos” etapa 2 → **espera**
- _sempre_ → **oi**

- **dCorte**: “Já leram o livro em sete aldeias. Em duas, os da Forja ouviram calados e foram embora. Não sei pra onde, e isso me preocupa.”
- **dBrasa**: “Você entregou o livro pra própria Forja se julgar. Esperamos onze anos por essa prova. …Eu não vou te expulsar. Isso é o que fizeram com a gente.”
- **dCinza**: “Você queimou o livro. Eu vi a fumaça. A Dama Véu acha que foi melhor assim. Eu não acho.”
- **livro**: “Isso é… deixa eu ver. Tem o martelo na capa. É o livro-caixa.” → livro2
- **livro2**: “Me entrega, e amanhã o charco inteiro fica sabendo. A Forja vai se dividir, e muitos vão se voltar contra os próprios mestres. Eu não vou fingir que isso me deixa triste.”
  - ▸ _🌑 Entregar o livro-caixa à Regente._ [entrega 📕 Livro-caixa da Forja · marca `cap4`, `charco-corte` · “O Charco dos Esquecidos” → concluída · 🌑 +3 ⚒ -3 · +₽1500 · dom 📕 Tinta de Livro-Caixa] → dCorte1
  - ▸ _Ainda não._
- **dCorte1**: “Obrigada. Estende a pata: esta tinta não sai. Com ela, você bate mais forte em quem já está caindo.”
- **espera**: “O livro-caixa fica na Casa de Contas, no dique, a nordeste do brejal. Cuidado com o Alfa na galeria.”
- **oi**: “Então você é quem o Lasca tanto fala. Pode chegar. Aqui ninguém te faz mal.” → oi2
- **oi2**: “Você já carregou dois Corações, e eu sei pra quem entregou cada um. Não vou te cobrar por isso. Quero te contar o nosso lado.” → conta
- **conta**: “Há onze anos nós avisamos que os Corações estavam se soltando. Vigiar os Corações era o trabalho da Corte do Abismo. A Forja disse que era chantagem, o Círculo disse que era mau agouro, e nos expulsaram.” → conta2
- **conta2**: “Desde então a Forja quebra os Corações que encontra e **vende** os pedaços aos humanos. Os fornos deles queimam isso. Cada venda está anotada num livro-caixa, na Casa de Contas do dique, a nordeste daqui. Eu quero esse livro.”
  - ▸ _Pra fazer o quê com ele?_ → praque
  - ▸ _Eu busco._ [“O Charco dos Esquecidos” → etapa 2] → aceita
  - ▸ _Essa guerra não é minha._ → recusa
- **praque**: “Pra ler em voz alta em todas as aldeias. Quando souberem, a Forja se divide: os que sabiam contra os que foram enganados. É o que fizeram com a gente, só que desta vez é verdade.”
  - ▸ _Eu busco._ [“O Charco dos Esquecidos” → etapa 2] → aceita
  - ▸ _Preciso pensar._
- **aceita**: “A porta é trancada, e quem guarda a chave é uma Klefki. Na frente tem soldados humanos. E a galeria de baixo alagou: dizem que o Alfa do Charco fez ninho lá. Vai com a comitiva inteira.”
- **recusa**: “Entendo. Mas o que a Forja faz acaba secando a fonte de todo mundo. Se mudar de ideia, eu estou aqui.”

#### Presságio

Por onde a conversa começa (vale a primeira que bate):

- 1ª conversa ou mais com Presságio → **agua**
- _sempre_ → **oi**

- **agua**: “Há um ano eu acordo com o pelo molhado, sem ter chovido. É um aviso: vem muita água, de um lugar alto. Contei à Regente, e ela me pediu segredo. Mas você precisa saber.”
- **oi**: “Eu sou o arauto da Corte. Eu sinto os desastres antes de acontecerem. Por isso muita gente acha que sou eu que causo.”

#### Dama Véu

Por onde a conversa começa (vale a primeira que bate):

- `charco-cinza` → **dCinza**
- “O último toque” etapa 1 → **diario**
- “O Charco dos Esquecidos” etapa 3 → **livro**
- `cap4` → **depois**
- `sino-devolvido` → **amiga**
- _sempre_ → **oi**

- **dCinza**: “A Regente não fala mais comigo. Um dia passa.”
- **diario**: “Essa letra é dele. Você achou a casa onde ele se escondia. Eu pensava que ele vinha pra cá só pra ficar sozinho.” → diario2
- **diario2**: ““Não é que eu não quis tocar o sino. É que eu já tinha tocado uma vez, por uma coisa que só eu ouvi: vozes muito antigas, debaixo da Fonte, chamando os Corações de volta.” ⏎ Ele ouviu os **Antigos**, onze anos antes de todo mundo. E morreu achando que estava louco.” → diario3
- **diario3**: “Guarda esse nome: Antigos. Os Corações não se soltam sozinhos. Eles estão sendo **chamados**.” [“O último toque” → concluída · marca `ouviu-antigos` · 🌑 +1 · 1× Max Ether, 2× Fruta Lum]
- **livro**: “Você está com o livro-caixa. A Regente quer ler em praça, e a Chaveira quer levar pra dentro da Forja. As duas têm razão. É isso que me preocupa.” → livro2
- **livro2**: “Meu mestre dizia que a memória não é pra ser usada como arma. Se você quiser, a gente queima o livro. Ninguém fica com a prova, e ninguém a usa pra espalhar ódio. A Forja continua vendendo, até alguém impedir de outro jeito. Não é justo, eu sei.”
  - ▸ _🔥 Queimar o livro-caixa na lâmpada do sineiro._ [entrega 📕 Livro-caixa da Forja · marca `cap4`, `charco-cinza` · “O Charco dos Esquecidos” → concluída · 🌑 -2 🌿 +1 ⚒ +1 · dom 🕯 Cinza Fria] → dCinza1
  - ▸ _Não. Alguém tem que saber._
- **dCinza1**: “Queimou. Guarda um pouco da cinza: ela ajuda a esconder o seu rastro.”
- **depois**: “O que você procura não está mais aqui. Agora o caminho sobe, pra Ferro-Fundo, onde a Forja mora.”
- **amiga**: “Você devolveu o sino a quem se lembrava dele. Eu fiquei sabendo. Obrigada. Aqui você tem uma amiga.”
- **oi**: “Você não me conhece, mas eu cuidei por onze anos de um túmulo perto de Pedralume. Fica atrás de uma árvore que parece árvore e não é. Quase ninguém acha.”

#### Pavio

Por onde a conversa começa (vale a primeira que bate):

- “O último toque” concluída → **acesa**
- 2ª conversa ou mais com Pavio → **terceira**
- 1ª conversa ou mais com Pavio → **segunda**
- _sempre_ → **oi**

- **acesa**: “A Dama deixou eu acender! Agora são cento e treze.”
- **terceira**: “Essa lâmpada apagada fica numa casa em cima da água, no brejal, lá pro sul. Ninguém mora lá. Pra chegar tem um arvoredo, e uma das árvores é falsa: dá pra passar por dentro dela. Eu passei!”
- **segunda**: “Tem uma lâmpada que a Dama Véu não me deixa acender. Ela diz que o dono ainda não chegou. Mas a lâmpada já está aqui.”
- **oi**: “Eu acendo as lâmpadas. Tem uma pra cada um que chegou aqui expulso de algum lugar. São cento e doze, e eu sei o nome de todos.”

#### Lasca

Por onde a conversa começa (vale a primeira que bate):

- “Pedra de nascença” concluída → **casa**
- “Pedra de nascença” etapa 1 · com 💎 Pedra de Nascença → **trouxe**
- “Pedra de nascença” etapa 1 → **cade**
- _sempre_ → **oi**

- **casa**: “Me deixaram entrar no Paço. Sentei no fundo, e ninguém me mandou sair. Pra mim já é muito.”
- **trouxe**: “É ela! Você trouxe mesmo.” → trouxe2
- **trouxe2**: “Vou te contar uma coisa, de graça: fui eu que contei à Regente sobre o livro-caixa. Eu vendi pedra pra Forja por dois anos antes de entender o que eles faziam com ela. Quando entendi, fiquei com nojo.” [entrega 💎 Pedra de Nascença · “Pedra de nascença” → concluída · 🌑 +1 · +₽900 · 1× Lodo Negro]
- **cade**: “Minha pedra está com o bando, no sul do brejal.”
- **oi**: “Você, aqui, na minha casa! Fala baixo. Aqui ninguém me respeita: acham que eu só saio pra vender e nunca trago nada que preste.” → oi2
- **oi2**: “Preciso de um favor. Um bando me atacou no mato do sul do brejal e levou a minha pedra de nascença. Todo Sableye tem uma. Sem ela, a Regente não me recebe.”
  - ▸ _Eu pego de volta._ [“Pedra de nascença” → etapa 1] → vai
  - ▸ _Quanto você paga?_ → paga
- **vai**: “Eles estão no mato alto, no sul do brejal. São uns quatro.”
- **paga**: “Pago, claro. O que eu tiver.”
  - ▸ _Eu pego de volta._ [“Pedra de nascença” → etapa 1] → vai
  - ▸ _Depois._

#### Tia Papo

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **balcao**

- **balcao**: “Estalagem do Fundo. A cama é simples e a sopa é escura, mas a comitiva inteira descansa.”
  - ▸ _🛏 Descansar ({custo})._ [descansa (cura)]
  - ▸ _Só passando._

#### Croque

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **banca**

- **banca**: “Krrk. Eu vendo o que acho no charco. Quer ver?”
  - ▸ _🛒 Ver as mercadorias._ [abre a loja]
  - ▸ _Depois._

## Capítulo 5 · Ferro-Fundo — Minas da Forja

### Missões

- **Ferro-Fundo**
  1. Entre em Ferro-Fundo e ouça os dois lados: o Mestre-Forjador, na Bigorna-Mãe, e o Tatu, delegado da greve, na beira do canal de lava.
  2. O piquete liberou a descida. A Galeria das Lascas fica no fundo da cidade, ao norte.
  3. Você viu o que os fornos queimam. O Tatu quer parar tudo, o Mestre quer as armas prontas, e a Brasa quer a galeria no chão.
- **Buscar os nove**
  1. Ache o Faísca, um Aron pequeno que desceu sozinho à Galeria das Lascas, e leve notícia à Mãe Bigorna.
- **Mão de gente** 🤫 _secreta_
  1. O ferreiro escondido faz as peças finas de Ferro-Fundo e nunca perguntou pra onde elas vão. Você sabe a resposta.

### Lugares

#### Ladeira das Escórias

_A montanha cospe pela encosta o que os fornos não quiseram._

- 🚪 porta → Brejal das Tábuas
- 🚪 porta → Ferro-Fundo
- 🪧 “A estrada continua do outro lado da montanha, descendo pra um verde que daqui parece se mexer. Mas Ferro-Fundo ainda não se resolveu.” _(se sem `cap5`)_
- 🚪 porta → Aldeia dos Tocos
- 🗣 Portão
- 📦 “Uma carroça de escória tombada na beira da ladeira. No meio da borra de ferro, alguém escondeu o almoço e o pagamento.” [+₽400 · 1× Hyper Potion, 1× Revive]

#### Ferro-Fundo

_Uma cidade dentro da montanha. Metade dela está de braços cruzados._

- 🚪 porta → Ladeira das Escórias
- 🗣 O piquete _(se sem `desce-lascas`)_
- 🚪 porta → Galeria das Lascas
- 🚪 porta → Oficina Atrás da Parede
- 🗣 Mestre-Forjador
- 🗣 Brasa
- 🗣 Tatu, o delegado
- 🗣 Mãe Bigorna
- 🗣 Dona Caldeira
- 🗣 Bússola
- 🗣 Faísca _(se `achou-faisca`)_
- 🗣 Sargento Cascalho _(se `lanca-forja`)_
- 🪧 “O canal de lava que move os foles de Ferro-Fundo. Do lado, uma tábua com nove riscos, e embaixo, a carvão: “a gente desce quando eles voltarem”.”

#### Galeria das Lascas

_O calor faz o ar tremer. O que queima aqui não vira cinza._

- 🚪 porta → Ferro-Fundo
- 🗣 Faísca _(se sem `achou-faisca`)_
- 📦 “Uma marmita de mineiro e um embornal, largados na correria.” [1× Max Potion, 2× Full Heal]
- ⚔ luta (alfa, `venceu:alfa5`) — “No fim da galeria, o **Alfa da Mina** anda em círculos em volta de um forno aberto, as costas em brasa, sem conseguir parar. Quando te vê, enfim tem pra onde ir.” _(se sem `venceu:alfa5`)_
- 📦 “O forno das lascas. Pedras do tamanho de um punho, mornas, pulsando — cada uma um pedaço de Coração — descem por uma calha até o fogo. O fogo não consome: bebe. O que sai do outro lado é a lâmina mais fina que você já viu. ⏎ Num canto, nove capacetes pequenos.” [marca `viu-lascas` · “Ferro-Fundo” → etapa 3] _(se sem `viu-lascas`)_
- 🪧 “O forno das lascas. Ainda morno, ainda com sede.”

#### Oficina Atrás da Parede

_Um forno pequeno, uma bancada limpa, e alguém que não devia estar aqui._

- 🚪 porta → Ferro-Fundo
- 🗣 Odilon
- 🪧 “A bancada do ferreiro: cada ferramenta no seu risco de giz. Na parede, um desenho de criança — uma casa, um rio, uma ferradura.”

### Personagens

#### Portão

Por onde a conversa começa (vale a primeira que bate):

- `cap5` → **depois**
- “Ferro-Fundo” não recebida · `charco-corte` → **livro**
- “Ferro-Fundo” não recebida · ⚒ Ordem da Forja < -2 → **frio**
- “Ferro-Fundo” não recebida → **oi**
- _sempre_ → **entra**

- **depois**: “Muita coisa mudou aqui dentro. Eu continuo na porta, como sempre.”
- **livro**: “Foi você que levou o livro pra Corte. Leram aquilo aqui dentro também. Eu não devia te deixar passar. …Mas eu li, e fiquei com vergonha. Entra.” [“Ferro-Fundo” → etapa 1]
- **frio**: “A Forja sabe o que você andou fazendo, e não gostou. Pode passar, mas eu vou ficar de olho em você.” [“Ferro-Fundo” → etapa 1]
- **oi**: “Alto lá. Em Ferro-Fundo só entra quem traz encomenda, quem vem aprender ou quem vem arrumar problema. Qual é o seu caso?”
  - ▸ _Estou seguindo o que puxa os Corações._ [“Ferro-Fundo” → etapa 1] → puxa
  - ▸ _Problema._ [“Ferro-Fundo” → etapa 1] → problema
- **puxa**: “Então você sabe das pedras. Pode entrar. O Mestre vai querer falar com você. E não estranha a confusão: metade da mina está em greve.”
- **problema**: “Pelo menos é sincero. Pode entrar. O Mestre fica na Bigorna-Mãe, e o líder da greve, na beira do canal de lava.”
- **entra**: “O Mestre fica na Bigorna-Mãe, a casa de pedra do lado esquerdo. O delegado da greve, na beira do canal de lava.”

#### O piquete

Por onde a conversa começa (vale a primeira que bate):

- `ouviu-mestre` e `ouviu-tatu` → **passa**
- _sempre_ → **barra**

- **passa**: “Ouviu os dois? Então pode descer. Toma cuidado.” [marca `desce-lascas` · “Ferro-Fundo” → etapa 2]
- **barra**: “Ninguém desce, é a greve. Se você quer descer, primeiro ouve o Mestre **e** o Tatu. A gente não quer ninguém morrendo lá embaixo sem saber onde está se metendo.”

#### Mestre-Forjador

Por onde a conversa começa (vale a primeira que bate):

- `ferro-armas` → **dArmas**
- `ferro-greve` → **dGreve**
- `ferro-ruiu` → **dRuiu**
- “Ferro-Fundo” etapa 3 → **decide**
- `ouviu-mestre` → **espera**
- _sempre_ → **oi**

- **dArmas**: “Os fornos não param mais. Os mineiros voltaram ao trabalho, calados. Eu sei que estão descontentes. Mas as armas estão saindo.”
- **dGreve**: “Os fornos apagaram. Você ficou do lado de quem tinha medo. Quando os humanos chegarem, lembra que a gente podia estar armado.”
- **dRuiu**: “A galeria desabou. Onze anos de trabalho perdidos. A Brasa diz que foi pra limpar a Forja. Pra mim, ficamos sem defesa.”
- **decide**: “Você viu. As pedras entram, e saem as melhores armas que esta terra já teve. Fica do meu lado, e eu ponho os fornos pra trabalhar dia e noite. Quando os humanos vierem, a Forja defende todo mundo.”
  - ▸ _⚒ Ficar com o Mestre: as armas saem._ [marca `cap5`, `ferro-armas` · “Ferro-Fundo” → concluída · ⚒ +3 🌿 -2 🌑 -1 · dom ⚔ Gume de Ferro-Fundo · 1× Orbe da Vida] → dArmas1
  - ▸ _Ainda não decidi._
- **dArmas1**: “Ótimo. Chega perto do fogo. Isto aqui a Forja não vende a ninguém: é o nosso melhor gume, e agora é seu.”
- **espera**: “Fala com o líder dos grevistas, na beira do canal, e desce à galeria. Depois a gente conversa.”
- **oi**: “Entra. Eu sou o Mestre-Forjador. E você é o forasteiro que anda carregando Coração de um lado pro outro.” → oi2
- **oi2**: “Vou ser direto: é verdade. Nós quebramos os Corações soltos e vendemos os pedaços aos humanos. Com o dinheiro deles eu compro carvão e armo a Forja **contra** eles mesmos. Você pode achar errado. Eu acho necessário.”
  - ▸ _Armar pra quê?_ → guerra
  - ▸ _E os que estão de braços cruzados lá fora?_ → greve
- **guerra**: “Pra guerra que já começou. Tem laço na estrada, gaiola na serra, arena em cima de Fonte. Todo ano os humanos avançam mais. O Círculo foge e a Corte vende segredo. Alguém precisa lutar.” [marca `ouviu-mestre`] → pedido
- **pedido**: “Desce à galeria, se os grevistas deixarem. Vê o que o forno queima e o que sai dele. Depois me diz se **você** fecharia.”
- **greve**: “Os mineiros pararam porque a galeria de baixo ficou perigosa: o Alfa que mora lá enlouqueceu com o calor das pedras. Eles têm razão de ter medo. Mas parar de trabalhar não resolve.” [marca `ouviu-mestre`] → pedido

#### Brasa

Por onde a conversa começa (vale a primeira que bate):

- `ferro-ruiu` → **dRuiu**
- `cap5` → **depois**
- `vendeu-minerio` → **traida**
- “Ferro-Fundo” etapa 3 → **decide**
- `charco-brasa` → **livro**
- `fim-forja` → **amiga**
- _sempre_ → **oi**

- **dRuiu**: “Metade da Forja não fala mais comigo. A outra metade me agradece. Eu durmo mal, mas durmo.”
- **depois**: “Não foi o que eu faria. Mas a decisão era sua.”
- **traida**: “Você. O que vendeu o meu minério. Não tenho nada pra falar com você.”
- **decide**: “Você desceu, então viu o que eu vi. Aquilo não é forja: eles estão queimando os Corações.” → decide2
- **decide2**: “O Mestre quer os fornos dia e noite. O Tatu quer fechar a porta. Mas porta fechada alguém abre de novo. A galeria tem que **desabar**. Eu sei onde ficam as escoras: fui eu que fiz. Depois disso ninguém mais queima Coração aqui. Nem pra se defender.”
  - ▸ _🔥 Derrubar a Galeria das Lascas, com a Brasa._ [marca `cap5`, `ferro-ruiu` · “Ferro-Fundo” → concluída · ⚒ -1 🌿 +1 🌑 +1 · dom 🔨 Onde o Golpe Cai · 1× Faixa de Foco] → dRuiu1
  - ▸ _Ainda não decidi._
- **dRuiu1**: “Pronto. Três marretadas, e a galeria veio abaixo. Toma: quem derruba o que construiu aprende onde bater.”
- **livro**: “A Chaveira chegou antes de você e me entregou o livro. Li em três noites. Passei a vida defendendo a Forja. Agora vou ter que consertá-la.”
- **amiga**: “{eu}! Soube que o cano de Pedralume ainda funciona. Por causa dele me deram um forno aqui em cima. Chega mais perto do calor.”
- **oi**: “Olha quem apareceu. Eu vim pra Ferro-Fundo depois que a fonte de Pedralume se resolveu. Aqui pelo menos não falta fogo.”

#### Tatu, o delegado

Por onde a conversa começa (vale a primeira que bate):

- `ferro-greve` → **dGreve**
- `cap5` → **depois**
- “Ferro-Fundo” etapa 3 → **decide**
- `ouviu-tatu` → **espera**
- _sempre_ → **oi**

- **dGreve**: “Agora a gente faz panela, enxada e prego. Vende menos, mas eu durmo bem. Se a guerra vier, a gente se esconde debaixo da terra.”
- **depois**: “A greve acabou, e não fomos nós que decidimos como. Podia ter sido pior.”
- **decide**: “Viu? Agora me diz se é certo mandar filhote trabalhar naquilo. Fica com a gente: fechamos a galeria nova, apagamos os fornos grandes, e a Forja volta a fazer prego, enxada e panela. Vamos ficar sem armas, mas vivos.”
  - ▸ _✊ Ficar com os mineiros: a Forja para._ [marca `cap5`, `ferro-greve` · “Ferro-Fundo” → concluída · ⚒ -2 🌿 +2 🌑 +1 · dom ✊ Braço Cruzado · 1× Colete de Assalto] → dGreve1
  - ▸ _Ainda não decidi._
- **dGreve1**: “A gente não esperava que alguém de fora ficasse do nosso lado. Obrigado. Cruza os braços aqui com a gente: você aprende a aguentar firme.”
- **espera**: “Fala com o Mestre, se ainda não falou. Depois os grevistas te deixam descer. Não vai sozinho.”
- **oi**: “Se veio furar a greve, pode voltar. …Você não é daqui. Então escuta o lado de quem cava.” → oi2
- **oi2**: “A gente trabalha na mina desde filhote. Sempre foi quente e escuro, mas dava pra voltar pra casa. Aí abriram a galeria nova, a das pedras que pulsam. Em três meses perdemos nove companheiros. Foi o Alfa que mora lá embaixo. Ele não era violento antes das pedras.”
  - ▸ _O que vocês querem?_ → quer
  - ▸ _O Mestre diz que parar não salva ninguém._ → mestre
- **quer**: “Queremos fechar a galeria nova e voltar ao ferro comum. A Forja fica mais pobre, mas ninguém mais morre.” [marca `ouviu-tatu`]
- **mestre**: “Pro Mestre, mineiro é número. Pra mim, cada um dos nove tinha nome.” [marca `ouviu-tatu`]

#### Mãe Bigorna

Por onde a conversa começa (vale a primeira que bate):

- “Buscar os nove” concluída → **grata**
- “Buscar os nove” etapa 1 · `achou-faisca` → **voltou**
- “Buscar os nove” etapa 1 → **espera**
- _sempre_ → **pede**

- **grata**: “Ele está de castigo. Mas eu deixo ele sair pra te cumprimentar.”
- **voltou**: “FAÍSCA! Vem cá! ⏎ Você trouxe ele de volta. Você desceu onde eu não tive coragem. Obrigada.” [“Buscar os nove” → concluída · ⚒ +1 · 1× Max Revive, 1× Pedra Mineral]
- **espera**: “Ele deve estar perto da lava. Ele sempre vai pra lá.”
- **pede**: “Você viu um Aron pequeno, com o capacete lascado? É o meu filho, o Faísca. Ele soube que nove mineiros sumiram e desceu sozinho pra procurar. Faz dois dias.”
  - ▸ _Eu procuro._ [“Buscar os nove” → etapa 1] → obrigada
  - ▸ _Sinto muito._
- **obrigada**: “Ele gosta de lugar quente. Deve estar perto da lava. Eu tentei descer, mas não tive coragem.”

#### Dona Caldeira

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **balcao**

- **balcao**: “Pensão da Caldeira. Aqui é sempre quente. Tem cama pra comitiva inteira.”
  - ▸ _🛏 Descansar ({custo})._ [descansa (cura)]
  - ▸ _Só passando._

#### Bússola

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **banca**

- **banca**: “Eu vendo ferramentas e mantimentos. Quer ver?”
  - ▸ _🛒 Ver as mercadorias._ [abre a loja]
  - ▸ _Depois._

#### Faísca

Por onde a conversa começa (vale a primeira que bate):

- `achou-faisca` → **casa**
- _sempre_ → **achado**

- **casa**: “Estou de castigo. A mãe pendurou os nove capacetes na parede, e todo mundo que passa tira o chapéu.”
- **achado**: “Não conta pra minha mãe! Eu vim procurar os nove mineiros. Não achei nenhum. Só achei os capacetes. Eu juntei todos.”
  - ▸ _Vamos pra casa._ [marca `achou-faisca`] → vai
  - ▸ _(Ficar um pouco com ele.)_ → fica
- **vai**: “Tá bom. Mas eu levo os capacetes.”
- **fica**: “Eu não estou chorando. É o calor.”
  - ▸ _Vamos pra casa._ [marca `achou-faisca`] → vai

#### Sargento Cascalho

Por onde a conversa começa (vale a primeira que bate):

- `cap5` → **depois**
- _sempre_ → **oi**

- **depois**: “Eu continuo na Forja. Mas agora presto atenção no que ela faz.”
- **oi**: “Você! Eu levei a ponta de lança ao Mestre, como prometi. Ele não negou: disse que a arma era nossa, e que era boa. Trinta anos servindo a Forja, e eu não sabia de nada.”

#### Odilon

Por onde a conversa começa (vale a primeira que bate):

- “Mão de gente” concluída · `odilon-fala` → **falou**
- “Mão de gente” concluída → **calou**
- “Mão de gente” etapa 1 · com 🗡 Ponta de Lança → **lanca**
- “Mão de gente” etapa 1 → **denovo**
- _sempre_ → **oi**

- **falou**: “O Mestre me ouviu e não me expulsou. Disse que ia pensar. Eu já decidi: arma eu não faço mais.”
- **calou**: “Parei de fazer ponta de lança. Agora faço enxada. O Mestre reclama, e eu finjo que não ouço.”
- **lanca**: “Deixa eu ver isso. …Esse acabamento é meu. Fui eu que fiz esta ponta. Onde você achou?” → lanca2
- **lanca2**: “(Você risca no chão: uma serra. Um bicho grande, com a ponta no flanco. Depois uma grade e uma arena.) ⏎ Usaram a minha lança pra ferir um de vocês. E as grades da arena também são minhas. Passei seis anos sem querer saber pra que serviam.”
  - ▸ _(Apontar pra porta: vá dizer isso ao Mestre.)_ [marca `odilon-fala` · “Mão de gente” → concluída · ⚒ -1 🌿 +1 · 1× Cinto do Perito] → falou1
  - ▸ _(Deixar o martelo na mão dele.)_ [“Mão de gente” → concluída · ⚒ +1 · 1× Cinto do Perito] → calou1
- **falou1**: “Eu vou falar com o Mestre. Se ele me expulsar, paciência. Leva isto: é a última peça que eu fiz sem saber pra quê.”
- **calou1**: “Você não me denunciou. Então eu fico. Mas daqui pra frente só faço o que eu souber pra que serve. Leva isto: é uma boa peça.”
- **denovo**: “Eu faço ponta de lança, trinco e grade, e nunca perguntei pra onde vão. Você sabe?”
  - ▸ _(Riscar no chão: uma serra, uma gaiola, uma arena.)_ → lanca2
  - ▸ _(Não responder.)_
- **oi**: “Não grita, por favor. Eu sou o Odilon, ferreiro. Sou humano, sim. O único desta montanha.” → oi2
- **oi2**: “Na minha terra eu fazia ferradura e dobradiça. Um dia um Pokémon da Forja me viu trabalhar e me trouxe um ferro que eu nunca tinha visto. Faz seis anos que eu moro aqui, escondido. Ninguém me obriga: eu fiquei pra aprender.” [“Mão de gente” → etapa 1] → oi3
- **oi3**: “Eu faço as peças mais finas: ponta de lança, trinco, grade. O Mestre diz que é pra defesa da Forja. Eu nunca perguntei pra onde vão.”

## Capítulo 6 · O Bosque que Anda — Trilha da Marcha

### Missões

- **O Bosque que Anda**
  1. Siga o rastro das árvores pela trilha do norte, atravesse a Marcha e ache a Mãe Meganium na clareira — depois do Pastor.
  2. Ouça o Pai Torterra, na Clareira das Mães, e volte à Mãe Meganium.
- **Sombra pra daqui a vinte anos**
  1. Ache uma muda perto do rastro das árvores, na Marcha, e leve ao Seu Roque, na Aldeia dos Tocos.
- **Quem fica** 🤫 _secreta_
  1. O Vô Carvalho pede licença pra se deitar. Só uma Mãe do Círculo pode dar.

### Lugares

#### Aldeia dos Tocos

_Chamava-se Aldeia da Sombra. Nem toco ficou: ficou buraco._

- 🚪 porta → Ladeira das Escórias
- 🚪 porta → A Marcha
- 🪧 “A estrada desce pro rio grande. Dá pra ouvir a água daqui — mas o bosque ainda não decidiu se vai ou se fica, e você prometeu olhar.” _(se sem `cap6`)_
- 🚪 porta → Cabeceira da Ponte
- 🗣 Seu Roque, o barragista
- 🗣 Primo do Kecleon
- 🗣 Dona Aud
- 🗣 Brotinho
- 🗣 Seu Bento
- 🪧 “O último toco da praça. Alguém começou a contar os anéis a canivete e desistiu no duzentos.”

#### A Marcha

_Cada árvore deixa um buraco atrás de si. Elas vão pro norte, um passo por dia._

- 🚪 porta → Aldeia dos Tocos
- 🚪 porta → Clareira das Mães
- 🗣 Vô Carvalho
- ⚔ luta (treinador, `venceu:lenhadores`) — “Três rapazes de machado no ombro rodeiam uma árvore que ficou pra trás. Ela treme — as outras não tremem assim. ⏎ — Olha, veio bicho defender a lenha. Solta os cachorros, que hoje tem lenha e tem janta.”
- 📦 “Um broto de folha clara, do tamanho de uma pata, crescendo na beira de uma das covas. Alguma árvore o deixou cair no caminho — ou deixou de propósito.” [ganha 🌱 Muda de Árvore Andarilha]

#### Clareira das Mães

_Onde o Círculo vota. Vinte e três a favor, uma contra._

- 🚪 porta → A Marcha
- 🗣 Mãe Meganium
- 🗣 Pai Torterra
- 🗣 Vento
- 🪧 “As raízes do Coração do bosque: grossas como um corpo, mornas, entrando na terra em volta de alguma coisa que pulsa lá embaixo. Enquanto o bosque anda, elas se esticam. Uma hora arrebentam.”
- 📦 “Um ninho velho, caído de uma forquilha. Quem morava nele foi embora com a árvore de cima e deixou o que não dava pra carregar.” [2× Max Potion, 2× Fruta Lum]
- ⚔ luta (alfa, `venceu:alfa6`) — “A trilha estreita entre dois paredões de tronco. No meio dela, de costas, o **Pastor** — o Alfa que toca as árvores pra frente — fareja o ar. Tudo o que vem do sul, pra ele, é machado.”

### Personagens

#### Seu Roque, o barragista

Por onde a conversa começa (vale a primeira que bate):

- “Sombra pra daqui a vinte anos” etapa 1 · com 🌱 Muda de Árvore Andarilha → **trouxe**
- “Sombra pra daqui a vinte anos” etapa 1 → **cade**
- `bosque-partiu` → **dPartiu**
- `bosque-ficou` → **dFicou**
- `bosque-rachou` → **dRachou**
- “O Bosque que Anda” não recebida → **oi**
- “Sombra pra daqui a vinte anos” não recebida → **pede**
- _sempre_ → **plantou**

- **trouxe**: “Você trouxe! Com terra e tudo. Segura enquanto eu cavo… pronto, está plantada. Obrigado!” [entrega 🌱 Muda de Árvore Andarilha · “Sombra pra daqui a vinte anos” → concluída · 🌿 +1 · 1× Restos · +₽300]
- **cade**: “A muda fica perto do rastro das árvores, na Marcha. Traz com a terra junto.”
- **dPartiu**: “As árvores foram todas embora. Vamos cavar um açude novo mais pra baixo e aprender a viver no sol.”
- **dFicou**: “As árvores voltaram, mas estão doentes: as folhas caem fora de época. Ainda dão sombra. Não sei se devo agradecer ou pedir desculpa a elas.”
- **dRachou**: “Metade das árvores voltou, as mais velhas. Dá sombra pra metade da aldeia. O resto do pessoal se mudou pra perto delas.”
- **oi**: “Isto aqui se chamava Aldeia da Sombra. Agora chamam de Aldeia dos Tocos. As árvores foram embora **andando**, moço. Eu vi: arrancaram as raízes do chão e foram.” → oi2
- **oi2**: “O Círculo decidiu ir pro norte, pra longe dos machados e dos fornos. É direito deles. Só que ninguém perguntou a quem vivia na sombra. Meu açude secou, e as crianças sofrem com o sol. Segue a trilha do norte. Lá está a Mãe Meganium, a única que foi contra.” [“O Bosque que Anda” → etapa 1]
- **pede**: “Já que você vai atrás delas, me traz uma muda. As árvores deixam brotos pelo caminho. Eu planto aqui na praça.”
  - ▸ _Eu trago._ [“Sombra pra daqui a vinte anos” → etapa 1] → vai
  - ▸ _Uma muda não faz sombra._ → sombra
- **vai**: “Procura perto do rastro delas, na Marcha. É um broto de folha clara. Traz com a terra junto.”
- **sombra**: “Hoje não faz. Mas daqui a vinte anos faz, e as crianças ainda vão estar aqui.”
  - ▸ _Eu trago._ [“Sombra pra daqui a vinte anos” → etapa 1] → vai
  - ▸ _Outra hora._
- **plantou**: “Eu rego a muda duas vezes por dia. Está pegando.”

#### Primo do Kecleon

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **banca**

- **banca**: “Sou primo do Kecleon de Pedralume! Vendo de tudo. Quer ver?”
  - ▸ _🛒 Ver as mercadorias._ [abre a loja]
  - ▸ _Depois._

#### Dona Aud

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **balcao**

- **balcao**: “Pousada da Sombra. A sombra acabou, mas a cama é boa.”
  - ▸ _🛏 Descansar ({custo})._ [descansa (cura)]
  - ▸ _Só passando._

#### Brotinho

Por onde a conversa começa (vale a primeira que bate):

- “Quem fica” concluída → **sabia**
- 1ª conversa ou mais com Brotinho → **arvore**
- _sempre_ → **oi**

- **sabia**: “EU FALEI que ela não andava!”
- **arvore**: “Tem uma árvore na Marcha que não anda. Ela fica no meio das outras e só mexe os galhos, fingindo. Eu vi! Ninguém acredita em mim.”
- **oi**: “Eu só saía de noite, por causa do sol. Agora não tem mais árvore, e até a lua está clara demais. Eu não sei mais quando sair.”

#### Seu Bento

Por onde a conversa começa (vale a primeira que bate):

- `cap6` → **depois**
- 1ª conversa ou mais com Seu Bento → **denovo**
- _sempre_ → **oi**

- **depois**: “As árvores que eu plantei continuam no lugar. Eu cuido delas todo dia.”
- **denovo**: “Se encontrar os rapazes, pode dar um susto neles. Só não machuca muito. São novos e não sabem o que fazem.”
- **oi**: “Calma, o machado está no chão. Eu sou lenhador, sim, faz trinta anos. Mas só corto árvore que já morreu, e planto duas no lugar. Foi assim que meu pai me ensinou.” → oi2
- **oi2**: “Os rapazes mais novos não pensam assim. Estão lá na Marcha, cortando as árvores que ficam pra trás. Eu avisei que essas árvores sentem dor. Riram de mim.”

#### Vô Carvalho

Por onde a conversa começa (vale a primeira que bate):

- “Quem fica” concluída → **fim**
- “Quem fica” etapa 1 → **espera**
- 1ª conversa ou mais com Vô Carvalho → **fala**
- _sempre_ → **quieto**

- **fim**: “Ela deixou. Eu vou devagar, do meu jeito. Me procura onde o rio é mais largo.”
- **espera**: “A Mãe Meganium está na clareira, depois do Pastor. Diz a ela que o Carvalho pede licença pra se deitar.”
- **fala**: “Você reparou em mim. Quase ninguém repara. É verdade: eu não ando. Só mexo os galhos pra parecer que estou indo.” → fala2
- **fala2**: “Eu tenho quatrocentos anos neste chão e não quero ir embora. Rio abaixo tem uma ponte que os dois lados vivem quebrando. Eu queria me deitar lá e servir de ponte.” [“Quem fica” → etapa 1] → fala3
- **fala3**: “Mas uma árvore do Círculo precisa da licença de uma Mãe pra isso. Fala com a Mãe Meganium por mim. Ela vai entender.”
- **quieto**: “(Um tronco velho, de casca rachada, no meio das árvores da Marcha. Todas as outras têm um buraco atrás, de onde saíram. Esta não tem.)”

#### Mãe Meganium

Por onde a conversa começa (vale a primeira que bate):

- “Quem fica” etapa 1 → **carvalho**
- `bosque-partiu` → **dPartiu**
- `bosque-ficou` → **dFicou**
- `bosque-rachou` → **dRachou**
- “O Bosque que Anda” etapa 2 · `ouviu-torterra` → **decide**
- “O Bosque que Anda” etapa 2 → **espera**
- _sempre_ → **oi**

- **carvalho**: “Você traz um recado do Carvalho? Quatrocentos anos, e ainda pede licença. Eu sempre soube que ele não andava. Diz que eu deixo: que ele se deite onde o rio é mais largo e sirva de ponte. Vou sentir falta dele.” [“Quem fica” → concluída · marca `arvore-ponte` · 🌿 +1]
- **dPartiu**: “O bosque está indo. As aldeias de baixo estão aprendendo a viver sem sombra. É triste, mas eles vão conseguir.”
- **dFicou**: “Ficamos. As folhas estão caindo fora de época. O bosque está aqui, mas não está bem.”
- **dRachou**: “Metade do bosque dá metade da sombra. As aldeias dizem que é o bastante. As árvores novas mandam notícias do norte.”
- **decide**: “Você ouviu o Torterra. Ele tem razão, e é isso que torna tudo difícil.” → decide2
- **decide2**: “São três caminhos. Deixar o bosque ir: o Círculo se salva, e as aldeias de baixo ficam no sol. Segurar o bosque com as raízes do Coração: ele fica à força, e pode adoecer. Ou dividir: as árvores velhas voltam comigo, e as novas seguem com ele.”
  - ▸ _🍃 Deixar o bosque partir._ [marca `cap6`, `bosque-partiu` · “O Bosque que Anda” → concluída · 🌿 +3 ⚒ -1 · dom 🍃 Semente Andarilha · 4× Fruta Sitrus] → dPartiu1
  - ▸ _🌳 Segurar o bosque com as raízes do Coração._ [marca `cap6`, `bosque-ficou` · “O Bosque que Anda” → concluída · 🌿 -2 ⚒ +1 🌑 +1 · dom 🌳 Raiz Funda · 1× Restos] → dFicou1
  - ▸ _✂ Dividir: as velhas voltam, os novos seguem._ [marca `cap6`, `bosque-rachou` · “O Bosque que Anda” → concluída · 🌿 +1 · dom ✂ Enxerto · 1× Sino-Concha] → dRachou1
  - ▸ _Ainda não sei._
- **dPartiu1**: “Então nós vamos. Eu vou junto: não posso ficar pra trás. Leva esta semente com você.”
- **dFicou1**: “As raízes estão voltando. Dói nelas, e dói em mim. Leva um pedaço de raiz: ela protege quem a carrega. E me perdoa por eu ter te pedido isso.”
- **dRachou1**: “As outras Mães não vão me perdoar por dividir o bosque. Toma: é um enxerto, duas árvores numa só.”
- **espera**: “Fala com o Pai Torterra primeiro. Ele fala devagar, mas vale a pena ouvir até o fim.”
- **oi**: “Você. Eu me lembro de você, do Vale do Orvalho.” → oi2
- **oi2**: “O Círculo votou: vinte e três Mães a favor de ir embora, uma contra. A que votou contra fui eu. Tem gente pequena que vive da nossa sombra, e ninguém perguntou a eles.” → oi3
- **oi3**: “Fala com o Pai Torterra, ali. É ele quem carrega o bosque nas costas. Depois volta e me diz o que achou.” [“O Bosque que Anda” → etapa 2]

#### Pai Torterra

Por onde a conversa começa (vale a primeira que bate):

- `cap6` → **depois**
- `ouviu-torterra` → **denovo**
- _sempre_ → **oi**

- **depois**: “Está decidido. Eu sigo carregando o bosque, pra onde for.”
- **denovo**: “Eu já disse o que penso. Agora a decisão é dela, e sua.”
- **oi**: “Chega devagar: eu carrego um bosque nas costas. Você é o que anda com os Corações. A Mãe Meganium te mandou pra me fazer mudar de ideia.” → oi2
- **oi2**: “Escuta. A Forja cava debaixo de nós, os humanos nos cortam, e a Corte vende o mapa de onde estamos. Mesmo assim damos sombra, fruta e remédio a todos. Faz cem anos que o Círculo cuida de quem o machuca.”
  - ▸ _E as aldeias que ficaram no sol?_ → aldeias
  - ▸ _Pra onde vocês vão?_ → norte
- **aldeias**: “Eu penso nelas a cada passo. Mas árvore morta não dá sombra pra ninguém. Se ficarmos, em dez anos não sobra bosque. Eu escolhi salvar o bosque.” [marca `ouviu-torterra`]
- **norte**: “Pra serra fria, onde a água nasce. Lá o machado não chega. Dizem também que é lá que mora quem está chamando os Corações. A Mãe não acredita. Eu acredito, e vou assim mesmo.” [marca `ouviu-torterra`]

#### Vento

Por onde a conversa começa (vale a primeira que bate):

- `bosque-ficou` → **preso**
- `cap6` → **depois**
- _sempre_ → **oi**

- **preso**: “Você nos prendeu aqui pelas raízes. Quando o bosque adoecer de vez, lembra que eu avisei.”
- **depois**: “Eu vou na frente, abrindo caminho. Não tenho mais nada pra te dizer.”
- **oi**: “Mais um forasteiro querendo convencer a Mãe a nos prender aqui. Todo mundo quer alguma coisa do bosque. É por isso que a gente vai embora.”

## Capítulo 7 · A Ponte Partida — Rio Grande

### Missões

- **A Ponte Partida**
  1. O vão do meio da ponte só se fecha com o que mora entre os pilares fora do caminho. A descida fica na margem, a leste da cabeceira.
  2. O vão fechou. Atravesse a ponte, passe pela vanguarda e encare quem comanda o bando de guerra, na outra margem.
  3. O bando perdeu o capitão. Decida o destino da ponte: a Lia quer mantê-la de pé; o Tomé, na outra margem, quer vê-la cair; e o Capataz da Forja oferece muralha e pedágio.
- **Carga parada**
  1. A caixa de remédios da Selma ficou na ponte, do lado de lá do vão. Leve de volta a ela, na cabeceira.
- **Quem atravessou sozinho** 🤫 _secreta_
  1. Um menino se esconde entre os pilares, com medo dos dois lados da ponte.

### Lugares

#### Cabeceira da Ponte

_Deste lado, quem guarda. Do outro, quem espera o vão fechar._

- 🚪 porta → Aldeia dos Tocos
- 🚪 porta → A Ponte Grande
- 🚪 porta → Entre os Pilares
- 🪧 “A trilha segue a margem rio abaixo, até onde o rio — dizem — acaba em sal. Mas a ponte ainda não tem destino.” _(se sem `cap7`)_
- 🚪 porta → Salina do Fim do Rio
- 🗣 Dona Selma, a curandeira
- 🗣 Lasca
- 🗣 Lia, a patrulheira
- 🗣 Capataz Metang
- 🗣 O Campeão _(se `campeao-respeito`)_
- 🗣 Bia _(se `bia-juntos`)_
- 🗣 Nico _(se `nico-ponte`)_
- 🗣 Vô Carvalho _(se `arvore-ponte` · sem `carvalho-deitou`)_

#### A Ponte Grande

_Tábua, corda e trinta anos de gente passando. No meio, falta um pedaço._

- 🚪 porta → Cabeceira da Ponte
- 🚪 porta → A Outra Margem
- 🪧 “A barricada da cabeceira: barris cheios de pedra. Alguém pintou neles, torto: “AQUI PASSA REMÉDIO”.”
- 🪧 “O vão do meio. As tábuas terminam em lascas, como osso quebrado. Lá embaixo, entre os pilares, alguma coisa grande se mexe na água.” _(se sem `venceu:alfa7` nem `carvalho-deitou`)_
- 👣 “O vão está fechado. Sob as patas, a madeira é nova de um lado e muito, muito velha do outro — e as duas aguentam. ⏎ Do lado de lá, alguém assobia. Viram você.” [marca `passou-vao` · “A Ponte Partida” → etapa 2] _(se sem `passou-vao`)_
- ⚔ luta (treinador, `venceu:vanguarda1`) — “Dois batedores do bando de guerra vigiam as tábuas, com cães de caça soltos. ⏎ — Olha o que vem vindo do lado dos bichos. Sozinho!”
- ⚔ luta (treinador, `venceu:vanguarda2`) — “A segunda linha do bando fecha a ponte de lado a lado. ⏎ — O primeiro posto deixou passar? Então sobra pra nós.”
- 📦 “Uma caixa de madeira amarrada com corda, largada na correria quando o vão abriu. Na tampa, a ferro quente: SELMA.” [ganha 🧰 Caixa de Remédios]

#### Entre os Pilares

_Debaixo da ponte, a água faz redemoinho em volta de pedra muito mais velha que ela._

- 🚪 porta → Cabeceira da Ponte
- 🗣 Nico _(se sem `nico-ponte`)_
- 📦 “Um caixote que caiu da ponte e encalhou entre as pedras. Estava indo pro reino — ou vindo.” [+₽700 · 1× Max Ether, 2× Hyper Potion]
- ⚔ luta (alfa, `venceu:alfa7`) — “Entre os pilares, onde a água faz redemoinho, o **Alfa do Rio** ergue a cabeça. Há lascas de tábua presas no dorso dele, das duas margens: ele quebra o que qualquer um constrói em cima da casa dele.”

#### A Outra Margem

_O acampamento do bando de guerra. Uma lança fincada no chão pra cada homem._

- 🚪 porta → A Ponte Grande
- ⚔ luta (treinador, `venceu:rufino`) — “No portão da paliçada, um homem de capuz vermelho-escuro afia uma lança sem olhar pra você. ⏎ — Um bicho atravessou a ponte sozinho. Ou é coragem, ou é recado. Tanto faz: os dois dão couro. Bando! Comigo!”
- 👣 “Com o capitão no chão, o bando não avança nem recua. Uns trinta homens parados, de lança na mão, olhando uns pros outros. Lá no fundo, do lado da fogueira, um velho de capuz que você conhece se levanta devagar.” [marca `viu-bando` · “A Ponte Partida” → etapa 3] _(se `venceu:rufino` · sem `viu-bando`)_
- 🗣 Tomé Fumeiro
- 🗣 Tico
- 🪧 “A fogueira do bando de guerra. Em volta dela, lanças fincadas no chão — uma pra cada homem. Algumas são pequenas demais pro dono.”
- 🪧 “Gaiolas novas, vazias, empilhadas até a altura de um homem. Ferro bom, sem emenda. Você já sabe de quem.”

### Personagens

#### Dona Selma, a curandeira

Por onde a conversa começa (vale a primeira que bate):

- “Carga parada” etapa 1 · com 🧰 Caixa de Remédios → **trouxe**
- “Carga parada” etapa 1 → **cade**
- “Carga parada” concluída → **depois**
- _sempre_ → **oi**

- **trouxe**: “É ela, e está inteira! Obrigada. Toma, fiz isto pra você.” [entrega 🧰 Caixa de Remédios · “Carga parada” → concluída · 🌿 +1 · 2× Full Restore, 2× Fruta Lum]
- **cade**: “A caixa está na ponte, depois do vão.”
  - ▸ _(Pedir um curativo — {custo}.)_ [descansa (cura)]
  - ▸ _Já volto._
- **depois**: “Senta, deixa eu ver essas patas. Você anda demais.”
  - ▸ _(Pedir um curativo — {custo}.)_ [descansa (cura)]
  - ▸ _Estou bem._
- **oi**: “Olha quem apareceu! Eu atravessei antes do vão abrir, com as minhas ervas e duas crianças. Do lado de lá eu tratava caçador. Aqui eu trato quem aparecer.” → oi2
- **oi2**: “Só que metade dos meus remédios ficou na ponte: uma caixa com o meu nome, do lado de lá do vão. Se você passar por ela, traz pra mim?”
  - ▸ _Eu trago._ [“Carga parada” → etapa 1] → vai
  - ▸ _(Pedir um curativo — {custo}.)_ [descansa (cura)]
  - ▸ _Agora não._
- **vai**: “Fica depois do vão, encostada no corrimão. E não cheira o vidro azul.”

#### Lasca

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **banca**

- **banca**: “Eu vendo pros dois lados da ponte. …O quê? Achou que eu ia ficar no charco?”
  - ▸ _🛒 Ver as mercadorias._ [abre a loja]
  - ▸ _Depois._

#### Lia, a patrulheira

Por onde a conversa começa (vale a primeira que bate):

- `ponte-de-pe` → **dPe**
- `ponte-caiu` → **dCaiu**
- `ponte-forja` → **dForja**
- “A Ponte Partida” etapa 3 → **decide**
- “A Ponte Partida” etapa 2 → **espera**
- “A Ponte Partida” etapa 1 → **vao**
- `lia-confia` → **amiga**
- _sempre_ → **oi**

- **dPe**: “Hoje passaram uma carroça de remédio e dois meninos fugidos. E um caçador, que eu mandei voltar.”
- **dCaiu**: “A ponte caiu. Eu fiquei deste lado, e a minha mãe mora do outro. …Não precisa ficar assim. Eu escolhi ficar aqui.”
- **dForja**: “Agora tem muralha e pedágio. Eu não pago: conheço uma passagem rasa, três léguas rio acima. Vou continuar soltando quem cai em laço, dos dois lados do muro.”
- **decide**: “Você voltou inteiro! E o Rufino? …Certo. Sem capitão, o bando não sabe o que fazer. É a nossa chance.” → decide2
- **decide2**: “Eu quero manter a ponte de pé, com guarda dos dois lados: eu, a Selma e quem mais quiser. Caçador vai continuar tentando passar, não vou mentir. Mas também passa quem cura, quem traz notícia, quem tem família do outro lado.”
  - ▸ _🌉 Defender a ponte, com a Lia._ [marca `cap7`, `ponte-de-pe`, `lia-confia` · “A Ponte Partida” → concluída · 🌿 +1 🌑 +1 · dom 🌉 Pilar da Ponte · 3× Fruta Sitrus, 1× Max Revive] → dPe1
  - ▸ _Vou ouvir os outros._
- **dPe1**: “Então a ponte fica, e eu fico nela. Obrigada por não me obrigar a escolher um lado.”
- **espera**: “O vão está fechado: agora dá pra atravessar. Do outro lado, quem manda no bando é um capitão chamado Rufino. Ele não negocia.”
- **vao**: “O Alfa do rio, entre os pilares. A descida fica na margem, a leste.”
- **amiga**: “{eu}! Que bom te ver. Faz nove noites que eu não durmo direito.” → fala
- **fala**: “Esta é a Ponte Grande. Do lado de lá fica o reino dos humanos; deste lado, vocês. Por ela passa remédio, notícia, gente como eu — e caçador também. Agora tem um bando de guerra acampado na outra margem, esperando o vão do meio ser consertado.” → fala2
- **fala2**: “Quem abriu o vão foi o Alfa do rio, que mora embaixo, entre os pilares. Ele derruba as tábuas de quem tenta passar, dos dois lados. Enquanto ele estiver lá, ninguém atravessa. Isso é ruim, mas também é o que está segurando o bando.”
  - ▸ _Eu desço lá._ [“A Ponte Partida” → etapa 1] → desce
  - ▸ _E se o vão ficar aberto?_ → aberto
- **desce**: “A descida fica na margem, a leste daqui: um buraco no barranco. Leva companhia. E, se puder, não mata o Alfa: ele já morava aqui antes da ponte.”
- **aberto**: “Aí a curandeira não passa, eu não passo, e quem tem alguém do outro lado não se vê mais. E o bando acha outro caminho em um mês. Só ganhamos tempo.”
  - ▸ _Eu desço lá._ [“A Ponte Partida” → etapa 1] → desce
  - ▸ _Deixa eu pensar._
- **oi**: “Você de novo. Eu sei que você não gosta de mim, e tudo bem. Mas preciso que me escute: esta ponte importa pros dois lados.” → fala

#### Capataz Metang

Por onde a conversa começa (vale a primeira que bate):

- `ponte-forja` → **dForja**
- `cap7` → **depois**
- “A Ponte Partida” etapa 3 → **oferta**
- _sempre_ → **oi**

- **dForja**: “Ontem passaram trinta. Vinte e nove pagaram. A moça da capa verde atravessou o rio a nado pra não pagar.”
- **depois**: “A Forja registra que a proposta foi recusada. Eu entendo os seus motivos.”
- **oferta**: “A proposta da Forja: muralha de pedra nas duas pontas, portão de ferro e pedágio. Só passa quem a gente deixar, e pagando. Caçador não passa. Curandeira passa, mas paga. Não é bonito, mas funciona.”
  - ▸ _⚒ Entregar a ponte à Forja._ [marca `cap7`, `ponte-forja` · “A Ponte Partida” → concluída · ⚒ +3 🌿 -1 🌑 -1 · +₽2500 · dom 🧾 Passe Livre] → dForja1
  - ▸ _Vou ouvir os outros._
- **dForja1**: “Fechado. A obra começa amanhã. Você tem passe livre pra sempre: fiz questão.”
- **oi**: “A Forja me mandou medir esta ponte. Ponte sem dono acaba sendo de quem chegar primeiro.”

#### O Campeão

Por onde a conversa começa (vale a primeira que bate):

- `cap7` → **depois**
- _sempre_ → **oi**

- **depois**: “A arena pediu pra eu voltar. Eu respondi que estou ocupado.”
- **oi**: “Eu disse que escolhia as minhas lutas. Esta eu escolhi: ninguém me paga e ninguém aplaude. Pela primeira vez eu sei por que estou lutando.”

#### Bia

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **oi**

- **oi**: “A gente veio ajudar. A Lã queria lutar por alguma coisa que não fosse dinheiro. E a nossa regra continua: eu paro a luta quando achar que passou do ponto.”

#### Nico

Por onde a conversa começa (vale a primeira que bate):

- `nico-ponte` → **ficou**
- “Quem atravessou sozinho” etapa 1 → **decide**
- _sempre_ → **achado**

- **ficou**: “A Lia me deu uma faca de cortar laço. Já achei três. Dois eram meus, de antes.”
- **decide**: “Estou com fome, com frio e com medo dos dois lados. O que eu faço?”
  - ▸ _(Empurrar o menino pra fora: a Lia está lá em cima.)_ [marca `nico-ponte` · “Quem atravessou sozinho” → concluída · 🌿 +1 · 2× Fruta Sitrus] → vai
  - ▸ _(Deixar ele onde está.)_
- **vai**: “Tá bom, eu vou falar com ela. Vou contar a verdade: que eu armava os laços e ela desarmava. Toma, é o pão que eu guardei pra você.”
- **achado**: “NÃO ME… ah, é você, o da estrada. Não conta pra ninguém que eu estou aqui. Nem pros de lá, nem pros de cá.” → achado2
- **achado2**: “Eu atravessei sozinho, antes do vão abrir. O Rufino passou no Vau juntando gente pra uma “grande caçada”, e o meu pai foi. Eu vim na frente pra avisar a moça da capa verde. Mas vi os Pokémon de guarda na ponte e fiquei com medo: eu já armei laço pra Pokémon.” [“Quem atravessou sozinho” → etapa 1] → decide

#### Vô Carvalho

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **oi**

- **oi**: “Cheguei. Demorou, mas cheguei. Onde fica o vão da ponte?”
  - ▸ _(Mostrar o vão do meio da ponte.)_ [marca `carvalho-deitou` · 🌿 +1] → deita
  - ▸ _Ainda não._
- **deita**: “É largo. Tudo bem, eu sou comprido. O Alfa lá de baixo não derruba árvore. Avisa a Mãe Meganium que agora eu sou ponte. Pode passar por cima de mim.”

#### Tomé Fumeiro

Por onde a conversa começa (vale a primeira que bate):

- `ponte-caiu` → **dCaiu**
- `cap7` → **depois**
- “A Ponte Partida” etapa 3 → **decide**
- `passo-peixe` → **peixe**
- `passo-fome` → **fome**
- _sempre_ → **fogo**

- **dCaiu**: “Sem a ponte, os rapazes voltaram a pescar. Reclamam, mas pescam. De noite eu olho pro outro lado e não vejo fogueira. Acho que isso é paz.”
- **depois**: “A ponte ficou. Então eu fico deste lado, de olho nos meus rapazes, pra eles não fazerem besteira.”
- **decide**: “O Rufino caiu. Agora os rapazes estão olhando pra mim, esperando ordem.” → decide2
- **decide2**: “Escuta um caçador velho. Enquanto essa ponte existir, alguém do meu lado vai atravessar pra caçar, e alguém do seu vai atravessar pra se vingar. Derruba a ponte. Meus netos crescem sem caçar Pokémon, e os seus crescem sem medo de gente. É a paz que eu posso oferecer.”
  - ▸ _🪓 Derrubar a ponte, com o Tomé._ [marca `cap7`, `ponte-caiu` · “A Ponte Partida” → concluída · 🌿 +2 ⚒ -1 · dom 🪓 Facão do Tomé · 2× Max Potion, 1× Faixa de Foco] → dCaiu1
  - ▸ _Vou ouvir os outros._
- **dCaiu1**: “Eu corto do meu lado e você do seu. …Pronto, caiu. Fica com o meu facão. Eu não vou mais precisar dele.”
- **peixe**: “Você! O dos peixes. Baixa a lança, Zeca, esse é amigo. Eu não vim com o bando: vim **atrás** dele. Metade destes rapazes eu ensinei a pescar. A outra metade o Rufino convenceu a voltar a caçar.”
- **fome**: “Você. …Trinta de nós subiram a serra. Vinte e oito desceram: duas crianças morreram de fome. Eu sigo o Rufino porque ele promete comida.”
- **fogo**: “Você. O que queimou o meu defumadouro. Eu disse que voltava com mais gente. Voltei.”

#### Tico

Por onde a conversa começa (vale a primeira que bate):

- `passo-fome` → **fome**
- _sempre_ → **oi**

- **fome**: “Você é o Pokémon da serra. …Minha prima Ana morreu na descida. O tio não fala dela. Eu falo, pra não esquecer.”
- **oi**: “Você é o Pokémon da serra! Eu lembro de você! O tio Tomé não me deixa ir com o bando. Acho que ele não quer que ninguém vá.”

## Capítulo 8 · O Deserto de Sal — Mar Seco

### Missões

- **O Deserto de Sal**
  1. Cruze a salina até a cidade branca, a leste.
  2. A Irmã Dalva copia os desenhos das paredes. O fim da história está no leito da Fonte Morta: a descida fica no meio da praça.
  3. Você viu os Primeiros Laços e entendeu a Cheia. A Irmã Dalva pode espalhar a história ou guardá-la — e há um Absol disposto a pagar por ela.
- **Um gole**
  1. Tire o bando de cima do poço doce da salina, a leste da tenda da caravana, e avise o Grão.
- **O último nó** 🤫 _secreta_
  1. Falta um nó — o que não é desenho. Alguém o guardou onde parede parece parede, no leito da Fonte Morta.

### Lugares

#### Salina do Fim do Rio

_O rio grande termina aqui: branco até onde a vista alcança._

- 🚪 porta → Cabeceira da Ponte
- 🚪 porta → Salmoura, a Cidade Branca
- 👣 “O rio grande não chega ao mar. Ele chega **aqui**: afina, some na areia, e depois dele é tudo branco. Sal até o horizonte, e no horizonte alguma coisa quadrada demais pra ser pedra. ⏎ Os dois Corações que você carregou puxavam pra cá. Depois daqui, puxam pra cima.” [marca `viu-sal` · “O Deserto de Sal” → etapa 1] _(se sem `viu-sal`)_
- 🗣 Dona Corcova
- 🗣 Grão
- 🪧 “O único poço doce da salina. A água fica lá embaixo, escura e fria. Em volta, pegadas de tudo o que tem sede.”
- ⚔ luta (bando, `venceu:salteadores`) — “Um bando deitou em cima do poço, de barriga cheia de água, e não pretende sair. Quem chega perto leva um aviso. Você chegou perto.”
- 📦 “Os restos de uma carroça de caravana, meio comidos de sal. Uma arca ficou fechada, porque sal emperra tranca.” [+₽350 · 2× Hyper Potion, 1× Repelente Total]

#### Salmoura, a Cidade Branca

_Uma cidade inteira de sal, sem ninguém. Nas paredes, alguém desenhou os dois lados juntos._

- 🪧 “Na parede, riscado no sal: uma mulher e um bicho de orelhas compridas, sentados. Entre os dois, um pano com um nó. Cada um segura uma ponta.”
- 🪧 “Outro desenho: uma fila de pares — gente e bicho — carregando potes na direção de uma fonte. Ninguém vai na frente de ninguém.”
- 🪧 “Aqui o desenho foi raspado a unha, com raiva. Sobrou a metade de baixo: patas e pés correndo pra lados opostos, e um nó partido no chão.”
- 🪧 “O último desenho da rua: uma criança humana dorme encostada num bicho grande. O nó está amarrado no pulso dela e na pata dele. Alguém — muito depois — desenhou em volta um círculo de água.”
- 🚪 porta → Salina do Fim do Rio
- 🚪 porta → A Fonte Morta
- 🪧 “Ao norte da cidade o sal vira cascalho, o cascalho vira encosta, e lá em cima a encosta é branca de outro jeito. Mas as paredes daqui ainda têm o que dizer.” _(se sem `cap8`)_
- 🚪 porta → Acampamento do Degelo
- 🗣 Irmã Dalva
- 🗣 O Zelador
- 🗣 Presságio
- 📦 “Uma arca de sal maciço. A tampa sai inteira, como uma laje.” [1× Full Restore, 2× Revive]

#### A Fonte Morta

_Aqui nascia água antes de qualquer reino ter nome. O que mora aqui agora guarda um vazio._

- 🚪 porta → Salmoura, a Cidade Branca
- 📦 “Uma bilha de barro lacrada com cera, no canto mais seco. Dentro não tem água: tem o que alguém achou que valia mais.” [+₽900 · 2× Max Potion, 1× Max Ether]
- 📦 “Atrás da parede que não era parede, um nicho do tamanho de um corpo deitado. Dentro, em cima do sal, um pano trançado em nó — duas pontas, gastas por mãos diferentes. Não esfarelou. Alguma coisa não deixou. ⏎ Você pega o **Nó de Pano**.” [ganha 🪢 Nó de Pano · “O último nó” → concluída]
- ⚔ luta (alfa, `venceu:alfa8`) — “No leito seco da Fonte, o **Alfa do Sal** dorme enrolado em volta de nada — do lugar onde um Coração ficava. Ele guarda um vazio há mais tempo do que qualquer reino existe. Você acaba de pisar no vazio dele.” _(se sem `venceu:alfa8`)_
- 📦 “Atrás de onde o Alfa dormia, a parede inteira é um desenho só, do chão ao teto. ⏎ Embaixo: gente e Pokémon lado a lado, cada par segurando as pontas de um nó de pano. No meio: os pares se soltando — uns puxam, outros são puxados. Em cima: vultos enormes em volta de uma nascente, e a água descendo por cima de tudo, de todos, dos dois. ⏎ A última figura é esta cidade. Vazia. A Cheia **já veio uma vez**.” [marca `viu-lacos` · “O Deserto de Sal” → etapa 3] _(se sem `viu-lacos`)_
- 🪧 “A parede dos Primeiros Laços. Em cima, a água. Embaixo, os nós.”

### Personagens

#### Dona Corcova

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **balcao**

- **balcao**: “Caravana da Corcova. Aqui é o único lugar com sombra até a cidade branca. Tem descanso, água e mercadoria.”
  - ▸ _🛏 Descansar ({custo})._ [descansa (cura)]
  - ▸ _🛒 Ver as mercadorias._ [abre a loja]
  - ▸ _Só passando._

#### Grão

Por onde a conversa começa (vale a primeira que bate):

- “Um gole” concluída → **grato**
- “Um gole” etapa 1 · `venceu:salteadores` → **livre**
- “Um gole” etapa 1 → **espera**
- _sempre_ → **pede**

- **grato**: “Eu cavei um buraco pra você dormir, se quiser. É pequeno, igual a mim.”
- **livre**: “ELES SAÍRAM! A caravana tem água de novo! A Dona Corcova até chorou. Toma, achei isto enterrado na areia. É seu.” [“Um gole” → concluída · 🌿 +1 · +₽500 · 2× Repelente Total, 1× Rare Candy]
- **espera**: “O bando ainda está no poço. Eu fico vigiando daqui.”
- **pede**: “Psiu. A caravana está quase sem água. O único poço de água doce fica ali, a leste, e um bando deitou em cima dele faz três dias. A Dona Corcova está racionando o que sobrou.”
  - ▸ _Eu tiro eles de lá._ [“Um gole” → etapa 1] → vai
  - ▸ _Boa sorte._
- **vai**: “O poço fica a leste da tenda. O bando é grande e bravo.”

#### Irmã Dalva

Por onde a conversa começa (vale a primeira que bate):

- `sal-contou` → **dContou**
- `sal-guardou` → **dGuardou**
- `sal-vendeu` → **dVendeu**
- “O Deserto de Sal” etapa 3 → **decide**
- “O Deserto de Sal” etapa 2 → **espera**
- _sempre_ → **oi**

- **dContou**: “Vinte e dois panos já saíram com as caravanas. Dizem que a Forja pendurou um na Bigorna-Mãe, e que no Círculo uma Mãe chorou ao ver.”
- **dGuardou**: “Às vezes eu quase conto pra alguém. Aí lembro do que combinamos e fico quieta.”
- **dVendeu**: “O Absol levou a história. Eu vi. Não vou te julgar: você conhece o seu povo melhor do que eu.”
- **decide**: “Você viu. Dá pra perceber pela sua cara. Me conta.” → decide2
- **decide2**: “(Você risca no sal, devagar: os Antigos. A Nascente. A água subindo. As aldeias embaixo dela.) ⏎ Uma enchente, de propósito, pra acabar com os humanos. E os Pokémon pequenos morrem junto. E isso já aconteceu uma vez: foi **isso** que matou esta Fonte.” → decide3
- **decide3**: “Essa história é sua: você decide. Eu posso copiar em trinta panos pra você levar às três ordens, porque desenho todo mundo entende. Ou a gente guarda segredo, pra não causar pânico. E tem um Absol ali fora oferecendo dinheiro por ela.”
  - ▸ _📜 Levar a história às três ordens._ [marca `cap8`, `sal-contou` · “O Deserto de Sal” → concluída · ⚒ +1 🌿 +1 🌑 +1 · dom 📜 Memória do Sal] → dContou1
  - ▸ _🤐 Guardar a história._ [marca `cap8`, `sal-guardou` · “O Deserto de Sal” → concluída · 🌿 +1 · dom 🤐 Silêncio de Sal · 1× Max Revive] → dGuardou1
  - ▸ _Ainda não sei._
- **dContou1**: “Vou desenhar os trinta panos. Leva este primeiro. Quem conhece esta história sabe onde bater.”
- **dGuardou1**: “Então fica entre nós. Toma: com isto você passa sem ser notado.”
- **espera**: “A descida fica no meio da praça, entre as pedras. Eu espero aqui.”
- **oi**: “Shh! …Ah, você não vai estragar nada, vai? Os bichos às vezes esfregam o focinho nas paredes, e o sal esfarela. Eu sou a Dalva. Copio estes desenhos há doze anos.” → oi2
- **oi2**: “Aqui existiu uma Fonte, e ela morreu há muito tempo. Sobrou esta cidade de sal. Nas paredes, gente e Pokémon aparecem **lado a lado**, sem coleira, com um pano amarrado entre os dois.”
  - ▸ _(Olhar o pano no desenho.)_ → pano
  - ▸ _(Olhar pra ela, desconfiado.)_ → desconfia
- **pano**: “É um nó. Cada um segurava uma ponta, e os dois apertavam juntos. Eu chamo de Primeiros Laços. Naquele tempo, laço era uma coisa que os **dois** faziam. Não sei quando virou prisão.” → pedido
- **pedido**: “O fim da história está lá embaixo, no leito da Fonte. Eu nunca desci: tem uma coisa grande morando no escuro. Você enxerga no escuro, e entende os desenhos do seu lado melhor do que eu. Desce, e depois me conta o que viu.” [“O Deserto de Sal” → etapa 2]
- **desconfia**: “Você tem razão de desconfiar. Eu venho do reino que faz bola, gaiola e arena. Quando eu era menina vi um desenho destes, e nunca mais consegui achar normal prender um Pokémon.” → pedido

#### O Zelador

Por onde a conversa começa (vale a primeira que bate):

- “O último nó” concluída → **fim**
- `viu-lacos` · 1ª conversa ou mais com O Zelador → **falta**
- 1ª conversa ou mais com O Zelador → **varre**
- _sempre_ → **oi**

- **fim**: “Você achou o nó. Então hoje eu posso descansar. Amanhã eu volto a varrer.”
- **falta**: “Você contou os nós na parede lá embaixo. Falta um: o de verdade, de pano. Eu escondi atrás de uma parede falsa, do lado do poço seco, a leste.” [“O último nó” → etapa 1]
- **varre**: “Fui feito por duas mãos: uma de gente e uma de Pokémon, as duas ao mesmo tempo. Nenhuma me mandou parar. Por isso eu continuo varrendo.”
- **oi**: “(O boneco de barro gira devagar e varre o sal da porta de uma casa vazia. Parece não ter notado você.)”

#### Presságio

Por onde a conversa começa (vale a primeira que bate):

- `sal-vendeu` → **dVendeu**
- `cap8` → **depois**
- “O Deserto de Sal” etapa 3 → **oferta**
- _sempre_ → **oi**

- **dVendeu**: “A Regente leu três vezes. Depois mandou construir barcos. Poucos.”
- **depois**: “Você não vendeu. Fico aliviado, sinceramente.”
- **oferta**: “Você desceu e viu. Então é verdade: a água vem de propósito.” → oferta2
- **oferta2**: “A Corte compra essa história, só pra ela, por ₽4.000. Assim a Regente é a única que sabe quando a Cheia vem, e pode vender lugar seguro a quem pagar. Eu não gosto da proposta. Só estou trazendo o recado.”
  - ▸ _🌑 Vender a história à Corte._ [marca `cap8`, `sal-vendeu` · “O Deserto de Sal” → concluída · 🌑 +3 ⚒ -1 🌿 -1 · +₽4000 · dom 🪙 Preço da Notícia] → dVendeu1
  - ▸ _Não._
- **dVendeu1**: “Feito. É a primeira má notícia minha que vale dinheiro. Não me sinto melhor por isso.”
- **oi**: “Você de novo. Lembra do pelo molhado? Eu vim descobrir de onde vem a água. As paredes desta cidade contam, mas eu não sei ler desenho.”

## Capítulo 9 · O Degelo — Serra do Degelo

### Missões

- **O Degelo**
  1. Fale com quem subiu até o Acampamento do Degelo — cada ordem armou a sua tenda — e volte ao Tio do Poço, no fogo do meio.
  2. Escolha quem lidera a subida: fale com quem você quer na ponta, ou diga ao Tio do Poço que sobe por conta própria.
  3. Atravesse a Geleira Rachada, ao norte do acampamento, e passe pelo que guarda a Garganta do Degelo.
- **Pegadas pequenas**
  1. O Pingo, um Cubchoo de nariz escorrendo, sumiu na Geleira Rachada. Ele gosta de gelo liso. Leve notícia à Dona Nevasca.
- **O que o gelo guardou** 🤫 _secreta_
  1. O Carteiro achou uma carta presa no gelo, perto de um arvoredo a oeste da trilha da geleira. Quem a escreveu não desceu.

### Lugares

#### Acampamento do Degelo

_Três tendas, três fogos, e um quarto no meio que não é de ninguém._

- 👣 “Na entrada do acampamento, um mensageiro com o martelo marcado no ombro para na sua frente. Não fala com você. Fala com o seu companheiro. ⏎ — A Ordem está chamando os dela. Quem ficar com quem nos prejudicou não entra mais em Ferro-Fundo. ⏎ Seu companheiro olha pra você por um tempo. Depois vai com o mensageiro.” [um aliado da ⚒ Ordem da Forja vai embora · marca `chamado-forja`] _(se ⚒ Ordem da Forja < 0 · com aliado da ⚒ Ordem da Forja · sem `chamado-forja`)_
- 👣 “Uma enviada do Círculo espera na beira da trilha. Ela não olha pra você: olha pro seu companheiro. ⏎ — O bosque está indo embora, e chama cada um dos seus. Quem não vier agora não acha mais o caminho. ⏎ Seu companheiro encosta em você, uma vez. Depois segue a enviada.” [um aliado da 🌿 Círculo do Bosque vai embora · marca `chamado-bosque`] _(se 🌿 Círculo do Bosque < 0 · com aliado da 🌿 Círculo do Bosque · sem `chamado-bosque`)_
- 👣 “Um cobrador da Corte sai de trás de uma tenda e barra o seu companheiro, não você. ⏎ — Você deve à Corte, e ela cobra de quem pode. Ou ele volta com a gente, ou a família dele paga. ⏎ Seu companheiro não discute. Olha pra você, pede desculpa do jeito dele, e vai.” [um aliado da 🌑 Corte do Abismo vai embora · marca `chamado-abismo`] _(se 🌑 Corte do Abismo < 0 · com aliado da 🌑 Corte do Abismo · sem `chamado-abismo`)_
- 🚪 porta → Salmoura, a Cidade Branca
- 🪧 “A trilha da geleira, ao norte. Ninguém sobe sem saber quem vai na frente — é a única regra em que as três ordens concordam.” _(se sem `subida`)_
- 🚪 porta → Geleira Rachada
- ⚔ luta (bando, `venceu:cobraForja`) — “A tenda da Forja está fechada. Na frente dela, três brutos com o martelo marcado no ombro te esperam de braços cruzados. ⏎ — A Ordem não manda conversar com quem a quebrou. Manda cobrar.” _(se ⚒ Ordem da Forja < 0)_
- 🗣 Brasa _(se ⚒ Ordem da Forja ≥ 0)_
- ⚔ luta (bando, `venceu:cobraBosque`) — “A tenda do Círculo está vazia. Em volta dela a neve se mexe: espinho, cipó e dente. ⏎ O bosque não esquece quem o prendeu, nem quem o vendeu.” _(se 🌿 Círculo do Bosque < 0)_
- 🗣 Mãe Meganium _(se 🌿 Círculo do Bosque ≥ 0)_
- ⚔ luta (bando, `venceu:cobraAbismo`) — “A tenda da Corte tem uma lamparina apagada na porta. Três sombras se soltam da lona. ⏎ — A Regente manda dizer que dívida com a Corte não prescreve.” _(se 🌑 Corte do Abismo < 0)_
- 🗣 Lasca _(se 🌑 Corte do Abismo ≥ 0)_
- 🗣 Tio do Poço
- 🗣 Dona Nevasca
- 🗣 Vó Mamute
- 🗣 Carteiro
- 🗣 Pingo _(se `achou-pingo`)_
- 🪧 “O fogo do meio. Três pedras de sentar em volta dele, e um Slowpoke que chegou ontem.”

#### Geleira Rachada

_O gelo estala de noite. De dia, escorre. Faz muito tempo que ele não fazia nenhum dos dois._

- 🚪 porta → Acampamento do Degelo
- 🚪 porta → Garganta do Degelo
- 🗣 Pingo _(se sem `achou-pingo`)_
- 📦 “Uma mochila de gente, congelada na neve. As alças foram cortadas a faca, com pressa.” [+₽800 · 2× Max Potion]
- 📦 “Atrás da árvore que não era árvore, o paredão de gelo é liso como vidro. Dentro dele, de pé, há dois vultos: um de gente, um de bicho. Entre os dois, um pano esticado — cada um segura uma ponta. ⏎ Não fugiam um do outro. Subiam **juntos**. Alguém já tentou chegar à Nascente assim, uma vez.” [marca `viu-par-gelo` · “O que o gelo guardou” → concluída]

#### Garganta do Degelo

_O único caminho pra cima. Alguma coisa aqui dentro está de sentinela._

- 🚪 porta → Geleira Rachada
- 🚪 porta → Limiar da Nascente
- 👣 “Do outro lado da garganta o ar muda. Não é mais frio: é **velho**. O chão desce, e lá embaixo, no meio do gelo, há um vale verde que não devia existir. ⏎ Os Corações que você carregou não puxam mais. Chegaram.” [marca `passou-garganta` · “O Degelo” → concluída] _(se sem `passou-garganta`)_
- 📦 “Um trenó de carga, abandonado na subida. Quem o puxava desistiu aqui — ou foi desistido.” [2× Full Restore, 1× Max Revive, 1× Max Ether]
- ⚔ luta (alfa, `venceu:alfa9`) — “A garganta estreita até caber um só. No meio dela, coberto de geada, o **Alfa do Degelo** não dorme: escuta. Atrás dele vem um som de água muito grande, muito longe. Ele está aqui pra que ninguém atrapalhe.”

### Personagens

#### Brasa

Por onde a conversa começa (vale a primeira que bate):

- `sobe-forja` → **lider**
- `subida` → **ficou**
- “O Degelo” etapa 2 → **oferta**
- _sempre_ → **oi**

- **lider**: “Eu vou na frente. A geleira fica ao norte. Vamos logo.”
- **ficou**: “Você não me escolheu. Tudo bem, eu subo atrás. Alguém vai ter que consertar o que quebrar.”
- **oferta**: “A proposta da Forja é simples: a gente sobe armado, chega à Nascente e **controla** ela. Cano, registro e guarda. Água pra todo mundo, na medida certa. Se os Antigos não gostarem, a gente trouxe corrente.”
  - ▸ _⚒ A Forja lidera a subida._ [marca `subida`, `sobe-forja`, `cap9` · “O Degelo” → etapa 3 · ⚒ +2 🌿 -1 🌑 -1 · dom ⚒ Ponta de Ferro] → lider1
  - ▸ _Vou ouvir os outros._
- **lider1**: “Certo. Eu vou na frente e você logo atrás. Se eu cair numa fenda, o martelo fica pra você.”
- **oi**: “Você chegou inteiro. A Forja me mandou porque acha que você me escuta. Senta perto do fogo do velho.”

#### Mãe Meganium

Por onde a conversa começa (vale a primeira que bate):

- `sobe-bosque` → **lider**
- `subida` → **ficou**
- “O Degelo” etapa 2 → **oferta**
- _sempre_ → **oi**

- **lider**: “A geleira fica ao norte. Eu vou na frente, abrindo o caminho.”
- **ficou**: “O Círculo não vai na frente. Então vamos atrás.”
- **oferta**: “O Círculo propõe não fazer nada: subir, pedir licença e deixar os Antigos terminarem. A Cheia acaba com o machado, o forno e a gaiola. Acaba com aldeias também, eu sei. Eu votei contra. Mas esta é a proposta do Círculo, e eu vim trazê-la.”
  - ▸ _🌿 O Círculo lidera a subida._ [marca `subida`, `sobe-bosque`, `cap9` · “O Degelo” → etapa 3 · 🌿 +2 ⚒ -1 🌑 -1 · dom 🌿 Seiva Fria] → lider1
  - ▸ _Vou ouvir os outros._
- **lider1**: “Então eu vou na frente. Se lá em cima você decidir diferente do Círculo, eu não vou te impedir.”
- **oi**: “Você veio. Aqui em cima não cresce nada, mas eu sinto raiz debaixo do gelo. É a Nascente. Tudo o que é verde começou nela.”

#### Lasca

Por onde a conversa começa (vale a primeira que bate):

- `sobe-abismo` → **lider**
- `subida` → **ficou**
- “O Degelo” etapa 2 → **oferta**
- _sempre_ → **oi**

- **lider**: “Eu vou na frente. A geleira fica ao norte. Não conta pra ninguém que eu estou com medo.”
- **ficou**: “Não fui escolhido. Tudo bem. Eu subo atrás, de olho em tudo.”
- **oferta**: “A proposta da Corte: os Antigos param, e os Corações voltam pra quem cuidava deles antes, que somos nós. A Corte passa a saber onde e quando a água nasce, e decide quem recebe. Cobrando, claro. Mas barato pros amigos.”
  - ▸ _🌑 A Corte lidera a subida._ [marca `subida`, `sobe-abismo`, `cap9` · “O Degelo” → etapa 3 · 🌑 +2 ⚒ -1 🌿 -1 · dom 🌑 Olho no Gelo] → lider1
  - ▸ _Vou ouvir os outros._
- **lider1**: “Sério? Eu, na frente? Tá bom. Eu enxergo no escuro e sei onde o gelo está fraco. Pisa onde eu pisar.”
- **oi**: “A Regente não sobe montanha, então mandou a mim. Ela disse que você me escuta. É a primeira vez que me mandam representar a Corte.”

#### Tio do Poço

Por onde a conversa começa (vale a primeira que bate):

- `subida` → **depois**
- `conselho-pleno` → **escolhe**
- “O Degelo” não recebida → **oi**
- ⚒ Ordem da Forja < 0 → **falta**
- 🌿 Círculo do Bosque < 0 → **falta**
- 🌑 Corte do Abismo < 0 → **falta**
- _sempre_ → **pleno**

- **depois**: “…A trilha da geleira fica ao norte. Eu fico cuidando do fogo até você voltar.”
- **escolhe**: “…As três continuam no mesmo fogo. Ninguém foi embora.” → escolha
- **escolha**: “Alguém tem que ir na frente, na geleira. Quem for na frente chega com você à Nascente, e vai falar junto com você lá em cima. Fala com quem você quer que lidere. Ou…”
  - ▸ _(Subir por conta própria.)_ [marca `subida`, `sobe-so`, `cap9` · “O Degelo” → etapa 3 · dom 🐾 Passo Próprio] → so
  - ▸ _Vou falar com eles._ [“O Degelo” → etapa 2]
- **so**: “…Sozinho. Eu também vim sozinho. Demora mais, mas chega. Vai.”
- **oi**: “…Ah. É você.” → oi2
- **oi2**: “Eu saí de Pedralume no mesmo dia que você. …Cheguei ontem. Vim devagar. Os Corações vieram todos pra cá, pra esta serra. Dá pra sentir no chão.” → oi3
- **oi3**: “As três ordens também vieram, cada uma por um lado. Cada uma acendeu o seu fogo. Eu acendi este, no meio, e sentei. Fala com quem veio. Depois volta aqui.” [“O Degelo” → etapa 1]
- **falta**: “…São três pedras de sentar, e uma está vazia. Uma das ordens não quer falar com você: mandou gente pra te cobrar. Sem as três, não tem conselho. Mas ainda dá pra subir.” → escolha
- **pleno**: “…Uma. Duas. Três. Vieram as três, no mesmo fogo.” → pleno2
- **pleno2**: “Fazia onze anos que isso não acontecia. Elas nem se olham, mas estão sentadas juntas. …Foi você que conseguiu isso, com tudo o que fez no caminho.” [marca `conselho-pleno`] → escolha

#### Dona Nevasca

Por onde a conversa começa (vale a primeira que bate):

- “Pegadas pequenas” concluída → **grata**
- “Pegadas pequenas” etapa 1 · `achou-pingo` → **voltou**
- “Pegadas pequenas” etapa 1 → **espera**
- _sempre_ → **pede**

- **grata**: “Agora ele só brinca onde eu consigo ver. Ele reclama, mas obedece.”
- **voltou**: “PINGO! Limpa esse nariz! ⏎ Obrigada. Toma: eu estava guardando pra uma emergência, e você resolveu a minha.” [“Pegadas pequenas” → concluída · 🌿 +1 · 2× Full Restore, 1× Max Revive]
- **espera**: “O Pingo deve estar perto de um lago congelado, na geleira.”
- **pede**: “Você vai subir a geleira? Meu filhote, o Pingo, saiu atrás de um floco de neve e não voltou. É um Cubchoo de nariz escorrendo. Eu não posso sair daqui: tenho mais dois pra cuidar.”
  - ▸ _Eu olho._ [“Pegadas pequenas” → etapa 1] → vai
  - ▸ _Não prometo._
- **vai**: “Ele gosta de escorregar. Deve estar perto de um lago congelado.”

#### Vó Mamute

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **balcao**

- **balcao**: “Deita aqui no meu pelo, que é quente. Cabe a comitiva inteira.”
  - ▸ _🛏 Descansar ({custo})._ [descansa (cura)]
  - ▸ _Só passando._

#### Carteiro

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **oi**

- **oi**: “Entrega! …Ah, é freguês. Eu sou o Carteiro: subo a serra com encomendas e vendo o que sobra. E tenho cartas pra você, de gente que você conheceu no caminho.”
  - ▸ _🛒 Ver as mercadorias._ [abre a loja]
  - ▸ _✉ Ler as cartas._ → cartas
  - ▸ _Depois._
- **cartas**: “Tenho várias. De onde você quer ler?”
  - ▸ _De Pedralume._ → cPedralume
  - ▸ _Da Serra do Fumo._ (se `passo-peixe`) → cSerraPeixe
  - ▸ _Da Serra do Fumo._ (se sem `passo-peixe`) → cSerra
  - ▸ _Do Vau das Moedas._ (se `vau-tirou`) → cVauTirou
  - ▸ _Do Vau das Moedas._ (se sem `vau-tirou`) → cVau
  - ▸ _De Ferro-Fundo._ → cFerro
  - ▸ _Da Aldeia dos Tocos._ → cTocos
  - ▸ _Da ponte._ (se `ponte-caiu`) → cPonteCaiu
  - ▸ _Da ponte._ (se sem `ponte-caiu`) → cPonte
  - ▸ _A que não tem dono._ (se “O que o gelo guardou” não recebida) → cGelo
  - ▸ _Chega de carta._
- **cPedralume**: ““Filho: a arruda pegou de novo. Não pisa quando voltar. E volta. — Vó Vileplume.”” → cartas
- **cSerraPeixe**: ““O peixe sobe a pedra todo dia. O homem do chapéu ensinou meu filhote a assobiar. Eu deixei. — Mãe Ursa.”” → cartas
- **cSerra**: ““O inverno passou, e estamos todos bem. — Mãe Ursa.”” → cartas
- **cVauTirou**: ““A arena virou celeiro. Dá menos moeda e mais pão. Eu ainda apago as tochas, por costume. — Baltazar.”” → cartas
- **cVau**: ““A arena continua cheia. Pintaram a sua cara no muro, do lado da do Campeão. Ficou torta. — Baltazar.”” → cartas
- **cFerro**: ““Os nove capacetes foram pra parede da Bigorna-Mãe. Todo mundo que passa tira o chapéu. — Tatu.”” → cartas
- **cTocos**: ““A praça já tem um pouco de sombra. O Brotinho senta embaixo e diz que é dele. — Roque.”” → cartas
- **cPonteCaiu**: ““Daqui não dá mais pra ver o outro lado. Sinto falta de lá. Mas estou bem. — Lia.”” → cartas
- **cPonte**: ““Hoje passou remédio. Ontem passou um caçador, e eu mandei voltar. — Lia.”” → cartas
- **cGelo**: “Esta eu não consigo entregar: não tem nome. Achei presa no gelo, perto de um arvoredo a oeste da trilha da geleira. A letra é de gente, e o selo é uma marca de pata.” [“O que o gelo guardou” → etapa 1] → cartas

#### Pingo

Por onde a conversa começa (vale a primeira que bate):

- `achou-pingo` → **casa**
- _sempre_ → **achado**

- **casa**: “A mãe disse que não é pra seguir floco grande. Mas era muito grande!”
- **achado**: “Eu achei o floco! Era enorme! Mas derreteu. …Você sabe o caminho de volta? Eu esqueci.”
  - ▸ _Vem comigo._ [marca `achou-pingo`] → vai
- **vai**: “Tá! Eu vou escorregando, que é mais rápido!”

## Capítulo 10 · A Nascente — Vale da Nascente

### Missões

- **A Nascente**
  1. Atravesse o Limiar: quem subiu com você espera perto da água. A gruta da Nascente fica ao norte.
  2. Faça os Antigos pararem. Depois, diga a eles o que a terra faz com a primeira fonte.

### Lugares

#### Limiar da Nascente

_Um vale verde no meio do gelo. Tudo o que vive começou aqui perto._

- 🚪 porta → Garganta do Degelo
- 🚪 porta → A Nascente
- 🗣 Dama Véu
- 🗣 Dona Chansey
- 🗣 Kecleon, o mercador
- 🗣 Lia, a patrulheira _(se `lia-confia`)_
- 🗣 Brasa _(se `sobe-forja`)_
- 🗣 Mãe Meganium _(se `sobe-bosque`)_
- 🗣 Lasca _(se `sobe-abismo`)_
- 🗣 Nico _(se `nico-ponte`)_
- 🗣 Bia _(se `bia-juntos`)_

#### A Nascente

_A primeira água. Quem a fecha é mais velho que qualquer nome._

- 🚪 porta → Limiar da Nascente
- 👣 “A gruta é maior por dentro do que a serra por fora. O gelo das paredes brilha por conta própria. E no fundo, onde a água cai sem fazer barulho, estão eles. ⏎ Nenhuma história que você ouviu no caminho chegava perto do tamanho.” [marca `viu-nascente` · “A Nascente” → etapa 2] _(se sem `viu-nascente`)_
- ⚔ luta (antigos, `venceu:antigos`) — “Diante da água que cai, vultos enormes fazem um círculo em volta da **Nascente**. Ela afina a cada instante. Os **Antigos** não se viram: você é pequeno demais pra interromper. ⏎ Só há um jeito de fazê-los parar pra ouvir.” _(se sem `venceu:antigos`)_
- 🗣 Os Antigos

### Personagens

#### Dama Véu

Por onde a conversa começa (vale a primeira que bate):

- “A Nascente” não recebida → **oi**
- _sempre_ → **conta**

- **oi**: “Você chegou. Olha em volta: é verde, no meio do gelo. É a Nascente que faz isso. Tudo o que vive começou aqui, e é aqui que os Antigos querem acabar com tudo.” → oi2
- **oi2**: “Eles estão lá dentro, fechando a fonte. Quando fecharem, a água vai se acumular atrás da serra, até a serra romper. Essa é a Cheia. Você não consegue matar os Antigos. Mas consegue fazer com que **parem** por um instante — e nesse instante eles escutam.” [“A Nascente” → etapa 1] → conta
- **conta**: “O que você pode dizer lá dentro depende do que trouxe. São quatro coisas: a confiança de uma humana, a Lia. O sino de Pedralume devolvido. As três ordens reunidas no mesmo fogo. E o nó de pano do deserto. Com as quatro, existe uma saída que ninguém tentou. Com menos, você ainda tem outras escolhas.”
  - ▸ _🪢 (Mostrar o nó de pano.)_ (se com 🪢 Nó de Pano) → temNo
  - ▸ _🔔 (Pensar no sino de Pedralume.)_ (se `sino-devolvido`) → temSino
  - ▸ _🔥 (Pensar no fogo do meio.)_ (se `conselho-pleno`) → temFogo
  - ▸ _🧣 (Pensar na Lia.)_ (se `lia-confia`) → temLia
  - ▸ _Entendi._
- **temNo**: “É o nó. Duas pontas iguais: nenhuma manda na outra.”
- **temSino**: “O sino voltou pra quem se lembrava dele. Isso conta.”
- **temFogo**: “As três ordens sentaram juntas, depois de onze anos. Eu estava lá e vi.”
- **temLia**: “A Lia subiu até aqui. Está ali, sem saber se pode entrar. Ela é importante.”

#### Dona Chansey

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **balcao**

- **balcao**: “Pousada do Sino, agora aqui em cima. Eu vim atrás do Tio do Poço, que esquece de comer. Ele parou no acampamento, e eu continuei. Aqui tem cama pra todo mundo.”
  - ▸ _🛏 Descansar ({custo})._ [descansa (cura)]
  - ▸ _Só passando._

#### Kecleon, o mercador

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **banca**

- **banca**: “O Kecleon vende de tudo, até aqui em cima! Quer ver?”
  - ▸ _🛒 Ver as mercadorias._ [abre a loja]
  - ▸ _Depois._

#### Lia, a patrulheira

Por onde a conversa começa (vale a primeira que bate):

- 1ª conversa ou mais com Lia, a patrulheira → **oi2**
- _sempre_ → **oi**

- **oi2**: “Eu não vou entrar com você: eles não querem ver gente. Mas lembra de uma coisa. Tem uma menina no Vau que para a luta quando acha que passou do ponto. Tem um caçador que trocou a gaiola pela pesca. A gente aprende. Devagar, mas aprende.”
- **oi**: “Eu sei que não devia estar aqui: isto é assunto de vocês. Mas se a água descer, cai em cima da minha gente também. Alguém do nosso lado tinha que subir pra pedir uma chance.”

#### Brasa

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **oi**

- **oi**: “A corrente está pronta. …Eu sei o que eu disse lá embaixo. Aqui em cima, ouvindo essa água, eu já não tenho tanta certeza. Entra. Se você disser “Forja” lá dentro, eu entro e prendo a Nascente. Se disser outra coisa, eu respeito.”

#### Mãe Meganium

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **oi**

- **oi**: “Eu senti a raiz do mundo durante toda a subida. Ela não está com raiva: está cansada. Entra. O que você decidir, o Círculo aceita. Foi isso que eu vim garantir.”

#### Lasca

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **oi**

- **oi**: “Cheguei na frente! Olhei pra dentro da gruta e voltei correndo: aquilo lá dentro é grande demais. Se você disser “Corte” lá dentro, eu assumo os Corações. Se disser outra coisa, eu invento uma desculpa pra Regente.”

#### Nico

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **oi**

- **oi**: “Eu subi com a Lia. Ela disse que não era lugar de criança, mas eu vim assim mesmo. Trouxe pão pra depois. Vai ter depois, né?”

#### Bia

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **oi**

- **oi**: “A Lã quis subir pra ver de onde vem a força dos Pokémon. Eu vim junto. A nossa regra continua valendo, e eu acho que ainda não é hora de parar. Vai lá.”

#### Os Antigos

Por onde a conversa começa (vale a primeira que bate):

- _sempre_ → **escutam**

- **escutam**: “(Eles pararam. A Nascente está em silêncio. Os Antigos não falam com palavras, mas você entende a pergunta, e ela pesa.) ⏎ _Pequeno. Você carregou os nossos pedaços por dez terras. Viu o que os humanos fazem com a água e com vocês. Nós íamos lavar tudo. Diga por que não._”
  - ▸ _🪢 (Estender o nó de pano: uma ponta pra vocês, outra pra eles.)_ (se `lia-confia` e `sino-devolvido` e `conselho-pleno` · com 🪢 Nó de Pano) → laco
  - ▸ _⚒ A Forja assenta a Nascente: água medida, pra todos._ (se `sobe-forja`) → cano
  - ▸ _🌑 A Corte volta a guardar os Corações._ (se `sobe-abismo`) → sombra
  - ▸ _🌿 O Círculo pede: terminem. Que o bosque volte._ (se `sobe-bosque`) → cheiaBosque
  - ▸ _🌊 (Não dizer nada. Deixar a água vir.)_ → cheia
- **laco**: “(Você põe o nó de pano no chão e segura uma ponta com os dentes. A outra fica solta, apontando pra entrada da gruta, onde a Lia espera.) ⏎ _Nós conhecemos isto. Fomos nós que ensinamos, antes da primeira Cheia. Achamos que os dois lados tinham esquecido._” → laco2
- **laco2**: “(Lá fora, um sino rachado toca. Uma vez só.) ⏎ _Um nó precisa de dois. Chame a humana. Se ela pegar a outra ponta, nós abrimos a fonte e ficamos olhando de perto._” → laco3
- **laco3**: “A Lia entra devagar, de mãos vazias. Olha pros Antigos, olha pra você, e pega a outra ponta. ⏎ A Nascente volta a correr. ⏎ Ninguém foi levado pela água, e ninguém foi acorrentado. Daqui a muitos anos, humanos e Pokémon vão andar juntos por escolha. Começou aqui — e foi um Pokémon quem propôs.” [“A Nascente” → concluída · marca `final-laco` · 🏁 **FINAL: 🪢 O Laço**]
- **cano**: “(Atrás de você, a Brasa bate o martelo três vezes na pedra. Os Antigos não reagem: só observam as correntes subindo.) ⏎ _Vocês preferem a água presa a ficar sem água. Nós entendemos a sede._” → cano2
- **cano2**: “A Nascente é presa em bronze. Canos levam água às dez terras: tem em toda praça, na medida certa, com um guarda da Forja em cada registro. Ninguém mais briga por um Coração. E ninguém mais bebe sem pedir. ⏎ Os Antigos dormem acorrentados no fundo da gruta.” [“A Nascente” → concluída · marca `final-cano` · 🏁 **FINAL: ⚒ O Cano**]
- **sombra**: “(As sombras da gruta crescem. O Lasca entra, pequeno e tremendo, com uma lamparina. Os Antigos olham pra ele por muito tempo.) ⏎ _Os que ficavam acordados. Nós lembramos de vocês. Foram os únicos que avisaram._” → sombra2
- **sombra2**: “Os Corações voltam aos seus lugares, e a Corte do Abismo volta a vigiá-los, como antes de ser expulsa. A água corre de novo. A Regente decide onde, quanto e quando. As aldeias que expulsaram a Corte agora precisam pedir água a ela. ⏎ Ela atende a todas. De algumas, cobra.” [“A Nascente” → concluída · marca `final-sombra` · 🏁 **FINAL: 🌑 A Sombra**]
- **cheiaBosque**: “(A Mãe Meganium entra e se curva. Não pede perdão: pede licença. Os Antigos voltam a olhar pra fonte.) ⏎ _O bosque pede o que nós íamos fazer. Então a água vai descer devagar nas encostas e depressa nos fornos._” → cheia2
- **cheia2**: “A Nascente se fecha. A água se acumula atrás da serra por três dias. No quarto dia, a serra rompe. ⏎ A Cheia leva os machados, os fornos, as gaiolas e a arena. Leva também Pedralume, a toca dos refugiados e a Aldeia dos Tocos. Quando a água baixa, o bosque é o primeiro a voltar. ⏎ O último desenho da parede de sal aconteceu de novo.” [“A Nascente” → concluída · marca `final-cheia` · 🏁 **FINAL: 🌊 A Cheia**]
- **cheia**: “(Você não diz nada. Talvez eles tenham razão. Os Antigos esperam mais um instante e voltam a olhar pra fonte.) ⏎ _Então será como decidimos. Procure um lugar alto, pequeno._” → cheia2

