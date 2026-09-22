/* ============ ponto de entrada ============ */
// Um único listener delegado por tipo de evento (click/change/keydown) no document: todo botão só
// declara `data-act` (+ `data-v`), então re-render total não precisa religar handler nenhum.
import { G, SAVE_KEY, save, nm, ladoJogador, centroPokemon, zerarDescontoCentro, ganchosSave, rotasAtuais } from './estado.js';
import { $, log, logRaw, ask, iniciarMenu, toast } from './ui.js';
import { render, buildGame } from './render.js';
import { showCreate, previewSearch, renderPreview, renderDificuldade, sortearEspecie, startGame, fullRandomizer } from './criacao.js';
import { encerrarJornada, telaCarreira, telaEscolherGen } from './fim.js';
import { guardadas, guardar, retirar, excluir, MAX_GUARDADAS } from './saves.js';
import { telaSaves } from './tela-saves.js';
import { GENS, dadosDaGen, entrarNaGen } from './mapas.js';
import { iniciarNuvem, aoMudarNuvem, ganchos, agendarEnvioSave, apagarSaveNuvem, entrarGoogle, entrarEmail, sair, salvarApelido, sincronizar,
  nuvem, salvarIcone, pedirAmizade, aceitarAmizade, removerAmizade } from './nuvem.js';
import { renderChipConta, telaConta, htmlIcone, mudarIconeEdit, sortearIcone, alternarShinyIcone, iconeEscolhido, limparIconeEdit } from './conta.js';
import { telaRanking } from './ranking.js';
import { telaRelatos, escolherTipoRelato, enviarRelatoTela } from './relatos.js';
import { telaMultiplayer, criarSala, entrarSala, sairSala, naSala, iniciarBatalhaMP, escolherGolpeMP, fugirMP, desistirMP, mirarMP, configurarSala, escolherTime, escolherEntrada, escolherConvidado, convidarAmigoMP } from './multiplayer.js';
import { iniciarPaineis } from './paineis.js';
import { explore, desafiarChefe } from './mundo.js';
import { turn } from './batalha.js';
import { healFull } from './efeitos.js';
import { addItem, useItem } from './itens.js';
import { verificarMissoes } from './missoes.js';
import { ITEMS, ORDENS } from './dados.js';
import { freshVol, zonaLiberada } from './regras.js';
import { despedir } from './amizade.js';
import { store, esc, fmt, novoId } from './util.js';

