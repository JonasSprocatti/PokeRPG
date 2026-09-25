/* ============ ponto de entrada ============ */
// Um único listener delegado por tipo de evento (click/change/keydown) no document: todo botão só
// declara `data-act` (+ `data-v`), então re-render total não precisa religar handler nenhum.
import { G, SAVE_KEY, save, nm, ladoJogador, centroPokemon, zerarDescontoCentro, ganchosSave, rotasAtuais } from './estado.js';
import { $, log, logRaw, ask, iniciarMenu, toast, pedirQuantidade } from './ui.js';
import { render, buildGame } from './render.js';
import { showCreate, previewSearch, renderPreview, renderDificuldade, sortearEspecie, startGame, fullRandomizer } from './criacao.js';
import { encerrarJornada, telaCarreira, telaEscolherGen } from './fim.js';
import { guardadas, guardar, retirar, excluir, MAX_GUARDADAS } from './saves.js';
import { telaSaves } from './tela-saves.js';
import { telaAjustes, baixarMapaOffline, baixarImagensOffline, acaoDev } from './tela-ajustes.js';
import { telaPatchNotes } from './tela-patchnotes.js';
import { aplicarFonte } from './ajustes.js';
import { GENS, dadosDaGen, entrarNaGen, genDe } from './mapas.js';
import { iniciarNuvem, aoMudarNuvem, ganchos, agendarEnvioSave, apagarSaveNuvem, entrarGoogle, entrarEmail, sair, salvarApelido, sincronizar,
  nuvem, salvarIcone, salvarBadgeExibida, pedirAmizade, aceitarAmizade, removerAmizade } from './nuvem.js';
import { renderChipConta, telaConta, htmlIcone, mudarIconeEdit, sortearIcone, alternarShinyIcone, iconeEscolhido, limparIconeEdit } from './conta.js';
import { telaRanking } from './ranking.js';
import { telaConquistas, fixarConquista } from './tela-conquistas.js';
import { telaPokedex, verNaPokedex, abrirNaPokedex } from './tela-pokedex.js';
import { telaRelatos, escolherTipoRelato, enviarRelatoTela, removerImagemRelato } from './relatos.js';
import { telaMultiplayer, criarSala, entrarSala, sairSala, naSala, iniciarBatalhaMP, escolherGolpeMP, alternarGimmickMP, fugirMP, desistirMP, mirarMP, configurarSala, escolherTime, escolherEntrada, escolherConvidado, convidarAmigoMP, sincronizarSala, centroMP, reviverMP, usarRaideMP } from './multiplayer.js';
import { iniciarPaineis } from './paineis.js';
import { explore, desafiarChefe, desafiarEvento } from './mundo.js';
import { telaPerfil } from './perfil-amigo.js';
import { telaArena, arenaSelecionar, arenaIniciar, arenaGolpe, arenaRaide, arenaDesistir, arenaFim } from './arena.js';
import { turn, usarMega, usarTera, usarZ, usarGigantamax, serializarBatalha, restaurarBatalha } from './batalha.js';
import { healFull } from './efeitos.js';
import { addItem, useItem, tirarItem, equiparItem, mexerEsconderijo } from './itens.js';
import { verificarMissoes } from './missoes.js';
import { ITEMS, ORDENS, ITEM_SPR, ITEM_ERRO } from './dados.js';
import { freshVol, zonaLiberada, precoItem } from './regras.js';
import { despedir } from './amizade.js';
import { iniciarCache } from './api.js';
import { store, esc, fmt, novoId } from './util.js';

