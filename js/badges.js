/* ============ badges da conta ============
   Conquistas de longo prazo que valem alguma coisa: cada uma paga uma **vantagem na próxima jornada** (decisão do
   usuário — "tem que dar bastante trabalho, mas tem que servir pra alguma coisa"). Hoje as vantagens são só itens e
   dinheiro inicial; vantagens de regra ficam pra depois que der pra medir quanto tempo cada badge leva de verdade.
   A única exceção é o prêmio do Rayquaza, que o usuário definiu como "todos os itens grátis na loja".

   Cada badge é uma linha desta tabela: `mede(ctx)` devolve `{ n, alvo }` e o resto sai daí. `ctx` é montado por
   `badgesDaConta` a partir do PROGRESSO PERMANENTE (progresso-conta.js) — nunca do histórico, que o jogador pode
   apagar. Puro: testado em tests/badges.test.js.

   **Rayquaza são DUAS badges separadas**, e isso foi pedido explicitamente pra não bugar: dá pra encontrar o shiny
   muito antes de conquistar a Mega, ou o contrário. Cada uma conta sozinha, em qualquer ordem; o prêmio grande sai
   de uma TERCEIRA que só olha se as duas estão prontas. */
import { ALVOS, MARCOS_ABATES } from './conquistas.js';
import { TYPE_PT, PLACA_DO_TIPO, ESPECIES_MISSAO } from './dados.js';
import { MAX_ALIADOS } from './regras.js';
import { MAX_ESCONDIDOS } from './esconderijo.js';
import { EVENTOS } from './evento.js';

export const ALVO_TIPO = 1000;          // derrotados de um tipo pra ganhar a vantagem daquele tipo
export const ALVO_AMIGOS = 100;         // aliados recrutados na conta inteira
export const ALVO_AMIGOS_MAX = 500;     // …e o alvo da badge que põe IV 31 em todo selvagem de rota
export const ALVO_PERDIDOS = 15;        // parceiros perdidos de vez numa MESMA run (badge "Cemitério de parceiros")
export const ALVO_OVOS = 100;           // ovos chocados na carreira → ovo de pseudo-lendário em toda jornada (ovos.js)
export const ALVO_OVOS_LENDA = 1000;    // …e de lendário ou mítico
export const RAYQUAZA = 'rayquaza';

// prato do Arceus daquele tipo (dados.PLACA_DO_TIPO): +20% de dano nesse tipo enquanto segurado. Trocou a
// versão original (pedra de evolução/petisco de afinidade por tipo, 28/09/2026) — dava vantagem fraca ou
// nenhuma pra vários tipos, e usava item de CAPTURA como prêmio de batalha (pedido do usuário pra corrigir).
const premioDoTipo = t => ({ itens: { [PLACA_DO_TIPO[t]]: 1 } });

const feito = (n, alvo) => ({ n: Math.min(n, alvo), alvo, completo: n >= alvo });

/* A tabela. `grupo` é só pra tela agrupar; `oculta` marca as que só aparecem depois de começarem (senão a tela
   viraria uma lista de spoilers do que nem foi tentado). */
