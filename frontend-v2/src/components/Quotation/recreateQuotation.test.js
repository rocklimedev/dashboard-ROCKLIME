import test from "node:test";
import assert from "node:assert/strict";
import { quotationCartSnapshot } from "./recreateQuotation.js";
import { quotationTotals } from "../../utils/quotationMath.js";
import { reconcileQuotationItems } from "./quotationCartHelpers.js";

const quotation = {
  quotationId: "original", reference_number: "Q-100", status: "WON", customerId: "customer-A", document_title: "Villa bathrooms",
  quotation_date: "2026-10-01", due_date: "2026-11-01", shipTo: "address-A", signature_name: "Sales", signature_image: "signature.png",
  shippingAmount: 125, gst: 18, extraDiscount: 7, extraDiscountType: "percent", additionalDiscount: 25, flatPrice: 800,
  miscellaneousChargeItems: [{ name: "Installation", amount: 90 }], followupDates: ["2026-10-25"], floors: [{ floorId: "f1", rooms: [{ roomId: "r1" }] }],
  items: [
    { _id: "mongo-line", productId: "tap", name: "Tap", price: 450, quantity: 3, discount: 12, discountType: "percent", tax: 5, additionalDiscount: 10, flatPrice: 350, locations: [{ floorId: "f1", roomId: "r1", assignedQuantity: 3 }], groupId: "g1", priority: 0 },
    { productId: "sink", price: 300, quantity: 1, discount: 20, discountType: "fixed", isOptionFor: "tap", parentProductId: "tap", isOption: true, optionType: "alternative", priority: 1 },
  ],
};
test("recreation pre-fills customer, form, products, options, assignments and all pricing without copying identity", () => {
  const source = structuredClone(quotation);
  const snapshot = quotationCartSnapshot(quotation, new Date(2026, 9, 21));
  assert.equal(snapshot.parent.selectedCustomer, "customer-A");
  assert.equal(snapshot.parent.quotationData.shipTo, "address-A");
  assert.equal(snapshot.parent.quotationData.documentTitle, "Villa bathrooms");
  assert.equal(snapshot.parent.quotationData.quotationDate, "2026-10-21");
  assert.equal(snapshot.parent.quotationData.dueDate, "");
  assert.equal(snapshot.parent.quotationData.createdBy, undefined);
  assert.equal(snapshot.parent.quotationData.validTill, undefined);
  assert.equal(snapshot.parent.quotationData.signatureImage, "signature.png");
  assert.deepEqual(snapshot.parent.quotationData.followupDates, quotation.followupDates);
  assert.deepEqual(snapshot.parent.quotationData.floors, quotation.floors);
  assert.equal(snapshot.parent.quotationId, undefined);
  assert.equal(snapshot.parent.quotationData.status, undefined);
  assert.equal(snapshot.layout.localCartItems[0]._id, undefined);
  assert.deepEqual(snapshot.layout.localCartItems[0].locations, quotation.items[0].locations);
  assert.equal(snapshot.layout.localCartItems[1].isOptionFor, "tap");
  const products = reconcileQuotationItems(structuredClone(snapshot.layout.localCartItems), snapshot.layout.localCartItems);
  const restored = quotationTotals({ items: products, shipping: snapshot.layout.shipping, gstRate: snapshot.layout.gst, extraDiscount: snapshot.parent.quotationData.discountAmount, extraDiscountType: snapshot.parent.quotationData.discountType, ...snapshot.parent.quotationData });
  const original = quotationTotals({ items: quotation.items, shipping: quotation.shippingAmount, gstRate: quotation.gst, ...quotation });
  assert.equal(restored.grandTotal, original.grandTotal);
  assert.equal(restored.optionalTotal, original.optionalTotal);
  snapshot.layout.localCartItems[0].price = 999;
  snapshot.parent.quotationData.floors[0].rooms.push({ roomId: "r2" });
  assert.deepEqual(quotation, source, "editing the recreated cart cannot change the original quotation");
});
test("legacy JSON fields and fixed discounts restore into the cart controls", () => {
  const snapshot = quotationCartSnapshot({ customerId: "customer", floors: JSON.stringify(quotation.floors), products: JSON.stringify(quotation.items), miscellaneousCharges: 50 });
  assert.deepEqual(snapshot.parent.quotationData.floors, quotation.floors);
  assert.equal(snapshot.layout.itemDiscounts.sink, 20);
  assert.equal(snapshot.layout.itemDiscountTypes.sink, "fixed");
  assert.equal(snapshot.layout.itemTaxes.tap, 5);
  assert.deepEqual(snapshot.parent.quotationData.miscellaneousChargeItems, [{ name: "Miscellaneous charges", amount: 50 }]);
});
