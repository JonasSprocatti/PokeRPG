/* ============ regras dos chefes semanais (evento.js) ============
   Um chefe de evento não é "um Pokémon com muito HP": ele tem mecânicas que pedem leitura da luta e, no co-op, coordenação.
   Cada chefe combina algumas mecânicas (a config dele está em CHEFES):
     COURAÇA e RUPTURA   enquanto a couraça está de pé o dano cai; quando o estoque dela zera acontece a RUPTURA, uma janela em
                         que o chefe fica EXPOSTO e leva MAIS dano. Depois a couraça se refaz.
     PONTO FRACO         a cada `acoes` ações do chefe ele muda de "ponto fraco": só golpe DAQUELE tipo machuca de verdade (×mult);
                         qualquer outro tipo é reduzido (×contra). Pede um time de tipos variados.
     GOLPE TELEGRAFADO   a cada `ciclo` ações o chefe carrega um golpe devastador (avisado com um turno de antecedência). Dá pra
                         INTERROMPER causando dano suficiente no mesmo turno — o que ainda expõe o chefe. Solto, machuca de
                         verdade (no co-op, o time inteiro).
     FASES               em 66% e 33% do HP o chefe muda: limpa o que você fez a ele, refaz o que quebrou, sobe atributos e
                         encurta o ciclo do golpe telegrafado.
   e, conforme o chefe:
     CLIMA FIXO          a luta nasce com um clima permanente (Sol ou Chuva primordiais) — regras.novoCampo já sabe manter.
     ANULA               golpes de certos tipos não causam dano nenhum (o Sol do Groudon evapora a Água; a Chuva do Kyogre apaga o Fogo).
     MUNDO REVERSO       em janelas alternadas a tabela de tipos INVERTE: o que era super efetivo vira fraco e vice-versa (Giratina).
     ADAPTAÇÃO           o tipo do último golpe recebido é resistido no golpe seguinte: repetir tipo não funciona (Terapagos).
     DRENO               cura uma fração do dano que causa (Ursaluna Bloodmoon).
     REGENERAÇÃO         recupera HP a cada ação enquanto não está exposto (as células de Zygarde).
     HABILIDADE          uma habilidade da tabela (habilidades.js): Calyrex com Grim Neigh cresce a cada Pokémon seu que derruba.
   Tudo aqui é PURO: recebe o Pokémon do chefe (`E.boss` é só dados: vai no save e na rede) e devolve números e uma lista de
   EFEITOS (`{dizer}`, `{estagios}`, `{curaStatus}`, `{cura}`) que quem chama (golpe.js) aplica e narra. Sem DOM, sem rede:
   tests/boss.test.js. Os números moram em AJUSTES e CHEFES, num lugar só: a dificuldade se calibra jogando, não lendo. */

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
  cargaLimiar: 0.07,                     // fração do HP máx. que interrompe o golpe carregado
  escudoAstral: 0.5                      // o Escudo Astral corta o PRÓXIMO golpe carregado por este fator
};

// fases padrão: dois degraus de fúria. Cada chefe pode trocar os títulos e os atributos que sobem.
const fases = (t2, e2, t3, e3) => [{ abaixo: 0.66, titulo: t2, estagios: e2 }, { abaixo: 0.33, titulo: t3, estagios: e3 }];
const canhao = (name, type, cls, power, rotulo) => ({ name, type, cls, power, rotulo });

/* Os 14 chefes. `coura` {fracao do HP que a couraça guarda, reducao do dano com ela de pé}; `pontoFraco` {tipos que giram, acoes por
   tipo, mult no tipo da vez, contra nos outros}; `canhao` = o golpe carregado (NÃO pode ser golpe de carga do motor, tipo Freeze
   Shock: ele viraria "preparando" de novo). O Eternabeam e o Roar of Time já têm `recarga` em especiais.js. */
