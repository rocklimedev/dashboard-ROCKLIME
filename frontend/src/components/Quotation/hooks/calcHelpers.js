import numberToWords from "number-to-words";

export const amountInWords = (num) => {
  try {
    if (isNaN(num)) return "N/A";
    const int = Math.floor(num);
    const dec = Math.round((num - int) * 100);

    const convertToIndianWords = (n) => {
      if (n === 0) return "zero";
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

      const numStr = n.toString().padStart(9, "0");
      const crore = parseInt(numStr.slice(0, 2), 10);
      const lakh = parseInt(numStr.slice(2, 4), 10);
      const thousand = parseInt(numStr.slice(4, 6), 10);
      const hundred = parseInt(numStr.slice(6, 7), 10);
      const rest = parseInt(numStr.slice(7), 10);

      const words = [];

      const toWords = (num) => {
        if (num < 20) return units[num];
        const t = Math.floor(num / 10);
        const u = num % 10;
        return tens[t] + (u ? " " + units[u] : "");
      };

      if (crore) words.push(toWords(crore) + " crore");
      if (lakh) words.push(toWords(lakh) + " lakh");
      if (thousand) words.push(toWords(thousand) + " thousand");
      if (hundred) words.push(units[hundred] + " hundred");
      if (rest) words.push(toWords(rest));

      return words.join(" ");
    };

    let str = convertToIndianWords(int);
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
