/* ============ ⚔ Saga — o MUNDO (capítulo 1: o Vale do Orvalho) ============
   Dado puro, SEM imports: mapas pra andar, NPCs com diálogo, missões, itens-chave e dons. Quem lê e decide é
   `saga-mundo.js` (regras puras, testadas); quem desenha é `saga-cena.js`; quem executa é `tela-saga.js`.

   O mundo é uma CAMADA sobre as rotas que já existem: cada mapa aponta pra uma rota do mapa da jornada pelo
   ÍNDICE (`rota: 0` = a 1ª rota da Gen escolhida). Encontro no mato alto é `startBattle` daquela rota, o Alfa é o
   Alfa dela — então níveis, pool, Pokédex, modo offline (`baixarGen`) e as 9 Gens valem sem nenhuma busca nova.
   Por isso a história nunca cita a espécie de um inimigo: quem é o Alfa depende da Gen. Os NPCs têm espécie fixa
   porque NPC é só uma imagem (o sprite), não um Pokémon que precisa ser baixado.

   COMO UM MAPA É ESCRITO: `grade` é uma lista de linhas do MESMO tamanho. Cada caractere é um TILE (tabela
   `TILES`) ou a chave de um OBJETO em `objs` (aí o chão embaixo é `chao`). Um objeto pode ser uma LISTA de
   variantes — vale a primeira cujo `se` for verdadeiro; nenhuma valendo, ali é só chão.
     { npc: id }                      bloqueia; esbarrar conversa
     { porta: [mapa, chave] }         pisar leva pro caractere `chave` do outro mapa (`como`: o tile que ela imita)
     { placa: 'texto' }               bloqueia; esbarrar lê
     { bau: id, texto, faz }          bloqueia; a primeira vez aplica `faz` (efeitos, abaixo)
     { inimigo: { id, tipo } }        bloqueia; esbarrar luta (`bando`, `treinador`, `alfa`). Vencido, some.
     { gatilho: id, texto, faz }      não bloqueia; pisar mostra o texto
     { chegada: true }                só um ponto de chegada (o começo do jogo)
   `tests/saga-mundo.test.js` cobra: linhas do mesmo tamanho, caractere conhecido, porta que existe dos dois
   lados, tudo alcançável a pé e todo `vai`/item/missão/dom de diálogo apontando pra algo que existe.

   CONDIÇÃO (`se`, tudo é E): flag · sem · item · semItem · rep [facção, mínimo] · repAbaixo [facção, teto] ·
   missao [id, etapa | 'nao' | 'fim'] · tipo [tipos do SEU Pokémon] · falas [npc, quantas conversas] · dom.
   EFEITO (`faz`): flag · tira · item · perde · dinheiro · bag [[item, n]] · rep {facção: ±n} ·
   missao [id, etapa | 'fim'] · dom · cura · loja · viajar. */

export const FACCOES = {
  forja: { nome: 'Ordem da Forja', emoji: '⚒' },
  bosque: { nome: 'Círculo do Bosque', emoji: '🌿' },
  abismo: { nome: 'Corte do Abismo', emoji: '🌑' }
};

/* `mato`: anda e pode ter encontro. `falsa`: desenha como árvore mas deixa passar (o dom Faro a faz cintilar). */
export const TILES = {
  '.': { c: 'grama' },
  '"': { c: 'mato', e: '🌾', mato: true },
  '=': { c: 'trilha' },
  'f': { c: 'grama', e: '🌼' },
  'T': { c: 'arvore', e: '🌲', bloqueia: true },
  't': { c: 'arvore', e: '🌲', falsa: true },
  '~': { c: 'agua', bloqueia: true },
  '^': { c: 'rocha', e: '⛰', bloqueia: true },
  'c': { c: 'grama', e: '🏠', bloqueia: true },
  '#': { c: 'parede', bloqueia: true },
  '_': { c: 'piso' },
  ':': { c: 'piso escuro', mato: true }
};

