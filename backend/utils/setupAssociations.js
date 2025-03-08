const User = require("../models/users");
const Product = require("../models/product");
const Permission = require("../models/permisson");
const Cart = require("../models/carts");
const Address = require("../models/address");
const Category = require("../models/category");
const Invoice = require("../models/invoice");
const Order = require("../models/orders");
const Quotation = require("../models/quotation");
const RolePermission = require("../models/rolePermission");
const Signature = require("../models/signature");
const Vendor = require("../models/vendor");
const Brand = require("../models/brand");
const Customer = require("../models/customers");

const setupAssociations = () => {
  Permission.belongsTo(RolePermission, { foreignKey: "role_id" });

  Product.belongsTo(User, { foreignKey: "user_id" });
  User.hasMany(Product, { foreignKey: "user_id" });

  User.belongsTo(RolePermission, { foreignKey: "role_id", as: "Role" });
  RolePermission.hasMany(User, { foreignKey: "role_id", as: "Users" });

  Brand.hasMany(Vendor, { foreignKey: "brandId" });
  Vendor.belongsTo(Brand, { foreignKey: "brandId" });

  Customer.hasMany(Quotation, { foreignKey: "customerId" });
  Customer.hasMany(Invoice, { foreignKey: "customerId" });
  Customer.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" });

  Brand.hasMany(Vendor, { foreignKey: "brandSlug", sourceKey: "brandSlug" });
  Vendor.belongsTo(Brand, { foreignKey: "brandSlug", targetKey: "brandSlug" });

  Address.belongsTo(User, { foreignKey: "userId" });

  Product.belongsTo(Category, { foreignKey: "categoryId" });

  Invoice.belongsTo(User, { foreignKey: "client" });
  Invoice.belongsTo(Address, { foreignKey: "shipTo" });
  Invoice.belongsTo(Order, { foreignKey: "orderId" });

  Order.belongsTo(Quotation, { foreignKey: "quotationId" });
  Quotation.belongsTo(User, { foreignKey: "customerId" });

  RolePermission.belongsTo(User, { foreignKey: "userId" });
  RolePermission.belongsToMany(Permission, { through: "RolePermissions" });
  Permission.belongsToMany(RolePermission, { through: "RolePermissions" });

  Signature.belongsTo(User, { foreignKey: "userId" });

  User.hasMany(Cart, { foreignKey: "user_id" });
  Cart.belongsTo(User, { foreignKey: "user_id" });
};

module.exports = setupAssociations;
