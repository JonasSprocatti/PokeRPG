/* Semeia js/dados-rotas.js com as missões por rota das 9 Gens (a proposta de docs/missoes-por-rota.md, com as
   quantidades DOBRADAS a pedido do usuário). Rodar na raiz: `node ferramentas/semear-rotas.mjs`.

   Depois desta primeira vez, quem gera o arquivo é o **editor dentro do jogo** (js/tela-editor-rotas.js → botão
   "📋 Copiar o arquivo"). Este script fica como registro auditável de onde a semente veio: a tabela abaixo é
   curta o suficiente pra revisar de uma olhada, e 198 entradas escritas à mão seriam 198 chances de errar
   um nome de espécie que só quebraria na tela do jogador.

   TABELA: por Gen, uma linha por rota, na ordem das rotas do mapa:
     [missão de espécie, [[espécie, quantidade]…], nome da missão do Alfa]
   A quantidade sai do peso do pool (p 8 → 24, 5–7 → 16, 3–4 → 12, 2 → 8, ≤1 → 4) e, com mais de uma espécie,
   é DIVIDIDA entre elas — foi o exemplo do usuário: Plusle e Minun são p7 (16) e viram 8 + 8. */
import { writeFileSync } from 'node:fs';
import { GENS } from '../js/dados-mapas.js';

