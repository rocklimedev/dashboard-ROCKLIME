const {
  Op,
  sequelize,
  Product,
  ProductMeta,
  InventoryHistory,
  User,
  Keyword,
  Category,
  ensureAssociations,
  parseJsonSafely,
  COMPANY_CODE_META_ID,
} = require("./product.helpers");

// Add stock to a product (NOW USING MYSQL + TRANSACTION)
exports.addStock = async (req, res) => {
  const { productId } = req.params;
  const { quantity, orderNo, userId, message: customMessage } = req.body;

  if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
    return res.status(400).json({ message: "Valid quantity is required" });
  }

  const qty = Number(quantity);

  try {
    const result = await sequelize.transaction(async (t) => {
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

    res.json({
      message: "Stock added successfully",
      product: result.product,
      inventoryHistory: {
        id: result.history.id,
        action: result.history.action,
        change: result.history.change,
        quantityAfter: result.history.quantityAfter,
        timestamp: result.history.createdAt,
        orderNo: result.history.orderNo,
        userId: result.history.userId,
        message: result.history.message,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error adding stock" });
  }
};

// Remove stock from a product (NOW USING MYSQL + TRANSACTION)
exports.removeStock = async (req, res) => {
  const { productId } = req.params;
  const { quantity, orderNo, userId, message: customMessage } = req.body;

  if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
    return res.status(400).json({ message: "Valid quantity is required" });
  }

  const qty = Number(quantity);

  try {
    const result = await sequelize.transaction(async (t) => {
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

    res.json({
      message: "Stock removed successfully",
      product: result.product,
      inventoryHistory: {
        id: result.history.id,
        action: result.history.action,
        change: result.history.change,
        quantityAfter: result.history.quantityAfter,
        timestamp: result.history.createdAt,
        orderNo: result.history.orderNo,
        userId: result.history.userId,
        message: result.history.message,
      },
    });
  } catch (error) {
    const status = error.message === "Insufficient stock" ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get inventory history for a specific product (NOW FROM MYSQL)
// ─────────────────────────────────────────────────────────────────────────────
exports.getHistoryByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
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

    res.json({
      message: "Inventory history retrieved successfully",
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
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving history", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get low-stock products (the second, more complete version that overrides the first)
// ─────────────────────────────────────────────────────────────────────────────
exports.getLowStockProducts = async (req, res) => {
  try {
    ensureAssociations();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const threshold = parseInt(req.query.threshold) || 20;

    // ================= FETCH LOW STOCK =================
    const { count: totalLowStock, rows: products } =
      await Product.findAndCountAll({
        where: {
          quantity: {
            [Op.lte]: threshold,
          },
        },
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
        order: [["quantity", "ASC"]],
        limit,
        offset,
        distinct: true,
        subQuery: false,
      });

    if (totalLowStock === 0) {
      return res.json({
        success: true,
        totalLowStock: 0,
        threshold,
        products: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    // ================= META ENRICHMENT =================
    const metaIds = new Set();

    products.forEach((p) => {
      const meta = parseJsonSafely(p.meta, {});
      Object.keys(meta || {}).forEach((key) => metaIds.add(key));
    });

    const metaDefs =
      metaIds.size > 0
        ? await ProductMeta.findAll({
            where: { id: { [Op.in]: Array.from(metaIds) } },
            attributes: ["id", "title", "slug", "fieldType", "unit"],
          })
        : [];

    const metaMap = Object.fromEntries(metaDefs.map((m) => [m.id, m.toJSON()]));

    // ================= ENRICH PRODUCTS =================
    const enriched = products.map((p) => {
      const raw = p.toJSON ? p.toJSON() : p;

      const metaObj = parseJsonSafely(raw.meta, {});
      const images = parseJsonSafely(raw.images, []);

      const metaDetails = Object.entries(metaObj).map(([id, value]) => {
        const def = metaMap[id] || {};

        return {
          id,
          title: def.title || "Unknown Field",
          slug: def.slug || null,
          value: value != null ? String(value) : "",
          fieldType: def.fieldType || "text",
          unit: def.unit || null,
        };
      });

      return {
        productId: raw.productId,
        name: raw.name,
        quantity: Number(raw.quantity) || 0,
        alert_quantity: Number(raw.alert_quantity || threshold),
        product_code: raw.product_code,
        status: raw.status,

        images,
        meta: metaObj,
        metaDetails,

        stockStatus:
          raw.quantity === 0
            ? "OUT_OF_STOCK"
            : raw.quantity <= threshold
              ? "LOW_STOCK"
              : "OK",

        updatedAt: raw.updatedAt,
      };
    });

    return res.json({
      success: true,
      totalLowStock,
      threshold,
      products: enriched,
      pagination: {
        total: totalLowStock,
        page,
        limit,
        totalPages: Math.ceil(totalLowStock / limit),
      },
    });
  } catch (error) {
    console.error("Low Stock Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch low stock products",
    });
  }
};

// ==================== BULK INVENTORY UPDATE ====================
exports.bulkInventoryUpdate = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      await t.rollback();

      return res.status(400).json({
        message: "updates array is required",
      });
    }

    if (updates.length > 500) {
      await t.rollback();

      return res.status(400).json({
        message: "Maximum 500 records per request",
      });
    }

    const results = {
      successCount: 0,
      failedCount: 0,
      success: [],
      failed: [],
    };

    // UUID of Company Code meta field
    const COMPANY_CODE_META_ID = "d11da9f9-3f2e-4536-8236-9671200cca4a";

    for (let index = 0; index < updates.length; index++) {
      const item = updates[index];

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

        if (!identifier) {
          throw new Error("Product Code / Company Code is required");
        }

        if (quantity === undefined || quantity === null || isNaN(quantity)) {
          throw new Error("Valid quantity is required");
        }

        const qty = Number(quantity);

        if (qty <= 0) {
          throw new Error("Quantity must be positive");
        }

        // Enable SQL logging temporarily
        sequelize.options.logging = console.log;

        const product = await Product.findOne({
          where: {
            [Op.or]: [
              // Direct product code search
              {
                product_code: identifier,
              },

              // Search inside meta JSON
              sequelize.literal(`
                JSON_UNQUOTE(
                  JSON_EXTRACT(
                    meta,
                    '$."${COMPANY_CODE_META_ID}"'
                  )
                ) = ${sequelize.escape(identifier)}
              `),
            ],
          },

          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!product) {
          throw new Error(`Product with code "${identifier}" not found`);
        }

        const oldQuantity = Number(product.quantity || 0);
        const newQuantity = oldQuantity + qty;

        const updateData = {
          quantity: newQuantity,
        };

        if (
          selling_price !== undefined &&
          selling_price !== null &&
          !isNaN(selling_price)
        ) {
          updateData.selling_price = Number(selling_price);
        }

        await product.update(updateData, {
          transaction: t,
        });

        const finalMessage =
          customMessage?.trim() ||
          `Bulk stock update (+${qty}) ${
            warehouse ? `at ${warehouse}` : ""
          } by System`;

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
          {
            transaction: t,
          },
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

    return res.status(200).json({
      message: `Bulk inventory update completed. ${results.successCount} successful, ${results.failedCount} failed.`,
      successCount: results.successCount,
      failedCount: results.failedCount,
      success: results.success,
      failed: results.failed,
    });
  } catch (error) {
    await t.rollback();

    return res.status(500).json({
      message: "Bulk inventory update failed",
      error: error.message,
    });
  } finally {
    // disable SQL logging again
    sequelize.options.logging = false;
  }
};
