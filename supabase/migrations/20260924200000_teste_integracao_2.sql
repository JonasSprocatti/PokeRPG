-- ============================================================================
-- 20260924200000_teste_integracao_2 — segunda tabela DESCARTÁVEL de verificação.
--
-- A primeira (20260923120000_teste_integracao) não apareceu no banco, e há duas explicações possíveis:
--   (a) a integração do GitHub nunca chegou a rodar (falta a tabela de controle: rode uma vez, no SQL Editor,
--       o arquivo supabase/LIGAR-MIGRATIONS.sql); ou
--   (b) ela rodou mas marcou as migrations como aplicadas sem executá-las.
-- Esta aqui separa os dois casos: é um arquivo NOVO, com carimbo novo, então nenhum registro anterior de
-- "já apliquei isso" vale pra ela. Se esta tabela aparecer, o caminho commit → GitHub → Supabase está de pé.
--
-- Como conferir: painel do Supabase → Table Editor → `teste_integracao_2`. Deve ter UMA linha, com a data.
-- Ou, no SQL Editor:  select * from public.teste_integracao_2;
--
-- PODE APAGAR quando terminar de conferir — o jogo não usa esta tabela:
--     drop table if exists public.teste_integracao_2;
-- ============================================================================

create table if not exists public.teste_integracao_2 (
  id bigint generated always as identity primary key,
  o_que text not null,
  aplicada_em timestamptz not null default now()
);

alter table public.teste_integracao_2 enable row level security;
drop policy if exists "teste2: todo mundo lê" on public.teste_integracao_2;
create policy "teste2: todo mundo lê" on public.teste_integracao_2 for select using (true);

insert into public.teste_integracao_2 (o_que)
select 'Deploy automatico do banco funcionando (migration 20260924200000).'
where not exists (select 1 from public.teste_integracao_2);

-- Rede de segurança: se a PRIMEIRA migration de teste não tiver rodado, ela é criada aqui também. Assim, se você
-- vir só esta tabela e não a outra, a diferença já conta a história (a primeira foi pulada, não falhou).
create table if not exists public.teste_integracao (
  id bigint generated always as identity primary key,
  o_que text not null,
  aplicada_em timestamptz not null default now()
);
alter table public.teste_integracao enable row level security;
drop policy if exists "teste: todo mundo lê" on public.teste_integracao;
create policy "teste: todo mundo lê" on public.teste_integracao for select using (true);
