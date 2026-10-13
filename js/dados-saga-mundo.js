/* ============ ⚔ Saga — o CONTEÚDO do mundo (os 10 capítulos) ============
   Capítulos, mapas, personagens, missões, itens-chave, dons e facções. Dado puro, SEM imports.
   É a camada de FÁBRICA do que o 🌍 Editor de mundo edita: o ⬇ Gerar arquivo do editor produz ESTE arquivo
   inteiro (aí os comentários somem — passa a ser conteúdo gerado, e tudo bem). Como um mapa, uma condição e um
   efeito são escritos está no cabeçalho de `dados-saga.js`; o roteiro, em `docs/saga-historia.md`.
   Quem importa, importa de `dados-saga.js`, que reexporta tudo daqui. */

export const FACCOES = {
  forja: { nome: 'Ordem da Forja', emoji: '⚒' },
  bosque: { nome: 'Círculo do Bosque', emoji: '🌿' },
  abismo: { nome: 'Corte do Abismo', emoji: '🌑' }
};

/* Capítulos: agrupam os mapas (`mapa.cap`) e dão o título que aparece na tela. A regra do roteiro é um capítulo
   por rota da Gen: capítulo 1 = 1ª rota… capítulo 10 = a rota final, a dos lendários. */
export const CAPITULOS = [
  { id: 'cap1', n: 1, nome: 'A Fonte Calada', regiao: 'Vale do Orvalho', rota: 0 },
  { id: 'cap2', n: 2, nome: 'O Passo dos Laços', regiao: 'Serra do Fumo', rota: 1 },
  { id: 'cap3', n: 3, nome: 'A Cidade das Arenas', regiao: 'Vau das Moedas', rota: 2 },
  { id: 'cap4', n: 4, nome: 'O Charco dos Esquecidos', regiao: 'Charco dos Esquecidos', rota: 3 },
  { id: 'cap5', n: 5, nome: 'Ferro-Fundo', regiao: 'Minas da Forja', rota: 4 },
  { id: 'cap6', n: 6, nome: 'O Bosque que Anda', regiao: 'Trilha da Marcha', rota: 5 },
  { id: 'cap7', n: 7, nome: 'A Ponte Partida', regiao: 'Rio Grande', rota: 6 },
  { id: 'cap8', n: 8, nome: 'O Deserto de Sal', regiao: 'Mar Seco', rota: 7 },
  { id: 'cap9', n: 9, nome: 'O Degelo', regiao: 'Serra do Degelo', rota: 8 },
  { id: 'cap10', n: 10, nome: 'A Nascente', regiao: 'Vale da Nascente', rota: 9 }
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
  coracao2: { nome: 'Segundo Coração', emoji: '💠', desc: 'Estava no alicerce da arena. Também puxa — na mesma direção do primeiro.' },
  livro: { nome: 'Livro-caixa da Forja', emoji: '📕', desc: 'Onze anos de colunas: lascas de Coração que entram, moedas com cara de rei que saem.' },
  gema: { nome: 'Pedra de Nascença', emoji: '💎', desc: 'Do tamanho de um olho, ainda morna. Um Sableye sem a dele não entra em casa.' },
  muda: { nome: 'Muda de Árvore Andarilha', emoji: '🌱', desc: 'Com a terra junto. Daqui a vinte anos faz sombra.' },
  caixa: { nome: 'Caixa de Remédios', emoji: '🧰', desc: 'Ervas, ataduras e um vidro que não se deve cheirar. Tem o nome da Selma na tampa.' },
  no: { nome: 'Nó de Pano', emoji: '🪢', desc: 'Duas pontas, gastas por mãos diferentes. Não esfarelou em todo esse tempo. Alguma coisa não deixou.' }
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
  banca: { nome: 'Olho da Banca', emoji: '🎲', desc: 'Causa 4% a mais, e um quinto a menos de encontros.', dano: 1.04, encontro: 0.8 },
  tinta: { nome: 'Tinta de Livro-Caixa', emoji: '📕', desc: 'Seus golpes causam 10% a mais em inimigo em Ruína.', ruina: 1.1 },
  tempera: { nome: 'Têmpera Lenta', emoji: '🗝', desc: 'Você recebe 5% a menos de dano.', defesa: 0.95 },
  cinza: { nome: 'Cinza Fria', emoji: '🕯', desc: 'Um quarto a menos de encontros no mato alto, e 3% a mais de dano.', encontro: 0.75, dano: 1.03 },
  gume: { nome: 'Gume de Ferro-Fundo', emoji: '⚔', desc: 'Seus golpes causam 6% a mais.', dano: 1.06 },
  greve: { nome: 'Braço Cruzado', emoji: '✊', desc: 'Você recebe 6% a menos de dano.', defesa: 0.94 },
  escombro: { nome: 'Onde o Golpe Cai', emoji: '🔨', desc: 'Seus golpes causam 12% a mais em inimigo em Ruína.', ruina: 1.12 },
  semente: { nome: 'Semente Andarilha', emoji: '🍃', desc: 'Um quinto a menos de encontros no mato alto, e você recebe 3% a menos de dano.', encontro: 0.8, defesa: 0.97 },
  raiz: { nome: 'Raiz Funda', emoji: '🌳', desc: 'Você recebe 6% a menos de dano.', defesa: 0.94 },
  enxerto: { nome: 'Enxerto', emoji: '✂', desc: 'Causa 4% a mais, e outros 5% em inimigo em Ruína.', dano: 1.04, ruina: 1.05 },
  pilar: { nome: 'Pilar da Ponte', emoji: '🌉', desc: 'Você recebe 5% a menos de dano.', defesa: 0.95 },
  margem: { nome: 'Facão do Tomé', emoji: '🪓', desc: 'Seus golpes causam 5% a mais.', dano: 1.05 },
  pedagio: { nome: 'Passe Livre', emoji: '🧾', desc: 'Causa 3% a mais e recebe 3% a menos.', dano: 1.03, defesa: 0.97 },
  memoria: { nome: 'Memória do Sal', emoji: '📜', desc: 'Seus golpes causam 10% a mais em inimigo em Ruína.', ruina: 1.1 },
  silencio: { nome: 'Silêncio de Sal', emoji: '🤐', desc: 'Um terço a menos de encontros no mato alto.', encontro: 0.7 },
  preco: { nome: 'Preço da Notícia', emoji: '🪙', desc: 'Seus golpes causam 4% a mais.', dano: 1.04 },
  vanguarda: { nome: 'Ponta de Ferro', emoji: '⚒', desc: 'Seus golpes causam 5% a mais.', dano: 1.05 },
  seiva: { nome: 'Seiva Fria', emoji: '🌿', desc: 'Você recebe 5% a menos de dano.', defesa: 0.95 },
  vigia: { nome: 'Olho no Gelo', emoji: '🌑', desc: 'Seus golpes causam 10% a mais em inimigo em Ruína.', ruina: 1.1 },
  sozinho: { nome: 'Passo Próprio', emoji: '🐾', desc: 'Causa 3% a mais e recebe 3% a menos.', dano: 1.03, defesa: 0.97 }
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
  ] },
  charco: { nome: 'O Charco dos Esquecidos', etapas: [
    'Siga as tábuas pra oeste, em volta do poço grande do brejal, até a Corte do Abismo.',
    'A Regente quer o livro-caixa da Forja: ele fica na Casa de Contas do dique, a nordeste do brejal — depois da escolta e de uma porta trancada.',
    'O livro-caixa está com você. A Regente quer lê-lo em praça; a Dona Chaveira, no dique, quer levá-lo à Brasa; e a Dama Véu sabe um jeito de ninguém ficar com ele.'
  ] },
  gema: { nome: 'Pedra de nascença', etapas: [
    'Tome de volta a pedra do Lasca: um bando a levou pro mato alto, no sul do brejal.'
  ] },
  toque: { nome: 'O último toque', secreta: true, etapas: [
    'O caderno do sineiro fala de um som que só ele ouvia. Quem foi aprendiz dele saberia ler o resto.'
  ] },
  fundo: { nome: 'Ferro-Fundo', etapas: [
    'Entre em Ferro-Fundo e ouça os dois lados: o Mestre-Forjador, na Bigorna-Mãe, e o Tatu, delegado da greve, na beira do canal de lava.',
    'O piquete liberou a descida. A Galeria das Lascas fica no fundo da cidade, ao norte.',
    'Você viu o que os fornos queimam. O Tatu quer parar tudo, o Mestre quer as armas prontas, e a Brasa quer a galeria no chão.'
  ] },
  faisca: { nome: 'Buscar os nove', etapas: [
    'Ache o Faísca, um Aron pequeno que desceu sozinho à Galeria das Lascas, e leve notícia à Mãe Bigorna.'
  ] },
  humano: { nome: 'Mão de gente', secreta: true, etapas: [
    'O ferreiro escondido faz as peças finas de Ferro-Fundo e nunca perguntou pra onde elas vão. Você sabe a resposta.'
  ] },
  anda: { nome: 'O Bosque que Anda', etapas: [
    'Siga o rastro das árvores pela trilha do norte, atravesse a Marcha e ache a Mãe Meganium na clareira — depois do Pastor.',
    'Ouça o Pai Torterra, na Clareira das Mães, e volte à Mãe Meganium.'
  ] },
  muda: { nome: 'Sombra pra daqui a vinte anos', etapas: [
    'Ache uma muda perto do rastro das árvores, na Marcha, e leve ao Seu Roque, na Aldeia dos Tocos.'
  ] },
  fica: { nome: 'Quem fica', secreta: true, etapas: [
    'O Vô Carvalho pede licença pra se deitar. Só uma Mãe do Círculo pode dar.'
  ] },
  travessia: { nome: 'A Ponte Partida', etapas: [
    'O vão do meio da ponte só se fecha com o que mora entre os pilares fora do caminho. A descida fica na margem, a leste da cabeceira.',
    'O vão fechou. Atravesse a ponte, passe pela vanguarda e encare quem comanda o bando de guerra, na outra margem.',
    'O bando perdeu o capitão. Decida o destino da ponte: a Lia quer mantê-la de pé; o Tomé, na outra margem, quer vê-la cair; e o Capataz da Forja oferece muralha e pedágio.'
  ] },
  remedio: { nome: 'Carga parada', etapas: [
    'A caixa de remédios da Selma ficou na ponte, do lado de lá do vão. Leve de volta a ela, na cabeceira.'
  ] },
  sozinho: { nome: 'Quem atravessou sozinho', secreta: true, etapas: [
    'Um menino se esconde entre os pilares, com medo dos dois lados da ponte.'
  ] },
  sal: { nome: 'O Deserto de Sal', etapas: [
    'Cruze a salina até a cidade branca, a leste.',
    'A Irmã Dalva copia os desenhos das paredes. O fim da história está no leito da Fonte Morta: a descida fica no meio da praça.',
    'Você viu os Primeiros Laços e entendeu a Cheia. A Irmã Dalva pode espalhar a história ou guardá-la — e há um Absol disposto a pagar por ela.'
  ] },
  gole: { nome: 'Um gole', etapas: [
    'Tire o bando de cima do poço doce da salina, a leste da tenda da caravana, e avise o Grão.'
  ] },
  no: { nome: 'O último nó', secreta: true, etapas: [
    'Falta um nó — o que não é desenho. Alguém o guardou onde parede parece parede, no leito da Fonte Morta.'
  ] },
  degelo: { nome: 'O Degelo', etapas: [
    'Fale com quem subiu até o Acampamento do Degelo — cada ordem armou a sua tenda — e volte ao Tio do Poço, no fogo do meio.',
    'Escolha quem lidera a subida: fale com quem você quer na ponta, ou diga ao Tio do Poço que sobe por conta própria.',
    'Atravesse a Geleira Rachada, ao norte do acampamento, e passe pelo que guarda a Garganta do Degelo.'
  ] },
  pingo: { nome: 'Pegadas pequenas', etapas: [
    'O Pingo, um Cubchoo de nariz escorrendo, sumiu na Geleira Rachada. Ele gosta de gelo liso. Leve notícia à Dona Nevasca.'
  ] },
  gelo: { nome: 'O que o gelo guardou', secreta: true, etapas: [
    'O Carteiro achou uma carta presa no gelo, perto de um arvoredo a oeste da trilha da geleira. Quem a escreveu não desceu.'
  ] },
  nascente: { nome: 'A Nascente', etapas: [
    'Atravesse o Limiar: quem subiu com você espera perto da água. A gruta da Nascente fica ao norte.',
    'Faça os Antigos pararem. Depois, diga a eles o que a terra faz com a primeira fonte.'
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
      'T...............=...........~~~~~T',
      'T..f.....""""...=....f......~~~~~T',
      'T........""""""..=...........~~~~T',
      'TTTTTTTTTTTTTTTTJTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      V: { porta: ['beira', 'V'], como: '=' },
      J: [{ se: { sem: 'cap3' }, placa: 'O portão do sul, que dá pro charco. Trancado: enquanto a arena não se resolver, o Mestre não deixa ninguém descer o rio.', como: '=' },
          { porta: ['brejal', 'J'], como: '=' }],
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
  },

  /* ================= CAPÍTULO 4 — o Charco dos Esquecidos ================= */
  brejal: {
    cap: 'cap4', nome: 'Brejal das Tábuas', desc: 'Quem pisa fora da tábua, o brejo não devolve.', rota: 3, chao: '.', tema: 'charco',
    grade: [
      'TTTTTTTTTTTTTTJTTTTTTTTTTTTTTT',
      'T....~~~~.....=...^^^^^^^^^^^T',
      'T.""..~~~~....=...^.hhh.....^T',
      'T""""..~~~..Q.=...^.hhh.....^T',
      'T.""...~~~....=...^.hDh..R..^T',
      'T.....~~~~....=...^..=...bb.^T',
      'T....~~~~~....====E===.K.bb.^T',
      'T....~~~~.....=...^.........^T',
      'T.....~~......=...^^^^^^^^^^^T',
      'T.............=..............T',
      'T..bbbbbbbbbb.===============F',
      'T..b~~~~~~~~b.=..............T',
      'Cbbb~~~~~~~~b==....""""".....T',
      'T...~~~~~~~~......"""""""....T',
      'T....~~~~~~........"""""...~~T',
      'T.......................~~~~~T',
      'T..""""......S......~~~~~~~~~T',
      'T.""""""...........~~~~~~~~~~T',
      'T..""""..G.....TtT..~~~~~~~~~T',
      'T..............T.T...~~~~~~~~T',
      'T..............T9T....~~~~~~~T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      J: { porta: ['vau', 'J'], como: '=' },
      C: { porta: ['corte', 'C'], como: 'b' },
      '9': { porta: ['palafita', '9'], como: 'T' },   // atrás da árvore falsa do arvoredo: a porta também se veste de árvore
      D: [{ se: { sem: 'chave-dique' }, placa: 'A Casa de Contas do dique. Porta de ferro, três trancas, e um martelo marcado a fogo no batente. Trancada.', prop: 'casaPedra' },
          { porta: ['galeria', 'D'], prop: 'casaPedra' }],
      F: [{ se: { sem: 'cap4' }, placa: 'A estrada do dique sobe a ladeira, rumo à fumaça de Ferro-Fundo. Mas o que você veio buscar no charco ainda não se resolveu.', como: '=' },
          { porta: ['ladeira', 'F'], como: '=' }],
      Q: { npc: 'barqueiro' }, K: { npc: 'chaveira' }, R: { npc: 'aurelio' },
      E: { como: '=', inimigo: { id: 'escolta', tipo: 'treinador', sprite: 'soldado', fala: 'Dois humanos de armadura barram a estrada do dique, com bichos de guerra na coleira curta.<br><br>— Alto. Daqui pra dentro é carga do Rei. Solta os cães, Brito.' } },
      S: { inimigo: { id: 'saqueadores', tipo: 'bando', fala: 'Quatro vultos repartem alguma coisa no mato alto. Um deles segura contra a luz uma pedrinha que brilha.' } },
      G: { se: { flag: 'venceu:saqueadores' }, bau: 'gema', arte: 'bau2', texto: 'Na pressa de fugir, largaram o que estavam repartindo: uma pedra lapidada, do tamanho de um olho, ainda morna.', faz: { item: 'gema' } }
    }
  },
  corte: {
    cap: 'cap4', nome: 'Corte Submersa', desc: 'Casas em cima da água, e uma chama pequena pra cada um que chegou expulso.', rota: 3, chao: '.', tema: 'charco', pele: { c: { prop: 'casaVelha' } },
    grade: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T~~~~~~~~~~~~~~~~~~~~~~~~~~~~T',
      'T~~..hhh..~~~~..hhh..~~~~~~~~T',
      'T~~..hhh..~~~~..hhh..~~~~~~~~T',
      'T~~..hch..~~~~..hch..~~~~~~~~T',
      'T~~...N...bbbb...P....~~~~~~~T',
      'T~~.......~~~~........~~~~~~~T',
      'T~~~b~~~~~~~~~~b~~~~~~~~~~~~~T',
      'T~~~b~~~~~~~~~~b~~~~~~~~~~~~~T',
      'T~..........V...........bbbbbC',
      'T~.....f........W.......~~~~~T',
      'T~....R.....L...........~~~~~T',
      'T~......................~~~~~T',
      'T~~~b~~~~~~~~~~b~~~~~~~~~~~~~T',
      'T~~..hhh..~~~~..hhh..~~~~~~~~T',
      'T~~..hhh..~~~~..hhh..~~~~~~~~T',
      'T~~..hch..~~~~..hch..~~~~~~~~T',
      'T~~...I....bbb...M....~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~~~~~~~~~T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      C: { porta: ['brejal', 'C'], como: 'b' },
      N: { npc: 'regente' }, P: { npc: 'pressagio' }, V: { npc: 'veu4' }, R: { npc: 'pavio' }, L: { npc: 'lasca4' }, I: { npc: 'papo' }, M: { npc: 'croque' },
      W: { placa: 'As lâmpadas dos esquecidos: uma chama pequena pra cada um que chegou aqui expulso de algum lugar. São muitas. Uma, na ponta, está apagada.', arte: 'pocaLava' }
    }
  },
  galeria: {
    cap: 'cap4', nome: 'Galeria do Dique', desc: 'A água subiu até o joelho. No fundo, alguma coisa brilha e alguma coisa respira.', rota: 3, chao: '_',
    grade: [
      '####################',
      '#######__X__########',
      '#####_________######',
      '###____aaaa______###',
      '##____aaaaaa___B__##',
      '##___::aaaa::_____##',
      '##___::::::::_____##',
      '###___::::::_____###',
      '####____::______####',
      '######________######',
      '########____########',
      '#########__#########',
      '#########D##########'
    ],
    objs: {
      D: { porta: ['brejal', 'D'] },
      B: { bau: 'galeria-cofre', arte: 'bau4', texto: 'Um cofre de pagamento, esquecido na enchente. A ferrugem fez o serviço da chave.', faz: { dinheiro: 600, bag: [['hyper-potion', 2]] } },
      X: [
        { se: { sem: 'venceu:alfa4' }, inimigo: { id: 'alfa4', tipo: 'alfa', fala: 'No fundo da galeria alagada, enrolado sobre caixotes arrombados que soltam uma luz morna, o <b>Alfa do Charco</b> abre os olhos. As lascas não o alimentam: só não o deixam dormir.' } },
        { se: { sem: 'pegou-livro' }, bau: 'livro', arte: 'bau3',
          texto: 'Atrás do ninho, num nicho seco, um livro grosso de capa de couro e cantoneiras de ferro. Cada página é uma coluna de números: lascas que entram, moedas com cara de rei que saem. Onze anos de colunas.<br><br>Você pega o <b>livro-caixa da Forja</b>.',
          faz: { item: 'livro', flag: 'pegou-livro', missao: ['charco', 2] } },
        { placa: 'O nicho vazio. Nos caixotes arrombados, as lascas que sobraram ainda pulsam, cada uma fora do compasso da outra.', arte: 'pocaLava' }
      ]
    }
  },
  palafita: {
    cap: 'cap4', nome: 'Palafita do Sineiro', desc: 'Ninguém mora aqui. Mesmo assim, não tem pó.', rota: 3, chao: '.', tema: 'charco', pele: { c: { prop: 'casaVelha' } },
    grade: [
      'TTTTTTTTTTTTTT',
      'T~~~~~~~~~~~~T',
      'T~~..hhh..~~~T',
      'T~~..hhh..~~~T',
      'T~~..hch..~~~T',
      'T~~.L....D~~~T',
      'T~~~~~b~~~~~~T',
      'TTTTTT9TTTTTTT'
    ],
    objs: {
      '9': { porta: ['brejal', '9'] },
      L: { placa: 'Uma lâmpada de azeite, sem chama, pendurada no corrimão. Tem um sino pequeno riscado no vidro.', arte: 'balde' },
      D: { bau: 'diario', arte: 'bau', texto: 'Uma arca na varanda de uma casa onde ninguém mora. Dentro, um caderno de capa mole, na letra miúda de quem escreve escondido.<br><br>“…não foi por lealdade que eu não toquei. Foi porque eu já tinha tocado.”', faz: { missao: ['toque', 0] } }
    }
  },

  /* ================= CAPÍTULO 5 — Ferro-Fundo ================= */
  ladeira: {
    cap: 'cap5', nome: 'Ladeira das Escórias', desc: 'A montanha cospe pela encosta o que os fornos não quiseram.', rota: 4, chao: '.', tema: 'pinheiral',
    grade: [
      'TTTTTTTTTTTTTTTTTTTT^^P^^TTTTT',
      'T......""""........^.=.^.....T',
      'T....."""""".........G=......T',
      'T......""""...........=......T',
      'T..o..................=...o..T',
      'T............================N',
      'T....^^......=...............T',
      'T...^^^^.....=......"""".....T',
      'T....^^......=.....""""""....T',
      'T............=......"""".....T',
      'F=============...............T',
      'T.............o......B.......T',
      'T..""""..............^^......T',
      'T.""""""............^^^^.....T',
      'T..""""..............^^...o..T',
      'T.........o..................T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      F: { porta: ['brejal', 'F'], como: '=' },
      P: { porta: ['ferrofundo', 'P'], como: '^', prop: 'entradaCaverna' },
      N: [{ se: { sem: 'cap5' }, placa: 'A estrada continua do outro lado da montanha, descendo pra um verde que daqui parece se mexer. Mas Ferro-Fundo ainda não se resolveu.', como: '=' },
          { porta: ['tocos', 'N'], como: '=' }],
      G: { npc: 'portao' },
      B: { bau: 'ladeira-carroca', arte: 'bau3', texto: 'Uma carroça de escória tombada na beira da ladeira. No meio da borra de ferro, alguém escondeu o almoço e o pagamento.', faz: { dinheiro: 400, bag: [['hyper-potion', 1], ['revive', 1]] } }
    }
  },
  ferrofundo: {
    cap: 'cap5', nome: 'Ferro-Fundo', desc: 'Uma cidade dentro da montanha. Metade dela está de braços cruzados.', rota: 4, chao: '_',
    pele: { h: { arte: [{ blob: 'pedra', grupo: 'piso' }] }, c: { prop: 'casaPedra', arte: [{ blob: 'pedra', grupo: 'piso' }] } },
    grade: [
      '##############G###############',
      '####______________________####',
      '###____hhh____________hhh__###',
      '##_____hhh____________hhh___##',
      '##_____hch____________hch___##',
      '##______M______________B____##',
      '##__________________________##',
      '##___lll_______W__________i_##',
      '##___lll____________________##',
      '##__D___________________A_K_##',
      '##__________________________##',
      '##_____hhh____________hhh___##',
      '##_____hhh____________hhh___##',
      '##_____hch____________hch___##',
      '##______I______________L____##',
      '###_____________C__________###',
      '####______________________%###',
      '######________________####_###',
      '############__############O###',
      '############P#################'
    ],
    objs: {
      P: { porta: ['ladeira', 'P'] },
      G: [{ se: { sem: 'desce-lascas' }, npc: 'piquete' }, { porta: ['lascas', 'G'], arte: 'fenda' }],
      O: { porta: ['oficina', 'O'] },
      M: { npc: 'mestre' }, B: { npc: 'brasa5' }, D: { npc: 'tatu' }, A: { npc: 'bigorna' }, I: { npc: 'caldeira' }, L: { npc: 'bussola' },
      K: { se: { flag: 'achou-faisca' }, npc: 'faisca' },
      C: { se: { flag: 'lanca-forja' }, npc: 'cascalho5' },
      W: { placa: 'O canal de lava que move os foles de Ferro-Fundo. Do lado, uma tábua com nove riscos, e embaixo, a carvão: “a gente desce quando eles voltarem”.', arte: 'pocaLava' }
    }
  },
  lascas: {
    cap: 'cap5', nome: 'Galeria das Lascas', desc: 'O calor faz o ar tremer. O que queima aqui não vira cinza.', rota: 4, chao: '_',
    grade: [
      '######################',
      '#########_X_##########',
      '#######_______########',
      '#####___lllll___######',
      '###_____lllll_____####',
      '##__::___lll___::__###',
      '##_::::_______::::_###',
      '##__::___i_i___::__###',
      '###____________F___###',
      '####_____________#####',
      '######_____B___#######',
      '########_____#########',
      '##########__##########',
      '##########G###########'
    ],
    objs: {
      G: { porta: ['ferrofundo', 'G'] },
      F: { se: { sem: 'achou-faisca' }, npc: 'faisca' },
      B: { bau: 'lascas-marmita', arte: 'bau2', texto: 'Uma marmita de mineiro e um embornal, largados na correria.', faz: { bag: [['max-potion', 1], ['full-heal', 2]] } },
      X: [
        { se: { sem: 'venceu:alfa5' }, inimigo: { id: 'alfa5', tipo: 'alfa', fala: 'No fim da galeria, o <b>Alfa da Mina</b> anda em círculos em volta de um forno aberto, as costas em brasa, sem conseguir parar. Quando te vê, enfim tem pra onde ir.' } },
        { se: { sem: 'viu-lascas' }, bau: 'forno-lascas', arte: 'pocaLava',
          texto: 'O forno das lascas. Pedras do tamanho de um punho, mornas, pulsando — cada uma um pedaço de Coração — descem por uma calha até o fogo. O fogo não consome: bebe. O que sai do outro lado é a lâmina mais fina que você já viu.<br><br>Num canto, nove capacetes pequenos.',
          faz: { flag: 'viu-lascas', missao: ['fundo', 2] } },
        { placa: 'O forno das lascas. Ainda morno, ainda com sede.', arte: 'pocaLava' }
      ]
    }
  },
  oficina: {
    cap: 'cap5', nome: 'Oficina Atrás da Parede', desc: 'Um forno pequeno, uma bancada limpa, e alguém que não devia estar aqui.', rota: 4, chao: '_',
    grade: [
      '##############',
      '####______####',
      '###___H____###',
      '##__________##',
      '##_l______i_##',
      '##_____B____##',
      '###________###',
      '######__######',
      '######O#######'
    ],
    objs: {
      O: { porta: ['ferrofundo', 'O'] },
      H: { npc: 'odilon' },
      B: { placa: 'A bancada do ferreiro: cada ferramenta no seu risco de giz. Na parede, um desenho de criança — uma casa, um rio, uma ferradura.' }
    }
  },

  /* ================= CAPÍTULO 6 — o Bosque que Anda ================= */
  tocos: {
    cap: 'cap6', nome: 'Aldeia dos Tocos', desc: 'Chamava-se Aldeia da Sombra. Nem toco ficou: ficou buraco.', rota: 5, chao: '.', tema: 'outono',
    grade: [
      'TTTTTTTTTTTTTTMTTTTTTTTTTTTTTT',
      'T..u....u.....=....u....u....T',
      'T..hhh........=.........hhh..T',
      'T..hhh...u....=....u....hhh..T',
      'T..hch........=.........hch..T',
      'T...R.u.......=......u...K...T',
      'T...=.........=..........=...T',
      'N============================T',
      'T......u......=.......u......T',
      'T...u.....O...=...W......u...T',
      'T.............=..............T',
      'T..hhh....u...=........"""...T',
      'T..hhh........=.......""""...T',
      'T..hch........=........"""...T',
      'T...I...u.....=..............T',
      'T...===========.......B......T',
      'T......u......=...u..........T',
      'TTTTTTTTTTTTTTPTTTTTTTTTTTTTTT'
    ],
    objs: {
      N: { porta: ['ladeira', 'N'], como: '=' },
      M: { porta: ['marcha', 'M'], como: '=' },
      P: [{ se: { sem: 'cap6' }, placa: 'A estrada desce pro rio grande. Dá pra ouvir a água daqui — mas o bosque ainda não decidiu se vai ou se fica, e você prometeu olhar.', como: '=' },
          { porta: ['cabeceira', 'P'], como: '=' }],
      R: { npc: 'roque' }, K: { npc: 'primo' }, I: { npc: 'aud' }, O: { npc: 'brotinho' }, B: { npc: 'bento' },
      W: { placa: 'O último toco da praça. Alguém começou a contar os anéis a canivete e desistiu no duzentos.' }
    }
  },
  marcha: {
    cap: 'cap6', nome: 'A Marcha', desc: 'Cada árvore deixa um buraco atrás de si. Elas vão pro norte, um passo por dia.', rota: 5, chao: '.', tema: 'misto',
    grade: [
      'TTTTTTTTTTTTTTTTTATTTTTTTTTTTTTTTT',
      'T................=...............T',
      'T..TT..TT..TT....=....TT..TT..TT.T',
      'T..uu..uu..uu....=....uu..uu..uu.T',
      'T................=...............T',
      'T.""""......TT...=...TT....""""..T',
      'T""""""....uu....=...uu..."""""..T',
      'T.""""...........=.........""""..T',
      'T................=...............T',
      'T...TT...TT......====......L.....T',
      'T...uu...uu.........=............T',
      'T...................=............T',
      'T.TT..TV..TT........=....""""....T',
      'T.uu..u...uu........=...""""""...T',
      'T...................=....""""....T',
      'T......S.........====............T',
      'T................=...............T',
      'T..TT..TT..TT....=....TT..TT..TT.T',
      'T..uu..uu..uu....=....uu..uu..uu.T',
      'TTTTTTTTTTTTTTTTTMTTTTTTTTTTTTTTTT'
    ],
    objs: {
      M: { porta: ['tocos', 'M'], como: '=' },
      A: { porta: ['clareiraMae', 'A'], como: '=' },
      V: { npc: 'carvalho' },
      L: { inimigo: { id: 'lenhadores', tipo: 'treinador', sprite: 'lenhador', fala: 'Três rapazes de machado no ombro rodeiam uma árvore que ficou pra trás. Ela treme — as outras não tremem assim.<br><br>— Olha, veio bicho defender a lenha. Solta os cachorros, que hoje tem lenha e tem janta.' } },
      S: { bau: 'muda', arte: 'flores', texto: 'Um broto de folha clara, do tamanho de uma pata, crescendo na beira de uma das covas. Alguma árvore o deixou cair no caminho — ou deixou de propósito.', faz: { item: 'muda' } }
    }
  },
  clareiraMae: {
    cap: 'cap6', nome: 'Clareira das Mães', desc: 'Onde o Círculo vota. Vinte e três a favor, uma contra.', rota: 5, chao: '.', tema: 'misto',
    grade: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T........................T',
      'T...f....G.....P....f....T',
      'T...........W............T',
      'T..f.................f...T',
      'T.....H..................T',
      'T........................T',
      'TTTTTTTTTTTTXTTTTTTTTTTTTT',
      'T...........=............T',
      'T.."""".....=....""""....T',
      'T.""""""....=...""""""...T',
      'T..""""..B..=....""""....T',
      'T...........=............T',
      'T...........=............T',
      'TTTTTTTTTTTTATTTTTTTTTTTTT'
    ],
    objs: {
      A: { porta: ['marcha', 'A'], como: '=' },
      G: { npc: 'meganium6' }, P: { npc: 'torterra' }, H: { npc: 'vento' },
      W: { placa: 'As raízes do Coração do bosque: grossas como um corpo, mornas, entrando na terra em volta de alguma coisa que pulsa lá embaixo. Enquanto o bosque anda, elas se esticam. Uma hora arrebentam.', arte: 'poco' },
      B: { bau: 'clareira-ninho', arte: 'bau2', texto: 'Um ninho velho, caído de uma forquilha. Quem morava nele foi embora com a árvore de cima e deixou o que não dava pra carregar.', faz: { bag: [['max-potion', 2], ['lum-berry', 2]] } },
      X: { como: '=', inimigo: { id: 'alfa6', tipo: 'alfa', fala: 'A trilha estreita entre dois paredões de tronco. No meio dela, de costas, o <b>Pastor</b> — o Alfa que toca as árvores pra frente — fareja o ar. Tudo o que vem do sul, pra ele, é machado.' } }
    }
  },

  /* ================= CAPÍTULO 7 — a Ponte Partida ================= */
  cabeceira: {
    cap: 'cap7', nome: 'Cabeceira da Ponte', desc: 'Deste lado, quem guarda. Do outro, quem espera o vão fechar.', rota: 6, chao: '.',
    grade: [
      'TTTTTTTTTTTTTTPTTTTTTTTTTTTTTT',
      'T.............=..............T',
      'T..hhh........=........hhh...T',
      'T..hhh........=........hhh...T',
      'T..hch........=........hch...T',
      'T...S.........=.........Q....T',
      'T...=.........=.........=....T',
      'T...=====================....T',
      'T....K........=.....A........T',
      'T..""""...L...=...C.....f....T',
      'T.""""""......=....V.........T',
      'T.."""".......===============E',
      'T.............=....G.....D...T',
      '~~~~~~~~~~~~~~b~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~b~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~b~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~B~~~~~~~~~~~~~~~'
    ],
    objs: {
      P: { porta: ['tocos', 'P'], como: '=' },
      B: { porta: ['ponte', 'B'], como: 'b' },
      D: { porta: ['pilares', 'D'], prop: 'entradaCaverna' },
      E: [{ se: { sem: 'cap7' }, placa: 'A trilha segue a margem rio abaixo, até onde o rio — dizem — acaba em sal. Mas a ponte ainda não tem destino.', como: '=' },
          { porta: ['salina', 'E'], como: '=' }],
      S: { npc: 'selma7' }, Q: { npc: 'lasca7' }, L: { npc: 'lia7' }, G: { npc: 'capataz' },
      C: { se: { flag: 'campeao-respeito' }, npc: 'campeao7' },
      A: { se: { flag: 'bia-juntos' }, npc: 'bia7' },
      K: { se: { flag: 'nico-ponte' }, npc: 'nico7' },
      V: { se: { flag: 'arvore-ponte', sem: 'carvalho-deitou' }, npc: 'carvalho7' }
    }
  },
  ponte: {
    cap: 'cap7', nome: 'A Ponte Grande', desc: 'Tábua, corda e trinta anos de gente passando. No meio, falta um pedaço.', rota: 6, chao: '.',
    grade: [
      '~~~~~~~~~~B~~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~RbO~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~~b~~~~~~~~~',
      '~~~~~~~~~~V~~~~~~~~~',
      '~~~~~~~~~~G~~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~~W~~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~Cbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~~Y~~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~bbb~~~~~~~~',
      '~~~~~~~~~~M~~~~~~~~~'
    ],
    objs: {
      B: { porta: ['cabeceira', 'B'], como: 'b' },
      M: { porta: ['margem', 'M'], como: 'b' },
      R: { enfeite: true, prop: 'barris', como: 'b', texto: 'A barricada da cabeceira: barris cheios de pedra. Alguém pintou neles, torto: “AQUI PASSA REMÉDIO”.' },
      O: { enfeite: true, prop: 'barril', como: 'b' },
      // o vão: bloqueia até o Alfa do rio sair do caminho — ou até uma árvore velha se deitar em cima dele
      V: { se: { sem: ['venceu:alfa7', 'carvalho-deitou'] }, placa: 'O vão do meio. As tábuas terminam em lascas, como osso quebrado. Lá embaixo, entre os pilares, alguma coisa grande se mexe na água.', arte: 'fenda', como: 'b' },
      G: { se: { sem: 'passou-vao' }, gatilho: 'vao', como: 'b', texto: 'O vão está fechado. Sob as patas, a madeira é nova de um lado e muito, muito velha do outro — e as duas aguentam.<br><br>Do lado de lá, alguém assobia. Viram você.', faz: { flag: 'passou-vao', missao: ['travessia', 1] } },
      W: { como: 'b', inimigo: { id: 'vanguarda1', tipo: 'treinador', sprite: 'guerreiro', fala: 'Dois batedores do bando de guerra vigiam as tábuas, com cães de caça soltos.<br><br>— Olha o que vem vindo do lado dos bichos. Sozinho!' } },
      Y: { como: 'b', inimigo: { id: 'vanguarda2', tipo: 'treinador', sprite: 'guerreiro', fala: 'A segunda linha do bando fecha a ponte de lado a lado.<br><br>— O primeiro posto deixou passar? Então sobra pra nós.' } },
      C: { bau: 'caixa-selma', arte: 'bau3', como: 'b', texto: 'Uma caixa de madeira amarrada com corda, largada na correria quando o vão abriu. Na tampa, a ferro quente: SELMA.', faz: { item: 'caixa' } }
    }
  },
  pilares: {
    cap: 'cap7', nome: 'Entre os Pilares', desc: 'Debaixo da ponte, a água faz redemoinho em volta de pedra muito mais velha que ela.', rota: 6, chao: '_',
    grade: [
      '####################',
      '#####____X____######',
      '###____________#####',
      '##__aa__i__aa___####',
      '##__aa_____aa___%_N#',
      '##______i_______####',
      '###__::::::::___####',
      '###__::::::::__#####',
      '####___::::___######',
      '#####___B____#######',
      '#######____#########',
      '########__##########',
      '########D###########'
    ],
    objs: {
      D: { porta: ['cabeceira', 'D'] },
      N: { se: { sem: 'nico-ponte' }, npc: 'nico7' },
      B: { bau: 'pilares-caixote', arte: 'bau4', texto: 'Um caixote que caiu da ponte e encalhou entre as pedras. Estava indo pro reino — ou vindo.', faz: { dinheiro: 700, bag: [['max-ether', 1], ['hyper-potion', 2]] } },
      X: { inimigo: { id: 'alfa7', tipo: 'alfa', fala: 'Entre os pilares, onde a água faz redemoinho, o <b>Alfa do Rio</b> ergue a cabeça. Há lascas de tábua presas no dorso dele, das duas margens: ele quebra o que qualquer um constrói em cima da casa dele.' } }
    }
  },
  margem: {
    cap: 'cap7', nome: 'A Outra Margem', desc: 'O acampamento do bando de guerra. Uma lança fincada no chão pra cada homem.', rota: 6, chao: '.',
    grade: [
      '~~~~~~~~~~~~~~M~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~b~~~~~~~~~~~~~~~',
      'T.............=..............T',
      'T.."""".......=......""""....T',
      'T.""""""......=.....""""""...T',
      'T.."""".......=......""""....T',
      'TTTTTTTTTTTTTTRTTTTTTTTTTTTTTT',
      'T.............Z..............T',
      'T..hhh........=........hhh...T',
      'T..hhh........=........hhh...T',
      'T..hch........=........hch...T',
      'T...O.........=.........K....T',
      'T...=.........=.........=....T',
      'T...=====================....T',
      'T......F......=......I.......T',
      'T.............=..............T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      M: { porta: ['ponte', 'M'], como: 'b' },
      R: { como: '=', inimigo: { id: 'rufino', tipo: 'treinador', sprite: 'guerreiro', fala: 'No portão da paliçada, um homem de capuz vermelho-escuro afia uma lança sem olhar pra você.<br><br>— Um bicho atravessou a ponte sozinho. Ou é coragem, ou é recado. Tanto faz: os dois dão couro. Bando! Comigo!' } },
      Z: { se: { flag: 'venceu:rufino', sem: 'viu-bando' }, gatilho: 'bando', como: '=', texto: 'Com o capitão no chão, o bando não avança nem recua. Uns trinta homens parados, de lança na mão, olhando uns pros outros. Lá no fundo, do lado da fogueira, um velho de capuz que você conhece se levanta devagar.', faz: { flag: 'viu-bando', missao: ['travessia', 2] } },
      O: { npc: 'tome7' }, K: { npc: 'tico7' },
      F: { enfeite: true, arte: 'pocaLava', texto: 'A fogueira do bando de guerra. Em volta dela, lanças fincadas no chão — uma pra cada homem. Algumas são pequenas demais pro dono.' },
      I: { placa: 'Gaiolas novas, vazias, empilhadas até a altura de um homem. Ferro bom, sem emenda. Você já sabe de quem.', arte: 'estalagmiteNegra' }
    }
  },

  /* ================= CAPÍTULO 8 — o Deserto de Sal ================= */
  salina: {
    cap: 'cap8', nome: 'Salina do Fim do Rio', desc: 'O rio grande termina aqui: branco até onde a vista alcança.', rota: 7, chao: '.', tema: 'sal',
    grade: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T................................T',
      'T...""""..........~~~.....""""...T',
      'T..""""""........~~~~~...""""""..T',
      'T...""""..........~~~.....""""...T',
      'T.............hhh................T',
      'T.......o.....hhh.........o......T',
      'T............Mhch................T',
      'EH===============================C',
      'T............G...................T',
      'T...""""......W.......S...""""...T',
      'T..""""""................""""""..T',
      'T...""""....o.............""""...T',
      'T.....................B..........T',
      'T................................T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      E: { porta: ['cabeceira', 'E'], como: '=' },
      C: { porta: ['cidadeSal', 'C'], como: '=' },
      H: { se: { sem: 'viu-sal' }, gatilho: 'sal', como: '=', texto: 'O rio grande não chega ao mar. Ele chega <b>aqui</b>: afina, some na areia, e depois dele é tudo branco. Sal até o horizonte, e no horizonte alguma coisa quadrada demais pra ser pedra.<br><br>Os dois Corações que você carregou puxavam pra cá. Depois daqui, puxam pra cima.', faz: { flag: 'viu-sal', missao: ['sal', 0] } },
      M: { npc: 'corcova' }, G: { npc: 'grao' },
      W: { placa: 'O único poço doce da salina. A água fica lá embaixo, escura e fria. Em volta, pegadas de tudo o que tem sede.', arte: 'poco' },
      S: { inimigo: { id: 'salteadores', tipo: 'bando', fala: 'Um bando deitou em cima do poço, de barriga cheia de água, e não pretende sair. Quem chega perto leva um aviso. Você chegou perto.' } },
      B: { bau: 'salina-arca', arte: 'bau3', texto: 'Os restos de uma carroça de caravana, meio comidos de sal. Uma arca ficou fechada, porque sal emperra tranca.', faz: { dinheiro: 350, bag: [['hyper-potion', 2], ['max-repel', 1]] } }
    }
  },
  cidadeSal: {
    cap: 'cap8', nome: 'Salmoura, a Cidade Branca', desc: 'Uma cidade inteira de sal, sem ninguém. Nas paredes, alguém desenhou os dois lados juntos.', rota: 7, chao: '.', tema: 'sal',
    grade: [
      'TTTTTTTTNTTTTTTTTTTTTTTTTTTTTT',
      'T.......=....................T',
      'T..hhh..=..hhh.....hhh.......T',
      'T..hhh..=..hhh.....hhh.......T',
      'T..hch..=..hch.....hch.......T',
      'T...1...=...2.......3....P...T',
      'T...=...=...=.......=........T',
      'C===========================.T',
      'T............=...............T',
      'T.....D......=......Z........T',
      'T............=...............T',
      'T..........^^F^^.............T',
      'T..........^^^^^.............T',
      'T..hhh...............hhh.....T',
      'T..hhh...............hhh.....T',
      'T..hch...............hch.....T',
      'T...4.................B......T',
      'T............................T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      C: { porta: ['salina', 'C'], como: '=' },
      F: { porta: ['fonteMorta', 'F'], como: '^', prop: 'entradaCaverna' },
      N: [{ se: { sem: 'cap8' }, placa: 'Ao norte da cidade o sal vira cascalho, o cascalho vira encosta, e lá em cima a encosta é branca de outro jeito. Mas as paredes daqui ainda têm o que dizer.', como: '=' },
          { porta: ['degelo', 'N'], como: '=' }],
      D: { npc: 'dalva' }, Z: { npc: 'zelador' }, P: { npc: 'pressagio8' },
      '1': { placa: 'Na parede, riscado no sal: uma mulher e um bicho de orelhas compridas, sentados. Entre os dois, um pano com um nó. Cada um segura uma ponta.', arte: 'lapide' },
      '2': { placa: 'Outro desenho: uma fila de pares — gente e bicho — carregando potes na direção de uma fonte. Ninguém vai na frente de ninguém.', arte: 'lapide' },
      '3': { placa: 'Aqui o desenho foi raspado a unha, com raiva. Sobrou a metade de baixo: patas e pés correndo pra lados opostos, e um nó partido no chão.', arte: 'lapide' },
      '4': { placa: 'O último desenho da rua: uma criança humana dorme encostada num bicho grande. O nó está amarrado no pulso dela e na pata dele. Alguém — muito depois — desenhou em volta um círculo de água.', arte: 'lapide' },
      B: { bau: 'cidade-arca', arte: 'bau4', texto: 'Uma arca de sal maciço. A tampa sai inteira, como uma laje.', faz: { bag: [['full-restore', 1], ['revive', 2]] } }
    }
  },
  fonteMorta: {
    cap: 'cap8', nome: 'A Fonte Morta', desc: 'Aqui nascia água antes de qualquer reino ter nome. O que mora aqui agora guarda um vazio.', rota: 7, chao: '_',
    grade: [
      '######################',
      '########__X__#########',
      '######_________#######',
      '####_____________#####',
      '###___vvv___vvv___####',
      '###___vvv___vvv___%_K#',
      '###_______________####',
      '##__::::::::::::___###',
      '##__::::::::::::___###',
      '###__::::::::::___####',
      '####____________######',
      '######__B_____########',
      '########____##########',
      '#########__###########',
      '#########F############'
    ],
    objs: {
      F: { porta: ['cidadeSal', 'F'] },
      B: { bau: 'fonte-bilha', arte: 'bau2', texto: 'Uma bilha de barro lacrada com cera, no canto mais seco. Dentro não tem água: tem o que alguém achou que valia mais.', faz: { dinheiro: 900, bag: [['max-potion', 2], ['max-ether', 1]] } },
      K: { bau: 'no', arte: 'bau', texto: 'Atrás da parede que não era parede, um nicho do tamanho de um corpo deitado. Dentro, em cima do sal, um pano trançado em nó — duas pontas, gastas por mãos diferentes. Não esfarelou. Alguma coisa não deixou.<br><br>Você pega o <b>Nó de Pano</b>.', faz: { item: 'no', missao: ['no', 'fim'] } },
      X: [
        { se: { sem: 'venceu:alfa8' }, inimigo: { id: 'alfa8', tipo: 'alfa', fala: 'No leito seco da Fonte, o <b>Alfa do Sal</b> dorme enrolado em volta de nada — do lugar onde um Coração ficava. Ele guarda um vazio há mais tempo do que qualquer reino existe. Você acaba de pisar no vazio dele.' } },
        { se: { sem: 'viu-lacos' }, bau: 'primeiros-lacos', arte: 'lapide',
          texto: 'Atrás de onde o Alfa dormia, a parede inteira é um desenho só, do chão ao teto.<br><br>Embaixo: gente e Pokémon lado a lado, cada par segurando as pontas de um nó de pano. No meio: os pares se soltando — uns puxam, outros são puxados. Em cima: vultos enormes em volta de uma nascente, e a água descendo por cima de tudo, de todos, dos dois.<br><br>A última figura é esta cidade. Vazia. A Cheia <b>já veio uma vez</b>.',
          faz: { flag: 'viu-lacos', missao: ['sal', 2] } },
        { placa: 'A parede dos Primeiros Laços. Em cima, a água. Embaixo, os nós.', arte: 'lapide' }
      ]
    }
  },

  /* ================= CAPÍTULO 9 — o Degelo ================= */
  degelo: {
    cap: 'cap9', nome: 'Acampamento do Degelo', desc: 'Três tendas, três fogos, e um quarto no meio que não é de ninguém.', rota: 8, chao: '.', tema: 'inverno',
    grade: [
      'TTTTTTTTTTTTTTGTTTTTTTTTTTTTTT',
      'T.............=..............T',
      'T..hhh........=........hhh...T',
      'T..hhh........=........hhh...T',
      'T..hch........=........hch...T',
      'T...F.........=.........B....T',
      'T...=.........=.........=....T',
      'T...=====================....T',
      'T.............=..............T',
      'T.........S..W=...KP.........T',
      'T.............=..............T',
      'T..hhh........=........hhh...T',
      'T..hhh........=........hhh...T',
      'T..hch........=........hch...T',
      'T...A.........=.........I....T',
      'T...=.........=.........=....T',
      'T...=====================..M.T',
      'T.............=..............T',
      'TTTTTTTTTTTTTTNTTTTTTTTTTTTTTT'
    ],
    objs: {
      N: { porta: ['cidadeSal', 'N'], como: '=' },
      G: [{ se: { sem: 'subida' }, placa: 'A trilha da geleira, ao norte. Ninguém sobe sem saber quem vai na frente — é a única regra em que as três ordens concordam.', como: '=' },
          { porta: ['geleira', 'G'], como: '=' }],
      // cada ordem manda quem ainda fala com você — ou, se você a feriu, manda cobrar
      F: [{ se: { repAbaixo: ['forja', 0] }, inimigo: { id: 'cobraForja', tipo: 'bando', fala: 'A tenda da Forja está fechada. Na frente dela, três brutos com o martelo marcado no ombro te esperam de braços cruzados.<br><br>— A Ordem não manda conversar com quem a quebrou. Manda cobrar.' } },
          { se: { rep: ['forja', 0] }, npc: 'brasa9' }],
      B: [{ se: { repAbaixo: ['bosque', 0] }, inimigo: { id: 'cobraBosque', tipo: 'bando', fala: 'A tenda do Círculo está vazia. Em volta dela a neve se mexe: espinho, cipó e dente.<br><br>O bosque não esquece quem o prendeu, nem quem o vendeu.' } },
          { se: { rep: ['bosque', 0] }, npc: 'meganium9' }],
      A: [{ se: { repAbaixo: ['abismo', 0] }, inimigo: { id: 'cobraAbismo', tipo: 'bando', fala: 'A tenda da Corte tem uma lamparina apagada na porta. Três sombras se soltam da lona.<br><br>— A Regente manda dizer que dívida com a Corte não prescreve.' } },
          { se: { rep: ['abismo', 0] }, npc: 'lasca9' }],
      S: { npc: 'tio9' }, K: { npc: 'nevasca' }, I: { npc: 'mamute' }, M: { npc: 'carteiro' },
      P: { se: { flag: 'achou-pingo' }, npc: 'pingo' },
      W: { enfeite: true, arte: 'pocaLava', texto: 'O fogo do meio. Três pedras de sentar em volta dele, e um Slowpoke que chegou ontem.' }
    }
  },
  geleira: {
    cap: 'cap9', nome: 'Geleira Rachada', desc: 'O gelo estala de noite. De dia, escorre. Faz muito tempo que ele não fazia nenhum dos dois.', rota: 8, chao: '.', tema: 'inverno',
    grade: [
      'TTTTTTTTTTTTTTTTTT^^U^^TTTTTTT',
      'T.................^.=.^......T',
      'T...""""............=........T',
      'T..""""""...~~~~....=........T',
      'T...""""...~~~~~~...=....o...T',
      'T...........~~~~....=........T',
      'T.............=======........T',
      'T.............=..............T',
      'T..TtT........=......""""....T',
      'T..TZT........=.....""""""...T',
      'T..TTT........=......""""....T',
      'T.............=..............T',
      'T....~~~......=.........P....T',
      'T...~~~~~.....=..............T',
      'T....~~~......=....""""......T',
      'T.............=...""""""..B..T',
      'T.............=....""""......T',
      'T.............=..............T',
      'T.............=..............T',
      'TTTTTTTTTTTTTTGTTTTTTTTTTTTTTT'
    ],
    objs: {
      G: { porta: ['degelo', 'G'], como: '=' },
      U: { porta: ['garganta', 'U'], como: '^', prop: 'entradaCaverna' },
      P: { se: { sem: 'achou-pingo' }, npc: 'pingo' },
      B: { bau: 'geleira-mochila', arte: 'bau3', texto: 'Uma mochila de gente, congelada na neve. As alças foram cortadas a faca, com pressa.', faz: { dinheiro: 800, bag: [['max-potion', 2]] } },
      Z: { bau: 'par-do-gelo', arte: 'lapide', texto: 'Atrás da árvore que não era árvore, o paredão de gelo é liso como vidro. Dentro dele, de pé, há dois vultos: um de gente, um de bicho. Entre os dois, um pano esticado — cada um segura uma ponta.<br><br>Não fugiam um do outro. Subiam <b>juntos</b>. Alguém já tentou chegar à Nascente assim, uma vez.', faz: { flag: 'viu-par-gelo', missao: ['gelo', 'fim'] } }
    }
  },
  garganta: {
    cap: 'cap9', nome: 'Garganta do Degelo', desc: 'O único caminho pra cima. Alguma coisa aqui dentro está de sentinela.', rota: 8, chao: '_', tema: 'geleira',
    grade: [
      '##########L###########',
      '#########_Y_##########',
      '##########X###########',
      '########_____#########',
      '######_________#######',
      '####___aaaa______#####',
      '###___aaaaaa___::_####',
      '###____aaaa___::::_###',
      '###__::______::::__###',
      '####::::___i______####',
      '#####::____B___#######',
      '########____##########',
      '#########__###########',
      '#########U############'
    ],
    objs: {
      U: { porta: ['geleira', 'U'] },
      L: { porta: ['limiar', 'L'] },
      Y: { se: { sem: 'passou-garganta' }, gatilho: 'garganta', texto: 'Do outro lado da garganta o ar muda. Não é mais frio: é <b>velho</b>. O chão desce, e lá embaixo, no meio do gelo, há um vale verde que não devia existir.<br><br>Os Corações que você carregou não puxam mais. Chegaram.', faz: { flag: 'passou-garganta', missao: ['degelo', 'fim'] } },
      B: { bau: 'garganta-treno', arte: 'bau4', texto: 'Um trenó de carga, abandonado na subida. Quem o puxava desistiu aqui — ou foi desistido.', faz: { bag: [['full-restore', 2], ['max-revive', 1], ['max-ether', 1]] } },
      X: { inimigo: { id: 'alfa9', tipo: 'alfa', fala: 'A garganta estreita até caber um só. No meio dela, coberto de geada, o <b>Alfa do Degelo</b> não dorme: escuta. Atrás dele vem um som de água muito grande, muito longe. Ele está aqui pra que ninguém atrapalhe.' } }
    }
  },

  /* ================= CAPÍTULO 10 — a Nascente ================= */
  limiar: {
    cap: 'cap10', nome: 'Limiar da Nascente', desc: 'Um vale verde no meio do gelo. Tudo o que vive começou aqui perto.', rota: 9, chao: '.',
    grade: [
      'TTTTTTTTTTTT^^N^^TTTTTTTTTTTTT',
      'T...........^.=.^............T',
      'T..f....f.....=......f...f...T',
      'T.............=..............T',
      'T....~~~......=......~~~.....T',
      'T...~~~~~.....=.....~~~~~....T',
      'T....~~~..V...=...D...~~~....T',
      'T.............=..............T',
      'T..f...A......=......B....f..T',
      'T.............=..............T',
      'T..hhh........=........hhh...T',
      'T..hhh........=........hhh...T',
      'T..hch........=........hch...T',
      'T...I.........=.........M....T',
      'T...=.........=.........=....T',
      'T...=====================....T',
      'T.............=..............T',
      'TTTTTTTTTTTTTTLTTTTTTTTTTTTTTT'
    ],
    objs: {
      L: { porta: ['garganta', 'L'], como: '=' },
      N: { porta: ['nascente', 'N'], como: '^', prop: 'entradaCaverna' },
      V: { npc: 'veu10' }, I: { npc: 'chansey10' }, M: { npc: 'kecleon10' },
      A: { se: { flag: 'lia-confia' }, npc: 'lia10' },
      // quem liderou a subida chega até aqui com você (quem subiu sozinho não acha ninguém neste lugar)
      D: [{ se: { flag: 'sobe-forja' }, npc: 'brasa10' }, { se: { flag: 'sobe-bosque' }, npc: 'meganium10' }, { se: { flag: 'sobe-abismo' }, npc: 'lasca10' }],
      B: [{ se: { flag: 'nico-ponte' }, npc: 'nico10' }, { se: { flag: 'bia-juntos' }, npc: 'bia10' }]
    }
  },
  nascente: {
    cap: 'cap10', nome: 'A Nascente', desc: 'A primeira água. Quem a fecha é mais velho que qualquer nome.', rota: 9, chao: '_', tema: 'geleira',
    grade: [
      '########################',
      '########################',
      '########################',
      '########################',
      '########################',
      '########aaawaaaa########',
      '######_aaaaaaaaaa_######',
      '#####__aaaaaaaaaa__#####',
      '####____aaaaaaaa____####',
      '####________________####',
      '####_______X________####',
      '#####______________#####',
      '######____i__i____######',
      '########___G____########',
      '##########____##########',
      '###########N############'
    ],
    objs: {
      N: { porta: ['limiar', 'N'] },
      G: { se: { sem: 'viu-nascente' }, gatilho: 'nascente', texto: 'A gruta é maior por dentro do que a serra por fora. O gelo das paredes brilha por conta própria. E no fundo, onde a água cai sem fazer barulho, estão eles.<br><br>Nenhuma história que você ouviu no caminho chegava perto do tamanho.', faz: { flag: 'viu-nascente', missao: ['nascente', 1] } },
      X: [
        { se: { sem: 'venceu:antigos' }, inimigo: { id: 'antigos', tipo: 'antigos', fala: 'Diante da água que cai, vultos enormes fazem um círculo em volta da <b>Nascente</b>. Ela afina a cada instante. Os <b>Antigos</b> não se viram: você é pequeno demais pra interromper.<br><br>Só há um jeito de fazê-los parar pra ouvir.' } },
        { npc: 'antigos' }
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
      oi: { fala: 'Olha quem subiu a serra. Eu? Tô só admirando a paisagem. Linda fumaça. …Já que parou: tenho umas coisinhas que caíram de umas carroças.',
        opcoes: [{ t: '🛒 Ver o que caiu das carroças.', faz: { loja: true } }, { t: 'Nada, obrigado.' }] },
      plano: { fala: 'A pedra quer fogo, o cogumelo quer fuga. Amadores. Escuta o profissional: eles guardam tudo o que defumam numa despensa só. Eu sei a hora em que o vigia cochila. A gente esvazia a casa numa noite, eles acordam sem inverno e vão embora andando. Ninguém morre.',
        opcoes: [{ t: 'E as crianças do acampamento?', vai: 'criancas' }, { t: 'E o que você ganha?', vai: 'ganha' }] },
      criancas: { fala: 'Passam fome, uai. Fome não mata em dois dias. …Não me olha assim. Eu disse que ninguém morre, não disse que ninguém sofre.', faz: { flag: 'lasca-plano' } },
      ganha: { fala: 'Carne defumada tem preço bom no Vau. Metade é sua. Tá vendo? Honestidade.', faz: { flag: 'lasca-plano' } },
      lanca: { fala: 'Deixa eu ver essa ponta… Hohoho. Marca do martelo. A Forja vendendo ferro pra quem caça Pokémon. Isso aqui não é lança, parceiro: é um segredo com cabo.',
        opcoes: [{ t: 'Vender o segredo (₽700).', faz: { flag: 'lanca-vendida', missao: ['lanca', 'fim'], dinheiro: 700, rep: { abismo: 2 } }, vai: 'vendida' }, { t: 'Fica comigo.' }] },
      vendida: { fala: 'A Corte agradece. A Forja, um dia, também vai — do jeito dela.' },
      depois: { fala: 'O Passo se resolveu. Eu? Já tô de olho rio abaixo. Tem uma cidade inteira apostando moeda em briga. Meu tipo de lugar. Antes de eu ir: quer alguma coisa?',
        opcoes: [{ t: '🛒 Ver o que caiu das carroças.', faz: { loja: true } }, { t: 'Nada, obrigado.' }] }
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
      denovo: { fala: 'O Mestre Baltazar fica na praça, perto do poço. A arena é a casa de pedra lá em cima, com a placa da espada. E eu fico aqui, que é o meu serviço. Bicho cansado pode deitar na casinha do portão — e a despensa do portão vende, que osso não se compra sozinho.',
        opcoes: [{ t: '🛏 Descansar na casinha do portão ({custo}).', faz: { cura: true } }, { t: '🛒 Ver a despensa do portão.', faz: { loja: true } }, { t: 'Só passando.' }] },
      saida: { fala: 'Vai seguir o rio? Mandei abrir o portão do sul pra você. Pra baixo daqui é charco, e do charco eu só conheço o cheiro. Boa sorte, bicho. Se quiser deitar ou comprar antes, a casinha e a despensa continuam aí.',
        opcoes: [{ t: '🛏 Descansar na casinha do portão ({custo}).', faz: { cura: true } }, { t: '🛒 Ver a despensa do portão.', faz: { loja: true } }, { t: 'Vou indo.' }] }
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
    } },

  /* ===== capítulo 4 ===== */
  barqueiro: { nome: 'Seu Lodo, o barqueiro', sprite: 195,
    falas: [{ se: { flag: 'cap4' }, no: 'depois' }, { se: { missao: ['charco', 'nao'] }, no: 'oi' }, { no: 'rumo' }],
    nos: {
      oi: { fala: 'Hã? Ah. Gente. …Bicho. Tanto faz, eu não enxergo direito mesmo. Você desceu do Vau, né? Tem cheiro de areia de arena.', vai: 'oi2' },
      oi2: { fala: 'Aqui é o Charco dos Esquecidos. Esquecido é quem a Forja não quis porque não rende e o Círculo não quis porque não floresce. Sobrou lama. Lama aceita todo mundo.',
        opcoes: [{ t: 'Estou seguindo uma coisa que puxa pra cá.', vai: 'puxa' }, { t: 'Onde fica a Corte do Abismo?', vai: 'corte' }] },
      puxa: { fala: 'Puxa, é? Então puxa pra Corte. Tudo o que afunda neste charco acaba lá.', vai: 'corte' },
      corte: { fala: 'Segue as tábuas pra oeste, em volta do poço grande. Não pisa fora da tábua: o brejo não devolve. E se alguém da Forja perguntar, você não me viu — eles têm um dique ali a nordeste e contam até as rãs.', faz: { missao: ['charco', 0] } },
      rumo: { fala: 'Tábua pra oeste: a Corte. Pedra pra nordeste: o dique da Forja. Mato pro sul: coisa que morde. Eu fico aqui, que aqui não tem nada, e nada nunca me fez mal.' },
      depois: { fala: 'O charco anda falando alto. Fazia onze anos que não falava. Ainda não sei se eu gosto.' }
    } },

  regente: { nome: 'A Regente', sprite: 31,
    falas: [
      { se: { flag: 'charco-corte' }, no: 'dCorte' }, { se: { flag: 'charco-brasa' }, no: 'dBrasa' }, { se: { flag: 'charco-cinza' }, no: 'dCinza' },
      { se: { missao: ['charco', 2] }, no: 'livro' },
      { se: { missao: ['charco', 1] }, no: 'espera' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Então é você. O Lasca fala de você faz três mapas — e o Lasca não elogia ninguém de graça. Chegue. Aqui ninguém morde quem entra de pata vazia.', vai: 'oi2' },
      oi2: { fala: 'Você já carregou dois Corações. Eu sei na mão de quem cada um foi parar; aqui se sabe de tudo, é o que nos sobrou. Não vou cobrar. Vou contar o que ninguém te contou.', vai: 'conta' },
      conta: { fala: 'Há onze anos nós avisamos: os Corações estão se soltando do leito. Éramos nós que os vigiávamos — a Corte do Abismo existe pra isso, pra ficar acordada no escuro enquanto os outros dormem. A Forja disse que era chantagem. O Círculo, que era mau agouro. Tiraram os sinos e nos puseram na estrada.', vai: 'conta2' },
      conta2: { fala: 'Desde então a Forja faz uma coisa que nem o Círculo sabe: lasca os Corações que encontra e <b>vende</b> as lascas aos humanos. Fornalha que queima lasca de Coração não apaga. Existe um livro-caixa com cada venda, na Casa de Contas do dique, a nordeste daqui. Eu quero esse livro.',
        opcoes: [{ t: 'Pra fazer o quê com ele?', vai: 'praque' }, { t: 'Eu busco.', faz: { missao: ['charco', 1] }, vai: 'aceita' }, { t: 'Essa guerra não é minha.', vai: 'recusa' }] },
      praque: { fala: 'Pra ler em voz alta em toda aldeia, daqui até a serra. A Ordem racha em duas no mesmo dia: os que sabiam e os que foram enganados. É feio. É o que eles fizeram com a gente — só que com a verdade.',
        opcoes: [{ t: 'Eu busco.', faz: { missao: ['charco', 1] }, vai: 'aceita' }, { t: 'Preciso pensar.' }] },
      aceita: { fala: 'A porta tem tranca, e a tranca tem dona: uma Klefki que conta chave por chave. Na frente dela há uma escolta de gente de armadura. E a galeria de baixo alagou — dizem que o Alfa do Charco fez ninho lá, em cima do que brilha. Vá com a comitiva inteira.' },
      recusa: { fala: 'Nunca é, no começo. Depois a água some da sua aldeia, e passa a ser. Eu espero. Esperar é o que a Corte faz melhor.' },
      espera: { fala: 'O livro-caixa. Casa de Contas, no dique, a nordeste do brejal. E cuidado com o que dorme na galeria.' },
      livro: { fala: 'Isso debaixo do seu braço… deixe eu ver a lombada. O martelo. É ele.', vai: 'livro2' },
      livro2: { fala: 'Me dê, e amanhã o charco inteiro sabe ler. A Forja se parte: metade vai querer queimar os próprios mestres. Não vou fingir que isso me entristece.',
        opcoes: [
          { t: '🌑 Entregar o livro-caixa à Regente.', faz: { perde: 'livro', flag: ['cap4', 'charco-corte'], missao: ['charco', 'fim'], rep: { abismo: 3, forja: -3 }, dinheiro: 1500, dom: 'tinta' }, vai: 'dCorte1' },
          { t: 'Ainda não.' }] },
      dCorte1: { fala: 'Feito. Estenda a pata: isto é tinta de livro-caixa, e não sai. Quem deve, treme quando você chega perto.' },
      dCorte: { fala: 'Já leram o livro em sete aldeias. Em duas, os da Forja ouviram de pé, calados, e foram embora no meio. Não sei pra onde. É o que me tira o sono — e eu já dormia pouco.' },
      dBrasa: { fala: 'Você deu o livro pra eles mesmos se julgarem. Onze anos esperando uma prova, e ela foi embora no bolso de uma chaveira. …Não. Eu não vou te expulsar. Expulsar é coisa de quem tem sino.' },
      dCinza: { fala: 'Cinza. Eu vi a fumaça da minha janela. A Dama diz que memória não é arma. Ela pode dizer isso: a ela, deixaram um túmulo pra varrer. A nós, nem isso.' }
    } },

  chaveira: { nome: 'Dona Chaveira', sprite: 707,
    falas: [
      { se: { flag: 'charco-brasa' }, no: 'dBrasa' }, { se: { flag: 'cap4' }, no: 'depois' },
      { se: { missao: ['charco', 2] }, no: 'livro' },
      { se: { flag: 'chave-dique' }, no: 'aberta' },
      { se: { missao: ['charco', 1] }, no: 'pede' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Tlim. Não toque em nada. Cada chave aqui abre uma coisa, e eu sei qual. Esta é a Casa de Contas da Ordem da Forja, e você não tem conta.' },
      pede: { fala: 'Tlim… Você passou pela escolta. Então não veio comprar. Veio pelo livro.', vai: 'pede2' },
      pede2: { fala: 'Eu guardo esta porta há nove anos. Faz três que parei de entender os números que entram. Entra lasca, sai moeda de <b>fora</b> — moeda com cara de rei. Perguntei ao meu superior. Ele me deu uma chave nova pra polir.',
        opcoes: [{ t: 'Me deixe entrar.', vai: 'entra' }, { t: 'Por que não abriu você mesma?', vai: 'medo' }] },
      medo: { fala: 'Porque eu sou chaveira, não heroína. E porque a galeria alagou e tem uma coisa grande morando em cima das lascas. Eu ouço ela respirar pelas fechaduras.', vai: 'entra' },
      entra: { fala: 'Tome. É a única cópia que eu nunca registrei. Se achar o livro, só peço uma coisa: antes de dar a quem quer nos queimar, me ouça de novo.', faz: { flag: 'chave-dique' } },
      aberta: { fala: 'A porta está aberta. Eu fico aqui, contando chave, que é pra não pensar.' },
      livro: { fala: 'Tlim… você achou. Está tudo aí, não está? Cada lasca. Cada moeda de rei.', vai: 'livro2' },
      livro2: { fala: 'Escute. Se isso for lido em praça, a Ordem não se conserta: ela quebra, e quem cai primeiro são os pequenos, que nunca viram uma lasca na vida. Tem gente boa lá dentro. A ferreira de Pedralume, a Brasa — ela subiu, ela escuta. Deixe o livro comigo. Eu levo a Ferro-Fundo e ponho na mão dela. A casa se limpa por dentro. Devagar. Mas se limpa.',
        opcoes: [
          { t: '⚒ Confiar o livro à Chaveira, pra chegar à Brasa.', faz: { perde: 'livro', flag: ['cap4', 'charco-brasa'], missao: ['charco', 'fim'], rep: { forja: 2, abismo: -2 }, dom: 'tempera', bag: [['rocky-helmet', 1]] }, vai: 'dBrasa1' },
          { t: 'Ainda vou pensar.' }] },
      dBrasa1: { fala: 'Obrigada. Eu não sei jurar, só sei trancar: está trancado comigo. E leve isto — têmpera lenta. É como a Ordem devia fazer tudo, e não faz.' },
      dBrasa: { fala: 'O livro já subiu a ladeira. Eu fui junto até a metade e voltei: alguém precisa ficar com as chaves.' },
      depois: { fala: 'A porta que eu guardava não guarda mais nada. Tlim. Nove anos.' }
    } },

  aurelio: { nome: 'Capitão Aurélio', sprite: 'soldadoRubro',
    falas: [{ se: { flag: 'cap4' }, no: 'depois' }, { se: { falas: ['aurelio', 1] }, no: 'denovo' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Um bicho solto dentro do dique. A escolta dormiu, pelo visto. …Não vou sacar a espada: eu compro, não caço. Capitão Aurélio, da Fornalha do Rei.', vai: 'oi2' },
      oi2: { fala: 'Lá em cima, depois da ponte, o inverno dura sete meses. A lasca que eu levo daqui aquece uma vila inteira até a primavera. Eu não sei de onde a pedra vem, e os seus não me contaram. Pago o que pedem.',
        opcoes: [{ t: '(Mostrar os dentes.)', vai: 'dentes' }, { t: '(Olhar pros caixotes.)', vai: 'caixotes' }] },
      dentes: { fala: 'Entendo. Se tirassem lasca da minha terra pra aquecer a sua, eu também mostrava. Mas repare: quem lasca não sou eu.' },
      caixotes: { fala: 'Doze caixotes por lua. Já foram quatro; agora são doze. Pergunte aos seus mestres por que a conta subiu. Eu perguntei. Disseram que era “pra guerra”. Não disseram contra quem.' },
      denovo: { fala: 'Eu parto com a maré do rio. Se o que eu compro faz mal a vocês, alguém devia ter me dito antes de me vender.' },
      depois: { fala: 'Não vai ter caixote esta lua. Volto de mãos vazias pra um inverno de sete meses. …Não estou te culpando. Estou fazendo a conta.' }
    } },

  lasca4: { nome: 'Lasca', sprite: 302,
    falas: [
      { se: { missao: ['gema', 'fim'] }, no: 'casa' },
      { se: { missao: ['gema', 0], item: 'gema' }, no: 'trouxe' },
      { se: { missao: ['gema', 0] }, no: 'cade' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Você! Aqui! Na minha casa! …Fala baixo, que aqui eu não sou “o Lasca que resolve”. Aqui eu sou o Lasca que saiu pra vender e nunca trouxe nada que prestasse.', vai: 'oi2' },
      oi2: { fala: 'Preciso de um favor, e esse eu não tenho como pagar em esperteza. Um bando me pegou no mato do sul do brejal e levou a minha pedra de nascença. Todo Sableye tem uma. Sem ela eu não entro no Paço: a Regente não recebe quem perdeu a própria pedra.',
        opcoes: [{ t: 'Eu pego de volta.', faz: { missao: ['gema', 0] }, vai: 'vai' }, { t: 'Quanto você paga?', vai: 'paga' }] },
      paga: { fala: '…Tá vendo? Eu te ensinei direitinho. Pago. O que eu tiver.',
        opcoes: [{ t: 'Eu pego de volta.', faz: { missao: ['gema', 0] }, vai: 'vai' }, { t: 'Depois.' }] },
      vai: { fala: 'Mato alto, no sul do brejal. São uns quatro. Eu contei enquanto corria.' },
      cade: { fala: 'Minha pedra. Sul do brejal. Eu fico aqui, treinando a cara de quem nunca perdeu nada.' },
      trouxe: { fala: '…É ela. Tá até limpa. Você limpou?', vai: 'trouxe2' },
      trouxe2: { fala: 'Vou te dizer uma coisa de graça, que é a primeira da minha vida: fui eu que contei à Regente do livro-caixa. Vendi lasca pra Forja dois anos antes de entender pra onde ia. Não foi coragem. Foi enjoo.', faz: { perde: 'gema', missao: ['gema', 'fim'], rep: { abismo: 1 }, dinheiro: 900, bag: [['black-sludge', 1]] } },
      casa: { fala: 'Me deixaram entrar no Paço. Sentei no fundo. Ninguém me mandou sair. Pra mim, isso é festa.' }
    } },

  veu4: { nome: 'Dama Véu', sprite: 429,
    falas: [
      { se: { flag: 'charco-cinza' }, no: 'dCinza' },
      { se: { missao: ['toque', 0] }, no: 'diario' },
      { se: { missao: ['charco', 2] }, no: 'livro' },
      { se: { flag: 'cap4' }, no: 'depois' },
      { se: { flag: 'sino-devolvido' }, no: 'amiga' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Você não me conhece, mas eu varri folha em volta de um túmulo, perto da sua primeira aldeia, por onze anos. Passou por lá? Não? Então passou por uma árvore sem saber que era porta. Acontece com quase todos.' },
      amiga: { fala: 'Você levou o sino a quem lembrava. Eu soube pelo vento — o Tio do Poço levou três dias pra terminar a frase, mas terminou. Aqui você tem uma amiga. São raras; gaste devagar.' },
      livro: { fala: 'O livro-caixa. A Regente quer lê-lo em praça. A chaveira quer levá-lo pra dentro da Ordem. As duas têm razão, e é por isso que eu tenho medo.', vai: 'livro2' },
      livro2: { fala: 'Meu mestre dizia: memória não é arma. Arma a gente aponta; memória a gente carrega. Se quiser, queimamos o livro na lâmpada dele. Ninguém ganha a prova. A Forja continua vendendo, até alguém pará-la de outro jeito. Não é justo. É só o único caminho em que ninguém aprende a odiar com papel na mão.',
        opcoes: [
          { t: '🔥 Queimar o livro-caixa na lâmpada do sineiro.', faz: { perde: 'livro', flag: ['cap4', 'charco-cinza'], missao: ['charco', 'fim'], rep: { abismo: -2, bosque: 1, forja: 1 }, dom: 'cinza' }, vai: 'dCinza1' },
          { t: 'Não. Alguém tem que saber.' }] },
      dCinza1: { fala: 'Queimou devagar, como tudo o que é verdade. Fique com a cinza: ela esfria o rastro de quem a leva.' },
      dCinza: { fala: 'A Regente não fala comigo. Vai passar — ela me deve onze anos de silêncio, e eu só devo um a ela.' },
      diario: { fala: 'Onde você… isso é a letra dele. Você achou a palafita. Ele vinha pra cá quando a aldeia dormia, e eu achava que era pra chorar.', vai: 'diario2' },
      diario2: { fala: '“Não é o sino que eu não quis tocar. É que eu já tinha tocado — uma vez, por uma coisa que só eu ouvi. Vozes velhas, debaixo da Fonte, chamando os Corações de volta pra casa.”<br><br>…Ele ouviu os <b>Antigos</b>. Onze anos antes de todo mundo. E morreu achando que estava louco.', vai: 'diario3' },
      diario3: { fala: 'Guarde o nome: Antigos. Quando alguém lhe disser que os Corações “se soltam”, corrija por dentro: eles são <b>chamados</b>.', faz: { missao: ['toque', 'fim'], flag: 'ouviu-antigos', rep: { abismo: 1 }, bag: [['max-ether', 1], ['lum-berry', 2]] } },
      depois: { fala: 'O charco voltou a ter assunto. Vá: o que você segue não para aqui. Puxa pra cima, pra onde a Forja mora.' }
    } },

  pressagio: { nome: 'Presságio', sprite: 359,
    falas: [{ se: { falas: ['pressagio', 1] }, no: 'agua' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Não chegue perto se tiver medo de má notícia: é a única que eu sei dar. Sou o arauto da Corte. Eu sinto o desastre antes de ele acontecer, e a paga por isso é ser chamado de causa.' },
      agua: { fala: 'Faz um ano que eu acordo com o pelo molhado. Não chove no meu quarto. É água que ainda não veio — muita, de um lugar alto e velho. Contei à Regente. Ela me pediu pra não contar a mais ninguém. Estou contando a você.' }
    } },

  pavio: { nome: 'Pavio', sprite: 607,
    falas: [{ se: { missao: ['toque', 'fim'] }, no: 'acesa' }, { se: { falas: ['pavio', 2] }, no: 'terceira' }, { se: { falas: ['pavio', 1] }, no: 'segunda' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Eu acendo as lâmpadas. Uma pra cada um que chega expulso de algum lugar. Tem cento e doze. Eu sei o nome de todas.' },
      segunda: { fala: 'Cento e doze acesas. E uma que a Dama não me deixa acender. Ela diz que o dono “não chegou”. Mas a lâmpada chegou. Lâmpada não vem sozinha.' },
      terceira: { fala: 'A lâmpada apagada não fica aqui. Fica numa casa em cima da água onde ninguém mora, no brejal, lá pro sul. Eu fui uma vez. Tem um arvoredo, e uma das árvores… eu passei por dentro dela. Juro pelo meu pavio.' },
      acesa: { fala: 'A Dama deixou! Cento e treze. A dele é a que treme menos.' }
    } },

  papo: { nome: 'Tia Papo', sprite: 317,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Estalagem do Fundo. A cama é de junco e o caldo é escuro; não pergunte de quê. Descansa a comitiva inteira.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: 'Só passando.' }] }
    } },

  croque: { nome: 'Croque', sprite: 453,
    falas: [{ no: 'banca' }],
    nos: {
      banca: { fala: 'Krrk. Tudo o que afunda no charco, um dia eu vendo. Quer ver?',
        opcoes: [{ t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: 'Depois.' }] }
    } },

  /* ===== capítulo 5 ===== */
  portao: { nome: 'Portão', sprite: 411,
    falas: [
      { se: { flag: 'cap5' }, no: 'depois' },
      { se: { missao: ['fundo', 'nao'], flag: 'charco-corte' }, no: 'livro' },
      { se: { missao: ['fundo', 'nao'], repAbaixo: ['forja', -2] }, no: 'frio' },
      { se: { missao: ['fundo', 'nao'] }, no: 'oi' },
      { no: 'entra' }
    ],
    nos: {
      oi: { fala: 'Alto lá. Ferro-Fundo não recebe visita: recebe encomenda, aprendiz e problema. Qual dos três você é?',
        opcoes: [{ t: 'Estou seguindo o que puxa os Corações.', faz: { missao: ['fundo', 0] }, vai: 'puxa' }, { t: 'Problema.', faz: { missao: ['fundo', 0] }, vai: 'problema' }] },
      puxa: { fala: '…Então você sabe das pedras. Entre. O Mestre vai querer te ver antes que outro te veja. E não repare na bagunça: metade da mina cruzou os braços.' },
      problema: { fala: 'Honesto. Problema a gente já tem; um a mais não entorta a viga. Entre. O Mestre fica na Bigorna-Mãe, e o delegado dos grevistas, na beira do canal.' },
      livro: { fala: 'Você. O do livro. Leram aquilo em sete aldeias, e a oitava foi aqui dentro. Eu não devia te deixar passar. …Mas eu também li. Entra logo, antes que eu me lembre de que lado eu estou.', faz: { missao: ['fundo', 0] } },
      frio: { fala: 'A Ordem conhece o seu rastro, e ele não cheira bem. Passa. Porta fechada nunca resolveu nada nesta montanha — mas eu vou ficar olhando as suas costas.', faz: { missao: ['fundo', 0] } },
      entra: { fala: 'O Mestre fica na Bigorna-Mãe, a casa de pedra do lado esquerdo. O delegado da greve, na beira do canal de lava.' },
      depois: { fala: 'A montanha mudou de som. Eu fico na porta do mesmo jeito: alguém tem que ser a parte que não muda.' }
    } },

  mestre: { nome: 'Mestre-Forjador', sprite: 306,
    falas: [
      { se: { flag: 'ferro-armas' }, no: 'dArmas' }, { se: { flag: 'ferro-greve' }, no: 'dGreve' }, { se: { flag: 'ferro-ruiu' }, no: 'dRuiu' },
      { se: { missao: ['fundo', 2] }, no: 'decide' },
      { se: { flag: 'ouviu-mestre' }, no: 'espera' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Entre e feche a boca, que aqui dentro o ar é quente demais pra desperdiçar. Eu sou o Mestre-Forjador. Você é o forasteiro que anda levando Coração de um lado pro outro como quem leva recado.', vai: 'oi2' },
      oi2: { fala: 'Vou poupar o seu tempo: é verdade. Nós lascamos os Corações soltos e vendemos as lascas aos humanos. E com a moeda dos humanos eu compro o carvão que arma esta Ordem <b>contra</b> os humanos. Você pode achar isso sujo. Eu acho matemática.',
        opcoes: [{ t: 'Armar pra quê?', vai: 'guerra' }, { t: 'E os que estão de braços cruzados lá fora?', vai: 'greve' }] },
      guerra: { fala: 'Pra guerra que já começou, e que só os tolos não viram. Laço na estrada. Gaiola na serra. Arena em cima de Fonte. Cada ano eles sobem mais um rio. O Círculo responde indo embora. A Corte responde vendendo segredo. Alguém tem que responder com ferro.', faz: { flag: 'ouviu-mestre' }, vai: 'pedido' },
      greve: { fala: 'Os pequenos pararam porque a galeria de baixo anda matando: o que mora lá enlouqueceu com o calor das lascas. Eles têm razão em ter medo. Não têm razão em achar que parar nos salva.', faz: { flag: 'ouviu-mestre' }, vai: 'pedido' },
      pedido: { fala: 'Desça lá, se os grevistas deixarem. Veja o que o forno queima e o que ele faz sair. Depois me diga se <b>você</b> fecharia.' },
      espera: { fala: 'Fale com o delegado dos grevistas, na beira do canal, e desça à galeria. Eu não tenho medo do que você vai ver. Tenho medo do que você vai concluir.' },
      decide: { fala: 'Você viu. Lasca entra, lâmina sai — a melhor que esta terra já teve. Fique do meu lado e eu ponho os fornos em três turnos. Quando eles vierem, a Ordem segura a linha por todo mundo. Até por quem nos cospe.',
        opcoes: [
          { t: '⚒ Ficar com o Mestre: as armas saem.', faz: { flag: ['cap5', 'ferro-armas'], missao: ['fundo', 'fim'], rep: { forja: 3, bosque: -2, abismo: -1 }, dom: 'gume', bag: [['life-orb', 1]] }, vai: 'dArmas1' },
          { t: 'Ainda não decidi.' }] },
      dArmas1: { fala: 'Bom. Chegue ao fogo. Isto a Ordem não vende a rei nenhum: é o gume de Ferro-Fundo, e a partir de hoje ele anda com você.' },
      dArmas: { fala: 'Três turnos. O canal não esfria mais. Os pequenos voltaram ao serviço calados — eu sei ler um silêncio, e não gosto deste. Mas as lâminas estão saindo.' },
      dGreve: { fala: 'Os fornos esfriaram. Você deu razão a quem tinha medo, e medo é mesmo uma razão. Quando eles subirem o rio, lembre-se desta sala fria.' },
      dRuiu: { fala: 'A galeria caiu. Onze anos de trabalho debaixo de pedra. …A ferreira diz que foi limpeza. Eu digo que foi desarmamento. Estamos os dois certos, e é por isso que eu não durmo.' }
    } },

  tatu: { nome: 'Tatu, o delegado', sprite: 529,
    falas: [
      { se: { flag: 'ferro-greve' }, no: 'dGreve' }, { se: { flag: 'cap5' }, no: 'depois' },
      { se: { missao: ['fundo', 2] }, no: 'decide' },
      { se: { flag: 'ouviu-tatu' }, no: 'espera' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Se veio furar a greve, a fila é ali. Não tem fila: ninguém fura. …Você não é daqui. Então escuta de quem cava, não de quem manda cavar.', vai: 'oi2' },
      oi2: { fala: 'A gente desce desde filhote. Sempre foi quente, sempre foi escuro, sempre deu pra voltar. Aí abriram a galeria nova, a das pedras que pulsam. Em três luas perdemos nove. Não foi desabamento. Foi o que mora lá embaixo — e ele não era assim antes das pedras.',
        opcoes: [{ t: 'O que vocês querem?', vai: 'quer' }, { t: 'O Mestre diz que parar não salva ninguém.', vai: 'mestre' }] },
      quer: { fala: 'Fechar a galeria nova. Voltar ao ferro comum, que nunca matou ninguém que não merecesse. A Ordem fica mais pobre? Fica. Fica viva.', faz: { flag: 'ouviu-tatu' } },
      mestre: { fala: 'O Mestre faz conta com gente como se fosse carvão. A conta dele fecha. O problema é que eu conheço o carvão pelo nome.', faz: { flag: 'ouviu-tatu' } },
      espera: { fala: 'Fala com o Mestre, se ainda não falou. Depois o piquete te deixa descer. Vai com gente, e não confia em nada que brilha lá embaixo.' },
      decide: { fala: 'Viu? Agora me diz se é certo descer filhote praquilo. Fica com a gente: a galeria nova fecha, os fornos grandes param, e a Ordem volta a fazer prego, enxada e panela. Fica indefesa, o Mestre vai dizer. Fica. Mas fica inteira.',
        opcoes: [
          { t: '✊ Ficar com os mineiros: a Forja para.', faz: { flag: ['cap5', 'ferro-greve'], missao: ['fundo', 'fim'], rep: { forja: -2, bosque: 2, abismo: 1 }, dom: 'greve', bag: [['assault-vest', 1]] }, vai: 'dGreve1' },
          { t: 'Ainda não decidi.' }] },
      dGreve1: { fala: '…A gente achou que ninguém de fora ia cruzar os braços junto. Cruza aqui. Isso. Agora ninguém te tira do lugar.' },
      dGreve: { fala: 'Panela, enxada e prego. Nunca vendi tão pouco e nunca dormi tão bem. Se a guerra vier, a gente cava um buraco fundo e espera. Cavar a gente sabe.' },
      depois: { fala: 'A greve acabou do jeito que greve acaba: alguém decidiu por nós. Não foi o pior jeito. Também não foi o nosso.' }
    } },

  brasa5: { nome: 'Brasa', sprite: 126,
    falas: [
      { se: { flag: 'ferro-ruiu' }, no: 'dRuiu' }, { se: { flag: 'cap5' }, no: 'depois' },
      { se: { flag: 'vendeu-minerio' }, no: 'traida' },
      { se: { missao: ['fundo', 2] }, no: 'decide' },
      { se: { flag: 'charco-brasa' }, no: 'livro' },
      { se: { flag: 'fim-forja' }, no: 'amiga' },
      { no: 'oi' }
    ],
    nos: {
      traida: { fala: 'Você. O do minério. Subiu até aqui pra vender o quê, dessa vez? …Não, não me responde. Eu tenho uma fornalha pra cuidar e uma opinião sobre você que não mudou.' },
      oi: { fala: 'Olha quem a ladeira trouxe. Pedralume mandou lembrança? Não mandou, eu sei: de lá ninguém me escreve. Eu subi pra Ferro-Fundo quando a fonte se resolveu. Aqui, pelo menos, o fogo não depende do humor de ninguém.' },
      amiga: { fala: '{eu}! O cano de Pedralume ainda corre, me disseram. Por causa dele me deram um forno aqui em cima e um título que eu não uso. Senta. Não tem cadeira. Fica de pé perto do calor, que dá no mesmo.' },
      livro: { fala: 'A Chaveira chegou antes de você, com um livro debaixo do braço e a cara de quem não dormiu a subida inteira. Eu li. Três noites. …Passei a vida defendendo esta casa. Agora vou ter que consertá-la, que é mais difícil.' },
      decide: { fala: 'Você desceu. Então sabe o que eu sei. Aquilo não é forja: é queimar o chão que a gente pisa pra esquentar a mão.', vai: 'decide2' },
      decide2: { fala: 'O Mestre quer três turnos. O Tatu quer fechar a porta e voltar pra panela. Eu digo que porta fechada alguém abre. Tem que <b>cair</b>. Eu sei onde ficam as escoras: fui eu que temperei. Ninguém mais queima Coração nesta montanha — nem pra se defender. É o preço.',
        opcoes: [
          { t: '🔥 Derrubar a Galeria das Lascas, com a Brasa.', faz: { flag: ['cap5', 'ferro-ruiu'], missao: ['fundo', 'fim'], rep: { forja: -1, bosque: 1, abismo: 1 }, dom: 'escombro', bag: [['focus-sash', 1]] }, vai: 'dRuiu1' },
          { t: 'Ainda não decidi.' }] },
      dRuiu1: { fala: 'Foi rápido. Três marretadas no lugar certo, e a montanha fez o resto. …Segura isto. É o que a gente aprende quando derruba o que construiu: onde o golpe tem que cair.' },
      dRuiu: { fala: 'Metade da Ordem não me cumprimenta. A outra metade me traz água sem eu pedir. Eu durmo. Não bem. Mas durmo.' },
      depois: { fala: 'Não foi como eu faria. Mas você não me deve o meu jeito.' }
    } },

  piquete: { nome: 'O piquete', sprite: 524,
    falas: [{ se: { flag: ['ouviu-mestre', 'ouviu-tatu'] }, no: 'passa' }, { no: 'barra' }],
    nos: {
      barra: { fala: 'Ninguém desce. Ordem da greve. Quer descer? Primeiro escuta o Mestre <b>e</b> o Tatu — a gente não quer herói mal informado morrendo lá embaixo e virando argumento.' },
      passa: { fala: 'Ouviu os dois? Então desce. E conta quantos nós somos na volta, pra ver se você lembra de todos.', faz: { flag: 'desce-lascas', missao: ['fundo', 1] } }
    } },

  bigorna: { nome: 'Mãe Bigorna', sprite: 305,
    falas: [
      { se: { missao: ['faisca', 'fim'] }, no: 'grata' },
      { se: { missao: ['faisca', 0], flag: 'achou-faisca' }, no: 'voltou' },
      { se: { missao: ['faisca', 0] }, no: 'espera' },
      { no: 'pede' }
    ],
    nos: {
      pede: { fala: 'Você viu um Aron pequeno assim? Com uma lasca no capacete, de um tombo? O Faísca. Ele ouviu que os grandes não descem mais e resolveu que então descia ele, “pra buscar os nove”. Faz dois dias.',
        opcoes: [{ t: 'Eu procuro.', faz: { missao: ['faisca', 0] }, vai: 'obrigada' }, { t: 'Sinto muito.' }] },
      obrigada: { fala: 'Ele gosta de lugar quente. Se está vivo, está perto da lava. Eu… eu não consigo descer. Eu tentei. As pernas não foram.' },
      espera: { fala: 'Perto da lava. Ele sempre vai pra perto da lava.' },
      voltou: { fala: 'FAÍSCA! Seu… seu… vem cá.<br><br>…Você trouxe ele. Você desceu onde eu não desci.', faz: { missao: ['faisca', 'fim'], rep: { forja: 1 }, bag: [['max-revive', 1], ['hard-stone', 1]] } },
      grata: { fala: 'Ele está de castigo até virar Aggron. Eu deixo sair pra te dar bom-dia.' }
    } },

  faisca: { nome: 'Faísca', sprite: 304,
    falas: [{ se: { flag: 'achou-faisca' }, no: 'casa' }, { no: 'achado' }],
    nos: {
      achado: { fala: 'Não conta pra minha mãe! …Eu vim buscar os nove. Não achei nenhum. Achei só os capacetes. Eu juntei. São nove mesmo.',
        opcoes: [{ t: 'Vamos pra casa.', faz: { flag: 'achou-faisca' }, vai: 'vai' }, { t: '(Ficar um pouco com ele.)', vai: 'fica' }] },
      fica: { fala: '…Eu não tô chorando. É o calor. O calor faz isso no olho.',
        opcoes: [{ t: 'Vamos pra casa.', faz: { flag: 'achou-faisca' }, vai: 'vai' }] },
      vai: { fala: 'Tá. Mas eu levo os capacetes. Alguém tem que levar.' },
      casa: { fala: 'Eu tô de castigo. Mas a mãe pendurou os nove capacetes na parede da Bigorna-Mãe. Todo mundo que passa tira o próprio.' }
    } },

  cascalho5: { nome: 'Sargento Cascalho', sprite: 75,
    falas: [{ se: { flag: 'cap5' }, no: 'depois' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Você. Eu disse que levava a ponta pessoalmente, e levei. Pus na mesa do Mestre. Sabe o que ele fez? Não negou. Disse “é das nossas, e é boa”. Trinta anos de farda, e eu descubro a casa que eu guardava pelo lado de fora.' },
      depois: { fala: 'Eu continuo de farda. Só mudei o que eu acho que ela guarda.' }
    } },

  caldeira: { nome: 'Dona Caldeira', sprite: 219,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Pensão da Caldeira. Aqui ninguém passa frio — nem quem quer. Cama de pedra morna pra comitiva inteira.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: 'Só passando.' }] }
    } },

  bussola: { nome: 'Bússola', sprite: 476,
    falas: [{ no: 'banca' }],
    nos: {
      banca: { fala: 'Tudo o que eu vendo aponta pro norte. É defeito de fábrica. Quer ver mesmo assim?',
        opcoes: [{ t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: 'Depois.' }] }
    } },

  odilon: { nome: 'Odilon', sprite: 'ferreiro',
    falas: [
      { se: { missao: ['humano', 'fim'], flag: 'odilon-fala' }, no: 'falou' },
      { se: { missao: ['humano', 'fim'] }, no: 'calou' },
      { se: { missao: ['humano', 0], item: 'lanca' }, no: 'lanca' },
      { se: { missao: ['humano', 0] }, no: 'denovo' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: '…Não grita. Por favor. Eu sei o que eu sou e onde eu estou. Odilon. Ferreiro. Gente, sim — a única gente desta montanha.', vai: 'oi2' },
      oi2: { fala: 'Lá embaixo eu fazia ferradura e dobradiça. Um dia um Pokémon desta Ordem me viu trabalhar, não disse nada, e voltou no dia seguinte com um ferro que eu nunca tinha visto. Faz seis anos que eu moro atrás desta parede. Ninguém me prende. Aqui me ensinaram o que o ferro <b>quer</b>.', faz: { missao: ['humano', 0] }, vai: 'oi3' },
      oi3: { fala: 'Eu faço as peças finas: ponta, trinco, grade. O Mestre diz que são pra defesa da Ordem. Eu não pergunto pra onde vão. Ferreiro que pergunta demais fica sem forno.' },
      denovo: { fala: 'As peças finas são minhas: ponta, trinco, grade. Eu não pergunto pra onde vão. Você… você sabe pra onde vão?',
        opcoes: [{ t: '(Riscar no chão: uma serra, uma gaiola, uma arena.)', vai: 'lanca2' }, { t: '(Não responder.)' }] },
      lanca: { fala: 'Isso com você… me deixa ver. Esse chanfro. Essa têmpera azul na base. …É minha. Eu fiz esta ponta. Onde você achou?', vai: 'lanca2' },
      lanca2: { fala: '(Você risca no chão: uma serra. Um bicho grande, com a ponta no flanco. Depois uma grade. Uma arena.)<br><br>…Na carne de um de vocês. E grade. Eu fiz as grades também. Seis anos achando que eu tinha escolhido um lado. Eu só tinha escolhido não olhar.',
        opcoes: [
          { t: '(Apontar pra porta: vá dizer isso ao Mestre.)', faz: { flag: 'odilon-fala', missao: ['humano', 'fim'], rep: { forja: -1, bosque: 1 }, bag: [['expert-belt', 1]] }, vai: 'falou1' },
          { t: '(Deixar o martelo na mão dele.)', faz: { missao: ['humano', 'fim'], rep: { forja: 1 }, bag: [['expert-belt', 1]] }, vai: 'calou1' }] },
      falou1: { fala: 'Eu vou. De avental e tudo. Se me puserem pra fora da montanha, eu desço sabendo fazer ferradura — e sabendo o resto. Leva isto. É a última peça que eu fiz sem saber pra quê.' },
      calou1: { fala: '…Você não me mandou embora. Então eu fico, e escolho o que eu forjo. Daqui pra frente, só o que eu puder dizer em voz alta a quem serve. Leva isto. É uma peça boa, e desta eu sei o destino.' },
      falou: { fala: 'O Mestre me ouviu de pé. Não me expulsou. Disse que ia “pensar no caso do humano”. Eu já pensei no meu.' },
      calou: { fala: 'Ponta eu não faço mais. Faço enxada. O Mestre reclama. Eu aponto pro ouvido e digo que gente escuta mal.' }
    } },

  /* ===== capítulo 6 ===== */
  roque: { nome: 'Seu Roque, o barragista', sprite: 400,
    falas: [
      { se: { missao: ['muda', 0], item: 'muda' }, no: 'trouxe' },
      { se: { missao: ['muda', 0] }, no: 'cade' },
      { se: { flag: 'bosque-partiu' }, no: 'dPartiu' }, { se: { flag: 'bosque-ficou' }, no: 'dFicou' }, { se: { flag: 'bosque-rachou' }, no: 'dRachou' },
      { se: { missao: ['anda', 'nao'] }, no: 'oi' },
      { se: { missao: ['muda', 'nao'] }, no: 'pede' },
      { no: 'plantou' }
    ],
    nos: {
      oi: { fala: 'Pisa onde quiser: não tem mais raiz pra tropeçar. Isto aqui era a Aldeia da Sombra. Agora o povo chama de Aldeia dos Tocos, e nem toco ficou — ficou buraco. As árvores foram embora <b>andando</b>, moço. Eu vi. Levantaram a raiz como quem levanta a saia, e foram.', vai: 'oi2' },
      oi2: { fala: 'O Círculo decidiu se retirar pro norte, pra longe de machado e de forno. Tudo bem, é direito deles. Só esqueceram de perguntar pra quem vivia embaixo. Meu açude secou, a criançada murcha no sol. Vai atrás delas, pela trilha do norte. Tem uma lá, a Mãe Meganium, que ainda olha pra trás.', faz: { missao: ['anda', 0] } },
      pede: { fala: 'Já que você vai atrás delas: me traz uma muda. Uma só. Árvore que anda larga broto pelo caminho — sempre fica algum pra trás, perto do rastro. Eu planto no meio da praça e rego com o que sobrou do açude.',
        opcoes: [{ t: 'Eu trago.', faz: { missao: ['muda', 0] }, vai: 'vai' }, { t: 'Uma muda não faz sombra.', vai: 'sombra' }] },
      sombra: { fala: 'Hoje não. Daqui a vinte anos, faz. Eu não vou estar aqui, mas o Brotinho vai.',
        opcoes: [{ t: 'Eu trago.', faz: { missao: ['muda', 0] }, vai: 'vai' }, { t: 'Outra hora.' }] },
      vai: { fala: 'Perto do rastro delas, na Marcha. Broto novo, folha clara. Traz com a terra junto.' },
      cade: { fala: 'Uma muda, com a terra junto. Na Marcha, perto do rastro.' },
      trouxe: { fala: 'Olha só! Com terra e tudo. Segura aqui enquanto eu cavo… pronto. Brotinho! Vem ver! Não encosta!', faz: { perde: 'muda', missao: ['muda', 'fim'], rep: { bosque: 1 }, bag: [['leftovers', 1]], dinheiro: 300 } },
      plantou: { fala: 'Rego duas vezes por dia. A água é pouca, mas a muda também é.' },
      dPartiu: { fala: 'Foram todas, então. O que ficou é sol. A gente vai cavar um açude novo mais pra baixo. Castor não chora: castor represa.' },
      dFicou: { fala: 'Voltaram. Mais pálidas, a folha caindo fora de época, mas voltaram. A sombra está doente. Ainda é sombra. Eu não sei se agradeço a elas ou se peço desculpa.' },
      dRachou: { fala: 'Metade voltou. As mais velhas. Dá sombra pra metade da aldeia, e a outra metade se muda pra perto. Aperta, mas cabe.' }
    } },

  brotinho: { nome: 'Brotinho', sprite: 43,
    falas: [{ se: { missao: ['fica', 'fim'] }, no: 'sabia' }, { se: { falas: ['brotinho', 1] }, no: 'arvore' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Eu só saía de noite. Mas agora de dia é claro demais, e de noite também é claro, porque não tem mais folha tapando a lua. Eu não sei mais quando eu saio.' },
      arvore: { fala: 'Tem uma árvore na Marcha que não anda. Fica no meio das outras, fingindo. Quando as outras dão o passo, ela só mexe os galhos e fica. Eu vi! Ninguém acredita em Oddish.' },
      sabia: { fala: 'EU FALEI que ela não andava.' }
    } },

  aud: { nome: 'Dona Aud', sprite: 531,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Pousada da Sombra. O nome ficou; a sombra, não. Durmam de chapéu.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: 'Só passando.' }] }
    } },

  primo: { nome: 'Primo do Kecleon', sprite: 352,
    falas: [{ no: 'banca' }],
    nos: {
      banca: { fala: 'Sou primo do Kecleon de Pedralume! De tudo, de todas as cores! Menos verde. Verde foi embora.',
        opcoes: [{ t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: 'Depois.' }] }
    } },

  bento: { nome: 'Seu Bento', sprite: 'lenhador',
    falas: [{ se: { flag: 'cap6' }, no: 'depois' }, { se: { falas: ['bento', 1] }, no: 'denovo' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Calma, calma. O machado está no chão, olha. Eu sou lenhador, sim. Trinta anos. Só corto o que já morreu em pé, e planto duas pra cada uma. Meu pai fazia assim. Os moços que vieram depois de mim não fazem.', vai: 'oi2' },
      oi2: { fala: 'Eles estão lá em cima, na Marcha, cortando as que ficam pra trás. “Árvore que anda dá lenha que não acaba”, foi o que disseram. Eu disse que árvore que anda <b>grita</b>. Riram de mim.' },
      denovo: { fala: 'Se encontrar os moços lá em cima… não precisa pegar leve. Só não mata. Eles têm mãe.' },
      depois: { fala: 'As que eu plantei não andam. Ainda. Eu fico de olho — vai que aprendem.' }
    } },

  carvalho: { nome: 'Vô Carvalho', sprite: 709,
    falas: [{ se: { missao: ['fica', 'fim'] }, no: 'fim' }, { se: { missao: ['fica', 0] }, no: 'espera' }, { se: { falas: ['carvalho', 1] }, no: 'fala' }, { no: 'quieto' }],
    nos: {
      quieto: { fala: '(Um tronco velho, de casca rachada, entre as árvores da Marcha. As outras têm um buraco atrás de si, de onde vieram. Esta não tem.)' },
      fala: { fala: '…Você olhou duas vezes. Quase ninguém olha duas vezes pra uma árvore. Está bem: eu não ando. Mexo os galhos quando as outras dão o passo, e fico.', vai: 'fala2' },
      fala2: { fala: 'Tenho quatrocentos anos neste chão. O Círculo votou ir embora, e eu votei com as raízes. Lá pra baixo, no rio grande, tem uma ponte que os dois lados vivem quebrando. Uma ponte é só uma árvore deitada que alguém respeitou. Eu queria ser isso, antes de ser lenha.', faz: { missao: ['fica', 0] }, vai: 'fala3' },
      fala3: { fala: 'Mas árvore do Círculo não se deita sem a palavra de uma Mãe. Fale com a Meganium por mim. Ela vai entender: ela também é das que ficam.' },
      espera: { fala: 'A Mãe Meganium. Na clareira, depois do Pastor. Diga que o Carvalho pede licença pra se deitar.' },
      fim: { fala: 'Ela deixou. Quando a hora chegar, eu vou — do meu jeito, que é devagar. Procure por mim onde o rio é mais largo.' }
    } },

  meganium6: { nome: 'Mãe Meganium', sprite: 154,
    falas: [
      { se: { missao: ['fica', 0] }, no: 'carvalho' },
      { se: { flag: 'bosque-partiu' }, no: 'dPartiu' }, { se: { flag: 'bosque-ficou' }, no: 'dFicou' }, { se: { flag: 'bosque-rachou' }, no: 'dRachou' },
      { se: { missao: ['anda', 1], flag: 'ouviu-torterra' }, no: 'decide' },
      { se: { missao: ['anda', 1] }, no: 'espera' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Você. Do Vale do Orvalho. Eu me lembro da sua pata — e do que ela carregava.', vai: 'oi2' },
      oi2: { fala: 'O Círculo votou. Vinte e três Mães a favor de partir, uma contra. Eu sou a uma. Não porque ficar seja seguro: porque há gente pequena vivendo da nossa sombra, e sombra não é coisa que se leve embora sem perguntar.', vai: 'oi3' },
      oi3: { fala: 'Fale com o Pai Torterra, ali. É ele quem carrega a decisão nas costas — de verdade: o bosque anda em cima dele. Depois me diga se eu sou a única que ainda olha pra trás.', faz: { missao: ['anda', 1] } },
      espera: { fala: 'O Pai Torterra. Ouça-o inteiro. Ele fala devagar porque pensa devagar, e pensa devagar porque pensa certo. Quase sempre.' },
      carvalho: { fala: 'Você tem cara de recado. …O Carvalho? Quatrocentos anos, e pede licença. É claro que ele não anda; eu fingia não ver. Diga que a Mãe deixa. Que ele se deite onde o rio é mais largo, e que seja ponte de quem atravessa em paz. E diga que eu vou sentir falta da sombra dele mais que de todas as outras.', faz: { missao: ['fica', 'fim'], flag: 'arvore-ponte', rep: { bosque: 1 } } },
      decide: { fala: 'Você ouviu. Ele não está errado. É isso que me dói.', vai: 'decide2' },
      decide2: { fala: 'São três caminhos. Deixar o bosque ir: o Círculo chega inteiro ao norte, e os de baixo aprendem a viver no sol — os que aprenderem. Chamá-lo de volta pelas raízes do Coração: ele fica, à força, e bosque preso adoece. Ou partir ao meio: as velhas voltam comigo, os novos seguem com ele. E o Círculo, pela primeira vez, deixa de ser um círculo.',
        opcoes: [
          { t: '🍃 Deixar o bosque partir.', faz: { flag: ['cap6', 'bosque-partiu'], missao: ['anda', 'fim'], rep: { bosque: 3, forja: -1 }, dom: 'semente', bag: [['sitrus-berry', 4]] }, vai: 'dPartiu1' },
          { t: '🌳 Segurar o bosque com as raízes do Coração.', faz: { flag: ['cap6', 'bosque-ficou'], missao: ['anda', 'fim'], rep: { bosque: -2, forja: 1, abismo: 1 }, dom: 'raiz', bag: [['leftovers', 1]] }, vai: 'dFicou1' },
          { t: '✂ Dividir: as velhas voltam, os novos seguem.', faz: { flag: ['cap6', 'bosque-rachou'], missao: ['anda', 'fim'], rep: { bosque: 1 }, dom: 'enxerto', bag: [['shell-bell', 1]] }, vai: 'dRachou1' },
          { t: 'Ainda não sei.' }] },
      dPartiu1: { fala: 'Então vão. Eu vou com eles: uma Mãe não vota contra e depois fica pra trás. Abra a pata — é semente andarilha. Onde você pisar, alguma coisa pequena decide viver.' },
      dFicou1: { fala: 'Sinta: as raízes voltando. Dói nelas e dói em mim. Fique com um pedaço — raiz funda segura quem a carrega. E me perdoe por eu ter feito, com as suas patas, o que não quis fazer com as minhas.' },
      dRachou1: { fala: 'Vinte e três Mães nunca vão me perdoar por ter levado metade. Tome: é um enxerto. Duas árvores numa só. Às vezes pega.' },
      dPartiu: { fala: 'O bosque anda. Ouço as aldeias de baixo se calando, uma por uma. Não é raiva o que eu ouço. É gente aprendendo o sol.' },
      dFicou: { fala: 'As folhas caem fora de época. Estamos aqui. Estar não é o mesmo que querer estar — você vai aprender isso antes do fim.' },
      dRachou: { fala: 'Meio bosque faz meia sombra. Os de baixo dizem que basta. Os novos mandam notícia do norte quando o vento ajuda.' }
    } },

  torterra: { nome: 'Pai Torterra', sprite: 389,
    falas: [{ se: { flag: 'cap6' }, no: 'depois' }, { se: { flag: 'ouviu-torterra' }, no: 'denovo' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Chegue devagar, que eu levo um bosque nas costas e ele acorda fácil. …Você é o que anda com Coração. A Mãe te mandou. Ela manda todo mundo que ainda acha que eu posso mudar de ideia.', vai: 'oi2' },
      oi2: { fala: 'Escute a conta de um velho. A Forja cava embaixo de nós. Os humanos cortam em cima de nós. A Corte vende o mapa de onde estamos. E nós damos sombra, fruta e remédio aos três. Faz cem anos que o Círculo cuida de quem o machuca.',
        opcoes: [{ t: 'E as aldeias que ficaram no sol?', vai: 'aldeias' }, { t: 'Pra onde vocês vão?', vai: 'norte' }] },
      aldeias: { fala: 'Eu penso nelas a cada passo. Cada passo, um buraco, e em cada buraco eu sei quem morava do lado. Mas árvore morta não dá sombra a ninguém. Entre sombra por mais dez anos e bosque nenhum pra sempre, eu escolhi o que dói agora.', faz: { flag: 'ouviu-torterra' } },
      norte: { fala: 'Pra serra fria, onde a água nasce. Dizem que lá o machado não chega. Também dizem que lá mora quem anda chamando os Corações — a Mãe não acredita. Eu acredito, e vou assim mesmo. Prefiro vizinho velho e bravo a vizinho novo com fome.', faz: { flag: 'ouviu-torterra' } },
      denovo: { fala: 'Eu já disse o que tinha a dizer. Agora é com ela — e com você, pelo visto. O bosque sempre deixou a última palavra pra quem vem de fora. É um defeito nosso.' },
      depois: { fala: 'Está feito. O que eu carrego nas costas pesa igual, pra onde quer que eu vá.' }
    } },

  vento: { nome: 'Vento', sprite: 275,
    falas: [{ se: { flag: 'bosque-ficou' }, no: 'preso' }, { se: { flag: 'cap6' }, no: 'depois' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Mais um forasteiro vindo convencer a Mãe a nos amarrar. Diga a verdade: você já entregou um Coração a um forno, ou já pensou nisso. Todos pensam. É por isso que a gente vai.' },
      preso: { fala: 'Você nos prendeu pela raiz. Eu senti puxar. Um dia, quando o bosque estiver doente demais pra dar sombra, lembre que eu avisei — e que eu estava de pé.' },
      depois: { fala: 'O vento vai na frente. É o meu serviço. Não espere que eu olhe pra trás.' }
    } },

  /* ===== capítulo 7 ===== */
  lia7: { nome: 'Lia, a patrulheira', sprite: 'patrulheira',
    falas: [
      { se: { flag: 'ponte-de-pe' }, no: 'dPe' }, { se: { flag: 'ponte-caiu' }, no: 'dCaiu' }, { se: { flag: 'ponte-forja' }, no: 'dForja' },
      { se: { missao: ['travessia', 2] }, no: 'decide' },
      { se: { missao: ['travessia', 1] }, no: 'espera' },
      { se: { missao: ['travessia', 0] }, no: 'vao' },
      { se: { flag: 'lia-confia' }, no: 'amiga' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Você. …Tudo bem. Mão vazia, de novo. Eu sei que você não gosta de mim, e não preciso que goste. Preciso que escute, porque a ponte é dos dois lados.', vai: 'fala' },
      amiga: { fala: '{eu}! Eu sabia que o rastro era seu. Senta, se bicho senta. Faz nove noites que eu não durmo direito, e você é a primeira coisa boa que desce daquela trilha.', vai: 'fala' },
      fala: { fala: 'Esta é a Ponte Grande. Do lado de lá, o reino. Do lado de cá, vocês. Enquanto ela está de pé, passa remédio, passa notícia, passa gente como eu — e passa caçador. Agora há um bando de guerra inteiro acampado na outra margem, esperando o vão do meio fechar.', vai: 'fala2' },
      fala2: { fala: 'O vão quem abriu foi o que mora embaixo, entre os pilares. O Alfa do rio. Ele não escolheu lado: derruba tábua de quem pisar. Enquanto ele estiver lá, ninguém atravessa. Eu não sei se isso é um problema ou a única coisa que está nos salvando.',
        opcoes: [{ t: 'Eu desço lá.', faz: { missao: ['travessia', 0] }, vai: 'desce' }, { t: 'E se o vão ficar aberto?', vai: 'aberto' }] },
      aberto: { fala: 'Aí a curandeira não passa, eu não passo, e quem tem parceiro do outro lado não vê mais. E o bando acha outro vau em um mês. Vão aberto ganha tempo. Não ganha paz.',
        opcoes: [{ t: 'Eu desço lá.', faz: { missao: ['travessia', 0] }, vai: 'desce' }, { t: 'Deixa eu pensar.' }] },
      desce: { fala: 'A descida fica na margem, a leste daqui: um buraco no barranco. Leva gente. E se der pra não matar, não mata — ele estava aqui antes da ponte.' },
      vao: { fala: 'O Alfa do rio, entre os pilares. A descida fica na margem, a leste.' },
      espera: { fala: 'O vão fechou. Agora eles vêm — ou você vai. Do outro lado tem um capitão chamado Rufino, que não negocia nem com a própria sombra.' },
      decide: { fala: 'Você voltou inteiro. E o Rufino? …Certo. Sem capitão, o bando discute. É a nossa janela.', vai: 'decide2' },
      decide2: { fala: 'Eu quero a ponte de pé. Com guarda dos dois lados: eu, a Selma, quem mais quiser. Vai continuar passando caçador — não vou mentir pra você. Mas também vai continuar passando quem cura, quem conta, quem ama alguém da outra margem. Ponte é isso. É ruim, e é a única.',
        opcoes: [
          { t: '🌉 Defender a ponte, com a Lia.', faz: { flag: ['cap7', 'ponte-de-pe', 'lia-confia'], missao: ['travessia', 'fim'], rep: { bosque: 1, abismo: 1 }, dom: 'pilar', bag: [['sitrus-berry', 3], ['max-revive', 1]] }, vai: 'dPe1' },
          { t: 'Vou ouvir os outros.' }] },
      dPe1: { fala: 'Então é isso. Ela fica de pé, e eu fico nela. …Obrigada por não me pedir pra escolher um lado. Ninguém nunca tinha deixado de pedir.' },
      dPe: { fala: 'Passaram hoje: uma carroça de remédio, dois meninos fugidos e um caçador que eu mandei voltar. Dois a um. Eu aceito esse placar.' },
      dCaiu: { fala: 'Caiu. Eu estava do lado de cá quando caiu. Minha mãe mora do lado de lá. …Não, não me olha assim. Eu escolhi o lado antes de você escolher a ponte.' },
      dForja: { fala: 'Muralha e pedágio. Passa quem paga. Eu não pago: conheço um vau, três léguas acima. Vou continuar cortando laço — só que agora dos dois lados do muro.' }
    } },

  selma7: { nome: 'Dona Selma, a curandeira', sprite: 'dama',
    falas: [
      { se: { missao: ['remedio', 0], item: 'caixa' }, no: 'trouxe' },
      { se: { missao: ['remedio', 0] }, no: 'cade' },
      { se: { missao: ['remedio', 'fim'] }, no: 'depois' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Olha só quem o rio trouxe. Eu atravessei antes do vão abrir, com a mala de ervas e duas crianças no colo. Do lado de lá eu tratava caçador. Aqui eu trato quem aparecer. Remédio não pergunta de que lado é a ferida.', vai: 'oi2' },
      oi2: { fala: 'Só que metade do meu remédio ficou na ponte. Uma caixa, com o meu nome na tampa, do lado de lá do vão. Se um dia você passar por ela…',
        opcoes: [{ t: 'Eu trago.', faz: { missao: ['remedio', 0] }, vai: 'vai' }, { t: '(Pedir um curativo — {custo}.)', faz: { cura: true } }, { t: 'Agora não.' }] },
      vai: { fala: 'Do lado de lá do vão, encostada no corrimão. E não cheira o vidro azul.' },
      cade: { fala: 'A caixa, na ponte, depois do vão. Enquanto isso eu vou esticando o que tenho.',
        opcoes: [{ t: '(Pedir um curativo — {custo}.)', faz: { cura: true } }, { t: 'Já volto.' }] },
      trouxe: { fala: 'É ela! Inteira! Você não cheirou o vidro azul, cheirou? Bom. Toma — isto eu faço pra quem atravessa por mim.', faz: { perde: 'caixa', missao: ['remedio', 'fim'], rep: { bosque: 1 }, bag: [['full-restore', 2], ['lum-berry', 2]] } },
      depois: { fala: 'Senta, que eu olho essas patas. Quem anda tanto precisa de alguém que olhe.',
        opcoes: [{ t: '(Pedir um curativo — {custo}.)', faz: { cura: true } }, { t: 'Estou bem.' }] }
    } },

  campeao7: { nome: 'O Campeão', sprite: 68,
    falas: [{ se: { flag: 'cap7' }, no: 'depois' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Quatro braços, como combinado. Eu disse que escolhia as minhas lutas. Esta eu escolhi: ninguém me paga, ninguém aplaude, e pela primeira vez eu sei por que estou batendo.' },
      depois: { fala: 'A arena me escreveu, querendo que eu volte. Respondi que estou ocupado segurando uma ponte. Ou o que sobrou dela.' }
    } },

  bia7: { nome: 'Bia', sprite: 'menina',
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'A gente veio. A Lã queria lutar por alguma coisa que não fosse moeda. Eu paro a luta quando <b>eu</b> achar que deu — é a nossa regra. Aqui eu ainda não achei.' }
    } },

  lasca7: { nome: 'Lasca', sprite: 302,
    falas: [{ no: 'banca' }],
    nos: {
      banca: { fala: 'Vendo pros dois lados, compro dos dois lados, e não atravesso nunca. É o negócio perfeito. …O quê? Achou que eu ia ficar no charco polindo pedra?',
        opcoes: [{ t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: 'Depois.' }] }
    } },

  capataz: { nome: 'Capataz Metang', sprite: 375,
    falas: [{ se: { flag: 'ponte-forja' }, no: 'dForja' }, { se: { flag: 'cap7' }, no: 'depois' }, { se: { missao: ['travessia', 2] }, no: 'oferta' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'A Ordem da Forja manda dizer: ponte sem dono é ponte de quem chegar primeiro. Eu cheguei. Ainda não sou dono. Estou medindo.' },
      oferta: { fala: 'Proposta da Ordem, por escrito e carimbada: muralha de pedra nas duas cabeceiras, portão de ferro, pedágio. Passa quem a gente deixar, e paga quem passar. Caçador não passa. Curandeira passa, pagando. É menos bonito que o plano da moça. Funciona nos dias de chuva.',
        opcoes: [
          { t: '⚒ Entregar a ponte à Forja.', faz: { flag: ['cap7', 'ponte-forja'], missao: ['travessia', 'fim'], rep: { forja: 3, bosque: -1, abismo: -1 }, dinheiro: 2500, dom: 'pedagio' }, vai: 'dForja1' },
          { t: 'Vou ouvir os outros.' }] },
      dForja1: { fala: 'Assinado. A primeira pedra sobe amanhã. Você tem passe livre vitalício — é a única exceção da tabela, e eu discuti por ela.' },
      dForja: { fala: 'Trinta passagens ontem. Vinte e nove pagaram. A trigésima era a moça da capa verde, que atravessou a nado só pra não me dar a moeda. Respeito.' },
      depois: { fala: 'A Ordem registra que a oferta foi recusada. Eu registro, à parte, que entendo.' }
    } },

  carvalho7: { nome: 'Vô Carvalho', sprite: 709,
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: '…Cheguei. Devagar, mas cheguei: uma árvore que nunca andou, andando quarenta léguas. Não conte ao Círculo, que eles nunca mais me deixam em paz. Onde é o vão?',
        opcoes: [{ t: '(Mostrar o vão do meio da ponte.)', faz: { flag: 'carvalho-deitou', rep: { bosque: 1 } }, vai: 'deita' }, { t: 'Ainda não.' }] },
      deita: { fala: 'É largo. Bom. Eu sempre fui comprido. O bicho de baixo não derruba árvore: árvore ele conhece. …Diga à Mãe que a sombra, agora, é de quem passa. E pise firme: madeira velha gosta de peso.' }
    } },

  nico7: { nome: 'Nico', sprite: 'menino',
    falas: [{ se: { flag: 'nico-ponte' }, no: 'ficou' }, { se: { missao: ['sozinho', 0] }, no: 'decide' }, { no: 'achado' }],
    nos: {
      achado: { fala: 'NÃO ME… ah. É você. O da estrada. O que não quis lutar do meu lado. …Não conta que eu tô aqui. Nem pros de lá, nem pros de cá.', vai: 'achado2' },
      achado2: { fala: 'Eu atravessei sozinho, antes do vão abrir. O Rufino passou no Vau juntando gente pra “a grande caçada”. Meu pai foi. Eu vim na frente, pra avisar a moça da capa verde. Aí vi os bichos de guarda na ponte e… eu já armei laço pra bicho. Achei que iam me reconhecer pelo cheiro.', faz: { missao: ['sozinho', 0] }, vai: 'decide' },
      decide: { fala: 'Eu tô com fome, com frio e com medo dos dois lados. O que você faz comigo?',
        opcoes: [
          { t: '(Empurrar o menino pra fora: a Lia está lá em cima.)', faz: { flag: 'nico-ponte', missao: ['sozinho', 'fim'], rep: { bosque: 1 }, bag: [['sitrus-berry', 2]] }, vai: 'vai' },
          { t: '(Deixar ele onde está.)' }] },
      vai: { fala: 'Tá. Eu vou. Se ela perguntar por que eu vim, eu falo a verdade: eu armei dez laços, ela desarmou nove, e quem desarma nove merece ser avisada. Toma. É o pão que eu guardei. Eu disse que guardava.' },
      ficou: { fala: 'A Lia me deu uma faca de cortar laço. A minha primeira. Eu já achei três. …Dois eram meus, de antigamente.' }
    } },

  tome7: { nome: 'Tomé Fumeiro', sprite: 'cacador',
    falas: [
      { se: { flag: 'ponte-caiu' }, no: 'dCaiu' }, { se: { flag: 'cap7' }, no: 'depois' },
      { se: { missao: ['travessia', 2] }, no: 'decide' },
      { se: { flag: 'passo-peixe' }, no: 'peixe' },
      { se: { flag: 'passo-fome' }, no: 'fome' },
      { no: 'fogo' }
    ],
    nos: {
      peixe: { fala: 'Você. O da garganta dos peixes. …Baixa a lança, Zeca, esse é meu. Eu não vim com o bando: vim <b>atrás</b> dele. Metade destes rapazes eu ensinei a pescar no inverno passado. O Rufino ensinou a outra metade a ter saudade de carne.' },
      fome: { fala: 'Você. …Eu contei as crianças na descida da serra. Trinta bocas subiram. Vinte e oito desceram. Não vou dizer os nomes das duas, porque você não merece saber. Eu sigo o Rufino porque ele, pelo menos, promete alguma coisa.' },
      fogo: { fala: 'Você. O da fogueira. Meu defumadouro deu uma chama bonita, me disseram — eu estava de costas, carregando criança. Jurei que voltava com mais gente. Olha em volta: voltei.' },
      decide: { fala: 'O Rufino caiu. Os rapazes estão olhando pra mim, e eu estou velho pra ser olhado assim.', vai: 'decide2' },
      decide2: { fala: 'Escuta um caçador cansado. Enquanto essa ponte existir, alguém do meu lado vai atravessar com laço — se não for eu, é outro; se não for este ano, é o que vem. E alguém do seu lado vai atravessar pra cobrar. Derruba. De uma vez. Meus netos crescem sem saber o gosto, e os seus, sem saber o medo. Uma geração de paz por ignorância. É o que eu tenho pra oferecer.',
        opcoes: [
          { t: '🪓 Derrubar a ponte, com o Tomé.', faz: { flag: ['cap7', 'ponte-caiu'], missao: ['travessia', 'fim'], rep: { bosque: 2, forja: -1 }, dom: 'margem', bag: [['max-potion', 2], ['focus-sash', 1]] }, vai: 'dCaiu1' },
          { t: 'Vou ouvir os outros.' }] },
      dCaiu1: { fala: 'Eu corto do meu lado, você do seu. …Pronto. Olha ela indo. Era bonita. Fica com o meu facão: eu não tenho mais onde usar, e é bom que seja assim.' },
      dCaiu: { fala: 'Sem ponte, os rapazes voltaram a pescar. Reclamam. Reclamar é de graça. De noite eu olho pro outro lado e não vejo fogueira nenhuma. Acho que é isso que chamam de paz.' },
      depois: { fala: 'A ponte ficou. Então eu fico também, deste lado, de olho nos meus. É o que um velho pode fazer: atrapalhar.' }
    } },

  tico7: { nome: 'Tico', sprite: 'menino',
    falas: [{ se: { flag: 'passo-fome' }, no: 'fome' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Você é o bicho da serra! Eu lembro! Eu cresci, olha. O tio Tomé diz que eu não posso ir com o bando porque sou pequeno. Eu acho que é porque ele não quer que ninguém vá.' },
      fome: { fala: 'Você é o bicho da serra. …Minha prima não desceu com a gente. O tio não fala o nome dela. Eu falo, baixinho, pra não esquecer: Ana.' }
    } },

  /* ===== capítulo 8 ===== */
  corcova: { nome: 'Dona Corcova', sprite: 323,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Caravana da Corcova: a única sombra daqui até a cidade branca — e a sombra sou eu. Descanso, água de odre e mercadoria. Não pergunte o preço da água.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: 'Só passando.' }] }
    } },

  grao: { nome: 'Grão', sprite: 27,
    falas: [
      { se: { missao: ['gole', 'fim'] }, no: 'grato' },
      { se: { missao: ['gole', 0], flag: 'venceu:salteadores' }, no: 'livre' },
      { se: { missao: ['gole', 0] }, no: 'espera' },
      { no: 'pede' }
    ],
    nos: {
      pede: { fala: 'Psiu. Você bebe água? Eu não bebo muito, eu sou de areia. Mas a caravana bebe, e o único poço que não é salmoura fica ali — onde aquele bando deitou em cima. Faz três dias. A Dona Corcova está repartindo o odre em goles.',
        opcoes: [{ t: 'Eu tiro eles de lá.', faz: { missao: ['gole', 0] }, vai: 'vai' }, { t: 'Boa sorte.' }] },
      vai: { fala: 'Eles são do sal, que nem eu, só que maiores e sem educação. O poço fica a leste da tenda.' },
      espera: { fala: 'O bando ainda está no poço. Eu vigio daqui. Vigiar eu sei.' },
      livre: { fala: 'SAÍRAM! A água tá doce! Bom, eu não sei, eu não bebo. Mas a Dona Corcova chorou, e ela não desperdiça água. Toma: achei isto enterrado. É seu.', faz: { missao: ['gole', 'fim'], rep: { bosque: 1 }, dinheiro: 500, bag: [['max-repel', 2], ['rare-candy', 1]] } },
      grato: { fala: 'Eu cavei um buraco pra você dormir, se quiser. É pequeno. Eu sou pequeno.' }
    } },

  dalva: { nome: 'Irmã Dalva', sprite: 'sabia',
    falas: [
      { se: { flag: 'sal-contou' }, no: 'dContou' }, { se: { flag: 'sal-guardou' }, no: 'dGuardou' }, { se: { flag: 'sal-vendeu' }, no: 'dVendeu' },
      { se: { missao: ['sal', 2] }, no: 'decide' },
      { se: { missao: ['sal', 1] }, no: 'espera' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Shh. Não… ah. Você não vai apagar nada, vai? Os bichos do deserto às vezes esfregam o focinho nas paredes, e o sal esfarela. Eu sou a Dalva. Copio estes desenhos há doze anos, e ainda não cheguei ao fim da segunda rua.', vai: 'oi2' },
      oi2: { fala: 'Aqui existiu uma Fonte. Morreu antes de qualquer reino ter nome. O que sobrou foi isto: uma cidade de sal, e paredes em que gente e bicho aparecem <b>lado a lado</b>. Não um na coleira do outro. Lado a lado, com um pano amarrado entre os dois.',
        opcoes: [{ t: '(Olhar o pano no desenho.)', vai: 'pano' }, { t: '(Olhar pra ela, desconfiado.)', vai: 'desconfia' }] },
      pano: { fala: 'Um nó. Os dois seguravam uma ponta cada um e apertavam juntos. Eu chamo de Primeiros Laços. Laço, naquele tempo, era coisa que <b>dois</b> faziam. Não sei quando virou coisa que um faz no outro.', vai: 'pedido' },
      desconfia: { fala: 'Você tem razão de desconfiar. Eu sou de lá. Do reino que faz bola, gaiola e arena. Vim pra cá porque um desenho destes foi parar na minha mão quando eu era menina, e nunca mais consegui olhar pra uma coleira do mesmo jeito.', vai: 'pedido' },
      pedido: { fala: 'O fim da história está lá embaixo, no leito da Fonte. Eu nunca desci: uma coisa grande mora no escuro, e não gosta de lamparina. Mas você enxerga no escuro, e não precisa de ninguém pra traduzir o lado de vocês. Desce. Depois me conta o que as paredes dizem.', faz: { missao: ['sal', 1] } },
      espera: { fala: 'A descida fica no meio da praça, entre as pedras. Eu espero. Doze anos — mais um dia não pesa.' },
      decide: { fala: 'Você viu. Dá pra ver na sua cara — bicho também faz essa cara. Conta.', vai: 'decide2' },
      decide2: { fala: '(Você risca no sal, devagar: os Antigos. A Nascente. A água subindo. As aldeias embaixo dela.)<br><br>…Uma cheia. De propósito. Pra lavar a gente da terra — e os seus pequenos junto. E já aconteceu uma vez: foi <b>isso</b> que matou esta Fonte. Não foi seca. Foi a primeira Cheia, e o que ela deixou.', vai: 'decide3' },
      decide3: { fala: 'Esta história é sua, não minha. Eu posso copiá-la em trinta panos, e você leva às três ordens: elas brigam, mas ninguém briga contra desenho. Ou a gente guarda — há verdade que só serve pra dar pânico. Ou… tem um Absol ali fora que oferece ouro por ela desde ontem.',
        opcoes: [
          { t: '📜 Levar a história às três ordens.', faz: { flag: ['cap8', 'sal-contou'], missao: ['sal', 'fim'], rep: { forja: 1, bosque: 1, abismo: 1 }, dom: 'memoria' }, vai: 'dContou1' },
          { t: '🤐 Guardar a história.', faz: { flag: ['cap8', 'sal-guardou'], missao: ['sal', 'fim'], rep: { bosque: 1 }, dom: 'silencio', bag: [['max-revive', 1]] }, vai: 'dGuardou1' },
          { t: 'Ainda não sei.' }] },
      dContou1: { fala: 'Trinta panos. Vou desenhar com a mão que treme, mas vou. Leve este: é a memória do sal. Quem a carrega bate onde já está rachado.' },
      dGuardou1: { fala: 'Guardamos, então. Eu, você e as paredes. Tome — é o silêncio deste lugar. Quem o leva, passa sem ser notado.' },
      dContou: { fala: 'Vinte e dois panos já saíram com as caravanas. Dizem que na Forja penduraram um na Bigorna-Mãe. Dizem que no Círculo uma Mãe chorou. Dizem. Eu só desenho.' },
      dGuardou: { fala: 'Às vezes eu acordo de noite e quase conto ao vento. Depois lembro da sua cara, e durmo de novo.' },
      dVendeu: { fala: 'O Absol levou a história embrulhada, como quem leva pão. Eu vi. Não vou dizer nada. Você conhece o seu povo melhor que eu — é o que eu repito pra mim.' }
    } },

  pressagio8: { nome: 'Presságio', sprite: 359,
    falas: [{ se: { flag: 'sal-vendeu' }, no: 'dVendeu' }, { se: { flag: 'cap8' }, no: 'depois' }, { se: { missao: ['sal', 2] }, no: 'oferta' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Você de novo. Ou eu de novo — depende de quem conta. Lembra do pelo molhado? Vim atrás de onde a água vem. As paredes desta cidade sabem. Eu não sei ler parede.' },
      oferta: { fala: 'Você desceu. Eu senti daqui: o seu medo mudou de formato. Então é verdade — a água vem de propósito.', vai: 'oferta2' },
      oferta2: { fala: 'A Corte compra essa história. Inteira, e só pra ela. ₽4.000, e a Regente fica sendo a única que sabe a hora da Cheia. Quem sabe a hora vende o lugar no barco. Eu não gosto do que estou propondo. Sou o arauto: não escolho a notícia.',
        opcoes: [
          { t: '🌑 Vender a história à Corte.', faz: { flag: ['cap8', 'sal-vendeu'], missao: ['sal', 'fim'], rep: { abismo: 3, forja: -1, bosque: -1 }, dinheiro: 4000, dom: 'preco' }, vai: 'dVendeu1' },
          { t: 'Não.' }] },
      dVendeu1: { fala: 'Feito. Pela primeira vez na vida eu levo uma má notícia que vale ouro. Não melhora o gosto.' },
      dVendeu: { fala: 'A Regente leu três vezes. Depois mandou fazer barcos. Poucos.' },
      depois: { fala: 'Você não vendeu. Eu anoto: é a primeira vez que alguém recusa a Corte e eu fico aliviado.' }
    } },

  zelador: { nome: 'O Zelador', sprite: 344,
    falas: [
      { se: { missao: ['no', 'fim'] }, no: 'fim' },
      { se: { flag: 'viu-lacos', falas: ['zelador', 1] }, no: 'falta' },
      { se: { falas: ['zelador', 1] }, no: 'varre' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: '(O boneco de barro gira devagar. Varre o sal da soleira de uma casa onde ninguém mora há muito tempo. Não parece ter notado você.)' },
      varre: { fala: 'Fui feito por duas mãos. Uma com dedos. Uma com garra. As duas apertaram o barro ao mesmo tempo. Por isso eu não paro: nenhuma das duas me disse que podia.' },
      falta: { fala: 'Você desceu e contou os nós na parede. Contou errado. Todo mundo conta errado. Falta um — o que não é desenho. Eu o guardei onde parede parece parede: lá embaixo, do lado do poço seco de dentro, a leste.', faz: { missao: ['no', 0] } },
      fim: { fala: 'Você o achou. Então eu posso parar de varrer por hoje. …Amanhã eu varro de novo. É o que as duas mãos queriam.' }
    } },

  /* ===== capítulo 9 ===== */
  tio9: { nome: 'Tio do Poço', sprite: 79,
    falas: [
      { se: { flag: 'subida' }, no: 'depois' },
      { se: { flag: 'conselho-pleno' }, no: 'escolhe' },
      { se: { missao: ['degelo', 'nao'] }, no: 'oi' },
      { se: { repAbaixo: ['forja', 0] }, no: 'falta' }, { se: { repAbaixo: ['bosque', 0] }, no: 'falta' }, { se: { repAbaixo: ['abismo', 0] }, no: 'falta' },
      { no: 'pleno' }
    ],
    nos: {
      oi: { fala: '…Ah. Você.', vai: 'oi2' },
      oi2: { fala: 'Eu saí de Pedralume no dia em que você saiu. …Cheguei ontem. Vim devagar. Mas vim pelo caminho certo, que é o que os Corações fizeram: todos eles subiram pra cá. Dá pra sentir no chão. …Você sente?', vai: 'oi3' },
      oi3: { fala: 'As três ordens vieram atrás, cada uma por um lado da serra. Acenderam três fogos. Eu acendi este, no meio, e sentei. Alguém tinha que sentar no meio. Fale com quem veio. Depois volte — devagar.', faz: { missao: ['degelo', 0] } },
      falta: { fala: '…Eu contei as pedras de sentar. São três, e tem uma vazia. Alguma ordem não quer te ver: mandou cobrar em vez de mandar conversar. …Não dá pra fazer conselho de dois. Dá pra subir.', vai: 'escolha' },
      pleno: { fala: '…Uma. Duas. …Três. As três. No mesmo fogo.', vai: 'pleno2' },
      pleno2: { fala: 'Faz onze anos que isto não acontece. Eu sei porque fui eu que contei os onze, devagar. Elas não se olham. Mas estão sentadas. …Você fez isso. Não com um Coração: com o caminho todo.', faz: { flag: 'conselho-pleno' }, vai: 'escolha' },
      escolhe: { fala: '…As três continuam no mesmo fogo. Não se falam. Mas ninguém levantou.', vai: 'escolha' },
      escolha: { fala: 'Alguém tem que ir na frente, na geleira. Quem vai na frente chega primeiro à Nascente — e é a voz que os Antigos vão escutar junto com a sua. Fale com quem você quer na ponta. Ou…',
        opcoes: [
          { t: '(Subir por conta própria.)', faz: { flag: ['subida', 'sobe-so', 'cap9'], missao: ['degelo', 2], dom: 'sozinho' }, vai: 'so' },
          { t: 'Vou falar com eles.', faz: { missao: ['degelo', 1] } }] },
      so: { fala: '…Sozinho. Eu vim sozinho também. Demora mais. Chega igual. Vá.' },
      depois: { fala: '…A trilha da geleira fica ao norte. Eu cuido do fogo. Quando você voltar — se der pra voltar — ele vai estar aceso. Devagar, mas aceso.' }
    } },

  brasa9: { nome: 'Brasa', sprite: 126,
    falas: [{ se: { flag: 'sobe-forja' }, no: 'lider' }, { se: { flag: 'subida' }, no: 'ficou' }, { se: { missao: ['degelo', 1] }, no: 'oferta' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Olha quem chegou inteiro ao fim do mundo. A Ordem me mandou porque eu sou a única que você ainda escuta — palavra deles, não minha. Senta perto do fogo do velho. É o único aqui que não é de ninguém.' },
      oferta: { fala: 'Então é pra escolher quem vai na frente. Escuta a proposta da Forja, que é curta: a gente sobe com ferro, chega à Nascente e <b>assenta</b> ela. Cano, registro, guarda. Água pra todo mundo, medida e garantida. Os Antigos não gostam? A gente trouxe corrente.',
        opcoes: [
          { t: '⚒ A Forja lidera a subida.', faz: { flag: ['subida', 'sobe-forja', 'cap9'], missao: ['degelo', 2], rep: { forja: 2, bosque: -1, abismo: -1 }, dom: 'vanguarda' }, vai: 'lider1' },
          { t: 'Vou ouvir os outros.' }] },
      lider1: { fala: 'Certo. Eu vou na ponta, você logo atrás. Se eu cair numa fenda, você herda o martelo. Não ri — é o testamento inteiro.' },
      lider: { fala: 'A ponta é minha. A geleira fica ao norte. Não demora, que ferro frio trinca.' },
      ficou: { fala: 'Não fui escolhida. Tá. Eu subo atrás de qualquer jeito: alguém vai precisar consertar o que os outros quebrarem.' }
    } },

  meganium9: { nome: 'Mãe Meganium', sprite: 154,
    falas: [{ se: { flag: 'sobe-bosque' }, no: 'lider' }, { se: { flag: 'subida' }, no: 'ficou' }, { se: { missao: ['degelo', 1] }, no: 'oferta' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Você veio. Eu também — com o bosque inteiro, ou com a metade, ou sem ele; você sabe qual. Aqui em cima não cresce nada, e mesmo assim eu sinto raiz. É a Nascente. Tudo o que é verde começou nela.' },
      oferta: { fala: 'O Círculo propõe o que sempre propôs: não fazer. Subir, pedir licença e deixar os Antigos terminarem. A Cheia lava o machado, o forno e a gaiola. Lava aldeias também; eu sei. Eu sou a que votou contra — e estou aqui te oferecendo o voto das outras, porque é o voto do Círculo, e eu sou do Círculo.',
        opcoes: [
          { t: '🌿 O Círculo lidera a subida.', faz: { flag: ['subida', 'sobe-bosque', 'cap9'], missao: ['degelo', 2], rep: { bosque: 2, forja: -1, abismo: -1 }, dom: 'seiva' }, vai: 'lider1' },
          { t: 'Vou ouvir os outros.' }] },
      lider1: { fala: 'Então eu vou na frente, pisando leve. Se lá em cima você decidir diferente do Círculo… eu não vou te segurar. Eu nunca soube segurar ninguém. É o meu defeito, e talvez a minha única virtude.' },
      lider: { fala: 'Ao norte, pela geleira. Eu abro o caminho: neve é só água dormindo.' },
      ficou: { fala: 'O Círculo não vai na frente. Então vai atrás, que é onde o bosque sempre esteve: depois que todo mundo passa.' }
    } },

  lasca9: { nome: 'Lasca', sprite: 302,
    falas: [{ se: { flag: 'sobe-abismo' }, no: 'lider' }, { se: { flag: 'subida' }, no: 'ficou' }, { se: { missao: ['degelo', 1] }, no: 'oferta' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'A Regente não sobe montanha: manda quem pode perder. Eu. …Brincadeira. Mais ou menos. Ela disse “vai, que ele te escuta”. Uma vida inteira, e é a primeira vez que alguém me manda representar alguma coisa.' },
      oferta: { fala: 'Proposta da Corte, e eu decorei: a gente chega, os Antigos param, e os Corações voltam pra quem os guardava antes de todo mundo esquecer — nós. A Corte passa a saber onde a água vai nascer, quanto e quando. E vende? …Aluga. Barato. Pros amigos.',
        opcoes: [
          { t: '🌑 A Corte lidera a subida.', faz: { flag: ['subida', 'sobe-abismo', 'cap9'], missao: ['degelo', 2], rep: { abismo: 2, forja: -1, bosque: -1 }, dom: 'vigia' }, vai: 'lider1' },
          { t: 'Vou ouvir os outros.' }] },
      lider1: { fala: '…Sério? Eu? Na frente? Tá. Tá bom. Eu enxergo no escuro e sei onde o gelo está podre, porque gelo podre é que nem negócio podre: brilha demais. Vem atrás de mim e pisa onde eu pisar.' },
      lider: { fala: 'Eu na ponta. Quem diria. Norte, pela geleira — e não conta pra ninguém que eu tô com medo.' },
      ficou: { fala: 'Não fui eu. Tudo bem. Eu vou atrás, anotando quem escorrega. Informação é informação.' }
    } },

  nevasca: { nome: 'Dona Nevasca', sprite: 614,
    falas: [
      { se: { missao: ['pingo', 'fim'] }, no: 'grata' },
      { se: { missao: ['pingo', 0], flag: 'achou-pingo' }, no: 'voltou' },
      { se: { missao: ['pingo', 0] }, no: 'espera' },
      { no: 'pede' }
    ],
    nos: {
      pede: { fala: 'Você vai subir a geleira? Então olha por mim: meu filhote saiu atrás de um floco “maior que os outros” e não voltou. Pingo. Nariz escorrendo, não tem como errar. Eu não posso largar os outros dois.',
        opcoes: [{ t: 'Eu olho.', faz: { missao: ['pingo', 0] }, vai: 'vai' }, { t: 'Não prometo.' }] },
      vai: { fala: 'Ele vai pra onde tem gelo liso. Gosta de escorregar. Puxou ao pai, que escorregou até sumir.' },
      espera: { fala: 'Gelo liso. Nariz escorrendo. Pingo.' },
      voltou: { fala: 'PINGO! Limpa esse nariz.<br><br>…Obrigada. Toma — é do meu inverno, guardado pra emergência. Você foi a emergência.', faz: { missao: ['pingo', 'fim'], rep: { bosque: 1 }, bag: [['full-restore', 2], ['max-revive', 1]] } },
      grata: { fala: 'Agora ele só escorrega onde eu enxergo. Diz que é injusto. É.' }
    } },

  pingo: { nome: 'Pingo', sprite: 613,
    falas: [{ se: { flag: 'achou-pingo' }, no: 'casa' }, { no: 'achado' }],
    nos: {
      achado: { fala: 'Eu achei o floco! Era maior que os outros! Aí ele derreteu. …Você sabe o caminho de volta? Eu sei, mas esqueci.',
        opcoes: [{ t: 'Vem comigo.', faz: { flag: 'achou-pingo' }, vai: 'vai' }] },
      vai: { fala: 'Tá! Eu vou escorregando. É mais rápido, é mais divertido, e a mãe não tá vendo.' },
      casa: { fala: 'A mãe disse que floco grande é armadilha. Eu acho que floco grande é floco grande.' }
    } },

  mamute: { nome: 'Vó Mamute', sprite: 473,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Deita aqui no meu pelo, criatura. Todo mundo deita. Cabe a comitiva inteira, e ainda sobra pelo.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: 'Só passando.' }] }
    } },

  carteiro: { nome: 'Carteiro', sprite: 225,
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'Entrega! …Ah, é freguês. Eu subo esta serra com encomenda nas costas e notícia no bico. Vendo o que sobra da carga. E tenho correspondência pra você — todo mundo que você deixou pra trás resolveu escrever na mesma semana.',
        opcoes: [{ t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: '✉ Ler as cartas.', vai: 'cartas' }, { t: 'Depois.' }] },
      cartas: { fala: 'Tenho um maço inteiro. De onde você quer?',
        opcoes: [
          { t: 'De Pedralume.', vai: 'cPedralume' },
          { t: 'Da Serra do Fumo.', se: { flag: 'passo-peixe' }, vai: 'cSerraPeixe' },
          { t: 'Da Serra do Fumo.', se: { sem: 'passo-peixe' }, vai: 'cSerra' },
          { t: 'Do Vau das Moedas.', se: { flag: 'vau-tirou' }, vai: 'cVauTirou' },
          { t: 'Do Vau das Moedas.', se: { sem: 'vau-tirou' }, vai: 'cVau' },
          { t: 'De Ferro-Fundo.', vai: 'cFerro' },
          { t: 'Da Aldeia dos Tocos.', vai: 'cTocos' },
          { t: 'Da ponte.', se: { flag: 'ponte-caiu' }, vai: 'cPonteCaiu' },
          { t: 'Da ponte.', se: { sem: 'ponte-caiu' }, vai: 'cPonte' },
          { t: 'A que não tem dono.', se: { missao: ['gelo', 'nao'] }, vai: 'cGelo' },
          { t: 'Chega de carta.' }] },
      cPedralume: { fala: '“Filho: a arruda pegou de novo. Não pisa quando voltar. E volta. — Vó Vileplume.”<br><br>Tem cheiro de chá. Lá não tem chá.', vai: 'cartas' },
      cSerraPeixe: { fala: '“O peixe sobe a pedra todo dia. O homem do chapéu ensinou meu filhote a assobiar. Eu deixei. — Mãe Ursa.”', vai: 'cartas' },
      cSerra: { fala: '“O inverno passou. Mais um. A gente conta de um em um, que é como se conta o que foi ganho na briga. — Mãe Ursa.”', vai: 'cartas' },
      cVauTirou: { fala: '“A arena virou celeiro. Dá menos moeda e mais pão. Eu ainda apago as tochas, por costume. — Baltazar.”', vai: 'cartas' },
      cVau: { fala: '“A arena continua cheia. Pintaram a sua cara no muro, do lado da do Campeão. Ficou torta. — Baltazar.”', vai: 'cartas' },
      cFerro: { fala: '“Os nove capacetes foram pra parede da Bigorna-Mãe. Todo mundo que passa tira o próprio. O meu, eu tiro por você. — Tatu.”', vai: 'cartas' },
      cTocos: { fala: '“A praça tem uma sombra do tamanho de um chapéu. O Brotinho senta embaixo e diz que é dele. É. — Roque.”', vai: 'cartas' },
      cPonteCaiu: { fala: '“Daqui não se vê mais o outro lado. De noite eu acho que ouço alguém assobiar de lá. Deve ser o rio. — L.”', vai: 'cartas' },
      cPonte: { fala: '“Hoje passou remédio. Ontem passou um caçador, e eu mandei voltar. Dois a um. — L.”', vai: 'cartas' },
      cGelo: { fala: 'Esta eu não entrego: não tem nome nem selo. Achei presa no gelo, perto de um arvoredo a oeste da trilha da geleira. Não abri. Carteiro não abre. Mas a letra é de gente, e a marca de lacre é uma pata.', faz: { missao: ['gelo', 0] }, vai: 'cartas' }
    } },

  /* ===== capítulo 10 ===== */
  veu10: { nome: 'Dama Véu', sprite: 429,
    falas: [{ se: { missao: ['nascente', 'nao'] }, no: 'oi' }, { no: 'conta' }],
    nos: {
      oi: { fala: 'Você chegou. Eu vim por dentro das sombras, que é mais curto e mais triste. Olhe em volta: verde, no meio do gelo. É a Nascente que faz isso. Tudo o que vive começou aqui — e é aqui que eles querem que termine.', vai: 'oi2' },
      oi2: { fala: 'Os Antigos estão lá dentro, fechando a fonte. Quando fecharem, a água represa atrás da serra; quando a serra ceder, é a Cheia. Você não vai matá-los: ninguém mata o que é mais velho que a morte. Vai fazer com que <b>parem</b>, por um instante. E no instante em que pararem, eles escutam.', faz: { missao: ['nascente', 0] }, vai: 'conta' },
      conta: { fala: 'O que você vai dizer lá dentro depende do que carregou até aqui. Eu conto quatro coisas possíveis na sua bagagem: uma humana que confia em você. Um sino que voltou a quem lembrava. Três ordens sentadas no mesmo fogo. E um nó de pano que não esfarelou. Com as quatro, existe uma palavra que nunca foi dita lá dentro. Com menos, existem as outras — e nenhuma delas é pequena.',
        opcoes: [
          { t: '🪢 (Mostrar o nó de pano.)', se: { item: 'no' }, vai: 'temNo' },
          { t: '🔔 (Pensar no sino de Pedralume.)', se: { flag: 'sino-devolvido' }, vai: 'temSino' },
          { t: '🔥 (Pensar no fogo do meio.)', se: { flag: 'conselho-pleno' }, vai: 'temFogo' },
          { t: '🧣 (Pensar na Lia.)', se: { flag: 'lia-confia' }, vai: 'temLia' },
          { t: 'Entendi.' }] },
      temNo: { fala: 'É ele. Duas pontas. Repare que nenhuma das duas é a “de cima”.' },
      temSino: { fala: 'Ele tocou uma vez só, na cabeça de quem precisava lembrar. Às vezes uma vez basta. Às vezes ele toca de novo.' },
      temFogo: { fala: 'Onze anos sem dividir um fogo. Elas não se olharam — mas ninguém levantou. Eu sei. Eu estava na sombra da terceira pedra.' },
      temLia: { fala: 'Ela subiu. Está ali, sem saber se tem o direito. É a dúvida certa: quem não a tem é que não devia entrar.' }
    } },

  lia10: { nome: 'Lia, a patrulheira', sprite: 'patrulheira',
    falas: [{ se: { falas: ['lia10', 1] }, no: 'oi2' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Eu disse que conhecia um vau. Conheço mais de um. …Não, eu não devia estar aqui: isto é de vocês. Mas, se a água descer, desce em cima da minha gente também — e alguém do lado de lá tinha que subir pra pedir desculpa. Ou pra pedir chance. Ainda não decidi qual.' },
      oi2: { fala: 'Eu não entro com você. Aquilo lá dentro não quer ver gente. Mas leva isto na cabeça: tem uma menina no Vau que para a luta quando acha que deu. Tem um velho na serra que trocou a gaiola pelo anzol. A gente aprende. Devagar, que nem o seu amigo do poço. Mas aprende.' }
    } },

  nico10: { nome: 'Nico', sprite: 'menino',
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'Eu subi com a Lia. Ela disse que não era lugar de criança, e eu disse que eu já armei laço e já desarmei laço, então eu sou o quê? Ela não soube responder. …Eu trouxe pão. Pra depois. Vai ter depois, né?' }
    } },

  bia10: { nome: 'Bia', sprite: 'menina',
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'A Lã quis subir. Disse que queria ver “de onde vem a força”. Eu vim atrás, porque a regra é minha: eu paro quando eu achar que deu. …Eu acho que ainda não deu. Vai lá.' }
    } },

  brasa10: { nome: 'Brasa', sprite: 126,
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'A corrente está pronta. …Não me olha assim. Eu sei o que eu disse lá embaixo. Aqui em cima, ouvindo aquela água, eu já não sei se corrente é a palavra. Mas é a que eu trouxe. Você entra, eu seguro a porta. Se disser “Forja” lá dentro, eu entro e assento. Se disser outra coisa… eu sou ferreira. Eu sei quando o ferro não quer.' }
    } },

  meganium10: { nome: 'Mãe Meganium', sprite: 154,
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'Eu senti a raiz do mundo debaixo das patas a subida inteira. Ela não tem raiva. Tem cansaço. Entre. Eu fico aqui, pisando leve. O que você decidir, o Círculo aceita — foi isso que eu vim garantir, e é a única coisa que uma voz contra consegue garantir.' }
    } },

  lasca10: { nome: 'Lasca', sprite: 302,
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'Cheguei na frente. EU. Olhei pra dentro da gruta e voltei: tem coisa lá que enxerga através de mim, e eu não tô acostumado. Se você falar “Corte” lá dentro, eu assumo. A Regente me mata se eu não assumir. …Se você falar outra coisa, eu digo a ela que a acústica era ruim.' }
    } },

  chansey10: { nome: 'Dona Chansey', sprite: 113,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Pousada do Sino, filial do fim do mundo. Eu vim atrás do Tio do Poço, que sozinho ele esquece de comer. Ele parou no acampamento; eu continuei, porque alguém aqui em cima ia precisar de cama.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: 'Só passando.' }] }
    } },

  kecleon10: { nome: 'Kecleon, o mercador', sprite: 352,
    falas: [{ no: 'banca' }],
    nos: {
      banca: { fala: 'Kecleon tem de tudo, de todas as cores, freguês! Até aqui. Principalmente aqui: fim do mundo é ponto bom, não tem concorrência.',
        opcoes: [{ t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: 'Depois.' }] }
    } },

  antigos: { nome: 'Os Antigos', sprite: '@antigo',
    falas: [{ no: 'escutam' }],
    nos: {
      escutam: { fala: '(Eles pararam. Pela primeira vez desde antes de qualquer nome, a Nascente está em silêncio. Os Antigos não falam: <b>pesam</b>. Você sente a pergunta no peito, como se sente trovão.)<br><br><i>Pequeno. Você carregou os nossos pedaços por dez terras. Viu o que eles fazem com a água, e o que fazem uns com os outros. Nós íamos lavar. Diga por que não.</i>',
        opcoes: [
          { t: '🪢 (Estender o nó de pano: uma ponta pra vocês, outra pra eles.)', se: { flag: ['lia-confia', 'sino-devolvido', 'conselho-pleno'], item: 'no' }, vai: 'laco' },
          { t: '⚒ A Forja assenta a Nascente: água medida, pra todos.', se: { flag: 'sobe-forja' }, vai: 'cano' },
          { t: '🌑 A Corte volta a guardar os Corações.', se: { flag: 'sobe-abismo' }, vai: 'sombra' },
          { t: '🌿 O Círculo pede: terminem. Que o bosque volte.', se: { flag: 'sobe-bosque' }, vai: 'cheiaBosque' },
          { t: '🌊 (Não dizer nada. Deixar a água vir.)', vai: 'cheia' }] },
      laco: { fala: '(Você põe o nó no chão, entre você e eles, e segura uma ponta com os dentes. A outra fica solta, apontando pra boca da gruta — onde uma humana de capa verde espera sem saber se pode entrar.)<br><br><i>…Isto nós conhecemos. Fomos nós que ensinamos, antes da primeira Cheia. Achamos que os dois tinham esquecido.</i>', vai: 'laco2' },
      laco2: { fala: '(Lá fora, um sino rachado toca. Uma vez só. Ninguém o tocou.)<br><br><i>Um nó não se faz com um lado. Chame a que espera. Se ela pegar a outra ponta, nós abrimos a fonte — e ficamos olhando. Desta vez, de perto.</i>', vai: 'laco3' },
      laco3: { fala: 'A Lia entra devagar, de mãos vazias, como no dia em que você a conheceu. Olha pros Antigos. Olha pra você. Pega a ponta.<br><br>A Nascente volta a correr.<br><br>Ninguém foi lavado. Ninguém foi acorrentado. Daqui a muitos anos, numa terra muito longe, um humano e um Pokémon vão andar juntos sem saber por quê. Foi por isto. E foi o Pokémon quem propôs.', faz: { missao: ['nascente', 'fim'], flag: 'final-laco', fim: '🪢 O Laço' } },
      cano: { fala: '(Atrás de você, o martelo da Brasa bate três vezes na pedra. Os Antigos não resistem: olham, com uma curiosidade muito velha, as correntes subindo.)<br><br><i>Vocês preferem a água presa a nenhuma água. É uma escolha de quem já teve sede. Nós entendemos sede.</i>', vai: 'cano2' },
      cano2: { fala: 'A Nascente é assentada em bronze. Canos descem as dez terras: água em toda praça, medida, garantida — e com um guarda de martelo no ombro em cada registro. Ninguém mais disputa um Coração. Ninguém mais bebe sem pedir.<br><br>Os Antigos dormem acorrentados no fundo da gruta. De vez em quando um deles abre um olho e escuta a água passar no cano. Não dá pra saber o que acha.', faz: { missao: ['nascente', 'fim'], flag: 'final-cano', fim: '⚒ O Cano' } },
      sombra: { fala: '(As sombras da gruta se alongam. O Lasca entra, pequeno, tremendo, com uma lamparina que não é dele. Os Antigos olham pra ele por muito tempo.)<br><br><i>Os que ficavam acordados. Nós nos lembramos de vocês. Foram os únicos que avisaram.</i>', vai: 'sombra2' },
      sombra2: { fala: 'Os Corações voltam ao leito, um por um, e a Corte do Abismo volta a vigiá-los — como antes de os sinos serem calados. A água corre. A Regente sabe onde, quanto e quando. As aldeias que a expulsaram agora batem à porta dela, de balde na mão.<br><br>Ela atende todas. Cobra de algumas. Lembra de cada uma.', faz: { missao: ['nascente', 'fim'], flag: 'final-sombra', fim: '🌑 A Sombra' } },
      cheiaBosque: { fala: '(A Mãe Meganium entra e se curva. Não pede perdão nem piedade: pede <b>licença</b>. Os Antigos se viram de novo pra fonte.)<br><br><i>O verde pede o que nós íamos dar. Então que desça com cuidado: devagar nas encostas, depressa nos fornos.</i>', vai: 'cheia2' },
      cheia: { fala: '(Você não diz nada. Talvez não haja o que dizer; talvez eles tenham razão. Os Antigos esperam um instante a mais do que precisavam — e se viram de novo pra fonte.)<br><br><i>Então é como era. Segure-se em alguma coisa alta, pequeno.</i>', vai: 'cheia2' },
      cheia2: { fala: 'A Nascente se fecha. Atrás da serra, a água sobe por três dias. No quarto, a serra cede.<br><br>A Cheia lava o machado, o forno, a gaiola e a arena. Lava Pedralume também, e a toca dos refugiados, e a praça onde uma muda fazia sombra do tamanho de um chapéu. Quando a água baixa, o bosque volta primeiro — verde, enorme, em silêncio.<br><br>Numa parede de sal, muito longe, a última figura do desenho deixa de ser profecia.', faz: { missao: ['nascente', 'fim'], flag: 'final-cheia', fim: '🌊 A Cheia' } }
    } }
};
