/* ============ exploração ============ */
// Um clique em "Explorar": 10% treinador caçador, 58% selvagem, 15% item, 7% dinheiro, 10% só ambientação.
import { G, zone, save } from './estado.js';
import { log, say } from './ui.js';
import { render } from './render.js';
import { startBattle, startTrainerBattle, startBossBattle } from './batalha.js';
import { verificarMissoes } from './missoes.js';
import { addItem } from './itens.js';
import { ITEMS, FIND_ITEMS, FLAVOR } from './dados.js';
import { apiErr } from './api.js';
import { rand, pick } from './util.js';

export async function explore() {
  if (G.busy) return;
  G.busy = true; render();
  const z = zone();
  try {
    await say(`Você anda por ${z.name}...`, 'muted');
    const r = Math.random();
    if (r < 0.10) await startTrainerBattle(z);
    else if (r < 0.68) await startBattle(z);
    else if (r < 0.83) { const it = pick(FIND_ITEMS); addItem(it, 1); await say(`Você encontrou <b>${ITEMS[it].name}</b>!`, 'good'); }
    else if (r < 0.9) { const m = rand(20, 80); G.S.money += m; await say(`Você achou ₽${m} caídos no chão.`, 'good'); }
    else await say(pick(FLAVOR[z.id] || FLAVOR.default));
  } catch (e) {
    console.error(e); G.B = null; G.mode = 'explore'; G.panel = 'main';
    log(apiErr(e), 'hit');
  } finally {
    // missões também aparecem fora de batalha (ex.: a primeira vez que o jogo roda com missões)
    if (!G.B) try { await verificarMissoes(); } catch (e) { console.error(e); }
    G.busy = false; render(); save();
  }
}
// botão "⚔ Desafiar" do Alfa da zona atual
export async function desafiarChefe() {
  const z = zone();
  if (G.busy || !z.chefe) return;
  G.busy = true; render();
  try { await startBossBattle(z); }
  catch (e) { console.error(e); G.B = null; G.mode = 'explore'; G.panel = 'main'; log(apiErr(e), 'hit'); }
  finally { G.busy = false; render(); save(); }
}
