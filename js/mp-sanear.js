/* ============ sala: o que chega da rede não é confiável ============
   O canal Realtime de uma sala é um BROADCAST com a chave anônima: quem está na sala manda o que quiser, e o
   Supabase não assina o remetente. Até 29/09/2026 a sala confiava no pacote: `aoReceberEstado` gravava
   `sala.batalha = p.batalha` e a tela desenhava aquilo direto. Três consequências reais:

   1. **Script na página dos outros.** O HTML da sala escapa os TEXTOS, mas número era número por fé:
      `Nv. ${m.level}`, `${m.hp}/${m.stats.hp}`, `Turno ${b.turno}`. Um `level` valendo `<img src=x onerror=…>`
      rodava JavaScript em todo mundo da sala — e a sessão do Supabase fica no localStorage, então isso é a conta
      da pessoa, não só a sala. Pior ainda: o endereço da sprite entrava DENTRO de um `onerror="…src='AQUI'"`,
      onde uma apóstrofe já é código.
   2. **Save estragado sem querer.** `S.money += p.recompensas[eu].dinheiro` com texto do outro lado transforma o
      dinheiro da run em `"500<script>"` — e isso é gravado no save e sobe pra nuvem.
   3. **Tela em branco.** `p.batalha.turno` num pacote sem `batalha` estoura dentro do ouvinte do canal, onde
      ninguém pega o erro.

   A defesa é aqui, na ENTRADA, e é burra de propósito: `saneado()` desce o pacote inteiro e garante que número é
   número finito, texto é texto curto sem `< > "`, e endereço de imagem é `https` de um dos servidores de sprite
   que o jogo usa. Nada de lista de campos permitidos: o estado da batalha tem dezenas deles e uma lista assim
   fica desatualizada na primeira mecânica nova — o que vale é o TIPO de cada folha, não o nome dela.

   Módulo puro (sem DOM, sem rede, sem `G`), testado em tests/mp-sanear.test.js.

   O que isto NÃO é: autenticação. Não existe como provar quem mandou um broadcast, então `doAnfitriao()` só
   rejeita a mentira ingênua (dizer-se outra pessoa). O que impede o estrago é o saneamento — que vale igual pra
   pacote maldoso, pra versão antiga do jogo e pra bug do próprio anfitrião. */

// Os dois servidores de sprite que o jogo usa (dados.js: SPRITES e ORIGEM_ANTIGA). Fora daqui, endereço nenhum.
export const HOSTS_DE_IMAGEM = ['cdn.jsdelivr.net', 'raw.githubusercontent.com'];
// Campos cujo valor é endereço de imagem (api.slimPokemon: sprite, back, art)
const CAMPOS_DE_IMAGEM = new Set(['sprite', 'back', 'art']);

/* Campos que ENTRAM EM CONTA do outro lado. Deixar texto aqui não é XSS (o resto do módulo já tirou o `<`), é
   pior de um jeito silencioso: `S.money += r.dinheiro` com `"500"` faz o dinheiro da run virar `"100500"`, um
   texto — e isso é gravado no save e sobe pra nuvem, onde nenhuma tela vai entender mais aquele campo.
   É por NOME de chave, não por caminho: `hp` é sempre número, esteja em `m.hp`, `stats.hp` ou `base.hp`.
   `id` ficou DE FORA de propósito: na presença o `id` do jogador é um uuid (texto), e forçar número ali
   arrebentaria a sala inteira. O ícone, que é o `id` numérico de verdade, é tratado em `membroDaRede`. */
const CAMPOS_NUMERICOS = new Set(['hp', 'level', 'turno', 'prazo', 'slot', 'sleep', 'frac', 'pp', 'ppLeft',
  'power', 'acc', 'xp', 'dinheiro', 'chefeNivel', 'nivelLuta', 'fase', 'atk', 'def', 'spa', 'spd', 'spe']);

