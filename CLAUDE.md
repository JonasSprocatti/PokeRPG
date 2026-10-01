# PokéRPG

RPG de texto no navegador em que **você é o Pokémon** (sem treinador, sem captura). **Não é protótipo** (pedido do usuário): nada de "protótipo" em texto de UI; efeito que ainda não existe (golpe/habilidade sem efeito) diz "será ajustado em atualizações futuras". Dados ao vivo da PokéAPI; fórmulas dos jogos (stats, IV/EV, natureza, dano, tipos, estágios, status, XP, evolução). JavaScript puro em ES modules, sem build, sem dependências. Save no `localStorage` (`pokerpg-save-v1`). PT-BR na UI, comentários e nomes novos (identificadores herdados do protótipo seguem em inglês).

> **Este arquivo é só o essencial** (ele é carregado em TODA sessão). O detalhe mora em:
> - **`docs/features.md`** — como cada coisa foi construída: o que foi considerado, o que foi simplificado de propósito, o que ficou de fora. **Leia ao mexer numa área.**
> - **`docs/historico.md`** — post-mortems dos bugs já corrigidos (o relato do jogador, o que foi descartado no diagnóstico).
> - **`docs/backlog.md`** — o que foi pedido e não construído, o que espera ação do usuário, decisões fechadas. **Ler antes de dizer que algo falta.**
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

Onde cada coisa mora, e a regra que vale ao mexer nela. **Nomes de função não estão aqui de propósito** — `grep`
acha em um segundo. O *porquê* de cada arquivo (o que foi considerado, o que ficou de fora) está em
`docs/features.md` → "Tabela de arquivos, completa" e nas seções por área; **leia de lá ao mexer numa área.**

