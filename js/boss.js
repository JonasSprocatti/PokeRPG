/* ============ regras dos chefes semanais (evento.js) ============
   Um chefe de evento não é "um Pokémon com muito HP": ele tem mecânicas que pedem leitura da luta e, no co-op, coordenação.
   Cada chefe combina algumas mecânicas (a config dele está em CHEFES):
     COURAÇA e RUPTURA   enquanto a couraça está de pé o dano cai; quando o estoque dela zera acontece a RUPTURA, uma janela em
                         que o chefe fica EXPOSTO e leva MAIS dano. Depois a couraça se refaz.            (Eternatus)
     PONTO FRACO         a cada `acoes` ações do chefe ele muda de "ponto fraco": só golpe DAQUELE tipo machuca de verdade (×mult);
                         qualquer outro tipo é reduzido (×contra). Pede um time de tipos variados.                (Mega Rayquaza)
     GOLPE TELEGRAFADO   a cada `ciclo` ações o chefe carrega um golpe devastador (avisado com um turno de antecedência). Dá pra
                         INTERROMPER causando dano suficiente no mesmo turno — o que ainda expõe o chefe. Solto, machuca de
                         verdade (no co-op, o time inteiro).
     FASES               em 66% e 33% do HP o chefe muda: limpa o que você fez a ele, refaz o que quebrou, sobe atributos e
                         encurta o ciclo do golpe telegrafado.
   Tudo aqui é PURO: recebe o Pokémon do chefe (`E.boss` é só dados: vai no save e na rede) e devolve números e uma lista de
   EFEITOS (`{dizer}`, `{estagios}`, `{curaStatus}`) que quem chama (golpe.js) aplica e narra. Sem DOM, sem rede: tests/boss.test.js.
   Os números moram em AJUSTES e CHEFES, num lugar só: a dificuldade se calibra jogando, não lendo. */

export const AJUSTES = {
  // nível do chefe: o do jogador + `nivelExtra`, entre o piso e o teto
  nivelExtra: 12, nivelMin: 70, nivelMax: 100,
  // HP e atributos sobre a conta normal do nível (o Eternamax já tem base altíssima: 255 de HP, 250 de Def./Def. Esp.)
  hpMult: 5, statMult: 1.3,
  // cada jogador além do primeiro aumenta o HP em `hpPorJogador` — mas MENOS que o dano que ele adiciona à luta, por isso
  // jogar em equipe compensa (a diferença é o incentivo). No single player é 1 jogador.
  hpPorJogador: 0.6,
  // no co-op cada Pokémon a mais por jogador conta como uma fração de jogador (3 Pokémon por jogador ≠ 3 jogadores)
  pesoPokemonExtra: 0.4,
  exposto: { mult: 1.5, acoes: 3 },     // a Ruptura (ou o golpe interrompido) deixa o chefe exposto
  cargaLimiar: 0.07                      // fração do HP máx. que interrompe o golpe carregado
};

export const CHEFES = {
  'eternatus-eternamax': {
    nome: 'Eternatus', coura: { fracao: 0.16, reducao: 0.35 },
    ciclo: 4, cicloFase3: 3,
    canhao: { name: 'eternabeam', type: 'dragon', cls: 'special', power: 200, rotulo: 'ETERNABEAM' },   // o motor já dá `recarga` a ele (especiais.js)
    fases: [
      { abaixo: 0.66, titulo: 'Fase 2 — Onda Cósmica', estagios: [['special-attack', 1], ['speed', 1]] },
      { abaixo: 0.33, titulo: 'Fase 3 — Eternamax Instável', estagios: [['special-attack', 1], ['attack', 1]] }
    ]
  },
  'rayquaza-mega': {
    nome: 'Mega Rayquaza', coura: null,
    pontoFraco: { tipos: ['ice', 'rock', 'dragon', 'electric', 'fairy'], acoes: 2, mult: 1.75, contra: 0.5 },
    ciclo: 4, cicloFase3: 3,
    canhao: { name: 'dragon-ascent', type: 'flying', cls: 'physical', power: 190, rotulo: 'DRAGON ASCENT' },
    expostoAposCanhao: 1,                // depois de soltar o Dragon Ascent (que baixa a defesa dele) fica exposto até a próxima ação
    fases: [
      { abaixo: 0.66, titulo: 'Fase 2 — Vento Delta', estagios: [['attack', 1], ['speed', 1]] },
      { abaixo: 0.33, titulo: 'Fase 3 — Fúria do Céu', estagios: [['attack', 1], ['special-attack', 1]] }
    ]
  }
};
const cfgDe = b => CHEFES[b?.id] || CHEFES['eternatus-eternamax'];   // save de antes de ter `id`: era o Eternatus

