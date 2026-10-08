/* ============ ovos (criação no esconderijo) ============
   Quem espera no esconderijo (esconderijo.js) não lutava, não ganhava XP e não fazia nada: era um depósito. Agora um
   casal guardado lá pode deixar um OVO, e o ovo choca andando — as suas explorações contam os passos, e o RELÓGIO
   também: um minuto fora do jogo vale um passo (`andarNoTempo`), então ele avança enquanto você não está jogando.

   O que o ovo é de propósito: um SEGREDO. O jogador vê "🥚 Ovo misterioso · 37/200 explorações" e nada mais; a
   espécie, o golpe herdado e o brilho só aparecem quando ele abre. É o que faz valer a pena chocar o próximo.

   Fiel aos jogos onde dá de graça:
     - o filhote é a FORMA BASE da mãe (a raiz da árvore de evolução, que já está em cache), e na forma REGIONAL
       deste mapa se a mãe for regional (`mapas.formaRegionalDaGen`: a Sandslash de Alola põe Sandshrew de Alola);
     - nasce no Nv. 5;
     - herda um golpe do parceiro e 3 IVs (o melhor dos dois pais em cada um dos 3 sorteados) — 5 com o Nó do
       Destino, e a natureza de quem segura a Pedra Eterna;
     - pode nascer com um **golpe-ovo** da própria espécie (`golpeOvo`);
     - **Ditto** cruza com quase todo mundo, e quem não tem gênero só cruza com ele (`parCompativel`);
     - espécie demorada demora mais pra chocar (`hatch_counter` da PokéAPI, ver `passosParaChocar`).

   O par é **gênero oposto + um grupo-ovo em comum** (`eggGroups` da PokéAPI), como nos jogos. A primeira versão era
   só o gênero, e o usuário voltou atrás no dia seguinte: Pikachu cruzando com Gyarados "prejudicou mesmo".

   O que ficou de fora de propósito:
     - Incenso (filhote bebê: Munchlax em vez de Snorlax), Chaveiro Oval (dobra a chance de ovo) e Poké Pensão:
       nada disso existe aqui — o ninho é o esconderijo e a chance é fixa (`CHANCE_OVO`);
     - **Masuda Method** (cruzar entre idiomas pra subir a chance de shiny): não há "idioma do cartucho" aqui, então
       ovo tem a mesma 1/4096 de qualquer selvagem;
     - **Power Items** (garantir QUAL stat é herdado): os IVs herdados continuam sorteados — o Nó do Destino sobe
       quantos, nunca escolhe quais.

   Puro (sem DOM, sem rede): recebe o save e devolve o save mexido. Testado em tests/ovos.test.js.
   Quem fala com a rede e narra é `amizade.cuidarDosOvos`. */
import { STATS } from './dados.js';
import { generoOposto } from './regras.js';

export const MAX_OVOS = 3;              // quantos chocam ao mesmo tempo (pedido do usuário)
export const CHANCE_OVO = 0.05;         // chance, por exploração, de um casal guardado deixar um ovo
export const NIVEL_CHOCAR = 5;          // o filhote nasce no Nv. 5, como nos jogos
export const IVS_HERDADOS = 3;          // quantos IVs vêm dos pais (o resto é sorteado como em qualquer Pokémon)
export const IVS_COM_NO = 5;            // …e quantos com o Nó do Destino na mão de um dos pais, como nos jogos
/* Os dois itens de CRIAÇÃO (dados.ITENS_CRIACAO). Eles não têm linha em `segurados.SEGURADOS` de propósito — não
   fazem NADA em batalha —, então aqui a leitura é de IDENTIDADE do item (`m.item`), não de efeito: `seg(m)` é a
   porta única do efeito de item, e para estes dois ela devolveria `{}`. Toda comparação passa por `segura`. */
export const ITEM_NATUREZA = 'everstone', ITEM_IVS = 'destiny-knot';
const segura = (m, id) => m?.item === id;

