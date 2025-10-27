require("dotenv").config();
const sequelize = require("../config/database");

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
    // 🔥 USER / ROLE / PERMISSION RELATIONSHIPS
    // ======================================

    // Role ↔ Permission (M:N)
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

    // RolePermission direct associations
    RolePermission.belongsTo(Role, { foreignKey: "roleId", as: "roles" });
    RolePermission.belongsTo(Permission, {
      foreignKey: "permissionId",
      as: "permissions",
    });
    Role.hasMany(RolePermission, {
      foreignKey: "roleId",
      as: "rolepermissions",
    });
    Permission.hasMany(RolePermission, {
      foreignKey: "permissionId",
      as: "rolepermissions",
    });

    // Role ↔ User (1:M)
    Role.hasMany(User, { foreignKey: "roleId", as: "users" });
    User.belongsTo(Role, { foreignKey: "roleId", as: "role" });

    // User ↔ Address (1:M)
    Address.belongsTo(User, { foreignKey: "userId", as: "users" });
    User.hasMany(Address, { foreignKey: "userId", as: "addresses" });
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
    // 🔥 ORDER RELATIONSHIPS
    // ======================================

    // Created By
    User.hasMany(Order, { foreignKey: "createdBy", as: "createdOrders" });
    Order.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

    // Created For
    Customer.hasMany(Order, { foreignKey: "createdFor", as: "customerOrders" });
    Order.belongsTo(Customer, { foreignKey: "createdFor", as: "customer" });

    // Shipping Address
    Order.belongsTo(Address, { foreignKey: "shipTo", as: "shippingAddress" });
    Address.hasMany(Order, { foreignKey: "shipTo", as: "orders" });

    // Assigned user / team
    User.hasMany(Order, { foreignKey: "assignedUserId", as: "assignedOrders" });
    Order.belongsTo(User, { foreignKey: "assignedUserId", as: "assignedUser" });

    Team.hasMany(Order, { foreignKey: "assignedTeamId", as: "teamOrders" });
    Order.belongsTo(Team, { foreignKey: "assignedTeamId", as: "assignedTeam" });

    // Secondary user
    User.hasMany(Order, {
      foreignKey: "secondaryUserId",
      as: "secondaryOrders",
    });
    Order.belongsTo(User, {
      foreignKey: "secondaryUserId",
      as: "secondaryUser",
    });

    // Order ↔ Quotation (1:1)
    Order.belongsTo(Quotation, { foreignKey: "quotationId", as: "quotation" });
    Quotation.hasMany(Order, { foreignKey: "quotationId", as: "orders" });

    // ===============================
    // PIPELINE RELATIONSHIPS
    // ===============================

    // Previous order mapping
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

    // Master pipeline mapping
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
    // 🔥 INVOICE / QUOTATION / SIGNATURE RELATIONSHIPS
    // ======================================

    // Invoice ↔ User
    Invoice.belongsTo(User, { foreignKey: "createdBy" });

    // Quotation ↔ User
    User.hasMany(Quotation, { foreignKey: "createdBy" });
    Quotation.belongsTo(User, { foreignKey: "createdBy", as: "users" });

    // Signature ↔ User
    Signature.belongsTo(User, { foreignKey: "userId" });

    // Customer ↔ Quotation (1:M)
    Customer.hasMany(Quotation, {
      foreignKey: "customerId",
      as: "customerQuotations",
    });
    Quotation.belongsTo(Customer, {
      foreignKey: "customerId",
      as: "customers",
    });

    // Customer ↔ Invoice (1:M)
    Customer.hasMany(Invoice, {
      foreignKey: "customerId",
      onDelete: "CASCADE",
    });
    Invoice.belongsTo(Customer, { foreignKey: "customerId" });

    // Invoice ↔ Address / Quotation
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
    // 🔥 PRODUCT / CATEGORY / BRAND RELATIONSHIPS
    // ======================================

    // Product ↔ Brand / Category / Vendor / ProductMeta
    Product.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Product.belongsTo(Category, { foreignKey: "categoryId", as: "categories" });
    Product.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendors" });
    Product.belongsTo(BrandParentCategory, {
      foreignKey: "brand_parentcategoriesId",
      as: "brand_parentcategories",
    });
    Product.belongsTo(ProductMeta, {
      foreignKey: "meta",
      as: "product_metas",
      constraints: false,
    });

    // Vendor ↔ Brand
    Brand.hasMany(Vendor, { foreignKey: "brandId" });
    Vendor.belongsTo(Brand, { foreignKey: "brandId" });

    // Brand ↔ ParentCategory (M:N)
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

    // BrandParentCategory ↔ Brand (M:N)
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

    // BrandParentCategory ↔ ParentCategory (1:M)
    BrandParentCategory.hasMany(ParentCategory, {
      foreignKey: "brandParentCategoryId",
      as: "parentCategories",
    });
    ParentCategory.belongsTo(BrandParentCategory, {
      foreignKey: "brandParentCategoryId",
      as: "brandParentCategory",
    });

    // Category ↔ Brand / ParentCategory
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

    // Keyword ↔ Category (1:M)
    Keyword.belongsTo(Category, { foreignKey: "categoryId", as: "categories" });
    Category.hasMany(Keyword, { foreignKey: "categoryId" });

    // Customer ↔ Vendor
    Customer.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendors" });

    // ======================================
    // 🔥 SYNC DATABASE
    // ======================================

    await sequelize.sync({ alter: true });
    console.log("\x1b[32m%s\x1b[0m", "✓ Database tables synced!");
  } catch (error) {
    console.log(
      "\x1b[31m%s\x1b[0m",
      "✗ Unable to connect to the database:",
      error
    );
  }
};

module.exports = setupDB;
