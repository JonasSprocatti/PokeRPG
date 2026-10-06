/* ============ exploração ============ */
// Um clique em "Explorar": 10% treinador caçador, 58% selvagem, 15% item, 7% dinheiro, 10% só ambientação.
import { G, zone, save, emCampo, rotasAtuais, dificuldadeDe, centroPokemon, zerarDescontoCentro } from './estado.js';
import { healFull } from './efeitos.js';
import { gastarRepelente, semSelvagens, genDe } from './mapas.js';
import { rotaEsgotada } from './regras.js';
import { log, say, ask } from './ui.js';
import { render } from './render.js';
import { startBattle, startTrainerBattle, startBossBattle, startLendarios, startEvento } from './batalha.js';
import { situacaoDoEvento, BETA_SEM_ESPERA } from './evento.js';
import { verificarEvolucoesPendentes } from './progressao.js';
import { verificarMissoes } from './missoes.js';
import { cuidarDosOvos } from './amizade.js';
import { addItem } from './itens.js';
import { ITEMS, FIND_ITEMS, FLAVOR, ITENS_EVO_ACHADOS, FRUTAS_ACHADAS, SEGURADOS_ACHADOS } from './dados.js';
import { apiErr } from './api.js';
import { rand, pick, esc } from './util.js';

export const CHANCE_ESCAMA = 0.03;  // fatia dos itens achados que sai Escama do Coração (ver o sorteio de item)
export const CHANCE_ITEM_EVO = 0.2; // …que sai um item de evolução, só da 4ª rota em diante
export const CHANCE_FRUTA = 0.18;   // …que sai uma fruta, do que sobrou dos degraus caros (qualquer rota; são 20, cada uma continua rara)
export const CHANCE_SEGURADO = 0.2; // …que sai um segurado permanente, só da 4ª rota em diante (como o de evolução)
export const DINHEIRO_ACHADO = [20, 80];

/* O que um clique em "Explorar" pode dar. Tabela em vez de números soltos nos `if` porque a 📈 tela de Taxas
   MOSTRA esses degraus pro jogador: dois lugares com a mesma porcentagem é o jeito de a tela prometer uma chance
   que o sorteio não cumpre. `DEGRAU` é o acumulado, na ordem — é o que o sorteio compara. */
export const CHANCES_EXPLORAR = { treinador: 0.10, selvagem: 0.58, item: 0.15, dinheiro: 0.07, nada: 0.10 };
const DEGRAU = (() => { let a = 0; return Object.fromEntries(Object.entries(CHANCES_EXPLORAR).map(([k, v]) => [k, a += v])); })();

