/* ============ editor de rotas: as contas (puro) ============
   A tela é js/tela-editor-rotas.js; aqui mora tudo o que dá pra testar sem navegador: a curva de stats da rota, o
   veredito do Alfa contra essa curva e a geração do arquivo `js/dados-rotas.js`.

   Por que a curva existe: o Alfa de cada rota foi sorteado pelo gerador de mapas (ferramentas/gerar-mapas.ps1) sem
   olhar o pool, então há rota em que ele é um paredão e rota em que ele é mais fraco que o selvagem comum. O editor
   mostra o número pra decidir — "BST 395 contra uma rota de mediana 310" é uma frase que dá pra julgar; "Cloyster
   nível 24" não é.

   Sem DOM e sem rede: testado em tests/editor-rotas.test.js. */

export const STATS_BST = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

// soma dos 6 base stats (Base Stat Total) — a medida grosseira de "quão forte é esta espécie"
export const bst = base => STATS_BST.reduce((s, k) => s + (base?.[k] || 0), 0);

/* Curva de stats da rota: a mediana é o centro de gravidade (e não a média, que um lendário no pool puxa sozinho).
   `pesada` = mediana PONDERADA pelo peso de aparição, que é o que o jogador realmente encontra: um Dratini de
   peso 2 num pool de Geodudes de peso 8 quase não aparece, então não devia mandar na conta.
   `espécies` = [{ n, p, bst }], já ordenado do mais forte pro mais fraco. */
export function curvaDaRota(especies) {
  const lista = especies.filter(e => Number.isFinite(e.bst) && e.bst > 0).sort((a, b) => b.bst - a.bst);
  if (!lista.length) return null;
  const ordenado = [...lista].sort((a, b) => a.bst - b.bst);
  const meio = n => n.length % 2 ? n[(n.length - 1) / 2] : (n[n.length / 2 - 1] + n[n.length / 2]) / 2;
  const valores = ordenado.map(e => e.bst);
  // mediana ponderada: repete cada espécie pelo peso dela (arredondado pra cima, pra peso fracionário de mítico contar 1)
  const ponderado = ordenado.flatMap(e => Array(Math.max(1, Math.ceil(e.p || 1))).fill(e.bst));
  return {
    especies: lista, n: lista.length,
    min: valores[0], max: valores[valores.length - 1],
    mediana: meio(valores), pesada: meio(ponderado),
    media: Math.round(valores.reduce((a, b) => a + b, 0) / valores.length)
  };
}

/* Quão desequilibrada é a rota por dentro: `max / mediana`. Acima de 1.6 significa que tem algo no pool muito acima
   do resto — não é erro (um Dratini na Monte Lua é de propósito), mas é o que explica "apareceu um bicho e me
   matou". O editor mostra pro usuário decidir. */
export const ESPALHAMENTO_ALTO = 1.6;
export function equilibrioDaRota(curva) {
  if (!curva) return null;
  const espalhamento = curva.max / curva.mediana;
  return {
    espalhamento: Math.round(espalhamento * 100) / 100,
    nivel: espalhamento >= ESPALHAMENTO_ALTO ? 'desigual' : espalhamento >= 1.3 ? 'variada' : 'parelha',
    // quem está puxando a ponta de cima (só interessa quando a rota é desigual)
    foraDaCurva: curva.especies.filter(e => e.bst >= curva.mediana * ESPALHAMENTO_ALTO).map(e => e.n)
  };
}

/* O Alfa contra a curva da rota. O Alfa é turbinado em cima disto (regras.statsDeChefe: HP ×2 e +30% no resto) e
   vem alguns níveis acima, então a referência certa NÃO é "igual à mediana": o esperado é ele estar entre 1.15× e
   1.5× a mediana ponderada. Abaixo disso o Alfa é mais fraco que o capim; acima, é um muro.
   Faixas escolhidas olhando os Alfas que o gerador já produziu — a maioria cai em 1.2–1.4. */
export const FAIXA_ALFA = { minimo: 1.15, maximo: 1.5 };
export function vereditoAlfa(bstAlfa, curva) {
  if (!curva || !(bstAlfa > 0)) return null;
  const razao = bstAlfa / curva.pesada;
  const veredito = razao < 1 ? 'fraco' : razao < FAIXA_ALFA.minimo ? 'justo-fraco'
    : razao <= FAIXA_ALFA.maximo ? 'justo' : razao <= 1.9 ? 'duro' : 'muro';
  return {
    razao: Math.round(razao * 100) / 100, veredito,
    ok: veredito === 'justo',
    // onde um Alfa ideal cairia nesta rota, pra procurar candidato por BST
    alvo: [Math.round(curva.pesada * FAIXA_ALFA.minimo), Math.round(curva.pesada * FAIXA_ALFA.maximo)]
  };
}
// candidatos a Alfa de uma rota: espécies da Gen com BST dentro do alvo, mais perto do meio primeiro
export function candidatosAlfa(especiesDaGen, curva, limite = 12) {
  const v = vereditoAlfa(curva?.pesada * 1.3, curva);
  if (!v) return [];
  const [a, b] = v.alvo, meio = (a + b) / 2;
  return especiesDaGen.filter(e => e.bst >= a && e.bst <= b)
    .sort((x, y) => Math.abs(x.bst - meio) - Math.abs(y.bst - meio)).slice(0, limite);
}

/* Quantidade sugerida pra uma missão de espécie, pelo peso de aparição no pool: comum = 24, raro = 4. É a mesma
   escada da semente (ferramentas/semear-rotas.mjs) — vive aqui pra o editor sugerir sozinho quando o usuário
   escolhe uma espécie nova, em vez de ele ter de lembrar a tabela. */
