/* ============ lembretes (o texto do push) ============
   O que o jogador recebe quando o jogo está FECHADO: "o seu Pokémon está te esperando", "falta pouco pra badge",
   "o chefe da semana trocou". Aqui só se DECIDE o que dizer e quando — quem assina e entrega é a Edge Function
   (supabase/functions/lembretes), e quem grava é `notificacoes.agendarLembretes`.

   **A regra do jogo não atravessa pro servidor.** A função lá é burra de propósito: pega a linha cuja hora chegou
   e manda o título e o corpo que já vieram escritos. Isso é deliberado — badge, ovo e chefe são regras que vivem
   em `badges.js`/`ovos.js`/`evento.js`, e recalculá-las em SQL ou em Deno seria a duplicação que o `tests/schema.test.js`
   existe pra policiar. O preço: o lembrete é escrito com o que se sabia na ÚLTIMA sessão (o jogador não está
   jogando, então nada mudou mesmo) e cada sessão reescreve a linha.

   **Um lembrete de "volta" por pessoa, não um por motivo.** Três notificações no mesmo dia desinstalam o jogo;
   então os motivos competem e o mais atraente leva (ovo > badge > o parceiro parado). O chefe da semana é o
   único que anda em paralelo, porque não depende de ter jornada aberta.

   Puro (sem DOM e sem rede), testado em tests/lembretes.test.js. O único import é `MS_POR_PASSO`: o ovo anda com
   o relógio, e repetir esse número aqui seria o jogo e a notificação discordando sobre a mesma conta. */
import { MS_POR_PASSO } from './ovos.js';

export const HORAS_PARADO = 10;      // com jornada aberta: horas sem abrir o jogo pra chamar de volta
export const DIAS_SEM_RUN = 7;       // sem jornada aberta é convite, não cobrança — espera mais
export const FALTA_POUCO = 0.9;      // badge com 90% do alvo andado = "falta pouco"
const HORA_MS = 60 * 60 * 1000;
const DIA_MS = 24 * HORA_MS;

const nBR = n => Math.round(n).toLocaleString('pt-BR');
/* "25 min" / "1 h e 30 min". A hora de chegada do push é ESTIMATIVA (o cron gira de hora em hora), então o texto
   fala de quanto falta, nunca de hora marcada. Exportada porque a tela do ovo (`render.blocoOvos`) mostra a mesma
   conta: dois formatadores diriam números diferentes pro mesmo ovo. */
export const emQuantoTempo = ms => {
  const min = Math.max(1, Math.round(ms / 60000));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` e ${min % 60} min` : ''}`;
};

/* O ovo que fica pronto MAIS CEDO, e em quanto tempo — o relógio dá isso de graça (1 passo por minuto, mesmo com o
   jogo fechado), então este lembrete tem hora de verdade em vez de um prazo chutado. O teto de `PASSOS_MAX` = 400
   põe o ovo mais demorado em menos de 7 h.
   Nunca diz a ESPÉCIE: o ovo é segredo até abrir (ovos.js), e notificação é tela que o jogador não pediu — vazar
   ali seria pior que vazar no jogo. */
export function ovoQuaseChocando(ovos = []) {
  const perto = ovos
    .map(o => ({ falta: (o.alvo || 0) - (o.passos || 0) }))
    .filter(o => o.falta > 0)
    .sort((a, b) => a.falta - b.falta)[0];
  return perto ? { ...perto, ms: perto.falta * MS_POR_PASSO } : null;
}

// A badge inacabada mais perto do alvo. `oculta` entra: se falta 10%, o jogador já descobriu a badge sozinho.
export function badgeQuaseFeita(badges = []) {
  return badges
    .filter(b => !b.completo && b.alvo > 0 && b.n / b.alvo >= FALTA_POUCO)
    .sort((a, b) => b.n / b.alvo - a.n / a.alvo)[0] || null;
}

/* O corpo do lembrete de volta, do motivo mais forte pro mais fraco. `null` = não há o que dizer (ninguém
   recebe push "oi, volta"). `save` é o resumo que `notificacoes.js` monta: { nome, nivel, rota, ovos }.
   `emMs` = quando este motivo vale, contado de agora; sem ele vale o prazo de parado (10 h ou 7 dias). O ovo é o
   único com hora própria, porque é o único que ANDA SOZINHO. */
export function motivoDeVolta({ save = null, badges = [] } = {}) {
  const ovo = save && ovoQuaseChocando(save.ovos);
  // sem contagem no corpo: a entrega real depende do cron (gira de hora em hora), então um "faltam 25 min" escrito
  // agora chegaria atrasado mentindo. O número de verdade está na tela do ovo (render.blocoOvos).
  if (ovo) return {
    titulo: '🥚 O seu ovo está prestes a chocar', emMs: ovo.ms,
    corpo: 'Ele já deve estar pronto — e abre na hora em que você voltar ao jogo.'
  };
  const b = badgeQuaseFeita(badges);
  if (b) return { titulo: `🏅 Falta pouco pra badge ${b.icone || ''} ${b.nome}`.trim(), corpo: `Você está em ${nBR(b.n)} de ${nBR(b.alvo)} — mais ${nBR(b.alvo - b.n)} e ela é sua.` };
  if (save) return { titulo: `🎒 ${save.nome} está te esperando`, corpo: `Nv. ${nBR(save.nivel)}${save.rota ? `, parado em ${save.rota}` : ''}. A aventura continua quando você voltar.` };
  return null;
}

/* As linhas a gravar. `chave` é única por jogador (chave igual = sobrescreve, nunca empilha), `quando` é ISO.
   - `volta`: conta a partir de AGORA, isto é, da última vez que o jogo abriu.
   - `chefe`: a hora que o calendário do evento já define (evento.fimDaSemana) — sem jornada nenhuma envolvida.
   Sem janela de "hora boa": o ovo anda de madrugada igual, e quem dorme com ovo no ninho quer saber na hora
   (pedido do usuário, 09/10/2026, depois de três ovos chocarem de noite sem nenhum aviso). */
export function lembretesDe({ save = null, badges = [], proximoChefe = null, agora = Date.now() } = {}) {
  const fora = [];
  const { emMs, ...m } = motivoDeVolta({ save, badges }) || {};
  if (m.titulo) fora.push({ chave: 'volta', quando: new Date(agora + (emMs ?? (save ? HORAS_PARADO * HORA_MS : DIAS_SEM_RUN * DIA_MS))).toISOString(), ...m });
  if (proximoChefe?.quando > agora) fora.push({
    chave: 'chefe', quando: new Date(proximoChefe.quando).toISOString(),
    titulo: '🏆 Chefe novo da semana',
    corpo: `${proximoChefe.nome} assumiu o evento desta semana. Dá pra encarar com o time do Hall da Fama.`
  });
  return fora;
}
