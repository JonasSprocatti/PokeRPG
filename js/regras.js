/* ============ regras ============ */
// Fórmulas puras (recebem dado, devolvem dado). Sem DOM, sem rede, sem estado global:
// importável direto no Node — é o que tests/regras.test.js cobre.
// A aleatoriedade usa Math.random/rand direto; os testes substituem Math.random quando precisam.
import { API, STATS, STAT_PT, CHART, NATURES } from './dados.js';
import { hab } from './habilidades.js';
import { especial } from './especiais.js';
import { seg, multDanoDoItem } from './segurados.js';
import { rand, clamp, fmt } from './util.js';

export function typeEff(atk, defs) {
  const c = CHART[atk]; if (!c) return 1;
  return defs.reduce((f, d) => f * ((c.im || []).includes(d) ? 0 : c.se.includes(d) ? 2 : c.nv.includes(d) ? 0.5 : 1), 1);
}

export const natureMod = (n, s) => (NATURES[n] || [])[0] === s ? 1.1 : (NATURES[n] || [])[1] === s ? 0.9 : 1;
export const natureLabel = n => { const [u, d] = NATURES[n] || []; return fmt(n) + (u ? ` (+${STAT_PT[u]} −${STAT_PT[d]})` : ' (neutra)'); };

// golpes de dano fixo (ignoram ataque/defesa/tipo)
export const FIXED = {
  'seismic-toss': u => u.level, 'night-shade': u => u.level, 'dragon-rage': () => 40, 'sonic-boom': () => 20,
  'super-fang': (u, t) => Math.floor(t.hp / 2), psywave: u => Math.floor(u.level * rand(50, 150) / 100)
};

export function calcStats(m) {
  const out = {};
  for (const s of STATS) {
    const core = Math.floor((2 * m.data.base[s] + m.ivs[s] + Math.floor(m.evs[s] / 4)) * m.level / 100);
    out[s] = s === 'hp' ? (m.data.base.hp === 1 ? 1 : core + m.level + 10) : Math.floor((core + 5) * natureMod(m.nature, s));
  }
  return out;
}
export function recalc(m) { const old = m.stats.hp; m.stats = calcStats(m); m.hp = clamp(m.hp + (m.stats.hp - old), 0, m.stats.hp); }
export const freshVol = () => ({ stages: { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0 }, conf: 0, flinch: false, flashFire: false });
export const stageMul = n => n >= 0 ? (2 + n) / 2 : 2 / (2 - n);
// quanto o clima mexe num atributo deste Pokémon: habilidade (Swift Swim…) e o bônus do próprio clima (CLIMAS.defesaDe)
export function multStatClima(m, stat, clima) {
  if (!clima || !CLIMAS[clima]) return 1;
  const porTipo = CLIMAS[clima].defesaDe || {};
  const bonus = m.data.types.reduce((a, t) => a * (porTipo[t]?.[stat] || 1), 1);
  return (hab(m).multStatClima?.[clima]?.[stat] || 1) * bonus;
}
// quanto o terreno mexe num atributo (só pra quem está no chão) — Surge Surfer no Campo Elétrico
export const multStatTerreno = (m, stat, terreno) =>
  terreno && noChao(m) ? (hab(m).multStatTerreno?.[terreno]?.[stat] || 1) : 1;
