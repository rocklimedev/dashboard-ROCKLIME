'use strict';

/**
 * CRM app: deals (the pipeline), their activity and follow-up tasks, and the
 * company's Zoho Bigin connection. Adds the "crm" permission module and gives
 * the SALES role view / write / edit. Safe to run again.
 */
module.exports = {
  async up(queryInterface) {
    const Sequelize = require('sequelize');
    const { DataTypes } = Sequelize;
    const { randomUUID } = require('crypto');
    const now = {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    };
    const tables = (await queryInterface.showAllTables()).map((t) =>
      typeof t === 'string' ? t : t.tableName,
    );

    if (!tables.includes('crm_deals')) {
      await queryInterface.createTable('crm_deals', {
        id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
        title: { type: DataTypes.STRING(200), allowNull: false },
        contactName: { type: DataTypes.STRING(150), allowNull: true },
        phone: { type: DataTypes.STRING(20), allowNull: true },
        email: { type: DataTypes.STRING(150), allowNull: true },
        company: { type: DataTypes.STRING(150), allowNull: true },
        customerType: { type: DataTypes.STRING(30), allowNull: true },
        city: { type: DataTypes.STRING(80), allowNull: true },
        source: { type: DataTypes.STRING(60), allowNull: true },
        stage: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'capture' },
        amount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
        expectedClose: { type: DataTypes.DATEONLY, allowNull: true },
        ownerId: { type: DataTypes.CHAR(36), allowNull: true },
        tag: { type: DataTypes.STRING(20), allowNull: true },
        lostReason: { type: DataTypes.STRING(300), allowNull: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        customerId: { type: DataTypes.CHAR(36), allowNull: true },
        quotationId: { type: DataTypes.CHAR(36), allowNull: true },
        orderId: { type: DataTypes.CHAR(36), allowNull: true },
        biginId: { type: DataTypes.STRING(40), allowNull: true },
        biginSyncedAt: { type: DataTypes.DATE, allowNull: true },
        biginError: { type: DataTypes.STRING(300), allowNull: true },
        stageEnteredAt: now,
        closedAt: { type: DataTypes.DATE, allowNull: true },
        createdBy: { type: DataTypes.CHAR(36), allowNull: true },
        createdAt: now,
        updatedAt: now,
      });
      await queryInterface.addIndex('crm_deals', ['stage']);
      await queryInterface.addIndex('crm_deals', ['customerId']);
      await queryInterface.addIndex('crm_deals', ['quotationId']);
      await queryInterface.addIndex('crm_deals', ['phone']);
      await queryInterface.addIndex('crm_deals', ['biginId'], { unique: true });
    }

    if (!tables.includes('crm_activities')) {
      await queryInterface.createTable('crm_activities', {
        id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
        dealId: { type: DataTypes.CHAR(36), allowNull: false },
        kind: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'note' },
        text: { type: DataTypes.TEXT, allowNull: false },
        userId: { type: DataTypes.CHAR(36), allowNull: true },
        createdAt: now,
      });
      await queryInterface.addIndex('crm_activities', ['dealId', 'createdAt']);
    }

    if (!tables.includes('crm_tasks')) {
      await queryInterface.createTable('crm_tasks', {
        id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
        dealId: { type: DataTypes.CHAR(36), allowNull: false },
        title: { type: DataTypes.STRING(200), allowNull: false },
        dueDate: { type: DataTypes.DATEONLY, allowNull: true },
        done: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        assignedTo: { type: DataTypes.CHAR(36), allowNull: true },
        createdBy: { type: DataTypes.CHAR(36), allowNull: true },
        createdAt: now,
        updatedAt: now,
      });
      await queryInterface.addIndex('crm_tasks', ['dealId']);
      await queryInterface.addIndex('crm_tasks', ['done', 'dueDate']);
    }

    if (!tables.includes('crm_zoho_connection')) {
      await queryInterface.createTable('crm_zoho_connection', {
        key: { type: DataTypes.STRING(20), primaryKey: true, allowNull: false },
        accessToken: { type: DataTypes.TEXT, allowNull: true },
        refreshToken: { type: DataTypes.TEXT, allowNull: false },
        apiDomain: { type: DataTypes.STRING(120), allowNull: true },
        accountsUrl: { type: DataTypes.STRING(120), allowNull: false },
        scope: { type: DataTypes.TEXT, allowNull: true },
        expiresAt: { type: DataTypes.DATE, allowNull: true },
        orgName: { type: DataTypes.STRING(150), allowNull: true },
        connectedBy: { type: DataTypes.CHAR(36), allowNull: true },
        lastSyncAt: { type: DataTypes.DATE, allowNull: true },
        lastSyncResult: { type: DataTypes.TEXT, allowNull: true },
        createdAt: now,
        updatedAt: now,
      });
    }

    // permission module "crm"
    const q = (sql, replacements) =>
      queryInterface.sequelize.query(sql, {
        replacements,
        type: sql.trim().startsWith('SELECT') ? 'SELECT' : undefined,
      });
    const permTable = tables.includes('permissions');
    if (permTable) {
      for (const api of ['view', 'write', 'edit', 'delete', 'export']) {
        const found = await q(
          "SELECT permissionId FROM permissions WHERE module = 'crm' AND api = ? LIMIT 1",
          [api],
        );
        if (found.length) continue;
        await q(
          "INSERT INTO permissions (permissionId, name, module, api, route, createdAt, updatedAt) VALUES (?, ?, 'crm', ?, '/crm', NOW(), NOW())",
          [randomUUID(), `${api}_crm`, api],
        );
      }
      for (const api of ['view', 'write', 'edit']) {
        await q(
          `INSERT INTO rolepermissions (id, roleId, permissionId, createdAt, updatedAt)
           SELECT UUID(), r.roleId, p.permissionId, NOW(), NOW()
           FROM roles r JOIN permissions p ON p.module = 'crm' AND p.api = ?
           WHERE r.roleName = 'SALES'
             AND NOT EXISTS (SELECT 1 FROM rolepermissions x WHERE x.roleId = r.roleId AND x.permissionId = p.permissionId)`,
          [api],
        );
      }
    }
  },

  async down(queryInterface) {
    for (const t of ['crm_zoho_connection', 'crm_tasks', 'crm_activities', 'crm_deals']) {
      await queryInterface.dropTable(t).catch(() => {});
    }
  },
};
