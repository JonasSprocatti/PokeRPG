/* ============ multiplayer: a camada de rede da sala (sem DOM) ============
   Envio confiável, diagnóstico, pulso do anfitrião e presença. Nada aqui desenha nada: quando algo muda, a rede
   chama `redesenhar()`, que é um recado pra tela registrada por `ligarRender()` (multiplayer.js faz isso no boot
   da sala). É o que quebra o ciclo — a rede nunca importa a tela.

   O Realtime do Supabase às vezes engole um broadcast (aba em segundo plano, rede oscilando). Antes isso travava a
   sala: a escolha de alguém não chegava no anfitrião e o turno só saía quando o prazo de 45 s estourava. Por isso:
   • `enviar` confere a resposta e tenta de novo (o `send` devolve 'ok' | 'timed out' | 'error');
   • o anfitrião republica o estado a cada PULSO_MS enquanto espera escolhas (quem perdeu a mensagem se acerta sozinho);
   • qualquer um pede o estado de novo com 🔄 Sincronizar (evento 'sincronizar');
   • tudo fica no diagnóstico da sala (últimas linhas) e no console com o prefixo [mp]. */
import { G } from './estado.js';
import { canalSala, fecharCanal, idJogador } from './nuvem.js';
import { rand } from './util.js';

export const PULSO_MS = 4000, ESPERA_ANFITRIAO_MS = 20000;
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I pra não confundir
export const novoCodigo = () => Array.from({ length: 4 }, () => LETRAS[rand(0, LETRAS.length - 1)]).join('');
export const codigoValido = c => /^[A-Z0-9]{4}$/.test(String(c || '').trim().toUpperCase());

/* A sala mora em `G.sala` (estado compartilhado sempre via `G.*`, nunca `let` exportado — CLAUDE.md). Antes era um
   `let sala` de módulo, e por isso só `multiplayer.js` conseguia enxergá-la. */
export const naSala = () => !!G.sala;
export const membroDe = id => G.sala?.membros.find(m => m.id === id);
// id na sala: o da conta, ou um de visitante guardado neste navegador (idJogador, nuvem.js — a mesma fonte da
// presença global, presenca.js, pra não existirem dois ids do mesmo jogador)
export const meuId = idJogador;

/* ---------- o recado pra tela ---------- */
let pintar = () => {};
export const ligarRender = fn => { pintar = typeof fn === 'function' ? fn : () => {}; };
export const redesenhar = () => pintar();

/* ---------- diagnóstico ---------- */
const diario = [];
export function anotar(txt, ruim = false) {
  diario.push({ t: Date.now(), txt, ruim });
  if (diario.length > 40) diario.shift();
  console[ruim ? 'warn' : 'debug']('[mp]', txt);
  if (G.sala) G.sala.ultimoEvento = Date.now();
}
export const diarioMP = () => diario.slice(-8).reverse();

/* ---------- envio ----------
   Uma mensagem por vez (fila): com 6 jogadores agindo no mesmo segundo, disparar tudo junto só multiplica os
   "timed out" que a retentativa já teria de cobrir. */
let fila = Promise.resolve();
export function enviar(event, payload, tentativas = 3) {
  const proxima = fila.then(() => enviarAgora(event, payload, tentativas));
  fila = proxima.catch(() => {});   // uma falha não pode travar a fila inteira
  return proxima;
}
async function enviarAgora(event, payload, tentativas) {
  for (let i = 1; i <= tentativas; i++) {
    const sala = G.sala;
    if (!sala?.canal) return false;
    let r;
    try { r = await sala.canal.send({ type: 'broadcast', event, payload }); } catch (e) { r = 'erro: ' + e.message; }
    if (r === 'ok') { anotar(`→ ${event}${i > 1 ? ` (na ${i}ª tentativa)` : ''}`); if (G.sala) G.sala.conexao = 'ok'; return true; }
    anotar(`⚠ não consegui enviar "${event}" (${r}) — tentativa ${i} de ${tentativas}`, true);
    await new Promise(ok => setTimeout(ok, 400 * i));
  }
  if (G.sala) { G.sala.conexao = 'instavel'; redesenhar(); }
  return false;
}

/* ---------- pulso do anfitrião ----------
   Uma batida a cada PULSO_MS enquanto a luta rola; QUEM decide o que mandar é o multiplayer.js (um 'ping' magro
   quase sempre, o estado inteiro de vez em quando). Aqui só mora o timer. */
export function ligarPulso(bater) {
  const sala = G.sala;
  if (!sala?.anfitriao) return;
  clearInterval(sala.pulso);
  sala.pulso = setInterval(() => {
    if (!G.sala?.anfitriao || !G.sala.batalha || G.sala.resolvendo) return;
    bater();
  }, PULSO_MS);
}
export const desligarPulso = () => { if (G.sala) clearInterval(G.sala.pulso); };

/* ---------- canal ---------- */
export const abrirCanal = codigo => canalSala(codigo, meuId());
// anuncia de novo o meu payload de presença (Pokémon, nome, pronto, time…)
export const retrack = payload => G.sala?.canal?.track(payload);
// membros pela presença, anfitrião primeiro e depois por ordem de chegada
export const membrosDaPresenca = canal => Object.values(canal.presenceState()).map(l => l[0]).filter(Boolean)
  .sort((a, b) => (b.anfitriao - a.anfitriao) || (a.entrouEm - b.entrouEm));
// desliga tudo o que a sala mantinha aceso (4 timers + canal). Sempre por aqui: timer órfão é vazamento silencioso.
export async function fecharSala(sala) {
  if (!sala) return;
  clearTimeout(sala.timer); clearInterval(sala.relogio); clearInterval(sala.pulso); clearTimeout(sala.semAnfitriao);
  try { await sala.canal?.untrack(); await fecharCanal(sala.canal); } catch (e) { console.error(e); }
}
