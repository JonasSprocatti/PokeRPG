/* ============ batalha ============ */
// 1×1 contra selvagem ou contra a equipe de um treinador caçador (um Pokémon por vez; o treinador
// pode gastar a vez lançando bola em você). `turn(action)` é o único ponto de entrada da UI: trava `G.busy`, resolve
// jogador + inimigo na ordem certa, residual, vitória/derrota, e sempre salva no `finally`.
// As contas (precisão, fuga, ordem, residual, XP, EVs) moram em regras.js; aqui fica a narração.
import { G, nm, save, dificuldadeDe, ladoJogador, emCampo, vivos, registrar, registrarVisto, zerarDescontoCentro, rotasAtuais, rotulo, zone,
  ligarInimigos, inimigosEmCampo, grupoInimigoCaiu } from './estado.js';
import { sortearDaRota, sequenciaLendaria, dadosDaGen, genDe, TOTAL_GENS, especieForcada, especiesDaGen, rotasDaGen } from './mapas.js';
import { log, say, ask } from './ui.js';
import { render } from './render.js';
import { healFull, CTX } from './efeitos.js';
import { usarGolpe, golpeTravado, fimDeTurno, fimDaRodada, passarClima, passarTerreno, passarLados, aplicarArmadilhas, aoEntrarEmCampo, desfazerForma, preCarregarAshGreninja, desfazerAshGreninja, desfazerTrace } from './golpe.js';
import { gainExp, gainExpAliado, checkEvolution, verificarEvolucoesPendentes } from './progressao.js';
import { ganharFelicidade } from './evolucao.js';
import { useItem } from './itens.js';
import { oferecer } from './amizade.js';
import { makeMon } from './pokemon.js';
import { encerrarJornada, telaEscolherGen } from './fim.js';
import { API, STATS, STAT_PT, TYPE_PT, STRUGGLE, ZONES, BOLAS, CLASSES_TREINADOR, NOMES_TREINADOR, DIFICULDADES, ITEMS, ITENS_EVO_ACHADOS } from './dados.js';
import {
  freshVol, effStat, consegueFugir, ordenarAcoes, ativouQuickClaw, golpeDoAliado, golpesPermitidos, golpeForcado, xpPorVitoria, ganhoDeEVs,
  novoCampo, climaDasRotasAtivo, CLIMA_TURNOS, premioTreinador, bolaPorNivel, treinadorLancaBola, valorCaptura, balancosDaCaptura,
  statsDeChefe, premioChefe, zonaLiberada, desmaioPrecisaRevive, multShiny, climaDe, terrenoDe, escolhaIA, ESPERTEZA, multVento, poderZ, TURNOS_DYNAMAX, sortearTipoTera, noChao,
  prioridadeEfetiva, sempreUltimo, proximoDoTreinador, efeitosAoVencer, tiposDefensivos, tiposOfensivos, alvoPorAmeaca, tamanhoDoGrupo, GRUPO_MAX, golpeDoPlano, especiesDobradas
} from './regras.js';
import { verificarMissoes } from './missoes.js';
import { registrarAbate, registrarDano } from './conquistas.js';
import { megasDoJogador, megasDisponiveis, megaevoluir, desfazerMega, preCarregarMegas, inimigoPodeMega, inimigoMegaLiberada, inimigoTeraGmaxLiberado, HP_MEGA_INIMIGO, verboDaForma } from './mega.js';
import { terasDisponiveis, teracristalizar, desfazerTera } from './tera.js';
import { zDisponiveis, inimigoTemZ, inimigoUsaZAgora } from './zmove.js';
import { podeGigantamax, gigantamaxar, passarDynamax, desfazerDynamax, inimigoPodeGmax } from './dynamax.js';
import { tocarMusica, tocarCry } from './som.js';
import { loadPokemon, loadSpecies, loadMove, pokemonEmCache } from './api.js';
import { hab } from './habilidades.js';
import { EVENTOS, idDaSemana, registrarTentativa, agoraDoEvento, EVENTO_SEM_PERMADEATH } from './evento.js';
import { prepararChefe, nivelDoChefe, habilidadeDoChefe, aplicarClimaDoChefe } from './boss.js';
import { registrarVitoriaDeEvento } from './carreira.js';
import { sincronizar, usuario } from './nuvem.js';
import { rand, pick, esc, fmt, offline, erroOffline } from './util.js';

// golpes e fim de turno vêm do motor único (golpe.js), narrados pelo CTX do single player (efeitos.js)
const useMove = (user, target, move, movedFirst) => usarGolpe(user, target, move, movedFirst, CTX);
// O inimigo pensa conforme quem ele é: selvagem chuta bastante, treinador pensa melhor, Alfa e lendário quase sempre
// acertam o golpe (regras.escolhaIA). O alvo é sempre o seu lado — pega o primeiro em pé pra medir a eficácia.
function chooseEnemyMove(E) {
  const B = G.B;
  const esperteza = B?.chefe || B?.lendarios || B?.evento ? ESPERTEZA.chefe : B?.trainer ? ESPERTEZA.treinador : ESPERTEZA.selvagem;
  return melhorGolpe(E, vivos(emCampo())[0] || G.S.player, esperteza);
}
/* A escolha de golpe, de qualquer lado do campo: só o que as travas deixam (regras.golpesPermitidos), julgado
   com o CONTEXTO da luta (notaDoGolpe) — quem apanha, o campo e os dois lados. Tipos pelo Tera, não pelos de
   origem: sem isso o selvagem (degrau `simples`, que não passa por `notaDoGolpe`) escolhia o golpe como se você
   nunca tivesse terastalizado. Exportada porque o 🤖 auto-explorar (auto.js) decide o SEU golpe por ela — o
   laço automático tem de jogar com a mesma cabeça do inimigo mais esperto, não com uma segunda regra. */
export function melhorGolpe(m, alvo, esperteza = ESPERTEZA.chefe) {
  const lados = G.B?.campo?.lados;
  const contexto = { u: m, alvo, campo: G.B?.campo, ladoU: lados?.[CTX.ladoDe(m)], ladoAlvo: lados?.[CTX.ladoDe(alvo)] };
  return escolhaIA(golpesPermitidos(m), tiposOfensivos(m), tiposDefensivos(alvo), esperteza, undefined, contexto) || STRUGGLE;
}
const residual = m => fimDeTurno(m, CTX); // queimadura/veneno + Speed Boost, Shed Skin

/* ---- início de batalha ---- */
// selvagem: da lista da rota, pela taxa de aparição de cada um (mapas.js). Míticos da Gen: bem raros, nas rotas altas.
// Offline: só entre os que já estão no cache deste navegador (buscados em alguma partida online).
function sortearOponente(z) {
  // repelente seletivo ou Caça Shiny: só a espécie escolhida aparece (mapas.js especieForcada)
  const caca = especieForcada(G.S, z);
  if (caca) {
    const alvo = z.pool.find(x => x.n === caca);
    if (alvo && (!offline() || pokemonEmCache(alvo.id))) return { id: alvo.id, level: rand(z.min, z.max) };
  }
  // item de evolução na mochila dobra o peso de quem evolui com ele (regras.especiesDobradas)
  const p = sortearDaRota(z, offline() ? pokemonEmCache : null, Math.random, especiesDobradas(G.S.bag));
  if (!p) throw erroOffline(`📴 Sem internet, e nenhum Pokémon de ${z.name} está salvo neste aparelho ainda. Tente uma rota que você já explorou, ou baixe o mapa em ⚙ Ajustes → Jogar offline.`);
  return { id: p.id, level: rand(z.min, z.max) };
}
async function novoOponente(z) { const { id, level } = sortearOponente(z); return makeMon(await loadPokemon(id), level); }
/* Equipe de treinador: metade dela NÃO sai do pool da rota. Um treinador andou até aqui — a rota diz em que NÍVEL
   ele está, não quais espécies ele criou. O resto continua vindo do pool, pra rota manter a cara dela.
   Vale pra todo treinador de rota (o de emboscada é o único que existe hoje). Offline, só o que está guardado. */
const CHANCE_FORA_DA_ROTA = 0.5;
function sortearDoTreinador(z) {
  if (Math.random() < CHANCE_FORA_DA_ROTA) {
    let lista = especiesDaGen(z.gen || genDe(G.S));
    if (offline()) lista = lista.filter(p => pokemonEmCache(p.id));
    if (lista.length) return { id: pick(lista).id, level: rand(z.min, z.max) };
  }
  return sortearOponente(z); // (offline sem nada guardado: o erro daqui é o mesmo do encontro selvagem)
}
async function novoOponenteTreinador(z) { const { id, level } = sortearDoTreinador(z); return makeMon(await loadPokemon(id), level); }
/* Começa a batalha. `B.enemy` (um inimigo) e `B.inimigos` (grupo, ⚔ Saga) são aceitos: tudo é normalizado pra
   lista + `estado.ligarInimigos`, que instala o getter `enemy`. Um ramo só serve aos dois casos. */
