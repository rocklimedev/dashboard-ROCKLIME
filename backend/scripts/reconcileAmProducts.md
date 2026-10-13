Run from the repository root:

```sh
node backend/scripts/reconcileAmProducts.js
```

Optional arguments are input directory and output directory. Inputs are `products_backup.json` and `as_product_data.json`; outputs are `corrected_am.json` and `new_am.json`, as arrays in the backup product format. This script does not write to the database.

Only American Standard records are matched, using trimmed, case-insensitive company codes. The company code metadata key is `d11da9f9-3f2e-4536-8236-9671200cca4a`. `1cf286a9-49cd-11f1-93ac-52540021303b` is HSN and is preserved. Legacy `companyCode` and `company_code` metadata keys are supported; conflicting keys and duplicate source codes stop generation.

The source catalogue `product_code` is checked against both backup `product_code` and company-code fields (UUID metadata plus `companyCode`, `company_code`, and `companycode` aliases). A match in either location goes to corrected products, preserving the existing UUID/internal code. Only codes absent from both locations become new products. Multiple source rows targeting the same master record stop generation. The seeder also checks live `product_code` against the catalogue company code before inserting, and aborts for matches added since the backup so reconciliation can be refreshed.

Corrected records preserve all master fields except catalogue name, generated description, and images when an image URL is supplied. All master records sharing a source company code are included, with duplicates printed to the console. No records are merged or deleted. Unmatched master records are excluded from these brand-specific deliverables.

Descriptions combine collection, product type, category, and finish. Extraction-only fields, serial numbers, and text category labels are not written as database fields. Image URLs are mapped to the backup's `images` field.

New products use the exact master field structure, including ISO `createdAt` and `updatedAt` timestamps and string-serialized image arrays. They receive stable generated UUIDs, unique internal codes continuing the `EAMAM` sequence, zero stock, active status, and the American Standard brand ID. Tax defaults to the backup-style string `0.00`; unknown category/vendor relationships remain null. The brand parent category is taken from the backup when all non-null American Standard parent IDs agree. Prices and HSN are not inferred. Review new internal codes against the live database before importing an old snapshot. The source catalogue code is stored in company-code metadata, not the internal `product_code` field.

Current inputs produce 104 corrected records (98 source codes, including six duplicate master codes) and 67 new products, covering all 165 source codes.

Seed both files from the backend directory:

```sh
npm run products:am:seed
```

The Sequelize seeder `20261013000100-seed-am-products.js` reads both files from `scripts/json-outputs` (override with `AM_PRODUCTS_DIR`). Existing products are verified by UUID, internal code, brand, and company code; only name, description, images, and `updatedAt` are updated. Live stock, metadata, prices, relationships, and other fields are preserved. All matched duplicate master records remain separate. New rows use the complete JSON payload with JSON serialization and date conversion. Repeat runs skip already inserted products with matching identities. Missing or conflicting identities and company codes added since reconciliation abort the entire transaction. Automatic undo is unavailable because prior values are not stored. No foreign key checks are disabled.

Run the transaction-adapter tests with `npm run products:am:seed:test`. These exercise the complete generated payloads, repeat runs, field preservation, validation, and rollback; they do not connect to the live database.
