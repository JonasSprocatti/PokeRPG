/* ============ multiplayer: as regras da sala (PURO — sem DOM, sem rede) ============
   Tudo o que a sala DECIDE mora aqui: com qual Pokémon cada um entra, quem pode agir, quem já escolheu, o que dá
   pra usar da mochila, quem está pronto. Antes essas contas viviam soltas dentro de `multiplayer.js`, fechadas
   sobre a variável `sala` do módulo — e por isso nenhuma delas tinha teste, apesar de mandarem em coisas como
   "esta luta mexe na minha jornada?" e "de qual mochila sai este Revive?".
   Aqui nada lê estado global: toda função recebe a sala (ou um `ctx`) por parâmetro. Quem chama monta o ctx com
   `ctxDaSala()` (multiplayer.js). Testes em `tests/mp-regras.test.js`. */
import { ITEMS } from './dados.js';
import { itemTemEfeito, freshVol } from './regras.js';
import { ITENS_DE_RAIDE, ITEM_DO_RAIDE } from './boss.js';
import { ladoDe, numerarRepetidos, MAX_REVIVES } from './mp-motor.js';

export const MAX_JOGADORES = 6;
export const PRAZO_MS = 45000;      // quem não escolher até aqui joga no automático (melhor golpe)
export const MAX_HISTORICO = 5;     // turnos guardados pra reler (tela da sala)

/* ---------- com qual Pokémon eu entro ----------
   A escolha é de CADA JOGADOR (o anfitrião só manda no `modo` da sala):
     'run'        o da jornada atual — a luta mexe nela (XP, HP, itens)
     'convidado'  um emprestado só pra sala (Nv. 5): não mexe em save nenhum
     'hall'       de 1 a MAX_TIME_HALL do PRÓPRIO Hall da Fama, no nível de verdade
     'espectador' só assistir: não entra em lado nenhum
   A Sala de Raide (`modo === 'raide'`) não é uma quarta opção: ela FORÇA 'hall' pra todo mundo, porque lá
   ninguém usa run. */
export const ENTRADAS = ['run', 'hall', 'convidado', 'espectador'];
export const raideSemRun = sala => sala?.config?.modo === 'raide';
// a entrada que VALE agora (na Raide, sempre o Hall — menos pra quem escolheu só assistir)
export const entradaEfetiva = sala => {
  const t = sala?.entradaTipo || 'run';
  if (t === 'espectador') return 'espectador';
  return raideSemRun(sala) ? 'hall' : t;
};
// Hall usado FORA da Sala de Raide = emprestado como o convidado: sem mochila, sem recompensa, sem gimmick.
// (Dentro da Raide o Hall tem a mochila da CONTA, que é o ponto dela — por isso a distinção.)
export const hallEmprestado = sala => entradaEfetiva(sala) === 'hall' && !raideSemRun(sala);
// entrei com Pokémon emprestado (convidado, Hall fora da Raide) ou nem entrei: não tenho mochila nesta luta
export const semMochila = sala => ['convidado', 'espectador'].includes(entradaEfetiva(sala)) || hallEmprestado(sala);
// a luta mexe na minha jornada? (só quando entrei com o Pokémon da run)
export const usaRun = sala => entradaEfetiva(sala) === 'run';
export const soAssistindo = sala => entradaEfetiva(sala) === 'espectador';

