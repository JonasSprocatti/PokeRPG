/* ============ ⚔ Saga — o MUNDO (capítulos 1 a 3) ============
   Dado puro, SEM imports: mapas pra andar, NPCs com diálogo, missões, itens-chave e dons. Quem lê e decide é
   `saga-mundo.js` (regras puras, testadas); quem desenha é `saga-cena.js`; quem executa é `tela-saga.js`.
   ESTE ARQUIVO É A FÁBRICA do que o 🌍 Editor de mundo edita e publica: o editor cospe um arquivo com este
   mesmo formato. O roteiro dos 10 capítulos está em `docs/saga-historia.md`.

   O mundo é uma CAMADA sobre as rotas que já existem: cada mapa aponta pra uma rota do mapa da jornada pelo
   ÍNDICE (`rota: 0` = a 1ª rota da Gen escolhida). Encontro no mato alto é `startBattle` daquela rota, o Alfa é o
   Alfa dela — então níveis, pool, Pokédex, modo offline (`baixarGen`) e as 9 Gens valem sem nenhuma busca nova.
   Por isso a história nunca cita a espécie de um inimigo: quem é o Alfa depende da Gen. Os NPCs têm espécie fixa
   porque NPC é só uma imagem (o sprite), não um Pokémon que precisa ser baixado.

   COMO UM MAPA É ESCRITO: `grade` é uma lista de linhas do MESMO tamanho. Cada caractere é um TILE (tabela
   `TILES`) ou a chave de um OBJETO em `objs` (aí o chão embaixo é `chao`, ou o tile que o objeto diz imitar em
   `como`). Um objeto pode ser uma LISTA de variantes — vale a primeira cujo `se` for verdadeiro; nenhuma
   valendo, ali é só chão.
     { npc: id }                      bloqueia; esbarrar conversa
     { porta: [mapa, chave] }         pisar leva pro caractere `chave` do outro mapa
     { placa: 'texto' }               bloqueia; esbarrar lê
     { enfeite: true, texto? }        bloqueia; só figura (com `texto`, dá pra ler)
     { bau: id, texto, faz }          bloqueia; a primeira vez aplica `faz` (efeitos, abaixo)
     { inimigo: { id, tipo, sprite?, fala? } }   bloqueia; esbarrar luta (`bando`, `treinador`, `alfa`). Vencido, some.
     { gatilho: id, texto, faz }      não bloqueia; pisar mostra o texto
     { chegada: true }                só um ponto de chegada (o começo do jogo)
   A FIGURA de qualquer objeto: `arte` (uma peça de 32×32 do atlas) e/ou `prop` (enfeite grande, com o pé na casa).
   `tests/saga-mundo.test.js` e `saga-mundo.validarMundo` cobram: linhas do mesmo tamanho, caractere conhecido,
   porta que existe dos dois lados, tudo alcançável a pé e toda referência apontando pra algo que existe.

   CONDIÇÃO (`se`, tudo é E): flag · sem · item · semItem · rep [facção, mínimo] · repAbaixo [facção, teto] ·
   missao [id, etapa | 'nao' | 'fim'] · tipo [tipos do SEU Pokémon] · falas [npc, quantas conversas] · dom.
   EFEITO (`faz`): flag · tira · item · perde · dinheiro · bag [[item, n]] · rep {facção: ±n} ·
   missao [id, etapa | 'fim'] (só anda PRA FRENTE) · dom · cura · loja · viajar.
   TEXTO: só <b>, <i> e <br> valem; o resto aparece escrito. {eu} = o seu nome · {custo} = o preço do descanso. */

export const FACCOES = {
  forja: { nome: 'Ordem da Forja', emoji: '⚒' },
  bosque: { nome: 'Círculo do Bosque', emoji: '🌿' },
  abismo: { nome: 'Corte do Abismo', emoji: '🌑' }
};

/* TILES: a REGRA de cada caractere (`bloqueia`, `mato` = encontro, `falsa` = parece que bloqueia e não bloqueia)
   e o DESENHO (`fundo`, `arte`, `prop` — explicados em saga-arte.js). `c` é a cor de reserva, pra quando o atlas
   não carregou, e a que o editor usa na miniatura. Letra minúscula e sinal são de tile; MAIÚSCULA e número ficam
   pros objetos de cada mapa (o `T` da árvore é a exceção histórica). */
export const TILES = {
  '.': { nome: 'Grama', c: '#4d8f3f', fundo: ['grama0', 'grama1', 'grama2'] },
  ',': { nome: 'Grama clara', c: '#7fb054', arte: [{ blob: 'gramaClara' }] },
  '"': { nome: 'Mato alto (encontros)', c: '#2f6a30', arte: ['matoAlto'], mato: true },
  '=': { nome: 'Caminho de terra', c: '#b99a63', arte: [{ blob: 'terra' }] },
  '-': { nome: 'Terra batida escura', c: '#8a6a45', arte: [{ blob: 'terraEscura' }] },
  'f': { nome: 'Flores', c: '#5d9a4a', arte: [['flores', 'floresRosa', 'floresAzuis']] },
  'T': { nome: 'Árvore', c: '#27552a', prop: ['carvalho', 'carvalho2'], bloqueia: true },
  't': { nome: 'Árvore falsa (passagem secreta)', c: '#2c5f30', prop: ['carvalho', 'carvalho2'], falsa: true },
  'p': { nome: 'Pinheiro', c: '#1f4a2c', prop: ['pinheiro', 'pinheiro2'], bloqueia: true },
  '~': { nome: 'Água', c: '#2f6fb5', arte: [{ blob: 'aguaGrama' }], bloqueia: true },
  '^': { nome: 'Rocha', c: '#8f8a80', arte: ['rocha'], bloqueia: true },
  'o': { nome: 'Pedregulho', c: '#7a6450', arte: ['pedregulho'], bloqueia: true },
  'c': { nome: 'Casa (o pé é a porta)', c: '#8a4f3f', prop: 'casa', bloqueia: true },
  'h': { nome: 'Construção (ocupado)', c: '#6e5a50', bloqueia: true },
  '#': { nome: 'Breu (parede de caverna)', c: '#1a141c', fundo: 'breu', bloqueia: true },
  '_': { nome: 'Piso de pedra', c: '#8d8a84', fundo: 'breu', arte: [{ blob: 'pedra', grupo: 'piso' }] },
  ':': { nome: 'Piso rachado (encontros)', c: '#6f6a60', fundo: 'breu', arte: [{ blob: 'pedra', grupo: 'piso' }, { blob: 'terraEscura' }], mato: true },
  'r': { nome: 'Picadeiro (terra sobre pedra)', c: '#7d6a55', fundo: 'breu', arte: [{ blob: 'pedra', grupo: 'piso' }, { blob: 'terra' }] },
  'i': { nome: 'Estalagmite', c: '#5a5048', fundo: 'breu', arte: [{ blob: 'pedra', grupo: 'piso' }, ['estalagmite', 'estalagmite2']], bloqueia: true },
  'v': { nome: 'Abismo', c: '#120d14', fundo: 'breu', arte: [{ blob: 'pedra', grupo: 'piso' }, { blob: 'buraco' }], bloqueia: true },
  'l': { nome: 'Lava', c: '#d2531e', fundo: 'breu', arte: [{ blob: 'pedra', grupo: 'piso' }, { blob: 'lava' }], bloqueia: true },
  'a': { nome: 'Água de caverna', c: '#2a5f9a', fundo: 'breu', arte: [{ blob: 'pedra', grupo: 'piso' }, { blob: 'agua' }], bloqueia: true }
};

/* Tema do mapa: troca o DESENHO de alguns tiles sem mexer na regra — a mesma árvore vira pinheiro, carvalho de
   outono ou árvore sombria. É como um mapa escolhe "qual das opções" de cada coisa. Tema novo = uma linha aqui
   (e, se a figura ainda não existe, uma no gerador do atlas). */
const arvores = lista => ({ T: { prop: lista }, t: { prop: lista } });
export const TEMAS = {
  outono: { nome: 'Outono', tiles: arvores(['carvalhoOutono', 'carvalho2Outono']) },
  misto: { nome: 'Bosque misto', tiles: arvores(['carvalho', 'pinheiro', 'carvalho2', 'pinheiro2']) },
  pinheiral: { nome: 'Pinheiral', tiles: { ...arvores(['pinheiro', 'pinheiro2']), '^': { arte: ['pedregulho'] } } },
  sombrio: { nome: 'Bosque sombrio', tiles: arvores(['carvalhoSombrio', 'pinheiro2', 'carvalhoSombrio']) },
  inverno: { nome: 'Inverno', tiles: { ...arvores(['pinheiroNevado', 'pinheiro']), f: { arte: ['pedrinhas'] } } }
};

/* Capítulos: agrupam os mapas (`mapa.cap`) e dão o título que aparece na tela. A regra do roteiro é um capítulo
   por rota da Gen: capítulo 1 = 1ª rota… capítulo 10 = a rota final, a dos lendários. */
export const CAPITULOS = [
  { id: 'cap1', n: 1, nome: 'A Fonte Calada', regiao: 'Vale do Orvalho', rota: 0 },
  { id: 'cap2', n: 2, nome: 'O Passo dos Laços', regiao: 'Serra do Fumo', rota: 1 },
  { id: 'cap3', n: 3, nome: 'A Cidade das Arenas', regiao: 'Vau das Moedas', rota: 2 }
];

/* Itens-chave: vivem em `S.saga.itens`, não na mochila — não têm efeito em batalha nem preço, só abrem conversa. */
export const ITENS_SAGA = {
  lamparina: { nome: 'Lamparina do Sineiro', emoji: '🏮', desc: 'Sem ela, as Ruínas da Fonte engolem quem entra.' },
  coracao: { nome: 'Coração da Fonte', emoji: '💠', desc: 'Morno, pulsando devagar. A aldeia inteira vai querer isto.' },
  minerio: { nome: 'Caixote de Minério', emoji: '📦', desc: 'Tem a marca do martelo da ferreira Brasa.' },
  sino: { nome: 'Sino Rachado', emoji: '🔔', desc: 'Não toca há muito tempo. Alguém ainda deve se lembrar dele.' },
  erva: { nome: 'Erva Azul', emoji: '🌿', desc: 'Miúda, rente ao chão. A curandeira dos humanos sabe o que fazer com ela.' },
  unguento: { nome: 'Unguento da Selma', emoji: '🫙', desc: 'Pra ferida de lança. Chegar devagar, de lado, e deixar cheirar primeiro.' },
  chave: { nome: 'Chave das Gaiolas', emoji: '🗝', desc: 'De ferro, pesada, cheirando a fumaça.' },
  lanca: { nome: 'Ponta de Lança', emoji: '🗡', desc: 'Ferro bom demais pra caçador faminto. Tem uma marca pequena, perto do encaixe.' },
  coracao2: { nome: 'Segundo Coração', emoji: '💠', desc: 'Estava no alicerce da arena. Também puxa — na mesma direção do primeiro.' }
};

/* Dons: habilidades que só a Saga dá, ganhas por ESCOLHA. Ficam no seu Pokémon (`m.dons`). O efeito é DADO, não
   código: `dano` multiplica o que você causa, `ruina` o que você causa em inimigo em Ruína, `defesa` o que você
   recebe, `encontro` a chance de encontro no mato alto, e `faro` faz o que está escondido cintilar. Quem lê:
   `regras.multSaga` (batalha) e `saga-mundo` (mapa). Dom novo sem número é dom "de história": só abre conversa. */
export const DONS = {
  brasa: { nome: 'Brasa da Forja', emoji: '⚒', desc: 'Seus golpes causam 20% a mais em inimigo em Ruína.', ruina: 1.2 },
  casca: { nome: 'Casca do Bosque', emoji: '🌿', desc: 'Você recebe 10% a menos de dano.', defesa: 0.9 },
  sombra: { nome: 'Passo de Sombra', emoji: '🌑', desc: 'Metade dos encontros no mato alto.', encontro: 0.5 },
  faro: { nome: 'Faro de Quem Espera', emoji: '✨', desc: 'O que está escondido no mapa cintila pra você.', faro: true },
  faisca: { nome: 'Faísca do Passo', emoji: '🔥', desc: 'Seus golpes causam 8% a mais.', dano: 1.08 },
  unha: { nome: 'Unha Leve', emoji: '🪙', desc: 'Um terço a menos de encontros no mato alto.', encontro: 0.7 },
  correnteza: { nome: 'Correnteza', emoji: '🐟', desc: 'Você recebe 7% a menos de dano.', defesa: 0.93 },
  eco: { nome: 'Eco da Fonte', emoji: '💧', desc: 'Seus golpes causam 15% a mais em inimigo em Ruína.', ruina: 1.15 },
  torcida: { nome: 'Torcida', emoji: '🏟', desc: 'Causa 5% a mais e recebe 3% a menos.', dano: 1.05, defesa: 0.97 },
  banca: { nome: 'Olho da Banca', emoji: '🎲', desc: 'Causa 4% a mais, e um quinto a menos de encontros.', dano: 1.04, encontro: 0.8 }
};

