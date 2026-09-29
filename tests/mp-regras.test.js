/* Regras da sala multiplayer (js/mp-regras.js) — puras, então dá pra testar sem rede e sem DOM.
   Antes desta suíte, NADA do multiplayer fora do motor tinha teste: quem decide "esta luta mexe na minha jornada?"
   e "de qual mochila sai este Revive?" morava dentro de um arquivo de 1190 linhas com rede e HTML junto. */
import test from 'node:test';
import assert from 'node:assert';
import { entradaEfetiva, raideSemRun, semMochila, usaRun, soAssistindo, hallEmprestado, jogaveis, minhaVezDe,
  quemFalta, jaEscolheu, todosProntos, montarLado, podeReviver, raideDisponiveis, itensComunsDisponiveis,
  revivesRestantes, resumoDaConfig, inimigosDe, motivoParaNaoComecar, seloDoMembro } from '../js/mp-regras.js';

const sala = (entradaTipo, modo = 'coop') => ({ entradaTipo, config: { modo, porJogador: 1, balancear: true } });

test('entradaEfetiva: a Sala de Raide força o Hall pra todo mundo, menos pra quem só assiste', () => {
  assert.equal(entradaEfetiva(sala('run')), 'run');
  assert.equal(entradaEfetiva(sala('convidado')), 'convidado');
  assert.equal(entradaEfetiva(sala('run', 'raide')), 'hall');        // não existe run na Raide
  assert.equal(entradaEfetiva(sala('convidado', 'raide')), 'hall');
  assert.equal(entradaEfetiva(sala('espectador', 'raide')), 'espectador');
  assert.equal(entradaEfetiva(null), 'run');                          // sem sala: o padrão
  assert.equal(raideSemRun(sala('run', 'raide')), true);
});

test('mochila e recompensa: só a entrada "run" mexe na jornada; Hall fora da Raide é emprestado', () => {
  assert.equal(usaRun(sala('run')), true);
  assert.equal(semMochila(sala('run')), false);
  // Hall em co-op/PvP = emprestado: sem mochila, sem recompensa
  assert.equal(hallEmprestado(sala('hall')), true);
  assert.equal(semMochila(sala('hall')), true);
  assert.equal(usaRun(sala('hall')), false);
  // Hall DENTRO da Raide tem a mochila da conta — é o ponto dela
  assert.equal(hallEmprestado(sala('hall', 'raide')), false);
  assert.equal(semMochila(sala('hall', 'raide')), false);
  assert.equal(semMochila(sala('convidado')), true);
  assert.equal(semMochila(sala('espectador')), true);
  assert.equal(soAssistindo(sala('espectador')), true);
});

/* ---------- quem age ---------- */
const mon = (ref, dono, hp = 10) => ({ ref, dono, hp, stats: { hp: 10 }, moves: [] });
const batalha = () => ({ turno: 3, lados: { A: [mon('A0', 'eu'), mon('A1', 'amigo'), mon('A2', 'eu', 0)], B: [mon('B0', 'ia')] } });

test('jogaveis ignora a IA e quem caiu; inimigosDe olha pro outro lado', () => {
  const b = batalha();
  assert.deepEqual(jogaveis(b).map(m => m.ref), ['A0', 'A1']);
  assert.deepEqual(inimigosDe(b, b.lados.A[0]).map(m => m.ref), ['B0']);
});

test('minhaVez pula quem já escolheu (local) e quem o anfitrião já confirmou', () => {
  const b = batalha();
  const s = { batalha: b, escolhidos: new Set(), acoesFeitas: [] };
  assert.equal(minhaVezDe(s, 'eu').ref, 'A0');
  s.escolhidos.add('A0');
  assert.equal(minhaVezDe(s, 'eu'), null);            // meu outro Pokémon está caído
  assert.equal(minhaVezDe(s, 'amigo').ref, 'A1');
  // a confirmação do anfitrião vale mesmo sem a marca local (aconteceu em outro aparelho / reconexão)
  assert.equal(minhaVezDe({ batalha: b, escolhidos: new Set(), acoesFeitas: ['A1'] }, 'amigo'), null);
});

