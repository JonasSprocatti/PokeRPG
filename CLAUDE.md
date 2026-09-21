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
| `js/batalha.js` | `turn(action)` (único ponto de entrada da UI), `useMove`, `startBattle`, `endBattle`, vitória/derrota. |
| `js/progressao.js` | `gainExp`, aprender golpe, evolução por nível. |
| `js/itens.js` | `addItem`, `useItem`. |
| `js/mundo.js` | `explore()`. |
| `js/criacao.js` | Tela de criação (busca, prévia, `startGame`). |

Grafo de imports sem ciclos: `util`/`dados` → `regras`/`api` → `estado` → `ui` → `render` → `efeitos`/`progressao`/`pokemon` → `itens` → `batalha` → `mundo`/`criacao` → `main`. Manter assim.

## Convenções

- Regra nova (conta, fórmula, probabilidade) vai em `regras.js` como função pura, com teste; o módulo de narração só chama e escreve a mensagem.
- Tudo que só `regras.js`/`dados.js`/`util.js`/`api.js` importa precisa continuar sem DOM (importável no Node).
- `esc()` em todo texto vindo de fora (apelido, dados da API) dentro de template string.
- Estado compartilhado sempre via `G.*` (nunca `let` exportado).

## Testes

`tests/*.test.js` com `node:test` — rodar com `node --test` **sem caminho**. CI em `.github/workflows/testes.yml` roda a cada push/PR (aba Actions do GitHub).
