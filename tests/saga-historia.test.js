/* ⚔ Saga — a HISTÓRIA dos capítulos 4 a 10 se joga até o fim.
   O validador (`saga-validar.js`) garante que o mundo está inteiro: toda porta leva a algum lugar, toda fala
   existe, tudo é alcançável a pé. O que ele NÃO vê é ordem: um começo de conversa que faz sombra em outro e
   deixa uma missão sem saída, uma porta que nunca abre porque a marca certa nunca é ligada, um final que
   ninguém consegue destravar. Isso só aparece JOGANDO — então este arquivo joga: conversa pelos mesmos passos
   do motor (`tela-saga.conversar`), abre baú, vence luta, e confere o que mudou.
   Os capítulos 1 a 3 têm os seus casos em `saga-mundo.test.js`. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPAS_SAGA, NPCS, CAPITULOS, DONS } from '../js/dados-saga.js';
import { acharChar, estadoSaga, etapaDe, aplicar, objetoEm, comecarConversa, opcoesDe, capituloDe } from '../js/saga-mundo.js';

const lista = v => [].concat(v ?? []);
// uma jornada que já fechou os três primeiros capítulos (com as marcas de gente que a história lê depois)
const jornada = (extra = {}) => {
  const S = { dificuldade: 'saga', money: 0, bag: {}, player: { data: { types: ['normal'] } } };
  aplicar(S, { ...extra, flag: ['cap1', 'cap2', 'cap3', 'fim-bosque', 'passo-peixe', 'vau-deixou', 'lia-confia', 'sino-devolvido', ...lista(extra.flag)] });
  return S;
};
const em = (S, mapa, ch) => objetoEm(S, MAPAS_SAGA[mapa], ...acharChar(mapa, ch));
const vencer = (S, id) => { estadoSaga(S).flags['venceu:' + id] = true; };
const abrir = (S, o) => aplicar(S, { ...o.faz, flag: lista(o.faz?.flag).concat('bau:' + o.bau) });   // como `tela-saga.interagir`
const tem = (S, marca) => !!estadoSaga(S).flags[marca];
/* Uma conversa, na MESMA ordem do motor: as respostas são lidas antes do efeito da fala, depois vem o efeito da
   fala, depois o da resposta. `escolhas` são pedaços do texto de cada resposta, na ordem; fala com respostas e
   sem escolha combinada é erro do teste (o jogador teria de clicar em alguma coisa). Devolve as falas visitadas. */
function falar(S, id, escolhas = []) {
  const npc = NPCS[id], fila = [...escolhas], vistas = [];
  for (let k = comecarConversa(S, id); k && npc.nos[k];) {
    const no = npc.nos[k], ops = opcoesDe(S, no);
    vistas.push(k);
    aplicar(S, no.faz);
    if (!ops.length) { k = no.vai; continue; }
    const texto = fila.shift();
    assert.ok(texto !== undefined, `${id}/${k}: a conversa pede uma resposta (${ops.map(o => o.t).join(' | ')})`);
    const o = ops.find(x => x.t.includes(texto));
    assert.ok(o, `${id}/${k}: nenhuma resposta com "${texto}" (há: ${ops.map(x => x.t).join(' | ')})`);
    aplicar(S, o.faz); k = o.vai;
  }
  assert.equal(fila.length, 0, `${id}: sobraram respostas combinadas (${fila.join(', ')})`);
  return vistas;
}
const respostas = (S, id, no) => opcoesDe(S, NPCS[id].nos[no]).map(o => [...o.t][0]);

