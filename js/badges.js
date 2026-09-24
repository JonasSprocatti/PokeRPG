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
import { TYPE_PT } from './dados.js';

export const ALVO_TIPO = 1000;          // derrotados de um tipo pra ganhar a vantagem daquele tipo
export const ALVO_AMIGOS = 100;         // aliados recrutados na conta inteira
export const RAYQUAZA = 'rayquaza';

// pedra de evolução ligada a cada tipo; tipo sem pedra ganha o petisco de afinidade (dados.ITEMS)
const PEDRA_DO_TIPO = {
  fire: 'fire-stone', water: 'water-stone', electric: 'thunder-stone', grass: 'leaf-stone',
  fairy: 'moon-stone', psychic: 'dawn-stone', ghost: 'dusk-stone', ice: 'ice-stone', rock: 'sun-stone'
};
const PETISCO_DO_TIPO = {
  normal: 'honey', fighting: 'honey', flying: 'honey', poison: 'tiny-mushroom', ground: 'hard-stone',
  bug: 'honey', steel: 'hard-stone', dragon: 'mystic-water', dark: 'tiny-mushroom'
};
const premioDoTipo = t => PEDRA_DO_TIPO[t] ? { itens: { [PEDRA_DO_TIPO[t]]: 1 } } : { itens: { [PETISCO_DO_TIPO[t] || 'honey']: 2 } };

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
    runsSemCentro: jornadas.filter(j => j.semCentro && venceu(j)).length,
    terasLiberadas: (conquistas?.tera || []).filter(x => x.liberado).length,
    megasLiberadas: (conquistas?.mega || []).filter(x => x.liberado).length,
    rayquazaShiny: dex?.rayquazaShiny || 0,
    rayquazaAbates: abates?.especie?.[RAYQUAZA] || 0
  };
}

// estado de cada badge, pronto pra tela
export function badgesDaConta(ctx) {
  return BADGES.map(b => { const m = b.mede(ctx); return { ...b, ...m, fracao: Math.min(1, m.n / m.alvo) }; });
}

/* O que as badges conquistadas dão na PRÓXIMA jornada. Soma itens (empilham), dinheiro (soma) e marca `lojaGratis`.
   `iniciarJornada` usa isto quando as vantagens estão ligadas. */
export function vantagensDe(lista) {
  const out = { itens: {}, dinheiro: 0, lojaGratis: false, titulos: [] };
  for (const b of lista) {
    if (!b.completo) continue;
    const r = b.recompensa || {};
    for (const [k, n] of Object.entries(r.itens || {})) out.itens[k] = (out.itens[k] || 0) + n;
    out.dinheiro += r.dinheiro || 0;
    if (r.lojaGratis) out.lojaGratis = true;
    if (r.titulo) out.titulos.push(r.titulo);
  }
  return out;
}
