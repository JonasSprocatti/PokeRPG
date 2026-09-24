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
// `semTeste`/`temTeste` moram em progresso-conta.js (o formato é deles, e nuvem.js precisa sem criar ciclo)
export const temProgressoDeTeste = () => temTeste(carregarProgresso());
