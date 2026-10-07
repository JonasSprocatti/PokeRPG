/* ============ 📦 conteúdo publicado: validar e aplicar ============ */
/* O CHÃO da Atualização de conteúdo pela nuvem (docs/plano-config-remota.md). PURO: sem DOM, sem rede, sem
   storage — importável no Node e testado lá. Quem busca na nuvem e guarda no cache é `conteudo-nuvem.js`.
//
   POR QUE ELE EXISTE. O 🗺 Editor de rotas cospe um `dados-rotas.js` pra colar no repositório: conteúdo é CÓDIGO,
   e só muda com commit + deploy. O usuário pediu controle sem deploy (06/10/2026), e a resposta dele pro problema
   do offline é a arquitetura inteira: o pacote fica no CACHE, atualiza quando há internet, e sem internet o
   jogador joga com o que tem.

   POR QUE MUTA NO LUGAR. `dados.js` precisa continuar importável no Node sem storage (metade da suíte depende
   disso), então ele não pode ler o cache no corpo do módulo. E transformar `GENS` em função mexeria em ~40 pontos
   de LEITURA pra ganhar 1 de escrita. Então: `GENS`/`MISSOES` continuam sendo os mesmos arrays, e aqui a gente
   troca o CONTEÚDO deles (`length = 0; push(...)`). Todo consumidor guarda a mesma referência, então aplicar
   dentro do `boot()` — depois dos módulos, antes do primeiro `render()` — vale pra sessão inteira.

   POR QUE VALIDA. O pacote chega pela rede. Aqui é mais brando que a sala de multiplayer (só admin escreve, e o
   transporte é o do Supabase), mas a lição do `mp-sanear` vale: o que chega não é confiável, e o custo de errar é
   a jornada do jogador. Regra: pacote que não valida é DESCARTADO INTEIRO, nunca aplicado pela metade — meia
   config é pior que nenhuma, porque o jogo fica num estado que ninguém desenhou. */
import { GENS, MISSOES, MISSOES_GLOBAIS, ITEMS, SO_NO_SANTUARIO } from './dados.js';
import { BADGES, MEDIDAS } from './badges.js';
import { CLIMAS } from './cenario.js';
import { MISSOES_ROTA } from './dados-rotas.js';
import {
  TEMAS, CONTEXTOS, ESCALAS, ONDAS, RAIZ, PASSOS_DO_COMPASSO, ACORDES_NA_PROGRESSAO, MIDI_MAIS_AGUDO,
  nomeDaEscala, lerMelodia, maisAgudo
} from './dados-musica.js';

export const VERSAO_PACOTE = 1;        // formato do pacote. Pacote de formato desconhecido é ignorado, não adivinhado.
const ID_ROTA = /^[a-z0-9-]{2,40}$/;   // mesmo formato dos ids que já existem em dados-mapas.js
const inteiro = v => Number.isInteger(v);
const texto = (v, max = 200) => typeof v === 'string' && v.length > 0 && v.length <= max;
/* Id de espécie entra por COERÇÃO de inteiro, não por faixa 1–1025: id de FORMA passa de 10000 (a lição do
   `numeroDeSprite`). O que não pode é texto virando `src` ou chave de cache. */
const idDeEspecie = v => inteiro(v) && v > 0 && v < 100000;

/* ---- o pacote de FÁBRICA ---- */
/* O que está no repositório, no formato do pacote. É o que vale sem cache, com cache inválido, ou na primeira
   vez que o jogo abre. `dados-rotas.js` continua existindo exatamente pra isso — e continua sendo o destino do
   "📋 Copiar o arquivo" do editor, pra quem instala o jogo do zero não começar com as tabelas velhas. */
/* A música de fábrica, tirada das tabelas ANTES de qualquer aplicação (o módulo carrega uma vez, então esta é a
   foto do repositório). Serve pra duas coisas: entrar no pacote de fábrica e, no `aplicarConteudo`, VOLTAR o que
   o pacote não traz — sem isso um pacote novo sem o tema `gelo` deixaria no ar o `gelo` do pacote anterior. */
const MUSICA_DE_FABRICA = {
  temas: Object.fromEntries(Object.entries(TEMAS).map(([k, t]) => [k, { ...t, escala: nomeDaEscala(t.escala) }])),
  contextos: Object.fromEntries(Object.entries(CONTEXTOS).map(([k, c]) => [k, { ...c }]))
};
const copiaDaMusica = () => JSON.parse(JSON.stringify(MUSICA_DE_FABRICA));

/* As outras fotos de fábrica, pelo mesmo motivo: o aplicar precisa VOLTAR o que o pacote não traz.
   Os mapas são a exceção — são 99 rotas com ~1.500 linhas de pool, e copiar tudo a cada boot seria pagar pela
   fase 2 inteira mesmo sem nenhuma Gen editada. Por isso a foto dos mapas é LAZY: só a Gen que um pacote
   realmente sobrescreve entra em `fabricaDaGen`, e só na primeira vez. */
const GLOBAIS_DE_FABRICA = MISSOES_GLOBAIS.map(m => JSON.parse(JSON.stringify(m)));
const ITENS_DE_FABRICA = Object.fromEntries(Object.entries(ITEMS).map(([k, it]) => [k, { price: it.price || 0, name: it.name, desc: it.desc }]));
const BADGES_DE_FABRICA = Object.fromEntries(BADGES.map(b => [b.id, { nome: b.nome, desc: b.desc, recompensa: b.recompensa ? JSON.parse(JSON.stringify(b.recompensa)) : undefined }]));
const fabricaDaGen = new Map();

export const pacoteDeFabrica = () => ({
  formato: VERSAO_PACOTE,
  versao: 0,
  alfas: {},
  missoesRota: MISSOES_ROTA.map(m => ({ ...m })),
  musica: copiaDaMusica(),
  /* `mapas`/`itens`/`badges` vazios = tudo de fábrica, e é de propósito que o pacote de fábrica NÃO carregue as
     99 rotas: ausente já quer dizer "o que está no repositório", e um pacote de 150 KB no `localStorage` pra
     dizer isso seria peso sem informação. As missões globais vão inteiras porque são 17 linhas curtas e porque o
     editor precisa de uma base pra comparar. */
  mapas: {},
  missoesGlobais: GLOBAIS_DE_FABRICA.map(m => JSON.parse(JSON.stringify(m))),
  itens: {},
  badges: {}
});
export { MUSICA_DE_FABRICA, GLOBAIS_DE_FABRICA, ITENS_DE_FABRICA, BADGES_DE_FABRICA };

