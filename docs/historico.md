# Histórico: bugs investigados e corrigidos

Post-mortems tirados do `CLAUDE.md` em 29/09/2026 pra ele não ser carregado inteiro a cada sessão (eram ~50k
tokens). **A LIÇÃO de cada um continua resumida no CLAUDE.md**; aqui fica o caso completo — o relato do jogador, o
que foi descartado no diagnóstico e por quê. Vale ler antes de mexer na área correspondente: quase todo bug aqui
nasceu de uma falha SILENCIOSA, e o padrão se repete.

---

## ✅ CORRIGIDO (09/10/2026) — o 🤖 auto-explorar só via shiny no inimigo em FOCO

Pergunta do usuário, não relato: *"o explorar automático identifica quando tem um shiny em momentos que tem mais
de 1 pokemon oponente?"* — e a resposta era não. O laço (`auto.js`, dentro de `laco()`) lia `const E = G.B.enemy`
e decidia tudo sobre esse `E`: a parada por shiny e a parada pela espécie procurada.

`B.enemy` não é "o inimigo", é um **getter** que devolve `B.inimigos[B.foco]` (`estado.js`). Com grupo — 🐺 grupo
selvagem (hoje em todos os modos), treinador com 2 ou 3 em campo, ⚔ Saga — o shiny do slot que não está em foco
não existia pro laço. Ele só entraria em foco quando o focado caísse (`batalha.js`, o `B.foco` reposicionado
depois da queda), e até lá um golpe de área podia derrubá-lo: a caçada seguia em frente, sem log e sem contagem,
exatamente a falha silenciosa que a caça shiny não pode ter — 1 em 4096 perdido sem ninguém saber.

O conserto é varrer `inimigosEmCampo()` nas duas paradas em vez de olhar `E`. A função já existia e já exclui
quem tem `vol.retirado` (bola do treinador, revezamento), que é o comportamento certo aqui: quem saiu de campo
não corre risco de morrer no turno.

**Lição**: `B.enemy` é FOCO, não lado. Código que pergunta "existe alguém assim do lado de lá?" lê
`inimigosEmCampo()`; `B.enemy` serve só pra "contra quem eu bato agora". O mesmo vale pra qualquer varredura
futura no laço automático (status, item, forma).

---

## ✅ CORRIGIDO (03/10/2026) — as taxas da Pokédex da rota somavam 101,8% (relatos #74 e #75)

Relato: *"ao fazer a soma da % de aparição dos pokemon da rota da um total de 101,8%, acredito que essa % deveria
ficar menor do que 100% para ter uma pequena noção de % dos míticos"* (Estrada da Vitória, Gen 4) e, no dia
seguinte, o mesmo na Área de Sobrevivência, onde a soma fechava exatamente 100% — *"não deixando 'espaço' para a %
de aparição dos míticos"*. A conclusão do jogador era perfeitamente dedutível do que estava na tela: se o que ele
enxerga já ocupa todo o bolo, os três cartões ocultos (📦) nunca sairiam.

A conta nunca esteve errada. `taxaNaRota` divide o peso da espécie pela soma do pool **inteiro**, míticos
incluídos, e `sortearDaRota` sorteia sobre esse mesmo pool — na `s-vitoria` da Gen 4 os pesos são oito espécies
de `p: 2` (11,63% cada), um Magnezone de `p: 1` (5,81%) e Phione/Darkrai/Arceus de `p: 0.068` (0,40% cada), somando
100,0%. O defeito era só de TEXTO: `textoTaxa` fazia `Math.round` acima de 10%, e 11,63 virava "12%" — **oito
arredondamentos pra cima no mesmo bolso** criam 3 pontos percentuais do nada, mais do que os 1,2% que os míticos
ocupam de verdade.

Descartado no diagnóstico: "os míticos estão fora do sorteio" (estão dentro — `sortearDaRota` não filtra nada
além do cache quando offline) e "o pool da jornada é filtrado e as taxas são calculadas sobre o pool cheio"
(`rotaNaJornada` mexe só em níveis, nunca no `pool`). Conserto: `textoTaxa` trunca pra baixo em vez de arredondar,
com um epsilon contra o binário (`3.3 * 10` dá 32,999…, e truncar isso mostraria 3,2%). Um teste varre todas as
rotas de todas as Gens e falha se a soma dos textos passar de 100%.

