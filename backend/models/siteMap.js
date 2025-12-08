const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Customer = require("./customers");
const { v4: uuidv4 } = require("uuid");

const SiteMap = sequelize.define(
  "SiteMap",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "e.g., Dhruv Verma Residence, Galaxy Mall Project",
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Customer, key: "customerId" },
      onDelete: "CASCADE",
    },
    siteSizeInBHK: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "e.g., 3BHK, 4BHK+Study, Duplex, Commercial 5000sqft",
    },
    totalFloors: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    floorDetails: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment:
        "Array of floors → [{ floor_number: 1, floor_name: 'Ground Floor', floor_size: '1400 sqft', details: 'Lobby + 2 Bathrooms', rooms: [{ room_id: 'r1', room_name: 'Master Bathroom', room_type: 'Bathroom', room_size: '100 sqft', details: 'Shower + Sink' }] }]",
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment:
        "Full items array (same structure as quotation.products but with floor/room allocation) → [{ productId, name, imageUrl, quantity, price, floor_number, room_id, productType, ... }]",
    },
    summaries: {
      type: DataTypes.JSON,
      defaultValue: {
        overall: { totalItems: 0, totalQty: 0, totalAmount: 0 },
        perFloor: {},
        perType: {},
      },
      comment: "Auto-computed on save, now with perRoom nested under perFloor",
    },
    quotationId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Nullable → Optional link to quotation",
    },
    status: {
      type: DataTypes.ENUM("draft", "finalized", "converted"),
      defaultValue: "draft",
    },
  },
  {
    tableName: "site_maps",
    timestamps: true,
    indexes: [
      { fields: ["customerId"] },
      { fields: ["quotationId"] },
      { fields: ["status"] },
    ],
  }
);

// Associations
SiteMap.belongsTo(Customer, { foreignKey: "customerId" });

module.exports = SiteMap;
