/* ============ as tabelas da música ============ */
/* Saíram de `js/som.js` em 07/10/2026 pra o 🎵 Editor de músicas poder PUBLICAR pela nuvem: `js/conteudo.js` é o
   chão do grafo (puro, testado no Node) e precisa mutar estas tabelas no lugar — importar o motor de áudio dentro
   dele seria o grafo ao contrário. Mesmo papel de `dados-rotas.js`: dado puro, sem NENHUM import.
   `som.js` reexporta tudo daqui, então quem já importava de lá (tests, musica.html) não mudou.

   Editável à mão e pelo 🎵 Editor de músicas (que cospe este arquivo pra colar, igual ao de rotas). */

/* Pentatônicas e menor harmônica: dentro delas quase não existe intervalo feio, então a linha sai coerente sem
   um gerador harmônico esperto. */
export const ESCALAS = {
  'penta maior': [0, 2, 4, 7, 9],
  'penta menor': [0, 3, 5, 7, 10],
  'menor harmônica': [0, 2, 3, 5, 7, 8, 11]
};
const PENTA_MAIOR = ESCALAS['penta maior'];
const PENTA_MENOR = ESCALAS['penta menor'];
const MENOR_HARM = ESCALAS['menor harmônica'];
// a escala pelo NOME (o pacote e o editor falam em nome; o motor toca o array)
export const nomeDaEscala = arr => Object.keys(ESCALAS).find(k => ESCALAS[k].join() === arr?.join()) || 'penta maior';

/* O CONTEXTO (que tela) dá o andamento, a agitação e o timbre.
   `melodiaFixa` é a frase da BATALHA: ela vence a do bioma de propósito, porque "música de luta" só é marcante
   se for a MESMA toda vez — a rota continua entrando pela tonalidade (raiz, escala e acordes do tema). Foi a
   queixa "falta uma música marcante de batalha": antes o combate era o tema da rota tocado mais rápido. */
export const CONTEXTOS = {
  telas: { bpm: 76, densidade: 0.3, onda: 'triangle' },    // Carreira, Conquistas, Ranking… nada acontecendo
  menu: { bpm: 84, densidade: 0.42, onda: 'triangle' },    // tela inicial
  explorar: { bpm: 104, densidade: 0.48, onda: 'triangle' },
  batalha: { bpm: 138, densidade: 0.68, onda: 'square', melodiaFixa: '0 . 0 3 . 2 . 4 . 3 2 . 0 . 2 .' },
  chefe: { bpm: 156, densidade: 0.8, onda: 'square', melodiaFixa: '0 0 . 4 . 3 . 4 . 2 . 0 - . 4 .' }
};
/* O TEMA DA ROTA dá a tonalidade. As chaves são os biomas de `cenario.climaDaRota` — a MESMA derivação que já
   pinta o céu e o chão da batalha, tirada do texto da rota. Reusar aquilo é o que faz "uma música por rota"
   valer pras 99 rotas do jogo sem tabela nova pra manter: rota com "caverna" no nome já nasce com som de
   caverna. Raízes entre 48 e 57 (Dó2–Lá2) de propósito: antes a melodia subia até a 7ª oitava e ficava aguda.

   `melodia` é O TOQUE HUMANO, e foi o que resolveu a queixa "não estou gostando das músicas": antes cada nota
   era SORTEADA da escala, e por mais que nenhuma soasse errada, a linha não ia a lugar nenhum — faltava o
   motivo que se repete e que faz a gente reconhecer uma música. Agora cada tema tem uma frase escrita à mão,
   e o sorteio virou só o tempero (ver `som.agendarPasso16`).
   Notação, um token por passo de semicolcheia (16 por compasso):
     número = grau da escala (0 = a nota do acorde) · `.` = silêncio · `-` = segura a nota anterior
   Editável ao vivo no 🎵 Editor de músicas (dentro do jogo, só admin) e em `musica.html`, que tocam por este
   mesmo motor. */
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

/* ---- os limites que o motor e o ouvido impõem (lidos pelo editor e pela validação do pacote) ----
   `RAIZ` e o teto de 880 Hz saíram da queixa "som agudo demais": o passa-baixa da saída corta em 2 kHz, e a
   melodia chegava perto disso. `tests/som.test.js` cobra os dois nas tabelas acima; `conteudo.js` cobra o mesmo
   no que vem da nuvem, senão um tema publicado passaria por cima da guarda. */
export const RAIZ = { min: 48, max: 57 };
export const PASSOS_DO_COMPASSO = 16;
export const ACORDES_NA_PROGRESSAO = 4;
export const ONDAS = ['sine', 'triangle', 'square', 'sawtooth'];
export const MIDI_MAIS_AGUDO = 81;        // A5 = 880 Hz, o teto combinado
export const OITAVA_DO_MOTOR = 12;        // a oitava máxima que `melodiaEscrita` soma por cima do grau

/* A nota mais aguda que uma frase alcança numa escala, já com a oitava do motor. Uma função só, lida pelo teste,
   pelo editor e pela validação — o número tem de ser o MESMO nos três, senão o editor aprova o que o pacote
   recusa (ou pior, o contrário). */
export function maisAgudo(raiz, escala, melodia) {
  const graus = lerMelodia(melodia).map(Number).filter(Number.isFinite);
  if (!graus.length) return raiz;
  return raiz + Math.max(...graus.map(g => grauEmSemitons(escala, g))) + OITAVA_DO_MOTOR;
}
