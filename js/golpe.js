/* ============ motor do golpe (único: single player e multiplayer) ============ */
// Tudo que acontece quando um Pokémon usa um golpe, muda estágios, pega status ou chega ao fim do turno — com as
// habilidades (habilidades.js) ligadas. Não sabe de tela nem de rede: quem chama passa um `ctx` que diz COMO narrar:
//   ctx.nome(m)      nome pra exibir (single player: HTML com <b>; multiplayer: texto puro)
//   ctx.golpe(g)     nome do golpe pra exibir
//   ctx.say(txt, cls)  narra (pode ser async: o single player espera entre mensagens)
//   ctx.atualizar()  redesenha (barras de HP) — opcional
//   ctx.tremer(m)    animação de quem levou dano — opcional
//   ctx.refDe(m) / ctx.monPorRef(ref)  identificam quem plantou Leech Seed (pra curar no fim do turno) — opcionais
// Golpes especiais (Protect, Rest, Explosion, carga/recarga…) vêm da tabela de especiais.js.
// Sem DOM: importável no Node (tests/golpe.test.js).
import { STAT_PT, AIL_MSG, SELF_TARGETS } from './dados.js';
import { hab } from './habilidades.js';
import { especial } from './especiais.js';
import { calcDamage, confDamage, heal, typeEff, chanceAcerto, imuneAoStatusMon, danoResidual, chanceOhko } from './regras.js';
import { rand, clamp, fmt } from './util.js';

const nada = () => {};
const up = ctx => (ctx.atualizar || nada)();

// Golpe em que o Pokémon está travado (carregando, em fúria) — a escolha do jogador/IA é ignorada neste turno
export const golpeTravado = m => m.vol?.carregando || m.vol?.furia?.golpe || null;
// Algo impediu de agir: carga e fúria se perdem (como nos jogos)
function interromper(u) { delete u.vol.carregando; delete u.vol.invul; delete u.vol.furia; }
// Fim da rodada (depois de todos agirem): proteções de um turno só acabam
export function fimDaRodada(m) { if (!m.vol) return; m.vol.flinch = false; m.vol.protegido = false; m.vol.aguenta = false; }

// Muda estágios. `fonte` = quem causou (se for outro Pokémon, Clear Body & cia. podem impedir a queda)
export async function mudarEstagios(m, mudancas, ctx, fonte = null) {
  const h = hab(m);
  for (const c of mudancas) {
    if (!(c.stat in m.vol.stages)) continue;
    if (c.change < 0 && fonte && fonte !== m && (h.semQueda === 'todas' || h.semQueda?.includes(c.stat))) {
      await ctx.say(`A habilidade ${fmt(m.ability)} de ${ctx.nome(m)} impede que ${STAT_PT[c.stat]} caia!`); continue;
    }
    const cur = m.vol.stages[c.stat], nv = clamp(cur + c.change, -6, 6);
    if (nv === cur) { await ctx.say(`${STAT_PT[c.stat]} de ${ctx.nome(m)} não pode ${c.change > 0 ? 'subir' : 'cair'} mais!`); continue; }
    m.vol.stages[c.stat] = nv;
    const d = Math.abs(c.change), subiu = c.change > 0;
    await ctx.say(`${STAT_PT[c.stat]} de ${ctx.nome(m)} ${subiu ? (d >= 3 ? 'subiu drasticamente' : d === 2 ? 'subiu muito' : 'subiu') : (d >= 3 ? 'caiu drasticamente' : d === 2 ? 'caiu muito' : 'caiu')}!`, subiu ? 'good' : 'status');
  }
  up(ctx);
}

