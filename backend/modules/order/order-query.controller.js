const moment = require("moment");
const { Op } = require("sequelize");
const { Order, Team, Quotation, Address, Product, User } = require("../models");
const { sendErrorResponse } = require("../utils/response.util");
const { sendNotification } = require("./notificationController");
const { ADMIN_USER_ID } = require("../config/constants");

// ──────── DRAFT ORDER (also accepts amountPaid) ────────
exports.draftOrder = async (req, res) => {
  try {
    const {
      quotationId,
      assignedTeamId,
      products,
      masterPipelineNo,
      previousOrderNo,
      shipTo,
      amountPaid = 0,
    } = req.body;

    if (!assignedTeamId)
      return sendErrorResponse(res, 400, "assignedTeamId required");

    const team = await Team.findByPk(assignedTeamId);
    if (!team) return sendErrorResponse(res, 400, "Team not found");

    // optional validations (same as create)
    if (quotationId) {
      const q = await Quotation.findByPk(quotationId);
      if (!q) return sendErrorResponse(res, 400, "Quotation not found");
    }
    if (masterPipelineNo) {
      const m = await Order.findOne({ where: { orderNo: masterPipelineNo } });
      if (!m)
        return sendErrorResponse(
          res,
          404,
          `Master order ${masterPipelineNo} not found`,
        );
    }
    if (previousOrderNo) {
      const p = await Order.findOne({ where: { orderNo: previousOrderNo } });
      if (!p)
        return sendErrorResponse(
          res,
          404,
          `Previous order ${previousOrderNo} not found`,
        );
    }
    if (shipTo) {
      const a = await Address.findByPk(shipTo);
      if (!a) return sendErrorResponse(res, 404, `Address ${shipTo} not found`);
    }

    // product validation (same as create, but **no stock reduction**)
    if (products) {
      if (!Array.isArray(products) || !products.length)
        return sendErrorResponse(res, 400, "products must be non-empty array");
      for (const p of products) {
        const { id, price, discount, total } = p;
        if (!id || price == null || discount == null || total == null)
          return sendErrorResponse(
            res,
            400,
            "Each product needs id,price,discount,total",
          );
        const prod = await Product.findByPk(id);
        if (!prod)
          return sendErrorResponse(res, 404, `Product ${id} not found`);

        const discType = p.discountType || prod.discountType || "percent";
        const expected =
          discType === "percent"
            ? price * (1 - discount / 100)
            : price - discount;
        if (Math.abs(total - expected) > 0.01)
          return sendErrorResponse(
            res,
            400,
            `Invalid total for ${id}. Expected ${expected.toFixed(2)}`,
          );
      }
    }

    // amountPaid must be 0 for draft
    const paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid < 0)
      return sendErrorResponse(res, 400, "Invalid amountPaid");
    if (paid > 0)
      return sendErrorResponse(
        res,
        400,
        "amountPaid must be 0 for draft orders",
      );

    // generate orderNo (same pattern as create)
    const today = moment().format("DDMMYYYY");
    const dayCount = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: moment().startOf("day").toDate(),
          [Op.lte]: moment().endOf("day").toDate(),
        },
      },
    });
    const serial = String(dayCount + 1).padStart(5, "0");
    const orderNo = `${today}${serial}`;

    const order = await Order.create({
      quotationId,
      status: "DRAFT",
      assignedTeamId,
      products,
      masterPipelineNo,
      previousOrderNo,
      orderNo: parseInt(orderNo),
      shipTo,
      amountPaid: 0,
    });

    // admin + team notifications
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Draft Order #${orderNo}`,
      message: `Draft order #${orderNo} created.`,
    });

    const members = await User.findAll({
      include: [{ model: Team, as: "teams", where: { id: assignedTeamId } }],
      attributes: ["userId", "name"],
    });
    for (const m of members) {
      await sendNotification({
        userId: m.userId,
        title: `Draft Assigned #${orderNo}`,
        message: `Draft order #${orderNo} assigned to your team.`,
      });
    }

    return res.status(201).json({ message: "Draft created", order });
  } catch (err) {
    return sendErrorResponse(res, 500, "Draft failed", err.message);
  }
};
