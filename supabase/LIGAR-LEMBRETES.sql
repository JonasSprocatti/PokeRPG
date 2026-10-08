-- ============================================================================
-- LIGAR-LEMBRETES — os 3 passos à mão dos lembretes por push. Rode UMA vez.
--
-- A migration (20261008120000_lembretes_push.sql) cria as tabelas sozinha pela integração do GitHub. O que SÓ dá
-- pra fazer à mão é o que depende de chave e de extensão: as chaves VAPID, o deploy da função e o cron. Enquanto
-- nada disto estiver feito, o jogo funciona igual — só sem lembrete com o jogo fechado (js/config.js:VAPID_PUBLICA
-- vazia desliga a parte de push inteira, e as notificações dentro da aba continuam).
--
-- ---------------------------------------------------------------------------
-- PASSO 1 — as chaves (no seu computador)
--     node ferramentas/gerar-vapid.mjs
-- Cole a VAPID_PUBLICA em js/config.js (pode commitar: é pública) e guarde o JSON — ele tem a chave PRIVADA e
-- NUNCA entra no repositório. No painel: Edge Functions → Secrets → VAPID_JWK = aquele JSON numa linha.
-- (Opcional: VAPID_CONTATO = um e-mail seu.)
--
-- PASSO 2 — a função
--     supabase functions deploy lembretes
-- Ela já lê SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sozinha (o Supabase injeta as duas).
--
-- PASSO 3 — o cron (rode o SQL abaixo aqui no SQL Editor, trocando as duas marcas)
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- De hora em hora, no minuto 7 (fora do minuto cheio, onde todo cron do mundo acorda junto). A função é quem
-- decide o que está na hora — girar mais vezes não manda mais push, só confere mais vezes.
-- ⚠️ A chave de serviço vai literal aqui dentro. Este arquivo, depois de preenchido, NÃO volta pro repositório.
select cron.schedule('pokerpg-lembretes', '7 * * * *', $$
  select net.http_post(
    url := 'https://SEU-PROJETO.supabase.co/functions/v1/lembretes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer SUA-SERVICE-ROLE-KEY'
    )
  );
$$);

-- Conferir / desligar:
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 10;
--   select cron.unschedule('pokerpg-lembretes');

-- ---------------------------------------------------------------------------
-- Aviso global (📜 novidades): sai do 🧰 Editor de conteúdo, com a conta de manutenção. Dá pra mandar daqui
-- também — mas pelo editor é melhor, porque ele mostra quantas pessoas receberam:
--   select public.publicar_aviso('📜 Novidades no PokéRPG', 'Chocar ovo agora dá badge. Vem ver.');
-- ============================================================================
