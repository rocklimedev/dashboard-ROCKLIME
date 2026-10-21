const {
  OrderItem,
  Comment,
  Op,
  sequelize,
  moment,
  sendNotification,
  User,
  Order,
  Team,
  Customer,
  Quotation,
  Address,
  Product,
  logActivity,
  ADMIN_USER_ID,
  stock,
  sendErrorResponse,
} = require('./order-controller.shared');

// ──────── DELETE ORDER ────────
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [{ model: Customer, as: 'customer' }],
    });
    if (!order) return sendErrorResponse(res, 404, 'Order not found');

    // prevent delete if referenced
    const deps = await Order.findAll({
      where: {
        [Op.or]: [{ previousOrderNo: order.orderNo }, { masterPipelineNo: order.orderNo }],
      },
    });
    if (deps.length)
      return sendErrorResponse(res, 400, 'Order referenced by other orders – cannot delete');

    // restore stock
    if (order.products?.length) {
      // Free whatever this order still holds; dispatched goods stay out.
      await sequelize.transaction((t) =>
        stock.releaseOrder(order.id, { t, userId: req.user?.userId || null }),
      );
    }

    // notifications
    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(Boolean),
    );
    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `Order Deleted #${order.orderNo}`,
        message: `Order #${order.orderNo} for ${order.customer?.name || 'Customer'} deleted.`,
      });
    }
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Deleted #${order.orderNo}`,
      message: `Order #${order.orderNo} deleted.`,
    });

    // mongo clean-up
    await Comment.deleteMany({ resourceId: id, resourceType: 'Order' });
    await OrderItem.deleteMany({ orderId: id });

    await order.destroy();
    // ── ACTIVITY LOG ──
    await logActivity({
      userId: req.user?.userId || order.createdBy,
      contextTag: 'SALES',
      subContext: 'ORDER',
      action: 'DELETE_ORDER',
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
    return res.status(200).json({ message: 'Order deleted' });
  } catch (err) {
    return sendErrorResponse(res, 500, 'Delete failed', err.message);
  }
};

// ──────── DRAFT ORDER (now also accepts amountPaid) ────────
exports.draftOrder = async (req, res) => {
  try {
    const {
      quotationId,
      assignedTeamId,
      products,
      masterPipelineNo,
      previousOrderNo,
      shipTo,
      amountPaid = 0, // ← NEW
    } = req.body;

    if (!assignedTeamId) return sendErrorResponse(res, 400, 'assignedTeamId required');

    const team = await Team.findByPk(assignedTeamId);
    if (!team) return sendErrorResponse(res, 400, 'Team not found');

    // optional validations (same as create)
    if (quotationId) {
      const q = await Quotation.findByPk(quotationId);
      if (!q) return sendErrorResponse(res, 400, 'Quotation not found');
    }
    if (masterPipelineNo) {
      const m = await Order.findOne({ where: { orderNo: masterPipelineNo } });
      if (!m) return sendErrorResponse(res, 404, `Master order ${masterPipelineNo} not found`);
    }
    if (previousOrderNo) {
      const p = await Order.findOne({ where: { orderNo: previousOrderNo } });
      if (!p) return sendErrorResponse(res, 404, `Previous order ${previousOrderNo} not found`);
    }
    if (shipTo) {
      const a = await Address.findByPk(shipTo);
      if (!a) return sendErrorResponse(res, 404, `Address ${shipTo} not found`);
    }

    // product validation (same as create, but **no stock reduction**)
    if (products) {
      if (!Array.isArray(products) || !products.length)
        return sendErrorResponse(res, 400, 'products must be non-empty array');
      for (const p of products) {
        const { id, price, discount, total } = p;
        if (!id || price == null || discount == null || total == null)
          return sendErrorResponse(res, 400, 'Each product needs id,price,discount,total');
        const prod = await Product.findByPk(id);
        if (!prod) return sendErrorResponse(res, 404, `Product ${id} not found`);
        // line-total check
        // Use discountType from payload if exists, else fall back to DB
        const discType = p.discountType || prod.discountType || 'percent';
        const expected = discType === 'percent' ? price * (1 - discount / 100) : price - discount;
        if (Math.abs(total - expected) > 0.01)
          return sendErrorResponse(
            res,
            400,
            `Invalid total for ${id}. Expected ${expected.toFixed(2)}`,
          );
      }
    }

    // amountPaid validation (must be 0 for draft – optional)
    const paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid < 0) return sendErrorResponse(res, 400, 'Invalid amountPaid');
    if (paid > 0) return sendErrorResponse(res, 400, 'amountPaid must be 0 for draft orders');

    // generate orderNo (same pattern as create)
    const today = moment().format('DDMMYYYY');
    const dayCount = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: moment().startOf('day').toDate(),
          [Op.lte]: moment().endOf('day').toDate(),
        },
      },
    });
    const serial = String(dayCount + 1).padStart(5, '0');
    const orderNo = `${today}${serial}`;

    const order = await Order.create({
      quotationId,
      status: 'DRAFT',
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
      include: [{ model: Team, as: 'teams', where: { id: assignedTeamId } }],
      attributes: ['userId', 'name'],
    });
    for (const m of members) {
      await sendNotification({
        userId: m.userId,
        title: `Draft Assigned #${orderNo}`,
        message: `Draft order #${orderNo} assigned to your team.`,
      });
    }

    return res.status(201).json({ message: 'Draft created', order });
  } catch (err) {
    return sendErrorResponse(res, 500, 'Draft failed', err.message);
  }
};