export const CHEFES = {
  'eternatus-eternamax': {
    nome: 'Eternatus', coura: { fracao: 0.16, reducao: 0.35 }, ciclo: 4, cicloFase3: 3,
    canhao: canhao('eternabeam', 'dragon', 'special', 200, 'ETERNABEAM'),
    fases: fases('Fase 2 — Onda Cósmica', [['special-attack', 1], ['speed', 1]], 'Fase 3 — Eternamax Instável', [['special-attack', 1], ['attack', 1]])
  },
  'rayquaza-mega': {
    nome: 'Mega Rayquaza', coura: null, ciclo: 4, cicloFase3: 3,
    pontoFraco: { tipos: ['ice', 'rock', 'dragon', 'electric', 'fairy'], acoes: 2, mult: 1.75, contra: 0.5 },
    canhao: canhao('dragon-ascent', 'flying', 'physical', 190, 'DRAGON ASCENT'),
    expostoAposCanhao: 1,                // depois de soltar o Dragon Ascent (que baixa a defesa dele) fica exposto até a próxima ação
    fases: fases('Fase 2 — Vento Delta', [['attack', 1], ['speed', 1]], 'Fase 3 — Fúria do Céu', [['attack', 1], ['special-attack', 1]])
  },
  'groudon-primal': {
    nome: 'Groudon Primal', coura: { fracao: 0.14, reducao: 0.4 }, ciclo: 4, cicloFase3: 3,
    climaFixo: 'sol', anula: { tipos: ['water'], texto: 'O Sol primordial evapora a Água' },
    canhao: canhao('precipice-blades', 'ground', 'physical', 190, 'LÂMINAS DO PRECIPÍCIO'),
    fases: fases('Fase 2 — Terra em Brasa', [['attack', 1], ['defense', 1]], 'Fase 3 — Erupção Total', [['attack', 1], ['special-attack', 1]])
  },
  'kyogre-primal': {
    nome: 'Kyogre Primal', coura: { fracao: 0.14, reducao: 0.4 }, ciclo: 4, cicloFase3: 3,
    climaFixo: 'chuva', anula: { tipos: ['fire'], texto: 'A Chuva primordial apaga o Fogo' },
    canhao: canhao('origin-pulse', 'water', 'special', 190, 'PULSO DA ORIGEM'),
    fases: fases('Fase 2 — Maré Alta', [['special-attack', 1], ['special-defense', 1]], 'Fase 3 — Dilúvio', [['special-attack', 1], ['speed', 1]])
  },
  'mewtwo-mega-y': {
    nome: 'Mega Mewtwo', coura: { fracao: 0.1, reducao: 0.5 }, ciclo: 4, cicloFase3: 3,
    pontoFraco: { tipos: ['bug', 'ghost', 'dark'], acoes: 2, mult: 1.75, contra: 0.55 },
    canhao: canhao('psystrike', 'psychic', 'special', 190, 'PSYSTRIKE'),
    fases: fases('Fase 2 — Modo X: Punhos Psíquicos', [['attack', 2]], 'Fase 3 — Mente Sem Limites', [['special-attack', 1], ['speed', 1]])
  },
  'necrozma-ultra': {
    nome: 'Necrozma Ultra', coura: { fracao: 0.16, reducao: 0.3 }, ciclo: 4, cicloFase3: 3,
    pontoFraco: { tipos: ['dark', 'ghost', 'bug', 'fairy', 'dragon'], acoes: 3, mult: 1.6, contra: 0.6 },   // a armadura de prisma: cada cor uma janela
    canhao: canhao('photon-geyser', 'psychic', 'special', 200, 'GÊISER DE FÓTONS'), habilidade: 'neuroforce',
    fases: fases('Fase 2 — Luz Ofuscante', [['special-attack', 1], ['attack', 1]], 'Fase 3 — Prisma Total', [['special-attack', 1], ['speed', 1]])
  },
  'calyrex-shadow': {
    nome: 'Calyrex Cavaleiro Espectral', coura: { fracao: 0.1, reducao: 0.5 }, ciclo: 4, cicloFase3: 3,
    habilidade: 'grim-neigh',                // cada Pokémon seu que ele derruba sobe o At. Esp. dele (bola de neve)
    canhao: canhao('astral-barrage', 'ghost', 'special', 190, 'ASTRAL BARRAGE'),
    fases: fases('Fase 2 — Galope Sombrio', [['speed', 1]], 'Fase 3 — Cavalgada Final', [['special-attack', 1], ['speed', 1]])
  },
  'zacian-crowned': {
    nome: 'Zacian Coroada', coura: { fracao: 0.2, reducao: 0.3 }, ciclo: 4, cicloFase3: 3, expostoAposCanhao: 1,
    canhao: canhao('behemoth-blade', 'steel', 'physical', 200, 'LÂMINA COLOSSAL'), habilidade: 'intrepid-sword',
    fases: fases('Fase 2 — Lâmina Desperta', [['attack', 1]], 'Fase 3 — Espada do Rei', [['attack', 1], ['speed', 1]])
  },
  'kyurem-black': {
    nome: 'Kyurem Negro', coura: { fracao: 0.1, reducao: 0.5 }, ciclo: 4, cicloFase3: 3,
    pontoFraco: { tipos: ['fighting', 'rock', 'steel', 'fairy', 'dragon'], acoes: 2, mult: 1.75, contra: 0.5 },
    canhao: canhao('fusion-bolt', 'electric', 'physical', 190, 'FUSION BOLT'),
    fases: fases('Fase 2 — Geada Elétrica', [['attack', 1], ['speed', 1]], 'Fase 3 — Fusão Completa', [['attack', 2]])
  },
  'giratina-origin': {
    nome: 'Giratina Origem', coura: { fracao: 0.14, reducao: 0.4 }, ciclo: 4, cicloFase3: 3,
    inverso: { acoes: 3 },
    canhao: canhao('shadow-ball', 'ghost', 'special', 190, 'ESFERA DO MUNDO REVERSO'),
    fases: fases('Fase 2 — Distorção', [['special-attack', 1], ['defense', 1]], 'Fase 3 — Colapso do Reverso', [['attack', 1], ['special-attack', 1]])
  },
  'dialga-origin': {
    nome: 'Dialga Origem', coura: { fracao: 0.16, reducao: 0.35 }, ciclo: 4, cicloFase3: 3,
    canhao: canhao('roar-of-time', 'dragon', 'special', 200, 'ROAR OF TIME'),               // já exige recarga: o tempo cobra seu preço
    fases: fases('Fase 2 — Tempo Acelerado', [['speed', 2]], 'Fase 3 — Fim do Tempo', [['special-attack', 1], ['speed', 1]])
  },
  'terapagos-stellar': {
    nome: 'Terapagos Estelar', coura: { fracao: 0.12, reducao: 0.5 }, ciclo: 4, cicloFase3: 3,
    adapta: { reducao: 0.35 },                 // repetir o mesmo tipo do golpe anterior quase não faz nada
    canhao: canhao('tera-starstorm', 'normal', 'special', 200, 'TERA STARSTORM'),
    fases: fases('Fase 2 — Cristal em Órbita', [['special-defense', 1], ['special-attack', 1]], 'Fase 3 — Estrela Completa', [['special-attack', 1], ['speed', 1]])
  },
  'ursaluna-bloodmoon': {
    nome: 'Ursaluna Lua de Sangue', coura: { fracao: 0.14, reducao: 0.45 }, ciclo: 4, cicloFase3: 3,
    dreno: 0.3,                                // cura 30% do dano que causa: quanto mais demora, mais ele aguenta
    canhao: canhao('blood-moon', 'normal', 'special', 200, 'BLOOD MOON'),
    fases: fases('Fase 2 — Sede de Sangue', [['attack', 1], ['special-attack', 1]], 'Fase 3 — Lua Rubra', [['special-attack', 2]])
  },
  'zygarde-complete': {
    nome: 'Zygarde Completo', coura: { fracao: 0.18, reducao: 0.35 }, ciclo: 4, cicloFase3: 3,
    regenera: 0.04,                            // as células se regeneram: só pára enquanto o chefe está exposto
    canhao: canhao('core-enforcer', 'dragon', 'special', 190, 'CORE ENFORCER'),
    fases: fases('Fase 2 — Células Reunidas', [['defense', 1], ['special-defense', 1]], 'Fase 3 — Ordem Perfeita', [['attack', 1], ['speed', 1]])
  }
};
export const CHEFE_PADRAO = 'eternatus-eternamax';
const cfgDe = b => CHEFES[b?.id] || CHEFES[CHEFE_PADRAO];   // save de antes de ter `id`: era o Eternatus

