-- ============================================================================
-- 20260924230000_remove_tabelas_de_teste — tira as duas tabelas que serviram só pra provar que o deploy
-- automático do banco funciona. Elas cumpriram o papel: apareceram no banco depois que o `working directory`
-- da integração foi corrigido para `/` e o BOM saiu do config.toml.
--
-- Esta migration é, ela própria, o último teste do caminho: se as tabelas SUMIREM do Table Editor, o ciclo
-- commit → GitHub → Supabase está fechado nos dois sentidos (criar e alterar).
--
-- Seguro: nenhuma das duas é usada pelo jogo em lugar nenhum. Dado de jogador não é tocado.
-- ============================================================================

drop table if exists public.teste_integracao;
drop table if exists public.teste_integracao_2;
