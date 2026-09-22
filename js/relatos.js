/* ============ bugs e sugestões (tela) ============ */
// Formulário que manda pra tabela `relatos` (nuvem.js → enviarRelato; sem internet vai pra fila e sobe depois).
// Bug leva um anexo técnico (versão, navegador, tela, modo, Pokémon, zona, últimas linhas do registro) — sem dados
// pessoais; o jogador vê exatamente o que vai junto e pode desligar.
import { G, dificuldadeDe } from './estado.js';
import { $, limparTopo } from './ui.js';
import { enviarRelato, relatosNaFila, meusRelatos, usuario, nuvemConfigurada } from './nuvem.js';
import { barraTelas, rotuloVoltar } from './navegacao.js';
import { esc, offline } from './util.js';

let tipo = 'bug';
let rascunho = { titulo: '', texto: '', passos: '', anexar: true };

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
      <button class="btn big" data-act="rel-enviar">Enviar ${bug ? 'bug' : 'sugestão'}</button>
    </section>
    <div id="rel-meus"></div>
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">${rotuloVoltar()}</button></div></main>`;
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
    const r = await enviarRelato(relato);
    rascunho = { titulo: '', texto: '', passos: '', anexar: true };
    telaRelatos(r === 'enviado' ? `Obrigado! ${bug ? 'Bug' : 'Sugestão'} enviado(a). 💛` : '📴 Sem conexão agora: guardei aqui e envio sozinho quando a internet voltar.');
  } catch (e) { telaRelatos(`Não deu pra enviar: ${esc(e.message)}`); }
}
