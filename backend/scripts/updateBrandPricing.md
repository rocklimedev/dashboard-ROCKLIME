# Colston pricing reconciliation

## Import the November 5 output

Upload the 258 files from `json-outputs/colston-pricing-update-2026-11-05-colston2/images/` to the CDN `/product_images/colston2/` directory before importing. From `backend`, run:

```powershell
npx sequelize-cli db:seed --seed 20261105000100-seed-colston-pricing.js
```

This seeder reads only `updated_existing_products.json` from that output directory. `COLSTON_PRICING_DIR` overrides the directory. It compares the existing-product file against live records and applies name/description, mapped metadata (including price and HSN), and missing-image changes, preserving live quantity, unrelated metadata, existing images, tax, and relationships. New product insertion is disabled. Progress is logged every 100 products, each update lists changed fields, and the final log confirms the transaction commit. Identity/code conflicts abort the transaction. The 20 review rows are excluded. Automatic undo is unavailable because existing records are updated. Tests: `node --test scripts/seedColstonPricing.test.js`.

Run from the repository root:

```powershell
node backend/scripts/updateBrandPricing.js
node --test backend/scripts/updateBrandPricing.test.js
```

This script creates JSON files and downloads missing images. It never connects to the database, uploads to the CDN, or changes the source files.

## Inputs

- `backend/scripts/json-outputs/products_backup.json` (the existing file is plural, not `product_backup.json`). This is the supplied snapshot, not a fresh live database backup.
- `backend/scripts/json-outputs/all_sheets_data2.json`. Accepts a product array or an object containing sheet arrays. Rows must already have the named columns below; unlabelled Excel columns are not guessed.
- Every source brand label belongs to brand ID `acbe7061-9b76-47d1-a509-e4b1f982a36f`, as requested. Other brands in the backup are never updated.

## Output

Files are written under `backend/scripts/json-outputs/colston-pricing-update/`:

| File                             | Contents                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `updated_existing_products.json` | Full backup-format records matched by company code, including unchanged matches. Use this for updates of existing IDs.                                                                                                         |
| `new_updated.json`               | Full product-format candidates absent from the brand's backup company-code index, with new stable UUIDs and unique internal product codes. Existing item IDs under a different code are held for review instead of duplicated. |
| `updated_products.json`          | Existing matches plus new candidates. This is a partial update/import dataset, not a replacement for the entire database or backup.                                                                                            |
| `needs_review.json`              | Ambiguous company codes, changed company codes with existing item IDs, or invalid rows. Contains source rows and candidate identities. These rows are omitted from update/new outputs.                                         |
| `mapping_report.json`            | Counts, old/new prices and HSN, changed fields, unmatched backup IDs, deferred/unmapped source fields, image manifest, source file SHA-256 hashes, and warnings.                                                               |
| `images/`                        | Downloaded source image bytes with stable unique filenames and extensions detected from image content.                                                                                                                         |

The inputs are required and preserved. No name/fuzzy matching is used. Matching trims and uppercases company codes without removing punctuation or leading zeros. Duplicate source company codes and duplicate backup matches are held for review; the script never silently picks one. New UUIDs are deterministic for brand/company code. New internal codes continue the `ECLCO` sequence in the supplied backup. Re-running against a newer backup can change that sequence, so reconcile again from a current snapshot before importing.

## Field mapping

| Source          | Target                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| `company_code`  | `meta.d11da9f9-3f2e-4536-8236-9671200cca4a`                                       |
| `selling_price` | `meta.9ba862ef-f993-4873-95ef-1fef10036aa5` (numeric, zero allowed)               |
| `hsn_code`      | `meta.1cf286a9-49cd-11f1-93ac-52540021303b` (preserves string leading zeros)      |
| `item_code`     | `meta.1cf23921-49cd-11f1-93ac-52540021303b`                                       |
| `unit`          | `meta.1cf288ba-49cd-11f1-93ac-52540021303b`                                       |
| `name`          | `name`; description follows only if empty or previously identical to the old name |
| `B`             | Source image URL, downloaded only when the product has no image                   |

Existing product IDs, internal codes, quantities, tax, status, vendor, variant fields, images, categories, keywords, timestamps of creation, and unrelated metadata are preserved. Blank optional metadata cells do not erase existing values. `updatedAt` changes only when a mapped field changes. New products start with quantity zero, null tax/vendor/category, no keywords, and no borrowed custom metadata. A brand-parent ID is inherited only when the brand has exactly one distinct parent ID in the backup.

Tax column `N` is deliberately ignored as requested. Raw `category`, `keywords`, `keyword_1`, `keyword_2`, `G`, and `N` remain in the review report for later mapping; they are not written into category/keyword relationships or guessed metadata. The existing Goods/type metadata is preserved where present.

## Images and CDN

Images are downloaded with bounded concurrency, timeouts, retries, size checks, and format validation. Existing downloaded files are reused. Existing product images are never replaced. Missing or non-URL source images stay empty and non-URL values are reported. Failed downloads leave the product image unchanged and appear in the report. The report records success/failure counts; inspect it before importing.

Successful downloads generate URLs at:

```text
https://media.cmtradingco.com/product_images/colston/<productId>-<source-url-hash>.<detected-extension>
```

Upload the files in `images/` into the CDN's `/product_images/colston/` directory before using those URLs. The script stages files locally; generated CDN URLs do not establish that they are hosted. Keep the filenames unchanged. Upload only manifest entries from the current `mapping_report.json`; previous runs may leave unused cached image files.

Optional path overrides:

```powershell
node backend/scripts/updateBrandPricing.js --backup C:\data\products_backup.json --source C:\data\all_sheets_data2.json --out C:\data\pricing-output
```

Optional `--brands "Colston,Other"` restricts the accepted source brand labels. Default accepts all labels. `--image-column B` and `--cdn-base https://media.cmtradingco.com/product_images/colston` override image mapping. Tax is left alone by default; only an explicit `--tax-column N` maps it.

Resolve `needs_review.json` against the source and backup before a complete catalogue import. Products absent from the source are listed as untouched in the report and are never deleted or deactivated. Importing should update existing IDs separately from inserting new candidates and should preserve current live stock; this snapshot must not overwrite stock changed since the backup.
