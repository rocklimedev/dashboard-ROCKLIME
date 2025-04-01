const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const Company = sequelize.define(
  "Company", // ✅ Correct model name
  {
    companyId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // ✅ Fix: Use Sequelize's built-in UUID generator
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    website: {
      type: DataTypes.STRING(255),
      validate: {
        isUrl: true,
      },
    },
    createdDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    parentCompanyId: {
      type: DataTypes.UUID,
      allowNull: true, // NULL for top-level companies
      references: {
        model: "companies", // ✅ FIX: Should match the actual MySQL table name, NOT the Sequelize model name
        key: "companyId",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "companies", // This sets the database table name
    timestamps: true,
  }
);

// 🏢 Self-Referential Associations
Company.hasMany(Company, {
  as: "ChildCompanies", // A company can have multiple child companies
  foreignKey: "parentCompanyId",
});

Company.belongsTo(Company, {
  as: "ParentCompany", // A company can belong to one parent company
  foreignKey: "parentCompanyId",
});

module.exports = Company;
