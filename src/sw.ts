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
    data: { url: data.url },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  event.waitUntil(
    (async () => {
      if (!url) return;
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if (client.url === url && "focus" in client) {
          return (client as WindowClient).focus();
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(url);
      }
    })()
  );
});