/* Passos = EXPLORAÇÕES. O mínimo é 100 porque uma rota inteira costuma passar bem disso (pedido do usuário), e as
   categorias de ovo dos jogos entram pelo `hatch_counter` da espécie (api.loadSpecies): Magikarp tem 5 ciclos,
   Dratini e Beldum 40, lendário 120. Aqui isso vira 100 · 200 · 400 explorações.
   `CICLOS_PADRAO` é o que vale quando o dado não veio (quem baixou o mapa pra jogar offline antes deste campo
   existir): cai no piso de 100, nunca trava o ovo. */
export const CICLOS_PADRAO = 20, PASSOS_MIN = 100, PASSOS_MAX = 400;
export const passosParaChocar = ciclos => Math.max(PASSOS_MIN, Math.min(PASSOS_MAX, Math.round((ciclos || CICLOS_PADRAO) * 5)));

/* ---- e o ovo também anda com o RELÓGIO (pedido do usuário, 08/10/2026) ----
   **Um minuto de relógio = um passo**, contados desde o último crédito (`ovo.em`), esteja o jogo aberto ou não. O
   ovo passa a chocar sozinho: 100 passos = 1h40, o teto de 400 = 6h40. As explorações continuam valendo e SOMAM —
   quem está jogando choca antes.

   Por que um marco POR OVO e não um `S.ovosEm` global: ovo posto agora não pode receber crédito pelas três horas
   em que o jogador esteve fora antes de ele existir.
   O marco anda em múltiplos de `MS_POR_PASSO` (`em += n * MS_POR_PASSO`, nunca `em = agora`), senão os segundos
   quebrados são jogados fora a cada crédito e um ovo creditado de 30 em 30 s nunca andaria.
   Relógio pra TRÁS (fuso, correção de hora) dá `n` negativo e é ignorado — ovo não desanda. */
export const MS_POR_PASSO = 60 * 1000;
export function andarNoTempo(S, agora = Date.now()) {
  const lista = ovos(S);
  for (const o of lista) {
    if (!o.em) { o.em = agora; continue; }   // ovo de save antigo: começa a contar daqui, sem crédito retroativo
    const n = Math.floor((agora - o.em) / MS_POR_PASSO);
    if (n <= 0) continue;
    o.em += n * MS_POR_PASSO;
    o.passos = Math.min(o.alvo, (o.passos || 0) + n);
  }
  return lista.filter(o => o.passos >= o.alvo);
}

// ciclos dos ovos que as badges dão (badges.js): sem rede na criação da jornada, então o número é fixo aqui
export const CICLOS_PSEUDO = 40, CICLOS_LENDARIO = 120;

export function ovos(S) {
  if (!S) return [];
  return (S.ovos ||= []);
}

/* O grupo-ovo de quem não cruza com ninguém (lendário, mítico, bebê). Nome da PokéAPI. */
export const GRUPO_SEM_OVO = 'no-eggs';
/* O Ditto tem um grupo-ovo só dele, e é assim que o reconhecemos — pelo DADO da PokéAPI, nunca pelo nome da
   espécie. (Se um dia outra espécie entrar no grupo `ditto`, ela cruza igual, que é o certo.) */
export const GRUPO_DITTO = 'ditto';
export const ehDitto = (m, grupos) => (grupos?.get?.(m?.data?.speciesName) || []).includes(GRUPO_DITTO);
// ponytail: o `grupos` é montado a cada tentativa (1 em 20 explorações) em vez de guardado no save — são ~30 leituras
// de um cache em memória. Se um dia pesar, o lugar de guardar é `mon.grupos` no `makeMon`, com fallback pra busca.

