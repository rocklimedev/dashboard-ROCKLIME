# Backend composition

The backend uses Express with explicit composition, following the separation
of responsibilities used by modular frameworks such as NestJS.

- `index.js` loads environment variables and invokes bootstrap.
- `bootstrap.js` creates the HTTP and Socket.IO servers, connects MongoDB,
  starts background services, and listens on the configured port.
- `app.js` builds Express and registers middleware, API routes, health routes,
  and error handlers in order. It can be imported without listening on a port.
- `config/cors.js` defines HTTP CORS options.
- `middleware/configure-app.js` installs body parsing, security, logging,
  request socket access, and upload serving.
- `routes/index.js` registers product modules and API rate limiters.
- `routes/health.route.js` owns liveness and MySQL readiness endpoints.
- `middleware/error-handlers.js` owns the final 404 and error responses.
- `socket/create-socket-server.js` creates Socket.IO and initializes handlers.
- `jobs/scheduled-jobs.js` registers the daily maintenance jobs.
- `jobs/keep-alive.js` starts the production keep-alive timer.
- `modules/` contains domain routes, controllers, and services, including the
  shared Zoho integration and its Cliq product module.

Add domain endpoints in their module and mount the router in `routes/index.js`.
Keep startup work in bootstrap and background scheduling in `jobs/`.
The start commands remain `npm start` and `npm run dev`; the entry point still
exports `{ app, httpServer, io }` for existing consumers.

Run the isolated startup and route registration checks with:

```sh
node --test local-tools/bootstrap.test.js
```
