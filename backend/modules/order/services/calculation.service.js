/**
 * Compute totals (GST, extra discount, final amount).
 * @returns {{subTotal, totalWithShipping, gstValue, extraDiscountValue, finalAmount}}
 */
function computeTotals({
  products = [],
  shipping = 0,
  gst = 0,
  extraDiscount = 0,
  extraDiscountType = "fixed",
  amountPaid = 0,
}) {
  // 1. Sub-total (price * qty after line-discount)
  const subTotal = products.reduce((sum, p) => sum + (p.total ?? 0), 0);

  // 2. Shipping
  const totalWithShipping = subTotal + Number(shipping);

  // 3. GST
  const gstValue = (totalWithShipping * Number(gst)) / 100;

  // 4. Extra discount
  let extraDiscountValue = 0;
  if (extraDiscount > 0) {
    extraDiscountValue =
      extraDiscountType === "percent"
        ? (totalWithShipping * Number(extraDiscount)) / 100
        : Number(extraDiscount);
  }

  // 5. Final amount
  const finalAmount = totalWithShipping + gstValue - extraDiscountValue;

  // NOTE: amountPaid-exceeds-finalAmount validation is intentionally
  // disabled, mirroring the original controller (kept commented there).
  // if (Number(amountPaid) > finalAmount + 0.01) {
  //   throw new Error(`amountPaid (${amountPaid}) cannot exceed final amount (${finalAmount.toFixed(2)})`);
  // }

  return {
    subTotal,
    totalWithShipping,
    gstValue,
    extraDiscountValue,
    finalAmount,
  };
}

module.exports = { computeTotals };
