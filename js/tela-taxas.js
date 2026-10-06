/* ============ tela: 📈 Taxas e probabilidades ============
   Tudo o que o jogo sorteia, em números, numa página só. Pedido do usuário: "demonstra as taxas, possibilidades,
   o que pode acontecer em tudo no jogo (...) tudo que puder ter explicações objetivas".

   REGRA DESTA TELA: **nenhum número é digitado aqui.** Toda porcentagem sai da constante que o sorteio usa de
   verdade (`regras.js`, `mundo.js`, `ovos.js`…). Uma tela que PROMETE uma chance é pior que uma tela que não
   existe, e número copiado à mão envelhece no primeiro ajuste de balanceamento — é o mesmo motivo de
   `tests/docs-numeros.test.js` existir pro CLAUDE.md. Quando faltava a constante (os degraus do "Explorar", os
   do crítico), ela foi EXPORTADA do lugar onde o sorteio acontece, não copiada pra cá.

   O que fica de fora de propósito: o que é exclusivo de admin (⚔ Saga, editor de rotas) e o que o jogo guarda
   como segredo — o ovo não mostra a espécie, e o que um Pokémon brilhante ganha além do brilho se descobre
   jogando. Chance de aparecer é informação; o prêmio escondido não é.
   Sem estado e sem rede: só lê constantes e desenha. */
import { G } from './estado.js';
import { $, limparTopo } from './ui.js';
import { barraTelas, rotuloVoltar } from './navegacao.js';
import {
  CHANCE_SHINY, CHANCE_ITEM_SELVAGEM, CHANCE_ESPOLIO_ITEM, DEGRAUS_CRITICO, chanceDeGrupo, CHANCE_GRUPO_MAX,
  ROTAS_SEM_GRUPO, GRUPO_MAX, tetoDoGrupo, EQUIPE_TREINADOR, chanceItemDoTreinador, orcamentoDoTreinador,
  CHANCE_ITEM_TREINADOR, bolaPorNivel, premioChefe, MULT_CHEFE, custoCentro, MULT_XP, CHANCE_QUICK_CLAW,
  CHANCE_QUICK_DRAW, BONUS_STATUS_CAPTURA, TAXA_CAPTURA_ALIADO, chancePorBalanco, FRACAO_BOLA, MAX_ALIADOS,
  AMIZADE_MAX, DIVISOR_AMIZADE_LENDARIO, CLIMA_TURNOS, TERRENO_TURNOS, TELA_TURNOS, VENTO_TURNOS, MAX_ESPINHOS,
  FATOR_ESGOTADA, MARGEM_ESGOTADA, PESOS_PONTOS, PENAL_CONTINUACAO, PENAL_MINIMO, BONUS_SEM_VANTAGENS,
  chanceOhko, MULT_HP_DYNAMAX, TURNOS_DYNAMAX, MAX_TROCAS_TREINADOR, PRECO_DISCO, AUMENTO_DISCO, valorCaptura
} from './regras.js';
import { CHANCES_EXPLORAR, CHANCE_ESCAMA, CHANCE_ITEM_EVO, CHANCE_FRUTA, CHANCE_SEGURADO, DINHEIRO_ACHADO } from './mundo.js';
import { CHANCE_OVO, MAX_OVOS, NIVEL_CHOCAR, IVS_HERDADOS, PASSOS_MIN, PASSOS_MAX, CICLOS_PSEUDO, CICLOS_LENDARIO, passosParaChocar } from './ovos.js';
import { MULT_ITEM_EVO, REVELA_DERROTADOS, MIN_POOL } from './mapas.js';
import { FELICIDADE_INICIAL, FELICIDADE_ALIADO, FELICIDADE_EVOLUCAO, FELICIDADE_MAX } from './evolucao.js';
import { CHANCE_Z_ALFA, CHANCE_Z_TURNO } from './zmove.js';
import { NIVEL_MEGA_INIMIGO, NIVEL_TERA_GMAX_INIMIGO, HP_MEGA_INIMIGO } from './mega.js';
import { MAX_ESCONDIDOS } from './esconderijo.js';
import { ITEMS, BOLAS, ITENS_DE_SELVAGEM, DIFICULDADES, DESBLOQUEIO, FIND_ITEMS, FRUTAS_ACHADAS, SEGURADOS_ACHADOS, ITENS_EVO_ACHADOS } from './dados.js';

