const COMPANY_CODE_KEY = 'd11da9f9-3f2e-4536-8236-9671200cca4a';
const SELLING_PRICE_KEY = '9ba862ef-f993-4873-95ef-1fef10036aa5';

export function searchProductSummary(product) {
  let meta = product?.meta || {};
  if (typeof meta === 'string') {
    try {
      meta = JSON.parse(meta) || {};
    } catch {
      meta = {};
    }
  }
  const firstPresent = (...values) =>
    values.find((value) => value != null && String(value).trim() !== '');
  const companyCode = firstPresent(
    meta[COMPANY_CODE_KEY],
    meta.companyCode,
    meta.company_code,
    product?.companyCode,
    product?.company_code,
  );
  const rawPrice = firstPresent(
    meta[SELLING_PRICE_KEY],
    meta.sellingPrice,
    meta.selling_price,
    product?.sellingPrice,
  );
  const price = rawPrice === undefined ? NaN : Number(rawPrice);
  const displayPrice = Number.isFinite(price)
    ? `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'Price not set';
  return `${companyCode === undefined ? '—' : String(companyCode).trim()} · ${displayPrice}`;
}
