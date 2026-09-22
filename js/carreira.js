/* ============ carreira (todas as jornadas terminadas) ============ */
// A carreira é a LISTA de jornadas terminadas (resumos com `id` único); tudo o que a tela mostra — recorde por
// espécie, Pokédex, shinies, máximos, favorito — é calculado dela por calcularCarreira(). Guardar a lista (e não
// contadores) é o que deixa juntar local + nuvem de vários aparelhos sem contar nada em dobro (mesclarJornadas).
// Puro + localStorage via `store` (que é no-op no Node) — testado em tests/carreira.test.js.
import { store } from './util.js';

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
export function carregarCarreira() {
  const c = store.get(CARREIRA_KEY);
  if (c?.jornadas) return c;
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
