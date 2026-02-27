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
    return "N/A";
  }
};

/* --------------------------------------------------------------
   Calculate totals – GST removed, extra discount fixed
   -------------------------------------------------------------- */
export const calcTotals = (
  products = [],
  productDetailsMap = {},
  extraDiscount = 0,
  extraDiscountType = "percent",
  roundOff = 0,
  itemDiscounts = {}, // ← NEW: { productId: number }
  itemDiscountTypes = {}, // ← NEW: { productId: "percent" | "fixed" }
) => {
  const safeExtraDiscount = Number(extraDiscount) || 0;
  const safeExtraDiscType = (extraDiscountType || "percent").toLowerCase();
  const safeRoundOff = Number(roundOff) || 0;

  let subtotal = 0;
  let totalProductDiscount = 0;

  products.forEach((p) => {
    const qty = Number(p.quantity) || 1;

    const basePrice = Number(
      productDetailsMap[p.productId]?.sellingPrice ||
        productDetailsMap[p.productId]?.price ||
        p.price ||
        p.sellingPrice ||
        0,
    );

    const originalLineTotal = basePrice * qty;

    // ── Use the separate discount maps instead of p.discount / p.discountType ──
    const discValue = Number(itemDiscounts[p.productId] || 0);
    const discType = (
      itemDiscountTypes[p.productId] || "percent"
    ).toLowerCase();

    let itemDiscAmount = 0;

    if (discType === "fixed" || discType === "amount") {
      itemDiscAmount = discValue * qty; // fixed discount per unit × quantity
    } else {
      // percent
      itemDiscAmount = originalLineTotal * (discValue / 100);
    }

    const finalLineTotal = originalLineTotal - itemDiscAmount;

    subtotal += originalLineTotal;
    totalProductDiscount += itemDiscAmount;
  });

  // ── rest of the function stays almost the same ──
  let extraDiscountAmt = 0;
  if (safeExtraDiscount > 0) {
    const baseForExtra = subtotal - totalProductDiscount;
    extraDiscountAmt =
      safeExtraDiscType === "percent"
        ? baseForExtra * (safeExtraDiscount / 100)
        : safeExtraDiscount;
    extraDiscountAmt = Math.round(extraDiscountAmt * 100) / 100;
  }

  const taxableValue = subtotal - totalProductDiscount - extraDiscountAmt;
  const totalBeforeRound = taxableValue;
  const finalTotal = Math.round(totalBeforeRound + safeRoundOff);
  const roundOffApplied = finalTotal - totalBeforeRound;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalProductDiscount: Number(totalProductDiscount.toFixed(2)),
    extraDiscountAmt: Number(extraDiscountAmt.toFixed(2)),
    taxableValue: Number(taxableValue.toFixed(2)),
    roundOffApplied: Number(roundOffApplied.toFixed(2)),
    total: Number(finalTotal.toFixed(2)),
    netAfterDiscounts: Number(
      (subtotal - totalProductDiscount - extraDiscountAmt).toFixed(2),
    ),
  };
};
