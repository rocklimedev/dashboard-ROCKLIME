# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Progressive Web App (PWA)

The app is installable (Chrome/Edge: install icon in the address bar; Android: "Add to Home screen"; iOS Safari: Share > Add to Home Screen).

- Built with `vite-plugin-pwa` (config in `vite.config.js`). The manifest is generated at build time as `manifest.webmanifest`.
- The app shell (JS, CSS, HTML, fonts) is precached so the app opens offline. Images and PDFs are cached on first use.
- API requests (`cm-sanitary-api.cmtradingco.com`) are never cached. Offline, they fail instead of showing stale data.
- New versions are not applied automatically. Users see an "Update available" prompt and choose when to reload, so unsaved forms are not lost.
- Service worker registration and update UI: `src/components/Common/PwaManager.jsx`.
- To test: `npm run build && npm run preview`, then open the app in Chrome, check DevTools > Application > Service Workers and Manifest.
- Icons in `public/` were generated from the brand mark. Replace `pwa-192x192.png`, `pwa-512x512.png`, and `apple-touch-icon.png` to change them.
