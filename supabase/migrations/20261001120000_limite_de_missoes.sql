-- ---------------------------------------------------------------------------
-- validar_jornada: o teto de missões passa de 36 pra 197
-- ---------------------------------------------------------------------------
/* As missões por rota entraram (js/dados-rotas.js, gerado pelo editor de rotas): 17 globais + 20 por Gen
   (uma de espécie e uma de Alfa em cada uma das 10 rotas) × 9 Gens = 197.

   O teto é 197 e não 37 porque `S.missoesFeitas` ACUMULA quando a jornada segue pro mapa seguinte com o mesmo
   Pokémon: numa run que atravessa as 9 Gens, as 180 de rota são todas alcançáveis. Quem para numa Gen fecha no
   máximo 37 — o teto aqui é anti-fraude ("mais do que existe"), não balanceamento.

   Só esta linha muda; o resto da função é igual ao de 20260930120000_seguranca_amizade_e_pontuacao.sql, e o PESO
   de cada missão continua 120 (`PESOS_PONTOS.missoes`). `tests/schema.test.js` compara o teto com `MISSOES.length`
   e os pesos com `regras.PESOS_PONTOS` — mudou num lado, muda no outro. */
create or replace function public.validar_jornada() returns trigger
language plpgsql set search_path = public as $$
declare
  r jsonb := new.resumo;
  n int := coalesce((r->>'nivel')::int, 0);
  cont int := greatest(coalesce((r->>'continuacoes')::int, 0), 0);
  mult numeric := case new.dificuldade when 'easy' then 1 when 'medium' then 1.2 when 'hard' then 1.5
    when 'hardcore' then 2 when 'randomizer' then 1.5 when 'roguelike' then 1.5 else null end;
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