/* Porcentagem em PT-BR (vírgula), sem zero à toa: 0.08 → "8%", 0.025 → "2,5%", 1/4096 → "0,02%". */
const pc = n => { const v = n * 100; return `${+v.toFixed(v < 1 ? 2 : v < 10 ? 1 : 0)}%`.replace('.', ','); };
const num = n => String(n).replace('.', ',');   // multiplicador em PT-BR: 1.5 → "1,5"
const ph = n => `₽${n.toLocaleString('pt-BR')}`;
const fracao = n => `1 em ${Math.round(1 / n)}`;

/* ---- pedaços derivados (contas feitas aqui porque são só apresentação) ---- */

// a curva da manada, rota a rota, num mapa de 10 rotas
const curvaGrupo = Array.from({ length: 10 }, (_, i) => `R${i + 1}: <b>${pc(chanceDeGrupo(i, 10))}</b>`).join(' · ');

// quantos Pokémon o treinador TEM, por faixa de rota, com os pesos virados em porcentagem
const faixasEquipe = EQUIPE_TREINADOR.map((f, i, arr) => {
  const de = (i ? arr[i - 1].ate + 1 : 0) + 1, ate = f.ate + 1;
  const total = Object.values(f.pesos).reduce((a, p) => a + p, 0);
  return [
    ate >= 11 ? `Rota ${de} e Santuário` : `Rotas ${de}–${ate}`,
    Object.entries(f.pesos).map(([n, p]) => `${n}: ${pc(p / total)}`).join(' · ')
  ];
});

/* O que um selvagem pode estar segurando. As 17 frutas de aperto têm peso minúsculo cada uma e virariam 17 linhas
   de ruído: as grandes saem nomeadas e o resto é somado numa linha só. Derivado da tabela, não de uma lista à mão. */
const totalSelvagem = ITENS_DE_SELVAGEM.reduce((a, e) => a + e.p, 0);
const grandesSelvagem = ITENS_DE_SELVAGEM.filter(e => e.p >= 5);
const restoSelvagem = ITENS_DE_SELVAGEM.filter(e => e.p < 5);

// dificuldades visíveis (o modo de admin não aparece pra quem joga)
const modos = Object.entries(DIFICULDADES).filter(([, d]) => !d.admin);

