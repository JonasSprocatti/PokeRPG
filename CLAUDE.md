# PokéRPG

RPG de texto no navegador em que **você é o Pokémon** (sem treinador, sem captura). Dados ao vivo da PokéAPI; fórmulas dos jogos (stats, IV/EV, natureza, dano, tipos, estágios, status, XP, evolução). JavaScript puro em ES modules, sem build, sem dependências. Save no `localStorage` (`pokerpg-save-v1`). PT-BR na UI, comentários e nomes novos (identificadores herdados do protótipo seguem em inglês).

## Como rodar

Precisa de servidor HTTP (ES modules não carregam por `file://` — o `index.html` mostra um aviso nesse caso):

```
python -m http.server 3000   # na raiz do projeto → http://localhost:3000
```

Nesta máquina de dev (Windows): usar PowerShell, não Bash (o Bash embutido falha no fork). **Não há Node instalado** — não tentar rodar `node`; os testes rodam no CI.

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
| `js/dados.js` | Tabelas fixas: tipos (`CHART`, `TYPE_PT`, `TC`), `NATURES`, `ITEMS`, `ZONES` (= rotas de `dados-mapas.js`), `FLAVOR`, `MISSOES`, `DIFICULDADES`… Sem DOM. |
| `js/mapas.js` / `js/dados-mapas.js` | Mapas por Gen (ver "Mundo e progressão"). `dados-mapas.js` é gerado por `ferramentas/gerar-mapas.ps1`. |
| `js/regras.js` | **Fórmulas puras** (testadas): `calcStats`, `calcDamage`, `effStat`, `typeEff`, `chanceAcerto`, `consegueFugir`, `jogadorAgePrimeiro`, `danoResidual`, `imuneAoStatus`, `xpPorVitoria`, `ganhoDeEVs`… |
| `js/api.js` | PokéAPI com cache (memória + `localStorage` `pk:*`). `buildLearnset`/`slimPokemon`/`slimMove` são puras (testadas). |
| `js/ui.js` | `$`, `REDUCED`, log (`log`/`say`/`logRaw`), modal `ask`, `shake`. |
| `js/render.js` | `render()` (re-render total: conteúdo dos painéis, cena e ações), `buildGame()`, `badge`, `spriteFrente`. |
| `js/layout.js` | Modelo puro do layout dos painéis (zonas, larguras, alturas, recolhidos). Testado. |
| `js/paineis.js` | Painéis na página: esqueleto, aplicar layout, arrastar, ▲▼⇄▾, divisórias, restaurar. |
| `js/pokemon.js` | `makeMon(data, level, opt)` — instância jogável (jogador e selvagem). |
| `js/efeitos.js` | `changeStats`, `inflict`, `healFull` — efeitos com narração, usados pela batalha e pelos itens. |
| `js/batalha.js` | `turn(action)` (único ponto de entrada da UI), `useMove`, `startBattle`/`startTrainerBattle`, bola do treinador, vitória/derrota/captura, `endBattle`. |
| `js/progressao.js` | `gainExp`, aprender golpe, evolução por nível. |
| `js/itens.js` | `addItem`, `useItem`. |
| `js/amizade.js` | `oferecer` (petisco em batalha), recrutar aliado, `despedir`. |
| `js/fim.js` | `encerrarJornada(motivo)` (resumo → carreira → apaga save aqui e na nuvem), `montarResumo`, tela de fim, `telaCarreira`. |
| `js/roguelike.js` | Desbloqueios do Roguelike entre runs (puro, testado). |
| `js/carreira.js` | Carreira = lista de jornadas terminadas (`pokerpg-carreira-v1`; migra o `pokerpg-recordes-v1` antigo). `calcularCarreira`, `mesclarJornadas`, `melhorDaEspecie`. Puro + `store`, testado. |
| `js/config.js` | `SUPABASE_URL` / `SUPABASE_ANON_KEY` (marcadores = jogo só local). |
| `js/nuvem.js` | Supabase sob demanda: login (Google / link por e-mail), `sincronizar()` (carreira + save em andamento), envio do save com espera, `ganchos` que o main.js liga. |
| `js/golpe.js` | **Motor único do golpe** (single player e multiplayer): usarGolpe, mudarEstagios, aplicarStatus, fimDeTurno, com `ctx` de narração. |
| `js/habilidades.js` | Tabela de habilidades (ganchos) + `hab(m)`, `IMPL`. |
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
- **Conta / nuvem** (Supabase — a Vercel só hospeda; setup em `supabase/COMO-CONFIGURAR.md`, banco em `supabase/schema.sql` com RLS): login com Google ou link por e-mail. `sincronizar()` junta a carreira local com a da conta por `id` (`mesclarJornadas`: sobe só jornada de visitante ou da própria conta, nunca de outra conta que logou no mesmo navegador) e reconcilia a jornada em andamento (tabela `saves`, **uma por conta**): mesma jornada → vale a mais nova (`S.salvoEm`); jornadas diferentes → pergunta qual manter; jornada que já terminou em outro aparelho → descartada aqui. Envio do save: `ganchosSave.aoSalvar` → `agendarEnvioSave` (espera 5 s) + na hora ao esconder/fechar a aba. Sem config, tudo é no-op.
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

