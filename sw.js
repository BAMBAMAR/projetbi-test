// ============================================================
// SERVICE WORKER — ProjetBI.org  v3
// Corrige : "clone() on already-used Response"
//           CSP / Cloudflare Analytics passthrough
// ============================================================

const STATIC_CACHE = 'projetbi-static-v3';
const DATA_CACHE   = 'projetbi-data-v3';

// Domaines à laisser passer sans interception
const PASSTHROUGH_DOMAINS = [
  'supabase.co',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cloudflareinsights.com',   // ← Cloudflare Analytics
  'fbcdn.net',
  'facebook.com',
  'scontent.',
  'z-p3-scontent.',
  'picsum.photos',
];

const STATIC_ASSETS = [
  '/', '/index.html', '/actualites.html', '/style.css',
  '/app.js', '/utils.js', '/render.js', '/manifest.json', '/favicon.png',
];

const DATA_ASSETS = ['/promises.json', '/news.json', '/press.json'];

const OFFLINE_HTML = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>ProjetBI — Hors-ligne</title>
<style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;
min-height:100vh;margin:0;background:#0C0F0A;color:#E8F0E5;text-align:center;padding:2rem}
h1{color:#4ADE80}p{color:#9DB89A;margin-bottom:1.5rem}
a{color:#4ADE80;border:1px solid #4ADE80;padding:.5rem 1.2rem;border-radius:8px;text-decoration:none}
</style></head><body><div>
<h1>Hors-ligne</h1><p>Vous n'êtes pas connecté à Internet.</p>
<a href="/">Réessayer</a></div></body></html>`;

// ── INSTALLATION
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.allSettled([
      caches.open(STATIC_CACHE).then(c =>
        Promise.allSettled(STATIC_ASSETS.map(u => c.add(u).catch(() => {})))),
      caches.open(DATA_CACHE).then(c =>
        Promise.allSettled(DATA_ASSETS.map(u => c.add(u).catch(() => {})))),
    ]).then(() => self.skipWaiting())
  );
});

// ── ACTIVATION
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== STATIC_CACHE && k !== DATA_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function shouldPassthrough(url) {
  return PASSTHROUGH_DOMAINS.some(d => url.hostname.includes(d));
}

// Réponse cacheable : HTTP 200 uniquement, jamais opaque ni error
function isCacheable(r) {
  return r &&
    r.status === 200 &&
    r.type !== 'error' &&
    r.type !== 'opaqueredirect';
}

// ── FETCH
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // Laisser passer domaines externes
  if (shouldPassthrough(url)) return;

  // Pages admin — jamais en cache
  if (['/admin.html', '/kit-communication.html', '/update_press_simple.html']
      .includes(url.pathname)) return;

  // ── JSON : Network First, cache fallback
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(req).then(res => {
        if (isCacheable(res)) {
          // CLONER avant de retourner — corps consommé une seule fois
          const toCache = res.clone();
          caches.open(DATA_CACHE).then(c => c.put(req, toCache));
        }
        return res;                  // retourne l'original intact
      }).catch(async () => {
        const cached = await caches.match(req);
        return cached || new Response('{"error":"offline"}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // ── Statique : Cache First + revalidation silencieuse (stale-while-revalidate)
  event.respondWith((async () => {
    const cached = await caches.match(req);

    if (cached) {
      // Revalidation en arrière-plan — fetch indépendant, ne touche pas `cached`
      fetch(req).then(fresh => {
        if (isCacheable(fresh)) {
          // `fresh` n'est jamais lu par le client ici, clone non nécessaire
          // mais on clone pour être sûr que le put() n'interfère pas
          caches.open(STATIC_CACHE).then(c => c.put(req, fresh.clone()));
        }
      }).catch(() => { /* réseau indisponible, silencieux */ });

      return cached;   // réponse immédiate depuis le cache
    }

    // Rien en cache — aller chercher sur le réseau
    try {
      const res = await fetch(req);
      if (isCacheable(res)) {
        // Cloner AVANT tout accès au corps
        const toCache = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put(req, toCache));
      }
      return res;
    } catch {
      // Hors-ligne
      const accept = req.headers.get('accept') || '';
      if (accept.includes('text/html')) {
        return (await caches.match('/index.html')) ||
          new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html;charset=utf-8' }
          });
      }
      return new Response('', { status: 408, statusText: 'Network timeout' });
    }
  })());
});

// ── PUSH NOTIFICATIONS
self.addEventListener('push', event => {
  if (!event.data) return;
  try {
    const d = event.data.json();
    event.waitUntil(
      self.registration.showNotification(d.title || 'ProjetBI', {
        body: d.body || 'Nouvelle mise à jour',
        icon: '/favicon.png',
        data: { url: d.url || '/' },
        actions: [{ action: 'open', title: 'Voir' }]
      })
    );
  } catch { /* données push malformées */ }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
