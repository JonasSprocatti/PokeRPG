/* ============ esconderijo (os aliados que não estão em campo) ============
   Até aqui, achar um aliado novo com a equipe cheia era uma escolha DEFINITIVA: alguém se despedia pra sempre.
   Isso fazia encontrar um Pokémon interessante no fim da run virar má notícia — você já tinha investido nível
   nos que estavam com você, e o novo quase sempre perdia por ser mais fraco na hora, não por ser pior.

   O esconderijo é um lugar onde os aliados esperam: `S.escondidos`. Quem está lá não luta, não ganha XP e não
   aparece em campo — só espera. Trocar é livre e reversível, fora de batalha.

   O que ele NÃO muda de propósito: `MAX_ALIADOS` continua sendo quantos andam com você. A decisão tática de
   "quem leva pra próxima rota" continua existindo; o que deixa de existir é a perda permanente.

   Puro (sem DOM, sem rede): recebe o save e devolve o save mexido. Testado em tests/esconderijo.test.js. */
import { MAX_ALIADOS } from './regras.js';

// quantos cabem esperando. Alto de propósito: o limite que importa é o da EQUIPE, não o do depósito.
export const MAX_ESCONDIDOS = 30;

/* `S.escondidos ||= []` com S garantido: **`S?.escondidos ||= []` é erro de SINTAXE** — optional chaining não
   pode ser alvo de atribuição. O arquivo inteiro deixa de parsear, e com ele todo mundo que o importa: a tela
   fica branca e o console acusa num arquivo só, sem dizer que o culpado é este. */
export function escondidos(S) {
  if (!S) return [];
  return (S.escondidos ||= []);
}
export const equipeCheia = S => (S?.aliados || []).length >= MAX_ALIADOS;
export const esconderijoCheio = S => escondidos(S).length >= MAX_ESCONDIDOS;

/* Manda um aliado da equipe pro esconderijo. Devolve o Pokémon guardado, ou null se não deu.
   O `vol` (estado volátil de batalha: estágios, recuo, proteção) é zerado ao guardar — quem volta entra
   descansado, e não com o Ataque -2 de uma luta de três rotas atrás. */
export function guardar(S, indice, freshVol) {
  const A = S?.aliados?.[indice];
  if (!A || esconderijoCheio(S)) return null;
  S.aliados.splice(indice, 1);
  if (freshVol) A.vol = freshVol();
  escondidos(S).push(A);
  return A;
}

/* Traz um do esconderijo pra equipe. Só com vaga — quem quer trocar guarda alguém antes, e é justamente essa
   escolha que mantém a decisão tática de pé. */
export function trazer(S, indice, freshVol) {
  const lista = escondidos(S), A = lista[indice];
  if (!A || equipeCheia(S)) return null;
  lista.splice(indice, 1);
  if (freshVol) A.vol = freshVol();
  (S.aliados ||= []).push(A);
  return A;
}

/* Troca direta: guarda um da equipe e traz um do esconderijo, na mesma ação. Existe porque com a equipe cheia
   (o caso comum) a troca em dois passos falharia no meio — `trazer` recusaria por falta de vaga. */
export function trocar(S, iEquipe, iEscondido, freshVol) {
  const sai = S?.aliados?.[iEquipe], entra = escondidos(S)[iEscondido];
  if (!sai || !entra) return null;
  guardar(S, iEquipe, freshVol);
  // depois de guardar, a vaga existe; o índice do escondido mudou porque o que saiu foi pro fim da lista
  const i = escondidos(S).indexOf(entra);
  trazer(S, i, freshVol);
  return { sai, entra };
}

/* Recrutar com tudo cheio: em vez de "alguém se despede pra sempre", o novo pode ir direto pro esconderijo.
   Devolve onde ele coube: 'equipe' | 'esconderijo' | null (nem um nem outro). */
export function acolher(S, A, freshVol) {
  if (!A) return null;
  if (!equipeCheia(S)) { (S.aliados ||= []).push(A); return 'equipe'; }
  if (!esconderijoCheio(S)) { if (freshVol) A.vol = freshVol(); escondidos(S).push(A); return 'esconderijo'; }
  return null;
}
