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
| `js/amizade.js` | `oferecer` (petisco em batalha), recrutar aliado, `despedir`. |
| `js/mundo.js` | `explore()`. |
| `js/criacao.js` | Tela de criação (busca, prévia com dificuldade, `startGame`, `fullRandomizer`) e `telaFim` (fim de jogo do Hardcore). |

Grafo de imports sem ciclos: `util`/`dados` → `regras`/`api` → `estado` → `ui` → `render` → `efeitos`/`progressao`/`pokemon` → `itens`/`amizade`/`criacao` → `batalha` → `mundo` → `main` (`batalha` importa `telaFim` de `criacao`, então `criacao` nunca pode importar `batalha`). Manter sem ciclos.

## Mecânicas (Etapa 3)

- **Dificuldade** (`S.dificuldade`, tabela `DIFICULDADES` em `dados.js`, lida via `dificuldadeDe(S)` — save antigo sem o campo conta como `easy`). Escolhida no **passo 1 da tela inicial** (`G.dif`, `renderDificuldade`). **O código lê as flags de cada modo, nunca compara o nome**: `semCaptura`, `fimDeJogo`, `centroGratis`, `descontoPorVitoria`, `nivelLivre`, `escolhaLivre`.
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
- **Registro** (`registrar(S, lista, especie)` → `S.registro.derrotados/amigos/evolucoes`): contado desde já pras missões e o Roguelike.

### Próximos passos combinados (em ordem sugerida)
- **Etapa 2 — mundo e progressão**: zonas liberadas por nível; objetivos e níveis de progressão; missões que se liberam ao derrotar um Pokémon ou fazer amizade com outro; **chefes** com status aumentados como desafio.
- **Game Over / recordes**: tela de fim com Pokémon derrotados, nível, tempo de jogo e outros números, comparando com o **recorde pessoal daquela espécie** (precisa de um save de recordes separado do save da jornada — o mesmo que o Roguelike usa).
- **3.3 Roguelike**: começa só com `INICIAIS` (iniciais das 9 regiões + Pikachu + Eevee, em `dados.js`). Desbloqueia uma **espécie** pra próxima run ao derrotar ou fazer amizade com 5–10 dela; evoluir 5× pra forma do meio desbloqueia a do meio, 10× pra forma final desbloqueia a final. Exige progresso persistente entre runs.
- **Etapa 4 — Supabase/multiplayer**: ranking de todos os jogadores (melhor pontuação geral por espécie) e batalha com Pokémon de vários jogadores do mesmo lado (a batalha já é N-do-meu-lado).
- Pendências menores: aliado evoluir; usar Potion/itens no aliado (hoje só em você).

## Convenções

- Regra nova (conta, fórmula, probabilidade) vai em `regras.js` como função pura, com teste; o módulo de narração só chama e escreve a mensagem.
- Tudo que só `regras.js`/`dados.js`/`util.js`/`api.js` importa precisa continuar sem DOM (importável no Node).
- `esc()` em todo texto vindo de fora (apelido, dados da API) dentro de template string.
- Estado compartilhado sempre via `G.*` (nunca `let` exportado).
- Fontes: `--display` (Fredoka) para títulos e números, `--body` (Atkinson Hyperlegible) para texto, `--logo` (Pixelify Sans) **só no logo** — a pixelada confundia 2/5/8 em HP, stats e PP; não voltar a usá-la em número.

## Testes

`tests/*.test.js` com `node:test` — rodar com `node --test` **sem caminho**. CI em `.github/workflows/testes.yml` roda a cada push/PR (aba Actions do GitHub).