const dizer = (txt, cls = 'status') => ({ dizer: txt, cls });

// nível do chefe pro jogador dessa run
export const nivelDoChefe = nivelJogador => Math.max(AJUSTES.nivelMin, Math.min(AJUSTES.nivelMax, (nivelJogador || 1) + AJUSTES.nivelExtra));

/* Quantos "jogadores" a luta vale, pro HP: `jogadores` reais + uma fração por Pokémon extra que cada um leva. */
export const jogadoresEfetivos = (jogadores, porJogador = 1) => Math.max(1, jogadores) * (1 + AJUSTES.pesoPokemonExtra * (Math.max(1, porJogador) - 1));

/* Deixa o Pokémon `E` (recém-criado por makeMon) pronto pra ser o chefe `id`: HP e atributos maiores, imune a status, PP sem
   fim, e o estado das mecânicas em `E.boss`. `jogadores` = quantos jogadores entram na luta (1 no single player; aceita fração). */
export function prepararChefe(E, jogadores = 1, id = 'eternatus-eternamax') {
  const cfg = CHEFES[id] || CHEFES['eternatus-eternamax'], j = Math.max(1, jogadores);
  const hpMult = AJUSTES.hpMult * (1 + AJUSTES.hpPorJogador * (j - 1));
  for (const s of Object.keys(E.stats)) E.stats[s] = Math.floor(E.stats[s] * (s === 'hp' ? hpMult : AJUSTES.statMult));
  E.hp = E.stats.hp;
  E.chefeEvento = true;
  for (const m of E.moves || []) { m.pp = 99; m.ppLeft = 99; }     // o chefe nunca cai no Struggle
  const max = cfg.coura ? Math.max(1, Math.floor(E.stats.hp * cfg.coura.fracao)) : 0;
  E.boss = { id, fase: 1, acoes: 0, quebradoAcoes: 0, carga: null, jogadores: j,
    nucleo: cfg.coura ? { ativo: true, pv: max, max } : null,
    fraco: cfg.pontoFraco ? cfg.pontoFraco.tipos[0] : null, fracoAcoes: 0 };
  return E;
}

// o golpe carregado do chefe (o motor já sabe que o Eternabeam exige recarga: especiais.js)
export const golpeCanhao = (id = 'eternatus-eternamax') => { const c = (CHEFES[id] || CHEFES['eternatus-eternamax']).canhao;
  return { name: c.name, type: c.type, cls: c.cls, power: c.power, acc: null, pp: 99, ppLeft: 99, priority: 0, target: 'selected-pokemon', meta: {}, stats: [], desc: 'O golpe carregado do chefe.' }; };

const cicloAtual = b => (b.fase >= 3 ? cfgDe(b).cicloFase3 : cfgDe(b).ciclo);

/* Dano que o chefe RECEBE (já calculado pelo motor): reduzido pela couraça de pé, aumentado quando exposto, e — no chefe com
   ponto fraco — multiplicado conforme o TIPO do golpe. `tipo` = o tipo do golpe que causou o dano. */
export function danoNoChefe(t, dano, tipo = null) {
  const b = t?.boss; if (!b) return dano;
  const cfg = cfgDe(b);
  let d = dano;
  if (b.nucleo?.ativo) d = d * cfg.coura.reducao;
  if (cfg.pontoFraco && tipo) d = d * (tipo === b.fraco ? cfg.pontoFraco.mult : cfg.pontoFraco.contra);
  if (b.quebradoAcoes > 0) d = d * AJUSTES.exposto.mult;
  return Math.max(1, Math.floor(d));
}

function exporChefe(b, efeitos, motivo, quebraCoura) {
  if (quebraCoura && b.nucleo) { b.nucleo.ativo = false; b.nucleo.pv = 0; }
  b.quebradoAcoes = AJUSTES.exposto.acoes;
  efeitos.push(dizer(`💥 RUPTURA! ${motivo} O chefe fica exposto: dano ×${AJUSTES.exposto.mult} nas próximas ${AJUSTES.exposto.acoes} ações dele!`, 'crit'));
}

/* Depois de um golpe que MACHUCOU o chefe (`feito` = HP que ele perdeu de fato): desgasta a couraça, acumula o dano do turno
   de carga e muda de fase. Devolve os efeitos (texto + estágios). */
