-- Insígnia de evento que o jogador escolhe mostrar ao lado do nome (js/nuvem.js salvarBadgeExibida, tela Conta).
-- Guarda só o ID da badge (ex.: 'evento-eternatus-eternamax'); quais badges a pessoa TEM sai do progresso dela, não daqui.
alter table public.perfis add column if not exists badge_exibida text;
