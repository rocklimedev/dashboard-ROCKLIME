const {
  Op,
  sequelize,
  moment,
  Order,
  sendErrorResponse,
  LATE_DONE_STATUSES,
} = require('./order-controller.shared');

// GET /api/order/status-counts → orders per status, plus late and "to dispatch"
exports.statusCounts = async (req, res) => {
  try {
    const rows = await sequelize.query('SELECT status, COUNT(*) AS n FROM orders GROUP BY status', {
      type: sequelize.QueryTypes.SELECT,
    });
    const byStatus = Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
    const [{ late }] = await sequelize.query(
      'SELECT COUNT(*) AS late FROM orders WHERE dueDate < CURDATE() AND status NOT IN (:done)',
      { replacements: { done: LATE_DONE_STATUSES }, type: sequelize.QueryTypes.SELECT },
    );
    const sum = (list) => list.reduce((a, s) => a + (byStatus[s] || 0), 0);
    return res.json({
      byStatus,
      total: Object.values(byStatus).reduce((a, n) => a + n, 0),
      late: Number(late),
      active: sum(['PREPARING', 'CHECKING', 'INVOICE', 'PARTIALLY_DISPATCHED', 'ONHOLD']),
      toDispatch: sum(['PREPARING', 'CHECKING', 'INVOICE', 'PARTIALLY_DISPATCHED']),
      inTransit: sum(['DISPATCHED', 'PARTIALLY_DELIVERED']),
      done: sum(['DELIVERED', 'CLOSED']),
    });
  } catch (err) {
    return sendErrorResponse(res, 500, 'Failed to count orders', err.message);
  }
};

// Count orders (no notification needed)
exports.countOrders = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !moment(date, 'YYYY-MM-DD').isValid()) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();

    const count = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