/* O par: **gênero oposto + um grupo-ovo em comum**, como nos jogos.
   `generoOposto` já responde `false` pra quem não tem gênero e pra save antigo (onde `genero` não existe), então
   esses nunca cruzam em vez de chutar um sexo. Os grupos vêm de FORA (`grupos`: nome da espécie → lista de grupos,
   montada por quem tem rede, de `api.loadSpecies`): este módulo não busca nada.
   **Grupo desconhecido não cruza.** É o contrário do que o resto do jogo faz com dado que falta (lá a regra mais
   calada é a que vale), e é de propósito: sem o dado, o certo é não aparecer ovo, não aparecer ovo errado — e quem
   baixou o mapa antes do campo existir é justamente quem o `VERSAO_DOWNLOAD` manda baixar de novo. */
export function parCompativel(a, b, grupos) {
  const ga = grupos?.get?.(a?.data?.speciesName) || [], gb = grupos?.get?.(b?.data?.speciesName) || [];
  if (!ga.length || !gb.length) return false;
  if (ga.includes(GRUPO_SEM_OVO) || gb.includes(GRUPO_SEM_OVO)) return false;
  /* **Ditto**, como nos jogos: cruza com qualquer um que ponha ovo, sem olhar gênero nem grupo, e é o ÚNICO par de
     quem não tem gênero (Magnemite, Voltorb, Beldum, Klink…). Dois Dittos não dão nada. É a regra que resolve o
     "sem-sexo não cruza com ninguém" sem inventar um gênero pra quem não tem: a espécie vem do OUTRO (`acharPar`). */
  const da = ga.includes(GRUPO_DITTO), db = gb.includes(GRUPO_DITTO);
  if (da || db) return !(da && db);
  if (!generoOposto(a, b)) return false;
  return ga.some(g => gb.includes(g));
}

/* ---- o que a TELA diz sobre o ninho ----
   O jogador perguntou "os ovos estão funcionando? não vi nenhum até agora" (06/10/2026) — e estavam, desde
   sempre. O problema era que NADA na tela contava a regra: o esconderijo só falava em "esperar aqui", e o bloco de
   ovos só aparecia DEPOIS de já existir um ovo. Quem joga não tinha como descobrir que o ninho é o esconderijo
   (não a equipe), nem que precisa de gênero oposto e de um grupo-ovo em comum.
   Mecânica sem porta de entrada na tela é mecânica que não existe. Daí esta função: devolve o ESTADO do ninho, com
   `status` pra tela escolher a frase e `casal` pra ela nomear quem está pronto.
   Pura e sem rede: `grupos` vem de fora (a tela lê do cache, síncrono), e grupo que FALTA vira `desconhecido` em
   vez de "não cruza" — na tela, "ainda não sei" e "não dá" são frases diferentes. */
export function situacaoDoNinho(guardados = [], grupos, quantosOvos = 0) {
  const n = guardados.length;
  if (quantosOvos >= MAX_OVOS) return { status: 'ninho-cheio', casal: null };
  if (n === 0) return { status: 'vazio', casal: null };
  if (n === 1) return { status: 'sozinho', casal: null };
  const pares = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (parCompativel(guardados[i], guardados[j], grupos)) pares.push([guardados[i], guardados[j]]);
  if (pares.length) {
    const [a, b] = pares[0];
    // com Ditto o "casal" é Ditto + o outro; quem aparece primeiro é quem dá a espécie, como em `acharPar`
    if (ehDitto(a, grupos) || ehDitto(b, grupos)) return { status: 'pronto', casal: ehDitto(a, grupos) ? [b, a] : [a, b], quantos: pares.length };
    return { status: 'pronto', casal: a.genero === 'f' ? [a, b] : [b, a], quantos: pares.length };
  }
  // sem par: a tela precisa distinguir "não dá" de "o jogo ainda não sabe" (ficha de espécie fora do cache)
  if (guardados.some(m => !(grupos?.get?.(m?.data?.speciesName) || []).length)) return { status: 'desconhecido', casal: null };
  if (guardados.every(m => m.genero && m.genero === guardados[0].genero)) return { status: 'mesmo-sexo', casal: null };
  if (guardados.some(m => !m.genero)) return { status: 'sem-sexo', casal: null };
  return { status: 'grupos-diferentes', casal: null };
}

