/* ============ carreira (todas as jornadas terminadas) ============ */
// A carreira é a LISTA de jornadas terminadas (resumos com `id` único); tudo o que a tela mostra — recorde por
// espécie, Pokédex, shinies, máximos, favorito — é calculado dela por calcularCarreira(). Guardar a lista (e não
// contadores) é o que deixa juntar local + nuvem de vários aparelhos sem contar nada em dobro (mesclarJornadas).
// Puro + localStorage via `store` (que é no-op no Node) — testado em tests/carreira.test.js.
import { store } from './util.js';
import { PROGRESSO_KEY, progressoVazio, bancar, mesclarProgresso, totaisDe, runsDeNivelDe, especiesDesbloqueadas, registrarEventoVencido, saldoArenaDisponivel, gastarSaldoArena } from './progresso-conta.js';
import { desbloqueadas } from './roguelike.js';
import { entradaDoHall, registrarNoHall, listaDoHall } from './hall.js';
import { contextoBadges, badgesDaConta, vantagensDe } from './badges.js';
import { pokedexDaConta } from './pokedex-conta.js';
import { progressoConquistas, megaLiberada, zLiberado, vinculoLiberado, ALVOS } from './conquistas.js';

export const TOTAL_ESPECIES = 1025;
export const CARREIRA_KEY = 'pokerpg-carreira-v1';
const RECORDES_ANTIGO = 'pokerpg-recordes-v1'; // formato da versão anterior (só melhor por espécie + últimas 20)

// save de recordes antigo → lista de jornadas (sem id: gera um estável a partir de espécie + data)
export function migrarRecordes(rec) {
  const vistos = new Set(), jornadas = [];
  for (const j of [...(rec?.historico || []), ...Object.values(rec?.especies || {}).map(e => e.melhor)]) {
    if (!j) continue;
    const id = j.id || `antigo-${j.especie}-${j.data}`;
    if (!vistos.has(id)) { vistos.add(id); jornadas.push({ ...j, id }); }
  }
  return { jornadas };
}
/* Retroativo (bug corrigido em 27/09/2026): a cópia de `registro` na carreira (regras.estatisticasDaJornada) só
   guardava o TOTAL de shiniesAmigos, não o mapa por espécie — toda jornada terminada shiny perdia pra sempre QUAL
   espécie tinha ficado shiny, e o início-shiny (criacao.opcaoShiny) nunca liberava nada pra quem já tinha
   encerrado a run. Melhor esforço, recalculado a cada leitura (puro, não persiste): jornada que terminou shiny
   credita a espécie inicial e a final. Formas intermediárias (uma evolução no meio do caminho) não dá pra
   recuperar sem saber por qual Pokémon elas passaram — `registro.evolucoes` mistura jogador e aliados. */
export function retroativoShinyDaJornada(j) {
  if (!j?.shiny) return j;
  const especies = [j.especie, j.especieFinal].filter(Boolean);
  const shiniesAmigos = { ...(j.registro?.shiniesAmigos || {}) };
  let mudou = false;
  for (const e of especies) if (!shiniesAmigos[e]) { shiniesAmigos[e] = 1; mudou = true; }
  return mudou ? { ...j, registro: { ...(j.registro || {}), shiniesAmigos } } : j;
}
export function carregarCarreira() {
  const c = store.get(CARREIRA_KEY);
  if (c?.jornadas) return { ...c, jornadas: c.jornadas.map(retroativoShinyDaJornada) };
  const antigo = store.get(RECORDES_ANTIGO);
  return antigo ? migrarRecordes(antigo) : { jornadas: [] };
}
// versão sobe a cada gravação: quem guarda algo calculado da carreira (a Pokédex da rota, em render.js) sabe quando refazer
let versao = 0;
export const versaoCarreira = () => versao;
export const salvarCarreira = c => { versao++; store.set(CARREIRA_KEY, c); };

// adiciona sem duplicar (mesmo id = substitui)
export const adicionarJornada = (carreira, resumo) => ({ jornadas: [...(carreira?.jornadas || []).filter(j => j.id !== resumo.id), resumo] });

