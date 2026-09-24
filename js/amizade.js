/* ============ amizade (Etapa 3.2) ============ */
// Oferecer um petisco (ITEMS com `afinidade`) a um Pokémon SELVAGEM em batalha: se o tipo dele gosta, a
// amizade (E.amizade, 0–100, só dura a batalha) sobe bem; ao encher, ele pede pra seguir você e vira aliado
// (S.aliados, até MAX_ALIADOS). Pokémon de treinador não aceita — ele já tem dono.
import { G, nm, rotulo, registrar } from './estado.js';
import { say, ask } from './ui.js';
import { render } from './render.js';
import { ITEMS, TYPE_PT } from './dados.js';
import { ganhoAmizade, podeFazerAmizade, freshVol, MAX_ALIADOS, AMIZADE_MAX } from './regras.js';
import { escondidos, esconderijoCheio } from './esconderijo.js';
import { loadSpecies, loadGrowth } from './api.js';
import { FELICIDADE_ALIADO } from './evolucao.js';
import { esc, fmt } from './util.js';

// 'cancelado' = nada gasto (turno não conta) · 'ok' = petisco gasto, turno segue · 'fim' = batalha acabou em paz
export async function oferecer(id, E) {
  const S = G.S, it = ITEMS[id], P = S.player;
  if (!it?.afinidade || !S.bag[id]) return 'cancelado';
  if (G.B.trainer && !G.B.lendarios) { await say(`${nm(E)} tem dono. Não adianta oferecer nada.`); return 'cancelado'; }
  if (G.B.chefe) { await say(`${nm(E)} guarda o território. Não aceita nada de você.`); return 'cancelado'; }
  S.bag[id]--; if (S.bag[id] <= 0) delete S.bag[id];
  await say(`Você oferece ${it.name} a ${nm(E)}.`);
  if (!podeFazerAmizade(E.level, P.level)) {
    await say(`${nm(E)} (Nv. ${E.level}) é forte demais pra confiar em você. Suba de nível antes (até Nv. ${P.level + 5} aceita).`, 'muted');
    return 'ok';
  }
  // `E.lendario` só existe em encontro do Santuário (batalha.startBattle marca pelo `l`/`m` do pool): aceita, mas
  // confia muito mais devagar que um Pokémon comum
  const ganho = ganhoAmizade(it.afinidade, E.data.types, Math.random(), !!E.lendario);
  E.amizade = Math.min(AMIZADE_MAX, (E.amizade || 0) + ganho); render();
  if (E.lendario && ganho > 0) await say(`${nm(E)} aceita, mas mede você de cima a baixo. Amizade ${E.amizade}/${AMIZADE_MAX} — lendários custam a confiar.`, ganho >= 5 ? 'good' : '');
  else if (ganho >= 20) await say(`${nm(E)} adorou! Amizade ${E.amizade}/${AMIZADE_MAX}.`, 'good');
  else if (ganho > 0) await say(`${nm(E)} cheira, desconfiado, e come um pouco. Amizade ${E.amizade}/${AMIZADE_MAX}.`);
  else await say(`${nm(E)} ignora. Pokémon ${E.data.types.map(t => TYPE_PT[t]).join('/')} não gosta disso.`, 'muted');
  if (E.amizade >= AMIZADE_MAX) { await recrutar(E); return 'fim'; }
  return 'ok';
}

async function recrutar(E) {
  const S = G.S; S.aliados ||= [];
  await say(`${nm(E)} para de lutar e se aproxima. Ele quer seguir você!`, 'level');
  /* Equipe cheia não é mais uma despedida definitiva: o novo pode esperar no esconderijo (esconderijo.js).
     Despedir continua sendo uma opção — mas agora é escolha, e não o preço de ter achado alguém interessante
     tarde na jornada. */
  let destino = null;
  if (S.aliados.length >= MAX_ALIADOS) {
    const cheio = esconderijoCheio(S);
    const c = await ask(`${nm(E)} quer seguir você, mas você já anda com ${MAX_ALIADOS} aliados. O que fazer?`, [
      ...(cheio ? [] : [{ label: `📦 Deixar ${esc(fmt(E.name))} esperando no esconderijo`, value: 'guardar' }]),
      ...S.aliados.map((a, i) => ({ label: `Despedir ${esc(rotulo(a))} (Nv. ${a.level}) e levar o novo`, value: i })),
      { label: `Não levar ${esc(fmt(E.name))}`, value: -1, ghost: true }]);
    if (c === -1) { await say(`${nm(E)} fica para trás, olhando você partir.`); return; }
    if (c === 'guardar') destino = 'esconderijo';
    else {
      const [saiu] = S.aliados.splice(c, 1); G.abertos.clear(); // índices mudaram
      await say(`${esc(rotulo(saiu))} volta para a natureza. Até mais!`);
    }
  }
  const sp = await loadSpecies(E.data.speciesUrl);
  E.growth = await loadGrowth(sp.growthUrl);
  E.exp = E.growth[E.level]; E.vol = freshVol(); delete E.amizade;
  E.felicidade = FELICIDADE_ALIADO; // escolheu seguir você: já começa com um vínculo maior (evolucao.js)
  const nome = nm(E); // ainda "X selvagem" — rotulo muda assim que entrar em S.aliados
  if (destino === 'esconderijo') escondidos(S).push(E); else S.aliados.push(E);
  registrar(S, 'amigos', E.data.speciesName, E.id);
  if (E.shiny) registrar(S, 'shiniesAmigos', E.data.speciesName, E.id);
  await say(destino === 'esconderijo'
    ? `📦 ${nome} vai esperar no esconderijo. Dá pra trocar quando quiser, pela ficha.${E.shiny ? ' ✨ E é shiny!' : ''}`
    : `💚 ${nome} agora faz a jornada com você!${E.shiny ? ' ✨ E é shiny!' : ''}`, 'level');
}

// fora de batalha, pela ficha
export async function despedir(i) {
  const S = G.S, A = S.aliados?.[i]; if (!A) return;
  const ok = await ask(`Despedir ${nm(A)}? Ele volta para a natureza e não dá pra desfazer.`, [{ label: 'Despedir', value: true }, { label: 'Cancelar', value: false, ghost: true }]);
  if (!ok) return;
  S.aliados.splice(i, 1); G.abertos.clear(); // índices mudaram
  await say(`${esc(rotulo(A))} volta para a natureza. Até mais!`);
}
