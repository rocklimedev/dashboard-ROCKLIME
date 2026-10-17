// Creates tables that exist only as Sequelize models in the code (never by a migration).
// Never alters an existing table — it only reports missing columns.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
process.chdir(path.join(__dirname, ".."));
const models = require("../models");
const { sequelize } = models;

(async () => {
  await sequelize.authenticate();
  const qi = sequelize.getQueryInterface();
  const existing = new Set((await qi.showAllTables()).map((t) => (typeof t === "string" ? t : t.tableName)));
  let created = 0, warnings = 0;
  for (const [name, model] of Object.entries(models)) {
    if (!model || typeof model.getTableName !== "function") continue;
    const table = model.getTableName();
    const tname = typeof table === "string" ? table : table.tableName;
    if (!existing.has(tname)) {
      try {
        await model.sync();
        console.log(`+ created table ${tname} (model ${name})`);
      } catch (e) {
        // errno 150 (bad foreign key): create without DB-level links
        console.warn(`  ${tname}: ${e.message} — retrying without foreign keys`);
        const attrs = {};
        for (const [k, a] of Object.entries(model.rawAttributes)) { const c = { ...a }; delete c.references; attrs[k] = c; }
        await qi.createTable(tname, attrs);
        console.log(`+ created table ${tname} (no FK constraints)`);
      }
      created++;
      continue;
    }
    const cols = await qi.describeTable(tname);
    for (const a of Object.values(model.rawAttributes)) {
      if (a.type && a.type.key === "VIRTUAL") continue;
      if (!cols[a.field]) { console.warn(`  ! ${tname}.${a.field} is in the model but not in the database`); warnings++; }
    }
  }
  console.log(`Done. ${created} table(s) created, ${warnings} column warning(s).`);
  await sequelize.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