// Junta as jornadas deste navegador com as da nuvem de `dono`. Sobe só as que a nuvem não tem E que são de
// visitante (sem dono) ou já desse dono — jornada de outra conta que logou neste navegador não vai pra sua.
// `recusada` = o servidor já rejeitou (números impossíveis, validar_jornada no schema.sql): não tenta de novo.
export function mesclarJornadas(locais, remotas, dono) {
  const naNuvem = new Set(remotas.map(j => j.id));
  const subir = locais.filter(j => !naNuvem.has(j.id) && !j.recusada && (!j.dono || j.dono === dono)).map(j => ({ ...j, dono }));
  const porId = new Map();
  for (const j of [...locais, ...subir, ...remotas]) porId.set(j.id, j);
  const todas = [...porId.values()].sort((a, b) => String(a.data || '').localeCompare(String(b.data || '')));
  return { todas, subir };
}

// melhor jornada de uma espécie (maior pontuação); `excetoId` = não comparar a jornada consigo mesma
export function melhorDaEspecie(jornadas, especie, excetoId) {
  let melhor = null;
  for (const j of jornadas) if (j.especie === especie && j.id !== excetoId && (!melhor || j.pontuacao > melhor.pontuacao)) melhor = j;
  return melhor;
}

export function calcularCarreira(jornadas) {
  const c = { jornadas: jornadas.length, tempoTotal: 0, melhorPontuacao: 0, maxNivel: 0, maxDinheiro: 0, maxMissoes: 0,
    maxVitorias: 0, maxAlfas: 0, maxGens: 0, totalVitorias: 0, totalDerrotados: 0, totalTreinadores: 0,
    shiniesVistos: 0, shiniesAmigos: 0, jornadasShiny: 0 };
  const vistos = new Set(), amigos = new Set(), ids = {}, porEspecie = {};
  for (const j of jornadas) {
    c.tempoTotal += j.tempoMs || 0;
    c.melhorPontuacao = Math.max(c.melhorPontuacao, j.pontuacao || 0);
    c.maxNivel = Math.max(c.maxNivel, j.nivel || 0);
    c.maxDinheiro = Math.max(c.maxDinheiro, j.maxDinheiro || 0);
    c.maxMissoes = Math.max(c.maxMissoes, j.missoes || 0);
    c.maxVitorias = Math.max(c.maxVitorias, j.vitorias || 0);
    c.maxAlfas = Math.max(c.maxAlfas, j.alfas || 0);
    c.maxGens = Math.max(c.maxGens, j.gens || 0);
    c.totalVitorias += j.vitorias || 0;
    c.totalDerrotados += j.derrotados || 0;
    c.totalTreinadores += j.treinadores || 0;
    c.shiniesVistos += j.shiniesVistos || 0;
    c.shiniesAmigos += j.shiniesAmigos || 0;
    if (j.shiny) c.jornadasShiny++;
    const r = j.registro || {};
    for (const k of [...Object.keys(r.vistos || {}), ...Object.keys(r.derrotados || {})]) vistos.add(k);
    for (const k of Object.keys(r.amigos || {})) amigos.add(k);
    Object.assign(ids, r.ids || {});
    const pe = (porEspecie[j.especie] ||= { jornadas: 0, melhor: null });
    pe.jornadas++;
    if (!pe.melhor || (j.pontuacao || 0) > (pe.melhor.pontuacao || 0)) pe.melhor = j;
  }
  // favorito = espécie com mais jornadas; empate vai pra de maior pontuação
  const favorito = Object.entries(porEspecie).sort((a, b) => (b[1].jornadas - a[1].jornadas) || (b[1].melhor.pontuacao - a[1].melhor.pontuacao))[0]?.[0] || null;
  return { ...c, vistos: [...vistos].sort(), amigos: [...amigos].sort(), faltam: TOTAL_ESPECIES - amigos.size, ids, porEspecie, favorito };
}

