/* ============ Edge Function: lembretes ============
   Entrega os lembretes cuja hora chegou. Chamada por um cron de hora em hora (supabase/LIGAR-LEMBRETES.sql).

   **Ela é burra de propósito.** Título e corpo chegam escritos pelo jogo (js/lembretes.js, na última sessão do
   jogador); aqui não há uma linha de regra de PokéRPG — nem badge, nem ovo, nem calendário de chefe. Se um dia
   isso mudar, passam a existir duas verdades sobre as mesmas regras, e a que roda no servidor é justamente a que
   ninguém testa (`tests/` roda no Node, sobre js/).

   O que ela decide, e só isso:
   - **no máximo UM push por jogador por giro** — três notificações no mesmo dia desinstalam o jogo;
   - **endereço morto é apagado** (404/410 = o navegador desinstalou ou limpou o site). Sem isso a tabela vira um
     cemitério que a gente tenta entregar pra sempre;
   - **403 não apaga nada**: é chave VAPID trocada, e o aparelho se reinscreve sozinho quando o jogo abrir.

   Cripto de Web Push (ECDH + HKDF + aes128gcm) é feita por biblioteca. Escrever isso à mão aqui seria ~150 linhas
   de cripto sem teste nenhum pra ganhar o quê. */
import * as webpush from 'jsr:@negrel/webpush@0.3';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const URL_SITE = 'https://www.pokerpg.com.br';
const POR_GIRO = 500;   // teto de lembretes lidos por execução; o resto sai no giro seguinte

Deno.serve(async req => {
  const servico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  // só o cron entra. `verify_jwt` sozinho não basta: ele aceita o JWT de QUALQUER jogador logado, e aí daria pra
  // mandar os lembretes de todo mundo na hora que quisesse.
  if (req.headers.get('Authorization') !== `Bearer ${servico}`) return new Response('não', { status: 401 });

  const jwk = Deno.env.get('VAPID_JWK');
  if (!jwk) return Response.json({ erro: 'VAPID_JWK não configurado' }, { status: 500 });
  const servidor = await webpush.ApplicationServer.new({
    contactInformation: `mailto:${Deno.env.get('VAPID_CONTATO') ?? 'contato@pokerpg.com.br'}`,
    vapidKeys: await webpush.importVapidKeys(JSON.parse(jwk), { extractable: false })
  });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, servico);
  const agora = new Date().toISOString();
  const { data: devidos, error } = await db.from('lembretes')
    .select('user_id, chave, titulo, corpo')
    .lte('quando', agora).is('enviado_em', null)
    .order('quando', { ascending: true }).limit(POR_GIRO);
  if (error) return Response.json({ erro: error.message }, { status: 500 });
  if (!devidos?.length) return Response.json({ enviados: 0 });

  // um por jogador: o mais antigo ganha (os outros ficam na fila e saem no próximo giro)
  const porJogador = new Map<string, typeof devidos[number]>();
  for (const l of devidos) if (!porJogador.has(l.user_id)) porJogador.set(l.user_id, l);

  const { data: inscricoes } = await db.from('push_inscricoes')
    .select('user_id, endpoint, p256dh, auth').in('user_id', [...porJogador.keys()]);

  let enviados = 0, mortos: string[] = [];
  for (const i of inscricoes ?? []) {
    const l = porJogador.get(i.user_id)!;
    const corpo = JSON.stringify({ titulo: l.titulo, corpo: l.corpo, tag: `pokerpg-${l.chave}`, url: URL_SITE });
    try {
      await servidor.subscribe({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } })
        .pushTextMessage(corpo, {});
      enviados++;
    } catch (e) {
      const status = (e as { response?: Response }).response?.status;
      if (status === 404 || status === 410) mortos.push(i.endpoint);
      else console.error('push', i.endpoint, status ?? e);
    }
  }

  // marca enviado mesmo quem não tinha aparelho inscrito: a linha ficaria eternamente "na hora", e o jogo a
  // reescreve (com `enviado_em: null`) na próxima vez que abrir — que é exatamente quando volta a valer
  for (const l of porJogador.values()) {
    await db.from('lembretes').update({ enviado_em: agora }).eq('user_id', l.user_id).eq('chave', l.chave);
  }
  if (mortos.length) await db.from('push_inscricoes').delete().in('endpoint', mortos);

  return Response.json({ enviados, jogadores: porJogador.size, apagados: mortos.length });
});
