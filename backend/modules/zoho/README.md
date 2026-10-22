# Shared Zoho integration

## Tasks and Calendar integration

ERP records have dedicated authenticated APIs at `/api/tasks` and `/api/calendar/events`; see `../planning/README.md`. Zoho read adapters live in `projects/` and `calendar/` and reuse the same user's OAuth grant, refresh handling and validated data centre. They never use the company Bigin grant.

In Connectors, enable **Include Projects & Calendar access** and connect/reconnect. `/api/zoho/authorize?planning=true` includes read-only planning scopes in the signed OAuth state. Ordinary Bigin/Cliq consent remains unchanged. `/api/zoho/status` reports `services.projects` and `services.calendar`; these flags describe granted scopes, not a live connectivity probe. Missing planning scopes return 409 with reconnect instructions.

| Method | Path                                                             | Purpose                                                                       |
| ------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| GET    | `/api/zoho/projects/status`                                      | Scope status and read capability                                              |
| GET    | `/api/zoho/projects/portals`                                     | Native Projects v3.1 portal discovery                                         |
| GET    | `/api/zoho/projects/portals/:portalId/projects`                  | Native Projects v3 projects; `page`, `per_page` (max 200)                     |
| GET    | `/api/zoho/projects/portals/:portalId/projects/:projectId/tasks` | Native Projects v3 tasks; same pagination                                     |
| GET    | `/api/zoho/calendar/status`                                      | Scope status and read capability                                              |
| GET    | `/api/zoho/calendar/calendars`                                   | Native calendar discovery; optional `category`                                |
| GET    | `/api/zoho/calendar/calendars/:calendarId/events`                | Native events; required ISO `start` and `end`, positive range at most 31 days |

Projects uses its documented regional V3 hosts with Bearer authorization. Calendar uses its regional `/api/v1` host with Zoho-oauthtoken authorization. Unsupported Calendar data centres return 409 rather than redirecting tokens to an assumed host. Calendar UIDs are encoded as path components; provider identifiers remain strings. Tokens and raw provider error bodies are never returned. Read adapters retry once after HTTP 401 and preserve rate-limit HTTP 429. Frontend hooks are in `frontend-v2/src/api/planningApi.js`. Automatic linking, import, remote writes and two-way synchronization are not enabled.

Official API references checked during implementation:

- [Projects V3 authentication and data centres](https://projects.zoho.com/api-docs)
- [Projects portals](https://projects.zoho.com/api-docs/portals)
- [Projects tasks](https://projects.zoho.com/api-docs/tasks)
- [Calendar discovery](https://www.zoho.com/calendar/help/api/get-calendar-list.html)
- [Calendar event lists and range limits](https://www.zoho.com/calendar/help/api/get-events-list.html)

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