export function aposDanoNoChefe(t, feito) {
  const b = t?.boss, ef = []; if (!b || feito <= 0) return ef;
  const cfg = cfgDe(b);
  if (b.nucleo?.ativo) {
    b.nucleo.pv -= feito;
    if (b.nucleo.pv <= 0) exporChefe(b, ef, 'A couraça de energia se despedaça!', true);
  }
  if (b.carga && !b.carga.interrompida) {
    b.carga.dano += feito;
    if (b.carga.dano >= b.carga.lim) {
      b.carga.interrompida = true;
      ef.push(dizer('⚡ O golpe carregado foi INTERROMPIDO! O chefe cambaleia.', 'good'));
      if (!(b.quebradoAcoes > 0)) exporChefe(b, ef, 'O choque abre a guarda do chefe!', true);
    }
  }
  // fases: por HP restante (uma de cada vez, na ordem)
  const pct = t.hp / t.stats.hp, f = cfg.fases[b.fase - 1];
  if (f && t.hp > 0 && pct <= f.abaixo) {
    b.fase++;
    if (b.nucleo) b.nucleo = { ativo: true, pv: b.nucleo.max, max: b.nucleo.max };
    b.quebradoAcoes = 0;
    ef.push(dizer(`☄ ${f.titulo}! ${b.nucleo ? 'A couraça se refaz e o' : 'O'} chefe se enfurece.`, 'hit'));
    ef.push({ curaStatus: true }, { estagios: f.estagios });
  }
  return ef;
}

/* Antes de o chefe agir: conta a ação, refaz a couraça depois da Ruptura, gira o ponto fraco e decide o golpe telegrafado.
   Devolve { pular?, golpe?, todos?, efeitos }:
     pular  → o chefe gasta a ação (carregando, ou atordoado por ter sido interrompido);
     golpe  → usa ESTE golpe no lugar do escolhido (o golpe carregado, solto);
     todos  → o golpe carregado atinge TODOS os inimigos dele (o co-op aplica em cada um). */
export function antesDoChefeAgir(u) {
  const b = u?.boss, ef = []; if (!b) return { efeitos: ef };
  const cfg = cfgDe(b);
  b.acoes++;
  if (b.quebradoAcoes > 0 && --b.quebradoAcoes === 0 && b.nucleo) {
    b.nucleo = { ativo: true, pv: b.nucleo.max, max: b.nucleo.max };
    ef.push(dizer('🛡 A couraça do chefe se refez.', 'muted'));
  }
  if (cfg.pontoFraco && b.acoes > 1 && (b.acoes - 1) % cfg.pontoFraco.acoes === 0) {     // gira o ponto fraco a cada `acoes` ações
    const tipos = cfg.pontoFraco.tipos, i = (tipos.indexOf(b.fraco) + 1) % tipos.length;
    b.fraco = tipos[i];
    ef.push(dizer(`🎯 O ponto fraco do chefe mudou: agora só golpes do tipo ${b.fraco.toUpperCase()} machucam de verdade!`, 'level'));
  }
  if (b.carga) {                                        // esta é a ação em que o golpe carregado sai
    const c = b.carga; b.carga = null;
    if (c.interrompida) { ef.push(dizer('O chefe está atordoado e perde a ação!', 'good')); return { pular: true, efeitos: ef }; }
    ef.push(dizer(`☄ O chefe libera o ${cfg.canhao.rotulo}!`, 'crit'));
    if (cfg.expostoAposCanhao) b.quebradoAcoes = cfg.expostoAposCanhao;
    return { golpe: golpeCanhao(b.id), todos: true, efeitos: ef };
  }
  if (b.acoes % cicloAtual(b) === 0) {
    const lim = Math.max(1, Math.ceil(u.stats.hp * AJUSTES.cargaLimiar));
    b.carga = { dano: 0, lim, interrompida: false };
    ef.push(dizer(`⚠ O chefe está CARREGANDO o ${cfg.canhao.rotulo}! Cause ${lim} de dano de uma vez neste turno pra interromper — ou proteja o time.`, 'hit'));
    return { pular: true, efeitos: ef };
  }
  return { efeitos: ef };
}

// estado do chefe pra tela (barra de couraça, ponto fraco, aviso da carga)
export function resumoDoChefe(E) {
  const b = E?.boss; if (!b) return null;
  const cfg = cfgDe(b);
  return {
    id: b.id, fase: b.fase, temCoura: !!b.nucleo, couraAtiva: !!b.nucleo?.ativo, couraFracao: b.nucleo?.ativo ? Math.max(0, b.nucleo.pv / b.nucleo.max) : 0,
    exposto: b.quebradoAcoes > 0, pontoFraco: cfg.pontoFraco ? b.fraco : null, carregando: !!b.carga && !b.carga.interrompida,
    rotuloCarga: cfg.canhao.rotulo, faltaParaInterromper: b.carga && !b.carga.interrompida ? Math.max(0, b.carga.lim - b.carga.dano) : 0
  };
}
