/* ============ tela: ❓ tutorial (tour guiado + demonstração) ============ */
// Desenha o que js/tutorial.js decide (lógica pura). G.tut guarda o estado da demonstração — nunca G.S: nada
// aqui toca no save de verdade. Ações (prefixo `tut-`, ligadas em main.js): tut-avancar, tut-voltar, tut-pular,
// tut-explorar, tut-golpe, tut-comprar, tut-revelar-captura, tut-fim.
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { esc } from './util.js';
import { barraTelas } from './navegacao.js';
import { showCreate } from './criacao.js';
import { spriteItem } from './render.js';
import { SPR, ITEMS, ITEM_ERRO, DIFICULDADES } from './dados.js';
import { salvarTutorialVisto } from './nuvem.js';
import {
  TUT_PASSOS, TUT_DEMO, TUT_SELVAGEM, TUT_TREINADOR, TUT_ITENS_LOJA, TUT_HP_CAPTURA,
  novoEstadoTutorial, avancarPasso, voltarPasso, passoAtual, indiceDoPasso,
  golpeDemo, venceuDemo, comprarDemo, resultadoCaptura
} from './tutorial.js';

const brl = n => '₽' + (n || 0).toLocaleString('pt-BR');

export function telaTutorial() {
  G.mode = 'tutorial'; limparTopo();
  if (!G.tut) G.tut = novoEstadoTutorial();
  salvarTutorialVisto(); // idempotente: marca "já visto" assim que o tour abre, automático ou pelo botão de rever
  render();
}

function render() {
  const t = G.tut;
  $('#app').innerHTML = `<main class="create tut">
    ${barraTelas('tutorial')}
    <div class="tut-passos" aria-hidden="true">${TUT_PASSOS.map((p, i) => `<span class="tut-ponto ${i === t.passo ? 'on' : i < t.passo ? 'feito' : ''}"></span>`).join('')}</div>
    ${corpo(t)}
  </main>`;
}

function corpo(t) {
  switch (passoAtual(t)) {
    case 'boas-vindas': return boasVindas();
    case 'mundo': return mundo();
    case 'batalha': return batalha(t);
    case 'loja': return loja(t);
    case 'captura': return captura(t);
    case 'runs': return runsResumo();
    default: return fimTour();
  }
}

// barra de HP reaproveitando as MESMAS classes de render.js (.hp/.bar/.fill), sem precisar de um Pokémon de
// verdade — só número de HP e teto.
function cardMon({ id, nome, nivel }, hp, hpMax, rotulo) {
  const pct = Math.max(0, Math.min(100, hp / hpMax * 100));
  const cor = pct > 50 ? '#5FB36A' : pct > 20 ? '#F7C548' : '#E4572E';
  return `<div class="tut-mon">
    <img src="${SPR(id)}" alt="${esc(nome)}">
    <div><b>${esc(nome)}</b> <small class="muted">Nv. ${nivel}${rotulo ? ` · ${esc(rotulo)}` : ''}</small>
      <div class="hp"><span>HP</span><div class="bar"><div class="fill" style="width:${pct}%;background:${cor}"></div></div><span>${hp}/${hpMax}</span></div>
    </div></div>`;
}

function nav({ voltar = true, pular = true, continuar = 'Continuar →' } = {}) {
  return `<div class="tut-nav subrow">
    ${voltar ? `<button class="btn ghost sm" data-act="tut-voltar">← Voltar</button>` : ''}
    ${pular ? `<button class="btn ghost sm" data-act="tut-pular">Pular tutorial</button>` : ''}
    ${continuar ? `<button class="btn" data-act="tut-avancar">${continuar}</button>` : ''}
  </div>`;
}

function boasVindas() {
  return `<h1>Bem-vindo ao PokéRPG!</h1>
    <p class="lead">Aqui você não é treinador — <b>você é o Pokémon</b>. Sem Pokébola pra prender ninguém: você
      anda pelo mundo, luta, evolui e cresce na própria pele. Este tour rápido mostra a loja, uma batalha e um
      perigo de verdade — outros TREINADORES podem tentar te capturar (passo 4). Tudo aqui é demonstração: o
      Pokémon, o dinheiro e a batalha são de mentirinha, e nada disso mexe na sua jornada de verdade.</p>
    ${nav({ voltar: false, continuar: 'Começar o tour →' })}`;
}

function mundo() {
  return `<h1>O mundo: rotas e exploração</h1>
    <p class="lead">Cada região tem 10 rotas cheias de Pokémon selvagens, mais uma 11ª — o Santuário — liberada
      só depois de vencer a região inteira. Em cada rota você pode achar um Pokémon selvagem, um item, dinheiro
      ou um treinador. Clicar em <b>Explorar</b> sorteia o que aparece.</p>
    ${cardMon(TUT_DEMO, TUT_DEMO.hpMax, TUT_DEMO.hpMax, 'você')}
    <div class="tut-nav subrow">
      <button class="btn ghost sm" data-act="tut-voltar">← Voltar</button>
      <button class="btn ghost sm" data-act="tut-pular">Pular tutorial</button>
      <button class="btn" data-act="tut-explorar">🚶 Explorar (demonstração)</button>
    </div>`;
}

