const { Op, sequelize, stock, Product, InventoryHistory } = require('./product-controller.shared');

// Add stock to a product (NOW USING MYSQL + TRANSACTION)
// Add or remove stock by hand (breakage, found pieces, corrections).
// Goes through the stock engine: a reason is required, and stock that is
// reserved for orders cannot be removed.
const manualStockChange = (sign) => async (req, res) => {
  const { productId } = req.params;
  const { quantity, orderNo, message: customMessage, reason, warehouseId } = req.body;
  const userId = req.user?.userId || null;
  const qty = Number(quantity);
  if (!qty || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
    return res.status(400).json({ message: 'Enter a whole quantity greater than 0.' });
  }
  const why =
    String(reason || customMessage || '').trim() ||
    (sign > 0 ? 'Stock added by hand' : 'Stock removed by hand');
  try {
    const result = await sequelize.transaction(async (t) => {
      const posted = await stock.adjust(
        {
          productId,
          warehouseId: warehouseId || null,
          change: sign * qty,
          reason: orderNo ? `${why} (Order #${orderNo})` : why,
          userId,
        },
        { t },
      );
      if (sign > 0) await stock.allocateBackorders([productId], { t, userId });
      const product = await Product.findByPk(productId, { transaction: t });
      const totals = (await stock.productStock(productId, { t })).totals;
      return { posted, product, totals };
    });
    res.json({
      message: sign > 0 ? 'Stock added successfully' : 'Stock removed successfully',
      product: result.product,
      stock: result.totals,
      inventoryHistory: {
        action: sign > 0 ? 'add-stock' : 'remove-stock',
        change: sign * qty,
        quantityAfter: result.product?.quantity,
        timestamp: new Date(),
        orderNo: orderNo || null,
        userId,
        message: why,
      },
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error changing stock' });
  }
};

exports.addStock = manualStockChange(1);

exports.removeStock = manualStockChange(-1);

exports.getHistoryByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await InventoryHistory.findAndCountAll({
      where: { productId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: [
        'id',
        'change',
        'quantityAfter',
        'action',
        'orderNo',
        'userId',
        'message',
        'createdAt',
      ],
    });

    res.json({
      message: 'Inventory history retrieved successfully',
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
    res.status(500).json({ message: 'Error retrieving history', error: error.message });
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
        message: 'updates array is required',
      });
    }

    if (updates.length > 500) {
      await t.rollback();

      return res.status(400).json({
        message: 'Maximum 500 records per request',
      });
    }

    const received = [];
    const results = {
      successCount: 0,
      failedCount: 0,
      success: [],
      failed: [],
    };

    // UUID of Company Code meta field
    const COMPANY_CODE_META_ID = 'd11da9f9-3f2e-4536-8236-9671200cca4a';

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

        identifier = (company_code || product_code || '').toString().trim();

        if (!identifier) {
          throw new Error('Product Code / Company Code is required');
        }

        if (quantity === undefined || quantity === null || isNaN(quantity)) {
          throw new Error('Valid quantity is required');
        }

        const qty = Number(quantity);

        if (qty <= 0) {
          throw new Error('Quantity must be positive');
        }

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

        if (selling_price !== undefined && selling_price !== null && !isNaN(selling_price)) {
          await product.update({ selling_price: Number(selling_price) }, { transaction: t });
        }

        // Goods in: one goods receipt for the whole upload (below)
        received.push({
          productId: product.productId,
          productName: product.name,
          quantity: qty,
        });
        const newQuantity = oldQuantity + qty;

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
          identifier: identifier || 'Unknown',
          error: err.message,
        });

        results.failedCount++;
      }
    }

    if (received.length) {
      await stock.receiveGoods(
        {
          items: received,
          userId: req.user?.userId || null,
          notes: 'Bulk inventory update (upload)',
        },
        { t },
      );
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
      message: 'Bulk inventory update failed',
      error: error.message,
    });
  }
};
