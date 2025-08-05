const Product = sequelize.define("Product", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: uuidv4,
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
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  productType: {
    type: DataTypes.ENUM("tiles", "sanitary"),
    allowNull: false,
  },

  // Optional Foreign Keys
  brandId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "Brands",
      key: "id",
    },
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "Categories",
      key: "id",
    },
  },
  vendorId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "Vendors",
      key: "id",
    },
  },
  brand_parentcategoriesId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "brand_parentcategories",
      key: "id",
    },
  },
  meta: {
    type: DataTypes.JSON,
    allowNull: true,
    comment:
      "Stores key-value pairs where key is ProductMeta UUID and value is the actual value",
  },
});

Product.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Product.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" });
Product.belongsTo(BrandParentCategory, {
  foreignKey: "brand_parentcategoriesId",
  as: "brand_parentcategories",
});
// models/ProductMeta.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // adjust path as needed

const ProductMeta = sequelize.define(
  "ProductMeta",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Label for the metadata field (e.g., Selling Price, MRP)",
    },
    fieldType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Type of data (e.g., string, number, mm, inch, pcs, box, feet)",
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Optional unit of measurement (e.g., inch, mm, pcs)",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "product_metas",
    timestamps: false,
  }
);

module.exports = ProductMeta;
