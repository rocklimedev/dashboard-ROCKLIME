// src/carts/helpers/get-selling-price.ts
export const getSellingPrice = (meta: any): number | null => {
  let parsedMeta = meta;

  if (typeof meta === 'string') {
    try {
      parsedMeta = JSON.parse(meta);
    } catch (e) {
      parsedMeta = {};
    }
  }

  if (!parsedMeta || typeof parsedMeta !== 'object') {
    return null;
  }

  const PRICE_UUID = '9ba862ef-f993-4873-95ef-1fef10036aa5';
  let raw = parsedMeta[PRICE_UUID];

  // Fallback: scan all values
  if (!raw) {
    for (const value of Object.values(parsedMeta)) {
      if (typeof value === 'number' && value >= 1) return value;
      if (typeof value === 'string' && /^\d{2,15}(\.\d{1,4})?$/.test(value.trim())) {
        raw = value;
        break;
      }
    }
  }

  if (!raw) return null;

  const cleaned = String(raw)
    .replace(/[^\d.]/g, '')
    .replace(/\.(?=.*\.)/g, '');

  const price = parseFloat(cleaned);
  return !isNaN(price) && price >= 1 ? price : null;
};