export const BADGES = [
  // ---- caçada: os marcos grandes ----
  ...MARCOS_ABATES.map((alvo, i) => ({
    id: `caca${alvo}`, grupo: 'Caçada', icone: '🗡',
    nome: ['Primeiro milhar', 'Veterano de mil batalhas', 'Terror das rotas', 'Lenda viva'][i],
    desc: `Derrote ${alvo.toLocaleString('pt-BR')} Pokémon somando a carreira inteira.`,
    mede: c => feito(c.abates.total, alvo),
    recompensa: [{ itens: { potion: 3 } }, { dinheiro: 2000 }, { itens: { revive: 1 } }, { itens: { 'rare-candy': 1 }, titulo: 'Lenda viva' }][i]
  })),
  // ---- um por tipo: derrote 1.000 de um tipo e comece com a pedra dele ----
  ...Object.keys(TYPE_PT).map(t => ({
    id: `tipo-${t}`, grupo: 'Tipos', icone: '🔥', oculta: true,
    nome: `Especialista em ${TYPE_PT[t]}`,
    desc: `Derrote ${ALVO_TIPO.toLocaleString('pt-BR')} Pokémon do tipo ${TYPE_PT[t]}.`,
    mede: c => feito(c.abates.tipoAlvo[t] || 0, ALVO_TIPO),
    recompensa: premioDoTipo(t)
  })),
  // ---- coleção ----
  { id: 'dex-gen', grupo: 'Coleção', icone: '📖', nome: 'Pokédex regional', desc: 'Encontre todas as espécies de uma Gen inteira.',
    mede: c => feito(c.melhorGenCompleta, 1), recompensa: { itens: { repel: 1 } } },
  { id: 'dex-nacional', grupo: 'Coleção', icone: '🌍', nome: 'Pokédex nacional', desc: 'Encontre as 1025 espécies do jogo.',
    mede: c => feito(c.conhecidas, 1025), recompensa: { itens: { 'rare-candy': 2 }, titulo: 'Pokédex completa' } },
  { id: 'desbloq50', grupo: 'Coleção', icone: '🔓', nome: 'Elenco de sobra', desc: 'Desbloqueie 50 espécies pra jogar.',
    mede: c => feito(c.desbloqueadas, 50), recompensa: { dinheiro: 1500 } },
  // ---- laços ----
  { id: 'amigos', grupo: 'Laços', icone: '💚', nome: 'Faz amigos por onde passa', desc: `Recrute ${ALVO_AMIGOS} aliados na carreira.`,
    mede: c => feito(c.amigos, ALVO_AMIGOS), recompensa: { itens: { honey: 3 } } },
  { id: 'amigo-lendario', grupo: 'Laços', icone: '⚡', nome: 'Amizade impossível', desc: 'Recrute um lendário (só aparecem soltos no Santuário).',
    mede: c => feito(c.lendariosAmigos, 1), recompensa: { itens: { 'sitrus-berry': 1 } } },
  { id: 'shiny', grupo: 'Laços', icone: '✨', nome: 'Caçador de brilho', desc: 'Recrute um Pokémon shiny (1 em 4096).',
    mede: c => feito(c.shiniesAmigos, 1), recompensa: { itens: { 'lum-berry': 1 } } },
  /* ---- ovos (ovos.js): as duas únicas badges cuja recompensa é um OVO no começo da jornada. Pedido do usuário, com
     os alvos que ele definiu. São de propósito as mais longas do jogo junto com o milhão de dano: cada ovo custa de
     100 a 400 explorações, e chocam 3 por vez. ---- */
  { id: 'ovos100', grupo: 'Laços', icone: '🥚', nome: 'Criadouro', desc: `Choque ${ALVO_OVOS} ovos somando a carreira inteira. Depois disso, toda jornada começa com o ovo de um pseudo-lendário sorteado.`,
    mede: c => feito(c.ovosChocados, ALVO_OVOS), recompensa: { ovo: 'pseudo' } },
  { id: 'ovos1000', grupo: 'Laços', icone: '🐣', nome: 'Guardião do ninho', desc: `Choque ${ALVO_OVOS_LENDA.toLocaleString('pt-BR')} ovos somando a carreira inteira. Depois disso, toda jornada começa também com o ovo de um lendário ou mítico sorteado.`,
    mede: c => feito(c.ovosChocados, ALVO_OVOS_LENDA), recompensa: { ovo: 'lendario', titulo: 'Guardião do ninho' } },
  /* ---- parceiros: as três medem UMA jornada (não a soma da conta) e ignoram o modo Fácil, onde nada disso custa caro.
     As duas de vitória exigem VENCER (fechar uma Gen), pelo mesmo motivo da 'sem-centro': sair de uma run recém-criada
     também "terminaria" sem recrutar ninguém. ---- */
  { id: 'casa-cheia', grupo: 'Parceiros', icone: '📦', nome: 'Casa cheia',
    desc: `Feche uma Gen com a equipe (${MAX_ALIADOS}) e o esconderijo (${MAX_ESCONDIDOS}) lotados de parceiros ao mesmo tempo. Fora do modo Fácil.`,
    mede: c => feito(c.runsCasaCheia, 1), recompensa: { dinheiro: 5000, itens: { 'rare-candy': 2 }, titulo: 'Rei da matilha' } },
  { id: 'lobo-solitario', grupo: 'Parceiros', icone: '🐺', nome: 'Lobo solitário',
    desc: 'Feche uma Gen sem recrutar nenhum parceiro, só você. Fora do modo Fácil.',
    mede: c => feito(c.runsSemParceiro, 1), recompensa: { itens: { 'rare-candy': 1, 'lum-berry': 1 }, titulo: 'Lobo solitário' } },
  { id: 'cemiterio', grupo: 'Parceiros', icone: '🪦', nome: 'Cemitério de parceiros',
    desc: `Perca ${ALVO_PERDIDOS} parceiros em batalha numa mesma run (só conta quem cai de vez, como no Roguelike). Fora do modo Fácil.`,
    mede: c => feito(c.maxParceirosPerdidos, ALVO_PERDIDOS), recompensa: { itens: { revive: 1, 'heart-scale': 1 } } },
  // ---- eventos semanais (evento.js): uma badge por chefe, com título. Só se ganha vencendo o chefe no Roguelike/Hardcore ----
  ...EVENTOS.map(e => ({
    id: `evento-${e.id}`, grupo: 'Eventos', icone: e.badge.icone, nome: e.badge.nome, evento: e.id,
    desc: `Derrote ${e.nome}, o chefe do evento semanal da Gen ${e.gen} (só no Roguelike ou no Hardcore). Título: “${e.badge.titulo}”.`,
    mede: c => feito(c.eventos?.[e.id] ? 1 : 0, 1),
    recompensa: { ...e.badge.vantagem, titulo: e.badge.titulo }
  })),
  // ---- coragem ----
  { id: 'hardcore', grupo: 'Coragem', icone: '💀', nome: 'Sem rede de proteção', desc: 'Feche uma Gen no modo Hardcore.',
    mede: c => feito(c.gensHardcore, 1), recompensa: { itens: { 'heart-scale': 1 } } },
  { id: 'roguelike9', grupo: 'Coragem', icone: '🗺', nome: 'A volta ao mundo', desc: 'Feche as 9 Gens no Roguelike.',
    mede: c => feito(c.gensRoguelike, 9), recompensa: { dinheiro: 5000, titulo: 'Mestre das nove regiões' } },
  /* VENCER, não "terminar": entrar numa jornada e sair dela na hora seguinte também era "terminar sem usar o
     Centro", e a conquista caía no colo sem nenhum mérito. Como as badges são CALCULADAS a cada vez (nada fica
     gravado como "conquistado"), apertar a regra aqui também tira a medalha de quem já a tinha pego assim. */
  { id: 'sem-centro', grupo: 'Coragem', icone: '🚑', nome: 'Nunca precisei de médico', desc: 'Feche uma Gen sem usar o Centro Pokémon nenhuma vez.',
    mede: c => feito(c.runsSemCentro, 1), recompensa: { itens: { 'sitrus-berry': 1 } } },
  // ---- gimmicks ----
  { id: 'teras', grupo: 'Gimmicks', icone: '💎', nome: 'Todas as formas', desc: 'Libere a Terastalização dos 18 tipos.',
    mede: c => feito(c.terasLiberadas, 18), recompensa: { dinheiro: 3000 } },
  { id: 'megas5', grupo: 'Gimmicks', icone: '⚡', nome: 'Colecionador de pedras', desc: 'Conquiste 5 Pedras Mega.',
    mede: c => feito(c.megasLiberadas, 5), recompensa: { dinheiro: 3000 } },
  /* Rayquaza: duas missões independentes + a que junta as duas. Separadas de propósito — dá pra ter o shiny muito
     antes da Mega, ou o contrário, e uma não pode zerar a outra. */
  { id: 'rayquaza-shiny', grupo: 'Rayquaza', icone: '✨', nome: 'O dragão que brilha', desc: 'Recrute um Rayquaza shiny.',
    mede: c => feito(c.rayquazaShiny, 1), recompensa: { itens: { 'sitrus-berry': 2 } } },
  { id: 'rayquaza-mega', grupo: 'Rayquaza', icone: '🐉', nome: 'Ascensão do dragão', desc: `Conquiste a Mega do Rayquaza (${ALVOS.mega.toLocaleString('pt-BR')} golpes finais sendo ele).`,
    mede: c => feito(c.rayquazaAbates, ALVOS.mega), recompensa: { dinheiro: 5000 } },
  /* ---- maestria: a única badge que muda uma REGRA do jogo pra você (o resto são itens, dinheiro e a loja grátis
     do Rayquaza). 1 milhão de dano somando a carreira é de propósito a mais longa de todas: dá pra chegar lá, mas
     só depois de muitas jornadas. Dano do aliado não conta, veneno e armadilha não contam — é o que VOCÊ bate
     (conquistas.registrarDano). Entra pelo caminho normal das vantagens, então `jogar sem vantagens` desliga ela
     também: senão o bônus de pontuação do ranking sairia de graça com IVs perfeitos. ---- */
  { id: 'ivs-perfeitos', grupo: 'Maestria', icone: '🧬', nome: 'Potencial máximo',
    desc: `Cause ${ALVOS.dano.toLocaleString('pt-BR')} de dano com os seus golpes, somando a carreira inteira. Depois disso, todo Pokémon que você começar a jogar nasce com os 6 IVs em 31.`,
    mede: c => feito(c.danoCausado, ALVOS.dano), recompensa: { ivsPerfeitos: true, titulo: 'Potencial máximo' } },
  /* A irmã da de cima, do outro lado do campo: os IVs 31 passam a valer pro SELVAGEM da rota. Mede amizade de
     propósito — é a vantagem de verdade dela. Selvagem é de onde sai todo aliado (petisco) e, por eles, todo ovo:
     recrutar 500 ao longo da carreira faz com que cada um que você recrute depois já nasça perfeito. O preço está
     na descrição porque é real e o jogador precisa saber antes: quem te enfrenta também nasce perfeito. Alfa,
     lendário e chefe já eram 31 — pra eles nada muda. Vale só pro selvagem, não pra equipe de treinador: aquele
     Pokémon é do treinador, não da rota. */
  { id: 'ivs-selvagens', grupo: 'Maestria', icone: '🌿', nome: 'Rotas em potencial máximo',
    desc: `Recrute ${ALVO_AMIGOS_MAX} aliados somando a carreira inteira. Depois disso, todo Pokémon selvagem das rotas nasce com os 6 IVs em 31 — os que você recrutar vêm perfeitos, e os que te enfrentarem também.`,
    mede: c => feito(c.amigos, ALVO_AMIGOS_MAX), recompensa: { ivsSelvagens: true, titulo: 'Rotas em potencial máximo' } },
  { id: 'rayquaza-lenda', grupo: 'Rayquaza', icone: '🏆', nome: 'Senhor dos céus',
    desc: 'Tenha as duas conquistas do Rayquaza: o shiny e a Mega.',
    mede: c => feito((c.rayquazaShiny >= 1 ? 1 : 0) + (c.rayquazaAbates >= ALVOS.mega ? 1 : 0), 2),
    recompensa: { lojaGratis: true, titulo: 'Senhor dos céus' } }
];