/* ============ eventos ============ */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const v = b.dataset.v;
  switch (b.dataset.act) {
    case 'search': return previewSearch($('#q')?.value || '');
    case 'random': return sortearEspecie();
    case 'carreira': if (G.busy || G.mode === 'battle') return; return telaCarreira();
    case 'voltar': if (naSala()) await sairSala(); return voltar();
    // multiplayer (co-op)
    case 'mp': if (G.busy || !['explore', 'create'].includes(G.mode)) return; return telaMultiplayer(); // da run ou da tela inicial (sem run: Pokémon convidado)
    case 'mp-entrada': return escolherEntrada(v);
    case 'mp-convidado': return escolherConvidado(v);
    case 'mp-criar': return criarSala();
    case 'mp-entrar': return entrarSala($('#mp-codigo')?.value);
    case 'mp-sair': await sairSala(); return voltar();
    case 'mp-explorar': return iniciarBatalhaMP('selvagem');
    case 'mp-alfa': return iniciarBatalhaMP('alfa');
    case 'mp-pvp': return iniciarBatalhaMP('pvp');
    case 'mp-time': return escolherTime(v);
    case 'mp-desistir': {
      const ok = await ask('Desistir da luta? Seu time inteiro sai e o outro vence.', [{ label: 'Desistir', value: true }, { label: 'Continuar lutando', value: false, ghost: true }]);
      return ok ? desistirMP() : undefined;
    }
    case 'mp-golpe': return escolherGolpeMP(+v);
    case 'mp-fugir': return fugirMP();
    case 'mp-mirar': return mirarMP(v);
    case 'ranking': if (G.busy || G.mode === 'battle') return; return telaRanking();
    // bugs e sugestões
    case 'relatos': if (G.busy || G.mode === 'battle' || G.mode === 'mp') return; return telaRelatos();
    case 'rel-tipo': return escolherTipoRelato(v);
    case 'rel-enviar': return enviarRelatoTela();
    // conta / nuvem
    case 'conta': if (G.busy || G.mode === 'battle') return; return telaConta();
    case 'entrar-google': try { await entrarGoogle(); } catch (err) { telaConta(`Não deu pra entrar com o Google: ${esc(err.message)}`); } return;
    case 'entrar-email': {
      const email = ($('#email')?.value || '').trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) return telaConta('Digite um e-mail válido.');
      try { await entrarEmail(email); telaConta(`Enviamos um link de acesso pra <b>${esc(email)}</b>. Abra o e-mail neste aparelho e clique nele.`); }
      catch (err) { telaConta(`Não deu pra enviar o link: ${esc(err.message)}`); }
      return;
    }
    case 'salvar-apelido': {
      const ap = ($('#apelido')?.value || '').trim().slice(0, 20);
      if (!ap) return telaConta('O apelido não pode ficar vazio.');
      try { await salvarApelido(ap); telaConta('Apelido salvo.'); } catch (err) { telaConta(`Não deu pra salvar: ${esc(err.message)}`); }
      return;
    }
    case 'sincronizar': await sincronizar(); return telaConta();
    // ícone (qualquer Pokémon, normal ou shiny)
    case 'icone-buscar': return mudarIconeEdit($('#icone-busca')?.value);
    case 'icone-sortear': return sortearIcone();
    case 'icone-shiny': return alternarShinyIcone();
    case 'icone-salvar': {
      const ic = iconeEscolhido();
      try { await salvarIcone(ic.id, ic.shiny); limparIconeEdit(); telaConta('Ícone salvo.'); } catch (err) { telaConta(`Não deu pra salvar o ícone: ${esc(err.message)}`); }
      return;
    }
    // amigos
    case 'amigo-add': {
      const cod = ($('#amigo-codigo')?.value || '').trim();
      if (!/^[A-Za-z0-9]{6}$/.test(cod)) return telaConta('O código de amigo tem 6 letras/números.');
      try { telaConta((await pedirAmizade(cod)) === 'aceita' ? 'Vocês agora são amigos! 🎉' : 'Pedido enviado. Quando a pessoa aceitar, ela aparece na sua lista.'); }
      catch (err) { telaConta(`Não deu: ${esc(err.message)}`); }
      return;
    }
    case 'amigo-aceitar': try { await aceitarAmizade(+v); telaConta('Amizade aceita! 🎉'); } catch (err) { telaConta(`Não deu: ${esc(err.message)}`); } return;
    case 'amigo-remover': {
      if (b.dataset.nome && !(await ask(`Remover ${esc(b.dataset.nome)} dos amigos?`, [{ label: 'Remover', value: true }, { label: 'Cancelar', value: false, ghost: true }]))) return;
      try { await removerAmizade(+v); telaConta(); } catch (err) { telaConta(`Não deu: ${esc(err.message)}`); }
      return;
    }
    // convite de amigo pra sala (toast)
    case 'mp-convidar': try { await convidarAmigoMP(v); } catch (err) { console.error(err); } return;
    case 'mp-aceitar-convite': {
      if (G.busy || G.mode === 'battle') return toast('Termine a batalha antes de entrar na sala.', 5000);
      if (naSala()) await sairSala();
      return entrarSala(v);
    }
    case 'sair': await sair(); return telaConta('Você saiu da conta. O que já foi salvo continua na nuvem e neste navegador.');
    case 'pick': return previewSearch(v);
    case 'ability': G.PV.ability = v; return renderPreview();
    case 'dificuldade': G.dif = v; return renderDificuldade();
    case 'randomizer': return fullRandomizer(b);
    case 'recomecar': G.S = null; G.B = null; G.PV = null; return showCreate();
    case 'start': return startGame(b);
    case 'explore': return explore();
    case 'zone': {
      const z = rotasAtuais().find(x => x.id === v); // só rotas do mapa atual
      if (!z || !zonaLiberada(z, G.S.player.level)) return; // chip trancado já vem desativado; isto é a garantia
      G.S.zone = v; save(); return render();
    }
    // fechou uma Gen (fora do Roguelike): vai pro mapa escolhido
    case 'proxima-gen': {
      if (!G.S?.escolhendoGen || !GENS.some(x => x.gen === +v)) return;
      entrarNaGen(G.S, +v); save();
      return abrirJornada(G.S, `🗺 Você chega em ${dadosDaGen(+v).regiao} (Gen ${v}). Os Pokémon daqui começam perto do seu nível.`);
    }
    case 'gen': G.gen = +v; return renderDificuldade();
    case 'chefe': return desafiarChefe();
    case 'panel': G.panel = v; return render();
    case 'heal': {
      // o botão já vem desativado nesses casos; a checagem aqui é a garantia (clique duplo, estado mudou entre renders)
      const { precisa, custo } = centroPokemon();
      if (G.busy || !precisa || G.S.money < custo) return;
      G.S.money -= custo; G.S.gasto = (G.S.gasto || 0) + custo; healFull(); zerarDescontoCentro();
      log(`${custo ? `Você pagou ₽${custo} e descansou` : 'Você descansou'} no Centro Pokémon. HP, PP e status ${G.S.aliados?.length ? 'da equipe ' : ''}restaurados.`, 'good');
      await verificarMissoes(); save(); return render();
    }
    case 'oferecer': return turn({ type: 'oferecer', id: v });
    case 'despedir': if (G.busy) return; G.busy = true; render(); try { await despedir(+v); } finally { G.busy = false; render(); save(); } return;
    case 'buy': {
      const it = ITEMS[v]; if (!it || G.S.money < it.price) return;
      G.S.money -= it.price; G.S.gasto = (G.S.gasto || 0) + it.price; addItem(v, 1); log(`Você comprou ${it.name} por ₽${it.price}.`);
      await verificarMissoes(); save(); return render(); // missões de gastar dinheiro
    }
    case 'item': if (G.busy) return; G.busy = true; render(); try { await useItem(v, false); await verificarMissoes(); } finally { G.busy = false; render(); save(); } return;
    case 'item-b': return turn({ type: 'item', id: v });
    case 'move': return turn({ type: 'move', idx: +v });
    case 'run': return turn({ type: 'run' });
    case 'new': {
      if (G.busy || G.mode === 'battle') return;
      // guardar (continua depois, 💾 Jornadas salvas) ou encerrar (resultado vai pra carreira, fim.js)
      const r = await ask('Começar outra jornada? Você pode <b>guardar</b> esta pra continuar depois (💾 Jornadas salvas) ou <b>encerrar</b>: o resultado vai para a sua carreira e o save desta jornada é apagado (aqui e na nuvem).',
        [{ label: '💾 Guardar e começar outra', value: 'guardar' }, { label: 'Encerrar jornada', value: 'encerrar', ghost: true }, { label: 'Continuar jogando', value: null, ghost: true }]);
      if (r === 'guardar') return guardarAtual();
      if (r === 'encerrar') { G.PV = null; encerrarJornada('encerrou'); }
      return;
    }
    // 💾 jornadas salvas (saves.js / tela-saves.js)
    case 'saves': if (G.busy || G.mode === 'battle') return; return telaSaves();
    case 'save-guardar': return guardarAtual();
    case 'save-continuar': return continuarGuardada(v);
    case 'save-excluir': {
      if (!(await ask(`Excluir a jornada de <b>${esc(b.dataset.nome || '')}</b>? Ela some deste aparelho e da nuvem, e <b>não vai pra carreira</b>. Não dá pra desfazer.`,
        [{ label: 'Excluir', value: true }, { label: 'Cancelar', value: false, ghost: true }]))) return;
      excluir(v); await apagarSaveNuvem(v); // offline: a próxima sincronização apaga da nuvem
      return telaSaves('Jornada excluída.');
    }
  }
});
document.addEventListener('change', e => {
  if (e.target.matches?.('[data-ranking-especie]')) return telaRanking(e.target.value || null);
  const cfg = e.target.dataset?.mpCfg; // configuração da sala (anfitrião): modo, porJogador, zona, balancear
  if (cfg) return configurarSala(cfg, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
  // ordem de aliado (vale a partir da próxima escolha de golpe — o turno em andamento já decidiu as ações)
  const io = e.target.dataset?.ordem;
  if (io !== undefined && G.S?.aliados?.[+io] && ORDENS[e.target.value]) {
    const A = G.S.aliados[+io]; A.ordem = e.target.value;
    log(`${nm(A)}: ${ORDENS[A.ordem].nome}.`, 'muted'); save(); return render();
  }
  if (!G.PV) return;
  if (e.target.id === 'pv-nature') G.PV.nature = e.target.value;
  if (e.target.id === 'pv-level') { G.PV.level = +e.target.value; renderPreview(); }
});
// <details> da ficha do aliado: lembra se está aberto (o evento 'toggle' não sobe, por isso a captura)
document.addEventListener('toggle', e => {
  const i = e.target.dataset?.aliado; if (i === undefined) return;
  if (e.target.open) G.abertos.add(+i); else G.abertos.delete(+i);
}, true);
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'q') previewSearch(e.target.value);
  if (e.target.id === 'mp-codigo') entrarSala(e.target.value);
  if (e.target.id === 'icone-busca') mudarIconeEdit(e.target.value);
  if (e.target.id === 'amigo-codigo') $('[data-act="amigo-add"]')?.click();
});

