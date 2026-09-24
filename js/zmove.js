/* ============ Z-Move ============
   Conquista de CONTA em duas portas (conquistas.js): 250 eliminações com um GOLPE liberam o Z daquele golpe;
   500 com golpes de um ELEMENTO liberam o Z de qualquer golpe daquele tipo. Ou seja: dá pra chegar lá pelo
   golpe que você mais usa ou pelo tipo que você mais joga.

   Diferente da Mega e da Tera, o Z-Move **É o seu turno**: ele não transforma nada, ele converte um golpe seu
   num golpe muito mais forte, uma vez por batalha. Por isso o botão não diz "não gasta o turno" — ele abre a
   lista de golpes elegíveis e o que você escolher é o ataque da rodada.

   A conversão do poder mora em `regras.poderZ`, aplicada em `calcDamage` quando `vol.zAtivo` está ligado. Aqui
   ficam só a elegibilidade e o estado. */
import { G } from './estado.js';
import { ITEM_CRISTAL_Z } from './dados.js';
import { zLiberado } from './conquistas.js';
import { conquistasDaConta } from './carreira.js';

/* Golpes que podem virar Z agora. Só golpe de DANO: Z de golpe de status existe nos jogos como um bônus de
   atributo, que seria outra mecânica inteira — e um Z que não bate confundiria mais do que ajudaria.
   Sem PP não entra: o Z gasta o PP do golpe de base, como nos jogos. */
/* Tem algum Z conquistado pros golpes que este Pokémon sabe? NÃO depende de batalha nem do cristal — é a
   pergunta que a LOJA faz pra decidir se oferece o Cristal Z, e loja acontece fora de combate. Misturar isso com
   a checagem de batalha fazia o cristal nunca aparecer à venda. */
export function temZConquistado(M = G.S?.player) {
  if (!M) return false;
  const p = conquistasDaConta(G.S?.registro);
  return (M.moves || []).some(g => g.cls !== 'status' && zLiberado(p, g));
}

export function zDisponiveis(M = G.S?.player) {
  const B = G.B;
  if (!B || B.zUsado || !M || M.item !== ITEM_CRISTAL_Z) return [];
  const p = conquistasDaConta(G.S?.registro);
  return (M.moves || [])
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => g.cls !== 'status' && g.ppLeft > 0 && zLiberado(p, g));
}
// o que falta pra quem conquistou algum Z e não consegue usar (mesma ideia do aviso da Mega)
export function avisoDoZ(M = G.S?.player) {
  const B = G.B;
  if (!B || B.zUsado || !M || !temZConquistado(M)) return '';
  return M.item === ITEM_CRISTAL_Z ? '' : 'precisa segurar o Cristal Z';
}
