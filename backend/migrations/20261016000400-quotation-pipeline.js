"use strict";

/**
 * Quotation pipeline: status (Draft → Sent → Negotiation → Won / Lost / Expired),
 * when it was sent, why it was lost, the next follow-up date, and a follow-up log.
 * Existing quotations are back-filled: converted ones become Won, ones past
 * their valid-till date become Expired, the rest Draft.
 * Safe to run more than once.
 */
module.exports = {
  async up(queryInterface) {
    const Sequelize = require("sequelize");
    const { DataTypes } = Sequelize;
    const cols = await queryInterface.describeTable("quotations");
    const add = async (name, spec) => {
      if (!cols[name]) await queryInterface.addColumn("quotations", name, spec);
    };
    await add("status", { type: DataTypes.STRING(16), allowNull: false, defaultValue: "DRAFT" });
    await add("statusChangedAt", { type: DataTypes.DATE, allowNull: true });
    await add("sentAt", { type: DataTypes.DATE, allowNull: true });
    await add("lostReason", { type: DataTypes.STRING(120), allowNull: true });
    await add("lostNote", { type: DataTypes.TEXT, allowNull: true });
    await add("nextFollowUp", { type: DataTypes.DATEONLY, allowNull: true });

    const idx = await queryInterface.showIndex("quotations");
    if (!idx.some((i) => i.name === "quotations_status")) {
      await queryInterface.addIndex("quotations", ["status"], { name: "quotations_status" });
    }
    if (!idx.some((i) => i.name === "quotations_next_follow_up")) {
      await queryInterface.addIndex("quotations", ["nextFollowUp"], { name: "quotations_next_follow_up" });
    }

    const tables = (await queryInterface.showAllTables()).map((t) => (typeof t === "string" ? t : t.tableName));
    if (!tables.includes("quotation_followups")) {
      await queryInterface.createTable("quotation_followups", {
        id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
        quotationId: { type: DataTypes.CHAR(36), allowNull: false },
        userId: { type: DataTypes.CHAR(36), allowNull: true },
        channel: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "CALL" },
        note: { type: DataTypes.TEXT, allowNull: false },
        nextDate: { type: DataTypes.DATEONLY, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      });
      await queryInterface.addIndex("quotation_followups", ["quotationId"]);
    }

    // Back-fill only rows that were never given a status by this feature.
    const q = (sql) => queryInterface.sequelize.query(sql);
    await q(`UPDATE quotations SET status = 'WON', statusChangedAt = NOW()
             WHERE statusChangedAt IS NULL
               AND EXISTS (SELECT 1 FROM orders o WHERE o.quotationId = quotations.quotationId AND o.status <> 'CANCELED')`);
    await q(`UPDATE quotations SET status = 'EXPIRED', statusChangedAt = NOW()
             WHERE statusChangedAt IS NULL
               AND COALESCE(due_date, DATE_ADD(DATE(quotation_date), INTERVAL 15 DAY)) < CURDATE()`);
    await q(`UPDATE quotations SET statusChangedAt = COALESCE(updatedAt, NOW()) WHERE statusChangedAt IS NULL`);
    // Next follow-up from the old follow-up dates list (first date from today on)
    const [rows] = await q(`SELECT quotationId, followupDates FROM quotations WHERE nextFollowUp IS NULL AND followupDates IS NOT NULL`);
    const today = new Date().toISOString().slice(0, 10);
    for (const r of rows) {
      let dates = r.followupDates;
      for (let i = 0; i < 3 && typeof dates === "string"; i++) {
        try { dates = JSON.parse(dates); } catch { dates = []; }
      }
      if (!Array.isArray(dates)) continue;
      const next = dates.map((d) => String(d).slice(0, 10)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= today).sort()[0];
      if (next) {
        await queryInterface.sequelize.query("UPDATE quotations SET nextFollowUp = ? WHERE quotationId = ?", { replacements: [next, r.quotationId] });
      }
    }
  },
};
