export const catalogPrice = (product) => {
  const value = product?.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"];
  return value !== null && value !== undefined && value !== "" &&
    Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
};

export const productImage = (product) => {
  if (product?.imageUrl) return product.imageUrl;
  let images = product?.images;
  if (typeof images === "string") {
    try { images = JSON.parse(images); } catch { return images; }
  }
  return Array.isArray(images) ? images[0] || "" : "";
};