| Arquivo | Papel |
|---|---|
| `index.html` · `css/estilo.css` · `img/` | Esqueleto (`#topr`, `#app`, aviso de `file://`) · todo o CSS · logo e ícones. |
| `sw.js` | Modo offline. **Todo arquivo novo em `js/` entra no `PRECACHE`** (`tests/sw.test.js` cobra). |
| `README.md` | Página do projeto. **Atualizar a cada funcionalidade nova.** |
| `js/main.js` | Entrada: listeners delegados (`data-act`/`data-v`) e `boot()`. |
| `js/estado.js` | `G` = estado mutável (`S` save, `B` batalha, `PV` prévia, `mode`, `busy`, `panel`) + `save()`. |
| `js/util.js` · `js/dados.js` | Utilidades (`esc`, `store`, `offline`…) · tabelas fixas (tipos, `ITEMS`, `ZONES`, `MISSOES`, `DIFICULDADES`…). |
| `js/regras.js` | **Fórmulas puras, todas testadas.** Regra nova de conta/probabilidade nasce aqui. |
| `js/api.js` | PokéAPI com cache: memória + **IndexedDB** (`pokerpg-cache`), `localStorage` de reserva. `iniciarCache()` antes do boot. |
| `js/ui.js` · `js/render.js` | Log, modal `ask`, `toast`, `semAnimacao()` · `render()` (re-render total) e os sprites. |
| `js/layout.js` · `js/paineis.js` | Modelo puro do layout dos painéis (testado) · o DOM de arrastar e redimensionar. |
| `js/pokemon.js` · `js/efeitos.js` | `makeMon()` = instância jogável · efeitos + `CTX` (narração do single player). |
| `js/golpe.js` | **Motor único do golpe** (ver Arquitetura). |
| `js/habilidades.js` | Tabela de ganchos + `IMPL`. **Só o que está na tabela tem efeito** (hoje 215 de 314 reais). Gancho novo = código no motor + teste. |
| `js/especiais.js` | Golpes cujo efeito não cabe no `meta` da PokéAPI. Sem imports. |
| `js/segurados.js` | Itens segurados (puro). `seg(m)` é o ÚNICO ponto por onde toda leitura de item passa. |
| `js/batalha.js` | `turn(action)` é a única entrada da UI. Começo de batalha, vitória, derrota, captura, `endBattle`. |
| `js/progressao.js` · `js/evolucao.js` | XP, aprender golpe, evolução por nível · evoluções especiais (puro), `EVO_ALTERNATIVAS` = os 19 casos sem suporte. |
| `js/itens.js` · `js/amizade.js` · `js/missoes.js` | Mochila, equipar, ensinar, repelente · petisco, recrutar, despedir · `verificarMissoes()`. |
| `js/mundo.js` · `js/criacao.js` · `js/fim.js` | Explorar, chefe, evento · tela de criação e `iniciarJornada` · `encerrarJornada` e o resumo. |
| `js/carreira.js` | Carreira = jornadas terminadas. Também monta as gimmicks da loja e o Hall da conta. |
| `js/progresso-conta.js` | Progresso permanente (puro). Regra única: **nunca encolhe**; `bancar()` idempotente por id de jornada. |
| `js/conquistas.js` · `js/tela-conquistas.js` | Conquistas da conta. As gimmicks somam a CARREIRA, não a run. |
| `js/badges.js` | 56 badges numa tabela única (puro) → vantagem na PRÓXIMA jornada. Medidas do progresso permanente, nunca do histórico. "Potencial máximo" (1 milhão de dano seu) é a única que muda uma REGRA: IVs 31 na criação. |
| `js/mega.js` · `tera.js` · `zmove.js` · `dynamax.js` | As 4 gimmicks. **`endBattle` desfaz todas** — senão o estado vai junto no save. |
| `js/mapas.js` · `js/dados-mapas.js` | Mapas por Gen · **GERADO** por `ferramentas/gerar-mapas.ps1`, não editar à mão. **`GENS` sai de `dados.js`**, não daqui: é lá que os ajustes de `dados-rotas.js` entram. |
| `js/dados-rotas.js` | **GERADO pelo editor de rotas do jogo** — as 180 missões por rota e os Alfas trocados. Dado puro, sem imports. |
| `js/editor-rotas.js` · `js/tela-editor-rotas.js` | 🗺 Editor de rotas (**só admin**): curva de stats e veredito do Alfa (puro, testado) · a tela. Edita em rascunho e **cospe o `dados-rotas.js`** pra colar no repo. |
| `js/roguelike.js` | Desbloqueios entre runs (puro). Só conta jornada `roguelike`. |
| `js/evento.js` · `boss.js` · `hall.js` · `arena.js` | Chefe da semana (calendário) · regras do chefe · Hall da Fama (puro) · Arena. |
| `js/itens-raide.js` | `SERVE`/`textoServe`/`TIPO_DO_GOLPE` — a lista "Serve contra:" das descrições sai daqui. |
| `js/loja-conta.js` | Loja de preparo + reidratar do Hall, **compartilhado** por Arena e Sala de Raide. Tem rede, sem DOM. |
| `js/mp-motor.js` | Motor puro da batalha multiplayer (lados A/B com N Pokémon). Testado. |
| `js/mp-sanear.js` | **O que chega da sala não é confiável** (puro, sem NENHUM import). É o CHÃO do grafo — `render.js` também importa daqui. |
| `js/mp-regras.js` | Regras puras da sala, testadas (quem joga, de quem é a vez, montar lado). Sem DOM, sem rede. |
| `js/mp-rede.js` | Canal, fila e retentativa, pulso, presença. Sem DOM: avisa a tela por `ligarRender(fn)`. |
| `js/mp-cartao.js` | Como um Pokémon aparece no lobby e na luta. **A Arena importa daqui**, não de `multiplayer.js`. |
| `js/mp-telas.js` | Todo o HTML da sala. **Nunca importa as ações** — quem despacha `data-act` é o `main.js`. |
| `js/mp-resultado.js` | Aplica o fim da luta no save/conta. `minhaMochila` é o único ponto que decide run × conta. |
| `js/multiplayer.js` | Orquestra a sala (**anfitrião autoritativo**) e as ações do `data-act`. A sala vive em **`G.sala`**. |
| `js/nuvem.js` · `js/presenca.js` | Supabase sob demanda (login, sincronizar) · "Jogando agora" (`track({})` vazio — nunca identifica quem). |
| `js/offline.js` | Baixar um mapa (ou o jogo inteiro) pra jogar offline. |
| `js/navegacao.js` | **`TELAS` é a ÚNICA lista de telas** — tela nova entra lá e aparece na barra e no menu ☰. |
| `js/ajustes.js` · `js/tela-ajustes.js` | Fonte, estilo de sprite, animações de combate, presença, download offline. |
| `js/som.js` | Cries, música procedural e som de impacto por tipo de golpe (`IMPACTOS`). **Nada sai acima de 2 kHz** — é onde o passa-baixa da saída corta. |
| `js/tutorial.js` · `js/tela-tutorial.js` | ❓ Tutorial (puro + tela). Desenha em `G.tut`, **nunca** `G.S`. |
| `js/relatos.js` · `js/imagens-relato.js` | Bugs e sugestões (funciona offline, com fila), até 2 imagens de 2 MB. |
| `js/conta.js` · `perfil-amigo.js` · `ranking.js` · `saves.js` · `tela-*.js` | Telas. |
| `js/dados-patchnotes.js` · `js/tela-patchnotes.js` | 📜 Novidades. **Toda leva de mudanças vira uma versão nova**, mais nova primeiro, texto PRA JOGADOR e com uma piada. |
| `js/config.js` | Chaves e slots (vazio = aquela parte desligada). Publisher ID vive em **3 lugares** (aqui, `<head>`, `ads.txt`); `tests/paginas.test.js` compara os três. |
| `js/consent.js` | **Consent Mode v2**, script CLÁSSICO e síncrono no `<head>`: põe tudo em `denied` **antes** do script do Google. Ordem invertida = anúncio personalizado sem consentimento. |
| `js/ads.js` · `js/tela-privacidade.js` | Banner, sinal pro Google e os slots. O script do Google vem no `<head>` **sempre**; `blocoAds` só desenha com `AD_SLOT_*` preenchido. |
| `js/site.js` · `js/texto-privacidade.js` | Site fora do jogo: `URL_SITE`, `PAGINAS`, `CAPITULOS_GUIA`, rodapé · texto da política. Sem DOM. |
| páginas estáticas · `sitemap.xml` | **GERADOS** por `ferramentas/gerar-paginas.mjs` — não editar à mão. Capítulo novo do guia = `CAPITULOS_GUIA` + corpo + linha no `PRECACHE`. |
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
- **Saneamento resolve INJEÇÃO, nunca AUTORIA.** `mp-sanear` garante que o pacote é bem-formado, não que é verdadeiro (o broadcast não assina remetente, e `doAnfitriao` aceita pacote sem `de` de propósito). Então **o pacote da sala CONFIRMA e o livro-caixa local AUTORIZA**: o que sai da mochila / do inventário de conta é o cruzamento de `sala.pedi` (escrito só pelas MINHAS ações) com o que o anfitrião contou — `mp-regras.itensADescontar`/`usosADescontar`, puros e testados. Sem isso um `estado` forjado esvaziava a mochila de quem recebia. **Ação nova que gaste item = uma linha de `pedi*` no envio.**
- **Filtro de caractere é correto só em relação ao CONTEXTO.** `urlDeImagem` recusava a apóstrofe literal e `&#39;` passava: o endereço cai dentro de `onerror="…src='AQUI'"`, e o navegador decodifica entidade **antes** de compilar o handler — duas camadas empilhadas, cada uma com sua decodificação. `& ; %` estão na lista por isso. Melhor que ampliar a lista é não montar JS dentro de atributo.
- **Endereço montado por id passa por coerção no CONSTRUTOR** (`numeroDeSprite`, `dados.js`), não em cada tela: são 12 construtores × ~40 pontos de desenho, e `perfil-amigo.js` interpolava `poke_id` (TEXTO, vindo de `resumo.registro.ids`) cru num `src`. A faixa é "inteiro", **não** `1–1025` como no `htmlIcone` — id de FORMA passa de 10000.
- **Regra que só existe na tela não é regra: o motor confere também.** `desistir` tinha trava de modo só em `mp-telas` e o motor aceitava em co-op; com o `de` do pacote sendo autodeclarado, isso encerrava a run de OUTRO jogador. Mesmo princípio de `golpesPermitidos`, agora valendo pro modo da sala.
- **Teste sobre migrations acumuladas olha a ÚLTIMA definição.** `tests/schema.test.js` fatiava `validar_jornada` com `indexOf` e passaria conferindo a versão velha depois de qualquer `create or replace` novo. É `lastIndexOf`, com âncora no `create or replace` inteiro (o trecho curto reaparece no `execute function` do `create trigger`, depois do `drop trigger`) e `throw` se a âncora sumir — `slice` invertido vira string vazia e passa calado.
- **`greatest`/`Math.max` é PISO, não teto.** `greatest(0.5, power(0.8, continuacoes))` com `continuacoes` negativo dava ×70.065 na pontuação, no campo que existe pra TIRAR pontos. Clampe o EXPOENTE, não só o resultado, e ponha o teto explícito (`least(1, …)`).
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

