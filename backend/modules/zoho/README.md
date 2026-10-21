# Shared Zoho integration

`zoho.auth.js` owns OAuth consent, callback, token storage and refresh. Bigin and Cliq consume this shared grant. The API is mounted at `/api/zoho`, with service APIs at `/api/zoho/bigin` and `/api/zoho/cliq`.

## Deployment

Cliq's routes and service live in `cliq/` inside this module and use `zoho.auth.js` for authentication. Add future Zoho product modules alongside `cliq/` and mount them in `zoho.route.js`. The frontend uses `/api/zoho/cliq`; `/api/cliq` remains a compatibility alias for the same router.

### Cliq module

`cliq.route.js` registers authenticated endpoints, `cliq.controller.js` handles
request parameters and message validation, `cliq.service.js` calls Zoho with the
current user's shared grant and retries once after a rejected access token, and
`cliq.scopes.js` supplies the permissions requested by shared Zoho consent.
Cliq has no separate OAuth client, callback, or token store.

| Method | Path under `/api/zoho/cliq`      | Purpose                                       |
| ------ | -------------------------------- | --------------------------------------------- |
| GET    | `/status`                        | Connection status without tokens              |
| GET    | `/chats?before=...`              | Chats                                         |
| GET    | `/channels?next=...`             | Joined channels                               |
| GET    | `/people?next=...`               | Users                                         |
| GET    | `/chats/:id/messages?before=...` | Chat history                                  |
| POST   | `/chats/:id/messages`            | Send `{ "text": "Hello" }`, 1–5000 characters |

Run `node --test local-tools/cliq-service.test.js local-tools/cliq-routes.test.js local-tools/zoho-auth.test.js`
from `backend/` to verify the integration with mocked Zoho responses.

1. Run migration `20261020000500-unified-zoho.js` with the project's normal Sequelize migration process.
2. Configure `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET` once.
3. Register the public URL `/api/zoho/callback` in that Zoho OAuth client. Set `ZOHO_AUTH_REDIRECT_URI` to the exact registered URL; otherwise it is derived from `PUBLIC_BACKEND_URL` or `BACKEND_URL`.
4. Set `CLIENT_URL` to the frontend origin and restart the backend.
5. Open Connectors and press **Connect Zoho** directly on the Zoho card.

An administrator's single consent requests Bigin and Cliq scopes. That user's shared grant becomes the company Bigin grant as well as their personal Cliq grant. Other users connect using the same button and shared authentication flow, with personal Cliq scopes; they never replace the company's Bigin grant or gain access to the administrator's chats.

Manage contains service settings, lead sources, pipeline/stage mappings and sync controls. It contains no separate authorization buttons.

Older Bigin-only connections remain available until an administrator completes the unified connection. Existing standalone Cliq users must reconnect using Connect Zoho to grant the unified client permissions. Old service-specific client IDs and callback URLs are no longer used for new connections. Disconnecting the company grant's owner also stops company Bigin and locks CRM. It does not reactivate a legacy Bigin environment token.

OAuth scopes: https://www.zoho.com/developer/oauth/scope.html
