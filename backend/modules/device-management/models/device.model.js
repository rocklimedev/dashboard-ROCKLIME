'use strict';

/**
 * Device (warehouse terminal) model.
 *
 * `deviceSecretHash` is a bcrypt hash — never store or return the plaintext
 * secret after the initial registration response.
 */
module.exports = (sequelize, DataTypes) => {
  const Device = sequelize.define(
    'Device',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      deviceId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Human-facing identifier, e.g. CM-PI-001',
      },
      assetTag: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      warehouseId: {
        type: DataTypes.CHAR(36),
        allowNull: true,
      },
      function: {
        type: DataTypes.ENUM('ORDERS', 'PICKING', 'DISPATCH', 'INVENTORY'),
        allowNull: true,
      },
      screen: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      route: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      config: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      deviceSecretHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      secretIssuedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('online', 'offline'),
        allowNull: false,
        defaultValue: 'offline',
      },
      lastHeartbeatAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      appVersion: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      registeredBy: {
        type: DataTypes.CHAR(36),
        allowNull: true,
      },
    },
    {
      tableName: 'devices',
      timestamps: true,
      indexes: [
        { fields: ['status'] },
        { fields: ['lastHeartbeatAt'] },
      ],
    }
  );

  Device.associate = (models) => {
    Device.belongsTo(models.Warehouse, {
      foreignKey: 'warehouseId',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    if (models.User) {
      Device.belongsTo(models.User, {
        foreignKey: 'registeredBy',
        targetKey: 'userId',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  };

  return Device;
};
