Run from `backend`:

```sh
npm run inventory:reconcile
```

Reads `backend/.env` (DATABASE_URL, or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME). Pulls products, brands and metadata definitions in one consistent read-only MySQL transaction. Does not import application models, sync tables, or insert/update records.

Defaults to `scripts/json-outputs/inventory.json`. Outputs under `scripts/json-outputs/inventory-reconciliation/`:

- `database-snapshot.json`: database products and reference definitions for replay.
- `existing-products.json`: complete matched product rows with inventory changes merged.
- `new-products.json`: complete new product rows with UUIDs and unique ECLCO internal codes.
- `review-required.json`: missing/duplicated company codes, ambiguous database matches, or invalid source values.
- `summary.json`: counts.

Optional paths (relative to your current directory):

```sh
npm run inventory:reconcile -- --input ./scripts/json-outputs/inventory.json --output ./scripts/json-outputs/colston-review
npm run inventory:reconcile -- --snapshot ./scripts/json-outputs/inventory-reconciliation/database-snapshot.json --output ./scripts/json-outputs/colston-replay
npm run inventory:reconcile:test
```

Match only Colston products using trimmed, case-insensitive company codes in `meta` (the live companyCode UUID, with a legacy slug fallback). Never match by name. All rows sharing a duplicate input code require review, even when otherwise identical.

Refresh name, nonblank description, company code, selling price (including zero), and color. Preserve existing IDs, internal product codes, stock, images, dates of creation, category/vendor relationships, variant fields, and unrelated metadata. Metadata definitions come from the snapshot and must have compatible types. New rows use the supplied Colston brand ID, zero stock, active status, and nullable foreign keys; source category and section labels do not establish database relationships.

Upload payloads exclude `inventorySource`, including any existing copies at the product or metadata level. Source dimensions, section, category and page are not added to product payloads. No category IDs, tax rates, HSN codes, or variant relationships are inferred.

JSON columns are emitted as JSON objects/arrays rather than double-encoded strings. Timestamps use ISO date strings for a model/import layer to deserialize. An eventual importer must recheck unique product codes against the live database, since another process could allocate codes after this snapshot. Resolve review rows before import. Running again replaces files in the selected output directory and allocates fresh UUIDs for new rows.

To import the generated product files, run from `backend`:

```sh
npm run inventory:seed
```

This runs only `20261006000100-seed-colston-reconciled-inventory.js`, using the existing Sequelize CLI configuration in `config/config.json`. Set `INVENTORY_RECONCILIATION_DIR` to use a different payload directory; otherwise the seeder reads the default reconciliation directory.

Both files are imported in one transaction. Existing rows are identified by UUID, internal product code, brand, and company code. Only name, description, imported company-code/price/color metadata, and updatedAt are updated; current stock, relationships, images, variants and unrelated live metadata are preserved. `inventorySource` is removed. New rows use the generated UUIDs and complete schema payloads, with JSON serialization and date conversion. Already inserted rows with the same identity are skipped on repeat runs. Missing existing products, conflicting IDs/internal codes, or company codes created since reconciliation abort and roll back the transaction. Review rows are excluded. Database constraints remain enabled.

```sh
npm run inventory:seed:test
```

These tests use an in-memory transaction adapter and the generated files; they do not write to MySQL. Automatic `down` is deliberately unsupported because reverting existing product edits needs the original values and must preserve subsequent changes.