const dizer = (txt, cls = 'status') => ({ dizer: txt, cls });

// nível do chefe pro jogador dessa run
export const nivelDoChefe = nivelJogador => Math.max(AJUSTES.nivelMin, Math.min(AJUSTES.nivelMax, (nivelJogador || 1) + AJUSTES.nivelExtra));

/* Quantos "jogadores" a luta vale, pro HP: `jogadores` reais + uma fração por Pokémon extra que cada um leva. */
export const jogadoresEfetivos = (jogadores, porJogador = 1) => Math.max(1, jogadores) * (1 + AJUSTES.pesoPokemonExtra * (Math.max(1, porJogador) - 1));

// o clima que a luta deste chefe já começa (ou null) e a habilidade que ele usa (ou null)
export const climaDoChefe = id => CHEFES[id]?.climaFixo || null;
export const habilidadeDoChefe = id => CHEFES[id]?.habilidade || null;

/* Deixa o Pokémon `E` (recém-criado por makeMon) pronto pra ser o chefe `id`: HP e atributos maiores, imune a status, PP sem
   fim, e o estado das mecânicas em `E.boss`. `jogadores` = quantos jogadores entram na luta (1 no single player; aceita fração). */
export function prepararChefe(E, jogadores = 1, id = CHEFE_PADRAO) {
  const cfg = CHEFES[id] || CHEFES[CHEFE_PADRAO], j = Math.max(1, jogadores);
  const hpMult = AJUSTES.hpMult * (1 + AJUSTES.hpPorJogador * (j - 1));
  for (const s of Object.keys(E.stats)) E.stats[s] = Math.floor(E.stats[s] * (s === 'hp' ? hpMult : AJUSTES.statMult));
  E.hp = E.stats.hp;
  E.chefeEvento = true;
  for (const m of E.moves || []) { m.pp = 99; m.ppLeft = 99; }     // o chefe nunca cai no Struggle
  const max = cfg.coura ? Math.max(1, Math.floor(E.stats.hp * cfg.coura.fracao)) : 0;
  E.boss = { id, fase: 1, acoes: 0, quebradoAcoes: 0, carga: null, jogadores: j,
    nucleo: cfg.coura ? { ativo: true, pv: max, max } : null,
    fraco: cfg.pontoFraco ? cfg.pontoFraco.tipos[0] : null, reverso: false, ultimoTipo: null, raide: {}, canhaoMult: 0, canhaoUltimoMult: 1 };
  return E;
}

