const { Product } = require("../models");
const { extractFirstImageUrl } = require("../utils/image.util");
const { getMetaValue, META_SLUGS } = require("../utils/meta.util");

/**
 * Given a list of quotation line items (each with `productId`/`id`),
 * fetches the current Product master records and returns a lookup map
 * keyed by productId with normalized display fields.
 *
 * Uses the robust extractFirstImageUrl/getMetaValue helpers consistently
 * (previously `updateQuotation` used a slightly less robust inline
 * JSON.parse for images and direct meta[uuid] access; this unifies all
 * three quotation flows onto the same, safer extraction logic).
 */
async function buildProductMasterMap(products, { transaction } = {}) {
  const productIds = [
    ...new Set(products.map((p) => p.productId || p.id).filter(Boolean)),
  ];

  const productMap = {};
  if (productIds.length === 0) return productMap;

  const dbProducts = await Product.findAll({
    where: { productId: productIds },
    attributes: [
      "productId",
      "name",
      "images",
      "product_code",
      "meta",
      "tax",
      "discountType",
    ],
    transaction,
  });

  dbProducts.forEach((p) => {
    productMap[p.productId] = {
      name: p.name?.trim() || "Unnamed Product",
      imageUrl: extractFirstImageUrl(p.images),
      productCode: p.product_code || null,
      companyCode: getMetaValue(p.meta, META_SLUGS.companyCode),
      tax: p.tax || 0,
      discountType: p.discountType || "percent",
    };
  });

  return productMap;
}

module.exports = { buildProductMasterMap };
