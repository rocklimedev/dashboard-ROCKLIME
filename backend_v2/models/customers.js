// models/Customer.js
module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    "Customer",
    {
      customerId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: "customerId",
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: false, // Allowed duplicates
        validate: {
          isEmail: true,
        },
      },
      mobileNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          len: [10, 15],
        },
      },
      phone2: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      companyName: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      customerType: {
        type: DataTypes.ENUM(
          "Retail",
          "Architect",
          "Interior",
          "Builder",
          "Contractor"
        ),
        allowNull: true,
        defaultValue: "Retail",
      },
      address: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isVendor: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      vendorId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      gstNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          len: [15, 15],
          isAlphanumeric: true,
        },
      },
    },
    {
      tableName: "customers",
      timestamps: true,
      indexes: [
        { fields: ["mobileNumber"] },
        { fields: ["email"] },
        { fields: ["isVendor"] },
        { fields: ["customerType"] },
        { fields: ["gstNumber"] },
      ],
    }
  );

  // -----------------------
  // ASSOCIATIONS GO INSIDE!
  // -----------------------
  Customer.associate = (models) => {
    Customer.hasMany(models.Order, {
      foreignKey: "createdFor",
      as: "customerOrders",
    });

    Customer.hasMany(models.Address, {
      foreignKey: "customerId",
      as: "addresses",
    });

    Customer.hasMany(models.Invoice, {
      foreignKey: "customerId",
      onDelete: "CASCADE",
    });

    Customer.belongsTo(models.Vendor, {
      foreignKey: "vendorId",
      as: "vendor",
    });

    Customer.hasMany(models.Quotation, {
      foreignKey: "customerId",
      as: "customerQuotations",
    });
  };

  return Customer;
};
