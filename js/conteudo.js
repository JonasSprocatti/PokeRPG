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
import { GENS, MISSOES, MISSOES_GLOBAIS } from './dados.js';
import { MISSOES_ROTA } from './dados-rotas.js';

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
export const pacoteDeFabrica = () => ({
  formato: VERSAO_PACOTE,
  versao: 0,
  alfas: {},
  missoesRota: MISSOES_ROTA.map(m => ({ ...m }))
});

/* ---- validação ---- */
/* Devolve `{ ok: true, pacote }` ou `{ ok: false, porque }`. O `porque` não é decoração: um pacote recusado em
   silêncio é indistinguível de "a nuvem está fora", e foi assim que um `try` largo demais já custou horas ao
   jogador. Quem chama REGISTRA o motivo. */
export function validarPacote(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return { ok: false, porque: 'pacote não é um objeto' };
  if (p.formato !== VERSAO_PACOTE) return { ok: false, porque: `formato ${p.formato} desconhecido (esperado ${VERSAO_PACOTE})` };
  if (!inteiro(p.versao) || p.versao < 0) return { ok: false, porque: 'versão não é inteiro >= 0' };

  const rotasQueExistem = new Set(GENS.flatMap(g => g.rotas.map(z => z.id)));

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
    const vistos = new Set(), globais = new Set(MISSOES_GLOBAIS.map(m => m.id));
    for (const m of p.missoesRota) {
      if (!m || typeof m !== 'object') return { ok: false, porque: 'missão não é objeto' };
      if (!texto(m.id, 60)) return { ok: false, porque: 'missão sem id' };
      if (vistos.has(m.id)) return { ok: false, porque: `missão repetida: "${m.id}"` };
      if (globais.has(m.id)) return { ok: false, porque: `missão de rota com id de missão global: "${m.id}"` };
      vistos.add(m.id);
      if (!texto(m.nome, 80) || !texto(m.desc, 300)) return { ok: false, porque: `missão ${m.id}: nome ou descrição inválidos` };
      if (!inteiro(m.gen) || m.gen < 1 || m.gen > GENS.length) return { ok: false, porque: `missão ${m.id}: gen ${m.gen} não existe` };
      if (!ID_ROTA.test(m.rota || '') || !rotasQueExistem.has(m.rota)) return { ok: false, porque: `missão ${m.id}: rota "${m.rota}" não existe` };
      if (!m.objetivo || typeof m.objetivo !== 'object') return { ok: false, porque: `missão ${m.id}: sem objetivo` };
      const alvos = m.objetivo.alvos;
      if (alvos != null) {
        if (!Array.isArray(alvos) || !alvos.length) return { ok: false, porque: `missão ${m.id}: alvos vazio` };
        for (const a of alvos) {
          if (!Array.isArray(a) || a.length !== 2) return { ok: false, porque: `missão ${m.id}: alvo malformado` };
          if (!texto(a[0], 40)) return { ok: false, porque: `missão ${m.id}: espécie inválida` };
          // teto por espécie: alvo de 0 nunca completa, e alvo gigante trava a missão pra sempre
          if (!inteiro(a[1]) || a[1] < 1 || a[1] > 999) return { ok: false, porque: `missão ${m.id}: quantidade fora de 1–999` };
        }
      }
    }
  }
  return { ok: true, pacote: p };
}

/* ---- aplicar ---- */
/* Muta `GENS` e `MISSOES` no lugar. Devolve o que mudou, pra quem chama narrar e pra `conteudo-nuvem` decidir se
   isso é seguro no meio de uma jornada. NÃO valida: quem chama valida antes (senão o `aplicar` teria de decidir o
   que fazer com meia config, que é justamente o que a gente não quer). */
export function aplicarConteudo(pacote) {
  const alfas = pacote.alfas || {}, missoes = pacote.missoesRota || [];

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

  // MISSOES = [...globais, ...de rota]: as globais ficam na frente (é a ordem que `situacaoMissoes` percorre)
  MISSOES.length = 0;
  MISSOES.push(...MISSOES_GLOBAIS, ...missoes);

  return { alfasTrocados, missoes: missoes.length, versao: pacote.versao };
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
  const novas = new Map((pacote.missoesRota || []).map(m => [m.id, m]));

  // o que o jogador já tocou: missão entregue não conta (o prêmio já foi), missão com progresso conta
  const progresso = S.missoes || {};
  for (const [id, estado] of Object.entries(progresso)) {
    if (!estado || estado === 'entregue') continue;
    const antes = MISSOES.find(m => m.id === id);
    if (!antes || MISSOES_GLOBAIS.some(m => m.id === id)) continue;   // global não vem no pacote
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
