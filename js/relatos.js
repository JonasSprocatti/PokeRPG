/* ============ bugs e sugestões (tela) ============ */
// Formulário que manda pra tabela `relatos` (nuvem.js → enviarRelato; sem internet vai pra fila e sobe depois).
// Bug leva um anexo técnico (versão, navegador, tela, modo, Pokémon, zona, últimas linhas do registro) — sem dados
// pessoais; o jogador vê exatamente o que vai junto e pode desligar.
import { G, dificuldadeDe } from './estado.js';
import { $, limparTopo } from './ui.js';
import { enviarRelato, enviarFilaRelatos, relatosNaFila, meusRelatos, usuario, nuvemConfigurada } from './nuvem.js';
import { barraTelas, rotuloVoltar } from './navegacao.js';
import { esc, offline } from './util.js';
import { MAX_IMAGENS, MAX_BYTES_IMAGEM, TIPOS_IMAGEM, mb, motivoDeRecusa, comprimirImagem } from './imagens-relato.js';

let tipo = 'bug';
let rascunho = { titulo: '', texto: '', passos: '', anexar: true };
/* Imagens escolhidas (até MAX_IMAGENS): { blob, tipo, nome, url }. Ficam na memória desta aba — sobrevivem a re-renderizar a
   tela (trocar bug/sugestão, erro de validação), mas não a recarregar a página. `url` é só a miniatura (objectURL). */
let imagens = [];
const limparImagens = () => { for (const i of imagens) URL.revokeObjectURL(i.url); imagens = []; };
export function removerImagemRelato(i) {
  const [tirada] = imagens.splice(+i, 1); if (tirada) URL.revokeObjectURL(tirada.url);
  guardar(); telaRelatos();
}
// escolhidas no seletor ou coladas (Ctrl+V): valida cada uma, comprime e junta ao que já tem
async function adicionarArquivos(arquivos) {
  guardar();
  const avisos = [];
  for (const a of arquivos) {
    const motivo = motivoDeRecusa(a, imagens.length);
    if (motivo) { avisos.push(esc(motivo)); if (imagens.length >= MAX_IMAGENS) break; continue; }
    const { blob, tipo: t } = await comprimirImagem(a);
    imagens.push({ blob, tipo: t, nome: a.name || 'print', url: URL.createObjectURL(blob) });
  }
  telaRelatos(avisos.join('<br>'));
}

// o que vai junto num bug (nada pessoal: sem e-mail, sem nome da conta)
export function contextoTecnico() {
  const S = G.S, P = S?.player;
  const semHtml = h => String(h || '').replace(/<[^>]+>/g, '').slice(0, 200);
  return {
    versao: 'pokerpg-jogo-v1', tela: G.mode, navegador: navigator.userAgent.slice(0, 200),
    viewport: `${innerWidth}x${innerHeight}`, online: !offline(), data: new Date().toISOString(),
    jornada: S ? { modo: dificuldadeDe(S), especie: P.data.speciesName, nivel: P.level, gen: S.gen || 1, zona: S.zone, aliados: (S.aliados || []).length,
      emBatalha: !!G.B, ultimasLinhas: (S.log || []).slice(-8).map(l => semHtml(l.html)) } : null
  };
}

/* Por que o relato ficou na fila. Cada caso pede uma atitude diferente de quem joga, então dizer "sem conexão"
   pra tudo é pior do que não dizer nada: com a tabela `relatos` faltando no servidor, a pessoa ficaria esperando
   a internet "voltar" pra algo que não depende dela. */
const textoDaFila = motivo =>
  motivo === 'sem-conexao' ? '📴 Sem conexão agora: guardei aqui e envio sozinho quando a internet voltar.'
  : motivo === 'sem-config' ? '💾 O envio online não está configurado neste site: guardei aqui neste navegador.'
  : `💾 Guardei aqui: o servidor recusou o envio (${esc(motivo)}). Tento de novo sozinho quando você abrir esta tela.`;