test('quemFalta lista os donos que o anfitrião ainda não confirmou', () => {
  const b = batalha();
  assert.deepEqual(quemFalta({ batalha: b, acoesFeitas: [] }), ['eu', 'amigo']);
  assert.deepEqual(quemFalta({ batalha: b, acoesFeitas: ['A0'] }), ['amigo']);
  assert.equal(jaEscolheu({ batalha: b, acoesFeitas: ['A0'] }, 'eu'), true);
  assert.equal(jaEscolheu({ batalha: b, acoesFeitas: ['A0'] }, 'amigo'), false);
});

test('todosProntos: espectador não segura a sala, e sem Pokémon ninguém está pronto', () => {
  assert.equal(todosProntos([]), false);
  assert.equal(todosProntos([{ pronto: true, mons: [1] }, { pronto: false, mons: [1] }]), false);
  assert.equal(todosProntos([{ pronto: true, mons: [1] }, { pronto: true, mons: [] }]), false);
  assert.equal(todosProntos([{ pronto: true, mons: [1] }, { pronto: true, mons: [1] }]), true);
  assert.equal(todosProntos([{ pronto: true, mons: [1] }, { entradaTipo: 'espectador', pronto: false }]), true);
});

test('motivoParaNaoComecar diz POR QUE o botão está apagado (e some quando dá pra começar)', () => {
  const m = (id, extra = {}) => ({ id, nome: id, mons: [{ hp: 10 }], pronto: true, time: 'A', ...extra });
  const sala = (modo, membros) => ({ config: { modo }, membros });
  assert.match(motivoParaNaoComecar(sala('coop', [m('eu')]), { temRun: false }), /jornada em andamento/);
  assert.match(motivoParaNaoComecar(sala('coop', [m('eu'), m('ana', { mons: [] })]), { temRun: true }), /Ainda escolhendo o Pokémon: ana/);
  assert.match(motivoParaNaoComecar(sala('coop', [m('eu'), m('ana', { pronto: false })]), { temRun: true }), /Falta ficar pronto: ana/);
  assert.match(motivoParaNaoComecar(sala('pvp', [m('eu'), m('ana')]), {}), /Cada time precisa/);
  assert.match(motivoParaNaoComecar(sala('raide', [{ id: 'a', nome: 'A', entradaTipo: 'espectador' }]), {}), /Ninguém entrou pra jogar/);
  assert.equal(motivoParaNaoComecar(sala('coop', [m('eu'), m('ana')]), { temRun: true }), '');
  assert.equal(motivoParaNaoComecar(sala('pvp', [m('eu'), m('ana', { time: 'B' })]), {}), '');
  // espectador não segura ninguém, mesmo sem Pokémon e sem "pronto"
  assert.equal(motivoParaNaoComecar(sala('coop', [m('eu'), { id: 'x', nome: 'X', entradaTipo: 'espectador' }]), { temRun: true }), '');
});

test('seloDoMembro resume o estado de cada um no lobby', () => {
  assert.equal(seloDoMembro({ entradaTipo: 'espectador' }).cls, 'assiste');
  assert.equal(seloDoMembro({ mons: [] }).cls, 'escolhendo');
  assert.equal(seloDoMembro({ mons: [1], pronto: false }).cls, 'escolhendo');
  assert.equal(seloDoMembro({ mons: [1], pronto: true }).cls, 'pronto');
});

test('montarLado respeita o teto de Pokémon por jogador, pula os caídos e numera repetidos', () => {
  const foto = nome => ({ nome, hp: 10, stats: { hp: 10 }, level: 5, moves: [] });
  const membros = [{ id: 'eu', mons: [foto('Pikachu'), foto('Pikachu'), foto('Eevee')] },
    { id: 'amigo', mons: [{ ...foto('Snorlax'), hp: 0 }, foto('Pikachu')] }];
  const lado = montarLado(membros, 'A', 2);
  assert.deepEqual(lado.map(m => m.ref), ['A0', 'A1', 'A2']);   // 2 meus + 1 do amigo (o caído fica fora)
  assert.deepEqual(lado.map(m => m.dono), ['eu', 'eu', 'amigo']);
  assert.deepEqual(lado.map(m => m.nome), ['Pikachu 1', 'Pikachu 2', 'Pikachu 3']);
  assert.equal(lado[0].vol.stages.attack, 0);   // entra com estágios zerados
});

