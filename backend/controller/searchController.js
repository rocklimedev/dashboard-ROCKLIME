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
    const results = {};

    // Define searchable models with explicit keys
    const searchConfigs = [
      {
        key: "Address",
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
        key: "Company",
        model: Company,
        fields: ["name", "address", "website", "slug"],
        attributes: ["companyId", "name", "address", "website", "slug"],
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
        key: "Keyword",
        model: Keyword,
        fields: ["keyword"],
        attributes: ["id", "keyword", "categoryId"],
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
        fields: ["name", "product_code", "images", "meta"],
        attributes: ["productId", "name", "product_code", "images", "meta"],
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
      searchConfigs.map(async ({ key, model, fields, attributes }) => {
        try {
          const where = {
            [Op.or]: fields.map((field) => ({
              [field]: { [Op.like]: searchTerm },
            })),
          };

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
          console.error(`Search failed for ${key}:`, error);
          results[key] = {
            items: [],
            total: 0,
            page: 1,
            pages: 0,
            error: `Failed to search ${key}`,
          };
        }
      })
    );

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
        limit: 8, // or keep dynamic if needed
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