// Aplica status (inclui confusão). `avisar` = narra por que não pegou (golpe de status); secundário falha calado.
export async function aplicarStatus(t, ail, ctx, avisar = false) {
  if (imuneAoStatusMon(t, ail)) {
    if (avisar) await ctx.say(hab(t).imuneStatus?.includes(ail) ? `A habilidade ${fmt(t.ability)} de ${ctx.nome(t)} impede isso!` : `Não afeta ${ctx.nome(t)}...`);
    return;
  }
  if (ail === 'confusion') {
    if (t.vol.conf > 0) { if (avisar) await ctx.say(`${ctx.nome(t)} já está confuso!`); return; }
    t.vol.conf = rand(2, 5); await ctx.say(`${ctx.nome(t)} ficou confuso!`, 'status'); return;
  }
  if (!AIL_MSG[ail]) { if (avisar) await ctx.say('Mas nada aconteceu... (efeito ainda não implementado)', 'muted'); return; }
  if (t.status) { if (avisar) await ctx.say(`${ctx.nome(t)} já tem uma condição de status.`); return; }
  t.status = ail; delete t.vol.toxico; if (ail === 'sleep') t.sleep = rand(2, 4);
  up(ctx); await ctx.say(`${ctx.nome(t)} ${AIL_MSG[ail]}!`, 'status');
  return true;
}

// Golpes de status com regra própria (especiais.js). true = tratou (o genérico não roda).
async function statusEspecial(u, t, g, esp, ctx) {
  const U = ctx.nome(u), T = ctx.nome(t);
  if (esp.protege) {
    // repetir seguido: 1/3, 1/9… de chance
    const n = u.vol.protSeguidas || 0;
    if (Math.random() < 1 / 3 ** n) { u.vol.protegido = true; u.vol.protSeguidas = n + 1; await ctx.say(`${U} se protegeu!`, 'good'); }
    else { u.vol.protSeguidas = 0; await ctx.say('Mas falhou!'); }
    return true;
  }
  if (esp.aguentaTurno) {
    const n = u.vol.protSeguidas || 0;
    if (Math.random() < 1 / 3 ** n) { u.vol.aguenta = true; u.vol.protSeguidas = n + 1; await ctx.say(`${U} se preparou para aguentar!`, 'good'); }
    else { u.vol.protSeguidas = 0; await ctx.say('Mas falhou!'); }
    return true;
  }
  if (esp.foco) {
    if (u.vol.foco) { await ctx.say('Mas falhou!'); return true; }
    u.vol.foco = esp.foco; await ctx.say(`${U} está concentrado! (chance de crítico maior)`, 'good'); return true;
  }
  if (esp.descanso) {
    if (u.hp >= u.stats.hp) { await ctx.say(`O HP de ${U} já está cheio!`); return true; }
    if (imuneAoStatusMon(u, 'sleep')) { await ctx.say('Mas falhou!'); return true; }
    u.hp = u.stats.hp; u.status = 'sleep'; u.sleep = 3; delete u.vol.toxico; up(ctx);
    await ctx.say(`${U} dormiu e recuperou todo o HP!`, 'good'); return true;
  }
  if (esp.toxico) {
    const antes = t.status;
    if (await aplicarStatus(t, 'poison', ctx, true) && !antes) { t.vol.toxico = 1; await ctx.say(`O veneno em ${T} é grave!`, 'status'); }
    return true;
  }
  if (esp.semente) {
    if (t.data.types.includes('grass')) { await ctx.say(`Não afeta ${T}...`); return true; }
    if (t.vol.semente != null) { await ctx.say(`${T} já está semeado!`); return true; }
    t.vol.semente = ctx.refDe ? ctx.refDe(u) : true; await ctx.say(`${T} foi semeado!`, 'status'); return true;
  }
  return false;
}

async function golpeDeStatus(u, t, g, selfT, ctx) {
  if (await statusEspecial(u, t, g, especial(g), ctx)) return;
  const meta = g.meta || {}; let fez = false;
  if (meta.heal > 0) {
    fez = true;
    if (u.hp >= u.stats.hp) await ctx.say(`O HP de ${ctx.nome(u)} já está cheio!`);
    else { heal(u, Math.floor(u.stats.hp * meta.heal / 100)); up(ctx); await ctx.say(`${ctx.nome(u)} recuperou HP.`, 'good'); }
  }
  if (g.stats.length) { fez = true; const alvo = selfT || meta.cat === 'damage+raise' ? u : t; await mudarEstagios(alvo, g.stats, ctx, u); }
  if (meta.ailment && meta.ailment !== 'none') {
    fez = true;
    if (Math.random() * 100 < (meta.ailChance || 100)) await aplicarStatus(selfT ? u : t, meta.ailment, ctx, true);
  }
  if (!fez) await ctx.say('Mas nada aconteceu... (efeito ainda não implementado no protótipo)', 'muted');
}