/* Varredura de todos contra todos: com os 30 do esconderijo dá 435 comparações, não vale índice nenhum.
   A mãe é quem define a espécie do filhote. */
export function acharPar(lista, grupos, sorte = Math.random) {
  const pares = [];
  for (let i = 0; i < lista.length; i++)
    for (let j = i + 1; j < lista.length; j++)
      if (parCompativel(lista[i], lista[j], grupos)) pares.push([lista[i], lista[j]]);
  if (!pares.length) return null;
  const [a, b] = pares[Math.floor(sorte() * pares.length)];
  /* Com Ditto, quem dá a espécie é o OUTRO — o Ditto nunca é "mãe", mesmo sendo o parceiro. `ditto: true` avisa
     quem chama que o golpe herdado também tem de vir do outro lado: o Ditto só sabe Transform. */
  if (ehDitto(a, grupos)) return { mae: b, pai: a, ditto: true };
  if (ehDitto(b, grupos)) return { mae: a, pai: b, ditto: true };
  return a.genero === 'f' ? { mae: a, pai: b } : { mae: b, pai: a };
}

/* Tem vaga no ninho e deu a sorte? Separado de `acharPar` de propósito: saber os grupos-ovo exige buscar a ficha de
   espécie de cada um do esconderijo (até 30), e isso só vale a pena DEPOIS que o sorteio passou — 1 exploração em 20
   em vez de todas. Quem chama monta os grupos e busca a espécie base só então. */
export const podeCruzar = (S, sorte = Math.random) => ovos(S).length < MAX_OVOS && sorte() < CHANCE_OVO;

/* Quantos IVs vêm dos pais: 3, ou **5 com o Nó do Destino** na mão de QUALQUER um dos dois (como nos jogos — não
   acumula se os dois segurarem). Ele sobe quantos, nunca escolhe quais: os Power Items não existem aqui. */
export const quantosIvsHerdados = (mae, pai) => segura(mae, ITEM_IVS) || segura(pai, ITEM_IVS) ? IVS_COM_NO : IVS_HERDADOS;

/* A natureza do filhote: a de quem segura a **Pedra Eterna**, e `null` (= sorteio normal de 25) se ninguém segura.
   Os dois segurando = sorteia entre as duas naturezas, que é o que os jogos fazem desde a Gen 5. */
export function naturezaHerdada(mae, pai, sorte = Math.random) {
  const com = [mae, pai].filter(m => segura(m, ITEM_NATUREZA) && m.nature);
  return com.length ? com[Math.floor(sorte() * com.length)].nature : null;
}

/* Os 6 IVs do filhote: `quantosIvsHerdados` sorteados ficam com o MELHOR dos dois pais, o resto é sorteio normal. */
export function ivsHerdados(mae, pai, sorte = Math.random) {
  const restantes = [...STATS], out = {}, quantos = quantosIvsHerdados(mae, pai);
  for (let n = 0; n < quantos && restantes.length; n++) {
    const [s] = restantes.splice(Math.floor(sorte() * restantes.length), 1);
    out[s] = Math.max(mae?.ivs?.[s] ?? 0, pai?.ivs?.[s] ?? 0);
  }
  for (const s of restantes) out[s] = Math.floor(sorte() * 32);
  return out;
}

// um dos 4 golpes do parceiro, sorteado na hora de pôr o ovo (os pais podem nem estar mais na jornada quando ele
// abrir). Com Ditto o parceiro é o OUTRO (`acharPar` devolve `ditto: true`): o Ditto só sabe Transform.
export function golpeHerdado(pai, sorte = Math.random) {
  const lista = (pai?.moves || []).filter(Boolean);
  return lista.length ? lista[Math.floor(sorte() * lista.length)] : null;
}

