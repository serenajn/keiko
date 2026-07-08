/* Keiko service worker — offline-first shell, fresh-when-online content */
const CACHE = "keiko-sw-1";
const CORE = [
  "./",
  "index.html",
  "manifest.json",
  "assets/ui/bongo.gif",
  "assets/ui/buddy1.gif",
  "assets/ui/buddy2.gif",
  "assets/ui/buddy3.gif",
  "assets/ui/bunny.gif",
  "assets/ui/dance-cat.gif",
  "assets/ui/dance-ham.gif",
  "assets/ui/sleep-ham.gif",
  "assets/ui/icon-192.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  /* the page itself: network-first so updates land immediately, cache when offline */
  if (req.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("./", copy));
          return res;
        })
        .catch(() => caches.match("./"))
    );
    return;
  }

  /* everything else (exercise gifs, fonts): cache-first, fill the cache as she browses */
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
