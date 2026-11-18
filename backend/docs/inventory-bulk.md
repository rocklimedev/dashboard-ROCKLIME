Inventory multi-select is available in both frontend applications at /inventory/list. Select individual rows or use the table header checkbox for the visible page. Selection is preserved across pages and filters, up to 500 products. The selection toolbar provides:

- Update stock: set, add or remove an amount for all selected products, then adjust individual final quantities in the preview. Stock is a nonnegative integer; zero is supported. Every changed quantity creates an adjustment record with the authenticated actor and optional note.
- Update prices: set a selling price or apply a percentage change, then review individual final prices. Zero prices are supported. Percentage changes require an existing price. Writes the live sellingPrice metadata ID and synchronizes legacy price keys already present.
- Export products: Excel with numeric stock/prices, or JSON with full product records.
- Export inventory records: Excel with separate selected-products and inventory-history sheets. Includes every history record for the selected IDs, not just the first history page, plus actor names, changes, resulting quantities, order references, dates and notes. Products with no history remain visible in the product sheet.
- Delete selected: confirm the chosen names in the dialog. Deletion is atomic; products with history, variants or other relational/JSON references block the entire batch. Deselect referenced products to delete the remainder.

Backend routes under /api/products/inventory-bulk are authenticated and recheck permissions against the current database role. SUPER_ADMIN and DEVELOPER can use all actions; other roles need the corresponding edit/delete/export permission in products or inventory. The frontend mirrors these controls.

POST /update accepts { updates: [{ productId, quantity?, expectedQuantity?, sellingPrice?, expectedSellingPrice? }], message? }. Stock updates require the observed previous quantity; price updates require the observed previous price (null when absent). Concurrent changes cause a 409 and roll back the entire batch. Refresh and reselect before retrying.

POST /delete accepts { productIds }. POST /export accepts { productIds, includeHistory? } and returns a consistent JSON snapshot for the frontend Excel generator. IDs must be unique UUIDs; all selected records must exist. No matching by company code is used.

Validation: run npm run inventory:bulk:test from backend. Tests cover duplicate company codes, zero quantities/prices, metadata preservation, stock history, atomic rollback, permission denial, reference protection, complete history exports, and Excel round-trip checks including formula-like names remaining literal text.
