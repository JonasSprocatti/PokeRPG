-- Imagens nos relatos de bugs e sugestões (até 2, de até 2 MB cada — o tamanho de 2 prints de celular ou de PC).
-- Os arquivos ficam no bucket PRIVADO `relatos-imagens` (quem mantém o jogo vê em Storage no painel); a linha do relato
-- guarda só os caminhos, em `relatos.imagens`. Idempotente.

-- 1) o bucket: privado, 2 MB por arquivo, só PNG/JPG/WebP (o navegador já comprime antes de enviar)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('relatos-imagens', 'relatos-imagens', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

-- 2) qualquer um (com ou sem conta) envia pro bucket, como já pode enviar o relato; ninguém lê/apaga pelo jogo
drop policy if exists "relato-imagem: enviar" on storage.objects;
create policy "relato-imagem: enviar" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'relatos-imagens');

-- 3) os caminhos no relato (no máximo 2). A política de insert do relato continua a mesma, só refeita aqui por segurança
alter table public.relatos add column if not exists imagens text[] not null default '{}';
alter table public.relatos drop constraint if exists relatos_imagens_max;
alter table public.relatos add constraint relatos_imagens_max check (coalesce(array_length(imagens, 1), 0) <= 2);

drop policy if exists "relato: enviar" on public.relatos;
create policy "relato: enviar" on public.relatos for insert to anon, authenticated
  with check ((user_id is null or user_id = auth.uid()) and status = 'novo' and coalesce(pg_column_size(contexto), 0) < 20000);
