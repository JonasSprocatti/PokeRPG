/* ============ 🧰 Editor de conteúdo (só admin) ============
   Fase 3 da atualização por nuvem: **missões de conta**, **preço dos itens** e **texto e prêmio das badges**.
   As contas e o rascunho moram em js/editor-conteudo.js (puro); aqui é só DOM.

   Por que uma tela e não três: as três tabelas são formulário simples e sem análise (não têm curva de stats nem
   preview tocando), e três atalhos de admin na barra de telas pra isso seria barulho. O 🗺 Editor de rotas e o
   🎵 Editor de músicas são telas próprias porque cada um tem uma ferramenta de verdade do lado.

   Quem publica é `tela-editor-rotas.publicar`: o pacote é UM (uma linha por canal no banco). */
import { $, limparTopo, toast, ask } from './ui.js';
import { barraTelas } from './navegacao.js';
import { esc } from './util.js';
import { ITEMS, ITEM_SPR, ITEM_ERRO } from './dados.js';
import { BADGES, MEDIDAS } from './badges.js';
import { ehAdmin, publicarAviso } from './nuvem.js';
import { PATCH_NOTES } from './dados-patchnotes.js';
import { conteudo } from './conteudo-nuvem.js';
import { validarPacote, pacoteDeFabrica } from './conteudo.js';
import { publicar, blocoPremio, lerPremio } from './tela-editor-rotas.js';
import {
  missoesGlobaisEditadas, missaoGlobal, gravarMissaoGlobal, excluirMissaoGlobal, idNovo,
  itemEditado, itemDeHoje, badgeEditada, badgeDeHoje, gravarRemendo, desfazerRemendo, desfazerMissoesGlobais,
  rascunhoConteudo, limparRascunhoConteudo, quantosConteudo, extrasDoConteudo, gerarBlocoConteudo,
  badgesEditadas, badgeEditadaPorId, badgeDeFabrica, gravarBadgeNova
} from './editor-conteudo.js';

/* As contagens que uma missão de conta pode medir, no vocabulário de `regras.progressoCondicao` — é dele que sai
   a lista, não de uma cópia: condição com chave que ele não conhece fica impossível em silêncio. */
const CONTAGENS = {
  vitorias: 'Vitórias em batalha', amigos: 'Aliados recrutados', nivel: 'Seu nível',
  treinadores: 'Treinadores derrotados', dinheiro: 'Dinheiro de uma vez (₽)', gasto: 'Total gasto (₽)',
  evolucoes: 'Evoluções (suas e dos aliados)'
};

let missaoId = null, badgeId = BADGES[0]?.id || null, filtroItem = '';

export function telaEditorConteudo() {
  if (!ehAdmin()) { toast('O editor de conteúdo é da conta de manutenção.'); return; }
  limparTopo();
  const missoes = missoesGlobaisEditadas();
  if (!missaoId || !missoes.some(m => m.id === missaoId)) missaoId = missoes[0]?.id || null;
  if (!badgeId || !badgesEditadas().some(b => b.id === badgeId)) badgeId = BADGES[0]?.id || null;
  $('#app').innerHTML = `${barraTelas('conteudo')}
    <section class="card">
      <h2>🧰 Editor de conteúdo <span class="muted small">conta de manutenção</span></h2>
      <p class="small muted">Missões globais, preço dos itens e as badges da conta. O rascunho fica
        <b>neste navegador</b> e sai no <b>mesmo pacote</b> do 🗺 Editor de rotas.
        ${quantosConteudo() ? `<b>${quantosConteudo()} edição(ões)</b> no rascunho.` : ''}
        Tocando hoje: versão <b>${conteudo.versao}</b> (${esc(conteudo.canal)}).</p>
      <p class="small muted">⚠ O <b>efeito</b> de um item é código: aqui dá pra mexer em preço, nome e descrição, e
        item novo continua precisando de uma versão nova do jogo. Preço <b>0</b> tira o item da loja.
        <b>Badge nova dá</b> — a medida dela sai da lista de coisas que o jogo já conta na carreira.</p>
    </section>
    ${blocoMissoes(missoes)}
    ${blocoItens()}
    ${blocoBadges()}
    ${blocoAviso()}
    ${blocoPublicar()}`;
}

