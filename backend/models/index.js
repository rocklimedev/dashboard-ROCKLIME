require("dotenv").config();
const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

// -------------------------------
// 1️⃣ Import all Sequelize models
// -------------------------------
const User = require("./users")(sequelize, DataTypes);
const Role = require("./roles")(sequelize, DataTypes);
const Permission = require("./permission")(sequelize, DataTypes);
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
  DataTypes,
);
const BrandParentCategoryBrand = require("./brandParentCategoryBrand")(
  sequelize,
  DataTypes,
);
const Job = require("./job")(sequelize, DataTypes);
const FieldGuidedSheet = require("./fgs")(sequelize, DataTypes);
const InventoryHistory = require("./history")(sequelize, DataTypes);
const Customer = require("./customers")(sequelize, DataTypes);
const Quotation = require("./quotation")(sequelize, DataTypes);
const Order = require("./orders")(sequelize, DataTypes);
const PurchaseOrder = require("./purchaseorder")(sequelize, DataTypes);
// -------------------------------
// 2️⃣ Run associations if defined
// -------------------------------
[
  User,
  Role,
  Permission,
  FieldGuidedSheet,
  RolePermission,
  Address,
  Team,
  TeamMember,
  ProductKeyword,
  Product,
  ProductMeta,
  Category,
  ParentCategory,
  Job,
  Brand,
  Vendor,
  Keyword,
  BrandParentCategory,
  BrandParentCategoryBrand,
  Customer,
  Quotation,
  Order,
  PurchaseOrder,
  InventoryHistory,
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
      FieldGuidedSheet,
      ProductKeyword,
      Product,
      Job,
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
      Order,
      PurchaseOrder,
      InventoryHistory,
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
  FieldGuidedSheet,
  Team,
  Job,
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
  Order,
  PurchaseOrder,
  InventoryHistory,
};
