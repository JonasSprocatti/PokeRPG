# Histórico: bugs investigados e corrigidos

Post-mortems tirados do `CLAUDE.md` em 29/09/2026 pra ele não ser carregado inteiro a cada sessão (eram ~50k
tokens). **A LIÇÃO de cada um continua resumida no CLAUDE.md**; aqui fica o caso completo — o relato do jogador, o
que foi descartado no diagnóstico e por quê. Vale ler antes de mexer na área correspondente: quase todo bug aqui
nasceu de uma falha SILENCIOSA, e o padrão se repete.

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
