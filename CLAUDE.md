# PokéRPG

RPG de texto no navegador em que **você é o Pokémon** (sem treinador, sem captura). **Não é protótipo** (pedido do usuário): nada de "protótipo" em texto de UI; efeito que ainda não existe (golpe/habilidade sem efeito) diz "será ajustado em atualizações futuras". Dados ao vivo da PokéAPI; fórmulas dos jogos (stats, IV/EV, natureza, dano, tipos, estágios, status, XP, evolução). JavaScript puro em ES modules, sem build, sem dependências. Save no `localStorage` (`pokerpg-save-v1`). PT-BR na UI, comentários e nomes novos (identificadores herdados do protótipo seguem em inglês).

> **Este arquivo é só o essencial** (ele é carregado em TODA sessão). O detalhe mora em:
> - **`docs/features.md`** — como cada coisa foi construída: o que foi considerado, o que foi simplificado de propósito, o que ficou de fora. **Leia ao mexer numa área.**
> - **`docs/historico.md`** — post-mortems dos bugs já corrigidos (o relato do jogador, o que foi descartado no diagnóstico).
> - `docs/auditoria-batalha.md` — ⚠️ **desatualizado** (parou na 2ª leva de habilidades). Não usar como fonte; a contagem certa é `IMPL.size`.

## Onde o jogo está no ar

**`https://www.pokerpg.com.br`** — domínio próprio, comprado em 29/09/2026. O apex (`pokerpg.com.br`) responde **308 e manda pro `www`**, então o endereço canônico é o com `www`: é ele que está em `URL_SITE` (`js/site.js`), de onde saem os `canonical`, o `sitemap.xml` e o `robots.txt`.

