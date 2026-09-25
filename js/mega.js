/* ============ Mega Evolução (e Reversão Primitiva) ============
   Conquista de CONTA (conquistas.js: 1.000 golpes finais dados sendo aquela espécie, e só na evolução final),
   usada DENTRO da batalha. Regras fechadas com o usuário:
     - só VOCÊ megaevolui; aliado nunca, mesmo que a espécie dele esteja liberada;
     - uma por batalha, e não gasta o turno (você megaevolui e ataca no mesmo turno);
     - o inimigo também pode, mas só Alfa, lendário e treinador — e só quando cai a metade do HP;
     - Groudon e Kyogre entram na mesma mecânica, com o nome de Reversão Primitiva;
     - dura até o fim da batalha e desfaz sozinho (batalha.endBattle).

   A forma é um Pokémon como outro qualquer na API (`charizard-mega-x`), então a troca é: buscar os dados dela,
   pôr em `M.data`, recalcular e guardar o que estava antes pra poder voltar. Mesma ideia da Mudança de Postura
   do Aegislash (golpe.trocarPostura), com uma diferença importante: lá os números são espelhados e dá pra fazer
   sem rede; aqui os dados vêm da API, então são PRÉ-CARREGADOS no começo da batalha — esperar requisição no meio
   do turno é justamente o que o Aegislash evitou. */
import { megasDe, temMega } from './dados-megas.js';
import { ITEM_PEDRA_MEGA } from './dados.js';
import { loadPokemon } from './api.js';
import { recalc } from './regras.js';
import { G } from './estado.js';
import { megaDaContaLiberada } from './carreira.js';

// quem pode megaevoluir do lado inimigo: as lutas que já são o pico da dificuldade (decisão do usuário)
export const inimigoPodeMega = B => !!(B?.chefe || B?.lendarios || B?.trainer);
/* A Mega do inimigo só aparece de nível 40 em diante: um treinador das primeiras rotas megaevoluindo era forte demais
   (decisão do usuário). As outras viradas do inimigo (Tera…) NÃO têm esse piso — são `inimigoPodeMega` e mais nada. */
export const NIVEL_MEGA_INIMIGO = 40;
export const inimigoMegaLiberada = E => (E?.level || 0) >= NIVEL_MEGA_INIMIGO;
/* Tera e Gigantamax do inimigo só aparecem em rotas de nível 30+ (decisão do usuário): o nível do inimigo é o da rota,
   então o piso é o nível DELE. Abaixo disso a luta segue sem virada (a Mega tem o piso próprio de 40, acima). */
export const NIVEL_TERA_GMAX_INIMIGO = 30;
export const inimigoTeraGmaxLiberado = E => (E?.level || 0) >= NIVEL_TERA_GMAX_INIMIGO;
// o inimigo vira quando cai a metade do HP: é a "segunda fase" da luta, não um susto no primeiro turno
export const HP_MEGA_INIMIGO = 0.5;

/* Pré-carrega as formas de quem pode megaevoluir nesta batalha. Chamado no começo, sem travar nada: se a rede
   falhar, `megaevoluir` simplesmente não encontra a forma e avisa — a batalha continua. */
export async function preCarregarMegas(lista) {
  const formas = lista.filter(Boolean).flatMap(m => megasDe(m.data?.speciesName));
  await Promise.all(formas.map(f => loadPokemon(f.forma).catch(() => null)));
}

/* Já dá pra megaevoluir? Devolve a lista de formas (vazia = não dá). `liberada(especie)` vem de fora
   (conquistas.megaLiberada) pra este módulo não depender do progresso da conta. */
/* As formas que VOCÊ pode usar agora. Mora aqui (e não em batalha.js) porque quem pergunta são os dois lados —
   o render, pra decidir se desenha o botão, e a batalha, pra executar — e `render.js` não pode importar
   `batalha.js` (batalha já importa render: daria import circular).
   Barata de propósito: só tabela e progresso da conta, nada de rede. */
export const megasDoJogador = () => !G.B ? [] : megasDisponiveis(G.S.player, {
  jaUsou: !!G.B.megaUsada,
  liberada: e => megaDaContaLiberada(e, G.S.registro)
});
// o aviso do que falta (pedra / Dragon Ascent) pra tela mostrar em vez de simplesmente esconder o botão
export const avisoDaMegaDoJogador = () => !G.B || G.B.megaUsada ? ''
  : avisoDaMega(G.S.player, { liberada: e => megaDaContaLiberada(e, G.S.registro) });