/* Tetos com folga de propósito: eles existem contra pacote ABSURDO (lista de um milhão de itens, aninhamento
   fundo pra estourar a pilha), não pra apertar o estado de verdade. O maior estado real é uma sala de 6 × 3 =
   18 Pokémon com a narração do turno; o mais fundo é `batalha.lados.A[i].data.effort.atk`. Cortar dado legítimo
   aqui seria um bug invisível — daí a distância entre o real e o teto. */
export const MAX_TEXTO = 400, MAX_URL = 400, MAX_LISTA = 400, MAX_CAMPOS = 300, MAX_FUNDO = 20;

/* Texto de fora: sem `< > "`, e curto. O `esc()` do render continua valendo — isto é a segunda linha, pra
   quando o texto cair num lugar que esqueceu de escapar (foi exatamente o que aconteceu com os números).
   Apelido com `<3` viraria `3`: é uma perda cosmética que eu aceito pra não depender de `esc()` em 40 lugares. */
export const textoDeRede = (v, max = MAX_TEXTO) => String(v).replace(/[<>"]/g, '').slice(0, max);

/* Aspa, apóstrofe, barra invertida, sinal de maior/menor e espaço: nenhum deles existe em endereço de sprite, e
   qualquer um deles escapa do lugar onde o endereço é escrito (`src="AQUI"` ou `onerror="…src='AQUI'"`).
   **`new URL()` NÃO resolve isso**: ela aceita `https://cdn.jsdelivr.net/…/1';alert(1)//.png`, com host
   legítimo, e devolve a apóstrofe intacta no `href` — o host estar na lista não diz nada sobre o CAMINHO. Foi o
   furo do primeiro conserto desta auditoria: bastava o `id` do Pokémon vir torto pra `SPR_ANIM` montar sozinha
   um endereço com código dentro. */
const CARACTERE_PROIBIDO_EM_URL = /['"<>\\\s`]/;

/* Endereço de imagem: só `https://` de um host da lista e sem nenhum caractere de escape no meio. Qualquer
   outra coisa (inclusive `javascript:` e `data:`) vira string vazia, e quem desenha cai no plano B que já
   existia pra sprite que não carrega. */
export function urlDeImagem(v) {
  if (typeof v !== 'string' || v.length > MAX_URL || CARACTERE_PROIBIDO_EM_URL.test(v)) return '';
  let u;
  try { u = new URL(v); } catch { return ''; }
  if (u.protocol !== 'https:' || !HOSTS_DE_IMAGEM.includes(u.hostname)) return '';
  return CARACTERE_PROIBIDO_EM_URL.test(u.href) ? '' : u.href;   // a normalização pode desencodar: confere de novo
}

/* Desce o pacote inteiro trocando cada folha pela versão segura do MESMO tipo. Só existe tipo de JSON aqui
   (o broadcast chega decodificado), então a varredura é total: nada passa sem ser olhado.
   `campo` é o nome da chave que trouxe o valor — é o que decide se um texto é endereço de imagem. */
export function saneado(v, campo = '', fundo = 0) {
  if (v === null) return null;
  // folha de campo que entra em conta: número finito ou 0. `pp` é lista em `final[x].pp` — lista cai na recursão
  // abaixo e cada item volta aqui com o mesmo `campo`, então tanto `ppLeft: 3` quanto `pp: [35, 20]` saem certos.
  if (CAMPOS_NUMERICOS.has(campo) && typeof v !== 'object') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') return CAMPOS_DE_IMAGEM.has(campo) ? urlDeImagem(v) : textoDeRede(v);
  if (fundo >= MAX_FUNDO) return null;   // aninhamento absurdo: um pacote fundo demais é ataque, não estado
  if (Array.isArray(v)) return v.slice(0, MAX_LISTA).map(x => saneado(x, campo, fundo + 1));
  if (typeof v === 'object') {
    const fora = {};
    /* `undefined` é PULADO, não virado em null: é o que o JSON da rede já faz (a chave desaparece), e casar com
       isso mantém o pacote saneado idêntico ao que o outro lado mandou. Vale porque o anfitrião sanea a própria
       presença junto com a dos outros — `fotoDoMon` deixa campos indefinidos (`golpe.target`), e transformá-los
       em `null` faria o objeto local divergir do que viaja, por nada. */
    for (const [k, x] of Object.entries(v).slice(0, MAX_CAMPOS)) {
      if (x === undefined) continue;
      fora[textoDeRede(k, 60)] = saneado(x, k, fundo + 1);
    }
    return fora;
  }
  return null;   // function/undefined/symbol não vêm de JSON, mas não custa fechar a porta
}

const ehObjeto = v => !!v && typeof v === 'object' && !Array.isArray(v);
// um estado de batalha tem os dois lados como lista e um turno: sem isso o pacote não é estado de nada
const ehBatalha = b => ehObjeto(b) && ehObjeto(b.lados) && Array.isArray(b.lados.A) && Array.isArray(b.lados.B) && typeof b.turno === 'number';

/* As quatro portas. Cada uma devolve o pacote saneado ou `null` — e `null` quer dizer "joga fora e não faz
   nada", nunca "usa como veio". Quem chama não precisa mais de `?.` defensivo. */
export function estadoDaRede(p) {
  if (!ehObjeto(p) || !ehBatalha(p.batalha)) return null;
  const s = saneado(p);
  return ehBatalha(s.batalha) ? s : null;
}
export function fimDaRede(p) {
  if (!ehObjeto(p) || !ehObjeto(p.final)) return null;
  return saneado(p);
}
export function pingDaRede(p) {
  if (!ehObjeto(p) || typeof p.turno !== 'number') return null;
  return saneado(p);
}
export function chatDaRede(p) {
  if (!ehObjeto(p) || typeof p.texto !== 'string' || !p.texto.trim()) return null;
  return saneado(p);
}
export function lobbyDaRede(p) {
  if (!ehObjeto(p) || !ehObjeto(p.config)) return null;
  return saneado(p);
}
/* Escolha de um jogador. `golpe` é ÍNDICE numa lista de golpes: aceitar texto ali deixa o motor buscar campo de
   objeto por nome (`moves['constructor']`). -1 é o Struggle, então o piso é -1. */
export function acaoDaRede(p) {
  if (!ehObjeto(p) || !ehObjeto(p.acao) || typeof p.acao.tipo !== 'string') return null;
  const s = saneado(p);
  if ('golpe' in s.acao) {
    const i = Math.trunc(Number(s.acao.golpe));
    if (!Number.isFinite(i) || i < -1 || i > 64) return null;
    s.acao.golpe = i;
  }
  return s;
}
/* Presença: o payload que cada um anuncia sobre si (nome, ícone, Pokémon). O ícone entra num endereço de sprite
   montado por `SPR` a partir do id, então ele tem de ser um número inteiro de Pokédex — com texto ali, o endereço sai
   torto e cai dentro do `onerror`. */
export function membroDaRede(m) {
  if (!ehObjeto(m)) return null;
  const s = saneado(m);
  if (ehObjeto(s.icone)) {
    const id = Math.trunc(Number(s.icone.id));
    s.icone = { id: Number.isFinite(id) && id >= 1 && id <= 1025 ? id : 25, shiny: !!s.icone.shiny };
  }
  return s;
}

/* Veio de quem diz ter vindo? Só o anfitrião publica estado, fim, lobby e pulso. Broadcast não tem remetente
   assinado, então isto NÃO é prova — é o mesmo tipo de checagem de um "de:" de e-mail. Vale porque:
   • pega o engano honesto (dois anfitriões depois de uma reconexão bagunçada);
   • pega a forja ingênua (mandar `fim` com vitória sem se passar por ninguém);
   • e custa uma linha.
   Pacote SEM `de` passa: é a versão antiga do jogo, que não manda esse campo, e derrubar a sala de quem ainda
   não atualizou seria pior que o problema. Quem protege de verdade é `saneado()`. */
export function doAnfitriao(p, idDoAnfitriao) {
  if (!idDoAnfitriao) return true;            // ainda não sei quem hospeda (presença não sincronizou): aceito
  const de = p && typeof p === 'object' ? p.de : null;
  return de == null || de === idDoAnfitriao;
}
