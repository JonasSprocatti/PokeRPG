/* Itens de raide: o que cada um faz e contra quais chefes serve (js/itens-raide.js).
   Os prêmios do chefe da semana giram em rodízio e NÃO combinam com o chefe (o Groudon dá Prisma de Luz, que só serve
   contra chefe com ponto fraco; o Calyrex dá Célula Zygarde, que só serve contra o Zygarde). Sem dizer contra quem cada
   item presta, o jogador gasta ou guarda às cegas. A lista "Serve contra: …" mora na descrição do item (dados.js), que
   aparece nas dicas dos botões, na mochila e na ajuda — e estes testes garantem que ela é a que o CÓDIGO produz. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../js/dados.js';
import { EVENTOS } from '../js/evento.js';
import { CHEFES, ITEM_DO_RAIDE, danoNoChefe, usarItemDeRaide, prepararChefe } from '../js/boss.js';
import { TIPO_DO_GOLPE, SERVE, CONSUMIVEIS, SEGURADOS_DE_PREMIO, chefesDoItem, textoServe, itensQueServemContra, quemDa,
  linhaItensDoChefe, htmlItensDeRaide, tiposDoChefe } from '../js/itens-raide.js';
import { htmlComoFuncionam } from '../js/ajuda-chefes.js';

const TODOS = [...CONSUMIVEIS, ...SEGURADOS_DE_PREMIO];

test('todo golpe que um chefe usa tem o tipo cadastrado (chefe novo obriga a completar a tabela)', () => {
  const faltando = [];
  for (const ev of EVENTOS) for (const g of ev.golpes) if (!TIPO_DO_GOLPE[g]) faltando.push(`${ev.nome}: ${g}`);
  assert.deepEqual(faltando, [], 'complete TIPO_DO_GOLPE em js/itens-raide.js');
  for (const ev of EVENTOS) assert.ok(CHEFES[ev.chefe]?.canhao?.type, `${ev.nome}: o golpe carregado precisa ter tipo na config`);
});

test('a descrição de CADA item de raide traz "Serve contra:" com exatamente a lista que o código produz', () => {
  for (const id of TODOS) {
    assert.ok(SERVE[id], `${id} não tem regra em SERVE`);
    const esperado = `Serve contra: ${textoServe(id)}`;
    assert.ok(ITEMS[id].desc.includes(esperado), `${id}: a descrição devia conter "${esperado}"\n  hoje: ${ITEMS[id].desc}`);
  }
});

test('nenhum item de raide é órfão: todo consumível serve contra pelo menos um chefe', () => {
  for (const id of TODOS) assert.ok(chefesDoItem(id).length >= 1, `${id} não serve contra nenhum chefe`);
});

test('as regras "só alguns chefes" batem com a config real dos chefes', () => {
  const nomes = id => chefesDoItem(id).map(e => e.nome).sort();
  assert.deepEqual(nomes('prisma-de-luz'), EVENTOS.filter(e => CHEFES[e.chefe].pontoFraco).map(e => e.nome).sort(), 'Prisma: quem tem ponto fraco');
  assert.deepEqual(nomes('celula-zygarde'), EVENTOS.filter(e => CHEFES[e.chefe].regenera).map(e => e.nome).sort(), 'Célula: quem regenera');
  assert.deepEqual(nomes('celula-zygarde'), ['Zygarde Completo']);
  assert.ok(nomes('cinza-vulcanica').includes('Groudon Primal') && !nomes('cinza-vulcanica').includes('Kyogre Primal'));
  assert.ok(nomes('escama-abissal').includes('Kyogre Primal') && !nomes('escama-abissal').includes('Groudon Primal'));
  // e o que a descrição promete de "só funciona em…" é o que o motor faz: a recusa vem do próprio boss.usarItemDeRaide
  const sem = EVENTOS.find(e => !CHEFES[e.chefe].pontoFraco), com = EVENTOS.find(e => CHEFES[e.chefe].pontoFraco);
  const chefeDe = ev => { const E = { level: 50, stats: { hp: 1000 }, hp: 1000, vol: {} }; prepararChefe(E, 1, ev.chefe); return E; };
  assert.equal(usarItemDeRaide(chefeDe(sem), 'prisma').ok, false, `${sem.nome} não tem ponto fraco: o motor recusa`);
  assert.equal(usarItemDeRaide(chefeDe(com), 'prisma').ok, true, `${com.nome} tem: o motor aceita`);
  const semRegen = EVENTOS.find(e => !CHEFES[e.chefe].regenera);
  assert.equal(usarItemDeRaide(chefeDe(semRegen), 'celula').ok, false);
  assert.equal(usarItemDeRaide(chefeDe(EVENTOS.find(e => e.nome === 'Zygarde Completo')), 'celula').ok, true);
});

test('Cinza e Escama: servem a quem ataca com aquele tipo — nos golpes normais OU no golpe carregado', () => {
  for (const ev of EVENTOS) {
    const t = tiposDoChefe(ev);
    assert.equal(SERVE['cinza-vulcanica'](ev), t.has('fire'), `${ev.nome} x Fogo`);
    assert.equal(SERVE['escama-abissal'](ev), t.has('water'), `${ev.nome} x Água`);
  }
  // o Kyogre só tem Água no golpe carregado + Surf/Hydro Pump; o Groudon usa Fogo mas o Espelho/Cinza não o confundem
  assert.ok(tiposDoChefe(EVENTOS.find(e => e.nome === 'Kyogre Primal')).has('water'));
});

test('Espelho Reverso: a descrição avisa que atrapalha contra quem é fraco aos seus tipos — e o motor confirma', () => {
  const E = { boss: { id: EVENTOS[0].chefe, espelhoAcoes: 3 } }, sem = { boss: { id: EVENTOS[0].chefe } };
  assert.ok(danoNoChefe(E, 100, 'fire', 0.5) > danoNoChefe(sem, 100, 'fire', 0.5), 'ele resiste: com o espelho apanha MAIS');
  assert.ok(danoNoChefe(E, 100, 'fire', 2) < danoNoChefe(sem, 100, 'fire', 2), 'ele é fraco: com o espelho apanha MENOS');
  assert.equal(danoNoChefe(E, 100, 'fire', 1), danoNoChefe(sem, 100, 'fire', 1), 'neutro não muda');
  assert.match(ITEMS['espelho-reverso'].desc, /atrapalha/, 'a descrição precisa dizer que pode atrapalhar');
  assert.doesNotMatch(ITEMS['espelho-reverso'].desc, /a seu favor/, 'a frase antiga era enganosa');
});

test('quem dá cada item vem do prêmio real dos chefes, e todo consumível é dado por alguém', () => {
  for (const id of CONSUMIVEIS) assert.ok(quemDa(id).length >= 1, `${id}: nenhum chefe dá esse item`);
  assert.deepEqual(quemDa('celula-zygarde'), [{ nome: 'Calyrex Cavaleiro Espectral', n: 1 }]);
  assert.ok(quemDa('cristal-de-ruptura').every(q => q.n === 2), 'os "grandes" vêm em dose dupla');
});

test('a ajuda dos chefes lista TODOS os itens de raide, com o que fazem e contra quem servem', () => {
  const h = htmlComoFuncionam();
  for (const id of TODOS) assert.ok(h.includes(ITEMS[id].name), `a ajuda não cita ${ITEMS[id].name}`);
  assert.ok(h.includes('Serve contra') && h.includes('Quem dá de prêmio'));
  assert.ok(h.includes('nem todo item serve contra o chefe da semana'));
  // as colunas separam o "faz" do "serve": nada de "Serve contra:" sobrando dentro da coluna "O que faz"
  const colunaFaz = [...htmlItensDeRaide().matchAll(/<tr><td><b>[^<]*<\/b><\/td><td>([^<]*)<\/td>/g)].map(m => m[1]);
  assert.equal(colunaFaz.length, TODOS.length);
  for (const c of colunaFaz) assert.ok(!c.includes('Serve contra') && !c.startsWith('Só na luta'), c);
});

test('linhaItensDoChefe: separa os itens que você tem entre "servem" e "não servem" contra aquele chefe', () => {
  const groudon = EVENTOS.find(e => e.nome === 'Groudon Primal');
  const l = linhaItensDoChefe(groudon, { 'cristal-de-ruptura': 2, 'prisma-de-luz': 1, 'celula-zygarde': 1, 'cinza-vulcanica': 1, potion: 5 });
  const [servem, nao] = l.split('Não servem contra ele:');
  assert.ok(servem.includes('Cristal de Ruptura ×2') && servem.includes('Cinza Vulcânica ×1'), l);
  assert.ok(nao.includes('Prisma de Luz ×1') && nao.includes('Célula Zygarde ×1'), l);
  assert.ok(!l.includes('Potion'), 'só itens de raide');
  assert.match(linhaItensDoChefe(groudon, {}), /não tem itens de raide/);
  assert.match(linhaItensDoChefe(groudon, { 'prisma-de-luz': 1 }), /servem<\/b>: nenhum/);
  assert.deepEqual(itensQueServemContra(groudon), CONSUMIVEIS.filter(id => SERVE[id](groudon)));
  assert.equal(Object.keys(ITEM_DO_RAIDE).length, CONSUMIVEIS.length);
});
