/* ============ tela: 🏅 Conquistas ============ */
// O que a sua CONTA já conquistou, somando a carreira inteira (conquistas.js mede; aqui só mostra). É por esta tela
// que se enxerga o progresso das gimmicks — Mega, Terastalização, Z-Move e Gigantamax —, cada uma com a missão que
// a libera. A jornada em andamento entra na conta: o número sobe enquanto você joga, não só quando a run termina.
// Nenhuma gimmick é jogável ainda; o que está pronto é a medição, e a tela diz isso sem fingir o contrário.
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { barraTelas } from './navegacao.js';
import { carregarCarreira, abatesDaConta, carregarProgresso, desbloqueadasDaConta, badgesDaCarreira } from './carreira.js';
import { vantagensDe } from './badges.js';
import { MEGAS, megasDe } from './dados-megas.js';
import { ITEMS } from './dados.js';
import { runsDeNivelDe } from './progresso-conta.js';
import { progressoConquistas, ALVOS, MARCOS_ABATES, MODO_NAO_CONTA } from './conquistas.js';
import { SPR, TYPE_PT, DESBLOQUEIO } from './dados.js';
import { progressoRoguelike, textoProgresso } from './roguelike.js';
import { esc, fmt } from './util.js';

const n = v => (v || 0).toLocaleString('pt-BR');
// barra de progresso de uma missão
const barra = (feito, alvo) => `<div class="bar"><div class="fill" style="width:${Math.min(100, feito / alvo * 100)}%"></div></div>`;

/* Uma missão da lista. `rotulo` já vem pronto (nome do tipo em português, nome do golpe formatado…), porque cada
   categoria fala de uma coisa diferente: tipo do derrotado, sua espécie, nome do golpe. */