export function effStat(m, stat, crit = false, attacking = true, clima = null, terreno = null) {
  let st = m.vol?.stages[stat] || 0;
  if (crit) { if (attacking && st < 0) st = 0; if (!attacking && st > 0) st = 0; }
  const h = hab(m);
  let v = m.stats[stat] * stageMul(st) * (h.multStat?.[stat] || 1) * (seg(m).multStat?.[stat] || 1); // habilidade e item segurado
  v *= multStatClima(m, stat, clima) * multStatTerreno(m, stat, terreno);         // clima e terreno
  if (m.status && h.comStatus?.[stat]) v *= h.comStatus[stat];                     // Guts, Quick Feet, Marvel Scale
  else if (stat === 'speed' && m.status === 'paralysis') v *= 0.5;                 // (Quick Feet ignora a queda)
  return Math.max(1, Math.floor(v));
}
export function defaultMoves(list, level) {
  const avail = list.filter(m => m.level <= level), seen = new Set(), out = [];
  for (let i = avail.length - 1; i >= 0 && out.length < 4; i--) if (!seen.has(avail[i].name)) { seen.add(avail[i].name); out.push(avail[i]); }
  if (!out.length && list.length) out.push(list[0]);
  if (!out.length) out.push({ name: 'tackle', url: `${API}/move/33/`, level: 1 });
  return out.reverse();
}
// Dano de um golpe. Habilidades (habilidades.js) entram aqui: quem ataca (stab, técnico, crítico, pinch, pouco
// efetivo, queimadura ignorada) e quem recebe (resiste, super efetivo reduzido, HP cheio). Estágios/atributos em effStat.
// Poder de golpe que depende da situação (especiais.js → poder). null = usa o poder da tabela.
export function poderEspecial(u, t, move) {
  const f = especial(move).poder; if (!f) return null;
  const base = move.power || 60, hpU = u.hp / u.stats.hp;
  switch (f) {
    case 'hpBaixo': { const p = Math.floor(48 * u.hp / u.stats.hp); return p <= 1 ? 200 : p <= 4 ? 150 : p <= 9 ? 100 : p <= 16 ? 80 : p <= 32 ? 40 : 20; } // Flail, Reversal
    case 'hpAlto': return Math.max(1, Math.floor(150 * hpU));                                           // Eruption, Water Spout
    case 'giroscopio': return Math.min(150, Math.floor(25 * effStat(t, 'speed') / effStat(u, 'speed')) + 1); // Gyro Ball: mais lento = mais forte
    case 'eletro': { const r = effStat(u, 'speed') / effStat(t, 'speed'); return r >= 4 ? 150 : r >= 3 ? 120 : r >= 2 ? 80 : r >= 1 ? 60 : 40; } // Electro Ball
    case 'dobraAlvoComStatus': return t.status ? base * 2 : base;                                      // Hex
    case 'dobraComStatus': return u.status ? base * 2 : base;                                          // Facade
    case 'dobraAlvoEnvenenado': return t.status === 'poison' ? base * 2 : base;                       // Venoshock
    case 'dobraAlvoMetade': return t.hp <= t.stats.hp / 2 ? base * 2 : base;                           // Brine
  }
  return null;
}
// OHKO (Fissure, Guillotine…): 30% + diferença de nível; alvo de nível maior nunca cai
export const chanceOhko = (u, t) => t.level > u.level ? 0 : Math.min(1, (30 + u.level - t.level) / 100);

/* ---- clima (campo da batalha) ----
   Vive em `campo.clima` (single player: G.B.campo; multiplayer: estado.campo) com `turnos` restantes. Sol e chuva
   mexem no dano de Fogo/Água; areia e granizo machucam quem não é do tipo certo no fim do turno; neve dá Defesa
   pros Gelo. Algumas habilidades ligam o clima ao entrar em campo e outras se aproveitam dele (habilidades.js). */
export const CLIMAS = {
  sol: { nome: 'Sol forte', icone: '☀', comeca: 'O sol fica forte!', acaba: 'O sol voltou ao normal.', sobe: { fire: 1.5 }, desce: { water: 0.5 } },
  chuva: { nome: 'Chuva', icone: '🌧', comeca: 'Começou a chover!', acaba: 'A chuva parou.', sobe: { water: 1.5 }, desce: { fire: 0.5 } },
  areia: { nome: 'Tempestade de areia', icone: '🏜', comeca: 'Uma tempestade de areia se levanta!', acaba: 'A areia baixou.', dano: 1 / 16, poupa: ['rock', 'ground', 'steel'], defesaDe: { rock: { 'special-defense': 1.5 } } },
  granizo: { nome: 'Granizo', icone: '🧊', comeca: 'Começou a cair granizo!', acaba: 'O granizo parou.', dano: 1 / 16, poupa: ['ice'] },
  neve: { nome: 'Neve', icone: '❄', comeca: 'Começou a nevar!', acaba: 'A neve parou.', poupa: ['ice'], defesaDe: { ice: { defense: 1.5 } } }
};
export const CLIMA_TURNOS = 5;

/* ---- lado do campo (telas, proteções e armadilhas) ----
   Cada lado da batalha tem o seu: `campo.lados = { jogador: {...}, inimigo: {...} }` (no multiplayer, A e B).
     reflect/luz/veu   turnos de Reflect, Light Screen e Aurora Veil — cortam dano pela metade
     salvaguarda       turnos sem pegar status
     neblina           turnos em que o inimigo não consegue baixar seus atributos (Mist)
     vento             turnos de Tailwind (velocidade × 2)
     pedras            Stealth Rock posto (true/false)
     espinhos/toxinas  camadas de Spikes e Toxic Spikes
   Armadilha só machuca quem ENTRA em campo — aqui isso acontece quando o treinador (ou a fila de lendários) manda
   o próximo Pokémon. Você nunca troca de Pokémon, então armadilha no seu lado não tem em quem pegar: os golpes
   dizem isso na hora de usar, em vez de fingir que funcionaram. */
