Shared loading states
=====================

Import `Loader` for application loading indicators. It uses a custom animated
red ring, with no Ant Design spinner dependency. Motion stops when the user
prefers reduced motion.

```jsx
// A small indicator inside an input or button.
<Loader size="small" />

// Keep existing content mounted while a request refreshes it.
<Loader loading={isFetching} tip="Fetching products…">
  <ProductTable />
</Loader>

// Use a fullscreen overlay only when the whole application is blocked.
<Loader loading={isProfileLoading} fullscreen />
```

`loading` defaults to `true`, and inline mode is the default. A standalone
`loading={false}` renders nothing. Wrapped content remains mounted when loading
changes; its interaction is blocked while loading. `size`, `tip`, `className`, and
other HTML attributes are supported by the indicator. Tips are shown in all
modes. Wrapped content uses `inert` while busy to prevent pointer and keyboard
interaction, and exposes its busy state to assistive technology.

Only fullscreen mode creates `#global-loader`. Regular page, modal, drawer, and
search indicators stay within their own layout. The application profile check
explicitly requests fullscreen mode.

Run `npm run test:loader` to verify the standalone, wrapped-content, and fullscreen
loading behavior.