test('estrutura: dez capítulos encadeados, e cada um tem descanso, loja, um chefe e uma decisão', () => {
  assert.equal(CAPITULOS.length, 10);
  const doCap = c => Object.entries(MAPAS_SAGA).filter(([, m]) => m.cap === c.id);
  const objetos = c => doCap(c).flatMap(([, m]) => Object.values(m.objs || {}).flatMap(lista));
  const efeitos = c => objetos(c).filter(o => o.npc).flatMap(o => Object.values(NPCS[o.npc].nos)).flatMap(n => [n.faz, ...(n.opcoes || []).map(o => o.faz)]).filter(Boolean);
  for (const c of CAPITULOS) {
    assert.ok(doCap(c).length >= 2, `${c.id}: pelo menos dois mapas`);
    assert.ok(efeitos(c).some(f => f.cura), `${c.id}: alguém oferece descanso`);
    assert.ok(efeitos(c).some(f => f.loja), `${c.id}: alguém vende`);
    assert.ok(objetos(c).some(o => ['alfa', 'antigos'].includes(o.inimigo?.tipo)), `${c.id}: tem chefe`);
    if (c.n < 10) {
      assert.ok(efeitos(c).some(f => lista(f.flag).includes(c.id)), `${c.id}: alguma escolha fecha o capítulo`);
      const seguinte = CAPITULOS[c.n].id;
      assert.ok(objetos(c).some(o => o.porta && MAPAS_SAGA[o.porta[0]].cap === seguinte), `${c.id}: tem porta pro capítulo seguinte`);
    }
    assert.ok(efeitos(c).filter(f => f.dom).every(f => DONS[f.dom]), `${c.id}: dom que existe`);
  }
  // o fim da história: só o último capítulo encerra a jornada, e todo caminho da última conversa chega a um final
  const finais = Object.values(NPCS.antigos.nos).filter(n => n.faz?.fim).map(n => n.faz.fim);
  assert.deepEqual(finais.sort(), ['⚒ O Cano', '🌊 A Cheia', '🌑 A Sombra', '🪢 O Laço']);
  assert.equal(capituloDe(MAPAS_SAGA.nascente).n, 10);
});

test('capítulo 4: o portão do Vau abre, a Casa de Contas pede a chave, e o livro-caixa tem três destinos', () => {
  const fechado = jornada(); delete estadoSaga(fechado).flags.cap3;
  assert.ok(em(fechado, 'vau', 'J').placa, 'sem resolver a arena, o portão do sul não abre');
  const S = jornada();
  assert.deepEqual(em(S, 'vau', 'J').porta, ['brejal', 'J']);
  falar(S, 'barqueiro', ['Onde fica']); assert.equal(etapaDe(S, 'charco'), 0);
  falar(S, 'regente', ['Eu busco.']); assert.equal(etapaDe(S, 'charco'), 1);
  assert.ok(em(S, 'brejal', 'D').placa, 'a Casa de Contas começa trancada');
  assert.deepEqual(falar(S, 'chaveira', ['Me deixe entrar.']), ['pede', 'pede2', 'entra']);
  assert.deepEqual(em(S, 'brejal', 'D').porta, ['galeria', 'D']);
  assert.equal(em(S, 'galeria', 'X').inimigo.id, 'alfa4'); vencer(S, 'alfa4');
  abrir(S, em(S, 'galeria', 'X'));
  assert.ok(estadoSaga(S).itens.livro); assert.equal(etapaDe(S, 'charco'), 2);
  assert.ok(em(S, 'galeria', 'X').placa, 'depois do livro, sobra o nicho vazio');
  // os três destinos estão na mesa ao mesmo tempo, cada um com um personagem diferente
  assert.deepEqual(respostas(S, 'regente', 'livro2'), ['🌑', 'A']);
  assert.deepEqual(falar(S, 'veu4', ['Não. Alguém']), ['livro', 'livro2']);
  assert.ok(em(S, 'brejal', 'F').placa, 'a estrada pra Ferro-Fundo espera a decisão');
  falar(S, 'chaveira', ['⚒']);
  assert.ok(tem(S, 'cap4') && tem(S, 'charco-brasa') && !estadoSaga(S).itens.livro);
  assert.deepEqual(S.player.dons, ['tempera']);
  assert.deepEqual(em(S, 'brejal', 'F').porta, ['ladeira', 'F']);
  assert.deepEqual(falar(S, 'regente'), ['dBrasa'], 'a Regente lembra pra quem o livro foi');
});