/* Monta o `ctx` que as badges medem, a partir do progresso permanente + o que as telas já calculam.
   Tudo que entra aqui tem de vir de fonte que NÃO encolhe (progresso-conta), senão a badge pode ser "desconquistada". */
/* Jornada VENCIDA = fechou uma Gen. `genVencida` é o número da Gen fechada e `motivo` é como a jornada acabou
   ('venceu' | 'desmaiou' | 'capturado' | 'encerrou'): os dois são checados porque entrada antiga do livro-caixa
   pode ter só um deles. Desistir, desmaiar ou ser capturado não é vitória. */
const venceu = j => !!j.genVencida || j.motivo === 'venceu';

export function contextoBadges({ abates, progresso, dex, conquistas }) {
  const jornadas = Object.values(progresso?.porJornada || {});
  const especies = progresso?.especies || {};
  return {
    abates,
    conhecidas: dex?.conhecidas || 0,
    melhorGenCompleta: dex?.gensCompletas || 0,
    desbloqueadas: Object.keys(especies).length,
    amigos: jornadas.reduce((a, j) => a + (j.amigos || 0), 0),
    lendariosAmigos: dex?.lendariosAmigos || 0,
    shiniesAmigos: dex?.shiniesAmigos || 0,
    gensHardcore: jornadas.filter(j => j.dificuldade === 'hardcore' && j.genVencida).length,
    gensRoguelike: new Set(jornadas.filter(j => j.dificuldade === 'roguelike' && j.genVencida).map(j => j.genVencida)).size,
    // só jornada VENCIDA conta (ver a badge 'sem-centro'): sair de uma run recém-criada também é "terminar"
    eventos: progresso?.eventos || {},   // chefes semanais já vencidos (progresso-conta.registrarEventoVencido)
    runsSemCentro: jornadas.filter(j => j.semCentro && venceu(j)).length,
    // parceiros: por JORNADA (nunca a soma da conta), sem o modo Fácil. `amigos` = quantos foram recrutados na run.
    runsCasaCheia: jornadas.filter(j => j.casaCheia && venceu(j) && j.dificuldade !== 'easy').length,
    runsSemParceiro: jornadas.filter(j => (j.amigos || 0) === 0 && venceu(j) && j.dificuldade !== 'easy').length,
    maxParceirosPerdidos: jornadas.filter(j => j.dificuldade !== 'easy').reduce((m, j) => Math.max(m, j.aliadosPerdidos || 0), 0),
    ovosChocados: jornadas.reduce((a, j) => a + (j.ovosChocados || 0), 0),   // soma da conta, nunca encolhe

    terasLiberadas: (conquistas?.tera || []).filter(x => x.liberado).length,
    megasLiberadas: (conquistas?.mega || []).filter(x => x.liberado).length,
    rayquazaShiny: dex?.rayquazaShiny || 0,
    rayquazaAbates: abates?.especie?.[RAYQUAZA] || 0,
    danoCausado: abates?.dano || 0,   // badge 'ivs-perfeitos'
    /* o dinheiro da CARREIRA: a soma do pico (`maxDinheiro`) de cada jornada do livro-caixa. É a mesma fonte do
       saldo da Arena (progresso-conta.saldoArenaGanho, que tira 10% disto), então é união por chave de jornada —
       nunca conta a mesma duas vezes e nunca encolhe. Mede o 🪙 Gholdengo (dados.ESPECIES_MISSAO). */
    dinheiroCarreira: jornadas.reduce((a, j) => a + (j.maxDinheiro || 0), 0)
  };
}

