/* ============ painel de testes (só admin) ============
   Serve pra VALIDAR mecânica sem jogar 1.000 batalhas: libera as Megas e as espécies na marra.
   **Aparece só pra conta admin** (`perfis.admin` no Supabase — decisão do usuário, que preferiu isso a uma
   chave na URL). Um gatilho no banco impede a própria API de mudar essa coluna, então ninguém se promove
   jogando: a promoção é feita à mão no SQL Editor. Do lado do cliente isso é só a chave do painel — quem
   protege dado é a RLS, e quem protege o ranking é o `validar_jornada`, que recalcula a pontuação no servidor.

   Tudo o que ele concede entra no progresso permanente numa entrada PRÓPRIA (`porJornada.__teste__`) e com a
   razão 'teste' nas espécies. É isso que deixa `limparTeste()` devolver a conta ao estado real: sem essa
   separação, testar significaria sujar o progresso de verdade pra sempre, sem volta.
   As contas em si (conquistas.js, progresso-conta.js) não sabem que isto existe — o que chega lá é um registro
   de abates como outro qualquer. */
import { ehAdmin } from './nuvem.js';
import { carregarProgresso, salvarProgresso } from './carreira.js';
import { ID_JORNADA_TESTE, RAZAO_TESTE, semTeste, temTeste } from './progresso-conta.js';
import { MEGAS } from './dados-megas.js';
import { ALVOS } from './conquistas.js';
import { GENS } from './mapas.js';
import { G, save } from './estado.js';
import { recalc } from './regras.js';
import { ITEMS } from './dados.js';
import { loadMove } from './api.js';
import { checkEvolution } from './progressao.js';
import { render } from './render.js';

const ID_TESTE = ID_JORNADA_TESTE, RAZAO = RAZAO_TESTE;   // ver progresso-conta.js: a marca mora no formato

// o painel existe pra quem está logado numa conta marcada como admin no banco; pra todo o resto, nem aparece
export const devLigado = () => ehAdmin();

// todas as espécies que existem nos mapas, com o id (é o que a tela de criação precisa pra desenhar e começar)
function todasAsEspecies() {
  const out = new Map();
  for (const g of GENS) for (const z of g.rotas) for (const p of z.pool) if (!out.has(p.n)) out.set(p.n, p.id);
  return out;
}

// a entrada de teste no livro-caixa: criada na primeira concessão, atualizada depois
function entradaTeste(p) {
  return p.porJornada[ID_TESTE] ||= {
    especie: null, nivel: 0, dificuldade: 'teste', amigos: 0, alfas: 0, gens: 0, genVencida: 0,
    semCentro: false, shiny: false, motivo: 'teste',
    abates: { total: 0, tipoAlvo: {}, especie: {}, golpe: {}, elemento: {} }
  };
}

/* Dá a Pedra Mega de TODA espécie que tem Mega: põe o alvo de abates no nome dela.
   Passa pelo mesmo caminho de uma conquista de verdade (conquistas.progressoConquistas lê `abates.especie`),
   então o que for testado aqui é o comportamento real, não um atalho paralelo. */
export function liberarMegas() {
  const p = carregarProgresso();
  const e = entradaTeste(p);
  for (const especie of Object.keys(MEGAS)) e.abates.especie[especie] = ALVOS.mega;
  salvarProgresso(p);
  return Object.keys(MEGAS).length;
}

// desbloqueia todas as espécies pra escolher na criação (o que 10 derrotas / 5 amizades dariam)
export function liberarEspecies(quando = new Date().toISOString()) {
  const p = carregarProgresso();
  let n = 0;
  for (const [nome, id] of todasAsEspecies()) {
    if (p.especies[nome]) continue;
    p.especies[nome] = { id, em: quando, razoes: [RAZAO] };
    n++;
  }
  salvarProgresso(p);
  return n;
}

/* IVs perfeitos: põe o contador de dano no alvo da badge "Potencial máximo" (badges.js), que é o que a criação
   lê (`vantagensDaConta().ivsPerfeitos`). Não existe um atalho de "admin tem IV 31" em paralelo de propósito —
   assim o botão testa o caminho de verdade, e 🧹 Limpar devolve a conta ao estado real como em tudo aqui. */
