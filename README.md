<p align="center"><img src="img/logo.png" alt="PokéRPG" width="240"></p>

# PokéRPG

RPG de texto no navegador em que **você é o Pokémon**: sem treinador e sem Pokébola. Você começa como um inicial, explora a região, luta contra selvagens, foge de treinadores que querem te capturar, faz amigos e enfrenta os Alfas de cada zona.

Os dados vêm ao vivo da [PokéAPI](https://pokeapi.co) (1025 espécies, golpes, habilidades, evoluções), e as contas seguem as fórmulas dos jogos: stats com IV/EV e natureza, dano com STAB, tipos e crítico, estágios, status, XP por curva de crescimento e captura da Gen 3/4.

Feito em JavaScript puro (ES modules), sem build e sem dependências. Funciona offline e, com conta, salva na nuvem.

---

## Como jogar

### Começando
1. **Escolha o modo**. O principal é o **Roguelike** (abaixo).
2. **Escolha seu Pokémon** entre os iniciais das 9 regiões (Kanto a Paldea) ou Pikachu e Eevee. No Roguelike, também aparecem as espécies que você já desbloqueou.
3. Explore. O jogo salva sozinho.

### Roguelike (modo principal)
Cada jornada é uma run. Você começa só com os iniciais e, jogando, **desbloqueia novas espécies para as próximas runs**. Os contadores somam todas as suas jornadas Roguelike:
- derrotar **10** de uma espécie, **ou**
- fazer amizade com **5** dela, **ou**
- evoluir para ela **5 vezes** (forma do meio, como Charmeleon) ou **10 vezes** (forma final, como Charizard).

A tela inicial mostra os desbloqueados e os que estão **quase lá**, a tela de fim mostra o que aquela run liberou, e a Carreira mostra todo o progresso. Só jornadas Roguelike contam.

**Sem segunda chance:** no Roguelike, se você desmaiar, a run acaba (nem Revive salva). Se um **aliado** desmaiar, ele é **perdido para sempre**, e o Centro não traz de volta. Ser capturado também encerra a run. O Centro é pago (com desconto por vitória) e você começa no nível 5.

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
- **Zonas** que abrem por nível: Rota 1, Floresta de Viridian, Monte Lua, Rota 24, Torre Pokémon, Zona Safari, Caverna Cerúlea e a Fenda Dimensional (qualquer Pokémon perto do seu nível).
- **Alfas:** cada zona tem um chefe mais forte que o normal (HP ×2, +30% no resto, IVs perfeitos). Prêmio na primeira vitória.
- **Treinadores caçadores:** aparecem explorando, com 1 a 3 Pokémon e Pokébolas. Com seu HP pela metade, podem tentar te capturar, e a chance depende da taxa de captura da **sua** espécie.
- **Shiny:** 1 em 4096, para você e para qualquer Pokémon que aparecer.
- **Centro Pokémon, loja e mochila:** Potion, curas de status, Ether, X-itens, Rare Candy, Revive e petiscos.

### Batalha
- Turnos com barra de "quem está agindo", prioridade e velocidade, precisão e evasão, crítico, status (queimado, envenenado, paralisado, dormindo, congelado, confuso) e dano residual.
- Habilidades que já funcionam: Overgrow/Blaze/Torrent/Swarm, Levitate, Flash Fire, Volt/Water Absorb, Guts, Intimidate, Adaptability e Run Away.

### Amizade e aliados
- Em batalha contra um selvagem, ofereça um **petisco** que o tipo dele goste. Com a amizade cheia, ele passa a te seguir (até **2 aliados**). São 6 petiscos que cobrem os 18 tipos.
- Aliados lutam **junto com você** no mesmo turno, ganham XP, aprendem golpes e evoluem.
- **Ordens:** À vontade · Pegar leve (não derruba quem você quer fazer de amigo) · Só status · Não atacar · Descansar (fora da batalha).
- Itens podem ser usados em qualquer um da equipe, e o Revive reanima um aliado.

### Missões
36 missões que vão aparecendo conforme você joga: derrotar espécies (mais para as comuns, menos para as raras), fazer amigos, vencer a trilha dos Alfas, juntar e gastar dinheiro, subir de nível, evoluir e derrotar treinadores.

### Fim de jornada e carreira
- A jornada termina com Game Over ou quando você a encerra (**Novo jogo**). A tela de fim compara tudo com o seu recorde naquela espécie.
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
- **PvP:** é amistoso. Não gasta HP nem PP, só conta vitórias e derrotas. Dá para **desistir**.

### 👤 Ícone e amigos
- **Ícone:** qualquer um dos 1025 Pokémon, normal ou ✨ shiny. Aparece no topo, no ranking, nas salas e para os seus amigos. Sem conta, fica só no seu navegador.
- **Amigos** (com conta): cada um tem um **código de amigo** de 6 caracteres. Adicione pelo código, e o outro aceita ou recusa. Na sala multiplayer, o anfitrião **chama um amigo com um toque**, e ele recebe o convite em qualquer tela do jogo.

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

## Estrutura

| Pasta/arquivo | O que tem |
|---|---|
| `index.html`, `css/estilo.css` | Página e estilo |
| `js/regras.js` | Fórmulas puras (dano, stats, captura, missões, pontuação…), todas testadas |
| `js/dados.js` | Tabelas: tipos, naturezas, itens, zonas e Alfas, missões, dificuldades, iniciais, ordens |
| `js/batalha.js`, `js/amizade.js`, `js/progressao.js`, `js/itens.js`, `js/missoes.js`, `js/mundo.js` | Regras narradas do jogo |
| `js/render.js`, `js/paineis.js`, `js/layout.js` | Tela e painéis modulares |
| `js/criacao.js`, `js/fim.js`, `js/carreira.js`, `js/roguelike.js` | Criação, fim de jornada, carreira e desbloqueios do Roguelike |
| `js/nuvem.js`, `js/conta.js`, `js/config.js`, `js/ranking.js` | Login, nuvem (Supabase) e ranking global |
| `js/mp-motor.js`, `js/multiplayer.js` | Motor da batalha multiplayer (puro, testado) e salas |
| `sw.js` | Modo offline |
| `supabase/` | Banco (`schema.sql`) e passo a passo de configuração |
| `CLAUDE.md` | Mapa técnico detalhado (para quem mexe no código) |

---

## Próximos passos

- [ ] **Batalha mais completa**, nesta ordem:
  1. **Habilidades:** as mais comuns com efeito de verdade (hoje são 13).
  2. **Clima:** sol, chuva, tempestade de areia e granizo/neve, e as habilidades ligadas a eles.
  3. **Terrenos:** elétrico, grama, psíquico e névoa.
  4. **Itens segurados:** Leftovers, Choice, Life Orb, frutas…
  5. **Golpes especiais:** dois turnos, proteção, troca de campo, e uma IA de inimigo mais esperta.
  6. **Mecânicas especiais:** Mega Evolução, Z-Moves, Dynamax/Gigantamax e Terastalização.
- [ ] Acabamento: sons, animações e instalação como app (PWA).

### Já feito
- [x] Módulos, testes e CI
- [x] Treinadores caçadores, dificuldades, shiny, Full Randomizer
- [x] Amizade, aliados com ordens, batalha com vários do mesmo lado
- [x] Zonas por nível, Alfas, missões
- [x] Game Over, carreira, Revive
- [x] Painéis modulares
- [x] Login (Google / e-mail), carreira e jornada na nuvem, modo offline
- [x] Roguelike com desbloqueio de espécies e evoluções entre runs
- [x] Ranking global (geral e por espécie), com pontuação conferida no servidor
- [x] Multiplayer co-op e PvP (1×1 a 3×3, times desiguais, com aliados), sala por código, balanceamento de nível
- [x] Roguelike sem segunda chance (permadeath de você e dos aliados)
- [x] Entrar numa sala com um Pokémon convidado; ganhos da run de outra pessoa voltam com você (no nível real)
- [x] Ícone do jogador (qualquer Pokémon, normal ou shiny), amigos por código e convite direto para a sala
- [x] Menu ☰ no celular e tela de login com Google / link por e-mail
