# PokéRPG

RPG de texto no navegador em que **você é o Pokémon** (sem treinador, sem captura). **Não é protótipo** (pedido do usuário): nada de "protótipo" em texto de UI; efeito que ainda não existe (golpe/habilidade sem efeito) diz "será ajustado em atualizações futuras". Dados ao vivo da PokéAPI; fórmulas dos jogos (stats, IV/EV, natureza, dano, tipos, estágios, status, XP, evolução). JavaScript puro em ES modules, sem build, sem dependências. Save no `localStorage` (`pokerpg-save-v1`). PT-BR na UI, comentários e nomes novos (identificadores herdados do protótipo seguem em inglês).

> **Este arquivo é só o essencial** (ele é carregado em TODA sessão). O detalhe mora em:
> - **`docs/features.md`** — como cada coisa foi construída: o que foi considerado, o que foi simplificado de propósito, o que ficou de fora. **Leia ao mexer numa área.**
> - **`docs/historico.md`** — post-mortems dos bugs já corrigidos (o relato do jogador, o que foi descartado no diagnóstico).
> - `docs/auditoria-batalha.md` — ⚠️ **desatualizado** (parou na 2ª leva de habilidades). Não usar como fonte; a contagem certa é `IMPL.size`.

## Como rodar

Precisa de servidor HTTP (ES modules não carregam por `file://` — o `index.html` avisa nesse caso):

```
python3 -m http.server 3000   # na raiz → http://localhost:3000
```

Duas máquinas de dev:
- **Windows**: usar PowerShell, não Bash (o Bash embutido falha no fork). **Não há Node** — não tentar rodar `node`; os testes rodam no CI.
- **Raspberry Pi (Linux/aarch64)**: Node e npm instalados (`node --test` roda a suíte inteira local). Bash normal. É `python3`, não `python`. Sem navegador e sem PIL: pra reproduzir bug de UI, usar **jsdom** (leve; o Pi tem pouca RAM), não Chromium.

## Arquitetura

- **Grafo de imports sem ciclos**: `util`/`dados`/`layout` → `regras`/`api` → `estado` → `ui` → `paineis` → `render` → `efeitos`/`progressao`/`pokemon` → `itens`/`amizade`/`missoes`/`fim`/`criacao` → `batalha` → `mundo` → `main`. `batalha` importa `encerrarJornada` de `fim`, então **`fim` nunca pode importar `batalha`**.
- **Sem DOM** em `regras.js`/`dados.js`/`util.js`/`api.js`/`layout.js` (precisam ser importáveis no Node).
- Regra nova (conta, fórmula, probabilidade) vai em **`regras.js` como função pura, com teste**; o módulo de narração só chama e escreve a mensagem.
- Estado compartilhado sempre via **`G.*`** (nunca `let` exportado).
- **`esc()`** em todo texto vindo de fora (apelido, dados da API) dentro de template string.
- **`golpe.js` é o ÚNICO lugar que resolve um golpe** (`usarGolpe`, `mudarEstagios`, `aplicarStatus`, `fimDeTurno`). Single player e multiplayer usam o mesmo; a diferença é o `ctx` de narração (`efeitos.CTX` x o que `mp-motor.resolverTurnoMP` monta — por isso ela é async). **Nunca reimplementar golpe em outro arquivo.**

## Estrutura

