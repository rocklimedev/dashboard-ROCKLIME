// models/Company.js
module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define(
    "Company",
    {
      companyId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: "companyId",
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [2, 255],
        },
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      createdDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "createdDate",
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      parentCompanyId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "parentCompanyId",
      },
    },
    {
      tableName: "companies",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["name"] },
        { unique: true, fields: ["slug"] },
        { fields: ["parentCompanyId"] },
        { fields: ["createdDate"] },
      ],
    }
  );
  Company.associate = (models) => {
    // A company can have many child companies
    Company.hasMany(models.Company, {
      as: "ChildCompanies", // ← this must match what you use in include
      foreignKey: "parentCompanyId",
      sourceKey: "companyId",
    });

    // Each company (except root) belongs to one parent
    Company.belongsTo(models.Company, {
      as: "ParentCompany", // ← optional: useful if you want to include parents later
      foreignKey: "parentCompanyId",
      targetKey: "companyId",
    });
  };

  return Company;
};