/* ============ jornada: abrir / voltar ============ */
const saveValido = s => !!(s?.player?.data && s.meta?.growth);
// abre uma jornada salva (deste navegador ou da nuvem) na tela do jogo
function abrirJornada(s, aviso) {
  G.S = s; G.B = null; G.S.id ||= novoId(); // save de antes do id existir ganha um agora
  for (const m of ladoJogador()) m.vol = freshVol();
  G.mode = 'explore'; G.panel = 'main';
  G.S.ultimoTick = Date.now(); // tempo de jogo recomeça a contar agora (não conta o tempo com o jogo fechado)
  if (G.S.escolhendoGen) return telaEscolherGen(); // fechou uma Gen e ainda não escolheu o próximo mapa
  buildGame();
  (G.S.log || []).slice(-20).forEach(logRaw);
  if (aviso) log(aviso, 'muted');
}
// "Voltar" das telas de carreira/conta: pro jogo, se houver jornada; senão pra criação
function voltar() {
  if (G.S) abrirJornada(G.S);
  else { G.PV = null; showCreate(); }
}
// tira a jornada atual da frente sem perder nada (vai pras guardadas) e volta pra tela inicial
function guardarAtual() {
  if (!G.S || G.busy || G.mode === 'battle') return;
  if (naSala()) return toast('Saia da sala multiplayer antes de guardar a jornada.', 5000);
  save(); // grava o estado mais novo (e sobe pra nuvem) antes de guardar
  if (!guardar(G.S)) return telaSaves(`Você já tem ${MAX_GUARDADAS} jornadas guardadas. Continue ou exclua uma antes de guardar outra.`);
  store.del(SAVE_KEY); G.S = null; G.B = null; G.PV = null;
  showCreate();
  toast('💾 Jornada guardada. Ela está em <b>Jornadas salvas</b>.', 5000);
}
// continua uma guardada; a atual (se houver) vai pras guardadas no lugar dela
function continuarGuardada(id) {
  if (G.busy || G.mode === 'battle') return;
  const S = guardadas()[id];
  if (!saveValido(S)) return telaSaves('Esse save está incompleto e não pôde ser aberto.');
  if (G.S && G.S.id !== id) { save(); if (!guardar(G.S)) return telaSaves(`Limite de ${MAX_GUARDADAS} jornadas guardadas: exclua uma antes.`); }
  retirar(id); store.set(SAVE_KEY, S);
  abrirJornada(S, '💾 Jornada retomada.');
  save();
}