/* Itens-chave: vivem em `S.saga.itens`, não na mochila — não têm efeito em batalha nem preço, só abrem conversa. */
export const ITENS_SAGA = {
  lamparina: { nome: 'Lamparina do Sineiro', emoji: '🏮', desc: 'Sem ela, as Ruínas da Fonte engolem quem entra.' },
  coracao: { nome: 'Coração da Fonte', emoji: '💠', desc: 'Morno, pulsando devagar. A aldeia inteira vai querer isto.' },
  minerio: { nome: 'Caixote de Minério', emoji: '📦', desc: 'Tem a marca do martelo da ferreira Brasa.' },
  sino: { nome: 'Sino Rachado', emoji: '🔔', desc: 'Não toca há muito tempo. Alguém ainda deve se lembrar dele.' }
};

/* Dons: habilidades que só a Saga dá, ganhas por ESCOLHA. Ficam no seu Pokémon (`m.dons`). Os dois de batalha
   são lidos em `regras.multSaga`; os dois de mapa, em `saga-mundo.js`. */
export const DONS = {
  brasa: { nome: 'Brasa da Forja', emoji: '⚒', desc: 'Seus golpes causam 20% a mais em inimigo em Ruína.' },
  casca: { nome: 'Casca do Bosque', emoji: '🌿', desc: 'Você recebe 10% a menos de dano.' },
  sombra: { nome: 'Passo de Sombra', emoji: '🌑', desc: 'Metade dos encontros no mato alto.' },
  faro: { nome: 'Faro de Quem Espera', emoji: '✨', desc: 'O que está escondido no mapa cintila pra você.' }
};

/* Missão secreta não aparece no diário até começar — e nenhuma placa diz que ela existe. */
export const MISSOES_SAGA = {
  fonte: { nome: 'A Fonte Calada', etapas: [
    'Ouça os dois lados e volte ao Ancião: a ferreira Brasa, na aldeia, e a Mãe Meganium, no fundo do Bosque do Orvalho (oeste).',
    'Com a lamparina, entre nas Ruínas da Fonte: uma fenda no paredão, no fim da Estrada Velha (leste).',
    'O Coração da Fonte está com você. Decida a quem entregá-lo.'
  ] },
  canteiros: { nome: 'Os canteiros da Vó', etapas: [
    'Expulse o bando acampado ao sul do Bosque do Orvalho, perto do charco, e volte à Vó Vileplume.'
  ] },
  minerio: { nome: 'A marca do martelo', etapas: [
    'Ache o caixote de minério num recanto de pedra, a leste da Estrada Velha, e leve à ferreira Brasa.'
  ] },
  sino: { nome: 'O que o poço lembra', secreta: true, etapas: [
    '“A árvore que não é árvore.” Algo no norte do Bosque do Orvalho não é o que parece.',
    'Alguém na aldeia deve se lembrar deste sino. Quem ali tem memória comprida?'
  ] }
};

export const INICIO = { mapa: 'aldeia', em: '@' };

