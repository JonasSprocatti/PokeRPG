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

/* Soma um abate ao registro da jornada. `S.registro.abates` guarda quatro contagens, todas só do que você matou:
     tipoAlvo  → tipos do Pokémon derrotado (um dual-type conta pros dois: a condição é "derrotar do tipo X")
     especie   → a SUA espécie na hora (é ela que ganha a Pedra Mega)
     golpe     → o nome do golpe que finalizou
     elemento  → o tipo do golpe que finalizou
   `porMim` falso (aliado deu o golpe final) não registra nada. */
export function registrarAbate(S, { porMim, tiposDoAlvo = [], minhaEspecie, golpe }) {
  if (!porMim || !S) return null;
  const a = (S.registro ||= {}).abates ||= { tipoAlvo: {}, especie: {}, golpe: {}, elemento: {} };
  const soma = (mapa, chave) => { if (chave) mapa[chave] = (mapa[chave] || 0) + 1; };
  for (const t of tiposDoAlvo) soma(a.tipoAlvo, t);
  soma(a.especie, minhaEspecie);
  soma(a.golpe, golpe?.name);
  soma(a.elemento, golpe?.type);
  return a;
}

// soma os abates de várias jornadas (a carreira inteira + a atual)
export function somarAbates(registros) {
  const out = { tipoAlvo: {}, especie: {}, golpe: {}, elemento: {} };
  for (const r of registros) {
    const a = r?.abates; if (!a) continue;
    for (const lista of Object.keys(out)) for (const [k, n] of Object.entries(a[lista] || {})) out[lista][k] = (out[lista][k] || 0) + n;
  }
  return out;
}

// jornadas em que você chegou ao nível `gmaxNivel` com cada espécie (uma por jornada, não importa quantas vezes)
export function runsDeNivel(jornadas, nivel = ALVOS.gmaxNivel) {
  const out = {};
  for (const j of jornadas || []) if ((j?.nivel || 0) >= nivel && j.especie) out[j.especie] = (out[j.especie] || 0) + 1;
  return out;
}

/* O que já está liberado e o que falta, pronto pra tela. `jornadas` = carreira; `registroAtual` = a run em
   andamento (conta junto: o progresso aparece na hora, não só quando a jornada termina). */
export function progressoConquistas(jornadas, registroAtual) {
  const abates = somarAbates([...(jornadas || []).map(j => j.registro), registroAtual]);
  const runs = runsDeNivel(jornadas);
  const lista = (mapa, alvo, tipo) => Object.entries(mapa)
    .map(([chave, n]) => ({ tipo, chave, n, alvo, liberado: n >= alvo, fracao: Math.min(1, n / alvo) }))
    .sort((a, b) => b.n - a.n);
  return {
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
