const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const Permission = sequelize.define("Permission", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: uuidv4,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true, // Example: "create_order", "delete_user"
  },
  methods: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      // Default permissions can be empty or specific
      POST: false,
      GET: false,
      PUT: false,
      DELETE: false,
    },
  },
});

module.exports = Permission;