export const LADO_VAZIO = () => ({ reflect: 0, luz: 0, veu: 0, salvaguarda: 0, neblina: 0, vento: 0, pedras: false, espinhos: 0, toxinas: 0 });
export const TELA_TURNOS = 5, VENTO_TURNOS = 4;
export const MAX_ESPINHOS = 3, MAX_TOXINAS = 2;
// dano cortado pelas telas do lado de quem DEFENDE (Aurora Veil vale pros dois tipos de golpe)
export function multTelas(lado, move) {
  if (!lado) return 1;
  const fisico = move.cls === 'physical';
  if (lado.veu > 0 || (fisico ? lado.reflect > 0 : lado.luz > 0)) return 0.5;
  return 1;
}
export const temSalvaguarda = lado => !!lado && lado.salvaguarda > 0;
export const temNeblina = lado => !!lado && lado.neblina > 0;
export const multVento = lado => (lado?.vento > 0 ? 2 : 1);
// Stealth Rock: 1/8 do HP máximo, corrigido pela eficácia de Pedra contra o tipo de quem entrou
export const danoPedras = m => Math.max(1, Math.floor(m.stats.hp / 8 * typeEff('rock', m.data.types)));
// Spikes: só pega quem está no chão; 1/8, 1/6 ou 1/4 conforme as camadas
export const danoEspinhos = (m, camadas) => (!camadas || !noChao(m) ? 0 : Math.max(1, Math.floor(m.stats.hp * [0, 1 / 8, 1 / 6, 1 / 4][Math.min(camadas, MAX_ESPINHOS)])));
// Toxic Spikes: Venenoso no chão limpa o campo; Aço e quem voa não ligam; 2 camadas = veneno grave
export function efeitoToxinas(m, camadas) {
  if (!camadas || !noChao(m)) return null;
  if (m.data.types.includes('poison')) return 'limpa';
  if (imuneAoStatus(m.data.types, 'poison') || hab(m).imuneStatus?.includes('poison')) return null;
  return camadas >= MAX_TOXINAS ? 'grave' : 'veneno';
}
// fim da rodada: tudo que conta turno anda um. Devolve o que acabou agora, pra narrar.
export function passarLado(lado) {
  const acabou = [];
  for (const k of ['reflect', 'luz', 'veu', 'salvaguarda', 'neblina', 'vento']) {
    if (lado?.[k] > 0 && --lado[k] === 0) acabou.push(k);
  }
  return acabou;
}
export const NOME_LADO = { reflect: 'Refletir', luz: 'Tela de Luz', veu: 'Véu da Aurora', salvaguarda: 'Salvaguarda', neblina: 'Névoa', vento: 'Vento de Cauda' };

/* ---- terrenos ----
   Também vivem no campo (`campo.terreno` / `campo.terrenoTurnos`) e duram 5 turnos, mas só valem pra quem está NO
   CHÃO: Pokémon do tipo Voador e quem tem Levitate flutuam e ficam de fora de tudo (bônus, cura e proteção). */
