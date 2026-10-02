/* ============ progresso permanente da conta ============
   O que você CONQUISTOU não pode depender de o histórico continuar existindo. Até aqui os desbloqueios e os
   contadores das gimmicks eram derivados das jornadas da carreira: apagar uma jornada apagava junto o que ela tinha
   liberado — perigoso, e foi o próprio jogador que apontou.
   Aqui o progresso vira um registro próprio que **só cresce**:
     especies    → espécie desbloqueada, com quando e por quê. Uma vez dentro, nunca sai.
     porJornada  → uma entrada por jornada (pelo ID dela): os números dela na raiz (espécie, nível, dificuldade…)
                   e os abates em `abates`.
   Por que `porJornada` em vez de um total só: assim a fusão entre aparelhos (e com a nuvem) é sempre correta —
   mesma jornada dos dois lados é a mesma chave, então nada conta em dobro, e jornada que só um aparelho viu entra
   sem conflito. Um total único não teria como saber o que já foi somado.
   Puro (sem DOM, sem rede): testado em tests/progresso-conta.test.js. Quem guarda é carreira.js/nuvem.js. */

import { mesclarHall } from './hall.js';

export const PROGRESSO_KEY = 'pokerpg-progresso-v1';
export const LISTAS_ABATE = ['tipoAlvo', 'especie', 'golpe', 'elemento'];

export const progressoVazio = () => ({ v: 1, especies: {}, porJornada: {}, gastoArena: 0 });

/* ---- saldo da Arena (arena.js, "loja de preparo") ----
   Pedido do usuário (28/09/2026): comprar itens de raide fora de uma run, pagando 4x o preço, usando um saldo de
   CONTA (não o dinheiro da run — a Arena não tem run nenhuma). `FRACAO_SALDO_ARENA` de CADA jornada terminada
   vira saldo, pra sempre — por isso "ganho" é sempre RECALCULADO de `porJornada[id].maxDinheiro` (que já é união
   por chave, nunca conta a mesma jornada duas vezes) em vez de guardado à parte: reaproveita a mesma garantia
   de "nunca encolhe, nunca duplica" que o resto do progresso-conta já tem, sem precisar reinventar. Só o GASTO
   precisa de um campo próprio, porque gastar é uma ação (não dá pra recalcular do histórico). */
export const FRACAO_SALDO_ARENA = 0.1;
export const saldoArenaGanho = progresso => Object.values(progresso?.porJornada || {}).reduce((s, j) => s + Math.floor((j.maxDinheiro || 0) * FRACAO_SALDO_ARENA), 0);
export const saldoArenaDisponivel = progresso => Math.max(0, saldoArenaGanho(progresso) - (progresso?.gastoArena || 0));
// Gasta `valor` do saldo (devolve o progresso NOVO, ou o mesmo se não dá o saldo — nunca fica negativo)
export function gastarSaldoArena(progresso, valor) {
  if (valor <= 0 || saldoArenaDisponivel(progresso) < valor) return progresso;
  return { ...progresso, gastoArena: (progresso?.gastoArena || 0) + valor };
}

/* ---- marca do que veio do painel de manutenção (dev.js) ----
   Mora aqui, e não em dev.js, por dois motivos: é uma característica do FORMATO do progresso, e porque
   `nuvem.js` precisa de `semTeste` — importar dev.js de lá faria ciclo (dev.js lê o admin de nuvem.js).
   O que o painel concede nasce e morre no navegador: `semTeste` é o que sobe pra nuvem. Sem isso o botão de
   limpar seria mentira, porque a fusão com a nuvem é união e nunca remove — o teste voltaria em toda
   sincronização, em todos os aparelhos. */
export const ID_JORNADA_TESTE = '__teste__';
export const RAZAO_TESTE = 'teste';
export function semTeste(p) {
  if (!p) return p;
  const porJornada = { ...(p.porJornada || {}) };
  delete porJornada[ID_JORNADA_TESTE];
  const especies = {};
  for (const [nome, d] of Object.entries(p.especies || {})) if (!(d.razoes || []).includes(RAZAO_TESTE)) especies[nome] = d;
  return { ...p, porJornada, especies };
}
export const temTeste = p => !!p?.porJornada?.[ID_JORNADA_TESTE]
  || Object.values(p?.especies || {}).some(d => (d.razoes || []).includes(RAZAO_TESTE));