export function liberarIvsPerfeitos() {
  const p = carregarProgresso();
  entradaTeste(p).abates.dano = ALVOS.dano;
  salvarProgresso(p);
  return ALVOS.dano;
}

// enche os contadores das outras gimmicks, pra dar pra ver as listas cheias enquanto elas não são jogáveis
export function liberarOutrasGimmicks() {
  const p = carregarProgresso();
  const e = entradaTeste(p);
  for (const t of ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground',
    'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']) e.abates.tipoAlvo[t] = ALVOS.tera;
  e.abates.golpe['tackle'] = ALVOS.zGolpe;
  e.abates.elemento['normal'] = ALVOS.zElemento;
  salvarProgresso(p);
}

/* Devolve a conta ao estado real: tira a entrada de teste e as espécies concedidas por ela. O que você
   conquistou jogando fica — é a razão de existir a separação. */
export function limparTeste() {
  const p = carregarProgresso();
  delete p.porJornada[ID_TESTE];
  let n = 0;
  for (const [nome, d] of Object.entries(p.especies)) {
    if ((d.razoes || []).includes(RAZAO)) { delete p.especies[nome]; n++; }
  }
  salvarProgresso(p);
  return n;
}
/* ---- ⏩ Forjar a jornada atual ----
   Game Over APAGA o save, aqui e na nuvem (fim.js: `store.del(SAVE_KEY)` + `apagarSaveNuvem`), e a carreira só
   guarda estatística: run perdida não volta. Então em vez de ressuscitar, forja — pra voltar a caçar bug de fim
   de jogo sem jogar horas de novo.
   Mexe SÓ em `G.S` (a run em andamento), nunca no progresso permanente: ao contrário do resto deste painel, não
   há nada pra 🧹 limpar depois — a jornada forjada acaba como qualquer outra, e aí sim conta na carreira.
   Nível entra direto (exp da curva + `recalc`, o mesmo caminho de quem sobe de nível) e os golpes passam a ser os
   4 últimos do learnset até o nível: 40 modais de "esquecer qual golpe?" não testam nada. A EVOLUÇÃO, sim, vai
   pelo caminho de verdade (`checkEvolution` em laço, uma pergunta por estágio) — é justamente o que se quer ver. */
export const NIVEIS_FORJA = [20, 50, 80, 100];
const DINHEIRO_FORJA = 50000, ITENS_FORJA = 5;

export async function forjarJornada(nivel) {
  const S = G.S, P = S?.player;
  if (!devLigado() || !P || G.mode === 'battle') return null;   // no meio da luta não: nível e evolução no turno é confusão, não teste
  P.level = Math.min(100, Math.max(1, nivel | 0));
  P.exp = S.meta.growth[P.level];
  recalc(P); P.hp = P.stats.hp; P.status = null;
  const refs = (P.data.learnset?.list || []).filter(m => m.level > 0 && m.level <= P.level).slice(-4);   // `list` vem ordenada por nível (api.buildLearnset)
  if (refs.length) P.moves = await Promise.all(refs.map(async r => { const mv = await loadMove(r.url); return { ...mv, ppLeft: mv.pp }; }));
  S.money += DINHEIRO_FORJA;
  for (const [k, it] of Object.entries(ITEMS)) {
    if (it.raide) continue;   // item de raide da mochila vai pro INVENTÁRIO DA CONTA no fim da jornada (fim.js darItensDeRaide): forja não enche conta
    S.bag[k] = Math.max(S.bag[k] || 0, ITENS_FORJA);
  }
  let evolucoes = 0;
  while (await checkEvolution(P)) evolucoes++;   // multi-estágio: nível 50 pode passar por duas perguntas
  render(); save();
  return { nivel: P.level, golpes: P.moves.length, evolucoes };
}

// `semTeste`/`temTeste` moram em progresso-conta.js (o formato é deles, e nuvem.js precisa sem criar ciclo)
export const temProgressoDeTeste = () => temTeste(carregarProgresso());
