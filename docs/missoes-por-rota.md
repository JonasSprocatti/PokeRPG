# Missões por rota — proposta (01/10/2026)

Documento **pra revisão, nada construído ainda**. Atende o item do `docs/backlog.md`:
*"Missões próprias de cada mapa (hoje as de espécie valem em qualquer Gen; a trilha de Alfas é só de Kanto)"*.

Duas partes: **(A)** revisão das 36 missões que já existem — com 5 achados, 2 deles defeito de verdade —
e **(B)** a tabela do que cada rota de cada Gen passa a ter.

---

## A. Revisão do que já existe

`MISSOES` em `js/dados.js` (36 entradas), avaliadas por `regras.situacaoMissoes` / `progressoCondicao`.
Condições disponíveis hoje, e **nenhuma precisa mudar pra esta proposta**:
`derrotar`+`qtd` · `vitorias` · `amigos` · `nivel` · `chefe` · `treinadores` · `missao` · `dinheiro` · `gasto` · `evolucoes`.

### A1. Defeito: `scyther` nasce pronta

```js
{ id: 'scyther', libera: { derrotar: 'scyther', qtd: 1 }, objetivo: { derrotar: 'scyther', qtd: 1 }, premio: { dinheiro: 3000 } }
```

`libera` e `objetivo` são a MESMA condição. No turno em que o primeiro Scyther cai, a missão aparece e conclui
no mesmo laço do `verificarMissoes` — o jogador lê "🔓 Nova missão" e "📜 Missão concluída" em seguida, e ganha
₽3.000 por uma missão que nunca existiu. **Conserto**: `objetivo: { derrotar: 'scyther', qtd: 4 }` (na proposta
ela vira a missão da Caverna Cerúlea, onde Scyther realmente mora — hoje está rotulada como "Safari", e não há
Scyther no pool do Safari).

### A2. Defeito: 25 das 36 valem em qualquer mapa, mas só são alcançáveis em Kanto

As 15 missões de espécie (`pidgey`…`scyther`) não têm `gen`. Em Johto o `libera` nunca é cumprido, então elas
ficam **escondidas pra sempre** e só inflam o `escondidas` do contador da tela de missões: em Johto o jogador vê
"21 ainda escondidas" sem nenhuma forma de revelar 15 delas. Pior no Randomizer e nas formas regionais, onde
`speciesName` repete (`rattata` alola, `geodude` alola) e a missão "Praga de Rattata" acorda em Alola com texto
de Kanto. **Conserto**: toda missão de espécie leva `gen`.

### A3. A trilha de Alfas cobre 6 dos 9 Alfas, e a 5ª quebra a corrente

`alfa1`…`alfa6` vão de Rota 1 ao Safari. **Ficaram de fora** Usina Elétrica, Ilhas Espuma e Estrada Vitória —
as três rotas que o jogador atravessa entre o Safari e a Caverna, justamente a metade mais longa da jornada,
que fica sem nenhuma missão nova.

E `alfa5` libera por `{ nivel: 20 }` em vez de `{ chefe: 'rota24' }` (o padrão dos outros): no nível 20 o jogador
recebe "A sombra da Torre" (Alfa nível 36) ao mesmo tempo que ainda está na Rota 24. Não é bug de código, é a
corrente anunciando fora de hora.

### A4. `lenda` funciona — mas por um fio

`{ objetivo: { chefe: 'caverna' } }` e a Caverna Cerúlea é rota `final`, que **não tem `chefe`**, tem `lendarios`.
Funciona porque `batalha.startLendarios` passa `chefe: z.id` e `vencerGen` grava `S.chefes[B.chefe]`. Verificado,
está certo — fica registrado aqui pra ninguém "consertar" isso achando que é engano.

### A5. Balanceamento: 120 pontos por missão, e a conta estoura

`PESOS_PONTOS.missoes = 120`. Hoje são 36 missões (≈4.300 pontos no teto). A proposta abaixo põe **20 por Gen**
(10 de espécie + 9 de Alfa + 1 de campeão) + as 21 globais = **41 alcançáveis numa jornada**, ≈4.900 pontos.
Praticamente igual — **o teto não muda**, porque hoje já existem 36 e 15 delas são inalcançáveis fora de Kanto.
Então: **`PESOS_PONTOS` fica como está** e o `supabase/migrations` não precisa de arquivo novo.

> Se em alguma revisão futura o número por Gen subir de 20, aí sim: `missoes` em `PESOS_PONTOS` **e** o mesmo peso
> em `validar_jornada` (o `tests/schema.test.js` cobra os dois lados).