export const TERRENOS = {
  eletrico: { nome: 'Campo Elétrico', icone: '⚡', comeca: 'O chão fica eletrizado!', acaba: 'A eletricidade do chão sumiu.', sobe: { electric: 1.3 }, semStatus: ['sleep'] },
  grama: { nome: 'Campo de Grama', icone: '🌿', comeca: 'Cresce grama alta pelo campo!', acaba: 'A grama do campo murchou.', sobe: { grass: 1.3 }, cura: 1 / 16 },
  psiquico: { nome: 'Campo Psíquico', icone: '🔮', comeca: 'O chão fica estranho, quase vivo!', acaba: 'A estranheza do chão passou.', sobe: { psychic: 1.3 }, semPrioridade: true },
  fada: { nome: 'Campo de Névoa', icone: '🌫', comeca: 'Uma névoa cobre o chão!', acaba: 'A névoa do chão se dissipou.', desce: { dragon: 0.5 }, semStatus: 'todos' }
};
export const TERRENO_TURNOS = 5;
export const terrenoDe = campo => (campo?.terrenoTurnos > 0 && TERRENOS[campo.terreno]) ? campo.terreno : null;
// quem está no chão sente o terreno; Voador e Levitate flutuam
export const noChao = m => !m.data.types.includes('flying') && hab(m).imuneTipo !== 'ground';
export function multTerreno(terreno, tipo, atacante) {
  const t = TERRENOS[terreno]; if (!t || !atacante || !noChao(atacante)) return 1;
  return t.sobe?.[tipo] || t.desce?.[tipo] || 1;
}
// o terreno impede este status neste Pokémon? (Campo Elétrico tira o sono; Campo de Névoa tira todos)
export function terrenoBloqueiaStatus(terreno, m, ail) {
  const t = TERRENOS[terreno];
  if (!t?.semStatus || !noChao(m)) return false;
  return t.semStatus === 'todos' || t.semStatus.includes(ail);
}
export const climaDe = campo => (campo?.turnos > 0 && CLIMAS[campo.clima]) ? campo.clima : null;
// multiplicador de dano do clima pro tipo do golpe
export function multClima(clima, tipo) {
  const c = CLIMAS[clima]; if (!c) return 1;
  return c.sobe?.[tipo] || c.desce?.[tipo] || 1;
}
// dano de fim de turno do clima (areia/granizo); 0 = não machuca este Pokémon
export function danoClima(clima, m) {
  const c = CLIMAS[clima];
  if (!c?.dano || (c.poupa || []).some(t => m.data.types.includes(t))) return 0;
  if (hab(m).imuneClima?.includes(clima)) return 0;                       // Sand Veil, Snow Cloak, Ice Body, Magic Guard…
  return Math.max(1, Math.floor(m.stats.hp * c.dano));
}
// precisão que muda com o clima: Thunder/Hurricane acertam sempre na chuva e ficam ruins no sol; Blizzard, no gelo
export const PRECISAO_CLIMA = { thunder: { chuva: 100, sol: 50 }, hurricane: { chuva: 100, sol: 50 }, blizzard: { granizo: 100, neve: 100 } };

// `ladoAlvo` = o lado do campo de quem defende (telas: Reflect, Light Screen, Aurora Veil)
export function calcDamage(u, t, move, clima = null, terreno = null, ladoAlvo = null) {
  if (FIXED[move.name]) return { dmg: Math.max(1, FIXED[move.name](u, t)), crit: false };
  const hu = hab(u), ht = hab(t);
  let power = poderEspecial(u, t, move) ?? (move.power || 60);
  if (hu.tecnico && power <= 60) power = Math.floor(power * 1.5);                   // Technician
  const phys = move.cls === 'physical';
  // estágio de crítico: o do golpe + Focus Energy (u.vol.foco)
  const crit = Math.random() < [1 / 24, 1 / 8, 1 / 2, 1][Math.min(3, (move.meta?.crit || 0) + (u.vol?.foco || 0))];
  const A = effStat(u, phys ? 'attack' : 'special-attack', crit, true, clima, terreno);
  const D = effStat(t, phys ? 'defense' : 'special-defense', crit, false, clima, terreno);
  const base = Math.floor(Math.floor(Math.floor(2 * u.level / 5 + 2) * power * A / D) / 50) + 2;
  let mod = (crit ? hu.critico || 1.5 : 1) * rand(85, 100) / 100;
  if (u.data.types.includes(move.type)) mod *= hu.stab || 1.5;                        // STAB (Adaptability = ×2)
  const ef = typeEff(move.type, t.data.types);
  mod *= ef;
  if (ef > 1 && ht.superEfetivo) mod *= ht.superEfetivo;                            // Filter, Solid Rock
  if (ef < 1 && hu.poucoEfetivo) mod *= hu.poucoEfetivo;                            // Tinted Lens
  if (phys && u.status === 'burn' && !hu.comStatus?.attack && move.name !== 'facade') mod *= 0.5; // Guts e Facade ignoram a queimadura
  if (hu.pinch === move.type && u.hp <= u.stats.hp / 3) mod *= 1.5;                 // Overgrow, Blaze, Torrent, Swarm
  if (u.vol.flashFire && move.type === 'fire') mod *= 1.5;
  if (ht.resiste?.[move.type]) mod *= ht.resiste[move.type];                        // Thick Fat, Heatproof
  if (ht.hpCheio && t.hp >= t.stats.hp) mod *= ht.hpCheio;                          // Multiscale
  mod *= multDanoDoItem(u, { ef, fisico: phys });                                    // item segurado (Orbe da Vida…)
  mod *= multClima(clima, move.type);                                                // sol/chuva (regras.CLIMAS)
  mod *= multTerreno(terreno, move.type, u);                                         // terreno, pra quem está no chão
  mod *= multTelas(ladoAlvo, move);                                                  // telas do lado de quem defende
  return { dmg: Math.max(1, Math.floor(base * mod)), crit };
}
export function confDamage(u) {
  const A = effStat(u, 'attack'), D = effStat(u, 'defense');
  return Math.max(1, Math.floor(Math.floor(Math.floor(2 * u.level / 5 + 2) * 40 * A / D) / 50) + 2);
}
export const heal = (m, h) => { m.hp = Math.min(m.stats.hp, m.hp + h); };

