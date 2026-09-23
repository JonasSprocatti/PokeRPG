/* ============ fim de jornada e carreira ============ */
// Toda jornada termina aqui: capturado no Hardcore, desmaio sem Revive (Médio+), ou "Novo jogo" (encerrar).
// Monta o resumo (estatisticasDaJornada + pontuacao, em regras.js), adiciona na CARREIRA (carreira.js — lista de
// jornadas terminadas, local e na nuvem), apaga o save da jornada (aqui e na nuvem) e mostra a tela de fim.
// telaCarreira() mostra tudo calculado da carreira: números gerais, Pokédex, shinies e o melhor por espécie.
import { G, SAVE_KEY, dificuldadeDe, marcarTempo } from './estado.js';
import { $, limparTopo } from './ui.js';
import { spriteFrente } from './render.js';
import { DIFICULDADES, SPR } from './dados.js';
import { estatisticasDaJornada, pontuacao, formatarTempo } from './regras.js';
import { carregarCarreira, salvarCarreira, adicionarJornada, melhorDaEspecie, calcularCarreira, TOTAL_ESPECIES } from './carreira.js';
import { sincronizar, apagarSaveNuvem, usuario } from './nuvem.js';
import { progressoRoguelike, novosDesbloqueios, textoProgresso } from './roguelike.js';
import { GENS, TOTAL_GENS, genDe, dadosDaGen, gensLiberadasRoguelike } from './mapas.js';
import { barraTelas, rotuloVoltar } from './navegacao.js';
import { esc, fmt, store, novoId } from './util.js';

// resumo de uma jornada (a atual, ainda em andamento, ou a que está terminando)
export function montarResumo(S, motivo, extra = {}) {
  const P = S.player, dif = dificuldadeDe(S), est = estatisticasDaJornada(S);
  return { ...est, id: S.id || (S.id = novoId()), nome: P.nick || fmt(P.name), sprite: spriteFrente(P), dificuldade: dif, motivo,
    data: new Date().toISOString(), pontuacao: pontuacao(est, DIFICULDADES[dif].multPontos), ...extra };
}

// motivo: 'capturado' | 'desmaiou' | 'encerrou' | 'venceu' (Roguelike: fechou a Gen). `extra` entra no resumo
// (ex.: { cacador }, { genVencida } — é o que libera o mapa seguinte, mapas.js gensLiberadasRoguelike)
export function encerrarJornada(motivo, extra = {}) {
  const S = G.S; if (!S) return;
  marcarTempo();
  // a Gen vencida acompanha a jornada mesmo quando o fim não é a vitória (seguiu no Santuário e desmaiou lá)
  if (S.genVencida && !extra.genVencida) extra = { ...extra, genVencida: S.genVencida };
  const resumo = montarResumo(S, motivo, extra);
  const carreira = carregarCarreira();
  const anterior = melhorDaEspecie(carreira.jornadas, resumo.especie, resumo.id);
  const nova = adicionarJornada(carreira, resumo);
  salvarCarreira(nova);
  store.del(SAVE_KEY); G.S = null; G.B = null;
  if (usuario()) apagarSaveNuvem(resumo.id).then(sincronizar).catch(e => console.error(e)); // sobe a jornada e tira o save da nuvem
  const jornadas = nova.jornadas.filter(j => j.especie === resumo.especie).length;
  telaFim(resumo, anterior, !anterior || resumo.pontuacao > anterior.pontuacao, jornadas, novosDesbloqueios(carreira.jornadas, nova.jornadas));
}

const TITULO = { capturado: 'Game Over', desmaiou: 'Game Over', encerrou: 'Jornada encerrada', venceu: '🏆 Vitória' };
const frase = r => r.motivo === 'venceu' ? `${esc(r.nome)} venceu os lendários de ${dadosDaGen(r.genVencida).regiao} e fechou a Gen ${r.genVencida}. `
    + (r.genVencida < TOTAL_GENS ? `<b>🗺 O mapa da Gen ${r.genVencida + 1} (${dadosDaGen(r.genVencida + 1).regiao}) está liberado</b> pras próximas runs.` : 'Era a última Gen: você fechou o jogo!')
  : r.motivo === 'capturado' ? `${esc(r.cacador || 'Um treinador')} capturou ${esc(r.nome)}. No ${DIFICULDADES[r.dificuldade].nome} não existe segunda chance.`
  : r.motivo === 'desmaiou' ? (DIFICULDADES[r.dificuldade]?.permadeath ? `${esc(r.nome)} desmaiou. No Roguelike não existe segunda chance: a run acabou.`
    : `${esc(r.nome)} desmaiou sem nenhum Revive na mochila. A jornada termina aqui.`)
  : `Você encerrou a jornada de ${esc(r.nome)}. O resultado foi para a sua carreira.`;
