const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Team = require("./team"); // ✅ Ensure it's correctly imported

const TeamMember = sequelize.define(
  "TeamMember",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    teamId: {
      type: DataTypes.UUID, // ✅ Ensure it's UUID
      allowNull: false,
      references: {
        model: Team, // 👈 Use the imported model, not a string
        key: "id",
      },

      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roleName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "teammembers",
    timestamps: true,
  }
);

// ✅ Define Associations
Team.hasMany(TeamMember, {
  foreignKey: "teamId",
  as: "teammembers",
  onDelete: "CASCADE",
});
TeamMember.belongsTo(Team, { foreignKey: "teamId", as: "teams" });

module.exports = TeamMember;
