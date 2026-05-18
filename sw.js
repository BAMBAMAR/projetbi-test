/**
 * ProjetBI V2 – Service Worker
 * Stratégie :
 *   • Statique  → Cache First + revalidation silencieuse (stale-while-revalidate)
 *   • JSON data → Network First, cache fallback
 *   • Admin     → toujours réseau, jamais cache
 *   • Externe   → passthrough (Supabase, CDN, fonts…)
 *
 * Versioning : incrémenter CACHE_VERSION à chaque déploiement
 */

'use strict';

const CACHE_VERSION  = 'v5';
const STATIC_CACHE   = `projetbi-static-${CACHE_VERSION}`;
const DATA_CACHE     = `projetbi-data-${CACHE_VERSION}`;
const BASE           = self.registration.scope;

// Domaines toujours servis depuis le réseau (pas de cache local)
const PASSTHROUGH_ORIGINS = [
  'supabase.co',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cloudflareinsights.com',
  'fbcdn.net',
  'facebook.com',
  'scontent.',
  'z-p3-scontent.',
];

// Assets statiques à pré-cacher à l'installation
const STATIC_ASSETS = [
  BASE,
  `${BASE}index.html`,
  `${BASE}actualites.html`,
  `${BASE}style.css`,
  `${BASE}app.js`,
  `${BASE}utils.js`,
  `${BASE}render.js`,
  `${BASE}manifest.json`,
  `${BASE}favicon.png`,
];

// JSON data – mis en cache avec stratégie Network First
const DATA_ASSETS = [
  `${BASE}promises.json`,
  `${BASE}news.json`,
  `${BASE}press.json`,
];

// Pages never cachées (admin)
const NO_CACHE_PATHS = [
  'admin.html',
  'kit-communication.html',
  'update_press_simple.html',
];

