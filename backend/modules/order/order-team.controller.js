const { Order, Team, Customer, Address, User } = require("../models");
const { sendErrorResponse } = require("../utils/response.util");
const { sendNotification } = require("./notificationController");
const { ADMIN_USER_ID } = require("../config/constants");

// Update order team
exports.updateOrderTeam = async (req, res) => {
  try {
    const { id, assignedTeamId } = req.body;

    if (!id) {
      return sendErrorResponse(res, 400, "Order ID is required");
    }

    const order = await Order.findByPk(id, {
      include: [
        { model: Address, as: "shippingAddress", attributes: ["addressId"] },
      ],
    });
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    if (assignedTeamId) {
      const team = await Team.findByPk(assignedTeamId);
      if (!team) {
        return sendErrorResponse(res, 400, "Assigned team not found");
      }
    }

    const previousTeamId = order.assignedTeamId;
    order.assignedTeamId = assignedTeamId || null;
    await order.save();

    const customer = await Customer.findByPk(order.createdFor);
    const addressInfo =
      order.shipTo && order.shipToAddress
        ? `, to be shipped to ${
            order.shipToAddress.address || "address ID " + order.shipTo
          }`
        : "";

    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        (id) => id,
      ),
    );
    for (const recipientId of recipients) {
      await sendNotification({
        userId: recipientId,
        title: `Order Team Updated #${order.orderNo}`,
        message: `The team for order #${order.orderNo} for ${
          customer?.name || "Customer"
        }${addressInfo} has been updated.`,
      });
    }

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Team Updated #${order.orderNo}`,
      message: `The team for order #${order.orderNo} for ${
        customer?.name || "Customer"
      }${addressInfo} has been updated.`,
    });

    if (assignedTeamId && assignedTeamId !== previousTeamId) {
      const teamMembers = await User.findAll({
        include: [{ model: Team, as: "teams", where: { id: assignedTeamId } }],
        attributes: ["userId", "name"],
      });
      for (const member of teamMembers) {
        await sendNotification({
          userId: member.userId,
          title: `Order Assigned to Team #${order.orderNo}`,
          message: `Order #${
            order.orderNo
          } has been assigned to your team for ${
            customer?.name || "Customer"
          }${addressInfo}.`,
        });
      }
    }

    return res.status(200).json({ message: "Order team updated", order });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to update order team",
      err.message,
    );
  }
};
