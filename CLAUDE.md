# PokéRPG

RPG de texto no navegador em que **você é o Pokémon** (sem treinador, sem captura). **Não é mais protótipo** (pedido do usuário): nada de "protótipo" em texto de UI; efeito que ainda não existe (golpe/habilidade sem efeito) diz "será ajustado em atualizações futuras". Dados ao vivo da PokéAPI; fórmulas dos jogos (stats, IV/EV, natureza, dano, tipos, estágios, status, XP, evolução). JavaScript puro em ES modules, sem build, sem dependências. Save no `localStorage` (`pokerpg-save-v1`). PT-BR na UI, comentários e nomes novos (identificadores herdados do protótipo seguem em inglês).

## Como rodar

Precisa de servidor HTTP (ES modules não carregam por `file://` — o `index.html` mostra um aviso nesse caso):

```
python -m http.server 3000   # na raiz do projeto → http://localhost:3000
```

Duas máquinas de dev, ambientes diferentes:
- **Windows**: usar PowerShell, não Bash (o Bash embutido falha no fork). **Não há Node instalado** — não tentar rodar `node`; os testes rodam no CI.
- **Raspberry Pi (Linux/aarch64)**: Node e npm instalados (`node --test` roda a suíte inteira localmente, sem depender do CI) e Bash normal. O binário de Python é `python3`, não `python` (usar `python3 -m http.server 3000`).

## Estrutura

| Arquivo | Papel |
|---|---|
| `index.html` | Esqueleto: header (`#topr` + `#conta-chip`), `#app`, aviso de `file://`, carrega `js/main.js`, registra `sw.js`. |
| `sw.js` | Service worker do modo offline (ver "Modo offline"). |
| `README.md` | Página do projeto (o que tem + próximos passos). **Atualizar a cada funcionalidade nova.** |
| `css/estilo.css` | Todo o CSS. |
| `img/` | `logo.png` (topo), `favicon-32.png`, `icone-192.png` (favicon / atalho no celular). |
| `js/main.js` | Ponto de entrada: listeners delegados (`data-act`/`data-v`) e `boot()` (carrega save ou abre criação). |
| `js/estado.js` | `G` = estado mutável compartilhado (`S` save, `B` batalha, `PV` prévia, `mode`, `busy`, `panel`), `zone()`, `nm()`, `save()`. |
| `js/util.js` | `rand`/`pick`/`clamp`/`sleep`/`fmt`/`esc`/`lastSeg`/`store`. Sem DOM. |
| `js/dados.js` | Tabelas fixas: tipos (`CHART`, `TYPE_PT`, `TC`), `NATURES`, `ITEMS`, `ZONES` (= rotas de `dados-mapas.js`), `FLAVOR`, `MISSOES`, `DIFICULDADES`… Sem DOM. `ITEM_SPR(n)` monta a URL do sprite do item; vários itens de Gen 8/9 (Coroa Galárica, Armadura Auspiciosa, Pote Rachado…) **não existem** no repositório de sprites da PokéAPI, então toda `<img>` de item usa `onerror="${ITEM_ERRO}"` e cai no `ITEM_SPR_RESERVA` (SVG embutido de caixinha). Antes a figura quebrada era só escondida e ficava um buraco — parecia bug de tela. |
| **Rede instável** | `api.getJSON` tenta 3× com pausa (400ms, 800ms) em falha de REDE e em 429; 404/500 não repetem. `apiErr(e)` escreve pro JOGADOR: `file://` → instrução de servidor; `navigator.onLine === false` → sem internet; 429 → "pediu calma"; com `code` → erro do servidor; sem `code` → conexão instável. Todas as mensagens de falta de dado apontam pra **⚙ Ajustes → Jogar offline** (offline.js). Relato real que motivou isso: celular em 5G oscilando mostrava "Failed to fetch" e a antiga mensagem falava de abrir o jogo dentro de um chat. |
| `js/tutorial.js` / `js/tela-tutorial.js` | **❓ Tutorial** (tour guiado + demonstração, ver "Próximos passos combinados" pra decisão completa). `tutorial.js` puro (`tests/tutorial.test.js`): passos (`TUT_PASSOS`), dados de mentirinha (Pichu/Caterpie/Treinador Theo) e a lógica de golpe/compra/captura — `resultadoCaptura`/o resumo de Runs leem `dados.DIFICULDADES` direto, nunca duplicam o texto. `tela-tutorial.js` desenha em `G.tut` (nunca `G.S`); `telaTutorial()` chama `nuvem.salvarTutorialVisto()` (idempotente) assim que abre. Aberto sozinho no `boot()` de main.js só na primeiríssima visita (sem save); sempre disponível de novo em `navegacao.TELAS` (`❓ Tutorial`). |
| `js/navegacao.js` / `js/ajustes.js` / `js/tela-ajustes.js` | **Navegação e ajustes.** `TELAS` é a ÚNICA lista de telas: `barraTelas(atual)` usa nas telas e `render()` usa no `#topr` (o menu ☰ do celular) — tela nova entra lá e aparece nos dois. `barraTelas(atual)` monta a MESMA barra no topo de toda tela fora do jogo (criação, carreira, saves, ranking, mp, conta, ajustes, relatos): `← Voltar` (`rotuloVoltar()`: pro jogo se há `G.S`, senão pro início) + atalhos pras outras (`TELAS`). Tela nova = incluir `barraTelas('id')` e pôr a entrada em `TELAS`. `Esc` clica no botão de voltar (main.js keydown, fora de explore/battle/create e sem modal aberto). `🏠 Início` com jornada aberta não perde nada: `iniciarJornada` guarda a atual (saves.js) antes de trocar. Fonte: `ajustes.js` (`FONTES`, `aplicarFonte` troca as variáveis CSS `--display`/`--body` e injeta o link do Google Fonts; escolha em `pokerpg-fonte`), aplicada no boot de main.js; tela em `tela-ajustes.js` com cada opção escrita na própria fonte. `tests/ajustes.test.js`. |
| `js/offline.js` | **Baixar um mapa pra jogar offline.** `alvosDaGen(gen)` = todo id do mapa (pool + Alfas + lendários; puro, `tests/offline.test.js`), `quantoFalta`/`jaBaixado` usam `api.pokemonEmCache`, `baixarGen(gen, aoAndar, sinal)` busca em lotes de 6: `loadPokemon` (cai no localStorage), os golpes do learnset até o nível 60 (`loadMove`, deduplicados num Set) e os sprites — pra sprite basta um `fetch(..., {mode:'no-cors'})`, que o service worker guarda no cache EXTERNOS. UI em `tela-ajustes.js` (`htmlOffline`/`baixarMapaOffline`, clique `baixar-gen`). `baixarTudo`/`quantoFaltaTudo`/`totalDoJogo` fazem o mesmo pros 9 mapas de uma vez (botão "⬇⬇ Baixar o jogo inteiro"), o que só passou a ser possível com o cache no IndexedDB (ver `js/api.js`): no localStorage isso estourava a cota e falhava calado. |
| **Clima** | `regras.CLIMAS` (sol/chuva/areia/granizo/neve) + `CLIMA_TURNOS` (5). Estado no **campo da batalha**, compartilhado pelos dois lados: single player `G.B.campo` (exposto como `CTX.campo`, getter em efeitos.js), multiplayer `estado.campo` (mp-motor). `climaDe(campo)` só devolve o clima com `turnos > 0`. Entra em: `calcDamage(u,t,move,clima)` (`multClima`), `effStat(m,stat,crit,atacando,clima)` (`multStatClima`: habilidade + `CLIMAS.defesaDe` por tipo), `chanceAcerto(move,u,t,clima)` (`PRECISAO_CLIMA` + `escondeNoClima`), `golpe.fimDeTurno` (dano de areia/granizo por `danoClima`, `curaClima`, `danoClimaProprio`, `curaStatusClima`) e `aplicarStatus` (`semStatusClima` = Leaf Guard). `mudarClima(clima, ctx, quem)` liga (golpe com `especiais.clima` ou habilidade `climaAoEntrar` em `intimidar`/1º turno do MP) e `passarClima(campo, ctx)` gasta um turno no fim da rodada (batalha.js e mp-motor). **Ao mexer em velocidade, lembrar do clima**: a ordem do turno usa `effStat(..., clima)` nos dois motores. `tests/clima.test.js`. |
| **Lado do campo** | `campo.lados = { jogador, inimigo }` (MP: `A`/`B`), criado sob demanda por `golpe.ladoDoCampo(ctx, m)` — o `ctx` diz o lado com `ctx.ladoDe(m)` (efeitos.CTX no single player; `ladoDe(s, m.ref)` no mp-motor). Forma em `regras.LADO_VAZIO()`: telas `reflect`/`luz`/`veu`, `salvaguarda`, `neblina`, `vento` (turnos) e armadilhas `pedras`/`espinhos`/`toxinas`. Lidos por `multTelas` (em `calcDamage`, 6º parâmetro = lado de QUEM DEFENDE), `temSalvaguarda` (em `aplicarStatus`, que agora recebe `fonte` — status próprio, tipo Rest, passa), `temNeblina` (em `mudarEstagios`), `multVento` (na ordem do turno dos dois motores) e `aplicarArmadilhas` (chamada em `win()` quando o treinador/lendário manda o próximo; se ele cai só com a armadilha, `win()` se chama de novo). `passarLados` no fim da rodada. Golpes em `especiais.js` (`lado`, `soNoGelo`, `armadilha`). **Do lado do jogador ninguém troca de Pokémon**, então armadilha ali é inerte — o golpe avisa isso em vez de fingir (`ctx.trocaDePokemon`). Cuidado com o nome: `espetos` é o Elmo Rochoso (item), `espinhos` é o Spikes (campo). `tests/lado-campo.test.js`. |
| **Terrenos** | `regras.TERRENOS` (eletrico/grama/psiquico/fada) + `TERRENO_TURNOS` (5), no MESMO objeto `campo` do clima (`campo.terreno`/`campo.terrenoTurnos`). **Regra de ouro: só afeta quem está no chão** — `noChao(m)` (não é Voador e não tem Levitate) é checado em `multTerreno`, `terrenoBloqueiaStatus`, `multStatTerreno`, na cura do Campo de Grama e no bloqueio de prioridade do Campo Psíquico. Entra em `calcDamage(u,t,move,clima,terreno)`, `effStat(..., clima, terreno)`, `aplicarStatus` e `golpe.fimDeTurno`. `mudarTerreno`/`passarTerreno` espelham os do clima (golpes com `especiais.terreno`, habilidades `terrenoAoEntrar`). `tests/terrenos.test.js`. |
| **Celular (batalha)** | `render()` liga `body.em-batalha`; o resto é CSS no bloco "celular" (`@media(max-width:880px)`): só a `.scene.battle` é `position:sticky;top:0` (teto de 38vh, com rolagem própria), sprites e golpes compactos, e TODO o resto da página (ações, registro, painéis) rola normalmente por baixo. Fora da batalha, só `#actions` é sticky. **Já existiram abas** ⚔ Luta / 💬 Registro / 📋 Painéis (`abaMobile`, `ABAS_MOB`, classes `body.mob-*`) que escolhiam o que ocupava o meio da tela: **removidas a pedido de quem joga** — cada aba escondia dois terços da tela (ver a ficha de um aliado exigia perder a batalha de vista), e a barra ainda comia uma faixa justo no aparelho mais apertado. Antes disso elas já tinham dado outro bug: o conteúdo nascia abaixo da dobra e os botões pareciam mortos. **Não reintroduzir "esconder painel por aba"**: o problema que elas resolviam ("não vejo o Pokémon enquanto escolho o golpe") está resolvido pela cena presa no topo, sem esconder nada.

