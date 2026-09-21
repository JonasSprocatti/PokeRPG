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
| `index.html` | Esqueleto: header, `#app`, aviso de `file://`, carrega `js/main.js`. |
| `css/estilo.css` | Todo o CSS. |
| `js/main.js` | Ponto de entrada: listeners delegados (`data-act`/`data-v`) e `boot()` (carrega save ou abre criação). |
| `js/estado.js` | `G` = estado mutável compartilhado (`S` save, `B` batalha, `PV` prévia, `mode`, `busy`, `panel`), `zone()`, `nm()`, `save()`. |
| `js/util.js` | `rand`/`pick`/`clamp`/`sleep`/`fmt`/`esc`/`lastSeg`/`store`. Sem DOM. |
| `js/dados.js` | Tabelas fixas: tipos (`CHART`, `TYPE_PT`, `TC`), `NATURES`, habilidades implementadas (`PINCH`, `ABSORB`, `IMPL`), `ITEMS`, `ZONES`, `FLAVOR`… Sem DOM. |
| `js/regras.js` | **Fórmulas puras** (testadas): `calcStats`, `calcDamage`, `effStat`, `typeEff`, `chanceAcerto`, `consegueFugir`, `jogadorAgePrimeiro`, `danoResidual`, `imuneAoStatus`, `xpPorVitoria`, `ganhoDeEVs`… |
| `js/api.js` | PokéAPI com cache (memória + `localStorage` `pk:*`). `buildLearnset`/`slimPokemon`/`slimMove` são puras (testadas). |
| `js/ui.js` | `$`, `REDUCED`, log (`log`/`say`/`logRaw`), modal `ask`, `shake`. |
| `js/render.js` | `render()` (re-render total da ficha, cena e ações), `buildGame()`, `badge`. |
| `js/pokemon.js` | `makeMon(data, level, opt)` — instância jogável (jogador e selvagem). |
| `js/efeitos.js` | `changeStats`, `inflict`, `healFull` — efeitos com narração, usados pela batalha e pelos itens. |
| `js/batalha.js` | `turn(action)` (único ponto de entrada da UI), `useMove`, `startBattle`/`startTrainerBattle`, bola do treinador, vitória/derrota/captura, `endBattle`. |
| `js/progressao.js` | `gainExp`, aprender golpe, evolução por nível. |
| `js/itens.js` | `addItem`, `useItem`. |
| `js/mundo.js` | `explore()`. |
| `js/criacao.js` | Tela de criação (busca, prévia com dificuldade, `startGame`, `fullRandomizer`) e `telaFim` (fim de jogo do Hardcore). |

Grafo de imports sem ciclos: `util`/`dados` → `regras`/`api` → `estado` → `ui` → `render` → `efeitos`/`progressao`/`pokemon` → `itens`/`criacao` → `batalha` → `mundo` → `main` (`batalha` importa `telaFim` de `criacao`, então `criacao` nunca pode importar `batalha`). Manter sem ciclos.

## Mecânicas (Etapa 3)

- **Dificuldade** (`S.dificuldade`, tabela `DIFICULDADES` em `dados.js`, lida via `dificuldadeDe(S)` — save antigo sem o campo conta como `easy`): `easy` (nunca é capturado; escolhe tudo), `hard` (capturado → foge depois sem a mochila, metade do dinheiro, zona aleatória; nível inicial travado em 5), `hardcore` (capturado → fim de jogo, save apagado, `telaFim`; nível 5 + natureza/habilidade sorteadas), `randomizer` (botão próprio na tela inicial, `soBotao`: sorteia até a espécie; captura = regra do `hard`). O que dá pra escolher na criação vem de `nivelLivre`/`escolhaLivre` da própria tabela.
- **Treinadores caçadores** (`startTrainerBattle` em `batalha.js`, 10% das explorações): equipe de 1–3 Pokémon da zona, 2–4 bolas (`bolaPorNivel`). Com seu HP ≤ metade, 60% de chance por turno de gastar a vez lançando bola (sai antes de qualquer golpe). Captura = fórmula real da Gen 3/4 (`valorCaptura`/`balancosDaCaptura`) com a `captureRate` da SUA espécie (`loadSpecies`, cache `sp2:`). XP ×1,5; dinheiro só no prêmio final (`premioTreinador`). Dá pra fugir (você é selvagem). Desmaiar contra treinador = derrota comum (Centro), não captura.
- **Shiny**: 1/4096 (`ehShiny`) em todo `makeMon` — você, selvagem, treinador, qualquer modo. Sprite montado pelo id (`SPR_SHINY`/`SPR_SHINY_COSTAS`, não fica no cache da API), com `onerror` caindo no normal. Sobrevive à evolução.
- **Centro Pokémon** custa `custoCentro(nível)` = ₽50 + ₽15/nível; desativado com tudo cheio (`precisaCurar`). Desmaiar continua curando de graça (com a perda de metade do dinheiro).

### Próximos passos combinados
- **3.2 Amizade (aliados)**: oferecer a um Pokémon um item que o tipo dele gosta → chance de aumentar a amizade → ele passa a acompanhar a jornada. Exige: equipe no save, troca na batalha, itens de afinidade por tipo.
- **3.3 Roguelike**: começa só com os iniciais de cada região; derrotar/fazer amizade com N do mesmo grupo desbloqueia novas escolhas pra próxima run. Exige progresso persistente entre runs (save separado do da jornada) e a 3.2 pronta.

## Convenções

- Regra nova (conta, fórmula, probabilidade) vai em `regras.js` como função pura, com teste; o módulo de narração só chama e escreve a mensagem.
- Tudo que só `regras.js`/`dados.js`/`util.js`/`api.js` importa precisa continuar sem DOM (importável no Node).
- `esc()` em todo texto vindo de fora (apelido, dados da API) dentro de template string.
- Estado compartilhado sempre via `G.*` (nunca `let` exportado).
- Fontes: `--display` (Fredoka) para títulos e números, `--body` (Atkinson Hyperlegible) para texto, `--logo` (Pixelify Sans) **só no logo** — a pixelada confundia 2/5/8 em HP, stats e PP; não voltar a usá-la em número.

## Testes

`tests/*.test.js` com `node:test` — rodar com `node --test` **sem caminho**. CI em `.github/workflows/testes.yml` roda a cada push/PR (aba Actions do GitHub).
