const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, DataTypes) => {
  const Signature = sequelize.define(
    "Signature",
    {
      signatureId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },

      signature_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      signature_image: {
        type: DataTypes.STRING(255), // URL path
        allowNull: false,
      },

      mark_as_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users", // table name
          key: "userId",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      customerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "customers", // table name
          key: "customerId",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      vendorId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "vendors", // table name
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "signatures",
      timestamps: true,
    }
  );

  // Centralized associations
  Signature.associate = (models) => {
    Signature.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    Signature.belongsTo(models.Customer, {
      foreignKey: "customerId",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    Signature.belongsTo(models.Vendor, {
      foreignKey: "vendorId",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  };

  return Signature;
};
