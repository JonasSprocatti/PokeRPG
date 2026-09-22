/* ============ nuvem (Supabase: login + carreira + save da jornada) ============ */
// Login com Google ou link por e-mail. Com conta:
//   • carreira: jornadas terminadas sobem/descem (tabela `jornadas`), juntadas sem duplicar (mesclarJornadas)
//   • save da jornada em andamento (tabela `saves`, uma linha por conta): sobe sozinho depois de cada save()
//     (agendarEnvioSave, com espera) e ao sair da aba; em outro aparelho, a sincronização oferece continuar.
// Sem config (js/config.js com marcadores) tudo aqui vira no-op e o jogo segue só local.
// O cliente do Supabase é carregado sob demanda (import dinâmico) — nada disso roda nos testes.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { carregarCarreira, salvarCarreira, mesclarJornadas } from './carreira.js';
import { offline } from './util.js';

export const nuvemConfigurada = () => !!SUPABASE_URL && !SUPABASE_URL.includes('SEU-PROJETO') && !!SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('SUA-CHAVE');

let cliente = null, sessao = null;
async function sb() {
  if (!nuvemConfigurada()) return null;
  if (!cliente) {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return cliente;
}
export const usuario = () => sessao?.user || null;

// estado mostrado na tela de conta / no chip do topo
export const nuvem = { status: 'ocioso', erro: null, naNuvem: 0, apelido: '', ultimaSync: null };
const ouvintes = new Set();
const avisar = () => ouvintes.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
export const aoMudarNuvem = fn => { ouvintes.add(fn); fn(); };

// Ganchos que o jogo registra (main.js) — a nuvem não conhece a tela:
//   saveLocal()            → o save da jornada atual (ou null)
//   jornadaTerminada(id)   → descartar o save local dessa jornada (ela já acabou em outro aparelho)
//   oferecerSave(remoto, local) → perguntar se quer continuar a jornada da nuvem (local = a deste aparelho, que
//                            seria descartada, ou null); devolve true pra carregar a da nuvem
//   carregarSave(remoto)   → trocar a jornada atual pela da nuvem
export const ganchos = { saveLocal: () => null, jornadaTerminada: () => {}, oferecerSave: async () => false, carregarSave: () => {} };

let iniciada = false, ouvindoRede = false;
export async function iniciarNuvem() {
  if (iniciada) return;
  if (!ouvindoRede) { // uma vez só, mesmo que iniciarNuvem seja tentada de novo depois de abrir offline
    ouvindoRede = true;
    // voltou a internet: termina de iniciar (se o jogo abriu offline) e manda tudo o que ficou pendente
    addEventListener('online', () => { avisar(); if (!iniciada) iniciarNuvem().catch(e => console.error(e)); else if (usuario()) sincronizar(); });
    addEventListener('offline', avisar);
  }
  let c;
  try { c = await sb(); }
  catch (e) { console.warn('nuvem: biblioteca indisponível (offline?)', e); avisar(); return; } // tenta de novo no 'online'
  if (!c) { avisar(); return; }
  iniciada = true;
  const { data } = await c.auth.getSession();
  sessao = data.session; avisar();
  c.auth.onAuthStateChange((evento, s) => {
    sessao = s; avisar();
    if (evento === 'SIGNED_IN') sincronizar();
    if (evento === 'SIGNED_OUT') { nuvem.apelido = ''; nuvem.naNuvem = 0; nuvem.status = 'ocioso'; avisar(); }
  });
  if (sessao) sincronizar();
  // sair da aba / fechar: manda o save pendente na hora
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') enviarSaveAgora(); });
  addEventListener('pagehide', enviarSaveAgora);
}

const voltarPraCa = () => location.origin + location.pathname;
export async function entrarGoogle() {
  const c = await sb(); if (!c) return;
  const { error } = await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: voltarPraCa() } });
  if (error) throw error;
}
export async function entrarEmail(email) {
  const c = await sb(); if (!c) return;
  const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: voltarPraCa() } });
  if (error) throw error;
}
export async function sair() { await enviarSaveAgora(); const c = await sb(); if (c) await c.auth.signOut(); }

export async function salvarApelido(apelido) {
  const c = await sb(), u = usuario(); if (!c || !u) return;
  const { error } = await c.from('perfis').upsert({ id: u.id, apelido });
  if (error) throw error;
  nuvem.apelido = apelido; avisar();
}

const linhaJornada = j => ({ id: j.id, user_id: j.dono, especie: j.especie, dificuldade: j.dificuldade, pontuacao: j.pontuacao, nivel: j.nivel, resumo: j, terminou_em: j.data });

