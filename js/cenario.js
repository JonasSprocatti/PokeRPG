/* ============ cenário da batalha ============
   A cena da luta era sempre a mesma caixa, em qualquer lugar do mundo: lutar numa caverna, no mar e numa usina
   elétrica tinha exatamente a mesma cara. Aqui cada rota ganha um clima próprio — céu, chão e uma cor de luz.

   De onde sai o clima, em ordem: o `tema` que a rota declara (quando o mapa gerado trouxer um), senão o texto da
   rota (nome + descrição) contra uma lista de palavras. Usar o TEXTO da rota é o que faz isto valer pras 90
   rotas do jogo e pras que vierem, sem tabela pra manter: rota nova com "caverna" no nome já nasce com cara de
   caverna. `padrao` é a grama de sempre, que é o certo pra rota de campo aberto.

   Só aparência: nada aqui mexe em regra, dano ou encontro. Por isso mora num módulo próprio, puro e testável. */

/* Cada clima: as duas cores do céu, a cor do chão e a luz de ambiente. Ordem IMPORTA — o primeiro que casar
   vence, então o específico vem antes do genérico ('vulcão' antes de 'montanha'). */
export const CLIMAS = [
  { id: 'vulcao', palavras: ['vulc', 'magma', 'lava', 'forno', 'cratera', 'chamas'], ceu: ['#3a1206', '#8c2a10'], chao: '#4a1a0c', luz: '#ff7a3d' },
  { id: 'caverna', palavras: ['caverna', 'túnel', 'tunel', 'mina', 'subterr', 'gruta', 'monte lua'], ceu: ['#141428', '#2b2b4d'], chao: '#3a3550', luz: '#8e8ad6' },
  { id: 'gelo', palavras: ['gelo', 'gelad', 'neve', 'glaci', 'inverno', 'espuma'], ceu: ['#20405e', '#8fc4e8'], chao: '#b9d9ee', luz: '#cfefff' },   // antes do mar: "ilhas de gelo" é gelo
  { id: 'mar', palavras: ['mar', 'praia', 'costa', 'oceano', 'ilha', 'lago', 'rio', 'água', 'agua', 'aqu'], ceu: ['#0b3a5c', '#1f7fa8'], chao: '#1d5f77', luz: '#4fd0e0' },
  { id: 'floresta', palavras: ['floresta', 'bosque', 'mata', 'selva', 'arvor', 'árvor', 'ilex', 'jardim'], ceu: ['#12301a', '#2f6b34'], chao: '#2a5327', luz: '#7fd48a' },
  { id: 'usina', palavras: ['usina', 'elétr', 'eletr', 'fábrica', 'fabrica', 'reator', 'máquina', 'maquina', 'laborat'], ceu: ['#1a1a2e', '#3d3a6b'], chao: '#2e2c45', luz: '#ffd94a' },
  { id: 'fantasma', palavras: ['torre', 'cemit', 'assombr', 'mansão', 'mansao', 'ruína', 'ruina', 'queimada', 'sombra'], ceu: ['#17111f', '#3b2550'], chao: '#2a1f38', luz: '#c07ef0' },
  { id: 'deserto', palavras: ['deserto', 'areia', 'dunas', 'ermo'], ceu: ['#5c3d12', '#d8a54a'], chao: '#b98b45', luz: '#ffd28a' },
  { id: 'montanha', palavras: ['monte', 'montanha', 'pico', 'rocha', 'pedra', 'penhasco', 'vitória', 'vitoria'], ceu: ['#2b2233', '#6b5b74'], chao: '#5a4f57', luz: '#d6c2a8' },
  { id: 'cidade', palavras: ['cidade', 'vila', 'porto', 'estrada', 'ponte'], ceu: ['#1d2340', '#4a5583'], chao: '#3f4666', luz: '#9fb4ff' },
  { id: 'santuario', palavras: ['santuário', 'santuario', 'templo', 'altar', 'sagrad'], ceu: ['#2a1745', '#6b3fa0'], chao: '#3c2a5c', luz: '#ffd76a' },
  { id: 'padrao', palavras: [], ceu: ['#1b2a4a', '#4a7a5c'], chao: '#3f6b42', luz: '#b8e986' }
];

const PADRAO = CLIMAS[CLIMAS.length - 1];

/* O clima de uma rota. `z.tema` (se o mapa trouxer) tem prioridade sobre o texto: é declaração explícita.
   A luta final e o Santuário puxam o clima deles mesmo que o nome não diga. */
export function climaDaRota(z) {
  if (!z) return PADRAO;
  const porId = CLIMAS.find(c => c.id === z.tema);
  if (porId) return porId;
  if (z.posVitoria) return CLIMAS.find(c => c.id === 'santuario');
  const texto = `${z.name || ''} ${z.desc || ''} ${z.id || ''}`.toLowerCase();
  return CLIMAS.find(c => c.palavras.some(p => texto.includes(p))) || PADRAO;
}

// as variáveis de CSS que a cena usa; o estilo em si mora no estilo.css (classe .scene.battle)
export function estiloDaCena(z) {
  const c = climaDaRota(z);
  return `--ceu1:${c.ceu[0]};--ceu2:${c.ceu[1]};--chao:${c.chao};--luz:${c.luz}`;
}
export const nomeDoClima = z => climaDaRota(z).id;
