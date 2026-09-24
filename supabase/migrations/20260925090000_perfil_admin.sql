-- ============================================================================
-- 20260925090000_perfil_admin — marca de conta de manutenção (`perfis.admin`).
--
-- Para que serve: liberar o painel de testes do jogo (⚙ Ajustes → 🧪 Testes, js/dev.js), que concede Megas e
-- espécies sem precisar jogar 1.000 batalhas para validar uma mecânica.
--
-- **O gatilho é o ponto importante.** Sem ele, qualquer pessoa logada poderia fazer
--     update perfis set admin = true where id = auth.uid()
-- pela API pública (a política de RLS já deixa cada um editar o PRÓPRIO perfil, e é assim que apelido e ícone
-- funcionam) — e se promoveria sozinha. O gatilho ignora qualquer tentativa de mudar essa coluna vinda da API,
-- então a promoção só acontece aqui, no SQL Editor, com a chave de serviço.
--
-- Virar admin (rode UMA vez, trocando o e-mail):
--     update public.perfis set admin = true
--     where id = (select id from auth.users where email = 'voce@exemplo.com');
-- ============================================================================

alter table public.perfis add column if not exists admin boolean not null default false;

/* `auth.role()` é 'anon' ou 'authenticated' quando a requisição vem da API do jogo, e algo diferente
   (postgres / service_role) quando vem do SQL Editor ou de uma chave de serviço. A coluna só muda no segundo
   caso: no primeiro, o valor antigo é reposto em silêncio — sem erro, porque o objetivo é que a tentativa
   simplesmente não tenha efeito, e não avisar a quem tentou que o campo existe. */
create or replace function public.proteger_perfis_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() in ('anon', 'authenticated') then
    new.admin := old.admin;
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_perfis_admin on public.perfis;
create trigger proteger_perfis_admin
  before update on public.perfis
  for each row execute function public.proteger_perfis_admin();

/* Insert também: um perfil não pode NASCER admin. O jogo cria o próprio perfil no primeiro login
   (nuvem.sincronizar), e sem isto daria pra mandar `admin: true` junto nesse insert. */
create or replace function public.proteger_perfis_admin_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() in ('anon', 'authenticated') then
    new.admin := false;
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_perfis_admin_insert on public.perfis;
create trigger proteger_perfis_admin_insert
  before insert on public.perfis
  for each row execute function public.proteger_perfis_admin_insert();
