/* ============ evoluções especiais (condições) ============ */
// Decide se um Pokémon pode evoluir e pra quê, lendo as condições da PokéAPI (árvore de api.js slimEvo) e as
// regras equivalentes de EVO_ALTERNATIVAS (evoluções que dependem de algo que o jogo não tem).
// Gatilhos (ctx.gatilho):
//   'level-up'    ao subir de nível (nível, amizade, hora do dia, golpe conhecido, aliado de tal espécie/tipo,
//                 item na mochila — Razor Claw & cia. —, contadores como passos e recuo)
//   'use-item'    usar um item de evolução (pedras, maçãs…) — ctx.item
//   'trade'       usar o Cabo de Conexão (troca): às vezes pede um item (Metal Coat…) ou um aliado da espécie parceira
//   'pos-batalha' ao fim de uma vitória (Sirfetch'd: 3 críticos na batalha; Runerigus: aguentou 49 de dano)
// Gênero é ignorado (os Pokémon do jogo não têm gênero ainda). Puro: testado em tests/evolucao.test.js.

// Amizade com o treinador (aqui: vínculo com a jornada). 0–255; começa em 70; aliado recrutado começa em 120.
export const FELICIDADE_INICIAL = 70, FELICIDADE_ALIADO = 120, FELICIDADE_MAX = 255, FELICIDADE_EVOLUCAO = 160;
export const felicidadeDe = M => M.felicidade ?? FELICIDADE_INICIAL;
// como nos jogos: sobe mais rápido no começo
export const ganhoFelicidadeNivel = f => f < 100 ? 5 : f < 200 ? 3 : 2;
export const ganharFelicidade = (M, n) => { M.felicidade = Math.max(0, Math.min(FELICIDADE_MAX, felicidadeDe(M) + n)); };

// período do dia pelo relógio de verdade: dia 6h–17h59, noite 18h–5h59; "dusk" (Lycanroc) = 17h–17h59
export const periodoDoDia = hora => hora >= 6 && hora < 18 ? 'day' : 'night';

// Evoluções cujo gatilho original o jogo não tem: regra equivalente (mesmo formato dos detalhes da PokéAPI, mais
// contadores próprios: criticos, dano_sofrido, recuo_total, passos, derrotados, dinheiro).
// Shedinja (surge de uma vaga na equipe quando Nincada evolui) fica pra depois.
export const EVO_ALTERNATIVAS = {
  malamar: [{ trigger: 'level-up', min_level: 30 }],                       // era: virar o console de cabeça pra baixo
  goodra: [{ trigger: 'level-up', min_level: 50 }],                        // era: nível 50 na chuva (sem clima ainda)
  crabominable: [{ trigger: 'use-item', item: 'ice-stone' }],             // era: subir de nível no Monte Lanakila
  alcremie: [{ trigger: 'use-item', item: 'strawberry-sweet' }],          // era: girar segurando um doce
  urshifu: [{ trigger: 'use-item', item: 'scroll-of-darkness' }, { trigger: 'use-item', item: 'scroll-of-waters' }], // era: as torres
  sirfetchd: [{ trigger: 'pos-batalha', criticos: 3 }],                    // 3 críticos numa batalha
  runerigus: [{ trigger: 'pos-batalha', dano_sofrido: 49 }],               // aguentar 49 de dano numa batalha sem desmaiar
  wyrdeer: [{ trigger: 'level-up', known_move: 'psyshield-bash' }],        // era: usar o golpe 20× em estilo ágil
  overqwil: [{ trigger: 'level-up', known_move: 'barb-barrage' }],         // era: usar o golpe 20× em estilo forte
  basculegion: [{ trigger: 'level-up', recuo_total: 294 }],               // sofrer 294 de dano de recuo, somando
  pawmot: [{ trigger: 'level-up', passos: 30 }],                           // era: 1000 passos com ele fora da bola
  brambleghast: [{ trigger: 'level-up', passos: 30 }],
  rabsca: [{ trigger: 'level-up', passos: 30 }],
  maushold: [{ trigger: 'level-up', min_level: 25 }],
  palafin: [{ trigger: 'level-up', min_level: 38 }],                       // era: nível 38 com outro jogador por perto
  annihilape: [{ trigger: 'level-up', known_move: 'rage-fist' }],          // era: usar Rage Fist 20×
  kingambit: [{ trigger: 'level-up', derrotados: { especie: 'bisharp', qtd: 3 } }], // era: derrotar 3 Bisharp líderes
  gholdengo: [{ trigger: 'level-up', dinheiro: 9990 }]                     // era: 999 moedas de Gimmighoul (custa ₽9.990)
};