/* 🥚 **Golpe-ovo**: cada espécie tem uma lista de golpes que só se aprendem nascendo, e a PokéAPI já entrega essa
   lista em `learnset.extras` (`metodo: 'egg'`) — o mesmo campo que o Disco Técnico usa, então ela JÁ está em cache
   pra toda espécie, sem busca nova. `eggMoves` são essas entradas ({name, url}) e `golpesDosPais` são os nomes dos
   golpes que os dois pais sabiam quando o ovo foi posto.

   A regra dos jogos é "o filhote nasce com o golpe-ovo que um dos PAIS já sabe". Ela vale aqui e vem primeiro —
   mas, sozinha, ela quase nunca dispararia: os pais daqui são selvagens recrutados, e o moveset de um selvagem são
   os 4 golpes mais recentes POR NÍVEL, que por definição não incluem golpe-ovo. Nos jogos quem põe um golpe-ovo
   num pai é outra criação (ou a Erva Espelho), e nada disso existe aqui. Daí o segundo caminho, de casa: sem pai
   que saiba, sorteia um da lista com chance `CHANCE_GOLPE_OVO`.
   // ponytail: `CHANCE_GOLPE_OVO = 0` desliga o caminho de casa e deixa só a regra dos jogos, num lugar só. */
export const CHANCE_GOLPE_OVO = 0.5;
export function golpeOvo(eggMoves = [], golpesDosPais = [], sorte = Math.random) {
  const lista = (eggMoves || []).filter(e => e?.name && e?.url);
  if (!lista.length) return null;
  const doPai = lista.filter(e => golpesDosPais.includes(e.name));
  if (doPai.length) return doPai[Math.floor(sorte() * doPai.length)];
  return sorte() < CHANCE_GOLPE_OVO ? lista[Math.floor(sorte() * lista.length)] : null;
}

/* O ovo guardado no save. `especie` é o NOME da espécie (ou da FORMA regional) que vai nascer — fica aqui e não
   aparece em tela nenhuma até chocar. `de` são os nomes dos pais, só pra narrar o nascimento.
   `nature` = a natureza da Pedra Eterna (null = sorteio normal) · `pais` = os nomes dos golpes que os dois sabiam,
   pro `golpeOvo` conferir na hora de chocar (os pais podem ter sido despedidos até lá). */
export function criarOvo({ especie, ciclos, ivs = null, nature = null, golpe = null, pais = null, de = null, badge = null, agora = Date.now() }) {
  return { especie, alvo: passosParaChocar(ciclos), passos: 0, em: agora, ivs, nature, golpe, pais, de, badge };
}

// ovo que uma badge dá no começo da jornada (badges.js `recompensa.ovo`). A lista de espécies vem de fora: este
// módulo não conhece mapa nem Pokédex.
export function ovoDeBadge(tipo, especies, sorte = Math.random) {
  if (!especies?.length) return null;
  return criarOvo({ especie: especies[Math.floor(sorte() * especies.length)], ciclos: tipo === 'lendario' ? CICLOS_LENDARIO : CICLOS_PSEUDO, badge: tipo });
}

/* Uma exploração: todo ovo anda um passo. Devolve os que já estão PRONTOS (quem chama tenta chocar).
   `passos` nunca passa de `alvo` — o ovo pronto que não tem onde nascer (equipe e esconderijo lotados) espera
   parado em vez de inflar a barra pra sempre. */
export function andarOvos(S, n = 1) {
  const lista = ovos(S);
  for (const o of lista) o.passos = Math.min(o.alvo, (o.passos || 0) + n);
  return lista.filter(o => o.passos >= o.alvo);
}

export function tirarOvo(S, ovo) {
  const lista = ovos(S), i = lista.indexOf(ovo);
  if (i >= 0) lista.splice(i, 1);
  return i >= 0;
}
