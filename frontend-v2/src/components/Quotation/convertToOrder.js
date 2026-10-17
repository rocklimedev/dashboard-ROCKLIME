import moment from "moment";

/**
 * Navigation state for "Convert to order": the order form opens pre-filled
 * with the quotation's customer, lines, discount, freight and GST.
 * Optional lines (alternatives) are left out — they were never in the total.
 */
export function orderStateFromQuotation(q) {
  const raw = Array.isArray(q?.items) ? q.items : [];
  const lines = raw.filter((item) => !item.isOptionFor && !item.isOption);
  const products = lines.map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;
    const discountType = item.discountType || "percent";
    const unit = discountType === "percent" ? price * (1 - discount / 100) : price - discount;
    return {
      id: item.productId,
      price: Number(price.toFixed(2)),
      quantity: qty,
      discount,
      discountType,
      total: Number((unit * qty).toFixed(2)),
    };
  });
  return {
    quotationData: {
      createdFor: q.customerId,
      dueDate: moment().add(7, "days").format("YYYY-MM-DD"),
      description: `Converted from Quotation #${q.reference_number || q.quotationId}`,
      shipTo: q.shipTo || null,
      gst: q.gst || null,
      extraDiscount: q.extraDiscount || null,
      extraDiscountType: q.extraDiscountType || "fixed",
      shipping: q.shippingAmount || 0,
      products,
      quotationId: q.quotationId,
    },
  };
}
