-- ============================================================================
-- RODE ESTE ARQUIVO UMA VEZ, à mão, no SQL Editor do Supabase.
--
-- Por que existe: a integração do GitHub com o Supabase aplica as migrations de `supabase/migrations/` e anota
-- quais já rodaram numa tabela de controle própria (`supabase_migrations.schema_migrations`). Projeto criado
-- direto pelo SQL Editor — como foi o nosso — nunca teve essa tabela, e a integração falha com:
--
--     relation "supabase_migrations.schema_migrations" does not exist
--
-- É um problema de ovo e galinha: ela precisa da tabela pra saber o que aplicar, e não cria a tabela sozinha.
-- Este arquivo resolve isso. Depois dele, nunca mais precisa mexer em SQL à mão: é só fazer merge no `main`.
--
-- NÃO apaga nada e não mexe em dado de jogador: só cria a tabela de controle, se ela não existir.
-- ============================================================================

create schema if not exists supabase_migrations;

create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);

-- Deixamos a tabela VAZIA de propósito: assim a primeira migration (20260923120000_base.sql) é aplicada pela
-- integração e passa a constar como aplicada. Ela é idempotente de ponta a ponta, então rodar num banco que já
-- tem as tabelas não muda nada — e traz junto o que ainda faltava (a tabela `progresso` e as duas mudanças na
-- função `validar_jornada`).
--
-- Se algum dia você preferir marcar uma migration como "já aplicada" sem rodá-la, é isto:
--   insert into supabase_migrations.schema_migrations (version, name) values ('20260923120000', 'base');
