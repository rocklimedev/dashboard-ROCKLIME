const { Op } = require("sequelize");
const sequelize = require("../../config/database");
const {
  Product,
  InventoryHistory,
  User,
  ProductMeta,
} = require("../../models");
const {
  ensureAssociations,
  parseJsonSafely,
  collectMetaIds,
  buildMetaMap,
  buildMetaDetails,
  COMPANY_CODE_META_ID,
} = require("./productHelpers");

async function addStock({
  productId,
  quantity,
  orderNo,
  userId,
  message: customMessage,
}) {
  if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
    const err = new Error("Valid quantity is required");
    err.status = 400;
    throw err;
  }

  const qty = Number(quantity);

  return sequelize.transaction(async (t) => {
    const product = await Product.findByPk(productId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!product) throw new Error("Product not found");

    const newQuantity = product.quantity + qty;
    await product.update({ quantity: newQuantity }, { transaction: t });

    let username = "unknown";
    if (userId) {
      const user = await User.findByPk(userId, {
        attributes: ["username"],
        transaction: t,
      });
      if (user) username = user.username;
    }

    const finalMessage =
      customMessage?.trim() ||
      `Stock added by ${username}${orderNo ? ` (Order #${orderNo})` : ""}`;

    const history = await InventoryHistory.create(
      {
        productId,
        change: qty,
        quantityAfter: newQuantity,
        action: "add-stock",
        orderNo: orderNo || null,
        userId: userId || null,
        message: finalMessage,
      },
      { transaction: t },
    );

    return { product, history };
  });
}

async function removeStock({
  productId,
  quantity,
  orderNo,
  userId,
  message: customMessage,
}) {
  if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
    const err = new Error("Valid quantity is required");
    err.status = 400;
    throw err;
  }

  const qty = Number(quantity);

  return sequelize.transaction(async (t) => {
    const product = await Product.findByPk(productId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!product) throw new Error("Product not found");
    if (product.quantity < qty) throw new Error("Insufficient stock");

    const newQuantity = product.quantity - qty;
    await product.update({ quantity: newQuantity }, { transaction: t });

    let username = "unknown";
    if (userId) {
      const user = await User.findByPk(userId, {
        attributes: ["username"],
        transaction: t,
      });
      if (user) username = user.username;
    }

    const finalMessage =
      customMessage?.trim() ||
      `Stock removed by ${username}${orderNo ? ` (Order #${orderNo})` : ""}`;

    const history = await InventoryHistory.create(
      {
        productId,
        change: -qty,
        quantityAfter: newQuantity,
        action: "remove-stock",
        orderNo: orderNo || null,
        userId: userId || null,
        message: finalMessage,
      },
      { transaction: t },
    );

    return { product, history };
  });
}