/* ---- progresso permanente (progresso-conta.js) ----
   A carreira é histórico: dá pra apagar uma jornada dela. O progresso é CONQUISTA: nunca encolhe. Por isso os
   desbloqueios e os contadores das gimmicks passam por aqui, e não são mais lidos direto das jornadas.
   `atualizarProgresso()` é idempotente (banca por ID de jornada), então pode ser chamada sempre que a carreira
   muda: ao terminar uma jornada, ao sincronizar com a nuvem e ao abrir uma tela que mostra progresso. */
let versaoProg = 0;
export const versaoProgresso = () => versaoProg;
export const carregarProgresso = () => store.get(PROGRESSO_KEY) || progressoVazio();
export const salvarProgresso = p => { versaoProg++; store.set(PROGRESSO_KEY, p); return p; };

export function atualizarProgresso(jornadas = carregarCarreira().jornadas) {
  const antes = carregarProgresso();
  const depois = bancar(antes, jornadas, desbloqueadas(jornadas));
  return salvarProgresso(depois);
}
// o que vale de verdade: o que está gravado + o que a regra de hoje reconhece no histórico que ainda existe
export const desbloqueadasDaConta = (jornadas = carregarCarreira().jornadas) =>
  especiesDesbloqueadas(atualizarProgresso(jornadas), desbloqueadas(jornadas));
// abates somados: os das jornadas já bancadas + os da run em andamento (que ainda não é jornada)
export const abatesDaConta = (registroAtual = null, jornadas = carregarCarreira().jornadas) =>
  totaisDe(atualizarProgresso(jornadas), registroAtual?.abates);
// saldo da Arena (loja de preparo, arena.js): 10% do dinheiro final de cada jornada terminada, pra sempre
export const saldoArenaDaConta = (jornadas = carregarCarreira().jornadas) => saldoArenaDisponivel(atualizarProgresso(jornadas));
// gasta na hora (devolve true se deu certo) — usado pela loja de preparo ao comprar
export function gastarSaldoArenaDaConta(valor) {
  const antes = carregarProgresso();
  if (saldoArenaDisponivel(antes) < valor) return false;
  salvarProgresso(gastarSaldoArena(antes, valor));
  return true;
}
// o Pokémon principal de uma jornada que TERMINOU entra no Hall da Fama (hall.js) — é o que a Arena do Chefe usa
export function registrarNoHallDaConta(S, resumo) {
  const entrada = entradaDoHall(S, resumo);
  if (entrada) salvarProgresso(registrarNoHall(carregarProgresso(), entrada));
  return !!entrada;
}
export const hallDaConta = () => listaDoHall(carregarProgresso());
// derrotou o chefe do evento semanal: grava no progresso permanente (espécie desbloqueada + badge). Ver progresso-conta.registrarEventoVencido
export function registrarVitoriaDeEvento(ev, semanaId) {
  const r = registrarEventoVencido(carregarProgresso(), ev, semanaId);
  salvarProgresso(r.progresso);
  return { primeiraVez: r.primeiraVez, semanaNova: r.semanaNova };
}
// fusão com a nuvem: nunca perde o que um dos lados tem
export const mesclarProgressoLocal = remoto => salvarProgresso(mesclarProgresso(carregarProgresso(), remoto));
/* O progresso das gimmicks somado da conta, a partir do progresso PERMANENTE (não do histórico: apagar jornada não tira
   gimmick conquistada). Pura — `conquistasDaConta` e `badgesDaCarreira` passam por aqui, e tests/conquistas.test.js
   trava o resultado. `runs` = jornadas com nível 50 por espécie (a missão do Gigantamax). Já foi bug real: `conquistasDaConta`
   passava `runs: {}` fixo, então a lista do Gigantamax saía sempre vazia e `podeGigantamax` dava `false` pra qualquer
   espécie — o botão 🔴 nunca aparecia numa batalha de verdade (só a tela de Conquistas lia os runs certos). */
export const conquistasDoProgresso = (jornadas, registroAtual, progresso) =>
  progressoConquistas(jornadas, registroAtual,
    { abates: totaisDe(progresso, registroAtual?.abates), runs: runsDeNivelDe(progresso, ALVOS.gmaxNivel) });