/* ---- medida por DADO: o que o 🧰 Editor de conteúdo consegue criar ----
   As badges deste arquivo medem com `mede(ctx)`, uma função — e função não cabe num pacote da nuvem. Badge NOVA
   publicada traz `medida: { campo, alvo, especie? }`, e `campo` é um caminho dentro do MESMO `ctx` que as de
   fábrica leem. Então a lista de possibilidades é exatamente esta tabela: o editor monta o seletor dela, e
   `conteudo.validarBadges` recusa campo que não esteja aqui (campo errado = badge impossível em silêncio, o pior
   defeito possível numa conquista de carreira).

   O que NÃO virou medida de dado, e não é esquecimento: regra composta (as duas do Rayquaza juntas), "feche uma
   Gen fazendo X" que precisa de um campo novo no livro-caixa da jornada, e qualquer coisa que o `ctx` não conte.
   Medida nova = um campo no `contextoBadges` + uma linha aqui. */
export const MEDIDAS = {
  'abates.total': { rotulo: 'Pokémon derrotados (carreira inteira)', exemplo: 5000 },
  'abates.especie': { rotulo: 'Derrotados de uma espécie', especie: true, exemplo: 500 },
  ...Object.fromEntries(Object.keys(TYPE_PT).map(t => [`abates.tipoAlvo.${t}`, { rotulo: `Derrotados do tipo ${TYPE_PT[t]}`, exemplo: ALVO_TIPO }])),
  danoCausado: { rotulo: 'Dano causado com os seus golpes', exemplo: 1000000 },
  conhecidas: { rotulo: 'Espécies vistas na Pokédex da conta', exemplo: 500 },
  melhorGenCompleta: { rotulo: 'Gens com a Pokédex completa', exemplo: 1 },
  desbloqueadas: { rotulo: 'Espécies desbloqueadas pra jogar', exemplo: 50 },
  amigos: { rotulo: 'Aliados recrutados (carreira)', exemplo: ALVO_AMIGOS },
  lendariosAmigos: { rotulo: 'Lendários recrutados', exemplo: 1 },
  shiniesAmigos: { rotulo: 'Shinies recrutados', exemplo: 1 },
  ovosChocados: { rotulo: 'Ovos chocados (carreira)', exemplo: ALVO_OVOS },
  gensHardcore: { rotulo: 'Gens fechadas no Hardcore', exemplo: 1 },
  gensRoguelike: { rotulo: 'Gens diferentes fechadas no Roguelike', exemplo: 9 },
  runsSemCentro: { rotulo: 'Jornadas vencidas sem usar o Centro', exemplo: 1 },
  runsCasaCheia: { rotulo: 'Jornadas vencidas com equipe e esconderijo lotados', exemplo: 1 },
  runsSemParceiro: { rotulo: 'Jornadas vencidas sem recrutar ninguém', exemplo: 1 },
  maxParceirosPerdidos: { rotulo: 'Parceiros perdidos numa mesma jornada', exemplo: ALVO_PERDIDOS },
  terasLiberadas: { rotulo: 'Tipos de Tera liberados', exemplo: 18 },
  megasLiberadas: { rotulo: 'Megas liberadas', exemplo: 5 },
  rayquazaShiny: { rotulo: 'Rayquaza shiny recrutado', exemplo: 1 },
  rayquazaAbates: { rotulo: 'Rayquaza derrotados', exemplo: ALVOS.mega },
  dinheiroCarreira: { rotulo: 'Dinheiro somando as jornadas (pico de cada uma)', exemplo: 1000000 }
};
// `especie: true` quer dizer que o caminho termina no nome da espécie (`abates.especie.pikachu`)
export const campoDaMedida = medida => (MEDIDAS[medida?.campo]?.especie ? `${medida.campo}.${medida.especie}` : medida?.campo) || '';
/* Caminho desconhecido vale 0 — nunca estoura. Badge que não mede nada aparece em 0/alvo na tela, e a validação do
   pacote é quem impede que ela chegue até aqui. */
