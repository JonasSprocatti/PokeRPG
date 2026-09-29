/* ============ multiplayer: o que a luta deixa pra trás ============
   Aplicar o fim da batalha ao save da pessoa (HP, PP, status, XP, EVs, dinheiro, conquistas, prêmios) e descontar
   da mochila o que foi usado durante a luta. É a parte mais perigosa do multiplayer — mexe no save de verdade —
   e por isso ganhou arquivo próprio, longe da rede e do desenho da tela.
   Regra que vale em tudo aqui: quem entrou com Pokémon EMPRESTADO (convidado, Hall fora da Raide) ou só assistindo
   não ganha nem perde nada; quem lutou com o nível AJUSTADO pelo balanceamento também não leva ganho pra run
   (`naNivelReal`, mp-motor). */
import { G, save, registrar, dificuldadeDe } from './estado.js';
import { say } from './ui.js';
import { DIFICULDADES, ITEMS } from './dados.js';
import { EVENTOS, EVENTO_SEM_PERMADEATH, modoComEvento, idDaSemana, agoraDoEvento, darItensDeRaide, inventarioRaide, gastarItemDeRaide } from './evento.js';
import { registrarVitoriaDeEvento } from './carreira.js';
import { registrarAbate } from './conquistas.js';
import { ganhoDeEVs, premioChefe } from './regras.js';
import { gainExp, gainExpAliado } from './progressao.js';
import { verificarMissoes } from './missoes.js';
import { usuario, sincronizarComRetentativa } from './nuvem.js';
import { ITEM_DO_RAIDE } from './boss.js';
import { meuId } from './mp-rede.js';
import { raideSemRun, semMochila, usaRun } from './mp-regras.js';
import { esc, fmt } from './util.js';

const temRun = () => !!G.S?.player;
/* Itens de raide, comuns e Revive: fora da Sala de Raide vêm da MOCHILA DA RUN (G.S.bag); dentro dela vêm do
   INVENTÁRIO DE CONTA (evento.inventarioRaide — a mesma "mochila de conta" da Loja de preparo/Arena, comprada sem
   run nenhuma). Este é o ÚNICO ponto que decide qual das duas usar; todo o resto (disponíveis, botões, consumo)
   lê daqui em vez de checar o modo cada um por conta própria. */
export const minhaMochila = () => raideSemRun(G.sala) ? inventarioRaide() : (G.S?.bag || {});
/* O `ctx` que as regras puras de item pedem (mp-regras: raideDisponiveis, itensComunsDisponiveis, podeReviver).
   Montado num lugar só pra tela e ação nunca discordarem sobre "de qual mochila estamos falando". */
export const ctxDaSala = extra => ({ sala: G.sala, eu: meuId(), bag: minhaMochila(), temRun: temRun(), ...extra });

/* ---------- descontar o que foi usado durante a luta ----------
   O anfitrião conta os Revives e os itens de raide de cada jogador (`b.revivesUsados`, `b.raideUsados`); o que
   passou do que eu já descontei sai da MINHA mochila (o anfitrião não conhece a mochila dos outros). */
export function consumirRevives(b) {
  const sala = G.sala;
  if (!b?.evento || !sala || semMochila(sala) || (!raideSemRun(sala) && !temRun())) return;
  const eu = meuId(); let mexeu = false;
  const gastarDaRun = id => { const t = G.S.bag[id] > 0; if (t) { G.S.bag[id]--; if (!G.S.bag[id]) delete G.S.bag[id]; } return t; };
  // Sala de Raide desconta do INVENTÁRIO DE CONTA (evento.gastarItemDeRaide); fora dela, da mochila da run.
  const gastar = (id, n) => { for (let i = 0; i < n; i++) if (raideSemRun(sala) ? gastarItemDeRaide(id) : gastarDaRun(id)) mexeu = true; };
  const usados = b.revivesUsados?.[eu] || 0, ja = sala.revivesConsumidos || 0;
  if (usados > ja) {
    // Revive x Max Revive descontam itens diferentes: `revivesTipos[dono]` é a lista na MESMA ordem que os usos
    // foram contados (mp-motor.reviverCompanheiro) — só existe na Sala de Raide, onde há os dois tipos.
    if (raideSemRun(sala)) for (const tipo of (b.revivesTipos?.[eu] || []).slice(ja, usados)) gastar(tipo, 1);
    else gastar('revive', usados - ja);
    sala.revivesConsumidos = usados;
  }
  const feitos = (sala.raideConsumidos ||= {});
  for (const [tipo, n] of Object.entries(b.raideUsados?.[eu] || {})) if (n > (feitos[tipo] || 0)) { gastar(ITEM_DO_RAIDE[tipo], n - (feitos[tipo] || 0)); feitos[tipo] = n; }
  if (mexeu && !raideSemRun(sala)) save();
}
/* Item comum (Potion, X Attack…) usado durante a luta: ao contrário de Revive/raide, vale em QUALQUER luta de
   sala. `itensUsados[dono]` é uma LISTA que só cresce (cada uso vira um item novo no array);
   `itensComunsConsumidos` lembra até onde eu já descontei, pra não gastar de novo a cada estado que chega. */
