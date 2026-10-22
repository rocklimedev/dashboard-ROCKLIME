# Personal Tasks and Calendar APIs

Apply migration `20261022000100-planning.js` with the normal Sequelize migration process before deploying the frontend. It creates `tasks` and `calendar_events` with owner indexes, canonical JSON data, server-controlled external references, versions and deletion tombstones. No production database migration is run by the test suite. Tables are separate and models/routes live in `../tasks` and `../calendar`; validation, persistence and route handling are shared here.

All endpoints require existing ERP Bearer authentication. These are personal resources: every query uses `req.user.userId`, including writes and deletes. Clients cannot set owner IDs, external references, sync states or timestamps. Administrators have no implicit cross-user access. Team/shared records will need explicit RBAC and sharing rules before that feature is introduced.

| Method | Path                                   | Contract                                                                          |
| ------ | -------------------------------------- | --------------------------------------------------------------------------------- |
| GET    | `/api/tasks` or `/api/calendar/events` | `?page=1&limit=100` (limit at most 200); returns `{items,total,page,limit}`       |
| GET    | `.../:id`                              | One owned record, otherwise 404                                                   |
| POST   | collection path                        | Canonical writable fields below; returns record with UUID and version 1, HTTP 201 |
| PATCH  | `.../:id`                              | Writable fields plus required current `version`; returns updated record/version   |
| DELETE | `.../:id`                              | JSON `{version}`; soft deletes, HTTP 204                                          |

Task writable fields: `title` (required on create), `description`, `project` (local label), `status` (`Open`, `In progress`, `Completed`), `priority` (`Low`, `Normal`, `High`), `dueDate` (`YYYY-MM-DD` or null).

Event writable fields: `title`, `description`, `location`, `startAt`, `endAt` (ISO timestamps), `timeZone` (IANA). Start must precede end. Instants are stored in UTC, displayed in the user's browser timezone; ranges are end-exclusive.

Record responses include `id`, `version`, `createdAt`, `updatedAt`, `external` and `syncState`. Use the current version when editing/deleting. Stale versions return HTTP 409; refetch before retrying. Other errors use `{message}` with 400 for validation, 401 for unauthenticated requests, 404 for missing/unowned IDs and 500 for persistence failures. No automatic localStorage import occurs.

## Zoho boundary

`../zoho/projects` and `../zoho/calendar` expose read APIs using the current user's shared Zoho connection. See the Zoho README for paths and official documentation. ERP CRUD operates independently of Zoho and remains usable without a Zoho account. Read responses preserve native provider shapes. No scheduler, sync button, remote mutation or automatic import is implied.

A future sync implementation must set server-owned `external` metadata with string IDs: `{provider,accountId,portalId,projectId,calendarId,recordId,version,lastSyncedAt}`. Do not infer project IDs from local project labels. Keep local UUIDs stable, deduplicate by provider/account/remote ID, add a unique mapping constraint when linking is implemented, resolve remote version conflicts, and persist retry state before outbound writes. Linked edits become `pending`; linked deletes retain `pending_delete` tombstones. A future worker must consume these states explicitly. Attendees, recurrence, all-day events and invitation semantics need models before import/export is enabled.

## Verification

From backend: `node --test local-tools/planning.test.js local-tools/zoho-planning.test.js local-tools/zoho-auth.test.js local-tools/cliq-service.test.js local-tools/cliq-routes.test.js`.

CRUD tests use SQLite in memory and exercise the actual migration and routers with mocked ERP authentication. Zoho tests mock HTTP and token storage. No live Zoho calls or existing database writes occur.