export const escolherTipoRelato = t => { if (['bug', 'sugestao'].includes(t)) { guardar(); tipo = t; telaRelatos(); } };
const guardar = () => { // mantém o que foi digitado ao trocar de tipo / re-renderizar
  rascunho = { titulo: $('#rel-titulo')?.value ?? rascunho.titulo, texto: $('#rel-texto')?.value ?? rascunho.texto,
    passos: $('#rel-passos')?.value ?? rascunho.passos, anexar: $('#rel-anexar')?.checked ?? rascunho.anexar };
};

export async function telaRelatos(msg = '') {
  G.mode = 'relatos'; limparTopo();
  const bug = tipo === 'bug', fila = relatosNaFila();
  $('#app').innerHTML = `<main class="create relatos">
    ${barraTelas('relatos')}
    <h1>Bugs e sugestões.</h1>
    <p class="lead">Achou algo quebrado ou teve uma ideia? Conta aqui. Tudo chega pra quem mantém o jogo.${usuario() ? '' : ' Não precisa de conta.'}</p>
    ${msg ? `<p class="notice">${msg}</p>` : ''}
    ${!nuvemConfigurada() ? '<div class="notice">O envio online ainda não foi configurado neste site: o relato fica guardado neste navegador.</div>' : ''}
    ${fila ? `<p class="small muted">📮 ${fila} relato(s) esperando internet pra ser enviado(s).</p>` : ''}
    <section class="login-card relato-card">
      <div class="abils rel-tipos">
        <button class="abil ${bug ? 'on' : ''}" data-act="rel-tipo" data-v="bug" aria-pressed="${bug}"><b>🐞 Bug</b><small>Algo quebrado, travado ou diferente do esperado.</small></button>
        <button class="abil ${!bug ? 'on' : ''}" data-act="rel-tipo" data-v="sugestao" aria-pressed="${!bug}"><b>💡 Sugestão</b><small>Ideia, melhoria, Pokémon ou mecânica que você quer ver.</small></button>
      </div>
      <label class="campo">Título<input id="rel-titulo" maxlength="120" placeholder="${bug ? 'Ex.: botão de fugir não responde no celular' : 'Ex.: evoluir Eevee com pedras'}" value="${esc(rascunho.titulo)}"></label>
      <label class="campo">${bug ? 'O que aconteceu?' : 'Conta a ideia'}<textarea id="rel-texto" rows="5" maxlength="3000" placeholder="${bug ? 'O que você esperava e o que aconteceu de verdade.' : 'Como funcionaria, por que seria legal…'}">${esc(rascunho.texto)}</textarea></label>
      ${bug ? `<label class="campo">Como reproduzir (opcional)<textarea id="rel-passos" rows="3" maxlength="900" placeholder="1. Abri o Multiplayer  2. Criei uma sala  3. …">${esc(rascunho.passos)}</textarea></label>
      <label class="check"><input type="checkbox" id="rel-anexar" ${rascunho.anexar ? 'checked' : ''}> Anexar informações técnicas
        <small class="muted">Ajuda a achar o problema. Nada pessoal (sem e-mail nem nome da conta). <details><summary>Ver o que vai junto</summary><pre class="rel-ctx">${esc(JSON.stringify(contextoTecnico(), null, 2))}</pre></details></small></label>` : ''}
      <div class="campo rel-imagens">
        <span>Imagens (opcional)</span>
        <small class="muted">Até ${MAX_IMAGENS} imagens de até ${mb(MAX_BYTES_IMAGEM)} cada — o tamanho de ${MAX_IMAGENS} prints de celular ou de computador. PNG, JPG ou WebP. No computador dá pra colar com Ctrl+V.${offline() ? ' Sem internet as imagens ficam guardadas aqui e sobem junto com o relato.' : ''}</small>
        ${imagens.length ? `<div class="rel-thumbs">${imagens.map((im, i) => `<figure class="rel-thumb"><img src="${im.url}" alt="Imagem ${i + 1} do relato"><figcaption>${esc(im.nome.slice(-24))} · ${mb(im.blob.size)}</figcaption>
          <button type="button" class="btn ghost sm" data-act="rel-img-del" data-v="${i}" aria-label="Tirar a imagem ${i + 1}">✕ Tirar</button></figure>`).join('')}</div>` : ''}
        ${imagens.length < MAX_IMAGENS ? `<label class="btn ghost sm rel-add">📎 Adicionar imagem<input type="file" id="rel-img" accept="${TIPOS_IMAGEM.join(',')}" multiple hidden></label>` : ''}
      </div>
      <button class="btn big" data-act="rel-enviar">Enviar ${bug ? 'bug' : 'sugestão'}</button>
    </section>
    <div id="rel-meus"></div>
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">${rotuloVoltar()}</button></div></main>`;
  $('#rel-img')?.addEventListener('change', e => { const l = [...e.target.files]; e.target.value = ''; adicionarArquivos(l); });
  $('.relatos')?.addEventListener('paste', e => {   // print colado com Ctrl+V (PC) ou "colar" no celular
    const colados = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
    if (colados.length) { e.preventDefault(); adicionarArquivos(colados); }
  });
  /* Tenta esvaziar a fila SEMPRE que esta tela abre. Antes isso só acontecia no evento `online` e no início do
     jogo — e o `online` não dispara quando o navegador já se considera conectado, então um relato guardado podia
     ficar preso indefinidamente com a tela dizendo que estava "esperando internet". */
  if (fila && !offline()) enviarFilaRelatos().then(r => {
    if (!r.enviados || G.mode !== 'relatos') return;
    telaRelatos(`📤 ${r.enviados} relato(s) que estavam guardados foram enviados agora. 💛`);
  }).catch(e => console.warn('relatos', e));

  // os seus relatos já enviados (com conta)
  if (usuario() && !offline()) meusRelatos().then(lista => {
    if (!lista.length || G.mode !== 'relatos') return;
    $('#rel-meus').innerHTML = `<h3 class="passo">Seus relatos</h3><ul class="amigos">${lista.map(r => `<li>${r.tipo === 'bug' ? '🐞' : '💡'} <b>${esc(r.titulo)}</b><small class="muted">${new Date(r.criado_em).toLocaleDateString('pt-BR')} · ${esc(r.status)}</small></li>`).join('')}</ul>`;
  }).catch(() => {});
}

