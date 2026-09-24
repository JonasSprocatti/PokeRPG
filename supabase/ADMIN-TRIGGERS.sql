-- ============================================================================
-- Ligar / desligar a proteção do `perfis.admin` — rode no SQL Editor, quando precisar.
--
-- Os gatilhos `proteger_perfis_admin` (update) e `proteger_perfis_admin_insert` (insert) impedem que a API do
-- jogo mude essa coluna. Sem eles, qualquer pessoa logada poderia rodar
--     update perfis set admin = true where id = auth.uid()
-- e se promover, porque a RLS já permite editar o PRÓPRIO perfil (é assim que apelido e ícone funcionam).
--
-- Eles NÃO atrapalham você aqui: comando rodado no SQL Editor não passa por eles (a checagem é de `auth.role()`,
-- que aqui não é anon nem authenticated). Promover e despromover continuam funcionando normalmente:
--     update public.perfis set admin = true  where id = (select id from auth.users where email = 'voce@exemplo.com');
--     update public.perfis set admin = false where id = (select id from auth.users where email = 'voce@exemplo.com');
--
-- Desligue só se precisar mesmo — por exemplo, para deixar uma ferramenta externa gravar essa coluna usando a
-- chave anônima. Enquanto estiverem desligados, QUALQUER conta logada consegue virar admin.
-- ============================================================================

-- ---- DESLIGAR a proteção ----
alter table public.perfis disable trigger proteger_perfis_admin;
alter table public.perfis disable trigger proteger_perfis_admin_insert;

-- ---- LIGAR de volta (faça isto assim que terminar) ----
-- alter table public.perfis enable trigger proteger_perfis_admin;
-- alter table public.perfis enable trigger proteger_perfis_admin_insert;

-- ---- CONFERIR o estado atual ----
-- 'O' = ligado (origin), 'D' = desligado.
-- select tgname, tgenabled from pg_trigger
-- where tgrelid = 'public.perfis'::regclass and tgname like 'proteger_perfis_admin%';

-- ---- REMOVER de vez (só se você decidir que não quer mais a proteção) ----
-- drop trigger if exists proteger_perfis_admin on public.perfis;
-- drop trigger if exists proteger_perfis_admin_insert on public.perfis;
