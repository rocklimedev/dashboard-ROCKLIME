const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");

// Import related models
const User = require("./users");
const Customer = require("./customers");
const Vendor = require("./vendor");

const Signature = sequelize.define(
  "Signature",
  {
    signatureId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuidv4,
    },
    signature_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    signature_image: {
      type: DataTypes.STRING(255), // URL to stored signature
      allowNull: false,
    },
    mark_as_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: "userId",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Customer,
        key: "customerId",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Vendor,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "signatures",
    timestamps: true,
  }
);

// Associations
Signature.belongsTo(User, {
  foreignKey: "userId",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Signature.belongsTo(Customer, {
  foreignKey: "customerId",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Signature.belongsTo(Vendor, {
  foreignKey: "vendorId",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

module.exports = Signature;