test('capítulo 4: a pedra do Lasca só aparece depois do bando, e o caderno do sineiro leva à Dama Véu', () => {
  const S = jornada();
  falar(S, 'lasca4', ['Eu pego de volta.']);
  assert.equal(em(S, 'brejal', 'G'), null, 'antes de vencer o bando não há pedra no chão');
  vencer(S, 'saqueadores'); abrir(S, em(S, 'brejal', 'G'));
  assert.deepEqual(falar(S, 'lasca4'), ['trouxe', 'trouxe2']); assert.equal(etapaDe(S, 'gema'), 'fim');
  // a secreta: três conversas com o Pavio dão a pista; quem abre a missão é o caderno, na palafita escondida
  falar(S, 'pavio'); falar(S, 'pavio'); assert.deepEqual(falar(S, 'pavio'), ['terceira']);
  assert.equal(etapaDe(S, 'toque'), 'nao');
  abrir(S, em(S, 'palafita', 'D')); assert.equal(etapaDe(S, 'toque'), 0);
  assert.deepEqual(falar(S, 'veu4'), ['diario', 'diario2', 'diario3']);
  assert.ok(tem(S, 'ouviu-antigos')); assert.equal(etapaDe(S, 'toque'), 'fim');
  assert.deepEqual(falar(S, 'pavio'), ['acesa']);
});

test('capítulo 5: o piquete só libera depois dos dois lados, e a galeria abre as três saídas', () => {
  const S = jornada({ flag: ['cap1', 'cap2', 'cap3', 'cap4'] });
  falar(S, 'portao', ['Problema.']); assert.equal(etapaDe(S, 'fundo'), 0);
  assert.deepEqual(falar(S, 'piquete'), ['barra']);
  falar(S, 'mestre', ['Armar pra quê?']);
  assert.deepEqual(falar(S, 'piquete'), ['barra'], 'ouvir só o Mestre não basta');
  falar(S, 'tatu', ['O que vocês querem?']);
  assert.equal(em(S, 'ferrofundo', 'G').npc, 'piquete');
  assert.deepEqual(falar(S, 'piquete'), ['passa']);
  assert.deepEqual(em(S, 'ferrofundo', 'G').porta, ['lascas', 'G']);
  vencer(S, 'alfa5'); abrir(S, em(S, 'lascas', 'X')); assert.equal(etapaDe(S, 'fundo'), 2);
  assert.equal(respostas(S, 'mestre', 'decide')[0], '⚒'); assert.equal(respostas(S, 'tatu', 'decide')[0], '✊'); assert.equal(respostas(S, 'brasa5', 'decide2')[0], '🔥');
  falar(S, 'brasa5', ['🔥']);
  assert.ok(tem(S, 'cap5') && tem(S, 'ferro-ruiu')); assert.equal(etapaDe(S, 'fundo'), 'fim');
  assert.deepEqual(falar(S, 'mestre'), ['dRuiu']); assert.deepEqual(falar(S, 'tatu'), ['depois']);
  // consequência do capítulo 1: quem vendeu o minério não tem a porta da Brasa
  const T = jornada({ flag: ['cap1', 'cap2', 'cap3', 'cap4', 'vendeu-minerio'] });
  aplicar(T, { missao: ['fundo', 2] });
  assert.deepEqual(falar(T, 'brasa5'), ['traida']);
});