/* ---- validação ---- */
/* Devolve `{ ok: true, pacote }` ou `{ ok: false, porque }`. O `porque` não é decoração: um pacote recusado em
   silêncio é indistinguível de "a nuvem está fora", e foi assim que um `try` largo demais já custou horas ao
   jogador. Quem chama REGISTRA o motivo. */
export function validarPacote(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return { ok: false, porque: 'pacote não é um objeto' };
  if (p.formato !== VERSAO_PACOTE) return { ok: false, porque: `formato ${p.formato} desconhecido (esperado ${VERSAO_PACOTE})` };
  if (!inteiro(p.versao) || p.versao < 0) return { ok: false, porque: 'versão não é inteiro >= 0' };

  /* As rotas que existem DEPOIS de aplicar `mapas`: a ordem importa. Uma missão pode apontar pra uma rota que o
     próprio pacote está criando, e um Alfa também — validar contra as rotas de fábrica recusaria o pacote
     coerente (e, pior, só o primeiro: no boot seguinte a rota já existiria e o mesmo pacote passaria). */
  const vm = validarMapas(p.mapas);
  if (!vm.ok) return vm;
  const rotasQueExistem = rotasDepoisDoPacote(p.mapas);

  // ALFAS: { idDaRota: { id, nome, nivel } }. Rota fora da tabela segue com o Alfa do mapa.
  if (p.alfas != null) {
    if (typeof p.alfas !== 'object' || Array.isArray(p.alfas)) return { ok: false, porque: 'alfas não é objeto' };
    for (const [rota, a] of Object.entries(p.alfas)) {
      if (!ID_ROTA.test(rota)) return { ok: false, porque: `id de rota inválido em alfas: "${rota}"` };
      if (!rotasQueExistem.has(rota)) return { ok: false, porque: `alfas aponta pra rota que não existe: "${rota}"` };
      if (!a || typeof a !== 'object') return { ok: false, porque: `alfa de ${rota} não é objeto` };
      if (a.id != null && !idDeEspecie(a.id)) return { ok: false, porque: `alfa de ${rota}: id de espécie inválido` };
      if (a.nivel != null && !(inteiro(a.nivel) && a.nivel >= 1 && a.nivel <= 100)) return { ok: false, porque: `alfa de ${rota}: nível fora de 1–100` };
      if (a.nome != null && !texto(a.nome, 60)) return { ok: false, porque: `alfa de ${rota}: nome inválido` };
    }
  }

  // MISSÕES de rota: id único, e o `gen`/`rota` têm de existir — missão pendurada em rota inexistente nunca
  // aparece pro jogador e some do radar (pior que erro: funcionalidade fantasma)
  if (p.missoesRota != null) {
    if (!Array.isArray(p.missoesRota)) return { ok: false, porque: 'missoesRota não é lista' };
    const vistos = new Set(), globais = new Set((p.missoesGlobais || MISSOES_GLOBAIS).map(m => m.id));
    for (const m of p.missoesRota) {
      const r = validarMissao(m, { vistos, proibidos: globais, deRota: true, rotasQueExistem });
      if (!r.ok) return r;
    }
  }

  // MISSÕES GLOBAIS (fase 3): a lista INTEIRA das missões de conta. Sem `gen` e sem `rota` — valem em qualquer mapa.
  if (p.missoesGlobais != null) {
    if (!Array.isArray(p.missoesGlobais)) return { ok: false, porque: 'missoesGlobais não é lista' };
    if (!p.missoesGlobais.length) return { ok: false, porque: 'missoesGlobais vazia (ausente = as de fábrica; vazia apagaria todas)' };
    const vistos = new Set(), deRota = new Set((p.missoesRota || MISSOES_ROTA).map(m => m.id));
    for (const m of p.missoesGlobais) {
      const r = validarMissao(m, { vistos, proibidos: deRota, deRota: false, rotasQueExistem });
      if (!r.ok) return r;
    }
    // `libera: { missao: x }` pendurado em missão que não existe esconde a missão pra sempre, sem erro nenhum
    const existem = new Set([...vistos, ...deRota]);
    for (const m of p.missoesGlobais) {
      if (m.libera?.missao && !existem.has(m.libera.missao)) {
        return { ok: false, porque: `missão ${m.id}: libera depende de "${m.libera.missao}", que não existe` };
      }
    }
  }

  const ib = validarItens(p.itens);
  if (!ib.ok) return ib;
  const bd = validarBadges(p.badges);
  if (!bd.ok) return bd;
  const m = validarMusica(p.musica);
  if (!m.ok) return m;

  return { ok: true, pacote: p };
}

/* ---- missão (a MESMA validação pras de rota e pras globais) ---- */
/* Uma função só porque missão é missão: o que muda é que a de rota EXIGE `gen` e `rota` e a global não pode ter
   nenhum dos dois (uma global com `gen` só apareceria naquele mapa, e seria uma missão de rota mal escrita).
   `proibidos` = os ids do outro lado, pra os dois conjuntos nunca colidirem: `MISSOES` é a concatenação dos dois,
   e id repetido faria `S.missoesFeitas` entregar as duas de uma vez. */