/* ---------- quem age, quem falta ---------- */
export const jogaveis = b => [...b.lados.A, ...b.lados.B].filter(m => m.hp > 0 && m.dono !== 'ia');
export const primeiroInimigo = (b, m) => b.lados[ladoDe(b, m.ref) === 'A' ? 'B' : 'A'].find(e => e.hp > 0);
export const inimigosDe = (b, m) => b.lados[ladoDe(b, m.ref) === 'A' ? 'B' : 'A'].filter(e => e.hp > 0);
// meu próximo Pokémon que ainda não escolheu neste turno (`escolhidos` = o que eu mandei; `acoesFeitas` = o que o anfitrião confirmou)
export const minhaVezDe = (sala, eu) => {
  const b = sala?.batalha; if (!b) return null;
  return jogaveis(b).find(m => m.dono === eu && !sala.escolhidos?.has(m.ref) && !(sala.acoesFeitas || []).includes(m.ref)) || null;
};
// ids dos donos que ainda não escolheram (a tela vira isso em fichas com ✓/⏳)
export const quemFalta = sala => {
  const b = sala?.batalha; if (!b) return [];
  return [...new Set(jogaveis(b).filter(m => !(sala.acoesFeitas || []).includes(m.ref)).map(m => m.dono))];
};
export const jaEscolheu = (sala, id) => !!sala?.batalha && !quemFalta(sala).includes(id);
// "pronto" no lobby: todo mundo marcou E tem pelo menos um Pokémon (quem só assiste não conta nem atrapalha)
export const jogadoresDaSala = (membros = []) => membros.filter(m => (m.entradaTipo || 'run') !== 'espectador');
export const todosProntos = (membros = []) => {
  const jogando = jogadoresDaSala(membros);
  return jogando.length > 0 && jogando.every(m => m.pronto && m.mons?.length);
};
/* Por que o botão de começar está apagado? Texto único, mostrado no `title` e embaixo do botão — antes o
   anfitrião só via um botão morto e tinha de adivinhar (ou pior: a sala começava sem alguém que ainda estava
   escolhendo). '' = dá pra começar. */
export function motivoParaNaoComecar(sala, { temRun } = {}) {
  const cfg = sala?.config || {}, jogando = jogadoresDaSala(sala?.membros);
  if (!jogando.length) return 'Ninguém entrou pra jogar ainda (só espectadores).';
  if (cfg.modo === 'coop' && !temRun) return 'Co-op é jogar a run de alguém: você precisa de uma jornada em andamento.';
  const semMon = jogando.filter(m => !m.mons?.length);
  if (semMon.length) return `Ainda escolhendo o Pokémon: ${semMon.map(m => m.nome).join(', ')}.`;
  if (cfg.modo === 'pvp' && !['A', 'B'].every(t => jogando.some(m => (m.time || 'B') === t)))
    return 'Cada time precisa de pelo menos um jogador.';
  const faltaPronto = jogando.filter(m => !m.pronto);
  if (faltaPronto.length) return `Falta ficar pronto: ${faltaPronto.map(m => m.nome).join(', ')}.`;
  return '';
}
// o selo que aparece no cartão de cada jogador do lobby (é o "quem está fazendo o quê" da sala)
export function seloDoMembro(m) {
  if ((m.entradaTipo || 'run') === 'espectador') return { txt: '👁 assistindo', cls: 'assiste' };
  if (!m.mons?.length) return { txt: '⏳ escolhendo', cls: 'escolhendo' };
  return m.pronto ? { txt: '✅ pronto', cls: 'pronto' } : { txt: '⏳ escolhendo', cls: 'escolhendo' };
}

/* ---------- montar os lados (anfitrião) ---------- */
// lista de Pokémon de um jogador pra luta: os primeiros `porJogador` em pé, com ref/dono/slot
export const monsDe = (m, lado, ini, porJogador) => (m.mons || []).slice(0, porJogador).filter(x => x.hp > 0)
  .map((x, i) => ({ ...structuredClone(x), ref: lado + (ini + i), dono: m.id, vol: freshVol() }));
export function montarLado(membros, lado, porJogador) {
  const out = [];
  for (const m of membros) out.push(...monsDe(m, lado, out.length, porJogador));
  return numerarRepetidos(out);   // 3 Swampert viram "Swampert 1/2/3" — senão o registro fica ilegível (mp-motor)
}

/* ---------- mochila: o que dá pra usar agora ----------
   `ctx` = { sala, eu, bag, temRun } — `bag` já é a mochila CERTA (a da run ou a da conta, decidido por quem
   chama, em `minhaMochila`). Assim estas funções não precisam saber que existe save. */
