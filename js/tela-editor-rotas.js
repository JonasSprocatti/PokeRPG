/* ============ 🗺 Editor de rotas (só admin) ============
   Pedido do usuário (01/10/2026): "um sistema onde eu possa escolher os pokemons da Gen que estão na rota, criar a
   missão, a recompensa dela por itens e o nome da missão", o mesmo pros Alfas (inclusive TROCAR o Alfa), e "uma
   análise de curva de stats dos pokemons que estão lá, para que eu veja se está muito desequilibrada ou se está
   justa e que consiga encaixar alfas que se adequem".

   **Como a edição chega no jogador** (decisão do usuário): o rascunho fica no `localStorage` deste navegador e o
   botão "📋 Copiar o arquivo" devolve o conteúdo de `js/dados-rotas.js` pra colar no repositório. Nada de tabela no
   Supabase: missão é conteúdo estático, buscar isso na rede no boot é rede num caminho que hoje é instantâneo, e
   missão quebrada iria ao ar sem passar pelos testes. O preço combinado é um commit por leva de edição.

   As contas (curva, veredito do Alfa, geração do arquivo) moram em js/editor-rotas.js, que é puro e testado. Aqui
   é só DOM, rede e o rascunho. */
import { $, limparTopo, toast } from './ui.js';
import { barraTelas } from './navegacao.js';
import { esc, store } from './util.js';
import { ITEMS, SPR, espelhar, MISSOES } from './dados.js';
import { GENS, rotasDaGen, especiesDaGen } from './mapas.js';
import { loadPokemon, apiErr } from './api.js';
import { ehAdmin } from './nuvem.js';
import {
  bst, curvaDaRota, equilibrioDaRota, vereditoAlfa, candidatosAlfa, quantidadePorPeso, dividirQuantidade,
  bonito, gerarArquivo, FAIXA_ALFA
} from './editor-rotas.js';

const CHAVE = 'pokerpg-editor-rotas-v1';
// o rascunho: { [rotaId]: { missao: { nome, alvos, premio }, alfa: { nome, premio, trocado } } }. Rota ausente = o
// que está em dados-rotas.js hoje. Guardar só a DIFERENÇA deixa o arquivo gerado continuar valendo como base.
const rascunho = () => store.get(CHAVE) || {};
const salvarRascunho = r => store.set(CHAVE, r);

let gen = 1, rotaId = null, bsts = new Map(), carregando = false, erro = '';

/* ---- a verdade de hoje: o que está no jogo agora, rota por rota ---- */
// todas as rotas com missão (o Santuário não tem: é pós-vitória), já com a missão e o Alfa de cada uma
function rotasComMissao(g) {
  return rotasDaGen(g).filter(z => !z.posVitoria).map((z, i, lista) => {
    const esp = MISSOES.find(m => m.id === `${z.id}-esp`);
    const alfa = MISSOES.find(m => m.id === `${z.id}-alfa`);
    return {
      z, gen: g, rota: z.id, rotulo: z.name, regiao: GENS.find(x => x.gen === g)?.regiao,
      antes: i > 0 ? lista[i - 1].id : null, lendarios: !!z.lendarios,
      missao: esp ? { nome: esp.nome, alvos: esp.objetivo.alvos.map(([n, q]) => [n, q]), premio: esp.premio } : null,
      alfa: alfa ? { nome: alfa.nome, premio: alfa.premio, trocado: null } : null
    };
  });
}
// o estado de uma rota com o rascunho por cima
function rotaEditada(base) {
  const r = rascunho()[base.rota];
  if (!r) return base;
  return { ...base, missao: r.missao || base.missao, alfa: r.alfa || base.alfa };
}
const todasEditadas = () => GENS.flatMap(g => rotasComMissao(g.gen)).map(rotaEditada);
const atual = () => rotasComMissao(gen).map(rotaEditada).find(r => r.rota === rotaId) || null;

