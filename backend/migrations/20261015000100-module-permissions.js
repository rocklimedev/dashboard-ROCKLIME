"use strict";

/**
 * Module-level permissions for the server-side permission checks.
 *
 * The server now checks (module, action) for every route. This migration makes
 * sure one permission row exists for every module/action pair, gives ADMIN and
 * DEVELOPER all of them, and gives SALES and ACCOUNTS a starting set ONLY if
 * those roles have no permissions yet (an existing setup is left untouched).
 * Safe to run more than once.
 */
const { randomUUID } = require("crypto");

const ACTIONS = ["view", "write", "edit", "delete", "export"];
const MODULES = [
  "products", "inventory", "cart", "quotations", "customers", "orders",
  "purchase_orders", "field_guided_sheets", "vendors", "brands",
  "brand_parentcategories", "parentcategories", "categories", "keywords",
  "users", "teams", "roles", "permissions", "address", "jobs", "activity",
];

const CATALOGUE = ["products", "inventory", "brands", "brand_parentcategories",
  "parentcategories", "categories", "keywords"];

const DEFAULTS = {
  SALES: [
    ...CATALOGUE.map((m) => [m, "view"]),
    ["teams", "view"], ["vendors", "view"],
    ...["customers", "address", "quotations", "cart", "orders"].flatMap((m) =>
      ["view", "write", "edit"].map((a) => [m, a])),
    ["cart", "delete"], ["quotations", "export"],
  ],
  ACCOUNTS: [
    ...[...CATALOGUE, "orders", "quotations", "customers", "address",
      "purchase_orders", "field_guided_sheets", "vendors", "teams"].flatMap((m) =>
      [[m, "view"], [m, "export"]]),
    ["orders", "edit"], ["purchase_orders", "edit"],
  ],
};

module.exports = {
  async up(queryInterface) {
    const q = (sql, replacements) =>
      queryInterface.sequelize.query(sql, { replacements, type: sql.trim().startsWith("SELECT") ? "SELECT" : undefined });

    // 1. One row per module/action pair (reuse any existing row for the pair).
    for (const module of MODULES) {
      for (const api of ACTIONS) {
        const existing = await q(
          "SELECT permissionId FROM permissions WHERE module = ? AND api = ? LIMIT 1",
          [module, api],
        );
        if (existing.length) continue;
        let name = `${api}_${module}`;
        const taken = await q("SELECT 1 AS x FROM permissions WHERE name = ?", [name]);
        if (taken.length) name = `${name}__module`;
        await q(
          "INSERT INTO permissions (permissionId, name, module, api, route, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
          [randomUUID(), name, module, api, `/${module}`],
        );
      }
    }

    const grant = async (roleName, pairs) => {
      for (const [module, api] of pairs) {
        await q(
          `INSERT INTO rolepermissions (id, roleId, permissionId, createdAt, updatedAt)
           SELECT UUID(), r.roleId, p.permissionId, NOW(), NOW()
           FROM roles r JOIN permissions p ON p.module = ? AND p.api = ?
           WHERE r.roleName = ?
             AND NOT EXISTS (SELECT 1 FROM rolepermissions x WHERE x.roleId = r.roleId AND x.permissionId = p.permissionId)`,
          [module, api, roleName],
        );
      }
    };

    // 2. Admins get everything.
    const all = MODULES.flatMap((m) => ACTIONS.map((a) => [m, a]));
    await grant("ADMIN", all);
    await grant("DEVELOPER", all);

    // 3. Starting sets, only for roles that have nothing configured yet.
    for (const [roleName, pairs] of Object.entries(DEFAULTS)) {
      const [{ n }] = await q(
        `SELECT COUNT(*) AS n FROM rolepermissions rp JOIN roles r ON r.roleId = rp.roleId WHERE r.roleName = ?`,
        [roleName],
      );
      if (Number(n) === 0) await grant(roleName, pairs);
    }
  },

  async down() {
    // Permission rows are left in place: removing them could lock users out.
  },
};
