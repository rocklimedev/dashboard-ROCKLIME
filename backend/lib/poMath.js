// Purchase order money maths — ONE definition for the PO form, the server and
// the PO PDF. The front end keeps an identical copy in frontend/src/utils/poMath.js.
//
//   per line   gross = qty × rate;  discount = % of gross, or ₹ per piece × qty
//              net = gross − discount;  GST = net × GST% (each line has its own rate)
//   order      goods = Σ net;  + freight (GST at freightGst%, default 18)
//              taxable = goods + freight;  GST total = Σ line GST + freight GST
//              same state as us → CGST + SGST (half each);  other state → IGST
//              grand total rounded to the rupee, the difference shown as round off
const r2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const num = (v, d = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};

function poLine(item) {
  const qty = num(item.quantity, 1);
  const rate = num(item.unitPrice ?? item.rate ?? item.price, 0);
  const disc = num(item.discount, 0);
  const type = String(item.discountType || 'percent').toLowerCase();
  const gstRate = num(item.tax ?? item.gstRate, 0);
  const gross = r2(qty * rate);
  const discount = r2(type === 'percent' ? (gross * disc) / 100 : disc * qty);
  const net = r2(gross - discount);
  const gst = r2((net * gstRate) / 100);
  return {
    qty,
    rate,
    gross,
    discount,
    net,
    gstRate,
    gst,
    netRate: qty ? r2(net / qty) : 0,
    total: r2(net + gst),
  };
}

function poTotals({ items = [], freight = 0, freightGst = 18, interState = false } = {}) {
  // discountInput keeps what was typed (52 for 52%, 5700 for ₹5,700 a piece); discount becomes the ₹ amount
  const lines = items.map((it) => ({ ...it, discountInput: num(it.discount, 0), ...poLine(it) }));
  const subTotal = r2(lines.reduce((a, l) => a + l.gross, 0));
  const discount = r2(lines.reduce((a, l) => a + l.discount, 0));
  const goods = r2(subTotal - discount);
  const fr = r2(num(freight));
  const frGst = r2((fr * num(freightGst, 18)) / 100);
  const taxableValue = r2(goods + fr);
  const gstAmount = r2(lines.reduce((a, l) => a + l.gst, 0) + frGst);
  const cgst = interState ? 0 : r2(gstAmount / 2);
  const sgst = interState ? 0 : r2(gstAmount - cgst);
  const igst = interState ? gstAmount : 0;
  const beforeRound = r2(taxableValue + gstAmount);
  const grandTotal = Math.round(beforeRound);
  // GST by rate (for the tax table on the PDF)
  const byRate = {};
  for (const l of lines) {
    const k = String(l.gstRate);
    byRate[k] = byRate[k] || { rate: l.gstRate, taxable: 0, tax: 0 };
    byRate[k].taxable = r2(byRate[k].taxable + l.net);
    byRate[k].tax = r2(byRate[k].tax + l.gst);
  }
  if (fr) {
    const k = String(num(freightGst, 18));
    byRate[k] = byRate[k] || { rate: num(freightGst, 18), taxable: 0, tax: 0 };
    byRate[k].taxable = r2(byRate[k].taxable + fr);
    byRate[k].tax = r2(byRate[k].tax + frGst);
  }
  return {
    lines,
    subTotal,
    discount,
    goods,
    freight: fr,
    freightGst: frGst,
    taxableValue,
    gstAmount,
    cgst,
    sgst,
    igst,
    interState: Boolean(interState),
    beforeRound,
    roundOff: r2(grandTotal - beforeRound),
    grandTotal,
    gstSummary: Object.values(byRate).sort((a, b) => a.rate - b.rate),
  };
}

module.exports = { poLine, poTotals, r2 };
