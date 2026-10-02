/* ============ regras ============ */
// Fórmulas puras (recebem dado, devolvem dado). Sem DOM, sem rede, sem estado global:
// importável direto no Node — é o que tests/regras.test.js cobre.
// A aleatoriedade usa Math.random/rand direto; os testes substituem Math.random quando precisam.
import { API, STATS, STAT_PT, CHART, NATURES, ITEMS, DIFICULDADES, SELF_TARGETS } from './dados.js';
import { hab } from './habilidades.js';
import { especial } from './especiais.js';
import { seg, multDanoDoItem, resisteDoItem, multEviolite, multStatDoItem } from './segurados.js';
import { rand, clamp, fmt } from './util.js';
import { GOLPE_FLAGS } from './dados-golpe-flags.js';

export function typeEff(atk, defs) {
  const c = CHART[atk]; if (!c) return 1;
  return defs.reduce((f, d) => f * ((c.im || []).includes(d) ? 0 : c.se.includes(d) ? 2 : c.nv.includes(d) ? 0.5 : 1), 1);
}

/* ---- Terastalização (tera.js) ----
   Quem terastaliza passa a ter UM tipo só — o Tera — para RECEBER golpe. É a parte que muda a luta: um
   Charizard Tera Água deixa de morrer para Pedra.
   No ataque o STAB segue a regra dos jogos, que é generosa de propósito:
     golpe do tipo Tera que TAMBÉM era um tipo original → 2.0  (o prêmio por casar o Tera com o que você já é)
     golpe do tipo Tera que não era original            → 1.5
     golpe de um tipo original que não é o Tera         → 1.5  (você não perde o STAB que já tinha)
     qualquer outro                                     → 1
   `base` é o STAB da habilidade (Adaptability = 2), pra Adaptability continuar valendo em cima disso. */
/* ---- Z-Move (zmove.js) ----
   O Z-Move é o MESMO golpe com o poder convertido: uma vez por batalha, sem efeito secundário novo. A tabela é
   a dos jogos, achatada no topo de propósito — golpe fraco ganha muito, golpe que já é forte ganha pouco. É o
   que faz a escolha ser interessante: usar o Z no golpe de 60 rende mais do que no de 140.
   Fica aqui, e não em zmove.js, porque quem aplica é `calcDamage` — e é aqui que dá pra testar sem batalha. */
export function poderZ(poder) {
  const p = poder || 0;
  if (p <= 55) return 100;
  if (p <= 65) return 120;
  if (p <= 75) return 140;
  if (p <= 85) return 160;
  if (p <= 95) return 175;
  if (p <= 100) return 180;
  if (p <= 110) return 185;
  if (p <= 125) return 190;
  if (p <= 130) return 195;
  return 200;
}

/* ---- Gigantamax (dynamax.js) ----
   Enquanto está gigante, TODO golpe vira um golpe Max. A tabela é mais modesta que a do Z de propósito: o Z é
   um tiro único e pode ser absurdo; o Max vale por três turnos, e no mesmo patamar do Z deixaria a luta sem
   graça. A outra metade da força vem do HP dobrado (dynamax.js), não daqui. */
export function poderMax(poder) {
  const p = poder || 0;
  if (p <= 40) return 90;
  if (p <= 50) return 100;
  if (p <= 60) return 110;
  if (p <= 70) return 120;
  if (p <= 100) return 130;
  if (p <= 140) return 140;
  return 150;
}
// quanto o HP máximo cresce ao gigantamaxar (e por quantos turnos dura)
export const MULT_HP_DYNAMAX = 2;
export const TURNOS_DYNAMAX = 3;

/* ---- leitura de vantagem (a seta nos botões de golpe) ----
   Saber que Água é forte contra Fogo é óbvio pra quem jogou a vida toda e opaco pra quem está começando — e a
   tabela tem 18 tipos, dois tipos por Pokémon e multiplicadores que se multiplicam. Aqui a conta vira uma
   etiqueta e uma seta, que é o que dá pra ler no meio da luta.
   `nivel` vai de -3 a +2 e serve pra CSS/ordenação; `mult` é a conta de verdade, pra quem quiser o número.
   Golpe de status não tem vantagem: ele não usa a tabela de tipos pra nada, e inventar uma seta ali seria
   ensinar errado. */
export const VANTAGENS = [
  { min: 4, nivel: 2, seta: '⏫', rotulo: 'extremamente efetivo', classe: 'v-otimo' },
  { min: 2, nivel: 1, seta: '🔼', rotulo: 'super efetivo', classe: 'v-bom' },
  { min: 1, nivel: 0, seta: '▪', rotulo: 'dano normal', classe: 'v-neutro' },
  { min: 0.5, nivel: -1, seta: '🔽', rotulo: 'pouco efetivo', classe: 'v-ruim' },
  { min: 0.01, nivel: -2, seta: '⏬', rotulo: 'quase sem efeito', classe: 'v-pessimo' },
  { min: 0, nivel: -3, seta: '✖', rotulo: 'não afeta', classe: 'v-nulo' }
];
export function vantagemDoGolpe(golpe, alvo) {
  if (!golpe || !alvo || golpe.cls === 'status') return null;
  const mult = typeEff(golpe.type, tiposDefensivos(alvo));
  return { mult, ...VANTAGENS.find(v => mult >= v.min) };
}

/* O tipo ATUAL na batalha. `vol.tipos` é o tipo TROCADO por um golpe (Soak: o alvo vira Água pura) e mora no
   `vol` de propósito: `m.data` vem do cache e é COMPARTILHADO por todos da espécie — escrever tipo lá
   contaminaria todo Poliwag do jogo e ainda iria junto no save. Como todo `vol`, some no fim da batalha.
   Esta é a fonte ÚNICA pra regra: quem decide dano, imunidade, status, clima ou terreno lê DAQUI, nunca de
   `data.types`. Ficam de fora, de propósito, os leitores de IDENTIDADE da espécie (petisco por tipo em
   amizade.js, condição de evolução em evolucao.js, a ficha em render.js): quem levou Soak não mudou de espécie. */
export const tiposDe = m => m?.vol?.tipos || m?.data?.types || [];
export const tiposDefensivos = m => m?.tera ? [m.tera] : tiposDe(m);
/* O lado OFENSIVO não é o espelho do defensivo: terastalizar troca o tipo com que você DEFENDE (passa a ser um
   só), mas NÃO apaga o STAB dos tipos originais — quem vira Tera de um tipo novo ganha STAB no Tera e continua
   com o dos antigos (é o que `multStab` calcula). Esta lista serve ao julgamento grosso da IA (`melhorGolpe`),
   que só pergunta "esse golpe tem STAB?"; a conta de verdade do dano continua em `multStab`. */
export const tiposOfensivos = m => m?.tera ? [...new Set([m.tera, ...tiposDe(m)])] : tiposDe(m);
/* Tipo Tera SORTEADO do inimigo: qualquer um dos 18, do tipo dele ou não, com a mesma chance. O fator surpresa é
   não dar pra prever pra onde ele vira. `rnd` injetável pros testes. */
