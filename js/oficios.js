/* ⚔ Modo Saga — os seis OFÍCIOS, lidos da espécie (puro, sem imports, sem DOM).

   O ofício não é escolhido pelo jogador nem escrito à mão numa tabela de 1025 linhas: sai dos stats base
   (que já vêm da PokéAPI) + do que a espécie pode aprender. Assim forma nova e Pokémon de Gen futura entram
   com ofício no dia em que a API os publica. O desenho e o porquê estão em `docs/plano-saga.md`.

   Por que FRAÇÃO do total (f = stat / BST) e não o stat absoluto: o ofício é a função do bicho DENTRO da luta,
   não o quanto ele é forte. Aggron tem Def 180 e Shuckle 230 — os dois são Guardião. Charizard tem SpA 109,
   menos que a Def do Aggron, e é o Arcano da comitiva. Com stat absoluto, todo pseudo-lendário vence todo
   ofício ao mesmo tempo e um Alakazam de BST 500 perderia "mago" pra um Snorlax.

   Curandeiro, Encantador e Bardo não dão pra ler de stat: Blissey e Snorlax têm o mesmo perfil defensivo e só
   um dos dois sabe curar o time. Esses três leem o LEARNSET — e por lista explícita de golpes, não por classe
   de dano: a classe (status × físico × especial) só existe no dado do golpe INDIVIDUAL, que custa uma busca de
   rede por golpe; o learnset em cache tem só nome e nível (`api.buildLearnset`). Lista curta de golpes-chave é
   exata, cabe aqui e não puxa rede nenhuma. */

// cura ALIADO ou o time todo: é o que separa o Curandeiro de um Guardião gordo que só sabe se curar
export const CURA_DE_ALIADO = new Set([
  'heal-pulse', 'life-dew', 'jungle-healing', 'lunar-blessing', 'floral-healing', 'pollen-puff',
  'aromatherapy', 'heal-bell', 'wish', 'healing-wish', 'lunar-dance', 'revival-blessing', 'present'
]);
// cura só a si: vocação de cura, mas não faz ofício sozinha (Snorlax com Rest continua Guardião)
export const CURA_PROPRIA = new Set([
  'recover', 'soft-boiled', 'milk-drink', 'slack-off', 'roost', 'rest', 'morning-sun', 'moonlight',
  'synthesis', 'shore-up', 'strength-sap', 'purify'
]);
// feitiço: dorme, paralisa, confunde, derruba atributo do inimigo → Encantador
export const FEITICOS = new Set([
  'thunder-wave', 'will-o-wisp', 'toxic', 'spore', 'sleep-powder', 'hypnosis', 'lovely-kiss', 'sing',
  'grass-whistle', 'yawn', 'confuse-ray', 'swagger', 'flatter', 'teeter-dance', 'leech-seed', 'screech',
  'charm', 'growl', 'tail-whip', 'fake-tears', 'metal-sound', 'feather-dance', 'scary-face', 'string-shot',
  'cotton-spore', 'sweet-scent', 'taunt', 'torment', 'encore', 'disable', 'attract', 'mean-look', 'block',
  'spider-web', 'perish-song', 'nightmare', 'curse', 'embargo', 'heal-block', 'topsy-turvy', 'parting-shot'
]);
// canção: ergue o LADO todo (buff de time ou tela) → Bardo. Buff que só serve a quem usa não entra.
export const CANCOES = new Set([
  'helping-hand', 'tailwind', 'light-screen', 'reflect', 'safeguard', 'mist', 'aurora-veil', 'lucky-chant',
  'aromatic-mist', 'gear-up', 'magnetic-flux', 'coaching', 'decorate', 'howl', 'gravity', 'trick-room',
  'wide-guard', 'quick-guard', 'crafty-shield', 'mat-block', 'after-you', 'ally-switch', 'follow-me',
  'rage-powder', 'flower-shield', 'guard-split', 'power-split', 'speed-swap', 'heart-swap'
]);