/* ---------- mochila na luta ---------- */
const lutaEvento = (meuHp, hpDoOutro = 10) => ({ evento: 'eternatus', revivesUsados: {}, lados: {
  A: [{ ref: 'A0', dono: 'eu', hp: meuHp, stats: { hp: 10 } }, { ref: 'A1', dono: 'amigo', hp: hpDoOutro, stats: { hp: 10 } }],
  B: [{ ref: 'B0', dono: 'ia', hp: 100, stats: { hp: 100 }, boss: { raide: {} } }] } });

test('Revive fora da Raide: só com o time inteiro caído e com Revive na mochila', () => {
  const ctx = extra => ({ sala: sala('run'), eu: 'eu', bag: { revive: 1 }, temRun: true, ...extra });
  assert.equal(podeReviver(lutaEvento(0), ctx()), true);
  assert.equal(podeReviver(lutaEvento(5), ctx()), false);                    // ainda estou de pé
  assert.equal(podeReviver(lutaEvento(0), ctx({ bag: {} })), false);         // sem Revive
  assert.equal(podeReviver(lutaEvento(0, 0), ctx()), false);                 // ninguém de pé: a luta já acabou
  assert.equal(podeReviver(lutaEvento(0), ctx({ sala: sala('convidado') })), false);  // emprestado não tem mochila
  const gasto = { ...lutaEvento(0), revivesUsados: { eu: 3 } };
  assert.equal(podeReviver(gasto, ctx()), false);                            // teto de usos
  assert.equal(revivesRestantes(gasto, 'eu'), 0);
});

test('Revive na Sala de Raide: dá pra reviver com o time ainda lutando, e aceita Max Revive', () => {
  const s = sala('hall', 'raide');
  const luta = { ...lutaEvento(0), lados: { A: [{ ref: 'A0', dono: 'eu', hp: 0, stats: { hp: 10 } }, { ref: 'A1', dono: 'eu', hp: 8, stats: { hp: 10 } }], B: lutaEvento(0).lados.B } };
  assert.equal(podeReviver(luta, { sala: s, eu: 'eu', bag: { 'max-revive': 1 }, temRun: false }), true);
  assert.equal(podeReviver(luta, { sala: s, eu: 'eu', bag: {}, temRun: false }), false);
});

test('itens de raide: só os que tenho e que o grupo ainda não usou nesta luta', () => {
  const b = lutaEvento(10);
  const ctx = { sala: sala('run'), eu: 'eu', bag: { 'cristal-de-ruptura': 2, 'selo-de-interrupcao': 1 }, temRun: true };
  assert.deepEqual(raideDisponiveis(b, ctx), ['ruptura', 'interrupcao']);
  b.lados.B[0].boss.raide.ruptura = true;
  assert.deepEqual(raideDisponiveis(b, ctx), ['interrupcao']);
  assert.deepEqual(raideDisponiveis({ ...b, evento: null }, ctx), []);   // fora do chefe da semana não existem
});

test('itens comuns: precisa de um Pokémon escolhendo, e só o que tem efeito agora', () => {
  const mon = { hp: 5, stats: { hp: 10 }, status: null, moves: [{ pp: 10, ppLeft: 10 }] };
  const ctx = { sala: sala('run'), eu: 'eu', bag: { potion: 1, 'rare-candy': 1 }, temRun: true, mon };
  const l = itensComunsDisponiveis(ctx);
  assert.ok(l.includes('potion'));
  assert.ok(!l.includes('rare-candy'));                                 // candy é fora de batalha (SEM_BATALHA_MP)
  assert.deepEqual(itensComunsDisponiveis({ ...ctx, mon: null }), []);  // não é a minha vez
  assert.deepEqual(itensComunsDisponiveis({ ...ctx, sala: sala('convidado') }), []);
  assert.deepEqual(itensComunsDisponiveis({ ...ctx, mon: { ...mon, hp: 10 } }).includes('potion'), false); // HP cheio
});

test('resumoDaConfig conhece os três modos (a Raide não tem rota nem balanceamento)', () => {
  assert.equal(resumoDaConfig({ modo: 'coop', porJogador: 2, balancear: true }, 'Rota 1'), '🌿 Co-op · 2 Pokémon por jogador · balanceado · Rota 1');
  assert.equal(resumoDaConfig({ modo: 'pvp', porJogador: 1, balancear: false }, 'Rota 1'), '⚔ PvP · 1 Pokémon por jogador · sem balancear');
  assert.equal(resumoDaConfig({ modo: 'raide', porJogador: 3 }, 'Rota 1'), '☄ Sala de Raide · 3 Pokémon por jogador');
});
