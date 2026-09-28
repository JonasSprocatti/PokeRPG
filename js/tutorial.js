/* ============ modo tutorial: tour guiado + demonstração ============ */
// Pedido do usuário (28/09/2026): um tour pelo jogo que combina explicação com uma EXPERIÊNCIA simulada — abrir
// a loja, comprar item, apanhar de um treinador e correr risco de ser capturado — e um resumo curto das Runs.
// Decisões fechadas com o usuário: abre sozinho na PRIMEIRA vez que o jogo é aberto neste aparelho (sem save
// nenhum ainda) + fica sempre disponível num botão pra rever (❓ Tutorial em navegacao.TELAS); é uma
// DEMONSTRAÇÃO À PARTE com um Pokémon de mentirinha — nada aqui toca em G.S nem no save de verdade; "já visto"
// sincroniza com a conta (nuvem.js, mesmo padrão de badge_exibida), com o navegador como reserva sem conta.
//
// Este arquivo é PURO (sem DOM) de propósito, pra dar pra testar: quem desenha é js/tela-tutorial.js.
import { ITEMS, DIFICULDADES } from './dados.js';

// Ordem das telas do tour. 'mundo' e 'batalha' são o mesmo encontro selvagem contado em duas partes.
export const TUT_PASSOS = ['boas-vindas', 'mundo', 'batalha', 'loja', 'captura', 'runs', 'fim'];

// Pokémon de demonstração: espécie comum e simpática, sprite por id (dados.SPR) sem precisar da PokéAPI —
// o tutorial precisa abrir mesmo offline ou na primeiríssima visita, antes de qualquer cache.
export const TUT_DEMO = { id: 172, nome: 'Pichu', nivel: 8, hpMax: 26, golpe: 'Investida' };
export const TUT_SELVAGEM = { id: 10, nome: 'Caterpie', nivel: 4, hpMax: 16 };
export const TUT_TREINADOR = { nome: 'Treinador Theo', id: 52, mon: 'Meowth', nivel: 9 };
export const TUT_DANO_GOLPE = 9;      // dano fixo do golpe de demonstração — 2 cliques derrubam o Caterpie
export const TUT_CONTRA_ATAQUE = 4;   // dano que o Caterpie devolve a cada rodada que sobrevive
export const TUT_ITENS_LOJA = ['potion', 'super-potion', 'antidote', 'x-attack', 'revive'];
export const TUT_DINHEIRO_INICIAL = 2000; // dá pra comprar qualquer item da vitrine de demonstração à vontade
export const TUT_HP_CAPTURA = 8; // HP (de 26) mostrado no passo da captura — cenário roteirizado, não herda da batalha

export function novoEstadoTutorial() {
  return {
    passo: 0,
    hp: TUT_DEMO.hpMax, hpMax: TUT_DEMO.hpMax,
    inimigoHp: TUT_SELVAGEM.hpMax, inimigoHpMax: TUT_SELVAGEM.hpMax,
    dinheiro: TUT_DINHEIRO_INICIAL,
    mochila: {},
    capturaRevelada: false
  };
}

const clampPasso = i => Math.max(0, Math.min(TUT_PASSOS.length - 1, i));
export function avancarPasso(t) { t.passo = clampPasso(t.passo + 1); return t; }
export function voltarPasso(t) { t.passo = clampPasso(t.passo - 1); return t; }
export const passoAtual = t => TUT_PASSOS[t.passo];
export const ultimoPasso = t => t.passo === TUT_PASSOS.length - 1;
export const indiceDoPasso = id => TUT_PASSOS.indexOf(id);

// passo 'batalha': um clique = um golpe de demonstração. Dano fixo de propósito — é um tour, não precisa de sorte
// pra ensinar a mecânica. O Caterpie só revida enquanto ainda está de pé.
export function golpeDemo(t) {
  if (t.inimigoHp <= 0) return t;
  t.inimigoHp = Math.max(0, t.inimigoHp - TUT_DANO_GOLPE);
  if (t.inimigoHp > 0) t.hp = Math.max(1, t.hp - TUT_CONTRA_ATAQUE);
  return t;
}
export const venceuDemo = t => t.inimigoHp <= 0;

// passo 'loja': compra de mentirinha, com o dinheiro de mentirinha. Preço vem direto de ITEMS (dados.js) — os
// itens do tour não têm preço dinâmico (isso é só o Disco Técnico), então não precisa de regras.precoItem aqui.
export function comprarDemo(t, id) {
  const it = ITEMS[id];
  if (!it?.price || t.dinheiro < it.price) return t;
  t.dinheiro -= it.price;
  t.mochila[id] = (t.mochila[id] || 0) + 1;
  return t;
}

// passo 'captura': o que acontece em cada dificuldade — lido das MESMAS flags que a criação usa pra decidir
// (regra do projeto: nunca comparar o nome do modo). `DIFICULDADES` é a fonte única; se as regras de captura
// mudarem lá, este texto muda sozinho.
export function resultadoCaptura(dif) {
  const d = DIFICULDADES[dif];
  if (!d) return '';
  if (d.semCaptura) return 'Nunca te capturam.';
  if (d.fimDeJogo) return 'Fim de jogo: o save é apagado ali mesmo.';
  return 'Você foge dias depois, mas sem a mochila, com metade do dinheiro, em outra zona.';
}