// Page offline de secours (HTML inline pour éviter une dépendance externe)
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ProjetBI – Hors-ligne</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;
         justify-content:center;min-height:100dvh;background:#0F1612;color:#F0F7F2;
         text-align:center;padding:2rem}
    .card{max-width:420px;background:#1C2920;border-radius:16px;padding:3rem 2rem;
          border:1px solid #2C3E32}
    h1{font-size:2rem;color:#4ADE80;margin-bottom:1rem}
    p{color:#B0C8B8;margin-bottom:1.5rem;line-height:1.7}
    a{display:inline-block;color:#4ADE80;border:2px solid #4ADE80;padding:.6rem 1.6rem;
      border-radius:9999px;text-decoration:none;font-weight:600;transition:.15s}
    a:hover{background:#4ADE80;color:#0F1612}
    .icon{font-size:3rem;margin-bottom:1.5rem}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>Hors-ligne</h1>
    <p>Vous n'êtes pas connecté à Internet.<br>Les données affichées peuvent dater de votre dernière visite.</p>
    <a href="/">Réessayer</a>
  </div>
</body>
</html>`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function isPassthrough(url) {
  return PASSTHROUGH_ORIGINS.some(o => url.hostname.includes(o));
}

function isNoCachePage(url) {
  return NO_CACHE_PATHS.some(p => url.pathname.endsWith(p));
}

function isDataRequest(url) {
  return url.pathname.endsWith('.json');
}

function isCacheable(response) {
  return (
    response &&
    response.status === 200 &&
    response.type !== 'error' &&
    response.type !== 'opaqueredirect'
  );
}

async function precache(cacheName, urls) {
  const cache = await caches.open(cacheName);
  return Promise.allSettled(
    urls.map(url =>
      cache.add(url).catch(err =>
        console.warn(`[SW] Précache échoué pour ${url}:`, err.message)
      )
    )
  );
}

// ─── Installation ────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.allSettled([
      precache(STATIC_CACHE, STATIC_ASSETS),
      precache(DATA_CACHE, DATA_ASSETS),
    ]).then(() => {
      console.log(`[SW] ${CACHE_VERSION} installé`);
      return self.skipWaiting();
    })
  );
});

// ─── Activation (nettoyage des anciens caches) ───────────────────────────────

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== STATIC_CACHE && k !== DATA_CACHE)
            .map(k => {
              console.log(`[SW] Suppression ancien cache: ${k}`);
              return caches.delete(k);
            })
        )
      )
      .then(() => {
        console.log(`[SW] ${CACHE_VERSION} actif`);
        return self.clients.claim();
      })
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  const req = event.request;

  // Ignorer les méthodes non-GET
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); }
  catch { return; }

  // Ignorer les domaines externes
  if (isPassthrough(url)) return;

  // Pages admin – toujours réseau
  if (isNoCachePage(url)) return;

  // JSON → Network First
  if (isDataRequest(url)) {
    event.respondWith(networkFirstJSON(req));
    return;
  }

  // Statique → Cache First + revalidation silencieuse
  event.respondWith(cacheFirstStatic(req, url));
});

/**
 * Network First pour les JSON (données fraîches en priorité)
 */
async function networkFirstJSON(req) {
  try {
    const res = await fetch(req);
    if (isCacheable(res)) {
      const toCache = res.clone();
      caches.open(DATA_CACHE).then(c => c.put(req, toCache));
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    return new Response('{"error":"offline","cached":false}', {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}

/**
 * Cache First + revalidation en arrière-plan pour les assets statiques
 */
async function cacheFirstStatic(req, url) {
  const cached = await caches.match(req);

  if (cached) {
    // Revalidation silencieuse en arrière-plan
    fetch(req)
      .then(fresh => {
        if (isCacheable(fresh)) {
          caches.open(STATIC_CACHE).then(c => c.put(req, fresh));
        }
      })
      .catch(() => { /* réseau indisponible, on reste sur le cache */ });

    return cached;
  }

  // Rien en cache → réseau
  try {
    const res = await fetch(req);
    if (isCacheable(res)) {
      const toCache = res.clone();
      caches.open(STATIC_CACHE).then(c => c.put(req, toCache));
    }
    return res;
  } catch {
    // Hors-ligne : page de secours pour HTML, 408 pour le reste
    const accept = req.headers.get('accept') || '';
    if (accept.includes('text/html')) {
      const cachedHome = await caches.match(`${BASE}index.html`);
      return cachedHome || new Response(OFFLINE_HTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    return new Response('', { status: 408, statusText: 'Network timeout' });
  }
}

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener('push', event => {
  if (!event.data) return;

  let data;
  try { data = event.data.json(); }
  catch { return; } // données malformées, on ignore

  event.waitUntil(
    self.registration.showNotification(data.title || 'ProjetBI', {
      body:    data.body    || 'Nouvelle mise à jour disponible',
      icon:    data.icon    || '/favicon.png',
      badge:   '/favicon.png',
      tag:     data.tag     || 'projetbi-notification',
      renotify: false,
      data:    { url: data.url || '/' },
      actions: [
        { action: 'open',    title: 'Voir' },
        { action: 'dismiss', title: 'Ignorer' },
      ],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Valider l'URL avant d'ouvrir (prévenir les open redirects)
  const rawUrl = event.notification.data?.url || '/';
  let safeUrl = BASE;

  try {
    const parsed = new URL(rawUrl, BASE);
    const scope   = new URL(BASE);
    if (parsed.origin === scope.origin) {
      safeUrl = parsed.href;
    }
  } catch { /* URL invalide, on utilise BASE */ }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Si une fenêtre existe déjà, la focaliser
        for (const client of clientList) {
          if (client.url === safeUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(safeUrl);
        }
      })
  );
});

// ─── Message handler (skip waiting on demand) ─────────────────────────────────

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'GET_VERSION') {
    event.source?.postMessage({ type: 'VERSION', version: CACHE_VERSION });
  }
});
