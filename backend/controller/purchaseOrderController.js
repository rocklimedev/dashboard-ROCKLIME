const PurchaseOrder = require("../models/purchaseorder");
const Product = require("../models/product");
const PoItem = require("../models/poItem");
const Vendor = require("../models/vendor");
const { Op } = require("sequelize");
const sequelize = require("../config/database"); // Import your Sequelize instance

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
    if (!item.mrp || item.mrp <= 0 || isNaN(item.mrp)) {
      throw new Error(`Invalid MRP for product: ${item.productId}`);
    }
    totalAmount += item.quantity * item.mrp;
  }
  return totalAmount.toFixed(2);
};

exports.updatePurchaseOrder = async (req, res) => {
  // Start Sequelize transaction
  const t = await sequelize.transaction();

  try {
    const { vendorId, items, status, expectedDeliveryDate } = req.body;
    console.log("Request body:", req.body); // Debug log

    // Find purchase order using Sequelize transaction
    const purchaseOrder = await PurchaseOrder.findByPk(req.params.id, {
      transaction: t,
    });
    if (!purchaseOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Purchase order not found" });
    }
    console.log("PurchaseOrder.items:", purchaseOrder.items); // Debug log

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
      updateData.expectDeliveryDate = expectedDeliveryDate; // Match schema field name

    if (items && Array.isArray(items)) {
      // Validate items and calculate total
      const totalAmount = await validateItems(items, t); // Use Sequelize transaction
      console.log("Validated items, totalAmount:", totalAmount); // Debug log

      // Update items as JSON
      updateData.items = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.mrp, // Match schema comment
      }));
      updateData.totalAmount = totalAmount;
    }

    // Update Sequelize PurchaseOrder
    await purchaseOrder.update(updateData, { transaction: t });
    console.log("Updated PurchaseOrder:", purchaseOrder.toJSON()); // Debug log

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
    // Rollback transaction
    await t.rollback();
    console.error("Update error:", error); // Debug log
    return res.status(400).json({
      message: "Error updating purchase order",
      error: error.message,
    });
  }
};
// Create a new purchase order
exports.createPurchaseOrder = async (req, res) => {
  try {
    const { vendorId, items, expectedDeliveryDate } = req.body;

    // Validate inputD
    if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Validate vendor
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Validate items and calculate total amount
    const totalAmount = await validateItems(items);

    // Generate unique order number
    const poNumber = `PO-${uuidv4().slice(0, 8)}`;

    // Create MongoDB PoItems document
    const poItem = await PoItem.create({
      quotationId: poNumber,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        mrp: item.mrp,
      })),
    });

    // Create Sequelize PurchaseOrder
    const purchaseOrder = await PurchaseOrder.create({
      poNumber,
      vendorId,
      status: "pending",
      orderDate: new Date(),
      totalAmount,
      expectedDeliveryDate,
      items: poItem._id.toString(), // Store MongoDB PoItems _id
    });

    return res.status(201).json({
      message: "Purchase order created successfully",
      purchaseOrder: {
        ...purchaseOrder.toJSON(),
        items: poItem.items,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating purchase order",
      error: error.message,
    });
  }
};

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
    console.error("Error fetching purchase orders:", error); // Debug log
    return res.status(500).json({
      message: "Error fetching purchase orders",
      error: error.message,
    });
  }
};

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
    console.error("Error fetching purchase order:", error); // Debug log
    return res.status(500).json({
      message: "Error fetching purchase order",
      error: error.message,
    });
  }
};

// Delete a purchase order
exports.deletePurchaseOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const purchaseOrder = await PurchaseOrder.findByPk(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    // Delete associated PoItems from MongoDB
    await PoItem.deleteOne({ _id: purchaseOrder.items }, { session });

    // Delete PurchaseOrder from MySQL
    await purchaseOrder.destroy({ session });

    await session.commitTransaction();
    return res
      .status(200)
      .json({ message: "Purchase order deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      message: "Error deleting purchase order",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// Confirm a purchase order and update product stock
exports.confirmPurchaseOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const purchaseOrder = await PurchaseOrder.findByPk(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    if (purchaseOrder.status !== "pending") {
      return res.status(400).json({ message: "Purchase order is not pending" });
    }

    const poItems = await PoItem.findOne({ _id: purchaseOrder.items });

    if (!poItems) {
      return res
        .status(404)
        .json({ message: "Purchase order items not found" });
    }

    // Update product stock
    for (const item of poItems.items) {
      const product = await Product.findByPk(item.productId);
      if (product) {
        product.quantity += item.quantity;
        await product.save({ session });
      }
    }

    // Update purchase order status
    await purchaseOrder.update({ status: "delivered" }, { session });

    await session.commitTransaction();
    return res.status(200).json({
      message: "Purchase order confirmed and stock updated",
      purchaseOrder: {
        ...purchaseOrder.toJSON(),
        items: poItems.items,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      message: "Error confirming purchase order",
      error: error.message,
    });
  } finally {
    session.endSession();
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

    // Fetch items from MongoDB
    const result = await Promise.all(
      purchaseOrders.map(async (po) => {
        const poItems = await PoItem.findOne({ _id: po.items });
        return {
          ...po.toJSON(),
          items: poItems ? poItems.items : [],
        };
      })
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching purchase orders by vendor",
      error: error.message,
    });
  }
};
