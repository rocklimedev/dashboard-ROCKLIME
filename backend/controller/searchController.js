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
} = require("../models");

// Search controller to handle global search across all models
const searchAll = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchTerm = `%${query.trim()}%`;
    const rawQuery = query.trim(); // used for custom escaping in JSON fields
    const results = {};

    // Define searchable models with explicit keys
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
    ];

    await Promise.all(
      searchConfigs.map(
        async ({ key, model, fields, attributes, customWhere }) => {
          try {
            let where = {
              [Op.or]: fields.map((field) => ({
                [field]: { [Op.like]: searchTerm },
              })),
            };

            // Apply custom where clause if defined (for Product JSON fields)
            if (customWhere) {
              where = customWhere(searchTerm, rawQuery);
            }

            const rows = await model.findAll({
              where,
              attributes,
              limit: 8,
              order: [["createdAt", "DESC"]],
            });

            results[key] = {
              items: rows,
              total: rows.length,
              page: 1,
              pages: 1,
            };
          } catch (error) {
            results[key] = {
              items: [],
              total: 0,
              page: 1,
              pages: 0,
              error: `Failed to search ${key}`,
            };
          }
        },
      ),
    );

    const totalResults = Object.values(results).reduce(
      (sum, { total }) => sum + total,
      0,
    );

    return res.status(200).json({
      success: true,
      message: "Search completed",
      data: results,
      meta: {
        total: totalResults,
        page: parseInt(page),
        limit: parseInt(limit) || 8, // respect the requested limit
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred during search",
    });
  }
};

module.exports = {
  searchAll,
};
