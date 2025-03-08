const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Team = sequelize.define("Team", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },

  adminId: {
    type: DataTypes.UUID, // Admin's user ID
    allowNull: false,
  },

  adminName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Team;
