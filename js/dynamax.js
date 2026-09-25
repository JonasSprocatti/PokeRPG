/* ============ Gigantamax ============
   A conquista mais longa do jogo (conquistas.js): chegar ao nível 50 com a espécie em 25 jornadas diferentes.
   Por isso ela é a única das quatro que **não pede item nenhum** — Mega pede a pedra, Z pede o cristal, e cobrar
   um terceiro item de quem levou 25 jornadas seria castigo, não desafio. (Nos jogos o Dynamax também não depende
   de item: depende do lugar.)

   O que faz: por TURNOS_DYNAMAX turnos, o HP máximo dobra (o atual dobra junto — você fica gigante, não fica
   curado pela metade) e todo golpe vira Max (regras.poderMax). Acaba sozinho, e o HP volta na MESMA proporção.

   Por que guardar `hpMaxAntes` em vez de recalcular no fim: `recalc` refaz os status a partir da base, e o dano
   sofrido enquanto gigante se perderia na conta. Guardando o teto antigo, a volta é uma regra de três — quem
   estava com 60% do HP gigante volta com 60% do HP normal. */
import { G } from './estado.js';
import { MULT_HP_DYNAMAX, TURNOS_DYNAMAX } from './regras.js';
import { conquistasDaConta } from './carreira.js';
import { gmaxLiberado } from './conquistas.js';

/* Do lado inimigo, SÓ o Pokémon de treinador gigantamaxa (decisão do usuário): Alfa, lendário e selvagem não. O
   treinador "Lendários de <região>" (rota final) também usa `B.trainer`, mas não é um treinador de verdade. */
export const inimigoPodeGmax = B => !!(B?.trainer && !B.lendarios && !B.evento);

// dá pra gigantamaxar agora? (uma vez por batalha, e só o jogador — igual às outras gimmicks)
export function podeGigantamax(M = G.S?.player) {
  const B = G.B;
  if (!B || B.gmaxUsado || !M || M.dyna) return false;
  const especie = M.data?.speciesName; if (!especie) return false;
  return gmaxLiberado(conquistasDaConta(G.S?.registro), especie);
}

export function gigantamaxar(M) {
  if (!M || M.dyna) return null;
  const hpMaxAntes = M.stats.hp;
  M.dyna = { turnos: TURNOS_DYNAMAX, hpMaxAntes };
  M.stats = { ...M.stats, hp: Math.floor(hpMaxAntes * MULT_HP_DYNAMAX) };
  M.hp = Math.min(M.stats.hp, Math.floor(M.hp * MULT_HP_DYNAMAX));
  return M.dyna;
}

/* Passa um turno. Devolve 'acabou' quando encolheu agora — é o gancho pra narrar.
   Chamado na virada da rodada; um gigante que não encolhe é um bug que só aparece na luta seguinte. */
export function passarDynamax(M) {
  if (!M?.dyna) return null;
  if (--M.dyna.turnos > 0) return 'segue';
  desfazerDynamax(M);
  return 'acabou';
}

/* Volta ao tamanho normal mantendo a PROPORÇÃO de vida. Chamada também no fim da batalha, pra toda a equipe:
   sem isso o Pokémon ficaria com o HP máximo dobrado pra sempre, porque `stats` vai junto no save. */
export function desfazerDynamax(M) {
  if (!M?.dyna) return null;
  const { hpMaxAntes } = M.dyna;
  const fracao = M.stats.hp ? M.hp / M.stats.hp : 1;
  delete M.dyna;
  M.stats = { ...M.stats, hp: hpMaxAntes };
  M.hp = Math.max(M.hp > 0 ? 1 : 0, Math.min(hpMaxAntes, Math.round(hpMaxAntes * fracao)));
  return true;
}