/* ============ nuvem: ganchos ============ */
// o save local sempre avisa a nuvem (que só envia se houver conta, com espera juntando vários saves)
ganchosSave.aoSalvar = () => agendarEnvioSave();
ganchos.saveLocal = () => G.S || (saveValido(store.get(SAVE_KEY)) ? store.get(SAVE_KEY) : null);
ganchos.jornadaTerminada = () => {
  store.del(SAVE_KEY);
  if (G.S) { G.S = null; G.B = null; G.PV = null; showCreate(); }
  ask('A jornada que estava neste aparelho já terminou em outro aparelho. O resultado está na sua carreira.', [{ label: 'Ok', value: true }]);
};
// jornada da nuvem que este aparelho não conhece: continuar, guardar (fica em 💾 Jornadas salvas, sem perguntar
// de novo) ou excluir (daqui e da nuvem). Nada é descartado sem escolher.
ganchos.oferecerSave = async (remoto, local) => {
  const r = remoto.player, desc = s => `${esc(s.player.nick || fmt(s.player.name))} (${esc(fmt(s.player.name))}, Nv. ${s.player.level})`;
  const escolha = await ask(`☁ Tem uma jornada na sua conta, vinda de outro aparelho: <b>${desc(remoto)}</b>, salva em ${new Date(remoto.salvoEm || 0).toLocaleString('pt-BR')}.<br><br>`
    + (local ? `Você está jogando ${desc(local)} aqui. Se continuar a da nuvem, esta vai pras <b>jornadas guardadas</b> (não perde nada).`
      : 'O que fazer com ela?'),
    [{ label: `Continuar ${esc(r.nick || fmt(r.name))}`, value: 'continuar' },
     { label: '💾 Guardar pra depois', value: 'guardar', ghost: true },
     { label: '🗑 Excluir', value: 'excluir', ghost: true }]);
  if (escolha !== 'excluir') return escolha;
  // excluir é definitivo: confirma
  return (await ask(`Excluir a jornada de <b>${esc(r.nick || fmt(r.name))}</b>? Ela some da nuvem e não vai pra carreira.`, [{ label: 'Excluir', value: true }, { label: 'Guardar em vez disso', value: false, ghost: true }])) ? 'excluir' : 'guardar';
};
// amigo chamou pra sala: aviso em qualquer tela, com botão de entrar (usa a escolha de Pokémon do menu multiplayer)
ganchos.convite = p => toast(`${htmlIcone(meuIconeDe(p.de), 'icone-mini')} <b>${esc(p.nome)}</b> te chamou pra sala <b>${esc(p.codigo)}</b>${p.modo === 'pvp' ? ' (PvP)' : ' (co-op)'}.
  <div class="subrow" style="margin-top:8px"><button class="btn sm" data-act="mp-aceitar-convite" data-v="${esc(p.codigo)}">Entrar</button></div>`, 60000);
