// GERADOR de dados-ref/ — a Pokédex inteira em TSV, pra CONSULTA de desenvolvimento (não entra no jogo; o jogo
// continua lendo da PokéAPI ao vivo via js/api.js). Existe pra responder "qual o poder/alvo/ailment do golpe X",
// "quais os stats base da forma Y", "o que o item Z faz" sem rede e sem gastar token: uma linha por registro,
// `grep` acha, e lê-se só o que interessa.
//
// A fonte são os CSVs que GERAM a PokéAPI (github.com/PokeAPI/pokeapi/data/v2/csv), não a API REST:
// ~25 fetches em vez de ~5.800, e tem o que a REST não expõe (as 21 flags de golpe). Mesmo caminho de
// gerar-golpe-flags.mjs. Tenta o jsdelivr primeiro (o raw.githubusercontent é bloqueado em muitas redes —
// ver a armadilha das imagens na CLAUDE.md).
//
// Rodar:  node ferramentas/gerar-dex.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const ESPELHOS = [
  'https://cdn.jsdelivr.net/gh/PokeAPI/pokeapi@master/data/v2/csv',
  'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv'
];
const EN = '9';                                 // local_language_id do inglês nas tabelas *_prose
const SAIDA = new URL('../dados-ref/', import.meta.url);

