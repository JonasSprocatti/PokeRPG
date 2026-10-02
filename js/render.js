/* ============ render: jogo ============ */
// Re-render total a partir de G (sem diffing): ficha à esquerda, cena (zona ou batalha) + log + ações à direita.
import { G, zone, rotulo, nm, dificuldadeDe, centroPokemon, rotasAtuais, emCampo, vivos } from './estado.js';
import { OFICIOS } from './oficios.js';
import { $, semAnimacao } from './ui.js';
import { SPR, SPR_SHINY, SPR_SHINY_COSTAS, SPR_3D, SPR_3D_SHINY, SPR_ANIM, SPR_ANIM_COSTAS, SPR_ANIM_SHINY, SPR_ANIM_SHINY_COSTAS, espelhar, outroServidor, ITEM_SPR, ITEM_SPR_MEGA, ITEM_SPR_Z, ITEM_SPR_VINCULO, ITEM_PEDRA_MEGA, ITEM_CRISTAL_Z, ITEM_VINCULO, ITEM_ERRO, BOLAS, DIFICULDADES, STATS, STAT_PT, STAGE_SHORT, TYPE_PT, TC, DARK_TEXT, CLS_PT, NATURES, ST_SHORT, ITEMS, MISSOES, ORDENS, porCategoria } from './dados.js';
import { estiloSpriteAtual } from './ajustes.js';
import { genDe, dadosDaGen, pokedexDaRota, somarRegistros, textoTaxa, REVELA_DERROTADOS, rotaLiberaCaca, progressoCaca, cacaDaRota, repelenteAtivo, semSelvagens } from './mapas.js';
import { carregarCarreira, versaoCarreira } from './carreira.js';
import { telasVisiveis } from './navegacao.js';
import { temNovidade } from './novidades.js';
import { IMPL } from './habilidades.js';
import { urlDeImagem } from './mp-sanear.js';   // endereço de sprite dentro de `onerror=` precisa ser de servidor conhecido
import { felicidadeDe, comoEvolui, FELICIDADE_EVOLUCAO } from './evolucao.js';
import { natureLabel, tetoDaEquipe, zonaLiberada, ameacaDe, alvoPorAmeaca, situacaoMissoes, climaDe, CLIMAS, terrenoDe, TERRENOS, NOME_LADO, precoItem, precoVenda, MAX_RAPIDOS, rotaEsgotada, vantagemDoGolpe, golpeDoClima, golpeDoTera, golpeDoBattleBond, golpesPermitidos, motivoBloqueio, resumoTravas } from './regras.js';
import { syncGet, loadAbility } from './api.js';
import { htmlJogo, aplicarLayout, tituloPainel } from './paineis.js';
import { megasDoJogador, avisoDaMegaDoJogador, nomeDaMecanica } from './mega.js';
import { gimmicksNaLoja } from './carreira.js';
import { terasDisponiveis } from './tera.js';
import { zDisponiveis, avisoDoZ, primeiroTipoZ } from './zmove.js';
import { podeGigantamax } from './dynamax.js';
import { escondidos, MAX_ESCONDIDOS } from './esconderijo.js';
import { ovos, MAX_OVOS } from './ovos.js';
import { situacaoDoEvento, formatarEspera, dataBR } from './evento.js';
import { resumoDoChefe, nivelDoChefe } from './boss.js';
import { linhaItensDoChefe } from './itens-raide.js';
import { progressoRastreado } from './rastreio.js';
import { estiloDaCena, nomeDoClima } from './cenario.js';
import { clamp, esc, fmt } from './util.js';

// sprite certo pro Pokémon (shiny ou não). Se o shiny não existir (formas raras), `onerror` cai no normal.
// Costas: Gen 8+ não tem sprite de costas — aí usa a frente espelhada (classe .flip).
// `espelhar` em tudo que vem de `m.data`: save e cache antigos guardam o endereço velho das imagens (dados.js)
// `formaSprite` = id do sprite da forma de batalha (Castform com o tempo, golpe.ajustarForma); o shiny precisa dele porque monta a URL pelo id
/* Estilo do sprite (ajustes.estiloSpriteAtual, pedido do usuário): 3D e animado sempre montados pelo id, igual
   ao shiny — nunca leem m.data.sprite, porque nem "home" nem "showdown" existem garantido pros dados guardados
   de formas antigas. Se a imagem não existir de verdade pra esse Pokémon/forma, imgMon() já cai sozinho no
   sprite 2D clássico no 2º erro de <img>. */
/* Sprite de um item na mochila/loja/ficha. Pedra Mega e Cristal Z são itens ÚNICOS no jogo (dados.js), mas a
   PokéAPI tem sprite de verdade por espécie/tipo (dados-item-sprites.js) — passando `m` (o Pokémon que segura ou
   seguraria o item) o ícone vira a pedra/cristal certo em vez do genérico. Sem `m` (contexto não sabido ainda),
   cai no genérico de sempre — nunca quebra por falta de contexto. */
export const spriteItem = (k, m) => k === ITEM_PEDRA_MEGA ? ITEM_SPR_MEGA(m?.data?.speciesName)
  : k === ITEM_CRISTAL_Z ? ITEM_SPR_Z(primeiroTipoZ(m))
  : k === ITEM_VINCULO ? ITEM_SPR_VINCULO
  : ITEM_SPR(k);
export const spriteFrente = m => {
  const estilo = estiloSpriteAtual();
  if (estilo === 'animado') return m.shiny ? SPR_ANIM_SHINY(m.formaSprite || m.id) : SPR_ANIM(m.formaSprite || m.id);
  if (estilo === '3d') return m.shiny ? SPR_3D_SHINY(m.formaSprite || m.id) : SPR_3D(m.formaSprite || m.id);
  return m.shiny ? SPR_SHINY(m.formaSprite || m.id) : espelhar(m.data.sprite);
};
// "home" (3D) não tem sprite de costas: cai pra null, e quem chama já sabe cair pra frente + flip. O animado
// (showdown) TEM costas de verdade, então usa a própria.
export const sprCostas = m => {
  const estilo = estiloSpriteAtual();
  if (estilo === 'animado') return m.shiny ? SPR_ANIM_SHINY_COSTAS(m.formaSprite || m.id) : SPR_ANIM_COSTAS(m.formaSprite || m.id);
  if (estilo === '3d') return null;
  return m.data.back ? (m.shiny ? SPR_SHINY_COSTAS(m.formaSprite || m.id) : espelhar(m.data.back)) : null;
};
/* Dois planos B, nesta ordem: (1) o MESMO arquivo no outro servidor de imagens — cobre CDN fora do ar ou
   bloqueado na rede de quem joga; (2) a sprite normal — cobre shiny que não existe pra aquela forma. Sem o
   primeiro, uma falha do servidor deixava o Pokémon como ícone quebrado mesmo com a imagem disponível ali ao
   lado, no outro endereço. `dataset.f` marca que a primeira tentativa já foi feita. */
/* Os três endereços passam por `urlDeImagem` (mp-sanear): dois deles entram DENTRO de um `onerror="…src='AQUI'"`,
   onde uma apóstrofe no meio do endereço já é código rodando. No single player a sprite vem da PokéAPI e nunca
   teve aspa nenhuma; na SALA ela vem do estado que outro jogador publicou — e aí era XSS. Endereço fora dos
   servidores de sprite vira vazio, que é o mesmo caminho de "sprite não carregou" que já existia. */
export const imgMon = (m, cls, src) => `<img class="${cls}" src="${urlDeImagem(src)}" alt="${esc(fmt(m.name))}${m.shiny ? ' (shiny)' : ''}" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${urlDeImagem(outroServidor(src))}'}else{this.onerror=null;this.src='${urlDeImagem(espelhar(m.data.sprite))}'}">`;
const brilho = m => m.shiny ? '<span class="shiny" title="Shiny">✨</span>' : '';
/* ♂/♀ (regras.sortearGenero). Sem gênero (Magnemite, lendários) e save de antes disto existir não mostram nada.
   O símbolo sai de uma COMPARAÇÃO, nunca de interpolar `m.genero`: na sala esse campo vem de outro jogador. */
export const sexo = m => m?.genero === 'f' ? '<span class="sexo f" title="Fêmea">♀</span>'
  : m?.genero === 'm' ? '<span class="sexo m" title="Macho">♂</span>' : '';
/* Botão ⚡ da Mega Evolução: só aparece pra quem já conquistou a Pedra Mega daquela espécie (conquistas.js) e
   ainda não usou nesta batalha. Não gasta o turno — por isso fica junto dos golpes, e não no lugar de um deles.
   `megasDoJogador()` não vai à rede: lê a tabela e o progresso da conta. */
function botaoMega(dis) {
  const formas = megasDoJogador(), tipos = terasDisponiveis(), zs = zDisponiveis(), gmax = podeGigantamax();
  const falta = [avisoDaMegaDoJogador() && `a Mega da sua espécie está conquistada, mas ${avisoDaMegaDoJogador()}`,
    avisoDoZ() && `você tem Z-Move conquistado, mas ${avisoDoZ()}`].filter(Boolean);
  // conquistou mas falta o item: dizer o que falta é melhor que esconder o botão (esconder vira "não funciona")
  const aviso = falta.length ? `<p class="small muted">⚡ ${esc(falta.join(' · '))}.</p>` : '';
  if (!formas.length && !tipos.length && !zs.length && !gmax) return aviso;
  const f = formas[0], varias = formas.length > 1;
  return `${aviso}<div class="subrow">
    ${formas.length ? `<button class="btn mega-btn" data-act="mega" ${dis}>⚡ ${esc(nomeDaMecanica(f))}${varias ? '' : `: ${esc(f.nome)}`}</button>` : ''}
    ${tipos.length ? `<button class="btn tera-btn" data-act="tera" ${dis}>💎 Terastalizar</button>` : ''}
    ${zs.length ? `<button class="btn z-btn" data-act="zmove" ${dis}>🌀 Z-Move</button>` : ''}
    ${podeGigantamax() ? `<button class="btn gmax-btn" data-act="gmax" ${dis}>🔴 Gigantamax</button>` : ''}
    <span class="small muted">${formas.length || tipos.length ? 'Mega e Tera não gastam o turno' : ''}${zs.length ? `${formas.length || tipos.length ? ' · ' : ''}o Z-Move É o seu turno` : ''}</span></div>`;
}

