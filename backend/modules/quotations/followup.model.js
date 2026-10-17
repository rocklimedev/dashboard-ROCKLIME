const { v4: uuidv4 } = require("uuid");

// One logged follow-up on a quotation (call, visit, WhatsApp…), with the next date.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "QuotationFollowUp",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: () => uuidv4() },
      quotationId: { type: DataTypes.CHAR(36), allowNull: false },
      userId: { type: DataTypes.CHAR(36), allowNull: true },
      channel: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "CALL" },
      note: { type: DataTypes.TEXT, allowNull: false },
      nextDate: { type: DataTypes.DATEONLY, allowNull: true },
    },
    { tableName: "quotation_followups", timestamps: true },
  );