const n = v => (v || 0).toLocaleString('pt-BR');
// linhas da tela: [rótulo, campo, formatação]
const LINHAS = [['Pontuação', 'pontuacao'], ['Nível', 'nivel'], ['Tempo de jogo', 'tempoMs', formatarTempo], ['Vitórias', 'vitorias'],
  ['Pokémon derrotados', 'derrotados'], ['Treinadores', 'treinadores'], ['Alfas', 'alfas'], ['Amigos', 'amigos'], ['Evoluções', 'evolucoes'],
  ['Missões', 'missoes'], ['Gens fechadas', 'gens'], ['Mais dinheiro de uma vez', 'maxDinheiro', v => '₽' + n(v)]];

function telaFim(r, anterior, novoRecorde, jornadas, desbloqueios = []) {
  G.mode = 'fim'; limparTopo();
  const f = (l, v) => l[2] ? l[2](v || 0) : n(v);
  $('#app').innerHTML = `<main class="create fim">
    <h1>${TITULO[r.motivo]}.</h1>
    <p class="lead">${frase(r)}</p>
    <section class="pv">
      <div class="pv-art"><img src="${r.sprite}" alt="${esc(fmt(r.especieFinal))}"></div>
      <div>
        <h2>${r.shiny ? '✨ ' : ''}${esc(r.nome)}</h2>
        <p class="muted">${esc(fmt(r.especie))}${r.especieFinal !== r.especie ? ` → ${esc(fmt(r.especieFinal))}` : ''} · modo ${DIFICULDADES[r.dificuldade].nome} (pontos ×${DIFICULDADES[r.dificuldade].multPontos}) · ${jornadas}ª jornada com ${esc(fmt(r.especie))}</p>
        ${novoRecorde ? `<p class="selo-recorde">🏆 ${anterior ? 'Novo recorde' : 'Primeiro recorde'} com esta espécie!</p>` : ''}
        ${desbloqueios.length ? `<div class="desbloq-novo"><b>🔓 Desbloqueado pra próxima jornada Roguelike:</b><div class="picks">${desbloqueios.map(p => `<div class="pick" title="${esc(textoProgresso(p))}"><img src="${SPR(p.id)}" alt="">${esc(fmt(p.especie))}</div>`).join('')}</div></div>` : ''}
        <div class="stats-fim">${LINHAS.map(l => {
          const v = r[l[1]], a = anterior?.[l[1]];
          return `<div class="stat-fim"><span>${l[0]}</span><b>${f(l, v)}</b>${anterior ? `<small class="${v > a ? 'up' : v < a ? 'down' : ''}">recorde ${f(l, a)}</small>` : ''}</div>`;
        }).join('')}</div>
        <div class="subrow" style="margin-top:18px"><button class="btn big" data-act="recomecar">Nova jornada</button><button class="btn ghost" data-act="carreira">📊 Ver carreira</button><button class="btn ghost" data-act="ranking">🏆 Ranking</button></div>
      </div>
    </section></main>`;
}

