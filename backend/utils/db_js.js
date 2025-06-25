require("dotenv").config();
const sequelize = require("../config/database");
const User = require("../models/users");
const Product = require("../models/product");
const Permission = require("../models/permisson"); // Fixed typo
const Role = require("../models/roles");
const RolePermission = require("../models/rolePermission"); // Junction Table
const Cart = require("../models/carts");
const Address = require("../models/address");
const Category = require("../models/category");
const Invoice = require("../models/invoice");
const Order = require("../models/orders");
const Quotation = require("../models/quotation");
const Signature = require("../models/signature");
const Vendor = require("../models/vendor");
const Brand = require("../models/brand");
const Customer = require("../models/customers");
const Team = require("../models/team");
const Keyword = require("../models/keyword");
const TeamMember = require("../models/teamMember");
const ParentCategory = require("../models/parentCategory");
const BrandParentCategory = require("../models/brandParentCategory");

const setupDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("\x1b[32m%s\x1b[0m", "✓ MySQL Connected!");

    // ==============================
    // 🔥 USER RELATIONSHIPS
    // ==============================

    Address.belongsTo(User, { foreignKey: "userId", as: "users" });
    User.hasMany(Address, { foreignKey: "userId", as: "addresses" });

    // ==============================
    // 🔥 ROLE & PERMISSION SETUP
    // ==============================

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

    Role.hasMany(User, { foreignKey: "roleId", as: "users" });
    User.belongsTo(Role, { foreignKey: "roleId", as: "role" });

    // ==============================
    // 🔥 USER RELATIONSHIPS
    // ==============================

    User.hasMany(Product, { foreignKey: "user_id" });
    Product.belongsTo(User, { foreignKey: "user_id" });

    // User ↔ Invoice
    Invoice.belongsTo(User, { foreignKey: "createdBy" });

    // User ↔ Quotation
    User.hasMany(Quotation, { foreignKey: "createdBy" });
    Quotation.belongsTo(User, { foreignKey: "createdBy", as: "users" });

    // User ↔ Signature
    Signature.belongsTo(User, { foreignKey: "userId" });

    // ==============================
    // 🔥 PRODUCT RELATIONSHIPS
    // ==============================

    Product.belongsTo(Category, { foreignKey: "categoryId" });

    // ==============================
    // 🔥 CUSTOMER RELATIONSHIPS
    // ==============================

    Customer.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendors" });

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

    Invoice.hasOne(Order, { foreignKey: "invoiceId", onDelete: "CASCADE" });
    Order.belongsTo(Invoice, { foreignKey: "invoiceId" });

    Invoice.belongsTo(Quotation, {
      foreignKey: "quotationId",
      allowNull: true,
    });
    Quotation.hasOne(Invoice, { foreignKey: "quotationId" });

    // ==============================
    // 🔥 BRAND & VENDOR RELATIONSHIPS
    // ==============================

    // Remove duplicate Vendor-Brand associations
    Brand.hasMany(Vendor, { foreignKey: "brandId" });
    Vendor.belongsTo(Brand, { foreignKey: "brandId" });

    // Remove the brandSlug-based associations as they are redundant
    // Brand.hasMany(Vendor, { foreignKey: "brandSlug", sourceKey: "brandSlug" });
    // Vendor.belongsTo(Brand, { foreignKey: "brandSlug", targetKey: "brandSlug" });

    // Brand ↔ ParentCategory (Many-to-Many)
    Brand.belongsToMany(ParentCategory, {
      through: BrandParentCategory,
      foreignKey: "brandId",
      otherKey: "parentCategoryId",
      as: "parentCategories",
    });
    ParentCategory.belongsToMany(Brand, {
      through: BrandParentCategory,
      foreignKey: "parentCategoryId",
      otherKey: "brandId",
      as: "brands",
    });

    // Category relationships
    Category.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Category.belongsTo(ParentCategory, {
      foreignKey: "parentCategoryId",
      as: "parentCategories",
    });
    Brand.hasMany(Category, { foreignKey: "brandId", as: "categories" });
    ParentCategory.hasMany(Category, {
      foreignKey: "parentCategoryId",
      as: "categories",
    });

    // Team ↔ Order
    Team.hasMany(Order, { foreign某种: "assignedTo" });
    Order.belongsTo(Team, { foreignKey: "assignedTo" });

    // Keyword ↔ Category
    Keyword.belongsTo(Category, { foreignKey: "categoryId", as: "categories" });
    Category.hasMany(Keyword, { foreignKey: "categoryId" });

    // ==============================
    // 🔥 SYNC DATABASE
    // ==============================

    await sequelize.sync({ alter: true });
    console.log("\x1b[32m%s\x1b[0m", "✓ Database tables synced!");
  } catch (error) {
    console.log(
      "\x1b[31m%s\x1b[0m",
      "✗ Unable to connect to the the database:",
      error
    );
  }
};

module.exports = setupDB;
