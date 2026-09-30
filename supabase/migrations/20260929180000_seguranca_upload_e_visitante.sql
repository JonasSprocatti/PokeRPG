-- ============================================================================
-- 20260929180000_seguranca_upload_e_visitante — dois furos de ABUSO achados na auditoria de segurança
-- (29/09/2026). Nenhum dos dois vaza dado de ninguém: os dois deixam um estranho ENCHER o projeto de graça,
-- que no plano gratuito é o jogo sair do ar.
--
-- 1) BUCKET `relatos-imagens`. A política de envio era só `bucket_id = 'relatos-imagens'`, aberta a `anon`.
--    Quem quisesse podia mandar 2 MB por requisição, num caminho qualquer, pra sempre — 500 requisições enchem
--    1 GB. Agora o caminho tem de ser o da própria pessoa e existe um teto por hora.
--
-- 2) `registrar_visitante_anonimo(p_id)`. Aceitava qualquer texto de até 40 caracteres, e a chamada é aberta a
--    `anon` (é assim que o contador histórico de quem joga sem conta funciona). Dava pra inserir linha sem fim,
--    uma por id inventado. Agora o id tem de ter a CARA do que o jogo gera (`nuvem.idJogador`): `v-` + 8
--    caracteres de base36, ou um uuid de conta.
--
-- Honestidade sobre o teto de upload: ele é um QUEBRA-MOLAS, não uma tranca. Um atacante decidido ainda sobe
-- 20 arquivos por hora (40 MB/h) sem conta nenhuma. A tranca de verdade seria exigir conta pra anexar imagem —
-- decisão de produto (o jogo promete "não precisa de conta" na tela de relatos), anotada no backlog pra o
-- usuário escolher. O teto serve pra que o abuso dê tempo de ser notado antes de custar dinheiro.
-- ============================================================================

-- ---------- 1) envio de imagem de relato ----------
/* Quantos arquivos entraram no bucket na última hora. **Precisa ser SECURITY DEFINER**: se a política contasse
   `storage.objects` direto, a contagem passaria pelo RLS do próprio papel `anon` — que não tem policy de SELECT
   nesse bucket — e daria SEMPRE 0, um teto que nunca fecha. Foi o primeiro jeito que eu escrevi; conferir isso
   é a diferença entre proteger e achar que protegeu. */
create or replace function public.relatos_imagens_na_ultima_hora()
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from storage.objects
  where bucket_id = 'relatos-imagens' and created_at > now() - interval '1 hour'
$$;
grant execute on function public.relatos_imagens_na_ultima_hora() to anon, authenticated;

/* Teto por hora. Um relato com imagem gasta 1 ou 2 envios; 20 por hora é ~10 relatos ilustrados por hora, muito
   acima do movimento real (são alguns por dia). Se algum dia apertar de verdade, é este número que sobe. */
create or replace function public.limite_imagens_relato() returns int
language sql immutable set search_path = public as $$ select 20 $$;

drop policy if exists "relato-imagem: enviar" on storage.objects;
create policy "relato-imagem: enviar" on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'relatos-imagens'
    -- o caminho é `<id da conta ou 'anonimo'>/<hora>-<aleatório>-<n>.<ext>` (nuvem.subirImagensRelato): a
    -- primeira pasta é de quem envia. Com conta, tem de ser a SUA — ninguém despeja na pasta de outro.
    and (storage.foldername(name))[1] = coalesce(auth.uid()::text, 'anonimo')
    and public.relatos_imagens_na_ultima_hora() < public.limite_imagens_relato()
  );

-- ---------- 2) contador de visitante sem conta ----------
-- o teto por hora conta linhas recentes: sem índice isso é varredura da tabela inteira a cada boot sem conta
create index if not exists visitantes_recentes on public.visitantes_anonimos (primeira_vez);

/* Mesma função de 20260928120000, com duas checagens a mais.
   FORMATO: o id é um dos dois que `nuvem.idJogador()` sabe produzir — o uuid da conta, ou `v-` + base36 curto
   guardado no navegador. A faixa é larga de propósito: `Math.random().toString(36).slice(2, 10)` às vezes sai
   com menos de 8 caracteres, e apertar aqui faria o contador perder gente de verdade, em silêncio.
   RITMO: o formato sozinho não segura ninguém (é trivial inventar `v-` seguido de lixo válido), então o que
   limita de fato é quantas linhas NOVAS entram por hora. 200 é muito acima do movimento real e transforma
   "encher a tabela" em algo que leva meses em vez de minutos.
   Nos dois casos sai sem erro: o contador é enfeite, não pode derrubar o boot de ninguém. */
create or replace function public.registrar_visitante_anonimo(p_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then return; end if;
  if p_id is null or p_id !~ '^(v-[a-z0-9]{1,16}|[0-9a-fA-F-]{36})$' then return; end if;
  if (select count(*) from public.visitantes_anonimos where primeira_vez > now() - interval '1 hour') >= 200 then return; end if;
  insert into public.visitantes_anonimos (visitante_id) values (p_id)
  on conflict (visitante_id) do nothing;
end $$;
grant execute on function public.registrar_visitante_anonimo(text) to anon, authenticated;
