const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./users");
const { v4: uuidv4 } = require("uuid");

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
      type: DataTypes.STRING(255), // Store the URL from the external server
      allowNull: false,
    },
    mark_as_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    tableName: "signatures",
    timestamps: true,
  }
);

Signature.belongsTo(User, { foreignKey: "userId" });

module.exports = Signature;