function iniciar(B) {
  for (const m of ladoJogador()) m.vol = freshVol();
  const lista = B.inimigos?.length ? [...B.inimigos] : [B.enemy];
  delete B.inimigos; delete B.enemy;   // quem responde por `enemy` daqui pra frente é o getter
  // o campo já nasce com o clima/terreno da rota (regras.CLIMA_DA_ROTA); habilidades de entrada e golpes ainda trocam
  // `zInimigo`: o lado inimigo carrega um Z-Move nesta luta? (treinador sempre; Alfa só às vezes — zmove.inimigoTemZ)
  G.B = ligarInimigos({ caidos: new Set(), campo: novoCampo(climaDasRotasAtivo(G.S) ? G.S?.zone : null), ...B, foco: 0 }, lista);
  G.B.zInimigo = inimigoTemZ(G.B);     // depende de trainer/chefe, que já estão no objeto
  G.mode = 'battle'; G.panel = 'moves';
  for (const E of lista) registrarVisto(E);
  render();
  // a rota tinge a faixa (som.js lê o tema por cenario.climaDaRota, o mesmo que pinta a cena)
  tocarMusica(B.chefe || B.evento || B.lendarios ? 'chefe' : 'batalha', zone()); tocarCry(lista[0].id);
  /* Baixa as formas Mega que podem entrar em campo AGORA, em segundo plano. A batalha não espera: se a rede
     falhar, só não dá pra megaevoluir nesta luta. O que não pode é buscar no meio do turno — foi o cuidado que
     a Mudança de Postura do Aegislash documentou (golpe.trocarPostura). */
  preCarregarMegas([G.S.player, ...lista]).catch(e => console.warn('mega: pré-carga', e));
  preCarregarAshGreninja(ladoJogador()).catch(e => console.warn('vínculo: pré-carga', e));
}
// Habilidades de entrada em campo (Intimidate, Drizzle, Download, Intrepid Sword…): cada um do seu lado age sobre o
// inimigo e o inimigo age sobre todo o seu lado. Na troca de Pokémon do treinador só o que acabou de entrar dispara.
// A regra em si é a `golpe.aoEntrarEmCampo`, a MESMA do multiplayer.
async function intimidar(E, soInimigo = false) {
  const lado = vivos(emCampo()), foes = inimigosEmCampo();
  // entra o grupo inteiro (⚔ Saga) ou só quem acabou de chegar; "oponentes de" olha de que lado o Pokémon está
  const entrantes = soInimigo ? [E] : [...lado, ...foes];
  await aoEntrarEmCampo(entrantes, m => (foes.includes(m) ? lado : foes), CTX);
}
/* Megaevoluir (e a Reversão Primitiva) é a forma ENTRANDO em campo: nos jogos a habilidade da Mega dispara na
   hora — Drought do Mega Charizard Y, Snow Warning do Mega Abomasnow, Intimidate do Mega Mawile. Sem isto o sol
   nunca aparecia e o Solar Beam continuava precisando carregar (relatos #72 e #71). Tera/Dynamax não entram
   aqui: nenhum dos dois troca a habilidade. */
const habilidadeDaNovaForma = m => aoEntrarEmCampo([m], x => (inimigosEmCampo().includes(x) ? vivos(emCampo()) : inimigosEmCampo()), CTX);
/* ---- sair de campo sem desmaiar ----
   Roar, Whirlwind, Dragon Tail, Circle Throw e Red Card empurram alguém pra fora; Wimp Out e Emergency Exit fazem o
   Pokémon sair por conta própria. Nos jogos isso é "trocar de Pokémon" — aqui você é o Pokémon e nunca troca, então
   cada caso vira o evento equivalente que já existe (decisão do usuário, 29/09/2026):
     inimigo selvagem   foge: a luta ACABA, sem XP nem dinheiro
     inimigo de treinador   o treinador manda outro (`aleatorio`: Roar & cia. sorteiam; Wimp Out manda o próximo da fila);
                        o que saiu NÃO conta como derrotado e volta depois se ainda estiver de pé
     Alfa, lendários, chefe da semana   não saem: o golpe falha (não dá pra pular um chefe)
     seu lado           quem levou sai da luta e ela segue sem ele; se era o último em campo, acaba como uma fuga.
                        Wimp Out/Emergency Exit NÃO tiram o seu Pokémon principal (uma habilidade sorteada não pode te
                        expulsar contra a vontade) — só os aliados.
   Devolve true se alguém saiu. Quem chama é o motor do golpe (ctx.forcarSaida), no meio de uma ação: por isso aqui só se
   MARCA o fim (`B.saidaForcada`) e o `turn()` encerra depois, em vez de chamar endBattle no meio do golpe. */
async function forcarSaida(m, { motivo = 'forcada' } = {}) {
  const B = G.B; if (!B) return false;
  const P = G.S.player, T = B.trainer, voluntaria = motivo === 'medo';
  if (B.inimigos.includes(m)) {
    if (B.chefe || B.evento || B.lendarios || m.boss) return false;
    if (T) {
      const i = proximoDoTreinador(T.equipe, T.atual, !voluntaria);
      if (i < 0) return false;                                            // não tem ninguém pra mandar no lugar
      m.vol = freshVol(); m.vol.retirado = true;                          // o turno dele acaba aqui (turn() pula quem tem `retirado`)
      T.atual = i; const novo = T.equipe[i]; novo.vol = freshVol(); novo.vol.recemEntrou = true;
      B.inimigos[B.inimigos.indexOf(m)] = novo; registrarVisto(novo); render();
      await say(`${voluntaria ? `${nm(m)} perde a coragem e sai de campo!` : `${nm(m)} foi arrastado pra fora da luta!`}`, 'status');
      await say(`${esc(T.nome)} envia <b>${esc(fmt(novo.name))}</b> (Nv. ${novo.level})!${novo.shiny ? ' ✨ Um shiny!' : ''}`, 'enc');
      await aplicarArmadilhas(novo, CTX);                                 // Stealth Rock e cia. pegam quem entra
      await anunciarQuedas();
      if (novo.hp > 0) await intimidar(novo, true);                       // se caiu só com as armadilhas, o turn() resolve como vitória
      return true;
    }
    m.vol.retirado = true; B.saidaForcada = 'inimigo';
    await say(voluntaria ? `${nm(m)} foge assustado!` : `${nm(m)} foi afugentado!`, 'status');
    return true;
  }
  if (!ladoJogador().includes(m)) return false;
  if (voluntaria && m === P) return false;                                // nos SEUS principais isso não vale
  const outros = vivos(emCampo()).filter(x => x !== m);
  m.vol.retirado = true;
  if (!outros.length) { B.saidaForcada = 'jogador'; await say(`${nm(m)} foi arrastado pra fora da luta! A luta termina.`, 'status'); return true; }
  await say(`${nm(m)} ${voluntaria ? 'foge da luta!' : 'foi arrastado pra fora da luta!'} ${m === P ? 'Seus aliados seguem sem você.' : 'A luta segue sem ele.'}`, 'status');
  render();
  return true;
}
CTX.forcarSaida = forcarSaida;

// Regenerator / Natural Cure: nos jogos agem ao trocar de Pokémon. Aqui, "sair" é o fim da luta vencida — vale pra todo o
// seu lado que ficou de pé, inclusive quem foi arrastado pra fora no meio (regras.efeitosAoVencer).
async function habilidadesAoVencer() {
  for (const m of vivos(ladoJogador())) {
    const r = efeitosAoVencer(m);
    if (r.cura) { m.hp += r.cura; await say(`${nm(m)} recuperou ${r.cura} HP ao sair da luta. (${fmt(m.ability)})`, 'good'); }
    if (r.limpaStatus) { m.status = null; m.sleep = 0; delete m.vol.toxico; await say(`${nm(m)} se curou do status ao sair da luta. (${fmt(m.ability)})`, 'good'); }
  }
}

/* ⚔ Saga: encontro selvagem em GRUPO (1 a 3, por `regras.tamanhoDoGrupo` — cresce com o avanço da rota).
   Fora dos modos com `grupos`, um só, como sempre. Cada um é sorteado à parte, então o grupo pode ser misto.
   Se a busca de um acompanhante falhar, a luta começa com quem deu: um encontro a menos é melhor que um erro de
   rede impedindo de explorar. */
