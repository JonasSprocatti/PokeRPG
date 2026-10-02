# Como cada coisa foi construída

Narrativas de implementação tiradas do `CLAUDE.md` em 29/09/2026 (ver docs/historico.md pro mesmo motivo). O
CLAUDE.md guarda a REGRA (o que não pode quebrar); aqui fica o COMO e o PORQUÊ: o que foi considerado, o que foi
simplificado de propósito e o que ficou de fora. Consulte ao mexer na área.

## Índice
- Golpes de peso e de atributo trocado (02/10/2026)
- Evento semanal, chefes e Arena
- Loja de preparo, Hall da Fama e Sala de Raide
- Habilidades: as 7 levas
- Gimmicks (Mega, Tera, Z-Move, Gigantamax) e as do inimigo/co-op
- Itens no multiplayer · Reordenar golpes · Vínculo de Batalha
- A revisão do multiplayer (29/09/2026)
- A auditoria de segurança (29/09/2026)
- Sprites, animações e microinterações
- Som: cries e música procedural (30/09/2026)
- Troca de tipo, Endeavor no chefe e a leva de itens de 30/09/2026
- Anúncios e privacidade

---

## Golpes de peso e de atributo trocado (02/10/2026)

Um levantamento do jogador: "Heavy Slam, Psyshock e Body Press funcionam?" Não funcionavam, e de duas maneiras
diferentes — a segunda bem pior que a primeira.

**Poder variável que a PokéAPI não calcula.** Low Kick, Grass Knot, Heavy Slam, Heat Crash, Wring Out e Crush Grip
vêm da API com `power: null`, e `calcDamage` fazia `move.power || 60`: **todos batiam com poder fixo 60**, o Low Kick
contra um Snorlax igual ao Low Kick contra um Caterpie. Entraram como fórmulas em `regras.poderEspecial`
(`pesoDoAlvo`, `pesoRelativo`, `hpDoAlvo`), mais `estagios`/`estagiosDoAlvo` para Stored Power, Power Trip e
Punishment — esses três tinham poder na tabela, mas o poder BASE, sem os +20 por degrau.

O peso não existia no jogo: `api.slimPokemon` descartava o `weight` da API. Ele entra agora **em hectogramas, como
a API manda** (`pesoKg` divide por 10 na hora de usar) — converter na entrada criaria duas unidades em circulação.
Quem já tinha a espécie no cache tem um registro sem o campo; é exatamente o caso que o `valido` de `cached()` existe
pra resolver (o precedente é o `learnset.extras`), então `loadPokemon` passou a exigir `typeof v.weight === 'number'`
e troca o registro na primeira busca online. **Não subimos `VERSAO_DOWNLOAD`**: nenhuma busca nova entrou no
`baixarGen`, só um campo a mais no mesmo JSON. O preço é que quem está offline com uma Gen antiga baixada continua
sem o peso — e aí as fórmulas devolvem `null` de propósito, caindo no poder da tabela. É melhor que tratar peso
ausente como zero, que daria Heavy Slam de poder 120 contra tudo.

**O par de atributos errado — esse não "não funcionava", funcionava diferente em silêncio.** `calcDamage` escolhia
Ataque/Defesa só pelo `cls` do golpe. Então Psyshock, Psystrike e Secret Sword (especiais que nos jogos batem na
Defesa FÍSICA) atingiam a Defesa Especial; Body Press usava o seu Ataque, quando a razão de ele existir é bater com
a Defesa; e Foul Play usava o SEU Ataque em vez do do alvo. Nenhum deles mostrava "efeito será ajustado em
atualizações futuras", porque dano saía — só o número errado. Três campos novos em `especiais.js` (`atkDe`,
`atkDoAlvo`, `defDe`) e o par de `effStat` em `calcDamage` passou a consultá-los.

Como tudo caiu em `calcDamage` e em `poderEspecial`, veio de graça: o motor único (`golpe.js`), o multiplayer
(`mp-motor` chama o mesmo `usarGolpe`) e **a IA do inimigo**, que estima dano por `notaDoGolpe` → `calcDamage` e
agora entende que o Heavy Slam dela vale mais contra um alvo leve.

**Ficou de fora:** Avalanche e Revenge (dobram se você levou dano ANTES no turno) — precisam de um registro novo no
`vol` alimentado pelos dois motores, não é uma fórmula pura. Autotomize também não existe, então nada altera o peso
durante a batalha.

O teste de contrato de `tests/especiais.test.js` ("só comportamentos que o motor conhece") pegou cada fórmula e cada
campo novo antes de eu rodar o resto — é pra isso que ele está lá. O teste da troca de atributo compara o golpe com
um de referência do mesmo poder mexendo só no atributo que deveria pesar, em vez de travar um número de dano.

---

## Evento semanal, chefes e Arena

- **Evento semanal** (`evento.js` calendário/elegibilidade/espera de 8 h, `boss.js` regras do chefe, testes em `tests/evento.test.js` e `tests/boss.test.js`):
  `EVENTOS[semana % n]`, semana = segunda→domingo UTC contada de `INICIO` (21/09/2026); só `DIFICULDADES[x].eventoSemanal` (Roguelike/Hardcore) e só na Gen do chefe.
  Aparece na rota FINAL (`z.lendarios`, mesma trava de nível) em `render.blocoEvento` e como sprite com brilho na escolha de Gen (`criacao.renderGens`); botão
  `data-act="evento"` → `mundo.desafiarEvento` → `batalha.startEvento`. A espera fica só no navegador (`evento.TENTATIVA_KEY`) — dá pra burlar pelo relógio; servidor
  valida depois. **O chefe é um Pokémon comum com `E.boss`** (dados puros: vai no save e, no futuro, na rede) e as regras entram em `golpe.js` por 4 ganchos:
  `danoNoChefe` (couraça reduz/Ruptura aumenta, no laço de dano), `aposDanoNoChefe` (desgasta couraça, interrompe carga, fases → efeitos `{dizer,estagios,curaStatus}`
  aplicados por `aplicarEfeitosChefe`), `antesDoChefeAgir` (início de `usarGolpe`: carrega/solta o Eternabeam, que já tem `recarga` em `especiais.js`) e a imunidade
  a status em `aplicarStatus`. Todos os números em `boss.AJUSTES` — a dificuldade se calibra jogando (chute inicial: HP ×5, atributos ×1,3, couraça 16% do HP, ciclo de 4).
  `EVENTO_SEM_PERMADEATH` (evento.js): perder pro chefe não encerra a run nem perde aliado. Vitória → `carreira.registrarVitoriaDeEvento` grava
  `progresso.eventos[id] = {primeiraEm, vitorias, semanas}` + espécie em `progresso.especies` (razão `evento`) — `mesclarProgresso` faz união. Badge `evento-<id>` (grupo `Eventos`,
  `badges.js`); a exibida ao lado do nome é `nuvem.badgeExibida` (localStorage + `perfis.badge_exibida`, migração `20260925120000_badge_exibida.sql`; sem a coluna segue local).
  **Calendário**: `INICIO` = segunda 28/09/2026 00:00 de Brasília (03:00 UTC); a semana vira toda segunda 00:00 BRT (`FUSO_MS`); antes de `INICIO` `eventoDaSemana` é `null` e
  `situacaoDoEvento` devolve `motivo:'em-breve'`. `agenda(agora, 3)` alimenta a tela inicial (`criacao.renderAgendaEvento`). Pra TESTAR antes da data: no console,
  `localStorage.setItem('pokerpg-evento-agora', Date.UTC(2026,8,28,12))` (`evento.RELOGIO_KEY`; qualquer chamada usa `agoraDoEvento()`, nunca `Date.now()` direto).
  **Vários chefes**: `boss.CHEFES[id]` guarda a config (couraça e/ou `pontoFraco`, canhão, fases, ciclo); `E.boss.id` escolhe. Eternatus = couraça + Ruptura; Mega Rayquaza = ponto fraco
  rotativo (`danoNoChefe(t, dano, tipo)` recebe o TIPO do golpe) + Dragon Ascent (`expostoAposCanhao`). Chefe novo = uma linha em `EVENTOS` (evento.js) + uma em `CHEFES` (o teste confere as duas).
  **Co-op** (`multiplayer.iniciarBatalhaMP('evento')`, botão `botaoEventoMP`): `fotoDoMon` leva `boss`; HP por `jogadoresEfetivos(jogadores, porJogador)`; o golpe carregado devolve `todos` →
  `u.boss.soltouTodos` e o `mp-motor` chama `usarGolpe(..., {extra:true})` nos outros alvos (sem nova ação, sem recarga). **Revive**: ação `revive` → `registrarRevive` (anfitrião) →
  `mp-motor.reviverNoEvento` muta o estado NA HORA (o Pokémon já escolhe no turno); `b.revivesUsados[dono]` viaja no estado e cada cliente desconta o Revive da PRÓPRIA mochila em
  `consumirRevives` (o anfitrião não sabe a mochila dos outros). Sem fuga no evento (`s.evento`). Cada participante registra a tentativa de 8 h ao ver o 1º estado (`sala.tentativaEvento`)
  e recebe o prêmio em `premiarEventoMP` só se a SUA run é Roguelike/Hardcore. A insígnia exibida vai no payload de presença (`meuPayload().badge`) e, nas listas persistentes, pelas RPCs `meus_amigos()` e `ranking()` (coluna `badge_exibida`, migração
  `20260925130000_badge_nas_listas.sql`, que exige a `20260925120000_badge_exibida.sql` antes). O servidor só devolve a insígnia se `progresso.dados->'eventos'` contém o evento
  (`badge_exibivel(uuid)`) — não é à prova de fraude (o progresso é gravado pelo jogo), mas impede escolher no perfil algo que nunca foi conquistado. O cliente desenha com
  `conta.htmlInsigniaDe(id)` (topo, amigos, ranking, sala); versão antiga do banco só não traz o campo e nada quebra. ~~**Falta**: os outros chefes e os itens.~~ **✅ COMPLETO** (conferido em 29/09/2026 rodando o código: `EVENTOS.length` = 14, `Object.keys(boss.CHEFES).length` = 14 — hoje 16 e 16, com Arceus e Regigigas, itens com `raide` em `ITEMS` = 10). Os 14 chefes estão em "Os 14 chefes" e os 10 itens em "Itens de raide", as duas seções logo abaixo.
  **⚠️ TEMPORÁRIO (pedido do usuário, beta testers, 28/09/2026): `evento.BETA_SEM_ESPERA = true` remove a espera de
  8h entre tentativas** — Arena, run e sala. Implementado SEM tocar `COOLDOWN_MS`/`esperaRestante` (que continuam
  puros e testados com os números reais): a flag entra só em `evento.ultimaTentativaEfetiva()` (finge "nunca
  tentou" quando ligada) e no parâmetro PADRÃO de `situacaoDoEvento` — os testes chamam `situacaoDoEvento` sempre
  com `ultima` explícito, então não veem a flag e continuam garantindo a regra de verdade. `arena.js` troca as duas
  chamadas de `esperaRestante(ultimaTentativa()...)` por `ultimaTentativaEfetiva()` pelo mesmo motivo. **Pra
  reverter**: só `BETA_SEM_ESPERA = false` em `evento.js` — nada mais precisa mudar. Textos que mencionavam "8
  horas" de forma incondicional (`mundo.desafiarEvento`, `criacao.renderAgendaEvento`, `ajuda-chefes.js`,
  `arena.htmlLobby`) agora checam a flag e mostram "🧪 Modo beta: sem espera" em vez de mentir sobre o cooldown.
  **Convite pra jogar em grupo a partir da Arena** (mesmo pedido): a Arena (`arena.js`) é só single-player (Hall da
  Fama, sem outros jogadores — nunca foi multiplayer de verdade). O usuário queria chamar gente de dentro dela;
  como as duas telas são sistemas bem diferentes (Arena não usa sala/rede, co-op usa), a solução foi um cartão
  "👥 Jogar em grupo" no topo do lobby da Arena com um botão `data-act="mp"` que leva direto pra tela de
  Multiplayer — de lá, sala co-op já suportava isso (`MAX_JOGADORES` = 6, `porJogador` 1–3) sem precisar de
  nenhuma mudança de código, só não estava óbvio que o caminho existia.
- **Perfil de amigo** (`perfil-amigo.js` tela, `perfil-dados.js` contas puras; testes em `tests/perfil-amigo.test.js`): botão `data-act="amigo-perfil"` na lista de amigos (e "Ver meu perfil" na Conta) →
  `nuvem.perfilDoAmigo` → RPC `perfil_do_amigo(uuid)` (migração `20260925150000_perfil_do_amigo.sql`, SECURITY DEFINER): só devolve se a amizade está `aceita` (ou é o próprio) e só o que já é público no jogo
  (apelido, ícone, `badge_exibivel`, criado_em, ids dos chefes vencidos, contagem de espécies, números agregados das `jornadas` e as 5 últimas) — sem e-mail, código de amigo ou mochila (o teste confere o texto do SQL).
  **Não** mostra as badges de conta de caçada/coleção/etc.: elas são calculadas NO CLIENTE a partir do progresso+carreira, e mandar isso tudo do servidor seria pesado; ideia futura: um resumo já calculado.
  Sem a migração a tela mostra o erro e diz qual arquivo rodar. Ordem das migrações do dia 25/09: 120000 (badge_exibida) → 130000 (badge nas listas) → 140000 (relatos) → 150000 (perfil do amigo).
- **Arena do Chefe + Hall da Fama** (`hall.js` puro, `arena.js` tela/loop, `ajuda-chefes.js` texto; testes em `tests/hall.test.js`): `encerrarJornada` chama `carreira.registrarNoHallDaConta(S, resumo)` ANTES de zerar `G.S`
  (só modos com `eventoSemanal`) e passa os itens de raide da mochila pro inventário da conta (`evento.darItensDeRaide`, localStorage `pokerpg-raide-v1`, NÃO sincroniza). O Hall vive em `progresso.hall[jornadaId]`
  (entrada compacta: espécie/id, nível, IVs, EVs, natureza, habilidade, NOMES dos golpes; `podarHall` mantém `HALL_MAX`=30; `mesclarProgresso` faz união). **A Arena NÃO usa `G.S`**: roda o motor do co-op
  (`mp-motor`) localmente — lado A = Hall reidratado (`makeMon` + `loadMove`), lado B = chefe (`prepararChefe(E, jogadoresEfetivos(1, n))`) — então não pode mexer no save de uma run em andamento. Por isso não tem item
  segurado, Mega/Tera/Z/Gigantamax nem Revive (o motor do co-op não os tem). Tentativa de 8 h, vitória (`registrarVitoriaDeEvento`) e prêmio de itens de raide iguais ao resto do evento; dinheiro/Rare Candy só dentro de
  uma run. Entradas antigas (jornadas terminadas antes deste recurso) NÃO estão no Hall: só valem as que terminam depois. Ideia de expansão: chefe na Arena em grupo (a base do co-op já serve).
- **Os 16 chefes** (`evento.EVENTOS`, fábrica `ev()`; regras em `boss.CHEFES`, mesma `id`): a ordem do array É o calendário (semana N = `N % 16`). Mecânicas novas além de couraça/ponto fraco/canhão/fases:
  `climaFixo` (`aplicarClimaDoChefe` usa o clima fixo de `novoCampo`; Groudon sol, Kyogre chuva), `anula {tipos}` (dano 0 + texto em `golpe.js`), `inverso {acoes}` (Mundo Reverso: `danoNoChefe(t, dano,
  tipo, ef)` divide pelo ef² do motor, com teto ×4), `adapta {reducao}` (guarda `b.ultimoTipo` DENTRO de `danoNoChefe`), `dreno` (`drenoDoChefe` em `executar`), `regenera` (efeito `{cura}` em
  `antesDoChefeAgir`), `habilidade` (habilidade da tabela do motor: Calyrex `grim-neigh`, Necrozma `neuroforce`, Zacian `intrepid-sword`, Regigigas `slow-start`),
  `pontoFraco.sorteia` (Arceus: o tipo da vez é SORTEADO entre os 17 Pratos — `dados.PLACA_DO_TIPO` sem o Normal — e nunca repete o atual; a troca devolve
  o efeito `{pratos: tipo}`, que é PEDIDO DE ANIMAÇÃO: `ctx.pratos` → `ui.trocarPratos` no single player, ignorado por quem narra sem DOM. Com 17 tipos no
  bolo acertar a janela é raro, então `contra` subiu pra 0,65 e `mult` pra ×2; as telas trocam o rótulo por `🏛 Prato da vez` lendo `resumoDoChefe().prato`). **O golpe carregado NÃO pode ser golpe de carga do motor**
  (`especiais.carga`, ex.: Freeze Shock — viraria "preparando" de novo); o teste confere. `EVENTO_SEM_PERMADEATH` vale pra todos. **Simplificações a lembrar**: as duplas (Zacian+Zamazenta,
  Dialga+Palkia) viraram UM chefe cada; Mewtwo troca pro "modo X" só como bônus de atributo (fase 2) — não há troca de forma/sprite; Kyurem não ignora habilidades do jogador.
- **Itens de raide** (`dados.ITEMS[x].raide`, `boss.usarItemDeRaide`): 10 consumíveis, UM de cada tipo por luta (marca
  em `E.boss.raide`), só valem com `E.boss`: `cristal-de-ruptura`, `selo-de-interrupcao`, `escudo-astral` (os 3
  originais) + `cinza-vulcanica`, `escama-abissal`, `prisma-de-luz`, `espelho-reverso`, `relogio-de-areia`,
  `fragmento-tera`, `celula-zygarde` (28/09/2026, ver abaixo).
  Single player: `itens.useItem` → `usarRaide` (gasta o turno). Co-op: ação livre `raide` → `multiplayer.registrarRaide` (anfitrião) → `mp-motor.usarRaideNoEvento`; `b.raideUsados[dono][tipo]` viaja no estado e
  `consumirRevives` desconta da PRÓPRIA mochila. Escudo Astral = `b.canhaoMult` (0,5) consumido no próximo golpe carregado; `canhaoUltimoMult` faz os outros alvos do co-op levarem o mesmo corte.
  Vêm de prêmio: `evento.ev()` dá 2 de um dos 3 originais + 1 de um dos 14 novos (7 consumíveis + 7 segurados), girando cada grupo no próprio módulo.
  **✅ FEITO (28/09/2026) — os 14 itens do backlog aprovado.** `usarItemDeRaide(E, tipo, ladoJogador)` ganhou um
  3º parâmetro (os 3 originais ignoram): `cinza`/`abissal` escrevem `ladoJogador.resisteRaide = {tipo, turnos:3}`
  (novo campo em `regras.LADO_VAZIO`, decrementado em `passarLado`, lido por `regras.multResisteRaide` em
  `calcDamage` — igual a `multTelas`); `prisma` reusa `exporChefe` (a MESMA Ruptura, mas com `cfg.pontoFraco`
  como porta em vez de `cfg.coura` — dá contra-jogo pra lutas sem couraça); `espelho` é uma inversão de tabela
  TEMPORÁRIA e independente do `b.reverso` do Giratina (`b.espelhoAcoes`, decrementado em `antesDoChefeAgir`,
  checado em `danoNoChefe` junto com `b.reverso`); `celula` liga `b.semRegen` (checado onde `cfg.regenera` cura,
  em `antesDoChefeAgir`), só funciona em chefe com essa mecânica (hoje só Zygarde Completo). **`relogio` e
  `fragmento` não sabem QUAL Pokémon usou nem se o Tera já saiu** — isso mora no estado de cada motor, não no do
  chefe — então `usarItemDeRaide` devolve marcadores (`{estagios:[['speed',2]]}`, `{recarregaTera:true}`) que os
  TRÊS chamadores resolvem: `itens.usarRaide` (`changeStats(S.player,...)` + `G.B.teraUsada=false`),
  `mp-motor.usarRaideNoEvento` (aplica direto em `vol.stages` do PRINCIPAL de quem usou — sem `ctx` de narração
  nessa ação livre, então Clear Body/Simple/Contrary não entram nesse +2 específico — e reseta
  `estado.gimmicksUsados[dono].tera`) e a Arena (`arena.arenaRaide` já chama o MESMO `usarRaideNoEvento` do
  co-op, então herda de graça). **7 itens SEGURADOS novos** (`dados.ITENS_RAIDE_SEGURADOS`, sem `price` — só vêm
  de prêmio, nunca da loja; `segurados.IDS_SEGURADOS` agora soma as duas tabelas): `nucleo-eternamax`
  (`danoTipo` + `multStat`, gancho `danoTipo` NOVO em segurados.js — dano por tipo do PRÓPRIO golpe, igual ao
  `danoTipo` de habilidades.js mas pro item), `escama-do-ceu`/`cristal-psiquico`/`cristal-gelido` (`resisteTipo`,
  gancho NOVO — dano RECEBIDO daquele tipo, novo `regras.resisteDoItem` chamado em `calcDamage` do lado de quem
  DEFENDE, mesmo espírito de `ht.resiste` das habilidades), `redea-espectral`/`emblema-da-coroa`/`presa-da-lua`
  (ganchos que já existiam: `multStat`/`multDano`/`drenaDano`). **Simplificações assumidas** (documentado no
  próprio código): Rédea Espectral vira só +20% Velocidade (sem a prioridade no 1º turno do design original —
  exigiria threading de "é o turno 1" nos dois motores de ordenação); Emblema da Coroa vira +15% de dano fixo
  (sem depender de "lutar acompanhado" — mesma classe de problema que fez a habilidade Friend Guard ficar de
  fora da 5ª leva: `calcDamage` não recebe o roster de aliados do atacante).

---

## Loja de preparo, Hall da Fama e Sala de Raide