// Esta condição dá pra cumprir no jogo? (location/chuva/de cabeça pra baixo/beleza não existem aqui).
// "Subir de nível" sem condição nenhuma também não: na PokéAPI isso é o campo magnético (Magnezone, Probopass,
// Vikavolt) com o local faltando — evoluiria em qualquer nível. Eles têm a Pedra do Trovão como outro caminho.
const CONDICOES = ['min_level', 'held_item', 'known_move', 'known_move_type', 'min_happiness', 'min_affection', 'time_of_day', 'trade_species',
  'party_species', 'party_type', 'criticos', 'dano_sofrido', 'recuo_total', 'passos', 'derrotados', 'dinheiro'];
const temCondicao = d => d.relative_physical_stats != null || CONDICOES.some(k => d[k]);
const suportado = d => ['level-up', 'use-item', 'trade', 'pos-batalha'].includes(d.trigger) && !d.location && !d.rain && !d.upside_down && !d.beauty
  && (d.trigger !== 'level-up' || temCondicao(d));

// Um caminho de evolução (detalhe) está cumprido? ctx: { gatilho, item?, hora, aliados: [M], bag, registro, dinheiro }
// Devolve null (não) ou { consome?: item da mochila gasto, custo?: dinheiro gasto }.
export function detalheCumprido(d, M, ctx) {
  if (!suportado(d) || d.trigger !== ctx.gatilho) return null;
  const out = {};
  if (d.min_level && M.level < d.min_level) return null;
  if (d.trigger === 'use-item' && d.item !== ctx.item) return null;
  if (d.held_item) { if (!(ctx.bag?.[d.held_item] > 0)) return null; out.consome = d.held_item; }
  if (d.known_move && !M.moves.some(m => m.name === d.known_move)) return null;
  if (d.known_move_type && !M.moves.some(m => m.type === d.known_move_type)) return null;
  if ((d.min_happiness || d.min_affection) && felicidadeDe(M) < (d.min_happiness || FELICIDADE_EVOLUCAO)) return null;
  if (d.time_of_day) {
    const p = periodoDoDia(ctx.hora);
    if (d.time_of_day === 'dusk' ? ctx.hora !== 17 : d.time_of_day !== p) return null;
  }
  const aliados = ctx.aliados || [];
  if (d.trade_species && !aliados.some(A => A.data.speciesName === d.trade_species)) return null;
  if (d.party_species && !aliados.some(A => A.data.speciesName === d.party_species)) return null;
  if (d.party_type && !aliados.some(A => A.data.types.includes(d.party_type))) return null;
  if (d.relative_physical_stats != null && Math.sign(M.stats.attack - M.stats.defense) !== d.relative_physical_stats) return null;
  // contadores próprios (EVO_ALTERNATIVAS)
  if (d.criticos && (M.vol?.criticos || 0) < d.criticos) return null;
  if (d.dano_sofrido && (M.hp <= 0 || (M.vol?.danoSofrido || 0) < d.dano_sofrido)) return null;
  if (d.recuo_total && (M.recuoTotal || 0) < d.recuo_total) return null;
  if (d.passos && (M.passos || 0) < d.passos) return null;
  if (d.derrotados && (ctx.registro?.derrotados?.[d.derrotados.especie] || 0) < d.derrotados.qtd) return null;
  if (d.dinheiro) { if ((ctx.dinheiro || 0) < d.dinheiro) return null; out.custo = d.dinheiro; }
  return out;
}
// caminhos de um nó: os da PokéAPI + os equivalentes
const caminhos = alvo => [...alvo.details, ...(EVO_ALTERNATIVAS[alvo.name] || [])];
// Pra quê este Pokémon (nó `node` da árvore) pode evoluir agora? [{ name, consome?, custo? }] (um por espécie)
export function evolucoesPossiveis(node, M, ctx) {
  const out = [];
  for (const alvo of node?.to || []) {
    for (const d of caminhos(alvo)) { const r = detalheCumprido(d, M, ctx); if (r) { out.push({ name: alvo.name, ...r }); break; } }
  }
  return out;
}
// Esta espécie tem algum caminho que o jogo ainda não consegue cumprir? (só pra avisar na tela)
export const semCaminho = alvo => !caminhos(alvo).some(suportado);