const CONDICOES = ['derrotar', 'alvos', 'vitorias', 'amigos', 'nivel', 'chefe', 'treinadores', 'missao', 'dinheiro', 'gasto', 'evolucoes'];
function validarMissao(m, { vistos, proibidos, deRota, rotasQueExistem }) {
  if (!m || typeof m !== 'object') return { ok: false, porque: 'missão não é objeto' };
  if (!texto(m.id, 60)) return { ok: false, porque: 'missão sem id' };
  if (vistos.has(m.id)) return { ok: false, porque: `missão repetida: "${m.id}"` };
  if (proibidos.has(m.id)) {
    return { ok: false, porque: deRota ? `missão de rota com id de missão global: "${m.id}"` : `missão global com id de missão de rota: "${m.id}"` };
  }
  vistos.add(m.id);
  if (!texto(m.nome, 80) || !texto(m.desc, 300)) return { ok: false, porque: `missão ${m.id}: nome ou descrição inválidos` };
  if (deRota) {
    if (!inteiro(m.gen) || m.gen < 1 || m.gen > GENS.length) return { ok: false, porque: `missão ${m.id}: gen ${m.gen} não existe` };
    if (!ID_ROTA.test(m.rota || '') || !rotasQueExistem.has(m.rota)) return { ok: false, porque: `missão ${m.id}: rota "${m.rota}" não existe` };
  } else if (m.gen != null || m.rota != null) {
    return { ok: false, porque: `missão global ${m.id}: não pode ter gen nem rota (ela vale em todo mapa)` };
  }
  if (!m.objetivo || typeof m.objetivo !== 'object') return { ok: false, porque: `missão ${m.id}: sem objetivo` };
  for (const cond of [m.objetivo, m.libera].filter(Boolean)) {
    const r = validarCondicao(m.id, cond, rotasQueExistem);
    if (!r.ok) return r;
  }
  return validarPremio(`missão ${m.id}`, m.premio);
}
/* Uma condição de `objetivo`/`libera`, no vocabulário de `regras.progressoCondicao`. Condição com chave que ela
   não conhece cai no `[0, 1]` dela: a missão fica **impossível em silêncio** — o pior defeito possível aqui. */
function validarCondicao(id, cond, rotasQueExistem) {
  if (typeof cond !== 'object' || Array.isArray(cond)) return { ok: false, porque: `missão ${id}: condição não é objeto` };
  const chaves = Object.keys(cond).filter(k => CONDICOES.includes(k));
  if (!chaves.length) return { ok: false, porque: `missão ${id}: condição sem nenhuma regra conhecida (${Object.keys(cond).join(', ') || 'vazia'})` };
  const alvos = cond.alvos;
  if (alvos != null) {
    if (!Array.isArray(alvos) || !alvos.length) return { ok: false, porque: `missão ${id}: alvos vazio` };
    for (const a of alvos) {
      if (!Array.isArray(a) || a.length !== 2) return { ok: false, porque: `missão ${id}: alvo malformado` };
      if (!texto(a[0], 40)) return { ok: false, porque: `missão ${id}: espécie inválida` };
      // teto por espécie: alvo de 0 nunca completa, e alvo gigante trava a missão pra sempre
      if (!inteiro(a[1]) || a[1] < 1 || a[1] > 999) return { ok: false, porque: `missão ${id}: quantidade fora de 1–999` };
    }
  }
  if (cond.chefe != null && !rotasQueExistem.has(cond.chefe)) return { ok: false, porque: `missão ${id}: chefe da rota "${cond.chefe}", que não existe` };
  if (cond.derrotar != null && !texto(cond.derrotar, 40)) return { ok: false, porque: `missão ${id}: espécie inválida em derrotar` };
  if (cond.missao != null && !texto(cond.missao, 60)) return { ok: false, porque: `missão ${id}: id inválido em libera.missao` };
  // as contadas (vitórias, amigos, nível, dinheiro…) são números: alvo 0 já nasce cumprido, negativo nunca
  for (const k of ['vitorias', 'amigos', 'nivel', 'treinadores', 'dinheiro', 'gasto', 'evolucoes', 'qtd']) {
    if (cond[k] != null && !(inteiro(cond[k]) && cond[k] >= 1 && cond[k] <= 9999999)) {
      return { ok: false, porque: `missão ${id}: ${k} tem de ser inteiro >= 1` };
    }
  }
  if (cond.nivel != null && cond.nivel > 100) return { ok: false, porque: `missão ${id}: nível acima de 100 nunca completa` };
  return { ok: true };
}
/* `premio`: { dinheiro?, itens?: { idDoItem: qtd }, titulo? }. Prêmio vazio é VÁLIDO (missão de chefe que só abre
   caminho), mas item que não existe não: `S.bag[id]` guardaria uma chave que nenhuma tela desenha, e o jogador
   receberia "nada" sem erro nenhum. */
function validarPremio(onde, premio) {
  if (premio == null) return { ok: true };
  if (typeof premio !== 'object' || Array.isArray(premio)) return { ok: false, porque: `${onde}: prêmio não é objeto` };
  if (premio.dinheiro != null && !(inteiro(premio.dinheiro) && premio.dinheiro >= 0 && premio.dinheiro <= 9999999)) {
    return { ok: false, porque: `${onde}: dinheiro do prêmio fora de 0–9.999.999` };
  }
  if (premio.titulo != null && !texto(premio.titulo, 60)) return { ok: false, porque: `${onde}: título do prêmio inválido` };
  if (premio.itens != null) {
    if (typeof premio.itens !== 'object' || Array.isArray(premio.itens)) return { ok: false, porque: `${onde}: itens do prêmio não é objeto` };
    for (const [id, q] of Object.entries(premio.itens)) {
      if (!ITEMS[id]) return { ok: false, porque: `${onde}: prêmio com item que não existe ("${id}")` };
      if (!inteiro(q) || q < 1 || q > 99) return { ok: false, porque: `${onde}: quantidade de "${id}" fora de 1–99` };
    }
  }
  return { ok: true };
}

/* ---- 🗺 mapas: pool, níveis, criar e excluir rota (fase 2) ---- */
/* `mapas: { "<gen>": [rota, rota…] }` — a lista INTEIRA e ORDENADA das rotas daquela Gen. Gen ausente = o que
   está no repositório. Por que a lista inteira e não um remendo por rota: criar, excluir e REORDENAR são a mesma
   operação ("a lista é outra"), e a ordem é o que define a corrente do mapa (`antes`, o `libera` de cada uma, a
   rota final). Remendo por rota precisaria de um `depois:` e de um `excluir: true` — três mecanismos pra fazer o
   que uma lista já faz. O preço: um pacote montado de uma versão velha do editor REVERTE o mapa daquela Gen; é o
   mesmo preço da música, e o editor sempre monta a lista a partir das tabelas AO VIVO.

   O que o pacote NÃO pode (plano, "O que o pacote NÃO pode fazer"): esvaziar uma Gen, tirar o Santuário
   (`posVitoria` — é ele que garante a Pokédex completa) nem deixar a Gen sem rota `final` (é vencer os lendários
   dela que fecha a Gen: sem isso a jornada não TERMINA, e isso não daria erro, daria um jogo sem fim). */
