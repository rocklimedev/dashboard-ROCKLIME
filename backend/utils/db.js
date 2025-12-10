// setupDB.js
require("dotenv").config();
const sequelize = require("../config/database");

// Import all models
const User = require("../models/users");
const Role = require("../models/roles");
const Permission = require("../models/permisson");
const RolePermission = require("../models/rolePermission");

const Address = require("../models/address");
const Team = require("../models/team");
const TeamMember = require("../models/teamMember");

const Product = require("../models/product");
const ProductMeta = require("../models/productMeta");
const Category = require("../models/category");
const ParentCategory = require("../models/parentCategory");
const Brand = require("../models/brand");
const Vendor = require("../models/vendor");
const Keyword = require("../models/keyword");

const BrandParentCategory = require("../models/brandParentCategory");
const BrandParentCategoryBrand = require("../models/brandParentCategoryBrand");

const Customer = require("../models/customers");
const Quotation = require("../models/quotation");
const Invoice = require("../models/invoice");
const Order = require("../models/orders");
const Signature = require("../models/signature");
const Cart = require("../models/carts");

const setupDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("\x1b[32m%s\x1b[0m", "✓ MySQL Connected!");

    // ======================================
    // USER / ROLE / PERMISSION
    // ======================================

    Role.belongsToMany(Permission, {
      through: RolePermission,
      foreignKey: "roleId",
      otherKey: "permissionId",
      as: "permissions",
    });
    Permission.belongsToMany(Role, {
      through: RolePermission,
      foreignKey: "permissionId",
      otherKey: "roleId",
      as: "roles",
    });

    Role.hasMany(User, { foreignKey: "roleId", as: "users" });
    User.belongsTo(Role, { foreignKey: "roleId", as: "role" });

    User.hasOne(Address, {
      foreignKey: "userId",
      as: "address",
      onDelete: "SET NULL",
      constraints: false,
    });
    Address.belongsTo(User, { foreignKey: "userId", as: "user" });

    User.belongsToMany(Team, {
      through: TeamMember,
      foreignKey: "userId",
      otherKey: "teamId",
      as: "teams",
    });
    Team.belongsToMany(User, {
      through: TeamMember,
      foreignKey: "teamId",
      otherKey: "userId",
      as: "members",
    });

    // ======================================
    // ORDER RELATIONSHIPS
    // ======================================

    User.hasMany(Order, { foreignKey: "createdBy", as: "createdOrders" });
    Order.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

    Customer.hasMany(Order, { foreignKey: "createdFor", as: "customerOrders" });
    Order.belongsTo(Customer, { foreignKey: "createdFor", as: "customer" });

    Customer.hasMany(Address, { foreignKey: "customerId", as: "addresses" });
    Address.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });

    Order.belongsTo(Address, { foreignKey: "shipTo", as: "shippingAddress" });
    Address.hasMany(Order, { foreignKey: "shipTo", as: "orders" });

    User.hasMany(Order, { foreignKey: "assignedUserId", as: "assignedOrders" });
    Order.belongsTo(User, { foreignKey: "assignedUserId", as: "assignedUser" });

    Team.hasMany(Order, { foreignKey: "assignedTeamId", as: "teamOrders" });
    Order.belongsTo(Team, { foreignKey: "assignedTeamId", as: "assignedTeam" });

    User.hasMany(Order, {
      foreignKey: "secondaryUserId",
      as: "secondaryOrders",
    });
    Order.belongsTo(User, {
      foreignKey: "secondaryUserId",
      as: "secondaryUser",
    });

    Order.belongsTo(Quotation, { foreignKey: "quotationId", as: "quotation" });
    Quotation.hasMany(Order, { foreignKey: "quotationId", as: "orders" });

    // Pipeline
    Order.hasMany(Order, {
      foreignKey: "previousOrderNo",
      sourceKey: "orderNo",
      as: "nextOrders",
    });
    Order.belongsTo(Order, {
      foreignKey: "previousOrderNo",
      targetKey: "orderNo",
      as: "previousOrder",
    });
    Order.hasMany(Order, {
      foreignKey: "masterPipelineNo",
      sourceKey: "orderNo",
      as: "pipelineOrders",
    });
    Order.belongsTo(Order, {
      foreignKey: "masterPipelineNo",
      targetKey: "orderNo",
      as: "masterOrder",
    });

    // ======================================
    // INVOICE / QUOTATION / SIGNATURE
    // ======================================

    Invoice.belongsTo(User, { foreignKey: "createdBy" });
    User.hasMany(Quotation, { foreignKey: "createdBy" });
    Quotation.belongsTo(User, { foreignKey: "createdBy", as: "users" });
    Signature.belongsTo(User, { foreignKey: "userId" });

    Customer.hasMany(Quotation, {
      foreignKey: "customerId",
      as: "customerQuotations",
    });
    Quotation.belongsTo(Customer, {
      foreignKey: "customerId",
      as: "customers",
    });

    Customer.hasMany(Invoice, {
      foreignKey: "customerId",
      onDelete: "CASCADE",
    });
    Invoice.belongsTo(Customer, { foreignKey: "customerId" });

    Invoice.belongsTo(Address, { foreignKey: "shipTo" });
    Invoice.belongsTo(Quotation, {
      foreignKey: "quotationId",
      allowNull: true,
    });
    Quotation.hasOne(Invoice, { foreignKey: "quotationId" });
    Quotation.belongsTo(Address, {
      foreignKey: "shipTo",
      as: "shippingAddress",
    });

    // ======================================
    // PRODUCT / CATEGORY / BRAND
    // ======================================

    Product.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Product.belongsTo(Category, { foreignKey: "categoryId", as: "categories" });
    Product.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendors" });
    Product.belongsTo(BrandParentCategory, {
      foreignKey: "brand_parentcategoriesId",
      as: "brand_parentcategories",
    });

    Brand.hasMany(Vendor, { foreignKey: "brandId" });
    Vendor.belongsTo(Brand, { foreignKey: "brandId" });

    Brand.belongsToMany(ParentCategory, {
      through: BrandParentCategory,
      foreignKey: "brandId",
      otherKey: "parentCategoryId",
      as: "parentcategories",
    });
    ParentCategory.belongsToMany(Brand, {
      through: BrandParentCategory,
      foreignKey: "parentCategoryId",
      otherKey: "brandId",
      as: "brands",
    });

    BrandParentCategory.belongsToMany(Brand, {
      through: BrandParentCategoryBrand,
      foreignKey: "brandParentCategoryId",
      otherKey: "brandId",
      as: "brands",
    });
    Brand.belongsToMany(BrandParentCategory, {
      through: BrandParentCategoryBrand,
      foreignKey: "brandId",
      otherKey: "brandParentCategoryId",
      as: "brandParentCategories",
    });

    BrandParentCategory.hasMany(ParentCategory, {
      foreignKey: "brandParentCategoryId",
      as: "parentCategories",
    });
    ParentCategory.belongsTo(BrandParentCategory, {
      foreignKey: "brandParentCategoryId",
      as: "brandParentCategory",
    });

    Category.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Category.belongsTo(ParentCategory, {
      foreignKey: "parentCategoryId",
      as: "parentcategories",
    });
    Brand.hasMany(Category, { foreignKey: "brandId", as: "categories" });
    ParentCategory.hasMany(Category, {
      foreignKey: "parentCategoryId",
      as: "categories",
    });

    Keyword.belongsTo(Category, { foreignKey: "categoryId", as: "categories" });
    Category.hasMany(Keyword, { foreignKey: "categoryId" });

    Customer.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendors" });

    // ======================================
    // PRODUCT ↔ KEYWORD (Many-to-Many) — CLEAN & FINAL
    // ======================================

    Product.belongsToMany(Keyword, {
      through: "products_keywords", // ← table name (no model needed)
      foreignKey: "productId",
      otherKey: "keywordId",
      as: "keywords", // ← use this everywhere
      timestamps: true,
    });

    Keyword.belongsToMany(Product, {
      through: "products_keywords",
      foreignKey: "keywordId",
      otherKey: "productId",
      as: "products",
    });

    // That's it! No ProductKeyword model, no hasMany, no belongsTo on join table
    // Sequelize handles everything automatically

    console.log("\x1b[32m%s\x1b[0m", "✓ Associations set up successfully!");
    console.log(
      "\x1b[32m%s\x1b[0m",
      "✓ Ready! You can now use product.setKeywords([...])"
    );
  } catch (error) {
    console.log(
      "\x1b[31m%s\x1b[0m",
      "✗ Unable to connect or set associations:",
      error
    );
  }
};

module.exports = setupDB;