// Texto curto do que falta pra cada evolução (ficha): "Pedra do Fogo", "Nv. 36", "amizade alta à noite"…
export function textoCondicao(d, nomeItem = x => x) {
  const p = [];
  if (d.trigger === 'use-item') p.push(`usar ${nomeItem(d.item)}`);
  if (d.trigger === 'trade') p.push('Cabo de Conexão');
  if (d.trigger === 'pos-batalha') p.push(d.criticos ? `${d.criticos} críticos numa batalha` : `aguentar ${d.dano_sofrido} de dano numa batalha`);
  if (d.min_level) p.push(`Nv. ${d.min_level}`);
  if (d.held_item) p.push(`com ${nomeItem(d.held_item)} na mochila`);
  if (d.min_happiness || d.min_affection) p.push('vínculo alto');
  if (d.known_move) p.push(`sabendo ${d.known_move}`);
  if (d.known_move_type) p.push(`sabendo um golpe ${d.known_move_type}`);
  if (d.time_of_day) p.push(d.time_of_day === 'day' ? 'de dia' : d.time_of_day === 'night' ? 'à noite' : 'às 17h');
  if (d.trade_species || d.party_species) p.push(`com ${d.trade_species || d.party_species} na equipe`);
  if (d.party_type) p.push(`com um aliado ${d.party_type}`);
  if (d.relative_physical_stats != null) p.push(d.relative_physical_stats > 0 ? 'Ataque > Defesa' : d.relative_physical_stats < 0 ? 'Defesa > Ataque' : 'Ataque = Defesa');
  if (d.recuo_total) p.push(`${d.recuo_total} de dano de recuo no total`);
  if (d.passos) p.push(`${d.passos} explorações com ele`);
  if (d.derrotados) p.push(`derrotar ${d.derrotados.qtd} ${d.derrotados.especie}`);
  if (d.dinheiro) p.push(`₽${d.dinheiro.toLocaleString('pt-BR')}`);
  return p.join(', ') || 'subir de nível';
}
// o caminho que dá pra mostrar na ficha (o 1º que o jogo suporta)
export const caminhoMostrado = alvo => caminhos(alvo).find(suportado) || null;
// nó da espécie na árvore
export function acharNo(n, nome) { if (!n) return null; if (n.name === nome) return n; for (const c of n.to) { const f = acharNo(c, nome); if (f) return f; } return null; }
// como cada próxima forma evolui, pra ficha: [{ name, texto }]
export const comoEvolui = (arvore, especie, nomeItem) => (acharNo(arvore, especie)?.to || []).map(alvo => {
  const d = caminhoMostrado(alvo);
  return { name: alvo.name, texto: d ? textoCondicao(d, nomeItem) : 'será ajustado em atualizações futuras' };
});