/* ---- extraídas de dentro da batalha (antes eram contas inline em useMove/turn/win/inflict/residual) ---- */

// probabilidade de acertar: precisão do golpe × estágio de precisão de quem usa contra evasão do alvo
export function chanceAcerto(move, user, target, clima = null) {
  const n = clamp((user.vol.stages.accuracy || 0) - (target.vol.stages.evasion || 0), -6, 6), h = hab(user), ht = hab(target);
  const acc = PRECISAO_CLIMA[move.name]?.[clima] ?? move.acc;                        // Thunder na chuva, Blizzard no gelo…
  const esconde = clima && ht.escondeNoClima?.includes(clima) ? 0.8 : 1;             // Sand Veil, Snow Cloak
  return acc / 100 * (n >= 0 ? (3 + n) / 3 : 3 / (3 - n)) * (h.precisao || 1) * (move.cls === 'physical' ? h.precisaoFisica || 1 : 1) * esconde;
}

// imunidades de tipo a status (Elétrico não paralisa, Fogo não queima, Gelo não congela, Venenoso/Aço não envenenam)
export function imuneAoStatus(tipos, ail) {
  return (ail === 'paralysis' && tipos.includes('electric')) || (ail === 'burn' && tipos.includes('fire')) || (ail === 'freeze' && tipos.includes('ice')) || (ail === 'poison' && (tipos.includes('poison') || tipos.includes('steel')));
}
// tipo OU habilidade (Immunity, Limber, Insomnia, Own Tempo…)
export const imuneAoStatusMon = (m, ail) => (ail !== 'confusion' && imuneAoStatus(m.data.types, ail)) || !!hab(m).imuneStatus?.includes(ail);

// dano de queimadura (1/16) e veneno (1/8) no fim do turno, mínimo 1 (como nos jogos); 0 = sem status que cause dano.
// Sem o mínimo, HP máximo < 16 (queimadura) ou < 8 (veneno) dava floor = 0 e o status nunca machucava.
// Veneno grave (Toxic, m.vol.toxico = n): n/16 do HP, n sobe a cada turno (golpe.js fimDeTurno).
export function danoResidual(m) {
  if (m.status === 'poison' && m.vol?.toxico) return Math.max(1, Math.floor(m.stats.hp * m.vol.toxico / 16));
  const frac = m.status === 'burn' ? 16 : m.status === 'poison' ? 8 : 0;
  return frac ? Math.max(1, Math.floor(m.stats.hp / frac)) : 0;
}

// fuga: Run Away ou ser mais rápido garante; senão a chance sobe 30/256 a cada tentativa
export function consegueFugir(velP, velE, tentativas, habilidade, sorte = Math.random()) {
  return habilidade === 'run-away' || velP >= velE || sorte * 256 < Math.floor(velP * 128 / velE) + 30 * tentativas;
}

// true = o jogador age primeiro. Prioridade do golpe decide; empate de prioridade vai pela velocidade; empate total é moeda
export function jogadorAgePrimeiro(pm, em, velP, velE, sorte = Math.random()) {
  if ((pm.priority || 0) !== (em.priority || 0)) return (pm.priority || 0) > (em.priority || 0);
  return velP === velE ? sorte < 0.5 : velP > velE;
}

// Centro Pokémon: preço sobe com o nível pra cura não virar reflexo depois de toda luta.
// ₽50 + ₽15/nível ≈ 1–2 vitórias da faixa em que você está (vitória ≈ ₽11 × nível do inimigo).
export const custoCentro = nivel => 50 + 15 * nivel;
// algo pra curar? (HP, status ou PP) — com tudo cheio o Centro não cobra nem cura
export const precisaCurar = m => m.hp < m.stats.hp || !!m.status || m.moves.some(mv => mv.ppLeft < mv.pp);

// Pokémon de treinador dá 1,5× XP (como nos jogos)
export const xpPorVitoria = (E, deTreinador = false) => Math.max(1, Math.floor(E.data.baseExp * E.level / 7 * (deTreinador ? 1.5 : 1)));

/* ---- batalha com vários Pokémon do mesmo lado (aliados agora, multiplayer depois) ---- */

