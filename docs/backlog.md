# Backlog do PokéRPG

Saiu do `CLAUDE.md` em 30/09/2026 na segunda faxina: é planejamento — consultado quando se decide **o que fazer
agora**, não a cada sessão. O `CLAUDE.md` guarda só o ponteiro; aqui está o conteúdo palavra por palavra.

**Ao concluir um item, mova daqui pro `docs/features.md`** (o que foi construído) — não deixe nos dois.

## Pedido, ainda não construído

- ~~**Missões próprias de cada mapa**~~ **✅ FEITO (01/10/2026)** — 180 missões por rota (uma de espécie e uma de Alfa em cada rota das 9 Gens) + o 🗺 **Editor de rotas** (admin) que as gera, com análise de curva de stats e troca de Alfa. Detalhe em `docs/features.md` ("Missões por rota e o editor de rotas"); o levantamento e a revisão das 36 antigas estão em `docs/missoes-por-rota.md`. **Continua de fora, por escolha do usuário na mesma conversa**: criar/excluir rotas pelo editor e **rotas secretas** (abertas por Pokémon capturado/usado, golpe aprendido etc.) — a primeira é CRUD sobre a lista que meia dúzia de sistemas leem, a segunda é mecânica nova, não editor. São os dois itens abaixo.
- **📦 Atualização de conteúdo pela nuvem** (pedido em 06/10/2026, **aprovado para construir**): o usuário quer
  **controle completo de criação e edição do máximo de coisas do app**, sem passar por deploy. Hoje o 🗺 Editor de
  rotas cospe um `dados-rotas.js` pra colar no repositório — o conteúdo é código, então só muda com commit.
  **O plano está em `docs/plano-config-remota.md`** — ler de lá antes de mexer. O que entra (escolha do usuário):
  **rotas** (pool, níveis, **criar e excluir**), **missões de rota e globais**, **rotas secretas** (condição de
  desbloqueio — mecânica nova) e **itens, loja e badges**. O motivo de nunca ter sido feito era o OFFLINE, e a
  resposta do usuário é a arquitetura: a config fica no **cache**, atualiza quando há internet, e sem internet o
  jogador joga com a que tem. **Aplicar no meio de uma jornada só se não quebrar nada** (missão em andamento ou
  registro de Pokédex que dependa do que mudou espera a próxima jornada).
  **Andamento**: as **fases 1, 2 e 3 estão FEITAS** (06–07/10/2026). No pacote publicado já viajam: Alfas,
  missões de rota, **a lista de rotas de cada Gen** (pool com peso, níveis, nome, descrição, bioma, criar e
  excluir), **as missões de conta**, **o preço dos itens** (0 = fora da loja), **nome/descrição/prêmio das
  badges** e **a música**. Três telas de admin publicam pelo MESMO pacote: 🗺 Editor de rotas, 🎵 Editor de
  músicas e 🧰 Editor de conteúdo. **Falta a fase 4: rotas secretas** (mecânica nova — condição no save, na tela
  de explorar e no progresso, não "mover dado pra nuvem"). **E falta conferir em jogo**: nada do caminho de
  publicação foi testado com a conta admin logada — a lista está em `docs/plano-config-remota.md` → "Estado em
  07/10/2026". O que NÃO entra por pacote, e é decisão: efeito de item, medida de badge, item/badge/espécie novos
  — isso é código.
  Isso ABSORVE dois itens que estavam separados aqui desde 01/10/2026: criar/excluir rotas pelo editor e as rotas
  secretas. Os dois só faziam sentido com um caminho de publicação — sem ele, rota nova exige commit, e aí não é
  "o usuário cria rota", é "o usuário pede uma rota".