/* `tema` não existe em nenhuma rota gerada, e está aqui de propósito: `cenario.climaDaRota` já o lê ANTES de
   tentar adivinhar o bioma pelo texto da rota. É o único jeito de uma rota CRIADA no editor escolher a própria
   cena (e, com ela, a música) em vez de depender de ter a palavra certa no nome. */
const CAMPOS_DA_ROTA = ['id', 'gen', 'name', 'desc', 'min', 'max', 'libera', 'pool', 'chefe', 'final', 'lendarios', 'posVitoria', 'tema'];
const CAMPOS_DO_POOL = ['id', 'n', 'p', 'm', 'l', 'f'];
export { CAMPOS_DA_ROTA, CAMPOS_DO_POOL };

export function validarMapas(mapas) {
  if (mapas == null) return { ok: true };
  if (typeof mapas !== 'object' || Array.isArray(mapas)) return { ok: false, porque: 'mapas não é objeto' };
  const idsDeOutraGen = new Set();
  for (const g of GENS) if (!(g.gen in mapas) && !(String(g.gen) in mapas)) for (const z of g.rotas) idsDeOutraGen.add(z.id);

  for (const [chave, rotas] of Object.entries(mapas)) {
    const gen = Number(chave);
    if (!inteiro(gen) || !GENS.some(g => g.gen === gen)) return { ok: false, porque: `mapas: a Gen "${chave}" não existe` };
    if (!Array.isArray(rotas) || !rotas.length) return { ok: false, porque: `mapas: a Gen ${gen} ficaria sem rota nenhuma` };
    const vistos = new Set();
    let finais = 0, santuarios = 0;
    for (const z of rotas) {
      const r = validarRota(gen, z, vistos, idsDeOutraGen);
      if (!r.ok) return r;
      if (z.final) finais++;
      if (z.posVitoria) santuarios++;
    }
    if (finais !== 1) return { ok: false, porque: `mapas: a Gen ${gen} precisa de exatamente 1 rota final (tem ${finais})` };
    if (santuarios !== 1) return { ok: false, porque: `mapas: a Gen ${gen} precisa do Santuário (rota posVitoria)` };
    if (rotas.length < 2) return { ok: false, porque: `mapas: a Gen ${gen} precisa de ao menos uma rota comum além do Santuário` };
  }
  return { ok: true };
}
function validarRota(gen, z, vistos, idsDeOutraGen) {
  const nao = porque => ({ ok: false, porque: `mapas gen ${gen}: ${porque}` });
  if (!z || typeof z !== 'object' || Array.isArray(z)) return nao('rota não é objeto');
  if (!ID_ROTA.test(z.id || '')) return nao(`id de rota inválido ("${z.id}")`);
  if (vistos.has(z.id)) return nao(`rota repetida: "${z.id}"`);
  // id de rota é GLOBAL: `S.zona` guarda só o id, e `MISSOES` aponta por id. Repetir entre Gens cruzaria as duas.
  if (idsDeOutraGen.has(z.id)) return nao(`a rota "${z.id}" já existe em outra Gen`);
  vistos.add(z.id);
  for (const k of Object.keys(z)) if (!CAMPOS_DA_ROTA.includes(k)) return nao(`rota ${z.id}: campo desconhecido "${k}"`);
  if (z.gen != null && z.gen !== gen) return nao(`rota ${z.id}: gen ${z.gen} dentro da Gen ${gen}`);
  if (!texto(z.name, 60)) return nao(`rota ${z.id}: sem nome`);
  if (z.desc != null && !texto(z.desc, 300)) return nao(`rota ${z.id}: descrição inválida`);
  // bioma inventado cairia no `padrao` em silêncio: a cena e a música da rota saem daqui
  if (z.tema != null && !CLIMAS.some(c => c.id === z.tema)) return nao(`rota ${z.id}: bioma "${z.tema}" não existe`);
  for (const k of ['min', 'max', 'libera']) {
    if (!inteiro(z[k]) || z[k] < 1 || z[k] > 100) return nao(`rota ${z.id}: ${k} fora de 1–100`);
  }
  if (z.min > z.max) return nao(`rota ${z.id}: nível mínimo ${z.min} acima do máximo ${z.max}`);
  if (!Array.isArray(z.pool) || !z.pool.length) return nao(`rota ${z.id}: pool vazio (não daria pra encontrar nada)`);
  const especies = new Set();
  for (const p of z.pool) {
    if (!p || typeof p !== 'object') return nao(`rota ${z.id}: linha de pool não é objeto`);
    for (const k of Object.keys(p)) if (!CAMPOS_DO_POOL.includes(k)) return nao(`rota ${z.id}: campo desconhecido no pool ("${k}")`);
    if (!idDeEspecie(p.id)) return nao(`rota ${z.id}: id de espécie inválido no pool`);
    if (!texto(p.n, 40)) return nao(`rota ${z.id}: espécie sem nome no pool`);
    // peso pode ser FRACIONÁRIO (é assim que mítico aparece em 0,x%); o que não pode é zero, negativo ou NaN
    if (!(typeof p.p === 'number' && p.p > 0 && p.p <= 99)) return nao(`rota ${z.id}: peso de "${p.n}" fora de 0–99`);
    if (p.f != null && !texto(p.f, 60)) return nao(`rota ${z.id}: nome de forma inválido em "${p.n}"`);
    if (especies.has(p.id)) return nao(`rota ${z.id}: "${p.n}" aparece duas vezes no pool`);
    especies.add(p.id);
    // quem é chefe de raide na forma normal só pode aparecer no Santuário (dados.SO_NO_SANTUARIO)
    if (!z.posVitoria && SO_NO_SANTUARIO.includes(p.n)) return nao(`rota ${z.id}: "${p.n}" só pode aparecer no Santuário`);
  }
  for (const [qual, lista] of [['chefe', z.chefe ? [z.chefe] : []], ['lendarios', z.lendarios || []]]) {
    if (qual === 'lendarios' && !Array.isArray(z.lendarios || [])) return nao(`rota ${z.id}: lendarios não é lista`);
    for (const c of lista) {
      if (!c || typeof c !== 'object') return nao(`rota ${z.id}: ${qual} não é objeto`);
      if (!idDeEspecie(c.id)) return nao(`rota ${z.id}: id de espécie inválido em ${qual}`);
      if (!texto(c.nome, 60)) return nao(`rota ${z.id}: ${qual} sem nome`);
      if (!inteiro(c.nivel) || c.nivel < 1 || c.nivel > 100) return nao(`rota ${z.id}: nível de ${qual} fora de 1–100`);
    }
  }
  if (z.final && !(z.lendarios || []).length) return nao(`rota ${z.id}: é a rota final e não tem lendários (não daria pra fechar a Gen)`);
  // na rota FINAL o "Alfa" são os lendários (nenhuma das 9 tem `chefe`), e o Santuário não tem chefe nenhum
  if (!z.posVitoria && !z.final && !z.chefe) return nao(`rota ${z.id}: sem Alfa (toda rota comum tem o seu)`);
  return { ok: true };
}
// os ids de rota que vão existir depois de aplicar este pacote (os da Gen editada vêm do pacote, o resto de hoje)
function rotasDepoisDoPacote(mapas) {
  const ids = new Set();
  for (const g of GENS) {
    const doPacote = mapas?.[g.gen] ?? mapas?.[String(g.gen)];
    for (const z of doPacote || g.rotas) ids.add(z.id);
  }
  return ids;
}

