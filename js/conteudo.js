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

export const pacoteDeFabrica = () => ({
  formato: VERSAO_PACOTE,
  versao: 0,
  alfas: {},
  missoesRota: MISSOES_ROTA.map(m => ({ ...m })),
  musica: copiaDaMusica()
});
export { MUSICA_DE_FABRICA };

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
  const m = validarMusica(p.musica);
  if (!m.ok) return m;

  return { ok: true, pacote: p };
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

  const musica = aplicarMusica(pacote.musica);

  return { alfasTrocados, missoes: missoes.length, musica, versao: pacote.versao };
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
