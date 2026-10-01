# Migration Plan: Express/Sequelize → NestJS/TypeScript/Sequelize

## Status

**Done** (fully working, compiled, DI-verified, and smoke-tested against an
in-memory database for the Sequelize entities):
- Project scaffold (`package.json`, `tsconfig.json`, `nest-cli.json`, `.env.example`)
- Config layer (`src/config/configuration.ts`)
- MySQL layer (`src/database/database.module.ts`, sequelize-typescript)
- Mongo layer (`src/database/mongo.module.ts`, @nestjs/mongoose) - kept
  separate from MySQL on purpose, same split as the legacy app
  (`config/database.js` vs `config/dbMongo.js`)
- Common layer: `JwtAuthGuard`, `PermissionsGuard` (port of
  `middleware/permission.js`), `@RequirePermission`, `@CurrentUser`,
  global exception filter, shared `UploadService` (FTP upload, port of
  `middleware/upload.js`)
- `AuthModule` (login, register, verify-account, refresh-token,
  change-password, logout, deactivate-account, me/permissions, validate-token)
- `UsersModule` (profile CRUD, admin user CRUD)
- `RbacModule` (Roles + Permissions + RolePermission, assign-role)
- `AddressModule` (full CRUD)
- `ProductsModule` (Product, ProductMeta, InventoryHistory, Keyword,
  ProductKeyword entities; create/update/list/get/delete, stock
  add/remove with InventoryHistory logging, history lookup, keyword
  tagging, featured toggle, find-by-ids/category/brand, code-uniqueness
  check, count - see "Not yet ported" below for the handful of analytics/
  bulk endpoints still stubbed)
- `CartModule` (Mongo-backed: add/update/remove/clear/reduce, bulk add,
  price-refresh-on-read, list all carts - `convertQuotationToCart` stubbed
  pending QuotationsModule)
- `CustomersModule` (full CRUD, search, quotation/order stats rollup per
  customer, title/displayName derivation)
- `QuotationsModule` (Quotation MySQL entity + QuotationItem/
  QuotationVersion Mongo schemas; create/update/clone/restore-version/
  get/list/delete, full calculation engine, daily numbering, versioning
  snapshots, product enrichment with floor/room/option grouping - PDF
  export and the standalone product-enrichment "variants" edge cases are
  not ported, see below)
- `OrdersModule` (Order + OrderActivity + OrderDispatch + OrderCreditNote +
  OrderCreditNoteItem MySQL entities, OrderItem/Comment Mongo schemas;
  create with stock deduction + InventoryHistory logging, daily order
  numbering, status transitions with stock restoration on cancel, list/
  get/delete, comments CRUD - `updateOrderById` (764 lines in the
  original) and dispatch/credit-note/gate-pass/invoice/PDF endpoints are
  stubbed, see below)
- `ActivityLogModule` (global, MySQL - port of `utils/activityLogger.js`,
  used by every service that logged activity in the legacy app): Auth,
  Users, RBAC/Roles, Address, Customers, Quotations, Orders, Vendors,
  FGS, PurchaseOrder all now call `logActivity(...)` at the same points
  the legacy controllers did, fire-and-forget (`.catch(() => {})`, never
  awaited - same latency characteristics as the original
  `.catch(console.error)` pattern). Two real bugs were found and fixed
  while wiring this up:
  - `role.controller.js` logged every role-management action with
    `subContext: "ROLE"`, but the legacy `activity-log.model.js`
    `SUB_CONTEXTS` enum never defined `ROLE` - Sequelize's ENUM
    validation would have rejected every one of those inserts, and
    `logActivity`'s try/catch would have silently swallowed the error.
    All role-management activity was invisible in production. Added
    `ROLE` to the enum here so it actually records.
  - `auth.controller.js`'s `deactivateAccount()` referenced an
    `oldStatus` variable in its `logActivity` call that was never
    assigned anywhere in the function - a `ReferenceError` on every
    deactivation request. Fixed by capturing the status before mutating
    it (same category of bug as the `fgs.controller.js` `oldSnapshot`
    issue found earlier).
  Verified with a real smoke test (not just a compile check) that runs
  Roles/Users/Address service methods against an in-memory SQLite DB and
  asserts the expected `ActivityLog` rows actually land with the right
  `contextTag`/`subContext`/`action`.
- `VendorsModule` (full CRUD, vendor-ID uniqueness check) - `Product` and
  `Customer` now have real `@BelongsTo` associations to `Vendor`
  (previously plain UUID columns, upgraded now that Vendor exists)