function batalha(t) {
  const venceu = venceuDemo(t);
  return `<h1>Uma batalha!</h1>
    <p class="lead">Um <b>${esc(TUT_SELVAGEM.nome)}</b> selvagem apareceu. As batalhas de verdade seguem as
      fórmulas dos jogos — tipo, poder do golpe, status, habilidade... aqui é só um golpe de dano fixo, pra
      sentir o ritmo sem depender de sorte.</p>
    <div class="tut-duelo">${cardMon(TUT_DEMO, t.hp, t.hpMax, 'você')}${cardMon(TUT_SELVAGEM, t.inimigoHp, t.inimigoHpMax, 'selvagem')}</div>
    <p class="small ${venceu ? 'ok-offline' : 'muted'}">${venceu
      ? '✅ Vitória! De verdade, isso renderia XP e um pouco de dinheiro pra sua equipe.'
      : `Escolha atacar — o ${esc(TUT_SELVAGEM.nome)} revida enquanto estiver de pé.`}</p>
    <div class="tut-nav subrow">
      <button class="btn ghost sm" data-act="tut-voltar">← Voltar</button>
      <button class="btn ghost sm" data-act="tut-pular">Pular tutorial</button>
      ${venceu ? `<button class="btn" data-act="tut-avancar">Continuar →</button>`
        : `<button class="btn" data-act="tut-golpe">⚔ ${esc(TUT_DEMO.golpe)}</button>`}
    </div>`;
}

function loja(t) {
  return `<h1>A loja</h1>
    <p class="lead">O dinheiro que você acha explorando (ou ganha vencendo) serve pra comprar na loja: poções,
      itens de batalha, evolução... quanto mais você joga, mais opções aparecem (Disco Técnico, Pedra Mega,
      Cristal Z). Compre algo pra ver como funciona — este dinheiro é de mentirinha, à vontade.</p>
    <p class="carteira-loja">💰 Você tem <b>${brl(t.dinheiro)}</b></p>
    <div class="bag-grid">${TUT_ITENS_LOJA.map(id => {
      const it = ITEMS[id], tem = t.mochila[id] || 0;
      return `<button class="item-btn" data-act="tut-comprar" data-v="${id}" ${t.dinheiro < it.price ? 'disabled' : ''} title="${esc(it.desc)}">
        <img src="${spriteItem(id, null)}" alt="" onerror="${ITEM_ERRO}"><span>${esc(it.name)}${tem ? ` (${tem})` : ''}</span><small>${brl(it.price)}</small></button>`;
    }).join('')}</div>
    ${nav()}`;
}

function captura(t) {
  const topo = `<h1>Cuidado com os treinadores</h1>
    <p class="lead">De vez em quando, em vez de um Pokémon selvagem, você encontra um TREINADOR. Ele luta contra
      você e, se o seu HP cair pela metade, pode jogar uma bola tentando te CAPTURAR. Isso é sério — o que
      acontece depois depende da dificuldade escolhida no início da jornada.</p>`;
  if (t.capturaRevelada) {
    return `${topo}
      <p class="small">🎯 A bola balança... o que acontece agora depende da dificuldade escolhida no início da jornada:</p>
      <div class="difs">${Object.entries(DIFICULDADES).map(([k, d]) => `<div class="abil"><b>${k === 'randomizer' ? '🎲 ' : ''}${esc(d.nome)}</b><small>${esc(resultadoCaptura(k))}</small></div>`).join('')}</div>
      ${nav()}`;
  }
  return `${topo}
    ${cardMon(TUT_DEMO, TUT_HP_CAPTURA, TUT_DEMO.hpMax, `apanhando de ${TUT_TREINADOR.nome}`)}
    <div class="tut-nav subrow">
      <button class="btn ghost sm" data-act="tut-voltar">← Voltar</button>
      <button class="btn ghost sm" data-act="tut-pular">Pular tutorial</button>
      <button class="btn" data-act="tut-revelar-captura">🎯 ${esc(TUT_TREINADOR.nome)} jogou uma bola!</button>
    </div>`;
}

function runsResumo() {
  return `<h1>O que é uma Run?</h1>
    <p class="lead">No começo de cada jornada você escolhe uma dificuldade — ela decide o risco e quanto ela
      vale. Vencer os lendários de uma região fecha a Run: o resultado entra na sua <b>Carreira</b> e no
      <b>Ranking</b> global. Fora do Roguelike dá pra seguir pro mapa seguinte com o mesmo Pokémon (vale menos
      pontos); no Roguelike, vencer encerra a Run ali mesmo — e desmaiar encerra também, sem segunda chance.</p>
    <div class="difs">${Object.entries(DIFICULDADES).map(([k, d]) => `<div class="abil"><b>${k === 'randomizer' ? '🎲 ' : ''}${esc(d.nome)}</b><small>${esc(d.desc)}</small></div>`).join('')}</div>
    ${nav()}`;
}

function fimTour() {
  return `<h1>Pronto!</h1>
    <p class="lead">Agora você já viu a loja, uma batalha e o risco de ser capturado. Pode rever este tour
      quando quiser em <b>❓ Tutorial</b>, no menu. Bora escolher seu Pokémon de verdade?</p>
    <div class="tut-nav subrow">
      <button class="btn ghost sm" data-act="tut-voltar">← Voltar</button>
      <button class="btn" data-act="tut-fim">🚀 Começar minha jornada de verdade</button>
    </div>`;
}

/* ============ ações (main.js) ============ */
export function tutAvancar() { avancarPasso(G.tut); render(); }
export function tutVoltar() { voltarPasso(G.tut); render(); }
export function tutExplorar() { G.tut.passo = indiceDoPasso('batalha'); render(); }
export function tutGolpe() { golpeDemo(G.tut); render(); }
export function tutComprar(id) { comprarDemo(G.tut, id); render(); }
export function tutRevelarCaptura() { G.tut.capturaRevelada = true; render(); }
export function tutSair() { G.tut = null; showCreate(); }
