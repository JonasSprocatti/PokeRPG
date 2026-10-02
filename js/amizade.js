/* ============ amizade (Etapa 3.2) ============ */
// Oferecer um petisco (ITEMS com `afinidade`) a um Pokémon SELVAGEM em batalha: se o tipo dele gosta, a
// amizade (E.amizade, 0–100, só dura a batalha) sobe bem; ao encher, ele pede pra seguir você e vira aliado
// (S.aliados, até MAX_ALIADOS). Pokémon de treinador não aceita — ele já tem dono.
import { G, nm, rotulo, registrar, save } from './estado.js';
import { say, ask } from './ui.js';
import { render } from './render.js';
import { ITEMS, TYPE_PT } from './dados.js';
import { ganhoAmizade, podeFazerAmizade, freshVol, MAX_ALIADOS, AMIZADE_MAX } from './regras.js';
import { escondidos, esconderijoCheio, equipeCheia, acolher } from './esconderijo.js';
import { loadSpecies, loadGrowth, loadEvo, resolvePokemon } from './api.js';
import { FELICIDADE_ALIADO } from './evolucao.js';
import { makeMon } from './pokemon.js';
import { ovos, criarOvo, podeCruzar, acharPar, andarOvos, tirarOvo, ivsHerdados, golpeHerdado, NIVEL_CHOCAR, MAX_OVOS } from './ovos.js';
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

/* ============ ovos (ovos.js) ============
   Uma exploração: os ovos andam um passo, os prontos chocam e um casal do esconderijo pode deixar um ovo novo.
   Chamado por `mundo.explore` — e de lá dentro de um try próprio, porque ovo é bônus: nada aqui pode derrubar a
   exploração. As buscas de rede são todas em espécie que JÁ está no cache (os pais vivem no save), então na
   prática nenhuma delas vai à rede. */
export async function cuidarDosOvos() {
  const S = G.S;
  if (!S || !ovos(S).length && !escondidos(S).length) return;
  for (const ovo of andarOvos(S)) await chocar(S, ovo);
  await talvezPorOvo(S);
}

async function chocar(S, ovo) {
  // sem lugar pra nascer: o ovo espera PRONTO (andarOvos trava os passos no alvo). Despedir alguém o faz nascer.
  if (equipeCheia(S) && esconderijoCheio(S)) return;
  const data = await resolvePokemon(ovo.especie);
  const bebe = await makeMon(data, NIVEL_CHOCAR, { ivs: ovo.ivs || undefined });
  /* O golpe do pai entra no lugar do 4º (o mais recente aprendido por nível), e só se o filhote já não souber.
     O objeto do golpe foi guardado inteiro no ovo de propósito: não precisa de rede na hora de chocar. */
  const herdado = ovo.golpe && !bebe.moves.some(m => m.name === ovo.golpe.name) ? { ...ovo.golpe, ppLeft: ovo.golpe.pp } : null;
  if (herdado) { if (bebe.moves.length >= 4) bebe.moves[3] = herdado; else bebe.moves.push(herdado); }
  const sp = await loadSpecies(data.speciesUrl);
  bebe.growth = await loadGrowth(sp.growthUrl);
  bebe.exp = bebe.growth[bebe.level];
  bebe.felicidade = FELICIDADE_ALIADO;   // nasceu com você: já começa com vínculo de aliado (evolucao.js)
  const onde = acolher(S, bebe, freshVol);
  if (!onde) return;                     // garantia (a checagem lá em cima já cobre)
  tirarOvo(S, ovo);
  S.ovosChocados = (S.ovosChocados || 0) + 1;   // vai no resumo da jornada → progresso permanente → badges
  registrar(S, 'amigos', data.speciesName, data.id);
  if (bebe.shiny) registrar(S, 'shiniesAmigos', data.speciesName, data.id);
  G.abertos.clear(); render(); save();
  await say(`🥚 O ovo trinca e se abre: nasceu <b>${esc(fmt(bebe.name))}</b>, Nv. ${bebe.level}${ovo.de ? `, filho de ${esc(ovo.de[0])} e ${esc(ovo.de[1])}` : ''}!${bebe.shiny ? ' ✨ E é shiny!' : ''}`, 'level');
  if (herdado) await say(`Veio sabendo <b>${esc(fmt(herdado.name))}</b> — herdou do pai.`, 'muted');
  if (onde === 'esconderijo') await say('📦 Sua equipe está cheia, então ele vai esperar no esconderijo.', 'muted');
}

async function talvezPorOvo(S) {
  if (!podeCruzar(S)) return;
  const guardados = escondidos(S);
  /* Os grupos-ovo de cada um do esconderijo. São dado de ESPÉCIE (`api.loadSpecies`), não do Pokémon, e na prática
     já estão em memória: `makeMon` busca essa mesma ficha pra sortear o gênero de todo mundo que nasce. A busca só
     acontece aqui, depois de o sorteio de `podeCruzar` passar — nunca a cada exploração. Espécie que falhar fica
     fora do Map e, por `ovos.parCompativel`, simplesmente não cruza (nada de par chutado). */
  const grupos = new Map();
  await Promise.all(guardados.map(async A => {
    const nome = A?.data?.speciesName;
    if (!nome || grupos.has(nome)) return;
    try { grupos.set(nome, (await loadSpecies(A.data.speciesUrl)).eggGroups || []); } catch { /* sem ficha, sem par */ }
  }));
  const par = acharPar(guardados, grupos);
  if (!par) return;
  const { mae, pai } = par;
  /* O filhote é a FORMA BASE da mãe: a raiz da árvore de evolução. Forma regional não é tratada — a raiz pode ser a
     forma original (um Sandslash de Alola põe um Sandshrew de Kanto).
     // ponytail: sem mapa de forma regional pra raiz. `mapas.formaRegionalDaGen` resolveria, se alguém reclamar. */
  const sp = await loadSpecies(mae.data.speciesUrl);
  const arvore = sp.evoUrl ? await loadEvo(sp.evoUrl) : null;
  ovos(S).push(criarOvo({
    especie: arvore?.name || mae.data.speciesName, ciclos: sp.hatchCounter,
    ivs: ivsHerdados(mae, pai), golpe: golpeHerdado(pai),
    de: [mae.nick || fmt(mae.name), pai.nick || fmt(pai.name)]
  }));
  G.abertos.clear(); render(); save();
  await say(`🥚 Você encontra um <b>ovo</b> no esconderijo. Ninguém diz de onde veio. Ande por aí que ele choca${ovos(S).length >= MAX_OVOS ? ` (o ninho está cheio: ${MAX_OVOS})` : ''}.`, 'good');
}

// fora de batalha, pela ficha
export async function despedir(i) {
  const S = G.S, A = S.aliados?.[i]; if (!A) return;
  const ok = await ask(`Despedir ${nm(A)}? Ele volta para a natureza e não dá pra desfazer.`, [{ label: 'Despedir', value: true }, { label: 'Cancelar', value: false, ghost: true }]);
  if (!ok) return;
  S.aliados.splice(i, 1); G.abertos.clear(); // índices mudaram
  await say(`${esc(rotulo(A))} volta para a natureza. Até mais!`);
}
