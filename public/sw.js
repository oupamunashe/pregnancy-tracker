/* Minimal service worker: lets the installed app open offline.
   - Same-origin GET only: Supabase (cross-origin) requests are never touched or cached, so no data is stored here.
   - Hashed build assets and icons: cache-first. Pages: network-first, falling back to the last copy when offline. */
const CACHE = "pregnancy-tracker-v1";
const BASE = new URL("./", self.location).pathname;   // "/pregnancy-tracker/"

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([BASE + "dashboard/", BASE + "icons/icon-192.png"]).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((hit) => hit || caches.match(BASE + "dashboard/"))),
    );
    return;
  }
  if (url.pathname.includes("/_next/static/") || url.pathname.includes("/icons/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
  }
});
