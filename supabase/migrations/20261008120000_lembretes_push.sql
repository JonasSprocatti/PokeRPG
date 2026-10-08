-- ============================================================================
-- 20261008120000_lembretes_push — lembretes que chegam com o jogo FECHADO (Web Push).
--
-- Duas tabelas e uma função:
--   push_inscricoes  → um APARELHO inscrito (endpoint + as duas chaves que o navegador dá). A mesma conta em
--                      três navegadores são três linhas; quem apaga é o jogo (⚙ Ajustes) ou a Edge Function,
--                      quando o navegador responde "este endereço morreu" (404/410).
--   lembretes        → o que vai ser dito e QUANDO. O texto chega PRONTO do jogo (js/lembretes.js): nenhuma
--                      regra de jogo vive aqui, de propósito — badge, ovo e chefe são regra do cliente, e
--                      recalculá-las em SQL seria a segunda verdade que tests/schema.test.js existe pra evitar.
--   publicar_aviso() → o único lembrete GLOBAL (📜 novidades), disparado pela conta de manutenção.
--
-- Quem entrega é supabase/functions/lembretes, chamada por um cron. Passo a passo: supabase/LIGAR-LEMBRETES.sql.
-- ============================================================================

create table if not exists public.push_inscricoes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- único: o mesmo navegador reinscrito tem de ATUALIZAR a linha, não criar a segunda (e aí push em dobro)
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);
create index if not exists push_inscricoes_user on public.push_inscricoes(user_id);

create table if not exists public.lembretes (
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Lista FECHADA de propósito. Sem ela, a chave sendo texto livre deixaria uma conta gravar dez mil linhas
  -- ("um lembrete por motivo" é a semântica, não "uma fila"). Motivo novo = coluna nova nesta lista + migration.
  chave text not null check (chave in ('volta', 'chefe', 'aviso')),
  quando timestamptz not null,
  -- teto de tamanho: isto vai pro corpo de uma notificação do sistema, onde ninguém lê 300 caracteres mesmo
  titulo text not null check (length(titulo) between 1 and 120),
  corpo text not null default '' check (length(corpo) <= 300),
  enviado_em timestamptz,
  primary key (user_id, chave)
);
-- o índice que a Edge Function usa: "o que está na hora e ainda não saiu"
create index if not exists lembretes_na_fila on public.lembretes(quando) where enviado_em is null;

alter table public.push_inscricoes enable row level security;
alter table public.lembretes enable row level security;

-- Cada um manda só nas próprias linhas. A Edge Function não passa por aqui: ela usa a chave de serviço (é ela
-- que precisa LER a inscrição de outra pessoa pra poder entregar, e nenhum jogador pode fazer isso).
drop policy if exists "dono manda na propria inscricao" on public.push_inscricoes;
create policy "dono manda na propria inscricao" on public.push_inscricoes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "dono manda nos proprios lembretes" on public.lembretes;
create policy "dono manda nos proprios lembretes" on public.lembretes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

/* ---- aviso global (📜 novidades) ----
   O único lembrete que não nasce no aparelho de quem recebe, então é o único que precisa de `security definer`:
   escreve na linha de OUTRAS pessoas. Duas travas: só admin (`perfis.admin`, protegido contra autopromoção pelo
   gatilho de 20260925090000) e só pra quem JÁ está inscrito em push — criar linha pra quem não recebe nada seria
   encher a tabela com lembretes que nunca saem.
   `quando = now()` significa "no próximo giro do cron" (até uma hora), não neste instante. */
create or replace function public.publicar_aviso(p_titulo text, p_corpo text)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not exists (select 1 from public.perfis p where p.id = auth.uid() and p.admin) then
    raise exception 'só a conta de manutenção publica aviso';
  end if;
  insert into public.lembretes (user_id, chave, quando, titulo, corpo)
  select distinct i.user_id, 'aviso', now(), p_titulo, p_corpo from public.push_inscricoes i
  on conflict (user_id, chave) do update
    set quando = now(), titulo = excluded.titulo, corpo = excluded.corpo, enviado_em = null;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.publicar_aviso(text, text) from public;
grant execute on function public.publicar_aviso(text, text) to authenticated;