/* ---- stats: carrega o pool da rota pra montar a curva ---- */
async function carregarBsts(ids) {
  const faltam = ids.filter(id => !bsts.has(id));
  if (!faltam.length) return;
  carregando = true; erro = ''; render();
  try {
    /* Sem `Promise.all` em cima de 150 espécies: o "🔍 Sugerir Alfa" varre a Gen inteira, e 150 pedidos
       simultâneos derrubam a PokéAPI (429) e o cache junto. 8 por vez chega rápido e não castiga ninguém. */
    for (let i = 0; i < faltam.length; i += 8) {
      const lote = faltam.slice(i, i + 8);
      const dados = await Promise.all(lote.map(id => loadPokemon(id).catch(() => null)));
      lote.forEach((id, k) => { if (dados[k]) bsts.set(id, bst(dados[k].base)); });
    }
  } catch (e) { erro = apiErr(e); }
  carregando = false; render();
}
// a curva da rota que está aberta, com o que já foi carregado
function curvaAtual(r) {
  if (!r) return null;
  return curvaDaRota(r.z.pool.map(p => ({ n: p.n, p: p.p, id: p.id, bst: bsts.get(p.id) })).filter(e => e.bst));
}

/* ---- a tela ---- */
export function telaEditorRotas() {
  /* Admin-only dos DOIS lados (a barra já esconde o atalho): a tela é alcançável por `data-act` digitado no
     console, e aqui não há dado de ninguém — mas uma tela que não é pra você não deve abrir. */
  if (!ehAdmin()) { toast('O editor de rotas é da conta de manutenção.'); return; }
  limparTopo();
  const rotas = rotasComMissao(gen).map(rotaEditada);
  if (!rotaId || !rotas.some(r => r.rota === rotaId)) rotaId = rotas[0]?.rota || null;
  const r = atual();
  $('#app').innerHTML = `${barraTelas('editor')}
    <section class="card">
      <h2>🗺 Editor de rotas <span class="muted small">conta de manutenção</span></h2>
      <p class="small muted">Edite a missão de espécie e a missão do Alfa de cada rota, troque o Pokémon do Alfa e
        veja a curva de stats da rota pra julgar o equilíbrio. O rascunho fica <b>neste navegador</b>; quando estiver
        bom, use <b>📋 Copiar o arquivo</b> e cole em <code>js/dados-rotas.js</code> pra valer pra todo mundo.</p>
      <div class="subrow">
        ${GENS.map(g => `<button class="btn ${g.gen === gen ? '' : 'ghost'} sm" data-act="ed-gen" data-v="${g.gen}">${g.gen}. ${esc(g.regiao)}</button>`).join('')}
      </div>
      <div class="subrow" style="margin-top:8px">
        ${rotas.map(x => `<button class="btn ${x.rota === rotaId ? '' : 'ghost'} sm" data-act="ed-rota" data-v="${esc(x.rota)}" title="Nv. ${x.z.min}–${x.z.max}">${esc(x.rotulo)}${rascunho()[x.rota] ? ' ✏' : ''}</button>`).join('')}
      </div>
    </section>
    ${r ? blocoRota(r) : '<section class="card"><p class="muted">Nenhuma rota nesta Gen.</p></section>'}
    ${blocoArquivo()}`;
  // a curva precisa dos base stats: pede o pool da rota aberta (cache-primeiro; na 2ª vez é instantâneo)
  if (r && !carregando) {
    const faltam = r.z.pool.filter(p => !bsts.has(p.id));
    if (faltam.length) carregarBsts(r.z.pool.map(p => p.id));
  }
}
/* Redesenha SÓ se o editor ainda estiver na tela: `carregarBsts` é assíncrono (150 espécies no "Sugerir Alfa"), e
   quem saiu pra outra tela no meio não pode ter o editor desenhado de volta por cima. */
const render = () => { if (document.getElementById('ed-saida')) telaEditorRotas(); };

