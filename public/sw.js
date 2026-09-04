// Lets the installed PWA relaunch offline. Chapter text and study notes are
// already persisted to IndexedDB (see query-provider.tsx) once downloaded,
// but that only helps once the app's own JS has booted — a plain reload
// needs the network to fetch that JS at all. So this worker runtime-caches
// two things as they're naturally requested while online: navigation HTML,
// and hashed /_next/static/ build assets. Build assets are safe to cache
// indefinitely (a new deploy ships new hashed filenames, it never rewrites
// an existing one), and a navigation response is cached together with the
// exact chunks it was served with, so a cached page and its scripts never
// drift apart the way they would if the shell were precached separately
// from a build manifest.
const SHELL_CACHE = "metsihaf-shell-v2";
const RUNTIME_CACHE = "metsihaf-runtime-v2";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.add(OFFLINE_URL)));
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

async function handleNavigate(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) runtime.put(request, response.clone());
    return response;
  } catch {
    return (await runtime.match(request)) ?? (await caches.match(OFFLINE_URL));
  }
}

async function handleStaticAsset(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  const cached = await runtime.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) runtime.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request));
    return;
  }

  const url = new URL(request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(handleStaticAsset(request));
  }
});
