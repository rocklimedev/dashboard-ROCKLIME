const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Sequelize instance

const Customer = sequelize.define(
  "Customer",
  {
    customerId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    name: { type: DataTypes.STRING(100), allowNull: false },

    // Make email nullable and remove unique constraint if duplicates allowed
    email: { type: DataTypes.STRING(100), allowNull: true, unique: false },

    mobileNumber: { type: DataTypes.STRING(20), allowNull: false },
    phone2: { type: DataTypes.STRING(20), allowNull: true },

    companyName: { type: DataTypes.STRING(150), allowNull: true },

    customerType: {
      type: DataTypes.ENUM(
        "Retail",
        "Architect",
        "Interior",
        "Builder",
        "Contractor"
      ),
      allowNull: true,
    },

    address: { type: DataTypes.JSON, allowNull: true },

    isVendor: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendorId: { type: DataTypes.UUID, allowNull: true },

    gstNumber: { type: DataTypes.STRING(20), allowNull: true },
  },
  {
    tableName: "customers",
    timestamps: true,
  }
);

module.exports = Customer;
