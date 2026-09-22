# Auditoria da batalha — golpes e habilidades

Gerada a partir da PokéAPI (GraphQL): todos os golpes que algum Pokémon aprende **por nível** e todas as habilidades, comparados com o que o motor (`js/golpe.js`, `js/regras.js`, `js/habilidades.js`, `js/especiais.js`) faz de verdade.

- **ok**: o efeito cabe no "meta" genérico da PokéAPI (dano, status, atributos, dreno, cura, acertos múltiplos, recuo) que o motor já cobre sozinho.
- **aproximado**: funciona, mas simplificado (ex.: poder variável usando 60, golpe de dois turnos saindo no mesmo turno).
- **errado**: o efeito principal não acontece (ex.: Protect não protege, Explosion não derruba quem usa).

## Golpes

| | Antes | Corrigidos agora (especiais.js) | Restam |
|---|---:|---:|---:|
| ok | 533 | | |
| aproximado | 87 | 30 | 57 |
| errado | 169 | 20 | 149 |
| **total** | **789** | | |

Ordenados por quantos Pokémon aprendem o golpe (impacto no jogo). ✅ = corrigido em `js/especiais.js`.

### errado

| Golpe | Aprendem | Problema | |
|---|---:|---|---|
| focus-energy | 120 | não faz nada ("efeito ainda não implementado") | ✅ |
| protect | 109 | não faz nada ("efeito ainda não implementado") | ✅ |
| taunt | 102 | não faz nada ("efeito ainda não implementado") |  |
| helping-hand | 100 | não faz nada ("efeito ainda não implementado") |  |
| leech-seed | 78 | não faz nada ("efeito ainda não implementado") | ✅ |
| light-screen | 78 | efeito de lado do campo (tela/armadilha/vento) não existe |  |
| rest | 72 | não faz nada ("efeito ainda não implementado") | ✅ |
| rain-dance | 71 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| curse | 70 | não faz nada ("efeito ainda não implementado") |  |
| safeguard | 69 | efeito de lado do campo (tela/armadilha/vento) não existe |  |
| roar | 66 | forçar troca/fuga não existe |  |
| stealth-rock | 62 | efeito de lado do campo (tela/armadilha/vento) não existe; parte de troca não existe |  |
| explosion | 61 | quem usa não desmaia (autodestruição) | ✅ |
| disable | 58 | não faz nada ("efeito ainda não implementado") |  |
| yawn | 57 | não faz nada ("efeito ainda não implementado") |  |
| endure | 56 | não faz nada ("efeito ainda não implementado") | ✅ |
| encore | 55 | não faz nada ("efeito ainda não implementado") |  |
| future-sight | 55 | efeito único não implementado (conferir) |  |
| mist | 55 | efeito de lado do campo (tela/armadilha/vento) não existe |  |
| sandstorm | 54 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| baton-pass | 51 | não faz nada ("efeito ainda não implementado"); parte de troca não existe |  |
| copycat | 49 | não faz nada ("efeito ainda não implementado") |  |
| aromatherapy | 47 | não faz nada ("efeito ainda não implementado") |  |
| detect | 46 | não faz nada ("efeito ainda não implementado") | ✅ |
| imprison | 44 | não faz nada ("efeito ainda não implementado") |  |
| odor-sleuth | 43 | não faz nada ("efeito ainda não implementado") |  |
| haze | 42 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| sunny-day | 42 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| tailwind | 42 | efeito de lado do campo (tela/armadilha/vento) não existe |  |
| self-destruct | 41 | quem usa não desmaia (autodestruição) | ✅ |
| torment | 41 | não faz nada ("efeito ainda não implementado") |  |
| quick-guard | 40 | efeito de lado do campo (tela/armadilha/vento) não existe |  |
| water-sport | 40 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| pain-split | 39 | não faz nada ("efeito ainda não implementado") |  |
| soak | 38 | não faz nada ("efeito ainda não implementado") |  |
| memento | 37 | quem usa não desmaia (autodestruição) | ✅ |
| reflect | 37 | efeito de lado do campo (tela/armadilha/vento) não existe |  |
| shell-smash | 36 | efeito único não implementado (conferir) |  |
| wide-guard | 36 | efeito de lado do campo (tela/armadilha/vento) não existe |  |
| aqua-ring | 35 | não faz nada ("efeito ainda não implementado") |  |
| mean-look | 35 | não faz nada ("efeito ainda não implementado") |  |
| splash | 35 | não faz nada ("efeito ainda não implementado") |  |
| worry-seed | 35 | não faz nada ("efeito ainda não implementado") |  |
| laser-focus | 34 | não faz nada ("efeito ainda não implementado") |  |
| whirlwind | 34 | forçar troca/fuga não existe |  |
| destiny-bond | 33 | não faz nada ("efeito ainda não implementado"); quem usa não desmaia (autodestruição) |  |
| foresight | 33 | não faz nada ("efeito ainda não implementado") |  |
| psych-up | 33 | não faz nada ("efeito ainda não implementado") |  |
| ingrain | 31 | não faz nada ("efeito ainda não implementado") |  |
| mud-sport | 31 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| stockpile | 31 | efeito único não implementado (conferir) |  |
| hail | 28 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| electric-terrain | 27 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| heal-block | 27 | não faz nada ("efeito ainda não implementado") |  |
| healing-wish | 27 | não faz nada ("efeito ainda não implementado"); quem usa não desmaia (autodestruição) |  |
| lucky-chant | 27 | efeito de lado do campo (tela/armadilha/vento) não existe |  |
| mimic | 27 | não faz nada ("efeito ainda não implementado") |  |
| spite | 27 | não faz nada ("efeito ainda não implementado") |  |
| toxic-spikes | 27 | efeito de lado do campo (tela/armadilha/vento) não existe; parte de troca não existe |  |
| trick | 27 | não faz nada ("efeito ainda não implementado") |  |
| embargo | 26 | não faz nada ("efeito ainda não implementado") |  |
| entrainment | 26 | não faz nada ("efeito ainda não implementado") |  |
| sheer-cold | 26 | OHKO vira dano comum de poder 60 | ✅ |
| gastro-acid | 25 | não faz nada ("efeito ainda não implementado") |  |
| grassy-terrain | 25 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| teleport | 25 | não faz nada ("efeito ainda não implementado") |  |
| attract | 24 | não faz nada ("efeito ainda não implementado") |  |
| after-you | 23 | não faz nada ("efeito ainda não implementado") |  |
| fissure | 23 | OHKO vira dano comum de poder 60 | ✅ |
| misty-terrain | 23 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| belly-drum | 22 | não faz nada ("efeito ainda não implementado") |  |
| lock-on | 22 | não faz nada ("efeito ainda não implementado") |  |
| me-first | 22 | não faz nada ("efeito ainda não implementado") |  |
| substitute | 22 | não faz nada ("efeito ainda não implementado") |  |
| dream-eater | 21 | funciona em alvo acordado | ✅ |
| magnet-rise | 21 | não faz nada ("efeito ainda não implementado") |  |
| mirror-move | 21 | não faz nada ("efeito ainda não implementado") |  |
| wish | 21 | não faz nada ("efeito ainda não implementado") |  |
| guard-split | 20 | não faz nada ("efeito ainda não implementado") |  |
| perish-song | 20 | não faz nada ("efeito ainda não implementado") |  |
| refresh | 20 | não faz nada ("efeito ainda não implementado") |  |
| guillotine | 19 | OHKO vira dano comum de poder 60 | ✅ |
| recycle | 19 | não faz nada ("efeito ainda não implementado") |  |
| role-play | 19 | não faz nada ("efeito ainda não implementado") |  |
| skill-swap | 18 | não faz nada ("efeito ainda não implementado") |  |
| defog | 17 | efeito único não implementado (conferir) |  |
| switcheroo | 17 | não faz nada ("efeito ainda não implementado") |  |
| ally-switch | 16 | não faz nada ("efeito ainda não implementado"); parte de troca não existe |  |
| block | 16 | não faz nada ("efeito ainda não implementado") |  |
| final-gambit | 16 | poder variável: usa 60 fixo; quem usa não desmaia (autodestruição) |  |
| gravity | 16 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| snowscape | 16 | não faz nada ("efeito ainda não implementado") |  |
| follow-me | 15 | não faz nada ("efeito ainda não implementado") |  |
| mind-reader | 15 | não faz nada ("efeito ainda não implementado") |  |
| miracle-eye | 15 | não faz nada ("efeito ainda não implementado") |  |
| power-split | 15 | não faz nada ("efeito ainda não implementado") |  |
| spikes | 15 | efeito de lado do campo (tela/armadilha/vento) não existe; parte de troca não existe |  |
| sticky-web | 15 | efeito de lado do campo (tela/armadilha/vento) não existe; parte de troca não existe |  |
| grudge | 14 | não faz nada ("efeito ainda não implementado"); quem usa não desmaia (autodestruição) |  |
| guard-swap | 14 | não faz nada ("efeito ainda não implementado") |  |
| magic-coat | 14 | não faz nada ("efeito ainda não implementado") |  |
| nature-power | 14 | não faz nada ("efeito ainda não implementado") |  |
| psycho-shift | 14 | não faz nada ("efeito ainda não implementado") |  |
| snatch | 14 | não faz nada ("efeito ainda não implementado") |  |
| camouflage | 13 | não faz nada ("efeito ainda não implementado") |  |
| wonder-room | 13 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| acupressure | 12 | não faz nada ("efeito ainda não implementado") |  |
| horn-drill | 12 | OHKO vira dano comum de poder 60 | ✅ |
| power-swap | 12 | não faz nada ("efeito ainda não implementado") |  |
| rage-powder | 12 | não faz nada ("efeito ainda não implementado") |  |
| bestow | 11 | não faz nada ("efeito ainda não implementado") |  |
| power-trick | 10 | não faz nada ("efeito ainda não implementado") |  |
| spiky-shield | 10 | não faz nada ("efeito ainda não implementado") | ✅ |
| aurora-veil | 9 | efeito de lado do campo (tela/armadilha/vento) não existe |  |
| telekinesis | 9 | não faz nada ("efeito ainda não implementado") |  |
| ion-deluge | 8 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| magic-room | 8 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| metronome | 8 | não faz nada ("efeito ainda não implementado") |  |
| psychic-terrain | 8 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| simple-beam | 8 | não faz nada ("efeito ainda não implementado") |  |
| trick-or-treat | 8 | não faz nada ("efeito ainda não implementado") |  |
| crafty-shield | 7 | efeito de lado do campo (tela/armadilha/vento) não existe |  |
| nightmare | 7 | não faz nada ("efeito ainda não implementado") |  |
| reflect-type | 7 | não faz nada ("efeito ainda não implementado") |  |
| spider-web | 7 | não faz nada ("efeito ainda não implementado") |  |
| strength-sap | 7 | efeito único não implementado (conferir) |  |
| trick-room | 7 | efeito de campo inteiro (clima/terreno/sala) não existe |  |
| quash | 6 | não faz nada ("efeito ainda não implementado") |  |
| spotlight | 6 | não faz nada ("efeito ainda não implementado") |  |
| assist | 5 | não faz nada ("efeito ainda não implementado") |  |
| heal-bell | 5 | não faz nada ("efeito ainda não implementado") |  |
| sleep-talk | 5 | não faz nada ("efeito ainda não implementado") |  |
| flower-shield | 4 | efeito único não implementado (conferir) |  |
| mat-block | 4 | efeito de lado do campo (tela/armadilha/vento) não existe |  |
| conversion | 3 | não faz nada ("efeito ainda não implementado") |  |
| conversion-2 | 3 | não faz nada ("efeito ainda não implementado") |  |
| electrify | 3 | não faz nada ("efeito ainda não implementado") |  |
| heart-swap | 3 | não faz nada ("efeito ainda não implementado") |  |
| shelter | 3 | não faz nada ("efeito ainda não implementado") |  |
| speed-swap | 3 | não faz nada ("efeito ainda não implementado") |  |
| topsy-turvy | 3 | não faz nada ("efeito ainda não implementado") |  |
| forests-curse | 2 | não faz nada ("efeito ainda não implementado") |  |
| jungle-healing | 2 | efeito único não implementado (conferir) |  |
| kings-shield | 2 | não faz nada ("efeito ainda não implementado"); parte de troca não existe | ✅ |
| revival-blessing | 2 | não faz nada ("efeito ainda não implementado") |  |
| shed-tail | 2 | não faz nada ("efeito ainda não implementado") |  |
| take-heart | 2 | não faz nada ("efeito ainda não implementado") |  |
| tidy-up | 2 | não faz nada ("efeito ainda não implementado") |  |
| transform | 2 | não faz nada ("efeito ainda não implementado") |  |
| baneful-bunker | 1 | não faz nada ("efeito ainda não implementado") | ✅ |
| burning-bulwark | 1 | não faz nada ("efeito ainda não implementado") | ✅ |
| court-change | 1 | não faz nada ("efeito ainda não implementado") |  |
| doodle | 1 | não faz nada ("efeito ainda não implementado") |  |
| doom-desire | 1 | efeito único não implementado (conferir) |  |
| fairy-lock | 1 | efeito de campo inteiro (clima/terreno/sala) não existe; parte de troca não existe |  |
| fillet-away | 1 | não faz nada ("efeito ainda não implementado") |  |
| instruct | 1 | não faz nada ("efeito ainda não implementado") |  |
| lunar-blessing | 1 | não faz nada ("efeito ainda não implementado") |  |
| lunar-dance | 1 | não faz nada ("efeito ainda não implementado"); quem usa não desmaia (autodestruição) |  |
| magic-powder | 1 | não faz nada ("efeito ainda não implementado") |  |
| obstruct | 1 | não faz nada ("efeito ainda não implementado") | ✅ |
| octolock | 1 | não faz nada ("efeito ainda não implementado") |  |
| powder | 1 | não faz nada ("efeito ainda não implementado") |  |
| purify | 1 | efeito único não implementado (conferir) |  |
| silk-trap | 1 | não faz nada ("efeito ainda não implementado") | ✅ |
| sketch | 1 | não faz nada ("efeito ainda não implementado") |  |
| spicy-extract | 1 | não faz nada ("efeito ainda não implementado") |  |
| teatime | 1 | não faz nada ("efeito ainda não implementado") |  |
| victory-dance | 1 | não faz nada ("efeito ainda não implementado") |  |