### A6. Outras observações, sem ação

- `veterano` pede nível 40 e `NIVEL_TOPO` é 75 — está bom como marco do meio, não como teto.
- `vitorias100` / `matilha` / `cofre3` / `gasto3` são de jornada longa e **não** têm `gen`: correto, são globais.
- Prêmios: todos os ids de item existem em `ITEMS` (conferido).

### A7. O que NÃO está nesta proposta, de propósito

- **Condição nova no motor.** Nada aqui precisa de `rota:`, `passos:` ou `alfas: N`. "Derrotou a espécie X"
  já é prova de que o jogador esteve na rota X, porque o pool é exclusivo. Rung 2 da escada: a regra já existe.
- **Missão por tipo/zona** e **recompensa de Alfa diferente por rota** (estão em "Ideias soltas" do backlog).
- **Lendários no co-op** (o outro item do mesmo marcador no backlog) — é multiplayer, assunto separado.

---

## B. As missões por rota

### Regra de formação

| Rota | Missões | Condição | Por quê |
|---|---|---|---|
| 1ª a 10ª | **1 de espécie** | `libera: { derrotar: X, qtd: 1 }` → `objetivo: { derrotar: X, qtd: N }` | a espécie-símbolo do pool; aparecer já revela a missão |
| 1ª a 9ª | **1 de Alfa** | `libera: { chefe: <rota anterior> }` → `objetivo: { chefe: <esta rota> }` | corrente, do começo ao fim do mapa (conserta A3) |
| 10ª (final) | **1 de campeão** | `libera: { chefe: <9ª rota> }` → `objetivo: { chefe: <rota final> }` | vencer os lendários |
| 11ª (Santuário) | nenhuma | — | é pós-vitória e tem a Gen inteira no pool: missão ali premiaria quem já ganhou |

**Quantidade `N`** sai do peso `p` do pool, pra não pedir 12 de um bicho de 1% nem 2 de um que aparece sempre:

| `p` no pool | 8 | 5–7 | 3–4 | 2 | ≤1 |
|---|---|---|---|---|---|
| `N` | 12 | 8 | 6 | 4 | 2 |

**Prêmio da missão de espécie** pela posição da rota (1→10), mesma escada em todas as Gens:

| Rota | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Prêmio | 4× Potion | 2× Honey | 2× Hard Stone | 2× Super Potion | 1× Rare Candy | 1× Revive | 2× Hyper Potion | 2× Rare Candy | 1× Max Revive | ₽12.000 |

**Prêmio da missão de Alfa**: `₽1.000 × posição da rota` (Rota 1 → ₽1.000; 9ª rota → ₽9.000).
**Prêmio de campeão**: ₽25.000 + 3× Rare Candy.

Total: **20 missões por Gen × 9 = 180**, substituindo as 15 de espécie + 7 de Alfa/lenda que existem hoje.
Mais as **21 globais** (vitórias, amizade, dinheiro, gasto, treinadores, nível) que continuam sem `gen`.

> **Peso em `dados.js`**: 180 linhas de dado ≈ 28 KB num arquivo carregado em toda sessão. A alternativa é
> **gerar** as 180 a partir de `GENS` (uma função de ~15 linhas em `regras.js`, espécie = maior `p` com menor id),
> mas aí os nomes viram formulaicos ("Caçada na Rota 1"). As tabelas abaixo são a versão com nome escrito à mão.
> **Decisão sua**: nome com graça e 28 KB de dado, ou gerado e genérico.

---

### Gen 1 — Kanto

| Rota | Missão de espécie | Objetivo | Missão de Alfa |
|---|---|---|---|
| Rota 1 | Praga de Rattata | 12× Rattata | O Alfa da Rota 1 (Pidgeotto) |
| Floresta de Viridian | Folhas mastigadas | 12× Caterpie | Rainha da Floresta (Butterfree) |
| Monte Lua | Quebra-pedra | 12× Geodude | A lua cheia (Golbat) |
| Rota 24 | Pinças na Ponte Pepita | 12× Krabby | Punho da Rota 24 (Cloyster) |
| Usina Elétrica | Bombas rolando | 8× Voltorb | Curto-circuito (Magneton) |
| Torre Pokémon | Caça-fantasmas | 6× Haunter | A sombra da Torre (Exeggutor) |
| Zona Safari | Rei do Safari | 4× Nidoking | Estouro no Safari (Poliwrath) |
| Ilhas Espuma | Cascos de fogo no gelo | 8× Ponyta | Serpente do mar (Gyarados) |
| Estrada Vitória | Quatro braços, uma estrada | 4× Machamp | O último portão (Dragonite) |
| Caverna Cerúlea | Lâminas no escuro | 4× Scyther | **Campeão de Kanto** (4 lendários) |

