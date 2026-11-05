// Purchase order totals: discounted goods plus freight, rounded to the rupee.
const r2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
function poLine(item) {
  const qty = num(item.quantity, 1);
  const rate = num(item.unitPrice ?? item.rate ?? item.price);
  const gross = r2(qty * rate);
  const disc = num(item.discount);
  const discount = r2(
    String(item.discountType || 'percent').toLowerCase() === 'percent'
      ? (gross * disc) / 100
      : disc * qty,
  );
  const net = r2(gross - discount);
  return { qty, rate, gross, discount, net, netRate: qty ? r2(net / qty) : 0, total: net };
}
function poTotals({ items = [], freight = 0 } = {}) {
  const lines = items.map((it) => ({ ...it, discountInput: num(it.discount), ...poLine(it) }));
  const subTotal = r2(lines.reduce((a, l) => a + l.gross, 0));
  const discount = r2(lines.reduce((a, l) => a + l.discount, 0));
  const goods = r2(subTotal - discount);
  const fr = r2(num(freight));
  const beforeRound = r2(goods + fr);
  const grandTotal = Math.round(beforeRound);
  return {
    lines,
    subTotal,
    discount,
    goods,
    freight: fr,
    beforeRound,
    roundOff: r2(grandTotal - beforeRound),
    grandTotal,
  };
}
module.exports = { poLine, poTotals, r2 };