**Celular DEITADO (28/09/2026)**: o bloco "celular" acima foi pensado pra RETRATO — cena presa no TOPO, resto rola embaixo — e em paisagem (tela larga e baixa) isso sobraria pouquíssima altura pro resto. Gatilho por `@media(orientation:landscape) and (max-height:500px)` (altura, não largura: um celular deitado pode passar de 880px de largura e continuar precisando do mesmo tratamento; telas realmente altas — tablet/desktop landscape — ficam de fora). Na batalha, a cena vira uma COLUNA fixa à ESQUERDA (`grid-template-columns:minmax(180px,36%) 1fr`, sticky, altura quase inteira da tela) e tudo mais (golpes, painéis, log) numa coluna à direita que rola. **`.stage{display:contents}`** é o truque que torna isso possível: `#scene` mora DENTRO de `.stage`, que é IRMÃO das zonas esq/dir (não pai) — sem "abrir" o `.stage` pro grid do `.game`, `#scene` não teria como virar uma coluna própria (mesma técnica já usada em `.menu-links` no topo do celular). `order:-2`/`order:-1` em `#actions`/`.zona[centro]` colocam os botões de golpe ANTES dos painéis da esquerda/direita na coluna 2 (senão a ordem do DOM enterraria os golpes embaixo da ficha/mochila). Fora da batalha, o mesmo gatilho de altura também entra na condição do bloco "celular" normal (`@media(max-width:880px),(orientation:landscape) and (max-height:500px)`) — sem isso, as 3 colunas do desktop (mais de 1100px de largura mínima) ficavam cortadas num celular deitado mais largo que 880px. |
| **Batalha no save** | Recarregar a página apagava `G.B` — dava pra fugir de treinador/Alfa/lendário e de uma derrota no Roguelike com F5. `estado.save()` grava `S.batalha = ganchosSave.serializarBatalha(G.B)` (batalha.js; `caidos` é Set e volta vazio) e `main.abrirJornada` restaura com `restaurarBatalha` — reapontando `B.enemy` pra `trainer.equipe[atual]`, senão viram dois objetos e o dano vai só pra um. |
| **Segredo do brilho** | `regras.bonusShiny(S)`/`multShiny(S)`: jogador shiny (1/4096, sorteado no `makeMon` da criação como pra qualquer Pokémon) ganha **XP e dinheiro em dobro** (`win()` em batalha.js: xp, dinheiro, prêmio de treinador e de Alfa) e **Centro Pokémon de graça** (`estado.centroPokemon`). **É segredo**: não entra no README nem nos patch notes — quem tirar um shiny descobre jogando. |
| **🎯 Caça Shiny** | Modo ligado só na criação (`G.cacaShiny` → `S.cacaShiny`; `S.caca = { rota: speciesName }`). `mapas.js`: `rotaLiberaCaca(z, saber)` exige TODA espécie não-mítica/não-lendária da rota revelada (`REVELA_DERROTADOS`), `progressoCaca` mostra o quanto falta, `cacaDaRota(S, z)` diz quem está sendo caçado; `batalha.sortearOponente` força essa espécie (respeitando o cache no offline). UI em `render.blocoCaca`, clique `data-act="caca"`. `tests/caca-shiny.test.js`. **✅ CORRIGIDO (28/09/2026) — bug real relatado pelo usuário: "a rota nunca libera a opção de escolher quem caçar".** Reproduzido o mecanismo inteiro com jsdom (rota revelada, caça ligada, forçando o ramo de encontro selvagem): o motor de "travar a espécie" (`especieForcada`/`sortearOponente`) sempre funcionou certo. O bug real estava em `cacaveisDaRota`: excluía `mitico` da exigência de revelar ("derrotar 10 Mew não é razoável"), mas **não excluía `lendario`** — mesma razão, mesmo esquecimento. Só importa na prática pro **Santuário** (11ª rota, `posVitoria`): é a ÚNICA rota cujo `pool` mistura lendários (rotas 1–10 guardam os lendários em `z.lendarios`, fora do sorteio selvagem) — exigir 10 derrotas de um Mewtwo com peso ~0,2% no pool nunca fecha de verdade, então a caça no Santuário travava pra sempre num "quase lá". Corrigido: `cacaveisDaRota` agora filtra `!p.mitico && !p.lendario`; `render.blocoCaca` (a lista de espécies OFERECIDAS pra escolher, linha separada que tinha o mesmo filtro incompleto) ganhou a mesma exclusão, pra não oferecer um alvo praticamente impossível de manter em cena. `tests/caca-shiny.test.js` ("lendário no pool... também fica de fora"). |
| **Repelentes** | `ITENS_REPELENTE` (dados.js: `repel` seletivo 30 passos, `max-repel` total 40) → `S.repelente = { tipo, passos, especie? }`, usados por `itens.usarRepelente`. Em mapas.js: `repelenteAtivo`, `semSelvagens(S, z)`, `especieForcada(S, z)` (repelente na frente da Caça Shiny) e `gastarRepelente(S)` (um passo por exploração). `mundo.explore` troca SÓ o ramo do encontro selvagem por ambientação — o sorteio de treinador/item/dinheiro é o mesmo de sempre (pedido explícito do usuário, vale também pra Caça Shiny). |
| `js/segurados.js` | **Itens segurados** (puro, `tests/segurados.test.js`). `M.item` = id em ITEMS; `SEGURADOS` = tabela de ganchos (mesma ideia de habilidades.js): `multDano` (+`soFisico`/`soEspecial`/`soSuperEfetivo`), `multStat`, `semStatus`, `recuoPorGolpe`, `drenaDano`, `espinhos`, `aguentaCheio`, `curaFimTurno`(+`soTipo`/`danoFimTurno`), `curaEm`, `curaStatus`, `gastaNoUso`. Lidos em `regras.effStat`/`calcDamage` (`multDanoDoItem`) e em `golpe.js` (durante o golpe: Faixa de Foco, Sino-Concha, Orbe da Vida, Elmo Rochoso, `comerFruta` depois do dano; no fim do turno: `fimDeTurnoDoItem` + `comerFruta`). Equipar/tirar em `itens.js` (`equiparItem`/`tirarItem`), botão na ficha (`blocoItem` em render.js, `data-act="tirar-item"` com `'p'` ou índice do aliado). Item de dados em `dados.ITENS_SEGURADOS` (`segurado: true`). **MP copia `item` desde 28/09/2026** (`mp-motor.fotoDoMon`) — ver "Itens no multiplayer" abaixo. |
| `js/dados-patchnotes.js` / `js/tela-patchnotes.js` / `js/novidades.js` | **Notas de atualização** (tela 📜 Novidades). `PATCH_NOTES` é escrito À MÃO, mais novo primeiro: `{ versao, data (AAAA-MM-DD), titulo, piada, secoes: [{ nome: 'Novidades'\|'Correções'\|'Equilíbrio', itens: [texto] }] }` — formato garantido por `tests/patchnotes.test.js` (versões únicas, ordem decrescente, itens com mais de 20 letras). Texto PRA JOGADOR: nada de nome de arquivo/função, e cada versão leva uma piada. **Toda leva de mudanças deve virar uma versão nova aqui.** `novidades.js` guarda só o "já li" (`pokerpg-patch-visto`) porque navegacao.js e a tela se importam. |
| `js/evolucao.js` | **Evoluções especiais** (puro, `tests/evolucao.test.js`). `detalheCumprido(d, M, ctx)`/`evolucoesPossiveis(node, M, ctx)` avaliam os detalhes da PokéAPI (`api.slimEvo`, cache `evo2:`, raiz com `v: 2`; árvore de save antigo é rebuscada em `arvoreDe`). Gatilhos: `level-up`, `use-item`, `trade` (Cabo de Conexão), `pos-batalha`. Condições cobertas: nível, item, item na mochila (`held_item` → `consome`), golpe/tipo de golpe, `min_happiness`/`min_affection` (vínculo `M.felicidade`, começa em 70, aliado 120, +5/+3/+2 por nível e +1 por vitória), hora real (`periodoDoDia`, dusk = 17h), espécie/tipo na equipe, Ataque×Defesa. **Não suportado** (e por isso ignorado): local, chuva, de cabeça pra baixo, beleza, gênero (ignorado = sempre vale) e `level-up` SEM condição nenhuma (na API é o campo magnético de Magnezone/Probopass/Vikavolt — evoluiria em qualquer nível; eles têm Pedra do Trovão). `EVO_ALTERNATIVAS` dá regra equivalente aos 19 casos que o jogo não tem (contadores `M.vol.criticos`, `M.vol.danoSofrido` em golpe.js; `M.recuoTotal`; `M.passos` em mundo.js; `registro.derrotados`; dinheiro). Fluxo: `progressao.checkEvolution(M, extra)` (nível e pós-batalha) e `evoluirComItem(id)` (item/Cabo, chamado por `itens.useItem`). Itens em `dados.ITENS_EVO` (fundidos em `ITEMS`): `evo` (usar), `troca` (Cabo), `segurar` (fica na mochila e é gasto ao evoluir). **Shedinja** (`casulo()` em progressao.js): ao escolher `ninjask`, se há vaga em `S.aliados` o Shedinja é criado e entra como aliado; equipe cheia = `ask` de qual dos dois o próprio Pokémon vira. |
| `js/saves.js` / `js/tela-saves.js` | **Jornadas salvas**: a atual continua em `SAVE_KEY`; as outras em andamento ficam em `pokerpg-saves-guardados-v1` (`{id: S}`, até `MAX_GUARDADAS` = 12). `excluir(id)` lembra o id em `pokerpg-saves-excluidos-v1` pra apagar da nuvem na próxima sincronização (offline) e não ressuscitar. Na nuvem, `saves` tem chave `(user_id, jornada_id)` — uma linha por jornada (o `schema.sql` migra a chave antiga). `nuvem.js sincronizarSaves` executa `reconciliarSaves` (puro, `tests/saves.test.js`): mesma jornada = vale a mais nova; terminada/excluída = apaga; desconhecida vinda da nuvem = `ganchos.oferecerSave` → 'continuar' (a atual vai pras guardadas) / 'guardar' / 'excluir'. **Nada é descartado sem o jogador escolher.** Com o schema antigo (erro 42P10 no upsert), cai pro modo uma-jornada-por-conta e só a atual sobe. Tela: `telaSaves()`; cliques `saves`/`save-guardar`/`save-continuar`/`save-excluir` em main.js (`guardarAtual`, `continuarGuardada`). "Novo jogo" oferece guardar ou encerrar. |
| `js/mapas.js` / `js/dados-mapas.js` | Mapas por Gen (ver "Mundo e progressão"). `dados-mapas.js` é gerado por `ferramentas/gerar-mapas.ps1`. **Iniciais fora das rotas**: `tirarIniciais(GENS)` roda UMA vez ao carregar o módulo e tira dos pools os 27 iniciais das 9 regiões e as evoluções deles (`ehInicialDeRegiao(id)`: cada trio ocupa ids seguidos a partir do primeiro, 1-9, 152-160, …). Pikachu e Eevee ficam — são a região marcada `nasRotas: true` em `REGIOES_INICIAIS` (dados.js). Alfa que era inicial vira o bicho mais raro do pool, no mesmo nível; rota que fica com menos de `MIN_POOL` (5) empresta das rotas vizinhas do mesmo mapa (`completarPool`, 2ª passada — na 1ª todas as rotas já foram limpas, senão uma vizinha suja emprestaria justo o inicial recém-tirado). O gerador aplica a MESMA regra (`EhInicial` em gerar-mapas.ps1), então dados regerados já nascem limpos. `especiesDaGen(gen)` = todas as espécies do mapa sem repetir, sem mítico e **sem o Santuário**, usada pelos treinadores. **Santuário (11ª rota de cada mapa, `posVitoria: true`)**: pool com TODA a Gen — espécies comuns, iniciais, lendários, míticos e as 53 formas regionais —, peso pela taxa de captura, gerado junto com o resto em `gerar-mapas.ps1`. É o que garante completude: qualquer espécie que ficasse de fora das 10 rotas cai ali. `regras.zonaLiberada(z, nivel, S)` ganhou o 3º parâmetro por causa dele: rota `posVitoria` ignora nível e exige `S.gensVencidas.includes(z.gen)`; **sem `S` fica trancada** (padrão seguro — todos os chamadores passam `G.S`). `tirarIniciais` e `especiesDaGen` PULAM rotas `posVitoria` — se um dia alguém varrer rotas pra filtrar conteúdo, tem de pular também, senão o Santuário deixa de cumprir o papel. **Formas regionais**: na PokéAPI são variedades de `pokemon` com id > 10000, não espécies; a entrada do pool é `{ id: 10100, n: 'raichu', f: 'raichu-alola' }` — `n` continua sendo a ESPÉCIE (chave do registro/Pokédex/caça, que o jogo inteiro já usa) e `f` só o nome mostrado (`pokedexDaRota` devolve `nome: f || n`). Formas de Tauros de Paldea ficaram de fora: o nome delas não termina em `-paldea`. **Roguelike + Santuário**: vencer os lendários grava `S.genVencida` NA HORA (não no fim da run) e pergunta se encerra em vitória ou segue no Santuário (`S.aposVitoria`, botão `encerrar-vitoria` nas ações). Quem segue e morre lá termina em derrota **sem perder a Gen**: `encerrarJornada` injeta `genVencida` do save e `gensLiberadasRoguelike` aceita `j.genVencida` mesmo com `motivo !== 'venceu'`. **Lendário selvagem no Santuário** aceita petisco (é o que torna o desbloqueio por amizade possível), mas `ganhoAmizade(..., lendario)` divide o ganho por `DIVISOR_AMIZADE_LENDARIO` (4, piso 1) — `batalha.startBattle` marca `E.lendario` pelo `l`/`m` da entrada do pool. |
| `js/regras.js` | **Fórmulas puras** (testadas): `calcStats`, `calcDamage`, `effStat`, `typeEff`, `chanceAcerto`, `consegueFugir`, `jogadorAgePrimeiro`, `danoResidual`, `imuneAoStatus`, `xpPorVitoria`, `ganhoDeEVs`… |
| `js/api.js` | PokéAPI com cache: memória (`memo`) + **IndexedDB** (`pokerpg-cache`/`dados`), com `localStorage` `pk:*` só de reserva (navegador sem IndexedDB) e migração automática do que já estava lá. `iniciarCache()` roda antes do boot (main.js), monta o índice `chavesGuardadas` (é o que `pokemonEmCache`/`idsEmCache`/`itensNoCache` leem, sem ir ao banco) e pede `navigator.storage.persist()`. `espacoUsado()` = `storage.estimate`, mostrado em ⚙ Ajustes. Saiu do localStorage porque os ~5 MB dele não cabiam o jogo inteiro e o `store.set` falhava calado. `buildLearnset`/`slimPokemon`/`slimMove` continuam puras (testadas). |
| `js/ui.js` | `$`, `REDUCED`, log (`log`/`say`/`logRaw`), modal `ask`, `shake`. |
| `js/render.js` | `render()` (re-render total: conteúdo dos painéis, cena e ações), `buildGame()`, `badge`, `spriteFrente`. |
| `js/layout.js` | Modelo puro do layout dos painéis (zonas, larguras, alturas, recolhidos). Testado. |
| `js/paineis.js` | Painéis na página: esqueleto, aplicar layout, arrastar, ▲▼⇄▾, divisórias, restaurar. |
| `js/pokemon.js` | `makeMon(data, level, opt)` — instância jogável (jogador e selvagem). |
| `js/efeitos.js` | `changeStats`, `inflict`, `healFull` — efeitos com narração, usados pela batalha e pelos itens. |
| `js/batalha.js` | `turn(action)` (único ponto de entrada da UI), `useMove`, `startBattle`/`startTrainerBattle`, bola do treinador, vitória/derrota/captura, `endBattle`. **Equipe de treinador não é só da rota**: `sortearDoTreinador(z)` tira `CHANCE_FORA_DA_ROTA` (50%) de cada membro de `mapas.especiesDaGen(z.gen)` — qualquer espécie do mapa, sempre no NÍVEL da rota — e o resto do pool da rota, que mantém a cara do lugar (o treinador andou até ali; a rota diz o nível, não quem ele criou). Vale pra todo treinador de rota. Offline, filtra pelo que está guardado. |
| `js/progressao.js` | `gainExp`, aprender golpe, evolução por nível. **O que a evolução entrega**: `regras.golpesDaEvolucao(antes, depois, nivel)` = golpes que a forma NOVA aprende **no nível 0** (é assim que a PokéAPI marca "aprende ao evoluir") e a antiga não aprendia. **Nível 1 não entra**: é a lista do que a espécie saberia se nascesse agora (o Exeggutor tem 17 golpes lá), e incluí-la reescrevia o moveset inteiro numa evolução só — bug relatado em jogo + o golpe do nível atual — antes só olhávamos o nível exato, e o golpe assinatura (King's Shield do Aegislash) se perdia pra sempre em qualquer evolução acima do nível 1. `habilidades.habilidadeDaEvolucao(velhas, novas, atual)` mantém o SLOT (oculta continua oculta; antes era índice cru na lista inteira, que misturava oculta com normal quando a forma nova tinha outro número de habilidades) e o registro avisa quando o nome muda. **Evolução pendente**: falha de rede em `arvoreDe`/`evolve` marca `M.evoPendente` (a ficha mostra ⏳) e `verificarEvolucoesPendentes()` tenta de novo ao explorar e depois de vencer — sem isso o nível subia e a evolução sumia sem ninguém ver. |
| `js/pokedex-conta.js` / `js/tela-pokedex.js` | **Pokédex da conta** (puro + tela; `tests/pokedex-conta.test.js`). `pokedexDaConta(jornadas, registroAtual)` junta `registro.vistos/derrotados/amigos/ids` de toda a carreira + a run atual e devolve `{ porId, porNome, conhecidas }`; o `estado` de cada espécie é amigo > derrotado > visto. Registro antigo sem `ids` conta no total por nome, mas não entra no mapa por id (não dá pra desenhar sprite sem id). `ondeAparece(id)` responde "onde eu acho esse?" varrendo os mapas gerados — rotas com a taxa de encontro, Santuário, Alfa e luta final — **sem rede**, então funciona offline. A tela mostra as 1025 espécies (`loading="lazy"` nas imagens: sem isso o navegador baixaria mil sprites de uma vez) e a ficha detalhada vem de `api.loadPokemon`/`loadAbility` no clique, com mensagem própria quando está offline e a espécie não foi baixada. |
| `js/progresso-conta.js` | **Progresso permanente da conta** (puro; `tests/progresso-conta.test.js`). Regra única: **nunca encolhe**. Antes, desbloqueios e contadores eram DERIVADOS das jornadas da carreira — apagar uma jornada apagava a conquista que ela liberou (risco apontado pelo próprio jogador). Agora há um registro próprio: `especies` (desbloqueada, com data e razão; a data nunca é sobrescrita) e `porJornada` (abates + espécie/nível/dificuldade, pela chave do ID da jornada). **`porJornada` em vez de um total único** porque é o que faz a fusão entre aparelhos e com a nuvem ser correta: mesma jornada = mesma chave, nada conta em dobro, e jornada que só um lado viu entra sem conflito. `bancar()` é idempotente pelo ID, então pode rodar a cada abertura de tela. Acesso em `carreira.js` (`atualizarProgresso`, `desbloqueadasDaConta`, `abatesDaConta`, `mesclarProgressoLocal`), sincronização em `nuvem.js` (tabela `progresso`, uma linha por conta, `try/catch` pra não quebrar quem não rodou a migração) e SQL em `supabase/migrations/`. **Local primeiro**: grava no aparelho na hora (funciona offline) e junta com a nuvem depois. A retroatividade continua: `especiesDesbloqueadas` é a UNIÃO do gravado com o que a regra de hoje reconhece no histórico, então regra nova (como "shiny recrutado desbloqueia") vale pro passado. |
| `js/conquistas.js` / `js/tela-conquistas.js` | **Conquistas da conta** (puro + tela; `tests/conquistas.test.js`). As gimmicks não se desbloqueiam dentro de uma run: somam a CARREIRA. `registrarAbate(S, {porMim, tiposDoAlvo, minhaEspecie, golpe, modo})` é chamado em `batalha.win()` e grava em `S.registro.abates`: `tipoAlvo` (Tera, 200 por tipo) · `especie` (Mega, 1000) · `golpe`/`elemento` (Z-Move, 250/500) · `total` (marcos 1k/10k/100k/1M). **Quem leva o crédito**: a ESPÉCIE conta sempre que a equipe vence (aliado incluído — decisão do usuário, que voltou atrás do "só o seu golpe"); TIPO e GOLPE só quando `porMim`. Sem golpe (veneno/armadilha/recuo) a espécie conta e o golpe não. O modo `easy` não acumula nada. Gigantamax (nível 50 em 25 jornadas) sai de `runsDeNivel` sobre o histórico — não precisou de contador novo. `progressoConquistas(jornadas, registroAtual)` junta carreira + run em andamento. **Contador só acumula depois de publicado**: por isso foi ao ar sozinho, antes de qualquer tela ou mecânica de gimmick. |
| `js/itens.js` | `addItem`, `useItem`. **Itens de golpe** (`dados.ITENS_GOLPE`, `it.ensina`): `ensinarGolpe(id)` pergunta em QUEM (você ou qualquer aliado vivo) e qual golpe, e chama `progressao.aprender(M, ref, true)` — o `true` força VOCÊ a escolher o que o aliado esquece, em vez da escolha automática do level-up (você pagou pelo item). **Aliado aprendendo sozinho** (`escolher = false`): `CHANCE_ALIADO_RECUSA` (50%) de simplesmente não querer o golpe; querendo, troca um golpe **sorteado**, não o de menor poder — pedido do usuário, pra o aliado ter jeito próprio em vez de moveset ótimo e previsível. O item só é gasto se `aprender` devolver `true` (desistir na hora de esquecer não gasta). O que cada um oferece sai de `regras.golpesParaEnsinar(tipo, M)` (puro, testado): `'relembrar'` = `learnset.list` até o nível atual (Escama do Coração, ₽5.000, também aparece em 3% dos itens achados explorando — `mundo.CHANCE_ESCAMA`); `'pokedex'` = `learnset.extras` (Disco Técnico, só loja). `null` = sem cache ou cache antigo sem `extras` → avisa pra conectar, NUNCA diz "não aprende nada". Preço do Disco por `regras.precoItem(id, S)`: `PRECO_DISCO + AUMENTO_DISCO * S.discosUsados` (8k +4k por Disco USADO, não comprado) — a loja (`render`) e o `case 'buy'` (main.js) leem os dois dessa função, nunca de `ITEMS[id].price` direto. |
| `js/amizade.js` | `oferecer` (petisco em batalha), recrutar aliado, `despedir`. |
| `js/fim.js` | `encerrarJornada(motivo)` (resumo → carreira → apaga save aqui e na nuvem), `montarResumo`, tela de fim, `telaCarreira`. |
| `js/roguelike.js` | Desbloqueios do Roguelike entre runs (puro, testado). |
| `js/carreira.js` | Carreira = lista de jornadas terminadas (`pokerpg-carreira-v1`; migra o `pokerpg-recordes-v1` antigo). `calcularCarreira`, `mesclarJornadas`, `melhorDaEspecie`. Puro + `store`, testado. |
| `js/config.js` | `SUPABASE_URL` / `SUPABASE_ANON_KEY` (marcadores = jogo só local). |
| `js/nuvem.js` | Supabase sob demanda: login (Google / link por e-mail), `sincronizar()` (carreira + save em andamento), envio do save com espera, `ganchos` que o main.js liga. `idJogador()` (id da conta, ou de visitante persistido) e `sb()` (o cliente) exportados pra `multiplayer.js` e `presenca.js` não duplicarem/abrirem uma 2ª conexão. |
| `js/presenca.js` | **Marcador "jogando agora"** (tela inicial): canal Realtime global (`pokerpg-presenca-global`, diferente do canal por SALA de `multiplayer.js`), `track({})` vazio — nunca identifica quem, só quanto. Junto, o contador HISTÓRICO admin-only de visitantes sem conta (`registrarVisitanteAnonimo`/`contagemAnonimos`, tabela `visitantes_anonimos`). Interruptor em ⚙ Ajustes (`presencaLigada`/`definirPresenca`), divulgado na tela 🔒 Privacidade — não é telemetria silenciosa. Sem Supabase configurado, tudo aqui é no-op. |
| `js/golpe.js` | **Motor único do golpe** (single player e multiplayer): usarGolpe, mudarEstagios, aplicarStatus, fimDeTurno, com `ctx` de narração. |
| `js/habilidades.js` | Tabela de habilidades (ganchos) + `hab(m)`, `IMPL`. **Só o que está nessa tabela tem efeito de verdade** (hoje 165 de 307 habilidades da PokéAPI — `docs/auditoria-batalha.md` ficou desatualizado depois da 2ª leva, contava 64/307; sem gerador salvo no repo pra refazer a auditoria por completo, mas a contagem real é `IMPL.size`, testada em `tests/habilidades.test.js`). O resto joga normal, sem o efeito, e a ficha mostra "(sem efeito ainda)". **Mudança de Postura** (`postura`, Aegislash) é a primeira troca de FORMA: `golpe.trocarPostura(m, paraLamina, ctx)` espelha os atributos base (Ataque ↔ Defesa, At.Esp. ↔ Def.Esp.) — as duas formas do Aegislash são os mesmos números trocados de lado, então não precisa buscar a outra forma na rede no meio do turno. **Sempre copiar `m.data` antes** (`{ ...m.data, base }`): esse objeto vem do cache e é compartilhado por todo Aegislash que aparecer. Golpe de dano → Lâmina (antes de calcular o dano); King's Shield → Escudo (`especiais.voltaPostura`). `tests/postura.test.js`. |
| **Barreiras que punem contato** | `especiais.puneContato` (`{ estagio: [attr, n] }` / `{ dano: fração }` / `{ status }`): King's Shield tira 2 de Ataque, Obstruct 2 de Defesa, Spiky Shield machuca 1/8, Baneful Bunker envenena, Silk Trap tira Velocidade, Burning Bulwark queima. A barreira guarda o efeito em `u.vol.punicao` ao ser levantada; quem ataca leva a punição no ponto em que o golpe é bloqueado, **só se for golpe físico** (a mesma regra de contato de Static/Elmo Rochoso). `fimDaRodada` limpa junto com `protegido`. Antes eram todos `protege: true` puro — um Protect com outro nome. |
| `js/especiais.js` | `GOLPES_ESPECIAIS` + `especial(g)`: golpes cujo efeito não cabe no `meta` da PokéAPI. Comportamentos (lidos em `golpe.js`/`regras.js`): `protege`, `aguentaTurno`, `foco`, `descanso`, `autoDesmaio`, `ohko`, `soDormindo`, `toxico`, `semente`, `carga`(+`invulneravel`), `recarga`, `furia`, `poder` (fórmula em `regras.poderEspecial`), `danoIgualHp`. Sem imports. Estado volátil novo em `m.vol`: `protegido`/`aguenta` (1 rodada — limpos por `fimDaRodada(m)`, que substitui o antigo `vol.flinch = false` em `batalha.js` e `mp-motor.js`), `protSeguidas`, `foco`, `toxico` (n/16 por turno), `semente` (ref de quem plantou, via `ctx.refDe`/`ctx.monPorRef`), `carregando` (o golpe), `invul`, `recarga`, `furia {golpe, turnos}`. Pokémon travado (carga/fúria): `usarGolpe` ignora o golpe escolhido e usa `golpeTravado(m)`. Algo que impede de agir (sono, congelado, paralisia, recuo, confusão) chama `interromper(u)` e a carga/fúria se perde. Hyper Beam só recarrega se o golpe conectou (`executar` devolve `'acertou'`). `tests/especiais.test.js`. A auditoria completa (o que ainda falta) está em `docs/auditoria-batalha.md`, gerada da PokéAPI. |
| `js/relatos.js` | Tela de bugs e sugestões + `contextoTecnico()`. |
| `js/mp-motor.js` | Motor puro da batalha multiplayer (lados A/B com N Pokémon). Testado. |
| `js/multiplayer.js` | Salas co-op por código (Realtime), anfitrião autoritativo, telas da sala. |
| `js/ranking.js` | Tela do ranking global (geral / por espécie). |
| `js/conta.js` | Tela de conta e o botão 👤 no topo (`#conta-chip`). |
| `js/missoes.js` | `verificarMissoes()` — anuncia missões novas e entrega prêmio das concluídas. |
| `js/mundo.js` | `explore()`, `desafiarChefe()`. |
| `js/criacao.js` | Tela de criação: passo 1 dificuldade, passo 2 iniciais por região (ou busca livre em modo `especiesLivres`), prévia, `startGame`, `fullRandomizer`. |

Grafo de imports sem ciclos: `util`/`dados`/`layout` → `regras`/`api` → `estado` → `ui` → `paineis` → `render` → `efeitos`/`progressao`/`pokemon` → `itens`/`amizade`/`missoes`/`fim`/`criacao` → `batalha` → `mundo` → `main` (`batalha` importa `encerrarJornada` de `fim`, então `fim` nunca pode importar `batalha`). Manter sem ciclos.

## Mecânicas (Etapa 3)

- **Dificuldade** (`S.dificuldade`, tabela `DIFICULDADES` em `dados.js`, lida via `dificuldadeDe(S)` — save antigo sem o campo conta como `easy`). Escolhida no **passo 1 da tela inicial** (`G.dif`, `renderDificuldade`). **O código lê as flags de cada modo, nunca compara o nome**: `semCaptura`, `fimDeJogo`, `centroGratis`, `descontoPorVitoria`, `nivelLivre`, `escolhaLivre`, `fimNaGen` (vencer os lendários encerra a run — Roguelike). O passo 2 é o mapa (Gen, `G.gen`, `renderGens` em criacao.js).
  - `easy` Fácil: nunca capturado, Centro grátis, escolhe tudo.
  - `medium` Médio: igual ao Fácil, mas Centro pago com −10% por vitória desde a última visita (`S.vitoriasDesdeCentro`, zera ao usar o Centro ou desmaiar; 10 vitórias = grátis).
  - `hard` Difícil: capturado → foge depois sem a mochila, metade do dinheiro, zona aleatória; nível inicial 5.
  - `hardcore` Hardcore: capturado → fim de jogo, save apagado (`telaFim`); nível 5 + natureza/habilidade sorteadas.
  - `randomizer` Full Randomizer: sorteia até a espécie (o passo 2 vira um botão só); captura/Centro = Difícil.
- **Treinadores caçadores** (`startTrainerBattle` em `batalha.js`, 10% das explorações): equipe de 1–3 Pokémon da zona, 2–4 bolas (`bolaPorNivel`). Com seu HP ≤ metade, 60% de chance por turno de gastar a vez lançando bola (sai antes de qualquer golpe). Captura = fórmula real da Gen 3/4 (`valorCaptura`/`balancosDaCaptura`) com a `captureRate` da SUA espécie (`loadSpecies`, cache `sp2:`). XP ×1,5; dinheiro só no prêmio final (`premioTreinador`). Dá pra fugir (você é selvagem). Desmaiar contra treinador = derrota comum (Centro), não captura.
- **Shiny**: 1/4096 (`ehShiny`) em todo `makeMon` — você, selvagem, treinador, qualquer modo. Sprite montado pelo id (`SPR_SHINY`/`SPR_SHINY_COSTAS`, não fica no cache da API), com `onerror` caindo no normal. Sobrevive à evolução.
- **Centro Pokémon**: `centroPokemon()` (estado.js) é o ÚNICO lugar que decide se precisa e quanto custa — cada Pokémon da equipe que precisa de cura paga `custoCentro(nível)` = ₽50 + ₽15/nível, com as regras do modo por cima. Desmaiar continua curando de graça (com a perda de metade do dinheiro).
- **Amizade / aliados (3.2)** (`amizade.js`): na Mochila, em batalha contra **selvagem**, ofereça um petisco (`ITEMS` com `afinidade`: 6 petiscos que cobrem os 18 tipos uma vez cada). Tipo que gosta: +20–35; errado: 0–5 (`ganhoAmizade`). Só aceita se `nivel ≤ seu nível + 5`. Em 100, vira aliado (`S.aliados`, máx. `MAX_ALIADOS` = 2; cheio → escolhe quem despedir). Aliado tem `growth` próprio, ganha o mesmo XP/EVs que você (Exp. Share), aprende golpes sozinho (troca o de menor poder), ainda **não evolui**.
- **Batalha com vários do mesmo lado**: `ladoJogador()` = você + aliados. Todos agem no turno (`ordenarAcoes`: prioridade → velocidade → sorteio); aliado usa `melhorGolpe` (poder × eficácia × STAB); o inimigo mira um aleatório em pé do seu lado; a bola do treinador mira só você. Você desmaiar = derrota mesmo com aliado em pé. **Nunca assumir "só 1 do meu lado"** — é a base do multiplayer.
- **Registro** (`registrar(S, lista, especie)` → `S.registro.derrotados/amigos/evolucoes`): lido pelas missões, e pelo Roguelike no futuro.
- **Aliado evolui** como você (pergunta antes; árvore buscada na 1ª vez e guardada em `A.evo`, `null` = não evolui) e **itens valem pra equipe**: `itemTemEfeito` decide quem se beneficia; com mais de um alvo, "Usar em quem?". Desmaiado nunca recebe item (Potion não revive).

## Mundo e progressão (Etapa 2)

- **Mapas por Gen** (`js/mapas.js`, puro, `tests/mapas.test.js`; dados em `js/dados-mapas.js`, **GERADO** por `ferramentas/gerar-mapas.ps1` a partir da PokéAPI — não editar à mão: mudar nomes/temas/faixas no script e rodar de novo; o script precisa ficar salvo com BOM, senão o PowerShell 5 estraga os acentos). 9 Gens × 10 rotas, faixas de nível iguais em todo mapa (2–6 … 52–62). `ZONES` (dados.js) = todas as rotas de todos os mapas, cada uma com `gen`. `pool = [{ id, n: speciesName, p: peso, m?: mítico }]` — sorteio ponderado `sortearDaRota` (taxa = peso/total; peso vem da taxa de captura; mítico ≈ 0,4% nas rotas 8 e 9). Rotas 1–9 têm `chefe` (Alfa); a 10ª tem `final: true` + `lendarios` (os da Gen com total ≥ 500; o último = principal). Kanto mantém os ids antigos (`rota1`…`caverna`) por causa de saves e missões; a Fenda Dimensional saiu (save que estava nela cai na 1ª rota).
  - Estado: `S.gen` (sem campo = 1, `genDe`), `S.gensVencidas`, `S.nivelInicioGen`, `S.escolhendoGen`. **Sempre ler rota por `zone()`/`rotasAtuais()` (estado.js)**, nunca `ZONES` direto na jornada: elas aplicam `rotaNaJornada` (níveis escalados por `escalaNivel` quando você entrou no mapa já forte — fora do Roguelike, depois de fechar uma Gen; a 1ª rota fica sempre aberta).
  - Lendários: `startLendarios(z)` (batalha.js) usa o fluxo de treinador (`trainer.lendarios`, `bolas: 0`, `B.chefe` = rota pra bloquear petisco) com `sequenciaLendaria` (até 3 + o principal, que vem com `statsDeChefe`); `rotulo` mostra "X lendário". Vencer → `vencerGen()`: marca `S.chefes[rota]` + `S.gensVencidas`; modo com flag `fimNaGen` (Roguelike) → `encerrarJornada('venceu', { genVencida })`; senão `S.escolhendoGen = true` + `telaEscolherGen()` (fim.js), clique `proxima-gen` (main.js) → `entrarNaGen`. `abrirJornada` volta pra essa tela se o save estiver com `escolhendoGen`.
  - Roguelike: mapas liberados na criação = `gensLiberadasRoguelike(carreira)` (Gen 1 + a seguinte da maior Gen vencida em run Roguelike). Outros modos escolhem qualquer mapa; Full Randomizer sorteia. Pontuação: `gens` × 2000 (PESOS_PONTOS + `validar_jornada` no schema.sql; teste confere). Limite de Alfas no SQL = rotas com Alfa + finais (90).
  - Pokédex da rota (render.js `pokedexRota`): `pokedexDaRota(z, conhecimento())` — "?" nunca enfrentou, silhueta (CSS `filter`) já enfrentou, colorido + `textoTaxa` com `REVELA_DERROTADOS` (10) derrotados. `conhecimento()` soma `vistos`/`derrotados` da carreira inteira + a jornada atual; a parte da carreira é recalculada só quando `versaoCarreira()` muda (carreira.js incrementa em `salvarCarreira`).
  - Missões com `gen` (trilha de Alfas de Kanto + `lenda`) só aparecem no mapa daquela Gen (`situacaoMissoes`). Multiplayer co-op usa as rotas do mapa da run do anfitrião; a luta dos lendários não existe no co-op.
- **Zonas por nível**: `libera` = nível mínimo (`zonaLiberada`). Chip trancado com 🔒; o clique também checa (main.js, só rotas do mapa atual). A rota inicial e o destino depois de capturado respeitam isso.
- **Alfas (chefes)**: `ZONES[i].chefe = { id, nome, nivel }`, sempre acima do teto da zona (teste garante). Botão "⚔ Desafiar" na cena da zona → `startBossBattle`: IVs 31, `statsDeChefe` (HP ×2, resto ×1,3 — `MULT_CHEFE`). Não aceita petisco, dá pra fugir. 1ª vitória: `premioChefe(nível)` + 1 Rare Candy e marca `S.chefes[zona]`; revanche só dá XP.
- **Missões**: `MISSOES` (dados.js), cada uma com `libera` (condição pra aparecer; sem ela, visível desde o início), `objetivo` e `premio`. Condições: `derrotar`+`qtd`, `vitorias`, `amigos`, `nivel`, `chefe`, `treinadores`, `missao` — avaliadas por `progressoCondicao`/`situacaoMissoes` (regras.js, testadas). `verificarMissoes()` (missoes.js) anuncia missão nova 🔓 (`S.missoesVistas`), entrega prêmio 📜 (`S.missoesFeitas`) e é chamada no `finally` de todo turno, depois de explorar e depois de usar item. Ficha mostra as ativas com barra de progresso e quantas seguem escondidas. Teste de dados garante que toda missão aponta pra zona/missão/item que existe.

- **Missões de dinheiro**: `{ dinheiro }` = ter ₽X de uma vez (cai se gastar); `{ gasto }` = total em `S.gasto` (loja + Centro, somado em main.js). Também `{ evolucoes }`. Contagem de "derrotar" segue a facilidade de achar (comum da 1ª rota = 10, raro = 1–3).

## Fim de jornada, carreira e conta

- **Só iniciais na criação**: `REGIOES_INICIAIS` (9 regiões × 3 + Especiais Pikachu/Eevee) em TODOS os modos — Sortear e Full Randomizer também. Flag por modo `especiesLivres` (hoje false em todos, decisão do usuário "a princípio, pode mudar"): true volta a busca livre só naquele modo.
- **Fim de jornada** (`fim.js`, `encerrarJornada(motivo)`): capturado no Hardcore (`'capturado'`), desmaio sem Revive (`'desmaiou'`) ou "Novo jogo" (`'encerrou'` — o botão agora ENCERRA a jornada, não só apaga). Monta o resumo (`montarResumo`: `estatisticasDaJornada` + `pontuacao` × `multPontos`, com `id` da jornada e cópia do registro por espécie), adiciona na **carreira** (`pokerpg-carreira-v1`, lista de TODAS as jornadas terminadas — sobrevive entre jornadas) e apaga o save (aqui e na nuvem). Tela de fim compara com o melhor daquela espécie. `telaCarreira()` (📊, na tela inicial e no topo do jogo fora de batalha) calcula tudo da lista: favorito (espécie mais jogada), máximos (nível, dinheiro de uma vez, missões, vitórias, Alfas), totais, Pokédex (amigos = "capturados" / 1025, faltam, vistos; sprite pelo `registro.ids`), shinies (vistos / amigos / jornadas sendo shiny) e melhor por espécie. Inclui a jornada atual como "em andamento".
- **Conta / nuvem** (Supabase — a Vercel só hospeda; setup em `supabase/COMO-CONFIGURAR.md`, banco em `supabase/migrations/` com RLS): login com Google ou link por e-mail. `sincronizar()` junta a carreira local com a da conta por `id` (`mesclarJornadas`: sobe só jornada de visitante ou da própria conta, nunca de outra conta que logou no mesmo navegador) e reconcilia a jornada em andamento (tabela `saves`, **uma por conta**): mesma jornada → vale a mais nova (`S.salvoEm`); jornadas diferentes → pergunta qual manter; jornada que já terminou em outro aparelho → descartada aqui. Envio do save: `ganchosSave.aoSalvar` → `agendarEnvioSave` (espera 5 s) + na hora ao esconder/fechar a aba. Sem config, tudo é no-op.
- `S.id` (jornada), `S.salvoEm`, `S.maxDinheiro`, `registro.vistos/shinies/shiniesAmigos/ids` foram adicionados pra isso; save antigo ganha `id` ao abrir.
- **Revive / desmaios**: `desmaiosLivres` por modo (Fácil null = ilimitado; Médio+ = 3). `S.desmaios` conta; do 4º em diante cada desmaio gasta um `revive` da mochila, sem ele = Game Over. Revive também reanima aliado desmaiado (½ HP) — único item que `itemTemEfeito` aceita em desmaiado.
- **Tempo de jogo**: `S.tempoMs`, somado em cada `save()` (`marcarTempo`), ignorando pausas > 5 min; o boot zera `S.ultimoTick`.
- **Ordens dos aliados** (`ORDENS`, `A.ordem`, `golpeDoAliado`): livre (mais eficaz) · fraco ("pegar leve", pra não derrubar quem você quer de amigo) · status · parado (em campo, sem agir) · fora (descansando: fora da batalha, não é alvo, sem XP — `emCampo()`). Troca pelo `<select data-ordem>` na ficha, a qualquer hora. Ficha completa do aliado num `<details data-aliado>` (aberto guardado em `G.abertos`).

## Painéis modulares

- Tela do jogo = coluna esq · centro (**cena fixa** → zona de painéis → ações fixas) · coluna dir. Painéis: `ficha`, `missoes`, `aliados`, `mochila`, `log`. **Um layout pro jogo inteiro** (decisão do usuário), salvo em `pokerpg-layout-v1`.
- Modelo puro em `layout.js` (testado em `tests/layout.test.js`): `normalizarLayout` garante cada painel exatamente uma vez mesmo com save velho/quebrado; `moverPainel`/`deslocar`/`trocarZona`/`alternarRecolhido`/`definirLargura`/`definirAltura` nunca mutam.
- DOM em `paineis.js`: `htmlJogo()` (esqueleto), `aplicarLayout()` (MOVE os nós entre zonas — conteúdo e scroll do log vão junto), `tituloPainel(id, html)`, `iniciarPaineis()` (listeners uma vez só: arrastar pelo cabeçalho com marcador, ▲▼⇄▾, divisórias de largura com pointer capture, "↺ Layout"). Altura = `resize: vertical` nativo + ResizeObserver que só grava quando `style.height` mudou.
- `render.js` escreve só o CONTEÚDO de cada painel em `#p-<id>` (`renderFicha/Missoes/Aliados/Mochila`); o `#log` mora dentro do painel `log`. Painel novo: adicionar em `PAINEIS` + `LAYOUT_PADRAO` (layout.js), `TITULOS` (paineis.js) e um `render<X>()`.
- Celular (≤ 880px): uma coluna, cena primeiro, sem arrastar/redimensionar — reordena pelos botões.

## Roguelike (modo principal)

- **Permadeath** (flag `permadeath`, pedido do usuário): desmaiou = `encerrarJornada('desmaiou')` na hora em `lose()` (nem Revive salva); aliado que desmaia é removido de `S.aliados` em `anunciarQuedas` (Centro não traz de volta). Vale no co-op também.
- `DIFICULDADES.roguelike` (primeiro da lista, `G.dif` padrão): flag `desbloqueios` — a criação oferece `INICIAIS` + `desbloqueadas(carreira)` (`permitidos()` em criacao.js, usado na grade, no Sortear e na checagem do `previewSearch`). Captura = fim da run (`fimDeJogo`), 3 desmaios livres, Centro pago com desconto por vitória, nível 5, natureza/habilidade livres, pontos ×1,5.
- `roguelike.js` (puro, `tests/roguelike.test.js`): `progressoRoguelike(jornadas)` soma `registro.derrotados/amigos/evolucoes` **só das jornadas com `dificuldade === 'roguelike'`** (decisão: não dá pra farmar no Fácil) e aplica `DESBLOQUEIO` (dados.js): 10 derrotas · 5 amizades · evoluir 5× pra forma do meio / 10× pra forma final. Iniciais ficam fora (já liberados). Vale pra PRÓXIMA run: só jornadas terminadas contam.
- Forma do meio/final: `evolve()` anota `registro.formas[especie] = 'meio' | 'final'` (final = nó sem `to` na árvore de evolução). `registro.ids` dá o id pra buscar o Pokémon e o sprite.
- Telas: seção "🔓 Desbloqueados" + "Quase lá" na criação (Roguelike), "Desbloqueado pra próxima jornada" na tela de fim (`novosDesbloqueios(antes, depois)`), seção Roguelike na Carreira.

## Ranking global

- `ranking.js` (tela, `G.mode = 'ranking'`) → `buscarRanking(especie|null)` / `especiesRanqueadas()` (nuvem.js) → funções SQL `ranking(p_especie, p_limite)` e `especies_ranqueadas()` (SECURITY DEFINER, devolvem só apelido + números + `eu`). Funciona sem login (só leitura).
- **Pontuação é do servidor**: gatilho `validar_jornada` (schema.sql) recalcula `pontuacao` do resumo e recusa número impossível (nível > 100, Alfas > 7, missões > 36…). **Pesos, multiplicadores e limites do SQL precisam acompanhar `PESOS_PONTOS`, `DIFICULDADES[].multPontos`, nº de Alfas e `MISSOES.length`** — `tests/schema.test.js` falha se divergirem. Modo novo → acrescentar no `case` do SQL.
- Jornada recusada (erro `P0001`) fica marcada `recusada` na carreira local e não é reenviada; as outras sobem uma a uma (uma recusa não trava a sincronização).
- Mudou o schema.sql → usuário precisa rodar de novo no SQL Editor (idempotente).

## Multiplayer (co-op e PvP)

- Decisão do usuário: **os dois formatos**, **sala por código** (4 caracteres, sem lista pública). Até `MAX_JOGADORES` = 6. Funciona sem login (id de visitante em `pokerpg-visitante`), só precisa do Supabase configurado (Realtime).
- Config da sala (anfitrião, broadcast `lobby`): `modo` 'coop'|'pvp', `porJogador` 1–3 (principal + aliados em pé e não "Descansar"; `slot` 0 = principal, k = `S.aliados[k-1]`), `balancear` (padrão **ligado**, pedido do usuário). PvP: cada jogador escolhe `time` A/B (presença). Balancear: co-op → `balancearCoop` (todos no nível do principal do anfitrião = "chamar alguém pra sua run"); PvP → `balancearPvP` (nível médio + HP × (maior/menor) pro time menor). Desligado: níveis reais; co-op com inimigos no nível do mais forte (Alfa +5).
- Escolha é **por Pokémon** (`minhaVez` = próximo Pokémon meu sem ação no turno; `sala.escolhidos` zera a cada turno). Resultado volta por `"dono:slot"` com **fração** de HP (o nível pode ter sido balanceado). PvP é amistoso: só `S.pvp {vitorias, derrotas}`; `desistir` (motor) tira o time inteiro; ninguém foge (`estado.pvp`).
- **Entrada na sala** (`entrada` em multiplayer.js, escolhida no menu): `'run'` (Pokémon da jornada atual, com aliados) ou `'convidado'` (`makeMon` Nv. 5 de `especiesConvidado()` = iniciais + desbloqueados do Roguelike; foto com `convidado: true`; resultado NÃO mexe em save nenhum, nem PvP conta). Sem run: só convidado; anfitrião sem run só abre PvP. Convidado sem balancear: nível do anfitrião (co-op) / média dos outros (PvP).
- **Ganhos voltam só no nível real** (pedido do usuário): `nivelarMon` guarda `nivelReal`; `naNivelReal(m)` vai no `final` de cada Pokémon. Co-op: XP, EVs, dinheiro, item (35% por jogador, `FIND_ITEMS`), vitória e prêmio de Alfa só entram na run se o principal lutou no nível real (aliado idem pro XP dele). Balanceado com nível ajustado = diversão (HP e permadeath continuam valendo).
- **Roguelike no co-op**: principal desmaiado = `encerrarJornada('desmaiou')` (sai da sala antes); aliado desmaiado = removido de `S.aliados` (do maior slot pro menor). Fora do Roguelike, desmaio no co-op volta com 1 HP.
- **Sala resistente a rede ruim** (relato real: escolhas não chegavam e o turno só saía no prazo de 45 s; alt-tab derrubava a sala). `enviar()` confere o retorno do `send` ('ok' | 'timed out' | 'error') e tenta de novo; o anfitrião republica o estado a cada `PULSO_MS` enquanto espera escolhas (`ligarPulso`); evento `sincronizar` + botão 🔄 pedem o estado atual; `CHANNEL_ERROR`/`TIMED_OUT`/`CLOSED` **não** fecham mais a sala (reinscreve até 5×, `sala.conexao`); anfitrião sumido da presença só encerra a sala depois de `ESPERA_ANFITRIAO_MS`. Tudo registra em `diario`/`anotar()` (console `[mp]` + `barraConexao()` na tela). `centroMP()` cura a equipe sem sair da sala.
- `mp-motor.js` (PURO, `tests/mp-motor.test.js`): dois lados A/B com N Pokémon, `fotoDoMon` (cópia enxuta pra rede), `resolverTurnoMP(estado, ações)` (async) → estado novo + eventos em texto (sem HTML — quem exibe escapa), `acaoDaIA`. O golpe em si vem do motor único `golpe.js` (a duplicação antiga com o single player foi eliminada).
- `multiplayer.js`: canal `pokerpg-sala-<código>` (presence = membros com a foto do Pokémon; broadcast `estado`/`acao`/`fim`/`lobby`). **Anfitrião é a autoridade**: gera inimigos (1 selvagem por jogador, ou o Alfa com HP × nº de jogadores), junta as escolhas (só o dono escolhe pelo próprio Pokémon), prazo de 45 s com golpe automático, roda o motor e publica. Cada cliente aplica o `fim` na PRÓPRIA jornada (HP/PP, XP via `gainExp`, EVs, dinheiro, registro, Alfa); desmaio no co-op = volta com 1 HP, não conta desmaio. Anfitrião saiu = sala acaba.
- `render()` só desenha em `G.mode` 'explore'/'battle' — gainExp roda na tela da sala e chama render().

## Ícone e amigos

- **Ícone** `{ id 1–1025, shiny }`: `perfis.icone_id/icone_shiny` (conta) ou `pokerpg-icone` (sem conta; sobe no 1º login). `meuIcone()` (nuvem.js), `htmlIcone(ic, cls)` (conta.js, cai no sprite normal se o shiny faltar). Aparece no chip do topo, ranking (`ranking()` devolve `icone_*`), presença da sala, amigos e convites.
- **Amigos**: `perfis.codigo_amigo` (6 caracteres, gerado no banco) + tabela `amizades` (de→para, pendente/aceita, par único, RLS). `pedir_amizade(código)` (se o outro já pediu, aceita na hora) e `meus_amigos()` (SECURITY DEFINER: só apelido + ícone do outro). Aceitar = update pelo `para`; recusar/cancelar/remover = delete. Lista em `nuvem.amigos` (carregada no sync).
- **Convite pra sala**: cada conta logada ouve `pokerpg-convites-<uid>`; `convidarAmigo(id, {codigo, modo})` manda broadcast no canal do amigo; quem recebe só mostra se o remetente está em `nuvem.amigos` como aceito → `toast` (ui.js) com "Entrar" (`mp-aceitar-convite`).
- `sincronizar()` lê as colunas novas com fallback (`42703`) pra quem ainda não rodou o schema.sql novo.

## Topo (menu ☰) e login

- Header: `#top-dinheiro` (sempre visível) + `#menu-burger` + `nav#menu-links` (`#topr` + `#conta-chip`). No computador `.menu-links` é `display:contents` (tudo em linha); ≤ 720px vira painel aberto pelo ☰ (`iniciarMenu`/`fecharMenu` em ui.js: fecha ao tocar num botão, fora, ou Esc). **Telas fora do jogo limpam o topo com `limparTopo()`**, nunca `#topr.innerHTML = ''` direto (o dinheiro ficaria velho).
- Login: botão `.btn-login` no topo; tela de conta com "Continuar com Google" no padrão visual do Google (`G_LOGO`) + link por e-mail.

## Motor único do golpe e habilidades

- **`golpe.js` é o ÚNICO lugar que resolve um golpe** (`usarGolpe`), estágios (`mudarEstagios`, com `fonte` = quem causou), status (`aplicarStatus`) e fim de turno (`fimDeTurno`: Shed Skin → queimadura/veneno → Speed Boost). Single player e multiplayer usam o mesmo: a diferença é o `ctx` de narração — single player `CTX` em efeitos.js (nome HTML, golpe colorido, `say` com pausa, `render`, `shake`); multiplayer em `resolverTurnoMP` (texto puro, coleta eventos). **Por isso `resolverTurnoMP` é async.** Nunca reimplementar golpe em outro arquivo.
- `habilidades.js`: `HABILIDADES` = tabela de ganchos (documentados no topo do arquivo) → `hab(m)`; `IMPL` = as que têm efeito (ficha mostra "✓ ativa"). Contas (stab, técnico, crítico, pinch, resiste, filtro, multiscale, multStat/comStatus, precisão) em `regras.js` (`calcDamage`, `effStat`, `chanceAcerto`, `imuneAoStatusMon`); o resto (absorção, imunidade de tipo, Wonder Guard, Sturdy, contato, secundários, recuo) em `golpe.js`. Habilidade nova com gancho que já existe = uma linha; gancho novo = código no motor + teste em `tests/habilidades.test.js` (que também falha se aparecer gancho desconhecido na tabela).

## Bugs e sugestões

- `relatos.js` (tela, `G.mode = 'relatos'`) → `enviarRelato` (nuvem.js) → tabela `relatos` (schema.sql: insert pra anon/authenticated, select só dos próprios). Sem config/offline/falha → fila `pokerpg-relatos-fila`, enviada no `iniciarNuvem` e no `online`. Bug pode anexar `contextoTecnico()` (sem dados pessoais; o jogador vê o JSON antes). Quem mantém lê no Table Editor — ou por `ferramentas/relatos-admin.mjs` (só no Raspberry Pi, `node ferramentas/relatos-admin.mjs`): puxa tudo com a **service role key** local (`ferramentas/.relatos-admin.env`, git-ignorado, nunca colar em chat — ver `relatos-admin.env.example`), baixa os prints do bucket privado `relatos-imagens` e monta `relatos-baixados/RESUMO.md`. Puxa só `status = 'novo'` e marca como `lido` (flags `--manter`/`--todos` mudam isso).

### Próximos passos combinados (em ordem sugerida)
- **Evoluções especiais** (pedido do usuário): hoje `loadEvo` só guarda `trigger` e `min_level` — pedras/itens (use-item), troca (Cabo de Conexão no single player; troca real no multiplayer), amizade, dia/noite, golpe conhecido, zona. A PokéAPI traz tudo em `evolution_details`.
- **Batalha completa** (continua): habilidades → clima → terrenos → itens segurados → golpes especiais/IA → Mega, Z-Moves, Dynamax/Gigantamax, Tera. Desbloqueia uma **espécie** pra próxima run ao derrotar ou fazer amizade com 5–10 dela; evoluir 5× pra forma do meio desbloqueia a do meio, 10× pra forma final desbloqueia a final. Exige progresso persistente entre runs.
- **Etapa 4 — Supabase/multiplayer**: ranking de todos os jogadores (melhor pontuação geral por espécie) e batalha com Pokémon de vários jogadores do mesmo lado (a batalha já é N-do-meu-lado).
- Ideias soltas ainda não pedidas: mais missões (por tipo elemental, por zona), recompensa de Alfa diferente por zona, rank/título de explorador.
- **Pedido pelo usuário (27/09/2026), pra depois**: ~~sprites 3D/animados com download opcional~~ ✔ FEITO
  (`dados.SPR_3D`/`SPR_ANIM`, `ajustes.estiloSpriteAtual`, `offline.baixarImagens3D`/`baixarImagensAnimadas`);
  ~~animação na barra de HP ao tomar dano/curar~~ ✔ FEITO (ver "Animação da barra de HP" abaixo); ~~animação de
  ataque, cura e dano de status na cena de batalha~~ ✔ FEITO (28/09/2026, ver "Animações de batalha" abaixo).
- **Backlog (pedido do usuário, 28/09/2026): som no jogo.** Pesquisado: a PokéAPI TEM os **cries** (grito curto de
  cada espécie) no mesmo repositório de sprites já usado (`PokeAPI/sprites`, pasta `cries/`, `.ogg` por id —
  `pokemon.cries.latest`/`legacy` na resposta de `/pokemon/{id}`), então dá pra tocar com a MESMA técnica de
  espelhamento por jsdelivr já usada pras imagens (`dados.espelhar`). **Música de jogo (tema de batalha, de
  rota, vitória) a PokéAPI NÃO tem** — ela é só dados + sprites/cries, nunca teve trilha sonora. Pra ter música
  precisaria de outra fonte, e aí vira uma decisão de risco (trilha original dos jogos = direito autoral mais
  exposto que sprite/dado; trilha própria/livre de direitos = mais seguro, mas exige compor ou buscar external).
  Ainda sem desenho: pelo menos precisa decidir se entra som ligado por padrão (com ajuste de volume/mudo em
  ⚙ Ajustes, mesmo espírito do `presencaLigada`/`REDUCED`) e quais eventos tocam cry (encontro selvagem? seu
  Pokémon entrando em campo? os dois?).
- ✅ FEITO (28/09/2026) — **Modo tutorial**: pedido em 27/09/2026 como "onboarding por funcionalidade" (destacar
  elemento novo na hora em que desbloqueia); quando o usuário voltou a pedir em 28/09/2026 mudou de forma —
  virou um **tour guiado único** combinando explicação com uma **demonstração jogável** (abrir a loja, comprar
  item, lutar, correr risco de ser capturado por um treinador) e um resumo curto das Runs, em vez de vários
  tutoriais pontuais por funcionalidade. Perguntado ao usuário (`AskUserQuestion`) e fechado: abre sozinho **só
  na primeiríssima vez** que o jogo é aberto neste aparelho (sem save nenhum ainda — decidido no `boot()` de
  main.js, antes de `showCreate()`) + fica sempre disponível pra rever num botão `❓ Tutorial` (entrou em
  `navegacao.TELAS`, então aparece de graça na barra de qualquer tela fora do jogo E no menu ☰ dentro do jogo,
  igual qualquer outra tela da lista); é uma **demonstração à parte, com um Pokémon de mentirinha** (um Pichu
  fixo, sprite por id — `dados.SPR`, sem precisar da PokéAPI, porque o tour precisa abrir mesmo na primeiríssima
  visita, antes de qualquer cache) — nunca toca `G.S` nem o save de verdade, todo o estado vive em `G.tut`;
  "já visto" **sincroniza com a conta** (`perfis.tutorial_visto`, `supabase/migrations/20260928130000_tutorial_visto.sql`,
  mesmo padrão de `badge_exibida`), com o navegador como reserva sem conta (`nuvem.tutorialVistoLocal`/
  `salvarTutorialVisto`, idempotente — nunca reenvia depois do primeiro "visto"). **É pulável em qualquer
  passo** (botão "Pular tutorial", filosofia de não travar — mesmo espírito do banner de cookies do `ads.js`) e
  **"Continuar" nunca fica bloqueado**: mesmo os passos interativos (batalha, loja, captura) deixam avançar sem
  ter batido/comprado/revelado nada — forçar uma ação específica pra sair de uma tela é exatamente o tipo de
  trava que o resto do jogo evita. `js/tutorial.js` (puro, sem DOM, `tests/tutorial.test.js`) guarda os dados de
  mentirinha (Pichu Nv. 8, Caterpie selvagem, Treinador Theo) e a lógica de passo/golpe/compra; **o texto de cada
  passo lê dado real em vez de duplicar**: o resumo de Runs e a tabela "o que acontece se eu for capturado" vêm
  direto de `dados.DIFICULDADES` (`d.desc`, `d.semCaptura`, `d.fimDeJogo`) — mudou a regra ali, o tutorial muda
  sozinho, sem re-escrever texto solto. `js/tela-tutorial.js` desenha (reaproveita classes existentes: `.hp`/
  `.bar`/`.fill` pra HP, `.item-btn`/`spriteItem` pra loja, `.difs`/`.abil` pra os cards de dificuldade — quase
  nenhum CSS novo precisou).
- **Pedido pelo usuário (28/09/2026), pra depois:**
  1. ✅ FEITO — **Layout pro celular em modo paisagem (horizontal)**: ver "Celular DEITADO" na tabela de arquivos
     acima (a cena vira coluna lateral, não fica mais presa no topo).
  2. ✅ FEITO — **Marcador de jogadores online no momento** e **estimativa de quantos jogam sem conta**:
     `js/presenca.js` (ver tabela de arquivos acima). O canal de presença global mostra "🟢 X jogando agora" na
     tela inicial pra QUALQUER jogador; o contador histórico de visitantes sem conta é ADMIN-ONLY (pedido
     explícito do usuário: "essa estatística deve aparecer só pra mim admin") — aparece ao lado do marcador
     ao vivo, só pra quem tem `perfis.admin`. Schema em
     `supabase/migrations/20260928120000_visitantes_anonimos.sql` (tabela `visitantes_anonimos` + duas RPCs
     SECURITY DEFINER: `registrar_visitante_anonimo` grava, `contagem_visitantes_anonimos` só devolve o total
     pra admin). Divulgado na tela 🔒 Privacidade (passo 3) e com interruptor em ⚙ Ajustes — decisão própria
     (não pedida explicitamente, mas coerente com "não pode virar telemetria silenciosa" já anotado aqui):
     desligar tira o jogador do canal de presença E do registro de visitante, sem afetar o resto do jogo.
- **Arceus como chefe de raide** (pedido do usuário, 28/09/2026, ligado aos "Pratos do Arceus" na seção 3 de
  badges com vantagem, abaixo): faz sentido temático — nos jogos ele carrega um Prato de cada tipo, item que
  acabou de entrar no jogo. Ainda sem desenho: precisa decidir se entra na rotação dos 14 chefes existentes
  (mudaria o `% 14` do calendário pra `% 15`, ver "Os 14 chefes") ou como um evento à parte.
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

## Modo offline

- `sw.js` (service worker, registrado no `index.html`): arquivos do jogo em **rede primeiro** (online pega sempre a versão nova, sem trocar versão a cada deploy; offline cai no cache), PokéAPI/sprites/esm.sh/fontes em **cache primeiro**, Supabase nunca em cache. **Todo arquivo novo em `js/` entra em `PRECACHE`** — `tests/sw.test.js` falha se esquecer.
- Offline (`offline()` em util.js): `sortearOponente` só sorteia Pokémon já em cache (`pokemonEmCache`/`idsEmCache` em api.js); sem nenhum, `erroOffline` com mensagem clara em vez do erro da PokéAPI. Alfa idem.
- Nuvem offline: envio do save fica pendente; `online` → `sincronizar()` (sobe jornadas terminadas + save; save da nuvem de jornada que já terminou é apagado ali). Se o jogo abriu offline, `iniciarNuvem` tenta de novo no `online` (listeners de rede registrados uma vez só). Selo "📴 offline" no topo (`#conta-chip`), com ou sem conta.
- **O download (`baixarGen`) precisa trazer TUDO o que uma jornada pede, não só os Pokémon.** Já faltou duas vezes, e nos dois casos o jogo dizia "mapa baixado" e falhava no avião: (1) **curva de XP e árvore de evolução** (`loadSpecies`/`loadGrowth`/`loadEvo`) — `criacao.iniciarJornada` pede as três ANTES de montar o save, então sem elas nem dava pra começar uma jornada offline, e `checkEvolution` morria a cada nível; (2) **sprites que falhavam calado** (`fetch(url).catch(() => {})`), que davam ícone de imagem quebrada em uns Pokémon e não em outros. Ao acrescentar qualquer busca nova num fluxo de jogo, perguntar: **isso está no `baixarGen`?**
- **`VERSAO_DOWNLOAD` (offline.js)**: quando a lista do que o download traz cresce, subir esse número. `jaBaixado` exige a marca `baixado-v<N>:gen<G>` (gravada só quando o download termina SEM falha) além dos Pokémon em cache, então quem baixou na versão antiga volta a aparecer como incompleto — `precisaRebaixar(gen)` é essa pendência, separada de "faltam N Pokémon" pra tela não mentir na contagem.
- **`try` largo demais vira diagnóstico errado.** `previewSearch` (criacao.js) envolvia busca de rede E montagem da prévia num `try` só, reportando tudo como `apiErr`. Uma função que faltava (`opcaoShiny`, chamada e nunca escrita) virou "A conexão falhou ao buscar um dado da PokéAPI" — e o jogador passou horas limpando cache e trocando de rede. Hoje são dois `try` com mensagens diferentes. Regra: **só o que fala com a rede pode reportar erro de rede**; o resto mostra o erro de verdade.
- **Função chamada dentro de template literal só quebra quando a tela é desenhada** — `node --check` não pega, e teste de função pura também não, porque a UI nunca roda nos testes. `tests/referencias.test.js` varre `${nome(` em todos os `js/*.js` e exige que `nome` exista ou seja importado.
- **As imagens vêm do `cdn.jsdelivr.net`** (espelho do repositório de sprites da PokéAPI), não do `raw.githubusercontent.com` — diagnosticado num aparelho real: `pokeapi.co` respondia e TODA imagem dava `net::ERR_FAILED`, porque esse domínio é bloqueado em muitas redes. `espelhar(url)` (dados.js) traduz o endereço antigo, e é obrigatório em qualquer lugar que desenhe `m.data.sprite`/`back`/`art`: a própria PokéAPI devolve URLs do raw.githubusercontent dentro dos dados, e o que já está guardado no aparelho (ou no save) continua com o endereço velho.
- **Quem guarda as IMAGENS é o service worker**, não o `api.js`. Sem sw controlando a página (primeira visita, ou logo após Ctrl+Shift+R) o download termina "com sucesso" e nenhuma imagem fica guardada — `semServiceWorker()` (offline.js) detecta e a tela de Ajustes manda recarregar antes de baixar.
- **`navigator.onLine` mente.** Ele só diz que existe interface de rede, não que ela chega a algum lugar (wifi de metrô, portal cativo, 4G ruim = "online"). Por isso `cached()` (api.js) **cai no registro guardado quando o `loader()` falha**, e não só quando `semRede()`. Antes ele descartava um registro bom (por faltar campo novo do `valido`) e morria no fetch: dava "A conexão falhou ao buscar um dado da PokéAPI" e não dava pra começar jornada nenhuma, com o mapa inteiro baixado. Qualquer código novo que decida algo por `offline()`/`onLine` precisa ter um caminho de "tentei e falhou" também.
- **Busca que não é essencial não pode derrubar o fluxo.** `criacao.iniciarJornada` pega a árvore de evolução em `try/catch` e deixa `evo` como `undefined` (≠ `null`, que significa "não evolui"): `progressao.arvoreDe` busca depois e `checkEvolution` marca `evoPendente`. Regra geral: antes de dar `await` numa busca de rede num caminho crítico, perguntar se o jogo precisa DAQUILO agora.
- `apiErr(e)` diz qual dado faltou (`e.url` marcada em `getJSON` → `dadoQueFaltou`). Erro de rede genérico não deixa ninguém consertar nada.
- `cachePrimeiro` (sw.js) usa `match(req, { ignoreVary: true })`: o mesmo sprite é pedido por `fetch()` (download) e por `<img src>` (tela), e o servidor responde com `Vary: Authorization,Accept-Encoding` — comparar cabeçalho aí só serve pra dizer "não tenho" com o arquivo guardado do lado.

## Convenções

- **Nunca gravar arquivo com BOM.** `Set-Content`/`Out-File -Encoding utf8` no Windows PowerShell 5.1 escreve UTF-8 **com BOM**, e isso já quebrou o deploy do banco: o Supabase recusou o `config.toml` com `toml: invalid character at start of key: U+00EF 'ï'` — o BOM lido como caractere. Em .sql, .toml, .json e .yml o BOM é veneno. Para gravar sem: `[System.IO.File]::WriteAllText($caminho, $texto, (New-Object System.Text.UTF8Encoding $false))`. As ferramentas de edição do Claude Code já gravam sem BOM; o risco está nos scripts de `ferramentas/` e em qualquer arquivo escrito via PowerShell.
- **Toda funcionalidade nova atualiza o `README.md`** (o que o jogo tem + a lista de próximos passos/já feito) — pedido explícito do usuário, vale sempre.
- Regra nova (conta, fórmula, probabilidade) vai em `regras.js` como função pura, com teste; o módulo de narração só chama e escreve a mensagem.
- Tudo que só `regras.js`/`dados.js`/`util.js`/`api.js` importa precisa continuar sem DOM (importável no Node).
- `esc()` em todo texto vindo de fora (apelido, dados da API) dentro de template string.
- Estado compartilhado sempre via `G.*` (nunca `let` exportado).
- Fontes: `--display` (Fredoka) para títulos e números, `--body` (Atkinson Hyperlegible) para texto. A Pixelify Sans saiu (confundia 2/5/8); não voltar a usar fonte pixelada em número.
- Logo e ícones: `img/logo.png` (topo e README, fundo transparente), `img/favicon-32.png` e `img/icone-192.png` (quadrados, gerados do logo com margem transparente — o original é 373×309). Estão no PRECACHE do sw.js.

## Testes

`tests/*.test.js` com `node:test` — rodar com `node --test` **sem caminho**. CI em `.github/workflows/testes.yml` roda a cada push/PR (aba Actions do GitHub).

## Supabase: schema sobe sozinho (integração nativa)

> ⚠️ **Ficou mudo por dias por causa de um campo mal preenchido (24/09/2026).** Duas migrations de teste foram
> commitadas no `main` e nenhuma chegou no banco, sem nenhum erro no painel. Causa: o **working directory** estava
> como `/supabase`. Esse campo pede o diretório que **CONTÉM** a pasta `supabase/` — aqui ela está na raiz, então
> o valor certo é **`/`**. Com `/supabase`, ele procurava `/supabase/supabase/migrations` e não achava nada.
> O `supabase/config.toml` também precisa declarar o Postgres do projeto (`select version()` → 17 aqui).
>
> **Como verificar que uma migration chegou** (não confie no painel): consulte a tabela pelo cliente do jogo com
> `select('*').limit(1)` **e uma tabela inexistente de controle**. `select('*', { count: 'exact', head: true })`
> devolve `error` nulo mesmo pra tabela que não existe — esse detalhe fez um diagnóstico dar "tudo OK" e escondeu
> o problema por uma rodada inteira.

O banco é atualizado pela **integração do GitHub no painel do Supabase** (Settings → Integrations → GitHub): repositório conectado, *working directory* **`/`** (a raiz — o campo pede o diretório que CONTÉM a pasta `supabase/`, e não ela mesma), *Deploy to production* ligado na branch `main`. Nada de secret no GitHub — a conexão é do lado do Supabase.

Por isso o schema vive em **`supabase/migrations/`**, no formato do Supabase CLI:

- **Mudança nova = ARQUIVO NOVO**, nunca editar uma migration já aplicada: o Supabase guarda quais já rodaram e não roda de novo.
- **Nome no padrão do CLI**: `<AAAAMMDDHHMMSS>_nome.sql` (ex. `20261001093000_mega.sql`). A integração ordena por esse carimbo; nome fora do padrão ela ignora.
- `20260923120000_base.sql` é o schema inteiro como estava quando adotamos migrations — idempotente, então aplicar num banco que já tem tudo não muda nada.
- **Uma vez só, à mão: `supabase/LIGAR-MIGRATIONS.sql`.** Projeto criado direto pelo SQL Editor (o nosso) não tem a tabela de controle `supabase_migrations.schema_migrations`, e a integração falha com `relation "supabase_migrations.schema_migrations" does not exist` — ela precisa da tabela pra saber o que aplicar, mas não a cria sozinha. Rodar esse arquivo no SQL Editor resolve de vez; depois é só merge no `main`.
- `tests/schema.test.js` lê a pasta inteira (soma das migrations) pra conferir que os pesos de pontuação do SQL batem com os de `regras.js`. **Mudou a fórmula num lado, muda no outro**, senão o servidor recusa jornadas legítimas.
- Nada destrutivo aqui: `drop`/`alter` que possa perder dado de jogador vai num arquivo rodado à mão, porque este fluxo roda sozinho.
## ESTADO ATUAL (25/09/2026) — ler primeiro ao retomar

**As quatro gimmicks estão jogáveis** (Mega, Tera, Z-Move, Gigantamax) e o roteiro de 1 a 7 está fechado.
O que sobrou e o que ficou combinado:

- **Evento semanal** (`evento.js` calendário/elegibilidade/espera de 8 h, `boss.js` regras do chefe, testes em `tests/evento.test.js` e `tests/boss.test.js`):
  `EVENTOS[semana % n]`, semana = segunda→domingo UTC contada de `INICIO` (21/09/2026); só `DIFICULDADES[x].eventoSemanal` (Roguelike/Hardcore) e só na Gen do chefe.
  Aparece na rota FINAL (`z.lendarios`, mesma trava de nível) em `render.blocoEvento` e como sprite com brilho na escolha de Gen (`criacao.renderGens`); botão
  `data-act="evento"` → `mundo.desafiarEvento` → `batalha.startEvento`. A espera fica só no navegador (`evento.TENTATIVA_KEY`) — dá pra burlar pelo relógio; servidor
  valida depois. **O chefe é um Pokémon comum com `E.boss`** (dados puros: vai no save e, no futuro, na rede) e as regras entram em `golpe.js` por 4 ganchos:
  `danoNoChefe` (couraça reduz/Ruptura aumenta, no laço de dano), `aposDanoNoChefe` (desgasta couraça, interrompe carga, fases → efeitos `{dizer,estagios,curaStatus}`
  aplicados por `aplicarEfeitosChefe`), `antesDoChefeAgir` (início de `usarGolpe`: carrega/solta o Eternabeam, que já tem `recarga` em `especiais.js`) e a imunidade
  a status em `aplicarStatus`. Todos os números em `boss.AJUSTES` — a dificuldade se calibra jogando (chute inicial: HP ×5, atributos ×1,3, couraça 16% do HP, ciclo de 4).
  `EVENTO_SEM_PERMADEATH` (evento.js): perder pro chefe não encerra a run nem perde aliado. Vitória → `carreira.registrarVitoriaDeEvento` grava
  `progresso.eventos[id] = {primeiraEm, vitorias, semanas}` + espécie em `progresso.especies` (razão `evento`) — `mesclarProgresso` faz união. Badge `evento-<id>` (grupo `Eventos`,
  `badges.js`); a exibida ao lado do nome é `nuvem.badgeExibida` (localStorage + `perfis.badge_exibida`, migração `20260925120000_badge_exibida.sql`; sem a coluna segue local).
  **Calendário**: `INICIO` = segunda 28/09/2026 00:00 de Brasília (03:00 UTC); a semana vira toda segunda 00:00 BRT (`FUSO_MS`); antes de `INICIO` `eventoDaSemana` é `null` e
  `situacaoDoEvento` devolve `motivo:'em-breve'`. `agenda(agora, 3)` alimenta a tela inicial (`criacao.renderAgendaEvento`). Pra TESTAR antes da data: no console,
  `localStorage.setItem('pokerpg-evento-agora', Date.UTC(2026,8,28,12))` (`evento.RELOGIO_KEY`; qualquer chamada usa `agoraDoEvento()`, nunca `Date.now()` direto).
  **Vários chefes**: `boss.CHEFES[id]` guarda a config (couraça e/ou `pontoFraco`, canhão, fases, ciclo); `E.boss.id` escolhe. Eternatus = couraça + Ruptura; Mega Rayquaza = ponto fraco
  rotativo (`danoNoChefe(t, dano, tipo)` recebe o TIPO do golpe) + Dragon Ascent (`expostoAposCanhao`). Chefe novo = uma linha em `EVENTOS` (evento.js) + uma em `CHEFES` (o teste confere as duas).
  **Co-op** (`multiplayer.iniciarBatalhaMP('evento')`, botão `botaoEventoMP`): `fotoDoMon` leva `boss`; HP por `jogadoresEfetivos(jogadores, porJogador)`; o golpe carregado devolve `todos` →
  `u.boss.soltouTodos` e o `mp-motor` chama `usarGolpe(..., {extra:true})` nos outros alvos (sem nova ação, sem recarga). **Revive**: ação `revive` → `registrarRevive` (anfitrião) →
  `mp-motor.reviverNoEvento` muta o estado NA HORA (o Pokémon já escolhe no turno); `b.revivesUsados[dono]` viaja no estado e cada cliente desconta o Revive da PRÓPRIA mochila em
  `consumirRevives` (o anfitrião não sabe a mochila dos outros). Sem fuga no evento (`s.evento`). Cada participante registra a tentativa de 8 h ao ver o 1º estado (`sala.tentativaEvento`)
  e recebe o prêmio em `premiarEventoMP` só se a SUA run é Roguelike/Hardcore. A insígnia exibida vai no payload de presença (`meuPayload().badge`) e, nas listas persistentes, pelas RPCs `meus_amigos()` e `ranking()` (coluna `badge_exibida`, migração
  `20260925130000_badge_nas_listas.sql`, que exige a `20260925120000_badge_exibida.sql` antes). O servidor só devolve a insígnia se `progresso.dados->'eventos'` contém o evento
  (`badge_exibivel(uuid)`) — não é à prova de fraude (o progresso é gravado pelo jogo), mas impede escolher no perfil algo que nunca foi conquistado. O cliente desenha com
  `conta.htmlInsigniaDe(id)` (topo, amigos, ranking, sala); versão antiga do banco só não traz o campo e nada quebra. **Falta**: os outros chefes e os itens.
  **⚠️ TEMPORÁRIO (pedido do usuário, beta testers, 28/09/2026): `evento.BETA_SEM_ESPERA = true` remove a espera de
  8h entre tentativas** — Arena, run e sala. Implementado SEM tocar `COOLDOWN_MS`/`esperaRestante` (que continuam
  puros e testados com os números reais): a flag entra só em `evento.ultimaTentativaEfetiva()` (finge "nunca
  tentou" quando ligada) e no parâmetro PADRÃO de `situacaoDoEvento` — os testes chamam `situacaoDoEvento` sempre
  com `ultima` explícito, então não veem a flag e continuam garantindo a regra de verdade. `arena.js` troca as duas
  chamadas de `esperaRestante(ultimaTentativa()...)` por `ultimaTentativaEfetiva()` pelo mesmo motivo. **Pra
  reverter**: só `BETA_SEM_ESPERA = false` em `evento.js` — nada mais precisa mudar. Textos que mencionavam "8
  horas" de forma incondicional (`mundo.desafiarEvento`, `criacao.renderAgendaEvento`, `ajuda-chefes.js`,
  `arena.htmlLobby`) agora checam a flag e mostram "🧪 Modo beta: sem espera" em vez de mentir sobre o cooldown.
  **Convite pra jogar em grupo a partir da Arena** (mesmo pedido): a Arena (`arena.js`) é só single-player (Hall da
  Fama, sem outros jogadores — nunca foi multiplayer de verdade). O usuário queria chamar gente de dentro dela;
  como as duas telas são sistemas bem diferentes (Arena não usa sala/rede, co-op usa), a solução foi um cartão
  "👥 Jogar em grupo" no topo do lobby da Arena com um botão `data-act="mp"` que leva direto pra tela de
  Multiplayer — de lá, sala co-op já suportava isso (`MAX_JOGADORES` = 6, `porJogador` 1–3) sem precisar de
  nenhuma mudança de código, só não estava óbvio que o caminho existia.
- **Perfil de amigo** (`perfil-amigo.js` tela, `perfil-dados.js` contas puras; testes em `tests/perfil-amigo.test.js`): botão `data-act="amigo-perfil"` na lista de amigos (e "Ver meu perfil" na Conta) →
  `nuvem.perfilDoAmigo` → RPC `perfil_do_amigo(uuid)` (migração `20260925150000_perfil_do_amigo.sql`, SECURITY DEFINER): só devolve se a amizade está `aceita` (ou é o próprio) e só o que já é público no jogo
  (apelido, ícone, `badge_exibivel`, criado_em, ids dos chefes vencidos, contagem de espécies, números agregados das `jornadas` e as 5 últimas) — sem e-mail, código de amigo ou mochila (o teste confere o texto do SQL).
  **Não** mostra as badges de conta de caçada/coleção/etc.: elas são calculadas NO CLIENTE a partir do progresso+carreira, e mandar isso tudo do servidor seria pesado; ideia futura: um resumo já calculado.
  Sem a migração a tela mostra o erro e diz qual arquivo rodar. Ordem das migrações do dia 25/09: 120000 (badge_exibida) → 130000 (badge nas listas) → 140000 (relatos) → 150000 (perfil do amigo).
- **Arena do Chefe + Hall da Fama** (`hall.js` puro, `arena.js` tela/loop, `ajuda-chefes.js` texto; testes em `tests/hall.test.js`): `encerrarJornada` chama `carreira.registrarNoHallDaConta(S, resumo)` ANTES de zerar `G.S`
  (só modos com `eventoSemanal`) e passa os itens de raide da mochila pro inventário da conta (`evento.darItensDeRaide`, localStorage `pokerpg-raide-v1`, NÃO sincroniza). O Hall vive em `progresso.hall[jornadaId]`
  (entrada compacta: espécie/id, nível, IVs, EVs, natureza, habilidade, NOMES dos golpes; `podarHall` mantém `HALL_MAX`=30; `mesclarProgresso` faz união). **A Arena NÃO usa `G.S`**: roda o motor do co-op
  (`mp-motor`) localmente — lado A = Hall reidratado (`makeMon` + `loadMove`), lado B = chefe (`prepararChefe(E, jogadoresEfetivos(1, n))`) — então não pode mexer no save de uma run em andamento. Por isso não tem item
  segurado, Mega/Tera/Z/Gigantamax nem Revive (o motor do co-op não os tem). Tentativa de 8 h, vitória (`registrarVitoriaDeEvento`) e prêmio de itens de raide iguais ao resto do evento; dinheiro/Rare Candy só dentro de
  uma run. Entradas antigas (jornadas terminadas antes deste recurso) NÃO estão no Hall: só valem as que terminam depois. Ideia de expansão: chefe na Arena em grupo (a base do co-op já serve).
- **Os 14 chefes** (`evento.EVENTOS`, fábrica `ev()`; regras em `boss.CHEFES`, mesma `id`): a ordem do array É o calendário (semana N = `N % 14`). Mecânicas novas além de couraça/ponto fraco/canhão/fases:
  `climaFixo` (`aplicarClimaDoChefe` usa o clima fixo de `novoCampo`; Groudon sol, Kyogre chuva), `anula {tipos}` (dano 0 + texto em `golpe.js`), `inverso {acoes}` (Mundo Reverso: `danoNoChefe(t, dano,
  tipo, ef)` divide pelo ef² do motor, com teto ×4), `adapta {reducao}` (guarda `b.ultimoTipo` DENTRO de `danoNoChefe`), `dreno` (`drenoDoChefe` em `executar`), `regenera` (efeito `{cura}` em
  `antesDoChefeAgir`), `habilidade` (habilidade da tabela do motor: Calyrex `grim-neigh`, Necrozma `neuroforce`, Zacian `intrepid-sword`). **O golpe carregado NÃO pode ser golpe de carga do motor**
  (`especiais.carga`, ex.: Freeze Shock — viraria "preparando" de novo); o teste confere. `EVENTO_SEM_PERMADEATH` vale pra todos. **Simplificações a lembrar**: as duplas (Zacian+Zamazenta,
  Dialga+Palkia) viraram UM chefe cada; Mewtwo troca pro "modo X" só como bônus de atributo (fase 2) — não há troca de forma/sprite; Kyurem não ignora habilidades do jogador.
- **Itens de raide** (`dados.ITEMS[x].raide`, `boss.usarItemDeRaide`): 10 consumíveis, UM de cada tipo por luta (marca
  em `E.boss.raide`), só valem com `E.boss`: `cristal-de-ruptura`, `selo-de-interrupcao`, `escudo-astral` (os 3
  originais) + `cinza-vulcanica`, `escama-abissal`, `prisma-de-luz`, `espelho-reverso`, `relogio-de-areia`,
  `fragmento-tera`, `celula-zygarde` (28/09/2026, ver abaixo).
  Single player: `itens.useItem` → `usarRaide` (gasta o turno). Co-op: ação livre `raide` → `multiplayer.registrarRaide` (anfitrião) → `mp-motor.usarRaideNoEvento`; `b.raideUsados[dono][tipo]` viaja no estado e
  `consumirRevives` desconta da PRÓPRIA mochila. Escudo Astral = `b.canhaoMult` (0,5) consumido no próximo golpe carregado; `canhaoUltimoMult` faz os outros alvos do co-op levarem o mesmo corte.
  Vêm de prêmio: `evento.ev()` dá 2 de um dos 3 originais + 1 de um dos 14 novos (7 consumíveis + 7 segurados), girando cada grupo no próprio módulo.
  **✅ FEITO (28/09/2026) — os 14 itens do backlog aprovado.** `usarItemDeRaide(E, tipo, ladoJogador)` ganhou um
  3º parâmetro (os 3 originais ignoram): `cinza`/`abissal` escrevem `ladoJogador.resisteRaide = {tipo, turnos:3}`
  (novo campo em `regras.LADO_VAZIO`, decrementado em `passarLado`, lido por `regras.multResisteRaide` em
  `calcDamage` — igual a `multTelas`); `prisma` reusa `exporChefe` (a MESMA Ruptura, mas com `cfg.pontoFraco`
  como porta em vez de `cfg.coura` — dá contra-jogo pra lutas sem couraça); `espelho` é uma inversão de tabela
  TEMPORÁRIA e independente do `b.reverso` do Giratina (`b.espelhoAcoes`, decrementado em `antesDoChefeAgir`,
  checado em `danoNoChefe` junto com `b.reverso`); `celula` liga `b.semRegen` (checado onde `cfg.regenera` cura,
  em `antesDoChefeAgir`), só funciona em chefe com essa mecânica (hoje só Zygarde Completo). **`relogio` e
  `fragmento` não sabem QUAL Pokémon usou nem se o Tera já saiu** — isso mora no estado de cada motor, não no do
  chefe — então `usarItemDeRaide` devolve marcadores (`{estagios:[['speed',2]]}`, `{recarregaTera:true}`) que os
  TRÊS chamadores resolvem: `itens.usarRaide` (`changeStats(S.player,...)` + `G.B.teraUsada=false`),
  `mp-motor.usarRaideNoEvento` (aplica direto em `vol.stages` do PRINCIPAL de quem usou — sem `ctx` de narração
  nessa ação livre, então Clear Body/Simple/Contrary não entram nesse +2 específico — e reseta
  `estado.gimmicksUsados[dono].tera`) e a Arena (`arena.arenaRaide` já chama o MESMO `usarRaideNoEvento` do
  co-op, então herda de graça). **7 itens SEGURADOS novos** (`dados.ITENS_RAIDE_SEGURADOS`, sem `price` — só vêm
  de prêmio, nunca da loja; `segurados.IDS_SEGURADOS` agora soma as duas tabelas): `nucleo-eternamax`
  (`danoTipo` + `multStat`, gancho `danoTipo` NOVO em segurados.js — dano por tipo do PRÓPRIO golpe, igual ao
  `danoTipo` de habilidades.js mas pro item), `escama-do-ceu`/`cristal-psiquico`/`cristal-gelido` (`resisteTipo`,
  gancho NOVO — dano RECEBIDO daquele tipo, novo `regras.resisteDoItem` chamado em `calcDamage` do lado de quem
  DEFENDE, mesmo espírito de `ht.resiste` das habilidades), `redea-espectral`/`emblema-da-coroa`/`presa-da-lua`
  (ganchos que já existiam: `multStat`/`multDano`/`drenaDano`). **Simplificações assumidas** (documentado no
  próprio código): Rédea Espectral vira só +20% Velocidade (sem a prioridade no 1º turno do design original —
  exigiria threading de "é o turno 1" nos dois motores de ordenação); Emblema da Coroa vira +15% de dano fixo
  (sem depender de "lutar acompanhado" — mesma classe de problema que fez a habilidade Friend Guard ficar de
  fora da 5ª leva: `calcDamage` não recebe o roster de aliados do atacante).
- **Loja de preparo da Arena** (28/09/2026, `progresso-conta.js` + `carreira.js` + `arena.js` — revisada no MESMO
  dia, ver abaixo): saldo de conta em dinheiro, só usável ali — `FRACAO_SALDO_ARENA` (10%) de `maxDinheiro` de
  CADA jornada bancada (`porJornada[id].maxDinheiro`, campo novo nessa entrada), somado pra sempre e nunca encolhe
  (mesmo princípio do resto de `progresso-conta.js`). `saldoArenaGanho`/`saldoArenaDisponivel`/`gastarSaldoArena`
  são puras e testadas; `gastoArena` mescla pelo MAIOR valor entre os dois lados (é gasto, não conquista — perder
  o controle de quanto já foi gasto deixaria comprar de graça). `carreira.saldoArenaDaConta`/`gastarSaldoArenaDaConta`
  fazem a ponte com `localStorage`.

  **✅ CORRIGIDO — bug real relatado pelo usuário: "itens equipáveis e itens de uso dentro da Raid não estão
  funcionando, não tem lugar pra selecionar eles pra usar".** Causa raiz: `progresso-conta.bancar()` pula
  jornadas cujo id JÁ está em `porJornada` (`if (p.porJornada[j.id]) continue`) — certo pra não reprocessar à toa,
  mas isso também pulava o BACKFILL de `maxDinheiro`: quem já tinha a conta com jornadas bancadas ANTES desse
  campo existir (ou seja, qualquer conta com carreira anterior a hoje) ficava com `maxDinheiro` sempre ausente
  nessas entradas — `saldoArenaGanho` somava zero pra sempre, então TODO botão de comprar ficava "Saldo
  insuficiente" desabilitado, e sem nada comprado não havia nada pra equipar nem usar (a seção "🎽 Equipar item"
  também mostra a mensagem de "compre primeiro" quando `donos.length === 0`). Corrigido: `bancar()` agora, pra
  jornada JÁ bancada, atualiza só o campo que falta (`Math.max` — nunca encolhe) em vez de pular a entrada
  inteira. Autocorretivo: `atualizarProgresso()` já roda (e salva) a cada vez que a tela da Arena é aberta, então
  o saldo se ajusta sozinho na próxima visita, sem precisar de migração à parte. `tests/progresso-conta.test.js`
  ("bancar preenche maxDinheiro de jornada JÁ bancada antes desse campo existir") trava a regressão.

  **Revisão do que a loja vende (mesmo dia, pedido do usuário: "não era pra comprar item de raide, e sim cura,
  revive, stat e itens de segurar").** A primeira versão vendia os 10 itens de raide — **errado**, esses
  continuam só de prêmio (`ITENS_DE_RAIDE`, exibidos como lista comum no lobby, sem botão de comprar). `htmlLoja`
  agora vende, pelo MESMO preço da loja normal (`ITEMS[id].price`, pago com saldo em vez de dinheiro de run):
  `CURA_ARENA` (16 itens: Potion…Full Restore, curas de status, Ether/Max Ether, **Revive e Max Revive juntos** —
  o pedido incluía revive explicitamente), `STATS_ARENA` (os 5 X-itens) e os 13 `ITENS_SEGURADOS` clássicos
  (Restos, Orbe da Vida…). **Pratos do Arceus e os 7 segurados de prêmio de raide NÃO entram** (continuam
  exclusivos de badge/prêmio — não é o que foi pedido, e manteria a exclusividade que acabou de ser desenhada
  pra eles). Cura/stat se compram QUANTAS vezes o saldo permitir (se gastam no uso, sem teto de estoque — como
  a loja normal); item de segurar se compra **UMA vez só** (botão desliga com `inventarioRaide()[id] > 0`) porque
  não se GASTA equipando, só ocupa um slot — ver abaixo.

  **Equipar item de segurar** (`htmlEquipar`, entre "Seu Hall da Fama" e a Loja): pra cada Pokémon selecionado
  pra luta, um `<select data-arena-equipar>` lista os segurados que a conta já possui; a escolha fica em
  `equipamento[chave do Hall]` (memória, não localStorage — resetado em `arenaFim`), aplicada em `M.item` só na
  hora de `reidratar()` (montar o Pokémon pra luta). Um item físico não pode estar em dois Pokémon ao mesmo
  tempo: escolher o mesmo id pra outro automaticamente tira de quem tinha antes (`arenaEquipar`), e o `<option>`
  avisa "(tira de Fulano)". **Simplificação assumida**: equipar NÃO gasta o item do estoque — a Arena não tem
  onde guardar "quem está com o quê" entre tentativas (o Hall não tem campo de item, diferente da run), então a
  saída mais simples é: comprado uma vez, reutilizável em toda luta futura, pra sempre. Isso vale até pra itens
  que no jogo normal se GASTAM na batalha (Faixa de Foco, as frutas) — na Arena eles nunca desaparecem de
  verdade, mais generoso que numa run de verdade, mas evita construir um sistema de "empréstimo por luta" só
  pra cá. `main.js` liga o `change` do `<select>` (`data-arena-equipar`) — não existe handler genérico de
  `data-act` pra `change`, então entrou como um `if` a mais no listener de `change` já existente (ao lado de
  `data-ranking-especie`).

  **✅ CORRIGIDO (28/09/2026) — segundo bug real, relatado de novo pelo usuário: "os itens equipáveis e
  consumíveis não estão funcionando, não consigo equipar".** Diferente do primeiro bug (saldo travado em ₽0):
  desta vez o saldo descontava certinho na compra, mas **o item nunca entrava no inventário** — confirmado
  reproduzindo o fluxo inteiro com jsdom (seleção do Hall → compra → checar `pokerpg-raide-v1`): depois de
  `arenaComprarSegurado('leftovers')`, o saldo caía mas `inventarioRaide()` continuava `{}`. Causa raiz:
  `evento.darItensDeRaide()` tinha uma lista própria, `IDS_DE_RAIDE = ['cristal-de-ruptura', 'selo-de-interrupcao',
  'escudo-astral']` — os TRÊS itens de raide originais, de ANTES da Loja de preparo existir — e rejeitava em
  silêncio qualquer id fora dela. Ninguém atualizou essa lista quando a Loja passou a comprar Potion, X Attack,
  Restos, Orbe da Vida etc. pela MESMA função: `arenaComprarComum`/`arenaComprarSegurado` chamavam
  `darItensDeRaide({[id]:1})` normalmente, a função rodava sem erro, só que o `if (IDS_DE_RAIDE.includes(k) ...)`
  descartava a entrada — sem exceção, sem aviso, o dinheiro simplesmente sumia. Isso também afetava o prêmio
  semanal da Arena (`arena.finalizar`) e o repasse da mochila da run pro Hall ao terminar uma jornada (`fim.js`
  linha ~40): qualquer um dos 14 itens de raide mais novos (além dos 3 originais) sofria o mesmo descarte.
  **Corrigido**: a validação interna virou `ITEMS[k]` (o id existe de verdade) em vez da lista de 3 — cada
  chamador já cura o que manda (as listas `CURA_ARENA`/`STATS_ARENA`/`ITENS_SEGURADOS` em `arena.js`, o filtro
  `ITEMS[k]?.raide` em `fim.js`/`arena.finalizar`), então não precisa de uma segunda whitelist redundante e
  desatualizável dentro da função. `IDS_DE_RAIDE` foi removida (não sobrava uso nenhum fora desta função).
  `tests/hall.test.js` reescrito pra travar exatamente este caso (`potion`/`leftovers`, fora dos 3 originais,
  precisam entrar).

  **✅ FEITO (28/09/2026) — `js/loja-conta.js`: Loja de preparo + Hall da Fama extraídos, compartilhados com o
  Multiplayer.** Junto do segundo bug acima, `arena.js` tinha a ÚNICA implementação de "comprar com o saldo da
  conta" e "reconstruir um Pokémon do Hall fora de uma run" — exatamente o tipo de duplicação que already causou
  o bug (duas listas de validação que podem desalinhar). Extraído pra `js/loja-conta.js` (tem rede —
  `loadPokemon`/`loadMove` — mas sem DOM, quem desenha continua sendo a tela): `comprarComumConta`/
  `comprarSeguradoConta` (a compra em si), `htmlLojaConta`/`htmlEquiparConta` (o HTML, genérico — quem chama passa
  os `data-act`/`data-*` de cada tela) e `reidratarHall` (a reconstrução do Pokémon). `arena.js` foi reescrito
  pra usar isso (mesmo comportamento, confirmado com o mesmo repro de jsdom do bug acima).

  **✅ FEITO (28/09/2026) — ☄ Sala de Raide: enfrentar o chefe da semana em grupo sem run nenhuma
  (`js/multiplayer.js`).** Pedido do usuário: "pra iniciar uma raide multiplayer eu preciso criar um save novo,
  isso não está certo" — verdade: `iniciarBatalhaMP` sempre exigiu `temRun()` pro modo co-op inteiro (`if
  (!temRun()) throw new Error('Co-op é jogar a run de alguém...')`), incluindo a luta do chefe da semana em
  grupo. Um TERCEIRO valor de `sala.config.modo` (além de `'coop'`/`'pvp'`): **`'raide'`** — nenhum jogador
  precisa de run, cada um leva de 1 a `MAX_TIME_HALL` (3) Pokémon do PRÓPRIO Hall da Fama (mesma fonte da Arena,
  `carreira.hallDaConta()`) e compra/equipa da PRÓPRIA Loja de preparo (`js/loja-conta.js`, acima) — tudo local,
  sem afetar os outros jogadores. **Seleção vira "foto" pela MESMA `fotoDoMon` de sempre**: `sala.hallSel`
  (seleção + equipamento, só meu) alimenta `atualizarHallMons()` (async — busca na PokéAPI via `reidratarHall`)
  que guarda o resultado em `sala.hallMons`; `minhasFotos()` ganhou um terceiro ramo (antes do `convidado`) que
  usa `sala.hallMons` quando `sala.config.modo === 'raide'` — o resto do jogo (montarLado, mp-motor, presença)
  nunca soube a diferença, porque uma "foto" de Hall é só mais uma foto. **"Pronto"**: `sala.pronto` (booleano,
  local) entra no payload de presença (`meuPayload().pronto`); `todosProntosParaRaide()` (`sala.membros.every(m
  => m.pronto && m.mons?.length)`) trava o botão "☄ Começar a Raide" do anfitrião — pedido explícito do usuário
  ("quando todos derem pronto, a Raid começa"). **Construção do chefe SEM run**: dentro de `iniciarBatalhaMP`,
  um `if (cfg.modo === 'raide')` que chama `eventoDaSemana(agoraDoEvento())` DIRETO (nada de
  `situacaoDoEvento({dificuldade, gen})`, que exige a run do anfitrião) e seta `tipo = 'evento'` — o resto do
  turno inteiro (ESPERTEZA.chefe, revive, itens de raide, clima fixo do chefe, cooldown de 8h por jogador) é
  **reaproveitado de graça**, porque tudo isso já era condicionado só a `sala.tipo === 'evento'`/`b.evento`, nunca
  a "tem run". **Resultado não mexe em run nenhuma**: `raideSemRun()` (`sala.config.modo === 'raide'`, sincronizado
  a todo mundo pela própria `sala.config` que já viaja no broadcast `'lobby'` — não precisou de um campo novo no
  estado da batalha) guarda `aplicarCoop` (desvia pra `aplicarRaideSemRun`, que nunca toca `G.S` e nunca é
  permadeath) e os pontos que liam `G.S.bag` durante a luta (`consumirRevives`, `consumirItensComuns`,
  `raideDisponiveis`, `itensComunsDisponiveis`, `podeReviver`, `gimmicksDisponiveisMP`, `centroNaSala`) — sem
  isso, um jogador que TAMBÉM tivesse uma run aberta enquanto jogava a Sala de Raide teria itens/gimmicks da
  RUN aplicados num Pokémon do HALL, ou a run debitada por engano. **Prêmio**: `aplicarRaideSemRun`/
  `premiarRaideSemRun` espelham exatamente `arena.finalizar` (mesma função `registrarVitoriaDeEvento` +
  `darItensDeRaide` da conta) — dinheiro/Rare Candy nunca saem daqui, só de dentro de uma run de verdade.
  **Simplificação assumida**: sem Mega/Tera/Z-Move/Gigantamax na Sala de Raide (mesma limitação da Arena — o
  motor do co-op fora de uma run não tem isso) e sem balancear/zona (Hall sempre no nível real, como a Arena).
  O caminho ANTIGO (co-op dentro da run do anfitrião, botão `☄ Chefe da semana` no modo Co-op) continua existindo
  do lado do modo `'raide'` na mesma lista — quem prefere lutar com o Pokémon da run de verdade (XP/dinheiro reais)
  ainda pode.

  **✅ FEITO (28/09/2026) — itens DURANTE a luta na Sala de Raide** (prioridade pedida pelo usuário logo depois
  da leva acima; antes só dava pra escolher/equipar no lobby). `minhaMochila()` (novo, único ponto de decisão) —
  `raideSemRun() ? inventarioRaide() : G.S.bag` — substitui os vários `if (!temRun()...)` espalhados;
  `raideDisponiveis`/`botoesRaide`, `itensComunsDisponiveis`/`botoesItemComum` e `podeReviver` leem daqui em vez
  de checar a run direto. **Revive na Raide usa `mp-motor.reviverCompanheiro`, não `reviverNoEvento`**: a regra de
  sempre (`registrarRevive`, host) exige o TIME INTEIRO caído; `reviverCompanheiro` (a mesma função que a Arena já
  usa) deixa reviver com o time ainda lutando, contanto que tenha pelo menos um de pé — por isso o botão
  `botoesReviver()` (extraído, usado nos TRÊS estados da tela: sem ninguém de pé, esperando os outros, e no seu
  turno normal) aparece bem mais cedo na Raide do que fora dela. **Aceita Max Revive**: o cliente manda
  `acao.pct` (100 se tiver Max Revive no inventário de conta, preferido sobre o normal — mesma prioridade da
  Arena); `reviverCompanheiro` ganhou `estado.revivesTipos[dono]` (lista, mesma ordem de `revivesUsados` — que é
  só um contador, não diferencia QUAL item) pra `consumirRevives` (cliente) saber exatamente qual dos dois
  descontar do inventário de conta a cada uso. `tests/evento-coop.test.js` trava o `revivesTipos`. **Sem mudança
  no motor de verdade**: `usarItemComumMP`/`usarRaideMP` continuam mandando a MESMA ação de sempre
  (`{tipo:'item'|'raide', ...}`) pro `mp-motor.resolverTurnoMP`/`usarRaideNoEvento` — eles nunca souberam de bag
  nenhuma, só o Pokémon; a única coisa que mudou foi QUAL mochila o CLIENTE lê pra mostrar o botão e descontar
  depois.

  **Usar item comum em batalha** (`arenaUsarItem`): ocupa a vez de quem usar, exatamente como no multiplayer —
  `botoesItemComum` filtra `inventarioRaide()` por `!SEM_BATALHA_MP.some(...)` (exportado de `multiplayer.js`
  pra não duplicar a lista) e `regras.itemTemEfeito`, e a escolha vira `{ref, tipo:'item', item:id}` — o MESMO
  formato de ação que `mp-motor.resolverTurnoMP` já processa (passo "0b" do motor, existia desde "Itens no
  multiplayer" abaixo); **nenhuma linha nova no motor foi precisa** pra isso funcionar na Arena. Depois do turno
  resolver, `resolverTurno()` desconta da Loja de preparo os ids que tinham `tipo:'item'` em `arena.escolhas`.

  **Reviver um caído** (`arenaReviver`, ação LIVRE — não ocupa a vez de ninguém): `mp-motor.reviverCompanheiro`
  é uma generalização de `reviverNoEvento` (o Revive de grupo do multiplayer) SEM a exigência de "o time inteiro
  caiu" — essa exigência nunca abriria na Arena, que só tem UM `dono` em `lados.A` (pra ele, "o time caiu" e
  "ele não tem mais ninguém de pé" são a MESMA condição, e a luta já teria terminado antes de dar chance de
  reviver). `reviverCompanheiro` é, na prática, a regra NORMAL de Revive de uma run de verdade (qualquer aliado
  caído, a qualquer momento, se você tem o item) — restaura paridade, não inventa poder novo; continua com o
  mesmo teto `MAX_REVIVES` (3) por luta. Ganhou um 4º parâmetro `pct` (50 = Revive, 100 = Max Revive — `arenaReviver`
  prefere Max Revive se tiver os dois em estoque). Testado em `tests/evento-coop.test.js` com um helper `timeSolo`
  novo (3 Pokémon do MESMO dono, diferente de `luta()` que modela multiplayer — 1 Pokémon por jogador).
- **Sucker Punch** (`soSeAlvoAtaca` em `especiais.js`): `vol.golpeEscolhido` é preenchido por `batalha.turn`/`mp-motor` antes de resolver o turno e apagado em `fimDaRodada`;
  falha se o alvo escolheu status, não escolheu golpe (item/fuga) ou já agiu (`primeiro` falso).
- **Badges de parceiros** (`badges.js`, grupo `Parceiros`): `casa-cheia` (venceu com `equipeCheia && esconderijoCheio`, 2+30 parceiros),
  `lobo-solitario` (venceu com `amigos === 0`) e `cemiterio` (`ALVO_PERDIDOS` = 15 aliados PERDIDOS de vez numa MESMA run). Medem uma jornada, nunca a
  soma; ignoram `easy`; as duas de vitória usam `venceu(j)`. Dados novos no resumo da jornada (`fim.montarResumo`: `casaCheia`, `aliadosPerdidos`) e no
  `progresso-conta.bancar` (senão somem — o resumo é lista branca). `S.aliadosPerdidos` sobe em `batalha.anunciarQuedas` e no co-op (`multiplayer`), SÓ em modo
  `permadeath`: nos outros o aliado só desmaia e volta, então "perder" = cair de vez (na prática, Roguelike). Jornadas antigas não têm os campos (contam 0).
- **Insígnia Alpha** (`js/alpha.js`, testada em `tests/alpha.test.js`): sem tabela nem contador — é a data de criação da conta
  (`perfis.criado_em` → `nuvem.criadoEm`, lida em `sincronizar`) antes de `ALPHA_ATE`. `htmlCartaoAlpha` na tela Conta e `htmlInsigniaAlpha({compacto})`
  no chip do topo (`conta.js`); ids do SVG únicos por desenho (`seq`). **Depois de anunciar o Beta, NÃO mexer em `ALPHA_ATE`** (é o que faz a insígnia valer).
  Não aparece no ranking/salas: esses dados de OUTROS jogadores não trazem `criado_em`.
- **Clima das rotas é OPCIONAL por jornada**: `S.climaRotas` (escolhido na criação, caixa `#pv-clima`, `G.climaRotas`), ou forçado por
  `DIFICULDADES[x].climaRotasFixo` (Roguelike e Hardcore: caixa marcada e travada). Sempre perguntar via **`regras.climaDasRotasAtivo(S)`**
  (cobre save antigo sem o campo) — `batalha.iniciar` e `multiplayer` (co-op, run do anfitrião) só passam a rota a `novoCampo` se ativo.
  **Mega do inimigo**: `mega.inimigoMegaLiberada(E)` = nível ≥ `NIVEL_MEGA_INIMIGO` (40), checado em `batalha.megaDoInimigo` SEM marcar
  `megaInimigoUsada` (o Tera do inimigo, que só usa `inimigoPodeMega`, segue livre em qualquer nível). O 40 é o NÍVEL do Pokémon inimigo.
- **Clima/terreno padrão de rota**: `regras.CLIMA_DA_ROTA` (id da rota → `{clima}` ou `{terreno}`; testado contra `dados-mapas.js`
  em `tests/clima-rota.test.js`; Santuário e luta final ficam de fora) e `novoCampo(rotaId)`, usado por `batalha.iniciar`
  (`G.S.zone`) e `mp-motor.novaBatalhaMP` (`opcoes.zona`, só co-op; PvP = campo limpo). O campo ganhou `climaFixo`/`terrenoFixo`
  (o contador não anda — não usar `Infinity`, que vira `null` no JSON do save) e `padrao {clima, terreno}`. `golpe.mudarClima`/
  `mudarTerreno` desligam o fixo (troca dura 5 turnos; repetir o mesmo da rota é no-op); `passarClima`/`passarTerreno`, ao
  esgotar, RESTAURAM o padrão da rota. **Weather Ball**: `regras.golpeDoClima(g, clima)` devolve uma CÓPIA com tipo/poder do
  tempo — usada em `golpe.executar` (o PP já foi gasto no original) e nos botões (`render.js`, `multiplayer.js`). **Castform**
  (`forecast` → `formaDoClima`): `golpe.ajustarForma` troca `m.data` por uma CÓPIA (tipos + sprite pelos ids 10013/14/15) ao
  entrar, no começo de todo `usarGolpe` (usuário e alvo) e no fim do turno; `desfazerForma` roda em `endBattle`. Cherrim
  (Flower Gift) só tem o bônus de atributo, sem troca de sprite.
- **Item 8 — habilidades**: seis levas feitas. A regra que vale: só entra habilidade com gancho FIEL —
  mapear no gancho errado deixaria a habilidade mais forte que o original, e a ficha promete "✓ ativa em batalha".
  A **4ª leva** (41 novas + 13 parciais completadas) criou ~24 ganchos, todos documentados no topo de
  `habilidades.js` e validados em `tests/habilidades.test.js` (a lista `ganchos` do teste precisa ganhar o nome de
  todo gancho novo; o teste também confere tipo/status/atributo/família de cada um). Onde mora cada um:
  `calcDamage`/`effStat`/`chanceAcerto` em `regras.js` (`danoTipo`, `danoTipoClima`, `golpesFamilia` — lista de nomes
  em `FAMILIAS_GOLPE`, porque a PokéAPI não marca soco/mordida/corte —, `recuo`, `superEfetivoCausado`,
  `critContraStatus`, `abaixoDeMetade`, `soStatus`, `ignoraEstagios`, `limitaStatus`) e `golpe.js` (`mudarEstagios`:
  `inverteEstagios`/`dobraEstagios`/`espelhaQueda`/`aoSerBaixado`; `executar`: `aoSerAtingido` via `reagirAoGolpe`
  — UMA reação por golpe, mesmo com vários acertos —, `aoNocautear`, `toque`, `contato` com `sorteio`/`estagio`/`po`;
  `usarGolpe`: `pressao`, `preguica` (`vol.folga`), `bloqueiaPrioridade`; `fimDeTurno`: `curaComVeneno`;
  `semDanoIndireto` é o helper `indireto(m)`, checado em todo dano que não vem de golpe direto).
  **`golpe.aoEntrarEmCampo(entrantes, oponentesDe, ctx)`** é a regra ÚNICA de entrada em campo (Intimidate com
  `imuneIntimidacao`/`intimidaSobe`, clima, terreno, `estagioAoEntrar`, Download `analisa`): `batalha.intimidar`
  (single player) e `mp-motor` (turno 1) só a chamam — antes o multiplayer não tinha Intimidate nem `estagioAoEntrar`.
  Ficaram de fora, documentadas no fim da tabela: Sticky Hold (nenhum golpe rouba item), Regenerator/Natural Cure
  (agem ao trocar), Beast Boost, Analytic, Mold Breaker & cia. **Cuidado ao editar a tabela**: o teste que detecta
  habilidade duplicada varre o bloco com uma regex — não escreva `nome: {` dentro de comentário da tabela.
  **5ª leva** (trabalho noturno autônomo, 27/09/2026 — ver `feedback_autorizacao_raspberry_pi`): 6 habilidades,
  6 ganchos novos (`multMaiorStatClima`, `multMaiorStatTerreno`, `prendeTipo`, `anticipa`, `sincroniza`,
  `flinchChance`), escolhidas por já terem hook DISPONÍVEL no motor de hoje (clima/terreno, `consegueFugir`,
  `aoEntrarEmCampo`, `aplicarStatus` com `fonte`, o cálculo de recuo em `executar`) — não abriram mecânica nova.
  **Protosynthesis/Quark Drive**: reforçam o MAIOR atributo BASE (empate: Atk>Def>SpA>SpD>Spe), ×1,3 ou ×1,5 se o
  maior for Velocidade (regra FIXA dos jogos — por isso o multiplicador não mora na tabela de habilidades, é
  `regras.multMaiorStat`, só o gatilho de clima/terreno mora lá). `regras.maiorStatBase(m)` lê `m.data.base`.
  **Simplificação assumida**: só o gatilho de clima("sol")/terreno(Elétrico) está aqui — Booster Energy (item que
  ativa a mesma coisa fora do clima/terreno certo) ainda não existe no jogo. **Magnet Pull**: `consegueFugir` ganhou
  o parâmetro `preso` (regras.js não sabe de habilidade — `batalha.js`/`mp-motor.js` resolvem `hab(inimigo).prendeTipo`
  e mandam o booleano pronto); Run Away segue ignorando até isso. **Anticipation**: só narra (sem stat/estágio
  nenhum) se algum oponente tiver golpe super efetivo, OHKO ou autodestrutivo — `golpe.aoEntrarEmCampo`, reaproveita
  `especial(g).ohko`/`autoDesmaio` e `typeEff`. **Synchronize**: `aplicarStatus` já recebia `fonte` (pra Salvaguarda);
  ao aplicar burn/paralysis/poison com sucesso, se há `fonte` viva sem status, devolve o MESMO status pra ela com uma
  chamada recursiva passando `fonte: null` — é isso que impede ida-e-volta infinita se os dois tiverem a habilidade.
  Sono/congelamento não sincronizam (fiel aos jogos). **Stench**: 10% de recuo extra em golpe de dano que ainda não
  tem `meta.flinch` própria (senão dobraria a chance à toa).
  **6ª leva** (28/09/2026): 3 habilidades — Sheer Force, Unnerve, Friend Guard —, mais trabalhosas que a 5ª
  (cada uma abriu um gancho/contrato novo, não só reaproveitou hook pronto). `regras.temSecundario(move)` decide
  se o golpe TEM efeito secundário nativo (estágio, status ou recuo por chance — olha `move.stats`/`move.meta`
  direto, sem saber de habilidade); **Sheer Force** usa ela pra bater ×1,3 em `calcDamage`, e `golpe.executar`
  guarda os TRÊS blocos que aplicam efeito secundário (estágio no golpe, status, flinch) com `!hu.sheerForce` —
  time bate mais forte, mas perde o efeito, exatamente como nos jogos. **Unnerve**: `golpe.comerFruta(m, ctx,
  travado)` ganhou um 3º parâmetro — `executar` manda `hu.unnerve`/`ht.unnerve` do lado de FORA na troca direta de
  golpe (`comerFruta(t, ctx, hu.unnerve)`, i.e. quem ataca trava a fruta de quem apanha). **Simplificação
  assumida**: só vale nessa troca direta (é onde os dois lados já estão em mãos, sem precisar de lista de lados) —
  o `comerFruta` chamado no FIM DE TURNO (`fimDeTurno`, pra cada Pokémon do campo) não checa Unnerve do oponente,
  porque esse call site não sabe "quem é o oponente de m" sem uma função de lado pronta. **Friend Guard**
  precisou de um contrato NOVO nos dois `ctx`: `aliadosDe(m)` (lista de aliados VIVOS de `m`, sem ele mesmo) —
  `efeitos.CTX.aliadosDe` (single player: seu lado é `ladoJogador()`, o do inimigo é só `[G.B.enemy]`, porque
  você só enfrenta um por vez) e o `ctx` que `mp-motor.resolverTurnoMP` monta (`vivosMP(s.lados[ladoDe(s,
  m.ref)])`). `golpe.executar` calcula o multiplicador ANTES do laço de acertos (`(ctx.aliadosDe?.(t) ||
  []).reduce(...)`, multiplicativo se houver mais de um aliado com a habilidade) e aplica em `dano` antes dos
  checks de Sturdy/Endure/Faixa de Foco — igual aos jogos, a redução conta pra decidir se aguenta ou não.
  `ctx.aliadosDe` é OPCIONAL (`?.`): um ctx de teste ou futuro que não implemente simplesmente não tem Friend
  Guard, em vez de quebrar. **Ficaram de fora** (mais complexas ainda, precisam de mais projeto): Mold Breaker
  (ignora habilidade do ALVO — precisaria auditar todo gancho de imunidade/defesa do motor pra saber quais
  "furar"), Damp (bloquear autodestruição do OUTRO lado — cross-side igual Friend Guard, mas em cima de uma
  mecânica, autoDesmaio, que ainda não devolve controle pro motor decidir "deixar acontecer ou não"), Aftermath
  (precisa de um gancho novo "ao desmaiar por contato", que não existe).
- ✅ FEITO (28/09/2026) — **"Flags" de golpe** (Contato, Som, Projétil/Bola e mais). A PokéAPI pública
  (`pokeapi.co/api/v2`) não expõe isso, mas o repositório-fonte que a GERA tem, em CSV puro sem chave nenhuma:
  `move_flags.csv` (21 flags), `move_flag_map.csv` (golpe → flag, por id) e `moves.csv` (id → nome kebab-case,
  o mesmo já usado em `regras.FAMILIAS_GOLPE` e em todo golpe do jogo). `ferramentas/gerar-golpe-flags.mjs` (Node,
  roda no Raspberry Pi) baixa os três e gera `js/dados-golpe-flags.js`: `GOLPE_FLAGS` (748 golpes mapeados) +
  `FLAGS_VALIDAS` (as 21, pra validar typo em `imuneFlag` novo — ver abaixo). **Sharpness/"cortante" continua
  fora** (é flag da Gen 9, mais nova que esse dado-fonte) — `FAMILIAS_GOLPE.corte` segue sendo a única fonte pra
  corte. **Gen 9 tem buraco no dado-fonte**: `torch-song`/`alluring-voice`/`psychic-noise` (sonoros nos jogos de
  verdade) EXISTEM em `moves.csv` mas não têm nenhuma flag em `move_flag_map.csv` — o gerador não inventa, então
  esses golpes ficam sem a flag `sound` até o repositório-fonte atualizar (Soundproof não os bloqueia).
  **Ganho 1 — corrigido o proxy de contato**: `regras.fazContato(move)` usa a flag `contact` de verdade quando o
  golpe está mapeado (Earthquake é físico e NÃO faz contato — o proxy antigo, `move.cls === 'physical'`, errava
  esse caso) e só cai pro proxy antigo se o golpe não estiver na tabela (plano B, nunca "sem contato" à toa).
  Trocado nos 4 pontos de `golpe.js` que liam `g.cls === 'physical'` como "fez contato": a barreira que pune
  contato (King's Shield e cia.), o Elmo Rochoso, o bloco de Static/Rough Skin/Effect Spore/Gooey/Iron Barbs e o
  Poison Touch. **Ganho 2 — duas habilidades novas**: `soundproof: { imuneFlag: 'sound' }` e
  `bulletproof: { imuneFlag: 'ballistics' }` (`habilidades.js`) + o gancho `imuneFlag` em `golpe.executar` —
  checado ANTES até do golpe de status (diferente de `imuneTipo`, que só vale pra dano): Soundproof bloqueia
  Growl tanto quanto Hyper Voice, porque a imunidade é da FLAG, não de ser golpe de dano. **Não mexido**: a
  generalização do pólen (`contato.po`/`imunePo`, hoje hardcoded pra Overcoat/Grama) — ficou de fora desta leva
  por escolha (`AskUserQuestion`: o usuário pediu dados + contato + as duas habilidades novas, não a
  generalização do pólen). `tests/regras.test.js` (cobertura da tabela, `temFlag`, `fazContato` com casos reais)
  e `tests/habilidades.test.js` (Soundproof/Bulletproof em batalha, `imuneFlag` validado contra `FLAGS_VALIDAS`).
  **Dois testes existentes precisaram de ajuste**: "Rough Skin"/"Poison Touch" simulavam golpe especial fazendo
  `golpe({ cls: 'special' })` em cima do Tackle padrão (nome continuava "tackle", só a classe mudava) — com a
  flag de verdade, Tackle tem `contact` INDEPENDENTE da classe simulada no teste, e os dois passaram a "encostar"
  de novo; trocado pra `golpe({ name: 'ember', cls: 'special' })`, um golpe especial de verdade sem a flag.
- **Duração da run**: `regras.MULT_XP = 0.6` (escolha do usuário). É UM número — se ficar arrastado, suba.
- **Decidido com o usuário (28/09/2026)**: confirmado que o inimigo TAMBÉM deveria gigantamaxar (só treinador) —
  ao investigar pra implementar, achei que **já existia** (`batalha.gmaxDoInimigo`/`dynamax.inimigoPodeGmax`,
  testado em `tests/gimmicks-coop-inimigo.test.js`): esta nota de "em aberto" tinha ficado esquecida no CLAUDE.md
  depois que o recurso foi construído. Nada a fazer aqui. Painel de manutenção **continua** (jogo ainda em ajuste
  ativo, modo beta da Raide ligado); teto de aliados **continua em 2** (o Esconderijo já resolve "guardar mais
  parceiros" sem mexer em quantos agem por turno — subir o teto mudaria o balanceamento da batalha, não só
  armazenamento).

### ⚠️ Lição cara (25/09/2026): `node --check` não roda nesta máquina
`S?.escondidos ||= []` — optional chaining como alvo de atribuição é **erro de sintaxe**. Derrubou o jogo inteiro
(tela branca) porque o módulo não parseava e levou junto `render.js`, `itens.js` e `amizade.js`. Um `node --check`
pegaria em um segundo. Enquanto não houver Node aqui: **arquivo novo ou reescrito é o maior risco do projeto**, e
o CI é a única rede de verdade. Avisar "não rodei os testes" não basta quando o erro não falha um teste — ele
impede o jogo de abrir.

## Decidido com o usuário, ainda NÃO implementado

Ordem acordada: **1 ✅ contadores + telas** · **2 ✅ cada Gen é uma jornada** · **3 ✅ badges com vantagem** · **4 ✅ Mega** · **5 ✅ Tera** · **6 ✅ Z-Move** · **7 ✅ Dynamax** · **8 habilidades restantes**. A reforma das jornadas (2) vem ANTES das vantagens (3) porque reescreve a criação e o fim de jornada, que é exatamente onde as vantagens se penduram.

### 2. ✅ FEITO — Cada Gen é uma jornada
Implementado em atalha.vencerGen (a pergunta), egras.pontuacao + multContinuacao (a penalidade) e supabase/migrations/ (o servidor recalcula e RECUSA a jornada se a conta não bater — mudou num lado, muda no outro; 	ests/schema.test.js trava isso). S.continuacoes conta quantas vezes a jornada seguiu; estatisticasDaJornada leva isso e campeaoDe pro resumo. A tela de fim já propõe o mapa seguinte (G.gen).

#### O desenho acordado era:
Hoje, fora do Roguelike, vencer os lendários deixa **seguir com o mesmo Pokémon** pro mapa seguinte, com os níveis escalados (foi assim que um testador chegou a Hoenn começando no nível 90). Passa a ser:
- **Padrão**: fechar a Gen **encerra e pontua a jornada**; o Pokémon **se aposenta** (fica registrado na carreira como campeão daquela Gen) e você começa uma **jornada nova** no mapa seguinte, escolhendo outro Pokémon, **no nível 5 e com o mapa nos níveis normais** (2–62). Nada de mochila, dinheiro ou aliados atravessa.
- **Alternativa** (a de hoje): seguir com o mesmo Pokémon em nível alto, oferecida ali no fim e valendo **menos pontos no ranking**.

### 3. ✅ FEITO — Badges com vantagem permanente
Implementado em `js/badges.js` (~30 badges numa tabela única, puro, `tests/badges.test.js`) e ligado na criação
(`criacao.renderVantagens`, `vantagensDe`) e na tela 🏅 Conquistas. Cada badge é medida do **progresso
permanente** (nunca do histórico, que o jogador pode apagar — `contextoBadges` monta o `ctx` a partir de
`progresso-conta.js`) e paga uma vantagem na PRÓXIMA jornada: itens (empilham) e/ou dinheiro inicial (soma),
aplicados em `criacao.iniciarJornada` (`money: 500 + v.dinheiro`). **Interruptor na criação** (`G.semVantagens`)
deixa jogar sem elas por `regras.BONUS_SEM_VANTAGENS` (+10%) na pontuação final (`pontuacao()`, e o mesmo peso
no SQL — mudou aqui, muda em `supabase/migrations/`). **Rayquaza são DUAS badges separadas**, como pedido
explicitamente pra não bugar: `rayquaza-shiny` (recrutar um shiny) e `rayquaza-mega` (1.000 golpes finais sendo
ele) contam sozinhas, em qualquer ordem; uma terceira (`rayquaza-lenda`) só fecha quando as duas estão prontas
e é a única que dá o prêmio grande (loja de graça pra sempre, `S.lojaGratis` em `regras.precoItem`).

**Pratos do Arceus (28/09/2026) — revisão do item por tipo.** As 18 badges "Especialista em X" (`ALVO_TIPO` =
1.000 abates daquele tipo, mesmo número do Mega/Vínculo) davam originalmente uma pedra de evolução (quando o
tipo tinha uma) ou o petisco de afinidade (quando não tinha) — pedido do usuário pra trocar: pedra de evolução é
vantagem fraca pra quem já escolheu o Pokémon, e petisco de afinidade é item de CAPTURA, não faz sentido como
prêmio de vantagem em batalha. Viraram os **18 Pratos do Arceus + Lenço de Seda** (`dados.ITENS_VANTAGEM_TIPO` +
`dados.PLACA_DO_TIPO`, item real dos jogos nunca implementado aqui antes): cada um dá **+20% de dano nos golpes
daquele tipo** enquanto segurado, reaproveitando o gancho `danoTipo` que já existia (`segurados.js`, criado pro
Núcleo Eternamax) — gerado direto de `PLACA_DO_TIPO` num `Object.fromEntries`, então nunca desalinha qual prato é
de qual tipo. **Normal é a única exceção real**: nos jogos o Arceus não tem Prato Normal (a forma base dele já É
Normal, sem prato nenhum equipado), então usa o Lenço de Seda. `badges.premioDoTipo` só lê `PLACA_DO_TIPO[t]`
agora — as tabelas antigas `PEDRA_DO_TIPO`/`PETISCO_DO_TIPO` saíram. Sem `price`: só vêm da badge, não se compram.

**Backlog anotado (28/09/2026): Arceus deveria ser um chefe de raide** — ver "Próximos passos combinados" acima.

### 4. ✅ FEITO — Mega Evolução
Tabela gerada em `js/dados-megas.js` (96 formas, 93 espécies — `ferramentas/gerar-megas.ps1`), mecânica em `js/mega.js`.
Decisões fechadas com o usuário: **só o jogador** megaevolui (aliado nunca); **uma por batalha** e **não gasta o turno**;
**Alfa, lendários e treinadores** também megaevoluem, ao cair a **metade do HP** (`HP_MEGA_INIMIGO`); **Primal**
(Groudon/Kyogre) entra na mesma mecânica com outro nome. As formas são PRÉ-CARREGADAS em `iniciar()` — buscar no meio
do turno é o que a Mudança de Postura do Aegislash evitou. `desfazerMega` roda pra toda a equipe em `endBattle`:
sem isso o Pokémon fica Mega pra sempre, porque `M.data` vai junto no save. `megasDoJogador()` mora em `mega.js`
(não em `batalha.js`) porque `render.js` também precisa dela e não pode importar `batalha.js` — daria ciclo.

### 5. ✅ FEITO — Terastalização
`js/tera.js` (gatilho) + `regras.tiposDefensivos`/`regras.multStab` (a conta, pura e testada). A conquista é por
TIPO, não por espécie: você escolhe na hora entre os tipos já liberados. Mesma economia da Mega — uma por batalha,
não gasta o turno, desfaz em `endBattle`. Diferente da Mega, **não troca `M.data`**: guarda só `M.tera`, e quem lê
são as regras — por isso desfazer é uma linha. `render.badgesDeTipo` mostra o tipo Tera no lugar dos originais
(mostrar os antigos faria a pessoa calcular a fraqueza errada). O inimigo terastaliza (Alfa/lendário/treinador, tipo sorteado) — ver "Gimmicks do inimigo e do co-op".

### 7. ✅ FEITO — Gigantamax
`js/dynamax.js` + `regras.poderMax`/`MULT_HP_DYNAMAX`/`TURNOS_DYNAMAX`. **Única gimmick sem item** (25 jornadas já
é o preço). Dobra o teto de HP e o HP atual por 3 turnos; `passarDynamax` roda na virada da rodada e
`desfazerDynamax` também em `endBattle` — sem isso o teto dobrado ia junto no save, pra sempre. A volta guarda
`hpMaxAntes` e reaplica a PROPORÇÃO: recalcular pela base perderia o dano sofrido enquanto gigante. Tabela do Max
mais modesta que a do Z de propósito (o Z é um tiro; o Max vale 3 turnos). **Inimigo gigantamaxa só se for de
TREINADOR** (`dynamax.inimigoPodeGmax` — o "treinador" dos Lendários da rota final, Alfa, evento e selvagem não; ver
"Gimmicks do inimigo e do co-op" abaixo). **Bug real corrigido**: `carreira.conquistasDaConta` passava `runs: {}`, então
`podeGigantamax` dava `false` pra qualquer espécie e o botão 🔴 nunca aparecia numa batalha (só a tela de Conquistas lia
`runsDeNivelDe`). Hoje `conquistasDoProgresso(jornadas, registroAtual, progresso)` (pura, em `carreira.js`) é a fonte única.

### 6. ✅ FEITO — Z-Move
`js/zmove.js` (elegibilidade) + `regras.poderZ` (a conversão, pura e testada, aplicada em `calcDamage` quando
`vol.zAtivo`). **Não é transformação: É o turno** — `usarZ` termina chamando `turn({..., z:true})`, o flag é ligado
ali e apagado no `finally` do mesmo turno (um Z que vazasse dobraria dano de graça). Precisa do **Cristal Z**
segurado (₽12.000, preço do usuário); a loja o mostra via `temZConquistado`, que **não depende de batalha** — a
primeira versão usava `zDisponiveis` e o cristal nunca aparecia à venda, porque loja é fora de combate.
Inimigo **terastaliza** igual à Mega (Alfa/lendário/treinador, metade do HP), mas só **uma virada por luta**:
quem megaevoluiu não terastaliza também.

### Gimmicks do inimigo e do co-op (25/09/2026)
Decisões do usuário. **Inimigo** (`batalha.js`): só Pokémon de **treinador** gigantamaxa (`gmaxDoInimigo`, mesmo gatilho
`HP_MEGA_INIMIGO`); só **treinador e Alfa** usam **Z** (`zmove.inimigoTemZ` sorteia UMA vez em `iniciar` → `B.zInimigo`:
treinador sempre, Alfa `CHANCE_Z_ALFA`=20%; `inimigoUsaZAgora` decide por turno, `CHANCE_Z_TURNO`=35%, uma vez por luta,
só golpe de dano; a marca `E.vol.zAtivo` é apagada no `finally` logo depois do golpe). **Uma virada por luta**
(`jaViradou(B)`: Mega, Tera OU Gigantamax); quem não tem Mega sorteia Tera×Gigantamax (`viradaSorteada`, guardado em
`B.viradaInimigo` — só treinador tem os dois; o resto é sempre Tera). `passarDynamax(E)` roda no fim da rodada junto do
lado do jogador. **Bug real corrigido**: `megaDoInimigo` marcava `megaInimigoUsada` quando o inimigo (nível ≥ 40) não
tinha forma Mega, o que bloqueava o Tera de quase todo mundo; agora só marca quando megaevolui de fato.
**Co-op** (`mp-motor.js` + `multiplayer.js`): a ação de golpe leva `gimmicks: [{tipo:'mega', forma, id, name, types, base,
sprite, back, ability} | {tipo:'tera', valor} | {tipo:'gmax'} | {tipo:'z'}]`. A tela de quem joga confere conquista +
item (Pedra Mega/Cristal Z) da PRÓPRIA conta (`gimmicksDisponiveisMP`); o anfitrião confia no que chega e o motor puro só
aplica as regras da luta (`aplicarGimmicksMP`): só o PRINCIPAL (`slot 0`) de quem tem run (não convidado, não aliado), não
PvP, uma de cada por luta e por jogador em `estado.gimmicksUsados[dono]`. Mega, Tera e Gigantamax entram antes dos golpes
(não gastam o turno); Z marca o golpe do turno (`zRefs`). A Mega manda os dados da forma na ação (o motor não tem rede) —
`mega.aplicarForma(M, forma, data, habilidade?)` é a troca pura, usada por `megaevoluir` e pelo motor; a espécie
(`data.speciesName`) NÃO muda, é por ela que o resultado volta pra run. As fotos são descartadas no fim, então nada disso
persiste na run (o resultado volta por FRAÇÃO de HP). O Alfa do co-op pode carregar Z (`opcoes.alfa` → `estado.zIA`,
`zIAUsado`); Mega/Tera de Alfa no co-op **não existem** (só single player). UI: `alternarGimmickMP` (liga/desliga em
`sala.gimmicksSel`, resetado a cada turno), com o Z ligado só os golpes elegíveis ficam clicáveis. `aplicarCoop` agora chama
`registrarAbate({porMim:false})` por derrotado (espécie + total; Tera/Z pedem golpe final seu e ficam só no single player).
**Auditoria das conquistas da Mega** (`tests/gimmicks-coop-inimigo.test.js`): toda espécie de `MEGAS` libera com 1.000 abates,
não com 999, e habilita a forma com a pedra (Rayquaza: Dragon Ascent). Lacuna conhecida: as formas **Mega Z** (Absol,
Garchomp, Lucario) — RESOLVIDA: o gerador agora casa `-mega-z` também (Absol, Garchomp e Lucario têm 2 formas: comum + Z).
**Tera e Gigantamax do inimigo só de nível 30+** (`mega.NIVEL_TERA_GMAX_INIMIGO`/`inimigoTeraGmaxLiberado`, nível do INIMIGO = o da rota);
a Mega dele segue com o piso próprio de 40.
**Carteira** (`render.atualizarCarteira`): `#top-dinheiro` é uma pílula 💰 fora do menu ☰ com `+₽/−₽` (`.dinheiro-delta`, some por
animação; elemento vazio = tela anterior limpou o topo → sem delta falso), `.carteira-mini` dentro do `turnoBar` (a parte que não rola na
batalha do celular) e `.carteira-loja` no topo da loja.
**Imagens nos relatos** (`imagens-relato.js` puro + `relatos.js` + `nuvem.enviarRelato(relato, imagens)`): máx. 2 imagens, 2 MB cada (`MAX_IMAGENS`,
`MAX_BYTES_IMAGEM`, igual ao `file_size_limit` do bucket privado `relatos-imagens` na migração `20260925160000_relatos_imagens.sql`); o navegador
comprime (lado maior 1600 px, JPEG 85%) antes de subir; a linha do relato guarda só os caminhos em `relatos.imagens` — o campo SÓ entra no insert
quando há imagem (relato sem imagem funciona sem a migração). Offline: as imagens vão pra fila em data URL se couberem (`MAX_BYTES_FILA` 1,5 MB),
senão o relato segue sem elas e a tela avisa (`semImagens`). Fila: campos `imagensFila`/`semImagens` são só dela e saem antes do insert.

### Pedra Mega, rastreio de conquista e cenário (24/09/2026)
- **Pedra Mega** (`dados.ITEM_PEDRA_MEGA`, ₽15.000 — preço escolhido pelo usuário): conquistar a Mega libera a
  COMPRA da pedra, não a Mega. É item segurado; a loja só a mostra se a espécie do jogador tem a Mega conquistada
  (`soComMega`). **Rayquaza não usa pedra** — precisa saber `dragon-ascent`. O lado inimigo passa `ignorarPedra`
  (Alfa não tem inventário). Quando falta a pedra, a tela DIZ o que falta em vez de esconder o botão.
- **`js/rastreio.js`**: fixar UMA conquista de conta por jornada (`G.S.rastreada`), com HUD no painel de Missões
  e recompensa paga NA RUN (`G.S.rastreadaPaga` evita pagar duas vezes). A checagem mora em `verificarMissoes`
  porque é o único ponto que roda depois de todo turno e de todo item.
- **`js/cenario.js`**: clima da cena de batalha deduzido do TEXTO da rota (nome+descrição) contra uma lista de
  palavras, com `z.tema` tendo prioridade. Sem tabela por rota, então rota nova entra sozinha. Puro e testado —
  o teste falha se tudo cair no `padrao`, que é como essa lista morreria em silêncio.

### Itens no multiplayer (28/09/2026)
Pedido do usuário: itens segurados e itens comuns (mochila) precisam funcionar na Raide (e no resto do
multiplayer). Duas partes bem diferentes:

**Itens segurados (passivos)**: a causa raiz era simples — `mp-motor.fotoDoMon` nunca incluía `item`, e
`segurados.seg(m) = SEGURADOS[m?.item] || {}` lê exatamente esse campo. Como `golpe.js`/`regras.js` SÃO o motor
único (single player e multiplayer chamam as MESMAS `usarGolpe`/`calcDamage`/`effStat`/`fimDeTurno`), bastou
acrescentar `item: M.item || null` em `fotoDoMon` — **nenhuma linha nova de dano/cura precisou ser escrita**.
Restos, Orbe da Vida, Faixa de Foco, Sino-Concha, Elmo Rochoso e o Vínculo de Batalha (Ash-Greninja, que também só
lia `m.item` no motor único) passaram a funcionar de graça. Testado direto (`tests/mp-motor.test.js`): Orbe da
Vida bate mais forte E cobra HP, Restos cura no fim do turno, tudo via `resolverTurnoMP` de verdade.
**Item que se GASTA** (`aguentaCheio`, Faixa de Foco) muta só a cópia de rede (`fotoDoMon`), não `G.S.player`
diretamente — por isso `finalizar()`/`aplicarCoop` agora sincronizam `item` de volta pra run igual já faziam com
HP/status/PP (`final[...].item`, `M.item = f.item`), senão o jogador ganharia uma Faixa de Foco de graça a cada
luta de sala. **Arena (Hall da Fama) resolvido de outro jeito (28/09/2026)**: o Hall continua sem guardar o item que o Pokémon
segurava ao se aposentar (`hall.js` sem esse campo), mas não precisou — a Loja de preparo da Arena (ver acima)
tem sua PRÓPRIA "mochila" de conta, e o jogador ESCOLHE o que equipar em cada Pokémon do time a cada tentativa
(`arena.equipamento`), independente do que ele carregava na run original.
**PvP não sincroniza nada de volta** (nunca sincronizou HP/PP também), então não tem risco de duplicar item ali.

**Itens comuns (Potion, X Attack, curas de status, Éter...)**: MUITO diferente de item segurado — é uma ESCOLHA DE
TURNO (ocupa a vez, como golpe/fugir), não um efeito passivo. Nova ação `{tipo:'item', ref, item}` em
`mp-motor.resolverTurnoMP` (passo "0b", antes dos golpes — mesma prioridade dos jogos): `aplicarItemComum`
replica heal/healPct/cure/ether/stage do `itens.useItem` do single player, mas SEMPRE no próprio Pokémon que usou
(sem "usar em qual aliado?" — cada jogador só vê a PRÓPRIA mochila numa sala, então perguntar não faria sentido).
`itemTemEfeito`/`heal`/`mudarEstagios` são as MESMAS regras/motor de sempre. Fica registrado em
`estado.itensUsados[dono]` (lista que só cresce) pro cliente descontar da mochila depois — mesmo padrão de
`revivesUsados`/`raideUsados`, só que como o Revive/raide já usam um contador por tipo e este é lista simples
(pode repetir o mesmo item várias vezes), `multiplayer.consumirItensComuns` usa o TAMANHO da lista já visto
(`itensComunsConsumidos`) em vez de comparar por tipo. **Diferente de Revive/raide, item comum vale em QUALQUER
luta de sala** (explorar junto, Alfa, chefe da semana) — não é exclusivo do evento, então não checa `b.evento`.
Cliente manda a ação como QUALQUER escolha de turno (`escolher()`, não `registrarAcao` direto de ação livre) —
`multiplayer.usarItemComumMP`/`itensComunsDisponiveis` (filtra por `SEM_BATALHA_MP`: as categorias que já têm
caminho próprio ou não fazem sentido em batalha). UI: `botoesItemComum()`, um `<details>` recolhível (pode ter
bem mais que os 3 itens de raide) ao lado dos botões de raide.

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

### Reordenar golpes (28/09/2026)
Pedido do usuário: mudar a ordem dos golpes na lista, sem gastar turno, tanto na run quanto na Raide.
`regras.moverGolpe(moves, i, dir)` é a única regra (pura, testada): troca a posição `i` com a vizinha `i+dir`,
devolve um array NOVO (não muta) — o PP usado mora dentro de cada objeto de golpe (`ppLeft`), então viaja junto
com o golpe na troca, sem lógica extra. Três UIs diferentes chamam ela:
- **Single player**: botões ▲▼ dentro de `render.listaGolpes(M, quem)` (ficha, `data-act="golpe-mover"` +
  `data-quem`/`data-v`/`data-dir` em main.js) — como a ficha usa o MESMO array `M.moves` que a tela de batalha
  (`renderActions`) lê pra montar os botões de ataque, reordenar na ficha já reordena os botões de ataque também,
  sem precisar duplicar UI lá. Os botões ficam DENTRO do `<summary>` do golpe (junto do nome) — clicar neles
  também abriria/fecharia o `<details>` (é o comportamento nativo do navegador pra qualquer clique no summary);
  `onclick="event.preventDefault()"` no botão evita isso SEM `stopPropagation()` (o clique precisa continuar
  borbulhando até o listener delegado em main.js, senão o `data-act` nunca dispara).
- **Arena** (`arena.arenaGolpeMover`): local, muta direto `proximoSemEscolha().moves` e re-renderiza — a Arena não
  tem rede, é só o motor local.
- **Multiplayer** (`multiplayer.moverGolpeMP`): **não pode ser só local** — o estado da batalha é autoritativo do
  anfitrião (`sala.batalha`), e a escolha de golpe manda um ÍNDICE (`{tipo:'golpe', golpe: i}`); se cada cliente
  reordenasse só a PRÓPRIA cópia, o índice enviado depois bateria num golpe ERRADO na cópia do anfitrião (que não
  reordenou). Por isso `golpe-mover` é uma "ação livre" como Revive/item de raide (`registrarGolpeMover` em
  `registrarAcao`, mesmo padrão de `registrarRevive`/`registrarRaide`): o ANFITRIÃO muta o Pokémon canônico e
  reenvia o estado (`publicarEstado`), pra todo mundo ver a MESMA ordem antes de escolher. Guardado contra
  `sala.resolvendo` como os outros dois.
- Em Arena e Multiplayer, `.mv` (botão de atacar) não pode ficar DENTRO de outro `<button>` de reordenar (HTML
  inválido) — cada golpe vira um wrapper `.mv-cel` com o botão de atacar e o `<span class="mv-ordem">` lado a lado.

### Vínculo de Batalha / Ash-Greninja (27/09/2026)
Pedido do usuário ("dá pra adicionar o Ash-Greninja?"): checado antes de implementar que `greninja-ash` (id 10117)
e a habilidade `battle-bond` existem de verdade na PokéAPI. **Mas `battle-bond` NÃO é uma habilidade normal do
Greninja** (a API só lista `torrent`/`protean` pra ele — bate com os jogos: historicamente só um Greninja de
evento/história tinha essa habilidade). Por isso **não** entrou como habilidade sorteável em `pokemon.makeMon`:
vira **item segurado exclusivo**, `dados.ITEM_VINCULO` (`vinculo-de-batalha`, ₽15.000), no MESMO padrão de Pedra
Mega/Cristal Z — checado DIRETO pelo id em `golpe.js` (`m.item === ITEM_VINCULO`), não pela tabela genérica de
`segurados.js` (que exige `Object.keys(SEGURADOS)` bater com `IDS_SEGURADOS` = só os 13 itens de `ITENS_SEGURADOS`).
**A conquista é própria, não reaproveita a da Mega** (`conquistas.ALVOS.vinculo` = 1000, mesmo número da Mega —
escolha do usuário; `ESPECIES_VINCULO = ['greninja']`, lista separada de `dados-megas.MEGAS` porque Greninja não
tem Mega neste jogo): filtrar pela lista de Megas teria deixado o Greninja de fora da conta.
`golpe.virarAshGreninja(m, ctx)` segurando o item + derrubar um oponente troca `id/name/data` inteiro (igual à
Mega — Ash-Greninja tem atributos-base diferentes de verdade, diferente do Castform que só muda tipo/sprite) e
chama `recalc`; `desfazerAshGreninja` roda em `endBattle` junto com Mega/Tera/Dynamax/Forma. `greninja-ash` é
PRÉ-CARREGADO no início da luta (`batalha.iniciar` → `golpe.preCarregarAshGreninja`) se alguém do lado do jogador
entra segurando o item — mesmo cuidado da Mega, nada de buscar no meio do turno. **Water Shuriken** ganha
tratamento especial igual ao Weather Ball/Tera Blast (`regras.golpeDoBattleBond`: poder fixo 20, SEMPRE 3
acertos — a versão normal é 2–5 aleatório): plugado no motor único (`golpe.executar`, vale nos dois lados e no
co-op) e nos botões de golpe das duas telas. Validado com dados reais da PokéAPI (fora da suíte de testes, que
não toca rede — mesmo recorte que `mega.megaevoluir`): a transformação, o Water Shuriken reforçado e o desfazer
no fim da luta rodaram de ponta a ponta contra a API de verdade antes de ir pro commit.

### Anúncios (Google AdSense) e Política de Privacidade (27/09/2026)
Pedido do usuário: monetizar o site com ads. **Decidido não perseguir a Play Store** (avaliei a complexidade —
TWA/Bubblewrap é barato tecnicamente, mas conta pessoal exige teste fechado com 12 testadores por 14 dias
corridos antes de publicar, e o risco de marca do Pokémon fica bem mais visível virando app publicado — o
usuário optou por focar só no site). `js/ads.js` é a estrutura pronta, **desligada por padrão**: mesmo gate do
Supabase (`config.ADSENSE_CLIENT_ID`, marcador = nada roda). Quando a conta existir: preencher o client id +
`AD_SLOT_INICIO` (`criacao.js`) com o id da unidade de anúncio.
**O jogo NUNCA carrega o script do Google antes do consentimento** (exigência da política de consentimento da UE
— GDPR): `ads.iniciarAds()` (chamado no boot, `main.js`) só mostra um banner fixo (`.cookie-banner`, não é modal,
não trava o jogo) se `adsConfigurado()` e ainda não houver escolha salva (`pokerpg-consentimento-ads`); só
`aceitar` chama `carregarScript()`. Escolha mudável depois em `⚙ Ajustes` (`htmlAds()`, só aparece com conta
configurada). `blocoAds(unitId)`/`ativarSlots()` desenham e ativam um slot — sempre vazio sem config ou sem
consentimento, nunca um `<ins>` "morto" esperando.
**Tela 🔒 Privacidade** (`js/tela-privacidade.js`, nova entrada em `navegacao.TELAS`) é pré-requisito de
aprovação do AdSense — texto explica o que cada serviço (localStorage, Supabase, PokéAPI, AdSense) coleta, sem
juridiquês. Escrita ANTES de qualquer anúncio existir de verdade, porque é isso que a revisão do Google confere.
`ads.js`/`tela-privacidade.js` entraram no PRECACHE do `sw.js` (regra de sempre: arquivo novo em `js/` = entra lá).

### Estilo de sprite: Clássico / 3D / Animado (27/09/2026)
Pedido do usuário (junto do backlog de animações), em duas levas: primeiro só o 3D (booleano), depois pediu
também os GIFs animados do Showdown — o que virou um refactor de booleano pra enum de 3 estilos.
A PokéAPI não tem modelo 3D interativo pra jogo — o que existe é `sprites.other.home`, um RENDER 2D do mesmo
modelo 3D usado em Pokémon HOME/jogos modernos (bem mais nítido que o pixel-art `sprites.front_default`), e
`sprites.other.showdown`, os GIFs animados usados no Pokémon Showdown (COM versão de costas de verdade,
diferente do "home"). `dados.SPR_3D`/`SPR_3D_SHINY` e `SPR_ANIM`/`SPR_ANIM_COSTAS`/`SPR_ANIM_SHINY`/
`SPR_ANIM_SHINY_COSTAS` montam pelo id, mesmo padrão do shiny — nunca leem `m.data.sprite`, porque essas imagens
podem não existir pra alguma forma antiga guardada num save velho.
Preferência em `ajustes.ESTILO_SPRITE_KEY` (localStorage `pokerpg-estilo-sprite`, enum `'classico'|'3d'|'animado'`
via `ESTILOS_SPRITE`/`estiloSpriteAtual`/`definirEstiloSprite`), lida em `render.spriteFrente`/`sprCostas` a cada
render — trocar o estilo vale na hora, sem precisar recriar nenhum Pokémon. **3D não tem versão de costas**
("home" só tem frente): `sprCostas` devolve `null` nesse estilo e cai sozinho no MESMO fallback que já existia
pra espécie sem back 2D (frente + CSS `flip`). **Animado tem costas de verdade**, então usa `SPR_ANIM_COSTAS`/
`SPR_ANIM_SHINY_COSTAS` direto. Se a imagem do estilo escolhido não existir de verdade pra algum Pokémon/forma,
`imgMon()` já cai pro sprite 2D clássico no 2º erro de `<img>` (fallback que já existia, não precisou de nada
novo). **Download opcional e À PARTE** do download normal: `offline.baixarImagens3D`/`imagensGuardadas3D` (2
imagens: frente normal e shiny) e `baixarImagensAnimadas`/`imagensGuardadasAnimadas` (4 imagens: frente e costas,
normal e shiny) — mesmo formato de `baixarImagens`, ninguém baixa imagem de estilo que não escolheu.

**Bug relatado pelo usuário (27/09/2026): GIFs animados "estranhamente desproporcionais".** Causa: `.spr` (e as
outras classes que desenham `spriteFrente`/`sprCostas` sem passar por `.spr` — `.me img` da ficha, `.aliado-top
img` do cartão de aliado, `.mp-mon img` do multiplayer) fixam `width`/`height` iguais, o que é inofensivo pro
clássico e pro 3D (sempre quadrados) mas ESTICA o GIF do Showdown: cada Pokémon tem um tamanho de sprite
diferente lá (Wailord bem mais largo que alto, Onix mais alto que largo…), e forçar num quadrado distorce a
imagem. Corrigido com `object-fit:contain` nas quatro regras — encolhe mantendo a proporção, com uma pequena
margem dentro da caixa, em vez de esticar. Não muda nada visualmente pro clássico/3D.

### Sprites de verdade pra Pedra Mega e Cristal Z (27/09/2026)
Pedido do usuário: os três itens de gimmick (`dados.ITEM_PEDRA_MEGA`/`ITEM_CRISTAL_Z`/`ITEM_VINCULO`) são únicos e
genéricos no jogo (uma Pedra Mega serve pra qualquer espécie, um Cristal Z pra qualquer tipo) — `ITEM_SPR(k)`
simples não tem como saber qual arquivo mostrar, então caíam sempre no ícone de caixinha genérico
(`ITEM_SPR_RESERVA`). A PokéAPI TEM sprite de verdade por espécie (pedra) e por tipo (cristal): `PEDRAS_MEGA`/
`CRISTAIS_Z` (`js/dados-item-sprites.js`, GERADO por `ferramentas/gerar-item-sprites.mjs` — Node, roda no
Raspberry Pi, não PowerShell) trazem essas tabelas. `dados.ITEM_SPR_MEGA(especie)`/`ITEM_SPR_Z(tipo)` fazem a
troca; `render.spriteItem(k, m)` é o ponto único que decide qual sprite mostrar pra QUALQUER item, dado quem
seguraria ele (`m`, um Pokémon-like com `.data.speciesName`/`.moves` — `blocoItem` passa o dono de verdade; loja,
mochila e os modais de comprar/vender em `main.js` passam `S.player` como melhor palpite antes de saber quem vai
equipar). `zmove.primeiroTipoZ(M)` acha o tipo do primeiro golpe com Z conquistado (só decide o SPRITE — o golpe
que vira Z de fato na hora H continua escolhido em batalha, por `zDisponiveis`).
**Nem toda espécie tem pedra de verdade**: só 47 das 89 Megas deste jogo são Mega oficial dos jogos de verdade
(+ Kyogre/Groudon, que usam os Orbes da Reversão Primitiva) — o resto (Meganium, Chesnaught, Greninja, Zeraora…)
só existe neste projeto, e a PokéAPI não tem pedra desenhada pra eles (o item existe nos DADOS da API, mas sem
sprite — confirmado um por um, 404 no CDN). Pra esses, `CHAVE_MEGA_GENERICA` = `key-stone`, a Pedra-Chave: item
real dos jogos que ativa QUALQUER Mega Evolução, então nunca fica errado mostrá-la. O gerador casa o nome do
item com a espécie de dois jeitos: pro item OFICIAL, lê o texto em inglês do próprio item na API ("Allows X to
Mega Evolve") — sem depender de adivinhar o padrão do nome (que é irregular: `blastoisinite`, `alakazite`,
`heracronite`… não seguem `especie+"ite"`); pros itens sem esse texto (os ~40 "fan-made" que só existem nesta
extensão da PokéAPI), casa pelo maior PREFIXO comum com o nome da espécie (ex. `meganiumite` → `meganium`) — como
o próprio nome do item já É a espécie com um sufixo trocado, funciona sem ambiguidade nos 89 casos.
**Cristal Z é mais simples**: os 18 tipos têm cristal oficial de verdade (`firium-z`, `waterium-z`…, sufixo
`--held` no arquivo de sprite — nome de arquivo diferente do nome do item, cuidado se algum dia regenerar à mão).
Sem tipo elegível ainda, cai no Anel Z (`z-power-ring`, item real e genérico a todo Z-Move).
**Vínculo de Batalha não tem item nenhum nos jogos** (Battle Bond é habilidade, não item segurado) — ícone
próprio, um SVG embutido de shuriken (tema ninja do Greninja), em vez de fingir que existe um sprite oficial.

### Animação da barra de HP (27/09/2026)
Pedido do usuário (junto do backlog de animações): a barra saltava direto pro número novo, sem transição. O
`.fill` já tinha `transition: width .45s ease` no CSS — o problema é que `render()` não faz diffing (destrói e
recria o DOM inteiro a cada chamada, ver o comentário no topo de `render.js`), então uma barra NOVA nasce direto
na largura final, sem "de onde" animar. Resolvido com a técnica **FLIP** (First-Last-Invert-Play) em `render.js`:
`hpbar(m, chave)` ganhou um 2º parâmetro opcional — com `chave`, o `.fill` ganha `id="hp-fill-<chave>"` e a classe
`fill-hp`. `capturarLarguraHP()` roda ANTES de `renderSheet()/renderScene()/renderActions()` redesenharem tudo
(guarda a largura atual de cada barra com id); `animarBarrasHP(antes)` roda DEPOIS: força a barra nova a nascer na
largura ANTIGA (sem transição), faz o navegador aplicar isso com `el.offsetWidth` (força reflow), e só então solta
pra largura de verdade COM transição — o olho vê os dois quadros como uma animação contínua. Respeita `REDUCED`
(`ui.js`, `prefers-reduced-motion`): sem animação nenhuma pra quem pediu, igual sempre foi. Chamadas de
`plate(m, chave)` (cena de batalha: `'e'`, `'p'`, `'a'+i`), `cartaoAliado` (`'card-a'+i`) e `renderFicha`
(`'ficha-p'`) já passam a chave certa. **Validado em jsdom** (não dá pra testar em `node:test`, é manipulação de
DOM pura — mesmo padrão do resto de `render.js`): importar o módulo inteiro em jsdom já confirma que a cadeia de
dependências carrega sem erro; as duas funções, expostas temporariamente pra teste e revertidas depois, terminam
na largura correta nos três cenários (largura muda, largura igual — no-op, elemento novo sem entrada anterior).

### Animações de batalha: ataque, dano, cura, status (28/09/2026)
Pedido do usuário ("mais vivo, mais animações"), prioridade 1 de uma leva maior (ver "Layout paisagem"/"Loja de
preparo" — não, essas são de outro dia; a leva desta é celular deitado + isto + microinterações + tela inicial +
FLIP em XP/PP). Intensidade escolhida pelo usuário: **sutil e polido**, não chamativo.
- **Ataque**: `ctx.atacar(m)` — novo gancho OPCIONAL no `ctx` do motor único (`golpe.js`, mesmo espírito de
  `ctx.tremer`, documentado no cabeçalho do arquivo), chamado em `usarGolpe` no EXATO instante em que anuncia
  "X usou Y!" (linha `await ctx.say(...)`). Single player define `CTX.atacar` (`efeitos.js`, importa `atacar` de
  `ui.js`); multiplayer não define nada — `(ctx.atacar || nada)(u)` no motor não quebra. `ui.js` ganhou
  `idDoMon(m)`/`reanimar(id, classe)`, fatorados de `shake()` (que virou uma linha), reusados por `atacar()`. CSS
  `.mon.atacando` (`atacando .35s`): um "pulo" de escala, sem depender de direção (jogador/aliado/inimigo ficam
  em lados diferentes da cena — decidir lunge direcional exigiria saber a posição de cada um, complexidade maior
  pro ganho; um pulo simétrico já comunica "agiu" sem isso).
- **Dano e cura**: SEM gancho novo no motor — reaproveita a técnica FLIP que já existe (`render.js`,
  "Animação da barra de HP" acima). `animarBarrasHP` já compara a largura ANTES/DEPOIS de cada `.fill-hp`;
  agora também olha o SENTIDO da mudança (encolheu = dano, cresceu = cura) e faz `.mon` piscar vermelho
  (`hit-flash`) ou verde (`heal-flash`), só pra `hp-fill-e`/`-p`/`-a<N>` (as barras da CENA — `ficha-p`/`card-a0`
  mostram o MESMO Pokémon noutro lugar, filtradas pra não duplicar a piscada). Isso cobre TODO caminho de cura
  (Restos, fruta, dreno, clima, item, Centro…) de graça, sem precisar caçar os ~15 pontos de `heal()` espalhados
  por `golpe.js`. **Simplificação assumida**: a largura é uma PORCENTAGEM (hp/hp máximo), então um HP MÁXIMO que
  muda no meio da luta (Rare Candy, Dynamax) também mexe na largura sem ninguém ter apanhado ou curado — piscada
  errada rara e sem efeito de jogo, não vale separar os dois casos.
- **Status**: SEM gancho novo — pulso contínuo e sutil em CSS (`@keyframes pulso-status`, `animation:...infinite`)
  nos chips `.st-burn`/`.st-poison`/`.st-paralysis`/`.st-freeze` e `.stg.up`/`.stg.down` (estágio subiu/desceu):
  como a classe já nasce no HTML a cada render enquanto o status durar, "pulsar enquanto durar" não precisa de
  JS nenhum — só a classe continuar presente já mantém a animação (CSS não reinicia animação em elemento que já
  a tinha, só teria efeito NOVO se o elemento nascesse agora, que é exatamente quando o status é aplicado).
  **Sem "pop" no instante exato em que o status é aplicado** (diferente do FLIP de HP, eu precisaria capturar o
  status ANTES do render pra saber que é novo — decidido não fazer por ora: o pulso contínuo + a mensagem no
  log já comunicam o evento, e o ganho do "pop" isolado não parecia valer a complexidade extra).
- `@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}` (já existia,
  linha final do CSS) cobre TODAS essas animações novas de graça — nenhuma precisou de tratamento próprio de
  `REDUCED`.
- **Fora do escopo por ora**: multiplayer não ganhou essas animações (a cena da sala usa outro DOM, `cartao()`
  em `multiplayer.js`, sem os ids `mon-p`/`mon-e`/`mon-a<N>` que `idDoMon`/`hit-flash` dependem) — se pedido,
  precisaria da mesma técnica adaptada pra lá.

### Microinterações gerais: botões e transição de tela (28/09/2026)
Prioridade 2 da mesma leva ("mais vivo"). Duas regras CSS globais, sem tocar JS nenhum:
- **Botões**: `button{transition:filter,border-color,background-color,transform}` + `button:active:not(:disabled)
  {transform:scale(.96)}` na base (`css/estilo.css`, perto do reset). Cobre TUDO de graça porque quase todo
  clicável do jogo É um `<button>` de verdade (o padrão `data-act`) — golpe (`.mv`), carta de Pokémon (`.pick`/
  `.hall-card`), item da mochila, etc. — sem precisar enumerar cada classe.
- **Transição de tela**: `.create,.game{animation:tela-entra .18s ease-out}` (fade + leve deslocamento). Como
  TODA tela do jogo usa `<main class="create ...">` (ou `.game`, só a tela de jogo em si) como contêiner de
  topo — confirmado varrendo `$('#app').innerHTML =` em cada arquivo `tela-*.js`/`criacao.js`/`arena.js`/etc.,
  incluindo o helper `casca()` de `ranking.js`/`perfil-amigo.js` — uma única regra cobre toda navegação.
  **Cuidado que motivou o valor pequeno (4px, 0.18s)**: `.create` é recriado inteiro em MUITAS interações
  dentro da própria tela (ex.: `tela-ajustes.js`, trocar de fonte chama `telaAjustes()` de novo, não só troca
  uma div), então a animação replay a cada clique — não só na troca de tela. Um valor sutil o bastante fica bem
  mesmo repetindo; um valor mais chamativo (cogitado 6px/0.25s) ficaria cansativo nesse caso. `.game` NÃO tem
  esse problema: só é recriado por `buildGame()`, chamado uma vez ao entrar na jornada — turnos e explorações
  usam só `render()`, que atualiza divs internas sem recriar `.game`, então a entrada anima uma vez só.
  Coberto pelo `prefers-reduced-motion` global (já existia) — nenhum tratamento extra precisou.

### Tela inicial mais viva (28/09/2026)
Prioridade 3 da mesma leva. Três toques, todos CSS-only (menos o `<span>` novo do marcador de presença):
- **🟢 marcador de presença** (`js/presenca.js`, feito antes nesta mesma leva): o emoji do ponto vira
  `<span class="dot-viva" aria-hidden="true">` (escondido de leitor de tela — o texto ao lado já diz "X jogando
  agora", repetir "círculo verde" seria ruído) e pulsa com o MESMO `@keyframes pulso-status` já usado nos chips
  de status da batalha (reaproveitado, não duplicado).
  - **Prévia do Pokémon escolhido** (`.pv-art img`, `criacao.renderPreview`): flutua sozinho (`@keyframes
  flutuar`, translateY suave, 3.2s). É o ÚNICO sprite grande e sozinho da tela — um grid inteiro flutuando ao
  mesmo tempo (a grade de iniciais) ficaria ocupado demais, então NÃO entrou lá.
- **Grade de iniciais** (`.pick`, os cartões de espécie): levanta um pouco no hover (`transform:translateY(-3px)`),
  além da borda que já mudava de cor. **Simplificação aceita**: como `.pick` também é um `<button>` e já ganhou
  o `:active{scale(.96)}` global (microinterações, acima), hover+pressionar ao mesmo tempo mostra só UM dos dois
  transforms (o de maior especificidade CSS, `.pick:hover`) em vez dos dois combinados — efeito colateral
  pequeno, não vale compor os dois valores de `transform` só por causa disso.

### FLIP em XP e PP (28/09/2026)
Prioridade 4 (a última) da mesma leva, fechando o ciclo "mais vivo". `render.js`:
- **XP**: `barraXp(M, GR, chave)` ganhou o MESMO 3º parâmetro opcional que `hpbar` já tinha — com `chave`, o
  `.fill` ganha `id="xp-fill-<chave>"` e a classe `fill-xp`. `capturarLarguraHP`/`animarBarrasHP` viraram
  `capturarLargurasBarras`/`animarBarras` (renomeadas: já não são só de HP) e passam a consultar
  `.fill-hp[id],.fill-xp[id]` juntas — a MESMA técnica FLIP, uma função só. O piscar vermelho/verde (hit/heal)
  continua exclusivo de `.fill-hp` (`if (!el.classList.contains('fill-hp')) continue`): dano/cura não fazem
  sentido pra XP. Chaves: `'ficha-p'` (jogador) e `'card-a'+i` (aliado) — as MESMAS já usadas pela barra de HP
  correspondente (sem colisão de id: prefixos `hp-fill-`/`xp-fill-` diferentes).
- **PP não é barra, é texto** ("PP 5/10" nos botões de golpe) — FLIP de largura não se aplica. Tratamento
  PARALELO, não literal: `capturarTextosPP`/`animarPP` comparam `textContent` antes/depois (mesma ideia do FLIP,
  ANTES/DEPOIS do render, só que em texto) e piscam a classe `.pp-mudou` (CSS: escala + cor por um instante) só
  quando o texto muda. Só o `.pp` do BOTÃO de golpe (`renderActions`, `id="pp-<índice>"`) ganhou id — é o único
  que decrementa DURANTE a batalha; o da ficha (dentro do `<details>` de cada golpe) ficou de fora por não ter
  tanto valor piscar toda vez que o painel reabre.
- Ambos cobertos pelo `prefers-reduced-motion` global — nenhum tratamento extra precisou, igual o resto da leva.

### 4b. Mega Evolução (desenho original)
1.000 golpes finais **sendo a espécie que megaevolui de fato** (Charizard, não Charmander). **Uma missão por Mega**: com X e Y, a tela de Conquistas tem um botão "contar para a X", trocável a qualquer momento, e o que foi acumulado numa não migra pra outra. Desbloqueada, a Pedra **ocupa a vaga de item segurado**. 1× por batalha. As ~30 habilidades que as Megas concedem entram JUNTO, senão metade das Megas nasce inerte.

### Anti-grind: rota esgotada (só no Roguelike)
Quando o seu nível passa do **dobro do teto da rota**, aquela rota deixa de dar caçada — nada de farmar em rota de nível baixo. Você continua **entrando e vendo a Pokédex dela** (quem vive ali, taxas, Alfa); o que some é o encontro. **Só no Roguelike**: nos outros modos a rota velha continua valendo.

### Outras decisões
- **XP por Gen fica canônico** (Paldea dá ~20% mais XP por ponto de força que Kanto): é dado da franquia, não erro nosso.
- **Formas de Hisui ficam no Santuário de Galar** (Gen 8, como a PokéAPI classifica), não em Sinnoh.
- **Paradoxo de Paldea** já aparecem sozinhos na Área Zero e na Borda da Grande Cratera, além do Santuário — não precisou de nada.
