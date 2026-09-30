/* ============ som: cries + música procedural (pedido do usuário) ============ */
// Desligado por padrão — só liga quem escolher em ⚙ Ajustes (localStorage 'pokerpg-som', como fonte/sprite em
// ajustes.js). Dois efeitos, os dois calados se `somLigado()` for falso:
//   - CRY: o grito de quem aparece na luta (PokéAPI, espelhado no jsDelivr — dados.CRY, mesma ideia do sprite).
//   - MÚSICA: NASCE na hora com a Web Audio API, nunca é arquivo pronto. Trilha original teria direito autoral, e
//     bibliotecas de live coding (Strudel/TidalCycles, que inspiraram a ideia) trariam dependência — o projeto é
//     JS puro sem build. Em vez disso: um compositor pequeno por PADRÕES (escala + progressão de acordes +
//     andamento por contexto de tela, TINGIDO pelo tema da rota), osciladores puros, escrito do zero aqui.
// Roda só no navegador: `motor()` devolve null fora dele (Node/testes), e toda função vira no-op.
import { store, pick } from './util.js';
import { CRY } from './dados.js';
import { climaDaRota } from './cenario.js';

export const SOM_KEY = 'pokerpg-som';
export const somLigado = () => store.get(SOM_KEY) === true;

/* `filtro` é um passa-baixa na saída de TUDO: sem ele, onda quadrada e dente-de-serra jogam harmônico agudo
   direto no alto-falante e a trilha fica estridente (foi o primeiro retorno de quem jogou). Corta em 2 kHz —
   o chiptune continua com a cara certa, só sem a parte que dói no ouvido. */
let ctx = null, master = null, filtro = null;
function motor() {
  if (typeof window === 'undefined' || !window.AudioContext) return null;
  if (!ctx) {
    ctx = new AudioContext();
    filtro = ctx.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.value = 2000; filtro.Q.value = 0.6;
    master = ctx.createGain(); master.gain.value = 0.26;
    master.connect(filtro); filtro.connect(ctx.destination);
  }
  return ctx;
}

/* ---- cries ----
   Decodificado UMA vez e guardado (`buffers`), tocado pela Web Audio: `new Audio(url).play()` buscava o arquivo na
   hora do grito, então o som chegava atrasado — era o "delay alto" relatado. Com o buffer pronto, tocar é
   instantâneo. Quem aquece o cache é `precarregarCry`, chamado por `pokemon.makeMon`: todo Pokémon do jogo nasce
   ali, muito antes de entrar em campo, então na hora da luta o grito já está decodificado e sai junto da cena.
   O service worker já guarda o arquivo (cdn.jsdelivr.net está em `EXTERNOS`), então isso custa rede só na 1ª vez. */
/* O mapa guarda a PROMESSA do buffer, não o buffer. Guardar o buffer parecia mais simples e criou um bug de
   verdade: `tocarCry` via o registro ainda vazio, concluía "não chegou", só re-aquecia e **não tocava** — ou seja,
   na PRIMEIRA aparição de cada espécie o grito nunca saía (e a primeira aparição é o caso comum). Com a promessa,
   quem pede o grito se pendura nela e toca quando ela resolve, esteja o áudio já pronto ou a caminho. */
const buffers = new Map();   // id da espécie -> Promise<AudioBuffer | null>
function carregarCry(id) {
  const c = motor(); if (!c) return null;
  if (!buffers.has(id)) buffers.set(id, fetch(CRY(id))
    .then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error('cry ' + r.status)))
    .then(b => c.decodeAudioData(b))
    .catch(() => null));   // sem rede, ou formato não suportado (ogg no Safari): o jogo segue sem grito
  return buffers.get(id);
}
export function precarregarCry(id) { if (somLigado() && id) carregarCry(id); }
export function tocarCry(id) {
  if (!somLigado() || !id) return;
  const c = motor(), p = carregarCry(id); if (!p) return;
  const pedidoEm = c.currentTime;
  p.then(buf => {
    // buffer quente resolve no mesmo instante; o que demorou na rede é descartado em vez de gritar fora de hora
    if (!buf || !somLigado() || c.currentTime - pedidoEm > 3) return;
    const fonte = c.createBufferSource(), g = c.createGain();
    fonte.buffer = buf; g.gain.value = 0.9;
    fonte.connect(g); g.connect(master);
    fonte.start();
  });
}

/* ---- música: escalas, contexto de tela e tema da rota ----
   Pentatônicas e menor harmônica: dentro delas quase não existe intervalo feio, então a linha sai coerente sem
   um gerador harmônico esperto. */
