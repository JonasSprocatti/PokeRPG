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
| **1** | `conteudo.js` + cache + boot + tabela no banco + 📤 Publicar, valendo pra **ALFAS e MISSOES_ROTA** (o que o editor já edita) | É a fundação, e já entrega controle de verdade sobre o que o editor hoje só sabe cuspir em arquivo. Nada de mecânica nova. |
| **2** | **Criar e excluir rota** · pool e níveis editáveis · integração com `baixarGen`/`VERSAO_DOWNLOAD` | Depende da fundação. Mexe em Santuário, Pokédex da conta, caça shiny e desbloqueio do Roguelike — todos leem a lista de rotas. |
| **3** | **Missões globais** · itens, loja e badges no pacote | Mesmo mecanismo da fase 1, repetido em outras tabelas. Risco: config ruim quebrando save antigo — daí a validação. |
| **4** | **Rotas secretas** | Mecânica nova (condição no save, na tela de explorar, no progresso), não editor. Última porque é a única que não é "mover dado pra nuvem". |

## Decisões já fechadas

- **Mutação no lugar**, não `GENS` virando função: 40 pontos de leitura contra 1 de escrita.
- **`dados-rotas.js` continua existindo** como a versão de fábrica. Pacote ausente ou inválido = ele.
- **Aplicar dentro do `boot()`**, não por reload: é o único ponto que roda depois dos módulos e antes da tela.
- **Validar e descartar inteiro**, nunca aplicar pela metade.