// Roguelike na carreira: desbloqueados + progresso (só jornadas terminadas contam, como na criação)
function secaoRoguelike(terminadas) {
  const prog = progressoRoguelike(terminadas);
  if (!prog.length) return '';
  const des = prog.filter(p => p.desbloqueada);
  return `<h3 class="passo">Roguelike</h3>
    <p class="muted">Espécies desbloqueadas como opção inicial: <b>${n(des.length)}</b> (além dos iniciais, Pikachu e Eevee). Contam as jornadas Roguelike já terminadas.</p>
    <ul class="quase">${prog.slice(0, 24).map(p => `<li class="${p.desbloqueada ? 'feito' : ''}">${p.id ? `<img src="${SPR(p.id)}" alt="">` : ''}<b>${p.desbloqueada ? '🔓 ' : ''}${esc(fmt(p.especie))}</b><div class="bar"><div class="fill" style="width:${p.fracao * 100}%"></div></div><small>${esc(textoProgresso(p))}</small></li>`).join('')}</ul>`;
}
// Carreira: jornadas terminadas + (se aberta do meio do jogo) a atual, marcada como "em andamento"
export function telaCarreira() {
  const emJogo = !!G.S;
  const jornadas = [...carregarCarreira().jornadas, ...(emJogo ? [{ ...montarResumo(G.S, 'andamento'), emAndamento: true }] : [])];
  G.mode = 'fim'; limparTopo();
  const c = calcularCarreira(jornadas);
  const especies = Object.entries(c.porEspecie).sort((a, b) => b[1].melhor.pontuacao - a[1].melhor.pontuacao);
  const card = (rot, val, dica = '') => `<div class="stat-fim"><span>${rot}</span><b>${val}</b>${dica ? `<small>${dica}</small>` : ''}</div>`;
  const conta = usuario();
  $('#app').innerHTML = `<main class="create">
    ${barraTelas('carreira')}
    <h1>Sua carreira.</h1>
    <p class="lead">Tudo o que você já fez, somando todas as jornadas${emJogo ? ' (inclusive a atual, ainda em andamento)' : ''}. ${conta ? 'Salvo na sua conta: aparece em qualquer aparelho em que você entrar.' : 'Só neste navegador por enquanto. <button class="btn ghost sm" data-act="conta">👤 Entrar</button> pra guardar na nuvem.'}</p>
    ${c.jornadas ? `
    <div class="stats-fim">
      ${card('Pokémon favorito', c.favorito ? esc(fmt(c.favorito)) : '—', c.favorito ? `${c.porEspecie[c.favorito].jornadas} jornada(s)` : '')}
      ${card('Jornadas', n(c.jornadas), formatarTempo(c.tempoTotal) + ' no total')}
      ${card('Melhor pontuação', n(c.melhorPontuacao))}
      ${card('Nível máximo', n(c.maxNivel))}
      ${card('Mais dinheiro de uma vez', '₽' + n(c.maxDinheiro))}
      ${card('Mais missões numa jornada', n(c.maxMissoes))}
      ${card('Vitórias', n(c.totalVitorias), `recorde numa jornada: ${n(c.maxVitorias)}`)}
      ${card('Pokémon derrotados', n(c.totalDerrotados))}
      ${card('Treinadores', n(c.totalTreinadores))}
      ${card('Alfas numa jornada', n(c.maxAlfas))}
      ${card('Gens fechadas numa jornada', n(c.maxGens), `mapas do Roguelike liberados: ${gensLiberadasRoguelike(jornadas).length} de ${TOTAL_GENS}`)}
      ${card('✨ Shinies vistos', n(c.shiniesVistos), `${n(c.shiniesAmigos)} viraram amigos · ${n(c.jornadasShiny)} jornada(s) sendo shiny`)}
    </div>
    ${secaoRoguelike(jornadas.filter(j => !j.emAndamento))}
    <h3 class="passo">Pokédex</h3>
    <p class="muted">Amigos (capturados): <b>${n(c.amigos.length)}</b> de ${n(TOTAL_ESPECIES)}, faltam <b>${n(c.faltam)}</b> · vistos: <b>${n(c.vistos.length)}</b></p>
    ${c.amigos.length ? `<div class="pokedex">${c.amigos.map(e => `<div class="dex-item" title="${esc(fmt(e))}">${c.ids[e] ? `<img src="${SPR(c.ids[e])}" alt="" loading="lazy">` : ''}<small>${esc(fmt(e))}</small></div>`).join('')}</div>` : '<p class="small muted">Nenhum amigo ainda: ofereça petiscos a Pokémon selvagens.</p>'}
    <h3 class="passo">Melhor por espécie</h3>
    <div class="recordes">${especies.map(([esp, { melhor: m, jornadas: q }], i) => `
      <div class="recorde"><span class="pos">${i + 1}º</span><img src="${m.sprite}" alt="">
        <div><b>${m.shiny ? '✨ ' : ''}${esc(fmt(esp))}${esp === c.favorito ? ' ⭐' : ''}</b><small>${esc(m.nome)} · Nv. ${m.nivel} · ${DIFICULDADES[m.dificuldade]?.nome || m.dificuldade} · ${formatarTempo(m.tempoMs)} · ${q} jornada${q > 1 ? 's' : ''}${m.emAndamento ? ' · em andamento' : ''}</small></div>
        <b class="pts">${n(m.pontuacao)}</b></div>`).join('')}</div>`
    : '<p class="muted">Nenhuma jornada ainda. Os números aparecem aqui quando você encerra uma jornada ou leva Game Over.</p>'}
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">${rotuloVoltar()}</button></div></main>`;
}

// Fora do Roguelike, vencer os lendários de um mapa não encerra a jornada: você escolhe o próximo (qualquer Gen, até
// uma já fechada). O mapa novo começa no seu nível (mapas.js escalaNivel). S.escolhendoGen = esta tela está pendente
// (se fechar o jogo aqui, ela volta ao abrir). O clique "proxima-gen" é tratado em main.js.
export function telaEscolherGen() {
  const S = G.S, g = genDe(S), feitas = S.gensVencidas || [];
  G.mode = 'gen'; limparTopo();
  $('#app').innerHTML = `<main class="create fim">
    <h1>🏆 Gen ${g} fechada!</h1>
    <p class="lead">Você venceu os lendários de ${dadosDaGen(g).regiao}. Pra qual mapa agora? Você leva a equipe, a mochila e o dinheiro; os níveis do mapa novo começam no seu (${S.player.level}) e sobem até o 100. <b>${feitas.length} de ${TOTAL_GENS}</b> Gens fechadas nesta jornada.</p>
    <div class="gens">${GENS.map(x => { const lend = x.rotas[x.rotas.length - 1].lendarios, fechada = feitas.includes(x.gen);
      return `<button class="gen-card ${fechada ? 'feita' : ''}" data-act="proxima-gen" data-v="${x.gen}"><img src="${SPR(lend[lend.length - 1].id)}" alt="" loading="lazy"><b>Gen ${x.gen}</b><span>${x.regiao}</span><small>${fechada ? '✓ fechada (dá pra jogar de novo)' : `${x.rotas.length} rotas`}</small></button>`; }).join('')}</div>
    <div class="subrow" style="margin-top:18px"><button class="btn ghost" data-act="carreira">📊 Ver carreira</button><button class="btn ghost" data-act="new">Encerrar a jornada aqui</button></div></main>`;
}