/* Missão secreta não aparece no diário até começar — e nenhuma placa diz que ela existe. */
export const MISSOES_SAGA = {
  fonte: { nome: 'A Fonte Calada', etapas: [
    'Ouça os dois lados e volte ao Ancião: a ferreira Brasa, na aldeia, e a Mãe Meganium, no fundo do Bosque do Orvalho (oeste).',
    'Com a lamparina, entre nas Ruínas da Fonte: uma gruta no paredão, no fim da Estrada Velha (leste).',
    'O Coração da Fonte está com você. Decida a quem entregá-lo.'
  ] },
  canteiros: { nome: 'Os canteiros da Vó', etapas: [
    'Expulse o bando acampado ao sul do Bosque do Orvalho, perto do lago, e volte à Vó Vileplume.'
  ] },
  minerio: { nome: 'A marca do martelo', etapas: [
    'Ache o caixote de minério num recanto de pedra, a leste da Estrada Velha, e leve à ferreira Brasa.'
  ] },
  sino: { nome: 'O que o poço lembra', secreta: true, etapas: [
    '“A árvore que não é árvore.” Algo no norte do Bosque do Orvalho não é o que parece.',
    'Alguém na aldeia deve se lembrar deste sino. Quem ali tem memória comprida?'
  ] },
  passo: { nome: 'O Passo dos Laços', etapas: [
    'Fale com a Mãe Ursa na toca dos refugiados: uma gruta entre as pedras, a oeste da trilha do Passo.',
    'Ouça o Cascalho e o Cogu, na toca, e vá ver o acampamento dos Fumeiros com os próprios olhos (a leste, seguindo a fumaça).',
    'Volte à Mãe Ursa com um plano. Dizem que existe um terceiro caminho, pela gruta do Alfa, no alto do Passo.'
  ] },
  gaiolas: { nome: 'Quem chora pelas duas', etapas: [
    'Ache a chave no mato alto atrás das barracas do acampamento, abra as gaiolas e volte ao Teddiursa, na toca.'
  ] },
  erva: { nome: 'A flor rente ao chão', etapas: [
    'Ache a erva azul na encosta do Passo, perto da trilha de cima, e leve à curandeira Selma, no acampamento.'
  ] },
  lanca: { nome: 'Ferro bom demais', secreta: true, etapas: [
    'A ponta da lança que feriu o Alfa tem uma marca. Alguém vai reconhecê-la — e nem todo mundo vai gostar.'
  ] },
  vau: { nome: 'A Cidade das Arenas', etapas: [
    'Fale com o Mestre Baltazar, na praça do Vau das Moedas.',
    'Vença os dois desafiantes dentro da arena e fale com o guarda da escada.',
    'Desça ao porão da arena.',
    'O segundo Coração está com você. O Mestre o quer de volta no alicerce; a Lia, na beira do rio, sabe onde enterrá-lo; e há quem pague por ele.'
  ] },
  bia: { nome: 'O que a Lã quer', etapas: [
    'Pergunte à Lã, a Flaaffy ao lado da Bia, o que ela quer — e leve a resposta à Bia.'
  ] },
  ferro: { nome: 'Quem vende o ferro', secreta: true, etapas: [
    'A grade do porão tem a marca do martelo. Quem compra sabe de quem compra.'
  ] }
};

export const INICIO = { mapa: 'pedralume', em: '@' };

const some = { sem: ['passo-fogo', 'passo-fome'] };   // depois do fogo ou da fome, o acampamento dos Fumeiros está vazio