export async function explore() {
  if (G.busy) return;
  G.busy = true; render();
  const z = zone();
  try {
    // evolução que ficou pendente por falta de rede acontece agora, antes de qualquer outra coisa (progressao.js)
    await verificarEvolucoesPendentes();
    // rota esgotada (Roguelike): dá pra andar e olhar, mas não aparece mais ninguém pra lutar
    if (rotaEsgotada(z, G.S.player.level, dificuldadeDe(G.S))) {
      await say(`Você anda por ${z.name}, mas está forte demais pra este lugar: nada aparece. Suba de rota.`, 'muted');
      return;
    }
    await say(`Você anda por ${z.name}...`, 'muted');
    for (const M of emCampo()) M.passos = (M.passos || 0) + 1; // Pawmot, Brambleghast, Rabsca (evolucao.js)
    /* 🥚 Ovos (ovos.js): andam um passo por exploração, chocam e um casal do esconderijo pode pôr outro. Try próprio
       porque ovo é bônus — uma falha aqui não pode custar a exploração (e o encontro ainda vem logo abaixo). */
    try { await cuidarDosOvos(); } catch (e) { console.error('ovos', e); }
    // repelente gasta um passo por exploração; quando acaba, avisa (mapas.js)
    if (gastarRepelente(G.S) === 'acabou') await say('O efeito do repelente passou.', 'muted');
    const r = Math.random();
    // com repelente ativo o encontro selvagem simplesmente não acontece — treinador, item, dinheiro e
    // ambientação continuam com a MESMA chance de sempre (o sorteio abaixo é o mesmo; só o selvagem vira ambientação)
    const semBicho = semSelvagens(G.S, z);
    if (r < DEGRAU.treinador) await startTrainerBattle(z);
    else if (r < DEGRAU.selvagem && semBicho) await say(pick(FLAVOR[z.id] || FLAVOR.default), 'muted');
    else if (r < DEGRAU.selvagem) await startBattle(z);
    else if (r < DEGRAU.item) {
      // 3% dos achados é uma Escama do Coração (relembrar golpe): raríssima de propósito — na loja ela custa ₽5.000,
      // então achar uma é sorte, não o caminho normal. Da 4ª rota em diante, 1 em 5 achados é um item de evolução.
      /* Da 4ª rota em diante entram os dois degraus caros: item de evolução e segurado permanente. A fruta é
         barata e de uso único, então sai em QUALQUER rota (`dados.FRUTAS_ACHADAS` explica o porquê de cada degrau).
         A ORDEM importa, e não é estética: cada ramo sorteia sobre o que o anterior deixou passar, então pôr a
         fruta antes do item de evolução derrubaria a chance DELE de 20% pra 16% sem ninguém pedir. O item de
         evolução vem primeiro porque a taxa dele já estava calibrada; a fruta fica com o resto (~17% das rotas
         rasas, ~11% das fundas), e são 20 frutas, então cada uma continua sendo sorte. */
      const fundo = rotasAtuais().findIndex(x => x.id === z.id) >= 3;
      const it = Math.random() < CHANCE_ESCAMA ? 'heart-scale'
        : fundo && Math.random() < CHANCE_ITEM_EVO ? pick(ITENS_EVO_ACHADOS)
        : fundo && Math.random() < CHANCE_SEGURADO ? pick(SEGURADOS_ACHADOS)
        : Math.random() < CHANCE_FRUTA ? pick(FRUTAS_ACHADAS)
        : pick(FIND_ITEMS);
      // `segurar` (a evolução pede o item na mochila) e `segurado` (efeito em batalha) são coisas diferentes, e o
      // item `duplo` tem as duas — por isso o rótulo de evolução vem primeiro.
      const etiqueta = ITEMS[it].evo || ITEMS[it].segurar ? ' (item de evolução)' : ITEMS[it].segurado ? ' (dá pra segurar)' : '';
      addItem(it, 1); await say(`Você encontrou <b>${ITEMS[it].name}</b>!${etiqueta}`, 'good');
    }
    else if (r < DEGRAU.dinheiro) { const m = rand(...DINHEIRO_ACHADO); G.S.money += m; await say(`Você achou ₽${m} caídos no chão.`, 'good'); }
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
/* Centro Pokémon: paga, cura a equipe inteira e zera o desconto por vitória. Mora aqui (e não dentro do
   `data-act` do main.js) porque o 🤖 auto-explorar também precisa curar entre uma batalha e outra — e o Centro
   que o laço usa tem de ser o MESMO que o botão usa, com o mesmo preço e a mesma marca `usouCentro` (que decide
   uma conquista). Devolve false quando não havia o que fazer: sem precisar, sem dinheiro ou ocupado. */
export async function curarNoCentro() {
  const { precisa, custo } = centroPokemon();
  if (G.busy || !precisa || G.S.money < custo) return false;
  G.S.money -= custo; G.S.gasto = (G.S.gasto || 0) + custo; G.S.usouCentro = true; healFull(); zerarDescontoCentro();
  log(`${custo ? `Você pagou ₽${custo} e descansou` : 'Você descansou'} no Centro Pokémon. HP, PP e status ${G.S.aliados?.length ? 'da equipe ' : ''}restaurados.`, 'good');
  await verificarMissoes(); save();
  return true;
}
// botão "☄ Desafiar" do chefe do evento semanal (rota final do mapa): confirma, porque gasta a tentativa das 8 horas
export async function desafiarEvento() {
  const z = zone();
  if (G.busy || !z.lendarios || G.S.player.level < z.libera) return;
  const sit = situacaoDoEvento({ dificuldade: dificuldadeDe(G.S), gen: genDe(G.S) });
  if (!sit.ok) return;
  const ev = sit.evento;
  const ok = await ask(`☄ Desafiar <b>${esc(ev.nome)}</b>?<br><br>É <b>muito difícil</b>: couraça de energia, golpe carregado e três fases. Não dá pra fugir, imune a status${BETA_SEM_ESPERA ? '' : ', e a tentativa gasta as <b>8 horas</b> de espera assim que a luta começa, vença ou perca'}. Perder não encerra a sua jornada.`,
    [{ label: '☄ Enfrentar', value: true }, { label: 'Agora não', value: false, ghost: true }]);
  if (!ok) return;
  G.busy = true; render();
  try { await startEvento(ev); }
  catch (e) { console.error(e); G.B = null; G.mode = 'explore'; G.panel = 'main'; log(e.offline ? e.message : apiErr(e), 'hit'); }
  finally { G.busy = false; render(); save(); }
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
