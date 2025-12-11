// models/Address.js
const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define(
    "Address",
    {
      addressId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      street: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      postalCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("BILLING", "PRIMARY", "ADDITIONAL"),
        allowNull: false,
        defaultValue: "ADDITIONAL",
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: "addresses",
      timestamps: true,
      hooks: {
        beforeCreate: (address) => {
          if (!address.addressId) {
            address.addressId = uuidv4();
          }
        },
      },
    }
  );

  // ⭐ Correct place for associations
  Address.associate = (models) => {
    Address.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });

    Address.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });

    Address.hasMany(models.Order, {
      foreignKey: "shipTo",
      as: "orders",
    });
  };

  return Address;
};