/* Guarda no progresso as jornadas que ainda não foram contadas e as espécies que elas desbloquearam.
   Idempotente pelo ID da jornada: rodar de novo com as mesmas jornadas não muda nada, o que deixa chamar isso a
   cada vez que o jogo abre sem medo de contar em dobro.
   `desbloqueadasAgora` = lista de { especie, id, razoes } (roguelike.desbloqueadas), calculada pela regra ATUAL —
   é o que mantém a retroatividade: regra nova reavalia o histórico e grava o que passou a valer. */
export function bancar(progresso, jornadas = [], desbloqueadasAgora = [], quando = new Date().toISOString()) {
  const p = { ...progressoVazio(), ...progresso, especies: { ...(progresso?.especies || {}) }, porJornada: { ...(progresso?.porJornada || {}) } };
  for (const j of jornadas) {
    if (!j?.id) continue;                                 // sem id (save antiquíssimo)
    /* Jornada JÁ contada antes de `maxDinheiro` existir aqui (campo novo, 28/09/2026, pra Loja de preparo da
       Arena): sem isto, o `continue` de sempre pulava a jornada inteira e o saldo de quem já tinha a conta
       registrada ANTES da Loja de preparo existir ficava travado em ₽0 pra sempre — a loja parecia quebrada
       (nada comprável, tudo "saldo insuficiente"), mesmo tendo carreira de sobra. Só ATUALIZA o campo que falta
       (com Math.max — nunca encolhe), não reprocessa a entrada inteira: o resto (abates, badges de parceiros…)
       já está certo e reprocessar arriscaria sobrescrever algo por engano. Bug real relatado pelo usuário. */
    if (p.porJornada[j.id]) {
      const atual = p.porJornada[j.id], max = Math.max(atual.maxDinheiro || 0, j.maxDinheiro || 0);
      if (max !== atual.maxDinheiro) p.porJornada[j.id] = { ...atual, maxDinheiro: max };
      continue;
    }
    const a = j.registro?.abates;
    /* Além dos abates, a entrada guarda os números da jornada que alguma conquista precisa (`especie`/`nivel` são
       a missão do Gigantamax: nível 50 em N jornadas). É o "livro-caixa" permanente: a carreira pode perder a
       jornada, isto não perde. Campo novo aqui = badge novo pode medir sem depender do histórico.
       Os abates ficam NUM CAMPO PRÓPRIO (`abates`), não espalhados na raiz da entrada. Já foi bug: a lista de
       abates tem uma chave chamada `especie` (quantos você matou sendo cada espécie) e ela sobrescrevia a espécie
       DA JORNADA, quebrando a contagem do Gigantamax. Aninhar elimina a classe inteira de colisão. */
    p.porJornada[j.id] = {
      especie: j.especie || null, nivel: j.nivel || 0, dificuldade: j.dificuldade || null,
      amigos: j.amigos || 0, alfas: j.alfas || 0, gens: j.gens || 0, genVencida: j.genVencida || 0,
      semCentro: !!j.semCentro, shiny: !!j.shiny, motivo: j.motivo || null,
      casaCheia: !!j.casaCheia, aliadosPerdidos: j.aliadosPerdidos || 0,   // badges de parceiros (badges.js)
      ovosChocados: j.ovosChocados || 0,   // badges 'ovos100'/'ovos1000' (ovos.js)
      maxDinheiro: j.maxDinheiro || 0,   // loja de preparo da Arena (arena.js): alimenta o saldo de conta
      // `total` e `dano` são números soltos; o resto são mapas (LISTAS_ABATE). Campo solto novo aqui = também em `totaisDe`.
      abates: { total: a?.total || 0, dano: a?.dano || 0, ...Object.fromEntries(LISTAS_ABATE.map(l => [l, { ...(a?.[l] || {}) }])) }
    };
  }
  for (const d of desbloqueadasAgora) {
    if (!d?.especie || p.especies[d.especie]) continue;  // já estava: não sobrescreve a data original
    p.especies[d.especie] = { id: d.id || null, em: quando, razoes: d.razoes || [] };
  }
  return p;
}