### aproximado

| Golpe | Aprendem | Problema | |
|---|---:|---|---|
| thrash | 99 | golpe de vários turnos: dura 1 turno | ✅ |
| flail | 98 | poder variável: usa 60 fixo | ✅ |
| rollout | 98 | condição que muda o poder é ignorada |  |
| pursuit | 76 | condição que muda o poder é ignorada; parte de troca não existe |  |
| assurance | 74 | condição que muda o poder é ignorada |  |
| outrage | 73 | golpe de vários turnos: dura 1 turno | ✅ |
| toxic | 71 | veneno grave age como veneno comum | ✅ |
| bide | 68 | poder variável: usa 60 fixo |  |
| counter | 64 | poder variável: usa 60 fixo |  |
| payback | 64 | condição que muda o poder é ignorada |  |
| endeavor | 61 | poder variável: usa 60 fixo | ✅ |
| hex | 60 | condição que muda o poder é ignorada | ✅ |
| hyper-beam | 59 | sem turno de recarga | ✅ |
| dig | 56 | carga: acerta no mesmo turno | ✅ |
| fury-cutter | 55 | condição que muda o poder é ignorada |  |
| reversal | 54 | poder variável: usa 60 fixo | ✅ |
| brine | 49 | condição que muda o poder é ignorada | ✅ |
| electro-ball | 47 | poder variável: usa 60 fixo | ✅ |
| giga-impact | 47 | sem turno de recarga | ✅ |
| smack-down | 45 | efeito 'unknown' não existe (só o dano) |  |
| solar-beam | 44 | carga: acerta no mesmo turno | ✅ |
| wrap | 42 | efeito 'trap' não existe (só o dano) |  |
| acrobatics | 39 | condição que muda o poder é ignorada |  |
| fire-spin | 39 | efeito 'trap' não existe (só o dano) |  |
| gyro-ball | 39 | poder variável: usa 60 fixo | ✅ |
| heavy-slam | 38 | poder variável: usa 60 fixo |  |
| bind | 37 | efeito 'trap' não existe (só o dano) |  |
| mirror-coat | 36 | poder variável: usa 60 fixo |  |
| natural-gift | 36 | poder variável: usa 60 fixo |  |
| u-turn | 36 | parte de troca não existe |  |
| low-kick | 34 | poder variável: usa 60 fixo |  |
| retaliate | 34 | condição que muda o poder é ignorada |  |
| psyshock | 32 | condição que muda o poder é ignorada |  |
| fling | 31 | poder variável: usa 60 fixo |  |
| dragon-tail | 30 | parte de troca não existe |  |
| phantom-force | 28 | carga: acerta no mesmo turno | ✅ |
| wring-out | 28 | poder variável: usa 60 fixo |  |
| spit-up | 26 | poder variável: usa 60 fixo |  |
| razor-wind | 25 | carga: acerta no mesmo turno | ✅ |
| sand-tomb | 25 | efeito 'trap' não existe (só o dano) |  |
| whirlpool | 25 | efeito 'trap' não existe (só o dano) |  |
| sky-attack | 23 | carga: acerta no mesmo turno | ✅ |
| tri-attack | 23 | efeito 'unknown' não existe (só o dano) |  |
| wake-up-slap | 23 | condição que muda o poder é ignorada |  |
| facade | 22 | condição que muda o poder é ignorada | ✅ |
| petal-dance | 22 | golpe de vários turnos: dura 1 turno | ✅ |
| round | 22 | condição que muda o poder é ignorada |  |
| metal-burst | 21 | poder variável: usa 60 fixo |  |
| poison-fang | 21 | veneno grave age como veneno comum |  |
| dive | 20 | carga: acerta no mesmo turno | ✅ |
| punishment | 20 | poder variável: usa 60 fixo |  |
| throat-chop | 20 | efeito 'silence' não existe (só o dano) |  |
| beat-up | 17 | poder variável: usa 60 fixo |  |
| magnitude | 17 | poder variável: usa 60 fixo |  |
| stomping-tantrum | 17 | condição que muda o poder é ignorada |  |
| infestation | 16 | efeito 'trap' não existe (só o dano) |  |
| skull-bash | 14 | carga: acerta no mesmo turno | ✅ |
| volt-switch | 13 | parte de troca não existe |  |
| ice-ball | 8 | condição que muda o poder é ignorada |  |
| parting-shot | 8 | parte de troca não existe |  |
| circle-throw | 6 | parte de troca não existe |  |
| grass-knot | 6 | poder variável: usa 60 fixo |  |
| heat-crash | 6 | poder variável: usa 60 fixo |  |
| clamp | 5 | efeito 'trap' não existe (só o dano) |  |
| thousand-arrows | 5 | efeito 'unknown' não existe (só o dano) |  |
| trump-card | 5 | poder variável: usa 60 fixo |  |
| natures-madness | 4 | poder variável: usa 60 fixo |  |
| prismatic-laser | 4 | sem turno de recarga | ✅ |
| solar-blade | 4 | carga: acerta no mesmo turno | ✅ |
| psystrike | 3 | condição que muda o poder é ignorada |  |
| rock-wrecker | 3 | sem turno de recarga | ✅ |
| eternabeam | 2 | sem turno de recarga | ✅ |
| present | 2 | poder variável: usa 60 fixo |  |
| return | 2 | poder variável: usa 60 fixo |  |
| roar-of-time | 2 | sem turno de recarga | ✅ |
| secret-sword | 2 | condição que muda o poder é ignorada |  |
| shadow-force | 2 | carga: acerta no mesmo turno | ✅ |
| crush-grip | 1 | poder variável: usa 60 fixo |  |
| freeze-shock | 1 | carga: acerta no mesmo turno | ✅ |
| frustration | 1 | poder variável: usa 60 fixo |  |
| geomancy | 1 | carga: acerta no mesmo turno |  |
| ice-burn | 1 | carga: acerta no mesmo turno | ✅ |
| magma-storm | 1 | efeito 'trap' não existe (só o dano) |  |
| meteor-assault | 1 | sem turno de recarga | ✅ |
| snap-trap | 1 | efeito 'trap' não existe (só o dano) |  |
| tar-shot | 1 | efeito 'tar-shot' não existe |  |
| thunder-cage | 1 | efeito 'trap' não existe (só o dano) |  |

