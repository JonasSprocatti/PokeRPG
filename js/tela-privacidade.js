/* ============ tela: 🔒 Política de Privacidade ============ */
// Exigida pelo Google AdSense e pelo GDPR pra rodar anúncio (js/ads.js). Texto PRA JOGADOR, sem juridiquês
// desnecessário. Atualizar sempre que um serviço novo (nuvem, anúncio, etc.) passar a coletar algo.
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { barraTelas } from './navegacao.js';

export function telaPrivacidade() {
  G.mode = 'privacidade'; limparTopo();
  $('#app').innerHTML = `<main class="create">
    ${barraTelas('privacidade')}
    <h1>Política de Privacidade.</h1>
    <p class="lead">O PokéRPG é um projeto pessoal, sem empresa por trás. Esta página existe pra explicar, em
      português claro, o que é guardado quando você joga.</p>

    <h3 class="passo"><span>1</span> O que fica só no seu aparelho</h3>
    <p class="small">O jogo inteiro (jornada, equipe, mochila, progresso) fica salvo no <b>localStorage</b> do seu
      navegador — nunca sai daí, a menos que você crie conta e sincronize. Apagar o site do navegador apaga isso.</p>

    <h3 class="passo"><span>2</span> Se você cria conta</h3>
    <p class="small">Login por Google ou link por e-mail (via <b>Supabase</b>): guardamos e-mail, apelido, ícone
      escolhido, sua carreira (jornadas terminadas) e a jornada em andamento, pra sincronizar entre aparelhos e
      aparecer no ranking. Você pode apagar sua conta e os dados a qualquer momento pela tela 👤 Conta.</p>

    <h3 class="passo"><span>3</span> Dados de outros serviços</h3>
    <ul class="small" style="padding-left:20px">
      <li><b>PokéAPI</b> (pokeapi.co): fornece os dados de Pokémon. Não recebe nenhuma informação sua — é só leitura.</li>
      <li><b>Supabase</b>: hospeda conta, saves e ranking (item 2 acima).</li>
      <li><b>Google AdSense</b>: se e quando os anúncios estiverem ativos neste site (ver a última seção), a Google
        pode usar cookies pra mostrar anúncios — inclusive personalizados, se você aceitar.</li>
    </ul>

    <h3 class="passo"><span>4</span> Cookies e anúncios</h3>
    <p class="small">Sem anúncio ativo, o jogo não usa cookie nenhum — só localStorage (que não é cookie e não sai
      do seu aparelho). Quando os anúncios estiverem ativos, aparece um aviso perguntando se você aceita cookies
      de anúncio antes de qualquer um ser carregado; sua escolha fica salva e você pode mudar de ideia a qualquer
      hora. Sem aceitar, nenhum cookie de anúncio é usado. A Google explica como opta por anúncios menos
      personalizados em <a href="https://adssettings.google.com" target="_blank" rel="noopener">adssettings.google.com</a>.</p>

    <h3 class="passo"><span>5</span> Menores de idade</h3>
    <p class="small">O PokéRPG não é feito especificamente para crianças, mas é um jogo de Pokémon — sabemos que
      menores de idade jogam. Pra quem é identificado como menor, os anúncios (quando ativos) não são personalizados.</p>

    <h3 class="passo"><span>6</span> Dúvidas ou pedido de remoção</h3>
    <p class="small">Use a tela 🐞 Bugs e sugestões pra falar com quem mantém o jogo — inclusive pra pedir a
      remoção dos seus dados da conta.</p>
  </main>`;
}