export function consumirItensComuns(b) {
  const sala = G.sala;
  if (!b || !sala || semMochila(sala) || (!raideSemRun(sala) && !temRun())) return;
  const eu = meuId(), usados = b.itensUsados?.[eu] || [], ja = sala.itensComunsConsumidos || 0;
  if (usados.length <= ja) return;
  for (const id of usados.slice(ja)) {
    if (raideSemRun(sala)) gastarItemDeRaide(id);
    else { G.S.bag[id] = Math.max(0, (G.S.bag[id] || 0) - 1); if (!G.S.bag[id]) delete G.S.bag[id]; }
  }
  sala.itensComunsConsumidos = usados.length;
  if (!raideSemRun(sala)) save();
}

/* ---------- aplicar o resultado ---------- */
export async function aplicarPvP(p) {
  const eu = meuId(), meuTime = p.times.A.includes(eu) ? 'A' : p.times.B.includes(eu) ? 'B' : null;
  if (!meuTime) return false; // estava só olhando
  const ganhei = p.fim === meuTime;
  if (!usaRun(G.sala) || !temRun()) { await say(ganhei ? '🏆 Seu time venceu o PvP!' : 'Seu time perdeu o PvP.', ganhei ? 'good' : 'muted'); return false; } // convidado/Hall: não conta na run
  const S = G.S;
  S.pvp = { vitorias: (S.pvp?.vitorias || 0) + (ganhei ? 1 : 0), derrotas: (S.pvp?.derrotas || 0) + (ganhei ? 0 : 1) };
  await say(ganhei ? '🏆 Seu time venceu o PvP!' : 'Seu time perdeu o PvP. Foi uma luta amistosa: seus Pokémon voltam como estavam.', ganhei ? 'good' : 'muted');
  save();
  return false;
}
// co-op: devolve true se a run acabou (Roguelike, principal desmaiado)
export async function aplicarCoop(p) {
  if (raideSemRun(G.sala)) return aplicarRaideSemRun(p);   // Hall da Fama, sem run nenhuma
  if (!usaRun(G.sala) || !temRun()) { await say(p.fim === 'A' ? '🏆 Vitória do grupo! (Pokémon emprestado: a luta não mexe na sua run.)' : 'Pokémon emprestado: a luta não mexe na sua run.', 'muted'); return false; }
  // luta do chefe da semana: perder não é permadeath (evento.EVENTO_SEM_PERMADEATH), como no single player
  const S = G.S, eu = meuId(), permadeath = DIFICULDADES[dificuldadeDe(S)].permadeath && !(p.evento && EVENTO_SEM_PERMADEATH);
  for (const v of p.vistos || []) { registrar(S, 'vistos', v.especie, v.id); if (v.shiny) registrar(S, 'shinies', v.especie, v.id); }
  const meus = Object.entries(p.final).filter(([k]) => k.startsWith(eu + ':')).map(([k, f]) => [+k.split(':')[1], f]);
  if (!meus.length) { save(); return false; }
  // HP pela fração (o nível pode ter sido balanceado), PP por índice. Aliados perdidos (Roguelike) saem por último,
  // do maior slot pro menor, pra não bagunçar os índices dos outros.
  const perdidos = [];
  let principalCaiu = false;
  for (const [slot, f] of meus) {
    const M = slot === 0 ? S.player : S.aliados?.[slot - 1];
    if (!M || M.data.speciesName !== f.especie && slot > 0) continue; // equipe mudou no meio: não mexe
    if (f.frac > 0) { M.hp = Math.max(1, Math.round(M.stats.hp * f.frac)); M.status = f.status; M.sleep = f.sleep || 0; M.item = f.item; }
    else if (permadeath) { if (slot === 0) principalCaiu = true; else perdidos.push(slot - 1); }
    else { M.hp = 1; M.status = null; M.sleep = 0; } // fora do Roguelike, desmaio no co-op volta com 1 HP
    f.pp.forEach((pp, i) => { if (M.moves[i]) M.moves[i].ppLeft = Math.min(M.moves[i].pp, pp); });
  }
  if (principalCaiu) { await say(`${esc(S.player.nick || fmt(S.player.name))} desmaiou. No Roguelike não existe segunda chance.`, 'hit'); return true; }
  for (const i of perdidos.sort((a, b) => b - a)) { const A = S.aliados[i]; S.aliados.splice(i, 1); G.abertos.clear(); S.aliadosPerdidos = (S.aliadosPerdidos || 0) + 1; await say(`${esc(A.nick || fmt(A.name))} desmaiou e foi perdido pra sempre.`, 'hit'); }
  if (p.fim === 'A') {
    const r = p.recompensas[eu] || { xp: 0, dinheiro: 0 }, principal = meus.find(([s]) => s === 0)?.[1];
    // Só quem lutou no NÍVEL REAL leva os ganhos pra própria run (com o nível ajustado pelo balancear, a luta não rende)
    if (principal?.real) {
      S.money += r.dinheiro; S.wins = (S.wins || 0) + 1; S.vitoriasDesdeCentro = (S.vitoriasDesdeCentro || 0) + 1;
      for (const [s, add] of ganhoDeEVs(S.player.evs, p.effort)) S.player.evs[s] += add;
      for (const d of p.derrotados) {
        registrar(S, 'derrotados', d.especie, d.id);
        /* Conquistas da conta (conquistas.registrarAbate): o co-op não contava nada — a barra da Mega e os marcos de caçada
           só andavam no single player. Aqui só entra o que vale sem saber quem deu o golpe final: a ESPÉCIE que você está
           usando e o total (`porMim: false`, mesma regra do abate de aliado). Tera e Z pedem golpe final SEU e continuam só
           no single player. */
        registrarAbate(S, { porMim: false, minhaEspecie: S.player.data.speciesName, modo: dificuldadeDe(S) });
      }
      await say(`🏆 Vitória do grupo! Você ganhou ${r.xp} de XP e ₽${r.dinheiro}.`, 'good');
      if (r.item && ITEMS[r.item]) { S.bag[r.item] = (S.bag[r.item] || 0) + 1; await say(`Você achou <b>${ITEMS[r.item].name}</b> depois da luta!`, 'good'); }
      if (p.chefe && !S.chefes?.[p.chefe]) {
        const premio = premioChefe(p.chefeNivel || 1);
        (S.chefes ||= {})[p.chefe] = true; S.money += premio; S.bag['rare-candy'] = (S.bag['rare-candy'] || 0) + 1;
        await say(`🏆 Alfa derrotado em grupo! Prêmio: ₽${premio} e 1 Rare Candy.`, 'level');
      }
      await gainExp(r.xp);
    } else await say(`🏆 Vitória do grupo! Você lutou com o nível ajustado (Nv. ${S.player.level} → ${principal?.nivelLuta}), então XP, itens e prêmios desta luta não vão pra sua run.`, 'muted');
    for (const [slot, f] of meus) if (slot > 0 && f.frac > 0 && f.real && S.aliados?.[slot - 1]) await gainExpAliado(S.aliados[slot - 1], (p.recompensas[eu] || {}).xp || 0);
    if (p.evento) await premiarEventoMP(p.evento);
  } else if (p.fim === 'B') await say('O grupo foi derrotado.', 'hit');
  else await say('O grupo fugiu.', 'muted');
  await verificarMissoes();
  save();
  return false;
}
// Prêmio do chefe da semana pra quem estava no grupo: só vale se a SUA run é Roguelike/Hardcore (o convidado nem chega aqui)
async function premiarEventoMP(id) {
  const S = G.S, ev = EVENTOS.find(e => e.id === id); if (!ev) return;
  if (!modoComEvento(dificuldadeDe(S))) { await say(`☄ ${esc(ev.nome)} caiu! Mas os prêmios do evento só valem em jornadas Roguelike ou Hardcore.`, 'muted'); return; }
  const r = registrarVitoriaDeEvento(ev, idDaSemana(agoraDoEvento()));
  await say(`🏆 <b>${esc(ev.nome)} foi derrotado pelo grupo!</b>`, 'level');
  if (r.semanaNova) {
    S.money += ev.recompensa.dinheiro || 0;
    for (const [k, n] of Object.entries(ev.recompensa.itens || {})) S.bag[k] = (S.bag[k] || 0) + n;
    await say(`Prêmio da semana: ₽${ev.recompensa.dinheiro || 0}${Object.entries(ev.recompensa.itens || {}).map(([k, n]) => `, ${n}× ${ITEMS[k]?.name || k}`).join('')}.`, 'level');
  } else await say('Você já tinha vencido este chefe nesta semana: o prêmio só sai uma vez por semana.', 'muted');
  if (r.primeiraVez) {
    await say(`🌌 Insígnia <b>${esc(ev.badge.nome)}</b> conquistada — título “${esc(ev.badge.titulo)}”. Escolha qual mostrar ao lado do nome na tela 👤 Conta.`, 'level');
    await say(`🔓 <b>${esc(fmt(ev.especie))}</b> está liberado na Pokédex e pra começar novas jornadas!`, 'level');
  }
  if (usuario()) sincronizarComRetentativa().catch(e => console.warn('sincronizar (evento)', e));
}
// Sala de Raide (modo 'raide'): igual à Arena do Chefe — sem run nenhuma pra mexer, prêmio vai pra CONTA
// (darItensDeRaide + registrarVitoriaDeEvento), nunca dinheiro/Rare Candy (isso só existe dentro de uma run).
async function aplicarRaideSemRun(p) {
  const venceu = p.fim === 'A';
  await say(venceu ? '🏆 Vitória do grupo!' : 'O grupo foi derrotado. Dá pra tentar de novo mais tarde — perder não custa nada.', venceu ? 'good' : 'muted');
  if (venceu && p.evento) await premiarRaideSemRun(p.evento);
  return false;   // Sala de Raide nunca é permadeath: não existe run pra acabar
}
async function premiarRaideSemRun(id) {
  const ev = EVENTOS.find(e => e.id === id); if (!ev) return;
  const r = registrarVitoriaDeEvento(ev, idDaSemana(agoraDoEvento()));
  if (r.semanaNova) {
    const itens = Object.fromEntries(Object.entries(ev.recompensa.itens || {}).filter(([k]) => ITEMS[k]?.raide));
    darItensDeRaide(itens);
    const txt = Object.entries(itens).map(([k, n]) => `${n}× ${ITEMS[k].name}`).join(', ');
    await say(`Prêmio da semana: ${txt || 'nenhum item de raide'} (guardados na conta). Dinheiro e Rare Candy só saem em lutas dentro de uma run.`, 'level');
  } else await say('Você já tinha vencido este chefe nesta semana: o prêmio só sai uma vez por semana.', 'muted');
  if (r.primeiraVez) {
    await say(`🌌 Insígnia <b>${esc(ev.badge.nome)}</b> conquistada — título “${esc(ev.badge.titulo)}”. Escolha qual mostrar ao lado do nome na tela 👤 Conta.`, 'level');
    await say(`🔓 <b>${esc(fmt(ev.especie))}</b> está liberado na Pokédex e pra começar novas jornadas!`, 'level');
  }
  if (usuario()) sincronizarComRetentativa().catch(e => console.warn('sincronizar (raide sem run)', e));
}