/* ---- 🎒 itens e 🏅 badges (fase 3) ---- */
/* O EFEITO de um item e a MEDIDA de uma badge são código: `potion` cura 20 porque `ITEMS.potion.heal` é lido por
   `itens.usarItem`, e `mede(ctx)` é uma função. Então o pacote mexe no que é DADO — preço, nome, descrição,
   prêmio — e item novo continua sendo commit. `price: 0` é o botão de desligar: `render.js` só põe na loja o que
   tem preço, e `precoVenda` passa a dar nada por ele. */
export function validarItens(itens) {
  if (itens == null) return { ok: true };
  if (typeof itens !== 'object' || Array.isArray(itens)) return { ok: false, porque: 'itens não é objeto' };
  for (const [id, it] of Object.entries(itens)) {
    if (!ITEMS[id]) return { ok: false, porque: `item que não existe: "${id}" (item novo precisa de código, não de pacote)` };
    if (!it || typeof it !== 'object') return { ok: false, porque: `item ${id} não é objeto` };
    for (const k of Object.keys(it)) if (!['price', 'name', 'desc'].includes(k)) return { ok: false, porque: `item ${id}: só preço, nome e descrição são editáveis (veio "${k}")` };
    if (it.price != null && !(inteiro(it.price) && it.price >= 0 && it.price <= 999999)) return { ok: false, porque: `item ${id}: preço fora de 0–999.999` };
    if (it.name != null && !texto(it.name, 60)) return { ok: false, porque: `item ${id}: nome inválido` };
    if (it.desc != null && !texto(it.desc, 300)) return { ok: false, porque: `item ${id}: descrição inválida` };
  }
  return { ok: true };
}
/* Duas formas no mesmo lugar: id DE FÁBRICA é remendo (só nome, descrição e prêmio), id novo é a badge INTEIRA,
   com a medida lida do dado (`badges.MEDIDAS`). A medida continua não sendo código livre — é um campo daquela
   tabela com um alvo —, então a regra antiga ("badge nova precisa de commit") vale só pra medida que o `ctx` não
   conta ainda. */
