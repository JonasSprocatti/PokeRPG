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

-- Ícone do jogador (qualquer Pokémon, normal ou shiny) e código de amigo (6 caracteres, pra adicionar amigos)
alter table public.perfis add column if not exists icone_id int not null default 25 check (icone_id between 1 and 1025);
alter table public.perfis add column if not exists icone_shiny boolean not null default false;
alter table public.perfis add column if not exists codigo_amigo text unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
update public.perfis set codigo_amigo = upper(substr(md5(random()::text || id::text), 1, 6)) where codigo_amigo is null;

-- Amizades: pedido (pendente) de `de` pra `para`; `para` aceita. Um par só, em qualquer direção.
create table if not exists public.amizades (
  id bigint generated always as identity primary key,
  de uuid not null references auth.users on delete cascade default auth.uid(),
  para uuid not null references auth.users on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'aceita')),
  criado_em timestamptz not null default now(),
  check (de <> para)
);
create unique index if not exists amizades_par on public.amizades (least(de, para), greatest(de, para));
alter table public.amizades enable row level security;
drop policy if exists "amizade: ver as minhas" on public.amizades;
create policy "amizade: ver as minhas" on public.amizades for select using (auth.uid() in (de, para));
drop policy if exists "amizade: pedir" on public.amizades;
create policy "amizade: pedir" on public.amizades for insert with check (auth.uid() = de and status = 'pendente');
drop policy if exists "amizade: aceitar pedido recebido" on public.amizades;
create policy "amizade: aceitar pedido recebido" on public.amizades for update using (auth.uid() = para) with check (status = 'aceita');
drop policy if exists "amizade: desfazer" on public.amizades;
create policy "amizade: desfazer" on public.amizades for delete using (auth.uid() in (de, para));

-- Pedir amizade pelo código. Se o outro já tinha pedido, vira amizade na hora. Devolve 'pedido' ou 'aceita'.
create or replace function public.pedir_amizade(p_codigo text) returns text
language plpgsql security definer set search_path = public as $$
declare alvo uuid;
begin
  if auth.uid() is null then raise exception 'entre na conta primeiro'; end if;
  select id into alvo from perfis where codigo_amigo = upper(trim(p_codigo));
  if alvo is null then raise exception 'código de amigo não encontrado'; end if;
  if alvo = auth.uid() then raise exception 'esse é o seu próprio código'; end if;
  update amizades set status = 'aceita' where de = alvo and para = auth.uid() and status = 'pendente';
  if found then return 'aceita'; end if;
  insert into amizades (de, para) values (auth.uid(), alvo) on conflict do nothing;
  return 'pedido';
end $$;
grant execute on function public.pedir_amizade(text) to authenticated;

-- Minha lista: amigos e pedidos (recebido = true: o outro pediu, eu aceito ou recuso). Só apelido + ícone do outro.
create or replace function public.meus_amigos()
returns table (amizade bigint, amigo uuid, apelido text, icone_id int, icone_shiny boolean, status text, recebido boolean)
language sql stable security definer set search_path = public as $$
  select a.id, p.id, p.apelido, p.icone_id, p.icone_shiny, a.status, a.para = auth.uid()
  from public.amizades a
  join public.perfis p on p.id = case when a.de = auth.uid() then a.para else a.de end
  where auth.uid() in (a.de, a.para)
  order by a.status, p.apelido
$$;
grant execute on function public.meus_amigos() to authenticated;

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

-- ============ Bugs e sugestões ============
-- Qualquer um envia (com ou sem conta); cada conta lê só os próprios. Quem mantém o jogo lê tudo pelo Table Editor.
create table if not exists public.relatos (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete set null default auth.uid(),
  tipo text not null check (tipo in ('bug', 'sugestao')),
  titulo text not null check (char_length(titulo) between 3 and 120),
  texto text not null check (char_length(texto) between 5 and 4000),
  contexto jsonb,
  status text not null default 'novo',
  criado_em timestamptz not null default now()
);
alter table public.relatos enable row level security;
drop policy if exists "relato: enviar" on public.relatos;
create policy "relato: enviar" on public.relatos for insert to anon, authenticated
  with check ((user_id is null or user_id = auth.uid()) and status = 'novo' and pg_column_size(contexto) < 20000);
drop policy if exists "relato: ver os meus" on public.relatos;
create policy "relato: ver os meus" on public.relatos for select using (user_id = auth.uid());

