/* Service worker de BoardBox : appli installable, utilisable hors connexion.
   Stratégies :
   - pages (navigation)      : mémoire d'abord, mise à jour en arrière-plan (la nouvelle version s'affiche
     à l'ouverture suivante) ; réseau seulement à la première visite (cacheThenUpdate)
   - scripts, styles, polices, icônes, bibliothèques CDN : mémoire d'abord ; chaque mise à jour change
     le « ?v=N » de l'URL, donc une nouvelle version est toujours téléchargée
   - cartes du Brise-glace (brise-glace/cartes/*.txt, modifiées à la main sans ?v=N) : réseau d'abord
     (isEditableContent, networkFirst)
   - Supabase (données de jeu) : jamais mis en mémoire
   Changer CACHE_VERSION uniquement pour forcer le rechargement complet (liste PRECACHE modifiée…). */
const CACHE_VERSION = 'v1';
// Préfixe propre à BoardBox : le nettoyage ne touche qu'aux caches « boardbox- », jamais à ceux
// d'une autre appli qui serait servie un jour sur le même domaine.
const CACHE = 'boardbox-' + CACHE_VERSION;
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net'];

// Tout ce qu'il faut pour que chaque outil fonctionne hors connexion, même jamais ouvert
const PRECACHE = [
  './', 'manifest.webmanifest', 'accueil.js',
  'commun/base.css', 'commun/commun.js', 'commun/supabase-config.js', 'commun/vendor/qrcode.js', 'commun/qr.js',
  'commun/fonts/inter-latin.woff2', 'commun/fonts/inter-latin-ext.woff2',
  'commun/fonts/sora-latin.woff2', 'commun/fonts/sora-latin-ext.woff2',
  'commun/fonts/jetbrains-mono-latin.woff2', 'commun/fonts/jetbrains-mono-latin-ext.woff2',
  'commun/icons/icon-192.png', 'commun/icons/icon-512.png', 'commun/icons/favicon.png', 'commun/icons/apple-touch-icon.png',
  'tirage/', 'tirage/app.js', 'tirage/i18n.js', 'tirage/de.js', 'tirage/ui.js',
  'qui-commence/', 'qui-commence/app.js',
  'compteur/', 'compteur/app.js',
  'minuteur/', 'minuteur/app.js',
  'pere-noel/', 'pere-noel/tirage.js', 'pere-noel/app.js',
  'brise-glace/', 'brise-glace/app.js',
  'brise-glace/cartes/fr/legeres.txt', 'brise-glace/cartes/fr/souvenirs.txt', 'brise-glace/cartes/fr/profondes.txt', 'brise-glace/cartes/fr/famille.txt', 'brise-glace/cartes/fr/couple.txt', 'brise-glace/cartes/fr/amis.txt',
  'brise-glace/cartes/en/legeres.txt', 'brise-glace/cartes/en/souvenirs.txt', 'brise-glace/cartes/en/profondes.txt', 'brise-glace/cartes/en/famille.txt', 'brise-glace/cartes/en/couple.txt', 'brise-glace/cartes/en/amis.txt',
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
  if (req.mode === 'navigate') { event.respondWith(cacheThenUpdate(event, req, url)); return; }
  if (isEditableContent(url)) { event.respondWith(networkFirst(req, url)); return; }
  if (url.origin === location.origin || CDN_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(req, url));
});

/** Contenus modifiés à la main sans changer de ?v=N (cartes du Brise-glace, une question par ligne) :
    réseau d'abord, pour qu'une carte publiée apparaisse au rechargement suivant. */
function isEditableContent(url) {
  return url.origin === location.origin && url.pathname.includes('/brise-glace/cartes/') && url.pathname.endsWith('.txt');
}

/** Pages : la version en mémoire tout de suite, et la page est revalidée en arrière-plan pour
    l'ouverture suivante. Pourquoi : au lancement de l'appli installée sur iPhone, le réseau met
    plusieurs secondes à répondre ; attendre le réseau d'abord donnait 5 s d'écran noir à chaque lancement.
    Clé sans paramètres : ?room=… ou ?items=… retombent sur la même page. */
async function cacheThenUpdate(event, req, url) {
  const cache = await caches.open(CACHE);
  const key = new Request(url.origin + url.pathname);
  const cached = await cache.match(key);
  const update = fetchAndStorePage(cache, req, key);
  if (cached) {
    event.waitUntil(update.catch(() => { /* hors ligne : la copie en mémoire suffit */ }));
    return cached;
  }
  try {
    return await update;
  } catch (e) {
    return (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
}

/** Télécharge une page (revalidée) et la garde en mémoire. Une réponse issue d'une redirection
    n'est pas gardée : Safari refuse de l'afficher si elle est resservie depuis la mémoire. */
async function fetchAndStorePage(cache, req, key) {
  const res = await fetch(req, { cache: 'no-cache' });
  if (res.ok && !res.redirected) await cache.put(key, res.clone());
  return res;
}

/** Cartes du Brise-glace : réseau d'abord (revalidé, délai max 4 s), sinon la version en mémoire. */
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