// Ordena as ações do turno: prioridade maior primeiro, depois velocidade maior; empate = moeda.
// Cada ação: { prio, vel, ... } (o resto passa intacto). Não muta a lista recebida.
export function ordenarAcoes(acoes, sorte = Math.random) {
  return acoes.map(a => ({ a, k: sorte() })).sort((x, y) => (y.a.prio - x.a.prio) || (y.a.vel - x.a.vel) || (x.k - y.k)).map(x => x.a);
}

// IA simples de aliado: o golpe com mais dano esperado (poder × eficácia × STAB) entre os que têm PP.
// Golpe de status vale pouco (poder 0) — só sai se não houver nada melhor. Sem PP nenhum → null (Struggle).
export function melhorGolpe(moves, tiposAtacante, tiposAlvo) {
  let melhor = null, nota = -1;
  for (const m of moves) {
    if (m.ppLeft <= 0) continue;
    const n = (m.cls === 'status' ? 0.1 : (m.power || 60)) * typeEff(m.type, tiposAlvo) * (tiposAtacante.includes(m.type) ? 1.5 : 1);
    if (n > nota) { nota = n; melhor = m; }
  }
  return melhor;
}

/* ---- IA do inimigo ----
   Antes o inimigo sorteava qualquer golpe com PP — dava pra ganhar de Pokémon muito mais forte na sorte. Agora ele
   acerta a escolha com a chance `esperteza`: selvagem erra bastante, treinador pensa melhor, Alfa e lendário quase
   sempre acertam. Quando "pensa", usa o golpe de maior dano esperado (melhorGolpe: poder × eficácia × STAB).
   `sorte` injetável = testável. Devolve o golpe (ou null = Struggle). */
export const ESPERTEZA = { selvagem: 0.5, treinador: 0.75, chefe: 0.9 };
export function escolhaIA(moves, tiposAtacante, tiposAlvo, esperteza = ESPERTEZA.selvagem, sorte = Math.random) {
  const comPP = moves.filter(m => m.ppLeft > 0);
  if (!comPP.length) return null;
  if (sorte() < esperteza) return melhorGolpe(comPP, tiposAtacante, tiposAlvo) || comPP[0];
  return comPP[Math.floor(sorte() * comPP.length)];
}

// O que o aliado faz neste turno, pela ordem dele (ORDENS em dados.js):
//   { golpe }        → usa esse golpe (golpe null = sem PP em nada → Struggle, só no 'livre')
//   { parado: txt }  → não age neste turno (txt vai pro log)
export function golpeDoAliado(ordem, moves, tiposA, tiposAlvo, sorte = Math.random) {
  const comPP = moves.filter(m => m.ppLeft > 0);
  if (ordem === 'parado' || ordem === 'fora') return { parado: 'fica de guarda, sem atacar.' };
  if (ordem === 'status') {
    const st = comPP.filter(m => m.cls === 'status');
    return st.length ? { golpe: st[Math.floor(sorte() * st.length)] } : { parado: 'não tem golpe de status com PP e espera.' };
  }
  if (ordem === 'fraco') {
    const dano = comPP.filter(m => m.cls !== 'status');
    if (!dano.length) return { parado: 'não tem golpe de dano com PP e espera.' };
    return { golpe: dano.reduce((a, m) => (m.power || 60) < (a.power || 60) ? m : a) };
  }
  return { golpe: melhorGolpe(moves, tiposA, tiposAlvo) };
}

/* ---- amizade (Etapa 3.2) ---- */
export const MAX_ALIADOS = 2;
export const AMIZADE_MAX = 100;
// Item que o tipo gosta: +20–35 por oferta (3–5 ofertas pra encher). Item errado: 0–5 (quase nada).
export function ganhoAmizade(tiposDoItem, tiposDoAlvo, sorte = Math.random()) {
  const gosta = tiposDoAlvo.some(t => tiposDoItem.includes(t));
  return gosta ? 20 + Math.floor(sorte * 16) : Math.floor(sorte * 6);
}
// só confia em quem não é muito mais fraco que ele — impede levar um Nv. 55 da Caverna Cerúlea sendo Nv. 5
export const podeFazerAmizade = (nivelAlvo, nivelJogador) => nivelAlvo <= nivelJogador + 5;

// Centro com equipe: cada Pokémon que precisa de cura paga o preço do próprio nível
export const custoCentroEquipe = mons => mons.filter(precisaCurar).reduce((a, m) => a + custoCentro(m.level), 0);
// Desconto por vitória (modo Médio): cada vitória desde a última ida ao Centro tira `pct` do preço (10 × 10% = grátis)
export const custoComDesconto = (custo, vitorias, pct) => Math.round(custo * Math.max(0, 1 - vitorias * pct));