/* ---- 📢 aviso global (push de novidades) ----
   Não é conteúdo editável: não entra no pacote, não tem rascunho e não dá pra desfazer — é uma notificação que SAI,
   pra todo mundo que ligou lembrete (js/notificacoes.js). Fica aqui porque é a tela de manutenção que já existe, e
   porque o texto que ele manda é quase sempre o título da versão nova de 📜 Novidades: o campo nasce preenchido com
   ele, pra não haver duas redações da mesma coisa. Quem bloqueia de verdade é a função no banco (só admin). */
function blocoAviso() {
  const v = PATCH_NOTES[0];
  return `<section class="card">
    <h3>📢 Avisar as novidades</h3>
    <p class="small muted">Manda uma <b>notificação</b> pra quem ligou os lembretes em ⚙ Ajustes e tem conta — chega
      com o jogo fechado. Vai pra <b>todos de uma vez</b> e não tem como voltar atrás, então vale reler.
      Sai no próximo giro do relógio (até uma hora depois).</p>
    <label class="campo">Título <input id="ec-aviso-titulo" type="text" maxlength="120"
      value="${esc(`📜 Novidades: versão ${v?.versao || ''}`)}"></label>
    <label class="campo">Texto <input id="ec-aviso-corpo" type="text" maxlength="300"
      value="${esc(v?.titulo || '')}"></label>
    <div class="subrow"><button class="btn" data-act="ec-aviso">📢 Mandar pra todos</button></div>
  </section>`;
}

/* ---- 📋 missões globais ---- */
/* "Globais" quer dizer **em qualquer mapa**, não "na conta": `regras.progressoCondicao` mede no SAVE DA JORNADA
   (`S.wins`, `S.money`, `S.registro`), então elas zeram em cada run nova. Quem mede a conta inteira são as
   BADGES, do bloco mais abaixo. O rótulo "missões de conta" estava aqui e era mentira. */