export async function enviarRelatoTela() {
  guardar();
  const titulo = rascunho.titulo.trim(), texto = rascunho.texto.trim();
  if (titulo.length < 3) return telaRelatos('Dê um título (pelo menos 3 letras).');
  if (texto.length < 5) return telaRelatos('Conte um pouco mais na descrição.');
  const bug = tipo === 'bug', passos = bug ? rascunho.passos.trim() : '';
  const relato = { tipo, titulo, texto: passos ? `${texto}\n\nComo reproduzir:\n${passos}` : texto, contexto: bug && rascunho.anexar ? contextoTecnico() : null };
  try {
    const r = await enviarRelato(relato, imagens.map(({ blob, tipo: t }) => ({ blob, tipo: t })));
    rascunho = { titulo: '', texto: '', passos: '', anexar: true };
    limparImagens();
    const semImg = r.semImagens ? `<br>⚠ ${r.semImagens === 1 ? 'A imagem' : `As ${r.semImagens} imagens`} não coube${r.semImagens === 1 ? '' : 'ram'} na fila offline e ficou${r.semImagens === 1 ? '' : 'ram'} de fora: se puder, envie de novo quando tiver internet.` : '';
    telaRelatos(r.estado === 'enviado' ? `Obrigado! ${bug ? 'Bug' : 'Sugestão'} enviado(a). 💛` : textoDaFila(r.motivo) + semImg);
  } catch (e) { telaRelatos(`Não deu pra enviar: ${esc(e.message)}`); }
}