- `relatos.js` (tela, `G.mode = 'relatos'`) → `enviarRelato` (nuvem.js) → tabela `relatos` (schema.sql: insert pra anon/authenticated, select só dos próprios). Sem config/offline/falha → fila `pokerpg-relatos-fila`, enviada no `iniciarNuvem` e no `online`. Bug pode anexar `contextoTecnico()` (sem dados pessoais; o jogador vê o JSON antes). Quem mantém lê no Table Editor.

### Próximos passos combinados (em ordem sugerida)
- **Evoluções especiais** (pedido do usuário): hoje `loadEvo` só guarda `trigger` e `min_level` — pedras/itens (use-item), troca (Cabo de Conexão no single player; troca real no multiplayer), amizade, dia/noite, golpe conhecido, zona. A PokéAPI traz tudo em `evolution_details`.
- **Batalha completa** (continua): habilidades → clima → terrenos → itens segurados → golpes especiais/IA → Mega, Z-Moves, Dynamax/Gigantamax, Tera. Desbloqueia uma **espécie** pra próxima run ao derrotar ou fazer amizade com 5–10 dela; evoluir 5× pra forma do meio desbloqueia a do meio, 10× pra forma final desbloqueia a final. Exige progresso persistente entre runs.
- **Etapa 4 — Supabase/multiplayer**: ranking de todos os jogadores (melhor pontuação geral por espécie) e batalha com Pokémon de vários jogadores do mesmo lado (a batalha já é N-do-meu-lado).
- Ideias soltas ainda não pedidas: mais missões (por tipo elemental, por zona), recompensa de Alfa diferente por zona, rank/título de explorador.

## Modo offline

- `sw.js` (service worker, registrado no `index.html`): arquivos do jogo em **rede primeiro** (online pega sempre a versão nova, sem trocar versão a cada deploy; offline cai no cache), PokéAPI/sprites/esm.sh/fontes em **cache primeiro**, Supabase nunca em cache. **Todo arquivo novo em `js/` entra em `PRECACHE`** — `tests/sw.test.js` falha se esquecer.
- Offline (`offline()` em util.js): `sortearOponente` só sorteia Pokémon já em cache (`pokemonEmCache`/`idsEmCache` em api.js); sem nenhum, `erroOffline` com mensagem clara em vez do erro da PokéAPI. Alfa idem.
- Nuvem offline: envio do save fica pendente; `online` → `sincronizar()` (sobe jornadas terminadas + save; save da nuvem de jornada que já terminou é apagado ali). Se o jogo abriu offline, `iniciarNuvem` tenta de novo no `online` (listeners de rede registrados uma vez só). Selo "📴 offline" no topo (`#conta-chip`), com ou sem conta.

## Convenções

- **Toda funcionalidade nova atualiza o `README.md`** (o que o jogo tem + a lista de próximos passos/já feito) — pedido explícito do usuário, vale sempre.
- Regra nova (conta, fórmula, probabilidade) vai em `regras.js` como função pura, com teste; o módulo de narração só chama e escreve a mensagem.
- Tudo que só `regras.js`/`dados.js`/`util.js`/`api.js` importa precisa continuar sem DOM (importável no Node).
- `esc()` em todo texto vindo de fora (apelido, dados da API) dentro de template string.
- Estado compartilhado sempre via `G.*` (nunca `let` exportado).
- Fontes: `--display` (Fredoka) para títulos e números, `--body` (Atkinson Hyperlegible) para texto. A Pixelify Sans saiu (confundia 2/5/8); não voltar a usar fonte pixelada em número.
- Logo e ícones: `img/logo.png` (topo e README, fundo transparente), `img/favicon-32.png` e `img/icone-192.png` (quadrados, gerados do logo com margem transparente — o original é 373×309). Estão no PRECACHE do sw.js.

## Testes

`tests/*.test.js` com `node:test` — rodar com `node --test` **sem caminho**. CI em `.github/workflows/testes.yml` roda a cada push/PR (aba Actions do GitHub).
