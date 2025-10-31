import numberToWords from "number-to-words";

export const amountInWords = (num) => {
  try {
    const int = Math.floor(num);
    const dec = Math.round((num - int) * 100);
    let str = numberToWords.toWords(int);
    str = str.charAt(0).toUpperCase() + str.slice(1) + " rupees";
    if (dec) str += ` and ${numberToWords.toWords(dec)} paisa`;
    return str + " only";
  } catch {
    return "N/A";
  }
};

export const calcTotals = (products, gstValue, includeGst) => {
  const subtotal = products.reduce((s, p) => s + Number(p.total || 0), 0);
  const gst = includeGst ? (subtotal * gstValue) / 100 : 0;
  return { subtotal, gst, total: subtotal + gst };
};
