// models/Job.js
module.exports = (sequelize, DataTypes) => {
  const Job = sequelize.define(
    "Job",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      params: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "processing",
          "completed",
          "failed",
          "cancelled",
        ),
        defaultValue: "pending",
      },
      progress: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      results: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      errorLog: { type: DataTypes.JSON, defaultValue: [] },
      completedAt: { type: DataTypes.DATE },
    },
    {
      tableName: "jobs",
      timestamps: true,
    },
  );

  // Define associations
  Job.associate = (models) => {
    // Job belongs to User (one-to-many: one user can have many jobs)
    Job.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user", // alias for querying (e.g., job.user)
      onDelete: "SET NULL", // if user is deleted, keep the job but null the userId
    });
  };

  return Job;
};
