# 📦 Atualização de conteúdo pela nuvem — plano combinado

Pedido do usuário em **06/10/2026**, aprovado para construir:

> "Vamos tratar como uma *Atualização* de rotas. Um dos motivos para não fazermos isso é porque não funcionaria
> offline, mas podemos ter essa informação salva no cache, e sempre que o jogador entra em conexão com a internet,
> se tiver uma edição de rota, ela atualiza no cache; em offline ele joga com a config de rota que ele tem. Dessa
> forma eu tenho o controle das rotas, a mesma coisa das missões de rota, missões de conta e etc. Quero ter o
> controle completo de criação e edição do máximo de coisas do app."

**Escopo escolhido pelo usuário (todos os quatro):** rotas (pool, níveis, **criar e excluir**) · missões de rota e
globais · **rotas secretas** (condição de desbloqueio — mecânica nova) · itens, loja e badges.

**Aplicar no meio de uma jornada:** "na hora, só se não quebrar nada".

---

## O problema de hoje

O 🗺 Editor de rotas (admin) edita em rascunho e **cospe um `dados-rotas.js` pra colar no repositório**. Quer dizer:
conteúdo é **código**, e só muda com commit + deploy. O usuário não tem controle — tem um pedido de controle.

E o conteúdo não é um arquivo só:

| Onde mora hoje | O quê |
|---|---|
| `js/dados-mapas.js` (**gerado da PokéAPI**) | as 99 rotas: pool, níveis, Alfa sorteado |
| `js/dados-rotas.js` (**gerado pelo editor**) | `ALFAS` (Alfa trocado) e `MISSOES_ROTA` (as 180) |
| `js/dados.js` | **junta as duas camadas** → `GENS`; e `MISSOES = [...MISSOES_GLOBAIS, ...MISSOES_ROTA]` |
| `js/dados.js` | `ITEMS` (loja, preço, descrição) |
| `js/badges.js` | as 58 badges |

`dados.js` é o **único** que importa `dados-mapas.js`, e já é o ponto onde os ajustes entram. Isso é sorte
arquitetural: existe **um** lugar pra interceptar.

## A restrição que manda na arquitetura

**`dados.js` precisa continuar importável no Node sem DOM e sem storage** (`regras.js`, `mapas.js`, metade dos
testes dependem disso). Então ele **não pode ler `localStorage` no corpo do módulo** — em Node não existe
`localStorage`, e a suíte inteira quebraria.

Daí a divisão:

```
js/conteudo.js         PURO. Valida um pacote e o APLICA sobre as tabelas, mutando no lugar.
                       Sem DOM, sem rede, sem storage → testável no Node. É o chão.
js/conteudo-nuvem.js   Tem rede e storage: lê o cache, busca a versão nova, decide se aplica agora.
```

**Mutação no lugar** (`GENS.length = 0; GENS.push(...)`) e não reatribuição: todo consumidor guarda a MESMA
referência de array, então aplicar o pacote dentro de `boot()` — antes do primeiro `render()` — vale pra sessão
inteira, sem reload e sem transformar `GENS` em função (que mexeria em ~40 pontos de leitura).

## O fluxo

1. **`boot()`** lê o pacote do cache (`localStorage`, síncrono) e chama `aplicarConteudo`. Rápido, sem rede, antes
   de desenhar. Sem cache, valem as tabelas de fábrica — o jogo nunca depende da nuvem pra abrir.
2. **Em paralelo, sem travar o boot**, busca a versão publicada. É "busca não essencial": `await` nela no caminho
   crítico é a armadilha que o `CLAUDE.md` já nomeia. Veio versão maior → guarda no cache.
3. **Aplicar agora ou na próxima jornada**: a regra do usuário é "só se não quebrar nada". Quebra se uma missão em
   andamento ou um registro de Pokédex da run depender do que mudou (espécie que saiu do pool, rota excluída).
   Não quebra → aplica e avisa no log. Quebra → fica guardado e entra na jornada seguinte.
4. **Publicar** sai do editor: no lugar de "📋 Copiar o arquivo", um **📤 Publicar** que grava a linha no Supabase.
   O "copiar o arquivo" **continua existindo** — é o caminho de levar a edição pra fábrica (o repositório), pra
   quem instala o jogo do zero não começar com as tabelas velhas.

## O banco

Tabela nova, migration nova (`supabase/migrations/<AAAAMMDDHHMMSS>_conteudo.sql`):

```
conteudo_publicado
  canal       text primary key   -- 'estavel' hoje; deixa espaço pra 'teste' sem mudar o esquema
  versao      bigint not null    -- só CRESCE. É o que o cliente compara
  pacote      jsonb not null
  publicado_em timestamptz default now()
```

RLS: **leitura pública** (é conteúdo de jogo, e o jogador precisa dele sem login) · **escrita só admin**
(`perfis.admin`, o mesmo gatilho anti-autopromoção que já existe).

## O que o pacote NÃO pode fazer

Conteúdo vem pela rede, então vale a lição do `mp-sanear`: **o que chega não é confiável**. Aqui é mais brando (só
admin escreve, e a leitura é autenticada pelo TLS do Supabase), mas a validação é barata e o custo de errar é o
save do jogador:

- Pacote que não valida é **descartado inteiro** — nunca pela metade. Meia config é pior que nenhuma.
- Nada de HTML/função: só número, texto e lista. Todo texto que vai pra tela continua passando por `esc()`.
- Id de espécie é **inteiro** (a lição do `numeroDeSprite`), nome de rota é `[a-z0-9-]`.
- Pacote não pode **esvaziar** uma Gen nem tirar o Santuário: `tirarIniciais`/`especiesDaGen` contam com eles, e a
  completude da Pokédex é promessa do jogo.
