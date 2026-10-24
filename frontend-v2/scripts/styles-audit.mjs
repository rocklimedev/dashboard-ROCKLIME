import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import postcss from 'postcss';

const files = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );
const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'comments', 'extra'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
};
const result = [];
for (const file of files('src').filter((name) => /\.(css|jsx?|tsx?)$/.test(name))) {
  const source = fs.readFileSync(file, 'utf8');
  const row = {
    file: file.replaceAll('\\', '/'),
    group: file.includes(`${path.sep}assets${path.sep}`)
      ? 'legacy-assets'
      : file.endsWith('tokens.css')
        ? 'tokens'
        : 'application',
    inlineStyleObjects: 0,
    embeddedStyleElements: 0,
    styledTemplates: 0,
    hardcodedFontSizes: 0,
    importantRules: 0,
    hexColors: [...new Set(source.match(/#[\da-fA-F]{3,8}\b/g) ?? [])].sort(),
  };
  if (file.endsWith('.css')) {
    postcss.parse(source).walkDecls((decl) => {
      if (decl.important) row.importantRules++;
      if (decl.prop === 'font-size' && !decl.value.includes('var(')) row.hardcodedFontSizes++;
    });
  } else {
    walk(parse(source, { sourceType: 'module', plugins: ['jsx', 'typescript'] }), (node) => {
      if (
        node.type === 'JSXAttribute' &&
        node.name.name === 'style' &&
        node.value?.expression?.type === 'ObjectExpression'
      )
        row.inlineStyleObjects++;
      if (node.type === 'JSXOpeningElement' && node.name.name === 'style')
        row.embeddedStyleElements++;
      if (
        node.type === 'TaggedTemplateExpression' &&
        source.slice(node.tag.start, node.tag.end).startsWith('styled') &&
        node.quasi.quasis.some((part) => part.value.raw.trim())
      )
        row.styledTemplates++;
      if (
        node.type === 'ObjectProperty' &&
        (node.key.name ?? node.key.value) === 'fontSize' &&
        ['NumericLiteral', 'StringLiteral'].includes(node.value.type)
      )
        row.hardcodedFontSizes++;
    });
  }
  if (
    row.inlineStyleObjects ||
    row.embeddedStyleElements ||
    row.styledTemplates ||
    row.hardcodedFontSizes ||
    row.importantRules ||
    row.hexColors.length
  )
    result.push(row);
}
const totals = {};
for (const group of ['application', 'tokens', 'legacy-assets']) {
  const rows = result.filter((row) => row.group === group);
  totals[group] = Object.fromEntries(
    [
      'inlineStyleObjects',
      'embeddedStyleElements',
      'styledTemplates',
      'hardcodedFontSizes',
      'importantRules',
    ].map((key) => [key, rows.reduce((sum, row) => sum + row[key], 0)]),
  );
  totals[group].distinctHexColors = new Set(rows.flatMap((row) => row.hexColors)).size;
}
console.log(JSON.stringify({ totals, files: result }, null, 2));
