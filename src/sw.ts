/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const handler = createHandlerBoundToURL("index.html");
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);

registerRoute(
  ({ url }) => url.pathname.startsWith("/api"),
  new NetworkFirst({
    cacheName: "api-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 }),
    ],
  })
);

registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "image-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.pathname === "/offline.html",
  new CacheFirst({
    cacheName: "offline-html",
  })
);

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "Notification";
  const options: NotificationOptions = {
    body: data.body,
    icon: "/icons/manifest-icon-192.maskable.png",
    badge: "/icons/manifest-icon-192.maskable.png",
    data,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { url, announcementId } = event.notification.data || {};
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      let client: WindowClient | null = null;

      if (url) {
        for (const c of allClients) {
          if (c.url === url && "focus" in c) {
            client = await (c as WindowClient).focus();
            break;
          }
        }
        if (!client && self.clients.openWindow) {
          client = (await self.clients.openWindow(url)) as WindowClient | null;
        }
      } else {
        if (allClients.length > 0 && "focus" in allClients[0]) {
          client = await (allClients[0] as WindowClient).focus();
        } else if (self.clients.openWindow) {
          client = (await self.clients.openWindow("/")) as WindowClient | null;
        }
      }

      if (announcementId && client) {
        client.postMessage({ announcementId });
      }
    })()
  );
});
