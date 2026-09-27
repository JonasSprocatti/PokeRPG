/* ============ configuração online (Supabase) ============ */
// Preencha com os dados do SEU projeto (Supabase → Project Settings → API). Passo a passo: supabase/COMO-CONFIGURAR.md
// A chave "anon" é pública por natureza (vai pro navegador de qualquer jeito); quem protege os dados são as
// políticas RLS de supabase/schema.sql. Enquanto estiver com os marcadores abaixo, o jogo roda só local (sem login).
export const SUPABASE_URL = 'https://pttbipcrqbbwhhtbsyoy.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dGJpcGNycWJid2hodGJzeW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNTQzMDUsImV4cCI6MjEwNTYzMDMwNX0.gNaQdQvoQYjB5bopsgWFtdn5VXfcDDn5JHYd9SbLseU';

/* ============ configuração de anúncios (Google AdSense) ============ */
// Preencha com o Publisher ID de DEPOIS que a conta AdSense estiver aprovada (formato "ca-pub-xxxxxxxxxxxxxxxx",
// em adsense.google.com → Conta → Informações da conta). Enquanto estiver com o marcador abaixo, js/ads.js não
// carrega o script do Google nem mostra nenhum slot — mesmo padrão do Supabase acima: marcador = jogo sem essa
// parte, sem quebrar nada. O jogo NUNCA carrega o script de anúncio antes de o jogador aceitar no banner de
// cookies (js/ads.js pedirConsentimento) — é o que a política de consentimento da UE (GDPR) exige.
export const ADSENSE_CLIENT_ID = 'ca-pub-XXXXXXXXXXXXXXXX';
