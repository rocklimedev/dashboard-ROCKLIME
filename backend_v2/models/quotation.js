const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, DataTypes) => {
  const Quotation = sequelize.define(
    "Quotation",
    {
      quotationId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      document_title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      quotation_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      followupDates: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: "Array of follow-up date objects or timestamps",
      },
      reference_number: {
        type: DataTypes.STRING(50),
      },
      products: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment:
          "Stores either fixed amount or percentage; interpretation handled in frontend",
      },
      roundOff: {
        type: DataTypes.DECIMAL(10, 2),
      },
      finalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      signature_name: {
        type: DataTypes.STRING(255),
      },
      signature_image: {
        type: DataTypes.TEXT,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      shipTo: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      extraDiscount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      extraDiscountType: {
        type: DataTypes.ENUM("percent", "fixed"),
        allowNull: true,
      },
      shippingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      gst: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: "GST percentage applied on total amount",
      },
    },
    {
      tableName: "quotations",
      timestamps: true,
    }
  );

  // ---------------------------------------
  // Associations
  // ---------------------------------------
  Quotation.associate = (models) => {
    // Created by User
    Quotation.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "creator",
    });

    // Customer
    Quotation.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });

    // Shipping Address
    Quotation.belongsTo(models.Address, {
      foreignKey: "shipTo",
      as: "shippingAddress",
    });

    // Quotation → Order (1:M)
    Quotation.hasMany(models.Order, {
      foreignKey: "quotationId",
      as: "orders",
    });

    // Quotation → Invoice (1:1)
    Quotation.hasOne(models.Invoice, {
      foreignKey: "quotationId",
      as: "invoice",
    });
  };

  return Quotation;
};
