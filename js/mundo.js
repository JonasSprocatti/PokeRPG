/* ============ exploração ============ */
// Um clique em "Explorar": 10% treinador caçador, 58% selvagem, 15% item, 7% dinheiro, 10% só ambientação.
import { G, zone, save, emCampo, rotasAtuais } from './estado.js';
import { log, say } from './ui.js';
import { render } from './render.js';
import { startBattle, startTrainerBattle, startBossBattle, startLendarios } from './batalha.js';
import { verificarMissoes } from './missoes.js';
import { addItem } from './itens.js';
import { ITEMS, FIND_ITEMS, FLAVOR, ITENS_EVO_ACHADOS } from './dados.js';
import { apiErr } from './api.js';
import { rand, pick } from './util.js';

export async function explore() {
  if (G.busy) return;
  G.busy = true; render();
  const z = zone();
  try {
    await say(`Você anda por ${z.name}...`, 'muted');
    for (const M of emCampo()) M.passos = (M.passos || 0) + 1; // Pawmot, Brambleghast, Rabsca (evolucao.js)
    const r = Math.random();
    if (r < 0.10) await startTrainerBattle(z);
    else if (r < 0.68) await startBattle(z);
    else if (r < 0.83) {
      // da 4ª rota do mapa em diante, 1 em 5 achados é um item de evolução (pedra, Metal Coat…)
      const it = rotasAtuais().findIndex(x => x.id === z.id) >= 3 && Math.random() < 0.2 ? pick(ITENS_EVO_ACHADOS) : pick(FIND_ITEMS);
      addItem(it, 1); await say(`Você encontrou <b>${ITEMS[it].name}</b>!${ITEMS[it].evo || ITEMS[it].segurar ? ' (item de evolução)' : ''}`, 'good');
    }
    else if (r < 0.9) { const m = rand(20, 80); G.S.money += m; await say(`Você achou ₽${m} caídos no chão.`, 'good'); }
    else await say(pick(FLAVOR[z.id] || FLAVOR.default));
  } catch (e) {
    console.error(e); G.B = null; G.mode = 'explore'; G.panel = 'main';
    log(e.offline ? e.message : apiErr(e), 'hit');
  } finally {
    // missões também aparecem fora de batalha (ex.: a primeira vez que o jogo roda com missões)
    if (!G.B) try { await verificarMissoes(); } catch (e) { console.error(e); }
    G.busy = false; render(); save();
  }
}
// botão "⚔ Desafiar": o Alfa da rota atual, ou os lendários na rota final do mapa
export async function desafiarChefe() {
  const z = zone();
  if (G.busy || !(z.chefe || z.lendarios)) return;
  if (z.lendarios && G.S.player.level < z.libera) return; // o botão já vem desativado; garantia
  G.busy = true; render();
  try { await (z.lendarios ? startLendarios(z) : startBossBattle(z)); }
  catch (e) { console.error(e); G.B = null; G.mode = 'explore'; G.panel = 'main'; log(e.offline ? e.message : apiErr(e), 'hit'); }
  finally { G.busy = false; render(); save(); }
}
