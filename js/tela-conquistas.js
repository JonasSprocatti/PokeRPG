/* ============ tela: 🏅 Conquistas ============ */
// O que a sua CONTA já conquistou, somando a carreira inteira (conquistas.js mede; aqui só mostra). É por esta tela
// que se enxerga o progresso das gimmicks — Mega, Terastalização, Z-Move e Gigantamax —, cada uma com a missão que
// a libera. A jornada em andamento entra na conta: o número sobe enquanto você joga, não só quando a run termina.
// Nenhuma gimmick é jogável ainda; o que está pronto é a medição, e a tela diz isso sem fingir o contrário.
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { barraTelas } from './navegacao.js';
import { carregarCarreira } from './carreira.js';
import { progressoConquistas, ALVOS, MARCOS_ABATES, MODO_NAO_CONTA } from './conquistas.js';
import { SPR, TYPE_PT } from './dados.js';
import { esc, fmt } from './util.js';

const n = v => (v || 0).toLocaleString('pt-BR');
// barra de progresso de uma missão
const barra = (feito, alvo) => `<div class="bar"><div class="fill" style="width:${Math.min(100, feito / alvo * 100)}%"></div></div>`;

/* Uma missão da lista. `rotulo` já vem pronto (nome do tipo em português, nome do golpe formatado…), porque cada
   categoria fala de uma coisa diferente: tipo do derrotado, sua espécie, nome do golpe. */
function linhaMissao(x, rotulo, sprite = null) {
  return `<li class="${x.liberado ? 'feito' : ''}">
    ${sprite ? `<img src="${sprite}" alt="" loading="lazy">` : ''}
    <b>${x.liberado ? '🔓 ' : ''}${rotulo}</b>
    ${barra(x.n, x.alvo)}
    <small>${n(x.n)} / ${n(x.alvo)}${x.liberado ? ' · conquistado' : ` · faltam ${n(x.alvo - x.n)}`}</small>
  </li>`;
}
// bloco de uma gimmick: explicação + as missões mais adiantadas
function bloco(titulo, explicacao, itens, vazio) {
  return `<h3 class="passo">${titulo}</h3>
    <p class="muted small">${explicacao}</p>
    ${itens.length ? `<ul class="quase conquistas">${itens.join('')}</ul>` : `<p class="small muted">${vazio}</p>`}`;
}

export function telaConquistas() {
  G.mode = 'fim'; limparTopo();
  const jornadas = carregarCarreira().jornadas;
  // o registro da run em andamento entra junto: ver o contador subir no meio da jornada é metade da graça
  const p = progressoConquistas(jornadas, G.S?.registro);
  const m = p.abates;

  const tera = p.tera.slice(0, 18).map(x => linhaMissao(x, esc(TYPE_PT[x.chave] || fmt(x.chave))));
  const mega = p.mega.slice(0, 12).map(x => linhaMissao(x, esc(fmt(x.chave)), spriteDaEspecie(jornadas, x.chave)));
  const zGolpe = p.zGolpe.slice(0, 10).map(x => linhaMissao(x, esc(fmt(x.chave))));
  const zElemento = p.zElemento.slice(0, 10).map(x => linhaMissao(x, esc(TYPE_PT[x.chave] || fmt(x.chave))));
  const gmax = p.gigantamax.slice(0, 10).map(x => linhaMissao(x, esc(fmt(x.chave)), spriteDaEspecie(jornadas, x.chave)));

  $('#app').innerHTML = `<main class="create">
    ${barraTelas('conquistas')}
    <h1>Conquistas da conta.</h1>
    <p class="lead">Tudo aqui soma a <b>carreira inteira</b>, jornada após jornada — e a que está em andamento conta junto.
      O modo Fácil não entra: ele é treino. As gimmicks ainda <b>não são jogáveis</b>; o que já funciona é a medição,
      então o progresso que você fizer a partir de agora fica guardado.</p>
    <p class="small muted">Não confunda com o <b>desbloqueio de espécies</b> do Roguelike (aquele que libera Pokémon
      novos pra escolher no começo): ele é outro sistema, e só conta jornadas Roguelike. O que está nesta tela conta
      em todos os modos, menos o Fácil.</p>

    <h3 class="passo">🗡 Caçada</h3>
    <p class="muted small">Todo Pokémon que a sua equipe derrota conta, aliado incluído.</p>
    <div class="stats-fim">
      <div class="stat-fim"><span>Derrotados</span><b>${n(m.total)}</b><small>${m.proximo ? `faltam ${n(m.faltam)} pro próximo marco` : 'todos os marcos conquistados'}</small></div>
      ${MARCOS_ABATES.map(x => `<div class="stat-fim ${m.total >= x ? 'feito' : ''}"><span>${n(x)}</span><b>${m.total >= x ? '🏅' : '—'}</b><small>${m.total >= x ? 'conquistado' : `${Math.floor(m.total / x * 100)}%`}</small></div>`).join('')}
    </div>

    ${bloco('⚡ Mega Evolução', `Uma Pedra Mega por espécie: <b>${n(ALVOS.mega)} golpes finais</b> dados sendo a espécie que megaevolui.
      O abate do aliado conta pra espécie que você está usando.`, mega, 'Nenhum abate registrado ainda.')}

    ${bloco('💎 Terastalização', `<b>${n(ALVOS.tera)} derrotados</b> de um tipo liberam a Tera daquele tipo. Aqui só conta o que
      <b>você</b> finalizou — um Pokémon de dois tipos conta para os dois.`, tera, 'Nenhum tipo registrado ainda.')}

    ${bloco('🌀 Z-Moves', `<b>${n(ALVOS.zGolpe)} eliminações com o golpe</b>, ou <b>${n(ALVOS.zElemento)} com golpes do mesmo elemento</b>.
      Só golpe seu conta: o Z-Move é você dominando aquele golpe.`, [...zGolpe, ...zElemento], 'Nenhum golpe registrado ainda.')}

    ${bloco('🔴 Gigantamax', `Chegar ao <b>nível ${ALVOS.gmaxNivel}</b> com a espécie em <b>${ALVOS.gmaxRuns} jornadas</b> diferentes.`,
      gmax, 'Nenhuma jornada chegou ao nível 50 ainda.')}

    <p class="small muted" style="margin-top:18px">Jornadas que contam: <b>${n(jornadas.filter(j => j.dificuldade !== MODO_NAO_CONTA).length)}</b>
      de ${n(jornadas.length)} na carreira.</p>
  </main>`;
}

// sprite da espécie, quando a carreira souber o id dela (registro.ids guarda isso desde sempre)
function spriteDaEspecie(jornadas, especie) {
  for (const j of jornadas) { const id = j.registro?.ids?.[especie]; if (id) return SPR(id); }
  return null;
}