- **⚔ Modo Saga** (pedido em 02/10/2026): modo separado de RPG medieval fantástico com **ofícios** na luta
  (Guardião, Curandeiro, Arcano, Guerreiro, Encantador, Bardo), ameaça/aggro, perícias com recarga, Brecha/Ruína,
  comitiva de 4, NPCs Pokémon com diálogo, três facções e caminhos com consequência. **O plano combinado está em
  `docs/plano-saga.md`** — ler de lá antes de mexer. Entrega em 4 fases; a fase 1 é o combate.
  **✅ A FASE 1 (o combate) ESTÁ FECHADA em 05/10/2026** e o registro foi todo pra `docs/features.md` → "⚔ Saga,
  fase 1 fechada": ofícios (`js/oficios.js`), ameaça/aggro, grupo inimigo de 1 a 3 com o lado inimigo virando
  lista, comandar a comitiva, as **8 perícias** (`js/pericias.js`, recarga em turnos), **Brecha/Ruína**
  (`regras.GUARDA`/`abrirBrecha`/`multSaga`) e a **identidade de JRPG** (flag `jrpg`: janela de comandos, moldura,
  fila da rodada, vocabulário). README atualizado.
  **⛔ A Saga NÃO entra nos patch notes** (decisão do usuário, 06/10/2026): a versão 5.0 que falava dela foi
  APAGADA de `dados-patchnotes.js` e a entrada seguinte renumerada pra 5.0. O modo é admin-only e em construção —
  a tela 📜 Novidades é pra quem joga, e anunciar um modo que ninguém alcança é promessa. **Enquanto for
  `admin: true`, nenhuma leva da Saga vira patch note**; quando o modo abrir pra todos, sai UMA entrada contando
  o modo inteiro.
  **Falta, e é o que mantém o modo `admin: true`**: a **fase 2** (Juramentos, ordens por ofício, tela de comitiva)
  e a **fase 3/4** — o MUNDO do modo: trilhas em grafo de nós, NPCs Pokémon com diálogo, três facções com
  reputação, capítulos e finais. O trabalho da fase 3 é **escrever**, não programar.
  **Fora de propósito por ora**: ameaça e Brecha no `mp-motor` (não existe Saga em sala); grupo em luta de
  treinador e de lendários (a fila deles é o balanceamento dos outros modos); seleção manual de alvo aliado;
  Limit Break (as 4 gimmicks já são o ultimate do modo) e Brave/Default (mexeria na economia do turno, que é
  compartilhada pelos dois motores) — os dois últimos com o motivo medido em `docs/features.md`.
- ~~**Teste de `data-act` emitido × `case` tratado**~~ **✅ FEITO (06/10/2026)** — `tests/data-act.test.js`. O
  medo era falso positivo; medido, deu **zero**: 153 `data-act` literais contra 166 casos no switch. A saída foi
  pular os nomes montados por concatenação (quem tem `${`...`}` não existe como literal no código) e deixar uma
  lista de exceções explícita pro que é tratado fora do switch — **hoje vazia**, que é o melhor estado possível.
  Provado ao contrário: tirando o `case 'recuar'`, o teste falha nomeando o órfão.
- **Lendários no co-op**.
- **Roar & cia. e o 🔄 Recuar em luta de SALA (multiplayer)**: hoje falham com aviso (`ctx.forcarSaida` só existe no single player; o Recuar nem aparece de botão lá). Regenerator/Natural Cure/Wimp Out também só valem no single player. Precisaria de "tirar da luta" no `mp-motor` (o Pokémon fora não é derrotado, e o resultado volta por fração de HP). **Eject Button/Eject Pack não foram feitos**: só serviriam a aliados (no seu principal a saída voluntária não vale). Shed Tail não foi feito (não existe Substitute). Detalhes em `docs/features.md` ("Travas, IA e troca de Pokémon").
- **Golpes que mexem na ORDEM do turno**: After You, Quash e Instruct. Ficaram de fora da leva de golpes de
  companheiro (09/10/2026) porque não são problema de ALVO — pedem reordenar a fila de `acoes` no meio da rodada,
  nos dois motores. Hoje dizem que o efeito será ajustado. Junto deles: **Ally Switch** (não há posições em campo)
  e **Spotlight** (chamariz ao contrário: exigiria a escolha do SEU golpe ler o chamariz do lado de lá).
- **Habilidades**: 249 de 314. As 65 restantes estão documentadas como intencionalmente fora, por quatro motivos, no fim da tabela em `js/habilidades.js` (troca de Pokémon, forma dinâmica, estado de turno que o motor não guarda, regra compartilhada arriscada).

- **Heavy-Duty Boots** (pedido em 30/09/2026, **não construído de propósito**): o item ignora armadilha de entrada,
  e aqui isso não existe pro jogador. `golpe.aplicarArmadilhas` só é chamado quando o **inimigo** entra em campo
  (as duas chamadas estão em `batalha.js`); do seu lado ninguém troca, aliado não "entra", `mp-motor` não tem
  armadilha nenhuma e **inimigo não segura item**. Seria um item comprável que não faz nada. Pra ele valer,
  antes teria de existir armadilha pegando o SEU lado — o que é mudança de mecânica, não item. Decisão do
  usuário na mesma conversa: deixar de fora.
- **Dragon Scale segurada** (e os outros itens de evolução sem efeito de luta): na Gen 2 a Escama de Dragão
  reforçava golpe de Dragão, mas nos jogos modernos ela só evolui — ficou de fora por isso, não por esquecimento.
  Se um dia a ideia for "todo item de evolução faz algo", é inventar efeito, não portar.

## Revisões grandes pedidas (ainda não feitas)

