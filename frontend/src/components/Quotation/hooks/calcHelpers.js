// calcHelpers.js
import numberToWords from "number-to-words";

/* --------------------------------------------------------------
   Amount in Indian words (crore / lakh / thousand / hundred)
   -------------------------------------------------------------- */
export const amountInWords = (num) => {
  try {
    if (isNaN(num)) return "N/A";
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
      return words.join(" ");
    };

    let out = convert(int);
    out = out
      ? out.charAt(0).toUpperCase() + out.slice(1) + " rupees"
      : "Zero rupees";
    if (dec) out += ` and ${numberToWords.toWords(dec)} paisa`;
    return out + " only";
  } catch {
    return "N/A";
  }
};

/* --------------------------------------------------------------
   Totals calculation – now includes extra discount & round-off
   -------------------------------------------------------------- */
export const calcTotals = (
  products = [],
  gstRate = 0,
  includeGst = false,
  productDetailsMap = {},
  extraDiscount = 0,
  extraDiscountType = "amount", // "amount" | "percent"
  roundOff = 0
) => {
  /* ---- 1. Sub-total (after per-item discount) ---- */
  let subtotal = 0;

  products.forEach((p) => {
    const qty = Number(p.quantity) || 1;

    // MRP comes from the parsed product string (productDetailsMap)
    const detail = productDetailsMap[p.productId] || {};
    const mrp = Number(detail.sellingPrice) || 0;

    // p.total = line total **after** the per-item discount
    const lineTotal = Number(p.total) || 0;

    // safety – line total must never exceed MRP * qty
    if (lineTotal > mrp * qty) {
      console.warn("Invalid line total for product", p);
    }

    subtotal += lineTotal;
  });

  /* ---- 2. Extra discount (percent or flat) ---- */
  let extraDiscountAmt = 0;
  if (extraDiscountType === "percent") {
    extraDiscountAmt = subtotal * (Number(extraDiscount) / 100);
  } else {
    extraDiscountAmt = Number(extraDiscount);
  }

  const amountAfterDiscount = subtotal - extraDiscountAmt;

  /* ---- 3. GST (optional) ---- */
  const gstAmount = includeGst
    ? (amountAfterDiscount * Number(gstRate)) / 100
    : 0;

  /* ---- 4. Final total + round-off ---- */
  let total = amountAfterDiscount + gstAmount + Number(roundOff);

  /* ---- 5. Return everything the UI needs ---- */
  return {
    subtotal: Number(subtotal.toFixed(2)),
    extraDiscountAmt: Number(extraDiscountAmt.toFixed(2)), // <-- NEW
    amountAfterDiscount: Number(amountAfterDiscount.toFixed(2)),
    gst: Number(gstAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};