/* ---- bloco de uma rota ---- */
function blocoRota(r) {
  const curva = curvaAtual(r), eq = equilibrioDaRota(curva);
  const bstAlfa = bsts.get(r.alfa?.trocado?.id ?? r.z.chefe?.id);
  const vd = curva && bstAlfa ? vereditoAlfa(bstAlfa, curva) : null;
  return `<section class="card">
      <h3>${esc(r.rotulo)} <span class="muted small">${esc(r.rota)} · Nv. ${r.z.min}–${r.z.max} · abre no nível ${r.z.libera}</span></h3>
      ${blocoCurva(r, curva, eq)}
      ${blocoMissao(r)}
      ${blocoAlfa(r, curva, vd, bstAlfa)}
    </section>`;
}

/* ---- análise: a curva de stats da rota ---- */
function blocoCurva(r, curva, eq) {
  if (carregando && !curva) return `<p class="small muted">⏳ Carregando os stats do pool da rota…</p>`;
  if (erro) return `<p class="err small">${esc(erro)} <button class="btn ghost sm" data-act="ed-recarregar">Tentar de novo</button></p>`;
  if (!curva) return `<p class="small muted">Sem stats pra mostrar.</p>`;
  const COR = { parelha: 'var(--green)', variada: 'var(--yellow)', desigual: 'var(--red)' };
  const faixa = curva.max - curva.min || 1;
  return `<h4>📈 Curva de stats da rota</h4>
    <p class="small muted">Mediana <b>${curva.mediana}</b> · ponderada pelo que realmente aparece <b>${curva.pesada}</b> ·
      de ${curva.min} a ${curva.max} · ${curva.n} espécie(s) ·
      espalhamento <b style="color:${COR[eq.nivel]}">${eq.espalhamento}× (${eq.nivel})</b>
      ${eq.nivel === 'desigual' ? `— puxada por ${eq.foraDaCurva.map(n => esc(bonito(n))).join(', ')}` : ''}</p>
    <table class="stats"><thead><tr><th>Espécie</th><th>BST</th><th>Aparição</th><th></th></tr></thead><tbody>
      ${curva.especies.map(e => `<tr>
        <td>${esc(bonito(e.n))}</td><td class="v">${e.bst}</td><td class="muted">peso ${e.p}</td>
        <td style="width:40%"><div class="barra" style="background:var(--line);height:8px;border-radius:4px">
          <div style="width:${Math.round(((e.bst - curva.min) / faixa) * 100)}%;height:8px;border-radius:4px;background:${e.bst >= curva.mediana ? 'var(--yellow)' : 'var(--green)'}"></div></div></td></tr>`).join('')}
    </tbody></table>`;
}

/* ---- a missão de espécie ---- */
function blocoMissao(r) {
  const m = r.missao || { nome: '', alvos: [], premio: {} };
  const escolhidas = new Map(m.alvos);
  return `<h4 style="margin-top:14px">🎯 Missão de espécie</h4>
    <label class="campo">Nome da missão
      <input id="ed-nome" type="text" value="${esc(m.nome)}" maxlength="40" placeholder="Mais ou Menos"></label>
    <p class="small muted">Marque as espécies do pool. Com mais de uma, a quantidade é dividida entre elas e a
      missão só conclui quando TODAS as contagens fecharem — "8 Plusle e 8 Minun".</p>
    <div class="ed-grade">${r.z.pool.map(p => {
      const on = escolhidas.has(p.n);
      return `<label class="check" title="peso ${p.p} · sugestão ${quantidadePorPeso(p.p)}">
        <input type="checkbox" class="ed-alvo" data-esp="${esc(p.n)}" data-peso="${p.p}" ${on ? 'checked' : ''}>
        <img src="${espelhar(SPR(p.id))}" alt="" width="32" height="32" loading="lazy" style="vertical-align:middle">
        ${esc(bonito(p.n))}
        <input type="number" class="ed-qtd" data-esp="${esc(p.n)}" min="1" max="999" value="${on ? escolhidas.get(p.n) : quantidadePorPeso(p.p)}" style="width:70px" ${on ? '' : 'disabled'}>
      </label>`;
    }).join('')}</div>
    ${blocoPremio('ed-premio-esp', m.premio)}
    <div class="subrow"><button class="btn sm" data-act="ed-salvar-missao">💾 Guardar a missão</button>
      <span class="small muted">${esc(descPrevista(m.alvos))}</span></div>`;
}
const descPrevista = alvos => alvos.length ? `Fica: "Derrote ${alvos.map(([n, q]) => `${q} ${bonito(n)}`).join(' e ')}."` : 'Nenhuma espécie marcada.';

