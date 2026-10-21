Run from backend:

    npm run products:duplicates
    npm run products:duplicates -- --input scripts/json-outputs/inventory-reconciliation/database-snapshot.json
    npm run products:duplicates -- --threshold 0.95 --output ./duplicate-review
    npm run products:duplicates -- --updated-on 2026-07-24 --timezone Asia/Kolkata

Without --input, reads the configured database in a consistent read transaction. Input snapshots must contain products and productMetas arrays. Never modifies the database.

Company codes use live metadata IDs plus legacy companyCode/company_code keys. Codes and names are trimmed, case-insensitive and whitespace-normalized. Names use normalized Levenshtein similarity (minimum 90%). Each pair is checked independently, so chained matches cannot introduce false pairs. Products from different brands are included when the code matches, but brand differences require review. Missing/conflicting codes, names and malformed JSON are reported separately.

Outputs:

- exact-duplicates.json: same business fields; IDs, internal product codes and timestamps excluded from comparison.
- differences-review.json: matching company code and >=90% name similarity, with every differing business field and both complete records. Includes stock, variants, brand, metadata and raw name differences.
- skipped-products.json: records that cannot be safely compared.
- summary.json: counts and comparison policy.

Date focus defaults to 24 July 2026 in Asia/Kolkata (India time). It compares the entire catalog first: duplicate counterparts are never filtered by date. Additional reports:

- updated-on-date-duplicates.json: candidate pairs where either product's latest updatedAt falls on the target day.
- created-on-date-duplicates.json: candidate pairs where either product was created on the target day, including products updated again later.
- date-matched-products.json: unique target-day products with their full records, current selling prices and all matching counterparts. Flags distinguish older products updated that day from products created that day. Each counterpart records whether it was created before, on, or after the target day.
- missing-or-invalid-dates.json: products with missing or unrecognized createdAt/updatedAt timestamps.
- date-summary.json: date, timezone, counts and evidence limits; also included under summary.json.dateFocus.

Dates with Z or an explicit UTC offset, and Sequelize Date values, are interpreted as instants and converted to the chosen timezone. Timezone-less SQL/ISO timestamps default to UTC, matching Sequelize's default. For a dump whose bare timestamps are India-local, pass --timestamp-offset +05:30. This is independent of --timezone, which chooses the report's calendar day. India day 24 July spans 23 July 18:30 UTC through 24 July 18:29:59.999 UTC. Invalid target dates/timezones/offsets fail before database access.

updatedAt records only the latest update and does not identify which fields changed. A later update can hide a July 24 update. Current selling prices and price differences are comparison aids, not proof that pricing changed that day. Historical pricing attribution requires an audit log or a snapshot from that period. Created-on-day reports supplement the latest-update report but do not establish when a duplicate relationship first existed. No products are changed or deleted.

These are candidate pairs, not deletion instructions. Check order, quotation, inventory and other references before merging anything. One product may occur in several pairs. Comparison cost is quadratic within each company-code bucket, not across the full database.

Operations is available at /operations in both frontend applications, backed by /api/operations. ADMIN, SUPER_ADMIN and DEVELOPER roles can create/download product snapshots and duplicate reports. Product backups cover products and product metadata only, not the entire database or uploaded image files. Artifacts are stored outside public static directories in backend/storage/operations; configure OPERATIONS_STORAGE_DIR to a persistent private volume in production. No automatic retention or restore is implemented. The in-process busy guard serializes runs on a single server process; use a shared job queue before deploying multiple workers. New services can extend the service registry and handlers.
