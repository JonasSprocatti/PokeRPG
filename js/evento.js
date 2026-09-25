/* ============ eventos semanais ============
   Uma vez por semana um chefe especial toma o lugar de destaque no mapa da Gen dele (Eternatus Eternamax na Gen 8, Mega Rayquaza
   na Gen 3, e os próximos da lista). Só no Roguelike e no Hardcore (`DIFICULDADES[x].eventoSemanal`). Derrotar o chefe dá o
   Pokémon (Pokédex e novas jornadas), uma badge de evento com título e um prêmio.

   CALENDÁRIO: a semana vira TODA SEGUNDA-FEIRA À MEIA-NOITE, no horário de Brasília (UTC−3, sem horário de verão). A semana 0 começa
   na segunda 28/09/2026 — antes disso não há chefe, só o aviso e a agenda. O chefe da semana N é `EVENTOS[N % EVENTOS.length]`: todo
   mundo vê o mesmo chefe na mesma semana, sem servidor. Cada tentativa gasta `COOLDOWN_MS` (8 horas) de espera, guardada neste
   aparelho. Limite honesto: quem mexe no relógio do aparelho engana isso; pra uma disputa de ranking valer, o servidor teria de conferir.
   Puro (a única "entrada" é a data que quem chama passa): tests/evento.test.js. */
import { DIFICULDADES } from './dados.js';
import { store } from './util.js';

export const COOLDOWN_MS = 8 * 60 * 60 * 1000;
// perder pro chefe NÃO encerra a run nem perde aliado (senão uma tentativa a cada 8 horas custaria a jornada inteira).
// Pra endurecer é só virar false: aí valem as regras do modo (Roguelike: desmaiou, acabou).
export const EVENTO_SEM_PERMADEATH = true;
export const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;
export const FUSO_MS = -3 * 60 * 60 * 1000;                  // Brasília
export const INICIO = Date.UTC(2026, 8, 28, 3);              // segunda 28/09/2026 00:00 em Brasília = 03:00 UTC: a semana 0
export const TENTATIVA_KEY = 'pokerpg-evento-tentativa';
// SÓ PRA TESTAR: se este item do localStorage tiver um timestamp, o evento usa ele como "agora" (ex.: ver o chefe antes do dia 28)
export const RELOGIO_KEY = 'pokerpg-evento-agora';
export const agoraDoEvento = () => { const t = Number(store.get(RELOGIO_KEY)); return Number.isFinite(t) && t > 0 ? t : Date.now(); };

/* Cada evento: `forma` = o Pokémon da PokéAPI que aparece (o Eternamax é uma forma própria, id 10190); `especie` = a espécie
   que o jogador GANHA (desbloqueia na Pokédex e pra começar jornadas). `badge` = a insígnia de conta. `chefe` = a chave das
   regras dele em boss.js (CHEFES). */
/* Fábrica dos eventos: `forma` = a forma da PokéAPI que aparece (pelo id), `especie` = o que o jogador GANHA. O prêmio da semana
   inclui 2 itens de raide (dados.ITEMS `raide`) girando entre os três, pra os chefes se ajudarem entre si. */
