// calcHelpers.js
import numberToWords from "number-to-words";

/* --------------------------------------------------------------
   Amount in Indian words (crore / lakh / thousand / hundred)
   -------------------------------------------------------------- */
export const amountInWords = (num) => {
  try {
    if (isNaN(num) || num == null) return "N/A";

    const int = Math.floor(num);
    const dec = Math.round((num - int) * 100);

    const units = [
      "",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];
    const tens = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
    ];

    const toWords = (n) => {
      if (n < 20) return units[n];
      const t = Math.floor(n / 10);
      const u = n % 10;
      return tens[t] + (u ? " " + units[u] : "");
    };

    const convert = (n) => {
      if (n === 0) return "";
      const str = n.toString().padStart(9, "0");
      const crore = parseInt(str.slice(0, 2), 10);
      const lakh = parseInt(str.slice(2, 4), 10);
      const thousand = parseInt(str.slice(4, 6), 10);
      const hundred = parseInt(str.slice(6, 7), 10);
      const rest = parseInt(str.slice(7), 10);

      const words = [];
      if (crore) words.push(toWords(crore) + " crore");
      if (lakh) words.push(toWords(lakh) + " lakh");
      if (thousand) words.push(toWords(thousand) + " thousand");
      if (hundred) words.push(units[hundred] + " hundred");
      if (rest) words.push(toWords(rest));

      return words.filter(Boolean).join(" ");
    };

    let out = convert(int);
    out = out
      ? out.charAt(0).toUpperCase() + out.slice(1) + " rupees"
      : "Zero rupees";

    if (dec > 0) {
      out += ` and ${numberToWords.toWords(dec)} paisa`;
    }

    return out + " only";
  } catch (err) {
    console.error("amountInWords failed:", err);
    return "N/A";
  }
};

/* --------------------------------------------------------------
   Improved totals with full discount visibility
   -------------------------------------------------------------- */
export const calcTotals = (
  products = [],
  gstRate = 18,
  includeGst = true,
  productDetailsMap = {},
  extraDiscount = 0,
  extraDiscountType = "amount",
  roundOff = 0
) => {
  const safeGstRate = Number(gstRate) || 0;
  const safeIncludeGst = includeGst !== false;
  const safeExtraDiscount = Number(extraDiscount) || 0;
  const safeExtraDiscType = (extraDiscountType || "amount").toLowerCase();
  const safeRoundOff = Number(roundOff) || 0;

  let subtotal = 0; // MRP × Qty (before any discount)
  let totalProductDiscount = 0; // Sum of all per-item discounts

  products.forEach((p) => {
    const qty = Number(p.quantity) || 1;
    const detail = productDetailsMap[p.productId] || {};
    const basePrice = Number(
      detail.sellingPrice || detail.price || p.price || 0
    );

    // 1. Original amount before discount
    const originalLineTotal = basePrice * qty;

    // 2. Discount applied on this item
    const itemDiscPercent = Number(p.discount || 0);
    const itemDiscAmount = originalLineTotal * (itemDiscPercent / 100);

    // 3. Final line total for this item
    const finalLineTotal = originalLineTotal - itemDiscAmount;

    subtotal += originalLineTotal;
    totalProductDiscount += itemDiscAmount;

    // Optional: warn if saved total differs significantly
    const savedTotal = Number(p.total || 0);
    if (savedTotal > 0 && Math.abs(savedTotal - finalLineTotal) > 1) {
      console.warn(`Item ${p.productId || p.name} total mismatch`, {
        calculated: finalLineTotal,
        saved: savedTotal,
        discountPercent: itemDiscPercent,
      });
    }
  });

  // Extra discount (on subtotal after product discount)
  let extraDiscountAmt = 0;
  if (safeExtraDiscount > 0) {
    const baseForExtra = subtotal - totalProductDiscount;
    extraDiscountAmt =
      safeExtraDiscType === "percent"
        ? baseForExtra * (safeExtraDiscount / 100)
        : safeExtraDiscount;
  }

  const taxableValue = subtotal - totalProductDiscount - extraDiscountAmt;

  // GST
  const gstAmount = safeIncludeGst ? (taxableValue * safeGstRate) / 100 : 0;

  // Final total with round-off
  const totalBeforeRound = taxableValue + gstAmount;
  const finalTotal = Math.round(totalBeforeRound + safeRoundOff);

  // Actual round-off applied (useful to display)
  const roundOffApplied = finalTotal - totalBeforeRound;

  return {
    // Core values
    subtotal: Number(subtotal.toFixed(2)),
    totalProductDiscount: Number(totalProductDiscount.toFixed(2)),
    extraDiscountAmt: Number(extraDiscountAmt.toFixed(2)),
    taxableValue: Number(taxableValue.toFixed(2)),
    gst: Number(gstAmount.toFixed(2)),
    roundOffApplied: Number(roundOffApplied.toFixed(2)),
    total: Number(finalTotal.toFixed(2)),

    // For convenience
    amountAfterAllDiscount: Number(
      (subtotal - totalProductDiscount - extraDiscountAmt).toFixed(2)
    ),
  };
};