async function getHistoryByProductId(productId, { page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;

  const { count, rows } = await InventoryHistory.findAndCountAll({
    where: { productId },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    attributes: [
      "id",
      "change",
      "quantityAfter",
      "action",
      "orderNo",
      "userId",
      "message",
      "createdAt",
    ],
  });

  return {
    total: count,
    page,
    pages: Math.ceil(count / limit),
    history: rows.map((h) => ({
      id: h.id,
      change: h.change,
      quantityAfter: h.quantityAfter,
      action: h.action,
      orderNo: h.orderNo,
      userId: h.userId,
      message: h.message,
      timestamp: h.createdAt,
    })),
  };
}

/**
 * Paginated low-stock listing. Consolidates what used to be two duplicate
 * `getLowStockProducts` exports on the original controller (the second
 * definition silently shadowed the first at runtime) into a single
 * implementation that keeps the richer response shape.
 */
async function getLowStockProducts({
  page = 1,
  limit = 20,
  threshold = 20,
} = {}) {
  ensureAssociations();

  const offset = (page - 1) * limit;

  const { count: totalLowStock, rows: products } =
    await Product.findAndCountAll({
      where: { quantity: { [Op.lte]: threshold } },
      attributes: [
        "productId",
        "name",
        "quantity",
        "alert_quantity",
        "product_code",
        "images",
        "status",
        "meta",
        "updatedAt",
      ],
      order: [
        ["quantity", "ASC"],
        ["updatedAt", "DESC"],
      ],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

  if (totalLowStock === 0) {
    return {
      totalLowStock: 0,
      threshold,
      products: [],
      pagination: { total: 0, page, limit, totalPages: 0 },
    };
  }

  const metaMap = await buildMetaMap(collectMetaIds(products));

  const enriched = products.map((p) => {
    const raw = p.toJSON();
    const metaObj = parseJsonSafely(raw.meta, {});
    const images = parseJsonSafely(raw.images, []);

    return {
      productId: raw.productId,
      name: raw.name,
      quantity: Number(raw.quantity) || 0,
      alert_quantity: Number(raw.alert_quantity || threshold),
      product_code: raw.product_code,
      status: raw.status,
      images,
      meta: metaObj,
      metaDetails: buildMetaDetails(metaObj, metaMap),
      stockStatus:
        raw.quantity === 0
          ? "OUT_OF_STOCK"
          : raw.quantity <= threshold
            ? "LOW_STOCK"
            : "OK",
      updatedAt: raw.updatedAt,
    };
  });

  return {
    totalLowStock,
    threshold,
    products: enriched,
    pagination: {
      total: totalLowStock,
      page,
      limit,
      totalPages: Math.ceil(totalLowStock / limit),
    },
  };
}

/**
 * Bulk stock update by product_code or company_code. Each row is processed
 * independently within the same transaction so partial failures are reported
 * without losing the successes.
 */
async function bulkInventoryUpdate(updates) {
  if (!Array.isArray(updates) || updates.length === 0) {
    const err = new Error("updates array is required");
    err.status = 400;
    throw err;
  }

  if (updates.length > 500) {
    const err = new Error("Maximum 500 records per request");
    err.status = 400;
    throw err;
  }

  const t = await sequelize.transaction();
  const results = { successCount: 0, failedCount: 0, success: [], failed: [] };

  try {
    for (const item of updates) {
      let identifier = null;

      try {
        const {
          company_code,
          product_code,
          quantity,
          warehouse,
          selling_price,
          message: customMessage,
          userId,
        } = item;

        identifier = (company_code || product_code || "").toString().trim();
        if (!identifier)
          throw new Error("Product Code / Company Code is required");

        if (quantity === undefined || quantity === null || isNaN(quantity)) {
          throw new Error("Valid quantity is required");
        }

        const qty = Number(quantity);
        if (qty <= 0) throw new Error("Quantity must be positive");

        const product = await Product.findOne({
          where: {
            [Op.or]: [
              { product_code: identifier },
              sequelize.literal(`
                JSON_UNQUOTE(
                  JSON_EXTRACT(meta, '$."${COMPANY_CODE_META_ID}"')
                ) = ${sequelize.escape(identifier)}
              `),
            ],
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!product)
          throw new Error(`Product with code "${identifier}" not found`);

        const oldQuantity = Number(product.quantity || 0);
        const newQuantity = oldQuantity + qty;

        const updateData = { quantity: newQuantity };
        if (
          selling_price !== undefined &&
          selling_price !== null &&
          !isNaN(selling_price)
        ) {
          updateData.selling_price = Number(selling_price);
        }

        await product.update(updateData, { transaction: t });

        const finalMessage =
          customMessage?.trim() ||
          `Bulk stock update (+${qty}) ${warehouse ? `at ${warehouse}` : ""} by System`;

        await InventoryHistory.create(
          {
            productId: product.productId,
            change: qty,
            quantityAfter: newQuantity,
            action: "add-stock",
            orderNo: null,
            userId: userId || null,
            message: finalMessage,
            warehouse: warehouse || null,
          },
          { transaction: t },
        );

        results.success.push({
          productId: product.productId,
          product_code: product.product_code,
          company_code: identifier,
          oldQuantity,
          added: qty,
          newQuantity,
        });
        results.successCount++;
      } catch (err) {
        results.failed.push({
          identifier: identifier || "Unknown",
          error: err.message,
        });
        results.failedCount++;
      }
    }

    await t.commit();
    return results;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

module.exports = {
  addStock,
  removeStock,
  getHistoryByProductId,
  getLowStockProducts,
  bulkInventoryUpdate,
};