*Saem*: `pidgey`, `weedle`, `spearow`, `pikachu`, `zubat`, `clefairy`, `mankey`, `gastly`, `cubone` (9 missões de
espécie que hoje empilham 6 na Rota 1 e nenhuma nas 3 últimas rotas). *Entram* com `gen: 1`.

### Gen 2 — Johto

| Rota | Missão de espécie | Objetivo | Missão de Alfa |
|---|---|---|---|
| Rota 29 | Rabos na trilha | 12× Sentret | O Alfa da Rota 29 (Furret) |
| Bosque Ilex | Lã no bosque | 12× Mareep | Girassol do Ilex (Sunflora) |
| Ruínas de Alph | Alfabeto quebrado | 12× Unown | Presas nas ruínas (Donphan) |
| Costa de Olivine | Luzes no fundo | 8× Chinchou | Farol vivo (Lanturn) |
| Torre Queimada | Fogo que não apagou | 6× Houndour | Urso das cinzas (Ursaring) |
| Lago da Fúria | Lã elétrica | 4× Ampharos | Asas no lago (Crobat) |
| Caminho de Gelo | Nunca é só um | 8× Dunsparce | Coral do gelo (Corsola) |
| Toca do Dragão | Espinhos na água | 4× Qwilfish | Guardião da toca (Kingdra) |
| Monte Prata | Casca dura | 8× Shuckle | O topo do Monte Prata (Tyranitar) |
| Torre do Sino | Leite da montanha | 4× Miltank | **Campeão de Johto** (5 lendários) |

### Gen 3 — Hoenn

| Rota | Missão de espécie | Objetivo | Missão de Alfa |
|---|---|---|---|
| Rota 101 | Zigue e zague | 12× Zigzagoon | O Alfa da Rota 101 (Vigoroth) |
| Bosque Petalburgo | Folha sobre a água | 12× Lotad | Asas de pó (Beautifly) |
| Caverna Granito | Barriga de lama | 12× Gulpin | Palma aberta (Hariyama) |
| Rota 110 | Dentes na ciclovia | 12× Carvanha | Beleza das águas (Milotic) |
| Monte Chimney | Dança sem motivo | 12× Spinda | Engolindo tudo (Swalot) |
| Deserto da Rota 111 | Bússola quebrada | 12× Nosepass | Fóssil de armadura (Armaldo) |
| Monte Pira | Mais e menos | 8× Plusle | Punho de aço (Metagross) |
| Mar de Hoenn | Língua camaleão | 8× Kecleon | Gelo flutuante (Walrein) |
| Caverna Shoal | Carvão vivo | 6× Torkoal | Asas de dragão (Salamence) |
| Pilar Celeste | Palmeira voadora | 8× Tropius | **Campeão de Hoenn** (8 lendários) |

### Gen 4 — Sinnoh

| Rota | Missão de espécie | Objetivo | Missão de Alfa |
|---|---|---|---|
| Rota 201 | Dentes de castor | 12× Bidoof | O Alfa da Rota 201 (Bibarel) |
| Bosque Eterna | Botão fechado | 12× Budew | A capa do bosque (Wormadam) |
| Mina Oreburgh | Sino de bronze | 12× Bronzor | Garras na mina (Gabite) |
| Vale Eólico | Nadadeira veloz | 8× Buizel | Juba elétrica (Luxray) |
| Grande Pântano | Cheiro de longe | 12× Stunky | Boca de areia (Hippowdon) |
| Mansão Velha | Sinos na mansão | 6× Bronzong | Campana dupla (Bronzong) |
| Rota 216 | Esquilo de choque | 8× Pachirisu | Raposa de gelo (Glaceon) |
| Estrada Vitória | Escudo fóssil | 4× Bastiodon | Ímã triplo (Magnezone) |
| Área de Sobrevivência | Planta carnívora | 8× Carnivine | Dragão da terra (Garchomp) |
| Pilar Lança | Bruxa do pilar | 4× Mismagius | **Campeão de Sinnoh** (9 lendários) |

### Gen 5 — Unova

