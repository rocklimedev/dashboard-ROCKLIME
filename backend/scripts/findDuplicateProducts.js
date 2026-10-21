const fs = require('node:fs/promises');
const path = require('node:path');
const {
  buildDateDuplicateReport,
  DEFAULT_DATE,
  DEFAULT_TIMEZONE,
} = require('../modules/operations/date-duplicate-report');
const { buildDuplicateReport } = require('../modules/operations/duplicate-report');

async function main() {
  const args = process.argv.slice(2);
  const option = (name, fallback) => {
    const index = args.indexOf(name);
    if (index < 0) return fallback;
    if (!args[index + 1] || args[index + 1].startsWith('--'))
      throw new Error(`Missing value for ${name}`);
    return args[index + 1];
  };
  const input = option('--input', null);
  const threshold = Number(option('--threshold', '0.9'));
  const dateOptions = {
    updatedOn: option('--updated-on', DEFAULT_DATE),
    timezone: option('--timezone', DEFAULT_TIMEZONE),
    timestampOffset: option('--timestamp-offset', '+00:00'),
  };
  // Reject invalid date options before connecting to the database.
  buildDateDuplicateReport({ exact: [], review: [] }, [], [], dateOptions);
  const output = path.resolve(
    option(
      '--output',
      path.join(
        __dirname,
        'json-outputs',
        'duplicate-products',
        new Date().toISOString().replace(/[:.]/g, '-'),
      ),
    ),
  );
  let snapshot;
  if (input)
    snapshot = JSON.parse((await fs.readFile(path.resolve(input), 'utf8')).replace(/^\uFEFF/, ''));
  else {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    const { Product, ProductMeta, sequelize } = require('../models');
    try {
      snapshot = await sequelize.transaction(
        { isolationLevel: 'REPEATABLE READ' },
        async (transaction) => ({
          products: await Product.findAll({ raw: true, transaction }),
          productMetas: await ProductMeta.findAll({ raw: true, transaction }),
        }),
      );
    } finally {
      await sequelize.close();
    }
  }
  const report = buildDuplicateReport(snapshot.products, snapshot.productMetas, threshold);
  const dateReport = buildDateDuplicateReport(
    report,
    snapshot.products,
    snapshot.productMetas,
    dateOptions,
  );
  report.summary.dateFocus = dateReport.summary;
  await fs.mkdir(output, { recursive: true });
  for (const [key, filename] of Object.entries({
    exact: 'exact-duplicates.json',
    review: 'differences-review.json',
    skipped: 'skipped-products.json',
    summary: 'summary.json',
  }))
    await fs.writeFile(path.join(output, filename), JSON.stringify(report[key], null, 2));
  for (const [key, filename] of Object.entries({
    updatedPairs: 'updated-on-date-duplicates.json',
    createdPairs: 'created-on-date-duplicates.json',
    matchedProducts: 'date-matched-products.json',
    invalidDates: 'missing-or-invalid-dates.json',
    summary: 'date-summary.json',
  }))
    await fs.writeFile(path.join(output, filename), JSON.stringify(dateReport[key], null, 2));
  console.log(JSON.stringify({ ...report.summary, output }, null, 2));
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