// Update order team
exports.updateOrderTeam = async (req, res) => {
  try {
    const { id, assignedTeamId } = req.body;

    if (!id) {
      return sendErrorResponse(res, 400, 'Order ID is required');
    }

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Address,
          as: 'shippingAddress',
        },
      ],
    });
    if (!order) {
      return sendErrorResponse(res, 404, 'Order not found');
    }

    if (assignedTeamId) {
      const team = await Team.findByPk(assignedTeamId);
      if (!team) {
        return sendErrorResponse(res, 400, 'Assigned team not found');
      }
    }

    const previousTeamId = order.assignedTeamId;
    order.assignedTeamId = assignedTeamId || null;
    await order.save();

    // Fetch customer for notification
    const customer = await Customer.findByPk(order.createdFor);
    const addressInfo =
      order.shipTo && order.shipToAddress
        ? `, to be shipped to ${order.shipToAddress.address || 'address ID ' + order.shipTo}`
        : '';

    // Send notification to creator, assignedUserId, and secondaryUserId
    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter((id) => id),
    );
    for (const recipientId of recipients) {
      await sendNotification({
        userId: recipientId,
        title: `Order Team Updated #${order.orderNo}`,
        message: `The team for order #${order.orderNo} for ${
          customer?.name || 'Customer'
        }${addressInfo} has been updated.`,
      });
    }

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Team Updated #${order.orderNo}`,
      message: `The team for order #${order.orderNo} for ${
        customer?.name || 'Customer'
      }${addressInfo} has been updated.`,
    });

    // Notify new team members if assignedTeamId changed
    if (assignedTeamId && assignedTeamId !== previousTeamId) {
      const teamMembers = await User.findAll({
        include: [
          {
            model: Team,
            as: 'teams',
            where: { id: assignedTeamId },
          },
        ],
        attributes: ['userId', 'name'],
      });
      for (const member of teamMembers) {
        await sendNotification({
          userId: member.userId,
          title: `Order Assigned to Team #${order.orderNo}`,
          message: `Order #${order.orderNo} has been assigned to your team for ${
            customer?.name || 'Customer'
          }${addressInfo}.`,
        });
      }
    }

    return res.status(200).json({ message: 'Order team updated', order });
  } catch (err) {
    return sendErrorResponse(res, 500, 'Failed to update order team', err.message);
  }
};
