# Backlog do PokéRPG

Saiu do `CLAUDE.md` em 30/09/2026 na segunda faxina: é planejamento — consultado quando se decide **o que fazer
agora**, não a cada sessão. O `CLAUDE.md` guarda só o ponteiro; aqui está o conteúdo palavra por palavra.

**Ao concluir um item, mova daqui pro `docs/features.md`** (o que foi construído) — não deixe nos dois.

## Pedido, ainda não construído

- **Som no jogo.** Os *cries* existem na PokéAPI (mesmo repositório dos sprites, `pokemon.cries`) e dá pra usar `espelhar`. **Música a PokéAPI não tem** — precisaria de outra fonte, e aí vira decisão de risco (trilha original = direito autoral). Falta decidir: ligado por padrão? quais eventos tocam cry?
- **Arceus como chefe de raide** — decidir se entra na rotação (mudaria o `% 14`) ou é evento à parte.
- **Troca de verdade** entre dois jogadores (hoje só o Cabo de Conexão simulado).
- **Missões próprias de cada mapa** (hoje as de espécie valem em qualquer Gen; a trilha de Alfas é só de Kanto) e **lendários no co-op**.
- **Roar & cia. em luta de SALA (multiplayer)**: hoje falham com aviso (`ctx.forcarSaida` só existe no single player). Regenerator/Natural Cure/Wimp Out também só valem no single player. Precisaria de "tirar da luta" no `mp-motor` (o Pokémon fora não é derrotado, e o resultado volta por fração de HP). **Eject Button/Eject Pack não foram feitos**: só serviriam a aliados (no seu principal a saída voluntária não vale). Shed Tail não foi feito (não existe Substitute). Detalhes em `docs/features.md` ("Travas, IA e troca de Pokémon").
- **Habilidades**: 215 de 314. Boa parte das 99 restantes está documentada como intencionalmente fora (ver `docs/features.md`).
- **Frutas de aperto por tipo** (Occa, Passho…) — os outros itens segurados já entraram.

## Revisões grandes pedidas (ainda não feitas)

- **Revisão do site pra entrar nas políticas do Google AdSense** — **levantamento feito, em `docs/adsense.md`**; ler ANTES de mexer em qualquer coisa dessa área. Decisão do usuário (29/09/2026): seguir com os disclaimers, usando o **Pokémon Showdown como caso de uso** (roda AdSense há anos com o mesmo tipo de conteúdo; o site deles não tem aviso de marca em lugar nenhum — o que importa é ser gratuito e não vender nada da franquia). **Já entregue**: páginas estáticas com URL própria (o jogo era uma URL só, sem nada legível por buscador), política de privacidade reescrita, rodapé com links legais, `robots.txt`/`sitemap.xml`/`ads.txt`, domínio próprio nos `canonical`, **guia em 6 capítulos** (o conteúdo próprio) e o **snippet com Consent Mode v2** (`js/consent.js`). **O que falta e em que ordem está em "Precisa de ação do usuário" abaixo** — a próxima etapa é **do usuário: pedir a revisão**.
- ~~**Revisão e refatoração completa do multiplayer**~~ **✅ FEITA (29/09/2026)** — `multiplayer.js` (1190 linhas) virou seis módulos, o menu/lobby/luta foram redesenhados (convite por link, espectador, cena de batalha, barra de prazo, histórico do turno) e a rede ficou leve (`ping` + render por região). Detalhe em `docs/features.md` ("A revisão do multiplayer"). **Continuam de fora, por escolha**: Roar & cia. em sala e a troca de verdade entre jogadores (itens acima).
- **Auditoria de segurança** — **1ª leva FEITA (29/09/2026)**, detalhe em `docs/features.md` ("A auditoria de segurança"). Achado grave e corrigido: **a sala do multiplayer confiava no pacote que chegava** (XSS → sessão do Supabase no `localStorage` → conta da pessoa) — agora tudo passa por `js/mp-sanear.js`. No banco, dois furos de ABUSO fechados (`20260929180000_seguranca_upload_e_visitante.sql`): bucket de imagem de relato aberto a qualquer um sem teto, e contador de visitante aceitando id inventado. **Revisado e considerado OK**: RLS de todas as tabelas, `validar_jornada`, gatilho anti-autopromoção de `perfis.admin`, `perfil_do_amigo` (só amigo aceito), chave anônima no `config.js` (é pública por natureza), presença global (`track({})` vazio). **Anexar imagem num relato exige CONTA** (decisão do usuário, 29/09/2026 — `20260929210000_imagem_de_relato_so_com_conta.sql`): sem conta não há a quem amarrar o envio, então nenhum teto vale. O RELATO segue sem conta (promessa da tela). A regra é cobrada em 3 camadas e todas leem `imagens-relato.podeAnexarImagem`/`MOTIVO_PRECISA_CONTA`; `subirImagensRelato` devolve **`null` ≠ `[]`** pra fila offline antiga subir o texto em vez de ficar presa pra sempre. **O que FALTA**: (b) a pontuação é calculada no navegador e só CONFERIDA no servidor (jornada plausível inventada passa — limite conhecido e aceito: sem servidor de jogo não tem como fechar); (c) forjar um `fim` de luta ainda é possível pra quem está NA sala (o `de` não é prova — broadcast não tem remetente assinado); (d) `/security-review` nunca foi rodado como segunda opinião.