export const badge = t => `<span class="ty" style="--c:${TC[t] || '#888'};--tc:${DARK_TEXT.has(t) ? '#1c1f3a' : '#fff'}">${TYPE_PT[t] || esc(fmt(t))}</span>`;
/* Os tipos que a tela mostra. Quem terastalizou tem UM tipo só (regras.tiposDefensivos) — mostrar os antigos
   faria a pessoa calcular a fraqueza errada, que é justamente o que a Tera veio mudar. O 💎 marca a diferença. */
export const badgesDeTipo = m => m?.tera
  ? `<span class="ty tera-ty" style="--c:${TC[m.tera] || '#888'};--tc:${DARK_TEXT.has(m.tera) ? '#1c1f3a' : '#fff'}">💎 ${TYPE_PT[m.tera] || esc(fmt(m.tera))}</span>`
  : (m?.data?.types || []).map(badge).join('');
/* `chave` (opcional) dá um id estável ao preenchimento, pra animarBarrasHP() achar a MESMA barra entre um
   render() e o próximo (o jogo não faz diffing — cada render() destrói e recria o DOM inteiro — então sem um id
   pra amarrar a barra velha na nova não tem "de onde" animar). Sem chave (amizade, barra de XP…), sem animação:
   só a HP muda com pausa suficiente durante a narração pra fazer diferença ver a transição. */
