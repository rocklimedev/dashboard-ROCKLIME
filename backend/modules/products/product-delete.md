# Product deletion references

`POST /api/products/inventory-bulk/delete-preview` accepts `{ "productIds": ["uuid"] }` (1–500 unique IDs). It requires product/inventory delete permission, or the SUPER_ADMIN/DEVELOPER role. Single-product and bulk confirmation dialogs use the same report.

The report contains product names, reference categories, unique record counts, identifiers/document numbers, and the selected product IDs referenced by each record. SQL JSON snapshots and product foreign keys are checked together with Mongo carts, order items, quotation items/versions, purchase order items, and field guided sheet items. Quotation versions, live items, and SQL snapshots sharing a quotation ID count as one quotation. Bulk counts deduplicate records mentioning several selected products.

Any business reference, inventory history, or owned variant prevents deletion. Audit logs are preserved independently and do not block deletion. Unreferenced products and their keyword links are permanently removed. Both single and bulk delete endpoints repeat the checks inside their SQL deletion transaction. MongoDB unavailability, invalid JSON, or incomplete/oversized reference results prevent deletion; they never become a zero-reference report.

SQL product rows are locked during deletion and foreign keys remain enabled. SQL and Mongo do not share a transaction or distributed lock: concurrent Mongo writers can still add references after the final check. Perform cleanup while document creation for these products is paused.

Validation: `node --test scripts/productDelete.test.js scripts/inventoryBulk.test.js scripts/productMerge.test.js` from `backend`.
