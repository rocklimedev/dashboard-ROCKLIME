// migrations/xxxx-create-site-maps.js
module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable("site_maps", {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: { type: DataTypes.STRING(255), allowNull: false },
      customerId: { type: DataTypes.UUID, allowNull: false },
      siteSizeInBHK: { type: DataTypes.STRING(50), allowNull: true },
      totalFloors: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      floorDetails: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      items: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      summaries: {
        type: DataTypes.JSON,
        defaultValue: { overall: {}, perFloor: {}, perType: {} },
      },
      quotationId: { type: DataTypes.UUID, allowNull: true },
      status: {
        type: DataTypes.ENUM("draft", "finalized", "converted"),
        defaultValue: "draft",
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.addIndex("site_maps", ["customerId"]);
    await queryInterface.addIndex("site_maps", ["quotationId"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("site_maps");
  },
};