/* ---- as seções ---- */
// [título, descrição, linhas] — cada linha é [o que, o número, como funciona]
const SECOES = () => [
  ['🚶 Explorar', 'Um clique em “Explorar” sorteia uma coisa só. Estes são todos os resultados possíveis, e eles somam 100%.', [
    ['Treinador caçador aparece', pc(CHANCES_EXPLORAR.treinador), 'Uma batalha contra a equipe dele. Com repelente ativo continua acontecendo — repelente só espanta selvagem.'],
    ['Pokémon selvagem aparece', pc(CHANCES_EXPLORAR.selvagem), 'Sorteado no pool da rota. Com repelente ativo, vira só uma frase de ambientação.'],
    ['Você acha um item', pc(CHANCES_EXPLORAR.item), 'Qual item sai está na tabela abaixo.'],
    ['Você acha dinheiro', pc(CHANCES_EXPLORAR.dinheiro), `Entre ₽${DINHEIRO_ACHADO[0]} e ₽${DINHEIRO_ACHADO[1]}.`],
    ['Só paisagem', pc(CHANCES_EXPLORAR.nada), 'Uma frase sobre o lugar e nada acontece.'],
    ['Um passo em cada ovo', '100%', `Toda exploração anda um passo em todos os seus ovos — inclusive a que terminou em nada.`]
  ]],
  ['🎁 Qual item você acha', 'Dentro daquele achado, os degraus são sorteados em ordem: cada um disputa o que o anterior deixou passar.', [
    ['Escama do Coração', pc(CHANCE_ESCAMA), 'Relembrar um golpe antigo. Na loja ela custa ₽5.000 — achar uma é sorte, não o caminho normal.'],
    ['Item de evolução', pc(CHANCE_ITEM_EVO), `Só da 4ª rota do mapa em diante. São ${ITENS_EVO_ACHADOS.length} itens diferentes, sorteados por igual.`],
    ['Item segurado permanente', pc(CHANCE_SEGURADO), `Também só da 4ª rota em diante. São ${SEGURADOS_ACHADOS.length} possíveis.`],
    ['Fruta', pc(CHANCE_FRUTA), `Em qualquer rota. São ${FRUTAS_ACHADAS.length} frutas, então cada uma continua rara.`],
    ['Item comum', 'o resto', `Poção, antídoto, éter, item de atributo… ${FIND_ITEMS.length} entradas, com as poções repetidas pra saírem mais.`]
  ]],
  ['✨ Pokémon brilhante (shiny)', 'A taxa das Gens 6 em diante, e vale pra todo Pokémon que o jogo cria.', [
    ['Qualquer Pokémon ser brilhante', `${fracao(CHANCE_SHINY)} (${pc(CHANCE_SHINY)})`, 'Sorteado na criação: você, o selvagem da rota, o da equipe do treinador, o Alfa, o que nasce do ovo. Não há item nem corrente que melhore isso.'],
    ['🎯 Caça Shiny', 'não muda a taxa', 'Escolher uma espécie-alvo faz o sorteio da rota cair SEMPRE nela — você vê mais daquela espécie, mas cada uma tem a mesma chance de brilhar. Lendário e mítico não podem ser alvo.']
  ]],
  ['🌿 Quem aparece na rota', 'Cada rota tem um pool com um peso por espécie. A chance de uma espécie é o peso dela dividido pela soma dos pesos daquela rota — é o número que a Pokédex da rota mostra.', [
    ['Taxa de uma espécie', 'peso ÷ soma dos pesos', 'Varia por rota. A Pokédex da rota (📖 na tela de explorar) mostra a porcentagem exata de cada uma.'],
    ['Item de evolução na mochila', `peso ×${MULT_ITEM_EVO}`, 'Carregar a Maçã Doce faz o Applin aparecer o dobro naquela rota. Vale pra todo item de evolução que nomeia espécies.'],
    ['Espécies por rota', `pelo menos ${MIN_POOL}`, 'Rota que ficaria curta demais empresta espécies das rotas vizinhas de nível parecido.'],
    ['Iniciais nas rotas', '0%', 'Os 27 iniciais e as evoluções deles não aparecem no mato — só no Santuário, a 11ª rota, que abre depois de vencer os lendários do mapa.'],
    ['Pokédex da rota', `${REVELA_DERROTADOS} derrotados`, 'Nunca enfrentou: “?”. Enfrentou: silhueta. Com esse tanto de derrotados (somando todas as suas jornadas), aparece colorido e com a taxa.'],
    ['Rota esgotada (só Roguelike)', `nível > ${FATOR_ESGOTADA}× o teto da rota`, `Acima disso nada mais aparece ali — é anti-grind. A folga nunca é menor que ${MARGEM_ESGOTADA} níveis, pra rota de começo não travar antes das missões dela.`]
  ]],
  ['🐺 Manadas e matilhas', `Grupo de selvagens em qualquer modo. As ${ROTAS_SEM_GRUPO} primeiras rotas do mapa nunca têm — você começa no Nv. 5 e sozinho, e cair num grupo ali seria derrota sem decisão nenhuma.`, [
    ['Chance por rota (mapa de 10)', curvaGrupo, `Cresce até ${pc(CHANCE_GRUPO_MAX)} na última rota.`],
    ['Tamanho do grupo', `2 ou ${GRUPO_MAX}`, 'Da 4ª rota em diante; nas primeiras seria 1 ou 2, mas lá a chance é zero.'],
    ['Teto do lado inimigo', `aliados em pé + 2 (máx. ${GRUPO_MAX})`, `Sozinho você enfrenta no máximo ${tetoDoGrupo(0)}; com um aliado, ${tetoDoGrupo(1)}. Recrutar com petisco é a resposta concreta à manada.`]
  ]],
  ['🎒 Treinadores caçadores', 'Quantos Pokémon ele tem, quantos ele põe em campo ao mesmo tempo e o que eles carregam.', [
    ...faixasEquipe.map(([faixa, dist]) => [`Tamanho da equipe · ${faixa}`, dist, 'Pesos do sorteio virados em porcentagem.']),
    ['Quantos ele põe em campo', '1 a 3', `Só quem tem 6 Pokémon consegue pôr 3; os outros põem no máximo 2. E o teto do seu lado também limita: contra você sozinho, nunca mais que ${tetoDoGrupo(0)}.`],
    ['Chance de um Pokémon dele ter item', `${pc(CHANCE_ITEM_TREINADOR.min)} → ${pc(CHANCE_ITEM_TREINADOR.max)}`, `Sobe com o nível, cheia no Nv. ${CHANCE_ITEM_TREINADOR.nivelCheio}. Nv. 10: ${pc(chanceItemDoTreinador(10))} · Nv. 30: ${pc(chanceItemDoTreinador(30))} · Nv. 50: ${pc(chanceItemDoTreinador(50))} · Nv. 70+: ${pc(chanceItemDoTreinador(70))}.`],
    ['Qual item ele dá', 'orçamento pelo nível', `${ph(orcamentoDoTreinador(0))} + ₽45 por nível, e ele compra o que cabe pelo preço da loja. Nv. 10: até ${ph(orcamentoDoTreinador(10))} · Nv. 50: até ${ph(orcamentoDoTreinador(50))} · Nv. 90: até ${ph(orcamentoDoTreinador(90))}. Ele também para de comprar o que ficou barato demais pra ele.`],
    ['Trocas de Pokémon por luta', `até ${MAX_TROCAS_TREINADOR}`, 'Ele troca quando o confronto melhora bastante, ou a qualquer melhora se estiver com pouco HP.'],
    ['Prêmio ao vencer', 'soma dos níveis × 20', 'Vem todo no fim, no lugar do dinheiro por Pokémon.']
  ]],
  ['🥎 A bola do caçador', 'Ele não quer derrubar você: quer te levar. E desde 06/10 ele mira nos seus aliados também.', [
    ['Quando ele lança', `HP ≤ ${pc(FRACAO_BOLA)}`, 'Só a partir daí a bola entra na cabeça dele.'],
    ['Chance por turno, já na faixa', '60%', 'Lançar gasta a vez dele — o turno em que ele tenta é um turno em que não te ataca.'],
    ['Em quem ele mira', 'no mais fraco', `Entre você e os aliados em campo com HP ≤ ${pc(FRACAO_BOLA)}, ele escolhe quem está com a menor fração de HP.`],
    ['Bola que ele carrega', `Até o Nv. 19: ${BOLAS[bolaPorNivel(10)].nome} · até 39: ${BOLAS[bolaPorNivel(30)].nome} · 40+: ${BOLAS[bolaPorNivel(50)].nome}`, `Multiplicadores: ${Object.values(BOLAS).map(b => `${b.nome} ×${num(b.mult)}`).join(' · ')}.`],
    ['Aliado capturado', 'sai da sua equipe', 'Quem é pego sai de campo e é descontado no fim da batalha. Se você soltar dele antes do fim, ele volta e ainda participa do XP.'],
    ['Você ser capturado', 'só sem aliados em pé', 'Enquanto um aliado estiver de pé, estar na bola não encerra nada.']
  ]],
  ['🔴 A fórmula da captura', 'A mesma das Gens 3 e 4. Quanto menos HP e com status, mais fácil — e isso vale tanto pra bola do caçador quanto pra quem é capturado.', [
    ['Valor da captura (a)', '(3·HPmáx − 2·HP) × taxa × bola ÷ (3·HPmáx)', `Multiplicado pelo bônus do status. Com ${100}% do HP e Poké Ball, a de taxa 45 dá a = ${valorCaptura(100, 100, 45, 1, null)}; com 10% do HP, a = ${valorCaptura(10, 100, 45, 1, null)}.`],
    ['Captura garantida', 'a ≥ 255', 'Aí a bola nem balança: pegou.'],
    ['Senão, 4 balanços', 'cada um com a mesma chance', `a = 50 → ${pc(chancePorBalanco(50))} por balanço (${pc(chancePorBalanco(50) ** 4)} no total) · a = 100 → ${pc(chancePorBalanco(100))} (${pc(chancePorBalanco(100) ** 4)}) · a = 200 → ${pc(chancePorBalanco(200))} (${pc(chancePorBalanco(200) ** 4)}).`],
    ['Bônus de status', `×${num(BONUS_STATUS_CAPTURA.sleep)} / ×${num(BONUS_STATUS_CAPTURA.paralysis)}`, `Dormindo e congelado ×${num(BONUS_STATUS_CAPTURA.sleep)}; paralisado, queimado e envenenado ×${num(BONUS_STATUS_CAPTURA.paralysis)}.`],
    ['Taxa de um aliado', TAXA_CAPTURA_ALIADO, 'A sua sai da espécie (a da PokéAPI). A do aliado é fixa, e generosa: 45 é mais baixo que a da maioria dos comuns.']
  ]],
  ['💎 Itens com o inimigo', 'O que o selvagem pode estar segurando, e a chance de você ficar com isso.', [
    ['Selvagem segurando algum item', pc(CHANCE_ITEM_SELVAGEM), 'Vale no encontro comum e nos lacaios do Alfa. O Alfa, os lendários e o chefe da semana ficam de fora: já vêm turbinados.'],
    ['Ele deixar o item cair ao perder', pc(CHANCE_ESPOLIO_ITEM), 'De propósito bem mais baixa que a de ele ter: item de selvagem é um obstáculo na luta, não uma fonte de renda.'],
    ...grandesSelvagem.map(e => [`↳ ${ITEMS[e.id]?.name || e.id}`, pc(e.p / totalSelvagem), ITEMS[e.id]?.desc || '']),
    [`↳ As ${restoSelvagem.length} frutas de aperto (uma por tipo)`, pc(restoSelvagem.reduce((a, e) => a + e.p, 0) / totalSelvagem), 'Juntas. Cada uma corta UM golpe super efetivo pela metade.']
  ]],
  ['🥚 Ovos', `Um casal guardado no esconderijo pode deixar um ovo, e ele choca com as suas explorações. O que vai nascer é segredo até a hora.`, [
    ['Pôr um ovo', `${pc(CHANCE_OVO)} por exploração`, `Precisa de um par compatível no esconderijo e de vaga no ninho (máx. ${MAX_OVOS} ovos ao mesmo tempo).`],
    ['Par compatível', 'gênero oposto + um grupo-ovo em comum', 'Como nos jogos. Quem não tem gênero (lendário, Ditto, Magnemite) e quem é do grupo “sem ovos” não cruza.'],
    ['Passos pra chocar', `${PASSOS_MIN} a ${PASSOS_MAX} explorações`, `Pela espécie: a maioria ${passosParaChocar(20)} · pseudo-lendário ${passosParaChocar(CICLOS_PSEUDO)} · lendário ${passosParaChocar(CICLOS_LENDARIO)}.`],
    ['O filhote', `forma base da mãe, Nv. ${NIVEL_CHOCAR}`, `Herda ${IVS_HERDADOS} IVs (o melhor dos dois pais em cada um) e um golpe sorteado entre os 4 do pai. O resto é sorteado como em qualquer Pokémon.`],
    ['Vagas no esconderijo', MAX_ESCONDIDOS, 'Ovo pronto sem vaga nenhuma (equipe e esconderijo cheios) espera parado, sem estragar.']
  ]],
  ['💥 Dano e crítico', 'A fórmula é a dos jogos. Estes são os sorteios que entram nela.', [
    ['Variação de dano', '85% a 100%', 'Todo golpe rola isso. É por isso que o mesmo golpe no mesmo alvo nem sempre dá o mesmo número.'],
    ['Crítico, por degrau', DEGRAUS_CRITICO.map((p, i) => `${i}: ${p >= 1 ? '100%' : fracao(p)}`).join(' · '), 'O degrau soma golpe de alto crítico (Slash, Stone Edge…), Focus Energy, a habilidade Super Luck e itens de crítico.'],
    ['O que o crítico faz', '×1,5', 'E ignora os estágios que atrapalhariam: a sua queda de Ataque e o aumento de Defesa dele.'],
    ['STAB (golpe do seu tipo)', '×1,5', 'Com Adaptability vira ×2.'],
    ['Eficácia de tipo', '×0,25 · ×0,5 · ×1 · ×2 · ×4', 'Multiplicada pelos dois tipos do alvo.'],
    ['Queimadura no dano físico', '×0,5', 'Guts e o golpe Facade ignoram.'],
    ['Golpes de nocaute (OHKO)', `${pc(chanceOhko({ level: 50 }, { level: 50 }))} em nível igual`, `Sobe 1 ponto por nível de diferença a seu favor (Nv. 60 contra Nv. 50: ${pc(chanceOhko({ level: 60 }, { level: 50 }))}) e nunca funciona contra quem tem nível maior.`],
    ['Garra Rápida / Quick Draw', `${pc(CHANCE_QUICK_CLAW)} / ${pc(CHANCE_QUICK_DRAW)}`, 'Sorteado a cada turno: age primeiro dentro da própria prioridade, mesmo sendo mais lento. Não fura prioridade maior.'],
    ['Empate total de velocidade', '50%', 'Moeda.']
  ]],
  ['🤢 Status e condições', 'Quanto dura e o que atrapalha.', [
    ['Dormir', '2 a 4 turnos', 'Early Bird acorda no dobro da velocidade.'],
    ['Confusão', '2 a 5 turnos', 'A cada turno confuso, 1 em 3 de se machucar sozinho em vez de agir.'],
    ['Paralisia', 'até curar', '25% de perder a vez, a cada turno, e Velocidade pela metade.'],
    ['Congelado', 'até descongelar', '20% de descongelar no seu turno. Qualquer golpe de Fogo que te acerte também descongela, e no sol ninguém congela.'],
    ['Queimadura', '1/16 do HP por turno', 'Mais o ×0,5 no dano físico.'],
    ['Envenenado', '1/8 do HP por turno', 'Veneno grave (Toxic) começa em 1/16 e cresce um degrau a cada turno.'],
    ['Pontas Rochosas na entrada', '1/8 do HP × eficácia', 'Contra um Pokémon de Fogo/Gelo/Voador/Inseto chega a 1/2.'],
    ['Espinhos na entrada', `1/8 · 1/6 · 1/4`, `Por camada, até ${MAX_ESPINHOS}. Só pega quem está no chão.`],
    ['Imunidades', 'pelo tipo', 'Elétrico não paralisa, Fogo não queima, Gelo não congela, Veneno e Aço não envenenam.']
  ]],
  ['🌦 Clima, terreno e telas', 'Tudo em turnos, e o campo é compartilhado pelos dois lados.', [
    ['Clima', `${CLIMA_TURNOS} turnos`, 'Sol e chuva mexem no dano de Fogo e Água (×1,5 / ×0,5). Areia e granizo machucam quem não é imune. Algumas rotas já começam com clima próprio.'],
    ['Terreno', `${TERRENO_TURNOS} turnos`, 'Só afeta quem está no chão — quem voa ou tem Levitate fica de fora.'],
    ['Refletir / Tela de Luz / Véu da Aurora', `${TELA_TURNOS} turnos`, 'Cortam o dano recebido naquele lado. Crítico atravessa.'],
    ['Vento de Cauda', `${VENTO_TURNOS} turnos`, 'Velocidade ×2 do seu lado.'],
    ['Precisão com clima', '100% garantido', 'Trovão e Furacão na chuva, Nevasca no granizo ou na neve. No sol, Trovão e Furacão caem pra 50%.']
  ]],
  ['⭐ Experiência, dinheiro e Centro', 'De onde vem cada ₽ e cada ponto de XP.', [
    ['XP por vitória', `XP base × nível ÷ 7 × ${num(MULT_XP)}`, 'A conta dos jogos, com um ajuste pra jornada não acabar rápido demais.'],
    ['Pokémon de treinador', '×1,5', 'Como nos jogos.'],
    ['Dinheiro por selvagem', 'nível × ₽8 a ₽14', 'Por Pokémon derrubado, no fim da luta.'],
    ['Prêmio do Alfa', 'nível × 60', `Mais um Rare Candy e um item de evolução. Um Alfa Nv. 30 dá ${ph(premioChefe(30))}.`],
    ['Centro Pokémon', `₽50 + ₽15 por nível`, `Cada Pokémon que precisa de cura paga pelo próprio nível. Nv. 20: ${ph(custoCentro(20))} · Nv. 50: ${ph(custoCentro(50))}. No Fácil é de graça; no Médio cada vitória desde a última visita tira 10% (10 vitórias = grátis).`],
    ['Disco Técnico', `${ph(PRECO_DISCO)} + ${ph(AUMENTO_DISCO)} por disco usado`, 'Conta pelo que foi USADO, não comprado — senão bastava juntar dinheiro uma vez e montar o moveset perfeito.'],
    ['EVs ao derrotar', 'até 252 por atributo, 510 no total', 'Os mesmos tetos dos jogos.']
  ]],
  ['👑 Alfas, lendários e transformações', 'Os chefes e as quatro gimmicks.', [
    ['Alfa da rota', `HP ×${num(MULT_CHEFE.hp)}, demais ×${num(MULT_CHEFE.outros)}`, 'E os 6 IVs em 31. Rotas 1 a 9 têm um.'],
    ['Alfa carregando um Movimento Z', pc(CHANCE_Z_ALFA), 'Sorteado uma vez, quando a luta começa.'],
    ['Quem carrega, usar no turno', `${pc(CHANCE_Z_TURNO)} por turno`, 'Uma vez por luta, sempre num golpe de dano.'],
    ['Inimigo Mega Evoluir', `Nv. ${NIVEL_MEGA_INIMIGO}+`, `Só quem tem Mega na espécie, e só quando cai a ${pc(HP_MEGA_INIMIGO)} do HP ou menos.`],
    ['Inimigo Terastalizar ou Gigantamax', `Nv. ${NIVEL_TERA_GMAX_INIMIGO}+`, 'Uma por batalha, como pra você.'],
    ['Dynamax', `HP ×${num(MULT_HP_DYNAMAX)} por ${TURNOS_DYNAMAX} turnos`, 'Vale pros dois lados.'],
    ['Suas transformações', 'uma por batalha', 'Não gastam o turno — o Movimento Z É o turno. Conquistadas na carreira, não na jornada.']
  ]],
  ['🤝 Amizade e aliados', `Petisco é como se recruta. Máximo de ${MAX_ALIADOS} aliados andando com você.`, [
    ['Item que o tipo dele gosta', `+20 a +35 de ${AMIZADE_MAX}`, 'De 3 a 5 ofertas e ele vem com você.'],
    ['Item que ele não liga', '+0 a +5', 'Quase nada: oferecer qualquer coisa não funciona.'],
    ['Lendário e mítico', `~${DIVISOR_AMIZADE_LENDARIO}× mais devagar`, 'Aceitam petisco — é o caminho pra desbloquear eles —, mas levam mais de uma dezena de ofertas. Um ganho nunca fica em zero.'],
    ['Nível máximo de quem aceita', 'seu nível + 5', 'Impede levar um Nv. 55 da Caverna Cerúlea sendo Nv. 5.'],
    ['Ordem do aliado', '5 opções', 'À vontade, pegar leve (não derrubar quem você quer de amigo), só status, não atacar e descansar.']
  ]],
  ['🧬 Evolução', 'Nível, item, felicidade e os casos especiais.', [
    ['Felicidade inicial', `${FELICIDADE_INICIAL} de ${FELICIDADE_MAX}`, `Aliado recrutado começa em ${FELICIDADE_ALIADO}.`],
    ['Felicidade pra evoluir', FELICIDADE_EVOLUCAO, 'Sobe lutando e com itens; cai quando você desmaia.'],
    ['Evolução por nível, item e troca', 'como nos jogos', 'A árvore vem da PokéAPI ao vivo, com as condições de cada espécie (hora do dia, gênero, golpe conhecido…).'],
    ['Casos sem suporte', '19 formas', 'Evoluções que dependem de coisas que não existem aqui (girar o console, localização real). A tela avisa quando é o caso.']
  ]],
  ['🏆 Pontuação da jornada', 'Como o número final do ranking é montado. O servidor recalcula e recusa valor impossível.', [
    ...Object.entries(PESOS_PONTOS).map(([k, v]) => [({
      nivel: 'Nível final', vitorias: 'Cada vitória', treinadores: 'Cada treinador vencido', alfas: 'Cada Alfa',
      amigos: 'Cada amigo recrutado', evolucoes: 'Cada evolução', missoes: 'Cada missão', gens: 'Cada mapa vencido',
      xpExtra: 'Por ponto de XP acumulado'
    })[k] || k, `× ${num(v)}`, '']),
    ['Multiplicador do modo', modos.map(([, d]) => `${d.nome} ×${num(d.multPontos)}`).join(' · '), 'A dificuldade escolhida multiplica o total.'],
    ['Seguir com o mesmo Pokémon', `×${num(PENAL_CONTINUACAO)} por mapa`, `Continuar no mapa seguinte com o mesmo parceiro vale menos, até o piso de ×${num(PENAL_MINIMO)}. Começar do zero vale cheio.`],
    ['Sem usar vantagens', `×${num(BONUS_SEM_VANTAGENS)}`, 'Terminar a jornada sem nenhuma das vantagens de medalha.']
  ]],
  ['🎚 Os modos de dificuldade', 'O que cada um muda. O modo é escolhido na criação e não troca depois.', modos.map(([, d]) => [d.nome, `×${num(d.multPontos)} nos pontos`, d.desc])],
  ['🔓 Desbloqueios do Roguelike', 'Quanto precisa, somando todas as jornadas Roguelike, pra uma espécie virar opção inicial.', [
    ['Derrotar a espécie', `${DESBLOQUEIO.derrotados}×`, 'Conta a espécie exata, não a linha evolutiva.'],
    ['Fazer amizade', `${DESBLOQUEIO.amigos}×`, 'Recrutar com petisco.'],
    ['Evoluir PARA ela (forma do meio)', `${DESBLOQUEIO.evolucaoMeio}×`, 'Forma que ainda evolui.'],
    ['Evoluir PARA ela (forma final)', `${DESBLOQUEIO.evolucaoFinal}×`, 'Forma que não evolui mais.']
  ]],
  ['🏃 Fuga', 'Vale pro encontro selvagem; de treinador e de chefe não dá pra fugir.', [
    ['Mais rápido que ele', 'garantido', 'Velocidade igual ou maior, sempre escapa.'],
    ['Mais lento', 'cresce a cada tentativa', 'A chance sobe 30/256 por tentativa na mesma luta — insistir funciona.'],
    ['Habilidade Run Away', 'garantido', 'Escapa até do que prende.'],
    ['Preso (Magnet Pull e cia.)', 'só com Run Away', 'Nem a velocidade ajuda.']
  ]]
];

