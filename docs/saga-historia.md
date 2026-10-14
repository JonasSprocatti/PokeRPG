# ⚔ Saga — a história em 10 capítulos (roteiro, escrito em 13/10/2026)

O "molde" da aventura. **O roteiro completo, fala por fala, é `docs/saga-roteiro.md`** — gerado do conteúdo por
`ferramentas/gerar-roteiro-saga.mjs` (`tests/saga-roteiro.test.js` cobra que esteja em dia). **Os dez capítulos estão jogáveis** (`js/dados-saga-mundo.js`), com os quatro finais. Este
arquivo é o roteiro de onde eles saíram, com uma linha **No jogo** em cada capítulo dizendo o que virou mapa,
marca e personagem — e onde o jogo se afastou do papel. Tudo pode ser reescrito pelo 🌍 Editor de mundo; o
roteiro existe pra que quem mexer num capítulo saiba de onde a história vem e pra onde vai.

## As regras da escrita (valem pra capítulo novo)

1. **Um capítulo = uma rota da Gen.** Capítulo 1 é a 1ª rota, capítulo 10 é a rota final — a dos lendários. É o que
   faz a história inteira caber numa jornada, em qualquer uma das 9 Gens.
2. **A história nunca cita a espécie de um inimigo.** Quem é o Alfa (e quem são os lendários) depende da Gen. O
   texto diz "o Alfa do Passo", "os Antigos". NPC tem espécie fixa, porque NPC é só a figura.
3. **Cinza com coração.** Ninguém é vilão puro; toda escolha custa algo a alguém que tinha razão em parte. Mas os
   personagens têm calor e humor — a Vó que grita antes de olhar, o Lasca que nunca viu nada.
4. **Consequência é porta fechada, não ponto.** Uma escolha fecha uma conversa pra sempre, muda como te recebem
   dois capítulos depois, tira um final da mesa.
5. **Todo capítulo tem**: uma vila ou acampamento (onde se conversa), um ermo (mato alto), uma toca ou ruína (o
   chefe), uma missão principal com escolha, uma lateral, e **uma secreta** que nenhuma placa anuncia.
6. **Fala curta e direta** (pedido do usuário, 13/10/2026: "mais realista e menos enrolado"). O personagem diz o
   que aconteceu, o que quer e pra onde ir, como gente fala. Uma ideia por frase. Nada de aforismo pra fechar a
   fala, metáfora em cima de metáfora ou charada no lugar de instrução. O jeito de cada um aparece numa palavra,
   não num parágrafo.

## O mundo

A terra vive das **Fontes**. Cada região tem a sua, e no leito de cada uma dorme um **Coração** — uma pedra morna
que mantém a água subindo. Três ordens de Pokémon cuidavam das Fontes juntas:

- ⚒ a **Ordem da Forja** (Aço, Rocha, Fogo) — quer a água em cano, medida, garantida. Protege, e cobra.
- 🌿 o **Círculo do Bosque** (Planta, Inseto, Fada) — quer a água onde ela sempre correu. Cuida, e abandona quem
  não cabe no cuidado.
- 🌑 a **Corte do Abismo** (Sombrio, Fantasma, Veneno) — eram os **guardiões originais** dos Corações. Sabe, e
  vende o que sabe.

Há onze anos as três se separaram. A Corte avisou que os Corações estavam se soltando; ninguém quis ouvir, e ela
foi expulsa como "coisa ruim da estrada" (é o sino calado de Pedralume). Desde então os Corações saem do leito,
um por um.

E há os **humanos**, o quarto lado, que não é uma ordem. Chegaram pelo litoral há duas gerações e sobem os rios.
Não escutam as Fontes. Entre eles há:

- os **Fumeiros** — caçadores que comem Pokémon. Não por gosto: uma praga matou os rebanhos deles, e há um
  acampamento inteiro com fome atrás de cada lança;
- os **Laçadores** — crianças que pegam Pokémon em laços e bolas pra lutar nas arenas por moedas. Umas são
  cruéis sem saber; outras amam o parceiro mais que a própria família;
