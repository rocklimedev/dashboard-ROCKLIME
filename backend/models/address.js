const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Address = sequelize.define(
  "Address",
  {
    addressId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("BILLING", "PRIMARY", "ADDITIONAL"),
      allowNull: false,
      defaultValue: "ADDITIONAL",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "addresses",
    timestamps: true,
  }
);

module.exports = Address;
