-- Insígnia de evento ao lado do nome NA LISTA DE AMIGOS e NO RANKING (a da sala já vai pela presença do canal).
-- Depende de 20260925120000_badge_exibida.sql (coluna perfis.badge_exibida). Idempotente.
--
-- A insígnia só aparece se a pessoa TEM o evento no progresso dela (`progresso.dados -> 'eventos'`): o ID guardado em
-- `perfis.badge_exibida` é 'evento-<idDoEvento>' e o servidor confere se `<idDoEvento>` existe lá. Não é à prova de fraude
-- (o progresso é gravado pelo próprio jogo), mas impede o caso comum: escolher no perfil uma insígnia que nunca conquistou.

-- devolve o ID da insígnia de evento a exibir, ou null
create or replace function public.badge_exibivel(p_usuario uuid)
returns text
language sql stable security definer set search_path = public as $$
  select p.badge_exibida
  from public.perfis p
  where p.id = p_usuario
    and p.badge_exibida like 'evento-%'
    and exists (select 1 from public.progresso pr
                where pr.user_id = p.id and (pr.dados -> 'eventos') ? substr(p.badge_exibida, length('evento-') + 1))
$$;
grant execute on function public.badge_exibivel(uuid) to anon, authenticated;

-- amigos: entra a coluna badge_exibida (o tipo de retorno muda, então recria)
drop function if exists public.meus_amigos();
create or replace function public.meus_amigos()
returns table (amizade bigint, amigo uuid, apelido text, icone_id int, icone_shiny boolean, status text, recebido boolean, badge_exibida text)
language sql stable security definer set search_path = public as $$
  select a.id, p.id, p.apelido, p.icone_id, p.icone_shiny, a.status, a.para = auth.uid(), public.badge_exibivel(p.id)
  from public.amizades a
  join public.perfis p on p.id = case when a.de = auth.uid() then a.para else a.de end
  where auth.uid() in (a.de, a.para)
  order by a.status, p.apelido
$$;
grant execute on function public.meus_amigos() to authenticated;

-- ranking: idem
drop function if exists public.ranking(text, int);
create or replace function public.ranking(p_especie text default null, p_limite int default 50)
returns table (posicao bigint, apelido text, especie text, pontuacao int, nivel int, dificuldade text, terminou_em timestamptz, eu boolean, icone_id int, icone_shiny boolean, badge_exibida text)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by j.pontuacao desc, j.terminou_em), coalesce(p.apelido, 'Treinador'),
         j.especie, j.pontuacao, j.nivel, j.dificuldade, j.terminou_em, j.user_id = auth.uid(), coalesce(p.icone_id, 25), coalesce(p.icone_shiny, false),
         public.badge_exibivel(j.user_id)
  from (select distinct on (user_id) * from public.jornadas
        where p_especie is null or especie = p_especie
        order by user_id, pontuacao desc, terminou_em) j
  left join public.perfis p on p.id = j.user_id
  order by j.pontuacao desc, j.terminou_em
  limit least(greatest(p_limite, 1), 100)
$$;
grant execute on function public.ranking(text, int) to anon, authenticated;
