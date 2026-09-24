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
import { loadPokemon } from './api.js';
import { recalc } from './regras.js';
import { G } from './estado.js';
import { megaDaContaLiberada } from './carreira.js';

// quem pode megaevoluir do lado inimigo: as lutas que já são o pico da dificuldade (decisão do usuário)
export const inimigoPodeMega = B => !!(B?.chefe || B?.lendarios || B?.trainer);
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

export function megasDisponiveis(M, { jaUsou, liberada }) {
  if (jaUsou || M?.mega || !M?.data?.speciesName) return [];
  const especie = M.data.speciesName;
  if (!temMega(especie) || !liberada(especie)) return [];
  return megasDe(especie);
}

/* A troca em si. Guarda o que estava antes em `M.mega.antes` — é isso que `desfazerMega` usa pra devolver o
   Pokémon ao normal no fim da batalha. Devolve o nome da forma, ou null se os dados não vieram. */
export async function megaevoluir(M, forma) {
  let data;
  try { data = await loadPokemon(forma.forma); } catch { return null; }
  M.mega = { forma, antes: { id: M.id, name: M.name, data: M.data, ability: M.ability } };
  M.id = data.id; M.name = data.name; M.data = data;
  // toda forma Mega tem uma habilidade só, e ela é parte do que a Mega É (Mega Gengar sem Shadow Tag não é Mega)
  M.ability = (data.abilities.find(a => !a.hidden) || data.abilities[0])?.name || M.ability;
  recalc(M);   // preserva o dano já sofrido: só o teto sobe
  return data.name;
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