/* ---- a missão do Alfa, e trocar o Alfa ---- */
function blocoAlfa(r, curva, vd, bstAlfa) {
  const a = r.alfa || { nome: '', premio: {}, trocado: null };
  const chefe = a.trocado || r.z.chefe || {};
  const COR = { fraco: 'var(--red)', 'justo-fraco': 'var(--yellow)', justo: 'var(--green)', duro: 'var(--yellow)', muro: 'var(--red)' };
  /* O Alfa de hoje PRECISA estar na lista. Hoje todos os 81 estão (conferido), mas `especiesDaGen` pula o Santuário
     e ignora míticos — se um mapa regerado puser um Alfa fora dessa lista, o `<select>` mostraria a primeira opção
     como selecionada e "💾 Guardar o Alfa" trocaria o Pokémon da rota sem ninguém pedir. Caso silencioso e
     destrutivo: é mais barato garantir a opção do que confiar no mapa. */
  const especies = especiesDaGen(gen);
  if (chefe.id && !especies.some(p => p.id === chefe.id)) especies.unshift({ id: chefe.id, n: String(chefe.nome || '').toLowerCase(), p: 0 });
  return `<h4 style="margin-top:14px">👑 Alfa da rota</h4>
    ${r.lendarios
      ? `<p class="small muted">Esta é a rota final: o "Alfa" aqui são os <b>lendários</b> (${r.z.lendarios.map(l => esc(l.nome)).join(', ')}),
          definidos no mapa. Dá pra editar o nome e o prêmio da missão, não quem são.</p>`
      : `<div class="subrow">
          <label class="campo">Pokémon
            <select id="ed-alfa-esp">
              ${especies.map(p => `<option value="${p.id}" ${p.id === chefe.id ? 'selected' : ''}>${esc(bonito(p.n))}${bsts.has(p.id) ? ` — BST ${bsts.get(p.id)}` : ''}</option>`).join('')}
            </select></label>
          <label class="campo">Nível <input id="ed-alfa-nivel" type="number" min="2" max="100" value="${chefe.nivel || r.z.max + 4}" style="width:80px"></label>
          <button class="btn ghost sm" data-act="ed-sugerir">🔍 Sugerir Alfa pra esta rota</button>
        </div>
        ${vd ? `<p class="small">Alfa atual: <b>${esc(bonito(chefe.nome || ''))}</b> BST ${bstAlfa} =
            <b style="color:${COR[vd.veredito]}">${vd.razao}× a mediana ponderada (${esc(vd.veredito)})</b>.
            O ponto certo pra esta rota é BST <b>${vd.alvo[0]}–${vd.alvo[1]}</b>
            (${FAIXA_ALFA.minimo}×–${FAIXA_ALFA.maximo}×, já contando que o Alfa ganha HP ×2 e +30% no resto).</p>`
          : '<p class="small muted">Escolha o Pokémon e os stats dele aparecem aqui.</p>'}
        ${curva && bsts.size > r.z.pool.length ? blocoCandidatos(curva, especies) : ''}`}
    <label class="campo">Nome da missão
      <input id="ed-alfa-nome" type="text" value="${esc(a.nome)}" maxlength="40" placeholder="Punho de aço"></label>
    ${blocoPremio('ed-premio-alfa', a.premio)}
    <div class="subrow"><button class="btn sm" data-act="ed-salvar-alfa">💾 Guardar o Alfa</button>
      ${rascunho()[r.rota] ? `<button class="btn ghost sm" data-act="ed-desfazer">↩ Desfazer as mudanças desta rota</button>` : ''}</div>`;
}
function blocoCandidatos(curva, especies) {
  const lista = candidatosAlfa(especies.map(p => ({ ...p, bst: bsts.get(p.id) })).filter(e => e.bst), curva);
  if (!lista.length) return '<p class="small muted">Nenhuma espécie desta Gen cai na faixa ideal — o que está lá hoje pode ser o menos pior.</p>';
  return `<p class="small">Candidatos na faixa: ${lista.map(e => `<button class="btn ghost sm" data-act="ed-usar-alfa" data-v="${e.id}">${esc(bonito(e.n))} (${e.bst})</button>`).join(' ')}</p>`;
}

