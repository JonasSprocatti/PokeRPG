/* ============ ponto de entrada ============ */
// Um único listener delegado por tipo de evento (click/change/keydown) no document: todo botão só
// declara `data-act` (+ `data-v`), então re-render total não precisa religar handler nenhum.
import { G, SAVE_KEY, save, nm, zone, ladoJogador, ganchosSave, rotasAtuais, migrarShiniesAmigos } from './estado.js';
import { $, log, logRaw, ask, iniciarMenu, toast, pedirQuantidade } from './ui.js';
import { render, buildGame, spriteItem, precisaEscolherAlvo, modoJRPG } from './render.js';
import { showCreate, previewSearch, renderPreview, renderDificuldade, sortearEspecie, startGame, fullRandomizer, porNaComitiva, tirarDaComitiva } from './criacao.js';
import { encerrarJornada, telaCarreira, telaEscolherGen } from './fim.js';
import { guardadas, guardar, retirar, excluir, MAX_GUARDADAS } from './saves.js';
import { telaSaves } from './tela-saves.js';
import { telaAjustes, baixarMapaOffline, baixarImagensOffline, baixarImagens3DOffline, baixarImagensAnimadasOffline, acaoDev } from './tela-ajustes.js';
import { telaTutorial, tutAvancar, tutVoltar, tutExplorar, tutGolpe, tutComprar, tutRevelarCaptura, tutSair } from './tela-tutorial.js';
import { telaPatchNotes } from './tela-patchnotes.js';
import { telaPrivacidade } from './tela-privacidade.js';
import { aplicarFonte, definirEstiloSprite, alternarAnimacoes } from './ajustes.js';
import { GENS, dadosDaGen, entrarNaGen, genDe } from './mapas.js';
import { iniciarNuvem, aoMudarNuvem, ganchos, agendarEnvioSave, apagarSaveNuvem, entrarGoogle, entrarEmail, sair, salvarApelido, sincronizar,
  nuvem, salvarIcone, salvarBadgeExibida, pedirAmizade, aceitarAmizade, removerAmizade, tutorialVistoLocal } from './nuvem.js';
import { renderChipConta, telaConta, htmlIcone, mudarIconeEdit, sortearIcone, alternarShinyIcone, iconeEscolhido, limparIconeEdit } from './conta.js';
import { telaRanking } from './ranking.js';
import { telaConquistas, fixarConquista } from './tela-conquistas.js';
import { telaEditorRotas, acaoEditor } from './tela-editor-rotas.js';
import { telaPokedex, verNaPokedex, abrirNaPokedex } from './tela-pokedex.js';
import { telaRelatos, escolherTipoRelato, enviarRelatoTela, removerImagemRelato } from './relatos.js';
import { telaMultiplayer, criarSala, entrarSala, sairSala, naSala, iniciarBatalhaMP, escolherGolpeMP, moverGolpeMP, alternarGimmickMP, fugirMP, desistirMP, mirarMP, configurarSala, escolherTime, convidarAmigoMP, copiarConviteMP, sincronizarSala, centroMP, reviverMP, usarRaideMP, usarItemComumMP,
  raideSelecionarHall, raideEquiparHall, raideComprarComum, raideComprarSegurado, alternarProntoMP, enviarChatMP,
  escolherEntradaNaSala, escolherConvidadoNaSala } from './multiplayer.js';
import { iniciarPaineis } from './paineis.js';
import { explore, desafiarChefe, desafiarEvento, curarNoCentro } from './mundo.js';
import { escolherAlvoAuto, pararAuto, limparAuto } from './auto.js';
import { pedirPermissao, desligarNotificacoes } from './notificacoes.js';
import { telaPerfil } from './perfil-amigo.js';
import { telaArena, arenaSelecionar, arenaIniciar, arenaGolpe, arenaGolpeMover, arenaRaide, arenaDesistir, arenaFim,
  arenaComprarComum, arenaComprarSegurado, arenaEquipar, arenaUsarItem, arenaReviver } from './arena.js';
import { turn, usarMega, usarTera, usarZ, usarGigantamax, serializarBatalha, restaurarBatalha } from './batalha.js';
import { addItem, useItem, tirarItem, equiparItem, mexerEsconderijo, venderItem, marcarRapido, cancelarRepelente } from './itens.js';
import { verificarMissoes } from './missoes.js';
import { ITEMS, ORDENS, ITEM_ERRO } from './dados.js';
import { freshVol, zonaLiberada, precoItem, precoVenda, moverGolpe } from './regras.js';
import { despedir } from './amizade.js';
import { iniciarCache } from './api.js';
import { store, esc, fmt, novoId } from './util.js';
import { iniciarAds, definirConsentimento } from './ads.js';
import { rodapeHTML } from './site.js';
import { iniciarPresencaGlobal, registrarVisitanteAnonimo, definirPresenca } from './presenca.js';
import { alternarSom, tocarMusica, tocarSfx } from './som.js';

