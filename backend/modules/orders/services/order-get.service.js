const {
  Op,
  Order,
  User,
  Customer,
  Team,
  Address,
  Quotation,
  sendErrorResponse,
  fetchCommentsWithUsers,
  moment,
} = require("./orders.helpers");

// Get all orders (no notification needed)
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", status, priority } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build the where condition dynamically
    const where = {};

    // Status filter (exact match)
    if (status && status.trim() !== "") {
      where.status = status.trim();
    }

    // Priority filter (exact match)
    if (priority && priority.trim() !== "") {
      where.priority = priority.trim();
    }

    // Search – usually across orderNo + customer name
    if (search && search.trim() !== "") {
      const searchTerm = `%${search.trim()}%`;
      where[Op.or] = [
        { orderNo: { [Op.like]: searchTerm } },
        { "$customer.name$": { [Op.like]: searchTerm } },
        // Optional: add more searchable fields
        // { someOtherField: { [Op.like]: searchTerm } },
      ];
    }

    const { count: totalOrders, rows: orders } = await Order.findAndCountAll({
      where, // ← this was missing!
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "secondaryUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: Team,
          as: "assignedTeam",
          attributes: ["id", "teamName"],
        },
        {
          model: Order,
          as: "previousOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "masterOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Address,
          as: "shippingAddress",
          attributes: ["addressId"],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit: limitNum,
      subQuery: false,
    });

    const totalPages = Math.ceil(totalOrders / limitNum);

    return res.status(200).json({
      data: orders.map((order) => order.toJSON()),
      pagination: {
        total: totalOrders,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch orders",
      process.env.NODE_ENV === "development" ? err.message : undefined,
    );
  }
};
// Get order details (no notification needed)
exports.getOrderDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "secondaryUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: Team,
          as: "assignedTeam",
          attributes: ["id", "teamName"],
        },
        {
          model: Order,
          as: "previousOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "masterOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "nextOrders",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "pipelineOrders",
          attributes: ["id", "orderNo"],
        },
        {
          model: Address,
          as: "shippingAddress",
          attributes: ["addressId"],
        },
        {
          model: Quotation,
          as: "quotation",
          attributes: [
            "quotationId",
            "document_title",
            "quotation_date",
            "due_date",
            "followupDates",
            "reference_number",
            "products",
            "discountAmount",
            "roundOff",
            "finalAmount",
            "signature_name",
            "signature_image",
            "createdBy",
            "customerId",
            "shipTo",
          ],
        },
      ],
    });

    if (!order) {
      return sendErrorResponse(res, 404, `Order with ID ${id} not found`);
    }

    const { comments } = await fetchCommentsWithUsers(id, "Order", 1, 10);
    let orderWithDetails = order.toJSON();

    // ────────────────────────────────────────────────
    // Handle quotation-linked products (if applicable)
    // ────────────────────────────────────────────────
    if (order.quotationId && order.quotation) {
      try {
        let quotationProducts = order.quotation.products || [];
        if (typeof quotationProducts === "string") {
          try {
            quotationProducts = JSON.parse(quotationProducts);
          } catch (parseErr) {
            quotationProducts = [];
          }
        }

        if (!Array.isArray(quotationProducts)) {
          quotationProducts = [];
        }

        // Optional: enrich quotation products only if really needed
        // For now – keep minimal (remove productDetails unless required)
        const enrichedQuotationProducts = quotationProducts.map((item) => ({
          productId: item.productId,
          name: item.name || "Unknown Product",
          quantity: item.quantity || 1,
          price: item.price || 0,
          discount: item.discount || 0,
          discountType: item.discountType || "percent",
          tax: item.tax || 0,
          total: item.total || 0,
          // Do NOT add: productDetails, sellingPrice
        }));

        orderWithDetails.quotation.products = enrichedQuotationProducts;

        orderWithDetails.quotationDetails = {
          quotationId: order.quotation.quotationId,
          document_title: order.quotation.document_title,
          quotation_date: order.quotation.quotation_date,
          due_date: order.quotation.due_date,
          followupDates: order.quotation.followupDates,
          reference_number: order.quotation.reference_number,
          discountAmount: order.quotation.discountAmount || 0,
          roundOff: order.quotation.roundOff || 0,
          finalAmount: order.quotation.finalAmount || 0,
          signature_name: order.quotation.signature_name,
          signature_image: order.quotation.signature_image,
          createdBy: order.quotation.createdBy,
          customerId: order.quotation.customerId,
          shipTo: order.quotation.shipTo,
          status: order.quotation.status,
        };
      } catch (err) {
        orderWithDetails.quotationDetails = null;
        orderWithDetails.quotation.products = [];
      }
    }

    // ────────────────────────────────────────────────
    // Handle regular order products – NO enrichment
    // ────────────────────────────────────────────────
    if (orderWithDetails.products && Array.isArray(orderWithDetails.products)) {
      orderWithDetails.products = orderWithDetails.products.map((item) => ({
        productId: item.id || item.productId,
        name: item.name || "Unknown Product",
        imageUrl: item.imageUrl || "", // ✅ ADD THIS
        productCode: item.productCode || "", // optional but useful
        companyCode: item.companyCode || "", // optional
        quantity: item.quantity || 1,
        price: item.price || 0,
        discount: item.discount || 0,
        discountType: item.discountType || "percent",
        tax: item.tax || 0,
        total: item.total || item.price * (item.quantity || 1),
      }));
    } else {
      orderWithDetails.products = [];
    }

    orderWithDetails.comments = comments;

    return res.status(200).json({ order: orderWithDetails });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch order details",
      err.message,
    );
  }
};