const modoComGrupos = S => !!DIFICULDADES[dificuldadeDe(S)]?.grupos;
async function grupoSelvagem(z) {
  const i = rotasAtuais().findIndex(x => x.id === z.id);
  const quantos = modoComGrupos(G.S) ? tamanhoDoGrupo(Math.max(0, i)) : 1;
  const lista = [await novoOponente(z)];
  for (let k = 1; k < quantos; k++) {
    try { lista.push(await novoOponente(z)); } catch (e) { console.warn('acompanhante:', e.message); break; }
  }
  return lista;
}
export async function startBattle(z) {
  const lista = await grupoSelvagem(z);
  // no Santuário existe encontro selvagem com lendário/mítico: marca aqui, que é onde se sabe de que pool ele veio
  // (amizade.js deixa a amizade deles subir bem mais devagar)
  for (const M of lista) { const e = z.pool.find(p => p.id === M.id); if (e?.l || e?.m) M.lendario = true; }
  const E = lista[0], entrada = z.pool.find(p => p.id === E.id);
  iniciar({ inimigos: lista, turn: 1, runs: 0 });
  if (lista.length > 1) await say(`Um grupo de <b>${lista.length}</b> aparece: ${lista.map(m => `<b>${esc(fmt(m.name))}</b> (Nv. ${m.level})`).join(', ')}!`, 'enc');
  else await say(`Um <b>${esc(fmt(E.name))}</b> selvagem (Nv. ${E.level}) apareceu!`, 'enc');
  if (entrada?.m) await say('🌟 Um Pokémon mítico! Quase ninguém chega a ver um desses.', 'level');
  for (const M of lista) if (M.shiny) await say(`✨ ${esc(fmt(M.name))} brilha! Um Pokémon shiny.`, 'level');
  await intimidar(E);
}
// Alfa da zona: IVs perfeitos + statsDeChefe (HP ×2, resto ×1,3). Não aceita petisco; dá pra fugir.
export async function startBossBattle(z) {
  const c = z.chefe, max = Object.fromEntries(STATS.map(s => [s, 31]));
  if (offline() && !pokemonEmCache(c.id)) throw erroOffline(`📴 Sem internet: o Alfa de ${z.name} ainda não está salvo neste aparelho. Desafie ele online uma vez, ou baixe o mapa em ⚙ Ajustes → Jogar offline.`);
  const E = await makeMon(await loadPokemon(c.id), c.nivel, { ivs: max });
  E.stats = statsDeChefe(E.stats); E.hp = E.stats.hp; E.chefe = z.id; E.statsChefe = true;
  /* ⚔ Saga: o Alfa não guarda a rota sozinho — vêm dois lacaios da própria rota com ele (sem stats de chefe).
     É o que transforma a luta de Alfa num encontro de RPG: a comitiva tem de decidir se limpa os lacaios ou
     concentra fogo no chefe. O prêmio continua sendo o do Alfa. */
  const lista = [E];
  if (modoComGrupos(G.S)) for (let k = 1; k < GRUPO_MAX; k++) {
    try { lista.push(await novoOponente(z)); } catch (e) { console.warn('lacaio:', e.message); break; }
  }
  iniciar({ inimigos: lista, turn: 1, runs: 0, chefe: z.id });
  await say(`⚔ O chão treme. <b>${esc(fmt(E.name))} Alfa</b> (Nv. ${E.level}) guarda ${esc(z.name)}!`, 'enc');
  if (lista.length > 1) await say(`E não está só: ${lista.slice(1).map(m => `<b>${esc(fmt(m.name))}</b> (Nv. ${m.level})`).join(' e ')} lutam com ele.`, 'enc');
  await say('Alfas são muito mais fortes que o normal: o dobro de HP e 30% a mais em todo o resto.', 'muted');
  if (E.shiny) await say('✨ E ele brilha! Um Alfa shiny.', 'level');
  await intimidar(E);
}
// Luta final do mapa: os lendários da Gen em sequência (mapas.js sequenciaLendaria), um de cada vez, como a equipe
// de um treinador — só que sem bolas. IVs perfeitos; o último (o principal) ainda vem turbinado como Alfa.
// Vencer = fechar a Gen (vencerGen). Dá pra fugir e voltar depois; não aceita petisco.
export async function startLendarios(z) {
  const seq = sequenciaLendaria(z), max = Object.fromEntries(STATS.map(s => [s, 31]));
  if (offline() && seq.some(l => !pokemonEmCache(l.id))) throw erroOffline(`📴 Sem internet: os lendários de ${z.name} ainda não estão salvos neste aparelho. Baixe o mapa em ⚙ Ajustes → Jogar offline.`);
  const equipe = await Promise.all(seq.map(async (l, i) => {
    const M = await makeMon(await loadPokemon(l.id), l.nivel, { ivs: max });
    if (i === seq.length - 1) { M.stats = statsDeChefe(M.stats); M.hp = M.stats.hp; M.statsChefe = true; }
    M.lendario = true; return M;
  }));
  const regiao = dadosDaGen(z.gen).regiao;
  const trainer = { nome: `Lendários de ${regiao}`, equipe, atual: 0, bolas: 0, bola: 'poke-ball', lendarios: true };
  iniciar({ enemy: equipe[0], turn: 1, runs: 0, trainer, chefe: z.id, lendarios: true });
  await say(`⚡ O ar pesa em ${esc(z.name)}. <b>${equipe.length} lendários de ${regiao}</b> se revelam, um depois do outro.`, 'enc');
  await say(`Vença todos pra fechar a Gen ${z.gen}. O último, ${esc(fmt(equipe[equipe.length - 1].name))}, é o mais forte: HP ×2 e +30% no resto.`, 'muted');
  await say(`<b>${esc(fmt(equipe[0].name))}</b> (Nv. ${equipe[0].level}) avança!${equipe[0].shiny ? ' ✨ Shiny!' : ''}`);
  await intimidar(equipe[0]);
}
/* ---- chefe do evento semanal (evento.js / boss.js) ----
   Nível do jogador + 12 (piso 70), IVs perfeitos, HP e atributos muito acima de um Alfa, imune a status, com couraça,
   golpe telegrafado e fases. Sem fuga (o botão avisa), e a tentativa já gasta as 8 horas de espera na hora em que a luta
   começa. Perder no Roguelike/Hardcore é perder como em qualquer luta: a regra do modo vale. */
export async function startEvento(ev) {
  const S = G.S, P = S.player;
  if (offline() && !pokemonEmCache(ev.formaId)) throw erroOffline(`📴 Sem internet: ${ev.nome} ainda não está salvo neste aparelho. Abra o evento online uma vez.`);
  const max = Object.fromEntries(STATS.map(s => [s, 31]));
  const E = await makeMon(await loadPokemon(ev.formaId), nivelDoChefe(P.level), { ivs: max, shiny: false, ability: habilidadeDoChefe(ev.chefe) || undefined });
  // golpes escolhidos a dedo (a lista de nível do Eternamax é curta e fraca demais pra um chefe)
  const golpes = (await Promise.all((ev.golpes || []).map(n => loadMove(`${API}/move/${n}/`).catch(() => null)))).filter(Boolean).map(m => ({ ...m, ppLeft: m.pp }));
  if (golpes.length) E.moves = golpes;
  prepararChefe(E, 1, ev.chefe);
  registrarTentativa();                      // 1 tentativa a cada 8 horas: conta ao começar, vença ou perca
  iniciar({ enemy: E, turn: 1, runs: 0, evento: ev.id });
  aplicarClimaDoChefe(G.B.campo, ev.chefe, CLIMA_TURNOS);   // Groudon/Kyogre Primais: a luta nasce com Sol/Chuva permanentes
  await say(`☄ O céu racha. <b>${esc(ev.nome)}</b> (Nv. ${E.level}) surge, e o ar vibra com energia demais para um Pokémon.`, 'enc');
  await say('EVENTO DA SEMANA: o chefe é imune a status, tem uma couraça de energia e carrega um golpe devastador. Não dá pra fugir.', 'muted');
  await intimidar(E);
}
// vitória sobre o chefe: o Pokémon é seu na Pokédex e nas próximas jornadas, e a badge de evento vem junto
async function vencerEvento() {
  const S = G.S, B = G.B, ev = EVENTOS.find(e => e.id === B.evento); if (!ev) { endBattle(); return; }
  endBattle();
  const r = registrarVitoriaDeEvento(ev, idDaSemana(agoraDoEvento()));
  await say(`🏆 <b>${esc(ev.nome)} foi derrotado!</b>`, 'level');
  if (r.semanaNova) {
    S.money += ev.recompensa.dinheiro || 0;
    for (const [k, n] of Object.entries(ev.recompensa.itens || {})) S.bag[k] = (S.bag[k] || 0) + n;
    await say(`Prêmio da semana: ₽${ev.recompensa.dinheiro || 0}${Object.entries(ev.recompensa.itens || {}).map(([k, n]) => `, ${n}× ${ITEMS[k]?.name || k}`).join('')}.`, 'level');
  } else await say('Você já tinha vencido este chefe nesta semana: o prêmio só sai uma vez por semana.', 'muted');
  if (r.primeiraVez) {
    await say(`🌌 Insígnia <b>${esc(ev.badge.nome)}</b> conquistada — título “${esc(ev.badge.titulo)}”. Escolha qual insígnia mostrar ao lado do seu nome na tela 👤 Conta.`, 'level');
    await say(`🔓 <b>${esc(fmt(ev.especie))}</b> está liberado na Pokédex e pra começar novas jornadas!`, 'level');
  }
  if (usuario()) sincronizar().catch(e => console.warn('sincronizar (evento)', e));   // sobe a conquista pra nuvem já
  save();
}
// Treinador caçador: 1–3 Pokémon da zona (mais na zona alta), algumas bolas, e quer te capturar
export async function startTrainerBattle(z) {
  const P = G.S.player;
  const nivelRef = z.max;
  const n = rand(1, Math.min(3, 1 + Math.floor(nivelRef / 15)));
  const [equipe, especie] = await Promise.all([
    Promise.all(Array.from({ length: n }, () => novoOponenteTreinador(z))),
    loadSpecies(P.data.speciesUrl).catch(() => ({ captureRate: 45 })) // offline sem cache: taxa média
  ]);
  const trainer = { nome: `${pick(CLASSES_TREINADOR)} ${pick(NOMES_TREINADOR)}`, equipe, atual: 0, bolas: rand(2, 4), bola: bolaPorNivel(Math.max(...equipe.map(m => m.level))) };
  iniciar({ enemy: equipe[0], turn: 1, runs: 0, trainer, taxaCaptura: especie.captureRate ?? 45 });
  await say(`⚠ <b>${esc(trainer.nome)}</b> avistou você e quer te capturar! (${n} Pokémon, ${trainer.bolas}× ${BOLAS[trainer.bola].nome})`, 'enc');
  await say(`${esc(trainer.nome)} envia <b>${esc(fmt(equipe[0].name))}</b> (Nv. ${equipe[0].level})!${equipe[0].shiny ? ' ✨ Um shiny!' : ''}`);
  await intimidar(equipe[0]);
}