function hpbar(m, chave = null) {
  const pct = clamp(m.hp / m.stats.hp * 100, 0, 100), col = pct > 50 ? '#5FB36A' : pct > 20 ? '#F7C548' : '#E4572E';
  return `<div class="hp"><span>HP</span><div class="bar"><div class="fill${chave ? ' fill-hp' : ''}" ${chave ? `id="hp-fill-${chave}"` : ''} style="width:${pct}%;background:${col}"></div></div><span>${m.hp}/${m.stats.hp}</span></div>`;
}
export function chipsFor(m) {
  let h = m.status ? `<span class="st st-${m.status}">${m.status === 'poison' && m.vol?.toxico ? 'TÓX' : ST_SHORT[m.status]}</span>` : '';
  if (m.vol?.conf) h += '<span class="st">CONF</span>';
  // golpes especiais (especiais.js): carga, recarga, fúria, semente, foco
  if (m.vol?.carregando) h += `<span class="st" title="Ataca sozinho no próximo turno">CARREGANDO</span>`;
  if (m.vol?.recarga) h += `<span class="st" title="Não age no próximo turno">RECARGA</span>`;
  if (m.vol?.furia) h += `<span class="st" title="Repete o golpe e depois fica confuso">FÚRIA</span>`;
  if (m.vol?.semente != null) h += `<span class="st" title="Perde 1/8 do HP por turno">SEMENTE</span>`;
  if (m.vol?.paixao) h += `<span class="st" title="Metade dos turnos não consegue atacar">PAIXÃO</span>`;
  if (m.vol?.foco) h += `<span class="st" title="Crítico mais fácil">FOCO</span>`;
  for (const [s, v] of Object.entries(m.vol?.stages || {})) if (v) h += `<span class="stg ${v > 0 ? 'up' : 'down'}">${STAGE_SHORT[s]} ${v > 0 ? '+' : ''}${v}</span>`;
  return `<div class="chips">${h}</div>`;
}
// barra de amizade (só aparece no selvagem depois do primeiro petisco)
const amizadeBar = m => m.amizade ? `<div class="hp amz" title="Amizade"><span>♥</span><div class="bar"><div class="fill" style="width:${clamp(m.amizade, 0, 100)}%"></div></div><span>${m.amizade}/100</span></div>` : '';
function plate(m, chave) {
  const label = m === G.S.player || G.S.aliados?.includes(m) ? (m.nick || fmt(m.name)) : fmt(m.name);
  /* O TIPO de quem está em campo fica visível na plaquinha. Estava só na ficha, a um clique de distância — e é
     justamente o dado que explica por que o seu golpe acertou fraco. Usa `badgesDeTipo`, então mostra o tipo
     Tera de quem terastalizou, que é o que vale pra defesa. */
  return `<div class="pl-top"><span>${brilho(m)}${esc(label)}${sexo(m)}</span><span>Nv. ${m.level}</span></div>
    <div class="types pl-tipos">${badgesDeTipo(m)}</div>${hpbar(m, chave)}${blocoChefe(m)}${amizadeBar(m)}${chipsFor(m)}`;
}
// chefe do evento semanal (boss.js): barra da couraça, fase e o aviso do golpe carregado — o que decide o turno
function blocoChefe(m) {
  const r = resumoDoChefe(m); if (!r) return '';
  return `<div class="boss-info">
    ${r.temCoura ? `<div class="hp boss-coura ${r.exposto ? 'exposto' : ''}" title="Couraça: enquanto de pé, o chefe leva pouco dano. Quando zera, vem a Ruptura (dano maior)."><span>🛡</span><div class="bar"><div class="fill" style="width:${Math.round(r.couraFracao * 100)}%"></div></div><span>${r.exposto ? 'EXPOSTO' : r.couraAtiva ? '' : '—'}</span></div>`
      : r.exposto ? '<div class="boss-fase" style="color:#e4572e">💥 EXPOSTO: dano ×1,5</div>' : ''}
    ${r.pontoFraco ? `<div class="boss-fraco" title="Só golpes deste tipo machucam de verdade; os outros são reduzidos${r.prato ? '. O Prato é sorteado de novo a cada 2 ações' : ''}">${r.prato ? '🏛 Prato da vez' : '🎯 Ponto fraco'}: ${badge(r.pontoFraco)}</div>` : ''}
    ${r.anula ? `<div class="boss-fraco" title="${esc(r.textoAnula)}">🚫 Imune a: ${r.anula.map(badge).join(' ')}</div>` : ''}
    ${r.temReverso ? (r.reverso ? '<div class="boss-carga" role="alert">🔄 MUNDO REVERSO: a tabela de tipos está INVERTIDA agora!</div>' : '<div class="boss-fase">🔄 Mundo Reverso (alterna a cada poucas ações)</div>') : ''}
    ${r.adaptado !== undefined ? `<div class="boss-fraco" title="O tipo do último golpe que ele recebeu é resistido no seguinte">🧬 Adaptado a: ${r.adaptado ? badge(r.adaptado) : '—'}</div>` : ''}
    ${r.regenera ? `<div class="boss-fase" title="Recupera HP a cada ação enquanto não estiver exposto">🧬 Regenera (exponha-o pra parar)</div>` : ''}
    ${r.escudo ? '<div class="boss-fase" style="color:#1c7ed6">🛡 Escudo Astral ativo: o próximo golpe carregado é reduzido</div>' : ''}
    <div class="boss-fase">☄ Fase ${r.fase}/3</div>
    ${r.carregando ? `<div class="boss-carga" role="alert">⚠ Carregando o ${esc(r.rotuloCarga)}! Faltam <b>${r.faltaParaInterromper}</b> de dano neste turno pra interromper.</div>` : ''}
  </div>`;
}
// caixa do evento semanal na rota final: sprite do chefe com brilho, e o botão (ou quanto falta pra tentar de novo)
function blocoEvento(g) {
  const sit = situacaoDoEvento({ dificuldade: dificuldadeDe(G.S), gen: g }); if (!sit.evento || sit.motivo === 'modo') return '';
  const ev = sit.evento;
  if (sit.motivo === 'em-breve') return `<div class="chefe-box evento em-breve"><img src="${SPR(ev.formaId)}" alt=""><div><b>☄ EM BREVE: ${esc(ev.nome)}</b>
    <small>O primeiro chefe da semana chega em <b>${dataBR(sit.inicio)}</b> (segunda-feira, meia-noite de Brasília). Prepare o time: é muito difícil.</small></div><button class="btn ghost sm" disabled>🗓 ${dataBR(sit.inicio)}</button></div>`;
  const botao = sit.ok ? `<button class="btn sm" data-act="evento" ${G.busy ? 'disabled' : ''}>☄ Desafiar</button>`
    : `<button class="btn ghost sm" disabled title="Uma tentativa a cada 8 horas">⏳ ${formatarEspera(sit.esperaMs || 0)}</button>`;
  return `<div class="chefe-box evento"><img src="${SPR(ev.formaId)}" alt=""><div><b>☄ EVENTO DA SEMANA: ${esc(ev.nome)}</b> <span class="muted">Nv. ${nivelDoChefe(G.S.player.level)}</span>
    <small>${esc(ev.resumo)}</small>
    ${linhaItensDoChefe(ev, G.S.bag)}
    <small>Muito difícil, sem fuga. Vencer dá ${esc(fmt(ev.especie))} na Pokédex, a insígnia ${esc(ev.badge.nome)} e um prêmio.${sit.ok ? '' : ' Uma tentativa a cada 8 horas.'}
    Sem estar nesta Gen? Use a <button class="link" data-act="arena" ${G.busy ? 'disabled' : ''}>🏟 Arena do Chefe</button> com os Pokémon do seu Hall da Fama.</small></div>${botao}</div>`;
}
// barra no topo da batalha: número do turno + o que está acontecendo agora (lê G.B.vez, setado por turn())
function turnoBar(B, P, E) {
  const T = B.trainer;
  const fase = !G.busy ? 'Escolha sua ação'
    : B.vez === 'p' ? `${esc(rotulo(P))} está agindo`
    : B.vez === 'e' ? `${esc(rotulo(E))} está agindo`
    : B.vez === 't' ? `${esc(T.nome)} está mirando uma bola`
    // o aliado pode ter saído da equipe entre o `vez` e o render (Roguelike perde quem cai): índice vago não quebra
    : B.vez?.[0] === 'a' ? `${esc(rotulo(G.S.aliados[+B.vez.slice(1)]) || 'Seu aliado')} está agindo`
    : B.vez === 'fim' ? 'Fim do turno' : '…';
  // treinador: equipe (● em pé / ○ derrotado) e bolas que ainda restam
  // lendários (luta final do mapa) usam a mesma sequência do treinador, mas sem bolas
  const bolas = T && !T.lendarios ? ` <img src="${ITEM_SPR(T.bola)}" alt="${BOLAS[T.bola].nome}">×${T.bolas}` : '';
  const info = T ? `<span class="treinador" title="${T.lendarios ? 'Lendários que faltam' : 'Pokémon e bolas do treinador'}">${T.lendarios ? '⚡' : '🎯'} ${esc(T.nome)} <span class="equipe">${T.equipe.map(m => m.hp <= 0 ? '○' : '●').join('')}</span>${bolas}</span>` : '';
  // clima do campo (regras.CLIMAS): ícone + quantos turnos faltam
  const cl = climaDe(B.campo), te = terrenoDe(B.campo);
  const clima = cl ? `<span class="clima-selo" title="${esc(CLIMAS[cl].nome)}">${CLIMAS[cl].icone} ${esc(CLIMAS[cl].nome)} · ${B.campo.climaFixo ? 'da rota' : B.campo.turnos}</span>` : '';
  const terreno = te ? `<span class="clima-selo terreno" title="${esc(TERRENOS[te].nome)} (só vale pra quem está no chão)">${TERRENOS[te].icone} ${esc(TERRENOS[te].nome)} · ${B.campo.terrenoFixo ? 'da rota' : B.campo.terrenoTurnos}</span>` : '';
  // telas e armadilhas de cada lado (regras.LADO_VAZIO): 🛡 no seu, ⚔ no do inimigo
  const selosLado = ['jogador', 'inimigo'].map(k => {
    const l = B.campo?.lados?.[k]; if (!l) return '';
    const p = [];
    for (const campo of ['reflect', 'luz', 'veu', 'salvaguarda', 'neblina', 'vento']) if (l[campo] > 0) p.push(`${NOME_LADO[campo]} ${l[campo]}`);
    if (l.pedras) p.push('Pedras');
    if (l.espinhos) p.push(`Espinhos ×${l.espinhos}`);
    if (l.toxinas) p.push(`Toxinas ×${l.toxinas}`);
    return p.length ? `<span class="clima-selo lado-${k}" title="${k === 'jogador' ? 'No seu lado' : 'No lado do inimigo'}">${k === 'jogador' ? '🛡' : '⚔'} ${esc(p.join(' · '))}</span>` : '';
  }).join('');
  return `<div class="turno-bar"><span class="turno-n">Turno <b>${B.turn}</b></span>${clima}${terreno}${selosLado}${info}<span class="carteira-mini" title="Seu dinheiro" aria-label="Dinheiro: ${brl(G.S.money)}">💰 ${brl(G.S.money)}</span><span class="turno-fase ${!G.busy ? 'sua-vez' : ''}">${fase}</span></div>`;
}
// contador de desmaios do Médio pra cima: "2/3 livres", depois "precisa de Revive (tem N)"
function desmaiosTxt(S) {
  const regra = DIFICULDADES[dificuldadeDe(S)], livres = regra.desmaiosLivres, n = S.desmaios || 0;
  if (regra.permadeath) return '<br><span class="err">Sem segunda chance: desmaiou, a run acaba; aliado que desmaia é perdido.</span>';
  if (livres == null) return '';
  return n < livres ? `<br>Desmaios: <b>${n}/${livres}</b> livres.`
    : `<br><span class="${S.bag.revive ? '' : 'err'}">Desmaios: <b>${n}</b>. O próximo gasta um Revive (você tem ${S.bag.revive || 0})${S.bag.revive ? '' : ': sem Revive é Game Over'}.</span>`;
}
/* peças da ficha, usadas pra você e pra cada aliado */
function barraXp(M, GR, chave = null) {
  if (!GR) return '';
  const cur = M.exp - GR[M.level], need = M.level < 100 ? GR[M.level + 1] - GR[M.level] : 1;
  const pct = M.level < 100 ? clamp(cur / need * 100, 0, 100) : 100;
  return `<div class="hp xp"><span>XP</span><div class="bar"><div class="fill${chave ? ' fill-xp' : ''}" ${chave ? `id="xp-fill-${chave}"` : ''} style="width:${pct}%"></div></div><span>${M.level < 100 ? `faltam ${GR[M.level + 1] - M.exp}` : 'máx.'}</span></div>`;
}
function tabelaStats(M) {
  const [up, down] = NATURES[M.nature] || [];
  return `<table class="stats">
      <thead><tr><th>Atributo</th><th>Valor</th><th>Base</th><th>IV</th><th>EV</th></tr></thead>
      <tbody>${STATS.map(s => `<tr><td>${STAT_PT[s]} ${s === up ? '<span class="up" title="Natureza">▲</span>' : s === down ? '<span class="down" title="Natureza">▼</span>' : ''}</td><td class="v">${M.stats[s]}</td><td>${M.data.base[s]}</td><td>${M.ivs[s]}</td><td>${M.evs[s]}</td></tr>`).join('')}</tbody>
    </table>`;
}
function blocoHabilidade(M) {
  const abInfo = M.data.abilities.find(a => a.name === M.ability), abDesc = syncGet('ab:' + M.ability)?.effect;
  if (!abDesc && abInfo) loadAbility(abInfo).then(() => { if (G.S) renderSheet(); }).catch(() => {});
  return `<div class="sec"><h3>Habilidade: ${esc(fmt(M.ability))}</h3>
      <p class="small muted">${esc(abDesc || 'Carregando descrição…')} ${IMPL.has(M.ability) ? '<span class="impl">✓ ativa em batalha</span>' : '<em class="small impl-futura">(efeito em batalha: será ajustado em atualizações futuras)</em>'}</p></div>`;
}
// `quem` = 'p' ou índice do aliado — dá pra reordenar (▲▼, data-act="golpe-mover") a qualquer hora, mesmo em
// batalha: só muda a ORDEM na lista, não gasta turno nem golpe. Sem `quem` (não usado hoje) fica só leitura.
const listaGolpes = (M, quem) => `<div class="sec mlist"><h3>Golpes</h3>
      ${M.moves.map((m, i) => {
        // os botões ficam DENTRO do <summary> (junto do nome), então um clique neles também abriria/fecharia o
        // <details> (comportamento nativo do navegador pro clique em QUALQUER lugar do summary) — só
        // preventDefault (sem stopPropagation: o clique precisa seguir borbulhando até o listener em main.js).
        const mover = dir => `<button class="btn ghost sm mv-btn" data-act="golpe-mover" data-quem="${quem}" data-v="${i}" data-dir="${dir}" ${G.busy || (dir < 0 ? i === 0 : i === M.moves.length - 1) ? 'disabled' : ''} title="${dir < 0 ? 'Subir' : 'Descer'}" onclick="event.preventDefault()">${dir < 0 ? '▲' : '▼'}</button>`;
        // <b> mora dentro do MESMO item de grid que os botões de ordem (a linha do summary é grid 1fr/auto: nome × PP)
        return `<details><summary><span class="mv-nome">${quem != null ? `<span class="mv-ordem">${mover(-1)}${mover(1)}</span>` : ''}<b>${esc(fmt(m.name))}</b></span><span class="pp">PP ${m.ppLeft}/${m.pp}</span><small>${badge(m.type)} ${CLS_PT[m.cls]}, poder ${m.power ?? '—'}, precisão ${m.acc ?? '—'}</small></summary><p>${esc(m.desc)}</p></details>`;
      }).join('')}
    </div>`;
// aliado: resumo + seletor de ordem + ficha completa num <details> (aberto/fechado sobrevive ao re-render via G.abertos)
/* ⚔ Saga: o ofício e quem o inimigo está mirando. Sem isso a ameaça é invisível e não há como jogar com ela —
   a mecânica só existe pra quem joga se a tela disser quem está segurando a linha.
   `🎯` sai de `alvoPorAmeaca` com sorteio DESLIGADO (sorte: () => 1, nunca < RUIDO): mostra o alvo provável, não
   uma previsão de um sorteio que ainda vai acontecer. Só aparece no modo com a flag. */
