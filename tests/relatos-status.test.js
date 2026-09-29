/* Situação de um relato (🐞 Relatar → "Seus relatos"). O vocabulário de `relatos.status` é fechado por CHECK no
   banco e traduzido pro jogador em dados.STATUS_RELATO — os dois ficam em arquivos diferentes (SQL e JS), então
   é fácil acrescentar um status num lado e esquecer o outro. Aí o jogador veria um relato sem rótulo nenhum, que
   é exatamente o problema que esta tela veio resolver. Este teste lê o SQL e cobra a correspondência, no mesmo
   espírito do tests/schema.test.js (pesos de pontuação do SQL x regras.js). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STATUS_RELATO, STATUS_RELATO_PADRAO, situacaoDoRelato } from '../js/dados.js';

const SQL = new URL('../supabase/migrations/20260929140000_relatos_status.sql', import.meta.url);

// os status que o CHECK do banco aceita, lidos do próprio arquivo de migration
function statusDoBanco() {
  const src = readFileSync(SQL, 'utf8');
  const m = src.match(/add constraint relatos_status_valido\s*\n?\s*check \(status in \(([^)]*)\)\)/);
  assert.ok(m, 'não achei o CHECK de status na migration — o teste precisa dele pra comparar');
  return m[1].split(',').map(s => s.trim().replace(/^'|'$/g, '')).sort();
}

test('todo status aceito pelo banco tem rótulo na tela, e vice-versa', () => {
  assert.deepEqual(Object.keys(STATUS_RELATO).sort(), statusDoBanco(),
    'dados.STATUS_RELATO e o CHECK da migration precisam listar exatamente os mesmos status');
});

test('cada situação diz por ESCRITO o que aconteceu (cor não pode ser a única informação)', () => {
  for (const [k, s] of Object.entries(STATUS_RELATO)) {
    assert.ok(s.rotulo?.trim(), `${k} sem rótulo`);
    assert.ok(s.desc?.trim(), `${k} sem descrição`);
    assert.ok(s.classe?.trim(), `${k} sem classe de CSS`);
    // o rótulo tem de ter texto de verdade, não só o emoji: quem não enxerga cor (ou emoji) precisa LER
    assert.ok(/[a-zà-ú]{3,}/i.test(s.rotulo), `${k}: o rótulo "${s.rotulo}" não tem palavra nenhuma`);
  }
  // os dois estados que o usuário pediu explicitamente ("foi atendido ou ainda está aguardando")
  assert.match(STATUS_RELATO.resolvido.rotulo, /Atendido/i);
  assert.match(STATUS_RELATO.novo.rotulo, /Aguardando/i);
});

test('status desconhecido não deixa o relato sem situação na tela', () => {
  // o banco pode ganhar um status novo antes desta tabela: a tela mostra algo em vez de um espaço vazio
  assert.equal(situacaoDoRelato('um_status_que_nao_existe'), STATUS_RELATO_PADRAO);
  assert.equal(situacaoDoRelato(undefined), STATUS_RELATO_PADRAO);
  assert.equal(situacaoDoRelato('resolvido'), STATUS_RELATO.resolvido);
});

test('a migration não deixa passar status fora do vocabulário (o CHECK existe mesmo)', () => {
  const src = readFileSync(SQL, 'utf8');
  assert.match(src, /alter table public\.relatos add constraint relatos_status_valido/);
  // normaliza o que já estava gravado ANTES de criar o CHECK — sem isso um status solto derrubaria a migration
  assert.ok(src.indexOf('update public.relatos') < src.indexOf('add constraint relatos_status_valido'),
    'o UPDATE de normalização tem de vir ANTES do CHECK');
  // o INSERT continua preso a 'novo': só a manutenção muda status
  assert.match(src, /INSERT segue preso a status = 'novo'/);
});
