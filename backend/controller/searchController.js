const { Op } = require("sequelize");

const {
  sequelize,
  Brand,
  Category,
  Customer,
  Order,
  Product,
  Quotation,
  Role,
  Team,
  User,
  Vendor,
  PurchaseOrder,
} = require("../models");

const searchAll = async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const searchTerm = `%${query.trim()}%`;
    const rawQuery = query.trim().toLowerCase();
    const currentPage = parseInt(page);
    const pageSize = Math.min(parseInt(limit) || 20, 50);
    const globalOffset = (currentPage - 1) * pageSize;

    const results = {};

    const searchConfigs = [
      {
        key: "Product",
        model: Product,
        attributes: [
          "productId",
          "name",
          "product_code",
          "quantity",
          "images",
          "meta",
          "updatedAt",
        ],
        limit: pageSize,
        order: [
          ["updatedAt", "DESC"],
          ["name", "ASC"],
        ],
        customWhere: () => ({
          [Op.or]: [
            { name: { [Op.like]: searchTerm } },
            { product_code: { [Op.like]: searchTerm } },
            sequelize.where(
              sequelize.fn(
                "LOWER",
                sequelize.cast(sequelize.col("meta"), "CHAR"),
              ),
              Op.like,
              `%${rawQuery}%`,
            ),
          ],
        }),
      },
      {
        key: "Customer",
        model: Customer,
        attributes: [
          "customerId",
          "name",
          "email",
          "mobileNumber",
          "customerType",
        ],
      },
      {
        key: "Quotation",
        model: Quotation,
        attributes: [
          "quotationId",
          "document_title",
          "reference_number",
          "finalAmount",
          "quotation_date",
        ],
      },
      {
        key: "Order",
        model: Order,
        attributes: ["id", "orderNo", "status", "finalAmount", "createdAt"],
      },
      {
        key: "Brand",
        model: Brand,
        attributes: ["id", "brandName", "brandSlug"],
      },
      {
        key: "Category",
        model: Category,
        attributes: ["categoryId", "name"],
      },
      {
        key: "Vendor",
        model: Vendor,
        attributes: ["id", "vendorName"],
      },
      {
        key: "PurchaseOrder",
        model: PurchaseOrder,
        attributes: ["id", "poNumber", "status", "totalAmount", "orderDate"],
      },
    ];

    // Run searches in parallel
    await Promise.all(
      searchConfigs.map(async (config) => {
        try {
          const whereClause = config.customWhere
            ? config.customWhere()
            : {
                [Op.or]:
                  config.fields?.map((field) => ({
                    [field]: { [Op.like]: searchTerm },
                  })) || [],
              };

          const limitToUse = config.limit || pageSize;
          const offsetToUse =
            config.key === "Product"
              ? globalOffset // Use real pagination for Product
              : globalOffset;

          const { rows, count } = await config.model.findAndCountAll({
            where: whereClause,
            attributes: config.attributes,
            limit: limitToUse,
            offset: offsetToUse,
            order: config.order || [["createdAt", "DESC"]],
          });

          results[config.key] = {
            items: rows,
            total: count,
            page: currentPage,
            limit: limitToUse,
            totalPages: Math.ceil(count / limitToUse),
          };
        } catch (err) {
          console.error(`Search error in ${config.key}:`, err);
          results[config.key] = {
            items: [],
            total: 0,
            page: currentPage,
            limit: pageSize,
            totalPages: 0,
          };
        }
      }),
    );

    const totalResults = Object.values(results).reduce(
      (sum, cat) => sum + (cat.total || 0),
      0,
    );

    return res.json({
      success: true,
      message: `Found ${totalResults} results for "${rawQuery}"`,
      data: results,
      meta: {
        totalResults,
        query: rawQuery,
        currentPage,
        pageSize,
        totalPages: Math.ceil(totalResults / pageSize),
      },
    });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching",
    });
  }
};

module.exports = { searchAll };