export const modoComAmeaca = S => !!DIFICULDADES[dificuldadeDe(S)]?.ameaca;
export function seloOficio(m) {
  if (!modoComAmeaca(G.S) || !m?.oficio) return '';
  const o = OFICIOS[m.oficio]; if (!o) return '';
  const emPe = vivos(emCampo());
  const alvo = emPe.length > 1 ? alvoPorAmeaca(emPe, () => 1) : emPe[0];
  const mirado = G.B && alvo === m;
  return `<span class="oficio" title="${esc(o.nome)}: ${esc(o.funcao)}${mirado ? ' · é quem o inimigo está mirando agora' : ''}${G.B ? ` · ameaça ${Math.round(ameacaDe(m))}` : ''}">${o.emoji}${mirado ? ' 🎯' : ''}</span>`;
}
function cartaoAliado(A, i) {
  const ordem = A.ordem || 'livre';
  return `<div class="aliado ${ordem === 'fora' ? 'descansando' : ''}">
    <div class="aliado-top">${imgMon(A, '', spriteFrente(A))}<div><b>${brilho(A)}${esc(rotulo(A))}${sexo(A)}${seloOficio(A)}</b> <span class="muted small">Nv. ${A.level}${ordem === 'fora' ? ' · descansando' : ''}</span><div class="types">${badgesDeTipo(A)}</div>${hpbar(A, 'card-a' + i)}${barraXp(A, A.growth, 'card-a' + i)}${chipsFor(A)}</div></div>
    <label class="ordem">Ordem <select data-ordem="${i}" ${G.busy ? 'disabled' : ''}>${Object.entries(ORDENS).map(([k, o]) => `<option value="${k}" ${k === ordem ? 'selected' : ''}>${o.nome}</option>`).join('')}</select></label>
    <p class="small muted">${esc(ORDENS[ordem].desc)}</p>
    <details data-aliado="${i}" ${G.abertos.has(i) ? 'open' : ''}><summary>Ver ficha completa</summary>
      ${tabelaStats(A)}<p class="small muted" style="margin-top:6px">Natureza ${esc(natureLabel(A.nature))}.</p>${blocoItem(A, i)}${blocoEvolucao(A, A.evo)}${blocoHabilidade(A)}${listaGolpes(A, i)}
    </details>
    ${G.mode === 'explore' ? `<button class="btn ghost sm" data-act="despedir" data-v="${i}" ${G.busy ? 'disabled' : ''}>Despedir</button>` : ''}
  </div>`;
}
// Conteúdo de cada painel (as caixas e o lugar delas são de paineis.js). Títulos com número vão pro cabeçalho.
function renderFicha() {
  const S = G.S, P = S.player;
  tituloPainel('ficha', `${brilho(P)}${esc(P.nick || fmt(P.name))}`);
  $('#p-ficha').innerHTML = `
    <div class="ficha-me">
      ${imgMon(P, '', spriteFrente(P))}
      <div>
        <h2>${brilho(P)}${esc(P.nick || fmt(P.name))}${sexo(P)}${seloOficio(P)}</h2>
        <p class="sub">${P.nick ? esc(fmt(P.name)) + ', ' : ''}nível ${P.level}</p>
        <div class="types">${badgesDeTipo(P)}</div>
      </div>
    </div>
    <div class="bars">
      ${hpbar(P, 'ficha-p')}
      ${barraXp(P, S.meta.growth, 'ficha-p')}
      ${chipsFor(P)}
    </div>
    ${tabelaStats(P)}
    <p class="small muted" style="margin-top:6px">Natureza ${esc(natureLabel(P.nature))}. Vitórias: ${S.wins || 0}${S.treinadoresVencidos ? `, ${S.treinadoresVencidos} treinador${S.treinadoresVencidos > 1 ? 'es' : ''}` : ''}.<br>Modo <b title="${esc(DIFICULDADES[dificuldadeDe(S)].desc)}">${DIFICULDADES[dificuldadeDe(S)].nome}</b>${S.capturas ? ` · capturado ${S.capturas}×` : ''}.${desmaiosTxt(S)}</p>
    ${blocoItem(P, 'p')}
    ${blocoEvolucao(P, S.meta.evo)}
    ${blocoHabilidade(P)}
    ${listaGolpes(P, 'p')}`;
}
// item segurado (segurados.js): o que está na mão e um botão pra devolver pra mochila. `quem` = 'p' ou o índice do aliado
function blocoItem(M, quem) {
  const it = M.item && ITEMS[M.item];
  return `<div class="sec item-seg"><h3>Item segurado</h3>${it
    ? `<div class="seg-linha"><img src="${spriteItem(M.item, M)}" alt="" onerror="${ITEM_ERRO}"><span><b>${it.name}</b><small>${esc(it.desc)}</small></span>${G.mode === 'explore' ? `<button class="btn ghost sm" data-act="tirar-item" data-v="${quem}" ${G.busy ? 'disabled' : ''}>Tirar</button>` : ''}</div>`
    : semSegurar(quem)}</div>`;
}
// sem item na mão: se já tem algum na mochila, oferece equipar aqui mesmo; senão explica onde conseguir
function semSegurar(quem) {
  const naMochila = Object.entries(G.S.bag).filter(([k, n]) => n > 0 && ITEMS[k]?.segurado);
  if (G.mode !== 'explore' || !naMochila.length) return `<p class="small muted">Nenhum. Compre em <b>Abrir loja → 🎒 Para segurar</b> (ou ache explorando) e toque em “Segurar” na mochila.</p>`;
  return `<p class="small muted">Nenhum. Você tem na mochila:</p><div class="subrow">${naMochila.map(([k, n]) =>
    `<button class="btn ghost sm" data-act="segurar" data-v="${k}" data-quem="${quem}" ${G.busy ? 'disabled' : ''} title="${esc(ITEMS[k].desc)}">${ITEMS[k].name} ×${n}</button>`).join('')}</div>`;
}
// vínculo (amizade que algumas evoluções pedem) + como cada próxima forma evolui (evolucao.js)
function blocoEvolucao(M, arvore) {
  const f = felicidadeDe(M), evs = arvore ? comoEvolui(arvore, M.data.speciesName, k => ITEMS[k]?.name || fmt(k)) : [];
  // a rede caiu na hora de evoluir: o jogador precisa saber que não perdeu nada (progressao.verificarEvolucoesPendentes)
  const pendente = M.evoPendente ? '<br><span class="err">⏳ Evolução pendente: a conexão falhou. Acontece sozinha quando a rede voltar (explore ou lute pra tentar de novo).</span>' : '';
  return `<p class="small muted evo-info"><span title="Sobe com os níveis e as vitórias. Algumas evoluções pedem vínculo alto (${FELICIDADE_EVOLUCAO}).">♥ Vínculo <b>${f}</b>/255${f >= FELICIDADE_EVOLUCAO ? ' (alto)' : ''}</span>
    ${evs.length ? `<br>Evolui: ${evs.map(e => `<b>${esc(fmt(e.name))}</b> (${esc(e.texto)})`).join(' · ')}` : arvore ? '<br>Não evolui mais.' : ''}${pendente}</p>`;
}
function renderMissoes() {
  const MS = situacaoMissoes(MISSOES, G.S);
  tituloPainel('missoes', `Missões <span class="muted small">(${MS.feitas} concluída${MS.feitas === 1 ? '' : 's'})</span>`);
  /* A conquista de CONTA fixada (rastreio.js) fica no topo do painel de missões: é onde quem joga já olha pra
     saber "o que falta". Sem isso, acompanhar uma conquista longa exigia sair do jogo e abrir outra tela. */
  const R = progressoRastreado();
  $('#p-missoes').innerHTML = `
      ${R ? `<div class="missao rastreada"><b>📌 ${esc(R.nome)}</b><small>Conquista da conta — a recompensa cai nesta jornada.</small>
        <div class="hp mis"><span></span><div class="bar"><div class="fill" style="width:${Math.min(100, (R.fracao || 0) * 100)}%"></div></div><span>${R.alvo ? `${R.n}/${R.alvo}` : R.n}</span></div></div>` : ''}
      ${[...MS.ativas, ...MS.prontas].map(({ m, atual, alvo }) => `<div class="missao"><b>${esc(m.nome)}</b><small>${esc(m.desc)}</small><div class="hp mis"><span></span><div class="bar"><div class="fill" style="width:${atual / alvo * 100}%"></div></div><span>${atual}/${alvo}</span></div></div>`).join('') || '<p class="small muted">Nenhuma missão ativa agora.</p>'}
      ${MS.escondidas ? `<p class="small muted">🔒 ${MS.escondidas} ainda escondida${MS.escondidas === 1 ? '' : 's'}: aparecem conforme você derrota, faz amigos e vence Alfas.</p>` : ''}`;
}
function renderAliados() {
  const AL = G.S.aliados || [];
  // o teto vem do MODO (regras.tetoDaEquipe): o ⚔ Saga anda com uma comitiva de 4
  tituloPainel('aliados', `Aliados <span class="muted small">(${AL.length}/${tetoDaEquipe(G.S)})</span>`);
  const guardados = escondidos(G.S);
  $('#p-aliados').innerHTML = `${AL.length ? `<div class="aliados">${AL.map(cartaoAliado).join('')}</div>`
    : '<p class="small muted">Ninguém ainda. Em batalha contra um selvagem, abra a Mochila e ofereça um petisco que o tipo dele goste.</p>'}
    ${blocoOvos(G.S)}${blocoEsconderijo(AL, guardados)}`;
}
/* 🥚 Ovos (ovos.js): a barra mostra explorações andadas e nada mais. A espécie, o golpe herdado e o brilho são
   SEGREDO até chocar — é o que faz o jogador querer andar mais um pouco. Nada de `ovo.especie` aqui. */