function linhaMissao(x, rotulo, sprite = null) {
  // a vaga do sprite existe SEMPRE: a lista é uma grade de `40px 1fr` e, sem nada na 1ª coluna, o texto caía
  // dentro dos 40px e montava em cima da barra de progresso (bug relatado na tela de Conquistas)
  return `<li class="${x.liberado ? 'feito' : ''}">
    ${sprite ? `<img src="${sprite}" alt="" loading="lazy">` : '<span class="sem-sprite" aria-hidden="true"></span>'}
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

/* Catálogo das Megas: TODAS as espécies que têm Mega no jogo, conquistadas ou não.
   A lista de barras acima só mostra espécie com a qual você já lutou — quem nunca jogou de Gengar não vê Gengar
   em lugar nenhum, e a pergunta "quais Megas existem?" ficava sem resposta na tela. A figura é a da FORMA Mega
   (o id da forma), que é justamente o que dá vontade de ir atrás. */
function catalogoMegas(p) {
  const liberadas = new Set(p.mega.filter(x => x.liberado).map(x => x.chave));
  const especies = Object.keys(MEGAS).sort();
  return `<details class="cat-megas"><summary>Ver as ${especies.length} espécies que têm Mega no jogo
      (${liberadas.size} conquistada${liberadas.size === 1 ? '' : 's'})</summary>
    <div class="picks">${especies.map(e => megasDe(e).map(f =>
      `<span class="pick ${liberadas.has(e) ? 'on' : ''}" title="${esc(f.nome)}${liberadas.has(e) ? ' — conquistada' : ''}">
        <img src="${SPR(f.id)}" alt="" loading="lazy">${esc(f.nome)}${liberadas.has(e) ? ' ✓' : ''}</span>`).join('')).join('')}</div>
    <p class="small muted">São ${especies.length} espécies e ${especies.reduce((a, e) => a + megasDe(e).length, 0)} formas, de todas as Gens —
      Charizard e Mewtwo têm duas, e Groudon e Kyogre entram como Reversão Primitiva.</p></details>`;
}

export function telaConquistas() {
  G.mode = 'fim'; limparTopo();
  const jornadas = carregarCarreira().jornadas;
  // o registro da run em andamento entra junto: ver o contador subir no meio da jornada é metade da graça
  // do progresso PERMANENTE: apagar uma jornada do histórico não pode tirar conquista de ninguém
  const p = progressoConquistas(jornadas, G.S?.registro,
    { abates: abatesDaConta(G.S?.registro, jornadas), runs: runsDeNivelDe(carregarProgresso(), ALVOS.gmaxNivel) });
  const m = p.abates;

  const tera = p.tera.slice(0, 18).map(x => linhaMissao(x, esc(TYPE_PT[x.chave] || fmt(x.chave))));
  const mega = p.mega.slice(0, 24).map(x => linhaMissao(x, esc(fmt(x.chave)), spriteDaEspecie(jornadas, x.chave)));
  const zGolpe = p.zGolpe.slice(0, 10).map(x => linhaMissao(x, esc(fmt(x.chave))));
  const zElemento = p.zElemento.slice(0, 10).map(x => linhaMissao(x, esc(TYPE_PT[x.chave] || fmt(x.chave))));
  const gmax = p.gigantamax.slice(0, 10).map(x => linhaMissao(x, esc(fmt(x.chave)), spriteDaEspecie(jornadas, x.chave)));

  $('#app').innerHTML = `<main class="create">
    ${barraTelas('conquistas')}
    <h1>Conquistas da conta.</h1>
    <p class="lead">Tudo aqui soma a <b>carreira inteira</b>, jornada após jornada — e a que está em andamento conta junto.
      O modo Fácil não entra: ele é treino. <b>Mega Evolução e Terastalização já são jogáveis</b> — conquistadas,
      viram botão na batalha. Z-Move e Gigantamax ainda estão só medindo o progresso.</p>
    <p class="small muted">O <b>desbloqueio de espécies</b> (que libera Pokémon novos pra escolher no começo da jornada)
      é outro sistema, com outra regra: só conta jornada Roguelike. Ele está aqui embaixo, em 🔓 Espécies pra jogar.</p>

    <h3 class="passo">🗡 Caçada</h3>
    <p class="muted small">Todo Pokémon que a sua equipe derrota conta, aliado incluído.</p>
    <div class="stats-fim">
      <div class="stat-fim"><span>Derrotados</span><b>${n(m.total)}</b><small>${m.proximo ? `faltam ${n(m.faltam)} pro próximo marco` : 'todos os marcos conquistados'}</small></div>
      ${MARCOS_ABATES.map(x => `<div class="stat-fim ${m.total >= x ? 'feito' : ''}"><span>${n(x)}</span><b>${m.total >= x ? '🏅' : '—'}</b><small>${m.total >= x ? 'conquistado' : `${Math.floor(m.total / x * 100)}%`}</small></div>`).join('')}
    </div>

    ${bloco('⚡ Mega Evolução', `Uma Pedra Mega por espécie: <b>${n(ALVOS.mega)} golpes finais</b> dados sendo a espécie que megaevolui.
      Só aparece aqui quem <b>tem Mega</b> — derrotar sendo uma espécie que não megaevolui não enche barra nenhuma.
      O abate do aliado conta pra espécie que você está usando.${catalogoMegas(p)}`, mega, 'Nenhum abate com uma espécie que megaevolui ainda — as barras aparecem conforme você joga com elas.')}

    ${bloco('💎 Terastalização', `<b>${n(ALVOS.tera)} derrotados</b> de um tipo liberam a Tera daquele tipo. Aqui só conta o que
      <b>você</b> finalizou — um Pokémon de dois tipos conta para os dois.`, tera, 'Nenhum tipo registrado ainda.')}

    ${bloco('🌀 Z-Moves', `<b>${n(ALVOS.zGolpe)} eliminações com o golpe</b>, ou <b>${n(ALVOS.zElemento)} com golpes do mesmo elemento</b>.
      Só golpe seu conta: o Z-Move é você dominando aquele golpe.`, [...zGolpe, ...zElemento], 'Nenhum golpe registrado ainda.')}

    ${bloco('🔴 Gigantamax', `Chegar ao <b>nível ${ALVOS.gmaxNivel}</b> com a espécie em <b>${ALVOS.gmaxRuns} jornadas</b> diferentes.`,
      gmax, 'Nenhuma jornada chegou ao nível 50 ainda.')}

    ${secaoBadges()}

    ${secaoEspecies()}

    <p class="small muted" style="margin-top:18px">Jornadas que contam: <b>${n(jornadas.filter(j => j.dificuldade !== MODO_NAO_CONTA).length)}</b>
      de ${n(jornadas.length)} na carreira.</p>
  </main>`;
}


/* Badges: conquistas de longo prazo que PAGAM alguma coisa na próxima jornada (badges.js). Mostra as conquistadas
   primeiro, depois as que já começaram; as que nem começaram ficam escondidas pra tela não virar lista de spoiler. */
function secaoBadges() {
  const todas = badgesDaCarreira(G.S?.registro);
  const ganhas = todas.filter(b => b.completo);
  const emCurso = todas.filter(b => !b.completo && (b.n > 0 || !b.oculta)).sort((a, b) => b.fracao - a.fracao);
  const v = vantagensDe(ganhas);
  const premio = r => {
    const p = [...Object.entries(r.itens || {}).map(([k, n]) => `${esc(ITEMS[k]?.name || k)}${n > 1 ? ` ×${n}` : ''}`)];
    if (r.dinheiro) p.push(`₽${r.dinheiro.toLocaleString('pt-BR')}`);
    if (r.lojaGratis) p.push('loja de graça pra sempre');
    return p.join(' · ') || '—';
  };
  const linha = b => `<li class="${b.completo ? 'feito' : ''}">
    <span class="sem-sprite badge-ic" aria-hidden="true">${b.icone}</span>
    <b>${b.completo ? '🏅 ' : ''}${esc(b.nome)}</b>
    ${b.completo ? '' : barra(b.n, b.alvo)}
    <small>${esc(b.desc)}<br><i>Dá: ${premio(b.recompensa || {})}</i>${b.completo ? '' : ` · ${n(b.n)}/${n(b.alvo)}`}</small></li>`;
  return `<h3 class="passo">🏅 Badges</h3>
    <p class="muted small">Cada badge conquistada vira <b>vantagem na próxima jornada</b>: item ou dinheiro no começo.
      Dá pra abrir mão delas na criação — quem joga sem ganha <b>10% a mais de pontos</b> no ranking.</p>
    ${ganhas.length ? `<p class="small">Conquistadas: <b>${n(ganhas.length)}</b> de ${n(todas.length)} · começa cada jornada com
      ${esc([...Object.entries(v.itens).map(([k, q]) => `${ITEMS[k]?.name || k} ×${q}`), v.dinheiro ? `₽${v.dinheiro}` : ''].filter(Boolean).join(' · ') || '—')}</p>` : ''}
    <ul class="quase conquistas">${[...ganhas, ...emCurso].map(linha).join('')}</ul>`;
}
/* Espécies jogáveis: quantas você já desbloqueou e quanto falta pras próximas. Esta lista já existia na tela de
   criação, mas é aqui que se procura "o que falta pra eu conseguir X" — e é a conquista de conta mais antiga do
   jogo. **Desbloquear só conta em jornada Roguelike**; usar a espécie desbloqueada vale em qualquer modo. */
function secaoEspecies() {
  const prog = progressoRoguelike(carregarCarreira().jornadas);
  const ja = desbloqueadasDaConta();   // permanentes: não somem se você apagar a jornada que as conquistou
  const faltam = prog.filter(p => !p.desbloqueada).slice(0, 15);
  const linha = p => `<li class="${p.desbloqueada ? 'feito' : ''}">
    ${p.id ? `<img src="${SPR(p.id)}" alt="" loading="lazy">` : '<span class="sem-sprite" aria-hidden="true"></span>'}
    <b>${p.desbloqueada ? '🔓 ' : ''}${esc(fmt(p.especie))}</b>
    <div class="bar"><div class="fill" style="width:${p.fracao * 100}%"></div></div>
    <small>${esc(textoProgresso(p))}</small></li>`;
  return `<h3 class="passo">🔓 Espécies pra jogar</h3>
    <p class="muted small">Desbloqueie derrotando <b>${DESBLOQUEIO.derrotados}</b>, fazendo amizade com <b>${DESBLOQUEIO.amigos}</b>,
      ou evoluindo pra ela <b>${DESBLOQUEIO.evolucaoMeio}×</b> (forma do meio) / <b>${DESBLOQUEIO.evolucaoFinal}×</b> (forma final).
      Só <b>jornadas Roguelike</b> contam pra desbloquear — mas, uma vez desbloqueada, a espécie vale em <b>qualquer modo</b>.</p>
    <p class="small muted">Desbloqueadas até agora: <b>${n(ja.length)}</b> (além dos iniciais, Pikachu e Eevee).
      Elas ficam gravadas na conta: apagar a jornada que conquistou uma <b>não tira</b> a espécie.</p>
    ${faltam.length ? `<ul class="quase conquistas">${faltam.map(linha).join('')}</ul>`
      : '<p class="small muted">Nenhuma espécie em progresso ainda: jogue uma jornada Roguelike pra começar.</p>'}`;
}

// sprite da espécie, quando a carreira souber o id dela (registro.ids guarda isso desde sempre)
function spriteDaEspecie(jornadas, especie) {
  for (const j of jornadas) { const id = j.registro?.ids?.[especie]; if (id) return SPR(id); }
  return null;
}
