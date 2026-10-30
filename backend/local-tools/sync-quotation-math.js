const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../lib/quotationMath.js'), 'utf8');
// Only the module wrapper differs: the executable maths is copied byte for byte.
const generated = source.replace('module.exports = {', 'export {');
const target = path.join(__dirname, '../../frontend-v2/src/utils/quotationMath.js');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(target, 'utf8') !== generated)
    throw new Error('Run node local-tools/sync-quotation-math.js');
} else fs.writeFileSync(target, generated);
