-- 20261006120000_conteudo_publicado — 📦 Atualização de conteúdo pela nuvem (docs/plano-config-remota.md).
--
-- POR QUE EXISTE. O 🗺 Editor de rotas (admin) edita em rascunho e cospe um `js/dados-rotas.js` pra colar no
-- repositório: conteúdo de jogo é CÓDIGO, e só muda com commit + deploy. Pedido do usuário em 06/10/2026:
-- controle de criação e edição sem passar por deploy, e com o offline resolvido pelo CACHE (o jogador guarda o
-- pacote; sem internet joga com o que tem; com internet, atualiza).
--
-- DOIS CANAIS (escolha do usuário na mesma conversa):
--   'teste'    só a conta admin lê. É onde o 📤 Publicar grava: você joga a rota editada DE VERDADE antes de
--              qualquer outro jogador ver.
--   'estavel'  todo mundo lê, sem login. É onde o ✅ Liberar pra todos promove o pacote já testado.
-- Uma linha por canal, na mesma tabela — nenhum esquema extra, e o cliente só compara `versao`.
--
-- `versao` SÓ CRESCE, igual ao progresso permanente: o cliente ignora pacote com versão menor ou igual à que já
-- tem guardada. É o que impede uma republicação antiga voltar por cima de uma nova (e o que torna a comparação
-- barata: um número, não um diff).
--
-- Nada destrutivo: só cria tabela e políticas.

create table if not exists public.conteudo_publicado (
  canal        text primary key check (canal in ('teste', 'estavel')),
  versao       bigint not null check (versao >= 0),
  pacote       jsonb not null,
  publicado_em timestamptz not null default now(),
  publicado_por uuid references auth.users(id) on delete set null
);

alter table public.conteudo_publicado enable row level security;

-- LEITURA. 'estavel' é público e sem login de propósito: é conteúdo de jogo, e o jogador precisa dele pra jogar
-- (inclusive quem nunca criou conta). 'teste' só a conta de manutenção — senão o canal de teste não testa nada,
-- ele só vaza a edição antes da hora.
drop policy if exists "conteudo estavel e publico" on public.conteudo_publicado;
create policy "conteudo estavel e publico" on public.conteudo_publicado
  for select using (
    canal = 'estavel'
    or exists (select 1 from public.perfis p where p.id = auth.uid() and p.admin)
  );

-- ESCRITA. Só admin, nos dois canais. `perfis.admin` é protegido pelo gatilho anti-autopromoção que já existe
-- (20260925090000_perfil_admin.sql) — sem ele, "só admin" seria "só quem se declarar admin".
drop policy if exists "só admin publica conteudo" on public.conteudo_publicado;
create policy "só admin publica conteudo" on public.conteudo_publicado
  for insert with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.admin));

drop policy if exists "só admin republica conteudo" on public.conteudo_publicado;
create policy "só admin republica conteudo" on public.conteudo_publicado
  for update using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.admin))
          with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.admin));

-- Sem política de DELETE: apagar o canal 'estavel' deixaria todo mundo com o pacote velho no cache e nenhuma
-- forma de voltar. Despublicar é republicar — com o pacote de fábrica, se for o caso.
