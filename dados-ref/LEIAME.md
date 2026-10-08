# dados-ref — Pokédex em TSV, pra CONSULTA

**GERADO** por `node ferramentas/gerar-dex.mjs` (CSVs-fonte da PokéAPI). Não editar à mão.

**Não entra no jogo.** O jogo continua lendo da PokéAPI ao vivo (`js/api.js`, cache em IndexedDB). Isto existe
pra responder "qual o alvo/ailment/flags do golpe X", "stats base da forma Y", "o que o item Z faz" **sem rede e
sem gastar token**: uma linha por registro, `grep` acha, lê-se só o que interessa. Fora do `PRECACHE` do `sw.js`
de propósito.

**Nunca ler um arquivo inteiro** (`golpes.tsv` sozinho é ~45 mil tokens). Sempre `grep`. A coluna 1 é `id`; o
nome é a 2 — a âncora de busca é `\tnome\t`, em kebab-case (o mesmo que o jogo usa em toda parte).

| Arquivo | linhas | O que tem |
|---|---|---|
| `pokemon.tsv` | 1351 | Uma linha por **forma jogável** (`id > 10000` = alternativa). `forma` = `base`/`mega`/`gmax`/`regional`/`forma-batalha`/`forma`. Stats base, tipos, habilidades (`*` = oculta), peso em **hectogramas** (é o que Low Kick usa), `ev` = EVs que o derrotado dá. |
| `especies.tsv` | 1025 | O que é da espécie, não da forma: `generoTaxa` (**-1 = sem gênero**, 0 = só macho, 8 = só fêmea), captura, felicidade, curva de XP, grupos-ovo, ciclos, flags (lendário/mítico/bebê/troca-forma/dimorfismo), de quem evolui, e a lista de formas alternativas. |
| `golpes.tsv` | 937 | Poder/prec/PP/prioridade/**alvo**, ailment + chance, crit, drenar, cura, recuo, `stat%`, nº de golpes, turnos, mudanças de estágio e as **21 flags** (contact, sound, punch, powder, bite, pulse, ballistics…) — flag a REST da PokéAPI **não expõe**. `efeito` é o `short_effect` em inglês. |
| `habilidades.tsv` | 374 | Nome, gen, `oficial` (não-oficial = só de spin-off) e o efeito curto. |
| `itens.tsv` | 2223 | Bolso, categoria, custo, poder de Fling e o efeito curto. |
| `evolucoes.tsv` | 676 | `de → para`, gatilho e todas as condições que o dado-fonte traz. Caso sem suporte na fonte (Annihilape, Kubfu…) vem com `condicoes` vazio — o jogo trata esses em `js/evolucao.js` (`EVO_ALTERNATIVAS`). |
| `tabelas.tsv` | 214 | As listas pequenas num arquivo, `grep` pela coluna 1: `natureza` (+stat -stat), `curvaXP` (a fórmula), `grupoOvo`, `alvo`, `ailment`, `categoriaGolpe`, `flagGolpe`, `classeGolpe`, `gatilhoEvolucao`, `categoriaItem` e `tipo` (a tabela de eficácia, só o que difere de ×1). |

## O que ficou de fora, e quando trazer

- **Learnset** (`pokemon_moves.csv`, ~670 mil linhas / ~15 MB). Não cabe aqui e quase nunca é a pergunta —
  quando é, o jogo já resolve por `api.buildLearnset`. Trazer só se virar pergunta frequente, e aí **num arquivo
  por Gen**, nunca num só.
- **Encontros, localizações, concursos, Conquest, flavor text, machines (nº da MT)**: nada disso é regra do jogo.
- **Tabela de XP por nível** (`experience.csv`): a fórmula está em `regras.js`, testada. A fórmula de cada curva
  está em `tabelas.tsv`.
- **Dado que muda por versão** (`*_past`): o jogo joga sempre com a regra mais nova.