// porta única pra batalha e render perguntarem sem remontar o contexto
export function conquistasDaConta(registroAtual = null) {
  const jornadas = carregarCarreira().jornadas;
  return conquistasDoProgresso(jornadas, registroAtual, atualizarProgresso(jornadas));
}
// esta espécie já conquistou a Mega?
export const megaDaContaLiberada = (especie, registroAtual = null) => megaLiberada(conquistasDaConta(registroAtual), especie);
// e o Vínculo de Batalha (Ash-Greninja)?
export const vinculoDaContaLiberado = (especie, registroAtual = null) => vinculoLiberado(conquistasDaConta(registroAtual), especie);

/* O que a LOJA precisa saber pra decidir se mostra a Pedra Mega, o Cristal Z e o Vínculo de Batalha, numa consulta só.
   Existe porque a tela perguntava duas vezes — e cada pergunta recalcula a carreira inteira e ainda GRAVA o
   progresso. Duas vezes por render de loja é desperdício puro, e dobrava a chance de um erro ali derrubar uma
   tela que não tem nada a ver com gimmick.
   Bug relatado (27/09/2026): render.js envolvia a chamada inteira num try/catch só — uma exceção em QUALQUER
   uma das três (ex.: um golpe malformado quebrando o `golpes.some` do Z) apagava as TRÊS da loja em silêncio
   (só um console.warn), mesmo com a Mega genuinamente conquistada. `p` (a carreira/progresso) é uma consulta só
   de propósito e uma falha nela derruba as três mesmo — mas dali pra frente cada gimmick tem o próprio try/catch,
   pra um problema isolado numa não apagar as outras duas.
   SEGUNDA CAMADA (mesmo dia, mesmo relato — a primeira correção não bastou): `conquistasDaConta` passa pelo
   progresso PERSISTENTE (`atualizarProgresso`/`bancar`, progresso-conta.js) antes de chegar em `p` — se ALGO
   nesse caminho falhar no navegador de alguém (localStorage com um dado antigo/quebrado, por exemplo), a exceção
   acontece ANTES de qualquer `seguro()`, e as três gimmicks caem juntas de novo, sem log nenhum específico. Por
   isso `p` agora tem o PRÓPRIO fallback: se o progresso persistente falhar, recalcula direto das jornadas da
   carreira (sem o "nunca encolhe" da conta permanente, mas correto pra quem tem as jornadas certas salvas) —
   melhor mostrar a Mega de verdade sem o acúmulo entre jornadas apagadas do que não mostrar nada. */
export function gimmicksNaLoja(especie, golpes = [], registroAtual = null) {
  const jornadas = carregarCarreira().jornadas;
  let p;
  try { p = conquistasDoProgresso(jornadas, registroAtual, atualizarProgresso(jornadas)); }
  catch (e) {
    console.error('gimmicksNaLoja: progresso permanente da conta falhou, caindo pro cálculo direto das jornadas', e);
    p = progressoConquistas(jornadas, registroAtual);
  }
  const seguro = fn => { try { return fn(); } catch (e) { console.error('gimmicksNaLoja', e); return false; } };
  return {
    mega: seguro(() => megaLiberada(p, especie)),
    z: seguro(() => golpes.some(g => g && g.cls !== 'status' && zLiberado(p, g))),
    vinculo: seguro(() => vinculoLiberado(p, especie))
  };
}
/* ---- badges (badges.js) ----
   Montadas do progresso permanente + Pokédex da conta + progresso das gimmicks. Ficam aqui pra tela e a criação
   pedirem por uma porta só, sem cada uma remontar o contexto. */
export function badgesDaCarreira(registroAtual = null) {
  const jornadas = carregarCarreira().jornadas;
  const progresso = atualizarProgresso(jornadas);
  const ctx = contextoBadges({
    abates: totaisDe(progresso, registroAtual?.abates),
    progresso,
    dex: pokedexDaConta(jornadas, registroAtual),
    conquistas: conquistasDoProgresso(jornadas, registroAtual, progresso)
  });
  return badgesDaConta(ctx);
}
// o que a próxima jornada ganha das badges já conquistadas
export const vantagensDaConta = () => vantagensDe(badgesDaCarreira());