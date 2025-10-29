const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Team = require("./team");
const Customer = require("./customers");
const User = require("./users");
const Quotation = require("./quotation");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    products: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "PREPARING",
        "CHECKING",
        "INVOICE",
        "DISPATCHED",
        "DELIVERED",
        "PARTIALLY_DELIVERED",
        "CANCELED",
        "DRAFT",
        "ONHOLD"
      ),
      defaultValue: "PREPARING",
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
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM("high", "medium", "low"),
      defaultValue: "medium",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdFor: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Customer,
        key: "customerId",
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "userId",
      },
    },
    assignedUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: "userId",
      },
    },
    assignedTeamId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Team,
        key: "id",
      },
    },
    secondaryUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: "userId",
      },
    },
    invoiceLink: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    orderNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    quotationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Quotation,
        key: "quotationId",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    masterPipelineNo: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    previousOrderNo: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    shipTo: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "addresses",
        key: "addressId",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    // ===============================
    // SHIPPING AMOUNT
    // ===============================
    shipping: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  }
);

module.exports = Order;