export const ESCALAS = {
  'penta maior': [0, 2, 4, 7, 9],
  'penta menor': [0, 3, 5, 7, 10],
  'menor harmônica': [0, 2, 3, 5, 7, 8, 11]
};
const PENTA_MAIOR = ESCALAS['penta maior'];
const PENTA_MENOR = ESCALAS['penta menor'];
const MENOR_HARM = ESCALAS['menor harmônica'];

// O CONTEXTO (que tela) dá o andamento, a agitação e o timbre.
export const CONTEXTOS = {
  telas: { bpm: 76, densidade: 0.3, onda: 'triangle' },    // Carreira, Conquistas, Ranking… nada acontecendo
  menu: { bpm: 84, densidade: 0.42, onda: 'triangle' },    // tela inicial
  explorar: { bpm: 104, densidade: 0.48, onda: 'triangle' },
  batalha: { bpm: 138, densidade: 0.68, onda: 'square' },
  chefe: { bpm: 156, densidade: 0.8, onda: 'square' }
};
/* O TEMA DA ROTA dá a tonalidade. As chaves são os biomas de `cenario.climaDaRota` — a MESMA derivação que já
   pinta o céu e o chão da batalha, tirada do texto da rota. Reusar aquilo é o que faz "uma música por rota"
   valer pras 99 rotas do jogo sem tabela nova pra manter: rota com "caverna" no nome já nasce com som de
   caverna. Raízes entre 48 e 57 (Dó2–Lá2) de propósito: antes a melodia subia até a 7ª oitava e ficava aguda.

   `melodia` é O TOQUE HUMANO, e foi o que resolveu a queixa "não estou gostando das músicas": antes cada nota
   era SORTEADA da escala, e por mais que nenhuma soasse errada, a linha não ia a lugar nenhum — faltava o
   motivo que se repete e que faz a gente reconhecer uma música. Agora cada tema tem uma frase escrita à mão,
   e o sorteio virou só o tempero (ver `agendarPasso16`).
   Notação, um token por passo de semicolcheia (16 por compasso):
     número = grau da escala (0 = a nota do acorde) · `.` = silêncio · `-` = segura a nota anterior
   Editável ao vivo em `musica.html`, que toca por este mesmo motor e devolve o bloco pronto pra colar aqui. */
export const TEMAS = {
  floresta: { raiz: 57, escala: PENTA_MAIOR, acordes: [0, 5, 7, 5], melodia: '0 . 2 4 . 4 2 . 3 - 4 . 2 0 . .' },
  mar: { raiz: 55, escala: PENTA_MAIOR, acordes: [0, 7, 5, 9], melodia: '4 . 2 0 . 2 4 - . 3 4 2 . 0 - .' },
  gelo: { raiz: 56, escala: PENTA_MAIOR, acordes: [0, 9, 7, 5], melodia: '4 . . 3 . . 2 . 3 . . 4 . . - .' },
  caverna: { raiz: 50, escala: PENTA_MENOR, acordes: [0, 5, 3, 7], melodia: '0 . . 2 . 0 . . 3 . 2 . 0 - - .' },
  vulcao: { raiz: 48, escala: MENOR_HARM, acordes: [0, 8, 5, 7], onda: 'sawtooth', melodia: '0 0 . 3 . 3 . 5 4 . 4 . 3 . 0 .' },
  deserto: { raiz: 52, escala: MENOR_HARM, acordes: [0, 7, 8, 5], melodia: '0 . 3 . 4 - . 3 . 2 . 0 . - . .' },
  usina: { raiz: 53, escala: PENTA_MENOR, acordes: [0, 10, 5, 7], onda: 'square', melodia: '0 . 0 4 . 4 0 . 3 . 3 4 . 0 . .' },
  fantasma: { raiz: 49, escala: MENOR_HARM, acordes: [0, 6, 8, 5], melodia: '4 . . 3 . . 5 . . 4 . 2 . . - .' },
  montanha: { raiz: 52, escala: PENTA_MENOR, acordes: [0, 7, 5, 10], melodia: '0 . 4 . 3 - . 4 . 2 . 4 - . . .' },
  cidade: { raiz: 55, escala: PENTA_MAIOR, acordes: [0, 5, 9, 7], melodia: '2 . 4 2 . 0 . 2 3 . 4 3 . 2 . .' },
  santuario: { raiz: 57, escala: MENOR_HARM, acordes: [0, 5, 7, 8], melodia: '0 . . 4 . . 6 - . 4 . . 2 - - .' },
  padrao: { raiz: 55, escala: PENTA_MAIOR, acordes: [0, 7, 9, 5], melodia: '0 . 2 . 4 - . 2 . 3 . 4 . 2 . .' }
};
// grau da escala -> semitons, com as oitavas dando a volta (grau 5 numa pentatônica = a tônica uma oitava acima)
export const grauEmSemitons = (escala, d) =>
  escala[((d % escala.length) + escala.length) % escala.length] + 12 * Math.floor(d / escala.length);
