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

const setupDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("\x1b[32m%s\x1b[0m", "✓ MySQL Connected!");

    // ==============================
    // 🔥 ROLE & PERMISSION SETUP
    // ==============================

    // Many-to-Many: Roles & Permissions (via RolePermission)

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

    // Ensure RolePermission tracks its direct role and permission
    RolePermission.belongsTo(Role, { foreignKey: "roleId" });
    RolePermission.belongsTo(Permission, { foreignKey: "permissionId" });

    // Optional: If needed for direct queries from Role or Permission
    Role.hasMany(RolePermission, { foreignKey: "roleId" });
    Permission.hasMany(RolePermission, { foreignKey: "permissionId" });

    // One-to-Many: Role to User
    Role.hasMany(User, { foreignKey: "roleId", as: "users" });
    User.belongsTo(Role, { foreignKey: "roleId", as: "role" });

    // ==============================
    // 🔥 USER RELATIONSHIPS
    // ==============================

    // User ↔ Address
    User.hasMany(Address, { foreignKey: "userId" });
    Address.belongsTo(User, { foreignKey: "userId" });

    // User ↔ Product
    User.hasMany(Product, { foreignKey: "user_id" });
    Product.belongsTo(User, { foreignKey: "user_id" });

    // User ↔ Cart
    // User.hasMany(Cart, { foreignKey: "user_id" });
    // Cart.belongsTo(User, { foreignKey: "user_id" });

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

    // Customer ↔ Vendor
    Customer.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendors" });

    // Customer ↔ Quotation (One-to-Many)
    Customer.hasMany(Quotation, {
      foreignKey: "customerId",
      as: "customerQuotations",
    });
    Quotation.belongsTo(Customer, {
      foreignKey: "customerId",
      as: "customers",
    });

    // Customer ↔ Invoice
    Customer.hasMany(Invoice, {
      foreignKey: "customerId",
      onDelete: "CASCADE",
    });
    Invoice.belongsTo(Customer, { foreignKey: "customerId" });

    // Address ↔ Invoice
    Invoice.belongsTo(Address, { foreignKey: "shipTo" });

    // Order ↔ Invoice & Quotation Relationships
    Order.belongsTo(Quotation, { foreignKey: "quotationId" });
    Invoice.belongsTo(Order, { foreignKey: "orderId", onDelete: "CASCADE" });
    Order.hasMany(Invoice, { foreignKey: "orderId" });

    // ==============================
    // 🔥 BRAND & VENDOR RELATIONSHIPS
    // ==============================

    Brand.hasMany(Vendor, { foreignKey: "brandId" });
    Vendor.belongsTo(Brand, { foreignKey: "brandId" });

    // Brand ↔ Vendor (Using Slug)
    Brand.hasMany(Vendor, { foreignKey: "brandSlug", sourceKey: "brandSlug" });
    Vendor.belongsTo(Brand, {
      foreignKey: "brandSlug",
      targetKey: "brandSlug",
    });

    // ==============================
    // 🔥 SYNC DATABASE
    // ==============================

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
