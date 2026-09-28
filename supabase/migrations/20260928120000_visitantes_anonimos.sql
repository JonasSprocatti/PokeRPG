-- ============================================================================
-- 20260928120000_visitantes_anonimos — contador HISTÓRICO de quantas pessoas já jogaram sem conta.
--
-- Pra que serve: o jogo nunca coletou nada de quem não loga (por design — ver tela 🔒 Privacidade). Esta tabela
-- é a exceção mínima: guarda só o id de visitante que o próprio jogo já gera pra multiplayer (`pokerpg-visitante`
-- no localStorage, `nuvem.idJogador()`) — nenhum dado pessoal, sem e-mail nem IP — pra dar uma contagem
-- HISTÓRICA (nunca encolhe: quem já jogou uma vez sem conta continua contando mesmo que nunca mais volte).
--
-- Isso é DIFERENTE do contador "jogando agora" (js/presenca.js): aquele é só Realtime presence, não grava nada
-- no banco. Este aqui é só a soma de quantos ids de visitante distintos já existiram — e é ADMIN-ONLY: a tela
-- do jogo nunca mostra esse número pra jogador nenhum, só pra quem tem `perfis.admin` (mesma conta de manutenção
-- do painel de testes, ver 20260925090000_perfil_admin.sql).
-- ============================================================================

create table if not exists public.visitantes_anonimos (
  visitante_id text primary key,
  primeira_vez timestamptz not null default now()
);
alter table public.visitantes_anonimos enable row level security;
-- nenhuma policy: ninguém lê/escreve direto pela API, só via as duas funções abaixo (SECURITY DEFINER)

-- Registra a PRIMEIRA vez que este id de visitante apareceu (idempotente — chamado a cada boot do jogo sem
-- conta, e repetir não muda nada). Só grava quem está de fato sem sessão: um jogador logado não conta aqui.
create or replace function public.registrar_visitante_anonimo(p_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then return; end if;
  if p_id is null or length(p_id) = 0 or length(p_id) > 40 then return; end if;
  insert into public.visitantes_anonimos (visitante_id) values (p_id)
  on conflict (visitante_id) do nothing;
end $$;
grant execute on function public.registrar_visitante_anonimo(text) to anon, authenticated;

-- Quantos visitantes distintos já registraram presença, desde sempre. Só devolve pra quem é admin — pra
-- qualquer outra conta (ou sem conta), erro em vez do número: a tela não mostra o bloco pra ninguém além de mim.
create or replace function public.contagem_visitantes_anonimos()
returns bigint language plpgsql stable security definer set search_path = public as $$
declare c bigint;
begin
  if not exists (select 1 from public.perfis where id = auth.uid() and admin) then
    raise exception 'só admin';
  end if;
  select count(*) into c from public.visitantes_anonimos;
  return c;
end $$;
grant execute on function public.contagem_visitantes_anonimos() to authenticated;
