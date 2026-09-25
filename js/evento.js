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
export const EVENTOS = [
  {
    id: 'eternatus-eternamax', gen: 8, nome: 'Eternatus Eternamax', chefe: 'eternatus-eternamax',
    especie: 'eternatus', especieId: 890, forma: 'eternatus-eternamax', formaId: 10190,
    // golpes do chefe (nomes da PokéAPI): dano de dois tipos, um pra cada defesa, e o de cobertura
    golpes: ['sludge-wave', 'dragon-pulse', 'flamethrower', 'flash-cannon'],
    resumo: 'Couraça de energia, Eternabeam carregado e três fases. Interromper o golpe carregado abre a Ruptura.',
    // `vantagem` = o que a badge dá no começo de TODA jornada futura (pequeno, como as outras badges); `recompensa` = o prêmio
    // da vitória em si, pago uma vez por semana vencida
    badge: { icone: '🌌', nome: 'Domador do Infinito', titulo: 'Domador do Infinito', vantagem: { dinheiro: 2000, itens: { 'rare-candy': 1 } } },
    recompensa: { dinheiro: 8000, itens: { 'rare-candy': 3 } }
  },
  {
    id: 'rayquaza-mega', gen: 3, nome: 'Mega Rayquaza', chefe: 'rayquaza-mega',
    especie: 'rayquaza', especieId: 384, forma: 'rayquaza-mega', formaId: 10079,
    golpes: ['dragon-claw', 'air-slash', 'earthquake', 'extreme-speed'],
    resumo: 'Ponto fraco que muda a cada duas ações (só o tipo da vez machuca) e o Dragon Ascent carregado, que atinge o time inteiro.',
    badge: { icone: '🐉', nome: 'Guardião do Pilar Celeste', titulo: 'Guardião do Pilar Celeste', vantagem: { dinheiro: 2000, itens: { 'rare-candy': 1 } } },
    recompensa: { dinheiro: 8000, itens: { 'rare-candy': 3 } }
  }
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