| Rota | Missão de espécie | Objetivo | Missão de Alfa |
|---|---|---|---|
| Rota 1 de Unova | Sempre de guarda | 12× Patrat | O Alfa da Rota 1 (Herdier) |
| Bosque dos Sonhos | Pedra que anda | 12× Roggenrola | Algodão ao vento (Lilligant) |
| Floresta Pinwheel | Girinos no charco | 12× Tympole | Vento de algodão (Whimsicott) |
| Resort Deserto | Olhos no deserto | 12× Elgyem | Broca na areia (Excadrill) |
| Caverna Chargestone | Olho que não dorme | 12× Watchog | Zebra elétrica (Zebstrika) |
| Torre Celestial | Filhote de águia | 8× Rufflet | Olhar da torre (Gothitelle) |
| Caverna Gelada | Sorvete duplo | 6× Vanillish | Baunilha dupla (Vanilluxe) |
| Baía Humilau | Médico da baía | 12× Audino | Fóssil alado (Archeops) |
| Estrada Vitória de Unova | Cacto dançante | 12× Maractus | Três cabeças (Hydreigon) |
| Castelo de N | Pássaro de pedra | 4× Sigilyph | **Campeão de Unova** (9 lendários) |

### Gen 6 — Kalos

| Rota | Missão de espécie | Objetivo | Missão de Alfa |
|---|---|---|---|
| Rota 2 de Kalos | Orelhas grandes | 12× Bunnelby | O Alfa da Rota 2 (Fletchinder) |
| Bosque Santalune | Flor com pernas | 12× Flabébé | Asas de mosaico (Vivillon) |
| Caverna Glittering | Espada solta | 8× Honedge | Orelhas de escavadeira (Diggersby) |
| Prado Rivière | Alga venenosa | 12× Skrelp | Chifres do prado (Gogoat) |
| Usina de Kalos | Filhote de juba | 8× Litleo | Rugido na usina (Pyroar) |
| Pântano da Rota 14 | Duas espadas | 6× Doublade | Panda bravo (Pangoro) |
| Gruta Frost | Pétalas na neve | 4× Florges | Montanha de gelo (Avalugg) |
| Costa Azure | Bigode elétrico | 8× Dedenne | Asas de som (Noivern) |
| Caverna Terminus | Corte de pelo | 8× Furfrou | Gosma suprema (Goodra) |
| Arma Suprema | Luta com capa | 6× Hawlucha | **Campeão de Kalos** (3 lendários) |

### Gen 7 — Alola

| Rota | Missão de espécie | Objetivo | Missão de Alfa |
|---|---|---|---|
| Rota 1 de Alola | Bico de pica-pau | 12× Pikipek | O Alfa da Rota 1 (Trumbeak) |
| Selva Lush | Larva da selva | 12× Grubbin | Bateria viva (Charjabug) |
| Túnel Diglett | Cão do túnel | 8× Rockruff | Lobo da rocha (Lycanroc) |
| Praia Hano | Caranguejo brigão | 12× Crabrawler | Bolha de água (Araquanid) |
| Parque Vulcânico Wela | Ursinho de pelúcia | 8× Stufful | Casco explosivo (Turtonator) |
| Morro Memorial | Burro de barro | 8× Mudbray | Veneno dançante (Salazzle) |
| Monte Lanakila | Besouro de choque | 4× Vikavolt | Caranguejo do topo (Crabominable) |
| Cânion Vast Poni | Ouriço elétrico | 8× Togedemaru | Agulha venenosa (Naganadel) |
| Ruínas da Abundância | Dentes afiados | 6× Bruxish | Escamas de batalha (Kommo-o) |
| Altar do Sol e da Lua | Sábio da ilha | 4× Oranguru | **Campeão de Alola** (9 lendários) |

### Gen 8 — Galar

| Rota | Missão de espécie | Objetivo | Missão de Alfa |
|---|---|---|---|
| Rota 1 de Galar | Bochechas cheias | 12× Skwovet | O Alfa da Rota 1 (Frosmoth) |
| Bosque Slumbering | Maçã com bicho | 12× Applin | Creme perfeito (Alcremie) |
| Mina de Galar | Cobra de areia | 12× Silicobra | Mandíbula de pedra (Drednaw) |
| Lago Miloc | Raposa ladra | 6× Thievul | Cão veloz (Boltund) |
| Arredores de Motostoke | Lã da cidade | 6× Dubwool | Montanha de carvão (Coalossal) |
| Bosque Glimwood | Chapéu do bosque | 6× Hattrem | Bruxa do bosque (Hatterene) |
| Rota 8 Nevada | Elefante de cobre | 6× Copperajah | Corvo de aço (Corviknight) |
| Tundra da Coroa | Duas caras, uma fome | 8× Morpeko | Urso da lua (Ursaluna) |
| Ilha da Armadura | Pescador voador | 4× Cramorant | Dardo de dragão (Dragapult) |
| Torre Energia de Hammerlocke | Cervo de outro tempo | 6× Wyrdeer | **Campeão de Galar** (10 lendários) |

