/* ============ Terastalização ============
   Conquista de CONTA por TIPO (conquistas.js: 200 derrotados daquele tipo liberam a Tera dele), usada dentro da
   batalha. Diferente da Mega, aqui a conquista não é uma espécie: é o TIPO — então você escolhe, na hora, entre
   os tipos que já conquistou. Quem derrotou 200 de Água pode virar Tera Água com qualquer Pokémon.

   O efeito mora nas regras puras (regras.tiposDefensivos / regras.multStab), não aqui: é lá que o dano é
   calculado, e deixar a conta num lugar só é o que permite testá-la sem simular batalha.

   Regras (as mesmas da Mega, por coerência): uma por batalha, NÃO gasta o turno, dura até o fim da batalha e
   desfaz sozinha. Só o jogador — aliado não. Não conflita com a Mega: dá pra usar as duas na mesma luta, e são
   contadores separados. */
import { G } from './estado.js';
import { TYPE_PT } from './dados.js';
import { teraLiberada } from './conquistas.js';
import { conquistasDaConta } from './carreira.js';

/* Os tipos que VOCÊ pode usar agora. Barata de propósito (o render chama a cada desenho): só lê o progresso já
   somado da conta. Mora aqui, e não em batalha.js, porque o render também precisa — e render não pode importar
   batalha.js (daria ciclo; ver mega.megasDoJogador). */
export function terasDisponiveis() {
  const B = G.B; if (!B || B.teraUsada || G.S?.player?.tera) return [];
  const p = conquistasDaConta(G.S?.registro);
  return Object.keys(TYPE_PT).filter(t => teraLiberada(p, t));
}

/* A troca em si. Não mexe em `data`: guarda só o tipo, e as regras leem dali. É por isso que desfazer é uma
   linha — ao contrário da Mega, que troca o Pokémon inteiro e precisa lembrar o que estava antes. */
export function teracristalizar(M, tipo) {
  if (!M || !tipo) return null;
  M.tera = tipo;
  return tipo;
}
export function desfazerTera(M) {
  if (!M?.tera) return null;
  const t = M.tera;
  delete M.tera;
  return t;
}
