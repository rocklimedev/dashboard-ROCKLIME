export const catalogPrice = (product) => {
  const value = product?.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"];
  return value !== null && value !== undefined && value !== "" &&
    Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
};

export const productCompanyCode = (product) => {
  let meta = product?.meta;
  if (typeof meta === "string") {
    try { meta = JSON.parse(meta); } catch { meta = {}; }
  }
  const key = "d11da9f9-3f2e-4536-8236-9671200cca4a";
  const value = [product?.companyCode, meta?.[key], product?.metaDetails?.find((d) => d.id === key)?.value]
    .find((v) => v != null && String(v).trim() !== "");
  return value == null ? "" : String(value).trim();
};

export const productImage = (product) => {
  if (product?.imageUrl) return product.imageUrl;
  let images = product?.images;
  if (typeof images === "string") {
    try { images = JSON.parse(images); } catch { return images; }
  }
  return Array.isArray(images) ? images[0] || "" : "";
};
