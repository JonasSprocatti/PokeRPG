/* ============ motor de batalha multiplayer (puro) ============ */
// Batalha entre dois LADOS (A e B) com N Pokémon cada — co-op (jogadores em A contra a IA em B) e, depois, PvP
// (jogadores dos dois lados). Puro: recebe estado + ações, devolve estado NOVO + eventos de texto. Quem roda é o
// anfitrião da sala (multiplayer.js), que manda o resultado pros outros. Sem DOM, sem rede — tests/mp-motor.test.js.
// As contas vêm de regras.js (as mesmas do single player). A narração é texto puro: quem exibe escapa.
//
// Estado: { turno, lados: { A: [mon], B: [mon] }, fugas, fim: null | 'A' | 'B' | 'fuga' }
// mon (fotoDoMon): { ref, dono, nome, level, stats, hp, status, sleep, moves[{…, ppLeft}], ability, data{types…}, vol }
// Ação: { ref, tipo: 'golpe', golpe: índice (-1 = Struggle), alvo: ref } | { ref, tipo: 'fugir' }
import { STAT_PT, AIL_MSG, SELF_TARGETS, STRUGGLE, ABSORB } from './dados.js';
import {
  calcDamage, confDamage, heal, typeEff, effStat, chanceAcerto, imuneAoStatus, danoResidual,
  consegueFugir, ordenarAcoes, freshVol, calcStats
} from './regras.js';
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
    vol: freshVol()
  };
}
// pvp: ninguém foge (só dá pra desistir)
export const novaBatalhaMP = (A, B, opcoes = {}) => ({ turno: 1, lados: { A, B }, fugas: 0, fim: null, pvp: !!opcoes.pvp });

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

// IA do lado B (selvagem/Alfa): golpe aleatório com PP (senão Struggle) num alvo vivo aleatório do outro lado
export function acaoDaIA(e, m, sorte = Math.random) {
  const ok = m.moves.map((g, i) => [g, i]).filter(([g]) => g.ppLeft > 0);
  const alvos = vivosMP(e.lados[outro(ladoDe(e, m.ref))]);
  return { ref: m.ref, tipo: 'golpe', golpe: ok.length ? ok[Math.floor(sorte() * ok.length)][1] : -1, alvo: alvos[Math.floor(sorte() * alvos.length)]?.ref };
}

export function resolverTurnoMP(estado, acoes) {
  const s = structuredClone(estado), ev = [];
  const say = (txt, cls = '') => ev.push({ txt, cls });
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
  const fugindo = s.pvp ? [] : acoes.filter(a => a.tipo === 'fugir' && valida(a) && ladoDe(s, a.ref) === 'A').map(a => monMP(s, a.ref));
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
    return { ...a, m, g, prio: g.priority || 0, vel: effStat(m, 'speed') };
  });
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
    usarGolpe(a.m, t, a.g, pos(t.ref) === -1 || i < pos(t.ref), say);
    if (!vivosMP(s.lados.A).length || !vivosMP(s.lados.B).length) break;
  }

  // 3) fim de turno: queimadura/veneno, desmaios, quem venceu
  if (vivosMP(s.lados.A).length && vivosMP(s.lados.B).length) for (const m of vivosMP(todosMP(s))) {
    const d = danoResidual(m);
    if (d) { m.hp = Math.max(0, m.hp - d); say(`${m.nome} sofreu com ${m.status === 'burn' ? 'a queimadura' : 'o veneno'}. (−${d})`, 'hit'); }
  }
  for (const m of todosMP(s)) { m.vol.flinch = false; if (m.hp <= 0 && !m.caido) { m.caido = true; say(`${m.nome} desmaiou!`, 'hit'); } }
  if (!vivosMP(s.lados.B).length) s.fim = 'A';
  else if (!vivosMP(s.lados.A).length) s.fim = 'B';
  s.turno++;
  return { estado: s, eventos: ev };
}