export const quantidadePorPeso = p => p >= 8 ? 24 : p >= 5 ? 16 : p >= 3 ? 12 : p >= 2 ? 8 : 4;
// com mais de uma espécie na mesma missão, o total se divide entre elas (8 Plusle + 8 Minun = os 16 de um p7)
export function dividirQuantidade(total, quantas) {
  if (quantas < 1) return [];
  const base = Math.max(1, Math.floor(total / quantas));
  const out = Array(quantas).fill(base);
  let resto = total - base * quantas;
  for (let i = 0; resto > 0; i = (i + 1) % quantas, resto--) out[i]++;
  return out;
}

/* ---- gerar o arquivo ---- */

// "nidoran-f" → "Nidoran F" (mesma função do arquivo gerado; aqui é pra a tela mostrar antes de gerar)
export const bonito = n => String(n).split('-').map(p => p ? p[0].toUpperCase() + p.slice(1) : p).join(' ');

/* ---- 📦 o PACOTE publicado (docs/plano-config-remota.md) ---- */
/* As MESMAS duas fábricas que o arquivo gerado carrega inline, aqui como funções de verdade. Esta é a única cópia
   que o código EXECUTA; a do arquivo gerado é texto que vira `js/dados-rotas.js`. As duas ficam presas uma na
   outra por `tests/conteudo-pacote.test.js`: o pacote montado das rotas SEM edição tem de bater, campo por campo,
   com o `MISSOES_ROTA` que está no repositório hoje — mexeu numa e esqueceu a outra, o teste fala.
   Vivem AQUI (e não em `conteudo.js`) porque são a linguagem do EDITOR: ele é quem sabe o que é uma missão de
   espécie e uma de Alfa. `conteudo.js` só valida e aplica o que chega. */
export const missaoDeEspecie = (gen, rota, nome, alvos, premio) => ({
  id: `${rota}-esp`, gen, rota, nome, premio,
  desc: `Derrote ${alvos.map(([n, q]) => `${q} ${bonito(n)}`).join(' e ')}.`,
  libera: { alvos: alvos.map(([n]) => [n, 1]), qualquer: 1 },
  objetivo: { alvos }
});
export const missaoDeAlfa = (gen, rota, nome, rotulo, antes, premio, lendarios) => ({
  id: `${rota}-alfa`, gen, rota, nome, premio,
  desc: lendarios ? `Vença os lendários de ${rotulo} e feche a Gen ${gen}.` : `Derrote o Alfa de ${rotulo}.`,
  libera: antes ? { chefe: antes } : { nivel: 1 },
  objetivo: { chefe: rota }
});
/* O que o 📤 Publicar manda pra nuvem: a mesma entrada do `gerarArquivo`, em dado puro em vez de código-fonte.
   `versao` sai 0 — quem numera é `conteudo-nuvem.publicarConteudo`, porque deixar o número na mão de quem publica
   é o caminho curto pra republicar com número MENOR e o pacote novo ser ignorado em silêncio por todo cache. */
export function gerarPacote(rotas, formato = 1) {
  const alfas = {}, missoesRota = [];
  for (const r of rotas) {
    if (r.alfa?.trocado) alfas[r.rota] = r.alfa.trocado;
    missoesRota.push(missaoDeEspecie(r.gen, r.rota, r.missao.nome, r.missao.alvos, r.missao.premio));
    missoesRota.push(missaoDeAlfa(r.gen, r.rota, r.alfa.nome, r.rotulo, r.antes ?? null, r.alfa.premio, !!r.lendarios));
  }
  return { formato, versao: 0, alfas, missoesRota };
}

/* `rotas` = [{ gen, rota, rotulo, antes, lendarios, missao: { nome, alvos, premio }, alfa: { nome, premio,
   trocado?: { id, nome, nivel } } }], na ordem em que as rotas aparecem nos mapas.
   Devolve o CONTEÚDO de js/dados-rotas.js, pronto pra colar. Gera o mesmo formato que a semente pra o diff do git
   mostrar só o que mudou de verdade — arquivo gerado que muda de forma a cada vez é um diff ilegível. */
export function gerarArquivo(rotas, hoje = new Date().toISOString().slice(0, 10)) {
  const j = v => JSON.stringify(v);
  const alfas = rotas.filter(r => r.alfa?.trocado);
  const corpo = [];
  let genAtual = null;
  for (const r of rotas) {
    if (r.gen !== genAtual) { genAtual = r.gen; corpo.push(`  // ---- Gen ${r.gen}${r.regiao ? `: ${r.regiao}` : ''} ----`); }
    corpo.push(`  esp(${r.gen}, ${j(r.rota)}, ${j(r.missao.nome)}, ${j(r.missao.alvos)}, ${j(r.missao.premio)}),`);
    corpo.push(`  alfa(${r.gen}, ${j(r.rota)}, ${j(r.alfa.nome)}, ${j(r.rotulo)}, ${j(r.antes ?? null)}, ${j(r.alfa.premio)}, ${r.lendarios ? 'true' : 'false'}),`);
  }
  return `/* GERADO pelo editor de rotas do jogo (js/tela-editor-rotas.js → "📋 Copiar o arquivo") — não editar à mão.
   Gerado em ${hoje}.

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
export const ALFAS = {${alfas.length ? `\n${alfas.map(r => `  ${j(r.rota)}: ${j(r.alfa.trocado)},`).join('\n')}\n` : ''}};

export const MISSOES_ROTA = [
${corpo.join('\n')}
];
`;
}