/* Aplica o clima fixo do chefe num campo de batalha (`regras.novoCampo`): o mesmo formato do clima de rota, então o motor mantém
   sozinho — permanente até um golpe trocar, e depois de 5 turnos o padrão volta. `turnos` = regras.CLIMA_TURNOS. */
export function aplicarClimaDoChefe(campo, id, turnos = 5) {
  const clima = climaDoChefe(id); if (!clima || !campo) return campo;
  campo.clima = clima; campo.turnos = turnos; campo.climaFixo = true;
  campo.padrao = { ...(campo.padrao || {}), clima };
  return campo;
}

// o golpe carregado do chefe (o motor já sabe que o Eternabeam e o Roar of Time exigem recarga: especiais.js). `mult` = Escudo Astral.
export const golpeCanhao = (id = CHEFE_PADRAO, mult = 1) => { const c = (CHEFES[id] || CHEFES[CHEFE_PADRAO]).canhao;
  return { name: c.name, type: c.type, cls: c.cls, power: Math.max(1, Math.floor(c.power * (mult || 1))), acc: null, pp: 99, ppLeft: 99, priority: 0,
    target: 'selected-pokemon', meta: {}, stats: [], desc: 'O golpe carregado do chefe.' }; };

const cicloAtual = b => (b.fase >= 3 ? cfgDe(b).cicloFase3 : cfgDe(b).ciclo);

/* Dano que o chefe RECEBE (já calculado pelo motor): anulado pelo tipo (Groudon/Kyogre), invertido no Mundo Reverso, reduzido pela
   adaptação, reduzido pela couraça de pé, multiplicado pelo ponto fraco e aumentado quando exposto. `tipo` = o tipo do golpe;
   `ef` = a efetividade que o motor já aplicou (2, 0.5…). ATENÇÃO: com `adapta` esta função guarda o tipo do golpe (`b.ultimoTipo`). */