const meuIconeDe = id => { const a = nuvem.amigos.find(x => x.amigo === id); return a ? { id: a.icone_id, shiny: a.icone_shiny } : null; };
ganchos.carregarSave = (remoto, { guardarAtual = false } = {}) => {
  // no meio de um turno não dá pra trocar a jornada: espera ele terminar (senão o save do turno sobrescreveria)
  if (G.busy || G.mode === 'battle') { setTimeout(() => ganchos.carregarSave(remoto, { guardarAtual }), 500); return; }
  // a jornada daqui (outra) vai pras guardadas, não some
  if (guardarAtual && G.S && G.S.id !== remoto.id) { save(); if (!guardar(G.S)) { toast(`Limite de ${MAX_GUARDADAS} jornadas guardadas: a da nuvem ficou em 💾 Jornadas salvas.`, 8000); guardar(remoto); return; } }
  retirar(remoto.id); // se estava guardada, sai da lista (virou a atual)
  store.set(SAVE_KEY, remoto);
  abrirJornada(remoto, '☁ Jornada carregada da sua conta.');
};

/* ============ início ============ */
iniciarPaineis(); // listeners de arrastar/▲▼/divisória, uma vez só
iniciarMenu();    // ☰ do topo no celular
(function boot() {
  const s = store.get(SAVE_KEY);
  if (saveValido(s)) abrirJornada(s, 'Jogo carregado deste navegador.');
  else showCreate();
})();
aoMudarNuvem(renderChipConta);
iniciarNuvem().catch(e => console.error(e)); // sem config: não faz nada