const tabela = ([titulo, desc, linhas]) => `<section class="taxas-sec">
  <h2>${titulo}</h2>
  ${desc ? `<p class="small muted">${desc}</p>` : ''}
  <table class="ranking"><tbody>
    ${linhas.map(([o, v, nota]) => `<tr><td>${o}</td><td class="pts">${v}</td><td class="small muted">${nota || ''}</td></tr>`).join('')}
  </tbody></table>
</section>`;

export function telaTaxas() {
  G.mode = 'taxas'; limparTopo();
  const secoes = SECOES();
  $('#app').innerHTML = `<main class="create">
    ${barraTelas('taxas')}
    <h1>Taxas e probabilidades.</h1>
    <p class="lead">Tudo o que o jogo sorteia, com o número que ele realmente usa. Nada aqui é estimativa: cada
      porcentagem sai da mesma constante que o sorteio lê, então esta página não tem como ficar desatualizada.</p>
    <nav class="taxas-indice">${secoes.map(([t], i) => `<a href="#taxa-${i}">${t}</a>`).join('')}</nav>
    ${secoes.map((s, i) => `<div id="taxa-${i}">${tabela(s)}</div>`).join('')}
    <p class="small muted">As taxas de aparição por espécie mudam de rota pra rota: a Pokédex da rota, no 📖 da tela
      de explorar, mostra a porcentagem exata de cada uma onde você está.</p>
    <div class="subrow" style="margin-top:22px"><button class="btn" data-act="voltar">${rotuloVoltar()}</button></div></main>`;
}
