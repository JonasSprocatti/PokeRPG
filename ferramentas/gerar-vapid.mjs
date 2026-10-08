/* Gera o par de chaves VAPID dos lembretes por push. Roda uma vez na vida:
 *     node ferramentas/gerar-vapid.mjs
 * Imprime o que vai em cada lugar — a PÚBLICA em js/config.js (vai pro navegador) e o JSON das DUAS como segredo
 * da Edge Function (VAPID_JWK). A privada nunca entra no repositório.
 *
 * Nada de dependência: é P-256 por WebCrypto, que o Node já tem. O formato do JSON é o que
 * `webpush.importVapidKeys` espera (supabase/functions/lembretes), e a pública no formato que o
 * `pushManager.subscribe` do navegador quer é o ponto não comprimido (0x04 ‖ x ‖ y) em base64url. */
import { webcrypto as crypto } from 'node:crypto';

const b64url = b => Buffer.from(b).toString('base64url');
const deB64url = s => Buffer.from(s, 'base64url');

const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const publicKey = await crypto.subtle.exportKey('jwk', par.publicKey);
const privateKey = await crypto.subtle.exportKey('jwk', par.privateKey);

// o navegador quer os 65 bytes crus, não o JWK
const publicaCrua = b64url(Buffer.concat([Buffer.from([4]), deB64url(publicKey.x), deB64url(publicKey.y)]));

console.log('\n1) js/config.js →\n');
console.log(`export const VAPID_PUBLICA = '${publicaCrua}';`);
console.log('\n2) Supabase → Edge Functions → Secrets → VAPID_JWK (uma linha, inclui a chave PRIVADA):\n');
console.log(JSON.stringify({ publicKey, privateKey }));
console.log('\n(opcional) VAPID_CONTATO = um e-mail seu — é pra quem opera o serviço de push falar com você.\n');
