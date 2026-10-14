/* ============ ⚔ Saga — o CONTEÚDO do mundo (os 10 capítulos) ============
   Capítulos, mapas, personagens, missões, itens-chave, dons e facções. Dado puro, SEM imports.
   É a camada de FÁBRICA do que o 🌍 Editor de mundo edita: o ⬇ Gerar arquivo do editor produz ESTE arquivo
   inteiro (aí os comentários somem — passa a ser conteúdo gerado, e tudo bem). Como um mapa, uma condição e um
   efeito são escritos está no cabeçalho de `dados-saga.js`; o roteiro, em `docs/saga-historia.md`.
   Quem importa, importa de `dados-saga.js`, que reexporta tudo daqui. */

// `tipos`: quem é "da ordem" (a condição `aliado` e o efeito `parte` leem daqui)
export const FACCOES = {
  forja: { nome: 'Ordem da Forja', emoji: '⚒', tipos: ['steel', 'rock', 'fire'] },
  bosque: { nome: 'Círculo do Bosque', emoji: '🌿', tipos: ['grass', 'bug', 'fairy'] },
  abismo: { nome: 'Corte do Abismo', emoji: '🌑', tipos: ['dark', 'ghost', 'poison'] }
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
  treino: { nome: 'A lição do Cabo', etapas: [
    'Vença os dois brigões perto do portão norte de Pedralume e volte ao Cabo Lairon.'
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
  // o fogo e a fome esvaziam o acampamento: a Selma vai embora com os Fumeiros e a flor não tem mais a quem ir
  erva: { nome: 'A flor rente ao chão', falha: { flag: 'cap2', sem: 'passo-peixe' }, etapas: [
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
      'T.............=Q....X........T',
      'T..hhh........=.........hhh..T',
      'T..hhh........=.........hhh..T',
      'T..hch........=.........hch..T',
      'T...A.........=........F.B...T',
      'T...=.........=..........=...T',
      'T...=.........=..........=...T',
      '1============================2',
      'T.............=..............T',
      'T......f.....W=.....f........T',
      'T...........S.=..............T',
      'T.............=..............T',
      'T..hhh........=.........hhh..T',
      'T..hhh........=.........hhh..T',
      'T..hch........=.........hch..T',
      'T...H.I.......=........L.M.R.T',
      'T...=.........=.K........=...T',
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
      R: { enfeite: true, prop: 'barris' },
      // o tutorial da luta: o Cabo explica a Guarda, e estes dois são o primeiro alvo
      X: { inimigo: { id: 'treino', tipo: 'bando', fala: 'Dois brigões rolam na poeira perto do portão. Quando te veem, param de brigar entre si. Agora o alvo é você.' } }
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
      'T.........""""""===========M=1',
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
      M: { se: { sem: 'viu-mato' }, gatilho: 'mato', como: '=', texto: 'O mato alto do bosque balança sem vento. Tem gente morando ali dentro.<br><br><b>Andar no mato alto chama luta.</b> No caminho de terra ninguém te para.', faz: { flag: 'viu-mato' } },
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
      'T...=.........3.........=....T',
      'T...==========2==========..M.T',
      'T.............1..............T',
      'TTTTTTTTTTTTTTNTTTTTTTTTTTTTTT'
    ],
    objs: {
      N: { porta: ['cidadeSal', 'N'], como: '=' },
      /* O companheiro que vai embora: na entrada do acampamento, cada ordem que você feriu (reputação abaixo de
         zero) chama de volta quem anda com você e é dela. Só acontece se houver alguém assim na comitiva. */
      '1': { se: { repAbaixo: ['forja', 0], aliado: 'forja', sem: 'chamado-forja' }, gatilho: 'chamado-forja', como: '=', texto: 'Na entrada do acampamento, um mensageiro com o martelo marcado no ombro para na sua frente. Não fala com você. Fala com o seu companheiro.<br><br>— A Ordem está chamando os dela. Quem ficar com quem nos prejudicou não entra mais em Ferro-Fundo.<br><br>Seu companheiro olha pra você por um tempo. Depois vai com o mensageiro.', faz: { parte: 'forja', flag: 'chamado-forja' } },
      '2': { se: { repAbaixo: ['bosque', 0], aliado: 'bosque', sem: 'chamado-bosque' }, gatilho: 'chamado-bosque', como: '=', texto: 'Uma enviada do Círculo espera na beira da trilha. Ela não olha pra você: olha pro seu companheiro.<br><br>— O bosque está indo embora, e chama cada um dos seus. Quem não vier agora não acha mais o caminho.<br><br>Seu companheiro encosta em você, uma vez. Depois segue a enviada.', faz: { parte: 'bosque', flag: 'chamado-bosque' } },
      '3': { se: { repAbaixo: ['abismo', 0], aliado: 'abismo', sem: 'chamado-abismo' }, gatilho: 'chamado-abismo', como: '=', texto: 'Um cobrador da Corte sai de trás de uma tenda e barra o seu companheiro, não você.<br><br>— Você deve à Corte, e ela cobra de quem pode. Ou ele volta com a gente, ou a família dele paga.<br><br>Seu companheiro não discute. Olha pra você, pede desculpa do jeito dele, e vai.', faz: { parte: 'abismo', flag: 'chamado-abismo' } },
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
      inicio: { fala: 'Você não é daqui, né? Dá pra ver. Chegou numa hora ruim.', vai: 'inicio2' },
      inicio2: { fala: 'A fonte da aldeia secou faz onze dias. De um dia pro outro: de tarde tinha água, de manhã não tinha mais. Fonte não seca assim.',
        opcoes: [{ t: 'O que aconteceu?', vai: 'oque' }, { t: 'E por que me contar isso?', vai: 'porque' }, { t: 'Não é problema meu.', vai: 'recusa' }] },
      oque: { fala: 'Ninguém sabe. A ferreira diz que o Círculo do Bosque deixou as raízes entupirem a nascente. O Círculo diz que a Forja cavou fundo demais. Os dois brigam, e nenhum subiu lá pra olhar.', vai: 'pedido' },
      porque: { fala: 'Porque aqui todo mundo já escolheu um lado. Você chegou hoje e ainda não tem lado. É de alguém assim que eu preciso.', vai: 'pedido' },
      recusa: { fala: 'Tudo bem. Mas você também vai precisar de água, cedo ou tarde. Se mudar de ideia, eu estou aqui.' },
      pedido: { fala: 'Me faz um favor: ouve a Brasa, aqui na forja, e a Mãe Meganium, no fundo do bosque, a oeste. Depois volta e me conta o que cada uma disse.',
        opcoes: [{ t: 'Eu vou.', faz: { missao: ['fonte', 0] }, vai: 'aceitou' }, { t: 'Preciso pensar.' }] },
      aceitou: { fala: 'Obrigado, {eu}. Só um conselho: não prometa nada a nenhuma das duas.' },
      espera: { fala: 'Já ouviu as duas? A Brasa fica na forja, a nordeste da praça. A Mãe Meganium, no fundo do bosque, a oeste.' },
      doisLados: { fala: 'E então? O que você achou?',
        opcoes: [{ t: 'Nenhum dos dois foi até a nascente.', vai: 'certo' }, { t: 'Os dois têm medo de alguma coisa lá em cima.', vai: 'certo' }] },
      certo: { fala: 'Foi o que eu pensei. Onze dias de briga e ninguém subiu, porque tem alguma coisa nas ruínas. Eu ouço de noite. É bicho, e é grande.', vai: 'lamparina' },
      lamparina: { fala: 'Leva esta lamparina: sem luz não dá pra entrar. As ruínas ficam no fim da Estrada Velha, a leste. É uma gruta no paredão. Se tiver companhia, leva. O que está lá não está sozinho.', faz: { item: 'lamparina', missao: ['fonte', 1] } },
      vaiLa: { fala: 'As ruínas ficam no fim da Estrada Velha, a leste. Descansa na pousada antes de ir.' },
      comCoracao: { fala: 'Então era isso. O Coração da Fonte saiu do lugar.', vai: 'comCoracao2' },
      comCoracao2: { fala: 'Não me dá, não: eu não sei o que fazer com ele. A Brasa sabe prender com ferro; a Mãe Meganium, com raiz. As duas resolvem, mas quem ficar com a pedra deixa a outra com menos água. Você decide.' },
      depoisForja: { fala: 'A água voltou, pelo cano de ferro. O bosque lá embaixo ficou com menos. Alguém tinha que decidir, {eu}, e foi você. Obrigado.', vai: 'norte' },
      depoisBosque: { fala: 'A água voltou. Pouca, e só até onde as raízes deixam. A forja apagou dois fornos e a Brasa não fala mais comigo. Mas as crianças estão bebendo.', vai: 'norte' },
      depoisAbismo: { fala: 'A fonte continua seca, e tem um Sableye rindo sozinho na estrada. Não sei o que você fez, {eu}, mas não era o que eu esperava.', vai: 'norte' },
      norte: { fala: 'Mais uma coisa. O Coração <b>puxa pro norte</b>, esteja onde estiver. Eu sinto isso desde moço. Mandei abrir o Passo do Norte pra você: vai ver o que tem lá.' }
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
      ocupada: { fala: 'Se veio encomendar, vai demorar: sem água eu não consigo temperar o ferro. Se veio só olhar, fica longe da faísca.' },
      padrao: { fala: 'Sem água a forja não trabalha. Não tenho nada pra você agora.' },
      versao: { fala: 'O velho te mandou, né? Então escuta. A Forja cava nesse morro há três gerações e a fonte nunca secou. Aí o Círculo parou de podar as raízes perto da nascente, e onze dias atrás a água sumiu. Pra mim está claro de quem é a culpa.',
        opcoes: [{ t: 'Vocês cavaram mais fundo este ano?', vai: 'fundo' }, { t: 'Alguém da Forja subiu até a nascente?', vai: 'subiu' }] },
      fundo: { fala: 'Abrimos um veio novo este ano, sim, e é fundo. Mas fica longe da nascente: eu mesma medi, duas vezes. Não vai contar isso pro velho como se fosse confissão.', faz: { flag: 'ouviu-forja' }, vai: 'servico' },
      subiu: { fala: 'Mandei dois aprendizes. Voltaram no mesmo dia, sem as ferramentas, e não quiseram contar o que viram. Achei que era medo bobo. Agora já não sei.', faz: { flag: 'ouviu-forja' }, vai: 'servico' },
      servico: { fala: 'Já que você anda por aí: um caixote do meu minério ficou na Estrada Velha quando a carroça quebrou. Tem bicho rondando e ninguém meu quer voltar lá. Se você trouxer, eu pago bem.',
        opcoes: [{ t: 'Trago.', faz: { missao: ['minerio', 0] }, vai: 'combinado' }, { t: 'Agora não.' }] },
      combinado: { fala: 'Fica num recanto de pedra, do lado leste da estrada. É um caixote com um martelo marcado na tampa.' },
      cade: { fala: 'O caixote com a marca do martelo. Recanto de pedra, lado leste da Estrada Velha.' },
      trouxe: { fala: 'Você trouxe mesmo! E inteiro. Meus aprendizes não tiveram essa coragem.', vai: 'paga' },
      paga: { fala: 'Toma. Fiz isto pra um cliente que nunca veio buscar. Vai ser mais útil com você.', faz: { perde: 'minerio', missao: ['minerio', 'fim'], rep: { forja: 2 }, bag: [['muscle-band', 1]], dinheiro: 200 } },
      traida: { fala: 'Um Sableye andou vendendo minério com a <b>minha</b> marca na estrada. Foi você que vendeu pra ele. Não tenho mais nada pra tratar com você.' },
      coracao: { fala: 'Isso é o Coração da Fonte? Ele estava <b>fora</b> do lugar? Então não foi só raiz… e nem só picareta.', vai: 'coracao2' },
      coracao2: { fala: 'Me dá. Eu prendo em bronze e levo a água por cano até a praça. Nunca mais seca. O bosque vai receber menos, é verdade. Não tem como agradar todo mundo.',
        opcoes: [
          { t: '⚒ Entregar o Coração à Forja.', faz: { perde: 'coracao', flag: ['cap1', 'fim-forja'], missao: ['fonte', 'fim'], rep: { forja: 3, bosque: -3 }, dom: 'brasa', dinheiro: 800 }, vai: 'fimForja' },
          { t: 'Ainda vou ouvir o Círculo.' }] },
      fimForja: { fala: 'Você fez bem. O bosque vai reclamar, mas a aldeia vai ter água. Chega perto do forno: vou te ensinar uma coisa.' },
      depoisForja: { fala: 'O cano está firme e a água está correndo. Quando precisar de ferro, {eu}, é só vir.' },
      depoisBosque: { fala: 'Você deu o Coração pras árvores. A água só chega até onde elas deixam, e eu apaguei dois fornos. Não vou te tratar mal, mas não espera que eu fique contente.' },
      depoisAbismo: { fala: 'Eu não sei onde o Coração foi parar, e é melhor eu não saber. Se eu descobrir, vou atrás.' }
    } },

  meganium: { nome: 'Mãe Meganium', sprite: 154,
    falas: [
      { se: { flag: 'fim-bosque' }, no: 'depoisBosque' }, { se: { flag: 'fim-forja' }, no: 'depoisForja' }, { se: { flag: 'fim-abismo' }, no: 'depoisAbismo' },
      { se: { missao: ['fonte', 2] }, no: 'coracao' },
      { se: { missao: ['fonte', 0], sem: 'ouviu-bosque' }, no: 'versao' },
      { no: 'padrao' }
    ],
    nos: {
      padrao: { fala: 'Anda com cuidado por aqui. As plantas estão fracas.' },
      versao: { fala: 'Chega devagar. Estas são as últimas flores do vale que ainda abrem. O Ancião te mandou, não foi? Ele sempre manda alguém de fora.', vai: 'versao2' },
      versao2: { fala: 'A Forja abriu um veio novo na primavera, bem fundo. A terra treme de noite, as raízes mais velhas racharam, e onze dias atrás a água parou. Pra mim, uma coisa causou a outra.',
        opcoes: [{ t: 'O Círculo parou de podar as raízes perto da nascente?', vai: 'raizes' }, { t: 'Alguém do Círculo subiu até lá?', vai: 'subiu' }] },
      raizes: { fala: 'Paramos de podar, sim. E as raízes cresceram na direção da água, porque estavam com sede. Eu não achei que isso fosse fazer mal.', faz: { flag: 'ouviu-bosque' } },
      subiu: { fala: 'A Vó Vileplume tentou. Voltou dizendo que tinha alguma coisa lá em cima, e não quis subir de novo. Eu não insisti.', faz: { flag: 'ouviu-bosque' } },
      coracao: { fala: 'Então o Coração saiu do lugar. Coitado de quem mexeu nele: ninguém faz isso por maldade, faz por precisar.', vai: 'coracao2' },
      coracao2: { fala: 'Deixa comigo. As raízes levam o Coração de volta pra debaixo da terra, e a água volta a descer como antes: pouca, limpa, passando primeiro pelo bosque. A forja vai ficar com menos, eu sei.',
        opcoes: [
          { t: '🌿 Entregar o Coração ao Círculo.', faz: { perde: 'coracao', flag: ['cap1', 'fim-bosque'], missao: ['fonte', 'fim'], rep: { bosque: 3, forja: -3 }, dom: 'casca', bag: [['sitrus-berry', 3], ['leftovers', 1]] }, vai: 'fimBosque' },
          { t: 'Ainda vou ouvir a Forja.' }] },
      fimBosque: { fala: 'Obrigada. Estende a pata. Vai coçar um pouco: é casca, um presente do bosque.' },
      depoisBosque: { fala: 'Está ouvindo? A água voltou a correr.' },
      depoisForja: { fala: 'Agora a água passa por cima de nós, dentro de um cano, e não desce. Não tenho raiva de você. Mas as flores estão morrendo.' },
      depoisAbismo: { fala: 'O Coração não está na forja nem na terra. Eu sinto a falta dele. O que você fez?' }
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
      pedido: { fala: 'Não pisa aí! …Ah, desculpa, filho, não era com você. É que tem um bando acampado nos meus canteiros, ali pro sul, perto do lago. Sem a fonte, os bichos descem todos pra cá atrás de comida.',
        opcoes: [
          { t: 'Eu tiro eles de lá.', faz: { missao: ['canteiros', 0] }, vai: 'vai' },
          { t: 'Eu sou do verde também, Vó.', se: { tipo: ['grass', 'bug', 'fairy'], sem: 'mimo-vo' }, faz: { flag: 'mimo-vo', bag: [['oran-berry', 3]] }, vai: 'parente' },
          { t: 'Boa sorte com isso.' }] },
      parente: { fala: 'Eu vi logo que você é dos nossos! Toma, leva estas frutas. Agora, sobre o bando…',
        opcoes: [{ t: 'Eu tiro eles de lá.', faz: { missao: ['canteiros', 0] }, vai: 'vai' }, { t: 'Outra hora, Vó.' }] },
      vai: { fala: 'Tira eles de lá sem machucar muito, que eles também estão com fome. Mas tira.' },
      ainda: { fala: 'Eles ainda estão lá. Dá pra ouvir daqui.' },
      obrigada: { fala: 'Foram embora! E você nem pisou nas minhas plantas. Toma, é pouco, mas é de coração.', faz: { missao: ['canteiros', 'fim'], rep: { bosque: 2 }, bag: [['oran-berry', 3], ['full-heal', 1]], dinheiro: 120 }, vai: 'dica' },
      dica: { fala: 'Vou te contar uma coisa. No norte do bosque tem uma árvore esquisita: passo por ela há sessenta anos e ela nunca deu sombra. Pra mim aquilo não é árvore.' },
      cha: { fala: 'Senta um pouco. Eu ia te oferecer um chá, mas sem água não tem chá.' },
      magoada: { fala: 'Eu soube pra onde foi o Coração. Minhas plantas morreram de sede. Hoje eu não quero conversa.' }
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
      terceira: { fala: '…Tinha um sino, também. O sino sumiu antes da água. Ninguém mais lembra dele. Eu lembro.', vai: 'terceira2' },
      terceira2: { fala: 'Ele tocava quando vinha perigo pela estrada. Um dia parou de tocar. Procura a árvore que não é árvore, no norte do bosque. Eu ia lá, faz tempo.', faz: { missao: ['sino', 0] } },
      arvore: { fala: 'A árvore que não é árvore. No norte do bosque. …Eu acho.' },
      sino: { fala: '…É ele. O sino. Rachou do lado que eu lembrava.', vai: 'sino2' },
      sino2: { fala: 'Foi o Ancião que mandou tirar. Quando expulsaram a Corte do Abismo da aldeia, o sineiro era meu amigo e não quis tocar o alarme contra eles. Tiraram o sino e mandaram ele embora junto. Isso faz onze <b>anos</b>.', vai: 'sino3' },
      sino3: { fala: 'Você me ouviu até o fim. Quase ninguém tem paciência. Vou te ensinar a olhar devagar: assim você enxerga o que está escondido.', faz: { missao: ['sino', 'fim'], flag: ['confianca-abismo', 'sino-devolvido'], rep: { abismo: 2 }, dom: 'faro' } },
      lembrou: { fala: '…Onze anos. Eu contei certo.' }
    } },

  veu: { nome: 'Dama Véu', sprite: 429,
    falas: [{ se: { item: 'sino' }, no: 'levou' }, { se: { missao: ['sino', 'fim'] }, no: 'levou' }, { no: 'guarda' }],
    nos: {
      guarda: { fala: 'Não se assusta. Pouca gente acha esta clareira. Eu cuido deste túmulo.',
        opcoes: [{ t: 'De quem é o túmulo?', vai: 'quem' }, { t: 'O que tem no baú?', vai: 'bau' }, { t: 'Vou deixar você em paz.' }] },
      quem: { fala: 'É do último sineiro de Pedralume. Ele foi meu mestre. Não quis tocar o sino contra a própria gente, e a aldeia o expulsou. Ele morreu aqui, escondido atrás daquela árvore.' },
      bau: { fala: 'É o sino dele. Está rachado. Pode levar, se tiver a quem mostrar. Só saiba que tem gente em Pedralume que prefere esquecer essa história.' },
      levou: { fala: 'Você levou o sino. Que bom. Alguém precisava se lembrar dele.' }
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
      estranho: { fala: 'A carroça quebrada? Não é minha. Eu não vi nada. Pode ir andando.' },
      amigo: { fala: 'Psiu. Você parece ser dos nossos. Eu sou da Corte do Abismo. A gente foi expulso, mas continua por aí. Se um dia você tiver uma coisa que os dois lados querem, lembra que existe um terceiro — e que ele paga.' },
      minerio: { fala: 'Esse caixote tem a marca do martelo. A ferreira vai te dar um obrigado por ele. Eu dou ₽600 agora, sem pergunta. Ela vai acabar descobrindo, mas aí você já está longe.',
        opcoes: [
          { t: 'Vender o minério (₽600).', faz: { perde: 'minerio', dinheiro: 600, flag: 'vendeu-minerio', missao: ['minerio', 'fim'], rep: { abismo: 2, forja: -3 } }, vai: 'vendido' },
          { t: 'É da Brasa.', vai: 'honesto' }] },
      vendido: { fala: 'Negócio fechado. Se ela perguntar, eu nunca te vi.' },
      honesto: { fala: 'Honesto. Que pena.' },
      coracao: { fala: 'Guarda isso! Você está andando na estrada com o Coração da Fonte na mão?', vai: 'coracao2' },
      coracao2: { fala: 'Vou fazer uma oferta só. A Forja quer o Coração num cano. O Círculo quer debaixo da terra. A Corte cuidava dele até onze anos atrás, antes de ser expulsa, e quer de volta. Pago ₽3.000 e ainda te ensino um truque. A aldeia fica sem água por mais um tempo.',
        opcoes: [
          { t: '🌑 Entregar o Coração à Corte.', faz: { perde: 'coracao', flag: ['cap1', 'fim-abismo'], missao: ['fonte', 'fim'], rep: { abismo: 3, forja: -2, bosque: -2 }, dom: 'sombra', dinheiro: 3000 }, vai: 'fimAbismo' },
          { t: 'Não.', vai: 'naoAinda' }] },
      naoAinda: { fala: 'Pensa com calma. Eu não tenho pressa.' },
      fimAbismo: { fala: 'Feito. Agora repara na sua sombra: ela vai te ajudar a passar sem ser visto. É presente.' },
      depois: { fala: 'Não fala comigo na frente dos outros. Mas a Corte não vai esquecer o que você fez.' },
      tarde: { fala: 'Soube que a fonte se resolveu. Pena. Eu tinha uma proposta boa.' }
    } },

  guarda: { nome: 'Cabo Lairon', sprite: 305,
    falas: [
      { se: { flag: 'cap1' }, no: 'aberto' },
      { se: { flag: 'treino-fim' }, no: 'fechado' },
      { se: { flag: 'venceu:treino' }, no: 'treinou' },
      { se: { missao: ['treino', 0] }, no: 'vai' },
      { no: 'porta' }
    ],
    nos: {
      porta: { fala: 'O Passo do Norte está fechado, por ordem do Ancião. Com a fonte seca, metade da aldeia quer ir embora e a outra metade não quer deixar. Meu serviço é ficar aqui no meio.',
        opcoes: [{ t: 'Me ensina a lutar?', vai: 'aula' }, { t: 'Tudo bem.' }] },
      aula: { fala: 'Ensino. Primeira coisa: lá fora ninguém anda sozinho. Vem sempre em bando, dois, três de uma vez.', vai: 'aula2' },
      aula2: { fala: 'Embaixo da vida de cada um tem um escudo 🛡. É a <b>guarda</b> dele. Golpe super efetivo ou crítico quebra um pedaço. Status quebra meio.', vai: 'aula3' },
      aula3: { fala: 'Quebrou a guarda inteira, ele entra em <b>Ruína</b>: perde a vez e apanha mais. Então escolhe o alvo pelo tipo, não pela vida que sobra.', vai: 'aula4' },
      aula4: { fala: 'Tá vendo aqueles dois brigando perto do portão? Vai lá e testa. Depois volta aqui.', faz: { missao: ['treino', 0] } },
      vai: { fala: 'Os brigões estão ali, perto do portão. Mira na guarda.' },
      treinou: { fala: 'Viu? Quebrou a guarda, ele travou. Mais duas coisas e eu te largo.', vai: 'treinou2' },
      treinou2: { fala: '<b>Perícia</b> é o que você sabe fazer além dos golpes. Não gasta PP, mas cansa: depois de usar, espera umas rodadas pra usar de novo.', vai: 'treinou3' },
      treinou3: { fala: 'E não sobe a serra sozinho. Quem você enfrenta no mato às vezes topa vir junto se ganhar um <b>petisco</b>. Na luta, abre a 🎒 Mochila e oferece. Toma, dois de mel.',
        faz: { bag: [['honey', 2]], flag: 'treino-fim', missao: ['treino', 'fim'] } },
      fechado: { fala: 'O Passo do Norte está fechado, por ordem do Ancião. Com a fonte seca, metade da aldeia quer ir embora e a outra metade não quer deixar. Meu serviço é ficar aqui no meio.' },
      aberto: { fala: 'O Ancião mandou abrir o Passo pra você. Cuidado lá em cima: tem uma fumaça estranha, e faz três noites que ninguém desce de lá.' }
    } },

  chansey: { nome: 'Dona Chansey', sprite: 113,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Bem-vindo à Pousada do Sino. Aqui tem cama, comida e curativo pra você e pra quem estiver com você.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: 'Só passando.' }] }
    } },

  kecleon: { nome: 'Kecleon, o mercador', sprite: 352,
    falas: [{ no: 'banca' }],
    nos: {
      banca: { fala: 'Bem-vindo! O Kecleon vende de tudo. Só água é que está em falta.',
        opcoes: [{ t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: 'Depois.' }] }
    } },

  pichu: { nome: 'Pichu', sprite: 172,
    falas: [{ se: { falas: ['pichu', 2] }, no: 'tio' }, { se: { falas: ['pichu', 1] }, no: 'tres' }, { no: 'oi' }],
    nos: {
      // o tutorial dos controles: o Pichu fica do lado de onde o jogo começa
      oi: { fala: 'Oi! Você é novo aqui? Eu te mostro. Pra falar com alguém, é só andar até encostar nele. Igual você fez comigo.', vai: 'oi2' },
      oi2: { fala: 'Lá em cima tem o nome do lugar. Toca nele e abre o mapa da região. O livrinho 📖 guarda o que você prometeu fazer.', vai: 'oi3' },
      oi3: { fala: 'Se se machucar, a Dona Chansey cuida de você, na pousada do sudoeste. O Kecleon vende coisa, no sudeste. Tudo cobra.', vai: 'oi4' },
      oi4: { fala: 'E quem manda aqui é o Ancião Torkoal, na casa do noroeste. Ele tá procurando alguém pra ver o que houve com a fonte.' },
      tres: { fala: 'Você é aventureiro? Meu irmão disse que aventureiro de verdade fala com todo mundo <b>três</b> vezes. Na terceira os adultos contam o que estavam escondendo.' },
      tio: { fala: 'O Tio do Poço fala, sim. Mas você tem que esperar <b>muito</b>.' }
    } },

  nico: { nome: 'Nico', sprite: 'menino',
    falas: [{ se: { falas: ['nico', 1] }, no: 'depois' }, { no: 'perdeu' }],
    nos: {
      perdeu: { fala: 'Tá bom, você ganhou. Não precisava bater tão forte. …Você entende o que eu falo? Meu pai diz que bicho não entende.',
        opcoes: [{ t: '(Encarar o menino.)', vai: 'encara' }, { t: '(Empurrar a bola de arame de volta pra ele.)', vai: 'bola' }] },
      encara: { fala: '…Entende mesmo. Desculpa por ter te chamado de “esse”. É que no Vau quem tem um Pokémon forte come todo dia. Eu não tenho nenhum.' },
      bola: { fala: 'Essa bola fui eu que fiz, com arame e pano. Não funciona direito. E a moça de capa verde desfaz todos os meus laços.' },
      depois: { fala: 'Eu vou voltar pro Vau e treinar. Um dia você ainda vai querer lutar do meu lado.' }
    } },

  lia: { nome: 'Lia, a patrulheira', sprite: 'patrulheira',
    falas: [{ se: { flag: 'lia-confia' }, no: 'amiga' }, { se: { flag: 'lia-receio' }, no: 'longe' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Calma, eu não vou te machucar. Meu nome é Lia. Aquele laço na trilha era do Nico. Ele arma, eu desarmo.', vai: 'oi2' },
      oi2: { fala: 'Eu sei que vocês não têm motivo pra confiar em gente. Eu sou do Vau: sei o que os caçadores fazem na serra e o que as arenas fazem lá. É por isso que eu fico por aqui, soltando quem cai em laço.',
        opcoes: [
          { t: '(Chegar mais perto.)', faz: { flag: 'lia-confia', bag: [['oran-berry', 2]] }, vai: 'perto' },
          { t: '(Mostrar os dentes.)', faz: { flag: 'lia-receio' }, vai: 'dentes' },
          { t: '(Ir embora.)' }] },
      perto: { fala: 'Obrigada por confiar em mim. Toma, são frutas, pode comer. E se vir um laço de arame, não puxa: dá a volta.' },
      dentes: { fala: 'Tudo bem, eu entendo. Vou continuar cortando os laços do mesmo jeito.' },
      amiga: { fala: 'Toma cuidado no Passo. Os Fumeiros são caçadores de verdade, não crianças.' },
      longe: { fala: 'Eu fico do meu lado da trilha e você do seu. Sem problema.' }
    } },

  /* ===== capítulo 2 ===== */
  nara: { nome: 'Nara, a batedora', sprite: 162,
    falas: [{ se: { flag: 'cap2' }, no: 'fim' }, { se: { missao: ['passo', 'nao'] }, no: 'pare' }, { no: 'andamento' }],
    nos: {
      pare: { fala: 'Psst! Abaixa! …Ah, você veio de Pedralume. Está vendo a fumaça lá em cima? São caçadores, cozinhando.', vai: 'pare2' },
      pare2: { fala: 'São os Fumeiros. Acamparam no meio do Passo: caçam de dia e defumam a carne de noite. A gente se escondeu numa toca a oeste da trilha, entre as pedras. A Mãe Ursa quer falar com quem souber lutar.',
        opcoes: [{ t: 'Me leva até ela.', faz: { missao: ['passo', 0] }, vai: 'vai' }, { t: 'Quantos vocês são?', vai: 'quantos' }] },
      quantos: { fala: 'Menos do que antes. Prefiro não contar.', opcoes: [{ t: 'Me leva até ela.', faz: { missao: ['passo', 0] }, vai: 'vai' }] },
      vai: { fala: 'É a oeste, entre as pedras. E olha onde pisa: tem laço de arame na trilha.' },
      andamento: { fala: 'A toca fica a oeste, entre as pedras. O acampamento deles, a leste. O Alfa do Passo está na gruta do norte. Não vai lá sozinho.' },
      fim: { fala: 'O Passo ainda cheira a fumaça, mas já dá pra dormir tranquilo.' }
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
      quem: { fala: 'Quem é você? …Tanto faz. Fica longe da entrada, pra ninguém de fora te ver.' },
      conta: { fala: 'Você é quem resolveu a fonte de Pedralume? Aqui o problema é outro: caçadores armados. Tenho três planos na mesa e preciso de ajuda pra escolher.', vai: 'conta2' },
      conta2: { fala: 'O Cascalho, da Forja, quer queimar o defumadouro deles. O Cogu, do Círculo, quer fugir com todo mundo por cima da serra, no frio, com os filhotes. E tem um Sableye lá fora com outra ideia, que ele não quis contar na minha frente.', faz: { missao: ['passo', 1] } },
      espera: { fala: 'Fala com o Cascalho e com o Cogu, aqui dentro. Depois vai ver o acampamento, a leste. Quero que você veja com os próprios olhos antes de opinar.' },
      decide: { fala: 'Você viu o acampamento: as gaiolas, e as crianças deles também. Qual é o plano?',
        opcoes: [
          { t: '⚒ Queimar o defumadouro, com o Cascalho.', faz: { flag: ['cap2', 'passo-fogo', 'tome-jurou'], missao: ['passo', 'fim'], rep: { forja: 3, bosque: -1 }, dom: 'faisca' }, vai: 'fogo' },
          { t: '🌑 Esvaziar a despensa deles, com o Lasca.', se: { flag: 'lasca-plano' }, faz: { flag: ['cap2', 'passo-fome'], missao: ['passo', 'fim'], rep: { abismo: 3, bosque: -2 }, dinheiro: 900, dom: 'unha' }, vai: 'fome' },
          { t: '🐟 Mostrar a subida dos peixes ao chefe deles.', se: { flag: ['alfa-calmo', 'tome-ouviu'] }, faz: { flag: ['cap2', 'passo-peixe', 'tome-deve', 'lia-confia'], missao: ['passo', 'fim'], rep: { bosque: 2, forja: -1 }, dom: 'correnteza' }, vai: 'peixe' },
          { t: 'Ainda não sei.' }] },
      fogo: { fala: 'O defumadouro queimou e eles desceram a serra antes de amanhecer. O chefe olhou pra trás antes de ir, e eu acho que ele volta. Ganhamos um inverno de sossego.' },
      fome: { fala: 'A despensa amanheceu vazia e eles foram embora em dois dias. As crianças saíram no colo, com fome. O Sableye deixou a minha parte do dinheiro. Eu não quis. Fica pra você.' },
      peixe: { fala: 'Eu vi de longe: você, o Alfa e o chefe deles olhando os peixes subirem a pedra. Ele baixou a lança e tirou o chapéu. Acho que temos uma trégua.' }
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
      padrao: { fala: 'Eu sou da Forja. A gente resolve as coisas na força.' },
      plano: { fala: 'Meu plano é simples: o defumadouro é de madeira seca e gordura. É só pôr fogo, e eles perdem a carne do mês. Sem comida, vão embora.',
        opcoes: [{ t: 'E se voltarem com mais gente?', vai: 'mais' }, { t: 'Entendi.', faz: { flag: 'ouviu-cascalho' } }] },
      mais: { fala: 'Se voltarem, a gente queima de novo.', faz: { flag: 'ouviu-cascalho' } },
      lanca: { fala: 'Onde você achou isso? Me mostra. …Essa ponta tem a marca do martelo. É ferro <b>nosso</b>, da Forja.', vai: 'lanca2' },
      lanca2: { fala: 'Eu não sei quem vendeu, juro. Mas alguém da Ordem vendeu arma pros caçadores, e foi uma delas que feriu o Alfa.', faz: { flag: 'lanca-forja', missao: ['lanca', 'fim'], rep: { forja: -1 } } },
      calado: { fala: 'Vou levar isso pra Ferro-Fundo pessoalmente. Não conta pra Mãe Ursa ainda.' },
      depois: { fala: 'Está feito. Não adianta ficar pensando.' }
    } },

  cogu: { nome: 'Cogu', sprite: 286,
    falas: [{ se: { flag: 'cap2' }, no: 'depois' }, { se: { missao: ['passo', 1], sem: 'ouviu-cogu' }, no: 'plano' }, { no: 'padrao' }],
    nos: {
      padrao: { fala: 'Fala baixo, por favor.' },
      plano: { fala: 'Eu conheço um caminho por cima da serra. São três dias, sem trilha. A gente foge e deixa o Passo pra eles. Ninguém precisa lutar.',
        opcoes: [{ t: 'Com filhote, no frio?', vai: 'frio' }, { t: 'E quem não aguenta a subida?', vai: 'frio' }] },
      frio: { fala: 'Alguns não vão aguentar a subida, eu sei. Mas a maioria chega. No plano do Cascalho pode não sobrar ninguém.', vai: 'frio2' },
      frio2: { fala: 'Tem outra saída, se você tiver coragem. Lá em cima, na garganta do norte, os peixes sobem a pedra na cheia. Tem peixe pra todo mundo, até pros humanos. Só que o Alfa do Passo está ferido e não deixa ninguém chegar perto.', faz: { flag: 'ouviu-cogu' } },
      depois: { fala: 'Eu ainda lembro do caminho por cima da serra. Pode ser útil um dia.' }
    } },

  wooper: { nome: 'Wooper', sprite: 194,
    falas: [{ se: { falas: ['wooper', 1] }, no: 'fruta' }, { no: 'medo' }],
    nos: {
      medo: { fala: 'Eu não estou com medo. Só estou quietinho.' },
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
      pede: { fala: 'Minha irmã ficou presa numa gaiola, no acampamento. Você é grande. Você consegue abrir a gaiola?',
        opcoes: [{ t: 'Eu abro.', faz: { missao: ['gaiolas', 0] }, vai: 'como' }, { t: 'Não prometo.' }] },
      como: { fala: 'O vigia guarda a chave num baú, no mato alto atrás das barracas. Eu vi quando estava escondido.' },
      espera: { fala: 'A chave fica no mato alto, atrás das barracas. E tem mais gente presa além da minha irmã.' },
      voltou: { fala: 'ELA VOLTOU! E a coruja também! Toma, é tudo o que eu juntei.', faz: { missao: ['gaiolas', 'fim'], rep: { bosque: 1 }, bag: [['oran-berry', 4], ['revive', 1]] } },
      obrigado: { fala: 'Minha irmã disse que você nem fez barulho. Quero ser igual a você quando eu crescer.' }
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
      oi: { fala: 'Olha quem subiu a serra. Eu? Estou de passagem. Aproveita: tenho umas coisas pra vender.',
        opcoes: [{ t: '🛒 Ver o que caiu das carroças.', faz: { loja: true } }, { t: 'Nada, obrigado.' }] },
      plano: { fala: 'O Cascalho quer fogo e o Cogu quer fugir. Eu tenho um plano melhor: eles guardam toda a carne numa despensa só, e eu sei a hora em que o vigia dorme. A gente esvazia tudo numa noite, e eles vão embora por falta de comida. Ninguém morre.',
        opcoes: [{ t: 'E as crianças do acampamento?', vai: 'criancas' }, { t: 'E o que você ganha?', vai: 'ganha' }] },
      criancas: { fala: 'Vão passar fome por uns dias. Ninguém morre de fome em dois dias. Eu disse que ninguém morre, não que ninguém sofre.', faz: { flag: 'lasca-plano' } },
      ganha: { fala: 'Carne defumada vende bem no Vau. Metade do dinheiro é sua.', faz: { flag: 'lasca-plano' } },
      lanca: { fala: 'Deixa eu ver essa ponta. Marca do martelo! A Forja vendendo arma pra quem caça Pokémon. A Corte paga bem por um segredo desses.',
        opcoes: [{ t: 'Vender o segredo (₽700).', faz: { flag: 'lanca-vendida', missao: ['lanca', 'fim'], dinheiro: 700, rep: { abismo: 2 } }, vai: 'vendida' }, { t: 'Fica comigo.' }] },
      vendida: { fala: 'A Corte agradece. Um dia a Forja vai ter que explicar isso.' },
      depois: { fala: 'O Passo se resolveu, e eu vou descer o rio. Tem uma cidade lá embaixo que vive de luta e aposta. Quer comprar alguma coisa antes?',
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
      primeiro: { fala: 'Um bicho entrando no acampamento sem medo. Baixa a lança, Zé. Deixa ele chegar.', vai: 'primeiro2' },
      primeiro2: { fala: 'Você me olha como se eu fosse um monstro. Meu nome é Tomé. Eu tinha quarenta cabeças de gado no litoral, e uma praga matou todas em um mês. Tenho trinta pessoas pra alimentar aqui.',
        opcoes: [{ t: '(Olhar para as gaiolas.)', vai: 'gaiolas' }, { t: '(Olhar para as crianças.)', vai: 'criancas' }] },
      gaiolas: { fala: 'Eu sei o que tem nas gaiolas, e sei que é errado. Durmo mal por causa disso. Mas as crianças estão comendo, e eu faria tudo de novo.', faz: { flag: 'tome-falou', missao: ['passo', 2] } },
      criancas: { fala: 'Três são minhas. As outras perderam os pais na praga. Elas não têm culpa do que eu caço.', faz: { flag: 'tome-falou', missao: ['passo', 2] } },
      denovo: { fala: 'Ainda aqui? Se veio pedir pra eu soltar os das gaiolas, me diz primeiro o que a gente vai comer.' },
      peixes: { fala: 'O bicho grande lá de cima parou de urrar. Fazia três noites que ninguém dormia. Foi você?', vai: 'peixes2' },
      peixes2: { fala: '(Você risca na terra: a garganta do norte. Água. Peixe subindo a pedra.)<br><br>Peixe? Lá em cima, na cheia?', vai: 'peixes3' },
      peixes3: { fala: 'Se for verdade, eu não preciso mais de gaiola. Me mostra. Eu quero ver.', faz: { flag: 'tome-ouviu' } },
      tregua: { fala: 'A gente pesca de manhã e o bicho grande pesca de tarde. As gaiolas viraram viveiro de peixe. Eu te devo essa. Se precisar de mim, é só chamar.' }
    } },

  selma: { nome: 'Dona Selma, a curandeira', sprite: 'dama',
    falas: [
      { se: { missao: ['erva', 'fim'] }, no: 'depois' },
      { se: { missao: ['erva', 0], item: 'erva' }, no: 'trouxe' },
      { se: { missao: ['erva', 0] }, no: 'cade' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Não tenha medo. Eu sou curandeira e trato de quem aparecer, gente ou bicho.', vai: 'oi2' },
      oi2: { fala: 'O bicho grande da gruta do norte levou uma lançada, e a ferida vai infeccionar. Na encosta do Passo, perto da trilha de cima, cresce uma erva azul. Se você me trouxer, eu faço um unguento pra ele.',
        opcoes: [{ t: 'Eu trago.', faz: { missao: ['erva', 0] }, vai: 'vai' }, { t: '(Pedir um curativo — {custo}.)', faz: { cura: true } }, { t: 'Agora não.' }] },
      vai: { fala: 'É uma flor azul, pequena, rente ao chão. E só chega perto do bicho com o unguento pronto: animal ferido ataca.' },
      cade: { fala: 'A flor azul fica na encosta do Passo, perto da trilha de cima.' },
      trouxe: { fala: 'É essa mesma. Um instante… pronto. Leva o unguento. Chega devagar, de lado, e deixa ele cheirar primeiro.', faz: { perde: 'erva', item: 'unguento', missao: ['erva', 'fim'] } },
      depois: { fala: 'Você voltou inteiro, e pelo jeito o bicho também. Senta, deixa eu ver essas patas.',
        opcoes: [{ t: '(Pedir um curativo — {custo}.)', faz: { cura: true } }, { t: 'Estou bem.' }] }
    } },

  tico: { nome: 'Tico', sprite: 'menino',
    falas: [{ se: { falas: ['tico', 1] }, no: 'tio' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Você é de comer ou de brincar? …É brincadeira! A vó Selma disse pra eu não falar isso.' },
      tio: { fala: 'Meu tio Tomé não é mau. Ele só está com fome há muito tempo.' }
    } },

  preso1: { nome: 'Teddiursa presa', sprite: 216,
    falas: [{ no: 'presa' }],
    nos: {
      presa: { fala: 'Você não é deles. Fala baixo. O vigia dorme depois do almoço.',
        opcoes: [{ t: 'Abrir a gaiola.', se: { item: 'chave' }, faz: { flag: 'solto1' }, vai: 'livre' }, { t: 'Eu volto.' }] },
      livre: { fala: 'Meu irmão está na toca? Eu vou pra lá. Obrigada!' }
    } },
  preso2: { nome: 'Hoothoot preso', sprite: 163,
    falas: [{ no: 'preso' }],
    nos: {
      preso: { fala: 'Se você abrir essa porta, eu nunca mais reclamo de nada.',
        opcoes: [{ t: 'Abrir a gaiola.', se: { item: 'chave' }, faz: { flag: 'solto2' }, vai: 'livre' }, { t: 'Eu volto.' }] },
      livre: { fala: 'Estou livre! Obrigado!' }
    } },
  preso3: { nome: 'Stantler velho', sprite: 234,
    falas: [{ se: { flag: 'ouviu-velho' }, no: 'fica' }, { no: 'velho' }],
    nos: {
      velho: { fala: 'Pode guardar a chave, filho. Eu estou velho, minha perna não presta, e aqui a curandeira cuida de mim. Lá fora eu não duro uma semana.', vai: 'velho2' },
      velho2: { fala: 'Eu sei que isto é uma gaiola. Mas eu escolhi ficar. Deixa a porta fechada.', faz: { flag: 'ouviu-velho' } },
      fica: { fala: 'Deixa a porta como está. E não precisa ter pena: eu escolhi.' }
    } },

  alfa2: { nome: 'O Alfa do Passo', sprite: '@alfa',
    falas: [{ se: { flag: 'alfa-calmo' }, no: 'calmo' }, { no: 'ferido' }],
    nos: {
      ferido: { fala: '(O Alfa rosna baixo, deitado. A lança ainda está no flanco dele. Você trouxe o unguento da curandeira.)',
        opcoes: [{ t: '(Chegar devagar, de lado.)', vai: 'devagar' }, { t: '(Recuar.)' }] },
      devagar: { fala: '(Ele deixa você chegar. Você puxa a lança de uma vez e passa o unguento na ferida. O Alfa urra, depois se acalma e encosta a cabeça em você. Então olha pra garganta do norte, onde a água desce.)',
        faz: { flag: ['alfa-calmo', 'venceu:alfa2', 'pegou-lanca'], item: 'lanca', perde: 'unguento', missao: ['lanca', 0], rep: { bosque: 1 } } },
      calmo: { fala: '(O Alfa dorme de lado. Quando você passa, ele abre um olho, te reconhece e volta a dormir.)' }
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
      longe: { fala: 'Você de novo. Eu fico deste lado do rio e você do outro, como combinamos.' },
      amiga: { fala: 'Você chegou ao Vau. Antes de entrar, um aviso: lá ninguém vai te caçar. Vão te <b>admirar</b>. Quem luta bem na arena ganha comida, cama e fama. Tem Pokémon lá que não quer ir embora.', vai: 'amiga2' },
      amiga2: { fala: 'Eu cresci nessa cidade e tive um parceiro de arena. Ele viveu bem e morreu velho. Até hoje eu não sei se aquilo era certo.' },
      coracao: { fala: 'Isso que você está carregando… a arena foi construída em cima disso, não foi? Eu sempre achei as lutas de lá fortes demais.', vai: 'coracao2' },
      coracao2: { fala: 'Se você quiser tirar isso da cidade, eu sei um lugar: onde o rio entra na pedra, a meio dia daqui. Enterrado lá, ninguém acha. O Vau vai sofrer, porque vive da arena. Mesmo assim eu te ajudo, se você pedir.',
        opcoes: [
          { t: '💧 Tirar o Coração do Vau, com a Lia.', faz: { perde: 'coracao2', flag: ['cap3', 'vau-tirou'], missao: ['vau', 'fim'], rep: { bosque: 2, abismo: -1 }, dom: 'eco' }, vai: 'tirou' },
          { t: 'Ainda vou pensar.' }] },
      tirou: { fala: 'Está enterrado. A arena fechou: disseram que os Pokémon perderam a vontade de lutar. Passei na frente da casa do Mestre e ele só ficou me olhando.' }
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
      oi: { fala: 'Você não é daqui, né? Eu sou a Bia, e esta é a Lã, minha parceira. A gente lutava na arena toda semana.', vai: 'oi2' },
      oi2: { fala: 'Eu parei. Na última luta ela ganhou, o outro saiu carregado, e ela ficou contente. Eu não consegui ficar. Agora ela não fala comigo. Você entende o que ela diz, não entende? Pergunta o que ela quer.',
        opcoes: [{ t: 'Eu pergunto.', faz: { missao: ['bia', 0] }, vai: 'obrigada' }, { t: 'Isso é entre vocês duas.' }] },
      obrigada: { fala: 'Ela está aí do lado, fingindo que não ouve.' },
      espera: { fala: 'Pergunta pra ela, por favor. Eu quero saber, seja o que for.' },
      decide: { fala: 'E aí, o que ela disse? …Ela <b>quer</b> lutar. Ela gosta. E eu achando que estava salvando ela.',
        opcoes: [
          { t: 'Lutem juntas — do jeito de vocês, com a regra de vocês.', faz: { flag: 'bia-juntos', missao: ['bia', 'fim'], rep: { forja: 1 }, bag: [['sitrus-berry', 2]] }, vai: 'juntas' },
          { t: 'Deixa ela ir lutar com outra pessoa.', faz: { missao: ['bia', 'fim'], rep: { abismo: 1 } }, vai: 'sozinha' },
          { t: 'Eu não decido isso por vocês.' }] },
      juntas: { fala: 'A gente combinou: ela luta, e eu paro a luta quando achar que passou do ponto. Ela reclamou, mas aceitou.' },
      sozinha: { fala: 'Ela foi lutar com o Nico e ganha quase sempre. Eu assisto do fundo. Dói, mas foi o que ela quis.' }
    } },

  la: { nome: 'Lã', sprite: 180,
    falas: [{ se: { missao: ['bia', 'fim'] }, no: 'fim' }, { se: { missao: ['bia', 0] }, no: 'fala' }, { no: 'muda' }],
    nos: {
      muda: { fala: '(A Flaaffy olha pra você, depois pra menina, e vira o rosto.)' },
      fala: { fala: 'Ela te mandou perguntar, né? Então diz pra ela: eu <b>gosto</b> de lutar. Do barulho, da areia, de ganhar. Ninguém me prendeu: eu fui morar com ela porque quis. E agora ela me trata como se eu estivesse doente.', vai: 'fala2' },
      fala2: { fala: 'Eu não preciso ser salva. Só quero que ela torça por mim de novo.', faz: { flag: 'ouviu-la' } },
      fim: { fala: '(A Flaaffy solta umas faíscas, satisfeita.)' }
    } },

  kiko: { nome: 'Kiko, o porteiro', sprite: 58,
    falas: [{ se: { flag: 'cap3' }, no: 'saida' }, { se: { missao: ['vau', 'nao'] }, no: 'oi' }, { no: 'denovo' }],
    nos: {
      oi: { fala: 'Alto! …Ah, é um Pokémon. Pode passar, Pokémon não paga pedágio. Eu sou o Kiko e guardo o portão. Quem manda aqui é o Mestre Baltazar.', faz: { missao: ['vau', 0] } },
      denovo: { fala: 'O Mestre Baltazar fica na praça, perto do poço. A arena é a casa de pedra lá em cima. Se quiser descansar, tem a casinha do portão. E eu também vendo umas coisas.',
        opcoes: [{ t: '🛏 Descansar na casinha do portão ({custo}).', faz: { cura: true } }, { t: '🛒 Ver a despensa do portão.', faz: { loja: true } }, { t: 'Só passando.' }] },
      saida: { fala: 'Vai seguir o rio? Abri o portão do sul pra você. Lá embaixo é o charco. Se quiser descansar ou comprar alguma coisa antes, é só falar.',
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
      oi: { fala: 'Um Pokémon solto, andando sozinho pela cidade. Isso é raro. Eu sou o Baltazar. Eu cuido da arena, e a arena sustenta o Vau.', vai: 'oi2' },
      oi2: { fala: 'Antes de me julgar: vinte anos atrás isto aqui era lama e doença. Aí descobriram que nesta praça os Pokémon lutam melhor do que em qualquer lugar. Hoje vem gente de três rios pra assistir, e a cidade inteira vive disso.',
        opcoes: [{ t: '(Olhar para a arena.)', faz: { missao: ['vau', 1] }, vai: 'regra' }, { t: '(Virar as costas.)' }] },
      regra: { fala: 'Quer conhecer a arena? Pode entrar. E se quiser descer ao porão, onde fica a Fera, a regra é a mesma pra todos: vencer os dois desafiantes da tarde.' },
      desafio: { fala: 'São dois desafiantes, dentro da arena, um de cada lado. Vença os dois e o guarda te deixa descer.' },
      desce: { fala: 'Você venceu os dois, e sem dono! Pode descer ao porão. Só não chega muito perto da grade da Fera.' },
      ferro: { fala: 'A grade do porão? É ferro de primeira. Eu compro de uns Pokémon que vêm de noite e não dizem o nome. Tudo o que eles vendem tem um martelo marcado. Achei que você soubesse: são dos seus.', faz: { missao: ['ferro', 'fim'], flag: 'forja-vende', rep: { forja: -1 } } },
      coracao: { fala: 'Então era isso que tinha debaixo da arena. Vinte anos achando que o segredo era a areia, ou o meu jeito de escolher lutador. Era uma pedra.', vai: 'coracao2' },
      coracao2: { fala: 'Devolve, por favor. Sem isso a arena fecha, e duzentas pessoas voltam pra miséria. Os Pokémon que lutam aqui são bem tratados. Pensa no que acontece com a cidade.',
        opcoes: [
          { t: '🏟 Devolver o Coração ao alicerce.', faz: { perde: 'coracao2', flag: ['cap3', 'vau-deixou'], missao: ['vau', 'fim'], rep: { forja: 1, bosque: -2 }, dinheiro: 1200, dom: 'torcida' }, vai: 'deixou' },
          { t: 'Ainda não decidi.' }] },
      deixou: { fala: 'A pedra voltou pro lugar. Hoje tem luta, e você tem lugar na primeira fila sempre que quiser. Obrigado.' },
      dTirou: { fala: 'A arena fechou. Metade da cidade foi embora no primeiro mês. Eu fico: alguém tem que cuidar do que sobrou.' },
      dOrdem: { fala: 'Apareceram uns Sableye dizendo que a arena agora tem sócio. As lutas continuam. Só o dinheiro é que mudou de dono.' }
    } },

  lasca3: { nome: 'Lasca', sprite: 302,
    falas: [{ se: { flag: 'vau-ordem' }, no: 'socio' }, { se: { flag: 'cap3' }, no: 'tarde' }, { se: { missao: ['vau', 3] }, no: 'coracao' }, { no: 'apostas' }],
    nos: {
      apostas: { fala: 'Vai apostar? …Ah, é você. Vou te contar uma coisa: esta arena foi construída em cima de uma Fonte. Os humanos não sabem o que têm no porão. A Corte sabe, mas nunca conseguiu descer.' },
      coracao: { fala: 'Você desceu e voltou com ele! Eu sabia que valia a pena te seguir.', vai: 'coracao2' },
      coracao2: { fala: 'Proposta da Corte: a pedra volta pro lugar e a arena continua, mas quem passa a cuidar do alicerce somos nós. A cidade segue vivendo, e a Corte volta a guardar um Coração. Eu também ganho a minha parte, claro.',
        opcoes: [
          { t: '🌑 Entregar o alicerce à Corte.', faz: { perde: 'coracao2', flag: ['cap3', 'vau-ordem'], missao: ['vau', 'fim'], rep: { abismo: 3, forja: -1, bosque: -1 }, dinheiro: 2000, dom: 'banca' }, vai: 'socio' },
          { t: 'Não.' }] },
      socio: { fala: 'Agora somos sócios da arena. Ela nunca deu tanto lucro.' },
      tarde: { fala: 'Você já decidiu. Perdi o negócio.' }
    } },

  nico3: { nome: 'Nico', sprite: 'menino',
    falas: [{ se: { flag: 'bia-juntos' }, no: 'inveja' }, { se: { falas: ['nico3', 1] }, no: 'pao' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'VOCÊ! O da estrada! Olha, estou sem laço, de mão vazia. Luta comigo na arena, do <b>meu</b> lado? Eu divido a comida com você, meio a meio.',
        opcoes: [{ t: '(Balançar a cabeça: não.)', vai: 'nao' }, { t: '(Ficar olhando.)', vai: 'olha' }] },
      nao: { fala: 'Tudo bem. Eu armei um laço pra você, né. Eu também não ia querer.' },
      olha: { fala: 'Você não disse não! Vou guardar pão todo dia, pro caso de você mudar de ideia.' },
      pao: { fala: 'Guardei pão ontem, e hoje também. Não é pressão. É só pra você saber.' },
      inveja: { fala: 'A Bia e a Lã voltaram a lutar, com uma regra: a Bia para a luta quando quiser. Achei bobagem, mas a Lã está ganhando mais do que antes.' }
    } },

  campeao: { nome: 'O Campeão', sprite: 68,
    falas: [{ se: { flag: 'campeao-ouviu' }, no: 'denovo' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Um Pokémon solto, sem coleira. Já sei o que você vai dizer: que eu estou preso. Todo mundo que vem do mato diz isso.', vai: 'oi2' },
      oi2: { fala: 'Ninguém me prende. Eu como três vezes por dia, durmo bem, e duzentas pessoas gritam meu nome. No mato eu passava fome. De que liberdade eu estou sentindo falta?',
        opcoes: [
          { t: '(Não responder. Ele tem direito à pergunta.)', faz: { flag: ['campeao-ouviu', 'campeao-respeito'] }, vai: 'respeito' },
          { t: '(Olhar para a escada do porão.)', faz: { flag: 'campeao-ouviu' }, vai: 'porao' }] },
      respeito: { fala: 'Você não tentou me convencer. É o primeiro. Se um dia precisar de ajuda numa luta, me procura.' },
      porao: { fala: 'A Fera. Ela não escolheu estar aqui, eu sei. Eu não sei o que fazer por ela, então tento não pensar nisso.' },
      denovo: { fala: 'Eu luto nos dias de feira. No resto do tempo, descanso.' }
    } },

  guardaArena: { nome: 'Guarda da escada', sprite: 'soldado',
    falas: [{ se: { flag: ['venceu:desafiante1', 'venceu:desafiante2'] }, no: 'passa' }, { no: 'barra' }],
    nos: {
      barra: { fala: 'Só desce ao porão quem venceu os dois desafiantes da tarde. É a regra do Mestre.' },
      passa: { fala: 'Você venceu os dois. Pode descer. Não encosta na grade.', faz: { flag: 'porao-aberto', missao: ['vau', 2] } }
    } },

  fera: { nome: 'A Fera', sprite: '@alfa',
    falas: [{ no: 'cansada' }],
    nos: {
      cansada: { fala: '(A Fera recuou pro fundo da cela, cansada. A tranca quebrou na luta e a porta está aberta. Ela olha pra escada, depois pra você, e não sai do lugar. Parece não acreditar que pode ir.)',
        opcoes: [
          { t: '(Sair da frente da porta.)', faz: { flag: ['fera-decidida', 'fera-livre'], rep: { bosque: 2 } }, vai: 'livre' },
          { t: '(Fechar a grade de novo.)', faz: { flag: 'fera-decidida', rep: { forja: 1 } }, vai: 'presa' }] },
      livre: { fala: '(Ela passa por você devagar e sobe a escada. Lá em cima alguém grita. Depois, silêncio: ela foi embora.)' },
      presa: { fala: '(Você fecha a grade. A Fera se deita de costas pra você. Lá em cima, a festa continua.)' }
    } },

  /* ===== capítulo 4 ===== */
  barqueiro: { nome: 'Seu Lodo, o barqueiro', sprite: 195,
    falas: [{ se: { flag: 'cap4' }, no: 'depois' }, { se: { missao: ['charco', 'nao'] }, no: 'oi' }, { no: 'rumo' }],
    nos: {
      oi: { fala: 'Hã? Quem está aí? Eu não enxergo bem. Você veio do Vau, né? Está cheirando a areia de arena.', vai: 'oi2' },
      oi2: { fala: 'Aqui é o Charco dos Esquecidos. Quem mora aqui é quem a Forja e o Círculo não quiseram. O charco aceita todo mundo.',
        opcoes: [{ t: 'Estou seguindo uma coisa que puxa pra cá.', vai: 'puxa' }, { t: 'Onde fica a Corte do Abismo?', vai: 'corte' }] },
      puxa: { fala: 'Então você está indo pra Corte do Abismo. Neste charco, é pra lá que tudo vai.', vai: 'corte' },
      corte: { fala: 'Segue as tábuas pra oeste, em volta do poço grande. Não pisa fora da tábua, que você afunda. E cuidado com a Forja: eles têm um dique a nordeste e vigiam tudo.', faz: { missao: ['charco', 0] } },
      rumo: { fala: 'Pra oeste, pelas tábuas, fica a Corte. Pra nordeste, o dique da Forja. Pro sul tem mato alto e bicho bravo.' },
      depois: { fala: 'O charco anda agitado desde que você chegou. Fazia onze anos que não acontecia nada aqui.' }
    } },

  regente: { nome: 'A Regente', sprite: 31,
    falas: [
      { se: { flag: 'charco-corte' }, no: 'dCorte' }, { se: { flag: 'charco-brasa' }, no: 'dBrasa' }, { se: { flag: 'charco-cinza' }, no: 'dCinza' },
      { se: { missao: ['charco', 2] }, no: 'livro' },
      { se: { missao: ['charco', 1] }, no: 'espera' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Então você é quem o Lasca tanto fala. Pode chegar. Aqui ninguém te faz mal.', vai: 'oi2' },
      oi2: { fala: 'Você já carregou dois Corações, e eu sei pra quem entregou cada um. Não vou te cobrar por isso. Quero te contar o nosso lado.', vai: 'conta' },
      conta: { fala: 'Há onze anos nós avisamos que os Corações estavam se soltando. Vigiar os Corações era o trabalho da Corte do Abismo. A Forja disse que era chantagem, o Círculo disse que era mau agouro, e nos expulsaram.', vai: 'conta2' },
      conta2: { fala: 'Desde então a Forja quebra os Corações que encontra e <b>vende</b> os pedaços aos humanos. Os fornos deles queimam isso. Cada venda está anotada num livro-caixa, na Casa de Contas do dique, a nordeste daqui. Eu quero esse livro.',
        opcoes: [{ t: 'Pra fazer o quê com ele?', vai: 'praque' }, { t: 'Eu busco.', faz: { missao: ['charco', 1] }, vai: 'aceita' }, { t: 'Essa guerra não é minha.', vai: 'recusa' }] },
      praque: { fala: 'Pra ler em voz alta em todas as aldeias. Quando souberem, a Forja se divide: os que sabiam contra os que foram enganados. É o que fizeram com a gente, só que desta vez é verdade.',
        opcoes: [{ t: 'Eu busco.', faz: { missao: ['charco', 1] }, vai: 'aceita' }, { t: 'Preciso pensar.' }] },
      aceita: { fala: 'A porta é trancada, e quem guarda a chave é uma Klefki. Na frente tem soldados humanos. E a galeria de baixo alagou: dizem que o Alfa do Charco fez ninho lá. Vai com a comitiva inteira.' },
      recusa: { fala: 'Entendo. Mas o que a Forja faz acaba secando a fonte de todo mundo. Se mudar de ideia, eu estou aqui.' },
      espera: { fala: 'O livro-caixa fica na Casa de Contas, no dique, a nordeste do brejal. Cuidado com o Alfa na galeria.' },
      livro: { fala: 'Isso é… deixa eu ver. Tem o martelo na capa. É o livro-caixa.', vai: 'livro2' },
      livro2: { fala: 'Me entrega, e amanhã o charco inteiro fica sabendo. A Forja vai se dividir, e muitos vão se voltar contra os próprios mestres. Eu não vou fingir que isso me deixa triste.',
        opcoes: [
          { t: '🌑 Entregar o livro-caixa à Regente.', faz: { perde: 'livro', flag: ['cap4', 'charco-corte'], missao: ['charco', 'fim'], rep: { abismo: 3, forja: -3 }, dinheiro: 1500, dom: 'tinta' }, vai: 'dCorte1' },
          { t: 'Ainda não.' }] },
      dCorte1: { fala: 'Obrigada. Estende a pata: esta tinta não sai. Com ela, você bate mais forte em quem já está caindo.' },
      dCorte: { fala: 'Já leram o livro em sete aldeias. Em duas, os da Forja ouviram calados e foram embora. Não sei pra onde, e isso me preocupa.' },
      dBrasa: { fala: 'Você entregou o livro pra própria Forja se julgar. Esperamos onze anos por essa prova. …Eu não vou te expulsar. Isso é o que fizeram com a gente.' },
      dCinza: { fala: 'Você queimou o livro. Eu vi a fumaça. A Dama Véu acha que foi melhor assim. Eu não acho.' }
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
      oi: { fala: 'Tlim. Não toca em nada. Aqui é a Casa de Contas da Forja, e você não tem nada pra fazer aqui.' },
      pede: { fala: 'Tlim… Você passou pelos soldados. Então veio pelo livro.', vai: 'pede2' },
      pede2: { fala: 'Eu guardo esta porta há nove anos. De três anos pra cá, os números não fazem mais sentido: saem pedras e entra dinheiro de <b>fora</b>, com a cara de um rei. Perguntei ao meu chefe, e ele mandou eu cuidar das chaves.',
        opcoes: [{ t: 'Me deixe entrar.', vai: 'entra' }, { t: 'Por que não abriu você mesma?', vai: 'medo' }] },
      medo: { fala: 'Porque eu tenho medo. A galeria alagou e tem uma coisa grande morando lá, em cima das pedras. Eu ouço ela respirar.', vai: 'entra' },
      entra: { fala: 'Toma a chave. Só te peço uma coisa: se achar o livro, fala comigo antes de entregar a quem quer destruir a Forja.', faz: { flag: 'chave-dique' } },
      aberta: { fala: 'A porta está aberta. Eu fico aqui esperando.' },
      livro: { fala: 'Tlim… você achou. Está tudo aí, não está? Cada venda.', vai: 'livro2' },
      livro2: { fala: 'Escuta. Se isso for lido em praça, a Forja quebra, e quem sofre primeiro são os pequenos, que não têm culpa. Tem gente boa lá dentro. A Brasa, a ferreira de Pedralume, agora tem voz na Ordem. Deixa o livro comigo: eu levo a Ferro-Fundo e entrego a ela. A Forja se corrige por dentro. Demora mais, mas não destrói ninguém.',
        opcoes: [
          { t: '⚒ Confiar o livro à Chaveira, pra chegar à Brasa.', faz: { perde: 'livro', flag: ['cap4', 'charco-brasa'], missao: ['charco', 'fim'], rep: { forja: 2, abismo: -2 }, dom: 'tempera', bag: [['rocky-helmet', 1]] }, vai: 'dBrasa1' },
          { t: 'Ainda vou pensar.' }] },
      dBrasa1: { fala: 'Obrigada. Eu vou guardar bem e entregar na mão dela. Leva isto: vai te proteger.' },
      dBrasa: { fala: 'O livro já subiu pra Ferro-Fundo. Eu fui até a metade do caminho e voltei pra cuidar das chaves.' },
      depois: { fala: 'A porta que eu guardei por nove anos não guarda mais nada. Tlim.' }
    } },

  aurelio: { nome: 'Capitão Aurélio', sprite: 'soldadoRubro',
    falas: [{ se: { flag: 'cap4' }, no: 'depois' }, { se: { falas: ['aurelio', 1] }, no: 'denovo' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Um Pokémon solto dentro do dique? Os guardas falharam. Calma, eu não caço: eu compro. Sou o Capitão Aurélio, a serviço do Rei.', vai: 'oi2' },
      oi2: { fala: 'No meu reino o inverno dura sete meses. A pedra que eu compro aqui aquece uma vila inteira até a primavera. Ninguém me contou de onde ela vem. Eu pago o preço que pedem.',
        opcoes: [{ t: '(Mostrar os dentes.)', vai: 'dentes' }, { t: '(Olhar pros caixotes.)', vai: 'caixotes' }] },
      dentes: { fala: 'Eu entendo a sua raiva. Mas quem quebra as pedras e vende não sou eu: são os seus.' },
      caixotes: { fala: 'Eram quatro caixotes por mês. Agora são doze. Perguntei por que a Forja passou a vender tanto, e me disseram que era “pra guerra”. Não disseram contra quem.' },
      denovo: { fala: 'Eu vou embora no próximo barco. Se isso faz mal a vocês, alguém devia ter me avisado antes de me vender.' },
      depois: { fala: 'Este mês não vai ter caixote. Vou voltar de mãos vazias, e o inverno é longo. Não estou te culpando. Só estou preocupado.' }
    } },

  lasca4: { nome: 'Lasca', sprite: 302,
    falas: [
      { se: { missao: ['gema', 'fim'] }, no: 'casa' },
      { se: { missao: ['gema', 0], item: 'gema' }, no: 'trouxe' },
      { se: { missao: ['gema', 0] }, no: 'cade' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Você, aqui, na minha casa! Fala baixo. Aqui ninguém me respeita: acham que eu só saio pra vender e nunca trago nada que preste.', vai: 'oi2' },
      oi2: { fala: 'Preciso de um favor. Um bando me atacou no mato do sul do brejal e levou a minha pedra de nascença. Todo Sableye tem uma. Sem ela, a Regente não me recebe.',
        opcoes: [{ t: 'Eu pego de volta.', faz: { missao: ['gema', 0] }, vai: 'vai' }, { t: 'Quanto você paga?', vai: 'paga' }] },
      paga: { fala: 'Pago, claro. O que eu tiver.',
        opcoes: [{ t: 'Eu pego de volta.', faz: { missao: ['gema', 0] }, vai: 'vai' }, { t: 'Depois.' }] },
      vai: { fala: 'Eles estão no mato alto, no sul do brejal. São uns quatro.' },
      cade: { fala: 'Minha pedra está com o bando, no sul do brejal.' },
      trouxe: { fala: 'É ela! Você trouxe mesmo.', vai: 'trouxe2' },
      trouxe2: { fala: 'Vou te contar uma coisa, de graça: fui eu que contei à Regente sobre o livro-caixa. Eu vendi pedra pra Forja por dois anos antes de entender o que eles faziam com ela. Quando entendi, fiquei com nojo.', faz: { perde: 'gema', missao: ['gema', 'fim'], rep: { abismo: 1 }, dinheiro: 900, bag: [['black-sludge', 1]] } },
      casa: { fala: 'Me deixaram entrar no Paço. Sentei no fundo, e ninguém me mandou sair. Pra mim já é muito.' }
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
      oi: { fala: 'Você não me conhece, mas eu cuidei por onze anos de um túmulo perto de Pedralume. Fica atrás de uma árvore que parece árvore e não é. Quase ninguém acha.' },
      amiga: { fala: 'Você devolveu o sino a quem se lembrava dele. Eu fiquei sabendo. Obrigada. Aqui você tem uma amiga.' },
      livro: { fala: 'Você está com o livro-caixa. A Regente quer ler em praça, e a Chaveira quer levar pra dentro da Forja. As duas têm razão. É isso que me preocupa.', vai: 'livro2' },
      livro2: { fala: 'Meu mestre dizia que a memória não é pra ser usada como arma. Se você quiser, a gente queima o livro. Ninguém fica com a prova, e ninguém a usa pra espalhar ódio. A Forja continua vendendo, até alguém impedir de outro jeito. Não é justo, eu sei.',
        opcoes: [
          { t: '🔥 Queimar o livro-caixa na lâmpada do sineiro.', faz: { perde: 'livro', flag: ['cap4', 'charco-cinza'], missao: ['charco', 'fim'], rep: { abismo: -2, bosque: 1, forja: 1 }, dom: 'cinza' }, vai: 'dCinza1' },
          { t: 'Não. Alguém tem que saber.' }] },
      dCinza1: { fala: 'Queimou. Guarda um pouco da cinza: ela ajuda a esconder o seu rastro.' },
      dCinza: { fala: 'A Regente não fala mais comigo. Um dia passa.' },
      diario: { fala: 'Essa letra é dele. Você achou a casa onde ele se escondia. Eu pensava que ele vinha pra cá só pra ficar sozinho.', vai: 'diario2' },
      diario2: { fala: '“Não é que eu não quis tocar o sino. É que eu já tinha tocado uma vez, por uma coisa que só eu ouvi: vozes muito antigas, debaixo da Fonte, chamando os Corações de volta.”<br><br>Ele ouviu os <b>Antigos</b>, onze anos antes de todo mundo. E morreu achando que estava louco.', vai: 'diario3' },
      diario3: { fala: 'Guarda esse nome: Antigos. Os Corações não se soltam sozinhos. Eles estão sendo <b>chamados</b>.', faz: { missao: ['toque', 'fim'], flag: 'ouviu-antigos', rep: { abismo: 1 }, bag: [['max-ether', 1], ['lum-berry', 2]] } },
      depois: { fala: 'O que você procura não está mais aqui. Agora o caminho sobe, pra Ferro-Fundo, onde a Forja mora.' }
    } },

  pressagio: { nome: 'Presságio', sprite: 359,
    falas: [{ se: { falas: ['pressagio', 1] }, no: 'agua' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Eu sou o arauto da Corte. Eu sinto os desastres antes de acontecerem. Por isso muita gente acha que sou eu que causo.' },
      agua: { fala: 'Há um ano eu acordo com o pelo molhado, sem ter chovido. É um aviso: vem muita água, de um lugar alto. Contei à Regente, e ela me pediu segredo. Mas você precisa saber.' }
    } },

  pavio: { nome: 'Pavio', sprite: 607,
    falas: [{ se: { missao: ['toque', 'fim'] }, no: 'acesa' }, { se: { falas: ['pavio', 2] }, no: 'terceira' }, { se: { falas: ['pavio', 1] }, no: 'segunda' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Eu acendo as lâmpadas. Tem uma pra cada um que chegou aqui expulso de algum lugar. São cento e doze, e eu sei o nome de todos.' },
      segunda: { fala: 'Tem uma lâmpada que a Dama Véu não me deixa acender. Ela diz que o dono ainda não chegou. Mas a lâmpada já está aqui.' },
      terceira: { fala: 'Essa lâmpada apagada fica numa casa em cima da água, no brejal, lá pro sul. Ninguém mora lá. Pra chegar tem um arvoredo, e uma das árvores é falsa: dá pra passar por dentro dela. Eu passei!' },
      acesa: { fala: 'A Dama deixou eu acender! Agora são cento e treze.' }
    } },

  papo: { nome: 'Tia Papo', sprite: 317,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Estalagem do Fundo. A cama é simples e a sopa é escura, mas a comitiva inteira descansa.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: 'Só passando.' }] }
    } },

  croque: { nome: 'Croque', sprite: 453,
    falas: [{ no: 'banca' }],
    nos: {
      banca: { fala: 'Krrk. Eu vendo o que acho no charco. Quer ver?',
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
      oi: { fala: 'Alto lá. Em Ferro-Fundo só entra quem traz encomenda, quem vem aprender ou quem vem arrumar problema. Qual é o seu caso?',
        opcoes: [{ t: 'Estou seguindo o que puxa os Corações.', faz: { missao: ['fundo', 0] }, vai: 'puxa' }, { t: 'Problema.', faz: { missao: ['fundo', 0] }, vai: 'problema' }] },
      puxa: { fala: 'Então você sabe das pedras. Pode entrar. O Mestre vai querer falar com você. E não estranha a confusão: metade da mina está em greve.' },
      problema: { fala: 'Pelo menos é sincero. Pode entrar. O Mestre fica na Bigorna-Mãe, e o líder da greve, na beira do canal de lava.' },
      livro: { fala: 'Foi você que levou o livro pra Corte. Leram aquilo aqui dentro também. Eu não devia te deixar passar. …Mas eu li, e fiquei com vergonha. Entra.', faz: { missao: ['fundo', 0] } },
      frio: { fala: 'A Forja sabe o que você andou fazendo, e não gostou. Pode passar, mas eu vou ficar de olho em você.', faz: { missao: ['fundo', 0] } },
      entra: { fala: 'O Mestre fica na Bigorna-Mãe, a casa de pedra do lado esquerdo. O delegado da greve, na beira do canal de lava.' },
      depois: { fala: 'Muita coisa mudou aqui dentro. Eu continuo na porta, como sempre.' }
    } },

  mestre: { nome: 'Mestre-Forjador', sprite: 306,
    falas: [
      { se: { flag: 'ferro-armas' }, no: 'dArmas' }, { se: { flag: 'ferro-greve' }, no: 'dGreve' }, { se: { flag: 'ferro-ruiu' }, no: 'dRuiu' },
      { se: { missao: ['fundo', 2] }, no: 'decide' },
      { se: { flag: 'ouviu-mestre' }, no: 'espera' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Entra. Eu sou o Mestre-Forjador. E você é o forasteiro que anda carregando Coração de um lado pro outro.', vai: 'oi2' },
      oi2: { fala: 'Vou ser direto: é verdade. Nós quebramos os Corações soltos e vendemos os pedaços aos humanos. Com o dinheiro deles eu compro carvão e armo a Forja <b>contra</b> eles mesmos. Você pode achar errado. Eu acho necessário.',
        opcoes: [{ t: 'Armar pra quê?', vai: 'guerra' }, { t: 'E os que estão de braços cruzados lá fora?', vai: 'greve' }] },
      guerra: { fala: 'Pra guerra que já começou. Tem laço na estrada, gaiola na serra, arena em cima de Fonte. Todo ano os humanos avançam mais. O Círculo foge e a Corte vende segredo. Alguém precisa lutar.', faz: { flag: 'ouviu-mestre' }, vai: 'pedido' },
      greve: { fala: 'Os mineiros pararam porque a galeria de baixo ficou perigosa: o Alfa que mora lá enlouqueceu com o calor das pedras. Eles têm razão de ter medo. Mas parar de trabalhar não resolve.', faz: { flag: 'ouviu-mestre' }, vai: 'pedido' },
      pedido: { fala: 'Desce à galeria, se os grevistas deixarem. Vê o que o forno queima e o que sai dele. Depois me diz se <b>você</b> fecharia.' },
      espera: { fala: 'Fala com o líder dos grevistas, na beira do canal, e desce à galeria. Depois a gente conversa.' },
      decide: { fala: 'Você viu. As pedras entram, e saem as melhores armas que esta terra já teve. Fica do meu lado, e eu ponho os fornos pra trabalhar dia e noite. Quando os humanos vierem, a Forja defende todo mundo.',
        opcoes: [
          { t: '⚒ Ficar com o Mestre: as armas saem.', faz: { flag: ['cap5', 'ferro-armas'], missao: ['fundo', 'fim'], rep: { forja: 3, bosque: -2, abismo: -1 }, dom: 'gume', bag: [['life-orb', 1]] }, vai: 'dArmas1' },
          { t: 'Ainda não decidi.' }] },
      dArmas1: { fala: 'Ótimo. Chega perto do fogo. Isto aqui a Forja não vende a ninguém: é o nosso melhor gume, e agora é seu.' },
      dArmas: { fala: 'Os fornos não param mais. Os mineiros voltaram ao trabalho, calados. Eu sei que estão descontentes. Mas as armas estão saindo.' },
      dGreve: { fala: 'Os fornos apagaram. Você ficou do lado de quem tinha medo. Quando os humanos chegarem, lembra que a gente podia estar armado.' },
      dRuiu: { fala: 'A galeria desabou. Onze anos de trabalho perdidos. A Brasa diz que foi pra limpar a Forja. Pra mim, ficamos sem defesa.' }
    } },

  tatu: { nome: 'Tatu, o delegado', sprite: 529,
    falas: [
      { se: { flag: 'ferro-greve' }, no: 'dGreve' }, { se: { flag: 'cap5' }, no: 'depois' },
      { se: { missao: ['fundo', 2] }, no: 'decide' },
      { se: { flag: 'ouviu-tatu' }, no: 'espera' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Se veio furar a greve, pode voltar. …Você não é daqui. Então escuta o lado de quem cava.', vai: 'oi2' },
      oi2: { fala: 'A gente trabalha na mina desde filhote. Sempre foi quente e escuro, mas dava pra voltar pra casa. Aí abriram a galeria nova, a das pedras que pulsam. Em três meses perdemos nove companheiros. Foi o Alfa que mora lá embaixo. Ele não era violento antes das pedras.',
        opcoes: [{ t: 'O que vocês querem?', vai: 'quer' }, { t: 'O Mestre diz que parar não salva ninguém.', vai: 'mestre' }] },
      quer: { fala: 'Queremos fechar a galeria nova e voltar ao ferro comum. A Forja fica mais pobre, mas ninguém mais morre.', faz: { flag: 'ouviu-tatu' } },
      mestre: { fala: 'Pro Mestre, mineiro é número. Pra mim, cada um dos nove tinha nome.', faz: { flag: 'ouviu-tatu' } },
      espera: { fala: 'Fala com o Mestre, se ainda não falou. Depois os grevistas te deixam descer. Não vai sozinho.' },
      decide: { fala: 'Viu? Agora me diz se é certo mandar filhote trabalhar naquilo. Fica com a gente: fechamos a galeria nova, apagamos os fornos grandes, e a Forja volta a fazer prego, enxada e panela. Vamos ficar sem armas, mas vivos.',
        opcoes: [
          { t: '✊ Ficar com os mineiros: a Forja para.', faz: { flag: ['cap5', 'ferro-greve'], missao: ['fundo', 'fim'], rep: { forja: -2, bosque: 2, abismo: 1 }, dom: 'greve', bag: [['assault-vest', 1]] }, vai: 'dGreve1' },
          { t: 'Ainda não decidi.' }] },
      dGreve1: { fala: 'A gente não esperava que alguém de fora ficasse do nosso lado. Obrigado. Cruza os braços aqui com a gente: você aprende a aguentar firme.' },
      dGreve: { fala: 'Agora a gente faz panela, enxada e prego. Vende menos, mas eu durmo bem. Se a guerra vier, a gente se esconde debaixo da terra.' },
      depois: { fala: 'A greve acabou, e não fomos nós que decidimos como. Podia ter sido pior.' }
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
      traida: { fala: 'Você. O que vendeu o meu minério. Não tenho nada pra falar com você.' },
      oi: { fala: 'Olha quem apareceu. Eu vim pra Ferro-Fundo depois que a fonte de Pedralume se resolveu. Aqui pelo menos não falta fogo.' },
      amiga: { fala: '{eu}! Soube que o cano de Pedralume ainda funciona. Por causa dele me deram um forno aqui em cima. Chega mais perto do calor.' },
      livro: { fala: 'A Chaveira chegou antes de você e me entregou o livro. Li em três noites. Passei a vida defendendo a Forja. Agora vou ter que consertá-la.' },
      decide: { fala: 'Você desceu, então viu o que eu vi. Aquilo não é forja: eles estão queimando os Corações.', vai: 'decide2' },
      decide2: { fala: 'O Mestre quer os fornos dia e noite. O Tatu quer fechar a porta. Mas porta fechada alguém abre de novo. A galeria tem que <b>desabar</b>. Eu sei onde ficam as escoras: fui eu que fiz. Depois disso ninguém mais queima Coração aqui. Nem pra se defender.',
        opcoes: [
          { t: '🔥 Derrubar a Galeria das Lascas, com a Brasa.', faz: { flag: ['cap5', 'ferro-ruiu'], missao: ['fundo', 'fim'], rep: { forja: -1, bosque: 1, abismo: 1 }, dom: 'escombro', bag: [['focus-sash', 1]] }, vai: 'dRuiu1' },
          { t: 'Ainda não decidi.' }] },
      dRuiu1: { fala: 'Pronto. Três marretadas, e a galeria veio abaixo. Toma: quem derruba o que construiu aprende onde bater.' },
      dRuiu: { fala: 'Metade da Forja não fala mais comigo. A outra metade me agradece. Eu durmo mal, mas durmo.' },
      depois: { fala: 'Não foi o que eu faria. Mas a decisão era sua.' }
    } },

  piquete: { nome: 'O piquete', sprite: 524,
    falas: [{ se: { flag: ['ouviu-mestre', 'ouviu-tatu'] }, no: 'passa' }, { no: 'barra' }],
    nos: {
      barra: { fala: 'Ninguém desce, é a greve. Se você quer descer, primeiro ouve o Mestre <b>e</b> o Tatu. A gente não quer ninguém morrendo lá embaixo sem saber onde está se metendo.' },
      passa: { fala: 'Ouviu os dois? Então pode descer. Toma cuidado.', faz: { flag: 'desce-lascas', missao: ['fundo', 1] } }
    } },

  bigorna: { nome: 'Mãe Bigorna', sprite: 305,
    falas: [
      { se: { missao: ['faisca', 'fim'] }, no: 'grata' },
      { se: { missao: ['faisca', 0], flag: 'achou-faisca' }, no: 'voltou' },
      { se: { missao: ['faisca', 0] }, no: 'espera' },
      { no: 'pede' }
    ],
    nos: {
      pede: { fala: 'Você viu um Aron pequeno, com o capacete lascado? É o meu filho, o Faísca. Ele soube que nove mineiros sumiram e desceu sozinho pra procurar. Faz dois dias.',
        opcoes: [{ t: 'Eu procuro.', faz: { missao: ['faisca', 0] }, vai: 'obrigada' }, { t: 'Sinto muito.' }] },
      obrigada: { fala: 'Ele gosta de lugar quente. Deve estar perto da lava. Eu tentei descer, mas não tive coragem.' },
      espera: { fala: 'Ele deve estar perto da lava. Ele sempre vai pra lá.' },
      voltou: { fala: 'FAÍSCA! Vem cá!<br><br>Você trouxe ele de volta. Você desceu onde eu não tive coragem. Obrigada.', faz: { missao: ['faisca', 'fim'], rep: { forja: 1 }, bag: [['max-revive', 1], ['hard-stone', 1]] } },
      grata: { fala: 'Ele está de castigo. Mas eu deixo ele sair pra te cumprimentar.' }
    } },

  faisca: { nome: 'Faísca', sprite: 304,
    falas: [{ se: { flag: 'achou-faisca' }, no: 'casa' }, { no: 'achado' }],
    nos: {
      achado: { fala: 'Não conta pra minha mãe! Eu vim procurar os nove mineiros. Não achei nenhum. Só achei os capacetes. Eu juntei todos.',
        opcoes: [{ t: 'Vamos pra casa.', faz: { flag: 'achou-faisca' }, vai: 'vai' }, { t: '(Ficar um pouco com ele.)', vai: 'fica' }] },
      fica: { fala: 'Eu não estou chorando. É o calor.',
        opcoes: [{ t: 'Vamos pra casa.', faz: { flag: 'achou-faisca' }, vai: 'vai' }] },
      vai: { fala: 'Tá bom. Mas eu levo os capacetes.' },
      casa: { fala: 'Estou de castigo. A mãe pendurou os nove capacetes na parede, e todo mundo que passa tira o chapéu.' }
    } },

  cascalho5: { nome: 'Sargento Cascalho', sprite: 75,
    falas: [{ se: { flag: 'cap5' }, no: 'depois' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Você! Eu levei a ponta de lança ao Mestre, como prometi. Ele não negou: disse que a arma era nossa, e que era boa. Trinta anos servindo a Forja, e eu não sabia de nada.' },
      depois: { fala: 'Eu continuo na Forja. Mas agora presto atenção no que ela faz.' }
    } },

  caldeira: { nome: 'Dona Caldeira', sprite: 219,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Pensão da Caldeira. Aqui é sempre quente. Tem cama pra comitiva inteira.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: 'Só passando.' }] }
    } },

  bussola: { nome: 'Bússola', sprite: 476,
    falas: [{ no: 'banca' }],
    nos: {
      banca: { fala: 'Eu vendo ferramentas e mantimentos. Quer ver?',
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
      oi: { fala: 'Não grita, por favor. Eu sou o Odilon, ferreiro. Sou humano, sim. O único desta montanha.', vai: 'oi2' },
      oi2: { fala: 'Na minha terra eu fazia ferradura e dobradiça. Um dia um Pokémon da Forja me viu trabalhar e me trouxe um ferro que eu nunca tinha visto. Faz seis anos que eu moro aqui, escondido. Ninguém me obriga: eu fiquei pra aprender.', faz: { missao: ['humano', 0] }, vai: 'oi3' },
      oi3: { fala: 'Eu faço as peças mais finas: ponta de lança, trinco, grade. O Mestre diz que é pra defesa da Forja. Eu nunca perguntei pra onde vão.' },
      denovo: { fala: 'Eu faço ponta de lança, trinco e grade, e nunca perguntei pra onde vão. Você sabe?',
        opcoes: [{ t: '(Riscar no chão: uma serra, uma gaiola, uma arena.)', vai: 'lanca2' }, { t: '(Não responder.)' }] },
      lanca: { fala: 'Deixa eu ver isso. …Esse acabamento é meu. Fui eu que fiz esta ponta. Onde você achou?', vai: 'lanca2' },
      lanca2: { fala: '(Você risca no chão: uma serra. Um bicho grande, com a ponta no flanco. Depois uma grade e uma arena.)<br><br>Usaram a minha lança pra ferir um de vocês. E as grades da arena também são minhas. Passei seis anos sem querer saber pra que serviam.',
        opcoes: [
          { t: '(Apontar pra porta: vá dizer isso ao Mestre.)', faz: { flag: 'odilon-fala', missao: ['humano', 'fim'], rep: { forja: -1, bosque: 1 }, bag: [['expert-belt', 1]] }, vai: 'falou1' },
          { t: '(Deixar o martelo na mão dele.)', faz: { missao: ['humano', 'fim'], rep: { forja: 1 }, bag: [['expert-belt', 1]] }, vai: 'calou1' }] },
      falou1: { fala: 'Eu vou falar com o Mestre. Se ele me expulsar, paciência. Leva isto: é a última peça que eu fiz sem saber pra quê.' },
      calou1: { fala: 'Você não me denunciou. Então eu fico. Mas daqui pra frente só faço o que eu souber pra que serve. Leva isto: é uma boa peça.' },
      falou: { fala: 'O Mestre me ouviu e não me expulsou. Disse que ia pensar. Eu já decidi: arma eu não faço mais.' },
      calou: { fala: 'Parei de fazer ponta de lança. Agora faço enxada. O Mestre reclama, e eu finjo que não ouço.' }
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
      oi: { fala: 'Isto aqui se chamava Aldeia da Sombra. Agora chamam de Aldeia dos Tocos. As árvores foram embora <b>andando</b>, moço. Eu vi: arrancaram as raízes do chão e foram.', vai: 'oi2' },
      oi2: { fala: 'O Círculo decidiu ir pro norte, pra longe dos machados e dos fornos. É direito deles. Só que ninguém perguntou a quem vivia na sombra. Meu açude secou, e as crianças sofrem com o sol. Segue a trilha do norte. Lá está a Mãe Meganium, a única que foi contra.', faz: { missao: ['anda', 0] } },
      pede: { fala: 'Já que você vai atrás delas, me traz uma muda. As árvores deixam brotos pelo caminho. Eu planto aqui na praça.',
        opcoes: [{ t: 'Eu trago.', faz: { missao: ['muda', 0] }, vai: 'vai' }, { t: 'Uma muda não faz sombra.', vai: 'sombra' }] },
      sombra: { fala: 'Hoje não faz. Mas daqui a vinte anos faz, e as crianças ainda vão estar aqui.',
        opcoes: [{ t: 'Eu trago.', faz: { missao: ['muda', 0] }, vai: 'vai' }, { t: 'Outra hora.' }] },
      vai: { fala: 'Procura perto do rastro delas, na Marcha. É um broto de folha clara. Traz com a terra junto.' },
      cade: { fala: 'A muda fica perto do rastro das árvores, na Marcha. Traz com a terra junto.' },
      trouxe: { fala: 'Você trouxe! Com terra e tudo. Segura enquanto eu cavo… pronto, está plantada. Obrigado!', faz: { perde: 'muda', missao: ['muda', 'fim'], rep: { bosque: 1 }, bag: [['leftovers', 1]], dinheiro: 300 } },
      plantou: { fala: 'Eu rego a muda duas vezes por dia. Está pegando.' },
      dPartiu: { fala: 'As árvores foram todas embora. Vamos cavar um açude novo mais pra baixo e aprender a viver no sol.' },
      dFicou: { fala: 'As árvores voltaram, mas estão doentes: as folhas caem fora de época. Ainda dão sombra. Não sei se devo agradecer ou pedir desculpa a elas.' },
      dRachou: { fala: 'Metade das árvores voltou, as mais velhas. Dá sombra pra metade da aldeia. O resto do pessoal se mudou pra perto delas.' }
    } },

  brotinho: { nome: 'Brotinho', sprite: 43,
    falas: [{ se: { missao: ['fica', 'fim'] }, no: 'sabia' }, { se: { falas: ['brotinho', 1] }, no: 'arvore' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Eu só saía de noite, por causa do sol. Agora não tem mais árvore, e até a lua está clara demais. Eu não sei mais quando sair.' },
      arvore: { fala: 'Tem uma árvore na Marcha que não anda. Ela fica no meio das outras e só mexe os galhos, fingindo. Eu vi! Ninguém acredita em mim.' },
      sabia: { fala: 'EU FALEI que ela não andava!' }
    } },

  aud: { nome: 'Dona Aud', sprite: 531,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Pousada da Sombra. A sombra acabou, mas a cama é boa.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: 'Só passando.' }] }
    } },

  primo: { nome: 'Primo do Kecleon', sprite: 352,
    falas: [{ no: 'banca' }],
    nos: {
      banca: { fala: 'Sou primo do Kecleon de Pedralume! Vendo de tudo. Quer ver?',
        opcoes: [{ t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: 'Depois.' }] }
    } },

  bento: { nome: 'Seu Bento', sprite: 'lenhador',
    falas: [{ se: { flag: 'cap6' }, no: 'depois' }, { se: { falas: ['bento', 1] }, no: 'denovo' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Calma, o machado está no chão. Eu sou lenhador, sim, faz trinta anos. Mas só corto árvore que já morreu, e planto duas no lugar. Foi assim que meu pai me ensinou.', vai: 'oi2' },
      oi2: { fala: 'Os rapazes mais novos não pensam assim. Estão lá na Marcha, cortando as árvores que ficam pra trás. Eu avisei que essas árvores sentem dor. Riram de mim.' },
      denovo: { fala: 'Se encontrar os rapazes, pode dar um susto neles. Só não machuca muito. São novos e não sabem o que fazem.' },
      depois: { fala: 'As árvores que eu plantei continuam no lugar. Eu cuido delas todo dia.' }
    } },

  carvalho: { nome: 'Vô Carvalho', sprite: 709,
    falas: [{ se: { missao: ['fica', 'fim'] }, no: 'fim' }, { se: { missao: ['fica', 0] }, no: 'espera' }, { se: { falas: ['carvalho', 1] }, no: 'fala' }, { no: 'quieto' }],
    nos: {
      quieto: { fala: '(Um tronco velho, de casca rachada, no meio das árvores da Marcha. Todas as outras têm um buraco atrás, de onde saíram. Esta não tem.)' },
      fala: { fala: 'Você reparou em mim. Quase ninguém repara. É verdade: eu não ando. Só mexo os galhos pra parecer que estou indo.', vai: 'fala2' },
      fala2: { fala: 'Eu tenho quatrocentos anos neste chão e não quero ir embora. Rio abaixo tem uma ponte que os dois lados vivem quebrando. Eu queria me deitar lá e servir de ponte.', faz: { missao: ['fica', 0] }, vai: 'fala3' },
      fala3: { fala: 'Mas uma árvore do Círculo precisa da licença de uma Mãe pra isso. Fala com a Mãe Meganium por mim. Ela vai entender.' },
      espera: { fala: 'A Mãe Meganium está na clareira, depois do Pastor. Diz a ela que o Carvalho pede licença pra se deitar.' },
      fim: { fala: 'Ela deixou. Eu vou devagar, do meu jeito. Me procura onde o rio é mais largo.' }
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
      oi: { fala: 'Você. Eu me lembro de você, do Vale do Orvalho.', vai: 'oi2' },
      oi2: { fala: 'O Círculo votou: vinte e três Mães a favor de ir embora, uma contra. A que votou contra fui eu. Tem gente pequena que vive da nossa sombra, e ninguém perguntou a eles.', vai: 'oi3' },
      oi3: { fala: 'Fala com o Pai Torterra, ali. É ele quem carrega o bosque nas costas. Depois volta e me diz o que achou.', faz: { missao: ['anda', 1] } },
      espera: { fala: 'Fala com o Pai Torterra primeiro. Ele fala devagar, mas vale a pena ouvir até o fim.' },
      carvalho: { fala: 'Você traz um recado do Carvalho? Quatrocentos anos, e ainda pede licença. Eu sempre soube que ele não andava. Diz que eu deixo: que ele se deite onde o rio é mais largo e sirva de ponte. Vou sentir falta dele.', faz: { missao: ['fica', 'fim'], flag: 'arvore-ponte', rep: { bosque: 1 } } },
      decide: { fala: 'Você ouviu o Torterra. Ele tem razão, e é isso que torna tudo difícil.', vai: 'decide2' },
      decide2: { fala: 'São três caminhos. Deixar o bosque ir: o Círculo se salva, e as aldeias de baixo ficam no sol. Segurar o bosque com as raízes do Coração: ele fica à força, e pode adoecer. Ou dividir: as árvores velhas voltam comigo, e as novas seguem com ele.',
        opcoes: [
          { t: '🍃 Deixar o bosque partir.', faz: { flag: ['cap6', 'bosque-partiu'], missao: ['anda', 'fim'], rep: { bosque: 3, forja: -1 }, dom: 'semente', bag: [['sitrus-berry', 4]] }, vai: 'dPartiu1' },
          { t: '🌳 Segurar o bosque com as raízes do Coração.', faz: { flag: ['cap6', 'bosque-ficou'], missao: ['anda', 'fim'], rep: { bosque: -2, forja: 1, abismo: 1 }, dom: 'raiz', bag: [['leftovers', 1]] }, vai: 'dFicou1' },
          { t: '✂ Dividir: as velhas voltam, os novos seguem.', faz: { flag: ['cap6', 'bosque-rachou'], missao: ['anda', 'fim'], rep: { bosque: 1 }, dom: 'enxerto', bag: [['shell-bell', 1]] }, vai: 'dRachou1' },
          { t: 'Ainda não sei.' }] },
      dPartiu1: { fala: 'Então nós vamos. Eu vou junto: não posso ficar pra trás. Leva esta semente com você.' },
      dFicou1: { fala: 'As raízes estão voltando. Dói nelas, e dói em mim. Leva um pedaço de raiz: ela protege quem a carrega. E me perdoa por eu ter te pedido isso.' },
      dRachou1: { fala: 'As outras Mães não vão me perdoar por dividir o bosque. Toma: é um enxerto, duas árvores numa só.' },
      dPartiu: { fala: 'O bosque está indo. As aldeias de baixo estão aprendendo a viver sem sombra. É triste, mas eles vão conseguir.' },
      dFicou: { fala: 'Ficamos. As folhas estão caindo fora de época. O bosque está aqui, mas não está bem.' },
      dRachou: { fala: 'Metade do bosque dá metade da sombra. As aldeias dizem que é o bastante. As árvores novas mandam notícias do norte.' }
    } },

  torterra: { nome: 'Pai Torterra', sprite: 389,
    falas: [{ se: { flag: 'cap6' }, no: 'depois' }, { se: { flag: 'ouviu-torterra' }, no: 'denovo' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Chega devagar: eu carrego um bosque nas costas. Você é o que anda com os Corações. A Mãe Meganium te mandou pra me fazer mudar de ideia.', vai: 'oi2' },
      oi2: { fala: 'Escuta. A Forja cava debaixo de nós, os humanos nos cortam, e a Corte vende o mapa de onde estamos. Mesmo assim damos sombra, fruta e remédio a todos. Faz cem anos que o Círculo cuida de quem o machuca.',
        opcoes: [{ t: 'E as aldeias que ficaram no sol?', vai: 'aldeias' }, { t: 'Pra onde vocês vão?', vai: 'norte' }] },
      aldeias: { fala: 'Eu penso nelas a cada passo. Mas árvore morta não dá sombra pra ninguém. Se ficarmos, em dez anos não sobra bosque. Eu escolhi salvar o bosque.', faz: { flag: 'ouviu-torterra' } },
      norte: { fala: 'Pra serra fria, onde a água nasce. Lá o machado não chega. Dizem também que é lá que mora quem está chamando os Corações. A Mãe não acredita. Eu acredito, e vou assim mesmo.', faz: { flag: 'ouviu-torterra' } },
      denovo: { fala: 'Eu já disse o que penso. Agora a decisão é dela, e sua.' },
      depois: { fala: 'Está decidido. Eu sigo carregando o bosque, pra onde for.' }
    } },

  vento: { nome: 'Vento', sprite: 275,
    falas: [{ se: { flag: 'bosque-ficou' }, no: 'preso' }, { se: { flag: 'cap6' }, no: 'depois' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Mais um forasteiro querendo convencer a Mãe a nos prender aqui. Todo mundo quer alguma coisa do bosque. É por isso que a gente vai embora.' },
      preso: { fala: 'Você nos prendeu aqui pelas raízes. Quando o bosque adoecer de vez, lembra que eu avisei.' },
      depois: { fala: 'Eu vou na frente, abrindo caminho. Não tenho mais nada pra te dizer.' }
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
      oi: { fala: 'Você de novo. Eu sei que você não gosta de mim, e tudo bem. Mas preciso que me escute: esta ponte importa pros dois lados.', vai: 'fala' },
      amiga: { fala: '{eu}! Que bom te ver. Faz nove noites que eu não durmo direito.', vai: 'fala' },
      fala: { fala: 'Esta é a Ponte Grande. Do lado de lá fica o reino dos humanos; deste lado, vocês. Por ela passa remédio, notícia, gente como eu — e caçador também. Agora tem um bando de guerra acampado na outra margem, esperando o vão do meio ser consertado.', vai: 'fala2' },
      fala2: { fala: 'Quem abriu o vão foi o Alfa do rio, que mora embaixo, entre os pilares. Ele derruba as tábuas de quem tenta passar, dos dois lados. Enquanto ele estiver lá, ninguém atravessa. Isso é ruim, mas também é o que está segurando o bando.',
        opcoes: [{ t: 'Eu desço lá.', faz: { missao: ['travessia', 0] }, vai: 'desce' }, { t: 'E se o vão ficar aberto?', vai: 'aberto' }] },
      aberto: { fala: 'Aí a curandeira não passa, eu não passo, e quem tem alguém do outro lado não se vê mais. E o bando acha outro caminho em um mês. Só ganhamos tempo.',
        opcoes: [{ t: 'Eu desço lá.', faz: { missao: ['travessia', 0] }, vai: 'desce' }, { t: 'Deixa eu pensar.' }] },
      desce: { fala: 'A descida fica na margem, a leste daqui: um buraco no barranco. Leva companhia. E, se puder, não mata o Alfa: ele já morava aqui antes da ponte.' },
      vao: { fala: 'O Alfa do rio, entre os pilares. A descida fica na margem, a leste.' },
      espera: { fala: 'O vão está fechado: agora dá pra atravessar. Do outro lado, quem manda no bando é um capitão chamado Rufino. Ele não negocia.' },
      decide: { fala: 'Você voltou inteiro! E o Rufino? …Certo. Sem capitão, o bando não sabe o que fazer. É a nossa chance.', vai: 'decide2' },
      decide2: { fala: 'Eu quero manter a ponte de pé, com guarda dos dois lados: eu, a Selma e quem mais quiser. Caçador vai continuar tentando passar, não vou mentir. Mas também passa quem cura, quem traz notícia, quem tem família do outro lado.',
        opcoes: [
          { t: '🌉 Defender a ponte, com a Lia.', faz: { flag: ['cap7', 'ponte-de-pe', 'lia-confia'], missao: ['travessia', 'fim'], rep: { bosque: 1, abismo: 1 }, dom: 'pilar', bag: [['sitrus-berry', 3], ['max-revive', 1]] }, vai: 'dPe1' },
          { t: 'Vou ouvir os outros.' }] },
      dPe1: { fala: 'Então a ponte fica, e eu fico nela. Obrigada por não me obrigar a escolher um lado.' },
      dPe: { fala: 'Hoje passaram uma carroça de remédio e dois meninos fugidos. E um caçador, que eu mandei voltar.' },
      dCaiu: { fala: 'A ponte caiu. Eu fiquei deste lado, e a minha mãe mora do outro. …Não precisa ficar assim. Eu escolhi ficar aqui.' },
      dForja: { fala: 'Agora tem muralha e pedágio. Eu não pago: conheço uma passagem rasa, três léguas rio acima. Vou continuar soltando quem cai em laço, dos dois lados do muro.' }
    } },

  selma7: { nome: 'Dona Selma, a curandeira', sprite: 'dama',
    falas: [
      { se: { missao: ['remedio', 0], item: 'caixa' }, no: 'trouxe' },
      { se: { missao: ['remedio', 0] }, no: 'cade' },
      { se: { missao: ['remedio', 'fim'] }, no: 'depois' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Olha quem apareceu! Eu atravessei antes do vão abrir, com as minhas ervas e duas crianças. Do lado de lá eu tratava caçador. Aqui eu trato quem aparecer.', vai: 'oi2' },
      oi2: { fala: 'Só que metade dos meus remédios ficou na ponte: uma caixa com o meu nome, do lado de lá do vão. Se você passar por ela, traz pra mim?',
        opcoes: [{ t: 'Eu trago.', faz: { missao: ['remedio', 0] }, vai: 'vai' }, { t: '(Pedir um curativo — {custo}.)', faz: { cura: true } }, { t: 'Agora não.' }] },
      vai: { fala: 'Fica depois do vão, encostada no corrimão. E não cheira o vidro azul.' },
      cade: { fala: 'A caixa está na ponte, depois do vão.',
        opcoes: [{ t: '(Pedir um curativo — {custo}.)', faz: { cura: true } }, { t: 'Já volto.' }] },
      trouxe: { fala: 'É ela, e está inteira! Obrigada. Toma, fiz isto pra você.', faz: { perde: 'caixa', missao: ['remedio', 'fim'], rep: { bosque: 1 }, bag: [['full-restore', 2], ['lum-berry', 2]] } },
      depois: { fala: 'Senta, deixa eu ver essas patas. Você anda demais.',
        opcoes: [{ t: '(Pedir um curativo — {custo}.)', faz: { cura: true } }, { t: 'Estou bem.' }] }
    } },

  campeao7: { nome: 'O Campeão', sprite: 68,
    falas: [{ se: { flag: 'cap7' }, no: 'depois' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Eu disse que escolhia as minhas lutas. Esta eu escolhi: ninguém me paga e ninguém aplaude. Pela primeira vez eu sei por que estou lutando.' },
      depois: { fala: 'A arena pediu pra eu voltar. Eu respondi que estou ocupado.' }
    } },

  bia7: { nome: 'Bia', sprite: 'menina',
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'A gente veio ajudar. A Lã queria lutar por alguma coisa que não fosse dinheiro. E a nossa regra continua: eu paro a luta quando achar que passou do ponto.' }
    } },

  lasca7: { nome: 'Lasca', sprite: 302,
    falas: [{ no: 'banca' }],
    nos: {
      banca: { fala: 'Eu vendo pros dois lados da ponte. …O quê? Achou que eu ia ficar no charco?',
        opcoes: [{ t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: 'Depois.' }] }
    } },

  capataz: { nome: 'Capataz Metang', sprite: 375,
    falas: [{ se: { flag: 'ponte-forja' }, no: 'dForja' }, { se: { flag: 'cap7' }, no: 'depois' }, { se: { missao: ['travessia', 2] }, no: 'oferta' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'A Forja me mandou medir esta ponte. Ponte sem dono acaba sendo de quem chegar primeiro.' },
      oferta: { fala: 'A proposta da Forja: muralha de pedra nas duas pontas, portão de ferro e pedágio. Só passa quem a gente deixar, e pagando. Caçador não passa. Curandeira passa, mas paga. Não é bonito, mas funciona.',
        opcoes: [
          { t: '⚒ Entregar a ponte à Forja.', faz: { flag: ['cap7', 'ponte-forja'], missao: ['travessia', 'fim'], rep: { forja: 3, bosque: -1, abismo: -1 }, dinheiro: 2500, dom: 'pedagio' }, vai: 'dForja1' },
          { t: 'Vou ouvir os outros.' }] },
      dForja1: { fala: 'Fechado. A obra começa amanhã. Você tem passe livre pra sempre: fiz questão.' },
      dForja: { fala: 'Ontem passaram trinta. Vinte e nove pagaram. A moça da capa verde atravessou o rio a nado pra não pagar.' },
      depois: { fala: 'A Forja registra que a proposta foi recusada. Eu entendo os seus motivos.' }
    } },

  carvalho7: { nome: 'Vô Carvalho', sprite: 709,
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'Cheguei. Demorou, mas cheguei. Onde fica o vão da ponte?',
        opcoes: [{ t: '(Mostrar o vão do meio da ponte.)', faz: { flag: 'carvalho-deitou', rep: { bosque: 1 } }, vai: 'deita' }, { t: 'Ainda não.' }] },
      deita: { fala: 'É largo. Tudo bem, eu sou comprido. O Alfa lá de baixo não derruba árvore. Avisa a Mãe Meganium que agora eu sou ponte. Pode passar por cima de mim.' }
    } },

  nico7: { nome: 'Nico', sprite: 'menino',
    falas: [{ se: { flag: 'nico-ponte' }, no: 'ficou' }, { se: { missao: ['sozinho', 0] }, no: 'decide' }, { no: 'achado' }],
    nos: {
      achado: { fala: 'NÃO ME… ah, é você, o da estrada. Não conta pra ninguém que eu estou aqui. Nem pros de lá, nem pros de cá.', vai: 'achado2' },
      achado2: { fala: 'Eu atravessei sozinho, antes do vão abrir. O Rufino passou no Vau juntando gente pra uma “grande caçada”, e o meu pai foi. Eu vim na frente pra avisar a moça da capa verde. Mas vi os Pokémon de guarda na ponte e fiquei com medo: eu já armei laço pra Pokémon.', faz: { missao: ['sozinho', 0] }, vai: 'decide' },
      decide: { fala: 'Estou com fome, com frio e com medo dos dois lados. O que eu faço?',
        opcoes: [
          { t: '(Empurrar o menino pra fora: a Lia está lá em cima.)', faz: { flag: 'nico-ponte', missao: ['sozinho', 'fim'], rep: { bosque: 1 }, bag: [['sitrus-berry', 2]] }, vai: 'vai' },
          { t: '(Deixar ele onde está.)' }] },
      vai: { fala: 'Tá bom, eu vou falar com ela. Vou contar a verdade: que eu armava os laços e ela desarmava. Toma, é o pão que eu guardei pra você.' },
      ficou: { fala: 'A Lia me deu uma faca de cortar laço. Já achei três. Dois eram meus, de antes.' }
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
      peixe: { fala: 'Você! O dos peixes. Baixa a lança, Zeca, esse é amigo. Eu não vim com o bando: vim <b>atrás</b> dele. Metade destes rapazes eu ensinei a pescar. A outra metade o Rufino convenceu a voltar a caçar.' },
      fome: { fala: 'Você. …Trinta de nós subiram a serra. Vinte e oito desceram: duas crianças morreram de fome. Eu sigo o Rufino porque ele promete comida.' },
      fogo: { fala: 'Você. O que queimou o meu defumadouro. Eu disse que voltava com mais gente. Voltei.' },
      decide: { fala: 'O Rufino caiu. Agora os rapazes estão olhando pra mim, esperando ordem.', vai: 'decide2' },
      decide2: { fala: 'Escuta um caçador velho. Enquanto essa ponte existir, alguém do meu lado vai atravessar pra caçar, e alguém do seu vai atravessar pra se vingar. Derruba a ponte. Meus netos crescem sem caçar Pokémon, e os seus crescem sem medo de gente. É a paz que eu posso oferecer.',
        opcoes: [
          { t: '🪓 Derrubar a ponte, com o Tomé.', faz: { flag: ['cap7', 'ponte-caiu'], missao: ['travessia', 'fim'], rep: { bosque: 2, forja: -1 }, dom: 'margem', bag: [['max-potion', 2], ['focus-sash', 1]] }, vai: 'dCaiu1' },
          { t: 'Vou ouvir os outros.' }] },
      dCaiu1: { fala: 'Eu corto do meu lado e você do seu. …Pronto, caiu. Fica com o meu facão. Eu não vou mais precisar dele.' },
      dCaiu: { fala: 'Sem a ponte, os rapazes voltaram a pescar. Reclamam, mas pescam. De noite eu olho pro outro lado e não vejo fogueira. Acho que isso é paz.' },
      depois: { fala: 'A ponte ficou. Então eu fico deste lado, de olho nos meus rapazes, pra eles não fazerem besteira.' }
    } },

  tico7: { nome: 'Tico', sprite: 'menino',
    falas: [{ se: { flag: 'passo-fome' }, no: 'fome' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Você é o Pokémon da serra! Eu lembro de você! O tio Tomé não me deixa ir com o bando. Acho que ele não quer que ninguém vá.' },
      fome: { fala: 'Você é o Pokémon da serra. …Minha prima Ana morreu na descida. O tio não fala dela. Eu falo, pra não esquecer.' }
    } },

  /* ===== capítulo 8 ===== */
  corcova: { nome: 'Dona Corcova', sprite: 323,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Caravana da Corcova. Aqui é o único lugar com sombra até a cidade branca. Tem descanso, água e mercadoria.',
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
      pede: { fala: 'Psiu. A caravana está quase sem água. O único poço de água doce fica ali, a leste, e um bando deitou em cima dele faz três dias. A Dona Corcova está racionando o que sobrou.',
        opcoes: [{ t: 'Eu tiro eles de lá.', faz: { missao: ['gole', 0] }, vai: 'vai' }, { t: 'Boa sorte.' }] },
      vai: { fala: 'O poço fica a leste da tenda. O bando é grande e bravo.' },
      espera: { fala: 'O bando ainda está no poço. Eu fico vigiando daqui.' },
      livre: { fala: 'ELES SAÍRAM! A caravana tem água de novo! A Dona Corcova até chorou. Toma, achei isto enterrado na areia. É seu.', faz: { missao: ['gole', 'fim'], rep: { bosque: 1 }, dinheiro: 500, bag: [['max-repel', 2], ['rare-candy', 1]] } },
      grato: { fala: 'Eu cavei um buraco pra você dormir, se quiser. É pequeno, igual a mim.' }
    } },

  dalva: { nome: 'Irmã Dalva', sprite: 'sabia',
    falas: [
      { se: { flag: 'sal-contou' }, no: 'dContou' }, { se: { flag: 'sal-guardou' }, no: 'dGuardou' }, { se: { flag: 'sal-vendeu' }, no: 'dVendeu' },
      { se: { missao: ['sal', 2] }, no: 'decide' },
      { se: { missao: ['sal', 1] }, no: 'espera' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: 'Shh! …Ah, você não vai estragar nada, vai? Os bichos às vezes esfregam o focinho nas paredes, e o sal esfarela. Eu sou a Dalva. Copio estes desenhos há doze anos.', vai: 'oi2' },
      oi2: { fala: 'Aqui existiu uma Fonte, e ela morreu há muito tempo. Sobrou esta cidade de sal. Nas paredes, gente e Pokémon aparecem <b>lado a lado</b>, sem coleira, com um pano amarrado entre os dois.',
        opcoes: [{ t: '(Olhar o pano no desenho.)', vai: 'pano' }, { t: '(Olhar pra ela, desconfiado.)', vai: 'desconfia' }] },
      pano: { fala: 'É um nó. Cada um segurava uma ponta, e os dois apertavam juntos. Eu chamo de Primeiros Laços. Naquele tempo, laço era uma coisa que os <b>dois</b> faziam. Não sei quando virou prisão.', vai: 'pedido' },
      desconfia: { fala: 'Você tem razão de desconfiar. Eu venho do reino que faz bola, gaiola e arena. Quando eu era menina vi um desenho destes, e nunca mais consegui achar normal prender um Pokémon.', vai: 'pedido' },
      pedido: { fala: 'O fim da história está lá embaixo, no leito da Fonte. Eu nunca desci: tem uma coisa grande morando no escuro. Você enxerga no escuro, e entende os desenhos do seu lado melhor do que eu. Desce, e depois me conta o que viu.', faz: { missao: ['sal', 1] } },
      espera: { fala: 'A descida fica no meio da praça, entre as pedras. Eu espero aqui.' },
      decide: { fala: 'Você viu. Dá pra perceber pela sua cara. Me conta.', vai: 'decide2' },
      decide2: { fala: '(Você risca no sal, devagar: os Antigos. A Nascente. A água subindo. As aldeias embaixo dela.)<br><br>Uma enchente, de propósito, pra acabar com os humanos. E os Pokémon pequenos morrem junto. E isso já aconteceu uma vez: foi <b>isso</b> que matou esta Fonte.', vai: 'decide3' },
      decide3: { fala: 'Essa história é sua: você decide. Eu posso copiar em trinta panos pra você levar às três ordens, porque desenho todo mundo entende. Ou a gente guarda segredo, pra não causar pânico. E tem um Absol ali fora oferecendo dinheiro por ela.',
        opcoes: [
          { t: '📜 Levar a história às três ordens.', faz: { flag: ['cap8', 'sal-contou'], missao: ['sal', 'fim'], rep: { forja: 1, bosque: 1, abismo: 1 }, dom: 'memoria' }, vai: 'dContou1' },
          { t: '🤐 Guardar a história.', faz: { flag: ['cap8', 'sal-guardou'], missao: ['sal', 'fim'], rep: { bosque: 1 }, dom: 'silencio', bag: [['max-revive', 1]] }, vai: 'dGuardou1' },
          { t: 'Ainda não sei.' }] },
      dContou1: { fala: 'Vou desenhar os trinta panos. Leva este primeiro. Quem conhece esta história sabe onde bater.' },
      dGuardou1: { fala: 'Então fica entre nós. Toma: com isto você passa sem ser notado.' },
      dContou: { fala: 'Vinte e dois panos já saíram com as caravanas. Dizem que a Forja pendurou um na Bigorna-Mãe, e que no Círculo uma Mãe chorou ao ver.' },
      dGuardou: { fala: 'Às vezes eu quase conto pra alguém. Aí lembro do que combinamos e fico quieta.' },
      dVendeu: { fala: 'O Absol levou a história. Eu vi. Não vou te julgar: você conhece o seu povo melhor do que eu.' }
    } },

  pressagio8: { nome: 'Presságio', sprite: 359,
    falas: [{ se: { flag: 'sal-vendeu' }, no: 'dVendeu' }, { se: { flag: 'cap8' }, no: 'depois' }, { se: { missao: ['sal', 2] }, no: 'oferta' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Você de novo. Lembra do pelo molhado? Eu vim descobrir de onde vem a água. As paredes desta cidade contam, mas eu não sei ler desenho.' },
      oferta: { fala: 'Você desceu e viu. Então é verdade: a água vem de propósito.', vai: 'oferta2' },
      oferta2: { fala: 'A Corte compra essa história, só pra ela, por ₽4.000. Assim a Regente é a única que sabe quando a Cheia vem, e pode vender lugar seguro a quem pagar. Eu não gosto da proposta. Só estou trazendo o recado.',
        opcoes: [
          { t: '🌑 Vender a história à Corte.', faz: { flag: ['cap8', 'sal-vendeu'], missao: ['sal', 'fim'], rep: { abismo: 3, forja: -1, bosque: -1 }, dinheiro: 4000, dom: 'preco' }, vai: 'dVendeu1' },
          { t: 'Não.' }] },
      dVendeu1: { fala: 'Feito. É a primeira má notícia minha que vale dinheiro. Não me sinto melhor por isso.' },
      dVendeu: { fala: 'A Regente leu três vezes. Depois mandou construir barcos. Poucos.' },
      depois: { fala: 'Você não vendeu. Fico aliviado, sinceramente.' }
    } },

  zelador: { nome: 'O Zelador', sprite: 344,
    falas: [
      { se: { missao: ['no', 'fim'] }, no: 'fim' },
      { se: { flag: 'viu-lacos', falas: ['zelador', 1] }, no: 'falta' },
      { se: { falas: ['zelador', 1] }, no: 'varre' },
      { no: 'oi' }
    ],
    nos: {
      oi: { fala: '(O boneco de barro gira devagar e varre o sal da porta de uma casa vazia. Parece não ter notado você.)' },
      varre: { fala: 'Fui feito por duas mãos: uma de gente e uma de Pokémon, as duas ao mesmo tempo. Nenhuma me mandou parar. Por isso eu continuo varrendo.' },
      falta: { fala: 'Você contou os nós na parede lá embaixo. Falta um: o de verdade, de pano. Eu escondi atrás de uma parede falsa, do lado do poço seco, a leste.', faz: { missao: ['no', 0] } },
      fim: { fala: 'Você achou o nó. Então hoje eu posso descansar. Amanhã eu volto a varrer.' }
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
      oi: { fala: '…Ah. É você.', vai: 'oi2' },
      oi2: { fala: 'Eu saí de Pedralume no mesmo dia que você. …Cheguei ontem. Vim devagar. Os Corações vieram todos pra cá, pra esta serra. Dá pra sentir no chão.', vai: 'oi3' },
      oi3: { fala: 'As três ordens também vieram, cada uma por um lado. Cada uma acendeu o seu fogo. Eu acendi este, no meio, e sentei. Fala com quem veio. Depois volta aqui.', faz: { missao: ['degelo', 0] } },
      falta: { fala: '…São três pedras de sentar, e uma está vazia. Uma das ordens não quer falar com você: mandou gente pra te cobrar. Sem as três, não tem conselho. Mas ainda dá pra subir.', vai: 'escolha' },
      pleno: { fala: '…Uma. Duas. Três. Vieram as três, no mesmo fogo.', vai: 'pleno2' },
      pleno2: { fala: 'Fazia onze anos que isso não acontecia. Elas nem se olham, mas estão sentadas juntas. …Foi você que conseguiu isso, com tudo o que fez no caminho.', faz: { flag: 'conselho-pleno' }, vai: 'escolha' },
      escolhe: { fala: '…As três continuam no mesmo fogo. Ninguém foi embora.', vai: 'escolha' },
      escolha: { fala: 'Alguém tem que ir na frente, na geleira. Quem for na frente chega com você à Nascente, e vai falar junto com você lá em cima. Fala com quem você quer que lidere. Ou…',
        opcoes: [
          { t: '(Subir por conta própria.)', faz: { flag: ['subida', 'sobe-so', 'cap9'], missao: ['degelo', 2], dom: 'sozinho' }, vai: 'so' },
          { t: 'Vou falar com eles.', faz: { missao: ['degelo', 1] } }] },
      so: { fala: '…Sozinho. Eu também vim sozinho. Demora mais, mas chega. Vai.' },
      depois: { fala: '…A trilha da geleira fica ao norte. Eu fico cuidando do fogo até você voltar.' }
    } },

  brasa9: { nome: 'Brasa', sprite: 126,
    falas: [{ se: { flag: 'sobe-forja' }, no: 'lider' }, { se: { flag: 'subida' }, no: 'ficou' }, { se: { missao: ['degelo', 1] }, no: 'oferta' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Você chegou inteiro. A Forja me mandou porque acha que você me escuta. Senta perto do fogo do velho.' },
      oferta: { fala: 'A proposta da Forja é simples: a gente sobe armado, chega à Nascente e <b>controla</b> ela. Cano, registro e guarda. Água pra todo mundo, na medida certa. Se os Antigos não gostarem, a gente trouxe corrente.',
        opcoes: [
          { t: '⚒ A Forja lidera a subida.', faz: { flag: ['subida', 'sobe-forja', 'cap9'], missao: ['degelo', 2], rep: { forja: 2, bosque: -1, abismo: -1 }, dom: 'vanguarda' }, vai: 'lider1' },
          { t: 'Vou ouvir os outros.' }] },
      lider1: { fala: 'Certo. Eu vou na frente e você logo atrás. Se eu cair numa fenda, o martelo fica pra você.' },
      lider: { fala: 'Eu vou na frente. A geleira fica ao norte. Vamos logo.' },
      ficou: { fala: 'Você não me escolheu. Tudo bem, eu subo atrás. Alguém vai ter que consertar o que quebrar.' }
    } },

  meganium9: { nome: 'Mãe Meganium', sprite: 154,
    falas: [{ se: { flag: 'sobe-bosque' }, no: 'lider' }, { se: { flag: 'subida' }, no: 'ficou' }, { se: { missao: ['degelo', 1] }, no: 'oferta' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Você veio. Aqui em cima não cresce nada, mas eu sinto raiz debaixo do gelo. É a Nascente. Tudo o que é verde começou nela.' },
      oferta: { fala: 'O Círculo propõe não fazer nada: subir, pedir licença e deixar os Antigos terminarem. A Cheia acaba com o machado, o forno e a gaiola. Acaba com aldeias também, eu sei. Eu votei contra. Mas esta é a proposta do Círculo, e eu vim trazê-la.',
        opcoes: [
          { t: '🌿 O Círculo lidera a subida.', faz: { flag: ['subida', 'sobe-bosque', 'cap9'], missao: ['degelo', 2], rep: { bosque: 2, forja: -1, abismo: -1 }, dom: 'seiva' }, vai: 'lider1' },
          { t: 'Vou ouvir os outros.' }] },
      lider1: { fala: 'Então eu vou na frente. Se lá em cima você decidir diferente do Círculo, eu não vou te impedir.' },
      lider: { fala: 'A geleira fica ao norte. Eu vou na frente, abrindo o caminho.' },
      ficou: { fala: 'O Círculo não vai na frente. Então vamos atrás.' }
    } },

  lasca9: { nome: 'Lasca', sprite: 302,
    falas: [{ se: { flag: 'sobe-abismo' }, no: 'lider' }, { se: { flag: 'subida' }, no: 'ficou' }, { se: { missao: ['degelo', 1] }, no: 'oferta' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'A Regente não sobe montanha, então mandou a mim. Ela disse que você me escuta. É a primeira vez que me mandam representar a Corte.' },
      oferta: { fala: 'A proposta da Corte: os Antigos param, e os Corações voltam pra quem cuidava deles antes, que somos nós. A Corte passa a saber onde e quando a água nasce, e decide quem recebe. Cobrando, claro. Mas barato pros amigos.',
        opcoes: [
          { t: '🌑 A Corte lidera a subida.', faz: { flag: ['subida', 'sobe-abismo', 'cap9'], missao: ['degelo', 2], rep: { abismo: 2, forja: -1, bosque: -1 }, dom: 'vigia' }, vai: 'lider1' },
          { t: 'Vou ouvir os outros.' }] },
      lider1: { fala: 'Sério? Eu, na frente? Tá bom. Eu enxergo no escuro e sei onde o gelo está fraco. Pisa onde eu pisar.' },
      lider: { fala: 'Eu vou na frente. A geleira fica ao norte. Não conta pra ninguém que eu estou com medo.' },
      ficou: { fala: 'Não fui escolhido. Tudo bem. Eu subo atrás, de olho em tudo.' }
    } },

  nevasca: { nome: 'Dona Nevasca', sprite: 614,
    falas: [
      { se: { missao: ['pingo', 'fim'] }, no: 'grata' },
      { se: { missao: ['pingo', 0], flag: 'achou-pingo' }, no: 'voltou' },
      { se: { missao: ['pingo', 0] }, no: 'espera' },
      { no: 'pede' }
    ],
    nos: {
      pede: { fala: 'Você vai subir a geleira? Meu filhote, o Pingo, saiu atrás de um floco de neve e não voltou. É um Cubchoo de nariz escorrendo. Eu não posso sair daqui: tenho mais dois pra cuidar.',
        opcoes: [{ t: 'Eu olho.', faz: { missao: ['pingo', 0] }, vai: 'vai' }, { t: 'Não prometo.' }] },
      vai: { fala: 'Ele gosta de escorregar. Deve estar perto de um lago congelado.' },
      espera: { fala: 'O Pingo deve estar perto de um lago congelado, na geleira.' },
      voltou: { fala: 'PINGO! Limpa esse nariz!<br><br>Obrigada. Toma: eu estava guardando pra uma emergência, e você resolveu a minha.', faz: { missao: ['pingo', 'fim'], rep: { bosque: 1 }, bag: [['full-restore', 2], ['max-revive', 1]] } },
      grata: { fala: 'Agora ele só brinca onde eu consigo ver. Ele reclama, mas obedece.' }
    } },

  pingo: { nome: 'Pingo', sprite: 613,
    falas: [{ se: { flag: 'achou-pingo' }, no: 'casa' }, { no: 'achado' }],
    nos: {
      achado: { fala: 'Eu achei o floco! Era enorme! Mas derreteu. …Você sabe o caminho de volta? Eu esqueci.',
        opcoes: [{ t: 'Vem comigo.', faz: { flag: 'achou-pingo' }, vai: 'vai' }] },
      vai: { fala: 'Tá! Eu vou escorregando, que é mais rápido!' },
      casa: { fala: 'A mãe disse que não é pra seguir floco grande. Mas era muito grande!' }
    } },

  mamute: { nome: 'Vó Mamute', sprite: 473,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Deita aqui no meu pelo, que é quente. Cabe a comitiva inteira.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: 'Só passando.' }] }
    } },

  carteiro: { nome: 'Carteiro', sprite: 225,
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'Entrega! …Ah, é freguês. Eu sou o Carteiro: subo a serra com encomendas e vendo o que sobra. E tenho cartas pra você, de gente que você conheceu no caminho.',
        opcoes: [{ t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: '✉ Ler as cartas.', vai: 'cartas' }, { t: 'Depois.' }] },
      cartas: { fala: 'Tenho várias. De onde você quer ler?',
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
      cPedralume: { fala: '“Filho: a arruda pegou de novo. Não pisa quando voltar. E volta. — Vó Vileplume.”', vai: 'cartas' },
      cSerraPeixe: { fala: '“O peixe sobe a pedra todo dia. O homem do chapéu ensinou meu filhote a assobiar. Eu deixei. — Mãe Ursa.”', vai: 'cartas' },
      cSerra: { fala: '“O inverno passou, e estamos todos bem. — Mãe Ursa.”', vai: 'cartas' },
      cVauTirou: { fala: '“A arena virou celeiro. Dá menos moeda e mais pão. Eu ainda apago as tochas, por costume. — Baltazar.”', vai: 'cartas' },
      cVau: { fala: '“A arena continua cheia. Pintaram a sua cara no muro, do lado da do Campeão. Ficou torta. — Baltazar.”', vai: 'cartas' },
      cFerro: { fala: '“Os nove capacetes foram pra parede da Bigorna-Mãe. Todo mundo que passa tira o chapéu. — Tatu.”', vai: 'cartas' },
      cTocos: { fala: '“A praça já tem um pouco de sombra. O Brotinho senta embaixo e diz que é dele. — Roque.”', vai: 'cartas' },
      cPonteCaiu: { fala: '“Daqui não dá mais pra ver o outro lado. Sinto falta de lá. Mas estou bem. — Lia.”', vai: 'cartas' },
      cPonte: { fala: '“Hoje passou remédio. Ontem passou um caçador, e eu mandei voltar. — Lia.”', vai: 'cartas' },
      cGelo: { fala: 'Esta eu não consigo entregar: não tem nome. Achei presa no gelo, perto de um arvoredo a oeste da trilha da geleira. A letra é de gente, e o selo é uma marca de pata.', faz: { missao: ['gelo', 0] }, vai: 'cartas' }
    } },

  /* ===== capítulo 10 ===== */
  veu10: { nome: 'Dama Véu', sprite: 429,
    falas: [{ se: { missao: ['nascente', 'nao'] }, no: 'oi' }, { no: 'conta' }],
    nos: {
      oi: { fala: 'Você chegou. Olha em volta: é verde, no meio do gelo. É a Nascente que faz isso. Tudo o que vive começou aqui, e é aqui que os Antigos querem acabar com tudo.', vai: 'oi2' },
      oi2: { fala: 'Eles estão lá dentro, fechando a fonte. Quando fecharem, a água vai se acumular atrás da serra, até a serra romper. Essa é a Cheia. Você não consegue matar os Antigos. Mas consegue fazer com que <b>parem</b> por um instante — e nesse instante eles escutam.', faz: { missao: ['nascente', 0] }, vai: 'conta' },
      conta: { fala: 'O que você pode dizer lá dentro depende do que trouxe. São quatro coisas: a confiança de uma humana, a Lia. O sino de Pedralume devolvido. As três ordens reunidas no mesmo fogo. E o nó de pano do deserto. Com as quatro, existe uma saída que ninguém tentou. Com menos, você ainda tem outras escolhas.',
        opcoes: [
          { t: '🪢 (Mostrar o nó de pano.)', se: { item: 'no' }, vai: 'temNo' },
          { t: '🔔 (Pensar no sino de Pedralume.)', se: { flag: 'sino-devolvido' }, vai: 'temSino' },
          { t: '🔥 (Pensar no fogo do meio.)', se: { flag: 'conselho-pleno' }, vai: 'temFogo' },
          { t: '🧣 (Pensar na Lia.)', se: { flag: 'lia-confia' }, vai: 'temLia' },
          { t: 'Entendi.' }] },
      temNo: { fala: 'É o nó. Duas pontas iguais: nenhuma manda na outra.' },
      temSino: { fala: 'O sino voltou pra quem se lembrava dele. Isso conta.' },
      temFogo: { fala: 'As três ordens sentaram juntas, depois de onze anos. Eu estava lá e vi.' },
      temLia: { fala: 'A Lia subiu até aqui. Está ali, sem saber se pode entrar. Ela é importante.' }
    } },

  lia10: { nome: 'Lia, a patrulheira', sprite: 'patrulheira',
    falas: [{ se: { falas: ['lia10', 1] }, no: 'oi2' }, { no: 'oi' }],
    nos: {
      oi: { fala: 'Eu sei que não devia estar aqui: isto é assunto de vocês. Mas se a água descer, cai em cima da minha gente também. Alguém do nosso lado tinha que subir pra pedir uma chance.' },
      oi2: { fala: 'Eu não vou entrar com você: eles não querem ver gente. Mas lembra de uma coisa. Tem uma menina no Vau que para a luta quando acha que passou do ponto. Tem um caçador que trocou a gaiola pela pesca. A gente aprende. Devagar, mas aprende.' }
    } },

  nico10: { nome: 'Nico', sprite: 'menino',
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'Eu subi com a Lia. Ela disse que não era lugar de criança, mas eu vim assim mesmo. Trouxe pão pra depois. Vai ter depois, né?' }
    } },

  bia10: { nome: 'Bia', sprite: 'menina',
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'A Lã quis subir pra ver de onde vem a força dos Pokémon. Eu vim junto. A nossa regra continua valendo, e eu acho que ainda não é hora de parar. Vai lá.' }
    } },

  brasa10: { nome: 'Brasa', sprite: 126,
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'A corrente está pronta. …Eu sei o que eu disse lá embaixo. Aqui em cima, ouvindo essa água, eu já não tenho tanta certeza. Entra. Se você disser “Forja” lá dentro, eu entro e prendo a Nascente. Se disser outra coisa, eu respeito.' }
    } },

  meganium10: { nome: 'Mãe Meganium', sprite: 154,
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'Eu senti a raiz do mundo durante toda a subida. Ela não está com raiva: está cansada. Entra. O que você decidir, o Círculo aceita. Foi isso que eu vim garantir.' }
    } },

  lasca10: { nome: 'Lasca', sprite: 302,
    falas: [{ no: 'oi' }],
    nos: {
      oi: { fala: 'Cheguei na frente! Olhei pra dentro da gruta e voltei correndo: aquilo lá dentro é grande demais. Se você disser “Corte” lá dentro, eu assumo os Corações. Se disser outra coisa, eu invento uma desculpa pra Regente.' }
    } },

  chansey10: { nome: 'Dona Chansey', sprite: 113,
    falas: [{ no: 'balcao' }],
    nos: {
      balcao: { fala: 'Pousada do Sino, agora aqui em cima. Eu vim atrás do Tio do Poço, que esquece de comer. Ele parou no acampamento, e eu continuei. Aqui tem cama pra todo mundo.',
        opcoes: [{ t: '🛏 Descansar ({custo}).', faz: { cura: true } }, { t: 'Só passando.' }] }
    } },

  kecleon10: { nome: 'Kecleon, o mercador', sprite: 352,
    falas: [{ no: 'banca' }],
    nos: {
      banca: { fala: 'O Kecleon vende de tudo, até aqui em cima! Quer ver?',
        opcoes: [{ t: '🛒 Ver as mercadorias.', faz: { loja: true } }, { t: 'Depois.' }] }
    } },

  antigos: { nome: 'Os Antigos', sprite: '@antigo',
    falas: [{ no: 'escutam' }],
    nos: {
      escutam: { fala: '(Eles pararam. A Nascente está em silêncio. Os Antigos não falam com palavras, mas você entende a pergunta, e ela pesa.)<br><br><i>Pequeno. Você carregou os nossos pedaços por dez terras. Viu o que os humanos fazem com a água e com vocês. Nós íamos lavar tudo. Diga por que não.</i>',
        opcoes: [
          { t: '🪢 (Estender o nó de pano: uma ponta pra vocês, outra pra eles.)', se: { flag: ['lia-confia', 'sino-devolvido', 'conselho-pleno'], item: 'no' }, vai: 'laco' },
          { t: '⚒ A Forja assenta a Nascente: água medida, pra todos.', se: { flag: 'sobe-forja' }, vai: 'cano' },
          { t: '🌑 A Corte volta a guardar os Corações.', se: { flag: 'sobe-abismo' }, vai: 'sombra' },
          { t: '🌿 O Círculo pede: terminem. Que o bosque volte.', se: { flag: 'sobe-bosque' }, vai: 'cheiaBosque' },
          { t: '🌊 (Não dizer nada. Deixar a água vir.)', vai: 'cheia' }] },
      laco: { fala: '(Você põe o nó de pano no chão e segura uma ponta com os dentes. A outra fica solta, apontando pra entrada da gruta, onde a Lia espera.)<br><br><i>Nós conhecemos isto. Fomos nós que ensinamos, antes da primeira Cheia. Achamos que os dois lados tinham esquecido.</i>', vai: 'laco2' },
      laco2: { fala: '(Lá fora, um sino rachado toca. Uma vez só.)<br><br><i>Um nó precisa de dois. Chame a humana. Se ela pegar a outra ponta, nós abrimos a fonte e ficamos olhando de perto.</i>', vai: 'laco3' },
      laco3: { fala: 'A Lia entra devagar, de mãos vazias. Olha pros Antigos, olha pra você, e pega a outra ponta.<br><br>A Nascente volta a correr.<br><br>Ninguém foi levado pela água, e ninguém foi acorrentado. Daqui a muitos anos, humanos e Pokémon vão andar juntos por escolha. Começou aqui — e foi um Pokémon quem propôs.', faz: { missao: ['nascente', 'fim'], flag: 'final-laco', fim: '🪢 O Laço' } },
      cano: { fala: '(Atrás de você, a Brasa bate o martelo três vezes na pedra. Os Antigos não reagem: só observam as correntes subindo.)<br><br><i>Vocês preferem a água presa a ficar sem água. Nós entendemos a sede.</i>', vai: 'cano2' },
      cano2: { fala: 'A Nascente é presa em bronze. Canos levam água às dez terras: tem em toda praça, na medida certa, com um guarda da Forja em cada registro. Ninguém mais briga por um Coração. E ninguém mais bebe sem pedir.<br><br>Os Antigos dormem acorrentados no fundo da gruta.', faz: { missao: ['nascente', 'fim'], flag: 'final-cano', fim: '⚒ O Cano' } },
      sombra: { fala: '(As sombras da gruta crescem. O Lasca entra, pequeno e tremendo, com uma lamparina. Os Antigos olham pra ele por muito tempo.)<br><br><i>Os que ficavam acordados. Nós lembramos de vocês. Foram os únicos que avisaram.</i>', vai: 'sombra2' },
      sombra2: { fala: 'Os Corações voltam aos seus lugares, e a Corte do Abismo volta a vigiá-los, como antes de ser expulsa. A água corre de novo. A Regente decide onde, quanto e quando. As aldeias que expulsaram a Corte agora precisam pedir água a ela.<br><br>Ela atende a todas. De algumas, cobra.', faz: { missao: ['nascente', 'fim'], flag: 'final-sombra', fim: '🌑 A Sombra' } },
      cheiaBosque: { fala: '(A Mãe Meganium entra e se curva. Não pede perdão: pede licença. Os Antigos voltam a olhar pra fonte.)<br><br><i>O bosque pede o que nós íamos fazer. Então a água vai descer devagar nas encostas e depressa nos fornos.</i>', vai: 'cheia2' },
      cheia: { fala: '(Você não diz nada. Talvez eles tenham razão. Os Antigos esperam mais um instante e voltam a olhar pra fonte.)<br><br><i>Então será como decidimos. Procure um lugar alto, pequeno.</i>', vai: 'cheia2' },
      cheia2: { fala: 'A Nascente se fecha. A água se acumula atrás da serra por três dias. No quarto dia, a serra rompe.<br><br>A Cheia leva os machados, os fornos, as gaiolas e a arena. Leva também Pedralume, a toca dos refugiados e a Aldeia dos Tocos. Quando a água baixa, o bosque é o primeiro a voltar.<br><br>O último desenho da parede de sal aconteceu de novo.', faz: { missao: ['nascente', 'fim'], flag: 'final-cheia', fim: '🌊 A Cheia' } }
    } }
};
