// META_SLUGS (same as you have in your Cart controller)
const META_SLUGS = {
  sellingPrice: "9ba862ef-f993-4873-95ef-1fef10036aa5",
  companyCode: "d11da9f9-3f2e-4536-8236-9671200cca4a",
  barcode: "4ded1cb3-5d31-42e8-90ec-a381a6ab1e35",
  productGroup: "81cd6d76-d7d2-4226-b48e-6704e6224c2b",
};

// Safe meta value extractor (reuse from your cart code)
const getMetaValue = (meta, uuid) => {
  if (!meta || !uuid) return null;

  let parsed = meta;
  if (typeof meta === "string") {
    try {
      parsed = JSON.parse(meta);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;

  return parsed[uuid] || null;
};

module.exports = {
  META_SLUGS,
  getMetaValue,
};
