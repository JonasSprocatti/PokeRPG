-- ============================================================================
-- 20260930120000_seguranca_amizade_e_pontuacao — 2ª auditoria de segurança (30/09/2026).
--
-- Dois furos encontrados pela segunda opinião (`/security-review`) rodada sobre o banco inteiro. Nenhum dos dois
-- é "falta de endurecimento": os dois têm caminho de exploração concreto, feito de dentro do console do
-- navegador com a chave anônima, que é pública por natureza.
--
-- (1) LER O HISTÓRICO DE QUALQUER CONTA. A política de UPDATE de `amizades` era
--         for update using (auth.uid() = para) with check (status = 'aceita')
--     O `using` olha a linha ANTIGA (sou o destinatário do pedido), mas o `with check` olha a linha NOVA e só
--     exigia o status — nada prendia `de`/`para` aos valores originais. Quem tivesse UM pedido recebido
--     reescrevia a própria linha para "amizade aceita entre `de = <vítima>` e `para = eu>`" e repetia trocando o
--     uuid, varrendo a base com uma linha só. Como `perfil_do_amigo` é SECURITY DEFINER e fura o RLS de
--     `jornadas`/`progresso` confiando nesta tabela como única autorização, isso entregava melhor pontuação,
--     nível, gens fechadas, shinies, espécie favorita e as 5 últimas runs de qualquer jogador — além de colocar
--     o atacante na lista de amigos da vítima (e portanto habilitar convite de sala para ela).
--     `check (de <> para)` e o índice único do par não impediam: o par forjado é novo e legítimo.
--     A função em si estava CORRETA (exige 'aceita' nas duas direções e usa `auth.uid()`); o furo era a tabela
--     em que ela confia.
--
-- (2) FORJAR O 1º LUGAR DO RANKING, PARA SEMPRE. `validar_jornada` existe para recusar número impossível, e
--     recusava todos — menos o expoente da penalidade:
--         penal numeric := greatest(0.5, power(0.8, coalesce((r->>'continuacoes')::int, 0)));
--     `greatest` é PISO, nunca teto, e `continuacoes` vem do `resumo` jsonb do cliente sem faixa. Com expoente
--     negativo, `power(0.8, -50) ≈ 70065`: o campo que devia TIRAR pontos multiplicava a pontuação por dezenas
--     de milhares, com todos os outros números dentro do "possível". Não é o limite (b) já aceito (inventar uma
--     jornada plausível): é fazer o gatilho ACEITAR E ASSINAR um valor impossível. E como `jornadas` não tem
--     política de update nem de delete, nem o próprio dono apagaria a linha pela API.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- (1) amizade: o destinatário só ACEITA, e o par é imutável
-- ---------------------------------------------------------------------------

/* Agora o `using` também exige que a linha esteja 'pendente' (aceitar é uma transição de uma vez, não um estado
   que se reescreve à vontade) e o `with check` volta a exigir que EU continue sendo o destinatário. */
drop policy if exists "amizade: aceitar pedido recebido" on public.amizades;
create policy "amizade: aceitar pedido recebido" on public.amizades for update
  using      (auth.uid() = para and status = 'pendente')
  with check (auth.uid() = para and status = 'aceita');

/* A política acima ainda não basta: `with check` não enxerga OLD, então nada nela compara o `para` novo com o
   antigo — dava para trocar `de` e `para` por dois uuids quaisquer desde que um deles fosse o meu. Quem prende
   as duas colunas é este gatilho, no mesmo padrão já usado para `perfis.admin` (20260925090000): pela API do
   jogo o valor antigo é reposto em silêncio; pelo SQL Editor / chave de serviço a coluna muda normalmente.
   `pedir_amizade` é SECURITY DEFINER mas roda com `auth.role()` da pessoa — e não mexe em `de`/`para` (só faz
   `set status = 'aceita'`), então repor os valores antigos não atrapalha o caminho legítimo. */
create or replace function public.congelar_par_amizade()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() in ('anon', 'authenticated') then
    new.de := old.de;
    new.para := old.para;
  end if;
  return new;
end;
$$;

drop trigger if exists congelar_par_amizade on public.amizades;
create trigger congelar_par_amizade
  before update on public.amizades
  for each row execute function public.congelar_par_amizade();

-- ---------------------------------------------------------------------------
-- (2) pontuação: a penalidade não pode virar bônus
-- ---------------------------------------------------------------------------

/* Duas mudanças, e só elas — o resto da função é igual ao de 20260923120000_base.sql:
   • `cont`: piso 0 no EXPOENTE, que é onde estava o furo (`power(0.8, -50)` ≈ 70065);
   • `least(1, …)`: teto explícito, porque é o que a regra do jogo diz — continuar a jornada TIRA pontos, nunca
     acrescenta. O piso de 0.5 continua onde estava.
   `regras.multContinuacao` (js/regras.js) ganhou o mesmo `Math.max(n, 0)` na mesma leva: o cliente não é
   confiável, então não era a vulnerabilidade, mas o CLAUDE.md manda os dois lados baterem — e
   `tests/schema.test.js` cobra a igualdade por regex (foi atualizado junto). */
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
    + coalesce((r->>'gens')::int, 0) * 2000) * mult * penal * bonus);
  new.resumo := jsonb_set(r, '{pontuacao}', to_jsonb(new.pontuacao));
  return new;
end;
$$;

drop trigger if exists validar_jornada on public.jornadas;
create trigger validar_jornada
  before insert on public.jornadas
  for each row execute function public.validar_jornada();
