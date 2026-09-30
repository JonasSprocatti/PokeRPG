-- ============================================================================
-- 20260929210000_imagem_de_relato_so_com_conta — anexar print num relato passa a EXIGIR CONTA.
--
-- Decisão do usuário (29/09/2026), fechando a pendência que a auditoria de segurança deixou em aberto na
-- migration anterior (20260929180000). Lá a política ganhou um TETO POR HORA e eu fui honesto sobre o que ele
-- era: quebra-molas, não tranca. Sem conta não existe a quem amarrar o envio, então não existe limite que
-- valha — um atacante decidido continuava subindo 20 arquivos de 2 MB por hora, de graça, pra sempre.
--
-- **Arquivo NOVO de propósito**: a 20260929180000 já foi aplicada. Migration aplicada não se edita (CLAUDE.md).
--
-- O que NÃO muda: enviar relato continua sem precisar de conta — é promessa da tela 🐞 Bugs e sugestões e não
-- foi tocada. O que exige conta é o ANEXO. O lado do jogo já reflete isso em três camadas, pra que ninguém
-- descubra a regra só quando o envio falha: a tela não desenha o seletor sem conta (e diz o motivo, com botão de
-- entrar ao lado), `relatos.adicionarArquivos` recusa o Ctrl+V, e `nuvem.subirImagensRelato` devolve `null` em
-- vez de tentar — esse último é o que impede um relato guardado na FILA OFFLINE com imagem de antes desta regra
-- de ficar preso pra sempre tentando subir: o texto vai, a imagem fica de fora e a tela avisa.
-- ============================================================================

-- `anon` sai da política. Com conta, a primeira pasta do caminho tem de ser o id de quem envia
-- (`nuvem.subirImagensRelato` monta `<uid>/<hora>-<aleatório>-<n>.<ext>`): ninguém despeja na pasta de outro.
drop policy if exists "relato-imagem: enviar" on storage.objects;
create policy "relato-imagem: enviar" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'relatos-imagens'
    and (storage.foldername(name))[1] = auth.uid()::text
    -- O teto por hora FICA. Não é mais a defesa principal, é o que sobra se uma conta for usada pra abuso (ou
    -- roubada): o dono do estrago agora tem nome, mas o estrago continua custando dinheiro enquanto acontece.
    and public.relatos_imagens_na_ultima_hora() < public.limite_imagens_relato()
  );

-- A função da contagem continua precisando ser chamável por quem envia; `anon` não usa mais, então perde o acesso.
revoke execute on function public.relatos_imagens_na_ultima_hora() from anon;
