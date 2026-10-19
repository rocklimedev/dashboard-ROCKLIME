# Quotation dispatch

FrontendV2: open a quotation, choose **Dispatch products**, select products and quantities, then confirm. Batches appear in Dispatch History and open at /dispatch/:dispatchId. The order page also links to this details page.

## Database rollout

Run the pending Sequelize migrations, including 20261019000300-quotation-dispatch.js, before deploying the changed API. Earlier quotation adjustment migrations remain required. No migration is applied automatically by this change.

The dispatch table now permits a null orderId for quotation shipments and stores quotationId, quotationRef and documentSnapshot. Existing order shipments remain supported. A rollback refuses to discard quotation-only shipments.

## Quantities and stock

- Optional quotation alternatives are excluded. Positive whole quantities are required.
- A quotation row lock serializes quotation and linked-order dispatches. Duplicate requested rows are combined before remaining quantities are checked.
- Active linked orders receive quantity credits in creation order. Their reservations are consumed up to those credits; further quantities use free stock. Unrelated reservations stay untouched. Order status, remaining needs and reservations include these credits.
- Stock movements, credits, the dispatch row and the saved document are written in one transaction. Insufficient stock rolls back the batch.
- Items split between rooms consume their remaining location shares in quotation order. The floor/room control filters products; it does not select individual location shares.
- Historical shipped quantities remain counted against the quotation. Returns retain the existing dispatch-history semantics.

## Document and exports

New dispatches snapshot customer/address information, selected item quantities and pricing. Editing the quotation later does not rewrite these documents. Existing dispatches without a snapshot use their saved item data and available order/quotation context.

The dispatch PDF uses the quotation renderer with the Dispatch label, including photos/compact layouts, cover toggle, field filters, PDF page inclusion and page order, and expiring customer share links. PDF field/page selections also affect the preview. Excel shares field visibility controls. Fixed quotation-level amounts are apportioned by selected goods value; percentage discount and GST rates are retained. GST invoices and uploaded invoice/gate-pass attachments continue through the existing order workflow.

Dispatch delivery confirmation supports quotation shipments and updates credited orders. Reading and confirming dispatches requires the corresponding quotation/order view and edit permission.

## API

- GET /quotation/:id/dispatches — batches and remaining quotation lines
- POST /quotation/:id/dispatches — items [{ productId, sourceLineKey, quantity }], transport fields and remarks
- GET /order/dispatch-history?quotationId=... — combined history
- GET /order/dispatch/:dispatchId — saved document and dispatch metadata
- GET /order/dispatch/:dispatchId/pdf — quotation-style dispatch PDF
- POST /order/dispatch/:dispatchId/share — expiring customer PDF link
- POST /order/dispatch/:dispatchId/delivered — delivery confirmation and optional proof upload

## Validation

Run node --test backend/local-tools/quotation-dispatch.test.js backend/local-tools/quotation-dispatch-controller.test.js backend/local-tools/dispatch-stock.test.js backend/local-tools/dispatch-pdf.test.js, existing quotation pricing/export tests, and npm run build --prefix frontend-v2. Controller and stock tests use isolated in-memory dependencies and do not mutate a live database.
