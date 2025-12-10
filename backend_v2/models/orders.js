// models/Order.js
module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      orderNo: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },

      products: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM(
          "DRAFT",
          "PREPARING",
          "CHECKING",
          "INVOICE",
          "DISPATCHED",
          "PARTIALLY_DELIVERED",
          "DELIVERED",
          "ONHOLD",
          "CANCELED",
          "CLOSED"
        ),
        allowNull: false,
        defaultValue: "DRAFT",
      },

      priority: {
        type: DataTypes.ENUM("high", "medium", "low"),
        allowNull: false,
        defaultValue: "medium",
      },

      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      followupDates: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      source: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      createdFor: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      assignedUserId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      assignedTeamId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      secondaryUserId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      quotationId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      shipTo: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      gatePassLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      invoiceLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      masterPipelineNo: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },

      previousOrderNo: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },

      shipping: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      gst: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },

      gstValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.0,
      },

      extraDiscount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.0,
      },

      extraDiscountType: {
        type: DataTypes.ENUM("percent", "fixed"),
        allowNull: true,
      },

      extraDiscountValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.0,
      },

      finalAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      amountPaid: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
    },
    {
      tableName: "orders",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["orderNo"] },
        { fields: ["status"] },
        { fields: ["createdFor"] },
        { fields: ["createdBy"] },
        { fields: ["assignedUserId"] },
        { fields: ["dueDate"] },
        { fields: ["quotationId"] },
        { fields: ["finalAmount"] },
        { fields: ["createdAt"] },
        {
          name: "idx_order_status_date",
          fields: ["status", "createdAt"],
        },
      ],
    }
  );

  // -----------------------------------------------------------
  //                ASSOCIATIONS START HERE
  // -----------------------------------------------------------
  Order.associate = (models) => {
    // User relations
    Order.belongsTo(models.User, {
      foreignKey: "secondaryUserId",
      as: "secondaryUser",
    });

    Order.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "creator",
    });

    Order.belongsTo(models.User, {
      foreignKey: "assignedUserId",
      as: "assignedUser",
    });

    // Team relation
    Order.belongsTo(models.Team, {
      foreignKey: "assignedTeamId",
      as: "assignedTeam",
    });

    // Customer relation
    Order.belongsTo(models.Customer, {
      foreignKey: "createdFor",
      as: "customer",
    });

    // Shipping Address
    Order.belongsTo(models.Address, {
      foreignKey: "shipTo",
      as: "shippingAddress",
    });

    // Quotation relation
    Order.belongsTo(models.Quotation, {
      foreignKey: "quotationId",
      as: "quotation",
    });

    // Self-referencing relations
    Order.hasMany(models.Order, {
      foreignKey: "previousOrderNo",
      sourceKey: "orderNo",
      as: "nextOrders",
    });

    Order.belongsTo(models.Order, {
      foreignKey: "previousOrderNo",
      targetKey: "orderNo",
      as: "previousOrder",
    });

    // Master Pipeline
    Order.hasMany(models.Order, {
      foreignKey: "masterPipelineNo",
      sourceKey: "orderNo",
      as: "pipelineOrders",
    });

    Order.belongsTo(models.Order, {
      foreignKey: "masterPipelineNo",
      targetKey: "orderNo",
      as: "masterOrder",
    });
  };

  return Order;
};
