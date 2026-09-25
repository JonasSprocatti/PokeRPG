/* ============ Hall da Fama ============
   Quando uma jornada Roguelike ou Hardcore TERMINA (venceu, desmaiou, foi capturado ou você encerrou), o Pokémon principal dela
   entra no Hall da Fama da conta e fica disponível na Arena do Chefe (arena.js): dá pra enfrentar o chefe da semana com ele sem
   precisar fazer uma run inteira até a Gen do chefe (antes, chegar ao Eternatus exigia passar pelas 8 Gens).
   O Hall guarda só o que é preciso pra RECONSTRUIR o Pokémon (espécie, nível, IVs/EVs, natureza, habilidade, golpes): a ficha
   pesada (lista de golpes da espécie, curva de XP…) vem da PokéAPI na hora de usar. Mora em `progresso.hall`, junto do progresso
   permanente: sobe pra nuvem e a fusão entre aparelhos é união. Cada entrada é UM Pokémon de UMA jornada (chave = id dela).
   Puro (sem DOM, sem rede): tests/hall.test.js. */
import { DIFICULDADES } from './dados.js';

export const HALL_MAX = 30;   // as melhores entradas ficam (mais alto nível; empate: a mais recente)

// esta dificuldade manda o Pokémon pro Hall? (as que jogam evento: Roguelike e Hardcore)
export const entraNoHall = dificuldade => !!DIFICULDADES[dificuldade]?.eventoSemanal;

export function compactarPokemon(M) {
  return {
    id: M.id, especie: M.data?.speciesName || M.name, nome: M.name, nick: M.nick || '', nivel: M.level, shiny: !!M.shiny,
    ivs: { ...(M.ivs || {}) }, evs: { ...(M.evs || {}) }, nature: M.nature, ability: M.ability,
    moves: (M.moves || []).map(m => m.name)
  };
}

/* A entrada do Hall de uma jornada que acabou de terminar (`resumo` = fim.montarResumo). null se o modo não entra. */
export function entradaDoHall(S, resumo) {
  if (!S?.player || !resumo?.id || !entraNoHall(resumo.dificuldade)) return null;
  return { chave: resumo.id, ...compactarPokemon(S.player), gen: S.gen || 1, dificuldade: resumo.dificuldade, motivo: resumo.motivo || null,
    em: resumo.data || new Date().toISOString() };
}

// mantém só as HALL_MAX melhores: nível maior primeiro, e no empate a mais recente
const melhor = (a, b) => (b.nivel - a.nivel) || String(b.em || '').localeCompare(String(a.em || ''));
export function podarHall(hall, max = HALL_MAX) {
  const lista = Object.values(hall || {}).sort(melhor).slice(0, max);
  return Object.fromEntries(lista.map(e => [e.chave, e]));
}

// grava a entrada no progresso (devolve o progresso NOVO; não muta). Sem entrada, devolve o mesmo.
export function registrarNoHall(progresso, entrada) {
  if (!entrada?.chave) return progresso;
  return { ...progresso, hall: podarHall({ ...(progresso?.hall || {}), [entrada.chave]: entrada }) };
}

// a lista pronta pra tela: melhores primeiro
export const listaDoHall = progresso => Object.values(progresso?.hall || {}).sort(melhor);

// fusão de dois Halls (este aparelho + nuvem): união pela chave, e poda
export const mesclarHall = (a, b) => podarHall({ ...(a || {}), ...(b || {}) });