export const lerMelodia = txt => String(txt || '').trim().split(/\s+/).filter(Boolean);
const midiParaFreq = m => 440 * 2 ** ((m - 69) / 12);

// nota aguda sai mais baixa: mesmo com o passa-baixa, volume igual em toda a extensão soa desequilibrado
function tocarNota(tempo, midi, dur, onda, ganho) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = onda; o.frequency.value = midiParaFreq(midi);
  const v = ganho * (midi > 74 ? 0.55 : 1);
  g.gain.setValueAtTime(0, tempo);
  g.gain.linearRampToValueAtTime(v, tempo + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, tempo + dur);
  o.connect(g); g.connect(master);
  o.start(tempo); o.stop(tempo + dur + 0.02);
}

// agendamento por "olhar à frente" (o relógio de setTimeout sozinho atrasa; agendar no AudioContext não atrasa,
// então cada passo é marcado num horário exato e só o DISPARO do agendador usa setTimeout, não o som em si)
const OLHAR_A_FRENTE = 0.1, PASSO_DO_LOOP = 25;
let timer = null, faixa = null, proximoPasso16 = 0, passo16 = 0, compasso = 0;

function agendarPasso16(tempo) {
  const f = faixa, raizAcorde = f.raiz + f.acordes[compasso % f.acordes.length], dur16 = 60 / f.bpm / 4;
  if (passo16 % 8 === 0) tocarNota(tempo, raizAcorde - 12, dur16 * 7, 'triangle', 0.22); // baixo: 1 nota por meio compasso
  if (f.passos?.length) { melodiaEscrita(f, tempo, raizAcorde, dur16); return; }
  // tema sem melodia escrita: cai no sorteio de antes (é o que sobra pra quem não ganhou frase própria)
  const forte = passo16 % 4 === 0;
  if (Math.random() < f.densidade * (forte ? 1 : 0.5)) {
    const oitava = Math.random() < 0.7 ? 12 : 0;
    tocarNota(tempo, raizAcorde + pick(f.escala) + oitava, dur16 * (Math.random() < 0.25 ? 2 : 1), f.onda, 0.12);
  }
}
/* A frase escrita à mão. O `-` que vier DEPOIS da nota estica a duração dela (é o que dá a nota longa no meio da
   frase); `.` é silêncio de verdade. A frase dá a volta sozinha quando é mais curta que o compasso.
   O acaso que sobrou é só tempero, e de propósito: uma oitava acima de vez em quando, pra segunda passada não
   ser idêntica à primeira. A ALTURA e o RITMO — o que faz a música ser reconhecível — são sempre os escritos. */
function melodiaEscrita(f, tempo, raizAcorde, dur16) {
  const p = f.passos, i = passo16 % p.length, tok = p[i];
  if (tok === '.' || tok === '-') return;
  const grau = Number(tok);
  if (!Number.isFinite(grau)) return;
  let dur = 1;
  while (dur < p.length && p[(i + dur) % p.length] === '-') dur++;
  // a variação de oitava é pra BAIXO: pular pra cima devolveria o agudo que foi o motivo da leva anterior
  const oitava = Math.random() < 0.12 ? 0 : 12;
  tocarNota(tempo, raizAcorde + grauEmSemitons(f.escala, grau) + oitava, dur16 * dur * 0.95, f.onda, 0.12);
}
function agendador() {
  while (proximoPasso16 < ctx.currentTime + OLHAR_A_FRENTE) {
    agendarPasso16(proximoPasso16);
    proximoPasso16 += 60 / faixa.bpm / 4;
    passo16 = (passo16 + 1) % 16;
    if (passo16 === 0) compasso++;
  }
  timer = setTimeout(agendador, PASSO_DO_LOOP);
}
function pararLoop() { if (timer) { clearTimeout(timer); timer = null; } faixa = null; }