test('capítulo 5: o Faísca volta pra casa, e o ferreiro escondido reconhece a própria lança', () => {
  const S = jornada();
  falar(S, 'bigorna', ['Eu procuro.']);
  assert.equal(em(S, 'lascas', 'F').npc, 'faisca'); assert.equal(em(S, 'ferrofundo', 'K'), null);
  falar(S, 'faisca', ['Ficar um pouco', 'Vamos pra casa.']);
  assert.equal(em(S, 'lascas', 'F'), null); assert.equal(em(S, 'ferrofundo', 'K').npc, 'faisca');
  assert.deepEqual(falar(S, 'bigorna'), ['voltou']); assert.equal(etapaDe(S, 'faisca'), 'fim');
  // sem a lança, o ferreiro pergunta e você risca no chão; com ela, ele reconhece sozinho
  assert.deepEqual(falar(S, 'odilon'), ['oi', 'oi2', 'oi3']);
  assert.deepEqual(falar(S, 'odilon', ['Riscar no chão', 'Apontar pra porta']), ['denovo', 'lanca2', 'falou1']);
  assert.ok(tem(S, 'odilon-fala')); assert.deepEqual(falar(S, 'odilon'), ['falou']);
  const T = jornada(); aplicar(T, { item: 'lanca' }); falar(T, 'odilon');
  assert.deepEqual(falar(T, 'odilon', ['Deixar o martelo']), ['lanca', 'lanca2', 'calou1']);
  assert.deepEqual(falar(T, 'odilon'), ['calou']);
});

test('capítulo 6: três caminhos pro bosque, e a licença do Carvalho vale antes ou depois da decisão', () => {
  const S = jornada();
  falar(S, 'roque'); assert.equal(etapaDe(S, 'anda'), 0);
  falar(S, 'roque', ['Uma muda não faz sombra.', 'Eu trago.']); abrir(S, em(S, 'marcha', 'S'));
  assert.deepEqual(falar(S, 'roque'), ['trouxe']); assert.equal(etapaDe(S, 'muda'), 'fim');
  falar(S, 'meganium6'); assert.equal(etapaDe(S, 'anda'), 1);
  assert.deepEqual(falar(S, 'meganium6'), ['espera'], 'sem ouvir o Pai Torterra não há decisão');
  falar(S, 'torterra', ['Pra onde vocês vão?']);
  assert.deepEqual(respostas(S, 'meganium6', 'decide2'), ['🍃', '🌳', '✂', 'A']);
  // a secreta: o Carvalho só fala na segunda vez, e o recado passa na frente de qualquer outra conversa da Mãe
  assert.deepEqual(falar(S, 'carvalho'), ['quieto']);
  falar(S, 'carvalho'); assert.equal(etapaDe(S, 'fica'), 0);
  assert.deepEqual(falar(S, 'meganium6'), ['carvalho']); assert.ok(tem(S, 'arvore-ponte'));
  falar(S, 'meganium6', ['✂']);
  assert.ok(tem(S, 'cap6') && tem(S, 'bosque-rachou')); assert.deepEqual(falar(S, 'roque'), ['dRachou']);
  // ...e também DEPOIS de o bosque já ter decidido
  const T = jornada({ flag: ['cap1', 'cap2', 'cap3', 'cap6', 'bosque-partiu'] });
  falar(T, 'carvalho'); falar(T, 'carvalho');
  assert.deepEqual(falar(T, 'meganium6'), ['carvalho']); assert.deepEqual(falar(T, 'meganium6'), ['dPartiu']);
});

