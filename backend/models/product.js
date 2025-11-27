// models/product.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Category = require("./category");
const { v4: uuidv4 } = require("uuid");
const Brand = require("./brand");
const Keyword = require("./keyword");
const BrandParentCategory = require("./brandParentCategory");
const Vendor = require("./vendor");

const Product = sequelize.define(
  "Product",
  {
    productId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    name: { type: DataTypes.STRING, allowNull: false },
    product_code: { type: DataTypes.STRING, allowNull: false, unique: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // ──────────────────────── VARIANT FIELDS (NEW) ────────────────────────
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
      comment: "e.g., { color: 'Red', finish: 'Matte', size: '60x60' }",
    },
    variantKey: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Human readable: 'Red Matte', 'Blue Glossy'",
    },
    skuSuffix: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "e.g., '-RED', '-BLUE-MATTE' → helps build unique code",
    },
    // ─────────────────────────────────────────────────────────────────────

    discountType: { type: DataTypes.ENUM("percent", "fixed"), allowNull: true },
    alert_quantity: { type: DataTypes.INTEGER, allowNull: true },
    tax: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    images: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },

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

    // Foreign Keys
    brandId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: Brand, key: "id" },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: Category, key: "categoryId" },
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: Vendor, key: "id" },
    },
    brand_parentcategoriesId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: BrandParentCategory, key: "id" },
    },

    // Flexible specs (kept as-is — this is your Option 2)
    meta: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Key: ProductMeta.id → Value: any",
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

async function determineProductGroup(name) {
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
}

module.exports = Product;
