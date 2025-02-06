require("dotenv").config();
const sequelize = require("../config/database"); //
const User = require("../models/user");
const Product = require("../models/product");
const Admin = require("../models/admin");
const Lead = require("../models/lead");
const RFQ = require("../models/rfq");
const Permission = require("../models/permission");
const Session = require("../models/session");
const Role = require("../models/Role");
const setupDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("\x1b[32m%s\x1b[0m", "✓ MySQL Connected!");

    // Set up associations
    // admin relationships
    Admin.belongsTo(User, { foreignKey: "userId" }); // Reference to User model
    Admin.belongsToMany(Permission, {
      as: "Permissions",
      foreignKey: "admin_id",
    }); // Many-to-Many relationship with Permission model
    // Define the relationship between Lead and User (One-to-Many)
    Lead.belongsTo(User, { foreignKey: "user_id" });
    User.hasMany(Lead, { foreignKey: "user_id" });
    // Define relationships
    Permission.belongsTo(Role, { foreignKey: "role_id" }); // Reference to Role model
    // Define the relationship between Product and User (One-to-Many)
    Product.belongsTo(User, { foreignKey: "user_id" });
    User.hasMany(Product, { foreignKey: "user_id" });
    // RFQ belongs to Lead (One-to-One relationship)
    RFQ.belongsTo(Lead, { foreignKey: "lead_id" });
    // RFQ belongs to Buyer (One-to-One relationship)
    RFQ.belongsTo(User, { foreignKey: "buyers_details", as: "buyer" });
    // RFQ belongs to Manufacturer (One-to-One relationship)
    RFQ.belongsTo(User, { foreignKey: "manufacturer_id", as: "manufacturer" });
    // Establish relationships
    User.belongsTo(Role, { foreignKey: "role_id", as: "Role" });
    Role.hasMany(User, { foreignKey: "role_id", as: "Users" });

    Session.belongsTo(User, { foreignKey: "userId" });
    User.belongsTo(Role, { foreignKey: "role_id" }); // Establish foreign key relationship
    // AccessLog relationships
    AccessLog.belongsTo(User, { foreignKey: "user_id" });
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