/* ---- turno ---- */
// B.vez = quem está agindo agora — só pra barra de turno e o destaque da placa
async function vez(v) { G.B.vez = v; render(); }
// o lado inimigo: em batalha de treinador, ele pode gastar a vez lançando bola em vez do Pokémon dele atacar
function acaoDoInimigo(E, P) {
  const T = G.B.trainer;
  if (T && treinadorLancaBola(P.hp, P.stats.hp, T.bolas)) return { bola: true };
  return { move: chooseEnemyMove(E) };
}
async function lancarBola(P) {
  const B = G.B, T = B.trainer, bola = BOLAS[T.bola];
  T.bolas--;
  await say(`${esc(T.nome)} lançou uma <b>${bola.nome}</b> em você!`, 'status');
  const real = balancosDaCaptura(valorCaptura(P.hp, P.stats.hp, B.taxaCaptura, bola.mult, P.status));
  const regra = DIFICULDADES[dificuldadeDe(G.S)];
  const balancos = regra.semCaptura ? Math.min(real, 3) : real; // Fácil/Médio: nunca fecha
  for (let i = 0; i < Math.min(balancos, 3); i++) await say('A bola balança...', 'muted');
  if (balancos >= 4) { B.capturado = true; await say('Clique! A bola se fechou. Você foi capturado...', 'hit'); return; }
  if (regra.semCaptura && real >= 4) await say(`Por pouco! Você arrebenta a bola no último segundo. (modo ${regra.nome}: você sempre escapa)`, 'good');
  else await say('Você se debate e escapa da bola!', 'good');
}
// id do destaque de quem age: 'p' você, 'a0'/'a1' aliados
const idVez = m => m === G.S.player ? 'p' : 'a' + G.S.aliados.indexOf(m);
// aliado que acabou de cair: anuncia uma vez só (B.caidos guarda quem já foi anunciado nesta batalha)
async function anunciarQuedas() {
  // inimigo que caiu: anuncia uma vez. A RECOMPENSA (XP, EVs, dinheiro) sai toda no fim da luta, em `win`
  for (const E of (G.B?.inimigos || [])) if (E.hp <= 0 && !G.B.caidos.has(E)) {
    G.B.caidos.add(E);
    await say(`${nm(E)} desmaiou!`, 'good');
  }
  // no chefe de evento ninguém é perdido pra sempre (evento.EVENTO_SEM_PERMADEATH): a luta é difícil, não um risco à run inteira
  const permadeath = DIFICULDADES[dificuldadeDe(G.S)].permadeath && !(EVENTO_SEM_PERMADEATH && G.B?.evento);
  for (const A of [...(G.S.aliados || [])]) if (A.hp <= 0 && !G.B.caidos.has(A)) {
    G.B.caidos.add(A);
    if (!permadeath) { await say(`${nm(A)} desmaiou!`, 'hit'); continue; }
    // Roguelike: aliado que cai é perdido na hora (sai da equipe; nem Revive nem Centro trazem de volta)
    const nome = nm(A);
    G.S.aliados.splice(G.S.aliados.indexOf(A), 1); G.abertos.clear();
    G.S.aliadosPerdidos = (G.S.aliadosPerdidos || 0) + 1;   // conta pra badge "Cemitério de parceiros" (badges.js)
    /* `B.vez` guarda quem está agindo como 'a<índice em G.S.aliados>' — e o render lê esse índice de volta.
       Tirar o aliado da equipe aqui faz o índice apontar pro vazio, e o render seguinte quebrava a rodada
       inteira (`Cannot read properties of undefined`, com o turno já perdido). Acontecia de verdade com
       Self-Destruct no Roguelike: o aliado se explode, é perdido na hora, e o índice morre junto. */
    G.B.vez = null;
    render();
    await say(`${nome} desmaiou... e não vai voltar. Aliado perdido pra sempre.`, 'hit');
  }
}
/* ---- Mega Evolução (mega.js) ----
   Só VOCÊ megaevolui — aliado nunca, mesmo com a espécie liberada (decisão do usuário).
   Botão ⚡: não gasta o turno (você megaevolui e ataca no mesmo turno), como nos jogos. Com duas formas
   (Charizard, Mewtwo), pergunta qual. */