**A lição:** arredondamento é individualmente correto e coletivamente mentiroso. Onde N números arredondados são
SOMADOS pelo leitor — e numa lista de porcentagens eles sempre são —, o erro não se cancela, se acumula na direção
de quem tem mais itens. Truncar perde até 0,1 por linha e nunca promete o que não existe; arredondar ganha até
0,05 por linha e promete. **Número que o jogador vai somar de cabeça, trunque.**

---

## ✅ CORRIGIDO (02/10/2026) — a batalha no celular deitado nascia na 4ª linha do grid

Relato: *"no momento que entrar em uma luta, a batalha tem que sempre estar visível na lateral, no momento eu
tenho que descer para ver onde está a batalha, muito estranho"*.

O código parecia certo: `body.em-batalha .scene.battle{grid-column:1;position:sticky;top:8px;height:calc(100vh - 16px)}`
no bloco de paisagem, exatamente a intenção descrita no comentário. O que faltava era **ordem de colocação**.
`#scene` é irmão das zonas (por causa do `.stage{display:contents}`) e não tinha linha definida; `#actions`
(`order:-2`) e `.zona[centro]` (`order:-1`) vinham ANTES dele na ordem modificada por `order`, ocupando a coluna 2.
O cursor de auto-colocação do grid **nunca anda pra trás** (CSS Grid §8.5: item com coluna definida MENOR que a do
cursor ⇒ incrementa a linha), então a cena era empurrada pra linha 4 — abaixo de golpes, painel central e zona
esquerda. E `position:sticky` não resgatava: sticky só desliza DENTRO da própria área de grid, que ali começava
já fora da tela.

Descartado no diagnóstico: "o `@media` não está pegando" (pegava — os sprites compactos do mesmo bloco apareciam)
e "é o `sticky` que não funciona" (funcionava, só não tinha pra onde). Conserto: a cena sai do grid (`position:fixed`
à esquerda) e o `.game` vira **uma coluna** com `padding-left` reservando o espaço. Item fora de fluxo não participa
do dimensionamento de linha nem da auto-colocação — some a classe inteira de bug.

**A lição:** `grid-column` posiciona na coluna, **não na linha**. Num grid de auto-colocação com `order`, quem define
só a coluna fica à mercê da ordem dos irmãos, e a linha é escolhida por um cursor que é de via única. Elemento que
precisa estar SEMPRE visível não deveria depender de onde a auto-colocação resolveu pôr a área dele: ou a área é
explícita nas duas direções, ou ele sai do fluxo.

---

## ✅ CORRIGIDO (30/09/2026) — quatro furos em cima de defesa que já existia

Não veio de relato de jogador: saiu do `/security-review` rodado como segunda opinião (2ª auditoria; os sete
achados estão em `docs/features.md`). Entra aqui porque o **padrão de diagnóstico** é reaproveitável, e é
contra-intuitivo: **quatro dos sete achados estavam dentro de código escrito justamente pra impedir aquilo.**

- `urlDeImagem` recusava a apóstrofe literal — e `&#39;` passava, porque o navegador decodifica entidade no
  atributo **antes** de compilar o `onerror`. O filtro olhava uma string que não era a que o JS ia receber.
- `htmlIcone` coagia o id remoto pra inteiro, **com um comentário explicando o ataque** — e `perfil-amigo.js`,
  dois arquivos ao lado, interpolava `poke_id` cru dentro de um `src`.
- `validar_jornada` recusava todo número impossível — menos o expoente, porque `greatest` é piso e ali fazia
  falta um teto.
- `mp-sanear` saneava todos os pacotes — e `consumirItensComuns` usava o pacote saneado como **autorização** pra
  apagar item da mochila, o que saneamento nunca prometeu.

