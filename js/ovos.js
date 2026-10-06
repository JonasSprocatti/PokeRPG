/* ============ ovos (criação no esconderijo) ============
   Quem espera no esconderijo (esconderijo.js) não lutava, não ganhava XP e não fazia nada: era um depósito. Agora um
   casal guardado lá pode deixar um OVO, e o ovo choca andando — as suas explorações é que contam os passos.

   O que o ovo é de propósito: um SEGREDO. O jogador vê "🥚 Ovo misterioso · 37/200 explorações" e nada mais; a
   espécie, o golpe herdado e o brilho só aparecem quando ele abre. É o que faz valer a pena chocar o próximo.

   Fiel aos jogos onde dá de graça:
     - o filhote é a FORMA BASE da mãe (a raiz da árvore de evolução, que já está em cache), não a forma dela;
     - nasce no Nv. 5;
     - herda um golpe do pai e 3 IVs (o melhor dos dois pais em cada um dos 3 sorteados);
     - espécie demorada demora mais pra chocar (`hatch_counter` da PokéAPI, ver `passosParaChocar`).

   O par é **gênero oposto + um grupo-ovo em comum** (`eggGroups` da PokéAPI), como nos jogos. A primeira versão era
   só o gênero, e o usuário voltou atrás no dia seguinte: Pikachu cruzando com Gyarados "prejudicou mesmo".

   O que ficou de fora de propósito:
     - **Ditto**: nos jogos ele cruza com quase todo mundo. Aqui não, e de graça — ele não tem gênero, então a regra
       de gênero oposto já o deixa de fora sem uma linha de código. Entraria como exceção, se alguém pedir;
     - Incenso, Chaveiro Oval, Poké Pensão: nada disso existe aqui;
     - lista de golpes-ovo legais: o golpe herdado é QUALQUER um dos 4 do pai.
       // ponytail: sem allowlist de golpe-ovo, um filhote Nv. 5 pode nascer com Hyper Beam. Se virar problema de
       // equilíbrio, filtrar por `golpe.power <= X` aqui em `golpeHerdado` resolve num lugar só.

   Puro (sem DOM, sem rede): recebe o save e devolve o save mexido. Testado em tests/ovos.test.js.
   Quem fala com a rede e narra é `amizade.cuidarDosOvos`. */
import { STATS } from './dados.js';
import { generoOposto } from './regras.js';

export const MAX_OVOS = 3;              // quantos chocam ao mesmo tempo (pedido do usuário)
export const CHANCE_OVO = 0.05;         // chance, por exploração, de um casal guardado deixar um ovo
export const NIVEL_CHOCAR = 5;          // o filhote nasce no Nv. 5, como nos jogos
export const IVS_HERDADOS = 3;          // quantos IVs vêm dos pais (o resto é sorteado como em qualquer Pokémon)

/* Passos = EXPLORAÇÕES. O mínimo é 100 porque uma rota inteira costuma passar bem disso (pedido do usuário), e as
   categorias de ovo dos jogos entram pelo `hatch_counter` da espécie (api.loadSpecies): Magikarp tem 5 ciclos,
   Dratini e Beldum 40, lendário 120. Aqui isso vira 100 · 200 · 400 explorações.
   `CICLOS_PADRAO` é o que vale quando o dado não veio (quem baixou o mapa pra jogar offline antes deste campo
   existir): cai no piso de 100, nunca trava o ovo. */
export const CICLOS_PADRAO = 20, PASSOS_MIN = 100, PASSOS_MAX = 400;
export const passosParaChocar = ciclos => Math.max(PASSOS_MIN, Math.min(PASSOS_MAX, Math.round((ciclos || CICLOS_PADRAO) * 5)));

// ciclos dos ovos que as badges dão (badges.js): sem rede na criação da jornada, então o número é fixo aqui
export const CICLOS_PSEUDO = 40, CICLOS_LENDARIO = 120;

export function ovos(S) {
  if (!S) return [];
  return (S.ovos ||= []);
}

/* O grupo-ovo de quem não cruza com ninguém (lendário, mítico, bebê, Ditto está em `ditto`). Nome da PokéAPI. */
export const GRUPO_SEM_OVO = 'no-eggs';
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
  if (!generoOposto(a, b)) return false;
  const ga = grupos?.get?.(a?.data?.speciesName) || [], gb = grupos?.get?.(b?.data?.speciesName) || [];
  if (!ga.length || !gb.length) return false;
  if (ga.includes(GRUPO_SEM_OVO) || gb.includes(GRUPO_SEM_OVO)) return false;
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
  return a.genero === 'f' ? { mae: a, pai: b } : { mae: b, pai: a };
}

/* Tem vaga no ninho e deu a sorte? Separado de `acharPar` de propósito: saber os grupos-ovo exige buscar a ficha de
   espécie de cada um do esconderijo (até 30), e isso só vale a pena DEPOIS que o sorteio passou — 1 exploração em 20
   em vez de todas. Quem chama monta os grupos e busca a espécie base só então. */
export const podeCruzar = (S, sorte = Math.random) => ovos(S).length < MAX_OVOS && sorte() < CHANCE_OVO;

/* Os 6 IVs do filhote: `IVS_HERDADOS` sorteados ficam com o MELHOR dos dois pais, o resto é sorteio normal.
   É a simplificação da regra dos jogos (3 IVs herdados, com Destiny Knot subindo pra 5) sem os itens. */
export function ivsHerdados(mae, pai, sorte = Math.random) {
  const restantes = [...STATS], out = {};
  for (let n = 0; n < IVS_HERDADOS && restantes.length; n++) {
    const [s] = restantes.splice(Math.floor(sorte() * restantes.length), 1);
    out[s] = Math.max(mae?.ivs?.[s] ?? 0, pai?.ivs?.[s] ?? 0);
  }
  for (const s of restantes) out[s] = Math.floor(sorte() * 32);
  return out;
}

// um dos 4 golpes do pai, sorteado na hora de pôr o ovo (os pais podem nem estar mais na jornada quando ele abrir)
export function golpeHerdado(pai, sorte = Math.random) {
  const lista = (pai?.moves || []).filter(Boolean);
  return lista.length ? lista[Math.floor(sorte() * lista.length)] : null;
}

/* O ovo guardado no save. `especie` é o NOME da espécie que vai nascer — fica aqui e não aparece em tela nenhuma
   até chocar. `de` são os nomes dos pais, só pra narrar o nascimento. */
export function criarOvo({ especie, ciclos, ivs = null, golpe = null, de = null, badge = null }) {
  return { especie, alvo: passosParaChocar(ciclos), passos: 0, ivs, golpe, de, badge };
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
