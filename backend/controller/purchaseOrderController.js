const { Op } = require("sequelize");
const moment = require("moment");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const { sendNotification } = require("./notificationController");
const { Product, Vendor, PurchaseOrder } = require("../models");

const ADMIN_USER_ID = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60"; // ← replace if needed

// Helper function to validate items (unchanged)
const validateItems = async (items, transaction) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items array is required and cannot be empty");
  }
  let totalAmount = 0;
  for (const item of items) {
    if (!item.productId) {
      throw new Error("Product ID is required for all items");
    }
    const product = await Product.findByPk(item.productId, { transaction });
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    if (!item.quantity || item.quantity <= 0 || isNaN(item.quantity)) {
      throw new Error(`Invalid quantity for product: ${item.productId}`);
    }
    const price = item.unitPrice ?? item.mrp;
    if (!price || price <= 0 || isNaN(price)) {
      throw new Error(`Invalid unit price for product: ${item.productId}`);
    }
    totalAmount += item.quantity * price;
  }
  return totalAmount.toFixed(2);
};

// ─────────────────────────────────────────────────────────────
// Helper: Generate next daily sequential poNumber (PO + DDMMYY + seq)
// Safe inside transaction — retries on collision
// ─────────────────────────────────────────────────────────────
async function generateDailyPONumber(t) {
  const todayStart = moment().startOf("day").toDate();
  const todayEnd = moment().endOf("day").toDate();
  const prefix = moment().format("DDMMYY"); // e.g. 150126

  let attempt = 0;
  const MAX_ATTEMPTS = 15;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    // Find the highest sequence number used today
    const lastPO = await PurchaseOrder.findOne({
      where: {
        poNumber: {
          [Op.like]: `PO${prefix}%`,
        },
        createdAt: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
      attributes: ["poNumber"],
      order: [["poNumber", "DESC"]],
      limit: 1,
      transaction: t,
      lock: t.LOCK.UPDATE, // helps reduce race condition window
    });

    let nextSeq = 101;

    if (lastPO) {
      const lastSeqStr = lastPO.poNumber.slice(8); // after "PO" + "DDMMYY"
      const parsed = parseInt(lastSeqStr, 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }

    const candidate = `PO${prefix}${nextSeq}`;

    // Final check — does this exact number already exist?
    const conflict = await PurchaseOrder.findOne({
      where: { poNumber: candidate },
      transaction: t,
    });

    if (!conflict) {
      return candidate;
    }

    // Collision → try next number
    console.warn(
      `PO number collision: ${candidate} — retrying (${attempt}/${MAX_ATTEMPTS})`
    );
  }

  throw new Error(
    `Failed to generate unique PO number after ${MAX_ATTEMPTS} attempts`
  );
}

// ─────────────────────────────────────────────────────────────
// Create a new purchase order — with server-generated poNumber
// ─────────────────────────────────────────────────────────────
exports.createPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { vendorId, items, expectedDeliveryDate } = req.body;

    // Validate input
    if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Validate vendor
    const vendor = await Vendor.findByPk(vendorId, { transaction: t });
    if (!vendor) {
      await t.rollback();
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Validate items and calculate total amount
    const totalAmount = await validateItems(items, t);

    // Generate unique daily sequential PO number
    const poNumber = await generateDailyPONumber(t);

    // Create Sequelize PurchaseOrder
    const purchaseOrder = await PurchaseOrder.create(
      {
        poNumber, // ← generated here
        vendorId,
        status: "pending",
        orderDate: new Date(),
        totalAmount,
        expectDeliveryDate: expectedDeliveryDate || null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? item.mrp,
        })),
      },
      { transaction: t }
    );

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `New Purchase Order Created #${poNumber}`,
      message: `Purchase order #${poNumber} created for vendor ${vendor.vendorName} with total amount ₹${totalAmount}.`,
    });

    await t.commit();

    return res.status(201).json({
      message: "Purchase order created successfully",
      purchaseOrder: {
        ...purchaseOrder.toJSON(),
        items: purchaseOrder.items || [],
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Create Purchase Order Error:", error);
    return res.status(500).json({
      message: "Error creating purchase order",
      error: error.message,
    });
  }
};

// Update a purchase order
exports.updatePurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { vendorId, items, status, expectedDeliveryDate } = req.body;

    // Find purchase order
    const purchaseOrder = await PurchaseOrder.findByPk(req.params.id, {
      transaction: t,
    });
    if (!purchaseOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Purchase order not found" });
    }

    // Validate vendor if provided
    let vendor = null;
    if (vendorId) {
      vendor = await Vendor.findByPk(vendorId, { transaction: t });
      if (!vendor) {
        await t.rollback();
        return res.status(404).json({ message: "Vendor not found" });
      }
    }

    // Prepare update data
    let updateData = {};
    if (vendorId) updateData.vendorId = vendorId;
    if (status) updateData.status = status;
    if (expectedDeliveryDate)
      updateData.expectDeliveryDate = expectedDeliveryDate;

    if (items && Array.isArray(items)) {
      // Validate items and calculate total
      const totalAmount = await validateItems(items, t);

      // Update items as JSON
      updateData.items = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice, // Use unitPrice to match schema
      }));
      updateData.totalAmount = totalAmount;
    }

    // Update Sequelize PurchaseOrder
    await purchaseOrder.update(updateData, { transaction: t });

    // Fetch updated vendor if not already fetched
    vendor =
      vendor ||
      (purchaseOrder.vendorId
        ? await Vendor.findByPk(purchaseOrder.vendorId, { transaction: t })
        : null);

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Purchase Order Updated #${purchaseOrder.poNumber}`,
      message: `Purchase order #${purchaseOrder.poNumber} for ${
        vendor?.vendorName || "Vendor"
      } has been updated.`,
    });

    await t.commit();
    return res.status(200).json({
      message: "Purchase order updated successfully",
      purchaseOrder: {
        ...purchaseOrder.toJSON(),
        items: purchaseOrder.items || [],
        Vendor: vendor,
      },
    });
  } catch (error) {
    await t.rollback();
    return res.status(400).json({
      message: "Error updating purchase order",
      error: error.message,
    });
  }
};

