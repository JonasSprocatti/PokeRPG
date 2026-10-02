-- ---------------------------------------------------------------------------
-- validar_jornada: aceita o modo ⚔ Saga (multiplicador 1.5)
-- ---------------------------------------------------------------------------
/* O modo Saga nasceu em 02/10/2026 (plano em docs/plano-saga.md) e `validar_jornada` recusa dificuldade que não
   conhece — `mult is null` → `raise exception`. Sem esta linha, terminar uma jornada da Saga grava a carreira
   local e FALHA na nuvem: Hall da Fama e ranking perdidos, com erro de banco na tela de fim de jogo.

   1.5 é o mesmo do Difícil e do Roguelike, e é o valor que o modo vai ter quando estiver pronto (permadeath,
   capítulo por Gen). Já entra no número final de propósito: peso de pontuação mudado depois do fato invalidaria
   as runs gravadas antes. Hoje o modo é ADMIN-ONLY (`admin: true` em `DIFICULDADES`), então ninguém mais
   consegue gravar jornada nele — o que esta migration libera é o registro, não o acesso.

   Só a linha do `mult` muda; o resto da função é igual ao de 20261001120000_limite_de_missoes.sql.
   `tests/schema.test.js` compara modo por modo com `DIFICULDADES[k].multPontos` — mudou num lado, muda no outro. */
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
    + coalesce((r->>'gens')::int, 0) * 2000) * mult * penal * bonus);
  new.resumo := jsonb_set(r, '{pontuacao}', to_jsonb(new.pontuacao));
  return new;
end;
$$;

drop trigger if exists validar_jornada on public.jornadas;
create trigger validar_jornada
  before insert on public.jornadas
  for each row execute function public.validar_jornada();