export const medirPorDado = medida => c => {
  const n = campoDaMedida(medida).split('.').reduce((o, k) => (o == null ? o : o[k]), c);
  return feito(Number(n) || 0, Math.max(1, medida?.alvo || 1));
};

/* ---- 🔒 Pokémon de missão (dados.ESPECIES_MISSAO) ----
   Mesma máquina das badges: `medirPorDado` sobre o mesmo `ctx`. Fica aqui, e não num módulo novo, porque é
   exatamente isso — uma medida de progresso permanente com um alvo. A diferença é o prêmio: em vez de item na
   próxima jornada, a espécie passa a EXISTIR no mundo. Ordenado pelo mais perto de sair, igual aos desbloqueios. */
export function missoesDeEspecie(ctx) {
  return Object.entries(ESPECIES_MISSAO)
    .map(([especie, m]) => { const r = medirPorDado(m)(ctx); return { ...m, especie, ...r, fracao: Math.min(1, r.n / r.alvo) }; })
    .sort((a, b) => (b.completo - a.completo) || (b.fracao - a.fracao));
}
// os nomes que a conta já liberou. `criacao.iniciarJornada` fotografa isto em `S.liberadas`.
export const especiesLiberadasPorMissao = ctx => missoesDeEspecie(ctx).filter(m => m.completo).map(m => m.especie);