### Gen 9 — Paldea

| Rota | Missão de espécie | Objetivo | Missão de Alfa |
|---|---|---|---|
| Trilha de Poco | Porquinho farejador | 12× Lechonk | O Alfa da Trilha de Poco (Oinkologne) |
| Planície Sul | Patinha elétrica | 8× Pawmi | Sapo-bateria (Bellibolt) |
| Caverna de Alfornada | Pedra de sal | 12× Nacli | Gafanhoto assassino (Lokix) |
| Lago Casseroya | Golfinho do lago | 8× Finizen | Maçã de muitas cabeças (Hydrapple) |
| Deserto Asado | Cogumelo que nada | 8× Toedscool | Cavaleiro de fogo (Armarouge) |
| Bosque Tagtree | Azeitona madura | 6× Dolliv | Chá do bosque (Sinistcha) |
| Monte Glaseado | Pássaro barulhento | 8× Squawkabilly | Baleia da montanha (Cetitan) |
| Kitakami | Pinça lateral | 6× Klawf | Fúria sem fim (Annihilape) |
| Borda da Grande Cratera | Peixe disfarçado | 6× Tatsugiri | Ponte de aço (Archaludon) |
| Área Zero | Lagarto-moto | 8× Cyclizar | **Campeão de Paldea** (10 lendários) |

---

## C. O que isto custa pra construir

1. `js/dados.js` — `MISSOES`: tirar as 15 de espécie + `alfa1`…`alfa6` + `lenda`, pôr as 180 com `gen`.
2. Nada em `js/regras.js`, `js/missoes.js` nem no Supabase. **Zero condição nova** (ver A7).
3. `tests/missoes.test.js` (novo): toda missão de espécie aponta pra espécie que existe no pool **daquela Gen**;
   toda missão de Alfa aponta pra `id` de rota que existe; `libera ≠ objetivo` (o defeito A1 nunca volta);
   todo `premio.itens` existe em `ITEMS`. É o teste que faltava — A1 e A2 passariam batido hoje.
4. `README.md` + versão nova em `js/dados-patchnotes.js`.
5. Sair do `docs/backlog.md` e virar registro em `docs/features.md`.

---

## D. O que foi construído de verdade (01/10/2026)

Este documento é o levantamento. **A implementação mudou de forma depois dele**, por pedido na mesma conversa:
em vez de a tabela ser escrita à mão por mim, foi construído o **🗺 Editor de rotas** (tela de admin) pra o usuário
escolher as espécies, montar a missão, o prêmio e o nome, trocar o Alfa e ver a **curva de stats** de cada rota.
O registro de como ficou está em `docs/features.md` → "Missões por rota e o editor de rotas".

Diferenças entre a proposta acima e o que foi ao ar:

| Na proposta | No jogo |
|---|---|
| Quantidades 2–12 | **O dobro** (24 / 16 / 12 / 8 / 4 pela raridade) — pedido do usuário |
| Uma espécie por missão | **Várias**, somando: "Mais ou Menos" = 8 Plusle + 8 Minun, com teto por espécie |
| Tabela escrita à mão em `dados.js` | **`dados-rotas.js` gerado pelo editor**; `dados.js` só junta |
| "Zero condição nova no motor" (A7) | Uma: `alvos: [[especie, qtd]…]`, que é o que permite a missão de duas espécies |
| "`PESOS_PONTOS` fica como está, o SQL não precisa de arquivo novo" (A5) | O peso ficou em 120, mas o **teto** do `validar_jornada` foi de 36 pra 197 (migration `20261001120000`) — a conta de A5 esqueceu que `missoesFeitas` acumula quando a jornada segue pro mapa seguinte |
| Nomes fixos neste documento | Ponto de partida; o editor existe pra trocar o que não ficou bom |

Os cinco achados da revisão (seção A) foram todos endereçados, e os dois defeitos de verdade (A1 `scyther` nascia
pronta, A2 missões escondidas pra sempre fora de Kanto) ganharam teste pra não voltarem.