- **Revisão do site pra entrar nas políticas do Google AdSense** — **levantamento feito, em `docs/adsense.md`**; ler ANTES de mexer em qualquer coisa dessa área. Decisão do usuário (29/09/2026): seguir com os disclaimers, usando o **Pokémon Showdown como caso de uso** (roda AdSense há anos com o mesmo tipo de conteúdo; o site deles não tem aviso de marca em lugar nenhum — o que importa é ser gratuito e não vender nada da franquia). **Já entregue**: páginas estáticas com URL própria (o jogo era uma URL só, sem nada legível por buscador), política de privacidade reescrita, rodapé com links legais, `robots.txt`/`sitemap.xml`/`ads.txt`, domínio próprio nos `canonical`, **guia em 6 capítulos** (o conteúdo próprio) e o **snippet com Consent Mode v2** (`js/consent.js`). **O que falta e em que ordem está em "Precisa de ação do usuário" abaixo** — a próxima etapa é **do usuário: pedir a revisão**.
- ~~**Revisão e refatoração completa do multiplayer**~~ **✅ FEITA (29/09/2026)** — `multiplayer.js` (1190 linhas) virou seis módulos, o menu/lobby/luta foram redesenhados (convite por link, espectador, cena de batalha, barra de prazo, histórico do turno) e a rede ficou leve (`ping` + render por região). Detalhe em `docs/features.md` ("A revisão do multiplayer"). **Continuam de fora**: Roar & cia. em sala (item acima) e a **troca de verdade entre jogadores**, que desde 06/10/2026 está em "Decisões fechadas" — não vai ser construída.
- **Auditoria de segurança** — **2ª leva FEITA (30/09/2026)**, detalhe em `docs/features.md` ("A segunda auditoria de segurança"). Foi o item (d) abaixo: `/security-review` rodado como segunda opinião sobre o repositório inteiro (a branch estava limpa, então o escopo foi o projeto, não um diff). **7 achados, 6 graves, todos corrigidos**: bypass de apóstrofe por entidade HTML no `urlDeImagem` (XSS de sala → conta), `poke_id` cru num `src` em `perfil-amigo.js` (XSS de perfil → conta), política de UPDATE de `amizades` sem prender `de`/`para` (ler o histórico de qualquer conta), `power(0.8, n)` com `n` negativo em `validar_jornada` (1º lugar do ranking forjado e imortal), desconto de item na mochila comandado por pacote de rede não autenticado, `desistir` aceito fora do PvP (acabar com a run de outro em co-op) e nome da PokéAPI virando literal de JS nos geradores PowerShell. **O que continua de fora, agora medido**: forjar um `fim` na sala ainda é possível pra quem está nela (o `de` não é prova — broadcast não assina remetente), mas o dano ficou restrito a HP/narração: item e conta passaram a exigir o livro-caixa local (`mp-regras.itensADescontar`). **Falta decidir** se o cliente deve aplicar `permadeath` a partir de resultado de sala (hoje aplica; um `fim` forjado com `frac: 0` encerra a run de quem recebe) — é mudança de regra do jogo, não conserto, então está esperando o usuário.
- **Auditoria de segurança — 1ª leva FEITA (29/09/2026)**, detalhe em `docs/features.md` ("A auditoria de segurança"). Achado grave e corrigido: **a sala do multiplayer confiava no pacote que chegava** (XSS → sessão do Supabase no `localStorage` → conta da pessoa) — agora tudo passa por `js/mp-sanear.js`. No banco, dois furos de ABUSO fechados (`20260929180000_seguranca_upload_e_visitante.sql`): bucket de imagem de relato aberto a qualquer um sem teto, e contador de visitante aceitando id inventado. **Revisado e considerado OK**: RLS de todas as tabelas, `validar_jornada`, gatilho anti-autopromoção de `perfis.admin`, `perfil_do_amigo` (só amigo aceito), chave anônima no `config.js` (é pública por natureza), presença global (`track({})` vazio). **Anexar imagem num relato exige CONTA** (decisão do usuário, 29/09/2026 — `20260929210000_imagem_de_relato_so_com_conta.sql`): sem conta não há a quem amarrar o envio, então nenhum teto vale. O RELATO segue sem conta (promessa da tela). A regra é cobrada em 3 camadas e todas leem `imagens-relato.podeAnexarImagem`/`MOTIVO_PRECISA_CONTA`; `subirImagensRelato` devolve **`null` ≠ `[]`** pra fila offline antiga subir o texto em vez de ficar presa pra sempre. **O que FALTAVA aqui virou a 2ª leva, acima**: (b) a pontuação é calculada no navegador e só CONFERIDA no servidor — o limite segue valendo (jornada plausível inventada passa; sem servidor de jogo não tem como fechar), mas a 2ª auditoria achou um caso que **não era esse limite** e sim furo de verdade (expoente negativo em `continuacoes` fazia o gatilho ASSINAR pontuação impossível), corrigido em `20260930120000`; (c) forjar um `fim` de luta ainda é possível pra quem está NA sala (o `de` não é prova — broadcast não tem remetente assinado), **mas o que estava escrito aqui e em `features.md` sobre isso estava errado**: dizia que não corrompia save, e corrompia (item da mochila e inventário de conta) — agora não mais; (d) ~~`/security-review` nunca foi rodado como segunda opinião~~ ✔ **rodado em 30/09/2026**.