const CAMPOS_DA_BADGE = ['nome', 'desc', 'recompensa', 'grupo', 'icone', 'oculta', 'medida'];
export function validarBadges(badges) {
  if (badges == null) return { ok: true };
  if (typeof badges !== 'object' || Array.isArray(badges)) return { ok: false, porque: 'badges não é objeto' };
  for (const [id, b] of Object.entries(badges)) {
    const nova = !BADGES_DE_FABRICA[id];
    if (!b || typeof b !== 'object') return { ok: false, porque: `badge ${id} não é objeto` };
    const permitidos = nova ? CAMPOS_DA_BADGE : ['nome', 'desc', 'recompensa'];
    for (const k of Object.keys(b)) if (!permitidos.includes(k)) {
      return { ok: false, porque: nova ? `badge ${id}: campo desconhecido "${k}"` : `badge ${id}: só nome, descrição e recompensa são editáveis (veio "${k}")` };
    }
    if (nova) {
      if (!ID_ROTA.test(id)) return { ok: false, porque: `badge ${id}: id tem de ser letra minúscula, número e hífen (2 a 40)` };
      if (!texto(b.nome, 60)) return { ok: false, porque: `badge ${id}: badge nova precisa de nome` };
      if (!texto(b.desc, 300)) return { ok: false, porque: `badge ${id}: badge nova precisa de descrição` };
      if (!texto(b.grupo, 40)) return { ok: false, porque: `badge ${id}: badge nova precisa de grupo` };
      // ícone é um EMOJI e cai dentro de HTML. As telas escapam, mas o filtro aqui também: é a mesma lição do
      // `urlDeImagem` — duas camadas, porque cada uma sozinha já falhou uma vez.
      if (!texto(b.icone, 8) || /[<>&"'`\\]/.test(b.icone)) return { ok: false, porque: `badge ${id}: ícone tem de ser um emoji (sem < > & " ' \` \\)` };
      if (b.oculta != null && typeof b.oculta !== 'boolean') return { ok: false, porque: `badge ${id}: oculta tem de ser sim ou não` };
      const md = b.medida;
      if (!md || typeof md !== 'object' || Array.isArray(md)) return { ok: false, porque: `badge ${id}: medida faltando` };
      for (const k of Object.keys(md)) if (!['campo', 'alvo', 'especie'].includes(k)) return { ok: false, porque: `badge ${id}: medida com campo desconhecido "${k}"` };
      const def = MEDIDAS[md.campo];
      if (!def) return { ok: false, porque: `badge ${id}: medida "${md.campo}" não existe (medida nova precisa de código)` };
      if (def.especie && !texto(md.especie, 40)) return { ok: false, porque: `badge ${id}: esta medida precisa de uma espécie` };
      if (!def.especie && md.especie != null) return { ok: false, porque: `badge ${id}: a medida "${md.campo}" não usa espécie` };
      if (!(inteiro(md.alvo) && md.alvo >= 1 && md.alvo <= 999999999)) return { ok: false, porque: `badge ${id}: alvo fora de 1–999.999.999` };
    } else {
      if (b.nome != null && !texto(b.nome, 60)) return { ok: false, porque: `badge ${id}: nome inválido` };
      if (b.desc != null && !texto(b.desc, 300)) return { ok: false, porque: `badge ${id}: descrição inválida` };
    }
    const r = validarPremio(`badge ${id}`, b.recompensa);
    if (!r.ok) return r;
  }
  return { ok: true };
}

/* ---- 🎵 música ---- */
/* `musica: { temas: { bioma: {raiz, escala, acordes, melodia, onda?} }, contextos: { tela: {bpm, densidade,
   onda?, melodiaFixa?} } }`. Chave desconhecida é RECUSA, não "ignora": bioma vem de `cenario.CLIMAS` e contexto
   de `CONTEXTOS` — chave fora dessas listas é erro de digitação, e um tema que nunca toca é pior que um erro.

   O teto de agudo (880 Hz) é cobrado AQUI porque `tests/som.test.js` só varre as tabelas do repositório: tema que
   chega pela nuvem não passa por teste nenhum, e o passa-baixa da saída corta em 2 kHz justamente porque
   estridente foi a primeira queixa de quem jogou. Validar é mais barato que um ouvido machucado. */
export function validarMusica(musica) {
  if (musica == null) return { ok: true };
  if (typeof musica !== 'object' || Array.isArray(musica)) return { ok: false, porque: 'musica não é objeto' };

  // uma frase: 16 tokens, cada um grau/silêncio/segurar, e não começa segurando uma nota que não existe
  const frase = (onde, txt) => {
    if (typeof txt !== 'string') return `${onde}: melodia não é texto`;
    const p = lerMelodia(txt);
    if (p.length !== PASSOS_DO_COMPASSO) return `${onde}: ${p.length} passos (o compasso é de ${PASSOS_DO_COMPASSO})`;
    if (p[0] === '-') return `${onde}: a frase não pode começar segurando uma nota que não existe`;
    for (const tok of p) {
      if (tok === '.' || tok === '-') continue;
      if (!inteiro(Number(tok)) || Number(tok) < 0 || Number(tok) > 24) return `${onde}: token "${tok}" inválido`;
    }
    return null;
  };

  if (musica.temas != null) {
    if (typeof musica.temas !== 'object' || Array.isArray(musica.temas)) return { ok: false, porque: 'musica.temas não é objeto' };
    for (const [bioma, t] of Object.entries(musica.temas)) {
      if (!TEMAS[bioma]) return { ok: false, porque: `tema de bioma que não existe: "${bioma}"` };
      if (!t || typeof t !== 'object') return { ok: false, porque: `tema ${bioma} não é objeto` };
      if (!inteiro(t.raiz) || t.raiz < RAIZ.min || t.raiz > RAIZ.max) return { ok: false, porque: `tema ${bioma}: raiz fora de ${RAIZ.min}–${RAIZ.max}` };
      const escala = ESCALAS[t.escala];
      if (!escala) return { ok: false, porque: `tema ${bioma}: escala "${t.escala}" não existe` };
      if (!Array.isArray(t.acordes) || t.acordes.length !== ACORDES_NA_PROGRESSAO) return { ok: false, porque: `tema ${bioma}: a progressão é de ${ACORDES_NA_PROGRESSAO} compassos` };
      for (const a of t.acordes) if (!inteiro(a) || a < 0 || a > 11) return { ok: false, porque: `tema ${bioma}: acorde fora de 0–11 semitons` };
      if (t.onda != null && !ONDAS.includes(t.onda)) return { ok: false, porque: `tema ${bioma}: onda "${t.onda}" não existe` };
      const erro = frase(`tema ${bioma}`, t.melodia);
      if (erro) return { ok: false, porque: erro };
      if (maisAgudo(t.raiz, escala, t.melodia) > MIDI_MAIS_AGUDO) return { ok: false, porque: `tema ${bioma}: passa do teto de agudo (880 Hz)` };
    }
  }

  if (musica.contextos != null) {
    if (typeof musica.contextos !== 'object' || Array.isArray(musica.contextos)) return { ok: false, porque: 'musica.contextos não é objeto' };
    for (const [qual, c] of Object.entries(musica.contextos)) {
      if (!CONTEXTOS[qual]) return { ok: false, porque: `contexto que não existe: "${qual}"` };
      if (!c || typeof c !== 'object') return { ok: false, porque: `contexto ${qual} não é objeto` };
      if (!inteiro(c.bpm) || c.bpm < 40 || c.bpm > 200) return { ok: false, porque: `contexto ${qual}: bpm fora de 40–200` };
      if (!(typeof c.densidade === 'number' && c.densidade > 0 && c.densidade <= 1)) return { ok: false, porque: `contexto ${qual}: densidade fora de 0–1` };
      if (c.onda != null && !ONDAS.includes(c.onda)) return { ok: false, porque: `contexto ${qual}: onda "${c.onda}" não existe` };
      if (c.melodiaFixa != null && c.melodiaFixa !== '') {
        const erro = frase(`contexto ${qual}`, c.melodiaFixa);
        if (erro) return { ok: false, porque: erro };
        /* A frase fixa toca sobre a escala de QUALQUER tema, então o teto vale no pior caso: a raiz mais alta
           permitida contra cada escala. É a mesma conta do teste da `melodiaFixa` em tests/som.test.js. */
        for (const [nome, escala] of Object.entries(ESCALAS)) {
          if (maisAgudo(RAIZ.max, escala, c.melodiaFixa) > MIDI_MAIS_AGUDO) {
            return { ok: false, porque: `contexto ${qual}: passa do teto de agudo (880 Hz) em ${nome}` };
          }
        }
      }
    }
  }
  return { ok: true };
}

/* ---- aplicar ---- */
/* Muta `GENS` e `MISSOES` no lugar. Devolve o que mudou, pra quem chama narrar e pra `conteudo-nuvem` decidir se
   isso é seguro no meio de uma jornada. NÃO valida: quem chama valida antes (senão o `aplicar` teria de decidir o
   que fazer com meia config, que é justamente o que a gente não quer). */
export function aplicarConteudo(pacote) {
  const alfas = pacote.alfas || {}, missoes = pacote.missoesRota || [];

  /* Os MAPAS vêm primeiro, e os Alfas depois: `alfas` é um ajuste POR CIMA da rota, então trocar a lista de
     rotas depois dele jogaria a troca de Alfa no lixo. Mesma razão pela qual as missões vêm depois — elas
     apontam pra rota por id. */
  const rotasTrocadas = aplicarMapas(pacote.mapas);

  /* Reconstrói `GENS` do ZERO a partir de `dados-mapas`? Não: `dados.js` já aplicou `semChefeDeRaide` e o Alfa de
     fábrica, e refazer isso aqui duplicaria aquela regra (a segunda cópia é a que fica velha). Em vez disso, o
     Alfa é escrito sobre o que está lá — e o que vem no pacote é um ajuste por cima, exatamente como `ALFAS`
     sempre foi. O preço é que um pacote não VOLTA um Alfa pro de fábrica dentro da mesma sessão; o `boot` aplica
     uma vez, sobre as tabelas recém-carregadas, então na prática a sessão seguinte já nasce certa. */
  let alfasTrocados = 0;
  for (const g of GENS) for (const z of g.rotas) {
    const a = alfas[z.id];
    if (a && z.chefe) { z.chefe = { ...z.chefe, ...a }; alfasTrocados++; }
  }

  /* As globais também são mutadas NO LUGAR (`perfil-dados.js` e `conteudo.js` guardam a referência), e ausentes
     voltam pro de fábrica — igual à música. Vazia é recusada na validação: ausente já quer dizer "as de fábrica". */
  MISSOES_GLOBAIS.length = 0;
  MISSOES_GLOBAIS.push(...(pacote.missoesGlobais || GLOBAIS_DE_FABRICA).map(m => JSON.parse(JSON.stringify(m))));

  // MISSOES = [...globais, ...de rota]: as globais ficam na frente (é a ordem que `situacaoMissoes` percorre)
  MISSOES.length = 0;
  MISSOES.push(...MISSOES_GLOBAIS, ...missoes);

  const itens = aplicarRemendo(ITEMS, ITENS_DE_FABRICA, pacote.itens, ['price', 'name', 'desc']);
  const badges = aplicarRemendo(indicePorId(BADGES), BADGES_DE_FABRICA, pacote.badges, ['nome', 'desc', 'recompensa'])
    + aplicarBadgesNovas(pacote.badges);
  const musica = aplicarMusica(pacote.musica);

  return {
    alfasTrocados, missoes: missoes.length, globais: MISSOES_GLOBAIS.length,
    rotasTrocadas, itens, badges, musica, versao: pacote.versao
  };
}

/* ---- 🗺 mapas (fase 2) ---- */
/* Troca a lista de rotas de cada Gen que o pacote traz, e volta pro de fábrica a Gen que ele não traz (mas que um
   pacote anterior desta MESMA sessão trocou — o `boot` aplica o cache e depois a nuvem).
   A foto de fábrica é tirada aqui, na primeira troca daquela Gen: ela tem de ser do estado DEPOIS de
   `mapas.tirarIniciais`, que roda no import e é o mapa que o jogo realmente joga. */
const clonar = v => JSON.parse(JSON.stringify(v));
// só os campos conhecidos, e copiados: o objeto do pacote é o mesmo que está no cache, e `mapas.completarPool`
// MUTA `z.pool` — sem a cópia, aplicar duas vezes acumularia espécie emprestada dentro do pacote guardado.
const sanearRota = (gen, z) => {
  const out = {};
  for (const k of CAMPOS_DA_ROTA) if (z[k] !== undefined) out[k] = clonar(z[k]);
  out.gen = gen;
  return out;
};
function aplicarMapas(mapas) {
  let trocadas = 0;
  for (const g of GENS) {
    const nova = mapas?.[g.gen] ?? mapas?.[String(g.gen)];
    if (nova && !fabricaDaGen.has(g.gen)) fabricaDaGen.set(g.gen, g.rotas.map(z => clonar(z)));
    const lista = nova || fabricaDaGen.get(g.gen);
    if (!lista) continue;                          // Gen que nenhum pacote tocou: fica como está
    g.rotas.length = 0;
    g.rotas.push(...lista.map(z => sanearRota(g.gen, z)));
    if (nova) trocadas += lista.length;
  }
  return trocadas;
}

/* ---- 🎒 itens e 🏅 badges (fase 3) ---- */
/* Um remendo por chave, sobre uma tabela de objetos: campo que o pacote traz vence, campo que ele não traz volta
   pro de fábrica. Serve pros dois porque a forma é a mesma (`ITEMS` é objeto por id, `BADGES` é lista com `id`),
   e o que muda é só a lista de campos editáveis. */
const indicePorId = lista => Object.fromEntries(lista.map(x => [x.id, x]));
function aplicarRemendo(tabela, fabrica, patch, campos) {
  let trocados = 0;
  for (const [id, base] of Object.entries(fabrica)) {
    const alvo = tabela[id];
    if (!alvo) continue;
    const novo = patch?.[id];
    if (novo) trocados++;
    for (const k of campos) {
      const v = novo?.[k] !== undefined ? novo[k] : base[k];
      // `undefined` de fábrica = a chave não existe (badge sem recompensa): apagar, não escrever undefined
      if (v === undefined) delete alvo[k];
      else alvo[k] = clonar(v);
    }
  }
  return trocados;
}

/* Badge NOVA é uma LINHA A MAIS em `BADGES`, não um remendo: o id não existe de fábrica, então a linha inteira vem
   no pacote e a medida é dado (`badges.medirPorDado` resolve na hora de medir). Toda aplicação limpa as de pacote
   anterior primeiro — badge despublicada tem de SAIR da tela, e sem isso ela ficaria no ar até o F5. */
function aplicarBadgesNovas(patch) {
  for (let i = BADGES.length - 1; i >= 0; i--) if (!BADGES_DE_FABRICA[BADGES[i].id]) BADGES.splice(i, 1);
  let novas = 0;
  for (const [id, b] of Object.entries(patch || {})) {
    if (BADGES_DE_FABRICA[id]) continue;
    BADGES.push({ ...clonar(b), id });
    novas++;
  }
  return novas;
}

/* Muta `TEMAS`/`CONTEXTOS` no lugar (mesmo motivo de `GENS`: o motor de som já guardou a referência). SEMPRE
   começa do de fábrica — ao contrário dos Alfas, aqui dá pra voltar atrás, porque a tabela inteira cabe no
   pacote. `escala` chega como NOME e vira o array que o motor toca. */
function aplicarMusica(musica) {
  const temas = musica?.temas || {}, contextos = musica?.contextos || {};
  let trocados = 0;
  /* O que vem no pacote é o tema INTEIRO, não um remendo: a validação exige raiz, escala, acordes e melodia, e
     `onda`/`melodiaFixa` ausentes querem dizer "herda do contexto" / "sem frase fixa". Por isso é `t || fabrica`
     e não `{ ...fabrica, ...t }` — com o spread, um tema publicado sem `onda` ficaria com a onda de fábrica pra
     sempre, sem jeito de voltar a herdar. A chave morta é APAGADA antes de escrever, por isso. */
  for (const [bioma, fabrica] of Object.entries(MUSICA_DE_FABRICA.temas)) {
    const t = temas[bioma];
    if (t) trocados++;
    const { escala, ...resto } = t || fabrica;
    delete TEMAS[bioma].onda;
    Object.assign(TEMAS[bioma], resto, { escala: ESCALAS[escala] || ESCALAS[nomeDaEscala(fabrica.escala)] });
  }
  for (const [qual, fabrica] of Object.entries(MUSICA_DE_FABRICA.contextos)) {
    const c = contextos[qual];
    if (c) trocados++;
    delete CONTEXTOS[qual].melodiaFixa;
    delete CONTEXTOS[qual].onda;
    Object.assign(CONTEXTOS[qual], c || fabrica);
  }
  return trocados;
}

/* ---- aplicar no meio de uma jornada é seguro? ---- */
/* Decisão do usuário: "na hora, só se não quebrar nada". Quebra quando a jornada em andamento DEPENDE do que
   mudou — e as duas dependências reais são:
     1. missão que o jogador já começou a cumprir e que o pacote mudou ou removeu (progresso que vira impossível,
        ou pior, que fica contado pra uma missão que não existe mais);
     2. rota em que ele está agora, se o Alfa dela mudou (o Alfa já em campo não pode virar outro bicho).
   Qualquer uma delas → o pacote fica guardado e entra na jornada seguinte. Puro de propósito: é a regra mais
   fácil de errar do sistema inteiro, e errar significa travar a missão de alguém. */
export function podeAplicarAgora(pacote, S) {
  if (!S) return { pode: true, porque: 'sem jornada em andamento' };

  /* 3. O MAPA em que ele está agora (fase 2). Regra grossa de propósito: se o pacote traz a Gen da jornada e a
     lista de rotas dela é DIFERENTE da de agora, espera a jornada seguinte. Dava pra ser fino (só se a rota atual
     mudou, só se o pool da rota atual encolheu), mas a run guarda registro de Pokédex por rota, missão de rota,
     caça shiny com espécie alvo, rota esgotada e `S.zona` — cinco coisas penduradas na lista, e errar uma trava a
     jornada de alguém. Gen diferente da dele aplica na hora, que é o caso comum. */
  const genDaJornada = S.gen || 1;
  const doPacote = pacote.mapas?.[genDaJornada] ?? pacote.mapas?.[String(genDaJornada)];
  if (doPacote) {
    const agora = GENS.find(g => g.gen === genDaJornada)?.rotas || [];
    const mesmo = JSON.stringify(agora.map(z => sanearRota(genDaJornada, z)))
      === JSON.stringify(doPacote.map(z => sanearRota(genDaJornada, z)));
    if (!mesmo) return { pode: false, porque: `as rotas da Gen ${genDaJornada}, onde a sua jornada está, mudariam` };
  }

  const traGlobais = pacote.missoesGlobais != null;
  const novas = new Map([...(pacote.missoesRota || []), ...(pacote.missoesGlobais || [])].map(m => [m.id, m]));

  // o que o jogador já tocou: missão entregue não conta (o prêmio já foi), missão com progresso conta
  const progresso = S.missoes || {};
  for (const [id, estado] of Object.entries(progresso)) {
    if (!estado || estado === 'entregue') continue;
    const antes = MISSOES.find(m => m.id === id);
    if (!antes) continue;
    // global sem `missoesGlobais` no pacote = ela não muda (ausente quer dizer "as de fábrica", que é o que vale)
    if (!traGlobais && MISSOES_GLOBAIS.some(m => m.id === id)) continue;
    const depois = novas.get(id);
    if (!depois) return { pode: false, porque: `a missão "${id}" que você começou sairia do jogo` };
    if (JSON.stringify(depois.objetivo) !== JSON.stringify(antes.objetivo)) {
      return { pode: false, porque: `o objetivo da missão "${id}", que você já começou, mudaria` };
    }
  }

  const alfas = pacote.alfas || {};
  if (S.zona && alfas[S.zona]) {
    const atual = GENS.flatMap(g => g.rotas).find(z => z.id === S.zona);
    const a = alfas[S.zona];
    if (atual?.chefe && (a.id != null && a.id !== atual.chefe.id)) {
      return { pode: false, porque: `o Alfa da rota em que você está (${S.zona}) mudaria de espécie` };
    }
  }
  return { pode: true, porque: 'nada em andamento depende do que mudou' };
}
