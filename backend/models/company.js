const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const Company = sequelize.define("Company", {
  companyId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: uuidv4,
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
    allowNull: true, // NULL for the main parent company
    references: {
      model: "Companies", // Refers to the same table
      key: "companyId",
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  },
});

Company.hasMany(Company, {
  as: "ChildCompanies",
  foreignKey: "parentCompanyId",
});
Company.belongsTo(Company, {
  as: "ParentCompany",
  foreignKey: "parentCompanyId",
});

module.exports = Company;
