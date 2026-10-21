// Applies every file in backend/migrations in name (date) order and records it in SequelizeMeta.
// Safe to re-run. If a migration's change is already in the imported dump
// (table/column/index already exists) it is recorded as applied instead of failing.
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('./_db');
const ALREADY = new Set(['ER_TABLE_EXISTS_ERROR', 'ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME']);

(async () => {
  const qi = sequelize.getQueryInterface();
  await sequelize.query(
    'CREATE TABLE IF NOT EXISTS `SequelizeMeta` (`name` varchar(255) NOT NULL PRIMARY KEY) ENGINE=InnoDB',
  );
  const [rows] = await sequelize.query('SELECT name FROM `SequelizeMeta`');
  const done = new Set(rows.map((r) => r.name));
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .sort();
  let failed = 0;
  for (const f of files) {
    if (done.has(f)) {
      console.log(`= ${f} (already applied)`);
      continue;
    }
    const m = require(path.join(dir, f));
    try {
      await m.up(qi, Sequelize.DataTypes);
      console.log(`+ ${f} applied`);
    } catch (e) {
      const code = e.original?.code || e.parent?.code;
      if (ALREADY.has(code)) {
        console.log(`~ ${f} already present in imported database (${code}) — recorded`);
      } else {
        console.error(`! ${f} FAILED: ${e.message}`);
        failed++;
        continue;
      }
    }
    await sequelize.query('INSERT IGNORE INTO `SequelizeMeta` (name) VALUES (?)', {
      replacements: [f],
    });
  }
  await sequelize.close();
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