// estado de cada badge, pronto pra tela
export function badgesDaConta(ctx) {
  return BADGES.map(b => {
    const m = (b.mede || medirPorDado(b.medida))(ctx);
    return { ...b, ...m, fracao: Math.min(1, m.n / m.alvo) };
  });
}

/* O que as badges conquistadas dão na PRÓXIMA jornada. Soma itens (empilham), dinheiro (soma) e marca `lojaGratis`.
   `iniciarJornada` usa isto quando as vantagens estão ligadas. `ovos` são os TIPOS de ovo ('pseudo' | 'lendario');
   quem sorteia a espécie é a criação, que é quem conhece o mapa (ovos.ovoDeBadge). */
export function vantagensDe(lista) {
  const out = { itens: {}, dinheiro: 0, lojaGratis: false, ivsPerfeitos: false, ivsSelvagens: false, titulos: [], ovos: [] };
  for (const b of lista) {
    if (!b.completo) continue;
    const r = b.recompensa || {};
    for (const [k, n] of Object.entries(r.itens || {})) out.itens[k] = (out.itens[k] || 0) + n;
    out.dinheiro += r.dinheiro || 0;
    if (r.lojaGratis) out.lojaGratis = true;
    if (r.ivsPerfeitos) out.ivsPerfeitos = true;
    if (r.ivsSelvagens) out.ivsSelvagens = true;
    if (r.ovo) out.ovos.push(r.ovo);
    if (r.titulo) out.titulos.push(r.titulo);
  }
  return out;
}