**A lição, que é a mesma nos quatro:** o lugar mais perigoso não é o que não tem trava, é o que **tem** trava e
por isso ninguém olha mais. Uma defesa é correta só em relação a uma pergunta específica — "este texto tem
apóstrofe?", "este pacote é bem-formado?" — e o bug mora na distância entre essa pergunta e a que importava
("o JS vai receber uma apóstrofe?", "este pacote é verdadeiro?"). Ao revisar área protegida, **escreva numa frase
o que a defesa garante e compare com o que o call site precisa**; se as duas frases não forem a mesma, o furo
está aí.

Um quinto caso, do mesmo sabor, no próprio teste: `tests/schema.test.js` fatiava `validar_jornada` com
`indexOf`, então bastava uma migration nova redefinindo a função pra ele passar conferindo a versão VELHA — o
teste que existe pra travar a fórmula daria o conserto por feito sem ele estar valendo. **Teste sobre estado
acumulado de migrations tem de olhar a ÚLTIMA definição** (`lastIndexOf`), e é bom ele falhar alto se a âncora
sumir, em vez de comparar silenciosamente contra string vazia.

---

## ✅ CORRIGIDO (30/09/2026) — a habilidade da forma Mega nunca disparava

Dois relatos no mesmo dia, do mesmo jogador com o mesmo Charizard: **#72** "ao mega evoluir o charizard não esta
fazendo o sol aparecer em campo" e **#71** "enquanto o campo esta com sunny day o ataque solar beam não ataca no
mesmo turno, ele fica como carregando". Pareciam dois bugs; eram um.

**Causa raiz**: `aoEntrarEmCampo` (golpe.js) — o único lugar que dispara Intimidate, Drought, Download, Trace e
companhia — só era chamado no **começo da batalha** (`batalha.intimidar`, `mp-motor` no turno 1). `megaevoluir`
troca `M.ability` pela habilidade da forma e não avisava ninguém. Como nos jogos a Mega "entra em campo" naquele
instante, nada da habilidade nova valia: Mega Charizard Y sem sol, Mega Abomasnow sem neve, Mega Mawile sem
intimidar. A habilidade só teria efeito se a luta tivesse COMEÇADO com ela — o que nunca acontece, porque a
Mega é sempre uma troca no meio da batalha.

**O #71 era consequência, não bug.** `golpe.js` já pula o turno de carga do Solar Beam no sol (`solNaCara`), e
`tests/clima.test.js` provava isso desde antes. O jogador tinha o Mega Charizard Y e assumiu (com razão) que o
campo estava ao sol. Lição: **dois relatos que se explicam pelo mesmo estado ausente provavelmente são um**;
antes de caçar o segundo, confirmar se o primeiro não é a causa dele.

**Corrigido** chamando `aoEntrarEmCampo` com o Pokémon que acabou de virar, nos três pontos onde uma forma Mega
nasce: `usarMega`, `megaInimigo` (batalha.js) e `aplicarGimmicksMP` (mp-motor.js, que virou `async` por isso).
Tera e Dynamax ficaram de fora **de propósito**: nenhum dos dois troca a habilidade.

---

## ✅ CORRIGIDO (30/09/2026) — a busca de desbloqueados na criação não filtrava nada

Relato **#73**: "a aba de procurar um pokemon especifico para começar a jornada não funciona, ao digitar o nome ou
numero do pokemon, nada acontece". O campo aceitava texto e a lista ficava idêntica.

**Causa raiz**: CSS, não JavaScript. `ligarBuscaDesbloqueados` (criacao.js) filtra ligando `b.hidden = true` em
cada botão — o jeito certo, sem redesenhar e sem perder o foco do campo. Mas `[hidden]{display:none}` mora na
**folha do navegador**, e `.pick{…display:grid…}` é regra de AUTOR: autor ganha de UA sempre, então o atributo
`hidden` era aplicado e ignorado. O contador de "achou" funcionava, o `#busca-vazia` aparecia na hora certa, e a
grade continuava inteira na tela.

