# Login e nuvem do PokéRPG: como configurar

O jogo funciona sem isto (tudo fica só no navegador). Com isto, entra login com Google ou por link no e-mail, e a carreira e a jornada em andamento passam a ficar salvas na conta.

A Vercel continua hospedando o site. O login e o banco ficam no **Supabase** (tem plano grátis).

## 1. Criar o projeto no Supabase
1. Em https://supabase.com crie uma conta e um projeto novo (guarde a senha do banco).
2. No projeto, abra **SQL Editor → New query**, cole o conteúdo de `supabase/LIGAR-MIGRATIONS.sql` e clique em **Run**. Isso cria só a tabela de controle que a integração com o GitHub usa pra saber quais migrations já rodaram (sem ela, ela falha com `relation "supabase_migrations.schema_migrations" does not exist`).
3. Ligue a integração: **Settings → Integrations → GitHub**, conecte o repositório, *Deploy to production* na branch `main`, e **working directory `/`**. A partir daí **o banco se atualiza sozinho** a cada merge no `main` — nunca mais precisa colar SQL à mão.
   - ⚠️ O campo *working directory* pede o diretório que **contém** a pasta `supabase/`, não a pasta em si. Como ela está na raiz do repositório, o valor é `/`. Preenchendo `/supabase`, o Supabase procura `/supabase/supabase/migrations`, não acha nada e **não aplica nem avisa** — o painel fica com cara de que está tudo certo.
   - O `supabase/config.toml` precisa declarar a mesma versão do Postgres do projeto (veja com `select version();` no SQL Editor).
4. Se preferir fazer o primeiro schema na mão, cole o conteúdo de `supabase/migrations/20260923120000_base.sql` no SQL Editor e rode. É seguro: só cria o que falta e atualiza as funções, sem apagar dados.

## 2. Ligar as chaves no jogo
1. No Supabase: **Project Settings → API**.
2. Copie a **Project URL** e a chave **anon public** para `js/config.js`:
   ```js
   export const SUPABASE_URL = 'https://xxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJ...';
   ```
   A chave *anon* é pública por natureza e pode ir para o GitHub. Quem protege os dados são as regras (RLS) do `schema.sql`. **Nunca** coloque a chave *service_role* no jogo.

## 3. Dizer pro Supabase onde o jogo está
**Authentication → URL Configuration**:
- **Site URL**: o endereço da Vercel (ex.: `https://pokerpg.vercel.app`).
- **Redirect URLs**: adicione o mesmo endereço e também `http://localhost:3000` (pra testar local).

Com isso, o **login por e-mail** (link mágico) já funciona.

## 4. Login com Google (opcional)
1. Em https://console.cloud.google.com: crie um projeto → **APIs & Services → OAuth consent screen** (tipo *External*, preencha nome e e-mail).
2. **Credentials → Create credentials → OAuth client ID** → tipo *Web application*.
   - **Authorized redirect URIs**: `https://xxxx.supabase.co/auth/v1/callback` (a sua Project URL + `/auth/v1/callback`).
3. Copie o **Client ID** e o **Client secret**.
4. No Supabase: **Authentication → Providers → Google** → ligue e cole os dois.

## Sobre segurança (por que a chave pode ficar no código)
- A URL e a chave **anon** chegam ao navegador de qualquer jeito: qualquer jogador as vê na aba "Rede". Esconder do GitHub não esconde de quem abre o jogo. Elas foram feitas pra ser públicas.
- O que protege os dados é o **RLS** do `schema.sql`: cada conta só lê e grava as próprias jornadas e o próprio save; o ranking só devolve apelido e números.
- A chave perigosa é a **service_role**, que ignora o RLS. Ela nunca vai pro jogo.
- Contra abuso de cadastro: em **Authentication → Settings**, deixe os limites de envio de e-mail e, se quiser, ligue o **captcha**.
- Pontuação é calculada no navegador, então dá pra alguém enviar uma pontuação falsa pro ranking. Um ranking à prova de trapaça precisaria validar no servidor (fica pra etapa do ranking).

## 5. Testar
1. `python -m http.server 3000` na pasta do jogo → http://localhost:3000.
2. O botão **👤 Entrar** aparece no topo (se não aparece, `js/config.js` ainda está com os marcadores).
3. Entre, encerre uma jornada, confira **📊 Carreira**. No Supabase, **Table Editor → jornadas** deve ter a linha.
4. Comece uma jornada, jogue um pouco, abra o jogo em outro navegador e entre na mesma conta: ele oferece continuar a jornada.