export const MAPAS_SAGA = {
  /* ================= CAPÍTULO 1 — o Vale do Orvalho ================= */
  pedralume: {
    cap: 'cap1', nome: 'Pedralume', desc: 'Uma aldeia em volta de uma fonte que não canta mais.', rota: 0, chao: '.',
    grade: [
      'TTTTTTTTTTTTTTGTTTTTTTTTTTTTTT',
      'T.............=Q.............T',
      'T..hhh........=.........hhh..T',
      'T..hhh........=.........hhh..T',
      'T..hch........=.........hch..T',
      'T...A.........=........F.B...T',
      'T...=.........=..........=...T',
      'T...=.........=..........=...T',
      '1============================2',
      'T.............=..............T',
      'T......f.....W=.....f........T',
      'T...........S.=..K...........T',
      'T.............=..............T',
      'T..hhh........=.........hhh..T',
      'T..hhh........=.........hhh..T',
      'T..hch........=.........hch..T',
      'T...H.I.......=........L.M.R.T',
      'T...=.........=..........=...T',
      'T...==========@===========...T',
      'T.............f..............T',
      'T..f.....................f...T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      '@': { chegada: true, como: '=' },
      '1': { porta: ['bosque', '1'], como: '=' },
      '2': { porta: ['estrada', '2'], como: '=' },
      G: [{ se: { sem: 'cap1' }, npc: 'guarda', como: '=' }, { porta: ['passo', '1'], como: '=' }],
      Q: { se: { flag: 'cap1' }, npc: 'guarda' },
      A: { npc: 'anciao' }, B: { npc: 'brasa' }, H: { npc: 'chansey' }, M: { npc: 'kecleon' }, S: { npc: 'slowpoke' }, K: { npc: 'pichu' },
      W: { placa: 'Um poço. A corda desce, bate em pedra seca e volta leve.', arte: 'poco' },
      F: { enfeite: true, arte: 'placaForja', texto: 'Forja de Pedralume. Embaixo, riscado a prego: “sem água, sem têmpera”.' },
      I: { enfeite: true, arte: 'placaPousada', texto: 'Pousada do Sino. O sino da tabuleta foi raspado, mas o contorno ficou.' },
      L: { enfeite: true, arte: 'placaLoja', texto: 'Kecleon — de tudo, de todas as cores.' },
      R: { enfeite: true, prop: 'barris' }
    }
  },
  bosque: {
    cap: 'cap1', nome: 'Bosque do Orvalho', desc: 'As últimas flores do vale ainda abrem aqui.', rota: 0, chao: '.',
    grade: [
      'TTTTTTTTTTT4TTTTTTTTTTTTTTTTTT',
      'T""""..TTTTtTTT.....hhh......T',
      'T"""""..TTT.TTT.....hhh......T',
      'T""""...........=...hch..""""T',
      'T.""............=....V...""""T',
      'T...............=....=...."""T',
      'T......TT.......======.......T',
      'T..C...TT.......=............T',
      'T...............=............T',
      'T.........""""..=............T',
      'T.........""""""=============1',
      'T..........""""".............T',
      'TTT..f.....""""""....TTT.....T',
      'T.f.f......""""""............T',
      'T..R..f.....""""....~~~~.....T',
      'T.f.f..........X....~~~~.....T',
      'T..f................~~~~.....T',
      'T............................T',
      'T....TT...........TT.........T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      '1': { porta: ['pedralume', '1'], como: '=' },
      '4': { porta: ['clareira', '4'], como: 'T' },   // atrás da árvore falsa: a porta também se veste de árvore
      V: { npc: 'vo' }, R: { npc: 'meganium' },
      C: { bau: 'bosque-cesto', texto: 'Um cesto esquecido entre as raízes. Dentro, duas poções ainda lacradas.', faz: { bag: [['potion', 2]] } },
      X: { inimigo: { id: 'pisoteadores', tipo: 'bando', fala: 'Um bando acampou em cima dos canteiros da Vó. Mastigam sem pressa, e te olham sem medo.' } }
    }
  },
  clareira: {
    cap: 'cap1', nome: 'Clareira do Sineiro', desc: 'Ninguém vem aqui. Alguém, mesmo assim, varre as folhas.', rota: 0, chao: '.', tema: 'sombrio',
    grade: [
      'TTTTTTTTTTTTTT',
      'T..f......f..T',
      'T.....Z......T',
      'T..f...S..f..T',
      'T............T',
      'T..Y.........T',
      'T............T',
      'TTTTTT4TTTTTTT'
    ],
    objs: {
      '4': { porta: ['bosque', '4'] },
      Y: { npc: 'veu' },
      Z: { placa: 'Uma lápide sem nome. Alguém riscou nela, com unha paciente, o desenho de um sino.', arte: 'lapide' },
      S: { bau: 'sino', texto: 'Um baú pequeno, sem tranca. Dentro, embrulhado em pano, um sino de bronze rachado de alto a baixo.', faz: { item: 'sino', missao: ['sino', 1] } }
    }
  },
  estrada: {
    cap: 'cap1', nome: 'Estrada Velha', desc: 'Já passou carroça por aqui. Hoje passa o que tem fome — e o que arma laço.', rota: 0, chao: '.',
    grade: [
      'TTTTTTTTTTTTTTTTTTTTTTTT^^^^^^^^^^',
      'T..."""""......T........^^^^^^^^^^',
      'T..""""""......TT.......^^^^5^^^^^',
      'T...""""................^^..L..^^^',
      'T.......................^...=....^',
      'T....Q.R....................=....^',
      'T...........................=....^',
      'T.......TTTT......A.........=....^',
      '2================G==N========....^',
      'T.......TTTT.....................^',
      'T.."""""................^^^^^^^^.^',
      'T.."""""...............Y..M...^..^',
      'T.......................^^^^^^^..^',
      'T....""""".....................D.^',
      'T....""""".......................^',
      'T................................^',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      '2': { porta: ['pedralume', '2'], como: '=' },
      '5': { porta: ['ruinas', '5'], como: '^', prop: 'entradaCaverna' },
      L: { se: { semItem: 'lamparina' }, placa: 'A boca de uma gruta no paredão. Lá dentro é escuro de um jeito que parece ter peso. Sem luz, não dá.', arte: 'breu', como: '=' },
      Q: { npc: 'lasca' },
      R: { enfeite: true, prop: 'barris', texto: 'O que sobrou de uma carroça: dois barris, um eixo partido e marcas de roda que terminam aqui.' },
      G: { se: { sem: 'viu-laco' }, gatilho: 'laco', como: '=', texto: 'Um laço de arame, armado no meio da trilha, quase da cor da terra. Seu pelo arrepia antes de você entender por quê.<br><br>Isto não é coisa de Pokémon.', faz: { flag: 'viu-laco' } },
      N: [
        { se: { sem: 'venceu:nico' }, como: '=', inimigo: { id: 'nico', tipo: 'treinador', sprite: 'menino', fala: 'Um menino humano salta do mato, com uma bola de pano e arame na mão.<br><br>— Achei! Esse é dos fortes! Não foge, não foge, eu só preciso de UM pra arena!' } },
        { npc: 'nico', como: '=' }
      ],
      A: { se: { flag: 'venceu:nico' }, npc: 'lia' },
      Y: { inimigo: { id: 'rondadores', tipo: 'bando' } },
      M: { bau: 'caixote', arte: 'bau2', texto: 'Um caixote tombado, com um martelo marcado a fogo na tampa. Pesa como promessa.', faz: { item: 'minerio' } },
      D: { bau: 'estrada-bolsa', arte: 'bau3', texto: 'Uma bolsa de viajante, largada às pressas. Quem largou não voltou pra buscar.', faz: { dinheiro: 150, bag: [['super-potion', 1]] } }
    }
  },
  ruinas: {
    cap: 'cap1', nome: 'Ruínas da Fonte', desc: 'A água nascia aqui. O que nasce agora é outra coisa.', rota: 0, chao: '_',
    grade: [
      '########################',
      '########____X____#######',
      '#######___________######',
      '#######____aa_____######',
      '#########__::__#########',
      '########_::::::_########',
      '####_____::##::_____####',
      '####_B___::##::___i_####',
      '####_____::::::_____####',
      '########_::::::_########',
      '##########_::_##########',
      '###########__###########',
      '###########__###########',
      '###########E_###########',
      '###########5############'
    ],
    objs: {
      '5': { porta: ['estrada', '5'] },
      E: { se: { sem: 'viu-eco' }, gatilho: 'eco', texto: 'A lamparina abre um círculo pequeno no escuro. Do fundo vem um som de respiração — grande, lenta, e mais de uma.', faz: { flag: 'viu-eco' } },
      B: { bau: 'ruinas-embornal', texto: 'Ferramentas de aprendiz, largadas no chão: duas picaretas e um embornal. O embornal ainda serve.', faz: { bag: [['revive', 1], ['super-potion', 1]] } },
      X: [
        { se: { sem: 'venceu:alfa' }, inimigo: { id: 'alfa', tipo: 'alfa', fala: 'Enrolado sobre o leito seco da nascente, o <b>Alfa</b> abre um olho. Ele não está só.' } },
        { se: { sem: 'pegou-coracao' }, bau: 'coracao', arte: 'poco',
          texto: 'No leito seco, o encaixe do Coração está rachado por raízes de um lado e lascado a picareta do outro. Os dois chegaram perto demais. O Alfa só fez ninho em cima do que sobrou solto — e quente.<br><br>Você pega o <b>Coração da Fonte</b>.',
          faz: { item: 'coracao', flag: 'pegou-coracao', missao: ['fonte', 2] } },
        { placa: 'O leito vazio da nascente. Raiz de um lado, marca de picareta do outro.', arte: 'poco' }
      ]
    }
  },

  /* ================= CAPÍTULO 2 — a Serra do Fumo ================= */
  passo: {
    cap: 'cap2', nome: 'Passo do Norte', desc: 'Pinheiro, pedra e uma fumaça que não é de forja.', rota: 1, chao: '.', tema: 'pinheiral',
    grade: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T^^^K^^^......""""...........T',
      'T...=.........""""""........TT',
      'T...=.....E..."""""..........T',
      'T...=........................T',
      'T...=====.......TT...........T',
      'T.......=..........==========C',
      'T.......=..........=.........T',
      'T.......=====G======....Q....T',
      'T.."""".....=................T',
      'T.""""""....=................T',
      'T..""""..^^.=................T',
      'T.^^^.^^^^^.=.......TT.......T',
      'T..H=========......TT........T',
      'T...........=................T',
      'T....""""...=....""""".......T',
      'T...""""""..=....""""""".....T',
      'T....""""...=....."""""......T',
      'T...........=................T',
      'T...........=N...............T',
      'T...........=................T',
      'TTTTTTTTTTTT1TTTTTTTTTTTTTTTTT'
    ],
    objs: {
      '1': { porta: ['pedralume', 'G'], como: '=' },
      K: { porta: ['covil', 'K'], como: '^', prop: 'entradaCaverna' },
      H: { porta: ['toca', 'H'], como: '^', prop: 'entradaCaverna' },
      C: { porta: ['acampamento', 'C'], como: '=' },
      N: { npc: 'nara' }, Q: { npc: 'lasca2' },
      G: { se: { sem: 'viu-laco2' }, gatilho: 'laco2', como: '=', texto: 'Outro laço — mas este não é de criança. Arame trançado, estaca funda, um nó que só aperta. Quem armou isto sabe o que está fazendo, e já fez muitas vezes.', faz: { flag: 'viu-laco2' } },
      E: { bau: 'erva-azul', arte: 'floresAzuis', texto: 'Uma moita de flores azuis, miúdas, rentes ao chão. O cheiro arde o focinho, do jeito bom.', faz: { item: 'erva' } }
    }
  },
  toca: {
    cap: 'cap2', nome: 'Toca dos Refugiados', desc: 'Quem fugiu do Passo dorme aqui, longe da entrada, porque claridade denuncia.', rota: 1, chao: '_',
    grade: [
      '####################',
      '####__________######',
      '###___U_____C___####',
      '###______________###',
      '##___W________B___##',
      '##________________##',
      '##____i______i____##',
      '###______________###',
      '####___D________####',
      '######________######',
      '########____########',
      '#########__#########',
      '#########H##########'
    ],
    objs: {
      H: { porta: ['passo', 'H'] },
      U: { npc: 'ursa' }, C: { npc: 'cascalho' }, B: { npc: 'cogu' }, W: { npc: 'wooper' }, D: { npc: 'teddi' }
    }
  },
  acampamento: {
    cap: 'cap2', nome: 'Acampamento dos Fumeiros', desc: 'Barracas, gaiolas e um defumadouro que não apaga.', rota: 1, chao: '.', tema: 'pinheiral',
    grade: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T............................T',
      'T.....hhh..........hhh.......T',
      'T.....hhh..........hhh.......T',
      'T.....hch..........hPh.......T',
      'T......D............V........T',
      'T......=............=........T',
      'T......=............=..^^^^^^T',
      'T......=......F.....=...A.B.E^',
      'C====================........T',
      'T......=......O..............T',
      'T......=.........I...........T',
      'T..hhh.=.....................T',
      'T..hhh.=.............""""....T',
      'T..hch.=............"""""K...T',
      'T...S..=.....................T',
      'T...====.....................T',
      'TTTTTTTZTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      C: { porta: ['passo', 'C'], como: '=' },
      Z: [{ se: { sem: 'cap2' }, placa: 'A estrada desce a serra, rio abaixo. Mas o Passo ainda não se resolveu — e quem sai agora deixa uma toca inteira pra trás.', como: '=' },
          { porta: ['beira', 'Z'], como: '=' }],
      D: { placa: 'O defumadouro. Gordura pingando em brasa lenta. Você conhece alguns dos cheiros. Preferia não conhecer.' },
      P: { enfeite: true, prop: 'casaPedra', texto: 'A despensa dos Fumeiros: tudo o que foi defumado no mês, numa casa só.' },
      F: { enfeite: true, arte: 'pocaLava', texto: 'A fogueira do acampamento, reduzida a brasa. Alguém a mantém acesa a noite inteira.' },
      V: { se: some, inimigo: { id: 'vigia', tipo: 'treinador', sprite: 'lenhador', fala: 'O vigia da despensa levanta a lança e assobia. Dois cães de caça saem de trás da casa.' } },
      O: { se: some, npc: 'tome' }, S: { se: some, npc: 'selma' }, I: { se: some, npc: 'tico' },
      A: { se: { sem: 'solto1' }, npc: 'preso1' }, B: { se: { sem: 'solto2' }, npc: 'preso2' }, E: { npc: 'preso3' },
      K: { bau: 'chave-gaiolas', arte: 'bau4', texto: 'Um baú baixo, escondido no mato atrás das barracas. Dentro, uma chave de ferro, pesada, cheirando a fumaça.', faz: { item: 'chave' } }
    }
  },
  covil: {
    cap: 'cap2', nome: 'Gruta do Alfa', desc: 'Água desce pela pedra, em algum lugar acima. E alguma coisa aqui dentro não dorme.', rota: 1, chao: '_',
    grade: [
      '####################',
      '######________######',
      '####_____X______####',
      '###______________###',
      '###___::::::::___###',
      '##___::::aa::::___##',
      '##___::::aa::::___##',
      '###___::::::::___###',
      '####____::::____####',
      '######___::___######',
      '########____########',
      '#########__#########',
      '#########K##########'
    ],
    objs: {
      K: { porta: ['passo', 'K'] },
      X: [
        { se: { item: 'unguento', sem: 'venceu:alfa2' }, npc: 'alfa2' },
        { se: { sem: 'venceu:alfa2' }, inimigo: { id: 'alfa2', tipo: 'alfa', fala: 'O <b>Alfa do Passo</b> se ergue num salto torto, com um cabo de lança balançando no flanco. Ele não enxerga você: enxerga mais um que veio terminar o serviço.' } },
        { se: { flag: 'alfa-calmo' }, npc: 'alfa2' },
        { se: { sem: 'pegou-lanca' }, bau: 'lanca', arte: 'pedrinhas', texto: 'O Alfa recuou pro fundo da gruta, mancando. No chão ficou o que saiu do flanco dele na luta: uma ponta de lança, de ferro bom demais pra caçador faminto.', faz: { item: 'lanca', flag: 'pegou-lanca', missao: ['lanca', 0] } }
      ]
    }
  },

  /* ================= CAPÍTULO 3 — o Vau das Moedas ================= */
  beira: {
    cap: 'cap3', nome: 'Beira do Rio', desc: 'O rio que desce do Passo passa aqui, largo e sem pressa, a caminho da cidade.', rota: 2, chao: '.',
    grade: [
      'TTTTTTTZTTTTTTTTTTTTTTTTTT',
      'T......=..........~~~~~~~T',
      'T......=....""""..~~~~~~~T',
      'T......=...""""""..~~~~~~T',
      'T......=....""""....~~~~~T',
      'T......=...........~~~~~~T',
      'T..L...=====........~~~~~T',
      'T..........=..""""..~~~~~T',
      'T..""""....=.""""""..~~~~T',
      'T.""""""...=..""""...~~~~T',
      'T..""""....=..........~~~T',
      'T.......B..=..........~~~T',
      'T..........=..........~~~T',
      'T..........=...........~~T',
      'T..........=...........~~T',
      'TTTTTTTTTTTVTTTTTTTTTTTTTT'
    ],
    objs: {
      Z: { porta: ['acampamento', 'Z'], como: '=' },
      V: { porta: ['vau', 'V'], como: '=' },
      L: { npc: 'lia3' },
      B: { bau: 'beira-rede', arte: 'bau3', texto: 'Uma rede de pesca enrolada num cesto, e embaixo dela o que algum viajante achou que ninguém ia procurar.', faz: { dinheiro: 220, bag: [['sitrus-berry', 2]] } }
    }
  },
  vau: {
    cap: 'cap3', nome: 'Vau das Moedas', desc: 'A primeira cidade dos humanos. Tudo aqui passa pela porta da arena.', rota: 2, chao: '.',
    grade: [
      'TTTTTTTTTTTTTTTTVTTTTTTTTTTTTTTTTT',
      'T...............=.........~~~~~~~T',
      'T..hhh....hhh...=...hhh...~~~~~~~T',
      'T..hhh....hhh...=...hhh...~~~~~~~T',
      'T..hch....hch...=...hAh...~~~~~~~T',
      'T...B.L....K....=......S...~~~~~~T',
      'T...=......=....=....=.....~~~~~~T',
      'T...=......=....=....=.....~~~~~~T',
      'T...======================.~~~~~~T',
      'T...............=..........~~~~~~T',
      'T......f.....W..=..M.......~~~~~~T',
      'T...............=...........~~~~~T',
      'T..hhh....hhh...=...........~~~~~T',
      'T..hhh....hhh...=...........~~~~~T',
      'T..hch....hch...=....Q......~~~~~T',
      'T...R......N....=...........~~~~~T',
      'T...=......=....=...........~~~~~T',
      'T...=============...........~~~~~T',
      'T...........................~~~~~T',
      'T..f.....""""........f......~~~~~T',
      'T........""""""..............~~~~T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      V: { porta: ['beira', 'V'], como: '=' },
      A: { porta: ['arena', 'A'], prop: 'casaPedra' },
      S: { enfeite: true, arte: 'placaForja', texto: 'ARENA DO VAU. Lutas toda feira. Bicho forte come de graça; dono de bicho forte, também.' },
      W: { placa: 'O poço da praça. Aqui tem água — limpa, funda, e com um gosto que você já sentiu em Pedralume.', arte: 'poco' },
      B: { npc: 'bia' }, L: { npc: 'la' }, K: { npc: 'kiko' }, M: { npc: 'baltazar' }, Q: { npc: 'lasca3' }, N: { npc: 'nico3' },
      R: { enfeite: true, prop: 'barris', texto: 'Barris de peixe salgado, com o carimbo de três rios diferentes. Gente de longe vem ver a arena.' }
    }
  },
  arena: {
    cap: 'cap3', nome: 'Arena do Vau', desc: 'Areia batida, cheiro de suor e de moeda. Quem luta bem aqui dentro nunca mais passa fome.', rota: 2, chao: '_',
    grade: [
      '######################',
      '#####______P_____#####',
      '###________G_______###',
      '###________________###',
      '##____rrrrrrrrrr____##',
      '##____rrrrrrrrrr____##',
      '##_D__rrrrCrrrrr__E_##',
      '##____rrrrrrrrrr____##',
      '##____rrrrrrrrrr____##',
      '###________________###',
      '###________________###',
      '####______________####',
      '######__________######',
      '#########____#########',
      '##########A###########'
    ],
    objs: {
      A: { porta: ['vau', 'A'] },
      P: { porta: ['porao', 'P'], arte: 'fenda' },
      G: { se: { sem: 'porao-aberto' }, npc: 'guardaArena' },
      C: { npc: 'campeao', como: 'r' },
      D: { inimigo: { id: 'desafiante1', tipo: 'treinador', sprite: 'menino', fala: '— Um bicho sem dono no picadeiro! — o menino ri, nervoso, e solta os dele. — Vale moeda dobrada!' } },
      E: { inimigo: { id: 'desafiante2', tipo: 'treinador', sprite: 'menina', fala: 'A menina amarra o cabelo, sem pressa.<br><br>— Eu não luto por moeda. Eu luto porque sou boa. Vem.' } }
    }
  },
  porao: {
    cap: 'cap3', nome: 'Porão da Arena', desc: 'Debaixo da festa. Ferro novo, pedra velha, e uma coisa morna no fundo.', rota: 2, chao: '_',
    grade: [
      '####################',
      '########_Y_#########',
      '#########_##########',
      '#########X##########',
      '######_______#######',
      '####___________#####',
      '###__M__________####',
      '###_____________####',
      '####___i____i___####',
      '#####__________#####',
      '#######______#######',
      '#########__#########',
      '#########P##########'
    ],
    objs: {
      P: { porta: ['arena', 'P'] },
      M: { bau: 'grade', arte: 'estalagmiteNegra', texto: 'A grade da cela. Ferro bom demais pra uma cidade de lama: sem ferrugem, sem emenda. No canto de baixo, pequeno, um <b>martelo</b> marcado a fogo.', faz: { missao: ['ferro', 0] } },
      X: [
        { se: { sem: 'venceu:fera' }, inimigo: { id: 'fera', tipo: 'alfa', fala: 'Atrás da grade, a <b>Fera</b> não ruge: espera. Anos de festa ensinaram que tudo o que desce esta escada desce pra bater. Quando você encosta na tranca, ela vem.' } },
        { se: { sem: 'fera-decidida' }, npc: 'fera' }
      ],
      Y: [
        { se: { sem: 'pegou-coracao2' }, bau: 'coracao2', arte: 'poco',
          texto: 'O alicerce da arena. Entre as pedras da fundação, uma é morna e pulsa devagar, como a de Pedralume. É por isso que as lutas daqui são “boas”: tudo o que vive perto disto fica mais forte — e quer provar.<br><br>Você pega o <b>segundo Coração</b>. Ele também puxa. Na mesma direção.',
          faz: { item: 'coracao2', flag: 'pegou-coracao2', missao: ['vau', 3] } },
        { placa: 'O vão no alicerce, onde a pedra morna ficava.', arte: 'poco' }
      ]
    }
  }
};