// O item faria efeito neste Pokémon agora? (desmaiado nunca — Potion não revive). `podeSubir` = tem curva de XP
// (o jogador sempre; o aliado se tiver `growth`) — sem ela o Rare Candy não tem como subir o nível.
export function itemTemEfeito(it, M, podeSubir = true) {
  if (it.revive) return M.hp <= 0; // o único que serve em desmaiado — e só nele
  if (M.hp <= 0) return false;
  if (it.heal) return M.hp < M.stats.hp;
  if (it.cure) return !!M.status && (it.cure === 'all' || it.cure.includes(M.status));
  if (it.ether) return M.moves.some(m => m.ppLeft < m.pp);
  if (it.stage) return true;
  if (it.candy) return podeSubir && M.level < 100;
  return false;
}

/* ---- mundo e progressão (Etapa 2) ---- */

export const zonaLiberada = (z, nivel) => nivel >= (z.libera || 1);

// Alfa: HP ×2 e demais stats ×1,3 (arredondado pra baixo). Não muta.
export const MULT_CHEFE = { hp: 2, outros: 1.3 };
export const statsDeChefe = stats => Object.fromEntries(Object.entries(stats).map(([s, v]) => [s, Math.floor(v * (s === 'hp' ? MULT_CHEFE.hp : MULT_CHEFE.outros))]));
export const premioChefe = nivel => nivel * 60;

// Progresso de uma condição de missão (formato em MISSOES, dados.js) sobre o save. Nunca passa do alvo.
export function progressoCondicao(cond, S) {
  const r = S.registro || {}, soma = o => Object.values(o || {}).reduce((a, n) => a + n, 0);
  const [atual, alvo] =
    'derrotar' in cond ? [r.derrotados?.[cond.derrotar] || 0, cond.qtd || 1]
    : 'vitorias' in cond ? [S.wins || 0, cond.vitorias]
    : 'amigos' in cond ? [soma(r.amigos), cond.amigos]
    : 'nivel' in cond ? [S.player.level, cond.nivel]
    : 'chefe' in cond ? [S.chefes?.[cond.chefe] ? 1 : 0, 1]
    : 'treinadores' in cond ? [S.treinadoresVencidos || 0, cond.treinadores]
    : 'missao' in cond ? [(S.missoesFeitas || []).includes(cond.missao) ? 1 : 0, 1]
    : 'dinheiro' in cond ? [S.money || 0, cond.dinheiro]         // ter isso de uma vez (gastar faz cair)
    : 'gasto' in cond ? [S.gasto || 0, cond.gasto]               // total gasto na loja + Centro (S.gasto)
    : 'evolucoes' in cond ? [soma(r.evolucoes), cond.evolucoes]  // suas e dos aliados
    : [0, 1];
  return { atual: Math.min(atual, alvo), alvo, ok: atual >= alvo };
}
// Situação de todas as missões: visíveis e em andamento, prontas pra entregar, feitas e quantas ainda escondidas
export function situacaoMissoes(missoes, S) {
  const feitas = S.missoesFeitas || [], ativas = [], prontas = [];
  let escondidas = 0;
  for (const m of missoes) {
    if (feitas.includes(m.id)) continue;
    if (m.gen && m.gen !== (S.gen || 1)) continue;          // missão de outro mapa (ex.: Alfas de Kanto) nem conta
    if (m.libera && !progressoCondicao(m.libera, S).ok) { escondidas++; continue; }
    const p = progressoCondicao(m.objetivo, S);
    (p.ok ? prontas : ativas).push({ m, ...p });
  }
  return { ativas, prontas, feitas: feitas.length, escondidas };
}

// Desmaio número `n` (já contando este) precisa de Revive? `livres` null = modo sem limite (Fácil)
export const desmaioPrecisaRevive = (n, livres) => livres != null && n > livres;

/* ---- fim de jornada e recordes ---- */