// `primeiro` = u agiu antes de t neste turno (recuo só vale assim)
export async function usarGolpe(u, t, g, primeiro, ctx) {
  const U = ctx.nome(u), hu = hab(u);
  if (u.vol.recarga) { delete u.vol.recarga; await ctx.say(`${U} precisa recarregar!`); return; }  // Hyper Beam & cia.
  const travado = golpeTravado(u);                                                    // carga / fúria: repete sozinho
  if (travado) g = travado;
  if (u.status === 'sleep') {
    u.sleep -= hu.sonoRapido ? 2 : 1;                                                  // Early Bird
    if (u.sleep > 0) { interromper(u); await ctx.say(`${U} está dormindo profundamente.`); return; }
    u.status = null; u.sleep = 0; up(ctx); await ctx.say(`${U} acordou!`);
  }
  if (u.status === 'freeze') {
    if (Math.random() < 0.2) { u.status = null; up(ctx); await ctx.say(`${U} descongelou!`); }
    else { interromper(u); await ctx.say(`${U} está congelado!`); return; }
  }
  if (u.status === 'paralysis' && Math.random() < 0.25) { interromper(u); await ctx.say(`${U} está paralisado e não consegue se mover!`); return; }
  if (u.vol.flinch) { u.vol.flinch = false; interromper(u); await ctx.say(`${U} recuou e não conseguiu atacar!`); return; }
  if (u.vol.conf > 0) {
    u.vol.conf--;
    if (u.vol.conf === 0) await ctx.say(`${U} não está mais confuso.`);
    else {
      await ctx.say(`${U} está confuso...`);
      if (Math.random() < 1 / 3) { interromper(u); const d = confDamage(u); u.hp = Math.max(0, u.hp - d); up(ctx); (ctx.tremer || nada)(u); await ctx.say(`Ele se machucou na confusão! (−${d})`, 'hit'); return; }
    }
  }
  const esp = especial(g);
  if (!esp.protege && !esp.aguentaTurno) u.vol.protSeguidas = 0;
  // golpe de carga, 1º turno: gasta PP, prepara (e some, se for Fly/Dig…) e ataca só no próximo
  if (esp.carga && !u.vol.carregando) {
    if (g.ppLeft !== undefined) g.ppLeft = Math.max(0, g.ppLeft - 1);
    u.vol.carregando = g; if (esp.invulneravel) u.vol.invul = true;
    await ctx.say(`${U} está se preparando para usar ${ctx.golpe(g)}!`); return;
  }
  if (esp.carga) { delete u.vol.carregando; delete u.vol.invul; }                    // 2º turno: não gasta PP de novo
  else if (!travado && g.ppLeft !== undefined) g.ppLeft = Math.max(0, g.ppLeft - 1);  // fúria: só o 1º turno gasta
  if (esp.furia && !u.vol.furia) u.vol.furia = { golpe: g, turnos: rand(2, 3) };
  await ctx.say(`${U} usou ${ctx.golpe(g)}!`);

  const res = await executar(u, t, g, primeiro, ctx, esp);
  if (esp.autoDesmaio && u.hp > 0) { u.hp = 0; up(ctx); (ctx.tremer || nada)(u); await ctx.say(`${U} desmaiou com o esforço!`, 'hit'); }
  if (esp.recarga && res === 'acertou' && u.hp > 0) u.vol.recarga = true;
  if (u.vol.furia && --u.vol.furia.turnos <= 0) {
    delete u.vol.furia;
    if (u.hp > 0) { await ctx.say(`${U} se cansou da fúria...`); await aplicarStatus(u, 'confusion', ctx); }
  }
}

