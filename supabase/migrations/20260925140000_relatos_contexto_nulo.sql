-- Corrige o envio de SUGESTÕES na tela 🐞 Bugs e sugestões:
--   "new row violates row-level security policy for table relatos"
-- A política de insert exigia `pg_column_size(contexto) < 20000`. Sugestão não anexa contexto técnico (só o bug anexa), então
-- `contexto` é NULL, `pg_column_size(NULL)` é NULL, `NULL < 20000` é NULL — e um `with check` que dá NULL conta como FALHA.
-- Com o coalesce, contexto vazio vale 0 bytes e passa. Idempotente.
drop policy if exists "relato: enviar" on public.relatos;
create policy "relato: enviar" on public.relatos for insert to anon, authenticated
  with check ((user_id is null or user_id = auth.uid()) and status = 'novo' and coalesce(pg_column_size(contexto), 0) < 20000);
