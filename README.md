<p align="center"><img src="img/logo.png" alt="PokéRPG" width="240"></p>

# PokéRPG

RPG de texto no navegador em que **você é o Pokémon**: sem treinador e sem Pokébola. Você começa como um inicial, explora as rotas de uma região (um mapa por Gen, de Kanto a Paldea), luta contra selvagens, foge de treinadores que querem te capturar, faz amigos, enfrenta os Alfas de cada rota e, no fim do mapa, os lendários daquela Gen.

Os dados vêm ao vivo da [PokéAPI](https://pokeapi.co) (1025 espécies, golpes, habilidades, evoluções), e as contas seguem as fórmulas dos jogos: stats com IV/EV e natureza, dano com STAB, tipos e crítico, estágios, status, XP por curva de crescimento e captura da Gen 3/4.

Feito em JavaScript puro (ES modules), sem build e sem dependências. Funciona offline e, com conta, salva na nuvem.

---

## Como jogar

### Começando
1. **Escolha o modo**. O principal é o **Roguelike** (abaixo).
2. **Escolha o mapa (Gen)**. No Roguelike, só os já liberados; nos outros modos, qualquer um. No Full Randomizer, o mapa também é sorteado.
3. **Escolha seu Pokémon** entre os iniciais das 9 regiões (Kanto a Paldea), Pikachu e Eevee, **mais todas as espécies que você já desbloqueou**. O desbloqueio só é conquistado jogando Roguelike, mas a espécie desbloqueada vale em qualquer modo.
4. Explore. O jogo salva sozinho.

### Roguelike (modo principal)
Cada jornada é uma run. Você começa só com os iniciais e, jogando, **desbloqueia novas espécies para as próximas runs**. Os contadores somam todas as suas jornadas Roguelike:
- derrotar **10** de uma espécie, **ou**
- fazer amizade com **5** dela, **ou**
- evoluir para ela **5 vezes** (forma do meio, como Charmeleon) ou **10 vezes** (forma final, como Charizard).

A tela inicial e a tela 🏅 Conquistas mostram os desbloqueados e os que estão **quase lá**, e a tela de fim mostra o que aquela run liberou. **Só jornadas Roguelike contam para desbloquear** — mas a espécie desbloqueada pode ser usada em todos os modos.

**Rota esgotada:** no Roguelike, quando o seu nível passa do **dobro do teto de uma rota**, ela para de dar encontros — nada de farmar em rota fraca. Você continua entrando e vendo a Pokédex dela.

**Sem segunda chance:** no Roguelike, se você desmaiar, a run acaba (nem Revive salva). Se um **aliado** desmaiar, ele é **perdido para sempre**, e o Centro não traz de volta. Ser capturado também encerra a run. O Centro é pago (com desconto por vitória) e você começa no nível 5.

**Vencer a run:** vença os **lendários da última rota** do mapa. A run termina em vitória e o **mapa da Gen seguinte** fica liberado para as próximas runs (Gen 1 → Gen 2 → … → Gen 9).

### Todos os modos

| Modo | Treinador te captura? | Centro Pokémon | Desmaios | Na criação | Pontos |
|---|---|---|---|---|---|
| **Roguelike** | sim: **fim da run** | pago, −10% por vitória | **nenhum**: desmaiou, acabou; aliado desmaiado é perdido | nível 5; iniciais + desbloqueados | ×1,5 |
| **Fácil** | nunca | grátis | ilimitados | escolhe tudo | ×1 |
| **Médio** | nunca | pago, −10% por vitória desde a última visita | 3 livres, depois gasta Revive | escolhe tudo | ×1,2 |
| **Difícil** | sim: você foge depois, sem a mochila e com metade do dinheiro | pago | 3 livres, depois Revive | nível 5 | ×1,5 |
| **Hardcore** | sim: **fim de jogo** | pago | 3 livres, depois Revive | nível 5, natureza e habilidade sorteadas | ×2 |
| **🎲 Full Randomizer** | como no Difícil | pago | 3 livres, depois Revive | tudo sorteado, até a espécie | ×1,5 |

Sem Revive depois do 3º desmaio (Médio para cima), é **Game Over**.

### O mundo
- **Um mapa por Gen** (Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, Paldea), cada um com **10 rotas** que abrem por nível (do 2 ao ~62). Os selvagens de cada mapa são os daquela Gen, cada um na rota que combina com o nível e o tipo dele. Nenhuma rota tem todos os Pokémon: para achar todos, você passa pelos vários mapas. **Os iniciais das nove regiões (e as evoluções deles) não aparecem nas rotas comuns** — escolher o seu no começo da jornada é o que dá acesso a eles. Pikachu e Eevee são exceção: continuam aparecendo no mundo.
- **No Roguelike, vencer não encerra na marra:** ao derrotar os lendários, a vitória já fica garantida (o mapa seguinte libera) e você escolhe entre encerrar a run ou continuar no Santuário. Se seguir e desmaiar lá, a run acaba em derrota — mas a Gen vencida continua liberada. Lendários e míticos do Santuário aceitam petisco e podem virar aliados, só que confiam bem mais devagar.
- **🏛 Santuário (11ª área, só depois de vencer):** quando você derrota os lendários de um mapa, abre o Santuário daquela região. Lá vive **a Gen inteira** — todas as espécies, com as linhas evolutivas completas, mais os iniciais, os lendários, os míticos e as **formas regionais** (Alolan, Galarian, Hisuian, Paldean). A raridade de cada um segue a dificuldade de captura da espécie, como no resto do jogo. É a garantia de que dá para encontrar todo Pokémon de uma Gen — depois de fechá-la.
- **Evoluir dentro da região dá a forma de lá:** um Exeggcute que evolui em Alola vira o Exeggutor de Alola, não o de Kanto — vale para Alola, Galar, Hisui e Paldea, em qualquer espécie que tenha forma regional naquele mapa. O registro continua contando na espécie, então Pokédex e desbloqueios não mudam; o que muda é o Pokémon que fica com você, com os tipos, os status e os golpes da forma regional.
- **Taxa de aparição:** comuns aparecem mais, raros menos (pela taxa de captura da espécie). **Míticos** da Gen (Mew, Celebi…) podem aparecer nas duas rotas mais altas, bem raramente (~0,4% dos encontros).
- **Pokédex da rota:** cada espécie da rota aparece como **?** até você enfrentá-la. Depois de enfrentar, vira **silhueta**. Com **10 derrotados** (somando todas as suas jornadas), aparece colorida e com a **taxa de aparição** naquela rota.
- **Alfas:** cada rota tem um chefe mais forte que o normal (HP ×2, +30% no resto, IVs perfeitos). Prêmio na primeira vitória.
- **Lendários:** a última rota de cada mapa guarda os lendários da Gen. Você enfrenta até 4 em sequência, e o principal (Mewtwo, Ho-Oh, Rayquaza…) vem por último, turbinado. Vencer **fecha a Gen**:
  - no Roguelike, a run termina em vitória e libera o mapa seguinte;
  - nos outros modos, a jornada **termina em vitória** e o seu Pokémon **se aposenta campeão** daquele mapa: a próxima jornada começa do zero na Gen seguinte, com outro Pokémon no nível 5 e o mapa nos níveis normais dele. Se preferir, dá para **seguir com o mesmo Pokémon** (aí você leva equipe e mochila, e o mapa novo se ajusta ao seu nível) — mas cada continuação vale **20% menos pontos**, com piso de metade.
- **Treinadores caçadores:** aparecem explorando, com 1 a 3 Pokémon e Pokébolas. A equipe deles **não é só da rota**: cerca de metade pode ser qualquer espécie daquele mapa, sempre no nível da rota — eles viajaram até ali. Com seu HP pela metade, podem tentar te capturar, e a chance depende da taxa de captura da **sua** espécie.
- **Shiny:** 1 em 4096, para você e para qualquer Pokémon que aparecer.
- **Centro Pokémon, loja e mochila:** Potion, curas de status, Ether, X-itens, Rare Candy, Revive e petiscos.

### Batalha
- Turnos com barra de "quem está agindo", prioridade e velocidade, precisão e evasão, crítico, status (queimado, envenenado, paralisado, dormindo, congelado, confuso) e dano residual.
- **~60 habilidades com efeito de verdade**, iguais no single player e no multiplayer:
  - **Ataque:** Overgrow/Blaze/Torrent/Swarm, Adaptability, Technician, Huge Power, Hustle, Guts, Sniper, Tinted Lens, Skill Link, Serene Grace, Rock Head.
  - **Defesa:** Thick Fat, Filter, Multiscale, Sturdy, Wonder Guard.
  - **Absorção de tipo:** Levitate, Flash Fire, Volt/Water Absorb, Lightning Rod, Motor Drive, Sap Sipper.
  - **Status:** Immunity, Limber, Insomnia, Own Tempo.
  - **Atributos que não caem:** Clear Body, Hyper Cutter.
  - **Contato:** Static, Flame Body, Rough Skin.
  - **Fim de turno:** Speed Boost, Shed Skin.
  - **Outras:** Intimidate, Run Away…

  A ficha marca quais estão ativas.

### No celular
Na batalha, a **cena fica presa no topo** (os dois lados, com HP e status de toda a equipe) enquanto você rola o resto da página: golpes, registro, ficha, aliados, missões e mochila continuam todos ali, um embaixo do outro. Nada fica escondido atrás de aba nenhuma — você vê o Pokémon enquanto escolhe o golpe e alcança a ficha de qualquer aliado sem sair da luta.

### 🎯 Caça Shiny
Modo opcional, ligado **no começo da jornada**. Quando você revela todas as espécies de uma rota (10 derrotados de cada), pode escolher **uma delas para ser a única que aparece ali** — bom para caçar um shiny ou farmar uma espécie. Dá para trocar ou parar a caça quando quiser, rota por rota. **Muda só o Pokémon selvagem:** treinadores, itens, dinheiro e as frases de ambientação continuam com a mesma chance.

### Repelentes (loja)
- **Repelente Seletivo** (30 explorações): você escolhe **a única espécie da rota que não é repelida** — só ela aparece.
- **Repelente Total** (40 explorações): **nenhum selvagem** aparece; você continua encontrando treinadores, itens e dinheiro normalmente.

### Jogar offline
Depois do primeiro acesso o jogo abre sem internet, e guarda sozinho tudo o que você encontra. Em **⚙ Ajustes → Jogar offline** dá para **baixar um mapa inteiro de uma vez** — ou **o jogo inteiro**, com os nove mapas (Pokémon, golpes e sprites) — para que nada apareça sem imagem quando você estiver sem rede. A tela mostra quanto de cada mapa já está guardado e quanto espaço isso ocupa no aparelho. O download do jogo todo passa de 100 MB e leva alguns minutos: use uma rede boa e deixe a tela aberta.

### Itens segurados
Cada Pokémon da equipe pode segurar **um item**, que age sozinho na batalha. Para equipar: **loja → 🎒 Para segurar**, e depois "Segurar" na mochila (ou direto pelo atalho na ficha). Uma **Fruta Oran** também aparece explorando. A ficha mostra o que cada um leva, com botão para guardar de volta.
- **Restos** (cura 1/16 por turno), **Lodo Negro** (cura Venenosos, machuca o resto), **Sino-Concha** (drena 1/8 do dano que você causa).
- **Orbe da Vida** (+30% de dano, custa 10% do seu HP por golpe), **Faixa Muscular** (+10% físico), **Óculos do Sábio** (+10% especial), **Cinto do Perito** (+20% em super efetivo).
- **Faixa de Foco** (com HP cheio, sobra com 1 de HP; gasta-se), **Elmo Rochoso** (quem te acerta no físico perde 1/6), **Colete de Assalto** (+50% de Defesa Especial, sem golpes de status).
- **Frutas** comidas sozinhas: **Oran** e **Sitrus** quando o HP cai à metade, **Lum** ao pegar qualquer status.

### Mochila e loja em divisões
Os itens aparecem separados em 🧪 Cura e status · ⚔ Em batalha · 🎒 Para segurar · 💎 Evolução · 🍖 Petiscos · ✨ Especiais, tanto na mochila quanto na loja.

### 📜 Novidades (notas de atualização)
Uma tela com tudo o que mudou no jogo, da versão mais nova para a mais antiga, com as correções e uma piadinha por versão. Quando sai uma atualização nova, o botão fica marcado até você ler.

### Telas e ajustes
- **Navegação:** toda tela fora do jogo (Carreira, Ranking, Conta, Jornadas salvas, Multiplayer, Bugs, Ajustes) começa com a mesma barra: **← Voltar** e atalhos para todas as outras. **Esc** também volta.
- **🏠 Início com uma jornada aberta:** se você começar outra, a atual é **guardada** sozinha (aparece em 💾 Jornadas salvas).
- **⚙ Ajustes → Fonte:** escolha entre 6 fontes (padrão, Atkinson Hyperlegible para máxima legibilidade, Lexend, Andika, Nunito e uma monoespaçada). Cada opção é mostrada já na própria fonte, vale para o jogo inteiro e fica salva neste navegador.

### 📀 Mexer nos golpes (Escama do Coração e Disco Técnico)
Um Pokémon carrega **4 golpes**, e a cada nível você decide o que esquecer. Dois itens deixam você voltar atrás — e valem tanto para você quanto para **qualquer aliado** (você escolhe em quem usar e qual golpe ele esquece):

- **Escama do Coração** (₽5.000): faz relembrar um golpe que a espécie aprende **subindo de nível** até o seu nível atual e que você deixou passar. Além da loja, ela aparece raramente entre os itens achados explorando (3% dos achados).
- **Disco Técnico** (₽8.000, só na loja): ensina um golpe que a **Pokédex** diz que a espécie aprende por **MT, tutor ou herança** — golpes que nunca apareceriam subindo de nível. Cada Disco **usado** deixa o próximo ₽4.000 mais caro, então montar o moveset perfeito no fim da run custa de verdade.

O jogo só mostra o que aquele Pokémon realmente pode aprender, e nunca repete um golpe que ele já sabe.

### Evoluções
Além de subir de nível, os Pokémon evoluem como nos jogos:
- **Pedras e itens:** 10 pedras (Fogo, Água, Trovão, Folha, Lua, Sol, Brilhante, Crepúsculo, Aurora, Gelo) e itens como Maçã Doce, Bule Rachado e Armadura Auspiciosa. As pedras e o **Cabo de Conexão** são vendidos na loja; o resto aparece explorando (da 4ª rota em diante) e como prêmio de Alfa.
- **Troca:** o **Cabo de Conexão** simula a troca e evolui quem só evolui assim (Kadabra, Machoke, Graveler, Haunter…). Alguns pedem também um item na mochila (Metal Coat, Escama de Dragão…), que é gasto junto; outros pedem o parceiro na equipe (Karrablast com Shelmet).
- **Vínculo (amizade):** cada Pokémon tem um vínculo de 0 a 255, que sobe a cada nível e a cada vitória. Com **160 ou mais** evoluem Golbat, Pichu, Eevee (Espeon de dia, Umbreon à noite) e companhia. Aparece na ficha.
- **Hora do dia:** pelo relógio do seu aparelho (dia 6h–18h, noite 18h–6h).
- **Outras condições:** saber um golpe, ter um aliado de certa espécie ou tipo, Ataque × Defesa (Tyrogue) e itens segurados.
- **Shedinja:** quando Nincada vira Ninjask, a casca ganha vida. Com vaga na equipe, **Shedinja entra sozinho como aliado**; com a equipe cheia, você escolhe em qual dos dois o seu Pokémon vira.
- **Golpes e habilidade da evolução:** ao evoluir, o Pokémon aprende os golpes que a forma nova ganha de cara (o King's Shield do Aegislash, por exemplo) e a habilidade acompanha a mudança mantendo o tipo de slot — quem tinha habilidade oculta continua com a oculta. Se a internet cair bem na hora, a evolução fica **pendente** (aparece na ficha) e acontece sozinha assim que a rede volta.
- **Casos especiais:** evoluções que dependem de coisas que o jogo não tem (chuva, virar o console, contar passos) ganharam uma regra equivalente. Exemplos: Sirfetch'd com **3 críticos numa batalha**, Runerigus ao **aguentar 49 de dano**, Kingambit ao **derrotar 3 Bisharp**, Annihilape sabendo **Rage Fist**. A ficha mostra o que falta para cada evolução.

### Clima
As batalhas têm tempo, mostrado no topo com os turnos restantes:
- **☀ Sol forte:** Fogo ×1,5 e Água ×0,5. Solar Beam sai sem carregar. **🌧 Chuva:** Água ×1,5 e Fogo ×0,5; Thunder não erra.
- **🏜 Areia** e **🧊 Granizo:** machucam 1/16 por turno quem não é Pedra/Terra/Aço (areia) ou Gelo (granizo). Pedra ganha Defesa Especial na areia.
- **❄ Neve:** dá +50% de Defesa aos Pokémon de Gelo; Blizzard não erra.
- Ligam com **Rain Dance, Sunny Day, Sandstorm, Hail e Snowscape** (5 turnos) ou com habilidades como **Drizzle** e **Drought**, assim que o Pokémon entra em campo.
- **Habilidades que aproveitam o tempo:** Swift Swim, Chlorophyll, Sand Rush, Slush Rush, Rain Dish, Ice Body, Dry Skin, Solar Power, Sand Veil, Snow Cloak, Hydration, Leaf Guard, Magic Guard e Overcoat.

### Lado do campo: telas, proteções e armadilhas
Cada lado tem o seu, mostrado no topo da luta (🛡 o seu, ⚔ o do inimigo):
- **Reflect** (dano físico pela metade), **Light Screen** (especial) e **Aurora Veil** (os dois, só no granizo ou na neve) — 5 turnos.
- **Safeguard:** nenhum status vindo do inimigo pega por 5 turnos (Rest em si mesmo continua valendo). **Mist:** o inimigo não baixa seus atributos. **Tailwind:** velocidade dobrada por 4 turnos.
- **Armadilhas:** **Stealth Rock** (dano pela fraqueza de quem entra), **Spikes** (até 3 camadas, só quem anda no chão) e **Toxic Spikes** (até 2; a segunda envenena gravemente, e Venenoso no chão limpa). Pegam **quem entra em campo** — os Pokémon do treinador e a fila de lendários. Você nunca troca de Pokémon, então o jogo avisa quando a armadilha não teria em quem pegar.

### Terrenos
Duram 5 turnos e **só valem para quem está no chão** (Voador e Levitate flutuam e ficam de fora de tudo, inclusive da cura):
- **⚡ Campo Elétrico:** golpes Elétricos ×1,3 e ninguém dorme.
- **🌿 Campo de Grama:** golpes de Planta ×1,3 e cura 1/16 por turno.
- **🔮 Campo Psíquico:** golpes Psíquicos ×1,3 e golpes de prioridade não passam.
- **🌫 Campo de Névoa:** dano de Dragão pela metade e nenhum status pega.
- Ligam com os golpes **Electric/Grassy/Psychic/Misty Terrain** ou com as habilidades **Electric Surge, Grassy Surge, Psychic Surge e Misty Surge**. **Surge Surfer** dobra a velocidade no Campo Elétrico.

### Amizade e aliados
- Em batalha contra um selvagem, ofereça um **petisco** que o tipo dele goste. Com a amizade cheia, ele passa a te seguir (até **2 aliados**). São 6 petiscos que cobrem os 18 tipos.
- Aliados lutam **junto com você** no mesmo turno, ganham XP, aprendem golpes e evoluem.
- **Ordens:** À vontade · Pegar leve (não derruba quem você quer fazer de amigo) · Só status · Não atacar · Descansar (fora da batalha).
- Itens podem ser usados em qualquer um da equipe, e o Revive reanima um aliado.

### Missões
36 missões que vão aparecendo conforme você joga: derrotar espécies (mais para as comuns, menos para as raras), fazer amigos, vencer a trilha dos Alfas (a de Kanto só aparece no mapa da Gen 1), juntar e gastar dinheiro, subir de nível, evoluir e derrotar treinadores.

### Fim de jornada e carreira
- **💾 Jornadas salvas:** dá para ter várias runs em andamento. Em **Novo jogo**, escolha **Guardar e começar outra** (nada se perde) ou **Encerrar**. A tela 💾 Jornadas salvas lista todas, com **Continuar** e **Excluir**. Com conta, todas ficam na nuvem. Quando chega uma jornada de outro aparelho, você escolhe **Continuar**, **Guardar pra depois** (fica na lista e não pergunta de novo) ou **Excluir**. Até 12 guardadas.
- A jornada termina com Game Over, com vitória (Roguelike: venceu os lendários) ou quando você a encerra (**Novo jogo**). A tela de fim compara tudo com o seu recorde naquela espécie. Cada Gen fechada vale **2000 pontos**.
- **📊 Carreira:** Pokémon favorito, Pokédex (quantos já viraram amigos e quantos faltam dos 1025, além dos vistos), shinies, maior quantia de dinheiro, mais missões numa jornada, nível máximo, tempo total e o melhor resultado por espécie.

### 👥 Multiplayer: co-op e PvP
Um jogador cria a sala e passa o **código de 4 letras**; até 6 entram com ele. Não precisa de conta. O anfitrião escolhe:
- **Modo:**
  - **Co-op:** chama amigos para a sua run. Todos juntos contra selvagens (um por jogador) ou contra o **Alfa** da zona (que aguenta o grupo todo).
  - **PvP:** cada um escolhe o **Time A** ou o **Time B**. Dá para fazer 1×1, 2×2, 3×3, 2×1, 3×2…
- **Pokémon por jogador:** 1 (só o principal) ou 2 a 3 (com os seus aliados).
- **Balancear (ligado por padrão):**
  - **Co-op:** o grupo todo fica no nível do Pokémon do anfitrião, então um amigo forte não atropela a sua run.
  - **PvP:** todos no nível médio da luta, e o time em menor número ganha HP extra.
  - **Desligado:** níveis reais. No co-op os inimigos acompanham o mais forte do grupo, então é mais difícil.

**Com qual Pokémon entrar:** o **da sua run** (a luta conta para ela) ou um **convidado**. O convidado é escolhido entre os iniciais, Pikachu, Eevee e as espécies desbloqueadas no Roguelike; é emprestado só para a sala e não mexe em nada. Sem run em andamento, dá para entrar com um convidado direto da tela inicial.

**Ganhos da run de outra pessoa:** se você lutou no **seu nível real**, **XP, EVs, dinheiro, itens** (35% de chance por vitória) e prêmios de Alfa **voltam com você** para a sua run. Se o Balancear ajustou o seu nível, a luta vale como diversão e não leva ganhos.

Cada um escolhe o golpe e o alvo de cada Pokémon seu. O turno sai quando todos escolherem, ou em 45 segundos, no automático.
- **Co-op:** XP, EVs e dinheiro vão para a jornada de cada um, e o HP e o PP gastos voltam junto. Fora do Roguelike, desmaiar volta com 1 de HP; **no Roguelike, desmaiar conta de verdade**.
- **Sala firme:** cada mensagem é reenviada se falhar, o anfitrião repete o estado da luta de tempos em tempos e há um botão **🔄 Sincronizar**. Trocar de aba não derruba ninguém, e a sala mostra o estado da conexão com um diagnóstico das últimas mensagens.
- **Centro Pokémon na sala:** dá para curar a equipe entre as lutas sem sair.
- **PvP:** é amistoso. Não gasta HP nem PP, só conta vitórias e derrotas. Dá para **desistir**.

### 👤 Ícone e amigos
- **Ícone:** qualquer um dos 1025 Pokémon, normal ou ✨ shiny. Aparece no topo, no ranking, nas salas e para os seus amigos. Sem conta, fica só no seu navegador.
- **Amigos** (com conta): cada um tem um **código de amigo** de 6 caracteres. Adicione pelo código, e o outro aceita ou recusa. Na sala multiplayer, o anfitrião **chama um amigo com um toque**, e ele recebe o convite em qualquer tela do jogo.

### 🐞 Bugs e sugestões
Na tela inicial e no topo do jogo. Escolha **Bug** ou **Sugestão**, dê um título e descreva. Não precisa de conta. Os bugs podem levar um **anexo técnico** (versão, navegador, tela, Pokémon, últimas linhas do registro, **nada pessoal**), que você vê antes de enviar. Sem internet, fica guardado e é enviado depois.

**Para quem mantém o jogo — onde ler os relatos:** eles caem na tabela `relatos` do Supabase. Pela regra de acesso (RLS), cada conta só enxerga os próprios relatos **pelo jogo**; quem mantém lê tudo no painel do Supabase, que trabalha como administrador:

1. [supabase.com](https://supabase.com) → o projeto do jogo → **Table Editor** → tabela **`relatos`** (dá para ordenar por `criado_em` e filtrar por `tipo` ou `status`).
2. Ou **SQL Editor**, para ver os mais recentes com o anexo técnico junto:

```sql
select criado_em, tipo, status, titulo, descricao, contexto
from relatos
order by criado_em desc
limit 50;
```

O campo `status` começa em `'novo'` e é seu para usar (`'lido'`, `'resolvido'`…): o jogo nunca deixa alguém mudar isso de fora. Não existe tela de administração dentro do jogo — é de propósito, para não haver caminho pelo navegador que leia relato de outra pessoa.

### 📖 Pokédex
As 1025 espécies do jogo: as que você já encontrou aparecem com sprite e nome, as outras ficam como "?". Toque em quem você conhece para abrir a ficha completa — tipos, todos os atributos base, habilidades com descrição, e quantas vezes você já viu, derrotou e recrutou aquela espécie.

A ficha também responde **onde achar**: em quais rotas de quais mapas ele aparece, com a chance de encontro, e se ele é Alfa de alguma rota ou participa de uma luta final. Conta a carreira inteira e a jornada em andamento.
### 🏅 Conquistas da conta
Tudo o que você acumula **ao longo da carreira inteira**, jornada após jornada — e a que está em andamento conta junto. A cada vitória o jogo registra os tipos do Pokémon derrotado, a espécie que você estava usando, o golpe que finalizou e o elemento dele.

É o que vai desbloquear as **gimmicks**: Mega Evolução (1.000 golpes finais sendo aquela espécie), Terastalização (200 derrotados de um tipo), Z-Moves (250 eliminações com o golpe, ou 500 com o elemento) e Gigantamax (nível 50 com a espécie em 25 jornadas). Mais os marcos de caçada: 1.000 · 10.000 · 100.000 · 1.000.000 de derrotados.

O abate do aliado conta para a espécie que você está usando; tipo e golpe só contam quando o golpe final foi **seu**. O modo Fácil não acumula — ele é treino. A Mega só acumula para espécies que **têm Mega** — derrotar sendo uma que não megaevolui não enche barra nenhuma; as outras gimmicks contam tudo.

**A Mega Evolução já é jogável.** Com a Pedra Mega daquela espécie conquistada, aparece um botão ⚡ na batalha que **não gasta o turno** — você megaevolui e ataca na mesma rodada. A forma muda status, tipos, habilidade e aparência, e dura até o fim da batalha; Charizard e Mewtwo perguntam X ou Y, e Groudon e Kyogre usam o nome certo, **Reversão Primitiva**. Do outro lado, **Alfa, lendários e treinadores** também megaevoluem — quando caem à metade do HP, o que dá uma segunda fase à luta. Só você megaevolui do seu lado: aliado não. **A Terastalização também já é jogável.** Cada tipo é conquistado à parte (200 derrotados daquele tipo) e, na batalha, você escolhe entre os que já tem — o botão 💎 também não gasta o turno. Terastalizado, você passa a ter **um tipo só** para receber golpe (um Charizard Tera Água deixa de tomar 4× de Pedra), e o STAB segue a regra dos jogos: golpe do tipo Tera que você já tinha bate ×2, um tipo Tera novo bate ×1,5, e o STAB antigo continua valendo. Dá para usar Tera e Mega na mesma batalha. Z-Move e Gigantamax ainda estão só medindo progresso.

### 🏆 Ranking global
A melhor jornada de cada jogador, **geral** ou **por espécie**, com a sua posição destacada. Dá para ver sem conta; para aparecer, entre e termine jornadas. A pontuação é **recalculada no servidor** a partir dos números da jornada, e números impossíveis são recusados.

### Tela
Os painéis (Ficha, Missões, Aliados, Mochila, Registro) podem ser **arrastados, redimensionados, recolhidos e trocados de coluna**. A cena da batalha fica fixa no centro. Botão **↺ Layout** volta ao padrão. No celular vira uma coluna só.

### Offline e nuvem
- **Offline:** depois do primeiro acesso online, o jogo abre e roda sem internet. Os encontros saem entre os Pokémon que já estão salvos no aparelho, e tudo o que precisa ir para a nuvem sobe quando a internet volta.
- **Conta** (Google ou link por e-mail): a carreira e a **jornada em andamento** ficam na conta. Dá para continuar em outro aparelho. O que você jogou antes de entrar sobe no primeiro login.

---

## Rodando localmente

ES modules não carregam por `file://`, então é preciso um servidor:

```
python -m http.server 3000
```

Depois abra http://localhost:3000.

**Login e nuvem (opcional):** siga [`supabase/COMO-CONFIGURAR.md`](supabase/COMO-CONFIGURAR.md). Sem isso, o jogo funciona inteiro, só que local.

**Publicar:** qualquer hospedagem estática (usamos a Vercel), com a raiz do repositório como pasta pública e sem comando de build.

## Testes

`node --test` (sem caminho) roda `tests/*.test.js`: fórmulas de batalha, captura, missões, carreira, layout dos painéis, sanidade das tabelas de dados e a lista de arquivos do modo offline. O GitHub Actions roda os testes a cada push (aba **Actions**).

### Banco de dados (Supabase)
O schema vive em `supabase/migrations/` e sobe **sozinho** pela integração nativa do Supabase com o GitHub (no painel: **Settings → Integrations → GitHub**, com *working directory* `/` — a raiz, porque o campo pede o diretório que CONTÉM a pasta `supabase/` — e *Deploy to production* na branch `main`). Cada mudança no banco é um **arquivo novo** na pasta; ao fazer merge no `main`, o Supabase aplica os que ainda não rodaram. Migration já aplicada nunca é editada.

## Estrutura

| Pasta/arquivo | O que tem |
|---|---|
| `index.html`, `css/estilo.css` | Página e estilo |
| `js/regras.js` | Fórmulas puras (dano, stats, captura, missões, pontuação…), todas testadas |
| `js/dados.js` | Tabelas: tipos, naturezas, itens, missões, dificuldades, iniciais, ordens |
| `js/mapas.js`, `js/dados-mapas.js` | Mapas por Gen: rotas, taxas de aparição, Alfas, lendários, Pokédex da rota. `dados-mapas.js` é **gerado** da PokéAPI por `ferramentas/gerar-mapas.ps1` (não editar à mão) |
| `js/golpe.js`, `js/habilidades.js`, `js/especiais.js` | Motor único dos golpes, a tabela de habilidades e a de golpes especiais (Protect, Rest, Explosion, carga/recarga…) |
| `docs/auditoria-batalha.md` | Auditoria de todos os golpes e habilidades contra o motor: o que funciona, o que é aproximado e o que falta |
| `js/relatos.js` | Bugs e sugestões |
| `js/batalha.js`, `js/amizade.js`, `js/progressao.js`, `js/itens.js`, `js/missoes.js`, `js/mundo.js` | Regras narradas do jogo |
| `js/render.js`, `js/paineis.js`, `js/layout.js` | Tela e painéis modulares |
| `js/criacao.js`, `js/fim.js`, `js/carreira.js`, `js/roguelike.js` | Criação, fim de jornada, carreira e desbloqueios do Roguelike |
| `js/nuvem.js`, `js/conta.js`, `js/config.js`, `js/ranking.js` | Login, nuvem (Supabase) e ranking global |
| `js/segurados.js` | Efeito de cada item segurado (Restos, Orbe da Vida, frutas…) |
| `js/dados-patchnotes.js`, `js/tela-patchnotes.js`, `js/novidades.js` | Notas de atualização e o aviso de novidade |
| `js/navegacao.js`, `js/ajustes.js`, `js/tela-ajustes.js` | Barra de navegação das telas, escolha de fonte e a tela de ajustes |
| `js/evolucao.js` | Condições de evolução (pedra, troca, vínculo, hora, golpe…) e as regras equivalentes dos casos raros |
| `js/saves.js`, `js/tela-saves.js` | Jornadas salvas (várias runs em andamento) e a tela delas |
| `js/mp-motor.js`, `js/multiplayer.js` | Motor da batalha multiplayer (puro, testado) e salas |
| `sw.js` | Modo offline |
| `supabase/` | Banco (`schema.sql`) e passo a passo de configuração |
| `CLAUDE.md` | Mapa técnico detalhado (para quem mexe no código) |

---

## Próximos passos

- [ ] **Troca de verdade** entre dois jogadores no multiplayer (hoje a troca é simulada pelo Cabo de Conexão).
- [ ] **Batalha mais completa**, nesta ordem:
  1. ~~Habilidades~~ ✔ (mais delas vão entrando aos poucos: cada uma é uma linha na tabela).
  2. ~~Clima~~ ✔ (sol, chuva, areia, granizo e neve, com as habilidades ligadas a eles).
  3. ~~Terrenos~~ ✔ (elétrico, grama, psíquico e névoa, com as habilidades Surge).
  4. ~~Itens segurados~~ ✔ (13 itens; faltam os Choice, que travam o golpe, e frutas de aperto por tipo).
  5. ~~IA de inimigo~~ ✔ (escolhe o golpe mais eficaz; selvagem erra mais, Alfa quase não erra).
  6. ~~Golpes de lado do campo~~ ✔ (telas, Safeguard, Mist, Tailwind e as armadilhas de entrada).
  7. **Golpes especiais:** a primeira leva já está feita (proteção, dois turnos, recarga, fúria, nocaute de um golpe, poder variável…). Faltam os de lado do campo (Light Screen, Stealth Rock), os que travam golpes (Taunt, Encore, Disable), os de troca (Roar, Baton Pass) e uma IA de inimigo mais esperta. A lista completa está em `docs/auditoria-batalha.md`.
  6. **Mecânicas especiais:** Mega Evolução, Z-Moves, Dynamax/Gigantamax e Terastalização.
- [ ] **Mapas por Gen, próximos passos:** missões próprias de cada mapa (hoje as de espécie valem em qualquer mapa, e a trilha de Alfas é só de Kanto) e a luta dos lendários no co-op (hoje é só no single player).
- [ ] Acabamento: sons, animações e instalação como app (PWA).

### Já feito
- [x] Módulos, testes e CI
- [x] Treinadores caçadores, dificuldades, shiny, Full Randomizer
- [x] Amizade, aliados com ordens, batalha com vários do mesmo lado
- [x] Zonas por nível, Alfas, missões
- [x] Batalha no celular (cena e golpes fixos, abas), 🎯 Caça Shiny, sala multiplayer resistente a queda de conexão e batalha que não some ao recarregar
- [x] Itens segurados (13), mochila e loja em divisões, tela 📜 Novidades com as notas de atualização
- [x] Evoluções especiais: pedras e itens, Cabo de Conexão (troca), vínculo, hora do dia, golpe conhecido e regras equivalentes para os casos raros
- [x] 💾 Jornadas salvas: várias runs em andamento (guardar, continuar, excluir), na nuvem também
- [x] Mapas por Gen (9 regiões × 10 rotas), lendários no fim de cada mapa, míticos raros, Pokédex da rota com silhuetas e taxa de aparição
- [x] Game Over, carreira, Revive
- [x] Painéis modulares
- [x] Login (Google / e-mail), carreira e jornada na nuvem, modo offline
- [x] Roguelike com desbloqueio de espécies e evoluções entre runs
- [x] Ranking global (geral e por espécie), com pontuação conferida no servidor
- [x] Multiplayer co-op e PvP (1×1 a 3×3, times desiguais, com aliados), sala por código, balanceamento de nível
- [x] Roguelike sem segunda chance (permadeath de você e dos aliados)
- [x] Entrar numa sala com um Pokémon convidado; ganhos da run de outra pessoa voltam com você (no nível real)
- [x] Ícone do jogador (qualquer Pokémon, normal ou shiny), amigos por código e convite direto para a sala
- [x] Motor de golpes único (single player e multiplayer) com ~60 habilidades
- [x] Tela de bugs e sugestões (funciona sem conta e offline)
- [x] Menu ☰ no celular e tela de login com Google / link por e-mail
- [x] Auditoria de todos os golpes e habilidades; primeira leva de golpes especiais corrigida (Protect, Endure, Focus Energy, Rest, Explosion, Toxic, Leech Seed, Dream Eater, OHKO, Fly/Dig/Solar Beam, Hyper Beam, Outrage, Flail/Eruption/Hex…)
