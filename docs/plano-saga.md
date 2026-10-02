# ⚔ Modo Saga — plano (desenhado em 02/10/2026)

Modo de jogo **separado**, de RPG medieval fantástico, em que cada Pokémon tem um **ofício** na luta (quem segura
a linha, quem cura, quem lança o fogo), com NPCs Pokémon pra conversar, escolhas com consequência e vários
caminhos. Pedido do usuário em 02/10/2026. **Nada disto está construído ainda** — este arquivo é o desenho
combinado, não registro de entrega. Item concluído sai daqui e vira seção em `docs/features.md`.

> **O nome**: "Expedição" (primeiro rascunho) era geográfico e sério demais. **Saga** é o nome do modo; o
> vocabulário todo segue o mesmo registro — ofício em vez de papel, perícia em vez de habilidade de classe.
> Se preferir outro: **Gesta**, **Crônica** ou **Têmpera** trocam com um `sed` (o identificador é `saga`).

## Por que ofício não existe hoje (as três travas do motor)

| Trava | Onde | Efeito |
|---|---|---|
| O inimigo mira **alvo aleatório** entre os em campo | `batalha.js` (`pick(vivos(emCampo()))`, dentro de `turn`) e `mp-motor.js` (`alvos[Math.floor(sorte()*…)]`) | Guardião é impossível: não há como atrair dano |
| Cura só existe em **item** e em golpe que cura **quem usa** | `golpe.js`, `itens.js` | Curandeiro não tem o que fazer no turno |
| Recurso é **PP por golpe** | `pokemon.js` | Sem ritmo de ofício (recarga entre usos) |

Resolver as três é o modo inteiro; o resto é conteúdo.

## Decisões fechadas (usuário, 02/10/2026)

1. **O ofício é LIDO dos stats base + learnset** — função pura, cobre as 1025 espécies no dia 1. Sem tabela curada.
2. **Fase 1 é o combate**, rodando nas rotas que já existem. Nenhum diálogo escrito antes do combate ficar bom.
3. **Comitiva de 4** (você + 3): o teto de aliados vira **flag do modo** (`aliadosEmCampo: 3`), não sobe nos
   outros modos — o teto 2 continua decisão fechada pro Roguelike e cia. (ver `docs/backlog.md`).
4. **Nomes com vibe medieval fantástica** (pedido em 02/10/2026): os seis ofícios são títulos de ofício, as
   perícias são nomes de feito, e as facções são Ordem / Círculo / Corte. Descartados por soar corporativo:
   Controlador, Lâmina, Tanque, Suporte, "papel", "classe". Descartados por soar afetado, na revisão do usuário
   (02/10/2026): Baluarte (→ **Guardião**), Boticário (→ **Curandeiro**), Algoz (→ **Guerreiro**), Égide
   (→ **Muralha**), Mau-olhado (→ **Marca**), Benzimento (→ **Purificar**). **Guardião e Curandeiro ficam como
   estavam**: o registro medieval vale pro mundo e pras perícias, não a ponto de deixar o ofício ilegível.

## 1. Os seis ofícios (`js/oficios.js`, puro, testado)

| Ofício | Função | Como é detectado | Exemplos |
|---|---|---|---|
| 🛡 **Guardião** | segura a linha | `def+spd` dominante, HP acima da média | Aggron, Steelix, Shuckle, Bastiodon |
| 💚 **Curandeiro** | cura e limpa | aprende um dos ~10 golpes de cura de ALIADO (Milk Drink, Wish, Heal Pulse, Aromatherapy, Life Dew, Jungle Healing, Floral Healing, Lunar Blessing, Heal Bell) | Miltank, Blissey, Alomomola, Florges |
| 🔮 **Arcano** | fogo de longe | `spa` dominante | Charizard, Alakazam, Gengar, Chandelure |
| ⚔ **Guerreiro** | abate | `atk` dominante + velocidade acima da média | Scizor, Lucario, Garchomp |
| 🕯 **Encantador** | enfeitiça e amaldiçoa | nenhum stat dominante, learnset cheio de status | Smeargle, Whimsicott, Klefki |
| 🎻 **Bardo** | ergue o time | stats equilibrados + golpes de buff de time | Togekiss, Clefable, Chatot, Hitmontop |

