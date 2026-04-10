const { Op } = require("sequelize");

const {
  sequelize,
  User,
  Role,
  Address,
  Brand,
  Category,
  Company,
  Customer,
  Invoice,
  Keyword,
  Order,
  Product,
  Quotation,
  Team,
  Vendor,
  PurchaseOrder, // ← Make sure this is imported from models
} = require("../models");

const searchAll = async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchTerm = `%${query.trim()}%`;
    const rawQuery = query.trim();
    const currentPage = parseInt(page);
    const pageSize = Math.min(parseInt(limit) || 20, 50); // Cap at 50 for performance
    const offset = (currentPage - 1) * pageSize;

    const results = {};

    const searchConfigs = [
      {
        key: "Brand",
        model: Brand,
        fields: ["brandSlug", "brandName"],
        attributes: ["id", "brandSlug", "brandName"],
      },
      {
        key: "Category",
        model: Category,
        fields: ["name"],
        attributes: ["categoryId", "name", "parentCategoryId"],
      },
      {
        key: "Customer",
        model: Customer,
        fields: ["name", "email", "customerType", "mobileNumber"],
        attributes: [
          "customerId",
          "name",
          "email",
          "customerType",
          "mobileNumber",
        ],
      },
      {
        key: "Order",
        model: Order,
        fields: ["orderNo", "status"],
        attributes: ["id", "orderNo", "status", "dueDate", "priority"],
      },
      {
        key: "Product",
        model: Product,
        fields: ["name", "product_code"],
        attributes: ["productId", "name", "product_code", "images", "meta"],
        customWhere: (searchTerm, rawQuery) => {
          const escapedSearch = rawQuery.replace(/'/g, "''");
          const castMeta = sequelize.cast(
            sequelize.col("meta"),
            "CHAR CHARACTER SET utf8mb4",
          );
          const castImages = sequelize.cast(
            sequelize.col("images"),
            "CHAR CHARACTER SET utf8mb4",
          );

          return {
            [Op.or]: [
              { name: { [Op.like]: searchTerm } },
              { product_code: { [Op.like]: searchTerm } },
              sequelize.where(castMeta, {
                [Op.like]: sequelize.literal(`'%${escapedSearch}%'`),
              }),
              sequelize.where(castImages, {
                [Op.like]: sequelize.literal(`'%${escapedSearch}%'`),
              }),
            ],
          };
        },
      },
      {
        key: "Quotation",
        model: Quotation,
        fields: ["document_title", "reference_number"],
        attributes: [
          "quotationId",
          "document_title",
          "quotation_date",
          "finalAmount",
        ],
      },
      {
        key: "Role",
        model: Role,
        fields: ["roleName"],
        attributes: ["roleId", "roleName"],
      },
      {
        key: "Team",
        model: Team,
        fields: ["teamName", "adminName"],
        attributes: ["id", "teamName", "adminName"],
      },
      {
        key: "User",
        model: User,
        fields: ["username", "name", "email", "mobileNumber"],
        attributes: ["userId", "username", "name", "email", "status"],
      },
      {
        key: "Vendor",
        model: Vendor,
        fields: ["vendorId", "vendorName"],
        attributes: ["id", "vendorId", "vendorName", "brandSlug"],
      },
      // ==================== NEW: PurchaseOrder ====================
      {
        key: "PurchaseOrder",
        model: PurchaseOrder,
        fields: ["poNumber", "status"],
        attributes: [
          "id",
          "poNumber",
          "status",
          "orderDate",
          "expectDeliveryDate",
          "totalAmount",
          "vendorId",
          "userId",
          "fgsId",
        ],
        // Optional: You can add customWhere if you want to search in more JSON fields later
      },
      // Add other models (Invoice, Company, etc.) here if needed in the future
    ];

    // Run searches in parallel
    await Promise.all(
      searchConfigs.map(
        async ({ key, model, fields, attributes, customWhere }) => {
          try {
            let where = {
              [Op.or]: fields.map((field) => ({
                [field]: { [Op.like]: searchTerm },
              })),
            };

            if (customWhere) {
              where = customWhere(searchTerm, rawQuery);
            }

            const { rows, count } = await model.findAndCountAll({
              where,
              attributes,
              limit: pageSize,
              offset,
              order: [["createdAt", "DESC"]],
              // distinct: true, // Uncomment if you use includes later
            });

            results[key] = {
              items: rows,
              total: count,
              page: currentPage,
              totalPages: Math.ceil(count / pageSize),
              limit: pageSize,
            };
          } catch (error) {
            console.error(`Search error for ${key}:`, error);
            results[key] = {
              items: [],
              total: 0,
              page: currentPage,
              totalPages: 0,
              limit: pageSize,
              error: `Failed to search ${key}`,
            };
          }
        },
      ),
    );

    // Calculate overall stats
    const totalResults = Object.values(results).reduce(
      (sum, cat) => sum + (cat.total || 0),
      0,
    );

    return res.status(200).json({
      success: true,
      message: "Search completed",
      data: results,
      meta: {
        total: totalResults,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(totalResults / pageSize), // overall approximate
      },
    });
  } catch (error) {
    console.error("Global search error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred during search",
    });
  }
};

module.exports = {
  searchAll,
};
