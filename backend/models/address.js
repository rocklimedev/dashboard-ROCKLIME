const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./users");
const Customer = require("./customers");
const { v4: uuidv4 } = require("uuid");

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
      references: {
        model: "users",
        key: "userId",
      },
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "customers",
        key: "customerId",
      },
    },
  },
  {
    tableName: "addresses",
    timestamps: true,
  }
);

// Relationships
Address.belongsTo(User, {
  foreignKey: "userId",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Address.belongsTo(Customer, {
  foreignKey: "customerId",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

module.exports = Address;
