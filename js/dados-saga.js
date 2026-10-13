/* ============ ⚔ Saga — o MUNDO (capítulos 1 a 3) ============
   Dado puro, SEM imports: mapas pra andar, NPCs com diálogo, missões, itens-chave e dons. Quem lê e decide é
   `saga-mundo.js` (regras puras, testadas); quem desenha é `saga-cena.js`; quem executa é `tela-saga.js`.
   São DOIS arquivos, por causa do 🌍 Editor de mundo:
     · este (`dados-saga.js`) tem o que é REGRA e ARTE — os tiles e os temas. Mexer aqui é mexer em código.
     · `dados-saga-mundo.js` tem o CONTEÚDO — capítulos, mapas, personagens, missões, itens-chave, dons. É a
       camada de FÁBRICA do que o editor edita e publica: o ⬇ Gerar arquivo do editor cospe aquele arquivo inteiro.
   Quem importa continua importando só daqui (o conteúdo é reexportado no fim). O roteiro dos 10 capítulos está
   em `docs/saga-historia.md`.

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

export * from './dados-saga-mundo.js';