function blocoOvos(S) {
  const lista = ovos(S);
  if (!lista.length) return '';
  const cheio = (S.aliados || []).length >= tetoDaEquipe(S) && escondidos(S).length >= MAX_ESCONDIDOS;
  return `<h4 class="bag-sec">🥚 Ovos <span class="muted small">(${lista.length}/${MAX_OVOS})</span></h4>
    ${lista.map(o => {
      const pronto = o.passos >= o.alvo;
      return `<div class="missao"><b>🥚 Ovo misterioso</b><small>${pronto
        ? (cheio ? 'Está trincando! Mas não há lugar: despeça alguém ou abra vaga no esconderijo.' : 'Está trincando — vai abrir a qualquer momento.')
        : 'Ninguém sabe o que tem dentro. Explore para chocar.'}</small>
        <div class="hp mis"><span></span><div class="bar"><div class="fill" style="width:${Math.min(100, o.passos / o.alvo * 100)}%"></div></div><span>${o.passos}/${o.alvo}</span></div></div>`;
    }).join('')}`;
}
/* 📦 Esconderijo (esconderijo.js): quem não está em campo espera aqui em vez de se despedir pra sempre.
   Só fora de batalha — trocar de time no meio da luta seria outra mecânica inteira. */
function blocoEsconderijo(AL, guardados) {
  const fora = G.mode === 'explore' && !G.busy;
  const teto = tetoDaEquipe(G.S);
  if (!guardados.length && AL.length < teto) return '';   // nada guardado e com vaga: não há o que mostrar
  return `<h4 class="bag-sec">📦 Esconderijo <span class="muted small">(${guardados.length}/${MAX_ESCONDIDOS})</span></h4>
    ${guardados.length ? `<div class="aliados esconderijo">${guardados.map((A, i) => `<div class="ali-card guardado">
      <img src="${espelhar(A.data.sprite)}" alt="" loading="lazy">
      <div><b>${brilho(A)}${esc(A.nick || fmt(A.name))}${sexo(A)}</b><small class="muted">Nv. ${A.level}</small>
      <div class="types">${badgesDeTipo(A)}</div></div>
      <button class="btn sm ${AL.length >= teto ? 'ghost' : ''}" data-act="esconderijo-trazer" data-v="${i}" ${fora && AL.length < teto ? '' : 'disabled'}
        title="${AL.length >= teto ? 'Equipe cheia: guarde alguém antes' : fora ? '' : 'Só fora de batalha'}">↩ Trazer</button>
    </div>`).join('')}</div>`
    : '<p class="small muted">Vazio. Aliados que não couberem na equipe podem esperar aqui, em vez de se despedir.</p>'}
    ${AL.length ? `<div class="subrow" style="margin-top:8px">${AL.map((A, i) =>
      `<button class="btn ghost sm" data-act="esconderijo-guardar" data-v="${i}" ${fora ? '' : 'disabled'}>📦 Guardar ${esc(A.nick || fmt(A.name))}</button>`).join('')}</div>` : ''}`;
}
// Mochila em divisões (dados.js CATEGORIAS_ITEM): cura, em batalha, para segurar, evolução, petiscos, especiais.
function renderMochila() {
  const S = G.S, bag = Object.entries(S.bag).filter(([k, n]) => n > 0 && ITEMS[k]);
  const botao = k => {
    const it = ITEMS[k];
    if (G.mode !== 'explore' || it.battle || it.afinidade || it.segurar) return '';
    const rot = it.segurado ? 'Segurar' : it.evo || it.troca ? 'Usar (evoluir)' : 'Usar';
    return `<button class="btn ghost sm" data-act="item" data-v="${k}" ${G.busy ? 'disabled' : ''}>${rot}</button>`;
  };
  // Vender (metade do preço de compra) ou Jogar fora (item sem preço de loja) — qualquer item pode, mesmo
  // os que só valem EM batalha (X Attack…) ou os de raide, que não têm botão de "Usar" fora dela.
  const botaoVender = k => {
    if (G.mode !== 'explore') return '';
    const preco = precoVenda(k, S);
    return `<button class="btn ghost sm" data-act="vender" data-v="${k}" ${G.busy ? 'disabled' : ''}>${preco ? `Vender ₽${preco}` : 'Jogar fora'}</button>`;
  };
  /* ⚡ item rápido: marca o item pra ele aparecer junto dos botões principais (barra de ações), com a tecla 1/2
     como atalho. Pedido de quem joga, no lugar de "subir e descer itens na mochila": o que incomodava era abrir
     a mochila e caçar a Poção no meio da lista a cada turno, não a ordem dela. */
  const botaoRapido = k => {
    if (G.mode !== 'explore') return '';
    const i = rapidosAtivos().indexOf(k), on = i >= 0;
    return `<button class="btn ghost sm ${on ? 'on' : ''}" data-act="rapido" data-v="${k}" ${G.busy ? 'disabled' : ''}
      title="${on ? `Tirar dos itens rápidos (hoje é a tecla ${i + 1})` : `Deixar à mão na barra de ações (até ${MAX_RAPIDOS})`}">⚡${on ? ` ${i + 1}` : ''}</button>`;
  };
  const linha = ([k, n]) => `<li><img src="${spriteItem(k, S.player)}" alt="" onerror="${ITEM_ERRO}"><span><b>${ITEMS[k].name}</b> ×${n}<small>${ITEMS[k].desc}</small></span><div class="bag-acoes">${botaoRapido(k)}${botao(k)}${botaoVender(k)}</div></li>`;
  $('#p-mochila').innerHTML = bag.length
    ? porCategoria(bag).map(c => `<h4 class="bag-div">${c.nome} <span class="muted">(${c.itens.length})</span></h4><ul class="bag">${c.itens.map(linha).join('')}</ul>`).join('')
    : '<p class="small muted">Vazia. Explore para achar itens ou passe na loja.</p>';
}
// nome antigo mantido: blocoHabilidade() chama renderSheet quando a descrição da habilidade chega da API
function renderSheet() { renderFicha(); renderMissoes(); renderAliados(); renderMochila(); }
function renderScene() {
  const sc = $('#scene');
  if (G.mode === 'battle' && G.B) {
    const E = G.B.enemy, P = G.S.player;
    /* A cena veste a cara da ROTA (cenario.js): céu, chão e luz de ambiente mudam entre caverna, mar, usina…
       É só aparência — nenhuma regra olha pra isso. A classe do clima existe pro CSS poder acrescentar detalhe
       (estrelas, brilho) sem precisar de mais variáveis. */
    const z = zone();
    sc.className = `scene battle clima-${nomeDoClima(z)}`;
    sc.setAttribute('style', estiloDaCena(z));
    // aliado descansando (ordem "fora") não aparece em campo; o índice `i` continua sendo o de S.aliados (ids mon-a{i})
    const B = G.B, AL = (G.S.aliados || []).map((A, i) => [A, i]).filter(([A]) => A.ordem !== 'fora');
    sc.innerHTML = `${turnoBar(B, P, E)}
      <div class="side foe"><div class="plate ${B.vez === 'e' ? 'agindo' : ''}">${plate(E, 'e')}</div>
        <div class="mon ${E.hp <= 0 ? 'fainted' : ''} ${E.dyna ? 'gigante' : ''}" id="mon-e"><div class="pad"></div>${imgMon(E, 'spr', spriteFrente(E))}</div></div>
      <div class="side me">
        <div class="mons-lado">
          <div class="mon ${P.hp <= 0 ? 'fainted' : ''} ${P.dyna ? 'gigante' : ''}" id="mon-p"><div class="pad"></div>${imgMon(P, `spr back ${sprCostas(P) ? '' : 'flip'}`, sprCostas(P) || spriteFrente(P))}</div>
          ${AL.map(([A, i]) => `<div class="mon mini ${A.hp <= 0 ? 'fainted' : ''}" id="mon-a${i}"><div class="pad"></div>${imgMon(A, `spr ${sprCostas(A) ? '' : 'flip'}`, sprCostas(A) || spriteFrente(A))}</div>`).join('')}
        </div>
        <div class="plates">
          <div class="plate ${B.vez === 'p' ? 'agindo' : ''}">${plate(P, 'p')}</div>
          ${AL.map(([A, i]) => `<div class="plate mini ${B.vez === 'a' + i ? 'agindo' : ''}">${plate(A, 'a' + i)}</div>`).join('')}
        </div></div>`;
  } else {
    const z = zone(), nv = G.S.player.level, c = z.chefe, venceu = !!G.S.chefes?.[z.id], g = genDe(G.S);
    sc.className = 'scene';
    // rota bloqueada: chip desativado com 🔒 e o nível pedido; ★ = rota final (lendários)
    // O Santuário (posVitoria) não abre por nível: só depois de vencer os lendários da Gen — por isso o rótulo dele
    // fala da vitória, e não de um nível que nunca destrancaria nada.
    const chip = o => { const ok = zonaLiberada(o, nv, G.S), porVitoria = !!o.posVitoria;
      const dica = ok ? '' : porVitoria ? `Abre depois que você vencer os lendários da Gen ${g}` : `Liberada no nível ${o.libera}`;
      return `<button class="chip ${o.id === z.id ? 'on' : ''} ${ok ? '' : 'trancada'} ${o.final ? 'final' : ''} ${porVitoria ? 'santuario' : ''}" data-act="zone" data-v="${o.id}" ${G.busy || !ok ? 'disabled' : ''} title="${dica}">${ok ? '' : '🔒 '}${o.final ? '★ ' : ''}${porVitoria ? '🏛 ' : ''}${o.name}<small>${ok ? `${o.min}–${o.max}` : porVitoria ? 'vença a Gen' : `Nv. ${o.libera}`}</small></button>`; };
    const lend = z.lendarios, fechada = (G.S.gensVencidas || []).includes(g);
    sc.innerHTML = `
      <div class="zone-head"><h2>${z.name}</h2><p><span class="gen-tag">Gen ${g} · ${dadosDaGen(g).regiao}</span> ${z.desc} Pokémon entre os níveis ${z.min} e ${z.max}.</p></div>
      <div class="zones">${rotasAtuais().map(chip).join('')}</div>
      ${rotaEsgotada(z, nv, dificuldadeDe(G.S)) ? '<p class="small muted">✔ <b>Rota esgotada:</b> você passou do dobro do nível daqui, então não aparece mais ninguém. A Pokédex da rota continua abaixo — e as outras rotas seguem normais.</p>' : ''}
      ${avisoRepelente(z)}
      ${pokedexRota(z)}
      ${c ? `<div class="chefe-box ${venceu ? 'vencido' : ''}"><img src="${SPR(c.id)}" alt=""><div><b>Alfa: ${c.nome}</b> <span class="muted">Nv. ${c.nivel}</span><small>${venceu ? '✓ Derrotado. Pode desafiar de novo pelo XP, sem prêmio.' : 'HP ×2 e +30% em todo o resto. Prêmio na primeira vitória.'}</small></div><button class="btn ${venceu ? 'ghost' : ''} sm" data-act="chefe" ${G.busy ? 'disabled' : ''}>⚔ Desafiar</button></div>` : ''}
      ${lend && G.S.player.level >= z.libera ? blocoEvento(g) : ''}
      ${lend ? `<div class="chefe-box lendarios ${fechada ? 'vencido' : ''}"><div class="lend-imgs">${lend.map((l, i) => `<img src="${SPR(l.id)}" alt="" class="${i === lend.length - 1 ? 'principal' : ''}" title="${esc(l.nome)}">`).join('')}</div><div><b>Lendários de ${dadosDaGen(g).regiao}</b> <span class="muted">Nv. ${lend[0].nivel}–${lend[lend.length - 1].nivel}</span><small>${fechada ? '✓ Gen fechada.' : `Até ${Math.min(4, lend.length)} lendários em sequência; ${esc(lend[lend.length - 1].nome)} por último, turbinado. Vencer fecha a Gen ${g}${DIFICULDADES[dificuldadeDe(G.S)].fimNaGen ? ' e encerra a run em vitória' : ''}.`}</small></div><button class="btn ${fechada ? 'ghost' : ''} sm" data-act="chefe" ${G.busy ? 'disabled' : ''}>⚔ Enfrentar</button></div>` : ''}`;
  }
}
// O que você já sabe de cada espécie: todas as jornadas da carreira + a atual. A parte da carreira fica guardada
// até a carreira mudar (versaoCarreira) — ler e somar tudo a cada render seria desperdício.
let saberCarreira = null;
function conhecimento() {
  if (saberCarreira?.v !== versaoCarreira()) {
    saberCarreira = { v: versaoCarreira(), soma: somarRegistros(carregarCarreira().jornadas.map(j => j.registro)) };
  }
  return somarRegistros([saberCarreira.soma, G.S.registro]);
}
// Repelente ativo: quantas explorações faltam e o que ele está fazendo nesta rota (mapas.js)
function avisoRepelente(z) {
  const r = repelenteAtivo(G.S); if (!r) return '';
  const fora = semSelvagens(G.S, z);
  const txt = r.tipo === 'total' ? 'Nenhum selvagem aparece'
    : fora ? `Só <b>${esc(fmt(r.especie))}</b> passaria — e ele não vive nesta rota, então nenhum selvagem aparece aqui`
    : `Só <b>${esc(fmt(r.especie))}</b> aparece`;
  return `<p class="small repel-aviso">🚫 <b>Repelente ativo</b> · ${txt} · restam <b>${r.passos}</b> explorações. Treinadores, itens e dinheiro seguem normais.</p>`;
}
// Caça Shiny (só no modo ligado na criação): com a rota inteira revelada, escolha uma espécie e só ela aparece.
function blocoCaca(z, dex) {
  const S = G.S; if (!S.cacaShiny) return '';
  const saber = conhecimento(), alvo = cacaDaRota(S, z);
  if (!rotaLiberaCaca(z, saber)) {
    const { reveladas, total } = progressoCaca(z, saber);
    return `<p class="small muted caca-prog">🎯 <b>Caça Shiny</b>: revele todas as espécies desta rota pra escolher qual vai aparecer (${reveladas}/${total}).</p>`;
  }
  // mesma exclusão de mapas.cacaveisDaRota (mítico/lendário raro demais pra valer como alvo de caça)
  const opcoes = dex.filter(p => !p.mitico && !p.lendario).map(p => `<button class="btn ${p.n === alvo ? '' : 'ghost'} sm" data-act="caca" data-v="${esc(p.n)}">${esc(fmt(p.n))}</button>`).join('');
  return `<div class="caca-box ${alvo ? 'on' : ''}"><p class="small"><b>🎯 Caça Shiny liberada nesta rota!</b> ${alvo ? `Só aparece <b>${esc(fmt(alvo))}</b>.` : 'Escolha quem vai aparecer:'} <span class="muted">Muda só o selvagem: treinadores, itens e dinheiro continuam iguais.</span></p>
    <div class="subrow">${opcoes}${alvo ? '<button class="btn ghost sm" data-act="caca" data-v="">✕ Parar a caça</button>' : ''}</div></div>`;
}
// Pokédex da rota: "?" = nunca enfrentou; silhueta = já enfrentou; colorido + taxa = REVELA_DERROTADOS derrotados
function pokedexRota(z) {
  const dex = pokedexDaRota(z, conhecimento()), vistos = dex.filter(p => p.estado !== 'oculto').length;
  const item = p => p.estado === 'oculto'
    ? `<div class="dexr oculto ${p.mitico ? 'mitico' : ''}" title="${p.mitico ? 'Algo muito raro vive aqui…' : 'Ainda não encontrado'}"><span>${p.mitico ? '✦' : '?'}</span></div>`
    /* Quem você já encontrou vira BOTÃO: abre a ficha dele na Pokédex (tela-pokedex.abrirNaPokedex).
       Se ele já está registrado, a ficha já é sua — e era estranho ver o bicho ali e não poder olhar. */
    : `<button class="dexr ${p.estado} ${p.mitico ? 'mitico' : ''}" data-act="dex-rota" data-v="${p.id}" title="${esc(fmt(p.nome))}${p.estado === 'revelado' ? ` · ${textoTaxa(p.taxa)} dos encontros` : ` · derrote ${REVELA_DERROTADOS - Math.min(p.derrotados, REVELA_DERROTADOS)} pra ver a taxa`} · clique pra ver na Pokédex">
        <img src="${SPR(p.id)}" alt="" loading="lazy"><small>${esc(fmt(p.nome))}</small>${p.estado === 'revelado' ? `<b class="taxa">${textoTaxa(p.taxa)}</b>` : `<i class="falta">${Math.min(p.derrotados, REVELA_DERROTADOS)}/${REVELA_DERROTADOS}</i>`}</button>`;
  return `<div class="dex-rota"><p class="small muted">Pokédex da rota: <b>${vistos}/${dex.length}</b> encontrados.</p>
    ${blocoCaca(z, dex)}
    <ul class="dex-legenda small muted">
      <li><b>?</b> vive nesta rota, mas você ainda não encontrou (pode ser comum ou raro: explore mais)</li>
      <li><b>Silhueta</b> já enfrentou; o número mostra quantos derrotou de ${REVELA_DERROTADOS}</li>
      <li><b>Colorido</b> ${REVELA_DERROTADOS} derrotados (somando suas jornadas): mostra a chance de aparecer aqui</li>
      ${dex.some(p => p.mitico) ? '<li><b>✦</b> algo muito raro vive aqui…</li>' : ''}
    </ul>
    <div class="dexr-grade">${dex.map(item).join('')}</div></div>`;
}
/* Os itens rápidos que valem AGORA: marcados na mochila (S.rapidos) e que ainda estão nela. Item que acabou sai
   da barra sozinho e volta se você comprar outro — a marca continua gravada. */
