/* ============ som: cries + música procedural (pedido do usuário) ============ */
// Desligado por padrão — só liga quem escolher em ⚙ Ajustes (localStorage 'pokerpg-som', como fonte/sprite em
// ajustes.js). Dois efeitos, os dois calados se `somLigado()` for falso:
//   - CRY: o grito de quem aparece na luta (PokéAPI, espelhado no jsDelivr — dados.CRY, mesma ideia do sprite).
//   - MÚSICA: NASCE na hora com a Web Audio API, nunca é arquivo pronto. Trilha original teria direito autoral, e
//     bibliotecas de live coding (Strudel/TidalCycles, que inspiraram a ideia) trariam dependência — o projeto é
//     JS puro sem build. Em vez disso: um compositor pequeno por PADRÕES (escala + progressão de acordes +
//     andamento por "humor" de tela), osciladores puros, igual à ideia do Tidal mas escrito do zero aqui.
// Roda só no navegador: `motor()` devolve null fora dele (Node/testes), e toda função de música vira no-op.
import { store, pick } from './util.js';
import { CRY } from './dados.js';

export const SOM_KEY = 'pokerpg-som';
export const somLigado = () => store.get(SOM_KEY) === true;

let ctx = null, master = null;
function motor() {
  if (typeof window === 'undefined' || !window.AudioContext) return null;
  if (!ctx) { ctx = new AudioContext(); master = ctx.createGain(); master.gain.value = 0.32; master.connect(ctx.destination); }
  return ctx;
}

/* ---- cries: um grito curto, tocado uma vez ---- */
export function tocarCry(id) {
  if (!somLigado() || typeof Audio === 'undefined') return;
  const a = new Audio(CRY(id));
  a.volume = 0.5;
  a.play().catch(() => {}); // autoplay bloqueado ou sem rede: decoração, falha em silêncio
}

/* ---- música: escalas e "humor" de cada tela ----
   Só pentatônicas e a menor harmônica — soam "certas" com nota quase aleatória, sem esbarrar em dissonância,
   o que dispensa um gerador de melodia mais esperto pra já parecer música de verdade. */
const PENTA_MAIOR = [0, 2, 4, 7, 9];
const PENTA_MENOR = [0, 3, 5, 7, 10];
const MENOR_HARM = [0, 2, 3, 5, 7, 8, 11];
// `raiz` em nota MIDI (60 = Dó central); `acordes` = graus (em semitons) que a raiz visita, um por compasso, em loop
const HUMORES = {
  menu: { escala: PENTA_MAIOR, raiz: 60, acordes: [0, 9, 5, 7], bpm: 96, onda: 'triangle', densidade: 0.55 },
  explorar: { escala: PENTA_MAIOR, raiz: 62, acordes: [0, 7, 9, 5], bpm: 116, onda: 'square', densidade: 0.6 },
  batalha: { escala: PENTA_MENOR, raiz: 57, acordes: [0, 10, 8, 5], bpm: 150, onda: 'square', densidade: 0.75 },
  chefe: { escala: MENOR_HARM, raiz: 55, acordes: [0, 8, 5, 7], bpm: 170, onda: 'sawtooth', densidade: 0.85 }
};
const midiParaFreq = m => 440 * 2 ** ((m - 69) / 12);

function tocarNota(tempo, midi, dur, onda, ganho) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = onda; o.frequency.value = midiParaFreq(midi);
  g.gain.setValueAtTime(0, tempo);
  g.gain.linearRampToValueAtTime(ganho, tempo + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, tempo + dur);
  o.connect(g); g.connect(master);
  o.start(tempo); o.stop(tempo + dur + 0.02);
}

// agendamento por "olhar à frente" (o relógio de setTimeout sozinho atrasa; agendar no AudioContext não atrasa,
// então cada passo é marcado num horário exato e só o DISPARO do agendador usa setTimeout, não o som em si)
const OLHAR_A_FRENTE = 0.1, PASSO_DO_LOOP = 25;
let timer = null, humor = null, proximoPasso16 = 0, passo16 = 0, compasso = 0;

function agendarPasso16(tempo) {
  const h = humor, raizAcorde = h.raiz + h.acordes[compasso % h.acordes.length], dur16 = 60 / h.bpm / 4;
  if (passo16 % 8 === 0) tocarNota(tempo, raizAcorde - 12, dur16 * 7, 'triangle', 0.2); // baixo: 1 nota a cada meio compasso
  const forte = passo16 % 4 === 0;
  if (Math.random() < h.densidade * (forte ? 1 : 0.5)) {
    const oitava = Math.random() < 0.75 ? 12 : 24;
    tocarNota(tempo, raizAcorde + pick(h.escala) + oitava, dur16 * (Math.random() < 0.25 ? 2 : 1), h.onda, 0.13);
  }
}
function agendador() {
  while (proximoPasso16 < ctx.currentTime + OLHAR_A_FRENTE) {
    agendarPasso16(proximoPasso16);
    proximoPasso16 += 60 / humor.bpm / 4;
    passo16 = (passo16 + 1) % 16;
    if (passo16 === 0) compasso++;
  }
  timer = setTimeout(agendador, PASSO_DO_LOOP);
}
function pararLoop() { if (timer) { clearTimeout(timer); timer = null; } humor = null; }

// fanfarra de vitória: arpejo maior ascendente, não repete (regras.js não entra aqui — não é fórmula de jogo, é decoração)
function tocarStinger() {
  const c = motor(); if (!c) return;
  const t0 = c.currentTime + 0.05, graus = [0, 4, 7, 12, 16, 19, 24];
  graus.forEach((g, i) => tocarNota(t0 + i * 0.11, 64 + g, 0.35, 'square', 0.18));
}

// `contexto` guarda o humor pedido por último mesmo com o som desligado, pra religar sozinho quando o
// jogador liga o som em ⚙ Ajustes (senão só trocaria de música no PRÓXIMO evento, ex.: só ao sair da batalha).
let contexto = null;
export function tocarMusica(qual, forcar = false) {
  const jaTocando = qual === contexto;
  contexto = qual;
  if (!somLigado() || (jaTocando && !forcar)) return;
  pararLoop();
  if (qual === 'vitoria') { tocarStinger(); return; }
  const c = motor(); if (!c || !HUMORES[qual]) return;
  humor = HUMORES[qual]; passo16 = 0; compasso = 0; proximoPasso16 = c.currentTime + 0.05;
  agendador();
}
export function pararMusica() { contexto = null; pararLoop(); }

// ⚙ Ajustes → Som: liga/desliga (tela-ajustes.js). Ligar exige gesto do usuário (o clique É o gesto) — é
// quando o AudioContext sai de 'suspended' de verdade nos navegadores que bloqueiam áudio automático.
export function alternarSom(on) {
  store.set(SOM_KEY, on);
  if (!on) { pararLoop(); return; }
  motor()?.resume();
  if (contexto) tocarMusica(contexto, true);
}
