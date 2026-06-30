const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, DataTypes) => {
  const Team = sequelize.define(
    "Team",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },

      teamName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      adminId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      adminName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "teams",
      timestamps: true,
    }
  );

  // ---------------------------------------
  // Associations
  // ---------------------------------------
  Team.associate = (models) => {
    // Team ↔ Orders (1:M)
    Team.hasMany(models.Order, {
      foreignKey: "assignedTeamId",
      as: "teamOrders",
    });

    // Team ↔ Users (M:N through TeamMember)
    Team.belongsToMany(models.User, {
      through: models.TeamMember,
      foreignKey: "teamId",
      otherKey: "userId",
      as: "members",
    });
  };

  return Team;
};