/* ---- NPCs ----
   `sprite`: número = espécie de Pokémon (só a figura); texto = um humano do atlas (`dados-saga-arte.GENTE`);
   '@alfa' = o Alfa da rota daquele mapa, seja ele quem for nesta Gen.
   `falas` = por onde a conversa COMEÇA: vale a primeira entrada cujo `se` for verdadeiro (a última, sem `se`, é
   o padrão). Cada nó: `fala`, `faz` (efeitos, depois da fala), `opcoes` ([{ t, se, faz, vai }]) ou `vai` (segue
   com "Continuar"). Sem `opcoes` nem `vai`, a conversa acaba ali. */
export const NPCS = {
  /* ===== capítulo 1 ===== */
  anciao: { nome: 'Ancião Torkoal', sprite: 324,
    falas: [
      { se: { flag: 'fim-forja' }, no: 'depoisForja' }, { se: { flag: 'fim-bosque' }, no: 'depoisBosque' }, { se: { flag: 'fim-abismo' }, no: 'depoisAbismo' },
      { se: { missao: ['fonte', 2] }, no: 'comCoracao' },
      { se: { missao: ['fonte', 1] }, no: 'vaiLa' },
      { se: { missao: ['fonte', 0], flag: ['ouviu-bosque', 'ouviu-forja'] }, no: 'doisLados' },
      { se: { missao: ['fonte', 0] }, no: 'espera' },
      { no: 'inicio' }
    ],
    nos: {
      inicio: { fala: 'Hm. Você não é daqui. Dá pra ver pelo jeito que olha a praça — como quem ainda acha que tem água nela.', vai: 'inicio2' },
      inicio2: { fala: 'A Fonte de Pedralume secou faz onze dias. Não foi minguando, não. Num entardecer estava cantando; na manhã seguinte, pedra seca. Eu tenho idade pra saber que nascente não morre assim, de um dia pro outro.',
        opcoes: [{ t: 'O que aconteceu?', vai: 'oque' }, { t: 'E por que me contar isso?', vai: 'porque' }, { t: 'Não é problema meu.', vai: 'recusa' }] },
      oque: { fala: 'Depende de pra quem você pergunta. A ferreira jura que o Círculo do Bosque deixou as raízes entupirem a nascente. O Círculo jura que a Forja cavou fundo demais atrás de minério. Os dois falam alto. Nenhum dos dois subiu lá pra olhar.', vai: 'pedido' },
      porque: { fala: 'Porque todo mundo aqui já escolheu um lado, e quem escolheu lado não enxerga mais. Você chegou hoje. Ainda tem os dois olhos.', vai: 'pedido' },
      recusa: { fala: 'Não é. Ainda. Mas você vai querer beber alguma coisa antes de ir embora, e aí vai ser.' },
      pedido: { fala: 'Faça um favor a um velho: ouça a Brasa, aqui na forja, e a Mãe Meganium, lá no fundo do bosque, a oeste. Depois volte e me diga o que eles <b>não</b> disseram. É no que fica de fora que a verdade costuma morar.',
        opcoes: [{ t: 'Eu vou.', faz: { missao: ['fonte', 0] }, vai: 'aceitou' }, { t: 'Preciso pensar.' }] },
      aceitou: { fala: 'Bom. E, {eu}… não prometa nada a nenhum dos dois. Promessa aqui virou moeda.' },
      espera: { fala: 'Já ouviu os dois? A Brasa fica na forja, a nordeste da praça. A Mãe Meganium, no fundo do bosque, onde as flores ainda teimam.' },
      doisLados: { fala: 'Então. O que eles não disseram?',
        opcoes: [{ t: 'Nenhum dos dois foi até a nascente.', vai: 'certo' }, { t: 'Os dois têm medo de alguma coisa lá em cima.', vai: 'certo' }] },
      certo: { fala: 'Isso. Onze dias de gritaria e ninguém subiu, porque tem algo nas ruínas que não deixa. Eu ouço de noite. Não é raiz e não é picareta.', vai: 'lamparina' },
      lamparina: { fala: 'Tome. Era do sineiro, quando a aldeia ainda tinha um. As ruínas ficam no fim da Estrada Velha, a leste — uma gruta no paredão. Leve gente com você, se tiver: o que está lá em cima não mora sozinho.', faz: { item: 'lamparina', missao: ['fonte', 1] } },
      vaiLa: { fala: 'As ruínas ficam no fim da Estrada Velha, a leste. E descanse antes, na pousada. Herói cansado é só um cansado.' },
      comCoracao: { fala: '…Então era isso. O Coração da Fonte, fora do leito.', vai: 'comCoracao2' },
      comCoracao2: { fala: 'Não me dê. Eu sou velho demais pra carregar o que uma aldeia inteira vai disputar. A Forja diz que sabe assentá-lo com ferro. O Círculo, com raiz. Os dois sabem, cada um do seu jeito — e cada jeito tem um preço que o outro paga.' },
      depoisForja: { fala: 'A água voltou. Vem por cano de ferro, com gosto de moeda, mas vem. O bosque lá embaixo anda mais calado. Você fez uma escolha, {eu}. Eu só queria que alguém fizesse.', vai: 'norte' },
      depoisBosque: { fala: 'A água voltou — fina, fria, e só até onde as raízes deixam. A forja apagou dois fornos e a Brasa não fala comigo. Acho que nem com você. Mas as crianças estão bebendo.', vai: 'norte' },
      depoisAbismo: { fala: 'A fonte continua seca. E um Sableye anda rindo sozinho pela estrada. Eu não sei o que você fez, {eu}. Só sei que perguntei pra pessoa errada.', vai: 'norte' },
      norte: { fala: 'Uma coisa, antes de você ir. O Coração — onde quer que ele esteja agora — <b>puxa pro norte</b>. Você não sentiu? Eu senti a vida inteira e fingi que era frio. Mandei abrir o Passo. Vai ver o que tem lá em cima chamando.' }
    } },

  brasa: { nome: 'Brasa, a ferreira', sprite: 126,
    falas: [
      { se: { flag: 'fim-forja' }, no: 'depoisForja' }, { se: { flag: 'fim-bosque' }, no: 'depoisBosque' }, { se: { flag: 'fim-abismo' }, no: 'depoisAbismo' },
      { se: { flag: 'vendeu-minerio' }, no: 'traida' },
      { se: { missao: ['fonte', 2] }, no: 'coracao' },
      { se: { missao: ['minerio', 0], item: 'minerio' }, no: 'trouxe' },
      { se: { missao: ['minerio', 0] }, no: 'cade' },
      { se: { missao: ['fonte', 0], sem: 'ouviu-forja' }, no: 'versao' },
      { se: { missao: ['minerio', 'nao'], flag: 'ouviu-forja' }, no: 'servico' },
      { se: { missao: ['fonte', 'nao'] }, no: 'ocupada' },
      { no: 'padrao' }
    ],
    nos: {
      ocupada: { fala: 'Se veio encomendar, entra na fila: sem água eu não tempero nem prego. Se veio só olhar, olha de longe, que faísca não escolhe.' },
      padrao: { fala: 'Sem água, sem têmpera. Sem têmpera, sem conversa.' },
      versao: { fala: 'O velho te mandou, né. Ele manda todo mundo que chega. Tá, escuta: a Forja cava naquele morro há três gerações e a fonte nunca reclamou. Aí o Círculo resolve “deixar o bosque respirar”, para de podar raiz, e onze dias atrás a água some. Eu sei somar.',
        opcoes: [{ t: 'Vocês cavaram mais fundo este ano?', vai: 'fundo' }, { t: 'Alguém da Forja subiu até a nascente?', vai: 'subiu' }] },
      fundo: { fala: '…Um veio novo. Fundo, sim. Mas longe da nascente — eu mesma medi. Medi duas vezes. E não leva isso pro velho como se fosse confissão.', faz: { flag: 'ouviu-forja' }, vai: 'servico' },
      subiu: { fala: 'Mandei dois aprendizes. Voltaram no mesmo dia, sem as ferramentas e sem querer falar. Aprendiz é assim, se assusta com a própria sombra. …Era o que eu achava, pelo menos.', faz: { flag: 'ouviu-forja' }, vai: 'servico' },
      servico: { fala: 'Já que você anda por aí: um caixote do meu minério ficou na Estrada Velha quando a carroça quebrou. Tem bicho rondando e ninguém meu volta lá. Me traz, e eu te pago em coisa que presta, não em moeda.',
        opcoes: [{ t: 'Trago.', faz: { missao: ['minerio', 0] }, vai: 'combinado' }, { t: 'Agora não.' }] },
      combinado: { fala: 'Recanto de pedra, do lado leste da estrada. Caixote com a marca do martelo. Não tem como errar.' },
      cade: { fala: 'Caixote. Marca do martelo. Recanto de pedra, a leste. Eu continuo sem prego.' },
      trouxe: { fala: 'Olha só. Inteiro, e com a marca. Meus aprendizes levariam uma semana pra criar essa coragem.', vai: 'paga' },
      paga: { fala: 'Pega. Forjei pra alguém que desistiu de vir buscar. Em você vai fazer mais serviço.', faz: { perde: 'minerio', missao: ['minerio', 'fim'], rep: { forja: 2 }, bag: [['muscle-band', 1]], dinheiro: 200 } },
      traida: { fala: 'Um Sableye andou vendendo minério com a <b>minha</b> marca na estrada. Engraçado, né? Não tenho nada pra você. Nem prego. E o que quer que esteja carregando aí, leva pra outro.' },
      coracao: { fala: 'Isso na sua pata é… é o Coração. Estava <b>fora</b> do leito? Então não foi raiz. …Nem só picareta.', vai: 'coracao2' },
      coracao2: { fala: 'Me dá. Eu assento em bronze e puxo a água por cano até a praça. Nunca mais seca, nunca mais depende de humor de árvore. O bosque vai receber menos, é verdade. Tudo tem custo.',
        opcoes: [
          { t: '⚒ Entregar o Coração à Forja.', faz: { perde: 'coracao', flag: ['cap1', 'fim-forja'], missao: ['fonte', 'fim'], rep: { forja: 3, bosque: -3 }, dom: 'brasa', dinheiro: 800 }, vai: 'fimForja' },
          { t: 'Ainda vou ouvir o Círculo.' }] },
      fimForja: { fala: 'Você não vai se arrepender. Bom — talvez um pouco, quando passar pelo bosque. Chega perto do forno. Tem uma coisa que a Ordem só ensina a quem carrega peso por ela.' },
      depoisForja: { fala: 'Cano firme, água correndo. Passa aqui quando precisar de ferro, {eu}. Pra você a fila não existe.' },
      depoisBosque: { fala: 'Deu pras árvores. Tá. A água vem até onde elas querem e eu apaguei dois fornos. Não vou cuspir em você, mas também não vou fingir.' },
      depoisAbismo: { fala: 'Não sei onde foi parar o Coração e prefiro não saber. Porque, se eu souber, eu vou atrás.' }
    } },

  meganium: { nome: 'Mãe Meganium', sprite: 154,
    falas: [
      { se: { flag: 'fim-bosque' }, no: 'depoisBosque' }, { se: { flag: 'fim-forja' }, no: 'depoisForja' }, { se: { flag: 'fim-abismo' }, no: 'depoisAbismo' },
      { se: { missao: ['fonte', 2] }, no: 'coracao' },
      { se: { missao: ['fonte', 0], sem: 'ouviu-bosque' }, no: 'versao' },
      { no: 'padrao' }
    ],
    nos: {
      padrao: { fala: 'Pise leve. É só o que o bosque pede de quem passa.' },
      versao: { fala: 'Chegue devagar. Estas são as últimas flores do vale que ainda abrem, e elas se assustam. O Ancião mandou você — ele sempre manda alguém de fora, como se a verdade precisasse de sotaque.', vai: 'versao2' },
      versao2: { fala: 'A Forja abriu um veio novo na primavera. Fundo. A terra treme de noite, as raízes mais velhas racharam, e onze dias atrás a água parou de descer. Não é preciso ser sábia pra ligar uma coisa à outra.',
        opcoes: [{ t: 'O Círculo parou de podar as raízes perto da nascente?', vai: 'raizes' }, { t: 'Alguém do Círculo subiu até lá?', vai: 'subiu' }] },
      raizes: { fala: 'Paramos. Raiz não é erva daninha, é a mão do bosque. …Sim, elas cresceram na direção da água. É o que mãos fazem quando têm sede.', faz: { flag: 'ouviu-bosque' } },
      subiu: { fala: 'A Vó Vileplume tentou. Voltou dizendo que o ar lá em cima estava “ocupado”. Foi a palavra dela. Não tornou a subir, e eu não pedi.', faz: { flag: 'ouviu-bosque' } },
      coracao: { fala: 'Ah. Então ele saiu do leito. Coitado — e coitado de quem o tirou de lá também. Nada arranca um Coração por maldade; arranca por fome.', vai: 'coracao2' },
      coracao2: { fala: 'Deixe-o comigo. As raízes o levam de volta pra baixo da terra, onde ele dorme. A água volta a descer como sempre desceu: pouca, limpa e de todos — do bosque primeiro, é verdade, porque o bosque está no caminho. A forja vai sentir. Forno sente sede mais alto que flor.',
        opcoes: [
          { t: '🌿 Entregar o Coração ao Círculo.', faz: { perde: 'coracao', flag: ['cap1', 'fim-bosque'], missao: ['fonte', 'fim'], rep: { bosque: 3, forja: -3 }, dom: 'casca', bag: [['sitrus-berry', 3], ['leftovers', 1]] }, vai: 'fimBosque' },
          { t: 'Ainda vou ouvir a Forja.' }] },
      fimBosque: { fala: 'Obrigada. Estenda a pata… assim. Vai coçar um pouco. É casca: o bosque veste quem o veste.' },
      depoisBosque: { fala: 'Ouve? Voltou a correr. Baixinho, do jeito certo.' },
      depoisForja: { fala: 'A água passa por cima de nós agora, dentro de um cano, e não desce. Eu não tenho raiva de você. Tenho flores morrendo, que é uma coisa diferente — e pior.' },
      depoisAbismo: { fala: 'O Coração não está em bronze nem em terra. Sinto a falta dele como se sente a de um dente. O que você fez, criança?' }
    } },

  vo: { nome: 'Vó Vileplume', sprite: 45,
    falas: [
      { se: { missao: ['canteiros', 0], flag: 'venceu:pisoteadores' }, no: 'obrigada' },
      { se: { missao: ['canteiros', 0] }, no: 'ainda' },
      { se: { missao: ['canteiros', 'fim'], repAbaixo: ['bosque', 0] }, no: 'magoada' },
      { se: { missao: ['canteiros', 'fim'] }, no: 'cha' },
      { no: 'pedido' }
    ],
    nos: {
      pedido: { fala: 'Não pisa aí! …Ah, não é você. Desculpa, filho, é que eu já grito antes de olhar. Tem um bando acampado nos meus canteiros, ali pro sul, perto do lago. Onze dias sem a fonte e os bichos descem todos pra cá, atrás de qualquer coisa verde.',
        opcoes: [
          { t: 'Eu tiro eles de lá.', faz: { missao: ['canteiros', 0] }, vai: 'vai' },
          { t: 'Eu sou do verde também, Vó.', se: { tipo: ['grass', 'bug', 'fairy'], sem: 'mimo-vo' }, faz: { flag: 'mimo-vo', bag: [['oran-berry', 3]] }, vai: 'parente' },
          { t: 'Boa sorte com isso.' }] },
      parente: { fala: 'Eu vi! Tá na cara, tá no cheiro. Toma, leva: parente não sai da minha porta de pata vazia. Agora, sobre o bando…',
        opcoes: [{ t: 'Eu tiro eles de lá.', faz: { missao: ['canteiros', 0] }, vai: 'vai' }, { t: 'Outra hora, Vó.' }] },
      vai: { fala: 'Tira com jeito, que eles também têm sede. Mas tira.' },
      ainda: { fala: 'Ainda estão lá. Eu ouço mastigando daqui.' },
      obrigada: { fala: 'Sumiram! E você nem pisou na arruda. Toma — é pouco, mas é do que sobrou.', faz: { missao: ['canteiros', 'fim'], rep: { bosque: 2 }, bag: [['oran-berry', 3], ['full-heal', 1]], dinheiro: 120 }, vai: 'dica' },
      dica: { fala: 'E escuta uma coisa de velha: lá pro norte do bosque tem uma árvore que nunca deu sombra. Sessenta anos que eu passo por ela. Árvore que não dá sombra não é árvore.' },
      cha: { fala: 'Senta, toma um chá. Não tem chá, não tem água. Senta mesmo assim.' },
      magoada: { fala: 'Eu sei pra onde foi o Coração. A arruda que você não pisou morreu de sede do mesmo jeito. Vai, vai.' }
    } },

  slowpoke: { nome: 'Tio do Poço', sprite: 79,
    falas: [
      { se: { missao: ['sino', 'fim'] }, no: 'lembrou' },
      { se: { missao: ['sino', 1], item: 'sino' }, no: 'sino' },
      { se: { missao: ['sino', 0] }, no: 'arvore' },
      { se: { falas: ['slowpoke', 2] }, no: 'terceira' },
      { se: { falas: ['slowpoke', 1] }, no: 'segunda' },
      { no: 'primeira' }
    ],
    nos: {
      primeira: { fala: '…' },
      segunda: { fala: '… …tinha água aqui.' },
      terceira: { fala: '…Tinha um sino, também. Antes da água ir, foi o sino. Ninguém lembra do sino. Eu lembro devagar, mas lembro.', vai: 'terceira2' },
      terceira2: { fala: 'Tocava quando vinha coisa ruim da estrada. Aí um dia não tocou mais, e ninguém perguntou. Procura a árvore que não é árvore. No bosque. Eu… eu ia lá. Faz tempo.', faz: { missao: ['sino', 0] } },
      arvore: { fala: 'A árvore… que não é árvore. Pro norte do bosque. …Eu acho. Faz tempo.' },
      sino: { fala: '…Ah.<br><br>É ele. Rachou do lado que eu lembrava.', vai: 'sino2' },
      sino2: { fala: 'Foi o Ancião que mandou calar. Quando expulsaram a Corte do Abismo da aldeia, o sineiro — um velho amigo meu — não quis tocar o alarme contra a própria gente. Tiraram o sino. Ele foi junto. Onze <b>anos</b>, não onze dias. Onze anos que esta aldeia não escuta o que vem da estrada.', vai: 'sino3' },
      sino3: { fala: 'Você ouviu um velho lerdo até o fim. Quase ninguém ouve. Fica com isto: é o jeito de olhar de quem não tem pressa. Coisa escondida cintila pra quem espera.', faz: { missao: ['sino', 'fim'], flag: ['confianca-abismo', 'sino-devolvido'], rep: { abismo: 2 }, dom: 'faro' } },
      lembrou: { fala: '…Onze anos. Eu contei devagar, mas contei certo.' }
    } },

  veu: { nome: 'Dama Véu', sprite: 429,
    falas: [{ se: { item: 'sino' }, no: 'levou' }, { se: { missao: ['sino', 'fim'] }, no: 'levou' }, { no: 'guarda' }],
    nos: {
      guarda: { fala: 'Não se assuste. Quem acha esta clareira já provou que sabe olhar. Eu só guardo o túmulo — e o que ficou com ele.',
        opcoes: [{ t: 'De quem é o túmulo?', vai: 'quem' }, { t: 'O que tem no baú?', vai: 'bau' }, { t: 'Vou deixar você em paz.' }] },
      quem: { fala: 'Do último sineiro de Pedralume. Meu mestre. Recusou-se a tocar o sino contra os dele, e a aldeia o deixou terminar aqui, do lado de fora, atrás de uma árvore que todo mundo combinou de não enxergar.' },
      bau: { fala: 'O sino. Rachado, mas ainda sabe a verdade. Leve, se tiver a quem mostrar. Só saiba: tem gente em Pedralume que dorme melhor com ele enterrado.' },
      levou: { fala: 'Então você levou. Que ele toque — nem que seja uma vez só, e só na cabeça de quem precisa lembrar.' }
    } },

  lasca: { nome: 'Lasca', sprite: 302,
    falas: [
      { se: { flag: 'fim-abismo' }, no: 'depois' },
      { se: { flag: 'cap1' }, no: 'tarde' },
      { se: { missao: ['fonte', 2], flag: 'confianca-abismo' }, no: 'coracao' },
      { se: { missao: ['fonte', 2], tipo: ['ghost', 'dark', 'poison'] }, no: 'coracao' },
      { se: { item: 'minerio', sem: 'vendeu-minerio' }, no: 'minerio' },
      { se: { flag: 'confianca-abismo' }, no: 'amigo' },
      { se: { tipo: ['ghost', 'dark', 'poison'] }, no: 'amigo' },
      { no: 'estranho' }
    ],
    nos: {
      estranho: { fala: 'Carroça quebrada, tá vendo? Tragédia. Não, não era minha. Não, eu não vi nada. Sim, você pode continuar andando.' },
      amigo: { fala: 'Psiu. Você tem o cheiro certo — de quem já ficou do lado de fora de uma porta. A Corte do Abismo não morreu, só mudou de endereço. Se um dia tiver na pata algo que os dois lados querem… lembra que existe um terceiro que paga.' },
      minerio: { fala: 'Opa, opa. Marca do martelo. Isso aí a ferreira paga com um “obrigada” e um prego. Eu pago ₽600, agora, sem pergunta. Ela nunca vai saber. …Bom, vai. Mas aí você já está longe.',
        opcoes: [
          { t: 'Vender o minério (₽600).', faz: { perde: 'minerio', dinheiro: 600, flag: 'vendeu-minerio', missao: ['minerio', 'fim'], rep: { abismo: 2, forja: -3 } }, vai: 'vendido' },
          { t: 'É da Brasa.', vai: 'honesto' }] },
      vendido: { fala: 'Prazer fazer negócio. Se ela perguntar, eu nunca te vi. Se <b>eu</b> perguntar, você também não.' },
      honesto: { fala: 'Honesto. Que desperdício de pata.' },
      coracao: { fala: '…Guarda isso. <b>Guarda.</b> Você está andando com o Coração da Fonte na estrada como quem carrega pão?', vai: 'coracao2' },
      coracao2: { fala: 'Escuta, que eu só ofereço uma vez. A Forja quer o Coração num cano. O Círculo quer debaixo da terra. A Corte quer ele onde estava há onze anos: com a gente, que era quem cuidava da fonte antes de virarmos “coisa ruim da estrada”. ₽3.000, e uma coisa que dinheiro não compra. A aldeia fica com sede mais um tempo. Sede ensina.',
        opcoes: [
          { t: '🌑 Entregar o Coração à Corte.', faz: { perde: 'coracao', flag: ['cap1', 'fim-abismo'], missao: ['fonte', 'fim'], rep: { abismo: 3, forja: -2, bosque: -2 }, dom: 'sombra', dinheiro: 3000 }, vai: 'fimAbismo' },
          { t: 'Não.', vai: 'naoAinda' }] },
      naoAinda: { fala: 'Pensa. Eu não tenho pressa. Quem tem sede são eles.' },
      fimAbismo: { fala: 'Feito. Agora olha pra sua sombra. Viu? Ela te segue mais de perto. Presente da casa.' },
      depois: { fala: 'Não me cumprimenta em público, parceiro. Mas saiba que tem porta aberta pra você em lugar que nem mapa tem.' },
      tarde: { fala: 'Ouvi dizer que a fonte se resolveu. Pena. Tinha um negócio bom ali.' }
    } },

  guarda: { nome: 'Cabo Lairon', sprite: 305,
    falas: [{ se: { flag: 'cap1' }, no: 'aberto' }, { no: 'fechado' }],
    nos: {
      fechado: { fala: 'Passo do Norte fechado, ordem do Ancião. Com a fonte seca, metade da aldeia quer ir embora e a outra metade quer que ninguém vá. Eu fico aqui no meio, que é pra isso que serve guarda.' },
      aberto: { fala: 'O Ancião mandou abrir o Passo pra você. Não disse se era prêmio ou despejo. Lá em cima tem uma fumaça que não é de forja, e faz três noites que ninguém desce de lá. Vai de olho aberto.' }
    } },

  chansey: { nome: 'Dona Chansey', sprite: 113,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Bem-vindo à Pousada do Sino. É, eu sei que não tem sino. Cama, caldo e curativo pra comitiva inteira.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: 'Só passando.' }] }
    } },

  kecleon: { nome: 'Kecleon, o mercador', sprite: 352,
    falas: [{ no: 'banca' }],
    nos: {
      banca: { fala: 'Kecleon tem de tudo, de todas as cores, freguês! Menos água. Água está em falta.',
        opcoes: [{ t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: 'Depois.' }] }
    } },

  pichu: { nome: 'Pichu', sprite: 172,
    falas: [{ se: { falas: ['pichu', 1] }, no: 'tio' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Você é aventureiro? Tem cara. Meu irmão disse que aventureiro de verdade fala com todo mundo <b>três</b> vezes, porque na terceira é que os grandes cansam de fingir.' },
      tio: { fala: 'O Tio do Poço fala sozinho. Mas só se você esperar <b>muito</b>.' }
    } },

  nico: { nome: 'Nico', sprite: 'menino',
    falas: [{ se: { falas: ['nico', 1] }, no: 'depois' }, { no: 'perdeu' }],
    nos: {
      perdeu: { fala: 'Tá, tá, você ganhou. Não precisava bater tão forte. …Você entende o que eu falo? O pai diz que bicho não entende.',
        opcoes: [{ t: '(Encarar o menino.)', vai: 'encara' }, { t: '(Empurrar a bola de arame de volta pra ele.)', vai: 'bola' }] },
      encara: { fala: '…Entende. Ih. Então você ouviu eu te chamar de “esse”. Foi mal. É que lá no Vau quem tem um forte come todo dia, e eu tô cansado de ser o que não tem.' },
      bola: { fala: 'É minha, eu que fiz! Arame da cerca e pano da saia da mãe. Não funciona direito. E a moça da capa verde desfaz todos os meus laços: eu armo dez, ela acha nove.' },
      depois: { fala: 'Eu vou voltar pro Vau. Mas eu vou treinar. Um dia você vai querer lutar do meu lado — você vai ver.' }
    } },

  lia: { nome: 'Lia, a patrulheira', sprite: 'patrulheira',
    falas: [{ se: { flag: 'lia-confia' }, no: 'amiga' }, { se: { flag: 'lia-receio' }, no: 'longe' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Calma. Mão vazia, tá vendo? Eu sou a Lia. Aquele laço na trilha era do Nico — eu desarmo o que ele arma, ele arma o que eu desarmo. É quase uma amizade.', vai: 'oi2' },
      oi2: { fala: 'Vocês não têm motivo nenhum pra confiar em gente. Eu sei o que os Fumeiros fazem na serra e o que as arenas fazem no Vau. Eu sou de lá. É por isso que eu ando aqui.',
        opcoes: [
          { t: '(Chegar mais perto.)', faz: { flag: 'lia-confia', bag: [['oran-berry', 2]] }, vai: 'perto' },
          { t: '(Mostrar os dentes.)', faz: { flag: 'lia-receio' }, vai: 'dentes' },
          { t: '(Ir embora.)' }] },
      perto: { fala: '…Obrigada. Isso vale mais do que você imagina. Toma: são frutas, não é isca. E se um dia vir um laço de arame, não puxa — dá a volta.' },
      dentes: { fala: 'Justo. Eu faria o mesmo. Vou continuar cortando laço de qualquer jeito, com ou sem o seu boa-tarde.' },
      amiga: { fala: 'Vai com cuidado no Passo. Os Fumeiros não são crianças com arame.' },
      longe: { fala: 'Eu fico do lado de cá da trilha, você do de lá. Tudo certo.' }
    } },

  /* ===== capítulo 2 ===== */
  nara: { nome: 'Nara, a batedora', sprite: 162,
    falas: [{ se: { flag: 'cap2' }, no: 'fim' }, { se: { missao: ['passo', 'nao'] }, no: 'pare' }, { no: 'andamento' }],
    nos: {
      pare: { fala: 'Psst! Abaixa! …Ah, você é de Pedralume. O Cabo avisou que vinha alguém. Tá vendo a fumaça lá em cima? Não é incêndio. É pior: é cozinha.', vai: 'pare2' },
      pare2: { fala: 'Os Fumeiros acamparam bem no meio do Passo. Caçam de dia, defumam de noite. A gente se enfiou numa toca na encosta — a entrada fica entre as pedras, a oeste da trilha. A Mãe Ursa quer falar com quem tiver pata pra lutar.',
        opcoes: [{ t: 'Me leva até ela.', faz: { missao: ['passo', 0] }, vai: 'vai' }, { t: 'Quantos vocês são?', vai: 'quantos' }] },
      quantos: { fala: 'Éramos mais. Não me faz contar.', opcoes: [{ t: 'Me leva até ela.', faz: { missao: ['passo', 0] }, vai: 'vai' }] },
      vai: { fala: 'A oeste, entre as pedras. E olha onde pisa: tem laço de arame na trilha. Os de criança a gente desarma brincando. Os deles, não.' },
      andamento: { fala: 'A toca é a oeste, entre as pedras. O acampamento, a leste, seguindo a fumaça. E o Alfa do Passo… lá em cima, na gruta do norte. Não sobe sozinho.' },
      fim: { fala: 'O Passo ainda cheira a fumaça. Mas dá pra dormir de olho fechado, que já é alguma coisa.' }
    } },

  ursa: { nome: 'Mãe Ursa', sprite: 217,
    falas: [
      { se: { flag: 'passo-fogo' }, no: 'fogo' }, { se: { flag: 'passo-fome' }, no: 'fome' }, { se: { flag: 'passo-peixe' }, no: 'peixe' },
      { se: { missao: ['passo', 2] }, no: 'decide' },
      { se: { missao: ['passo', 1] }, no: 'espera' },
      { se: { missao: ['passo', 0] }, no: 'conta' },
      { no: 'quem' }
    ],
    nos: {
      quem: { fala: 'Quem deixou entrar? …Tanto faz. Senta longe da entrada, que claridade denuncia.' },
      conta: { fala: 'Então você é quem resolveu a fonte de Pedralume. Aqui não tem fonte pra resolver: tem gente com lança. Escuta os três e me diz qual você acha que não vai matar a gente.', vai: 'conta2' },
      conta2: { fala: 'O Cascalho, da Forja, quer queimar o defumadouro deles. O Cogu, do Círculo, quer levar a toca inteira embora por cima da serra — com filhote, no frio. E tem um Sableye rondando lá fora com uma ideia que ele não quis contar na minha frente, o que já me diz o quanto ela vale.', faz: { missao: ['passo', 1] } },
      espera: { fala: 'Fala com o Cascalho e com o Cogu, aqui dentro. E vai ver o acampamento com os próprios olhos, a leste. Eu só confio em plano de quem viu o inimigo comendo.' },
      decide: { fala: 'Você viu o acampamento. Viu as gaiolas. Viu as crianças deles também, eu sei que viu — todo mundo que volta de lá volta mais calado. Qual é o plano?',
        opcoes: [
          { t: '⚒ Queimar o defumadouro, com o Cascalho.', faz: { flag: ['cap2', 'passo-fogo', 'tome-jurou'], missao: ['passo', 'fim'], rep: { forja: 3, bosque: -1 }, dom: 'faisca' }, vai: 'fogo' },
          { t: '🌑 Esvaziar a despensa deles, com o Lasca.', se: { flag: 'lasca-plano' }, faz: { flag: ['cap2', 'passo-fome'], missao: ['passo', 'fim'], rep: { abismo: 3, bosque: -2 }, dinheiro: 900, dom: 'unha' }, vai: 'fome' },
          { t: '🐟 Mostrar a subida dos peixes ao chefe deles.', se: { flag: ['alfa-calmo', 'tome-ouviu'] }, faz: { flag: ['cap2', 'passo-peixe', 'tome-deve', 'lia-confia'], missao: ['passo', 'fim'], rep: { bosque: 2, forja: -1 }, dom: 'correnteza' }, vai: 'peixe' },
          { t: 'Ainda não sei.' }] },
      fogo: { fala: 'Foi uma fogueira bonita. Eles desceram a serra antes do sol. O chefe deles olhou pra trás uma vez só — e eu conheço aquele olhar, porque é o meu. A gente ganhou um inverno. Não ganhou mais que isso.' },
      fome: { fala: 'A despensa amanheceu vazia e eles levantaram acampamento em dois dias. As crianças foram no colo, quietas demais. O Sableye passou aqui e deixou a minha parte. Eu não quis. Fica você.' },
      peixe: { fala: 'Eu vi de longe. Você, o Alfa e um homem com a lança abaixada, olhando os peixes subirem a pedra. Ele tirou o chapéu. Eu não sei o que isso quer dizer entre eles. Entre nós, quer dizer trégua.' }
    } },

  cascalho: { nome: 'Sargento Cascalho', sprite: 75,
    falas: [
      { se: { flag: 'lanca-forja' }, no: 'calado' },
      { se: { item: 'lanca', sem: 'lanca-vendida' }, no: 'lanca' },
      { se: { flag: 'cap2' }, no: 'depois' },
      { se: { missao: ['passo', 1], sem: 'ouviu-cascalho' }, no: 'plano' },
      { no: 'padrao' }
    ],
    nos: {
      padrao: { fala: 'Pedra não negocia. Pedra cai.' },
      plano: { fala: 'Simples: o defumadouro é de madeira seca e gordura. Uma faísca no lugar certo e eles perdem a carne de um mês inteiro. Sem carne, sem acampamento. Eles descem a serra e a gente respira.',
        opcoes: [{ t: 'E se voltarem com mais gente?', vai: 'mais' }, { t: 'Entendi.', faz: { flag: 'ouviu-cascalho' } }] },
      mais: { fala: 'Aí a gente queima de novo. A Forja não tem medo de repetir serviço.', faz: { flag: 'ouviu-cascalho' } },
      lanca: { fala: 'Onde você arrumou… me dá isso aqui. Não. Fica aí. …Essa ponta tem a marca do martelo. É ferro <b>nosso</b>.', vai: 'lanca2' },
      lanca2: { fala: 'Eu não sei quem vendeu. Juro pelo forno que não sei. Mas alguém da Ordem armou a mão que feriu o Alfa do Passo — e eu passei um mês chamando os humanos de bicho.', faz: { flag: 'lanca-forja', missao: ['lanca', 'fim'], rep: { forja: -1 } } },
      calado: { fala: '…Eu vou levar isso pra Ferro-Fundo. Pessoalmente. Não conta pra Mãe Ursa ainda.' },
      depois: { fala: 'Feito está feito. Pedra não olha pra trás.' }
    } },

  cogu: { nome: 'Cogu', sprite: 286,
    falas: [{ se: { flag: 'cap2' }, no: 'depois' }, { se: { missao: ['passo', 1], sem: 'ouviu-cogu' }, no: 'plano' }, { no: 'padrao' }],
    nos: {
      padrao: { fala: 'Fala baixo. Esporo se assusta fácil.' },
      plano: { fala: 'Eu sei um caminho por cima da serra. Três dias, sem trilha, sem fumaça. A gente some e deixa o Passo pra eles. Ninguém luta, ninguém queima nada.',
        opcoes: [{ t: 'Com filhote, no frio?', vai: 'frio' }, { t: 'E quem não aguenta a subida?', vai: 'frio' }] },
      frio: { fala: '…Alguns não chegam. Eu sei. Fiz a conta muitas vezes, e ela sempre dá menos gente do que partiu. Mas dá <b>alguém</b>. O plano da pedra pode dar ninguém.', vai: 'frio2' },
      frio2: { fala: 'Tem outra coisa, se você tiver estômago pra subir. O Alfa do Passo guarda a garganta de cima, onde os peixes sobem a pedra na cheia. Peixe não acaba. Se os humanos tivessem peixe… Mas o Alfa está ferido e não deixa ninguém chegar. Nem a gente.', faz: { flag: 'ouviu-cogu' } },
      depois: { fala: 'Eu ainda sei o caminho por cima da serra. Guardei. Nunca se sabe.' }
    } },

  wooper: { nome: 'Wooper', sprite: 194,
    falas: [{ se: { falas: ['wooper', 1] }, no: 'fruta' }, { no: 'medo' }],
    nos: {
      medo: { fala: 'Eu não tenho medo. Eu só tô sentado em cima do meu medo, pra ele não sair.' },
      fruta: { fala: 'A moça de capa verde me deu uma fruta uma vez. Não conta pra Mãe Ursa.' }
    } },

  teddi: { nome: 'Teddiursa', sprite: 216,
    falas: [
      { se: { missao: ['gaiolas', 'fim'] }, no: 'obrigado' },
      { se: { missao: ['gaiolas', 0], flag: ['solto1', 'solto2'] }, no: 'voltou' },
      { se: { missao: ['gaiolas', 0] }, no: 'espera' },
      { no: 'pede' }
    ],
    nos: {
      pede: { fala: 'Minha irmã ficou numa gaiola lá no acampamento. Ela não chora, então eu choro pelas duas. Você… você é grande. Você abre gaiola?',
        opcoes: [{ t: 'Eu abro.', faz: { missao: ['gaiolas', 0] }, vai: 'como' }, { t: 'Não prometo.' }] },
      como: { fala: 'O vigia guarda a chave num baú, no mato alto atrás das barracas. Eu vi quando me escondi. Eu sou bom de me esconder. Só nisso.' },
      espera: { fala: 'A chave fica no mato alto, atrás das barracas deles. Tem mais gente presa além da minha irmã.' },
      voltou: { fala: 'ELA VOLTOU! E a coruja também! Toma, toma, é tudo o que eu juntei.', faz: { missao: ['gaiolas', 'fim'], rep: { bosque: 1 }, bag: [['oran-berry', 4], ['revive', 1]] } },
      obrigado: { fala: 'Minha irmã disse que você nem fez barulho. Eu quero ser assim quando crescer. Menos a parte de ser grande, que dá medo.' }
    } },

  lasca2: { nome: 'Lasca', sprite: 302,
    falas: [
      { se: { flag: 'cap2' }, no: 'depois' },
      { se: { item: 'lanca', sem: ['lanca-forja', 'lanca-vendida'] }, no: 'lanca' },
      { se: { missao: ['passo', 1], sem: 'lasca-plano' }, no: 'plano' },
      { se: { missao: ['passo', 2], sem: 'lasca-plano' }, no: 'plano' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Olha quem subiu a serra. Eu? Tô só admirando a paisagem. Linda fumaça.' },
      plano: { fala: 'A pedra quer fogo, o cogumelo quer fuga. Amadores. Escuta o profissional: eles guardam tudo o que defumam numa despensa só. Eu sei a hora em que o vigia cochila. A gente esvazia a casa numa noite, eles acordam sem inverno e vão embora andando. Ninguém morre.',
        opcoes: [{ t: 'E as crianças do acampamento?', vai: 'criancas' }, { t: 'E o que você ganha?', vai: 'ganha' }] },
      criancas: { fala: 'Passam fome, uai. Fome não mata em dois dias. …Não me olha assim. Eu disse que ninguém morre, não disse que ninguém sofre.', faz: { flag: 'lasca-plano' } },
      ganha: { fala: 'Carne defumada tem preço bom no Vau. Metade é sua. Tá vendo? Honestidade.', faz: { flag: 'lasca-plano' } },
      lanca: { fala: 'Deixa eu ver essa ponta… Hohoho. Marca do martelo. A Forja vendendo ferro pra quem caça Pokémon. Isso aqui não é lança, parceiro: é um segredo com cabo.',
        opcoes: [{ t: 'Vender o segredo (₽700).', faz: { flag: 'lanca-vendida', missao: ['lanca', 'fim'], dinheiro: 700, rep: { abismo: 2 } }, vai: 'vendida' }, { t: 'Fica comigo.' }] },
      vendida: { fala: 'A Corte agradece. A Forja, um dia, também vai — do jeito dela.' },
      depois: { fala: 'O Passo se resolveu. Eu? Já tô de olho rio abaixo. Tem uma cidade inteira apostando moeda em briga. Meu tipo de lugar.' }
    } },

  tome: { nome: 'Tomé Fumeiro', sprite: 'cacador',
    falas: [
      { se: { flag: 'passo-peixe' }, no: 'tregua' },
      { se: { flag: 'alfa-calmo', sem: 'tome-ouviu' }, no: 'peixes' },
      { se: { flag: 'tome-falou' }, no: 'denovo' },
      { no: 'primeiro' }
    ],
    nos: {
      primeiro: { fala: '…Um bicho entrando andando no acampamento, de cabeça erguida. Ou é muito burro, ou não é bicho de caça. Larga a lança, Zé. Deixa ele chegar.', vai: 'primeiro2' },
      primeiro2: { fala: 'Você me olha como se eu fosse o monstro da história. Eu sou o Tomé. Eu tinha quarenta cabeças de gado no litoral. A praga levou todas em uma lua. Tem trinta bocas neste acampamento, e nenhuma delas come capim.',
        opcoes: [{ t: '(Olhar para as gaiolas.)', vai: 'gaiolas' }, { t: '(Olhar para as crianças.)', vai: 'criancas' }] },
      gaiolas: { fala: 'É. Eu sei o que tem lá dentro, e sei que eles sabem o que os espera. Eu não durmo bem. Mas durmo com as crianças de barriga cheia, e escolho isso de novo amanhã.', faz: { flag: 'tome-falou', missao: ['passo', 2] } },
      criancas: { fala: 'Três são minhas. As outras são de quem a praga levou junto com o gado. Criança não escolhe o que o pai caça.', faz: { flag: 'tome-falou', missao: ['passo', 2] } },
      denovo: { fala: 'Ainda aqui? Se veio pedir pra eu soltar os das gaiolas, pede com comida na outra mão.' },
      peixes: { fala: 'A bicha lá de cima… parou de urrar. Três noites que ela não deixa ninguém dormir, e hoje, silêncio. Foi você?', vai: 'peixes2' },
      peixes2: { fala: '(Você risca na terra: a garganta do norte. Água. Peixe subindo a pedra.)<br><br>…Peixe. Na cheia. Lá em cima?', vai: 'peixes3' },
      peixes3: { fala: 'Se isso for verdade, eu não preciso de gaiola nenhuma. Me mostra. Se for armadilha, eu morro sabendo que tentei uma coisa decente uma vez.', faz: { flag: 'tome-ouviu' } },
      tregua: { fala: 'A gente pesca de manhã e a bicha pesca de tarde. Ninguém combinou; só aconteceu. As gaiolas viraram viveiro de peixe. Se um dia precisar de um humano que te deve, você sabe o nome.' }
    } },

  selma: { nome: 'Dona Selma, a curandeira', sprite: 'dama',
    falas: [
      { se: { missao: ['erva', 'fim'] }, no: 'depois' },
      { se: { missao: ['erva', 0], item: 'erva' }, no: 'trouxe' },
      { se: { missao: ['erva', 0] }, no: 'cade' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Não tenha medo, pequeno. Eu trato o que aparecer na minha porta, com pata ou com bota. O Tomé finge que não vê.', vai: 'oi2' },
      oi2: { fala: 'A bicha grande lá da gruta do norte — foi lança, eu ouvi os gritos. Ferida daquelas apodrece. Tem uma erva azul que cresce na encosta do Passo, perto da trilha de cima. Se você me trouxer, eu faço um unguento. Pra ela, não pra nós.',
        opcoes: [{ t: 'Eu trago.', faz: { missao: ['erva', 0] }, vai: 'vai' }, { t: '(Pedir um curativo — {custo}.)', faz: { cura: true } }, { t: 'Agora não.' }] },
      vai: { fala: 'Flor azul, miúda, rente ao chão. E não chega perto da bicha sem o unguento na boca: bicho ferido não reconhece favor.' },
      cade: { fala: 'Flor azul, encosta do Passo, perto da trilha de cima. Eu espero.' },
      trouxe: { fala: 'É essa. Me dá um instante… Pronto. Leva o unguento. Chega devagar, de lado, e deixa ela cheirar primeiro.', faz: { perde: 'erva', item: 'unguento', missao: ['erva', 'fim'] } },
      depois: { fala: 'Você voltou inteiro. Ela também, pelo que o vento conta. Senta, que eu olho essas patas.',
        opcoes: [{ t: '(Pedir um curativo — {custo}.)', faz: { cura: true } }, { t: 'Estou bem.' }] }
    } },

  tico: { nome: 'Tico', sprite: 'menino',
    falas: [{ se: { falas: ['tico', 1] }, no: 'tio' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Você é dos bons de comer ou dos bons de brincar? …Brincadeira! A vó Selma disse que não é pra falar isso.' },
      tio: { fala: 'Meu tio Tomé não é mau. Ele só tá com fome faz muito tempo.' }
    } },

  preso1: { nome: 'Teddiursa presa', sprite: 216,
    falas: [{ no: 'presa' }],
    nos: {
      presa: { fala: '…Você não é deles. Não faz barulho. O vigia dorme depois do almoço.',
        opcoes: [{ t: 'Abrir a gaiola.', se: { item: 'chave' }, faz: { flag: 'solto1' }, vai: 'livre' }, { t: 'Eu volto.' }] },
      livre: { fala: 'Meu irmão está na toca? Está chorando? Ele chora por nós dois. Eu vou — obrigada.' }
    } },
  preso2: { nome: 'Hoothoot preso', sprite: 163,
    falas: [{ no: 'preso' }],
    nos: {
      preso: { fala: 'Hu. Se abrir essa porta, eu juro que nunca mais reclamo de dormir de dia.',
        opcoes: [{ t: 'Abrir a gaiola.', se: { item: 'chave' }, faz: { flag: 'solto2' }, vai: 'livre' }, { t: 'Eu volto.' }] },
      livre: { fala: 'Hu-hu! Ar! Céu! Reclamação cancelada!' }
    } },
  preso3: { nome: 'Stantler velho', sprite: 234,
    falas: [{ se: { flag: 'ouviu-velho' }, no: 'fica' }, { no: 'velho' }],
    nos: {
      velho: { fala: 'Guarda a chave, filho. Eu estou velho, a perna não presta, e aqui a moça de vestido me dá unguento. Lá fora eu sou jantar de qualquer um.', vai: 'velho2' },
      velho2: { fala: 'Eu sei o que eu sou aqui dentro. Mas ninguém me perguntou o que eu era lá fora. Deixa a porta como está.', faz: { flag: 'ouviu-velho' } },
      fica: { fala: 'Deixa a porta como está. E não me olha com essa pena — eu escolhi, que é mais do que muita gente solta consegue dizer.' }
    } },

  alfa2: { nome: 'O Alfa do Passo', sprite: '@alfa',
    falas: [{ se: { flag: 'alfa-calmo' }, no: 'calmo' }, { no: 'ferido' }],
    nos: {
      ferido: { fala: '(O Alfa rosna baixo, sem se levantar. O cabo da lança treme a cada respiração. Você está com o unguento na boca, como a curandeira mandou.)',
        opcoes: [{ t: '(Chegar devagar, de lado.)', vai: 'devagar' }, { t: '(Recuar.)' }] },
      devagar: { fala: '(Ele deixa. Você puxa a lança de uma vez só — o urro sacode a gruta — e espalha o unguento na ferida. Quando termina, o Alfa encosta a testa na sua, um instante. Depois olha pra garganta do norte, onde a água desce.)',
        faz: { flag: ['alfa-calmo', 'venceu:alfa2', 'pegou-lanca'], item: 'lanca', perde: 'unguento', missao: ['lanca', 0], rep: { bosque: 1 } } },
      calmo: { fala: '(O Alfa dorme de lado, respirando fundo. Ao seu passo, abre um olho, reconhece, e fecha de novo.)' }
    } },

  /* ===== capítulo 3 ===== */
  lia3: { nome: 'Lia, a patrulheira', sprite: 'patrulheira',
    falas: [
      { se: { flag: 'vau-tirou' }, no: 'tirou' },
      { se: { missao: ['vau', 3], flag: 'lia-confia' }, no: 'coracao' },
      { se: { flag: 'lia-confia' }, no: 'amiga' },
      { no: 'longe' }
    ],
    nos: {
      longe: { fala: 'Você de novo. Eu fico deste lado do rio, você do outro. Combinado é combinado.' },
      amiga: { fala: 'Você chegou ao Vau. Então escuta, antes de entrar: lá dentro ninguém te caça — te <b>admira</b>. É pior. Quem luta bem na arena come bem, dorme em palha limpa, tem nome pintado em tábua. Tem Pokémon lá que não trocaria aquilo por floresta nenhuma.', vai: 'amiga2' },
      amiga2: { fala: 'Eu cresci ali. Tive um parceiro de arena. Ele morreu velho, gordo e feliz, e eu até hoje não sei se fiz certo. É por isso que eu corto laço: laço não pergunta.' },
      coracao: { fala: 'Isso que você carrega… eu sinto daqui. A arena inteira foi construída em cima disso, não foi? Sempre achei que as lutas eram boas demais.', vai: 'coracao2' },
      coracao2: { fala: 'Se você quiser tirar isso da cidade, eu sei onde o rio entra na pedra, a meio dia daqui. Enterrado lá, ninguém acha. O Vau vai murchar — a arena é tudo o que ele tem. Eu vou ser a filha da cidade que matou a cidade. Faço mesmo assim, se você pedir.',
        opcoes: [
          { t: '💧 Tirar o Coração do Vau, com a Lia.', faz: { perde: 'coracao2', flag: ['cap3', 'vau-tirou'], missao: ['vau', 'fim'], rep: { bosque: 2, abismo: -1 }, dom: 'eco' }, vai: 'tirou' },
          { t: 'Ainda vou pensar.' }] },
      tirou: { fala: 'Está enterrado. O rio cobre. …Fecharam a arena, sabia? Disseram que os bichos “perderam a vontade”. Passei em frente à casa do Mestre e ele estava na porta, olhando pra mim. Não disse nada. Era pior se dissesse.' }
    } },

  bia: { nome: 'Bia', sprite: 'menina',
    falas: [
      { se: { missao: ['bia', 'fim'], flag: 'bia-juntos' }, no: 'juntas' },
      { se: { missao: ['bia', 'fim'] }, no: 'sozinha' },
      { se: { missao: ['bia', 0], flag: 'ouviu-la' }, no: 'decide' },
      { se: { missao: ['bia', 0] }, no: 'espera' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Você não é daqui. Dá pra ver: os daqui já chegam olhando pra arena. Eu sou a Bia. Esta é a Lã, minha parceira. A gente lutava lá toda feira.', vai: 'oi2' },
      oi2: { fala: 'Eu parei. Na última luta ela ganhou, e eu vi o outro sair carregado, e a Lã estava… contente. Eu não consegui ficar contente junto. Agora ela não fala comigo. Você entende a língua dela. Pergunta o que ela quer?',
        opcoes: [{ t: 'Eu pergunto.', faz: { missao: ['bia', 0] }, vai: 'obrigada' }, { t: 'Isso é entre vocês duas.' }] },
      obrigada: { fala: 'Ela está bem aí do lado. Fingindo que não ouve.' },
      espera: { fala: 'Pergunta pra ela. Eu aguento a resposta. Acho.' },
      decide: { fala: 'E aí? O que ela disse? …Ela <b>quer</b> lutar. Ela gosta. E eu, que achei que estava salvando ela.',
        opcoes: [
          { t: 'Lutem juntas — do jeito de vocês, com a regra de vocês.', faz: { flag: 'bia-juntos', missao: ['bia', 'fim'], rep: { forja: 1 }, bag: [['sitrus-berry', 2]] }, vai: 'juntas' },
          { t: 'Deixa ela ir lutar com outra pessoa.', faz: { missao: ['bia', 'fim'], rep: { abismo: 1 } }, vai: 'sozinha' },
          { t: 'Eu não decido isso por vocês.' }] },
      juntas: { fala: 'A gente combinou: ela luta, e eu paro a luta quando <b>eu</b> achar que deu. Ela reclamou. Depois lambeu minha mão. Acho que é um sim.' },
      sozinha: { fala: 'Ela foi com o Nico. Luta toda feira e ganha quase sempre. Eu vou assistir, lá do fundo. Ela finge que não me vê, e eu finjo que não choro.' }
    } },

  la: { nome: 'Lã', sprite: 180,
    falas: [{ se: { missao: ['bia', 'fim'] }, no: 'fim' }, { se: { missao: ['bia', 0] }, no: 'fala' }, { no: 'muda' }],
    nos: {
      muda: { fala: '(A Flaaffy olha pra você, depois pra menina, e vira o rosto.)' },
      fala: { fala: 'Ela te mandou perguntar, né. Então leva a resposta: eu <b>gosto</b>. Do barulho, da areia, de ganhar. Ninguém me laçou — eu segui ela até em casa porque ela dividia o pão. E agora ela me olha como se eu fosse uma coisa quebrada.', vai: 'fala2' },
      fala2: { fala: 'Eu não quero ser salva. Eu quero que ela torça por mim de novo.', faz: { flag: 'ouviu-la' } },
      fim: { fala: '(A Flaaffy estala de eletricidade, satisfeita com alguma coisa que não vai te contar.)' }
    } },

  kiko: { nome: 'Kiko, o porteiro', sprite: 58,
    falas: [{ se: { flag: 'cap3' }, no: 'saida' }, { se: { missao: ['vau', 'nao'] }, no: 'oi' }, { no: 'denovo' }],
    nos: {
      oi: { fala: 'Alto! …Ah, é bicho. Pode passar, bicho não paga pedágio. Eu sou o Kiko, eu guardo o portão. O Mestre me dá osso, eu dou alarme. É um bom negócio. Ninguém me pediu opinião sobre a arena, então eu não tenho.', faz: { missao: ['vau', 0] } },
      denovo: { fala: 'O Mestre Baltazar fica na praça, perto do poço. A arena é a casa de pedra lá em cima, com a placa da espada. E eu fico aqui, que é o meu serviço.' },
      saida: { fala: 'Vai seguir o rio? Pra baixo daqui é charco, e do charco eu só conheço o cheiro. Boa sorte, bicho.',
        opcoes: [{ t: '🧭 Seguir viagem rio abaixo.', faz: { viajar: true } }, { t: 'Ainda não.' }] }
    } },

  baltazar: { nome: 'Mestre Baltazar', sprite: 'velho',
    falas: [
      { se: { flag: 'vau-deixou' }, no: 'deixou' }, { se: { flag: 'vau-tirou' }, no: 'dTirou' }, { se: { flag: 'vau-ordem' }, no: 'dOrdem' },
      { se: { missao: ['vau', 3] }, no: 'coracao' },
      { se: { missao: ['ferro', 0] }, no: 'ferro' },
      { se: { missao: ['vau', 2] }, no: 'desce' },
      { se: { missao: ['vau', 1] }, no: 'desafio' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Um forasteiro de quatro patas, andando solto e de cabeça erguida. Ou você fugiu de alguém, ou ninguém nunca conseguiu te pegar. Eu sou o Baltazar. Eu cuido da arena, e a arena cuida do Vau.', vai: 'oi2' },
      oi2: { fala: 'Antes de me julgar: há vinte anos isto aqui era lama e febre. Aí descobriram que nesta praça os bichos lutam como em lugar nenhum — mais fortes, mais bonitos. Vem gente de três rios pra ver. Cada moeda desta cidade passou por aquela porta.',
        opcoes: [{ t: '(Olhar para a arena.)', faz: { missao: ['vau', 1] }, vai: 'regra' }, { t: '(Virar as costas.)' }] },
      regra: { fala: 'Quer ver por dentro? A casa é aberta. E se quiser descer ao porão, onde fica a Fera que abre as festas, a regra é a de todo mundo: vence os dois desafiantes da tarde. Bicho solto também pode. Nunca aconteceu — mas pode.' },
      desafio: { fala: 'Dois desafiantes, lá dentro, um de cada lado do picadeiro. Vence os dois e o guarda te deixa descer.' },
      desce: { fala: 'Você venceu os dois. Sem dono. A arquibancada não sabia se aplaudia ou se corria. Desce — a Fera é a alma desta casa. Só não chega perto demais da grade.' },
      ferro: { fala: 'A grade do porão? Ferro de primeira, não enferruja. …De quem eu compro? Ora. De quem faz o melhor ferro que existe. Vêm de noite, não dão nome, e têm um martelo marcado em tudo. Pensei que você soubesse — eles são dos seus.', faz: { missao: ['ferro', 'fim'], flag: 'forja-vende', rep: { forja: -1 } } },
      coracao: { fala: '…Então era isso, debaixo do alicerce. Vinte anos eu achei que era a areia, o ar, a minha mão boa pra escolher lutador. Era uma pedra.', vai: 'coracao2' },
      coracao2: { fala: 'Devolve. Eu te peço, não mando. Sem isso a arena fecha, e sem a arena tem duzentas pessoas aqui que voltam pra lama. Os bichos que lutam aqui comem melhor que eu. Eu sei o que você pensa de nós. Pensa também no que vem depois.',
        opcoes: [
          { t: '🏟 Devolver o Coração ao alicerce.', faz: { perde: 'coracao2', flag: ['cap3', 'vau-deixou'], missao: ['vau', 'fim'], rep: { forja: 1, bosque: -2 }, dinheiro: 1200, dom: 'torcida' }, vai: 'deixou' },
          { t: 'Ainda não decidi.' }] },
      deixou: { fala: 'Está de volta no lugar. Hoje à noite tem luta, e você tem lugar na primeira fila pelo resto da vida. …Eu sei que não era isso que você queria ouvir de um humano. É o que eu tenho.' },
      dTirou: { fala: 'A arena fechou. Metade da cidade foi embora no primeiro mês. Eu fico. Alguém tem que apagar as tochas.' },
      dOrdem: { fala: 'Vieram uns sujeitos de olho de pedra preciosa e disseram que a arena agora tem sócio. As lutas continuam. O dinheiro é que mudou de bolso.' }
    } },

  lasca3: { nome: 'Lasca', sprite: 302,
    falas: [{ se: { flag: 'vau-ordem' }, no: 'socio' }, { se: { flag: 'cap3' }, no: 'tarde' }, { se: { missao: ['vau', 3] }, no: 'coracao' }, { no: 'apostas' }],
    nos: {
      apostas: { fala: 'Aposta no vermelho ou no azul? Eu não torço, eu cobro. …Ah, é você. Tá vendo esta cidade? Uma arena em cima de uma Fonte. Os humanos não sabem o que têm no porão. A Corte sabe. Só não tinha como descer.' },
      coracao: { fala: 'Você desceu. Você <b>subiu</b> com ele. Eu sabia que valia a pena te seguir por três mapas.', vai: 'coracao2' },
      coracao2: { fala: 'Proposta da Corte, e dessa vez é séria: a pedra volta pro lugar, a arena continua, e quem cuida do alicerce passa a ser a gente. Os humanos lutam, a cidade come, e a Corte volta a guardar um Coração — o primeiro em onze anos. Todo mundo ganha. Principalmente eu.',
        opcoes: [
          { t: '🌑 Entregar o alicerce à Corte.', faz: { perde: 'coracao2', flag: ['cap3', 'vau-ordem'], missao: ['vau', 'fim'], rep: { abismo: 3, forja: -1, bosque: -1 }, dinheiro: 2000, dom: 'banca' }, vai: 'socio' },
          { t: 'Não.' }] },
      socio: { fala: 'Sócio. Gostei da palavra. A arena nunca lucrou tanto, e ninguém lá em cima sabe por quê.' },
      tarde: { fala: 'Oportunidade é que nem laço de criança: passou, desarmou.' }
    } },

  nico3: { nome: 'Nico', sprite: 'menino',
    falas: [{ se: { flag: 'bia-juntos' }, no: 'inveja' }, { se: { falas: ['nico3', 1] }, no: 'pao' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'VOCÊ! O da estrada! Eu sabia que você vinha, eu sabia! Olha: sem laço, tá vendo? Mão vazia. …Luta comigo na arena. Do <b>meu</b> lado. Eu juro que divido o pão meio a meio.',
        opcoes: [{ t: '(Balançar a cabeça: não.)', vai: 'nao' }, { t: '(Ficar olhando.)', vai: 'olha' }] },
      nao: { fala: 'Tá. Eu entendo. Eu armei laço pra você, né. Eu também não faria parceria comigo.' },
      olha: { fala: 'Você não disse não! Isso é quase um sim! Vou guardar pão todo dia, pra quando você mudar de ideia.' },
      pao: { fala: 'Eu guardei pão ontem. Hoje também. Não tô te pressionando. Só tô avisando que tem pão.' },
      inveja: { fala: 'A Bia e a Lã voltaram a lutar. Com <b>regra</b>. A Bia para a luta quando quer. Achei frescura… mas a Lã está ganhando mais do que antes. Não conta que eu disse.' }
    } },

  campeao: { nome: 'O Campeão', sprite: 68,
    falas: [{ se: { flag: 'campeao-ouviu' }, no: 'denovo' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Solto. Sem coleira, sem tábua com nome. Eu sei o que você veio dizer: “irmão, eles te prenderam”. Todo bicho do mato que entra aqui diz isso.', vai: 'oi2' },
      oi2: { fala: 'Ninguém me prende. Eu como três vezes por dia. Durmo em palha trocada. Duzentas vozes gritam meu nome, e criança pinta minha cara no muro. No mato eu era só mais um com fome. Me diz: de qual liberdade eu estou sentindo falta?',
        opcoes: [
          { t: '(Não responder. Ele tem direito à pergunta.)', faz: { flag: ['campeao-ouviu', 'campeao-respeito'] }, vai: 'respeito' },
          { t: '(Olhar para a escada do porão.)', faz: { flag: 'campeao-ouviu' }, vai: 'porao' }] },
      respeito: { fala: '…Hm. Você é o primeiro que não respondeu. Fica com isso: se um dia precisar de quatro braços, pergunta por mim. Eu escolho as minhas lutas.' },
      porao: { fala: 'A Fera. É. Ela não escolheu. Eu sei a diferença — não precisa me ensinar. Eu só não sei o que fazer com ela, então luto mais alto, que é pra não ouvir.' },
      denovo: { fala: 'Eu luto às feiras. O resto do tempo eu descanso, que é um luxo que o mato nunca me deu.' }
    } },

  guardaArena: { nome: 'Guarda da escada', sprite: 'soldado',
    falas: [{ se: { flag: ['venceu:desafiante1', 'venceu:desafiante2'] }, no: 'passa' }, { no: 'barra' }],
    nos: {
      barra: { fala: 'Porão é pra quem venceu os dois desafiantes da tarde. Regra do Mestre. Vale pra gente e, pelo visto, pra bicho.' },
      passa: { fala: 'Venceu os dois. Regra é regra. Desce — e não encosta na grade.', faz: { flag: 'porao-aberto', missao: ['vau', 2] } }
    } },

  fera: { nome: 'A Fera', sprite: '@alfa',
    falas: [{ no: 'cansada' }],
    nos: {
      cansada: { fala: '(A Fera recuou pro fundo da cela, ofegante. A tranca cedeu na luta: a porta está aberta atrás de você. Ela olha pra escada, depois pra você, e não se mexe. Faz tempo demais que porta aberta é truque.)',
        opcoes: [
          { t: '(Sair da frente da porta.)', faz: { flag: ['fera-decidida', 'fera-livre'], rep: { bosque: 2 } }, vai: 'livre' },
          { t: '(Fechar a grade de novo.)', faz: { flag: 'fera-decidida', rep: { forja: 1 } }, vai: 'presa' }] },
      livre: { fala: '(Ela passa por você devagar, raspando o ombro no seu. Lá em cima alguém grita. Depois, mais nada: só o barulho do rio, e um par de pegadas indo embora.)' },
      presa: { fala: '(A tranca range. A Fera deita de costas pra você. Lá em cima, a festa de sábado continua tendo quem a abra.)' }
    } }
};