Só a regra operante — a que muda uma decisão de código. O desenho completo de cada mecânica (o que foi
considerado, o que foi simplificado) está em `docs/features.md`.

### Dificuldade
`S.dificuldade`, tabela `DIFICULDADES` (dados.js), lida por `dificuldadeDe(S)` (save antigo = `easy`). **O código lê as FLAGS de cada modo, nunca compara o nome**: `semCaptura`, `fimDeJogo`, `centroGratis`, `descontoPorVitoria`, `nivelLivre`, `escolhaLivre`, `fimNaGen`, `permadeath`, `desbloqueios`, `eventoSemanal`, `climaRotasFixo`, `especiesLivres`. Os modos são `roguelike` (padrão, primeiro da lista), `easy`, `medium`, `hard`, `hardcore` e `randomizer`.

### Mundo e progressão
9 Gens × 10 rotas + **Santuário** (11ª, `posVitoria`: pool com TODA a Gen, exige `S.gensVencidas`, ignora nível — é o que garante a completude da Pokédex). `pool = [{id, n, p, m?}]`, sorteio ponderado. Rotas 1–9 têm `chefe` (Alfa, IVs 31 + `statsDeChefe`); a 10ª tem `final: true` + `lendarios`. **Zonas por nível** (`libera`/`zonaLiberada`). **Anti-grind (só Roguelike)**: `regras.rotaEsgotada` — a Pokédex da rota continua. **Vencer os lendários** → `vencerGen()`; modo com `fimNaGen` encerra a run, senão oferece o mapa seguinte (seguir com o mesmo Pokémon vale MENOS pontos). **Missões**: `MISSOES` = 17 globais (`dados.js`) + **180 por rota** (`dados-rotas.js`: uma de espécie e uma de Alfa em cada rota das 9 Gens), avaliadas por `situacaoMissoes` (puro, testado). Missão de espécie usa `alvos: [[especie, qtd]…]` — várias espécies SOMAM e **cada uma tem o próprio teto**. Quem edita é o 🗺 Editor de rotas, não a mão. **Repelentes** e **🎯 Caça Shiny** (`S.caca`): `especieForcada` põe o repelente na frente da caça; `cacaveisDaRota` exclui mítico E lendário.