function blocoMissoes(missoes) {
  const m = missaoGlobal(missaoId);
  const r = rascunhoConteudo();
  return `<section class="card">
      <h3>📋 Missões globais <span class="muted small">${missoes.length} · valem em qualquer mapa</span></h3>
      <p class="small muted">As de ROTA (uma de espécie e uma de Alfa por rota) são do 🗺 Editor de rotas. Estas
        acompanham a jornada inteira (vitórias, amizade, dinheiro, nível) e <b>zeram a cada jornada nova</b> —
        o que mede a carreira inteira são as 🏅 badges.</p>
      <div class="subrow">
        ${missoes.map(x => `<button class="btn ${x.id === missaoId ? '' : 'ghost'} sm" data-act="ec-missao" data-v="${esc(x.id)}">${esc(x.nome)}</button>`).join('')}
        <button class="btn ghost sm" data-act="ec-criar-missao">➕ Criar missão</button>
      </div>
      ${m ? formularioMissao(m, !!r.missoesGlobais) : '<p class="muted">Nenhuma missão.</p>'}
    </section>`;
}
function formularioMissao(m, editado) {
  const objetivo = chaveDaCondicao(m.objetivo), libera = chaveDaCondicao(m.libera);
  return `<h4 style="margin-top:12px">${esc(m.nome)} <span class="muted small">${esc(m.id)}</span></h4>
    <label class="campo">Nome <input id="ec-nome" type="text" value="${esc(m.nome)}" maxlength="80"></label>
    <label class="campo">Descrição (é o que o jogador lê)
      <input id="ec-desc" type="text" value="${esc(m.desc)}" maxlength="300"></label>
    <div class="subrow">
      <label class="campo">Objetivo
        <select id="ec-obj">${Object.entries(CONTAGENS).map(([k, t]) => `<option value="${k}" ${k === objetivo ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
      <label class="campo">Quanto
        <input id="ec-obj-n" type="number" min="1" max="9999999" value="${m.objetivo?.[objetivo] || 1}" style="width:120px"></label>
    </div>
    <div class="subrow">
      <label class="campo">Aparece quando
        <select id="ec-lib"><option value="">— desde o começo —</option>
          <option value="missao" ${libera === 'missao' ? 'selected' : ''}>outra missão estiver feita</option>
          ${Object.entries(CONTAGENS).map(([k, t]) => `<option value="${k}" ${k === libera ? 'selected' : ''}>${esc(t)}</option>`).join('')}
        </select></label>
      <label class="campo">Missão que abre esta
        <select id="ec-lib-missao"><option value="">—</option>
          ${missoesGlobaisEditadas().filter(x => x.id !== m.id).map(x => `<option value="${esc(x.id)}" ${m.libera?.missao === x.id ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}
        </select></label>
      <label class="campo">…ou quanto
        <input id="ec-lib-n" type="number" min="1" max="9999999" value="${libera && libera !== 'missao' ? m.libera[libera] : 1}" style="width:120px"></label>
    </div>
    ${blocoPremio('ec-premio', m.premio)}
    <div class="subrow">
      <button class="btn sm" data-act="ec-salvar-missao">💾 Guardar a missão</button>
      <button class="btn ghost sm" data-act="ec-excluir-missao">🗑 Excluir</button>
      ${editado ? '<button class="btn ghost sm" data-act="ec-desfazer-missoes">↩ Voltar TODAS as missões de conta ao que está no jogo</button>' : ''}
    </div>`;
}
// qual contagem esta condição mede (a primeira que ela conhece). `null` = condição vazia/ausente.
const chaveDaCondicao = cond => {
  if (!cond) return null;
  if (cond.missao) return 'missao';
  return Object.keys(CONTAGENS).find(k => cond[k] != null) || null;
};
const condicaoDaTela = (tipo, numero, idDaMissao) => {
  if (!tipo) return null;
  if (tipo === 'missao') return idDaMissao ? { missao: idDaMissao } : null;
  return { [tipo]: numero };
};

/* ---- 🎒 itens: preço ---- */
/* Os ~100 itens numa lista só, com um filtro por nome. Sem paginação e sem "salvar por linha": é tela de admin, e
   um botão por item seria 100 botões. Guardar lê TODOS os campos visíveis e grava só o que diferir do de hoje. */
function blocoItens() {
  const r = rascunhoConteudo();
  const busca = filtroItem.toLowerCase();
  const lista = Object.entries(ITEMS).filter(([id, it]) => !busca || id.includes(busca) || it.name.toLowerCase().includes(busca));
  return `<section class="card">
      <h3>🎒 Itens <span class="muted small">${Object.keys(ITEMS).length} · preço manda na loja</span></h3>
      <p class="small muted">Preço <b>0</b> = fora da loja (e sem valor de venda). O efeito não se edita aqui.</p>
      <label class="campo">Filtrar <input id="ec-filtro" type="search" value="${esc(filtroItem)}" placeholder="poção, pedra, bola…"></label>
      <div class="subrow"><button class="btn ghost sm" data-act="ec-filtrar">🔍 Filtrar</button>
        ${filtroItem ? '<button class="btn ghost sm" data-act="ec-limpar-filtro">✕ Limpar</button>' : ''}
        <span class="small muted">${lista.length} item(ns) na lista</span></div>
      <table class="stats"><thead><tr><th></th><th>Item</th><th>₽</th><th></th></tr></thead><tbody>
        ${lista.map(([id]) => {
          const it = itemEditado(id), mudou = !!r.itens?.[id];
          return `<tr>
            <td><img src="${ITEM_SPR(id)}" alt="" width="28" height="28" loading="lazy" onerror="${ITEM_ERRO}"></td>
            <td>${esc(it.name)}${mudou ? ' ✏' : ''}<br><span class="muted small">${esc(id)}</span></td>
            <td><input type="number" class="ec-preco" data-id="${esc(id)}" min="0" max="999999" step="50" value="${it.price || 0}" style="width:110px"></td>
            <td>${mudou ? `<button class="btn ghost sm" data-act="ec-desfazer-item" data-v="${esc(id)}">↩</button>` : ''}</td></tr>`;
        }).join('')}
      </tbody></table>
      <div class="subrow"><button class="btn sm" data-act="ec-salvar-itens">💾 Guardar os preços</button></div>
    </section>`;
}
/* ---- 🏅 badges ---- */
/* Duas badges diferentes na mesma tela, e a diferença é `badgeDeFabrica`: a de fábrica mede com uma função em
   `js/badges.js` e aqui só dá pra mexer em texto e prêmio; a NOVA é inteira dado, então ganha grupo, ícone, a
   medida (de `badges.MEDIDAS`) e o alvo. Uma tela só porque o formulário é quase o mesmo — e porque "criar badge"
   ao lado das 58 existentes é o que mostra quais medidas já existem antes de inventar uma. */
function blocoBadges() {
  const lista = badgesEditadas();
  const b = badgeEditadaPorId(badgeId) || lista[0];
  if (!b) return '';
  const nova = !badgeDeFabrica(b.id);
  const atual = nova ? b : badgeEditada(b.id), mudou = !!rascunhoConteudo().badges?.[b.id];
  const md = atual.medida || {};
  const def = MEDIDAS[md.campo];
  return `<section class="card">
      <h3>🏅 Badges <span class="muted small">${lista.length} · texto, prêmio e as novas</span></h3>
      <div class="subrow">
        <label class="campo" style="flex:1">Badge
          <select id="ec-badge">${lista.map(x => `<option value="${esc(x.id)}" ${x.id === b.id ? 'selected' : ''}>${esc(x.icone || '🏅')} ${esc(x.nome)}${rascunhoConteudo().badges?.[x.id] ? (badgeDeFabrica(x.id) ? ' ✏' : ' ➕') : ''}</option>`).join('')}</select></label>
        <button class="btn ghost sm" data-act="ec-criar-badge">➕ Criar badge</button>
      </div>
      ${nova
        ? `<p class="small muted">Badge <b>nova</b> (<code>${esc(b.id)}</code>): ela só existe enquanto o pacote estiver
            publicado. A medida é escolhida da lista abaixo — é tudo o que o jogo já conta na sua carreira.</p>`
        : `<p class="small muted">Grupo <b>${esc(b.grupo)}</b>${b.oculta ? ' · oculta até começar' : ''}.
            A conta que ela mede continua em <code>js/badges.js</code> e não muda por aqui.</p>`}
      <label class="campo">Nome <input id="ec-badge-nome" type="text" value="${esc(atual.nome || '')}" maxlength="60"></label>
      <label class="campo">Descrição <input id="ec-badge-desc" type="text" value="${esc(atual.desc || '')}" maxlength="300"></label>
      ${nova ? `<div class="subrow">
        <label class="campo">Ícone (um emoji)
          <input id="ec-badge-icone" type="text" value="${esc(atual.icone || '🏅')}" maxlength="8" style="width:90px"></label>
        <label class="campo">Grupo (a tela agrupa por ele)
          <input id="ec-badge-grupo" type="text" value="${esc(atual.grupo || 'Criadas')}" maxlength="40" list="ec-grupos"></label>
        <datalist id="ec-grupos">${[...new Set(BADGES.map(x => x.grupo))].map(g => `<option value="${esc(g)}"></option>`).join('')}</datalist>
        <label class="campo">Esconder até começar
          <select id="ec-badge-oculta"><option value="">não</option><option value="1" ${atual.oculta ? 'selected' : ''}>sim</option></select></label>
      </div>
      <div class="subrow">
        <label class="campo" style="flex:1">O que ela mede
          <select id="ec-badge-medida">${Object.entries(MEDIDAS).map(([k, m]) => `<option value="${esc(k)}" ${k === md.campo ? 'selected' : ''}>${esc(m.rotulo)}</option>`).join('')}</select></label>
        <label class="campo">Alvo
          <input id="ec-badge-alvo" type="number" min="1" max="999999999" value="${md.alvo || def?.exemplo || 1}" style="width:140px"></label>
      </div>
      <label class="campo">Espécie <span class="muted small">(só pra medida "de uma espécie": o nome em inglês e minúsculo, ex. <code>pikachu</code>)</span>
        <input id="ec-badge-especie" type="text" value="${esc(md.especie || '')}" maxlength="40" placeholder="pikachu"></label>` : ''}
      <label class="campo">Título que ela dá (vazio = o nome dela)
        <input id="ec-badge-titulo" type="text" value="${esc(atual.recompensa?.titulo || '')}" maxlength="60"></label>
      ${blocoPremio('ec-badge-premio', atual.recompensa)}
      <div class="subrow">
        <button class="btn sm" data-act="ec-salvar-badge">💾 Guardar a badge</button>
        ${mudou ? `<button class="btn ghost sm" data-act="ec-desfazer-badge">${nova ? '🗑 Excluir a badge nova' : '↩ Voltar ao que está no jogo'}</button>` : ''}
      </div>
    </section>`;
}

function blocoPublicar() {
  return `<section class="card">
      <h3>📤 Publicar</h3>
      <p class="small muted">Sai no mesmo pacote das rotas, das missões de rota e da música. 📤 grava no canal de
        <b>teste</b> (só a sua conta lê); ✅ promove o que está no teste pra todos.</p>
      <div class="subrow">
        <button class="btn" data-act="ec-publicar">📤 Publicar (só eu vejo)</button>
        <button class="btn ghost" data-act="ec-liberar">✅ Liberar pra todos</button>
      </div>
      <div class="subrow">
        <button class="btn ghost" data-act="ec-copiar">📋 Copiar o bloco</button>
        ${quantosConteudo() ? '<button class="btn ghost" data-act="ec-limpar">🧹 Apagar o rascunho inteiro</button>' : ''}
      </div>
      <textarea id="ec-saida" rows="8" readonly placeholder="O bloco aparece aqui depois de copiar."></textarea>
    </section>`;
}

/* ---- ações (main.js despacha) ---- */
export async function acaoEditorConteudo(qual, v) {
  if (!ehAdmin()) return;
  if (qual === 'missao') { missaoId = v; return telaEditorConteudo(); }
  if (qual === 'badge') { badgeId = v; return telaEditorConteudo(); }
  if (qual === 'filtrar') { filtroItem = ($('#ec-filtro')?.value || '').trim(); return telaEditorConteudo(); }
  if (qual === 'limpar-filtro') { filtroItem = ''; return telaEditorConteudo(); }
  if (qual === 'publicar') return publicar('teste');
  if (qual === 'liberar') return publicar('estavel');
  if (qual === 'copiar') return copiarBloco();
  if (qual === 'aviso') {
    const titulo = ($('#ec-aviso-titulo')?.value || '').trim(), corpo = ($('#ec-aviso-corpo')?.value || '').trim();
    if (!titulo) return toast('O aviso precisa de um título.');
    // confirmação porque isto sai do jogo e chega no celular de outras pessoas: não há botão de desfazer
    const sim = await ask(`Mandar esta notificação pra <b>todos</b> que ligaram os lembretes?<br><br><b>${esc(titulo)}</b><br>${esc(corpo)}`,
      [{ label: '📢 Mandar', value: true }, { label: 'Cancelar', value: false, ghost: true }]);
    if (!sim) return;
    try { toast(`📢 Aviso na fila de ${await publicarAviso(titulo, corpo)} jogador(es).`); }
    catch (e) { console.error(e); toast('Não consegui publicar o aviso: ' + (e.message || e)); }
    return;
  }
  if (qual === 'limpar') { limparRascunhoConteudo(); toast('Rascunho de conteúdo apagado.'); return telaEditorConteudo(); }

  if (qual === 'salvar-missao' || qual === 'criar-missao') {
    const criando = qual === 'criar-missao';
    const base = criando ? null : missaoGlobal(missaoId);
    if (!criando && !base) return;
    const nome = criando ? 'Missão nova' : ($('#ec-nome')?.value || '').trim();
    if (!nome) return toast('A missão precisa de um nome.');
    if (criando) {
      const id = idNovo('missao-nova', new Set(missoesGlobaisEditadas().map(m => m.id)));
      gravarMissaoGlobal(id, { id, nome, desc: 'Descreva o que o jogador tem de fazer.', objetivo: { vitorias: 10 }, premio: { dinheiro: 500 } });
      missaoId = id;
      toast('Missão criada. Ajuste o texto, o objetivo e o prêmio.');
      return telaEditorConteudo();
    }
    const tipo = $('#ec-obj')?.value;
    const objetivo = condicaoDaTela(tipo, Number($('#ec-obj-n')?.value || 0), null);
    if (!objetivo) return toast('Escolha o que a missão mede.');
    const libera = condicaoDaTela($('#ec-lib')?.value, Number($('#ec-lib-n')?.value || 0), $('#ec-lib-missao')?.value);
    const nova = {
      id: base.id, nome, desc: ($('#ec-desc')?.value || '').trim(), objetivo,
      ...(libera ? { libera } : {}), premio: lerPremio('ec-premio')
    };
    /* Conferida pela MESMA validação do pacote, com a lista toda dentro: `libera` pendurado em missão que não
       existe e número fora de faixa só apareceriam no toast do 📤, depois de o admin já ter esquecido o que mexeu. */
    const lista = missoesGlobaisEditadas().map(m => (m.id === nova.id ? nova : m));
    const erro = validarPacote({ ...pacoteDeFabrica(), missoesGlobais: lista });
    if (!erro.ok) return toast(erro.porque);
    gravarMissaoGlobal(nova.id, nova);
    toast('Missão guardada no rascunho.');
    return telaEditorConteudo();
  }
  if (qual === 'excluir-missao') {
    const fora = excluirMissaoGlobal(missaoId);
    if (!fora.ok) return toast(fora.porque);
    toast('Missão fora do rascunho.');
    missaoId = null;
    return telaEditorConteudo();
  }
  if (qual === 'desfazer-missoes') {
    const sim = await ask('Voltar TODAS as missões de conta ao que está no jogo? O rascunho delas se perde.',
      [{ label: 'Voltar', value: true }, { label: 'Cancelar', value: false, ghost: true }]);
    if (!sim) return;
    desfazerMissoesGlobais();
    missaoId = null;
    toast('Missões de conta de volta ao que está no jogo.');
    return telaEditorConteudo();
  }
  if (qual === 'salvar-itens') {
    let n = 0;
    document.querySelectorAll('.ec-preco').forEach(c => {
      const id = c.dataset.id, price = Number(c.value);
      if (!(price >= 0 && price <= 999999)) return;
      n += gravarRemendo('itens', id, { ...itemEditado(id), price }, itemDeHoje(id)) ? 1 : 0;
    });
    const erro = validarPacote({ ...pacoteDeFabrica(), ...extrasDoConteudo() });
    if (!erro.ok) return toast(erro.porque);
    toast(n ? `${n} item(ns) com preço diferente do de fábrica.` : 'Nenhum preço diferente do de fábrica.');
    return telaEditorConteudo();
  }
  if (qual === 'desfazer-item') { desfazerRemendo('itens', v); return telaEditorConteudo(); }
  if (qual === 'criar-badge') {
    const id = idNovo('badge-nova', new Set(badgesEditadas().map(b => b.id)));
    gravarBadgeNova(id, {
      nome: 'Badge nova', desc: 'Descreva o que o jogador tem de fazer.', grupo: 'Criadas', icone: '🏅',
      medida: { campo: 'abates.total', alvo: 5000 }, recompensa: { dinheiro: 2000 }
    });
    badgeId = id;
    toast('Badge criada. Escolha a medida, o alvo e o prêmio.');
    return telaEditorConteudo();
  }
  if (qual === 'salvar-badge') {
    const nova = !badgeDeFabrica(badgeId);
    const titulo = ($('#ec-badge-titulo')?.value || '').trim();
    const premio = lerPremio('ec-badge-premio');
    const valor = {
      nome: ($('#ec-badge-nome')?.value || '').trim(),
      desc: ($('#ec-badge-desc')?.value || '').trim(),
      recompensa: { ...premio, ...(titulo ? { titulo } : {}) }
    };
    if (!valor.nome) return toast('A badge precisa de um nome.');
    if (nova) {
      const campo = $('#ec-badge-medida')?.value;
      const especie = ($('#ec-badge-especie')?.value || '').trim().toLowerCase();
      Object.assign(valor, {
        grupo: ($('#ec-badge-grupo')?.value || '').trim() || 'Criadas',
        icone: ($('#ec-badge-icone')?.value || '').trim() || '🏅',
        ...($('#ec-badge-oculta')?.value ? { oculta: true } : {}),
        // `especie` só entra na medida que a usa — a validação recusa sobra, pra não guardar campo que não mede nada
        medida: { campo, alvo: Number($('#ec-badge-alvo')?.value || 0), ...(MEDIDAS[campo]?.especie ? { especie } : {}) }
      });
    }
    const erro = validarPacote({ ...pacoteDeFabrica(), badges: { ...extrasDoConteudo().badges, [badgeId]: valor } });
    if (!erro.ok) return toast(erro.porque);
    if (nova) gravarBadgeNova(badgeId, valor);
    else gravarRemendo('badges', badgeId, valor, badgeDeHoje(badgeId));
    toast('Badge guardada no rascunho.');
    return telaEditorConteudo();
  }
  if (qual === 'desfazer-badge') {
    desfazerRemendo('badges', badgeId);
    if (!badgeDeFabrica(badgeId)) badgeId = BADGES[0]?.id || null;   // a nova deixou de existir: a tela não pode apontar pra ela
    return telaEditorConteudo();
  }
}
async function copiarBloco() {
  let texto;
  try { texto = gerarBlocoConteudo(extrasDoConteudo()); }
  catch (e) { console.error('editor de conteúdo: gerar o bloco falhou', e); return toast('Não deu pra gerar o bloco: ' + e.message); }
  const area = $('#ec-saida'); if (area) area.value = texto;
  try { await navigator.clipboard.writeText(texto); toast('Bloco copiado.'); }
  catch { toast('Sem acesso à área de transferência: copie da caixa de texto abaixo.'); }
}