/* ---- prêmio: dinheiro + itens ---- */
function blocoPremio(id, premio = {}) {
  const itens = Object.entries(premio.itens || {});
  return `<div class="subrow" id="${id}">
      <label class="campo">₽ <input class="ed-dinheiro" type="number" min="0" max="999999" step="100" value="${premio.dinheiro || 0}" style="width:110px"></label>
      ${[0, 1, 2].map(i => `<label class="campo">Item ${i + 1}
        <select class="ed-item"><option value="">—</option>
          ${Object.entries(ITEMS).map(([k, v]) => `<option value="${esc(k)}" ${itens[i]?.[0] === k ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}
        </select>
        <input class="ed-item-qtd" type="number" min="1" max="99" value="${itens[i]?.[1] || 1}" style="width:60px"></label>`).join('')}
    </div>`;
}
// lê um bloco de prêmio da tela. Item sem escolha é ignorado; prêmio vazio volta como `{ dinheiro: 0 }` — o teste
// de dados cobra "todo prêmio dá algo", então a tela avisa em vez de gerar um arquivo que não passa.
function lerPremio(id) {
  const raiz = document.getElementById(id);
  const premio = {};
  const d = Number(raiz.querySelector('.ed-dinheiro')?.value || 0);
  if (d > 0) premio.dinheiro = d;
  const itens = {};
  raiz.querySelectorAll('.ed-item').forEach((sel, i) => {
    const k = sel.value; if (!k) return;
    const q = Number(raiz.querySelectorAll('.ed-item-qtd')[i]?.value || 1);
    itens[k] = (itens[k] || 0) + Math.max(1, q);
  });
  if (Object.keys(itens).length) premio.itens = itens;
  return premio;
}

/* ---- ações (main.js despacha) ---- */
export function acaoEditor(qual, v) {
  if (!ehAdmin()) return;
  const r = atual();
  if (qual === 'gen') { gen = Number(v); rotaId = null; return telaEditorRotas(); }
  if (qual === 'rota') { rotaId = v; return telaEditorRotas(); }
  if (qual === 'recarregar') { erro = ''; bsts = new Map(); return telaEditorRotas(); }
  if (qual === 'alvo-toggle') return telaAtualizarQtd();
  if (!r) return;

  if (qual === 'salvar-missao') {
    const alvos = [];
    document.querySelectorAll('.ed-alvo:checked').forEach(c => {
      const n = c.dataset.esp;
      const q = Number(document.querySelector(`.ed-qtd[data-esp="${n}"]`)?.value || 1);
      alvos.push([n, Math.max(1, q)]);
    });
    const nome = ($('#ed-nome')?.value || '').trim();
    if (!nome) return toast('A missão precisa de um nome.');
    if (!alvos.length) return toast('Marque ao menos uma espécie do pool.');
    const premio = lerPremio('ed-premio-esp');
    if (!premio.dinheiro && !premio.itens) return toast('A missão precisa de um prêmio (dinheiro ou item).');
    gravar(r.rota, { missao: { nome, alvos, premio } });
    toast('Missão guardada no rascunho.');
    return telaEditorRotas();
  }
  if (qual === 'salvar-alfa') {
    const nome = ($('#ed-alfa-nome')?.value || '').trim();
    if (!nome) return toast('A missão do Alfa precisa de um nome.');
    const premio = lerPremio('ed-premio-alfa');
    if (!premio.dinheiro && !premio.itens) return toast('A missão do Alfa precisa de um prêmio.');
    let trocado = null;
    if (!r.lendarios) {
      const id = Number($('#ed-alfa-esp')?.value || 0);
      const nivel = Number($('#ed-alfa-nivel')?.value || 0);
      const esp = especiesDaGen(gen).find(p => p.id === id);
      // só grava a troca se mudou de verdade: ALFAS vazio = mapas intocados, e é o estado que a gente quer manter
      if (esp && (id !== r.z.chefe?.id || nivel !== r.z.chefe?.nivel)) trocado = { id, nome: bonito(esp.n), nivel: Math.max(2, nivel) };
    }
    gravar(r.rota, { alfa: { nome, premio, trocado } });
    toast('Alfa guardado no rascunho.');
    return telaEditorRotas();
  }
  if (qual === 'usar-alfa') {
    const sel = $('#ed-alfa-esp'); if (sel) sel.value = v;
    return carregarBsts([Number(v)]);
  }
  if (qual === 'sugerir') return carregarBsts(especiesDaGen(gen).map(p => p.id));
  if (qual === 'desfazer') {
    const todas = rascunho(); delete todas[r.rota]; salvarRascunho(todas);
    toast('Rota de volta ao que está no jogo.');
    return telaEditorRotas();
  }
  if (qual === 'copiar') return copiarArquivo();
  if (qual === 'limpar-tudo') {
    salvarRascunho({});
    toast('Rascunho inteiro apagado.');
    return telaEditorRotas();
  }
}
// liga/desliga o campo de quantidade junto com a caixinha, sem re-renderizar a tela toda (perderia o que foi digitado)
function telaAtualizarQtd() {
  document.querySelectorAll('.ed-alvo').forEach(c => {
    const q = document.querySelector(`.ed-qtd[data-esp="${c.dataset.esp}"]`);
    if (q) q.disabled = !c.checked;
  });
  const marcadas = [...document.querySelectorAll('.ed-alvo:checked')];
  // com mais de uma espécie, divide a quantidade sugerida entre elas (o exemplo do usuário: 16 → 8 + 8)
  if (marcadas.length > 1) {
    const total = Math.max(...marcadas.map(c => quantidadePorPeso(Number(c.dataset.peso))));
    const partes = dividirQuantidade(total, marcadas.length);
    marcadas.forEach((c, i) => { const q = document.querySelector(`.ed-qtd[data-esp="${c.dataset.esp}"]`); if (q) q.value = partes[i]; });
  }
}
function gravar(rota, parte) {
  const todas = rascunho();
  const base = rotaEditada(rotasComMissao(gen).find(x => x.rota === rota));
  todas[rota] = { missao: base.missao, alfa: base.alfa, ...todas[rota], ...parte };
  salvarRascunho(todas);
}

/* ---- gerar e copiar o arquivo ---- */
function blocoArquivo() {
  const n = Object.keys(rascunho()).length;
  return `<section class="card">
      <h3>📋 O arquivo</h3>
      <p class="small muted">${n ? `<b>${n} rota(s)</b> editada(s) no rascunho deste navegador.` : 'Nenhuma edição no rascunho: o arquivo sai igual ao que já está no jogo.'}
        Copie o conteúdo e cole em <code>js/dados-rotas.js</code>.</p>
      <div class="subrow">
        <button class="btn" data-act="ed-copiar">📋 Copiar o arquivo</button>
        ${n ? '<button class="btn ghost" data-act="ed-limpar-tudo">🧹 Apagar o rascunho inteiro</button>' : ''}
      </div>
      <textarea id="ed-saida" rows="8" readonly placeholder="O conteúdo aparece aqui depois de copiar (pra conferir ou copiar à mão)."></textarea>
    </section>`;
}
async function copiarArquivo() {
  let texto;
  try { texto = gerarArquivo(todasEditadas()); }
  catch (e) { console.error('editor de rotas: gerar o arquivo falhou', e); return toast('Não deu pra gerar o arquivo: ' + e.message); }
  const area = $('#ed-saida'); if (area) area.value = texto;
  // `clipboard` não existe em http:// nem em navegador antigo — a textarea acima é o plano B, e ela já está preenchida
  try { await navigator.clipboard.writeText(texto); toast('Arquivo copiado. Cole em js/dados-rotas.js.'); }
  catch { toast('Sem acesso à área de transferência: copie da caixa de texto abaixo.'); }
}
