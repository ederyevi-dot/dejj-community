// Service worker DEJJ Community
// Changer CACHE à chaque mise à jour des fichiers pour forcer le rafraîchissement.
const CACHE = 'dejj-v11-back-sans-logo';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'seed.js', 'firebase-config.js', 'manifest.webmanifest',
  'icon.svg', 'icon-192.png', 'icon-512.png', 'logo-flame.png', 'logo-tagline.png', 'crest-emblem.jpg', 'andre-darmon.png', 'animateur-boucles.jpg', 'animateur-casquette.jpg', 'animatrice-crepes.jpg', 'animatrice-lunettes.jpg', 'crest-emblem.jpg', 'edgar-guedj.jpg', 'edmond-elalouf.jpg', 'esther-abitbol.jpg', 'georges-fhal.jpg', 'haim-benlolo.png', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'jacques-bakouch.png', 'logo-flame.png', 'logo-tagline.png', 'mady-elalouf.png', 'maurice-arama.jpg', 'ralph-sultan.png', 'rikki-serfaty.png', 'salomon-abitbol.png', 'salomon-aflalo.png', 'simon-busbib.png', 'card-edgar-guedj.jpg', 'card-esther-abitbol.jpg', 'card-salomon-abitbol.jpg', 'card-salomon-aflalo.jpg', 'card-haim-benlolo.jpg', 'card-andre-darmon.jpg', 'card-georges-fhal.jpg', 'card-rikki-serfaty.jpg', 'card-jacques-bakouch.jpg', 'card-maurice-arama.jpg', 'card-simon-busbib.jpg', 'card-edmond-elalouf.jpg', 'card-mady-elalouf.jpg', 'card-ralph-sultan.jpg', 'card-animateur-boucles.jpg', 'card-animatrice-crepes.jpg', 'card-animateur-casquette.jpg', 'card-animatrice-lunettes.jpg'];

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