- e gente que **cuida**: a patrulheira que corta laços de madrugada, a curandeira que trata dos dois lados, os
  que guardam a Ponte.

**A verdade (revelada aos poucos, só no capítulo 8 inteira):** os Corações são lascas da **Nascente**, a primeira
fonte, no fim do mundo. Quem os chama de volta são os **Antigos** (os lendários da região — nunca nomeados). Eles
decidiram **fechar a Nascente e soltar a Cheia**: lavar a terra dos humanos. A Cheia leva junto as aldeias dos
pequenos. Os Antigos sabem. Acham que vale.

**Você** é um Pokémon de fora, que chegou a Pedralume com sede. Por não ser de lado nenhum, todo mundo te pede
pra carregar o que ninguém quer disputar.

## Quem volta de capítulo em capítulo

| Quem | O que é | Onde volta |
|---|---|---|
| **Lasca** (Sableye) | atravessador da Corte. Nunca viu nada, sempre tem uma oferta. | 1, 2, 3, 4, 7, 9 |
| **Dama Véu** (Mismagius) | memória da Corte, aprendiz do último sineiro | 1, 4, 10 |
| **Brasa** (Magmar) | ferreira de Pedralume; sobe na Ordem conforme você a ajuda | 1, 5, 9 |
| **Mãe Meganium** | voz do Círculo no vale; a única que duvida da retirada | 1, 6, 9 |
| **Lia** (humana) | patrulheira. Corta laços, solta quem foi pego, não entrega os seus. | 1, 2, 3, 7, 10 |
| **Tomé Fumeiro** (humano) | chefe dos caçadores. Cansado, não cruel. | 2, 7 |
| **Nico** e **Bia** (humanos) | dois Laçadores: ele quer ser campeão; ela começa a duvidar. | 1, 3, 7, 10 |
| **o Campeão** (Machamp) | lutador da arena que NÃO quer ser solto | 3, 7 |

## Os capítulos

### 1 · A Fonte Calada — Vale do Orvalho · rota 1 · ✅ jogável
A fonte de Pedralume secou. Forja e Círculo se acusam; ninguém subiu até as ruínas. Lá, o Alfa fez ninho em cima
do Coração solto — o encaixe está rachado por raiz de um lado e por picareta do outro.
**Escolha:** o Coração vai pra Forja (água em cano, bosque com sede), pro Círculo (água fina, fornos apagados) ou —
só pra quem achou o segredo — pra Corte (a aldeia fica seca "mais um tempo").
**Lateral:** os canteiros da Vó · a marca do martelo (o minério, que dá pra vender ao Lasca e perder a Forja).
**Secreta:** *O que o poço lembra* — falar três vezes com o Tio do Poço, a árvore que não é árvore, o sino rachado.
**Humanos:** os primeiros laços de arame na Estrada Velha; **Nico**, o menino que tenta te pegar; **Lia**, que
desfaz os laços dele.
**Gancho:** o Coração, onde quer que fique, **puxa pro norte**.
**Tutorial (14/10/2026):** o capítulo 1 também ensina a jogar, sempre por gente da aldeia e em fala direta. O
**Pichu** fica ao lado da chegada (andar até encostar = conversar, o letreiro abre o mapa, o 📖 é o diário,
onde ficam pousada, loja e Ancião). O **Cabo Lairon** dá a lateral *A lição do Cabo*: explica bando, Guarda e
Ruína, manda lutar com os **brigões** da praça (`venceu:treino`) e, na volta, ensina Perícia e petisco e dá 2
Mel Silvestre (`treino-fim`). Um gatilho na entrada do bosque (`viu-mato`) avisa que o mato alto chama luta.