const T = {
  1: [
    ['Praga de Rattata', [['rattata', 24]], 'O Alfa da Rota 1'],
    ['Folhas mastigadas', [['caterpie', 24]], 'Rainha da Floresta'],
    ['Quebra-pedra', [['geodude', 24]], 'A lua cheia'],
    ['Pinças na Ponte Pepita', [['krabby', 24]], 'Punho da Rota 24'],
    ['Bombas rolando', [['voltorb', 16]], 'Curto-circuito'],
    ['Caça-fantasmas', [['haunter', 12]], 'A sombra da Torre'],
    ['Rei e rainha do Safari', [['nidoking', 4], ['nidoqueen', 4]], 'Estouro no Safari'],
    ['Cascos de fogo no gelo', [['ponyta', 16]], 'Serpente do mar'],
    ['Quatro braços, uma estrada', [['machamp', 8]], 'O último portão'],
    ['Lâminas no escuro', [['scyther', 8]], 'Campeão de Kanto']
  ],
  2: [
    ['Rabos na trilha', [['sentret', 24]], 'O Alfa da Rota 29'],
    ['Lã no bosque', [['mareep', 24]], 'Girassol do Ilex'],
    ['Alfabeto quebrado', [['unown', 24]], 'Presas nas ruínas'],
    ['Luzes no fundo', [['chinchou', 16]], 'Farol vivo'],
    ['Fogo que não apagou', [['houndour', 12]], 'Urso das cinzas'],
    ['Lã elétrica', [['ampharos', 8]], 'Asas no lago'],
    ['Nunca é só um', [['dunsparce', 16]], 'Coral do gelo'],
    ['Espinhos na água', [['qwilfish', 8]], 'Guardião da toca'],
    ['Casca dura', [['shuckle', 16]], 'O topo do Monte Prata'],
    ['Leite da montanha', [['miltank', 8]], 'Campeão de Johto']
  ],
  3: [
    ['Zigue e zague', [['zigzagoon', 24]], 'O Alfa da Rota 101'],
    ['Folha sobre a água', [['lotad', 12], ['seedot', 12]], 'Asas de pó'],
    ['Barriga de lama', [['gulpin', 24]], 'Palma aberta'],
    ['Dentes na ciclovia', [['carvanha', 24]], 'Beleza das águas'],
    ['Dança sem motivo', [['spinda', 24]], 'Engolindo tudo'],
    ['Bússola quebrada', [['nosepass', 24]], 'Fóssil de armadura'],
    ['Mais ou Menos', [['plusle', 8], ['minun', 8]], 'Punho de aço'],
    ['Língua camaleão', [['kecleon', 16]], 'Gelo flutuante'],
    ['Carvão vivo', [['torkoal', 12]], 'Asas de dragão'],
    ['Palmeira voadora', [['tropius', 16]], 'Campeão de Hoenn']
  ],
  4: [
    ['Dentes de castor', [['bidoof', 24]], 'O Alfa da Rota 201'],
    ['Botão fechado', [['budew', 24]], 'A capa do bosque'],
    ['Sino de bronze', [['bronzor', 24]], 'Garras na mina'],
    ['Nadadeira veloz', [['buizel', 16]], 'Juba elétrica'],
    ['Cheiro de longe', [['stunky', 24]], 'Boca de areia'],
    ['Sinos na mansão', [['bronzong', 12]], 'Campana dupla'],
    ['Esquilo de choque', [['pachirisu', 16]], 'Raposa de gelo'],
    ['Escudo fóssil', [['bastiodon', 8]], 'Ímã triplo'],
    ['Planta carnívora', [['carnivine', 16]], 'Dragão da terra'],
    ['Bruxa do pilar', [['mismagius', 8]], 'Campeão de Sinnoh']
  ],
  5: [
    ['Sempre de guarda', [['patrat', 24]], 'O Alfa da Rota 1'],
    ['Pedra que anda', [['roggenrola', 24]], 'Algodão ao vento'],
    ['Girinos no charco', [['tympole', 24]], 'Vento de algodão'],
    ['Olhos no deserto', [['elgyem', 24]], 'Broca na areia'],
    ['Olho que não dorme', [['watchog', 24]], 'Zebra elétrica'],
    ['Filhotes de rapina', [['rufflet', 8], ['vullaby', 8]], 'Olhar da torre'],
    ['Sorvete duplo', [['vanillish', 12]], 'Baunilha dupla'],
    ['Médico da baía', [['audino', 24]], 'Fóssil alado'],
    ['Cacto dançante', [['maractus', 24]], 'Três cabeças'],
    ['Pássaro de pedra', [['sigilyph', 8]], 'Campeão de Unova']
  ],
  6: [
    ['Orelhas grandes', [['bunnelby', 24]], 'O Alfa da Rota 2'],
    ['Flor com pernas', [['flabebe', 24]], 'Asas de mosaico'],
    ['Espada solta', [['honedge', 16]], 'Orelhas de escavadeira'],
    ['Alga venenosa', [['skrelp', 12], ['clauncher', 12]], 'Chifres do prado'],
    ['Filhote de juba', [['litleo', 16]], 'Rugido na usina'],
    ['Duas espadas', [['doublade', 12]], 'Panda bravo'],
    ['Pétalas na neve', [['florges', 8]], 'Montanha de gelo'],
    ['Bigode elétrico', [['dedenne', 16]], 'Asas de som'],
    ['Corte de pelo', [['furfrou', 16]], 'Gosma suprema'],
    ['Luta com capa', [['hawlucha', 12]], 'Campeão de Kalos']
  ],
  7: [
    ['Bico de pica-pau', [['pikipek', 24]], 'O Alfa da Rota 1'],
    ['Larva da selva', [['grubbin', 24]], 'Bateria viva'],
    ['Cão do túnel', [['rockruff', 16]], 'Lobo da rocha'],
    ['Caranguejo brigão', [['crabrawler', 24]], 'Bolha de água'],
    ['Ursinho de pelúcia', [['stufful', 16]], 'Casco explosivo'],
    ['Burro de barro', [['mudbray', 16]], 'Veneno dançante'],
    ['Besouro de choque', [['vikavolt', 8]], 'Caranguejo do topo'],
    ['Ouriço elétrico', [['togedemaru', 16]], 'Agulha venenosa'],
    ['Dentes afiados', [['bruxish', 12]], 'Escamas de batalha'],
    ['Sábios da ilha', [['oranguru', 4], ['passimian', 4]], 'Campeão de Alola']
  ],
  8: [
    ['Bochechas cheias', [['skwovet', 24]], 'O Alfa da Rota 1'],
    ['Maçã com bicho', [['applin', 24]], 'Creme perfeito'],
    ['Cobra de areia', [['silicobra', 24]], 'Mandíbula de pedra'],
    ['Raposa ladra', [['thievul', 12]], 'Cão veloz'],
    ['Lã da cidade', [['dubwool', 12]], 'Montanha de carvão'],
    ['Chapéu do bosque', [['hattrem', 12]], 'Bruxa do bosque'],
    ['Elefante de cobre', [['copperajah', 12]], 'Corvo de aço'],
    ['Duas caras, uma fome', [['morpeko', 16]], 'Urso da lua'],
    ['Pescador voador', [['cramorant', 8]], 'Dardo de dragão'],
    ['Cervo de outro tempo', [['wyrdeer', 12]], 'Campeão de Galar']
  ],
  9: [
    ['Porquinho farejador', [['lechonk', 24]], 'O Alfa da Trilha de Poco'],
    ['Patinha elétrica', [['pawmi', 16]], 'Sapo-bateria'],
    ['Pedra de sal', [['nacli', 24]], 'Gafanhoto assassino'],
    ['Golfinho do lago', [['finizen', 16]], 'Maçã de muitas cabeças'],
    ['Cogumelo que nada', [['toedscool', 16]], 'Cavaleiro de fogo'],
    ['Azeitona madura', [['dolliv', 12]], 'Chá do bosque'],
    ['Pássaro barulhento', [['squawkabilly', 16]], 'Baleia da montanha'],
    ['Pinça lateral', [['klawf', 12]], 'Fúria sem fim'],
    ['Peixe disfarçado', [['tatsugiri', 12]], 'Ponte de aço'],
    ['Lagarto-moto', [['cyclizar', 16]], 'Campeão de Paldea']
  ]
};