-- ============ Ranking global ============
-- Anti-trapaça (parcial): a pontuação NÃO é confiada ao navegador. Antes de gravar, o servidor recalcula a partir
-- dos números do resumo — mesmos pesos de PESOS_PONTOS e multPontos do jogo (regras.js / dados.js; mudou lá,
-- muda aqui) — e recusa números impossíveis. Alguém ainda pode inventar uma jornada inteira plausível (a batalha
-- roda no navegador), mas não mandar uma pontuação qualquer.
create or replace function public.validar_jornada() returns trigger
language plpgsql set search_path = public as $$
declare
  r jsonb := new.resumo;
  n int := coalesce((r->>'nivel')::int, 0);
  mult numeric := case new.dificuldade when 'easy' then 1 when 'medium' then 1.2 when 'hard' then 1.5
    when 'hardcore' then 2 when 'randomizer' then 1.5 when 'roguelike' then 1.5 else null end;
begin
  if mult is null then raise exception 'dificuldade desconhecida: %', new.dificuldade; end if;
  if n < 1 or n > 100 then raise exception 'nível impossível: %', n; end if;
  if coalesce((r->>'alfas')::int, 0) > 90 then raise exception 'mais Alfas do que existem'; end if;
  if coalesce((r->>'gens')::int, 0) > 9 then raise exception 'mais Gens do que existem'; end if;
  if coalesce((r->>'missoes')::int, 0) > 36 then raise exception 'mais missões do que existem'; end if;
  if coalesce((r->>'amigos')::int, 0) > 2000 or coalesce((r->>'vitorias')::int, 0) > 100000
     or coalesce((r->>'treinadores')::int, 0) > 100000 or coalesce((r->>'evolucoes')::int, 0) > 1000 then
    raise exception 'números fora do possível';
  end if;
  new.nivel := n;
  new.especie := coalesce(r->>'especie', new.especie);
  new.pontuacao := round((n * 100
    + coalesce((r->>'vitorias')::int, 0) * 10 + coalesce((r->>'treinadores')::int, 0) * 50
    + coalesce((r->>'alfas')::int, 0) * 300 + coalesce((r->>'amigos')::int, 0) * 100
    + coalesce((r->>'evolucoes')::int, 0) * 150 + coalesce((r->>'missoes')::int, 0) * 120
    + coalesce((r->>'gens')::int, 0) * 2000) * mult);
  new.resumo := jsonb_set(r, '{pontuacao}', to_jsonb(new.pontuacao));
  return new;
end $$;
drop trigger if exists validar_jornada on public.jornadas;
create trigger validar_jornada before insert on public.jornadas for each row execute function public.validar_jornada();

-- Melhor jornada de cada jogador (uma linha por jogador). p_especie null = geral (todas as espécies).
-- SECURITY DEFINER pra enxergar as jornadas de todos, mas só devolve apelido + números (+ `eu` = é você).
drop function if exists public.ranking_especie(text, int);
drop function if exists public.ranking(text, int); -- o tipo de retorno mudou (entrou o ícone): precisa recriar
create or replace function public.ranking(p_especie text default null, p_limite int default 50)
returns table (posicao bigint, apelido text, especie text, pontuacao int, nivel int, dificuldade text, terminou_em timestamptz, eu boolean, icone_id int, icone_shiny boolean)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by j.pontuacao desc, j.terminou_em), coalesce(p.apelido, 'Treinador'),
         j.especie, j.pontuacao, j.nivel, j.dificuldade, j.terminou_em, j.user_id = auth.uid(), coalesce(p.icone_id, 25), coalesce(p.icone_shiny, false)
  from (select distinct on (user_id) * from public.jornadas
        where p_especie is null or especie = p_especie
        order by user_id, pontuacao desc, terminou_em) j
  left join public.perfis p on p.id = j.user_id
  order by j.pontuacao desc, j.terminou_em
  limit least(greatest(p_limite, 1), 100)
$$;
grant execute on function public.ranking(text, int) to anon, authenticated;

-- Espécies que já têm alguém no ranking (pro seletor), com quantos jogadores cada
create or replace function public.especies_ranqueadas()
returns table (especie text, jogadores bigint)
language sql stable security definer set search_path = public as $$
  select especie, count(distinct user_id) from public.jornadas group by especie order by 2 desc, 1
$$;
grant execute on function public.especies_ranqueadas() to anon, authenticated;
