import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const API_ORIGIN = "https://cm-sanitary-api.cmtradingco.com";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // "prompt" (not "autoUpdate"): the app has long forms (orders, quotations,
      // POS). Reloading mid-edit would lose data, so the user chooses when to update.
      registerType: "prompt",
      injectRegister: false, // registration is done in src/pwa/registerSW.js
      includeAssets: [
        "favicon.svg",
        "favicon-96x96.png",
        "apple-touch-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],
      manifest: {
        id: "/",
        name: "CM Trading Co. - Inventory & Orders Dashboard",
        short_name: "CM Trading",
        description:
          "CM Trading Co. dashboard for managing inventory, sales, orders, customers, and business operations.",
        lang: "en-IN",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
        orientation: "any",
        theme_color: "#0d6efd",
        background_color: "#ffffff",
        categories: ["business", "productivity", "finance"],
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          {
            name: "Dashboard",
            short_name: "Dashboard",
            description: "Open the CM Trading dashboard",
            url: "/",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Inventory",
            short_name: "Inventory",
            description: "Manage products and inventory",
            url: "/inventory/list",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Orders",
            short_name: "Orders",
            description: "Manage customer orders",
            url: "/orders/list",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        // App shell: JS, CSS, HTML, fonts and small vector/icon files.
        // Large images and PDFs are fetched on demand (see runtimeCaching) so the
        // install does not download ~10 MB of artwork up front.
        globPatterns: ["**/*.{js,css,html,woff,woff2,svg,ico}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: "/index.html",
        // Never serve index.html for API paths or real file requests (e.g. a missing asset).
        navigateFallbackDenylist: [/^\/api\//, /\/[^/?]+\.[^/]+$/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Live business data and auth must never come from cache.
            urlPattern: ({ url }) => url.origin === API_ORIGIN,
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith(".pdf"),
            handler: "CacheFirst",
            options: {
              cacheName: "pdf-templates",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Font Awesome from cdnjs (cross-origin, opaque responses are fine here).
            urlPattern: ({ url }) => url.origin === "https://cdnjs.cloudflare.com",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "cdn-assets",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
