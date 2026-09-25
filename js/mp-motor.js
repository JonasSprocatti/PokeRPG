/* ============ motor de batalha multiplayer (puro) ============ */
// Batalha entre dois LADOS (A e B) com N Pokémon cada — co-op (jogadores em A contra a IA em B) e, depois, PvP
// (jogadores dos dois lados). Puro: recebe estado + ações, devolve estado NOVO + eventos de texto. Quem roda é o
// anfitrião da sala (multiplayer.js), que manda o resultado pros outros. Sem DOM, sem rede — tests/mp-motor.test.js.
// O GOLPE em si é o do motor único (golpe.js) — o mesmo do single player, com as habilidades. A narração é texto puro: quem exibe escapa.
//
// Estado: { turno, lados: { A: [mon], B: [mon] }, fugas, fim: null | 'A' | 'B' | 'fuga' }
// mon (fotoDoMon): { ref, dono, nome, level, stats, hp, status, sleep, moves[{…, ppLeft}], ability, data{types…}, vol }
// Ação: { ref, tipo: 'golpe', golpe: índice (-1 = Struggle), alvo: ref } | { ref, tipo: 'fugir' }
import { STRUGGLE } from './dados.js';
import { novoCampo, effStat, consegueFugir, ordenarAcoes, freshVol, calcStats, climaDe, terrenoDe, escolhaIA, ESPERTEZA, multVento } from './regras.js';
import { golpeCanhao, usarItemDeRaide } from './boss.js';
import { usarGolpe, golpeTravado, fimDeTurno, fimDaRodada, passarClima, passarTerreno, passarLados, aoEntrarEmCampo } from './golpe.js';
import { rand, clamp, fmt } from './util.js';

// Cópia enxuta de um Pokémon do jogo pra batalha multiplayer (sem descrições longas: vai pela rede).
// `slot` = 0 principal, 1..2 aliados (índice em S.aliados + 1) — é por ele que o resultado volta pro Pokémon certo.
// Leva base/IVs/EVs/natureza pra dar pra recalcular os stats em outro nível (balancear).
export function fotoDoMon(M, ref, dono, nome, slot = 0) {
  return {
    ref, dono, slot, nome: nome || M.nick || fmt(M.name), id: M.id, name: M.name, level: M.level, shiny: !!M.shiny, ability: M.ability,
    nature: M.nature, ivs: { ...(M.ivs || {}) }, evs: { ...(M.evs || {}) },
    data: { types: [...M.data.types], sprite: M.data.sprite, back: M.data.back, speciesName: M.data.speciesName, baseExp: M.data.baseExp,
      effort: { ...(M.data.effort || {}) }, base: { ...(M.data.base || {}) } },
    stats: { ...M.stats }, hp: M.hp, status: M.status || null, sleep: M.sleep || 0,
    moves: M.moves.map(m => ({ name: m.name, type: m.type, cls: m.cls, power: m.power, acc: m.acc, pp: m.pp, ppLeft: m.ppLeft,
      priority: m.priority || 0, target: m.target, meta: m.meta || {}, stats: m.stats || [] })),
    vol: freshVol(),
    // chefe do evento semanal (boss.js): o estado das mecânicas vai junto pela rede e no estado da sala
    ...(M.boss ? { boss: structuredClone(M.boss), chefeEvento: true } : {})
  };
}
// pvp: ninguém foge (só dá pra desistir)
// `campo` = o que vale pros dois lados (hoje só o clima — regras.CLIMAS)
// `evento` = id do chefe semanal (boss.js) quando a luta é do evento; `revivesUsados` = quantos Revives cada jogador já gastou nela
export const novaBatalhaMP = (A, B, opcoes = {}) => ({ turno: 1, lados: { A, B }, fugas: 0, fim: null, pvp: !!opcoes.pvp, campo: novoCampo(opcoes.zona),
  evento: opcoes.evento || null, revivesUsados: {}, raideUsados: {} });

