const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Category = require("./category");
const { v4: uuidv4 } = require("uuid");
const Brand = require("./brand");
const Keyword = require("./keyword"); // Import Keyword Model

const Product = sequelize.define("Product", {
  productId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: uuidv4,
  },
  itemType: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  productGroup: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  purchasingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  discountType: {
    type: DataTypes.ENUM("percent", "fixed"),
  },
  barcode: {
    type: DataTypes.STRING(100),
    unique: true,
  },
  alert_quantity: {
    type: DataTypes.INTEGER,
  },
  tax: {
    type: DataTypes.DECIMAL(5, 2),
  },
  description: {
    type: DataTypes.TEXT,
  },
  images: {
    type: DataTypes.JSON,
  },
  brandId: {
    type: DataTypes.UUID(25),
    references: {
      model: Brand,
      key: "id",
    },
  },
  categoryId: {
    type: DataTypes.UUID,
    model: Category,
    key: "id",
  },
});

// Assign productGroup dynamically before saving
Product.beforeCreate(async (product) => {
  product.productGroup = await determineProductGroup(product.name);
});

// Function to determine the product group from database
async function determineProductGroup(name) {
  const keywords = await Keyword.findAll(); // Fetch all keywords from DB

  let ceramicsMatches = keywords.filter(k => k.type === "Ceramics" && name.toLowerCase().includes(k.keyword.toLowerCase())).length;
  let sanitaryMatches = keywords.filter(k => k.type === "Sanitary" && name.toLowerCase().includes(k.keyword.toLowerCase())).length;

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
Product.belongsTo(Category, { foreignKey: "categoryId" });

module.exports = Product;
