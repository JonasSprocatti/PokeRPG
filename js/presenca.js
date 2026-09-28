/* ============ presença global (marcador "jogando agora") ============
   Canal Realtime único, compartilhado por TODO MUNDO que abre o jogo (com ou sem conta) — diferente da
   presença por SALA (multiplayer.js, um canal por código de sala). O `track` manda um payload VAZIO: esta
   contagem nunca identifica quem está online, só QUANTOS — nenhum nome, ícone ou id aparece em lugar nenhum.
   Sem Supabase configurado, tudo aqui é no-op (`onlineAgora()` fica `null` pra sempre, a tela nem desenha o bloco).

   Separado disso: `visitantes_anonimos` no banco é um contador HISTÓRICO (nunca encolhe) de quantos ids de
   visitante distintos já jogaram sem conta — pedido do usuário, ADMIN-ONLY (as duas RPCs em
   supabase/migrations/20260928120000_visitantes_anonimos.sql: uma registra, a outra só devolve o total pra
   quem é admin). Não tem nada a ver com o canal de presença: aquele é "agora", este é "desde sempre". Guardado
   só o `idJogador()` que o jogo já gera pra multiplayer (nuvem.js) — nada de PII, sem e-mail nem IP.

   NÃO é telemetria silenciosa: divulgado na tela 🔒 Privacidade e com interruptor em ⚙ Ajustes
   (`presencaLigada`/`definirPresenca`) — desligar tira você da contagem ao vivo e para de registrar presença
   de visitante sem conta. Padrão ligado (é o que faz o marcador ter algum número pra mostrar). */
import { sb, nuvemConfigurada, idJogador, usuario, ehAdmin } from './nuvem.js';
import { store } from './util.js';

const CANAL = 'pokerpg-presenca-global';
const OPT_OUT_KEY = 'pokerpg-presenca-desligada';
export const presencaLigada = () => !store.get(OPT_OUT_KEY);

let canal = null, online = null;   // null = ainda não sei (sem config, desligado, ou não sincronizou ainda)
const ouvintes = new Set();
const avisar = () => ouvintes.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
export const aoMudarOnline = fn => { ouvintes.add(fn); fn(); };
export const onlineAgora = () => online;

export async function iniciarPresencaGlobal() {
  if (canal || !nuvemConfigurada() || !presencaLigada()) return;
  const c = await sb(); if (!c) return;
  canal = c.channel(CANAL, { config: { presence: { key: idJogador() } } });
  canal.on('presence', { event: 'sync' }, () => { online = Object.keys(canal.presenceState()).length; avisar(); });
  canal.subscribe(async status => {
    if (status === 'SUBSCRIBED') await canal.track({});
    else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      online = null; avisar();
      setTimeout(() => { if (canal) canal.subscribe(); }, 5000);   // tenta voltar sozinho, sem pressa
    }
  });
}
async function pararPresencaGlobal() {
  online = null; avisar();
  if (!canal) return;
  const c = await sb(), alvo = canal; canal = null;
  if (c) await c.removeChannel(alvo);
}
// interruptor de ⚙ Ajustes: liga/desliga a presença ao vivo E o registro de visitante sem conta
export function definirPresenca(ligada) {
  store.set(OPT_OUT_KEY, !ligada);
  if (ligada) iniciarPresencaGlobal(); else pararPresencaGlobal();
}

// visitante sem conta: registra a PRIMEIRA vez (idempotente no banco, `on conflict do nothing`) — um por boot
export async function registrarVisitanteAnonimo() {
  if (usuario() || !nuvemConfigurada() || !presencaLigada()) return;
  const c = await sb(); if (!c) return;
  try { await c.rpc('registrar_visitante_anonimo', { p_id: idJogador() }); }
  catch (e) { console.warn('visitante anônimo', e.message); }
}

// contador histórico, só pra admin — null se não for admin, sem config, ou a RPC falhar (não roda a migração ainda)
export async function contagemAnonimos() {
  if (!ehAdmin()) return null;
  const c = await sb(); if (!c) return null;
  const { data, error } = await c.rpc('contagem_visitantes_anonimos');
  if (error) { console.warn('contagem de visitantes', error.message); return null; }
  return data;
}
