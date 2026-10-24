Error boundaries
================

The boundary in `main.jsx` wraps every provider and the application. Its fallback
uses plain HTML and CSS so it can render even if the router, auth, Redux, or Ant
Design provider fails.

`App.jsx` protects routed content separately from the header and sidebar. The
route generator also wraps every screen, including nested layout children and
recursive submenus, with `RouteErrorBoundary`. An individual screen can therefore
fail while surrounding layout/navigation remains mounted.

The fallback offers Try again, Go to apps home, and Reload page. Try again
remounts the failed descendants. Navigating changes the boundary's `resetKey` and
clears an existing failure; healthy navigation does not remount the layout or
discard its state. Reload is useful for failed cached lazy-module downloads.

Error details and React's component stack are logged to the console, while the
fallback only displays a generic message and the screen's configured name.

These boundaries handle descendant rendering and lifecycle failures, including
rejected lazy imports. Event-handler and asynchronous request errors still need
their existing local error handling.

Run `npm run test:boundaries` for fallback and recovery contract tests. These unit
tests do not replace a browser test of an actual React render failure.
