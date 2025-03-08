const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Team = require("./team");

const TeamMember = sequelize.define("TeamMember", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },

  teamId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Team,
      key: "id",
    },
  },

  userId: {
    type: DataTypes.UUID, // User ID
    allowNull: false,
  },

  userName: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  roleId: {
    type: DataTypes.STRING, // Role ID (e.g., sales, procurement)
    allowNull: false,
  },

  roleName: {
    type: DataTypes.STRING, // Role Name (e.g., Sales, Procurement)
    allowNull: false,
  },
});

// Relationships
Team.hasMany(TeamMember, { foreignKey: "teamId", onDelete: "CASCADE" });
TeamMember.belongsTo(Team, { foreignKey: "teamId" });

module.exports = TeamMember;
