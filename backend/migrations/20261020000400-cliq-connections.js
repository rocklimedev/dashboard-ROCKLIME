'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('zoho_cliq_connections')) return;
    await queryInterface.createTable('zoho_cliq_connections', {
      userId: { type: Sequelize.CHAR(36), primaryKey: true, allowNull: false },
      refreshToken: { type: Sequelize.TEXT, allowNull: false },
      accessToken: { type: Sequelize.TEXT },
      accountsUrl: { type: Sequelize.STRING(120), allowNull: false },
      expiresAt: { type: Sequelize.DATE },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('zoho_cliq_connections');
  },
};