export const MAPAS_SAGA = {
  aldeia: {
    nome: 'Pedralume', desc: 'Uma aldeia em volta de uma fonte que não canta mais.', rota: 0, chao: '.',
    grade: [
      'TTTTTTTTTTTGTTTTTTTTTTTT',
      'T..........=...........T',
      'T..c.c.....=.....c.c...T',
      'T...A......=......B....T',
      'T..........=...........T',
      'T....f.....=......f....T',
      '1======================2',
      'T..........=...........T',
      'T...c......=.....c.....T',
      'T...H...W..=......M....T',
      'T......S...=...K.......T',
      'T.f........@........f..T',
      'T......................T',
      'TTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      '@': { chegada: true },
      '1': { porta: ['bosque', '1'], como: '=' },
      '2': { porta: ['estrada', '2'], como: '=' },
      A: { npc: 'anciao' }, B: { npc: 'brasa' }, G: { npc: 'guarda' }, H: { npc: 'chansey' },
      M: { npc: 'kecleon' }, S: { npc: 'slowpoke' }, K: { npc: 'pichu' },
      W: { placa: 'Um poço. A corda desce, bate em pedra seca e volta leve.', emoji: '🪣' }
    }
  },
  bosque: {
    nome: 'Bosque do Orvalho', desc: 'As últimas flores do vale ainda abrem aqui.', rota: 0, chao: '.',
    grade: [
      'TTTTTTTT4TTTTTTTTTTTTTTT',
      'T"""..TTtTT....c..""""TT',
      'T""""..T.T.....V..""""fT',
      'T""""...........=..."""T',
      'T.""........TT..=......T',
      'T......TT...TT..=======T',
      'T..a...TT.......=======1',
      'T..........""""........T',
      'TTT..f.....""""""..TTT.T',
      'T.f.f......""""""......T',
      'T..R..f.....""""..~~~..T',
      'T.f.f..........x..~~~..T',
      'T......................T',
      'TTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      '1': { porta: ['aldeia', '1'], como: '=' },
      '4': { porta: ['clareira', '4'], como: 'T' },   // atrás da árvore falsa: a porta também se veste de árvore
      V: { npc: 'vo' }, R: { npc: 'meganium' },
      a: { bau: 'bosque-a', texto: 'Um cesto esquecido entre as raízes. Dentro, duas poções ainda lacradas.', faz: { bag: [['potion', 2]] } },
      x: { inimigo: { id: 'pisoteadores', tipo: 'bando' } }
    }
  },
  clareira: {
    nome: 'Clareira do Sineiro', desc: 'Ninguém vem aqui. Alguém, mesmo assim, varre as folhas.', rota: 0, chao: '.',
    grade: [
      'TTTTTTTTTTTT',
      'T..f....f..T',
      'T....Z.....T',
      'T..f..s..f.T',
      'T..........T',
      'T..Y.......T',
      'TTTTT4TTTTTT',
      'TTTTTTTTTTTT'
    ],
    objs: {
      '4': { porta: ['bosque', '4'] },
      Y: { npc: 'veu' },
      Z: { placa: 'Uma lápide sem nome. Alguém riscou nela, com unha paciente, o desenho de um sino.', emoji: '🪦' },
      s: { bau: 'sino', texto: 'Um baú pequeno, sem tranca. Dentro, embrulhado em pano, um sino de bronze rachado de alto a baixo.', faz: { item: 'sino', missao: ['sino', 1] } }
    }
  },
  estrada: {
    nome: 'Estrada Velha', desc: 'Já passou carroça por aqui. Hoje passa o que tem fome.', rota: 1, chao: '.',
    grade: [
      'TTTTTTTTTTTTTTTTTT^^5^^^^T',
      'T...""""".....T....=L....T',
      'T..""""""....TT....=.....T',
      'T...""""...........=..""eT',
      'T...........h......=.."""T',
      'T....Q.............=.....T',
      '2===================.....T',
      'T.......TTTT.............T',
      'T..""""".TTTT...^^^^^^^..T',
      'T.."""""........y.m...^..T',
      'T...............^.....^..T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    objs: {
      '2': { porta: ['aldeia', '2'], como: '=' },
      '5': { porta: ['ruinas', '5'], como: '^', emoji: '🕳' },
      L: { se: { semItem: 'lamparina' }, placa: 'Uma fenda no paredão. Lá dentro é escuro de um jeito que parece ter peso. Sem luz, não dá.', emoji: '🕳' },
      Q: { npc: 'lasca' },
      h: { inimigo: { id: 'cacador', tipo: 'treinador' } },
      y: { inimigo: { id: 'rondadores', tipo: 'bando' } },
      m: { bau: 'caixote', emoji: '📦', texto: 'Um caixote tombado, com um martelo marcado a fogo na tampa. Pesa como promessa.', faz: { item: 'minerio' } },
      e: { bau: 'estrada-e', texto: 'Uma bolsa de viajante, largada às pressas. Quem largou não voltou pra buscar.', faz: { dinheiro: 150, bag: [['super-potion', 1]] } }
    }
  },
  ruinas: {
    nome: 'Ruínas da Fonte', desc: 'A água nascia aqui. O que nasce agora é outra coisa.', rota: 2, chao: '_',
    grade: [
      '####################',
      '######___X____######',
      '#####__________#####',
      '#####____~~____#####',
      '#######__::__#######',
      '#######::::::#######',
      '###____::##::____###',
      '###_r__::##::__:_###',
      '###____::::::____###',
      '#######::::::#######',
      '#########__#########',
      '#########__#########',
      '#########g_#########',
      '#########5##########'
    ],
    objs: {
      '5': { porta: ['estrada', '5'] },
      g: { se: { sem: 'viu-eco' }, gatilho: 'eco', texto: 'A lamparina abre um círculo pequeno no escuro. Do fundo vem um som de respiração — grande, lenta, e mais de uma.', faz: { flag: 'viu-eco' } },
      r: { bau: 'ruinas-r', texto: 'Ferramentas de aprendiz, largadas no chão: duas picaretas e um embornal. O embornal ainda serve.', faz: { bag: [['revive', 1], ['super-potion', 1]] } },
      X: [
        { se: { sem: 'venceu:alfa' }, inimigo: { id: 'alfa', tipo: 'alfa' } },
        { se: { sem: 'pegou-coracao' }, bau: 'coracao', emoji: '💠',
          texto: 'No leito seco, o encaixe do Coração está rachado por raízes de um lado e lascado a picareta do outro. Os dois chegaram perto demais. O Alfa só fez ninho em cima do que sobrou solto — e quente.<br><br>Você pega o <b>Coração da Fonte</b>.',
          faz: { item: 'coracao', flag: 'pegou-coracao', missao: ['fonte', 2] } },
        { placa: 'O leito vazio da nascente. Raiz de um lado, marca de picareta do outro.', emoji: '🕳' }
      ]
    }
  }
};

