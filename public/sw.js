const CACHE_NAME = "winepicker-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API routes and non-GET requests
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const fetched = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetched;
      })
    )
  );
});