export async function usarMega() {
  const B = G.B; if (G.busy || !B) return;
  const formas = megasDoJogador(); if (!formas.length) return;
  G.busy = true; render();
  try {
    let f = formas[0];
    if (formas.length > 1) {
      const i = await ask(`Qual forma?`, [...formas.map((x, j) => ({ label: x.nome, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
      if (i < 0) return;
      f = formas[i];
    }
    const P = G.S.player, nome = await megaevoluir(P, f);
    if (!nome) { await say('A energia não respondeu agora (faltou um dado da PokéAPI). Tente de novo.', 'muted'); return; }
    B.megaUsada = true;
    render();
    await say(`<b>${esc(rotulo(P))} ${verboDaForma(f)}!</b> ${esc(f.nome)} entra em campo.`, 'level');
    await say(`Habilidade agora: <b>${esc(fmt(P.ability))}</b>.`, 'status');
    await habilidadeDaNovaForma(P);
  } catch (e) { console.error(e); log('Não deu pra megaevoluir: ' + esc(e.message), 'hit'); }
  finally { G.busy = false; render(); save(); }
}
/* Botão 💎: mesma economia da Mega — uma por batalha e NÃO gasta o turno. A escolha do tipo é sua, entre os
   que você já conquistou (200 derrotados de cada). Dá pra usar Tera e Mega na mesma luta: são conquistas
   diferentes, cada uma com o seu custo de longo prazo. */
export async function usarTera() {
  const B = G.B; if (G.busy || !B) return;
  const tipos = terasDisponiveis(); if (!tipos.length) return;
  G.busy = true; render();
  try {
    const i = await ask('Terastalizar em qual tipo?', [
      ...tipos.map((t, j) => ({ label: TYPE_PT[t] || t, value: j })), { label: 'Cancelar', value: -1, ghost: true }]);
    if (i < 0) return;
    const P = G.S.player, tipo = tipos[i];
    teracristalizar(P, tipo);
    B.teraUsada = true;
    render();
    await say(`<b>${esc(rotulo(P))} TERASTALIZOU!</b> Agora é do tipo ${esc(TYPE_PT[tipo] || tipo)} — e só dele.`, 'level');
  } catch (e) { console.error(e); log('Não deu pra terastalizar: ' + esc(e.message), 'hit'); }
  finally { G.busy = false; render(); save(); }
}

/* Botão 🔴: como a Mega e a Tera, não gasta o turno. Dura TURNOS_DYNAMAX turnos e encolhe sozinho.
   É a única gimmick sem item — ver o cabeçalho de dynamax.js pro porquê. */
export async function usarGigantamax() {
  const B = G.B; if (G.busy || !B || !podeGigantamax()) return;
  G.busy = true; render();
  try {
    const P = G.S.player;
    gigantamaxar(P);
    B.gmaxUsado = true;
    render();
    await say(`<b>${esc(rotulo(P))} GIGANTAMAXOU!</b> O HP dobrou e os golpes viram Max por ${TURNOS_DYNAMAX} turnos.`, 'level');
  } catch (e) { console.error(e); log('Não deu pra gigantamaxar: ' + esc(e.message), 'hit'); }
  finally { G.busy = false; render(); save(); }
}

/* Botão 🌀: diferente da Mega e da Tera, o Z-Move **é** o seu turno — ele não transforma, converte um golpe
   seu num golpe muito mais forte, uma vez por batalha. Por isso ele termina chamando `turn` com o golpe
   escolhido, e não resolve nada por conta própria. */
export async function usarZ() {
  const B = G.B; if (G.busy || !B) return;
  const opcoes = zDisponiveis(); if (!opcoes.length) return;
  const i = await ask('Qual golpe vira Z-Move? <small>Gasta o seu turno e o PP do golpe.</small>', [
    ...opcoes.map(({ g }, j) => ({ label: `${fmt(g.name)} — poder ${g.power ?? '—'} → ${poderZ(g.power)}`, value: j })),
    { label: 'Cancelar', value: -1, ghost: true }]);
  if (i < 0) return;
  return turn({ type: 'move', idx: opcoes[i].i, z: true });
}

/* O inimigo vira quando cai a METADE do HP — é a segunda fase da luta, não um susto no primeiro turno. Só Alfa,
   lendário e treinador (decisão do usuário: selvagem de rota continua sendo selvagem de rota).
   Não precisa de conquista nenhuma: a conquista é o que libera a SUA Mega, não a do adversário. */
/* UMA virada por luta, de qualquer tipo (Mega, Tera ou Gigantamax): duas transformações no mesmo momento virariam o
   combate de cabeça pra baixo, e quem joga não teria como reagir a nenhuma das duas. */
const jaViradou = B => !!(B.megaInimigoUsada || B.teraInimigoUsada || B.gmaxInimigoUsado);
/* Quem não tem Mega (nível baixo ou espécie sem forma) vira Tera — e, se for de TREINADOR, pode virar Gigantamax no
   lugar. O sorteio é feito uma vez por luta e guardado, senão as duas checagens (Tera e Gigantamax, uma logo depois da
   outra) decidiriam cada uma por si e a mais "sortuda" sempre ganharia. */
const viradaSorteada = B => B.viradaInimigo ||= (inimigoPodeGmax(B) && Math.random() < 0.5 ? 'gmax' : 'tera');
async function megaDoInimigo() {
  const B = G.B, E = B?.enemy;
  if (!B || !E || jaViradou(B) || !inimigoPodeMega(B) || E.hp <= 0) return;
  if (!inimigoMegaLiberada(E)) return;   // Mega de inimigo só de nível 40 em diante (não marca "usada": o Tera ainda pode virar)
  if (E.hp > E.stats.hp * HP_MEGA_INIMIGO) return;
  const f = megasDisponiveis(E, { jaUsou: false, liberada: () => true, ignorarPedra: true })[0];
  if (!f) return;   // sem forma Mega (a maioria dos Pokémon): não marca "usada" — o Tera/Gigantamax ainda pode virar
  B.megaInimigoUsada = true;
  const nome = await megaevoluir(E, f);
  if (!nome) return;
  render();
  await say(`<b>${esc(rotulo(E))} ${verboDaForma(f)}!</b> ${esc(f.nome)} — a luta mudou de patamar.`, 'hit');
  await habilidadeDaNovaForma(E);
}

/* Tera do inimigo: mesmas lutas da Mega (Alfa, lendário e treinador) e o mesmo gatilho de metade do HP —
   decisão do usuário, por coerência entre as duas.
   **Uma virada por luta**: se ele já megaevoluiu, não terastaliza também. Duas transformações no mesmo momento
   viraria o combate de cabeça pra baixo de uma vez só, e quem joga não teria como reagir a nenhuma das duas.
   O tipo é SORTEADO entre os 18, podendo ser um dos dele ou não (regras.sortearTipoTera): a graça é o fator
   surpresa — antes era sempre o 1º tipo dele, previsível. */
async function teraDoInimigo() {
  const B = G.B, E = B?.enemy;
  if (!B || !E || jaViradou(B) || !inimigoPodeMega(B) || E.hp <= 0) return;
  if (!inimigoTeraGmaxLiberado(E)) return;   // só em rotas de nível 30+
  if (E.hp > E.stats.hp * HP_MEGA_INIMIGO) return;
  if (viradaSorteada(B) !== 'tera') return;
  const tipo = sortearTipoTera();
  B.teraInimigoUsada = true;
  if (!tipo) return;
  teracristalizar(E, tipo);
  render();
  await say(`<b>${esc(rotulo(E))} TERASTALIZOU!</b> Agora é ${esc(TYPE_PT[tipo] || tipo)} puro.`, 'hit');
}

/* Gigantamax do inimigo: só Pokémon de TREINADOR (dynamax.inimigoPodeGmax), no mesmo gatilho de metade do HP. É a
   mesma mecânica do jogador — HP dobrado e golpes Max por TURNOS_DYNAMAX turnos; `passarDynamax(E)` encolhe no fim
   da rodada (em `turn`). O HP proporcional volta sozinho, então a luta não "cura" o inimigo ao terminar. */
async function gmaxDoInimigo() {
  const B = G.B, E = B?.enemy;
  if (!B || !E || jaViradou(B) || !inimigoPodeGmax(B) || E.hp <= 0 || E.dyna) return;
  if (!inimigoTeraGmaxLiberado(E)) return;   // só em rotas de nível 30+
  if (E.hp > E.stats.hp * HP_MEGA_INIMIGO) return;
  if (viradaSorteada(B) !== 'gmax') return;
  B.gmaxInimigoUsado = true;
  gigantamaxar(E);
  render();
  await say(`<b>${esc(rotulo(E))} GIGANTAMAXOU!</b> O HP dobrou e os golpes viram Max por ${TURNOS_DYNAMAX} turnos.`, 'hit');
}

export async function turn(action) {
  if (G.busy || !G.B) return;
  G.busy = true;
  const B = G.B, S = G.S, P = S.player;
  /* ⚔ Saga: o alvo do seu golpe vem na ação (`action.alvo` = índice em B.inimigos, escolhido na cena). Sem ele
     (todo modo de um inimigo só, e a IA dos aliados) vale o foco. O foco também é o que os aliados atacam:
     concentrar fogo é a decisão tática do turno, e dividir dano por conta própria desfaria a escolha do jogador. */
  if (action.alvo != null && B.inimigos[action.alvo]?.hp > 0) B.foco = Number(action.alvo);
  let E = B.enemy;   // muda no meio do turno se o treinador manda outro (Roar…): sempre reler de B.enemy depois de uma ação
  // item sem efeito cancela o turno sem avançar B.turn — não repetir o divisor na próxima tentativa
  if (B.turnoNoLog !== B.turn) { log(`Turno ${B.turn}`, 'turno'); B.turnoNoLog = B.turn; }
  try {
    // 1) sua ação que não é golpe resolve antes de tudo (fuga, item, petisco) — como item nos jogos
    let pm = null;
    if (action.type === 'run' && B.evento) {
      await say('Não dá pra fugir do chefe da semana!', 'hit'); return;   // não gasta o turno
    }
    if (action.type === 'run') {
      B.runs++;
      await vez('p');
      const cl = climaDe(B.campo); // fugir também sente o clima (Swift Swim e cia.)
      // Magnet Pull (só Aço), Shadow Tag (todo mundo) e Arena Trap (só quem está no chão)
      const preso = hab(E).prendeTipo?.some(t => tiposDefensivos(P).includes(t))
        || hab(E).prendeQualquer === true || (hab(E).prendeQualquer === 'chao' && noChao(P)) || !!P.vol.preso;   // habilidade OU golpe (Mean Look, Block, Spider Web)
      if (consegueFugir(effStat(P, 'speed', false, true, cl), effStat(E, 'speed', false, true, cl), B.runs, P.ability, undefined, preso)) {
        await say('Você fugiu em segurança!'); endBattle(); return;
      }
      await say('Não conseguiu fugir!');
    } else if (action.type === 'item') {
      await vez('p');
      if (!(await useItem(action.id, true))) return;
      G.panel = 'moves';
    } else if (action.type === 'oferecer') {
      await vez('p');
      const r = await oferecer(action.id, E);
      if (r === 'cancelado') return;
      if (r === 'fim') { endBattle(); return; }
      G.panel = 'moves';
    } else if (action.type === 'passar') { /* você foi tirado da luta: só assiste os aliados */ }
    else pm = action.idx === -1 ? STRUGGLE : P.moves[action.idx];
    if (P.vol.retirado) pm = null;
    if (pm && pm !== STRUGGLE && !golpeTravado(P)) pm = golpeForcado(P) || pm;   // Encore: a escolha vira o golpe repetido — vale já na prioridade do turno
    /* Z-Move: liga a marca no `vol` (regras.calcDamage converte o poder) e gasta a vez da batalha. O flag é
       desligado no `finally` deste turno — um Z que "vazasse" pro turno seguinte dobraria o dano de graça. */
    if (action.z && pm) { P.vol.zAtivo = true; B.zUsado = true; await say(`<b>${esc(rotulo(P))} concentra a energia Z!</b>`, 'level'); }

    // 2) golpes do turno: você (se escolheu golpe), cada aliado em pé e o lado inimigo, por prioridade e velocidade.
    //    Bola do treinador é item: prioridade máxima, sai antes de qualquer golpe.
    const acoes = [], clima = climaDe(B.campo), terreno = terrenoDe(B.campo); // clima e terreno entram na velocidade
    // Vento de Cauda (Tailwind) dobra a velocidade do lado dele (regras.multVento)
    const vel = m => effStat(m, 'speed', false, true, clima, terreno) * multVento(B.campo.lados?.[CTX.ladoDe(m)]);
    if (pm) acoes.push({ quem: P, golpe: pm, prio: prioridadeEfetiva(P, pm), vel: vel(P), rapido: ativouQuickClaw(P), lento: sempreUltimo(P) });
    /* Aliados: o PLANO que você deu neste turno (⚔ Saga, `B.planos`) manda; sem plano, vale a Ordem dele
       (golpeDoAliado). O plano passa pelas mesmas travas — `golpesPermitidos` é a única fonte, e um golpe que
       virou proibido depois de você escolher (o inimigo mais rápido te provocou) não pode escapar por aqui. */
    for (const A of vivos(emCampo()).filter(m => m !== P)) {
      const chave = 'a' + S.aliados.indexOf(A), plano = B.planos?.[chave];
      let g = golpeDoPlano(plano, A.moves, golpesPermitidos(A), STRUGGLE);
      // o alvo do plano vale pro FOCO só se ele ainda está de pé (o grupo muda no meio do turno)
      if (g && plano.alvo != null && B.inimigos[plano.alvo]?.hp > 0) B.foco = Number(plano.alvo);
      if (!g) {
        const d = golpeDoAliado(A.ordem || 'livre', golpesPermitidos(A), A.data.types, (E || B.inimigos[0]).data.types);   // já vem sem o que Choice/Taunt/Encore/Disable/Torment proíbem
        if (d.parado) { acoes.push({ quem: A, parado: d.parado, prio: 0, vel: vel(A) }); continue; }
        g = d.golpe || STRUGGLE;
      }
      acoes.push({ quem: A, golpe: g, prio: prioridadeEfetiva(A, g), vel: vel(A), rapido: ativouQuickClaw(A), lento: sempreUltimo(A) });
    }
    // cada inimigo de pé age (⚔ Saga: o grupo inteiro; nos outros modos a lista tem um só)
    for (const F of inimigosEmCampo()) {
      const ea = acaoDoInimigo(F, P);
      acoes.push(ea.bola ? { quem: F, bola: true, prio: 99, vel: 0 }
        : { quem: F, golpe: ea.move, prio: prioridadeEfetiva(F, ea.move), vel: vel(F), rapido: ativouQuickClaw(F), lento: sempreUltimo(F) });
    }
    // o que cada um vai usar neste turno (Sucker Punch olha isso: só funciona contra quem vai atacar). Golpe travado (carga/fúria) vale.
    for (const m of [...ladoJogador(), ...B.inimigos]) delete m.vol.golpeEscolhido;
    for (const a of acoes) if (a.golpe) a.quem.vol.golpeEscolhido = golpeTravado(a.quem) || a.golpe;
    const ordem = ordenarAcoes(acoes);
    const posicao = m => ordem.findIndex(a => a.quem === m); // -1 = não age neste turno
    for (let i = 0; i < ordem.length; i++) {
      const a = ordem[i];
      /* O foco pode ter caído no meio do turno (⚔ Saga): passa pro próximo inimigo de pé, senão o resto do
         turno bate num corpo. A luta só termina quando o GRUPO inteiro cai. */
      if (B.enemy?.hp <= 0) { const j = B.inimigos.findIndex(m => m.hp > 0 && !m.vol?.retirado); if (j >= 0) B.foco = j; }
      E = B.enemy;
      if (P.hp <= 0 || grupoInimigoCaiu() || B.capturado || B.saidaForcada) break;
      if (a.quem.hp <= 0 || a.quem.vol?.retirado) continue;   // caiu, ou foi tirado da luta antes de agir
      if (a.bola) { await vez('t'); await lancarBola(P); continue; }
      if (a.parado) { await vez(idVez(a.quem)); await say(`${nm(a.quem)} ${a.parado}`, 'muted'); continue; }
      if (B.inimigos.includes(a.quem)) {
        const F = a.quem;
        /* ⚔ Saga (flag `ameaca`): o inimigo mira quem tem mais AMEAÇA, não um alvo aleatório — é o que faz um
           Guardião existir (regras.alvoPorAmeaca). Nos outros modos segue sorteando, como sempre foi.
           Lê a FLAG do modo, nunca o nome dele. */
        const emPe = vivos(emCampo());
        const alvo = DIFICULDADES[dificuldadeDe(S)]?.ameaca ? alvoPorAmeaca(emPe) : pick(emPe);
        if (!alvo) continue;   // ninguém em campo pra apanhar (você foi tirado e os aliados caíram)
        // recuo (flinch) só vale em quem ainda não agiu neste turno
        await vez('e');
        /* Z-Move do inimigo (zmove.inimigoUsaZAgora): só treinador e Alfa, uma vez por luta. Mesma marca do seu Z
           (`vol.zAtivo`, lida em calcDamage), apagada logo depois do golpe — um Z que vazasse pro turno seguinte
           dobraria o dano de graça. */
        if (inimigoUsaZAgora(B, a.golpe)) {
          B.zInimigoUsado = true; F.vol.zAtivo = true;
          await say(`<b>${esc(rotulo(F))} concentra a energia Z!</b>`, 'hit');
        }
        // quem AGE é `F` (pode não ser o foco: no grupo, os três atacam no mesmo turno)
        try { await useMove(F, alvo, a.golpe, posicao(alvo) === -1 || i < posicao(alvo)); }
        finally { delete F.vol.zAtivo; }
      } else {
        // você e os aliados batem no FOCO — o alvo que você escolheu neste turno
        const alvoMeu = E;
        const hpAntes = alvoMeu.hp;
        await vez(idVez(a.quem)); await useMove(a.quem, alvoMeu, a.golpe, i < posicao(alvoMeu));
        // quem deu o golpe final (e com qual golpe): é o que as conquistas de conta contam — e elas só contam o
        // que VOCÊ fez, não o que o aliado fez (conquistas.js / registrarAbate)
        if (hpAntes > 0 && alvoMeu.hp <= 0) B.abate = { porMim: a.quem === P, golpe: a.golpe };
        // dano acumulado da conta (badge "Potencial máximo"): aqui é o ÚNICO ponto que já tem o HP antes e depois
        // de um golpe SEU. Veneno, armadilha e recuo não entram — a badge é sobre o que você bate.
        if (a.quem === P) registrarDano(S, hpAntes - alvoMeu.hp, dificuldadeDe(S));
      }
      await anunciarQuedas(); // dano do inimigo ou recuo do próprio golpe
      // o chefe vira na metade do HP: checado depois de cada ação, pra acontecer no golpe que derrubou a barra
      try { await megaDoInimigo(); await teraDoInimigo(); await gmaxDoInimigo(); } catch (e) { console.error('virada do inimigo', e); }
    }
    E = B.enemy;
    if (B.capturado) { await serCapturado(); return; }
    if (B.saidaForcada) { endBattle(); return; }   // selvagem afugentado, ou o último do seu lado arrastado: acaba como uma fuga, sem XP nem penalidade
    // veneno, clima e fim de rodada valem pro GRUPO inimigo inteiro (⚔ Saga), não só pra quem está em foco
    if (P.hp > 0 && !grupoInimigoCaiu()) { await vez('fim'); for (const m of [...vivos(emCampo()), ...inimigosEmCampo()]) await residual(m); await passarClima(B.campo, CTX); await passarTerreno(B.campo, CTX); await passarLados(B.campo, CTX); await anunciarQuedas(); }
    for (const m of [...ladoJogador(), ...B.inimigos]) fimDaRodada(m);  // recuo, Protect e Endure valem só um turno
    // o gigante encolhe no fim da rodada; narrar é importante, senão o HP "some" sem explicação
    for (const m of [...ladoJogador(), ...B.inimigos]) if (passarDynamax(m) === 'acabou') { render(); await say(`${nm(m)} voltou ao tamanho normal.`, 'status'); }
    B.turn++;
    if (P.hp <= 0) await lose();
    else if (grupoInimigoCaiu()) await win();
    else if (!vivos(emCampo()).length) { await say('Não sobrou ninguém em campo: a luta termina.', 'muted'); endBattle(); }   // você foi tirado e os aliados caíram
  } catch (e) {
    console.error(e); log('Algo deu errado neste turno: ' + esc(e.message), 'hit');
  } finally {
    B.vez = null;
    G.alvoDe = null;       // alvo pendente é da ESCOLHA, não do turno: some ao resolver (senão o próximo golpe herdaria)
    G.comandando = 'p';    // o painel volta pros seus golpes
    B.planos = {};         // plano é DO TURNO: um golpe comandado não se repete sozinho na rodada seguinte
    delete P.vol.zAtivo;   // vale só pelo turno em que foi acionado (ver o `action.z` acima)
    // missões no fim de TODO turno (inclusive fuga/amizade que saem cedo com `return`); G.S some no fim de jogo do Hardcore
    try { await verificarMissoes(); } catch (e) { console.error(e); }
    if (!G.B && G.S) await retomarEvolucoes(); // batalha acabou: evolução pendente por falta de rede tenta de novo
    G.busy = false; render(); save();
  }
}

/* ---- fim de batalha ---- */
/* O GRUPO inimigo caiu (⚔ Saga: pode ser mais de um; nos outros modos, o de sempre).
   A recompensa é por inimigo derrotado e sai toda AQUI, no fim da luta — como em todo RPG de turno. Dar XP na
   hora de cada queda faria o jogador subir de nível no meio do próprio turno, com evolução e aprendizado de
   golpe interrompendo a rodada pela metade. */
async function win() {
  const S = G.S, B = G.B, T = B.trainer, P = S.player;
  const caidos = B.inimigos.filter(m => m.hp <= 0 && !m.vol?.retirado);
  const E = caidos[0] || B.inimigos[0];        // o "principal" da luta: é dele que saem chefe/registro/abate
  const mult = multShiny(S); // segredo do brilho: shiny ganha XP e dinheiro em dobro (regras.js)
  const xp = caidos.reduce((t, F) => t + xpPorVitoria(F, !!T), 0) * mult;
  const gained = [], fora = !!P.vol?.retirado;   // arrastado pra fora no meio da luta: não lutou até o fim, sem XP nem EVs
  if (!fora) for (const F of caidos) for (const [s, add] of ganhoDeEVs(P.evs, F.data.effort)) { P.evs[s] += add; gained.push(`+${add} EV de ${STAT_PT[s]}`); }
  const money = T ? 0 : caidos.reduce((t, F) => t + F.level * rand(8, 14), 0) * mult; // de treinador, o dinheiro vem todo no prêmio final
  S.money += money; S.wins = (S.wins || 0) + 1;
  S.vitoriasDesdeCentro = (S.vitoriasDesdeCentro || 0) + 1; // desconto do Centro no modo Médio
  // E.id vira o id da forma Mega enquanto ela está ativa (mega.aplicarForma); se ele desmaiou já mega-evoluído
  // e nada desfaz isso (o inimigo é descartado, não salvo), registrar E.id direto gravaria pra sempre o id da
  // Mega em registro.ids — a tela de desbloqueio do Roguelike passou a mostrar "Alakazam #10037" (a Mega).
  // cada um do grupo conta na Pokédex e nas missões, não só o principal
  for (const F of caidos) registrar(S, 'derrotados', F.data.speciesName, F.mega?.antes?.id ?? F.id);
  /* Conquistas da conta (conquistas.js). A espécie conta sempre — o aliado lutando com você também constrói a sua
     Pedra Mega. Tipo e golpe só quando o golpe final foi SEU (`B.abate.porMim`, preenchido no laço do turno).
     Sem `B.abate` o inimigo caiu de veneno/armadilha/recuo: a equipe venceu, mas não há golpe pra creditar. */
  registrarAbate(S, { porMim: !!B.abate?.porMim, tiposDoAlvo: E.data.types, minhaEspecie: P.data.speciesName, golpe: B.abate?.golpe, modo: dificuldadeDe(S) });
  B.abate = null;
  if (fora) await say(`${nm(P)} estava fora da luta e não ganhou XP.${money ? ` Vocês acharam ₽${money}.` : ''}`, 'muted');
  else { await say(`${nm(P)} ganhou ${xp} de XP${money ? ` e ₽${money}` : ''}.${gained.length ? ' ' + gained.join(', ') + '.' : ''}`); await gainExp(xp); }
  // aliados em pé ganham o mesmo XP e EVs (como o Exp. Share dos jogos novos)
  for (const A of vivos(emCampo()).filter(m => m !== P)) { // quem está descansando não ganha XP
    for (const F of caidos) for (const [s, add] of ganhoDeEVs(A.evs, F.data.effort)) A.evs[s] += add;
    await say(`${nm(A)} ganhou ${xp} de XP.`, 'muted');
    await gainExpAliado(A, xp);
  }
  const proximo = T ? proximoDoTreinador(T.equipe, T.atual) : -1;   // o primeiro de pé (Roar pode ter deixado um pra trás)
  if (T && proximo >= 0) {
    /* Treinador e lendários continuam vindo UM POR VEZ, inclusive no ⚔ Saga: o grupo é dos encontros selvagens e
       do Alfa (ver startBattle/startBossBattle). Trocar a fila do treinador por grupo mudaria o balanceamento de
       todos os modos, e não é o que foi pedido. A lista do lado inimigo passa a ter o que acabou de entrar. */
    T.atual = proximo;
    B.inimigos = [T.equipe[T.atual]]; B.foco = 0;
    B.enemy.vol = freshVol(); B.enemy.vol.recemEntrou = true; registrarVisto(B.enemy); render();
    await say(T.lendarios ? `Outro lendário surge: <b>${esc(fmt(B.enemy.name))}</b> (Nv. ${B.enemy.level})!${B.enemy.shiny ? ' ✨ Shiny!' : ''}`
      : `${esc(T.nome)} envia <b>${esc(fmt(B.enemy.name))}</b> (Nv. ${B.enemy.level})!${B.enemy.shiny ? ' ✨ Um shiny!' : ''}`, 'enc');
    await aplicarArmadilhas(B.enemy, CTX); // Stealth Rock e cia. pegam quem entra
    await anunciarQuedas();
    // caiu só com as armadilhas: resolve como qualquer derrota (XP e o próximo da fila)
    if (B.enemy.hp <= 0) { await say(`${nm(B.enemy)} caiu antes mesmo de lutar!`, 'hit'); return win(); }
    await intimidar(B.enemy, true);
    return;
  }
  await habilidadesAoVencer();   // a luta acabou de verdade (não é o próximo da fila): Regenerator e Natural Cure
  if (B.lendarios) { await vencerGen(); return; }
  if (B.evento) { await vencerEvento(); return; }
  if (B.chefe && !S.chefes?.[B.chefe]) {
    const premio = premioChefe(E.level) * mult, z = ZONES.find(x => x.id === B.chefe), evo = pick(ITENS_EVO_ACHADOS);
    (S.chefes ||= {})[B.chefe] = true;
    S.money += premio; S.bag['rare-candy'] = (S.bag['rare-candy'] || 0) + 1; S.bag[evo] = (S.bag[evo] || 0) + 1;
    await say(`🏆 Você derrotou o Alfa de ${esc(z?.name || B.chefe)}! Prêmio: ₽${premio}, 1 Rare Candy e 1 ${ITEMS[evo].name} (item de evolução).`, 'level');
  }
  await depoisDaVitoria();
  if (T) {
    const premio = premioTreinador(T.equipe) * mult;
    S.money += premio; S.treinadoresVencidos = (S.treinadoresVencidos || 0) + 1;
    await say(`Você derrotou ${esc(T.nome)}! Na fuga, deixou cair ₽${premio}.`, 'good');
  }
  endBattle();
}
// Fim de uma vitória (antes de endBattle zerar m.vol): +1 de vínculo pra quem lutou, e evoluções que dependem do
// que aconteceu NESTA batalha (evolucao.js 'pos-batalha': Sirfetch'd com 3 críticos, Runerigus que aguentou 49 de dano)
async function depoisDaVitoria() {
  for (const M of vivos(emCampo())) {
    ganharFelicidade(M, 1);
    if ((M.vol?.criticos || 0) >= 3 || (M.vol?.danoSofrido || 0) >= 49) await checkEvolution(M, { gatilho: 'pos-batalha' });
  }
}
// evolução que a rede deixou pendente tenta de novo assim que a batalha termina
const retomarEvolucoes = () => verificarEvolucoesPendentes().catch(e => console.error(e));
// Venceu os lendários: a Gen está fechada (S.gensVencidas). Modo com `fimNaGen` (Roguelike) = a run termina em
// vitória e o mapa seguinte libera pras próximas runs; nos outros, você escolhe o próximo mapa (telaEscolherGen).
async function vencerGen() {
  const S = G.S, B = G.B, g = genDe(S), regiao = dadosDaGen(g).regiao, premio = premioChefe(B.enemy.level) * 3;
  (S.chefes ||= {})[B.chefe] = true;
  if (!(S.gensVencidas ||= []).includes(g)) S.gensVencidas.push(g);
  S.money += premio;
  await say(`🏆 Você venceu os lendários de ${regiao}! A Gen ${g} está fechada. Prêmio: ₽${premio}.`, 'level');
  endBattle();
  if (DIFICULDADES[dificuldadeDe(S)].fimNaGen) {
    // A vitória fica GRAVADA no save agora (não no fim da run): quem escolhe seguir no Santuário e morre lá termina
    // em derrota, mas a Gen vencida continua contando pro desbloqueio do mapa seguinte (mapas.gensLiberadasRoguelike).
    S.genVencida = g;
    await say(g < TOTAL_GENS ? `Vitória garantida: o mapa da Gen ${g + 1} está liberado pras próximas runs.` : 'Vitória garantida: você fechou a última Gen!', 'level');
    const santuario = rotasDaGen(g).find(z => z.posVitoria);
    const seguir = santuario && await ask(
      `O 🏛 ${esc(santuario.name)} acabou de abrir: lá vive a Gen ${g} inteira — os iniciais, os lendários, os míticos e as formas regionais.<br>Encerrar a run agora, ou continuar explorando por sua conta e risco?`,
      [{ label: 'Encerrar a run (vitória)', value: false }, { label: `Continuar no ${esc(santuario.name)}`, value: true, ghost: true }]);
    if (!seguir) { encerrarJornada('venceu', { genVencida: g }); return; }
    S.aposVitoria = true; S.zone = santuario.id;
    await say(`Você segue em frente. Se desmaiar aqui, a run acaba em derrota — mas a Gen ${g} continua fechada e liberada. Dá pra encerrar em vitória quando quiser, pelo botão na tela da rota.`, 'level');
    save(); render();
    return;
  }
  /* Fora do Roguelike, fechar a Gen ENCERRA a jornada por padrão: o Pokémon se aposenta como campeão daquele mapa,
     a jornada é pontuada e entra na carreira, e a próxima começa do zero — outro Pokémon, nível 5, mapa nos níveis
     normais. Seguir com o MESMO Pokémon continua possível (era o comportamento antigo, e é como se chegava a Hoenn
     começando no nível 90), mas agora é escolha explícita e vale menos pontos: cada continuação tira 20% da
     pontuação final (regras.multContinuacao), porque chegar num mapa novo já forte é mais fácil. */
  S.genVencida = g;
  const prox = g < TOTAL_GENS ? g + 1 : null;
  const seguir = await ask(
    `Você fechou a Gen ${g}. O que ${nm(P)} faz agora?`,
    [{ label: `🏁 Encerrar aqui — ${esc(rotulo(P))} se aposenta campeão${prox ? ` e você começa outra jornada na Gen ${prox}` : ''}`, value: false },
     { label: `Seguir com ${esc(rotulo(P))} pro próximo mapa (vale ${Math.round((1 - 0.8) * 100)}% menos pontos)`, value: true, ghost: true }],
    `<div class="mcard">Recomeçar é o caminho normal: você escolhe outro Pokémon, no nível 5, e o mapa novo volta aos níveis dele.
      Seguir leva sua equipe e sua mochila, mas o mapa novo se ajusta ao seu nível — e a pontuação cai.</div>`);
  if (!seguir) { encerrarJornada('venceu', { genVencida: g }); return; }
  S.continuacoes = (S.continuacoes || 0) + 1;
  S.escolhendoGen = true; // se fechar o jogo agora, a escolha volta ao abrir (main.js abrirJornada)
  save(); telaEscolherGen();
}
// Desmaio: do Médio pra cima (`desmaiosLivres`), depois dos desmaios livres cada um gasta um Revive — sem Revive, Game Over
async function lose() {
  const S = G.S, regra = DIFICULDADES[dificuldadeDe(S)], livres = regra.desmaiosLivres;
  if (EVENTO_SEM_PERMADEATH && G.B?.evento) {   // o chefe da semana te derrubou: não é fim de run nem gasta Revive
    await say(`${nm(S.player)} desmaiou... ${esc(fmt(G.B.enemy.name))} foi forte demais. Dá pra tentar de novo daqui a algumas horas.`, 'hit');
    await say('Derrota de evento não encerra a jornada: você acorda no Centro Pokémon, sem perder nada.', 'muted');
    healFull(); zerarDescontoCentro(); endBattle();
    return;
  }
  S.desmaios = (S.desmaios || 0) + 1;
  await say(`${nm(S.player)} desmaiou...`, 'hit');
  if (regra.permadeath) { await say('No Roguelike não existe segunda chance. A run acabou.', 'hit'); encerrarJornada('desmaiou'); return; }
  if (desmaioPrecisaRevive(S.desmaios, livres)) {
    if (!S.bag.revive) { await say('Não há nenhum Revive na mochila...', 'hit'); encerrarJornada('desmaiou'); return; }
    S.bag.revive--; if (S.bag.revive <= 0) delete S.bag.revive;
    await say(`O Revive da mochila te trouxe de volta! (restam ${S.bag.revive || 0})`, 'good');
  } else if (livres != null) {
    await say(S.desmaios < livres ? `Desmaio ${S.desmaios} de ${livres} livres. Depois disso, cada desmaio gasta um Revive.`
      : 'Esse foi o último desmaio livre. Daqui pra frente, cada desmaio gasta um Revive, e sem Revive é Game Over.', 'status');
  }
  const lost = Math.floor(S.money / 2); S.money -= lost;
  await say(`Você perdeu ₽${lost} e acordou no Centro Pokémon.`);
  healFull(); zerarDescontoCentro(); endBattle();
}
// capturado por treinador: `fimDeJogo` (Hardcore) = acabou; senão foge depois com perdas. `semCaptura` (Fácil/Médio) nunca chega aqui
async function serCapturado() {
  const S = G.S, T = G.B.trainer, P = S.player;
  if (DIFICULDADES[dificuldadeDe(S)].fimDeJogo) {
    await say(`${esc(T.nome)} guarda a bola no cinto. Sua jornada selvagem termina aqui.`, 'hit');
    encerrarJornada('capturado', { cacador: T.nome });
    return;
  }
  const perdeu = Math.floor(S.money / 2), itens = Object.values(S.bag).reduce((a, n) => a + n, 0);
  S.money -= perdeu; S.bag = {};
  const rotas = rotasAtuais(), destinos = rotas.filter(z => zonaLiberada(z, P.level, S) && z.id !== S.zone);
  const z = destinos.length ? pick(destinos) : rotas[0];
  S.zone = z.id; S.capturas = (S.capturas || 0) + 1;
  healFull(); endBattle();
  await say(`${esc(T.nome)} levou você embora... Dias depois, você força a bola a abrir e foge.`, 'status');
  await say(`Você perdeu ₽${perdeu}${itens ? ` e os ${itens} itens da mochila` : ''}, e acordou em ${z.name}.`, 'hit');
}
/* A Mega dura até o fim da batalha. `desfazerMega` é chamado pra TODO mundo do seu lado (quem não megaevoluiu
   é ignorado): é mais seguro varrer a equipe do que lembrar quem virou. Sem isto o Pokémon ficaria Mega pra
   sempre — `M.data` vai junto no save. O inimigo some com a batalha, não precisa desfazer. */
export function endBattle() {
  G.alvoDe = null;
  G.B = null; G.mode = 'explore'; G.panel = 'main'; tocarMusica('explorar', G.S ? zone() : null);
  for (const m of ladoJogador()) { desfazerMega(m); desfazerTera(m); desfazerDynamax(m); desfazerForma(m); desfazerAshGreninja(m); desfazerTrace(m); m.vol = freshVol(); }
}

/* ---- batalha em andamento no save (sem fuga por F5) ----
   Recarregar a página apagava a batalha: dava pra escapar de treinador, Alfa ou lendário — e de uma derrota no
   Roguelike — só dando refresh. Agora ela vai junto no save (estado.save) e volta ao abrir o jogo, no mesmo turno.
   `caidos` é um Set (quem já foi anunciado) e não sobrevive ao JSON: volta vazio, no máximo repete um anúncio. */
/* `enemy` é um GETTER (estado.ligarInimigos), e `{...B}` o transforma num campo comum — o que vai pro JSON é uma
   CÓPIA do inimigo em foco. Por isso ele é descartado aqui: a verdade é `inimigos` + `foco`, e o getter volta no
   `restaurarBatalha`. Sem isso o save teria dois objetos iguais e o dano aplicado num não apareceria no outro —
   exatamente o bug que a troca de Pokémon do treinador já documentava. */
export const serializarBatalha = B => {
  if (!B) return null;
  const { enemy, ...resto } = B;
  return { ...resto, caidos: null, vez: null };
};
export function restaurarBatalha(b) {
  if (!b?.inimigos?.length && !b?.enemy) return null;
  const { enemy, ...resto } = b;
  const B = { ...resto, caidos: new Set(), vez: null };
  // save de antes do grupo: tinha só `enemy`. Vira lista de um.
  let lista = B.inimigos?.length ? B.inimigos : [enemy];
  // o inimigo é o Pokémon atual do treinador: sem isso seriam dois objetos iguais e o dano iria só pra um deles
  if (B.trainer?.equipe?.length) lista = [B.trainer.equipe[B.trainer.atual] || lista[0]];
  return ligarInimigos(B, lista);
}