### 2 · O Passo dos Laços — Serra do Fumo · rota 2 · ✅ jogável
O Passo do Norte está tomado pelo acampamento dos Fumeiros. Uma toca de refugiados se esconde na encosta. O Alfa
do Passo, com uma lança quebrada no flanco, ataca tudo o que se mexe — bicho ou gente.
**Escolha:** queimar o defumadouro (os caçadores vão embora com fome, e voltam com mais gente), esvaziar a
despensa deles com o Lasca (as crianças do acampamento pagam), ou — pelo caminho mais longo — levar o Tomé até a
subida dos peixes, que só existe se o Alfa for acalmado em vez de derrubado.
**Lateral:** as gaiolas (soltar quem está preso; um deles não quer sair) · a erva da curandeira.
**Secreta:** *A lança* — a lança no flanco do Alfa não é dos Fumeiros. É da Forja.
**Gancho:** o rastro de quem compra o que os Fumeiros caçam leva rio abaixo, até uma cidade.

### 3 · A Cidade das Arenas — Vau das Moedas · rota 3 · ✅ jogável
A primeira cidade humana. Crianças fazem Pokémon lutar por moedas, e a cidade inteira come disso. A arena foi
erguida em cima de uma Fonte: o segundo Coração está no alicerce, e é ele que deixa as lutas "boas". No porão, a
**Fera** — o Alfa da região — presa pra abrir os dias de festa.
**Escolha:** tirar o Coração (a arena acaba, e a cidade murcha), deixar (a cidade vive, a arena também), ou
entregar a uma ordem. E o **Campeão**: um Machamp alimentado e aplaudido que não quer liberdade nenhuma.
**Lateral:** a Bia e o parceiro dela (ajudar os dois a decidir — juntos ou separados) · as apostas do Lasca.
**Secreta:** *Quem vende o ferro* — as grades do porão têm a marca do martelo.
**Gancho:** o segundo Coração também puxa. Dois pontos fazem uma linha: ela aponta pro Charco.

### 4 · O Charco dos Esquecidos — rota 4 · ✅ jogável
A Corte do Abismo, escondida no pântano. Pela primeira vez alguém conta o lado dela: avisaram, foram expulsos, e
guardaram os Corações que conseguiram. A **Regente** quer o livro-caixa da Forja — a prova de que a Ordem vende
lascas de Coração aos humanos.
**Escolha:** roubar o livro (a Forja se parte em duas), entregá-lo à Brasa (ela limpa a casa por dentro, devagar),
ou queimá-lo (ninguém ganha a arma). **Secreta:** o sineiro não morreu de abandono. Ele foi o primeiro a ouvir os
Antigos.
**No jogo:** Brejal das Tábuas · Corte Submersa · Galeria do Dique · Palafita do Sineiro (atrás de uma árvore
falsa). Marcas `charco-corte` / `charco-brasa` / `charco-cinza`; a secreta liga `ouviu-antigos`. A Brasa não está
no charco: quem leva o livro a ela é a **Dona Chaveira**, que guarda a Casa de Contas. Lateral: a pedra de
nascença do Lasca. Há um comprador humano no dique (o Capitão Aurélio) — é ele quem diz que a conta das lascas
subiu "pra guerra".

### 5 · Ferro-Fundo — as minas da Forja · rota 5 · ✅ jogável
A fortaleza da Ordem. Os fornos queimam lascas de Coração; os mineiros pequenos estão em greve. O Mestre-Forjador
não é corrupto: ele arma a Ordem porque acha que a guerra com os humanos já começou.
**Escolha:** ficar com os mineiros (a Forja para, e fica indefesa), com o Mestre (as armas saem, e são boas), ou
derrubar a galeria das lascas (ninguém mais queima Coração — nem pra se defender). **Secreta:** um humano
trabalha na mina por vontade própria, e é o melhor ferreiro dali.
**No jogo:** Ladeira das Escórias · Ferro-Fundo · Galeria das Lascas · Oficina Atrás da Parede (parede falsa).
Marcas `ferro-greve` / `ferro-armas` / `ferro-ruiu`. Cada saída tem o seu dono: Tatu, o Mestre e a **Brasa**
(que fecha a porta pra quem vendeu o minério no capítulo 1). O humano é o Odilon, e foi ele quem forjou a lança
do capítulo 2 e as grades do 3 sem saber pra onde iam (`odilon-fala`). Lateral: o Faísca, que desceu "pra
buscar os nove".

