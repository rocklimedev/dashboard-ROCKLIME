/**
 * Computes all quotation-level totals: main-item subtotal/discounts,
 * extra discount, rounding, GST, and a separate rollup of "optional"
 * (add-on) items which are excluded from the taxable/final amount math.
 */
function calculateTotals(
  items = [],
  extraDiscount = 0,
  extraDiscountType = "percent",
  shippingAmount = 0,
  gst = 0,
) {
  // Optional/addon items are excluded from the main totals
  const mainItems = items.filter((item) => {
    const isOptional =
      Boolean(item.isOption) ||
      Boolean(item.isOptionFor) ||
      (item.optionType && item.optionType !== "main");

    return !isOptional;
  });

  const optionalItems = items.filter((item) => {
    return (
      Boolean(item.isOption) ||
      Boolean(item.isOptionFor) ||
      (item.optionType && item.optionType !== "main")
    );
  });

  let subTotal = 0;
  let totalItemDiscount = 0;
  let taxableAmount = 0;

  mainItems.forEach((p) => {
    const lineGross = (Number(p.price) || 0) * (Number(p.quantity) || 1);
    const discountAmount =
      p.discountType === "percent"
        ? (lineGross * (Number(p.discount) || 0)) / 100
        : (Number(p.discount) || 0) * (Number(p.quantity) || 1);

    const lineAfterDiscount = lineGross - discountAmount;

    subTotal += lineGross;
    totalItemDiscount += discountAmount;
    taxableAmount += lineAfterDiscount;
  });

  const baseForExtraDiscount = taxableAmount + Number(shippingAmount || 0);
  const extraDiscountAmount =
    extraDiscountType === "percent"
      ? (baseForExtraDiscount * Number(extraDiscount || 0)) / 100
      : Number(extraDiscount || 0);

  const amountBeforeGst = baseForExtraDiscount - extraDiscountAmount;
  const roundedAmount = Math.round(amountBeforeGst);
  const roundOff = roundedAmount - amountBeforeGst;

  const gstAmount = roundedAmount * (Number(gst || 0) / 100);
  const finalAmount = roundedAmount + gstAmount;

  const optionalTotal = optionalItems.reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
  }, 0);

  return {
    subTotal: Number(subTotal.toFixed(2)),
    totalItemDiscount: Number(totalItemDiscount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    extraDiscountAmount: Number(extraDiscountAmount.toFixed(2)),
    shippingAmount: Number(shippingAmount || 0),
    amountBeforeGst: Number(amountBeforeGst.toFixed(2)),
    roundOff: Number(roundOff.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    finalAmount: Number(finalAmount.toFixed(2)),

    optionalItems,
    optionalTotal: Number(optionalTotal.toFixed(2)),
    optionalItemsCount: optionalItems.length,
  };
}

module.exports = { calculateTotals };