/* ---- um golpe (versão pura do useMove do single player: mesmas regras, narração em texto) ---- */
function mudarEstagios(m, mudancas, say) {
  for (const c of mudancas) {
    if (!(c.stat in m.vol.stages)) continue;
    const cur = m.vol.stages[c.stat], nv = clamp(cur + c.change, -6, 6);
    if (nv === cur) { say(`${STAT_PT[c.stat]} de ${m.nome} não pode ${c.change > 0 ? 'subir' : 'cair'} mais!`); continue; }
    m.vol.stages[c.stat] = nv;
    const d = Math.abs(c.change), up = c.change > 0;
    say(`${STAT_PT[c.stat]} de ${m.nome} ${up ? (d >= 3 ? 'subiu drasticamente' : d === 2 ? 'subiu muito' : 'subiu') : (d >= 3 ? 'caiu drasticamente' : d === 2 ? 'caiu muito' : 'caiu')}!`, up ? 'good' : 'status');
  }
}
function aplicarStatus(t, ail, say, avisar = false) {
  if (ail === 'confusion') { if (t.vol.conf > 0) { if (avisar) say(`${t.nome} já está confuso!`); return; } t.vol.conf = rand(2, 5); say(`${t.nome} ficou confuso!`, 'status'); return; }
  if (!AIL_MSG[ail]) { if (avisar) say('Mas nada aconteceu...', 'muted'); return; }
  if (t.status) { if (avisar) say(`${t.nome} já tem uma condição de status.`); return; }
  if (imuneAoStatus(t.data.types, ail)) { if (avisar) say(`Não afeta ${t.nome}...`); return; }
  t.status = ail; if (ail === 'sleep') t.sleep = rand(2, 4);
  say(`${t.nome} ${AIL_MSG[ail]}!`, 'status');
}
function usarGolpe(u, t, g, primeiro, say) {
  if (u.status === 'sleep') { u.sleep--; if (u.sleep > 0) { say(`${u.nome} está dormindo profundamente.`); return; } u.status = null; say(`${u.nome} acordou!`); }
  if (u.status === 'freeze') { if (Math.random() < 0.2) { u.status = null; say(`${u.nome} descongelou!`); } else { say(`${u.nome} está congelado!`); return; } }
  if (u.status === 'paralysis' && Math.random() < 0.25) { say(`${u.nome} está paralisado e não consegue se mover!`); return; }
  if (u.vol.flinch) { u.vol.flinch = false; say(`${u.nome} recuou e não conseguiu atacar!`); return; }
  if (u.vol.conf > 0) {
    u.vol.conf--;
    if (!u.vol.conf) say(`${u.nome} não está mais confuso.`);
    else if (Math.random() < 1 / 3) { const d = confDamage(u); u.hp = Math.max(0, u.hp - d); say(`${u.nome} se machucou na confusão! (−${d})`, 'hit'); return; }
  }
  if (g.ppLeft !== undefined) g.ppLeft = Math.max(0, g.ppLeft - 1);
  say(`${u.nome} usou ${fmt(g.name)}!`);
  const selfT = SELF_TARGETS.has(g.target), meta = g.meta || {};
  if (!selfT && g.acc != null && Math.random() > chanceAcerto(g, u, t)) { say('Mas errou!'); return; }
  if (g.cls === 'status') {
    let fez = false;
    if (meta.heal > 0) { fez = true; if (u.hp < u.stats.hp) { heal(u, Math.floor(u.stats.hp * meta.heal / 100)); say(`${u.nome} recuperou HP.`, 'good'); } else say(`O HP de ${u.nome} já está cheio!`); }
    if (g.stats.length) { fez = true; mudarEstagios(selfT || meta.cat === 'damage+raise' ? u : t, g.stats, say); }
    if (meta.ailment && meta.ailment !== 'none') { fez = true; if (Math.random() * 100 < (meta.ailChance || 100)) aplicarStatus(selfT ? u : t, meta.ailment, say, true); }
    if (!fez) say('Mas nada aconteceu...', 'muted');
    return;
  }
  const ab = ABSORB[t.ability];
  if (ab && ab.type === g.type) {
    say(`A habilidade ${fmt(t.ability)} de ${t.nome} anulou o golpe!`);
    if (ab.heal && t.hp < t.stats.hp) { heal(t, Math.floor(t.stats.hp / 4)); say(`${t.nome} recuperou HP.`, 'good'); }
    if (t.ability === 'flash-fire') t.vol.flashFire = true;
    return;
  }
  const ef = typeEff(g.type, t.data.types);
  if (ef === 0) { say(`Não afeta ${t.nome}...`); return; }
  const hits = meta.minHits ? rand(meta.minHits, meta.maxHits || meta.minHits) : 1;
  let total = 0, acertos = 0, crit = false;
  for (let i = 0; i < hits && t.hp > 0; i++) { const r = calcDamage(u, t, g); t.hp = Math.max(0, t.hp - r.dmg); total += r.dmg; acertos++; crit ||= r.crit; }
  if (crit) say('Um golpe crítico!', 'crit');
  if (ef > 1) say('É super efetivo!', 'good'); else if (ef < 1) say('Não é muito efetivo...');
  if (hits > 1) say(`Acertou ${acertos} vez${acertos > 1 ? 'es' : ''}!`);
  say(`${t.nome} perdeu ${total} HP.`, 'hit');
  if (meta.drain > 0) { const h = Math.max(1, Math.floor(total * meta.drain / 100)); heal(u, h); say(`${u.nome} drenou ${h} HP.`, 'good'); }
  else if (meta.drain < 0) { const d = Math.max(1, Math.floor(total * -meta.drain / 100)); u.hp = Math.max(0, u.hp - d); say(`${u.nome} sofreu ${d} de dano de recuo.`, 'hit'); }
  if (g.stats.length && Math.random() * 100 < (meta.statChance || 100)) {
    if (meta.cat === 'damage+raise' && u.hp > 0) mudarEstagios(u, g.stats, say);
    else if (meta.cat !== 'damage+raise' && t.hp > 0) mudarEstagios(t, g.stats, say);
  }
  if (t.hp > 0) {
    if (meta.ailment && meta.ailment !== 'none' && meta.ailChance > 0 && Math.random() * 100 < meta.ailChance) aplicarStatus(t, meta.ailment, say);
    if (meta.flinch > 0 && primeiro && Math.random() * 100 < meta.flinch) t.vol.flinch = true;
  }
}
