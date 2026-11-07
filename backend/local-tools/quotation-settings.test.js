const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const original = Module._load;
let saved;
const model = { findOne: async ({ where }) => ({ settings: { owner: where.userId } }), upsert: async value => { saved = value; } };
Module._load = function(name, parent, ...rest) {
  if (parent?.filename.endsWith('quotation-settings.controller.js')) {
    if (name === 'sequelize') return { DataTypes: { UUID: 'uuid', JSON: 'json', STRING: () => 'string' } };
    if (name === '../../config/database') return { define: () => model };
    if (name === '../../models') return { Quotation: { findByPk: async id => id === 'missing' ? null : {} } };
    if (name === '../settings/settings.service') return { getSetting: async () => ({ keyTerms: ['Payment due on delivery'] }) };
  }
  return original.call(this, name, parent, ...rest);
};
const { handle } = require('../modules/quotations/quotation-settings.controller');
Module._load = original;
async function request(method, body, id = 'quote') {
  const result = { statusCode: 200 };
  await handle({ method, body, params: { id }, query: { version: 'current' }, user: { userId: 'user-a' } }, {
    status(code) { result.statusCode = code; return this; }, json(data) { result.data = data; return this; },
  }, error => { throw error; });
  return result;
}
test('settings are scoped to the authenticated user and quotation version', async () => {
  assert.equal((await request('GET')).data.settings.owner, 'user-a');
  assert.deepEqual((await request('GET')).data.terms, ['Payment due on delivery']);
  const settings = { style: 'compact', cover: false, hidden: ['mrp'], pageLabels: ['First floor / Bath', 'Summary'] };
  assert.equal((await request('PUT', settings)).statusCode, 200);
  assert.deepEqual(saved, { quotationId: 'quote', userId: 'user-a', version: 'current', settings: { ...settings, boldTerms: [] } });
});

test('bold terms are saved, deduplicated and validated', async () => {
  const settings = { style: 'detailed', cover: true, hidden: [], pageLabels: null };
  assert.equal((await request('PUT', { ...settings, boldTerms: ['Payment due', 'Payment due'] })).statusCode, 200);
  assert.deepEqual(saved.settings.boldTerms, ['Payment due']);
  for (const boldTerms of ['all', [1], ['x'.repeat(10001)]]) {
    assert.equal((await request('PUT', { ...settings, boldTerms })).statusCode, 400);
  }
});
test('invalid fields, empty page selections and missing quotations are rejected', async () => {
  assert.equal((await request('PUT', { style: 'compact', cover: true, hidden: ['invalid'], pageLabels: null })).statusCode, 400);
  assert.equal((await request('PUT', { style: 'compact', cover: true, hidden: [], pageLabels: [] })).statusCode, 400);
  assert.equal((await request('GET', null, 'missing')).statusCode, 404);
});