// O golpe em si, depois de "X usou Y!". Devolve 'acertou' quando o golpe de dano conectou (Hyper Beam só recarrega assim).
async function executar(u, t, g, primeiro, ctx, esp) {
  const U = ctx.nome(u), T = ctx.nome(t), hu = hab(u), ht = hab(t);
  const selfT = SELF_TARGETS.has(g.target), meta = g.meta || {};
  if (!selfT && t.vol.protegido) { await ctx.say(`${T} se protegeu do golpe!`); return; }
  if (!selfT && t.vol.invul) { await ctx.say('Mas errou!'); return; }                 // alvo no ar / debaixo da terra
  if (esp.soDormindo && t.status !== 'sleep') { await ctx.say(`Não afeta ${T}... (só funciona em quem está dormindo)`); return; }
  if (esp.ohko) {
    if (typeEff(g.type, t.data.types) === 0) { await ctx.say(`Não afeta ${T}...`); return; }
    if (ht.aguenta) { await ctx.say(`${T} aguentou firme graças a ${fmt(t.ability)}!`); return; }     // Sturdy
    if (Math.random() >= chanceOhko(u, t)) { await ctx.say(t.level > u.level ? 'Mas falhou! (o alvo tem nível maior)' : 'Mas errou!'); return; }
    t.hp = 0; up(ctx); (ctx.tremer || nada)(t); await ctx.say('É um nocaute de um golpe só!', 'crit'); return 'acertou';
  }
  if (!selfT && g.acc != null && Math.random() > chanceAcerto(g, u, t)) { await ctx.say('Mas errou!'); return; }
  if (g.cls === 'status') { await golpeDeStatus(u, t, g, selfT, ctx); up(ctx); return; }

  // imunidades e absorções de tipo por habilidade
  if (ht.imuneTipo === g.type) { await ctx.say(`${T} não é afetado graças a ${fmt(t.ability)}!`); return; }
  if (ht.absorve === g.type) {
    await ctx.say(`A habilidade ${fmt(t.ability)} de ${T} absorveu o golpe!`);
    if (ht.cura && t.hp < t.stats.hp) { heal(t, Math.floor(t.stats.hp * ht.cura)); up(ctx); await ctx.say(`${T} recuperou HP.`, 'good'); }
    if (ht.estagio) await mudarEstagios(t, [{ stat: ht.estagio[0], change: ht.estagio[1] }], ctx);
    if (ht.flashFire) t.vol.flashFire = true;
    return;
  }
  const ef = typeEff(g.type, t.data.types);
  if (ef === 0) { await ctx.say(`Não afeta ${T}...`); return; }
  if (ht.soSuperEfetivo && ef <= 1) { await ctx.say(`${T} não é afetado graças a ${fmt(t.ability)}!`); return; } // Wonder Guard

  if (esp.danoIgualHp) {                                                               // Endeavor
    if (t.hp <= u.hp) { await ctx.say('Mas falhou!'); return; }
    const d = t.hp - u.hp; t.hp = u.hp; up(ctx); (ctx.tremer || nada)(t); await ctx.say(`${T} perdeu ${d} HP.`, 'hit'); return 'acertou';
  }

  const hits = meta.minHits ? (hu.maxAcertos ? meta.maxHits || meta.minHits : rand(meta.minHits, meta.maxHits || meta.minHits)) : 1;
  const cheio = t.hp >= t.stats.hp;
  let total = 0, acertos = 0, crit = false, aguentou = false, resistiu = false;
  for (let i = 0; i < hits && t.hp > 0; i++) {
    const r = calcDamage(u, t, g);
    let dano = r.dmg;
    if (ht.aguenta && cheio && i === 0 && dano >= t.hp) { dano = t.hp - 1; aguentou = true; }  // Sturdy
    else if (t.vol.aguenta && dano >= t.hp) { dano = t.hp - 1; resistiu = true; }            // Endure
    t.hp = Math.max(0, t.hp - dano); total += dano; acertos++; crit ||= r.crit;
  }
  up(ctx); (ctx.tremer || nada)(t);
  if (crit) await ctx.say('Um golpe crítico!', 'crit');
  if (ef > 1) await ctx.say('É super efetivo!', 'good'); else if (ef < 1) await ctx.say('Não é muito efetivo...');
  if (hits > 1) await ctx.say(`Acertou ${acertos} vez${acertos > 1 ? 'es' : ''}!`);
  await ctx.say(`${T} perdeu ${total} HP.`, 'hit');
  if (aguentou) await ctx.say(`${T} aguentou firme graças a ${fmt(t.ability)}!`, 'status');
  if (resistiu) await ctx.say(`${T} aguentou o golpe!`, 'status');

  if (meta.drain > 0) { const h = Math.max(1, Math.floor(total * meta.drain / 100)); heal(u, h); up(ctx); await ctx.say(`${U} drenou ${h} HP.`, 'good'); }
  else if (meta.drain < 0 && !hu.semDanoRecuo) { const d = Math.max(1, Math.floor(total * -meta.drain / 100)); u.hp = Math.max(0, u.hp - d); up(ctx); await ctx.say(`${U} sofreu ${d} de dano de recuo.`, 'hit'); } // Rock Head
  if (meta.heal > 0 && u.hp > 0) { heal(u, Math.floor(u.stats.hp * meta.heal / 100)); up(ctx); }

  // efeitos secundários: Serene Grace dobra a chance; Shield Dust protege o alvo
  const chance = p => Math.random() * 100 < p * (hu.chanceSecundaria || 1);
  if (g.stats.length && chance(meta.statChance || 100)) {
    if (meta.cat === 'damage+raise' && u.hp > 0) await mudarEstagios(u, g.stats, ctx, u);
    else if (meta.cat !== 'damage+raise' && t.hp > 0 && !ht.semSecundario) await mudarEstagios(t, g.stats, ctx, u);
  }
  if (t.hp > 0 && !ht.semSecundario) {
    if (meta.ailment && meta.ailment !== 'none' && meta.ailChance > 0 && chance(meta.ailChance)) await aplicarStatus(t, meta.ailment, ctx);
    if (meta.flinch > 0 && primeiro && !ht.semRecuo && chance(meta.flinch)) t.vol.flinch = true;
  }
  // contato (golpe físico): Static, Flame Body, Poison Point; Rough Skin, Iron Barbs
  if (g.cls === 'physical' && u.hp > 0) {
    if (ht.contato && Math.random() * 100 < ht.contato.chance && !u.status) { await ctx.say(`${U} tocou em ${T}...`, 'muted'); await aplicarStatus(u, ht.contato.status, ctx); }
    if (ht.contatoDano) { const d = Math.max(1, Math.floor(u.stats.hp * ht.contatoDano)); u.hp = Math.max(0, u.hp - d); up(ctx); await ctx.say(`${U} se machucou na ${fmt(t.ability)} de ${T}! (−${d})`, 'hit'); }
  }
  return 'acertou';
}

