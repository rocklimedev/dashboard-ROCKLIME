const PurchaseOrder = require("../models/purchaseorder");
const Product = require("../models/product");
const Vendor = require("../models/vendor");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");

// Helper function to validate items
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
    // Accept either unitPrice or mrp, with unitPrice taking precedence
    const price = item.unitPrice ?? item.mrp;
    if (!price || price <= 0 || isNaN(price)) {
      throw new Error(`Invalid unit price for product: ${item.productId}`);
    }
    totalAmount += item.quantity * price;
  }
  return totalAmount.toFixed(2);
};

// Create a new purchase order
// Utility function to generate random PO number
function generateRandomPONumber() {
  const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit number
  return `PO-${randomNumber}`;
}

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

    // Generate unique order number
    let poNumber;
    let isUnique = false;

    // Ensure uniqueness in the DB
    while (!isUnique) {
      poNumber = generateRandomPONumber();
      const existingPO = await PurchaseOrder.findOne({
        where: { poNumber },
        transaction: t,
      });
      if (!existingPO) isUnique = true;
    }

    // Create Sequelize PurchaseOrder
    const purchaseOrder = await PurchaseOrder.create(
      {
        poNumber,
        vendorId,
        status: "pending",
        orderDate: new Date(),
        totalAmount,
        expectDeliveryDate: expectedDeliveryDate,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? item.mrp, // Use unitPrice or mrp
        })),
      },
      { transaction: t }
    );

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

    // Commit transaction
    await t.commit();
    return res.status(200).json({
      message: "Purchase order updated successfully",
      purchaseOrder: {
        ...purchaseOrder.toJSON(),
        items: purchaseOrder.items || [],
        Vendor:
          vendor ||
          (purchaseOrder.vendorId
            ? await Vendor.findByPk(purchaseOrder.vendorId, { transaction: t })
            : null),
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

// Get a purchase order by ID
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
      items: purchaseOrder.items || [], // Return JSON items directly
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching purchase order",
      error: error.message,
    });
  }
};

// Get all purchase orders
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.findAll({
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
      items: po.items || [], // Return JSON items directly
    }));

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching purchase orders",
      error: error.message,
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

// Get purchase orders by vendor
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
      items: po.items || [], // Return JSON items directly
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
    await purchaseOrder.update({ status }, { transaction: t });

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