| Arquivo | Papel |
|---|---|
| `index.html` | Esqueleto: header (`#topr` + `#conta-chip`), `#app`, aviso de `file://`, carrega `js/main.js`, registra `sw.js`. |
| `sw.js` | Service worker do modo offline. **Todo arquivo novo em `js/` entra no `PRECACHE`** (`tests/sw.test.js` falha se esquecer). |
| `README.md` | Página do projeto. **Atualizar a cada funcionalidade nova.** |
| `css/estilo.css` | Todo o CSS. |
| `img/` | `logo.png`, `favicon-32.png`, `icone-192.png`. |
| `js/main.js` | Entrada: listeners delegados (`data-act`/`data-v`) e `boot()`. |
| `js/estado.js` | `G` (estado mutável: `S` save, `B` batalha, `PV` prévia, `mode`, `busy`, `panel`), `zone()`, `nm()`, `save()`, `centroPokemon()`. |
| `js/util.js` | `rand`/`pick`/`clamp`/`sleep`/`fmt`/`esc`/`lastSeg`/`store`/`offline`. Sem DOM. |
| `js/dados.js` | Tabelas fixas: tipos (`CHART`, `TYPE_PT`, `TC`), `NATURES`, `ITEMS`, `ZONES`, `FLAVOR`, `MISSOES`, `DIFICULDADES`, `REGIOES_INICIAIS`… Sem DOM. |
| `js/regras.js` | **Fórmulas puras** (testadas): `calcStats`, `calcDamage`, `effStat`, `typeEff`, `chanceAcerto`, `consegueFugir`, `danoResidual`, `imuneAoStatus`, `xpPorVitoria`, `ganhoDeEVs`, `ordenarAcoes`, `rotaEsgotada`, `pontuacao`… |
| `js/api.js` | PokéAPI com cache: memória + **IndexedDB** (`pokerpg-cache`), `localStorage` só de reserva. `iniciarCache()` antes do boot. `buildLearnset`/`slimPokemon`/`slimMove` puras. |
| `js/ui.js` | `$`, `REDUCED`, log (`log`/`say`/`logRaw`), modal `ask`, `toast`, `shake`, `atacar`, `iniciarMenu`. |
| `js/render.js` | `render()` (re-render total), `buildGame()`, `badge`, `spriteFrente`, `spriteItem`. |
| `js/layout.js` / `js/paineis.js` | Modelo puro do layout dos painéis (testado) / DOM: arrastar, ▲▼⇄▾, divisórias, restaurar. |
| `js/pokemon.js` | `makeMon(data, level, opt)` — instância jogável. |
| `js/efeitos.js` | `changeStats`, `inflict`, `healFull` + `CTX` (narração do single player). |
| `js/golpe.js` | **Motor único do golpe** (ver Arquitetura). |
| `js/habilidades.js` | Tabela de ganchos + `hab(m)`, `IMPL`. **Só o que está na tabela tem efeito** (hoje 215 de 314 reais). Gancho novo = código no motor + teste. |
| `js/especiais.js` | `GOLPES_ESPECIAIS` + `especial(g)`: golpes cujo efeito não cabe no `meta` da PokéAPI. Sem imports. |
| `js/segurados.js` | **Itens segurados** (puro): `M.item` = id em ITEMS; `SEGURADOS` = tabela de ganchos. `seg(m)` é o ÚNICO ponto por onde toda leitura de item passa. |
| `js/batalha.js` | `turn(action)` (único ponto de entrada da UI), `useMove`, `startBattle`/`startTrainerBattle`/`startBossBattle`/`startEvento`, vitória/derrota/captura, `endBattle`. |
| `js/progressao.js` | `gainExp`, aprender golpe, evolução por nível, `checkEvolution`. |
| `js/evolucao.js` | **Evoluções especiais** (puro): avalia `evolution_details` da PokéAPI. `EVO_ALTERNATIVAS` cobre os 19 casos sem suporte. |
| `js/itens.js` | `addItem`, `useItem`, `equiparItem`/`tirarItem`, `ensinarGolpe`, `usarRepelente`, `usarRaide`. |
| `js/amizade.js` | `oferecer` (petisco em batalha), recrutar aliado, `despedir`. |
| `js/missoes.js` | `verificarMissoes()` — anuncia missões novas e entrega prêmio. |
| `js/mundo.js` | `explore()`, `desafiarChefe()`, `desafiarEvento()`. |
| `js/criacao.js` | Tela de criação: dificuldade → mapa → iniciais, prévia, `iniciarJornada`, `fullRandomizer`. |
| `js/fim.js` | `encerrarJornada(motivo)`, `montarResumo`, tela de fim, `telaCarreira`. |
| `js/carreira.js` | Carreira = jornadas terminadas. `calcularCarreira`, `mesclarJornadas`, `gimmicksNaLoja`, `hallDaConta`, `saldoArenaDaConta`. |
| `js/progresso-conta.js` | **Progresso permanente da conta** (puro). Regra única: **nunca encolhe**. `bancar()` idempotente por id de jornada. |
| `js/conquistas.js` / `js/tela-conquistas.js` | Conquistas da conta (puro + tela). `registrarAbate` em `batalha.win()`. As gimmicks somam a CARREIRA, não a run. |
| `js/badges.js` | 53 badges numa tabela única (puro) → vantagem na PRÓXIMA jornada. Medidas do progresso permanente, nunca do histórico. |
| `js/mega.js` / `js/tera.js` / `js/zmove.js` / `js/dynamax.js` | As 4 gimmicks. **`endBattle` desfaz todas** — senão o estado vai junto no save, pra sempre. |
| `js/mapas.js` / `js/dados-mapas.js` | Mapas por Gen. `dados-mapas.js` é **GERADO** por `ferramentas/gerar-mapas.ps1` — não editar à mão. |
| `js/roguelike.js` | Desbloqueios entre runs (puro). Só conta jornada `roguelike` (não dá pra farmar no Fácil). |
| `js/evento.js` / `js/boss.js` / `js/hall.js` / `js/arena.js` | Chefe da semana (calendário, 14 chefes), regras do chefe, Hall da Fama (puro), Arena. |
| `js/loja-conta.js` | Loja de preparo + reidratar Pokémon do Hall, **compartilhado** por Arena e Sala de Raide. Tem rede, sem DOM. |
| `js/mp-motor.js` | Motor puro da batalha multiplayer (lados A/B com N Pokémon). Testado. |
| `js/multiplayer.js` | Salas por código (Realtime), anfitrião autoritativo, telas da sala, chat. |
| `js/nuvem.js` | Supabase sob demanda: login, `sincronizar()`, `sincronizarComRetentativa`, `idJogador()`, `sb()`. |
| `js/presenca.js` | "Jogando agora" (canal global, `track({})` vazio — nunca identifica quem). Interruptor em ⚙ Ajustes. |
| `js/offline.js` | Baixar um mapa (ou o jogo inteiro) pra jogar offline. |
| `js/navegacao.js` | **`TELAS` é a ÚNICA lista de telas** — tela nova entra lá e aparece na barra e no menu ☰. `barraTelas(atual)`. |
| `js/ajustes.js` / `js/tela-ajustes.js` | Fonte, estilo de sprite, presença, download offline. |
| `js/tutorial.js` / `js/tela-tutorial.js` | ❓ Tutorial (puro + tela). Desenha em `G.tut`, **nunca** `G.S`. |
| `js/relatos.js` / `js/imagens-relato.js` | Bugs e sugestões (funciona offline, com fila), até 2 imagens de 2 MB. |
| `js/conta.js` / `js/perfil-amigo.js` / `js/ranking.js` / `js/saves.js` / `js/tela-*.js` | Telas. |
| `js/dados-patchnotes.js` / `js/tela-patchnotes.js` | 📜 Novidades. **Toda leva de mudanças vira uma versão nova aqui**, escrita à mão, mais nova primeiro. Texto PRA JOGADOR (nada de nome de arquivo/função) e cada versão leva uma piada. |
| `js/config.js` | `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`ADSENSE_CLIENT_ID` (marcadores = aquela parte desligada). |
| `js/ads.js` / `js/tela-privacidade.js` | AdSense desligado por padrão; **nunca carrega o script do Google antes do consentimento** (GDPR). |
| `js/dados-megas.js` · `dados-golpe-flags.js` · `dados-evolucao-restante.js` · `dados-item-sprites.js` | **GERADOS** por `ferramentas/` — não editar à mão. |

## Armadilhas (o que já quebrou — detalhe em `docs/historico.md`)

- **`try` largo demais vira diagnóstico errado.** Só o que fala com a rede pode reportar erro de rede; o resto mostra o erro de verdade. (Uma função faltando virou "a conexão falhou" e custou horas ao jogador.)
- **Falha silenciosa em render é o pior bug.** Quando montar uma tela estourar no meio, mostre o erro NA TELA e no console — metade da tela com HTML velho parece funcionalidade faltando, não defeito. Vale pro `renderSala` (multiplayer) e pro `gimmicksNaLoja` (carreira).
- **Função chamada dentro de template literal só quebra quando a tela é desenhada.** `tests/referencias.test.js` varre isso em dois formatos (colada no `${` e nome em MAIÚSCULA colado no `(`).
- **`node --check` não roda no Windows.** Arquivo novo ou reescrito é o maior risco do projeto; o CI é a única rede lá. (`S?.x ||= []` é erro de sintaxe e derrubou o jogo inteiro.)
- **`navigator.onLine` mente.** `cached()` cai no registro guardado quando o `loader()` FALHA, não só quando `semRede()`. Todo código que decide por `offline()` precisa de um caminho "tentei e falhou".
- **Busca não essencial não pode derrubar o fluxo.** Antes de `await` numa busca de rede em caminho crítico, perguntar se o jogo precisa DAQUILO agora.
- **As imagens vêm do `cdn.jsdelivr.net`**, não do `raw.githubusercontent.com` (bloqueado em muitas redes). **`espelhar(url)` é obrigatório** em qualquer lugar que desenhe `m.data.sprite`/`back`/`art`.
- **Quem guarda as IMAGENS é o service worker**, não o `api.js`: sem sw controlando a página, o download "termina" e nada fica guardado (`semServiceWorker()` detecta).
- **`baixarGen` precisa trazer TUDO o que uma jornada pede** (Pokémon, learnset, curva de XP, árvore de evolução, sprites). Já faltou duas vezes. Ao acrescentar qualquer busca nova num fluxo, perguntar: **isso está no `baixarGen`?** Cresceu a lista → subir **`VERSAO_DOWNLOAD`**.
- **Celular: não reintroduzir "esconder painel por aba".** As abas ⚔/💬/📋 foram removidas a pedido de quem joga (cada uma escondia dois terços da tela). O problema que resolviam já está resolvido pela cena presa no topo.
- **Golpe que restringe a escolha (Taunt, Encore, Disable, Torment, Choice, Colete) passa SEMPRE por `regras.golpesPermitidos`/`motivoBloqueio`.** As 3 telas de golpe, os aliados, a IA (`escolhaIA` recebe a lista já filtrada) e o motor (`usarGolpe`) leem a mesma função — nunca reimplementar a regra numa tela. O motor precisa conferir também: o efeito pode chegar DEPOIS de escolhido o golpe (o inimigo mais rápido que te provoca faz o seu status falhar; sob Encore a escolha é TROCADA).
- **Itens de raide: a descrição em `dados.js` termina em `Serve contra: …` e essa lista é DERIVADA do código** (`js/itens-raide.js`: `SERVE`, `textoServe`, `TIPO_DO_GOLPE`). O prêmio gira em rodízio e não combina com o chefe, então o jogador precisa saber contra quem cada item presta. `tests/itens-raide.test.js` confere descrição × código. **Chefe novo** = completar `TIPO_DO_GOLPE` (o teste cobra); **item ou mecânica de chefe nova** = uma linha em `SERVE` e atualizar a descrição. A ajuda (`ajuda-chefes.js`) e a linha da caixa do chefe (`linhaItensDoChefe`) leem daí.
- **Saída de campo sem desmaiar** (Roar, Red Card, Wimp Out…) passa por `ctx.forcarSaida(m, {motivo})`, implementado em `batalha.forcarSaida`; o motor (`golpe.js`) só PEDE. Quem saiu ganha `vol.retirado` (zerado em todo início/fim de batalha, nunca vaza pro save) e `emCampo()` o exclui. **Dentro de `turn()`, releia `E = B.enemy` depois de qualquer ação** — o inimigo pode ter sido trocado no meio, e o loop pula quem tem `retirado`. Nunca chame `endBattle()` de dentro de um golpe: marque `B.saidaForcada` e o `turn()` encerra.
- **Nunca assumir "só 1 do meu lado"** — é a base do multiplayer e dos aliados.
- **Do lado do jogador ninguém troca de Pokémon**, então armadilha de entrada ali é inerte (o golpe avisa em vez de fingir). Roar/Baton Pass provavelmente nunca entram por isso.
- **Ler rota por `zone()`/`rotasAtuais()`**, nunca `ZONES` direto na jornada (elas aplicam `rotaNaJornada`, com níveis escalados).
- **`tirarIniciais` e `especiesDaGen` PULAM rotas `posVitoria`** (o Santuário). Quem varrer rotas pra filtrar conteúdo tem de pular também, senão o Santuário deixa de garantir a completude da Pokédex.
- **Ao mexer em velocidade, lembrar do clima** — a ordem do turno usa `effStat(..., clima)` nos DOIS motores.
- **Cuidado com o nome**: `espetos` é o Elmo Rochoso (item); `espinhos` é o Spikes (campo).
- **Copiar `m.data` antes de alterar** (`{ ...m.data, base }`): esse objeto vem do cache e é compartilhado por todos da espécie.
- **`endBattle` desfaz Mega/Tera/Dynamax/Forma/Trace/Ash-Greninja.** Sem isso o estado vai junto no save.
- **Nunca gravar arquivo com BOM.** `Set-Content`/`Out-File -Encoding utf8` no PowerShell 5.1 grava COM BOM e já quebrou o deploy do banco. Usar `[System.IO.File]::WriteAllText($p,$t,(New-Object System.Text.UTF8Encoding $false))`.
- **Campo de formulário já nasce vestido**: `input`/`select`/`textarea` têm regra base no topo do CSS (usa `:where()` pra ser PISO, não teto). Não estilizar campo novo à mão. Sem ela o navegador desenha o fundo branco padrão e o `color:inherit` deixa texto claro em cima — ilegível.

## Mecânicas

### Dificuldade
`S.dificuldade`, tabela `DIFICULDADES` (dados.js), lida por `dificuldadeDe(S)` (save antigo = `easy`). **O código lê as FLAGS de cada modo, nunca compara o nome**: `semCaptura`, `fimDeJogo`, `centroGratis`, `descontoPorVitoria`, `nivelLivre`, `escolhaLivre`, `fimNaGen`, `permadeath`, `desbloqueios`, `eventoSemanal`, `climaRotasFixo`, `especiesLivres`.
- `roguelike` **Roguelike** (padrão, primeiro da lista): permadeath, desbloqueios entre runs, captura = fim, 3 desmaios livres, nível 5, pontos ×1,5.
- `easy` Fácil: nunca capturado, Centro grátis, escolhe tudo. · `medium` Médio: Centro pago com −10% por vitória. · `hard` Difícil: capturado → foge sem mochila, metade do dinheiro. · `hardcore`: capturado → fim de jogo. · `randomizer`: sorteia até a espécie.

### Mundo e progressão
9 Gens × 10 rotas + **Santuário** (11ª, `posVitoria`: pool com TODA a Gen, exige `S.gensVencidas`, ignora nível — é o que garante a completude da Pokédex). `pool = [{id, n: speciesName, p: peso, m?: mítico}]`, sorteio ponderado. Rotas 1–9 têm `chefe` (Alfa); a 10ª tem `final: true` + `lendarios`.
- **Zonas por nível** (`libera`/`zonaLiberada`). **Alfas**: IVs 31, `statsDeChefe` (HP ×2, resto ×1,3); 1ª vitória dá `premioChefe` + Rare Candy.
- **Anti-grind (só Roguelike)**: `regras.rotaEsgotada` — passou de `limiteDaRota` (dobro do teto, com piso de +15 níveis) e a rota não dá mais encontro. A Pokédex dela continua.
- **Vencer os lendários** → `vencerGen()`: marca `S.gensVencidas`; modo com `fimNaGen` encerra a run, senão oferece o mapa seguinte (seguir com o mesmo Pokémon vale MENOS pontos, `multContinuacao`).
- **Missões**: `MISSOES` (36) com `libera`/`objetivo`/`premio`, avaliadas por `situacaoMissoes` (puro, testado).
- **Repelentes** e **🎯 Caça Shiny** (`S.caca`): `especieForcada` põe o repelente na frente da caça. `cacaveisDaRota` exclui mítico E lendário.

### Batalha
- **Aliados** (`S.aliados`, máx. `MAX_ALIADOS` = 2): recrutados com petisco (`amizade.js`), agem no turno (`ordenarAcoes`: prioridade → `rapido` (Garra Rápida) → `lento` → velocidade), têm `ORDENS` (livre/fraco/status/parado/fora).
- **IA do inimigo**: `regras.escolhaIA(..., contexto)` → `notaDoGolpe(g, {u, alvo, campo, ladoU, ladoAlvo, nivel})`; a nota é ≈ "% do HP do alvo que o golpe vale". `nivelDaIA(esperteza)` dá o degrau: `simples` (selvagem, dano bruto como sempre), `basico` (treinador: dano + status que pega + cura), `completo` (Alfa/lendário/chefe: tudo). Sem `contexto` ou no degrau `simples`, é a IA antiga. **Golpe/efeito novo que a IA deve entender = uma linha em `notaDoGolpe`**; sem regra, vale `IGNORADO` (2) e só é escolhido se não houver nada melhor. Chamada em `batalha.chooseEnemyMove` e `mp-motor.acaoDaIA`, sempre sobre `golpesPermitidos`.
- **Clima** (`regras.CLIMAS`, 5 turnos) e **terreno** (`TERRENOS`) vivem no `campo`, compartilhado pelos dois lados. Terreno **só afeta quem está no chão** (`noChao`). Rota pode ter clima/terreno padrão (`CLIMA_DA_ROTA`, opcional por jornada: `climaDasRotasAtivo(S)`).
- **Lado do campo** (`campo.lados`): telas, salvaguarda, neblina, vento, armadilhas. `multTelas` recebe o lado de QUEM DEFENDE.
- **Gimmicks**: Mega, Tera, Z-Move, Gigantamax — conquistadas na CARREIRA, uma por batalha, não gastam o turno (o Z **é** o turno). O inimigo também usa (regras em `docs/features.md`).
- **Batalha sobrevive ao F5**: `S.batalha = ganchosSave.serializarBatalha(G.B)`; `restaurarBatalha` reaponta `B.enemy` pra `trainer.equipe[atual]`.
- **Segredo do brilho**: jogador shiny ganha XP e dinheiro em dobro e Centro grátis. **É segredo — não entra no README nem nos patch notes.**

### Multiplayer
Sala por código (4 caracteres), até `MAX_JOGADORES` = 6, funciona sem login. Anfitrião é a autoridade: monta os lados, junta as escolhas, prazo de 45 s, roda `mp-motor` e publica.
- **`modo`**: `'coop'` (a run do anfitrião) · `'pvp'` (Time A × B) · `'raide'` (chefe da semana com o Hall da Fama, sem run nenhuma).
- **`entradaTipo`** (de cada jogador, independente do modo): `'run'` · `'convidado'` (Nv. 5) · `'hall'` (até `MAX_TIME_HALL` = 3 do Hall da Fama, nível real). `entradaEfetiva()` é o ÚNICO ponto que decide (raide força `'hall'`). `semMochila()` e `usaRun()` derivam dali. Escolhível no menu **e dentro da sala**.
- **Ganhos só no nível real** (`naNivelReal`): balanceado com nível ajustado = diversão, sem XP/itens pra run.
- **Resultado volta por fração de HP** (o nível pode ter sido balanceado). PvP não sincroniza nada.
- Sala resistente a rede ruim: reenvio, pulso do anfitrião, 🔄 Sincronizar, `CHANNEL_ERROR` não fecha a sala.

### Conta, nuvem e offline
- **Fim de jornada** → resumo (`montarResumo`) → **carreira** (`pokerpg-carreira-v1`) → apaga o save (aqui e na nuvem). Modos com `eventoSemanal` também entram no **Hall da Fama**.
- **Progresso permanente** (`progresso-conta.js`): **nunca encolhe**; `porJornada` pela chave do id (fusão entre aparelhos sem contar em dobro). Local primeiro, nuvem depois.
- **Sincronizar depois de gravar progresso usa `sincronizarComRetentativa`** (3 tentativas + pendente até confirmar): `sincronizar()` engole a própria falha, e uma rede ruim na tela de Game Over já perdeu um Hall da Fama.
- **Offline**: `sortearOponente` só sorteia o que está em cache; sem nada, mensagem clara. `sw.js`: arquivos do jogo em rede-primeiro, PokéAPI/sprites em cache-primeiro, Supabase nunca. `cachePrimeiro` usa `match(req,{ignoreVary:true})`.

## Testes

`tests/*.test.js` com `node:test` — rodar com `node --test` **sem caminho**. CI em `.github/workflows/testes.yml`.

- **`tests/docs-numeros.test.js` trava os números deste arquivo e do README contra o código.** Motivo: um levantamento achou 6 afirmações erradas de uma vez ("~30 badges" quando são 53; "96 formas, 93 espécies" de Mega quando são 95/89, contradizendo o "89 Megas" escrito adiante; e coisas dadas como pendentes que já estavam prontas). São frases-âncora + uma varredura genérica de `` `CONSTANTE` = N ``. **Mudou o número no código → atualize a frase aqui.**
- `tests/referencias.test.js` — função/ajudante chamado em template literal que não existe.
- `tests/schema.test.js` — pesos de pontuação do SQL x `regras.js`. **Mudou num lado, muda no outro.**
- `tests/sw.test.js` — arquivo novo em `js/` entrou no PRECACHE.
- `tests/habilidades.test.js` — falha se aparecer gancho desconhecido na tabela.

## Supabase

Banco atualizado pela **integração do GitHub no painel do Supabase**: *working directory* **`/`** (o diretório que CONTÉM a pasta `supabase/`, não ela mesma — `/supabase` fez duas migrations sumirem em silêncio por dias).

- **Mudança nova = ARQUIVO NOVO** em `supabase/migrations/`, nunca editar migration já aplicada.
- Nome no padrão `<AAAAMMDDHHMMSS>_nome.sql` — fora do padrão a integração ignora.
- **Uma vez só, à mão**: `supabase/LIGAR-MIGRATIONS.sql` (projeto criado pelo SQL Editor não tem a tabela de controle).
- **Como verificar que uma migration chegou**: não confie no painel. `select('*',{count:'exact',head:true})` devolve `error` nulo até pra tabela inexistente — isso já escondeu o problema por uma rodada.
- Nada destrutivo aqui: `drop`/`alter` que possa perder dado vai num arquivo rodado à mão.
- **Pontuação é do servidor**: o gatilho `validar_jornada` recalcula e recusa número impossível. Modo novo → acrescentar no `case` do SQL.

## Convenções

- **Toda funcionalidade nova atualiza o `README.md`** e vira **uma versão nova em `dados-patchnotes.js`** — pedido explícito do usuário, vale sempre.
- Fontes: `--display` (Fredoka) para títulos e números, `--body` (Atkinson Hyperlegible) para texto. Não voltar a usar fonte pixelada em número (a Pixelify Sans saiu porque confundia 2/5/8).
- Telas fora do jogo limpam o topo com **`limparTopo()`**, nunca `#topr.innerHTML = ''`.
- Tela nova = `barraTelas('id')` + entrada em `navegacao.TELAS`.
- `prefers-reduced-motion` já é global no CSS — animação nova não precisa de tratamento próprio.

## Backlog

**Pedido, ainda não construído**
- **Som no jogo.** Os *cries* existem na PokéAPI (mesmo repositório dos sprites, `pokemon.cries`) e dá pra usar `espelhar`. **Música a PokéAPI não tem** — precisaria de outra fonte, e aí vira decisão de risco (trilha original = direito autoral). Falta decidir: ligado por padrão? quais eventos tocam cry?
- **Arceus como chefe de raide** — decidir se entra na rotação (mudaria o `% 14`) ou é evento à parte.
- **Troca de verdade** entre dois jogadores (hoje só o Cabo de Conexão simulado).
- **Missões próprias de cada mapa** (hoje as de espécie valem em qualquer Gen; a trilha de Alfas é só de Kanto) e **lendários no co-op**.
- **Roar & cia. em luta de SALA (multiplayer)**: hoje falham com aviso (`ctx.forcarSaida` só existe no single player). Regenerator/Natural Cure/Wimp Out também só valem no single player. Precisaria de "tirar da luta" no `mp-motor` (o Pokémon fora não é derrotado, e o resultado volta por fração de HP). **Eject Button/Eject Pack não foram feitos**: só serviriam a aliados (no seu principal a saída voluntária não vale). Shed Tail não foi feito (não existe Substitute). Detalhes em `docs/features.md` ("Travas, IA e troca de Pokémon").
- **Habilidades**: 215 de 314. Boa parte das 99 restantes está documentada como intencionalmente fora (ver `docs/features.md`).
- **Frutas de aperto por tipo** (Occa, Passho…) — os outros itens segurados já entraram.

**Precisa de ação do usuário**
- ⚠️ **`evento.BETA_SEM_ESPERA = true`** remove a espera de 8 h entre tentativas (beta testers). **Temporário** — reverter é trocar essa linha.
- **AdSense**: `ADSENSE_CLIENT_ID` ainda é o marcador. Quando a conta for aprovada, preencher ele + `AD_SLOT_INICIO` (criacao.js) e publicar o `ads.txt`.

**Ideias soltas (nunca pedidas)**: mais missões por tipo/zona · recompensa de Alfa diferente por rota · rank/título de explorador · resumo de badges já calculado no perfil de amigo.

**Decisões fechadas que continuam valendo**: XP por Gen fica canônico (Paldea dá mais que Kanto — é dado da franquia). Formas de Hisui no Santuário de Galar (é como a PokéAPI classifica). Teto de aliados **continua em 2** (o Esconderijo já resolve "guardar mais parceiros"; subir mudaria o balanceamento). Painel de manutenção **continua** (jogo em ajuste ativo). Só iniciais na criação em todos os modos (`especiesLivres` false).