// escada de prêmios pela posição da rota (1→10), igual em todas as Gens
const PREMIO_ESPECIE = [
  { itens: { potion: 4 } }, { itens: { honey: 2 } }, { itens: { 'hard-stone': 2 } }, { itens: { 'super-potion': 2 } },
  { itens: { 'rare-candy': 1 } }, { itens: { revive: 1 } }, { itens: { 'hyper-potion': 2 } },
  { itens: { 'rare-candy': 2 } }, { itens: { 'max-revive': 1 } }, { dinheiro: 12000 }
];
const premioAlfa = i => i === 9 ? { dinheiro: 25000, itens: { 'rare-candy': 3 } } : { dinheiro: 1000 * (i + 1) };

const linhas = [];
for (const g of GENS) {
  const rotas = g.rotas.filter(z => !z.posVitoria);     // o Santuário não tem missão (é pós-vitória)
  const tabela = T[g.gen];
  if (rotas.length !== tabela.length) throw new Error(`Gen ${g.gen}: ${rotas.length} rotas x ${tabela.length} linhas na tabela`);
  linhas.push(`  // ---- Gen ${g.gen}: ${g.regiao} ----`);
  rotas.forEach((z, i) => {
    const [nome, alvos, nomeAlfa] = tabela[i];
    for (const [sp] of alvos) if (!z.pool.some(p => p.n === sp)) throw new Error(`${z.id}: "${sp}" não está no pool da rota`);
    const antes = i > 0 ? rotas[i - 1].id : null;
    linhas.push(`  esp(${g.gen}, ${JSON.stringify(z.id)}, ${JSON.stringify(nome)}, ${JSON.stringify(alvos)}, ${JSON.stringify(PREMIO_ESPECIE[i])}),`);
    linhas.push(`  alfa(${g.gen}, ${JSON.stringify(z.id)}, ${JSON.stringify(nomeAlfa)}, ${JSON.stringify(z.name)}, ${JSON.stringify(antes)}, ${JSON.stringify(premioAlfa(i))}, ${z.lendarios ? 'true' : 'false'}),`);
  });
}

const arquivo = `/* GERADO pelo editor de rotas do jogo (js/tela-editor-rotas.js → "📋 Copiar o arquivo") — não editar à mão.
   Semeado em ${new Date().toISOString().slice(0, 10)} por ferramentas/semear-rotas.mjs.

   Duas coisas moram aqui, e as duas são AJUSTES por cima de js/dados-mapas.js (que é gerado da PokéAPI e não deve
   guardar escolha de desenho):
     ALFAS        → troca o Alfa de uma rota ({ id, nome, nivel }). Rota fora da tabela = o Alfa do mapa.
     MISSOES_ROTA → as missões de espécie e de Alfa de cada rota, uma por rota.
   Quem aplica os dois é js/dados.js (o ÚNICO que importa dados-mapas.js). Sem imports aqui de propósito: é dado,
   e precisa ser legível e carregável sem depender de nada. */

/* Uma missão de espécie. \`alvos\` = [[espécie, quantidade]…]: mais de uma espécie SOMA (8 Plusle + 8 Minun = 16).
   \`libera\` com \`qualquer: 1\` = basta derrotar UM de qualquer uma delas pra missão aparecer. */
const esp = (gen, rota, nome, alvos, premio) => ({
  id: \`\${rota}-esp\`, gen, rota, nome, premio,
  desc: \`Derrote \${alvos.map(([n, q]) => \`\${q} \${bonito(n)}\`).join(' e ')}.\`,
  libera: { alvos: alvos.map(([n]) => [n, 1]), qualquer: 1 },
  objetivo: { alvos }
});
/* A missão do Alfa da rota. \`antes\` = id da rota anterior (a corrente do mapa); null na primeira, que libera no
   nível 1. \`lendarios\` marca a rota final: lá o "Alfa" são os lendários, e vencer fecha a Gen. */
const alfa = (gen, rota, nome, rotulo, antes, premio, lendarios) => ({
  id: \`\${rota}-alfa\`, gen, rota, nome, premio,
  desc: lendarios ? \`Vença os lendários de \${rotulo} e feche a Gen \${gen}.\` : \`Derrote o Alfa de \${rotulo}.\`,
  libera: antes ? { chefe: antes } : { nivel: 1 },
  objetivo: { chefe: rota }
});
// "nidoran-f" → "Nidoran F", "mr-mime" → "Mr Mime": o nome da espécie como o jogador lê na descrição
const bonito = n => n.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join(' ');

// Alfa trocado por rota. Vazio = todos os mapas seguem com o Alfa que a PokéAPI gerou.
export const ALFAS = {};

export const MISSOES_ROTA = [
${linhas.join('\n')}
];
`;

writeFileSync(new URL('../js/dados-rotas.js', import.meta.url), arquivo);
console.log(`js/dados-rotas.js: ${linhas.filter(l => !l.startsWith('  //')).length} missões em ${GENS.length} Gens.`);
