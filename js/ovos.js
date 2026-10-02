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

   O que ficou de fora de propósito:
     - **grupos-ovo** (`egg_groups`): o par só exige gênero oposto (`regras.generoOposto`), então um Pikachu cruza com
       um Gyarados. Decisão do usuário — a regra de gênero já existe e já é testada, e grupos-ovo custariam um campo
       novo no cache e um `VERSAO_DOWNLOAD` só pra proibir pares esquisitos;
     - Ditto, Incenso, Chaveiro Oval, Poké Pensão: nada disso existe aqui;
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

/* O par: gênero oposto, e só. `generoOposto` já responde `false` pra quem não tem gênero e pra save antigo (onde
   `genero` não existe), então esses simplesmente nunca cruzam em vez de chutar um sexo. A mãe é quem define a
   espécie do filhote. Varredura de todos contra todos: com os 30 do esconderijo dá 435 comparações, não vale índice. */
export function acharPar(lista, sorte = Math.random) {
  const pares = [];
  for (let i = 0; i < lista.length; i++)
    for (let j = i + 1; j < lista.length; j++)
      if (generoOposto(lista[i], lista[j])) pares.push([lista[i], lista[j]]);
  if (!pares.length) return null;
  const [a, b] = pares[Math.floor(sorte() * pares.length)];
  return a.genero === 'f' ? { mae: a, pai: b } : { mae: b, pai: a };
}

// Tem casal, tem vaga e deu a sorte? Devolve { mae, pai } — quem busca a espécie base e monta o ovo é quem tem rede.
export function tentarCruzar(S, guardados, sorte = Math.random) {
  if (ovos(S).length >= MAX_OVOS || sorte() >= CHANCE_OVO) return null;
  return acharPar(guardados, sorte);
}

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
