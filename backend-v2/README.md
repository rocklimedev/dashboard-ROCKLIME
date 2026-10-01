# ERP Backend - NestJS / TypeScript / MySQL (Sequelize)

Rewrite of the legacy Express backend. See `docs/MIGRATION_PLAN.md` for the
full status and the checklist for the modules not yet converted.

## What's implemented right now

- Auth (login, register, verify-account, refresh-token, change-password,
  logout, deactivate-account, permissions lookup, validate-token) - now
  with activity logging at every action the legacy code logged, and a
  fixed `ReferenceError` bug in `deactivateAccount`
- Users (profile + admin CRUD, plus status-update and role-assignment
  endpoints ported from the legacy controller) - activity logging wired
  throughout
- RBAC (Roles, Permissions, RolePermission, assign-role, delete-role now
  blocks when users are still assigned to it) - activity logging wired
  throughout, including a fix for a broken `subContext: "ROLE"` value
  that was silently failing in the legacy app (see
  `docs/MIGRATION_PLAN.md`)
- Address (full CRUD) - activity logging wired throughout
- Products (create/update/list/get/delete, stock add/remove with
  inventory-history audit trail, keyword tagging, featured toggle,
  find-by-ids/category/brand, product-code uniqueness check, product
  meta-field definitions CRUD) - a few analytics/bulk-import endpoints are
  stubbed, see `docs/MIGRATION_PLAN.md`
- Cart (Mongo-backed: add/update/remove/clear/reduce quantity, bulk add,
  live price refresh on read) - quotation-to-cart conversion stubbed but
  ready to wire up now that Quotations exists
- Customers (full CRUD, search, quotation/order stats per customer)
- Quotations (create/update/clone/restore-version/get/list/delete, full
  discount+GST+optional-items calculation engine, daily reference
  numbering, Mongo version-history snapshots, floor/room-aware product
  enrichment) - Excel/PDF export not ported
- Orders (create with real-time stock deduction + inventory-history audit
  trail, daily order numbering, status transitions with automatic stock
  restoration on cancel, list/get/delete, comments) - the 764-line
  `updateOrderById`, dispatch/credit-note write endpoints, gate pass, and
  PDF invoice/document generation are stubbed, see
  `docs/MIGRATION_PLAN.md`
- Activity logging (global fire-and-forget service used by Customers/
  Quotations/Orders/Vendors/FGS/PurchaseOrder)
- Vendors (full CRUD, vendor-ID uniqueness check) - Product and Customer
  now have real associations to Vendor
- Purchase Order + FGS (full CRUD for both, daily numbering, FGS→PO
  conversion, PO confirmation with automatic stock increment, status
  transitions) - a real bug was found and fixed in the legacy FGS update
  handler (referenced an undefined variable that would have crashed on
  every request)
- Health checks (`/health`, `/api/health`)
- Global JWT auth guard + permission guard (`middleware/permission.js` port)
- MySQL via `@nestjs/sequelize` (sequelize-typescript), Mongo via
  `@nestjs/mongoose` (kept for logs/tokens/permission-cache, same split as
  the legacy app)
- Shared `UploadService` (FTP image upload, used by Products)
- Socket.IO gateway skeleton

This has been compiled (`npx tsc --noEmit`), boot-tested (`nest build` +
`node dist/main.js`), and the Sequelize entities/associations - including
the full Customer → Quotation → Order → OrderDispatch/OrderCreditNote
chain and the Vendor → Product/FGS/PurchaseOrder chain - have been
smoke-tested against an in-memory SQLite database (create, associate, and
eager-load all round-tripped correctly). The quotation calculation engine
has also been unit-verified against hand-computed totals. It has **not**
been run against a live MySQL/MongoDB, since neither is available in this
environment. Do that first before relying on it.

## Setup

```bash
npm install
cp .env.example .env   # fill in real DB_HOST/DB_NAME/DB_USER/DB_PASSWORD, MONGO_URI, JWT_SECRET, REFRESH_SECRET
```

Create the MySQL schema. No Sequelize migrations existed in the legacy repo
(it relied on `sequelize.sync()`), so for now either:
- point `DB_NAME` at an existing copy of the legacy database, or
- temporarily set `synchronize: true` in `src/database/database.module.ts`
  against a throwaway dev database to let Sequelize create the tables from
  the entities, then generate real migrations from that (see
  `docs/MIGRATION_PLAN.md`, "Database migrations").

```bash
npm run start:dev
```

Server listens on `PORT` (default 4000), all routes prefixed with `/api`
except `/health`.

## Project layout

```
src/
  config/            # typed configuration (replaces config/keys.js)
  database/          # Sequelize (MySQL) + Mongoose (Mongo) modules
  common/
    guards/          # JwtAuthGuard, PermissionsGuard
    decorators/      # @RequirePermission, @CurrentUser
    filters/         # global exception filter
  modules/
    auth/
    users/
    rbac/
    address/
    engagement/      # NotificationsGateway skeleton only so far
  health.controller.ts
  app.module.ts
  main.ts
docs/
  MIGRATION_PLAN.md  # full module-by-module conversion checklist
```

## Adding the next module

Follow the pattern of `src/modules/address` (simplest complete example) or
`src/modules/rbac` (join-table example): entity → dto → service →
controller → module → register in `AppModule` and, if it has a MySQL
entity, in `DatabaseModule`'s `models` array.