// Fim do turno de um Pokémon em pé: queimadura/veneno (grave cresce a cada turno), Leech Seed, e habilidades de fim
// de turno (Speed Boost, Shed Skin)
export async function fimDeTurno(m, ctx) {
  if (m.hp <= 0) return;
  const h = hab(m);
  if (h.curaStatusFimTurno && m.status && Math.random() < h.curaStatusFimTurno) {
    m.status = null; m.sleep = 0; delete m.vol.toxico; up(ctx); await ctx.say(`${ctx.nome(m)} trocou de pele e se curou! (${fmt(m.ability)})`, 'good');
  }
  const d = danoResidual(m);
  if (d) { m.hp = Math.max(0, m.hp - d); up(ctx); await ctx.say(`${ctx.nome(m)} sofreu com ${m.status === 'burn' ? 'a queimadura' : 'o veneno'}. (−${d})`, 'hit'); }
  if (m.status === 'poison' && m.vol.toxico) m.vol.toxico = Math.min(15, m.vol.toxico + 1);
  if (m.hp > 0 && m.vol.semente != null) {
    const s = Math.min(m.hp, Math.max(1, Math.floor(m.stats.hp / 8)));
    m.hp -= s; up(ctx); await ctx.say(`A semente drenou ${ctx.nome(m)}. (−${s})`, 'hit');
    const quem = ctx.monPorRef?.(m.vol.semente);
    if (quem && quem.hp > 0 && quem.hp < quem.stats.hp) { heal(quem, s); up(ctx); await ctx.say(`${ctx.nome(quem)} recuperou ${s} HP.`, 'good'); }
  }
  if (m.hp > 0 && h.fimTurno) await mudarEstagios(m, [{ stat: h.fimTurno, change: 1 }], ctx);
}