Guardião, Curandeiro, Guerreiro e Muralha/Marca/Purificar são escolha fechada do usuário. Os três que ainda podem
trocar: Arcano ↔ **Conjurador** · Encantador ↔ **Bruxo** · Bardo ↔ **Arauto**.

- **Ofício menor** = o segundo maior score, escrito com hífen: Miltank sai **Curandeiro-Guardião**, Charizard
  **Arcano-Guerreiro**. É o que dá as combinações que você descreveu sem escrever dado à mão.
- O ofício **não muda na evolução** (Aron já nasce Guardião, só fraco) — o desempenho muda, o ofício não.
- Lê stat base de `m.data.base` e o learnset do cache do `api.js`. **Sem rede nova** → nada pra acrescentar no
  `baixarGen`; conferir ao implementar.

## 2. Ameaça (aggro) — a mecânica-chave

`regras.alvoPorAmeaca(candidatos, sorte)` substitui o sorteio de alvo nos **dois** motores. Fora da Saga devolve
aleatório como hoje (sem flag do modo não muda nada).

- dano feito → ameaça proporcional; **cura → ameaça × 1.5** (clássico: o Curandeiro é o segundo alvo);
  feitiço de buff/debuff → ameaça fixa.
- mira a maior ameaça com **10% de ruído** — sem isso a luta vira xadrez determinístico.
- 🛡 O Guardião tem ameaça passiva ×2 + redução de dano: ele puxa a luta sozinho, e o Brado é o botão de
  consertar quando o inimigo escapa pro Curandeiro.

## 3. Perícias — uma por ofício, **recarga em turnos**, não gasta PP

Painel novo (`G.panel = 'pericias'`) ao lado dos golpes. Estado em `m.vol.cd = {pericia: turnos}` — `vol` já é
zerado no fim da batalha, então **nada vaza pro save**.

| Ofício | Perícia | Efeito | Recarga |
|---|---|---|---|
| 🛡 Guardião | **Brado de Ferro** | ameaça ×3 por 2 turnos, +1 Def | 3 |
| 🛡 Guardião | **Muralha** | a comitiva toda toma −50% neste turno | 5 |
| 💚 Curandeiro | **Bálsamo** | cura ⅓ do HP máximo do aliado mais ferido | 2 |
| 💚 Curandeiro | **Purificar** | tira status e confusão da comitiva | 4 |
| 🔮 Arcano | **Selo Arcano** | próximo golpe: +2 Brechas e ignora resistência | 3 |
| ⚔ Guerreiro | **Estocada** | crítico garantido, nunca erra | 3 |
| 🕯 Encantador | **Marca** | alvo toma +25% de todo dano da comitiva por 2 turnos | 4 |
| 🎻 Bardo | **Canção de Guerra** | +1 Atk e Vel na comitiva toda | 4 |

Todas se escrevem chamando o que já existe (`mudarEstagios`, `aplicarStatus`, cura dos itens). **Nenhuma precisa
de código novo no motor de golpe** — e nenhuma deve reimplementar golpe fora de `golpe.js`.

**Perícia nunca se confunde com golpe na tela** porque golpe segue em inglês na UI ("Protect", "Mean Look") e
perícia é sempre PT-BR. É a regra que mantém "Muralha" legível ao lado de Reflect sem ser a tradução dele.

**O Bálsamo mira sozinho o aliado mais ferido**, de propósito: seleção manual de alvo aliado não existe no single
player (a UI sempre mira o inimigo) e seria a parte mais caríssima do desenho. Volta na fase 2 se fizer falta.

## 4. Brecha e Ruína (o "break" de Octopath / Sea of Stars)

O inimigo tem uma **Guarda** (3 num selvagem, 6 num Alfa, 10 num chefe de capítulo). Golpe super-efetivo abre
**1 Brecha**; status e Marca abrem meia. Guarda vencida → o inimigo **Ruiu**: perde o próximo turno, toma
+50% e perde os buffs. É o que dá motivo pra comitiva ser montada por TIPO, e faz o Arcano ser quem abre a brecha
em vez de só a maior barra de dano. A Guarda aparece na cena, abaixo do HP.

