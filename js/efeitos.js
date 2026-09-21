/* ============ efeitos com narração ============ */
// Mudança de estágio e aplicação de status, com mensagem no log. Usado pela batalha (golpes) e pelos
// itens (X Attack…) — mora à parte pra batalha.js e itens.js não precisarem importar um ao outro.
import { G, nm } from './estado.js';
import { say } from './ui.js';
import { render } from './render.js';
import { STAT_PT, AIL_MSG } from './dados.js';
import { imuneAoStatus } from './regras.js';
import { rand, clamp } from './util.js';

export async function changeStats(m, changes) {
  for (const c of changes) {
    if (!(c.stat in m.vol.stages)) continue;
    const cur = m.vol.stages[c.stat], nv = clamp(cur + c.change, -6, 6);
    if (nv === cur) { await say(`${STAT_PT[c.stat]} de ${nm(m)} não pode ${c.change > 0 ? 'subir' : 'cair'} mais!`); continue; }
    m.vol.stages[c.stat] = nv;
    const d = Math.abs(c.change), up = c.change > 0;
    const w = up ? (d >= 3 ? 'subiu drasticamente' : d === 2 ? 'subiu muito' : 'subiu') : (d >= 3 ? 'caiu drasticamente' : d === 2 ? 'caiu muito' : 'caiu');
    await say(`${STAT_PT[c.stat]} de ${nm(m)} ${w}!`, up ? 'good' : 'status');
  }
  render();
}
export async function inflict(t, ail, announce = false) {
  if (ail === 'confusion') {
    if (t.vol.conf > 0) { if (announce) await say(`${nm(t)} já está confuso!`); return; }
    t.vol.conf = rand(2, 5); await say(`${nm(t)} ficou confuso!`, 'status'); return;
  }
  if (!AIL_MSG[ail]) { if (announce) await say('Mas nada aconteceu... (efeito ainda não implementado)', 'muted'); return; }
  if (t.status) { if (announce) await say(`${nm(t)} já tem uma condição de status.`); return; }
  if (imuneAoStatus(t.data.types, ail)) { if (announce) await say(`Não afeta ${nm(t)}...`); return; }
  t.status = ail; if (ail === 'sleep') t.sleep = rand(2, 4);
  render(); await say(`${nm(t)} ${AIL_MSG[ail]}!`, 'status');
}
// cura você e os aliados (Centro Pokémon, derrota, fuga depois de capturado)
export function healFull() {
  for (const P of [G.S.player, ...(G.S.aliados || [])]) { P.hp = P.stats.hp; P.status = null; P.sleep = 0; P.moves.forEach(m => m.ppLeft = m.pp); }
}
