// models/Invoice.js
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    "Invoice",
    {
      invoiceId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: "invoiceId",
      },
      invoiceNo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      quotationId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      billTo: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      shipTo: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      invoiceDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "paid",
          "unpaid",
          "partially-paid",
          "void",
          "refunded",
          "returned"
        ),
        allowNull: false,
        defaultValue: "unpaid",
      },
      products: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: "Array: { productId, name, qty, price, total }",
      },
      signatureName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "CM TRADING CO",
      },
    },
    {
      tableName: "invoices",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["invoiceNo"] },
        { fields: ["customerId"] },
        { fields: ["status"] },
        { fields: ["invoiceDate"] },
        { fields: ["createdBy"] },
        { fields: ["quotationId"] },
      ],
      hooks: {
        beforeCreate: async (invoice, options) => {
          if (!invoice.invoiceNo) {
            const generateInvoiceNo = async () => {
              const random = crypto.randomInt(100000, 999999);
              const candidate = `INV-${random}`;

              const exists = await Invoice.count({
                where: { invoiceNo: candidate },
                transaction: options?.transaction,
              });

              return exists ? null : candidate;
            };

            let invoiceNo = null;
            while (!invoiceNo) {
              invoiceNo = await generateInvoiceNo();
            }
            invoice.invoiceNo = invoiceNo;
          }
        },
      },
    }
  );

  // -------------------------
  // ALL ASSOCIATIONS HERE
  // -------------------------
  Invoice.associate = (models) => {
    // Invoice ↔ User
    Invoice.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "createdByUser",
    });

    // Customer ↔ Invoice (1:M)
    Invoice.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });

    // Invoice ↔ Address (shipping address)
    Invoice.belongsTo(models.Address, {
      foreignKey: "shipTo",
      as: "shippingAddress",
    });

    // Invoice ↔ Quotation
    Invoice.belongsTo(models.Quotation, {
      foreignKey: "quotationId",
      as: "quotation",
    });
  };

  return Invoice;
};