// Get recent orders (no notification needed)
exports.recentOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "secondaryUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: Team,
          as: "assignedTeam",
          attributes: ["id", "teamName"],
        },
        {
          model: Order,
          as: "previousOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "masterOrder",
          attributes: ["id", "orderNo"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    return res.status(200).json({ orders });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch recent orders",
      err.message,
    );
  }
};

// Get order by ID (no notification needed)
exports.orderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "secondaryUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: Team,
          as: "assignedTeam",
          attributes: ["id", "teamName"],
        },
        {
          model: Order,
          as: "previousOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "masterOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "nextOrders",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "pipelineOrders",
          attributes: ["id", "orderNo"],
        },
        {
          model: Address,
          as: "shippingAddress",
          attributes: ["addressId"],
        },
      ],
    });

    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    const { comments } = await fetchCommentsWithUsers(id, "Order", 1, 10);

    const orderWithComments = {
      ...order.toJSON(),
      comments,
    };

    return res.status(200).json({ order: orderWithComments });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to fetch order", err.message);
  }
};

// Get filtered orders (no notification needed)
exports.getFilteredOrders = async (req, res) => {
  try {
    const {
      status,
      priority,
      dueDate,
      createdBy,
      assignedTeamId,
      createdFor,
      search,
      page = 1,
      limit = 10,
      masterPipelineNo,
      previousOrderNo,
      shipTo, // Add shipTo filter
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return sendErrorResponse(res, 400, "Invalid page number");
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return sendErrorResponse(res, 400, "Invalid limit (must be 1-100)");
    }

    const filters = {};

    if (status) {
      const normalizedStatus = status.toUpperCase();
      const validStatuses = [
        "PREPARING",
        "CHECKING",
        "INVOICE",
        "DISPATCHED",
        "DELIVERED",
        "PARTIALLY_DELIVERED",
        "CANCELED",
        "DRAFT",
        "ONHOLD",
      ];
      if (!validStatuses.includes(normalizedStatus)) {
        return sendErrorResponse(res, 400, `Invalid status: ${status}`);
      }
      filters.status = normalizedStatus;
    }

    if (priority) {
      const normalizedPriority = priority.toLowerCase();
      const validPriorities = ["high", "medium", "low"];
      if (!validPriorities.includes(normalizedPriority)) {
        return sendErrorResponse(res, 400, `Invalid priority: ${priority}`);
      }
      filters.priority = normalizedPriority;
    }

    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate)) {
        return sendErrorResponse(res, 400, "Invalid dueDate format");
      }
      filters.dueDate = parsedDate;
    }

    if (createdBy) {
      const user = await User.findByPk(createdBy);
      if (!user) {
        return sendErrorResponse(res, 404, "Creator user not found");
      }
      filters.createdBy = createdBy;
    }

    if (assignedTeamId) {
      const team = await Team.findByPk(assignedTeamId);
      if (!team) {
        return sendErrorResponse(res, 404, "Assigned team not found");
      }
      filters.assignedTeamId = assignedTeamId;
    }

    if (createdFor) {
      const customer = await Customer.findByPk(createdFor);
      if (!customer) {
        return sendErrorResponse(res, 404, "Customer not found");
      }
      filters.createdFor = createdFor;
    }

    if (masterPipelineNo) {
      const masterOrder = await Order.findOne({
        where: { orderNo: masterPipelineNo },
      });
      if (!masterOrder) {
        return sendErrorResponse(
          res,
          404,
          `Master order with orderNo ${masterPipelineNo} not found`,
        );
      }
      filters.masterPipelineNo = masterPipelineNo;
    }

    if (previousOrderNo) {
      const previousOrder = await Order.findOne({
        where: { orderNo: previousOrderNo },
      });
      if (!previousOrder) {
        return sendErrorResponse(
          res,
          404,
          `Previous order with orderNo ${previousOrderNo} not found`,
        );
      }
      filters.previousOrderNo = previousOrderNo;
    }

    if (shipTo) {
      const address = await Address.findByPk(shipTo);
      if (!address) {
        return sendErrorResponse(
          res,
          404,
          `Address with ID ${shipTo} not found`,
        );
      }
      filters.shipTo = shipTo;
    }

    const searchFilter = search
      ? {
          [Op.or]: [
            { source: { [Op.like]: `%${search}%` } },
            { "$customer.name$": { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const include = [
      {
        model: Customer,
        as: "customer",
        attributes: ["customerId", "name"],
        required: search ? false : undefined,
      },
      {
        model: User,
        as: "creator",
        attributes: ["userId", "username", "name"],
      },
      {
        model: User,
        as: "assignedUser",
        attributes: ["userId", "username", "name"],
      },
      {
        model: User,
        as: "secondaryUser",
        attributes: ["userId", "username", "name"],
      },
      {
        model: Team,
        as: "assignedTeam",
        attributes: ["id", "teamName"],
      },
      {
        model: Order,
        as: "previousOrder",
        attributes: ["id", "orderNo"],
      },
      {
        model: Order,
        as: "masterOrder",
        attributes: ["id", "orderNo"],
      },
      {
        model: Address,
        as: "shippingAddress",
        attributes: ["addressId"],
      },
    ];

    const offset = (pageNum - 1) * limitNum;

    const orders = await Order.findAll({
      where: { ...filters, ...searchFilter },
      include,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    const ordersWithComments = await Promise.all(
      orders.map(async (order) => {
        const { comments } = await fetchCommentsWithUsers(
          order.id,
          "Order",
          1,
          10,
        );
        return {
          ...order.toJSON(),
          comments,
        };
      }),
    );

    const totalCount = await Order.count({
      where: { ...filters, ...searchFilter },
      include: search ? include : [],
    });

    return res.status(200).json({
      orders: ordersWithComments,
      totalCount,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch filtered orders",
      err.message,
    );
  }
};

// Count orders (no notification needed)
exports.countOrders = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !moment(date, "YYYY-MM-DD").isValid()) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    const startOfDay = moment(date).startOf("day").toDate();
    const endOfDay = moment(date).endOf("day").toDate();

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
    res.status(500).json({ message: "Server error" });
  }
};