export function danoNoChefe(t, dano, tipo = null, ef = 1) {
  const b = t?.boss; if (!b) return dano;
  const cfg = cfgDe(b);
  if (cfg.anula && tipo && cfg.anula.tipos.includes(tipo)) return 0;
  let d = dano;
  if (b.reverso && ef > 0 && ef !== 1) d = d * Math.min(4, Math.max(0.25, 1 / (ef * ef)));   // desfaz o ×ef do motor e aplica o inverso
  if (cfg.adapta && tipo && tipo === b.ultimoTipo) d = d * cfg.adapta.reducao;
  if (cfg.adapta && tipo) b.ultimoTipo = tipo;
  if (b.nucleo?.ativo) d = d * cfg.coura.reducao;
  if (cfg.pontoFraco && tipo) d = d * (tipo === b.fraco ? cfg.pontoFraco.mult : cfg.pontoFraco.contra);
  if (b.quebradoAcoes > 0) d = d * AJUSTES.exposto.mult;
  return Math.max(1, Math.floor(d));
}

// o texto que explica por que um golpe daquele tipo não fez nada ('' se não é o caso)
export const anulaTexto = (t, tipo) => { const a = cfgDe(t?.boss).anula; return t?.boss && a && tipo && a.tipos.includes(tipo) ? a.texto : ''; };
// cura do chefe pelo dano que ele causou (Ursaluna Bloodmoon); 0 pros outros
export const drenoDoChefe = (u, dano) => { const f = cfgDe(u?.boss).dreno; return u?.boss && f && dano > 0 ? Math.max(1, Math.floor(dano * f)) : 0; };

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

/* Antes de o chefe agir: conta a ação, refaz a couraça depois da Ruptura, gira o ponto fraco, alterna o Mundo Reverso, regenera
   e decide o golpe telegrafado. Devolve { pular?, golpe?, todos?, efeitos }:
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
  if (cfg.inverso) {                                                                      // Mundo Reverso: alterna a cada `acoes` ações
    const rev = Math.floor((b.acoes - 1) / cfg.inverso.acoes) % 2 === 1;
    if (rev !== b.reverso) {
      b.reverso = rev;
      ef.push(dizer(rev ? '🔄 O MUNDO REVERSO se abre: a tabela de tipos INVERTE! O que era super efetivo agora é fraco — e o contrário.' : '🔄 O Mundo Reverso se fecha: os tipos voltam ao normal.', 'level'));
    }
  }
  if (cfg.regenera && !(b.quebradoAcoes > 0) && u.hp > 0 && u.hp < u.stats.hp) {
    const n = Math.max(1, Math.floor(u.stats.hp * cfg.regenera));
    ef.push({ cura: n }, dizer(`🧬 As células do chefe se regeneram (+${n} HP). Exponha-o pra parar isso!`, 'muted'));
  }
  if (b.carga) {                                        // esta é a ação em que o golpe carregado sai
    const c = b.carga; b.carga = null;
    if (c.interrompida) { ef.push(dizer('O chefe está atordoado e perde a ação!', 'good')); return { pular: true, efeitos: ef }; }
    ef.push(dizer(`☄ O chefe libera o ${cfg.canhao.rotulo}!`, 'crit'));
    const mult = b.canhaoMult || 1;                                                       // Escudo Astral: vale UM golpe
    b.canhaoUltimoMult = mult; b.canhaoMult = 0;
    if (mult < 1) ef.push(dizer('🛡 O Escudo Astral absorve parte do impacto!', 'good'));
    if (cfg.expostoAposCanhao) b.quebradoAcoes = cfg.expostoAposCanhao;
    return { golpe: golpeCanhao(b.id, mult), todos: true, efeitos: ef };
  }
  if (b.acoes % cicloAtual(b) === 0) {
    const lim = Math.max(1, Math.ceil(u.stats.hp * AJUSTES.cargaLimiar));
    b.carga = { dano: 0, lim, interrompida: false };
    ef.push(dizer(`⚠ O chefe está CARREGANDO o ${cfg.canhao.rotulo}! Cause ${lim} de dano de uma vez neste turno pra interromper — ou proteja o time.`, 'hit'));
    return { pular: true, efeitos: ef };
  }
  return { efeitos: ef };
}

/* ---- itens de raide (dados.ITEMS com `raide`): consumíveis que só valem na luta do chefe, UM de cada tipo por luta ----
     ruptura      força a Ruptura na hora (Cristal de Ruptura)
     interrupcao  interrompe o golpe carregado (Selo de Interrupção) — só se ele estiver carregando
     escudo       corta o PRÓXIMO golpe carregado pela metade (Escudo Astral)
   Devolve { ok, efeitos, motivo? }. Quem chama gasta o item da mochila só se `ok`. */
