const assert = require('node:assert/strict');
const fs = require('node:fs');
const parser = require('../frontend/node_modules/@babel/parser');

function find(node, name) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'VariableDeclarator' && node.id.name === name) return node.init;
  for (const value of Object.values(node)) {
    for (const child of Array.isArray(value) ? value : [value]) {
      const result = find(child, name);
      if (result) return result;
    }
  }
}

for (const folder of ['frontend', 'frontend-v2']) {
  const source = fs.readFileSync(`${folder}/src/components/Quotation/QuotationProductSheet.jsx`, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const callback = (name) => {
    const init = find(ast, name);
    const fn = init.type === 'CallExpression' ? init.arguments[0] : init;
    return source.slice(fn.start, fn.end);
  };
  const locationKey = (loc) => `${loc?.floorId || ''}::${loc?.roomId || ''}`;
  const sectionKey = (floor, room) => floor && room ? `${floor}::${room}` : '__unassigned__';
  let formData = { products: [
    { productId: 'a', qty: 3, priority: 7, locations: [
      { floorId: 'f', roomId: 'r1', assignedQuantity: 1, priority: 0 },
      { floorId: 'f', roomId: 'r2', assignedQuantity: 2, priority: 1 },
    ] },
    { productId: 'b', qty: 1, priority: 8, locations: [
      { floorId: 'f', roomId: 'r1', assignedQuantity: 1, priority: 1 },
    ] },
    { productId: 'legacy', qty: 2, priority: 9, floorId: 'bare' },
    { productId: 'unassigned', qty: 1, priority: 0 },
  ] };
  const setFormData = (update) => { formData = update(formData); };
  const group = () => Function('formData', 'sectionKey', 'locationKey', `return (${callback('productsBySection')})();`)(formData, sectionKey, locationKey);
  const reorder = Function('setFormData', 'locationKey', `return (${callback('reorderSection')});`)(setFormData, locationKey);
  reorder([...group()['f::r1']].reverse());
  assert.deepEqual(group()['f::r1'].map(p => p.productId), ['b', 'a']);
  assert.equal(formData.products[0].locations[1].priority, 1, 'other room must keep its priority');
  assert.equal(formData.products[0].priority, 7, 'split product priority must remain independent');
  reorder([...group().__unassigned__].reverse());
  assert.deepEqual(group().__unassigned__.map(p => p.productId), ['legacy', 'unassigned']);
  assert.equal(formData.products[2].locations[0].assignedQuantity, 2);
  // The saved locations must retain the same priorities after reopening.
  formData = JSON.parse(JSON.stringify(formData));
  assert.deepEqual(group()['f::r1'].map(p => p.productId), ['b', 'a']);
  parser.parse(fs.readFileSync(`${folder}/src/concepts/Quotation/AddQuntation.jsx`, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  console.log(`${folder}: quotation priority regression checks passed`);
}
