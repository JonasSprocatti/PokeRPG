-- PokéRPG — banco no Supabase. Rodar UMA vez no SQL Editor do projeto (é idempotente: pode rodar de novo).
-- Toda tabela tem RLS: cada conta só lê/grava o que é dela. O ranking público sai por uma função que devolve
-- só apelido + números (nada de e-mail).

-- Perfil (apelido que aparece no ranking)
create table if not exists public.perfis (
  id uuid primary key references auth.users on delete cascade,
  apelido text not null default 'Treinador' check (char_length(apelido) between 1 and 20),
  criado_em timestamptz not null default now()
);
alter table public.perfis enable row level security;
drop policy if exists "perfil: ler o próprio" on public.perfis;
create policy "perfil: ler o próprio" on public.perfis for select using (auth.uid() = id);
drop policy if exists "perfil: criar o próprio" on public.perfis;
create policy "perfil: criar o próprio" on public.perfis for insert with check (auth.uid() = id);
drop policy if exists "perfil: editar o próprio" on public.perfis;
create policy "perfil: editar o próprio" on public.perfis for update using (auth.uid() = id) with check (auth.uid() = id);

-- Jornadas terminadas (a carreira é calculada delas no jogo). `id` vem do jogo (texto: uuid ou id antigo migrado).
create table if not exists public.jornadas (
  id text primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  especie text not null,
  dificuldade text not null,
  pontuacao integer not null default 0,
  nivel integer not null default 1,
  resumo jsonb not null,
  terminou_em timestamptz not null default now()
);
create index if not exists jornadas_user on public.jornadas (user_id);
create index if not exists jornadas_ranking on public.jornadas (especie, pontuacao desc);
alter table public.jornadas enable row level security;
drop policy if exists "jornada: ler as próprias" on public.jornadas;
create policy "jornada: ler as próprias" on public.jornadas for select using (auth.uid() = user_id);
drop policy if exists "jornada: gravar as próprias" on public.jornadas;
create policy "jornada: gravar as próprias" on public.jornadas for insert with check (auth.uid() = user_id);
-- sem update/delete: jornada terminada não muda

-- Jornada em andamento (uma por conta) — é o que deixa continuar em outro aparelho
create table if not exists public.saves (
  user_id uuid primary key references auth.users on delete cascade default auth.uid(),
  jornada_id text not null,
  dados jsonb not null,
  atualizado_em timestamptz not null default now()
);
alter table public.saves enable row level security;
drop policy if exists "save: tudo no próprio" on public.saves;
create policy "save: tudo no próprio" on public.saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Ranking por espécie (pro ranking global; a tela vem depois): melhor jornada de cada jogador naquela espécie.
-- SECURITY DEFINER pra enxergar as jornadas de todos, mas só devolve apelido + números.
create or replace function public.ranking_especie(p_especie text, p_limite int default 20)
returns table (apelido text, pontuacao int, nivel int, dificuldade text, terminou_em timestamptz)
language sql stable security definer set search_path = public as $$
  select coalesce(p.apelido, 'Treinador'), j.pontuacao, j.nivel, j.dificuldade, j.terminou_em
  from (select distinct on (user_id) * from public.jornadas where especie = p_especie order by user_id, pontuacao desc) j
  left join public.perfis p on p.id = j.user_id
  order by j.pontuacao desc
  limit least(greatest(p_limite, 1), 100)
$$;
grant execute on function public.ranking_especie(text, int) to anon, authenticated;