## Habilidades

**64 de 307** habilidades implementadas. Pesando por quantos Pokémon têm cada uma: **1157 de 2903** (40%). Pokémon com habilidade não implementada jogam normalmente, só sem o efeito dela (o painel mostra "(sem efeito ainda)").

Muitas das que faltam dependem de sistemas que ainda não existem: **clima** (Swift Swim, Chlorophyll, Sand Veil, Ice Body, Hydration…), **item segurado** (Gluttony, Frisk, Pickup, Unburden…), **troca de Pokémon** (Regenerator, Natural Cure) ou **batalha em dupla** (Telepathy). Essas entram junto com o sistema delas.

### Faltando, por uso

| Habilidade | Pokémon | Efeito (PokéAPI) |
|---|---:|---|
| swift-swim | 48 | Doubles Speed during rain. |
| chlorophyll | 39 | Doubles Speed during strong sunlight. |
| gluttony | 39 | Makes the Pokémon eat any held Berry triggered by low HP below 1/2 its max HP. |
| frisk | 38 | Reveals an opponent's held item upon entering battle. |
| sheer-force | 37 | Strengthens moves with extra effects to 1.3× their power, but prevents their extra effects. |
| pressure | 36 | Increases the PP cost of moves targetting the Pokémon by one. |
| shell-armor | 31 | Protects against critical hits. |
| pickup | 30 | Picks up other Pokémon's used and Flung held items. May also pick up an item after battle. |
| sand-veil | 30 | Increases evasion to 1.25× during a sandstorm. Protects against sandstorm damage. |
| telepathy | 28 | Protects against friendly Pokémon's damaging moves. |
| unnerve | 28 | Prevents opposing Pokémon from eating held Berries. |
| regenerator | 27 | Heals for 1/3 max HP upon switching out. |
| infiltrator | 26 | Bypasses light screen, reflect, and safeguard. |
| mold-breaker | 26 | Bypasses targets' abilities if they could hinder or prevent a move. |
| overcoat | 26 | Protects against damage from weather. |
| weak-armor | 25 | Raises Speed and lowers Defense by one stage each upon being hit by a physical move. |
| hydration | 23 | Cures any major status ailment after each turn during rain. |
| leaf-guard | 23 | Protects against major status ailments during strong sunlight. |
| ice-body | 21 | Heals for 1/16 max HP after each turn during hail. Protects against hail damage. |
| rattled | 21 | Raises Speed one stage upon being hit by a dark, ghost, or bug move. |
| damp | 20 | Prevents self destruct, explosion, and aftermath from working while the Pokémon is in battle. |
| prankster | 20 | Raises non-damaging moves' priority by one stage. |
| iron-fist | 19 | Strengthens punch-based moves to 1.2× their power. |
| natural-cure | 19 | Cures any major status ailment upon switching out. |
| anticipation | 18 | Notifies all trainers upon entering battle if an opponent has a super-effective move, self destruct, explosion, or a one-hit KO move. |
| rivalry | 18 | Increases damage inflicted to 1.25× against Pokémon of the same gender, but decreases damage to 0.75× against the opposite gender. |
| sand-force | 18 | Strengthens rock, ground, and steel moves to 1.3× their power during a sandstorm. Protects against sandstorm damage. |
| soundproof | 18 | Protects against sound-based moves. |
| synchronize | 18 | Copies burns, paralysis, and poison received onto the Pokémon that inflicted them. |
| unburden | 17 | Doubles Speed upon using or losing a held item. |
| defiant | 16 | Raises Attack two stages upon having any stat lowered. |
| moxie | 16 | Raises Attack one stage upon KOing a Pokémon. |
| pickpocket | 16 | Steals attacking Pokémon's held items on contact. |
| steadfast | 16 | Raises Speed one stage upon flinching. |
| competitive | 15 | Raises Special Attack by two stages upon having any stat lowered. |
| cursed-body | 15 | Has a 30% chance of Disabling any move that hits the Pokémon. |
| cute-charm | 15 | Has a 30% chance of infatuating attacking Pokémon on contact. |
| scrappy | 15 | Lets the Pokémon's normal and fighting moves hit ghost Pokémon. |
| snow-cloak | 15 | Increases evasion to 1.25× during hail. Protects against hail damage. |
| unaware | 15 | Ignores other Pokémon's stat modifiers for damage and accuracy calculation. |
| rain-dish | 14 | Heals for 1/16 max HP after each turn during rain. |
| shields-down | 14 | Transforms this Minior between Core Form and Meteor Form. Prevents major status ailments and drowsiness while in Meteor Form. |
| reckless | 13 | Strengthens recoil moves to 1.2× their power. |
| strong-jaw | 13 | Strengthens biting moves to 1.5× their power. |
| analytic | 12 | Strengthens moves to 1.3× their power when moving last. |
| anger-point | 12 | Raises Attack to the maximum of six stages upon receiving a critical hit. |
| healer | 12 | Has a 30% chance of curing each adjacent ally of any major status ailment after each turn. |
| klutz | 12 | Prevents the Pokémon from using its held item in battle. |
| aftermath | 11 | Damages the attacker for 1/4 its max HP when knocked out by a contact move. |
| battle-armor | 11 | Protects against critical hits. |
| beast-boost | 11 | Raises this Pokémon's highest stat by one stage when it faints another Pokémon. |
| bulletproof | 11 | Protects against bullet, ball, and bomb-based moves. |
| contrary | 11 | Inverts stat changes. |
| effect-spore | 11 | Has a 30% chance of inflcting either paralysis, poison, or sleep on attacking Pokémon on contact. |
| no-guard | 11 | Ensures all moves used by and against the Pokémon hit. |
| poison-touch | 11 | Has a 30% chance of poisoning target Pokémon upon contact. |
| friend-guard | 10 | Decreases all direct damage taken by friendly Pokémon to 0.75×. |
| heavy-metal | 10 | Doubles the Pokémon's weight. |
| justified | 10 | Raises Attack one stage upon taking damage from a dark move. |
| magic-bounce | 10 | Reflects most non-damaging moves back at their user. |
| magic-guard | 10 | Protects against damage not directly caused by a move. |
| plus | 10 | Increases Special Attack to 1.5× when a friendly Pokémon has plus or minus. |
| protosynthesis | 10 | Raises highest stat in harsh sunlight, or if holding Booster Energy. |
| quark-drive | 10 | Raises highest stat on Electric Terrain, or if holding Booster Energy. |
| sand-rush | 10 | Doubles Speed during a sandstorm. Protects against sandstorm damage. |
| solar-power | 10 | Increases Special Attack to 1.5× but costs 1/8 max HP after each turn during strong sunlight. |
| stench | 10 | Has a 10% chance of making target Pokémon flinch with each hit. |
| sticky-hold | 10 | Prevents a held item from being removed by other Pokémon. |
| harvest | 9 | Has a 50% chance of restoring a used Berry after each turn if the Pokémon has held no items in the meantime. |
| magnet-pull | 9 | Prevents steel opponents from fleeing or switching out. |
| stakeout | 9 | This Pokémon's moves have double power against Pokémon that switched in this turn. |
| super-luck | 9 | Raises moves' critical hit rates one stage. |
| tangled-feet | 9 | Doubles evasion when confused. |
| aroma-veil | 8 | Protects allies against moves that affect their mental state. |
| illuminate | 8 | Doubles the wild encounter rate. |
| minus | 8 | Increases Special Attack to 1.5× when a friendly Pokémon has plus or minus. |
| moody | 8 | Raises a random stat two stages and lowers another one stage after each turn. |
| snow-warning | 8 | Summons hail that lasts indefinitely upon entering battle. |
| tough-claws | 8 | Strengthens moves that make contact to 1.33× their power. |
| cheek-pouch | 7 | Restores HP upon eating a Berry, in addition to the Berry's effect. |
| cloud-nine | 7 | Negates all effects of weather, but does not prevent the weather itself. |
| gooey | 7 | Lowers attacking Pokémon's Speed by one stage on contact. |
| light-metal | 7 | Halves the Pokémon's weight. |
| protean | 7 | Changes the bearer's type to match each move it uses. |
| slush-rush | 7 | During Hail, this Pokémon has double Speed. |
| fluffy | 6 | Damage from contact moves is halved. Damage from Fire moves is doubled. |
| forewarn | 6 | Reveals the opponents' strongest move upon entering battle. |
| magician | 6 | Steals the target's held item when the bearer uses a damaging move. |
| shadow-tag | 6 | Prevents opponents from fleeing or switching out. |
| trace | 6 | Copies an opponent's ability upon entering battle. |
| corrosion | 5 | This Pokémon can inflict poison on Poison and Steel Pokémon. |
| drought | 5 | Summons strong sunlight that lasts indefinitely upon entering battle. |
| flower-veil | 5 | Protects friendly grass Pokémon from having their stats lowered by other Pokémon. |
| grassy-surge | 5 | When this Pokémon enters battle, it changes the terrain to Grassy Terrain. |
| hadron-engine | 5 | Creates an Electric Terrain when entering battle, and boosts Special Attack while active. |
| honey-gather | 5 | The Pokémon may pick up honey after battle. |
| orichalcum-pulse | 5 | Turns the sunlight harsh when entering battle, and boosts Attack while active. |
| ripen | 5 | Doubles the effect of berries. |
| sand-stream | 5 | Summons a sandstorm that lasts indefinitely upon entering battle. |
| simple | 5 | Doubles the Pokémon's stat modifiers. These doubled modifiers are still capped at -6 or 6 stages. |
| suction-cups | 5 | Prevents being forced out of battle by other Pokémon's moves. |
| symbiosis | 5 | Passes the bearer's held item to an ally when the ally uses up its item. |
| wonder-skin | 5 | Lowers incoming non-damaging moves' base accuracy to exactly 50%. |
| cud-chew | 4 | Causes the Pokémon to reuse an already consumed Berry at the end of the next turn. |
| dancer | 4 | Whenever another Pokémon uses a dance move, this Pokémon will use the same move immediately afterwards. |
| disguise | 4 | Prevents the first instance of battle damage. |
| download | 4 | Raises the attack stat corresponding to the opponents' weaker defense one stage upon entering battle. |
| forecast | 4 | Changes castform's type and form to match the weather. |
| illusion | 4 | Takes the appearance of the last conscious party Pokémon upon being sent out until hit by a damaging move. |
| libero | 4 | Libero changes the Pokémon's type to that of its previously used attack. |
| liquid-ooze | 4 | Damages opponents using leeching moves for as much as they would heal. |
| punk-rock | 4 | Boosts sound-based moves and halves damage from the same moves. |
| sharpness | 4 | Powers up slicing moves. |
| steam-engine | 4 | Boosts the Speed stat drastically when the Pokémon is hit by a Fire- or Water-type move. |
| unseen-fist | 4 | Contact moves can strike through Protect/Detect. |
| zen-mode | 4 | Changes darmanitan's form after each turn depending on its HP: Zen Mode below 50% max HP, and Standard Mode otherwise. |
| arena-trap | 3 | Prevents opponents from fleeing or switching out. Eluded by flying-types and Pokémon in the air. |
| commander | 3 | Goes inside the mouth of an ally Dondozo if one is on the field. |
| drizzle | 3 | Summons rain that lasts indefinitely upon entering battle. |
| gale-wings | 3 | Raises flying moves' priority by one stage. |
| galvanize | 3 | This Pokémon's Normal moves are Electric and have their power increased to 1.2×. |
| gulp-missile | 3 | If a Cramorant with Gulp Missile uses Surf or Dive, it catches prey and changes its form depending on its remaining HP. |
| liquid-voice | 3 | Sound-based moves become Water-type. |
| long-reach | 3 | This Pokémon's moves do not make contact. |
| mega-launcher | 3 | Strengthens aura and pulse moves to 1.5× their power. |
| neutralizing-gas | 3 | Neutralizes abilities of all Pokémon in battle. |
| pixilate | 3 | Turns the bearer's normal moves into fairy moves and strengthens them to 1.3× their power. |
| poison-heal | 3 | Heals for 1/8 max HP after each turn when poisoned in place of damage. |
| power-construct | 3 | Transforms 10% or 50% Zygarde into Complete Forme when its HP is below 50%. |
| psychic-surge | 3 | When this Pokémon enters battle, it changes the terrain to Psychic Terrain. |
| purifying-salt | 3 | Protects from status conditions and halves damage from Ghost-type moves. |
| refrigerate | 3 | Turns the bearer's normal moves into ice moves and strengthens them to 1.3× their power. |
| sand-spit | 3 | Creates a sandstorm when hit by an attack. |
| stalwart | 3 | Ignores moves and abilities that draw in moves. |
| stamina | 3 | Raises this Pokémon's Defense by one stage when it takes damage from a move. |
| thermal-exchange | 3 | Raises Attack when hit by a Fire-type move. Cannot be burned. |
| toxic-chain | 3 | May cause bad poisoning when the Pokémon hits an opponent with a move. |
| truant | 3 | Skips every second turn. |
| wind-rider | 3 | Gives immunity to wind moves, and causes the Pokémon's Attack to increase by one stage when hit by one. |
| aerilate | 2 | Turns the bearer's normal moves into flying moves and strengthens them to 1.3× their power. |
| aura-break | 2 | Makes dark aura and fairy aura weaken moves of their respective types. |
| battle-bond | 2 | Transforms this Pokémon into Ash-Greninja after fainting an opponent. Water Shuriken's power is 20 and always hits three times. |
| berserk | 2 | Raises this Pokémon's Special Attack by one stage every time its HP drops below half. |
| cotton-down | 2 | When Ignores moves and abilities that draw in moves. |
| dauntless-shield | 2 | Boosts Defense in battle. |
| defeatist | 2 | Halves Attack and Special Attack at 50% max HP or less. |
| electric-surge | 2 | When this Pokémon enters battle, it changes the terrain to Electric Terrain. |
| flare-boost | 2 | Increases Special Attack to 1.5× when burned. |
| fur-coat | 2 | Halves damage from physical attacks. |
| gorilla-tactics | 2 | Boosts the Pokémon's Attack stat but only allows the use of the first selected move. |
| grass-pelt | 2 | Boosts Defense while grassy terrain is in effect. |
| guard-dog | 2 | Boosts Attack if intimidated, and prevents being forced to switch out. |
| hospitality | 2 | When a Pokémon with Hospitality enters a battle, it restores HP for an ally by 25%. |
| hunger-switch | 2 | Causes Morpeko to change its form each turn, alternating between Full Belly Mode and Hangry Mode |
| ice-face | 2 | The Pokémon’s ice head can take a physical attack as a substitute, but the attack also changes the Pokémon’s appearance. The ice will be restored when it snows. |
| ice-scales | 2 | Halves damage from Special moves. |
| intrepid-sword | 2 | Boosts Attack in battle. |
| merciless | 2 | This Pokémon's moves critical hit against poisoned targets. |
| mirror-armor | 2 | Reflects any stat-lowering effects. |
| misty-surge | 2 | When this Pokémon enters battle, it changes the terrain to Misty Terrain. |
| mummy | 2 | Changes attacking Pokémon's abilities to Mummy on contact. |
| mycelium-might | 2 | Status moves go last, but are not affected by the opponent's ability. |
| normalize | 2 | Makes the Pokémon's moves all act normal-type. |
| pastel-veil | 2 | Prevents the Pokémon and its allies from being poisoned. |
| power-of-alchemy | 2 | When an ally faints, this Pokémon gains its Ability. |
| propeller-tail | 2 | Ignores moves and abilities that draw in moves. |
| schooling | 2 | Wishiwashi becomes Schooling Form when its HP is 25% or higher. |
| screen-cleaner | 2 | Nullifies effects of Light Screen, Reflect, and Aurora Veil. |
| slow-start | 2 | Halves Attack and Speed for five turns upon entering battle. |
| soul-heart | 2 | This Pokémon's Special Attack rises by one stage every time any Pokémon faints. |
| stance-change | 2 | Changes aegislash to Blade Forme before using a damaging move, or Shield Forme before using kings shield. |
| supersweet-syrup | 2 | Once per battle, when a Pokémon with Supersweet Syrup enters the battle, it lowers the evasion stat of all adjacent opponents by one stage.  |
| tangling-hair | 2 | When this Pokémon takes regular damage from a contact move, the attacking Pokémon's Speed lowers by one stage. |
| teravolt | 2 | Bypasses targets' abilities if they could hinder or prevent moves. |
| toxic-debris | 2 | Scatters poison spikes at the feet of the opposing team when the Pokémon takes damage from physical moves. |
| turboblaze | 2 | Bypasses targets' abilities if they could hinder or prevent moves. |
| wandering-spirit | 2 | Swaps abilities with opponents on contact. |
| water-compaction | 2 | Raises this Pokémon's Defense by two stages when it's hit by a Water move. |
| wind-power | 2 | When hit by a wind move, the power of the next Electric-type move it uses is doubled. |
| zero-to-hero | 2 | Transforms into its Hero Form when switching out. |
| air-lock | 1 | Negates all effects of weather, but does not prevent the weather itself. |
| anger-shell | 1 | When the Pokémon's HP drops below half, Anger Shell lowers its Defense and Special Defense but its Attack, Special Attack and Speed are raised. |
| armor-tail | 1 | Prevents the opponent from using any moves that have priority, such as Quick Attack. |
| as-one-glastrier | 1 |  |
| as-one-spectrier | 1 |  |
| bad-dreams | 1 | Damages sleeping opponents for 1/8 their max HP after each turn. |
| ball-fetch | 1 | If the Pokémon is not holding an item, it will fetch the Poké Ball from the first failed throw of the battle. |
| battery | 1 | Ally Pokémon's moves have their power increased to 1.3×. |
| beads-of-ruin | 1 | Lowers Special Defense of all Pokémon except itself. |
| chilling-neigh | 1 | Boosts Attack after knocking out a Pokémon. |
| color-change | 1 | Changes type to match when hit by a damaging move. |
| comatose | 1 | This Pokémon always acts as though it were Asleep. |
| costar | 1 | Copies ally's stat changes on entering battle. |
| curious-medicine | 1 | Resets all stat changes upon entering battlefield. |
| dark-aura | 1 | Strengthens dark moves to 1.33× their power for all friendly and opposing Pokémon. |
| dazzling | 1 | Opposing Pokémon cannot use priority attacks. |
| delta-stream | 1 | Creates a mysterious air current, which cannot be replaced and causes moves to never be super effective against Flying Pokémon. |
| desolate-land | 1 | Creates extremely harsh sunlight, which has all the properties of Sunny Day, cannot be replaced, and causes damaging Water moves to fail. |
| dragons-maw | 1 | Powers up Dragon-type moves. |
| earth-eater | 1 | Restores HP when hit by a Ground-type move. |
| electromorphosis | 1 | When hit by an attack, the power of the next Electric-type move it uses is doubled. |
| emergency-exit | 1 | This Pokémon automatically switches out when its HP drops below half. |
| fairy-aura | 1 | Strengthens fairy moves to 1.33× their power for all friendly and opposing Pokémon. |
| flower-gift | 1 | Increases friendly Pokémon's Attack and Special Defense to 1.5× during strong sunlight. |
| good-as-gold | 1 | Gives immunity to status moves. |
| grim-neigh | 1 | Boosts Special Attack after knocking out a Pokémon. |
| imposter | 1 | Transforms upon entering battle. |
| innards-out | 1 | When this Pokémon faints from an opponent's move, that opponent takes damage equal to the HP this Pokémon had remaining. |
| lingering-aroma | 1 | Contact changes the attacker's Ability to Lingering Aroma. |
| mimicry | 1 | Changes type depending on the terrain. |
| minds-eye | 1 | The Pokémon ignores changes to opponents' evasiveness, its accuracy can't be lowered, and it can hit Ghost types with Normal- and Fighting-type moves. |
| multitype | 1 | Changes arceus's type and form to match its held Plate. |
| neuroforce | 1 | Increases super-effective damage dealt to 1.25×. |
| opportunist | 1 | Copies stat boosts by the opponent. |
| parental-bond | 1 | Lets the bearer hit twice with damaging moves. The second hit has half power. |
| perish-body | 1 | When hit by a move that makes direct contact, the Pokémon and the attacker will faint after three turns unless they switch out of battle. |
| poison-puppeteer | 1 | Pokémon poisoned by Pecharunt's moves will also become confused. |
| power-spot | 1 | Just being next to the Pokémon powers up moves. |
| primordial-sea | 1 | Creates heavy rain, which has all the properties of Rain Dance, cannot be replaced, and causes damaging Fire moves to fail. |
| queenly-majesty | 1 | Opposing Pokémon cannot use priority attacks. |
| quick-draw | 1 | Enables the Pokémon to move first occasionally. |
| receiver | 1 | When an ally faints, this Pokémon gains its Ability. |
| rks-system | 1 | Changes this Pokémon's type to match its held Memory. |
| rocky-payload | 1 | Powers up Rock-type moves. |
| seed-sower | 1 | Turns the ground into Grassy Terrain when the Pokémon is hit by an attack. |
| stall | 1 | Makes the Pokémon move last within its move's priority bracket. |
| steelworker | 1 | This Pokémon's Steel moves have 1.5× power. |
| steely-spirit | 1 | Powers up ally Pokémon's Steel-type moves. |
| supreme-overlord | 1 | Attack and Special Attack are boosted for each party Pokémon that has been defeated. |
| surge-surfer | 1 | Doubles this Pokémon's Speed on Electric Terrain. |
| sword-of-ruin | 1 | Lowers Defense of all Pokémon except itself. |
| tablets-of-ruin | 1 | Lowers Attack of all Pokémon except itself. |
| teraform-zero | 1 | As soon as Terapagos assumes its Stellar Form, it will immediately neutralize weather and terrain effects.  |
| tera-shell | 1 | All damage-dealing moves that hit the Pokémon when its HP is full will not be very effective. |
| tera-shift | 1 | When Terapagos enters the battle, it turns into its Terastal Form until the end of the battle.  |
| toxic-boost | 1 | Increases Attack to 1.5× when poisoned. |
| transistor | 1 | Powers up Electric-type moves. |
| triage | 1 | This Pokémon's healing moves have their priority increased by 3. |
| vessel-of-ruin | 1 | Lowers Special Attack of all Pokémon except itself. |
| victory-star | 1 | Increases moves' accuracy to 1.1× for friendly Pokémon. |
| well-baked-body | 1 | Immune to Fire-type moves, and Defense is sharply boosted. |
| wimp-out | 1 | This Pokémon automatically switches out when its HP drops below half. |

