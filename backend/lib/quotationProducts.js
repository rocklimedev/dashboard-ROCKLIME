// SQL products retain the complete saved quotation, including room shares.
// Mongo items are a fallback for legacy records without a products array.
function quotationProducts(products, fallback = []) {
  let parsed = products;
  for (let i = 0; i < 3 && typeof parsed === 'string'; i++) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return fallback;
    }
  }
  return Array.isArray(parsed) ? parsed : fallback;
}
module.exports = { quotationProducts };
