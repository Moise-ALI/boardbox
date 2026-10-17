/* Service worker de BoardBox : appli installable, utilisable hors connexion.
   Stratégies :
   - pages (navigation)      : réseau d'abord (toujours la dernière version en ligne), mémoire si hors ligne
   - scripts, styles, polices, icônes, bibliothèques CDN : mémoire d'abord ; chaque mise à jour change
     le « ?v=N » de l'URL, donc une nouvelle version est toujours téléchargée
   - Supabase (données de jeu) : jamais mis en mémoire
   Changer CACHE_VERSION uniquement pour forcer le rechargement complet (liste PRECACHE modifiée…). */
const CACHE_VERSION = 'v1';
// Préfixe propre à BoardBox : le domaine moise-ali.github.io (et donc son stockage) est partagé
// avec les autres dépôts du compte, le nettoyage ne touche qu'aux caches « boardbox- ».
const CACHE = 'boardbox-' + CACHE_VERSION;
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net'];

// Tout ce qu'il faut pour que chaque outil fonctionne hors connexion, même jamais ouvert
const PRECACHE = [
  './', 'manifest.webmanifest', 'accueil.js',
  'commun/base.css', 'commun/commun.js', 'commun/supabase-config.js', 'commun/vendor/qrcode.js',
  'commun/fonts/inter-latin.woff2', 'commun/fonts/inter-latin-ext.woff2',
  'commun/fonts/sora-latin.woff2', 'commun/fonts/sora-latin-ext.woff2',
  'commun/fonts/jetbrains-mono-latin.woff2', 'commun/fonts/jetbrains-mono-latin-ext.woff2',
  'commun/icons/icon-192.png', 'commun/icons/icon-512.png', 'commun/icons/favicon.png', 'commun/icons/apple-touch-icon.png',
  'tirage/', 'tirage/app.js', 'tirage/i18n.js', 'tirage/de.js', 'tirage/ui.js',
  'compteur/', 'compteur/app.js',
  'undercover/', 'undercover/app.js', 'undercover/i18n.js', 'undercover/mots.js', 'undercover/themes.js', 'undercover/donnees.js',
  'codenames/', 'codenames/app.js', 'codenames/i18n.js', 'codenames/mots.js', 'codenames/donnees.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Fichier par fichier : un échec isolé (réseau capricieux) ne bloque pas l'installation
    await Promise.allSettled(PRECACHE.map(async path => {
      const url = new URL(path, self.registration.scope);
      const res = await fetch(url, { cache: 'no-cache', mode: url.origin === location.origin ? 'same-origin' : 'cors' });
      if (res.ok) await cache.put(url, res);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('boardbox-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('.supabase.co')) return;                 // données en direct uniquement
  if (req.mode === 'navigate') { event.respondWith(networkFirst(req, url)); return; }
  if (url.origin === location.origin || CDN_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(req, url));
});

/** Pages : réseau d'abord (revalidé, délai max 4 s), sinon la version en mémoire.
    Clé sans paramètres : ?room=… ou ?items=… retombent sur la même page hors ligne. */
async function networkFirst(req, url) {
  const cache = await caches.open(CACHE);
  const key = new Request(url.origin + url.pathname);
  try {
    const res = await Promise.race([
      fetch(req, { cache: 'no-cache' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('délai dépassé')), 4000))
    ]);
    if (res.ok) await cache.put(key, res.clone());
    return res;
  } catch (e) {
    return (await cache.match(key)) || (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
}

/** Fichiers statiques : mémoire d'abord, sinon réseau (puis mise en mémoire, en retirant les
    anciennes versions du même fichier) ; hors ligne, n'importe quelle version du fichier. */
async function cacheFirst(req, url) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
      await cache.put(req, res.clone());
      for (const old of await cache.keys()) {
        const o = new URL(old.url);
        if (o.origin === url.origin && o.pathname === url.pathname && o.search !== url.search) await cache.delete(old);
      }
    }
    return res;
  } catch (e) {
    const fallback = await cache.match(req, { ignoreSearch: true });
    if (fallback) return fallback;
    throw e;
  }
}