/* Item de raide no co-op (boss.usarItemDeRaide): ação LIVRE de um jogador do grupo, um de cada tipo por luta pro GRUPO todo (a marca
   fica no `boss.raide` do chefe). Muta o estado — quem chama é o anfitrião. `raideUsados[dono][tipo]` viaja no estado: é por ele que
   cada cliente desconta o item da PRÓPRIA mochila. Devolve { ok, efeitos, motivo? }. */
export function usarRaideNoEvento(estado, dono, tipo) {
  if (!estado?.evento || estado.fim) return { ok: false, efeitos: [], motivo: 'Fora da luta do chefe.' };
  if (!estado.lados.A.some(m => m.dono === dono)) return { ok: false, efeitos: [], motivo: 'Você não está nesta luta.' };
  const E = estado.lados.B.find(m => m.boss && m.hp > 0);
  if (!E) return { ok: false, efeitos: [], motivo: 'O chefe já caiu.' };
  const r = usarItemDeRaide(E, tipo);
  if (r.ok) { const meu = ((estado.raideUsados ||= {})[dono] ||= {}); meu[tipo] = (meu[tipo] || 0) + 1; }
  return r;
}

/* Revive no meio da luta do chefe (só no evento): quem ficou com TODOS os Pokémon caídos enquanto o grupo ainda aguenta pode
   trazer um de volta com um Revive da mochila, com metade do HP. É o que faz valer a pena lutar em equipe: o grupo segura a
   luta e o amigo volta. Devolve o Pokémon revivido, ou null se não pôde (não é evento, não é dele, não está caído, o grupo
   já não aguenta, ou ele já gastou `MAX_REVIVES` nesta luta). Muta o estado — quem chama é o anfitrião. */
export const MAX_REVIVES = 3;
export function reviverNoEvento(estado, ref, dono) {
  if (!estado?.evento || estado.fim) return null;
  const m = monMP(estado, ref);
  if (!m || m.dono !== dono || m.hp > 0 || ladoDe(estado, m.ref) !== 'A') return null;
  if (!estado.lados.A.some(x => x.hp > 0)) return null;                                   // o grupo todo caiu: acabou
  if (estado.lados.A.some(x => x.dono === dono && x.hp > 0)) return null;                // ele ainda tem alguém de pé: não precisa
  const usados = estado.revivesUsados?.[dono] || 0; if (usados >= MAX_REVIVES) return null;
  m.hp = Math.max(1, Math.floor(m.stats.hp / 2)); m.status = null; m.sleep = 0; m.caido = false; m.vol = freshVol();
  (estado.revivesUsados ||= {})[dono] = usados + 1;
  return m;
}

/* ---- balancear ---- */
// mesmo Pokémon em outro nível: recalcula os stats (base/IVs/EVs/natureza) e mantém a FRAÇÃO de HP
// `nivelReal` guarda o nível de verdade (só quem lutou no nível real leva XP/itens de volta pra run — naNivelReal)
export function nivelarMon(m, nivel) {
  const n = structuredClone(m);
  n.nivelReal = m.nivelReal ?? m.level;
  n.level = clamp(Math.round(nivel), 1, 100);
  n.stats = calcStats({ data: { base: m.data.base }, ivs: m.ivs, evs: m.evs, nature: m.nature, level: n.level });
  n.hp = m.hp <= 0 ? 0 : Math.max(1, Math.round(n.stats.hp * m.hp / m.stats.hp));
  return n;
}
// HP máximo (e atual) × fator — pro lado em menor número aguentar a diferença
export function escalarHP(m, fator) {
  const n = structuredClone(m), max = Math.round(m.stats.hp * fator);
  n.hp = m.hp <= 0 ? 0 : Math.max(1, Math.round(max * m.hp / m.stats.hp));
  n.stats.hp = max;
  return n;
}
export const naNivelReal = m => (m.nivelReal ?? m.level) === m.level;
export const nivelMedio = mons => Math.round(mons.reduce((a, m) => a + m.level, 0) / mons.length);
// PvP balanceado: todo mundo no nível médio; o lado com menos Pokémon ganha HP × (maior / menor)
export function balancearPvP(A, B) {
  const nivel = nivelMedio([...A, ...B]);
  let a = A.map(m => nivelarMon(m, nivel)), b = B.map(m => nivelarMon(m, nivel));
  if (a.length < b.length) a = a.map(m => escalarHP(m, b.length / a.length));
  else if (b.length < a.length) b = b.map(m => escalarHP(m, a.length / b.length));
  return { A: a, B: b, nivel };
}
// co-op balanceado ("chamar alguém pra sua run"): o time inteiro no nível do anfitrião
export const balancearCoop = (A, nivel) => A.map(m => nivelarMon(m, nivel));