### Batalha
- **Aliados** (`S.aliados`, máx. `MAX_ALIADOS` = 2): recrutados com petisco, agem no turno (`ordenarAcoes`: prioridade → `rapido` → `lento` → velocidade), têm `ORDENS`.
- **IA do inimigo**: `regras.escolhaIA(..., contexto)` → `notaDoGolpe(...)` ≈ "% do HP do alvo que o golpe vale"; `nivelDaIA(esperteza)` dá o degrau `simples`/`basico`/`completo`. **Golpe ou efeito novo que a IA deva entender = uma linha em `notaDoGolpe`**; sem regra vale `IGNORADO`. Sempre sobre `golpesPermitidos`.
- **Clima** (`regras.CLIMAS`, 5 turnos) e **terreno** (`TERRENOS`) vivem no `campo`, compartilhado pelos dois lados. Terreno **só afeta quem está no chão** (`noChao`). Rota pode ter padrão (`CLIMA_DA_ROTA`).
- **Lado do campo** (`campo.lados`): telas, salvaguarda, neblina, vento, armadilhas. `multTelas` recebe o lado de QUEM DEFENDE.
- **Gimmicks**: conquistadas na CARREIRA, uma por batalha, não gastam o turno (o Z **é** o turno). O inimigo também usa.
- **Batalha sobrevive ao F5**: `S.batalha = ganchosSave.serializarBatalha(G.B)`; `restaurarBatalha` reaponta `B.enemy` pra `trainer.equipe[atual]`.
- **Segredo do brilho**: jogador shiny ganha XP e dinheiro em dobro e Centro grátis. **É segredo — não entra no README nem nos patch notes.**