// Itens de raide que posso usar agora: tenho, e o grupo ainda não usou aquele tipo nesta luta
export function raideDisponiveis(b, ctx) {
  const { sala, bag = {}, temRun } = ctx || {};
  if (!b?.evento || semMochila(sala) || (!raideSemRun(sala) && !temRun)) return [];
  return ITENS_DE_RAIDE.filter(tipo => (bag[ITEM_DO_RAIDE[tipo]] || 0) > 0 && !b.lados.B.some(m => m.boss?.raide?.[tipo]));
}
/* Itens comuns (Potion, X Attack, curas de status, Éter…) que dá pra usar AGORA: na mochila certa, com efeito de
   verdade (a mesma regra pura do single player, `itemTemEfeito`) e vale em QUALQUER luta de sala — diferente do
   Revive/raide, não é exclusivo do chefe da semana. Fora as categorias que já têm caminho próprio (segurado,
   raide, revive, evolução…) ou não fazem sentido em batalha (repelente, relembrar golpe). */
export const SEM_BATALHA_MP = ['candy', 'afinidade', 'evo', 'troca', 'segurar', 'segurado', 'repelente', 'ensina', 'raide', 'revive'];
export function itensComunsDisponiveis(ctx) {
  const { sala, bag = {}, temRun, mon } = ctx || {};
  if (!mon || semMochila(sala) || (!raideSemRun(sala) && !temRun)) return [];
  return Object.entries(bag).filter(([k, n]) => n > 0 && ITEMS[k] && !SEM_BATALHA_MP.some(f => ITEMS[k][f]) && itemTemEfeito(ITEMS[k], mon)).map(([k]) => k);
}
/* Posso usar um Revive agora? Fora da Sala de Raide: só com o time INTEIRO caído (a regra de sempre). Dentro
   dela: igual à Arena — reviver com o time ainda lutando, contanto que eu tenha alguém de pé e alguém caído;
   e aceita Max Revive. */
export function podeReviver(b, ctx) {
  const { sala, eu, bag = {}, temRun } = ctx || {};
  if (!b?.evento || semMochila(sala) || (b.revivesUsados?.[eu] || 0) >= MAX_REVIVES) return false;
  const meusCaidos = b.lados.A.some(m => m.dono === eu && m.hp <= 0);
  if (raideSemRun(sala)) return ((bag.revive || 0) > 0 || (bag['max-revive'] || 0) > 0) && meusCaidos && b.lados.A.some(m => m.dono === eu && m.hp > 0);
  return !!temRun && (bag.revive || 0) > 0 && meusCaidos
    && b.lados.A.some(m => m.hp > 0) && !b.lados.A.some(m => m.dono === eu && m.hp > 0);
}
export const revivesRestantes = (b, eu) => MAX_REVIVES - (b?.revivesUsados?.[eu] || 0);

/* ---------- resumo da configuração (cabeçalho da sala) ----------
   Precisa conhecer os TRÊS modos: antes só sabia "PvP ou não", então a Sala de Raide se anunciava como
   "Co-op … · Rota 1" (rota que ela nem usa) e contradizia o próprio seletor de Modo logo abaixo. */
export const NOME_DO_MODO = { coop: '🌿 Co-op', pvp: '⚔ PvP', raide: '☄ Sala de Raide' };
export function resumoDaConfig(cfg = {}, nomeZona = '') {
  const raide = cfg.modo === 'raide', pvp = cfg.modo === 'pvp';
  return [NOME_DO_MODO[cfg.modo] || NOME_DO_MODO.coop,
    `${cfg.porJogador || 1} Pokémon por jogador`,
    raide ? '' : cfg.balancear ? 'balanceado' : 'sem balancear',
    pvp || raide ? '' : nomeZona].filter(Boolean).join(' · ');
}