### 6 · O Bosque que Anda — rota 6 · ✅ jogável
O Círculo decidiu se retirar: as árvores estão indo embora, e as aldeias que viviam da sombra delas ficam pra
trás. A Mãe Meganium é a única que vota contra.
**Escolha:** deixar o bosque partir (o Círculo sobrevive inteiro, os de baixo não), segurá-lo com as raízes do
Coração (ele fica, e adoece), ou dividi-lo (metade fica, metade vai — e o Círculo racha). **Secreta:** uma árvore
velha quer ficar e virar ponte.
**No jogo:** Aldeia dos Tocos · A Marcha · Clareira das Mães. Marcas `bosque-partiu` / `bosque-ficou` /
`bosque-rachou`. Quem carrega a decisão é o **Pai Torterra** (o bosque anda nas costas dele); o Alfa é o Pastor,
que toca as árvores pra frente. A secreta liga `arvore-ponte`, e o capítulo 7 a lê. Há humanos dos dois jeitos:
os rapazes que cortam as que ficam pra trás, e o Seu Bento, que planta duas pra cada uma.

### 7 · A Ponte Partida — rota 7 · ✅ jogável
A grande ponte entre as terras dos Pokémon e o reino humano. De um lado, o bando de guerra dos Fumeiros; do
outro, quem a guarda — Lia, a curandeira, e, dependendo de você, o Campeão.
**Escolha:** defender a ponte (os dois lados continuam se encontrando, pra bem e pra mal), derrubá-la (paz por
uma geração, e quem tem parceiro do outro lado não se vê mais), ou entregá-la à Forja (pedágio e muralha).
**Aqui o Tomé volta** — do jeito que você o deixou no capítulo 2. **Secreta:** o Nico atravessou sozinho.
**No jogo:** Cabeceira da Ponte · A Ponte Grande · Entre os Pilares · A Outra Margem. Marcas `ponte-de-pe` /
`ponte-caiu` / `ponte-forja`. O vão do meio fecha de dois jeitos: vencendo o Alfa do rio, ou deixando o Vô
Carvalho se deitar (`carvalho-deitou`, só pra quem fez a secreta do 6). Quem propõe derrubar é o próprio Tomé —
"uma geração de paz por ignorância". O Nico está atrás de uma parede falsa, entre os pilares (`nico-ponte`).

### 8 · O Deserto de Sal — rota 8 · ✅ jogável
Um mar seco. Aqui uma Fonte morreu há muito tempo, e dá pra ver o que sobra: uma cidade de sal, sem ninguém.
Nas paredes, desenhos de humanos e Pokémon lado a lado — **os Primeiros Laços**, de quando o laço era um nó de
pano que os dois amarravam, não uma bola. É aqui que se entende a Cheia.
**Escolha:** levar a história pras três ordens (só adianta com quem ainda te ouve), guardá-la, ou vendê-la à Corte.
**Secreta:** o último nó de pano, intacto — é a chave do final verdadeiro.
**No jogo:** Salina do Fim do Rio · Salmoura, a Cidade Branca · A Fonte Morta. Marcas `sal-contou` /
`sal-guardou` / `sal-vendeu`. Quem lê as paredes é a **Irmã Dalva**, humana; quem compra a história é o
Presságio (o Absol arauto da Corte, que já aparecia no capítulo 4 acordando com o pelo molhado). O nó de pano
(item `no`) fica atrás de uma parede falsa, e a pista é do Zelador, um boneco de barro "feito por duas mãos".

