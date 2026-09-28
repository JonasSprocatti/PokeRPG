-- Marca se a conta já viu o tour guiado (js/tutorial.js, js/tela-tutorial.js salvarTutorialVisto).
-- Só um booleano: o conteúdo do tour mora inteiro no código, nada disso precisa ir pro banco.
alter table public.perfis add column if not exists tutorial_visto boolean not null default false;
