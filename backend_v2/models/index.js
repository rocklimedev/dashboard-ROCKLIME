require("dotenv").config();
const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

// -------------------------------
// 1️⃣ Import all Sequelize models
// -------------------------------
const User = require("./users")(sequelize, DataTypes);
const Role = require("./roles")(sequelize, DataTypes);
const Permission = require("./permisson")(sequelize, DataTypes);
const RolePermission = require("./rolePermission")(sequelize, DataTypes);

const Address = require("./address")(sequelize, DataTypes);
const Team = require("./team")(sequelize, DataTypes);
const TeamMember = require("./teamMember")(sequelize, DataTypes);
const ProductKeyword = require("./productKeywords")(sequelize, DataTypes);
const Product = require("./product")(sequelize, DataTypes);
const ProductMeta = require("./productMeta")(sequelize, DataTypes);
const Category = require("./category")(sequelize, DataTypes);
const ParentCategory = require("./parentCategory")(sequelize, DataTypes);
const Brand = require("./brand")(sequelize, DataTypes);
const Vendor = require("./vendor")(sequelize, DataTypes);
const Keyword = require("./keyword")(sequelize, DataTypes);

const BrandParentCategory = require("./brandParentCategory")(
  sequelize,
  DataTypes
);
const BrandParentCategoryBrand = require("./brandParentCategoryBrand")(
  sequelize,
  DataTypes
);

const Customer = require("./customers")(sequelize, DataTypes);
const Quotation = require("./quotation")(sequelize, DataTypes);
const Invoice = require("./invoice")(sequelize, DataTypes);
const Order = require("./orders")(sequelize, DataTypes);
const Signature = require("./signature")(sequelize, DataTypes);
const Cart = require("./carts")(sequelize, DataTypes);

// -------------------------------
// 2️⃣ Run associations if defined
// -------------------------------
[
  User,
  Role,
  Permission,
  RolePermission,
  Address,
  Team,
  TeamMember,
  ProductKeyword,
  Product,
  ProductMeta,
  Category,
  ParentCategory,
  Brand,
  Vendor,
  Keyword,
  BrandParentCategory,
  BrandParentCategoryBrand,
  Customer,
  Quotation,
  Invoice,
  Order,
  Signature,
  Cart,
].forEach((model) => {
  if (typeof model.associate === "function") {
    model.associate({
      User,
      Role,
      Permission,
      RolePermission,
      Address,
      Team,
      TeamMember,
      ProductKeyword,
      Product,
      ProductMeta,
      Category,
      ParentCategory,
      Brand,
      Vendor,
      Keyword,
      BrandParentCategory,
      BrandParentCategoryBrand,
      Customer,
      Quotation,
      Invoice,
      Order,
      Signature,
      Cart,
    });
  }
});

// -------------------------------
// 3️⃣ Export models + sequelize
// -------------------------------
module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  Address,
  Team,
  TeamMember,
  ProductKeyword,
  Product,
  ProductMeta,
  Category,
  ParentCategory,
  Brand,
  Vendor,
  Keyword,
  BrandParentCategory,
  BrandParentCategoryBrand,
  Customer,
  Quotation,
  Invoice,
  Order,
  Signature,
  Cart,
};
