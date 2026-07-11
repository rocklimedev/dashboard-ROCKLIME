const { v7: uuidv7 } = require("uuid");
const { User, Product, InventoryHistory } = require("../models");

/**
 * Reduce stock + log history (shared by order create & update).
 * Must run inside a transaction.
 */
async function reduceStockAndLog({
  productUpdates,
  createdBy,
  orderNo,
  customMessage,
  transaction,
}) {
  if (!transaction) throw new Error("Transaction is required");

  const username =
    (
      await User.findByPk(createdBy, {
        attributes: ["username"],
        transaction,
      })
    )?.username || "System";

  const autoMsg = `Stock removed by ${username} (Order #${orderNo})`;
  const msg = customMessage?.trim() ? `${customMessage} (${autoMsg})` : autoMsg;

  for (const upd of productUpdates) {
    const { productId, quantityToReduce, productRecord } = upd;

    if (quantityToReduce <= 0) continue; // safety

    const newQty = productRecord.quantity - quantityToReduce;

    // 1. Update product quantity
    await Product.update(
      { quantity: newQty },
      { where: { productId }, transaction },
    );

    // 2. Log inventory history
    await InventoryHistory.create(
      {
        id: uuidv7(),
        productId,
        change: -quantityToReduce,
        quantityAfter: newQty,
        action: "sale",
        orderNo: String(orderNo),
        userId: createdBy,
        message: msg,
      },
      { transaction },
    );

    // 3. Update status if needed
    let newStatus = "active";
    if (newQty === 0) {
      newStatus = "out_of_stock";
    } else if (
      productRecord.alert_quantity != null &&
      newQty <= productRecord.alert_quantity
    ) {
      newStatus = "low_stock";
    }

    if (newStatus !== productRecord.status) {
      await Product.update(
        { status: newStatus },
        { where: { productId }, transaction },
      );
    }
  }
}

/**
 * Restore stock when an order is canceled / deleted / replaced.
 */
async function restoreStock({ products, orderNo }) {
  if (!products?.length) return;

  for (const p of products) {
    const prod = await Product.findByPk(p.id || p.productId);
    if (!prod) continue;

    const qtyToAdd = p.quantity ?? 0;
    const newQty = prod.quantity + qtyToAdd;

    await Product.update(
      { quantity: newQty },
      { where: { productId: prod.productId } },
    );

    await InventoryHistory.create({
      productId: prod.productId,
      change: qtyToAdd,
      quantityAfter: newQty,
      action: "add-stock",
      orderNo,
      message: `Stock restored (order #${orderNo} cancelled/deleted)`,
    });
  }
}

module.exports = { reduceStockAndLog, restoreStock };
