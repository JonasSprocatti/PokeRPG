/* ============ aviso de novidade (patch notes) ============ */
// Só o controle de "este navegador já leu a última atualização" — mora separado porque a barra de navegação
// (navegacao.js) e a tela 📜 Novidades (tela-patchnotes.js) precisam disso, e uma importa a outra.
import { PATCH_NOTES } from './dados-patchnotes.js';
import { store } from './util.js';

export const PATCH_VISTO_KEY = 'pokerpg-patch-visto';
export const versaoMaisNova = () => PATCH_NOTES[0]?.versao || '';
export const temNovidade = () => !!PATCH_NOTES.length && store.get(PATCH_VISTO_KEY) !== versaoMaisNova();
export const marcarNovidadesVistas = () => store.set(PATCH_VISTO_KEY, versaoMaisNova());
