// Checks that the screen copy of the quotation maths matches the server copy
// and that a known quotation adds up.   node local-tools/quotation-math-check.js
const fs = require("fs");
const path = require("path");
const server = fs.readFileSync(path.join(__dirname, "../lib/quotationMath.js"), "utf8");
const screen = fs.readFileSync(path.join(__dirname, "../../frontend-v2/src/utils/quotationMath.js"), "utf8");
const body = (s) =>
  s
    .replace(/^\/\/.*$/gm, "")
    .replace(/export /g, "")
    .replace(/module\.exports = .*$/m, "")
    .replace(/\s+/g, " ")
    .trim();
let failed = 0;
const check = (ok, label) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failed++;
};
check(body(server) === body(screen), "screen and server copies of the quotation maths are identical");
const { quotationTotals } = require("../lib/quotationMath");
const t = quotationTotals({
  items: [
    { price: 4850, quantity: 3, discount: 5, discountType: "percent" },
    { price: 18900, quantity: 2, discount: 8, discountType: "percent" },
    { price: 5600, quantity: 2, discount: 0 },
    { price: 9999, quantity: 1, isOption: true },
  ],
  shipping: 500,
  gstRate: 18,
});
check(t.taxableValue === 60298.5, `taxable value 60,298.50 (got ${t.taxableValue})`);
check(t.cgst + t.sgst === t.gstAmount, "CGST + SGST = GST");
check(Math.abs(t.taxableValue + t.gstAmount + t.roundOff - t.grandTotal) < 0.001, "every line adds up to the grand total");
check(t.grandTotal === 71152, `grand total ₹71,152 (got ${t.grandTotal})`);
check(t.optionalTotal === 9999 && t.lines.length === 3, "optional items are kept out of the total");
const igst = quotationTotals({ items: [{ price: 100, quantity: 1 }], gstRate: 18, interState: true });
check(igst.igst === 18 && igst.cgst === 0, "other state → IGST only");
console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll quotation maths checks passed");
process.exit(failed ? 1 : 0);