export const ITENS_DE_RAIDE = ['ruptura', 'interrupcao', 'escudo'];
export const ITEM_DO_RAIDE = { ruptura: 'cristal-de-ruptura', interrupcao: 'selo-de-interrupcao', escudo: 'escudo-astral' };   // tipo → id em dados.ITEMS
export function usarItemDeRaide(E, tipo) {
  const b = E?.boss, ef = [];
  if (!b) return { ok: false, efeitos: ef, motivo: 'Esse item só funciona na luta contra o chefe da semana.' };
  if (!ITENS_DE_RAIDE.includes(tipo)) return { ok: false, efeitos: ef, motivo: 'Item de raide desconhecido.' };
  if (b.raide?.[tipo]) return { ok: false, efeitos: ef, motivo: 'Esse item já foi usado nesta luta (um de cada por luta).' };
  if (tipo === 'ruptura') {
    if (b.quebradoAcoes > 0) return { ok: false, efeitos: ef, motivo: 'O chefe já está exposto.' };
    exporChefe(b, ef, 'O Cristal de Ruptura estilhaça a defesa do chefe!', true);
  } else if (tipo === 'interrupcao') {
    if (!b.carga || b.carga.interrompida) return { ok: false, efeitos: ef, motivo: 'O chefe não está carregando nenhum golpe agora.' };
    b.carga.interrompida = true;
    ef.push(dizer('📿 O Selo de Interrupção corta a energia: o golpe carregado FALHA!', 'good'));
    if (!(b.quebradoAcoes > 0)) exporChefe(b, ef, 'O choque abre a guarda do chefe!', true);
  } else if (tipo === 'escudo') {
    if (b.canhaoMult) return { ok: false, efeitos: ef, motivo: 'O Escudo Astral já está de pé.' };
    b.canhaoMult = AJUSTES.escudoAstral;
    ef.push(dizer(`🛡 O Escudo Astral envolve o time: o PRÓXIMO golpe carregado causa só ${Math.round(AJUSTES.escudoAstral * 100)}% do dano.`, 'good'));
  }
  (b.raide ||= {})[tipo] = true;
  return { ok: true, efeitos: ef };
}

// estado do chefe pra tela (barra de couraça, ponto fraco, aviso da carga, imunidades e o que ele tem de especial)
export function resumoDoChefe(E) {
  const b = E?.boss; if (!b) return null;
  const cfg = cfgDe(b);
  return {
    id: b.id, fase: b.fase, temCoura: !!b.nucleo, couraAtiva: !!b.nucleo?.ativo, couraFracao: b.nucleo?.ativo ? Math.max(0, b.nucleo.pv / b.nucleo.max) : 0,
    exposto: b.quebradoAcoes > 0, pontoFraco: cfg.pontoFraco ? b.fraco : null, carregando: !!b.carga && !b.carga.interrompida,
    rotuloCarga: cfg.canhao.rotulo, faltaParaInterromper: b.carga && !b.carga.interrompida ? Math.max(0, b.carga.lim - b.carga.dano) : 0,
    anula: cfg.anula?.tipos || null, textoAnula: cfg.anula?.texto || '', reverso: !!b.reverso, temReverso: !!cfg.inverso,
    adaptado: cfg.adapta ? b.ultimoTipo : undefined, regenera: !!cfg.regenera, dreno: !!cfg.dreno,
    escudo: !!b.canhaoMult, usados: { ...(b.raide || {}) }
  };
}
