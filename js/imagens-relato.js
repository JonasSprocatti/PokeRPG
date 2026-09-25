/* ============ imagens nos relatos (bugs e sugestões) ============
   O limite pedido é "o equivalente a 2 prints de celular ou de PC": no máximo 2 imagens, cada uma com até 2 MB (um print
   de tela costuma ter de 0,3 a 2 MB). É o mesmo número do bucket no servidor (supabase/migrations/…_relatos_imagens.sql):
   o servidor recusa o que passar, esta validação só avisa ANTES de gastar o envio.
   A parte de regras (limites, validação) é pura e testada em tests/imagens-relato.test.js; comprimir e converter usam o
   navegador (canvas, FileReader) e só rodam lá. */
export const MAX_IMAGENS = 2;
export const MAX_BYTES_IMAGEM = 2 * 1024 * 1024;
export const TIPOS_IMAGEM = ['image/png', 'image/jpeg', 'image/webp'];
export const LADO_MAX = 1600;        // pixels do lado maior depois de comprimir: legível e leve
const QUALIDADE_JPEG = 0.85;
// a fila offline guarda as imagens no localStorage (~5 MB pro site inteiro): acima disto elas não vão junto
export const MAX_BYTES_FILA = 1.5 * 1024 * 1024;

export const mb = bytes => (bytes / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' MB';

/* Pode entrar? `arquivo` = { type, size, name? }; `jaTem` = quantas imagens já estão na lista. Devolve null (ok) ou o texto
   do motivo, pronto pra mostrar. */
export function motivoDeRecusa(arquivo, jaTem = 0) {
  if (!arquivo) return 'Arquivo inválido.';
  if (jaTem >= MAX_IMAGENS) return `Só cabem ${MAX_IMAGENS} imagens por relato — tire uma pra colocar outra.`;
  if (!TIPOS_IMAGEM.includes(arquivo.type)) return `${arquivo.name || 'Esse arquivo'} não é PNG, JPG ou WebP.`;
  if (arquivo.size > MAX_BYTES_IMAGEM) return `${arquivo.name || 'A imagem'} tem ${mb(arquivo.size)}: o limite é ${mb(MAX_BYTES_IMAGEM)} por imagem (o tamanho de um print).`;
  if (!(arquivo.size > 0)) return `${arquivo.name || 'A imagem'} está vazia.`;
  return null;
}
// a fila offline aguenta estas imagens? (soma dos bytes JÁ comprimidos)
export const cabeNaFila = imagens => (imagens || []).reduce((a, i) => a + (i.blob?.size || 0), 0) <= MAX_BYTES_FILA;

/* Reduz o print (lado maior até LADO_MAX, JPEG 85%) — um print de celular em PNG passa fácil de 1 MB e nada do que ele tem
   de útil some com isso. Se o resultado não ficar menor que o original, fica o original. Só no navegador. */
export async function comprimirImagem(arquivo) {
  try {
    const bmp = await createImageBitmap(arquivo);
    const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * escala)), h = Math.max(1, Math.round(bmp.height * escala));
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);   // PNG transparente vira fundo branco no JPEG (senão fica preto)
    ctx.drawImage(bmp, 0, 0, w, h); bmp.close?.();
    const blob = await new Promise(ok => canvas.toBlob(ok, 'image/jpeg', QUALIDADE_JPEG));
    if (blob && blob.size < arquivo.size) return { blob, tipo: 'image/jpeg' };
  } catch (e) { console.warn('imagem: não consegui comprimir, mando a original', e); }
  return { blob: arquivo, tipo: arquivo.type };
}

// Blob ⇄ data URL (a fila offline só guarda texto)
export const blobParaDataUrl = blob => new Promise((ok, erro) => {
  const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => erro(r.error); r.readAsDataURL(blob);
});
export async function dataUrlParaBlob(url) { return (await fetch(url)).blob(); }
