// models/ActivityLog.js

const { v4: uuidv4 } = require("uuid");

const CONTEXT_TAGS = {
  AUTH: "AUTH",
  CRM: "CRM",
  CATALOG: "CATALOG",
  SALES: "SALES",
  PROCUREMENT: "PROCUREMENT",
  INVENTORY: "INVENTORY",
  SYSTEM: "SYSTEM",
};

const SUB_CONTEXTS = {
  USER: "USER",
  CUSTOMER: "CUSTOMER",
  VENDOR: "VENDOR",

  BRAND: "BRAND",
  CATEGORY: "CATEGORY",
  PRODUCT: "PRODUCT",

  QUOTATION: "QUOTATION",
  ORDER: "ORDER",

  FIELD_GUIDED_SHEET: "FIELD_GUIDED_SHEET",
  PURCHASE_ORDER: "PURCHASE_ORDER",

  TEAM: "TEAM",
  ADDRESS: "ADDRESS",
};

module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define(
    "ActivityLog",
    {
      activityLogId: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: () => uuidv4(),
      },

      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "userId",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      contextTag: {
        type: DataTypes.ENUM(...Object.values(CONTEXT_TAGS)),
        allowNull: false,
      },

      subContext: {
        type: DataTypes.ENUM(...Object.values(SUB_CONTEXTS)),
        allowNull: false,
      },

      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      entityId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      entityName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      severity: {
        type: DataTypes.ENUM("info", "warning", "error", "critical"),
        allowNull: false,
        defaultValue: "info",
      },

      oldValues: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      newValues: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      ipAddress: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "activity_logs",
      timestamps: true,

      indexes: [
        {
          name: "idx_activity_logs_user_id",
          fields: ["userId"],
        },
        {
          name: "idx_activity_logs_context_tag",
          fields: ["contextTag"],
        },
        {
          name: "idx_activity_logs_sub_context",
          fields: ["subContext"],
        },
        {
          name: "idx_activity_logs_entity_id",
          fields: ["entityId"],
        },
        {
          name: "idx_activity_logs_action",
          fields: ["action"],
        },
        {
          name: "idx_activity_logs_severity",
          fields: ["severity"],
        },
        {
          name: "idx_activity_logs_created_at",
          fields: ["createdAt"],
        },
        {
          name: "idx_activity_logs_context_subcontext",
          fields: ["contextTag", "subContext"],
        },
      ],
    },
  );

  ActivityLog.CONTEXT_TAGS = CONTEXT_TAGS;
  ActivityLog.SUB_CONTEXTS = SUB_CONTEXTS;

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  };

  return ActivityLog;
};