const ITENS_RAIDE_PREMIO = ['cristal-de-ruptura', 'selo-de-interrupcao', 'escudo-astral'];
const VANTAGEM_BADGE = { dinheiro: 2000, itens: { 'rare-candy': 1 } };
let contador = 0;
function ev(e) {
  const i = contador++;
  return { ...e, chefe: e.id, forma: e.id, badge: { ...e.badge, vantagem: VANTAGEM_BADGE },
    recompensa: { dinheiro: 8000, itens: { 'rare-candy': 3, [ITENS_RAIDE_PREMIO[i % 3]]: 2 } } };
}
export const EVENTOS = [
  // (em boss.js cada `id` daqui tem as regras dele em CHEFES)
  ev({ id: 'eternatus-eternamax', gen: 8, nome: 'Eternatus Eternamax', especie: 'eternatus', especieId: 890, formaId: 10190,
    golpes: ['sludge-wave', 'dragon-pulse', 'flamethrower', 'flash-cannon'],
    resumo: 'Couraça de energia, Eternabeam carregado e três fases. Interromper o golpe carregado abre a Ruptura.',
    badge: { icone: '🌌', nome: 'Domador do Infinito', titulo: 'Domador do Infinito' } }),
  ev({ id: 'rayquaza-mega', gen: 3, nome: 'Mega Rayquaza', especie: 'rayquaza', especieId: 384, formaId: 10079,
    golpes: ['dragon-claw', 'air-slash', 'earthquake', 'extreme-speed'],
    resumo: 'Ponto fraco que muda a cada duas ações (só o tipo da vez machuca) e o Dragon Ascent carregado, que atinge o time inteiro.',
    badge: { icone: '🐉', nome: 'Guardião do Pilar Celeste', titulo: 'Guardião do Pilar Celeste' } }),
  ev({ id: 'groudon-primal', gen: 3, nome: 'Groudon Primal', especie: 'groudon', especieId: 383, formaId: 10078,
    golpes: ['earthquake', 'fire-blast', 'stone-edge', 'overheat'],
    resumo: 'Sol primordial permanente: golpes de Água são evaporados. Couraça de magma e as Lâminas do Precipício carregadas.',
    badge: { icone: '🌋', nome: 'Domador do Magma', titulo: 'Herdeiro da Terra' } }),
  ev({ id: 'kyogre-primal', gen: 3, nome: 'Kyogre Primal', especie: 'kyogre', especieId: 382, formaId: 10077,
    golpes: ['surf', 'ice-beam', 'thunder', 'hydro-pump'],
    resumo: 'Chuva primordial permanente: golpes de Fogo são apagados. Couraça de maré e o Pulso da Origem carregado.',
    badge: { icone: '🌊', nome: 'Senhor das Marés', titulo: 'Soberano dos Oceanos' } }),
  ev({ id: 'mewtwo-mega-y', gen: 1, nome: 'Mega Mewtwo', especie: 'mewtwo', especieId: 150, formaId: 10044,
    golpes: ['psychic', 'focus-blast', 'shadow-ball', 'thunderbolt'],
    resumo: 'Barreira psíquica: só Inseto, Fantasma e Sombrio a atravessam. Muda para o "modo X" (físico) na fase 2. Psystrike carregado.',
    badge: { icone: '🧠', nome: 'Mente Inquebrável', titulo: 'Mestre da Mente' } }),
  ev({ id: 'necrozma-ultra', gen: 7, nome: 'Necrozma Ultra', especie: 'necrozma', especieId: 800, formaId: 10157,
    golpes: ['psychic', 'dragon-claw', 'dark-pulse', 'flash-cannon'],
    resumo: 'Armadura de prisma: uma cor (tipo) vulnerável por vez, a cada 3 ações, e couraça de luz. Gêiser de Fótons carregado.',
    badge: { icone: '💠', nome: 'Caçador de Prismas', titulo: 'Colecionador de Luz' } }),
  ev({ id: 'calyrex-shadow', gen: 8, nome: 'Calyrex Cavaleiro Espectral', especie: 'calyrex', especieId: 898, formaId: 10194,
    golpes: ['psychic', 'shadow-ball', 'dark-pulse', 'focus-blast'],
    resumo: 'Bola de neve: cada Pokémon seu derrubado aumenta o Ataque Especial dele. Velocidade absurda e Astral Barrage carregado.',
    badge: { icone: '🐴', nome: 'Cavaleiro Espectral', titulo: 'Rei Sombrio' } }),
  ev({ id: 'zacian-crowned', gen: 8, nome: 'Zacian Coroada', especie: 'zacian', especieId: 888, formaId: 10188,
    golpes: ['sacred-sword', 'close-combat', 'stone-edge', 'flash-cannon'],
    resumo: 'Couraça de aço muito dura (só 30% do dano passa) e a Lâmina Colossal carregada, que deixa a Coroada exposta depois.',
    badge: { icone: '👑', nome: 'Portador da Coroa', titulo: 'Cavaleiro Coroado' } }),
  ev({ id: 'kyurem-black', gen: 5, nome: 'Kyurem Negro', especie: 'kyurem', especieId: 646, formaId: 10022,
    golpes: ['ice-beam', 'dragon-claw', 'fusion-bolt', 'earth-power'],
    resumo: 'Ponto fraco rotativo (Lutador, Pedra, Aço, Fada, Dragão) e couraça de gelo. Fusion Bolt carregado.',
    badge: { icone: '❄️', nome: 'Quebra-Geada', titulo: 'Quebrador de Gelo' } }),
  ev({ id: 'giratina-origin', gen: 4, nome: 'Giratina Origem', especie: 'giratina', especieId: 487, formaId: 10007,
    golpes: ['shadow-claw', 'dragon-claw', 'earthquake', 'shadow-ball'],
    resumo: 'Mundo Reverso: a cada 3 ações a tabela de tipos INVERTE (super efetivo vira fraco). Couraça e Esfera do Reverso carregada.',
    badge: { icone: '🔄', nome: 'Viajante do Reverso', titulo: 'Andarilho do Mundo Reverso' } }),
  ev({ id: 'dialga-origin', gen: 4, nome: 'Dialga Origem', especie: 'dialga', especieId: 483, formaId: 10245,
    golpes: ['flash-cannon', 'draco-meteor', 'thunder', 'earth-power'],
    resumo: 'Tempo acelerado a cada fase (Velocidade dobrada) e o Roar of Time carregado, que o obriga a recarregar depois.',
    badge: { icone: '⏳', nome: 'Mestre do Tempo', titulo: 'Guardião do Tempo' } }),
  ev({ id: 'terapagos-stellar', gen: 9, nome: 'Terapagos Estelar', especie: 'terapagos', especieId: 1024, formaId: 10277,
    golpes: ['earth-power', 'dark-pulse', 'flash-cannon', 'ice-beam'],
    resumo: 'Casco Tera: o tipo do último golpe que ele recebeu é resistido no seguinte. Varie os tipos! Tera Starstorm carregada.',
    badge: { icone: '💎', nome: 'Estrela Cristalina', titulo: 'Estrela Tera' } }),
  ev({ id: 'ursaluna-bloodmoon', gen: 9, nome: 'Ursaluna Lua de Sangue', especie: 'ursaluna', especieId: 901, formaId: 10272,
    golpes: ['earth-power', 'hammer-arm', 'gunk-shot', 'focus-blast'],
    resumo: 'Lua de Sangue: cura 30% do dano que causa. Quanto mais a luta demora, mais ele aguenta. Blood Moon carregada.',
    badge: { icone: '🌑', nome: 'Caçador da Lua Rubra', titulo: 'Lua Sangrenta' } }),
  ev({ id: 'zygarde-complete', gen: 6, nome: 'Zygarde Completo', especie: 'zygarde', especieId: 718, formaId: 10120,
    golpes: ['thousand-arrows', 'earthquake', 'dragon-claw', 'draco-meteor'],
    resumo: 'Células que se regeneram a cada ação (só param com o chefe exposto), couraça e Core Enforcer carregado.',
    badge: { icone: '🧩', nome: 'Guardião do Equilíbrio', titulo: 'Ordem Perfeita' } })
];
/* ---- calendário ---- */
export const indiceDaSemana = agora => Math.floor((agora - INICIO) / SEMANA_MS);
export const inicioDaSemana = indice => INICIO + indice * SEMANA_MS;
export const fimDaSemana = agora => inicioDaSemana(indiceDaSemana(agora) + 1);
export const eventoDoIndice = i => EVENTOS[((i % EVENTOS.length) + EVENTOS.length) % EVENTOS.length];
// "2026-S00", "2026-S01"…: identifica a semana pra guardar o que foi vencido
export const idDaSemana = agora => { const i = Math.max(0, indiceDaSemana(agora)); return `${new Date(inicioDaSemana(i)).getUTCFullYear()}-S${String(i).padStart(2, '0')}`; };
// o chefe desta semana; null ANTES da semana 0 (o evento ainda não começou)
export const eventoDaSemana = agora => (agora < INICIO ? null : eventoDoIndice(indiceDaSemana(agora)));
export const jaComecou = agora => agora >= INICIO;