// soma os abates guardados (todas as jornadas já bancadas). `extra` = a run em andamento, que ainda não é jornada.
export function totaisDe(progresso, extra = null) {
  const out = { total: 0, dano: 0, ...Object.fromEntries(LISTAS_ABATE.map(l => [l, {}])) };
  const somar = a => {
    if (!a) return;
    out.total += a.total || 0;
    out.dano += a.dano || 0;
    for (const l of LISTAS_ABATE) for (const [k, n] of Object.entries(a[l] || {})) out[l][k] = (out[l][k] || 0) + n;
  };
  // `j.abates` é o formato de hoje; `j` cru é o de quem já tinha progresso gravado antes de os abates virarem campo próprio
  for (const j of Object.values(progresso?.porJornada || {})) somar(j.abates || j);
  somar(extra);
  return out;
}

/* Jornadas gravadas em que a espécie chegou ao nível pedido (missão do Gigantamax). Sai do progresso, não do
   histórico: apagar a jornada da carreira não desfaz o que ela já provou. O modo Fácil fica de fora, como no
   resto das conquistas de conta. */
export function runsDeNivelDe(progresso, nivel, modoQueNaoConta = 'easy') {
  const out = {};
  for (const j of Object.values(progresso?.porJornada || {})) {
    // typeof string: progresso do formato antigo guardava o MAPA de abates por espécie nesta mesma chave
    if (typeof j.especie !== 'string' || !j.especie || (j.nivel || 0) < nivel || j.dificuldade === modoQueNaoConta) continue;
    out[j.especie] = (out[j.especie] || 0) + 1;
  }
  return out;
}

/* Evento semanal vencido (evento.js). `progresso.eventos[id] = { primeiraEm, vitorias, semanas: { idDaSemana: true } }` e a
   espécie do chefe entra em `especies` (razão 'evento'): fica desbloqueada pra sempre. Devolve o progresso novo e o que mudou:
     primeiraVez  → primeira vitória sobre este chefe (badge, título e espécie);
     semanaNova   → ainda não tinha vencido NESTA semana (o prêmio da vitória só sai uma vez por semana). */
export function registrarEventoVencido(progresso, ev, semanaId, quando = new Date().toISOString()) {
  const p = { ...progressoVazio(), ...progresso, especies: { ...(progresso?.especies || {}) }, porJornada: { ...(progresso?.porJornada || {}) },
    eventos: { ...(progresso?.eventos || {}) } };
  const antes = p.eventos[ev.id];
  const primeiraVez = !antes, semanaNova = !antes?.semanas?.[semanaId];
  const semanas = { ...(antes?.semanas || {}), [semanaId]: true };
  p.eventos[ev.id] = { primeiraEm: antes?.primeiraEm || quando, vitorias: Object.keys(semanas).length, semanas };   // `vitorias` = semanas vencidas
  if (ev.especie && !p.especies[ev.especie]) p.especies[ev.especie] = { id: ev.especieId || null, em: quando, razoes: ['evento'] };
  return { progresso: p, primeiraVez, semanaNova };
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
    if (fonte.hall) p.hall = mesclarHall(p.hall, fonte.hall);   // Hall da Fama (hall.js): união pela chave da jornada
    // saldo da Arena (arena.js): "ganho" é sempre recalculado de porJornada (união por chave já resolve isso
    // sozinha); só "gasto" precisa de fusão — pega o MAIOR entre os dois lados (nunca desconta duas vezes)
    p.gastoArena = Math.max(p.gastoArena || 0, fonte.gastoArena || 0);
    // eventos semanais: união das semanas vencidas e da data mais ANTIGA da primeira vitória (nunca perde uma vitória)
    for (const [id, e] of Object.entries(fonte.eventos || {})) {
      const ja = (p.eventos ||= {})[id];
      p.eventos[id] = !ja ? { ...e, semanas: { ...(e.semanas || {}) } } : {
        primeiraEm: (ja.primeiraEm && e.primeiraEm) ? (ja.primeiraEm < e.primeiraEm ? ja.primeiraEm : e.primeiraEm) : (ja.primeiraEm || e.primeiraEm),
        semanas: { ...(ja.semanas || {}), ...(e.semanas || {}) }, vitorias: 0 };
      p.eventos[id].vitorias = Object.keys(p.eventos[id].semanas).length;
    }
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
