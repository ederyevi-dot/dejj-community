// Service worker DEJJ Community
// Changer CACHE à chaque mise à jour des fichiers pour forcer le rafraîchissement.
const CACHE = 'dejj-v7';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'seed.js', 'firebase-config.js', 'manifest.webmanifest',
  'icon.svg', 'icon-192.png', 'icon-512.png', 'logo-flame.png', 'logo-tagline.png', 'crest-emblem.jpg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord (la dernière version s'affiche toujours), cache en secours hors ligne.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase, Hebcal, polices : directement le réseau
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
  );
});

// Clic sur une notification : ouvre ou refocalise l'application.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = e.notification.data?.url || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.focus(); return; } }
    return self.clients.openWindow(target);
  }));
});

// Notifications push (facultatif — nécessite Firebase Cloud Messaging + un serveur d'envoi).
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data?.text?.() || '' }; }
  const n = data.notification || data;
  e.waitUntil(self.registration.showNotification(n.title || 'DEJJ Community', {
    body: n.body || '', icon: 'icon-192.png', badge: 'icon-192.png', data: { url: n.click_action || './' }
  }));
});

// Firebase Cloud Messaging (si un jeton est enregistré côté application).
try {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  // La configuration Firebase est injectée par app.js via postMessage pour ne pas la dupliquer.
  self.addEventListener('message', (ev) => {
    if (ev.data?.type === 'fcm-config' && ev.data.config && !self.__fcmInit) {
      self.__fcmInit = true;
      try {
        firebase.initializeApp(ev.data.config);
        const messaging = firebase.messaging();
        messaging.onBackgroundMessage((payload) => {
          const n = payload.notification || {};
          self.registration.showNotification(n.title || 'DEJJ Community', {
            body: n.body || '', icon: 'icon-192.png', badge: 'icon-192.png', data: { url: payload.data?.url || './' }
          });
        });
      } catch (err) { /* push non configuré : sans effet */ }
    }
  });
} catch (err) { /* hors ligne : le reste du service worker continue de fonctionner */ }