## 5. Comitiva de 4 e os Juramentos

`aliadosEmCampo: 3` como flag da dificuldade `saga`. **Mexe no espaço da cena no celular** — a cena presa no topo
já é apertada com 3 (ver a armadilha "Celular: não reintroduzir esconder painel por aba" no `CLAUDE.md`).

**Juramento**: dois aliados com N batalhas juntos firmam um pacto com bônus de dupla (Guardião+Curandeiro → o
Bálsamo também dá +1 Def; Arcano+Encantador → a Marca vira +40%). Reaproveita o contador de amizade.

## 6. O mundo: trilhas, NPCs Pokémon e consequência

O mapa de rotas atual não serve (é pool de encontro ponderado). A Saga usa **grafo de nós por capítulo**, estilo
Slay the Spire: `nó = { id, tipo: 'luta'|'npc'|'pousada'|'mercador'|'escolha'|'chefe', saidas: [ids], exige?: flag }`.
Vocabulário da tela: **trilha** (o caminho), **pousada** (descanso), **mercador** (loja), **capítulo** (o mapa).

- **NPCs são Pokémon**, diálogo como dado puro em `js/dados-saga.js`:
  `{ fala, opcoes: [{ texto, exige?: flag|reputacao, efeito: {flag, reputacao, item, recruta, abre} }] }`.
  Reusa `ui.ask` — zero UI nova.
- **Três facções, com reputação**: ⚒ a **Ordem da Forja** (Aço/Rocha/Fogo) · 🌿 o **Círculo do Bosque**
  (Planta/Inseto/Fada) · 🌑 a **Corte do Abismo** (Sombrio/Fantasma/Veneno). Servir a uma irrita outra; a
  reputação abre trilha, libera recruta, muda preço do mercador e **muda o chefe final**.
- **Consequência de verdade** são três coisas: trilha fechada pra sempre, **aliado que rompe o Juramento e vai
  embora** (o Curandeiro do Círculo sai se você queimar o bosque) e o chefe final mudando com a facção dominante.
  Flags em `S.saga.flags`.
- **Permadeath já existe** no Roguelike: a Saga herda. Perder o Curandeiro no capítulo 3 é o que o jogador sente.

## 7. Ultimate: não construir

As 4 gimmicks (Mega/Z/Tera/Dynamax) **já são** "uma por batalha, não gasta o turno". É o ultimate do modo, de
graça. Amarração temática: cada capítulo concede a **Relíquia** de uma facção, e a Relíquia é a gimmick.

## Entrega em 4 fases, cada uma jogável no fim

| Fase | O que entra | Por que nessa ordem |
|---|---|---|
| **1 — o combate vira RPG** | `oficios.js` (puro+teste), ameaça nos 2 motores, 8 perícias, Brecha/Ruína, modo `saga` com comitiva de 4 | Testável nas rotas que já existem. Se o combate não ficar divertido aqui, o resto não salva |
| **2 — a comitiva** | Juramentos, ordens por ofício ("proteger o Curandeiro"), tela de comitiva | Só faz sentido depois que ofício importa |
| **3 — o mundo** | trilhas, NPCs + diálogo, facções, capítulo 1 (~15 nós, 6 NPCs) | O trabalho aqui é ESCREVER, não programar |
| **4 — os caminhos** | capítulos 2–3, 3 finais, badges e pontuação próprias, rejogar com flags | Conteúdo sobre motor pronto |

**Arquivos novos**: `oficios.js` · `saga-mundo.js` · `dados-saga.js` · `tela-saga.js` (cada um entra no `PRECACHE`
do `sw.js`). **Alterações cirúrgicas**: alvo por ameaça (2 linhas em 2 arquivos), painel de perícia
(`batalha.js` + `paineis.js`), Brecha num gancho do cálculo de eficácia em `golpe.js`.

## Fora de propósito (volta se fizer falta jogando)

Seleção manual de alvo aliado · posicionamento frente/fundo (a ameaça do Guardião já faz esse papel sem UI nova) ·
recurso tipo mana (recarga resolve) · ofício escolhido pelo jogador na criação.
