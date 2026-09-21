/* ============ ponto de entrada ============ */
// Um único listener delegado por tipo de evento (click/change/keydown) no document: todo botão só
// declara `data-act` (+ `data-v`), então re-render total não precisa religar handler nenhum.
import { G, SAVE_KEY, save } from './estado.js';
import { $, log, logRaw, ask } from './ui.js';
import { render, buildGame } from './render.js';
import { showCreate, previewSearch, renderPreview, startGame, fullRandomizer } from './criacao.js';
import { explore } from './mundo.js';
import { turn } from './batalha.js';
import { healFull } from './efeitos.js';
import { addItem, useItem } from './itens.js';
import { ITEMS } from './dados.js';
import { freshVol, custoCentro, precisaCurar } from './regras.js';
import { rand, store } from './util.js';

/* ============ eventos ============ */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const v = b.dataset.v;
  switch (b.dataset.act) {
    case 'search': return previewSearch($('#q').value);
    case 'random': return previewSearch(rand(1, 1025));
    case 'pick': return previewSearch(v);
    case 'ability': G.PV.ability = v; return renderPreview();
    case 'dificuldade': G.PV.dificuldade = v; return renderPreview();
    case 'randomizer': return fullRandomizer(b);
    case 'recomecar': G.S = null; G.B = null; G.PV = null; return showCreate();
    case 'start': return startGame(b);
    case 'explore': return explore();
    case 'zone': G.S.zone = v; save(); return render();
    case 'panel': G.panel = v; return render();
    case 'heal': {
      // o botão já vem desativado nesses casos; a checagem aqui é a garantia (clique duplo, estado mudou entre renders)
      const custo = custoCentro(G.S.player.level);
      if (G.busy || !precisaCurar(G.S.player) || G.S.money < custo) return;
      G.S.money -= custo; healFull();
      log(`Você pagou ₽${custo} e descansou no Centro Pokémon. HP, PP e status restaurados.`, 'good'); save(); return render();
    }
    case 'buy': {
      const it = ITEMS[v]; if (!it || G.S.money < it.price) return;
      G.S.money -= it.price; addItem(v, 1); log(`Você comprou ${it.name} por ₽${it.price}.`); save(); return render();
    }
    case 'item': if (G.busy) return; G.busy = true; render(); try { await useItem(v, false); } finally { G.busy = false; render(); save(); } return;
    case 'item-b': return turn({ type: 'item', id: v });
    case 'move': return turn({ type: 'move', idx: +v });
    case 'run': return turn({ type: 'run' });
    case 'new': {
      if (G.busy) return;
      const ok = await ask('Começar um novo jogo? O progresso salvo neste navegador será apagado.', [{ label: 'Apagar e recomeçar', value: true }, { label: 'Cancelar', value: false, ghost: true }]);
      if (ok) { store.del(SAVE_KEY); G.S = null; G.B = null; G.PV = null; showCreate(); }
      return;
    }
  }
});
document.addEventListener('change', e => {
  if (!G.PV) return;
  if (e.target.id === 'pv-nature') G.PV.nature = e.target.value;
  if (e.target.id === 'pv-level') { G.PV.level = +e.target.value; renderPreview(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'q') previewSearch(e.target.value); });

/* ============ início ============ */
(function boot() {
  const s = store.get(SAVE_KEY);
  if (s?.player?.data && s.meta?.growth) {
    G.S = s; G.S.player.vol = freshVol(); G.mode = 'explore'; G.panel = 'main';
    buildGame();
    (G.S.log || []).slice(-20).forEach(logRaw);
    log('Jogo carregado deste navegador.', 'muted');
  } else showCreate();
})();