## Precisa de ação do usuário

- 🔔 **Lembretes por push — 3 passos à mão, nenhum feito ainda (08/10/2026).** O código está pronto e inerte:
  `js/config.js:VAPID_PUBLICA` está **vazia**, e vazia significa "sem push" (o jogo segue avisando dentro da aba,
  e `pushDisponivel()` esconde a promessa da tela de ⚙ Ajustes). Pra ligar, na ordem de `supabase/LIGAR-LEMBRETES.sql`:
  1. `node ferramentas/gerar-vapid.mjs` → cola a pública em `js/config.js` (pode commitar) e põe o JSON das duas
     como segredo **`VAPID_JWK`** no painel (Edge Functions → Secrets). A privada **nunca** vai pro repositório.
  2. `supabase functions deploy lembretes` (a função já lê `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` sozinha).
  3. O SQL do cron, no SQL Editor, trocando o endereço do projeto e a service role key (hora em hora).
  A migration `20261008120000_lembretes_push.sql` sobe sozinha pela integração do GitHub — ela não depende de nada
  disso. Enquanto os 3 passos não estiverem feitos, ninguém recebe lembrete e nada quebra.
- ⚠️ **`evento.BETA_SEM_ESPERA = true`** remove a espera de 8 h entre tentativas (beta testers). **Temporário** — reverter é trocar essa linha.
- **AdSense — em andamento, sequência combinada (29/09/2026).** Conta criada, domínio `pokerpg.com.br` cadastrado, publisher ID **`ca-pub-9827780756194019`**, estado "Precisa de revisão". Etapas 1–3 **feitas**:
  1. ~~Verificar a propriedade pelo `ads.txt`~~ ✔ (o usuário confirmou no painel).
  2. ~~Guia por tema~~ ✔: 6 capítulos (`CAPITULOS_GUIA` em `site.js`, texto em `ferramentas/conteudo-guia.mjs`), índice em `guia.html`, navegação no pé de cada um.
  3. ~~Snippet com Consent Mode v2~~ ✔: `js/consent.js` + o script do AdSense no `<head>` de `index.html` e das 11 páginas estáticas, `ADSENSE_CLIENT_ID` preenchido, `ads.js` reescrito. **`AD_SLOT_INICIO`/`AD_SLOT_GUIA` continuam vazios de propósito** — unidade de anúncio só existe depois da aprovação, e hoje o site carrega o código sem exibir anúncio (o estado certo pra revisão).
  4. ~~Pedir revisão no painel do AdSense~~ ✔ **FEITO pelo usuário em 30/09/2026 — aguardando a resposta do Google.** Nada a fazer nesta área enquanto não vier o veredito: **não mexer no `<head>`, no `consent.js`, no `ads.txt` nem nos `canonical`** durante a análise (mudança no meio da revisão é motivo comum de reprovação). Se vier reprovado, o motivo vem no e-mail/painel e aí sim se ajusta o que ele apontar — `docs/adsense.md` tem o levantamento completo pra consultar. Manter **Anúncios automáticos DESLIGADOS** no painel (senão o Google insere anúncio onde quiser, inclusive junto dos botões de batalha = clique acidental = tráfego inválido = banimento).
  5. **→ PRÓXIMO, só depois de aprovado:** criar as unidades de anúncio e preencher `AD_SLOT_GUIA` (páginas de conteúdo) e `AD_SLOT_INICIO` (fim da tela inicial) — o código já desenha sozinho; **CMP certificada** ("Privacidade e mensagens" do próprio AdSense, grátis) e **remover o banner caseiro**; fontes locais (GDPR).

## Ideias soltas (nunca pedidas)

Mais missões por tipo/zona · recompensa de Alfa diferente por rota · rank/título de explorador · resumo de badges já calculado no perfil de amigo.

## Decisões fechadas que continuam valendo

**Troca de Pokémon entre dois jogadores não vai existir** (06/10/2026): o Cabo de Conexão simulado continua sendo o caminho de quem evolui por troca, e o item saiu do backlog. XP por Gen fica canônico (Paldea dá mais que Kanto — é dado da franquia). Formas de Hisui no Santuário de Galar (é como a PokéAPI classifica). Teto de aliados **continua em 2** (o Esconderijo já resolve "guardar mais parceiros"; subir mudaria o balanceamento). Painel de manutenção **continua** (jogo em ajuste ativo). Só iniciais na criação em todos os modos (`especiesLivres` false).