## Precisa de ação do usuário

- ⚠️ **`evento.BETA_SEM_ESPERA = true`** remove a espera de 8 h entre tentativas (beta testers). **Temporário** — reverter é trocar essa linha.
- **AdSense — em andamento, sequência combinada (29/09/2026).** Conta criada, domínio `pokerpg.com.br` cadastrado, publisher ID **`ca-pub-9827780756194019`**, estado "Precisa de revisão". Etapas 1–3 **feitas**:
  1. ~~Verificar a propriedade pelo `ads.txt`~~ ✔ (o usuário confirmou no painel).
  2. ~~Guia por tema~~ ✔: 6 capítulos (`CAPITULOS_GUIA` em `site.js`, texto em `ferramentas/conteudo-guia.mjs`), índice em `guia.html`, navegação no pé de cada um.
  3. ~~Snippet com Consent Mode v2~~ ✔: `js/consent.js` + o script do AdSense no `<head>` de `index.html` e das 11 páginas estáticas, `ADSENSE_CLIENT_ID` preenchido, `ads.js` reescrito. **`AD_SLOT_INICIO`/`AD_SLOT_GUIA` continuam vazios de propósito** — unidade de anúncio só existe depois da aprovação, e hoje o site carrega o código sem exibir anúncio (o estado certo pra revisão).
  4. **→ AGORA, do usuário: no painel do AdSense, "Pedir revisão".** No painel, deixar **Anúncios automáticos DESLIGADOS** (senão o Google insere anúncio onde quiser, inclusive junto dos botões de batalha = clique acidental = tráfego inválido = banimento).
  5. Depois de aprovado: criar as unidades de anúncio e preencher `AD_SLOT_GUIA` (páginas de conteúdo) e `AD_SLOT_INICIO` (fim da tela inicial) — o código já desenha sozinho; **CMP certificada** ("Privacidade e mensagens" do próprio AdSense, grátis) e **remover o banner caseiro**; fontes locais (GDPR).

## Ideias soltas (nunca pedidas)

Mais missões por tipo/zona · recompensa de Alfa diferente por rota · rank/título de explorador · resumo de badges já calculado no perfil de amigo.

## Decisões fechadas que continuam valendo

XP por Gen fica canônico (Paldea dá mais que Kanto — é dado da franquia). Formas de Hisui no Santuário de Galar (é como a PokéAPI classifica). Teto de aliados **continua em 2** (o Esconderijo já resolve "guardar mais parceiros"; subir mudaria o balanceamento). Painel de manutenção **continua** (jogo em ajuste ativo). Só iniciais na criação em todos os modos (`especiesLivres` false).
