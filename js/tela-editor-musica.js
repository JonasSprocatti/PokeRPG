/* ============ 🎵 Editor de músicas (só admin) ============
   Pedido do usuário (07/10/2026): "quero colocar a opção de editar as músicas também para o admin, do mesmo
   jeito" — do mesmo jeito que o 🗺 Editor de rotas, ou seja: tela dentro do jogo, rascunho neste navegador,
   📤 Publicar pela nuvem (vale sem deploy) e 📋 Copiar o bloco pro repositório.

   Já existia `musica.html`, uma página solta de autoria. Ela continua (é onde se compõe de qualquer aparelho, e
   tem o 🎲 sortear frase), mas não é admin, não entra na barra de telas e não publica — era o que faltava.

   O preview toca pelo MOTOR DE VERDADE (`som.tocarPreview`): o que você ouve aqui é o que o jogo toca. Editor com
   sintetizador próprio sairia do ar em uma semana.
   As contas e o rascunho moram em js/editor-musica.js (puro); aqui é só DOM. */
import { $, limparTopo, toast } from './ui.js';
import { barraTelas } from './navegacao.js';
import { esc } from './util.js';
import { ehAdmin } from './nuvem.js';
import { TEMAS, CONTEXTOS, ESCALAS, ONDAS, RAIZ, PASSOS_DO_COMPASSO, ACORDES_NA_PROGRESSAO } from './dados-musica.js';
import { tocarPreview, pararMusica } from './som.js';
import { validarMusica } from './conteudo.js';
import { conteudo } from './conteudo-nuvem.js';
import { publicar } from './tela-editor-rotas.js';
import {
  temaEditado, contextoEditado, foiEditado, quantosEditados,
  gravar, desfazer, limparRascunhoMusica, musicaEditada, gerarBlocoMusica
} from './editor-musica.js';

let bioma = 'floresta', contexto = 'explorar';

export function telaEditorMusica() {
  // admin dos dois lados, igual ao editor de rotas: a tela é alcançável por `data-act` digitado no console
  if (!ehAdmin()) { toast('O editor de músicas é da conta de manutenção.'); return; }
  limparTopo();
  if (!TEMAS[bioma]) bioma = Object.keys(TEMAS)[0];
  if (!CONTEXTOS[contexto]) contexto = Object.keys(CONTEXTOS)[0];
  const t = temaEditado(bioma), c = contextoEditado(contexto), n = quantosEditados();
  $('#app').innerHTML = `${barraTelas('musica')}
    <section class="card">
      <h2>🎵 Editor de músicas <span class="muted small">conta de manutenção</span></h2>
      <p class="small muted">A trilha nasce na hora (Web Audio): cada <b>bioma</b> dá a tonalidade e cada
        <b>contexto de tela</b> dá o andamento. Edite, aperte ▶ pra ouvir pelo motor do jogo e publique.
        O rascunho fica <b>neste navegador</b> até você publicar.
        ${n ? `<b>${n} faixa(s)</b> no rascunho.` : ''}
        Tocando hoje: versão <b>${conteudo.versao}</b> (${esc(conteudo.canal)}).</p>
      <div class="subrow">
        ${Object.keys(TEMAS).map(b => `<button class="btn ${b === bioma ? '' : 'ghost'} sm" data-act="em-bioma" data-v="${b}">${b}${foiEditado('temas', b) ? ' ✏' : ''}</button>`).join('')}
      </div>
    </section>
    ${blocoTema(t)}
    ${blocoContexto(c)}
    ${blocoPublicar(n)}`;
}