**Corrigido** com uma linha global no topo do CSS: `[hidden]{display:none!important}` (o que o normalize.css faz
há anos, pelo mesmo motivo). Vale pra todo `hidden` do projeto, presente e futuro — o conserto local (uma classe
`.escondido` só pra `.pick`) deixaria a próxima lista com `display` de autor quebrada do mesmo jeito.

**Lição**: `el.hidden = true` não é garantia de nada enquanto o elemento tiver `display` vindo do CSS do projeto.
Quando "o JS roda e a tela não muda", desconfiar da cascata antes de reescrever o handler.

---

## ✅ CORRIGIDO (29/09/2026) — o botão da 🎯 Caça Shiny não fazia nada

Relatado **duas vezes** (relatos #63 em 26/09 e #67 em 28/09), com print: "apareceu o botão de caçada shiny,
pedindo para selecionar um pokemon, porém nada acontece ao clicar". A caixa desenhava certo (9/9 revelados,
os 9 botões de espécie ali), e clicar não mudava nada.

**A primeira tentativa de correção foi um diagnóstico errado, e por isso o relato voltou.** Em 27/09 (`95e3fbe`)
uma reprodução em jsdom concluiu que o clique "sempre atualizou o estado e o DOM corretamente" e que o problema
era só falta de feedback visível — foi adicionado um `toast`. O relato #67 chegou no dia seguinte, com o jogo já
atualizado. O que aquela reprodução fez foi disparar o clique num botão montado à mão e conferir o handler de
perto; nunca chegou a **desenhar a tela do jogo inteira e clicar no botão de verdade**. Lição: reprodução que
não passa pelo caminho completo do jogador pode "passar" e confirmar a hipótese errada.

**Causa raiz**: `main.js`, no `case 'caca'`, chamava `zone()` — e **`main.js` nunca importou `zone`** de
`estado.js`. Todo clique estourava `ReferenceError: zone is not defined` na primeira linha do case, antes de
gravar a escolha. O `log`/`toast` de confirmação vinham depois, então nem o "fix" de 27/09 aparecia.

**Por que era invisível**: o handler de clique é `async`. Um `throw` lá dentro não vira erro de JavaScript na
página — vira uma **promise rejeitada que ninguém pega**. Sem mensagem na tela, sem linha no console: o botão
apenas não faz nada. É a mesma família de falha silenciosa do resto deste arquivo.

**Por que o teste não pegou**: `tests/referencias.test.js` tem justamente a regra "ajudante exportado por outro
módulo e chamado aqui tem de estar importado", e ela cobria este caso. Mas o ajudante `declarados()` considerava
declarado **qualquer identificador que recebe valor**, com a regex `([A-Za-z_$][\w$]*)\s*=`, sem distinguir nome
de **propriedade**. Em `main.js` existe `G.S.zone = v` (o botão de trocar de rota) — o `zone` daquela linha é uma
propriedade, mas o teste leu como declaração e liberou o arquivo inteiro. A regex agora exige `(^|[^.\w$])`
antes do nome. Com isso o teste acusa o bug sozinho, e continua sem nenhum falso positivo na árvore de hoje.

**Corrigido em 3 camadas**: (1) o import que faltava; (2) a regra do teste, que estava furada; (3) o handler de
clique agora é `aoClicar(e).catch(avisarErro)` — qualquer ação que falhe mostra o erro num toast em vez de
sumir. A terceira é a que importa a longo prazo: sem ela, o próximo import esquecido também vira "clico e não
acontece nada".

---

### ✅ CORRIGIDO (27/09/2026) — shiny do jogador não desbloqueava o início-shiny da espécie
Relato real: jogador começou (ou recrutou) um Weedle shiny, evoluiu pra Kakuna e depois Beedrill, e nenhuma das
três espécies desbloqueou "✨ Começar shiny" (`criacao.opcaoShiny`) em jornadas futuras. Causa: `registrar(S,
'shiniesAmigos', …)` só era chamado ao recrutar um ALIADO selvagem shiny (`amizade.js`) e no caso especial do
Shedinja (`progressao.js` `casulo()`) — nunca pro PRÓPRIO Pokémon do jogador, nem no início da jornada nem na
evolução normal.