export function sortearTipoTera(rnd = Math.random) {
  const tipos = Object.keys(CHART);
  return tipos[Math.floor(rnd() * tipos.length)];
}
export function multStab(m, tipoGolpe, base = 1.5) {
  const originais = tiposDe(m);   // quem virou Água por Soak ganha STAB em golpe de Água, como nos jogos
  if (!m?.tera) return originais.includes(tipoGolpe) ? base : 1;
  if (tipoGolpe === m.tera) return originais.includes(tipoGolpe) ? 2 : base;
  return originais.includes(tipoGolpe) ? base : 1;
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
/* `m.statsChefe` (batalha.js: Alfa e o lendário principal) marca quem recebeu statsDeChefe (HP ×2, resto ×1,3) na
   entrada — um bônus de UMA VEZ, fora do calcStats normal. Sem reaplicar aqui, um chefe que muda de forma no meio
   da luta (Mega, Castform, Aegislash…) perdia o bônus na recontagem: o teto de HP caía pela metade e o `clamp`
   embaixo zerava o HP atual — Alfa mega-evoluindo já saía desmaiado, antes até do aliado bater. Relatado em jogo. */
export function recalc(m) { const old = m.stats.hp; m.stats = m.statsChefe ? statsDeChefe(calcStats(m)) : calcStats(m); m.hp = clamp(m.hp + (m.stats.hp - old), 0, m.stats.hp); }
export const freshVol = () => ({ stages: { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0 }, conf: 0, flinch: false, flashFire: false, paixao: false });
export const stageMul = n => n >= 0 ? (2 + n) / 2 : 2 / (2 - n);
// maior atributo BASE de combate (sem HP), empate desfeito por Ataque > Defesa > At.Esp. > Def.Esp. > Velocidade
// (mesma ordem dos jogos) — Protosynthesis e Quark Drive reforçam esse, seja lá qual for, em vez de um fixo.
const STATS_COMBATE = ['attack', 'defense', 'special-attack', 'special-defense', 'speed'];
export const maiorStatBase = m => STATS_COMBATE.reduce((a, s) => m.data.base[s] > m.data.base[a] ? s : a);
// quanto o clima mexe num atributo deste Pokémon: habilidade (Swift Swim…) e o bônus do próprio clima (CLIMAS.defesaDe)
export function multStatClima(m, stat, clima) {
  if (!clima || !CLIMAS[clima]) return 1;
  const porTipo = CLIMAS[clima].defesaDe || {};
  const bonus = tiposDe(m).reduce((a, t) => a * (porTipo[t]?.[stat] || 1), 1);
  const h = hab(m);
  const maior = h.multMaiorStatClima?.[clima] && stat === maiorStatBase(m) ? multMaiorStat(stat) : 1;
  return (h.multStatClima?.[clima]?.[stat] || 1) * maior * bonus;
}
// Protosynthesis/Quark Drive: ×1,3 no maior atributo, ou ×1,5 se o maior for Velocidade — valor FIXO dos jogos
// (não é um número que a habilidade escolhe, por isso não mora na tabela de habilidades.js).
const multMaiorStat = stat => stat === 'speed' ? 1.5 : 1.3;
// quanto o terreno mexe num atributo (só pra quem está no chão) — Surge Surfer no Campo Elétrico, Quark Drive no Campo Elétrico
export function multStatTerreno(m, stat, terreno) {
  if (!terreno || !noChao(m)) return 1;
  const h = hab(m);
  const maior = h.multMaiorStatTerreno?.[terreno] && stat === maiorStatBase(m) ? multMaiorStat(stat) : 1;
  return (h.multStatTerreno?.[terreno]?.[stat] || 1) * maior;
}
// a habilidade de "força com status" vale pra este status? (Guts: qualquer; Toxic Boost: só veneno; Flare Boost: só queimadura)
export const statusVale = (h, ail) => !h.soStatus || h.soStatus.includes(ail);
/* Golpes por família, pras habilidades que reforçam um tipo de golpe pelo NOME (a PokéAPI não traz essa marca no golpe):
   Iron Fist = soco, Strong Jaw = mordida, Sharpness = corte. */
export const FAMILIAS_GOLPE = {
  soco: ['fire-punch', 'ice-punch', 'thunder-punch', 'mach-punch', 'bullet-punch', 'comet-punch', 'dizzy-punch', 'drain-punch', 'dynamic-punch',
    'focus-punch', 'hammer-arm', 'ice-hammer', 'mega-punch', 'meteor-mash', 'power-up-punch', 'shadow-punch', 'sky-uppercut', 'surging-strikes',
    'wicked-blow', 'plasma-fists', 'jet-punch', 'double-iron-bash', 'rage-fist', 'headlong-rush'],
  mordida: ['bite', 'crunch', 'fire-fang', 'ice-fang', 'thunder-fang', 'poison-fang', 'psychic-fangs', 'hyper-fang', 'jaw-lock', 'fishious-rend'],
  corte: ['slash', 'cut', 'night-slash', 'psycho-cut', 'leaf-blade', 'x-scissor', 'air-slash', 'aerial-ace', 'sacred-sword', 'razor-shell', 'cross-poison',
    'fury-cutter', 'solar-blade', 'stone-axe', 'ceaseless-edge', 'kowtow-cleave', 'secret-sword', 'behemoth-blade', 'bitter-blade', 'aqua-cutter',
    'air-cutter', 'razor-leaf', 'mighty-cleave', 'tachyon-cutter', 'psyblade']
};
export function multFamilia(h, nomeDoGolpe) {
  let mult = 1;
  for (const [fam, m] of Object.entries(h.golpesFamilia || {})) if (FAMILIAS_GOLPE[fam]?.includes(nomeDoGolpe)) mult *= m;
  return mult;
}
/* Flag de golpe de verdade (dados-golpe-flags.js, gerado do repositório-fonte da PokéAPI — a API pública não
   expõe isso). Golpe sem entrada na tabela (novo demais pro dado-fonte, ex. alguns golpes de Gen 9) devolve
   `false` pra qualquer flag — nunca lança, nunca inventa. */
export const temFlag = (move, flag) => !!GOLPE_FLAGS[move.name]?.includes(flag);
/* Faz contato de verdade? Antes disso existir, o jogo usava `move.cls === 'physical'` como PROXY (Earthquake é
   físico e NÃO faz contato, por exemplo) — com golpe MAPEADO na tabela, usa a flag `contact` de verdade; sem
   mapa (golpe fora do dado-fonte), cai pro proxy antigo em vez de dizer "sem contato" à toa. */
export const fazContato = move => GOLPE_FLAGS[move.name] ? temFlag(move, 'contact') : move.cls === 'physical';
// Sheer Force: o golpe tem ALGUM efeito secundário nativo? (estágio, status ou recuo por chance) — se sim, o
// golpe bate mais forte mas PERDE o efeito (golpe.executar guarda os três blocos de aplicação com `!hu.sheerForce`).
export const temSecundario = move => !!(move.stats?.length || (move.meta?.ailment && move.meta.ailment !== 'none' && move.meta?.ailChance > 0) || move.meta?.flinch > 0);
// `semEstagio`: ignora os degraus deste atributo (Unaware de QUEM ESTÁ do outro lado)
export function effStat(m, stat, crit = false, attacking = true, clima = null, terreno = null, semEstagio = false) {
  let st = semEstagio ? 0 : (m.vol?.stages[stat] || 0);
  if (crit) { if (attacking && st < 0) st = 0; if (!attacking && st > 0) st = 0; }
  const h = hab(m);
  let v = m.stats[stat] * stageMul(st) * (h.multStat?.[stat] || 1) * multStatDoItem(m, stat); // habilidade e item segurado (multStatDoItem respeita o `soEspecie`)
  v *= multStatClima(m, stat, clima) * multStatTerreno(m, stat, terreno);         // clima e terreno
  v *= multEviolite(m, stat);                                                     // Eviolite: só se a espécie ainda evolui
  if (h.inicioLento && (stat === 'attack' || stat === 'speed') && (m.vol?.turnosEmCampo || 0) < h.inicioLento) v *= 0.5;   // Slow Start: metade do Ataque e da Velocidade nos primeiros turnos
  if (h.abaixoDeMetade?.[stat] && m.hp <= m.stats.hp / 2) v *= h.abaixoDeMetade[stat]; // Defeatist
  if (m.status && h.comStatus?.[stat] && statusVale(h, m.status)) v *= h.comStatus[stat]; // Guts, Quick Feet, Marvel Scale, Toxic/Flare Boost
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
/* Golpes que chegam JUNTO com a evolução. Duas fontes:
   - NÍVEL 0: é exatamente assim que a PokéAPI marca "aprende ao evoluir" (King's Shield do Aegislash, Stomp do
     Exeggutor). Só conta se a forma anterior não aprendia;
   - o golpe do nível atual, que já era o comportamento antigo.
   **Nível 1 NÃO entra**, e isso foi bug real: a primeira versão pegava `level <= 1`, mas nível 1 é a lista do que a
   espécie saberia se nascesse agora — o Exeggutor tem 17 golpes lá, então uma evolução reescrevia o moveset inteiro
   (relatado em jogo). O golpe de evolução de verdade é um só, e está no nível 0.
   Sem a primeira fonte, quem evoluía acima do nível 1 (ou seja, todo mundo) nunca aprendia o golpe assinatura da
   forma nova. Golpe que a forma antiga já aprendia não conta: seria repetir o que você já viu (ou já esqueceu). */
export function golpesDaEvolucao(antes = [], depois = [], nivel) {
  const tinha = new Set(antes.map(m => m.name)), out = [];
  for (const m of depois) {
    const vale = m.level === 0 ? !tinha.has(m.name) : m.level === nivel;
    if (vale && !out.some(x => x.name === m.name)) out.push(m);
  }
  return out;
}
// Dano de um golpe. Habilidades (habilidades.js) entram aqui: quem ataca (stab, técnico, crítico, pinch, pouco
// efetivo, queimadura ignorada) e quem recebe (resiste, super efetivo reduzido, HP cheio). Estágios/atributos em effStat.
// Poder de golpe que depende da situação (especiais.js → poder). null = usa o poder da tabela.
/* Peso em QUILOS. A PokéAPI manda em hectogramas (`data.weight`); quem baixou a espécie antes deste campo existir
   tem o registro sem ele (api.loadPokemon troca na primeira busca online), e aí não há peso: `null` faz a fórmula
   desistir e vale o poder da tabela, em vez de o golpe bater como se o bicho pesasse zero. */
const pesoKg = m => (typeof m.data?.weight === 'number' ? m.data.weight / 10 : null);
const estagiosPositivos = m => Object.values(m.vol?.stages || {}).reduce((s, n) => s + Math.max(0, n), 0);
export function poderEspecial(u, t, move) {
  const f = especial(move).poder; if (!f) return null;
  const base = move.power || 60, hpU = u.hp / u.stats.hp;
  switch (f) {
    case 'pesoDoAlvo': { const p = pesoKg(t); return p == null ? null : p >= 200 ? 120 : p >= 100 ? 100 : p >= 50 ? 80 : p >= 25 ? 60 : p >= 10 ? 40 : 20; } // Low Kick, Grass Knot
    case 'pesoRelativo': { // Heavy Slam, Heat Crash: quantas vezes você é mais pesado que o alvo
      const a = pesoKg(u), b = pesoKg(t); if (a == null || b == null) return null;
      const r = a / Math.max(0.1, b); return r >= 5 ? 120 : r >= 4 ? 100 : r >= 3 ? 80 : r >= 2 ? 60 : 40;
    }
    case 'estagios': return base + 20 * estagiosPositivos(u);                                           // Stored Power, Power Trip
    case 'estagiosDoAlvo': return Math.min(200, base + 20 * estagiosPositivos(t));                      // Punishment (teto 200 no jogo)
    case 'hpDoAlvo': return Math.max(1, Math.floor(120 * t.hp / t.stats.hp));                           // Wring Out, Crush Grip
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
// `resisteRaide` = { tipo, turnos }: Cinza Vulcânica/Escama Abissal (itens de raide, boss.js) — resiste um tipo por N turnos
export const LADO_VAZIO = () => ({ reflect: 0, luz: 0, veu: 0, salvaguarda: 0, neblina: 0, vento: 0, pedras: false, espinhos: 0, toxinas: 0, resisteRaide: null });
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
// Cinza Vulcânica/Escama Abissal (item de raide): dano recebido daquele tipo, pela metade
export const multResisteRaide = (lado, tipo) => (lado?.resisteRaide?.tipo === tipo ? 0.5 : 1);
// Stealth Rock: 1/8 do HP máximo, corrigido pela eficácia de Pedra contra o tipo de quem entrou
export const danoPedras = m => Math.max(1, Math.floor(m.stats.hp / 8 * typeEff('rock', tiposDefensivos(m))));
// Spikes: só pega quem está no chão; 1/8, 1/6 ou 1/4 conforme as camadas
export const danoEspinhos = (m, camadas) => (!camadas || !noChao(m) ? 0 : Math.max(1, Math.floor(m.stats.hp * [0, 1 / 8, 1 / 6, 1 / 4][Math.min(camadas, MAX_ESPINHOS)])));
// Toxic Spikes: Venenoso no chão limpa o campo; Aço e quem voa não ligam; 2 camadas = veneno grave
export function efeitoToxinas(m, camadas) {
  if (!camadas || !noChao(m)) return null;
  if (tiposDe(m).includes('poison')) return 'limpa';
  if (imuneAoStatus(tiposDe(m), 'poison') || hab(m).imuneStatus?.includes('poison')) return null;
  return camadas >= MAX_TOXINAS ? 'grave' : 'veneno';
}
// fim da rodada: tudo que conta turno anda um. Devolve o que acabou agora, pra narrar.
export function passarLado(lado) {
  const acabou = [];
  for (const k of ['reflect', 'luz', 'veu', 'salvaguarda', 'neblina', 'vento']) {
    if (lado?.[k] > 0 && --lado[k] === 0) acabou.push(k);
  }
  if (lado?.resisteRaide && --lado.resisteRaide.turnos <= 0) { lado.resisteRaide = null; acabou.push('resisteRaide'); }
  return acabou;
}
export const NOME_LADO = { reflect: 'Refletir', luz: 'Tela de Luz', veu: 'Véu da Aurora', salvaguarda: 'Salvaguarda', neblina: 'Névoa', vento: 'Vento de Cauda', resisteRaide: 'A proteção elemental' };

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

/* ---- clima e terreno PADRÃO da rota ----
   Algumas rotas nascem com o tempo/chão da paisagem: neve em Caverna Gelada, areia no deserto, grama nos bosques.
   Vale pros dois lados e desde o 1º turno. É PERMANENTE (`climaFixo`/`terrenoFixo`: o contador não anda) até algum
   golpe ou habilidade trocar; a troca dura os 5 turnos de sempre e, quando acaba, a rota volta ao padrão dela
   (`campo.padrao`). Chave = id da rota (dados-mapas.js). Rota fora da tabela = campo limpo, como sempre foi. */
export const CLIMA_DA_ROTA = {
  // clima
  'k-ilhas': { clima: 'chuva' }, caverna: { clima: 'chuva' }, 'j-olivine': { clima: 'chuva' }, 'j-furia': { clima: 'chuva' }, 'j-gelo': { clima: 'granizo' },
  'h-deserto': { clima: 'areia' }, 'h-chimney': { clima: 'sol' }, 'h-mar': { clima: 'chuva' },
  's-eolico': { clima: 'sol' }, 's-pantano': { clima: 'chuva' }, 's-neve': { clima: 'neve' },
  'u-deserto': { clima: 'areia' }, 'u-gelada': { clima: 'neve' }, 'u-humilau': { clima: 'chuva' },
  'ka-frost': { clima: 'neve' }, 'ka-pantano': { clima: 'chuva' }, 'ka-azure': { clima: 'sol' },
  'a-wela': { clima: 'sol' }, 'a-hano': { clima: 'sol' }, 'a-lanakila': { clima: 'neve' }, 'a-poni': { clima: 'areia' },
  'g-rota8': { clima: 'neve' }, 'g-coroa': { clima: 'neve' }, 'g-miloc': { clima: 'chuva' },
  'p-glaseado': { clima: 'neve' }, 'p-asado': { clima: 'areia' }, 'p-casseroya': { clima: 'chuva' },
  // terreno
  'k-usina': { terreno: 'eletrico' }, floresta: { terreno: 'grama' }, 'j-ilex': { terreno: 'grama' }, 'j-ruinas': { terreno: 'psiquico' },
  'h-petalburgo': { terreno: 'grama' }, 'h-pilar': { terreno: 'psiquico' }, 's-eterna': { terreno: 'grama' },
  'u-chargestone': { terreno: 'eletrico' }, 'u-pinwheel': { terreno: 'grama' }, 'u-sonhos': { terreno: 'grama' }, 'u-celestial': { terreno: 'psiquico' },
  'ka-santalune': { terreno: 'grama' }, 'ka-usina': { terreno: 'eletrico' }, 'ka-riviere': { terreno: 'fada' },
  'a-selva': { terreno: 'grama' }, 'a-altar': { terreno: 'psiquico' },
  'g-hammerlocke': { terreno: 'eletrico' }, 'g-glimwood': { terreno: 'fada' },
  'p-tagtree': { terreno: 'grama' }, 'p-zero': { terreno: 'psiquico' }
};
// Esta jornada usa o clima/terreno das rotas? Roguelike e Hardcore: sempre (`climaRotasFixo`). Os outros modos: só se
// o jogador ligou na criação (`S.climaRotas`). Save antigo sem o campo cai na regra do modo.
export const climaDasRotasAtivo = S => !!(DIFICULDADES[S?.dificuldade]?.climaRotasFixo || S?.climaRotas);
// o campo de uma batalha nova naquela rota (sem rota, ou rota sem padrão, = campo limpo)
export function novoCampo(rotaId) {
  const p = CLIMA_DA_ROTA[rotaId] || {};
  return {
    clima: p.clima || null, turnos: p.clima ? CLIMA_TURNOS : 0, climaFixo: !!p.clima,
    terreno: p.terreno || null, terrenoTurnos: p.terreno ? TERRENO_TURNOS : 0, terrenoFixo: !!p.terreno,
    padrao: { clima: p.clima || null, terreno: p.terreno || null }, lados: {}
  };
}

/* Weather Ball: o tipo e o poder seguem o tempo (sol Fogo, chuva Água, areia Pedra, granizo/neve Gelo; poder ×2).
   Devolve uma CÓPIA do golpe — o gasto de PP e a lista de golpes seguem no original. Sem tempo, é o Normal de 50. */
export const TIPO_BOLA_DO_TEMPO = { sol: 'fire', chuva: 'water', areia: 'rock', granizo: 'ice', neve: 'ice' };
export function golpeDoClima(g, clima) {
  if (g?.name !== 'weather-ball' || !TIPO_BOLA_DO_TEMPO[clima]) return g;
  return { ...g, type: TIPO_BOLA_DO_TEMPO[clima], power: (g.power || 50) * 2 };
}
/* Tera Blast: o tipo segue o Tera de QUEM USA (não muda de categoria física/especial — simplificação; o poder já
   vem certo da PokéAPI). Sem terastalizar, continua Fogo/Normal do golpe original. Relatado em jogo: o golpe
   nunca mudava de tipo depois de terastalizar. */
export function golpeDoTera(g, u) {
  if (g?.name !== 'tera-blast' || !u?.tera) return g;
  return { ...g, type: u.tera };
}
/* Battle Bond (Ash-Greninja): Water Shuriken vira poder fixo 20 e SEMPRE 3 acertos (a versão normal é poder 15,
   2 a 5 acertos aleatórios). Texto oficial da habilidade na PokéAPI: "Water Shuriken's power is 20 and always
   hits three times." Sem virar Ash-Greninja, o golpe original continua valendo. */
export function golpeDoBattleBond(g, u) {
  if (g?.name !== 'water-shuriken' || !u?.ashGreninja) return g;
  return { ...g, power: 20, meta: { ...g.meta, minHits: 3, maxHits: 3 } };
}
/* Aerilate/Pixilate/Refrigerate/Galvanize (Normal vira Voador/Fada/Gelo/Elétrico, ×1,3) e Normalize (QUALQUER
   golpe vira Normal — `de: '*'`, sem reforço de poder): entra ANTES de calcDamage, igual golpeDoClima/golpeDoTera.
   De propósito ANTES do Tera/Battle Bond na ordem de `executar()`: Weather Ball sem clima ativo continua Normal
   (golpeDoClima não mexeu nele) e É convertido aqui — igual nos jogos de verdade (Pixilate + Weather Ball sem
   tempo vira golpe de Fada). Com o Tera ativo, o tipo do Tera já venceria de qualquer jeito (roda depois). */
export function golpeDaConversaoDeTipo(g, u) {
  const c = hab(u).converteTipo; if (!c || !g || (c.de !== '*' && g.type !== c.de) || g.type === c.para) return g;
  return { ...g, type: c.para, power: g.power ? Math.floor(g.power * (c.mult || 1)) : g.power };
}
export const terrenoDe = campo => (campo?.terrenoTurnos > 0 && TERRENOS[campo.terreno]) ? campo.terreno : null;
// quem está no chão sente o terreno; Voador e Levitate flutuam
export const noChao = m => !tiposDe(m).includes('flying') && hab(m).imuneTipo !== 'ground' && !m?.vol?.balao;
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
  if (!c?.dano || (c.poupa || []).some(t => tiposDe(m).includes(t))) return 0;
  if (hab(m).imuneClima?.includes(clima)) return 0;                       // Sand Veil, Snow Cloak, Ice Body, Magic Guard…
  return Math.max(1, Math.floor(m.stats.hp * c.dano));
}
// precisão que muda com o clima: Thunder/Hurricane acertam sempre na chuva e ficam ruins no sol; Blizzard, no gelo
export const PRECISAO_CLIMA = { thunder: { chuva: 100, sol: 50 }, hurricane: { chuva: 100, sol: 50 }, blizzard: { granizo: 100, neve: 100 } };

// `ladoAlvo` = o lado do campo de quem defende (telas: Reflect, Light Screen, Aurora Veil)
/* `esperado` = a média, sem sorteio: sem crítico e com a rolagem no meio da faixa (92,5%). É pra IA do inimigo
   comparar golpes (notaDoGolpe) sem que um crítico ou uma rolagem baixa mude a escolha de um turno pro outro. */
export function calcDamage(u, t, move, clima = null, terreno = null, ladoAlvo = null, esperado = false) {
  if (FIXED[move.name]) return { dmg: Math.max(1, FIXED[move.name](u, t)), crit: false };
  const hu = hab(u), ht = hab(t);
  let power = poderEspecial(u, t, move) ?? (move.power || 60);
  /* Z-Move: converte o poder ANTES de tudo (zmove.js liga `vol.zAtivo` só no turno do Z). Entra aqui, e não
     numa cópia do golpe, pra não haver dois objetos de golpe em jogo — a cópia quebraria o gasto de PP, que é
     feito no golpe de verdade. */
  if (u.vol?.zAtivo) power = poderZ(power);
  else if (u.dyna) power = poderMax(power);   // gigante: todo golpe é Max (o Z tem prioridade — é um tiro só)
  if (hu.tecnico && power <= 60) power = Math.floor(power * 1.5);                   // Technician
  const phys = move.cls === 'physical';
  // estágio de crítico: o do golpe + Focus Energy (u.vol.foco)
  // `semCritico` (Battle Armor, Shell Armor): o golpe nunca sai crítico contra quem tem. Vale inclusive sobre
  // Focus Energy e golpe de crítico garantido — é exatamente pra isso que a habilidade existe.
  // `focoBase` (Super Luck): a habilidade já nasce com um degrau de crítico, somado ao do golpe e ao Focus Energy
  // `critContraStatus` (Merciless): contra alvo com esse status o crítico é garantido (ainda respeitando o semCritico)
  const crit = !esperado && !ht.semCritico
    && ((hu.critContraStatus && t.status === hu.critContraStatus)
      || Math.random() < [1 / 24, 1 / 8, 1 / 2, 1][Math.min(3, (move.meta?.crit || 0) + (u.vol?.foco || 0) + (hu.focoBase || 0) + (seg(u).critExtra || 0))]);
  // Unaware: quem tem ignora os degraus do OUTRO lado (o Ataque de quem o ataca, a Defesa de quem ele ataca)
  /* O par de atributos sai do `cls` do golpe, MENOS quando a tabela de especiais diz outra coisa: Body Press
     ataca com a sua Defesa, Foul Play com o Ataque do alvo, e Psyshock/Psystrike/Secret Sword são especiais
     que batem na Defesa física. */
  const esp = especial(move);
  const A = effStat(esp.atkDoAlvo ? t : u, esp.atkDe || (phys ? 'attack' : 'special-attack'), crit, true, clima, terreno, !!ht.ignoraEstagios);
  const D = effStat(t, esp.defDe || (phys ? 'defense' : 'special-defense'), crit, false, clima, terreno, !!hu.ignoraEstagios);
  const base = Math.floor(Math.floor(Math.floor(2 * u.level / 5 + 2) * power * A / D) / 50) + 2;
  let mod = (crit ? hu.critico || 1.5 : 1) * (esperado ? 92.5 : rand(85, 100)) / 100;
  mod *= multStab(u, move.type, hu.stab || 1.5);                                      // STAB (Adaptability = ×2; Tera muda a conta)
  const ef = typeEff(move.type, tiposDefensivos(t));                                  // terastalizado defende pelo tipo Tera
  mod *= ef;
  if (ef > 1 && ht.superEfetivo) mod *= ht.superEfetivo;                            // Filter, Solid Rock
  if (ef < 1 && hu.poucoEfetivo) mod *= hu.poucoEfetivo;                            // Tinted Lens
  if (ef > 1 && hu.superEfetivoCausado) mod *= hu.superEfetivoCausado;              // Neuroforce
  mod *= hu.danoTipo?.[move.type] || 1;                                              // Steelworker, Transistor, Water Bubble…
  if (hu.emboscada && t.vol?.recemEntrou) mod *= hu.emboscada;                       // Stakeout: dobra o dano em quem acabou de entrar em campo
  if (hu.sheerForce && temSecundario(move)) mod *= 1.3;                              // Sheer Force: mais forte, mas perde o efeito (golpe.js)
  const dc = hu.danoTipoClima?.[clima]; if (dc?.tipos.includes(move.type)) mod *= dc.mult; // Sand Force na areia
  mod *= multFamilia(hu, move.name);                                                 // Iron Fist, Strong Jaw, Sharpness
  if (hu.multFlag && temFlag(move, hu.multFlag.flag)) mod *= hu.multFlag.mult;       // Tough Claws (contato), Mega Launcher (pulse), Punk Rock (som)
  if (ht.resisteFlag && temFlag(move, ht.resisteFlag.flag)) mod *= ht.resisteFlag.mult; // Punk Rock: quem tem leva metade de golpe de som
  if (hu.recuo && move.meta?.drain < 0) mod *= hu.recuo;                             // Reckless: golpe com recuo
  if (phys && u.status === 'burn' && !(hu.comStatus?.attack && statusVale(hu, 'burn')) && move.name !== 'facade') mod *= 0.5; // Guts e Facade ignoram a queimadura
  if (hu.rivalidade) mod *= mesmoGenero(u, t) ? 1.25 : generoOposto(u, t) ? 0.75 : 1; // Rivalry: briga melhor com igual
  if (hu.pinch === move.type && u.hp <= u.stats.hp / 3) mod *= 1.5;                 // Overgrow, Blaze, Torrent, Swarm
  if (u.vol.flashFire && move.type === 'fire') mod *= 1.5;
  if (ht.resiste?.[move.type]) mod *= ht.resiste[move.type];                        // Thick Fat, Heatproof
  if (ht.hpCheio && t.hp >= t.stats.hp) mod *= ht.hpCheio;                          // Multiscale
  mod *= resisteDoItem(t, move.type, ef);                                            // Escama do Céu, Cristal Psíquico/Gélido, frutas de aperto
  mod *= multDanoDoItem(u, { ef, fisico: phys, tipo: move.type });                    // item segurado (Orbe da Vida, Núcleo Eternamax…)
  mod *= multClima(clima, move.type);                                                // sol/chuva (regras.CLIMAS)
  mod *= multTerreno(terreno, move.type, u);                                         // terreno, pra quem está no chão
  mod *= multTelas(ladoAlvo, move);                                                  // telas do lado de quem defende
  mod *= multResisteRaide(ladoAlvo, move.type);                                      // Cinza Vulcânica/Escama Abissal (raide)
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
  const h = hab(user), ht = hab(target);
  // Unaware: quem ataca ignora a evasão do alvo; quem é atacado ignora a precisão de quem ataca
  const n = clamp((ht.ignoraEstagios ? 0 : user.vol.stages.accuracy || 0) - (h.ignoraEstagios ? 0 : target.vol.stages.evasion || 0), -6, 6);
  let acc = PRECISAO_CLIMA[move.name]?.[clima] ?? move.acc;                          // Thunder na chuva, Blizzard no gelo…
  if (acc != null && ht.limitaStatus && move.cls === 'status') acc = Math.min(acc, ht.limitaStatus); // Wonder Skin: golpe de status alheio, no máx. 50%
  const esconde = clima && ht.escondeNoClima?.includes(clima) ? 0.8 : 1;             // Sand Veil, Snow Cloak
  const confuso = ht.evasaoConfuso && target.vol?.conf > 0 ? 0.5 : 1;                // Tangled Feet: evasão em dobro confuso
  return acc / 100 * (n >= 0 ? (3 + n) / 3 : 3 / (3 - n)) * (h.precisao || 1) * (move.cls === 'physical' ? h.precisaoFisica || 1 : 1) * esconde * confuso;
}

// imunidades de tipo a status (Elétrico não paralisa, Fogo não queima, Gelo não congela, Venenoso/Aço não envenenam)
export function imuneAoStatus(tipos, ail) {
  return (ail === 'paralysis' && tipos.includes('electric')) || (ail === 'burn' && tipos.includes('fire')) || (ail === 'freeze' && tipos.includes('ice')) || (ail === 'poison' && (tipos.includes('poison') || tipos.includes('steel')));
}
// tipo OU habilidade (Immunity, Limber, Insomnia, Own Tempo…)
export const imuneAoStatusMon = (m, ail) => (ail !== 'confusion' && imuneAoStatus(tiposDe(m), ail)) || !!hab(m).imuneStatus?.includes(ail);

// dano de queimadura (1/16) e veneno (1/8) no fim do turno, mínimo 1 (como nos jogos); 0 = sem status que cause dano.
// Sem o mínimo, HP máximo < 16 (queimadura) ou < 8 (veneno) dava floor = 0 e o status nunca machucava.
// Veneno grave (Toxic, m.vol.toxico = n): n/16 do HP, n sobe a cada turno (golpe.js fimDeTurno).
// Reordena os golpes na ficha (pedido do usuário: run e Raid) — troca a posição i com a vizinha (i+dir). Devolve
// um array NOVO (nunca muta): quem chama faz `M.moves = moverGolpe(M.moves, i, dir)`. O PP usado mora dentro de
// cada objeto de golpe (`ppLeft`), então ele viaja junto com o golpe na troca, sem lógica extra.
export function moverGolpe(moves, i, dir) {
  const j = i + dir;
  if (j < 0 || j >= moves.length) return moves;
  const novo = [...moves];
  [novo[i], novo[j]] = [novo[j], novo[i]];
  return novo;
}
export function danoResidual(m) {
  if (m.status === 'poison' && m.vol?.toxico) return Math.max(1, Math.floor(m.stats.hp * m.vol.toxico / 16));
  const frac = m.status === 'burn' ? 16 : m.status === 'poison' ? 8 : 0;
  return frac ? Math.max(1, Math.floor(m.stats.hp / frac)) : 0;
}

/* fuga: Run Away ou ser mais rápido garante; senão a chance sobe 30/256 a cada tentativa. `preso` = o oponente
   tem Magnet Pull e você é do tipo Aço (regras.js não sabe de habilidade — quem chama já resolveu isso em
   `hab(inimigo).prendeTipo`) — nem a velocidade ajuda, só Run Away escapa disso, como nos jogos. */
export function consegueFugir(velP, velE, tentativas, habilidade, sorte = Math.random(), preso = false) {
  if (habilidade === 'run-away') return true;
  if (preso) return false;
  return velP >= velE || sorte * 256 < Math.floor(velP * 128 / velE) + 30 * tentativas;
}

// true = o jogador age primeiro. Prioridade do golpe decide; empate de prioridade vai pela velocidade; empate total é moeda
export function jogadorAgePrimeiro(pm, em, velP, velE, sorte = Math.random()) {
  if ((pm.priority || 0) !== (em.priority || 0)) return (pm.priority || 0) > (em.priority || 0);
  return velP === velE ? sorte < 0.5 : velP > velE;
}

// Centro Pokémon: preço sobe com o nível pra cura não virar reflexo depois de toda luta.
// ₽50 + ₽15/nível ≈ 1–2 vitórias da faixa em que você está (vitória ≈ ₽11 × nível do inimigo).
/* Preço de um item AGORA. Quase todo item tem preço fixo (ITEMS[id].price); o Disco Técnico é a exceção — cada Disco
   USADO deixa o próximo mais caro. Sem isso bastava juntar dinheiro uma vez no fim da run e comprar quatro de uma
   vez, montando o moveset perfeito de graça. Conta pelo que foi USADO (S.discosUsados), não pelo que foi comprado:
   Disco parado na mochila não encarece nada. */
export const PRECO_DISCO = 8000, AUMENTO_DISCO = 4000;
export const precoItem = (id, S) => S?.lojaGratis ? 0 : id === 'tm-normal'
  ? PRECO_DISCO + AUMENTO_DISCO * (S?.discosUsados || 0)
  : (ITEMS[id]?.price || 0);
// Venda (itens.js venderItem, mochila): metade do preço de compra, igual à convenção dos jogos. Item sem preço
// (achado explorando, prêmio de Alfa…) devolve 0 — a mochila oferece "Jogar fora" nesse caso, não "Vender".
export const precoVenda = (id, S) => Math.floor(precoItem(id, S) / 2);

/* Itens rápidos (S.rapidos): até MAX_RAPIDOS atalhos que aparecem junto dos botões principais da tela, com as
   teclas 1 e 2 como hotkey. Marcar de novo desmarca; cheio e item novo devolve `null` (quem chama avisa que
   precisa tirar um antes, em vez de trocar por conta própria e derrubar a escolha de quem joga). */
export const MAX_RAPIDOS = 2;
export function alternarRapido(lista, id, max = MAX_RAPIDOS) {
  const atual = (Array.isArray(lista) ? lista : []).filter(Boolean);
  if (atual.includes(id)) return atual.filter(x => x !== id);
  return atual.length >= max ? null : [...atual, id];
}

/* O que um item de golpe (ITENS_GOLPE) oferece pra este Pokémon, sem repetir o que ele já sabe:
   'relembrar' (Escama do Coração) = golpes da lista POR NÍVEL até o nível atual — o que você deixou passar;
   'pokedex'   (Disco Técnico)     = golpes de MT/tutor/herança (learnset.extras, montado em api.buildLearnset).
   `null` = não dá pra saber agora: espécie sem cache, ou cache antigo, de antes dos extras existirem — quem chama
   avisa pra conectar uma vez, em vez de dizer que o Pokémon não aprende nada (que seria mentira). */
export function golpesParaEnsinar(tipo, M) {
  const L = M?.data?.learnset;
  if (!L) return null;
  const sabe = n => (M.moves || []).some(m => m.name === n);
  if (tipo === 'relembrar') return L.list.filter(m => m.level <= M.level && !sabe(m.name));
  return L.extras ? L.extras.filter(m => !sabe(m.name)) : null;
}

export const custoCentro = nivel => 50 + 15 * nivel;
// algo pra curar? (HP, status ou PP) — com tudo cheio o Centro não cobra nem cura
export const precisaCurar = m => m.hp < m.stats.hp || !!m.status || m.moves.some(mv => mv.ppLeft < mv.pp);

/* `MULT_XP` estica a jornada: menos XP por vitória = mais batalhas por nível = run mais longa (pedido do
   usuário). Mexer aqui, e não na curva da PokéAPI, é de propósito — a curva vem da API e fica no cache de quem
   joga, então mudá-la exigiria invalidar o cache de todo mundo e quebraria comparação com jornadas antigas.
   0,6 ≈ jornada 1,65× mais longa. É UM número, fácil de girar: se ficar arrastado, suba; se ficar rápido, desça.
   Não mexe no equilíbrio relativo — treinador continua valendo 1,5× de um selvagem. */
export const MULT_XP = 0.6;
// Pokémon de treinador dá 1,5× XP (como nos jogos)
export const xpPorVitoria = (E, deTreinador = false) =>
  Math.max(1, Math.floor(E.data.baseExp * E.level / 7 * (deTreinador ? 1.5 : 1) * MULT_XP));

/* ---- batalha com vários Pokémon do mesmo lado (aliados agora, multiplayer depois) ---- */

// Garra Rápida (item, 20%) e Quick Draw (habilidade, 30%): chance, sorteada de novo a cada turno, de agir
// primeiro DENTRO da própria prioridade — não fura quem tem prioridade maior, só ganha de quem está na mesma
// faixa (mesmo sendo mais lento). Se dois lados ativarem, a velocidade ainda decide entre eles (`ordenarAcoes`).
export const CHANCE_QUICK_CLAW = 0.2, CHANCE_QUICK_DRAW = 0.3;
export function ativouQuickClaw(m, sorte = Math.random()) {
  if (seg(m).quickClaw) return sorte < CHANCE_QUICK_CLAW;
  if (hab(m).acaoRapida) return sorte < CHANCE_QUICK_DRAW;
  return false;
}
// Stall: sempre age por ÚLTIMO dentro da própria prioridade (o oposto da Garra Rápida/Quick Draw) — nunca sorteia,
// é sempre assim.
export const sempreUltimo = m => !!hab(m).sempreLento;
// Ordena as ações do turno: prioridade maior primeiro; dentro dela, quem ativou Garra Rápida/Quick Draw
// (`rapido`) primeiro e quem tem Stall (`lento`) por último; entre os do meio, velocidade maior; empate = moeda.
// Cada ação: { prio, vel, rapido?, lento?, ... } (o resto passa intacto). Não muta a lista recebida.
export function ordenarAcoes(acoes, sorte = Math.random) {
  return acoes.map(a => ({ a, k: sorte() }))
    .sort((x, y) => (y.a.prio - x.a.prio) || ((y.a.rapido ? 1 : 0) - (x.a.rapido ? 1 : 0)) || ((x.a.lento ? 1 : 0) - (y.a.lento ? 1 : 0)) || (y.a.vel - x.a.vel) || (x.k - y.k))
    .map(x => x.a);
}
// Prankster (+1 golpe de status), Gale Wings (+1 golpe Voador com HP cheio), Triage (+3 golpe de cura)
export function prioridadeEfetiva(m, g) {
  let p = g.priority || 0;
  const h = hab(m);
  if (h.prankster && g.cls === 'status') p += 1;
  if (h.prioridadeVoador && g.type === 'flying' && m.hp >= m.stats.hp) p += 1;
  if (h.prioridadeCura && g.meta?.heal > 0) p += 3;
  return p;
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

/* ---- golpes que TRAVAM o que dá pra escolher ----
   Choice (item), Colete de Assalto, Taunt, Encore, Disable e Torment restringem quais golpes um Pokémon pode usar.
   Antes só a trava do Choice existia, e a regra estava COPIADA em 4 lugares (as 3 telas de golpe + golpeDoAliado),
   com o motor confiando cegamente no que a tela mandava. Com mais quatro travas isso viraria 16 cópias — e a IA do
   inimigo, que precisa saber o que o ALVO pode fazer, não teria de onde ler. Aqui é a única fonte: telas, aliados,
   IA e o próprio motor (golpe.usarGolpe) perguntam à mesma função.
   O motor precisa conferir também porque a ORDEM do turno importa: se o inimigo é mais rápido e te provoca DEPOIS
   de você escolher um golpe de status, o seu golpe falha — filtrar só o menu não cobre isso.
   Estado guardado em `m.vol` (só dados simples, vai no save e pela rede):
     ultimo      nome do último golpe usado (Encore/Disable/Torment dependem dele)
     provocado   turnos que faltam de Taunt
     encore      { golpe, turnos } — só pode repetir esse
     desativado  { golpe, turnos } — esse não pode
     tormento    true — não pode repetir o golpe anterior (dura a batalha toda) */
export const TRAVAS = ['provocar', 'encore', 'disable', 'tormento'];
export const TURNOS_TRAVA = { provocar: 3, encore: 3, disable: 4 };
const SEM_ENCORE = new Set(['encore', 'mimic', 'transform', 'sketch', 'mirror-move', 'me-first', 'struggle']);

// Por que `g` NÃO pode ser usado por `m` agora — { causa, texto } — ou null se pode. Struggle nunca é bloqueado.
export function motivoBloqueio(m, g) {
  if (!m || !g || g.name === 'struggle') return null;
  const v = m.vol || {}, s = seg(m), item = ITEMS[m.item]?.name || 'item';
  if (s.choice && v.escolha && g.name !== v.escolha) return { causa: 'escolha', texto: `está travado em ${fmt(v.escolha)} pelo ${item}` };
  // Encore só prende se o golpe repetido ainda tem PP — sem PP a trava fica suspensa, senão o Pokémon travaria sem nenhum golpe
  const enc = v.encore && m.moves?.find(x => x.name === v.encore.golpe);
  if (enc && enc.ppLeft > 0 && g.name !== enc.name) return { causa: 'encore', texto: `sob Encore, só pode repetir ${fmt(enc.name)}` };
  if (v.provocado > 0 && g.cls === 'status') return { causa: 'provocado', texto: 'provocado, só pode usar golpes de dano' };
  if (s.semStatus && g.cls === 'status') return { causa: 'colete', texto: `o ${item} não deixa usar golpes de status` };
  if (v.desativado && g.name === v.desativado.golpe) return { causa: 'disable', texto: `${fmt(g.name)} está desativado` };
  if (v.tormento && v.ultimo === g.name) return { causa: 'tormento', texto: 'atormentado, não pode repetir o golpe anterior' };
  return null;
}
export const golpePermitido = (m, g) => g.ppLeft > 0 && !motivoBloqueio(m, g);
// os golpes que `m` PODE escolher agora (com PP e sem trava). Lista vazia = Struggle.
export const golpesPermitidos = m => (m.moves || []).filter(g => golpePermitido(m, g));
// Encore: o golpe que a escolha vira, como nos jogos (a escolha é TROCADA, não recusada). null = sem Encore ativo
export function golpeForcado(m) {
  const e = m.vol?.encore;
  return e ? m.moves?.find(x => x.name === e.golpe && x.ppLeft > 0) || null : null;
}
// Por que o alvo não pode ser travado (null = pode). Chefe de evento é imune, como a status.
export function falhaDaTrava(alvo, tipo) {
  const v = alvo.vol || {};
  if (alvo.boss) return 'o chefe é imune';
  if (hab(alvo).imuneTrava?.includes(tipo)) return `${fmt(alvo.ability)} protege`;
  if (tipo === 'provocar' && v.provocado > 0) return 'já está provocado';
  if (tipo === 'tormento' && v.tormento) return 'já está atormentado';
  if (tipo === 'encore') {
    if (v.encore) return 'já está sob Encore';
    const g = v.ultimo && alvo.moves?.find(x => x.name === v.ultimo);
    if (!g || SEM_ENCORE.has(g.name)) return 'não tem golpe pra repetir';
    if (g.ppLeft <= 0) return 'o último golpe está sem PP';
  }
  if (tipo === 'disable') {
    if (v.desativado) return 'já tem um golpe desativado';
    if (!v.ultimo || !alvo.moves?.some(x => x.name === v.ultimo)) return 'ainda não usou golpe nenhum';
  }
  return null;
}
// Um turno passou: conta os prazos e devolve o que ACABOU (['provocado','encore','desativado']) pra quem narra avisar
export function passarTravas(m) {
  const v = m.vol; if (!v) return [];
  const fim = [];
  if (v.provocado > 0 && --v.provocado <= 0) { delete v.provocado; fim.push('provocado'); }
  for (const k of ['encore', 'desativado']) if (v[k] && --v[k].turnos <= 0) { delete v[k]; fim.push(k); }
  return fim;
}
// Linhas pra mostrar ao jogador o que está travando o Pokémon dele (as 3 telas de golpe usam a mesma)
export function resumoTravas(m) {
  const v = m.vol || {}, s = seg(m), item = ITEMS[m.item]?.name || 'item', l = [];
  if (s.choice && v.escolha) l.push(`🔒 Travado em ${fmt(v.escolha)} pelo ${item} até desmaiar ou ser revivido.`);
  if (s.semStatus) l.push(`🦺 O ${item} não deixa usar golpes de status.`);
  if (v.provocado > 0) l.push(`😤 Provocado por ${v.provocado} turno(s): só golpes de dano.`);
  if (v.encore) l.push(`🔁 Encore por ${v.encore.turnos} turno(s): só pode repetir ${fmt(v.encore.golpe)}.`);
  if (v.desativado) l.push(`⛔ ${fmt(v.desativado.golpe)} desativado por ${v.desativado.turnos} turno(s).`);
  if (v.tormento) l.push('😖 Atormentado: não pode repetir o golpe anterior.');
  return l;
}

/* ---- IA do inimigo ----
   Antes o inimigo sorteava qualquer golpe com PP — dava pra ganhar de Pokémon muito mais forte na sorte. Depois passou
   a acertar a escolha com a chance `esperteza` (selvagem erra bastante, treinador pensa melhor, Alfa e lendário quase
   sempre acertam), mas "acertar" era só o golpe de maior dano esperado (melhorGolpe: poder × eficácia × STAB) e
   golpe de status valia 0,1 pra qualquer um — então o inimigo só usava Toxic, Reflect ou Swords Dance por sorteio.
   Agora, com o CONTEXTO da luta (quem usa, quem apanha, o campo), cada golpe ganha uma nota (notaDoGolpe) e "pensar"
   é escolher a maior. A esperteza segue sendo a chance de pensar; o que muda com quem é o inimigo é QUANTO ele
   enxerga (nivelDaIA):
     simples   selvagem — como sempre foi: dano bruto (melhorGolpe), status quase nunca
     basico    treinador — dano de verdade (com dano esperado, precisão, imunidades e se derruba), status que pega
               (paralisar, queimar, dormir…) e cura quando está no fim; o resto é ruído
     completo  Alfa, lendário e chefe — tudo: buffs e debuffs, cura, clima, terreno, telas, Taunt/Encore/Disable,
               proteção, Leech Seed… e sabe que armadilha de entrada não pega no lado do jogador
   `sorte` injetável = testável. Devolve o golpe (ou null = Struggle). */
export const ESPERTEZA = { selvagem: 0.5, treinador: 0.75, chefe: 0.9 };
export const nivelDaIA = esperteza => esperteza >= ESPERTEZA.chefe ? 'completo' : esperteza >= ESPERTEZA.treinador ? 'basico' : 'simples';

// valor de infligir cada status (na mesma escala do dano: ≈ % do HP do alvo que o golpe "vale")
const VALOR_STATUS = { sleep: 55, paralysis: 40, burn: 40, freeze: 40, poison: 30, confusion: 25, infatuation: 15, trap: 15 };
// quanto vale +1 degrau em cada atributo (Ataque/Ataque Esp. são ajustados pelo que o Pokémon realmente usa)
const VALOR_ESTAGIO = { attack: 16, 'special-attack': 16, speed: 12, defense: 9, 'special-defense': 9, accuracy: 5, evasion: 8 };
const TETO_BUFF_IA = 2;            // não empilha mais que +2 (Swords Dance duas vezes já resolve)
const IGNORADO = 2;                // o que vale um golpe que o nível da IA nem considera
const IMPOSSIVEL = -100;           // não faz nada / é pior que não fazer nada: nunca escolhido "pensando"

// nota de UM golpe. c = { u: quem usa, alvo, campo, ladoU, ladoAlvo (os `campo.lados[...]` de cada um), nivel }
export function notaDoGolpe(g, c) {
  const { u, alvo, campo = null, ladoU = null, ladoAlvo = null } = c;
  const completo = (c.nivel || 'completo') === 'completo';
  const clima = campo ? climaDe(campo) : null, terreno = campo ? terrenoDe(campo) : null;
  const esp = especial(g), hu = hab(u), ht = hab(alvo);
  const acerto = g.acc == null ? 1 : clamp(chanceAcerto(g, u, alvo, clima), 0, 1);
  const frac = m => m.hp / Math.max(1, m.stats.hp);
  const usaFisico = u.moves.some(m => m.ppLeft > 0 && m.cls === 'physical'), usaEspecial = u.moves.some(m => m.ppLeft > 0 && m.cls === 'special');

  // ---- golpe de dano ----
  if (g.cls !== 'status') {
    const ef = typeEff(g.type, tiposDefensivos(alvo));
    if (ef === 0 || ht.imuneTipo === g.type || ht.absorve === g.type) return IMPOSSIVEL;      // imune, ou ainda cura o alvo
    if (ht.imuneFlag && temFlag(g, ht.imuneFlag)) return IMPOSSIVEL;                          // Soundproof, Bulletproof
    if (esp.soDormindo && alvo.status !== 'sleep') return IMPOSSIVEL;
    if (esp.soPrimeiroTurno && u.vol?.golpesDados) return IMPOSSIVEL;
    if (esp.ohko) return u.level < alvo.level ? IMPOSSIVEL : Math.min(90, 30 + u.level - alvo.level) * 0.9;
    const { dmg } = calcDamage(u, alvo, g, clima, terreno, ladoAlvo, true);
    let nota = Math.min(1, dmg / Math.max(1, alvo.hp)) * 100 * acerto;
    if (dmg >= alvo.hp && acerto > 0.6) nota += 40 + ((g.priority || 0) > 0 ? 30 : 0);      // derruba: vence qualquer outra ideia (e a prioridade garante)
    if (esp.soPrimeiroTurno) nota += 20;                                                     // Fake Out: o alvo perde a vez
    if (esp.autoDesmaio && dmg < alvo.hp) nota -= 60;                                        // só compensa se levar o alvo junto
    if (esp.recarga || esp.carga) nota *= esp.invulneravel ? 0.75 : 0.6;                     // gasta 2 turnos
    if (esp.furia) nota *= 0.9;
    if (esp.soSeAlvoAtaca) nota *= 0.7;
    return nota;
  }

  // ---- golpe de status ----
  const ailmentDe = (ail, extra = 0) => {                                                     // infligir um status no alvo
    if (alvo.status && !['confusion', 'infatuation'].includes(ail)) return IMPOSSIVEL;
    if (ail === 'confusion' && alvo.vol?.conf > 0) return IMPOSSIVEL;
    // Attract só pega gênero OPOSTO, e uma vez só (golpe.aplicarStatus confere o mesmo)
    if (ail === 'infatuation' && (alvo.vol?.paixao || !generoOposto(alvo, u))) return IMPOSSIVEL;
    if (imuneAoStatusMon(alvo, ail) || ladoAlvo?.salvaguarda > 0) return IMPOSSIVEL;
    let v = (VALOR_STATUS[ail] ?? 4) + extra;
    if (ail === 'paralysis' && effStat(alvo, 'speed') > effStat(u, 'speed')) v += 15;        // tira a vez de quem é mais rápido
    if (ail === 'burn' && (alvo.data.base?.attack ?? 0) > (alvo.data.base?.['special-attack'] ?? 0)) v += 15;
    if (frac(alvo) < 0.25) v *= 0.3;                                                         // vai cair de qualquer jeito
    return v * acerto;
  };
  const curaDe = fracCura => {                                                               // recuperar o próprio HP
    const f = frac(u);
    if (f > 0.65) return IMPOSSIVEL;                                                         // com o HP alto, curar é desperdício
    return Math.min(fracCura, 1 - f) * 110;
  };
  if (esp.generoOposto && !generoOposto(alvo, u)) return IMPOSSIVEL;                           // Captivate
  if (esp.toxico) return alvo.status || imuneAoStatusMon(alvo, 'poison') || ladoAlvo?.salvaguarda > 0 ? IMPOSSIVEL : 45 * acerto;
  if (esp.descanso) return frac(u) <= 0.4 && !imuneAoStatusMon(u, 'sleep') ? 60 : IMPOSSIVEL;
  if (g.meta?.heal > 0 && SELF_TARGETS.has(g.target)) return curaDe(g.meta.heal / 100);
  const ail = g.meta?.ailment;
  if (ail && ail !== 'none' && !SELF_TARGETS.has(g.target) && !esp.trava) return ailmentDe(ail);
  if (!completo) return IGNORADO;                                                            // treinador para por aqui

  // ---- só o nível "completo" (Alfa, lendário, chefe) ----
  if (esp.trava) {
    if (falhaDaTrava(alvo, esp.trava)) return IMPOSSIVEL;
    const ult = alvo.moves?.find(m => m.name === alvo.vol?.ultimo);
    if (esp.trava === 'provocar') {                                                          // vale contra quem depende de golpe de status; contra quem só bate, não tira nada
      const nStatus = alvo.moves.filter(m => m.ppLeft > 0 && m.cls === 'status').length;
      const v = nStatus === 0 ? 1 : 10 + Math.min(4, nStatus) * 12;
      return ult && ult.cls !== 'status' ? v * 0.4 : v;                                      // acabou de bater com dano: provocar não tira o que ele está fazendo
    }
    if (esp.trava === 'encore') return ult && (ult.cls === 'status' || (ult.power || 0) < 50) ? 45 : IMPOSSIVEL;                  // prender num golpe fraco/inútil
    if (esp.trava === 'disable') return (ult?.power || 0) >= 70 ? 35 : 12;
    return 15;                                                                                // Torment
  }
  if (esp.protege) return u.vol?.protSeguidas > 0 ? IMPOSSIVEL : alvo.vol?.carregando ? 55 : 5;   // esperar o golpe de 2 turnos passar; nunca duas seguidas
  if (esp.aguentaTurno) return frac(u) <= 0.35 ? 25 : IMPOSSIVEL;
  if (esp.foco) return u.vol?.foco ? IMPOSSIVEL : frac(u) > 0.6 ? 10 : 2;
  if (esp.semente) return tiposDefensivos(alvo).includes('grass') || alvo.vol?.semente != null ? IMPOSSIVEL : 32 * acerto;
  if (esp.armadilha) return IMPOSSIVEL;                                                     // do lado do jogador ninguém troca de Pokémon: não pega ninguém
  if (esp.autoDesmaio) return -60;
  if (esp.clima) {
    if (clima === esp.clima) return IMPOSSIVEL;
    return Math.max(5, 20 + (hu.multStatClima?.[esp.clima] ? 25 : 0) + (hu.curaClima?.[esp.clima] ? 20 : 0)
      - (ht.multStatClima?.[esp.clima] ? 25 : 0) - (ht.curaClima?.[esp.clima] ? 20 : 0));
  }
  if (esp.terreno) return terreno === esp.terreno ? IMPOSSIVEL : 14;
  if (esp.lado) {
    if (ladoU?.[esp.lado] > 0) return IMPOSSIVEL;                                            // já está de pé
    if (esp.soNoGelo && !['granizo', 'neve'].includes(clima)) return IMPOSSIVEL;
    const alvoFisico = (alvo.data.base?.attack ?? 0) >= (alvo.data.base?.['special-attack'] ?? 0);
    const v = { reflect: alvoFisico ? 34 : 14, luz: alvoFisico ? 14 : 34, veu: 30, salvaguarda: 12, neblina: 8,
      vento: effStat(u, 'speed') <= effStat(alvo, 'speed') ? 30 : 15 }[esp.lado] ?? 12;
    return frac(u) > 0.3 ? v : v * 0.4;                                                      // não monta tela pra quem está caindo
  }
  if (g.stats?.length) {
    const eu = SELF_TARGETS.has(g.target), estagios = (eu ? u : alvo).vol?.stages || {};
    let v = 0;
    for (const { stat, change } of g.stats) {
      const atual = estagios[stat] || 0, peso = VALOR_ESTAGIO[stat] ?? 6;
      if (eu) {
        if (change < 0) { v -= -change * peso * 0.5; continue; }                             // custo do próprio golpe (Curse, Shell Smash)
        const espaco = Math.min(change, TETO_BUFF_IA - atual);
        if (espaco <= 0) continue;
        let p = peso;
        if (stat === 'attack') p *= usaFisico ? 1 : 0.15;                                    // Ataque só serve a quem bate com golpe físico
        else if (stat === 'special-attack') p *= usaEspecial ? 1 : 0.15;
        else if (stat === 'speed') p *= effStat(u, 'speed') < effStat(alvo, 'speed') ? 1.5 : 0.5;
        v += espaco * p;
      } else {
        if (change > 0) continue;                                                            // golpe que SOBE o atributo do inimigo? não
        if (ht.semQueda === 'todas' || ht.semQueda?.includes?.(stat) || ladoAlvo?.neblina > 0) continue;
        const espaco = Math.min(-change, 2 + Math.min(0, atual));
        if (espaco > 0) v += espaco * peso * 0.7;
      }
    }
    if (eu) v *= frac(u) >= 0.7 ? 1 : frac(u) >= 0.5 ? 0.5 : 0.1;                            // setup só com folga de HP
    return v * acerto;
  }
  return IGNORADO;
}

export function escolhaIA(moves, tiposAtacante, tiposAlvo, esperteza = ESPERTEZA.selvagem, sorte = Math.random, contexto = null) {
  const comPP = moves.filter(m => m.ppLeft > 0);
  if (!comPP.length) return null;
  const nivel = contexto?.nivel || nivelDaIA(esperteza);
  if (contexto && nivel !== 'simples') {
    const notas = comPP.map(m => ({ m, n: notaDoGolpe(m, { ...contexto, nivel }) }));
    if (sorte() < esperteza) {                                       // pensa: a maior nota (empate = sorteio entre os empatados)
      const topo = Math.max(...notas.map(x => x.n));
      const top = notas.filter(x => x.n >= topo - 1e-9);
      return top[Math.floor(sorte() * top.length)].m;
    }
    const razoaveis = notas.filter(x => x.n > IMPOSSIVEL / 2);       // distraído: sorteia, mas não algo absurdo (imune, tela repetida…)
    const pool = razoaveis.length ? razoaveis : notas;
    return pool[Math.floor(sorte() * pool.length)].m;
  }
  if (sorte() < esperteza) return melhorGolpe(comPP, tiposAtacante, tiposAlvo) || comPP[0];
  return comPP[Math.floor(sorte() * comPP.length)];
}

/* ---- sair de campo sem desmaiar ----
   Nos jogos várias coisas dependem de TROCAR de Pokémon (Roar, Regenerator, Wimp Out…). Aqui você é o Pokémon e nunca
   troca, então cada uma foi ligada ao evento equivalente que já existe: o fim da luta vencida, a fuga, o próximo
   Pokémon do treinador. As contas ficam aqui (puras); quem tira o Pokémon de campo é batalha.forcarSaida. */
// Quem o treinador manda em seguida. `aleatorio` = arrastado à força (Roar…), senão o primeiro vivo da fila
// (desistência dele mesmo). -1 = ninguém sobrou. O atual nunca é candidato; quem já caiu (hp 0) também não.
export function proximoDoTreinador(equipe, atual, aleatorio = false, sorte = Math.random) {
  const vivos = equipe.map((m, i) => i).filter(i => i !== atual && equipe[i].hp > 0);
  if (!vivos.length) return -1;
  return aleatorio ? vivos[Math.floor(sorte() * vivos.length)] : vivos[0];
}
// O que as habilidades de "saída" fazem quando a luta é vencida (o jogador nunca troca, então a saída é o fim da luta):
// Regenerator recupera parte do HP, Natural Cure tira o status. Devolve o que vai acontecer, sem mexer em nada.
export function efeitosAoVencer(m) {
  const h = hab(m), r = { cura: 0, limpaStatus: false };
  if (!m || m.hp <= 0) return r;
  if (h.curaAoVencer && m.hp < m.stats.hp) r.cura = Math.min(m.stats.hp - m.hp, Math.max(1, Math.floor(m.stats.hp * h.curaAoVencer)));
  if (h.limpaStatusAoVencer && m.status) r.limpaStatus = true;
  return r;
}

// O que o aliado faz neste turno, pela ordem dele (ORDENS em dados.js):
//   { golpe }        → usa esse golpe (golpe null = sem PP em nada → Struggle, só no 'livre')
//   { parado: txt }  → não age neste turno (txt vai pro log)
export function golpeDoAliado(ordem, moves, tiposA, tiposAlvo, sorte = Math.random, travado = null) {
  if (ordem === 'parado' || ordem === 'fora') return { parado: 'fica de guarda, sem atacar.' };
  /* Faixa/Óculos/Lenço Escolha: aliado já travado num golpe — nem a IA de ordem escolhe outro (senão a trava se
     desfaria sozinha a cada turno). Sem PP no golpe travado, `golpe: null` vira Struggle (quem chama já trata). */
  if (travado) { const m = moves.find(x => x.name === travado); return { golpe: m?.ppLeft > 0 ? m : null }; }
  const comPP = moves.filter(m => m.ppLeft > 0);
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

/* ---- ⚔ Saga: ameaça (aggro) ----
   Até aqui o inimigo mirava um alvo ALEATÓRIO entre os do seu lado (`pick(vivos(emCampo()))` em batalha.js), e
   por isso "tanque" era impossível: não havia como atrair dano. A ameaça é o que faz ofício valer algo.

   Duas parcelas, de propósito:
   - `base × HP máximo` — ameaça por EXISTIR. Sem ela um Guardião, que bate pouco, teria sempre menos ameaça que
     o Arcano e nunca seguraria nada: aggro só por dano premia justamente quem não devia ser mirado.
   - `acumulada × peso` — o que você fez na luta (dano causado; cura e feitiço entram quando as perícias chegarem).
   O Curandeiro tem peso 1.5 porque curar chama atenção — é ele o segundo alvo, como em todo RPG de turno.

   `RUIDO` existe pra luta não virar xadrez: 10% das vezes o inimigo mira outro. Sem isso o jogador decora a
   regra e o combate fica resolvido.
   Fora de um modo com a flag `ameaca` nada disso roda — quem decide é batalha.js, e o padrão segue aleatório. */
export const AMEACA = {
  /* `base: 1` = o HP máximo inteiro vira ameaça. Calibrado contra o caso real: com 0.5, um Arcano roubava o
     alvo depois de ~100 de dano, ou seja, dois golpes — o Guardião segurava dois turnos e a mecânica não
     aparecia. Com 1, um Aggron de 200 de HP exige 200 de dano acumulado do Arcano pra perder o alvo: segura a
     luta comum inteira e começa a vazar nas longas (Alfa, chefe), que é onde a Provocação precisa existir. */
  guardiao:   { peso: 2,   base: 1 },
  curandeiro: { peso: 1.5, base: 0.2 },
  arcano:     { peso: 1,   base: 0.1 },
  guerreiro:  { peso: 1,   base: 0.1 },
  encantador: { peso: 1.2, base: 0.1 },
  bardo:      { peso: 1.2, base: 0.1 }
};
export const AMEACA_PADRAO = { peso: 1, base: 0.1 };   // sem ofício (save antigo, espécie sem dado)
export const RUIDO_AMEACA = 0.1;
export const ameacaDe = m => {
  const a = AMEACA[m?.oficio] || AMEACA_PADRAO;
  // `vol.provocou` é a Provocação do Guardião (perícia): multiplica a ameaça por alguns turnos
  return ((m?.vol?.ameaca || 0) * a.peso + a.base * (m?.stats?.hp || 0)) * (m?.vol?.provocou || 1);
};
/* Quem o inimigo ataca. Empate mantém a ordem de entrada (sort estável): o mesmo estado sempre dá o mesmo alvo,
   senão a luta mudaria de rumo entre dois F5. */
export function alvoPorAmeaca(candidatos, sorte = Math.random) {
  if (!candidatos?.length) return null;
  if (candidatos.length === 1) return candidatos[0];
  const ordem = [...candidatos].sort((a, b) => ameacaDe(b) - ameacaDe(a));
  if (sorte() < RUIDO_AMEACA) {
    const outros = ordem.slice(1);
    return outros[Math.floor(sorte() * outros.length)] || ordem[0];
  }
  return ordem[0];
}
// um golpe causou dano: quem bateu ganha ameaça. Chamado pelo motor único (golpe.js), nunca por uma tela.
export const somarAmeaca = (m, n) => { if (m?.vol && n > 0) m.vol.ameaca = (m.vol.ameaca || 0) + n; };

/* ---- amizade (Etapa 3.2) ---- */
export const MAX_ALIADOS = 2;
/* Quantos aliados andam com você NESTE modo. O teto 2 é decisão fechada de balanceamento pros modos normais
   (o Esconderijo já resolve "guardar mais parceiros"); o ⚔ Saga sobe pra 3, porque a comitiva de quatro ofícios
   é a base do modo. Recebe a CHAVE da dificuldade (`dificuldadeDe(S)`) pra seguir pura — a regra de
   "save antigo = easy" mora em `estado.dificuldadeDe` e não deve existir em dois lugares. */
export const maxAliados = dif => DIFICULDADES[dif]?.aliadosEmCampo || MAX_ALIADOS;
// o mesmo teto, perguntado pelo save (o fallback `easy` é o de `estado.dificuldadeDe`: save antigo sem o campo)
export const tetoDaEquipe = S => maxAliados(S?.dificuldade || 'easy');
export const AMIZADE_MAX = 100;
// Item que o tipo gosta: +20–35 por oferta (3–5 ofertas pra encher). Item errado: 0–5 (quase nada).
export const DIVISOR_AMIZADE_LENDARIO = 4; // lendário/mítico: a amizade sobe ~4× mais devagar (ver ganhoAmizade)
export function ganhoAmizade(tiposDoItem, tiposDoAlvo, sorte = Math.random(), lendario = false) {
  const gosta = tiposDoAlvo.some(t => tiposDoItem.includes(t));
  const base = gosta ? 20 + Math.floor(sorte * 16) : Math.floor(sorte * 6);
  // Lendário e mítico aceitam petisco (é o que torna possível desbloquear eles pela amizade), mas confiam bem
  // devagar: onde um Pokémon comum vira aliado em 3–5 ofertas, eles levam mais de uma dezena. Nunca zera um ganho
  // que existia — ficar em 0 pra sempre pareceria que o petisco não funciona neles.
  return lendario && base > 0 ? Math.max(1, Math.floor(base / DIVISOR_AMIZADE_LENDARIO)) : base;
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
  if ((it.heal || it.healPct) && M.hp < M.stats.hp) return true;
  if (it.heal || (it.healPct && !it.cure)) return false;
  if (it.cure) return !!M.status && (it.cure === 'all' || it.cure.includes(M.status));
  if (it.ether) return M.moves.some(m => m.ppLeft < m.pp);
  if (it.stage) return true;
  if (it.candy) return podeSubir && M.level < 100;
  return false;
}

/* ---- mundo e progressão (Etapa 2) ---- */

/* Rota liberada? Quase todas abrem por nível. O SANTUÁRIO (`posVitoria`, a 11ª de cada mapa) é a exceção: só abre
   depois que você vence os lendários daquela Gen (S.gensVencidas), porque é lá que vivem os iniciais e os lendários
   — é a garantia de que dá pra encontrar TODA a Gen, mas só depois de fechar o mapa.
   Sem o save (`S`), ela fica trancada: é o padrão seguro pra quem chama sem saber da regra (ex.: criação). */
/* Rota ESGOTADA (só no Roguelike): passou do DOBRO do teto de nível da rota, ela para de dar caçada. É anti-grind —
   farmar numa rota de nível 6 sendo nível 60 rendia XP fácil e sem risco. Você continua entrando na rota e vendo a
   Pokédex dela (quem vive ali, as taxas, o Alfa); o que some é o encontro selvagem. Fora do Roguelike, nada muda. */
/* `MARGEM_ESGOTADA` conserta um problema que só existia nas rotas do COMEÇO: dobrar um teto pequeno dá uma folga
   pequena. A Rota 1 tem teto 6, então o limite era 12 — e como se começa no nível 5, a rota se esgotava antes de
   dar pra completar as missões dela ("derrote 10 Pidgey", "derrote 10 Rattata"…), travando o progresso da run.
   Numa rota de teto 50 a folga era de 50 níveis; na de teto 6, de 6. O piso iguala isso: a folga nunca é menor
   que 15 níveis. Só muda rotas com teto abaixo de 15 — do meio do mapa pra frente, o dobro continua mandando. */
export const FATOR_ESGOTADA = 2;
export const MARGEM_ESGOTADA = 15;
export const limiteDaRota = z => Math.max((z?.max || 0) * FATOR_ESGOTADA, (z?.max || 0) + MARGEM_ESGOTADA);
export const rotaEsgotada = (z, nivel, dificuldade) =>
  dificuldade === 'roguelike' && !!z && nivel > limiteDaRota(z);

export const zonaLiberada = (z, nivel, S = null) => z?.posVitoria
  ? !!(S?.gensVencidas || []).includes(z.gen)
  : nivel >= (z?.libera || 1);

// Alfa: HP ×2 e demais stats ×1,3 (arredondado pra baixo). Não muta.
export const MULT_CHEFE = { hp: 2, outros: 1.3 };
export const statsDeChefe = stats => Object.fromEntries(Object.entries(stats).map(([s, v]) => [s, Math.floor(v * (s === 'hp' ? MULT_CHEFE.hp : MULT_CHEFE.outros))]));
export const premioChefe = nivel => nivel * 60;

// Progresso de uma condição de missão (formato em MISSOES, dados.js) sobre o save. Nunca passa do alvo.
export function progressoCondicao(cond, S) {
  const r = S.registro || {}, soma = o => Object.values(o || {}).reduce((a, n) => a + n, 0);
  const [atual, alvo] =
    'derrotar' in cond ? [r.derrotados?.[cond.derrotar] || 0, cond.qtd || 1]
    /* `alvos: [[especie, qtd]…]` = missão de espécie do editor de rotas (dados-rotas.js). Mais de uma espécie SOMA
       (8 Plusle + 8 Minun = 16/16), e cada uma tem o PRÓPRIO teto: 20 Plusle e 0 Minun dá 8/16, não 16/16 — senão a
       missão de duas espécies viraria a de uma só com o dobro da conta. `qualquer` = basta UMA chegar no alvo dela,
       e é o que o `libera` usa: ver um dos dois já revela a missão (exigir os dois deixaria a missão escondida
       por puro azar na ordem do sorteio da rota). */
    : 'alvos' in cond ? (cond.qualquer
      ? [cond.alvos.some(([n, q]) => (r.derrotados?.[n] || 0) >= (q || 1)) ? 1 : 0, 1]
      : [cond.alvos.reduce((s, [n, q]) => s + Math.min(r.derrotados?.[n] || 0, q || 1), 0), cond.alvos.reduce((s, [, q]) => s + (q || 1), 0)])
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
    ovosChocados: S.ovosChocados || 0,   // badges 'ovos100'/'ovos1000' (ovos.js): somadas do progresso permanente
    // mapa (Gen) em que a jornada estava e quantas Gens fechou (venceu os lendários)
    gen: S.gen || 1, gens: (S.gensVencidas || []).length, tempoMs: S.tempoMs || 0, shiny: !!S.player.shiny,
    // quantas vezes esta jornada seguiu pro mapa seguinte com o MESMO Pokémon (cada uma tira 20% da pontuação)
    continuacoes: S.continuacoes || 0, campeaoDe: S.gensVencidas || [],
    // badges: jogou sem as vantagens da conta? passou a jornada inteira sem Centro Pokémon?
    semVantagens: !!S.semVantagens, semCentro: !S.usouCentro,
    maxDinheiro: Math.max(S.maxDinheiro || 0, S.money || 0), gasto: S.gasto || 0,
    shiniesVistos: soma(r.shinies), shiniesAmigos: soma(r.shiniesAmigos),
    /* Cópia do registro por espécie: a Pokédex da carreira (vistos/amigos + sprite pelo id) sai daqui — e, desde as
       conquistas de conta, também os `abates` (conquistas.js), que alimentam as gimmicks.
       ATENÇÃO: esta cópia é uma LISTA BRANCA. Campo novo em `S.registro` que não for citado aqui existe durante a
       run e some quando a jornada termina. Foi exatamente o que aconteceu com `abates` na primeira versão: o
       contador subia jogando e zerava ao encerrar, porque a carreira nunca recebia o campo — e de novo com
       `shiniesAmigos` (bug corrigido em 27/09/2026): só o TOTAL sobrevivia aqui embaixo (`shiniesAmigos: soma(...)`),
       o mapa por espécie sumia ao fechar a jornada e `criacao.opcaoShiny` nunca via qual espécie exatamente
       tinha ficado shiny. */
    registro: JSON.parse(JSON.stringify({ vistos: r.vistos || {}, derrotados: r.derrotados || {}, amigos: r.amigos || {}, evolucoes: r.evolucoes || {}, formas: r.formas || {}, ids: r.ids || {}, abates: r.abates || {}, shiniesAmigos: r.shiniesAmigos || {} }))
  };
}
// Pontuação = soma ponderada × multiplicador da dificuldade (Hardcore vale o dobro do Fácil)
export const PESOS_PONTOS = { nivel: 100, vitorias: 10, treinadores: 50, alfas: 300, amigos: 100, evolucoes: 150, missoes: 120, gens: 2000 };
/* Continuar a mesma jornada no mapa seguinte (em vez de começar outra do zero) é mais fácil: você chega no mapa
   novo já em nível alto. Cada continuação tira 20% da pontuação, com piso de metade — o suficiente pra escolher
   recomeçar valer a pena no ranking, sem zerar quem prefere levar o veterano até o fim.
   **Mudou aqui, muda no SQL**: `validar_jornada` (supabase/schema.sql) recalcula a pontuação e recusa a jornada
   se o número não bater. */
export const PENAL_CONTINUACAO = 0.8, PENAL_MINIMO = 0.5;
// jogar sem as vantagens das badges (itens e dinheiro iniciais) rende 10% a mais: o desafio puro tem de valer algo
export const BONUS_SEM_VANTAGENS = 1.1;
// `Math.max(n||0, 0)` no EXPOENTE: com expoente negativo `0.8 ** -50` ≈ 70065 e a penalidade virava bônus de
// dezenas de milhares. O `Math.max` de fora é PISO, não teto, e não segurava isso. Ver a migration
// 20260930120000 — o furo de verdade era do lado do servidor; aqui é só manter os dois lados iguais.
export const multContinuacao = n => Math.max(PENAL_MINIMO, PENAL_CONTINUACAO ** Math.max(n || 0, 0));
export const pontuacao = (est, multDificuldade = 1) =>
  Math.round(Object.entries(PESOS_PONTOS).reduce((a, [k, p]) => a + (est[k] || 0) * p, 0)
    * multDificuldade * multContinuacao(est.continuacoes) * (est.semVantagens ? BONUS_SEM_VANTAGENS : 1));

export function formatarTempo(ms) {
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'menos de 1 min';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}min` : `${m} min`;
}


/* ---- gênero ---- */
/* A PokéAPI dá `gender_rate` na ESPÉCIE (api.loadSpecies → `genderRate`): −1 = sem gênero, 0 = sempre macho,
   8 = sempre fêmea, 1–7 = chance de FÊMEA em oitavos. Sorteado uma vez no nascimento (pokemon.makeMon) e
   congelado no save — nada reescreve `m.genero` depois, nem a evolução.
   Forma presa a um gênero (meowstic-female, basculegion-male, oinkologne-male…): o NOME da forma manda, porque
   a espécie delas tem taxa 4 e o sorteio daria um Meowstic-Female macho. A forma padrão não traz sufixo, então
   o macho dessas espécies continua saindo do sorteio — fica certo nos dois casos. */
export function sortearGenero(taxa, nome = '', sorte = Math.random()) {
  if (/-female$/.test(nome)) return 'f';
  if (/-male$/.test(nome)) return 'm';
  if (!(taxa >= 0 && taxa <= 8)) return null;                 // −1 (sem gênero), ausente ou lixo
  return sorte < taxa / 8 ? 'f' : 'm';
}
// Rivalry, Attract, Captivate, Cute Charm. Sem gênero (Magnemite, lendários) e save antigo (`genero` ausente)
// nunca casam com nada: as duas respondem false, então o efeito falha em vez de chutar um gênero.
export const mesmoGenero = (a, b) => !!a?.genero && a.genero === b?.genero;
export const generoOposto = (a, b) => !!a?.genero && !!b?.genero && a.genero !== b.genero;

// shiny: 1 em 4096 (Gen 6+), sorteado pra todo Pokémon criado — você, selvagem ou de treinador, em qualquer modo
export const CHANCE_SHINY = 1 / 4096;
export const ehShiny = (sorte = Math.random()) => sorte < CHANCE_SHINY;
// Segredo do brilho: ser um Pokémon shiny (1 em 4096) dobra XP e dinheiro e deixa o Centro Pokémon de graça.
// Não está escrito em lugar nenhum da tela inicial — quem tirar um shiny descobre jogando.
export const MULT_SHINY = 2;
export const bonusShiny = S => !!S?.player?.shiny;
export const multShiny = S => bonusShiny(S) ? MULT_SHINY : 1;

/* Caminho (nomes de espécie) da raiz até `nome` numa árvore de evolução (api.slimEvo: {name, to:[...]}). `null`
   se a árvore não tiver o nó (save sem a árvore carregada ainda, ex. evoPendente). Usado pro desbloqueio
   retroativo do início-shiny (bug corrigido em 27/09/2026, ver `especiesShinyDoJogador`): sem isso não dava pra
   saber quais formas intermediárias um Pokémon shiny passou ao evoluir mais de uma vez. */
export function caminhoNaArvore(node, nome) {
  if (!node) return null;
  if (node.name === nome) return [node.name];
  for (const filho of node.to || []) {
    const resto = caminhoNaArvore(filho, nome);
    if (resto) return [node.name, ...resto];
  }
  return null;
}
/* Espécies que merecem o registro de "shiny recrutado" (registro.shiniesAmigos) pro PRÓPRIO Pokémon do jogador
   (bug: só era gravado ao recrutar um ALIADO shiny — o jogador shiny nunca desbloqueava a própria espécie pra
   começar de novo, nem propagava pras formas em que evoluiu). Com a árvore carregada (S.meta.evo), a espécie
   inicial E toda forma no caminho até a atual; sem ela (melhor esforço), só as duas pontas. */
export function especiesShinyDoJogador(S) {
  if (!S?.player?.shiny) return [];
  const atual = S.player.data?.speciesName;
  if (!atual) return [];
  const caminho = S.meta?.evo && caminhoNaArvore(S.meta.evo, atual);
  return caminho || [...new Set([S.especieInicial, atual].filter(Boolean))];
}

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
