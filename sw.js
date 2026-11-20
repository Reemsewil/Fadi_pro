const C = 'gpu-ledger-v1';
const SHELL = ['./', './index.html', './parser.js', './fb.js', './firebase-config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting() });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const lib = (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/')) || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (lib) { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { const k = n.clone(); caches.open(C).then(c => c.put(e.request, k)); return n }))); return }
  if (u.origin === location.origin) e.respondWith(fetch(e.request).then(n => { const k = n.clone(); caches.open(C).then(c => c.put(e.request, k)); return n }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
