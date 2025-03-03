const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import your Sequelize instance

const Cart = sequelize.define(
  "Cart",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Auto-generate UUID
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW, // Update timestamp on changes
    },
  },
  {
    tableName: "cart", // Explicitly set table name
    timestamps: true, // Enables createdAt & updatedAt
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Cart;
