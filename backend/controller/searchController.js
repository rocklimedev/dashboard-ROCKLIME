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

    // Validate query
    if (!query || query.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchTerm = `%${query.trim()}%`;
    const offset = (page - 1) * limit;
    const results = {};

    // Define searchable fields for each model
    const searchQueries = [
      {
        model: Address,
        fields: ["street", "city", "state", "postalCode", "country"],
        attributes: [
          "addressId",
          "street",
          "city",
          "state",
          "postalCode",
          "country",
        ],
      },
      {
        model: Brand,
        fields: ["brandSlug", "brandName"],
        attributes: ["id", "brandSlug", "brandName"],
      },
      {
        model: Category,
        fields: ["name"],
        attributes: ["categoryId", "name", "parentCategoryId"],
      },
      {
        model: Company,
        fields: ["name", "address", "website", "slug"],
        attributes: ["companyId", "name", "address", "website", "slug"],
      },
      {
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
        model: Keyword,
        fields: ["keyword"],
        attributes: ["id", "keyword", "categoryId"],
      },
      {
        model: Order,
        fields: ["orderNo", "status"],
        attributes: ["id", "orderNo", "status", "dueDate", "priority"],
      },
      {
        model: Product,
        fields: ["name", "product_code", "images", "meta"],
        attributes: ["productId", "name", "product_code", "images", "meta"],
      },
      {
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
        model: Role,
        fields: ["roleName"],
        attributes: ["roleId", "roleName"],
      },
      {
        model: Team,
        fields: ["teamName", "adminName"],
        attributes: ["id", "teamName", "adminName"],
      },
      {
        model: User,
        fields: ["username", "name", "email", "mobileNumber"],
        attributes: ["userId", "username", "name", "email", "status"],
      },
      {
        model: Vendor,
        fields: ["vendorId", "vendorName"],
        attributes: ["id", "vendorId", "vendorName", "brandSlug"],
      },
    ];

    // Execute searches concurrently
    await Promise.all(
      searchQueries.map(async ({ model, fields, attributes }) => {
        try {
          const where = {
            [Op.or]: fields.map((field) => ({
              [field]: { [Op.like]: searchTerm },
            })),
          };

          const { rows, count } = await model.findAndCountAll({
            where,
            attributes,
            limit: parseInt(limit),
            offset,
            order: [["createdAt", "DESC"]],
          });

          results[model.name] = {
            items: rows,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit),
          };
        } catch (error) {
          results[model.name] = {
            items: [],
            total: 0,
            page: parseInt(page),
            pages: 0,
            error: `Failed to search ${model.name}`,
          };
        }
      })
    );

    // Calculate total results across all models
    const totalResults = Object.values(results).reduce(
      (sum, { total }) => sum + total,
      0
    );

    return res.status(200).json({
      success: true,
      message: "Search completed",
      data: results,
      meta: {
        total: totalResults,
        page: parseInt(page),
        limit: parseInt(limit),
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
