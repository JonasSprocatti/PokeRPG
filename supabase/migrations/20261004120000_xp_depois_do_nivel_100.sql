-- XP ganho DEPOIS do nível 100 conta na pontuação da jornada (pedido do usuário, 04/10/2026).
--
-- No teto o XP virava nada: quem chegava ao 100 não tinha mais o que ganhar jogando, e a pontuação da run
-- parava de crescer junto. Agora o resumo traz `xpExtra` (regras.xpExcedente: `exp - growth[100]`, derivado,
-- nunca um contador novo no save) e ele entra na soma com peso 0,003 — os ~30 mil de XP que separam o nível 99
-- do 100 na curva média valem ~89 pontos, quase o mesmo que os 100 de um nível de verdade.
--
-- ⚠️ Esta função é recriada por INTEIRO a cada mudança (é `create or replace`): o que vale é a última definição.
-- Mudou peso aqui, muda em `regras.PESOS_PONTOS` — `tests/schema.test.js` compara os dois lados e falha senão.
--
-- O teto de `xpExtra` é conferido em bigint ANTES do cálculo (que é em int): um número absurdo vindo de um
-- cliente adulterado estouraria o `::int` como erro de banco em vez de recusa explícita. 100 milhões de XP é
-- ordem de grandeza acima de qualquer jornada real e ainda assim cabe folgado no int.
create or replace function public.validar_jornada() returns trigger
language plpgsql set search_path = public as $$
declare
  r jsonb := new.resumo;
  n int := coalesce((r->>'nivel')::int, 0);
  cont int := greatest(coalesce((r->>'continuacoes')::int, 0), 0);
  mult numeric := case new.dificuldade when 'easy' then 1 when 'medium' then 1.2 when 'hard' then 1.5
    when 'hardcore' then 2 when 'randomizer' then 1.5 when 'roguelike' then 1.5 when 'saga' then 1.5 else null end;
  -- seguir com o mesmo Pokémon pro mapa seguinte tira 20% por vez, com piso de metade (regras.multContinuacao)
  penal numeric := least(1, greatest(0.5, power(0.8, cont)));
  -- jogar sem as vantagens das badges rende 10% a mais (regras.BONUS_SEM_VANTAGENS)
  bonus numeric := case when coalesce((r->>'semVantagens')::boolean, false) then 1.1 else 1 end;
begin
  if mult is null then raise exception 'dificuldade desconhecida: %', new.dificuldade; end if;
  if n < 1 or n > 100 then raise exception 'nível impossível: %', n; end if;
  if coalesce((r->>'alfas')::int, 0) > 90 then raise exception 'mais Alfas do que existem'; end if;
  if coalesce((r->>'gens')::int, 0) > 9 then raise exception 'mais Gens do que existem'; end if;
  if coalesce((r->>'missoes')::int, 0) > 197 then raise exception 'mais missões do que existem'; end if;
  if coalesce((r->>'xpExtra')::bigint, 0) > 100000000 then raise exception 'XP além do nível 100 fora do possível'; end if;
  if coalesce((r->>'xpExtra')::bigint, 0) > 0 and n < 100 then raise exception 'XP além do nível 100 sem estar no nível 100'; end if;
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
    + coalesce((r->>'gens')::int, 0) * 2000 + coalesce((r->>'xpExtra')::int, 0) * 0.003) * mult * penal * bonus);
  new.resumo := jsonb_set(r, '{pontuacao}', to_jsonb(new.pontuacao));
  return new;
end;
$$;

drop trigger if exists validar_jornada on public.jornadas;
create trigger validar_jornada
  before insert on public.jornadas
  for each row execute function public.validar_jornada();
