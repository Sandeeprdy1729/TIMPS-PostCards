const CACHE = "timps-postcards-v1";

const PRECACHE_URLS = [
  ".",
  "index.html",
  "icon-192.png",
  "icon-512.png",
  "timps_logo.svg",
  "timps_banner.svg",
  "timps-hero-banner.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    self.registration.showNotification(data.title || "TIMPS PostCards", {
      body: data.body || "New update available",
      icon: data.icon || "icon-192.png",
      badge: "icon-192.png",
      data: { url: data.url || "." },
      actions: data.actions || []
    });
  } catch {
    self.registration.showNotification("TIMPS PostCards", {
      body: event.data.text(),
      icon: "icon-192.png",
      badge: "icon-192.png"
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || ".";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