test('capítulo 7: o vão fecha pelo Alfa OU pela árvore velha, e o Tomé chega como você o deixou', () => {
  const S = jornada();
  falar(S, 'lia7', ['Eu desço lá.']); assert.equal(etapaDe(S, 'travessia'), 0);
  assert.ok(em(S, 'ponte', 'V').placa, 'o vão barra a ponte');
  vencer(S, 'alfa7');
  assert.equal(em(S, 'ponte', 'V'), null, 'vencido o Alfa, o vão fecha');
  aplicar(S, em(S, 'ponte', 'G').faz); assert.equal(etapaDe(S, 'travessia'), 1);
  assert.equal(em(S, 'margem', 'Z'), null, 'o bando só para depois do capitão');
  vencer(S, 'rufino'); aplicar(S, em(S, 'margem', 'Z').faz); assert.equal(etapaDe(S, 'travessia'), 2);
  assert.equal(respostas(S, 'lia7', 'decide2')[0], '🌉'); assert.equal(respostas(S, 'tome7', 'decide2')[0], '🪓'); assert.equal(respostas(S, 'capataz', 'oferta')[0], '⚒');
  falar(S, 'tome7', ['🪓']);
  assert.ok(tem(S, 'cap7') && tem(S, 'ponte-caiu')); assert.deepEqual(falar(S, 'lia7'), ['dCaiu']);
  assert.deepEqual(em(S, 'cabeceira', 'E').porta, ['salina', 'E']);
  // a árvore que o capítulo 6 deixou ficar: fecha o vão sem luta, e some da cabeceira
  const T = jornada({ flag: ['cap1', 'cap2', 'cap3', 'arvore-ponte'] });
  assert.equal(em(T, 'cabeceira', 'V').npc, 'carvalho7'); assert.ok(em(T, 'ponte', 'V').placa);
  falar(T, 'carvalho7', ['Mostrar o vão']);
  assert.equal(em(T, 'ponte', 'V'), null); assert.equal(em(T, 'cabeceira', 'V'), null);
  // o Tomé de cada fim do capítulo 2
  const como = marca => { const J = jornada(); delete estadoSaga(J).flags['passo-peixe']; aplicar(J, { flag: marca }); return falar(J, 'tome7')[0]; };
  assert.equal(falar(jornada(), 'tome7')[0], 'peixe'); assert.equal(como('passo-fome'), 'fome'); assert.equal(como('passo-fogo'), 'fogo');
});

test('capítulo 7: a caixa da Selma e o menino entre os pilares', () => {
  const S = jornada();
  falar(S, 'selma7', ['Eu trago.']); abrir(S, em(S, 'ponte', 'C'));
  assert.deepEqual(falar(S, 'selma7'), ['trouxe']); assert.equal(etapaDe(S, 'remedio'), 'fim');
  assert.equal(em(S, 'pilares', 'N').npc, 'nico7'); assert.equal(em(S, 'cabeceira', 'K'), null);
  falar(S, 'nico7', ['Empurrar o menino']);
  assert.equal(etapaDe(S, 'sozinho'), 'fim'); assert.equal(em(S, 'pilares', 'N'), null); assert.equal(em(S, 'cabeceira', 'K').npc, 'nico7');
  assert.deepEqual(falar(S, 'nico7'), ['ficou']);
  // quem deixa o menino lá pode voltar e decidir depois
  const T = jornada(); falar(T, 'nico7', ['Deixar ele']);
  assert.deepEqual(falar(T, 'nico7', ['Empurrar o menino']), ['decide', 'vai']);
});

test('capítulo 8: a parede só se lê depois do Alfa, e o nó de pano está atrás da parede falsa', () => {
  const S = jornada();
  aplicar(S, em(S, 'salina', 'H').faz); assert.equal(etapaDe(S, 'sal'), 0);
  assert.equal(em(S, 'salina', 'H'), null, 'o letreiro da chegada só acontece uma vez');
  falar(S, 'dalva', ['Olhar o pano']); assert.equal(etapaDe(S, 'sal'), 1);
  assert.deepEqual(falar(S, 'zelador'), ['oi']); assert.deepEqual(falar(S, 'zelador'), ['varre']);
  vencer(S, 'alfa8'); abrir(S, em(S, 'fonteMorta', 'X')); assert.equal(etapaDe(S, 'sal'), 2);
  assert.deepEqual(falar(S, 'zelador'), ['falta']); assert.equal(etapaDe(S, 'no'), 0);
  // a casa do baú é cercada de breu: o único vizinho por onde se entra é a parede falsa
  const F = MAPAS_SAGA.fonteMorta, [kx, ky] = acharChar('fonteMorta', 'K');
  assert.equal(F.grade[ky][kx - 2], '%'); assert.equal(F.grade[ky - 1][kx], '#'); assert.equal(F.grade[ky + 1][kx], '#');
  abrir(S, em(S, 'fonteMorta', 'K')); assert.ok(estadoSaga(S).itens.no); assert.equal(etapaDe(S, 'no'), 'fim');
  assert.deepEqual(respostas(S, 'dalva', 'decide3'), ['📜', '🤐', 'A']);
  assert.equal(respostas(S, 'pressagio8', 'oferta2')[0], '🌑');
  falar(S, 'dalva', ['📜']);
  assert.ok(tem(S, 'cap8') && tem(S, 'sal-contou')); assert.deepEqual(falar(S, 'pressagio8'), ['depois']);
  assert.deepEqual(em(S, 'cidadeSal', 'N').porta, ['degelo', 'N']);
});

