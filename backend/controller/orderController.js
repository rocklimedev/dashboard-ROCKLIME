const Order = require("../models/orders");
const OrderItem = require("../models/orderItem");
const Cart = require("../routes/cart");
const Team = require("../models/team");
const TeamMember = require("../models/teamMember");

exports.createOrder = async (req, res) => {
  try {
    const { title, quotationId, admin, teamMembers } = req.body;

    if (!admin || !teamMembers || teamMembers.length === 0) {
      return res
        .status(400)
        .json({ message: "Admin and team members are required" });
    }

    // Create Team
    const team = await Team.create({
      adminId: admin.userId,
      adminName: admin.name,
    });

    // Add Team Members
    const members = teamMembers.map((member) => ({
      teamId: team.id,
      userId: member.userId,
      userName: member.name,
      roleId: member.roleId,
      roleName: member.roleName,
    }));
    await TeamMember.bulkCreate(members);

    // Create Order with Team Reference
    const order = await Order.create({
      title,
      quotationId,
      status: "CREATED",
      teamId: team.id,
    });

    res
      .status(201)
      .json({ message: "Order created", orderId: order.id, teamId: team.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId, {
      include: {
        model: Team,
        include: TeamMember,
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    res
      .status(200)
      .json({ order, team: order.Team, members: order.Team.TeamMembers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    res.status(200).json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await OrderItem.deleteOne({ orderId });
    await order.destroy();

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.recentOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [["createdAt", "DESC"]],
      limit: 20,
    });
    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.orderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.update(updates);

    res.status(200).json({ message: "Order updated successfully", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.draftOrder = async (req, res) => {
  try {
    const { title, quotationId } = req.body;
    const order = await Order.create({
      title,
      quotationId,
      status: "DRAFT",
    });
    res.status(201).json({ message: "Draft order created", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.updateOrderTeam = async (req, res) => {
  try {
    const { orderId, teamMembers } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const team = await Team.findByPk(order.teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Remove existing members and add new ones
    await TeamMember.destroy({ where: { teamId: team.id } });

    const newMembers = teamMembers.map((member) => ({
      teamId: team.id,
      userId: member.userId,
      userName: member.name,
      roleId: member.roleId,
      roleName: member.roleName,
    }));

    await TeamMember.bulkCreate(newMembers);

    res.status(200).json({ message: "Team updated", team });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
