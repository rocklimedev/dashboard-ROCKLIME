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

      contactPerson: { type: DataTypes.STRING(120), allowNull: true },
      phone: { type: DataTypes.STRING(30), allowNull: true },
      email: { type: DataTypes.STRING(160), allowNull: true },
      gstin: { type: DataTypes.STRING(15), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      city: { type: DataTypes.STRING(80), allowNull: true },
      state: { type: DataTypes.STRING(60), allowNull: true },
      pincode: { type: DataTypes.STRING(10), allowNull: true },
      paymentTerms: { type: DataTypes.STRING(255), allowNull: true },
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
