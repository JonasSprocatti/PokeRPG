-- Perfil de um amigo (tela "Ver perfil" na lista de amigos): ícone, insígnias, números das jornadas e as últimas runs.
-- Depende de 20260925120000_badge_exibida.sql e 20260925130000_badge_nas_listas.sql (badge_exibivel). Idempotente.
--
-- PRIVACIDADE: só devolve dados de quem é AMIGO (amizade aceita) de quem chama, ou do próprio. Não devolve e-mail, código de amigo,
-- mochila nem nada que dê pra usar contra a pessoa: só o que ela já mostra no jogo (apelido, ícone, insígnia) e os resultados das
-- jornadas terminadas. SECURITY DEFINER porque as tabelas jornadas/progresso só são legíveis pelo dono (RLS).
create or replace function public.perfil_do_amigo(p_amigo uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if auth.uid() is null then raise exception 'entre na conta primeiro'; end if;
  if p_amigo is distinct from auth.uid() and not exists (
       select 1 from public.amizades a
       where a.status = 'aceita' and ((a.de = auth.uid() and a.para = p_amigo) or (a.para = auth.uid() and a.de = p_amigo))
     ) then
    raise exception 'só dá pra ver o perfil de um amigo';
  end if;

  select jsonb_build_object(
    'id', p.id, 'apelido', p.apelido, 'icone_id', p.icone_id, 'icone_shiny', p.icone_shiny, 'criado_em', p.criado_em,
    'badge_exibida', public.badge_exibivel(p.id),
    -- ids dos chefes semanais que ela derrotou (a insígnia de cada um é 'evento-<id>')
    'eventos', coalesce((select jsonb_agg(k) from public.progresso pr, jsonb_object_keys(coalesce(pr.dados -> 'eventos', '{}'::jsonb)) k
                         where pr.user_id = p.id), '[]'::jsonb),
    'especies_desbloqueadas', coalesce((select count(*) from public.progresso pr, jsonb_object_keys(coalesce(pr.dados -> 'especies', '{}'::jsonb)) e
                                        where pr.user_id = p.id), 0),
    'stats', (select jsonb_build_object(
        'jornadas', count(*),
        'melhor_pontuacao', coalesce(max(j.pontuacao), 0),
        'maior_nivel', coalesce(max(j.nivel), 0),
        'vitorias', count(*) filter (where j.resumo ->> 'motivo' = 'venceu' or coalesce(nullif(j.resumo ->> 'genVencida', ''), '0') <> '0'),
        'gens_fechadas', count(distinct j.resumo ->> 'genVencida') filter (where coalesce(nullif(j.resumo ->> 'genVencida', ''), '0') <> '0'),
        'shinies', count(*) filter (where j.resumo ->> 'shiny' = 'true'),
        'derrotados', coalesce(sum(nullif(j.resumo ->> 'derrotados', '')::int), 0),
        'especie_favorita', (select j2.especie from public.jornadas j2 where j2.user_id = p.id group by j2.especie order by count(*) desc, j2.especie limit 1))
      from public.jornadas j where j.user_id = p.id),
    'ultimas', coalesce((select jsonb_agg(x order by (x ->> 'terminou_em') desc) from (
        select jsonb_build_object('especie', j.especie, 'especie_final', j.resumo ->> 'especieFinal', 'nivel', j.nivel, 'dificuldade', j.dificuldade,
                                  'pontuacao', j.pontuacao, 'terminou_em', j.terminou_em, 'motivo', j.resumo ->> 'motivo',
                                  'gen_vencida', j.resumo ->> 'genVencida', 'shiny', j.resumo ->> 'shiny',
                                  'poke_id', j.resumo -> 'registro' -> 'ids' ->> j.especie) as x
        from public.jornadas j where j.user_id = p.id order by j.terminou_em desc limit 5) u), '[]'::jsonb)
  ) into r
  from public.perfis p where p.id = p_amigo;

  return r;
end $$;
grant execute on function public.perfil_do_amigo(uuid) to authenticated;
