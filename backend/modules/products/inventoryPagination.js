const { Op } = require("sequelize");

module.exports = async function inventoryPagination({ Product, Keyword, Category, where, order, page, limit, tab, threshold }) {
  const include = [{ model: Keyword, as: "keywords", attributes: [],
    through: { attributes: [] }, include: [{ model: Category, as: "categories", attributes: [] }] }];
  const forTab = (key) => {
    const quantity = key === "in-stock" ? { [Op.gt]: 0 }
      : key === "low-stock" ? { [Op.gt]: 0, [Op.lte]: threshold }
        : key === "out-of-stock" ? 0 : undefined;
    return quantity === undefined ? where : { [Op.and]: [where, { quantity }] };
  };
  const keys = ["all", "in-stock", "low-stock", "out-of-stock"];
  const totals = await Promise.all(keys.map((key) => Product.count({
    where: forTab(key), include, distinct: true, col: "productId",
  })));
  const counts = { all: totals[0], inStock: totals[1], lowStock: totals[2], outStock: totals[3] };
  const total = totals[keys.indexOf(tab)] ?? totals[0];
  const actualPage = Math.min(page, Math.max(1, Math.ceil(total / limit)));
  if (!total) return { products: [], total, page: actualPage, counts };
  // Joining keywords creates several SQL rows per product. Group before LIMIT.
  const ids = await Product.findAll({
    attributes: ["productId"], where: forTab(tab), include,
    group: ["Product.productId"], order,
    offset: (actualPage - 1) * limit, limit, subQuery: false,
  });
  const products = ids.length ? await Product.findAll({
    where: { productId: { [Op.in]: ids.map((p) => p.productId) } }, order,
    include: [{ model: Keyword, as: "keywords", attributes: ["id", "keyword"],
      through: { attributes: [] }, include: [{ model: Category, as: "categories", attributes: ["categoryId", "name", "slug"] }] }],
  }) : [];
  return { products, total, page: actualPage, counts };
};