/* Rayquaza não usa pedra: ele megaevolui por saber **Dragon Ascent** — é a regra dos jogos, e o usuário pediu
   que fosse respeitada. Qualquer outra espécie precisa da Pedra Mega SEGURADA (dados.ITEM_PEDRA_MEGA): ter a
   conquista libera a compra da pedra, não a Mega em si. */
export const GOLPE_RAYQUAZA = 'dragon-ascent';
export const ehRayquaza = especie => especie === 'rayquaza';
export function faltaPraMegaevoluir(M) {
  const especie = M?.data?.speciesName;
  if (ehRayquaza(especie)) {
    return (M.moves || []).some(g => g.name === GOLPE_RAYQUAZA) ? null : 'precisa saber Dragon Ascent';
  }
  return M?.item === ITEM_PEDRA_MEGA ? null : 'precisa segurar a Pedra Mega';
}

/* `ignorarPedra` existe pro lado INIMIGO: um Alfa não anda com uma Pedra Mega no inventário (ele nem tem
   inventário), e exigir isso dele faria a segunda fase da luta simplesmente nunca acontecer. A pedra é uma
   regra do SEU lado — é o custo de usar a mecânica, e é o que a loja vende. */
export function megasDisponiveis(M, { jaUsou, liberada, ignorarPedra = false }) {
  if (jaUsou || M?.mega || !M?.data?.speciesName) return [];
  const especie = M.data.speciesName;
  if (!temMega(especie) || !liberada(especie)) return [];
  if (!ignorarPedra && faltaPraMegaevoluir(M)) return [];
  return megasDe(especie);
}
/* O que dizer pra quem conquistou a Mega e ainda não consegue usar. Sem isto, o botão simplesmente não aparece
   e a pessoa fica sem saber que falta a pedra — o pior tipo de "não funciona". */
export function avisoDaMega(M, { liberada }) {
  const especie = M?.data?.speciesName;
  if (!especie || !temMega(especie) || !liberada(especie)) return '';
  return faltaPraMegaevoluir(M) || '';
}

/* A troca em si. Guarda o que estava antes em `M.mega.antes` — é isso que `desfazerMega` usa pra devolver o
   Pokémon ao normal no fim da batalha. Devolve o nome da forma, ou null se os dados não vieram. */
export async function megaevoluir(M, forma) {
  let data;
  try { data = await loadPokemon(forma.forma); } catch { return null; }
  aplicarForma(M, forma, data);
  return data.name;
}
/* A troca em si, SEM rede (pura): `megaevoluir` busca os dados e chama isto; o co-op (mp-motor.js) chama direto,
   porque quem megaevolui lá manda os dados da forma junto da ação (o anfitrião não busca nada no meio do turno).
   `habilidade` opcional: a foto do co-op já traz a habilidade resolvida em vez da lista `abilities` da API. */
export function aplicarForma(M, forma, data, habilidade) {
  M.mega = { forma, antes: { id: M.id, name: M.name, data: M.data, ability: M.ability } };
  M.id = data.id; M.name = data.name; M.data = data;
  // toda forma Mega tem uma habilidade só, e ela é parte do que a Mega É (Mega Gengar sem Shadow Tag não é Mega)
  M.ability = habilidade || (data.abilities?.find(a => !a.hidden) || data.abilities?.[0])?.name || M.ability;
  recalc(M);   // preserva o dano já sofrido: só o teto sobe
  return M;
}

/* Volta ao normal. Chamada pra TODO mundo no fim da batalha — inclusive quem não megaevoluiu (aí não faz nada),
   porque é mais seguro varrer a equipe do que lembrar quem virou. Sem isto, o Pokémon ficaria Mega pra sempre:
   `M.data` é salvo junto com a ficha. */
export function desfazerMega(M) {
  if (!M?.mega) return null;
  const { antes, forma } = M.mega;
  M.id = antes.id; M.name = antes.name; M.data = antes.data; M.ability = antes.ability;
  delete M.mega;
  recalc(M);
  return forma;
}

// texto da mecânica: Groudon e Kyogre não "megaevoluem", eles fazem Reversão Primitiva
export const verboDaForma = f => f?.primal ? 'reverteu ao estado primitivo' : 'MEGAEVOLUIU';
export const nomeDaMecanica = f => f?.primal ? 'Reversão Primitiva' : 'Mega Evolução';