export const OFICIOS = {
  guardiao:   { nome: 'Guardião',   emoji: '🛡', funcao: 'segura a linha',        pericias: ['brado', 'muralha'] },
  curandeiro: { nome: 'Curandeiro', emoji: '💚', funcao: 'cura e limpa',          pericias: ['balsamo', 'purificar'] },
  arcano:     { nome: 'Arcano',     emoji: '🔮', funcao: 'fogo de longe',         pericias: ['selo'] },
  guerreiro:  { nome: 'Guerreiro',  emoji: '⚔', funcao: 'abate',                 pericias: ['estocada'] },
  encantador: { nome: 'Encantador', emoji: '🕯', funcao: 'enfeitiça e amaldiçoa', pericias: ['marca'] },
  bardo:      { nome: 'Bardo',      emoji: '🎻', funcao: 'ergue a comitiva',      pericias: ['cancao'] }
};

// Tudo o que a espécie PODE aprender (por nível + MT/tutor/herança). `learnset` é o de `api.buildLearnset`.
export function golpesDaEspecie(learnset) {
  const nomes = new Set();
  for (const g of learnset?.list || []) nomes.add(g.name);
  for (const g of learnset?.extras || []) nomes.add(g.name);
  return nomes;
}

const quantos = (golpes, tabela) => { let n = 0; for (const g of golpes) if (tabela.has(g)) n++; return n; };

/* Notas de cada ofício. Comparáveis entre si porque todas caem na mesma faixa (~0.15 a ~0.47): as de stat somam
   frações do BST com coeficientes que fecham em ~1.3, e as de learnset partem de um piso com teto declarado.
   ponytail: os números são calibrados nos casos que o usuário citou (Aggron tanque, Miltank curandeiro/tanque,
   Charizard mago) e nos extremos (Blissey, Shuckle, Alakazam, Scizor) — ver tests/oficios.test.js. Afinar é
   mexer num coeficiente, nunca na forma. */
export function notasDeOficio(base, learnset) {
  const bst = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
    .reduce((t, k) => t + (base?.[k] || 0), 0);
  if (!bst) return null;   // espécie sem stats (dado incompleto): sem ofício, quem chama decide o que fazer
  const f = k => (base[k] || 0) / bst;
  const golpes = golpesDaEspecie(learnset);
  const cura = quantos(golpes, CURA_DE_ALIADO), feitico = quantos(golpes, FEITICOS), cancao = quantos(golpes, CANCOES);

  return {
    guardiao:  (f('defense') + f('special-defense')) / 2 + f('hp') * 0.3,
    guerreiro: f('attack') + f('speed') * 0.3,
    arcano:    f('special-attack') + f('speed') * 0.3,
    /* Curandeiro precisa SABER curar aliado — sem isso não concorre (é o que faz Snorlax e Shuckle ficarem
       Guardião). O bônus é pequeno de propósito: com +0.08 o Miltank passa o próprio Guardião por pouco
       (0.254 × 0.237) e vira "Curandeiro-Guardião", que é exatamente o healer/tanque pedido; maior que isso
       e todo bicho gordo que aprende Heal Bell deixa de ser Guardião. */
    curandeiro: cura ? f('hp') * 0.6 + f('special-defense') * 0.4 + 0.08 + (quantos(golpes, CURA_PROPRIA) ? 0.03 : 0)
                     : -Infinity,
    // learnset: piso + degrau por golpe, com teto. Sem nenhum golpe da lista o ofício não concorre.
    encantador: feitico ? 0.18 + 0.012 * Math.min(feitico, 10) : -Infinity,
    bardo:      cancao  ? 0.18 + 0.015 * Math.min(cancao, 8)   : -Infinity
  };
}

/* O ofício de uma espécie: o maior, o segundo (ofício MENOR) e o rótulo pronto pra tela.
   Empate resolve pela ordem de OFICIOS — determinístico, senão o mesmo Pokémon trocaria de ofício entre
   dois saves. `data` é o `m.data` do jogo (precisa de `base` e `learnset`). */
export function oficioDe(data) {
  const notas = notasDeOficio(data?.base, data?.learnset);
  if (!notas) return null;
  const ordem = Object.keys(OFICIOS).filter(k => notas[k] > -Infinity)
    .sort((a, b) => notas[b] - notas[a] || Object.keys(OFICIOS).indexOf(a) - Object.keys(OFICIOS).indexOf(b));
  const maior = ordem[0], menor = ordem[1] || null;
  return {
    maior, menor, notas,
    nome: OFICIOS[maior].nome + (menor ? `-${OFICIOS[menor].nome}` : ''),
    emoji: OFICIOS[maior].emoji,
    pericias: OFICIOS[maior].pericias
  };
}