test('capítulo 9: as três ordens no mesmo fogo só com ninguém abaixo de zero — ordem ferida manda cobrar', () => {
  const S = jornada({ flag: ['cap1', 'cap2', 'cap3', 'cap8'] });
  assert.equal(em(S, 'degelo', 'F').npc, 'brasa9'); assert.equal(em(S, 'degelo', 'B').npc, 'meganium9'); assert.equal(em(S, 'degelo', 'A').npc, 'lasca9');
  falar(S, 'tio9'); assert.equal(etapaDe(S, 'degelo'), 0);
  assert.deepEqual(falar(S, 'brasa9'), ['oi'], 'antes do conselho, ninguém propõe liderar');
  assert.deepEqual(falar(S, 'tio9', ['Vou falar com eles.']), ['pleno', 'pleno2', 'escolha']);
  assert.ok(tem(S, 'conselho-pleno')); assert.equal(etapaDe(S, 'degelo'), 1);
  assert.ok(em(S, 'degelo', 'G').placa, 'sem líder, a geleira não abre');
  falar(S, 'meganium9', ['🌿']);
  assert.ok(tem(S, 'subida') && tem(S, 'sobe-bosque') && tem(S, 'cap9')); assert.equal(etapaDe(S, 'degelo'), 2);
  assert.deepEqual(em(S, 'degelo', 'G').porta, ['geleira', 'G']);
  assert.deepEqual(falar(S, 'brasa9'), ['ficou']); assert.deepEqual(falar(S, 'meganium9'), ['lider']);
  vencer(S, 'alfa9'); aplicar(S, em(S, 'garganta', 'Y').faz); assert.equal(etapaDe(S, 'degelo'), 'fim');
  // a Forja ferida: no lugar da Brasa, os cobradores — e o fogo do meio fica com uma pedra vazia
  const T = jornada({ rep: { forja: -1 } });
  assert.equal(em(T, 'degelo', 'F').inimigo.id, 'cobraForja');
  falar(T, 'tio9');
  assert.deepEqual(falar(T, 'tio9', ['Subir por conta própria']), ['falta', 'escolha', 'so']);
  assert.ok(tem(T, 'sobe-so') && !tem(T, 'conselho-pleno'));
  vencer(T, 'cobraForja'); assert.equal(em(T, 'degelo', 'F'), null, 'vencer os cobradores não traz a Brasa de volta');
  // o Carteiro: a carta de cada lugar muda com o que você fez lá, e a sem dono abre a missão secreta
  assert.deepEqual(falar(S, 'carteiro', ['Ler as cartas', 'Da Serra do Fumo', 'A que não tem dono', 'Chega de carta']), ['oi', 'cartas', 'cSerraPeixe', 'cartas', 'cGelo', 'cartas']);
  assert.equal(etapaDe(S, 'gelo'), 0);
  abrir(S, em(S, 'geleira', 'Z')); assert.equal(etapaDe(S, 'gelo'), 'fim');
});

