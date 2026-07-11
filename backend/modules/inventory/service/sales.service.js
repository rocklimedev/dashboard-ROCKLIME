const { Op } = require("sequelize");
const { Product, Quotation, Order } = require("../../models");

function processItemsArray(items, salesMap) {
  if (!Array.isArray(items)) return;
  items.forEach((item) => {
    const id = item.productId;
    const qty = Number(item.quantity) || 0;
    if (id && qty > 0) {
      salesMap.set(id, (salesMap.get(id) || 0) + qty);
    }
  });
}

async function getTopSellingProducts(limit = 10) {
  const salesMap = new Map();

  const quotations = await Quotation.findAll({
    attributes: ["quotationId", "products"],
    raw: true,
  });

  const quotationProductsMap = new Map();
  quotations.forEach((q) => {
    if (!q.products) return;
    try {
      const items =
        typeof q.products === "string" ? JSON.parse(q.products) : q.products;
      processItemsArray(items, salesMap);
      if (Array.isArray(items)) quotationProductsMap.set(q.quotationId, items);
    } catch (e) {
      // skip malformed row
    }
  });

  const orders = await Order.findAll({
    attributes: ["id", "products", "quotationId"],
    raw: true,
  });

  orders.forEach((order) => {
    let itemsToUse = null;

    if (order.products) {
      try {
        const parsed =
          typeof order.products === "string"
            ? JSON.parse(order.products)
            : order.products;
        if (Array.isArray(parsed) && parsed.length > 0) itemsToUse = parsed;
      } catch (e) {
        // ignore malformed order.products
      }
    }

    if (
      !itemsToUse &&
      order.quotationId &&
      quotationProductsMap.has(order.quotationId)
    ) {
      itemsToUse = quotationProductsMap.get(order.quotationId);
    }

    if (itemsToUse) processItemsArray(itemsToUse, salesMap);
  });

  const salesArray = Array.from(salesMap, ([productId, totalSold]) => ({
    productId,
    totalSold,
  })).sort((a, b) => b.totalSold - a.totalSold);

  if (salesArray.length === 0) return { data: [], total: 0 };

  const topProductIds = salesArray.slice(0, 50).map((s) => s.productId);

  const products = await Product.findAll({
    where: { productId: { [Op.in]: topProductIds } },
    order: [["name", "ASC"]],
    include: [
      {
        model: require("../../models").Keyword,
        as: "keywords",
        attributes: ["id", "keyword"],
        through: { attributes: [] },
        include: [
          {
            model: require("../../models").Category,
            as: "category",
            attributes: ["categoryId", "name", "slug"],
          },
        ],
      },
    ],
  });

  const enrichedProducts = products.map((product) => {
    const raw = product.toJSON();
    const metaObj = raw.meta
      ? typeof raw.meta === "string"
        ? JSON.parse(raw.meta)
        : raw.meta
      : {};
    const images = raw.images
      ? typeof raw.images === "string"
        ? JSON.parse(raw.images)
        : raw.images
      : [];

    const metaDetails = Object.entries(metaObj).map(([id, value]) => ({
      id,
      title: "Unknown Field",
      slug: id,
      value: value != null ? String(value) : "",
      fieldType: "text",
      unit: null,
    }));

    const keywords = (raw.keywords || []).map((k) => ({
      id: k.id,
      keyword: k.keyword,
      categories: k.categories
        ? {
            categoryId: k.categories.categoryId,
            name: k.categories.name,
            slug: k.categories.slug,
          }
        : null,
    }));

    const totalSold =
      salesArray.find((s) => s.productId === raw.productId)?.totalSold || 0;

    return { ...raw, images, meta: metaObj, metaDetails, keywords, totalSold };
  });

  const finalTopProducts = enrichedProducts
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, limit);

  return { data: finalTopProducts, total: finalTopProducts.length };
}

module.exports = { getTopSellingProducts };
