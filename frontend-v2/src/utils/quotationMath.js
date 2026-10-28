// Quotation / order money maths — ONE definition used by the server, the
// screens and the PDF so they always show the same figures.
// Screen copy: frontend-v2/src/utils/quotationMath.js. Keep it identical to the
// server copy (local-tools/quotation-math-check.js compares them).
//
//   MRP value            Σ price × qty            (main items only)
// − Line discounts       per line: % of the line, or a fixed amount per piece
// = Goods value
// + Freight              (shipping / installation charges)
// − Extra discount       % of (goods + freight), or a fixed amount
// = Taxable value
// + GST                  rate % of the taxable value
//                        same state as CM  → CGST (half) + SGST (half)
//                        other state       → IGST (full)
// = Total before rounding
// ± Round off            to the nearest rupee, shown on the document
// = Grand total

export const r2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const num = (v, d = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};

export const isOptional = (item) =>
  Boolean(item?.isOption) ||
  Boolean(item?.isOptionFor) ||
  (item?.optionType && item.optionType !== 'main');

/** Normalize named quotation charges, including older amount-only quotations. */
export function normalizeCharges(value) {
  if (Array.isArray(value))
    return value.map((row) => ({
      name: String(row?.name || 'Miscellaneous charges').trim() || 'Miscellaneous charges',
      amount: Math.max(0, num(row?.amount)),
    }));
  return num(value) ? [{ name: 'Miscellaneous charges', amount: Math.max(0, num(value)) }] : [];
}

/** Additional discount is per unit. A non-null flat price
 * replaces the ordinary discounted unit price; zero is a valid override. */
export function lineAmounts(item) {
  const qty = num(item.quantity ?? item.qty, 1);
  const price = num(item.price ?? item.sellingPrice, 0);
  const disc = num(item.discount, 0);
  const type = (item.discountType || 'percent').toLowerCase();
  const gross = r2(price * qty);
  const discount = r2(type === 'percent' ? (gross * disc) / 100 : disc * qty);
  const base =
    item.flatPrice != null && item.flatPrice !== '' ? num(item.flatPrice) * qty : gross - discount;
  const net = r2(base - num(item.additionalDiscount) * qty);
  const rate = qty ? r2(net / qty) : 0;
  return {
    qty,
    price,
    gross,
    discount,
    net,
    rate,
    discountPercent: gross ? r2((discount / gross) * 100) : 0,
  };
}

/**
 * @param {object}  p
 * @param {Array}   p.items              quotation lines (optional items are kept apart)
 * @param {number}  p.extraDiscount
 * @param {string}  p.extraDiscountType  "percent" | "fixed"
 * @param {number}  p.shipping           freight / installation
 * @param {number}  p.gstRate            e.g. 18
 * @param {boolean} p.interState         true → IGST, false → CGST + SGST
 */
/**
 * Which maths applies to a quotation.
 *   discountMode 'generic'            → exclusive arithmetic; gstBasis is ignored
 *   discountMode 'advanced' + 'inclusive' → advanced-inclusive (D1): GST is inside the price
 *   discountMode 'advanced' + 'exclusive' → advanced-exclusive (D2): GST is added on top
 *   discountMode 'advanced' + null        → not chosen yet; the user must pick first
 * Generic and advanced-exclusive share the same arithmetic; they differ in the
 * breakdown shown and in which inputs the form offers.
 */
const DISCOUNT_MODES = ['generic', 'advanced'];
const GST_BASES = ['inclusive', 'exclusive'];
export function resolvePricingMode({ discountMode = 'generic', gstBasis = null } = {}) {
  const mode = DISCOUNT_MODES.includes(discountMode) ? discountMode : 'generic';
  if (mode === 'generic')
    return { discountMode: 'generic', gstBasis: null, pricingMode: 'generic' };
  if (!GST_BASES.includes(gstBasis))
    return { discountMode: 'advanced', gstBasis: null, pricingMode: null };
  return { discountMode: 'advanced', gstBasis, pricingMode: `advanced-${gstBasis}` };
}

/**
 * Reads the pricing fields from a saved or incoming quotation. Quotations saved
 * before discount modes existed have no discountMode, so they stay generic. A
 * legacy gstInclusive boolean is used only when gstBasis was never sent.
 */
export function pricingFromRecord(src = {}) {
  const discountMode = src?.discountMode === 'advanced' ? 'advanced' : 'generic';
  const legacy =
    typeof src?.gstInclusive === 'boolean' ? (src.gstInclusive ? 'inclusive' : 'exclusive') : null;
  const basis = src?.gstBasis ?? legacy;
  const r = resolvePricingMode({ discountMode, gstBasis: basis });
  return {
    discountMode: r.discountMode,
    gstBasis: r.gstBasis,
    gstInclusive: r.gstBasis === 'inclusive',
  };
}