// Get a purchase order by ID (no notification needed)
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        {
          model: Vendor,
          attributes: ["id", "vendorName"],
        },
      ],
    });

    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    return res.status(200).json({
      ...purchaseOrder.toJSON(),
      items: purchaseOrder.items || [],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching purchase order",
      error: error.message,
    });
  }
};

// Get all purchase orders (no notification needed)
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    // Pagination parameters: ?page=1&limit=20
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    // Use findAndCountAll to get total count and paginated results efficiently
    const { count: totalPurchaseOrders, rows: purchaseOrders } =
      await PurchaseOrder.findAndCountAll({
        include: [
          {
            model: Vendor,
            attributes: ["id", "vendorName"],
          },
        ],
        order: [["createdAt", "DESC"]],
        offset,
        limit,
        // Prevents issues with nested includes affecting the COUNT query
        subQuery: false,
      });

    // Map purchase orders to include items directly (assuming items is a JSON field or already loaded)
    const result = purchaseOrders.map((po) => ({
      ...po.toJSON(),
      items: po.items || [],
    }));

    const totalPages = Math.ceil(totalPurchaseOrders / limit);

    return res.status(200).json({
      data: result,
      pagination: {
        total: totalPurchaseOrders,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("getAllPurchaseOrders error:", error);
    return res.status(500).json({
      message: "Error fetching purchase orders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a purchase order
exports.deletePurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const purchaseOrder = await PurchaseOrder.findByPk(req.params.id, {
      transaction: t,
    });
    if (!purchaseOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Purchase order not found" });
    }

    // Fetch vendor for notification
    const vendor = await Vendor.findByPk(purchaseOrder.vendorId, {
      transaction: t,
    });

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Purchase Order Deleted #${purchaseOrder.poNumber}`,
      message: `Purchase order #${purchaseOrder.poNumber} for ${
        vendor?.vendorName || "Vendor"
      } has been deleted.`,
    });

    // Delete PurchaseOrder from MySQL
    await purchaseOrder.destroy({ transaction: t });

    await t.commit();
    return res
      .status(200)
      .json({ message: "Purchase order deleted successfully" });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      message: "Error deleting purchase order",
      error: error.message,
    });
  }
};

