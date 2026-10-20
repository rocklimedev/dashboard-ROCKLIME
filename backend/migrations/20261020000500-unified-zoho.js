"use strict";
module.exports = {
  async up(q, S) {
    const tables = await q.showAllTables();
    if (!tables.includes("zoho_connections")) await q.createTable("zoho_connections", {
      userId: { type: S.CHAR(36), primaryKey: true, allowNull: false },
      refreshToken: { type: S.TEXT, allowNull: false }, accessToken: { type: S.TEXT },
      accountsUrl: { type: S.STRING(120), allowNull: false }, scope: { type: S.TEXT },
      expiresAt: { type: S.DATE }, updatedAt: { type: S.DATE, allowNull: false },
      lastSyncAt: { type: S.DATE }, lastSyncResult: { type: S.TEXT },
    });
    if (!tables.includes("zoho_service_connections")) await q.createTable("zoho_service_connections", {
      service: { type: S.STRING(20), primaryKey: true, allowNull: false },
      userId: { type: S.CHAR(36), allowNull: false },
    });
  },
  async down(q) { await q.dropTable("zoho_service_connections"); await q.dropTable("zoho_connections"); },
};