- `PurchaseOrderModule` (FGS + PO share one module since FGS-to-PO
  conversion calls into `PurchaseOrderService` directly): FieldGuidedSheet
  + PurchaseOrder MySQL entities, FgsItem/PoItem Mongo schemas (line
  items live in Mongo, not embedded JSON, unlike Quotation/Order);
  full CRUD for both, daily FGS/PO numbering, FGS-to-PO conversion,
  PO confirmation with automatic stock increment, status transitions.
  Fixed a real bug found in the legacy `updateFieldGuidedSheet`: it
  referenced an `oldSnapshot` variable that was never defined (would have
  thrown `ReferenceError` at runtime on every update) - the port captures
  the snapshot correctly before applying changes.
- `HealthController` (`/health`, `/api/health`)
- `NotificationsGateway` skeleton (Socket.IO)
- `main.ts` / `app.module.ts` wiring, helmet, CORS, global validation pipe,
  blocked-path middleware, global prefix

**Not started** - Brands (+ Category, ParentCategory, full Keyword w/
Category relation), Search, Jobs, Engagement's Notifications half
(ActivityLog is done, Notifications/Socket wiring and every
`sendNotification()` call site across Customers/Quotations/Orders/FGS/PO
are TODOs), Device Management, and Team (referenced by Order/User but no
module exists for it at all - see "Team model" note below).

Each follows the exact same recipe used for `users`/`address`/`rbac`/
`products` above:

1. `entities/*.entity.ts` - convert each `sequelize.define(...)` factory
   function into a `@Table` class with `@Column`/`@ForeignKey`/
   `@BelongsTo`/`@HasMany`/`@BelongsToMany` decorators (see
   `src/modules/users/entities/user.entity.ts` for hooks/getters/setters,
   `src/modules/rbac/entities/role-permission.entity.ts` for join tables).
2. `dto/*.dto.ts` - one DTO per write endpoint, `class-validator` decorators
   in place of manual `req.body` checks.
3. `<module>.service.ts` - move the controller function bodies over
   near-verbatim; replace `require("../../models")` with `@InjectModel()`.
4. `<module>.controller.ts` - one `@Get/@Post/@Put/@Delete` per Express
   route; `@UseGuards(JwtAuthGuard, PermissionsGuard)` replaces
   `router.use(auth)` + `checkPermission(...)`; `@RequirePermission({...})`
   replaces the `checkPermission(api, name, module, route)` arguments
   (most are currently commented out in the legacy routes - keep them
   commented via `// @RequirePermission(...)` until permissions are
   seeded, or the guard will 500 on missing config).
5. `<module>.module.ts` - `SequelizeModule.forFeature([...])` + wire into
   `AppModule.imports`.