**Correção pra frente** (dois pontos): `criacao.iniciarJornada` registra `shiniesAmigos` pra `especieInicial` se
`mon.shiny`; `progressao.evolve()` registra `shiniesAmigos` pra `data.speciesName` quando `M.shiny` (vale pro
jogador E pro aliado, já que `evolve()` atende os dois — por isso um aliado shiny que evolui também passa a
desbloquear a forma nova). Achado JUNTO no processo: a cópia de `registro` que sobrevive na carreira
(`regras.estatisticasDaJornada`) era uma LISTA BRANCA que não incluía `shiniesAmigos` — só o TOTAL agregado
sobrevivia (`shiniesAmigos: soma(...)`), o mapa por espécie sumia pra sempre ao terminar a jornada. Corrigido
juntando `shiniesAmigos: r.shiniesAmigos || {}` na lista branca.

**Correção retroativa** (quem já passou por isso antes da correção, como o relato acima):
- `regras.caminhoNaArvore(node, nome)` + `regras.especiesShinyDoJogador(S)` (puras, testadas em `regras.test.js`):
  com a árvore de evolução carregada (`S.meta.evo`), devolve TODA espécie no caminho de `especieInicial` até a
  atual; sem a árvore (evoPendente/offline), melhor esforço com só as duas pontas.
- `estado.migrarShiniesAmigos(S)`: credita (idempotente, `||=` — nunca soma de novo, então pode rodar toda vez
  sem inflar o número mostrado na Carreira) a espécie do jogador (via `especiesShinyDoJogador`) e a de cada
  aliado shiny (só a espécie atual dele — não tem `especieInicial` guardado por aliado, então não dá pra andar
  a árvore retroativamente pra ele). Chamada em `main.abrirJornada`, uma vez a cada jornada aberta.
- `carreira.retroativoShinyDaJornada(j)` (pura, testada): pra jornadas JÁ TERMINADAS (carreira, onde o mapa por
  espécie nunca existiu por causa do bug da lista branca), melhor esforço recalculado a cada leitura de
  `carregarCarreira()` — credita `especie` (inicial) e `especieFinal` quando `j.shiny`. Formas intermediárias de
  jornada já terminada não dá pra recuperar (não dá pra saber por qual Pokémon elas passaram — `registro.evolucoes`
  mistura jogador e aliados), mas o caso mais comum (a run em andamento, como a do relato) é coberto pela árvore.

### Investigado (27/09/2026) — Pedra Mega sumida da loja e confusão no desbloqueio do Roguelike
Relato: conta "Berga" bateu 1.249 abates como Mewtwo (Mega conquistada, confirmado "conquistado" na tela de
Conquistas) e mesmo assim a Pedra Mega não apareceu na loja jogando como Mewtwo numa run nova. **Consultado
direto no banco** (service role key, `ferramentas/.relatos-admin.env` — mesmo padrão do `relatos-admin.mjs`) e
simulada a lógica REAL do jogo (`gimmicksNaLoja`/`conquistasDaConta`) com o `progresso`/`jornadas` de verdade
daquela conta: **o cálculo dá `mega: true` corretamente** quando alimentado com os dados certos — não é bug de
fórmula. A explicação mais provável é um problema pontual do lado do cliente (sincronização que não tinha
"assentado" no `localStorage` no momento exato em que ele conferiu a loja logo após vencer). **Fragilidade real
corrigida de qualquer forma**: `render.js` envolvia Mega+Z+Vínculo numa única `try/catch` — uma exceção em
QUALQUER uma das três apagava as TRÊS da loja em silêncio (só `console.warn`, invisível pra quem joga).
`carreira.gimmicksNaLoja` agora isola cada gimmick no próprio try/catch (`seguro(fn)`), então um problema
pontual numa não derruba as outras duas.