const rapidosAtivos = () => (G.S?.rapidos || []).filter(k => ITEMS[k] && G.S.bag?.[k] > 0);
/* A barra de atalho: vai junto dos botões principais (Explorar/Centro/Loja e Mochila/Fugir), e as teclas 1 e 2
   clicam nesses mesmos botões (main.js). Item que não serve no momento não é escondido nem desabilitado: quem
   usa recebe o aviso de `useItem` ("só funciona durante uma batalha") e, em batalha, o turno NÃO é gasto. */
function barraRapidos(dis) {
  const lista = rapidosAtivos(); if (!lista.length) return '';
  const act = G.mode === 'battle' ? 'item-b' : 'item';
  return `<div class="subrow rapidos">${lista.map((k, i) => `<button class="item-btn rapido" data-act="${act}" data-v="${k}" data-rapido="${i + 1}" ${dis}
    title="${esc(ITEMS[k].desc)}"><img src="${spriteItem(k, G.S.player)}" alt="" onerror="${ITEM_ERRO}"><b>${ITEMS[k].name}</b><small>×${G.S.bag[k]} · tecla ${i + 1}</small></button>`).join('')}</div>`;
}
function renderActions() {
  const S = G.S, a = $('#actions'), dis = G.busy ? 'disabled' : '';
  if (G.mode === 'battle' && G.B) {
    const P = S.player;
    // arrastado pra fora da luta (Roar & cia.) com aliados ainda lutando: não há o que escolher, só assistir o turno
    if (P.vol?.retirado) {
      a.innerHTML = `<p class="small muted">${nm(P)} foi tirado da luta. Os aliados continuam sem você.</p><div class="subrow"><button class="btn big" data-act="passar" ${dis}>⏭ Assistir o turno</button></div>`;
      return;
    }
    if (G.panel === 'bag') {
      const E = G.B.enemy, T = G.B.trainer;
      const items = Object.entries(S.bag).filter(([k, n]) => n > 0 && ITEMS[k] && !ITEMS[k].candy && !ITEMS[k].afinidade && !ITEMS[k].evo && !ITEMS[k].troca && !ITEMS[k].segurar);
      const petiscos = Object.entries(S.bag).filter(([k, n]) => n > 0 && ITEMS[k]?.afinidade);
      // petisco: destaca os que o tipo do alvo gosta
      const gosta = k => E.data.types.some(t => ITEMS[k].afinidade.includes(t));
      const secPetisco = T?.lendarios ? '<p class="small muted">Lendários não se deixam levar por petiscos.</p>'
        : T ? '<p class="small muted">Pokémon de treinador tem dono: petiscos não funcionam aqui.</p>'
        : G.B.chefe ? '<p class="small muted">Um Alfa guarda o território: não aceita petiscos.</p>'
        : petiscos.length ? `<div class="bag-grid">${petiscos.map(([k, n]) => `<button class="item-btn ${gosta(k) ? 'gosta' : ''}" data-act="oferecer" data-v="${k}" ${dis} title="${esc(ITEMS[k].desc)}"><img src="${ITEM_SPR(k)}" alt="" onerror="${ITEM_ERRO}"><span>Oferecer ${ITEMS[k].name}</span><small>×${n}${gosta(k) ? ' · ♥ ele gosta' : ''}</small></button>`).join('')}</div>`
        : '<p class="small muted">Sem petiscos. Compre na loja ou ache explorando.</p>';
      a.innerHTML = `<div class="bag-grid">${items.map(([k, n]) => `<button class="item-btn" data-act="item-b" data-v="${k}" ${dis}><img src="${spriteItem(k, P)}" alt="" onerror="${ITEM_ERRO}"><span>${ITEMS[k].name}</span><small>×${n}</small></button>`).join('') || '<p class="muted">Nada utilizável em batalha.</p>'}</div>
        <h4 class="bag-sec">Fazer amizade com ${esc(fmt(E.name))} <span class="muted">(${E.data.types.map(t => TYPE_PT[t]).join('/')})</span></h4>${secPetisco}
        <div class="subrow"><button class="btn ghost" data-act="panel" data-v="moves" ${dis}>Voltar aos golpes</button></div>`;
      return;
    }
    /* Quais golpes dá pra escolher vem de regras.golpesPermitidos — a MESMA função das outras telas, dos aliados, da IA
       e do motor: Choice, Colete de Assalto, Taunt, Encore, Disable, Torment e PP. Nenhum permitido = Struggle (travar
       nunca pode deixar sem NENHUM botão clicável). O Choice guarda o nome do golpe BASE (`vol.escolha`), de antes de
       Weather Ball/Tera Blast mudarem de tipo. */
    const permitidos = golpesPermitidos(P);
    const noPP = !permitidos.length;
    a.innerHTML = `<div class="moves">${noPP ? `<button class="mv" style="--c:#A8A77A" data-act="move" data-v="-1" ${dis}><b>Struggle</b><small>Nenhum golpe disponível: ataque desesperado com recuo.</small></button>`
      : P.moves.map((golpeBase, i) => {
        const m = golpeDoBattleBond(golpeDoTera(golpeDoClima(golpeBase, climaDe(G.B?.campo)), P), P);   // Weather Ball (clima), Tera Blast (seu Tera) e Water Shuriken (Ash-Greninja) no botão
        /* A seta de vantagem (regras.vantagemDoGolpe) contra QUEM está na frente. É a informação que decide o
           turno e que, sem ela, só existe na cabeça de quem decorou a tabela de 18 tipos. */
        const v = G.B ? vantagemDoGolpe(m, G.B.enemy) : null;
        const presoAqui = !permitidos.includes(golpeBase) && golpeBase.ppLeft > 0;   // sem PP já desabilita sozinho; aqui é só o que uma TRAVA proíbe
        return `<button class="mv ${v ? v.classe : ''}" style="--c:${TC[m.type] || '#888'}" data-act="move" data-v="${i}" ${dis || m.ppLeft <= 0 || presoAqui ? 'disabled' : ''} title="${presoAqui ? esc(`Não pode: ${motivoBloqueio(P, golpeBase)?.texto || 'bloqueado'}`) : `${esc(m.desc)}${v ? ` — ${v.rotulo} (×${v.mult})` : ''}`}"><b>${esc(fmt(m.name))}</b><small>${TYPE_PT[m.type] || m.type}, ${CLS_PT[m.cls]}, poder ${m.power ?? '—'}</small>${v ? `<span class="vant" aria-label="${esc(v.rotulo)}">${v.seta} ${esc(v.rotulo)}</span>` : ''}<span class="pp" id="pp-${i}">PP ${m.ppLeft}/${m.pp}</span></button>`;
      }).join('')}</div>
      ${resumoTravas(P).map(t => `<p class="small muted">${esc(t)}</p>`).join('')}
      ${botaoMega(dis)}
      ${barraRapidos(dis)}
      <div class="subrow"><button class="btn ghost" data-act="panel" data-v="bag" ${dis}>Mochila</button><button class="btn ghost" data-act="run" ${dis}>Fugir</button></div>`;
  } else if (G.panel === 'shop') {
    // loja nas mesmas divisões da mochila
    /* `soComMega` (a Pedra Mega) só entra na prateleira quando a SUA espécie já tem a Mega conquistada na conta.
       Assim não há como comprar uma pedra que não serve pra ninguém — e quem ainda não conquistou não vê um
       item caro e inútil na loja. */
    /* O filtro NUNCA pode impedir a loja de abrir. Ele decide se três itens aparecem na prateleira; se a conta
       de conquistas falhar por qualquer motivo, o certo é abrir a loja sem eles e registrar o erro — e não
       deixar a pessoa sem loja. Uma exceção aqui não faz o clique "não funcionar" em silêncio, que é o pior
       jeito de quebrar. Uma consulta só (gimmicksNaLoja): antes eram duas, e cada uma recalcula a carreira.
       gimmicksNaLoja já isola erro por gimmick (carreira.js) — este try/catch é só a rede de segurança se `p`
       (a consulta compartilhada) falhar antes de chegar em qualquer uma das três. */
    let gimmicks = { mega: false, z: false, vinculo: false };
    try { gimmicks = gimmicksNaLoja(S.player?.data?.speciesName, S.player?.moves, S?.registro); }
    catch (e) { console.error('loja: não consegui checar as gimmicks; abrindo sem a Pedra Mega, o Cristal Z e o Vínculo de Batalha', e); }
    const forSale = Object.entries(ITEMS).filter(([, it]) =>
      it.price && (!it.soComMega || gimmicks.mega) && (!it.soComZ || gimmicks.z) && (!it.soComVinculo || gimmicks.vinculo));
    // o preço vem de precoItem (regras.js): quase todo item é fixo, mas o Disco Técnico encarece a cada uso
    const btn = ([k, it]) => { const p = precoItem(k, S); return `<button class="item-btn" data-act="buy" data-v="${k}" ${dis || S.money < p ? 'disabled' : ''} title="${esc(it.desc)}"><img src="${spriteItem(k, S.player)}" alt="" onerror="${ITEM_ERRO}"><span>${it.name}</span><small>₽${p.toLocaleString('pt-BR')}</small></button>`; };
    const dica = { segurado: 'Cada Pokémon segura um; o efeito acontece sozinho na batalha.', evolucao: 'Usados pela mochila pra evoluir.', exploracao: 'Mudam só quais selvagens aparecem.' };
    a.innerHTML = `<p class="carteira-loja">💰 Você tem <b>${brl(S.money)}</b></p>
      <div class="subrow"><button class="btn ghost sm" data-act="panel" data-v="main">Sair da loja</button></div>
      ${porCategoria(forSale).map(c => `<h4 class="bag-div">${c.nome}${dica[c.id] ? ` <span class="muted small">— ${dica[c.id]}</span>` : ''}</h4><div class="bag-grid">${c.itens.map(par => btn([par[0], ITEMS[par[0]]])).join('')}</div>`).join('')}
      <div class="subrow"><button class="btn ghost" data-act="panel" data-v="main">Sair da loja</button></div>`;
  } else {
    // cada um da equipe que precisa de cura paga o próprio preço (grátis no Fácil) — ver centroPokemon()
    const { precisa, custo, cheio, vitorias } = centroPokemon(), semGrana = S.money < custo;
    // Médio: preço cheio riscado + quantas vitórias deram desconto
    const desconto = vitorias && custo < cheio ? ` <s>₽${cheio}</s> <small>(${vitorias} vitória${vitorias > 1 ? 's' : ''})</small>` : '';
    const esgotada = rotaEsgotada(zone(), S.player.level, dificuldadeDe(S));   // anti-grind do Roguelike
    a.innerHTML = `<button class="btn big" data-act="explore" ${dis || esgotada ? 'disabled' : ''} title="${esgotada ? 'Você está forte demais pra esta rota: nada mais aparece aqui' : ''}">${esgotada ? '✔ Rota esgotada' : `Explorar ${zone().name}`}</button>
      <button class="btn ghost" data-act="heal" ${dis || !precisa || semGrana ? 'disabled' : ''} title="${!precisa ? 'HP, PP e status já estão cheios' : semGrana ? 'Dinheiro insuficiente' : 'Restaura HP, PP e status de toda a equipe'}">Centro Pokémon${!precisa ? ' (todos saudáveis)' : `${custo ? ` · ₽${custo}` : ' · grátis'}${desconto}${semGrana ? ' (sem dinheiro)' : ''}`}</button>
      <button class="btn ghost" data-act="panel" data-v="shop" ${dis}>Abrir loja</button>
      ${S.aposVitoria ? `<button class="btn ghost" data-act="encerrar-vitoria" ${dis}>🏁 Encerrar a jornada (vitória)</button>` : ''}
      ${barraRapidos(dis)}`;
  }
}
/* ---- carteira ----
   O dinheiro era só um texto amarelo pequeno no topo — no celular, com a cena fixa da batalha, ele ficava fora da tela e
   era difícil de achar (pedido de quem joga no celular). Agora: (1) uma pílula 💰 no topo, sempre fora do menu ☰;
   (2) o mesmo valor dentro da barra de turno da batalha, que é a parte que não rola; (3) "Você tem ₽X" no topo da loja;
   (4) um aviso +₽/−₽ que aparece ao lado quando o valor muda (a animação respeita prefers-reduced-motion, ver CSS). */
