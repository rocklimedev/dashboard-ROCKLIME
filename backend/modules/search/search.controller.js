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
} = require("../../models");

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

    // Quotations and orders also match on their customer's name or phone.
    const escaped = sequelize.escape(searchTerm);
    const customerIds = sequelize.literal(
      `(SELECT customerId FROM customers WHERE name LIKE ${escaped} OR mobileNumber LIKE ${escaped} OR companyName LIKE ${escaped})`,
    );

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
        fields: ["name", "email", "mobileNumber", "companyName", "gstNumber"],
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
        customWhere: () => ({
          [Op.or]: [
            { document_title: { [Op.like]: searchTerm } },
            { reference_number: { [Op.like]: searchTerm } },
            { customerId: { [Op.in]: customerIds } },
          ],
        }),
      },
      {
        key: "Order",
        model: Order,
        attributes: ["id", "orderNo", "status", "finalAmount", "createdAt"],
        customWhere: () => ({
          [Op.or]: [
            { orderNo: { [Op.like]: searchTerm } },
            { createdFor: { [Op.in]: customerIds } },
          ],
        }),
      },
      {
        key: "Brand",
        model: Brand,
        attributes: ["id", "brandName", "brandSlug"],
        fields: ["brandName", "brandSlug"],
      },
      {
        key: "Category",
        model: Category,
        attributes: ["categoryId", "name"],
        fields: ["name"],
      },
      {
        key: "Vendor",
        model: Vendor,
        attributes: ["id", "vendorName"],
        fields: ["vendorName", "vendorId"],
      },
      {
        key: "PurchaseOrder",
        model: PurchaseOrder,
        attributes: ["id", "poNumber", "status", "totalAmount", "orderDate"],
        fields: ["poNumber"],
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
          console.error(`[search] ${config.key} failed:`, err.message);
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
    res.status(500).json({
      success: false,
      message: "An error occurred while searching",
    });
  }
};

module.exports = { searchAll };