test('capítulo 10: a Cheia sempre existe, cada ordem abre o seu final, e O Laço pede as quatro coisas', () => {
  const finais = S => respostas(S, 'antigos', 'escutam');
  const S = jornada({ flag: ['cap1', 'cap2', 'cap3', 'cap9', 'subida'] }); delete estadoSaga(S).flags['lia-confia']; delete estadoSaga(S).flags['sino-devolvido'];
  assert.equal(em(S, 'nascente', 'X').inimigo.tipo, 'antigos');
  assert.deepEqual(finais(S), ['🌊'], 'quem chega sem nada ainda tem um final');
  aplicar(S, { flag: 'sobe-forja' }); assert.deepEqual(finais(S), ['⚒', '🌊']);
  // as quatro coisas do final verdadeiro, uma a uma: só a última destrava
  const L = jornada({ flag: ['cap1', 'cap2', 'cap3', 'subida', 'sobe-so'] });
  assert.deepEqual(finais(L), ['🌊'], 'Lia e sino não bastam');
  aplicar(L, { flag: 'conselho-pleno' }); assert.deepEqual(finais(L), ['🌊']);
  aplicar(L, { item: 'no' }); assert.deepEqual(finais(L), ['🪢', '🌊']);
  // a Dama Véu mostra quais das quatro você trouxe
  assert.deepEqual(respostas(L, 'veu10', 'conta'), ['🪢', '🔔', '🔥', '🧣', 'E']);
  assert.deepEqual(respostas(S, 'veu10', 'conta'), ['E']);
  // vencidos, os Antigos viram conversa; o final escolhido encerra a jornada (o `fim` vira pedido pra tela)
  vencer(L, 'antigos'); assert.equal(em(L, 'nascente', 'X').npc, 'antigos');
  assert.deepEqual(falar(L, 'antigos', ['🪢']), ['escutam', 'laco', 'laco2', 'laco3']);
  assert.equal(estadoSaga(L).final, '🪢 O Laço'); assert.equal(etapaDe(L, 'nascente'), 'fim');
  assert.deepEqual(aplicar(jornada(), { fim: '🌊 A Cheia' }).pedidos, [{ fim: '🌊 A Cheia' }]);
  // os dois caminhos da Cheia (calar, ou o Círculo pedir) terminam na mesma água
  const C = jornada({ flag: ['subida', 'sobe-bosque'] });
  assert.deepEqual(falar(C, 'antigos', ['🌿']), ['escutam', 'cheiaBosque', 'cheia2']); assert.equal(estadoSaga(C).final, '🌊 A Cheia');
  // quem liderou a subida espera no Limiar; quem subiu só não acha ninguém naquele lugar
  assert.equal(em(S, 'limiar', 'D').npc, 'brasa10'); assert.equal(em(L, 'limiar', 'D'), null);
  assert.equal(em(L, 'limiar', 'A').npc, 'lia10'); assert.equal(em(S, 'limiar', 'A'), null);
});

test('o final verdadeiro é possível: existe um caminho pelos dez capítulos que não deixa ordem nenhuma abaixo de zero', () => {
  // soma a reputação de um roteiro de escolhas, lendo os números dos PRÓPRIOS diálogos (mudou o diálogo, muda a conta)
  const rep = { forja: 0, bosque: 0, abismo: 0 };
  const soma = (npc, no, emoji) => { const n = NPCS[npc].nos[no], f = emoji ? n.opcoes.find(o => o.t.includes(emoji)).faz : n.faz; for (const [k, v] of Object.entries(f.rep || {})) rep[k] += v; };
  soma('vo', 'obrigada'); soma('brasa', 'paga'); soma('slowpoke', 'sino3'); soma('meganium', 'coracao2', '🌿');       // cap. 1
  soma('ursa', 'decide', '🐟'); soma('alfa2', 'devagar'); soma('teddi', 'voltou');                                    // cap. 2
  soma('baltazar', 'coracao2', '🏟'); soma('bia', 'decide', 'Lutem juntas'); soma('fera', 'cansada', 'Fechar a grade'); // cap. 3
  soma('chaveira', 'livro2', '⚒'); soma('lasca4', 'trouxe2'); soma('veu4', 'diario3');                                // cap. 4
  soma('brasa5', 'decide2', '🔥'); soma('bigorna', 'voltou');                                                          // cap. 5
  soma('meganium6', 'decide2', '✂'); soma('roque', 'trouxe');                                                         // cap. 6
  soma('lia7', 'decide2', '🌉');                                                                                       // cap. 7
  soma('dalva', 'decide3', '📜');                                                                                      // cap. 8
  for (const [k, v] of Object.entries(rep)) assert.ok(v >= 0, `${k} terminou em ${v}: por este roteiro o conselho não se reúne`);
});
