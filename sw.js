/* PokéRPG — service worker: deixa o jogo abrir e jogar SEM internet depois do primeiro acesso online.
   - Arquivos do próprio jogo: pré-carregados na instalação (PRECACHE) e servidos "rede primeiro" — online
     sempre pega a versão nova (sem precisar trocar versão a cada deploy); offline cai no cache.
   - PokéAPI (dados), sprites, a biblioteca do Supabase (esm.sh) e fontes: "cache primeiro" — não mudam.
   - Supabase (login/banco) NUNCA passa pelo cache: offline falha e o jogo guarda pra enviar quando voltar.
   Todo arquivo novo em js/ precisa entrar em PRECACHE (tests/sw.test.js confere). */
const CACHE_JOGO = 'pokerpg-jogo-v1';
const CACHE_EXTERNO = 'pokerpg-externo-v1';
const PRECACHE = [
  './', './index.html', './css/estilo.css', './img/logo.png', './img/favicon-32.png', './img/icone-192.png',
  './js/amizade.js', './js/api.js', './js/batalha.js', './js/carreira.js', './js/config.js', './js/conta.js',
  './js/criacao.js', './js/dados.js', './js/efeitos.js', './js/estado.js', './js/fim.js', './js/itens.js',
  './js/layout.js', './js/main.js', './js/missoes.js', './js/mp-motor.js', './js/multiplayer.js', './js/mundo.js', './js/nuvem.js', './js/paineis.js',
  './js/pokemon.js', './js/progressao.js', './js/ranking.js', './js/regras.js', './js/render.js', './js/roguelike.js', './js/ui.js', './js/util.js'
];
// origens de terceiros que podem ir pro cache (conteúdo estável)
const EXTERNOS = ['pokeapi.co', 'raw.githubusercontent.com', 'esm.sh', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_JOGO).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => ![CACHE_JOGO, CACHE_EXTERNO].includes(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) { e.respondWith(redePrimeiro(req)); return; }
  if (EXTERNOS.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) { e.respondWith(cachePrimeiro(req)); return; }
  // o resto (Supabase etc.) vai direto pra rede
});

async function redePrimeiro(req) {
  const cache = await caches.open(CACHE_JOGO);
  try {
    const resp = await fetch(req);
    if (resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
  }
}
async function cachePrimeiro(req) {
  const cache = await caches.open(CACHE_EXTERNO);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const resp = await fetch(req);
    // opaque (sem CORS, ex.: <img>) também serve pra exibir; só não guarda erro
    if (resp.ok || resp.type === 'opaque') cache.put(req, resp.clone());
    return resp;
  } catch {
    return Response.error();
  }
}
