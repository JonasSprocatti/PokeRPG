/* ============ missões (Etapa 2) ============ */
// Missões em cadeia (MISSOES em dados.js): cada uma aparece quando `libera` é cumprida e conclui quando
// `objetivo` é cumprido — a conta mora em regras.js (progressoCondicao/situacaoMissoes). Aqui só entrega
// o prêmio e narra. Chamado no fim de todo turno de batalha e depois de usar item fora dela.
import { G } from './estado.js';
import { say } from './ui.js';
import { render } from './render.js';
import { MISSOES, ITEMS } from './dados.js';
import { situacaoMissoes } from './regras.js';
import { esc } from './util.js';

export async function verificarMissoes() {
  const S = G.S; if (!S) return;
  // concluir uma pode revelar outra já cumprida (ex.: `libera: { missao }`) — repete até estabilizar
  for (let volta = 0; volta <= MISSOES.length; volta++) {
    const { ativas, prontas } = situacaoMissoes(MISSOES, S);
    // missão que acabou de aparecer (ex.: derrotou o 1º Zubat): anuncia uma vez só
    const vistas = (S.missoesVistas ||= []);
    for (const { m } of [...ativas, ...prontas]) if (!vistas.includes(m.id)) {
      vistas.push(m.id);
      await say(`🔓 Nova missão: <b>${esc(m.nome)}</b> — ${esc(m.desc)}`, 'enc');
    }
    if (!prontas.length) return;
    for (const { m } of prontas) {
      (S.missoesFeitas ||= []).push(m.id);
      const partes = [];
      if (m.premio.dinheiro) { S.money += m.premio.dinheiro; partes.push(`₽${m.premio.dinheiro}`); }
      for (const [k, n] of Object.entries(m.premio.itens || {})) { S.bag[k] = (S.bag[k] || 0) + n; partes.push(`${n}× ${ITEMS[k]?.name || k}`); }
      render();
      await say(`📜 Missão concluída: <b>${esc(m.nome)}</b>! Prêmio: ${partes.join(', ')}.`, 'level');
    }
  }
}
