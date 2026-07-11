const { Op } = require("sequelize");
const Comment = require("../models/comment");
const OrderItem = require("../models/orderItem");
const { Order, Customer } = require("../models");
const { sendErrorResponse } = require("../utils/response.util");
const { restoreStock } = require("../services/inventory.service");
const { sendNotification } = require("./notificationController");
const logActivity = require("../utils/activityLogger");
const { ADMIN_USER_ID } = require("../config/constants");

// ──────── DELETE ORDER ────────
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [{ model: Customer, as: "customer" }],
    });
    if (!order) return sendErrorResponse(res, 404, "Order not found");

    // prevent delete if referenced
    const deps = await Order.findAll({
      where: {
        [Op.or]: [
          { previousOrderNo: order.orderNo },
          { masterPipelineNo: order.orderNo },
        ],
      },
    });
    if (deps.length)
      return sendErrorResponse(
        res,
        400,
        "Order referenced by other orders – cannot delete",
      );

    // restore stock
    if (order.products?.length) {
      await restoreStock({ products: order.products, orderNo: order.orderNo });
    }

    // notifications
    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        Boolean,
      ),
    );
    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `Order Deleted #${order.orderNo}`,
        message: `Order #${order.orderNo} for ${
          order.customer?.name || "Customer"
        } deleted.`,
      });
    }
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Deleted #${order.orderNo}`,
      message: `Order #${order.orderNo} deleted.`,
    });

    // mongo clean-up
    await Comment.deleteMany({ resourceId: id, resourceType: "Order" });
    await OrderItem.deleteMany({ orderId: id });

    await order.destroy();

    await logActivity({
      userId: req.user?.userId || order.createdBy,
      contextTag: "SALES",
      subContext: "ORDER",
      action: "DELETE_ORDER",
      entityId: order.id,
      entityName: order.orderNo,
      description: `Order ${order.orderNo} deleted`,
      oldValues: {
        orderId: order.id,
        orderNo: order.orderNo,
        customerName: order.customer?.name,
        finalAmount: order.finalAmount,
        status: order.status,
        productCount: order.products?.length || 0,
      },
      metadata: {
        mongoCleaned: true,
        dependencyBlocked: deps.length > 0,
      },
      req,
    });

    return res.status(200).json({ message: "Order deleted" });
  } catch (err) {
    return sendErrorResponse(res, 500, "Delete failed", err.message);
  }
};