### 9 · O Degelo — rota 9 · ✅ jogável
Todos os Corações convergem pra serra gelada. As ordens que ainda falam com você fazem conselho; as que você
feriu mandam cobrar. É o capítulo em que a reputação vira gente: quem aparece do seu lado, quem fecha o caminho,
qual companheiro vai embora.
**Escolha:** quem lidera a subida — e, portanto, quem chega à Nascente com você.
**No jogo:** Acampamento do Degelo · Geleira Rachada · Garganta do Degelo. Marcas `sobe-forja` / `sobe-bosque` /
`sobe-abismo` / `sobe-so`. Ordem com reputação abaixo de zero não manda ninguém conversar: manda **cobrar** (uma
luta no lugar da tenda). Com as três presentes, o Tio do Poço — que saiu de Pedralume no mesmo dia que você e
chegou ontem — liga `conselho-pleno`. O Carteiro entrega cartas dos capítulos anteriores. **O companheiro que
vai embora**: na entrada do acampamento, a ordem ferida chama de volta quem anda com você e é dela (pelo tipo).

### 10 · A Nascente — rota final · ✅ jogável
Os Antigos estão fechando a primeira fonte. A luta final é contra eles (os lendários da Gen, um por vez).
Vencê-los não os mata: faz com que **escutem**. O que você diz depende de tudo o que carregou até ali.
**No jogo:** Limiar da Nascente · A Nascente. Quem liderou a subida espera no Limiar; a Lia, o Nico e a Bia
também, conforme as marcas. A Dama Véu conta as "quatro coisas" e mostra quais você trouxe.

## Os finais

| Final | Como se chega | O que acontece |
|---|---|---|
| 🌊 **A Cheia** | sempre disponível (calar), ou o Círculo liderando a subida (`sobe-bosque`) | A terra é lavada. Os humanos somem; metade das aldeias também. O bosque volta. |
| ⚒ **O Cano** | a Forja liderou a subida (`sobe-forja`) | A Nascente é canalizada, os Antigos acorrentados. Água pra todos, com preço e com guarda. |
| 🌑 **A Sombra** | a Corte liderou a subida (`sobe-abismo`) | A Corte volta a guardar os Corações — e passa a decidir quem bebe. |
| 🪢 **O Laço** *(verdadeiro)* | a patrulheira do seu lado (`lia-confia`), o sino de Pedralume devolvido (`sino-devolvido`), o nó de pano do capítulo 8 (item `no`) e as três ordens no mesmo fogo (`conselho-pleno`: **nenhuma** abaixo de zero no capítulo 9) | Pokémon e humanos se amarram por escolha. É o começo do mundo em que um humano e um Pokémon andam juntos — só que aqui foi o Pokémon quem propôs. |

No papel os finais saíam de "maioria das escolhas"; no jogo saem de **quem lidera a subida** (uma escolha só,
no capítulo 9, que já exige reputação). É mais fácil de entender jogando — e o final verdadeiro continua pedindo
a história inteira, porque a reputação do capítulo 9 é a soma de tudo.

## O que o save carrega de um capítulo pro outro

- **Reputação** das três ordens (`S.saga.rep`): muda quem te recebe e fecha finais.
- **Marcas de escolha** — uma por capítulo, sempre com o mesmo formato: `fim-forja` / `fim-bosque` / `fim-abismo`
  no 1; `passo-fogo` / `passo-fome` / `passo-peixe` no 2; `vau-tirou` / `vau-deixou` / `vau-ordem` no 3; do 4 ao 9,
  as que estão na linha **No jogo** de cada capítulo. Capítulo novo inventa as suas e LÊ as anteriores nas falas.
- **Marcas de capítulo fechado**: `cap1` … `cap9`. É o que abre a porta pro capítulo seguinte.
- **Marcas de gente**: `lia-confia`, `sino-devolvido`, `bia-juntos`, `campeao-respeito`, `nico-ponte`,
  `tome-deve` / `tome-jurou`, `arvore-ponte`, `conselho-pleno`. As quatro que o final verdadeiro confere são
  `lia-confia`, `sino-devolvido`, `conselho-pleno` e o item `no`.
- **Dons**: um por final de capítulo. Os dois de batalha entram em `regras.multSaga`; dom novo com efeito em luta
  é código, dom "de história" (só abre conversa) é dado.