**Voltou a acontecer no mesmo dia, com Mega E Z-Move os dois sumidos** — a primeira correção não bastava:
`gimmicksNaLoja` calculava `p` (a consulta de `conquistasDaConta`, que passa por `atualizarProgresso`/`bancar`,
progresso-conta.js) FORA do `seguro()` de cada gimmick — uma falha ali acontece ANTES de qualquer isolamento e
derruba as três de novo, sem log específico algum. **Segunda camada**: `gimmicksNaLoja` agora tenta o progresso
PERSISTENTE primeiro e, se falhar, cai pro cálculo DIRETO das jornadas da carreira (`conquistas.progressoConquistas`
sem `prontos`, que soma `registro.abates` de cada jornada na hora, sem passar pelo "livro-caixa" de
`progresso-conta.js`) — perde o "nunca encolhe" entre jornadas apagadas, mas mostra a Mega de verdade em vez de
nada. `tests/carreira.test.js` (`gimmicksNaLoja: Mega conquistada…`) trava o caminho normal. **Causa raiz exata
ainda não confirmada** (a simulação com os dados reais do Berga não reproduziu nenhuma exceção) — se sumir nesse
navegador de novo mesmo com as duas camadas, o próximo passo é pegar o texto do erro no console dele na hora
(agora tem `console.error` em dois pontos: `'gimmicksNaLoja: progresso permanente...'` e `'gimmicksNaLoja'`).

