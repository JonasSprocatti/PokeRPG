-- ============================================================================
-- 20261013180000_beta_testers — testadores de modo em construção (`perfis.beta`).
--
-- Para que serve: liberar um modo marcado `admin: true` + `beta: true` no jogo (hoje, o ⚔ Saga) pra ALGUNS
-- jogadores escolhidos pela conta de manutenção, sem abrir pra todos e sem dar a eles nada de admin — nem os
-- editores, nem o painel de testes, nem o canal de teste do conteúdo. É só a chave de um modo.
--
-- Quem liga e desliga é o admin, de dentro do jogo (🌍 Editor de mundo → 📤 Publicar → 🧪 Testadores), pelo
-- CÓDIGO DE AMIGO da pessoa — as duas funções abaixo. Ninguém se promove: o gatilho repõe o valor antigo quando
-- quem pede a mudança pela API não é admin (mesmo desenho do `perfis.admin`, em 20260925090000).
--
-- Nada destrutivo: uma coluna nova com padrão `false`, um gatilho e duas funções.
-- ============================================================================

alter table public.perfis add column if not exists beta boolean not null default false;

/* Pela API (`anon` / `authenticated`), a coluna só muda se QUEM PEDE for admin. Dentro de `definir_beta`
   (security definer) `auth.uid()` continua sendo o de quem chamou — então é a mesma pergunta nos dois caminhos,
   e não há chave escondida nem variável de sessão pra alguém descobrir. Do SQL Editor (service role) muda
   livre, como o `admin`. Sem erro de propósito: a tentativa simplesmente não tem efeito. */
create or replace function public.proteger_perfis_beta()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() in ('anon', 'authenticated')
     and not exists (select 1 from public.perfis where id = auth.uid() and admin) then
    if tg_op = 'INSERT' then new.beta := false; else new.beta := old.beta; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_perfis_beta on public.perfis;
create trigger proteger_perfis_beta
  before insert or update on public.perfis
  for each row execute function public.proteger_perfis_beta();

-- Liga (ou desliga) o acesso de UMA pessoa, pelo código de amigo. Devolve o apelido dela, pra tela confirmar
-- quem foi. Só admin: pra qualquer outra conta, erro.
create or replace function public.definir_beta(p_codigo text, p_valor boolean)
returns text language plpgsql security definer set search_path = public as $$
declare alvo uuid; nome text;
begin
  if not exists (select 1 from public.perfis where id = auth.uid() and admin) then
    raise exception 'só admin';
  end if;
  select id, apelido into alvo, nome from public.perfis where codigo_amigo = upper(trim(coalesce(p_codigo, '')));
  if alvo is null then
    raise exception 'código de amigo não encontrado';
  end if;
  update public.perfis set beta = coalesce(p_valor, false) where id = alvo;
  return nome;
end $$;
revoke all on function public.definir_beta(text, boolean) from public, anon;
grant execute on function public.definir_beta(text, boolean) to authenticated;

-- Quem é testador hoje (apelido e código de amigo). Só admin; pros outros, lista vazia.
create or replace function public.listar_beta()
returns table (apelido text, codigo_amigo text)
language sql stable security definer set search_path = public as $$
  select p.apelido, p.codigo_amigo
  from public.perfis p
  where p.beta
    and exists (select 1 from public.perfis a where a.id = auth.uid() and a.admin)
  order by p.apelido;
$$;
revoke all on function public.listar_beta() from public, anon;
grant execute on function public.listar_beta() to authenticated;
