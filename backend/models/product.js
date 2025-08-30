const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Category = require("./category");
const { v4: uuidv4 } = require("uuid");
const Brand = require("./brand");
const Keyword = require("./keyword"); // Import Keyword Model
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
    productType: {
      type: DataTypes.ENUM("tiles", "sanitary"),
      allowNull: false,
    },

    // Optional Foreign Keys
    brandId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Brand,
        key: "id",
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Category,
        key: "categoryId",
      },
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Vendor,
        key: "id",
      },
    },
    brand_parentcategoriesId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: BrandParentCategory,
        key: "id",
      },
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: true,
      comment:
        "Stores key-value pairs where key is ProductMeta UUID and value is the actual value",
    },
  },
  {
    tableName: "products", // Force lowercase table name
    timestamps: true,
  }
);

// Assign productGroup dynamically before saving
Product.beforeCreate(async (product) => {
  product.productGroup = await determineProductGroup(product.name);
});

// Function to determine the product group from the database
async function determineProductGroup(name) {
  const keywords = await Keyword.findAll(); // Fetch all keywords from DB

  let ceramicsMatches = keywords.filter(
    (k) =>
      k.type === "Ceramics" &&
      name.toLowerCase().includes(k.keyword.toLowerCase())
  ).length;
  let sanitaryMatches = keywords.filter(
    (k) =>
      k.type === "Sanitary" &&
      name.toLowerCase().includes(k.keyword.toLowerCase())
  ).length;

  if (ceramicsMatches > 0 && sanitaryMatches === 0) {
    return "Ceramics";
  } else if (sanitaryMatches > 0 && ceramicsMatches === 0) {
    return "Sanitary";
  } else if (ceramicsMatches > 0 && sanitaryMatches > 0) {
    return ceramicsMatches >= sanitaryMatches ? "Ceramics" : "Sanitary";
  }

  return "Uncategorized"; // Default category if no match is found
}

// Relationship with Category

module.exports = Product;