/* ============ eventos ============ */
/* Toda ação da UI passa por este handler, e ele é `async` — ou seja, um erro lá dentro vira uma promise
   rejeitada que NINGUÉM pega: o botão simplesmente não faz nada, sem erro na tela e sem nada no console.
   Foi assim que o botão da Caça Shiny ficou quebrado por dias (chamava `zone()` sem ter importado): o jogador
   relatou duas vezes "clico e não acontece nada" e não havia uma pista sequer pra seguir. `avisarErro`
   transforma toda falha dessas em erro VISÍVEL — a mesma regra que já vale pro render (CLAUDE.md). */
function avisarErro(erro) {
  console.error(erro);
  toast(`⚠ Esta ação falhou: <b>${esc(erro?.message || String(erro))}</b>. Se continuar, mande pelo 🐞 Relatar.`, 8000);
}
/* Durante a batalha o menu tranca quase tudo: sair pra outra tela no meio da luta seria fuga, e o jogo já avisa
   que "não dá pra escapar fechando o jogo". A trava é de propósito — o que faltava era DIZER isso. O botão
   "Novo jogo" continua desenhado na batalha (render.js), ficava habilitado e o clique não fazia absolutamente
   nada: relato #66, "enquanto você está em uma batalha você não consegue acessar o perfil, criar uma nova run".
   `G.busy` trava calado de propósito: dura o tempo de uma ação e avisar a cada clique viraria ruído. */
function travadoPelaBatalha(msg = 'Termine a batalha primeiro — no meio da luta não dá pra sair daqui.') {
  if (G.busy) return true;
  if (G.mode !== 'battle') return false;
  toast(msg, 5000);
  return true;
}
document.addEventListener('click', e => { aoClicar(e).catch(avisarErro); });
/* ⚔ Saga: um comando escolhido é PLANO (de um companheiro, guardado pro turno) ou AÇÃO (a sua, que resolve o
   turno). Um ponto só pra golpe e um pra perícia, porque os dois caminhos entram pelo mesmo botão — e porque a
   ordem importa: o plano tem de estar guardado ANTES de `turn()` rodar. */