// fanfarra de vitória: arpejo maior ascendente, não repete
function tocarStinger() {
  const c = motor(); if (!c) return;
  const t0 = c.currentTime + 0.05, graus = [0, 4, 7, 12, 16, 19];
  graus.forEach((g, i) => tocarNota(t0 + i * 0.11, 57 + g, 0.35, 'square', 0.16));
}

/* `pedido` guarda o que foi pedido por último (contexto + rota) mesmo com o som desligado ou a aba escondida,
   pra retomar a MESMA faixa ao voltar — sem isso, ligar o som em ⚙ Ajustes só mudaria de música no próximo
   evento do jogo, e voltar pra aba deixaria tudo em silêncio até a batalha seguinte.
   `zona` é a rota de agora (o objeto de `ZONES`/`rotasAtuais`): quem chama passa, e daqui sai o tema pelo
   `cenario.climaDaRota`. Sem rota (menus), cai no tema padrão. */
let pedido = null;

// monta e começa a faixa (contexto + tema já resolvidos). Quem retoma — ligar o som, voltar pra aba — chama
// daqui com o `pedido` guardado, sem precisar da rota de novo.
function iniciarFaixa(qual, tema) { montarFaixa(qual, TEMAS[tema] || TEMAS.padrao); }
// o miolo, com o tema já como OBJETO: é por aqui que o editor (musica.html) toca um tema que ainda não existe
// no arquivo, usando exatamente este motor — editor com sintetizador próprio sairia do ar em uma semana.
function montarFaixa(qual, t) {
  pararLoop();
  const c = motor(), base = CONTEXTOS[qual]; if (!c || !base || !t) return;
  faixa = { ...base, ...t, onda: t.onda || base.onda, passos: lerMelodia(t.melodia) };
  passo16 = 0; compasso = 0; proximoPasso16 = c.currentTime + 0.05;
  agendador();
}
export function tocarMusica(qual, zona = null) {
  if (qual === 'vitoria') { pedido = null; pararLoop(); if (somLigado()) tocarStinger(); return; }
  const tema = climaDaRota(zona).id;
  // já é essa faixa que está tocando: não recomeça do zero (todo render passaria por aqui)
  if (pedido?.qual === qual && pedido.tema === tema && timer) return;
  pedido = { qual, tema };
  if (somLigado()) iniciarFaixa(qual, tema);
}
export function pararMusica() { pedido = null; pararLoop(); }
// retoma o que estava tocando (ao ligar o som ou ao voltar pra aba)
const retomar = () => { if (pedido) iniciarFaixa(pedido.qual, pedido.tema); };

/* ---- ganchos do editor (musica.html) ----
   Só o editor usa. Ficam aqui, e não num arquivo à parte, pra o editor tocar pelo MOTOR DE VERDADE: o que você
   ouve ajustando é o que o jogo toca. `tocarPreview` ignora `somLigado()` de propósito — quem abriu o editor e
   apertou Tocar já disse o que queria, e o liga/desliga do jogo é outra conversa. */
// `resume()` é obrigatório aqui: o editor cria o AudioContext ao mexer nos controles de saída, e ele nasce
// 'suspended' — sem isto o botão Tocar agendaria tudo certinho e não sairia som nenhum.
export function tocarPreview(qual, tema) {
  const c = motor(); if (!c) return;
  c.resume(); pedido = null; montarFaixa(qual, tema);
}
export function ajustarSaida({ corte, volume } = {}) {
  if (!motor()) return;
  if (Number.isFinite(corte)) filtro.frequency.value = corte;
  if (Number.isFinite(volume)) master.gain.value = volume;
}

/* Aba escondida (trocou de aba, minimizou, bloqueou a tela do celular) = silêncio. Sem isto a trilha seguia
   tocando por cima de tudo, o que foi relatado como incômodo de verdade. `suspend()` congela o relógio do
   AudioContext, então o agendador é parado junto — e ao voltar a faixa é remontada do `pedido`. */
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pararLoop(); ctx?.suspend(); return; }
  if (!somLigado()) return;
  ctx?.resume(); retomar();
});

// ⚙ Ajustes → Som: liga/desliga (tela-ajustes.js). Ligar exige gesto do usuário (o clique É o gesto) — é
// quando o AudioContext sai de 'suspended' de verdade nos navegadores que bloqueiam áudio automático.
export function alternarSom(on) {
  store.set(SOM_KEY, on);
  if (!on) { pararLoop(); ctx?.suspend(); return; }
  motor()?.resume(); retomar();
}