// Confirm a purchase order and update product stock
exports.confirmPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const purchaseOrder = await PurchaseOrder.findByPk(req.params.id, {
      transaction: t,
    });

    if (!purchaseOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Purchase order not found" });
    }

    if (purchaseOrder.status !== "pending") {
      await t.rollback();
      return res.status(400).json({ message: "Purchase order is not pending" });
    }

    // Update product stock
    for (const item of purchaseOrder.items || []) {
      const product = await Product.findByPk(item.productId, {
        transaction: t,
      });
      if (product) {
        product.quantity += item.quantity;
        await product.save({ transaction: t });
      }
    }

    // Update purchase order status
    await purchaseOrder.update({ status: "delivered" }, { transaction: t });

    // Fetch vendor for notification
    const vendor = await Vendor.findByPk(purchaseOrder.vendorId, {
      transaction: t,
    });

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Purchase Order Confirmed #${purchaseOrder.poNumber}`,
      message: `Purchase order #${purchaseOrder.poNumber} for ${
        vendor?.vendorName || "Vendor"
      } has been confirmed and marked as delivered.`,
    });

    await t.commit();
    return res.status(200).json({
      message: "Purchase order confirmed and stock updated",
      purchaseOrder: {
        ...purchaseOrder.toJSON(),
        items: purchaseOrder.items || [],
      },
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      message: "Error confirming purchase order",
      error: error.message,
    });
  }
};

// Get purchase orders by vendor (no notification needed)
exports.getPurchaseOrdersByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const purchaseOrders = await PurchaseOrder.findAll({
      where: { vendorId },
      include: [
        {
          model: Vendor,
          attributes: ["id", "vendorName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Map purchase orders to include items directly
    const result = purchaseOrders.map((po) => ({
      ...po.toJSON(),
      items: po.items || [],
    }));

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching purchase orders by vendor",
      error: error.message,
    });
  }
};

// Update only the status of a purchase order
exports.updatePurchaseOrderStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "confirmed", "delivered", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      await t.rollback();
      return res.status(400).json({
        message: `Invalid status. Allowed values are: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    // Find purchase order
    const purchaseOrder = await PurchaseOrder.findByPk(id, { transaction: t });
    if (!purchaseOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Purchase order not found" });
    }

    // Prevent redundant updates
    if (purchaseOrder.status === status) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Status is already set to this value" });
    }

    // Handle business logic for stock update (only if status moves to delivered)
    if (status === "delivered" && purchaseOrder.status !== "delivered") {
      for (const item of purchaseOrder.items || []) {
        const product = await Product.findByPk(item.productId, {
          transaction: t,
        });
        if (product) {
          product.quantity += item.quantity;
          await product.save({ transaction: t });
        }
      }
    }

    // Update status
    const oldStatus = purchaseOrder.status;
    await purchaseOrder.update({ status }, { transaction: t });

    // Fetch vendor for notification
    const vendor = await Vendor.findByPk(purchaseOrder.vendorId, {
      transaction: t,
    });

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Purchase Order Status Updated #${purchaseOrder.poNumber}`,
      message: `Purchase order #${purchaseOrder.poNumber} for ${
        vendor?.vendorName || "Vendor"
      } status changed from ${oldStatus} to ${status}.`,
    });

    await t.commit();
    return res.status(200).json({
      message: `Purchase order status updated to '${status}' successfully`,
      purchaseOrder: {
        ...purchaseOrder.toJSON(),
        items: purchaseOrder.items || [],
      },
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      message: "Error updating purchase order status",
      error: error.message,
    });
  }
};