// o evento desta semana, se ele mora neste mapa (Gen); null se a Gen não tem chefe agora
export const eventoDaGen = (gen, agora = agoraDoEvento()) => { const e = eventoDaSemana(agora); return e && e.gen === gen ? e : null; };
// este modo joga eventos? (Roguelike e Hardcore)
export const modoComEvento = dificuldade => !!DIFICULDADES[dificuldade]?.eventoSemanal;

/* Agenda: os próximos `n` chefes, a começar pela semana em curso (ou pela semana 0, se o evento ainda não começou).
   Cada linha: { indice, inicio, fim, evento, atual } */
export function agenda(agora = agoraDoEvento(), n = 3) {
  const i0 = Math.max(0, indiceDaSemana(agora)), atualIdx = jaComecou(agora) ? indiceDaSemana(agora) : -1;
  return Array.from({ length: n }, (_, k) => { const i = i0 + k; return { indice: i, inicio: inicioDaSemana(i), fim: inicioDaSemana(i + 1), evento: eventoDoIndice(i), atual: i === atualIdx }; });
}
// dd/mm no horário de Brasília (sem depender do fuso do aparelho)
export function dataBR(ms) {
  const d = new Date(ms + FUSO_MS), dd = String(d.getUTCDate()).padStart(2, '0'), mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

/* ---- tentativas: 1 a cada 8 horas ---- */
export const ultimaTentativa = () => store.get(TENTATIVA_KEY) || 0;
export const registrarTentativa = (agora = agoraDoEvento()) => store.set(TENTATIVA_KEY, agora);
export const esperaRestante = (ultima, agora = agoraDoEvento()) => Math.max(0, (ultima || 0) + COOLDOWN_MS - agora);
export function formatarEspera(ms) {
  const min = Math.ceil(ms / 60000), h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h${m ? ` ${String(m).padStart(2, '0')}min` : ''}` : `${m}min`;
}

/* Pode desafiar agora? Devolve { ok, evento?, esperaMs?, motivo? }:
     'em-breve'   o evento ainda não começou (o chefe da semana 0 já é conhecido: vem em `evento`, e o início em `inicio`);
     'sem-evento' esta Gen não tem chefe esta semana;  'modo' o modo de jogo não joga eventos;  'espera' as 8 horas ainda não passaram. */
export function situacaoDoEvento({ dificuldade, gen }, agora = agoraDoEvento(), ultima = ultimaTentativa()) {
  if (!jaComecou(agora)) {
    const primeiro = EVENTOS[0];
    if (primeiro.gen !== gen) return { ok: false, motivo: 'sem-evento' };
    return modoComEvento(dificuldade) ? { ok: false, evento: primeiro, motivo: 'em-breve', inicio: INICIO } : { ok: false, evento: primeiro, motivo: 'modo' };
  }
  const evento = eventoDaGen(gen, agora);
  if (!evento) return { ok: false, motivo: 'sem-evento' };
  if (!modoComEvento(dificuldade)) return { ok: false, evento, motivo: 'modo' };
  const esperaMs = esperaRestante(ultima, agora);
  if (esperaMs > 0) return { ok: false, evento, motivo: 'espera', esperaMs };
  return { ok: true, evento };
}
