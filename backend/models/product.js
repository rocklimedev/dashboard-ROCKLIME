// models/Product.js
const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      productId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      product_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      masterProductId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "If this is a variant, points to the master product",
      },
      isMaster: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "True only for the main product that owns variants",
      },
      variantOptions: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'e.g., { color: "Red", finish: "Matte", size: "60x60" }',
      },
      variantKey: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Human readable: 'Red Matte', 'Blue Glossy'",
      },
      skuSuffix: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      discountType: {
        type: DataTypes.ENUM("percent", "fixed"),
        allowNull: true,
      },
      alert_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tax: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: DataTypes.ENUM(
          "active",
          "inactive",
          "expired",
          "out_of_stock",
          "bulk_stocked"
        ),
        allowNull: false,
        defaultValue: "active",
      },
      brandId: { type: DataTypes.UUID, allowNull: true },
      categoryId: { type: DataTypes.UUID, allowNull: true },
      vendorId: { type: DataTypes.UUID, allowNull: true },
      brand_parentcategoriesId: { type: DataTypes.UUID, allowNull: true },
      meta: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "products",
      timestamps: true,
      indexes: [
        { fields: ["masterProductId"] },
        { fields: ["isMaster"] },
        { fields: ["variantKey"] },
        { fields: ["product_code"] },
      ],
    }
  );

  // -------------------------------
  // Associations
  // -------------------------------
  Product.associate = (models) => {
    // Product → Brand / Category / Vendor / BrandParentCategory / ProductMeta
    Product.belongsTo(models.Brand, { foreignKey: "brandId", as: "brand" });
    Product.belongsTo(models.Category, {
      foreignKey: "categoryId",
      as: "categories",
    });
    Product.belongsTo(models.Vendor, { foreignKey: "vendorId", as: "vendors" });
    Product.belongsTo(models.BrandParentCategory, {
      foreignKey: "brand_parentcategoriesId",
      as: "brand_parentcategories",
    });
    Product.belongsTo(models.ProductMeta, {
      foreignKey: "meta",
      as: "product_metas",
      constraints: false,
    });

    // Product ↔ Keyword (M:N)
    Product.belongsToMany(models.Keyword, {
      through: models.ProductKeyword,
      foreignKey: "productId",
      otherKey: "keywordId",
      as: "keywords",
    });

    // Product → ProductKeyword (1:M) for raw join table access
    Product.hasMany(models.ProductKeyword, {
      foreignKey: "productId",
      as: "product_keywords",
    });
  };

  // Optional utility
  Product.determineProductGroup = async function (name) {
    const Keyword = require("./keyword");
    const keywords = await Keyword.findAll();

    const ceramics = keywords.filter(
      (k) =>
        k.type === "Ceramics" &&
        name.toLowerCase().includes(k.keyword.toLowerCase())
    ).length;

    const sanitary = keywords.filter(
      (k) =>
        k.type === "Sanitary" &&
        name.toLowerCase().includes(k.keyword.toLowerCase())
    ).length;

    if (ceramics > 0 && sanitary === 0) return "Ceramics";
    if (sanitary > 0 && ceramics === 0) return "Sanitary";
    if (ceramics > 0 && sanitary > 0)
      return ceramics >= sanitary ? "Ceramics" : "Sanitary";
    return "Uncategorized";
  };

  return Product;
};