const voltarAosComandos = () => { G.comandando = 'p'; if (modoJRPG(G.S)) G.panel = 'comandos'; };
function escolherGolpe(idx, alvo) {
  const quem = G.comandando || 'p';
  if (quem !== 'p' && G.B) {
    (G.B.planos ||= {})[quem] = { idx, alvo };
    voltarAosComandos();         // comandou um: volta pros SEUS comandos, que são o que fecha o turno
    return render();
  }
  return turn({ type: 'move', idx, alvo });
}
// ⚔ Saga: a perícia do ofício (pericias.js). Mesma economia do golpe — do companheiro é plano, sua é a ação.
function escolherPericia(id) {
  const quem = G.comandando || 'p';
  if (quem !== 'p' && G.B) {
    (G.B.planos ||= {})[quem] = { pericia: id };
    voltarAosComandos();
    return render();
  }
  return turn({ type: 'pericia', id });
}
async function aoClicar(e) {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const v = b.dataset.v;
  // sair pra outra tela pela barra de navegação (navegacao.js) larga a sala multiplayer antes (menos ir PRA sala)
  const TELAS_NAV = ['inicio', 'saves', 'carreira', 'pokedex', 'conquistas', 'ranking', 'conta', 'ajustes', 'relatos', 'patch', 'arena', 'tutorial', 'editor'];
  if (TELAS_NAV.includes(b.dataset.act) && naSala() && !G.busy && G.mode !== 'battle') await sairSala();
  /* Trilha das telas fora do jogo (som.js), num lugar só: toda tela de menu é alcançada por um destes `data-act`,
     então nenhuma delas precisa saber de música por conta própria. `inicio` tem a própria faixa (showCreate pede
     'menu'); as telas de jogo em si (explorar/batalha) são pedidas por quem monta a cena, não aqui.
     A condição é lida À MÃO em vez de chamar `travadoPelaBatalha()`: aquela função TOASTA quando barra, e o
     `case` do switch a chama de novo — o jogador veria o mesmo aviso duas vezes. */
  if (TELAS_NAV.includes(b.dataset.act) && b.dataset.act !== 'inicio' && G.mode !== 'battle' && !G.busy) tocarMusica('telas');
  switch (b.dataset.act) {
    case 'search': return previewSearch($('#q')?.value || '');
    case 'random': return sortearEspecie();
    case 'carreira': if (travadoPelaBatalha()) return; return telaCarreira();
    // navegação (navegacao.js): início e ajustes
    case 'inicio': if (travadoPelaBatalha()) return; G.PV = null; return showCreate();
    case 'ajustes': if (travadoPelaBatalha()) return; return telaAjustes();
    // ❓ Tutorial: tour guiado + demonstração (tela-tutorial.js). Sempre pode abrir de novo pra rever.
    case 'tutorial': if (travadoPelaBatalha()) return; return telaTutorial();
    case 'tut-avancar': return tutAvancar();
    case 'tut-voltar': return tutVoltar();
    case 'tut-explorar': return tutExplorar();
    case 'tut-golpe': return tutGolpe();
    case 'tut-comprar': return tutComprar(v);
    case 'tut-revelar-captura': return tutRevelarCaptura();
    case 'tut-pular': case 'tut-fim': return tutSair();
    case 'patch': if (travadoPelaBatalha()) return; return telaPatchNotes();
    case 'fonte': aplicarFonte(v); return telaAjustes();
    case 'ads-consentimento': definirConsentimento(v); return telaAjustes();
    case 'baixar-gen': return baixarMapaOffline(v);   // guarda um mapa pra jogar sem internet
    case 'baixar-tudo': {                             // o jogo inteiro: pode passar de 100 MB
      const ok = await ask('Baixar <b>todos os mapas</b> (Pokémon, golpes e sprites das 9 Gens)? Pode passar de 100 MB e levar alguns minutos. Deixe esta tela aberta.',
        [{ label: 'Baixar tudo', value: true }, { label: 'Agora não', value: false, ghost: true }]);
      return ok ? baixarMapaOffline(null) : undefined;
    }
    case 'baixar-imagens': return baixarImagensOffline(genDe(G.S));   // só as figuras; os dados ficam como estão
    case 'baixar-imagens-3d': return baixarImagens3DOffline(genDe(G.S));   // idem, pros sprites 3D (opcional)
    case 'baixar-imagens-animadas': return baixarImagensAnimadasOffline(genDe(G.S));   // idem, pros sprites animados (opcional)
    case 'estilo-sprite': definirEstiloSprite(v); return telaAjustes();
    // painel de testes (só conta admin; dev.js barra de novo do lado de lá)
    case 'fixar': return fixarConquista(v);   // 📌 acompanhar uma conquista da conta nesta jornada
    case 'dev-megas': return acaoDev('megas');
    case 'dev-especies': return acaoDev('especies');
    case 'dev-gimmicks': return acaoDev('gimmicks');
    case 'dev-ivs': return acaoDev('ivs');
    case 'dev-forjar': return acaoDev('forjar');   // ⏩ nível/₽/mochila na jornada em andamento (dev.js forjarJornada)
    // 🗺 editor de rotas (só admin; a tela confere de novo)
    case 'editor': if (travadoPelaBatalha()) return; return telaEditorRotas();
    case 'ed-gen': case 'ed-rota': case 'ed-recarregar': case 'ed-salvar-missao': case 'ed-salvar-alfa':
    case 'ed-usar-alfa': case 'ed-sugerir': case 'ed-desfazer': case 'ed-copiar': case 'ed-limpar-tudo':
      return acaoEditor(b.dataset.act.slice(3), v);
    case 'dev-limpar': return acaoDev('limpar');
    case 'limpar-baixar': {   // apaga o que está guardado da PokéAPI e baixa o mapa atual do zero
      const ok = await ask('Apagar tudo o que está guardado da PokéAPI neste aparelho e baixar este mapa <b>do zero</b>?<br><br>Serve pra quando algo ficou pela metade e baixar por cima não resolve. <b>Seus saves, a carreira e as conquistas não são tocados.</b>',
        [{ label: 'Limpar e baixar', value: true }, { label: 'Agora não', value: false, ghost: true }]);
      return ok ? baixarMapaOffline(genDe(G.S), true) : undefined;
    }
    case 'voltar': if (naSala()) await sairSala(); return voltar();
    // multiplayer (co-op)
    // da run, da tela inicial ou de qualquer outra tela (sem run: entra com um Pokémon convidado)
    case 'mp': if (travadoPelaBatalha()) return; return telaMultiplayer();
    case 'mp-entrada-sala': return escolherEntradaNaSala(v);       // com o que eu entro (só existe dentro da sala)
    case 'mp-convidado-sala': return escolherConvidadoNaSala(v);
    case 'mp-criar': return criarSala();
    case 'mp-entrar': return entrarSala($('#mp-codigo')?.value);
    case 'mp-copiar': return copiarConviteMP(v);                   // 📋 código ou 🔗 link que já entra na sala
    case 'mp-cfg': { const [campo, valor] = String(v).split(':'); return configurarSala(campo, campo === 'balancear' ? valor === 'true' : valor); }
    case 'mp-sair': await sairSala(); return voltar();
    case 'mp-explorar': return iniciarBatalhaMP('selvagem');
    case 'mp-alfa': return iniciarBatalhaMP('alfa');
    case 'mp-evento': return iniciarBatalhaMP('evento');
    case 'mp-revive': return reviverMP();
    case 'mp-raide': return usarRaideMP(v);
    case 'mp-item': return usarItemComumMP(v);
    case 'mp-pvp': return iniciarBatalhaMP('pvp');
    case 'mp-time': return escolherTime(v);
    case 'mp-desistir': {
      const ok = await ask('Desistir da luta? Seu time inteiro sai e o outro vence.', [{ label: 'Desistir', value: true }, { label: 'Continuar lutando', value: false, ghost: true }]);
      return ok ? desistirMP() : undefined;
    }
    case 'mp-golpe': return escolherGolpeMP(+v);
    case 'mp-golpe-mover': return moverGolpeMP(+v, +b.dataset.dir);
    case 'mp-gimmick': return alternarGimmickMP(v);   // liga/desliga Mega, Tera, Gigantamax ou Z pro golpe deste turno (co-op)
    case 'mp-fugir': return fugirMP();
    case 'mp-mirar': return mirarMP(v);
    case 'mp-sync': return sincronizarSala();   // pedir o estado da sala de novo (rede engoliu alguma mensagem)
    // ☄ Sala de Raide (Hall da Fama, sem run — multiplayer.js)
    case 'mp-raide-sel': return raideSelecionarHall(v);
    case 'mp-raide-comprar-comum': return raideComprarComum(v);
    case 'mp-raide-comprar-segurado': return raideComprarSegurado(v);
    case 'mp-pronto': return alternarProntoMP();
    case 'mp-chat-enviar': return enviarChatMP();
    case 'mp-centro': return centroMP();        // curar a equipe sem sair da sala
    case 'conquistas': if (travadoPelaBatalha()) return; return telaConquistas();
    // 🏟 Arena do Chefe (arena.js): o chefe da semana com os Pokémon do Hall da Fama, sem mexer em nenhuma jornada
    case 'arena': if (travadoPelaBatalha()) return; return telaArena();
    case 'amigo-perfil': if (travadoPelaBatalha()) return; return telaPerfil(v);   // 👤 Ver perfil (perfil-amigo.js)
    case 'arena-sel': return arenaSelecionar(v);
    case 'arena-comprar-comum': return arenaComprarComum(v);
    case 'arena-comprar-segurado': return arenaComprarSegurado(v);
    case 'arena-iniciar': return arenaIniciar();
    case 'arena-golpe': return arenaGolpe(v);
    case 'arena-golpe-mover': return arenaGolpeMover(+v, +b.dataset.dir);
    case 'arena-usar-item': return arenaUsarItem(v);
    case 'arena-raide': return arenaRaide(v);
    case 'arena-reviver': return arenaReviver(v);
    case 'arena-desistir': return arenaDesistir();
    case 'arena-fim': return arenaFim();
    case 'pokedex': if (travadoPelaBatalha()) return; return telaPokedex();
    case 'esconderijo-guardar': return mexerEsconderijo('guardar', +v);
    case 'esconderijo-trazer': return mexerEsconderijo('trazer', +v);
    case 'dex-rota': if (travadoPelaBatalha()) return; return abrirNaPokedex(v);   // da Pokedex da rota pra ficha
    case 'dex-ver': return verNaPokedex(v);
    case 'ranking': if (travadoPelaBatalha()) return; return telaRanking();
    // bugs e sugestões
    case 'relatos': if (travadoPelaBatalha()) return; return telaRelatos();
    case 'privacidade': if (travadoPelaBatalha()) return; return telaPrivacidade();
    case 'rel-tipo': return escolherTipoRelato(v);
    case 'rel-enviar': return enviarRelatoTela();
    case 'rel-img-del': return removerImagemRelato(v);   // tira uma imagem do relato antes de enviar
    // conta / nuvem
    case 'conta': if (travadoPelaBatalha()) return; return telaConta();
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
      if (travadoPelaBatalha('Termine a batalha antes de entrar na sala.')) return;
      if (naSala()) await sairSala();
      return entrarSala(v);
    }
    case 'sair': await sair(); return telaConta('Você saiu da conta. O que já foi salvo continua na nuvem e neste navegador.');
    case 'pick': return previewSearch(v);
    case 'ability': G.PV.ability = v; return renderPreview();
    case 'dificuldade': G.dif = v; return renderDificuldade();
    // ⚔ Saga: montar a comitiva no passo 4 da criação (criacao.js)
    case 'comitiva-por': return porNaComitiva(v);
    case 'comitiva-tirar': return tirarDaComitiva(v);
    case 'sem-vantagens': G.semVantagens = !G.semVantagens; return renderDificuldade();   // jogar sem os itens das badges
    case 'randomizer': return fullRandomizer(b);
    case 'recomecar': G.S = null; G.B = null; G.PV = null; return showCreate();
    case 'start': return startGame(b);
    case 'explore': return explore();
    case 'zone': {
      const z = rotasAtuais().find(x => x.id === v); // só rotas do mapa atual
      if (!z || !zonaLiberada(z, G.S.player.level, G.S)) return; // chip trancado já vem desativado; isto é a garantia
      G.S.zone = v; save(); tocarMusica('explorar', z); return render();   // rota nova, tema novo (som.js)
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
      // O clique só mudava a borda da caixa (tracejada → sólida) e uma linha no painel de log — fácil de não
      // notar (painel de log fora da vista, sobretudo no celular) e parecer "não fez nada". Relatado em jogo.
      const msg = v ? `🎯 Caçando <b>${esc(fmt(v))}</b> em ${esc(z.name)}: só ele vai aparecer por aqui.` : `🎯 Caça encerrada em ${esc(z.name)}.`;
      log(msg, 'muted'); toast(msg, 4000);
      save(); return render();
    }
    // Roguelike: venceu a Gen e escolheu seguir no Santuário — este botão fecha a run em vitória quando quiser
    case 'encerrar-vitoria': {
      if (!G.S?.aposVitoria || travadoPelaBatalha()) return;
      const ok = await ask('Encerrar a jornada agora, <b>em vitória</b>? O que você conquistou no Santuário fica guardado na carreira.',
        [{ label: 'Encerrar em vitória', value: true }, { label: 'Continuar explorando', value: false, ghost: true }]);
      return ok ? encerrarJornada('venceu', { genVencida: G.S.genVencida }) : undefined;
    }
    case 'panel': G.panel = v; return render();
    /* Divisão da mochila abrindo/fechando (`<details>` nativo). O navegador já virou o `open` no clique; aqui só
       se GRAVA isso em `G.bagAbertas`, senão o próximo `render()` (que refaz o DOM inteiro) fechava de novo. */
    case 'bag-cat': {
      const abertas = (G.bagAbertas ||= new Set());
      abertas.has(v) ? abertas.delete(v) : abertas.add(v);
      return render();
    }
    // o botão já vem desativado quando não há o que curar; `curarNoCentro` (mundo.js) confere de novo e é o
    // MESMO Centro que o 🤖 auto-explorar usa entre uma batalha e outra
    case 'heal': await curarNoCentro(); return render();
    // 🤖 auto-explorar (auto.js): ferramenta de manutenção, barrada de novo do lado de lá por `ehAdmin()`
    case 'notif-ligar': {   // a permissão só pode ser pedida dentro de um clique — é aqui ou nunca
      const r = await pedirPermissao();
      if (r === 'denied') toast('🔕 As notificações ficaram bloqueadas. Dá pra liberar no cadeado ao lado do endereço.', 8000);
      return telaAjustes();
    }
    case 'auto': return escolherAlvoAuto();
    case 'auto-parar': pararAuto('parado'); return render();
    case 'auto-fechar': limparAuto(); return render();
    case 'oferecer': return turn({ type: 'oferecer', id: v });
    case 'despedir': if (G.busy) return; G.busy = true; render(); try { await despedir(+v); } finally { G.busy = false; render(); save(); } return;
    case 'buy': {
      const it = ITEMS[v], preco = precoItem(v, G.S); if (G.busy || !it || !preco || G.S.money < preco) return;
      // HUD de quantidade: até onde o dinheiro alcança (teto 99, como na mochila dos jogos)
      const max = Math.min(99, Math.floor(G.S.money / preco));
      const qtd = await pedirQuantidade({ nome: esc(it.name), figuraHtml: `<img src="${spriteItem(v, G.S.player)}" alt="" onerror="${ITEM_ERRO}">`, preco, max, dinheiro: G.S.money });
      // o modal é assíncrono: reconfere (o dinheiro pode ter mudado enquanto ele estava aberto)
      if (!qtd || G.busy || G.S.money < qtd * preco) return;
      const total = qtd * preco;
      G.S.money -= total; G.S.gasto = (G.S.gasto || 0) + total; addItem(v, qtd); tocarSfx('compra');
      log(`Você comprou ${qtd > 1 ? `${qtd}× ` : ''}${it.name} por ₽${total.toLocaleString('pt-BR')}.`, 'good');
      toast(`🛒 Comprou <b>${qtd > 1 ? `${qtd}× ` : ''}${esc(it.name)}</b> por ₽${total.toLocaleString('pt-BR')}<br><small class="muted">Na mochila: ${G.S.bag[v]}</small>`, 3500);
      await verificarMissoes(); save(); return render(); // missões de gastar dinheiro
    }
    // Vender (ou jogar fora, se não tem preço) — pedido do usuário: "ter como jogar os itens fora ou vender eles"
    case 'vender': {
      const it = ITEMS[v], max = G.S.bag?.[v] || 0; if (G.busy || G.mode !== 'explore' || !it || !max) return;
      const preco = precoVenda(v, G.S);
      const qtd = await pedirQuantidade({ nome: esc(it.name), figuraHtml: `<img src="${spriteItem(v, G.S.player)}" alt="" onerror="${ITEM_ERRO}">`, preco, max, acao: 'vender' });
      if (!qtd || G.busy) return;
      const total = venderItem(v, qtd);
      log(preco ? `Você vendeu ${qtd > 1 ? `${qtd}× ` : ''}${it.name} por ₽${total.toLocaleString('pt-BR')}.` : `Você jogou fora ${qtd > 1 ? `${qtd}× ` : ''}${it.name}.`, 'muted');
      toast(preco ? `💰 Vendeu <b>${qtd > 1 ? `${qtd}× ` : ''}${esc(it.name)}</b> por ₽${total.toLocaleString('pt-BR')}` : `🗑 Jogou fora <b>${qtd > 1 ? `${qtd}× ` : ''}${esc(it.name)}</b>`, 3500);
      save(); return render();
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
    // reordenar golpes (ficha): não gasta turno, dá pra usar em qualquer tela, inclusive em batalha
    case 'golpe-mover': {
      if (G.busy) return;
      const M = b.dataset.quem === 'p' ? G.S.player : G.S.aliados?.[+b.dataset.quem]; if (!M) return;
      M.moves = moverGolpe(M.moves, +v, +b.dataset.dir);
      save(); return render();
    }
    case 'item': if (G.busy) return; G.busy = true; render(); try { await useItem(v, false); await verificarMissoes(); } finally { G.busy = false; render(); save(); } return;
    case 'item-b': return turn({ type: 'item', id: v });
    case 'recuar': return turn({ type: 'recuar' });   // 🔄 sai de campo por uma rodada, com um aliado cobrindo
    case 'rapido': return marcarRapido(v);   // ⚡ na mochila: liga/desliga o atalho (regras.alternarRapido)
    case 'repel-cancelar': return cancelarRepelente();   // ✕ no aviso de repelente ativo (relato #69)
    /* ⚔ Saga: com mais de um inimigo de pé, tocar no golpe PEDE o alvo (a cena vira botões) em vez de atacar —
       escolher em quem bater é a decisão tática do modo. Com um inimigo só, ataca direto: um segundo toque pra
       confirmar o óbvio seria atrito puro. */
    case 'move': {
      if (precisaEscolherAlvo()) { G.alvoDe = +v; return render(); }
      return escolherGolpe(+v);
    }
    case 'alvo': {
      const idx = G.alvoDe; G.alvoDe = null;
      if (idx == null) return render();
      return escolherGolpe(idx, +v);
    }
    case 'alvo-cancelar': G.alvoDe = null; return render();
    /* ⚔ Saga — comandar a comitiva. `comandar` troca de quem é o painel ('p' = você, 'a<i>' = o companheiro) e
       abre a janela de comandos DELE; `comandar-auto` apaga o plano e devolve o turno pra Ordem do companheiro.
       Sem estes dois casos a fileira de comandar desenhava e o clique não fazia nada. */
    case 'comandar': {
      if (G.busy || !G.B) return;
      G.comandando = v; G.alvoDe = null;
      if (modoJRPG(G.S)) G.panel = 'comandos';
      return render();
    }
    case 'comandar-auto': {
      if (G.busy || !G.B) return;
      if (G.B.planos) delete G.B.planos[v];
      voltarAosComandos();
      return render();
    }
    // ✨ perícia do ofício: a sua resolve o turno; a de um companheiro comandado fica guardada como plano
    case 'pericia': return escolherPericia(v);
    // nenhum dos dois passa por `turn`: megaevoluir e terastalizar não gastam o turno
    case 'mega': return usarMega();
    case 'tera': return usarTera();
    case 'zmove': return usarZ();
    case 'gmax': return usarGigantamax();   // nao gasta o turno; dura 3 turnos e encolhe sozinho   // este SIM gasta o turno: o Z-Move e o ataque da rodada
    case 'run': return turn({ type: 'run' });
    case 'passar': return turn({ type: 'passar' });   // você foi tirado da luta: só deixa o turno correr
    case 'new': {
      if (travadoPelaBatalha()) return;
      // guardar (continua depois, 💾 Jornadas salvas) ou encerrar (resultado vai pra carreira, fim.js)
      const r = await ask('Começar outra jornada? Você pode <b>guardar</b> esta pra continuar depois (💾 Jornadas salvas) ou <b>encerrar</b>: o resultado vai para a sua carreira e o save desta jornada é apagado (aqui e na nuvem).',
        [{ label: '💾 Guardar e começar outra', value: 'guardar' }, { label: 'Encerrar jornada', value: 'encerrar', ghost: true }, { label: 'Continuar jogando', value: null, ghost: true }]);
      if (r === 'guardar') return guardarAtual();
      if (r === 'encerrar') { G.PV = null; encerrarJornada('encerrou'); }
      return;
    }
    // 💾 jornadas salvas (saves.js / tela-saves.js)
    case 'saves': if (travadoPelaBatalha()) return; return telaSaves();
    case 'save-guardar': return guardarAtual();
    case 'save-continuar': return continuarGuardada(v);
    case 'save-excluir': {
      if (!(await ask(`Excluir a jornada de <b>${esc(b.dataset.nome || '')}</b>? Ela some deste aparelho e da nuvem, e <b>não vai pra carreira</b>. Não dá pra desfazer.`,
        [{ label: 'Excluir', value: true }, { label: 'Cancelar', value: false, ghost: true }]))) return;
      excluir(v); await apagarSaveNuvem(v); // offline: a próxima sincronização apaga da nuvem
      return telaSaves('Jornada excluída.');
    }
  }
}
document.addEventListener('change', e => {
  if (e.target.matches?.('[data-ranking-especie]')) return telaRanking(e.target.value || null);
  // 🗺 editor de rotas: marcar/desmarcar espécie liga o campo de quantidade e redivide o total entre as marcadas
  if (e.target.matches?.('.ed-alvo')) return acaoEditor('alvo-toggle');
  if (e.target.id === 'ed-alfa-esp') return acaoEditor('usar-alfa', e.target.value);
  if (e.target.matches?.('[data-arena-equipar]')) return arenaEquipar(e.target.dataset.arenaEquipar, e.target.value);
  if (e.target.matches?.('[data-mp-equipar]')) return raideEquiparHall(e.target.dataset.mpEquipar, e.target.value);
  const cfg = e.target.dataset?.mpCfg; // configuração da sala (anfitrião): modo, porJogador, zona, balancear
  if (cfg) return configurarSala(cfg, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
  // ordem de aliado (vale a partir da próxima escolha de golpe — o turno em andamento já decidiu as ações)
  const io = e.target.dataset?.ordem;
  if (io !== undefined && G.S?.aliados?.[+io] && ORDENS[e.target.value]) {
    const A = G.S.aliados[+io]; A.ordem = e.target.value;
    log(`${nm(A)}: ${ORDENS[A.ordem].nome}.`, 'muted'); save(); return render();
  }
  if (e.target.id === 'pv-notificacoes') { e.target.checked ? pedirPermissao() : desligarNotificacoes(); return; } // ⚙ Ajustes → notificações
  if (e.target.id === 'pv-presenca') { definirPresenca(e.target.checked); return; } // ⚙ Ajustes → presença global
  if (e.target.id === 'pv-som') { alternarSom(e.target.checked); return; } // ⚙ Ajustes → som (som.js)
  if (e.target.id === 'pv-animacoes') { alternarAnimacoes(e.target.checked); return; } // ⚙ Ajustes → animações de combate (ajustes.js)
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
  /* Hotkey dos ⚡ itens rápidos: 1 e 2 clicam no próprio botão da barra de ações (render.barraRapidos), então a
     tecla e o clique passam pelo mesmo caminho — incluindo o `disabled` de quando o jogo está ocupado. Só
     explorando ou em batalha, e nunca enquanto se digita ou com um modal aberto (aí a tecla é do campo/da caixa). */
  if ((e.key === '1' || e.key === '2') && ['explore', 'battle'].includes(G.mode)
      && !e.target.matches?.('input,textarea,select') && !document.querySelector('.modal')) {
    const b = $(`[data-rapido="${e.key}"]`);
    if (b) { e.preventDefault(); b.click(); return; }
  }
  if (e.key !== 'Enter') return;
  if (e.target.id === 'q') previewSearch(e.target.value);
  if (e.target.id === 'mp-codigo') entrarSala(e.target.value);
  if (e.target.id === 'mp-chat-input') enviarChatMP();
  if (e.target.id === 'icone-busca') mudarIconeEdit(e.target.value);
  if (e.target.id === 'amigo-codigo') $('[data-act="amigo-add"]')?.click();
});

/* ============ jornada: abrir / voltar ============ */
const saveValido = s => !!(s?.player?.data && s.meta?.growth);
// abre uma jornada salva (deste navegador ou da nuvem) na tela do jogo
function abrirJornada(s, aviso) {
  G.S = s; G.B = null; G.S.id ||= novoId(); // save de antes do id existir ganha um agora
  migrarShiniesAmigos(G.S); // bug corrigido em 27/09/2026: shiny do jogador/evolução sem o registro que libera o início-shiny
  G.mode = 'explore'; G.panel = 'main';
  // batalha em andamento volta do jeito que estava (fechar/recarregar não é fuga): os `vol` vêm salvos junto
  G.B = restaurarBatalha(s.batalha);
  if (G.B) { G.mode = 'battle'; G.panel = 'moves'; }
  else for (const m of ladoJogador()) m.vol = freshVol();
  tocarMusica(G.B ? (G.B.chefe || G.B.evento || G.B.lendarios ? 'chefe' : 'batalha') : 'explorar', zone());
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
  if (!G.S || travadoPelaBatalha('Termine a batalha antes de guardar a jornada.')) return;
  if (naSala()) return toast('Saia da sala multiplayer antes de guardar a jornada.', 5000);
  save(); // grava o estado mais novo (e sobe pra nuvem) antes de guardar
  if (!guardar(G.S)) return telaSaves(`Você já tem ${MAX_GUARDADAS} jornadas guardadas. Continue ou exclua uma antes de guardar outra.`);
  store.del(SAVE_KEY); G.S = null; G.B = null; G.PV = null;
  showCreate();
  toast('💾 Jornada guardada. Ela está em <b>Jornadas salvas</b>.', 5000);
}
// continua uma guardada; a atual (se houver) vai pras guardadas no lugar dela
function continuarGuardada(id) {
  if (travadoPelaBatalha()) return;
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
/* Link de convite (`?sala=K7Q2`, gerado pelo 🔗 Convite dentro da sala): guarda o código, limpa o endereço na
   barra (senão um F5 mais tarde tentaria entrar de novo numa sala que já acabou) e entra assim que a nuvem estiver
   de pé — lá embaixo, no `iniciarNuvem().then`. Antes disso não há canal pra abrir. */
const salaDoLink = new URLSearchParams(location.search).get('sala');
if (salaDoLink) history.replaceState(null, '', location.pathname);
iniciarCache().catch(e => console.warn('cache', e)).then(function boot() {
  const s = store.get(SAVE_KEY);
  if (saveValido(s)) abrirJornada(s, 'Jogo carregado deste navegador.');
  // primeira visita neste navegador (sem save nenhum, ainda não viu o tour): abre o tutorial em vez da criação.
  // Quem já jogou antes (tem save, mesmo que a jornada tenha terminado) não vê isso sem pedir — só pelo botão
  // ❓ Tutorial, sempre disponível no menu (navegacao.TELAS).
  else if (!tutorialVistoLocal()) telaTutorial();
  else showCreate();
});
/* Rodapé com os links do site (privacidade, termos, contato…). Vai FORA de `#app` porque render() reescreve o
   `#app` inteiro a cada tela — dentro dele, o rodapé sumiria na primeira re-renderização. Injetado por JS, e
   não escrito no index.html, pra não haver duas listas de links legais divergindo (js/site.js manda nas duas;
   as páginas estáticas usam a mesma função). Em batalha o CSS o esconde. */
document.body.insertAdjacentHTML('beforeend', rodapeHTML());

iniciarAds(); // sem conta configurada (config.js), não faz nada; com conta, só carrega o script depois do consentimento
aoMudarNuvem(renderChipConta);
// presença global (marcador "jogando agora") e o registro de visitante sem conta esperam a sessão carregar
// primeiro — senão um jogador logado apareceria como "sem conta" por uma fração de segundo
iniciarNuvem().then(() => {
  iniciarPresencaGlobal(); registrarVisitanteAnonimo();
  if (salaDoLink) entrarSala(salaDoLink);   // veio por link de convite: cai direto no lobby da sala
}).catch(e => console.error(e)); // sem config: não faz nada