- **Loja de preparo da Arena** (28/09/2026, `progresso-conta.js` + `carreira.js` + `arena.js` — revisada no MESMO
  dia, ver abaixo): saldo de conta em dinheiro, só usável ali — `FRACAO_SALDO_ARENA` (10%) de `maxDinheiro` de
  CADA jornada bancada (`porJornada[id].maxDinheiro`, campo novo nessa entrada), somado pra sempre e nunca encolhe
  (mesmo princípio do resto de `progresso-conta.js`). `saldoArenaGanho`/`saldoArenaDisponivel`/`gastarSaldoArena`
  são puras e testadas; `gastoArena` mescla pelo MAIOR valor entre os dois lados (é gasto, não conquista — perder
  o controle de quanto já foi gasto deixaria comprar de graça). `carreira.saldoArenaDaConta`/`gastarSaldoArenaDaConta`
  fazem a ponte com `localStorage`.

  **✅ CORRIGIDO — bug real relatado pelo usuário: "itens equipáveis e itens de uso dentro da Raid não estão
  funcionando, não tem lugar pra selecionar eles pra usar".** Causa raiz: `progresso-conta.bancar()` pula
  jornadas cujo id JÁ está em `porJornada` (`if (p.porJornada[j.id]) continue`) — certo pra não reprocessar à toa,
  mas isso também pulava o BACKFILL de `maxDinheiro`: quem já tinha a conta com jornadas bancadas ANTES desse
  campo existir (ou seja, qualquer conta com carreira anterior a hoje) ficava com `maxDinheiro` sempre ausente
  nessas entradas — `saldoArenaGanho` somava zero pra sempre, então TODO botão de comprar ficava "Saldo
  insuficiente" desabilitado, e sem nada comprado não havia nada pra equipar nem usar (a seção "🎽 Equipar item"
  também mostra a mensagem de "compre primeiro" quando `donos.length === 0`). Corrigido: `bancar()` agora, pra
  jornada JÁ bancada, atualiza só o campo que falta (`Math.max` — nunca encolhe) em vez de pular a entrada
  inteira. Autocorretivo: `atualizarProgresso()` já roda (e salva) a cada vez que a tela da Arena é aberta, então
  o saldo se ajusta sozinho na próxima visita, sem precisar de migração à parte. `tests/progresso-conta.test.js`
  ("bancar preenche maxDinheiro de jornada JÁ bancada antes desse campo existir") trava a regressão.

  **Revisão do que a loja vende (mesmo dia, pedido do usuário: "não era pra comprar item de raide, e sim cura,
  revive, stat e itens de segurar").** A primeira versão vendia os 10 itens de raide — **errado**, esses
  continuam só de prêmio (`ITENS_DE_RAIDE`, exibidos como lista comum no lobby, sem botão de comprar). `htmlLoja`
  agora vende, pelo MESMO preço da loja normal (`ITEMS[id].price`, pago com saldo em vez de dinheiro de run):
  `CURA_ARENA` (16 itens: Potion…Full Restore, curas de status, Ether/Max Ether, **Revive e Max Revive juntos** —
  o pedido incluía revive explicitamente), `STATS_ARENA` (os 5 X-itens) e os 13 `ITENS_SEGURADOS` clássicos
  (Restos, Orbe da Vida…). **Pratos do Arceus e os 7 segurados de prêmio de raide NÃO entram** (continuam
  exclusivos de badge/prêmio — não é o que foi pedido, e manteria a exclusividade que acabou de ser desenhada
  pra eles). Cura/stat se compram QUANTAS vezes o saldo permitir (se gastam no uso, sem teto de estoque — como
  a loja normal); item de segurar se compra **UMA vez só** (botão desliga com `inventarioRaide()[id] > 0`) porque
  não se GASTA equipando, só ocupa um slot — ver abaixo.

  **Equipar item de segurar** (`htmlEquipar`, entre "Seu Hall da Fama" e a Loja): pra cada Pokémon selecionado
  pra luta, um `<select data-arena-equipar>` lista os segurados que a conta já possui; a escolha fica em
  `equipamento[chave do Hall]` (memória, não localStorage — resetado em `arenaFim`), aplicada em `M.item` só na
  hora de `reidratar()` (montar o Pokémon pra luta). Um item físico não pode estar em dois Pokémon ao mesmo
  tempo: escolher o mesmo id pra outro automaticamente tira de quem tinha antes (`arenaEquipar`), e o `<option>`
  avisa "(tira de Fulano)". **Simplificação assumida**: equipar NÃO gasta o item do estoque — a Arena não tem
  onde guardar "quem está com o quê" entre tentativas (o Hall não tem campo de item, diferente da run), então a
  saída mais simples é: comprado uma vez, reutilizável em toda luta futura, pra sempre. Isso vale até pra itens
  que no jogo normal se GASTAM na batalha (Faixa de Foco, as frutas) — na Arena eles nunca desaparecem de
  verdade, mais generoso que numa run de verdade, mas evita construir um sistema de "empréstimo por luta" só
  pra cá. `main.js` liga o `change` do `<select>` (`data-arena-equipar`) — não existe handler genérico de
  `data-act` pra `change`, então entrou como um `if` a mais no listener de `change` já existente (ao lado de
  `data-ranking-especie`).

  **✅ CORRIGIDO (28/09/2026) — segundo bug real, relatado de novo pelo usuário: "os itens equipáveis e
  consumíveis não estão funcionando, não consigo equipar".** Diferente do primeiro bug (saldo travado em ₽0):
  desta vez o saldo descontava certinho na compra, mas **o item nunca entrava no inventário** — confirmado
  reproduzindo o fluxo inteiro com jsdom (seleção do Hall → compra → checar `pokerpg-raide-v1`): depois de
  `arenaComprarSegurado('leftovers')`, o saldo caía mas `inventarioRaide()` continuava `{}`. Causa raiz:
  `evento.darItensDeRaide()` tinha uma lista própria, `IDS_DE_RAIDE = ['cristal-de-ruptura', 'selo-de-interrupcao',
  'escudo-astral']` — os TRÊS itens de raide originais, de ANTES da Loja de preparo existir — e rejeitava em
  silêncio qualquer id fora dela. Ninguém atualizou essa lista quando a Loja passou a comprar Potion, X Attack,
  Restos, Orbe da Vida etc. pela MESMA função: `arenaComprarComum`/`arenaComprarSegurado` chamavam
  `darItensDeRaide({[id]:1})` normalmente, a função rodava sem erro, só que o `if (IDS_DE_RAIDE.includes(k) ...)`
  descartava a entrada — sem exceção, sem aviso, o dinheiro simplesmente sumia. Isso também afetava o prêmio
  semanal da Arena (`arena.finalizar`) e o repasse da mochila da run pro Hall ao terminar uma jornada (`fim.js`
  linha ~40): qualquer um dos 14 itens de raide mais novos (além dos 3 originais) sofria o mesmo descarte.
  **Corrigido**: a validação interna virou `ITEMS[k]` (o id existe de verdade) em vez da lista de 3 — cada
  chamador já cura o que manda (as listas `CURA_ARENA`/`STATS_ARENA`/`ITENS_SEGURADOS` em `arena.js`, o filtro
  `ITEMS[k]?.raide` em `fim.js`/`arena.finalizar`), então não precisa de uma segunda whitelist redundante e
  desatualizável dentro da função. `IDS_DE_RAIDE` foi removida (não sobrava uso nenhum fora desta função).
  `tests/hall.test.js` reescrito pra travar exatamente este caso (`potion`/`leftovers`, fora dos 3 originais,
  precisam entrar).

  **✅ FEITO (28/09/2026) — `js/loja-conta.js`: Loja de preparo + Hall da Fama extraídos, compartilhados com o
  Multiplayer.** Junto do segundo bug acima, `arena.js` tinha a ÚNICA implementação de "comprar com o saldo da
  conta" e "reconstruir um Pokémon do Hall fora de uma run" — exatamente o tipo de duplicação que already causou
  o bug (duas listas de validação que podem desalinhar). Extraído pra `js/loja-conta.js` (tem rede —
  `loadPokemon`/`loadMove` — mas sem DOM, quem desenha continua sendo a tela): `comprarComumConta`/
  `comprarSeguradoConta` (a compra em si), `htmlLojaConta`/`htmlEquiparConta` (o HTML, genérico — quem chama passa
  os `data-act`/`data-*` de cada tela) e `reidratarHall` (a reconstrução do Pokémon). `arena.js` foi reescrito
  pra usar isso (mesmo comportamento, confirmado com o mesmo repro de jsdom do bug acima).

  **✅ FEITO (28/09/2026) — ☄ Sala de Raide: enfrentar o chefe da semana em grupo sem run nenhuma
  (`js/multiplayer.js`).** Pedido do usuário: "pra iniciar uma raide multiplayer eu preciso criar um save novo,
  isso não está certo" — verdade: `iniciarBatalhaMP` sempre exigiu `temRun()` pro modo co-op inteiro (`if
  (!temRun()) throw new Error('Co-op é jogar a run de alguém...')`), incluindo a luta do chefe da semana em
  grupo. Um TERCEIRO valor de `sala.config.modo` (além de `'coop'`/`'pvp'`): **`'raide'`** — nenhum jogador
  precisa de run, cada um leva de 1 a `MAX_TIME_HALL` (3) Pokémon do PRÓPRIO Hall da Fama (mesma fonte da Arena,
  `carreira.hallDaConta()`) e compra/equipa da PRÓPRIA Loja de preparo (`js/loja-conta.js`, acima) — tudo local,
  sem afetar os outros jogadores. **Seleção vira "foto" pela MESMA `fotoDoMon` de sempre**: `sala.hallSel`
  (seleção + equipamento, só meu) alimenta `atualizarHallMons()` (async — busca na PokéAPI via `reidratarHall`)
  que guarda o resultado em `sala.hallMons`; `minhasFotos()` ganhou um terceiro ramo (antes do `convidado`) que
  usa `sala.hallMons` quando `sala.config.modo === 'raide'` — o resto do jogo (montarLado, mp-motor, presença)
  nunca soube a diferença, porque uma "foto" de Hall é só mais uma foto. **"Pronto"**: `sala.pronto` (booleano,
  local) entra no payload de presença (`meuPayload().pronto`); `todosProntosParaRaide()` (`sala.membros.every(m
  => m.pronto && m.mons?.length)`) trava o botão "☄ Começar a Raide" do anfitrião — pedido explícito do usuário
  ("quando todos derem pronto, a Raid começa"). **Construção do chefe SEM run**: dentro de `iniciarBatalhaMP`,
  um `if (cfg.modo === 'raide')` que chama `eventoDaSemana(agoraDoEvento())` DIRETO (nada de
  `situacaoDoEvento({dificuldade, gen})`, que exige a run do anfitrião) e seta `tipo = 'evento'` — o resto do
  turno inteiro (ESPERTEZA.chefe, revive, itens de raide, clima fixo do chefe, cooldown de 8h por jogador) é
  **reaproveitado de graça**, porque tudo isso já era condicionado só a `sala.tipo === 'evento'`/`b.evento`, nunca
  a "tem run". **Resultado não mexe em run nenhuma**: `raideSemRun()` (`sala.config.modo === 'raide'`, sincronizado
  a todo mundo pela própria `sala.config` que já viaja no broadcast `'lobby'` — não precisou de um campo novo no
  estado da batalha) guarda `aplicarCoop` (desvia pra `aplicarRaideSemRun`, que nunca toca `G.S` e nunca é
  permadeath) e os pontos que liam `G.S.bag` durante a luta (`consumirRevives`, `consumirItensComuns`,
  `raideDisponiveis`, `itensComunsDisponiveis`, `podeReviver`, `gimmicksDisponiveisMP`, `centroNaSala`) — sem
  isso, um jogador que TAMBÉM tivesse uma run aberta enquanto jogava a Sala de Raide teria itens/gimmicks da
  RUN aplicados num Pokémon do HALL, ou a run debitada por engano. **Prêmio**: `aplicarRaideSemRun`/
  `premiarRaideSemRun` espelham exatamente `arena.finalizar` (mesma função `registrarVitoriaDeEvento` +
  `darItensDeRaide` da conta) — dinheiro/Rare Candy nunca saem daqui, só de dentro de uma run de verdade.
  **Simplificação assumida**: sem Mega/Tera/Z-Move/Gigantamax na Sala de Raide (mesma limitação da Arena — o
  motor do co-op fora de uma run não tem isso) e sem balancear/zona (Hall sempre no nível real, como a Arena).
  O caminho ANTIGO (co-op dentro da run do anfitrião, botão `☄ Chefe da semana` no modo Co-op) continua existindo
  do lado do modo `'raide'` na mesma lista — quem prefere lutar com o Pokémon da run de verdade (XP/dinheiro reais)
  ainda pode.

  **✅ FEITO (28/09/2026) — itens DURANTE a luta na Sala de Raide** (prioridade pedida pelo usuário logo depois
  da leva acima; antes só dava pra escolher/equipar no lobby). `minhaMochila()` (novo, único ponto de decisão) —
  `raideSemRun() ? inventarioRaide() : G.S.bag` — substitui os vários `if (!temRun()...)` espalhados;
  `raideDisponiveis`/`botoesRaide`, `itensComunsDisponiveis`/`botoesItemComum` e `podeReviver` leem daqui em vez
  de checar a run direto. **Revive na Raide usa `mp-motor.reviverCompanheiro`, não `reviverNoEvento`**: a regra de
  sempre (`registrarRevive`, host) exige o TIME INTEIRO caído; `reviverCompanheiro` (a mesma função que a Arena já
  usa) deixa reviver com o time ainda lutando, contanto que tenha pelo menos um de pé — por isso o botão
  `botoesReviver()` (extraído, usado nos TRÊS estados da tela: sem ninguém de pé, esperando os outros, e no seu
  turno normal) aparece bem mais cedo na Raide do que fora dela. **Aceita Max Revive**: o cliente manda
  `acao.pct` (100 se tiver Max Revive no inventário de conta, preferido sobre o normal — mesma prioridade da
  Arena); `reviverCompanheiro` ganhou `estado.revivesTipos[dono]` (lista, mesma ordem de `revivesUsados` — que é
  só um contador, não diferencia QUAL item) pra `consumirRevives` (cliente) saber exatamente qual dos dois
  descontar do inventário de conta a cada uso. `tests/evento-coop.test.js` trava o `revivesTipos`. **Sem mudança
  no motor de verdade**: `usarItemComumMP`/`usarRaideMP` continuam mandando a MESMA ação de sempre
  (`{tipo:'item'|'raide', ...}`) pro `mp-motor.resolverTurnoMP`/`usarRaideNoEvento` — eles nunca souberam de bag
  nenhuma, só o Pokémon; a única coisa que mudou foi QUAL mochila o CLIENTE lê pra mostrar o botão e descontar
  depois.

  **✅ FEITO (28/09/2026) — chat da sala.** Pedido do usuário ao descrever o fluxo completo da Sala de Raide do
  jeito que ele imaginava: criar a sala, chamar amigos/passar código, cada um escolher os 3 do Hall da Fama,
  comprar e equipar, **poder escrever num chat pra quem está na sala**, e só começar quando todos confirmarem
  "pronto". Investigado antes de mexer: tudo o resto da descrição **já existia** (convite por amigo/código,
  seleção do Hall com `MAX_TIME_HALL`=3, Loja de preparo, `todosProntosParaRaide()` travando o botão de começar)
  — só o chat faltava. Broadcast novo no MESMO canal da sala (`pokerpg-sala-<código>`, ao lado de
  `estado`/`acao`/`fim`/`lobby`/`sincronizar`): evento `'chat'`, payload `{de, nome, icone, texto, t}`, sem
  persistir em lugar nenhum — só `sala.mensagens` (memória, até 100 linhas, some ao sair da sala). Não é exclusivo
  da Raide: mora em `telaSala()`, então vale em QUALQUER modo (coop/pvp/raide) e em QUALQUER estado (lobby ou já
  lutando) — a mesma sala serve pra combinar estratégia no meio de um turno. **Cuidado que motivou ficar FORA de
  `#mp-topo`/`#mp-acoes`**: essas duas divs são recriadas inteiras (`innerHTML =`) por `renderSala()`, chamada a
  cada troca de presença e a cada pulso do anfitrião (`PULSO_MS`, ligado o tempo todo em luta) — se o campo de
  texto morasse ali dentro, digitar uma frase enquanto alguém entra na sala apagaria o que já foi escrito no meio
  da digitação. Por isso o chat ganhou sua própria seção em `telaSala()` (criada uma vez só) e `renderChat()` só
  escreve dentro de `#mp-chat-msgs`, nunca no campo de texto. `enviarChatMP()` lê e LIMPA `#mp-chat-input`
  direto (mesmo padrão de outros pontos do arquivo que já leem DOM sem passar por main.js, ex. `#mp-relogio`),
  soma a própria mensagem no `sala.mensagens` NA HORA (o broadcast do Supabase não devolve pro remetente,
  `broadcast:{self:false}` em `nuvem.canalSala`) e só then manda pra rede — sem isso quem escreve não veria a
  própria mensagem até alguém responder. Tecla Enter no campo funciona pelo MESMO padrão do resto do jogo
  (`main.js`, listener de `keydown` por `e.target.id`, igual `#mp-codigo`/`#q`/`#icone-busca`).

  **Usar item comum em batalha** (`arenaUsarItem`): ocupa a vez de quem usar, exatamente como no multiplayer —
  `botoesItemComum` filtra `inventarioRaide()` por `!SEM_BATALHA_MP.some(...)` (exportado de `multiplayer.js`
  pra não duplicar a lista) e `regras.itemTemEfeito`, e a escolha vira `{ref, tipo:'item', item:id}` — o MESMO
  formato de ação que `mp-motor.resolverTurnoMP` já processa (passo "0b" do motor, existia desde "Itens no
  multiplayer" abaixo); **nenhuma linha nova no motor foi precisa** pra isso funcionar na Arena. Depois do turno
  resolver, `resolverTurno()` desconta da Loja de preparo os ids que tinham `tipo:'item'` em `arena.escolhas`.

  **Reviver um caído** (`arenaReviver`, ação LIVRE — não ocupa a vez de ninguém): `mp-motor.reviverCompanheiro`
  é uma generalização de `reviverNoEvento` (o Revive de grupo do multiplayer) SEM a exigência de "o time inteiro
  caiu" — essa exigência nunca abriria na Arena, que só tem UM `dono` em `lados.A` (pra ele, "o time caiu" e
  "ele não tem mais ninguém de pé" são a MESMA condição, e a luta já teria terminado antes de dar chance de
  reviver). `reviverCompanheiro` é, na prática, a regra NORMAL de Revive de uma run de verdade (qualquer aliado
  caído, a qualquer momento, se você tem o item) — restaura paridade, não inventa poder novo; continua com o
  mesmo teto `MAX_REVIVES` (3) por luta. Ganhou um 4º parâmetro `pct` (50 = Revive, 100 = Max Revive — `arenaReviver`
  prefere Max Revive se tiver os dois em estoque). Testado em `tests/evento-coop.test.js` com um helper `timeSolo`
  novo (3 Pokémon do MESMO dono, diferente de `luta()` que modela multiplayer — 1 Pokémon por jogador).

---

## Habilidades: as 7 levas

- **Item 8 — habilidades**: seis levas feitas. A regra que vale: só entra habilidade com gancho FIEL —
  mapear no gancho errado deixaria a habilidade mais forte que o original, e a ficha promete "✓ ativa em batalha".
  A **4ª leva** (41 novas + 13 parciais completadas) criou ~24 ganchos, todos documentados no topo de
  `habilidades.js` e validados em `tests/habilidades.test.js` (a lista `ganchos` do teste precisa ganhar o nome de
  todo gancho novo; o teste também confere tipo/status/atributo/família de cada um). Onde mora cada um:
  `calcDamage`/`effStat`/`chanceAcerto` em `regras.js` (`danoTipo`, `danoTipoClima`, `golpesFamilia` — lista de nomes
  em `FAMILIAS_GOLPE`, porque a PokéAPI não marca soco/mordida/corte —, `recuo`, `superEfetivoCausado`,
  `critContraStatus`, `abaixoDeMetade`, `soStatus`, `ignoraEstagios`, `limitaStatus`) e `golpe.js` (`mudarEstagios`:
  `inverteEstagios`/`dobraEstagios`/`espelhaQueda`/`aoSerBaixado`; `executar`: `aoSerAtingido` via `reagirAoGolpe`
  — UMA reação por golpe, mesmo com vários acertos —, `aoNocautear`, `toque`, `contato` com `sorteio`/`estagio`/`po`;
  `usarGolpe`: `pressao`, `preguica` (`vol.folga`), `bloqueiaPrioridade`; `fimDeTurno`: `curaComVeneno`;
  `semDanoIndireto` é o helper `indireto(m)`, checado em todo dano que não vem de golpe direto).
  **`golpe.aoEntrarEmCampo(entrantes, oponentesDe, ctx)`** é a regra ÚNICA de entrada em campo (Intimidate com
  `imuneIntimidacao`/`intimidaSobe`, clima, terreno, `estagioAoEntrar`, Download `analisa`): `batalha.intimidar`
  (single player) e `mp-motor` (turno 1) só a chamam — antes o multiplayer não tinha Intimidate nem `estagioAoEntrar`.
  Ficaram de fora, documentadas no fim da tabela: Sticky Hold (nenhum golpe rouba item), Regenerator/Natural Cure
  (agem ao trocar), Beast Boost, Analytic, Mold Breaker & cia. **Cuidado ao editar a tabela**: o teste que detecta
  habilidade duplicada varre o bloco com uma regex — não escreva `nome: {` dentro de comentário da tabela.
  **5ª leva** (trabalho noturno autônomo, 27/09/2026 — ver `feedback_autorizacao_raspberry_pi`): 6 habilidades,
  6 ganchos novos (`multMaiorStatClima`, `multMaiorStatTerreno`, `prendeTipo`, `anticipa`, `sincroniza`,
  `flinchChance`), escolhidas por já terem hook DISPONÍVEL no motor de hoje (clima/terreno, `consegueFugir`,
  `aoEntrarEmCampo`, `aplicarStatus` com `fonte`, o cálculo de recuo em `executar`) — não abriram mecânica nova.
  **Protosynthesis/Quark Drive**: reforçam o MAIOR atributo BASE (empate: Atk>Def>SpA>SpD>Spe), ×1,3 ou ×1,5 se o
  maior for Velocidade (regra FIXA dos jogos — por isso o multiplicador não mora na tabela de habilidades, é
  `regras.multMaiorStat`, só o gatilho de clima/terreno mora lá). `regras.maiorStatBase(m)` lê `m.data.base`.
  **Simplificação assumida**: só o gatilho de clima("sol")/terreno(Elétrico) está aqui — Booster Energy (item que
  ativa a mesma coisa fora do clima/terreno certo) ainda não existe no jogo. **Magnet Pull**: `consegueFugir` ganhou
  o parâmetro `preso` (regras.js não sabe de habilidade — `batalha.js`/`mp-motor.js` resolvem `hab(inimigo).prendeTipo`
  e mandam o booleano pronto); Run Away segue ignorando até isso. **Anticipation**: só narra (sem stat/estágio
  nenhum) se algum oponente tiver golpe super efetivo, OHKO ou autodestrutivo — `golpe.aoEntrarEmCampo`, reaproveita
  `especial(g).ohko`/`autoDesmaio` e `typeEff`. **Synchronize**: `aplicarStatus` já recebia `fonte` (pra Salvaguarda);
  ao aplicar burn/paralysis/poison com sucesso, se há `fonte` viva sem status, devolve o MESMO status pra ela com uma
  chamada recursiva passando `fonte: null` — é isso que impede ida-e-volta infinita se os dois tiverem a habilidade.
  Sono/congelamento não sincronizam (fiel aos jogos). **Stench**: 10% de recuo extra em golpe de dano que ainda não
  tem `meta.flinch` própria (senão dobraria a chance à toa).
  **6ª leva** (28/09/2026): 3 habilidades — Sheer Force, Unnerve, Friend Guard —, mais trabalhosas que a 5ª
  (cada uma abriu um gancho/contrato novo, não só reaproveitou hook pronto). `regras.temSecundario(move)` decide
  se o golpe TEM efeito secundário nativo (estágio, status ou recuo por chance — olha `move.stats`/`move.meta`
  direto, sem saber de habilidade); **Sheer Force** usa ela pra bater ×1,3 em `calcDamage`, e `golpe.executar`
  guarda os TRÊS blocos que aplicam efeito secundário (estágio no golpe, status, flinch) com `!hu.sheerForce` —
  time bate mais forte, mas perde o efeito, exatamente como nos jogos. **Unnerve**: `golpe.comerFruta(m, ctx,
  travado)` ganhou um 3º parâmetro — `executar` manda `hu.unnerve`/`ht.unnerve` do lado de FORA na troca direta de
  golpe (`comerFruta(t, ctx, hu.unnerve)`, i.e. quem ataca trava a fruta de quem apanha). **Simplificação
  assumida**: só vale nessa troca direta (é onde os dois lados já estão em mãos, sem precisar de lista de lados) —
  o `comerFruta` chamado no FIM DE TURNO (`fimDeTurno`, pra cada Pokémon do campo) não checa Unnerve do oponente,
  porque esse call site não sabe "quem é o oponente de m" sem uma função de lado pronta. **Friend Guard**
  precisou de um contrato NOVO nos dois `ctx`: `aliadosDe(m)` (lista de aliados VIVOS de `m`, sem ele mesmo) —
  `efeitos.CTX.aliadosDe` (single player: seu lado é `ladoJogador()`, o do inimigo é só `[G.B.enemy]`, porque
  você só enfrenta um por vez) e o `ctx` que `mp-motor.resolverTurnoMP` monta (`vivosMP(s.lados[ladoDe(s,
  m.ref)])`). `golpe.executar` calcula o multiplicador ANTES do laço de acertos (`(ctx.aliadosDe?.(t) ||
  []).reduce(...)`, multiplicativo se houver mais de um aliado com a habilidade) e aplica em `dano` antes dos
  checks de Sturdy/Endure/Faixa de Foco — igual aos jogos, a redução conta pra decidir se aguenta ou não.
  `ctx.aliadosDe` é OPCIONAL (`?.`): um ctx de teste ou futuro que não implemente simplesmente não tem Friend
  Guard, em vez de quebrar. **Ficaram de fora** (mais complexas ainda, precisam de mais projeto): Mold Breaker
  (ignora habilidade do ALVO — precisaria auditar todo gancho de imunidade/defesa do motor pra saber quais
  "furar"), Damp (bloquear autodestruição do OUTRO lado — cross-side igual Friend Guard, mas em cima de uma
  mecânica, autoDesmaio, que ainda não devolve controle pro motor decidir "deixar acontecer ou não"). (Aftermath
  ganhou o gancho "ao desmaiar por contato" que faltava aqui na 7ª leva, abaixo.)
  **7ª leva** (28/09/2026, pedido do usuário: "coloque todas as habilidades pokémons que ainda não estão
  configuradas") — a maior leva até aqui: 43 habilidades novas (165→208 de 314 reais; a contagem "307" das notas
  antigas estava errada, a certa é `abilities.csv` filtrado por `is_main_series`). Pesquisado direto do CSV-fonte
  da PokéAPI (o mesmo usado pelas flags de golpe) pra achar TODA habilidade real que faltava, sem depender do
  `docs/auditoria-batalha.md` (confirmado de novo: desatualizado). Ganchos novos (documentados no topo de
  `habilidades.js`): `multFlag`/`resisteFlag` (dano por FLAG do golpe — Tough Claws, Mega Launcher, Punk Rock),
  `converteTipo` (Aerilate/Pixilate/Refrigerate/Galvanize/Normalize, `regras.golpeDaConversaoDeTipo` — roda ANTES
  do Tera/Battle Bond em `executar`, senão Weather Ball sem clima ficaria Normal em vez de virar o tipo
  convertido), `evasaoConfuso` (Tangled Feet), `acaoRapida`/`sempreLento` (Quick Draw/Stall, a MESMA fila de
  prioridade da Garra Rápida — `regras.ordenarAcoes` ganhou o degrau `lento`, sempre por último dentro da própria
  prioridade), `prankster`/`prioridadeVoador`/`prioridadeCura` (`regras.prioridadeEfetiva`, soma com a prioridade
  nativa do golpe), `prendeQualquer` (Shadow Tag/Arena Trap, resolvido em batalha.js/mp-motor ao lado do Magnet
  Pull que já existia), `semContato` (Long Reach: `encostou = fazContato(g) && !hu.semContato`, variável nova que
  substituiu as 4 chamadas cruas de `fazContato(g)` no meio do golpe — Elmo Rochoso, o bloco de contato inteiro e
  Poison Touch), `aliadoBoost` (Battery/Power Spot/Steely Spirit/Plus-Minus, reforça o golpe de um ALIADO —
  mesmo padrão do Friend Guard só que multiplicando em vez de cortar), `aoNocautearMaior` (Beast Boost, usa
  `regras.maiorStatBase` em vez de um atributo fixo), `aftermath`/`aoDesmaiarDanoAtacante` (Aftermath só com
  contato, Innards Out com qualquer nocaute — os dois usam `hpAntesDoGolpe`, o HP do alvo capturado ANTES do
  laço de acertos, pra saber quanto ele tinha ao cair), `dreno:'inverte'` (Liquid Ooze inverte o bloco de
  `meta.drain`), `roubaItem`/`protegeItem` (Pickpocket só contato, Magician qualquer golpe de dano, Sticky Hold
  bloqueia os dois), `imuneGolpeStatus` (Good As Gold, checado ANTES de despachar pra `golpeDeStatus`),
  `podeEnvenenarQualquer` (Corrosion ignora a imunidade de TIPO ao veneno em `aplicarStatus`, mas não a de
  habilidade — Immunity continua protegendo), `protegeAliadoStatus` (Flower Veil, novo helper
  `protegidoPorFlores(m, ctx)` — Grama no lado de quem tem a habilidade, ela mesma incluída, não perde atributo
  nem pega status de fora, em `mudarEstagios` E `aplicarStatus`), `copiaHabilidadeAoEntrar` (Trace, em
  `aoEntrarEmCampo`), `avisaGolpeForte`/`revelaItem` (Forewarn/Frisk, só narração), `moody` (em `fimDeTurno`;
  sorteia o atributo que SOBE, tira ele da lista e só então sorteia o que DESCE — nunca sorteia de novo até dar
  diferente, que travaria pra sempre com `Math.random` mockado num valor fixo, como em teste), `ripen`/
  `curaBerryExtra` (Ripen dobra a cura, Cheek Pouch cura extra com QUALQUER fruta — os dois em `comerFruta`),
  `semItemEmBatalha` (Klutz: `segurados.seg(m)` — o ÚNICO ponto por onde toda leitura de item passa — devolve
  `{}` inteiro quando a habilidade está ligada, então nenhum gancho de item precisou saber de Klutz),
  `algodaoCai` (Cotton Down), `trocaHabilidadeContato` (Mummy/Lingering Aroma = contágio, a sua vira a de quem
  encostou; Wandering Spirit = TROCA as duas). **Trace e a troca/contágio de habilidade compartilham o mesmo
  desfazer** (`golpe.desfazerTrace`, chamado em `batalha.endBattle` pra TODO o lado do jogador — sem isso a
  habilidade roubada/copiada ficava pra sempre no save) e a MESMA trava (`ABILIDADE_TRAVADA`, hoje só
  `stance-change`): nem Trace copia Mudança de Postura de um Aegislash oponente, nem Mummy consegue apagar a
  Mudança de Postura de um Aegislash que ataca — ela é a única habilidade da tabela que mexe com mecânica PRÓPRIA
  do motor (a troca de forma), então é a única que precisa dessa proteção; qualquer outra habilidade copiada sem
  gancho aqui simplesmente não faz nada, sem risco. No multiplayer `m.ability` muda só na CÓPIA de rede
  (`fotoDoMon`), descartada no fim da luta — só o single player precisa desfazer. **Ficou de fora, com razão
  anotada em `habilidades.js`**: Regenerator/Natural Cure (agem ao TROCAR de Pokémon, que você nunca faz), Mold
  Breaker & cia. (furar a habilidade do alvo em TODO cálculo do motor), Stakeout/Dancer (pedem um estado de turno
  — "acabou de entrar", "outro usou golpe de dança" — que o motor não rastreia), Neutralizing Gas (suprimiria
  TODO mundo em campo, invasivo demais), as formas dinâmicas de espécie única (Ice Face, Gulp Missile, Schooling,
  Shields Down, Hunger Switch, Zen Mode, Power Construct, Comatose, Disguise), Screen Cleaner e Mimicry (ficaram
  pra uma leva futura, sem gancho novo hoje) e Gorilla Tactics (a trava de golpe único hoje só olha item,
  `seg(m).choice`, em TRÊS telas — render.js, arena.js, multiplayer.js —, e mexer nas três sem poder testar
  visualmente numa sessão sem navegador era risco alto demais pra esta leva).
- ✅ FEITO (28/09/2026) — **"Flags" de golpe** (Contato, Som, Projétil/Bola e mais). A PokéAPI pública
  (`pokeapi.co/api/v2`) não expõe isso, mas o repositório-fonte que a GERA tem, em CSV puro sem chave nenhuma:
  `move_flags.csv` (21 flags), `move_flag_map.csv` (golpe → flag, por id) e `moves.csv` (id → nome kebab-case,
  o mesmo já usado em `regras.FAMILIAS_GOLPE` e em todo golpe do jogo). `ferramentas/gerar-golpe-flags.mjs` (Node,
  roda no Raspberry Pi) baixa os três e gera `js/dados-golpe-flags.js`: `GOLPE_FLAGS` (748 golpes mapeados) +
  `FLAGS_VALIDAS` (as 21, pra validar typo em `imuneFlag` novo — ver abaixo). **Sharpness/"cortante" continua
  fora** (é flag da Gen 9, mais nova que esse dado-fonte) — `FAMILIAS_GOLPE.corte` segue sendo a única fonte pra
  corte. **Gen 9 tem buraco no dado-fonte**: `torch-song`/`alluring-voice`/`psychic-noise` (sonoros nos jogos de
  verdade) EXISTEM em `moves.csv` mas não têm nenhuma flag em `move_flag_map.csv` — o gerador não inventa, então
  esses golpes ficam sem a flag `sound` até o repositório-fonte atualizar (Soundproof não os bloqueia).
  **Ganho 1 — corrigido o proxy de contato**: `regras.fazContato(move)` usa a flag `contact` de verdade quando o
  golpe está mapeado (Earthquake é físico e NÃO faz contato — o proxy antigo, `move.cls === 'physical'`, errava
  esse caso) e só cai pro proxy antigo se o golpe não estiver na tabela (plano B, nunca "sem contato" à toa).
  Trocado nos 4 pontos de `golpe.js` que liam `g.cls === 'physical'` como "fez contato": a barreira que pune
  contato (King's Shield e cia.), o Elmo Rochoso, o bloco de Static/Rough Skin/Effect Spore/Gooey/Iron Barbs e o
  Poison Touch. **Ganho 2 — duas habilidades novas**: `soundproof: { imuneFlag: 'sound' }` e
  `bulletproof: { imuneFlag: 'ballistics' }` (`habilidades.js`) + o gancho `imuneFlag` em `golpe.executar` —
  checado ANTES até do golpe de status (diferente de `imuneTipo`, que só vale pra dano): Soundproof bloqueia
  Growl tanto quanto Hyper Voice, porque a imunidade é da FLAG, não de ser golpe de dano. **Não mexido**: a
  generalização do pólen (`contato.po`/`imunePo`, hoje hardcoded pra Overcoat/Grama) — ficou de fora desta leva
  por escolha (`AskUserQuestion`: o usuário pediu dados + contato + as duas habilidades novas, não a
  generalização do pólen). `tests/regras.test.js` (cobertura da tabela, `temFlag`, `fazContato` com casos reais)
  e `tests/habilidades.test.js` (Soundproof/Bulletproof em batalha, `imuneFlag` validado contra `FLAGS_VALIDAS`).
  **Dois testes existentes precisaram de ajuste**: "Rough Skin"/"Poison Touch" simulavam golpe especial fazendo
  `golpe({ cls: 'special' })` em cima do Tackle padrão (nome continuava "tackle", só a classe mudava) — com a
  flag de verdade, Tackle tem `contact` INDEPENDENTE da classe simulada no teste, e os dois passaram a "encostar"
  de novo; trocado pra `golpe({ name: 'ember', cls: 'special' })`, um golpe especial de verdade sem a flag.

---

## Gimmicks: Mega, Tera, Z-Move, Gigantamax

### 2. ✅ FEITO — Cada Gen é uma jornada
Implementado em atalha.vencerGen (a pergunta), 
egras.pontuacao + multContinuacao (a penalidade) e supabase/migrations/ (o servidor recalcula e RECUSA a jornada se a conta não bater — mudou num lado, muda no outro; 	ests/schema.test.js trava isso). S.continuacoes conta quantas vezes a jornada seguiu; estatisticasDaJornada leva isso e campeaoDe pro resumo. A tela de fim já propõe o mapa seguinte (G.gen).

#### O desenho acordado era:
Hoje, fora do Roguelike, vencer os lendários deixa **seguir com o mesmo Pokémon** pro mapa seguinte, com os níveis escalados (foi assim que um testador chegou a Hoenn começando no nível 90). Passa a ser:
- **Padrão**: fechar a Gen **encerra e pontua a jornada**; o Pokémon **se aposenta** (fica registrado na carreira como campeão daquela Gen) e você começa uma **jornada nova** no mapa seguinte, escolhendo outro Pokémon, **no nível 5 e com o mapa nos níveis normais** (2–62). Nada de mochila, dinheiro ou aliados atravessa.
- **Alternativa** (a de hoje): seguir com o mesmo Pokémon em nível alto, oferecida ali no fim e valendo **menos pontos no ranking**.

### 3. ✅ FEITO — Badges com vantagem permanente
Implementado em `js/badges.js` (56 badges numa tabela única, puro, `tests/badges.test.js` — contagem conferida em 01/10/2026: Tipos 18, Eventos 16, Caçada 4, Coleção/Laços/Parceiros/Coragem/Rayquaza 3 cada, Gimmicks 2, Maestria 1) e ligado na criação
(`criacao.renderVantagens`, `vantagensDe`) e na tela 🏅 Conquistas. Cada badge é medida do **progresso
permanente** (nunca do histórico, que o jogador pode apagar — `contextoBadges` monta o `ctx` a partir de
`progresso-conta.js`) e paga uma vantagem na PRÓXIMA jornada: itens (empilham) e/ou dinheiro inicial (soma),
aplicados em `criacao.iniciarJornada` (`money: 500 + v.dinheiro`). **Interruptor na criação** (`G.semVantagens`)
deixa jogar sem elas por `regras.BONUS_SEM_VANTAGENS` (+10%) na pontuação final (`pontuacao()`, e o mesmo peso
no SQL — mudou aqui, muda em `supabase/migrations/`). **Rayquaza são DUAS badges separadas**, como pedido
explicitamente pra não bugar: `rayquaza-shiny` (recrutar um shiny) e `rayquaza-mega` (1.000 golpes finais sendo
ele) contam sozinhas, em qualquer ordem; uma terceira (`rayquaza-lenda`) só fecha quando as duas estão prontas
e é a única que dá o prêmio grande (loja de graça pra sempre, `S.lojaGratis` em `regras.precoItem`).

**🧬 Potencial máximo (01/10/2026) — IVs perfeitos, e o botão do admin.** Pedido do usuário: um botão pra a conta
admin sempre nascer com IVs 31, e **a mesma coisa liberável por qualquer jogador** através de uma conquista "bem
complexa". Virou **uma badge** (`ivs-perfeitos`, grupo Maestria) em vez de uma conquista de `conquistas.js` ou de um
interruptor de admin, por três razões: badge já é o canal de "vantagem na PRÓXIMA jornada", já é medida do progresso
permanente, e já é desligada pelo `G.semVantagens` — e esse último ponto é o que importa de verdade, porque IVs
perfeitos **somados** ao bônus de +10% de "jogar sem vantagens" seria o melhor dos dois mundos no ranking. É a
segunda badge na história do arquivo a pagar uma REGRA em vez de item/dinheiro (a primeira foi a loja grátis do
Rayquaza), e o comentário no topo de `badges.js` sobre "vantagens de regra ficam pra depois" vale menos do que o
pedido explícito.

A medida é **1.000.000 de dano causado pelos SEUS golpes** somando a carreira inteira (`ALVOS.dano`). O contador
(`conquistas.registrarDano`) mora **dentro de `S.registro.abates`**, como um número solto ao lado de `total`, e isso
é de propósito: `estatisticasDaJornada` copia `abates` inteiro pra carreira, então o campo sobrevive ao fim da
jornada **sem precisar entrar em lista branca nova** — foi exatamente o que derrubou `abates` e `shiniesAmigos`
quando nasceram. As duas listas brancas que ele PRECISOU atravessar são as de `progresso-conta.js` (`bancar` e
`totaisDe`), que enumeram campo por campo.

Onde conta: `batalha.turn`, no único ponto que já tinha o HP do inimigo antes e depois de um golpe seu
(`hpAntes - E.hp`, a mesma linha que decide `B.abate`). Então **dano do aliado não entra** (mesma regra do golpe
final), nem veneno, armadilha ou recuo, nem o modo Fácil (`MODO_NAO_CONTA`), e inimigo curado no meio do turno não
vira dano negativo (`!(d > 0)`). Aplicado em `criacao.iniciarJornada` via `makeMon(..., { ivs: IVS_MAX })`
(`pokemon.IVS_MAX`, congelado e compartilhado — nada no jogo escreve em `mon.ivs` depois de criado).

**O botão do admin não é um atalho paralelo**: `dev.liberarIvsPerfeitos` só põe o contador de dano no alvo dentro da
entrada `__teste__` do livro-caixa, igual ao que `liberarMegas` faz com a Pedra Mega. Assim o botão testa o caminho
de verdade e 🧹 Limpar devolve a conta ao estado real. **Ficou de fora**: aliados recrutados continuam com IVs
sorteados (a badge é sobre o Pokémon que VOCÊ é), e as outras 6 construções de "IV 31" espalhadas por
`batalha.js`/`arena.js`/`multiplayer.js` não foram trocadas por `IVS_MAX` — é código que funciona, e a dedução
valeria um diff maior do que o ganho.

**Pratos do Arceus (28/09/2026) — revisão do item por tipo.** As 18 badges "Especialista em X" (`ALVO_TIPO` =
1.000 abates daquele tipo, mesmo número do Mega/Vínculo) davam originalmente uma pedra de evolução (quando o
tipo tinha uma) ou o petisco de afinidade (quando não tinha) — pedido do usuário pra trocar: pedra de evolução é
vantagem fraca pra quem já escolheu o Pokémon, e petisco de afinidade é item de CAPTURA, não faz sentido como
prêmio de vantagem em batalha. Viraram os **18 Pratos do Arceus + Lenço de Seda** (`dados.ITENS_VANTAGEM_TIPO` +
`dados.PLACA_DO_TIPO`, item real dos jogos nunca implementado aqui antes): cada um dá **+20% de dano nos golpes
daquele tipo** enquanto segurado, reaproveitando o gancho `danoTipo` que já existia (`segurados.js`, criado pro
Núcleo Eternamax) — gerado direto de `PLACA_DO_TIPO` num `Object.fromEntries`, então nunca desalinha qual prato é
de qual tipo. **Normal é a única exceção real**: nos jogos o Arceus não tem Prato Normal (a forma base dele já É
Normal, sem prato nenhum equipado), então usa o Lenço de Seda. `badges.premioDoTipo` só lê `PLACA_DO_TIPO[t]`
agora — as tabelas antigas `PEDRA_DO_TIPO`/`PETISCO_DO_TIPO` saíram. Sem `price`: só vêm da badge, não se compram.

**Backlog anotado (28/09/2026): Arceus deveria ser um chefe de raide** — ver "Próximos passos combinados" acima.

### 4. ✅ FEITO — Mega Evolução
Tabela gerada em `js/dados-megas.js` (95 formas, 89 espécies — `ferramentas/gerar-megas.ps1`; 6 espécies têm 2 formas: Charizard e Mewtwo X/Y, e as Mega Z de Absol, Garchomp, Lucario e Raichu. O texto antigo dizia "96 formas, 93 espécies" e contradizia o "89 Megas" mais abaixo neste arquivo — conferido rodando em 29/09/2026), mecânica em `js/mega.js`.
Decisões fechadas com o usuário: **só o jogador** megaevolui (aliado nunca); **uma por batalha** e **não gasta o turno**;
**Alfa, lendários e treinadores** também megaevoluem, ao cair a **metade do HP** (`HP_MEGA_INIMIGO`); **Primal**
(Groudon/Kyogre) entra na mesma mecânica com outro nome. As formas são PRÉ-CARREGADAS em `iniciar()` — buscar no meio
do turno é o que a Mudança de Postura do Aegislash evitou. `desfazerMega` roda pra toda a equipe em `endBattle`:
sem isso o Pokémon fica Mega pra sempre, porque `M.data` vai junto no save. `megasDoJogador()` mora em `mega.js`
(não em `batalha.js`) porque `render.js` também precisa dela e não pode importar `batalha.js` — daria ciclo.

### 5. ✅ FEITO — Terastalização
`js/tera.js` (gatilho) + `regras.tiposDefensivos`/`regras.multStab` (a conta, pura e testada). A conquista é por
TIPO, não por espécie: você escolhe na hora entre os tipos já liberados. Mesma economia da Mega — uma por batalha,
não gasta o turno, desfaz em `endBattle`. Diferente da Mega, **não troca `M.data`**: guarda só `M.tera`, e quem lê
são as regras — por isso desfazer é uma linha. `render.badgesDeTipo` mostra o tipo Tera no lugar dos originais
(mostrar os antigos faria a pessoa calcular a fraqueza errada). O inimigo terastaliza (Alfa/lendário/treinador, tipo sorteado) — ver "Gimmicks do inimigo e do co-op".

### 7. ✅ FEITO — Gigantamax
`js/dynamax.js` + `regras.poderMax`/`MULT_HP_DYNAMAX`/`TURNOS_DYNAMAX`. **Única gimmick sem item** (25 jornadas já
é o preço). Dobra o teto de HP e o HP atual por 3 turnos; `passarDynamax` roda na virada da rodada e
`desfazerDynamax` também em `endBattle` — sem isso o teto dobrado ia junto no save, pra sempre. A volta guarda
`hpMaxAntes` e reaplica a PROPORÇÃO: recalcular pela base perderia o dano sofrido enquanto gigante. Tabela do Max
mais modesta que a do Z de propósito (o Z é um tiro; o Max vale 3 turnos). **Inimigo gigantamaxa só se for de
TREINADOR** (`dynamax.inimigoPodeGmax` — o "treinador" dos Lendários da rota final, Alfa, evento e selvagem não; ver
"Gimmicks do inimigo e do co-op" abaixo). **Bug real corrigido**: `carreira.conquistasDaConta` passava `runs: {}`, então
`podeGigantamax` dava `false` pra qualquer espécie e o botão 🔴 nunca aparecia numa batalha (só a tela de Conquistas lia
`runsDeNivelDe`). Hoje `conquistasDoProgresso(jornadas, registroAtual, progresso)` (pura, em `carreira.js`) é a fonte única.

### 6. ✅ FEITO — Z-Move
`js/zmove.js` (elegibilidade) + `regras.poderZ` (a conversão, pura e testada, aplicada em `calcDamage` quando
`vol.zAtivo`). **Não é transformação: É o turno** — `usarZ` termina chamando `turn({..., z:true})`, o flag é ligado
ali e apagado no `finally` do mesmo turno (um Z que vazasse dobraria dano de graça). Precisa do **Cristal Z**
segurado (₽12.000, preço do usuário); a loja o mostra via `temZConquistado`, que **não depende de batalha** — a
primeira versão usava `zDisponiveis` e o cristal nunca aparecia à venda, porque loja é fora de combate.
Inimigo **terastaliza** igual à Mega (Alfa/lendário/treinador, metade do HP), mas só **uma virada por luta**:
quem megaevoluiu não terastaliza também.

### Gimmicks do inimigo e do co-op (25/09/2026)
Decisões do usuário. **Inimigo** (`batalha.js`): só Pokémon de **treinador** gigantamaxa (`gmaxDoInimigo`, mesmo gatilho
`HP_MEGA_INIMIGO`); só **treinador e Alfa** usam **Z** (`zmove.inimigoTemZ` sorteia UMA vez em `iniciar` → `B.zInimigo`:
treinador sempre, Alfa `CHANCE_Z_ALFA`=20%; `inimigoUsaZAgora` decide por turno, `CHANCE_Z_TURNO`=35%, uma vez por luta,
só golpe de dano; a marca `E.vol.zAtivo` é apagada no `finally` logo depois do golpe). **Uma virada por luta**
(`jaViradou(B)`: Mega, Tera OU Gigantamax); quem não tem Mega sorteia Tera×Gigantamax (`viradaSorteada`, guardado em
`B.viradaInimigo` — só treinador tem os dois; o resto é sempre Tera). `passarDynamax(E)` roda no fim da rodada junto do
lado do jogador. **Bug real corrigido**: `megaDoInimigo` marcava `megaInimigoUsada` quando o inimigo (nível ≥ 40) não
tinha forma Mega, o que bloqueava o Tera de quase todo mundo; agora só marca quando megaevolui de fato.
**Co-op** (`mp-motor.js` + `multiplayer.js`): a ação de golpe leva `gimmicks: [{tipo:'mega', forma, id, name, types, base,
sprite, back, ability} | {tipo:'tera', valor} | {tipo:'gmax'} | {tipo:'z'}]`. A tela de quem joga confere conquista +
item (Pedra Mega/Cristal Z) da PRÓPRIA conta (`gimmicksDisponiveisMP`); o anfitrião confia no que chega e o motor puro só
aplica as regras da luta (`aplicarGimmicksMP`): só o PRINCIPAL (`slot 0`) de quem tem run (não convidado, não aliado), não
PvP, uma de cada por luta e por jogador em `estado.gimmicksUsados[dono]`. Mega, Tera e Gigantamax entram antes dos golpes
(não gastam o turno); Z marca o golpe do turno (`zRefs`). A Mega manda os dados da forma na ação (o motor não tem rede) —
`mega.aplicarForma(M, forma, data, habilidade?)` é a troca pura, usada por `megaevoluir` e pelo motor; a espécie
(`data.speciesName`) NÃO muda, é por ela que o resultado volta pra run. As fotos são descartadas no fim, então nada disso
persiste na run (o resultado volta por FRAÇÃO de HP). O Alfa do co-op pode carregar Z (`opcoes.alfa` → `estado.zIA`,
`zIAUsado`); Mega/Tera de Alfa no co-op **não existem** (só single player). UI: `alternarGimmickMP` (liga/desliga em
`sala.gimmicksSel`, resetado a cada turno), com o Z ligado só os golpes elegíveis ficam clicáveis. `aplicarCoop` agora chama
`registrarAbate({porMim:false})` por derrotado (espécie + total; Tera/Z pedem golpe final seu e ficam só no single player).
**Auditoria das conquistas da Mega** (`tests/gimmicks-coop-inimigo.test.js`): toda espécie de `MEGAS` libera com 1.000 abates,
não com 999, e habilita a forma com a pedra (Rayquaza: Dragon Ascent). Lacuna conhecida: as formas **Mega Z** (Absol,
Garchomp, Lucario) — RESOLVIDA: o gerador agora casa `-mega-z` também (Absol, Garchomp e Lucario têm 2 formas: comum + Z).
**Tera e Gigantamax do inimigo só de nível 30+** (`mega.NIVEL_TERA_GMAX_INIMIGO`/`inimigoTeraGmaxLiberado`, nível do INIMIGO = o da rota);
a Mega dele segue com o piso próprio de 40.
**Carteira** (`render.atualizarCarteira`): `#top-dinheiro` é uma pílula 💰 fora do menu ☰ com `+₽/−₽` (`.dinheiro-delta`, some por
animação; elemento vazio = tela anterior limpou o topo → sem delta falso), `.carteira-mini` dentro do `turnoBar` (a parte que não rola na
batalha do celular) e `.carteira-loja` no topo da loja.
**Imagens nos relatos** (`imagens-relato.js` puro + `relatos.js` + `nuvem.enviarRelato(relato, imagens)`): máx. 2 imagens, 2 MB cada (`MAX_IMAGENS`,
`MAX_BYTES_IMAGEM`, igual ao `file_size_limit` do bucket privado `relatos-imagens` na migração `20260925160000_relatos_imagens.sql`); o navegador
comprime (lado maior 1600 px, JPEG 85%) antes de subir; a linha do relato guarda só os caminhos em `relatos.imagens` — o campo SÓ entra no insert
quando há imagem (relato sem imagem funciona sem a migração). Offline: as imagens vão pra fila em data URL se couberem (`MAX_BYTES_FILA` 1,5 MB),
senão o relato segue sem elas e a tela avisa (`semImagens`). Fila: campos `imagensFila`/`semImagens` são só dela e saem antes do insert.

### Pedra Mega, rastreio de conquista e cenário (24/09/2026)
- **Pedra Mega** (`dados.ITEM_PEDRA_MEGA`, ₽15.000 — preço escolhido pelo usuário): conquistar a Mega libera a
  COMPRA da pedra, não a Mega. É item segurado; a loja só a mostra se a espécie do jogador tem a Mega conquistada
  (`soComMega`). **Rayquaza não usa pedra** — precisa saber `dragon-ascent`. O lado inimigo passa `ignorarPedra`
  (Alfa não tem inventário). Quando falta a pedra, a tela DIZ o que falta em vez de esconder o botão.
- **`js/rastreio.js`**: fixar UMA conquista de conta por jornada (`G.S.rastreada`), com HUD no painel de Missões
  e recompensa paga NA RUN (`G.S.rastreadaPaga` evita pagar duas vezes). A checagem mora em `verificarMissoes`
  porque é o único ponto que roda depois de todo turno e de todo item.
- **`js/cenario.js`**: clima da cena de batalha deduzido do TEXTO da rota (nome+descrição) contra uma lista de
  palavras, com `z.tema` tendo prioridade. Sem tabela por rota, então rota nova entra sozinha. Puro e testado —
  o teste falha se tudo cair no `padrao`, que é como essa lista morreria em silêncio.


---

## Itens no multiplayer, reordenar golpes e Vínculo de Batalha

### Itens no multiplayer (28/09/2026)
Pedido do usuário: itens segurados e itens comuns (mochila) precisam funcionar na Raide (e no resto do
multiplayer). Duas partes bem diferentes:

**Itens segurados (passivos)**: a causa raiz era simples — `mp-motor.fotoDoMon` nunca incluía `item`, e
`segurados.seg(m) = SEGURADOS[m?.item] || {}` lê exatamente esse campo. Como `golpe.js`/`regras.js` SÃO o motor
único (single player e multiplayer chamam as MESMAS `usarGolpe`/`calcDamage`/`effStat`/`fimDeTurno`), bastou
acrescentar `item: M.item || null` em `fotoDoMon` — **nenhuma linha nova de dano/cura precisou ser escrita**.
Restos, Orbe da Vida, Faixa de Foco, Sino-Concha, Elmo Rochoso e o Vínculo de Batalha (Ash-Greninja, que também só
lia `m.item` no motor único) passaram a funcionar de graça. Testado direto (`tests/mp-motor.test.js`): Orbe da
Vida bate mais forte E cobra HP, Restos cura no fim do turno, tudo via `resolverTurnoMP` de verdade.
**Item que se GASTA** (`aguentaCheio`, Faixa de Foco) muta só a cópia de rede (`fotoDoMon`), não `G.S.player`
diretamente — por isso `finalizar()`/`aplicarCoop` agora sincronizam `item` de volta pra run igual já faziam com
HP/status/PP (`final[...].item`, `M.item = f.item`), senão o jogador ganharia uma Faixa de Foco de graça a cada
luta de sala. **Arena (Hall da Fama) resolvido de outro jeito (28/09/2026)**: o Hall continua sem guardar o item que o Pokémon
segurava ao se aposentar (`hall.js` sem esse campo), mas não precisou — a Loja de preparo da Arena (ver acima)
tem sua PRÓPRIA "mochila" de conta, e o jogador ESCOLHE o que equipar em cada Pokémon do time a cada tentativa
(`arena.equipamento`), independente do que ele carregava na run original.
**PvP não sincroniza nada de volta** (nunca sincronizou HP/PP também), então não tem risco de duplicar item ali.

**Itens comuns (Potion, X Attack, curas de status, Éter...)**: MUITO diferente de item segurado — é uma ESCOLHA DE
TURNO (ocupa a vez, como golpe/fugir), não um efeito passivo. Nova ação `{tipo:'item', ref, item}` em
`mp-motor.resolverTurnoMP` (passo "0b", antes dos golpes — mesma prioridade dos jogos): `aplicarItemComum`
replica heal/healPct/cure/ether/stage do `itens.useItem` do single player, mas SEMPRE no próprio Pokémon que usou
(sem "usar em qual aliado?" — cada jogador só vê a PRÓPRIA mochila numa sala, então perguntar não faria sentido).
`itemTemEfeito`/`heal`/`mudarEstagios` são as MESMAS regras/motor de sempre. Fica registrado em
`estado.itensUsados[dono]` (lista que só cresce) pro cliente descontar da mochila depois — mesmo padrão de
`revivesUsados`/`raideUsados`, só que como o Revive/raide já usam um contador por tipo e este é lista simples
(pode repetir o mesmo item várias vezes), `multiplayer.consumirItensComuns` usa o TAMANHO da lista já visto
(`itensComunsConsumidos`) em vez de comparar por tipo. **Diferente de Revive/raide, item comum vale em QUALQUER
luta de sala** (explorar junto, Alfa, chefe da semana) — não é exclusivo do evento, então não checa `b.evento`.
Cliente manda a ação como QUALQUER escolha de turno (`escolher()`, não `registrarAcao` direto de ação livre) —
`multiplayer.usarItemComumMP`/`itensComunsDisponiveis` (filtra por `SEM_BATALHA_MP`: as categorias que já têm
caminho próprio ou não fazem sentido em batalha). UI: `botoesItemComum()`, um `<details>` recolhível (pode ter
bem mais que os 3 itens de raide) ao lado dos botões de raide.


### Reordenar golpes (28/09/2026)
Pedido do usuário: mudar a ordem dos golpes na lista, sem gastar turno, tanto na run quanto na Raide.
`regras.moverGolpe(moves, i, dir)` é a única regra (pura, testada): troca a posição `i` com a vizinha `i+dir`,
devolve um array NOVO (não muta) — o PP usado mora dentro de cada objeto de golpe (`ppLeft`), então viaja junto
com o golpe na troca, sem lógica extra. Três UIs diferentes chamam ela:
- **Single player**: botões ▲▼ dentro de `render.listaGolpes(M, quem)` (ficha, `data-act="golpe-mover"` +
  `data-quem`/`data-v`/`data-dir` em main.js) — como a ficha usa o MESMO array `M.moves` que a tela de batalha
  (`renderActions`) lê pra montar os botões de ataque, reordenar na ficha já reordena os botões de ataque também,
  sem precisar duplicar UI lá. Os botões ficam DENTRO do `<summary>` do golpe (junto do nome) — clicar neles
  também abriria/fecharia o `<details>` (é o comportamento nativo do navegador pra qualquer clique no summary);
  `onclick="event.preventDefault()"` no botão evita isso SEM `stopPropagation()` (o clique precisa continuar
  borbulhando até o listener delegado em main.js, senão o `data-act` nunca dispara).
- **Arena** (`arena.arenaGolpeMover`): local, muta direto `proximoSemEscolha().moves` e re-renderiza — a Arena não
  tem rede, é só o motor local.
- **Multiplayer** (`multiplayer.moverGolpeMP`): **não pode ser só local** — o estado da batalha é autoritativo do
  anfitrião (`sala.batalha`), e a escolha de golpe manda um ÍNDICE (`{tipo:'golpe', golpe: i}`); se cada cliente
  reordenasse só a PRÓPRIA cópia, o índice enviado depois bateria num golpe ERRADO na cópia do anfitrião (que não
  reordenou). Por isso `golpe-mover` é uma "ação livre" como Revive/item de raide (`registrarGolpeMover` em
  `registrarAcao`, mesmo padrão de `registrarRevive`/`registrarRaide`): o ANFITRIÃO muta o Pokémon canônico e
  reenvia o estado (`publicarEstado`), pra todo mundo ver a MESMA ordem antes de escolher. Guardado contra
  `sala.resolvendo` como os outros dois.
- Em Arena e Multiplayer, `.mv` (botão de atacar) não pode ficar DENTRO de outro `<button>` de reordenar (HTML
  inválido) — cada golpe vira um wrapper `.mv-cel` com o botão de atacar e o `<span class="mv-ordem">` lado a lado.

### Vínculo de Batalha / Ash-Greninja (27/09/2026)
Pedido do usuário ("dá pra adicionar o Ash-Greninja?"): checado antes de implementar que `greninja-ash` (id 10117)
e a habilidade `battle-bond` existem de verdade na PokéAPI. **Mas `battle-bond` NÃO é uma habilidade normal do
Greninja** (a API só lista `torrent`/`protean` pra ele — bate com os jogos: historicamente só um Greninja de
evento/história tinha essa habilidade). Por isso **não** entrou como habilidade sorteável em `pokemon.makeMon`:
vira **item segurado exclusivo**, `dados.ITEM_VINCULO` (`vinculo-de-batalha`, ₽15.000), no MESMO padrão de Pedra
Mega/Cristal Z — checado DIRETO pelo id em `golpe.js` (`m.item === ITEM_VINCULO`), não pela tabela genérica de
`segurados.js` (que exige `Object.keys(SEGURADOS)` bater com `IDS_SEGURADOS` = só os 13 itens de `ITENS_SEGURADOS`).
**A conquista é própria, não reaproveita a da Mega** (`conquistas.ALVOS.vinculo` = 1000, mesmo número da Mega —
escolha do usuário; `ESPECIES_VINCULO = ['greninja']`, lista separada de `dados-megas.MEGAS` porque Greninja não
tem Mega neste jogo): filtrar pela lista de Megas teria deixado o Greninja de fora da conta.
`golpe.virarAshGreninja(m, ctx)` segurando o item + derrubar um oponente troca `id/name/data` inteiro (igual à
Mega — Ash-Greninja tem atributos-base diferentes de verdade, diferente do Castform que só muda tipo/sprite) e
chama `recalc`; `desfazerAshGreninja` roda em `endBattle` junto com Mega/Tera/Dynamax/Forma. `greninja-ash` é
PRÉ-CARREGADO no início da luta (`batalha.iniciar` → `golpe.preCarregarAshGreninja`) se alguém do lado do jogador
entra segurando o item — mesmo cuidado da Mega, nada de buscar no meio do turno. **Water Shuriken** ganha
tratamento especial igual ao Weather Ball/Tera Blast (`regras.golpeDoBattleBond`: poder fixo 20, SEMPRE 3
acertos — a versão normal é 2–5 aleatório): plugado no motor único (`golpe.executar`, vale nos dois lados e no
co-op) e nos botões de golpe das duas telas. Validado com dados reais da PokéAPI (fora da suíte de testes, que
não toca rede — mesmo recorte que `mega.megaevoluir`): a transformação, o Water Shuriken reforçado e o desfazer
no fim da luta rodaram de ponta a ponta contra a API de verdade antes de ir pro commit.


---

## A auditoria de segurança (29/09/2026)

Pedido do usuário: "auditoria de segurança contra invasão, ataque cibernético e roubo de ideias — e corrigir o
que aparecer". O `/security-review` do Claude Code olha o DIFF do branch, e o branch estava limpo: não serviria
de ponto de partida. A varredura foi feita à mão, na ordem do escopo que o `CLAUDE.md` já listava.

### O achado grave: a sala do multiplayer acreditava em tudo

O canal Realtime de uma sala é um **broadcast com a chave anônima**. Quem está na sala publica o que quiser, e o
Supabase **não assina o remetente** — não existe "veio do anfitrião" que dê pra provar. Até aqui a sala tratava o
pacote como se fosse dado próprio: `aoReceberEstado` fazia `sala.batalha = p.batalha` e a tela desenhava aquilo.

O que isso permitia, na prática, pra qualquer um na sala (e a sala se entra com 4 caracteres):

1. **Rodar JavaScript na página de todo mundo.** O HTML da sala escapava os TEXTOS — `esc(m.nome)`, `esc(vez.nome)`,
   o chat — mas **número era número por fé**: `Nv. ${m.level}`, `${m.hp}/${m.stats.hp}`, `Turno ${b.turno}`. Um
   `level` valendo `<img src=x onerror=…>` executava. Pior: o endereço da sprite ia **dentro** de
   `onerror="this.onerror=null;this.src='AQUI'"`, onde uma apóstrofe no meio do endereço já fecha a string e emenda
   código. E a sessão do Supabase mora no `localStorage` (padrão do `supabase-js`), então o alcance disso **não é a
   sala: é a conta** — jornadas, saves, progresso, perfil, lista de amigos.
2. **Estragar o save do outro em silêncio.** `aplicarCoop` faz `S.money += r.dinheiro` com o número que veio do
   pacote. Com `"500"` em vez de `500`, o dinheiro da run vira a string `"100500"` — e isso é gravado no save e
   sobe pra nuvem, onde nenhuma tela entende mais aquele campo. Nem precisa de má intenção: bastava um bug.
3. **Deixar a tela em branco.** `p.batalha.turno` num pacote sem `batalha` estoura DENTRO do ouvinte do canal,
   onde ninguém pega o erro — exatamente o tipo de falha que o `CLAUDE.md` chama de "o pior bug".

### A correção: `js/mp-sanear.js`

Um módulo puro, **sem nenhum import** (é o chão do grafo: `render.js` também depende dele), com uma porta por
evento do canal — `estadoDaRede`, `fimDaRede`, `pingDaRede`, `chatDaRede`, `lobbyDaRede`, `acaoDaRede`,
`membroDaRede`. Cada porta devolve o pacote saneado **ou `null`**, e `null` quer dizer "joga fora e anota no
diagnóstico", nunca "usa como veio".

**O que foi considerado e recusado: lista de campos permitidos.** O estado da batalha tem dezenas de campos, em
seis níveis de aninhamento, e cresce a cada mecânica nova — uma lista dessas nasce certa e fica errada na semana
seguinte, do jeito mais perigoso (o campo novo passa sem conferência). `saneado()` desce o pacote inteiro e troca
cada folha pela versão segura **do mesmo tipo**: número finito ou 0, texto sem `< > "` e curto, endereço de
imagem só se for `https` de um dos dois servidores de sprite. Só existe tipo de JSON ali (o broadcast chega
decodificado), então a varredura é total por construção. Campo novo já nasce coberto.

Duas exceções ao "por tipo", e as duas doeram:

- **`CAMPOS_NUMERICOS`** (por nome de chave: `hp`, `level`, `xp`, `dinheiro`, `frac`, `ppLeft`…). Tirar o `<` de
  um texto resolve o XSS mas **não** resolve o save estragado: `S.money += "500"` continua concatenando. Esses
  campos são forçados a número. `id` ficou **de fora de propósito** — na presença o `id` do jogador é um uuid, e
  forçar número ali arrebentaria a sala inteira; o ícone, que é o id numérico de verdade, é tratado à parte em
  `membroDaRede`.
- **`urlDeImagem`** não se contenta com a lista de hosts. **`new URL()` não limpa o caminho**: ela aceita
  `https://cdn.jsdelivr.net/…/1';alert(1)//.png`, com host legítimo, e devolve a apóstrofe intacta no `href`.
  Esse foi o **furo do primeiro conserto desta própria auditoria** — bastava o `id` do Pokémon vir torto pra
  `SPR_ANIM(m.id)` montar sozinha um endereço com código dentro, e o filtro de host aprovava. Agora também
  recusa `' " < > \` e espaço, que não existem em endereço de sprite nenhum (conferido contra os 12
  construtores de `dados.js`, com 0 recusas indevidas).

O render ganhou a segunda linha de defesa no mesmo passo: `esc()` nos números (`mp-cartao.js`, `mp-telas.js`),
`urlDeImagem` nos três endereços de `render.js:imgMon` e no ícone de `conta.js:htmlIcone`, `esc()` no `fmt(t)` de
`badge`. Depender de `esc()` em 40 lugares foi justamente o que falhou; depender dos dois é o que segura.

**`doAnfitriao` é honesto sobre o que não é.** Estado, fim, lobby e pulso passaram a levar `de: meuId()`, e o
outro lado confere contra o anfitrião da presença. Isso **não é autenticação** — broadcast não tem remetente
assinado, e quem quiser mentir copia o id do anfitrião, que está visível na presença. Vale porque pega o engano
honesto (dois anfitriões depois de uma reconexão bagunçada) e a forja ingênua, e porque custa uma linha. Pacote
**sem** `de` passa: é a versão antiga do jogo, e derrubar a sala de quem ainda não atualizou seria pior que o
problema. Quem protege de verdade é o saneamento.

### No banco: dois furos de abuso, nenhum de vazamento

Nenhuma tabela vazava dado de ninguém. O que estava aberto era **encher o projeto de graça**, que no plano
gratuito é o jogo sair do ar:

- **Bucket `relatos-imagens`.** A política de envio era só `bucket_id = 'relatos-imagens'`, aberta a `anon`
  (relato sem conta é promessa da tela). Qualquer um mandava 2 MB por requisição, em caminho qualquer, pra
  sempre — ~500 requisições enchem 1 GB. Agora o caminho tem de começar pela pasta de quem envia e existe um
  teto por hora. **Detalhe que quase virou proteção de mentira**: a contagem do teto **precisa** ser
  `SECURITY DEFINER`. Contando `storage.objects` direto na política, a contagem passa pelo RLS do papel `anon` —
  que não tem policy de SELECT nesse bucket — e dá **sempre 0**, um teto que nunca fecha. Foi o primeiro jeito
  que eu escrevi.
- **`registrar_visitante_anonimo`.** Aceitava qualquer texto de até 40 caracteres, aberta a `anon`: linha sem fim,
  uma por id inventado. Ganhou checagem de formato e teto por hora (com índice em `primeira_vez`, senão o teto
  vira varredura da tabela a cada boot).

O teto de upload sozinho é **quebra-molas, não tranca**: sem conta não existe a quem amarrar o envio, então
nenhum teto vale — um atacante decidido continuava subindo 20 arquivos de 2 MB por hora, de graça, pra sempre.
Era decisão de produto (a tela promete "não precisa de conta"), e o usuário escolheu a tranca: **anexar imagem
exige conta** (`20260929210000_imagem_de_relato_so_com_conta.sql`; `anon` saiu da política, o caminho tem de
começar pelo id de quem envia, e o teto por hora ficou como o que sobra se uma conta for usada pra abuso ou
roubada). **Enviar relato continua sem conta** — isso é promessa da tela e não foi tocado.

Do lado do jogo a regra é cobrada em **três camadas**, e não por paranoia: é pra ninguém descobrir a regra só
quando o envio falha. A tela não desenha o seletor sem conta (e **diz o motivo, com o botão de entrar ao lado** —
espaço que some sem explicação parece funcionalidade faltando, não regra); `adicionarArquivos` recusa também o
Ctrl+V, que não passa por botão nenhum; e `subirImagensRelato` devolve **`null`, não `[]`**.

Essa distinção entre `null` e `[]` é o detalhe que evita um bug chato: a **fila offline** pode ter um relato
guardado com print de antes desta regra (ou guardado com conta e enviado depois de sair dela). Se o envio
simplesmente tentasse e falhasse, o relato ficaria **preso na fila pra sempre**, tentando de novo a cada abertura
da tela, e o texto da pessoa nunca chegaria. Com `null`, quem chama sabe diferenciar "não tinha imagem" de "não
pude subir": o texto vai, a imagem fica de fora, e a tela avisa quantas caíram — com o motivo certo, porque as
duas causas pedem atitudes diferentes (sem conta → entrar e reenviar; grande demais pra fila → esperar internet).

### Revisado e considerado OK

RLS de todas as tabelas (cada conta só lê o que é dela; `jornadas` sem update/delete); `validar_jornada`
recalculando a pontuação no servidor com tetos por campo; o gatilho que impede alguém de se promover a
`perfis.admin` pela API (inclusive no INSERT — um perfil não pode nascer admin); `perfil_do_amigo` só devolvendo
dados de amizade **aceita**, e nada de e-mail ou código de amigo; `badge_exibivel` conferindo no progresso se a
insígnia foi conquistada; a chave anônima no `config.js` (é pública por natureza — quem protege é o RLS); a
presença global com `track({})` vazio, que conta sem identificar ninguém; `esc()` no apelido em todas as telas
que mostram gente (ranking, amigos, perfil do amigo) — esse era o outro caminho de XSS entre jogadores e estava
fechado.

### Limites conhecidos e aceitos

- **A pontuação é calculada no navegador** e só conferida no servidor. Inventar uma jornada plausível continua
  possível; mandar uma pontuação qualquer, não. Sem servidor de jogo não tem como fechar, e isso já estava
  escrito no SQL desde o começo.
- **Forjar o fim de uma luta** continua possível pra quem está NA sala: o `de` não é prova, porque o broadcast
  não assina remetente. O alcance, depois da 2ª auditoria, é HP e narração.
  > ⚠ **O que estava escrito aqui estava errado** (corrigido em 30/09/2026): dizia que "o alcance é o de quem já
  > podia editar o próprio `localStorage`" e que "não corrompe save nem executa nada". Corrompia o save **dos
  > outros** — `aoReceberEstado` chamava `consumirRevives`/`consumirItensComuns` direto do pacote, então um
  > `estado` forjado esvaziava a mochila da run de quem recebesse, ou o inventário de CONTA na Sala de Raide.
  > Lição registrada: "o pacote é bem-formado" (o que o `mp-sanear` garante) não é o mesmo que "o pacote é
  > verdadeiro". Saneamento resolve INJEÇÃO, não AUTORIA — e a frase acima confundiu as duas por um dia.
- ~~**`/security-review` não foi rodado** como segunda opinião.~~ ✔ rodado em 30/09/2026 — ver "A segunda
  auditoria de segurança".

---

## A segunda auditoria de segurança (30/09/2026)

Esta é o item (d) que a primeira deixou aberto: **`/security-review` rodado como segunda opinião**. O branch
estava limpo de novo (o comando olha o diff), então o escopo foi o **repositório inteiro**, dividido em quatro
frentes paralelas: SQL/RLS/Storage · pacote da sala · XSS no DOM · auth, upload, cache e geradores. Cada achado
foi reconferido no código antes de entrar aqui — dois candidatos caíram nessa conferência.

**7 achados: 6 graves, 1 médio.** O que mais chama atenção é que **quatro deles estavam em cima de defesa já
existente** — não eram áreas esquecidas, eram áreas protegidas com um buraco fino. É o padrão a levar pra
próxima: o lugar mais perigoso não é o que não tem trava, é o que tem trava e por isso ninguém olha mais.

### 1. `&#39;` passava pelo filtro de endereço de imagem

A primeira auditoria fechou a apóstrofe LITERAL no `urlDeImagem` (o endereço é escrito dentro de
`onerror="…src='AQUI'"`). Mas o valor cai num **atributo**, e o navegador decodifica entidade HTML **antes** de
compilar o `onerror` como JavaScript: `&#39;` chega ao JS como apóstrofe de verdade **sem nunca ter existido na
string que o filtro olhou**. `new URL()` devolve a entidade intacta, host (`cdn.jsdelivr.net`) e esquema
(`https:`) legítimos — passava pelas duas checagens. Bastava entrar na sala e anunciar a própria presença com
`data.sprite` armado: o `src` truncado dava 404, o `onerror` disparava e o `eval` lia a sessão do Supabase do
`localStorage` de **todos os presentes**. Conserto: `& ; %` entraram em `CARACTERE_PROIBIDO_EM_URL` (nenhum dos
12 construtores de `dados.js` usa esses caracteres, então o custo é zero).

**A lição, que vale além deste bug:** um filtro de caractere só é correto em relação ao **contexto** onde o valor
cai. Aqui há dois contextos empilhados (string JS dentro de atributo HTML), e cada camada tem sua própria
decodificação. Filtrar "o caractere perigoso" sem dizer "perigoso em qual camada" é o que deixou o furo.

### 2. `poke_id` cru dentro de um `src`

`perfil-amigo.js` desenhava a sprite das últimas runs de um amigo com `SPR(r.poke_id)` **sem `esc()`**, e
`poke_id` vem de `resumo.registro.ids` — `jsonb` que o cliente envia e que `validar_jornada` não olha. Como
`->>` devolve TEXTO, era string arbitrária indo pra dentro de um atributo. Todos os campos de texto ao redor
estavam escapados; e `conta.js` (`htmlIcone`) **já coagia** o id remoto pra inteiro, com um comentário
descrevendo exatamente este ataque. O call site vizinho é que tinha esquecido.

Conserto **na raiz, não no call site**: a coerção foi pro construtor (`numeroDeSprite` em `dados.js`), então os
12 `SPR*` e todos os ~40 pontos de desenho ficaram cobertos de uma vez — inclusive `fim.js`, que lê o mesmo
`registro.ids`. A faixa aqui é "inteiro", não o `1–1025` do `htmlIcone`: id de FORMA passa de 10000
(`render.spriteFrente` usa `m.formaSprite`), e clampar em 1025 quebraria sprite de forma.

### 3. Reescrever uma amizade e ler o histórico de qualquer conta

A política de UPDATE de `amizades` era `using (auth.uid() = para) with check (status = 'aceita')`. O `using` olha
a linha ANTIGA, o `with check` olha a NOVA — e **nada prendia `de`/`para`**. Quem tivesse um pedido recebido
reescrevia a linha pra "amizade aceita entre `de = <vítima>` e `para = eu`" e repetia trocando o uuid, varrendo a
base com **uma linha só**. Os uuids eram fáceis: `presenca.js` usava `idJogador()` como **chave de presença** do
canal global — o `track({})` vazio era de propósito, mas a *chave* anulava isso.

A vítima não precisava aceitar nada, e como `perfil_do_amigo` é `SECURITY DEFINER` e fura o RLS de
`jornadas`/`progresso` confiando nessa tabela, saía nível, pontuação, gens, shinies e as 5 últimas runs. **A
função estava correta** (exige `'aceita'` nas duas direções, usa `auth.uid()`): o furo era a tabela em que ela
confia. Conserto em `20260930120000`: `using` passou a exigir `status = 'pendente'`, `with check` voltou a exigir
`auth.uid() = para`, e um gatilho `congelar_par_amizade` prende as duas colunas — porque **`with check` não
enxerga `OLD`**, então política sozinha não consegue dizer "essas colunas não mudam". Mesmo padrão que
`proteger_perfis_admin` já usava.

### 4. A penalidade que virava bônus de 70.000×

`validar_jornada` recusa número impossível, e recusava todos — menos o expoente:
`penal := greatest(0.5, power(0.8, continuacoes))`. **`greatest` é piso, nunca teto**, e `continuacoes` vinha do
`resumo` do cliente sem faixa. `power(0.8, -50)` ≈ 70065: o campo que devia TIRAR pontos multiplicava a
pontuação por dezenas de milhares, com todos os outros números dentro do "possível". Um `insert` de console dava
1º lugar geral **para sempre** — `jornadas` não tem política de update nem delete, então nem o dono apaga.

Isso **não** era o limite aceito "a pontuação é calculada no navegador": esse limite é sobre jornada *plausível*
inventada. Aqui o gatilho **aceitava e assinava** um valor impossível, que é exatamente o que ele existe pra
impedir. Conserto: piso 0 no expoente e `least(1, …)` de teto, nos dois lados (`regras.multContinuacao` tinha o
mesmo `0.8 ** n`). O `tests/schema.test.js` cobra a igualdade — e **ele também tinha um bug**: fatiava a função
com `indexOf`, então com uma migration nova ele conferiria a definição VELHA e daria o conserto por feito. Virou
`lastIndexOf`, com âncora no `create or replace` inteiro (o trecho curto reaparece no `execute function` do
`create trigger`, depois do `drop trigger`, o que dava `slice` invertido e corpo vazio) e um `throw` se as
âncoras mudarem. **Teste que valida o estado acumulado de migrations precisa olhar a ÚLTIMA definição.**

### 5. O pacote de rede mandava na mochila alheia

O pior dos sete, e o mais fácil de passar batido, porque não parece código de segurança: `aoReceberEstado`
chamava `consumirRevives(p.batalha)` e `consumirItensComuns(p.batalha)`. Essas funções **apagam item do save**
(`G.S.bag`, `save()`) ou do **inventário permanente de conta** (`gastarItemDeRaide`, na Sala de Raide), e quanto
gastar vinha de `b.itensUsados[meuId()]` — campo do pacote. O único controle era `doAnfitriao`, que aceita pacote
sem `de` de propósito (compatibilidade). Um broadcast com 400 ids esvaziava a mochila da vítima item a item, e
alternando `fim`/`estado` a drenagem recomeçava.

Conserto: **o pacote passou a CONFIRMAR, não a AUTORIZAR.** Existe agora um livro-caixa local (`sala.pedi`),
escrito só pelas minhas próprias ações (`pediItemComum`/`pediRevive`/`pediRaide`), e o desconto é o cruzamento
dos dois — `mp-regras.itensADescontar` (multiconjunto, pra não depender da ordem) e `usosADescontar` (teto, com
piso 0 pra contador negativo não virar crédito). Pacote forjado encontra livro-caixa vazio e não desconta nada.
As duas regras nasceram **puras em `mp-regras.js`, com teste**, porque `mp-resultado.js` importa `ui.js` e não é
importável no Node — a regra do `CLAUDE.md` ("regra nova vai em função pura com teste") é o que tornou este
conserto testável.

**A lição:** `mp-sanear` garante que o pacote é **bem-formado**, não que é **verdadeiro**. Saneamento resolve
injeção, nunca autoria. A frase antiga em "Limites conhecidos" confundia as duas — está corrigida lá.

### 6. `desistir` funcionava em co-op

O comentário no motor dizia "desistir (PvP)", mas o filtro era só `x.tipo === 'desistir'`: a trava de modo
existia **só na UI** (`mp-telas.botoesPvP`). Como o ator de uma ação é o `de` autodeclarado do pacote, um
participante mandava `{ de: "<vítima>", acao: { tipo: "desistir", ref: "A0" } }` — 70 bytes — e o **anfitrião
autoritativo** zerava a equipe da vítima e publicava um `fim` **legítimo**. No Roguelike isso desce por
`mp-resultado.principalCaiu` → `encerrarJornada('desmaiou')`: run acabada, sem nenhuma pista no diagnóstico,
porque a ação foi válida. Conserto: `s.pvp ? … : []` no motor.

**A lição:** regra que só existe na tela não é regra. Vale pro multiplayer o mesmo que já valia pra
`golpesPermitidos` no single player — **o motor tem de conferir também**, porque a tela não é o único caminho até
ele. E ataque que passa pelo anfitrião é pior que pacote forjado: o resultado sai assinado por quem manda, então
nenhum endurecimento no cliente o pega.

### 7. Nome da PokéAPI virando código nos geradores

`gerar-mapas.ps1` e `gerar-megas.ps1` montavam literais de JavaScript concatenando nomes da PokéAPI **sem
escapar** — e esses arquivos (`dados-mapas.js`, `dados-megas.js`) são importados por `dados.js`, ou seja vão pra
todo jogador. O autor conhecia o risco (o `desc` escrito à mão já passava por `-replace "'", "\'"`), mas nada
vindo da rede passava. O caso realista não é nem o hostil: é um `farfetch'd` numa forma nova derrubando o jogo
inteiro com erro de sintaxe — e **`node --check` não roda no Windows**, então o CI seria a única rede. Conserto:
`JsStr` exige `^[a-z0-9-]+$` e **falha o gerador** em vez de emitir, `JsTexto` escapa o rótulo que nós mesmos
montamos. Os `.mjs` de `ferramentas/` não precisaram de nada: todos já usavam `JSON.stringify`.

### Nota operacional: o arquivo que desprotegia ao ser rodado

`supabase/ADMIN-TRIGGERS.sql` tinha o bloco **DESLIGAR ativo** e o de religar comentado. Não é migration (a
integração não aplica), então o banco estava protegido — mas quem abrisse o arquivo pra "gerenciar os gatilhos" e
clicasse em Run desligaria a proteção de `perfis.admin` sem querer, e daí qualquer conta logada viraria admin. Os
blocos foram **invertidos**: rodar o arquivo inteiro sem ler agora é a ação segura.

### Revisado e considerado OK

Pra não reauditar o que já foi olhado: RLS ligada nas 7 tabelas, com `using` **e** `with check` em `saves` e
`progresso`; `jornadas` sem update/delete; `perfis.admin` bloqueado nas duas portas; bucket de imagem privado,
só `insert`, só `authenticated`, caminho preso ao `auth.uid()`; `subirImagensRelato` devolvendo `null` ≠ `[]`;
zero `EXECUTE` dinâmico em todo `supabase/`; `search_path` em todas as 8 funções `SECURITY DEFINER`, nenhuma
aceitando "o id de quem sou"; `auth.users` nunca lida; as 7 portas de `mp-sanear` cobrindo todos os eventos
(inclusive a presença, que é a mais esquecida) com varredura por tipo que passa **nas chaves** também;
`acaoDaRede` limitando `golpe` a índice; `?sala=` validado por `codigoValido`; chaves de cache derivadas só da
PokéAPI; `sw.js` sem `importScripts` dinâmico; e os ids de AdSense sendo constantes de build.

---

## Sprites, animações e microinterações

### Estilo de sprite: Clássico / 3D / Animado (27/09/2026)
Pedido do usuário (junto do backlog de animações), em duas levas: primeiro só o 3D (booleano), depois pediu
também os GIFs animados do Showdown — o que virou um refactor de booleano pra enum de 3 estilos.
A PokéAPI não tem modelo 3D interativo pra jogo — o que existe é `sprites.other.home`, um RENDER 2D do mesmo
modelo 3D usado em Pokémon HOME/jogos modernos (bem mais nítido que o pixel-art `sprites.front_default`), e
`sprites.other.showdown`, os GIFs animados usados no Pokémon Showdown (COM versão de costas de verdade,
diferente do "home"). `dados.SPR_3D`/`SPR_3D_SHINY` e `SPR_ANIM`/`SPR_ANIM_COSTAS`/`SPR_ANIM_SHINY`/
`SPR_ANIM_SHINY_COSTAS` montam pelo id, mesmo padrão do shiny — nunca leem `m.data.sprite`, porque essas imagens
podem não existir pra alguma forma antiga guardada num save velho.
Preferência em `ajustes.ESTILO_SPRITE_KEY` (localStorage `pokerpg-estilo-sprite`, enum `'classico'|'3d'|'animado'`
via `ESTILOS_SPRITE`/`estiloSpriteAtual`/`definirEstiloSprite`), lida em `render.spriteFrente`/`sprCostas` a cada
render — trocar o estilo vale na hora, sem precisar recriar nenhum Pokémon. **3D não tem versão de costas**
("home" só tem frente): `sprCostas` devolve `null` nesse estilo e cai sozinho no MESMO fallback que já existia
pra espécie sem back 2D (frente + CSS `flip`). **Animado tem costas de verdade**, então usa `SPR_ANIM_COSTAS`/
`SPR_ANIM_SHINY_COSTAS` direto. Se a imagem do estilo escolhido não existir de verdade pra algum Pokémon/forma,
`imgMon()` já cai pro sprite 2D clássico no 2º erro de `<img>` (fallback que já existia, não precisou de nada
novo). **Download opcional e À PARTE** do download normal: `offline.baixarImagens3D`/`imagensGuardadas3D` (2
imagens: frente normal e shiny) e `baixarImagensAnimadas`/`imagensGuardadasAnimadas` (4 imagens: frente e costas,
normal e shiny) — mesmo formato de `baixarImagens`, ninguém baixa imagem de estilo que não escolheu.

**Bug relatado pelo usuário (27/09/2026): GIFs animados "estranhamente desproporcionais".** Causa: `.spr` (e as
outras classes que desenham `spriteFrente`/`sprCostas` sem passar por `.spr` — `.me img` da ficha, `.aliado-top
img` do cartão de aliado, `.mp-mon img` do multiplayer) fixam `width`/`height` iguais, o que é inofensivo pro
clássico e pro 3D (sempre quadrados) mas ESTICA o GIF do Showdown: cada Pokémon tem um tamanho de sprite
diferente lá (Wailord bem mais largo que alto, Onix mais alto que largo…), e forçar num quadrado distorce a
imagem. Corrigido com `object-fit:contain` nas quatro regras — encolhe mantendo a proporção, com uma pequena
margem dentro da caixa, em vez de esticar. Não muda nada visualmente pro clássico/3D.

### Sprites de verdade pra Pedra Mega e Cristal Z (27/09/2026)
Pedido do usuário: os três itens de gimmick (`dados.ITEM_PEDRA_MEGA`/`ITEM_CRISTAL_Z`/`ITEM_VINCULO`) são únicos e
genéricos no jogo (uma Pedra Mega serve pra qualquer espécie, um Cristal Z pra qualquer tipo) — `ITEM_SPR(k)`
simples não tem como saber qual arquivo mostrar, então caíam sempre no ícone de caixinha genérico
(`ITEM_SPR_RESERVA`). A PokéAPI TEM sprite de verdade por espécie (pedra) e por tipo (cristal): `PEDRAS_MEGA`/
`CRISTAIS_Z` (`js/dados-item-sprites.js`, GERADO por `ferramentas/gerar-item-sprites.mjs` — Node, roda no
Raspberry Pi, não PowerShell) trazem essas tabelas. `dados.ITEM_SPR_MEGA(especie)`/`ITEM_SPR_Z(tipo)` fazem a
troca; `render.spriteItem(k, m)` é o ponto único que decide qual sprite mostrar pra QUALQUER item, dado quem
seguraria ele (`m`, um Pokémon-like com `.data.speciesName`/`.moves` — `blocoItem` passa o dono de verdade; loja,
mochila e os modais de comprar/vender em `main.js` passam `S.player` como melhor palpite antes de saber quem vai
equipar). `zmove.primeiroTipoZ(M)` acha o tipo do primeiro golpe com Z conquistado (só decide o SPRITE — o golpe
que vira Z de fato na hora H continua escolhido em batalha, por `zDisponiveis`).
**Nem toda espécie tem pedra de verdade**: só 47 das 89 Megas deste jogo são Mega oficial dos jogos de verdade
(+ Kyogre/Groudon, que usam os Orbes da Reversão Primitiva) — o resto (Meganium, Chesnaught, Greninja, Zeraora…)
só existe neste projeto, e a PokéAPI não tem pedra desenhada pra eles (o item existe nos DADOS da API, mas sem
sprite — confirmado um por um, 404 no CDN). Pra esses, `CHAVE_MEGA_GENERICA` = `key-stone`, a Pedra-Chave: item
real dos jogos que ativa QUALQUER Mega Evolução, então nunca fica errado mostrá-la. O gerador casa o nome do
item com a espécie de dois jeitos: pro item OFICIAL, lê o texto em inglês do próprio item na API ("Allows X to
Mega Evolve") — sem depender de adivinhar o padrão do nome (que é irregular: `blastoisinite`, `alakazite`,
`heracronite`… não seguem `especie+"ite"`); pros itens sem esse texto (os ~40 "fan-made" que só existem nesta
extensão da PokéAPI), casa pelo maior PREFIXO comum com o nome da espécie (ex. `meganiumite` → `meganium`) — como
o próprio nome do item já É a espécie com um sufixo trocado, funciona sem ambiguidade nos 89 casos.
**Cristal Z é mais simples**: os 18 tipos têm cristal oficial de verdade (`firium-z`, `waterium-z`…, sufixo
`--held` no arquivo de sprite — nome de arquivo diferente do nome do item, cuidado se algum dia regenerar à mão).
Sem tipo elegível ainda, cai no Anel Z (`z-power-ring`, item real e genérico a todo Z-Move).
**Vínculo de Batalha não tem item nenhum nos jogos** (Battle Bond é habilidade, não item segurado) — ícone
próprio, um SVG embutido de shuriken (tema ninja do Greninja), em vez de fingir que existe um sprite oficial.

### Animação da barra de HP (27/09/2026)
Pedido do usuário (junto do backlog de animações): a barra saltava direto pro número novo, sem transição. O
`.fill` já tinha `transition: width .45s ease` no CSS — o problema é que `render()` não faz diffing (destrói e
recria o DOM inteiro a cada chamada, ver o comentário no topo de `render.js`), então uma barra NOVA nasce direto
na largura final, sem "de onde" animar. Resolvido com a técnica **FLIP** (First-Last-Invert-Play) em `render.js`:
`hpbar(m, chave)` ganhou um 2º parâmetro opcional — com `chave`, o `.fill` ganha `id="hp-fill-<chave>"` e a classe
`fill-hp`. `capturarLarguraHP()` roda ANTES de `renderSheet()/renderScene()/renderActions()` redesenharem tudo
(guarda a largura atual de cada barra com id); `animarBarrasHP(antes)` roda DEPOIS: força a barra nova a nascer na
largura ANTIGA (sem transição), faz o navegador aplicar isso com `el.offsetWidth` (força reflow), e só então solta
pra largura de verdade COM transição — o olho vê os dois quadros como uma animação contínua. Respeita `REDUCED`
(`ui.js`, `prefers-reduced-motion`): sem animação nenhuma pra quem pediu, igual sempre foi. Chamadas de
`plate(m, chave)` (cena de batalha: `'e'`, `'p'`, `'a'+i`), `cartaoAliado` (`'card-a'+i`) e `renderFicha`
(`'ficha-p'`) já passam a chave certa. **Validado em jsdom** (não dá pra testar em `node:test`, é manipulação de
DOM pura — mesmo padrão do resto de `render.js`): importar o módulo inteiro em jsdom já confirma que a cadeia de
dependências carrega sem erro; as duas funções, expostas temporariamente pra teste e revertidas depois, terminam
na largura correta nos três cenários (largura muda, largura igual — no-op, elemento novo sem entrada anterior).

### Animações de batalha: ataque, dano, cura, status (28/09/2026)
Pedido do usuário ("mais vivo, mais animações"), prioridade 1 de uma leva maior (ver "Layout paisagem"/"Loja de
preparo" — não, essas são de outro dia; a leva desta é celular deitado + isto + microinterações + tela inicial +
FLIP em XP/PP). Intensidade escolhida pelo usuário: **sutil e polido**, não chamativo.
- **Ataque**: `ctx.atacar(m)` — novo gancho OPCIONAL no `ctx` do motor único (`golpe.js`, mesmo espírito de
  `ctx.tremer`, documentado no cabeçalho do arquivo), chamado em `usarGolpe` no EXATO instante em que anuncia
  "X usou Y!" (linha `await ctx.say(...)`). Single player define `CTX.atacar` (`efeitos.js`, importa `atacar` de
  `ui.js`); multiplayer não define nada — `(ctx.atacar || nada)(u)` no motor não quebra. `ui.js` ganhou
  `idDoMon(m)`/`reanimar(id, classe)`, fatorados de `shake()` (que virou uma linha), reusados por `atacar()`. CSS
  `.mon.atacando` (`atacando .35s`): um "pulo" de escala, sem depender de direção (jogador/aliado/inimigo ficam
  em lados diferentes da cena — decidir lunge direcional exigiria saber a posição de cada um, complexidade maior
  pro ganho; um pulo simétrico já comunica "agiu" sem isso).
- **Dano e cura**: SEM gancho novo no motor — reaproveita a técnica FLIP que já existe (`render.js`,
  "Animação da barra de HP" acima). `animarBarrasHP` já compara a largura ANTES/DEPOIS de cada `.fill-hp`;
  agora também olha o SENTIDO da mudança (encolheu = dano, cresceu = cura) e faz `.mon` piscar vermelho
  (`hit-flash`) ou verde (`heal-flash`), só pra `hp-fill-e`/`-p`/`-a<N>` (as barras da CENA — `ficha-p`/`card-a0`
  mostram o MESMO Pokémon noutro lugar, filtradas pra não duplicar a piscada). Isso cobre TODO caminho de cura
  (Restos, fruta, dreno, clima, item, Centro…) de graça, sem precisar caçar os ~15 pontos de `heal()` espalhados
  por `golpe.js`. **Simplificação assumida**: a largura é uma PORCENTAGEM (hp/hp máximo), então um HP MÁXIMO que
  muda no meio da luta (Rare Candy, Dynamax) também mexe na largura sem ninguém ter apanhado ou curado — piscada
  errada rara e sem efeito de jogo, não vale separar os dois casos.
- **Status**: SEM gancho novo — pulso contínuo e sutil em CSS (`@keyframes pulso-status`, `animation:...infinite`)
  nos chips `.st-burn`/`.st-poison`/`.st-paralysis`/`.st-freeze` e `.stg.up`/`.stg.down` (estágio subiu/desceu):
  como a classe já nasce no HTML a cada render enquanto o status durar, "pulsar enquanto durar" não precisa de
  JS nenhum — só a classe continuar presente já mantém a animação (CSS não reinicia animação em elemento que já
  a tinha, só teria efeito NOVO se o elemento nascesse agora, que é exatamente quando o status é aplicado).
  **Sem "pop" no instante exato em que o status é aplicado** (diferente do FLIP de HP, eu precisaria capturar o
  status ANTES do render pra saber que é novo — decidido não fazer por ora: o pulso contínuo + a mensagem no
  log já comunicam o evento, e o ganho do "pop" isolado não parecia valer a complexidade extra).
- `@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}` (já existia,
  linha final do CSS) cobre TODAS essas animações novas de graça — nenhuma precisou de tratamento próprio de
  `REDUCED`.
- **Fora do escopo por ora**: multiplayer não ganhou essas animações (a cena da sala usa outro DOM, `cartao()`
  em `multiplayer.js`, sem os ids `mon-p`/`mon-e`/`mon-a<N>` que `idDoMon`/`hit-flash` dependem) — se pedido,
  precisaria da mesma técnica adaptada pra lá.

### Microinterações gerais: botões e transição de tela (28/09/2026)
Prioridade 2 da mesma leva ("mais vivo"). Duas regras CSS globais, sem tocar JS nenhum:
- **Botões**: `button{transition:filter,border-color,background-color,transform}` + `button:active:not(:disabled)
  {transform:scale(.96)}` na base (`css/estilo.css`, perto do reset). Cobre TUDO de graça porque quase todo
  clicável do jogo É um `<button>` de verdade (o padrão `data-act`) — golpe (`.mv`), carta de Pokémon (`.pick`/
  `.hall-card`), item da mochila, etc. — sem precisar enumerar cada classe.
- **Transição de tela**: `.create,.game{animation:tela-entra .18s ease-out}` (fade + leve deslocamento). Como
  TODA tela do jogo usa `<main class="create ...">` (ou `.game`, só a tela de jogo em si) como contêiner de
  topo — confirmado varrendo `$('#app').innerHTML =` em cada arquivo `tela-*.js`/`criacao.js`/`arena.js`/etc.,
  incluindo o helper `casca()` de `ranking.js`/`perfil-amigo.js` — uma única regra cobre toda navegação.
  **Cuidado que motivou o valor pequeno (4px, 0.18s)**: `.create` é recriado inteiro em MUITAS interações
  dentro da própria tela (ex.: `tela-ajustes.js`, trocar de fonte chama `telaAjustes()` de novo, não só troca
  uma div), então a animação replay a cada clique — não só na troca de tela. Um valor sutil o bastante fica bem
  mesmo repetindo; um valor mais chamativo (cogitado 6px/0.25s) ficaria cansativo nesse caso. `.game` NÃO tem
  esse problema: só é recriado por `buildGame()`, chamado uma vez ao entrar na jornada — turnos e explorações
  usam só `render()`, que atualiza divs internas sem recriar `.game`, então a entrada anima uma vez só.
  Coberto pelo `prefers-reduced-motion` global (já existia) — nenhum tratamento extra precisou.

### Tela inicial mais viva (28/09/2026)
Prioridade 3 da mesma leva. Três toques, todos CSS-only (menos o `<span>` novo do marcador de presença):
- **🟢 marcador de presença** (`js/presenca.js`, feito antes nesta mesma leva): o emoji do ponto vira
  `<span class="dot-viva" aria-hidden="true">` (escondido de leitor de tela — o texto ao lado já diz "X jogando
  agora", repetir "círculo verde" seria ruído) e pulsa com o MESMO `@keyframes pulso-status` já usado nos chips
  de status da batalha (reaproveitado, não duplicado).
  - **Prévia do Pokémon escolhido** (`.pv-art img`, `criacao.renderPreview`): flutua sozinho (`@keyframes
  flutuar`, translateY suave, 3.2s). É o ÚNICO sprite grande e sozinho da tela — um grid inteiro flutuando ao
  mesmo tempo (a grade de iniciais) ficaria ocupado demais, então NÃO entrou lá.
- **Grade de iniciais** (`.pick`, os cartões de espécie): levanta um pouco no hover (`transform:translateY(-3px)`),
  além da borda que já mudava de cor. **Simplificação aceita**: como `.pick` também é um `<button>` e já ganhou
  o `:active{scale(.96)}` global (microinterações, acima), hover+pressionar ao mesmo tempo mostra só UM dos dois
  transforms (o de maior especificidade CSS, `.pick:hover`) em vez dos dois combinados — efeito colateral
  pequeno, não vale compor os dois valores de `transform` só por causa disso.

### FLIP em XP e PP (28/09/2026)
Prioridade 4 (a última) da mesma leva, fechando o ciclo "mais vivo". `render.js`:
- **XP**: `barraXp(M, GR, chave)` ganhou o MESMO 3º parâmetro opcional que `hpbar` já tinha — com `chave`, o
  `.fill` ganha `id="xp-fill-<chave>"` e a classe `fill-xp`. `capturarLarguraHP`/`animarBarrasHP` viraram
  `capturarLargurasBarras`/`animarBarras` (renomeadas: já não são só de HP) e passam a consultar
  `.fill-hp[id],.fill-xp[id]` juntas — a MESMA técnica FLIP, uma função só. O piscar vermelho/verde (hit/heal)
  continua exclusivo de `.fill-hp` (`if (!el.classList.contains('fill-hp')) continue`): dano/cura não fazem
  sentido pra XP. Chaves: `'ficha-p'` (jogador) e `'card-a'+i` (aliado) — as MESMAS já usadas pela barra de HP
  correspondente (sem colisão de id: prefixos `hp-fill-`/`xp-fill-` diferentes).
- **PP não é barra, é texto** ("PP 5/10" nos botões de golpe) — FLIP de largura não se aplica. Tratamento
  PARALELO, não literal: `capturarTextosPP`/`animarPP` comparam `textContent` antes/depois (mesma ideia do FLIP,
  ANTES/DEPOIS do render, só que em texto) e piscam a classe `.pp-mudou` (CSS: escala + cor por um instante) só
  quando o texto muda. Só o `.pp` do BOTÃO de golpe (`renderActions`, `id="pp-<índice>"`) ganhou id — é o único
  que decrementa DURANTE a batalha; o da ficha (dentro do `<details>` de cada golpe) ficou de fora por não ter
  tanto valor piscar toda vez que o painel reabre.
- Ambos cobertos pelo `prefers-reduced-motion` global — nenhum tratamento extra precisou, igual o resto da leva.


---

## Som: cries e música procedural (30/09/2026)
Item do backlog ("Som no jogo"). Decisão de arquitetura tomada com o usuário antes de escrever qualquer código:
Strudel/TidalCycles (a inspiração original do pedido) ficaram de fora — são bibliotecas de live coding, e o
projeto é JS puro sem build nem dependência; carregar uma delas por CDN funcionaria, mas ainda seria uma
dependência de verdade (biblioteca grande, precisaria entrar no service worker pra funcionar offline). Em vez
disso: `js/som.js`, um compositor pequeno escrito do zero com a Web Audio API, na MESMA camada de `ajustes.js`
(só importa `util.js`/`dados.js` — importável de qualquer lugar acima no grafo).

**Desligado por padrão** (`SOM_KEY='pokerpg-som'`, `somLigado()`), como as outras preferências de `ajustes.js`.
`⚙ Ajustes → Som` (seção C, antes de "Jogar offline" — as seções D/E/F foram reletradas) tem um checkbox só;
ligar não pediu confirmação nem aviso: é reversível na hora. As demais seções (D Jogar offline, E Presença, F
Cookies) só mudaram de letra.

**Cries**: `dados.CRY(id)` monta a URL pelo id, no MESMO padrão de `SPR`/`SPR_SHINY` — espelhado no jsDelivr
(`cdn.jsdelivr.net/gh/PokeAPI/cries@main/...`), repositório IRMÃO do de sprites, já coberto pelo `cachePrimeiro`
genérico do `sw.js` (a lista `EXTERNOS` casa por HOST, não por caminho — nenhuma linha nova precisou entrar lá).
`tocarCry(id)` usa `new Audio(url).play().catch(()=>{})`: falha de rede ou autoplay bloqueado é silêncio, não erro
— é decoração, não crítico como as imagens.

**Música**: sem arquivo nenhum, sempre GERADA, de dois ingredientes que se cruzam:
- **`CONTEXTOS`** (que tela) dá andamento, agitação e timbre: `telas`/`menu`/`explorar`/`batalha`/`chefe`.
- **`TEMAS`** (que rota) dá a tonalidade — raiz, escala e a progressão de 4 acordes. As chaves são **os biomas de
  `cenario.climaDaRota`**, a MESMA derivação que já pinta o céu e o chão da batalha a partir do TEXTO da rota.
  Reusar aquilo é o que faz "uma música por rota" valer pras 99 rotas sem tabela nova pra manter: rota com
  "caverna" no nome já nasce com som de caverna. Os 12 biomas cobrem as 99 rotas de hoje (`tests/som.test.js`).

Escalas: pentatônica maior/menor e menor harmônica — soam "certas" com nota quase aleatória, o que dispensa um
gerador de melodia mais esperto. O agendamento segue o padrão clássico de "olhar à frente" (agendar no relógio do
`AudioContext`, não confiar no `setTimeout` por nota — ele atrasa sob carga): `agendador()` roda a cada 25 ms e
agenda todo passo de 16 que cair dentro da janela de 100 ms à frente.

**Vitória** é uma fanfarra curta (arpejo maior ascendente, uma vez só, sem loop) — `tocarStinger()`, sem passar
pelo agendador.

**Onde troca de música**: nos pontos que já eram o choque único de cada transição (nenhuma tela precisou saber de
música sozinha) — `criacao.showCreate` (menu), início da jornada e `main` no `case 'zone'` (explorar, com a rota
nova), `batalha.iniciar` (batalha/chefe + `tocarCry` do inimigo — é o único momento de grito: o jogo não tem
captura de Pokémon selvagem, é o TREINADOR que tenta capturar VOCÊ), `batalha.endBattle` (volta pra explorar),
`fim.telaFim` (fanfarra na vitória, silêncio nos outros motivos) e **um ponto único em `main.aoClicar`** que dá a
faixa `telas` pra toda tela de menu — todas são alcançadas por um `data-act` da lista `TELAS_NAV`, então bastou
uma linha em vez de mexer em 12 telas. Essa linha lê a condição de batalha À MÃO em vez de chamar
`travadoPelaBatalha()`: aquela função TOASTA quando barra, e o `case` do switch a chama de novo — o jogador veria
o aviso duas vezes. `main.abrirJornada` religa a trilha certa ao retomar um save.

### A segunda leva (30/09/2026): o que quem jogou reclamou
Cinco queixas do primeiro dia, todas atendidas em `som.js`:
1. **"Os sons estão com delay"** (o grito principalmente). A causa era `new Audio(url).play()`: o arquivo era
   BUSCADO na hora do grito. Agora o cry é baixado, **decodificado uma vez e guardado** e tocado por
   `createBufferSource` — instantâneo. Quem aquece é **`precarregarCry`, chamado por `pokemon.makeMon`**: todo
   Pokémon do jogo nasce ali, bem antes de entrar em campo, então na hora da luta o áudio já está pronto. O
   service worker já guardava o arquivo (o host está em `EXTERNOS`), então isso custa rede só na primeira vez.

   ⚠️ **O primeiro conserto disto virou um bug pior, e foi pra produção**: o mapa guardava o BUFFER e era marcado
   com `null` antes do fetch, pra não buscar duas vezes. Só que `tocarCry` lia esse `null` como "ainda não
   chegou", apenas re-aquecia e **não tocava** — ou seja, na PRIMEIRA aparição de cada espécie o grito nunca saía,
   que é justamente o caso comum. O jogador relatou como "os cries pararam de tocar". A correção é guardar a
   **promessa** do buffer, não o buffer: quem pede o grito se pendura nela e toca quando ela resolve, esteja o
   áudio pronto ou a caminho (com um corte de 3 s, pra grito que demorou na rede não sair fora de hora).
   Lição de teste, registrada porque se repetiu: **o teste manual que eu fiz exercitou só o caminho QUENTE** (eu
   esperei o áudio chegar antes de mandar tocar), e o caminho frio — o do jogador — nunca foi testado.
   `tests/som.test.js` cobre agora o frio, e foi conferido que ele REPROVA a versão com bug.
2. **"Se eu saio do navegador o som continua"** — incômodo real. `visibilitychange`: aba escondida para o
   agendador e dá `ctx.suspend()`; ao voltar, `resume()` + `retomar()` remonta a faixa do `pedido` guardado.
3. **"Precisa ter menos agudos"** — duas coisas somadas: um **passa-baixa de 2 kHz** na saída de tudo (onda
   quadrada e dente-de-serra jogavam harmônico agudo direto no alto-falante) e a melodia rebaixada: antes era
   `raiz + escala + 24` com raiz 60/62 (chegava perto de 2 kHz, a 7ª oitava); agora o teto é `+12` e as raízes
   moram entre 48 e 57 (Dó2–Lá2), o que põe o topo em ~830 Hz. Nota acima de MIDI 74 ainda sai com 55% do volume.
   `tests/som.test.js` trava esse teto — é fácil desfazer sem perceber ao mexer numa raiz.
4. **"Música para cada rota de acordo com o tema"** — a tabela `TEMAS` acima, via `cenario.climaDaRota`.
5. **"Um som pra tela inicial e as outras que não sejam o jogo em si"** — o contexto `telas` e a linha única em
   `main.aoClicar`.

**Ficou de fora, por escolha**: volume ajustável (só liga/desliga — o pedido era esse) e qualquer coisa que
dependesse de arquivo de áudio publicado (tudo é sintetizado). `tests/referencias.test.js`: `AudioContext` entrou
em `GLOBAIS_MAIUSCULAS` (mesma lista que já tinha `Audio`).

### A terceira leva (30/09/2026): melodia escrita à mão e o editor
Queixa: *"não estou gostando das músicas, tem algum jeito de eu dar um toque humano nela? Quero interferir e
testar, mas não estou perto do Raspberry Pi."* Duas coisas, e a primeira é a causa de fundo:

**1. A melodia era SORTEADA nota a nota.** Dentro de uma pentatônica nenhuma nota soa errada, então o resultado
era *inofensivo* — e sem rumo: faltava o motivo que se repete, que é o que faz a gente reconhecer uma música.
Agora cada tema tem uma **frase escrita à mão** (`melodia`), numa notação de um token por semicolcheia:
número = grau da escala, `.` = silêncio, `-` = segura a nota anterior. O sorteio virou só tempero (a oitava
ocasional) — altura e ritmo são sempre os escritos. Tema sem `melodia` ainda cai no gerador antigo.
⚠️ A variação de oitava é pra **baixo** (`+0` em vez de `+12`): a primeira versão pulava pra `+24` e teria
desfeito exatamente a correção de agudo da leva anterior. `tests/som.test.js` trava o teto e o formato da frase.

**2. O editor: `musica.html`.** Página de autoria, publicada junto com o site pra funcionar **de qualquer
aparelho** (o pedido era justamente poder mexer longe do Pi). Seleciona tema e contexto, edita a frase, ajusta
raiz/escala/onda/progressão/andamento e o corte de agudo e o volume, ouve na hora, e sai com **o bloco de código
pronto pra colar em `TEMAS`** ou com um **link que carrega exatamente aqueles ajustes** (é assim que o resultado
volta pra cá). Decisões que valem registro:
- **Toca pelo motor de verdade** (`som.js` exporta `tocarPreview`/`ajustarSaida`, e `montarFaixa` aceita um tema
  como OBJETO). Um editor com sintetizador próprio soaria diferente do jogo em uma semana.
- **`tocarPreview` dá `resume()`**: o editor cria o `AudioContext` ao mexer nos controles de saída, e ele nasce
  `suspended` — sem isso o botão Tocar agendava tudo e não saía som.
- **Fora do jogo e fora do buscador**: não está em `PAGINAS` (então `gerar-paginas.mjs` não a toca e ela não
  entra no `sitemap.xml`), não está no `PRECACHE`, não é linkada de lugar nenhum e leva `noindex,nofollow` —
  importante porque a revisão do AdSense está em curso e página fina indexada conta contra.
- O link usa `encodeURIComponent`, **não base64**: `btoa` estoura com acento (o nome "menor harmônica" já
  bastava), e em texto dá pra ler o link e ver o que ele carrega.

**Sobre testar isto sem navegador**: jsdom **não executa `<script type="module">`** — a primeira tentativa
mediu zero e parecia que a página estava morta. O jeito que funciona é extrair o corpo do módulo e importá-lo
com o DOM do jsdom nos globais; e `window.AudioContext` precisa ser posto no objeto `window` do jsdom, não só em
`globalThis` (o código checa `window.AudioContext`, e essa mesma distração já tinha dado falso negativo antes).

### A quarta leva (30/09/2026): transição, tema de batalha e os efeitos curtos
Queixa: *"o problema é relacionado à transição de uma pra outra, tem que ser algo mais claro e ao mesmo tempo
suave, tipo uma transição de um lugar para o outro; também é importante ter uma música marcante durante a
batalha, uma música de derrota, um som de level up, um som de compra de item. Quando selecionar o pokemon na tela
inicial soltar o cry do pokemon. Algo mais fluido e natural e mais imersivo."* Cinco coisas, todas em `som.js`:

**1. A transição.** Um nó de ganho novo, `musica`, entre as notas da trilha e o `master` — é ele que sobe e
desce. `comFade(montar)`: a faixa atual desce em 0,35 s, há um **respiro de 0,2 s de silêncio** e a nova entra
subindo em 0,7 s. O respiro é o que atende o "claro" do pedido — crossfade puro, com as duas se sobrepondo,
passa despercebido justamente por ser contínuo. *Não* é crossfade de verdade (as duas tocando juntas) porque
isso pediria dois agendadores e duas `faixa`s; por 0,2 s de sobreposição não compensa. `trocaId` cancela a
entrada de uma troca que outra atropelou — andar rápido entre rotas dispara várias, e sem isso duas faixas
começariam juntas. Os **efeitos curtos entram no `master`, não no `musica`**: um level up no meio de uma
transição não pode ser engolido pelo fade.

**2. A música de batalha.** O contexto ganhou `melodiaFixa`, e ela **vence a melodia do tema**: música de luta
só é marcante se for a MESMA toda vez. A rota continua entrando pela tonalidade (raiz, escala e progressão do
bioma), então a batalha na caverna e a na praia continuam soando diferentes — muda a cor, não a frase. O editor
(`musica.html`) é a exceção: `tocarPreview` marca o tema com `preview`, e aí a frase do TEMA manda, que é o que
se está ajustando lá.

**3. Os efeitos curtos.** `SFX` é uma tabela de `[atraso, midi, duração]` escrita à mão, tocada por `tocarSfx`
sem passar pelo agendador: `vitoria` (o antigo `tocarStinger`), `derrota` (desce e se arrasta), `nivel` (três
degraus subindo, em `progressao` — seu e dos aliados) e `compra` (duas notas agudas, no `case 'buy'`).
`tocarMusica` reconhece qualquer nome que exista em `SFX`, então `fim.telaFim` chama `tocarMusica('derrota')` do
mesmo jeito que já chamava a vitória. Derrota toca em `desmaiou` e `capturado`; encerrar a jornada por vontade
própria continua em silêncio.

**4. O grito na tela inicial.** `criacao.previewSearch`, logo depois de a espécie resolver. O clique no card é o
gesto que os navegadores exigem, mas o `AudioContext` pode ter nascido `suspended` antes disso (a trilha do menu
já o criou), então `tocarCry` passou a dar `resume()` — sem isso o grito seria agendado num relógio parado.

**Ficou de fora**: volume por categoria (música x efeitos) — o nó `musica` já deixaria isso a uma linha, mas o
ajuste continua sendo um liga/desliga só, como combinado.

### A quinta leva (30/09/2026): som de impacto por tipo, piscada colorida e desligar as animações
Pedido: *"precisa ter um som de dano dos ataques ou efeitos, tipo golpes de fogo quando acertam fazem um som de
labareda, o golpe de vento parece uma lufada de ar e assim por diante, isso nos 2 pokemons, isso acredito que
implica no timing das batalhas também (…) impacto colorido nos sprites e o som, então ter a opção de desabilitar
as animações de combate junto com a desabilitação do som seria uma opção viável."*

**Um gancho, não três.** O motor já tinha `ctx.tremer(m)` — chamado nos cinco pontos em que alguém perde HP por
golpe, e chamado igual pros dois lados (você, aliado, inimigo), porque o motor é único. Ele passou a receber o
TIPO do golpe (`ctx.tremer(m, tipo)`) e o `CTX` do single player faz as duas coisas de uma vez: `ui.shake` (a
animação) e `som.tocarImpacto` (o som). Nada de percorrer a árvore de golpes atrás de "onde toco o som de fogo":
quem sabe que houve dano já era esse ponto.

**O som: dez famílias pra dezoito tipos.** `som.IMPACTOS`, uma linha por família, com os tipos dela listados
dentro — `FAMILIA_DO_TIPO` é *derivado* daí, então não existe segunda lista pra manter em sincronia. Duas peças
por família, e o que define o caráter é a **varredura**, não a frequência parada: `ruido` é ruído branco por um
passa-banda que escorrega de uma frequência a outra (descendo e largo = labareda; subindo = lufada; agudo e
estreito = estalo; grave = pancada), `nota` é um oscilador deslizando, pro lado tonal (o ping do gelo, a
badalada do metal, o lamento do fantasma). Nenhum arquivo de áudio, como o resto do módulo.

O detalhe que quase passou: **tudo sai pelo passa-baixa de 2 kHz do `master`**. O estalo do Elétrico nasceu em
2,3 kHz, o filtro o engoliria e a família perderia exatamente o que ela existe pra ter. Roteá-lo por fora do
filtro custaria uma cadeia de saída nova — mais barato baixar os números e ficar com uma chain só. É o que
`tests/som.test.js` trava agora, junto com "todo tipo tem família" (tipo novo cairia na pancada genérica em
silêncio) e "nenhuma família lista um tipo que não existe" (erro de digitação vira família morta).

**A piscada colorida reusou o que já existia.** `hit-flash` (a piscada de dano, deduzida do sentido em que a
barra de HP mudou) trocou o `#ff4d4d` cravado por `var(--cor-impacto, #ff4d4d)`, e `ui.shake` põe a var com a
cor do tipo (`dados.TC`, as mesmas dos selos). A ordem importa e não dava pra escolher: `render()` remonta a
cena inteira, então uma var posta ANTES do `up(ctx)` iria pro lixo junto com o elemento — por isso `shake`
**reinicia** a piscada depois, já com a cor certa. Dano sem tipo (confusão, o esforço do próprio golpe) fica no
vermelho padrão, que é o fallback da própria var.

**O liga/desliga virou um conceito só, não um segundo.** `ui.REDUCED` (uma const lida uma vez, do
`prefers-reduced-motion`) foi substituída por `ui.semAnimacao()`, que junta a mídia do sistema com
`ajustes.animacoesLigadas()`. Função, não const: o checkbox tem de valer na hora, e uma const lida no
carregamento só valeria depois de um F5. Todos os cinco pontos que consultavam `REDUCED` passaram a chamar a
função — e um deles é o `say`, o que **atende o "implica no timing" de graça**: sem animação pra ver, a pausa
entre as mensagens do combate cai de 420 ms pra 80 ms e a luta anda mais rápido. O caminho contrário — deixar a
batalha mais LENTA pra esperar a animação — não foi preciso: os 420 ms do `say` já cobrem os 0,35 s da piscada e
o meio segundo do som mais longo, e o som não precisa terminar antes da próxima linha de texto.

**Ficou de fora:**
- **Som nos efeitos que não são golpe** (veneno e queimadura no fim do turno, recuo, armadilha de entrada). Eles
  nunca passaram por `ctx.tremer` — nem hoje tremem —, então dar som a eles é um gancho novo em cada ponto, não
  um parâmetro num que já existe. Entra quando alguém reclamar que o veneno é silencioso.
- **Som de impacto no multiplayer.** O `ctx` do `mp-motor` não define `tremer` (não tem DOM), e a sala narra o
  turno por linhas já prontas — o caminho seria tocar por `cls === 'hit'` na `narrar`, sem saber o tipo. Som
  genérico pra todo golpe é pior que nenhum; fica pra quando o evento do motor levar o tipo junto.
- **Animação por tipo** (chama subindo no Fogo, jato d'água): a piscada colorida cobre o pedido com uma var de
  CSS; sprite de partícula por tipo é arte nova, não código.

---

## Sprites da cena: o retângulo escuro e o tamanho de verdade (30/09/2026)
Dois defeitos no mesmo print de celular: um fundo escuro arredondado atrás do Pokémon do jogador, e *"os pokémons
oponentes parecem estar muito maior que o necessário, e ambos estão muito pixelados, acho que pela proximidade"*.

**O retângulo era colisão de nome de classe.** A ficha usava `<div class="me">` e a cena da luta usa
`<div class="side me">` (a sala, `<div class="mp-fila me">`) — o seletor `.me img`, escrito para a ficha, pegava
o sprite em campo e lhe dava `background:var(--panel2)` e `border-radius`. Renomeado para **`.ficha-me`**, que é
o lado com um uso só; renomear a cena mexeria em dois arquivos e numa media query. Lição: classe de duas letras
com significado genérico (`me`, `foe`) só serve **composta** (`.side.me`).

**O tamanho**: `.spr` tinha `object-fit:contain`, que ESTICA a imagem até encher a caixa de 128 px (92 no
celular). Pixel art ampliada 1,6× tem pixel de tamanho irregular — é essa a "pixelação por proximidade". E como
todo mundo enchia a mesma caixa, **a proporção entre espécies sumia**: o Showdown desenha o Meowth bem menor que
um Onix, e a cena apagava isso (o "oponente maior que o necessário"). A troca é de uma palavra:
**`object-fit:scale-down`** = `contain` que nunca amplia, ou seja, imagem menor que a caixa sai no tamanho de
verdade dela (1:1, nítida). Com `object-position:bottom` junto, senão o sprite a que sobra espaço flutuaria no meio
da caixa em vez de pisar no chão. A caixa continua valendo pra quem é MAIOR que ela: o sprite 3D (512 px) e os
GIFs grandes seguem sendo reduzidos pra caber.

---

## Troca de tipo, Endeavor no chefe e a leva de itens (30/09/2026)
Pedido: *"ajuste o move Soak, endeavor para os bosses e adicione itens como Heavy Duty Boots, Air Ballon entre
outros"*. Três frentes independentes.

### Soak: o motivo de `regras.tiposDe` existir
Soak não estava implementado. O problema não era o golpe, era **onde o tipo morava**: 6 lugares liam
`m.data.types` direto, e `m.data` **vem do cache e é compartilhado por toda a espécie** (armadilha já registrada
no CLAUDE.md). Escrever o tipo novo ali contaminaria todo Pokémon daquela espécie e ainda iria junto no save.
Então o tipo trocado mora em **`vol.tipos`** e nasceu **`regras.tiposDe(m)`** como fonte única, usada por quem
decide dano, STAB, imunidade, status, clima e terreno. Ficaram de fora, de propósito, os leitores de
**identidade** da espécie (petisco em `amizade.js`, condição de evolução em `evolucao.js`, a ficha em
`render.js`): quem levou Soak não mudou de espécie.
Entraram 4 golpes: `soak` e `magic-powder` (`viraTipo`) e `forests-curse`/`trick-or-treat` (`ganhaTipo`). Falha
quando não mudaria nada e **em quem terastalizou** (o Tera manda na defesa). Some no fim da batalha junto do `vol`.
Efeito colateral de graça: Soak num Voador tira a imunidade a Terra **e** o põe no chão pro terreno — porque
`noChao` passou a ler da mesma fonte.

### Endeavor contra o chefe: era um atalho que anulava a luta
`danoIgualHp` fazia `t.hp = u.hp` **direto**. Contra o chefe da semana, que tem o HP multiplicado
(`boss.prepararChefe`), bastava estar quase morto pra derrubar quase tudo de uma vez — por cima da couraça de
energia, das reduções de `danoNoChefe` e das fases, que nem chegavam a ser consultadas. Agora o buraco que o
golpe abriria vira **dano comum** e passa pelo mesmo caminho de todo mundo (`danoNoChefe` + `aposDanoNoChefe`).
Contra chefe continua sendo muito dano de uma vez; fora do chefe **nada mudou**.

### Itens: 6 novos, 17 frutas de aperto e 6 de dupla função
Reaproveitando ganchos que já existiam onde dava (`resisteDoItem` ganhou a efetividade como parâmetro; a Lente
de Mira entrou no mesmo degrau de crítico do Focus Energy e do Super Luck).
**A Pedra do Rei foi cortada da leva, e depois voltou de outra forma.** Na primeira tentativa eu criei
`kings-rock` em `ITENS_SEGURADOS` sem notar que o id já era item de EVOLUÇÃO (Poliwhirl/Slowpoke). `ITENS_EVO` é
aplicado a `ITEMS` DEPOIS, então o item da loja virava o de evolução e o efeito de recuo ficava morto — e nenhum
teste reclamou, porque eles olhavam a TABELA e não o `ITEMS` final. Cortei o item e reforcei o teste.

### Item de dupla função (`dados.duplo`)
O usuário apontou o obvio que eu tinha perdido: nos jogos esses itens **são os dois** — a Pedra do Rei evolui
Poliwhirl E dá 10% de recuo na mão. O erro não era ter querido o efeito, era ter **duplicado o id em duas
tabelas** em vez de dar duas funções ao mesmo item. A forma certa:
- **`dados.duplo(name, efeito, quem)`** cria um item com as duas marcas: `segurar` (evolui, é gasto) e
  `segurado` (equipável). Um id só, em `ITENS_EVO`; o efeito de luta mora em `segurados.js` na mesma chave.
- **`IDS_EVO_EM_BATALHA`** é derivada (`ITENS_EVO` filtrado por `segurado`), não escrita à mão: marcar um item
  novo como duplo já o inclui, e o teste cobra um gancho e uma descrição que explique o efeito de segurar.
- **A ordem de `CATEGORIAS_ITEM` mudou**: `evolucao` passou na frente de `segurado`, senão o item duplo (que tem
  as duas marcas) migrava de 💎 Evolução pra 🎒 Para segurar e desaparecia de onde quem procura evolução olha.
  Isso não o esconde pra equipar — o seletor de "Segurar" (`render.js`) filtra por `segurado`, não por categoria.
- **A evolução passou a aceitar o item NA MÃO.** `evolucao.detalheCumprido` lê `ctx.bag`, e equipar tira da
  mochila — então, sem isso, equipar a Pedra do Rei travava a evolução do Poliwhirl sem dizer por quê (e nos
  jogos é justamente SEGURANDO que esses itens evoluem). `progressao.contexto` agora inclui o item da mão na
  `bag` que entrega, e `pagar(o, M)` gasta da mão quando foi de lá que veio.
- **`soEspecie`** nasceu pro Dente/Escama Abissal, que nos jogos só servem ao Clamperl. Ler `seg(m).multStat`
  cru daria o bônus a qualquer um, então `multStatDoItem` faz a checagem e `regras.effStat` passou a chamá-la.

Os 6: Pedra do Rei e Presa Afiada (recuo 10%), Garra Afiada (+1 crítico), Revestimento Metálico (Aço +20%),
Dente e Escama Abissal (At./Def. Especial ×2, só Clamperl). Os demais itens de evolução **não têm** efeito de
batalha nos jogos (pedras, Melhoria, Protetor, Escama de Dragão na era moderna…) e seguem só evoluindo.

Testes em `tests/soak-itens.test.js`, todos pelo motor de verdade. O do Endeavor foi conferido contra a versão
antiga: ele **reprova** o comportamento que estava no ar, que é o que faz dele um teste de regressão de verdade.

### Achar os itens novos explorando (30/09/2026)
Pedido, logo depois: *"as berrys adicionadas, quero se seja possível pegar explorando, outros itens pertinentes
também"*. O problema real era de descoberta: a leva acima entregou 20 frutas e 25 segurados permanentes, e todos
**só existiam na loja**. Quem não tem o hábito de passar na loja — ou quem está numa run sem dinheiro sobrando —
nunca encostava na mecânica. As 17 frutas de aperto por tipo eram o pior caso: são justamente o item que se
entende ACHANDO ("por que eu tenho uma Fruta Yache?") e não lendo uma linha de preço.

**Nada de lista escrita à mão.** `FIND_ITEMS` continua sendo o saco ponderado de sempre (repetição = peso), e as
duas listas novas em `dados.js` são **derivadas** — fruta ou segurado novo na tabela já cai nelas sozinho:
- `FRUTAS_ACHADAS` = tudo que termina em `-berry` em `ITENS_SEGURADOS` + `ITENS_FRUTA_TIPO` (20 itens).
- `SEGURADOS_ACHADOS` = o resto de `ITENS_SEGURADOS` (25 itens permanentes).

A varredura é nessas duas tabelas e **não em `ITEMS`**, de propósito: `ITENS_RAIDE_SEGURADOS` também é
`segurado`, e achar um Núcleo Eternamax no chão tiraria o motivo de enfrentar o chefe da semana. É o que
`tests/segurados.test.js` trava, junto com "as duas listas cobrem a tabela inteira, sem sobra" e "todo item
achável tem efeito em `SEGURADOS`".

**Dois degraus, pelo preço.** Fruta é barata (₽300–1200) e de uso único, então sai em QUALQUER rota — é o mesmo
raciocínio que já tinha posto a `oran-berry` no `FIND_ITEMS`. Segurado permanente é caro e pra sempre, então
entra no degrau que já existia pros itens de evolução: **da 4ª rota em diante**. Um teste guarda a fronteira
(nenhum permanente pode custar menos que a fruta mais cara) — senão o degrau deixa de significar alguma coisa.

**A ORDEM dos ramos do sorteio é comportamento, não estética.** Cada `Math.random()` do encadeado sorteia sobre o
que o anterior deixou passar, então a primeira versão — com a fruta antes do item de evolução — **derrubou a
chance do item de evolução de 19,4% pra 15,8%** sem ninguém pedir. Só apareceu porque eu simulei a distribuição
antes de fechar; o comentário que eu tinha escrito afirmava o contrário ("a chance do item de evolução ficou
intacta") e estava errado. Corrigido pondo o degrau já calibrado primeiro: escama (3%) → evolução → segurado →
fruta → comum. Hoje é ~17% de fruta nas rotas rasas e ~11% nas fundas, com evolução e escama exatamente onde
estavam.

**Também corrigido de passagem**: a mensagem do achado dizia "(item de evolução)" testando `evo || segurar`, e
`segurado` não tinha rótulo nenhum — um Orbe da Vida achado apareceria como item qualquer. Agora existe
"(dá pra segurar)", e o rótulo de evolução vem primeiro porque o item `duplo` (Pedra do Rei e cia.) tem as duas
flags.

**Ficou de fora**: os consumíveis CAROS que a loja vende e ninguém acha (Full Restore, Max Potion, Revive, Max
Ether). Não fazem parte da leva que o pedido cita, e o degrau pra eles seria por PREÇO — uma terceira regra no
mesmo encadeado, que já tem cinco ramos. Entra se for pedido.

### ⚡ Itens rápidos, com hotkey (30/09/2026)
O relato **#68** pediu *"um botão para subir ou descer os itens"* na mochila, igual ao que existe pros golpes. O
usuário trocou o pedido na hora: **"no lugar de botões de subir/descer, quero configurar uma Hotkey para itens
rápidos, onde você pode escolher no máximo 2 itens que vão ficar perto dos botões principais da tela"**. A troca
é melhor pelo motivo que o pedido original já dizia sem dizer: o incômodo não era a ORDEM da lista, era **abrir a
mochila e caçar a Poção a cada turno**. Reordenar encurta a caçada; um atalho fixo elimina.

**Como é**: na mochila (explorando), cada item ganha um botão **⚡**. Marcado, ele aparece como cartão na barra de
ações — junto de *Explorar/Centro/Loja* fora da luta e de *Mochila/Fugir* dentro dela — e responde às teclas
**1** e **2**. São no máximo 2 (`regras.MAX_RAPIDOS`), e a marca vive em **`S.rapidos`**, na jornada: os itens são
da run.

**Decisões**:
- **`regras.alternarRapido` é a regra, e é pura** (testada em `tests/regras.test.js`): marcar de novo desmarca, e
  lista cheia devolve **`null`** em vez de trocar o item mais antigo. Trocar sozinho seria "o jogo mexeu na minha
  escolha"; `itens.marcarRapido` mostra um toast pedindo pra tirar um antes.
- **A tecla clica no BOTÃO** (`$('[data-rapido="1"]').click()`), não chama a ação. Assim tecla e dedo passam pelo
  mesmo caminho — inclusive o `disabled` de quando o jogo está ocupado, que de outro jeito eu teria de repetir no
  handler de teclado. Não vale com modal aberto nem com foco num campo de texto (ali o "1" é do campo).
- **Item que não serve no momento continua na barra**, habilitado. `useItem` já responde "esse item só funciona
  durante uma batalha" / "não dá pra evoluir no meio de uma batalha", e o `turn()` não gasta o turno quando o item
  falha (`if (!(await useItem(...))) return`). Filtrar por contexto exigiria repetir em `render.js` a lista de
  flags que o `useItem` já conhece — duas fontes da mesma verdade, pra ganhar um botão cinza.
- **Item que acabou sai da barra e a marca fica.** `rapidosAtivos()` filtra por `bag[k] > 0`: comprou outra Poção,
  o atalho volta sozinho. Desmarcar por ter acabado o estoque faria o jogador reconfigurar a cada compra.
- **Só 2, e não N configuráveis**: é o que o pedido diz, e é o que caber em duas teclas garante. Subir o teto é
  mexer em `MAX_RAPIDOS` e em mais nada.

---

## Anúncios (AdSense) e privacidade

### Anúncios (Google AdSense) e Política de Privacidade (27/09/2026)
Pedido do usuário: monetizar o site com ads. **Decidido não perseguir a Play Store** (avaliei a complexidade —
TWA/Bubblewrap é barato tecnicamente, mas conta pessoal exige teste fechado com 12 testadores por 14 dias
corridos antes de publicar, e o risco de marca do Pokémon fica bem mais visível virando app publicado — o
usuário optou por focar só no site). `js/ads.js` é a estrutura pronta, **desligada por padrão**: mesmo gate do
Supabase (`config.ADSENSE_CLIENT_ID`, marcador = nada roda). Quando a conta existir: preencher o client id +
`AD_SLOT_INICIO` (`criacao.js`) com o id da unidade de anúncio.
**O jogo NUNCA carrega o script do Google antes do consentimento** (exigência da política de consentimento da UE
— GDPR): `ads.iniciarAds()` (chamado no boot, `main.js`) só mostra um banner fixo (`.cookie-banner`, não é modal,
não trava o jogo) se `adsConfigurado()` e ainda não houver escolha salva (`pokerpg-consentimento-ads`); só
`aceitar` chama `carregarScript()`. Escolha mudável depois em `⚙ Ajustes` (`htmlAds()`, só aparece com conta
configurada). `blocoAds(unitId)`/`ativarSlots()` desenham e ativam um slot — sempre vazio sem config ou sem
consentimento, nunca um `<ins>` "morto" esperando.
**Tela 🔒 Privacidade** (`js/tela-privacidade.js`, nova entrada em `navegacao.TELAS`) é pré-requisito de
aprovação do AdSense — texto explica o que cada serviço (localStorage, Supabase, PokéAPI, AdSense) coleta, sem
juridiquês. Escrita ANTES de qualquer anúncio existir de verdade, porque é isso que a revisão do Google confere.
`ads.js`/`tela-privacidade.js` entraram no PRECACHE do `sw.js` (regra de sempre: arquivo novo em `js/` = entra lá).


---

## Desenho original da Mega (antes de implementar)

### 4b. Mega Evolução (desenho original)
1.000 golpes finais **sendo a espécie que megaevolui de fato** (Charizard, não Charmander). **Uma missão por Mega**: com X e Y, a tela de Conquistas tem um botão "contar para a X", trocável a qualquer momento, e o que foi acumulado numa não migra pra outra. Desbloqueada, a Pedra **ocupa a vaga de item segurado**. 1× por batalha. As ~30 habilidades que as Megas concedem entram JUNTO, senão metade das Megas nasce inerte.



---

# Detalhe que saiu do CLAUDE.md na faxina de 29/09/2026

O CLAUDE.md foi de ~50k pra ~6k tokens. As ARMADILHAS viraram uma linha cada lá; o detalhe de cada arquivo e de
cada mecânica está preservado aqui, palavra por palavra, como estava antes. Consulte ao mexer na área.

## Tabela de arquivos, completa (versão anterior)

## Estrutura

| Arquivo | Papel |
|---|---|
| `index.html` | Esqueleto: header (`#topr` + `#conta-chip`), `#app`, aviso de `file://`, carrega `js/main.js`, registra `sw.js`. |
| `sw.js` | Service worker do modo offline (ver "Modo offline"). |
| `README.md` | Página do projeto (o que tem + próximos passos). **Atualizar a cada funcionalidade nova.** |
| `css/estilo.css` | Todo o CSS. |
| `img/` | `logo.png` (topo), `favicon-32.png`, `icone-192.png` (favicon / atalho no celular). |
| `js/main.js` | Ponto de entrada: listeners delegados (`data-act`/`data-v`) e `boot()` (carrega save ou abre criação). |
| `js/estado.js` | `G` = estado mutável compartilhado (`S` save, `B` batalha, `PV` prévia, `mode`, `busy`, `panel`), `zone()`, `nm()`, `save()`. |
| `js/util.js` | `rand`/`pick`/`clamp`/`sleep`/`fmt`/`esc`/`lastSeg`/`store`. Sem DOM. |
| `js/dados.js` | Tabelas fixas: tipos (`CHART`, `TYPE_PT`, `TC`), `NATURES`, `ITEMS`, `ZONES` (= rotas de `dados-mapas.js`), `FLAVOR`, `MISSOES`, `DIFICULDADES`… Sem DOM. `ITEM_SPR(n)` monta a URL do sprite do item; vários itens de Gen 8/9 (Coroa Galárica, Armadura Auspiciosa, Pote Rachado…) **não existem** no repositório de sprites da PokéAPI, então toda `<img>` de item usa `onerror="${ITEM_ERRO}"` e cai no `ITEM_SPR_RESERVA` (SVG embutido de caixinha). Antes a figura quebrada era só escondida e ficava um buraco — parecia bug de tela. |
| **Rede instável** | `api.getJSON` tenta 3× com pausa (400ms, 800ms) em falha de REDE e em 429; 404/500 não repetem. `apiErr(e)` escreve pro JOGADOR: `file://` → instrução de servidor; `navigator.onLine === false` → sem internet; 429 → "pediu calma"; com `code` → erro do servidor; sem `code` → conexão instável. Todas as mensagens de falta de dado apontam pra **⚙ Ajustes → Jogar offline** (offline.js). Relato real que motivou isso: celular em 5G oscilando mostrava "Failed to fetch" e a antiga mensagem falava de abrir o jogo dentro de um chat. |
| `js/tutorial.js` / `js/tela-tutorial.js` | **❓ Tutorial** (tour guiado + demonstração, ver "Próximos passos combinados" pra decisão completa). `tutorial.js` puro (`tests/tutorial.test.js`): passos (`TUT_PASSOS`), dados de mentirinha (Pichu/Caterpie/Treinador Theo) e a lógica de golpe/compra/captura — `resultadoCaptura`/o resumo de Runs leem `dados.DIFICULDADES` direto, nunca duplicam o texto. `tela-tutorial.js` desenha em `G.tut` (nunca `G.S`); `telaTutorial()` chama `nuvem.salvarTutorialVisto()` (idempotente) assim que abre. Aberto sozinho no `boot()` de main.js só na primeiríssima visita (sem save); sempre disponível de novo em `navegacao.TELAS` (`❓ Tutorial`). |
| `js/navegacao.js` / `js/ajustes.js` / `js/tela-ajustes.js` | **Navegação e ajustes.** `TELAS` é a ÚNICA lista de telas: `barraTelas(atual)` usa nas telas e `render()` usa no `#topr` (o menu ☰ do celular) — tela nova entra lá e aparece nos dois. `barraTelas(atual)` monta a MESMA barra no topo de toda tela fora do jogo (criação, carreira, saves, ranking, mp, conta, ajustes, relatos): `← Voltar` (`rotuloVoltar()`: pro jogo se há `G.S`, senão pro início) + atalhos pras outras (`TELAS`). Tela nova = incluir `barraTelas('id')` e pôr a entrada em `TELAS`. `Esc` clica no botão de voltar (main.js keydown, fora de explore/battle/create e sem modal aberto). `🏠 Início` com jornada aberta não perde nada: `iniciarJornada` guarda a atual (saves.js) antes de trocar. Fonte: `ajustes.js` (`FONTES`, `aplicarFonte` troca as variáveis CSS `--display`/`--body` e injeta o link do Google Fonts; escolha em `pokerpg-fonte`), aplicada no boot de main.js; tela em `tela-ajustes.js` com cada opção escrita na própria fonte. `tests/ajustes.test.js`. |
| `js/offline.js` | **Baixar um mapa pra jogar offline.** `alvosDaGen(gen)` = todo id do mapa (pool + Alfas + lendários; puro, `tests/offline.test.js`), `quantoFalta`/`jaBaixado` usam `api.pokemonEmCache`, `baixarGen(gen, aoAndar, sinal)` busca em lotes de 6: `loadPokemon` (cai no localStorage), os golpes do learnset até o nível 60 (`loadMove`, deduplicados num Set) e os sprites — pra sprite basta um `fetch(..., {mode:'no-cors'})`, que o service worker guarda no cache EXTERNOS. UI em `tela-ajustes.js` (`htmlOffline`/`baixarMapaOffline`, clique `baixar-gen`). `baixarTudo`/`quantoFaltaTudo`/`totalDoJogo` fazem o mesmo pros 9 mapas de uma vez (botão "⬇⬇ Baixar o jogo inteiro"), o que só passou a ser possível com o cache no IndexedDB (ver `js/api.js`): no localStorage isso estourava a cota e falhava calado. |
| **Clima** | `regras.CLIMAS` (sol/chuva/areia/granizo/neve) + `CLIMA_TURNOS` (5). Estado no **campo da batalha**, compartilhado pelos dois lados: single player `G.B.campo` (exposto como `CTX.campo`, getter em efeitos.js), multiplayer `estado.campo` (mp-motor). `climaDe(campo)` só devolve o clima com `turnos > 0`. Entra em: `calcDamage(u,t,move,clima)` (`multClima`), `effStat(m,stat,crit,atacando,clima)` (`multStatClima`: habilidade + `CLIMAS.defesaDe` por tipo), `chanceAcerto(move,u,t,clima)` (`PRECISAO_CLIMA` + `escondeNoClima`), `golpe.fimDeTurno` (dano de areia/granizo por `danoClima`, `curaClima`, `danoClimaProprio`, `curaStatusClima`) e `aplicarStatus` (`semStatusClima` = Leaf Guard). `mudarClima(clima, ctx, quem)` liga (golpe com `especiais.clima` ou habilidade `climaAoEntrar` em `intimidar`/1º turno do MP) e `passarClima(campo, ctx)` gasta um turno no fim da rodada (batalha.js e mp-motor). **Ao mexer em velocidade, lembrar do clima**: a ordem do turno usa `effStat(..., clima)` nos dois motores. `tests/clima.test.js`. |
| **Lado do campo** | `campo.lados = { jogador, inimigo }` (MP: `A`/`B`), criado sob demanda por `golpe.ladoDoCampo(ctx, m)` — o `ctx` diz o lado com `ctx.ladoDe(m)` (efeitos.CTX no single player; `ladoDe(s, m.ref)` no mp-motor). Forma em `regras.LADO_VAZIO()`: telas `reflect`/`luz`/`veu`, `salvaguarda`, `neblina`, `vento` (turnos) e armadilhas `pedras`/`espinhos`/`toxinas`. Lidos por `multTelas` (em `calcDamage`, 6º parâmetro = lado de QUEM DEFENDE), `temSalvaguarda` (em `aplicarStatus`, que agora recebe `fonte` — status próprio, tipo Rest, passa), `temNeblina` (em `mudarEstagios`), `multVento` (na ordem do turno dos dois motores) e `aplicarArmadilhas` (chamada em `win()` quando o treinador/lendário manda o próximo; se ele cai só com a armadilha, `win()` se chama de novo). `passarLados` no fim da rodada. Golpes em `especiais.js` (`lado`, `soNoGelo`, `armadilha`). **Do lado do jogador ninguém troca de Pokémon**, então armadilha ali é inerte — o golpe avisa isso em vez de fingir (`ctx.trocaDePokemon`). Cuidado com o nome: `espetos` é o Elmo Rochoso (item), `espinhos` é o Spikes (campo). `tests/lado-campo.test.js`. |
| **Terrenos** | `regras.TERRENOS` (eletrico/grama/psiquico/fada) + `TERRENO_TURNOS` (5), no MESMO objeto `campo` do clima (`campo.terreno`/`campo.terrenoTurnos`). **Regra de ouro: só afeta quem está no chão** — `noChao(m)` (não é Voador e não tem Levitate) é checado em `multTerreno`, `terrenoBloqueiaStatus`, `multStatTerreno`, na cura do Campo de Grama e no bloqueio de prioridade do Campo Psíquico. Entra em `calcDamage(u,t,move,clima,terreno)`, `effStat(..., clima, terreno)`, `aplicarStatus` e `golpe.fimDeTurno`. `mudarTerreno`/`passarTerreno` espelham os do clima (golpes com `especiais.terreno`, habilidades `terrenoAoEntrar`). `tests/terrenos.test.js`. |
| **Celular (batalha)** | `render()` liga `body.em-batalha`; o resto é CSS no bloco "celular" (`@media(max-width:880px)`): só a `.scene.battle` é `position:sticky;top:0` (teto de 38vh, com rolagem própria), sprites e golpes compactos, e TODO o resto da página (ações, registro, painéis) rola normalmente por baixo. Fora da batalha, só `#actions` é sticky. **Já existiram abas** ⚔ Luta / 💬 Registro / 📋 Painéis (`abaMobile`, `ABAS_MOB`, classes `body.mob-*`) que escolhiam o que ocupava o meio da tela: **removidas a pedido de quem joga** — cada aba escondia dois terços da tela (ver a ficha de um aliado exigia perder a batalha de vista), e a barra ainda comia uma faixa justo no aparelho mais apertado. Antes disso elas já tinham dado outro bug: o conteúdo nascia abaixo da dobra e os botões pareciam mortos. **Não reintroduzir "esconder painel por aba"**: o problema que elas resolviam ("não vejo o Pokémon enquanto escolho o golpe") está resolvido pela cena presa no topo, sem esconder nada.

**Celular DEITADO (28/09/2026)**: o bloco "celular" acima foi pensado pra RETRATO — cena presa no TOPO, resto rola embaixo — e em paisagem (tela larga e baixa) isso sobraria pouquíssima altura pro resto. Gatilho por `@media(orientation:landscape) and (max-height:500px)` (altura, não largura: um celular deitado pode passar de 880px de largura e continuar precisando do mesmo tratamento; telas realmente altas — tablet/desktop landscape — ficam de fora). Na batalha, a cena vira uma COLUNA fixa à ESQUERDA (`grid-template-columns:minmax(180px,36%) 1fr`, sticky, altura quase inteira da tela) e tudo mais (golpes, painéis, log) numa coluna à direita que rola. **`.stage{display:contents}`** é o truque que torna isso possível: `#scene` mora DENTRO de `.stage`, que é IRMÃO das zonas esq/dir (não pai) — sem "abrir" o `.stage` pro grid do `.game`, `#scene` não teria como virar uma coluna própria (mesma técnica já usada em `.menu-links` no topo do celular). `order:-2`/`order:-1` em `#actions`/`.zona[centro]` colocam os botões de golpe ANTES dos painéis da esquerda/direita na coluna 2 (senão a ordem do DOM enterraria os golpes embaixo da ficha/mochila). Fora da batalha, o mesmo gatilho de altura também entra na condição do bloco "celular" normal (`@media(max-width:880px),(orientation:landscape) and (max-height:500px)`) — sem isso, as 3 colunas do desktop (mais de 1100px de largura mínima) ficavam cortadas num celular deitado mais largo que 880px. |
| **Batalha no save** | Recarregar a página apagava `G.B` — dava pra fugir de treinador/Alfa/lendário e de uma derrota no Roguelike com F5. `estado.save()` grava `S.batalha = ganchosSave.serializarBatalha(G.B)` (batalha.js; `caidos` é Set e volta vazio) e `main.abrirJornada` restaura com `restaurarBatalha` — reapontando `B.enemy` pra `trainer.equipe[atual]`, senão viram dois objetos e o dano vai só pra um. |
| **Segredo do brilho** | `regras.bonusShiny(S)`/`multShiny(S)`: jogador shiny (1/4096, sorteado no `makeMon` da criação como pra qualquer Pokémon) ganha **XP e dinheiro em dobro** (`win()` em batalha.js: xp, dinheiro, prêmio de treinador e de Alfa) e **Centro Pokémon de graça** (`estado.centroPokemon`). **É segredo**: não entra no README nem nos patch notes — quem tirar um shiny descobre jogando. |
| **🎯 Caça Shiny** | Modo ligado só na criação (`G.cacaShiny` → `S.cacaShiny`; `S.caca = { rota: speciesName }`). `mapas.js`: `rotaLiberaCaca(z, saber)` exige TODA espécie não-mítica/não-lendária da rota revelada (`REVELA_DERROTADOS`), `progressoCaca` mostra o quanto falta, `cacaDaRota(S, z)` diz quem está sendo caçado; `batalha.sortearOponente` força essa espécie (respeitando o cache no offline). UI em `render.blocoCaca`, clique `data-act="caca"`. `tests/caca-shiny.test.js`. **✅ CORRIGIDO (28/09/2026) — bug real relatado pelo usuário: "a rota nunca libera a opção de escolher quem caçar".** Reproduzido o mecanismo inteiro com jsdom (rota revelada, caça ligada, forçando o ramo de encontro selvagem): o motor de "travar a espécie" (`especieForcada`/`sortearOponente`) sempre funcionou certo. O bug real estava em `cacaveisDaRota`: excluía `mitico` da exigência de revelar ("derrotar 10 Mew não é razoável"), mas **não excluía `lendario`** — mesma razão, mesmo esquecimento. Só importa na prática pro **Santuário** (11ª rota, `posVitoria`): é a ÚNICA rota cujo `pool` mistura lendários (rotas 1–10 guardam os lendários em `z.lendarios`, fora do sorteio selvagem) — exigir 10 derrotas de um Mewtwo com peso ~0,2% no pool nunca fecha de verdade, então a caça no Santuário travava pra sempre num "quase lá". Corrigido: `cacaveisDaRota` agora filtra `!p.mitico && !p.lendario`; `render.blocoCaca` (a lista de espécies OFERECIDAS pra escolher, linha separada que tinha o mesmo filtro incompleto) ganhou a mesma exclusão, pra não oferecer um alvo praticamente impossível de manter em cena. `tests/caca-shiny.test.js` ("lendário no pool... também fica de fora"). |
| **Repelentes** | `ITENS_REPELENTE` (dados.js: `repel` seletivo 30 passos, `max-repel` total 40) → `S.repelente = { tipo, passos, especie? }`, usados por `itens.usarRepelente`. Em mapas.js: `repelenteAtivo`, `semSelvagens(S, z)`, `especieForcada(S, z)` (repelente na frente da Caça Shiny) e `gastarRepelente(S)` (um passo por exploração). `mundo.explore` troca SÓ o ramo do encontro selvagem por ambientação — o sorteio de treinador/item/dinheiro é o mesmo de sempre (pedido explícito do usuário, vale também pra Caça Shiny). |
| `js/segurados.js` | **Itens segurados** (puro, `tests/segurados.test.js`). `M.item` = id em ITEMS; `SEGURADOS` = tabela de ganchos (mesma ideia de habilidades.js): `multDano` (+`soFisico`/`soEspecial`/`soSuperEfetivo`), `multStat`, `semStatus`, `recuoPorGolpe`, `drenaDano`, `espinhos`, `aguentaCheio`, `curaFimTurno`(+`soTipo`/`danoFimTurno`), `curaEm`, `curaStatus`, `gastaNoUso`, `statusFimTurno` (Orbe de Fogo/Tóxico, ver abaixo). Lidos em `regras.effStat`/`calcDamage` (`multDanoDoItem`) e em `golpe.js` (durante o golpe: Faixa de Foco, Sino-Concha, Orbe da Vida, Elmo Rochoso, `comerFruta` depois do dano; no fim do turno: `fimDeTurnoDoItem` + `statusDoItem` + `comerFruta`). Equipar/tirar em `itens.js` (`equiparItem`/`tirarItem`), botão na ficha (`blocoItem` em render.js, `data-act="tirar-item"` com `'p'` ou índice do aliado). Item de dados em `dados.ITENS_SEGURADOS` (`segurado: true`). **MP copia `item` desde 28/09/2026** (`mp-motor.fotoDoMon`) — ver "Itens no multiplayer" abaixo. **✅ FEITO (28/09/2026) — Orbe de Fogo / Orbe Tóxico** (pedido do usuário: "Flame Orb e outros itens desse estilo"): se auto-infligem queimadura/veneno GRAVE a cada fim de turno sem status nenhum — `segurados.statusDoItem(m)` devolve o status de verdade (`'toxic'` vira `'poison'` pra `aplicarStatus`; golpe.js soma `vol.toxico = 1` na mesma chamada que já faz isso pro golpe Toxic), chamado logo depois do bloco de Restos/Lodo Negro em `golpe.fimDeTurno`. Reaproveita `aplicarStatus` de propósito (não uma versão simplificada): cobre imunidade de tipo (Fogo não queima, Venenoso/Aço não envenena) e Safeguard/terreno de graça, sem duplicar nenhuma regra. **Dupla canônica dos jogos**: sinergiza com Guts/Flare Boost/Toxic Boost/Quick Feet/Marvel Scale, todas já implementadas — "punição" que vira vantagem pra quem monta em cima disso. Outros itens "desse estilo" (Quick Claw, itens Choice, Iron Ball, Eviolite…) ficaram de fora desta leva — cada um pede mecânica nova (RNG na ordem do turno, travar escolha de golpe, saber se a espécie ainda evolui…), não só um gancho a mais na tabela.

**✅ FEITO (28/09/2026) — os 4 itens que ficaram de fora da leva anterior**, cada um com a mecânica nova que pedia:
- **Garra Rápida** (`quickClaw`): 20% de chance por turno de agir primeiro DENTRO da própria prioridade (não fura quem tem prioridade maior). `regras.ativouQuickClaw(m, sorte)` (`CHANCE_QUICK_CLAW = 0.2`) é sorteada UMA vez por Pokémon ao montar a lista de ações (`batalha.js` e `mp-motor.js`, no mesmo `.push`/`.map` que já monta `{prio, vel}`) e vira um campo `rapido` a mais na ação; `regras.ordenarAcoes` ganhou um critério de desempate NOVO entre prioridade e velocidade — `rapido` primeiro, e se os dois lados tiverem a Garra (os dois ativaram), a velocidade ainda decide entre eles. `tests/regras.test.js`.
- **Faixa/Óculos/Lenço Escolha** (`choice`, + `multStat` que já existia pro bônus): trava no PRIMEIRO golpe de verdade usado. `golpe.usarGolpe` seta `u.vol.escolha = g.name` logo depois de "X usou Y!" (Struggle nunca trava — é golpe de emergência) — o NOME é do golpe BASE, capturado ANTES de `executar()` transformar Weather Ball/Tera Blast/Water Shuriken por tipo, então a trava sempre compara contra o nome estável. **A trava é só de UI, não do motor**: os três lugares que desenham os botões de golpe (`render.js`, `arena.js`, `multiplayer.js`) desabilitam todo golpe que não é o travado (e mostram "🔒 Travado em X"), com um cuidado extra — se o golpe travado ficar sem PP, Struggle aparece igual (senão a trava deixaria sem NENHUM botão clicável); o motor em si confia na UI e nunca re-valida o `g` recebido, o MESMO padrão de confiança que já valia pro PP (golpe com 0 PP também só é travado do lado de fora). **Aliados** (`golpeDoAliado`, regras.js): ganhou um 6º parâmetro `travado` — se o aliado já está travado, a IA de `ordem` nem escolhe (senão a trava se desfaria sozinha, turno a turno); `parado`/`fora` continuam valendo mais que a trava. **Destrava ao reviver**: `mp-motor.reviverCompanheiro`/`reviverNoEvento` já davam `m.vol = freshVol()` (destrava de graça); o Revive do single player (`itens.js`) NÃO reseta `vol` nenhum historicamente — só apaguei `vol.escolha` especificamente ali, sem mexer no resto do `vol` (fora do escopo deste pedido). `tests/regras.test.js` (`golpeDoAliado` travado) e `tests/habilidades.test.js` (o motor via `usarGolpe`).
- **Bola de Ferro**: só Velocidade -50% (`multStat`). **Simplificação assumida**: nos jogos de verdade também torna o portador "no chão" (perde imunidade a golpe de Terra, mesmo voador ou com Levitate) — ficou de fora porque mexeria na imunidade de tipo do motor único (`typeEff`/`ht.imuneTipo` em `golpe.js`, usada em TODO golpe do jogo), risco maior que o ganho pro uso mais comum do item (Trick Room).
- **Eviolite** (`eviolite`): Defesa/Def. Especial ×1.5, só se a ESPÉCIE ainda evolui. Puro problema de dado: saber "ainda evolui" em batalha (`regras.effStat`, síncrona) sem buscar a árvore de evolução da PokéAPI no meio do turno (~550 requisições encadeadas só pra montar isso uma vez). Resolvido do MESMO jeito que as flags de golpe: `ferramentas/gerar-evolucao-restante.mjs` lê `pokemon_species.csv` do repositório-fonte da PokéAPI (`evolves_from_species_id`) numa passada só — uma espécie "ainda evolui" se ALGUMA OUTRA aponta pra ela nesse campo — e gera `js/dados-evolucao-restante.js` (`AINDA_EVOLUI`, 457 espécies). `segurados.multEviolite(m, stat)` é um gancho À PARTE de `multStat` (não dá pra usar o genérico: o multiplicador depende da espécie seguradora, não é fixo por item), chamado direto em `regras.effStat`. Não inclui formas regionais/variedades (o CSV é por espécie — a mesma chave que Pokédex/caça/registro já usam); uma forma regional herda a resposta da espécie base. `tests/regras.test.js`. |
| `js/dados-patchnotes.js` / `js/tela-patchnotes.js` / `js/novidades.js` | **Notas de atualização** (tela 📜 Novidades). `PATCH_NOTES` é escrito À MÃO, mais novo primeiro: `{ versao, data (AAAA-MM-DD), titulo, piada, secoes: [{ nome: 'Novidades'\|'Correções'\|'Equilíbrio', itens: [texto] }] }` — formato garantido por `tests/patchnotes.test.js` (versões únicas, ordem decrescente, itens com mais de 20 letras). Texto PRA JOGADOR: nada de nome de arquivo/função, e cada versão leva uma piada. **Toda leva de mudanças deve virar uma versão nova aqui.** `novidades.js` guarda só o "já li" (`pokerpg-patch-visto`) porque navegacao.js e a tela se importam. |
| `js/evolucao.js` | **Evoluções especiais** (puro, `tests/evolucao.test.js`). `detalheCumprido(d, M, ctx)`/`evolucoesPossiveis(node, M, ctx)` avaliam os detalhes da PokéAPI (`api.slimEvo`, cache `evo2:`, raiz com `v: 2`; árvore de save antigo é rebuscada em `arvoreDe`). Gatilhos: `level-up`, `use-item`, `trade` (Cabo de Conexão), `pos-batalha`. Condições cobertas: nível, item, item na mochila (`held_item` → `consome`), golpe/tipo de golpe, `min_happiness`/`min_affection` (vínculo `M.felicidade`, começa em 70, aliado 120, +5/+3/+2 por nível e +1 por vitória), hora real (`periodoDoDia`, dusk = 17h), espécie/tipo na equipe, Ataque×Defesa. **Não suportado** (e por isso ignorado): local, chuva, de cabeça pra baixo, beleza, gênero (ignorado = sempre vale) e `level-up` SEM condição nenhuma (na API é o campo magnético de Magnezone/Probopass/Vikavolt — evoluiria em qualquer nível; eles têm Pedra do Trovão). `EVO_ALTERNATIVAS` dá regra equivalente aos 19 casos que o jogo não tem (contadores `M.vol.criticos`, `M.vol.danoSofrido` em golpe.js; `M.recuoTotal`; `M.passos` em mundo.js; `registro.derrotados`; dinheiro). Fluxo: `progressao.checkEvolution(M, extra)` (nível e pós-batalha) e `evoluirComItem(id)` (item/Cabo, chamado por `itens.useItem`). Itens em `dados.ITENS_EVO` (fundidos em `ITEMS`): `evo` (usar), `troca` (Cabo), `segurar` (fica na mochila e é gasto ao evoluir). **Shedinja** (`casulo()` em progressao.js): ao escolher `ninjask`, se há vaga em `S.aliados` o Shedinja é criado e entra como aliado; equipe cheia = `ask` de qual dos dois o próprio Pokémon vira. |
| `js/saves.js` / `js/tela-saves.js` | **Jornadas salvas**: a atual continua em `SAVE_KEY`; as outras em andamento ficam em `pokerpg-saves-guardados-v1` (`{id: S}`, até `MAX_GUARDADAS` = 12). `excluir(id)` lembra o id em `pokerpg-saves-excluidos-v1` pra apagar da nuvem na próxima sincronização (offline) e não ressuscitar. Na nuvem, `saves` tem chave `(user_id, jornada_id)` — uma linha por jornada (o `schema.sql` migra a chave antiga). `nuvem.js sincronizarSaves` executa `reconciliarSaves` (puro, `tests/saves.test.js`): mesma jornada = vale a mais nova; terminada/excluída = apaga; desconhecida vinda da nuvem = `ganchos.oferecerSave` → 'continuar' (a atual vai pras guardadas) / 'guardar' / 'excluir'. **Nada é descartado sem o jogador escolher.** Com o schema antigo (erro 42P10 no upsert), cai pro modo uma-jornada-por-conta e só a atual sobe. Tela: `telaSaves()`; cliques `saves`/`save-guardar`/`save-continuar`/`save-excluir` em main.js (`guardarAtual`, `continuarGuardada`). "Novo jogo" oferece guardar ou encerrar. |
| `js/mapas.js` / `js/dados-mapas.js` | Mapas por Gen (ver "Mundo e progressão"). `dados-mapas.js` é gerado por `ferramentas/gerar-mapas.ps1`. **Iniciais fora das rotas**: `tirarIniciais(GENS)` roda UMA vez ao carregar o módulo e tira dos pools os 27 iniciais das 9 regiões e as evoluções deles (`ehInicialDeRegiao(id)`: cada trio ocupa ids seguidos a partir do primeiro, 1-9, 152-160, …). Pikachu e Eevee ficam — são a região marcada `nasRotas: true` em `REGIOES_INICIAIS` (dados.js). Alfa que era inicial vira o bicho mais raro do pool, no mesmo nível; rota que fica com menos de `MIN_POOL` (5) empresta das rotas vizinhas do mesmo mapa (`completarPool`, 2ª passada — na 1ª todas as rotas já foram limpas, senão uma vizinha suja emprestaria justo o inicial recém-tirado). O gerador aplica a MESMA regra (`EhInicial` em gerar-mapas.ps1), então dados regerados já nascem limpos. `especiesDaGen(gen)` = todas as espécies do mapa sem repetir, sem mítico e **sem o Santuário**, usada pelos treinadores. **Santuário (11ª rota de cada mapa, `posVitoria: true`)**: pool com TODA a Gen — espécies comuns, iniciais, lendários, míticos e as 53 formas regionais —, peso pela taxa de captura, gerado junto com o resto em `gerar-mapas.ps1`. É o que garante completude: qualquer espécie que ficasse de fora das 10 rotas cai ali. `regras.zonaLiberada(z, nivel, S)` ganhou o 3º parâmetro por causa dele: rota `posVitoria` ignora nível e exige `S.gensVencidas.includes(z.gen)`; **sem `S` fica trancada** (padrão seguro — todos os chamadores passam `G.S`). `tirarIniciais` e `especiesDaGen` PULAM rotas `posVitoria` — se um dia alguém varrer rotas pra filtrar conteúdo, tem de pular também, senão o Santuário deixa de cumprir o papel. **Formas regionais**: na PokéAPI são variedades de `pokemon` com id > 10000, não espécies; a entrada do pool é `{ id: 10100, n: 'raichu', f: 'raichu-alola' }` — `n` continua sendo a ESPÉCIE (chave do registro/Pokédex/caça, que o jogo inteiro já usa) e `f` só o nome mostrado (`pokedexDaRota` devolve `nome: f || n`). Formas de Tauros de Paldea ficaram de fora: o nome delas não termina em `-paldea`. **Roguelike + Santuário**: vencer os lendários grava `S.genVencida` NA HORA (não no fim da run) e pergunta se encerra em vitória ou segue no Santuário (`S.aposVitoria`, botão `encerrar-vitoria` nas ações). Quem segue e morre lá termina em derrota **sem perder a Gen**: `encerrarJornada` injeta `genVencida` do save e `gensLiberadasRoguelike` aceita `j.genVencida` mesmo com `motivo !== 'venceu'`. **Lendário selvagem no Santuário** aceita petisco (é o que torna o desbloqueio por amizade possível), mas `ganhoAmizade(..., lendario)` divide o ganho por `DIVISOR_AMIZADE_LENDARIO` (4, piso 1) — `batalha.startBattle` marca `E.lendario` pelo `l`/`m` da entrada do pool. |
| `js/regras.js` | **Fórmulas puras** (testadas): `calcStats`, `calcDamage`, `effStat`, `typeEff`, `chanceAcerto`, `consegueFugir`, `jogadorAgePrimeiro`, `danoResidual`, `imuneAoStatus`, `xpPorVitoria`, `ganhoDeEVs`… |
| `js/api.js` | PokéAPI com cache: memória (`memo`) + **IndexedDB** (`pokerpg-cache`/`dados`), com `localStorage` `pk:*` só de reserva (navegador sem IndexedDB) e migração automática do que já estava lá. `iniciarCache()` roda antes do boot (main.js), monta o índice `chavesGuardadas` (é o que `pokemonEmCache`/`idsEmCache`/`itensNoCache` leem, sem ir ao banco) e pede `navigator.storage.persist()`. `espacoUsado()` = `storage.estimate`, mostrado em ⚙ Ajustes. Saiu do localStorage porque os ~5 MB dele não cabiam o jogo inteiro e o `store.set` falhava calado. `buildLearnset`/`slimPokemon`/`slimMove` continuam puras (testadas). |
| `js/ui.js` | `$`, `REDUCED`, log (`log`/`say`/`logRaw`), modal `ask`, `shake`. |
| `js/render.js` | `render()` (re-render total: conteúdo dos painéis, cena e ações), `buildGame()`, `badge`, `spriteFrente`. |
| `js/layout.js` | Modelo puro do layout dos painéis (zonas, larguras, alturas, recolhidos). Testado. |
| `js/paineis.js` | Painéis na página: esqueleto, aplicar layout, arrastar, ▲▼⇄▾, divisórias, restaurar. |
| `js/pokemon.js` | `makeMon(data, level, opt)` — instância jogável (jogador e selvagem). |
| `js/efeitos.js` | `changeStats`, `inflict`, `healFull` — efeitos com narração, usados pela batalha e pelos itens. |
| `js/batalha.js` | `turn(action)` (único ponto de entrada da UI), `useMove`, `startBattle`/`startTrainerBattle`, bola do treinador, vitória/derrota/captura, `endBattle`. **Equipe de treinador não é só da rota**: `sortearDoTreinador(z)` tira `CHANCE_FORA_DA_ROTA` (50%) de cada membro de `mapas.especiesDaGen(z.gen)` — qualquer espécie do mapa, sempre no NÍVEL da rota — e o resto do pool da rota, que mantém a cara do lugar (o treinador andou até ali; a rota diz o nível, não quem ele criou). Vale pra todo treinador de rota. Offline, filtra pelo que está guardado. |
| `js/progressao.js` | `gainExp`, aprender golpe, evolução por nível. **O que a evolução entrega**: `regras.golpesDaEvolucao(antes, depois, nivel)` = golpes que a forma NOVA aprende **no nível 0** (é assim que a PokéAPI marca "aprende ao evoluir") e a antiga não aprendia. **Nível 1 não entra**: é a lista do que a espécie saberia se nascesse agora (o Exeggutor tem 17 golpes lá), e incluí-la reescrevia o moveset inteiro numa evolução só — bug relatado em jogo + o golpe do nível atual — antes só olhávamos o nível exato, e o golpe assinatura (King's Shield do Aegislash) se perdia pra sempre em qualquer evolução acima do nível 1. `habilidades.habilidadeDaEvolucao(velhas, novas, atual)` mantém o SLOT (oculta continua oculta; antes era índice cru na lista inteira, que misturava oculta com normal quando a forma nova tinha outro número de habilidades) e o registro avisa quando o nome muda. **Evolução pendente**: falha de rede em `arvoreDe`/`evolve` marca `M.evoPendente` (a ficha mostra ⏳) e `verificarEvolucoesPendentes()` tenta de novo ao explorar e depois de vencer — sem isso o nível subia e a evolução sumia sem ninguém ver. |
| `js/pokedex-conta.js` / `js/tela-pokedex.js` | **Pokédex da conta** (puro + tela; `tests/pokedex-conta.test.js`). `pokedexDaConta(jornadas, registroAtual)` junta `registro.vistos/derrotados/amigos/ids` de toda a carreira + a run atual e devolve `{ porId, porNome, conhecidas }`; o `estado` de cada espécie é amigo > derrotado > visto. Registro antigo sem `ids` conta no total por nome, mas não entra no mapa por id (não dá pra desenhar sprite sem id). `ondeAparece(id)` responde "onde eu acho esse?" varrendo os mapas gerados — rotas com a taxa de encontro, Santuário, Alfa e luta final — **sem rede**, então funciona offline. A tela mostra as 1025 espécies (`loading="lazy"` nas imagens: sem isso o navegador baixaria mil sprites de uma vez) e a ficha detalhada vem de `api.loadPokemon`/`loadAbility` no clique, com mensagem própria quando está offline e a espécie não foi baixada. |
| `js/progresso-conta.js` | **Progresso permanente da conta** (puro; `tests/progresso-conta.test.js`). Regra única: **nunca encolhe**. Antes, desbloqueios e contadores eram DERIVADOS das jornadas da carreira — apagar uma jornada apagava a conquista que ela liberou (risco apontado pelo próprio jogador). Agora há um registro próprio: `especies` (desbloqueada, com data e razão; a data nunca é sobrescrita) e `porJornada` (abates + espécie/nível/dificuldade, pela chave do ID da jornada). **`porJornada` em vez de um total único** porque é o que faz a fusão entre aparelhos e com a nuvem ser correta: mesma jornada = mesma chave, nada conta em dobro, e jornada que só um lado viu entra sem conflito. `bancar()` é idempotente pelo ID, então pode rodar a cada abertura de tela. Acesso em `carreira.js` (`atualizarProgresso`, `desbloqueadasDaConta`, `abatesDaConta`, `mesclarProgressoLocal`), sincronização em `nuvem.js` (tabela `progresso`, uma linha por conta, `try/catch` pra não quebrar quem não rodou a migração) e SQL em `supabase/migrations/`. **Local primeiro**: grava no aparelho na hora (funciona offline) e junta com a nuvem depois. A retroatividade continua: `especiesDesbloqueadas` é a UNIÃO do gravado com o que a regra de hoje reconhece no histórico, então regra nova (como "shiny recrutado desbloqueia") vale pro passado. |
| `js/conquistas.js` / `js/tela-conquistas.js` | **Conquistas da conta** (puro + tela; `tests/conquistas.test.js`). As gimmicks não se desbloqueiam dentro de uma run: somam a CARREIRA. `registrarAbate(S, {porMim, tiposDoAlvo, minhaEspecie, golpe, modo})` é chamado em `batalha.win()` e grava em `S.registro.abates`: `tipoAlvo` (Tera, 200 por tipo) · `especie` (Mega, 1000) · `golpe`/`elemento` (Z-Move, 250/500) · `total` (marcos 1k/10k/100k/1M). **Quem leva o crédito**: a ESPÉCIE conta sempre que a equipe vence (aliado incluído — decisão do usuário, que voltou atrás do "só o seu golpe"); TIPO e GOLPE só quando `porMim`. Sem golpe (veneno/armadilha/recuo) a espécie conta e o golpe não. O modo `easy` não acumula nada. Gigantamax (nível 50 em 25 jornadas) sai de `runsDeNivel` sobre o histórico — não precisou de contador novo. `progressoConquistas(jornadas, registroAtual)` junta carreira + run em andamento. **Contador só acumula depois de publicado**: por isso foi ao ar sozinho, antes de qualquer tela ou mecânica de gimmick. |
| `js/itens.js` | `addItem`, `useItem`. **Itens de golpe** (`dados.ITENS_GOLPE`, `it.ensina`): `ensinarGolpe(id)` pergunta em QUEM (você ou qualquer aliado vivo) e qual golpe, e chama `progressao.aprender(M, ref, true)` — o `true` força VOCÊ a escolher o que o aliado esquece, em vez da escolha automática do level-up (você pagou pelo item). **Aliado aprendendo sozinho** (`escolher = false`): `CHANCE_ALIADO_RECUSA` (50%) de simplesmente não querer o golpe; querendo, troca um golpe **sorteado**, não o de menor poder — pedido do usuário, pra o aliado ter jeito próprio em vez de moveset ótimo e previsível. O item só é gasto se `aprender` devolver `true` (desistir na hora de esquecer não gasta). O que cada um oferece sai de `regras.golpesParaEnsinar(tipo, M)` (puro, testado): `'relembrar'` = `learnset.list` até o nível atual (Escama do Coração, ₽5.000, também aparece em 3% dos itens achados explorando — `mundo.CHANCE_ESCAMA`); `'pokedex'` = `learnset.extras` (Disco Técnico, só loja). `null` = sem cache ou cache antigo sem `extras` → avisa pra conectar, NUNCA diz "não aprende nada". Preço do Disco por `regras.precoItem(id, S)`: `PRECO_DISCO + AUMENTO_DISCO * S.discosUsados` (8k +4k por Disco USADO, não comprado) — a loja (`render`) e o `case 'buy'` (main.js) leem os dois dessa função, nunca de `ITEMS[id].price` direto. |
| `js/amizade.js` | `oferecer` (petisco em batalha), recrutar aliado, `despedir`. |
| `js/fim.js` | `encerrarJornada(motivo)` (resumo → carreira → apaga save aqui e na nuvem), `montarResumo`, tela de fim, `telaCarreira`. |
| `js/roguelike.js` | Desbloqueios do Roguelike entre runs (puro, testado). |
| `js/carreira.js` | Carreira = lista de jornadas terminadas (`pokerpg-carreira-v1`; migra o `pokerpg-recordes-v1` antigo). `calcularCarreira`, `mesclarJornadas`, `melhorDaEspecie`. Puro + `store`, testado. |
| `js/config.js` | `SUPABASE_URL` / `SUPABASE_ANON_KEY` (marcadores = jogo só local). |
| `js/nuvem.js` | Supabase sob demanda: login (Google / link por e-mail), `sincronizar()` (carreira + save em andamento), envio do save com espera, `ganchos` que o main.js liga. `idJogador()` (id da conta, ou de visitante persistido) e `sb()` (o cliente) exportados pra `multiplayer.js` e `presenca.js` não duplicarem/abrirem uma 2ª conexão. |
| `js/presenca.js` | **Marcador "jogando agora"** (tela inicial): canal Realtime global (`pokerpg-presenca-global`, diferente do canal por SALA de `multiplayer.js`), `track({})` vazio — nunca identifica quem, só quanto. Junto, o contador HISTÓRICO admin-only de visitantes sem conta (`registrarVisitanteAnonimo`/`contagemAnonimos`, tabela `visitantes_anonimos`). Interruptor em ⚙ Ajustes (`presencaLigada`/`definirPresenca`), divulgado na tela 🔒 Privacidade — não é telemetria silenciosa. Sem Supabase configurado, tudo aqui é no-op. |
| `js/golpe.js` | **Motor único do golpe** (single player e multiplayer): usarGolpe, mudarEstagios, aplicarStatus, fimDeTurno, com `ctx` de narração. |
| `js/habilidades.js` | Tabela de habilidades (ganchos) + `hab(m)`, `IMPL`. **Só o que está nessa tabela tem efeito de verdade** (hoje 215 de 314 habilidades reais da PokéAPI — a contagem antiga de "307" vinha de uma auditoria velha; a certa é filtrar `abilities.csv` por `is_main_series`, e a contagem real de implementadas é sempre `IMPL.size`, testada em `tests/habilidades.test.js`. `docs/auditoria-batalha.md` ficou desatualizado depois da 2ª leva e não reflete nem o total nem o implementado — não usar como fonte). O resto joga normal, sem o efeito, e a ficha mostra "(sem efeito ainda)". **Mudança de Postura** (`postura`, Aegislash) é a primeira troca de FORMA: `golpe.trocarPostura(m, paraLamina, ctx)` espelha os atributos base (Ataque ↔ Defesa, At.Esp. ↔ Def.Esp.) — as duas formas do Aegislash são os mesmos números trocados de lado, então não precisa buscar a outra forma na rede no meio do turno. **Sempre copiar `m.data` antes** (`{ ...m.data, base }`): esse objeto vem do cache e é compartilhado por todo Aegislash que aparecer. Golpe de dano → Lâmina (antes de calcular o dano); King's Shield → Escudo (`especiais.voltaPostura`). `tests/postura.test.js`. |
| **Barreiras que punem contato** | `especiais.puneContato` (`{ estagio: [attr, n] }` / `{ dano: fração }` / `{ status }`): King's Shield tira 2 de Ataque, Obstruct 2 de Defesa, Spiky Shield machuca 1/8, Baneful Bunker envenena, Silk Trap tira Velocidade, Burning Bulwark queima. A barreira guarda o efeito em `u.vol.punicao` ao ser levantada; quem ataca leva a punição no ponto em que o golpe é bloqueado, **só se for golpe físico** (a mesma regra de contato de Static/Elmo Rochoso). `fimDaRodada` limpa junto com `protegido`. Antes eram todos `protege: true` puro — um Protect com outro nome. |
| `js/especiais.js` | `GOLPES_ESPECIAIS` + `especial(g)`: golpes cujo efeito não cabe no `meta` da PokéAPI. Comportamentos (lidos em `golpe.js`/`regras.js`): `protege`, `aguentaTurno`, `foco`, `descanso`, `autoDesmaio`, `ohko`, `soDormindo`, `toxico`, `semente`, `carga`(+`invulneravel`), `recarga`, `furia`, `poder` (fórmula em `regras.poderEspecial`), `danoIgualHp`. Sem imports. Estado volátil novo em `m.vol`: `protegido`/`aguenta` (1 rodada — limpos por `fimDaRodada(m)`, que substitui o antigo `vol.flinch = false` em `batalha.js` e `mp-motor.js`), `protSeguidas`, `foco`, `toxico` (n/16 por turno), `semente` (ref de quem plantou, via `ctx.refDe`/`ctx.monPorRef`), `carregando` (o golpe), `invul`, `recarga`, `furia {golpe, turnos}`. Pokémon travado (carga/fúria): `usarGolpe` ignora o golpe escolhido e usa `golpeTravado(m)`. Algo que impede de agir (sono, congelado, paralisia, recuo, confusão) chama `interromper(u)` e a carga/fúria se perde. Hyper Beam só recarrega se o golpe conectou (`executar` devolve `'acertou'`). `tests/especiais.test.js`. A auditoria completa (o que ainda falta) está em `docs/auditoria-batalha.md`, gerada da PokéAPI. |
| `js/relatos.js` | Tela de bugs e sugestões + `contextoTecnico()`. |
| `js/mp-motor.js` | Motor puro da batalha multiplayer (lados A/B com N Pokémon). Testado. |
| `js/multiplayer.js` | Salas co-op por código (Realtime), anfitrião autoritativo, telas da sala. |
| `js/ranking.js` | Tela do ranking global (geral / por espécie). |
| `js/conta.js` | Tela de conta e o botão 👤 no topo (`#conta-chip`). |
| `js/missoes.js` | `verificarMissoes()` — anuncia missões novas e entrega prêmio das concluídas. |
| `js/mundo.js` | `explore()`, `desafiarChefe()`. |
| `js/criacao.js` | Tela de criação: passo 1 dificuldade, passo 2 iniciais por região (ou busca livre em modo `especiesLivres`), prévia, `startGame`, `fullRandomizer`. |

Grafo de imports sem ciclos: `util`/`dados`/`layout` → `regras`/`api` → `estado` → `ui` → `paineis` → `render` → `efeitos`/`progressao`/`pokemon` → `itens`/`amizade`/`missoes`/`fim`/`criacao` → `batalha` → `mundo` → `main` (`batalha` importa `encerrarJornada` de `fim`, então `fim` nunca pode importar `batalha`). Manter sem ciclos.


## Mecânicas, mundo, carreira, painéis, roguelike, ranking, multiplayer, motor do golpe (versão anterior)

## Mecânicas (Etapa 3)

- **Dificuldade** (`S.dificuldade`, tabela `DIFICULDADES` em `dados.js`, lida via `dificuldadeDe(S)` — save antigo sem o campo conta como `easy`). Escolhida no **passo 1 da tela inicial** (`G.dif`, `renderDificuldade`). **O código lê as flags de cada modo, nunca compara o nome**: `semCaptura`, `fimDeJogo`, `centroGratis`, `descontoPorVitoria`, `nivelLivre`, `escolhaLivre`, `fimNaGen` (vencer os lendários encerra a run — Roguelike). O passo 2 é o mapa (Gen, `G.gen`, `renderGens` em criacao.js).
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
- **Registro** (`registrar(S, lista, especie)` → `S.registro.derrotados/amigos/evolucoes`): lido pelas missões, e pelo Roguelike no futuro.
- **Aliado evolui** como você (pergunta antes; árvore buscada na 1ª vez e guardada em `A.evo`, `null` = não evolui) e **itens valem pra equipe**: `itemTemEfeito` decide quem se beneficia; com mais de um alvo, "Usar em quem?". Desmaiado nunca recebe item (Potion não revive).

## Mundo e progressão (Etapa 2)

- **Mapas por Gen** (`js/mapas.js`, puro, `tests/mapas.test.js`; dados em `js/dados-mapas.js`, **GERADO** por `ferramentas/gerar-mapas.ps1` a partir da PokéAPI — não editar à mão: mudar nomes/temas/faixas no script e rodar de novo; o script precisa ficar salvo com BOM, senão o PowerShell 5 estraga os acentos). 9 Gens × 10 rotas, faixas de nível iguais em todo mapa (2–6 … 52–62). `ZONES` (dados.js) = todas as rotas de todos os mapas, cada uma com `gen`. `pool = [{ id, n: speciesName, p: peso, m?: mítico }]` — sorteio ponderado `sortearDaRota` (taxa = peso/total; peso vem da taxa de captura; mítico ≈ 0,4% nas rotas 8 e 9). Rotas 1–9 têm `chefe` (Alfa); a 10ª tem `final: true` + `lendarios` (os da Gen com total ≥ 500; o último = principal). Kanto mantém os ids antigos (`rota1`…`caverna`) por causa de saves e missões; a Fenda Dimensional saiu (save que estava nela cai na 1ª rota).
  - Estado: `S.gen` (sem campo = 1, `genDe`), `S.gensVencidas`, `S.nivelInicioGen`, `S.escolhendoGen`. **Sempre ler rota por `zone()`/`rotasAtuais()` (estado.js)**, nunca `ZONES` direto na jornada: elas aplicam `rotaNaJornada` (níveis escalados por `escalaNivel` quando você entrou no mapa já forte — fora do Roguelike, depois de fechar uma Gen; a 1ª rota fica sempre aberta).
  - Lendários: `startLendarios(z)` (batalha.js) usa o fluxo de treinador (`trainer.lendarios`, `bolas: 0`, `B.chefe` = rota pra bloquear petisco) com `sequenciaLendaria` (até 3 + o principal, que vem com `statsDeChefe`); `rotulo` mostra "X lendário". Vencer → `vencerGen()`: marca `S.chefes[rota]` + `S.gensVencidas`; modo com flag `fimNaGen` (Roguelike) → `encerrarJornada('venceu', { genVencida })`; senão `S.escolhendoGen = true` + `telaEscolherGen()` (fim.js), clique `proxima-gen` (main.js) → `entrarNaGen`. `abrirJornada` volta pra essa tela se o save estiver com `escolhendoGen`.
  - Roguelike: mapas liberados na criação = `gensLiberadasRoguelike(carreira)` (Gen 1 + a seguinte da maior Gen vencida em run Roguelike). Outros modos escolhem qualquer mapa; Full Randomizer sorteia. Pontuação: `gens` × 2000 (PESOS_PONTOS + `validar_jornada` no schema.sql; teste confere). Limite de Alfas no SQL = rotas com Alfa + finais (90).
  - Pokédex da rota (render.js `pokedexRota`): `pokedexDaRota(z, conhecimento())` — "?" nunca enfrentou, silhueta (CSS `filter`) já enfrentou, colorido + `textoTaxa` com `REVELA_DERROTADOS` (10) derrotados. `conhecimento()` soma `vistos`/`derrotados` da carreira inteira + a jornada atual; a parte da carreira é recalculada só quando `versaoCarreira()` muda (carreira.js incrementa em `salvarCarreira`).
  - Missões com `gen` (trilha de Alfas de Kanto + `lenda`) só aparecem no mapa daquela Gen (`situacaoMissoes`). Multiplayer co-op usa as rotas do mapa da run do anfitrião; a luta dos lendários não existe no co-op.
- **Zonas por nível**: `libera` = nível mínimo (`zonaLiberada`). Chip trancado com 🔒; o clique também checa (main.js, só rotas do mapa atual). A rota inicial e o destino depois de capturado respeitam isso.
- **Alfas (chefes)**: `ZONES[i].chefe = { id, nome, nivel }`, sempre acima do teto da zona (teste garante). Botão "⚔ Desafiar" na cena da zona → `startBossBattle`: IVs 31, `statsDeChefe` (HP ×2, resto ×1,3 — `MULT_CHEFE`). Não aceita petisco, dá pra fugir. 1ª vitória: `premioChefe(nível)` + 1 Rare Candy e marca `S.chefes[zona]`; revanche só dá XP.
- **Missões**: `MISSOES` (dados.js), cada uma com `libera` (condição pra aparecer; sem ela, visível desde o início), `objetivo` e `premio`. Condições: `derrotar`+`qtd`, `vitorias`, `amigos`, `nivel`, `chefe`, `treinadores`, `missao` — avaliadas por `progressoCondicao`/`situacaoMissoes` (regras.js, testadas). `verificarMissoes()` (missoes.js) anuncia missão nova 🔓 (`S.missoesVistas`), entrega prêmio 📜 (`S.missoesFeitas`) e é chamada no `finally` de todo turno, depois de explorar e depois de usar item. Ficha mostra as ativas com barra de progresso e quantas seguem escondidas. Teste de dados garante que toda missão aponta pra zona/missão/item que existe.

- **Missões de dinheiro**: `{ dinheiro }` = ter ₽X de uma vez (cai se gastar); `{ gasto }` = total em `S.gasto` (loja + Centro, somado em main.js). Também `{ evolucoes }`. Contagem de "derrotar" segue a facilidade de achar (comum da 1ª rota = 10, raro = 1–3).

## Fim de jornada, carreira e conta

- **Só iniciais na criação**: `REGIOES_INICIAIS` (9 regiões × 3 + Especiais Pikachu/Eevee) em TODOS os modos — Sortear e Full Randomizer também. Flag por modo `especiesLivres` (hoje false em todos, decisão do usuário "a princípio, pode mudar"): true volta a busca livre só naquele modo.
- **Fim de jornada** (`fim.js`, `encerrarJornada(motivo)`): capturado no Hardcore (`'capturado'`), desmaio sem Revive (`'desmaiou'`) ou "Novo jogo" (`'encerrou'` — o botão agora ENCERRA a jornada, não só apaga). Monta o resumo (`montarResumo`: `estatisticasDaJornada` + `pontuacao` × `multPontos`, com `id` da jornada e cópia do registro por espécie), adiciona na **carreira** (`pokerpg-carreira-v1`, lista de TODAS as jornadas terminadas — sobrevive entre jornadas) e apaga o save (aqui e na nuvem). Tela de fim compara com o melhor daquela espécie. `telaCarreira()` (📊, na tela inicial e no topo do jogo fora de batalha) calcula tudo da lista: favorito (espécie mais jogada), máximos (nível, dinheiro de uma vez, missões, vitórias, Alfas), totais, Pokédex (amigos = "capturados" / 1025, faltam, vistos; sprite pelo `registro.ids`), shinies (vistos / amigos / jornadas sendo shiny) e melhor por espécie. Inclui a jornada atual como "em andamento".
- **Conta / nuvem** (Supabase — a Vercel só hospeda; setup em `supabase/COMO-CONFIGURAR.md`, banco em `supabase/migrations/` com RLS): login com Google ou link por e-mail. `sincronizar()` junta a carreira local com a da conta por `id` (`mesclarJornadas`: sobe só jornada de visitante ou da própria conta, nunca de outra conta que logou no mesmo navegador) e reconcilia a jornada em andamento (tabela `saves`, **uma por conta**): mesma jornada → vale a mais nova (`S.salvoEm`); jornadas diferentes → pergunta qual manter; jornada que já terminou em outro aparelho → descartada aqui. Envio do save: `ganchosSave.aoSalvar` → `agendarEnvioSave` (espera 5 s) + na hora ao esconder/fechar a aba. Sem config, tudo é no-op.
- `S.id` (jornada), `S.salvoEm`, `S.maxDinheiro`, `registro.vistos/shinies/shiniesAmigos/ids` foram adicionados pra isso; save antigo ganha `id` ao abrir.
- **Revive / desmaios**: `desmaiosLivres` por modo (Fácil null = ilimitado; Médio+ = 3). `S.desmaios` conta; do 4º em diante cada desmaio gasta um `revive` da mochila, sem ele = Game Over. Revive também reanima aliado desmaiado (½ HP) — único item que `itemTemEfeito` aceita em desmaiado.
- **Tempo de jogo**: `S.tempoMs`, somado em cada `save()` (`marcarTempo`), ignorando pausas > 5 min; o boot zera `S.ultimoTick`.
- **Ordens dos aliados** (`ORDENS`, `A.ordem`, `golpeDoAliado`): livre (mais eficaz) · fraco ("pegar leve", pra não derrubar quem você quer de amigo) · status · parado (em campo, sem agir) · fora (descansando: fora da batalha, não é alvo, sem XP — `emCampo()`). Troca pelo `<select data-ordem>` na ficha, a qualquer hora. Ficha completa do aliado num `<details data-aliado>` (aberto guardado em `G.abertos`).

## Painéis modulares

- Tela do jogo = coluna esq · centro (**cena fixa** → zona de painéis → ações fixas) · coluna dir. Painéis: `ficha`, `missoes`, `aliados`, `mochila`, `log`. **Um layout pro jogo inteiro** (decisão do usuário), salvo em `pokerpg-layout-v1`.
- Modelo puro em `layout.js` (testado em `tests/layout.test.js`): `normalizarLayout` garante cada painel exatamente uma vez mesmo com save velho/quebrado; `moverPainel`/`deslocar`/`trocarZona`/`alternarRecolhido`/`definirLargura`/`definirAltura` nunca mutam.
- DOM em `paineis.js`: `htmlJogo()` (esqueleto), `aplicarLayout()` (MOVE os nós entre zonas — conteúdo e scroll do log vão junto), `tituloPainel(id, html)`, `iniciarPaineis()` (listeners uma vez só: arrastar pelo cabeçalho com marcador, ▲▼⇄▾, divisórias de largura com pointer capture, "↺ Layout"). Altura = `resize: vertical` nativo + ResizeObserver que só grava quando `style.height` mudou.
- `render.js` escreve só o CONTEÚDO de cada painel em `#p-<id>` (`renderFicha/Missoes/Aliados/Mochila`); o `#log` mora dentro do painel `log`. Painel novo: adicionar em `PAINEIS` + `LAYOUT_PADRAO` (layout.js), `TITULOS` (paineis.js) e um `render<X>()`.
- Celular (≤ 880px): uma coluna, cena primeiro, sem arrastar/redimensionar — reordena pelos botões.

## Roguelike (modo principal)

- **Permadeath** (flag `permadeath`, pedido do usuário): desmaiou = `encerrarJornada('desmaiou')` na hora em `lose()` (nem Revive salva); aliado que desmaia é removido de `S.aliados` em `anunciarQuedas` (Centro não traz de volta). Vale no co-op também.
- `DIFICULDADES.roguelike` (primeiro da lista, `G.dif` padrão): flag `desbloqueios` — a criação oferece `INICIAIS` + `desbloqueadas(carreira)` (`permitidos()` em criacao.js, usado na grade, no Sortear e na checagem do `previewSearch`). Captura = fim da run (`fimDeJogo`), 3 desmaios livres, Centro pago com desconto por vitória, nível 5, natureza/habilidade livres, pontos ×1,5.
- `roguelike.js` (puro, `tests/roguelike.test.js`): `progressoRoguelike(jornadas)` soma `registro.derrotados/amigos/evolucoes` **só das jornadas com `dificuldade === 'roguelike'`** (decisão: não dá pra farmar no Fácil) e aplica `DESBLOQUEIO` (dados.js): 10 derrotas · 5 amizades · evoluir 5× pra forma do meio / 10× pra forma final. Iniciais ficam fora (já liberados). Vale pra PRÓXIMA run: só jornadas terminadas contam.
- Forma do meio/final: `evolve()` anota `registro.formas[especie] = 'meio' | 'final'` (final = nó sem `to` na árvore de evolução). `registro.ids` dá o id pra buscar o Pokémon e o sprite.
- Telas: seção "🔓 Desbloqueados" + "Quase lá" na criação (Roguelike), "Desbloqueado pra próxima jornada" na tela de fim (`novosDesbloqueios(antes, depois)`), seção Roguelike na Carreira.

## Ranking global

- `ranking.js` (tela, `G.mode = 'ranking'`) → `buscarRanking(especie|null)` / `especiesRanqueadas()` (nuvem.js) → funções SQL `ranking(p_especie, p_limite)` e `especies_ranqueadas()` (SECURITY DEFINER, devolvem só apelido + números + `eu`). Funciona sem login (só leitura).
- **Pontuação é do servidor**: gatilho `validar_jornada` (schema.sql) recalcula `pontuacao` do resumo e recusa número impossível (nível > 100, Alfas > 7, missões > 36…). **Pesos, multiplicadores e limites do SQL precisam acompanhar `PESOS_PONTOS`, `DIFICULDADES[].multPontos`, nº de Alfas e `MISSOES.length`** — `tests/schema.test.js` falha se divergirem. Modo novo → acrescentar no `case` do SQL.
- Jornada recusada (erro `P0001`) fica marcada `recusada` na carreira local e não é reenviada; as outras sobem uma a uma (uma recusa não trava a sincronização).
- Mudou o schema.sql → usuário precisa rodar de novo no SQL Editor (idempotente).

## Multiplayer (co-op e PvP)

- Decisão do usuário: **os dois formatos**, **sala por código** (4 caracteres, sem lista pública). Até `MAX_JOGADORES` = 6. Funciona sem login (id de visitante em `pokerpg-visitante`), só precisa do Supabase configurado (Realtime).
- Config da sala (anfitrião, broadcast `lobby`): `modo` 'coop'|'pvp', `porJogador` 1–3 (principal + aliados em pé e não "Descansar"; `slot` 0 = principal, k = `S.aliados[k-1]`), `balancear` (padrão **ligado**, pedido do usuário). PvP: cada jogador escolhe `time` A/B (presença). Balancear: co-op → `balancearCoop` (todos no nível do principal do anfitrião = "chamar alguém pra sua run"); PvP → `balancearPvP` (nível médio + HP × (maior/menor) pro time menor). Desligado: níveis reais; co-op com inimigos no nível do mais forte (Alfa +5).
- Escolha é **por Pokémon** (`minhaVez` = próximo Pokémon meu sem ação no turno; `sala.escolhidos` zera a cada turno). Resultado volta por `"dono:slot"` com **fração** de HP (o nível pode ter sido balanceado). PvP é amistoso: só `S.pvp {vitorias, derrotas}`; `desistir` (motor) tira o time inteiro; ninguém foge (`estado.pvp`).
- **Entrada na sala** (`entrada` em multiplayer.js, escolhida no menu): `'run'` (Pokémon da jornada atual, com aliados), `'convidado'` (`makeMon` Nv. 5 de `especiesConvidado()` = iniciais + desbloqueados do Roguelike; foto com `convidado: true`; resultado NÃO mexe em save nenhum, nem PvP conta) ou `'hall'` (ver abaixo). Sem run: convidado ou Hall; anfitrião sem run só abre PvP (coop continua exigindo run do anfitrião, dono da zona). Convidado sem balancear: nível do anfitrião (co-op) / média dos outros (PvP).
- **✅ CORRIGIDO (29/09/2026) — Hall da Fama no multiplayer: o bug era um `ReferenceError` mudo.**
  Relato real, repetido SEIS vezes pelo usuário: "pra iniciar uma run multiplayer ainda preciso escolher um
  Pokémon inicial de nível baixo; onde eu escolho os do meu Hall da Fama?". **A causa raiz não era falta de
  recurso** — a ☄ Sala de Raide já fazia isso desde 28/09. Era um bug: `htmlRaideSelecao` usava **`SPR_SHINY`
  sem importar** em multiplayer.js. Como a chamada está dentro de um ternário
  (`${e.shiny ? SPR_SHINY(e.id) : SPR(e.id)}`), só estourava pra quem tivesse **um shiny no Hall** — que é o caso
  dele. E o estrago era invisível: `renderSala` escreve `#mp-topo` e DEPOIS `#mp-acoes`, então o cabeçalho já
  trocava pra "Sala de Raide" e o `#mp-acoes` ficava com o **HTML VELHO do Co-op**. A tela contava duas histórias
  ao mesmo tempo (foi assim que o print do usuário denunciou: cartão de membro com "⏳ escolhendo…", que só existe
  no modo raide, ao lado de "3 (com aliados)"/"Balancear níveis", que só existem fora dele). Reproduzido em jsdom
  antes e depois: HEAD dá `ReferenceError: SPR_SHINY is not defined`, a versão corrigida desenha o Hall inteiro.
  Três consertos, além do import:
  - **`renderSala` virou um try/catch** (`desenharSala` faz o trabalho): erro ao desenhar agora aparece NA TELA e
    no console, em vez de deixar meia tela velha. Mesma lição já anotada pro `gimmicksNaLoja` (carreira.js):
    falha silenciosa em render vira diagnóstico errado e semanas de relato perdido.
  - **`tests/referencias.test.js` ganhou um segundo teste** que pega essa classe de bug: nome que COMEÇA COM
    MAIÚSCULA e está COLADO no `(`, varrendo o arquivo inteiro. O teste antigo só olhava a chamada colada no
    `${`, então não via `SPR_SHINY` no meio do ternário. Tentei generalizar o teste antigo pra varrer a
    interpolação inteira e **não deu**: prosa em português dentro do HTML ("Termine (ou encerre)", "Desafiar o
    Alfa (") vira falso positivo. A regra de maiúscula+colado separa os dois casos com ZERO exceção no código de
    hoje (toda a família `SPR`/`SPR_SHINY`/`ITEM_SPR`/`TYPE_PT` é assim; prosa sempre tem espaço antes do `(`).
  - **`resumoCfg`** (cabeçalho da sala) só sabia "PvP ou não", então anunciava a Sala de Raide como
    "Co-op · ... · Rota 1" — rota que ela nem usa. Agora conhece os três modos.
  **Recurso novo junto (o pedido original):** `entradaTipo` = `'run' | 'convidado' | 'hall'`, **por jogador** e
  independente do `modo` da sala — dá pra entrar em co-op OU PvP com até `MAX_TIME_HALL` (3) Pokémon do Hall, no
  nível real. `entradaEfetiva()` é o ÚNICO ponto que decide (a Sala de Raide não é um quarto tipo: ela força
  `'hall'` pra todo mundo). Dois ajudantes derivados evitam espalhar a regra: `semMochila()` (convidado ou Hall
  FORA da raide = sem itens/Revive/gimmick) e `usaRun()` (a luta só mexe na jornada quando entrei com ela) —
  substituíram os `sala.convidado || ...` espalhados por `aplicarPvP`, `aplicarCoop`, itens/Revive de evento,
  gimmicks e Centro na sala. Dentro da raide o Hall CONTINUA com a mochila da conta (é o ponto dela), por isso
  `hallEmprestado()` distingue os dois.
  **A escolha aparece nos DOIS lugares**, e isso foi o que faltou na primeira tentativa de consertar: só no menu
  (antes de criar/entrar) não resolvia, porque quem já estava na sala não tinha como chegar nela — era
  literalmente a pergunta do usuário ("onde eu escolho?"). Agora `htmlEntradaNaSala()` repete a escolha no lobby
  (co-op e PvP, some na raide), com `escolherEntradaNaSala`/`escolherConvidadoNaSala` remontando os Pokémon e
  reavisando os outros pela presença. `htmlHallPicker` (extraído de `htmlRaideSelecao`) é a MESMA tela nos dois
  lugares, e `hallSelAtual()`/`podeMexerNoHall()` fazem `raideSelecionarHall`/`raideEquiparHall`/
  `raideComprar*` atenderem menu (`hallEscolha`) e sala (`sala.hallSel`) sem duplicar nada.
- **Ganhos voltam só no nível real** (pedido do usuário): `nivelarMon` guarda `nivelReal`; `naNivelReal(m)` vai no `final` de cada Pokémon. Co-op: XP, EVs, dinheiro, item (35% por jogador, `FIND_ITEMS`), vitória e prêmio de Alfa só entram na run se o principal lutou no nível real (aliado idem pro XP dele). Balanceado com nível ajustado = diversão (HP e permadeath continuam valendo).
- **Roguelike no co-op**: principal desmaiado = `encerrarJornada('desmaiou')` (sai da sala antes); aliado desmaiado = removido de `S.aliados` (do maior slot pro menor). Fora do Roguelike, desmaio no co-op volta com 1 HP.
- **Sala resistente a rede ruim** (relato real: escolhas não chegavam e o turno só saía no prazo de 45 s; alt-tab derrubava a sala). `enviar()` confere o retorno do `send` ('ok' | 'timed out' | 'error') e tenta de novo; o anfitrião republica o estado a cada `PULSO_MS` enquanto espera escolhas (`ligarPulso`); evento `sincronizar` + botão 🔄 pedem o estado atual; `CHANNEL_ERROR`/`TIMED_OUT`/`CLOSED` **não** fecham mais a sala (reinscreve até 5×, `sala.conexao`); anfitrião sumido da presença só encerra a sala depois de `ESPERA_ANFITRIAO_MS`. Tudo registra em `diario`/`anotar()` (console `[mp]` + `barraConexao()` na tela). `centroMP()` cura a equipe sem sair da sala.
- `mp-motor.js` (PURO, `tests/mp-motor.test.js`): dois lados A/B com N Pokémon, `fotoDoMon` (cópia enxuta pra rede), `resolverTurnoMP(estado, ações)` (async) → estado novo + eventos em texto (sem HTML — quem exibe escapa), `acaoDaIA`. O golpe em si vem do motor único `golpe.js` (a duplicação antiga com o single player foi eliminada).
- `multiplayer.js`: canal `pokerpg-sala-<código>` (presence = membros com a foto do Pokémon; broadcast `estado`/`acao`/`fim`/`lobby`). **Anfitrião é a autoridade**: gera inimigos (1 selvagem por jogador, ou o Alfa com HP × nº de jogadores), junta as escolhas (só o dono escolhe pelo próprio Pokémon), prazo de 45 s com golpe automático, roda o motor e publica. Cada cliente aplica o `fim` na PRÓPRIA jornada (HP/PP, XP via `gainExp`, EVs, dinheiro, registro, Alfa); desmaio no co-op = volta com 1 HP, não conta desmaio. Anfitrião saiu = sala acaba.
- `render()` só desenha em `G.mode` 'explore'/'battle' — gainExp roda na tela da sala e chama render().

## Ícone e amigos

- **Ícone** `{ id 1–1025, shiny }`: `perfis.icone_id/icone_shiny` (conta) ou `pokerpg-icone` (sem conta; sobe no 1º login). `meuIcone()` (nuvem.js), `htmlIcone(ic, cls)` (conta.js, cai no sprite normal se o shiny faltar). Aparece no chip do topo, ranking (`ranking()` devolve `icone_*`), presença da sala, amigos e convites.
- **Amigos**: `perfis.codigo_amigo` (6 caracteres, gerado no banco) + tabela `amizades` (de→para, pendente/aceita, par único, RLS). `pedir_amizade(código)` (se o outro já pediu, aceita na hora) e `meus_amigos()` (SECURITY DEFINER: só apelido + ícone do outro). Aceitar = update pelo `para`; recusar/cancelar/remover = delete. Lista em `nuvem.amigos` (carregada no sync).
- **Convite pra sala**: cada conta logada ouve `pokerpg-convites-<uid>`; `convidarAmigo(id, {codigo, modo})` manda broadcast no canal do amigo; quem recebe só mostra se o remetente está em `nuvem.amigos` como aceito → `toast` (ui.js) com "Entrar" (`mp-aceitar-convite`).
- `sincronizar()` lê as colunas novas com fallback (`42703`) pra quem ainda não rodou o schema.sql novo.

## Topo (menu ☰) e login

- Header: `#top-dinheiro` (sempre visível) + `#menu-burger` + `nav#menu-links` (`#topr` + `#conta-chip`). No computador `.menu-links` é `display:contents` (tudo em linha); ≤ 720px vira painel aberto pelo ☰ (`iniciarMenu`/`fecharMenu` em ui.js: fecha ao tocar num botão, fora, ou Esc). **Telas fora do jogo limpam o topo com `limparTopo()`**, nunca `#topr.innerHTML = ''` direto (o dinheiro ficaria velho).
- Login: botão `.btn-login` no topo; tela de conta com "Continuar com Google" no padrão visual do Google (`G_LOGO`) + link por e-mail.

## Motor único do golpe e habilidades

- **`golpe.js` é o ÚNICO lugar que resolve um golpe** (`usarGolpe`), estágios (`mudarEstagios`, com `fonte` = quem causou), status (`aplicarStatus`) e fim de turno (`fimDeTurno`: Shed Skin → queimadura/veneno → Speed Boost). Single player e multiplayer usam o mesmo: a diferença é o `ctx` de narração — single player `CTX` em efeitos.js (nome HTML, golpe colorido, `say` com pausa, `render`, `shake`); multiplayer em `resolverTurnoMP` (texto puro, coleta eventos). **Por isso `resolverTurnoMP` é async.** Nunca reimplementar golpe em outro arquivo.
- `habilidades.js`: `HABILIDADES` = tabela de ganchos (documentados no topo do arquivo) → `hab(m)`; `IMPL` = as que têm efeito (ficha mostra "✓ ativa"). Contas (stab, técnico, crítico, pinch, resiste, filtro, multiscale, multStat/comStatus, precisão) em `regras.js` (`calcDamage`, `effStat`, `chanceAcerto`, `imuneAoStatusMon`); o resto (absorção, imunidade de tipo, Wonder Guard, Sturdy, contato, secundários, recuo) em `golpe.js`. Habilidade nova com gancho que já existe = uma linha; gancho novo = código no motor + teste em `tests/habilidades.test.js` (que também falha se aparecer gancho desconhecido na tabela).

## Bugs e sugestões

- `relatos.js` (tela, `G.mode = 'relatos'`) → `enviarRelato` (nuvem.js) → tabela `relatos` (schema.sql: insert pra anon/authenticated, select só dos próprios). Sem config/offline/falha → fila `pokerpg-relatos-fila`, enviada no `iniciarNuvem` e no `online`. Bug pode anexar `contextoTecnico()` (sem dados pessoais; o jogador vê o JSON antes). Quem mantém lê no Table Editor — ou por `ferramentas/relatos-admin.mjs` (só no Raspberry Pi, `node ferramentas/relatos-admin.mjs`): puxa tudo com a **service role key** local (`ferramentas/.relatos-admin.env`, git-ignorado, nunca colar em chat — ver `relatos-admin.env.example`), baixa os prints do bucket privado `relatos-imagens` e monta `relatos-baixados/RESUMO.md`. Puxa só `status = 'novo'` e marca como `lido` (flags `--manter`/`--todos` mudam isso).

### Próximos passos combinados (em ordem sugerida)
- **Evoluções especiais** (pedido do usuário): hoje `loadEvo` só guarda `trigger` e `min_level` — pedras/itens (use-item), troca (Cabo de Conexão no single player; troca real no multiplayer), amizade, dia/noite, golpe conhecido, zona. A PokéAPI traz tudo em `evolution_details`.
- **Batalha completa** (continua): habilidades → clima → terrenos → itens segurados → golpes especiais/IA → Mega, Z-Moves, Dynamax/Gigantamax, Tera. Desbloqueia uma **espécie** pra próxima run ao derrotar ou fazer amizade com 5–10 dela; evoluir 5× pra forma do meio desbloqueia a do meio, 10× pra forma final desbloqueia a final. Exige progresso persistente entre runs.
- **Etapa 4 — Supabase/multiplayer**: ranking de todos os jogadores (melhor pontuação geral por espécie) e batalha com Pokémon de vários jogadores do mesmo lado (a batalha já é N-do-meu-lado).
- Ideias soltas ainda não pedidas: mais missões (por tipo elemental, por zona), recompensa de Alfa diferente por zona, rank/título de explorador.
- **Pedido pelo usuário (27/09/2026), pra depois**: ~~sprites 3D/animados com download opcional~~ ✔ FEITO
  (`dados.SPR_3D`/`SPR_ANIM`, `ajustes.estiloSpriteAtual`, `offline.baixarImagens3D`/`baixarImagensAnimadas`);
  ~~animação na barra de HP ao tomar dano/curar~~ ✔ FEITO (ver "Animação da barra de HP" abaixo); ~~animação de
  ataque, cura e dano de status na cena de batalha~~ ✔ FEITO (28/09/2026, ver "Animações de batalha" abaixo).
- **Backlog (pedido do usuário, 28/09/2026): som no jogo.** Pesquisado: a PokéAPI TEM os **cries** (grito curto de
  cada espécie) no mesmo repositório de sprites já usado (`PokeAPI/sprites`, pasta `cries/`, `.ogg` por id —
  `pokemon.cries.latest`/`legacy` na resposta de `/pokemon/{id}`), então dá pra tocar com a MESMA técnica de
  espelhamento por jsdelivr já usada pras imagens (`dados.espelhar`). **Música de jogo (tema de batalha, de
  rota, vitória) a PokéAPI NÃO tem** — ela é só dados + sprites/cries, nunca teve trilha sonora. Pra ter música
  precisaria de outra fonte, e aí vira uma decisão de risco (trilha original dos jogos = direito autoral mais
  exposto que sprite/dado; trilha própria/livre de direitos = mais seguro, mas exige compor ou buscar external).
  Ainda sem desenho: pelo menos precisa decidir se entra som ligado por padrão (com ajuste de volume/mudo em
  ⚙ Ajustes, mesmo espírito do `presencaLigada`/`REDUCED`) e quais eventos tocam cry (encontro selvagem? seu
  Pokémon entrando em campo? os dois?).
- ✅ FEITO (28/09/2026) — **Modo tutorial**: pedido em 27/09/2026 como "onboarding por funcionalidade" (destacar
  elemento novo na hora em que desbloqueia); quando o usuário voltou a pedir em 28/09/2026 mudou de forma —
  virou um **tour guiado único** combinando explicação com uma **demonstração jogável** (abrir a loja, comprar
  item, lutar, correr risco de ser capturado por um treinador) e um resumo curto das Runs, em vez de vários
  tutoriais pontuais por funcionalidade. Perguntado ao usuário (`AskUserQuestion`) e fechado: abre sozinho **só
  na primeiríssima vez** que o jogo é aberto neste aparelho (sem save nenhum ainda — decidido no `boot()` de
  main.js, antes de `showCreate()`) + fica sempre disponível pra rever num botão `❓ Tutorial` (entrou em
  `navegacao.TELAS`, então aparece de graça na barra de qualquer tela fora do jogo E no menu ☰ dentro do jogo,
  igual qualquer outra tela da lista); é uma **demonstração à parte, com um Pokémon de mentirinha** (um Pichu
  fixo, sprite por id — `dados.SPR`, sem precisar da PokéAPI, porque o tour precisa abrir mesmo na primeiríssima
  visita, antes de qualquer cache) — nunca toca `G.S` nem o save de verdade, todo o estado vive em `G.tut`;
  "já visto" **sincroniza com a conta** (`perfis.tutorial_visto`, `supabase/migrations/20260928130000_tutorial_visto.sql`,
  mesmo padrão de `badge_exibida`), com o navegador como reserva sem conta (`nuvem.tutorialVistoLocal`/
  `salvarTutorialVisto`, idempotente — nunca reenvia depois do primeiro "visto"). **É pulável em qualquer
  passo** (botão "Pular tutorial", filosofia de não travar — mesmo espírito do banner de cookies do `ads.js`) e
  **"Continuar" nunca fica bloqueado**: mesmo os passos interativos (batalha, loja, captura) deixam avançar sem
  ter batido/comprado/revelado nada — forçar uma ação específica pra sair de uma tela é exatamente o tipo de
  trava que o resto do jogo evita. `js/tutorial.js` (puro, sem DOM, `tests/tutorial.test.js`) guarda os dados de
  mentirinha (Pichu Nv. 8, Caterpie selvagem, Treinador Theo) e a lógica de passo/golpe/compra; **o texto de cada
  passo lê dado real em vez de duplicar**: o resumo de Runs e a tabela "o que acontece se eu for capturado" vêm
  direto de `dados.DIFICULDADES` (`d.desc`, `d.semCaptura`, `d.fimDeJogo`) — mudou a regra ali, o tutorial muda
  sozinho, sem re-escrever texto solto. `js/tela-tutorial.js` desenha (reaproveita classes existentes: `.hp`/
  `.bar`/`.fill` pra HP, `.item-btn`/`spriteItem` pra loja, `.difs`/`.abil` pra os cards de dificuldade — quase
  nenhum CSS novo precisou).
- **Pedido pelo usuário (28/09/2026), pra depois:**
  1. ✅ FEITO — **Layout pro celular em modo paisagem (horizontal)**: ver "Celular DEITADO" na tabela de arquivos
     acima (a cena vira coluna lateral, não fica mais presa no topo).
  2. ✅ FEITO — **Marcador de jogadores online no momento** e **estimativa de quantos jogam sem conta**:
     `js/presenca.js` (ver tabela de arquivos acima). O canal de presença global mostra "🟢 X jogando agora" na
     tela inicial pra QUALQUER jogador; o contador histórico de visitantes sem conta é ADMIN-ONLY (pedido
     explícito do usuário: "essa estatística deve aparecer só pra mim admin") — aparece ao lado do marcador
     ao vivo, só pra quem tem `perfis.admin`. Schema em
     `supabase/migrations/20260928120000_visitantes_anonimos.sql` (tabela `visitantes_anonimos` + duas RPCs
     SECURITY DEFINER: `registrar_visitante_anonimo` grava, `contagem_visitantes_anonimos` só devolve o total
     pra admin). Divulgado na tela 🔒 Privacidade (passo 3) e com interruptor em ⚙ Ajustes — decisão própria
     (não pedida explicitamente, mas coerente com "não pode virar telemetria silenciosa" já anotado aqui):
     desligar tira o jogador do canal de presença E do registro de visitante, sem afetar o resto do jogo.
- **Arceus como chefe de raide** (pedido do usuário, 28/09/2026) — **✅ FEITO em 01/10/2026**, junto com
  **Regigigas** (pedido na mesma conversa: líder dos Regis). Decisão: **entram na rotação**, no FIM da lista
  (`% 14` virou `% 16`). A ordem do array É o calendário — entrar no meio trocaria o chefe da semana de quem já
  está jogando, então chefe novo sempre vai no fim. **Arceus** reusa `pontoFraco` como os Pratos (os 17, sorteados, troca
  a cada 2 ações) + couraça + Julgamento carregado: a mecânica de "o tipo que fere muda" já existia, não valia um
  gancho novo pra Multitype — só a flag `sorteia` e o efeito `{pratos}` da animação (pedido do usuário no mesmo dia:
  "é o Deus Pokémon, a luta tem que ser fantástica"). A animação é um anel com a cor de cada tipo girando em volta
  do sprite (`ui.trocarPratos` + `@keyframes pratos-anel`), que encolhe e deixa o Prato sorteado pulsando; respeita
  `semAnimacao()` e se remove sozinha do DOM. **Regigigas** não ganhou mecânica nenhuma: `habilidade: 'slow-start'` (já
  na tabela do motor) faz o colosso começar com metade do Ataque e da Velocidade e acordar nos 5 primeiros
  turnos, e as fases somam Ataque em cima disso. Golpes escolhidos entre os que já estavam em `TIPO_DO_GOLPE`
  (só `thunder-punch` entrou novo) — de quebra, nenhum deles é de Fogo/Água/Psíquico/Gelo/Voador/Dragão, então
  só a descrição do `prisma-de-luz` mudou (Arceus tem ponto fraco). Com 16 chefes o rodízio de itens novos
  deixou de ser 1 pra 1: os dois primeiros da lista saem duas vezes na volta.

## Modo offline, convenções, testes e Supabase (versão anterior)

## Modo offline

- `sw.js` (service worker, registrado no `index.html`): arquivos do jogo em **rede primeiro** (online pega sempre a versão nova, sem trocar versão a cada deploy; offline cai no cache), PokéAPI/sprites/esm.sh/fontes em **cache primeiro**, Supabase nunca em cache. **Todo arquivo novo em `js/` entra em `PRECACHE`** — `tests/sw.test.js` falha se esquecer.
- Offline (`offline()` em util.js): `sortearOponente` só sorteia Pokémon já em cache (`pokemonEmCache`/`idsEmCache` em api.js); sem nenhum, `erroOffline` com mensagem clara em vez do erro da PokéAPI. Alfa idem.
- Nuvem offline: envio do save fica pendente; `online` → `sincronizar()` (sobe jornadas terminadas + save; save da nuvem de jornada que já terminou é apagado ali). Se o jogo abriu offline, `iniciarNuvem` tenta de novo no `online` (listeners de rede registrados uma vez só). Selo "📴 offline" no topo (`#conta-chip`), com ou sem conta.
- **O download (`baixarGen`) precisa trazer TUDO o que uma jornada pede, não só os Pokémon.** Já faltou duas vezes, e nos dois casos o jogo dizia "mapa baixado" e falhava no avião: (1) **curva de XP e árvore de evolução** (`loadSpecies`/`loadGrowth`/`loadEvo`) — `criacao.iniciarJornada` pede as três ANTES de montar o save, então sem elas nem dava pra começar uma jornada offline, e `checkEvolution` morria a cada nível; (2) **sprites que falhavam calado** (`fetch(url).catch(() => {})`), que davam ícone de imagem quebrada em uns Pokémon e não em outros. Ao acrescentar qualquer busca nova num fluxo de jogo, perguntar: **isso está no `baixarGen`?**
- **`VERSAO_DOWNLOAD` (offline.js)**: quando a lista do que o download traz cresce, subir esse número. `jaBaixado` exige a marca `baixado-v<N>:gen<G>` (gravada só quando o download termina SEM falha) além dos Pokémon em cache, então quem baixou na versão antiga volta a aparecer como incompleto — `precisaRebaixar(gen)` é essa pendência, separada de "faltam N Pokémon" pra tela não mentir na contagem.
- **`try` largo demais vira diagnóstico errado.** `previewSearch` (criacao.js) envolvia busca de rede E montagem da prévia num `try` só, reportando tudo como `apiErr`. Uma função que faltava (`opcaoShiny`, chamada e nunca escrita) virou "A conexão falhou ao buscar um dado da PokéAPI" — e o jogador passou horas limpando cache e trocando de rede. Hoje são dois `try` com mensagens diferentes. Regra: **só o que fala com a rede pode reportar erro de rede**; o resto mostra o erro de verdade.
- **Função chamada dentro de template literal só quebra quando a tela é desenhada** — `node --check` não pega, e teste de função pura também não, porque a UI nunca roda nos testes. `tests/referencias.test.js` varre `${nome(` em todos os `js/*.js` e exige que `nome` exista ou seja importado.
- **As imagens vêm do `cdn.jsdelivr.net`** (espelho do repositório de sprites da PokéAPI), não do `raw.githubusercontent.com` — diagnosticado num aparelho real: `pokeapi.co` respondia e TODA imagem dava `net::ERR_FAILED`, porque esse domínio é bloqueado em muitas redes. `espelhar(url)` (dados.js) traduz o endereço antigo, e é obrigatório em qualquer lugar que desenhe `m.data.sprite`/`back`/`art`: a própria PokéAPI devolve URLs do raw.githubusercontent dentro dos dados, e o que já está guardado no aparelho (ou no save) continua com o endereço velho.
- **Quem guarda as IMAGENS é o service worker**, não o `api.js`. Sem sw controlando a página (primeira visita, ou logo após Ctrl+Shift+R) o download termina "com sucesso" e nenhuma imagem fica guardada — `semServiceWorker()` (offline.js) detecta e a tela de Ajustes manda recarregar antes de baixar.
- **`navigator.onLine` mente.** Ele só diz que existe interface de rede, não que ela chega a algum lugar (wifi de metrô, portal cativo, 4G ruim = "online"). Por isso `cached()` (api.js) **cai no registro guardado quando o `loader()` falha**, e não só quando `semRede()`. Antes ele descartava um registro bom (por faltar campo novo do `valido`) e morria no fetch: dava "A conexão falhou ao buscar um dado da PokéAPI" e não dava pra começar jornada nenhuma, com o mapa inteiro baixado. Qualquer código novo que decida algo por `offline()`/`onLine` precisa ter um caminho de "tentei e falhou" também.
- **Busca que não é essencial não pode derrubar o fluxo.** `criacao.iniciarJornada` pega a árvore de evolução em `try/catch` e deixa `evo` como `undefined` (≠ `null`, que significa "não evolui"): `progressao.arvoreDe` busca depois e `checkEvolution` marca `evoPendente`. Regra geral: antes de dar `await` numa busca de rede num caminho crítico, perguntar se o jogo precisa DAQUILO agora.
- `apiErr(e)` diz qual dado faltou (`e.url` marcada em `getJSON` → `dadoQueFaltou`). Erro de rede genérico não deixa ninguém consertar nada.
- `cachePrimeiro` (sw.js) usa `match(req, { ignoreVary: true })`: o mesmo sprite é pedido por `fetch()` (download) e por `<img src>` (tela), e o servidor responde com `Vary: Authorization,Accept-Encoding` — comparar cabeçalho aí só serve pra dizer "não tenho" com o arquivo guardado do lado.

## Convenções

- **Nunca gravar arquivo com BOM.** `Set-Content`/`Out-File -Encoding utf8` no Windows PowerShell 5.1 escreve UTF-8 **com BOM**, e isso já quebrou o deploy do banco: o Supabase recusou o `config.toml` com `toml: invalid character at start of key: U+00EF 'ï'` — o BOM lido como caractere. Em .sql, .toml, .json e .yml o BOM é veneno. Para gravar sem: `[System.IO.File]::WriteAllText($caminho, $texto, (New-Object System.Text.UTF8Encoding $false))`. As ferramentas de edição do Claude Code já gravam sem BOM; o risco está nos scripts de `ferramentas/` e em qualquer arquivo escrito via PowerShell.
- **Toda funcionalidade nova atualiza o `README.md`** (o que o jogo tem + a lista de próximos passos/já feito) — pedido explícito do usuário, vale sempre.
- Regra nova (conta, fórmula, probabilidade) vai em `regras.js` como função pura, com teste; o módulo de narração só chama e escreve a mensagem.
- Tudo que só `regras.js`/`dados.js`/`util.js`/`api.js` importa precisa continuar sem DOM (importável no Node).
- `esc()` em todo texto vindo de fora (apelido, dados da API) dentro de template string.
- Estado compartilhado sempre via `G.*` (nunca `let` exportado).
- Fontes: `--display` (Fredoka) para títulos e números, `--body` (Atkinson Hyperlegible) para texto. A Pixelify Sans saiu (confundia 2/5/8); não voltar a usar fonte pixelada em número.
- **Campo de formulário já nasce vestido (29/09/2026).** `input`/`select`/`textarea` têm uma regra BASE no topo do `estilo.css` (fundo `--panel2`, borda `--line`, raio 10, padding) — não precisa estilizar campo novo à mão. Antes cada tela estilizava o seu, e esquecer uma fazia o navegador desenhar o **padrão dele (fundo branco)**; como a linha `button,input,select{color:inherit}` já dava texto claro, o resultado era texto claro em fundo branco — ilegível, e uma faixa branca no meio do layout escuro (relato do usuário: Equipar item, busca da criação, chat da sala, código da sala, apelido). A base usa **`:where()`** de propósito: ele não soma especificidade, então a regra pesa (0,0,1) e é PISO, não teto — as ~13 regras por classe que já existiam (`.search input`, `.qtd-ctl input`…) continuam ganhando. Escrever `:not()` solto ali pesaria (0,3,1) e quebraria justamente os campos que já estavam certos. `select option` também é estilizado (a lista que abre no celular herdava o texto claro e sumia no branco); caixa de marcar, rádio e `type=file` ficam de fora (desenho nativo).
- Logo e ícones: `img/logo.png` (topo e README, fundo transparente), `img/favicon-32.png` e `img/icone-192.png` (quadrados, gerados do logo com margem transparente — o original é 373×309). Estão no PRECACHE do sw.js.

## Testes

`tests/*.test.js` com `node:test` — rodar com `node --test` **sem caminho**. CI em `.github/workflows/testes.yml` roda a cada push/PR (aba Actions do GitHub).

**`tests/docs-numeros.test.js` trava os números DESTE arquivo e do README contra o código** (29/09/2026). Motivo: um levantamento do backlog achou 6 afirmações erradas de uma vez — "~30 badges" quando são 53, "96 formas, 93 espécies" de Mega quando são 95/89 (contradizendo o "89 Megas" escrito algumas linhas abaixo), e coisas dadas como pendentes que já estavam prontas. O usuário planeja em cima destes textos; número velho aqui custa tempo de verdade. São três testes: dois com frases-âncora (badges, Megas, habilidades, flags de golpe, `AINDA_EVOLUI`, itens de raide, nº de chefes e o `% N` do calendário) e um genérico que varre **toda** ocorrência de `` `CONSTANTE` = N `` nos dois .md e compara com o valor exportado de verdade — esse pega de graça o que ninguém lembrou de travar à mão. Ele entende as formas que a prosa usa (`1.000` com ponto de milhar, `20%` para um `0.2` no código), então escrever normal não dá alarme falso. **Mudou o número no código → atualize a frase no .md**; se a FRASE foi reescrita, o teste diz qual âncora não achou nada, de propósito, pra não passar batido.

## Supabase: schema sobe sozinho (integração nativa)

> ⚠️ **Ficou mudo por dias por causa de um campo mal preenchido (24/09/2026).** Duas migrations de teste foram
> commitadas no `main` e nenhuma chegou no banco, sem nenhum erro no painel. Causa: o **working directory** estava
> como `/supabase`. Esse campo pede o diretório que **CONTÉM** a pasta `supabase/` — aqui ela está na raiz, então
> o valor certo é **`/`**. Com `/supabase`, ele procurava `/supabase/supabase/migrations` e não achava nada.
> O `supabase/config.toml` também precisa declarar o Postgres do projeto (`select version()` → 17 aqui).
>
> **Como verificar que uma migration chegou** (não confie no painel): consulte a tabela pelo cliente do jogo com
> `select('*').limit(1)` **e uma tabela inexistente de controle**. `select('*', { count: 'exact', head: true })`
> devolve `error` nulo mesmo pra tabela que não existe — esse detalhe fez um diagnóstico dar "tudo OK" e escondeu
> o problema por uma rodada inteira.

O banco é atualizado pela **integração do GitHub no painel do Supabase** (Settings → Integrations → GitHub): repositório conectado, *working directory* **`/`** (a raiz — o campo pede o diretório que CONTÉM a pasta `supabase/`, e não ela mesma), *Deploy to production* ligado na branch `main`. Nada de secret no GitHub — a conexão é do lado do Supabase.

Por isso o schema vive em **`supabase/migrations/`**, no formato do Supabase CLI:

- **Mudança nova = ARQUIVO NOVO**, nunca editar uma migration já aplicada: o Supabase guarda quais já rodaram e não roda de novo.
- **Nome no padrão do CLI**: `<AAAAMMDDHHMMSS>_nome.sql` (ex. `20261001093000_mega.sql`). A integração ordena por esse carimbo; nome fora do padrão ela ignora.
- `20260923120000_base.sql` é o schema inteiro como estava quando adotamos migrations — idempotente, então aplicar num banco que já tem tudo não muda nada.
- **Uma vez só, à mão: `supabase/LIGAR-MIGRATIONS.sql`.** Projeto criado direto pelo SQL Editor (o nosso) não tem a tabela de controle `supabase_migrations.schema_migrations`, e a integração falha com `relation "supabase_migrations.schema_migrations" does not exist` — ela precisa da tabela pra saber o que aplicar, mas não a cria sozinha. Rodar esse arquivo no SQL Editor resolve de vez; depois é só merge no `main`.
- `tests/schema.test.js` lê a pasta inteira (soma das migrations) pra conferir que os pesos de pontuação do SQL batem com os de `regras.js`. **Mudou a fórmula num lado, muda no outro**, senão o servidor recusa jornadas legítimas.
- Nada destrutivo aqui: `drop`/`alter` que possa perder dado de jogador vai num arquivo rodado à mão, porque este fluxo roda sozinho.

## Sucker Punch, badges de parceiros, Insígnia Alpha, clima das rotas (versão anterior)

- **Sucker Punch** (`soSeAlvoAtaca` em `especiais.js`): `vol.golpeEscolhido` é preenchido por `batalha.turn`/`mp-motor` antes de resolver o turno e apagado em `fimDaRodada`;
  falha se o alvo escolheu status, não escolheu golpe (item/fuga) ou já agiu (`primeiro` falso).
- **Badges de parceiros** (`badges.js`, grupo `Parceiros`): `casa-cheia` (venceu com `equipeCheia && esconderijoCheio`, 2+30 parceiros),
  `lobo-solitario` (venceu com `amigos === 0`) e `cemiterio` (`ALVO_PERDIDOS` = 15 aliados PERDIDOS de vez numa MESMA run). Medem uma jornada, nunca a
  soma; ignoram `easy`; as duas de vitória usam `venceu(j)`. Dados novos no resumo da jornada (`fim.montarResumo`: `casaCheia`, `aliadosPerdidos`) e no
  `progresso-conta.bancar` (senão somem — o resumo é lista branca). `S.aliadosPerdidos` sobe em `batalha.anunciarQuedas` e no co-op (`multiplayer`), SÓ em modo
  `permadeath`: nos outros o aliado só desmaia e volta, então "perder" = cair de vez (na prática, Roguelike). Jornadas antigas não têm os campos (contam 0).
- **Insígnia Alpha** (`js/alpha.js`, testada em `tests/alpha.test.js`): sem tabela nem contador — é a data de criação da conta
  (`perfis.criado_em` → `nuvem.criadoEm`, lida em `sincronizar`) antes de `ALPHA_ATE`. `htmlCartaoAlpha` na tela Conta e `htmlInsigniaAlpha({compacto})`
  no chip do topo (`conta.js`); ids do SVG únicos por desenho (`seq`). **Depois de anunciar o Beta, NÃO mexer em `ALPHA_ATE`** (é o que faz a insígnia valer).
  Não aparece no ranking/salas: esses dados de OUTROS jogadores não trazem `criado_em`.
- **Clima das rotas é OPCIONAL por jornada**: `S.climaRotas` (escolhido na criação, caixa `#pv-clima`, `G.climaRotas`), ou forçado por
  `DIFICULDADES[x].climaRotasFixo` (Roguelike e Hardcore: caixa marcada e travada). Sempre perguntar via **`regras.climaDasRotasAtivo(S)`**
  (cobre save antigo sem o campo) — `batalha.iniciar` e `multiplayer` (co-op, run do anfitrião) só passam a rota a `novoCampo` se ativo.
  **Mega do inimigo**: `mega.inimigoMegaLiberada(E)` = nível ≥ `NIVEL_MEGA_INIMIGO` (40), checado em `batalha.megaDoInimigo` SEM marcar
  `megaInimigoUsada` (o Tera do inimigo, que só usa `inimigoPodeMega`, segue livre em qualquer nível). O 40 é o NÍVEL do Pokémon inimigo.
- **Clima/terreno padrão de rota**: `regras.CLIMA_DA_ROTA` (id da rota → `{clima}` ou `{terreno}`; testado contra `dados-mapas.js`
  em `tests/clima-rota.test.js`; Santuário e luta final ficam de fora) e `novoCampo(rotaId)`, usado por `batalha.iniciar`
  (`G.S.zone`) e `mp-motor.novaBatalhaMP` (`opcoes.zona`, só co-op; PvP = campo limpo). O campo ganhou `climaFixo`/`terrenoFixo`
  (o contador não anda — não usar `Infinity`, que vira `null` no JSON do save) e `padrao {clima, terreno}`. `golpe.mudarClima`/
  `mudarTerreno` desligam o fixo (troca dura 5 turnos; repetir o mesmo da rota é no-op); `passarClima`/`passarTerreno`, ao
  esgotar, RESTAURAM o padrão da rota. **Weather Ball**: `regras.golpeDoClima(g, clima)` devolve uma CÓPIA com tipo/poder do
  tempo — usada em `golpe.executar` (o PP já foi gasto no original) e nos botões (`render.js`, `multiplayer.js`). **Castform**
  (`forecast` → `formaDoClima`): `golpe.ajustarForma` troca `m.data` por uma CÓPIA (tipos + sprite pelos ids 10013/14/15) ao
  entrar, no começo de todo `usarGolpe` (usuário e alvo) e no fim do turno; `desfazerForma` roda em `endBattle`. Cherrim
  (Flower Gift) só tem o bônus de atributo, sem troca de sprite.

## Lição cara: `node --check` (versão anterior)

- **Duração da run**: `regras.MULT_XP = 0.6` (escolha do usuário). É UM número — se ficar arrastado, suba.
- **Decidido com o usuário (28/09/2026)**: confirmado que o inimigo TAMBÉM deveria gigantamaxar (só treinador) —
  ao investigar pra implementar, achei que **já existia** (`batalha.gmaxDoInimigo`/`dynamax.inimigoPodeGmax`,
  testado em `tests/gimmicks-coop-inimigo.test.js`): esta nota de "em aberto" tinha ficado esquecida no CLAUDE.md
  depois que o recurso foi construído. Nada a fazer aqui. Painel de manutenção **continua** (jogo ainda em ajuste
  ativo, modo beta da Raide ligado); teto de aliados **continua em 2** (o Esconderijo já resolve "guardar mais
  parceiros" sem mexer em quantos agem por turno — subir o teto mudaria o balanceamento da batalha, não só
  armazenamento).

### ⚠️ Lição cara (25/09/2026): `node --check` não roda nesta máquina
`S?.escondidos ||= []` — optional chaining como alvo de atribuição é **erro de sintaxe**. Derrubou o jogo inteiro
(tela branca) porque o módulo não parseava e levou junto `render.js`, `itens.js` e `amizade.js`. Um `node --check`
pegaria em um segundo. Enquanto não houver Node aqui: **arquivo novo ou reescrito é o maior risco do projeto**, e
o CI é a única rede de verdade. Avisar "não rodei os testes" não basta quando o erro não falha um teste — ele
impede o jogo de abrir.

## Decidido com o usuário, ainda NÃO implementado

Ordem acordada: **1 ✅ contadores + telas** · **2 ✅ cada Gen é uma jornada** · **3 ✅ badges com vantagem** · **4 ✅ Mega** · **5 ✅ Tera** · **6 ✅ Z-Move** · **7 ✅ Dynamax** · **8 habilidades restantes**. A reforma das jornadas (2) vem ANTES das vantagens (3) porque reescreve a criação e o fim de jornada, que é exatamente onde as vantagens se penduram.


## Anti-grind e outras decisões (versão anterior)

### ✅ FEITO — Anti-grind: rota esgotada (só no Roguelike)
(Estava listado aqui como "ainda NÃO implementado" até 29/09/2026, quando conferi rodando: já estava pronto havia
tempo. Mesmo tipo de nota esquecida que o Gigantamax do inimigo — ver o item de 28/09 em "Decidido com o usuário".)

`regras.rotaEsgotada(z, nivel, dificuldade)` (pura, `tests/regras.test.js`): quando o seu nível passa do limite da
rota, ela deixa de dar caçada — nada de farmar em rota fraca. Você continua **entrando e vendo a Pokédex dela**
(quem vive ali, taxas, Alfa); o que some é só o encontro. **Só no Roguelike** (compara a dificuldade direto).
O limite é `limiteDaRota(z)` = `max(z.max * FATOR_ESGOTADA, z.max + MARGEM_ESGOTADA)` — o **dobro do teto** (2), mas
com um piso de **+15 níveis**: sem essa margem, a 1ª rota (teto 6) esgotaria no nível 13, cedo demais pra quem
ainda está montando a equipe. Só muda rotas de teto abaixo de 15; do meio do mapa pra frente o dobro é que manda.
Lido em `mundo.explore` (bloqueia o encontro) e em `render.js` (o botão vira "✔ Rota esgotada" e a rota explica o
porquê, em vez de simplesmente não acontecer nada — falha muda vira relato de bug).

### Outras decisões
- **XP por Gen fica canônico** (Paldea dá ~20% mais XP por ponto de força que Kanto): é dado da franquia, não erro nosso.
- **Formas de Hisui ficam no Santuário de Galar** (Gen 8, como a PokéAPI classifica), não em Sinnoh.
- **Paradoxo de Paldea** já aparecem sozinhos na Área Zero e na Borda da Grande Cratera, além do Santuário — não precisou de nada.


---

## Travas, IA e troca de Pokémon (desenho de 29/09/2026)

Pedido do usuário: resolver os golpes que travam (Taunt/Encore/Disable), melhorar a IA dos inimigos pra usar isso, e
achar uma solução pras habilidades, golpes e itens que dependem de TROCAR de Pokémon. Feito em 3 etapas, cada uma um
commit com teste. Decisões fechadas com o usuário (via pergunta):

- **Regenerator / Natural Cure** → agem **ao vencer a luta** (Regenerator recupera 1/3 do HP, Natural Cure tira o
  status). É o equivalente de "sair de campo" pra quem joga sozinho.
- **Roar / Whirlwind / Dragon Tail / Red Card** → contra selvagem, **encerra a luta**; contra treinador, **chama um
  aleatório da equipe** (o atual sai sem contar como derrotado, sem XP dele); **contra o jogador, quem levou o golpe
  SAI da luta e ela segue sem ele** (aliados continuam; se estava sozinho, a luta acaba como uma fuga, sem penalidade).
- **Wimp Out / Emergency Exit / Eject Button** → só nos **inimigos e aliados**. Nos Pokémon principais do jogador
  continuam sem efeito (uma habilidade sorteada no Hardcore não pode te tirar da luta contra a vontade).
- Ordem: 1. travas · 2. IA · 3. trocas.

### Etapa 1 — travas (FEITA)
- **`regras.motivoBloqueio(m, g)` é a única fonte** do que um Pokémon pode escolher: Choice, Colete de Assalto, Taunt,
  Encore, Disable, Torment e PP. `golpesPermitidos(m)` filtra; lista vazia = Struggle. Antes a trava do Choice estava
  COPIADA em 4 lugares (render.js, arena.js, multiplayer.js e golpeDoAliado) e o motor confiava cegamente na tela;
  com mais quatro travas isso viraria 16 cópias, e a IA não teria de onde ler o que o ALVO pode fazer. Agora as 3
  telas, os aliados (`golpeDoAliado` recebe a lista já filtrada), a IA (`escolhaIA` idem) e o motor perguntam à
  mesma função. O bônus: **Gorilla Tactics** deixa de ser bloqueada pelo problema das "3 telas" (ainda não feita).
- **O motor confere também** (`golpe.usarGolpe`, no ponto onde ficava o cheque solto do Colete de Assalto),
  porque a ordem do turno importa: o inimigo mais rápido que te provoca DEPOIS de você escolher um golpe de status
  faz o seu golpe falhar (sem gastar PP). No **Encore** a escolha é TROCADA pelo golpe repetido (Gen 5+), e isso vale
  também na ordem do turno (`batalha.turn` e `mp-motor` aplicam `golpeForcado` antes de calcular a prioridade).
  Carga/fúria em andamento (`golpeTravado`) e Struggle ficam de fora.
- **Estado em `m.vol`** (só dados simples: vai no save e pela rede): `ultimo` (último golpe usado, novo — nada
  guardava isso), `provocado` (turnos), `encore {golpe, turnos}`, `desativado {golpe, turnos}`, `tormento`.
  Prazos: Taunt 3, Encore 3, Disable 4, **+1 se o alvo já agiu neste turno** (o turno em que foi aplicado já passou).
  Contam em `golpe.fimDeTurno` via `regras.passarTravas`, que devolve o que acabou pra narrar. Torment dura a batalha.
- **Falhas** (`regras.falhaDaTrava`): chefe de evento é imune (como a status); já estar sob o efeito; Encore/Disable
  sem golpe pra repetir; Encore num golpe sem PP; Encore de Encore/Mimic/Transform/Sketch/Mirror Move/Me First/Struggle.
  **Encore suspende sozinho se o golpe repetido ficar sem PP** (`motivoBloqueio`) — senão o Pokémon ficaria sem golpe.
- **Habilidades**: gancho novo `imuneTrava` (lista de travas que não pegam). Oblivious → `['provocar']`; **Aroma Veil**
  (nova, 209 de 314) → as quatro. Testado em `tests/habilidades.test.js` (o teste do gancho valida contra `TRAVAS`).
- UI: `regras.resumoTravas(m)` devolve as linhas "😤 Provocado por 2 turno(s)…" que as três telas mostram; o botão
  bloqueado explica o motivo no `title`. O Colete de Assalto agora apaga os botões de status (antes o clique passava
  e só o motor recusava).
- Testes: `tests/travas.test.js` (18) — inclui os casos que SÓ o motor pega. Conferido por mutação: desligar a
  conferência do motor, o `golpeForcado` ou o filtro da IA faz testes falharem.
- **Fora do escopo por ora**: Heal Block, Imprison, Throat Chop, Magic Bounce refletindo Taunt, Mental Herb, e
  mostrar o "provocado/encore" do INIMIGO na placa dele (hoje só aparece narrado no log).

### Etapa 2 — IA com nota por golpe (FEITA)
Antes: `escolhaIA` era "maior dano ou sorteio"; `melhorGolpe` dava nota 0,1 a QUALQUER golpe de status, então o inimigo
só usava Toxic, Reflect ou Swords Dance por sorteio; `esperteza` (0,5 / 0,75 / 0,9) só decidia "acerta o maior dano ou
sorteia". Agora `regras.escolhaIA(moves, tiposA, tiposAlvo, esperteza, sorte, contexto)` ganhou o parâmetro opcional
`contexto = { u, alvo, campo, ladoU, ladoAlvo }`; com ele, cada golpe recebe uma nota (`notaDoGolpe`) e "pensar" é
escolher a maior. **Sem contexto, ou no degrau `simples`, o comportamento é exatamente o antigo** (os testes antigos
seguem valendo sem mexer).
- **A escala**: ≈ "% do HP do alvo que o golpe vale". Dano = `min(1, dano/HP do alvo) × 100 × precisão`; status é
  posto na mesma régua (dormir 55, paralisar 40 (+15 se o alvo é mais rápido), queimar 40 (+15 se o alvo bate físico),
  veneno 30…). Assim dá pra comparar "atacar" com "paralisar" com "se curar" numa conta só.
- **Dano esperado**: `calcDamage` ganhou o 7º parâmetro `esperado` (sem crítico, rolagem no meio, 92,5%). Sem isso
  um crítico ou uma rolagem baixa mudaria a escolha de um turno pro outro.
- **Três degraus** (`nivelDaIA(esperteza)`): `simples` = selvagem; `basico` = treinador (dano + status que pega + cura;
  o resto vale `IGNORADO`); `completo` = Alfa, lendário e chefe (buffs/debuffs, telas, clima, terreno, Taunt/Encore/
  Disable, proteção, Leech Seed, Toxic, Rest…). A esperteza continua sendo a **chance de pensar**; quando "se distrai" o
  inimigo sorteia, mas só entre os golpes razoáveis (nota > −50): nunca um golpe imune ou uma tela repetida.
- **Regras que a IA respeita**: imunidade de tipo/habilidade (Levitate, Volt Absorb, Soundproof…), status só em quem
  não tem status e não é imune (e sem Safeguard), cura só com HP ≤ 65%, buff só até +2 e só com folga de HP, Ataque só
  pra quem tem golpe físico, tela/clima/terreno que já está ativo vale −100, proteção nunca duas seguidas, Explosion
  só se derruba, golpe de 2 turnos ×0,6, golpe que derruba ganha +40 (+30 se tem prioridade), Taunt só vale contra
  quem tem golpe de status (e menos se ele acabou de bater), Encore só contra quem acabou de usar buff/golpe fraco.
- **`esp.armadilha` vale −100**: do lado do jogador ninguém troca de Pokémon, então Stealth Rock/Spikes não pegam
  ninguém — a IA sabe. Se um dia existir troca voluntária, é só tirar essa linha.
- Empate de nota: sorteia entre os empatados (senão o inimigo seria sempre o primeiro golpe da lista).
- **Chamadores**: `batalha.chooseEnemyMove` (single player) e `mp-motor.acaoDaIA` (sala), sempre sobre
  `golpesPermitidos` (etapa 1). Aliados NÃO usam isso: continuam no `melhorGolpe`/`ordem` que o jogador escolhe.
- Testes: `tests/ia.test.js` (21). Conferido por mutação (status voltando a valer 0,1, imunidade ignorada, buff sem
  teto, treinador enxergando tudo). Simulei 60 lutas completas IA×IA no motor da sala com esperteza de chefe: 0 erros
  e o uso saiu coerente. Isso achou um erro de desenho: o Taunt valia 12 pontos até contra quem só tem golpe de dano.
- **Fora do escopo**: o inimigo não prevê o golpe do jogador (escolhe sem saber), não avalia recuo/HP próprio ao bater,
  não conta golpes de vários acertos, e o alvo é sempre o primeiro do seu lado em pé.

### Etapa 3 — trocas (FEITA, só no single player)
Cada dependência de troca foi ligada ao evento equivalente que já existia. **A primitiva é `ctx.forcarSaida(m, {motivo})`**,
implementada em `batalha.forcarSaida`; o motor (`golpe.js`, via `sairDeCampo`) só PEDE, porque quem tem a batalha é que
sabe o que "sair" quer dizer. Sem o método no ctx (multiplayer) o golpe falha com aviso.
- **Selvagem**: foge, a luta acaba (`B.saidaForcada = 'inimigo'`), sem XP nem dinheiro. **Treinador**: manda outro
  (`regras.proximoDoTreinador`: Roar & cia. SORTEIAM; Wimp Out manda o próximo da fila); o que saiu ganha `vol.retirado`
  e NÃO conta como derrotado — volta depois se ainda estiver de pé. **Alfa, lendários, chefe da semana**: falha.
- **Seu lado**: quem levou o golpe ganha `vol.retirado` e some de `emCampo()`; a luta segue com os outros. Se era o
  último em campo, `B.saidaForcada = 'jogador'` e acaba como fuga. Você (principal) arrastado com aliados vivos vê só
  o botão **⏭ Assistir o turno** (`turn({type:'passar'})`); se eles caírem, a luta termina (`turn()` confere no fim).
  **Wimp Out/Emergency Exit NÃO tiram o seu principal** (decisão do usuário: uma habilidade sorteada não pode te expulsar).
- **`vol.retirado` vive no `vol`**, que `iniciar()` e `endBattle()` zeram: não vaza pro save nem contamina a próxima luta.
- **Decisões de desenho que valem lembrar**: (1) NUNCA chamar `endBattle()` de dentro de um golpe — `turn()` continua
  usando `B` depois; por isso só se MARCA `B.saidaForcada` e o loop para. (2) O inimigo pode ser trocado no meio do turno,
  então `E` virou `let` e é relido de `B.enemy` a cada ação; a ação pendente de quem saiu é pulada (`vol.retirado`) —
  sem isso o Pokémon que saiu bateria no que acabou de entrar. (3) `win()` deixou de fazer `T.atual++`: o próximo é o
  primeiro de pé (`proximoDoTreinador`), senão um Roar deixaria um Pokémon vivo para trás e a fila reencontraria os mortos.
  As bolinhas da equipe (render.js) passaram a contar só `hp > 0`.
- **Regenerator / Natural Cure** agem ao **vencer a luta** (`batalha.habilidadesAoVencer`, chamada quando cai o ÚLTIMO
  da fila, antes de `vencerGen`/`vencerEvento`), em todo o seu lado de pé — inclusive quem foi arrastado. Regenerator
  1/3 do HP (`regras.efeitosAoVencer`, sem passar do máximo).
- **Cartão Vermelho** (`red-card`, ₽3.000, gancho `cartaoVermelho` em segurados.js): quem acerta o portador sai; o
  cartão se gasta. **Eject Button/Eject Pack NÃO foram feitos**: com a saída voluntária vetada no seu principal só
  serviriam a aliados. **Shed Tail** também não (não existe Substitute).
- **Mean Look / Block / Spider Web** (`prende`): `vol.preso` bloqueia o "Fugir" (single e sala); Fantasma é imune.
- **Baton Pass** (`passaBonus`): os estágios (e o Focus Energy) vão para o primeiro aliado em campo e quem usou volta a
  zero; sem aliado, falha. Como você nunca troca, a semântica é "transferir", não "sair e passar".
- **Slow Start** (`inicioLento: 5`, lê `vol.turnosEmCampo`, contado em `fimDeTurno`) e **Stakeout** (`emboscada: 2`, lê
  `vol.recemEntrou`, posto quando o treinador manda outro e limpo em `fimDaRodada`). Stakeout só dobra contra o
  inimigo que ACABOU de entrar — você nunca "entra".
- **Habilidades novas** (209 → 215): regenerator, natural-cure, wimp-out, emergency-exit, slow-start, stakeout.
- **Testes**: `tests/saida.test.js` (13; o ctx é um espião que prova QUANDO o motor pede a saída) + conferência por
  mutação. `batalha.js` não é testável em `node:test` (depende de DOM): foi validada em jsdom com um harness descartável —
  a saída de campo em todos os casos, `turn()` inteiro com o `render()` real (Roar trocando o inimigo no meio do turno,
  você fora e os aliados lutando, luta sem ninguém em campo, vitória com Regenerator) e a quebra proposital da proteção
  `retirado` (o Pokémon que saiu passa a bater no novo: HP 63 em vez de 100).
- **Fora do escopo**: multiplayer (Roar & cia., Regenerator, Wimp Out não valem lá), Eject Button, Shed Tail, Dancer, e a
  IA do inimigo ainda não USA Roar/Mean Look de propósito (vale `IGNORADO` em `notaDoGolpe`).

Também nasceu do trabalho desta etapa: um terceiro teste em `tests/referencias.test.js` — todo ajudante que OUTRO módulo
exporta e que este arquivo chama tem de estar importado. O `nm()` esquecido no render.js (dentro de um `esc(...)`) seria
o segundo `ReferenceError` mudo da semana, depois do `SPR_SHINY` da Sala de Raide.

---

## Itens de raide: "serve contra quem?" (29/09/2026)

Pedido do usuário: descrever o que os itens de raide fazem e para quais bosses servem. O achado que motivou o desenho:
**o prêmio dos chefes é um rodízio (`evento.ev()`), não temático** — o Groudon dá Prisma de Luz (só serve contra chefe com
ponto fraco; ele não tem), o Calyrex dá Célula Zygarde (só serve contra a regeneração do Zygarde), o Rayquaza dá Escama
Abissal (ele não ataca com Água). Olhando o item ninguém sabe se ele presta pra luta de hoje.
- **A fonte é o código.** `js/itens-raide.js` responde "serve contra quem?" lendo `boss.CHEFES` (ponto fraco, regeneração,
  golpe carregado) e `evento.EVENTOS` (os 4 golpes de cada chefe). Como o evento guarda golpes só como NOMES e a resposta
  tem de sair sem rede, `TIPO_DO_GOLPE` mapeia cada golpe de chefe ao tipo; o teste falha se um chefe novo usar golpe fora
  da tabela. Regra de cada item em `SERVE`: "todos" (Ruptura, Interrupção, Escudo, Espelho, Relógio, Fragmento e os
  passivos), por tipo de golpe (Cinza=Fogo, Escama Abissal=Água, Escama do Céu=Voador/Dragão, Cristal Psíquico, Cristal
  Gélido), ponto fraco (Prisma) ou regeneração (Célula).
- **A descrição do item (dados.js) leva o resultado**: `… Um por luta. Serve contra: A, B e C.` É a fonte única mostrada
  na dica dos botões (Arena e sala), na mochila da run e na tabela da ajuda. O texto é ESTÁTICO (dados.js não pode importar
  evento.js: ciclo), mas `tests/itens-raide.test.js` confere descrição × derivado para os 17 itens — mecânica nova de
  chefe que mude a resposta faz o CI acusar o texto velho. Verificado dando um ponto fraco ao Groudon em memória: a lista
  derivada muda e a descrição passaria a mentir.
- **Ajuda dos chefes** (`ajuda-chefes.js` → `htmlItensDeRaide`): duas tabelas (consumíveis e segurados de prêmio) com
  item, o que faz, contra quem serve e quem dá de prêmio (lido de `recompensa` dos chefes).
- **Caixa do chefe** (`linhaItensDoChefe`, Arena e run): separa os itens de raide que VOCÊ tem em "servem" e "não servem
  contra ele". Em co-op/sala a caixa do chefe é outra tela e não ganhou a linha.
- **Erro achado no caminho**: a descrição do Espelho Reverso dizia "inverte a tabela de tipos a seu favor". O motor
  (`boss.danoNoChefe`) aplica a MESMA inversão do Mundo Reverso ao dano que você dá (net ×1/ef): contra quem resiste vira
  super efetivo, mas contra quem é fraco vira resistido. A descrição agora avisa que atrapalha, e um teste prova a
  afirmação no motor. Imunidades (ef 0) não mudam. Contra o Giratina, que já alterna o próprio Mundo Reverso, o item é
  a mesma inversão (não soma).
- **Fragmento Tera** só faz sentido onde há Tera (run, ou sala co-op com run); a Arena e a Sala de Raide não têm gimmicks.
- **Fora do escopo**: esconder/desabilitar o botão do item que não serve no chefe atual (hoje o botão aparece e o motor
  recusa com o motivo; o jogador agora sabe antes pela caixa do chefe), e a linha nova na caixa do chefe do co-op.

---

## Narração do turno na sala (29/09/2026)

Pedido do usuário logo depois de destravar a Raide: "está muito automático a aplicação dos danos, é interessante
mostrar exatamente quem está atacando, pra ter uma noção das ações".
- **O problema**: `resolverTurnoMP` resolve o turno INTEIRO e devolve os eventos como texto; `aoReceberEstado` fazia
  `for (const e of p.eventos) logRaw(...)` — tudo no mesmo instante. No single player nada disso acontece porque
  `ui.say` espera entre as mensagens e `ctx.atacar` anima quem bate. Pior com três Swampert do Hall da Fama: o
  registro dizia "Swampert usou Earthquake!" três vezes e não dava pra saber de quem era qual.
- **Duas partes.** (1) O motor passou a dizer QUEM agiu: `let atuando` + `porConta(ref, fn)` em volta de cada
  `usarGolpe`, do golpe extra do chefe, do item comum e do `fimDeTurno`; `say` põe isso em cada evento (`{txt, cls,
  ref}`). (2) A sala revela as linhas com `PAUSA_NARRACAO` (260 ms) e destaca o cartão de quem age.
- **Quem age é ESTADO, não classe solta**: `sala.atuandoRef`, lido por `cartao()` (que ganhou `data-ref`). A sala se
  redesenha sozinha a cada pulso do anfitrião e a cada troca de presença — com a classe só no DOM, o destaque sumia
  no meio da narração. Verificado forçando um redesenho no meio: o destaque se mantém.
- **`renderSala()` vem ANTES de `narrar()`**: narrar mexe nos cartões que o render acabou de montar. Os botões de
  golpe aparecem na hora, então dá pra escolher enquanto o registro corre atrás (o prazo de 45 s continua valendo).
- **`sala.narrando` é um crachá**: se outra narração começar (ou a sala fechar), a anterior para na hora — senão duas
  narrações escreveriam no registro ao mesmo tempo. Pulso republica com `eventos: []`, então não re-narra.
- **`REDUCED`** (`prefers-reduced-motion`) recebe tudo de uma vez, como antes.
- **Nomes repetidos**: `mp-motor.numerarRepetidos` (puro) numera só os iguais — "Swampert 1/2/3". Fica em mp-motor
  pra ser testável; `montarLado` chama no fim.
- **Limite honesto**: o HP dos cartões já é o do FIM do turno. A foto que chega do anfitrião não tem os passos
  intermediários, então não dá pra animar a barra baixando a cada golpe como no single player — a narração mostra a
  ORDEM e o AUTOR, não o HP caindo aos poucos. Para mudar isso o motor teria de mandar o HP de cada passo.
- **Fora do escopo**: animação de ataque/dano nos cartões da sala (o `hit-flash`/FLIP do single player depende dos
  ids `mon-p`/`mon-e`, que a sala não usa), e a linha "servem/não servem" da caixa do chefe no co-op.
- Testes: `numerarRepetidos` e "todo evento tem autor" em `tests/mp-motor.test.js` (com mutação nos dois). A narração
  em si (DOM) foi verificada em jsdom: 10 linhas saindo em ~5,6 s, destaque passando por A2 → A1 → A0 → chefe, nada
  aceso no fim e o destaque sobrevivendo a um redesenho no meio.

---

## A revisão do multiplayer (29/09/2026)

Pedido do usuário: *"revisar e refazer todo o multiplayer, está muito ruim o design atual, quero uma otimização e
uma evolução no multiplayer, que seja fácil, prático, bom e bonito"*. Era o item "revisão e refatoração completa do
multiplayer" do backlog. Feito em quatro levas, cada uma commitada e testada em separado.

### O ponto de partida (o que estava errado, medido)
`multiplayer.js` tinha **1190 linhas** com menu, rede, autoridade do anfitrião, aplicação no save e todo o HTML
juntos. **Nenhum teste** o cobria — inclusive `aplicarCoop`, que grava XP/HP/dinheiro no save. O lobby era uma pilha
de seções com `<select>` nativos; a escolha do Pokémon existia em **dois lugares** (menu e lobby, com quatro funções
quase iguais); a luta eram cartões de 64 px **sem status nem estágios** (dava pra passar a luta envenenado sem ver);
o prazo do turno era um número em texto. Na rede, o anfitrião publicava a **batalha inteira a cada 4 s** e a cada
escolha de qualquer jogador, e cada pacote recebido reescrevia `#mp-topo` e `#mp-acoes` por completo.

### Como ficou dividido
| Arquivo | Papel | DOM | Rede |
|---|---|---|---|
| `mp-regras.js` | decisões puras: entrada, quem falta, mochila, "por que não dá pra começar" | não | não |
| `mp-rede.js` | canal, envio com fila, pulso, presença, diagnóstico | não | sim |
| `mp-cartao.js` | cartão, placa e a CENA (a Arena importa daqui) | sim | não |
| `mp-resultado.js` | aplicar o fim da luta no save e descontar a mochila | pouco | não |
| `mp-telas.js` | todo o HTML | sim | não |
| `multiplayer.js` | orquestração: entrar/sair, autoridade do anfitrião, ações do `data-act` | — | — |

Três decisões de arquitetura que sustentam isso:
- **A sala mora em `G.sala`**, não num `let sala` de módulo — é a regra do projeto ("estado compartilhado sempre via
  `G.*`") e é o que deixa mp-telas/mp-resultado enxergarem a sala sem importar o orquestrador.
- **A rede nunca importa a tela**: `mp-rede.ligarRender(fn)` recebe o `renderSala` no boot da sala e a rede só chama
  `redesenhar()`. Sem isso haveria ciclo.
- **As telas nunca importam as ações**: quem despacha `data-act` é o `main.js`. Por isso `mp-telas` pode ser o penúltimo
  da cadeia (`mp-regras → mp-rede → mp-cartao → mp-telas → multiplayer`), verificado por `tests/imports.test.js`.

### O que mudou pra quem joga
- **Menu**: duas portas (criar / entrar com código). A escolha do Pokémon **saiu daqui** — acontece no lobby, onde já
  se vê o modo e quem chegou. Morreram `escolherEntrada`, `escolherConvidado` e o `hallEscolha` do menu.
- **Convite**: `📋 código` e `🔗 convite` (link `?sala=XXXX`, montado a partir de `URL_SITE`). O `main.js` lê o
  parâmetro no boot, limpa a barra de endereço com `replaceState` e entra **depois de `iniciarNuvem()`** (antes disso
  não há canal pra abrir). Sem `navigator.clipboard` (http, permissão negada), mostra o texto pra copiar na mão.
- **Espectador** (`entradaTipo: 'espectador'`): `minhasFotos()` devolve `[]`, então a pessoa não entra em lado nenhum;
  `semMochila()` já a cobria de graça; `todosProntos`/`motivoParaNaoComecar` a ignoram de propósito — senão um
  espectador segurava a sala inteira.
- **"Pronto" em todos os modos** (era só da Raide) e **o botão de começar diz por que está apagado**
  (`motivoParaNaoComecar`, puro e testado): quem falta escolher, qual time está vazio, falta de run pro co-op.
- **Config em botões-cartão** e **visível pra quem não é anfitrião** (travada). Antes ele não via configuração nenhuma.
- **Cena de batalha**: `.scene.battle` + `.mon`/`.spr`/`.plate` reaproveitados do single player, em FILAS (até 6×3 não
  caberia no layout de duas colunas de lá) e encolhendo sozinho (`apertada`/`lotada`). Trouxe de graça o que faltava:
  **tipos, status e estágios** na placa (`chipsFor`/`badgesDeTipo` viraram exports de `render.js`).
- **Turno**: barra de prazo (só `style.width`, atualizada pelo relógio — nunca re-render), fichas ✓/⏳ por jogador e
  `📜 turnos anteriores` (`sala.historico`, últimos `MAX_HISTORICO` = 5, só na memória).

### Otimização de rede e render
- **`ping`**: broadcast novo e magro (`turno`, `acoesFeitas`, `prazo`) nas batidas do pulso e a cada escolha. O estado
  completo sai em turno novo, ao sincronizar e a cada `ESTADO_CHEIO_MS` (15 s) como rede de segurança.
  **Compatível com versão antiga**: um cliente que não conhece `ping` ignora o evento e continua se acertando pelo
  estado completo periódico — por isso o pulso leve virou um evento NOVO em vez de um `estado` mais magro (mandar
  `estado` sem `batalha` faria o cliente velho gravar `undefined`).
- **Render por região** (`pintado.topo`/`pintado.acoes`): se o HTML montado é igual ao que está lá, o DOM não é tocado.
- **`renderSala` virou transação**: monta as duas partes e só então escreve. Antes, um erro no meio deixava
  `#mp-topo` novo com `#mp-acoes` velho (o bug do `SPR_SHINY`); o `try/catch` só reportava.
- **`enviar()` com fila**: uma mensagem por vez, pra seis jogadores agindo juntos não virarem rajada.

### O que ficou de fora (de propósito)
- **Troca de Pokémon entre jogadores** — o usuário não a marcou nesta leva; segue no backlog.
- **Roar & cia. em sala**: `ctx.forcarSaida` continua só no single player. Mexeria no `mp-motor`, que está estável e
  testado, e a refatoração era de arquitetura/telas — misturar as duas coisas na mesma leva seria diagnóstico ruim
  depois. Os itens de "Travas, IA e troca de Pokémon" continuam valendo.
- **Animar o HP baixando durante a narração**: continua impossível pelo mesmo motivo de sempre (a foto que chega é o
  fim do turno). A cena nova não muda isso.
- **jsdom não virou teste do CI**: o projeto não tem `node_modules` nem build. O smoke mora em
  `ferramentas/smoke-multiplayer.mjs` e se explica sozinho quando falta o jsdom.

### Como conferir
`node --test` (653 casos, incluindo `tests/mp-regras.test.js` e `tests/imports.test.js`) e o smoke:
`JSDOM=/caminho/node_modules/jsdom/lib/api.js node ferramentas/smoke-multiplayer.mjs`. O teste de verdade continua
sendo duas abas com `python3 -m http.server 3000`.

---

## 🗺 Missões por rota e o editor de rotas (01/10/2026)

Fechou o item **"Missões próprias de cada mapa"** do `docs/backlog.md`. Veio em duas conversas: primeiro um
documento de proposta (`docs/missoes-por-rota.md`, que continua valendo como registro do levantamento e da
revisão), depois o pedido que mudou o desenho — *"acho que o ideal é você criar um sistema onde eu possa escolher
os pokemons da Gen que estão na rota, consiga criar a missão, a recompensa dela por itens e o nome da missão"*,
com a mesma coisa pros Alfas e **uma análise de curva de stats** da rota.

### O que havia antes, e os dois defeitos

36 missões numa tabela à mão em `dados.js`. A revisão achou dois defeitos de verdade:

1. **`scyther` nascia pronta**: `libera` e `objetivo` eram a MESMA condição (`derrotar: 'scyther', qtd: 1`), então
   no turno em que o primeiro caía a missão aparecia e concluía no mesmo laço do `verificarMissoes` — ₽3.000 por
   uma missão que nunca existiu. E estava rotulada como "Safari", onde não há Scyther no pool nenhum.
2. **25 das 36 só eram alcançáveis em Kanto**: as 15 de espécie não tinham `gen`, então em Johto o `libera` nunca
   era cumprido e elas ficavam escondidas pra sempre, inflando o contador de "escondidas" sem caminho nenhum pra
   revelar. Pior nas formas regionais, onde `speciesName` repete (`rattata` de Alola acordava a missão de Kanto).

Os dois agora são cobrados por teste (`tests/dados.test.js`: `libera ≠ objetivo`, e espécie de `alvos` tem de
estar no POOL da rota). Também: a trilha de Alfas cobria 6 dos 9 (faltavam Usina, Ilhas Espuma e Estrada Vitória,
o trecho mais longo da jornada) e a 5ª liberava por `nivel: 20` em vez da rota anterior, anunciando fora de hora.

### A forma: duas camadas de mapa

`dados-mapas.js` é **gerado da PokéAPI** e não deve guardar escolha de desenho. `dados-rotas.js` é **gerado pelo
editor dentro do jogo** e guarda só o desenho: as 180 missões (uma de espécie e uma de Alfa em cada uma das 10
rotas × 9 Gens; o Santuário não tem, é pós-vitória) e os Alfas trocados (`ALFAS`, hoje vazio).

As duas se juntam em **`dados.js`**, que passou a ser o único arquivo que importa `dados-mapas.js` e a exportar
`GENS`. `mapas.js` e `pokedex-conta.js` leem `GENS` **de lá**. Isso foi deliberado: aplicar a troca de Alfa em
`mapas.js` pareceria mais natural (é o módulo do mapa), mas `dados.js` constrói `ZONES` do mesmo array, e a troca
valeria na tela de explorar e não na batalha — ou pior, o contrário, dependendo da ordem de import. Um dono só.

### A condição `alvos`

Única regra nova no motor (`regras.progressoCondicao`): `alvos: [[especie, qtd]…]`. Várias espécies **somam** e
**cada uma tem o próprio teto** — 20 Plusle e 0 Minun dá 8/16, não 16/16, senão a missão de duas espécies viraria
a de uma só com o dobro da conta. `qualquer: 1` é o que o `libera` usa: ver UM dos dois já revela a missão (exigir
os dois a esconderia por azar na ordem do sorteio da rota). O editor **sempre** emite `alvos`, mesmo com uma
espécie só — um caminho de código, não dois. `derrotar` continua existindo para as missões globais.

### O editor (`js/editor-rotas.js` + `js/tela-editor-rotas.js`)

Tela de admin (`navegacao.TELAS` com `admin: true`; `telasVisiveis()` é o único ponto que decide, lido pela barra
e pelo menu ☰ — senão o atalho apareceria num e não no outro, e a própria tela confere `ehAdmin()` de novo).

**A análise de curva** responde ao pedido "ver se está desequilibrada ou justa". O Alfa de cada rota foi sorteado
pelo gerador de mapas sem olhar o pool, então há rota em que ele é um paredão e rota em que é mais fraco que o
capim. A tela mostra, por rota: BST de cada espécie com barra, **mediana** (não média — um Dratini de peso 2 no
pool puxaria a média sozinho), **mediana ponderada pelo peso de aparição** (o que o jogador realmente encontra, e
é contra ela que o Alfa é julgado), espalhamento `max/mediana` com veredito `parelha`/`variada`/`desigual` e quem
está puxando a ponta. Para o Alfa: razão contra a ponderada, veredito `fraco`/`justo-fraco`/`justo`/`duro`/`muro`
(faixa justa 1.15×–1.5×, já contando que `statsDeChefe` dá HP ×2 e +30% no resto) e a **faixa-alvo de BST** pra
procurar candidato — mais "BST 395 contra uma rota de mediana 310" do que "Cloyster nível 24", que não dá pra
julgar. `🔍 Sugerir Alfa` varre a Gen e lista as espécies que caem na faixa, do centro dela pra fora.

**Como a edição chega no jogador** (decisão do usuário entre as três opções apresentadas): rascunho no
`localStorage` + botão `📋 Copiar o arquivo`, que devolve o conteúdo de `dados-rotas.js` pra colar no repositório.
Tabela no Supabase foi recusada: missão é conteúdo estático, buscar isso no boot é rede num caminho hoje
instantâneo, e missão quebrada iria ao ar sem passar pelos testes. O preço combinado é um commit por leva.

**Detalhes que custaram uma linha cada, mas são bug silencioso se faltarem:**
- O `<select>` do Alfa garante a opção do Alfa ATUAL mesmo que `especiesDaGen` não o traga (hoje traz todos os 81,
  conferido). Sem isso, o select mostraria a primeira opção como selecionada e "Guardar o Alfa" trocaria o Pokémon
  da rota sem ninguém pedir.
- `carregarBsts` vai de 8 em 8, não num `Promise.all` de 150: o "Sugerir Alfa" varre a Gen inteira.
- O redesenho assíncrono só acontece se o editor ainda estiver na tela (procura `#ed-saida`), senão quem saiu no
  meio de um carregamento teria o editor desenhado por cima da tela nova.
- `gerarArquivo` é testado **carregando o resultado de volta como módulo** (`import('data:text/javascript,…')`):
  é um arquivo reescrito a cada edição, e um `import` que estoura leva todo o grafo do jogo.

### Balanceamento e o SQL

`PESOS_PONTOS.missoes` continua **120**. O teto do `validar_jornada` subiu de 36 pra **197**
(`supabase/migrations/20261001120000_limite_de_missoes.sql`) — e é 197, não 37, porque `S.missoesFeitas` acumula
quando a jornada segue pro mapa seguinte com o mesmo Pokémon: numa run que atravessa as 9 Gens, todas as 180 são
alcançáveis. O teto é anti-fraude, não balanceamento.

### Ficou de fora desta leva (pedido na mesma conversa)

**Criar e excluir rotas** e **rotas secretas** (abertas por Pokémon capturado/usado, golpe aprendido etc.). A
primeira é CRUD sobre a lista que `mapas.js`, o Santuário, a Pokédex, a caça shiny, o download offline e o
desbloqueio do Roguelike todos leem; a segunda é mecânica nova (condição no save, na tela de explorar e no
progresso), não editor. Escolha do usuário: o editor de missões/Alfas/curva primeiro.