// Junta carreira local + nuvem e reconcilia o save da jornada em andamento. Chamada ao entrar, ao abrir o jogo
// logado e depois de toda jornada terminada.
export async function sincronizar() {
  const c = await sb(), u = usuario(); if (!c || !u) return;
  if (offline()) { nuvem.status = 'offline'; avisar(); return; } // o listener 'online' chama de novo
  nuvem.status = 'sincronizando'; nuvem.erro = null; avisar();
  try {
    // perfil (apelido padrão = começo do e-mail)
    const { data: perfil, error: ep } = await c.from('perfis').select('apelido').eq('id', u.id).maybeSingle();
    if (ep) throw ep;
    if (!perfil) {
      const apelido = (u.user_metadata?.name || u.email || 'Treinador').split('@')[0].slice(0, 20);
      const { error } = await c.from('perfis').insert({ id: u.id, apelido }); if (error) throw error;
      nuvem.apelido = apelido;
    } else nuvem.apelido = perfil.apelido || '';

    // carreira: sobe o que só existe aqui, baixa o que só existe lá
    const { data: linhas, error: ej } = await c.from('jornadas').select('resumo'); if (ej) throw ej;
    const remotas = linhas.map(l => l.resumo);
    const { todas, subir } = mesclarJornadas(carregarCarreira().jornadas, remotas, u.id);
    // uma por vez: se o servidor recusar uma (validar_jornada), as outras sobem mesmo assim
    let subiram = 0;
    for (const j of subir) {
      const { error } = await c.from('jornadas').upsert(linhaJornada(j), { onConflict: 'id', ignoreDuplicates: true });
      if (!error) { subiram++; continue; }
      if (error.code === 'P0001') { const x = todas.find(t => t.id === j.id); if (x) x.recusada = error.message; } // recusada: não reenvia
      else throw error; // rede/permissão: tenta tudo de novo na próxima
    }
    salvarCarreira({ jornadas: todas });
    nuvem.naNuvem = remotas.length + subiram;

    // save da jornada em andamento
    const terminadas = new Set(todas.map(j => j.id));
    const local = ganchos.saveLocal();
    if (local?.id && terminadas.has(local.id)) ganchos.jornadaTerminada(local.id); // acabou em outro aparelho
    const { data: remoto, error: es } = await c.from('saves').select('jornada_id, dados, atualizado_em').eq('user_id', u.id).maybeSingle();
    if (es) throw es;
    // Uma jornada em andamento por conta. Mesma jornada: vale a versão mais nova, sem perguntar.
    // Jornadas diferentes (ou só existe a da nuvem): pergunta — a que não for escolhida é descartada.
    const localAgora = ganchos.saveLocal();
    if (remoto && terminadas.has(remoto.jornada_id)) await apagarSaveNuvem();
    else if (remoto && localAgora && remoto.jornada_id === localAgora.id) {
      if ((remoto.dados.salvoEm || 0) > (localAgora.salvoEm || 0)) ganchos.carregarSave(remoto.dados);
      else await enviarSaveAgora(true);
    } else if (remoto) {
      if (await ganchos.oferecerSave(remoto.dados, localAgora)) ganchos.carregarSave(remoto.dados);
      else if (localAgora) await enviarSaveAgora(true);
      // sem jornada aqui e recusou: não apaga nada — a da nuvem só é substituída quando uma jornada nova for salva
    } else if (localAgora) await enviarSaveAgora(true);

    nuvem.status = 'ok'; nuvem.ultimaSync = new Date();
  } catch (e) {
    console.error(e); nuvem.status = 'erro'; nuvem.erro = e.message || String(e);
  }
  avisar();
}

// Ranking global (funções `ranking` e `especies_ranqueadas` do schema.sql). Funciona sem login (só pra ver).
// especie null = geral. Devolve linhas { posicao, apelido, especie, pontuacao, nivel, dificuldade, terminou_em, eu }.
export async function buscarRanking(especie = null, limite = 50) {
  const c = await sb(); if (!c) throw new Error('nuvem não configurada');
  if (offline()) throw new Error('sem internet');
  const { data, error } = await c.rpc('ranking', { p_especie: especie, p_limite: limite });
  if (error) throw error;
  return data;
}
export async function especiesRanqueadas() {
  const c = await sb(); if (!c) return [];
  const { data, error } = await c.rpc('especies_ranqueadas');
  if (error) throw error;
  return data;
}

// Multiplayer: canal Realtime da sala (broadcast + presence). `chave` = id do jogador na presença.
// Não precisa de login: basta o Supabase configurado (visitante usa um id aleatório guardado no navegador).
export async function canalSala(codigo, chave) {
  const c = await sb(); if (!c) throw new Error('modo online não configurado');
  return c.channel('pokerpg-sala-' + codigo, { config: { broadcast: { self: false }, presence: { key: chave } } });
}
export async function fecharCanal(canal) { const c = await sb(); if (c && canal) await c.removeChannel(canal); }

// Save da jornada: agendado depois de cada save() local (espera 5 s juntando vários), ou na hora ao sair da aba.
let timer = null, pendente = false;
export function agendarEnvioSave() {
  if (!usuario()) return;
  pendente = true; clearTimeout(timer);
  timer = setTimeout(() => enviarSaveAgora(), 5000);
}
// Offline ou falha de rede: o envio fica PENDENTE e sai no próximo save, ao voltar a internet ('online' →
// sincronizar, que sempre reenvia o save local) ou ao abrir o jogo de novo logado. Nada se perde: o save local
// continua sendo a fonte, a nuvem é cópia.
export async function enviarSaveAgora(forcar = false) {
  if (!forcar && !pendente) return;
  clearTimeout(timer);
  if (offline()) { pendente = true; nuvem.status = 'offline'; avisar(); return; }
  pendente = false;
  const c = await sb(), u = usuario(), S = ganchos.saveLocal();
  if (!c || !u || !S?.id) return;
  const { error } = await c.from('saves').upsert({ user_id: u.id, jornada_id: S.id, dados: S, atualizado_em: new Date().toISOString() });
  if (error) { pendente = true; console.error(error); nuvem.status = 'erro'; nuvem.erro = 'Não consegui salvar a jornada na nuvem (tento de novo sozinho): ' + error.message; avisar(); }
}
// (offline: não precisa fila — ao voltar, sincronizar() vê que a jornada do save da nuvem já terminou e apaga)
export async function apagarSaveNuvem() {
  pendente = false; clearTimeout(timer);
  const c = await sb(), u = usuario(); if (!c || !u || offline()) return;
  const { error } = await c.from('saves').delete().eq('user_id', u.id);
  if (error) console.error(error);
}