const brl = n => '₽' + (n || 0).toLocaleString('pt-BR');
let dinheiroVisto = null;   // o valor da última vez que a carteira foi desenhada, pra saber quanto mudou
function atualizarCarteira() {
  const el = $('#top-dinheiro'); if (!el || !G.S) return;
  // elemento vazio = a tela anterior limpou o topo (ui.limparTopo): outra jornada ou outra tela, então não há "ganho" a mostrar
  const agora = G.S.money, dif = dinheiroVisto == null || !el.textContent.trim() ? 0 : agora - dinheiroVisto;
  dinheiroVisto = agora;
  el.setAttribute('aria-label', `Dinheiro: ${brl(agora)}`);
  el.innerHTML = `<span aria-hidden="true">💰</span> <b>${brl(agora)}</b>${dif ? `<span class="dinheiro-delta ${dif > 0 ? 'ganho' : 'perda'}" aria-hidden="true">${dif > 0 ? '+' : '−'}${brl(Math.abs(dif))}</span>` : ''}`;
}
/* Animação da barra de HP (pedido do usuário — hoje o número muda na hora, sem transição): o jogo não faz
   diffing (render() destrói e recria o DOM inteiro a cada chamada — ver o comentário no topo do arquivo), então
   uma barra nova nasce direto na largura final, sem "de onde" animar. `hpbar(m, chave)` dá um id estável
   (`hp-fill-<chave>`) só pra quem passa uma chave; isto aqui é a técnica FLIP: guarda a largura ANTES de
   redesenhar, deixa o render() de sempre trocar o DOM, e então força a barra NOVA a nascer na largura ANTIGA
   por um instante (sem transição) antes de soltar pra largura de verdade (com transição) — o olho vê os dois
   quadros como uma animação contínua. Com as animações desligadas (ui.semAnimacao), a mudança fica instantânea, igual
   sempre foi. */
