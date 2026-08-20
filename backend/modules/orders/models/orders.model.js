// models/Order.js

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      // -----------------------------------------------------------
      // BASIC
      // -----------------------------------------------------------
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

      // -----------------------------------------------------------
      // ORDER PRODUCTS
      // Original ordered products snapshot
      // -----------------------------------------------------------
      products: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      // -----------------------------------------------------------
      // ORDER STATUS
      // -----------------------------------------------------------
      status: {
        type: DataTypes.ENUM(
          "DRAFT",
          "PREPARING",
          "CHECKING",
          "INVOICE",
          "PARTIALLY_DISPATCHED",
          "DISPATCHED",
          "PARTIALLY_DELIVERED",
          "DELIVERED",
          "RETURNED",
          "ONHOLD",
          "CANCELED",
          "CLOSED",
        ),
        allowNull: false,
        defaultValue: "DRAFT",
      },

      // -----------------------------------------------------------
      // PRIORITY
      // -----------------------------------------------------------
      priority: {
        type: DataTypes.ENUM("high", "medium", "low"),
        allowNull: false,
        defaultValue: "medium",
      },

      // -----------------------------------------------------------
      // DATES
      // -----------------------------------------------------------
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      followupDates: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      // -----------------------------------------------------------
      // SOURCE / DESCRIPTION
      // -----------------------------------------------------------
      source: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // -----------------------------------------------------------
      // USERS / CUSTOMER
      // -----------------------------------------------------------
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

      // -----------------------------------------------------------
      // QUOTATION
      // -----------------------------------------------------------
      quotationId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      // -----------------------------------------------------------
      // SHIPPING
      // -----------------------------------------------------------
      shipTo: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      // -----------------------------------------------------------
      // DOCUMENTS
      // -----------------------------------------------------------

      // Gate pass for dispatch
      gatePassLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      // Invoice document
      invoiceLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      /*
       * Receiving / proof-of-receipt document.
       *
       * This remains on the Order because it represents the
       * final receiving confirmation for the order.
       *
       * Credit-note documents are NOT stored here anymore.
       * They belong to OrderCreditNote.
       */
      receivingDocumentLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      // -----------------------------------------------------------
      // ORDER RELATIONSHIPS
      // -----------------------------------------------------------
      masterPipelineNo: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },

      previousOrderNo: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },

      // -----------------------------------------------------------
      // FINANCIALS
      // -----------------------------------------------------------
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

    // -----------------------------------------------------------
    // MODEL OPTIONS
    // -----------------------------------------------------------
    {
      tableName: "orders",

      timestamps: true,

      indexes: [
        {
          unique: true,
          fields: ["orderNo"],
        },

        {
          fields: ["status"],
        },

        {
          fields: ["createdFor"],
        },

        {
          fields: ["createdBy"],
        },

        {
          fields: ["assignedUserId"],
        },

        {
          fields: ["dueDate"],
        },

        {
          fields: ["quotationId"],
        },

        {
          fields: ["finalAmount"],
        },

        {
          fields: ["createdAt"],
        },

        {
          name: "idx_order_status_date",
          fields: ["status", "createdAt"],
        },
      ],
    },
  );

  // ===========================================================
  // ASSOCIATIONS
  // ===========================================================

  Order.associate = (models) => {
    // ---------------------------------------------------------
    // USER RELATIONS
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // TEAM
    // ---------------------------------------------------------

    Order.belongsTo(models.Team, {
      foreignKey: "assignedTeamId",
      as: "assignedTeam",
    });

    // ---------------------------------------------------------
    // CUSTOMER
    // ---------------------------------------------------------

    Order.belongsTo(models.Customer, {
      foreignKey: "createdFor",
      as: "customer",
    });

    // ---------------------------------------------------------
    // SHIPPING ADDRESS
    // ---------------------------------------------------------

    Order.belongsTo(models.Address, {
      foreignKey: "shipTo",
      as: "shippingAddress",
    });

    // ---------------------------------------------------------
    // QUOTATION
    // ---------------------------------------------------------

    Order.belongsTo(models.Quotation, {
      foreignKey: "quotationId",
      as: "quotation",
    });

    // ---------------------------------------------------------
    // PREVIOUS / NEXT ORDER RELATION
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // MASTER PIPELINE
    // ---------------------------------------------------------

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

    // =========================================================
    // DISPATCH HISTORY
    // =========================================================
    //
    // One order can have multiple dispatches:
    //
    // Order
    //   ├── Dispatch #1
    //   ├── Dispatch #2
    //   └── Dispatch #3
    //
    // Each dispatch contains its own items/quantities.
    //
    Order.hasMany(models.OrderDispatch, {
      foreignKey: "orderId",
      as: "dispatches",
    });

    // =========================================================
    // CREDIT NOTE HISTORY
    // =========================================================
    //
    // One order can have multiple credit notes:
    //
    // Order
    //   ├── Credit Note #1
    //   │     ├── Product A x2
    //   │     └── Product C x1
    //   │
    //   └── Credit Note #2
    //         ├── Product A x1
    //         └── Product B x3
    //
    // This supports partial returns by product and quantity.
    //
    Order.hasMany(models.OrderCreditNote, {
      foreignKey: "orderId",
      as: "creditNotes",
    });

    // =========================================================
    // ORDER ACTIVITY
    // =========================================================
    //
    // Dedicated immutable order timeline:
    //
    // CREATE_ORDER
    // ORDER_UPDATED
    // STATUS_CHANGED
    // DISPATCH_CREATED
    // CREDIT_NOTE_CREATED
    // RETURN_RECEIVED
    // etc.
    //
    Order.hasMany(models.OrderActivity, {
      foreignKey: "orderId",
      as: "activityLog",
    });
  };

  return Order;
};