export const todosMP = e => [...e.lados.A, ...e.lados.B];
export const ladoDe = (e, ref) => e.lados.A.some(m => m.ref === ref) ? 'A' : 'B';
const outro = l => (l === 'A' ? 'B' : 'A');
const vivosMP = l => l.filter(m => m.hp > 0);
export const monMP = (e, ref) => todosMP(e).find(m => m.ref === ref);

// IA do lado B (selvagem/Alfa): escolhe o golpe por regras.escolhaIA (acerta conforme a `esperteza`; sem PP = Struggle)
// num alvo vivo aleatório do outro lado
export function acaoDaIA(e, m, sorte = Math.random, esperteza = ESPERTEZA.selvagem) {
  const alvos = vivosMP(e.lados[outro(ladoDe(e, m.ref))]);
  const alvo = alvos[Math.floor(sorte() * alvos.length)];
  const g = escolhaIA(m.moves, m.data.types, alvo?.data.types || [], esperteza, sorte); // pensa como no single player
  return { ref: m.ref, tipo: 'golpe', golpe: g ? m.moves.indexOf(g) : -1, alvo: alvo?.ref };
}

// async: a narração do motor único (golpe.js) é async (o single player espera entre mensagens); aqui ela só coleta texto.
export async function resolverTurnoMP(estado, acoes) {
  const s = structuredClone(estado), ev = [];
  const say = (txt, cls = '') => ev.push({ txt, cls });
  s.campo ||= { clima: null, turnos: 0, terreno: null, terrenoTurnos: 0, lados: {} }; // batalha de uma versão anterior, sem campo
  const ctx = { nome: m => m.nome, golpe: g => fmt(g.name), say, refDe: m => m.ref, monPorRef: r => monMP(s, r), campo: s.campo, ladoDe: m => ladoDe(s, m.ref) };
  // habilidades de entrada em campo, no 1º turno (Intimidate, Drizzle, Download…): a MESMA regra do single player
  if (s.turno === 1) await aoEntrarEmCampo(vivosMP(todosMP(s)), m => vivosMP(s.lados[outro(ladoDe(s, m.ref))]), ctx);
  if (s.fim) return { estado: s, eventos: ev };
  const valida = a => { const m = monMP(s, a.ref); return m && m.hp > 0; };

  // 0) desistir (PvP): todos os Pokémon do dono daquela ação saem da luta
  for (const a of acoes.filter(x => x.tipo === 'desistir' && valida(x))) {
    const dono = monMP(s, a.ref).dono;
    const dele = todosMP(s).filter(m => m.dono === dono && m.hp > 0);
    for (const m of dele) { m.hp = 0; m.caido = true; }
    say(`${dele[0]?.nome || 'Alguém'} e a equipe desistiram da luta.`, 'hit');
  }

  // 1) fuga (só o lado A, e nunca no PvP): o mais rápido de quem pediu tenta contra o mais rápido do outro lado
  // (pvp e chefe da semana: ninguém foge)
  const fugindo = s.pvp || s.evento ? [] : acoes.filter(a => a.tipo === 'fugir' && valida(a) && ladoDe(s, a.ref) === 'A').map(a => monMP(s, a.ref));
  if (fugindo.length) {
    s.fugas++;
    const quem = fugindo.reduce((a, b) => effStat(b, 'speed') > effStat(a, 'speed') ? b : a);
    const inimigoRapido = Math.max(...vivosMP(s.lados.B).map(m => effStat(m, 'speed')));
    if (consegueFugir(effStat(quem, 'speed'), inimigoRapido, s.fugas, quem.ability)) {
      say(`${quem.nome} achou uma saída e todo mundo fugiu!`, 'good');
      s.fim = 'fuga'; return { estado: s, eventos: ev };
    }
    say(`${quem.nome} tentou fugir, mas não conseguiu!`);
  }

  // 2) golpes na ordem de prioridade e velocidade
  const golpes = acoes.filter(a => a.tipo === 'golpe' && valida(a)).map(a => {
    const m = monMP(s, a.ref), g = a.golpe === -1 || !m.moves[a.golpe] ? STRUGGLE : m.moves[a.golpe];
    return { ...a, m, g, prio: g.priority || 0, vel: effStat(m, 'speed', false, true, climaDe(s.campo), terrenoDe(s.campo)) * multVento(s.campo.lados?.[ladoDe(s, m.ref)]) }; // clima entra aqui (Swift Swim…)
  });
  // o que cada um vai usar neste turno (Sucker Punch: só funciona contra quem vai atacar); limpo em fimDaRodada
  for (const m of todosMP(s)) delete m.vol.golpeEscolhido;
  for (const a of golpes) a.m.vol.golpeEscolhido = golpeTravado(a.m) || a.g;
  const ordem = ordenarAcoes(golpes), pos = ref => ordem.findIndex(o => o.ref === ref);
  for (let i = 0; i < ordem.length; i++) {
    const a = ordem[i];
    if (a.m.hp <= 0) continue;
    // alvo caiu antes: mira outro vivo do mesmo lado; ninguém sobrou = batalha acabou
    let t = monMP(s, a.alvo);
    if (!t || t.hp <= 0 || ladoDe(s, t.ref) === ladoDe(s, a.ref)) {
      const vivos = vivosMP(s.lados[outro(ladoDe(s, a.ref))]);
      if (!vivos.length) break;
      t = vivos[rand(0, vivos.length - 1)];
    }
    await usarGolpe(a.m, t, a.g, pos(t.ref) === -1 || i < pos(t.ref), ctx);
    // o golpe carregado do chefe atinge o TIME INTEIRO (boss.antesDoChefeAgir → `todos`): os outros alvos levam o mesmo golpe
    if (a.m.boss?.soltouTodos) {
      a.m.boss.soltouTodos = false;
      const canhao = golpeCanhao(a.m.boss.id, a.m.boss.canhaoUltimoMult);   // o Escudo Astral (se usado) vale pro time inteiro
      for (const x of vivosMP(s.lados[outro(ladoDe(s, a.m.ref))])) if (x !== t) await usarGolpe(a.m, x, canhao, true, ctx, { extra: true });
    }
    if (!vivosMP(s.lados.A).length || !vivosMP(s.lados.B).length) break;
  }

  // 3) fim de turno: queimadura/veneno, desmaios, quem venceu
  if (vivosMP(s.lados.A).length && vivosMP(s.lados.B).length) { for (const m of vivosMP(todosMP(s))) await fimDeTurno(m, ctx); await passarClima(s.campo, ctx); await passarTerreno(s.campo, ctx); await passarLados(s.campo, ctx); } // + Speed Boost, Shed Skin, clima
  for (const m of todosMP(s)) { fimDaRodada(m); if (m.hp <= 0 && !m.caido) { m.caido = true; say(`${m.nome} desmaiou!`, 'hit'); } }
  if (!vivosMP(s.lados.B).length) s.fim = 'A';
  else if (!vivosMP(s.lados.A).length) s.fim = 'B';
  s.turno++;
  return { estado: s, eventos: ev };
}