const soma = o => Object.values(o || {}).reduce((a, n) => a + n, 0);
// Números da jornada, tirados do save. Espécie = a inicial (S.especieInicial; save antigo cai na atual).
export function estatisticasDaJornada(S) {
  const r = S.registro || {};
  return {
    especie: S.especieInicial || S.player.data.speciesName, especieFinal: S.player.data.speciesName,
    nivel: S.player.level, vitorias: S.wins || 0, derrotados: soma(r.derrotados), treinadores: S.treinadoresVencidos || 0,
    alfas: Object.keys(S.chefes || {}).length, amigos: soma(r.amigos), evolucoes: soma(r.evolucoes),
    missoes: (S.missoesFeitas || []).length, capturas: S.capturas || 0,
    // mapa (Gen) em que a jornada estava e quantas Gens fechou (venceu os lendários)
    gen: S.gen || 1, gens: (S.gensVencidas || []).length, tempoMs: S.tempoMs || 0, shiny: !!S.player.shiny,
    maxDinheiro: Math.max(S.maxDinheiro || 0, S.money || 0), gasto: S.gasto || 0,
    shiniesVistos: soma(r.shinies), shiniesAmigos: soma(r.shiniesAmigos),
    // cópia do registro por espécie: a Pokédex da carreira (vistos/amigos + sprite pelo id) sai daqui
    registro: JSON.parse(JSON.stringify({ vistos: r.vistos || {}, derrotados: r.derrotados || {}, amigos: r.amigos || {}, evolucoes: r.evolucoes || {}, formas: r.formas || {}, ids: r.ids || {} }))
  };
}
// Pontuação = soma ponderada × multiplicador da dificuldade (Hardcore vale o dobro do Fácil)
export const PESOS_PONTOS = { nivel: 100, vitorias: 10, treinadores: 50, alfas: 300, amigos: 100, evolucoes: 150, missoes: 120, gens: 2000 };
export const pontuacao = (est, multDificuldade = 1) =>
  Math.round(Object.entries(PESOS_PONTOS).reduce((a, [k, p]) => a + (est[k] || 0) * p, 0) * multDificuldade);

export function formatarTempo(ms) {
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'menos de 1 min';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}min` : `${m} min`;
}


// shiny: 1 em 4096 (Gen 6+), sorteado pra todo Pokémon criado — você, selvagem ou de treinador, em qualquer modo
export const CHANCE_SHINY = 1 / 4096;
export const ehShiny = (sorte = Math.random()) => sorte < CHANCE_SHINY;
// Segredo do brilho: ser um Pokémon shiny (1 em 4096) dobra XP e dinheiro e deixa o Centro Pokémon de graça.
// Não está escrito em lugar nenhum da tela inicial — quem tirar um shiny descobre jogando.
export const MULT_SHINY = 2;
export const bonusShiny = S => !!S?.player?.shiny;
export const multShiny = S => bonusShiny(S) ? MULT_SHINY : 1;

/* ---- treinadores caçadores (Etapa 3) ---- */

// prêmio ao derrotar a equipe inteira de um treinador (no lugar do dinheiro por Pokémon selvagem)
export const premioTreinador = equipe => equipe.reduce((a, m) => a + m.level, 0) * 20;

// bola que o treinador carrega, pela faixa de nível da equipe dele
export const bolaPorNivel = nivel => nivel < 20 ? 'poke-ball' : nivel < 40 ? 'great-ball' : 'ultra-ball';

// o treinador gasta a vez lançando bola só quando você está com metade do HP ou menos (60% de chance a cada turno)
export const treinadorLancaBola = (hp, hpMax, bolas, sorte = Math.random()) => bolas > 0 && hp <= hpMax / 2 && sorte < 0.6;

// Fórmula de captura da Gen 3/4. `a` ≥ 255 = captura garantida; senão cada um dos 4 balanços passa com chance b/65536.
export const BONUS_STATUS_CAPTURA = { sleep: 2, freeze: 2, paralysis: 1.5, burn: 1.5, poison: 1.5 };
export function valorCaptura(hp, hpMax, taxa, multBola, status) {
  return Math.floor(Math.floor((3 * hpMax - 2 * hp) * taxa * multBola / (3 * hpMax)) * (BONUS_STATUS_CAPTURA[status] || 1));
}
export function chancePorBalanco(a) {
  if (a >= 255) return 1;
  a = Math.max(1, a);
  return Math.floor(1048560 / Math.floor(Math.sqrt(Math.floor(Math.sqrt(Math.floor(16711680 / a)))))) / 65536;
}
// quantos balanços a bola dá (0–4); 4 = capturado
export function balancosDaCaptura(a, sorte = Math.random) {
  const p = chancePorBalanco(a);
  let n = 0;
  while (n < 4 && sorte() < p) n++;
  return n;
}

// EVs ganhos ao derrotar um Pokémon: teto de 252 por atributo e 510 no total. Devolve [[stat, qtd]], não muta `evs`
export function ganhoDeEVs(evs, effort) {
  let total = STATS.reduce((a, s) => a + evs[s], 0);
  const out = [];
  for (const [s, v] of Object.entries(effort)) {
    const add = Math.min(v, 252 - evs[s], 510 - total);
    if (add > 0) { out.push([s, add]); total += add; }
  }
  return out;
}
