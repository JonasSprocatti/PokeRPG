/* ============ como funcionam os chefes da semana (texto de ajuda) ============
   Uma explicação só, mostrada em vários lugares (tela inicial, Arena do Chefe): `htmlComoFuncionam()` devolve um <details>
   recolhível. Os números (8 horas, 3 Revives…) vêm das constantes do jogo, então o texto não desatualiza sozinho.
   Sem DOM: só monta a string. */
import { COOLDOWN_MS, INICIO, EVENTOS, dataBR } from './evento.js';
import { MAX_REVIVES } from './mp-motor.js';
import { HALL_MAX } from './hall.js';

const horas = COOLDOWN_MS / 3600000;

export function htmlComoFuncionam({ aberto = false } = {}) {
  return `<details class="ajuda-chefes" ${aberto ? 'open' : ''}><summary>❓ Como funcionam os chefes da semana</summary>
    <div class="ajuda-corpo">
      <h5>O que é</h5>
      <p>Toda <b>segunda-feira à meia-noite</b> (horário de Brasília) entra um chefe especial: ${EVENTOS.length} chefes, um por semana, e depois do último a lista recomeça. O primeiro chegou em <b>${dataBR(INICIO)}</b>. A tela inicial mostra os próximos 3. São lutas <b>muito difíceis</b>, muito acima de um Alfa ou de um lendário.</p>
      <h5>Onde enfrentar: são 3 caminhos</h5>
      <div class="ajuda-tabela-caixa"><table class="ajuda-tabela">
        <thead><tr><th>Onde</th><th>O que precisa</th><th>O que muda</th></tr></thead>
        <tbody>
          <tr><td><b>🏟 Arena do Chefe</b><br><small>menu 🏟 Arena</small></td>
            <td>Ter Pokémon no <b>Hall da Fama</b>. <b>Não precisa</b> de run em andamento nem estar na Gen do chefe.</td>
            <td>Você leva de 1 a 3 Pokémon do Hall, com o nível que tinham. Sem itens segurados, Mega, Tera, Z-Move, Gigantamax e Revive. Prêmio: Pokémon, insígnia, título e itens de raide (sem dinheiro nem Rare Candy).</td></tr>
          <tr><td><b>Dentro de uma run</b><br><small>caixa roxa na rota final</small></td>
            <td>Jornada <b>Roguelike ou Hardcore</b>, <b>na Gen do chefe</b>, com o nível da rota final liberado.</td>
            <td>Usa a sua equipe e a sua mochila, com tudo que a run tem (itens segurados, gimmicks). Prêmio completo: dinheiro e Rare Candy também.</td></tr>
          <tr><td><b>Em grupo</b><br><small>sala do multiplayer, botão ☄</small></td>
            <td>Uma run <b>Roguelike ou Hardcore</b> do anfitrião (o chefe é o da Gen dela).</td>
            <td>O HP do chefe cresce com os jogadores, o golpe carregado atinge todos e quem cair usa Revive. O prêmio só vale para quem está numa run Roguelike/Hardcore.</td></tr>
        </tbody></table></div>
      <p class="small muted"><b>Hall da Fama:</b> o Pokémon principal de cada jornada <b>Roguelike ou Hardcore que você termina</b> (venceu, perdeu ou encerrou) entra lá com o nível que tinha (guarda os ${HALL_MAX} melhores). Só entram jornadas terminadas <b>depois</b> que o recurso existe.</p>
      <p class="small muted">Nos três caminhos valem as mesmas regras de tentativa, derrota e prêmio principal — abaixo.</p>
      <h5>Regras da luta</h5>
      <ul>
        <li><b>Uma tentativa a cada ${horas} horas</b>, contada quando a luta começa (vença ou perca). Vale para a Arena, para a run e para a sala.</li>
        <li>O chefe é <b>imune a status</b> e <b>não dá pra fugir</b>. <b>Perder não custa nada</b>: nem a jornada, nem aliados.</li>
        <li>No co-op o HP dele cresce com o número de jogadores (mas menos que proporcional), e quem ficar sem Pokémon de pé pode usar um <b>Revive</b> (até ${MAX_REVIVES} por luta) enquanto o grupo segura.</li>
      </ul>
      <h5>Mecânicas (cada chefe combina algumas)</h5>
      <ul>
        <li><b>Couraça e Ruptura</b>: com a couraça de pé o chefe leva pouco dano. Quando o estoque dela zera acontece a <b>Ruptura</b>: ele fica exposto (dano ×1,5) por 3 ações.</li>
        <li><b>Golpe carregado</b>: a cada 4 ações ele carrega um golpe devastador, com aviso. Dá pra <b>interromper</b> causando dano suficiente no mesmo turno (e ainda o expõe). Solto, atinge o time inteiro.</li>
        <li><b>Ponto fraco</b> que muda de tipo, <b>clima permanente</b>, tipos <b>anulados</b>, <b>Mundo Reverso</b>, adaptação de tipo, dreno, regeneração… o resumo de cada chefe aparece na caixa dele.</li>
      </ul>
      <h5>Prêmios</h5>
      <ul>
        <li>O <b>Pokémon do chefe</b> fica liberado na Pokédex e para começar novas jornadas, e você ganha a <b>insígnia</b> e o <b>título</b> dele (escolha uma pra mostrar ao lado do nome, na tela 👤 Conta).</li>
        <li><b>Itens de raide</b> (Cristal de Ruptura, Selo de Interrupção, Escudo Astral): só valem na luta contra o chefe, um de cada por luta. Os que sobram numa jornada que termina vão para a sua conta.</li>
        <li>Dentro de uma run também vem dinheiro e Rare Candy. O prêmio da semana só sai <b>uma vez por semana</b> por chefe; a insígnia e o Pokémon, só na primeira vitória.</li>
      </ul>
    </div></details>`;
}
