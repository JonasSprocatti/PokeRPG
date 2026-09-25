/* ============ dados do perfil de um amigo (puro) ============
   As contas que a tela do perfil (perfil-amigo.js) faz com o que veio do banco (`perfil_do_amigo`). Sem DOM: tests/perfil-amigo.test.js. */
import { BADGES } from './badges.js';
import { fmt } from './util.js';

export const n = v => (Number(v) || 0).toLocaleString('pt-BR');

// os números do quadro de estatísticas: [rótulo, valor já formatado]
export function numerosDoPerfil(p) {
  const s = p?.stats || {};
  return [
    ['Jornadas terminadas', n(s.jornadas)], ['Vitórias (Gens fechadas)', `${n(s.vitorias)}${s.gens_fechadas ? ` (${n(s.gens_fechadas)} Gens)` : ''}`],
    ['Melhor pontuação', n(s.melhor_pontuacao)], ['Maior nível', n(s.maior_nivel)], ['Pokémon derrotados', n(s.derrotados)],
    ['Shinies', n(s.shinies)], ['Espécies desbloqueadas', n(p?.especies_desbloqueadas)],
    ['Mais jogado', s.especie_favorita ? fmt(s.especie_favorita) : '—']
  ];
}

// as insígnias de chefe semanal: todas, marcando as que a pessoa tem (`eventos` = ids dos chefes vencidos)
export function insigniasDoPerfil(eventos = []) {
  const tem = new Set(eventos || []);
  return BADGES.filter(b => b.grupo === 'Eventos').map(b => ({ id: b.id, icone: b.icone, nome: b.nome, titulo: b.recompensa?.titulo || b.nome, ganha: tem.has(b.evento) }));
}

// resultado de uma run em uma frase curta
export function rotuloDaRun(r) {
  if (r?.gen_vencida && r.gen_vencida !== '0') return `🏆 fechou a Gen ${r.gen_vencida}`;
  return { venceu: '🏆 venceu', desmaiou: 'desmaiou', capturado: 'foi capturado', encerrou: 'encerrou' }[r?.motivo] || 'terminou';
}

// "set/2026"
export function desdeQuando(criadoEm) {
  if (!criadoEm) return '';                                       // new Date(null) seria 1970
  const d = new Date(criadoEm); if (Number.isNaN(d.getTime())) return '';
  return `${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][d.getUTCMonth()]}/${d.getUTCFullYear()}`;
}