O endereço antigo da Vercel (`poke-rpg-omega.vercel.app`) **continua no ar servindo o mesmo site**. Isso é conteúdo duplicado aos olhos do buscador — os `canonical` apontando pro domínio próprio é o que resolve. **Endereço absoluto novo sai de `URL_SITE`, nunca digitado à mão.**

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
| `js/mp-sanear.js` | **O que chega da sala não é confiável** (puro, sem NENHUM import): `saneado`, `urlDeImagem`, `estadoDaRede`/`fimDaRede`/`pingDaRede`/`chatDaRede`/`lobbyDaRede`/`acaoDaRede`/`membroDaRede`, `doAnfitriao`. É o CHÃO do grafo — `render.js` também importa daqui. |
| `js/mp-regras.js` | **Regras puras da sala** (testadas): `entradaEfetiva`, `semMochila`/`usaRun`, `jogaveis`, `minhaVezDe`, `quemFalta`, `todosProntos`, `motivoParaNaoComecar`, `montarLado`, `podeReviver`, `raideDisponiveis`, `itensComunsDisponiveis`, `SEM_BATALHA_MP`. Sem DOM, sem rede. |
| `js/mp-rede.js` | Canal, envio com fila e retentativa, pulso, presença, diagnóstico. Sem DOM: avisa a tela por `ligarRender(fn)`. |
| `js/mp-cartao.js` | Como um Pokémon aparece: `cartao` (lobby) e `cenaMP`/`unidadeMP` (a luta). **A Arena importa daqui**, não de `multiplayer.js`. |
| `js/mp-telas.js` | Todo o HTML da sala (menu, lobby, luta, chat). **Nunca importa as ações** — quem despacha `data-act` é o `main.js`. |
| `js/mp-resultado.js` | Aplicar o fim da luta no save/conta (`aplicarCoop`/`aplicarPvP`/Raide, prêmios) e descontar a mochila (`minhaMochila` é o único ponto que decide run × conta). |
| `js/multiplayer.js` | Orquestração da sala: entrar/sair, **anfitrião autoritativo** (montar a luta, juntar escolhas, rodar o motor, publicar) e as ações do `data-act`. A sala vive em **`G.sala`**. |
| `js/nuvem.js` | Supabase sob demanda: login, `sincronizar()`, `sincronizarComRetentativa`, `idJogador()`, `sb()`. |
| `js/presenca.js` | "Jogando agora" (canal global, `track({})` vazio — nunca identifica quem). Interruptor em ⚙ Ajustes. |
| `js/offline.js` | Baixar um mapa (ou o jogo inteiro) pra jogar offline. |
| `js/navegacao.js` | **`TELAS` é a ÚNICA lista de telas** — tela nova entra lá e aparece na barra e no menu ☰. `barraTelas(atual)`. |
| `js/ajustes.js` / `js/tela-ajustes.js` | Fonte, estilo de sprite, presença, download offline. |
| `js/tutorial.js` / `js/tela-tutorial.js` | ❓ Tutorial (puro + tela). Desenha em `G.tut`, **nunca** `G.S`. |
| `js/relatos.js` / `js/imagens-relato.js` | Bugs e sugestões (funciona offline, com fila), até 2 imagens de 2 MB. |
| `js/conta.js` / `js/perfil-amigo.js` / `js/ranking.js` / `js/saves.js` / `js/tela-*.js` | Telas. |
| `js/dados-patchnotes.js` / `js/tela-patchnotes.js` | 📜 Novidades. **Toda leva de mudanças vira uma versão nova aqui**, escrita à mão, mais nova primeiro. Texto PRA JOGADOR (nada de nome de arquivo/função) e cada versão leva uma piada. |
| `js/config.js` | `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`ADSENSE_CLIENT_ID`/`AD_SLOT_*` (marcador ou vazio = aquela parte desligada). O publisher ID vive em **3 lugares** (aqui, `<head>` do `index.html`, `ads.txt`) e `tests/paginas.test.js` compara os três. |
| `js/consent.js` | **Consent Mode v2**, script CLÁSSICO e síncrono no `<head>` (não é módulo, não tem import): põe o consentimento em `denied` **antes** do script do Google. Ordem invertida = anúncio personalizado sem consentimento; `tests/paginas.test.js` cobra a ordem em todas as páginas. |
| `js/ads.js` / `js/tela-privacidade.js` | Banner de consentimento, sinal pro Google (`gtag('consent','update')`) e os slots. **O script do Google vem no `<head>`, sempre** (a revisão precisa achá-lo) — o que o aceite controla é cookie/personalização, não o carregamento. `blocoAds` só desenha com `AD_SLOT_*` preenchido. |
| `js/site.js` · `js/texto-privacidade.js` | Site fora do jogo: e-mail de contato, aviso de marca, `PAGINAS`, `CAPITULOS_GUIA`, `rodapeHTML()` — e o texto da política. **Sem DOM** (o gerador os importa no Node). |
| `sobre/guia/guia-*/privacidade/termos/contato.html` · `sitemap.xml` | **GERADOS** por `ferramentas/gerar-paginas.mjs` (texto em `conteudo-site.mjs` e `conteudo-guia.mjs`) — não editar à mão. Mexeu no texto-fonte → rodar o gerador; `tests/paginas.test.js` cobra. Capítulo novo do guia = entrada em `CAPITULOS_GUIA` + corpo em `conteudo-guia.mjs` + linha no `PRECACHE` do `sw.js`. `noRodape` mantém os capítulos fora do rodapé (índice e navegação próprios). Pendências em `docs/adsense.md`. |
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
- **A sala NARRA o turno** (`multiplayer.narrar`, `PAUSA_NARRACAO`): o motor devolve o turno inteiro pronto, então a sala revela as linhas com pausa e destaca o cartão de quem age. Cada evento de `mp-motor.resolverTurnoMP` leva `ref` (quem estava agindo — `porConta`), e quem age vira ESTADO (`sala.atuandoRef`, lido por `cartao`), não uma classe solta: a sala se redesenha a cada pulso/presença e o destaque tem de sobreviver. `REDUCED` recebe tudo de uma vez. **O HP dos cartões já é o do FIM do turno** (a foto que chega não tem os passos intermediários) — a narração mostra ordem e autor, não HP baixando.
- **Multiplayer: a camada de cima nunca é importada pela de baixo.** `mp-regras → mp-rede → mp-cartao → mp-telas → multiplayer`. A rede pede redesenho por `ligarRender`; as telas só produzem HTML com `data-act`. `tests/imports.test.js` cobra as duas coisas (e que todo import nomeado existe do outro lado — sem navegador aqui, era o erro que só aparecia pra quem joga).
- **`renderSala` é TRANSAÇÃO**: monta `#mp-topo` e `#mp-acoes` primeiro, só então escreve, e não toca no DOM se o HTML for igual ao que já está lá (`pintado`). Meia tela velha com meia nova foi o bug do `SPR_SHINY`; e reescrever tudo a cada pulso apagava o que estava sendo digitado no chat.
- **Todo pacote que entra pela sala passa por `mp-sanear` ANTES de encostar no estado ou na tela.** O canal Realtime é broadcast com a chave anônima: quem está na sala manda o que quiser e o Supabase não assina o remetente. Isso já foi XSS de verdade — `Nv. ${m.level}` e `${m.hp}/${m.stats.hp}` iam crus pro HTML (texto era escapado, número era número "por fé"), e o endereço da sprite entrava DENTRO de `onerror="…src='AQUI'"`, onde uma apóstrofe basta. Com a sessão do Supabase no `localStorage`, isso é a CONTA da pessoa, não só a sala. Regra: campo novo no pacote da sala não precisa de nada (a varredura é por TIPO, não por lista de campos), mas **campo que entra em conta vai em `CAMPOS_NUMERICOS`** — senão `S.money += r.dinheiro` com texto grava string no save. E **allowlistar host de imagem não basta**: `new URL()` mantém a apóstrofe no CAMINHO, então `urlDeImagem` recusa `' " < > \` e espaço. Foi o furo do primeiro conserto desta própria auditoria.
- **Pulso da sala é `ping`, não estado completo.** O anfitrião manda `{turno, acoesFeitas, prazo}` a cada batida e a cada escolha; o estado inteiro sai em turno novo, ao sincronizar e a cada 15 s. **Evento NOVO de propósito**: mandar um `estado` mais magro faria o cliente de versão antiga gravar `batalha: undefined`. Campo novo que a tela precise durante o turno tem de entrar no `ping` (ou sair num estado cheio).
- **Na sala, "é turno novo?" é `mp-motor.leituraDoEstado(sala.turnoVisto, turno)`, NUNCA comparar com `sala.batalha`.** `resolver()` grava `sala.batalha = estado` ANTES de publicar, e publicar termina chamando `aoReceberEstado` — no ANFITRIÃO o `sala.batalha` já é o turno novo quando a comparação roda. Foi o bug de 29/09/2026: `escolhidos` nunca era limpo, `minhaVez()` não achava mais ninguém e quem hospedava atacava uma vez só. `turnoVisto` volta a `null` em `aoReceberFim` (turno 1 da luta seguinte conta como novo).
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

**Revisões grandes pedidas (ainda não feitas)**
- **Revisão do site pra entrar nas políticas do Google AdSense** — **levantamento feito, em `docs/adsense.md`**; ler ANTES de mexer em qualquer coisa dessa área. Decisão do usuário (29/09/2026): seguir com os disclaimers, usando o **Pokémon Showdown como caso de uso** (roda AdSense há anos com o mesmo tipo de conteúdo; o site deles não tem aviso de marca em lugar nenhum — o que importa é ser gratuito e não vender nada da franquia). **Já entregue**: páginas estáticas com URL própria (o jogo era uma URL só, sem nada legível por buscador), política de privacidade reescrita, rodapé com links legais, `robots.txt`/`sitemap.xml`/`ads.txt`, domínio próprio nos `canonical`, **guia em 6 capítulos** (o conteúdo próprio) e o **snippet com Consent Mode v2** (`js/consent.js`). **O que falta e em que ordem está em "Precisa de ação do usuário" abaixo** — a próxima etapa é **do usuário: pedir a revisão**.
- ~~**Revisão e refatoração completa do multiplayer**~~ **✅ FEITA (29/09/2026)** — `multiplayer.js` (1190 linhas) virou seis módulos, o menu/lobby/luta foram redesenhados (convite por link, espectador, cena de batalha, barra de prazo, histórico do turno) e a rede ficou leve (`ping` + render por região). Detalhe em `docs/features.md` ("A revisão do multiplayer"). **Continuam de fora, por escolha**: Roar & cia. em sala e a troca de verdade entre jogadores (itens acima).
- **Auditoria de segurança** — **1ª leva FEITA (29/09/2026)**, detalhe em `docs/features.md` ("A auditoria de segurança"). Achado grave e corrigido: **a sala do multiplayer confiava no pacote que chegava** (XSS → sessão do Supabase no `localStorage` → conta da pessoa) — agora tudo passa por `js/mp-sanear.js`. No banco, dois furos de ABUSO fechados (`20260929180000_seguranca_upload_e_visitante.sql`): bucket de imagem de relato aberto a qualquer um sem teto, e contador de visitante aceitando id inventado. **Revisado e considerado OK**: RLS de todas as tabelas, `validar_jornada`, gatilho anti-autopromoção de `perfis.admin`, `perfil_do_amigo` (só amigo aceito), chave anônima no `config.js` (é pública por natureza), presença global (`track({})` vazio). **Anexar imagem num relato exige CONTA** (decisão do usuário, 29/09/2026 — `20260929210000_imagem_de_relato_so_com_conta.sql`): sem conta não há a quem amarrar o envio, então nenhum teto vale. O RELATO segue sem conta (promessa da tela). A regra é cobrada em 3 camadas e todas leem `imagens-relato.podeAnexarImagem`/`MOTIVO_PRECISA_CONTA`; `subirImagensRelato` devolve **`null` ≠ `[]`** pra fila offline antiga subir o texto em vez de ficar presa pra sempre. **O que FALTA**: (b) a pontuação é calculada no navegador e só CONFERIDA no servidor (jornada plausível inventada passa — limite conhecido e aceito: sem servidor de jogo não tem como fechar); (c) forjar um `fim` de luta ainda é possível pra quem está NA sala (o `de` não é prova — broadcast não tem remetente assinado); (d) `/security-review` nunca foi rodado como segunda opinião.

**Precisa de ação do usuário**
- ⚠️ **`evento.BETA_SEM_ESPERA = true`** remove a espera de 8 h entre tentativas (beta testers). **Temporário** — reverter é trocar essa linha.
- **AdSense — em andamento, sequência combinada (29/09/2026).** Conta criada, domínio `pokerpg.com.br` cadastrado, publisher ID **`ca-pub-9827780756194019`**, estado "Precisa de revisão". Etapas 1–3 **feitas**:
  1. ~~Verificar a propriedade pelo `ads.txt`~~ ✔ (o usuário confirmou no painel).
  2. ~~Guia por tema~~ ✔: 6 capítulos (`CAPITULOS_GUIA` em `site.js`, texto em `ferramentas/conteudo-guia.mjs`), índice em `guia.html`, navegação no pé de cada um.
  3. ~~Snippet com Consent Mode v2~~ ✔: `js/consent.js` + o script do AdSense no `<head>` de `index.html` e das 11 páginas estáticas, `ADSENSE_CLIENT_ID` preenchido, `ads.js` reescrito. **`AD_SLOT_INICIO`/`AD_SLOT_GUIA` continuam vazios de propósito** — unidade de anúncio só existe depois da aprovação, e hoje o site carrega o código sem exibir anúncio (o estado certo pra revisão).
  4. **→ AGORA, do usuário: no painel do AdSense, "Pedir revisão".** No painel, deixar **Anúncios automáticos DESLIGADOS** (senão o Google insere anúncio onde quiser, inclusive junto dos botões de batalha = clique acidental = tráfego inválido = banimento).
  5. Depois de aprovado: criar as unidades de anúncio e preencher `AD_SLOT_GUIA` (páginas de conteúdo) e `AD_SLOT_INICIO` (fim da tela inicial) — o código já desenha sozinho; **CMP certificada** ("Privacidade e mensagens" do próprio AdSense, grátis) e **remover o banner caseiro**; fontes locais (GDPR).

**Ideias soltas (nunca pedidas)**: mais missões por tipo/zona · recompensa de Alfa diferente por rota · rank/título de explorador · resumo de badges já calculado no perfil de amigo.

**Decisões fechadas que continuam valendo**: XP por Gen fica canônico (Paldea dá mais que Kanto — é dado da franquia). Formas de Hisui no Santuário de Galar (é como a PokéAPI classifica). Teto de aliados **continua em 2** (o Esconderijo já resolve "guardar mais parceiros"; subir mudaria o balanceamento). Painel de manutenção **continua** (jogo em ajuste ativo). Só iniciais na criação em todos os modos (`especiesLivres` false).
