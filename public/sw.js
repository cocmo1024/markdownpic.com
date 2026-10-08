/* MarkdownPic offline support.
   - Pages: network first, falling back to the last copy seen online, so a new deploy is never shadowed.
   - Hashed build assets and fonts: cache first; their URLs change whenever their content does.
   - Everything else (ads, other origins, non-GET) is left to the network untouched. */
const VERSION = "v1";
const PAGES = "mdpic-pages-" + VERSION;
const ASSETS = "mdpic-assets-" + VERSION;

self.addEventListener("install", event => {
  event.waitUntil(caches.open(PAGES).then(cache => cache.add("/")).catch(() => {}).then(() => self.skipWaiting()));
});

// The page lists the build assets it loaded before this worker took control, so offline works from the first visit.
self.addEventListener("message", event => {
  const urls = Array.isArray(event.data?.cache) ? event.data.cache.filter(url => typeof url === "string" && new URL(url, self.location.origin).origin === self.location.origin) : [];
  if (urls.length) event.waitUntil(caches.open(ASSETS).then(cache => Promise.all(urls.slice(0, 200).map(url => cache.match(url).then(hit => hit || cache.add(url).catch(() => {}))))));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith("mdpic-") && name !== PAGES && name !== ASSETS) await caches.delete(name);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && url.pathname === "/") (await caches.open(PAGES)).put("/", response.clone());
        return response;
      } catch {
        return (await caches.match("/", { cacheName: PAGES })) ?? Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || /\.(woff2?|png|svg)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cached = await caches.match(request, { cacheName: ASSETS });
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(ASSETS);
        await cache.put(request, response.clone());
        // Old deploys leave hashed files behind; keep only the most recent entries.
        const keys = await cache.keys();
        for (const stale of keys.slice(0, Math.max(0, keys.length - 300))) await cache.delete(stale);
      }
      return response;
    })());
  }
});
