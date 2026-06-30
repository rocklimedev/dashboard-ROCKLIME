const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, DataTypes) => {
  const TeamMember = sequelize.define(
    "TeamMember",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },

      teamId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "teams", // table name, not model import
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

  // Associations
  TeamMember.associate = (models) => {
    TeamMember.belongsTo(models.Team, {
      foreignKey: "teamId",
      as: "team",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    models.Team.hasMany(TeamMember, {
      foreignKey: "teamId",
      as: "teammembers",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return TeamMember;
};