- **Versão só cresce**, igual ao progresso permanente: pacote com versão menor ou igual à do cache é ignorado.

## O que mexe no offline

- O pacote entra no `PRECACHE`? **Não** — ele é dado de usuário, vai no `localStorage`, não é arquivo.
- **`baixarGen` precisa baixar o que o pacote PEDE**, não o que a tabela de fábrica diz. Rota nova com espécie
  nova = buscas novas. Essa é a armadilha que já custou duas vezes ("isso está no `baixarGen`?"), e aqui ela volta
  com força: a lista deixa de ser fixa. **Pacote novo aplicado → `VERSAO_DOWNLOAD` do APARELHO fica velha.**
- Sem internet, nada muda: joga com o pacote que está no cache.

## Fases

| # | O quê | Por que nesta ordem |
|---|---|---|
| ~~**1**~~ ✅ **FEITA (06/10/2026)** | `conteudo.js` (puro, validar + aplicar) · `conteudo-nuvem.js` (cache, busca, publicar) · `boot()` · migration `20261006120000_conteudo_publicado.sql` com os canais `teste`/`estavel` · 📤 Publicar e ✅ Liberar pra todos no editor · `editor-rotas.gerarPacote` | Fundação pronta pra ALFAS e MISSOES_ROTA. **Ainda não verificada em jogo**: a migration sobe pela integração do GitHub e os dois botões precisam de uma conta admin logada. |
| ~~**2**~~ ✅ **FEITA (07/10/2026)** | `mapas` no pacote (a lista INTEIRA de rotas por Gen: pool com peso, níveis, nome, descrição, `tema`, criar e excluir) · `dados-rotas.MAPAS` como camada de fábrica · pool/níveis/bioma e ➕/🗑 no editor · impressão do conteúdo na marca de download (`offline.marcaDaGen`) | Depende da fundação. Mexe em Santuário, Pokédex da conta, caça shiny e desbloqueio do Roguelike — todos leem a lista de rotas. **`baixarGen` não precisou mudar**: `alvosDaGen` já deriva de `GENS`. Detalhe em `docs/features.md` → "Fases 2 e 3". |
| ~~**3**~~ ✅ **FEITA (07/10/2026)** | `missoesGlobais` (as missões GLOBAIS, com criar e excluir) · `itens` (preço, nome, descrição — e **preço 0 tira da loja**, que é a alavanca da loja) · `badges` (nome, descrição, recompensa **e criar badge nova**) · 🧰 Editor de conteúdo · a 🎵 **música**, que entrou fora de ordem no mesmo dia | Mesmo mecanismo da fase 1 em outras tabelas. **Onde a linha foi traçada, e onde ela se MOVEU no mesmo dia**: o EFEITO de um item é código, então item novo continua sendo commit. A MEDIDA de uma badge era código pelo mesmo motivo — `mede(ctx)` é uma função —, e a resposta foi trocar a função por um CAMPO: `badges.MEDIDAS` é a lista fechada do que o `contextoBadges` conta, e badge nova traz `medida: { campo, alvo, especie? }`. O que ficou do outro lado da linha é MEDIDA nova, que continua precisando de campo no `contextoBadges`. Detalhe em `docs/features.md`. |
| **4** | **Rotas secretas** | Mecânica nova (condição no save, na tela de explorar, no progresso), não editor. Última porque é a única que não é "mover dado pra nuvem". **É o que falta.** |

## Decisões já fechadas

- **Mutação no lugar**, não `GENS` virando função: 40 pontos de leitura contra 1 de escrita.
- **`dados-rotas.js` continua existindo** como a versão de fábrica. Pacote ausente ou inválido = ele.
- **Aplicar dentro do `boot()`**, não por reload: é o único ponto que roda depois dos módulos e antes da tela.
- **Validar e descartar inteiro**, nunca aplicar pela metade.

---

## Estado em 07/10/2026

**As fases 1, 2 e 3 estão no código e cobertas por teste** (`tests/conteudo.test.js`, `tests/conteudo-pacote.test.js`,
`tests/conteudo-mapas.test.js` e `tests/editor-musica.test.js`). Falta a **fase 4** (rotas secretas) e,
principalmente, **a conferência em jogo** — ela é a mesma lista de 06/10, logo abaixo, e nenhum item dela foi
verificado ainda. Três editores publicam pelo MESMO pacote (`tela-editor-rotas.publicar`), porque
`conteudo_publicado` tem uma linha por canal.

## Estado em 06/10/2026

**Fase 1 está no código e coberta por teste** (`tests/conteudo.test.js`, `tests/conteudo-pacote.test.js` — 17
casos). O que FALTA conferir, e só dá pra conferir em jogo:

1. **A migration chegou?** A integração do GitHub aplica no push. Lembrar da armadilha do `CLAUDE.md`: não confie
   no painel, e `select('*', { count: 'exact', head: true })` devolve `error` nulo até pra tabela inexistente. A
   checagem honesta é `select('canal').limit(1)` e olhar o `error.message`.
2. **📤 Publicar** com a conta admin logada → recarregar → a rota editada aparece editada.
3. **Um jogador comum NÃO vê o canal de teste** (a política de RLS depende disso).
4. **✅ Liberar pra todos** → outro navegador, sem login, pega na próxima abertura.

As duas cópias das fábricas de missão (`editor-rotas.missaoDeEspecie`/`missaoDeAlfa` e a cópia inline que vai pro
`dados-rotas.js` gerado) estão presas por `tests/conteudo-pacote.test.js`, campo por campo nas 180 missões.