/* ---- NPCs ----
   `sprite` = id da espécie (só a imagem). `falas` = por onde a conversa COMEÇA: vale a primeira entrada cujo `se`
   for verdadeiro (a última, sem `se`, é o padrão). Cada nó: `fala`, `faz` (efeitos ao chegar nele), `opcoes`
   ([{ t, se, faz, vai }]) ou `vai` (segue com "Continuar"). Sem `opcoes` nem `vai`, a conversa acaba ali.
   Marcadores no texto: {eu} = o seu nome · {custo} = o preço do descanso. */
export const NPCS = {
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
      lamparina: { fala: 'Tome. Era do sineiro, quando a aldeia ainda tinha um. As ruínas ficam no fim da Estrada Velha, a leste — uma fenda no paredão. Leve gente com você, se tiver: o que está lá em cima não mora sozinho.', faz: { item: 'lamparina', missao: ['fonte', 1] } },
      vaiLa: { fala: 'As ruínas ficam no fim da Estrada Velha, a leste. E descanse antes, na pousada. Herói cansado é só um cansado.' },
      comCoracao: { fala: '…Então era isso. O Coração da Fonte, fora do leito.', vai: 'comCoracao2' },
      comCoracao2: { fala: 'Não me dê. Eu sou velho demais pra carregar o que uma aldeia inteira vai disputar. A Forja diz que sabe assentá-lo com ferro. O Círculo, com raiz. Os dois sabem, cada um do seu jeito — e cada jeito tem um preço que o outro paga.' },
      depoisForja: { fala: 'A água voltou. Vem por cano de ferro, com gosto de moeda, mas vem. O bosque lá embaixo anda mais calado. Você fez uma escolha, {eu}. Eu só queria que alguém fizesse.' },
      depoisBosque: { fala: 'A água voltou — fina, fria, e só até onde as raízes deixam. A forja apagou dois fornos e a Brasa não fala comigo. Acho que nem com você. Mas as crianças estão bebendo.' },
      depoisAbismo: { fala: 'A fonte continua seca. E um Sableye anda rindo sozinho pela estrada. Eu não sei o que você fez, {eu}. Só sei que perguntei pra pessoa errada.' }
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
      pedido: { fala: 'Não pisa aí! …Ah, não é você. Desculpa, filho, é que eu já grito antes de olhar. Tem um bando acampado nos meus canteiros, ali pro sul, perto do charco. Onze dias sem a fonte e os bichos descem todos pra cá, atrás de qualquer coisa verde.',
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
      sino3: { fala: 'Você ouviu um velho lerdo até o fim. Quase ninguém ouve. Fica com isto: é o jeito de olhar de quem não tem pressa. Coisa escondida cintila pra quem espera.', faz: { missao: ['sino', 'fim'], flag: 'confianca-abismo', rep: { abismo: 2 }, dom: 'faro' } },
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
      aberto: { fala: 'O Ancião mandou abrir o Passo pra você. Não disse se era prêmio ou despejo. Além dele não tem aldeia: só rota e bicho. Dá pra voltar quando quiser.',
        opcoes: [{ t: '🧭 Seguir viagem pelo Passo do Norte.', faz: { viajar: true } }, { t: 'Ainda não.' }] }
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
    } }
};
