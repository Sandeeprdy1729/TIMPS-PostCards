const CACHE = "timps-postcards-v7";
const ISLAND_PATH = "assets/dynamic-island.js";
const ISLAND_SRC = new URL(ISLAND_PATH, self.registration.scope).href;

const PRECACHE_URLS = [
  ".",
  "index.html",
  "config.js",
  "favicon.ico",
  "assets/dynamic-island.js",
  "assets/icon-16.png",
  "assets/icon-32.png",
  "assets/icon-48.png",
  "assets/icon-180.png",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/timps-postcards.png",
  "assets/timps-hero-banner.png"
];

/* Keep the most recent push around so a page that opens a moment later can
   still render the island contents. Lives in memory only. */
let pendingIsland = null;

/* Inject the Dynamic Island into every HTML page this worker serves. This is
   what makes new (and existing) issues pick it up without editing every
   file. Any failure falls back to the untouched response. */
async function injectIsland(response) {
  const type = response.headers.get("content-type") || "";
  if (!/text\/html/i.test(type)) return response;
  try {
    const html = await response.text();
    if (html.includes("dynamic-island.js")) {
      return new Response(html, {
        status: response.status,
        statusText: response.statusText,
        headers: stripLength(response.headers)
      });
    }
    const tag = `<script src="${ISLAND_SRC}" defer data-timps-island></script>`;
    const at = html.lastIndexOf("</body>");
    const out = at === -1 ? html + tag : html.slice(0, at) + tag + html.slice(at);
    return new Response(out, {
      status: response.status,
      statusText: response.statusText,
      headers: stripLength(response.headers)
    });
  } catch {
    return response;
  }
}

function stripLength(headers) {
  const out = new Headers(headers);
  out.delete("content-length");
  out.delete("content-encoding");
  out.delete("etag");
  out.delete("last-modified");
  return out;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const isPage = event.request.mode === "navigate";

  // Network-first: this is a news site, fresh pages matter more than offline speed.
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        if (!response || response.status !== 200) return response;

        const final = isPage ? await injectIsland(response.clone()) : response;
        const copy = final.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return final;
      } catch {
        const cached = await caches.match(event.request);
        return cached || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }
    })()
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
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "New update available" };
  }

  const title = data.title || "TIMPS PostCards";
  const options = {
    body: data.body || "New update available",
    icon: data.icon || "assets/icon-192.png",
    badge: "assets/icon-192.png",
    tag: data.issue || "timps-daily",
    renotify: true,
    data: {
      url: data.url || ".",
      issue: data.issue || "",
      date: data.date || "",
      stories: data.stories || []
    },
    actions: data.actions || []
  };

  pendingIsland = {
    title,
    body: options.body,
    url: options.data.url,
    issue: options.data.issue,
    date: options.data.date,
    stories: options.data.stories
  };

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, options);
      // If the app is already open, light up the island live — no reload needed.
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientsList) {
        client.postMessage({ type: "TIMPS_PUSH", payload: pendingIsland });
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TIMPS_ISLAND_READY" && pendingIsland) {
    const source = event.source;
    if (source && source.postMessage) {
      source.postMessage({ type: "TIMPS_PUSH", payload: pendingIsland });
    }
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const info = event.notification.data || {};
  let url = info.url || ".";
  // Force the island open when the app is launched from a push.
  if (!/[?&]island=1/.test(url)) {
    url += (url.includes("?") ? "&" : "?") + "island=1";
  }
  const payload = pendingIsland;

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientsList) {
        if (client.url.includes(url.split("?")[0]) && "focus" in client) {
          if (payload && client.postMessage) {
            client.postMessage({ type: "TIMPS_PUSH", payload });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })()
  );
});
