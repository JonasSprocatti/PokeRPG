-- ============================================================================
-- 20260924090000_teste_integracao — tabela DESCARTÁVEL, só pra confirmar com os olhos que a integração do
-- GitHub com o Supabase está aplicando as migrations sozinha.
--
-- Como validar: depois do merge no `main`, abra o painel do Supabase → **Table Editor** → tabela
-- `teste_integracao`. Se ela existir e tiver uma linha com a data de hoje, o caminho inteiro funcionou:
-- commit → GitHub → Supabase → banco. (O erro `relation "supabase_migrations.schema_migrations" does not exist`
-- some quando `supabase/LIGAR-MIGRATIONS.sql` tiver sido rodado uma vez no SQL Editor.)
--
-- PODE APAGAR quando terminar de conferir. O jogo não usa esta tabela em lugar nenhum — apagar não quebra nada:
--     drop table if exists public.teste_integracao;
-- (o certo é apagar por uma migration NOVA, não editando esta, que já terá rodado)
-- ============================================================================

create table if not exists public.teste_integracao (
  id bigint generated always as identity primary key,
  o_que text not null,
  aplicada_em timestamptz not null default now()
);

-- RLS ligada como em toda tabela do projeto. Aqui não há dado de ninguém: é um recado, e qualquer um pode ler.
alter table public.teste_integracao enable row level security;
drop policy if exists "teste: todo mundo lê" on public.teste_integracao;
create policy "teste: todo mundo lê" on public.teste_integracao for select using (true);

-- a linha só entra uma vez, mesmo se a migration rodar de novo (o arquivo inteiro é idempotente, como os outros)
insert into public.teste_integracao (o_que)
select 'Deploy automático funcionando: esta linha veio de supabase/migrations/ pelo merge no main.'
where not exists (select 1 from public.teste_integracao);