// `.fill-hp` (barra de HP) e `.fill-xp` (barra de XP) usam a MESMA técnica FLIP — generalizado (28/09/2026)
// pra não duplicar a função só porque XP não pisca vermelho/verde igual dano/cura.
function capturarLargurasBarras() {
  const antes = {};
  for (const el of document.querySelectorAll('.fill-hp[id],.fill-xp[id]')) antes[el.id] = el.style.width;
  return antes;
}
// hp-fill-e/-p/-a<N> são as barras de HP da CENA de batalha (plate(m,'e'/'p'/'a'+i) em renderScene) — as únicas
// que têm um .mon correspondente pra piscar. As outras (ficha-p, card-a0…) mostram o MESMO Pokémon noutro lugar
// da tela; sem esse filtro a piscada duplicaria (uma vez por barra, não por Pokémon). XP nunca pisca (não faz
// sentido dano/cura em barra de XP), então esta função só é chamada pra `.fill-hp`.
const idDoMonNaCena = chave => chave === 'e' ? 'mon-e' : chave === 'p' ? 'mon-p' : /^a\d+$/.test(chave) ? 'mon-' + chave : null;
function piscar(id, classe) {
  const el = document.getElementById(id); if (!el) return;
  el.classList.remove('hit-flash', 'heal-flash'); void el.offsetWidth; el.classList.add(classe);
}
/* Dano pisca vermelho, cura pisca verde — deduzido da MESMA comparação de largura que já anima a barra (FLIP),
   sem precisar de outro gancho no motor do golpe: qualquer cura (Restos, fruta, dreno, clima…) já passa por
   `heal()` → `up(ctx)` → um render novo, então a largura muda e o sentido da mudança (cresceu = cura, encolheu
   = dano) já diz tudo. Pedido do usuário (28/09/2026): "mais vivo, mais animações".
   Simplificação assumida: a largura é uma PORCENTAGEM (hp/hp máximo), então um HP MÁXIMO que muda no meio da
   luta (Rare Candy, Dynamax) também mexe na largura sem ninguém ter apanhado ou curado — rarérrimo e sem efeito
   de jogo, só uma piscada errada ocasional; não vale a complexidade de separar os dois casos. */
function animarBarras(antes) {
  if (semAnimacao()) return;
  for (const el of document.querySelectorAll('.fill-hp[id],.fill-xp[id]')) {
    const de = antes[el.id]; if (de === undefined || de === el.style.width) continue;
    const para = el.style.width;
    el.style.transition = 'none'; el.style.width = de;
    el.offsetWidth; // força o navegador a aplicar a largura antiga ANTES da próxima troca — senão as duas mudanças viram uma só, sem transição nenhuma
    el.style.transition = ''; el.style.width = para;
    if (!el.classList.contains('fill-hp')) continue;   // XP: só a largura anima, sem piscar hit/heal
    const id = idDoMonNaCena(el.id.replace(/^hp-fill-/, ''));
    if (id) piscar(id, parseFloat(para) < parseFloat(de) ? 'hit-flash' : 'heal-flash');
  }
}
/* PP não é uma barra (é texto — "PP 5/10", nos botões de golpe da batalha), então FLIP de largura não se aplica;
   em vez disso, um flash de cor quando o número muda (a mesma ideia — comparar ANTES/DEPOIS do render — só que
   em texto em vez de largura). Só o `.pp` do botão de golpe (`renderActions`, id="pp-<índice>") ganhou id: é o
   único que decrementa DURANTE a batalha; o da ficha (dentro do <details>) é informativo, sem tanto valor em
   piscar toda vez que o painel reabre. */
function capturarTextosPP() {
  const antes = {};
  for (const el of document.querySelectorAll('.pp[id]')) antes[el.id] = el.textContent;
  return antes;
}
function animarPP(antes) {
  if (semAnimacao()) return;
  for (const el of document.querySelectorAll('.pp[id]')) {
    if (antes[el.id] === undefined || antes[el.id] === el.textContent) continue;
    el.classList.remove('pp-mudou'); void el.offsetWidth; el.classList.add('pp-mudou');
  }
}
// (As abas de celular ⚔/💬/📋 foram removidas — ver o comentário em paineis.js e o bloco "celular" do CSS.)
export function render() {
  // só as telas de jogo têm painéis; nas outras (criação, carreira, conta, ranking, sala multiplayer) não desenha —
  // gainExp/useItem chamam render() e podem rodar fora da tela de jogo (ex.: recompensa do co-op)
  if (!['explore', 'battle'].includes(G.mode) || !G.S) return;
  // no celular, a batalha vira tela fixa (cena em cima, ações embaixo) — ver o bloco "celular" do CSS
  document.body.classList.toggle('em-batalha', G.mode === 'battle' && !!G.B);
  const antes = capturarLargurasBarras(), antesPP = capturarTextosPP();
  renderSheet(); renderScene(); renderActions();
  animarBarras(antes); animarPP(antesPP);
  atualizarCarteira();   // fora do menu ☰: sempre visível
  // O menu do topo (☰ no celular) oferece EXATAMENTE os mesmos acessos da barra das telas (navegacao.TELAS),
  // mais o que só existe dentro do jogo: ↺ Layout e Novo jogo. Em batalha, só esses dois (navegar fica pra depois).
  const telas = G.mode === 'explore'
    ? telasVisiveis().map(t => `<button class="btn ghost sm" data-act="${t.act}" title="${t.dica}" ${G.busy ? 'disabled' : ''}>${t.rotulo}${t.id === 'patch' && temNovidade() ? ' <span class="bolinha">novo</span>' : ''}</button>`).join('')
    : '';
  $('#topr').innerHTML = `${telas}<button class="btn ghost sm" data-painel-acao="restaurar" title="Voltar os painéis pro layout padrão">↺ Layout</button><button class="btn ghost sm" data-act="new">Novo jogo</button>`;
}
// monta a tela do jogo (esqueleto de painéis de paineis.js), aplica o layout salvo e desenha
export function buildGame() {
  $('#app').innerHTML = htmlJogo();
  aplicarLayout();
  render();
}