/* ---- o tema do bioma: tonalidade e frase ---- */
function blocoTema(t) {
  return `<section class="card">
      <h3>🌿 Tema de <b>${esc(bioma)}</b></h3>
      <p class="small muted">A frase é um token por semicolcheia, ${PASSOS_DO_COMPASSO} no compasso:
        <b>número</b> = grau da escala (0 = a nota do acorde) · <b>.</b> = silêncio · <b>-</b> = segura a nota
        anterior. A raiz fica entre ${RAIZ.min} e ${RAIZ.max} (Dó2–Lá2) e nada passa de 880 Hz — foi a queixa
        "som agudo demais", e o passa-baixa da saída corta em 2 kHz.</p>
      <div class="subrow">
        <label class="campo">Raiz (MIDI)
          <input id="em-raiz" type="number" min="${RAIZ.min}" max="${RAIZ.max}" value="${t.raiz}" style="width:90px"></label>
        <label class="campo">Escala
          <select id="em-escala">${Object.keys(ESCALAS).map(k => `<option value="${esc(k)}" ${k === t.escala ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></label>
        <label class="campo">Onda
          <select id="em-onda"><option value="">— herda do contexto —</option>
            ${ONDAS.map(o => `<option value="${o}" ${o === t.onda ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
        <label class="campo">Acordes (${ACORDES_NA_PROGRESSAO} compassos, em semitons)
          <input id="em-acordes" type="text" value="${esc(t.acordes.join(' '))}" maxlength="20" style="width:140px"></label>
      </div>
      <label class="campo">Frase do bioma
        <input id="em-melodia" type="text" value="${esc(t.melodia)}" spellcheck="false" style="font-family:ui-monospace,monospace;letter-spacing:1px"></label>
      <div class="subrow">
        <button class="btn sm" data-act="em-tocar-tema">▶ Tocar este bioma</button>
        <button class="btn ghost sm" data-act="em-parar">■ Parar</button>
        <button class="btn sm" data-act="em-salvar-tema">💾 Guardar no rascunho</button>
        ${foiEditado('temas', bioma) ? `<button class="btn ghost sm" data-act="em-desfazer-tema">↩ Voltar ao que está no jogo</button>` : ''}
      </div>
    </section>`;
}

/* ---- o contexto de tela: andamento, agitação e a frase da batalha ---- */
function blocoContexto(c) {
  return `<section class="card">
      <h3>🖥 Contexto de tela</h3>
      <p class="small muted">O contexto escolhido também é <b>em que velocidade o ▶ acima toca</b>.
        A <b>frase fixa</b> vence a do bioma de propósito: música de luta só é marcante se for a mesma toda vez —
        a rota continua entrando pela tonalidade. Contexto sem frase fixa toca a do bioma.</p>
      <div class="subrow">
        ${Object.keys(CONTEXTOS).map(q => `<button class="btn ${q === contexto ? '' : 'ghost'} sm" data-act="em-contexto" data-v="${q}">${q}${foiEditado('contextos', q) ? ' ✏' : ''}</button>`).join('')}
      </div>
      <div class="subrow" style="margin-top:8px">
        <label class="campo">BPM <input id="em-bpm" type="number" min="40" max="200" value="${c.bpm}" style="width:90px"></label>
        <label class="campo">Densidade (0–1) <input id="em-densidade" type="number" min="0.05" max="1" step="0.01" value="${c.densidade}" style="width:90px"></label>
        <label class="campo">Onda
          <select id="em-ctx-onda">${ONDAS.map(o => `<option value="${o}" ${o === c.onda ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
      </div>
      <label class="campo">Frase fixa (vazio = toca a do bioma)
        <input id="em-fixa" type="text" value="${esc(c.melodiaFixa || '')}" spellcheck="false" style="font-family:ui-monospace,monospace;letter-spacing:1px"></label>
      <div class="subrow">
        <button class="btn sm" data-act="em-tocar-fixa">▶ Tocar a frase fixa</button>
        <button class="btn ghost sm" data-act="em-parar">■ Parar</button>
        <button class="btn sm" data-act="em-salvar-contexto">💾 Guardar no rascunho</button>
        ${foiEditado('contextos', contexto) ? `<button class="btn ghost sm" data-act="em-desfazer-contexto">↩ Voltar ao que está no jogo</button>` : ''}
      </div>
    </section>`;
}

function blocoPublicar(n) {
  return `<section class="card">
      <h3>📤 Publicar</h3>
      <p class="small muted">A música sai no <b>mesmo pacote</b> das rotas e missões (é uma linha por canal no
        banco), então publicar daqui leva as duas coisas — o rascunho do 🗺 Editor de rotas inclusive.
        📤 grava no canal de <b>teste</b>, que só a sua conta lê; ✅ promove o que está <b>no teste</b> pra todos.</p>
      <div class="subrow">
        <button class="btn" data-act="em-publicar">📤 Publicar (só eu vejo)</button>
        <button class="btn ghost" data-act="em-liberar">✅ Liberar pra todos</button>
      </div>
      <div class="subrow">
        <button class="btn ghost" data-act="em-copiar">📋 Copiar o bloco</button>
        ${n ? '<button class="btn ghost" data-act="em-limpar">🧹 Apagar o rascunho inteiro</button>' : ''}
      </div>
      <p class="small muted">📋 devolve as tabelas <code>CONTEXTOS</code> e <code>TEMAS</code> pra colar em
        <code>js/dados-musica.js</code> — é o que faz uma instalação nova nascer com a versão certa.</p>
      <textarea id="em-saida" rows="8" readonly placeholder="O bloco aparece aqui depois de copiar."></textarea>
    </section>`;
}

/* ---- ler os campos ---- */
// acordes: "0 5 7 5" (também aceita vírgula, que é como está no arquivo)
const lerAcordes = txt => String(txt || '').split(/[\s,]+/).filter(Boolean).map(Number);
function lerTema() {
  return {
    raiz: Number($('#em-raiz')?.value),
    escala: $('#em-escala')?.value,
    acordes: lerAcordes($('#em-acordes')?.value),
    melodia: ($('#em-melodia')?.value || '').trim(),
    ...($('#em-onda')?.value ? { onda: $('#em-onda').value } : {})
  };
}
function lerContexto() {
  const fixa = ($('#em-fixa')?.value || '').trim();
  return {
    bpm: Number($('#em-bpm')?.value),
    densidade: Number($('#em-densidade')?.value),
    onda: $('#em-ctx-onda')?.value,
    ...(fixa ? { melodiaFixa: fixa } : {})
  };
}
/* Valida pela MESMA função que o pacote usa (`conteudo.validarMusica`), com a edição sozinha dentro — senão o
   editor aprovaria o que a publicação recusa, e o erro só apareceria depois, no toast do 📤. */
const conferir = (parte, chave, valor) => validarMusica({ [parte]: { [chave]: valor } });

/* ---- ações (main.js despacha) ---- */
export function acaoEditorMusica(qual, v) {
  if (!ehAdmin()) return;
  if (qual === 'bioma') { bioma = v; return telaEditorMusica(); }
  if (qual === 'contexto') { contexto = v; return telaEditorMusica(); }
  if (qual === 'parar') return pararMusica();

  if (qual === 'tocar-tema' || qual === 'tocar-fixa') {
    const t = lerTema(), c = lerContexto();
    const fixa = qual === 'tocar-fixa';
    /* Confere as DUAS metades antes de tocar, mesmo editando só uma: o preview usa o tema e o contexto juntos, e
       campo vazio viraria `NaN` na frequência — isso estoura DENTRO do agendador (um `setTimeout`), onde ninguém
       vê o erro e a trilha simplesmente para. Ouvir vem antes de guardar, então a guarda é aqui também. */
    const erro = validarMusica({ temas: { [bioma]: t }, contextos: { [contexto]: c } });
    if (!erro.ok) return toast(erro.porque);
    const melodia = fixa ? c.melodiaFixa : t.melodia;
    if (!melodia) return toast('Este contexto não tem frase fixa — escreva uma, ou ouça o bioma acima.');
    /* `preview: true` (dentro de `tocarPreview`) faz a melodia do TEMA mandar, então pra ouvir a frase FIXA basta
       passá-la como melodia. O andamento vem dos campos do contexto, não da tabela: é a edição que se quer ouvir. */
    return tocarPreview(contexto, {
      ...t, escala: ESCALAS[t.escala], bpm: c.bpm, densidade: c.densidade, onda: t.onda || c.onda, melodia
    });
  }
  if (qual === 'salvar-tema') {
    const t = lerTema(), erro = conferir('temas', bioma, t);
    if (!erro.ok) return toast(erro.porque);
    gravar('temas', bioma, t);
    toast(`Tema de ${bioma} guardado no rascunho.`);
    return telaEditorMusica();
  }
  if (qual === 'salvar-contexto') {
    const c = lerContexto(), erro = conferir('contextos', contexto, c);
    if (!erro.ok) return toast(erro.porque);
    gravar('contextos', contexto, c);
    toast(`Contexto ${contexto} guardado no rascunho.`);
    return telaEditorMusica();
  }
  if (qual === 'desfazer-tema') { desfazer('temas', bioma); toast('Tema de volta ao que está no jogo.'); return telaEditorMusica(); }
  if (qual === 'desfazer-contexto') { desfazer('contextos', contexto); toast('Contexto de volta ao que está no jogo.'); return telaEditorMusica(); }
  if (qual === 'limpar') { limparRascunhoMusica(); toast('Rascunho de música apagado.'); return telaEditorMusica(); }
  if (qual === 'copiar') return copiarBloco();
  // publicar é do editor de ROTAS de propósito: o pacote é um só (ver tela-editor-rotas.publicar)
  if (qual === 'publicar') return publicar('teste');
  if (qual === 'liberar') return publicar('estavel');
}

async function copiarBloco() {
  let texto;
  try { texto = gerarBlocoMusica(musicaEditada()); }
  catch (e) { console.error('editor de músicas: gerar o bloco falhou', e); return toast('Não deu pra gerar o bloco: ' + e.message); }
  const area = $('#em-saida'); if (area) area.value = texto;
  try { await navigator.clipboard.writeText(texto); toast('Bloco copiado. Cole em js/dados-musica.js.'); }
  catch { toast('Sem acesso à área de transferência: copie da caixa de texto abaixo.'); }
}