/* ---- fetch ---- */
async function texto(nome) {
  let ultimo;
  for (const base of ESPELHOS) for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(`${base}/${nome}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) { ultimo = e; await new Promise(s => setTimeout(s, 400 * i)); }
  }
  throw new Error(`${nome}: ${ultimo?.message}`);
}

/* CSV de verdade: as tabelas *_prose têm vírgula E aspas dentro do campo (o gerador de flags podia usar
   `split(',')` porque as três tabelas dele não têm; aqui não dá). */
function campos(txt) {
  const linhas = []; let linha = [], c = '', aspas = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (aspas) {
      if (ch !== '"') c += ch;
      else if (txt[i + 1] === '"') { c += '"'; i++; }
      else aspas = false;
    } else if (ch === '"') aspas = true;
    else if (ch === ',') { linha.push(c); c = ''; }
    else if (ch === '\n') { linha.push(c); linhas.push(linha); linha = []; c = ''; }
    else if (ch !== '\r') c += ch;
  }
  if (c || linha.length) { linha.push(c); linhas.push(linha); }
  return linhas;
}
async function tabela(nome) {
  const [cab, ...resto] = campos((await texto(nome)).trim());
  return resto.map(v => Object.fromEntries(cab.map((k, i) => [k, v[i] ?? ''])));
}

/* ---- ajudantes ---- */
const porId = (linhas, chave = 'id') => new Map(linhas.map(l => [l[chave], l]));
const nomes = linhas => new Map(linhas.map(l => [l.id, l.identifier]));
// agrupa linhas por uma coluna
function agrupar(linhas, chave) {
  const m = new Map();
  for (const l of linhas) (m.get(l[chave]) ?? m.set(l[chave], []).get(l[chave])).push(l);
  return m;
}
// TSV: tab e quebra de linha são o separador, então somem do campo; vazio vira "-" pra coluna não colapsar
const cel = v => (v === '' || v == null ? '-' : String(v).replace(/\s+/g, ' ').trim() || '-');
function escrever(arquivo, cabecalho, linhas) {
  const txt = [cabecalho.join('\t'), ...linhas.map(l => l.map(cel).join('\t'))].join('\n') + '\n';
  writeFileSync(new URL(arquivo, SAIDA), txt);
  console.log(`${arquivo}: ${linhas.length} linhas, ${(txt.length / 1024).toFixed(0)} KB`);
}
// prose em inglês: id -> short_effect (cai pro effect completo quando não há short)
function prosa(linhas, chaveId, curto = 'short_effect', longo = 'effect') {
  const m = new Map();
  for (const l of linhas) if (l.local_language_id === EN) m.set(l[chaveId], l[curto] || l[longo] || '');
  return m;
}

/* ---- o gerador ---- */
mkdirSync(SAIDA, { recursive: true });
console.log('baixando os CSVs-fonte da PokéAPI…');

const [
  tipos, stats, naturezas, curvas, gruposOvo, alvos, ailments, classes, catGolpe, catItem, bolsos, gatilhos,
  eficacia, pokemon, pkStats, pkTipos, pkHab, pkOvo, formas, especies, golpes, golpeMeta, golpeStats,
  flagsLista, flagsMapa, golpeProsa, habilidades, habProsa, itens, itemProsa, evolucoes
] = await Promise.all([
  'types.csv', 'stats.csv', 'natures.csv', 'growth_rates.csv', 'egg_groups.csv', 'move_targets.csv',
  'move_meta_ailments.csv', 'move_damage_classes.csv', 'move_meta_categories.csv', 'item_categories.csv',
  'item_pockets.csv', 'evolution_triggers.csv', 'type_efficacy.csv', 'pokemon.csv', 'pokemon_stats.csv',
  'pokemon_types.csv', 'pokemon_abilities.csv', 'pokemon_egg_groups.csv', 'pokemon_forms.csv',
  'pokemon_species.csv', 'moves.csv', 'move_meta.csv', 'move_meta_stat_changes.csv', 'move_flags.csv',
  'move_flag_map.csv', 'move_effect_prose.csv', 'abilities.csv', 'ability_prose.csv', 'items.csv',
  'item_prose.csv', 'pokemon_evolution.csv'
].map(tabela));

const nTipo = nomes(tipos), nStat = nomes(stats), nCurva = nomes(curvas), nOvo = nomes(gruposOvo);
const nAlvo = nomes(alvos), nAil = nomes(ailments), nClasse = nomes(classes), nCat = nomes(catGolpe);
const nCatItem = nomes(catItem), nBolso = nomes(bolsos), nGatilho = nomes(gatilhos), nFlag = nomes(flagsLista);
const nEspecie = nomes(especies), nGolpe = nomes(golpes), nItem = nomes(itens), nHab = nomes(habilidades);
const ORDEM_STAT = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

/* ---- pokemon.tsv: uma linha por FORMA jogável (id > 10000 = forma alternativa) ---- */
{
  const s = agrupar(pkStats, 'pokemon_id'), t = agrupar(pkTipos, 'pokemon_id'), h = agrupar(pkHab, 'pokemon_id');
  const f = porId(formas, 'pokemon_id');
  const linhas = pokemon.map(p => {
    const base = Object.fromEntries((s.get(p.id) || []).map(x => [nStat.get(x.stat_id), x.base_stat]));
    const ev = (s.get(p.id) || []).filter(x => +x.effort > 0).map(x => `${nStat.get(x.stat_id)}+${x.effort}`);
    const forma = f.get(p.id) || {};
    const nome = p.identifier;
    const marca = p.is_default === '1' ? 'base'
      : forma.is_mega === '1' ? 'mega'
      : /-gmax$/.test(nome) ? 'gmax'
      : /-(alola|galar|hisui|paldea)/.test(nome) ? 'regional'
      : /-(primal|origin|therian|crowned|eternamax|ultra|dawn|dusk|zen|busted|complete|10|50)$/.test(nome) ? 'forma-batalha'
      : 'forma';
    return [
      p.id, nome, nEspecie.get(p.species_id), marca,
      (t.get(p.id) || []).sort((a, b) => a.slot - b.slot).map(x => nTipo.get(x.type_id)).join('/'),
      ...ORDEM_STAT.map(k => base[k]),
      ORDEM_STAT.reduce((n, k) => n + +(base[k] || 0), 0),
      (h.get(p.id) || []).sort((a, b) => a.slot - b.slot).map(x => nHab.get(x.ability_id) + (x.is_hidden === '1' ? '*' : '')).join(' '),
      p.height, p.weight, p.base_experience, ev.join(' ')
    ];
  });
  escrever('pokemon.tsv',
    ['id', 'nome', 'especie', 'forma', 'tipos', 'hp', 'atk', 'def', 'spa', 'spd', 'spe', 'total', 'habilidades(*=oculta)', 'altura_dm', 'peso_hg', 'baseExp', 'ev'],
    linhas);
}

/* ---- especies.tsv: o que é da ESPÉCIE, não da forma (gênero, captura, ovo, evolução) ---- */
{
  const ovo = agrupar(pkOvo, 'species_id');
  const porEspecie = agrupar(pokemon, 'species_id');
  const linhas = especies.map(e => {
    const alt = (porEspecie.get(e.id) || []).filter(p => p.is_default !== '1').map(p => p.identifier);
    const flags = [e.is_legendary === '1' && 'lendario', e.is_mythical === '1' && 'mitico',
      e.is_baby === '1' && 'bebe', e.forms_switchable === '1' && 'troca-forma',
      e.has_gender_differences === '1' && 'dimorfismo'].filter(Boolean);
    return [
      e.id, e.identifier, e.generation_id, e.gender_rate, e.capture_rate, e.base_happiness,
      nCurva.get(e.growth_rate_id), (ovo.get(e.id) || []).map(x => nOvo.get(x.egg_group_id)).join('/'),
      e.hatch_counter, flags.join(' '), nEspecie.get(e.evolves_from_species_id) || '',
      e.evolution_chain_id, alt.join(' ')
    ];
  });
  escrever('especies.tsv',
    ['id', 'nome', 'gen', 'generoTaxa(-1=sem,0=macho,8=femea)', 'captura', 'felicidade', 'curvaXP', 'gruposOvo', 'ciclosOvo', 'flags', 'evoluiDe', 'cadeia', 'formasAlternativas'],
    linhas);
}

/* ---- golpes.tsv ---- */
{
  const meta = porId(golpeMeta, 'move_id'), mudancas = agrupar(golpeStats, 'move_id');
  const flags = agrupar(flagsMapa, 'move_id'), efeito = prosa(golpeProsa, 'move_effect_id');
  const linhas = golpes.map(g => {
    const m = meta.get(g.id) || {};
    const hits = m.min_hits && m.min_hits !== m.max_hits ? `${m.min_hits}-${m.max_hits}` : (m.min_hits || '');
    const turnos = m.min_turns ? (m.min_turns === m.max_turns ? m.min_turns : `${m.min_turns}-${m.max_turns}`) : '';
    const txt = (efeito.get(g.effect_id) || '').replace(/\$effect_chance/g, g.effect_chance || '');
    return [
      g.id, g.identifier, nTipo.get(g.type_id), nClasse.get(g.damage_class_id), g.power, g.accuracy, g.pp,
      g.priority, nAlvo.get(g.target_id), g.generation_id, nCat.get(m.meta_category_id),
      nAil.get(m.meta_ailment_id) === 'none' ? '' : nAil.get(m.meta_ailment_id), m.ailment_chance === '0' ? '' : m.ailment_chance,
      m.crit_rate === '0' ? '' : m.crit_rate, m.drain === '0' ? '' : m.drain, m.healing === '0' ? '' : m.healing,
      m.flinch_chance === '0' ? '' : m.flinch_chance, m.stat_chance === '0' ? '' : m.stat_chance, hits, turnos,
      (mudancas.get(g.id) || []).map(x => `${nStat.get(x.stat_id)}${+x.change > 0 ? '+' : ''}${x.change}`).join(' '),
      (flags.get(g.id) || []).map(x => nFlag.get(x.move_flag_id)).join(' '), txt
    ];
  });
  escrever('golpes.tsv',
    ['id', 'nome', 'tipo', 'classe', 'poder', 'prec', 'pp', 'prio', 'alvo', 'gen', 'categoria', 'ailment', 'ail%', 'crit', 'drenar%', 'cura%', 'recuo%', 'stat%', 'golpes', 'turnos', 'stats', 'flags', 'efeito'],
    linhas);
}

/* ---- habilidades.tsv ---- */
{
  const efeito = prosa(habProsa, 'ability_id');
  escrever('habilidades.tsv', ['id', 'nome', 'gen', 'oficial', 'efeito'],
    habilidades.map(a => [a.id, a.identifier, a.generation_id, a.is_main_series === '1' ? 'sim' : 'nao', efeito.get(a.id) || '']));
}

/* ---- itens.tsv ---- */
{
  const efeito = prosa(itemProsa, 'item_id');
  const bolsoDaCat = new Map(catItem.map(c => [c.id, nBolso.get(c.pocket_id)]));
  escrever('itens.tsv', ['id', 'nome', 'bolso', 'categoria', 'custo', 'fling', 'efeito'],
    itens.map(i => [i.id, i.identifier, bolsoDaCat.get(i.category_id), nCatItem.get(i.category_id),
      i.cost, i.fling_power, efeito.get(i.id) || '']));
}

/* ---- evolucoes.tsv: uma linha por caminho de evolução, com TODAS as condições que a tabela traz ---- */
{
  const COND = [
    ['minimum_level', 'nivel'], ['minimum_happiness', 'felicidade'], ['minimum_beauty', 'beleza'],
    ['minimum_affection', 'afeto'], ['time_of_day', 'hora'], ['relative_physical_stats', 'atkVsDef'],
    ['needs_overworld_rain', 'chuva'], ['turn_upside_down', 'deCabecaParaBaixo']
  ];
  const de = porId(especies);
  const linhas = evolucoes.map(e => {
    const cond = COND.map(([k, rot]) => e[k] && e[k] !== '0' ? `${rot}=${e[k]}` : '').filter(Boolean);
    for (const [k, rot, mapa] of [['trigger_item_id', 'itemUsado', nItem], ['held_item_id', 'itemSegurado', nItem],
      ['known_move_id', 'sabeGolpe', nGolpe], ['known_move_type_id', 'sabeTipo', nTipo],
      ['party_species_id', 'naEquipe', nEspecie], ['party_type_id', 'tipoNaEquipe', nTipo],
      ['trade_species_id', 'trocaCom', nEspecie], ['gender_id', 'genero', new Map([['1', 'f'], ['2', 'm']])],
      ['location_id', 'local', new Map()]]) {
      if (e[k]) cond.push(`${rot}=${mapa.get(e[k]) || e[k]}`);
    }
    return [nEspecie.get(de.get(e.evolved_species_id)?.evolves_from_species_id), nEspecie.get(e.evolved_species_id),
      nGatilho.get(e.evolution_trigger_id), cond.join(' ')];
  });
  escrever('evolucoes.tsv', ['de', 'para', 'gatilho', 'condicoes'], linhas);
}

/* ---- tabelas.tsv: as listas pequenas, todas num arquivo (grep pela 1ª coluna) ---- */
{
  const l = [];
  for (const n of naturezas) l.push(['natureza', n.identifier, `+${nStat.get(n.increased_stat_id) || '-'} -${nStat.get(n.decreased_stat_id) || '-'}`]);
  for (const g of curvas) l.push(['curvaXP', g.identifier, g.formula.replace(/\s+/g, ' ')]);
  for (const g of gruposOvo) l.push(['grupoOvo', g.identifier, '']);
  for (const a of alvos) l.push(['alvo', a.identifier, '']);
  for (const a of ailments) l.push(['ailment', a.identifier, '']);
  for (const c of catGolpe) l.push(['categoriaGolpe', c.identifier, '']);
  for (const f of flagsLista) l.push(['flagGolpe', f.identifier, '']);
  for (const c of classes) l.push(['classeGolpe', c.identifier, '']);
  for (const g of gatilhos) l.push(['gatilhoEvolucao', g.identifier, '']);
  for (const c of catItem) l.push(['categoriaItem', c.identifier, nBolso.get(c.pocket_id)]);
  for (const t of tipos) {
    const contra = eficacia.filter(e => e.damage_type_id === t.id && e.damage_factor !== '100')
      .map(e => `${nTipo.get(e.target_type_id)}=${+e.damage_factor / 100}`).join(' ');
    if (+t.id < 10000) l.push(['tipo', t.identifier, contra]);
  }
  escrever('tabelas.tsv', ['tabela', 'chave', 'valor'], l);
}
console.log('pronto. Learnset NÃO entra (pokemon_moves.csv tem ~670 mil linhas) — ver dados-ref/LEIAME.md.');
