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

  return Company;
};
