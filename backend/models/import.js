// models/ImportJob.js
module.exports = (sequelize, DataTypes) => {
  const ImportJob = sequelize.define(
    "ImportJob",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      filePath: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      originalFileName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      mapping: {
        type: DataTypes.JSON,
        allowNull: false,
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
      totalRows: { type: DataTypes.INTEGER, allowNull: true },
      processedRows: { type: DataTypes.INTEGER, defaultValue: 0 },
      successCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      failedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      newCategoriesCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      newBrandsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      newVendorsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      errorLog: { type: DataTypes.JSON, defaultValue: [] },
      completedAt: { type: DataTypes.DATE },
    },
    {
      tableName: "import_jobs",
      timestamps: true,
    },
  );

  // Define associations
  ImportJob.associate = (models) => {
    // ImportJob belongs to User (one-to-many: one user can have many import jobs)
    ImportJob.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user", // alias for querying (e.g., job.user)
      onDelete: "SET NULL", // if user is deleted, keep the job but null the userId
    });
  };

  return ImportJob;
};