### Multiplayer
Sala por código (4 caracteres), até `MAX_JOGADORES` = 6, funciona sem login. Anfitrião é a autoridade: monta os lados, junta as escolhas, prazo de 45 s, roda `mp-motor` e publica.
- **`modo`**: `'coop'` (a run do anfitrião) · `'pvp'` (Time A × B) · `'raide'` (chefe da semana com o Hall, sem run).
- **`entradaTipo`**, independente do modo: `'run'` · `'convidado'` (Nv. 5) · `'hall'` (até `MAX_TIME_HALL` = 3, nível real). `entradaEfetiva()` é o ÚNICO ponto que decide; `semMochila()`/`usaRun()` derivam dali.
- **Ganhos só no nível real** (`naNivelReal`). Resultado volta por **fração de HP**; PvP não sincroniza nada.

### Conta, nuvem e offline
- **Fim de jornada** → `montarResumo` → carreira (`pokerpg-carreira-v1`) → apaga o save (aqui e na nuvem). Modo com `eventoSemanal` também entra no **Hall da Fama**.
- **Progresso permanente** (`progresso-conta.js`): **nunca encolhe**; `porJornada` pela chave do id. Local primeiro, nuvem depois.
- **Gravou progresso → `sincronizarComRetentativa`** (3 tentativas + pendente até confirmar): `sincronizar()` engole a própria falha, e uma rede ruim na tela de Game Over já perdeu um Hall da Fama.
- **Offline**: `sortearOponente` só sorteia o que está em cache. `sw.js`: jogo em rede-primeiro, PokéAPI/sprites em cache-primeiro, Supabase nunca.

## Testes

`tests/*.test.js` com `node:test` — rodar com `node --test` **sem caminho**. CI em `.github/workflows/testes.yml`.

- **`tests/docs-numeros.test.js` trava os números deste arquivo e do README contra o código.** Motivo: um levantamento achou 6 afirmações erradas de uma vez ("~30 badges" quando são 53; "96 formas, 93 espécies" de Mega quando são 95/89, contradizendo o "89 Megas" escrito adiante; e coisas dadas como pendentes que já estavam prontas). São frases-âncora + uma varredura genérica de `` `CONSTANTE` = N ``. **Mudou o número no código → atualize a frase aqui.**
- `tests/referencias.test.js` — função/ajudante chamado em template literal que não existe.
- `tests/schema.test.js` — pesos de pontuação do SQL x `regras.js`. **Mudou num lado, muda no outro.**
- `tests/sw.test.js` — arquivo novo em `js/` entrou no PRECACHE.
- `tests/habilidades.test.js` — falha se aparecer gancho desconhecido na tabela.
- **Efeito de chance se testa FIXANDO o sorteio, nunca por amostragem.** "60 golpes, espero ao menos um recuo de 10%" falha 0,2% das rodadas — e no CI isso vira defeito fantasma num código certo. Troque `Math.random` pelos dois lados do limiar (`0.05` recua, `0.50` não) e restaure no `finally`.

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
- `prefers-reduced-motion` já é global no CSS — animação nova não precisa de tratamento próprio. Animação de combate em JS pergunta a **`ui.semAnimacao()`** (mídia do sistema + ⚙ Ajustes), nunca só a mídia.
- **O minimalismo do ponytail não vale para as convenções acima.** O plugin `ponytail` (modo `full` por padrão) manda cortar o que não foi pedido — e o `README.md`, a versão nova em `dados-patchnotes.js`, o teste da função pura em `regras.js`, a linha no `PRECACHE` do `sw.js` e o registro em `docs/features.md` parecem exatamente isso. **Não são.** São entrega, não gordura: o pedido explícito do usuário vale sobre a heurística do plugin. O ponytail decide COMO o código fica (mais curto, sem abstração especulativa, stdlib antes de dependência) — nunca se esses passos acontecem.

## Backlog

**Mora em `docs/backlog.md`**: o que foi pedido e não construído, as revisões grandes (AdSense, auditoria de segurança), o que **precisa de ação do usuário**, ideias soltas e decisões fechadas. **Ler antes de dizer que algo falta** — já houve seis afirmações erradas de uma vez por texto velho. Item concluído sai de lá e vira registro em `docs/features.md`.

