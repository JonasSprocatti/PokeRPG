/* ============ jornadas salvas (vários saves de runs em andamento) ============ */
// A jornada ATUAL continua em SAVE_KEY (estado.js). As outras em andamento ficam GUARDADAS aqui, pra continuar
// depois: dá pra ter várias runs abertas ao mesmo tempo (tela 💾 Jornadas salvas, tela-saves.js).
// Na nuvem, cada jornada em andamento é uma linha de `saves` (user_id + jornada_id): a atual e as guardadas.
//   guardar(S)   → tira da frente e guarda        excluir(id) → apaga (e lembra o id, pra apagar da nuvem também
//                                                              e ela não voltar numa sincronização)
// A sincronização decide tudo por reconciliarSaves (puro, testado em tests/saves.test.js).
import { store } from './util.js';

export const GUARDADOS_KEY = 'pokerpg-saves-guardados-v1';
export const EXCLUIDOS_KEY = 'pokerpg-saves-excluidos-v1';
export const MAX_GUARDADAS = 12; // cada save tem a curva de XP e os dados do Pokémon: o localStorage tem limite

export const guardadas = () => store.get(GUARDADOS_KEY) || {};
export const listaGuardadas = () => Object.values(guardadas()).sort((a, b) => (b.salvoEm || 0) - (a.salvoEm || 0));
export const excluidos = () => new Set(store.get(EXCLUIDOS_KEY) || []);

// guarda (ou atualiza) uma jornada. false = não coube (limite) — quem chama avisa
export function guardar(S) {
  if (!S?.id) return false;
  const g = guardadas();
  if (!g[S.id] && Object.keys(g).length >= MAX_GUARDADAS) return false;
  g[S.id] = S; store.set(GUARDADOS_KEY, g);
  return true;
}
// tira da lista e devolve (pra virar a jornada atual)
export function retirar(id) {
  const g = guardadas(), S = g[id] || null;
  delete g[id]; store.set(GUARDADOS_KEY, g);
  return S;
}
export function excluir(id) {
  retirar(id);
  store.set(EXCLUIDOS_KEY, [...excluidos(), id].slice(-200));
}
// a nuvem já apagou: não precisa mais lembrar
export function esquecerExcluido(id) { store.set(EXCLUIDOS_KEY, [...excluidos()].filter(x => x !== id)); }

// resumo de um save pra lista (sem abrir o jogo)
export const resumoSave = S => ({
  id: S.id, nome: S.player?.nick || S.player?.name || '?', especie: S.player?.name || '?', pokeId: S.player?.id, shiny: !!S.player?.shiny,
  nivel: S.player?.level || 1, dificuldade: S.dificuldade || 'easy', gen: S.gen || 1, salvoEm: S.salvoEm || 0, dinheiro: S.money || 0
});

// Junta os saves deste aparelho com os da nuvem. Nada é descartado sem o jogador pedir:
//   - terminada (está na carreira) ou excluída aqui → apagar da nuvem (e daqui)
//   - mesma jornada dos dois lados → vale a versão mais nova (salvoEm), sem perguntar
//   - só na nuvem e desconhecida aqui → `perguntar` (continuar / guardar / excluir)
//   - só aqui → subir
// Entradas: ativo (a jornada atual ou null), guardadas ({id: S}), remotos ([{ jornada_id, dados }]),
// terminadas (Set de ids da carreira), excluidos (Set). Não muta nada; devolve o que fazer.
export function reconciliarSaves({ ativo, guardadas: gs, remotos, terminadas, excluidos: exc }) {
  const out = { novoAtivo: null, ativoTerminou: false, guardadas: { ...gs }, perguntar: [], subir: [], apagarRemotos: [], esquecer: [] };
  const fora = id => terminadas.has(id) || exc.has(id);
  if (ativo?.id && terminadas.has(ativo.id)) { out.ativoTerminou = true; ativo = null; }
  for (const id of Object.keys(out.guardadas)) if (fora(id)) delete out.guardadas[id];
  const naNuvem = new Set();
  for (const r of remotos) {
    const id = r.jornada_id, d = r.dados; naNuvem.add(id);
    if (fora(id)) { out.apagarRemotos.push(id); continue; }
    if (ativo?.id === id) { if ((d.salvoEm || 0) > (ativo.salvoEm || 0)) out.novoAtivo = d; else out.subir.push(ativo); continue; }
    const g = out.guardadas[id];
    if (g) { if ((d.salvoEm || 0) > (g.salvoEm || 0)) out.guardadas[id] = d; else out.subir.push(g); continue; }
    out.perguntar.push(d);
  }
  if (ativo?.id && !naNuvem.has(ativo.id)) out.subir.push(ativo);
  for (const [id, g] of Object.entries(out.guardadas)) if (!naNuvem.has(id)) out.subir.push(g);
  // exclusões que a nuvem nem tem mais: já pode esquecer
  out.esquecer = [...exc].filter(id => !naNuvem.has(id));
  return out;
}
