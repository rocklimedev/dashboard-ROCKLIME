const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, DataTypes) => {
  const Vendor = sequelize.define(
    "Vendor",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },

      vendorId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true, // ✅ changed
      },

      vendorName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      brandId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "brands", // table name
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      brandSlug: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: "brands", // table name
          key: "brandSlug",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
    },
    {
      tableName: "vendors",
      timestamps: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
      engine: "InnoDB",
    },
  );

  // -------------------------------
  // Associations
  // -------------------------------
  Vendor.associate = (models) => {
    // Vendor ↔ Brand
    Vendor.belongsTo(models.Brand, { foreignKey: "brandId", as: "brand" });

    // Vendor ↔ Products
    Vendor.hasMany(models.Product, { foreignKey: "vendorId", as: "products" });
  };

  return Vendor;
};