6. Register the new entity classes in `database.module.ts`'s `models: [...]`
   array (Sequelize won't know about a model otherwise).

### Module-by-module checklist (legacy path → new location)

| Legacy module | Models | Notes |
|---|---|---|
| `modules/vendors` | **Done** - `VendorsModule` at `src/modules/vendors`. Full CRUD + vendor-ID uniqueness check. `Product.vendorId` and `Customer.vendorId` now have real `@BelongsTo` associations |
| `modules/purchase-order` | **Done** - `PurchaseOrderModule` at `src/modules/purchase-order` (FGS + PO controllers share the module). Full CRUD for both, daily numbering, FGS→PO conversion, PO confirmation with stock increment, status transitions with stock-on-delivery logic. `mongoItemsId` pattern (line items in Mongo `FgsItem`/`PoItem` collections, linked by a stored Mongo `_id` string) ported as-is. Not ported: PDF/export endpoints (none existed in the legacy controllers to port - the 851/699-line sizes were mostly the validation+activity-log+notification boilerplate repeated per endpoint, not extra features) |
| `modules/orders` | **Done** (core) - see entities in `src/modules/orders/entities`. Remaining: `updateOrderById` (764 lines - full product/discount/team re-diff logic), `getFilteredOrders`, `updateOrderTeam` (needs Team model), `uploadInvoiceAndLinkOrder`, `issueGatePass`, `downloadInvoice`/`downloadOrder`/`getDownloadDocument` (PDF generation) - all currently throw `NotImplementedException` with a pointer to the legacy line number. Dispatch and credit-note *write* endpoints (issuing a dispatch, issuing a credit note) are not built - only the entities/associations exist so `Order.dispatches`/`Order.creditNotes` can be included when reading | |
| `modules/brands` | `brand.model.js`, `category.model.js`, `parent-category.model.js`, `keyword.model.js`, `brand-parentcategory*.js` | 5 controllers/routes - one `BrandsModule`, multiple controllers. **Do this before wiring real `@BelongsTo` associations onto `Product.brandId/categoryId` and `Keyword.categoryId`** - those are currently plain UUID columns (see `products/entities/product.entity.ts` and `keyword.entity.ts`) |
| `modules/customers` | **Done** - `CustomersModule` at `src/modules/customers`. Full CRUD + search + quotation/order stats. `sendNotification()` call on create is a TODO pending NotificationsModule |
| `modules/products` | `product.model.js`, `product-meta.model.js`, `product-keywords.model.js`, `inventory-history.model.js` | **Core CRUD done** (see above). Still stubbed in `ProductsService` (throw `NotImplementedException` with a pointer to the exact legacy line number): `searchProducts`, `getLowStockProducts`/`V2`, `getTopSellingProducts` (needs Order model - now available, worth wiring up), `bulkImportProducts` (needs `workers/bulkImportWorker.js` → BullMQ processor), `bulkInventoryUpdate`, `getAllProductCodesBrandWise` (needs Brand model), `getAllProductCodes`, variant endpoints (`getProductWithVariants`, `createVariant`) |
| `modules/search` | none (queries across models) | `SearchService` composing queries across Products/Customers/Orders |
| `modules/jobs` | `job.model.js` | Pairs with `workers/jobWorker.js` - see BullMQ section below |
| `modules/cart` | `carts.model.js` (Mongo) | **Done** - `CartModule` at `src/modules/cart`. `convertQuotationToCart` is stubbed (throws `NotImplementedException`) - **QuotationsModule now exists**, so this is ready to wire up: fetch `quotation.products` (a JSON array field on the Quotation row, also mirrored into the `QuotationItem` Mongo collection) and reuse the same price-lookup/merge logic as `addToCart()` |
| `modules/quotations` | **Done** (core) - `QuotationsModule` at `src/modules/quotations`. Create/update/clone/restore-version/get/list/delete, full calculation engine (`calculateTotals`), daily numbering, Mongo versioning snapshots, floor/room/option-aware product enrichment. **Not ported**: `services/export.service.js` (301 lines, Excel/PDF export) and the couple of edge-case helpers inside `product-enrichment.service.js` that only mattered for a "variants" UI concept not otherwise represented yet |
| `modules/engagement` | `activity-log.model.js` (**done**, MySQL via `ActivityLogModule`) + notification model (not done) | `NotificationsModule` wrapping `NotificationsGateway` still needed - the gateway skeleton exists but has no room-join/emit logic and nothing calls it yet (all `sendNotification()` call sites across Customers/Quotations/Orders are marked as TODO comments) |
| `modules/device-management` | device model + `device.service.js` | Push-token/device registration, straightforward |

### Team model - referenced but never migrated

`Order.assignedTeamId` and (per the legacy `orders.model.js`) an
`assignedTeam` association point at a `Team` model that **does not appear
anywhere in the uploaded codebase** - no `team.model.js`, no
`modules/teams` directory. Either it lived in a part of the legacy repo
that wasn't included in the zip, or team assignment was a planned-but-
unshipped feature. Treat `assignedTeamId` as an opaque UUID column (as
it's implemented here) until you can confirm which is the case - don't
invent a Team entity from scratch without checking the real production
schema first, since a guessed shape could silently diverge from
whatever the frontend already expects.

## Cross-cutting infrastructure still to migrate

### Permission cache (Mongo, 24h TTL)
Legacy `middleware/permission.js` cached flattened permissions per user in
`CachedPermission` (Mongo) to avoid a MySQL join on every request. The
current `PermissionsGuard` skips this cache and queries MySQL directly.
To restore it: add a Mongoose `CachedPermission` schema (see
`modules/rbac/models/cached-permission.model.js`) and check/update it inside
`PermissionsGuard`, same 24h freshness check as the original. The daily
`node-cron` job that clears it becomes an `@Cron('0 2 * * *')` method using
`@nestjs/schedule` (already installed).

### Activity logging (`utils/activityLogger.js`) - DONE
Ported as `ActivityLogService` (global module, `src/modules/engagement`) -
turns out `ActivityLog` is a MySQL/Sequelize model, not Mongo (despite
living in `modules/engagement`), see `activity-log.model.js`. Used
fire-and-forget (`.catch(() => {})`, never awaited) from Customers,
Quotations, and Orders. Wire it into Vendors/Brands/PurchaseOrder/RBAC the
same way as those modules get built - every legacy controller you'll port
from here on calls `logActivity(...)` at least once per write endpoint.

### Realtime / Socket.IO (`socket.js`, `socket/index.js`, `socket/support.js`)
`NotificationsGateway` is scaffolded but empty. Port the room-join and
event-emission logic from `socket/index.js` and `socket/support.js` into
gateway methods. `req.io` (attached in legacy middleware so any route could
`req.io.emit(...)`) becomes: inject `NotificationsGateway` into whichever
service needs to emit, and call `gateway.emitToUser(...)`.

### Background jobs (`lib/queue.js`, `workers/bulkImportWorker.js`, `workers/jobWorker.js`)
Replace with `@nestjs/bullmq` (already in `package.json`):
```ts
BullModule.forRootAsync({ useFactory: (config) => ({ connection: { host: config.get('redis.host'), port: config.get('redis.port') } }) })
BullModule.registerQueue({ name: 'bulk-import' })
```
Each legacy `workers/*.js` file becomes a `@Processor('bulk-import')` class
with a `@Process()` method containing the same logic.

### File uploads (`middleware/upload.js`, multer + sharp)
Use `@UseInterceptors(FileInterceptor('file', { limits, fileFilter }))` on
the relevant controller methods (user photo upload, bulk import CSV/XLSX,
product images). Keep `sharp` for thumbnail generation - call it in the
service after receiving the buffer.

### Email (`middleware/sendMail.js`, `config/template.js`)
Wrap in a `MailModule`/`MailService` using `resend` (already a dependency)
or `nodemailer`. Inject into `AuthService` for verification/reset emails
instead of the commented-out calls currently in `auth.service.ts`.

### Rate limiting (`middleware/rateLimit.js`)
`apiLimiter` (global, mounted on `/api`) is approximated by the global
`ThrottlerModule.forRoot(...)` in `app.module.ts`. `burstLimiter` (stricter,
only on `/carts`, `/order`, `/quotation`) should be applied per-controller:
`@UseGuards(ThrottlerGuard)` + `@Throttle({ default: { limit: X, ttl: Y } })`
on `CartController`, `OrdersController`, `QuotationsController`.

### Keep-alive pinger / Render spin-down workaround
The `setInterval` self-ping in legacy `index.js` is Render-hosting-specific
plumbing, not business logic. If you're still deploying to Render's free
tier, port it verbatim into a small `@Injectable()` with `onModuleInit()`;
otherwise drop it.

### Database migrations
The legacy app relies on `sequelize.sync()`/manual schema management
(`sequelize-cli` is a dev dependency but check if `migrations/` exists -
none were found in the uploaded zip, so the schema currently lives only in
the `sequelize.define()` calls). Recommendation: once all entities are
ported, run `sequelize-cli model:generate`-style migrations generated from
the final TypeScript entities so schema changes are tracked going forward,
rather than relying on `synchronize: true` (which is deliberately left
`false` in `database.module.ts`).

## Suggested order to tackle the rest

Done so far: Products, Cart, Customers, Quotations, Orders (core),
Vendors, Purchase Order + FGS.

1. **Brands** (+ Category/ParentCategory) - the only remaining module that
   unlocks real `@BelongsTo` associations for `Product.brandId/categoryId`,
   `Keyword.categoryId`, and `Vendor.brandId` (all currently plain UUID
   columns).
2. **Orders follow-up passes** - `updateOrderById` (764 lines) is the
   single biggest remaining gap in a "done" module; budget a dedicated
   pass for it plus the dispatch/credit-note write endpoints (entities
   exist, controllers don't) and PDF generation (invoice/gate-pass/
   download).
3. **Engagement (Notifications)** + **Device Management** - ActivityLog is
   done; Notifications (the Mongo model + `NotificationsGateway` wiring +
   every `sendNotification()` call site left as a TODO across Customers/
   Quotations/Orders/FGS/PurchaseOrder) is not.
4. **Search** (last, since it queries across everything above)

Cross-cutting infra (BullMQ workers, file uploads, mail, permission
cache) can be layered in alongside whichever module needs them first.