Segundo relato da mesma conta ("matei 10 de quase tudo e não libera pra jogar"): **não é bug**. Conferido nos
dados reais: a maioria das espécies de Gen 1 JÁ está liberada (10+ abates); várias outras estão em 8–9, faltando
mesmo 1–2. E o caso do Rhydon (print: "derrotou 12" na Pokédex, mas não desbloqueado): a Pokédex mostra o total
da CARREIRA INTEIRA (qualquer dificuldade), mas o desbloqueio do Roguelike só conta abate **em jornada
Roguelike** — dos 12 Rhydon, só 7 vieram de jornadas Roguelike (5 vieram do modo Difícil). Isso é intencional
("não dá pra farmar fora do Roguelike"), mas a UI não deixava claro o porquê do número não bater. **Corrigido**:
`tela-pokedex.js` (`htmlRoguelike`, usa `roguelike.progressoRoguelike`/`textoProgresso`) agora mostra, na ficha de
cada espécie, o progresso ESPECÍFICO do Roguelike separado do total ("Pro Roguelike: 7/10 derrotas" ou "🔓
Desbloqueado..."), então a conta fica clara na hora, sem precisar ir a outra tela.


---

### ✅ CORRIGIDO (28/09/2026) — jornada terminada sem entrar no Hall da Fama
Relato real: jogador ("Berga") fez uma run Roguelike de Mudkip até nível 66, desmaiou, e o Pokémon não apareceu
no Hall da Fama (Arena do Chefe). Hipótese inicial do usuário (uma jornada de Swampert no modo Difícil "roubando"
o lugar por ter nível maior) **descartada por auditoria de código**: cada entrada do Hall usa o ID da JORNADA
como chave (nunca colide entre jornadas diferentes), e `hall.entraNoHall` só aceita dificuldade com
`eventoSemanal: true` — só Roguelike e Hardcore; "Difícil" (`hard`) nunca entra, não importa o nível.
**Confirmado direto no banco** (service role key, mesmo padrão de `ferramentas/relatos-admin.mjs`): a jornada de
Mudkip está certinha na carreira (tabela `jornadas`, dificuldade roguelike, nível 66), mas ausente do
`progresso.dados.hall` daquela conta — 10 entradas no Hall, nenhuma dela. Auditando `hall.js`/`progresso-conta.js`/
`carreira.js`/`nuvem.js` por inteiro: a lógica de registro, poda (`podarHall`) e fusão local↔nuvem
(`mesclarProgresso`, união por chave, nunca remove) está correta — não achei bug reproduzível nelas.

**Causa mais provável**: `registrarNoHallDaConta` grava no `localStorage` NA HORA (síncrono, sempre funciona),
mas o envio pra nuvem depois (`encerrarJornada` → `sincronizar()`) era um fire-and-forget de UMA tentativa só,
e `sincronizar()` **engole a própria falha** (vira `nuvem.status`/`nuvem.erro`, nunca lança uma exceção) — uma
rede instável bem na tela de Game Over (comum: o jogador fecha o app logo depois de perder no Roguelike) não
tinha segunda chance. Esse é o mesmo tipo de janela que motivou o `pendente`/retentativa que o SAVE já tinha;
o Hall/progresso não tinha o equivalente.

**Corrigido pra frente**: `nuvem.sincronizarComRetentativa(tentativas=3)` tenta de novo (400ms, 800ms — mesmo
espaçamento de `api.getJSON`) e liga `progressoPendente` (mesmo padrão do `pendente` do save) até confirmar;
`visibilitychange`/`pagehide` agora tentam mais uma vez se ainda estiver pendente ao esconder/fechar a aba —
exatamente como já acontecia com o save. Trocado em TODO lugar que sincroniza depois de um momento que grava
progresso permanente: fim de jornada (`fim.encerrarJornada`), vitória na Arena (`arena.finalizar`) e vitória do
chefe em co-op (`multiplayer`, `aplicarCoop`'s finalizar de evento). **Limite honesto**: se o fechamento do
app for tão rápido que nem a PRIMEIRA tentativa termina, ou se o armazenamento local for perdido (cache limpo,
app reinstalado, trocou de aparelho) antes de qualquer sincronização bem-sucedida, não tem como recuperar — o
dado local é a única fonte, a nuvem é cópia.

**Correção retroativa pra este caso específico**: a jornada dele tinha ido pra carreira mas não guarda IVs/EVs/
moveset exatos (isso só existe na run em andamento, já apagada) — reconstruí a entrada do Hall usando o
CÓDIGO real do jogo (`hall.entradaDoHall`/`registrarNoHall`, não JSON escrito à mão) com os dados reais que
sobreviveram (espécie final Swampert, nível 66, apelido "Poteto", Roguelike, data) e um "melhor esforço" honesto
pro que se perdeu: moveset = os 4 golpes com mais abates no registro real da run (`registro.abates.golpe`, dado
de verdade daquela run), IVs neutros (15) e natureza neutra (hardy) por não fingir precisão que não existe.
Gravado direto na tabela `progresso` da conta dele — na próxima sincronização o Hall aparece no aparelho dele.


---

- **✅ CORRIGIDO (29/09/2026) — Hall da Fama no multiplayer: o bug era um `ReferenceError` mudo.**
  Relato real, repetido SEIS vezes pelo usuário: "pra iniciar uma run multiplayer ainda preciso escolher um
  Pokémon inicial de nível baixo; onde eu escolho os do meu Hall da Fama?". **A causa raiz não era falta de
  recurso** — a ☄ Sala de Raide já fazia isso desde 28/09. Era um bug: `htmlRaideSelecao` usava **`SPR_SHINY`
  sem importar** em multiplayer.js. Como a chamada está dentro de um ternário
  (`${e.shiny ? SPR_SHINY(e.id) : SPR(e.id)}`), só estourava pra quem tivesse **um shiny no Hall** — que é o caso
  dele. E o estrago era invisível: `renderSala` escreve `#mp-topo` e DEPOIS `#mp-acoes`, então o cabeçalho já
  trocava pra "Sala de Raide" e o `#mp-acoes` ficava com o **HTML VELHO do Co-op**. A tela contava duas histórias
  ao mesmo tempo (foi assim que o print do usuário denunciou: cartão de membro com "⏳ escolhendo…", que só existe
  no modo raide, ao lado de "3 (com aliados)"/"Balancear níveis", que só existem fora dele). Reproduzido em jsdom
  antes e depois: HEAD dá `ReferenceError: SPR_SHINY is not defined`, a versão corrigida desenha o Hall inteiro.
  Três consertos, além do import:
  - **`renderSala` virou um try/catch** (`desenharSala` faz o trabalho): erro ao desenhar agora aparece NA TELA e
    no console, em vez de deixar meia tela velha. Mesma lição já anotada pro `gimmicksNaLoja` (carreira.js):
    falha silenciosa em render vira diagnóstico errado e semanas de relato perdido.
  - **`tests/referencias.test.js` ganhou um segundo teste** que pega essa classe de bug: nome que COMEÇA COM
    MAIÚSCULA e está COLADO no `(`, varrendo o arquivo inteiro. O teste antigo só olhava a chamada colada no
    `${`, então não via `SPR_SHINY` no meio do ternário. Tentei generalizar o teste antigo pra varrer a
    interpolação inteira e **não deu**: prosa em português dentro do HTML ("Termine (ou encerre)", "Desafiar o
    Alfa (") vira falso positivo. A regra de maiúscula+colado separa os dois casos com ZERO exceção no código de
    hoje (toda a família `SPR`/`SPR_SHINY`/`ITEM_SPR`/`TYPE_PT` é assim; prosa sempre tem espaço antes do `(`).
  - **`resumoCfg`** (cabeçalho da sala) só sabia "PvP ou não", então anunciava a Sala de Raide como

---

## ✅ CORRIGIDO (29/09/2026) — quem hospedava a sala travava depois da primeira rodada

Relato com dois prints: numa Sala de Raide com 3 Pokémon do Hall, o jogador atacou uma vez e não conseguiu mais
escolher golpe; os turnos passavam sozinhos e o chefe batia. A tela dizia **"Escolhas enviadas"** enquanto o
cabeçalho, logo acima, dizia **"esperando: Xongod"** — a mesma tela se contradizendo. Ao sair e entrar de novo,
a luta nova já aparecia travada **no turno 1**.

**Causa raiz**: `aoReceberEstado` decidia "é turno novo?" comparando `sala.batalha.turno` com o turno da foto que
chegou. Mas `resolver()` faz `sala.batalha = estado` ANTES de `publicarEstado`, e `publicarEstado` termina
chamando `aoReceberEstado(p)` (o broadcast não volta pra quem enviou). No **anfitrião**, então, `sala.batalha`
já era o turno novo quando a comparação rodava: davam iguais, `sala.escolhidos` nunca era limpo, e
`minhaVez()` — que pula quem está em `escolhidos` — não achava mais nenhum Pokémon. Daí "Escolhas enviadas"
(nenhuma vez) ao lado de "esperando: Xongod" (o anfitrião ainda quer as ações). Os turnos continuavam porque o
prazo de 45 s caía no `autoCompletar`. Na luta seguinte dava no mesmo já no turno 1, porque as escolhas velhas
seguiam lá (`const luta = !sala.batalha` tinha o MESMO defeito, então os contadores de consumo também não
zeravam). **Convidado nunca foi afetado**: pra ele o estado chega pela rede com o `sala.batalha` ainda no turno
anterior.

**Não era regressão** das levas de travas/IA/saída de campo: a comparação vinha de um commit bem anterior
(`git log -S`). Passou despercebida porque quem hospeda e joga sozinho é o caso que mais expõe o defeito.

**Correção**: a decisão passou a ter memória própria (`sala.turnoVisto`, escrita SÓ por `aoReceberEstado`) e a
regra virou pura, em `mp-motor.leituraDoEstado(turnoVisto, turno)` — testável sem DOM e igual pros dois lados.
`turnoVisto` volta a `null` em `aoReceberFim`, então o turno 1 da luta seguinte conta como novo. Detalhe que
custou uma segunda rodada: **na primeira foto de uma luta não se limpa** — a lista já nasce vazia e limpar ali
apagaria a escolha recém-feita (num convidado, isso abriria brecha pra escolher duas vezes se chegasse um pulso
ainda sem a ação dele).

**Como foi verificado**: harness em jsdom montando a sala de Raide do relato (3 Swampert do Hall, chefe
Eternatus, anfitrião sozinho) e escolhendo golpe em sequência. Antes: `após A2 → vez=(nenhuma),
escolhidos=[A0,A1,A2], turno=2` e a tela em "Escolhas enviadas". Depois: escolhe os 3 a cada turno, por 3 turnos
seguidos. O segundo print (luta nova após derrota) foi reproduzido chamando o `aoReceberFim` de verdade: antes
travava no turno 1, agora a vez volta pra A0. Regressão travada em `tests/mp-motor.test.js`.
