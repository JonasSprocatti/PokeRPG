/* ============ progresso permanente da conta ============
   O que você CONQUISTOU não pode depender de o histórico continuar existindo. Até aqui os desbloqueios e os
   contadores das gimmicks eram derivados das jornadas da carreira: apagar uma jornada apagava junto o que ela tinha
   liberado — perigoso, e foi o próprio jogador que apontou.
   Aqui o progresso vira um registro próprio que **só cresce**:
     especies    → espécie desbloqueada, com quando e por quê. Uma vez dentro, nunca sai.
     porJornada  → os abates de cada jornada, guardados pelo ID dela.
   Por que `porJornada` em vez de um total só: assim a fusão entre aparelhos (e com a nuvem) é sempre correta —
   mesma jornada dos dois lados é a mesma chave, então nada conta em dobro, e jornada que só um aparelho viu entra
   sem conflito. Um total único não teria como saber o que já foi somado.
   Puro (sem DOM, sem rede): testado em tests/progresso-conta.test.js. Quem guarda é carreira.js/nuvem.js. */

export const PROGRESSO_KEY = 'pokerpg-progresso-v1';
export const LISTAS_ABATE = ['tipoAlvo', 'especie', 'golpe', 'elemento'];

export const progressoVazio = () => ({ v: 1, especies: {}, porJornada: {} });

/* Guarda no progresso as jornadas que ainda não foram contadas e as espécies que elas desbloquearam.
   Idempotente pelo ID da jornada: rodar de novo com as mesmas jornadas não muda nada, o que deixa chamar isso a
   cada vez que o jogo abre sem medo de contar em dobro.
   `desbloqueadasAgora` = lista de { especie, id, razoes } (roguelike.desbloqueadas), calculada pela regra ATUAL —
   é o que mantém a retroatividade: regra nova reavalia o histórico e grava o que passou a valer. */
export function bancar(progresso, jornadas = [], desbloqueadasAgora = [], quando = new Date().toISOString()) {
  const p = { ...progressoVazio(), ...progresso, especies: { ...(progresso?.especies || {}) }, porJornada: { ...(progresso?.porJornada || {}) } };
  for (const j of jornadas) {
    if (!j?.id || p.porJornada[j.id]) continue;          // sem id (save antiquíssimo) ou já contada
    const a = j.registro?.abates;
    // `especie`/`nivel` vão junto porque a missão do Gigantamax (nível 50 em N jornadas) também não pode
    // depender de a jornada continuar no histórico
    const base = { especie: j.especie || null, nivel: j.nivel || 0, dificuldade: j.dificuldade || null };
    p.porJornada[j.id] = a
      ? { ...base, total: a.total || 0, ...Object.fromEntries(LISTAS_ABATE.map(l => [l, { ...(a[l] || {}) }])) }
      : { ...base, total: 0, ...Object.fromEntries(LISTAS_ABATE.map(l => [l, {}])) };
  }
  for (const d of desbloqueadasAgora) {
    if (!d?.especie || p.especies[d.especie]) continue;  // já estava: não sobrescreve a data original
    p.especies[d.especie] = { id: d.id || null, em: quando, razoes: d.razoes || [] };
  }
  return p;
}

// soma os abates guardados (todas as jornadas já bancadas). `extra` = a run em andamento, que ainda não é jornada.
export function totaisDe(progresso, extra = null) {
  const out = { total: 0, ...Object.fromEntries(LISTAS_ABATE.map(l => [l, {}])) };
  const somar = a => {
    if (!a) return;
    out.total += a.total || 0;
    for (const l of LISTAS_ABATE) for (const [k, n] of Object.entries(a[l] || {})) out[l][k] = (out[l][k] || 0) + n;
  };
  for (const a of Object.values(progresso?.porJornada || {})) somar(a);
  somar(extra);
  return out;
}

/* Jornadas gravadas em que a espécie chegou ao nível pedido (missão do Gigantamax). Sai do progresso, não do
   histórico: apagar a jornada da carreira não desfaz o que ela já provou. O modo Fácil fica de fora, como no
   resto das conquistas de conta. */
export function runsDeNivelDe(progresso, nivel, modoQueNaoConta = 'easy') {
  const out = {};
  for (const j of Object.values(progresso?.porJornada || {})) {
    if (!j.especie || (j.nivel || 0) < nivel || j.dificuldade === modoQueNaoConta) continue;
    out[j.especie] = (out[j.especie] || 0) + 1;
  }
  return out;
}

/* Junta dois progressos (este aparelho e o que veio da nuvem). NUNCA remove: o resultado tem tudo dos dois lados.
   Espécie repetida fica com a data mais ANTIGA — é a data em que você conquistou de verdade. */
export function mesclarProgresso(a, b) {
  const p = progressoVazio();
  for (const fonte of [a, b]) {
    if (!fonte) continue;
    for (const [especie, d] of Object.entries(fonte.especies || {})) {
      const ja = p.especies[especie];
      p.especies[especie] = !ja ? d : { ...ja, ...d, em: (ja.em && d.em) ? (ja.em < d.em ? ja.em : d.em) : (ja.em || d.em) };
    }
    for (const [id, abates] of Object.entries(fonte.porJornada || {})) p.porJornada[id] ||= abates;
  }
  return p;
}

// espécies desbloqueadas de verdade: as gravadas aqui (permanentes) + as que a regra atual reconhece agora
export function especiesDesbloqueadas(progresso, derivadasAgora = []) {
  const mapa = new Map();
  for (const [especie, d] of Object.entries(progresso?.especies || {})) mapa.set(especie, { especie, id: d.id, razoes: d.razoes || [], permanente: true });
  for (const d of derivadasAgora) if (!mapa.has(d.especie)) mapa.set(d.especie, { especie: d.especie, id: d.id, razoes: d.razoes || [], permanente: false });
  return [...mapa.values()].filter(x => x.id);   // sem id não dá pra mostrar sprite nem começar jornada
}
