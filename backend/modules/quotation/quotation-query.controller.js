const { Op } = require("sequelize");
const { Quotation, Customer, User } = require("../models");
const QuotationItem = require("../models/quotationItem");
const { calculateTotals } = require("../services/quotationCalculation.service");

// Get a single quotation by ID with items (grouped by option group)
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const mongoDoc = await QuotationItem.findOne({
      quotationId: req.params.id,
    });
    const items = mongoDoc?.items || [];

    // Group for frontend convenience
    const grouped = {};
    items.forEach((item) => {
      const gid = item.groupId || "ungrouped";
      if (!grouped[gid]) grouped[gid] = { main: null, options: [] };
      if (!item.isOptionFor) {
        grouped[gid].main = item;
      } else {
        grouped[gid].options.push(item);
      }
    });

    const groupedItems = Object.values(grouped);

    const calculated = calculateTotals(
      items,
      quotation.extraDiscount,
      quotation.extraDiscountType,
      quotation.shippingAmount,
      quotation.gst,
    );

    res.status(200).json({
      ...quotation.toJSON(),
      items,
      groupedItems,
      calculated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all quotations with pagination, search, and MongoDB item enrichment
exports.getAllQuotations = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 500; // Good for reports
    const offset = (page - 1) * limit;

    // WHERE conditions
    const where = {};

    const search = req.query.search?.trim();
    if (search) {
      const searchTerm = `%${search}%`;
      where[Op.or] = [
        { document_title: { [Op.like]: searchTerm } },
        { reference_number: { [Op.like]: searchTerm } },
      ];
    }

    if (req.query.customerId) {
      where.customerId = req.query.customerId;
    }

    if (req.query.status) {
      where.status = req.query.status;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      where.quotation_date = {};
      if (req.query.startDate) {
        where.quotation_date[Op.gte] = req.query.startDate;
      }
      if (req.query.endDate) {
        where.quotation_date[Op.lte] = req.query.endDate;
      }
    }

    // Main query with associations
    const { count: totalQuotations, rows: quotations } =
      await Quotation.findAndCountAll({
        where,
        offset,
        limit,
        order: [["quotation_date", "DESC"]],
        subQuery: false,
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["customerId", "name", "companyName", "mobileNumber"],
            required: false,
          },
          {
            model: User,
            as: "creator",
            attributes: ["userId", "name", "username"],
            required: false,
          },
        ],
      });

    if (quotations.length === 0) {
      return res.status(200).json({
        data: [],
        pagination: {
          total: totalQuotations,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    // MongoDB items enrichment
    const quotationIds = quotations.map((q) => q.quotationId);

    const mongoItems = await QuotationItem.find({
      quotationId: { $in: quotationIds },
    }).lean();

    const itemsMap = {};
    mongoItems.forEach((itemDoc) => {
      itemsMap[itemDoc.quotationId] = itemDoc.items || [];
    });

    // Final response with flattened fields (best for reports/PDF)
    const enrichedQuotations = quotations.map((q) => {
      const plain = q.toJSON();

      return {
        ...plain,
        items: itemsMap[plain.quotationId] || [],
        customerName:
          plain.customer?.name ||
          plain.customer?.companyName ||
          "Walk-in Customer",
        createdByName: plain.creator?.name || "Unknown",
        customer: plain.customer,
        creator: plain.creator,
      };
    });

    return res.status(200).json({
      data: enrichedQuotations,
      pagination: {
        total: totalQuotations,
        page,
        limit,
        totalPages: Math.ceil(totalQuotations / limit),
      },
    });
  } catch (error) {
    console.error("Get All Quotations Error:", error);
    return res.status(500).json({
      message: "Error fetching quotations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