export function quotationTotals({
  items = [],
  extraDiscount = 0,
  extraDiscountType = 'percent',
  shipping = 0,
  miscellaneousCharges = 0,
  miscellaneousChargeItems = null,
  additionalDiscount = 0,
  flatPrice = null,
  gstRate = 0,
  interState = false,
  discountMode = 'generic',
  gstBasis = null,
} = {}) {
  const resolved = resolvePricingMode({ discountMode, gstBasis });
  if (resolved.pricingMode === null) {
    throw Object.assign(new Error('Choose GST inclusive or exclusive for advanced discounting'), {
      status: 400,
    });
  }
  const inclusive = resolved.pricingMode === 'advanced-inclusive';

  const main = [];
  const optional = [];
  for (const it of items || []) (isOptional(it) ? optional : main).push(it);

  let mrpValue = 0;
  let lineDiscount = 0;
  let netValue = 0;
  const lines = main.map((it) => {
    const a = lineAmounts(it);
    mrpValue += a.gross;
    lineDiscount += a.discount;
    netValue += a.net;
    return { ...it, ...a };
  });
  mrpValue = r2(mrpValue);
  lineDiscount = r2(lineDiscount);
  // A quotation flat price replaces the goods subtotal before quotation adjustments and GST.
  const goodsValue = r2(flatPrice != null && flatPrice !== '' ? num(flatPrice) : netValue);
  const freight = r2(num(shipping));
  const chargeItems = normalizeCharges(miscellaneousChargeItems ?? miscellaneousCharges);
  const chargesAmount = r2(chargeItems.reduce((sum, row) => sum + row.amount, 0));
  const extraBase = r2(goodsValue + freight + chargesAmount);
  const extraDiscountAmount = r2(
    (extraDiscountType || 'percent').toLowerCase() === 'percent'
      ? (extraBase * num(extraDiscount)) / 100
      : num(extraDiscount),
  );
  const afterDiscounts = r2(extraBase - extraDiscountAmount - num(additionalDiscount));
  const rate = num(gstRate);
  let taxableValue;
  let gstAmount;
  let beforeRound;
  let grandTotal;
  let roundOff;
  if (inclusive) {
    // Price already contains GST: round the payable amount, then extract GST from it.
    beforeRound = afterDiscounts;
    grandTotal = Math.round(beforeRound);
    roundOff = r2(grandTotal - beforeRound);
    gstAmount = r2((grandTotal * rate) / (100 + rate));
    taxableValue = r2(grandTotal - gstAmount);
  } else {
    taxableValue = afterDiscounts;
    gstAmount = r2((taxableValue * rate) / 100);
    beforeRound = r2(taxableValue + gstAmount);
    grandTotal = Math.round(beforeRound);
    roundOff = r2(grandTotal - beforeRound);
  }
  const cgst = interState ? 0 : r2(gstAmount / 2);
  const sgst = interState ? 0 : r2(gstAmount - cgst);
  const igst = interState ? gstAmount : 0;

  const optionalLines = optional.map((it) => ({ ...it, ...lineAmounts(it) }));
  const optionalTotal = r2(optionalLines.reduce((s, l) => s + l.net, 0));

  return {
    lines,
    optionalLines,
    mrpValue,
    lineDiscount,
    goodsValue,
    freight,
    miscellaneousChargeItems: chargeItems,
    miscellaneousCharges: chargesAmount,
    extraDiscountAmount,
    taxableValue,
    gstRate: rate,
    gstAmount,
    gstInclusive: inclusive,
    discountMode: resolved.discountMode,
    gstBasis: resolved.gstBasis,
    pricingMode: resolved.pricingMode,
    interState: Boolean(interState),
    cgst,
    sgst,
    igst,
    beforeRound,
    roundOff,
    grandTotal,
    optionalTotal,
  };
}

/** Indian-style amount in words: "Seventy-one thousand one hundred fifty-two rupees only". */
export function amountInWords(amount) {
  const ones = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];
  const two = (n) =>
    n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
  const three = (n) => {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return [h ? `${ones[h]} hundred` : '', rest ? two(rest) : ''].filter(Boolean).join(' ');
  };
  const words = (n) => {
    if (n === 0) return 'zero';
    const parts = [];
    const crore = Math.floor(n / 1e7);
    const lakh = Math.floor((n % 1e7) / 1e5);
    const thousand = Math.floor((n % 1e5) / 1000);
    const rest = n % 1000;
    if (crore) parts.push(`${crore >= 100 ? words(crore) : two(crore)} crore`);
    if (lakh) parts.push(`${two(lakh)} lakh`);
    if (thousand) parts.push(`${two(thousand)} thousand`);
    if (rest) parts.push(three(rest));
    return parts.join(' ');
  };
  const v = Math.abs(num(amount));
  const rupees = Math.floor(v);
  const paise = Math.round((v - rupees) * 100);
  let out = `${words(rupees)} rupees`;
  if (paise) out += ` and ${two(paise)} paise`;
  out += ' only';
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/** ₹1,23,456.00 */
export const inr = (v, { symbol = true, decimals = 2 } = {}) =>
  `${symbol ? '₹' : ''}${num(v).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
