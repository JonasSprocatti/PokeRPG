-- 20260929140000_relatos_status — o jogador acompanha o que aconteceu com o relato dele.
--
-- Até aqui `relatos.status` era texto livre (default 'novo') e a tela 🐞 Relatar mostrava o valor CRU em
-- "Seus relatos": quem relatava lia "novo" ou "lido" e não tinha como saber se o problema já tinha sido
-- corrigido. Pedido do usuário: "um campo para o usuário verificar se o relato foi atendido ou ainda está
-- aguardando".
--
-- Vocabulário fechado (o CHECK é o que impede um status inventado chegar na tela sem rótulo):
--   novo       recebido, ainda não olhado          (é o único que o INSERT aceita — ver a política de sempre)
--   lido       olhado, está na fila
--   resolvido  atendido: virou correção ou funcionalidade no jogo
--   arquivado  olhado e fechado SEM virar mudança (`resposta` explica o porquê)
--
-- `resposta` é uma nota curta de quem mantém o jogo, mostrada junto do status. Ninguém é obrigado a preencher,
-- mas um "corrigido na versão 2.73" vale mais que um rótulo sozinho.
--
-- Nada destrutivo: só acrescenta colunas e restringe valores que JÁ estão dentro do vocabulário (hoje a tabela
-- só tem 'novo' e 'lido'). O UPDATE de normalização abaixo existe pro caso de algum status solto ter entrado
-- antes deste arquivo — sem ele o ADD CONSTRAINT falharia e a migration inteira ficaria pendurada.

alter table public.relatos add column if not exists resposta text;
alter table public.relatos add column if not exists resolvido_em timestamptz;

update public.relatos
   set status = 'lido'
 where status not in ('novo', 'lido', 'resolvido', 'arquivado');

alter table public.relatos drop constraint if exists relatos_status_valido;
alter table public.relatos add constraint relatos_status_valido
  check (status in ('novo', 'lido', 'resolvido', 'arquivado'));

-- A política de leitura continua a mesma ("cada conta lê só os PRÓPRIOS relatos"): ela é por linha, então as
-- colunas novas já entram junto, sem precisar mexer nela. Quem enviou sem conta (user_id null) não tem como
-- provar que o relato é dele e continua sem ver — a tela avisa isso em vez de mostrar uma lista vazia.
-- O INSERT segue preso a status = 'novo': só quem mantém o jogo (service role, ferramentas/relatos-admin.mjs)
-- muda status, resposta e resolvido_em.
