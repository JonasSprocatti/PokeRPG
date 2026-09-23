/* ============ conquistas da conta (contadores entre jornadas) ============
   As gimmicks (Mega, Tera, Dynamax, Z-Move) não se desbloqueiam dentro de uma run: elas são conquista da CONTA,
   somando tudo o que você já fez na carreira. As condições vieram do desenho do jogo:
     Tera      → 200 Pokémon DAQUELE TIPO derrotados (libera a Terastalização para esse tipo)
     Mega      → 1000 golpes finais dados SENDO aquela espécie (uma Pedra Mega por espécie)
     Z-Move    → eliminações com aquele GOLPE, ou com golpes daquele ELEMENTO
     Gigantamax→ chegar ao nível 50 com a espécie em 25 jornadas diferentes
   Regra que atravessa todas: **só conta o que VOCÊ fez**. Golpe final do aliado não entra — foi pedido explícito,
   e é o que separa "eu conquistei" de "minha equipe conquistou".
   Este arquivo é puro (recebe dado, devolve dado): testado em tests/conquistas.test.js. Quem chama é batalha.win()
   (registrarAbate) e a carreira (progressoConquistas). */

// quanto falta pra cada desbloqueio
export const ALVOS = { tera: 200, mega: 1000, zGolpe: 250, zElemento: 500, gmaxRuns: 25, gmaxNivel: 50 };

// marcos de "derrotados na conta inteira" (badges de caçada)
export const MARCOS_ABATES = [1000, 10000, 100000, 1000000];
// o Fácil é treino: não acumula progresso de conta nenhum (decisão do usuário)
export const MODO_NAO_CONTA = 'easy';

/* Soma um abate ao registro da jornada. `S.registro.abates` guarda quatro contagens:
     tipoAlvo  → tipos do Pokémon derrotado (um dual-type conta pros dois: a condição é "derrotar do tipo X")
     especie   → a SUA espécie na hora (é ela que ganha a Pedra Mega)
     golpe     → o nome do golpe que finalizou
     elemento  → o tipo do golpe que finalizou
   **Quem derrotou muda o que conta** (regra fechada com o usuário): a ESPÉCIE conta sempre que a sua equipe vence,
   aliado incluído — o crédito é do Pokémon que você está usando. Já TIPO e GOLPE só contam quando o golpe final foi
   SEU: Tera é você aprendendo a enfrentar aquele tipo, e o Z-Move é você dominando aquele golpe; nenhum dos dois
   faz sentido conquistado pelo aliado.
   Sem `golpe` (o inimigo caiu de veneno, armadilha ou recuo) também não há golpe pra creditar. */
export function registrarAbate(S, { porMim = false, tiposDoAlvo = [], minhaEspecie, golpe, modo } = {}) {
  if (!S || modo === MODO_NAO_CONTA) return null;
  const a = (S.registro ||= {}).abates ||= { tipoAlvo: {}, especie: {}, golpe: {}, elemento: {}, total: 0 };
  a.total = (a.total || 0) + 1;
  const soma = (mapa, chave) => { if (chave) mapa[chave] = (mapa[chave] || 0) + 1; };
  soma(a.especie, minhaEspecie);                      // aliado incluído
  if (!porMim) return a;
  for (const t of tiposDoAlvo) soma(a.tipoAlvo, t);   // daqui pra baixo, só o que VOCÊ finalizou
  soma(a.golpe, golpe?.name);
  soma(a.elemento, golpe?.type);
  return a;
}

// soma os abates de várias jornadas (a carreira inteira + a atual)
export function somarAbates(registros) {
  const out = { tipoAlvo: {}, especie: {}, golpe: {}, elemento: {}, total: 0 };
  for (const r of registros) {
    const a = r?.abates; if (!a) continue;
    out.total += a.total || 0;
    for (const lista of ['tipoAlvo', 'especie', 'golpe', 'elemento']) for (const [k, n] of Object.entries(a[lista] || {})) out[lista][k] = (out[lista][k] || 0) + n;
  }
  return out;
}
// o marco de caçada em que a conta está: quantos faltam pro próximo (null = já passou de todos)
export function marcoDeAbates(total) {
  const proximo = MARCOS_ABATES.find(m => total < m) || null;
  return { total, conquistados: MARCOS_ABATES.filter(m => total >= m), proximo, faltam: proximo ? proximo - total : 0 };
}

// jornadas em que você chegou ao nível `gmaxNivel` com cada espécie (uma por jornada, não importa quantas vezes)
export function runsDeNivel(jornadas, nivel = ALVOS.gmaxNivel) {
  const out = {};
  for (const j of jornadas || []) if ((j?.nivel || 0) >= nivel && j.especie) out[j.especie] = (out[j.especie] || 0) + 1;
  return out;
}

/* O que já está liberado e o que falta, pronto pra tela. `jornadas` = carreira; `registroAtual` = a run em
   andamento (conta junto: o progresso aparece na hora, não só quando a jornada termina). */
/* `prontos` (opcional) = { abates, runs } já somados do PROGRESSO PERMANENTE (carreira.abatesDaConta). É o caminho
   normal no jogo: conquista não pode encolher porque alguém apagou uma jornada do histórico. Sem `prontos`, soma
   direto das jornadas — é o que os testes usam, e o que sobra se o progresso ainda não existir. */
export function progressoConquistas(jornadas, registroAtual, prontos = null) {
  // o Fácil não entra: quem jogou nele nem gravou abates, mas jornadas antigas (de antes desta regra) podem ter
  const contam = (jornadas || []).filter(j => j?.dificuldade !== MODO_NAO_CONTA);
  const abates = prontos?.abates || somarAbates([...contam.map(j => j.registro), registroAtual]);
  const runs = prontos?.runs || runsDeNivel(contam);
  const lista = (mapa, alvo, tipo) => Object.entries(mapa)
    .map(([chave, n]) => ({ tipo, chave, n, alvo, liberado: n >= alvo, fracao: Math.min(1, n / alvo) }))
    .sort((a, b) => b.n - a.n);
  return {
    abates: marcoDeAbates(abates.total || 0),
    tera: lista(abates.tipoAlvo, ALVOS.tera, 'tera'),
    mega: lista(abates.especie, ALVOS.mega, 'mega'),
    zGolpe: lista(abates.golpe, ALVOS.zGolpe, 'zGolpe'),
    zElemento: lista(abates.elemento, ALVOS.zElemento, 'zElemento'),
    gigantamax: lista(runs, ALVOS.gmaxRuns, 'gigantamax')
  };
}

// atalhos pro jogo perguntar "posso usar isto?"
export const teraLiberada = (p, tipo) => !!p.tera.find(x => x.chave === tipo)?.liberado;
export const megaLiberada = (p, especie) => !!p.mega.find(x => x.chave === especie)?.liberado;
export const gmaxLiberado = (p, especie) => !!p.gigantamax.find(x => x.chave === especie)?.liberado;
export const zLiberado = (p, golpe) => !!p.zGolpe.find(x => x.chave === golpe?.name)?.liberado
  || !!p.zElemento.find(x => x.chave === golpe?.type)?.liberado;
