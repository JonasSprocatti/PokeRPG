/* ============ configuração online (Supabase) ============ */
// Preencha com os dados do SEU projeto (Supabase → Project Settings → API). Passo a passo: supabase/COMO-CONFIGURAR.md
// A chave "anon" é pública por natureza (vai pro navegador de qualquer jeito); quem protege os dados são as
// políticas RLS de supabase/schema.sql. Enquanto estiver com os marcadores abaixo, o jogo roda só local (sem login).
export const SUPABASE_URL = 'https://pttbipcrqbbwhhtbsyoy.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dGJpcGNycWJid2hodGJzeW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNTQzMDUsImV4cCI6MjEwNTYzMDMwNX0.gNaQdQvoQYjB5bopsgWFtdn5VXfcDDn5JHYd9SbLseU';

/* ============ lembretes por push (Web Push / VAPID) ============ */
/* A chave PÚBLICA do par VAPID (a privada é segredo da Edge Function e nunca entra no repositório). Gere as duas
   com `node ferramentas/gerar-vapid.mjs` e siga o passo a passo de supabase/LIGAR-LEMBRETES.sql.
   Vazia = push desligado: o jogo continua avisando dentro da aba (js/notificacoes.js → notificar), só não manda
   lembrete com o jogo fechado. Trocar a chave invalida quem já estava inscrito — o envio responde 403/410, a
   função apaga a linha e o aparelho se reinscreve sozinho na próxima vez que o jogo abrir. */
export const VAPID_PUBLICA = '';

/* ============ configuração de anúncios (Google AdSense) ============ */
/* Publisher ID da conta (adsense.google.com → Conta → Informações da conta). Com ele preenchido, o script do
   Google é carregado no <head> de index.html e de toda página estática, SEMPRE — mas com o consentimento em
   "denied" por padrão (js/consent.js, Consent Mode v2): sem cookie de anúncio e sem personalização até o
   jogador aceitar no banner. Foi o que trocou em relação ao padrão antigo ("script só depois do aceite"), por
   dois motivos: a revisão do AdSense precisa encontrar o código no site, e é assim que o Google recomenda hoje.

   ⚠️ O ID aparece em TRÊS lugares que precisam concordar: aqui, no <head> de index.html (literal, porque o
   snippet tem de estar no HTML servido) e no ads.txt. Divergir não dá erro em lugar nenhum — só faz o anúncio
   não pagar. `tests/paginas.test.js` compara os três.

   Voltar a desligar tudo = trocar por 'ca-pub-XXXXXXXXXXXXXXXX' aqui, tirar os dois <script> do <head> do
   index.html e rodar `node ferramentas/gerar-paginas.mjs` (o gerador respeita o marcador sozinho). */
export const ADSENSE_CLIENT_ID = 'ca-pub-9827780756194019';

/* Unidades de anúncio ("ad slot", um número só, criado em adsense.google.com → Anúncios → Por unidade de
   anúncio). Só existem DEPOIS da conta aprovada, então hoje são marcadores e nenhum <ins> é desenhado: o site
   carrega o código do AdSense sem exibir anúncio nenhum, que é exatamente o estado necessário pra pedir a
   revisão. Preencher = o slot aparece.
   ONDE ELES ESTÃO, e por quê: `guia` fica nas páginas de conteúdo (sobre, guia e os seis capítulos), longe de
   qualquer botão; `inicio` fica no fim da tela inicial. NADA perto dos botões de batalha — clique acidental
   vira tráfego inválido, e tráfego inválido é banimento da conta, não bronca. */
export const AD_SLOT_INICIO = '';
export const AD_SLOT_GUIA = '';
