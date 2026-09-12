'use strict';

/**
 * Warehouse (Godown) model.
 *
 * Adjust the require path below to match how your project exposes its
 * Sequelize instance and DataTypes (e.g. `require('../../config/database')`).
 */
module.exports = (sequelize, DataTypes) => {
  const Warehouse = sequelize.define(
    'Warehouse',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      addressId: {
        type: DataTypes.CHAR(36),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      tableName: 'warehouses',
      timestamps: true,
    }
  );

  Warehouse.associate = (models) => {
    if (models.Address) {
      Warehouse.belongsTo(models.Address, {
        foreignKey: 'addressId',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
    Warehouse.hasMany(models.Device, {
      foreignKey: 'warehouseId',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return Warehouse;
};
