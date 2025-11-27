// migrations/xxxx-add-variant-support.js
module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn("products", "masterProductId", {
      type: DataTypes.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn("products", "isMaster", {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("products", "variantOptions", {
      type: DataTypes.JSON,
      allowNull: true,
    });
    await queryInterface.addColumn("products", "variantKey", {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("products", "skuSuffix", {
      type: DataTypes.STRING(50),
      allowNull: true,
    });

    await queryInterface.addIndex("products", ["masterProductId"]);
    await queryInterface.addIndex("products", ["isMaster"]);
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("products", "masterProductId");
    await queryInterface.removeColumn("products", "isMaster");
    await queryInterface.removeColumn("products", "variantOptions");
    await queryInterface.removeColumn("products", "variantKey");
    await queryInterface.removeColumn("products", "skuSuffix");
  },
};