/* ============ eventos ============ */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const v = b.dataset.v;
  // sair pra outra tela pela barra de navegação (navegacao.js) larga a sala multiplayer antes (menos ir PRA sala)
  const TELAS_NAV = ['inicio', 'saves', 'carreira', 'pokedex', 'conquistas', 'ranking', 'conta', 'ajustes', 'relatos', 'patch', 'arena'];
  if (TELAS_NAV.includes(b.dataset.act) && naSala() && !G.busy && G.mode !== 'battle') await sairSala();
  switch (b.dataset.act) {
    case 'search': return previewSearch($('#q')?.value || '');
    case 'random': return sortearEspecie();
    case 'carreira': if (G.busy || G.mode === 'battle') return; return telaCarreira();
    // navegação (navegacao.js): início e ajustes
    case 'inicio': if (G.busy || G.mode === 'battle') return; G.PV = null; return showCreate();
    case 'ajustes': if (G.busy || G.mode === 'battle') return; return telaAjustes();
    case 'patch': if (G.busy || G.mode === 'battle') return; return telaPatchNotes();
    case 'fonte': aplicarFonte(v); return telaAjustes();
    case 'baixar-gen': return baixarMapaOffline(v);   // guarda um mapa pra jogar sem internet
    case 'baixar-tudo': {                             // o jogo inteiro: pode passar de 100 MB
      const ok = await ask('Baixar <b>todos os mapas</b> (Pokémon, golpes e sprites das 9 Gens)? Pode passar de 100 MB e levar alguns minutos. Deixe esta tela aberta.',
        [{ label: 'Baixar tudo', value: true }, { label: 'Agora não', value: false, ghost: true }]);
      return ok ? baixarMapaOffline(null) : undefined;
    }
    case 'baixar-imagens': return baixarImagensOffline(genDe(G.S));   // só as figuras; os dados ficam como estão
    // painel de testes (só conta admin; dev.js barra de novo do lado de lá)
    case 'fixar': return fixarConquista(v);   // 📌 acompanhar uma conquista da conta nesta jornada
    case 'dev-megas': return acaoDev('megas');
    case 'dev-especies': return acaoDev('especies');
    case 'dev-gimmicks': return acaoDev('gimmicks');
    case 'dev-limpar': return acaoDev('limpar');
    case 'limpar-baixar': {   // apaga o que está guardado da PokéAPI e baixa o mapa atual do zero
      const ok = await ask('Apagar tudo o que está guardado da PokéAPI neste aparelho e baixar este mapa <b>do zero</b>?<br><br>Serve pra quando algo ficou pela metade e baixar por cima não resolve. <b>Seus saves, a carreira e as conquistas não são tocados.</b>',
        [{ label: 'Limpar e baixar', value: true }, { label: 'Agora não', value: false, ghost: true }]);
      return ok ? baixarMapaOffline(genDe(G.S), true) : undefined;
    }
    case 'voltar': if (naSala()) await sairSala(); return voltar();
    // multiplayer (co-op)
    // da run, da tela inicial ou de qualquer outra tela (sem run: entra com um Pokémon convidado)
    case 'mp': if (G.busy || G.mode === 'battle') return; return telaMultiplayer();
    case 'mp-entrada': return escolherEntrada(v);
    case 'mp-convidado': return escolherConvidado(v);
    case 'mp-criar': return criarSala();
    case 'mp-entrar': return entrarSala($('#mp-codigo')?.value);
    case 'mp-sair': await sairSala(); return voltar();
    case 'mp-explorar': return iniciarBatalhaMP('selvagem');
    case 'mp-alfa': return iniciarBatalhaMP('alfa');
    case 'mp-evento': return iniciarBatalhaMP('evento');
    case 'mp-revive': return reviverMP();
    case 'mp-raide': return usarRaideMP(v);
    case 'mp-pvp': return iniciarBatalhaMP('pvp');
    case 'mp-time': return escolherTime(v);
    case 'mp-desistir': {
      const ok = await ask('Desistir da luta? Seu time inteiro sai e o outro vence.', [{ label: 'Desistir', value: true }, { label: 'Continuar lutando', value: false, ghost: true }]);
      return ok ? desistirMP() : undefined;
    }
    case 'mp-golpe': return escolherGolpeMP(+v);
    case 'mp-gimmick': return alternarGimmickMP(v);   // liga/desliga Mega, Tera, Gigantamax ou Z pro golpe deste turno (co-op)
    case 'mp-fugir': return fugirMP();
    case 'mp-mirar': return mirarMP(v);
    case 'mp-sync': return sincronizarSala();   // pedir o estado da sala de novo (rede engoliu alguma mensagem)
    case 'mp-centro': return centroMP();        // curar a equipe sem sair da sala
    case 'conquistas': if (G.busy || G.mode === 'battle') return; return telaConquistas();
    // 🏟 Arena do Chefe (arena.js): o chefe da semana com os Pokémon do Hall da Fama, sem mexer em nenhuma jornada
    case 'arena': if (G.busy || G.mode === 'battle') return; return telaArena();
    case 'amigo-perfil': if (G.busy || G.mode === 'battle') return; return telaPerfil(v);   // 👤 Ver perfil (perfil-amigo.js)
    case 'arena-sel': return arenaSelecionar(v);
    case 'arena-iniciar': return arenaIniciar();
    case 'arena-golpe': return arenaGolpe(v);
    case 'arena-raide': return arenaRaide(v);
    case 'arena-desistir': return arenaDesistir();
    case 'arena-fim': return arenaFim();
    case 'pokedex': if (G.busy || G.mode === 'battle') return; return telaPokedex();
    case 'esconderijo-guardar': return mexerEsconderijo('guardar', +v);
    case 'esconderijo-trazer': return mexerEsconderijo('trazer', +v);
    case 'dex-rota': if (G.busy || G.mode === 'battle') return; return abrirNaPokedex(v);   // da Pokedex da rota pra ficha
    case 'dex-ver': return verNaPokedex(v);
    case 'ranking': if (G.busy || G.mode === 'battle') return; return telaRanking();
    // bugs e sugestões
    case 'relatos': if (G.busy || G.mode === 'battle') return; return telaRelatos();
    case 'rel-tipo': return escolherTipoRelato(v);
    case 'rel-enviar': return enviarRelatoTela();
    case 'rel-img-del': return removerImagemRelato(v);   // tira uma imagem do relato antes de enviar
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
    case 'sem-vantagens': G.semVantagens = !G.semVantagens; return renderDificuldade();   // jogar sem os itens das badges
    case 'randomizer': return fullRandomizer(b);
    case 'recomecar': G.S = null; G.B = null; G.PV = null; return showCreate();
    case 'start': return startGame(b);
    case 'explore': return explore();
    case 'zone': {
      const z = rotasAtuais().find(x => x.id === v); // só rotas do mapa atual
      if (!z || !zonaLiberada(z, G.S.player.level, G.S)) return; // chip trancado já vem desativado; isto é a garantia
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
    case 'evento': return desafiarEvento();
    case 'badge-exibir': await salvarBadgeExibida(v || null); return telaConta();   // v vazio = ocultar
    // 🎯 Caça Shiny: escolher (ou parar de caçar) a espécie que aparece nesta rota
    case 'caca': {
      if (G.busy || G.mode !== 'explore' || !G.S.cacaShiny) return;
      const z = zone(); (G.S.caca ||= {});
      if (v) G.S.caca[z.id] = v; else delete G.S.caca[z.id];
      log(v ? `🎯 Caçando <b>${esc(fmt(v))}</b> em ${esc(z.name)}: só ele vai aparecer por aqui.` : `🎯 Caça encerrada em ${esc(z.name)}.`, 'muted');
      save(); return render();
    }
    // Roguelike: venceu a Gen e escolheu seguir no Santuário — este botão fecha a run em vitória quando quiser
    case 'encerrar-vitoria': {
      if (G.busy || G.mode === 'battle' || !G.S?.aposVitoria) return;
      const ok = await ask('Encerrar a jornada agora, <b>em vitória</b>? O que você conquistou no Santuário fica guardado na carreira.',
        [{ label: 'Encerrar em vitória', value: true }, { label: 'Continuar explorando', value: false, ghost: true }]);
      return ok ? encerrarJornada('venceu', { genVencida: G.S.genVencida }) : undefined;
    }
    case 'panel': G.panel = v; return render();
    case 'heal': {
      // o botão já vem desativado nesses casos; a checagem aqui é a garantia (clique duplo, estado mudou entre renders)
      const { precisa, custo } = centroPokemon();
      if (G.busy || !precisa || G.S.money < custo) return;
      G.S.money -= custo; G.S.gasto = (G.S.gasto || 0) + custo; G.S.usouCentro = true; healFull(); zerarDescontoCentro();
      log(`${custo ? `Você pagou ₽${custo} e descansou` : 'Você descansou'} no Centro Pokémon. HP, PP e status ${G.S.aliados?.length ? 'da equipe ' : ''}restaurados.`, 'good');
      await verificarMissoes(); save(); return render();
    }
    case 'oferecer': return turn({ type: 'oferecer', id: v });
    case 'despedir': if (G.busy) return; G.busy = true; render(); try { await despedir(+v); } finally { G.busy = false; render(); save(); } return;
    case 'buy': {
      const it = ITEMS[v], preco = precoItem(v, G.S); if (G.busy || !it || !preco || G.S.money < preco) return;
      // HUD de quantidade: até onde o dinheiro alcança (teto 99, como na mochila dos jogos)
      const max = Math.min(99, Math.floor(G.S.money / preco));
      const qtd = await pedirQuantidade({ nome: esc(it.name), figuraHtml: `<img src="${ITEM_SPR(v)}" alt="" onerror="${ITEM_ERRO}">`, preco, max, dinheiro: G.S.money });
      // o modal é assíncrono: reconfere (o dinheiro pode ter mudado enquanto ele estava aberto)
      if (!qtd || G.busy || G.S.money < qtd * preco) return;
      const total = qtd * preco;
      G.S.money -= total; G.S.gasto = (G.S.gasto || 0) + total; addItem(v, qtd);
      log(`Você comprou ${qtd > 1 ? `${qtd}× ` : ''}${it.name} por ₽${total.toLocaleString('pt-BR')}.`, 'good');
      toast(`🛒 Comprou <b>${qtd > 1 ? `${qtd}× ` : ''}${esc(it.name)}</b> por ₽${total.toLocaleString('pt-BR')}<br><small class="muted">Na mochila: ${G.S.bag[v]}</small>`, 3500);
      await verificarMissoes(); save(); return render(); // missões de gastar dinheiro
    }
    // equipar um item da mochila direto pela ficha (data-quem: 'p' = você, número = aliado)
    case 'segurar': {
      if (G.busy || G.mode !== 'explore') return;
      G.busy = true; render();
      try { await equiparItem(v, false, b.dataset.quem); } finally { G.busy = false; save(); render(); }
      return;
    }
    // tirar o item segurado (ficha): 'p' = você, número = aliado
    case 'tirar-item': {
      if (G.busy || G.mode !== 'explore') return;
      const M = v === 'p' ? G.S.player : G.S.aliados?.[+v];
      await tirarItem(M); save(); return render();
    }
    case 'item': if (G.busy) return; G.busy = true; render(); try { await useItem(v, false); await verificarMissoes(); } finally { G.busy = false; render(); save(); } return;
    case 'item-b': return turn({ type: 'item', id: v });
    case 'move': return turn({ type: 'move', idx: +v });
    // nenhum dos dois passa por `turn`: megaevoluir e terastalizar não gastam o turno
    case 'mega': return usarMega();
    case 'tera': return usarTera();
    case 'zmove': return usarZ();
    case 'gmax': return usarGigantamax();   // nao gasta o turno; dura 3 turnos e encolhe sozinho   // este SIM gasta o turno: o Z-Move e o ataque da rodada
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
  if (e.target.id === 'pv-clima') { G.climaRotas = e.target.checked; return; } // 🌦 clima/terreno das rotas (só opcional fora do Roguelike/Hardcore)
  if (e.target.id === 'pv-caca') { G.cacaShiny = e.target.checked; return; } // vale mesmo sem prévia de Pokémon
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
  // Esc volta da tela em que você está (o mesmo botão de voltar da barra de navegação), menos no meio do jogo
  if (e.key === 'Escape' && !['explore', 'battle', 'create'].includes(G.mode) && !document.querySelector('.modal')) {
    $('.nav-voltar, [data-act="voltar"]')?.click();
    return;
  }
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
  G.mode = 'explore'; G.panel = 'main';
  // batalha em andamento volta do jeito que estava (fechar/recarregar não é fuga): os `vol` vêm salvos junto
  G.B = restaurarBatalha(s.batalha);
  if (G.B) { G.mode = 'battle'; G.panel = 'moves'; }
  else for (const m of ladoJogador()) m.vol = freshVol();
  G.S.ultimoTick = Date.now(); // tempo de jogo recomeça a contar agora (não conta o tempo com o jogo fechado)
  if (G.S.escolhendoGen) return telaEscolherGen(); // fechou uma Gen e ainda não escolheu o próximo mapa
  buildGame();
  (G.S.log || []).slice(-20).forEach(logRaw);
  if (aviso) log(aviso, 'muted');
  if (G.B) log(`⚔ Você voltou pra batalha contra ${esc(fmt(G.B.enemy.name))} (turno ${G.B.turn}). Não dá pra escapar fechando o jogo.`, 'enc');
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
ganchosSave.serializarBatalha = serializarBatalha; // batalha em andamento entra no save (sem fuga por F5)
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
aplicarFonte();   // fonte escolhida neste navegador (ajustes.js), antes de desenhar qualquer tela
iniciarPaineis(); // listeners de arrastar/▲▼/divisória, uma vez só
iniciarMenu();    // ☰ do topo no celular
// O índice do cache (api.iniciarCache) precisa estar lido ANTES de abrir a jornada: é ele que diz o que dá pra
// jogar offline. Se falhar, abre do mesmo jeito — só sem saber o que está guardado.
iniciarCache().catch(e => console.warn('cache', e)).then(function boot() {
  const s = store.get(SAVE_KEY);
  if (saveValido(s)) abrirJornada(s, 'Jogo carregado deste navegador.');
  else showCreate();
});
aoMudarNuvem(renderChipConta);
iniciarNuvem().catch(e => console.error(e)); // sem config: não faz nada
